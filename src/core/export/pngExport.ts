import type { Editor } from 'tldraw'

export async function exportToPNG(editor: Editor, scale: number = 2): Promise<Blob> {
  // Exit editing mode to avoid foreignObject issues in export
  editor.setEditingShape(null)

  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) {
    throw new Error('No shapes to export')
  }

  const result = await editor.toImage(shapes, {
    format: 'png',
    pixelRatio: scale,
    background: true,
  })

  return result.blob
}
