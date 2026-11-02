import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import { COLLECTOR, HEADER_R, RISER_R } from '../dims';
import { HeatStrip, heatColor } from '../heat';
import type { MachineLook } from './look';
import { alongZ, box, cylX, mergeAll, rod, type P2 } from './shapes';

// One collector, from `dims.ts`: the same function for the bank of the `house` and the `rig`, and for the opened one of the `collector` world. Its frame: X across, centred; Y from
// the tray's back; Z along its length, 0 at the foot, -length at the top. Each layer is a group of its own, so that a world may register them one by one or take them all as one part.
//
// Three views of the same dimensions, and all three are geometry, swapped in by `setView`: no clipping plane to z-fight in layers a few millimetres apart, nothing to cap, and a click goes where the
// eye goes. `full` is the closed collector. `stair` is what the `collector` world opens on: at the top-left corner, the hot outlet's, each layer stops a little further from the corner than the one
// under it, so that all of them show from above. `section` is the section tool's: a true cut across the risers, everything down the slope of it taken away.

export const COLLECTOR_LAYERS = [
  'glass-cover',
  'glass-seal',
  'air-gap',
  'absorber-plate',
  'riser-tube',
  'upper-header',
  'lower-header',
  'back-insulation',
  'collector-tray',
] as const;
export type CollectorLayer = (typeof COLLECTOR_LAYERS)[number];

export type CollectorView = 'full' | 'stair' | 'section';

/** What each layer loses at the corner in the stair: across and along, m. Chosen for what reads best, no dimension of the machine. */
export const STAIR = {
  glass: [0.64, 0.88],
  plate: [0.44, 0.58],
  blanket: [0.2, 0.28],
  wall: [0.64, 0.88],
} as const;

/** Where the section tool cuts, up the slope from the foot, m. Chosen: the top third stays, with its header. */
export const SECTION_S = 1.28;

export interface Collector {
  root: THREE.Group;
  layers: Record<CollectorLayer, THREE.Group>;
  /** The strip the risers read their colour from, 32 cells up the slope. */
  risers: HeatStrip;
  setView(view: CollectorView): void;
  /** The temperatures of the two headers, in false colour: only the `collector` world says them. */
  setHeaders(lower: number, upper: number): void;
}

interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

const L = COLLECTOR.length;
const W = COLLECTOR.width;
const A = COLLECTOR.frameWidth;

/** A rectangle less its corner at (-X, -Z), as one or two rectangles. */
function lessCorner(r: Rect, dx: number, dz: number): Rect[] {
  const nx = -W / 2 + dx;
  const nz = -L + dz;
  const out: Rect[] = [];
  if (r.x1 > nx) out.push({ x0: Math.max(r.x0, nx), x1: r.x1, z0: r.z0, z1: r.z1 });
  if (r.z1 > nz && r.x0 < nx) out.push({ x0: r.x0, x1: Math.min(r.x1, nx), z0: Math.max(r.z0, nz), z1: r.z1 });
  return out;
}

/** What the section tool leaves of a rectangle. */
function aboveCut(r: Rect): Rect[] {
  const z = -SECTION_S;
  if (r.z0 >= z) return [];
  return [{ ...r, z1: Math.min(r.z1, z) }];
}

function slab(rects: Rect[], y0: number, y1: number): THREE.BufferGeometry {
  return mergeAll(rects.map((r) => box(r.x0, r.x1, y0, y1, r.z0, r.z1)));
}

/** The absorber: a black sheet with a saddle over each riser, one closed section extruded up the slope. */
function plateGeometry(rects: Rect[]): THREE.BufferGeometry {
  const Y = COLLECTOR.waterwayY;
  const T = COLLECTOR.plateThickness;
  const R = RISER_R + T;
  const parts = rects.map((r) => {
    const top: P2[] = [[r.x0, Y]];
    for (let i = 0; i < COLLECTOR.risers; i++) {
      const xc = riserX(i);
      if (xc - R < r.x0 + 1e-4 || xc + R > r.x1 - 1e-4) continue;
      for (let k = 0; k <= 6; k++) {
        const a = Math.PI - (k / 6) * Math.PI;
        top.push([xc + R * Math.cos(a), Y + R * Math.sin(a)]);
      }
    }
    top.push([r.x1, Y]);
    return alongZ([...top, [r.x1, Y - T], [r.x0, Y - T]], r.z0, r.z1);
  });
  return mergeAll(parts);
}

/** X of riser `i`: 35 at the derived pitch, centred. */
export function riserX(i: number): number {
  return -W / 2 + COLLECTOR.riserPitch * (i + 0.5);
}

const EMPTY = () => box(0, 1e-5, 0, 1e-5, 0, 1e-5);

