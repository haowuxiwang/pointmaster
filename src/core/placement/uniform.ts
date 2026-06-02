import { Chamber, ProbePointData, Point3D } from '@/types';

interface AnchorPoint {
  position: Point3D;
  label: string;
  type: string; // 'drain-port' | 'inlet-port' | 'built-in-probe'
}

function clampToChamber(pos: Point3D, chamber: Chamber): Point3D {
  const { width, depth, height } = chamber.dimensions;
  return {
    x: Math.max(0, Math.min(width, pos.x)),
    y: Math.max(0, Math.min(depth, pos.y)),
    z: Math.max(0, Math.min(height, pos.z)),
  };
}

function distance3D(a: Point3D, b: Point3D): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2);
}

export function uniformPlacement(
  chamber: Chamber,
  totalCount: number,
  options: { includeCenter?: boolean; anchorPoints?: AnchorPoint[] } = {}
): ProbePointData[] {
  const { includeCenter = true, anchorPoints = [] } = options;
  const { width, depth, height, layers = 1 } = chamber.dimensions;
  const ventPorts = chamber.ventPorts ?? [];

  // Helper: re-label all points sequentially as T1, T2, T3...
  const relabel = (pts: ProbePointData[]): ProbePointData[] =>
    pts.map((p, i) => ({ ...p, label: `T${i + 1}` }));

  // Generate points for vent ports (cold points) — these are mandatory and always included
  const ventPoints: ProbePointData[] = ventPorts.map((pos, i) => ({
    label: `C${i + 1}`,
    position: pos,
    properties: { type: 'vent-port' },
  }));

  // Corner points for cuboid (inset 5% from edges)
  const inset = 0.05;
  const cornerPositions: Point3D[] = [
    { x: width * inset, y: depth * inset, z: height * inset },
    { x: width * (1 - inset), y: depth * inset, z: height * inset },
    { x: width * inset, y: depth * (1 - inset), z: height * inset },
    { x: width * (1 - inset), y: depth * (1 - inset), z: height * inset },
    { x: width * inset, y: depth * inset, z: height * (1 - inset) },
    { x: width * (1 - inset), y: depth * inset, z: height * (1 - inset) },
    { x: width * inset, y: depth * (1 - inset), z: height * (1 - inset) },
    { x: width * (1 - inset), y: depth * (1 - inset), z: height * (1 - inset) },
  ];

  // Key points (corners + optional center)
  const keyPoints: ProbePointData[] = [];
  cornerPositions.forEach((pos, i) => {
    keyPoints.push({
      label: `K${i + 1}`,
      position: pos,
      properties: { type: 'corner' },
    });
  });
  if (includeCenter) {
    keyPoints.push({
      label: 'K9',
      position: { x: width / 2, y: depth / 2, z: height / 2 },
      properties: { type: 'center' },
    });
  }

  // Assemble mandatory points (vent ports + corners + center)
  // Anchor points (drain/inlet/built-in) are NOT mandatory — they don't consume budget
  const allMandatory: ProbePointData[] = [
    ...ventPoints,
    ...keyPoints,
  ];

  // Helper function to calculate position along axis (with 5% inset from edges)
  const calcPosition = (index: number, count: number, size: number): number => {
    if (count <= 1) return size / 2;
    const posInset = size * 0.05;
    return posInset + (index / (count - 1)) * (size - 2 * posInset);
  };

  let gridPoints: ProbePointData[] = [];
  let selectedMandatory: ProbePointData[] = [];

  if (layers > 1) {
    // Multi-layer: per-layer grid uses full budget, mandatory fills remaining
    let globalIndex = 1;
    let budget = totalCount;

    for (let layer = 0; layer < layers && budget > 0; layer++) {
      const layerZ = (height * (layer + 0.5)) / layers;
      const layersRemaining = layers - layer;
      const layerBudget = Math.ceil(budget / layersRemaining);

      const sqrtPoints = Math.sqrt(layerBudget);
      const targetNx = sqrtPoints * (width / (width + depth));
      const targetNy = sqrtPoints * (depth / (width + depth));
      let nx = Math.max(1, Math.floor(targetNx));
      let ny = Math.max(1, Math.floor(targetNy));
      while (nx * ny < layerBudget) {
        const ratioX = nx / targetNx;
        const ratioY = ny / targetNy;
        if (ratioX <= ratioY) nx++;
        else ny++;
      }

      for (let iy = 0; iy < ny && budget > 0; iy++) {
        for (let ix = 0; ix < nx && budget > 0; ix++) {
          gridPoints.push({
            label: `T${globalIndex}`,
            position: {
              x: calcPosition(ix, nx, width),
              y: calcPosition(iy, ny, depth),
              z: layerZ,
            },
            properties: {},
          });
          globalIndex++;
          budget--;
        }
      }
    }

    // Fill remaining budget with mandatory points (if grid didn't use all)
    if (budget > 0) {
      selectedMandatory = allMandatory.slice(0, budget);
    }
  } else {
    // Single layer: mandatory first, grid fills remaining
    selectedMandatory = allMandatory.slice(0, totalCount);
    const remainingCount = totalCount - selectedMandatory.length;

    if (remainingCount > 0) {
      // Single layer placement
      const total = width + depth + height;
      const cubeRoot = Math.cbrt(remainingCount);
      const targetNx = cubeRoot * (width / total);
      const targetNy = cubeRoot * (depth / total);
      const targetNz = cubeRoot * (height / total);
      let nx = Math.max(1, Math.floor(targetNx));
      let ny = Math.max(1, Math.floor(targetNy));
      let nz = Math.max(1, Math.floor(targetNz));
      while (nx * ny * nz < remainingCount) {
        const ratioX = nx / targetNx;
        const ratioY = ny / targetNy;
        const ratioZ = nz / targetNz;
        if (ratioX <= ratioY && ratioX <= ratioZ) nx++;
        else if (ratioY <= ratioZ) ny++;
        else nz++;
      }
      let index = 1;
      for (let iz = 0; iz < nz && gridPoints.length < remainingCount; iz++) {
        for (let iy = 0; iy < ny && gridPoints.length < remainingCount; iy++) {
          for (let ix = 0; ix < nx && gridPoints.length < remainingCount; ix++) {
            gridPoints.push({
              label: `T${index}`,
              position: {
                x: calcPosition(ix, nx, width),
                y: calcPosition(iy, ny, depth),
                z: calcPosition(iz, nz, height),
              },
              properties: {},
            });
            index++;
          }
        }
      }
    }
  }

  // Combine mandatory + grid points
  const allPoints = [...selectedMandatory, ...gridPoints];

  // Anchor nearby placement: for each anchor point, find the nearest non-vent/non-corner
  // grid point and move it to be near the anchor (offset 50mm toward chamber center)
  const ANCHOR_OFFSET = 50; // mm
  const usedAnchorIndices = new Set<number>();

  for (const anchor of anchorPoints) {
    let bestIdx = -1;
    let bestDist = Infinity;

    // Find nearest grid point (skip mandatory vent/corner/center points)
    for (let i = selectedMandatory.length; i < allPoints.length; i++) {
      if (usedAnchorIndices.has(i)) continue;
      const d = distance3D(allPoints[i].position, anchor.position);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      // Move the grid point to be near the anchor
      // Offset direction: from anchor toward chamber center (inward)
      const center: Point3D = { x: width / 2, y: depth / 2, z: height / 2 };
      const dx = center.x - anchor.position.x;
      const dy = center.y - anchor.position.y;
      const dz = center.z - anchor.position.z;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

      let newPos: Point3D;
      if (len > 0) {
        newPos = {
          x: anchor.position.x + (dx / len) * ANCHOR_OFFSET,
          y: anchor.position.y + (dy / len) * ANCHOR_OFFSET,
          z: anchor.position.z + (dz / len) * ANCHOR_OFFSET,
        };
      } else {
        // Anchor is at exact center — just place it there
        newPos = { ...anchor.position };
      }

      allPoints[bestIdx] = {
        ...allPoints[bestIdx],
        position: clampToChamber(newPos, chamber),
        properties: { type: `nearby-${anchor.type}` },
      };
      usedAnchorIndices.add(bestIdx);
    }
  }

  return relabel(allPoints);
}
