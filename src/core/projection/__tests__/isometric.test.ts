import { describe, it, expect } from 'vitest';
import { project3Dto2D, unproject2Dto3D, CHAMBER_SCALE } from '../isometric';

describe('project3Dto2D', () => {
  it('origin projects to (0, 0)', () => {
    const result = project3Dto2D(0, 0, 0);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeCloseTo(0);
  });

  it('x-axis projects right-down', () => {
    const result = project3Dto2D(100, 0, 0);
    expect(result.x).toBeGreaterThan(0);
    expect(result.y).toBeGreaterThan(0);
  });

  it('y-axis projects left-down', () => {
    const result = project3Dto2D(0, 100, 0);
    expect(result.x).toBeLessThan(0);
    expect(result.y).toBeGreaterThan(0);
  });

  it('z-axis projects straight up', () => {
    const result = project3Dto2D(0, 0, 100);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeLessThan(0);
  });
});

describe('unproject2Dto3D', () => {
  it('round-trips with known z', () => {
    const original = { x: 200, y: 300, z: 150 };
    const projected = project3Dto2D(original.x, original.y, original.z);
    const unprojected = unproject2Dto3D(projected.x, projected.y, original.z);
    expect(unprojected.x).toBeCloseTo(original.x, 1);
    expect(unprojected.y).toBeCloseTo(original.y, 1);
  });
});

describe('CHAMBER_SCALE', () => {
  it('round-trips with chamber scale', () => {
    const original = { x: 500, y: 300, z: 400 };
    const projected = project3Dto2D(original.x, original.y, original.z, CHAMBER_SCALE);
    const unprojected = unproject2Dto3D(projected.x, projected.y, original.z, CHAMBER_SCALE);
    expect(unprojected.x).toBeCloseTo(original.x, 1);
    expect(unprojected.y).toBeCloseTo(original.y, 1);
  });
});

