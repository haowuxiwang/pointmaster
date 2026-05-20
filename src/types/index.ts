/** 3D坐标 */
export interface Point3D {
  x: number;
  y: number;
  z: number;
}

/** 2D坐标 */
export interface Point2D {
  x: number;
  y: number;
}

/** 腔室形状类型 */
export type ChamberType = 'cuboid' | 'cylinder' | 'polygon';

/** 腔室尺寸 */
export interface ChamberDimensions {
  width: number;   // mm
  depth: number;   // mm
  height: number;  // mm
  layers?: number; // 层数，默认1
}

/** 管口定义 */
export interface Nozzle {
  name: string;       // e.g. '压缩空气', '排汽'
  position: Point3D;  // 3D position on the vessel
}

/** 腔室定义 */
export interface Chamber {
  type: ChamberType;
  name: string;
  dimensions: ChamberDimensions;
  radius?: number;
  vertices?: Point2D[];
  ventPorts?: Point3D[];  // 排气口/冷点位置
  nozzles?: Nozzle[];
  hasCoil?: boolean;
}

/** 探头点位 */
export interface ProbePointData {
  label: string;           // T1, T2, T3...
  position: Point3D;       // 腔室坐标系，单位mm
  properties: Record<string, string>;
}

/** 标注类型 */
export type AnnotationType = 'text' | 'dimension' | 'legend';

/** 文字标注数据 */
export interface TextAnnotationData {
  content: string;
  fontSize: number;
}

/** 尺寸标注数据 */
export interface DimensionData {
  from: Point3D;
  to: Point3D;
  label: string;
}

/** 图例数据 */
export interface LegendData {
  entries: Array<{ label: string; description: string }>;
}

/** 项目数据 */
export interface ProjectData {
  version: string;
  name: string;
  chamber: Chamber;
  points: ProbePointData[];
  createdAt: string;
  updatedAt: string;
  drainPorts?: ProbePointData[];
  inletPorts?: ProbePointData[];
  builtInProbes?: ProbePointData[];
  description?: { content: string; x: number; y: number };
}

/** 设备模板 */
export interface EquipmentTemplate {
  id: string;
  name: string;
  category: string;
  chamber: Chamber;
  defaultPointCount: number;
}

/** 自动布点模式 */
export type PlacementMode = 'uniform';

/** 自动布点参数 */
export interface PlacementParams {
  mode: PlacementMode;
  totalCount?: number;
  includeCenter?: boolean;
  includeDrainPorts?: boolean;
  includeInletPorts?: boolean;
  includeBuiltInProbes?: boolean;
}
