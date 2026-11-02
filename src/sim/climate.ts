import {
  clearSkyPlane,
  cosZenith,
  incidenceModifier,
  plateDepression,
  sunAltitude,
  sunAzimuth,
  sunTerms,
  type PlaneIrradiance,
  type SunTerms,
} from './thermal';
import type { MachineSpec } from './machine';

// The four sites of the Keymark table, and the weather of a day. The monthly shapes are PVGIS's; the Keymark annual table is what K21 rests on, so the monthly plane is scaled
// to Keymark's annual value and the air shifted to its annual mean (research K50): that is an assumption, supported by K52, and said once.

export type SiteId = 'athens' | 'wurzburg' | 'davos' | 'stockholm';
export const SITE_IDS: SiteId[] = ['athens', 'wurzburg', 'davos', 'stockholm'];

export interface Site {
  latitude: number;
  /** Slope of the Keymark standard location, degrees. */
  slope: number;
  /** Keymark's annual irradiation on that slope, kWh/m²; its annual air, °C. reported (S11). */
  planeAnnual: number;
  airAnnual: number;
  /** PVGIS 2010–2020 on that slope, kWh/m² per month, and the air, °C. reported (K50). */
  monthlyPlane: readonly number[];
  monthlyAir: readonly number[];
  /** Cold water behind K21's load, °C. derived (K52). */
  coldWater: number;
}

/** The cold water behind K21's load, °C: Qd at 200 L/day and a 45 °C load, derived (K52). */
const coldFrom = (QdMJ: number): number => 45 - (QdMJ * 1e6) / (200 * 365 * 4186);

export const SITES: Record<SiteId, Site> = {
  athens: {
    latitude: 38.0,
    slope: 25,
    planeAnnual: 1765,
    airAnnual: 18.5,
    monthlyPlane: [105, 113, 163, 192, 209, 216, 236, 232, 190, 154, 113, 99],
    monthlyAir: [9.2, 10.5, 12.5, 15.9, 20.4, 24.9, 27.8, 27.7, 23.9, 18.9, 15.0, 10.8],
    coldWater: coldFrom(8263),
  },
  wurzburg: {
    latitude: 49.5,
    slope: 35,
    planeAnnual: 1244,
    airAnnual: 9.0,
    monthlyPlane: [44, 69, 120, 160, 165, 169, 179, 165, 136, 92, 51, 38],
    monthlyAir: [1.2, 1.7, 5.5, 10.1, 13.6, 17.6, 19.8, 19.3, 14.9, 10.2, 5.3, 2.7],
    coldWater: coldFrom(10643),
  },
  davos: {
    latitude: 46.8,
    slope: 30,
    planeAnnual: 1630,
    airAnnual: 3.2,
    monthlyPlane: [93, 118, 177, 194, 187, 174, 181, 169, 147, 127, 93, 77],
    monthlyAir: [-11.3, -9.7, -5.6, -1.2, 1.7, 6.5, 9.0, 8.6, 4.9, 0.5, -4.9, -9.5],
    coldWater: coldFrom(12050),
  },
  stockholm: {
    latitude: 59.6,
    slope: 45,
    planeAnnual: 1166,
    airAnnual: 7.5,
    monthlyPlane: [23, 50, 113, 145, 173, 172, 172, 153, 114, 70, 29, 18],
    monthlyAir: [-2.0, -1.3, 1.1, 5.6, 10.8, 15.2, 18.0, 17.0, 13.0, 7.6, 3.7, 0.7],
    coldWater: coldFrom(11103),
  },
};

export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const MONTH_START = MONTH_DAYS.reduce<number[]>((a, _, i) => (a.push(i ? a[i - 1]! + MONTH_DAYS[i - 1]! : 0), a), []);
export const MID_MONTH = MONTH_DAYS.map((d, i) => MONTH_START[i]! + Math.ceil(d / 2));

/** The month of a day of the year counted from 0, 0 to 11. */
export function monthOfDay(day: number): number {
  const d = Math.floor(((day % 365) + 365) % 365);
  for (let m = 11; m >= 0; m--) if (d >= MONTH_START[m]!) return m;
  return 0;
}

