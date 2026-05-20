import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'
import { cuboidPath, cylinderPath } from './utils'
import { project3Dto2D, CHAMBER_SCALE } from '@/core/projection/isometric'
import type { Chamber } from '@/types'

type ChamberShape = TLBaseShape<'chamber', {
  w: number
  h: number
  chamberData: Chamber
}>

// Track editing values across renders (keyed by shape ID)
const editingValues = new Map<string, string>()

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
    const { width, depth, height } = shape.props.chamberData.dimensions
    const p = (x: number, y: number, z: number) => project3Dto2D(x, y, z, CHAMBER_SCALE)
    const vertices = [
      p(0, 0, 0), p(width, 0, 0), p(width, depth, 0), p(0, depth, 0),
      p(0, 0, height), p(width, 0, height), p(width, depth, height), p(0, depth, height),
    ]
    const xs = vertices.map(v => v.x)
    const ys = vertices.map(v => v.y)
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
