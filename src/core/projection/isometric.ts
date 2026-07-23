import { Point2D, Point3D } from '@/types'

/** 等轴测投影角度 (30度) */
export const ISO_ANGLE = Math.PI / 6

/** 默认缩放因子 */
export const DEFAULT_SCALE = 0.5

/** Chamber rendering scale used by ChamberShape and coordinate bridging */
export const CHAMBER_SCALE = 0.2

/** Ellipse minor-axis compression ratio for cylinder 2D front view */
export const CYLINDER_COMPRESSION = 0.35

const cosA = Math.cos(ISO_ANGLE)
const sinA = Math.sin(ISO_ANGLE)

/**
 * 3D坐标 → 2D屏幕坐标（等轴测投影）
 */
export function project3Dto2D(
  x: number,
  y: number,
  z: number,
  scale: number = DEFAULT_SCALE,
): Point2D {
  return {
    x: (x - y) * cosA * scale,
    y: (x + y) * sinA * scale - z * scale,
  }
}

/**
 * 2D屏幕坐标 → 3D坐标（需要已知z值）
 */
export function unproject2Dto3D(
  sx: number,
  sy: number,
  z: number,
  scale: number = DEFAULT_SCALE,
): Point2D {
  const scaledSx = sx / scale
  const scaledSy = (sy + z * scale) / scale
  const a = scaledSx / cosA
  const b = scaledSy / sinA
  return {
    x: (a + b) / 2,
    y: (b - a) / 2,
  }
}

/**
 * 将3D点数组投影为2D点
 */
export function projectPoints(points3D: Point3D[], scale: number = DEFAULT_SCALE): Point2D[] {
  return points3D.map((p) => project3Dto2D(p.x, p.y, p.z, scale))
}

// ─── Multi-view projection system ───────────────────────────────────

export type ViewMode = 'isometric' | 'front'

export interface Projection {
  project(x: number, y: number, z: number, scale: number): Point2D
  unproject(sx: number, sy: number, z: number, scale: number): Point2D
  cameraDir: { x: number; y: number; z: number }
}

const isoProjection: Projection = {
  project: project3Dto2D,
  unproject: unproject2Dto3D,
  cameraDir: { x: 1, y: 1, z: 1 },
}

const frontProjection: Projection = {
  project: (x, _y, z, scale) => ({ x: x * scale, y: -z * scale }),
  unproject: (sx, sy, _z, scale) => ({ x: sx / scale, y: -sy / scale }),
  cameraDir: { x: 0, y: -1, z: 0 },
}

export const projections: Record<ViewMode, Projection> = {
  isometric: isoProjection,
  front: frontProjection,
}