/** Daily swing of the air, K: ±5.5 K, peak at 15:00, as in LBL's model. An assumption. */
export const AIR_SWING = 5.5;

/** The weather at one moment, for the plant. */
export interface WeatherNow {
  /** Irradiance on the plane, W/m². */
  G: number;
  /** The same after the incidence modifier: what the curve's η0 applies to. */
  Geff: number;
  /** Air, °C. */
  Ta: number;
  /** How far the plate would fall below the air with nothing moving, K: 0 by day. */
  depression: number;
  wind: number;
  sunAlt: number;
  sunAz: number;
}

export const newWeather = (): WeatherNow => ({ G: 0, Geff: 0, Ta: 15, depression: 0, wind: 2, sunAlt: 0, sunAz: 0 });

/** Whatever gives the weather: real sites, or a test day. */
export interface WeatherSource {
  /** The weather at a day of the year (0 to 364) and a solar hour, written in `out`. */
  at(day: number, hour: number, out: WeatherNow): void;
  /** How much sun fell on a day, on the plane, J/m². */
  dayIrradiation(day: number): number;
}

export type SkyMode = 'mean' | 'clear' | 'series';

export interface SkySettings {
  site: SiteId;
  sky: SkyMode;
  /** Live: a cloud in front of the sun, and of the night's sky, 0 to 1. */
  cloud: number;
  /** Shift of the air, K. */
  airOffset: number;
  wind: number;
  /** Seed of the day-to-day series. */
  seed: number;
}

export const DEFAULT_SKY: SkySettings = { site: 'athens', sky: 'mean', cloud: 0, airOffset: 0, wind: 2, seed: 1 };

/** A small seeded generator (mulberry32): the same series on any machine. The kit's `rng` lives with three.js, which the physics must not import. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const POINTS_PER_DAY = 96;

/** Beam share of a clear day's beam for a clearness c of the day: the beam goes first as the sky closes. An assumption, it only weighs through the incidence modifier. */
const beamShare = (c: number): number => Math.pow(Math.max(0, (Math.min(c, 1) - 0.2) / 0.8), 1.3);
/** Share of a clear night's sky, from the clearness of the day before. An assumption. */
const nightClear = (c: number): number => Math.max(0, Math.min(1, (c - 0.3) / 0.5));

/** The real sites: a month's irradiation on the plane in days of a clear sky's shape, at a clearness that gives the month's sum. */
export class SiteClimate implements WeatherSource {
  readonly site: Site;
  /** Monthly irradiation at this machine's tilt, Keymark's annual, J/m² per day. */
  readonly monthly = new Float64Array(12);
  /** A series of daily factors, mean 1 in each month. */
  readonly factors = new Float64Array(365);
  private dayNow = -1;
  private terms: SunTerms | null = null;
  private c = 1;
  private gBeam = new Float64Array(POINTS_PER_DAY + 1);
  private gDiff = new Float64Array(POINTS_PER_DAY + 1);
  private gEff = new Float64Array(POINTS_PER_DAY + 1);
  private hClear = 0;
  private ir: PlaneIrradiance = { beam: 0, diffuse: 0, cosTheta: 0 };
  private airOf: Float64Array;

