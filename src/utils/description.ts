import type { Chamber, ProbePointData, Point3D } from '@/types'

interface FixedShape {
  type: string
  position: Point3D
  label: string
}

function verticalLabel(z: number, height: number, layers: number): string {
  if (layers <= 1) return ''
  const ratio = z / height
  if (layers === 2) return ratio < 0.5 ? '下层' : '上层'
  // 3+ layers
  if (ratio < 0.33) return '下层'
  if (ratio < 0.67) return '中层'
  return '上层'
}

function horizontalLabel(x: number, width: number): string {
  const ratio = x / width
  if (ratio < 0.33) return '左'
  if (ratio < 0.67) return '中'
  return '右'
}

function depthLabel(y: number, depth: number): string {
  const ratio = y / depth
  if (ratio < 0.33) return '前'
  if (ratio < 0.67) return ''
  return '后'
}

function positionLabel(p: ProbePointData, chamber: Chamber): string {
  const { width, depth, height, layers = 1 } = chamber.dimensions
  const vert = verticalLabel(p.position.z, height, layers)
  const horiz = horizontalLabel(p.position.x, width)
  const depthStr = depthLabel(p.position.y, depth)

  // If horizontal is "中" and no depth, just say "中央"
  if (horiz === '中' && !depthStr) return `${vert}中央`
  if (horiz === '中' && depthStr) return `${vert}中央`
  return `${vert}${horiz}${depthStr}`
}

function distance3D(a: Point3D, b: Point3D): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  const dz = a.z - b.z
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}

function nearbyTypeLabel(type: string): string | null {
  switch (type) {
    case 'at-drain-port': return '与排水口重合'
    case 'at-inlet-port': return '与进气口重合'
    case 'at-built-in-probe': return '与自带探头重合'
    case 'vent-port': return '排气口冷点'
    case 'nearby-drain-port': return '靠近排水口'
    case 'nearby-inlet-port': return '靠近进气口'
    case 'nearby-built-in-probe': return '靠近自带探头'
    default: return null
  }
}

function findNearbySpecial(
  point: ProbePointData,
  fixedShapes: FixedShape[],
  threshold: number = 150,
): string | null {
  // Check the point's own property type first (set by uniformPlacement anchor logic)
  const selfLabel = nearbyTypeLabel(point.properties?.type ?? '')
  if (selfLabel) return selfLabel

  // Fall back to distance-based check against canvas fixed shapes
  for (const fs of fixedShapes) {
    const dist = distance3D(point.position, fs.position)
    if (dist < threshold) {
      switch (fs.type) {
        case 'drain-port': return '靠近排水口'
        case 'inlet-port': return '靠近进气口'
        case 'built-in-probe': return '靠近自带探头'
        case 'vent-port': return '靠近排气口冷点'
        default: return `靠近${fs.label}`
      }
    }
  }
  return null
}

export function generatePlacementDescription(
  chamber: Chamber,
  points: ProbePointData[],
  fixedShapes: FixedShape[] = [],
): string {
  const { name, dimensions } = chamber
  const { width, depth, height, layers = 1 } = dimensions

  const lines: string[] = [
    `${name}温度探头布点说明`,
    `设备尺寸：${width}×${depth}×${height}mm，共布${points.length}个温度探头，分${layers}层布置`,
    '',
  ]

  for (const p of points) {
    const pos = positionLabel(p, chamber)
    const nearby = findNearbySpecial(p, fixedShapes)
    const suffix = nearby ? `（${nearby}）` : ''
    lines.push(`${p.label} - ${pos}${suffix}`)
  }

  lines.push('')
  lines.push('所有探头不能接触盘管及罐壁')

  return lines.join('\n')
}
