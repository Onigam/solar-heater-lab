// A fluid tank in layers: their sizes, the mixing of what is unstable (the same pass as `buoyancyMix`, with a preset workspace for a step that runs many times
// a frame), a draw from the top, and a heat that goes to the level of its own temperature. Layer 0 is the bottom one.

export interface TankLayers {
  readonly n: number;
  /** Heights of the layer edges from the bottom, m. */
  readonly zEdges: Float64Array;
  /** Volume of each layer, m³. */
  readonly volume: Float64Array;
  /** Area of the wall around each layer, ends included, m². */
  readonly wallArea: Float64Array;
  /** Plan area of the interface above each layer, m² (n−1 values). */
  readonly interfaceArea: Float64Array;
  /** Height of the tank, m. */
  readonly height: number;
}

/** Layers of equal height in a horizontal cylinder: circular segments. */
export function horizontalCylinderLayers(D: number, L: number, n: number): TankLayers {
  const R = D / 2;
  const zEdges = new Float64Array(n + 1);
  const volume = new Float64Array(n);
  const wallArea = new Float64Array(n);
  const interfaceArea = new Float64Array(Math.max(0, n - 1));
  const segment = (h: number): number => {
    const u = Math.max(-1, Math.min(1, (R - h) / R));
    return R * R * Math.acos(u) - (R - h) * Math.sqrt(Math.max(0, 2 * R * h - h * h));
  };
  const arc = (h: number): number => 2 * R * Math.acos(Math.max(-1, Math.min(1, (R - h) / R)));
  for (let i = 0; i < n; i++) {
    const z0 = (D * i) / n;
    const z1 = (D * (i + 1)) / n;
    zEdges[i] = z0;
    zEdges[i + 1] = z1;
    const area = segment(z1) - segment(z0);
    volume[i] = area * L;
    wallArea[i] = (arc(z1) - arc(z0)) * L + 2 * area;
    if (i < n - 1) interfaceArea[i] = 2 * Math.sqrt(Math.max(0, 2 * R * z1 - z1 * z1)) * L;
  }
  return { n, zEdges, volume, wallArea, interfaceArea, height: D };
}

/** Layers of equal height in a vertical cylinder. */
export function verticalCylinderLayers(D: number, H: number, n: number): TankLayers {
  const area = (Math.PI * D * D) / 4;
  const zEdges = new Float64Array(n + 1);
  const volume = new Float64Array(n).fill((area * H) / n);
  const wallArea = new Float64Array(n);
  const interfaceArea = new Float64Array(Math.max(0, n - 1)).fill(area);
  for (let i = 0; i < n; i++) {
    zEdges[i] = (H * i) / n;
    zEdges[i + 1] = (H * (i + 1)) / n;
    wallArea[i] = (Math.PI * D * H) / n + (i === 0 || i === n - 1 ? area : 0);
  }
  return { n, zEdges, volume, wallArea, interfaceArea, height: H };
}

/** The layer at a height from the bottom, clamped to the tank. */
export function layerAt(layers: TankLayers, z: number): number {
  const { n, zEdges } = layers;
  for (let i = 0; i < n; i++) if (z < zEdges[i + 1]!) return i;
  return n - 1;
}

/** Work space of `stabilize`. */
export interface MixWork {
  readonly start: Int32Array;
  readonly pool: Float64Array;
  readonly weight: Float64Array;
}

export const createMixWork = (n: number): MixWork => ({
  start: new Int32Array(n),
  pool: new Float64Array(n),
  weight: new Float64Array(n),
});

/** The pass of `buoyancyMix` (stratify.ts): the closest stable column, Σw·T kept, in place. A first scan makes the common case free. Returns true if it moved. */
export function stabilize(T: Float64Array, w: ArrayLike<number>, work: MixWork): boolean {
  const n = T.length;
  let unstable = false;
  for (let i = 1; i < n; i++) {
    if (T[i - 1]! > T[i]!) {
      unstable = true;
      break;
    }
  }
  if (!unstable) return false;
  const { start, pool, weight } = work;
  let m = 0;
  for (let i = 0; i < n; i++) {
    let s = i;
    let t = T[i]!;
    let c = w[i]!;
    while (m > 0 && pool[m - 1]! > t) {
      m--;
      const w0 = weight[m]!;
      t = (pool[m]! * w0 + t * c) / (w0 + c);
      c += w0;
      s = start[m]!;
    }
    start[m] = s;
    pool[m] = t;
    weight[m] = c;
    m++;
  }
  for (let b = 0; b < m; b++) {
    const end = b + 1 < m ? start[b + 1]! : n;
    for (let i = start[b]!; i < end; i++) T[i] = pool[b]!;
  }
  return true;
}

/**
 * Draw from the top, a colder fluid coming in at the bottom: plug flow, upwind, at a capacity `mc` (ρ·c·V of the draw, J/K). `w` are the capacities of the
 * layers. Returns the mean temperature drawn. Substeps so that no layer is emptied at once.
 */
export function drawFromTop(T: Float64Array, w: ArrayLike<number>, mc: number, Tin: number): number {
  if (mc <= 0) return T[T.length - 1]!;
  const n = T.length;
  let minW = Infinity;
  for (let i = 0; i < n; i++) if (w[i]! < minW) minW = w[i]!;
  const steps = Math.max(1, Math.ceil(mc / (0.7 * minW)));
  const part = mc / steps;
  let out = 0;
  for (let s = 0; s < steps; s++) {
    out += T[n - 1]!;
    for (let i = n - 1; i > 0; i--) T[i] = T[i]! + (part / w[i]!) * (T[i - 1]! - T[i]!);
    T[0] = T[0]! + (part / w[0]!) * (Tin - T[0]!);
  }
  return out / steps;
}

/** Mix the bottom layers that hold a share `fraction` of the volume, in place: an inlet's jet. Returns the number of layers mixed. */
export function mixInlet(T: Float64Array, w: ArrayLike<number>, volume: ArrayLike<number>, fraction: number): number {
  const n = T.length;
  let total = 0;
  for (let i = 0; i < n; i++) total += volume[i]!;
  let sum = 0;
  let k = 0;
  let e = 0;
  let c = 0;
  while (k < n) {
    if (sum >= fraction * total && k > 0) break;
    sum += volume[k]!;
    e += w[k]! * T[k]!;
    c += w[k]!;
    k++;
  }
  if (k <= 1) return k;
  const Tm = e / c;
  for (let i = 0; i < k; i++) T[i] = Tm;
  return k;
}

/**
 * The layer a heat exchanged at a wall goes to. A warm wall makes a warm film that rises to where the water is as warm as itself: the highest layer, from `from`
 * up, still cooler than `Twall`. A cold wall makes a cold film that sinks: the lowest layer, from `from` down, still warmer. This is what keeps a jacket from
 * mixing the tank, and it is not free: `from` itself is returned when nothing qualifies.
 */
export function neutralLayer(T: ArrayLike<number>, from: number, Twall: number, heating: boolean): number {
  const n = T.length;
  if (heating) {
    let k = from;
    for (let i = n - 1; i > from; i--) {
      if (T[i]! < Twall) {
        k = i;
        break;
      }
    }
    return k;
  }
  let k = from;
  for (let i = 0; i < from; i++) {
    if (T[i]! > Twall) {
      k = i;
      break;
    }
  }
  return k;
}