  constructor(
    readonly settings: SkySettings,
    private readonly tilt: number,
    private readonly azimuth: number,
    private readonly iam: MachineSpec['iam'],
    private readonly plateEmissivity: number,
    private readonly skyTerm: boolean,
  ) {
    const site = SITES[settings.site];
    this.site = site;
    const scale = site.planeAnnual / site.monthlyPlane.reduce((a, b) => a + b, 0);
    const meanPvgis = site.monthlyAir.reduce((a, b, i) => a + b * MONTH_DAYS[i]!, 0) / 365;
    this.airOf = new Float64Array(365);
    for (let d = 0; d < 365; d++) {
      // the month's air, straight between mid-months, shifted to Keymark's annual
      let m = monthOfDay(d);
      if (d < MID_MONTH[m]!) m = (m + 11) % 12;
      const m1 = (m + 1) % 12;
      const d0 = MID_MONTH[m]!;
      const span = (MID_MONTH[m1]! - d0 + 365) % 365;
      const u = ((d - d0 + 365) % 365) / span;
      this.airOf[d] =
        site.monthlyAir[m]! + (site.monthlyAir[m1]! - site.monthlyAir[m]!) * u + site.airAnnual - meanPvgis;
    }
    for (let m = 0; m < 12; m++) {
      const onSlope = clearDayIrradiation(sunTerms(site.latitude, MID_MONTH[m]! + 1, site.slope, 0));
      const onPlane = clearDayIrradiation(sunTerms(site.latitude, MID_MONTH[m]! + 1, tilt, azimuth));
      this.monthly[m] = ((site.monthlyPlane[m]! * scale * 3.6e6) / MONTH_DAYS[m]!) * (onPlane / Math.max(onSlope, 1));
    }
    this.buildSeries(settings.seed);
  }

  /** A seeded series of days, clear and cloudy, that sums to the month: mean factor exactly 1. */
  private buildSeries(seed: number): void {
    const next = seeded(seed * 2654435761 + 97);
    let z = next() * 2 - 1;
    for (let m = 0; m < 12; m++) {
      const start = MONTH_START[m]!;
      const n = MONTH_DAYS[m]!;
      const hc = clearDayIrradiation(sunTerms(this.site.latitude, MID_MONTH[m]! + 1, this.tilt, this.azimuth));
      const k = Math.min(0.98, this.monthly[m]! / Math.max(hc, 1));
      let sum = 0;
      for (let i = 0; i < n; i++) {
        z = 0.5 * z + 0.87 * (next() * 2 - 1);
        const u = Math.max(-1, Math.min(1, z));
        const reach = u > 0 ? Math.min(1 - k, k - 0.05) : Math.min(k - 0.08, 1.2 * (1 - k) + 0.1);
        const c = k + u * reach;
        this.factors[start + i] = c / k;
        sum += c / k;
      }
      for (let i = 0; i < n; i++) this.factors[start + i]! /= sum / n;
    }
  }

  private prepare(day: number): void {
    if (day === this.dayNow) return;
    this.dayNow = day;
    const s = this.settings;
    const t = sunTerms(this.site.latitude, day + 1, this.tilt, this.azimuth);
    this.terms = t;
    this.hClear = clearDayIrradiation(t);
    const m = monthOfDay(day);
    const h =
      s.sky === 'clear' ? this.hClear : s.sky === 'series' ? this.monthly[m]! * this.factors[day]! : this.monthly[m]!;
    this.c = h / Math.max(this.hClear, 1);
    const b = beamShare(this.c);
    for (let i = 0; i <= POINTS_PER_DAY; i++) {
      const hour = (24 * i) / POINTS_PER_DAY;
      clearSkyPlane(t, hour, 0.2, this.ir);
      const beam = b * this.ir.beam;
      const total = this.c * (this.ir.beam + this.ir.diffuse);
      const diff = Math.max(0, total - beam);
      this.gBeam[i] = beam;
      this.gDiff[i] = diff;
      if (this.iam) {
        const theta = (Math.acos(Math.max(-1, Math.min(1, this.ir.cosTheta))) * 180) / Math.PI;
        // the diffuse sees the collector at about 60° (the Brandemuehl and Beckman rule for this tilt)
        this.gEff[i] = beam * incidenceModifier(this.iam, theta) + diff * incidenceModifier(this.iam, 60);
      } else this.gEff[i] = beam + diff;
    }
  }

  dayIrradiation(day: number): number {
    this.prepare(day);
    let e = 0;
    const dt = (24 * 3600) / POINTS_PER_DAY;
    for (let i = 0; i < POINTS_PER_DAY; i++) {
      e += ((this.gBeam[i]! + this.gDiff[i]! + this.gBeam[i + 1]! + this.gDiff[i + 1]!) * dt) / 2;
    }
    return e;
  }

  /** The clearness of the present day, 0 to about 1. */
  get clearness(): number {
    return this.c;
  }

