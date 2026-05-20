import { create } from 'zustand';
import { Chamber, ProbePointData, EquipmentTemplate, ProjectData, PlacementParams } from '@/types';
import { uniformPlacement } from '@/core/placement';
import { project3Dto2D, CHAMBER_SCALE } from '@/core/projection/isometric';
import { generatePlacementDescription } from '@/utils/description';
import type { Editor, TLShapeId } from 'tldraw';
import { createShapeId } from 'tldraw';

function createPointShape(
  editor: Editor,
  chamberShapeId: TLShapeId,
  point: ProbePointData,
  index: number,
  shapeType: string = 'probe-point',
): void {
  const projected = project3Dto2D(point.position.x, point.position.y, point.position.z, CHAMBER_SCALE)
  const pointId = createShapeId(`${shapeType}-${index}`)
  editor.createShape({
    id: pointId,
    type: shapeType as any,
    parentId: chamberShapeId,
    x: projected.x,
    y: projected.y,
    props: {
      w: 40,
      h: 40,
      pointData: point,
    },
  })
}

function syncPointsToCanvas(
  editor: Editor,
  chamberShapeId: TLShapeId,
  chamber: Chamber,
  newPoints: ProbePointData[],
  fixedShapes: Array<{ position: import('@/types').Point3D; label: string; type: string }>,
): void {
  // Only delete probe-point shapes, preserve device components (drain-port, inlet-port, built-in-probe)
  const existingProbes = editor.getCurrentPageShapes().filter((s) => s.type === 'probe-point')
  editor.deleteShapes(existingProbes.map((s) => s.id))

  // Create new point shapes
  newPoints.forEach((point, index) => {
    createPointShape(editor, chamberShapeId, point, index)
  })

  // Switch to select tool
  editor.setCurrentTool('select')

  // Generate placement description
  const existingDesc = editor.getCurrentPageShapes().find(s => s.id === createShapeId('placement-desc'))
  if (existingDesc) editor.deleteShapes([existingDesc.id])
  const description = generatePlacementDescription(chamber, newPoints, fixedShapes)
  const descId = createShapeId('placement-desc')
  const chamberPagePos = editor.getShapePageTransform(chamberShapeId)?.point()
  const chamberPageX = chamberPagePos?.x ?? 100
  const chamberPageY = chamberPagePos?.y ?? 100
  const chamberBottom = getChamberProjectedBottom(chamber)
  editor.createShape({
    id: descId,
    type: 'text-annotation',
    x: chamberPageX,
    y: chamberPageY + chamberBottom + 30,
    props: { w: 300, h: 120, content: description, fontSize: 11 },
  })

  // Zoom to fit all content including the description
  editor.zoomToFit({ animation: { duration: 300 } })
}

function getChamberProjectedBottom(chamber: Chamber): number {
  const { width, depth, height } = chamber.dimensions;
  const sinA = Math.sin(Math.PI / 6);
  const vertices = [
    { x: 0, y: 0, z: 0 }, { x: width, y: 0, z: 0 },
    { x: width, y: depth, z: 0 }, { x: 0, y: depth, z: 0 },
    { x: 0, y: 0, z: height }, { x: width, y: 0, z: height },
    { x: width, y: depth, z: height }, { x: 0, y: depth, z: height },
  ];
  let maxY = -Infinity;
  for (const v of vertices) {
    const projY = (v.x + v.y) * sinA * CHAMBER_SCALE - v.z * CHAMBER_SCALE;
    if (projY > maxY) maxY = projY;
  }
  return maxY;
}

interface ProjectState {
  projectName: string;
  chamber: Chamber;
  points: ProbePointData[];
  currentZLevel: number;
  pointCount: number;
  templates: EquipmentTemplate[];
  recentProjects: ProjectData[];
  editor: Editor | null;
  chamberShapeId: TLShapeId | null;
  createdAt: string | null;

  setEditor: (editor: Editor | null) => void;
  setProjectName: (name: string) => void;
  setChamber: (chamber: Chamber) => void;
  setPoints: (points: ProbePointData[]) => void;
  addPoint: (point: ProbePointData) => void;
  removePoint: (label: string) => void;
  updatePoint: (label: string, updates: Partial<ProbePointData>) => void;
  updatePointPosition: (label: string, position: { x: number; y: number; z: number }) => void;
  setCurrentZLevel: (z: number) => void;
  setPointCount: (count: number) => void;
  autoPlace: (params: PlacementParams) => void;
  uniformPlace: () => void;
  saveProject: () => ProjectData;
  loadProject: (data: ProjectData) => void;
  loadTemplate: (template: EquipmentTemplate) => void;
}

