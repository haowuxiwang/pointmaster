import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

interface LegendEntry { label: string; description: string }

type LegendShape = TLBaseShape<'legend', {
  w: number
  h: number
  title: string
  entries: LegendEntry[]
}>

export class LegendShapeUtil extends ShapeUtil<LegendShape> {
  static type = 'legend' as const

  static props = {
    w: T.number,
    h: T.number,
    title: T.string,
    entries: T.any as T.Validator<LegendEntry[]>,
  }

  getDefaultProps(): LegendShape['props'] {
    return {
      w: 200,
      h: 150,
      title: '图例',
      entries: [
        { label: 'T1-T12', description: '温度探头' },
        { label: '○', description: '测量点位' },
      ],
    }
  }

  getGeometry(shape: LegendShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: LegendShape) {
    const { entries, title, w, h } = shape.props
    const padding = 12
    const lineHeight = 20

    return (
      <SVGContainer>
        <rect
          x={0} y={0}
          width={w} height={h}
          fill="white"
          stroke="#ccc"
          strokeWidth={1}
          rx={4}
        />
        <text
          x={padding}
          y={padding + 12}
          fontSize={13}
          fontWeight="bold"
          fill="#333"
        >
          {title}
        </text>
        {entries.map((entry, i) => (
          <text
            key={i}
            x={padding}
            y={padding + 32 + i * lineHeight}
            fontSize={11}
            fill="#555"
          >
            {entry.label} - {entry.description}
          </text>
        ))}
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: LegendShape) {
    return undefined
  }
}
