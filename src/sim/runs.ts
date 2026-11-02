import {
  ClearNight,
  DEFAULT_SKY,
  MID_MONTH,
  SITES,
  SiteClimate,
  SineDay,
  type SiteId,
  type SkySettings,
  type WeatherSource,
} from './climate';
import { circuitVolume, ROOF_MACHINE, type MachineSpec } from './machine';
import { glycolFreeze, incidenceModifier, type CollectorCurve } from './thermal';
import { dayDraws, Operator, TAP_FLOW, type OperatorSettings } from './operate';
import {
  createPlant,
  LAYERS,
  newBook,
  plantEnergy,
  RHO_C_WATER,
  setPlantField,
  type EnergyBook,
  type Plant,
} from './plant';

// Long runs: a day and a night at a height, the sweep of the heights, a year at a site, a tank left in the sun. Plain functions: the tests and the panel call them.

/** kWh in joules. */
export const KWH = 3.6e6;
/** Step of the runs of a day, s. The live engine uses the same fixed step, 5 s; S17 warns against a variable one. */
export const NIGHT_STEP = 10;
/** Step of the runs of a year, s. A fixed step, stable for implicit upwind; halving it moves the yield by under 0.5 % (tested). */
export const YEAR_STEP = 120;

export const climateFor = (spec: MachineSpec, sky: SkySettings): SiteClimate =>
  new SiteClimate(sky, spec.tilt, spec.azimuth, spec.iam, spec.plateEmissivity, spec.skyTerm);

/** The load of K21: tempered at 45 °C, the site's cold water. */
export function keymarkLoad(site: SiteId, litresPerDay: number): OperatorSettings {
  return { draws: dayDraws(litresPerDay), temper: true, Tuse: 45, Tc: SITES[site].coldWater, temperOn: true, Tset: 50 };
}

export interface NightResult {
  /** Peak flow of the day, L/h. */
  peakFlow: number;
  /** Mean flow from midnight to 04:30, L/h: negative is backward. */
  nightFlow: number;
  /** Flow at the end of the evening, L/h. */
  duskFlow: number;
  /** Cumulative energy into the tank from the loop, from 04:30: at its peak and 24 h later, J. */
  peakEnergy: number;
  endEnergy: number;
  /** The share of the day's gain that ran back by morning, and how much, J. */
  lostShare: number;
  lost: number;
  /** Through the tank's skin during the same night, J. */
  skin: number;
  /** Through the collector and the pipes during that night, J. */
  loopLoss: number;
  /** The air, the plate and the coldest node at the coldest moment of the night, °C. */
  airMin: number;
  plateMin: number;
  coldestMin: number;
  /** How far the coldest plate node stood below the air at its lowest, K. */
  plateBelowAir: number;
  /** Mean of the plate minus the air, over the night, K. */
  plateMeanBelow: number;
  /** Tank's top and bottom at the end of the evening and at 04:30, °C. */
  topEvening: number;
  bottomEvening: number;
  topMorning: number;
  bottomMorning: number;
  /** Tank mean at dusk and at dawn, °C. */
  meanDusk: number;
  meanDawn: number;
  /** When the flow first passes 5 L/h, and when the collector's gain first turns positive, solar hours. */
  flowStartHour: number;
  gainStartHour: number;
  /** At the day's peak of flow: the push, Pa, the collector's rise, K, the Reynolds number in the pipes. */
  peakHead: number;
  peakRise: number;
  peakRe: number;
  /** Share of the night during which the reverse flow's outlet, the lower header, stands below the air. */
  outletBelowAirShare: number;
  /** A trace of the flow and of the energy, one point per 10 min. */
  traceT: number[];
  traceFlow: number[];
  traceEnergy: number[];
  /** Book of the 24 h, J. */
  book: EnergyBook;
}

export interface DayNightOptions {
  source: WeatherSource;
  load: OperatorSettings;
  /** Day of the year of the run. */
  day: number;
  /** Days run first: LBL's « third day ». */
  spinUp?: number;
  /** The tank at the start, °C. */
  T0?: number;
  h?: number;
}

