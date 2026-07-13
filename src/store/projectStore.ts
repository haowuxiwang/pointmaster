import { create } from 'zustand';
import type { Chamber, ProbePointData, EquipmentTemplate, ProjectData, PlacementParams } from '@/types';
import { uniformPlacement } from '@/core/placement';
import { CHAMBER_SCALE, ViewMode, projections } from '@/core/projection/isometric';
import { generatePlacementDescription } from '@/utils/description';
import { hasPointData, POINT_SHAPE_TYPES } from '@/types';
import type { Editor, TLShapeId } from 'tldraw';
import { createShapeId } from 'tldraw';

/** Compute the chamber geometry offset (minX, minY) for the current projection */
function getChamberGeometryOffset(): { dx: number; dy: number } {
  const { chamber, viewMode } = useProjectStore.getState()
  const { width, depth, height } = chamber.dimensions
  const proj = projections[viewMode]
  const p = (x: number, y: number, z: number) => proj.project(x, y, z, CHAMBER_SCALE)
  const xs = [p(0,0,0).x, p(width,0,0).x, p(width,depth,0).x, p(0,depth,0).x,
              p(0,0,height).x, p(width,0,height).x, p(width,depth,height).x, p(0,depth,height).x]
  const ys = [p(0,0,0).y, p(width,0,0).y, p(width,depth,0).y, p(0,depth,0).y,
              p(0,0,height).y, p(width,0,height).y, p(width,depth,height).y, p(0,depth,height).y]
  return { dx: Math.min(...xs), dy: Math.min(...ys) }
}

