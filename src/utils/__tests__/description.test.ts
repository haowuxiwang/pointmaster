import { describe, it, expect } from 'vitest';
import { generatePlacementDescription } from '../description';
import type { Chamber, ProbePointData } from '@/types';

const testChamber: Chamber = {
  type: 'cuboid',
  name: '脉动真空灭菌器',
  dimensions: { width: 1000, depth: 600, height: 800, layers: 2 },
};

describe('generatePlacementDescription', () => {
  const fixedShapes = [
    { type: 'drain-port', position: { x: 100, y: 100, z: 400 }, label: '排水口' },
    { type: 'inlet-port', position: { x: 900, y: 500, z: 400 }, label: '进气口' },
  ];

  it('generates header with device name and dimensions', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 300, z: 200 }, properties: {} },
    ];
    const desc = generatePlacementDescription(testChamber, points, fixedShapes);
    expect(desc).toContain('脉动真空灭菌器温度探头布点说明');
    expect(desc).toContain('1000×600×800mm');
    expect(desc).toContain('共布1个温度探头');
    expect(desc).toContain('分2层布置');
  });

  it('labels positions correctly for upper layer', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 300, z: 600 }, properties: {} },
    ];
    const desc = generatePlacementDescription(testChamber, points);
    expect(desc).toContain('T1 - 上层中央');
  });

  it('labels positions correctly for lower layer', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 200, y: 500, z: 200 }, properties: {} },
    ];
    const desc = generatePlacementDescription(testChamber, points);
    expect(desc).toContain('T1 - 下层左后');
  });

  it('detects at-drain-port type in point properties', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 100, y: 100, z: 400 }, properties: { type: 'at-drain-port' } },
    ];
    const desc = generatePlacementDescription(testChamber, points);
    expect(desc).toContain('与排水口重合');
  });

  it('detects at-inlet-port type in point properties', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 900, y: 500, z: 400 }, properties: { type: 'at-inlet-port' } },
    ];
    const desc = generatePlacementDescription(testChamber, points);
    expect(desc).toContain('与进气口重合');
  });

  it('detects at-built-in-probe type in point properties', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 300, z: 400 }, properties: { type: 'at-built-in-probe' } },
    ];
    const desc = generatePlacementDescription(testChamber, points, [
      { type: 'built-in-probe', position: { x: 500, y: 300, z: 400 }, label: '自带探头1' },
    ]);
    expect(desc).toContain('与自带探头重合');
  });

  it('detects vent-port type', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 0, y: 0, z: 800 }, properties: { type: 'vent-port' } },
    ];
    const desc = generatePlacementDescription(testChamber, points);
    expect(desc).toContain('排气口冷点');
  });

  it('falls back to distance-based check when no property type', () => {
    const points: ProbePointData[] = [
      // Position very close to drain-port (within 150mm threshold)
      { label: 'T1', position: { x: 105, y: 105, z: 400 }, properties: {} },
    ];
    const desc = generatePlacementDescription(testChamber, points, fixedShapes);
    expect(desc).toContain('靠近排水口');
  });

  it('no suffix when point is far from any fixed shape', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 300, z: 200 }, properties: {} },
    ];
    const desc = generatePlacementDescription(testChamber, points, fixedShapes);
    // Should not contain any nearby/at label
    expect(desc).not.toContain('靠近');
    expect(desc).not.toContain('重合');
  });

  it('always appends safety warning at end', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 300, z: 200 }, properties: {} },
    ];
    const desc = generatePlacementDescription(testChamber, points);
    expect(desc).toContain('所有探头不能接触盘管及罐壁');
  });

  it('handles single layer chamber', () => {
    const singleLayerChamber: Chamber = {
      type: 'cuboid',
      name: '烘箱',
      dimensions: { width: 800, depth: 600, height: 500 },
    };
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 50, y: 50, z: 50 }, properties: {} },
    ];
    const desc = generatePlacementDescription(singleLayerChamber, points);
    expect(desc).toContain('分1层布置');
    expect(desc).toContain('T1 - 左前');
  });

  it('groups multiple points correctly', () => {
    const points: ProbePointData[] = [
      { label: 'T1', position: { x: 500, y: 300, z: 600 }, properties: {} },
      { label: 'T2', position: { x: 200, y: 500, z: 200 }, properties: {} },
      { label: 'T3', position: { x: 800, y: 100, z: 200 }, properties: {} },
    ];
    const desc = generatePlacementDescription(testChamber, points);
    expect(desc).toContain('共布3个温度探头');
    expect(desc).toContain('T1 - 上层中央');
    expect(desc).toContain('T2 - 下层左后');
    expect(desc).toContain('T3 - 下层右前');
  });
});
