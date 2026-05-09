import { describe, it, expect } from 'vitest';
import { gridPlacement } from '../grid';
import { uniformPlacement } from '../uniform';
import { keypointsPlacement } from '../keypoints';

const testChamber = {
  type: 'cuboid' as const,
  name: 'test',
  dimensions: { width: 1000, depth: 600, height: 800 },
};

describe('gridPlacement', () => {
  it('generates correct number of points', () => {
    expect(gridPlacement(testChamber, { x: 2, y: 2, z: 2 })).toHaveLength(8);
  });
  it('labels are sequential T1, T2, ...', () => {
    const points = gridPlacement(testChamber, { x: 2, y: 2, z: 2 });
    points.forEach((p, i) => expect(p.label).toBe(`T${i + 1}`));
  });
  it('points are within chamber bounds', () => {
    const points = gridPlacement(testChamber, { x: 3, y: 3, z: 3 });
    for (const p of points) {
      expect(p.position.x).toBeGreaterThan(0);
      expect(p.position.x).toBeLessThan(testChamber.dimensions.width);
      expect(p.position.y).toBeGreaterThan(0);
      expect(p.position.y).toBeLessThan(testChamber.dimensions.depth);
      expect(p.position.z).toBeGreaterThan(0);
      expect(p.position.z).toBeLessThan(testChamber.dimensions.height);
    }
  });
});

describe('uniformPlacement', () => {
  it('generates points', () => {
    const points = uniformPlacement(testChamber, 12);
    expect(points.length).toBeGreaterThan(0);
    expect(points.length).toBeLessThanOrEqual(20);
  });
});

describe('keypointsPlacement', () => {
  it('generates 8 corners + center by default', () => {
    expect(keypointsPlacement(testChamber, { includeCenter: true, includeFaceCenters: false })).toHaveLength(9);
  });
  it('generates 8 corners + center + 6 face centers', () => {
    expect(keypointsPlacement(testChamber, { includeCenter: true, includeFaceCenters: true })).toHaveLength(15);
  });
});
