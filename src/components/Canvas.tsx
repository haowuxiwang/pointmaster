import { Tldraw, useEditor } from 'tldraw'
import 'tldraw/tldraw.css'
import { useEffect, useRef, useCallback } from 'react'
import { ChamberShapeUtil } from '@/shapes/ChamberShape'
import { ProbePointShapeUtil } from '@/shapes/ProbePointShape'
import { TextAnnotationShapeUtil } from '@/shapes/TextAnnotationShape'
import { DimensionShapeUtil } from '@/shapes/DimensionShape'
import { LegendShapeUtil } from '@/shapes/LegendShape'
import { DrainPortShapeUtil } from '@/shapes/DrainPortShape'
import { BuiltInProbeShapeUtil } from '@/shapes/BuiltInProbeShape'
import { InletPortShapeUtil } from '@/shapes/InletPortShape'
import { ProbePointTool } from '@/tools/ProbePointTool'
import { DrainPortTool } from '@/tools/DrainPortTool'
import { BuiltInProbeTool } from '@/tools/BuiltInProbeTool'
import { InletPortTool } from '@/tools/InletPortTool'
import { useProjectStore } from '@/store/projectStore'
import { project3Dto2D, CHAMBER_SCALE, projections } from '@/core/projection/isometric'
import { POINT_SHAPE_TYPES } from '@/types'

/** Global drag state shared between EditorSync and Layout via zustand */
let currentDragLabel: string | null = null
let currentDragPos: { x: number; y: number; z: number } | null = null
let dragListeners = new Set<() => void>()
let dragEndTimer: number | null = null

export function subscribeDragState(fn: () => void) {
  dragListeners.add(fn)
  return () => { dragListeners.delete(fn) }
}

export function getDragState() {
  return { label: currentDragLabel, pos: currentDragPos }
}

function notifyDragChange() {
  dragListeners.forEach(fn => fn())
}

/** Clear drag state after inactivity — called when drag ends */
function clearDragStateAfterTimeout() {
  if (dragEndTimer !== null) {
    clearTimeout(dragEndTimer)
  }
  dragEndTimer = window.setTimeout(() => {
    currentDragLabel = null
    currentDragPos = null
    dragEndTimer = null
    notifyDragChange()
  }, 150)
}

const shapeUtils = [ChamberShapeUtil, ProbePointShapeUtil, TextAnnotationShapeUtil, DimensionShapeUtil, LegendShapeUtil, DrainPortShapeUtil, BuiltInProbeShapeUtil, InletPortShapeUtil]
const tools = [ProbePointTool, DrainPortTool, BuiltInProbeTool, InletPortTool]

