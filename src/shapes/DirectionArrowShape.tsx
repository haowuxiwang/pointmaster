import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

type DirectionArrowShape = TLBaseShape<
  'direction-arrow',
  {
    w: number
    h: number
    label: string
  }
>

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

  getGeometry(shape: DirectionArrowShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: DirectionArrowShape) {
    const { w, h, label } = shape.props
    const arrowLen = w * 0.5
    const arrowH = h * 0.4
    const startX = (w - arrowLen) / 2
    const startY = h * 0.35
    const endX = startX + arrowLen
    const endY = startY - arrowH
    const headSize = 8

    return (
      <SVGContainer>
        {/* Arrow line */}
        <line
          x1={startX}
          y1={startY}
          x2={endX}
          y2={endY}
          stroke="#374151"
          strokeWidth={2}
          strokeLinecap="round"
        />
        {/* Arrow head */}
        <polygon
          points={`${endX},${endY} ${endX - headSize},${endY + headSize * 0.6} ${endX - headSize * 0.3},${endY + headSize}`}
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
