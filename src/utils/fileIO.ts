import { ProjectData } from '@/types'

const RECENT_PROJECTS_KEY = 'validation-layout-recent'
const MAX_RECENT = 10

export function saveProjectToFile(project: ProjectData): void {
  const json = JSON.stringify(project, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${project.name}.vlp.json`
  a.click()
  URL.revokeObjectURL(url)
  addToRecent(project)
}

export function loadProjectFromFile(): Promise<ProjectData> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,.vlp.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return reject(new Error('No file selected'))
      const text = await file.text()
      const data = JSON.parse(text) as ProjectData
      addToRecent(data)
      resolve(data)
    }
    input.oncancel = () => {
      reject(new Error('File selection cancelled'))
    }
    input.click()
  })
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
  const recent = getRecentProjects().filter((p) => p.name !== project.name)
  recent.unshift(project)
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)))
}
