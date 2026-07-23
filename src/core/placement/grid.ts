import { Chamber, ProbePointData } from '@/types'

export function gridPlacement(
  chamber: Chamber,
  counts: { x: number; y: number; z: number },
): ProbePointData[] {
  const { width, depth, height } = chamber.dimensions
  const points: ProbePointData[] = []
  let index = 1
  for (let iz = 0; iz < counts.z; iz++) {
    for (let iy = 0; iy < counts.y; iy++) {
      for (let ix = 0; ix < counts.x; ix++) {
        points.push({
          label: `T${index}`,
          position: {
            x: (width * (ix + 1)) / (counts.x + 1),
            y: (depth * (iy + 1)) / (counts.y + 1),
            z: (height * (iz + 1)) / (counts.z + 1),
          },
          properties: {},
        })
        index++
      }
    }
  }
  return points
}
