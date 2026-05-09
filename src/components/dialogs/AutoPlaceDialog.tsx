import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { PlacementMode } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

const modes: { key: PlacementMode; label: string; desc: string }[] = [
  { key: 'grid', label: '网格布点', desc: '均匀网格分布' },
  { key: 'uniform', label: '均匀布点', desc: '随机均匀分布' },
  { key: 'keypoints', label: '关键点布点', desc: '中心/面心等' },
  { key: 'mixed', label: '混合布点', desc: '关键点 + 网格' },
]

export default function AutoPlaceDialog({ open, onClose }: Props) {
  const autoPlace = useProjectStore((s) => s.autoPlace)
  const chamber = useProjectStore((s) => s.chamber)

  const [mode, setMode] = useState<PlacementMode>('grid')
  const [gridCounts, setGridCounts] = useState({ x: 3, y: 2, z: 2 })
  const [totalCount, setTotalCount] = useState(12)
  const [includeCenter, setIncludeCenter] = useState(true)
  const [includeFaceCenters, setIncludeFaceCenters] = useState(false)

  if (!open) return null

  const handleGenerate = () => {
    autoPlace({ mode, gridCounts, totalCount, includeCenter, includeFaceCenters })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[480px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold">自动布点</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Chamber info */}
          <div className="bg-gray-50 rounded px-3 py-2 text-sm text-gray-600">
            <span className="font-medium text-gray-800">{chamber.name}</span>
            <span className="ml-2 text-xs text-gray-400">
              {chamber.dimensions.width}&times;{chamber.dimensions.depth}&times;{chamber.dimensions.height} mm
            </span>
          </div>

          {/* Mode selection - 2x2 grid */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">布点模式</label>
            <div className="grid grid-cols-2 gap-2">
              {modes.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`border rounded-lg px-3 py-2 text-left transition-colors ${
                    mode === m.key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-sm font-medium">{m.label}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Mode-specific parameters */}
          {mode === 'grid' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">X 方向数量</label>
                <input
                  type="number"
                  min={1}
                  value={gridCounts.x}
                  onChange={(e) => setGridCounts({ ...gridCounts, x: +e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Y 方向数量</label>
                <input
                  type="number"
                  min={1}
                  value={gridCounts.y}
                  onChange={(e) => setGridCounts({ ...gridCounts, y: +e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Z 方向数量</label>
                <input
                  type="number"
                  min={1}
                  value={gridCounts.z}
                  onChange={(e) => setGridCounts({ ...gridCounts, z: +e.target.value })}
                  className="w-full border rounded px-2 py-1.5 text-sm"
                />
              </div>
            </div>
          )}

          {mode === 'uniform' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">总点数</label>
              <input
                type="number"
                min={1}
                value={totalCount}
                onChange={(e) => setTotalCount(+e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm"
              />
            </div>
          )}

          {mode === 'keypoints' && (
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={includeCenter}
                  onChange={(e) => setIncludeCenter(e.target.checked)}
                />
                包含几何中心
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={includeFaceCenters}
                  onChange={(e) => setIncludeFaceCenters(e.target.checked)}
                />
                包含面心
              </label>
            </div>
          )}

          {mode === 'mixed' && (
            <p className="text-sm text-gray-500">
              混合模式将同时使用关键点布点和 2&times;2&times;2 网格布点，确保覆盖几何中心、面心及均匀分布的网格点。
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-sm text-gray-600 border rounded hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={handleGenerate}
            className="px-4 py-1.5 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            生成布点
          </button>
        </div>
      </div>
    </div>
  )
}
