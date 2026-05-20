import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'

export default function AutoPlacePanel() {
  const autoPlace = useProjectStore((s) => s.autoPlace)
  const points = useProjectStore((s) => s.points)
  const editor = useProjectStore((s) => s.editor)
  const [totalCount, setTotalCount] = useState(12)
  const [includeCenter, setIncludeCenter] = useState(true)
  const [includeDrainPorts, setIncludeDrainPorts] = useState(false)
  const [includeInletPorts, setIncludeInletPorts] = useState(false)

  const getEstimatedCount = () => {
    let count = 8 // 8 corners
    if (includeCenter) count += 1
    // Read device component counts from canvas shapes, not from store.points
    if (editor) {
      const shapes = editor.getCurrentPageShapes()
      if (includeDrainPorts) count += shapes.filter((s) => s.type === 'drain-port').length
      if (includeInletPorts) count += shapes.filter((s) => s.type === 'inlet-port').length
    }
    return count
  }

  const handlePlace = () => {
    if (points.length > 0) {
      if (!confirm(`当前有 ${points.length} 个布点，将重新生成 ${totalCount} 个点位。继续？`)) {
        return
      }
    }

    autoPlace({
      mode: 'uniform',
      totalCount,
      includeCenter,
      includeDrainPorts,
      includeInletPorts,
    })
  }

  return (
    <div className="p-3 space-y-3">
      <h3 className="text-xs font-medium text-gray-500 uppercase">均匀布点</h3>

      {/* Total point count */}
      <div className="space-y-1.5">
        <label className="block text-xs text-gray-500">总点数</label>
        <input
          type="number"
          min={1}
          value={totalCount}
          onChange={(e) => setTotalCount(Number(e.target.value))}
          className="w-full border rounded px-2 py-1 text-sm"
        />
        <p className="text-xs text-gray-400">包含 8 个角点 + 均匀分布点</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeCenter}
            onChange={(e) => setIncludeCenter(e.target.checked)}
            className="rounded"
          />
          包含中心点
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeDrainPorts}
            onChange={(e) => setIncludeDrainPorts(e.target.checked)}
            className="rounded"
          />
          包含排水口位置
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeInletPorts}
            onChange={(e) => setIncludeInletPorts(e.target.checked)}
            className="rounded"
          />
          包含进气口位置
        </label>
      </div>

      {/* Estimated count */}
      <div className="bg-gray-50 rounded p-2">
        <p className="text-xs text-gray-500">
          预估：{getEstimatedCount()} 个固定点 + {Math.max(0, totalCount - getEstimatedCount())} 个均匀分布点
        </p>
      </div>

      {/* Execute button */}
      <button
        onClick={handlePlace}
        className="w-full bg-blue-500 text-white rounded py-1.5 text-sm font-medium hover:bg-blue-600"
      >
        执行布点
      </button>

      {/* Tips */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>提示：</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>布点后可拖动调整位置</li>
          <li>双击标签可编辑名称</li>
          <li>在点位列表中可删除单个点</li>
        </ul>
      </div>
    </div>
  )
}
