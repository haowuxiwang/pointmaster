import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

interface LegendEntry { label: string; description: string }

type LegendShape = TLBaseShape<'legend', {
  w: number
  h: number
  title: string
  entries: LegendEntry[]
}>

export class LegendShapeUtil extends ShapeUtil<LegendShape> {
  static type = 'legend' as const

  static props = {
    w: T.number,
    h: T.number,
    title: T.string,
    entries: T.any as T.Validator<LegendEntry[]>,
  }

  override canEdit() {
    return true
  }

  getDefaultProps(): LegendShape['props'] {
    return {
      w: 200,
      h: 150,
      title: '图例',
      entries: [
        { label: 'T1-T12', description: '温度探头' },
        { label: '○', description: '测量点位' },
      ],
    }
  }

  getGeometry(shape: LegendShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: LegendShape) {
    const { entries, title, w, h } = shape.props
    const padding = 12
    const lineHeight = 20
    const isEditing = this.editor.getEditingShapeId() === shape.id

    if (isEditing) {
      return (
        <SVGContainer>
          <foreignObject x={0} y={0} width={w} height={h}>
            <div
              style={{
                padding: '8px',
                background: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '11px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                height: '100%',
                boxSizing: 'border-box',
                overflow: 'auto',
              }}
            >
              <input
                autoFocus
                defaultValue={title}
                placeholder="图例标题"
                style={{
                  fontSize: '13px',
                  fontWeight: 'bold',
                  color: '#333',
                  border: '1px solid #333',
                  borderRadius: '2px',
                  padding: '2px 4px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
                onBlur={(e) => {
                  const newTitle = (e.target as HTMLInputElement).value.trim()
                  if (newTitle && newTitle !== title) {
                    this.editor.updateShape<LegendShape>({
                      id: shape.id,
                      type: 'legend',
                      props: { title: newTitle },
                    })
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newTitle = (e.target as HTMLInputElement).value.trim()
                    if (newTitle && newTitle !== title) {
                      this.editor.updateShape<LegendShape>({
                        id: shape.id,
                        type: 'legend',
                        props: { title: newTitle },
                      })
                    }
                    this.editor.setEditingShape(null)
                  }
                  if (e.key === 'Escape') this.editor.setEditingShape(null)
                  e.stopPropagation()
                }}
              />
              {entries.map((entry, i) => (
                <div key={i} style={{ display: 'flex', gap: '4px' }}>
                  <input
                    defaultValue={entry.label}
                    placeholder="标签"
                    style={{
                      fontSize: '11px',
                      color: '#555',
                      border: '1px solid #aaa',
                      borderRadius: '2px',
                      padding: '1px 3px',
                      outline: 'none',
                      width: '40%',
                      boxSizing: 'border-box',
                    }}
                    onBlur={(e) => {
                      const newLabel = (e.target as HTMLInputElement).value.trim()
                      if (newLabel && newLabel !== entry.label) {
                        const newEntries = [...entries]
                        newEntries[i] = { ...newEntries[i], label: newLabel }
                        this.editor.updateShape<LegendShape>({
                          id: shape.id,
                          type: 'legend',
                          props: { entries: newEntries },
                        })
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') this.editor.setEditingShape(null)
                      e.stopPropagation()
                    }}
                  />
                  <input
                    defaultValue={entry.description}
                    placeholder="说明"
                    style={{
                      fontSize: '11px',
                      color: '#555',
                      border: '1px solid #aaa',
                      borderRadius: '2px',
                      padding: '1px 3px',
                      outline: 'none',
                      flex: 1,
                      boxSizing: 'border-box',
                    }}
                    onBlur={(e) => {
                      const newDesc = (e.target as HTMLInputElement).value.trim()
                      if (newDesc && newDesc !== entry.description) {
                        const newEntries = [...entries]
                        newEntries[i] = { ...newEntries[i], description: newDesc }
                        this.editor.updateShape<LegendShape>({
                          id: shape.id,
                          type: 'legend',
                          props: { entries: newEntries },
                        })
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') this.editor.setEditingShape(null)
                      e.stopPropagation()
                    }}
                  />
                </div>
              ))}
            </div>
          </foreignObject>
        </SVGContainer>
      )
    }

    return (
      <SVGContainer>
        <rect
          x={0} y={0}
          width={w} height={h}
          fill="white"
          stroke="#ccc"
          strokeWidth={1}
          rx={4}
        />
        <text
          x={padding}
          y={padding + 12}
          fontSize={13}
          fontWeight="bold"
          fill="#333"
        >
          {title}
        </text>
        {entries.map((entry, i) => (
          <text
            key={i}
            x={padding}
            y={padding + 32 + i * lineHeight}
            fontSize={11}
            fill="#555"
          >
            {entry.label} - {entry.description}
          </text>
        ))}
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: LegendShape) {
    return undefined
  }
}
