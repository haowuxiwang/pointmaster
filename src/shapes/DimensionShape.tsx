import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'
import { isoProject } from './utils'
import type { Point3D } from '@/types'

type DimensionShape = TLBaseShape<'dimension', {
  w: number
  h: number
  from: Point3D
  to: Point3D
  label: string
}>

export class DimensionShapeUtil extends ShapeUtil<DimensionShape> {
  static type = 'dimension' as const

  static props = {
    w: T.number,
    h: T.number,
    from: T.any as T.Validator<Point3D>,
    to: T.any as T.Validator<Point3D>,
    label: T.string,
  }

  getDefaultProps(): DimensionShape['props'] {
    return {
      w: 200,
      h: 30,
      from: { x: 0, y: 0, z: 0 },
      to: { x: 100, y: 0, z: 0 },
      label: '100mm',
    }
  }

  getGeometry(shape: DimensionShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: DimensionShape) {
    const { from, to, label } = shape.props
    const scale = 0.2
    const p1 = isoProject(from.x, from.y, from.z, scale)
    const p2 = isoProject(to.x, to.y, to.z, scale)
    const mx = (p1.x + p2.x) / 2
    const my = (p1.y + p2.y) / 2

    return (
      <SVGContainer>
        <line
          x1={p1.x} y1={p1.y}
          x2={p2.x} y2={p2.y}
          stroke="#e74c3c"
          strokeWidth={1}
          strokeDasharray="4 2"
        />
        <circle cx={p1.x} cy={p1.y} r={3} fill="#e74c3c" />
        <circle cx={p2.x} cy={p2.y} r={3} fill="#e74c3c" />
        <text
          x={mx} y={my - 8}
          fontSize={10}
          fill="#e74c3c"
          textAnchor="middle"
        >
          {label}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: DimensionShape) {
    return undefined
  }
}
