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

    // 3D isometric arrow design
    const cx = w / 2
    const cy = h * 0.4
    const arrowLen = w * 0.45
    const shaftW = 6
    const headLen = 14
    const headW = 12

    // Arrow shaft (3D effect with side face)
    const shaftStart = { x: cx - arrowLen / 2, y: cy + 4 }
    const shaftEnd = { x: cx + arrowLen / 2, y: cy - 4 }

    // 3D shaft side
    const sideOffset = 3
    const shaftSide = [
      { x: shaftStart.x, y: shaftStart.y + shaftW },
      { x: shaftEnd.x, y: shaftEnd.y + shaftW },
      { x: shaftEnd.x, y: shaftEnd.y + shaftW + sideOffset },
      { x: shaftStart.x, y: shaftStart.y + shaftW + sideOffset },
    ]

    // Arrowhead (3D)
    const tipX = shaftEnd.x + headLen
    const tipY = shaftEnd.y - headLen * 0.6

    // 3D arrowhead side
    const headSide = [
      { x: shaftEnd.x, y: shaftEnd.y + headW / 2 },
      { x: tipX, y: tipY },
      { x: tipX, y: tipY + sideOffset },
      { x: shaftEnd.x, y: shaftEnd.y + headW / 2 + sideOffset },
    ]

    const toPath = (pts: Array<{ x: number; y: number }>) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

    return (
      <SVGContainer>
        {/* Shadow */}
        <ellipse
          cx={cx}
          cy={h * 0.75}
          rx={w * 0.3}
          ry={4}
          fill="rgba(0,0,0,0.08)"
        />

        {/* 3D shaft side face */}
        <path d={toPath(shaftSide)} fill="#94a3b8" stroke="none" />

        {/* Shaft top face */}
        <rect
          x={shaftStart.x}
          y={shaftStart.y}
          width={arrowLen}
          height={shaftW}
          rx={2}
          fill="#475569"
          stroke="#334155"
          strokeWidth={0.5}
        />

        {/* 3D arrowhead side face */}
        <path d={toPath(headSide)} fill="#94a3b8" stroke="none" />

        {/* Arrowhead top face */}
        <polygon
          points={`${shaftEnd.x},${shaftEnd.y - headW / 2} ${shaftEnd.x},${shaftEnd.y + headW / 2} ${tipX},${tipY}`}
          fill="#1e293b"
          stroke="#0f172a"
          strokeWidth={0.5}
        />

        {/* Tip highlight */}
        <circle cx={tipX} cy={tipY} r={2} fill="#60a5fa" />

        {/* Label */}
        <text
          x={cx}
          y={h - 6}
          fontSize={12}
          fill="#334151"
          textAnchor="middle"
          fontWeight="600"
          fontFamily="sans-serif"
        >
          {label}
        </text>
      </SVGContainer>
    )
  }

  toSvg(shape: DirectionArrowShape) {
    const { w, h, label } = shape.props
    const cx = w / 2
    const cy = h * 0.4
    const arrowLen = w * 0.45
    const shaftW = 6
    const headLen = 14
    const headW = 12
    const sideOffset = 3

    const shaftStart = { x: cx - arrowLen / 2, y: cy + 4 }
    const shaftEnd = { x: cx + arrowLen / 2, y: cy - 4 }

    const shaftSide = [
      { x: shaftStart.x, y: shaftStart.y + shaftW },
      { x: shaftEnd.x, y: shaftEnd.y + shaftW },
      { x: shaftEnd.x, y: shaftEnd.y + shaftW + sideOffset },
      { x: shaftStart.x, y: shaftStart.y + shaftW + sideOffset },
    ]

    const tipX = shaftEnd.x + headLen
    const tipY = shaftEnd.y - headLen * 0.6
    const headSide = [
      { x: shaftEnd.x, y: shaftEnd.y + headW / 2 },
      { x: tipX, y: tipY },
      { x: tipX, y: tipY + sideOffset },
      { x: shaftEnd.x, y: shaftEnd.y + headW / 2 + sideOffset },
    ]

    const toPath = (pts: Array<{ x: number; y: number }>) =>
      pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

    return (
      <g>
        <ellipse cx={cx} cy={h * 0.75} rx={w * 0.3} ry={4} fill="rgba(0,0,0,0.08)" />
        <path d={toPath(shaftSide)} fill="#94a3b8" stroke="none" />
        <rect x={shaftStart.x} y={shaftStart.y} width={arrowLen} height={shaftW} rx={2} fill="#475569" stroke="#334155" strokeWidth={0.5} />
        <path d={toPath(headSide)} fill="#94a3b8" stroke="none" />
        <polygon points={`${shaftEnd.x},${shaftEnd.y - headW / 2} ${shaftEnd.x},${shaftEnd.y + headW / 2} ${tipX},${tipY}`} fill="#1e293b" stroke="#0f172a" strokeWidth={0.5} />
        <circle cx={tipX} cy={tipY} r={2} fill="#60a5fa" />
        <text x={cx} y={h - 6} fontSize={12} fill="#334151" textAnchor="middle" fontWeight="600" fontFamily="sans-serif">{label}</text>
      </g>
    )
  }

  getIndicatorPath(_shape: DirectionArrowShape) {
    return undefined
  }
}
