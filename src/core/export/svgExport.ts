import type { Editor } from 'tldraw'

export async function exportToSVG(editor: Editor): Promise<string> {
  // Exit editing mode to avoid foreignObject issues in export
  editor.setEditingShape(null)

  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) {
    throw new Error('No shapes to export')
  }

  const result = await editor.getSvgString(shapes, { background: true, padding: 60 })
  if (!result) {
    throw new Error('Failed to generate SVG')
  }

  return result.svg
}
