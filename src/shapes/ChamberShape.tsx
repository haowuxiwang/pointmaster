import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'
import { cuboidPath, cylinderPath } from './utils'
import { project3Dto2D, CHAMBER_SCALE } from '@/core/projection/isometric'
import type { Chamber, RoomContext } from '@/types'

type ChamberShape = TLBaseShape<'chamber', {
  w: number
  h: number
  chamberData: Chamber
}>

// Track editing values across renders (keyed by shape ID)
const editingValues = new Map<string, string>()

function renderRoomContext(roomCtx: RoomContext, scale: number) {
  const { roomDimensions, offset, devices, doors } = roomCtx
  const p = (x: number, y: number, z: number) => project3Dto2D(x, y, z, scale)

  // Room outline vertices
  const ox = offset.x, oy = offset.y, oz = offset.z
  const rw = roomDimensions.width, rd = roomDimensions.depth, rh = roomDimensions.height
  const rv = [
    p(ox, oy, oz), p(ox + rw, oy, oz), p(ox + rw, oy + rd, oz), p(ox, oy + rd, oz),
    p(ox, oy, oz + rh), p(ox + rw, oy, oz + rh), p(ox + rw, oy + rd, oz + rh), p(ox, oy + rd, oz + rh),
  ]
  const roomEdges = [
    [rv[0], rv[1]], [rv[1], rv[2]], [rv[2], rv[3]], [rv[3], rv[0]],
    [rv[4], rv[5]], [rv[5], rv[6]], [rv[6], rv[7]], [rv[7], rv[4]],
    [rv[0], rv[4]], [rv[1], rv[5]], [rv[2], rv[6]], [rv[3], rv[7]],
  ]
  const roomPath = roomEdges.map(([a, b]) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`).join(' ')

  // Other devices (e.g. AC unit)
  const devicePaths = devices.map(dev => {
    const dx = dev.position.x, dy = dev.position.y, dz = dev.position.z
    const dw = dev.dimensions.width, dd = dev.dimensions.depth, dh = dev.dimensions.height
    const dv = [
      p(dx, dy, dz), p(dx + dw, dy, dz), p(dx + dw, dy + dd, dz), p(dx, dy + dd, dz),
      p(dx, dy, dz + dh), p(dx + dw, dy, dz + dh), p(dx + dw, dy + dd, dz + dh), p(dx, dy + dd, dz + dh),
    ]
    // Only render visible faces (top, front, right)
    const topPath = `M ${dv[4].x} ${dv[4].y} L ${dv[5].x} ${dv[5].y} L ${dv[6].x} ${dv[6].y} L ${dv[7].x} ${dv[7].y} Z`
    const frontPath = `M ${dv[0].x} ${dv[0].y} L ${dv[1].x} ${dv[1].y} L ${dv[5].x} ${dv[5].y} L ${dv[4].x} ${dv[4].y} Z`
    const rightPath = `M ${dv[1].x} ${dv[1].y} L ${dv[2].x} ${dv[2].y} L ${dv[6].x} ${dv[6].y} L ${dv[5].x} ${dv[5].y} Z`
    const edges = [
      [dv[0], dv[1]], [dv[1], dv[2]], [dv[2], dv[3]], [dv[3], dv[0]],
      [dv[4], dv[5]], [dv[5], dv[6]], [dv[6], dv[7]], [dv[7], dv[4]],
      [dv[0], dv[4]], [dv[1], dv[5]], [dv[2], dv[6]], [dv[3], dv[7]],
    ]
    const edgesPath = edges.map(([a, b]) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`).join(' ')
    // Label position: top center of device
    const labelX = (dv[4].x + dv[6].x) / 2
    const labelY = (dv[4].y + dv[6].y) / 2 - 8
    return { topPath, frontPath, rightPath, edgesPath, labelX, labelY, name: dev.name }
  })

  // Door markers
  const doorMarkers = doors.map(door => {
    const dp = p(door.position.x, door.position.y, door.position.z)
    return { x: dp.x, y: dp.y, label: door.label ?? '门' }
  })

  return { roomPath, devicePaths, doorMarkers }
}

export class ChamberShapeUtil extends ShapeUtil<ChamberShape> {
  static type = 'chamber' as const

  static props = {
    w: T.number,
    h: T.number,
    chamberData: T.any as T.Validator<Chamber>,
  }

  override canEdit() {
    return true
  }

  override onEditEnd(shape: ChamberShape) {
    const val = editingValues.get(shape.id)
    editingValues.delete(shape.id)
    if (val !== undefined && val !== shape.props.chamberData.name) {
      this.editor.updateShape<ChamberShape>({
        id: shape.id,
        type: 'chamber',
        props: { chamberData: { ...shape.props.chamberData, name: val } },
      })
    }
  }

