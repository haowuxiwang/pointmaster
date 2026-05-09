import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'
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
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: ProbePointShape) {
    const { pointData } = shape.props
    const { label, position } = pointData

    // Color varies by Z level (higher = darker)
    const zRatio = Math.min(position.z / 1000, 1)
    const lightness = Math.round(40 + zRatio * 30)
    const color = `hsl(210, 80%, ${lightness}%)`

    return (
      <SVGContainer>
        <circle cx={0} cy={0} r={14} fill="white" stroke={color} strokeWidth={2} />
        <circle cx={0} cy={0} r={4} fill={color} />
        <text x={0} y={-20} fontSize={11} fill={color} textAnchor="middle" fontWeight="bold">
          {label}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: ProbePointShape) {
    return undefined
  }
}
