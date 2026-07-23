import { type Editor, type TLShapeId } from 'tldraw'
import type { ExportMetadata } from './svgExport'

export async function exportToPNG(
  editor: Editor,
  scale: number = 2,
  metadata?: ExportMetadata,
): Promise<Blob> {
  // Save and exit editing mode to avoid foreignObject issues in export
  const prevEditingId = editor.getEditingShapeId()
  editor.setEditingShape(null)

  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) {
    if (prevEditingId) editor.setEditingShape(prevEditingId)
    throw new Error('No shapes to export')
  }

  // Create temporary metadata annotation if provided
  let tempShapeId: TLShapeId | null = null
  if (metadata) {
    const headerContent = `${metadata.projectName}\n${metadata.chamberName} | ${metadata.pointCount} points | ${metadata.date}`
    const created = editor.createShape({
      type: 'text-annotation',
      x: -180,
      y: -160,
      props: { w: 400, h: 60, content: headerContent, fontSize: 14 },
    })
    tempShapeId = created.id as TLShapeId
  }

  const allShapes = editor.getCurrentPageShapes()

  try {
    const result = await editor.toImage(allShapes, {
      format: 'png',
      pixelRatio: scale,
      background: true,
      padding: 200,
    })

    return result.blob
  } finally {
    // Clean up temporary shape (best-effort, don't mask original errors)
    if (tempShapeId) {
      try {
        editor.deleteShapes([tempShapeId])
      } catch {
        /* cleanup best-effort */
      }
    }
    // Restore editing state
    if (prevEditingId) {
      try {
        editor.setEditingShape(prevEditingId)
      } catch {
        /* best-effort */
      }
    }
  }
}
