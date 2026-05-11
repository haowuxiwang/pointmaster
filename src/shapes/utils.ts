import { Point2D } from '@/types';

const ISO_ANGLE = Math.PI / 6;
const cosA = Math.cos(ISO_ANGLE);
const sinA = Math.sin(ISO_ANGLE);

export function isoProject(x: number, y: number, z: number, scale: number = 1): Point2D {
  return {
    x: (x - y) * cosA * scale,
    y: (x + y) * sinA * scale - z * scale,
  };
}

export function cuboidPath(w: number, d: number, h: number, scale: number = 0.2, layers: number = 1): { outline: string; layers: string } {
  const p = (x: number, y: number, z: number) => isoProject(x, y, z, scale);
  const v = [
    p(0, 0, 0), p(w, 0, 0), p(w, d, 0), p(0, d, 0),
    p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h),
  ];
  const lines: [Point2D, Point2D][] = [
    [v[0], v[1]], [v[1], v[2]], [v[2], v[3]], [v[3], v[0]], // bottom
    [v[4], v[5]], [v[5], v[6]], [v[6], v[7]], [v[7], v[4]], // top
    [v[0], v[4]], [v[1], v[5]], [v[2], v[6]], [v[3], v[7]], // vertical
  ];

  const outline = lines.map(([a, b]) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`).join(' ');

  // Layer lines
  let layerPaths = '';
  if (layers > 1) {
    const layerLineSegments: [Point2D, Point2D][] = [];
    for (let i = 1; i < layers; i++) {
      const z = (h * i) / layers;
      const layerV = [
        p(0, 0, z), p(w, 0, z), p(w, d, z), p(0, d, z),
      ];
      layerLineSegments.push(
        [layerV[0], layerV[1]],
        [layerV[1], layerV[2]],
        [layerV[2], layerV[3]],
        [layerV[3], layerV[0]],
      );
    }
    layerPaths = layerLineSegments.map(([a, b]) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`).join(' ');
  }

  return { outline, layers: layerPaths };
}

export function cylinderPath(
  radius: number,
  height: number,
  segments: number = 16,
  scale: number = 0.2,
  layers: number = 1,
): { outline: string; layers: string } {
  const p = (x: number, y: number, z: number) => isoProject(x, y, z, scale);
  const bottomPts: Point2D[] = [];
  const topPts: Point2D[] = [];
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments;
    const x = radius + radius * Math.cos(angle);
    const y = radius + radius * Math.sin(angle);
    bottomPts.push(p(x, y, 0));
    topPts.push(p(x, y, height));
  }
  const paths: string[] = [];
  // bottom ellipse
  paths.push(`M ${bottomPts[0].x} ${bottomPts[0].y}`);
  for (let i = 1; i < segments; i++) paths.push(`L ${bottomPts[i].x} ${bottomPts[i].y}`);
  paths.push('Z');
  // top ellipse
  paths.push(`M ${topPts[0].x} ${topPts[0].y}`);
  for (let i = 1; i < segments; i++) paths.push(`L ${topPts[i].x} ${topPts[i].y}`);
  paths.push('Z');
  // visible vertical lines (front half)
  for (let i = 0; i < segments / 2; i++) {
    paths.push(`M ${bottomPts[i].x} ${bottomPts[i].y} L ${topPts[i].x} ${topPts[i].y}`);
  }

  const outline = paths.join(' ');

  // Layer ellipses
  let layerPaths = '';
  if (layers > 1) {
    const layerPathParts: string[] = [];
    for (let l = 1; l < layers; l++) {
      const z = (height * l) / layers;
      const layerPts: Point2D[] = [];
      for (let i = 0; i < segments; i++) {
        const angle = (2 * Math.PI * i) / segments;
        const x = radius + radius * Math.cos(angle);
        const y = radius + radius * Math.sin(angle);
        layerPts.push(p(x, y, z));
      }
      layerPathParts.push(`M ${layerPts[0].x} ${layerPts[0].y}`);
      for (let i = 1; i < segments; i++) layerPathParts.push(`L ${layerPts[i].x} ${layerPts[i].y}`);
      layerPathParts.push('Z');
    }
    layerPaths = layerPathParts.join(' ');
  }

  return { outline, layers: layerPaths };
}
