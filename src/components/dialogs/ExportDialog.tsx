import { useState } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  onExport: (format: 'svg' | 'png', scale?: number) => void
}

export default function ExportDialog({ open, onClose, onExport }: Props) {
  const [format, setFormat] = useState<'svg' | 'png'>('svg')
  const [scale, setScale] = useState(2)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-[400px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h2 className="text-base font-semibold">导出</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Format selection */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">格式</label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormat('svg')}
                className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${
                  format === 'svg'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                SVG (矢量)
              </button>
              <button
                onClick={() => setFormat('png')}
                className={`flex-1 py-2 rounded border text-sm font-medium transition-colors ${
                  format === 'png'
                    ? 'border-blue-500 bg-blue-50 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                PNG (图片)
              </button>
            </div>
          </div>

          {/* PNG scale selection */}
          {format === 'png' && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">质量</label>
              <select
                value={scale}
                onChange={(e) => setScale(Number(e.target.value))}
                className="w-full border rounded px-3 py-1.5 text-sm"
              >
                <option value={1}>标准 (1x)</option>
                <option value={2}>高清 (2x)</option>
                <option value={3}>超高清 (3x)</option>
              </select>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded border text-sm text-gray-600 hover:bg-gray-50"
          >
            取消
          </button>
          <button
            onClick={() => onExport(format, format === 'png' ? scale : undefined)}
            className="px-4 py-1.5 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
          >
            导出
          </button>
        </div>
      </div>
    </div>
  )
}
