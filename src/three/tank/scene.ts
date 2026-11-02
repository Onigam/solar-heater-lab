import * as THREE from 'three';
import { applyWear, group, MAT, PartRegistry } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { SolarState } from '../../sim/types';
import { TANK, TANK_DRUM_HALF, TAP, VESSEL_HALF } from '../dims';
import { dotSpeed, FlowDots, stretch } from '../flows';
import { heatLegend } from '../heat-legend';
import { machineLook } from '../machine/look';
import { box, cylX, hexX, mergeAll, rod, rounded, tubeThrough } from '../machine/shapes';
import { buildTank, capReach, TANK_PARTS, type Tank, type TankPart } from '../machine/tank';
import { mergeStatic } from '../merge';
import { partName } from '../part-ids';
import { anchor, hotspots, paperFloor, partsNow, viewFrom, workshopScene, type HotspotDef } from '../world';
import { Drip, ShowerWater } from './water';

// The `tank-and-tap` world: the store and the way to the tap, left to right in the order the heat flows. The tank, the same function as on the roof, is cut along its axis: this is what the world is for,
// so it opens that way. The ten layers of the water are the model's, in false colour. On the wall the mains' valves in the maker's order, the tempering valve, the shower. The section tool cuts the tank
// square to its axis, for the ten layers as slices of a circle. No distance here is a real one: a house's would not fit (research §0.4).

const PLUMBING = ['trio-valve', 'cold-relief-valve', 'tempering-valve', 'shower-head'] as const;
type PlumbingPart = (typeof PLUMBING)[number];
export type TapPart = TankPart | PlumbingPart;

/** Explode offsets, m. The tank opens as an onion, up, the jacket down, the caps out along the axis (their `custom`), and what is on the axis slides out of its end; the plumbing comes forward off its wall. */
export const EXPLODE: Record<TapPart, [number, number, number]> = {
  'outer-case': [0, 1.5, 0],
  'tank-foam': [0, 1.02, 0],
  'inner-vessel': [0, 0.55, 0],
  'water-column': [0, 0, 0],
  'mantle-jacket': [0, -0.52, 0],
  'end-cap': [0, 0, 0],
  'sacrificial-anode': [-1.75, 0.3, 0],
  'booster-element': [-1.52, -0.2, 0],
  'tank-thermostat': [-1.42, 0.06, 0.04],
  'jacket-relief-valve': [-1.2, -0.42, 0],
  'cold-diffuser': [0.95, -0.42, 0],
  'hot-outlet': [0.98, 0.66, 0],
  'tpr-valve': [0.9, 0.22, 0.2],
  'trio-valve': [0, 0, 0.42],
  'cold-relief-valve': [-0.22, 0, 0.7],
  'tempering-valve': [0, 0, 0.62],
  'shower-head': [0.2, 0.12, 0.34],
};

const CAP_OUT = 0.62;

const HOTSPOTS: HotspotDef[] = [
  { id: 'water-column', ...partName('water-column') },
  { id: 'mantle-jacket', ...partName('mantle-jacket') },
  { id: 'tempering-valve', ...partName('tempering-valve') },
  { id: 'shower-head', ...partName('shower-head') },
  { id: 'tank-foam', ...partName('tank-foam'), minor: true },
  { id: 'booster-element', ...partName('booster-element'), minor: true },
  { id: 'inner-vessel', ...partName('inner-vessel'), minor: true },
  { id: 'outer-case', ...partName('outer-case'), minor: true },
  { id: 'end-cap', ...partName('end-cap'), minor: true },
  { id: 'sacrificial-anode', ...partName('sacrificial-anode'), minor: true },
  { id: 'tank-thermostat', ...partName('tank-thermostat'), minor: true },
  { id: 'tpr-valve', ...partName('tpr-valve'), minor: true },
  { id: 'jacket-relief-valve', ...partName('jacket-relief-valve'), minor: true },
  { id: 'cold-diffuser', ...partName('cold-diffuser'), minor: true },
  { id: 'hot-outlet', ...partName('hot-outlet'), minor: true },
  { id: 'trio-valve', ...partName('trio-valve'), minor: true },
  { id: 'cold-relief-valve', ...partName('cold-relief-valve'), minor: true },
];

