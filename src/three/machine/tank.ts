import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import { CASE_INNER, JACKET_OUTER, TANK, TANK_DRUM_HALF, VESSEL_HALF, VESSEL_OUTER } from '../dims';
import { HeatStrip } from '../heat';
import type { MachineLook } from './look';
import { box, cylX, hexX, mergeAll, revolveX, rod, sectionFace, type P2 } from './shapes';

// The tank, from `dims.ts`: the same function for the `rig`'s and the `house`'s machine, whose tank is one part, and for the `tank-and-tap` world, where each layer is a part. Its frame:
// the tank's centre, X its axis, Y up, Z towards the equator. Its Y stays vertical whatever the roof's pitch: the water's layers are level.
//
// Three views of the same dimensions, all geometry, swapped by `setView`: half shells and flat faces, nothing clipped. `full` is the closed tank. `length` is the `tank-and-tap` world's: the vertical
// plane through the axis, the half towards +Z taken off. What lies on that plane (the anode, the element, the tubes) stays whole, half proud of the water's face, as a drawing shows them. `across` is
// the section tool's: a cut square to the axis, everything to the left of it taken off, so that the ten layers read as what they are, slices of a circle, thin at the top and bottom.

export const TANK_PARTS = [
  'outer-case',
  'end-cap',
  'tank-foam',
  'mantle-jacket',
  'inner-vessel',
  'water-column',
  'sacrificial-anode',
  'booster-element',
  'tank-thermostat',
  'cold-diffuser',
  'hot-outlet',
  'tpr-valve',
  'jacket-relief-valve',
] as const;
export type TankPart = (typeof TANK_PARTS)[number];

export type TankView = 'full' | 'length' | 'across';

/** Where the section tool cuts the tank, along its axis, m. Chosen: the hot outlet and the diffuser stay to the right of it. */
export const SECTION_X = -0.18;

export interface Tank {
  root: THREE.Group;
  parts: Record<TankPart, THREE.Group>;
  /** Ten cells from the bottom, nearest: a layer is a layer. */
  layers: HeatStrip;
  /** The jacket's nodes, from the hot port to the cold. */
  jacketStrip: HeatStrip;
  /** The left and right caps, so that a world's exploded view can take them apart. */
  caps: { left: THREE.Group; right: THREE.Group };
  setView(view: TankView): void;
}

const H = TANK_DRUM_HALF;
const V = VESSEL_HALF;
const W = TANK.vesselWall;
const VR = TANK.vesselR;
const VO = VESSEL_OUTER;
const JI = VO + TANK.jacketGap;
const JO = JACKET_OUTER;
const R = TANK.caseR;
const RI = CASE_INNER;
const halfTurn = { phi0: Math.PI, phiLength: Math.PI };
const CAP: readonly (readonly [number, number])[] = [
  [R, 0],
  [0.244, 0.02],
  [0.205, 0.044],
  [0.15, 0.061],
  [0.105, 0.07],
  [0, 0.07],
];
const EMPTY = () => box(0, 1e-5, 0, 1e-5, 0, 1e-5);

/** How far the cap reaches along the axis at radius `r`, from the drum's end. derived from the cap's profile. */
export function capReach(r: number): number {
  for (let i = 0; i < CAP.length - 1; i++) {
    const [r0, x0] = CAP[i];
    const [r1, x1] = CAP[i + 1];
    if (r <= r0 && r >= r1) return x0 + ((x1 - x0) * (r0 - r)) / (r0 - r1 || 1);
  }
  return 0.07;
}

/** A flat ring at `x`, facing -X, across the section tool's cut. `lower`, `upper` keep one half. */
function ringAt(
  x: number,
  r0: number,
  r1: number,
  part: 'all' | 'upper' | 'lower' = 'all',
  seg = 48,
): THREE.BufferGeometry {
  const o =
    part === 'all'
      ? {}
      : part === 'upper'
        ? { phi0: -Math.PI / 2, phiLength: Math.PI }
        : { phi0: Math.PI / 2, phiLength: Math.PI };
  return revolveX(
    [
      [x, r0],
      [x, r1],
    ],
    { seg, ...o },
  );
}

