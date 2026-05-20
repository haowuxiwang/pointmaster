import { useState, useCallback, useEffect, useRef } from 'react'
import Canvas from './Canvas'
import ZSlider from './ZSlider'
import NewProjectDialog from './dialogs/NewProjectDialog'
import PointListPanel from './panels/PointListPanel'
import TemplatePanel from './panels/TemplatePanel'
import AutoPlacePanel from './panels/AutoPlacePanel'
import ToastContainer, { showToast } from './Toast'
import { exportToSVG } from '@/core/export/svgExport'
import { exportToPNG } from '@/core/export/pngExport'
import { useProjectStore } from '@/store/projectStore'
import { saveProjectToFile, loadProjectFromFile, getRecentProjects } from '@/utils/fileIO'

export default function Layout() {
  const [activeTool, setActiveTool] = useState('select')
  const [activeTab, setActiveTab] = useState<'points' | 'templates' | 'autoplace' | 'recent'>('points')
  const [showNewProject, setShowNewProject] = useState(false)
  const [exportScale, setExportScale] = useState(2)

  const saveProject = useProjectStore((s) => s.saveProject)
  const loadProject = useProjectStore((s) => s.loadProject)
  const editor = useProjectStore((s) => s.editor)
  const editorRef = useRef(editor)
  editorRef.current = editor
  const points = useProjectStore((s) => s.points)
  const chamber = useProjectStore((s) => s.chamber)
  const currentZLevel = useProjectStore((s) => s.currentZLevel)

  // Show new project dialog on first load
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro')
    if (!hasSeenIntro) {
      setShowNewProject(true)
      sessionStorage.setItem('hasSeenIntro', 'true')
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave() }
      else if (ctrl && e.key === 'o') { e.preventDefault(); handleOpen() }
      else if (ctrl && e.key === 'z') { e.preventDefault(); editorRef.current?.undo() }
      else if (ctrl && e.key === 'y') { e.preventDefault(); editorRef.current?.redo() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const switchTool = useCallback((toolId: string) => {
    setActiveTool(toolId)
    if (editor) {
      editor.setCurrentTool(toolId)
    }
  }, [editor])

  const handleSave = async () => {
    try {
      const ok = await saveProjectToFile(saveProject())
      if (ok) showToast('项目已保存', 'success')
    } catch (err) {
      if ((err as Error).message !== 'cancelled') {
        showToast('保存失败: ' + (err as Error).message, 'error')
      }
    }
  }

  const handleOpen = () => {
    loadProjectFromFile()
      .then((data) => {
        loadProject(data)
        showToast('项目已加载', 'success')
      })
      .catch((err) => {
        if (err.message !== 'cancelled') {
          showToast('打开失败: ' + err.message, 'error')
        }
      })
  }

  const handleLoadRecent = (name: string) => {
    const recent = getRecentProjects()
    const data = recent.find((p) => p.name === name)
    if (data) {
      loadProject(data)
      showToast(`已加载: ${name}`, 'success')
    }
  }

  const handleExportSVG = async () => {
    if (!editor) { showToast('编辑器未初始化', 'error'); return }
    try {
      const svgString = await exportToSVG(editor)
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      downloadBlob(blob, 'layout.svg')
      showToast('SVG 已导出', 'success')
    } catch {
      showToast('导出 SVG 失败', 'error')
    }
  }

  const handleExportPNG = async () => {
    if (!editor) { showToast('编辑器未初始化', 'error'); return }
    try {
      const blob = await exportToPNG(editor, exportScale)
      downloadBlob(blob, 'layout.png')
      showToast('PNG 已导出', 'success')
    } catch {
      showToast('导出 PNG 失败', 'error')
    }
  }

  const recentProjects = getRecentProjects()

  return (
    <div className="w-full h-screen flex flex-col">
      {/* Header */}
      <header className="h-10 bg-white border-b border-gray-200 flex items-center px-4 text-sm">
        <span className="font-bold text-gray-700">布点大师 (PointMaster)</span>
        <nav className="ml-6 flex gap-4 text-gray-500">
          <button className="hover:text-gray-800" onClick={() => setShowNewProject(true)}>新建</button>
          <button className="hover:text-gray-800" onClick={handleSave}>保存</button>
          <button className="hover:text-gray-800" onClick={handleOpen}>打开</button>
          <button className="hover:text-gray-800" onClick={handleExportSVG}>导出SVG</button>
          <div className="flex items-center gap-1">
            <button className="hover:text-gray-800" onClick={handleExportPNG}>导出PNG</button>
            <select
              value={exportScale}
              onChange={(e) => setExportScale(Number(e.target.value))}
              className="border rounded px-1 py-0.5 text-xs text-gray-600"
            >
              <option value={1}>1x</option>
              <option value={2}>2x</option>
              <option value={3}>3x</option>
            </select>
          </div>
          <button className="hover:text-gray-800" onClick={() => editor?.undo()}>撤回</button>
          <button className="hover:text-gray-800" onClick={() => editor?.redo()}>重做</button>
        </nav>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left toolbar */}
        <aside className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col items-center py-2 gap-1">
          <ToolButton icon="↖" label="选择" active={activeTool === 'select'} onClick={() => switchTool('select')} />
          <ToolButton icon="✋" label="拖动" active={activeTool === 'hand'} onClick={() => switchTool('hand')} />
          <ToolButton icon="+" label="添加点位" active={activeTool === 'probe-point'} onClick={() => switchTool('probe-point')} />
          <ToolButton icon="D" label="排水口" active={activeTool === 'drain-port'} onClick={() => switchTool('drain-port')} />
          <ToolButton icon="I" label="进气口" active={activeTool === 'inlet-port'} onClick={() => switchTool('inlet-port')} />
          <ToolButton icon="B" label="自带探头" active={activeTool === 'built-in-probe'} onClick={() => switchTool('built-in-probe')} />
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
          <ZSlider />
        </div>

        {/* Right panel */}
        <aside className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="flex border-b border-gray-200">
            <TabButton label="点位" active={activeTab === 'points'} onClick={() => setActiveTab('points')} />
            <TabButton label="布点" active={activeTab === 'autoplace'} onClick={() => setActiveTab('autoplace')} />
            <TabButton label="模板" active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
            <TabButton label="最近" active={activeTab === 'recent'} onClick={() => setActiveTab('recent')} />
          </div>
          {activeTab === 'points' && <PointListPanel />}
          {activeTab === 'autoplace' && <AutoPlacePanel />}
          {activeTab === 'templates' && <TemplatePanel />}
          {activeTab === 'recent' && (
            <div className="p-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-2">最近项目</h3>
              {recentProjects.length === 0 && <p className="text-sm text-gray-400">暂无最近项目</p>}
              <div className="space-y-1">
                {recentProjects.map((p) => (
                  <button
                    key={p.name + p.updatedAt}
                    className="w-full text-left px-2 py-1.5 rounded text-sm hover:bg-gray-100 flex flex-col"
                    onClick={() => handleLoadRecent(p.name)}
                  >
                    <span className="font-medium text-gray-700">{p.name}</span>
                    <span className="text-xs text-gray-400">{p.chamber.name} · {p.points.length} 点位</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Status bar */}
      <footer className="h-6 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-400 gap-4">
        <span>设备: {chamber.name}</span>
        <span>Z: {currentZLevel}mm</span>
        <span>点位: {points.length}</span>
        {activeTool !== 'select' && (
          <span className="text-blue-400">点击画布放置点位，按 Esc 退出</span>
        )}
      </footer>
      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
      <ToastContainer />
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
