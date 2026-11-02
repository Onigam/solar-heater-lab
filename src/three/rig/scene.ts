import * as THREE from 'three';
import { applyWear, contactShadow, damp, GHOST, group, PartRegistry } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { SolarParams, SolarState } from '../../sim/types';
import {
  AT_HOME,
  BANK,
  BANK_WIDTH,
  COLLECTOR,
  COLLECTOR_X,
  COS,
  HEADER_N,
  LOWER_HEADER_S,
  PIPE,
  RAFTER_XS,
  RAIL,
  RIG,
  RIG_FOOT_Y,
  SIN,
  STAND_SIDEWAYS,
  TANK,
  TILT,
  UPPER_HEADER_S,
} from '../dims';
import { dotSpeed, FlowDots, stretch } from '../flows';
import { machineLook } from '../machine/look';
import { box, mergeAll, rod } from '../machine/shapes';
import { riserX } from '../machine/collector';
import { buildRoofUnit, UNIT_PARTS, type RoofUnit, type UnitPart } from '../machine/unit';
import { mergeStatic } from '../merge';
import { partName } from '../part-ids';
import { anchor, hotspots, paperFloor, partsNow, viewFrom, workshopScene, type HotspotDef } from '../world';

// The `rig` world: the machine alone, on a section of the same roof, the bench that carries it on the paper. The one slider that moves the 3D is the tank's height: at y = 0 the tank is where the
// maker's drawing puts it and the stand is away; above, it goes up on the translucent stand, below, it goes down beside the bank (research §0.4), the pipes re-routed. « Flux » is the star here:
// the drops of the model, the risers among them, at their true speed.

const BENCH_KEY = 'rig';

/** Explode offsets, in the roof's frame: X across, Y out of the roof, Z down the slope. The tank lifts off along the roof's normal and back, what held it on its own line; nothing crosses a part. */
export const EXPLODE: Record<UnitPart | 'test-stand', [number, number, number]> = {
  'collector-left': [-0.75, 0.42, 0],
  'collector-right': [0.75, 0.42, 0],
  'collector-link': [0, 0.86, 0],
  'storage-tank': [0, 1.05, -0.82],
  'hot-pipe': [-1.18, 0.8, -0.3],
  'cold-pipe': [1.75, 0.72, -0.1],
  'collector-rail': [0, 0.1, 0.5],
  'collector-strap': [0, 0.22, 0.86],
  'tank-spacer': [0, 0.42, -0.34],
  'tank-strap': [0, 1.85, -0.82],
  'fill-port': [-1.72, 0.42, 0.26],
  'top-plug': [1.72, 0.42, -0.2],
  'overheat-valve': [-1.32, 0.42, -0.2],
  'overflow-reservoir': [0, 1.6, -1.34],
  'test-stand': [0, 0, 0],
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'storage-tank', ...partName('storage-tank') },
  { id: 'collector-left', ...partName('collector-left') },
  { id: 'collector-right', ...partName('collector-right') },
  { id: 'hot-pipe', ...partName('hot-pipe') },
  { id: 'cold-pipe', ...partName('cold-pipe') },
  { id: 'collector-rail', ...partName('collector-rail'), minor: true },
  { id: 'collector-link', ...partName('collector-link'), minor: true },
  { id: 'collector-strap', ...partName('collector-strap'), minor: true },
  { id: 'tank-spacer', ...partName('tank-spacer'), minor: true },
  { id: 'tank-strap', ...partName('tank-strap'), minor: true },
  { id: 'fill-port', ...partName('fill-port'), minor: true },
  { id: 'top-plug', ...partName('top-plug'), minor: true },
  { id: 'overheat-valve', ...partName('overheat-valve'), minor: true },
  { id: 'overflow-reservoir', ...partName('overflow-reservoir'), minor: true },
  { id: 'test-stand', ...partName('test-stand'), minor: true },
];

