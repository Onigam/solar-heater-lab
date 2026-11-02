// The sun, a tilted plane, a glazed collector and the night sky. Pure functions of plain numbers, SI, temperatures in °C, angles in degrees at the
// interface. `sunTerms` precomputes what does not change during a day, so that reading the sun at each step is a few multiplications.

const RAD = Math.PI / 180;

/** Solar constant, W/m². */
export const SOLAR_CONSTANT = 1361;

/** Declination, degrees, for a day of the year (1 to 365), Cooper's formula. */
export const declination = (day: number): number => 23.45 * Math.sin((2 * Math.PI * (284 + day)) / 365);

/** Extraterrestrial normal irradiance on a day of the year, W/m². */
export const extraterrestrial = (day: number): number =>
  SOLAR_CONSTANT * (1 + 0.033 * Math.cos((2 * Math.PI * day) / 365));

/** What does not move during a day, for one place and one plane. */
export interface SunTerms {
  /** cos(incidence) = a + b·cos ω + c·sin ω. */
  a: number;
  b: number;
  c: number;
  /** cos(zenith) = d + e·cos ω. */
  d: number;
  e: number;
  latitude: number;
  decl: number;
  normal: number;
  /** cos(tilt), for the view factors. */
  cosTilt: number;
}

/**
 * Prepare a day. `azimuth` is the plane's, degrees away from the equator (0 faces it, Duffie and Beckman's convention), `latitude` positive north.
 * Southern latitudes are not handled here: mirror the azimuth and flip the sign of latitude and declination in the caller.
 */
export function sunTerms(latitude: number, day: number, tilt: number, azimuth = 0): SunTerms {
  const phi = latitude * RAD;
  const b = tilt * RAD;
  const g = azimuth * RAD;
  const decl = declination(day);
  const dl = decl * RAD;
  const sd = Math.sin(dl);
  const cd = Math.cos(dl);
  const sp = Math.sin(phi);
  const cp = Math.cos(phi);
  const sb = Math.sin(b);
  const cb = Math.cos(b);
  return {
    a: sd * sp * cb - sd * cp * sb * Math.cos(g),
    b: cd * cp * cb + cd * sp * sb * Math.cos(g),
    c: cd * sb * Math.sin(g),
    d: sd * sp,
    e: cd * cp,
    latitude,
    decl,
    normal: extraterrestrial(day),
    cosTilt: cb,
  };
}

/** Hour angle of a solar hour, radians. */
export const hourAngle = (hour: number): number => (hour - 12) * 15 * RAD;

export const cosIncidence = (t: SunTerms, hour: number): number => {
  const w = hourAngle(hour);
  return t.a + t.b * Math.cos(w) + t.c * Math.sin(w);
};

export const cosZenith = (t: SunTerms, hour: number): number => t.d + t.e * Math.cos(hourAngle(hour));

/** Sun's altitude, degrees (negative below the horizon). */
export const sunAltitude = (t: SunTerms, hour: number): number => Math.asin(cosZenith(t, hour)) / RAD;

/** Sun's azimuth, degrees from the equator-side, positive towards the west. */
export function sunAzimuth(t: SunTerms, hour: number): number {
  const w = hourAngle(hour);
  const dl = t.decl * RAD;
  const phi = t.latitude * RAD;
  const y = Math.cos(dl) * Math.sin(w);
  const x = Math.cos(dl) * Math.sin(phi) * Math.cos(w) - Math.sin(dl) * Math.cos(phi);
  return Math.atan2(y, x) / RAD;
}

/** Air mass, Kasten and Young (1989). */
export function airMass(cosZ: number): number {
  if (cosZ <= 0) return Infinity;
  const zDeg = Math.acos(cosZ) / RAD;
  return 1 / (cosZ + 0.50572 * Math.pow(96.07995 - zDeg, -1.6364));
}

export interface PlaneIrradiance {
  beam: number;
  diffuse: number;
  cosTheta: number;
}

/**
 * Irradiance on the plane under a clear sky, W/m². Beam: Meinel's 0.7^(AM^0.678). Diffuse on the horizontal: a tenth of the beam at normal incidence
 * (the usual rule of thumb that goes with it); isotropic on the plane, with a ground that returns `albedo`.
 */
