import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type ProbePointShape = TLBaseShape<
  'probe-point',
  {
    w: number
    h: number
    pointData: ProbePointData
  }
>

// Track editing values across renders (keyed by shape ID)
const editingValues = new Map<string, string>()

const CIRCLE_COLOR = '#00bcd4'
const LABEL_COLOR = '#333333'

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

  override canEdit() {
    return true
  }

  override onEditEnd(shape: ProbePointShape) {
    const val = editingValues.get(shape.id)
    editingValues.delete(shape.id)
    if (val !== undefined && val !== shape.props.pointData.label) {
      this.editor.updateShape<ProbePointShape>({
        id: shape.id,
        type: 'probe-point',
        props: { pointData: { ...shape.props.pointData, label: val } },
      })
    }
  }

  getGeometry(_shape: ProbePointShape) {
    return new Circle2d({
      radius: 6,
      isFilled: true,
    })
  }

  component(shape: ProbePointShape) {
    const { pointData } = shape.props
    const { label } = pointData
    const isEditing = this.editor.getEditingShapeId() === shape.id
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id)
    const isHovering = this.editor.getHoveredShapeId?.() === shape.id

    return (
      <SVGContainer>
        {/* Selection/hover glow ring */}
        {(isSelected || isHovering) && (
          <circle
            cx={0}
            cy={0}
            r={8}
            fill="none"
            stroke={isSelected ? '#1976d2' : '#88ccff'}
            strokeWidth={isSelected ? 2 : 1.5}
            opacity={0.6}
          />
        )}
        {/* Small black dot — the point marker */}
        <circle cx={0} cy={0} r={4} fill={isSelected ? '#1976d2' : '#000'} />
        {/* Label — always visible for point identification */}
        {!isEditing && (
          <text
            x={0}
            y={-12}
            fontSize={11}
            fill={isSelected ? '#1976d2' : '#333'}
            fontWeight="bold"
            textAnchor="middle"
          >
            {label}
          </text>
        )}
        {/* Edit mode input */}
        {isEditing && (
          <foreignObject x={-30} y={-20} width={60} height={20}>
            <input
              autoFocus
              defaultValue={label}
              style={{
                width: '100%',
                fontSize: '11px',
                fontWeight: 'bold',
                color: LABEL_COLOR,
                border: `1px solid ${CIRCLE_COLOR}`,
                borderRadius: '2px',
                padding: '1px 3px',
                outline: 'none',
                background: 'white',
                textAlign: 'center',
              }}
              onInput={(e) => {
                editingValues.set(shape.id, (e.target as HTMLInputElement).value)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  e.stopPropagation()
                  const val = editingValues.get(shape.id) ?? label
                  editingValues.delete(shape.id)
                  if (val !== label) {
                    this.editor.updateShape<ProbePointShape>({
                      id: shape.id,
                      type: 'probe-point',
                      props: { pointData: { ...shape.props.pointData, label: val } },
                    })
                  }
                  this.editor.setEditingShape(null)
                }
                if (e.key === 'Escape') {
                  e.preventDefault()
                  e.stopPropagation()
                  editingValues.delete(shape.id)
                  this.editor.setEditingShape(null)
                }
              }}
            />
          </foreignObject>
        )}
      </SVGContainer>
    )
  }

  toSvg(shape: ProbePointShape) {
    const { label } = shape.props.pointData
    return (
      <g>
        {/* Filled dot for export */}
        <circle cx={0} cy={0} r={3} fill="#000" />
        {/* Label above */}
        <text x={0} y={-8} fontSize={11} fill={LABEL_COLOR} fontWeight="bold" textAnchor="middle">
          {label}
        </text>
      </g>
    )
  }

  getIndicatorPath(_shape: ProbePointShape) {
    return undefined
  }
}