/** A point of the roof's frame, in the world of this rig. */
const onRig = (x: number, n: number, s: number) =>
  new THREE.Vector3(x, RIG_FOOT_Y + s * SIN + n * COS, n * SIN - s * COS);
const zone = (a: THREE.Vector3, b: THREE.Vector3, grow = 0.02): THREE.Box3 =>
  new THREE.Box3().setFromPoints([a, b]).expandByScalar(grow);

/**
 * Where to look at a part from when it is selected (kit 0.6.0). A part spread along the whole machine is framed on one of its pieces, so that it can be read: one strap, one spacer, the rail's end. The direction: around what hides it.
 */
const FRAMING: Partial<Record<UnitPart | 'test-stand', PartFraming>> = {
  'hot-pipe': { viewDir: viewFrom(25, -55) },
  'overheat-valve': { viewDir: viewFrom(30, -62) },
  'fill-port': { viewDir: viewFrom(32, -40) },
  'top-plug': { viewDir: viewFrom(38, 58) },
  'collector-link': {
    viewDir: viewFrom(58, 10),
    frame: zone(onRig(-0.06, 0.04, UPPER_HEADER_S), onRig(0.06, 0.1, UPPER_HEADER_S)),
  },
  'collector-rail': { viewDir: viewFrom(24, -24), frame: zone(onRig(-1.08, 0, -0.03), onRig(-0.62, 0.07, 0.05)) },
  'collector-strap': { viewDir: viewFrom(30, -24), frame: zone(onRig(-1.02, 0, -0.24), onRig(-0.78, 0.07, 0.03)) },
  'tank-spacer': { viewDir: viewFrom(66, -14), frame: zone(onRig(-0.96, 0, 1.84), onRig(-0.72, 0.15, 2.12)) },
  'tank-strap': { viewDir: viewFrom(28, -32), frame: zone(onRig(-1.0, 0, 1.92), onRig(-0.8, 0.55, 2.56)) },
  'overflow-reservoir': { viewDir: viewFrom(45, -42) },
  'cold-pipe': { viewDir: viewFrom(38, 60) },
};

export interface RigScene extends SceneModule<SolarState> {
  unit: RoofUnit;
  flows: FlowDots;
  /** The risers' dots, finer. */
  fine: FlowDots;
  bench: THREE.Group;
  stand: TestStand;
  /** Put the tank at this height at once: the tests, and a world entered with the slider already moved. */
  snap(y: number): void;
  /** Where the tank is drawn, relative to its home: sideways, up. */
  drawn(): { side: number; up: number };
}