const meanOf = (T: ArrayLike<number>): number => {
  let s = 0;
  for (let i = 0; i < T.length; i++) s += T[i]!;
  return s / T.length;
};

/** The third day of a machine under a weather and a load, from 04:30 to 04:30: LBL's Figure 9 for any machine. */
export function dayNightRun(spec: MachineSpec, o: DayNightOptions): NightResult {
  const h = o.h ?? NIGHT_STEP;
  const spin = o.spinUp ?? 3;
  const T0 = o.T0 ?? 30;
  const plant = createPlant(spec, T0);
  const op = new Operator(plant, o.source, o.load, o.day - spin, 4.5);
  op.run(spin * 86400, h);
  plant.book = newBook();

  let peakFlow = 0;
  let duskFlow = 0;
  let nightSum = 0;
  let nightN = 0;
  let peakEnergy = -Infinity;
  let airMin = Infinity;
  let plateMin = Infinity;
  let coldestMin = Infinity;
  let plateBelowAir = -Infinity;
  let belowSum = 0;
  let belowN = 0;
  let skin0 = 0;
  let loop0 = 0;
  let topEvening = 0;
  let bottomEvening = 0;
  let meanDusk = 0;
  let marked = false;
  let flowStartHour = Number.NaN;
  let gainStartHour = Number.NaN;
  let peakHead = 0;
  let peakRise = 0;
  let peakRe = 0;
  let outletBelow = 0;
  let outletN = 0;
  const traceT: number[] = [];
  const traceFlow: number[] = [];
  const traceEnergy: number[] = [];
  const steps = Math.round(86400 / h);
  const traceEvery = Math.round(600 / h);
  const toLph = 3.6e6;
  for (let i = 0; i < steps; i++) {
    op.step(h);
    const b = plant.book;
    const hourAbs = 4.5 + ((i + 1) * h) / 3600;
    const flow = plant.Q * toLph;
    if (flow > peakFlow) {
      peakFlow = flow;
      peakHead = plant.now.head;
      peakRise = plant.chain.T[plant.iUp]! - plant.chain.T[plant.iLow]!;
      const D = spec.pipeBore;
      peakRe = (4 * plant.rhoRef * plant.Q) / (Math.PI * D * plant.fluid.mu(plant.chain.T[plant.iHot]!));
    }
    if (Number.isNaN(flowStartHour) && flow > 5 && hourAbs < 14) flowStartHour = hourAbs;
    if (Number.isNaN(gainStartHour) && plant.now.gain > 0 && hourAbs < 14) gainStartHour = hourAbs;
    if (b.toTank > peakEnergy) peakEnergy = b.toTank;
    if (i % traceEvery === 0) {
      traceT.push(hourAbs);
      traceFlow.push(flow);
      traceEnergy.push(b.toTank);
    }
    // the night: from when the sun has gone until the end of the run
    if (op.wx.G < 1 && hourAbs > 12) {
      if (!marked) {
        marked = true;
        skin0 = b.tankLoss;
        loop0 = b.collectorLoss + b.pipeLoss;
        meanDusk = meanOf(plant.T);
        duskFlow = flow;
      }
      if (hourAbs >= 24) {
        nightSum += flow;
        nightN++;
      }
      const below = op.wx.Ta - plant.now.coldestPlate;
      if (below > plateBelowAir) plateBelowAir = below;
      belowSum += op.wx.Ta - mean(plant.chain.T, plant.iRiser, plant.nRiser);
      belowN++;
      if (flow < 0) {
        outletN++;
        if (plant.chain.T[plant.iLow]! < op.wx.Ta) outletBelow++;
      }
      if (op.wx.Ta < airMin) airMin = op.wx.Ta;
      if (plant.now.coldestPlate < plateMin) plateMin = plant.now.coldestPlate;
      if (plant.now.coldest < coldestMin) coldestMin = plant.now.coldest;
    }
    if (Math.abs(hourAbs - 22) < h / 7200) {
      topEvening = plant.T[LAYERS - 1]!;
      bottomEvening = plant.T[0]!;
    }
  }
  const b = plant.book;
  const end = b.toTank;
  const lost = Math.max(0, peakEnergy - end);
  return {
    peakFlow,
    nightFlow: nightN ? nightSum / nightN : 0,
    duskFlow,
    peakEnergy,
    endEnergy: end,
    lost,
    lostShare: peakEnergy > 0 ? lost / peakEnergy : 0,
    skin: b.tankLoss - skin0,
    loopLoss: b.collectorLoss + b.pipeLoss - loop0,
    airMin,
    plateMin,
    coldestMin,
    plateBelowAir,
    plateMeanBelow: belowN ? belowSum / belowN : 0,
    topEvening,
    bottomEvening,
    topMorning: plant.T[LAYERS - 1]!,
    bottomMorning: plant.T[0]!,
    meanDusk,
    meanDawn: meanOf(plant.T),
    flowStartHour,
    gainStartHour,
    peakHead,
    peakRise,
    peakRe,
    outletBelowAirShare: outletN ? outletBelow / outletN : 0,
    traceT,
    traceFlow,
    traceEnergy,
    book: { ...b },
  };
}

