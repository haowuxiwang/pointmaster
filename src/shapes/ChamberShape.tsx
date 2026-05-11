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
    const { width, depth, height, layers = 1 } = dimensions

    let outlinePath: string
    let layerPath: string
    if (type === 'cylinder') {
      const radius = chamberData.radius ?? Math.min(width, depth) / 2
      const result = cylinderPath(radius, height, 16, 0.2, layers)
      outlinePath = result.outline
      layerPath = result.layers
    } else if (type === 'polygon' && chamberData.vertices) {
      // TODO: Implement proper polygon rendering with isometric projection
      // For now, render as cuboid fallback
      const result = cuboidPath(width, depth, height, 0.2, layers)
      outlinePath = result.outline
      layerPath = result.layers
    } else {
      const result = cuboidPath(width, depth, height, 0.2, layers)
      outlinePath = result.outline
      layerPath = result.layers
    }

    return (
      <SVGContainer>
        <path
          d={outlinePath}
          fill="none"
          stroke="#000"
          strokeWidth={1}
          strokeLinejoin="round"
        />
        {layerPath && (
          <path
            d={layerPath}
            fill="none"
            stroke="#ccc"
            strokeWidth={0.5}
            strokeDasharray="4 2"
          />
        )}
        <text x={0} y={-10} fontSize={12} fill="#000" textAnchor="middle">
          {chamberData.name}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: ChamberShape) {
    return undefined
  }
}
