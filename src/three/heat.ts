import * as THREE from 'three';

// The false colour of the lab: one ramp, fixed in °C, so that a colour means the same in every world and at every moment: the risers of the `collector` world, the layers of the
// `tank-and-tap` world, the dots of the flows. Blue is cold and red is hot, the eye's own convention. Steel and water at 60 °C do not glow: the world's overview says it is a false colour, once.

/** The stops, °C and sRGB. Mains water at 10 °C, a tank at 60, the collector stagnating at 116 (physics §3). */
export const HEAT_STOPS: readonly (readonly [number, number])[] = [
  [-5, 0x26307a],
  [10, 0x2a62b8],
  [25, 0x1f9fa8],
  [40, 0x57b860],
  [50, 0xc6c63a],
  [60, 0xf0a52f],
  [75, 0xe8622a],
  [95, 0xc4222f],
  [120, 0x8a1763],
];
export const HEAT_MIN = HEAT_STOPS[0][0];
export const HEAT_MAX = HEAT_STOPS[HEAT_STOPS.length - 1][0];

const c0 = new THREE.Color();
const c1 = new THREE.Color();

/** The colour of a temperature, linear RGB. */
export function heatColor(T: number, out = new THREE.Color()): THREE.Color {
  const t = Math.min(HEAT_MAX, Math.max(HEAT_MIN, Number.isFinite(T) ? T : HEAT_MIN));
  for (let i = 0; i < HEAT_STOPS.length - 1; i++) {
    const [t0, h0] = HEAT_STOPS[i];
    const [t1, h1] = HEAT_STOPS[i + 1];
    if (t <= t1) return out.copy(c0.setHex(h0)).lerp(c1.setHex(h1), (t - t0) / (t1 - t0));
  }
  return out.setHex(HEAT_STOPS[HEAT_STOPS.length - 1][1]);
}

/**
 * A strip of temperatures as a one-pixel-wide texture, read along V with the geometry's own coordinate: the ten layers of the water, the 32 nodes of the risers. Written in linear
 * values into an 8-bit sRGB texture, as the material expects. `nearest` keeps the cells of the model apart: a layer is a layer. No canvas: it builds in Node.
 */
export class HeatStrip {
  readonly texture: THREE.DataTexture;
  private readonly data: Uint8Array;
  private readonly last: Float64Array;
  private readonly colour = new THREE.Color();
  constructor(
    readonly cells: number,
    nearest = false,
  ) {
    this.data = new Uint8Array(cells * 4);
    this.last = new Float64Array(cells).fill(NaN);
    this.texture = new THREE.DataTexture(this.data, 1, cells, THREE.RGBAFormat);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
    this.texture.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.fill(20);
  }
  fill(T: number): void {
    for (let i = 0; i < this.cells; i++) this.set(i, T);
    this.texture.needsUpdate = true;
  }
  private set(i: number, T: number): void {
    heatColor(T, this.colour).convertLinearToSRGB();
    const k = i * 4;
    this.data[k] = Math.round(this.colour.r * 255);
    this.data[k + 1] = Math.round(this.colour.g * 255);
    this.data[k + 2] = Math.round(this.colour.b * 255);
    this.data[k + 3] = 255;
  }
  /** The cells from `values`, starting at `from`: rewritten only when one has moved by a visible amount. */
  update(values: ArrayLike<number>, from = 0): void {
    let dirty = false;
    for (let i = 0; i < this.cells; i++) {
      const T = values[from + i];
      if (T === undefined) continue;
      if (!(Math.abs(T - this.last[i]) < 0.05)) {
        this.last[i] = T;
        this.set(i, T);
        dirty = true;
      }
    }
    if (dirty) this.texture.needsUpdate = true;
  }
}