const mean = (a: ArrayLike<number>, from: number, n: number): number => {
  let s = 0;
  for (let i = from; i < from + n; i++) s += a[i]!;
  return s / n;
};

/** LBL's day: the sine of its Figure 3, its draw, its cold water at 16.7 °C. */
export function lblOptions(): DayNightOptions {
  const f3 = 35.4 / 3600; // 1.25 ft³/h, L/s
  const f1 = 11.3 / 3600; // 0.40 ft³/h
  return {
    source: new SineDay(20.08e6),
    load: {
      draws: [
        { from: 6, to: 8, lps: f3 },
        { from: 8, to: 20, lps: f1 },
        { from: 20, to: 22, lps: f3 },
      ],
      temper: false,
      Tuse: 60,
      Tc: 16.7,
      temperOn: false,
      Tset: 60,
    },
    day: 172,
    spinUp: 3,
    T0: 25,
    h: 10,
  };
}

/** A June day at a site, clear or the month's mean, a family's draw. */
export function juneOptions(
  site: SiteId,
  spec: MachineSpec,
  sky: SkySettings['sky'] = 'clear',
  litres = 200,
  day = 172,
): DayNightOptions {
  return {
    source: climateFor(spec, { ...DEFAULT_SKY, site, sky }),
    load: keymarkLoad(site, litres),
    day,
  };
}

export interface HeightPoint {
  y: number;
  result: NightResult;
}

/** The sweep of the tank's height. */
export function heightSweep(
  spec: MachineSpec,
  heights: readonly number[],
  options: (s: MachineSpec) => DayNightOptions,
): HeightPoint[] {
  return heights.map((y) => {
    const s = { ...spec, tankHeight: y };
    return { y, result: dayNightRun(s, options(s)) };
  });
}

/** The height at which a morning loss first passes a share, by straight interpolation on a sweep, from the high end downward; null if it never does. */
export function heightWhereLossPasses(points: readonly HeightPoint[], share: number): number | null {
  const sorted = [...points].sort((a, b) => b.y - a.y);
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1]!;
    const b = sorted[i]!;
    if (a.result.lostShare < share && b.result.lostShare >= share) {
      const u = (share - a.result.lostShare) / (b.result.lostShare - a.result.lostShare);
      return a.y + (b.y - a.y) * u;
    }
  }
  return sorted[0]!.result.lostShare >= share ? sorted[0]!.y : null;
}

