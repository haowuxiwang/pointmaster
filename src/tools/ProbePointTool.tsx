import { StateNode, createShapeId } from 'tldraw'
import type { TLPointerEventInfo, TLStateNodeConstructor } from 'tldraw'
import { pagePointToChamber3D } from './coordBridge'

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
    const existing = editor.getCurrentPageShapes().filter((s) => s.type === 'probe-point')
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
    const pos3D = pagePointToChamber3D(editor, point.x, point.y)
    const chamberShape = editor.getCurrentPageShapes().find((s) => s.type === 'chamber')

    editor.createShape({
      id,
      type: 'probe-point',
      parentId: chamberShape?.id,
      x: point.x - (chamberShape?.x ?? 0),
      y: point.y - (chamberShape?.y ?? 0),
      props: {
        w: 40,
        h: 40,
        pointData: {
          label,
          position: pos3D,
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
    // Stay in tool for continuous placement
    this.parent.transition('idle')
  }

  private cancel() {
    this.editor.bail()
    this.editor.setCurrentTool('select')
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
