import * as THREE from 'three';
import { heatColor } from './heat';

// The dots of « Flux »: drops in the pipes, drawn over everything, each coloured by the model's temperature where it is. They run at the state's true speed (`pipeSpeed`, signed: research §0.4,
// « the dots run in real time »), on `view.slowMo`, scaled by the section each stretch offers the flow. A trickle would look still: while the state says the circuit flows (`flowDir`), they never run
// slower than `MIN_SPEED` in the pipes, and `docs/3d.md` says so. When it says still, they stand still.

export const MIN_SPEED = 0.008;

/** What the dots in the pipes run at, m/s, from the state's true speed and its direction. */
export function dotSpeed(pipeSpeed: number, flowDir: number): number {
  if (flowDir === 0) return 0;
  return flowDir * Math.max(MIN_SPEED, Math.abs(pipeSpeed));
}

export interface FlowPath {
  points: THREE.Vector3[];
  /** Speed against the pipes': the ratio of the sections. */
  ratio: number;
  /** °C at a share 0 to 1 along the path. */
  temperature: (t: number) => number;
  /** How many dots, against the path's length. */
  spacing?: number;
}

interface Live {
  cum: number[];
  length: number;
  path: FlowPath;
  u: number[];
  first: number;
}

let dotTexture: THREE.DataTexture | null = null;
function softDot(): THREE.DataTexture {
  if (dotTexture) return dotTexture;
  const n = 32;
  const data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const d = Math.hypot((i + 0.5) / n - 0.5, (j + 0.5) / n - 0.5) * 2;
      const a = Math.max(0, 1 - d);
      const k = (j * n + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * Math.min(1, a * 2.2));
    }
  }
  dotTexture = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  dotTexture.magFilter = THREE.LinearFilter;
  dotTexture.minFilter = THREE.LinearFilter;
  dotTexture.needsUpdate = true;
  return dotTexture;
}

export class FlowDots {
  readonly object: THREE.Points;
  private readonly live: Live[] = [];
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private total = 0;
  private readonly tmp = new THREE.Vector3();
  private readonly colour = new THREE.Color();

  constructor(
    private readonly max: number,
    size: number,
  ) {
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    g.setDrawRange(0, 0);
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: true,
      map: softDot(),
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    this.object = new THREE.Points(g, mat);
    this.object.frustumCulled = false;
    this.object.renderOrder = 20;
    this.object.castShadow = false;
    this.object.userData.noShadow = true;
    this.object.visible = false;
    this.object.name = 'flow-dots';
  }

  add(path: FlowPath): number {
    const cum = [0];
    for (let i = 1; i < path.points.length; i++) cum.push(cum[i - 1] + path.points[i].distanceTo(path.points[i - 1]));
    const length = cum[cum.length - 1];
    const spacing = path.spacing ?? 0.09;
    const n = Math.max(2, Math.min(this.max - this.total, Math.round(length / spacing)));
    const u: number[] = [];
    // each stretch its own phase: parallel risers would march in rows
    const phase = ((this.live.length * 0.6180339887) % 1) * (length / n);
    for (let i = 0; i < n; i++) u.push((length * i) / n + phase);
    this.live.push({ cum, length, path, u, first: this.total });
    this.total += n;
    this.object.geometry.setDrawRange(0, this.total);
    return this.live.length - 1;
  }

  /** New points for a path that moved; the dots keep their share of its length. */
  setPoints(index: number, points: THREE.Vector3[]): void {
    const l = this.live[index];
    const old = l.length || 1;
    const cum = [0];
    for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + points[i].distanceTo(points[i - 1]));
    l.cum = cum;
    l.length = cum[cum.length - 1];
    l.path.points = points;
    for (let i = 0; i < l.u.length; i++) l.u[i] = (l.u[i] / old) * l.length;
  }

  get count(): number {
    return this.total;
  }

  /** Move every dot `dt` seconds at `speed` (m/s in the pipes, signed), and write positions and colours. */
  step(speed: number, dt: number): void {
    for (const l of this.live) {
      if (l.length <= 0) continue;
      const v = speed * l.path.ratio;
      for (let i = 0; i < l.u.length; i++) {
        let u = (l.u[i] + v * dt) % l.length;
        if (u < 0) u += l.length;
        l.u[i] = u;
        this.place(l, u, l.first + i);
      }
    }
    this.object.geometry.attributes.position.needsUpdate = true;
    this.object.geometry.attributes.color.needsUpdate = true;
  }

  private place(l: Live, u: number, k: number): void {
    const { cum } = l;
    let lo = 0;
    let hi = cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] <= u) lo = mid;
      else hi = mid;
    }
    const seg = cum[hi] - cum[lo];
    this.tmp.lerpVectors(l.path.points[lo], l.path.points[hi], seg > 0 ? (u - cum[lo]) / seg : 0);
    this.pos[k * 3] = this.tmp.x;
    this.pos[k * 3 + 1] = this.tmp.y;
    this.pos[k * 3 + 2] = this.tmp.z;
    heatColor(l.path.temperature(u / l.length), this.colour);
    this.col[k * 3] = this.colour.r;
    this.col[k * 3 + 1] = this.colour.g;
    this.col[k * 3 + 2] = this.colour.b;
  }
}

/** A node's temperature along a stretch of the model's loop, by share of it. */
export function stretch(T: ArrayLike<number>, start: number, count: number, t: number): number {
  const i = Math.min(count - 1, Math.max(0, Math.floor(t * count)));
  return T[start + i] ?? 20;
}
