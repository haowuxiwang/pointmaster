import { Chamber, ProbePointData, Point3D } from '@/types';

export function keypointsPlacement(chamber: Chamber, options: { includeCenter?: boolean; includeFaceCenters?: boolean } = {}): ProbePointData[] {
  const { includeCenter = true, includeFaceCenters = false } = options;
  const { width: w, depth: d, height: h } = chamber.dimensions;
  const points: ProbePointData[] = [];
  let index = 1;
  const add = (pos: Point3D) => { points.push({ label: `T${index}`, position: pos, properties: {} }); index++; };

  // 8 corners (inset 10% from edges)
  const inset = 0.1;
  add({x:w*inset,y:d*inset,z:h*inset}); add({x:w*(1-inset),y:d*inset,z:h*inset});
  add({x:w*(1-inset),y:d*(1-inset),z:h*inset}); add({x:w*inset,y:d*(1-inset),z:h*inset});
  add({x:w*inset,y:d*inset,z:h*(1-inset)}); add({x:w*(1-inset),y:d*inset,z:h*(1-inset)});
  add({x:w*(1-inset),y:d*(1-inset),z:h*(1-inset)}); add({x:w*inset,y:d*(1-inset),z:h*(1-inset)});

  if (includeCenter) add({x:w/2,y:d/2,z:h/2});
  if (includeFaceCenters) {
    add({x:w/2,y:d/2,z:0}); add({x:w/2,y:d/2,z:h});
    add({x:w/2,y:0,z:h/2}); add({x:w/2,y:d,z:h/2});
    add({x:0,y:d/2,z:h/2}); add({x:w,y:d/2,z:h/2});
  }
  return points;
}
