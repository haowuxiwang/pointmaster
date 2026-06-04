import { ShapeUtil, T, TLBaseShape, SVGContainer, Circle2d } from 'tldraw'
import type { ProbePointData } from '@/types'

type ProbePointShape = TLBaseShape<'probe-point', {
  w: number
  h: number
  pointData: ProbePointData
}>

// Track editing values across renders (keyed by shape ID)
const editingValues = new Map<string, string>()

// Engineering drawing style colors
const CIRCLE_COLOR = '#00bcd4' // Cyan - matches reference PDFs
const LABEL_COLOR = '#333333'  // Dark gray for readability
const CIRCLE_RADIUS = 7        // Screen-space radius for the open circle
const CIRCLE_STROKE = 1.5      // Stroke width for the circle

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
      radius: CIRCLE_RADIUS + 3,
      isFilled: true,
    })
  }

  component(shape: ProbePointShape) {
    const { pointData } = shape.props
    const { label } = pointData
    const isEditing = this.editor.getEditingShapeId() === shape.id

    return (
      <SVGContainer>
        {/* Open circle - engineering drawing style */}
        <circle
          cx={0}
          cy={0}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={CIRCLE_COLOR}
          strokeWidth={CIRCLE_STROKE}
        />
        {/* Small center dot for precise positioning */}
        <circle cx={0} cy={0} r={1} fill={CIRCLE_COLOR} />
        {/* Label positioned above the circle */}
        {isEditing ? (
          <foreignObject x={-30} y={-CIRCLE_RADIUS - 22} width={60} height={20}>
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
                  editingValues.delete(shape.id)
                  this.editor.setEditingShape(null)
                }
              }}
            />
          </foreignObject>
        ) : (
          <text
            x={0}
            y={-CIRCLE_RADIUS - 4}
            fontSize={11}
            fill={LABEL_COLOR}
            fontWeight="bold"
            textAnchor="middle"
          >
            {label}
          </text>
        )}
      </SVGContainer>
    )
  }

  toSvg(shape: ProbePointShape) {
    const { label } = shape.props.pointData
    return (
      <g>
        {/* Open circle - engineering drawing style */}
        <circle
          cx={0}
          cy={0}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={CIRCLE_COLOR}
          strokeWidth={CIRCLE_STROKE}
        />
        {/* Small center dot for precise positioning */}
        <circle cx={0} cy={0} r={1} fill={CIRCLE_COLOR} />
        {/* Label above the circle */}
        <text
          x={0}
          y={-CIRCLE_RADIUS - 4}
          fontSize={11}
          fill={LABEL_COLOR}
          fontWeight="bold"
          textAnchor="middle"
        >
          {label}
        </text>
      </g>
    )
  }

  getIndicatorPath(_shape: ProbePointShape) {
    return undefined
  }
}
