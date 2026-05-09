import { useState } from 'react'
import Canvas from './Canvas'
import ZSlider from './ZSlider'
import NewProjectDialog from './dialogs/NewProjectDialog'
import AutoPlaceDialog from './dialogs/AutoPlaceDialog'
import ExportDialog from './dialogs/ExportDialog'
import PropertiesPanel from './panels/PropertiesPanel'
import PointListPanel from './panels/PointListPanel'
import TemplatePanel from './panels/TemplatePanel'
import { exportToSVG } from '@/core/export/svgExport'
import { exportToPNG } from '@/core/export/pngExport'

export default function Layout() {
  const [activeTool, setActiveTool] = useState('select')
  const [activeTab, setActiveTab] = useState<'properties' | 'points' | 'templates'>('properties')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showAutoPlace, setShowAutoPlace] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const handleExport = async (format: 'svg' | 'png', scale?: number) => {
    const svgEl = document.querySelector('.tl-svg-context') as SVGSVGElement | null
    if (!svgEl) {
      alert('未找到画布 SVG 元素')
      return
    }

    if (format === 'svg') {
      const svgString = exportToSVG(svgEl)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      downloadBlob(blob, 'layout.svg')
    } else {
      const blob = await exportToPNG(svgEl, scale)
      downloadBlob(blob, 'layout.png')
    }
    setShowExport(false)
  }

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <header className="h-10 bg-white border-b border-gray-200 flex items-center px-4 text-sm">
        <span className="font-bold text-gray-700">验证布点图工具</span>
        <nav className="ml-6 flex gap-4 text-gray-500">
          <button className="hover:text-gray-800" onClick={() => setShowNewProject(true)}>新建</button>
          <button className="hover:text-gray-800" onClick={() => setShowAutoPlace(true)}>自动布点</button>
          <button className="hover:text-gray-800" onClick={() => setShowExport(true)}>导出</button>
          <button className="hover:text-gray-800">文件</button>
          <button className="hover:text-gray-800">编辑</button>
          <button className="hover:text-gray-800">视图</button>
          <button className="hover:text-gray-800">帮助</button>
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left toolbar */}
        <aside className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-2 gap-1">
          <ToolButton icon="↖" label="选择" active={activeTool === 'select'} onClick={() => setActiveTool('select')} />
          <ToolButton icon="+" label="添加点位" active={activeTool === 'probe-point'} onClick={() => setActiveTool('probe-point')} />
          <ToolButton icon="T" label="文字" active={activeTool === 'text'} onClick={() => setActiveTool('text')} />
          <ToolButton icon="↔" label="尺寸" active={activeTool === 'dimension'} onClick={() => setActiveTool('dimension')} />
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
          <ZSlider />
        </div>

        {/* Right panel */}
        <aside className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="flex border-b border-gray-200">
            <TabButton label="属性" active={activeTab === 'properties'} onClick={() => setActiveTab('properties')} />
            <TabButton label="点位" active={activeTab === 'points'} onClick={() => setActiveTab('points')} />
            <TabButton label="模板" active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
          </div>
          {activeTab === 'properties' && <PropertiesPanel />}
          {activeTab === 'points' && <PointListPanel />}
          {activeTab === 'templates' && <TemplatePanel />}
        </aside>
      </div>

      {/* Status bar */}
      <footer className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-400 gap-4">
        <span>缩放: 100%</span>
        <span>点位: 0</span>
        <span>Z层: 400mm</span>
      </footer>
      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
      <AutoPlaceDialog open={showAutoPlace} onClose={() => setShowAutoPlace(false)} />
      <ExportDialog open={showExport} onClose={() => setShowExport(false)} onExport={handleExport} />
    </div>
  )
}

function ToolButton({ icon, label, active, onClick }: { icon: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`w-9 h-9 flex items-center justify-center rounded text-gray-600 text-lg ${active ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-200'}`}
      title={label}
      onClick={onClick}
    >
      {icon}
    </button>
  )
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      className={`flex-1 py-1.5 text-xs font-medium ${active ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
