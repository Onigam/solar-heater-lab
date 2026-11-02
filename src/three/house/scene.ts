import * as THREE from 'three';
import { applyWear, contactRing, group, MAT, PartRegistry, rng } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import { SITES, type SiteId } from '../../sim/climate';
import { sunAltitude, sunAzimuth, sunTerms } from '../../sim/thermal';
import type { SolarParams, SolarState } from '../../sim/types';
import {
  COS,
  HOUSE,
  HOUSE_FOOT,
  HOUSE_HALF_DEPTH,
  HOUSE_X,
  PENETRATION,
  SIN,
  SPINE,
  TANK,
  TANK_DRUM_HALF,
  TILT,
  tilePlaneY,
} from '../dims';
import { FlowDots } from '../flows';
import { machineLook } from '../machine/look';
import { box, cylX, mergeAll, rod, rounded, tubeThrough } from '../machine/shapes';
import { capReach } from '../machine/tank';
import { buildRoofUnit, UNIT_PARTS, type RoofUnit } from '../machine/unit';
import { mergeStatic } from '../merge';
import { partName } from '../part-ids';
import { Drip, ShowerWater } from '../tank/water';
import { anchor, hotspots, partsNow, viewFrom, type HotspotDef } from '../world';
import { buildBuilding, bx, houseLook, wallAlongX } from './building';
import { cobbles, limewash, roofTiles, rubbleStone } from './materials';
import { buildRoof } from './roof';
import { createSky, type SkyRig } from './sky';
import { buildGround, groundHeight, terraces } from './terrain';
import { cypress, farTrees, olive, type TreeMeshes } from './vegetation';

// The `house` world: the setting. A stone village house, generic, Mediterranean; its tiled roof at 30° faces the equator, with the machine on it; sliced to the west so that the rafters show and the way down to
// the bathroom. The olive whose shadow must miss the collectors. The mains from the street, the hot line to the shower, the drain outside, the meter box. The sun on its arc is the simulation's: site, day, hour.

const PARTS = [
  'roof-unit',
  'roof-structure',
  'roof-tiles',
  'roof-penetration',
  'load-bearing-wall',
  'cold-main',
  'hot-line',
  'drain-outlet',
  'meter-box',
  'shade-tree',
] as const;
type HousePart = (typeof PARTS)[number];

const HOTSPOTS: HotspotDef[] = [
  { id: 'roof-unit', ...partName('roof-unit'), goto: 'rig' },
  { id: 'shade-tree', ...partName('shade-tree') },
  { id: 'hot-line', ...partName('hot-line') },
  { id: 'cold-main', ...partName('cold-main') },
  { id: 'roof-structure', ...partName('roof-structure'), minor: true },
  { id: 'load-bearing-wall', ...partName('load-bearing-wall'), minor: true },
  { id: 'meter-box', ...partName('meter-box'), minor: true },
  { id: 'drain-outlet', ...partName('drain-outlet'), minor: true },
  { id: 'roof-penetration', ...partName('roof-penetration'), minor: true },
  { id: 'roof-tiles', ...partName('roof-tiles'), minor: true },
];

/** The offsets of a guide's steps: the world itself never comes apart (`explode: false` in `WORLD.house`), an installation's part drops in along these, m. */
export const DROP: Record<HousePart, [number, number, number]> = {
  'roof-unit': [0, 2.4, 1.4],
  'roof-structure': [0, 1.4, 0],
  'roof-tiles': [0, 1.0, 0],
  'roof-penetration': [0, 0.7, 0],
  'load-bearing-wall': [-1.2, 0, 0],
  'cold-main': [-0.8, 0, 0],
  'hot-line': [-0.8, 0, 0],
  'drain-outlet': [-0.6, 0, 0.4],
  'meter-box': [-0.8, 0, 0],
  'shade-tree': [0, 0, 1.6],
};

/** Where to look at a part from, when it is selected. Most of this world's parts are seen through the slice, from the west. */
const FROM_SLICE = viewFrom(14, -68);
const FRAMING: Partial<Record<HousePart, PartFraming>> = {
  'hot-line': { viewDir: FROM_SLICE },
  'cold-main': { viewDir: viewFrom(18, -58) },
  'meter-box': { viewDir: FROM_SLICE },
  'load-bearing-wall': { viewDir: FROM_SLICE },
  'roof-structure': {
    viewDir: viewFrom(8, -82),
    frame: new THREE.Box3(new THREE.Vector3(-1.8, 4.9, -0.4), new THREE.Vector3(-0.9, 7.8, 4.8)),
  },
  'drain-outlet': { viewDir: viewFrom(16, -30) },
  'roof-penetration': { viewDir: viewFrom(40, 160) },
  'roof-tiles': {
    viewDir: viewFrom(36, -28),
    frame: new THREE.Box3(new THREE.Vector3(1.6, 5, 2), new THREE.Vector3(5, 7, 4.6)),
  },
  'shade-tree': { viewDir: viewFrom(10, -25) },
  'roof-unit': { viewDir: viewFrom(30, -32) },
};

export interface HouseScene extends SceneModule<SolarState> {
  unit: RoofUnit;
  sky: SkyRig;
  tree: TreeMeshes;
  shower: ShowerWater;
  drip: Drip;
  flows: FlowDots;
  /** Walls and roof-side scenery: what goes when a part is isolated. */
  building: THREE.Group;
  /** The ends of the lines, world: must meet what they join. */
  joints: { name: string; a: THREE.Vector3; b: THREE.Vector3 }[];
}

