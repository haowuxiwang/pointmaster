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
    return { w: 140, h: 80, label: '观察方向' }
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
      isFilled: true,
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
                fontSize: '13px',
                fontWeight: 600,
                color: '#1e293b',
                border: '2px solid #3b82f6',
                borderRadius: '4px',
                padding: '4px 8px',
                outline: 'none',
                background: 'white',
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(59,130,246,0.2)',
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

    // Simple line arrow pointing top-right (isometric direction)
    const sx = w * 0.2
    const sy = h * 0.7
    const ex = w * 0.75
    const ey = h * 0.2
    const headLen = 10
    const angle = Math.atan2(ey - sy, ex - sx)
    const h1x = ex - headLen * Math.cos(angle - 0.4)
    const h1y = ey - headLen * Math.sin(angle - 0.4)
    const h2x = ex - headLen * Math.cos(angle + 0.4)
    const h2y = ey - headLen * Math.sin(angle + 0.4)

    return (
      <SVGContainer>
        {/* Line */}
        <line
          x1={sx} y1={sy} x2={ex} y2={ey}
          stroke="#374151"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Arrowhead */}
        <polygon
          points={`${ex},${ey} ${h1x},${h1y} ${h2x},${h2y}`}
          fill="#374151"
        />
        {/* Label */}
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
    const sx = w * 0.2
    const sy = h * 0.7
    const ex = w * 0.75
    const ey = h * 0.2
    const headLen = 10
    const angle = Math.atan2(ey - sy, ex - sx)
    const h1x = ex - headLen * Math.cos(angle - 0.4)
    const h1y = ey - headLen * Math.sin(angle - 0.4)
    const h2x = ex - headLen * Math.cos(angle + 0.4)
    const h2y = ey - headLen * Math.sin(angle + 0.4)

    return (
      <g>
        <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#374151" strokeWidth={2} strokeLinecap="round" />
        <polygon points={`${ex},${ey} ${h1x},${h1y} ${h2x},${h2y}`} fill="#374151" />
        <text x={w / 2} y={h - 4} fontSize={11} fill="#374151" textAnchor="middle" fontWeight="500">{label}</text>
      </g>
    )
  }

  getIndicatorPath(_shape: DirectionArrowShape) {
    return undefined
  }
}
