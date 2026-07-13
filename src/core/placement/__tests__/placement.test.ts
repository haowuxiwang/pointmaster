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
  const chamberWithVentPorts = {
    ...testChamber,
    ventPorts: [
      { x: 0, y: 0, z: 800 },
      { x: 1000, y: 0, z: 800 },
    ],
  };

  it('returns exactly totalCount points (no anchor points, with center)', () => {
    const points = uniformPlacement(testChamber, 12, { includeCenter: true });
    expect(points).toHaveLength(12);
  });

  it('returns exactly totalCount points (no anchor points, no center)', () => {
    const points = uniformPlacement(testChamber, 12, { includeCenter: false });
    expect(points).toHaveLength(12);
  });

  it('returns exactly totalCount with anchor points (anchor does not consume budget)', () => {
    const anchors = [
      { position: { x: 100, y: 100, z: 0 }, label: 'D1', type: 'drain-port' },
      { position: { x: 200, y: 200, z: 0 }, label: 'I1', type: 'inlet-port' },
    ];
    const points = uniformPlacement(testChamber, 12, { includeCenter: true, anchorPoints: anchors });
    expect(points).toHaveLength(12);
  });

  it('places a grid point exactly at anchor position (at-*)', () => {
    const anchors = [
      { position: { x: 100, y: 100, z: 400 }, label: 'D1', type: 'drain-port' },
    ];
    const points = uniformPlacement(testChamber, 12, { includeCenter: true, anchorPoints: anchors });
    const atPoints = points.filter((p) => p.properties.type === 'at-drain-port');
    expect(atPoints).toHaveLength(1);
    // The point should be exactly at the anchor position (0mm offset)
    expect(atPoints[0].position).toEqual({ x: 100, y: 100, z: 400 });
  });

  it('does not consume budget for anchor points', () => {
    // 8 corners + 1 center = 9 mandatory, remaining = 3 grid points
    // With 2 anchors, the total should still be 12 (anchors move existing grid points)
    const anchors = [
      { position: { x: 100, y: 100, z: 400 }, label: 'D1', type: 'drain-port' },
      { position: { x: 900, y: 500, z: 400 }, label: 'I1', type: 'inlet-port' },
    ];
    const points = uniformPlacement(testChamber, 12, { includeCenter: true, anchorPoints: anchors });
    expect(points).toHaveLength(12);
    const atPoints = points.filter((p) => p.properties.type?.startsWith('at-'));
    expect(atPoints).toHaveLength(2);
  });

  it('anchor overlap is exactly at anchor coordinates for multiple anchors', () => {
    const anchors = [
      { position: { x: 100, y: 100, z: 400 }, label: 'D1', type: 'drain-port' },
      { position: { x: 900, y: 500, z: 400 }, label: 'I1', type: 'inlet-port' },
    ];
    const points = uniformPlacement(testChamber, 12, { includeCenter: true, anchorPoints: anchors });
    const atDrain = points.filter((p) => p.properties.type === 'at-drain-port');
    const atInlet = points.filter((p) => p.properties.type === 'at-inlet-port');
    expect(atDrain).toHaveLength(1);
    expect(atInlet).toHaveLength(1);
    expect(atDrain[0].position).toEqual({ x: 100, y: 100, z: 400 });
    expect(atInlet[0].position).toEqual({ x: 900, y: 500, z: 400 });
  });

  it('keeps center only if budget allows after corners', () => {
    const points = uniformPlacement(testChamber, 8, { includeCenter: true });
    expect(points).toHaveLength(8);
    const centers = points.filter((p) => p.properties.type === 'center');
    expect(centers).toHaveLength(0);
  });

  it('returns exactly totalCount with multi-layer grid', () => {
    const chamber = {
      ...testChamber,
      dimensions: { width: 1000, depth: 600, height: 800, layers: 3 },
    };
    const points = uniformPlacement(chamber, 25, { includeCenter: true });
    expect(points).toHaveLength(25);
  });

  it('handles totalCount=1 correctly', () => {
    const points = uniformPlacement(testChamber, 1, { includeCenter: true });
    expect(points).toHaveLength(1);
  });

  it('labels are sequential T1, T2, ...', () => {
    const points = uniformPlacement(testChamber, 15, { includeCenter: true });
    points.forEach((p, i) => expect(p.label).toBe(`T${i + 1}`));
  });

  it('vent-ports are NOT placed automatically — total is exactly totalCount', () => {
    // Cold points (vent-ports) are only known after validation, not before
    const points = uniformPlacement(chamberWithVentPorts, 12, { includeCenter: true });
    expect(points).toHaveLength(12);
    const ventPoints = points.filter((p) => p.properties.type === 'vent-port');
    expect(ventPoints).toHaveLength(0);
  });

  it('shaker room: 12 points across 3 layers, 4 per layer', () => {
    const shakerChamber = {
      type: 'cuboid' as const,
      name: '摇瓶机',
      dimensions: { width: 1200, depth: 800, height: 1500, layers: 3 },
    };
    const points = uniformPlacement(shakerChamber, 12, { includeCenter: true });
    expect(points).toHaveLength(12);

    // Group points by layer (Z coordinate)
    const layerGroups: Record<number, typeof points> = {};
    for (const p of points) {
      const z = Math.round(p.position.z);
      if (!layerGroups[z]) layerGroups[z] = [];
      layerGroups[z].push(p);
    }

    const layerZs = Object.keys(layerGroups).map(Number).sort((a, b) => a - b);

    // Should have exactly 3 distinct Z values (layers)
    expect(layerZs).toHaveLength(3);

    // Each layer should have exactly 4 points
    for (const z of layerZs) {
      expect(layerGroups[z]).toHaveLength(4);
    }
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