function neighbours(): THREE.Group {
  const g = group('neighbours');
  const stone = rubbleStone(13, 256);
  const wall = new THREE.MeshStandardMaterial({ map: stone.map, roughness: 0.95, name: 'neighbour-wall' });
  wall.userData.noShare = true;
  const render = new THREE.MeshStandardMaterial({
    map: limewash(35, [226, 214, 190]),
    roughness: 0.95,
    name: 'neighbour-render',
  });
  render.userData.noShare = true;
  const tile = roofTiles();
  const roofMat = new THREE.MeshStandardMaterial({
    map: tile.map,
    bumpMap: tile.bump,
    bumpScale: 0.4,
    roughness: 0.85,
    name: 'neighbour-roof',
  });
  roofMat.userData.noShare = true;
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b3238, roughness: 0.6, name: 'neighbour-window' });
  const shutterMats = [0x566f63, 0x6f6450, 0x5b6b78].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.75, name: 'neighbour-shutter' }),
  );
  const shutters: THREE.BufferGeometry[][] = [[], [], []];
  const walls: THREE.BufferGeometry[] = [];
  const whites: THREE.BufferGeometry[] = [];
  const roofs: THREE.BufferGeometry[] = [];
  const windows: THREE.BufferGeometry[] = [];
  const sills: THREE.BufferGeometry[] = [];
  const r = rng(61);
  const place = (x: number, z: number, w: number, d: number, h: number, rot: number, white: boolean) => {
    const y0 = groundHeight(x, z);
    const m = new THREE.Matrix4().makeRotationY(rot).setPosition(x, y0, z);
    const body = bx(-w / 2, w / 2, 0, h, -d / 2, d / 2, 3.2);
    body.applyMatrix4(m);
    (white ? whites : walls).push(body);
    // two slopes of tile on a ridge along X, each with its overhang; the gables in the wall's own stuff
    const rise = (d / 2) * Math.tan(TILT);
    const slopeLen = d / 2 / COS + 0.3;
    for (const side of [1, -1]) {
      const q = bx(-w / 2 - 0.18, w / 2 + 0.18, -0.03, 0.03, -slopeLen, 0, 1);
      // the slope's UVs: X along the ridge, Y up the slope, in the tile's repeat
      const uv = q.attributes.uv;
      const pos = q.attributes.position;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / tile.tile, pos.getZ(i) / tile.tile);
      const tilt = new THREE.Matrix4().makeRotationX(side > 0 ? TILT : -TILT);
      const flip = side > 0 ? new THREE.Matrix4() : new THREE.Matrix4().makeRotationY(0);
      q.applyMatrix4(tilt.multiply(flip));
      if (side < 0) q.scale(1, 1, -1);
      q.translate(0, h - 0.15 * SIN, side * (d / 2 + 0.15 * COS));
      if (side < 0) {
        // mirrored: its faces turn the other way
        const idx = q.index!;
        for (let i = 0; i < idx.count; i += 3) {
          const b = idx.getX(i + 1);
          idx.setX(i + 1, idx.getX(i + 2));
          idx.setX(i + 2, b);
        }
        q.computeVertexNormals();
      }
      q.applyMatrix4(m);
      roofs.push(q);
    }
    for (const sx of [1, -1]) {
      const shape = new THREE.Shape([
        new THREE.Vector2(-d / 2, h),
        new THREE.Vector2(d / 2, h),
        new THREE.Vector2(0, h + rise),
      ]);
      const gb = new THREE.ShapeGeometry(shape);
      const pos = gb.attributes.position;
      const uv = gb.attributes.uv;
      for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / 3.2, pos.getY(i) / 3.2);
      gb.applyMatrix4(new THREE.Matrix4().makeRotationY((sx * Math.PI) / 2));
      gb.translate((sx * w) / 2, 0, 0);
      gb.applyMatrix4(m);
      (white ? whites : walls).push(gb);
    }
    // windows on the long sides, framed and shuttered
    const cols = Math.max(2, Math.floor(w / 2.6));
    const paint = shutters[Math.floor(r() * 3)];
    for (const sz of [1, -1])
      for (let i = 0; i < cols; i++) {
        const x2 = -w / 2 + (w * (i + 0.5)) / cols;
        for (const y of h > 4 ? [1.05, 3.45] : [1.2]) {
          if (r() < 0.16) continue;
          const zF = sz * (d / 2);
          const pane = box(x2 - 0.42, x2 + 0.42, y, y + 1.15, zF - 0.03, zF + 0.03);
          pane.applyMatrix4(m);
          windows.push(pane);
          const sill = box(x2 - 0.5, x2 + 0.5, y - 0.07, y, zF - 0.06, zF + 0.06);
          sill.applyMatrix4(m);
          sills.push(sill);
          const lint = box(x2 - 0.5, x2 + 0.5, y + 1.15, y + 1.3, zF - 0.05, zF + 0.05);
          lint.applyMatrix4(m);
          sills.push(lint);
          if (r() < 0.8)
            for (const sh of [-1, 1]) {
              const a = sh < 0 ? x2 - 0.84 : x2 + 0.42;
              const leaf = box(
                a,
                a + 0.42,
                y,
                y + 1.15,
                zF - 0.04 * (sz > 0 ? 0 : 1) - 0.0,
                zF + 0.04 * (sz > 0 ? 1 : 0),
              );
              leaf.applyMatrix4(m);
              paint.push(leaf);
            }
        }
      }
  };
  place(-13.5, -1.5, 8.2, 7.5, 5.2, 0, false);
  place(16, -2, 9.5, 7.2, 5.6, 0.05, true);
  place(0.5, -13.5, 12, 7, 5.8, 0, false);
  place(-16.5, -14, 8, 7, 4.8, 0.18, true);
  place(17, -16, 10, 7.5, 6.2, -0.12, false);
  place(-26, 4, 8, 7, 5, 0.3, true);
  place(30, 2.5, 8, 8, 5.2, -0.15, false);
  place(-6, -27, 11, 7.5, 6, 0.1, true);
  place(14, -31, 9, 7, 5.2, -0.2, false);
  place(-30, -24, 9, 7, 5.4, 0.35, false);
  place(26, 24, 9, 7, 5.2, -0.1, true);
  const add = (list: THREE.BufferGeometry[], m: THREE.Material) => {
    if (!list.length) return;
    const o = new THREE.Mesh(mergeAll(list), m);
    o.castShadow = true;
    o.receiveShadow = true;
    g.add(o);
  };
  add(walls, wall);
  add(whites, render);
  add(roofs, roofMat);
  add(windows, dark);
  add(sills, new THREE.MeshStandardMaterial({ color: 0xcabda2, roughness: 0.9, name: 'neighbour-sill' }));
  shutters.forEach((list, i) => add(list, shutterMats[i]));
  return g;
}

