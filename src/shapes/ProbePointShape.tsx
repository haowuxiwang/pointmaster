import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type ProbePointShape = TLBaseShape<'probe-point', {
  w: number
  h: number
  pointData: ProbePointData
}>

// Track editing values across renders (keyed by shape ID)
const editingValues = new Map<string, string>()

export class ProbePointShapeUtil extends ShapeUtil<ProbePointShape> {
  static type = 'probe-point' as const

  static props = {
    w: T.number,
    h: T.number,
    pointData: T.any as T.Validator<ProbePointData>,
  }

  getDefaultProps(): ProbePointShape['props'] {
    return {
      w: 40,
      h: 40,
      pointData: {
        label: 'T1',
        position: { x: 0, y: 0, z: 0 },
        properties: {},
      },
    }
  }

  override canEdit() {
    return true
  }

  override onEditEnd(shape: ProbePointShape) {
    const val = editingValues.get(shape.id)
    editingValues.delete(shape.id)
    if (val !== undefined && val !== shape.props.pointData.label) {
      this.editor.updateShape<ProbePointShape>({
        id: shape.id,
        type: 'probe-point',
        props: { pointData: { ...shape.props.pointData, label: val } },
      })
    }
  }

  getGeometry(_shape: ProbePointShape) {
    return new Circle2d({
      radius: 8,
      isFilled: true,
    })
  }

  component(shape: ProbePointShape) {
    const { pointData } = shape.props
    const { label } = pointData
    const size = 5
    const isEditing = this.editor.getEditingShapeId() === shape.id

    return (
      <SVGContainer>
        {/* Cross marker */}
        <line x1={-size} y1={0} x2={size} y2={0} stroke="#e74c3c" strokeWidth={1.5} />
        <line x1={0} y1={-size} x2={0} y2={size} stroke="#e74c3c" strokeWidth={1.5} />
        {/* Label with offset to avoid overlap */}
        {isEditing ? (
          <foreignObject x={8} y={-20} width={60} height={20}>
            <input
              autoFocus
              defaultValue={label}
              style={{
                width: '100%',
                fontSize: '10px',
                fontWeight: 'bold',
                color: '#e74c3c',
                border: '1px solid #e74c3c',
                borderRadius: '2px',
                padding: '1px 2px',
                outline: 'none',
                background: 'white',
              }}
              onInput={(e) => {
                editingValues.set(shape.id, (e.target as HTMLInputElement).value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = editingValues.get(shape.id) ?? label
                  editingValues.delete(shape.id)
                  if (val !== label) {
                    this.editor.updateShape<ProbePointShape>({
                      id: shape.id,
                      type: 'probe-point',
                      props: { pointData: { ...shape.props.pointData, label: val } },
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
          <text x={8} y={-8} fontSize={10} fill="#e74c3c" fontWeight="bold" textAnchor="start">
            {label}
          </text>
        )}
      </SVGContainer>
    )
  }

  toSvg(shape: ProbePointShape) {
    const { label } = shape.props.pointData
    const size = 5
    return (
      <g>
        <line x1={-size} y1={0} x2={size} y2={0} stroke="#e74c3c" strokeWidth={1.5} />
        <line x1={0} y1={-size} x2={0} y2={size} stroke="#e74c3c" strokeWidth={1.5} />
        <text x={8} y={-8} fontSize={10} fill="#e74c3c" fontWeight="bold" textAnchor="start">{label}</text>
      </g>
    )
  }

  getIndicatorPath(_shape: ProbePointShape) {
    return undefined
  }
}
