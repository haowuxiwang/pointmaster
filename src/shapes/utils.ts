import { Point2D, Nozzle } from '@/types';
import { project3Dto2D, CHAMBER_SCALE, CYLINDER_COMPRESSION } from '@/core/projection/isometric';

// ─── Cuboid wireframe ───────────────────────────────────────────────

export interface CuboidRender {
  /** Visible edges (solid lines) */
  visibleEdges: string;
  /** Hidden edges (dashed lines) */
  hiddenEdges: string;
  /** Layer divider lines (dashed) */
  layers: string;
}

export function cuboidPath(
  w: number,
  d: number,
  h: number,
  scale: number = CHAMBER_SCALE,
  layers: number = 1,
  cameraDir: { x: number; y: number; z: number } = { x: 1, y: 1, z: 1 },
): CuboidRender {
  const p = (x: number, y: number, z: number) => project3Dto2D(x, y, z, scale);
  // 3D vertices for face normal computation
  const v3d = [
    {x:0,y:0,z:0}, {x:w,y:0,z:0}, {x:w,y:d,z:0}, {x:0,y:d,z:0}, // 0-3 bottom
    {x:0,y:0,z:h}, {x:w,y:0,z:h}, {x:w,y:d,z:h}, {x:0,y:d,z:h}, // 4-7 top
  ];
  const v = v3d.map(pt => project3Dto2D(pt.x, pt.y, pt.z, scale));

  // 6 faces with their vertex indices (CCW when viewed from outside)
  const faces = [
    { verts: [0,3,2,1], name: 'bottom' }, // z=0
    { verts: [4,5,6,7], name: 'top'    }, // z=h
    { verts: [0,1,5,4], name: 'front'  }, // y=0
    { verts: [2,3,7,6], name: 'back'   }, // y=d
    { verts: [0,4,7,3], name: 'left'   }, // x=0
    { verts: [1,2,6,5], name: 'right'  }, // x=w
  ];

  // Compute face normal via cross product of two edge vectors
  const sub = (a: any, b: any) => ({ x: a.x-b.x, y: a.y-b.y, z: a.z-b.z });
  const cross = (a: any, b: any) => ({ x: a.y*b.z-a.z*b.y, y: a.z*b.x-a.x*b.z, z: a.x*b.y-a.y*b.x });
  const dot = (a: any, b: any) => a.x*b.x + a.y*b.y + a.z*b.z;

  const hiddenFaces = new Set<string>();
  for (const f of faces) {
    const a = v3d[f.verts[0]], b = v3d[f.verts[1]], c = v3d[f.verts[2]];
    const n = cross(sub(b,a), sub(c,a));
    // If normal points away from camera, face is hidden
    if (dot(n, cameraDir) < 0) hiddenFaces.add(f.name);
  }

  // An edge is hidden ONLY if BOTH its adjacent faces are hidden (convex polyhedron rule)
  const edgeFaces: [string, string, string][] = [
    ['bottom','front','0-1'], ['bottom','back','1-2'], ['bottom','back','2-3'], ['bottom','front','3-0'],
    ['top','front','4-5'],    ['top','back','5-6'],    ['top','back','6-7'],    ['top','front','7-4'],
    ['left','front','0-4'],   ['right','front','1-5'],  ['right','back','2-6'],  ['left','back','3-7'],
  ];
  const hiddenEdgeIndices = new Set<string>();
  for (const [f1, f2, key] of edgeFaces) {
    if (hiddenFaces.has(f1) && hiddenFaces.has(f2)) hiddenEdgeIndices.add(key);
  }

  const allEdges: [Point2D, Point2D, string][] = [
    // Bottom face
    [v[0], v[1], '0-1'], [v[1], v[2], '1-2'], [v[2], v[3], '2-3'], [v[3], v[0], '3-0'],
    // Top face
    [v[4], v[5], '4-5'], [v[5], v[6], '5-6'], [v[6], v[7], '6-7'], [v[7], v[4], '7-4'],
    // Vertical
    [v[0], v[4], '0-4'], [v[1], v[5], '1-5'], [v[2], v[6], '2-6'], [v[3], v[7], '3-7'],
  ];

  const visibleParts: string[] = [];
  const hiddenParts: string[] = [];
  for (const [a, b, key] of allEdges) {
    const seg = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
    if (hiddenEdgeIndices.has(key)) {
      hiddenParts.push(seg);
    } else {
      visibleParts.push(seg);
    }
  }

  const visibleEdges = visibleParts.join(' ');
  const hiddenEdges = hiddenParts.join(' ');
  // Layer divider lines (dashed)
  let layerPaths = '';
  if (layers > 1) {
    const layerSegments: string[] = [];
    for (let i = 1; i < layers; i++) {
      const z = (h * i) / layers;
      const lv = [p(0, 0, z), p(w, 0, z), p(w, d, z), p(0, d, z)];
      layerSegments.push(
        `M ${lv[0].x} ${lv[0].y} L ${lv[1].x} ${lv[1].y}`,
        `M ${lv[1].x} ${lv[1].y} L ${lv[2].x} ${lv[2].y}`,
        `M ${lv[2].x} ${lv[2].y} L ${lv[3].x} ${lv[3].y}`,
        `M ${lv[3].x} ${lv[3].y} L ${lv[0].x} ${lv[0].y}`,
      );
    }
    layerPaths = layerSegments.join(' ');
  }

  return { visibleEdges, hiddenEdges, layers: layerPaths };
}

