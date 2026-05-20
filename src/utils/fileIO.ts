import { ProjectData } from '@/types'

const RECENT_PROJECTS_KEY = 'validation-layout-recent'
const MAX_RECENT = 10

function validateProjectData(data: unknown): data is ProjectData {
  if (typeof data !== 'object' || data === null) return false
  const d = data as Record<string, unknown>
  return (
    typeof d.version === 'string' &&
    typeof d.name === 'string' &&
    typeof d.chamber === 'object' && d.chamber !== null &&
    Array.isArray(d.points) &&
    typeof d.createdAt === 'string' &&
    typeof d.updatedAt === 'string'
  )
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
  URL.revokeObjectURL(url)
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
        resolve(await file.text())
      }
      input.oncancel = () => reject(new Error('cancelled'))
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
    const recent = getRecentProjects().filter((p) => p.name !== project.name)
    recent.unshift(project)
    localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
  } catch {
    // QuotaExceededError — silently ignore
  }
}
