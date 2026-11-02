import * as THREE from 'three';
import { applyWear, contactShadow, group, PartRegistry } from '@onigam/lab-kit/three';
import type { PartFraming, SceneModule } from '@onigam/lab-kit/three';
import type { SolarState } from '../../sim/types';
import { COLLECTOR, COS, SIN, TILT } from '../dims';
import { dotSpeed, FlowDots, stretch } from '../flows';
import { heatLegend, type HeatLegend } from '../heat-legend';
import { buildCollector, COLLECTOR_LAYERS, riserX, type Collector, type CollectorLayer } from '../machine/collector';
import { machineLook } from '../machine/look';
import { box, mergeAll, rod } from '../machine/shapes';
import { mergeStatic } from '../merge';
import { partName } from '../part-ids';
import { anchor, hotspots, paperFloor, partsNow, PAPER, viewFrom, workshopScene, type HotspotDef } from '../world';

// The `collector` world: one collector of the bank, built by the same function, on a carpenter's easel at the roof's pitch. It opens on a stair at its top-left corner: each layer stops further from
// the corner than the one under it. The risers carry the model's temperatures in false colour, the plate's and the air's stand side by side on the scale; at night the paper goes blue, and the plate
// falls under the air. The section tool is a true cut across the risers.

/** Explode offsets, in the collector's frame: straight out of the tray, in the order of the layers, which is the order they went on. The two headers leave along the risers. The tray stays on its easel. */
export const EXPLODE: Record<CollectorLayer, [number, number, number]> = {
  'collector-tray': [0, 0, 0],
  'back-insulation': [0, 0.14, 0],
  'riser-tube': [0, 0.3, 0],
  'upper-header': [0, 0.3, -0.16],
  'lower-header': [0, 0.3, 0.16],
  'absorber-plate': [0, 0.5, 0],
  'air-gap': [0, 0.66, 0],
  'glass-seal': [0, 0.84, 0],
  'glass-cover': [0, 1.0, 0],
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'glass-cover', ...partName('glass-cover') },
  { id: 'absorber-plate', ...partName('absorber-plate') },
  { id: 'riser-tube', ...partName('riser-tube') },
  { id: 'upper-header', ...partName('upper-header') },
  { id: 'back-insulation', ...partName('back-insulation'), minor: true },
  { id: 'lower-header', ...partName('lower-header') },
  { id: 'collector-tray', ...partName('collector-tray') },
  { id: 'glass-seal', ...partName('glass-seal'), minor: true },
  { id: 'air-gap', ...partName('air-gap'), minor: true },
];

/** Selected, a layer is looked at where the stair shows it. */
const CORNER = (x0: number, x1: number, s0: number, s1: number): THREE.Box3 => {
  const p = (x: number, s: number, n: number) =>
    new THREE.Vector3(x, FOOT.y + s * SIN + n * COS, FOOT.z + n * SIN - s * COS);
  const b = new THREE.Box3();
  b.expandByPoint(p(x0, s0, 0));
  b.expandByPoint(p(x1, s1, COLLECTOR.depth));
  return b;
};
const FOOT = { y: 0.58, z: 0.9 };
const W = COLLECTOR.width;
const L = COLLECTOR.length;

const FRAMING: Partial<Record<CollectorLayer, PartFraming>> = {
  'riser-tube': { frame: CORNER(-W / 2, -W / 2 + 0.6, L - 0.72, L - 0.06), viewDir: viewFrom(52, -22) },
  'absorber-plate': { frame: CORNER(-W / 2 + 0.2, W / 2 - 0.1, L - 1.1, L - 0.3), viewDir: viewFrom(52, -14) },
  'back-insulation': { frame: CORNER(-W / 2, -W / 2 + 0.34, L - 0.42, L - 0.08), viewDir: viewFrom(48, -28) },
  'upper-header': { frame: CORNER(-W / 2 - 0.04, -W / 2 + 0.5, L - 0.16, L), viewDir: viewFrom(42, -26) },
  'lower-header': { viewDir: viewFrom(42, -14) },
  'glass-seal': { frame: CORNER(-W / 2 + 0.36, -W / 2 + 0.86, L - 0.98, L - 0.42), viewDir: viewFrom(45, -20) },
  'air-gap': { frame: CORNER(-W / 2 + 0.4, -W / 2 + 0.9, L - 1.0, L - 0.5), viewDir: viewFrom(30, -24) },
  'collector-tray': { frame: CORNER(-W / 2 - 0.02, -W / 2 + 0.34, L - 0.34, L + 0.02), viewDir: viewFrom(32, -46) },
};

export interface CollectorScene extends SceneModule<SolarState> {
  collector: Collector;
  easel: THREE.Group;
  flows: FlowDots;
  legend: HeatLegend;
}

