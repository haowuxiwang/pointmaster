import { describe, it, expect } from 'vitest'
import { builtinTemplates } from '../builtin'

describe('builtinTemplates', () => {
  it('contains 10 templates', () => {
    expect(builtinTemplates).toHaveLength(10)
  })

  it('each template has required fields', () => {
    builtinTemplates.forEach((template) => {
      expect(template.id).toBeTruthy()
      expect(template.name).toBeTruthy()
      expect(template.category).toBeTruthy()
      expect(template.chamber).toBeTruthy()
      expect(template.defaultPointCount).toBeGreaterThan(0)
    })
  })

  it('template IDs are unique', () => {
    const ids = builtinTemplates.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('chamber dimensions are positive numbers', () => {
    builtinTemplates.forEach((template) => {
      const { width, depth, height } = template.chamber.dimensions
      expect(width).toBeGreaterThan(0)
      expect(depth).toBeGreaterThan(0)
      expect(height).toBeGreaterThan(0)
    })
  })

  it('cylinder templates have radius', () => {
    const cylinderTemplates = builtinTemplates.filter((t) => t.chamber.type === 'cylinder')
    expect(cylinderTemplates.length).toBeGreaterThan(0)

    cylinderTemplates.forEach((template) => {
      expect(template.chamber.radius).toBeGreaterThan(0)
    })
  })

  it('ventPorts coordinates are within chamber bounds', () => {
    const templatesWithVents = builtinTemplates.filter((t) => t.chamber.ventPorts)
    expect(templatesWithVents.length).toBeGreaterThan(0)

    templatesWithVents.forEach((template) => {
      const { width, depth, height } = template.chamber.dimensions
      template.chamber.ventPorts!.forEach((port) => {
        expect(port.x).toBeGreaterThanOrEqual(0)
        expect(port.x).toBeLessThanOrEqual(width)
        expect(port.y).toBeGreaterThanOrEqual(0)
        expect(port.y).toBeLessThanOrEqual(depth)
        expect(port.z).toBeGreaterThanOrEqual(0)
        expect(port.z).toBeLessThanOrEqual(height)
      })
    })
  })

  it('has expected template IDs', () => {
    const ids = builtinTemplates.map((t) => t.id)
    expect(ids).toContain('sterilizer-pulsed-vacuum')
    expect(ids).toContain('sterilizer-vertical')
    expect(ids).toContain('sterilizer-tubular')
    expect(ids).toContain('freeze-dryer')
    expect(ids).toContain('warehouse')
    expect(ids).toContain('oven')
    expect(ids).toContain('seed-tank')
    expect(ids).toContain('fermenter-3stage')
    expect(ids).toContain('shaker-room')
  })

  it('layers are positive integers when specified', () => {
    builtinTemplates.forEach((template) => {
      if (template.chamber.dimensions.layers !== undefined) {
        expect(template.chamber.dimensions.layers).toBeGreaterThanOrEqual(1)
        expect(Number.isInteger(template.chamber.dimensions.layers)).toBe(true)
      }
    })
  })
})
