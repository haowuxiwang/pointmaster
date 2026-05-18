// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { exportToSVG } from '../svgExport'
import { exportToPNG } from '../pngExport'

// Mock Editor
function createMockEditor(hasShapes: boolean = true) {
  return {
    setEditingShape: () => {},
    getCurrentPageShapes: () => hasShapes ? [{ id: 'shape:1', type: 'probe-point' }] : [],
    getSvgString: async () => ({
      svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="white"/></svg>',
      width: 100,
      height: 100,
      trimPadding: 0,
    }),
    toImage: async () => ({
      blob: new Blob(['fake-png'], { type: 'image/png' }),
      width: 100,
      height: 100,
    }),
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
    const editor = {
      setEditingShape: () => {},
      getCurrentPageShapes: () => [{ id: 'shape:1' }],
      getSvgString: async () => undefined,
    } as any
    await expect(exportToSVG(editor)).rejects.toThrow('Failed to generate SVG')
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
    let capturedOpts: any = null
    const editor = {
      setEditingShape: () => {},
      getCurrentPageShapes: () => [{ id: 'shape:1' }],
      toImage: async (_shapes: any[], opts?: any) => {
        capturedOpts = opts
        return {
          blob: new Blob(['fake'], { type: 'image/png' }),
          width: 100,
          height: 100,
        }
      },
    } as any

    await exportToPNG(editor, 3)
    expect(capturedOpts).toEqual({
      format: 'png',
      pixelRatio: 3,
      background: true,
    })
  })
})
