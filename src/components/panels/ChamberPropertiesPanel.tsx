import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'

export default function ChamberPropertiesPanel() {
  const chamber = useProjectStore((s) => s.chamber)
  const updateChamberDimensions = useProjectStore((s) => s.updateChamberDimensions)
  const points = useProjectStore((s) => s.points)

  const [width, setWidth] = useState(chamber.dimensions.width)
  const [depth, setDepth] = useState(chamber.dimensions.depth)
  const [height, setHeight] = useState(chamber.dimensions.height)
  const [layers, setLayers] = useState(chamber.dimensions.layers ?? 1)
  const [radius, setRadius] = useState(chamber.radius ?? 150)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingChanges, setPendingChanges] = useState<Parameters<typeof updateChamberDimensions>[0] | null>(null)

  // Sync form state when chamber changes externally
  useEffect(() => {
    setWidth(chamber.dimensions.width)
    setDepth(chamber.dimensions.depth)
    setHeight(chamber.dimensions.height)
    setLayers(chamber.dimensions.layers ?? 1)
    setRadius(chamber.radius ?? 150)
  }, [chamber])

  const hasChanges =
    width !== chamber.dimensions.width ||
    depth !== chamber.dimensions.depth ||
    height !== chamber.dimensions.height ||
    layers !== (chamber.dimensions.layers ?? 1) ||
    (chamber.type === 'cylinder' && radius !== chamber.radius)

  const handleApply = () => {
    if (points.length > 0) {
      setPendingChanges({ width, depth, height, layers })
      setShowConfirm(true)
    } else {
      updateChamberDimensions({ width, depth, height, layers }, chamber.type === 'cylinder' ? radius : undefined)
    }
  }

  const confirmApply = () => {
    if (pendingChanges) {
      updateChamberDimensions(pendingChanges, chamber.type === 'cylinder' ? radius : undefined)
    }
    setShowConfirm(false)
    setPendingChanges(null)
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase">设备属性</h3>

      <div className="space-y-2">
        <div>
          <label className="block text-xs text-gray-500 mb-0.5">设备名称</label>
          <div className="text-sm text-gray-700">{chamber.name}</div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-0.5">形状类型</label>
          <div className="text-sm text-gray-700">{chamber.type === 'cylinder' ? '圆柱体' : '长方体'}</div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">宽度 (mm)</label>
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(Math.max(1, +e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">深度 (mm)</label>
            <input
              type="number"
              value={depth}
              onChange={(e) => setDepth(Math.max(1, +e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">高度 (mm)</label>
            <input
              type="number"
              value={height}
              onChange={(e) => setHeight(Math.max(1, +e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-0.5">层数</label>
          <input
            type="number"
            min={1}
            max={10}
            value={layers}
            onChange={(e) => setLayers(Math.max(1, Math.min(10, +e.target.value)))}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>

        {chamber.type === 'cylinder' && (
          <div>
            <label className="block text-xs text-gray-500 mb-0.5">半径 (mm)</label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Math.max(1, +e.target.value))}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        )}
      </div>

      {hasChanges && (
        <button
          onClick={handleApply}
          className="w-full py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
        >
          应用修改
        </button>
      )}

      {points.length > 0 && (
        <p className="text-xs text-gray-400">修改尺寸后，已有点位坐标将按比例缩放。</p>
      )}

      {/* Room context info (read-only) */}
      {chamber.roomContext && (
        <div className="border-t pt-3 mt-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">房间信息</h3>
          <div className="text-sm text-gray-700 mb-1">
            房间: {chamber.roomContext.roomDimensions.width} x {chamber.roomContext.roomDimensions.depth} x {chamber.roomContext.roomDimensions.height} mm
          </div>
          {chamber.roomContext.devices.map((d, i) => (
            <div key={i} className="text-xs text-gray-500 ml-2">
              {d.name}: {d.dimensions.width} x {d.dimensions.depth} x {d.dimensions.height} mm
            </div>
          ))}
          {chamber.roomContext.doors.map((d, i) => (
            <div key={`door-${i}`} className="text-xs text-gray-500 ml-2">
              {d.label ?? '门'}
            </div>
          ))}
        </div>
      )}

      {/* Confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-5 w-80">
            <h3 className="text-sm font-semibold text-gray-800 mb-2">确认修改设备尺寸</h3>
            <p className="text-sm text-gray-600 mb-4">
              当前有 {points.length} 个已布点位。修改尺寸后，所有点位坐标将按比例缩放以适应新尺寸。
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowConfirm(false); setPendingChanges(null) }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={confirmApply}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
