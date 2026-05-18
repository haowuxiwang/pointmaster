import type { Chamber, ProbePointData } from '@/types'

interface LegendEntry {
  label: string
  description: string
}

declare module '@tldraw/tlschema' {
  interface TLGlobalShapePropsMap {
    chamber: { w: number; h: number; chamberData: Chamber }
    'probe-point': { w: number; h: number; pointData: ProbePointData }
    'text-annotation': { w: number; h: number; content: string; fontSize: number }
    dimension: { w: number; h: number; from: import('@/types').Point3D; to: import('@/types').Point3D; label: string }
    legend: { w: number; h: number; title: string; entries: LegendEntry[] }
    'drain-port': { w: number; h: number; label: string; pointData: ProbePointData }
    'built-in-probe': { w: number; h: number; label: string; pointData: ProbePointData }
    'inlet-port': { w: number; h: number; label: string; pointData: ProbePointData }
  }
}
