import { Point2D, Nozzle } from '@/types';
import { project3Dto2D, projectEllipse, CHAMBER_SCALE } from '@/core/projection/isometric';

export interface CuboidRender {
  faces: { path: string; fill: string }[];
  edges: string;
  layers: string;
}

export function cuboidPath(w: number, d: number, h: number, scale: number = CHAMBER_SCALE, layers: number = 1): CuboidRender {
  const p = (x: number, y: number, z: number) => project3Dto2D(x, y, z, scale);
  const v = [
    p(0, 0, 0), p(w, 0, 0), p(w, d, 0), p(0, d, 0),
    p(0, 0, h), p(w, 0, h), p(w, d, h), p(0, d, h),
  ];

  // Three visible faces (isometric standard view)
  const faces = [
    { // Top face (z=h)
      path: `M ${v[4].x} ${v[4].y} L ${v[5].x} ${v[5].y} L ${v[6].x} ${v[6].y} L ${v[7].x} ${v[7].y} Z`,
      fill: '#f0f0f0',
    },
    { // Front face (y=0)
      path: `M ${v[0].x} ${v[0].y} L ${v[1].x} ${v[1].y} L ${v[5].x} ${v[5].y} L ${v[4].x} ${v[4].y} Z`,
      fill: '#d8d8d8',
    },
    { // Right face (x=w)
      path: `M ${v[1].x} ${v[1].y} L ${v[2].x} ${v[2].y} L ${v[6].x} ${v[6].y} L ${v[5].x} ${v[5].y} Z`,
      fill: '#c0c0c0',
    },
  ];

  // 12 edges of cuboid
  const allEdges: [Point2D, Point2D][] = [
    // Bottom face (4 edges)
    [v[0], v[1]], [v[1], v[2]], [v[2], v[3]], [v[3], v[0]],
    // Top face (4 edges)
    [v[4], v[5]], [v[5], v[6]], [v[6], v[7]], [v[7], v[4]],
    // Vertical (4 edges)
    [v[0], v[4]], [v[1], v[5]], [v[2], v[6]], [v[3], v[7]],
  ];

  const edges = allEdges.map(([a, b]) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`).join(' ');

  // Layer lines
  let layerPaths = '';
  if (layers > 1) {
    const layerLineSegments: [Point2D, Point2D][] = [];
    for (let i = 1; i < layers; i++) {
      const z = (h * i) / layers;
      const layerV = [
        p(0, 0, z), p(w, 0, z), p(w, d, z), p(0, d, z),
      ];
      layerLineSegments.push(
        [layerV[0], layerV[1]],
        [layerV[1], layerV[2]],
        [layerV[2], layerV[3]],
        [layerV[3], layerV[0]],
      );
    }
    layerPaths = layerLineSegments.map(([a, b]) => `M ${a.x} ${a.y} L ${b.x} ${b.y}`).join(' ');
  }

  return { faces, edges, layers: layerPaths };
}

export interface CylinderRender {
  /** Full top ellipse arc path */
  topEllipse: string;
  /** Back half of bottom ellipse (drawn dashed) */
  bottomBackArc: string;
  /** Front half of bottom ellipse (drawn solid) */
  bottomFrontArc: string;
  /** Left and right generatrix lines */
  sideLines: string;
  /** Front curved face fill path */
  frontFill: string;
  /** Top ellipse fill path */
  topFill: string;
  /** Layer ellipse paths */
  layers: string;
  /** Dished head path */
  headPath: string;
  /** Support legs path */
  supportsPath: string;
  /** Nozzle paths */
  nozzlesPath: string;
  /** Nozzle label positions */
  nozzleLabels: Array<{ x: number; y: number; name: string }>;
  /** Coil path (internal helical coils) */
  coilPath: string;
}

export function cylinderPath(
  radius: number,
  height: number,
  scale: number = CHAMBER_SCALE,
  layers: number = 1,
  nozzles?: Nozzle[],
  hasCoil?: boolean,
): CylinderRender {
  const cx3d = radius;
  const cy3d = radius;

  // Project bottom and top ellipses using the ellipse projection function
  const bottom = projectEllipse(cx3d, cy3d, 0, radius, scale);
  const top = projectEllipse(cx3d, cy3d, height, radius, scale);

  const { rx, ry } = bottom; // Same rx, ry for both (same radius, same z-plane orientation)

  // --- Ellipse arc helpers ---
  // Front half (lower in screen space, sweep=1 = clockwise through bottom)
  const frontArc = (cx: number, cy: number) =>
    `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`;
  // Back half (upper in screen space, sweep=0 = counter-clockwise through top)
  const backArc = (cx: number, cy: number) =>
    `M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 0 ${cx + rx} ${cy}`;
  // Full ellipse (two arcs)
  const fullEllipse = (cx: number, cy: number) =>
    `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}`;

  // --- Ellipse arcs ---
  const topEllipse = fullEllipse(top.cx, top.cy);
  const bottomBackArc = backArc(bottom.cx, bottom.cy);
  const bottomFrontArc = frontArc(bottom.cx, bottom.cy);

  // --- Side silhouette lines (left and right generatrices) ---
  const sideLines = [
    `M ${bottom.cx - rx} ${bottom.cy} L ${top.cx - rx} ${top.cy}`,
    `M ${bottom.cx + rx} ${bottom.cy} L ${top.cx + rx} ${top.cy}`,
  ].join(' ');

  // --- Front face fill: bottom front arc → right side up → top front arc (reversed) → left side down ---
  const frontFill = [
    `M ${bottom.cx - rx} ${bottom.cy}`,
    `A ${rx} ${ry} 0 0 1 ${bottom.cx + rx} ${bottom.cy}`,  // bottom front arc
    `L ${top.cx + rx} ${top.cy}`,                             // right generatrix up
    `A ${rx} ${ry} 0 0 0 ${top.cx - rx} ${top.cy}`,          // top front arc (reversed)
    'Z',                                                       // left generatrix down
  ].join(' ');

  // --- Top face fill (full ellipse) ---
  const topFill = fullEllipse(top.cx, top.cy);

  // --- Layer ellipses ---
  let layersPath = '';
  if (layers > 1) {
    const layerParts: string[] = [];
    for (let l = 1; l < layers; l++) {
      const z = (height * l) / layers;
      const layerEllipse = projectEllipse(cx3d, cy3d, z, radius, scale);
      layerParts.push(fullEllipse(layerEllipse.cx, layerEllipse.cy));
    }
    layersPath = layerParts.join(' ');
  }

  // --- Details: dished head using cubic Bezier ---
  const headHeight = radius * 0.25;
  const headScreenHeight = headHeight * scale;
  const headPath = [
    `M ${top.cx - rx} ${top.cy}`,
    `C ${top.cx - rx * 0.5} ${top.cy - headScreenHeight * 1.3}`,
    `  ${top.cx + rx * 0.5} ${top.cy - headScreenHeight * 1.3}`,
    `  ${top.cx + rx} ${top.cy}`,
  ].join(' ');

  // --- Support legs (3 legs at 120° intervals) ---
  const p = (x: number, y: number, z: number) => project3Dto2D(x, y, z, scale);
  const supportHeight = 50;
  const supportRadius = radius * 0.8;
  const supportWidth = 15;
  const supportPaths: string[] = [];
  for (let i = 0; i < 3; i++) {
    const angle = (2 * Math.PI * i) / 3 + Math.PI / 6;
    const x1 = cx3d + (supportRadius - supportWidth / 2) * Math.cos(angle);
    const y1 = cy3d + (supportRadius - supportWidth / 2) * Math.sin(angle);
    const x2 = cx3d + (supportRadius + supportWidth / 2) * Math.cos(angle);
    const y2 = cy3d + (supportRadius + supportWidth / 2) * Math.sin(angle);

    const p1Bot = p(x1, y1, -supportHeight);
    const p2Bot = p(x2, y2, -supportHeight);
    const p1Top = p(x1, y1, 0);
    const p2Top = p(x2, y2, 0);

    if (angle < Math.PI || angle > 2 * Math.PI * 0.75) {
      supportPaths.push(
        `M ${p1Bot.x} ${p1Bot.y} L ${p1Top.x} ${p1Top.y}`,
        `M ${p2Bot.x} ${p2Bot.y} L ${p2Top.x} ${p2Top.y}`,
        `M ${p1Bot.x} ${p1Bot.y} L ${p2Bot.x} ${p2Bot.y}`,
      );
    }
  }
  const supportsPath = supportPaths.join(' ');

  // --- Nozzles ---
  const nozzlePaths: string[] = [];
  const nozzleLabels: Array<{ x: number; y: number; name: string }> = [];

  if (nozzles && nozzles.length > 0) {
    // Dynamic nozzles from template definition
    for (const nozzle of nozzles) {
      const np = p(nozzle.position.x, nozzle.position.y, nozzle.position.z)
      const flangeSize = radius * 0.08
      // Draw flange symbol (small rectangle)
      nozzlePaths.push(
        `M ${np.x - flangeSize} ${np.y - flangeSize} L ${np.x + flangeSize} ${np.y - flangeSize} L ${np.x + flangeSize} ${np.y + flangeSize} L ${np.x - flangeSize} ${np.y + flangeSize} Z`,
      )
      nozzleLabels.push({ x: np.x, y: np.y, name: nozzle.name })
    }
  } else {
    // Default nozzles (backward compatible)
    const nozzleHeight = 30;
    const nozzleRadius = radius * 0.15;
    const nozzleX = cx3d;
    const nozzleY = cy3d - radius * 0.5;
    const nz1 = p(nozzleX - nozzleRadius, nozzleY, height + headHeight);
    const nz2 = p(nozzleX + nozzleRadius, nozzleY, height + headHeight);
    const nz3 = p(nozzleX - nozzleRadius, nozzleY, height + headHeight + nozzleHeight);
    const nz4 = p(nozzleX + nozzleRadius, nozzleY, height + headHeight + nozzleHeight);
    nozzlePaths.push(
      `M ${nz1.x} ${nz1.y} L ${nz3.x} ${nz3.y}`,
      `M ${nz2.x} ${nz2.y} L ${nz4.x} ${nz4.y}`,
      `M ${nz3.x} ${nz3.y} L ${nz4.x} ${nz4.y}`,
    );

    const sideNozzleLength = 20;
    const sideNozzleRadius = 8;
    const sideZ = height * 0.7;
    const sideX = cx3d + radius;
    const sideY = cy3d;
    const sn1 = p(sideX, sideY - sideNozzleRadius, sideZ);
    const sn2 = p(sideX, sideY + sideNozzleRadius, sideZ);
    const sn3 = p(sideX + sideNozzleLength, sideY - sideNozzleRadius, sideZ);
    const sn4 = p(sideX + sideNozzleLength, sideY + sideNozzleRadius, sideZ);
    nozzlePaths.push(
      `M ${sn1.x} ${sn1.y} L ${sn3.x} ${sn3.y}`,
      `M ${sn2.x} ${sn2.y} L ${sn4.x} ${sn4.y}`,
      `M ${sn3.x} ${sn3.y} L ${sn4.x} ${sn4.y}`,
    );
  }

  const nozzlesPath = nozzlePaths.join(' ');

  // --- Coil (internal helical coils) ---
  let coilPath = '';
  if (hasCoil) {
    const coilRadius = radius * 0.7;
    const coilTurns = 5;
    const coilParts: string[] = [];
    for (let i = 0; i < coilTurns; i++) {
      const z = (height * (i + 1)) / (coilTurns + 1);
      const coilEllipse = projectEllipse(cx3d, cy3d, z, coilRadius, scale);
      const cFrontArc = `M ${coilEllipse.cx - coilEllipse.rx} ${coilEllipse.cy} A ${coilEllipse.rx} ${coilEllipse.ry} 0 0 1 ${coilEllipse.cx + coilEllipse.rx} ${coilEllipse.cy}`;
      coilParts.push(cFrontArc);
    }
    coilPath = coilParts.join(' ');
  }

  return {
    topEllipse,
    bottomBackArc,
    bottomFrontArc,
    sideLines,
    frontFill,
    topFill,
    layers: layersPath,
    headPath,
    supportsPath,
    nozzlesPath,
    nozzleLabels,
    coilPath,
  };
}
