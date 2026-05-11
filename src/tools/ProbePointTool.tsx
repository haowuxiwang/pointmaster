import { StateNode, createShapeId } from 'tldraw'
import type { TLPointerEventInfo, TLStateNodeConstructor } from 'tldraw'

// ---- Idle state ----

class Idle extends StateNode {
  static override id = 'idle'

  override onEnter() {
    this.editor.setCursor({ type: 'cross', rotation: 0 })
  }

  override onPointerDown(_info: TLPointerEventInfo) {
    this.parent.transition('pointing')
  }

  override onCancel() {
    this.editor.setCurrentTool('select')
  }
}

// ---- Pointing state: creates the shape on enter, completes immediately ----

class Pointing extends StateNode {
  static override id = 'pointing'

  override onEnter() {
    const { editor } = this
    const point = editor.inputs.getCurrentPagePoint()

    // Find max existing label number to avoid duplicates
    const existing = editor
      .getCurrentPageShapes()
      .filter((s) => s.type === 'probe-point')
    let maxNum = 0
    for (const shape of existing) {
      const match = shape.props.pointData?.label?.match(/^T(\d+)$/)
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10))
      }
    }
    const label = `T${maxNum + 1}`

    const id = createShapeId()
    editor.markHistoryStoppingPoint(`creating_probe_point:${id}`)
    editor.createShape({
      id,
      type: 'probe-point',
      x: point.x,
      y: point.y,
      props: {
        w: 40,
        h: 40,
        pointData: {
          label,
          // TODO: Derive 3D position from 2D canvas coordinates
          // Currently using placeholder values; needs inverse isometric projection
          position: { x: 0, y: 0, z: 0 },
          properties: {},
        },
      },
    })

    editor.select(id)
    this.complete()
  }

  override onPointerUp() {
    this.complete()
  }

  override onInterrupt() {
    this.cancel()
  }

  override onCancel() {
    this.cancel()
  }

  private complete() {
    if (this.editor.getInstanceState().isToolLocked) {
      this.parent.transition('idle')
    } else {
      this.editor.setCurrentTool('select')
    }
  }

  private cancel() {
    this.editor.bail()
    this.parent.transition('idle')
  }
}

// ---- ProbePointTool (parent) ----

export class ProbePointTool extends StateNode {
  static override id = 'probe-point'
  static override initial = 'idle'
  static override children(): TLStateNodeConstructor[] {
    return [Idle, Pointing]
  }
}
