import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'

export default function PointListPanel() {
  const { points, removePoint, updatePoint, editor } = useProjectStore()
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = (label: string) => {
    setEditingLabel(label)
    setEditValue(label)
  }

  const handleConfirmEdit = () => {
    if (editingLabel && editValue && editingLabel !== editValue) {
      updatePoint(editingLabel, { label: editValue })
      // Sync label change to canvas shape
      if (editor) {
        const shape = editor.getCurrentPageShapes().find(
          (s) => s.type === 'probe-point' && (s.props as any).pointData?.label === editingLabel
        )
        if (shape) {
          editor.updateShape({
            id: shape.id,
            type: shape.type as any,
            props: { pointData: { ...(shape.props as any).pointData, label: editValue } },
          })
        }
      }
    }
    setEditingLabel(null)
  }

  const handleSelectOnCanvas = (label: string) => {
    if (!editor) return
    const shape = editor.getCurrentPageShapes().find(
      (s) => s.type === 'probe-point' && s.props.pointData?.label === label
    )
    if (shape) {
      editor.select(shape.id)
      editor.zoomToSelection()
    }
  }

  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">点位列表 ({points.length})</h3>
      <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
        {points.map((p) => (
          <div key={p.label} className="flex items-center justify-between px-2 py-1 rounded text-sm hover:bg-gray-100 group">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {editingLabel === p.label ? (
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={handleConfirmEdit}
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmEdit()}
                  className="w-16 border rounded px-1 py-0.5 text-xs font-mono font-bold text-blue-600"
                  autoFocus
                />
              ) : (
                <span
                  className="font-mono font-bold text-blue-600 cursor-pointer hover:underline"
                  onDoubleClick={() => handleStartEdit(p.label)}
                  onClick={() => handleSelectOnCanvas(p.label)}
                >
                  {p.label}
                </span>
              )}
              <span className="text-xs text-gray-400 truncate">
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