// ─── Cylinder 2D front view ─────────────────────────────────────────

export interface CylinderRender {
  /** Full top ellipse arc path */
  topEllipse: string;
  /** Back half of bottom ellipse (drawn dashed) */
  bottomBackArc: string;
  /** Front half of bottom ellipse (drawn solid) */
  bottomFrontArc: string;
  /** Left and right vertical side lines */
  sideLines: string;
  /** Front curved face fill path (white fill) */
  frontFill: string;
  /** Top ellipse fill path (white fill) */
  topFill: string;
  /** Layer ellipse paths */
  layers: string;
  /** Dished head path (arc above top ellipse) */
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
  // 2D front view coordinates
  // Origin at center-bottom of cylinder
  // x = horizontal, y = vertical (negative = up)
  const r = radius * scale;
  const ry = r * CYLINDER_COMPRESSION; // Ellipse minor radius (perspective compression)
  const h = height * scale;
  const topY = -h;
  const botY = 0;

  // --- Ellipse arcs ---
  // Full ellipse
  const fullEllipse = (cx: number, cy: number) =>
    `M ${cx - r} ${cy} A ${r} ${ry} 0 1 1 ${cx + r} ${cy} A ${r} ${ry} 0 1 1 ${cx - r} ${cy}`;
  // Front half (bottom arc, sweep=1 = clockwise through bottom)
  const frontArc = (cx: number, cy: number) =>
    `M ${cx - r} ${cy} A ${r} ${ry} 0 0 1 ${cx + r} ${cy}`;
  // Back half (top arc, sweep=0 = counter-clockwise through top)
  const backArc = (cx: number, cy: number) =>
    `M ${cx - r} ${cy} A ${r} ${ry} 0 0 0 ${cx + r} ${cy}`;

  const topEllipse = fullEllipse(0, topY);
  const bottomBackArc = backArc(0, botY);
  const bottomFrontArc = frontArc(0, botY);

  // --- Side silhouette lines (vertical) ---
  const sideLines = [
    `M ${-r} ${botY} L ${-r} ${topY}`,
    `M ${r} ${botY} L ${r} ${topY}`,
  ].join(' ');

  // --- Front face fill (white, hides back lines) ---
  const frontFill = [
    `M ${-r} ${botY}`,
    `A ${r} ${ry} 0 0 1 ${r} ${botY}`, // bottom front arc
    `L ${r} ${topY}`,                    // right side up
    `A ${r} ${ry} 0 0 0 ${-r} ${topY}`, // top front arc (reversed)
    'Z',
  ].join(' ');

