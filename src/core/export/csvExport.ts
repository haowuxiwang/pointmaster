import type { Chamber, ProbePointData, Point3D } from '@/types'

interface FixedShape {
  type: string
  position: Point3D
  label: string
}

/** Generate CSV content for point placement manifest */
export function generateCSV(
  chamber: Chamber,
  points: ProbePointData[],
  fixedShapes: FixedShape[] = [],
): string {
  const { name, dimensions } = chamber
  const { width, depth, height, layers = 1 } = dimensions

  const header = ['序号', '标签', 'X(mm)', 'Y(mm)', 'Z(mm)', '位置描述', '备注']

  const rows = points.map((p, i) => {
    const pos = getPositionLabel(p, chamber)
    const nearby = getNearbyLabel(p, fixedShapes)
    return [
      String(i + 1),
      p.label,
      String(Math.round(p.position.x)),
      String(Math.round(p.position.y)),
      String(Math.round(p.position.z)),
      pos,
      nearby,
    ]
  })

  const meta = [
    [`设备名称`, name, '', '', '', '', ''],
    [`设备尺寸`, `${width}×${depth}×${height}mm`, '', '', '', '', ''],
    [`布点数量`, String(points.length), '', '', '', '', ''],
    [`层数`, String(layers), '', '', '', '', ''],
    [], // empty row
  ]

  const allRows = [...meta, header, ...rows]
  return allRows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

function csvEscape(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`
  }
  return val
}

function getPositionLabel(p: ProbePointData, chamber: Chamber): string {
  const { width, depth, height, layers = 1 } = chamber.dimensions
  const zRatio = p.position.z / height
  const xRatio = p.position.x / width
  const yRatio = p.position.y / depth

  let vert = ''
  if (layers >= 2) {
    if (layers === 2) vert = zRatio < 0.5 ? '下层' : '上层'
    else if (zRatio < 0.33) vert = '下层'
    else if (zRatio < 0.67) vert = '中层'
    else vert = '上层'
  }

  const horiz = xRatio < 0.33 ? '左' : xRatio < 0.67 ? '中' : '右'
  const depthStr = yRatio < 0.33 ? '前' : yRatio < 0.67 ? '' : '后'

  if (horiz === '中' && !depthStr) return `${vert}中央`
  return `${vert}${horiz}${depthStr}`
}

function getNearbyLabel(point: ProbePointData, fixedShapes: FixedShape[]): string {
  switch (point.properties?.type) {
    case 'at-drain-port':
      return '与排水口重合'
    case 'at-inlet-port':
      return '与进气口重合'
    case 'at-built-in-probe':
      return '与自带探头重合'
    default:
      break
  }
  for (const fs of fixedShapes) {
    const d = distance3D(point.position, fs.position)
    if (d < 150) {
      switch (fs.type) {
        case 'drain-port':
          return '靠近排水口'
        case 'inlet-port':
          return '靠近进气口'
        case 'built-in-probe':
          return '靠近自带探头'
        default:
          return `靠近${fs.label}`
      }
    }
  }
  return ''
}

function distance3D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}
