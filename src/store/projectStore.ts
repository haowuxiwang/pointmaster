import { create } from 'zustand';
import { Chamber, ProbePointData, EquipmentTemplate, ProjectData, PlacementParams } from '@/types';
import { gridPlacement, uniformPlacement, keypointsPlacement } from '@/core/placement';

interface ProjectState {
  projectName: string;
  chamber: Chamber;
  points: ProbePointData[];
  currentZLevel: number;
  templates: EquipmentTemplate[];
  recentProjects: ProjectData[];

  setProjectName: (name: string) => void;
  setChamber: (chamber: Chamber) => void;
  setPoints: (points: ProbePointData[]) => void;
  addPoint: (point: ProbePointData) => void;
  removePoint: (label: string) => void;
  updatePoint: (label: string, updates: Partial<ProbePointData>) => void;
  setCurrentZLevel: (z: number) => void;
  autoPlace: (params: PlacementParams) => void;
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
  templates: [],
  recentProjects: [],

  setProjectName: (name) => set({ projectName: name }),
  setChamber: (chamber) => set({ chamber, points: [] }),
  setPoints: (points) => set({ points }),
  addPoint: (point) => set((s) => ({ points: [...s.points, point] })),
  removePoint: (label) => set((s) => ({ points: s.points.filter((p) => p.label !== label) })),
  updatePoint: (label, updates) => set((s) => ({
    points: s.points.map((p) => p.label === label ? { ...p, ...updates } : p),
  })),
  setCurrentZLevel: (z) => set({ currentZLevel: z }),

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
    const { projectName, chamber, points } = get();
    const now = new Date().toISOString();
    return { version: '1.0', name: projectName, chamber, points, createdAt: now, updatedAt: now };
  },

  loadProject: (data) => set({ projectName: data.name, chamber: data.chamber, points: data.points }),
  loadTemplate: (template) => set({ chamber: template.chamber, points: [], projectName: template.name }),
}));