  // --- Top face fill (white) ---
  const topFill = fullEllipse(0, topY);

  // --- Layer ellipses (dashed horizontal ellipses) ---
  let layersPath = '';
  if (layers > 1) {
    const layerParts: string[] = [];
    for (let l = 1; l < layers; l++) {
      const z = botY + (topY - botY) * (l / layers);
      layerParts.push(fullEllipse(0, z));
    }
    layersPath = layerParts.join(' ');
  }

  // --- Dished head (gentle arc above top ellipse) ---
  const headScreenHeight = r * 0.3;
  const headPath = [
    `M ${-r} ${topY}`,
    `C ${-r * 0.5} ${topY - headScreenHeight * 1.3}`,
    `  ${r * 0.5} ${topY - headScreenHeight * 1.3}`,
    `  ${r} ${topY}`,
  ].join(' ');

  // --- Support legs (3 legs below bottom) ---
  const supportHeight = 50 * scale;
  const legWidth = 4 * scale;
  const legInset = r * 0.6;
  const supportPaths: string[] = [];

  // Left leg
  supportPaths.push(
    `M ${-legInset - legWidth} ${botY} L ${-legInset - legWidth} ${botY + supportHeight}`,
    `M ${-legInset + legWidth} ${botY} L ${-legInset + legWidth} ${botY + supportHeight}`,
    `M ${-legInset - legWidth} ${botY + supportHeight} L ${-legInset + legWidth} ${botY + supportHeight}`,
  );
  // Right leg
  supportPaths.push(
    `M ${legInset - legWidth} ${botY} L ${legInset - legWidth} ${botY + supportHeight}`,
    `M ${legInset + legWidth} ${botY} L ${legInset + legWidth} ${botY + supportHeight}`,
    `M ${legInset - legWidth} ${botY + supportHeight} L ${legInset + legWidth} ${botY + supportHeight}`,
  );
  // Center leg (visible below)
  supportPaths.push(
    `M ${-legWidth} ${botY} L ${-legWidth} ${botY + supportHeight}`,
    `M ${legWidth} ${botY} L ${legWidth} ${botY + supportHeight}`,
    `M ${-legWidth} ${botY + supportHeight} L ${legWidth} ${botY + supportHeight}`,
  );
  const supportsPath = supportPaths.join(' ');

  // --- Nozzles (pipe stubs extending from cylinder wall) ---
  const nozzlePaths: string[] = [];
  const nozzleLabels: Array<{ x: number; y: number; name: string }> = [];
  const stubLength = 15 * scale;  // Length of pipe stub
  const stubHalf = 4 * scale;     // Half-width of flange

