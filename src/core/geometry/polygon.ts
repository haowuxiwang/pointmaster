import { Point2D, Point3D } from '@/types';

export function getPolygonVertices(baseVertices: Point2D[], height: number): Point3D[] {
  const vertices: Point3D[] = [];
  for (const v of baseVertices) vertices.push({ x: v.x, y: v.y, z: 0 });
  for (const v of baseVertices) vertices.push({ x: v.x, y: v.y, z: height });
  return vertices;
}

export function getPolygonEdges(vertexCount: number): [number, number][] {
  const edges: [number, number][] = [];
  const n = vertexCount;
  for (let i = 0; i < n; i++) edges.push([i, (i + 1) % n]);
  for (let i = 0; i < n; i++) edges.push([n + i, n + ((i + 1) % n)]);
  for (let i = 0; i < n; i++) edges.push([i, n + i]);
  return edges;
}