export interface YearResult {
  site: SiteId;
  demand: number;
  /** Energy of the year, J. */
  book: EnergyBook;
  /** Demand, solar energy to the load, MJ/a; the fraction. */
  QdMJ: number;
  QLMJ: number;
  fraction: number;
  /** Sum of the sun on the plane, kWh/m². */
  planeKWh: number;
  /** Hottest top of the tank, °C, and the share of the summer it spends over 60 °C. */
  maxTop: number;
  /** Coldest node of the loop over the year, °C; hours under the mix's freezing point. */
  coldest: number;
  frostHours: number;
  /** Hours when the flow ran backward by more than a trickle. */
  backwardHours: number;
  /** Monthly: solar energy to the load, MJ. */
  monthly: number[];
  /** Energy conservation of the run, J. */
  imbalance: number;
}

/** A year at a site, in pieces so that a panel can run it over many frames. */
export class YearRunner {
  private op: Operator;
  private plant: Plant;
  private d = 0;
  private maxTop = -Infinity;
  private coldest = Infinity;
  private frostSeconds = 0;
  private backSeconds = 0;
  private monthly = new Array<number>(12).fill(0);
  private E0: number;

  constructor(
    readonly spec: MachineSpec,
    readonly site: SiteId,
    readonly demand: number,
    readonly h = YEAR_STEP,
    readonly seed = 1,
    readonly sky: SkySettings['sky'] = 'series',
  ) {
    this.plant = createPlant(spec, SITES[site].coldWater + 10);
    const source = climateFor(spec, { ...DEFAULT_SKY, site, sky, seed });
    this.op = new Operator(this.plant, source, keymarkLoad(site, demand), 0, 0);
    // a week to forget the start: the last week of the year, as the year's start will be
    this.op.t = 358 * 86400;
    for (let i = 0; i < 7; i++) this.op.run(86400, h);
    this.op.t = 0;
    this.plant.book = newBook();
    this.E0 = plantEnergy(this.plant);
  }

  get done(): boolean {
    return this.d >= 365;
  }

  /** Run some days. */
  advance(days: number): void {
    const stepsPerDay = Math.round(86400 / this.h);
    const { op, plant } = this;
    const freeze = plant.fluid.freezeT;
    for (let k = 0; k < days && this.d < 365; k++) {
      const m = monthFor(this.d);
      const before = plant.book.delivered;
      for (let i = 0; i < stepsPerDay; i++) {
        op.step(this.h);
        const top = plant.T[LAYERS - 1]!;
        if (top > this.maxTop) this.maxTop = top;
        const c = plant.now.coldest;
        if (c < this.coldest) this.coldest = c;
        if (c < freeze) this.frostSeconds += this.h;
        if (plant.Q * 3.6e6 < -0.5) this.backSeconds += this.h;
      }
      this.monthly[m]! += (plant.book.delivered - before) / 1e6;
      this.d++;
    }
  }

  result(): YearResult {
    const b = this.plant.book;
    return {
      site: this.site,
      demand: this.demand,
      book: { ...b },
      QdMJ: b.demand / 1e6,
      QLMJ: b.delivered / 1e6,
      fraction: b.demand > 0 ? b.delivered / b.demand : 0,
      planeKWh: b.sun / this.spec.grossArea / KWH,
      maxTop: this.maxTop,
      coldest: this.coldest,
      frostHours: this.frostSeconds / 3600,
      backwardHours: this.backSeconds / 3600,
      monthly: [...this.monthly],
      imbalance:
        plantEnergy(this.plant) -
        this.E0 -
        (b.absorbed + b.boost - b.collectorLoss - b.pipeLoss - b.tankLoss - b.delivered - b.relief),
    };
  }
}

const MONTH_ENDS = MID_MONTH.map((_, i) => [31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365][i]!);
const monthFor = (d: number): number => {
  for (let m = 0; m < 12; m++) if (d < MONTH_ENDS[m]!) return m;
  return 11;
};

/** A whole year in one call. */
export function yearRun(
  spec: MachineSpec,
  site: SiteId,
  demand: number,
  h = YEAR_STEP,
  seed = 1,
  sky: SkySettings['sky'] = 'series',
): YearResult {
  const r = new YearRunner(spec, site, demand, h, seed, sky);
  r.advance(365);
  return r.result();
}

