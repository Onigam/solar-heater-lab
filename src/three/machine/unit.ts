import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import {
  BANK,
  BANK_WIDTH,
  COLLECTOR,
  COLLECTOR_STRAP,
  COLLECTOR_X,
  COS,
  FITTING,
  HEADER_N,
  HEADER_R,
  LOWER_HEADER_S,
  PIPE,
  RAIL,
  RAIL_ANGLE,
  SIN,
  SPACER,
  SPACER_XS,
  TANK,
  TANK_DRUM_HALF,
  TILT,
  UPPER_HEADER_S,
} from '../dims';
import { buildCollector, type Collector } from './collector';
import type { MachineLook } from './look';
import { acrossSlope, box, cylX, hexX, mergeAll, rod, rounded, tubeThrough, type P2 } from './shapes';
import { buildTank, type Tank } from './tank';

// The machine on its roof: one function, from `dims.ts`, for the `rig` and the `house`. Its root stands in the `roof` frame rotated by the pitch, its foot at the world's origin of the
// machine; a world places the root and nothing else. Every part hangs from `body`, which carries the rail's raise in the plane of the roof. The tank, what is strapped to it and the pipes'
// far ends move with `setPose`: the test stand of the `rig`. A `house` leaves it at home.

export const UNIT_PARTS = [
  'collector-left',
  'collector-right',
  'collector-link',
  'storage-tank',
  'hot-pipe',
  'cold-pipe',
  'collector-rail',
  'collector-strap',
  'tank-spacer',
  'tank-strap',
  'fill-port',
  'top-plug',
  'overheat-valve',
  'overflow-reservoir',
] as const;
export type UnitPart = (typeof UNIT_PARTS)[number];

export interface RoofUnit {
  root: THREE.Group;
  body: THREE.Group;
  parts: Record<UnitPart, THREE.Group>;
  collectors: { left: Collector; right: Collector };
  tank: Tank;
  /** Move the tank: world metres, sideways and up from its own place. */
  setPose(side: number, up: number): void;
  /** What two switches of the panel put on the pipes: the one-way valve, the sleeves. Neither is on the machine as sold (K33, physics §3). */
  setExtras(oneWayValve: boolean, sleeves: boolean): void;
  /** What holds each, for a test. */
  extras: { valve: THREE.Group; hotSleeve: THREE.Group; coldSleeve: THREE.Group };
  pose: { side: number; up: number };
  /** The centre lines of the two pipes at this pose, in `body`'s frame, in the direction of the day's flow: the cold from the tank to the lower header, the hot from the upper to the tank. */
  coldPath: THREE.Vector3[];
  hotPath: THREE.Vector3[];
  /** The ends of what they connect, in `body`'s frame at this pose. */
  ends(): { hotHeader: THREE.Vector3; hotPort: THREE.Vector3; coldPort: THREE.Vector3; coldHeader: THREE.Vector3 };
  /** A point of the tank's frame in `body`'s frame, at this pose. */
  tankToBody(p: THREE.Vector3): THREE.Vector3;
  /** World direction into `body`'s frame. */
  dirToBody(v: THREE.Vector3): THREE.Vector3;
  /** Moves with the tank (an anchor, a hotspot). */
  carrier: THREE.Group;
  /** What moves with the tank, one group per part: the place to merge those parts' static meshes, not the part's own group, or they would stay behind. */
  carriers: { 'storage-tank': THREE.Group; 'tank-strap': THREE.Group; 'overflow-reservoir': THREE.Group };
}

const fromRoof = (x: number, n: number, s: number) => new THREE.Vector3(x, n, -s);
/** How low a pipe's centre runs over the roof. estimate: its radius and a finger. */
const CLEAR_N = PIPE.r + 0.022;

/** The point at a share of a polyline's length. */
function pointAlong(path: readonly THREE.Vector3[], share: number): THREE.Vector3 {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += path[i].distanceTo(path[i - 1]);
  let left = total * share;
  for (let i = 1; i < path.length; i++) {
    const d = path[i].distanceTo(path[i - 1]);
    if (left <= d) return path[i - 1].clone().lerp(path[i], d > 0 ? left / d : 0);
    left -= d;
  }
  return path[path.length - 1].clone();
}

