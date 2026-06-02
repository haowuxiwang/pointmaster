import type { Editor } from 'tldraw'

export interface ExportMetadata {
  projectName: string
  chamberName: string
  pointCount: number
  date: string
}

export async function exportToSVG(editor: Editor, metadata?: ExportMetadata): Promise<string> {
  // Exit editing mode to avoid foreignObject issues in export
  editor.setEditingShape(null)

  const shapes = editor.getCurrentPageShapes()
  if (shapes.length === 0) {
    throw new Error('No shapes to export')
  }

  const result = await editor.getSvgString(shapes, { background: true, padding: 200 })
  if (!result) {
    throw new Error('Failed to generate SVG')
  }

  if (!metadata) return result.svg

  // Insert metadata header after the opening <svg> tag
  const headerLines = [
    `<g data-export-metadata="true">`,
    `  <text x="20" y="30" font-size="18" font-weight="bold" fill="#333">${metadata.projectName}</text>`,
    `  <text x="20" y="52" font-size="12" fill="#666">${metadata.chamberName} | ${metadata.pointCount} points | ${metadata.date}</text>`,
    `</g>`,
  ]

  const svgWithMeta = result.svg.replace(
    /(<svg[^>]*>)/,
    `$1\n${headerLines.join('\n')}`
  )

  return svgWithMeta
}