/** K44's test: a tank of even temperature drawn from the top at 600 L/h with cold water below. The litres out before the outlet has lost a share of its rise, over the nominal volume. */
export function drawOffRun(
  spec: MachineSpec,
  Thot = 60,
  Tcold = 15,
  share = 0.1,
): { litres: number; fraction: number } {
  const plant = createPlant(spec, Thot);
  setPlantField(plant, Thot, Thot);
  const op = new Operator(plant, climateFor(spec, DEFAULT_SKY), {
    draws: [],
    temper: false,
    Tuse: Thot,
    Tc: Tcold,
    temperOn: false,
    Tset: 99,
  });
  // night, no sun, no flow to speak of; only the draw matters here
  let litres = 0;
  const lps = TAP_FLOW;
  const h = 10;
  op.settings.draws = [{ from: 0, to: 24, lps }];
  op.t = 0;
  const limit = Thot - share * (Thot - Tcold);
  while (litres < spec.tankVolume * 2000 && plant.T[LAYERS - 1]! > limit) {
    op.step(h);
    litres += lps * h;
  }
  return { litres, fraction: litres / (spec.tankVolume * 1000) };
}

/** A tank left alone with no draw and a clear sky, day after day: how high does it go? */
export function stagnationRun(
  spec: MachineSpec,
  site: SiteId,
  day: number,
  days: number,
  T0: number,
  h = 30,
): { maxTop: number; maxCollector: number; topTrace: number[]; shut: boolean; vented: boolean; relief: number } {
  const plant = createPlant(spec, T0);
  setPlantField(plant, T0, T0);
  const op = new Operator(
    plant,
    climateFor(spec, { ...DEFAULT_SKY, site, sky: 'clear' }),
    {
      draws: [],
      temper: true,
      Tuse: 45,
      Tc: SITES[site].coldWater,
      temperOn: true,
      Tset: 50,
    },
    day,
    0,
  );
  let maxTop = -Infinity;
  let maxCollector = -Infinity;
  let shut = false;
  let vented = false;
  const topTrace: number[] = [];
  const steps = Math.round((days * 86400) / h);
  for (let i = 0; i < steps; i++) {
    op.step(h);
    const top = plant.T[LAYERS - 1]!;
    if (top > maxTop) maxTop = top;
    if (plant.now.hottest > maxCollector) maxCollector = plant.now.hottest;
    shut ||= plant.shut;
    vented ||= plant.now.vented;
    if (i % Math.round(3600 / h) === 0) topTrace.push(top);
  }
  return { maxTop, maxCollector, topTrace, shut, vented, relief: plant.book.relief };
}

/** Volume check, for the tests. */
export const roofCircuit = (): number => circuitVolume(ROOF_MACHINE);

/** ISO 9459-2 as the Cypriot rigs ran it: the tank even at T0, a clear night of 12 h at a steady air. Heat out of the tank, J, and what the skin alone took. */
export function nightTestRun(
  spec: MachineSpec,
  air: number,
  T0 = 60,
  hours = 12,
): { lost: number; skin: number; loop: number; minFlow: number; meanFlow: number } {
  const plant = createPlant(spec, T0);
  setPlantField(plant, air, T0, air);
  const op = new Operator(plant, new ClearNight(air, spec.plateEmissivity), {
    draws: [],
    temper: true,
    Tuse: 45,
    Tc: 15,
    temperOn: false,
    Tset: 99,
  });
  const tankEnergy = (): number => plant.T.reduce((a, t, i) => a + t * plant.w[i]!, 0);
  const e0 = tankEnergy();
  const h = 5;
  const steps = Math.round((hours * 3600) / h);
  let minFlow = 0;
  let sum = 0;
  for (let i = 0; i < steps; i++) {
    op.step(h);
    const q = plant.Q * 3.6e6;
    if (q < minFlow) minFlow = q;
    sum += q;
  }
  return {
    lost: e0 - tankEnergy(),
    skin: plant.book.tankLoss,
    loop: plant.book.collectorLoss + plant.book.pipeLoss,
    minFlow,
    meanFlow: sum / steps,
  };
}

