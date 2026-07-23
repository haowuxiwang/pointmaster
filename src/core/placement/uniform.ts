import type { Chamber, ProbePointData, Point3D } from '@/types'

interface AnchorPoint {
  position: Point3D
  label: string
  type: string // 'drain-port' | 'inlet-port' | 'built-in-probe'
}

function distance3D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2)
}

/** Check if a 3D point lies inside the chamber's XY cross-section */
function isInsideChamberXY(x: number, y: number, chamber: Chamber): boolean {
  const { type, dimensions } = chamber
  if (type !== 'cylinder') return true // cuboid: always inside
  const radius = chamber.radius ?? Math.min(dimensions.width, dimensions.depth) / 2
  const cx = dimensions.width / 2
  const cy = dimensions.depth / 2
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius * radius
}

export function uniformPlacement(
  chamber: Chamber,
  totalCount: number,
  options: { includeCenter?: boolean; anchorPoints?: AnchorPoint[] } = {},
): ProbePointData[] {
  const { includeCenter = true, anchorPoints = [] } = options
  const { width, depth, height, layers = 1 } = chamber.dimensions

  // Helper: re-label all points sequentially as T1, T2, T3...
  const relabel = (pts: ProbePointData[]): ProbePointData[] =>
    pts.map((p, i) => ({ ...p, label: `T${i + 1}` }))

  // Corner points for cuboid (inset 5% from edges)
  const inset = 0.05
  const cornerPositions: Point3D[] = [
    { x: width * inset, y: depth * inset, z: height * inset },
    { x: width * (1 - inset), y: depth * inset, z: height * inset },
    { x: width * inset, y: depth * (1 - inset), z: height * inset },
    { x: width * (1 - inset), y: depth * (1 - inset), z: height * inset },
    { x: width * inset, y: depth * inset, z: height * (1 - inset) },
    { x: width * (1 - inset), y: depth * inset, z: height * (1 - inset) },
    { x: width * inset, y: depth * (1 - inset), z: height * (1 - inset) },
    { x: width * (1 - inset), y: depth * (1 - inset), z: height * (1 - inset) },
  ]

  // Filter keypoints to those inside chamber cross-section (relevant for cylinder)
  const keyPoints: ProbePointData[] = []
  cornerPositions.forEach((pos, i) => {
    // For cylinder: skip corners outside circular cross-section
    if (chamber.type === 'cylinder' && !isInsideChamberXY(pos.x, pos.y, chamber)) return
    keyPoints.push({
      label: `K${i + 1}`,
      position: pos,
      properties: { type: 'corner' },
    })
  })
  if (includeCenter) {
    keyPoints.push({
      label: 'K9',
      position: { x: width / 2, y: depth / 2, z: height / 2 },
      properties: { type: 'center' },
    })
  }

  // Assemble mandatory points (corners + center only)
  // vent-ports are NOT counted in totalCount — they are added alongside the budgeted points
  // Anchor points (drain/inlet/built-in) are NOT mandatory — they don't consume budget
  const allMandatory: ProbePointData[] = [...keyPoints]

  // Helper function to calculate position along axis (with 5% inset from edges)
  const calcPosition = (index: number, count: number, size: number): number => {
    if (count <= 1) return size / 2
    const posInset = size * 0.05
    return posInset + (index / (count - 1)) * (size - 2 * posInset)
  }

  const gridPoints: ProbePointData[] = []
  let selectedMandatory: ProbePointData[] = []

  if (layers > 1) {
    // Multi-layer: per-layer grid uses full budget, mandatory fills remaining
    let globalIndex = 1
    let budget = totalCount

    for (let layer = 0; layer < layers && budget > 0; layer++) {
      const layerZ = (height * (layer + 0.5)) / layers
      const layersRemaining = layers - layer
      const layerBudget = Math.ceil(budget / layersRemaining)

      const sqrtPoints = Math.sqrt(layerBudget)
      const targetNx = sqrtPoints * (width / (width + depth))
      const targetNy = sqrtPoints * (depth / (width + depth))
      let nx = Math.max(1, Math.floor(targetNx))
      let ny = Math.max(1, Math.floor(targetNy))
      while (nx * ny < layerBudget) {
        const ratioX = nx / targetNx
        const ratioY = ny / targetNy
        if (ratioX <= ratioY) nx++
        else ny++
      }

      for (let iy = 0; iy < ny && budget > 0; iy++) {
        for (let ix = 0; ix < nx && budget > 0; ix++) {
          const px = calcPosition(ix, nx, width)
          const py = calcPosition(iy, ny, depth)
          // For cylinder: skip grid points outside circular cross-section
          if (chamber.type === 'cylinder' && !isInsideChamberXY(px, py, chamber)) continue
          gridPoints.push({
            label: `T${globalIndex}`,
            position: { x: px, y: py, z: layerZ },
            properties: {},
          })
          globalIndex++
          budget--
        }
      }
    }

    // Fill remaining budget with mandatory points (if grid didn't use all)
    if (budget > 0) {
      selectedMandatory = allMandatory.slice(0, budget)
    }
  } else {
    // Single layer: mandatory first, grid fills remaining
    selectedMandatory = allMandatory.slice(0, totalCount)
    const remainingCount = totalCount - selectedMandatory.length

    if (remainingCount > 0) {
      // Single layer placement
      const total = width + depth + height
      const cubeRoot = Math.cbrt(remainingCount)
      const targetNx = cubeRoot * (width / total)
      const targetNy = cubeRoot * (depth / total)
      const targetNz = cubeRoot * (height / total)
      let nx = Math.max(1, Math.floor(targetNx))
      let ny = Math.max(1, Math.floor(targetNy))
      let nz = Math.max(1, Math.floor(targetNz))
      while (nx * ny * nz < remainingCount) {
        const ratioX = nx / targetNx
        const ratioY = ny / targetNy
        const ratioZ = nz / targetNz
        if (ratioX <= ratioY && ratioX <= ratioZ) nx++
        else if (ratioY <= ratioZ) ny++
        else nz++
      }
      let index = 1
      for (let iz = 0; iz < nz && gridPoints.length < remainingCount; iz++) {
        for (let iy = 0; iy < ny && gridPoints.length < remainingCount; iy++) {
          for (let ix = 0; ix < nx && gridPoints.length < remainingCount; ix++) {
            const px = calcPosition(ix, nx, width)
            const py = calcPosition(iy, ny, depth)
            // For cylinder: skip grid points outside circular cross-section
            if (chamber.type === 'cylinder' && !isInsideChamberXY(px, py, chamber)) continue
            gridPoints.push({
              label: `T${index}`,
              position: { x: px, y: py, z: calcPosition(iz, nz, height) },
              properties: {},
            })
            index++
          }
        }
      }
    }
  }

  // Combine mandatory + grid points
  const allPoints = [...selectedMandatory, ...gridPoints]

  // Anchor overlap placement: for each anchor point, find the nearest grid point
  // and move it to EXACTLY coincide with the anchor position.
  // Users can later drag the point away on the canvas if needed.
  const usedAnchorIndices = new Set<number>()
  const skippedAnchors: AnchorPoint[] = []
  const availableGridCount = allPoints.length - selectedMandatory.length

  for (const anchor of anchorPoints) {
    let bestIdx = -1
    let bestDist = Infinity

    // Find nearest grid point (skip mandatory corner/center points)
    for (let i = selectedMandatory.length; i < allPoints.length; i++) {
      if (usedAnchorIndices.has(i)) continue
      const d = distance3D(allPoints[i].position, anchor.position)
      if (d < bestDist) {
        bestDist = d
        bestIdx = i
      }
    }

    if (bestIdx >= 0) {
      // Place the probe exactly at the anchor position (user can drag it away later)
      allPoints[bestIdx] = {
        ...allPoints[bestIdx],
        position: { ...anchor.position },
        properties: { type: `at-${anchor.type}` },
      }
      usedAnchorIndices.add(bestIdx)
    } else {
      // No grid point available — anchor count exceeds grid point count
      skippedAnchors.push(anchor)
    }
  }

  // Emit warning if some anchors couldn't be matched (grid points exhausted)
  if (skippedAnchors.length > 0) {
    console.warn(
      `[uniformPlacement] ${skippedAnchors.length} anchor(s) could not be matched: ` +
        `grid points (${availableGridCount}) < anchor points (${anchorPoints.length}). ` +
        `Increase total count or reduce anchors.`,
    )
  }

  return relabel(allPoints)
}
