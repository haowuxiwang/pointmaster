import { create } from 'zustand';
import { Chamber, ProbePointData, EquipmentTemplate, ProjectData, PlacementParams } from '@/types';
import { gridPlacement, uniformPlacement, keypointsPlacement } from '@/core/placement';
import type { Editor } from 'tldraw';
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
  createdAt: string | null;

  setEditor: (editor: Editor | null) => void;
  setProjectName: (name: string) => void;
  setChamber: (chamber: Chamber) => void;
  setPoints: (points: ProbePointData[]) => void;
  addPoint: (point: ProbePointData) => void;
  removePoint: (label: string) => void;
  updatePoint: (label: string, updates: Partial<ProbePointData>) => void;
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
    }
  },
  setPoints: (points) => set({ points }),
  addPoint: (point) => set((s) => ({ points: [...s.points, point] })),
  removePoint: (label) => set((s) => ({ points: s.points.filter((p) => p.label !== label) })),
  updatePoint: (label, updates) => set((s) => ({
    points: s.points.map((p) => p.label === label ? { ...p, ...updates } : p),
  })),
  setCurrentZLevel: (z) => set({ currentZLevel: z }),
  setPointCount: (count) => set({ pointCount: count }),

  autoPlace: (params) => {
    const { chamber } = get();
    let newPoints: ProbePointData[];
    switch (params.mode) {
      case 'grid':
        newPoints = gridPlacement(chamber, params.gridCounts ?? { x: 3, y: 2, z: 2 });
        break;
      case 'uniform':
        newPoints = uniformPlacement(chamber, params.totalCount ?? 12);
        break;
      case 'keypoints':
        newPoints = keypointsPlacement(chamber, {
          includeCenter: params.includeCenter,
          includeFaceCenters: params.includeFaceCenters,
        });
        break;
      case 'mixed': {
        const keypts = keypointsPlacement(chamber, { includeCenter: true, includeFaceCenters: true });
        const gridpts = gridPlacement(chamber, { x: 2, y: 2, z: 2 });
        newPoints = [...keypts, ...gridpts];
        break;
      }
      default:
        newPoints = [];
    }
    set({ points: newPoints });
  },

  saveProject: () => {
    const { projectName, chamber, points, createdAt } = get();
    const now = new Date().toISOString();
    return { version: '1.0', name: projectName, chamber, points, createdAt: createdAt ?? now, updatedAt: now };
  },

  uniformPlace: () => {
    const { chamber, editor, pointCount } = get();
    const newPoints = uniformPlacement(chamber, pointCount);
    set({ points: newPoints });

    if (editor) {
      // 清除现有点位形状
      const existingPoints = editor.getCurrentPageShapes().filter((s) => s.type === 'probe-point');
      editor.deleteShapes(existingPoints.map((s) => s.id));

      // 创建新的点位形状
      newPoints.forEach((point, index) => {
        const pointId = createShapeId(`probe-point-${index}`);
        editor.createShape({
          id: pointId,
          type: 'probe-point',
          x: 200 + (index % 4) * 80,
          y: 200 + Math.floor(index / 4) * 80,
          props: {
            w: 40,
            h: 40,
            pointData: point,
          },
        });
      });
    }
  },

  loadProject: (data) => set({
    projectName: data.name,
    chamber: data.chamber,
    points: data.points,
    createdAt: data.createdAt,
    currentZLevel: Math.min(get().currentZLevel, data.chamber.dimensions.height),
  }),
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
    }
  },
}));
