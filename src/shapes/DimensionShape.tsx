import { ShapeUtil, T, TLBaseShape, SVGContainer, Rectangle2d } from 'tldraw'
import { project3Dto2D, CHAMBER_SCALE } from '@/core/projection/isometric'
import type { Point3D } from '@/types'

type DimensionShape = TLBaseShape<'dimension', {
  w: number
  h: number
  from: Point3D
  to: Point3D
  label: string
}>

export class DimensionShapeUtil extends ShapeUtil<DimensionShape> {
  static type = 'dimension' as const

  static props = {
    w: T.number,
    h: T.number,
    from: T.any as T.Validator<Point3D>,
    to: T.any as T.Validator<Point3D>,
    label: T.string,
  }

  override canEdit() {
    return true
  }

  getDefaultProps(): DimensionShape['props'] {
    return {
      w: 300,
      h: 60,
      from: { x: 0, y: 0, z: 0 },
      to: { x: 100, y: 0, z: 0 },
      label: '100mm',
    }
  }

  getGeometry(shape: DimensionShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: DimensionShape) {
    const { from, to, label } = shape.props
    const p1 = project3Dto2D(from.x, from.y, from.z, CHAMBER_SCALE)
    const p2 = project3Dto2D(to.x, to.y, to.z, CHAMBER_SCALE)
    const mx = (p1.x + p2.x) / 2
    const my = (p1.y + p2.y) / 2
    const isEditing = this.editor.getEditingShapeId() === shape.id

    return (
      <SVGContainer>
        <line
          x1={p1.x} y1={p1.y}
          x2={p2.x} y2={p2.y}
          stroke="#e74c3c"
          strokeWidth={1}
          strokeDasharray="4 2"
        />
        <circle cx={p1.x} cy={p1.y} r={3} fill="#e74c3c" />
        <circle cx={p2.x} cy={p2.y} r={3} fill="#e74c3c" />
        {isEditing ? (
          <foreignObject x={mx - 40} y={my - 20} width={80} height={20}>
            <input
              autoFocus
              defaultValue={label}
              style={{
                width: '100%',
                fontSize: '10px',
                color: '#e74c3c',
                border: '1px solid #e74c3c',
                borderRadius: '2px',
                padding: '1px 2px',
                outline: 'none',
                background: 'white',
                textAlign: 'center',
              }}
              onBlur={(e) => {
                const newLabel = (e.target as HTMLInputElement).value.trim()
                if (newLabel && newLabel !== label) {
                  this.editor.updateShape<DimensionShape>({
                    id: shape.id,
                    type: 'dimension',
                    props: { label: newLabel },
                  })
                }
                this.editor.setEditingShape(null)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newLabel = (e.target as HTMLInputElement).value.trim()
                  if (newLabel && newLabel !== label) {
                    this.editor.updateShape<DimensionShape>({
                      id: shape.id,
                      type: 'dimension',
                      props: { label: newLabel },
                    })
                  }
                  this.editor.setEditingShape(null)
                }
                if (e.key === 'Escape') {
                  this.editor.setEditingShape(null)
                }
                e.stopPropagation()
              }}
            />
          </foreignObject>
        ) : (
          <text
            x={mx} y={my - 8}
            fontSize={10}
            fill="#e74c3c"
            textAnchor="middle"
          >
            {label}
          </text>
        )}
      </SVGContainer>
    )
  }

  getIndicatorPath(_shape: DimensionShape) {
    return undefined
  }
}
