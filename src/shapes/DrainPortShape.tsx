import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'

type DrainPortShape = TLBaseShape<'drain-port', {
  w: number
  h: number
  label: string
}>

export class DrainPortShapeUtil extends ShapeUtil<DrainPortShape> {
  static type = 'drain-port' as const

  static props = {
    w: T.number,
    h: T.number,
    label: T.string,
  }

  getDefaultProps(): DrainPortShape['props'] {
    return {
      w: 30,
      h: 30,
      label: 'D1',
    }
  }

  getGeometry(shape: DrainPortShape) {
    return new Circle2d({
      radius: shape.props.w / 2,
      isFilled: false,
    })
  }

  component(shape: DrainPortShape) {
    const { label } = shape.props

    return (
      <SVGContainer>
        <circle cx={0} cy={0} r={12} fill="none" stroke="#000" strokeWidth={1} />
        <line x1={-8} y1={0} x2={8} y2={0} stroke="#000" strokeWidth={1} />
        <line x1={0} y1={-8} x2={0} y2={8} stroke="#000" strokeWidth={1} />
        <text x={0} y={-18} fontSize={10} fill="#000" textAnchor="middle">
          {label}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: DrainPortShape) {
    return undefined
  }
}
