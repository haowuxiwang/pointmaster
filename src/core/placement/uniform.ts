import { Chamber, ProbePointData, Point3D } from '@/types';

interface ExtraFixedPoint {
  position: Point3D;
  label: string;
  type: string;
}

export function uniformPlacement(
  chamber: Chamber,
  totalCount: number,
  extraFixedPoints: ExtraFixedPoint[] = []
): ProbePointData[] {
  const { width, depth, height, layers = 1 } = chamber.dimensions;
  const ventPorts = chamber.ventPorts ?? [];

  // Helper: re-label all points sequentially as T1, T2, T3...
  const relabel = (pts: ProbePointData[]): ProbePointData[] =>
    pts.map((p, i) => ({ ...p, label: `T${i + 1}` }));

  // Generate points for vent ports (cold points)
  const ventPoints: ProbePointData[] = ventPorts.map((pos, i) => ({
    label: `C${i + 1}`,
    position: pos,
    properties: { type: 'vent-port' },
  }));

  // Generate points for extra fixed points (drain ports, inlet ports from canvas)
  const extraPoints: ProbePointData[] = extraFixedPoints.map((fp) => ({
    label: fp.label,
    position: fp.position,
    properties: { type: fp.type },
  }));

  // Corner points for cuboid (inset 5% from edges - closer to edges for better coverage)
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

  // Center point
  const centerPosition: Point3D = { x: width / 2, y: depth / 2, z: height / 2 };

  // Key points (corners + center)
  const keyPoints: ProbePointData[] = [];
  cornerPositions.forEach((pos, i) => {
    keyPoints.push({
      label: `K${i + 1}`,
      position: pos,
      properties: { type: 'corner' },
    });
  });
  keyPoints.push({
    label: 'K9',
    position: centerPosition,
    properties: { type: 'center' },
  });

  // Remaining points for uniform distribution
  const remainingCount = Math.max(0, totalCount - keyPoints.length - ventPoints.length - extraPoints.length);

  // Helper function to calculate position along axis (with 5% inset from edges)
  const calcPosition = (index: number, count: number, size: number): number => {
    if (count <= 1) return size / 2; // Single point goes to center
    const inset = size * 0.05; // 5% inset from edges
    return inset + (index / (count - 1)) * (size - 2 * inset);
  };

  if (layers > 1) {
    // Per-layer placement
    const pointsPerLayer = Math.ceil(remainingCount / layers);
    const points: ProbePointData[] = [];
    let globalIndex = 1;

    for (let layer = 0; layer < layers; layer++) {
      const layerZ = (height * (layer + 0.5)) / layers;

      // Calculate grid for this layer
      const sqrtPoints = Math.sqrt(pointsPerLayer);
      let nx = Math.max(1, Math.round(sqrtPoints * (width / (width + depth))));
      let ny = Math.max(1, Math.round(sqrtPoints * (depth / (width + depth))));

      // Adjust to not exceed pointsPerLayer too much
      while (nx * ny > pointsPerLayer * 1.5 && nx > 1 && ny > 1) {
        if (nx >= ny) nx--;
        else ny--;
      }

      for (let iy = 0; iy < ny; iy++) {
        for (let ix = 0; ix < nx; ix++) {
          points.push({
            label: `T${globalIndex}`,
            position: {
              x: calcPosition(ix, nx, width),
              y: calcPosition(iy, ny, depth),
              z: layerZ,
            },
            properties: {},
          });
          globalIndex++;
        }
      }
    }

    return relabel([...ventPoints, ...extraPoints, ...keyPoints, ...points]);
  }

  // Single layer placement
  if (remainingCount <= 0) {
    return relabel([...ventPoints, ...extraPoints, ...keyPoints]);
  }

  const total = width + depth + height;
  const cubeRoot = Math.cbrt(remainingCount);
  let nx = Math.max(1, Math.round(cubeRoot * (width / total) * 1.5));
  let ny = Math.max(1, Math.round(cubeRoot * (depth / total) * 1.5));
  let nz = Math.max(1, Math.round(cubeRoot * (height / total) * 1.5));
  while (nx * ny * nz > remainingCount * 1.5 && nx > 1 && ny > 1 && nz > 1) {
    if (nx >= ny && nx >= nz) nx--;
    else if (ny >= nz) ny--;
    else nz--;
  }
  const points: ProbePointData[] = [];
  let index = 1;
  for (let iz = 0; iz < nz; iz++) {
    for (let iy = 0; iy < ny; iy++) {
      for (let ix = 0; ix < nx; ix++) {
        points.push({
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
  return relabel([...ventPoints, ...extraPoints, ...keyPoints, ...points]);
}
