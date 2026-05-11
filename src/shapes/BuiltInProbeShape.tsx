import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'

type BuiltInProbeShape = TLBaseShape<'built-in-probe', {
  w: number
  h: number
  label: string
}>

export class BuiltInProbeShapeUtil extends ShapeUtil<BuiltInProbeShape> {
  static type = 'built-in-probe' as const

  static props = {
    w: T.number,
    h: T.number,
    label: T.string,
  }

  getDefaultProps(): BuiltInProbeShape['props'] {
    return {
      w: 30,
      h: 30,
      label: 'B1',
    }
  }

  getGeometry(shape: BuiltInProbeShape) {
    return new Circle2d({
      radius: shape.props.w / 2,
      isFilled: false,
    })
  }

  component(shape: BuiltInProbeShape) {
    const { label } = shape.props

    // Triangle shape for built-in probe
    const size = 10
    const points = `0,${-size} ${size},${size} ${-size},${size}`

    return (
      <SVGContainer>
        <polygon points={points} fill="none" stroke="#000" strokeWidth={1} />
        <text x={0} y={-16} fontSize={10} fill="#000" textAnchor="middle">
          {label}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: BuiltInProbeShape) {
    return undefined
  }
}