export function buildTank(look: MachineLook, o: { views?: boolean } = {}): Tank {
  const root = group('tank');
  const parts = Object.fromEntries(TANK_PARTS.map((id) => [id, group(id)])) as Record<TankPart, THREE.Group>;
  for (const id of TANK_PARTS) root.add(parts[id]);
  const swaps: { mesh: THREE.Mesh; geo: Record<TankView, THREE.BufferGeometry> }[] = [];
  /** One mesh of a part, from a function of its view. A world that does not open the tank builds one geometry only. */
  const put = (
    id: TankPart,
    mat: THREE.Material,
    make: (view: TankView) => THREE.BufferGeometry,
    parent: THREE.Object3D = parts[id],
  ): THREE.Mesh => {
    const m = new THREE.Mesh(make(o.views ? 'length' : 'full'), mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    if (o.views) swaps.push({ mesh: m, geo: { full: make('full'), length: m.geometry, across: make('across') } });
    return m;
  };
  /** A piece that does not change with the view, or is gone in the section tool's. */
  const still = (g: () => THREE.BufferGeometry) => () => g();
  const leftOnly = (g: () => THREE.BufferGeometry) => (v: TankView) => (v === 'across' ? EMPTY() : g());

  // ---- the case, 0.4 mm of aluminium, reported: a drum, with a band over each join. In section its thickness is a line: drawn at 1.5 mm so that the eye can see it
  const skin = (x0: number, o2: object = {}) =>
    revolveX(
      [
        [x0, R],
        [H, R],
      ],
      { seg: 64, ...o2 },
    );
  const band = (x: number, o2: object = {}) =>
    revolveX(
      [
        [x - 0.018, R],
        [x - 0.018, R + 0.0022],
        [x + 0.018, R + 0.0022],
        [x + 0.018, R],
      ],
      { seg: 64, ...o2 },
    );
  put('outer-case', look.caseSkin, (v) =>
    v === 'full'
      ? mergeAll([skin(-H), band(-H), band(H)])
      : v === 'length'
        ? mergeAll([
            skin(-H, halfTurn),
            band(-H, halfTurn),
            band(H, halfTurn),
            sectionFace([
              [-H, R],
              [H, R],
              [H, R - 0.0015],
              [-H, R - 0.0015],
            ]),
          ])
        : mergeAll([skin(SECTION_X), band(H), ringAt(SECTION_X, R - 0.0015, R)]),
  );

  // the nameplate on the case's back, towards the right end: small and wordless (research §3). Riveted at its four corners
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0xbfc3c4,
    roughness: 0.4,
    metalness: 0.7,
    name: 'nameplate',
  });
  const plateAt = (x0: number, x1: number) => {
    const a = (-Math.PI * 3) / 4; // from the tank's axis, up and to the back
    const y = Math.sin(-a) * (R + 0.0005);
    const z = Math.cos(a) * (R + 0.0005);
    const g = box(x0, x1, -0.024, 0.024, -0.0006, 0.0006);
    g.rotateX(a + Math.PI / 2);
    g.translate(0, y, z);
    return g;
  };
  put('outer-case', plateMat, () => plateAt(0.72, 0.84));

  // ---- the two black end caps that bulge a little, with an oval hatch on the left one: reported shape (research §3)
  const capProfile = (side: number): P2[] => {
    const pts = CAP.map(([r, x]) => [side * (H + x), r] as P2);
    return side > 0 ? pts : pts.slice().reverse();
  };
  const capPoly = (side: number): P2[] => [
    ...CAP.map(([r, x]) => [side * (H + x), r] as P2),
    [side * (H + 0.07 - 0.006), 0],
    [side * (H + 0.006), RI - 0.002],
    [side * H, RI],
  ];
  const capGeo = (side: number, v: TankView) =>
    v === 'length'
      ? mergeAll([revolveX(capProfile(side), { smooth: true, seg: 48, ...halfTurn }), sectionFace(capPoly(side))])
      : revolveX(capProfile(side), { smooth: true, seg: 48 });
  const capLeft = group('cap-left');
  const capRight = group('cap-right');
  parts['end-cap'].add(capLeft, capRight);
  put('end-cap', look.capBlack, (v) => (v === 'across' ? EMPTY() : capGeo(-1, v)), capLeft);
  put('end-cap', look.capBlack, (v) => capGeo(1, v), capRight);
  // the hatch: an oval plate on the flat of the left cap, its long axis vertical, and six screws
  const hatch = () => {
    const g = cylX(TANK.hatchR, -(H + 0.07 + 0.006), -(H + 0.07), 0, 0, 32);
    g.scale(1, 1.32, 1);
    const list: THREE.BufferGeometry[] = [g];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
      list.push(
        hexX(
          0.0055,
          -(H + 0.07 + 0.009),
          -(H + 0.07 + 0.006),
          Math.sin(a) * TANK.hatchR * 1.15,
          Math.cos(a) * TANK.hatchR * 0.82,
        ),
      );
    }
    return mergeAll(list);
  };
  put('end-cap', look.terminal, leftOnly(hatch), capLeft);

  // ---- the foam between the case and what it wraps: in section it is the view's big warm mass
  const foamUpper: P2[] = [
    [-H, RI],
    [H, RI],
    [H, 0],
    [V, 0],
    [V, VO],
    [-V, VO],
    [-V, 0],
    [-H, 0],
  ];
  const foamLower: P2[] = [
    [-H, RI],
    [H, RI],
    [H, 0],
    [V, 0],
    [V, JO],
    [-V, JO],
    [-V, 0],
    [-H, 0],
  ];
  put('tank-foam', look.foam, (v) =>
    v === 'full'
      ? revolveX(
          [
            [-H, RI],
            [H, RI],
          ],
          { seg: 48 },
        )
      : v === 'length'
        ? mergeAll([
            revolveX(
              [
                [-H, RI],
                [H, RI],
              ],
              { seg: 48, ...halfTurn },
            ),
            sectionFace(foamUpper, { lower: false, z: -0.0006 }),
            sectionFace(foamLower, { upper: false, z: -0.0006 }),
          ])
        : mergeAll([
            revolveX(
              [
                [SECTION_X, RI],
                [H, RI],
              ],
              { seg: 48 },
            ),
            ringAt(SECTION_X - 0.0006, VO, RI, 'upper'),
            ringAt(SECTION_X - 0.0006, JO, RI, 'lower'),
          ]),
  );

  // ---- the jacket: a shell on the lower half (φ from +Z through -Y to -Z), closed at its ends, and its two ports through the foam and the cap
  const a = V + TANK.jacketShell;
  const lowerHalf = { phi0: Math.PI / 2, phiLength: Math.PI };
  const shell = (x0: number, o2: object) =>
    revolveX(
      [
        [x0, VO],
        [x0, JO],
        [a, JO],
        [a, VO],
      ],
      { seg: 36, ...o2 },
    );
  const port = (side: number) => cylX(0.011, side * V, side * TANK.portX, TANK.portY, 0, 14);
  put('mantle-jacket', look.jacket, (v) =>
    v === 'full'
      ? mergeAll([shell(-a, lowerHalf), port(-1), port(1)])
      : v === 'length'
        ? mergeAll([
            shell(-a, { phi0: Math.PI, phiLength: Math.PI / 2 }),
            sectionFace(
              [
                [-a, JI],
                [a, JI],
                [a, JO],
                [-a, JO],
              ],
              { upper: false, z: 0.0003 },
            ),
            sectionFace(
              [
                [-a, VO],
                [-V, VO],
                [-V, JO],
                [-a, JO],
              ],
              { upper: false, z: 0.0003 },
            ),
            sectionFace(
              [
                [V, VO],
                [a, VO],
                [a, JO],
                [V, JO],
              ],
              { upper: false, z: 0.0003 },
            ),
            port(-1),
            port(1),
          ])
        : mergeAll([
            revolveX(
              [
                [SECTION_X, JO],
                [a, JO],
                [a, VO],
              ],
              { seg: 36, ...lowerHalf },
            ),
            ringAt(SECTION_X - 0.0003, JI, JO, 'lower'),
            port(1),
          ]),
  );
  // the mix in the jacket's gap, seen only in section: its colour runs from the hot port to the cold, the model's own nodes
  const jacketStrip = new HeatStrip(40);
  const jacketMat = new THREE.MeshBasicMaterial({ map: jacketStrip.texture, name: 'jacket-fluid' });
  jacketMat.userData.noShare = true;
  const byAxis = (g: THREE.BufferGeometry) => {
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5, (pos.getX(i) + V) / (2 * V));
    return g;
  };
  if (o.views) {
    const fluid = put('mantle-jacket', jacketMat, (v) =>
      byAxis(
        v === 'across'
          ? ringAt(SECTION_X - 0.0004, VO, JI, 'lower')
          : sectionFace(
              [
                [-V, VO],
                [V, VO],
                [V, JI],
                [-V, JI],
              ],
              { upper: false, z: 0.0004 },
            ),
      ),
    );
    fluid.castShadow = false;
    fluid.userData.noShadow = true;
  }

  // ---- the vessel: 2.5 mm of steel, reported, enamelled inside. Its heads are flat here: 300 L from an estimated Ø0.44 m, as the model has it
  const shellV = (x0: number, o2: object) =>
    revolveX(
      [
        [x0, 0],
        [x0, VO],
        [V, VO],
        [V, 0],
      ],
      { seg: 48, ...o2 },
    );
  put('inner-vessel', look.vessel, (v) =>
    v === 'full'
      ? shellV(-V, {})
      : v === 'length'
        ? mergeAll([
            shellV(-V, halfTurn),
            sectionFace(
              [
                [-V, VO],
                [V, VO],
                [V, VR],
                [-V, VR],
              ],
              { z: 0.0003 },
            ),
            sectionFace(
              [
                [-V, 0],
                [-V, VO],
                [-V + W, VO],
                [-V + W, 0],
              ],
              { z: 0.0003 },
            ),
            sectionFace(
              [
                [V - W, 0],
                [V - W, VO],
                [V, VO],
                [V, 0],
              ],
              { z: 0.0003 },
            ),
          ])
        : mergeAll([
            revolveX(
              [
                [SECTION_X, VO],
                [V, VO],
                [V, 0],
              ],
              { seg: 48 },
            ),
            ringAt(SECTION_X, VR, VO),
          ]),
  );

  // ---- the water, ten cells from the bottom. Its V is the height: each mesh reads the same strip
  const layers = new HeatStrip(10, true);
  const waterMat = new THREE.MeshBasicMaterial({ map: layers.texture, name: 'water' });
  waterMat.userData.noShare = true;
  const byHeight = (g: THREE.BufferGeometry) => {
    const pos = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, 0.5, (pos.getY(i) + VR) / (2 * VR));
    return g;
  };
  const waterBody = (o2: object) =>
    revolveX(
      [
        [-V + W, 0],
        [-V + W, VR],
        [V - W, VR],
        [V - W, 0],
      ],
      { seg: 48, ...o2 },
    );
  put('water-column', waterMat, (v) =>
    byHeight(
      v === 'full'
        ? waterBody({})
        : v === 'length'
          ? mergeAll([waterBody(halfTurn), box(-V + W, V - W, -VR, VR, -0.0005, 0)])
          : ringAt(SECTION_X + 0.0005, 0, VR, 'all', 64),
    ),
  );

  // ---- the anode, magnesium on a steel core, reported: along the top of the vessel, from a plug in the left cap
  const anodeY = TANK.anodeY;
  const anodeEnd = -V + TANK.anodeLength;
  put('sacrificial-anode', look.anode, (v) =>
    mergeAll([
      cylX(TANK.anodeR, v === 'across' ? SECTION_X : -V, anodeEnd, anodeY, 0, 14),
      rod(new THREE.Vector3(anodeEnd, anodeY, 0), new THREE.Vector3(anodeEnd + 0.02, anodeY, 0), 0.004, 8),
    ]),
  );
  const plugX = -(H + capReach(anodeY));
  put(
    'sacrificial-anode',
    look.brass,
    leftOnly(() =>
      mergeAll([cylX(0.012, -V, plugX, anodeY, 0, 12), hexX(0.021, plugX - 0.012, plugX + 0.002, anodeY, 0)]),
    ),
  );

  // ---- the booster's element: a copper U at half height, drawn in through the hatch, reported at half height for 150 L of boost
  const eY = TANK.elementY;
  const eL = TANK.elementLength;
  const legs = 0.018;
  put(
    'booster-element',
    look.element,
    leftOnly(() => {
      const u: THREE.BufferGeometry[] = [
        cylX(TANK.elementR, -V + 0.02, -V + eL, eY + legs, 0, 10),
        cylX(TANK.elementR, -V + 0.02, -V + eL, eY - legs, 0, 10),
      ];
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI - Math.PI / 2;
        const a1 = ((i + 1) / n) * Math.PI - Math.PI / 2;
        u.push(
          rod(
            new THREE.Vector3(-V + eL + Math.cos(a0) * legs, eY + Math.sin(a0) * legs, 0),
            new THREE.Vector3(-V + eL + Math.cos(a1) * legs, eY + Math.sin(a1) * legs, 0),
            TANK.elementR,
            8,
          ),
        );
      }
      return mergeAll(u);
    }),
  );
  // its flange on the head, and its terminal block behind the hatch
  put(
    'booster-element',
    look.terminal,
    leftOnly(() =>
      mergeAll([cylX(0.052, -V - 0.012, -V + 0.002, eY, 0, 28), cylX(0.03, -(H + 0.05), -V - 0.012, eY, 0, 18)]),
    ),
  );

  // ---- the thermostat: a pocket beside the element, its head behind the hatch
  const pY = eY + 0.058;
  put(
    'tank-thermostat',
    look.steel,
    leftOnly(() => cylX(TANK.pocketR, -V, -V + TANK.pocketLength, pY, 0, 12)),
  );
  put(
    'tank-thermostat',
    look.terminal,
    leftOnly(() => box(-V - 0.05, -V - 0.002, pY - 0.018, pY + 0.018, -0.02, 0.02)),
  );

  // ---- the cold diffuser: the mains' tube along the bottom, turned up over a perforated spreader, so that it does not stir the layers. Its nipple leaves the right cap
  const dY = TANK.diffuserY;
  const dEnd = V - TANK.diffuserLength;
  const nippleD = H + capReach(Math.abs(dY)) + 0.026;
  put(
    'cold-diffuser',
    look.steel,
    still(() =>
      mergeAll([
        cylX(TANK.diffuserR, dEnd, nippleD, dY, 0, 14),
        rod(new THREE.Vector3(dEnd, dY, 0), new THREE.Vector3(dEnd, dY + 0.045, 0), TANK.diffuserR, 12),
        rod(new THREE.Vector3(dEnd, dY + 0.045, 0), new THREE.Vector3(dEnd, dY + 0.051, 0), 0.042, 20),
      ]),
    ),
  );
  put(
    'cold-diffuser',
    look.brass,
    still(() => hexX(0.02, H + capReach(Math.abs(dY)), nippleD - 0.004, dY, 0)),
  );

  // ---- the hot outlet: from the very top of the vessel, out of the right cap
  const hTop = VR - 0.01;
  const hY = 0.178;
  const nippleH = H + capReach(hY) + 0.026;
  put(
    'hot-outlet',
    look.steel,
    still(() =>
      mergeAll([
        cylX(TANK.hotOutletR, TANK.hotOutletX, nippleH, hY, 0, 12),
        rod(
          new THREE.Vector3(TANK.hotOutletX, hY, 0),
          new THREE.Vector3(TANK.hotOutletX, hTop, 0),
          TANK.hotOutletR,
          12,
        ),
      ]),
    ),
  );
  put(
    'hot-outlet',
    look.brass,
    still(() => hexX(0.018, H + capReach(hY), nippleH - 0.004, hY, 0)),
  );

  // ---- the T&P valve at the top of the right cap: its probe in the top of the water, its brass body, its lever and its drain, which faces down
  const tY = 0.092;
  const tX = H + capReach(tY);
  put(
    'tpr-valve',
    look.brass,
    still(() =>
      mergeAll([
        cylX(0.0075, V - 0.14, tX, tY, 0.04, 10),
        cylX(0.018, tX - 0.002, tX + 0.05, tY, 0.04, 16),
        hexX(0.021, tX, tX + 0.014, tY, 0.04),
        rod(new THREE.Vector3(tX + 0.028, tY, 0.04), new THREE.Vector3(tX + 0.028, tY - 0.05, 0.04), 0.0105, 12),
      ]),
    ),
  );
  put(
    'tpr-valve',
    look.steel,
    still(() => rod(new THREE.Vector3(tX + 0.05, tY, 0.04), new THREE.Vector3(tX + 0.05, tY + 0.032, 0.04), 0.0032, 8)),
  );

  // ---- the jacket's own relief valve on the left cap, low: on the closed circuit, reported 80 kPa
  const rY = -0.145;
  const rZ = 0.05;
  const rX = -(H + capReach(Math.hypot(rY, rZ)));
  put(
    'jacket-relief-valve',
    look.brass,
    leftOnly(() =>
      mergeAll([
        cylX(0.009, -V - 0.02, rX, rY, rZ, 10),
        cylX(0.016, rX - 0.038, rX + 0.002, rY, rZ, 14),
        hexX(0.019, rX - 0.012, rX, rY, rZ),
        rod(new THREE.Vector3(rX - 0.024, rY, rZ), new THREE.Vector3(rX - 0.024, rY + 0.038, rZ), 0.0085, 10),
      ]),
    ),
  );

  return {
    root,
    parts,
    layers,
    jacketStrip,
    caps: { left: capLeft, right: capRight },
    setView(view) {
      for (const s of swaps) s.mesh.geometry = s.geo[view];
    },
  };
}
