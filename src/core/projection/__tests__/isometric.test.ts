import { describe, it, expect } from 'vitest';
import { project3Dto2D, unproject2Dto3D, projectEllipse, CHAMBER_SCALE } from '../isometric';

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

describe('projectEllipse', () => {
  it('center matches project3Dto2D for same 3D point', () => {
    const cx3d = 200, cy3d = 150, z = 100, radius = 50;
    const ellipse = projectEllipse(cx3d, cy3d, z, radius, CHAMBER_SCALE);
    const point = project3Dto2D(cx3d, cy3d, z, CHAMBER_SCALE);
    expect(ellipse.cx).toBeCloseTo(point.x, 5);
    expect(ellipse.cy).toBeCloseTo(point.y, 5);
  });

  it('rx and ry are positive', () => {
    const ellipse = projectEllipse(100, 100, 0, 50, CHAMBER_SCALE);
    expect(ellipse.rx).toBeGreaterThan(0);
    expect(ellipse.ry).toBeGreaterThan(0);
  });

  it('rx > ry for isometric projection', () => {
    const ellipse = projectEllipse(100, 100, 0, 50, CHAMBER_SCALE);
    expect(ellipse.rx).toBeGreaterThan(ellipse.ry);
  });

  it('rx/ry ratio equals cosA/sinA', () => {
    const ellipse = projectEllipse(100, 100, 0, 50, CHAMBER_SCALE);
    const cosA = Math.cos(Math.PI / 6);
    const sinA = Math.sin(Math.PI / 6);
    expect(ellipse.rx / ellipse.ry).toBeCloseTo(cosA / sinA, 5);
  });
});
