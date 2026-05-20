import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type BuiltInProbeShape = TLBaseShape<'built-in-probe', {
  w: number
  h: number
  label: string
  pointData: ProbePointData
}>

// Track editing values across renders (keyed by shape ID)
const editingValues = new Map<string, string>()

export class BuiltInProbeShapeUtil extends ShapeUtil<BuiltInProbeShape> {
  static type = 'built-in-probe' as const

  static props = {
    w: T.number,
    h: T.number,
    label: T.string,
    pointData: T.any as T.Validator<ProbePointData>,
  }

  getDefaultProps(): BuiltInProbeShape['props'] {
    return {
      w: 30,
      h: 30,
      label: 'B1',
      pointData: { label: 'B1', position: { x: 0, y: 0, z: 0 }, properties: {} },
    }
  }

  override canEdit() {
    return true
  }

  override onEditEnd(shape: BuiltInProbeShape) {
    const val = editingValues.get(shape.id)
    editingValues.delete(shape.id)
    if (val !== undefined && val !== shape.props.label) {
      this.editor.updateShape<BuiltInProbeShape>({
        id: shape.id,
        type: 'built-in-probe',
        props: {
          label: val,
          pointData: { ...shape.props.pointData, label: val },
        },
      })
    }
  }

  getGeometry(_shape: BuiltInProbeShape) {
    return new Circle2d({
      radius: 14,
      isFilled: true,
    })
  }

  component(shape: BuiltInProbeShape) {
    const { label } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id

    // Triangle shape for built-in probe
    const size = 10
    const points = `0,${-size} ${size},${size} ${-size},${size}`

    return (
      <SVGContainer>
        <polygon points={points} fill="none" stroke="#000" strokeWidth={1} />
        {isEditing ? (
          <foreignObject x={-30} y={-32} width={60} height={20}>
            <input
              autoFocus
              defaultValue={label}
              style={{
                width: '100%',
                fontSize: '10px',
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
                  const val = editingValues.get(shape.id) ?? label
                  editingValues.delete(shape.id)
                  if (val !== label) {
                    this.editor.updateShape<BuiltInProbeShape>({
                      id: shape.id,
                      type: 'built-in-probe',
                      props: { label: val, pointData: { ...shape.props.pointData, label: val } },
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
          <text x={0} y={-16} fontSize={10} fill="#000" textAnchor="middle">
            {label}
          </text>
        )}
      </SVGContainer>
    )
  }

  toSvg(shape: BuiltInProbeShape) {
    const { label } = shape.props
    const size = 10
    const points = `0,${-size} ${size},${size} ${-size},${size}`
    return (
      <g>
        <polygon points={points} fill="none" stroke="#000" strokeWidth={1} />
        <text x={0} y={-16} fontSize={10} fill="#000" textAnchor="middle">{label}</text>
      </g>
    )
  }

  getIndicatorPath(_shape: BuiltInProbeShape) {
    return undefined
  }
}