function createPointShape(
  editor: Editor,
  chamberShapeId: TLShapeId,
  point: ProbePointData,
  index: number,
  shapeType: string = 'probe-point',
): void {
  const viewMode = useProjectStore.getState().viewMode
  const projected = projections[viewMode].project(point.position.x, point.position.y, point.position.z, CHAMBER_SCALE)
  const { dx, dy } = getChamberGeometryOffset()
  const pointId = createShapeId(`${shapeType}-${index}`)
  editor.createShape({
    id: pointId,
    type: shapeType as any,
    parentId: chamberShapeId,
    x: projected.x - dx,
    y: projected.y - dy,
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

/** Re-project all existing point shapes when view mode changes */
function reprojectShapes(editor: Editor): void {
  const viewMode = useProjectStore.getState().viewMode
  const projection = projections[viewMode]
  const { dx, dy } = getChamberGeometryOffset()
  const shapes = editor.getCurrentPageShapes()
  for (const shape of shapes) {
    if (!POINT_SHAPE_TYPES.has(shape.type)) continue
    const pd = (shape.props as any)?.pointData
    if (!pd?.position) continue
    const projected = projection.project(pd.position.x, pd.position.y, pd.position.z, CHAMBER_SCALE)
    editor.updateShape({
      id: shape.id,
      type: shape.type as any,
      x: projected.x - dx,
      y: projected.y - dy,
    })
  }
}

/** Create chamber shape on canvas (extracted for reuse) */
function createChamberShape(editor: Editor, chamber: Chamber): void {
  const shapes = editor.getCurrentPageShapes();
  editor.deleteShapes(shapes.map((s) => s.id));
  const chamberId = createShapeId('chamber');
  editor.createShape({
    id: chamberId,
    type: 'chamber',
    x: 100,
    y: 100,
    props: { w: 800, h: 600, chamberData: chamber },
  });
  useProjectStore.setState({ chamberShapeId: chamberId })
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
  viewMode: ViewMode;
  /** Pending project data waiting for editor to be ready (deferred load) */
  pendingProject: ProjectData | null;
  /** Pending template waiting for editor to be ready (deferred load) */
  pendingTemplate: EquipmentTemplate | null;
  /** Pending chamber waiting for editor to be ready (deferred load) */
  pendingChamber: Chamber | null;

  setEditor: (editor: Editor | null) => void;
  setProjectName: (name: string) => void;
  setChamber: (chamber: Chamber) => void;
  updateChamberDimensions: (dimensions: Partial<import('@/types').ChamberDimensions>, radius?: number) => void;
  setPoints: (points: ProbePointData[]) => void;
  addPoint: (point: ProbePointData) => void;
  removePoint: (label: string) => void;
  updatePoint: (label: string, updates: Partial<ProbePointData>) => void;
  updatePointPosition: (label: string, position: { x: number; y: number; z: number }) => void;
  setCurrentZLevel: (z: number) => void;
  setPointCount: (count: number) => void;
  setViewMode: (mode: ViewMode) => void;
  autoPlace: (params: PlacementParams) => void;
  uniformPlace: () => void;
  saveProject: () => ProjectData;
  loadProject: (data: ProjectData) => void;
  loadTemplate: (template: EquipmentTemplate) => void;
  flushPendingLoad: () => void;
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
  viewMode: 'isometric',
  pendingProject: null,
  pendingTemplate: null,
  pendingChamber: null,

  setEditor: (editor) => set({ editor }),
  setProjectName: (name) => set({ projectName: name }),
  setChamber: (chamber) => {
    const { editor } = get();
    set((s) => ({
      chamber,
      points: [],
      currentZLevel: Math.max(0, Math.min(s.currentZLevel, chamber.dimensions.height)),
      pendingChamber: null,
    }));

    if (editor) {
      createChamberShape(editor, chamber)
    } else {
      // Editor not ready — defer canvas rebuild
      set({ pendingChamber: chamber })
    }
  },
  updateChamberDimensions: (dimensionUpdates, radius) => {
    const { chamber, editor, chamberShapeId, points } = get();
    const oldDims = chamber.dimensions;

    const newDimensions = { ...oldDims, ...dimensionUpdates };
    const newChamber: Chamber = {
      ...chamber,
      dimensions: newDimensions,
      ...(radius !== undefined ? { radius } : {}),
    };

    // Scale existing points proportionally to new dimensions
    const scaleX = dimensionUpdates.width != null ? (dimensionUpdates.width ?? oldDims.width) / oldDims.width : 1;
    const scaleY = dimensionUpdates.depth != null ? (dimensionUpdates.depth ?? oldDims.depth) / oldDims.depth : 1;
    const scaleZ = dimensionUpdates.height != null ? (dimensionUpdates.height ?? oldDims.height) / oldDims.height : 1;

    const scaledPoints = points.map((p) => ({
      ...p,
      position: {
        x: Math.min(p.position.x * scaleX, newDimensions.width),
        y: Math.min(p.position.y * scaleY, newDimensions.depth),
        z: Math.min(p.position.z * scaleZ, newDimensions.height),
      },
    }));

    const newZLevel = Math.min(get().currentZLevel, newDimensions.height);

    set({
      chamber: newChamber,
      points: scaledPoints,
      currentZLevel: newZLevel,
    });

    // Update canvas: rebuild chamber shape and resync points
    if (editor && chamberShapeId) {
      editor.updateShape({
        id: chamberShapeId,
        type: 'chamber',
        props: { chamberData: newChamber },
      });

      syncPointsToCanvas(editor, chamberShapeId, newChamber, scaledPoints, []);
    }
  },
  setPoints: (points) => set({ points }),
  addPoint: (point) => {
    set((s) => ({ points: [...s.points, point] }))
    try {
      const { editor, chamberShapeId } = get()
      if (editor && chamberShapeId) {
        createPointShape(editor, chamberShapeId, point, get().points.length - 1)
      }
    } catch (err) {
      console.error('[projectStore] addPoint failed:', err)
    }
  },
  removePoint: (label) => {
    const { editor } = get()
    set((s) => ({ points: s.points.filter((p) => p.label !== label) }))
    try {
      if (editor) {
        // Only delete probe-point shapes (not drain-port/inlet-port/built-in-probe)
        const shape = editor.getCurrentPageShapes().find(
          (s) => s.type === 'probe-point' && hasPointData(s) && s.props.pointData.label === label
        )
        if (shape) editor.deleteShapes([shape.id])
      }
    } catch (err) {
      console.error('[projectStore] removePoint failed:', err)
    }
  },
  updatePoint: (label, updates) => {
    set((s) => ({
      points: s.points.map((p) => p.label === label ? { ...p, ...updates } : p),
    }))
    try {
      const { editor } = get()
      if (editor) {
        const shape = editor.getCurrentPageShapes().find(
          (s) => s.type === 'probe-point' && hasPointData(s) && s.props.pointData.label === label
        )
        if (shape && hasPointData(shape)) {
          editor.updateShape({ id: shape.id, type: shape.type as any, props: { pointData: { ...shape.props.pointData, ...updates } } })
        }
      }
    } catch (err) {
      console.error('[projectStore] updatePoint failed:', err)
    }
  },
  updatePointPosition: (label, position) => {
    set((s) => ({
      points: s.points.map((p) => p.label === label ? { ...p, position } : p),
    }))
    try {
      const { editor } = get()
      if (editor) {
        const shape = editor.getCurrentPageShapes().find(
          (s) => s.type === 'probe-point' && hasPointData(s) && s.props.pointData.label === label
        )
        if (shape && hasPointData(shape)) {
          const viewMode = get().viewMode
          const projected = projections[viewMode].project(position.x, position.y, position.z, CHAMBER_SCALE)
          const { dx, dy } = getChamberGeometryOffset()
          editor.updateShape({ id: shape.id, type: shape.type as any, x: projected.x - dx, y: projected.y - dy, props: { pointData: { ...shape.props.pointData, position } } })
        }
      }
    } catch (err) {
      console.error('[projectStore] updatePointPosition failed:', err)
    }
  },
  setCurrentZLevel: (z) => {
    const { chamber } = get()
    set({ currentZLevel: Math.max(0, Math.min(chamber.dimensions.height, z)) })
  },
  setPointCount: (count) => set({ pointCount: count }),
  setViewMode: (mode) => {
    set({ viewMode: mode })
    // Re-project all existing point shapes when view changes
    const { editor } = get()
    if (editor) {
      reprojectShapes(editor)
    }
  },

  autoPlace: (params) => {
    const { chamber, editor, chamberShapeId } = get();

    // Collect anchor points from canvas (drain ports, inlet ports, built-in probes)
    // These are device components placed by the user — they are NOT part of the placement budget.
    // When included, probe points will be placed nearby these positions.
    const anchorPoints: Array<{ position: import('@/types').Point3D; label: string; type: string }> = [];
    if (editor) {
      const shapes = editor.getCurrentPageShapes();
      for (const shape of shapes) {
        if (!hasPointData(shape) || !shape.props.pointData.position) continue;
        const pointData = shape.props.pointData;

        if (shape.type === 'drain-port' && params.includeDrainPorts) {
          anchorPoints.push({ position: pointData.position, label: pointData.label || '排水口', type: 'drain-port' });
        } else if (shape.type === 'inlet-port' && params.includeInletPorts) {
          anchorPoints.push({ position: pointData.position, label: pointData.label || '进气口', type: 'inlet-port' });
        } else if (shape.type === 'built-in-probe' && params.includeBuiltInProbes) {
          anchorPoints.push({ position: pointData.position, label: pointData.label || '自带探头', type: 'built-in-probe' });
        }
      }
    }

    const newPoints: ProbePointData[] = uniformPlacement(
      chamber,
      params.totalCount ?? 12,
      { includeCenter: params.includeCenter ?? true, anchorPoints }
    );

    if (editor && chamberShapeId) {
      // Delete old probe shapes BEFORE setting new points, to avoid removed handler
      // from corrupting the new points array
      const existingProbes = editor.getCurrentPageShapes().filter((s) => s.type === 'probe-point')
      editor.deleteShapes(existingProbes.map((s) => s.id))
      // Now safe to set new points (added handler won't conflict with empty canvas)
      set({ points: newPoints })
      syncPointsToCanvas(editor, chamberShapeId, chamber, newPoints, anchorPoints)
    } else {
      set({ points: newPoints })
    }
  },

  saveProject: () => {
    const { projectName, chamber, points, createdAt, editor, currentZLevel, viewMode } = get();
    const now = new Date().toISOString();

    let drainPorts: ProbePointData[] = [];
    let inletPorts: ProbePointData[] = [];
    let builtInProbes: ProbePointData[] = [];
    let description: { content: string; x: number; y: number; w: number; h: number } | undefined;
    const dimensions: ProjectData['dimensions'] = [];
    const legends: ProjectData['legends'] = [];
    const annotations: ProjectData['annotations'] = [];

    if (editor) {
      for (const shape of editor.getCurrentPageShapes()) {
        const props = shape.props as any;
        if (hasPointData(shape) && shape.props.pointData) {
          const pd = shape.props.pointData;
          if (shape.type === 'drain-port') drainPorts.push(pd);
          else if (shape.type === 'inlet-port') inletPorts.push(pd);
          else if (shape.type === 'built-in-probe') builtInProbes.push(pd);
        } else if (shape.type === 'text-annotation') {
          if (shape.id === createShapeId('placement-desc')) {
            description = { content: props.content, x: shape.x, y: shape.y, w: props.w, h: props.h };
          } else {
            // User-created text annotation
            annotations.push({ content: props.content, fontSize: props.fontSize, x: shape.x, y: shape.y, w: props.w, h: props.h });
          }
        } else if (shape.type === 'dimension') {
          dimensions.push({ from: props.from, to: props.to, label: props.label, x: shape.x, y: shape.y });
        } else if (shape.type === 'legend') {
          legends.push({ title: props.title, entries: props.entries, x: shape.x, y: shape.y });
        }
      }
    }

    return {
      version: '1.0', name: projectName, chamber, points,
      createdAt: createdAt ?? now, updatedAt: now,
      drainPorts, inletPorts, builtInProbes, description,
      currentZLevel, viewMode,
      dimensions, legends, annotations,
    };
  },

  uniformPlace: () => {
    const { chamber, editor, chamberShapeId, pointCount } = get();

    // Collect all device shapes as anchor points (for nearby placement)
    const anchorPoints: Array<{ position: import('@/types').Point3D; label: string; type: string }> = [];
    if (editor) {
      for (const shape of editor.getCurrentPageShapes()) {
        if (hasPointData(shape) && shape.props.pointData.position) {
          const pointData = shape.props.pointData;
          anchorPoints.push({
            position: pointData.position,
            label: pointData.label || shape.type,
            type: shape.type,
          });
        }
      }
    }

    const newPoints = uniformPlacement(chamber, pointCount, { anchorPoints });

    if (editor && chamberShapeId) {
      const existingProbes = editor.getCurrentPageShapes().filter((s) => s.type === 'probe-point')
      editor.deleteShapes(existingProbes.map((s) => s.id))
      set({ points: newPoints })
      syncPointsToCanvas(editor, chamberShapeId, chamber, newPoints, anchorPoints)
    } else {
      set({ points: newPoints })
    }
  },

  loadProject: (data) => {
    set({
      projectName: data.name,
      chamber: data.chamber,
      points: data.points,
      createdAt: data.createdAt,
      currentZLevel: data.currentZLevel !== undefined
        ? Math.max(0, Math.min(data.currentZLevel, data.chamber.dimensions.height))
        : Math.max(0, Math.min(get().currentZLevel, data.chamber.dimensions.height)),
      viewMode: data.viewMode ?? 'isometric',
      pendingProject: null,
      pendingTemplate: null,
    });

    const { editor } = get()
    if (!editor) {
      set({ pendingProject: data })
      return
    }
    if (editor) {
      const shapes = editor.getCurrentPageShapes()
      editor.deleteShapes(shapes.map((s) => s.id))

      const chamberId = createShapeId('chamber')
      editor.createShape({
        id: chamberId,
        type: 'chamber',
        x: 100,
        y: 100,
        props: { w: 800, h: 600, chamberData: data.chamber },
      })
      set({ chamberShapeId: chamberId })

      // Rebuild point shapes
      data.points.forEach((point, index) => {
        createPointShape(editor, chamberId, point, index)
      })

      // Restore fixed ports
      ;(data.drainPorts ?? []).forEach((pd, i) => {
        createPointShape(editor, chamberId, pd, i, 'drain-port')
      })
      ;(data.inletPorts ?? []).forEach((pd, i) => {
        createPointShape(editor, chamberId, pd, i, 'inlet-port')
      })
      ;(data.builtInProbes ?? []).forEach((pd, i) => {
        createPointShape(editor, chamberId, pd, i, 'built-in-probe')
      })

      // Restore description
      if (data.description) {
        editor.createShape({
          id: createShapeId('placement-desc'),
          type: 'text-annotation',
          x: data.description.x,
          y: data.description.y,
          props: { w: data.description.w ?? 300, h: data.description.h ?? 120, content: data.description.content, fontSize: 11 },
        })
      }

      // Restore dimensions
      ;(data.dimensions ?? []).forEach((d) => {
        editor.createShape({
          type: 'dimension',
          x: d.x,
          y: d.y,
          props: { from: d.from, to: d.to, label: d.label },
        })
      })

      // Restore legends
      ;(data.legends ?? []).forEach((l) => {
        editor.createShape({
          type: 'legend',
          x: l.x,
          y: l.y,
          props: { title: l.title, entries: l.entries },
        })
      })

      // Restore user annotations
      ;(data.annotations ?? []).forEach((a) => {
        editor.createShape({
          type: 'text-annotation',
          x: a.x,
          y: a.y,
          props: { content: a.content, fontSize: a.fontSize, w: a.w, h: a.h },
        })
      })
    }
  },
  loadTemplate: (template) => {
    const { editor } = get();
    set({
      chamber: template.chamber,
      points: [],
      projectName: template.name,
      currentZLevel: Math.max(0, Math.min(get().currentZLevel, template.chamber.dimensions.height)),
      createdAt: null,
      pendingProject: null,
      pendingTemplate: null,
    });

    if (!editor) {
      set({ pendingTemplate: template })
      return
    }
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

  flushPendingLoad: () => {
    const { pendingProject, pendingTemplate, pendingChamber, editor } = get()
    if (!editor) return

    if (pendingChamber) {
      set({ pendingChamber: null })
      createChamberShape(editor, pendingChamber)
    }
    if (pendingProject) {
      set({ pendingProject: null })
      get().loadProject(pendingProject)
    } else if (pendingTemplate) {
      set({ pendingTemplate: null })
      get().loadTemplate(pendingTemplate)
    }
  },
}));
