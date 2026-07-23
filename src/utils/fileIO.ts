import { ProjectData } from '@/types'

const RECENT_PROJECTS_KEY = 'validation-layout-recent'
const MAX_RECENT = 10
const CURRENT_VERSION = '1.0'
const SUPPORTED_VERSIONS = [CURRENT_VERSION]

function validateProjectData(data: unknown): data is ProjectData {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>

  // Version check
  if (typeof d.version !== 'string' || !SUPPORTED_VERSIONS.includes(d.version)) return false

  // Name check (must be non-empty after trim)
  if (typeof d.name !== 'string' || !d.name.trim()) return false

  // Chamber structure check
  if (typeof d.chamber !== 'object' || d.chamber === null) return false
  const chamber = d.chamber as Record<string, unknown>
  if (chamber.type !== 'cuboid' && chamber.type !== 'cylinder' && chamber.type !== 'polygon')
    return false
  if (typeof chamber.dimensions !== 'object' || chamber.dimensions === null) return false
  const dims = chamber.dimensions as Record<string, unknown>
  if (typeof dims.width !== 'number' || dims.width <= 0) return false
  if (typeof dims.depth !== 'number' || dims.depth <= 0) return false
  if (typeof dims.height !== 'number' || dims.height <= 0) return false

  // Points array element check
  if (!Array.isArray(d.points)) return false
  for (const p of d.points) {
    if (typeof p !== 'object' || p === null) return false
    const point = p as Record<string, unknown>
    if (typeof point.label !== 'string') return false
    if (typeof point.position !== 'object' || point.position === null) return false
    const pos = point.position as Record<string, unknown>
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number' || typeof pos.z !== 'number')
      return false
  }

  // Date checks
  if (typeof d.createdAt !== 'string' || isNaN(Date.parse(d.createdAt))) return false
  if (typeof d.updatedAt !== 'string' || isNaN(Date.parse(d.updatedAt))) return false

  return true
}

export async function saveProjectToFile(project: ProjectData): Promise<boolean> {
  const json = JSON.stringify(project, null, 2)

  if (window.electronAPI) {
    const filePath = await window.electronAPI.saveFile(json, `${project.name}.vlp.json`)
    if (filePath) {
      addToRecent(project)
      return true
    }
    return false
  }

  // Browser fallback
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name}.vlp.json`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  addToRecent(project)
  return true
}

export async function loadProjectFromFile(): Promise<ProjectData> {
  let text: string

  if (window.electronAPI) {
    const content = await window.electronAPI.openFile()
    if (content === null) throw new Error('cancelled')
    text = content
  } else {
    // Browser fallback
    text = await new Promise<string>((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,.vlp.json'
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return reject(new Error('No file selected'))
        window.removeEventListener('focus', onFocusBack)
        resolve(await file.text())
      }
      // Detect cancel: when focus returns to window without triggering onchange
      const onFocusBack = () => {
        setTimeout(() => {
          if (!input.files?.length) {
            reject(new Error('cancelled'))
          }
        }, 200)
      }
      window.addEventListener('focus', onFocusBack, { once: true })
      input.click()
    })
  }

  const parsed = JSON.parse(text)
  if (!validateProjectData(parsed)) {
    throw new Error('Invalid project file format')
  }
  addToRecent(parsed)
  return parsed
}

export function getRecentProjects(): ProjectData[] {
  try {
    const stored = localStorage.getItem(RECENT_PROJECTS_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addToRecent(project: ProjectData): void {
  try {
    // Dedup by name: keep the newer version
    const recent = getRecentProjects().filter((p) => {
      if (p.name !== project.name) return true
      // Same name: keep if existing is newer
      return new Date(p.updatedAt) > new Date(project.updatedAt)
    })
    recent.unshift(project)
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch (err) {
    if (err instanceof DOMException && err.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, cannot save recent project')
    } else {
      console.error('Failed to save recent project:', err)
    }
  }
}