export function clearSkyPlane(t: SunTerms, hour: number, albedo = 0.2, out?: PlaneIrradiance): PlaneIrradiance {
  const r = out ?? { beam: 0, diffuse: 0, cosTheta: 0 };
  const cz = cosZenith(t, hour);
  if (cz <= 0.01) {
    r.beam = 0;
    r.diffuse = 0;
    r.cosTheta = 0;
    return r;
  }
  const am = airMass(cz);
  const bn = (t.normal * Math.pow(0.7, Math.pow(am, 0.678)) * 1361) / SOLAR_CONSTANT;
  const dh = 0.1 * bn;
  const gh = bn * cz + dh;
  const ct = cosIncidence(t, hour);
  r.cosTheta = ct;
  r.beam = bn * Math.max(0, ct);
  r.diffuse = (dh * (1 + t.cosTilt)) / 2 + (albedo * gh * (1 - t.cosTilt)) / 2;
  return r;
}

/** A collector's efficiency curve, ISO 9806 second-order form, on one area, referred to the inlet. */
export interface CollectorCurve {
  eta0: number;
  /** W/m²·K. */
  a1: number;
  /** W/m²·K². */
  a2: number;
}

/** Efficiency at a reduced temperature x = (T − Ta)/G, W⁻¹m²K, at irradiance G. */
export const curveEfficiency = (c: CollectorCurve, x: number, G: number): number =>
  c.eta0 - c.a1 * x - c.a2 * G * x * x;

/** The rise above the air at which the curve reaches zero: the stagnation rise, K. */
export function stagnationRise(c: CollectorCurve, G: number): number {
  if (c.a2 <= 0) return (c.eta0 * G) / c.a1;
  // a2·ΔT² + a1·ΔT − η0·G = 0
  return (-c.a1 + Math.sqrt(c.a1 * c.a1 + 4 * c.a2 * c.eta0 * G)) / (2 * c.a2);
}

/** Incidence-angle modifier: `[angle in degrees, K]` straight between its points, 1 at normal incidence, 0 at 90°. */
export function incidenceModifier(table: readonly (readonly [number, number])[], thetaDeg: number): number {
  if (thetaDeg <= 0) return 1;
  let x0 = 0;
  let y0 = 1;
  for (const [x1, y1] of table) {
    if (thetaDeg <= x1) return y0 + ((y1 - y0) * (thetaDeg - x0)) / (x1 - x0);
    x0 = x1;
    y0 = y1;
  }
  if (thetaDeg >= 90) return 0;
  return y0 * (1 - (thetaDeg - x0) / (90 - x0));
}

/** What a collector does locally at a point of the fluid: gain = F·G − u1·(T − Ta) − u2·(T − Ta)², per m² of the curve's area. */
export interface LocalCurve {
  F: number;
  u1: number;
  u2: number;
}

/** Heat one cell of area share 1/n gains at a temperature T: steady, implicit, the outlet from the inlet, for a capacity rate per area `m`. */
function cellOutlet(p: LocalCurve, Tin: number, G: number, m: number, n: number): number {
  // m·n·(T − Tin) = F·G − u1·T − u2·T² (T counted from the air)
  const a = p.u2;
  const b = m * n + p.u1;
  const c = -(p.F * G + m * n * Tin);
  if (a <= 1e-12) return -c / b;
  return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
}

/** Efficiency of `n` such cells in a row at a capacity rate per area `m`, W/m²·K. Referred to the inlet. */
export function cellsEfficiency(p: LocalCurve, x: number, G: number, m: number, n: number): number {
  const Tin = x * G;
  let T = Tin;
  for (let i = 0; i < n; i++) T = cellOutlet(p, T, G, m, n);
  return (m * (T - Tin)) / G;
}

/**
 * Turn a certified curve, valid at its test flow, into the local coefficients a chain of `n` cells needs, so that at the test flow the chain returns
 * the certificate at three points, whatever `n`. A certificate used as an input once, and then the flow is free: a slow fluid runs hotter, and loses more.
 * `m` is the test's capacity rate per area, W/m²·K (0.020 kg/s·m² of water: about 84).
 */
