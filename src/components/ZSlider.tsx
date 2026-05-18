import { useProjectStore } from '@/store/projectStore'

export default function ZSlider() {
  const { chamber, currentZLevel, setCurrentZLevel } = useProjectStore()
  const maxHeight = chamber.dimensions.height
  const layers = chamber.dimensions.layers ?? 1
  const step = maxHeight / layers
  const currentLayer = Math.round(currentZLevel / step) + 1

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1 bg-white rounded-lg shadow-md p-2 z-10">
      <span className="text-xs text-gray-500 mb-1">Z层</span>
      <input
        type="range"
        min={0}
        max={maxHeight}
        step={step}
        value={currentZLevel}
        onChange={(e) => setCurrentZLevel(Number(e.target.value))}
        className="h-40 appearance-none bg-gray-200 rounded cursor-pointer"
        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
      />
      <span className="text-xs font-mono text-gray-700 mt-1">{currentZLevel}mm</span>
      <span className="text-xs text-gray-500">第{currentLayer}层</span>
    </div>
  )
}
