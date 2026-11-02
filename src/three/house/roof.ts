import * as THREE from 'three';
import { group, rng } from '@onigam/lab-kit/three';
import {
  COS,
  HOUSE,
  HOUSE_FOOT,
  HOUSE_HALF_DEPTH,
  HOUSE_SLOPE,
  HOUSE_X,
  RAFTER_PITCH,
  RIG,
  ROOFING,
  SIN,
  TILT,
  tilePlaneY,
} from '../dims';
import { box, mergeAll } from '../machine/shapes';
import { bx, type HouseLook } from './building';

// The roof: real canal tiles, one instanced pan and one instanced cap on the two slopes, each with its small error of place and its tone; under them the battens and the rafters at 600 mm, a ridge beam, a wall
// plate. The slice cuts them all. Two parts: `roof-tiles` and `roof-structure`, the bars under the machine's feet with the latter.

const COLS = 0.215;
const ROW = 0.37;
const LEN = 0.43;

/** A tile: an open half shell, a little wider at its foot than at its head, so that each laps the one below. Concave up (`pan`) or convex up (`cap`), its Z along the slope; the cap's crown at height 0, the pan's belly at 0. */
function tileGeometry(cap: boolean): THREE.BufferGeometry {
  const seg = 7;
  // half width and sag, generic canal tile: a pan 25 cm wide, a cap 19 cm, wide enough to lap one another
  const w = cap ? 0.098 : 0.128;
  const h = cap ? 0.046 : 0.036;
  const R = (w * w + h * h) / (2 * h);
  const half = Math.asin(w / R);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const nor: number[] = [];
  const zs: [number, number, number][] = [
    [LEN / 2, 1.05, 0],
    [-LEN / 2, 0.95, 1],
  ];
  for (const [z, k, v] of zs) {
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg - 0.5) * 2 * half;
      const x = Math.sin(a) * R * k;
      const y = cap ? (Math.cos(a) - 1) * R : (1 - Math.cos(a)) * R;
      pos.push(x, y, z);
      nor.push(cap ? Math.sin(a) : -Math.sin(a), Math.cos(a), 0);
      uv.push(i / seg, v);
    }
  }
  const row = seg + 1;
  for (let i = 0; i < seg; i++) idx.push(i, i + 1, i + row, i + 1, i + row + 1, i + row);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Instances along the two slopes. */
