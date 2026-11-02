// Liquids as heat carriers whose density matters: a closed loop driven by buoyancy has no push at all with a constant density, which is what
// `liquidWater()` of material.ts has. Temperatures in °C, SI otherwise. Lookups are tabulated once and read by straight interpolation, so that a
// step that reads twenty densities stays cheap on a phone.

export interface Fluid {
  readonly name: string;
  /** Specific heat, J/kg·K: one value per fluid, so that a node's energy is its capacity times its temperature. */
  readonly cp: number;
  /** Conductivity, W/m·K. */
  readonly k: number;
  /** Freezing point, °C: where the first crystals form. */
  readonly freezeT: number;
  /** Density, kg/m³. */
  rho(T: number): number;
  /** Dynamic viscosity, Pa·s. */
  mu(T: number): number;
}

/** Water at about atmospheric pressure, Kell (1975), kg/m³. T in °C. Good from 0 to 150 °C; it carries on smoothly a few kelvins under 0. */
export function waterRho(T: number): number {
  const n =
    999.83952 + T * (16.945176 + T * (-7.9870401e-3 + T * (-46.170461e-6 + T * (105.56302e-9 + T * -280.54253e-12))));
  return n / (1 + 16.87985e-3 * T);
}

/**
 * Water's viscosity, Pa·s: the usual Vogel fit, 2.414e-5 · 10^(247.8/(T_K − 140)). Within 2.5 % of the IAPWS values from 0 to 100 °C (tested at the
 * table's points). IAPWS's full correlation is far more than a buoyant loop needs.
 */
export const waterMu = (T: number): number => 2.414e-5 * Math.pow(10, 247.8 / (T + 273.15 - 140));

/** Density of a propylene glycol and water mix, kg/m³: mass fraction across (0 to 60 %), temperature down (0 to 100 °C). Engineering ToolBox, read 2/11/2026. */
const GLYCOL_RHO_T = [0, 20, 40, 60, 80, 100];
const GLYCOL_RHO: readonly (readonly [number, readonly number[]])[] = [
  [0, [1000, 998, 993, 983, 972, 958]],
  [10, [1012, 1006, 998, 988, 976, 965]],
  [20, [1022, 1014, 1004, 992, 980, 967]],
  [30, [1031, 1022, 1010, 997, 983, 969]],
  [40, [1041, 1030, 1016, 1002, 987, 971]],
  [50, [1051, 1038, 1023, 1006, 990, 974]],
  [60, [1061, 1046, 1029, 1011, 994, 976]],
];

/** Specific heat of the same mix near 16 °C, as a share of water's. Engineering ToolBox, read 2/11/2026. */
const GLYCOL_CP: readonly (readonly [number, number])[] = [
  [0, 1],
  [10, 0.98],
  [20, 0.96],
  [30, 0.935],
  [40, 0.895],
  [50, 0.85],
  [60, 0.805],
];

/**
 * Viscosity of the mix, mPa·s, by mass fraction and temperature. **An estimate**: typed from memory of the propylene-glycol tables of the
 * heat-transfer fluid makers and ASHRAE (no copy could be fetched), checked by eye against the one printed curve at hand, LBL-10699's Fig. 2 for 60 %
 * by weight, which it follows within the width of the line. Read between its points in the logarithm.
 */
const GLYCOL_MU_T = [-10, 5, 20, 40, 60, 80, 100];
const GLYCOL_MU: readonly (readonly [number, readonly number[]])[] = [
  [20, [6.5, 3.2, 1.9, 1.1, 0.75, 0.53, 0.42]],
  [30, [10.5, 5.0, 2.9, 1.55, 0.95, 0.66, 0.5]],
  [40, [18, 8.5, 4.3, 2.2, 1.25, 0.85, 0.6]],
  [50, [35, 14, 6.4, 3.0, 1.7, 1.1, 0.75]],
  [60, [65, 25, 10.5, 4.5, 2.4, 1.4, 0.95]],
];

/** The makers' freezing table of such a mix: °C by percentage (straight between its points). */
export const GLYCOL_FREEZE: readonly (readonly [number, number])[] = [
  [0, 0],
  [20, -7],
  [30, -13],
  [40, -22],
  [50, -34],
];

