import { describe, it, expect } from 'vitest'
import { generateCSV } from '../csvExport'
import type { Chamber, ProbePointData } from '@/types'

const testChamber: Chamber = {
  type: 'cuboid',
  name: '测试设备',
  dimensions: { width: 1000, depth: 600, height: 800, layers: 2 },
}

const testPoints: ProbePointData[] = [
  { label: 'T1', position: { x: 100, y: 100, z: 200 }, properties: {} },
  { label: 'T2', position: { x: 500, y: 300, z: 600 }, properties: {} },
  { label: 'T3', position: { x: 900, y: 500, z: 400 }, properties: {} },
]

describe('generateCSV', () => {
  it('generates CSV with header and metadata', () => {
    const csv = generateCSV(testChamber, testPoints)
    expect(csv).toContain('设备名称')
    expect(csv).toContain('测试设备')
    expect(csv).toContain('布点数量')
    expect(csv).toContain('3')
    expect(csv).toContain('序号,标签')
  })

  it('includes all point coordinates', () => {
    const csv = generateCSV(testChamber, testPoints)
    expect(csv).toContain('T1')
    expect(csv).toContain('T2')
    expect(csv).toContain('T3')
    expect(csv).toContain('100')
    expect(csv).toContain('500')
    expect(csv).toContain('900')
  })

  it('handles empty points array', () => {
    const csv = generateCSV(testChamber, [])
    expect(csv).toContain('布点数量')
    expect(csv).toContain('0')
    expect(csv).toContain('序号,标签')
  })

  it('includes fixed shapes nearby labels', () => {
    const fixedShapes = [
      { type: 'drain-port', position: { x: 100, y: 100, z: 200 }, label: '排水口' },
    ]
    const csv = generateCSV(testChamber, testPoints, fixedShapes)
    expect(csv).toContain('靠近排水口')
  })

  it('marks points at fixed shape positions', () => {
    const pointsAtDrain: ProbePointData[] = [
      { label: 'T1', position: { x: 100, y: 100, z: 200 }, properties: { type: 'at-drain-port' } },
    ]
    const csv = generateCSV(testChamber, pointsAtDrain)
    expect(csv).toContain('与排水口重合')
  })

  it('marks points at inlet port positions', () => {
    const pointsAtInlet: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 0, z: 400 }, properties: { type: 'at-inlet-port' } },
    ]
    const csv = generateCSV(testChamber, pointsAtInlet)
    expect(csv).toContain('与进气口重合')
  })

  it('marks points at built-in probe positions', () => {
    const pointsAtBIP: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 300, z: 400 }, properties: { type: 'at-built-in-probe' } },
    ]
    const csv = generateCSV(testChamber, pointsAtBIP)
    expect(csv).toContain('与自带探头重合')
  })

  it('generates correct position labels for 3-layer chamber', () => {
    const threeLayerChamber: Chamber = {
      type: 'cuboid',
      name: '三层设备',
      dimensions: { width: 1000, depth: 600, height: 900, layers: 3 },
    }
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 100, y: 100, z: 150 }, properties: {} }, // 下层
      { label: 'T2', position: { x: 500, y: 300, z: 450 }, properties: {} }, // 中层
      { label: 'T3', position: { x: 900, y: 500, z: 750 }, properties: {} }, // 上层
    ]
    const csv = generateCSV(threeLayerChamber, points)
    expect(csv).toContain('下层')
    expect(csv).toContain('中层')
    expect(csv).toContain('上层')
  })

  it('generates correct horizontal position labels', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 100, y: 300, z: 400 }, properties: {} }, // 左
      { label: 'T2', position: { x: 500, y: 300, z: 400 }, properties: {} }, // 中
      { label: 'T3', position: { x: 900, y: 300, z: 400 }, properties: {} }, // 右
    ]
    const csv = generateCSV(testChamber, points)
    expect(csv).toContain('左')
    expect(csv).toContain('中')
    expect(csv).toContain('右')
  })

  it('generates correct depth position labels', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 50, z: 400 }, properties: {} },  // 前
      { label: 'T2', position: { x: 500, y: 300, z: 400 }, properties: {} }, // 中
      { label: 'T3', position: { x: 500, y: 550, z: 400 }, properties: {} }, // 后
    ]
    const csv = generateCSV(testChamber, points)
    expect(csv).toContain('前')
    expect(csv).toContain('后')
  })

  it('nearby labels for inlet-port type', () => {
    const fixedShapes = [
      { type: 'inlet-port', position: { x: 500, y: 300, z: 400 }, label: '进气口' },
    ]
    const pointsNearInlet: ProbePointData[] = [
      { label: 'T1', position: { x: 510, y: 310, z: 410 }, properties: {} },
    ]
    const csv = generateCSV(testChamber, pointsNearInlet, fixedShapes)
    expect(csv).toContain('靠近进气口')
  })

  it('nearby labels for built-in-probe type', () => {
    const fixedShapes = [
      { type: 'built-in-probe', position: { x: 500, y: 300, z: 400 }, label: '自带探头' },
    ]
    const pointsNearBIP: ProbePointData[] = [
      { label: 'T1', position: { x: 510, y: 310, z: 410 }, properties: {} },
    ]
    const csv = generateCSV(testChamber, pointsNearBIP, fixedShapes)
    expect(csv).toContain('靠近自带探头')
  })

  it('nearby labels for unknown type', () => {
    const fixedShapes = [
      { type: 'custom-device', position: { x: 500, y: 300, z: 400 }, label: '自定义' },
    ]
    const pointsNear: ProbePointData[] = [
      { label: 'T1', position: { x: 510, y: 310, z: 410 }, properties: {} },
    ]
    const csv = generateCSV(testChamber, pointsNear, fixedShapes)
    expect(csv).toContain('靠近自定义')
  })

  it('points far from fixed shapes have no nearby label', () => {
    const fixedShapes = [
      { type: 'drain-port', position: { x: 0, y: 0, z: 0 }, label: '排水口' },
    ]
    const pointsFar: ProbePointData[] = [
      { label: 'T1', position: { x: 900, y: 500, z: 700 }, properties: {} },
    ]
    const csv = generateCSV(testChamber, pointsFar, fixedShapes)
    // Should not contain nearby label for this point
    const lines = csv.split('\n')
    const dataRow = lines.find((l) => l.includes('T1'))
    expect(dataRow).toBeDefined()
    // The last column (备注) should be empty
    expect(dataRow!.endsWith(',')).toBe(true)
  })

  it('handles chamber without layers property', () => {
    const noLayerChamber: Chamber = {
      type: 'cuboid',
      name: '无层数',
      dimensions: { width: 1000, depth: 600, height: 800 },
    }
    const csv = generateCSV(noLayerChamber, testPoints)
    expect(csv).toContain('层数')
    expect(csv).toContain('1')
  })

  it('escapes CSV values with commas', () => {
    const chamberWithComma: Chamber = {
      type: 'cuboid',
      name: '设备,测试',
      dimensions: { width: 1000, depth: 600, height: 800 },
    }
    const csv = generateCSV(chamberWithComma, [])
    expect(csv).toContain('"设备,测试"')
  })

  it('escapes CSV values with quotes', () => {
    const chamberWithQuote: Chamber = {
      type: 'cuboid',
      name: '设备"测试',
      dimensions: { width: 1000, depth: 600, height: 800 },
    }
    const csv = generateCSV(chamberWithQuote, [])
    expect(csv).toContain('"设备""测试"')
  })
})
