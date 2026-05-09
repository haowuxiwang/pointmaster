import { describe, it, expect } from 'vitest';
import { getCuboidVertices, getCuboidEdges, getCuboidVisibleFaces } from '../cuboid';
import { getCylinderVertices, getCylinderEdges } from '../cylinder';
import { getPolygonVertices, getPolygonEdges } from '../polygon';

describe('cuboid', () => {
  const dims = { width: 1000, depth: 600, height: 800 };

  it('returns 8 vertices', () => {
    expect(getCuboidVertices(dims)).toHaveLength(8);
  });

  it('returns 12 edges', () => {
    expect(getCuboidEdges(dims)).toHaveLength(12);
  });

  it('visible faces returns 3 faces', () => {
    expect(getCuboidVisibleFaces(dims)).toHaveLength(3);
  });
});

describe('cylinder', () => {
  it('returns vertices for approximation', () => {
    const vertices = getCylinderVertices({ radius: 300, height: 1000 }, 16);
    expect(vertices.length).toBe(32); // 16 bottom + 16 top
  });

  it('returns edges', () => {
    const edges = getCylinderEdges(16);
    expect(edges.length).toBe(48); // 16 bottom + 16 top + 16 vertical
  });
});

describe('polygon', () => {
  const baseVertices = [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }, { x: 0, y: 100 }];

  it('returns vertices for prism', () => {
    const vertices = getPolygonVertices(baseVertices, 200);
    expect(vertices).toHaveLength(8); // 4 bottom + 4 top
  });

  it('returns edges', () => {
    const edges = getPolygonEdges(4);
    expect(edges).toHaveLength(12); // 4 bottom + 4 top + 4 vertical
  });
});