export function localCurve(c: CollectorCurve, m: number, n: number): LocalCurve {
  const G = 800;
  const xs = [0, 0.03, 0.06];
  const target = xs.map((x) => curveEfficiency(c, x, G));
  const p: LocalCurve = { F: c.eta0, u1: c.a1, u2: c.a2 };
  const residual = (q: LocalCurve): number[] => xs.map((x, i) => cellsEfficiency(q, x, G, m, n) - target[i]!);
  for (let iter = 0; iter < 8; iter++) {
    const r = residual(p);
    if (Math.max(Math.abs(r[0]!), Math.abs(r[1]!), Math.abs(r[2]!)) < 1e-10) break;
    // numeric Jacobian, solved by Cramer's rule
    const dF = 1e-5;
    const du1 = 1e-4;
    const du2 = 1e-6;
    const rF = residual({ ...p, F: p.F + dF });
    const r1 = residual({ ...p, u1: p.u1 + du1 });
    const r2 = residual({ ...p, u2: p.u2 + du2 });
    const J = [0, 1, 2].map((k) => [(rF[k]! - r[k]!) / dF, (r1[k]! - r[k]!) / du1, (r2[k]! - r[k]!) / du2]);
    const det3 = (m3: number[][]): number =>
      m3[0]![0]! * (m3[1]![1]! * m3[2]![2]! - m3[1]![2]! * m3[2]![1]!) -
      m3[0]![1]! * (m3[1]![0]! * m3[2]![2]! - m3[1]![2]! * m3[2]![0]!) +
      m3[0]![2]! * (m3[1]![0]! * m3[2]![1]! - m3[1]![1]! * m3[2]![0]!);
    const det = det3(J);
    const col = (j: number): number[][] => J.map((row, k) => row.map((v, i) => (i === j ? -r[k]! : v)));
    p.F += det3(col(0)) / det;
    p.u1 += det3(col(1)) / det;
    p.u2 += det3(col(2)) / det;
  }
  return p;
}

/** The linear-form removal factor at a capacity rate per area `m`: F_R/F' = (m/F'U)·(1 − exp(−F'U/m)). */
export const removalRatio = (FpU: number, m: number): number => (m / FpU) * (1 - Math.exp(-FpU / m));

/** The F'U_L behind a measured F_R·U_L at the test's capacity rate per area `m`. */
export const localLoss = (FrU: number, m: number): number => -m * Math.log(1 - FrU / m);

/** Sky temperature of a clear night, °C, Swinbank (1963): T_sky = 0.0552·T_a^1.5 in kelvins. */
export const skyTemperature = (Ta: number): number => 0.0552 * Math.pow(Ta + 273.15, 1.5) - 273.15;

/** Convective film on the outside of a glazing, W/m²·K (Watmuff's 2.8 + 3·v, for v in m/s). */
export const windFilm = (v: number): number => 2.8 + 3 * v;

const SIGMA = 5.670374e-8;

/** What a glazed plate exchanges at night. */
export interface NightPlate {
  /** Emissivity of the plate's coating and of the glass. */
  plateEmissivity: number;
  glassEmissivity?: number;
  /** Conduction through the still air under the glass, W/m²·K. */
  gapConductance?: number;
  /** Loss through the back and the edges, W/m²·K. */
  backU?: number;
}

/**
 * How far a glazed plate with no fluid moving falls below the air on a night, K: the steady balance of a chain from the plate to the glass, the glass
 * to the air and to the sky, the plate to the air through the back. `clear` 1 is a clear sky (Swinbank), 0 a cloud that sends back as much as the air.
 * Linear in the radiative coefficients at a mean temperature. Dew or frost on the glass would hold it up: not modelled.
 */
export function plateDepression(Ta: number, clear: number, wind: number, plate: NightPlate): number {
  const skyDrop = clear * (Ta - skyTemperature(Ta));
  if (skyDrop <= 0) return 0;
  const eg = plate.glassEmissivity ?? 0.88;
  const ep = plate.plateEmissivity;
  const gap = plate.gapConductance ?? 1;
  const back = plate.backU ?? 1;
  const TK = Ta + 273.15;
  const h4 = 4 * SIGMA * TK * TK * TK;
  const hSky = eg * h4;
  const hPlate = (1 / (1 / ep + 1 / eg - 1)) * h4 + gap;
  const hAir = windFilm(wind);
  // y = plate − air, x = glass − air: hPlate(x − y) = back·y, hAir·x + hSky(x + skyDrop) = hPlate(y − x)
  const share = hPlate / (hPlate + back);
  const x = -(hSky * skyDrop) / (hAir + hSky + hPlate * (1 - share));
  return -share * x;
}
