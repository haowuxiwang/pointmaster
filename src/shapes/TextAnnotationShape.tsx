import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

type TextAnnotationShape = TLBaseShape<'text-annotation', {
  w: number
  h: number
  content: string
  fontSize: number
}>

// Track editing values across renders (keyed by shape ID)
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
              onInput={(e) => {
                editingValues.set(shape.id, (e.target as HTMLTextAreaElement).value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  editingValues.delete(shape.id)
                  this.editor.setEditingShape(null)
                }
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

  toSvg(shape: TextAnnotationShape) {
    const { content, fontSize } = shape.props
    const lines = content.split('\n')
    return (
      <g>
        {lines.map((line, i) => (
          <text key={i} x={0} y={fontSize * (i + 1)} fontSize={fontSize} fill="#333">{line}</text>
        ))}
      </g>
    )
  }

  getIndicatorPath(_shape: TextAnnotationShape) {
    return undefined
  }
}
