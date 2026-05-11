import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type ProbePointShape = TLBaseShape<'probe-point', {
  w: number
  h: number
  pointData: ProbePointData
}>

export class ProbePointShapeUtil extends ShapeUtil<ProbePointShape> {
  static type = 'probe-point' as const

  static props = {
    w: T.number,
    h: T.number,
    pointData: T.any as T.Validator<ProbePointData>,
  }

  getDefaultProps(): ProbePointShape['props'] {
    return {
      w: 40,
      h: 40,
      pointData: {
        label: 'T1',
        position: { x: 0, y: 0, z: 0 },
        properties: {},
      },
    }
  }

  getGeometry(shape: ProbePointShape) {
    return new Circle2d({
      radius: shape.props.w / 2,
      isFilled: false,
    })
  }

  component(shape: ProbePointShape) {
    const { pointData } = shape.props
    const { label } = pointData

    return (
      <SVGContainer>
        <circle cx={0} cy={0} r={3} fill="#000" />
        <text x={0} y={-10} fontSize={11} fill="#000" textAnchor="middle">
          {label}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: ProbePointShape) {
    return undefined
  }
}
