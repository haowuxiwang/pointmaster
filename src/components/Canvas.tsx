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
import { unproject2Dto3D, CHAMBER_SCALE } from '@/core/projection/isometric'
import { POINT_SHAPE_TYPES } from '@/types'

const shapeUtils = [ChamberShapeUtil, ProbePointShapeUtil, TextAnnotationShapeUtil, DimensionShapeUtil, LegendShapeUtil, DrainPortShapeUtil, BuiltInProbeShapeUtil, InletPortShapeUtil]
const tools = [ProbePointTool, DrainPortTool, BuiltInProbeTool, InletPortTool]

function EditorSync() {
  const editor = useEditor()
  const setEditor = useProjectStore((s) => s.setEditor)
  const pendingUpdates = useRef<Map<string, { x: number; y: number; z: number }>>(new Map())
  const rafId = useRef<number | null>(null)
  const chamberPosRef = useRef({ x: 100, y: 100 })

  useEffect(() => {
    setEditor(editor)

    // Flush any pending load that was waiting for editor
    useProjectStore.getState().flushPendingLoad()

    // Initialize chamber position from store
    const initChamber = editor.getCurrentPageShapes().find((s) => s.type === 'chamber')
    if (initChamber) {
      chamberPosRef.current = { x: initChamber.x, y: initChamber.y }
    }

    // Batch update function using requestAnimationFrame
    const flushUpdates = () => {
      const updates = pendingUpdates.current
      if (updates.size === 0) return

      const points = useProjectStore.getState().points.map((p) => {
        const newPos = updates.get(p.label)
        return newPos ? { ...p, position: newPos } : p
      })
      useProjectStore.setState({ points })
      updates.clear()
      rafId.current = null
    }

    // Listen for shape changes to sync position and labels
    const unsubscribe = editor.store.listen((entry) => {
      const changes = entry.changes
      if (!changes) return

      // Sync newly added point shapes to store
      if (changes.added) {
        for (const record of Object.values(changes.added)) {
          if (record.typeName !== 'shape') continue
          const shape = record as any
          if (!POINT_SHAPE_TYPES.has(shape.type)) continue
          const pd = shape.props?.pointData
          if (!pd?.label || !pd?.position) continue
          const store = useProjectStore.getState()
          if (!store.points.find((p) => p.label === pd.label)) {
            useProjectStore.setState({ points: [...store.points, pd] })
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
        const pos3D = unproject2Dto3D(relX, relY, pointZ, CHAMBER_SCALE)

        pendingUpdates.current.set(newLabel, {
          x: Math.max(0, pos3D.x),
          y: Math.max(0, pos3D.y),
          z: pointZ,
        })

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