  if (nozzles && nozzles.length > 0) {
    for (const nozzle of nozzles) {
      const nx = nozzle.position.x;
      const nz = nozzle.position.z;

      // Determine nozzle category based on 3D position
      const TOP_ZONE = 0.85    // above this ratio → top nozzle
      const BOTTOM_ZONE = 0.15 // below this ratio → bottom nozzle
      const SIDE_ZONE = 0.3    // beyond this ratio from center → side nozzle
      const isOnTop = nz > height * TOP_ZONE;
      const isOnBottom = nz < height * BOTTOM_ZONE;
      const isLeftSide = nx < -radius * SIDE_ZONE;
      const isRightSide = nx > radius * SIDE_ZONE;

      // Calculate 2D position and stub direction
      let wallX: number;
      let nozzleY: number;
      let stubDirX: number;
      let stubDirY: number;
      let labelAnchor: 'left' | 'right' | 'top' | 'bottom';

      if (isOnTop) {
        // Top nozzle - place above top ellipse
        // Use x position to spread nozzles horizontally
        const xNorm = Math.max(-1, Math.min(1, nx / radius));
        wallX = xNorm * r * 0.7; // Spread across top
        nozzleY = topY;
        stubDirX = 0;
        stubDirY = -1; // Extending upward
        labelAnchor = 'top';
      } else if (isOnBottom) {
        // Bottom nozzle - place below bottom ellipse
        const xNorm = Math.max(-1, Math.min(1, nx / radius));
        wallX = xNorm * r * 0.7;
        nozzleY = botY;
        stubDirX = 0;
        stubDirY = 1; // Extending downward
        labelAnchor = 'bottom';
      } else if (isLeftSide) {
        // Left side nozzle
        wallX = -r;
        nozzleY = botY + (topY - botY) * (nz / height);
        stubDirX = -1; // Extending left
        stubDirY = 0;
        labelAnchor = 'left';
      } else if (isRightSide) {
        // Right side nozzle
        wallX = r;
        nozzleY = botY + (topY - botY) * (nz / height);
        stubDirX = 1; // Extending right
        stubDirY = 0;
        labelAnchor = 'right';
      } else {
        // Front-facing nozzle (center area) - place on front face using x position
        const xNorm = Math.max(-1, Math.min(1, nx / radius));
        wallX = xNorm * r * 0.7;
        nozzleY = botY + (topY - botY) * (nz / height);
        stubDirX = 0;
        stubDirY = 1; // Extending downward from front face
        labelAnchor = 'bottom';
      }

      // Draw nozzle stub
      const startX = wallX;
      const startY = nozzleY;
      const endX = startX + stubDirX * stubLength;
      const endY = startY + stubDirY * stubLength;

      // Pipe stub line
      nozzlePaths.push(`M ${startX} ${startY} L ${endX} ${endY}`);

      // Flange (perpendicular line at end)
      if (stubDirX !== 0) {
        // Horizontal stub → vertical flange
        nozzlePaths.push(`M ${endX} ${endY - stubHalf} L ${endX} ${endY + stubHalf}`);
      } else {
        // Vertical stub → horizontal flange
        nozzlePaths.push(`M ${endX - stubHalf} ${endY} L ${endX + stubHalf} ${endY}`);
      }

      // Label position (next to flange, not overlapping cylinder)
      const labelOffset = 4 * scale;
      let labelX = endX;
      let labelY = endY;

      switch (labelAnchor) {
        case 'left':
          labelX = endX - labelOffset;
          labelY = endY - stubHalf - 2 * scale;
          break;
        case 'right':
          labelX = endX + labelOffset;
          labelY = endY - stubHalf - 2 * scale;
          break;
        case 'top':
          labelX = endX + labelOffset;
          labelY = endY - labelOffset;
          break;
        case 'bottom':
          labelX = endX + labelOffset;
          labelY = endY + stubHalf + labelOffset;
          break;
      }

      nozzleLabels.push({ x: labelX, y: labelY, name: nozzle.name });
    }
  } else {
    // Default nozzles (backward compatible)
    // Top nozzle
    nozzlePaths.push(
      `M ${-stubHalf} ${topY} L ${-stubHalf} ${topY - stubLength * 1.5}`,
      `M ${stubHalf} ${topY} L ${stubHalf} ${topY - stubLength * 1.5}`,
      `M ${-stubHalf} ${topY - stubLength * 1.5} L ${stubHalf} ${topY - stubLength * 1.5}`,
    );
    // Side nozzle (right)
    const sideY = topY + (botY - topY) * 0.3;
    nozzlePaths.push(
      `M ${r} ${sideY - stubHalf} L ${r + stubLength} ${sideY - stubHalf}`,
      `M ${r} ${sideY + stubHalf} L ${r + stubLength} ${sideY + stubHalf}`,
      `M ${r + stubLength} ${sideY - stubHalf} L ${r + stubLength} ${sideY + stubHalf}`,
    );
  }

  const nozzlesPath = nozzlePaths.join(' ');

  // --- Coil (internal helical coils, dashed ellipses) ---
  let coilPath = '';
  if (hasCoil) {
    const coilTurns = 5;
    const coilParts: string[] = [];
    for (let i = 0; i < coilTurns; i++) {
      const z = botY + (topY - botY) * ((i + 1) / (coilTurns + 1));
      coilParts.push(fullEllipse(0, z));
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
