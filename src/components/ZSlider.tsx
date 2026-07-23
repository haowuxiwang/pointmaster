import { useEffect, useState } from 'react'
import type { TLShapeId } from 'tldraw'
import { useProjectStore } from '@/store/projectStore'

export default function ZSlider() {
  const chamber = useProjectStore((s) => s.chamber)
  const currentZLevel = useProjectStore((s) => s.currentZLevel)
  const setCurrentZLevel = useProjectStore((s) => s.setCurrentZLevel)
  const updatePointPosition = useProjectStore((s) => s.updatePointPosition)
  const editor = useProjectStore((s) => s.editor)
  const maxHeight = chamber.dimensions.height
  const layers = chamber.dimensions.layers ?? 1

  // Each layer center matches uniformPlacement's Z calculation: height * (layer + 0.5) / layers
  const layerCenters = Array.from({ length: layers }, (_, l) =>
    Math.round((maxHeight * (l + 0.5)) / layers),
  )
  const closestLayer = layerCenters.reduce(
    (prev, curr) => (Math.abs(curr - currentZLevel) < Math.abs(prev - currentZLevel) ? curr : prev),
    layerCenters[0],
  )
  const currentLayer = layerCenters.indexOf(closestLayer) + 1

  // Subscribe to selection + shape changes for stable sync
  const [selectedId, setSelectedId] = useState<TLShapeId | null>(null)

  useEffect(() => {
    if (!editor) return
    const unsub = editor.store.listen((entry) => {
      // Only react to selection changes, not all store mutations
      const changes = entry.changes
      if (!changes) return
      const updatedKeys = changes.updated ? Object.keys(changes.updated) : []
      if (updatedKeys.some((k) => k.includes('selectedShapeIds'))) {
        const ids = editor.getSelectedShapeIds()
        setSelectedId(ids.length === 1 ? ids[0] : null)
      }
    })
    return unsub
  }, [editor])

  // Sync ZSlider to selected point's Z coordinate
  useEffect(() => {
    if (!editor || !selectedId) return
    const shape = editor.getShape(selectedId) as any
    if (shape?.props?.pointData?.position) {
      const z = shape.props.pointData.position.z
      if (z !== currentZLevel) {
        setCurrentZLevel(z)
      }
    }
  }, [editor, selectedId, currentZLevel, setCurrentZLevel])

  const handleSliderChange = (newZ: number) => {
    setCurrentZLevel(newZ)
    // If a point is selected, update its Z coordinate too
    if (editor) {
      const selectedIds = editor.getSelectedShapeIds()
      if (selectedIds.length === 1) {
        const shape = editor.getShape(selectedIds[0]) as any
        if (shape?.props?.pointData) {
          const pos = shape.props.pointData.position
          updatePointPosition(shape.props.pointData.label, { x: pos.x, y: pos.y, z: newZ })
        }
      }
    }
  }

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white rounded-lg shadow-md p-2 z-10">
      <span
        className="text-xs text-gray-500 mb-1"
        title="控制点位放置的高度（mm），选中点位后可拖动调整Z坐标"
      >
        高度层
      </span>
      <input
        type="range"
        min={0}
        max={maxHeight}
        step={1}
        value={currentZLevel}
        onChange={(e) => handleSliderChange(Number(e.target.value))}
        className="h-40 appearance-none bg-gray-200 rounded cursor-pointer"
        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
      />
      <span className="text-xs font-mono text-gray-700 mt-1">{currentZLevel}mm</span>
      <span className="text-xs text-gray-500">第{currentLayer}层</span>
    </div>
  )
}
