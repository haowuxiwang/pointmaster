import { useProjectStore } from '@/store/projectStore'

export default function StatusBar() {
  const chamber = useProjectStore((s) => s.chamber)
  const currentZLevel = useProjectStore((s) => s.currentZLevel)
  const points = useProjectStore((s) => s.points)

  return (
    <footer className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-400 gap-4">
      <span>设备: {chamber.name}</span>
      <span>Z: {currentZLevel}mm</span>
      <span>点位: {points.length}</span>
    </footer>
  )
}
