import { useProjectStore } from '@/store/projectStore'
import type { ViewMode } from '@/core/projection/isometric'

const viewLabels: Record<ViewMode, string> = {
  isometric: '等轴测',
  front: '前视',
}

export default function ViewControls() {
  const viewMode = useProjectStore((s) => s.viewMode)
  const setViewMode = useProjectStore((s) => s.setViewMode)

  return (
    <div className="absolute left-16 top-4 flex flex-col gap-1 bg-white rounded-lg shadow-md p-1.5 z-10">
      <span className="text-xs text-gray-500 px-1.5 pb-1 border-b border-gray-100">视角</span>
      {(Object.keys(viewLabels) as ViewMode[]).map((mode) => (
        <button
          key={mode}
          onClick={() => setViewMode(mode)}
          className={`px-3 py-1 text-xs rounded text-left ${
            viewMode === mode ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {viewLabels[mode]}
        </button>
      ))}
    </div>
  )
}
