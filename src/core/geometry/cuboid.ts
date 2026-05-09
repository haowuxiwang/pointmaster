import { Point3D, ChamberDimensions } from '@/types';

export function getCuboidVertices(dims: ChamberDimensions): Point3D[] {
  const { width: w, depth: d, height: h } = dims;
  return [
    { x: 0, y: 0, z: 0 },     // 0: front-left-bottom
    { x: w, y: 0, z: 0 },     // 1: front-right-bottom
    { x: w, y: d, z: 0 },     // 2: back-right-bottom
    { x: 0, y: d, z: 0 },     // 3: back-left-bottom
    { x: 0, y: 0, z: h },     // 4: front-left-top
    { x: w, y: 0, z: h },     // 5: front-right-top
    { x: w, y: d, z: h },     // 6: back-right-top
    { x: 0, y: d, z: h },     // 7: back-left-top
  ];
}

export function getCuboidEdges(dims: ChamberDimensions): [number, number][] {
  return [
    [0,1],[1,2],[2,3],[3,0],  // bottom
    [4,5],[5,6],[6,7],[7,4],  // top
    [0,4],[1,5],[2,6],[3,7],  // vertical
  ];
}

export function getCuboidVisibleFaces(dims: ChamberDimensions): Point3D[][] {
  const v = getCuboidVertices(dims);
  return [
    [v[4], v[5], v[6], v[7]], // top
    [v[0], v[1], v[5], v[4]], // front-right
    [v[0], v[4], v[7], v[3]], // front-left
  ];
}