function EditorSync() {
  const editor = useEditor()
  const setEditor = useProjectStore((s) => s.setEditor)
  const viewMode = useProjectStore((s) => s.viewMode)
  const pendingUpdates = useRef<Map<string, { x: number; y: number; z: number }>>(new Map())
  const rafId = useRef<number | null>(null)
  const chamberPosRef = useRef({ x: 100, y: 100 })

  useEffect(() => {
    setEditor(editor)

    // Flush any pending load that was waiting for editor
    useProjectStore.getState().flushPendingLoad()

    // Initialize chamber position from store (covers post-flush pendingChamber creation)
    const initChamber = editor.getCurrentPageShapes().find((s) => s.type === 'chamber')
    if (initChamber) {
      chamberPosRef.current = { x: initChamber.x, y: initChamber.y }
    }

    // Batch update function using requestAnimationFrame — single-point precision update
    const flushUpdates = () => {
      const updates = pendingUpdates.current
      if (updates.size === 0) return

      const allPoints = useProjectStore.getState().points
      const newPoints = allPoints.map((p) => {
        const newPos = updates.get(p.label)
        return newPos ? { ...p, position: newPos } : p
      })
      useProjectStore.setState({ points: newPoints })
      updates.clear()
      rafId.current = null
    }

    // Listen for shape changes to sync position and labels
    const unsubscribe = editor.store.listen((entry) => {
      const changes = entry.changes
      if (!changes) return

      // Sync newly added probe-point shapes to store (exclude fixed shapes like drain-port/inlet-port/built-in-probe)
      if (changes.added) {
        for (const record of Object.values(changes.added)) {
          if (record.typeName !== 'shape') continue
          const shape = record as any
          if (shape.type !== 'probe-point') continue
          const pd = shape.props?.pointData
          if (!pd?.label || !pd?.position) continue
          const store = useProjectStore.getState()
          if (!store.points.find((p) => p.label === pd.label)) {
            useProjectStore.setState({ points: [...store.points, pd] })
          }
        }
      }

      // Sync removed probe-point shapes to store
      if (changes.removed) {
        for (const record of Object.values(changes.removed)) {
          if (record.typeName !== 'shape') continue
          const shape = record as any
          if (shape.type !== 'probe-point') continue
          const pd = shape.props?.pointData
          if (!pd?.label) continue
          const store = useProjectStore.getState()
          const exists = store.points.find((p) => p.label === pd.label)
          if (exists) {
            useProjectStore.setState({
              points: store.points.filter((p) => p.label !== pd.label),
            })
          }
        }
      }

      if (!changes.updated) return

      for (const [from, to] of Object.values(changes.updated)) {
        if (to.typeName !== 'shape') continue
        const shape = to as any
        const prevShape = from as any

        // Handle chamber changes — update cached position and sync name
        if (shape.type === 'chamber') {
          chamberPosRef.current = { x: shape.x, y: shape.y }
          const store = useProjectStore.getState()
          const newName = shape.props?.chamberData?.name
          if (newName && store.chamber.name !== newName) {
            useProjectStore.setState({ chamber: { ...store.chamber, name: newName } })
          }
          continue
        }

        // Handle probe/port changes — position sync only during drag
        if (!POINT_SHAPE_TYPES.has(shape.type)) continue
        const oldLabel = prevShape?.props?.pointData?.label
        const newLabel = shape.props?.pointData?.label
        if (!oldLabel || !newLabel) continue

        // Check if x or y actually changed (drag = position-only change)
        const posChanged = prevShape && (prevShape.x !== shape.x || prevShape.y !== shape.y)

        // Only sync labels when not dragging (label edit = non-drag change)
        if (!posChanged) {
          const store = useProjectStore.getState()
          const oldPoint = store.points.find((p) => p.label === oldLabel)
          if (oldPoint && oldLabel !== newLabel) {
            useProjectStore.setState({
              points: store.points.map((p) =>
                p.label === oldLabel ? { ...p, label: newLabel } : p
              ),
            })
          }
          continue
        }

        // Position update path (drag) — child shapes have relative coords, independent shapes need offset
        const { x: cx, y: cy } = chamberPosRef.current
        const isChild = shape.parentId !== undefined && shape.parentId !== 'page:page'
        const relX = isChild ? shape.x : shape.x - cx
        const relY = isChild ? shape.y : shape.y - cy
        const pointZ = shape.props?.pointData?.position?.z ?? useProjectStore.getState().currentZLevel
        const pos3D = projections[viewMode].unproject(relX, relY, pointZ, CHAMBER_SCALE)

        // Clamp to chamber bounds to prevent dragging outside the chamber
        const { width, depth, height } = useProjectStore.getState().chamber.dimensions
        const clampedPos = {
          x: Math.max(0, Math.min(width, pos3D.x)),
          y: Math.max(0, Math.min(depth, pos3D.y)),
          z: Math.max(0, Math.min(height, pointZ)),
        }

        // B2: If clamped, sync shape back to clamped position so visuals match data
        if (clampedPos.x !== pos3D.x || clampedPos.y !== pos3D.y) {
          const clampedScreen = project3Dto2D(clampedPos.x, clampedPos.y, pointZ, CHAMBER_SCALE)
          // history.ignore prevents this corrective update from polluting undo/redo stack
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ;(editor as any).history.ignore(() => {
            editor.updateShape({
              id: shape.id,
              type: shape.type as any,
              x: cx + clampedScreen.x,
              y: cy + clampedScreen.y,
            })
          })
        }

        // P3: Sync position back to shape.props.pointData for ALL point shape types
        // (probe-point → store.points via flushUpdates; fixed shapes → only shape props)
        editor.updateShape({
          id: shape.id,
          type: shape.type as any,
          props: { pointData: { ...shape.props.pointData, position: clampedPos } },
        })

        pendingUpdates.current.set(newLabel, clampedPos)

        // Update global drag state for status bar
        currentDragLabel = newLabel
        currentDragPos = clampedPos
        notifyDragChange()

        // B1: Reset drag-end timer — clears state 150ms after last movement
        clearDragStateAfterTimeout()

        if (!rafId.current) {
          rafId.current = requestAnimationFrame(flushUpdates)
        }
      }
    })

    return () => {
      unsubscribe()
      if (rafId.current) cancelAnimationFrame(rafId.current)
      setEditor(null)
    }
  }, [editor, setEditor])

  return null
}

function ZoomControls() {
  const editor = useEditor()

  const handleZoomIn = useCallback(() => {
    editor.zoomIn(editor.getViewportScreenCenter(), { animation: { duration: 200 } })
  }, [editor])

  const handleZoomOut = useCallback(() => {
    editor.zoomOut(editor.getViewportScreenCenter(), { animation: { duration: 200 } })
  }, [editor])

  const handleResetZoom = useCallback(() => {
    editor.resetZoom(editor.getViewportScreenCenter(), { animation: { duration: 200 } })
  }, [editor])

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white rounded-lg shadow-md p-2 z-10">
      <button
        onClick={handleZoomIn}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-lg font-bold"
        title="放大"
      >
        +
      </button>
      <button
        onClick={handleResetZoom}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-xs"
        title="重置缩放"
      >
        1:1
      </button>
      <button
        onClick={handleZoomOut}
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 text-lg font-bold"
        title="缩小"
      >
        −
      </button>
    </div>
  )
}

export default function Canvas() {
  return (
    <div className="flex-1 h-full">
      <Tldraw shapeUtils={shapeUtils} tools={tools} hideUi={true}>
        <EditorSync />
        <ZoomControls />
      </Tldraw>
    </div>
  )
}