/** The easel: two sloped bearers, a stop for the foot, four legs. Scenery: it goes when a part is isolated. */
function buildEasel(): THREE.Group {
  const easel = group('easel');
  const wood = new THREE.MeshStandardMaterial({ color: 0xa98f6c, roughness: 0.86, name: 'easel-wood' });
  const dark = new THREE.MeshStandardMaterial({ color: 0x8e7656, roughness: 0.88, name: 'easel-dark' });
  const sloped = group('easel-sloped');
  sloped.position.set(0, FOOT.y, FOOT.z);
  sloped.rotation.x = TILT;
  easel.add(sloped);
  const bars: THREE.BufferGeometry[] = [];
  for (const x of [-0.34, 0.34]) bars.push(box(x - 0.03, x + 0.03, -0.07, 0, -L - 0.02, 0.14));
  sloped.add(new THREE.Mesh(mergeAll(bars), wood));
  // the stop that the foot of the tray stands against
  sloped.add(new THREE.Mesh(box(-W / 2 - 0.03, W / 2 + 0.03, -0.04, 0.05, 0.002, 0.045), dark));
  const world = (s: number, n: number) => ({ y: FOOT.y + s * SIN + n * COS, z: FOOT.z + n * SIN - s * COS });
  const legs: THREE.BufferGeometry[] = [];
  const P = 0.06;
  const feet: { x: number; z: number }[] = [];
  for (const s of [0.12, L - 0.12]) {
    const w = world(s, -0.07);
    for (const x of [-0.34, 0.34]) {
      const lx = x + (x < 0 ? -0.06 : 0.06);
      legs.push(box(lx - P / 2, lx + P / 2, 0, w.y + 0.04, w.z - P / 2, w.z + P / 2));
      feet.push({ x: lx, z: w.z });
    }
    legs.push(box(-0.34 - 0.09, 0.34 + 0.09, 0.22, 0.28, w.z + P / 2, w.z + P / 2 + 0.03));
  }
  const m = new THREE.Mesh(mergeAll(legs), wood);
  easel.add(m);
  const a = world(0.12, -0.07);
  const b = world(L - 0.12, -0.07);
  const braces: THREE.BufferGeometry[] = [];
  for (const x of [-0.46, 0.46])
    braces.push(rod(new THREE.Vector3(x, 0.25, a.z), new THREE.Vector3(x, b.y - 0.1, b.z), 0.018, 8));
  easel.add(new THREE.Mesh(mergeAll(braces), dark));
  easel.traverse((o) => {
    o.castShadow = true;
    o.receiveShadow = true;
  });
  for (const f of feet) {
    const sh = contactShadow(P, P, 0.12, 0.4);
    sh.position.set(f.x, 0.002, f.z);
    easel.add(sh);
  }
  return easel;
}

