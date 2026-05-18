import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type InletPortShape = TLBaseShape<'inlet-port', {
  w: number
  h: number
  label: string
  pointData: ProbePointData
}>

export class InletPortShapeUtil extends ShapeUtil<InletPortShape> {
  static type = 'inlet-port' as const

  static props = {
    w: T.number,
    h: T.number,
    label: T.string,
    pointData: T.any as T.Validator<ProbePointData>,
  }

  getDefaultProps(): InletPortShape['props'] {
    return {
      w: 30,
      h: 30,
      label: '进气口',
      pointData: { label: '进气口', position: { x: 0, y: 0, z: 0 }, properties: {} },
    }
  }

  override canEdit() {
    return true
  }

  getGeometry(_shape: InletPortShape) {
    return new Circle2d({
      radius: 14,
      isFilled: true,
    })
  }

  component(shape: InletPortShape) {
    const { label } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id

    return (
      <SVGContainer>
        <circle cx={0} cy={0} r={12} fill="none" stroke="#000" strokeWidth={1} />
        {/* Inward arrows indicating gas inlet */}
        <line x1={-10} y1={0} x2={-4} y2={0} stroke="#000" strokeWidth={1.5} />
        <line x1={10} y1={0} x2={4} y2={0} stroke="#000" strokeWidth={1.5} />
        <line x1={0} y1={-10} x2={0} y2={-4} stroke="#000" strokeWidth={1.5} />
        <line x1={0} y1={10} x2={0} y2={4} stroke="#000" strokeWidth={1.5} />
        {/* Arrow heads */}
        <polygon points="-4,-3 -4,3 -1,0" fill="#000" />
        <polygon points="4,-3 4,3 1,0" fill="#000" />
        <polygon points="-3,-4 3,-4 0,-1" fill="#000" />
        <polygon points="-3,4 3,4 0,1" fill="#000" />
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
                  this.editor.updateShape<InletPortShape>({
                    id: shape.id,
                    type: 'inlet-port',
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
                    this.editor.updateShape<InletPortShape>({
                      id: shape.id,
                      type: 'inlet-port',
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

  getIndicatorPath(_shape: InletPortShape) {
    return undefined
  }
}
