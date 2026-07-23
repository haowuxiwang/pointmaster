import { describe, it, expect } from 'vitest'
import {
  project3Dto2D,
  projectPoints,
  projections,
} from '../isometric'

describe('project3Dto2D', () => {
  it('origin projects to (0, 0)', () => {
    const result = project3Dto2D(0, 0, 0)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeCloseTo(0)
  })

  it('x-axis projects right-down', () => {
    const result = project3Dto2D(100, 0, 0)
    expect(result.x).toBeGreaterThan(0)
    expect(result.y).toBeGreaterThan(0)
  })

  it('y-axis projects left-down', () => {
    const result = project3Dto2D(0, 100, 0)
    expect(result.x).toBeLessThan(0)
    expect(result.y).toBeGreaterThan(0)
  })

  it('z-axis projects straight up', () => {
    const result = project3Dto2D(0, 0, 100)
    expect(result.x).toBeCloseTo(0)
    expect(result.y).toBeLessThan(0)
  })
})

describe('projectPoints', () => {
  it('projects array of 3D points to 2D', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 100, y: 0, z: 0 },
      { x: 0, y: 100, z: 0 },
    ]
    const result = projectPoints(points)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ x: 0, y: 0 })
    expect(result[1].x).toBeGreaterThan(0)
  })

  it('uses default scale when not provided', () => {
    const points = [{ x: 100, y: 0, z: 0 }]
    const result = projectPoints(points)
    const direct = project3Dto2D(100, 0, 0)
    expect(result[0]).toEqual(direct)
  })
})

describe('front projection', () => {
  it('front projection ignores y coordinate', () => {
    const front = projections.front
    const r1 = front.project(100, 0, 200, 0.2)
    const r2 = front.project(100, 500, 200, 0.2)
    expect(r1.x).toBeCloseTo(r2.x)
    expect(r1.y).toBeCloseTo(r2.y)
  })
})