const defaultChamber: Chamber = {
  type: 'cuboid',
  name: '灭菌器',
  dimensions: { width: 1000, depth: 600, height: 800 },
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projectName: '未命名项目',
  chamber: defaultChamber,
  points: [],
  currentZLevel: 400,
  pointCount: 12,
  templates: [],
  recentProjects: [],
  editor: null,
  chamberShapeId: null,
  createdAt: null,

  setEditor: (editor) => set({ editor }),
  setProjectName: (name) => set({ projectName: name }),
  setChamber: (chamber) => {
    const { editor } = get();
    set((s) => ({
      chamber,
      points: [],
      currentZLevel: Math.min(s.currentZLevel, chamber.dimensions.height),
    }));

    if (editor) {
      // 清除现有形状
      const shapes = editor.getCurrentPageShapes();
      editor.deleteShapes(shapes.map((s) => s.id));

      // 创建设备形状
      const chamberId = createShapeId('chamber');
      editor.createShape({
        id: chamberId,
        type: 'chamber',
        x: 100,
        y: 100,
        props: {
          w: 800,
          h: 600,
          chamberData: chamber,
        },
      });
      set({ chamberShapeId: chamberId });
    }
  },
  setPoints: (points) => set({ points }),
  addPoint: (point) => set((s) => ({ points: [...s.points, point] })),
  removePoint: (label) => {
    const { editor } = get()
    set((s) => ({ points: s.points.filter((p) => p.label !== label) }))
    if (editor) {
      const shape = editor.getCurrentPageShapes().find(
        (s) => ['probe-point', 'drain-port', 'inlet-port', 'built-in-probe'].includes(s.type)
          && (s.props as any).pointData?.label === label
      )
      if (shape) editor.deleteShapes([shape.id])
    }
  },
  updatePoint: (label, updates) => set((s) => ({
    points: s.points.map((p) => p.label === label ? { ...p, ...updates } : p),
  })),
  updatePointPosition: (label, position) => set((s) => ({
    points: s.points.map((p) => p.label === label ? { ...p, position } : p),
  })),
  setCurrentZLevel: (z) => set({ currentZLevel: z }),
  setPointCount: (count) => set({ pointCount: count }),

  autoPlace: (params) => {
    const { chamber, editor, chamberShapeId } = get();

    // Collect extra fixed points from canvas (drain ports, inlet ports)
    const extraFixedPoints: Array<{ position: import('@/types').Point3D; label: string; type: string }> = [];
    if (editor) {
      const shapes = editor.getCurrentPageShapes();
      for (const shape of shapes) {
        if (shape.type === 'drain-port' && params.includeDrainPorts) {
          const pointData = (shape.props as any).pointData;
          if (pointData?.position) {
            extraFixedPoints.push({
              position: pointData.position,
              label: pointData.label || '排水口',
              type: 'drain-port',
            });
          }
        } else if (shape.type === 'inlet-port' && params.includeInletPorts) {
          const pointData = (shape.props as any).pointData;
          if (pointData?.position) {
            extraFixedPoints.push({
              position: pointData.position,
              label: pointData.label || '进气口',
              type: 'inlet-port',
            });
          }
        } else if (shape.type === 'built-in-probe' && params.includeBuiltInProbes) {
          const pointData = (shape.props as any).pointData;
          if (pointData?.position) {
            extraFixedPoints.push({
              position: pointData.position,
              label: pointData.label || '自身探头',
              type: 'built-in-probe',
            });
          }
        }
      }
    }
    // Note: vent ports are handled internally by uniformPlacement() from chamber.ventPorts
    // Do NOT push them into extraFixedPoints here to avoid double-counting

    let newPoints: ProbePointData[] = uniformPlacement(
      chamber,
      params.totalCount ?? 12,
      extraFixedPoints,
      { includeCenter: params.includeCenter ?? true }
    );
    set({ points: newPoints });

    if (editor && chamberShapeId) {
      syncPointsToCanvas(editor, chamberShapeId, chamber, newPoints, extraFixedPoints)
    }
  },

  saveProject: () => {
    const { projectName, chamber, points, createdAt, editor } = get();
    const now = new Date().toISOString();

    // Collect additional shapes from canvas
    let drainPorts: ProbePointData[] = [];
    let inletPorts: ProbePointData[] = [];
    let builtInProbes: ProbePointData[] = [];
    let description: { content: string; x: number; y: number } | undefined;

    if (editor) {
      for (const shape of editor.getCurrentPageShapes()) {
        const pd = (shape.props as any).pointData;
        if (shape.type === 'drain-port' && pd) drainPorts.push(pd);
        else if (shape.type === 'inlet-port' && pd) inletPorts.push(pd);
        else if (shape.type === 'built-in-probe' && pd) builtInProbes.push(pd);
        else if (shape.type === 'text-annotation' && shape.id === createShapeId('placement-desc')) {
          description = { content: (shape.props as any).content, x: shape.x, y: shape.y };
        }
      }
    }

    return {
      version: '1.0', name: projectName, chamber, points,
      createdAt: createdAt ?? now, updatedAt: now,
      drainPorts, inletPorts, builtInProbes, description,
    };
  },

  uniformPlace: () => {
    const { chamber, editor, chamberShapeId, pointCount } = get();

    // Collect fixed shapes for description and extraFixedPoints
    const fixedShapes: Array<{ position: import('@/types').Point3D; label: string; type: string }> = [];
    const extraFixedPoints: Array<{ position: import('@/types').Point3D; label: string; type: string }> = [];
    if (editor) {
      const allShapes = editor.getCurrentPageShapes();
      for (const shape of allShapes) {
        if (shape.type === 'drain-port' || shape.type === 'inlet-port' || shape.type === 'built-in-probe') {
          const pointData = (shape.props as any).pointData;
          if (pointData?.position) {
            fixedShapes.push({
              position: pointData.position,
              label: pointData.label || shape.type,
              type: shape.type,
            });
            if (shape.type === 'drain-port' || shape.type === 'inlet-port') {
              extraFixedPoints.push({
                position: pointData.position,
                label: pointData.label || shape.type,
                type: shape.type,
              });
            }
          }
        }
      }
    }
    // Add vent ports from chamber data
    const ventPorts = chamber.ventPorts ?? [];
    ventPorts.forEach((pos, i) => {
      fixedShapes.push({ position: pos, label: `排气口${i + 1}`, type: 'vent-port' });
    });

    const newPoints = uniformPlacement(chamber, pointCount, extraFixedPoints);
    set({ points: newPoints });

    if (editor && chamberShapeId) {
      syncPointsToCanvas(editor, chamberShapeId, chamber, newPoints, fixedShapes)
    }
  },

  loadProject: (data) => {
    set({
      projectName: data.name,
      chamber: data.chamber,
      points: data.points,
      createdAt: data.createdAt,
      currentZLevel: Math.min(get().currentZLevel, data.chamber.dimensions.height),
    });

    // Rebuild tldraw shapes
    const { editor } = get();
    if (editor) {
      const shapes = editor.getCurrentPageShapes();
      editor.deleteShapes(shapes.map((s) => s.id));

      const chamberId = createShapeId('chamber');
      editor.createShape({
        id: chamberId,
        type: 'chamber',
        x: 100,
        y: 100,
        props: { w: 800, h: 600, chamberData: data.chamber },
      });
      set({ chamberShapeId: chamberId });

      // Rebuild point shapes as child shapes of chamber
      data.points.forEach((point, index) => {
        createPointShape(editor, chamberId, point, index)
      });

      // Restore drain ports
      (data.drainPorts ?? []).forEach((pd, i) => {
        createPointShape(editor, chamberId, pd, i, 'drain-port')
      });

      // Restore inlet ports
      (data.inletPorts ?? []).forEach((pd, i) => {
        createPointShape(editor, chamberId, pd, i, 'inlet-port')
      });

      // Restore built-in probes
      (data.builtInProbes ?? []).forEach((pd, i) => {
        createPointShape(editor, chamberId, pd, i, 'built-in-probe')
      });

      // Restore description
      if (data.description) {
        editor.createShape({
          id: createShapeId('placement-desc'),
          type: 'text-annotation',
          x: data.description.x,
          y: data.description.y,
          props: { w: 300, h: 120, content: data.description.content, fontSize: 11 },
        })
      }
    }
  },
  loadTemplate: (template) => {
    const { editor } = get();
    set({
      chamber: template.chamber,
      points: [],
      projectName: template.name,
      currentZLevel: Math.min(get().currentZLevel, template.chamber.dimensions.height),
      createdAt: null,
    });

    if (editor) {
      // 清除现有形状
      const shapes = editor.getCurrentPageShapes();
      editor.deleteShapes(shapes.map((s) => s.id));

      // 创建设备形状
      const chamberId = createShapeId('chamber');
      editor.createShape({
        id: chamberId,
        type: 'chamber',
        x: 100,
        y: 100,
        props: {
          w: 800,
          h: 600,
          chamberData: template.chamber,
        },
      });
      set({ chamberShapeId: chamberId });
    }
  },
}));