  getDefaultProps(): ChamberShape['props'] {
    return {
      w: 800,
      h: 600,
      chamberData: {
        type: 'cuboid',
        name: 'chamber',
        dimensions: { width: 1000, depth: 600, height: 800 },
      },
    }
  }

  getGeometry(shape: ChamberShape) {
    const { chamberData } = shape.props
    const { width, depth, height } = chamberData.dimensions
    const p = (x: number, y: number, z: number) => project3Dto2D(x, y, z, CHAMBER_SCALE)

    // Collect all vertices: main chamber + room context
    const allPoints: Array<{ x: number; y: number }> = []

    // Main chamber vertices
    allPoints.push(
      p(0, 0, 0), p(width, 0, 0), p(width, depth, 0), p(0, depth, 0),
      p(0, 0, height), p(width, 0, height), p(width, depth, height), p(0, depth, height),
    )

    // Room context vertices (room outline + devices)
    if (chamberData.roomContext) {
      const rc = chamberData.roomContext
      const ox = rc.offset.x, oy = rc.offset.y, oz = rc.offset.z
      const rw = rc.roomDimensions.width, rd = rc.roomDimensions.depth, rh = rc.roomDimensions.height
      allPoints.push(
        p(ox, oy, oz), p(ox + rw, oy, oz), p(ox + rw, oy + rd, oz), p(ox, oy + rd, oz),
        p(ox, oy, oz + rh), p(ox + rw, oy, oz + rh), p(ox + rw, oy + rd, oz + rh), p(ox, oy + rd, oz + rh),
      )
      for (const dev of rc.devices) {
        const dx = dev.position.x, dy = dev.position.y, dz = dev.position.z
        const dw = dev.dimensions.width, dd = dev.dimensions.depth, dh = dev.dimensions.height
        allPoints.push(
          p(dx, dy, dz), p(dx + dw, dy, dz), p(dx + dw, dy + dd, dz), p(dx, dy + dd, dz),
          p(dx, dy, dz + dh), p(dx + dw, dy, dz + dh), p(dx + dw, dy + dd, dz + dh), p(dx, dy + dd, dz + dh),
        )
      }
    }

    const xs = allPoints.map(v => v.x)
    const ys = allPoints.map(v => v.y)
    const minX = Math.min(...xs) - 20
    const minY = Math.min(...ys) - 30
    const maxX = Math.max(...xs) + 20
    const maxY = Math.max(...ys) + 20
    return new Rectangle2d({
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      isFilled: true,
    })
  }

  component(shape: ChamberShape) {
    const { chamberData } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const { type, dimensions } = chamberData
    const { width, depth, height, layers = 1 } = dimensions

    let faces: { path: string; fill: string }[] = []
    let edgesPath: string = ''
    let layerPath: string = ''
    let detailsPath: string = ''
    let headPath: string = ''
    let supportsPath: string = ''
    let nozzlesPath: string = ''
    let nozzleLabels: Array<{ x: number; y: number; name: string }> = []
    let coilPath: string = ''
    let frontFill: string = ''
    let topFill: string = ''
    let bottomBackArc: string = ''
    let bottomFrontArc: string = ''
    let sideLines: string = ''
    let topEllipse: string = ''
    let isCylinder = false

    if (type === 'cylinder') {
      isCylinder = true
      const radius = chamberData.radius ?? Math.min(width, depth) / 2
      const result = cylinderPath(radius, height, 0.2, layers, chamberData.nozzles, chamberData.hasCoil)
      topEllipse = result.topEllipse
      bottomBackArc = result.bottomBackArc
      bottomFrontArc = result.bottomFrontArc
      sideLines = result.sideLines
      frontFill = result.frontFill
      topFill = result.topFill
      layerPath = result.layers
      headPath = result.headPath
      supportsPath = result.supportsPath
      nozzlesPath = result.nozzlesPath
      nozzleLabels = result.nozzleLabels
      coilPath = result.coilPath
    } else if (type === 'polygon' && chamberData.vertices) {
      const result = cuboidPath(width, depth, height, 0.2, layers)
      faces = result.faces
      edgesPath = result.edges
      layerPath = result.layers
    } else {
      const result = cuboidPath(width, depth, height, 0.2, layers)
      faces = result.faces
      edgesPath = result.edges
      layerPath = result.layers
    }

    const nameElement = isEditing ? (
      <foreignObject x={-60} y={-26} width={120} height={20}>
        <input
          autoFocus
          defaultValue={chamberData.name}
          style={{
            width: '100%',
            fontSize: '12px',
            color: '#000',
            border: '1px solid #000',
            borderRadius: '2px',
            padding: '1px 2px',
            outline: 'none',
            background: 'white',
            textAlign: 'center',
          }}
          onInput={(e) => {
            editingValues.set(shape.id, (e.target as HTMLInputElement).value)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const val = editingValues.get(shape.id) ?? chamberData.name
              editingValues.delete(shape.id)
              if (val !== chamberData.name) {
                this.editor.updateShape<ChamberShape>({
                  id: shape.id,
                  type: 'chamber',
                  props: { chamberData: { ...shape.props.chamberData, name: val } },
                })
              }
              this.editor.setEditingShape(null)
            }
            if (e.key === 'Escape') {
              editingValues.delete(shape.id)
              this.editor.setEditingShape(null)
            }
          }}
        />
      </foreignObject>
    ) : (
      <text x={0} y={-10} fontSize={12} fill="#000" textAnchor="middle">
        {chamberData.name}
      </text>
    )