/** The bench: a piece of the same roof, rafters and battens, on posts. Scenery: it goes when a part is isolated. */
function buildBench(wood: THREE.Material, batten: THREE.Material): THREE.Group {
  const bench = group('bench');
  const roof = group('bench-roof');
  roof.position.set(0, RIG_FOOT_Y, 0);
  roof.rotation.x = TILT;
  bench.add(roof);
  const rafters: THREE.BufferGeometry[] = [];
  const nTop = -RIG.battenH;
  for (const x of RAFTER_XS)
    rafters.push(
      box(x - RIG.rafterW / 2, x + RIG.rafterW / 2, nTop - RIG.rafterH, nTop, -RIG.rafterTo, -RIG.rafterFrom),
    );
  const rm = new THREE.Mesh(mergeAll(rafters), wood);
  rm.castShadow = rm.receiveShadow = true;
  roof.add(rm);
  const half = BANK_WIDTH / 2 + 0.028;
  const bars = RIG.battenS.map((s) => box(-half, half, nTop, 0, -s - RIG.battenW / 2, -s + RIG.battenW / 2));
  const bm = new THREE.Mesh(mergeAll(bars), batten);
  bm.castShadow = bm.receiveShadow = true;
  roof.add(bm);
  // posts under the outer rafters, the rail of each pair, a brace between them: each post reaches the floor and a rafter
  const under = nTop - RIG.rafterH;
  const worldY = (s: number, n: number) => RIG_FOOT_Y + s * SIN + n * COS;
  const worldZ = (s: number, n: number) => n * SIN - s * COS;
  const posts: THREE.BufferGeometry[] = [];
  const P = RIG.postW;
  const contact: { x: number; z: number }[] = [];
  for (const s of RIG.postS) {
    const top = worldY(s, under);
    const z = worldZ(s, under);
    for (const x of [RAFTER_XS[0], RAFTER_XS[3]]) {
      posts.push(box(x - P / 2, x + P / 2, 0, top + 0.03, z - P / 2, z + P / 2));
      // a cleat that carries the rafter on the post
      contact.push({ x, z });
    }
    // the cross beam under the rafters
    posts.push(box(RAFTER_XS[0] - P / 2, RAFTER_XS[3] + P / 2, top - 0.1, top - 0.02, z + P / 2, z + P / 2 + 0.05));
    posts.push(box(RAFTER_XS[0] - P / 2, RAFTER_XS[3] + P / 2, 0.28, 0.36, z + P / 2, z + P / 2 + 0.05));
  }
  const [s0, s1] = RIG.postS;
  for (const x of [RAFTER_XS[0], RAFTER_XS[3]]) {
    const z0 = worldZ(s0, under);
    const z1 = worldZ(s1, under);
    const y0 = 0.32;
    const y1 = worldY(s1, under) - 0.2;
    const side = x < 0 ? -P / 2 - 0.02 : P / 2 + 0.02;
    posts.push(rod(new THREE.Vector3(x + side, y0, z0), new THREE.Vector3(x + side, y1, z1), 0.022, 8));
  }
  const pm = new THREE.Mesh(mergeAll(posts), wood);
  pm.castShadow = pm.receiveShadow = true;
  bench.add(pm);
  for (const c of contact) {
    const sh = contactShadow(P, P, 0.14, 0.42);
    sh.position.set(c.x, 0.002, c.z);
    bench.add(sh);
  }
  return bench;
}

/** The stand: translucent, not part of the machine. Two battens of the same roof under the tank's feet, on four legs; a graduated staff whose zero is the collector's top, in copper, which stays: it is what the part is when the tank is home. */
class TestStand {
  readonly root = group('test-stand');
  /** What shows only when the tank has left its place. A hidden part still counts in a world's overview: at home this group is folded to a point at the staff's foot. */
  private readonly away = group('stand-away');
  private readonly cradle = group('stand-cradle');
  private readonly legs: THREE.Mesh[] = [];
  private readonly sills = group('stand-sills');
  /** The staff's upper section, folded the same way until the tank climbs past the lower. */
  private readonly upper = group('staff-upper');
  readonly level: THREE.Mesh;
  readonly topY = RIG_FOOT_Y + COLLECTOR.length * SIN + (BANK.standoff + COLLECTOR.depth) * COS;
  readonly staffH = this.topY + 0.75;
  readonly staffX = -BANK_WIDTH / 2 - 0.42;
  readonly staffZ = -COLLECTOR.length * COS;
  private static readonly LEG_X = 1.13;
  private readonly battenS = [RAIL.toFoot, TANK.rearFootS];

