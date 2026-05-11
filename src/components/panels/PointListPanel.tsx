import { useProjectStore } from '@/store/projectStore'

export default function PointListPanel() {
  const { points, removePoint } = useProjectStore()

  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">点位列表 ({points.length})</h3>
      <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
        {points.map((p) => (
          <div key={p.label} className="flex items-center justify-between px-2 py-1 rounded text-sm hover:bg-gray-100 group">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-blue-600">{p.label}</span>
              <span className="text-xs text-gray-400">
                ({Math.round(p.position.x)}, {Math.round(p.position.y)}, {Math.round(p.position.z)})
              </span>
            </div>
            <button className="text-xs text-red-400 opacity-0 group-hover:opacity-100" onClick={() => removePoint(p.label)}>删除</button>
          </div>
        ))}
        {points.length === 0 && <p className="text-sm text-gray-400">暂无布点</p>}
      </div>
    </div>
  )
}
