import { Chamber, ProbePointData, Point3D } from '@/types';

export function uniformPlacement(chamber: Chamber, totalCount: number): ProbePointData[] {
  const { width, depth, height, layers = 1 } = chamber.dimensions;
  const ventPorts = chamber.ventPorts ?? [];

  // Generate points for vent ports (cold points)
  const ventPoints: ProbePointData[] = ventPorts.map((pos, i) => ({
    label: `C${i + 1}`,
    position: pos,
    properties: { type: 'vent-port' },
  }));

  // Corner points for cuboid
  const cornerPositions: Point3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: width, y: 0, z: 0 },
    { x: 0, y: depth, z: 0 },
    { x: width, y: depth, z: 0 },
    { x: 0, y: 0, z: height },
    { x: width, y: 0, z: height },
    { x: 0, y: depth, z: height },
    { x: width, y: depth, z: height },
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
  const remainingCount = Math.max(0, totalCount - keyPoints.length - ventPoints.length);

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
              x: width * (ix + 1) / (nx + 1),
              y: depth * (iy + 1) / (ny + 1),
              z: layerZ,
            },
            properties: {},
          });
          globalIndex++;
        }
      }
    }

    return [...ventPoints, ...keyPoints, ...points];
  }

  // Single layer placement
  if (remainingCount <= 0) {
    return [...ventPoints, ...keyPoints];
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
          position: { x: width*(ix+1)/(nx+1), y: depth*(iy+1)/(ny+1), z: height*(iz+1)/(nz+1) },
          properties: {},
        });
        index++;
      }
    }
  }
  return [...ventPoints, ...keyPoints, ...points];
}
