import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'
import { cuboidPath, cylinderPath } from './utils'
import { project3Dto2D, CHAMBER_SCALE, CYLINDER_COMPRESSION, projections } from '@/core/projection/isometric'
import { useProjectStore } from '@/store/projectStore'
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

  // Other devices (e.g. AC unit) - wireframe cuboid
  const devicePaths = devices.map(dev => {
    const dx = dev.position.x, dy = dev.position.y, dz = dev.position.z
    const dw = dev.dimensions.width, dd = dev.dimensions.depth, dh = dev.dimensions.height
    const dv = [
      p(dx, dy, dz), p(dx + dw, dy, dz), p(dx + dw, dy + dd, dz), p(dx, dy + dd, dz),
      p(dx, dy, dz + dh), p(dx + dw, dy, dz + dh), p(dx + dw, dy + dd, dz + dh), p(dx, dy + dd, dz + dh),
    ]
    const edges = [
      [dv[0], dv[1]], [dv[1], dv[2]], [dv[2], dv[3]], [dv[3], dv[0]],
      [dv[4], dv[5]], [dv[5], dv[6]], [dv[6], dv[7]], [dv[7], dv[4]],
      [dv[0], dv[4]], [dv[1], dv[5]], [dv[2], dv[6]], [dv[3], dv[7]],
    ]
    const edgesPath = edges.map(([a, b]) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`).join(' ')
    // Label position: top center of device
    const labelX = (dv[4].x + dv[6].x) / 2
    const labelY = (dv[4].y + dv[6].y) / 2 - 8
    return { edgesPath, labelX, labelY, name: dev.name }
  })

  // Door markers - render as rectangle with label
  const doorWidth = 800 // mm
  const doorHeight = 2000 // mm
  const doorMarkers = doors.map(door => {
    const dp = p(door.position.x, door.position.y, door.position.z)
    // Project door dimensions for rectangle
    const doorRight = p(door.position.x + doorWidth, door.position.y, door.position.z)
    const doorTop = p(door.position.x, door.position.y, door.position.z + doorHeight)
    const doorTopRight = p(door.position.x + doorWidth, door.position.y, door.position.z + doorHeight)
    const doorRect = `M ${dp.x} ${dp.y} L ${doorRight.x} ${doorRight.y} L ${doorTopRight.x} ${doorTopRight.y} L ${doorTop.x} ${doorTop.y} Z`
    return { x: dp.x, y: dp.y, label: door.label ?? '门', doorRect }
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
    const { type, dimensions } = chamberData
    const { width, depth, height } = dimensions
    // Use current view's projection for bounds (avoids mismatch in front view)
    const viewMode = useProjectStore.getState().viewMode
    const proj = projections[viewMode] ?? projections.isometric
    const p = (x: number, y: number, z: number) => proj.project(x, y, z, CHAMBER_SCALE)

    if (type === 'cylinder') {
      // 2D front view bounds
      const radius = chamberData.radius ?? Math.min(width, depth) / 2
      const r = radius * CHAMBER_SCALE
      const h = height * CHAMBER_SCALE
      const ry = r * CYLINDER_COMPRESSION
      const stubLength = 15 * CHAMBER_SCALE  // matches cylinderPath
      const stubHalf = 4 * CHAMBER_SCALE     // flange half-width
      const headHeight = r * 0.3
      const supportHeight = 50 * CHAMBER_SCALE
      // Agitator shaft extends above top
      const agitatorTop = -h - h * 0.15
      // Nozzle label offset (worst case: labelOffset + stubHalf)
      const nozzleLabelExtent = 4 * CHAMBER_SCALE + stubHalf + 2 * CHAMBER_SCALE

      const minX = -(r + stubLength + stubHalf + nozzleLabelExtent)
      const maxX = r + stubLength + stubHalf + nozzleLabelExtent
      const minY = Math.min(agitatorTop, -h - headHeight - ry) - 15
      const maxY = supportHeight + 10

      return new Rectangle2d({
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        isFilled: false,
      })
    }

    // Cuboid: use 3D isometric projection for bounds
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
    // Subscribe to viewMode for projection + hidden line updates
    const viewMode = useProjectStore((s) => s.viewMode)
    const projection = projections[viewMode]

    let layerPath: string = ''
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
    let radius = 0
    let visibleEdgesPath = ''
    let hiddenEdgesPath = ''

    if (type === 'cylinder') {
      isCylinder = true
      radius = chamberData.radius ?? Math.min(width, depth) / 2
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
    } else {
      // Cuboid (and polygon fallback): compute wireframe with current view's camera direction
      const result = cuboidPath(width, depth, height, 0.2, layers, projection.cameraDir)
      layerPath = result.layers
      visibleEdgesPath = result.visibleEdges
      hiddenEdgesPath = result.hiddenEdges
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
              e.preventDefault()
              e.stopPropagation()
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
              e.preventDefault()
              e.stopPropagation()
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
      // 2D front view agitator: vertical shaft + impeller blades
      const r = radius * 0.2
      const h = height * 0.2
      const shaftPath = `M 0 ${h * 0.05} L 0 ${-h - h * 0.15}`
      const bladeWidth = r * 0.5
      const bladeHeight = 3
      // Two sets of impeller blades at different heights
      const bladeZ1 = -h * 0.4
      const bladeZ2 = -h * 0.7
      const bladesPath = [
        `M ${-bladeWidth} ${bladeZ1 - bladeHeight} L ${bladeWidth} ${bladeZ1 - bladeHeight} L ${bladeWidth} ${bladeZ1 + bladeHeight} L ${-bladeWidth} ${bladeZ1 + bladeHeight} Z`,
        `M ${-bladeWidth} ${bladeZ2 - bladeHeight} L ${bladeWidth} ${bladeZ2 - bladeHeight} L ${bladeWidth} ${bladeZ2 + bladeHeight} L ${-bladeWidth} ${bladeZ2 + bladeHeight} Z`,
      ].join(' ')

      return (
        <SVGContainer>
          {/* Back half of bottom ellipse (hidden line) */}
          <path d={bottomBackArc} fill="none" stroke="#999" strokeWidth={0.8} strokeDasharray="4 2" />

          {/* Front face fill (white, hides back lines) */}
          <path d={frontFill} fill="#fff" stroke="none" />

          {/* Top face fill (white) */}
          <path d={topFill} fill="#fff" stroke="none" />

          {/* Layer ellipses (dashed) */}
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
            <path d={headPath} fill="none" stroke="#000" strokeWidth={1} />
          )}

          {/* Support legs */}
          {supportsPath && (
            <path d={supportsPath} fill="none" stroke="#000" strokeWidth={0.8} />
          )}

          {/* Agitator shaft */}
          <path d={shaftPath} fill="none" stroke="#000" strokeWidth={0.8} />

          {/* Agitator impeller blades */}
          <path d={bladesPath} fill="none" stroke="#000" strokeWidth={0.6} />

          {/* Nozzles */}
          {nozzlesPath && (
            <path d={nozzlesPath} fill="none" stroke="#000" strokeWidth={0.8} />
          )}

          {/* Coil (dashed internal ellipses) */}
          {coilPath && (
            <path d={coilPath} fill="none" stroke="#999" strokeWidth={0.6} strokeDasharray="3 2" />
          )}

          {/* Nozzle labels */}
          {nozzleLabels.map((nl, i) => (
            <text key={i} x={nl.x} y={nl.y} fontSize={8} fill="#000" textAnchor="middle">
              {nl.name}
            </text>
          ))}

          {nameElement}
        </SVGContainer>
      )
    }

    return (
      <SVGContainer>
        {/* Room context (wireframe, solid lines) */}
        {chamberData.roomContext && (() => {
          const ctx = renderRoomContext(chamberData.roomContext, CHAMBER_SCALE)
          return (
            <g>
              {/* Room outline - solid */}
              <path d={ctx.roomPath} fill="none" stroke="#000" strokeWidth={1.0} />
              {/* Other devices - wireframe edges only */}
              {ctx.devicePaths.map((dp, i) => (
                <g key={`dev-${i}`}>
                  <path d={dp.edgesPath} fill="none" stroke="#333" strokeWidth={0.8} />
                  <text x={dp.labelX} y={dp.labelY} fontSize={10} fill="#000" textAnchor="middle">{dp.name}</text>
                </g>
              ))}
              {/* Door markers - rectangle + label */}
              {ctx.doorMarkers.map((dm, i) => (
                <g key={`door-${i}`}>
                  <path d={dm.doorRect} fill="none" stroke="#000" strokeWidth={1.0} />
                  <text x={dm.x} y={dm.y - 6} fontSize={10} fill="#000" textAnchor="middle" fontWeight="bold">
                    {dm.label}
                  </text>
                </g>
              ))}
            </g>
          )
        })()}
        {/* Layer lines (dashed) */}
        {layerPath && (
          <path
            d={layerPath}
            fill="none"
            stroke="#999"
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
        )}
        {/* Hidden edges (dashed) */}
        {hiddenEdgesPath && (
          <path
            d={hiddenEdgesPath}
            fill="none"
            stroke="#000"
            strokeWidth={0.7}
            strokeDasharray="4 3"
          />
        )}
        {/* Visible edges (solid) */}
        {visibleEdgesPath && (
          <path
            d={visibleEdgesPath}
            fill="none"
            stroke="#000"
            strokeWidth={1.2}
            strokeLinejoin="round"
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
      const r = radius * 0.2
      const h = height * 0.2
      const shaftPath = `M 0 ${h * 0.05} L 0 ${-h - h * 0.15}`
      const bladeWidth = r * 0.5
      const bladeHeight = 3
      const bladeZ1 = -h * 0.4
      const bladeZ2 = -h * 0.7
      const bladesPath = [
        `M ${-bladeWidth} ${bladeZ1 - bladeHeight} L ${bladeWidth} ${bladeZ1 - bladeHeight} L ${bladeWidth} ${bladeZ1 + bladeHeight} L ${-bladeWidth} ${bladeZ1 + bladeHeight} Z`,
        `M ${-bladeWidth} ${bladeZ2 - bladeHeight} L ${bladeWidth} ${bladeZ2 - bladeHeight} L ${bladeWidth} ${bladeZ2 + bladeHeight} L ${-bladeWidth} ${bladeZ2 + bladeHeight} Z`,
      ].join(' ')

      return (
        <g>
          <path d={result.bottomBackArc} fill="none" stroke="#999" strokeWidth={0.8} strokeDasharray="4 2" />
          <path d={result.frontFill} fill="#fff" stroke="none" />
          <path d={result.topFill} fill="#fff" stroke="none" />
          {result.layers && <path d={result.layers} fill="none" stroke="#999" strokeWidth={1.5} strokeDasharray="6 3" />}
          <path d={result.bottomFrontArc} fill="none" stroke="#000" strokeWidth={1.2} />
          <path d={result.topEllipse} fill="none" stroke="#000" strokeWidth={1.2} />
          <path d={result.sideLines} fill="none" stroke="#000" strokeWidth={1} />
          {result.headPath && <path d={result.headPath} fill="none" stroke="#000" strokeWidth={1} />}
          {result.supportsPath && <path d={result.supportsPath} fill="none" stroke="#000" strokeWidth={0.8} />}
          <path d={shaftPath} fill="none" stroke="#000" strokeWidth={0.8} />
          <path d={bladesPath} fill="none" stroke="#000" strokeWidth={0.6} />
          {result.nozzlesPath && <path d={result.nozzlesPath} fill="none" stroke="#000" strokeWidth={0.8} />}
          {result.coilPath && <path d={result.coilPath} fill="none" stroke="#999" strokeWidth={0.6} strokeDasharray="3 2" />}
          {result.nozzleLabels.map((nl, i) => (
            <text key={i} x={nl.x} y={nl.y} fontSize={8} fill="#000" textAnchor="middle">{nl.name}</text>
          ))}
          <text x={0} y={-10} fontSize={12} fill="#000" textAnchor="middle">{chamberData.name}</text>
        </g>
      )
    }

    // Cuboid wireframe SVG export
    const result = cuboidPath(width, depth, height, 0.2, layers)

    return (
      <g>
        {/* Room context for SVG export - wireframe, solid lines */}
        {chamberData.roomContext && (() => {
          const ctx = renderRoomContext(chamberData.roomContext, 0.2)
          return (
            <g>
              <path d={ctx.roomPath} fill="none" stroke="#000" strokeWidth={1.0} />
              {ctx.devicePaths.map((dp, i) => (
                <g key={`dev-${i}`}>
                  <path d={dp.edgesPath} fill="none" stroke="#333" strokeWidth={0.8} />
                  <text x={dp.labelX} y={dp.labelY} fontSize={10} fill="#000" textAnchor="middle">{dp.name}</text>
                </g>
              ))}
              {ctx.doorMarkers.map((dm, i) => (
                <g key={`door-${i}`}>
                  <path d={dm.doorRect} fill="none" stroke="#000" strokeWidth={1.0} />
                  <text x={dm.x} y={dm.y - 6} fontSize={10} fill="#000" textAnchor="middle" fontWeight="bold">
                    {dm.label}
                  </text>
                </g>
              ))}
            </g>
          )
        })()}
        {result.layers && <path d={result.layers} fill="none" stroke="#999" strokeWidth={1.5} strokeDasharray="6 3" />}
        <path d={result.hiddenEdges} fill="none" stroke="#000" strokeWidth={0.7} strokeDasharray="4 3" />
        <path d={result.visibleEdges} fill="none" stroke="#000" strokeWidth={1.2} strokeLinejoin="round" />
        <text x={0} y={-10} fontSize={12} fill="#000" textAnchor="middle">{chamberData.name}</text>
      </g>
    )
  }

  getIndicatorPath(_shape: ChamberShape) {
    return undefined
  }
}
