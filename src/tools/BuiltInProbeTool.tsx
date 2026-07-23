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
    const existing = editor.getCurrentPageShapes().filter((s) => s.type === 'built-in-probe')
    let maxNum = 0
    for (const shape of existing) {
      const match = shape.props.label?.match(/^自带探头(\d+)$/)
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1], 10))
      }
    }
    const label = `自带探头${maxNum + 1}`

    const pos3D = pagePointToChamber3D(editor, point.x, point.y)
    const chamberShape = editor.getCurrentPageShapes().find((s) => s.type === 'chamber')

    const id = createShapeId()
    editor.markHistoryStoppingPoint(`creating_built_in_probe:${id}`)
    editor.createShape({
      id,
      type: 'built-in-probe',
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

export class BuiltInProbeTool extends StateNode {
  static override id = 'built-in-probe'
  static override initial = 'idle'
  static override children(): TLStateNodeConstructor[] {
    return [Idle, Pointing]
  }
}
