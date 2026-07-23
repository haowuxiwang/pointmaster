import { useProjectStore } from '@/store/projectStore'
import { builtinTemplates } from '@/templates/builtin'

export default function TemplatePanel() {
  const loadTemplate = useProjectStore((s) => s.loadTemplate)

  return (
    <div>
      <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">设备模板</h3>
      <div className="space-y-1">
        {builtinTemplates.map((t) => (
          <button
            key={t.id}
            onClick={() => loadTemplate(t)}
            className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors"
          >
            <div className="font-medium">{t.name}</div>
            <div className="text-xs text-gray-400">
              {t.chamber.dimensions.width}&times;{t.chamber.dimensions.depth}&times;
              {t.chamber.dimensions.height}mm
              {t.chamber.dimensions.layers && t.chamber.dimensions.layers > 1 && (
                <span className="ml-1">· {t.chamber.dimensions.layers}层</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
