import { StateNode, createShapeId } from 'tldraw'
import type { TLPointerEventInfo, TLStateNodeConstructor } from 'tldraw'
import { pagePointToChamber3D } from './coordBridge'

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
      .filter((s) => s.type === 'inlet-port')
    let maxNum = 0
    for (const shape of existing) {
      const match = shape.props.label?.match(/^进气口(\d*)$/)
      if (match) {
        const num = match[1] ? parseInt(match[1], 10) : 1
        maxNum = Math.max(maxNum, num)
      }
    }
    const label = maxNum === 0 ? '进气口' : `进气口${maxNum + 1}`

    const pos3D = pagePointToChamber3D(editor, point.x, point.y)
    const chamberShape = editor.getCurrentPageShapes().find((s) => s.type === 'chamber')

    const id = createShapeId()
    editor.markHistoryStoppingPoint(`creating_inlet_port:${id}`)
    editor.createShape({
      id,
      type: 'inlet-port',
      parentId: chamberShape?.id,
      x: point.x - (chamberShape?.x ?? 0),
      y: point.y - (chamberShape?.y ?? 0),
      props: {
        w: 30,
        h: 30,
        label,
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

export class InletPortTool extends StateNode {
  static override id = 'inlet-port'
  static override initial = 'idle'
  static override children(): TLStateNodeConstructor[] {
    return [Idle, Pointing]
  }
}
