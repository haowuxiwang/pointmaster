import { useState, useEffect } from 'react'
import { subscribeDragState, getDragState } from './Canvas'
import { useProjectStore } from '@/store/projectStore'

export default function StatusBar() {
  const chamber = useProjectStore((s) => s.chamber)
  const currentZLevel = useProjectStore((s) => s.currentZLevel)
  const points = useProjectStore((s) => s.points)
  const [dragInfo, setDragInfo] = useState(getDragState())

  useEffect(() => {
    const unsub = subscribeDragState(() => setDragInfo(getDragState()))
    return unsub
  }, [])

  return (
    <footer className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-400 gap-4">
      <span>设备: {chamber.name}</span>
      {dragInfo.label && dragInfo.pos ? (
        <span className="text-blue-600 font-medium">
          拖拽 {dragInfo.label}: ({Math.round(dragInfo.pos.x)}, {Math.round(dragInfo.pos.y)}, {Math.round(dragInfo.pos.z)})mm
          {isAtBoundary(dragInfo.pos) && <span className="ml-1 text-amber-500">贴边</span>}
        </span>
      ) : (
        <span>Z: {currentZLevel}mm</span>
      )}
      <span>点位: {points.length}</span>
    </footer>
  )
}

function isAtBoundary(pos: { x: number; y: number; z: number }): boolean {
  const { width, depth, height } = useProjectStore.getState().chamber.dimensions
  const tol = 1
  return (
    pos.x <= tol || pos.x >= width - tol ||
    pos.y <= tol || pos.y >= depth - tol ||
    pos.z <= tol || pos.z >= height - tol
  )
}
