import { useState } from 'react'
import { createShapeId } from 'tldraw'
import { useProjectStore } from '@/store/projectStore'

export default function AutoPlacePanel() {
  const autoPlace = useProjectStore((s) => s.autoPlace)
  const points = useProjectStore((s) => s.points)
  const editor = useProjectStore((s) => s.editor)
  const [totalCount, setTotalCount] = useState(12)
  const [includeCenter, setIncludeCenter] = useState(true)
  const [includeDrainPorts, setIncludeDrainPorts] = useState(false)
  const [includeInletPorts, setIncludeInletPorts] = useState(false)
  const [includeBuiltInProbes, setIncludeBuiltInProbes] = useState(false)

  const getMandatoryCount = () => {
    let count = 8 // 8 corners
    if (includeCenter) count += 1
    return count
  }

  /** Check if the placement description has been manually edited by the user */
  const isDescriptionEdited = (): boolean => {
    if (!editor) return false
    const desc = editor.getCurrentPageShapes().find(s => s.id === createShapeId('placement-desc'))
    if (!desc) return false
    const content = (desc.props as any).content as string
    // If description exists and is non-empty, consider it potentially edited
    return content.length > 0
  }

  const handlePlace = () => {
    let msg = ''
    if (points.length > 0) {
      msg = `当前有 ${points.length} 个布点，将重新生成 ${totalCount} 个点位。`
    }
    if (isDescriptionEdited()) {
      msg += '布点描述将被重新生成，手动编辑的内容会丢失。'
    }
    if (msg && !confirm(msg + '\n\n继续？')) {
      return
    }

    autoPlace({
      mode: 'uniform',
      totalCount,
      includeCenter,
      includeDrainPorts,
      includeInletPorts,
      includeBuiltInProbes,
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
          max={1000}
          value={totalCount}
          onChange={(e) => {
            const v = Number(e.target.value)
            if (isFinite(v)) setTotalCount(Math.max(1, Math.min(1000, v)))
          }}
          className="w-full border rounded px-2 py-1 text-sm"
        />
        <p className="text-xs text-gray-400">包含角点和中心点，端口位置额外放置探头（不消耗总数）</p>
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
          在排水口附近放置探头
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeInletPorts}
            onChange={(e) => setIncludeInletPorts(e.target.checked)}
            className="rounded"
          />
          在进气口附近放置探头
        </label>
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <input
            type="checkbox"
            checked={includeBuiltInProbes}
            onChange={(e) => setIncludeBuiltInProbes(e.target.checked)}
            className="rounded"
          />
          在自带探头附近放置探头
        </label>
      </div>

      {/* Estimated count */}
      <div className="bg-gray-50 rounded p-2">
        <p className="text-xs text-gray-500">
          共生成 {totalCount} 个探头点位
          {getMandatoryCount() >= totalCount && (
            <span className="text-orange-500">（角点较多，部分角点可能不包含）</span>
          )}
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
          <li>先放置排水口、进气口、自带探头，再执行布点</li>
          <li>勾选的端口位置会放置探头（与端口精确重合，可拖走调整）</li>
          <li>布点后可拖动调整位置</li>
          <li>双击标签可编辑名称</li>
        </ul>
      </div>
    </div>
  )
}
