import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'

interface LegendEntry { label: string; description: string }

type LegendShape = TLBaseShape<'legend', {
  w: number
  h: number
  title: string
  entries: LegendEntry[]
}>

// Track editing values across renders (keyed by composite keys)
const editingValues = new Map<string, string>()

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

  override onEditEnd(shape: LegendShape) {
    const updates: Partial<LegendShape['props']> = {}
    let hasChanges = false

    // Check title
    const titleVal = editingValues.get(shape.id)
    if (titleVal !== undefined && titleVal !== shape.props.title) {
      updates.title = titleVal
      hasChanges = true
    }

    // Check entries
    let entriesChanged = false
    const newEntries = shape.props.entries.map((entry, i) => {
      const labelVal = editingValues.get(`${shape.id}:entry-${i}-label`)
      const descVal = editingValues.get(`${shape.id}:entry-${i}-desc`)
      const newEntry = { ...entry }
      if (labelVal !== undefined && labelVal !== entry.label) {
        newEntry.label = labelVal
        entriesChanged = true
      }
      if (descVal !== undefined && descVal !== entry.description) {
        newEntry.description = descVal
        entriesChanged = true
      }
      return newEntry
    })

    if (entriesChanged) {
      updates.entries = newEntries
      hasChanges = true
    }

    // Clean up all cached values for this shape
    editingValues.delete(shape.id)
    for (let i = 0; i < shape.props.entries.length; i++) {
      editingValues.delete(`${shape.id}:entry-${i}-label`)
      editingValues.delete(`${shape.id}:entry-${i}-desc`)
    }

    if (hasChanges) {
      this.editor.updateShape<LegendShape>({
        id: shape.id,
        type: 'legend',
        props: updates,
      })
    }
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
                onInput={(e) => {
                  editingValues.set(shape.id, (e.target as HTMLInputElement).value)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    this.editor.setEditingShape(null)
                  }
                  if (e.key === 'Escape') {
                    editingValues.delete(shape.id)
                    this.editor.setEditingShape(null)
                  }
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
                    onInput={(e) => {
                      editingValues.set(`${shape.id}:entry-${i}-label`, (e.target as HTMLInputElement).value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        this.editor.setEditingShape(null)
                      }
                      if (e.key === 'Escape') {
                        editingValues.delete(`${shape.id}:entry-${i}-label`)
                        this.editor.setEditingShape(null)
                      }
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
                    onInput={(e) => {
                      editingValues.set(`${shape.id}:entry-${i}-desc`, (e.target as HTMLInputElement).value)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        this.editor.setEditingShape(null)
                      }
                      if (e.key === 'Escape') {
                        editingValues.delete(`${shape.id}:entry-${i}-desc`)
                        this.editor.setEditingShape(null)
                      }
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

  toSvg(shape: LegendShape) {
    const { entries, title, w } = shape.props
    const padding = 12
    const lineHeight = 20
    return (
      <g>
        <rect x={0} y={0} width={w} height={shape.props.h} fill="white" stroke="#ccc" strokeWidth={1} rx={4} />
        <text x={padding} y={padding + 12} fontSize={13} fontWeight="bold" fill="#333">{title}</text>
        {entries.map((entry, i) => (
          <text key={i} x={padding} y={padding + 32 + i * lineHeight} fontSize={11} fill="#555">
            {entry.label} - {entry.description}
          </text>
        ))}
      </g>
    )
  }

  getIndicatorPath(_shape: LegendShape) {
    return undefined
  }
}