  constructor(look: ReturnType<typeof machineLook>) {
    this.root.add(this.away);
    this.away.add(this.cradle, this.sills);
    // the cradle's frame is the roof's: the tank's feet find the same plane
    this.cradle.rotation.x = TILT;
    const half = TestStand.LEG_X + 0.03;
    const glassy = (m: THREE.Mesh) => {
      m.userData.noShadow = true;
      m.castShadow = false;
      return m;
    };
    this.cradle.add(
      glassy(
        new THREE.Mesh(
          mergeAll(this.battenS.map((s) => box(-half, half, -RIG.battenH, 0, -s - 0.02, -s + 0.02))),
          look.stand,
        ),
      ),
    );
    const unit = new THREE.BoxGeometry(0.036, 1, 0.036);
    unit.translate(0, 0.5, 0);
    for (let i = 0; i < 4; i++) {
      const leg = glassy(new THREE.Mesh(unit, look.stand));
      this.legs.push(leg);
      this.away.add(leg);
    }
    // the sills on the floor, joining the legs two by two
    this.sills.add(
      glassy(
        new THREE.Mesh(
          mergeAll(this.battenS.map((s) => box(-half, half, 0, 0.05, -s * COS - 0.02, -s * COS + 0.02))),
          look.stand,
        ),
      ),
    );

    const x = this.staffX;
    const z = this.staffZ;
    const ticks = (y0: number, y1: number, dy: number): THREE.BufferGeometry => {
      const list: THREE.BufferGeometry[] = [];
      for (let k = -24; k <= 40; k++) {
        const y = this.topY + k * 0.1;
        if (y < y0 + 0.02 || y > y1 - 0.01) continue;
        const w = k % 5 === 0 ? 0.05 : 0.032;
        list.push(box(x + 0.015, x + 0.015 + w, y - dy - 0.004, y - dy + 0.004, z - 0.008, z + 0.008));
      }
      return mergeAll(list);
    };
    const staff = new THREE.Mesh(box(x - 0.015, x + 0.015, 0, this.staffH, z - 0.015, z + 0.015), look.stand);
    const marks = new THREE.Mesh(ticks(0, this.staffH, 0), look.standSolid);
    const base = new THREE.Mesh(box(x - 0.11, x + 0.11, 0, 0.018, z - 0.11, z + 0.11), look.standSolid);
    base.castShadow = true;
    // zero: the collector's top, in copper
    const zero = new THREE.Mesh(
      box(x - 0.022, x + 0.075, this.topY - 0.006, this.topY + 0.006, z - 0.022, z + 0.022),
      look.level,
    );
    this.root.add(glassy(staff), marks, base, zero);
    this.upper.position.y = this.staffH;
    this.upper.add(glassy(new THREE.Mesh(box(x - 0.012, x + 0.012, -0.12, 1.72, z - 0.012, z + 0.012), look.stand)));
    this.upper.add(new THREE.Mesh(ticks(this.staffH, this.staffH + 1.72, this.staffH), look.standSolid));
    this.root.add(this.upper);
    // a level line from the zero across the bank, shown when the tank has left
    this.level = new THREE.Mesh(
      box(x, BANK_WIDTH / 2 + 3.7, this.topY - 0.003, this.topY + 0.003, z - 0.003, z + 0.003),
      look.level,
    );
    this.level.userData.noShadow = true;
    this.away.add(this.level);
  }

  /** The tank has gone `side` sideways and `up` up from home, the slider says `y`. */
  update(side: number, up: number, y: number): void {
    const moved = Math.abs(y) > AT_HOME || Math.abs(up) > AT_HOME || side > 0.01;
    if (moved) {
      this.away.position.set(0, 0, 0);
      this.away.scale.setScalar(1);
    } else {
      this.away.position.set(this.staffX, 0, this.staffZ);
      this.away.scale.setScalar(1e-4);
    }
    this.away.visible = moved;
    this.upper.scale.y = up > 0.3 ? 1 : 1e-4;
    this.upper.visible = up > 0.3;
    if (!moved) return;
    this.cradle.position.set(side, RIG_FOOT_Y + up, 0);
    let i = 0;
    for (const s of this.battenS) {
      const n = -RIG.battenH;
      const top = RIG_FOOT_Y + s * SIN + n * COS + up;
      const z = n * SIN - s * COS;
      for (const sx of [-1, 1]) {
        const leg = this.legs[i++];
        leg.position.set(side + sx * TestStand.LEG_X, 0, z);
        leg.scale.y = Math.max(0.05, top);
      }
    }
    this.sills.position.x = side;
  }
}