    if (isCylinder) {
      return (
        <SVGContainer>
          <defs>
            <linearGradient id="cylinderBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d8d8d8" />
              <stop offset="35%" stopColor="#f0f0f0" />
              <stop offset="65%" stopColor="#e0e0e0" />
              <stop offset="100%" stopColor="#b8b8b8" />
            </linearGradient>
            <linearGradient id="cylinderTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f5f5" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>

          {/* Back half of bottom ellipse (hidden line) */}
          <path d={bottomBackArc} fill="none" stroke="#999" strokeWidth={0.8} strokeDasharray="4 2" />

          {/* Front face fill (curved body) */}
          <path d={frontFill} fill="url(#cylinderBody)" stroke="none" />

          {/* Top face fill */}
          <path d={topFill} fill="url(#cylinderTop)" stroke="none" />

          {/* Layer ellipses */}
          {layerPath && (
            <path d={layerPath} fill="none" stroke="#999" strokeWidth={1.5} strokeDasharray="6 3" />
          )}

          {/* Front half of bottom ellipse */}
          <path d={bottomFrontArc} fill="none" stroke="#000" strokeWidth={1.2} />

          {/* Top ellipse */}
          <path d={topEllipse} fill="none" stroke="#000" strokeWidth={1.2} />

          {/* Side silhouette lines */}
          <path d={sideLines} fill="none" stroke="#000" strokeWidth={1} />

          {/* Dished head */}
          {headPath && (
            <path d={headPath} fill="none" stroke="#555" strokeWidth={0.8} />
          )}

          {/* Support legs */}
          {supportsPath && (
            <path d={supportsPath} fill="none" stroke="#555" strokeWidth={0.8} />
          )}

          {/* Nozzles */}
          {nozzlesPath && (
            <path d={nozzlesPath} fill="none" stroke="#555" strokeWidth={0.8} />
          )}

          {/* Coil */}
          {coilPath && (
            <path d={coilPath} fill="none" stroke="#aaa" strokeWidth={0.6} strokeDasharray="3 2" />
          )}

          {/* Nozzle labels */}
          {nozzleLabels.map((nl, i) => (
            <text key={i} x={nl.x} y={nl.y - 8} fontSize={8} fill="#555" textAnchor="middle">
              {nl.name}
            </text>
          ))}

          {nameElement}
        </SVGContainer>
      )
    }