function layTiles(cap: boolean, seed: number, material: THREE.Material): THREE.InstancedMesh {
  const r = rng(seed);
  const x0 = HOUSE_X.slice;
  const x1 = HOUSE_X.east + 0.12;
  const cols = Math.floor((x1 - x0) / (COLS * 2));
  const below = HOUSE.overhang;
  const rows = Math.ceil((HOUSE_SLOPE + below - 0.02) / ROW);
  const count = cols * rows * 2;
  const m = new THREE.InstancedMesh(tileGeometry(cap), material, count);
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const p = new THREE.Vector3();
  const s = new THREE.Vector3(1, 1, 1);
  const c = new THREE.Color();
  const base = [0x8f5a42, 0x98644a, 0x875039, 0x936048, 0x9d6c50, 0x7f4e3a].map((h) => new THREE.Color(h));
  let k = 0;
  for (const side of [1, -1]) {
    for (let j = 0; j < rows; j++) {
      const sl = -below + (j + 0.5) * ROW;
      for (let i = 0; i < cols; i++) {
        const x = x0 + COLS * (cap ? 1 : 0) + (i + 0.5) * COLS * 2 - COLS * 0.5;
        const z = side * (HOUSE_HALF_DEPTH - sl * COS);
        const yTop = tilePlaneY(HOUSE_HALF_DEPTH) + sl * SIN;
        // a tile stands a little proud of its neighbours below: the lap
        const lap = 0;
        const nY = cap ? 0 : ROOFING.panBottom;
        p.set(x + (r() - 0.5) * 0.01, yTop + (nY + lap) * COS + (r() - 0.5) * 0.004, z + side * (nY + lap) * SIN);
        // the tile's foot is lifted: it lies on the one below it
        e.set(side * TILT + side * 0.012 + (r() - 0.5) * 0.008, side > 0 ? 0 : Math.PI, (r() - 0.5) * 0.02);
        if (side < 0) e.set(TILT + 0.012 + (r() - 0.5) * 0.008, Math.PI, (r() - 0.5) * 0.02);
        q.setFromEuler(e);
        M.compose(p, q, s);
        m.setMatrixAt(k, M);
        const t = base[Math.floor(r() * base.length)];
        // weathered: a few darker, the old lichen's pale tile here and there
        c.copy(t).multiplyScalar(0.9 + r() * 0.2);
        if (r() < 0.03) c.lerp(new THREE.Color(0xa89e84), 0.35);
        m.setColorAt(k, c);
        k++;
      }
    }
  }
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

export interface Roof {
  tiles: THREE.Group;
  structure: THREE.Group;
}

export function buildRoof(look: HouseLook): Roof {
  const tiles = group('roof-tiles');
  const tileMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.78,
    side: THREE.DoubleSide,
    name: 'tile',
  });
  tileMat.userData.noShare = true;
  tiles.add(layTiles(false, 51, tileMat), layTiles(true, 52, tileMat));
  // the ridge: larger caps along the top, in mortar
  const yR = tilePlaneY(0) - 0.012;
  const ridge = tileGeometry(true);
  ridge.scale(1.25, 1.2, 1);
  ridge.rotateY(Math.PI / 2);
  const n = Math.ceil((HOUSE_X.east + 0.12 - HOUSE_X.slice) / ROW);
  const ridgeMesh = new THREE.InstancedMesh(ridge, tileMat, n);
  const r = rng(53);
  const M = new THREE.Matrix4();
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    M.makeRotationZ((r() - 0.5) * 0.02);
    M.setPosition(HOUSE_X.slice + (i + 0.5) * ROW, yR + 0.05, 0);
    ridgeMesh.setMatrixAt(i, M);
    c.setHex(0x875039).multiplyScalar(0.86 + r() * 0.2);
    ridgeMesh.setColorAt(i, c);
  }
  ridgeMesh.castShadow = true;
  tiles.add(ridgeMesh);
  const mortar = new THREE.Mesh(
    box(HOUSE_X.slice, HOUSE_X.east + 0.12, yR - 0.1, yR + 0.04, -0.07, 0.07),
    new THREE.MeshStandardMaterial({ color: 0xb0a48c, roughness: 0.95, name: 'mortar' }),
  );
  mortar.castShadow = true;
  tiles.add(mortar);

  // ---- the structure, on both slopes: rafters every 600 mm, battens under each row of tiles, a wall plate, a ridge beam
  const structure = group('roof-structure');
  const wood: THREE.BufferGeometry[] = [];
  const battens: THREE.BufferGeometry[] = [];
  const addSlope = (side: 1 | -1) => {
    const slope = group('slope');
    slope.rotation.x = side > 0 ? TILT : -TILT;
    slope.position.set(0, tilePlaneY(HOUSE_HALF_DEPTH), side * HOUSE_HALF_DEPTH);
    slope.updateMatrix();
    const m = slope.matrix;
    // along the slope: `s` from the wall's outer face line, -Z up the slope on the south, +Z on the north
    const sign = side > 0 ? -1 : 1;
    const a = -HOUSE.overhang;
    const b = HOUSE_SLOPE;
    const rw = 0.06;
    for (let x = -1.5; x < HOUSE_X.east; x += RAFTER_PITCH) {
      const g = bx(
        x - rw / 2,
        x + rw / 2,
        ROOFING.rafterBottom,
        ROOFING.battenBottom,
        Math.min(sign * a, sign * b),
        Math.max(sign * a, sign * b),
        0.8,
      );
      g.applyMatrix4(m);
      wood.push(g);
    }
    for (let s = a + 0.12; s < b; s += ROW) {
      const g = bx(
        HOUSE_X.slice,
        HOUSE_X.east + 0.1,
        ROOFING.battenBottom,
        ROOFING.battenTop,
        sign * s - 0.02,
        sign * s + 0.02,
        0.8,
      );
      g.applyMatrix4(m);
      battens.push(g);
    }
    // the wall plate, on the wall under the rafters' feet
    const yP = HOUSE.eaves;
    const zP = side * (HOUSE_HALF_DEPTH - HOUSE.wall / 2);
    wood.push(bx(HOUSE_X.slice, HOUSE_X.east, yP - 0.14, yP + 0.01, zP - 0.1, zP + 0.1, 0.8));
  };
  addSlope(1);
  addSlope(-1);
  // the ridge beam, a purlin at each slope's middle: the rafters are not alone over 5 m
  const yB = tilePlaneY(0) + ROOFING.rafterBottom / COS;
  wood.push(bx(HOUSE_X.slice, HOUSE_X.east, yB - 0.22, yB + 0.02, -0.08, 0.08, 0.8));
  const midZ = HOUSE_HALF_DEPTH / 2;
  const midY = tilePlaneY(midZ) + ROOFING.rafterBottom / COS;
  for (const side of [1, -1])
    wood.push(bx(HOUSE_X.slice, HOUSE_X.east, midY - 0.2, midY + 0.02, side * midZ - 0.08, side * midZ + 0.08, 0.8));
  const wm = new THREE.Mesh(mergeAll(wood), look.timber);
  wm.castShadow = wm.receiveShadow = true;
  structure.add(wm);
  const bm = new THREE.Mesh(mergeAll(battens), look.timber);
  bm.castShadow = bm.receiveShadow = true;
  structure.add(bm);

  // the bars under the machine's feet: the rail's, the spacers', the tank's two, the straps': on the tiles, in the machine's own frame
  const bars: THREE.BufferGeometry[] = [];
  const bar = group('machine-bars');
  bar.position.set(0, HOUSE_FOOT.y, HOUSE_FOOT.z);
  bar.rotation.x = TILT;
  bar.updateMatrix();
  for (const s of [-0.2, 0.015, 1.97, 2.05, 2.4, 2.48]) {
    const g = box(-1.07, 1.07, -RIG.battenH, 0, -s - RIG.battenW / 2, -s + RIG.battenW / 2);
    g.applyMatrix4(bar.matrix);
    bars.push(g);
  }
  const barMesh = new THREE.Mesh(mergeAll(bars), look.timber);
  barMesh.castShadow = barMesh.receiveShadow = true;
  structure.add(barMesh);
  return { tiles, structure };
}
