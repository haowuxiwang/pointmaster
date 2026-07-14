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
import { POINT_SHAPE_TYPES } from '@/types'
import type { Editor } from 'tldraw'

/** Debug helper: log current tldraw shapes to console */
declare global { interface Window { __pm_debug?: () => void } }
function installDebug(editor: Editor) {
  window.__pm_debug = () => {
    const shapes = editor.getCurrentPageShapes()
    const chamber = shapes.find(s => s.type === 'chamber')
    const points = shapes.filter(s => s.type === 'probe-point')
    const { viewMode } = useProjectStore.getState()

    console.log('[PM_DEBUG] viewMode:', viewMode)
    console.log('[PM_DEBUG) chamber:', chamber ? { x: chamber.x, y: chamber.y } : null)
    console.log('[PM_DEBUG] point count:', points.length)
    points.slice(0, 3).forEach((p, i) => {
      const pd = p.props?.pointData
      console.log(`[PM_DEBUG] point[${i}] ${pd.label}: stored=(${p.x.toFixed(1)}, ${p.y.toFixed(1)}), pos3d=(${pd.position.x}, ${pd.position.y}, ${pd.position.z})`)
    })

    // Rendered positions (from DOM)
    setTimeout(() => {
      const chamberEl = document.querySelector('[data-shape-type="chamber"]')
      const pointEls = document.querySelectorAll('[data-shape-type="probe-point"]')
      if (chamberEl) {
        const r = chamberEl.getBoundingClientRect()
        console.log('[PM_DEBUG] RENDERED chamber bbox:', JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) }))
      }
      pointEls.forEach((el, i) => {
        if (i >= 3) return
        const r = el.getBoundingClientRect()
        console.log(`[PM_DEBUG] RENDERED point[${i}]:`, JSON.stringify({ left: Math.round(r.left), top: Math.round(r.top) }))
      })
    }, 100)
  }
}

const shapeUtils = [ChamberShapeUtil, ProbePointShapeUtil, TextAnnotationShapeUtil, DimensionShapeUtil, LegendShapeUtil, DrainPortShapeUtil, BuiltInProbeShapeUtil, InletPortShapeUtil]
const tools = [ProbePointTool, DrainPortTool, BuiltInProbeTool, InletPortTool]

function EditorSync() {
  const editor = useEditor()
  const setEditor = useProjectStore((s) => s.setEditor)
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

    // Install debug helper
    installDebug(editor)

    // Listen for shape changes to sync added/removed/updated shapes
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
          // Update chamber page position in store
          useProjectStore.setState({ chamberPageX: shape.x, chamberPageY: shape.y })
          // Child point shapes follow automatically in tldraw v5
          continue
        }

        // Handle probe/port changes — only sync labels, NOT positions (points are independent shapes)
        if (!POINT_SHAPE_TYPES.has(shape.type)) continue
        const oldLabel = prevShape?.props?.pointData?.label
        const newLabel = shape.props?.pointData?.label
        if (!oldLabel || !newLabel) continue

        // Sync label changes (non-drag edits)
        const store = useProjectStore.getState()
        const oldPoint = store.points.find((p) => p.label === oldLabel)
        if (oldPoint && oldLabel !== newLabel) {
          useProjectStore.setState({
            points: store.points.map((p) =>
              p.label === oldLabel ? { ...p, label: newLabel } : p
            ),
          })
        }
      }
    })

    return () => {
      unsubscribe()
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