export function createCollectorScene(): CollectorScene {
  const scene = workshopScene({
    name: 'collector',
    key: [-2.4, 6, 3.4],
    target: [0, 1, 0],
    shadowHalf: 3.2,
    shadowFar: 16,
  });
  const key = scene.children.find(
    (c) => (c as THREE.DirectionalLight).isDirectionalLight && c.castShadow,
  ) as THREE.DirectionalLight;
  const floor = paperFloor(12);
  const floorPaper = (floor.material as THREE.MeshStandardMaterial).color;
  scene.add(floor);
  const look = machineLook();
  const easel = buildEasel();
  mergeStatic(easel, { bakeKey: 'collector-easel' });
  applyWear(easel, 34);
  scene.add(easel);

  const collector = buildCollector(look, { views: true });
  const holder = group('collector-holder');
  holder.position.set(0, FOOT.y, FOOT.z);
  holder.rotation.x = TILT;
  holder.add(collector.root);
  scene.add(holder);
  // in this world the headers say their temperature, as the risers do
  collector.setHeaders(20, 20);

  const anchors: Record<string, THREE.Object3D> = {};
  const P = collector.layers;
  const at = (id: CollectorLayer, x: number, y: number, s: number) => {
    anchors[id] = anchor(P[id], x, y, -s, `${id}-label`);
  };
  const stairX = -W / 2;
  at('glass-cover', 0.25, COLLECTOR.glassY + 0.004, 0.75);
  at('glass-seal', stairX + 0.64, COLLECTOR.glassY + 0.006, L - 0.5);
  at('air-gap', stairX + 0.66, COLLECTOR.glassY - 0.012, L - 0.74);
  at('absorber-plate', stairX + 0.3, COLLECTOR.waterwayY + 0.006, L - 0.74);
  at('riser-tube', stairX + 0.2, COLLECTOR.waterwayY + 0.006, L - 0.42);
  at('upper-header', stairX + 0.48, COLLECTOR.waterwayY + 0.016, L - COLLECTOR.headerInset);
  at('lower-header', -0.1, COLLECTOR.waterwayY + 0.02, COLLECTOR.headerInset);
  at('back-insulation', stairX + 0.1, COLLECTOR.blanket + 0.002, L - 0.26);
  at('collector-tray', W / 2 - 0.002, 0.04, 0.5);

  const registry = new PartRegistry();
  for (const id of COLLECTOR_LAYERS) {
    mergeStatic(P[id], { bakeKey: 'collector' });
    registry.add(id, P[id], new THREE.Vector3(...EXPLODE[id]), undefined, FRAMING[id]);
  }
  applyWear(holder, 60, (m) => {
    const n = (m.material as THREE.Material).name;
    return n === 'plate' || n === 'header';
  });

  // ---- the flows: in the risers and along the two headers, at their true speed
  const flows = new FlowDots(240, 0.022);
  collector.root.add(flows.object);
  const Y = COLLECTOR.waterwayY;
  const Apipe = Math.PI * 0.01 * 0.01;
  const Ariser = Math.PI * (COLLECTOR.riserBore / 2) ** 2;
  const Aheader = Math.PI * (COLLECTOR.headerBore / 2) ** 2;
  const sim: { s: SolarState | null } = { s: null };
  for (let i = 1; i < COLLECTOR.risers; i += 3) {
    flows.add({
      points: [
        new THREE.Vector3(riserX(i), Y, -COLLECTOR.headerInset),
        new THREE.Vector3(riserX(i), Y, -L + COLLECTOR.headerInset),
      ],
      ratio: Apipe / (2 * COLLECTOR.risers * Ariser),
      spacing: 0.22,
      temperature: (t) => (sim.s ? stretch(sim.s.loopT, sim.s.loopMap.risers[0], sim.s.loopMap.risers[1], t) : 20),
    });
  }
  for (const [s, node] of [
    [COLLECTOR.headerInset, 'lowerHeader'],
    [L - COLLECTOR.headerInset, 'upperHeader'],
  ] as const) {
    flows.add({
      points: [new THREE.Vector3(W / 2, Y, -s), new THREE.Vector3(-W / 2, Y, -s)],
      ratio: (2 * Apipe) / (4 * Aheader),
      spacing: 0.1,
      temperature: () => (sim.s ? sim.s.loopT[sim.s.loopMap[node]] : 20),
    });
  }

  // ---- the scale, standing on the paper to the right: air and plate side by side
  const legend = heatLegend();
  legend.root.position.set(-1.04, 0, -0.12);
  legend.root.rotation.y = 0.55;
  legend.root.scale.setScalar(1.1);
  scene.add(legend.root);
  const bg = scene.background as THREE.Color;
  const dayBg = new THREE.Color(PAPER);
  const nightBg = new THREE.Color(0x2e3a4a);
  const white = new THREE.Color(0xffffff);
  const nightFloor = new THREE.Color(0x56627a);
  const dayKey = new THREE.Color(0xfff1dc);
  const nightKey = new THREE.Color(0x8fa6cc);
  let dayness = 1;

  const mod: CollectorScene = {
    id: 'collector',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors),
    collector,
    easel,
    flows,
    legend,
    home: { position: new THREE.Vector3(-1.75, 2.35, 2.5), target: new THREE.Vector3(0.05, 1.0, -0.05) },
    minDistance: 0.14,
    maxDistance: 9,
    near: 0.01,
    far: 40,
    homePadding: 1.06,
    declutter: true,
    update(s, dt, view) {
      sim.s = s;
      const now = partsNow(registry);
      easel.visible = !now.isolated;
      legend.root.visible = !now.isolated && !now.exploded;
      collector.setView(view.cutaway ? 'section' : 'stair');
      collector.risers.update(s.loopT, s.loopMap.risers[0]);
      collector.setHeaders(s.loopT[s.loopMap.lowerHeader], s.loopT[s.loopMap.upperHeader]);
      legend.setMarks(s.airT, s.plateT);
      // the night: the paper goes blue with the sun's height, a view of its own for a plate colder than the air
      const target = THREE.MathUtils.smoothstep(s.sunAlt, -4, 7);
      dayness += (target - dayness) * Math.min(1, dt * 3);
      bg.copy(nightBg).lerp(dayBg, dayness);
      floorPaper.copy(nightFloor).lerp(white, dayness);
      key.intensity = 0.55 + (2.1 - 0.55) * dayness;
      key.color.copy(nightKey).lerp(dayKey, dayness);
      scene.environmentIntensity = 0.3 + 0.2 * dayness;
      const u = (floor.material as THREE.MeshStandardMaterial).userData.uPaper as { value: THREE.Color } | undefined;
      if (u) u.value.copy(bg);
      const show = view.schematic && !now.hidden && !now.exploded;
      flows.object.visible = show;
      if (show) flows.step(dotSpeed(s.pipeSpeed, s.flowDir) * view.slowMo, dt);
    },
  };
  return mod;
}