const FRAMING: Partial<Record<TapPart, PartFraming>> = {
  'water-column': { viewDir: viewFrom(10, -6) },
  'mantle-jacket': { viewDir: viewFrom(2, -8) },
  'tank-foam': { viewDir: viewFrom(12, 8) },
  'inner-vessel': { viewDir: viewFrom(10, -6) },
  'outer-case': { viewDir: viewFrom(32, -12) },
  'sacrificial-anode': { viewDir: viewFrom(10, -8) },
  'booster-element': { viewDir: viewFrom(10, -12) },
  'tank-thermostat': { viewDir: viewFrom(14, -12) },
  'cold-diffuser': { viewDir: viewFrom(6, 6) },
  'hot-outlet': { viewDir: viewFrom(14, 16) },
  'tpr-valve': { viewDir: viewFrom(20, 58) },
  'jacket-relief-valve': { viewDir: viewFrom(10, -62) },
  'end-cap': { viewDir: viewFrom(16, -46) },
  'trio-valve': { viewDir: viewFrom(10, -10) },
  'cold-relief-valve': { viewDir: viewFrom(10, -22) },
  'tempering-valve': { viewDir: viewFrom(12, -8) },
  'shower-head': { viewDir: viewFrom(6, -18) },
};

export interface TankScene extends SceneModule<SolarState> {
  tank: Tank;
  shower: ShowerWater;
  drip: Drip;
  wall: THREE.Group;
  flows: FlowDots;
  mains: FlowDots;
  /** The plumbing's ends, for the tests: world points that must meet. */
  joints: { name: string; a: THREE.Vector3; b: THREE.Vector3 }[];
  element: THREE.MeshStandardMaterial;
}

/** A tile pattern for the wall and the floor of the bathroom, as a DataTexture: pale glazed squares, a grey joint. */
function tiles(base: [number, number, number], joint: [number, number, number], n = 64): THREE.DataTexture {
  const d = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const edge = i < 2 || j < 2;
      const c = edge ? joint : base;
      const k = (j * n + i) * 4;
      d[k] = c[0];
      d[k + 1] = c[1];
      d[k + 2] = c[2];
      d[k + 3] = 255;
    }
  }
  const t = new THREE.DataTexture(d, n, n, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** A box whose UVs are in metres on each face, so that a repeating texture is square. */
function boxTiled(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  size: number,
): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const u = nx > 0.5 ? pos.getZ(i) : pos.getX(i);
    const v = ny > 0.5 ? pos.getZ(i) : pos.getY(i);
    uv.setXY(i, u / size, v / size);
  }
  return g;
}