    return (
      <SVGContainer>
        {/* Room context (visual decoration, semi-transparent) */}
        {chamberData.roomContext && (() => {
          const ctx = renderRoomContext(chamberData.roomContext, CHAMBER_SCALE)
          return (
            <g opacity={0.35}>
              {/* Room outline - dashed */}
              <path d={ctx.roomPath} fill="none" stroke="#666" strokeWidth={0.8} strokeDasharray="6 3" />
              {/* Other devices */}
              {ctx.devicePaths.map((dp, i) => (
                <g key={`dev-${i}`}>
                  <path d={dp.topPath} fill="#e8e8e8" stroke="none" />
                  <path d={dp.frontPath} fill="#d0d0d0" stroke="none" />
                  <path d={dp.rightPath} fill="#bbb" stroke="none" />
                  <path d={dp.edgesPath} fill="none" stroke="#888" strokeWidth={0.6} />
                  <text x={dp.labelX} y={dp.labelY} fontSize={9} fill="#666" textAnchor="middle">{dp.name}</text>
                </g>
              ))}
              {/* Door markers */}
              {ctx.doorMarkers.map((dm, i) => (
                <text key={`door-${i}`} x={dm.x} y={dm.y - 12} fontSize={10} fill="#c44" textAnchor="middle" fontWeight="bold">
                  {dm.label}
                </text>
              ))}
            </g>
          )
        })()}
        {/* Face fills */}
        {faces.map((face, i) => (
          <path key={i} d={face.path} fill={face.fill} stroke="none" />
        ))}
        {/* Layer lines */}
        {layerPath && (
          <path
            d={layerPath}
            fill="none"
            stroke="#999"
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
        )}
        {/* Edges */}
        <path
          d={edgesPath}
          fill="none"
          stroke="#000"
          strokeWidth={1}
          strokeLinejoin="round"
        />
        {/* Details (head, supports, nozzles) */}
        {detailsPath && (
          <path
            d={detailsPath}
            fill="none"
            stroke="#555"
            strokeWidth={0.8}
          />
        )}
        {nameElement}
      </SVGContainer>
    )
  }

  toSvg(shape: ChamberShape) {
    const { chamberData } = shape.props
    const { type, dimensions } = chamberData
    const { width, depth, height, layers = 1 } = dimensions

    if (type === 'cylinder') {
      const radius = chamberData.radius ?? Math.min(width, depth) / 2
      const result = cylinderPath(radius, height, 0.2, layers, chamberData.nozzles, chamberData.hasCoil)

      return (
        <g>
          <defs>
            <linearGradient id="cylinderBody" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#d8d8d8" />
              <stop offset="35%" stopColor="#f0f0f0" />
              <stop offset="65%" stopColor="#e0e0e0" />
              <stop offset="100%" stopColor="#b8b8b8" />
            </linearGradient>
            <linearGradient id="cylinderTop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f5f5f5" />
              <stop offset="100%" stopColor="#e0e0e0" />
            </linearGradient>
          </defs>
          <path d={result.bottomBackArc} fill="none" stroke="#999" strokeWidth={0.8} strokeDasharray="4 2" />
          <path d={result.frontFill} fill="url(#cylinderBody)" stroke="none" />
          <path d={result.topFill} fill="url(#cylinderTop)" stroke="none" />
          {result.layers && <path d={result.layers} fill="none" stroke="#999" strokeWidth={1.5} strokeDasharray="6 3" />}
          <path d={result.bottomFrontArc} fill="none" stroke="#000" strokeWidth={1.2} />
          <path d={result.topEllipse} fill="none" stroke="#000" strokeWidth={1.2} />
          <path d={result.sideLines} fill="none" stroke="#000" strokeWidth={1} />
          {result.headPath && <path d={result.headPath} fill="none" stroke="#555" strokeWidth={0.8} />}
          {result.supportsPath && <path d={result.supportsPath} fill="none" stroke="#555" strokeWidth={0.8} />}
          {result.nozzlesPath && <path d={result.nozzlesPath} fill="none" stroke="#555" strokeWidth={0.8} />}
          {result.coilPath && <path d={result.coilPath} fill="none" stroke="#aaa" strokeWidth={0.6} strokeDasharray="3 2" />}
          {result.nozzleLabels.map((nl, i) => (
            <text key={i} x={nl.x} y={nl.y - 8} fontSize={8} fill="#555" textAnchor="middle">{nl.name}</text>
          ))}
          <text x={0} y={-10} fontSize={12} fill="#000" textAnchor="middle">{chamberData.name}</text>
        </g>
      )
    }

    const result = cuboidPath(width, depth, height, 0.2, layers)

    return (
      <g>
        {/* Room context for SVG export */}
        {chamberData.roomContext && (() => {
          const ctx = renderRoomContext(chamberData.roomContext, 0.2)
          return (
            <g opacity={0.35}>
              <path d={ctx.roomPath} fill="none" stroke="#666" strokeWidth={0.8} strokeDasharray="6 3" />
              {ctx.devicePaths.map((dp, i) => (
                <g key={`dev-${i}`}>
                  <path d={dp.topPath} fill="#e8e8e8" stroke="none" />
                  <path d={dp.frontPath} fill="#d0d0d0" stroke="none" />
                  <path d={dp.rightPath} fill="#bbb" stroke="none" />
                  <path d={dp.edgesPath} fill="none" stroke="#888" strokeWidth={0.6} />
                  <text x={dp.labelX} y={dp.labelY} fontSize={9} fill="#666" textAnchor="middle">{dp.name}</text>
                </g>
              ))}
              {ctx.doorMarkers.map((dm, i) => (
                <text key={`door-${i}`} x={dm.x} y={dm.y - 12} fontSize={10} fill="#c44" textAnchor="middle" fontWeight="bold">
                  {dm.label}
                </text>
              ))}
            </g>
          )
        })()}
        {result.faces.map((face, i) => (
          <path key={i} d={face.path} fill={face.fill} stroke="none" />
        ))}
        {result.layers && <path d={result.layers} fill="none" stroke="#999" strokeWidth={1.5} strokeDasharray="6 3" />}
        <path d={result.edges} fill="none" stroke="#000" strokeWidth={1} strokeLinejoin="round" />
        <text x={0} y={-10} fontSize={12} fill="#000" textAnchor="middle">{chamberData.name}</text>
      </g>
    )
  }

  getIndicatorPath(_shape: ChamberShape) {
    return undefined
  }
}
