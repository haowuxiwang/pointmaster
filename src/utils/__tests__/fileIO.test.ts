// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getRecentProjects, saveProjectToFile } from '../fileIO'
import type { ProjectData } from '@/types'

const testProject: ProjectData = {
  version: '1.0',
  name: '测试项目',
  chamber: {
    type: 'cuboid',
    name: '测试设备',
    dimensions: { width: 1000, depth: 600, height: 800 },
  },
  points: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
}

describe('getRecentProjects', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns empty array when localStorage is empty', () => {
    expect(getRecentProjects()).toEqual([])
  })

  it('parses stored projects', () => {
    const projects = [testProject]
    localStorage.setItem('validation-layout-recent', JSON.stringify(projects))
    expect(getRecentProjects()).toEqual(projects)
  })

  it('returns empty array on invalid JSON', () => {
    localStorage.setItem('validation-layout-recent', 'invalid-json')
    expect(getRecentProjects()).toEqual([])
  })
})

describe('saveProjectToFile', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('creates download link and clicks it', () => {
    const mockClick = vi.fn()
    const mockAnchor = {
      href: '',
      download: '',
      click: mockClick,
    }

    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    saveProjectToFile(testProject)

    expect(document.createElement).toHaveBeenCalledWith('a')
    expect(mockAnchor.download).toBe('测试项目.vlp.json')
    expect(mockClick).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })

  it('adds project to recent list', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    saveProjectToFile(testProject)

    const recent = getRecentProjects()
    expect(recent).toHaveLength(1)
    expect(recent[0].name).toBe('测试项目')
  })

  it('keeps max 10 recent projects', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    // Save 12 projects
    for (let i = 1; i <= 12; i++) {
      saveProjectToFile({ ...testProject, name: `项目${i}` })
    }

    const recent = getRecentProjects()
    expect(recent).toHaveLength(10)
    expect(recent[0].name).toBe('项目12') // Most recent first
  })

  it('deduplicates projects by name', () => {
    const mockAnchor = { href: '', download: '', click: vi.fn() }
    vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    saveProjectToFile(testProject)
    saveProjectToFile(testProject) // Same name

    const recent = getRecentProjects()
    expect(recent).toHaveLength(1)
  })
})
