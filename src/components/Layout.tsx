import { useState } from 'react'
import Canvas from './Canvas'
import ZSlider from './ZSlider'

export default function Layout() {
  const [activeTool, setActiveTool] = useState('select')

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <header className="h-10 bg-white border-b border-gray-200 flex items-center px-4 text-sm">
        <span className="font-bold text-gray-700">验证布点图工具</span>
        <nav className="ml-6 flex gap-4 text-gray-500">
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
        <aside className="w-64 bg-white border-l border-gray-200 p-3 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">属性</h3>
          <p className="text-sm text-gray-400">选择元素查看属性</p>
        </aside>
      </div>

      {/* Status bar */}
      <footer className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-400 gap-4">
        <span>缩放: 100%</span>
        <span>点位: 0</span>
        <span>Z层: 400mm</span>
      </footer>
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
