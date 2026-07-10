import { useState, useCallback, useEffect, useRef } from 'react'
import Canvas from './Canvas'

/** Shape types that user is allowed to delete */
const DELETABLE_TYPES = new Set(['probe-point', 'drain-port', 'inlet-port', 'built-in-probe'])
import ZSlider from './ZSlider'
import NewProjectDialog from './dialogs/NewProjectDialog'
import PointListPanel from './panels/PointListPanel'
import TemplatePanel from './panels/TemplatePanel'
import AutoPlacePanel from './panels/AutoPlacePanel'
import ChamberPropertiesPanel from './panels/ChamberPropertiesPanel'
import ToastContainer, { showToast } from './Toast'
import ViewControls from './ViewControls'
import StatusBar from './StatusBar'
import { exportToSVG, type ExportMetadata } from '@/core/export/svgExport'
import { exportToPNG } from '@/core/export/pngExport'
import { useProjectStore } from '@/store/projectStore'
import { saveProjectToFile, loadProjectFromFile, getRecentProjects } from '@/utils/fileIO'

export default function Layout() {
  const [activeTool, setActiveTool] = useState('select')
  const [activeTab, setActiveTab] = useState<'points' | 'templates' | 'autoplace' | 'recent' | 'device'>('points')
  const [showNewProject, setShowNewProject] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [exportScale, setExportScale] = useState(2)

  const saveProject = useProjectStore((s) => s.saveProject)
  const loadProject = useProjectStore((s) => s.loadProject)
  const editor = useProjectStore((s) => s.editor)
  const editorRef = useRef(editor)
  editorRef.current = editor
  const points = useProjectStore((s) => s.points)
  const chamber = useProjectStore((s) => s.chamber)
  const projectName = useProjectStore((s) => s.projectName)

  // Show new project dialog on first load
  useEffect(() => {
    const hasSeenIntro = sessionStorage.getItem('hasSeenIntro')
    if (!hasSeenIntro) {
      setShowNewProject(true)
      sessionStorage.setItem('hasSeenIntro', 'true')
    }
  }, [])

  // Filter selected shapes to only deletable user shapes (exclude chamber, description, etc.)
  const getDeletableIds = useCallback(() => {
    if (!editorRef.current) return []
    const ids = editorRef.current.getSelectedShapeIds()
    return ids.filter((id) => {
      const s = editorRef.current?.getShape(id)
      return s && DELETABLE_TYPES.has(s.type)
    })
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const tag = (document.activeElement?.tagName || '').toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      const ctrl = e.ctrlKey || e.metaKey
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave() }
      else if (ctrl && e.key === 'o') { e.preventDefault(); handleOpen() }
      else if (ctrl && e.key === 'z') { e.preventDefault(); editorRef.current?.undo() }
      else if (ctrl && e.key === 'y') { e.preventDefault(); editorRef.current?.redo() }
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        const ids = getDeletableIds()
        if (ids.length > 0) {
          e.preventDefault()
          editorRef.current?.deleteShapes(ids)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [getDeletableIds])

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
          const msg = err instanceof SyntaxError
            ? '文件格式损坏，无法解析'
            : err.message === 'Invalid project file format'
              ? '项目文件格式不正确'
              : err.message
          showToast('打开失败: ' + msg, 'error')
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

  const getExportMetadata = (): ExportMetadata => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    return {
      projectName,
      chamberName: chamber.name,
      pointCount: points.length,
      date: dateStr,
    }
  }

  const getExportFilename = (ext: string) => {
    const now = new Date()
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    const safeName = projectName.replace(/[<>:"/\\|?*]/g, '_')
    return `${safeName}_${dateStr}.${ext}`
  }

  const handleExportSVG = async () => {
    if (!editor) { showToast('编辑器未初始化', 'error'); return }
    try {
      const svgString = await exportToSVG(editor, getExportMetadata())
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
      downloadBlob(blob, getExportFilename('svg'))
      showToast('SVG 已导出', 'success')
    } catch (err) {
      const msg = (err as Error).message === 'No shapes to export'
        ? '画布为空，请先添加设备或点位'
        : '导出 SVG 失败'
      showToast(msg, 'error')
    }
  }

  const handleExportPNG = async () => {
    if (!editor) { showToast('编辑器未初始化', 'error'); return }
    try {
      const blob = await exportToPNG(editor, exportScale, getExportMetadata())
      downloadBlob(blob, getExportFilename('png'))
      showToast('PNG 已导出', 'success')
    } catch (err) {
      const msg = (err as Error).message === 'No shapes to export'
        ? '画布为空，请先添加设备或点位'
        : '导出 PNG 失败'
      showToast(msg, 'error')
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
          <button className="hover:text-gray-800" onClick={() => editorRef.current?.undo()}>撤回</button>
          <button className="hover:text-gray-800" onClick={() => editorRef.current?.redo()}>重做</button>
          <button className="hover:text-gray-800 ml-2" onClick={() => setShowHelp(true)}>?</button>
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
          <div className="w-8 border-t border-gray-300 my-1" />
          <ToolButton icon="✕" label="删除选中" active={false} onClick={() => {
            const ids = getDeletableIds()
            if (ids.length > 0) editorRef.current?.deleteShapes(ids)
          }} />
        </aside>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden">
          <Canvas />
          <ZSlider />
          <ViewControls />
        </div>

        {/* Right panel */}
        <aside className="w-64 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="flex border-b border-gray-200">
            <TabButton label="点位" active={activeTab === 'points'} onClick={() => setActiveTab('points')} />
            <TabButton label="设备" active={activeTab === 'device'} onClick={() => setActiveTab('device')} />
            <TabButton label="布点" active={activeTab === 'autoplace'} onClick={() => setActiveTab('autoplace')} />
            <TabButton label="模板" active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} />
            <TabButton label="最近" active={activeTab === 'recent'} onClick={() => setActiveTab('recent')} />
          </div>
          {activeTab === 'points' && <PointListPanel />}
          {activeTab === 'device' && <ChamberPropertiesPanel />}
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

      {/* Status bar — isolated component to avoid Layout re-renders during drag */}
      <StatusBar />
      <NewProjectDialog open={showNewProject} onClose={() => setShowNewProject(false)} />
      <ToastContainer />
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-[520px] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h2 className="text-base font-semibold">使用帮助</h2>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 text-sm text-gray-600 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">布点流程</h3>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>点击「新建」，选择模板（如灭菌器、冻干机）或自定义尺寸</li>
                  <li>在左侧工具栏选择 <strong>D=排水口</strong> / <strong>I=进气口</strong> / <strong>B=自带探头</strong>，点击画布放置</li>
                  <li>切换到「布点」标签，输入总点数，点击「执行布点」</li>
                  <li>拖拽布点微调位置；使用右侧 <strong>Z 滑块</strong> 改变选中点位的高度</li>
                  <li>点击「导出PNG」保存布点图</li>
                </ol>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">左侧工具栏</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span>↖ 选择</span><span>点击选中形状，拖拽移动</span>
                  <span>✋ 拖动</span><span>拖拽画布平移视图</span>
                  <span>+ 添加点位</span><span>在画布上手动添加布点</span>
                  <span>D 排水口</span><span>标记排水口位置（不计入总数）</span>
                  <span>I 进气口</span><span>标记进气口位置（不计入总数）</span>
                  <span>B 自带探头</span><span>标记设备自带探头（不计入总数）</span>
                  <span>✕ 删除选中</span><span>删除当前选中的形状</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">快捷键</h3>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <span>Ctrl+S</span><span>保存项目</span>
                  <span>Ctrl+O</span><span>打开项目</span>
                  <span>Ctrl+Z</span><span>撤销</span>
                  <span>Ctrl+Y</span><span>重做</span>
                  <span>Delete</span><span>删除选中形状</span>
                  <span>Esc</span><span>退出当前工具</span>
                  <span>滚轮</span><span>缩放画布</span>
                  <span>双击点位</span><span>编辑标签名</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-1">坐标系统</h3>
                <p className="text-xs">单位 mm。X=宽度，Y=深度，Z=高度。右侧 Z 滑块可切换高度层；选中点位后拖拽滑块可改变其 Z 坐标。</p>
              </div>
            </div>
          </div>
        </div>
      )}
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
