import type { Editor } from 'tldraw'
import { unproject2Dto3D, CHAMBER_SCALE } from '@/core/projection/isometric'
import { useProjectStore } from '@/store/projectStore'
import type { Point3D } from '@/types'

const DEFAULT_CHAMBER_PAGE_X = 100
const DEFAULT_CHAMBER_PAGE_Y = 100

export function findChamberShape(editor: Editor) {
  return editor.getCurrentPageShapes().find(s => s.type === 'chamber')
}

export function pagePointToChamber3D(
  editor: Editor,
  pageX: number,
  pageY: number,
): Point3D {
  const chamberShape = findChamberShape(editor)
  const chamberOriginX = chamberShape?.x ?? DEFAULT_CHAMBER_PAGE_X
  const chamberOriginY = chamberShape?.y ?? DEFAULT_CHAMBER_PAGE_Y

  const offsetX = pageX - chamberOriginX
  const offsetY = pageY - chamberOriginY

  const { currentZLevel, chamber } = useProjectStore.getState()

  const pos2D = unproject2Dto3D(offsetX, offsetY, currentZLevel, CHAMBER_SCALE)

  return {
    x: Math.max(0, Math.min(chamber.dimensions.width, pos2D.x)),
    y: Math.max(0, Math.min(chamber.dimensions.depth, pos2D.y)),
    z: currentZLevel,
  }
}
