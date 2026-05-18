import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type DrainPortShape = TLBaseShape<'drain-port', {
  w: number
  h: number
  label: string
  pointData: ProbePointData
}>

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
                fontSize: '10px',
                color: '#000',
                border: '1px solid #000',
                borderRadius: '2px',
                padding: '1px 2px',
                outline: 'none',
                background: 'white',
                textAlign: 'center',
              }}
              onBlur={(e) => {
                const newLabel = (e.target as HTMLInputElement).value.trim()
                if (newLabel && newLabel !== label) {
                  this.editor.updateShape<DrainPortShape>({
                    id: shape.id,
                    type: 'drain-port',
                    props: {
                      label: newLabel,
                      pointData: { ...shape.props.pointData, label: newLabel },
                    },
                  })
                }
                this.editor.setEditingShape(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newLabel = (e.target as HTMLInputElement).value.trim()
                  if (newLabel && newLabel !== label) {
                    this.editor.updateShape<DrainPortShape>({
                      id: shape.id,
                      type: 'drain-port',
                      props: {
                        label: newLabel,
                        pointData: { ...shape.props.pointData, label: newLabel },
                      },
                    })
                  }
                  this.editor.setEditingShape(null)
                }
                if (e.key === 'Escape') {
                  this.editor.setEditingShape(null)
                }
                e.stopPropagation()
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

  getIndicatorPath(_shape: DrainPortShape) {
    return undefined
  }
}
