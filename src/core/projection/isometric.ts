import { Point2D, Point3D } from '@/types';

/** 等轴测投影角度 (30度) */
export const ISO_ANGLE = Math.PI / 6;

/** 默认缩放因子 */
export const DEFAULT_SCALE = 0.5;

/** Chamber rendering scale used by ChamberShape and coordinate bridging */
export const CHAMBER_SCALE = 0.2;

const cosA = Math.cos(ISO_ANGLE);
const sinA = Math.sin(ISO_ANGLE);

/**
 * 3D坐标 → 2D屏幕坐标（等轴测投影）
 */
export function project3Dto2D(
  x: number,
  y: number,
  z: number,
  scale: number = DEFAULT_SCALE
): Point2D {
  return {
    x: (x - y) * cosA * scale,
    y: (x + y) * sinA * scale - z * scale,
  };
}

/**
 * 2D屏幕坐标 → 3D坐标（需要已知z值）
 */
export function unproject2Dto3D(
  sx: number,
  sy: number,
  z: number,
  scale: number = DEFAULT_SCALE
): Point2D {
  const scaledSx = sx / scale;
  const scaledSy = (sy + z * scale) / scale;
  const a = scaledSx / cosA;
  const b = scaledSy / sinA;
  return {
    x: (a + b) / 2,
    y: (b - a) / 2,
  };
}

/**
 * 将3D点数组投影为2D点
 */
export function projectPoints(
  points3D: Point3D[],
  scale: number = DEFAULT_SCALE
): Point2D[] {
  return points3D.map(p => project3Dto2D(p.x, p.y, p.z, scale));
}

/**
 * Project a 3D circle (in XY plane) to an SVG ellipse under isometric projection.
 * Returns center, rx, ry for SVG ellipse/arc commands.
 */
export function projectEllipse(
  cx3d: number,
  cy3d: number,
  z: number,
  radius: number,
  scale: number = DEFAULT_SCALE
): { cx: number; cy: number; rx: number; ry: number } {
  const center = project3Dto2D(cx3d, cy3d, z, scale);
  const rx = radius * Math.SQRT2 * cosA * scale;
  const ry = radius * Math.SQRT2 * sinA * scale;
  return { cx: center.x, cy: center.y, rx, ry };
}
