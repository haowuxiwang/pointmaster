import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type DrainPortShape = TLBaseShape<'drain-port', {
  w: number
  h: number
  label: string
  pointData: ProbePointData
}>

// Track editing values across renders (keyed by shape ID)
const editingValues = new Map<string, string>()

export class DrainPortShapeUtil extends ShapeUtil<DrainPortShape> {
  static type = 'drain-port' as const

  static props = {
    w: T.number,
    h: T.number,
    label: T.string,
    pointData: T.any as T.Validator<ProbePointData>,
  }

  getDefaultProps(): DrainPortShape['props'] {
    return {
      w: 30,
      h: 30,
      label: '排水口',
      pointData: { label: '排水口', position: { x: 0, y: 0, z: 0 }, properties: {} },
    }
  }

  override canEdit() {
    return true
  }

  override onEditEnd(shape: DrainPortShape) {
    const val = editingValues.get(shape.id)
    editingValues.delete(shape.id)
    if (val !== undefined && val !== shape.props.label) {
      this.editor.updateShape<DrainPortShape>({
        id: shape.id,
        type: 'drain-port',
        props: {
          label: val,
          pointData: { ...shape.props.pointData, label: val },
        },
      })
    }
  }

  getGeometry(_shape: DrainPortShape) {
    return new Circle2d({
      radius: 14,
      isFilled: true,
    })
  }

  component(shape: DrainPortShape) {
    const { label } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id

    return (
      <SVGContainer>
        <circle cx={0} cy={0} r={12} fill="none" stroke="#000" strokeWidth={1} />
        <line x1={-8} y1={0} x2={8} y2={0} stroke="#000" strokeWidth={1} />
        <line x1={0} y1={-8} x2={0} y2={8} stroke="#000" strokeWidth={1} />
        {isEditing ? (
          <foreignObject x={-30} y={-32} width={60} height={20}>
            <input
              autoFocus
              defaultValue={label}
              style={{
                width: '100%',
                fontSize: '11px',
                fontWeight: 'bold',
                color: '#333',
                border: '1px solid #00bcd4',
                borderRadius: '3px',
                padding: '1px 3px',
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
                  const val = editingValues.get(shape.id) ?? label
                  editingValues.delete(shape.id)
                  if (val !== label) {
                    this.editor.updateShape<DrainPortShape>({
                      id: shape.id,
                      type: 'drain-port',
                      props: { label: val, pointData: { ...shape.props.pointData, label: val } },
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
          <text x={0} y={-18} fontSize={10} fill="#000" textAnchor="middle">
            {label}
          </text>
        )}
      </SVGContainer>
    )
  }

  toSvg(shape: DrainPortShape) {
    const { label } = shape.props
    return (
      <g>
        <circle cx={0} cy={0} r={12} fill="none" stroke="#000" strokeWidth={1} />
        <line x1={-8} y1={0} x2={8} y2={0} stroke="#000" strokeWidth={1} />
        <line x1={0} y1={-8} x2={0} y2={8} stroke="#000" strokeWidth={1} />
        <text x={0} y={-18} fontSize={10} fill="#000" textAnchor="middle">{label}</text>
      </g>
    )
  }

  getIndicatorPath(_shape: DrainPortShape) {
    return undefined
  }
}
