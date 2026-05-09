import { Chamber, ProbePointData } from '@/types';

export function uniformPlacement(chamber: Chamber, totalCount: number): ProbePointData[] {
  const { width, depth, height } = chamber.dimensions;
  const total = width + depth + height;
  const cubeRoot = Math.cbrt(totalCount);
  let nx = Math.max(1, Math.round(cubeRoot * (width / total) * 1.5));
  let ny = Math.max(1, Math.round(cubeRoot * (depth / total) * 1.5));
  let nz = Math.max(1, Math.round(cubeRoot * (height / total) * 1.5));
  while (nx * ny * nz > totalCount * 1.5 && nx > 1 && ny > 1 && nz > 1) {
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
  return points;
}
