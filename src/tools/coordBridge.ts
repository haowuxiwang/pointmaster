import type { Editor } from 'tldraw'
import { CHAMBER_SCALE, projections } from '@/core/projection/isometric'
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

  const { currentZLevel, chamber, viewMode } = useProjectStore.getState()
  const projection = projections[viewMode]

  // Convert chamber-relative screen coords to 3D chamber coordinates
  const pos = projection.unproject(offsetX, offsetY, currentZLevel, CHAMBER_SCALE)

  return {
    x: Math.max(0, Math.min(chamber.dimensions.width, pos.x)),
    y: Math.max(0, Math.min(chamber.dimensions.depth, pos.y)),
    z: Math.max(0, Math.min(chamber.dimensions.height, pos.z)),
  }
}
