import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

type DirectionArrowShape = TLBaseShape<
  'direction-arrow',
  {
    w: number
    h: number
    label: string
  }
>

const editingValues = new Map<string, string>()

export class DirectionArrowShapeUtil extends ShapeUtil<DirectionArrowShape> {
  static type = 'direction-arrow' as const

  static props = {
    w: T.number,
    h: T.number,
    label: T.string,
  }

  getDefaultProps(): DirectionArrowShape['props'] {
    return { w: 120, h: 60, label: '观察方向' }
  }

  override canEdit() {
    return true
  }

  override onEditEnd(shape: DirectionArrowShape) {
    const val = editingValues.get(shape.id)
    editingValues.delete(shape.id)
    if (val !== undefined && val !== shape.props.label) {
      this.editor.updateShape<DirectionArrowShape>({
        id: shape.id,
        type: 'direction-arrow',
        props: { label: val },
      })
    }
  }

  getGeometry(shape: DirectionArrowShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: DirectionArrowShape) {
    const { w, h, label } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id

    if (isEditing) {
      return (
        <SVGContainer>
          <foreignObject x={0} y={0} width={w} height={h}>
            <input
              autoFocus
              defaultValue={label}
              style={{
                width: '100%',
                height: '100%',
                fontSize: '12px',
                fontWeight: 500,
                color: '#374151',
                border: '1px solid #1976d2',
                borderRadius: '2px',
                padding: '2px 4px',
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
                    this.editor.updateShape<DirectionArrowShape>({
                      id: shape.id,
                      type: 'direction-arrow',
                      props: { label: val },
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
        </SVGContainer>
      )
    }

    const arrowLen = w * 0.5
    const arrowH = h * 0.4
    const startX = (w - arrowLen) / 2
    const startY = h * 0.35
    const endX = startX + arrowLen
    const endY = startY - arrowH
    const headSize = 8

    return (
      <SVGContainer>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#374151"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <polygon
          points={`${endX},${endY} ${endX - headSize},${endY + headSize * 0.6} ${endX - headSize * 0.3},${endY + headSize}`}
          fill="#374151"
        />
        <text
          x={w / 2}
          y={h - 4}
          fontSize={11}
          fill="#374151"
          textAnchor="middle"
          fontWeight="500"
        >
          {label}
        </text>
      </SVGContainer>
    )
  }

  toSvg(shape: DirectionArrowShape) {
    const { w, h, label } = shape.props
    const arrowLen = w * 0.5
    const arrowH = h * 0.4
    const startX = (w - arrowLen) / 2
    const startY = h * 0.35
    const endX = startX + arrowLen
    const endY = startY - arrowH
    const headSize = 8

    return (
      <g>
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#374151"
          strokeWidth={2}
          strokeLinecap="round"
        />
        <polygon
          points={`${endX},${endY} ${endX - headSize},${endY + headSize * 0.6} ${endX - headSize * 0.3},${endY + headSize}`}
          fill="#374151"
        />
        <text
          x={w / 2}
          y={h - 4}
          fontSize={11}
          fill="#374151"
          textAnchor="middle"
          fontWeight="500"
        >
          {label}
        </text>
      </g>
    )
  }

  getIndicatorPath(_shape: DirectionArrowShape) {
    return undefined
  }
}
