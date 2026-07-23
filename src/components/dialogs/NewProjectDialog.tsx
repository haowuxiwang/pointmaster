import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { builtinTemplates } from '@/templates/builtin'
import { EquipmentTemplate, ChamberType } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
}

export default function NewProjectDialog({ open, onClose }: Props) {
  const [tab, setTab] = useState<'template' | 'custom'>('template')
  const loadTemplate = useProjectStore((s) => s.loadTemplate)
  const setProjectName = useProjectStore((s) => s.setProjectName)
  const setChamber = useProjectStore((s) => s.setChamber)

  // Custom form state
  const [name, setName] = useState('')
  const [shape, setShape] = useState<ChamberType>('cuboid')
  const [width, setWidth] = useState(1000)
  const [depth, setDepth] = useState(600)
  const [height, setHeight] = useState(800)
  const [radius, setRadius] = useState(150)
  const [layers, setLayers] = useState(1)

  if (!open) return null

  const handleTemplate = (t: EquipmentTemplate) => {
    loadTemplate(t)
    onClose()
  }

  const handleCustom = () => {
    if (!name.trim()) return
    if (width <= 0 || depth <= 0 || height <= 0) return
    if (shape === 'cylinder' && (radius <= 0 || radius > Math.min(width, depth) / 2)) return
    setProjectName(name.trim())
    setChamber({
      type: shape,
      name: name.trim(),
      dimensions: { width, depth, height, layers },
      ...(shape === 'cylinder' ? { radius } : {}),
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[640px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold">新建项目</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5">
          <button
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === 'template' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('template')}
          >
            选择模板
          </button>
          <button
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === 'custom' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            onClick={() => setTab('custom')}
          >
            自定义
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'template' ? (
            <div className="grid grid-cols-2 gap-3">
              {builtinTemplates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleTemplate(t)}
                  className="border rounded-lg p-3 text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-sm font-medium text-gray-800">{t.name}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {t.chamber.type === 'cylinder' ? '圆柱形' : '长方体'}{' '}
                    {t.chamber.dimensions.width}&times;{t.chamber.dimensions.depth}&times;
                    {t.chamber.dimensions.height}mm
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    默认 {t.defaultPointCount} 个点位
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">项目名称</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border rounded px-3 py-1.5 text-sm"
                  placeholder="输入项目名称"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">腔室形状</label>
                <select
                  value={shape}
                  onChange={(e) => setShape(e.target.value as ChamberType)}
                  className="w-full border rounded px-3 py-1.5 text-sm"
                >
                  <option value="cuboid">长方体</option>
                  <option value="cylinder">圆柱体</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">宽度 (mm)</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={width}
                    onChange={(e) => setWidth(Math.max(1, Math.min(10000, +e.target.value || 1)))}
                    className="w-full border rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">深度 (mm)</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={depth}
                    onChange={(e) => setDepth(Math.max(1, Math.min(10000, +e.target.value || 1)))}
                    className="w-full border rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">高度 (mm)</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={height}
                    onChange={(e) => setHeight(Math.max(1, Math.min(10000, +e.target.value || 1)))}
                    className="w-full border rounded px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">层数</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={layers}
                  onChange={(e) => setLayers(Math.max(1, Math.min(10, +e.target.value)))}
                  className="w-full border rounded px-3 py-1.5 text-sm"
                />
              </div>
              {shape === 'cylinder' && (
                <div>
                  <label className="block text-sm text-gray-600 mb-1">半径 (mm)</label>
                  <input
                    type="number"
                    min={1}
                    max={Math.floor(Math.min(width, depth) / 2)}
                    value={radius}
                    onChange={(e) =>
                      setRadius(
                        Math.max(
                          1,
                          Math.min(Math.floor(Math.min(width, depth) / 2), +e.target.value || 1),
                        ),
                      )
                    }
                    className="w-full border rounded px-3 py-1.5 text-sm"
                  />
                </div>
              )}
              <button
                onClick={handleCustom}
                disabled={!name.trim()}
                className="w-full py-2 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                创建项目
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
