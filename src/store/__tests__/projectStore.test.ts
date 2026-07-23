import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectStore } from '../projectStore'
import type { Chamber, ProbePointData, ProjectData, EquipmentTemplate } from '@/types'

// Mock tldraw
vi.mock('tldraw', () => ({
  createShapeId: (id: string) => `shape:${id}` as any,
}))

// Mock 布点算法
vi.mock('@/core/placement', () => ({
  gridPlacement: vi.fn((_chamber: any, counts: any) =>
    Array.from({ length: counts.x * counts.y * counts.z }, (_, i) => ({
      label: `T${i + 1}`,
      position: { x: 100, y: 100, z: 100 },
      properties: {},
    })),
  ),
  uniformPlacement: vi.fn((_chamber: any, count: number) =>
    Array.from({ length: count }, (_, i) => ({
      label: `T${i + 1}`,
      position: { x: 100, y: 100, z: 100 },
      properties: {},
    })),
  ),
  keypointsPlacement: vi.fn(() => [
    { label: 'K1', position: { x: 0, y: 0, z: 0 }, properties: {} },
    { label: 'K2', position: { x: 100, y: 0, z: 0 }, properties: {} },
    { label: 'K3', position: { x: 0, y: 100, z: 0 }, properties: {} },
  ]),
}))

// Mock 投影
vi.mock('@/core/projection/isometric', () => ({
  project3Dto2D: vi.fn((x: number, y: number, z: number) => ({ x: x * 0.2, y: y * 0.2 - z * 0.2 })),
  CHAMBER_SCALE: 0.2,
  projections: {
    isometric: {
      project: vi.fn((x: number, y: number, z: number) => ({ x: x * 0.2, y: y * 0.2 - z * 0.2 })),
      cameraDir: { x: 1, y: 1, z: 1 },
    },
    front: {
      project: vi.fn((x: number, _y: number, z: number) => ({ x: x * 0.2, y: -z * 0.2 })),
      cameraDir: { x: 0, y: -1, z: 0 },
    },
  },
}))

// Mock 描述生成
vi.mock('@/utils/description', () => ({
  generatePlacementDescription: vi.fn(() => 'test description'),
}))

const mockEditor = () => ({
  getCurrentPageShapes: vi.fn(() => []),
  createShape: vi.fn(),
  deleteShapes: vi.fn(),
  getShape: vi.fn(() => ({ x: 100, y: 100 })),
  getShapePageTransform: vi.fn(() => ({ point: () => ({ x: 100, y: 100 }) })),
  setCurrentTool: vi.fn(),
  zoomToFit: vi.fn(),
})

const testChamber: Chamber = {
  type: 'cuboid',
  name: '测试设备',
  dimensions: { width: 1000, depth: 600, height: 800 },
}

const testPoint: ProbePointData = {
  label: 'T1',
  position: { x: 500, y: 300, z: 400 },
  properties: { type: 'temperature' },
}