export function createRigScene(params: () => SolarParams): RigScene {
  const scene = workshopScene({
    name: 'rig',
    key: [-5.5, 11, 8],
    target: [0.3, 1.4, -1],
    shadowHalf: 9,
    shadowFar: 34,
  });
  const look = machineLook();
  const floor = paperFloor(22);
  scene.add(floor);
  const wood = new THREE.MeshStandardMaterial({ color: 0xa98f6c, roughness: 0.86, name: 'bench-wood' });
  const batten = new THREE.MeshStandardMaterial({ color: 0x8e7656, roughness: 0.88, name: 'bench-batten' });
  const bench = buildBench(wood, batten);
  mergeStatic(bench, { bakeKey: BENCH_KEY });
  applyWear(bench, 30);
  scene.add(bench);

  const unit = buildRoofUnit(look);
  unit.root.position.set(0, RIG_FOOT_Y, 0);
  scene.add(unit.root);
  const stand = new TestStand(look);
  scene.add(stand.root);

  // ---- anchors, on the parts, so that they follow the exploded view. A label reads to the right of its dot
  const anchors: Record<string, THREE.Object3D> = {};
  const P = unit.parts;
  const n = HEADER_N;
  const at = (id: UnitPart, p: THREE.Vector3, parent: THREE.Object3D = P[id]) => {
    anchors[id] = anchor(parent, p.x, p.y, p.z, `${id}-label`);
  };
  const s0 = LOWER_HEADER_S;
  const s1 = UPPER_HEADER_S;
  const v = (x: number, nn: number, s: number) => new THREE.Vector3(x, nn, -s);
  at('storage-tank', unit.tankToBody(new THREE.Vector3(-0.15, TANK.caseR, 0.08)), unit.carrier);
  at('collector-left', v(-0.56, 0.11, 1.12));
  at('collector-right', v(0.42, 0.11, 0.62));
  at('hot-pipe', v(-1.17, 0.085, 2.0));
  at('cold-pipe', v(1.09, n + 0.012, 1.36));
  at('collector-rail', v(-0.1, 0.06, -0.022));
  at('collector-link', v(0, 0.09, s1));
  at('collector-strap', v(0.3, 0.012, -0.13));
  at('tank-spacer', v(-0.842, 0.14, 1.98));
  at(
    'tank-strap',
    unit.tankToBody(new THREE.Vector3(0.9, TANK.caseR * 0.72, TANK.caseR * 0.72)),
    P['tank-strap'].children[0],
  );
  at('fill-port', v(-1.13, n + 0.03, s0));
  at('top-plug', v(1.08, n + 0.02, s1));
  at('overheat-valve', v(-1.09, n + 0.045, s1));
  at(
    'overflow-reservoir',
    unit.tankToBody(new THREE.Vector3(-0.68, TANK.caseR + 0.12, 0.04)),
    P['overflow-reservoir'].children[0],
  );
  anchors['test-stand'] = anchor(stand.root, stand.staffX, stand.topY + 0.5, stand.staffZ, 'test-stand-label');

  // ---- merge what stands still, per part, before registering
  for (const id of UNIT_PARTS) {
    // what rides with the tank merges inside its carrier: the slider moves the carrier
    const carrier = (unit.carriers as Partial<Record<UnitPart, THREE.Group>>)[id];
    mergeStatic(carrier ?? P[id], { bakeKey: BENCH_KEY });
  }
  applyWear(unit.root, 26, (m) => (m.material as THREE.Material).name === 'plate');

  const registry = new PartRegistry();
  for (const id of UNIT_PARTS) registry.add(id, P[id], new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  registry.add('test-stand', stand.root, new THREE.Vector3(...EXPLODE['test-stand']), undefined, {
    frame: new THREE.Box3(
      new THREE.Vector3(stand.staffX - 0.2, 0, stand.staffZ - 0.2),
      new THREE.Vector3(stand.staffX + 0.2, stand.staffH, stand.staffZ + 0.2),
    ),
  });
  // the stand keeps its own cast off: it is glass to the eye and to the sun
  for (const m of registry.get('test-stand')!.meshes) m.castShadow = false;

  // ---- the flows: the whole circuit. Every stretch runs in the direction of the day's flow; the ratios are the sections' (the pipe's speed is the state's)
  const flows = new FlowDots(150, 0.052);
  const fine = new FlowDots(280, 0.026);
  unit.body.add(flows.object, fine.object);
  const Apipe = Math.PI * (PIPE.bore / 2) ** 2;
  const Ariser = Math.PI * (COLLECTOR.riserBore / 2) ** 2;
  const Aheader = Math.PI * (COLLECTOR.headerBore / 2) ** 2;
  const Ajacket = Math.PI * (TANK.vesselR + TANK.jacketGap) * TANK.jacketGap;
  const sim: { s: SolarState | null } = { s: null };
  const T = () => sim.s?.loopT;
  const map = () => sim.s?.loopMap;
  const iCold = flows.add({
    points: unit.coldPath.slice(),
    ratio: 1,
    temperature: (t) => {
      const m = map();
      return m ? stretch(T()!, m.cold[0], m.cold[1], t) : 20;
    },
  });
  const iHot = flows.add({
    points: unit.hotPath.slice(),
    ratio: 1,
    spacing: 0.06,
    temperature: (t) => {
      const m = map();
      return m ? stretch(T()!, m.hot[0], m.hot[1], t) : 20;
    },
  });
  // the lower header, from the right to the left; the upper, from the right to the left too: the fluid crosses the bank, the two ends diagonally apart
  const headerY = n;
  const stub = BANK_WIDTH / 2;
  flows.add({
    points: [new THREE.Vector3(stub, headerY, -s0), new THREE.Vector3(-stub, headerY, -s0)],
    ratio: (2 * Apipe) / (4 * Aheader),
    spacing: 0.12,
    temperature: () => (sim.s ? sim.s.loopT[sim.s.loopMap.lowerHeader] : 20),
  });
  flows.add({
    points: [new THREE.Vector3(stub, headerY, -s1), new THREE.Vector3(-stub, headerY, -s1)],
    ratio: (2 * Apipe) / (4 * Aheader),
    spacing: 0.12,
    temperature: () => (sim.s ? sim.s.loopT[sim.s.loopMap.upperHeader] : 20),
  });
  // every fifth riser of each collector carries dots: all seventy would be a carpet, the speed is what one has
  for (const cx of [COLLECTOR_X.left, COLLECTOR_X.right]) {
    for (let i = 2; i < COLLECTOR.risers; i += 5) {
      const x = cx + riserX(i);
      fine.add({
        points: [new THREE.Vector3(x, headerY, -s0), new THREE.Vector3(x, headerY, -s1)],
        ratio: Apipe / (2 * COLLECTOR.risers * Ariser),
        spacing: 0.3,
        temperature: (t) => {
          const m = map();
          return m ? stretch(T()!, m.risers[0], m.risers[1], t) : 20;
        },
      });
    }
  }
  // the jacket, from the hot port along the bottom of the vessel to the cold: a wide slot, so very slow. Its line stays inside the tank: drawn in `body`, moved with it
  const jacketPoints = () => {
    const y = -TANK.vesselR - TANK.vesselWall - TANK.jacketGap / 2;
    return [
      unit.tankToBody(new THREE.Vector3(-TANK.portX, TANK.portY, 0)),
      unit.tankToBody(new THREE.Vector3(-TANK.vesselLength / 2, y, 0)),
      unit.tankToBody(new THREE.Vector3(TANK.vesselLength / 2, y, 0)),
      unit.tankToBody(new THREE.Vector3(TANK.portX, TANK.portY, 0)),
    ];
  };
  const iJacket = flows.add({
    points: jacketPoints(),
    ratio: Apipe / Ajacket,
    spacing: 0.16,
    temperature: (t) => {
      const m = map();
      return m ? stretch(T()!, m.jacket[0], m.jacket[1], t) : 20;
    },
  });

  // what X-ray keeps solid while it ghosts the shells around it: the risers and headers in their colours, the water's layers
  const inner: THREE.Mesh[] = [];
  for (const id of ['collector-left', 'collector-right', 'storage-tank'] as const) {
    for (const m of registry.get(id)!.meshes) {
      const name = (m.userData.solidMaterial as THREE.Material).name;
      if (name === 'riser' || name === 'header' || name === 'water') inner.push(m);
    }
  }

  // ---- the tank's place, from the state's height. Sideways first, then down: it never passes through the bank
  const drawn = { side: 0, up: 0 };
  const clearance = 0.02;
  const place = (y: number, dt: number) => {
    const low = y < -AT_HOME;
    let sideTarget = low || drawn.up < -clearance ? STAND_SIDEWAYS : 0;
    let upTarget = y;
    const beside = drawn.side > STAND_SIDEWAYS * 0.97;
    if (!beside && upTarget < -clearance) upTarget = -clearance;
    if (Math.abs(sideTarget - drawn.side) < 2e-4) sideTarget = drawn.side;
    const before = drawn.side + drawn.up * 1000;
    if (dt >= 1e6) sideTarget = low ? STAND_SIDEWAYS : 0;
    drawn.side = dt >= 1e6 ? sideTarget : damp(drawn.side, sideTarget, 4, dt);
    drawn.up = dt >= 1e6 ? y : damp(drawn.up, upTarget, 4, dt);
    if (Math.abs(drawn.side - sideTarget) < 5e-4) drawn.side = sideTarget;
    if (Math.abs(drawn.up - upTarget) < 5e-4) drawn.up = upTarget;
    if (before !== drawn.side + drawn.up * 1000) {
      unit.setPose(drawn.side, drawn.up);
      flows.setPoints(iCold, unit.coldPath.slice());
      flows.setPoints(iHot, unit.hotPath.slice());
      flows.setPoints(iJacket, jacketPoints());
      stand.update(drawn.side, drawn.up, y);
    }
  };
  stand.update(0, 0, 0);

  const cameraTarget = new THREE.Vector3(0, RIG_FOOT_Y + 0.62, -0.95);
  const mod: RigScene = {
    id: 'rig',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    unit,
    flows,
    fine,
    bench,
    stand,
    home: { position: new THREE.Vector3(-3.1, 3.6, 4.1), target: cameraTarget },
    minDistance: 0.35,
    maxDistance: 16,
    near: 0.02,
    far: 80,
    homePadding: 0.86,
    declutter: true,
    snap(y) {
      place(y, 1e9);
    },
    drawn() {
      return { ...drawn };
    },
    update(s, dt, view) {
      sim.s = s;
      place(s.tankHeight, dt);
      const now = partsNow(registry);
      bench.visible = !now.isolated;
      unit.collectors.left.risers.update(s.loopT, s.loopMap.risers[0]);
      unit.collectors.right.risers.update(s.loopT, s.loopMap.risers[0]);
      unit.tank.layers.update(s.layers);
      unit.tank.jacketStrip.update(s.loopT, s.loopMap.jacket[0]);
      const show = view.schematic && !now.hidden && !now.exploded;
      flows.object.visible = show;
      fine.object.visible = show;
      if (show) {
        const v = dotSpeed(s.pipeSpeed, s.flowDir) * view.slowMo;
        flows.step(v, dt);
        fine.step(v, dt);
      }
      // X-ray with nothing selected: the shells are glass, what they hold stays solid. A selected part's X-ray ghosts everything else entirely
      let solids = 0;
      for (const id of registry.ids()) if (registry.get(id)!.display === 'solid') solids++;
      if (solids > 1)
        for (const m of inner) if (m.material === GHOST) m.material = m.userData.solidMaterial as THREE.Material;
      const pr = params();
      unit.setExtras(pr.checkValve === true, pr.pipeInsulation === true);
    },
  };
  return mod;
}
