import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';

// The setting's procedural textures, DataTextures all (no asset, no canvas, so they build in Node): rubble stone, cobbles, packed earth, plaster, the wood of a beam, terracotta. Each covers a known size in
// metres and is applied by the geometry's UVs in metres, so a stone is the size of a stone from every side. No pattern in fine bright dots on a dark ground: packed shapes of near tones, the mistake that made
// gravel read as polka dots in the last lab.

type RGB = readonly [number, number, number];

function texture(data: Uint8Array, n: number, sRGB = true): THREE.DataTexture {
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  if (sRGB) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

/** Value noise on a torus of `size` cells: a texture made of it tiles. */
function periodicNoise(seed: number, size: number): (x: number, y: number) => number {
  const r = rng(seed);
  const v = new Float32Array(size * size);
  for (let i = 0; i < v.length; i++) v[i] = r();
  const s = (t: number) => t * t * (3 - 2 * t);
  return (x, y) => {
    const X = x * size;
    const Y = y * size;
    const x0 = Math.floor(X);
    const y0 = Math.floor(Y);
    const fx = s(X - x0);
    const fy = s(Y - y0);
    const at = (i: number, j: number) => v[(((j % size) + size) % size) * size + (((i % size) + size) % size)];
    return (
      (at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx) * (1 - fy) +
      (at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx) * fy
    );
  };
}

/** Courses of stones of many widths, a mortar line between them, each stone its own tone: `tile` metres square. Returns colour and the bump. */
export function rubbleStone(seed = 11, N = 512): { map: THREE.DataTexture; bump: THREE.DataTexture; tile: number } {
  const r = rng(seed);
  const colour = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  // courses, each with its own height and its stones
  const courses: { y0: number; y1: number; xs: number[]; tone: number[] }[] = [];
  let y = 0;
  while (y < N) {
    const h = Math.min(N - y, Math.round(26 + r() * 34));
    const last = N - (y + h) < 26;
    const hh = last ? N - y : h;
    const xs: number[] = [];
    let x = r() * 40;
    const x0 = x;
    while (x < x0 + N - 30) {
      xs.push(x);
      x += 34 + r() * 70;
    }
    courses.push({ y0: y, y1: y + hh, xs, tone: xs.map(() => r()) });
    y += hh;
  }
  const n1 = periodicNoise(seed + 1, 32);
  const n2 = periodicNoise(seed + 2, 128);
  const warm: RGB = [168, 148, 122];
  const pale: RGB = [186, 168, 142];
  const dark: RGB = [146, 130, 108];
  const mortar: RGB = [138, 126, 108];
  for (const c of courses) {
    for (let j = c.y0; j < c.y1; j++) {
      const dy = Math.min(j - c.y0, c.y1 - 1 - j);
      for (let i = 0; i < N; i++) {
        // the stone of this course that holds x
        let k = 0;
        const X = i;
        for (let q = 0; q < c.xs.length; q++) if (c.xs[q] <= X || c.xs[q] - N <= X - N) k = q;
        if (X < c.xs[0]) k = c.xs.length - 1;
        const left = X >= c.xs[k] ? X - c.xs[k] : X + N - c.xs[k];
        const nextX = k + 1 < c.xs.length ? c.xs[k + 1] : c.xs[0] + N;
        const right = X >= c.xs[k] ? nextX - X : nextX - N - X;
        const edge = Math.min(left, right, dy + 0.5);
        const wobble = n2(i / N, j / N) * 3.5;
        const inMortar = edge + wobble < 3.8;
        const t = c.tone[k];
        const base = t < 0.5 ? mix3(dark, warm, t * 2) : mix3(warm, pale, (t - 0.5) * 2);
        const grain = 0.9 + 0.2 * n1(i / N, j / N) * n2(i / N + 0.3, j / N + 0.7) + 0.05 * n2(i / N, j / N);
        const col = inMortar ? mortar : [base[0] * grain, base[1] * grain, base[2] * grain];
        const p = (j * N + i) * 4;
        colour[p] = clamp8(col[0]);
        colour[p + 1] = clamp8(col[1]);
        colour[p + 2] = clamp8(col[2]);
        colour[p + 3] = 255;
        const h = inMortar ? 40 : clamp8(120 + 90 * Math.min(1, edge / 10) + 40 * n2(i / N, j / N) + 30 * t);
        bump[p] = bump[p + 1] = bump[p + 2] = h;
        bump[p + 3] = 255;
      }
    }
  }
  return { map: texture(colour, N), bump: texture(bump, N, false), tile: 3.2 };
}

const mix3 = (a: RGB, b: RGB, t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];
const clamp8 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

/** Packed cobbles of a street, a jittered grid of many sizes, each its tone, thin dark joints: `tile` metres square. */
export function cobbles(seed = 21, N = 512): { map: THREE.DataTexture; bump: THREE.DataTexture; tile: number } {
  const r = rng(seed);
  const G = 18;
  const cx = new Float32Array(G * G);
  const cy = new Float32Array(G * G);
  const tone = new Float32Array(G * G);
  for (let j = 0; j < G; j++)
    for (let i = 0; i < G; i++) {
      cx[j * G + i] = (i + 0.5 + (r() - 0.5) * 0.7) / G;
      cy[j * G + i] = (j + 0.5 + (r() - 0.5) * 0.7) / G;
      tone[j * G + i] = r();
    }
  const colour = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  const n2 = periodicNoise(seed + 2, 96);
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const u = i / N;
      const v = j / N;
      const gi = Math.floor(u * G);
      const gj = Math.floor(v * G);
      let d1 = 9;
      let d2 = 9;
      let best = 0;
      for (let b = -1; b <= 1; b++)
        for (let a = -1; a <= 1; a++) {
          const ii = (gi + a + G) % G;
          const jj = (gj + b + G) % G;
          let dx = Math.abs(cx[jj * G + ii] - u);
          let dy = Math.abs(cy[jj * G + ii] - v);
          if (dx > 0.5) dx = 1 - dx;
          if (dy > 0.5) dy = 1 - dy;
          const d = Math.hypot(dx, dy);
          if (d < d1) {
            d2 = d1;
            d1 = d;
            best = jj * G + ii;
          } else if (d < d2) d2 = d;
        }
      const gap = (d2 - d1) * G;
      const t = tone[best];
      const stone = mix3([136, 126, 112], [164, 152, 136], t);
      const g = 0.9 + 0.2 * n2(u, v);
      const joint = Math.max(0, Math.min(1, gap / 0.14));
      const k = (j * N + i) * 4;
      colour[k] = clamp8(stone[0] * g * joint + 70 * (1 - joint));
      colour[k + 1] = clamp8(stone[1] * g * joint + 62 * (1 - joint));
      colour[k + 2] = clamp8(stone[2] * g * joint + 54 * (1 - joint));
      colour[k + 3] = 255;
      const h = clamp8(70 + 160 * Math.min(1, gap / 0.3));
      bump[k] = bump[k + 1] = bump[k + 2] = h;
      bump[k + 3] = 255;
    }
  }
  return { map: texture(colour, N), bump: texture(bump, N, false), tile: 3 };
}