/** The coldest moment of a clear winter night for a machine, at an air whose coldest hour is `airMin`: a real evening before it. */
export function frostNight(spec: MachineSpec, airMin: number): NightResult {
  // Athens' January gives the air's shape; the offset sets the minimum (the mean of the month, less the daily swing)
  const base = climateFor(spec, { ...DEFAULT_SKY, site: 'athens', sky: 'clear' });
  const coldHour = { G: 0, Geff: 0, Ta: 0, depression: 0, wind: 2, sunAlt: 0, sunAz: 0 };
  base.at(14, 3, coldHour);
  const offset = airMin - coldHour.Ta;
  const source = climateFor(spec, { ...DEFAULT_SKY, site: 'athens', sky: 'clear', airOffset: offset });
  return dayNightRun(spec, { source, load: keymarkLoad('athens', 200), day: 14, spinUp: 3, T0: 25, h: 15 });
}

/** The highest coldest-hour of the air at which a clear night brings a machine's coldest node to its freezing point, °C: the frost's margin, by bisection. */
export function frostThreshold(spec: MachineSpec): number {
  const freeze = (spec.circuit === 'direct' ? 0 : glycolFreeze(spec.glycol)) as number;
  let hi = 15;
  let lo = -40;
  for (let i = 0; i < 12; i++) {
    const mid = (lo + hi) / 2;
    if (frostNight(spec, mid).coldestMin <= freeze) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * The standard day of a collector's certificate: kWh per collector for a day's sun and a difference from the air. A sine of 12 h, the efficiency floored at 0, the incidence modifier read at the hour
 * angle (a plane at the latitude, at the equinox): the certificate does not print its own day, so this is an assumption.
 */
export function certificateDay(
  curve: CollectorCurve,
  area: number,
  HkWh: number,
  dT: number,
  iam: readonly (readonly [number, number])[] | null = null,
): number {
  const steps = 288;
  const dt = (12 * 3600) / steps;
  const peak = (Math.PI * HkWh * 3.6e6) / (2 * 12 * 3600);
  let e = 0;
  for (let i = 0; i < steps; i++) {
    const u = (i + 0.5) / steps;
    const G = peak * Math.sin(Math.PI * u);
    const theta = Math.abs(u - 0.5) * 180;
    const K = iam ? incidenceModifier(iam, theta) : 1;
    const eta = K * curve.eta0 - curve.a1 * (dT / G) - curve.a2 * G * (dT / G) * (dT / G);
    e += Math.max(0, eta) * G * dt;
  }
  return (e * area) / KWH;
}

/**
 * The test day behind K24: a day of H on the plane, no draw, the mean of the tank ΔT above the mean air (how the test's « ΔT » is read: an assumption, the standard could not be read). The day is
 * a sine from 7 to 17 h. The energy the tank gains, J.
 */
export function qFactorRun(spec: MachineSpec, HJ: number, dT: number, air = 20): number {
  const source = new SineDay(HJ, 7, 17, air, 5);
  let gain = 0;
  // the start follows from the gain: twice round is enough
  for (let k = 0; k < 3; k++) {
    const capacity = spec.tankVolume * RHO_C_WATER + spec.wallCapacity;
    const T0 = air + dT - gain / (2 * capacity);
    const plant = createPlant(spec, T0);
    setPlantField(plant, air, T0, air);
    const op = new Operator(
      plant,
      source,
      { draws: [], temper: true, Tuse: 45, Tc: 15, temperOn: false, Tset: 99 },
      172,
      6,
    );
    const e0 = plant.T.reduce((a, t, i) => a + t * plant.w[i]!, 0);
    op.run(14 * 3600, 10);
    gain = plant.T.reduce((a, t, i) => a + t * plant.w[i]!, 0) - e0;
  }
  return gain;
}