/** Where the case is, around the tank, as (s, n) of the roof, at a height `n`: its front face and its back. */
function caseS(n: number, side: -1 | 1): number {
  const dn = TANK.centreN - n;
  return TANK.centreS + side * Math.sqrt(Math.max(0, TANK.caseR * TANK.caseR - dn * dn));
}

export function buildRoofUnit(look: MachineLook): RoofUnit {
  const root = group('roof-unit-machine');
  root.rotation.x = TILT;
  const body = group('body');
  body.rotation.y = RAIL_ANGLE;
  root.add(body);
  const parts = Object.fromEntries(UNIT_PARTS.map((id) => [id, group(id)])) as Record<UnitPart, THREE.Group>;
  for (const id of UNIT_PARTS) body.add(parts[id]);
  const mesh = (parent: THREE.Object3D, geo: THREE.BufferGeometry, mat: THREE.Material): THREE.Mesh => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---- the two collectors, side by side, the same function
  const left = buildCollector(look);
  const right = buildCollector(look);
  left.root.position.set(COLLECTOR_X.left, BANK.standoff, 0);
  right.root.position.set(COLLECTOR_X.right, BANK.standoff, 0);
  parts['collector-left'].add(left.root);
  parts['collector-right'].add(right.root);

  // ---- what joins their headers: a brass union in the gap, on each of the two lines
  for (const s of [LOWER_HEADER_S, UPPER_HEADER_S]) {
    const u: THREE.BufferGeometry[] = [
      cylX(HEADER_R + 0.003, -FITTING.unionLength / 2, FITTING.unionLength / 2, HEADER_N, -s, 18),
    ];
    u.push(hexX(FITTING.unionR + 0.002, -0.006, 0.006, HEADER_N, -s));
    mesh(parts['collector-link'], mergeAll(u), look.brass);
  }

  // ---- the rail: an aluminium channel under the foot; its lip stops the collectors, its web carries them
  const lipS = -RAIL.lipBelow;
  const railProfile: P2[] = [
    [lipS, 0],
    [RAIL.webUp, 0],
    [RAIL.webUp, BANK.standoff],
    [lipS + RAIL.lipThickness, BANK.standoff],
    [lipS + RAIL.lipThickness, RAIL.lipTop],
    [lipS, RAIL.lipTop],
  ];
  mesh(parts['collector-rail'], acrossSlope(railProfile, -RAIL.halfLength, RAIL.halfLength), look.alu);

  // ---- the collector straps: hooked over the rail's lip, down the slope to a rafter, bolted
  const strapT = COLLECTOR_STRAP.thickness;
  const strapList: THREE.BufferGeometry[] = [];
  const boltList: THREE.BufferGeometry[] = [];
  for (const x of COLLECTOR_STRAP.xs) {
    const w = COLLECTOR_STRAP.width / 2;
    const end = lipS - COLLECTOR_STRAP.down;
    const band: P2[] = [
      [lipS + RAIL.lipThickness + 0.012, RAIL.lipTop - 0.012],
      [lipS + RAIL.lipThickness + 0.012, RAIL.lipTop + strapT],
      [lipS - strapT, RAIL.lipTop + strapT],
      [lipS - strapT, strapT],
      [end, strapT],
      [end, 0],
      [lipS - strapT * 2, 0],
      [lipS - strapT * 2, RAIL.lipTop],
      [lipS, RAIL.lipTop],
      [lipS + RAIL.lipThickness + 0.012 - strapT, RAIL.lipTop],
      [lipS + RAIL.lipThickness + 0.012 - strapT, RAIL.lipTop - 0.012],
    ];
    strapList.push(acrossSlope(band, x - w, x + w));
    // a coach bolt through the strap's foot, into the rafter
    const bs = end + 0.02;
    boltList.push(rod(fromRoof(x, 0, bs), fromRoof(x, 0.009, bs), 0.009, 6));
  }
  mesh(parts['collector-strap'], mergeAll(strapList), look.zinc);
  mesh(parts['collector-strap'], mergeAll(boltList), look.steel);

  // ---- the spacers: a pressed bracket on the roof's plane. The collector's top end stands on its foot and against its post; the tank's case lies in its arc: this is what sets y near zero
  const arc: P2[] = [];
  const steps = 6;
  const n0 = 0.058;
  const n1 = 0.135;
  for (let i = 0; i <= steps; i++) {
    const n = n1 + ((n0 - n1) * i) / steps;
    arc.push([caseS(n, -1), n]);
  }
  const post = COLLECTOR.length + 0.004;
  const spacerProfile: P2[] = [
    [SPACER.from, 0],
    [caseS(n0, -1) + 0.006, 0],
    [caseS(n0, -1) + 0.006, n0],
    ...arc.slice().reverse(),
    [post, n1],
    [post, BANK.standoff],
    [SPACER.from, BANK.standoff],
  ];
  mesh(
    parts['tank-spacer'],
    mergeAll(SPACER_XS.map((x) => acrossSlope(spacerProfile, x - SPACER.width / 2, x + SPACER.width / 2))),
    look.zinc,
  );

  // ---- what moves with the tank
  const carrier = group('carrier');
  parts['storage-tank'].add(carrier);
  const strapCarrier = group('strap-carrier');
  parts['tank-strap'].add(strapCarrier);
  const reservoirCarrier = group('reservoir-carrier');
  parts['overflow-reservoir'].add(reservoirCarrier);
  const carriers = [carrier, strapCarrier, reservoirCarrier];

  const tank = buildTank(look);
  tank.root.position.copy(fromRoof(0, TANK.centreN, TANK.centreS));
  tank.root.rotation.x = -TILT;
  carrier.add(tank.root);
  const tankToBodyAtHome = (p: THREE.Vector3) => {
    // the tank's frame is the roof's turned back by the pitch
    const y = p.y * COS + p.z * SIN;
    const z = -p.y * SIN + p.z * COS;
    return new THREE.Vector3(p.x, TANK.centreN + y, -TANK.centreS + z);
  };

  // the tank's saddle feet: on the batten at 2.05 m and the rear one, the case lies in their arc
  const footProfile: P2[] = [];
  footProfile.push([RAIL.toFoot, 0], [TANK.rearFootS, 0]);
  const footSteps = 10;
  for (let i = 0; i <= footSteps; i++) {
    const s = TANK.rearFootS + ((RAIL.toFoot - TANK.rearFootS) * i) / footSteps;
    const ds = s - TANK.centreS;
    footProfile.push([s, TANK.centreN - Math.sqrt(TANK.caseR * TANK.caseR - ds * ds)]);
  }
  mesh(
    carrier,
    mergeAll(TANK.footXs.map((x) => acrossSlope(footProfile, x - TANK.footWidth / 2, x + TANK.footWidth / 2))),
    look.zinc,
  );

  // the union nuts on the tank's two ports: the pipes end in them
  const portH = tankToBodyAtHome(new THREE.Vector3(-TANK.portX, TANK.portY, 0));
  const portC = tankToBodyAtHome(new THREE.Vector3(TANK.portX, TANK.portY, 0));
  const nut = (at: THREE.Vector3, sign: number, parent: THREE.Object3D) => {
    mesh(parent, hexX(0.019, at.x - sign * 0.018, at.x + sign * 0.002, at.y, at.z), look.brass);
  };
  nut(portH, 1, carrier);
  nut(portC, -1, carrier);

  // the booster's supply: grey flex from the gland on the hatch, round the left end, to a small box on the rear batten, where the house's line takes over
  const gland = tankToBodyAtHome(new THREE.Vector3(-(TANK_DRUM_HALF + TANK.capDepth + 0.006), -0.05, 0));
  const boxAt = fromRoof(-1.03, 0, 2.4);
  const flexPath = rounded(
    [
      gland,
      gland.clone().add(new THREE.Vector3(-0.03, 0, 0)),
      fromRoof(-1.19, 0.16, 2.3),
      fromRoof(-1.19, 0.05, 2.42),
      fromRoof(-1.07, 0.03, 2.42),
      fromRoof(-1.05, 0.03, 2.41),
    ],
    0.03,
  );
  mesh(carrier, tubeThrough(flexPath, 0.006, 8), look.flex);
  mesh(carrier, box(-1.06, -1.0, 0, 0.05, boxAt.z - 0.035, boxAt.z + 0.035), look.terminal);
  mesh(
    carrier,
    rod(
      gland.clone().add(new THREE.Vector3(-0.012, 0, 0)),
      gland.clone().add(new THREE.Vector3(0.004, 0, 0)),
      0.012,
      6,
    ),
    look.brass,
  );

  // ---- the tank's straps: bands over the case, each foot bolted down
  const bandR = TANK.caseR + 0.0015;
  const bandOuter: P2[] = [];
  const bandInner: P2[] = [];
  const nFoot = 0;
  const steps2 = 26;
  const a0 = -0.33;
  const a1 = Math.PI + 0.33;
  for (let i = 0; i <= steps2; i++) {
    const a = a0 + ((a1 - a0) * i) / steps2;
    bandOuter.push([
      TANK.centreS + (bandR + TANK.strapThickness) * Math.cos(a),
      TANK.centreN + (bandR + TANK.strapThickness) * Math.sin(a),
    ]);
    bandInner.push([TANK.centreS + bandR * Math.cos(a), TANK.centreN + bandR * Math.sin(a)]);
  }
  const sBack = TANK.centreS + bandR * Math.cos(a0);
  const sFront = TANK.centreS + bandR * Math.cos(a1);
  const footLen = 0.05;
  const strapProfile: P2[] = [
    [sBack + footLen, nFoot],
    [sBack + footLen, nFoot + 0.002],
    [sBack + 0.006, nFoot + 0.002],
    ...bandOuter,
    [sFront - 0.006, nFoot + 0.002],
    [sFront - footLen, nFoot + 0.002],
    [sFront - footLen, nFoot],
    [sFront + 0.002, nFoot],
    ...bandInner.slice().reverse(),
    [sBack - 0.002, nFoot],
  ];
  const tankBolts: THREE.BufferGeometry[] = [];
  mesh(
    strapCarrier,
    mergeAll(
      TANK.strapXs.map((x) => {
        for (const s of [sBack + footLen * 0.6, sFront - footLen * 0.6])
          tankBolts.push(rod(fromRoof(x, 0, s), fromRoof(x, 0.012, s), 0.011, 6));
        return acrossSlope(strapProfile, x - TANK.strapWidth / 2, x + TANK.strapWidth / 2);
      }),
    ),
    look.zinc,
  );
  mesh(strapCarrier, mergeAll(tankBolts), look.steel);

  // ---- the fill assembly, at the bottom left: a tee on the header, a valve with its cap, its stem towards the sky
  const stubX = BANK_WIDTH / 2 + COLLECTOR.stub;
  const yLow = HEADER_N;
  const zLow = -LOWER_HEADER_S;
  const fx = -stubX;
  mesh(
    parts['fill-port'],
    mergeAll([
      hexX(0.021, fx - 0.016, fx + 0.002, yLow, zLow),
      cylX(0.0135, fx - FITTING.fillLength, fx - 0.012, yLow, zLow, 14),
      hexX(0.0165, fx - FITTING.fillLength - 0.014, fx - FITTING.fillLength, yLow, zLow),
      rod(new THREE.Vector3(fx - 0.042, yLow, zLow), new THREE.Vector3(fx - 0.042, yLow + 0.03, zLow), 0.012, 12),
    ]),
    look.brass,
  );
  mesh(
    parts['fill-port'],
    box(fx - 0.042 - 0.026, fx - 0.042 + 0.006, yLow + 0.03, yLow + 0.036, zLow - 0.006, zLow + 0.006),
    look.seal,
  );

  // ---- the plug at the top right
  const yTop = HEADER_N;
  const zTop = -UPPER_HEADER_S;
  mesh(
    parts['top-plug'],
    mergeAll([
      hexX(0.021, stubX - 0.002, stubX + 0.012, yTop, zTop),
      cylX(0.015, stubX + 0.012, stubX + FITTING.plugLength, yTop, zTop, 16),
    ]),
    look.brass,
  );

  // ---- the overheat valve, on the hot outlet: a brass body on the header's end, its pipe leaves from it
  const ovX0 = -stubX + 0.002;
  const ovX1 = ovX0 - FITTING.overheatLength;
  mesh(
    parts['overheat-valve'],
    mergeAll([
      cylX(FITTING.overheatR, ovX1, ovX0, yTop, zTop, 18),
      hexX(0.02, ovX1 - 0.014, ovX1 + 0.002, yTop, zTop),
      hexX(0.021, ovX0 - 0.002, ovX0 + 0.016, yTop, zTop),
      rod(
        new THREE.Vector3((ovX0 + ovX1) / 2, yTop, zTop),
        new THREE.Vector3((ovX0 + ovX1) / 2, yTop + 0.042, zTop),
        0.012,
        12,
      ),
    ]),
    look.brass,
  );
  const hotStart = new THREE.Vector3(ovX1 - 0.012, yTop, zTop);

  // ---- the circuit's reservoir, on top of the tank: its thin line from the jacket's valve round the left cap
  const resY = TANK.caseR + 0.012 + FITTING.reservoirR;
  const resX0 = -0.82;
  const resX1 = resX0 + FITTING.reservoirLength;
  const toB = (x: number, y: number, z: number) => tankToBodyAtHome(new THREE.Vector3(x, y, z));
  const resAxisA = toB(resX0, resY, 0);
  const resAxisB = toB(resX1, resY, 0);
  mesh(reservoirCarrier, rod(resAxisA, resAxisB, FITTING.reservoirR, 22), look.reservoir);
  for (const x of [resX0, resX1]) {
    // rounded ends
    const dome = new THREE.SphereGeometry(FITTING.reservoirR, 18, 10);
    dome.scale(0.45, 1, 1);
    const c = toB(x, resY, 0);
    dome.translate(c.x, c.y, c.z);
    mesh(reservoirCarrier, dome, look.reservoir);
  }
  // two saddles on the case, under it
  for (const x of [resX0 + 0.05, resX1 - 0.05]) {
    const c = new THREE.BoxGeometry(0.028, 0.026, 0.09);
    c.rotateX(-TILT);
    const at = toB(x, TANK.caseR + 0.01, 0);
    c.translate(at.x, at.y, at.z);
    mesh(reservoirCarrier, c, look.zinc);
  }
  const reliefTop = toB(-(TANK_DRUM_HALF + 0.0425 + 0.024), -0.107, 0.05);
  const resLine = rounded(
    [
      reliefTop,
      toB(-1.187, -0.05, 0.06),
      toB(-1.187, 0.12, 0.08),
      toB(-1.11, 0.26, 0.08),
      toB(-0.98, 0.315, 0.04),
      toB(resX0 - FITTING.reservoirR * 0.3, resY, 0),
    ],
    0.04,
  );
  mesh(reservoirCarrier, tubeThrough(resLine, 0.0045, 8), look.copper);

  // ---- the two pipes: rebuilt when the tank moves. They stay parts of their own, so that isolate and the exploded view take them along
  const hotMesh = mesh(parts['hot-pipe'], new THREE.BufferGeometry(), look.copper);
  const coldMesh = mesh(parts['cold-pipe'], new THREE.BufferGeometry(), look.copper);
  hotMesh.userData.dynamic = true;
  coldMesh.userData.dynamic = true;
  // its union on the lower header, and three clips that hold the run to the tray's side, which stay only at the machine's own place
  const coldEnd = new THREE.Vector3(stubX, HEADER_N, zLow);
  mesh(parts['cold-pipe'], hexX(0.021, stubX - 0.002, stubX + 0.016, HEADER_N, zLow), look.brass);
  const clips = group('clips');
  clips.userData.dynamic = true; // it goes when the tank leaves its place: merging must not take its mesh out of it
  parts['cold-pipe'].add(clips);
  const clipX = PIPE.coldRunX;
  const clipList: THREE.BufferGeometry[] = [];
  for (const s of [0.5, 1.0, 1.5]) {
    clipList.push(
      box(BANK_WIDTH / 2, clipX + PIPE.r + 0.002, HEADER_N - 0.016, HEADER_N - 0.012, -s - 0.012, -s + 0.012),
    );
    clipList.push(
      box(clipX + PIPE.r, clipX + PIPE.r + 0.002, HEADER_N - 0.016, HEADER_N + PIPE.r, -s - 0.012, -s + 0.012),
    );
    clipList.push(
      box(
        clipX - PIPE.r - 0.002,
        clipX + PIPE.r + 0.002,
        HEADER_N + PIPE.r,
        HEADER_N + PIPE.r + 0.002,
        -s - 0.012,
        -s + 0.012,
      ),
    );
  }
  mesh(clips, mergeAll(clipList), look.zinc);

  // ---- two switches of the panel: a light swing valve on the cold pipe, foam sleeves on both. Rebuilt with the pipes, whether shown or not, so that a part's box never holds an empty mesh;
  // each in a group of its own: the registry sets its meshes visible, the group decides
  const holder = (id: UnitPart, name: string) => {
    const g = group(name);
    g.userData.dynamic = true;
    g.visible = false;
    parts[id].add(g);
    return g;
  };
  const valveGroup = holder('cold-pipe', 'one-way-valve');
  const hotSleeveGroup = holder('hot-pipe', 'hot-sleeve');
  const coldSleeveGroup = holder('cold-pipe', 'cold-sleeve');
  const foam = new THREE.MeshStandardMaterial({ color: 0x2d2f31, roughness: 0.92, name: 'sleeve' });
  const oneWay = mesh(valveGroup, new THREE.BufferGeometry(), look.brass);
  const hotSleeve = mesh(hotSleeveGroup, new THREE.BufferGeometry(), foam);
  const coldSleeve = mesh(coldSleeveGroup, new THREE.BufferGeometry(), foam);
  const flags = { valve: false, sleeves: false };
  const rebuildExtras = () => {
    valveGroup.visible = flags.valve;
    hotSleeveGroup.visible = flags.sleeves;
    coldSleeveGroup.visible = flags.sleeves;
    hotSleeve.geometry.dispose();
    coldSleeve.geometry.dispose();
    oneWay.geometry.dispose();
    // a sleeve stops short of each fitting
    hotSleeve.geometry = tubeThrough(unit.hotPath.slice(1, -1), PIPE.r + 0.013);
    coldSleeve.geometry = tubeThrough(unit.coldPath.slice(1, -1), PIPE.r + 0.013);
    // the valve on the long run, a third of the way down: on the pipe's own axis
    const at = pointAlong(unit.coldPath, 0.32);
    const dir = pointAlong(unit.coldPath, 0.34).sub(at).normalize();
    oneWay.geometry = rod(at.clone().addScaledVector(dir, -0.04), at.clone().addScaledVector(dir, 0.04), 0.024, 14);
  };

  // ---- pose
  const rot = new THREE.Quaternion()
    .setFromEuler(new THREE.Euler(TILT, 0, 0))
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), RAIL_ANGLE));
  const rotInv = rot.clone().invert();
  const dirToBody = (v: THREE.Vector3) => v.clone().applyQuaternion(rotInv);
  const U = dirToBody(new THREE.Vector3(0, 1, 0));
  const Zw = dirToBody(new THREE.Vector3(0, 0, 1));
  const X = dirToBody(new THREE.Vector3(1, 0, 0));

  const pose = { side: 0, up: 0 };
  const offset = new THREE.Vector3();
  const unit: RoofUnit = {
    root,
    body,
    parts,
    collectors: { left, right },
    tank,
    carrier,
    carriers: { 'storage-tank': carrier, 'tank-strap': strapCarrier, 'overflow-reservoir': reservoirCarrier },
    pose,
    coldPath: [],
    hotPath: [],
    setPose(side, up) {
      pose.side = side;
      pose.up = up;
      offset.set(0, 0, 0).addScaledVector(X, side).addScaledVector(U, up);
      for (const c of carriers) c.position.copy(offset);
      clips.visible = side < 1e-3;

      // the hot pipe, from the valve on the upper header
      const hotPort = portH.clone().add(offset);
      const hotOut = hotPort.clone().addScaledVector(X, -0.025);
      const a1 = new THREE.Vector3(-1.125, HEADER_N, zTop);
      const hot: THREE.Vector3[] = [hotStart, a1];
      if (side < 1e-3) {
        // straight down from the port towards the header's height, but never into the roof
        const rise = Math.min(hotOut.clone().sub(a1).dot(U), (hotOut.y - CLEAR_N) / U.y);
        hot.push(hotOut.clone().addScaledVector(U, -rise), hotOut, hotPort);
      } else {
        const toRow = hotPort.clone().sub(a1).dot(Zw);
        const r0 = a1.clone().addScaledVector(U, 0.095).addScaledVector(Zw, toRow);
        const r1 = r0.clone().addScaledVector(X, hotOut.clone().sub(r0).dot(X));
        hot.push(r0, r1, hotOut, hotPort);
      }
      unit.hotPath = rounded(hot, PIPE.bend);

      // the cold pipe, from the tank's right port to the lower header
      const coldPort = portC.clone().add(offset);
      const coldOut = coldPort.clone().addScaledVector(X, 0.025);
      const t = new THREE.Vector3(PIPE.coldRunX, HEADER_N, zLow);
      const cold: THREE.Vector3[] = [coldPort, coldOut];
      if (side < 1e-3) {
        const s = new THREE.Vector3(PIPE.coldRunX, HEADER_N, -1.92);
        const drop = Math.min(coldOut.clone().sub(s).dot(U), (coldOut.y - CLEAR_N) / U.y);
        cold.push(coldOut.clone().addScaledVector(U, -drop), s, t, coldEnd);
      } else {
        const low = coldOut.clone().addScaledVector(U, -0.07);
        const back = low.clone().addScaledVector(Zw, -0.15);
        const run = back.clone().addScaledVector(X, PIPE.coldRunX - back.x);
        cold.push(low, back, run, t, coldEnd);
      }
      unit.coldPath = rounded(cold, PIPE.bend);

      hotMesh.geometry.dispose();
      coldMesh.geometry.dispose();
      hotMesh.geometry = tubeThrough(unit.hotPath, PIPE.r);
      coldMesh.geometry = tubeThrough(unit.coldPath, PIPE.r);
      rebuildExtras();
    },
    setExtras(valve, sleeves) {
      if (valve === flags.valve && sleeves === flags.sleeves) return;
      flags.valve = valve;
      flags.sleeves = sleeves;
      rebuildExtras();
    },
    extras: { valve: valveGroup, hotSleeve: hotSleeveGroup, coldSleeve: coldSleeveGroup },
    ends() {
      return {
        hotHeader: new THREE.Vector3(-stubX, HEADER_N, zTop),
        hotPort: portH.clone().add(offset),
        coldPort: portC.clone().add(offset),
        coldHeader: coldEnd.clone(),
      };
    },
    tankToBody(p) {
      return tankToBodyAtHome(p).add(offset);
    },
    dirToBody,
  };
  unit.setPose(0, 0);
  return unit;
}
