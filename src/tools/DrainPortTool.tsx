import { StateNode, createShapeId } from 'tldraw'
import type { TLPointerEventInfo, TLStateNodeConstructor } from 'tldraw'

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

class Pointing extends StateNode {
  static override id = 'pointing'

  override onEnter() {
    const { editor } = this
    const point = editor.inputs.getCurrentPagePoint()

    // Find max existing label number
    const existing = editor
      .getCurrentPageShapes()
      .filter((s) => s.type === 'drain-port')
    let maxNum = 0
    for (const shape of existing) {
      const match = shape.props.label?.match(/^D(\d+)$/)
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10))
      }
    }
    const label = `D${maxNum + 1}`

    const id = createShapeId()
    editor.markHistoryStoppingPoint(`creating_drain_port:${id}`)
    editor.createShape({
      id,
      type: 'drain-port',
      x: point.x,
      y: point.y,
      props: {
        w: 30,
        h: 30,
        label,
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

export class DrainPortTool extends StateNode {
  static override id = 'drain-port'
  static override initial = 'idle'
  static override children(): TLStateNodeConstructor[] {
    return [Idle, Pointing]
  }
}
