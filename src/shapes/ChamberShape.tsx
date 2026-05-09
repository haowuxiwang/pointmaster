import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'
import { cuboidPath, cylinderPath } from './utils'
import type { Chamber } from '@/types'

type ChamberShape = TLBaseShape<'chamber', {
  w: number
  h: number
  chamberData: Chamber
}>

export class ChamberShapeUtil extends ShapeUtil<ChamberShape> {
  static type = 'chamber' as const

  static props = {
    w: T.number,
    h: T.number,
    chamberData: T.any as T.Validator<Chamber>,
  }

  getDefaultProps(): ChamberShape['props'] {
    return {
      w: 800,
      h: 600,
      chamberData: {
        type: 'cuboid',
        name: 'chamber',
        dimensions: { width: 1000, depth: 600, height: 800 },
      },
    }
  }

  getGeometry(shape: ChamberShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: ChamberShape) {
    const { chamberData } = shape.props
    const { type, dimensions } = chamberData
    const { width, depth, height } = dimensions

    let path: string
    if (type === 'cylinder') {
      const radius = chamberData.radius ?? Math.min(width, depth) / 2
      path = cylinderPath(radius, height)
    } else {
      path = cuboidPath(width, depth, height)
    }

    return (
      <SVGContainer>
        <path
          d={path}
          fill="none"
          stroke="#333"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <text x={0} y={-10} fontSize={12} fill="#666" textAnchor="middle">
          {chamberData.name}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: ChamberShape) {
    return undefined
  }
}