export function createTankScene(): TankScene {
  const scene = workshopScene({
    name: 'tank-and-tap',
    key: [-1.2, 8.5, 6.5],
    target: [0.9, 1.2, -0.2],
    shadowHalf: 6,
    shadowFar: 22,
  });
  scene.add(paperFloor(16));
  const look = machineLook();
  const element = look.element as THREE.MeshStandardMaterial;

  // ---- the wall: scenery. Plaster along the whole world, tile behind the shower, a floor of tile, a side wall
  const wall = group('wall');
  scene.add(wall);
  const WZ = TAP.wallZ;
  const plaster = new THREE.MeshStandardMaterial({ color: 0xe7dfd0, roughness: 0.92, name: 'plaster' });
  const tileWall = new THREE.MeshStandardMaterial({
    map: tiles([236, 238, 232], [150, 152, 150]),
    roughness: 0.32,
    metalness: 0,
    name: 'tile-wall',
  });
  tileWall.userData.noShare = true;
  const tileFloor = new THREE.MeshStandardMaterial({
    map: tiles([170, 158, 142], [96, 90, 84]),
    roughness: 0.55,
    name: 'tile-floor',
  });
  tileFloor.userData.noShare = true;
  const X0 = -1.9;
  const X1 = TAP.wallX1;
  const backH = 2.86;
  const add = (g: THREE.BufferGeometry, m: THREE.Material) => {
    const o = new THREE.Mesh(g, m);
    o.castShadow = true;
    o.receiveShadow = true;
    wall.add(o);
    return o;
  };
  add(box(X0, X1, 0, backH, WZ - 0.14, WZ), plaster);
  add(box(X1, X1 + 0.12, 0, backH, WZ - 0.14, 0.56), plaster);
  add(boxTiled(TAP.wallX0 + 0.6, X1, 0.02, 2.3, WZ, WZ + 0.008, 0.15), tileWall);
  add(boxTiled(X1 - 0.008, X1, 0.02, 2.3, WZ, 0.56, 0.15), tileWall);
  add(boxTiled(TAP.wallX0, X1, 0, 0.02, WZ, 0.82, 0.2), tileFloor);
  const trayCx = TAP.showerX;
  const trayCz = TAP.showerZ;
  const tray = new THREE.MeshStandardMaterial({ color: 0xeef0ec, roughness: 0.25, name: 'tray' });
  const tw = TAP.trayW / 2;
  const td = TAP.trayD / 2;
  const trayT = 0.04;
  add(
    mergeAll([
      box(trayCx - tw, trayCx + tw, 0.02, 0.03, trayCz - td, trayCz + td),
      box(trayCx - tw, trayCx + tw, 0.02, TAP.trayH, trayCz - td, trayCz - td + trayT),
      box(trayCx - tw, trayCx + tw, 0.02, TAP.trayH, trayCz + td - trayT, trayCz + td),
      box(trayCx - tw, trayCx - tw + trayT, 0.02, TAP.trayH, trayCz - td, trayCz + td),
      box(trayCx + tw - trayT, trayCx + tw, 0.02, TAP.trayH, trayCz - td, trayCz + td),
    ]),
    tray,
  );
  add(cylX(0.045, trayCx - 0.045, trayCx + 0.045, 0.031, trayCz, 24).rotateZ(0), look.steel);
  mergeStatic(wall, { bakeKey: 'tap-wall' });
  applyWear(wall, 2.5, (m) => (m.material as THREE.Material).name.startsWith('tile'));

  // ---- what holds the tank: two steel brackets out of the wall, an arm under the tank at its lowest line, a strut under the arm, a saddle up the back of the case. Scenery: they go when a part is isolated
  const standG = group('tank-stand');
  scene.add(standG);
  const standMat = new THREE.MeshStandardMaterial({ color: 0x8b9095, roughness: 0.6, metalness: 0.55, name: 'stand' });
  const beamY = TAP.tankY - TANK.caseR;
  // each bracket a mesh: the section across takes the left half of the tank away, and no bracket stays holding nothing
  const brackets: THREE.Mesh[] = [];
  for (const x of [-0.72, 0.72]) {
    const standList: THREE.BufferGeometry[] = [];
    // the arm, from the wall to under the tank's axis and a hand beyond
    standList.push(box(x - 0.025, x + 0.025, beamY - 0.06, beamY, WZ, 0.1));
    // the strut, from the wall lower down to the arm
    standList.push(rod(new THREE.Vector3(x, beamY - 0.62, WZ), new THREE.Vector3(x, beamY - 0.05, -0.1), 0.02, 8));
    // the wall plate
    standList.push(box(x - 0.05, x + 0.05, beamY - 0.72, beamY + 0.04, WZ, WZ + 0.012));
    // the saddle: a band of steel on the back of the case, from the arm up to the axis
    const arc: THREE.Vector3[] = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * (Math.PI / 2);
      arc.push(
        new THREE.Vector3(x, TAP.tankY - Math.cos(a) * (TANK.caseR + 0.006), -Math.sin(a) * (TANK.caseR + 0.006)),
      );
    }
    standList.push(tubeThrough(arc, 0.008, 8));
    const st = new THREE.Mesh(mergeAll(standList), standMat);
    st.castShadow = st.receiveShadow = true;
    standG.add(st);
    brackets.push(st);
  }
  applyWear(standG, 40);

  // ---- the tank, cut along its axis
  const tank = buildTank(look, { views: true });
  tank.root.position.set(0, TAP.tankY, 0);
  scene.add(tank.root);

  // ---- the plumbing, world coordinates, on the wall's face
  const zW = WZ + 0.038;
  const H = TANK_DRUM_HALF;
  const parts = Object.fromEntries(PLUMBING.map((id) => [id, group(id)])) as Record<PlumbingPart, THREE.Group>;
  for (const id of PLUMBING) scene.add(parts[id]);
  const R = 0.011;
  const coldMat = new THREE.MeshStandardMaterial({ color: 0x3f6ea6, roughness: 0.5, name: 'cold-pipe' });
  coldMat.userData.noShare = true;
  const chrome = new THREE.MeshStandardMaterial({ color: 0xd8dcdf, roughness: 0.2, metalness: 0.95, name: 'chrome' });
  const brass = look.brass;
  const copper = look.copper;
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const tube = (parent: THREE.Object3D, pts: THREE.Vector3[], mat: THREE.Material, r = R) => {
    const path = rounded(pts, 0.04);
    const m = new THREE.Mesh(tubeThrough(path, r, 10), mat);
    m.castShadow = true;
    parent.add(m);
    return path;
  };
  const putMesh = (parent: THREE.Object3D, g: THREE.BufferGeometry, mat: THREE.Material) => {
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const clip = (parent: THREE.Object3D, x: number, y: number, vertical: boolean) => {
    const w = vertical ? 0.02 : 0.014;
    const h = vertical ? 0.014 : 0.02;
    putMesh(parent, box(x - w, x + w, y - h, y + h, WZ, zW + R + 0.002), look.zinc);
  };

  const xCold = TAP.wallX0 + 0.2;
  const yValve = TAP.valveY;
  const yTrio = 0.6;
  const yTemper = TAP.temperY;
  const xTemper = TAP.temperX;
  const nippleCold = V(H + capReach(Math.abs(TANK.diffuserY)) + 0.026, TAP.tankY + TANK.diffuserY, 0);
  const nippleHot = V(H + capReach(0.178) + 0.026, TAP.tankY + 0.178, 0);
  const tprDrain = V(H + capReach(0.092) + 0.028, TAP.tankY + 0.092 - 0.05, 0.04);

  // the mains: from under the floor, through the trio valve, up the wall, and over to the tank's cold inlet
  const coldPts = [
    V(xCold, 0.02, zW),
    V(xCold, TAP.tankY + TANK.diffuserY, zW),
    V(1.42, TAP.tankY + TANK.diffuserY, zW),
    V(1.42, TAP.tankY + TANK.diffuserY, 0),
    nippleCold,
  ];
  const mainsPath = tube(parts['trio-valve'], coldPts, coldMat);
  // the trio: a brass body in line, its lever, an arrow of the flow in the body's shape
  putMesh(parts['trio-valve'], rod(V(xCold, yTrio - 0.055, zW), V(xCold, yTrio + 0.055, zW), 0.022, 16), brass);
  putMesh(parts['trio-valve'], hexX(0.02, xCold - 0.02, xCold + 0.02, yTrio - 0.075, zW).rotateZ(0), brass);
  putMesh(parts['trio-valve'], rod(V(xCold, yTrio + 0.02, zW), V(xCold, yTrio + 0.02, zW + 0.05), 0.009, 10), brass);
  putMesh(
    parts['trio-valve'],
    box(xCold - 0.009, xCold + 0.075, yTrio + 0.012, yTrio + 0.028, zW + 0.05, zW + 0.056),
    MAT.redPaint(),
  );
  for (const y of [0.3, 1.5, 1.9]) clip(parts['trio-valve'], xCold, y, true);
  // a flange where it comes through the floor
  putMesh(parts['trio-valve'], rod(V(xCold, 0.02, zW), V(xCold, 0.028, zW), 0.04, 18), chrome);

  // the cold relief valve, last on the line: a tee, a body towards the left, its lever, its drain down to a funnel, the funnel down through the floor
  const xRel = xCold - 0.1;
  const funnelX = xRel - 0.05;
  const funnelY = 0.62;
  putMesh(parts['cold-relief-valve'], cylX(0.012, xRel, xCold, yValve, zW, 12), brass);
  putMesh(
    parts['cold-relief-valve'],
    rod(V(xCold, yValve - 0.028, zW), V(xCold, yValve + 0.028, zW), 0.018, 14),
    brass,
  );
  putMesh(parts['cold-relief-valve'], cylX(0.02, xRel - 0.07, xRel, yValve, zW, 16), brass);
  putMesh(
    parts['cold-relief-valve'],
    rod(V(xRel - 0.035, yValve, zW), V(xRel - 0.035, yValve + 0.05, zW), 0.012, 12),
    brass,
  );
  putMesh(
    parts['cold-relief-valve'],
    box(xRel - 0.036, xRel - 0.034, yValve + 0.05, yValve + 0.056, zW - 0.008, zW + 0.05),
    look.steel,
  );
  const relDrain = [V(xRel - 0.05, yValve, zW), V(funnelX, yValve - 0.06, zW), V(funnelX, funnelY + 0.12, zW)];
  tube(parts['cold-relief-valve'], relDrain, copper, 0.0075);
  // the funnel and its pipe through the floor
  const funnel = new THREE.CylinderGeometry(0.038, 0.012, 0.06, 18, 1, true);
  funnel.translate(funnelX, funnelY + 0.03, zW);
  const fm = putMesh(
    parts['cold-relief-valve'],
    funnel,
    new THREE.MeshStandardMaterial({
      color: 0xbfc4c6,
      roughness: 0.4,
      metalness: 0.6,
      side: THREE.DoubleSide,
      name: 'funnel',
    }),
  );
  fm.userData.noShare = true;
  tube(parts['cold-relief-valve'], [V(funnelX, funnelY + 0.002, zW), V(funnelX, 0.02, zW)], look.zinc, 0.012);
  clip(parts['cold-relief-valve'], funnelX, 0.3, true);

  // the T&P's own drain: from the valve, back to the wall, down to the same funnel: it never holds pressure
  const tprLine = [
    tprDrain,
    V(tprDrain.x, TAP.tankY - 0.34, 0.04),
    V(tprDrain.x, TAP.tankY - 0.34, zW),
    V(funnelX - 0.012, TAP.tankY - 0.34, zW),
    V(funnelX - 0.012, funnelY + 0.1, zW),
  ];
  const tprPipe = group('tpr-drain');
  tube(tprPipe, tprLine, copper, 0.0075);
  clip(tprPipe, funnelX - 0.012, 1.45, true);
  tprPipe.position.y = -TAP.tankY; // this part hangs from the tank's frame, its lines are in the world's
  tank.parts['tpr-valve'].add(tprPipe);

  // the hot line: from the outlet, to the wall, along it, down to the tempering valve
  const hotPts = [
    nippleHot,
    V(1.3, nippleHot.y, 0),
    V(1.3, nippleHot.y, zW),
    V(xTemper, nippleHot.y, zW),
    V(xTemper, yTemper + 0.06, zW),
  ];
  const hotLine = group('hot-line-tap');
  const hotPath = tube(hotLine, hotPts, copper);
  for (const x of [1.6, 2.2]) clip(hotLine, x, nippleHot.y, false);
  clip(hotLine, xTemper, 2.0, true);
  hotLine.position.y = -TAP.tankY;
  tank.parts['hot-outlet'].add(hotLine);

  // the tempering valve: hot from above, cold from the left, tempered to the right
  const tv = parts['tempering-valve'];
  putMesh(
    tv,
    mergeAll([
      rod(V(xTemper, yTemper - 0.05, zW), V(xTemper, yTemper + 0.06, zW), 0.026, 18),
      cylX(0.017, xTemper - 0.06, xTemper + 0.07, yTemper, zW, 14),
    ]),
    brass,
  );
  putMesh(tv, rod(V(xTemper, yTemper, zW + 0.02), V(xTemper, yTemper, zW + 0.06), 0.03, 22), chrome);
  putMesh(tv, rod(V(xTemper, yTemper, zW + 0.06), V(xTemper, yTemper, zW + 0.066), 0.012, 12), MAT.redPaint());
  const coldBranch = [V(xCold, yTemper, zW), V(xTemper - 0.06, yTemper, zW)];
  const branchPath = tube(tv, coldBranch, coldMat);
  putMesh(tv, rod(V(xCold, yTemper - 0.025, zW), V(xCold, yTemper + 0.025, zW), 0.016, 14), brass);
  const riserX = TAP.showerX;
  const mixPts = [V(xTemper + 0.07, yTemper, zW), V(riserX, yTemper, zW), V(riserX, TAP.showerY + 0.1, zW)];
  const mixPath = tube(tv, mixPts, chrome, 0.009);
  clip(tv, riserX, 1.75, true);

  // the shower: an arm from the wall, a head
  const sh = parts['shower-head'];
  const armEnd = V(TAP.showerX, TAP.showerY + 0.06, TAP.showerZ);
  const armPath = tube(
    sh,
    [V(riserX, TAP.showerY + 0.1, zW), V(riserX, TAP.showerY + 0.1, TAP.showerZ - 0.06), armEnd],
    chrome,
    0.009,
  );
  const headTop = new THREE.CylinderGeometry(0.03, 0.105, 0.04, 28);
  headTop.translate(armEnd.x, armEnd.y - 0.02, armEnd.z);
  putMesh(sh, headTop, chrome);
  const rose = new THREE.CylinderGeometry(0.105, 0.105, 0.008, 32);
  rose.translate(armEnd.x, armEnd.y - 0.044, armEnd.z);
  putMesh(sh, rose, look.steel);
  const headY = armEnd.y - 0.05;

  // ---- the water, from the model
  // beside the part, not in it: drawn points would count in its bounds. It leaves with the part by hand, below
  const shower = new ShowerWater(V(armEnd.x, headY, armEnd.z), 0.03, 0.08);
  scene.add(shower.root);
  const drip = new Drip(V(funnelX, funnelY + 0.115, zW), funnelY + 0.01);
  scene.add(drip.object);

  // ---- anchors
  const anchors: Record<string, THREE.Object3D> = {};
  const atTank = (id: TankPart, x: number, y: number, z: number) => {
    anchors[id] = anchor(tank.parts[id], x, y, z, `${id}-label`);
  };
  const atPlumb = (id: PlumbingPart, x: number, y: number, z: number) => {
    anchors[id] = anchor(parts[id], x, y, z, `${id}-label`);
  };
  atTank('water-column', 0.25, 0.06, 0.001);
  atTank('mantle-jacket', -0.2, -TANK.vesselR - 0.008, 0.01);
  atTank('tank-foam', 0.12, TANK.caseR - 0.018, 0.001);
  atTank('inner-vessel', 0.62, TANK.vesselR + 0.001, 0.002);
  atTank('outer-case', -0.62, TANK.caseR + 0.002, -0.02);
  anchors['end-cap'] = anchor(tank.caps.left, -(H + 0.07), 0.13, 0.04, 'end-cap-label');
  atTank('sacrificial-anode', -0.56, TANK.anodeY + 0.01, 0.01);
  atTank('booster-element', -0.56, TANK.elementY - 0.02, 0.01);
  atTank('tank-thermostat', -VESSEL_HALF + 0.2, TANK.elementY + 0.06, 0.01);
  atTank('tpr-valve', H + 0.11, 0.1, 0.04);
  atTank('jacket-relief-valve', -(H + 0.09), -0.14, 0.05);
  atTank('cold-diffuser', 0.56, TANK.diffuserY + 0.03, 0.015);
  atTank('hot-outlet', 0.93, 0.178, 0.012);
  atPlumb('trio-valve', xCold + 0.05, yTrio, zW + 0.03);
  atPlumb('cold-relief-valve', xRel - 0.075, yValve, zW + 0.02);
  atPlumb('tempering-valve', xTemper + 0.03, yTemper + 0.03, zW + 0.06);
  atPlumb('shower-head', armEnd.x + 0.1, armEnd.y - 0.03, armEnd.z);

  // ---- register
  const registry = new PartRegistry();
  for (const id of TANK_PARTS) {
    const custom =
      id === 'end-cap'
        ? (f: number) => {
            tank.caps.left.position.x = -CAP_OUT * f;
            tank.caps.right.position.x = CAP_OUT * f;
          }
        : undefined;
    registry.add(id, tank.parts[id], new THREE.Vector3(...EXPLODE[id]), custom, FRAMING[id]);
  }
  for (const id of PLUMBING) {
    mergeStatic(parts[id], { bakeKey: 'tap' });
    registry.add(id, parts[id], new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  }
  applyWear(tank.root, 30);
  applyWear(
    scene,
    40,
    (m) => (m.material as THREE.Material).name === 'chrome' || (m.material as THREE.Material).name.startsWith('tile'),
  );

  // ---- the flows. Two loops: the jacket's, at the state's speed; the drinking water's, at the tap's
  const sim: { s: SolarState | null } = { s: null };
  const flows = new FlowDots(90, 0.026);
  tank.root.add(flows.object);
  const Apipe = Math.PI * 0.01 * 0.01;
  const Ajacket = Math.PI * (TANK.vesselR + TANK.jacketGap) * TANK.jacketGap;
  const yJ = -TANK.vesselR - TANK.vesselWall - TANK.jacketGap / 2;
  flows.add({
    points: [
      V(-TANK.portX, TANK.portY, 0.002),
      V(-VESSEL_HALF, yJ, 0.002),
      V(VESSEL_HALF, yJ, 0.002),
      V(TANK.portX, TANK.portY, 0.002),
    ],
    ratio: Apipe / Ajacket,
    spacing: 0.09,
    temperature: (t) => (sim.s ? stretch(sim.s.loopT, sim.s.loopMap.jacket[0], sim.s.loopMap.jacket[1], t) : 20),
  });
  const mains = new FlowDots(150, 0.03);
  scene.add(mains.object);
  const Aline = Math.PI * R * R;
  const cold = () => (sim.s ? sim.s.layers[0] : 15);
  const top = () => (sim.s ? sim.s.tankTop : 60);
  const tapT = () => (sim.s ? Math.max(sim.s.tapT, 15) : 40);
  mains.add({ points: mainsPath, ratio: 1, temperature: cold, spacing: 0.14 });
  mains.add({ points: branchPath, ratio: 0.5, temperature: cold, spacing: 0.14 });
  mains.add({ points: hotPath, ratio: 0.5, temperature: top, spacing: 0.14 });
  mains.add({ points: mixPath, ratio: 1, temperature: tapT, spacing: 0.1 });
  mains.add({ points: armPath, ratio: 1, temperature: tapT, spacing: 0.08 });

  // ---- the scale
  const legend = heatLegend();
  legend.root.position.set(-1.72, 0, -0.34);
  legend.root.rotation.y = 0.15;
  legend.root.scale.setScalar(1.25);
  scene.add(legend.root);

  const joints = [
    { name: 'mains into the tank', a: mainsPath[mainsPath.length - 1], b: nippleCold.clone() },
    { name: 'hot from the tank', a: hotPath[0], b: nippleHot.clone() },
    { name: 'hot into the tempering valve', a: hotPath[hotPath.length - 1], b: V(xTemper, yTemper + 0.06, zW) },
    { name: 'cold into the tempering valve', a: branchPath[branchPath.length - 1], b: V(xTemper - 0.06, yTemper, zW) },
    { name: 'tempered out', a: mixPath[0], b: V(xTemper + 0.07, yTemper, zW) },
    { name: 'arm on the riser', a: armPath[0], b: mixPath[mixPath.length - 1] },
  ];

  const mod: TankScene = {
    id: 'tank-and-tap',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    tank,
    shower,
    drip,
    wall,
    flows,
    mains,
    joints,
    element,
    home: { position: new THREE.Vector3(-1.1, 3.0, 7.2), target: new THREE.Vector3(0.9, 1.42, -0.1) },
    minDistance: 0.25,
    maxDistance: 18,
    near: 0.02,
    far: 70,
    homePadding: 0.9,
    declutter: true,
    update(s, dt, view) {
      sim.s = s;
      const now = partsNow(registry);
      wall.visible = !now.isolated;
      standG.visible = !now.isolated;
      legend.root.visible = !now.isolated && !now.exploded;
      tank.setView(view.cutaway ? 'across' : 'length');
      brackets[0].visible = !view.cutaway;
      tank.layers.update(s.layers);
      tank.jacketStrip.update(s.loopT, s.loopMap.jacket[0]);
      element.emissive.setHex(s.boostOn ? 0xff5a18 : 0x000000);
      element.emissiveIntensity = s.boostOn ? 0.9 : 0;
      const showerHere = registry.get('shower-head')!.display === 'solid' && !now.exploded;
      shower.update(showerHere ? s.tapFlow : 0, s.tapT, s.airT, view.time);
      drip.update(
        registry.get('cold-relief-valve')!.display === 'solid' && !now.exploded ? s.reliefDrip : 0,
        dt * view.slowMo,
      );
      legend.setMarks(s.airT, s.tankTop);
      const show = view.schematic && !now.hidden && !now.exploded;
      flows.object.visible = show && !view.cutaway;
      mains.object.visible = show;
      if (show) {
        flows.step(dotSpeed(s.pipeSpeed, s.flowDir) * view.slowMo, dt);
        const vLine = (s.tapFlow / 60000 / Aline) * view.slowMo;
        mains.step(vLine, dt);
      }
    },
  };
  return mod;
}
