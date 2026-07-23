/** 3D坐标 */
export interface Point3D {
  x: number
  y: number
  z: number
}

/** 2D坐标 */
export interface Point2D {
  x: number
  y: number
}

/** 腔室形状类型 */
export type ChamberType = 'cuboid' | 'cylinder' | 'polygon'

/** 腔室尺寸 */
export interface ChamberDimensions {
  width: number // mm
  depth: number // mm
  height: number // mm
  layers?: number // 层数，默认1
}

/** 管口定义 */
export interface Nozzle {
  name: string // e.g. '压缩空气', '排汽'
  position: Point3D // 3D position on the vessel
}

/** 房间内其他设备（仅视觉上下文，不参与布点） */
export interface RoomDevice {
  name: string
  dimensions: ChamberDimensions
  position: Point3D
}

/** 门的位置标记 */
export interface DoorMarker {
  position: Point3D
  label?: string
}

/** 房间视觉上下文（可选，仅用于渲染） */
export interface RoomContext {
  roomDimensions: ChamberDimensions
  offset: Point3D
  devices: RoomDevice[]
  doors: DoorMarker[]
}

/** 腔室定义 */
export interface Chamber {
  type: ChamberType
  name: string
  dimensions: ChamberDimensions
  radius?: number
  vertices?: Point2D[]
  ventPorts?: Point3D[] // 排气口/冷点位置
  nozzles?: Nozzle[]
  hasCoil?: boolean
  roomContext?: RoomContext
}

/** 探头点位 */
export interface ProbePointData {
  label: string // T1, T2, T3...
  position: Point3D // 腔室坐标系，单位mm
  properties: Record<string, string>
}

/** 标注类型 */
export type AnnotationType = 'text' | 'dimension' | 'legend'

/** 文字标注数据 */
export interface TextAnnotationData {
  content: string
  fontSize: number
}

/** 尺寸标注数据 */
export interface DimensionData {
  from: Point3D
  to: Point3D
  label: string
}

/** 图例数据 */
export interface LegendData {
  entries: Array<{ label: string; description: string }>
}

/** 项目数据 */
export interface ProjectData {
  version: string
  name: string
  chamber: Chamber
  points: ProbePointData[]
  createdAt: string
  updatedAt: string
  drainPorts?: ProbePointData[]
  inletPorts?: ProbePointData[]
  builtInProbes?: ProbePointData[]
  description?: { content: string; x: number; y: number; w?: number; h?: number }
  /** Current Z-axis slider position (mm) for restoring workspace state */
  currentZLevel?: number
  /** View mode for restoring workspace state */
  viewMode?: import('@/core/projection/isometric').ViewMode
  /** User-created dimension annotations */
  dimensions?: Array<{ from: Point3D; to: Point3D; label: string; x: number; y: number }>
  /** User-created legend */
  legends?: Array<{
    title: string
    entries: Array<{ label: string; description: string }>
    x: number
    y: number
  }>
  /** User-created text annotations (excluding placement-desc) */
  annotations?: Array<{
    content: string
    fontSize: number
    x: number
    y: number
    w?: number
    h?: number
  }>
}

/** 设备模板 */
export interface EquipmentTemplate {
  id: string
  name: string
  category: string
  chamber: Chamber
  defaultPointCount: number
}

/** 自动布点模式 */
export type PlacementMode = 'uniform'

/** 自动布点参数 */
export interface PlacementParams {
  mode: PlacementMode
  totalCount?: number
  includeCenter?: boolean
  includeDrainPorts?: boolean
  includeInletPorts?: boolean
  includeBuiltInProbes?: boolean
}

/** Shape types that carry pointData */
export type PointShapeType = 'probe-point' | 'drain-port' | 'inlet-port' | 'built-in-probe'

export const POINT_SHAPE_TYPES: ReadonlySet<string> = new Set<PointShapeType>([
  'probe-point',
  'drain-port',
  'inlet-port',
  'built-in-probe',
])

/** Type guard: check if a tldraw shape has pointData */
export function hasPointData(shape: {
  type: string
  props: Record<string, any>
}): shape is { type: PointShapeType; props: { pointData: ProbePointData } } {
  return (
    POINT_SHAPE_TYPES.has(shape.type) && 'pointData' in shape.props && shape.props.pointData != null
  )
}
