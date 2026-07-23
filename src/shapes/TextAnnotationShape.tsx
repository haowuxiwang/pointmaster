import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

type TextAnnotationShape = TLBaseShape<
  'text-annotation',
  {
    w: number
    h: number
    content: string
    fontSize: number
  }
>

const editingValues = new Map<string, string>()

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

  override onEditEnd(shape: TextAnnotationShape) {
    const val = editingValues.get(shape.id)
    editingValues.delete(shape.id)
    if (val !== undefined && val !== shape.props.content) {
      this.editor.updateShape<TextAnnotationShape>({
        id: shape.id,
        type: 'text-annotation',
        props: { content: val },
      })
    }
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
    const { content, fontSize, w } = shape.props
    const lines = content.split('\n')
    const isEditing = this.editor.getEditingShapeId() === shape.id

    if (isEditing) {
      const textareaHeight = Math.max(lines.length * fontSize * 1.4 + 16, 60)
      return (
        <SVGContainer>
          <foreignObject
            x={0}
            y={0}
            width={Math.max(w, 300)}
            height={textareaHeight}
            style={{ pointerEvents: 'all' }}
          >
            <textarea
              autoFocus
              defaultValue={content}
              style={{
                width: '100%',
                minHeight: '100%',
                fontSize: `${fontSize}px`,
                fontFamily: 'sans-serif',
                color: '#333',
                border: '1px solid #1976d2',
                borderRadius: '2px',
                padding: '4px 6px',
                outline: 'none',
                background: 'white',
                resize: 'none',
                lineHeight: '1.4',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
              onInput={(e) => {
                editingValues.set(shape.id, (e.target as HTMLTextAreaElement).value)
                const ta = e.target as HTMLTextAreaElement
                ta.style.height = 'auto'
                ta.style.height = ta.scrollHeight + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  editingValues.delete(shape.id)
                  this.editor.setEditingShape(null)
                }
              }}
            />
          </foreignObject>
        </SVGContainer>
      )
    }

    return (
      <SVGContainer>
        {lines.map((line, i) => (
          <text key={i} x={0} y={fontSize * 1.4 * (i + 1)} fontSize={fontSize} fill="#333">
            {line}
          </text>
        ))}
      </SVGContainer>
    )
  }

  toSvg(shape: TextAnnotationShape) {
    const { content, fontSize } = shape.props
    const lines = content.split('\n')
    return (
      <g>
        {lines.map((line, i) => (
          <text key={i} x={0} y={fontSize * (i + 1)} fontSize={fontSize} fill="#333">
            {line}
          </text>
        ))}
      </g>
    )
  }

  getIndicatorPath(_shape: TextAnnotationShape) {
    return undefined
  }
}
