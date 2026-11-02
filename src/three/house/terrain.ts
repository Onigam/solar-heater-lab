import * as THREE from 'three';
import { grassDetail, rng } from '@onigam/lab-kit/three';

// The ground of the village: flat where the houses stand, rising into terraced hills. Its height is a function that the far trees and the neighbours also read. Vertex colours: dry grass and earth; the kit's
// `grassDetail` gives it patches and tufts up close. The street and the garden are laid over it by the scene.

/** A smooth noise, for hills. */
function hills(x: number, z: number): number {
  const n = (a: number, b: number) =>
    Math.sin(a * 0.013 + 1.3) * Math.cos(b * 0.017 + 0.7) +
    0.5 * Math.sin(a * 0.031 + b * 0.024 + 2.1) +
    0.25 * Math.sin(a * 0.071 - b * 0.058);
  return n(x, z);
}

const smooth = (a: number, b: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Height of the ground, m. Zero around the village, then hills behind it, and more to the sides. */
export function groundHeight(x: number, z: number): number {
  const d = Math.hypot(x * 0.8, z);
  const rise = smooth(34, 170, d);
  const north = smooth(-30, -170, z);
  return rise * (2.5 + 5 * (hills(x, z) + 1)) + north * 11 + smooth(120, 520, d) * 46;
}

export function buildGround(): THREE.Mesh {
  const size = 1100;
  const seg = 180;
  const g = new THREE.PlaneGeometry(size, size, seg, seg);
  g.rotateX(-Math.PI / 2);
  // finer near the village: the grid is squeezed towards the centre
  const p = g.attributes.position;
  const col = new Float32Array(p.count * 3);
  const dry = new THREE.Color(0x8d8253);
  const green = new THREE.Color(0x6f7a48);
  const earth = new THREE.Color(0x8c7350);
  const c = new THREE.Color();
  const r = rng(5);
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i);
    let z = p.getZ(i);
    const k = (v: number) => Math.sign(v) * (size / 2) * Math.pow(Math.abs(v) / (size / 2), 1.9);
    x = k(x);
    z = k(z);
    const y = groundHeight(x, z);
    p.setXYZ(i, x, y, z);
    const m = 0.5 + 0.5 * Math.sin(x * 0.08 + z * 0.05) * Math.cos(z * 0.11 - x * 0.03);
    c.copy(dry)
      .lerp(green, m * 0.7)
      .lerp(earth, Math.max(0, r() * 0.25));
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.98, name: 'ground' });
  grassDetail(mat);
  const m = new THREE.Mesh(g, mat);
  m.receiveShadow = true;
  m.name = 'ground';
  return m;
}

/** Terrace walls on the hills, seen from afar: long low bands of pale stone following the ground. */
export function terraces(): THREE.Mesh {
  const r = rng(77);
  const pos: number[] = [];
  const idx: number[] = [];
  let k = 0;
  for (let row = 0; row < 10; row++) {
    const z0 = -80 - row * 36 + r() * 8;
    const x0 = -130 + r() * 40;
    const x1 = 150 - r() * 50;
    const n = 26;
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const z = z0 + Math.sin(x * 0.03 + row) * 4;
      const y = groundHeight(x, z);
      pos.push(x, y - 0.1, z, x, y + 0.85, z);
      if (i < n) idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
      k += 2;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({ color: 0x9b8f70, roughness: 0.96, side: THREE.DoubleSide, name: 'terrace' }),
  );
  m.receiveShadow = false;
  return m;
}