  at(day: number, hour: number, out: WeatherNow): void {
    const d = Math.floor(((day % 365) + 365) % 365);
    this.prepare(d);
    const s = this.settings;
    const x = (hour / 24) * POINTS_PER_DAY;
    const i = Math.min(POINTS_PER_DAY - 1, Math.floor(x));
    const u = x - i;
    const beam = this.gBeam[i]! + u * (this.gBeam[i + 1]! - this.gBeam[i]!);
    const diff = this.gDiff[i]! + u * (this.gDiff[i + 1]! - this.gDiff[i]!);
    const eff = this.gEff[i]! + u * (this.gEff[i + 1]! - this.gEff[i]!);
    const open = 1 - 0.75 * s.cloud;
    out.G = (beam + diff) * open;
    out.Geff = eff * open;
    const air = this.airOf[d]! + AIR_SWING * Math.sin((2 * Math.PI * (hour - 9)) / 24) + s.airOffset;
    out.Ta = air;
    out.wind = s.wind;
    const t = this.terms!;
    out.sunAlt = sunAltitude(t, hour);
    out.sunAz = sunAzimuth(t, hour);
    // the night's sink fades in under about 50 W/m²
    if (this.skyTerm && out.G < 50) {
      const clear = nightClear(this.c) * (1 - s.cloud);
      const fade = 1 - out.G / 50;
      out.depression = fade * plateDepression(air, clear, s.wind, { plateEmissivity: this.plateEmissivity });
    } else out.depression = 0;
  }

  /** The air's mean of a month, as used. */
  monthAir(m: number): number {
    return this.airOf[MID_MONTH[m]!]!;
  }
}

/** Irradiation of a clear day on a plane, J/m². */
function clearDayIrradiation(t: SunTerms): number {
  let e = 0;
  const ir: PlaneIrradiance = { beam: 0, diffuse: 0, cosTheta: 0 };
  for (let i = 0; i < 96; i++) {
    const hour = (i + 0.5) / 4;
    if (cosZenith(t, hour) <= 0) continue;
    clearSkyPlane(t, hour, 0.2, ir);
    e += (ir.beam + ir.diffuse) * 900;
  }
  return e;
}

/**
 * LBL's test day (S17, Fig. 3): the sun as a sine from sunrise to sunset, the air 16.7 ± 5.5 °C peaking at 15:00, no sky. `peak` follows from the daily sum over `hours`.
 */
export class SineDay implements WeatherSource {
  constructor(
    private readonly dailyJ: number,
    private readonly sunrise = 4.5,
    private readonly sunset = 19.5,
    private readonly mean = 16.7,
    private readonly swing = 5.5,
  ) {}

  dayIrradiation(): number {
    return this.dailyJ;
  }

  at(_day: number, hour: number, out: WeatherNow): void {
    const span = this.sunset - this.sunrise;
    const peak = (Math.PI * this.dailyJ) / (2 * span * 3600);
    const on = hour > this.sunrise && hour < this.sunset;
    const g = on ? peak * Math.sin((Math.PI * (hour - this.sunrise)) / span) : 0;
    out.G = g;
    out.Geff = g;
    out.Ta = this.mean + this.swing * Math.sin((2 * Math.PI * (hour - 9)) / 24);
    out.depression = 0;
    out.wind = 2;
    out.sunAlt = on ? 45 : -10;
    out.sunAz = 0;
  }
}

/** A clear night at a steady air, for a measured night's test: no sun, the sky's sink on. */
export class ClearNight implements WeatherSource {
  constructor(
    private readonly air: number,
    private readonly plateEmissivity: number,
    private readonly wind = 2,
    private readonly clear = 1,
  ) {}

  dayIrradiation(): number {
    return 0;
  }

  at(_day: number, _hour: number, out: WeatherNow): void {
    out.G = 0;
    out.Geff = 0;
    out.Ta = this.air;
    out.wind = this.wind;
    out.sunAlt = -30;
    out.sunAz = 0;
    out.depression = plateDepression(this.air, this.clear, this.wind, { plateEmissivity: this.plateEmissivity });
  }
}
