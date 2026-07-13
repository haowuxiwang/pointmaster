import { useState, memo, useCallback } from 'react'
import { useProjectStore } from '@/store/projectStore'
import type { ProbePointData } from '@/types'

/** Single point row — memoized to avoid re-rendering all rows during drag */
const PointRow = memo(function PointRow({
  point,
  isEditing,
  editValue,
  onStartEdit,
  onConfirmEdit,
  onChangeEditValue,
  onSelect,
  onDelete,
  onEditPosition,
}: {
  point: ProbePointData
  isEditing: boolean
  editValue: string
  onStartEdit: (label: string) => void
  onConfirmEdit: () => void
  onChangeEditValue: (val: string) => void
  onSelect: (label: string) => void
  onDelete: (label: string) => void
  onEditPosition: (label: string) => void
}) {
  return (
    <div className="flex items-center justify-between px-2 py-1 rounded text-sm hover:bg-gray-100 group">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {isEditing ? (
          <input
            type="text"
            value={editValue}
            onChange={(e) => onChangeEditValue(e.target.value)}
            onBlur={onConfirmEdit}
            onKeyDown={(e) => e.key === 'Enter' && onConfirmEdit()}
            className="w-16 border rounded px-1 py-0.5 text-xs font-mono font-bold text-blue-600"
            autoFocus
          />
        ) : (
          <span
            className="font-mono font-bold text-blue-600 cursor-pointer hover:underline"
            onDoubleClick={() => onStartEdit(point.label)}
            onClick={() => onSelect(point.label)}
          >
            {point.label}
          </span>
        )}
        <span
          className="text-xs text-gray-400 truncate cursor-pointer hover:text-blue-500"
          title="点击编辑坐标"
          onClick={() => onEditPosition(point.label)}
        >
          ({Math.round(point.position.x)}, {Math.round(point.position.y)}, {Math.round(point.position.z)})
        </span>
      </div>
      <button className="text-xs text-red-400 opacity-0 group-hover:opacity-100" onClick={() => onDelete(point.label)}>删除</button>
    </div>
  )
})

export default function PointListPanel() {
  const points = useProjectStore((s) => s.points)
  const removePoint = useProjectStore((s) => s.removePoint)
  const updatePoint = useProjectStore((s) => s.updatePoint)
  const updatePointPosition = useProjectStore((s) => s.updatePointPosition)
  const editor = useProjectStore((s) => s.editor)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  const handleStartEdit = useCallback((label: string) => {
    setEditingLabel(label)
    setEditValue(label)
  }, [])

  const handleConfirmEdit = useCallback(() => {
    if (editingLabel && editValue && editingLabel !== editValue) {
      updatePoint(editingLabel, { label: editValue })
    }
    setEditingLabel(null)
  }, [editingLabel, editValue, updatePoint])

  const handleSelectOnCanvas = useCallback((label: string) => {
    if (!editor) return
    const shape = editor.getCurrentPageShapes().find(
      (s) => s.type === 'probe-point' && s.props.pointData?.label === label
    )
    if (shape) {
      editor.select(shape.id)
      editor.zoomToSelection()
    }
  }, [editor])

  const handleDelete = useCallback((label: string) => {
    if (confirm(`确定删除 ${label}？`)) removePoint(label)
  }, [removePoint])

  const [editingPosLabel, setEditingPosLabel] = useState<string | null>(null)
  const [posInput, setPosInput] = useState('')

  const handleEditPosition = useCallback((label: string) => {
    const point = points.find((p) => p.label === label)
    if (!point) return
    setEditingPosLabel(label)
    setPosInput(`${Math.round(point.position.x)}, ${Math.round(point.position.y)}, ${Math.round(point.position.z)}`)
  }, [points])

  const handleConfirmPosition = useCallback(() => {
    if (!editingPosLabel) return
    const parts = posInput.split(',').map((s) => parseFloat(s.trim()))
    if (parts.length === 3 && parts.every((v) => isFinite(v))) {
      updatePointPosition(editingPosLabel, { x: parts[0], y: parts[1], z: parts[2] })
    }
    setEditingPosLabel(null)
  }, [editingPosLabel, posInput])

  return (
    <div className="p-3">
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">点位列表 ({points.length})</h3>
      <div className="space-y-0.5 max-h-[300px] overflow-y-auto">
        {points.map((p) => (
          <PointRow
            key={p.label}
            point={p}
            isEditing={editingLabel === p.label}
            editValue={editValue}
            onStartEdit={handleStartEdit}
            onConfirmEdit={handleConfirmEdit}
            onChangeEditValue={setEditValue}
            onSelect={handleSelectOnCanvas}
            onDelete={handleDelete}
            onEditPosition={handleEditPosition}
          />
        ))}
        {points.length === 0 && <p className="text-sm text-gray-400">暂无布点</p>}
      </div>
      {editingPosLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-4 w-72">
            <h3 className="text-sm font-semibold mb-2">编辑 {editingPosLabel} 坐标</h3>
            <label className="block text-xs text-gray-500 mb-1">X, Y, Z (mm)</label>
            <input
              autoFocus
              value={posInput}
              onChange={(e) => setPosInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirmPosition(); if (e.key === 'Escape') setEditingPosLabel(null) }}
              placeholder="X, Y, Z"
              className="w-full border rounded px-2 py-1 text-sm mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setEditingPosLabel(null)} className="px-3 py-1 text-sm text-gray-600">取消</button>
              <button onClick={handleConfirmPosition} className="px-3 py-1 text-sm bg-blue-500 text-white rounded">确认</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