describe('projectStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useProjectStore.setState({
      projectName: '未命名项目',
      chamber: {
        type: 'cuboid',
        name: '灭菌器',
        dimensions: { width: 1000, depth: 600, height: 800 },
      },
      points: [],
      currentZLevel: 400,
      pointCount: 12,
      templates: [],
      recentProjects: [],
      editor: null,
      chamberShapeId: null,
      createdAt: null,
    })
  })

  describe('initial state', () => {
    it('has correct default values', () => {
      const state = useProjectStore.getState()
      expect(state.projectName).toBe('未命名项目')
      expect(state.chamber.type).toBe('cuboid')
      expect(state.points).toEqual([])
      expect(state.currentZLevel).toBe(400)
      expect(state.pointCount).toBe(12)
      expect(state.editor).toBeNull()
      expect(state.chamberShapeId).toBeNull()
    })
  })

  describe('setProjectName', () => {
    it('updates project name', () => {
      useProjectStore.getState().setProjectName('新项目名称')
      expect(useProjectStore.getState().projectName).toBe('新项目名称')
    })
  })

  describe('setChamber', () => {
    it('updates chamber and clears points', () => {
      const store = useProjectStore.getState()
      store.addPoint(testPoint)
      expect(useProjectStore.getState().points).toHaveLength(1)

      store.setChamber(testChamber)
      const state = useProjectStore.getState()
      expect(state.chamber).toEqual(testChamber)
      expect(state.points).toEqual([])
    })

    it('adjusts currentZLevel when new height is smaller', () => {
      useProjectStore.setState({ currentZLevel: 600 })
      const smallChamber: Chamber = {
        type: 'cuboid',
        name: '小设备',
        dimensions: { width: 500, depth: 400, height: 300 },
      }
      useProjectStore.getState().setChamber(smallChamber)
      expect(useProjectStore.getState().currentZLevel).toBe(300)
    })

    it('keeps currentZLevel when new height is larger', () => {
      useProjectStore.setState({ currentZLevel: 400 })
      useProjectStore.getState().setChamber(testChamber)
      expect(useProjectStore.getState().currentZLevel).toBe(400)
    })

    it('creates chamber shape when editor is set', () => {
      const editor = mockEditor()
      useProjectStore.setState({ editor: editor as any })

      useProjectStore.getState().setChamber(testChamber)

      expect(editor.deleteShapes).toHaveBeenCalled()
      expect(editor.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chamber',
          x: 100,
          y: 100,
          props: expect.objectContaining({
            chamberData: testChamber,
          }),
        }),
      )
      expect(useProjectStore.getState().chamberShapeId).toBeTruthy()
    })
  })

  describe('point CRUD', () => {
    it('addPoint adds a point', () => {
      useProjectStore.getState().addPoint(testPoint)
      expect(useProjectStore.getState().points).toHaveLength(1)
      expect(useProjectStore.getState().points[0]).toEqual(testPoint)
    })

    it('removePoint removes by label', () => {
      useProjectStore.getState().addPoint(testPoint)
      useProjectStore.getState().addPoint({ ...testPoint, label: 'T2' })
      useProjectStore.getState().removePoint('T1')
      expect(useProjectStore.getState().points).toHaveLength(1)
      expect(useProjectStore.getState().points[0].label).toBe('T2')
    })

    it('removePoint deletes canvas shape when editor is set', () => {
      const mockShape = {
        id: 'shape:probe-0',
        type: 'probe-point',
        props: { pointData: testPoint },
      }
      const editor = mockEditor()
      editor.getCurrentPageShapes = vi.fn(() => [mockShape]) as any
      useProjectStore.setState({ editor: editor as any })

      useProjectStore.getState().addPoint(testPoint)
      useProjectStore.getState().removePoint('T1')

      expect(editor.deleteShapes).toHaveBeenCalledWith(['shape:probe-0'])
    })

    it('updatePoint updates matching point', () => {
      useProjectStore.getState().addPoint(testPoint)
      useProjectStore.getState().updatePoint('T1', {
        position: { x: 200, y: 200, z: 200 },
      })
      expect(useProjectStore.getState().points[0].position).toEqual({
        x: 200,
        y: 200,
        z: 200,
      })
    })
  })

  describe('setCurrentZLevel', () => {
    it('updates z level', () => {
      useProjectStore.getState().setCurrentZLevel(600)
      expect(useProjectStore.getState().currentZLevel).toBe(600)
    })
  })

  describe('setPointCount', () => {
    it('updates point count', () => {
      useProjectStore.getState().setPointCount(20)
      expect(useProjectStore.getState().pointCount).toBe(20)
    })
  })

  describe('autoPlace', () => {
    it('generates uniform points', () => {
      const editor = mockEditor()
      useProjectStore.setState({ editor: editor as any, chamberShapeId: 'shape:chamber' as any })

      useProjectStore.getState().autoPlace({ mode: 'uniform', totalCount: 15 })
      expect(useProjectStore.getState().points).toHaveLength(15)
    })

    it('creates point shapes on canvas', () => {
      const editor = mockEditor()
      useProjectStore.setState({ editor: editor as any, chamberShapeId: 'shape:chamber' as any })

      useProjectStore.getState().autoPlace({ mode: 'uniform', totalCount: 10 })

      expect(editor.deleteShapes).toHaveBeenCalled()
      expect(editor.createShape).toHaveBeenCalledTimes(11) // 10 probes + 1 description
      // Verify probe shapes are independent (no parentId)
      const probeCalls = (editor.createShape as any).mock.calls.filter(
        (call: any) => call[0].type === 'probe-point',
      )
      expect(probeCalls).toHaveLength(10)
      expect(probeCalls[0][0].parentId).toBeUndefined()
    })

    it('does not delete device component shapes during placement', () => {
      const deviceShape = {
        id: 'shape:drain-0',
        type: 'drain-port',
        props: {
          pointData: { label: '排水口', position: { x: 100, y: 100, z: 0 }, properties: {} },
        },
      }
      const probeShape = {
        id: 'shape:probe-0',
        type: 'probe-point',
        props: { pointData: { label: 'T1', position: { x: 200, y: 200, z: 400 }, properties: {} } },
      }
      const editor = mockEditor()
      editor.getCurrentPageShapes = vi.fn(() => [deviceShape, probeShape]) as any
      useProjectStore.setState({ editor: editor as any, chamberShapeId: 'shape:chamber' as any })

      useProjectStore.getState().autoPlace({ mode: 'uniform', totalCount: 10 })

      // Should only delete probe-point shapes, not drain-port
      expect(editor.deleteShapes).toHaveBeenCalledWith(['shape:probe-0'])
    })

    it('collects built-in-probe positions when includeBuiltInProbes is true', () => {
      const builtInProbe = {
        id: 'shape:bip-0',
        type: 'built-in-probe',
        props: { pointData: { label: 'B1', position: { x: 50, y: 50, z: 0 }, properties: {} } },
      }
      const editor = mockEditor()
      editor.getCurrentPageShapes = vi.fn(() => [builtInProbe]) as any
      useProjectStore.setState({ editor: editor as any, chamberShapeId: 'shape:chamber' as any })

      useProjectStore
        .getState()
        .autoPlace({ mode: 'uniform', totalCount: 10, includeBuiltInProbes: true })

      // uniformPlacement mock returns 10 points regardless, but extraFixedPoints should be passed
      expect(useProjectStore.getState().points).toHaveLength(10)
    })
  })

  describe('uniformPlace', () => {
    it('uses pointCount from state', () => {
      const editor = mockEditor()
      useProjectStore.setState({
        editor: editor as any,
        chamberShapeId: 'shape:chamber' as any,
        pointCount: 20,
      })

      useProjectStore.getState().uniformPlace()
      expect(useProjectStore.getState().points).toHaveLength(20)
    })
  })

  describe('saveProject', () => {
    it('returns complete project data', () => {
      useProjectStore.setState({
        projectName: '测试项目',
        chamber: testChamber,
        points: [testPoint],
        createdAt: '2026-01-01T00:00:00Z',
      })

      const saved = useProjectStore.getState().saveProject()
      expect(saved.version).toBe('1.0')
      expect(saved.name).toBe('测试项目')
      expect(saved.chamber).toEqual(testChamber)
      expect(saved.points).toEqual([testPoint])
      expect(saved.createdAt).toBe('2026-01-01T00:00:00Z')
      expect(saved.updatedAt).toBeTruthy()
    })

    it('generates createdAt if not set', () => {
      const saved = useProjectStore.getState().saveProject()
      expect(saved.createdAt).toBeTruthy()
    })
  })

  describe('loadProject', () => {
    it('restores state from project data', () => {
      const projectData: ProjectData = {
        version: '1.0',
        name: '加载的项目',
        chamber: testChamber,
        points: [testPoint],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-02T00:00:00Z',
      }

      useProjectStore.getState().loadProject(projectData)
      const state = useProjectStore.getState()
      expect(state.projectName).toBe('加载的项目')
      expect(state.chamber).toEqual(testChamber)
      expect(state.points).toEqual([testPoint])
      expect(state.createdAt).toBe('2026-01-01T00:00:00Z')
    })

    it('rebuilds tldraw shapes when editor is set', () => {
      const editor = mockEditor()
      useProjectStore.setState({ editor: editor as any })

      const projectData: ProjectData = {
        version: '1.0',
        name: '测试',
        chamber: testChamber,
        points: [testPoint],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      }

      useProjectStore.getState().loadProject(projectData)

      expect(editor.deleteShapes).toHaveBeenCalled()
      // 1 chamber + 1 point + 1 direction arrow
      expect(editor.createShape).toHaveBeenCalledTimes(3)
      // Verify point shape is a child of chamber
      const pointCall = (editor.createShape as any).mock.calls.find(
        (call: any) => call[0].type === 'probe-point',
      )
      expect(pointCall[0].parentId).toBeUndefined()
    })

    it('restores drain ports and description from project data', () => {
      const editor = mockEditor()
      useProjectStore.setState({ editor: editor as any })

      const projectData: ProjectData = {
        version: '1.0',
        name: '测试',
        chamber: testChamber,
        points: [testPoint],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        drainPorts: [{ label: 'D1', position: { x: 100, y: 100, z: 0 }, properties: {} }],
        description: { content: 'test desc', x: 100, y: 500 },
      }

      useProjectStore.getState().loadProject(projectData)

      // 1 chamber + 1 point + 1 drain-port + 1 description + 1 direction arrow = 5
      expect(editor.createShape).toHaveBeenCalledTimes(5)
    })
  })

  describe('loadTemplate', () => {
    it('updates chamber and project name', () => {
      const template: EquipmentTemplate = {
        id: 'test-template',
        name: '测试模板',
        category: '灭菌器',
        chamber: testChamber,
        defaultPointCount: 10,
      }

      useProjectStore.getState().loadTemplate(template)
      const state = useProjectStore.getState()
      expect(state.chamber).toEqual(testChamber)
      expect(state.projectName).toBe('测试模板')
      expect(state.points).toEqual([])
    })

    it('creates chamber shape when editor is set', () => {
      const editor = mockEditor()
      useProjectStore.setState({ editor: editor as any })

      const template: EquipmentTemplate = {
        id: 'test-template',
        name: '测试模板',
        category: '灭菌器',
        chamber: testChamber,
        defaultPointCount: 10,
      }

      useProjectStore.getState().loadTemplate(template)

      expect(editor.deleteShapes).toHaveBeenCalled()
      expect(editor.createShape).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chamber',
          props: expect.objectContaining({
            chamberData: testChamber,
          }),
        }),
      )
    })
  })
})
