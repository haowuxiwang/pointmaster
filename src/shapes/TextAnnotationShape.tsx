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

  override canEdit() {
    return true
  }

  getGeometry(shape: TextAnnotationShape) {
    const lineCount = shape.props.content.split('\n').length
    const computedHeight = Math.max(shape.props.h, lineCount * shape.props.fontSize + 8)
    return new Rectangle2d({
      width: shape.props.w,
      height: computedHeight,
      isFilled: true,
    })
  }

  component(shape: TextAnnotationShape) {
    const { content, fontSize, w, h } = shape.props
    const isEditing = this.editor.getEditingShapeId() === shape.id

    if (isEditing) {
      return (
        <SVGContainer>
          <foreignObject x={0} y={0} width={w} height={h}>
            <textarea
              autoFocus
              defaultValue={content}
              style={{
                width: '100%',
                height: '100%',
                fontSize: `${fontSize}px`,
                color: '#333',
                border: '1px solid #333',
                borderRadius: '2px',
                padding: '2px 4px',
                outline: 'none',
                background: 'white',
                boxSizing: 'border-box',
                resize: 'none',
                fontFamily: 'inherit',
              }}
              onBlur={(e) => {
                const newContent = (e.target as HTMLTextAreaElement).value
                if (newContent && newContent !== content) {
                  this.editor.updateShape<TextAnnotationShape>({
                    id: shape.id,
                    type: 'text-annotation',
                    props: { content: newContent },
                  })
                }
                this.editor.setEditingShape(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  this.editor.setEditingShape(null)
                }
                e.stopPropagation()
              }}
            />
          </foreignObject>
        </SVGContainer>
      )
    }

    const lines = content.split('\n')

    return (
      <SVGContainer>
        {lines.map((line, i) => (
          <text
            key={i}
            x={0}
            y={fontSize * (i + 1)}
            fontSize={fontSize}
            fill="#333"
          >
            {line}
          </text>
        ))}
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: TextAnnotationShape) {
    return undefined
  }
}
