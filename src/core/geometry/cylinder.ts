import { Point3D } from '@/types'

interface CylinderParams {
  radius: number
  height: number
}

export function getCylinderVertices(params: CylinderParams, segments: number = 16): Point3D[] {
  const { radius, height } = params
  const vertices: Point3D[] = []
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments
    vertices.push({
      x: radius + radius * Math.cos(angle),
      y: radius + radius * Math.sin(angle),
      z: 0,
    })
  }
  for (let i = 0; i < segments; i++) {
    const angle = (2 * Math.PI * i) / segments
    vertices.push({
      x: radius + radius * Math.cos(angle),
      y: radius + radius * Math.sin(angle),
      z: height,
    })
  }
  return vertices
}

export function getCylinderEdges(segments: number): [number, number][] {
  const edges: [number, number][] = []
  for (let i = 0; i < segments; i++) edges.push([i, (i + 1) % segments])
  for (let i = 0; i < segments; i++) edges.push([segments + i, segments + ((i + 1) % segments)])
  for (let i = 0; i < segments; i++) edges.push([i, segments + i])
  return edges
}
