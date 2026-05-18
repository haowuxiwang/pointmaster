import { create } from 'zustand';
import { Chamber, ProbePointData, EquipmentTemplate, ProjectData, PlacementParams } from '@/types';
import { uniformPlacement } from '@/core/placement';
import { project3Dto2D, CHAMBER_SCALE } from '@/core/projection/isometric';
import { generatePlacementDescription } from '@/utils/description';
import type { Editor, TLShapeId } from 'tldraw';
import { createShapeId } from 'tldraw';

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
  removePoint: (label) => set((s) => ({ points: s.points.filter((p) => p.label !== label) })),
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
        }
      }
    }
    // Add vent ports from chamber data
    const ventPorts = chamber.ventPorts ?? [];
    ventPorts.forEach((pos, i) => {
      extraFixedPoints.push({ position: pos, label: `排气口${i + 1}`, type: 'vent-port' });
    });

    let newPoints: ProbePointData[] = uniformPlacement(chamber, params.totalCount ?? 12, extraFixedPoints);
    set({ points: newPoints });

    if (editor && chamberShapeId) {
      const existingPoints = editor.getCurrentPageShapes().filter((s) => s.type === 'probe-point');
      editor.deleteShapes(existingPoints.map((s) => s.id));

      // Get chamber position for absolute coordinates
      const chamberShape = editor.getShape(chamberShapeId)
      const chamberX = chamberShape?.x ?? 100
      const chamberY = chamberShape?.y ?? 100

      newPoints.forEach((point, index) => {
        const projected = project3Dto2D(point.position.x, point.position.y, point.position.z, CHAMBER_SCALE);
        const pointId = createShapeId(`probe-point-${index}`);
        editor.createShape({
          id: pointId,
          type: 'probe-point',
          x: chamberX + projected.x,
          y: chamberY + projected.y,
          props: {
            w: 40,
            h: 40,
            pointData: point,
          },
        });
      });

      // Switch to select tool after placing points
      editor.setCurrentTool('select')

      // Generate placement description
      const existingDesc = editor.getCurrentPageShapes().find(s => s.id === createShapeId('placement-desc'))
      if (existingDesc) editor.deleteShapes([existingDesc.id])
      const description = generatePlacementDescription(chamber, newPoints, extraFixedPoints)
      const descId = createShapeId('placement-desc')
      const descChamber = editor.getShape(chamberShapeId)
      editor.createShape({
        id: descId,
        type: 'text-annotation',
        x: (descChamber?.x ?? 100) + 820,
        y: (descChamber?.y ?? 100) + 50,
        props: { w: 300, h: 120, content: description, fontSize: 11 },
      })
    }
  },

  saveProject: () => {
    const { projectName, chamber, points, createdAt } = get();
    const now = new Date().toISOString();
    return { version: '1.0', name: projectName, chamber, points, createdAt: createdAt ?? now, updatedAt: now };
  },

  uniformPlace: () => {
    const { chamber, editor, chamberShapeId, pointCount } = get();
    const newPoints = uniformPlacement(chamber, pointCount);
    set({ points: newPoints });

    if (editor && chamberShapeId) {
      const existingPoints = editor.getCurrentPageShapes().filter((s) => s.type === 'probe-point');
      editor.deleteShapes(existingPoints.map((s) => s.id));

      // Get chamber position for absolute coordinates
      const chamberShape = editor.getShape(chamberShapeId)
      const chamberX = chamberShape?.x ?? 100
      const chamberY = chamberShape?.y ?? 100

      // Collect fixed shapes for description (drain ports, inlet ports, etc.)
      const fixedShapes: Array<{ position: import('@/types').Point3D; label: string; type: string }> = [];
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
          }
        }
      }
      // Add vent ports from chamber data
      const ventPorts = chamber.ventPorts ?? [];
      ventPorts.forEach((pos, i) => {
        fixedShapes.push({ position: pos, label: `排气口${i + 1}`, type: 'vent-port' });
      });

      newPoints.forEach((point, index) => {
        const projected = project3Dto2D(point.position.x, point.position.y, point.position.z, CHAMBER_SCALE);
        const pointId = createShapeId(`probe-point-${index}`);
        editor.createShape({
          id: pointId,
          type: 'probe-point',
          x: chamberX + projected.x,
          y: chamberY + projected.y,
          props: {
            w: 40,
            h: 40,
            pointData: point,
          },
        });
      });

      // Switch to select tool after placing points
      editor.setCurrentTool('select')

      // Generate placement description
      const existingDesc = editor.getCurrentPageShapes().find(s => s.id === createShapeId('placement-desc'))
      if (existingDesc) editor.deleteShapes([existingDesc.id])
      const description = generatePlacementDescription(chamber, newPoints, fixedShapes)
      const descId = createShapeId('placement-desc')
      const descChamber = editor.getShape(chamberShapeId)
      editor.createShape({
        id: descId,
        type: 'text-annotation',
        x: (descChamber?.x ?? 100) + 820,
        y: (descChamber?.y ?? 100) + 50,
        props: { w: 300, h: 120, content: description, fontSize: 11 },
      })
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

      // Rebuild point shapes as independent shapes
      data.points.forEach((point, index) => {
        const projected = project3Dto2D(point.position.x, point.position.y, point.position.z, CHAMBER_SCALE);
        const pointId = createShapeId(`probe-point-${index}`);
        editor.createShape({
          id: pointId,
          type: 'probe-point',
          x: 100 + projected.x,
          y: 100 + projected.y,
          props: { w: 40, h: 40, pointData: point },
        });
      });
    }
  },
  loadTemplate: (template) => {
    const { editor } = get();
    set({ chamber: template.chamber, points: [], projectName: template.name });

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
