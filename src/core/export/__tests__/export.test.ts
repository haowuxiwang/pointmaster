// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { exportToSVG } from '../svgExport'
import { exportToPNG } from '../pngExport'

function createMockEditor(hasShapes: boolean = true) {
  return {
    setEditingShape: vi.fn(),
    getEditingShapeId: vi.fn(() => null),
    getCurrentPageShapes: vi.fn(() => (hasShapes ? [{ id: 'shape:1', type: 'probe-point' }] : [])),
    getSvgString: vi.fn(async () => ({
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/></svg>',
      width: 100,
      height: 100,
      trimPadding: 0,
    })),
    toImage: vi.fn(async () => ({
      blob: new Blob(['fake-png'], { type: 'image/png' }),
      width: 100,
      height: 100,
    })),
    createShape: vi.fn(() => ({ id: 'temp-shape' })),
    deleteShapes: vi.fn(),
  } as any
}

describe('exportToSVG', () => {
  it('returns valid SVG string from editor', async () => {
    const editor = createMockEditor(true)
    const result = await exportToSVG(editor)
    expect(result).toContain('<svg')
    expect(result).toContain('</svg>')
    expect(result).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('throws error when no shapes exist', async () => {
    const editor = createMockEditor(false)
    await expect(exportToSVG(editor)).rejects.toThrow('No shapes to export')
  })

  it('throws error when getSvgString returns undefined', async () => {
    const editor = createMockEditor(true)
    editor.getSvgString.mockResolvedValue(undefined)
    await expect(exportToSVG(editor)).rejects.toThrow('Failed to generate SVG')
  })

  it('adds metadata header when provided', async () => {
    const editor = createMockEditor(true)
    const metadata = {
      projectName: '测试项目',
      chamberName: '灭菌器',
      pointCount: 12,
      date: '20260722',
    }
    const result = await exportToSVG(editor, metadata)
    expect(result).toContain('<svg')
    expect(result).toContain('测试项目')
    expect(result).toContain('灭菌器')
    expect(result).toContain('12 points')
  })

  it('exits editing mode before export', async () => {
    const editor = createMockEditor(true)
    editor.getEditingShapeId.mockReturnValue('editing-shape')
    await exportToSVG(editor)
    expect(editor.setEditingShape).toHaveBeenCalledWith(null)
  })
})

describe('exportToPNG', () => {
  it('returns blob from editor', async () => {
    const editor = createMockEditor(true)
    const result = await exportToPNG(editor, 2)
    expect(result).toBeInstanceOf(Blob)
    expect(result.type).toBe('image/png')
  })

  it('throws error when no shapes exist', async () => {
    const editor = createMockEditor(false)
    await expect(exportToPNG(editor, 2)).rejects.toThrow('No shapes to export')
  })

  it('passes correct options to toImage', async () => {
    const editor = createMockEditor(true)
    await exportToPNG(editor, 3)
    expect(editor.toImage).toHaveBeenCalledWith(
      expect.any(Array),
      {
        format: 'png',
        pixelRatio: 3,
        background: true,
        padding: 200,
      },
    )
  })

  it('exits editing mode before export', async () => {
    const editor = createMockEditor(true)
    editor.getEditingShapeId.mockReturnValue('editing-shape')
    await exportToPNG(editor, 2)
    expect(editor.setEditingShape).toHaveBeenCalledWith(null)
  })

  it('restores editing mode after export', async () => {
    const editor = createMockEditor(true)
    editor.getEditingShapeId.mockReturnValue('editing-shape')
    await exportToPNG(editor, 2)
    expect(editor.setEditingShape).toHaveBeenCalledWith('editing-shape')
  })

  it('creates temporary metadata shape when metadata provided', async () => {
    const editor = createMockEditor(true)
    const metadata = {
      projectName: '测试项目',
      chamberName: '灭菌器',
      pointCount: 12,
      date: '20260722',
    }
    await exportToPNG(editor, 2, metadata)
    expect(editor.createShape).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'text-annotation',
        props: expect.objectContaining({
          content: expect.stringContaining('测试项目'),
        }),
      }),
    )
    // Cleanup should delete the temp shape
    expect(editor.deleteShapes).toHaveBeenCalled()
  })

  it('restores editing mode even when export fails', async () => {
    const editor = createMockEditor(true)
    editor.getEditingShapeId.mockReturnValue('editing-shape')
    editor.toImage.mockRejectedValue(new Error('export failed'))
    await expect(exportToPNG(editor, 2)).rejects.toThrow('export failed')
    expect(editor.setEditingShape).toHaveBeenCalledWith('editing-shape')
  })
})