/** Lime plaster: a pale wash with slow blotches, for the rooms and the rendered walls. */
export function limewash(seed: number, tint: RGB, N = 256): THREE.DataTexture {
  const n1 = periodicNoise(seed, 8);
  const n2 = periodicNoise(seed + 1, 48);
  const d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const g = 0.97 + 0.05 * n1(i / N, j / N) + 0.02 * n2(i / N, j / N);
      const k = (j * N + i) * 4;
      d[k] = clamp8(tint[0] * g);
      d[k + 1] = clamp8(tint[1] * g);
      d[k + 2] = clamp8(tint[2] * g);
      d[k + 3] = 255;
    }
  return texture(d, N);
}

/** The long grain of a sawn beam: stripes along V, knots left out. */
export function woodGrain(seed: number, tint: RGB, N = 256): THREE.DataTexture {
  const n1 = periodicNoise(seed, 64);
  const d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const g = 0.82 + 0.3 * n1(i / N, ((j / N) * 0.1) % 1) + 0.06 * Math.sin((i / N) * 60 + 4 * n1(i / N, j / N));
      const k = (j * N + i) * 4;
      d[k] = clamp8(tint[0] * g);
      d[k + 1] = clamp8(tint[1] * g);
      d[k + 2] = clamp8(tint[2] * g);
      d[k + 3] = 255;
    }
  return texture(d, N);
}

