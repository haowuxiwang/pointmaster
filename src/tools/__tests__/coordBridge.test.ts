import { describe, it, expect, vi } from 'vitest'
import { pagePointToChamber3D } from '../coordBridge'
import { project3Dto2D, CHAMBER_SCALE } from '@/core/projection/isometric'

// Mock the store
vi.mock('@/store/projectStore', () => ({
  useProjectStore: {
    getState: () => ({
      currentZLevel: 400,
      viewMode: 'isometric',
      chamber: {
        type: 'cuboid',
        name: 'test',
        dimensions: { width: 1000, depth: 600, height: 800 },
      },
    }),
  },
}))

describe('pagePointToChamber3D', () => {
  const mockEditor = (chamberX = 100, chamberY = 100) => ({
    getCurrentPageShapes: () => [
      { type: 'chamber', x: chamberX, y: chamberY },
    ],
  })

  it('round-trips a known 3D point correctly', () => {
    const chamberX = 100
    const chamberY = 100
    const original = { x: 500, y: 300, z: 400 }
    const projected = project3Dto2D(original.x, original.y, original.z, CHAMBER_SCALE)
    const editor = mockEditor(chamberX, chamberY)
    const result = pagePointToChamber3D(
      editor as any,
      chamberX + projected.x,
      chamberY + projected.y,
    )
    expect(result.x).toBeCloseTo(original.x, 0)
    expect(result.y).toBeCloseTo(original.y, 0)
    expect(result.z).toBe(400)
  })

  it('clamps negative coordinates to zero', () => {
    const editor = mockEditor(100, 100)
    const result = pagePointToChamber3D(editor as any, 0, 0)
    expect(result.x).toBeGreaterThanOrEqual(0)
    expect(result.y).toBeGreaterThanOrEqual(0)
  })

  it('clamps coordinates beyond chamber dimensions', () => {
    const editor = mockEditor(100, 100)
    const result = pagePointToChamber3D(editor as any, 10000, 10000)
    expect(result.x).toBeLessThanOrEqual(1000)
    expect(result.y).toBeLessThanOrEqual(600)
  })

  it('uses default chamber position when no chamber shape found', () => {
    const editor = { getCurrentPageShapes: () => [] }
    const result = pagePointToChamber3D(editor as any, 100, 100)
    expect(result.z).toBe(400)
  })
})
