import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

type TextAnnotationShape = TLBaseShape<'text-annotation', {
  w: number
  h: number
  content: string
  fontSize: number
}>

export class TextAnnotationShapeUtil extends ShapeUtil<TextAnnotationShape> {
  static type = 'text-annotation' as const

  static props = {
    w: T.number,
    h: T.number,
    content: T.string,
    fontSize: T.number,
  }

  getDefaultProps(): TextAnnotationShape['props'] {
    return { w: 100, h: 30, content: '标注文字', fontSize: 14 }
  }

  getGeometry(shape: TextAnnotationShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    })
  }

  component(shape: TextAnnotationShape) {
    return (
      <SVGContainer>
        <text
          x={0}
          y={0}
          fontSize={shape.props.fontSize}
          fill="#333"
          dominantBaseline="middle"
        >
          {shape.props.content}
        </text>
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: TextAnnotationShape) {
    return undefined
  }
}