export function createHouseScene(params: () => SolarParams): HouseScene {
  const scene = new THREE.Scene();
  scene.name = 'house';
  scene.userData.look = { toneMapping: 'aces', exposure: 0.92 };
  const sky = createSky(scene);
  const look = machineLook();
  const hLook = houseLook();

  // ---- the ground, the street, the garden wall
  const ground = buildGround();
  scene.add(ground);
  scene.add(terraces());
  const street = group('street');
  const cb = cobbles(21);
  const roadMat = new THREE.MeshStandardMaterial({
    map: cb.map,
    roughness: 0.92,
    name: 'street',
  });
  roadMat.userData.noShare = true;
  const road = new THREE.Mesh(bx(-90, 90, -0.02, 0.03, 10.0, 14.2, cb.tile), roadMat);
  road.receiveShadow = true;
  street.add(road);
  const earth = new THREE.MeshStandardMaterial({ color: 0x8a7558, roughness: 0.98, name: 'garden-earth' });
  const gardenEarth = new THREE.Mesh(
    box(HOUSE_X.slice - 3.1, HOUSE_X.east + 3.1, -0.01, 0.015, HOUSE_HALF_DEPTH, 9.45),
    earth,
  );
  gardenEarth.receiveShadow = true;
  street.add(gardenEarth);
  const wallStone = rubbleStone(17, 256);
  const lowWall = new THREE.MeshStandardMaterial({ map: wallStone.map, roughness: 0.95, name: 'low-wall' });
  lowWall.userData.noShare = true;
  const gateX0 = -3.9;
  const gateX1 = -2.7;
  street.add(
    meshOf(
      wallAlongX(-12.0, HOUSE_X.east + 3.2, 0, 0.92, 9.45, 9.95, [{ x0: gateX0, x1: gateX1, y0: 0, y1: 0.92 }], 3.2),
      lowWall,
    ),
  );
  street.add(meshOf(box(-12.08, gateX0, 0.92, 1, 9.42, 9.98), hLook.sill));
  street.add(meshOf(box(gateX1, HOUSE_X.east + 3.28, 0.92, 1, 9.42, 9.98), hLook.sill));
  // a low wall to each side of the garden, back to the house's front
  street.add(meshOf(bx(HOUSE_X.east + 3.1, HOUSE_X.east + 3.6, 0, 0.92, HOUSE_HALF_DEPTH - 2, 9.95, 3.2), lowWall));
  street.add(meshOf(bx(-12.5, -12, 0, 0.92, HOUSE_HALF_DEPTH - 2, 9.95, 3.2), lowWall));
  street.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o !== road && o !== gardenEarth) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  mergeStatic(street, { bakeKey: 'house-street' });
  scene.add(street);
  const others = neighbours();
  mergeStatic(others, { bakeKey: 'house-others' });
  scene.add(others);

  // the far trees on the hills, and the near cypresses of the village
  const places: { x: number; y: number; z: number; s: number; dark: boolean }[] = [];
  const rr = rng(71);
  for (let i = 0; i < 760; i++) {
    const a = rr() * Math.PI * 2;
    const d = 60 + rr() * 300;
    const x = Math.cos(a) * d;
    const z = Math.sin(a) * d - 25;
    places.push({ x, y: groundHeight(x, z), z, s: 1.1 + rr() * 1.3, dark: rr() < 0.14 });
  }
  scene.add(farTrees(places));
  for (const [x, z, h, seed] of [
    [-20.5, 8.4, 9.5, 201],
    [-18.4, 10.6, 7.8, 202],
    [11.8, 7.9, 8.6, 203],
    [13.2, 6.6, 7.2, 204],
    [-29, 7, 10, 205],
    [22, 16, 9.4, 206],
  ] as const) {
    const c = cypress(seed, h);
    c.position.set(x, groundHeight(x, z), z);
    scene.add(c);
  }

  // ---- the house
  const building = group('building');
  const b = buildBuilding(hLook);
  building.add(b.shell);
  mergeStatic(b.shell, { bakeKey: 'house-shell' });
  scene.add(building);
  const roof = buildRoof(hLook);
  const spine = b.spine;

  // ---- the machine: the same function as the `rig`'s, at home, on the tiles
  const unit = buildRoofUnit(look);
  unit.root.position.set(0, HOUSE_FOOT.y, HOUSE_FOOT.z);
  const machine = group('roof-unit');
  machine.add(unit.root);
  scene.add(machine);
  unit.root.updateMatrixWorld(true);

  // ---- the lines: world coordinates, all from the machine's own points
  const fromBody = (p: THREE.Vector3) => {
    unit.body.updateWorldMatrix(true, false);
    return p.clone().applyMatrix4(unit.body.matrixWorld);
  };
  const tankPoint = (x: number, y: number, z: number) => fromBody(unit.tankToBody(new THREE.Vector3(x, y, z)));
  const onRoof = (x: number, n: number, s: number) => fromBody(new THREE.Vector3(x, n, -s));
  const H = TANK_DRUM_HALF;
  const nippleCold = tankPoint(H + capReach(Math.abs(TANK.diffuserY)) + 0.026, TANK.diffuserY, 0);
  const nippleHot = tankPoint(H + capReach(0.178) + 0.026, 0.178, 0);
  const tprDrain = tankPoint(H + capReach(0.092) + 0.028, 0.092 - 0.05, 0.04);

  const R = 0.011;
  const attic = HOUSE.eaves + 0.07;
  const tube = (parent: THREE.Object3D, pts: THREE.Vector3[], mat: THREE.Material, r = R, bend = 0.05) => {
    const path = rounded(pts, bend);
    const m = new THREE.Mesh(tubeThrough(path, r, 8), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return path;
  };
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const P = Object.fromEntries(PARTS.map((id) => [id, group(id)])) as Record<HousePart, THREE.Group>;
  const coldMat = new THREE.MeshStandardMaterial({ color: 0x3f6ea6, roughness: 0.5, name: 'cold-line' });
  coldMat.userData.noShare = true;
  const copper = look.copper;
  const zSouth = HOUSE_HALF_DEPTH - HOUSE.wall - 0.03;
  const pen = PENETRATION;
  const under = (x: number, n = 0) => onRoof(x, n, pen.s);
  const yUnder = (x: number) => {
    const p = under(x);
    return p.y - 0.34;
  };

  // the penetration: a lead pad on the tiles, a boot per line
  const flash = new THREE.MeshStandardMaterial({ color: 0x74787b, roughness: 0.7, metalness: 0.3, name: 'lead' });
  const padA = onRoof(pen.xs.flex - 0.08, 0.002, pen.s - 0.1);
  const padGroup = group('pad');
  padGroup.position.copy(padA);
  padGroup.rotation.x = TILT;
  const padMesh = new THREE.Mesh(box(0, pen.xs.drain - pen.xs.flex + 0.16, -0.004, 0.004, -0.2, 0), flash);
  padMesh.castShadow = padMesh.receiveShadow = true;
  padGroup.add(padMesh);
  P['roof-penetration'].add(padGroup);
  for (const x of Object.values(pen.xs)) {
    const a = onRoof(x, 0, pen.s);
    const t = onRoof(x, 0.05, pen.s);
    const g = rod(a, t, 0.022, 12, 0.014);
    const m = new THREE.Mesh(g, flash);
    m.castShadow = true;
    P['roof-penetration'].add(m);
  }

  // the booster's supply, from the machine's box on the rear batten, along the back of the tank, into the first boot; below it, down the spine wall to the meter box
  const boxAtEnd = onRoof(-1.0, 0.025, 2.4);
  tube(
    P['roof-penetration'],
    [boxAtEnd, onRoof(-0.85, 0.02, 2.56), onRoof(pen.xs.flex - 0.12, 0.02, 2.62), onRoof(pen.xs.flex, 0.045, pen.s)],
    look.flex,
    0.006,
    0.04,
  );
  const meterX = -1.0;
  const meterY = 1.56;
  const meterZ = SPINE.z1 + 0.02;
  const fromAttic = V(pen.xs.flex, attic, SPINE.z1 + 0.08);
  tube(
    P['meter-box'],
    [
      under(pen.xs.flex, 0.04),
      V(pen.xs.flex, yUnder(pen.xs.flex), under(pen.xs.flex).z),
      V(pen.xs.flex, attic, under(pen.xs.flex).z),
      fromAttic,
      V(meterX, attic, SPINE.z1 + 0.08),
      V(meterX, meterY + 0.2, SPINE.z1 + 0.08),
      V(meterX, meterY + 0.18, meterZ + 0.06),
    ],
    look.flex,
    0.008,
  );

  // the mains: a lid at the street, under the gravel of the garden, in through the south wall, up to the attic, out by the boot, to the tank's cold inlet
  const xIn = -1.1;
  const zPit = 9.0;
  const pitTop = 0.02;
  const coldOutside = [V(xIn, 0.03, zPit - 0.05), V(xIn, 0.03, HOUSE_HALF_DEPTH + 0.02)];
  const coldInside = [
    V(xIn, 0.03, HOUSE_HALF_DEPTH + 0.02),
    V(xIn, 0.14, zSouth),
    V(xIn, attic, zSouth),
    V(pen.xs.cold, attic, zSouth),
    V(pen.xs.cold, attic, under(pen.xs.cold).z),
    V(pen.xs.cold, under(pen.xs.cold).y, under(pen.xs.cold).z),
  ];
  const coldRoof = [
    under(pen.xs.cold, 0.04),
    onRoof(pen.xs.cold, 0.09, pen.s - 0.1),
    onRoof(1.19, 0.11, 2.52),
    onRoof(1.19, unitN(nippleCold, unit), 2.16),
    nippleCold,
  ];
  const coldPathA = tube(P['cold-main'], coldOutside, coldMat, R, 0.02);
  const coldPathB = tube(P['cold-main'], coldInside, coldMat);
  const coldPathC = tube(P['cold-main'], coldRoof, coldMat, R, 0.05);
  // the lid of the pit, a strip of gravel over the line, the isolating valve inside at hand's height
  const lid = new THREE.Mesh(box(xIn - 0.2, xIn + 0.2, 0, pitTop + 0.02, zPit - 0.2, zPit + 0.2), MAT.steelBlack());
  lid.castShadow = lid.receiveShadow = true;
  P['cold-main'].add(lid);
  const gravelStrip = new THREE.Mesh(
    box(xIn - 0.1, xIn + 0.1, 0.012, 0.02, HOUSE_HALF_DEPTH + 0.02, zPit - 0.2),
    new THREE.MeshStandardMaterial({ color: 0x8f877c, roughness: 0.98, name: 'gravel-strip' }),
  );
  gravelStrip.receiveShadow = true;
  P['cold-main'].add(gravelStrip);
  const valveY = 1.05;
  const coldValve = new THREE.Mesh(
    mergeAll([
      rod(V(xIn, valveY - 0.05, zSouth), V(xIn, valveY + 0.05, zSouth), 0.02, 14),
      rod(V(xIn, valveY, zSouth), V(xIn, valveY, zSouth - 0.05), 0.008, 8),
    ]),
    look.brass,
  );
  coldValve.castShadow = true;
  P['cold-main'].add(coldValve);
  const coldLever = new THREE.Mesh(
    box(xIn - 0.008, xIn + 0.07, valveY - 0.008, valveY + 0.008, zSouth - 0.056, zSouth - 0.048),
    MAT.redPaint(),
  );
  P['cold-main'].add(coldLever);

  // the hot line: from the tank, round its end, into the boot, across the attic, down to the bathroom's shower; a branch on down to the kitchen's tap
  const showerX = -0.75;
  const showerTop = HOUSE.floor1 + 2.2;
  const hotRoof = [
    nippleHot,
    onRoof(1.2, unitN(nippleHot, unit), 2.36),
    onRoof(1.2, 0.2, 2.52),
    onRoof(pen.xs.hot, 0.09, pen.s - 0.1),
    under(pen.xs.hot, 0.04),
  ];
  const hotPathA = tube(P['hot-line'], hotRoof, copper, R, 0.05);
  const hotInside = [
    V(pen.xs.hot, under(pen.xs.hot).y, under(pen.xs.hot).z),
    V(pen.xs.hot, attic + 0.03, under(pen.xs.hot).z),
    V(pen.xs.hot, attic + 0.03, zSouth - 0.04),
    V(showerX, attic + 0.03, zSouth - 0.04),
    V(showerX, showerTop, zSouth - 0.04),
  ];
  const hotPathB = tube(P['hot-line'], hotInside, copper);
  const kitchenX = showerX + 0.55;
  const kitchenY = 1.12;
  const hotBranch = [V(kitchenX, attic + 0.03, zSouth - 0.04), V(kitchenX, kitchenY + 0.1, zSouth - 0.04)];
  const hotPathC = tube(P['hot-line'], hotBranch, copper);

  // the bathroom: a tray, a mixing valve, a head on its arm. Scenery, the real one is the `tank-and-tap` world's
  const bath = group('bathroom');
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dcdf, roughness: 0.22, metalness: 0.95, name: 'chrome' });
  const white = new THREE.MeshStandardMaterial({ color: 0xeef0ec, roughness: 0.28, name: 'white-ware' });
  const fl = HOUSE.floor1;
  const trayX = showerX;
  const trayZ = zSouth - 0.42;
  const add = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = bath) => {
    const o = new THREE.Mesh(g, m);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  };
  add(
    mergeAll([
      box(trayX - 0.42, trayX + 0.42, fl, fl + 0.01, trayZ - 0.4, trayZ + 0.4),
      box(trayX - 0.42, trayX + 0.42, fl, fl + 0.06, trayZ - 0.4, trayZ - 0.36),
      box(trayX - 0.42, trayX + 0.42, fl, fl + 0.06, trayZ + 0.36, trayZ + 0.4),
      box(trayX - 0.42, trayX - 0.38, fl, fl + 0.06, trayZ - 0.4, trayZ + 0.4),
      box(trayX + 0.38, trayX + 0.42, fl, fl + 0.06, trayZ - 0.4, trayZ + 0.4),
    ]),
    white,
  );
  const headP = V(showerX, showerTop - 0.04, trayZ);
  add(
    tubeThrough(
      rounded([V(showerX, showerTop, zSouth - 0.04), V(showerX, showerTop, trayZ + 0.06), headP], 0.04),
      0.009,
      8,
    ),
    chrome,
  );
  const head = new THREE.CylinderGeometry(0.03, 0.1, 0.04, 22);
  head.translate(headP.x, headP.y - 0.02, headP.z);
  add(head, chrome);
  add(rod(V(showerX, fl + 1.2, zSouth - 0.04), V(showerX, fl + 1.2, zSouth - 0.1), 0.03, 18), chrome);
  // the kitchen: a stone sink on the south wall, its tap
  const kit = group('kitchen');
  bath.add(kit);
  add(box(kitchenX - 0.42, kitchenX + 0.42, 0.03, 0.82, zSouth - 0.55, zSouth - 0.02), hLook.sill, kit);
  add(box(kitchenX - 0.3, kitchenX + 0.3, 0.82, 0.84, zSouth - 0.48, zSouth - 0.12), MAT.steel(), kit);
  add(
    tubeThrough(
      rounded(
        [V(kitchenX, 1.22, zSouth - 0.04), V(kitchenX, 1.22, zSouth - 0.2), V(kitchenX, 1.12, zSouth - 0.24)],
        0.04,
      ),
      0.009,
      8,
    ),
    chrome,
    kit,
  );
  scene.add(bath);
  mergeStatic(bath, { bakeKey: 'house-bath' });

  // the drain: from the T&P, into the boot, under the tiles, across the attic, down inside the south wall, out at knee height, its open end over a stone gully
  const dx = -1.4;
  const zOut = HOUSE_HALF_DEPTH + 0.1;
  const drainRoof = [
    tprDrain,
    tprDrain.clone().add(V(0, -0.02, 0)),
    onRoof(1.2, 0.05, 2.4),
    onRoof(pen.xs.drain, 0.08, pen.s - 0.08),
    under(pen.xs.drain, 0.04),
  ];
  tube(P['drain-outlet'], drainRoof, copper, 0.0075, 0.04);
  const drainIn = [
    V(pen.xs.drain, under(pen.xs.drain).y, under(pen.xs.drain).z),
    V(pen.xs.drain, attic - 0.02, under(pen.xs.drain).z),
    V(pen.xs.drain, attic - 0.02, zSouth - 0.08),
    V(dx, attic - 0.02, zSouth - 0.08),
    V(dx, 0.55, zSouth - 0.08),
    V(dx, 0.55, zOut),
    V(dx, 0.42, zOut),
  ];
  tube(P['drain-outlet'], drainIn, copper, 0.0075, 0.04);
  const gully = new THREE.Mesh(
    mergeAll([
      box(dx - 0.14, dx + 0.14, 0, 0.05, zOut - 0.14, zOut - 0.1),
      box(dx - 0.14, dx + 0.14, 0, 0.05, zOut + 0.1, zOut + 0.14),
      box(dx - 0.14, dx - 0.1, 0, 0.05, zOut - 0.14, zOut + 0.14),
      box(dx + 0.1, dx + 0.14, 0, 0.05, zOut - 0.14, zOut + 0.14),
    ]),
    hLook.sill,
  );
  gully.castShadow = gully.receiveShadow = true;
  P['drain-outlet'].add(gully);
  const gullyGrate = new THREE.Mesh(box(dx - 0.1, dx + 0.1, 0.015, 0.024, zOut - 0.1, zOut + 0.1), MAT.steelBlack());
  gullyGrate.receiveShadow = true;
  P['drain-outlet'].add(gullyGrate);

  // the meter box: a grey enclosure on the spine wall, a switch, a timer's dial
  const enclosure = new THREE.Mesh(
    box(meterX - 0.16, meterX + 0.16, meterY - 0.2, meterY + 0.2, meterZ, meterZ + 0.11),
    MAT.enclosureGrey(),
  );
  enclosure.castShadow = true;
  P['meter-box'].add(enclosure);
  const door = new THREE.Mesh(
    box(meterX - 0.145, meterX + 0.145, meterY - 0.185, meterY + 0.185, meterZ + 0.11, meterZ + 0.116),
    MAT.pvcGrey(),
  );
  P['meter-box'].add(door);
  const dial = new THREE.Mesh(
    rod(V(meterX - 0.05, meterY + 0.05, meterZ + 0.116), V(meterX - 0.05, meterY + 0.05, meterZ + 0.128), 0.05, 20),
    MAT.printWhite(),
  );
  P['meter-box'].add(dial);
  const sw = new THREE.Mesh(
    box(meterX + 0.06, meterX + 0.11, meterY - 0.03, meterY + 0.08, meterZ + 0.116, meterZ + 0.136),
    MAT.redPaint(),
  );
  P['meter-box'].add(sw);

  // ---- the olive
  const tree = olive(7, 5.0);
  tree.root.position.set(5.2, 0, 7.3);
  P['shade-tree'].add(tree.root);
  // the dark of the ground around the bole, and under each pot: what stands there sits there
  const treeFoot = contactRing(0.34, 0.75, 0.42);
  treeFoot.position.set(5.2, 0.017, 7.3);
  scene.add(treeFoot);

  // a few things of a lived-in place: pots by the door, a bench, a coil on the wall
  const garden = group('garden');
  const terra = new THREE.MeshStandardMaterial({ color: 0xa8603c, roughness: 0.85, name: 'pot' });
  const leafy = new THREE.MeshStandardMaterial({
    color: 0x4d6a3f,
    roughness: 0.92,
    flatShading: true,
    name: 'pot-plant',
  });
  for (const [x, z, s] of [
    [3.0, 4.72, 1],
    [2.62, 4.85, 0.8],
    [4.62, 4.74, 0.9],
  ] as const) {
    const pot = new THREE.LatheGeometry(
      [
        new THREE.Vector2(0.001, 0),
        new THREE.Vector2(0.12 * s, 0),
        new THREE.Vector2(0.19 * s, 0.3 * s),
        new THREE.Vector2(0.21 * s, 0.32 * s),
        new THREE.Vector2(0.21 * s, 0.36 * s),
        new THREE.Vector2(0.17 * s, 0.36 * s),
      ],
      16,
    );
    pot.translate(x, 0.015, z);
    const pm = new THREE.Mesh(pot, terra);
    pm.castShadow = pm.receiveShadow = true;
    garden.add(pm);
    const foot = contactRing(0.12 * s, 0.12, 0.4);
    foot.position.set(x, 0.0165, z);
    garden.add(foot);
    const bush = new THREE.IcosahedronGeometry(0.2 * s, 1);
    bush.scale(1.1, 1.05, 1.1);
    bush.translate(x, 0.5 * s, z);
    const bm = new THREE.Mesh(bush, leafy);
    bm.castShadow = true;
    garden.add(bm);
  }
  // the bench under the olive: two stone blocks, a plank
  garden.add(
    meshOf(mergeAll([box(6.1, 6.32, 0, 0.42, 5.9, 6.32), box(7.3, 7.52, 0, 0.42, 5.9, 6.32)]), hLook.sill, true),
  );
  garden.add(meshOf(bx(6.0, 7.62, 0.42, 0.48, 5.86, 6.36, 0.8), hLook.timber, true));
  scene.add(garden);

  // the gutter and its downpipe, on the south eaves: zinc
  const gutter = group('gutter');
  const gY = tilePlaneY(HOUSE_HALF_DEPTH) - HOUSE.overhang * SIN - 0.09;
  const gZ = HOUSE_HALF_DEPTH + HOUSE.overhang * COS + 0.06;
  gutter.add(meshOf(cylX(0.065, HOUSE_X.slice, HOUSE_X.east + 0.1, gY, gZ, 12), look.zinc, true));
  const dp = [
    V(HOUSE_X.east - 0.2, gY, gZ),
    V(HOUSE_X.east - 0.2, gY - 0.3, HOUSE_HALF_DEPTH + 0.06),
    V(HOUSE_X.east - 0.2, 0.1, HOUSE_HALF_DEPTH + 0.06),
  ];
  gutter.add(meshOf(tubeThrough(rounded(dp, 0.1), 0.04, 10), look.zinc, true));
  scene.add(gutter);

  // ---- the shower and the drip: the model's flow
  const shower = new ShowerWater(V(headP.x, headP.y - 0.05, headP.z), fl + 0.012, 0.075);
  scene.add(shower.root);
  const drip = new Drip(V(dx, 0.415, zOut), 0.03, 0.006);
  P['drain-outlet'].add(drip.object);

  // ---- the sun's arc: the day's path, from the simulation's site and day. Thin, so wide enough not to shimmer: a tube a hand across at 90 m
  const arcMat = new THREE.MeshBasicMaterial({
    color: 0xf2cf7e,
    transparent: true,
    opacity: 0.5,
    fog: false,
    depthWrite: false,
  });
  const arc = new THREE.Mesh(new THREE.BufferGeometry(), arcMat);
  arc.userData.noShadow = true;
  arc.frustumCulled = false;
  scene.add(arc);
  const sunBall = new THREE.Mesh(
    new THREE.SphereGeometry(2.2, 18, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff1c4, fog: false }),
  );
  sunBall.frustumCulled = false;
  scene.add(sunBall);
  const arcCentre = V(1, 6, 2);
  const ARC_R = 92;
  const dirOf = (alt: number, az: number) => {
    const a = (alt * Math.PI) / 180;
    const z = (az * Math.PI) / 180;
    return V(-Math.sin(z) * Math.cos(a), Math.sin(a), Math.cos(z) * Math.cos(a));
  };
  let arcKey = '';
  const rebuildArc = (site: SiteId, day: number) => {
    const key = `${site}|${Math.round(day)}`;
    if (key === arcKey) return;
    arcKey = key;
    const t = sunTerms(SITES[site].latitude, Math.round(day) + 1, 30, 0);
    const pts: THREE.Vector3[] = [];
    for (let h = 0; h <= 24; h += 0.25) {
      const alt = sunAltitude(t, h);
      if (alt < -1.5) continue;
      pts.push(dirOf(alt, sunAzimuth(t, h)).multiplyScalar(ARC_R).add(arcCentre));
    }
    arc.geometry.dispose();
    arc.geometry = pts.length > 2 ? tubeThrough(pts, 0.11, 5) : new THREE.BufferGeometry();
  };

  // ---- anchors: where the home view and the slice show each part
  const anchors: Record<string, THREE.Object3D> = {};
  const add2 = (id: HousePart, p: THREE.Vector3, parent: THREE.Object3D = P[id]) => {
    anchors[id] = anchor(parent, p.x, p.y, p.z, `${id}-label`);
  };
  add2('roof-unit', onRoof(-0.1, 0.56, 2.24), machine);
  add2('shade-tree', V(5.4, 5.1, 7.4));
  add2('hot-line', V(showerX, HOUSE.floor1 + 2.8 - 0.3, zSouth - 0.04));
  add2('cold-main', V(xIn, 0.66, zSouth));
  add2('roof-structure', V(HOUSE_X.slice - 0.02, 6.2, 2.75), roof.structure);
  add2('load-bearing-wall', V(HOUSE_X.slice - 0.01, 3.7, (SPINE.z0 + SPINE.z1) / 2), spine);
  add2('meter-box', V(meterX + 0.12, meterY + 0.1, meterZ + 0.13));
  add2('drain-outlet', V(dx, 0.5, zOut));
  add2('roof-penetration', onRoof(pen.xs.cold, 0.08, pen.s));
  add2('roof-tiles', onRoofWorld(3.4, 2.2), roof.tiles);

  // ---- merge and wear, register
  P['roof-unit'] = machine;
  P['roof-structure'] = roof.structure;
  P['roof-tiles'] = roof.tiles;
  P['load-bearing-wall'] = spine;
  for (const id of UNIT_PARTS) mergeStatic(unit.parts[id], { bakeKey: 'house-machine' });
  mergeStatic(unit.body, { bakeKey: 'house-machine' });
  applyWear(machine, 22, (m) => (m.material as THREE.Material).name === 'plate');
  applyWear(b.shell, 3, (m) =>
    ['stone', 'floor-terra', 'floor-tile', 'wall-tile', 'window'].includes((m.material as THREE.Material).name),
  );
  applyWear(spine, 3, (m) => (m.material as THREE.Material).name === 'stone');
  applyWear(roof.structure, 8);
  applyWear(roof.tiles, 6);
  for (const id of PARTS) {
    if (!P[id].parent) scene.add(P[id]);
    if (!['roof-unit', 'roof-tiles', 'shade-tree'].includes(id)) mergeStatic(P[id], { bakeKey: 'house-parts' });
  }
  const registry = new PartRegistry();
  for (const id of PARTS) registry.add(id, P[id], new THREE.Vector3(...DROP[id]), undefined, FRAMING[id]);

  // ---- flows: the mains and the hot line, while a tap runs
  const sim: { s: SolarState | null } = { s: null };
  const flows = new FlowDots(160, 0.09);
  scene.add(flows.object);
  const cold = () => (sim.s ? sim.s.layers[0] : 15);
  const hot = () => (sim.s ? sim.s.tankTop : 60);
  for (const p of [coldPathA, coldPathB, coldPathC])
    flows.add({ points: p, ratio: 1, temperature: cold, spacing: 0.32 });
  for (const p of [hotPathA, hotPathB, hotPathC]) flows.add({ points: p, ratio: 1, temperature: hot, spacing: 0.3 });
  const Aline = Math.PI * R * R;

  const joints = [
    { name: 'cold line to the tank', a: coldPathC[coldPathC.length - 1], b: nippleCold.clone() },
    { name: 'hot line from the tank', a: hotPathA[0], b: nippleHot.clone() },
    { name: 'drain from the T&P', a: rounded(drainRoof, 0.04)[0], b: tprDrain.clone() },
    { name: 'cold outside to inside', a: coldPathA[coldPathA.length - 1], b: coldPathB[0] },
  ];

  const home: THREE.Vector3 = V(-13.5, 8.2, 14.5);
  const mod: HouseScene = {
    id: 'house',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    unit,
    sky,
    tree,
    shower,
    drip,
    flows,
    building,
    joints,
    home: { position: home, target: V(0.9, 4.1, 2.2) },
    minDistance: 1.2,
    maxDistance: 62,
    near: 0.08,
    far: 1800,
    homePadding: 0.82,
    declutter: true,
    update(s, dt, view) {
      sim.s = s;
      sky.update(s.sunAlt, s.sunAz);
      const pr = params();
      rebuildArc(pr.site, s.dayOfYear);
      unit.setExtras(pr.checkValve, pr.pipeInsulation);
      sunBall.position.copy(dirOf(s.sunAlt, s.sunAz).multiplyScalar(ARC_R)).add(arcCentre);
      sunBall.visible = s.sunAlt > -2;
      arc.visible = true;
      hLook.windowGlass.emissiveIntensity = 0.55 * sky.night;
      const now = partsNow(registry);
      // an isolated part stands alone with the ground; under x-ray, the shell lets it be seen
      let ghost = false;
      for (const id of registry.ids()) if (registry.get(id)!.display === 'ghost') ghost = true;
      building.visible = !now.isolated && !ghost;
      bath.visible = !now.isolated;
      gutter.visible = !now.isolated && !ghost;
      garden.visible = !now.isolated;
      shower.update(now.isolated ? 0 : s.tapFlow, s.tapT, s.airT, view.time);
      drip.update(s.reliefDrip, dt * view.slowMo);
      const show = view.schematic && !now.isolated;
      flows.object.visible = show;
      if (show) flows.step((s.tapFlow / 60000 / Aline) * view.slowMo, dt);
    },
  };
  return mod;
}

function meshOf(g: THREE.BufferGeometry, m: THREE.Material, shadows = false): THREE.Mesh {
  const o = new THREE.Mesh(g, m);
  if (shadows) o.castShadow = o.receiveShadow = true;
  return o;
}

/** The height along the roof's normal, in the roof's frame, of a world point of the machine. */
function unitN(p: THREE.Vector3, unit: RoofUnit): number {
  return unit.body.worldToLocal(p.clone()).y;
}
function onRoofWorld(x: number, sFromFoot: number): THREE.Vector3 {
  return new THREE.Vector3(x, HOUSE_FOOT.y + sFromFoot * SIN + 0.02, HOUSE_FOOT.z - sFromFoot * COS);
}