function lerpTable(table: readonly (readonly [number, number])[], x: number): number {
  const n = table.length;
  if (x <= table[0]![0]) return table[0]![1];
  for (let i = 1; i < n; i++) {
    if (x <= table[i]![0]) {
      const [x0, y0] = table[i - 1]!;
      const [x1, y1] = table[i]!;
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  // straight past the end, on the last slope
  const [x0, y0] = table[n - 2]!;
  const [x1, y1] = table[n - 1]!;
  return y1 + ((y1 - y0) * (x - x1)) / (x1 - x0);
}

/** Straight in `xs` between its points, and past both ends on the end slopes. */
function lerpRow(xs: readonly number[], ys: readonly number[], x: number): number {
  let i = 0;
  while (i < xs.length - 2 && x > xs[i + 1]!) i++;
  return ys[i]! + ((ys[i + 1]! - ys[i]!) * (x - xs[i]!)) / (xs[i + 1]! - xs[i]!);
}

/** Between the two rows of a table around a percentage, each row read at T by `read`. */
function acrossRows(
  rows: readonly (readonly [number, readonly number[]])[],
  pct: number,
  read: (row: readonly number[]) => number,
): number {
  let i = 0;
  while (i < rows.length - 2 && pct > rows[i + 1]![0]) i++;
  const [p0, r0] = rows[i]!;
  const [p1, r1] = rows[i + 1]!;
  const u = Math.max(0, Math.min(1, (pct - p0) / (p1 - p0)));
  return read(r0) + (read(r1) - read(r0)) * u;
}

export const glycolRho = (pct: number, T: number): number =>
  acrossRows(GLYCOL_RHO, pct, (row) => lerpRow(GLYCOL_RHO_T, row, T));

export function glycolMu(pct: number, T: number): number {
  // the logarithm of a viscosity in Pa·s
  const row = (p: number): number =>
    Math.log(1e-3) + acrossRows(GLYCOL_MU, p, (r) => lerpRow(GLYCOL_MU_T, r.map(Math.log), T));
  if (pct >= 20) return Math.exp(row(pct));
  // below the table: from water to the 20 % row, straight in the logarithm
  const w = Math.log(waterMu(T));
  return Math.exp(w + ((row(20) - w) * pct) / 20);
}

export const glycolFreeze = (pct: number): number => lerpTable(GLYCOL_FREEZE, pct);

const TABLE_MIN = -40;
const TABLE_MAX = 200;
const TABLE_STEP = 2;

interface FluidSpec {
  name: string;
  cp: number;
  k: number;
  freezeT: number;
  rho: (T: number) => number;
  mu: (T: number) => number;
}

/** A fluid with its density and viscosity read from tables of 2 K: in practice the same numbers, ten times cheaper. */
function tabulate(spec: FluidSpec): Fluid {
  const n = Math.round((TABLE_MAX - TABLE_MIN) / TABLE_STEP) + 1;
  const rhoT = new Float64Array(n);
  const muT = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const T = TABLE_MIN + i * TABLE_STEP;
    rhoT[i] = spec.rho(T);
    muT[i] = spec.mu(T);
  }
  const read = (table: Float64Array, T: number): number => {
    const x = (T - TABLE_MIN) / TABLE_STEP;
    if (x <= 0) return table[0]!;
    if (x >= n - 1) return table[n - 1]!;
    const i = x | 0;
    return table[i]! + (x - i) * (table[i + 1]! - table[i]!);
  };
  return {
    name: spec.name,
    cp: spec.cp,
    k: spec.k,
    freezeT: spec.freezeT,
    rho: (T) => read(rhoT, T),
    mu: (T) => read(muT, T),
  };
}

const CP_WATER = 4186;

let waterFluid: Fluid | null = null;
const mixes = new Map<number, Fluid>();

/** Water, with its real density and viscosity. Same specific heat and conductivity as `liquidWater()`. */
export function water(): Fluid {
  waterFluid ??= tabulate({ name: 'water', cp: CP_WATER, k: 0.6, freezeT: 0, rho: waterRho, mu: waterMu });
  return waterFluid;
}

/**
 * A mix of propylene glycol and water, by percentage. The sources give the same table by mass and by volume to within a point or two, so the two are
 * not told apart here. Cached by concentration: a table costs a few tens of microseconds.
 */
export function glycolMix(pct: number): Fluid {
  if (pct <= 0) return water();
  const key = Math.round(pct * 10) / 10;
  let f = mixes.get(key);
  if (!f) {
    f = tabulate({
      name: `glycol-${key}`,
      cp: CP_WATER * lerpTable(GLYCOL_CP, key),
      // straight from water's 0.6 to about 0.36 at 60 % (usual values, an estimate)
      k: 0.6 - 0.004 * key,
      freezeT: glycolFreeze(key),
      rho: (T) => glycolRho(key, T),
      mu: (T) => glycolMu(key, T),
    });
    mixes.set(key, f);
  }
  return f;
}

/** Volumetric expansion coefficient at T, 1/K, from the density table. */
export const expansion = (f: Fluid, T: number): number => (f.rho(T - 1) - f.rho(T + 1)) / (2 * f.rho(T));

/** Boiling point of pure water at a gauge pressure, °C (Antoine). Enough to know when a closed circuit is about to vent. */
export function boilingPoint(gaugePa: number): number {
  const mmHg = (gaugePa + 101325) / 133.322;
  return 1730.63 / (8.07131 - Math.log10(mmHg)) - 233.426;
}