export function buildCollector(look: MachineLook, o: { views?: boolean } = {}): Collector {
  const root = group('collector');
  const layers = Object.fromEntries(COLLECTOR_LAYERS.map((id) => [id, group(id)])) as Record<
    CollectorLayer,
    THREE.Group
  >;
  for (const id of COLLECTOR_LAYERS) root.add(layers[id]);
  const swaps: { mesh: THREE.Mesh; geo: Record<CollectorView, THREE.BufferGeometry> }[] = [];
  /** A layer's mesh from a function of its view. A world that does not open the collector builds one geometry only. */
  const put = (
    id: CollectorLayer,
    mat: THREE.Material,
    make: (view: CollectorView) => THREE.BufferGeometry,
    shadow = true,
  ): THREE.Mesh => {
    const m = new THREE.Mesh(make(o.views ? 'stair' : 'full'), mat);
    m.castShadow = shadow;
    m.receiveShadow = true;
    if (!shadow) m.userData.noShadow = true;
    layers[id].add(m);
    if (o.views) swaps.push({ mesh: m, geo: { full: make('full'), stair: m.geometry, section: make('section') } });
    return m;
  };
  /** The rectangles a layer keeps in a view, for its stair's step. */
  const keep = (r: Rect, view: CollectorView, step: readonly [number, number]): Rect[] =>
    view === 'full' ? [r] : view === 'stair' ? lessCorner(r, step[0], step[1]) : aboveCut(r);

  const inside: Rect = { x0: -W / 2 + A, x1: W / 2 - A, z0: -L + A, z1: -A };
  const all: Rect = { x0: -W / 2, x1: W / 2, z0: -L, z1: 0 };

  // ---- glass, 3.2 mm, reported; under the frame's lip
  const gy0 = COLLECTOR.glassY;
  const gy1 = gy0 + COLLECTOR.glassThickness;
  const glassRect: Rect = {
    x0: inside.x0 - 0.006,
    x1: inside.x1 + 0.006,
    z0: inside.z0 - 0.006,
    z1: inside.z1 + 0.006,
  };
  put('glass-cover', look.glass, (v) => slab(keep(glassRect, v, STAIR.glass), gy0, gy1), false).renderOrder = 6;

  // ---- the seal: a black gasket round the glass, inside the frame
  const sw = 0.012;
  const sealRects: Rect[] = [
    { x0: glassRect.x0 - 0.002, x1: glassRect.x1 + 0.002, z0: glassRect.z0 - 0.002, z1: glassRect.z0 + sw },
    { x0: glassRect.x0 - 0.002, x1: glassRect.x1 + 0.002, z0: glassRect.z1 - sw, z1: glassRect.z1 + 0.002 },
    { x0: glassRect.x0 - 0.002, x1: glassRect.x0 + sw, z0: glassRect.z0 + sw, z1: glassRect.z1 - sw },
    { x0: glassRect.x1 - sw, x1: glassRect.x1 + 0.002, z0: glassRect.z0 + sw, z1: glassRect.z1 - sw },
  ];
  put('glass-seal', look.seal, (v) =>
    slab(
      sealRects.flatMap((r) => keep(r, v, STAIR.glass)),
      gy0 - 0.0035,
      gy1 + 0.0028,
    ),
  );

  // ---- the still air between the plate and the glass: a volume with no surface of its own, drawn as a faint slab so that it can be picked and named
  const airY0 = COLLECTOR.waterwayY + RISER_R + COLLECTOR.plateThickness + 0.0005;
  const airY1 = gy0 - 0.0005;
  put('air-gap', look.air, (v) => slab(keep(inside, v, STAIR.glass), airY0, airY1), false).renderOrder = 4;

  // ---- the absorber
  const plateRect: Rect = {
    x0: -W / 2 + 0.006,
    x1: W / 2 - 0.006,
    z0: -L + COLLECTOR.headerInset + HEADER_R,
    z1: -COLLECTOR.headerInset - HEADER_R,
  };
  put('absorber-plate', look.plate, (v) => plateGeometry(keep(plateRect, v, STAIR.plate)));

  // ---- the risers: V runs up the slope, for the strip of the model's nodes
  const risers = new HeatStrip(32);
  const riserMat = new THREE.MeshBasicMaterial({ map: risers.texture, name: 'riser' });
  riserMat.userData.noShare = true;
  const zLow = -COLLECTOR.headerInset;
  const zTop = -L + COLLECTOR.headerInset;
  put('riser-tube', riserMat, (v) => {
    const z0 = v === 'section' ? -SECTION_S : zLow;
    const tubes: THREE.BufferGeometry[] = [];
    for (let i = 0; i < COLLECTOR.risers; i++) {
      tubes.push(
        rod(
          new THREE.Vector3(riserX(i), COLLECTOR.waterwayY, z0),
          new THREE.Vector3(riserX(i), COLLECTOR.waterwayY, zTop),
          RISER_R,
          8,
        ),
      );
    }
    const g = mergeAll(tubes);
    // V is the share of the length, whatever the view keeps of it
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setY(i, (zLow - pos.getZ(i)) / (zLow - zTop));
    return g;
  });

  // ---- the two headers, across the whole width and a stub out of each side
  const headerLow = look.headerSteel.clone();
  const headerTop = look.headerSteel.clone();
  headerLow.userData = { noShare: true };
  headerTop.userData = { noShare: true };
  const xs = W / 2 + COLLECTOR.stub;
  put('lower-header', headerLow, (v) =>
    v === 'section' ? EMPTY() : cylX(HEADER_R, -xs, xs, COLLECTOR.waterwayY, -COLLECTOR.headerInset, 20),
  );
  put('upper-header', headerTop, () => cylX(HEADER_R, -xs, xs, COLLECTOR.waterwayY, -L + COLLECTOR.headerInset, 20));

  // ---- the blanket, 38 mm, reported: on the tray's back, between the headers
  const blanketRect: Rect = {
    x0: -W / 2 + 0.002,
    x1: W / 2 - 0.002,
    z0: -L + COLLECTOR.headerInset + HEADER_R + 0.004,
    z1: -COLLECTOR.headerInset - HEADER_R - 0.004,
  };
  const by0 = COLLECTOR.trayThickness;
  put('back-insulation', look.blanket, (v) => slab(keep(blanketRect, v, STAIR.blanket), by0, by0 + COLLECTOR.blanket));

  // ---- the tray: the back and its walls, then the frame on top. In the stair the corner's walls and frame stay low, to look in from the side
  const t = COLLECTOR.trayThickness * 2;
  const wallTop = gy0 - 0.008;
  const lowWall = 0.02;
  const wallRects: Rect[] = [
    { x0: -W / 2, x1: W / 2, z0: -L, z1: -L + t },
    { x0: -W / 2, x1: W / 2, z0: -t, z1: 0 },
    { x0: -W / 2, x1: -W / 2 + t, z0: -L, z1: 0 },
    { x0: W / 2 - t, x1: W / 2, z0: -L, z1: 0 },
  ];
  put('collector-tray', look.tray, (v) => {
    const list: THREE.BufferGeometry[] = [];
    if (v === 'full') list.push(slab([all], 0, COLLECTOR.trayThickness));
    else if (v === 'stair') list.push(slab([all], 0, COLLECTOR.trayThickness));
    else list.push(slab(aboveCut(all), 0, COLLECTOR.trayThickness));
    for (const r of wallRects) {
      const high = keep(r, v, STAIR.wall);
      for (const q of high) list.push(box(q.x0, q.x1, 0, wallTop, q.z0, q.z1));
      if (v === 'stair') list.push(box(r.x0, r.x1, 0, lowWall, r.z0, r.z1));
    }
    return mergeAll(list);
  });
  // the frame is riveted to the tray along its long sides: a row of small heads, from the same drawing as the rest
  const rivets = () => {
    const list: THREE.BufferGeometry[] = [];
    for (const side of [-1, 1]) {
      for (let i = 0; i < 11; i++) {
        const z = -0.09 - ((L - 0.18) * i) / 10;
        const a = new THREE.Vector3((side * W) / 2, gy0 - 0.018, z);
        const b = new THREE.Vector3((side * W) / 2 + side * 0.001, gy0 - 0.018, z);
        list.push(rod(a, b, 0.0035, 6));
      }
    }
    return mergeAll(list);
  };
  put('collector-tray', look.frame, () => rivets());
  const D = COLLECTOR.depth;
  const lipY = gy1 + 0.0002;
  const c = 0.003;
  const lipRects: Rect[] = [
    { x0: -W / 2, x1: W / 2, z0: -L, z1: -L + A },
    { x0: -W / 2, x1: W / 2, z0: -A, z1: 0 },
    { x0: -W / 2, x1: -W / 2 + A, z0: -L + A, z1: -A },
    { x0: W / 2 - A, x1: W / 2, z0: -L + A, z1: -A },
  ];
  const frameWalls: Rect[] = [
    { x0: -W / 2, x1: W / 2, z0: -L, z1: -L + c },
    { x0: -W / 2, x1: W / 2, z0: -c, z1: 0 },
    { x0: -W / 2, x1: -W / 2 + c, z0: -L + c, z1: -c },
    { x0: W / 2 - c, x1: W / 2, z0: -L + c, z1: -c },
  ];
  put('collector-tray', look.frame, (v) => {
    const list: THREE.BufferGeometry[] = [];
    for (const r of lipRects) for (const q of keep(r, v, STAIR.wall)) list.push(box(q.x0, q.x1, lipY, D, q.z0, q.z1));
    for (const r of frameWalls)
      for (const q of keep(r, v, STAIR.wall)) list.push(box(q.x0, q.x1, wallTop, lipY, q.z0, q.z1));
    return mergeAll(list);
  });

  return {
    root,
    layers,
    risers,
    setView(view) {
      for (const s of swaps) s.mesh.geometry = s.geo[view];
    },
    setHeaders(lower, upper) {
      heatColor(lower, headerLow.color);
      heatColor(upper, headerTop.color);
      headerLow.metalness = headerTop.metalness = 0.15;
    },
  };
}
