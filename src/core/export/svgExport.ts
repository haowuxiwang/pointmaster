import type { Editor } from 'tldraw'

export interface ExportMetadata {
  projectName: string
  chamberName: string
  pointCount: number
  date: string
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function exportToSVG(editor: Editor, metadata?: ExportMetadata): Promise<string> {
  // Save and exit editing mode to avoid foreignObject issues in export
  const prevEditingId = editor.getEditingShapeId()
  editor.setEditingShape(null)

  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) {
    if (prevEditingId) editor.setEditingShape(prevEditingId)
    throw new Error('No shapes to export')
  }

  try {
    const result = await editor.getSvgString(shapes, { background: true, padding: 200 })
    if (!result) {
      throw new Error('Failed to generate SVG')
    }

    if (!metadata) return result.svg

    // Insert metadata header after the opening <svg> tag
    const safeProjectName = escapeXml(metadata.projectName)
    const safeChamberName = escapeXml(metadata.chamberName)
    const headerLines = [
      `<g data-export-metadata="true">`,
      `  <text x="20" y="30" font-size="18" font-weight="bold" fill="#333">${safeProjectName}</text>`,
      `  <text x="20" y="52" font-size="12" fill="#666">${safeChamberName} | ${metadata.pointCount} points | ${metadata.date}</text>`,
      `</g>`,
    ]

    const svgWithMeta = result.svg.replace(
      /(<svg[\s\S]*?>)/,
      `$1\n${headerLines.join('\n')}`
    )

    return svgWithMeta
  } finally {
    // Restore editing state
    if (prevEditingId) {
      try { editor.setEditingShape(prevEditingId) } catch { /* best-effort */ }
    }
  }
}