/** Olive leaves on a card: narrow pointed leaves on a transparent ground, two greens. For alpha-tested sprays. */
export function leafCard(seed: number, light: RGB, dark: RGB, leaves = 70, N = 128, narrow = 0.2): THREE.DataTexture {
  const r = rng(seed);
  const d = new Uint8Array(N * N * 4);
  for (let l = 0; l < leaves; l++) {
    const a = r() * Math.PI * 2;
    const cx = 0.14 + r() * 0.72;
    const cy = 0.14 + r() * 0.72;
    const len = 0.1 + r() * 0.1;
    const wid = len * narrow;
    const t = r();
    const col = mix3(dark, light, t);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x0 = Math.floor((cx - len) * N);
    const x1 = Math.ceil((cx + len) * N);
    const y0 = Math.floor((cy - len) * N);
    const y1 = Math.ceil((cy + len) * N);
    for (let j = Math.max(0, y0); j < Math.min(N, y1); j++)
      for (let i = Math.max(0, x0); i < Math.min(N, x1); i++) {
        const dx = i / N - cx;
        const dy = j / N - cy;
        const u = (dx * ca + dy * sa) / len;
        const v = (-dx * sa + dy * ca) / wid;
        if (u * u + v * v > 1) continue;
        const k = (j * N + i) * 4;
        // the midrib a touch paler, the underside's silver in the lighter leaves
        const rib = Math.abs(v) < 0.12 ? 1.1 : 1;
        d[k] = clamp8(col[0] * rib);
        d[k + 1] = clamp8(col[1] * rib);
        d[k + 2] = clamp8(col[2] * rib);
        d[k + 3] = 255;
      }
  }
  const t = texture(d, N);
  return t;
}

/** A tile roof seen from the next house: rows of pans and caps as light and shade, each tile its tone. Colour and bump, `tile` metres square. */
export function roofTiles(seed = 81, N = 256): { map: THREE.DataTexture; bump: THREE.DataTexture; tile: number } {
  const r = rng(seed);
  const COLS = 10;
  const ROWS = 7;
  const tone = new Float32Array(COLS * ROWS);
  for (let i = 0; i < tone.length; i++) tone[i] = r();
  const colour = new Uint8Array(N * N * 4);
  const bump = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) {
    const v = (j / N) * ROWS;
    const row = Math.floor(v);
    const fv = v - row;
    for (let i = 0; i < N; i++) {
      const u = (i / N) * COLS + (row % 2) * 0;
      const col = Math.floor(u);
      const fu = u - col;
      // a round profile across each tile, pans and caps turn about: a dark groove between them, a shadow where a row laps the next
      const crest = Math.sin(fu * Math.PI);
      const isCap = col % 2 === 0;
      const h = isCap ? crest : 0.35 * crest;
      const lap = fv < 0.14 ? 0.62 + 2.7 * fv : 1;
      const t = tone[row * COLS + col];
      const base = mix3([140, 80, 54], [176, 110, 74], t);
      const lit = (0.84 + 0.18 * h) * (0.5 + 0.5 * lap);
      const k = (j * N + i) * 4;
      colour[k] = clamp8(base[0] * lit);
      colour[k + 1] = clamp8(base[1] * lit);
      colour[k + 2] = clamp8(base[2] * lit);
      colour[k + 3] = 255;
      const b = clamp8(60 + 170 * h * lap);
      bump[k] = bump[k + 1] = bump[k + 2] = b;
      bump[k + 3] = 255;
    }
  }
  return { map: texture(colour, N), bump: texture(bump, N, false), tile: 2.15 };
}
