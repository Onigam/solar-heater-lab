import type { LabSim } from '@onigam/lab-kit/ui';
import { DEFAULT_SKY, SITES, type SiteClimate, type SiteId, type SkySettings } from './climate';
import type { MachineSpec } from './machine';
import { Operator, type OperatorSettings } from './operate';
import { createPlant, LAYERS, newBook, relaxFlow, type EnergyBook, type Plant } from './plant';
import { presetParams, RANGES, scenarioSetup, specOf, type RangedKey, type ScheduledEvent } from './presets';
import { climateFor, dayNightRun, keymarkLoad, YearRunner, type NightResult, type YearResult } from './runs';
import { GRAVITY, waterRho } from './thermal';
import type { AlarmKey, PresetId, ScenarioId, Scope, SolarParams, SolarState } from './types';

// SolarSim: the whole machine as the kit's `LabSim`. Two clocks, as the film contract asks: the heat and the hour move on `dt × timeScale`, at a fixed internal step of 5 s (a variable
// step gave LBL's model false oscillations all night); at low speed the flow also relaxes on `dt`, so that with `timeScale` at 0 the hour stops and the flow still settles.
// Deterministic: the only series of the weather is seeded, nothing reads a wall clock.

/** Longest real step taken at once, s. */
const DT_MAX = 0.25;
/** The fixed step of the heat, s. */
export const THERMAL_STEP = 5;
/** Most thermal steps in one frame. A day per second at 60 fps takes 288; past this the clock falls behind, the same way on any machine. */
const MAX_STEPS = 720;
/** Step of the run-in before a start, s. */
const SPIN_STEP = 30;
/** One sample per 15 simulated minutes, three days of them. */
const SCOPE_EVERY = 900;
const SCOPE_LENGTH = 288;

/** Flow that counts as started, and as backward enough for a notice, L/h. */
const FLOW_ON = 5;
const FLOW_BACK = 1;
/** The notice about the legionella band comes after this many hours in it. An assumption: « days ». */
const BAND_HOURS = 72;
export const BAND_LOW = 25;
export const BAND_HIGH = 45;
/** The frost notice: this close to the freezing point, K. */
const FROST_NEAR = 3;
/** Hottest tap the alarm tolerates, °C. reported (K54). */
export const TAP_LIMIT = 50;

/** A shower: 10 L/min for 8 minutes at 40 °C. Usual figures, an assumption. */
export const SHOWER_LITRES = 80;

const TIME_KEYS: (keyof SolarParams)[] = ['slowMo', 'timeScale', 'running'];
/** Clock keys: they move the clock, not the machine. */
const CLOCK_KEYS: (keyof SolarParams)[] = ['day', 'hour'];
/** What only touches the weather's live settings. */
const SKY_LIVE_KEYS: (keyof SolarParams)[] = ['cloud', 'airOffset', 'wind'];

/** The heights the panel's sweep runs, m. */
export const SWEEP_HEIGHTS = [-1.22, -0.9, -0.61, -0.4, -0.3, -0.2, -0.1, 0, 0.1, 0.3, 0.61, 1.0, 1.83];
const SWEEP_STEP = 30;

export interface SweepRow {
  y: number;
  /** The share of the day's gain lost by morning. */
  lostShare: number;
  /** The day's gain to the tank, kWh; the night's mean flow, L/h. */
  gainKWh: number;
  lostKWh: number;
  skinKWh: number;
  nightFlow: number;
  peakFlow: number;
  /** The same night with a one-way valve. */
  valveLostShare: number;
  valveGainKWh: number;
  /** Mean of the plate minus the air during the night, K, with and without the valve. */
  plateMinusAir: number;
  valvePlateMinusAir: number;
  /** The coldest node of the circuit that night, °C, with and without the valve. */
  coldest: number;
  valveColdest: number;
}

const newState = (): SolarState => ({
  simTime: 0,
  dayOfYear: 0,
  hour: 0,
  sunG: 0,
  sunAlt: 0,
  sunAz: 0,
  airT: 15,
  plateFloorT: 15,
  flowLph: 0,
  flowDir: 0,
  pipeSpeed: 0,
  headPa: 0,
  headMm: 0,
  loopT: new Float64Array(0),
  loopZ: new Float64Array(0),
  loopDz: new Float64Array(0),
  loopMap: { cold: [0, 0], lowerHeader: 0, risers: [0, 0], upperHeader: 0, hot: [0, 0], jacket: [0, 0] },
  collectorIn: 15,
  collectorOut: 15,
  plateT: 15,
  plateMinusAir: 0,
  coldestT: 15,
  freezeT: 0,
  frostMargin: 15,
  circuit: 'closed',
  returnHeight: 0,
  layers: new Float64Array(LAYERS),
  layerHeight: 0,
  tankTop: 15,
  tankBottom: 15,
  tankMean: 15,
  tankHeight: 0,
  tankBase: 0,
  onDrawnMachine: true,
  boostOn: false,
  reliefDrip: 0,
  reliefLitres: 0,
  reliefOpen: false,
  overheatShut: false,
  vented: false,
  tapFlow: 0,
  tapT: 15,
  gain: 0,
  collectorLoss: 0,
  pipeLoss: 0,
  toTank: 0,
  tankLoss: 0,
  boost: 0,
  todaySun: 0,
  todayGain: 0,
  todayToTank: 0,
  todayDelivered: 0,
  todayDemand: 0,
  todayBoost: 0,
  todayFraction: 0,
  flowStarted: 0,
  reversalCount: 0,
  showerCount: 0,
  angle: 0,
  alarms: [],
});

export class SolarSim implements LabSim {
  readonly params: SolarParams;
  readonly state: SolarState;
  readonly scope: Scope = {
    t: [],
    flow: [],
    collectorOut: [],
    top: [],
    bottom: [],
    air: [],
    plate: [],
    sun: [],
    gain: [],
  };
  private plant!: Plant;
  private op!: Operator;
  private climate!: SiteClimate;
  private sky: SkySettings = { ...DEFAULT_SKY };
  private listeners = new Set<() => void>();
  private events: ScheduledEvent[] = [];
  private fired = new Set<number>();
  private scriptTime = 0;
  private lastKind: 'preset' | 'scenario' = 'preset';
  private lastId: PresetId | ScenarioId = 'family-300';
  private pending = 0;
  private sinceScope = 0;
  private clock = 0;
  private clockAtRefresh = 0;
  private dayMark = -1;
  private bookAtMidnight: EnergyBook = newBook();
  private bandHours = 0;
  private volumePrev = 0;
  private belowOn = true;
  private aboveBack = true;
  private cache = new Map<string, unknown>();

  constructor() {
    this.params = presetParams('family-300');
    this.state = newState();
    this.load(presetParams('family-300'), 3);
  }

  // ------------------------------------------------------------------ the LabSim contract

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters (clamped to their range). Anything but the time controls turns the preset into 'custom'. */
  set(patch: Partial<SolarParams>): void {
    const p = this.params as unknown as Record<string, unknown>;
    let physical = false;
    let clock = false;
    let skyLive = false;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const k = key as keyof SolarParams;
      if (key in RANGES) {
        const r = RANGES[key as RangedKey];
        p[key] = Math.min(r.max, Math.max(r.min, Number(value)));
      } else if (key === 'slowMo' || key === 'timeScale') {
        p[key] = Math.max(0, Number(value));
      } else {
        p[key] = value;
      }
      if (CLOCK_KEYS.includes(k)) clock = true;
      else if (SKY_LIVE_KEYS.includes(k)) skyLive = true;
      else if (!TIME_KEYS.includes(k) && k !== 'preset') physical = true;
    }
    if ((physical || skyLive) && patch.preset === undefined) this.params.preset = 'custom';
    if (skyLive) this.applySkyLive();
    if (physical) this.rebuildKeeping();
    if (clock) this.moveClock();
    this.refreshState();
    this.emit();
  }

  applyPreset(id: string): void {
    this.lastKind = 'preset';
    this.lastId = id as PresetId;
    this.load(presetParams(id as PresetId), 3);
  }

  applyScenario(id: string): void {
    this.lastKind = 'scenario';
    this.lastId = id as ScenarioId;
    const s = scenarioSetup(id as ScenarioId);
    this.load(s.params, s.spinUp, s.events);
  }

  /** Start again from the last preset or scenario. */
  reset(): void {
    if (this.lastKind === 'preset') this.applyPreset(this.lastId);
    else this.applyScenario(this.lastId);
  }

  /** A gesture for the film and the panel: a shower starts. */
  drawShower(): void {
    this.op.showerLeft += SHOWER_LITRES;
    this.state.showerCount++;
    this.emit();
  }

  private load(next: SolarParams, spinUp: number, events: ScheduledEvent[] = []): void {
    const keep = { slowMo: this.params.slowMo, running: this.params.running };
    Object.assign(this.params, next, keep);
    this.events = events;
    this.fired.clear();
    this.scriptTime = 0;
    this.pending = 0;
    this.sinceScope = 0;
    this.clock = 0;
    this.clockAtRefresh = 0;
    this.bandHours = 0;
    const s = this.state;
    s.flowStarted = 0;
    s.reversalCount = 0;
    s.showerCount = 0;
    s.reliefLitres = 0;
    s.reliefDrip = 0;
    s.simTime = 0;
    for (const k of Object.keys(this.scope) as (keyof Scope)[]) this.scope[k].length = 0;
    this.buildPlant();
    this.runIn(spinUp);
    this.afterBuild();
    this.volumePrev = this.waterVolume();
    const q = this.plant.Q * 3.6e6;
    this.belowOn = q < FLOW_ON;
    this.aboveBack = q > -FLOW_BACK;
    this.bookAtMidnight = { ...this.plant.book };
    this.dayMark = this.op.day;
    this.refreshState();
    this.sample();
    this.emit();
  }

  private skySettings(): SkySettings {
    const p = this.params;
    return { site: p.site, sky: p.sky, cloud: p.cloud, airOffset: p.airOffset, wind: p.wind, seed: 1 };
  }

  private settings(): OperatorSettings {
    const p = this.params;
    return { ...keymarkLoad(p.site, p.demand), temperOn: p.tempering, Tset: p.temperSet };
  }

  /** A new plant and its driver, at the clock's place, with no history. */
  private buildPlant(): void {
    const p = this.params;
    const spec = specOf(p);
    this.sky = this.skySettings();
    this.climate = climateFor(spec, this.sky);
    this.plant = createPlant(spec, SITES[p.site].coldWater + 15);
    this.op = new Operator(this.plant, this.climate, this.settings(), Math.max(0, p.day - 1), p.hour);
  }

  /** Run the days before the start so that the tank has its history. The clock comes back to the start; the book starts empty. */
  private runIn(days: number): void {
    const { op, plant } = this;
    const start = op.t;
    op.t = start - days * 86400 + 365 * 86400;
    op.run(days * 86400, SPIN_STEP);
    op.t = start;
    plant.book = newBook();
    plant.now.tapFlow = 0;
    op.readWeather();
  }

  private afterBuild(): void {
    const s = this.state;
    const pl = this.plant;
    s.loopT = pl.chain.T;
    s.loopZ = pl.zMid;
    s.loopDz = pl.dz;
    s.loopMap = {
      cold: [0, pl.nCold],
      lowerHeader: pl.iLow,
      risers: [pl.iRiser, pl.nRiser],
      upperHeader: pl.iUp,
      hot: [pl.iHot, pl.nHot],
      jacket: [pl.iEx, pl.nEx],
    };
    s.tankHeight = pl.spec.tankHeight;
    s.tankBase = pl.tankBase;
    s.freezeT = pl.fluid.freezeT;
    s.circuit = pl.spec.circuit;
    s.returnHeight = pl.spec.returnHeight;
    s.layerHeight = pl.layers.height / LAYERS;
    s.onDrawnMachine = this.params.machine === 'roof-unit';
  }

  /** The machine changed: a new plant, the temperatures and the counters kept. */
  private rebuildKeeping(): void {
    const old = this.plant;
    const oldOp = this.op;
    const p = this.params;
    const spec = specOf(p);
    this.sky = this.skySettings();
    this.climate = climateFor(spec, this.sky);
    const plant = createPlant(spec, 20);
    const n = Math.min(plant.n, old.n);
    for (let i = 0; i < n; i++) plant.chain.T[i] = old.chain.T[i]!;
    for (let l = 0; l < LAYERS; l++) {
      plant.T[l] = old.T[l]!;
      plant.net.H[l] = plant.net.capacity[l]! * plant.T[l]!;
    }
    plant.net.T[LAYERS] = old.net.T[LAYERS]!;
    plant.Q = spec.circuit === old.spec.circuit ? old.Q : 0;
    plant.shut = old.shut && spec.overheatValve;
    plant.book = old.book;
    plant.now = old.now;
    this.plant = plant;
    this.op = new Operator(plant, this.climate, this.settings(), 0, 0);
    this.op.t = oldOp.t;
    this.op.showerLeft = oldOp.showerLeft;
    this.op.readWeather();
    this.afterBuild();
  }

  private applySkyLive(): void {
    const p = this.params;
    this.sky.cloud = p.cloud;
    this.sky.airOffset = p.airOffset;
    this.sky.wind = p.wind;
  }

  private moveClock(): void {
    const p = this.params;
    this.op.t = (Math.max(1, Math.round(p.day)) - 1) * 86400 + p.hour * 3600;
    this.op.readWeather();
    this.bookAtMidnight = { ...this.plant.book };
    this.dayMark = this.op.day;
  }

  // ------------------------------------------------------------------ time

  step(dtReal: number): void {
    if (!this.params.running) return;
    const dt = Math.min(Math.max(dtReal, 0), DT_MAX);
    if (dt === 0) return;
    this.advanceScript(dt);
    const clockDt = dt * this.params.timeScale;
    if (clockDt <= dt) relaxFlow(this.plant, dt);
    this.pending += clockDt;
    let n = 0;
    while (this.pending >= THERMAL_STEP && n < MAX_STEPS) {
      this.stepHeat();
      this.pending -= THERMAL_STEP;
      n++;
    }
    if (this.pending >= THERMAL_STEP) this.pending = 0;
    const s = this.state;
    const q = this.plant.Q * 3.6e6;
    s.angle = (s.angle + Math.sign(q) * Math.min(Math.abs(q) / 40, 2) * dt * this.params.slowMo) % (2 * Math.PI);
    this.refreshState();
  }

  /** One fixed step, and what counts over it. */
  private stepHeat(): void {
    const { op, plant } = this;
    op.step(THERMAL_STEP);
    this.clock += THERMAL_STEP;
    this.sinceScope += THERMAL_STEP;
    const s = this.state;
    const flow = plant.Q * 3.6e6;
    // the moments
    if (this.belowOn && flow >= FLOW_ON) {
      s.flowStarted++;
      this.belowOn = false;
    } else if (!this.belowOn && flow < FLOW_ON * 0.4) this.belowOn = true;
    if (this.aboveBack && flow <= -FLOW_BACK) {
      s.reversalCount++;
      this.aboveBack = false;
    } else if (!this.aboveBack && flow > 0) this.aboveBack = true;
    // the legionella band
    const top = plant.T[LAYERS - 1]!;
    if (top >= BAND_LOW && top <= BAND_HIGH) this.bandHours += THERMAL_STEP / 3600;
    else this.bandHours = 0;
    // midnight
    const d = op.day;
    if (d !== this.dayMark) {
      this.dayMark = d;
      this.bookAtMidnight = { ...plant.book };
    }
    if (this.sinceScope >= SCOPE_EVERY) {
      this.sinceScope -= SCOPE_EVERY;
      this.refreshState();
      this.sample();
    }
  }

  private advanceScript(dt: number): void {
    this.scriptTime += dt;
    this.events.forEach((e, i) => {
      if (this.fired.has(i) || this.scriptTime < e.at) return;
      this.fired.add(i);
      if (e.shower) this.drawShower();
      if (e.patch) {
        const preset = this.params.preset;
        this.set(e.patch);
        this.params.preset = preset;
      }
    });
  }

  // ------------------------------------------------------------------ the state

  private waterVolume(): number {
    const pl = this.plant;
    let v = 0;
    for (let l = 0; l < LAYERS; l++) v += (pl.layers.volume[l]! * waterRho(15)) / waterRho(pl.T[l]!);
    return v;
  }

  private refreshState(): void {
    const s = this.state;
    const p = this.params;
    const pl = this.plant;
    const { op } = this;
    const wx = op.wx;
    const now = pl.now;
    const T = pl.chain.T;
    s.simTime = this.clock;
    s.dayOfYear = op.day;
    s.hour = op.hour;
    p.day = op.day + 1;
    p.hour = s.hour;
    s.sunG = wx.G;
    s.sunAlt = wx.sunAlt;
    s.sunAz = wx.sunAz;
    s.airT = wx.Ta;
    s.plateFloorT = wx.Ta - wx.depression;
    const q = pl.Q * 3.6e6;
    s.flowLph = q;
    s.flowDir = q >= FLOW_ON * 0.4 ? 1 : q <= -FLOW_BACK ? -1 : 0;
    s.pipeSpeed = pl.Q / ((Math.PI * pl.spec.pipeBore * pl.spec.pipeBore) / 4);
    s.headPa = now.head;
    s.headMm = now.head / GRAVITY; // Pa over ρg at 1000 kg/m³, in millimetres
    s.collectorIn = T[pl.iLow]!;
    s.collectorOut = T[pl.iUp]!;
    let sum = 0;
    for (let i = pl.iRiser; i < pl.iRiser + pl.nRiser; i++) sum += T[i]!;
    s.plateT = sum / pl.nRiser;
    s.plateMinusAir = s.plateT - wx.Ta;
    s.coldestT = now.coldest;
    s.frostMargin = now.coldest - pl.fluid.freezeT;
    for (let l = 0; l < LAYERS; l++) s.layers[l] = pl.T[l]!;
    s.tankTop = pl.T[LAYERS - 1]!;
    s.tankBottom = pl.T[0]!;
    let e = 0;
    let c = 0;
    for (let l = 0; l < LAYERS; l++) {
      e += pl.w[l]! * pl.T[l]!;
      c += pl.w[l]!;
    }
    s.tankMean = e / c;
    s.boostOn = now.boost > 0;
    s.boost = now.boost;
    s.reliefOpen = now.reliefOpen;
    s.overheatShut = now.shut;
    s.vented = now.vented;
    s.tapFlow = now.tapFlow;
    s.tapT = now.tapT;
    s.gain = now.gain;
    s.collectorLoss = now.collectorLoss;
    s.pipeLoss = now.pipeLoss;
    s.toTank = now.toTank;
    s.tankLoss = now.tankLoss;
    // the cold relief: the water the heat pushes out, over the simulated time since the last look
    const elapsed = this.clock - this.clockAtRefresh;
    if (elapsed > 0) {
      const v = this.waterVolume();
      const dv = v - this.volumePrev;
      this.volumePrev = v;
      this.clockAtRefresh = this.clock;
      const dripping = dv > 0 && now.tapFlow === 0;
      s.reliefDrip = dripping ? (dv * 1000 * 3600) / elapsed : 0;
      if (dripping) s.reliefLitres += dv * 1000;
    }
    const b = pl.book;
    const m = this.bookAtMidnight;
    s.todaySun = b.sun - m.sun;
    s.todayGain = b.absorbed - m.absorbed - (b.collectorLoss - m.collectorLoss);
    s.todayToTank = b.toTank - m.toTank;
    s.todayDelivered = b.delivered - m.delivered;
    s.todayDemand = b.demand - m.demand;
    s.todayBoost = b.boost - m.boost;
    const delivered = s.todayDelivered - s.todayBoost;
    s.todayFraction = s.todayDemand > 0 ? Math.max(0, Math.min(1, delivered / s.todayDemand)) : 0;
    s.alarms = this.alarms();
  }

  private alarms(): AlarmKey[] {
    const s = this.state;
    const a: AlarmKey[] = [];
    if (s.tapT > TAP_LIMIT) a.push('tapHot');
    if (this.bandHours >= BAND_HOURS) a.push('legionellaZone');
    if (s.frostMargin <= 0) a.push('frostIce');
    else if (s.frostMargin < FROST_NEAR) a.push('frostNear');
    if (s.tankTop > 95) a.push('tankOver95');
    if (s.reliefOpen) a.push('reliefOpen');
    if (s.overheatShut) a.push('overheatShut');
    if (s.vented) a.push('circuitVented');
    if (s.flowDir < 0) a.push('reverseFlow');
    return a;
  }

  private sample(): void {
    const sc = this.scope;
    const s = this.state;
    sc.t.push(this.clock / 3600);
    sc.flow.push(s.flowLph);
    sc.collectorOut.push(s.collectorOut);
    sc.top.push(s.tankTop);
    sc.bottom.push(s.tankBottom);
    sc.air.push(s.airT);
    sc.plate.push(s.plateT);
    sc.sun.push(s.sunG);
    sc.gain.push(s.gain);
    if (sc.t.length > SCOPE_LENGTH) for (const k of Object.keys(sc) as (keyof Scope)[]) sc[k].shift();
  }

  // ------------------------------------------------------------------ what the panel asks for (cached)

  private cached<T>(key: string, make: () => T): T {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    const v = make();
    if (this.cache.size > 300) this.cache.clear();
    this.cache.set(key, v);
    return v;
  }

  /** The machine as it is set now. */
  get spec(): MachineSpec {
    return specOf(this.params);
  }

  /** The machine is the one the published table describes: the drawn machine, nothing moved. The draw and the place may change. */
  get onPublishedMachine(): boolean {
    return JSON.stringify(this.spec) === JSON.stringify(specOf(presetParams('family-300')));
  }

  /** The plant, for a test. */
  get plantNow(): Plant {
    return this.plant;
  }

  /** The 24 hours of a machine on this site's clear day, of the month of the clock. */
  private nightOf(spec: MachineSpec, h: number): NightResult {
    const p = this.params;
    const source = climateFor(spec, { ...this.sky, sky: 'clear', cloud: 0 });
    return dayNightRun(spec, {
      source,
      load: keymarkLoad(p.site, p.demand),
      day: Math.max(0, p.day - 1),
      spinUp: 3,
      h,
    });
  }

  private sweepHalf(index: number, valve: boolean): NightResult {
    const y = SWEEP_HEIGHTS[index]!;
    const base = { ...this.spec, tankHeight: y, checkValve: valve };
    const key = `sweep|${y}|${JSON.stringify({ ...base, tankHeight: 0 })}|${this.params.site}|${Math.round(this.params.day)}|${this.params.demand}`;
    return this.cached(key, () => this.nightOf(base, SWEEP_STEP));
  }

  /** Run one half of a row of the sweep ahead of time, so that the panel never holds a frame for both. */
  prepareSweep(index: number, valve: boolean): void {
    this.sweepHalf(index, valve);
  }

  /** One row of the height sweep: `index` in `SWEEP_HEIGHTS`. Cached. */
  getSweepRow(index: number): SweepRow {
    const open = this.sweepHalf(index, false);
    const shut = this.sweepHalf(index, true);
    return {
      y: SWEEP_HEIGHTS[index]!,
      lostShare: open.lostShare,
      gainKWh: open.peakEnergy / 3.6e6,
      lostKWh: open.lost / 3.6e6,
      skinKWh: open.skin / 3.6e6,
      nightFlow: open.nightFlow,
      peakFlow: open.peakFlow,
      valveLostShare: shut.lostShare,
      valveGainKWh: shut.peakEnergy / 3.6e6,
      plateMinusAir: -open.plateMeanBelow,
      valvePlateMinusAir: -shut.plateMeanBelow,
      coldest: open.coldestMin,
      valveColdest: shut.coldestMin,
    };
  }

  /** A year of this machine at a site, in pieces. */
  yearRunner(site: SiteId): YearRunner {
    return new YearRunner(this.spec, site, this.params.demand);
  }

  /** What a year depends on, for the panel. */
  yearKey(): string {
    return JSON.stringify([this.spec, this.params.demand]);
  }

  /** A whole year, cached: a second or so. */
  getYear(site: SiteId): YearResult {
    return this.cached(`year|${site}|${this.yearKey()}`, () => {
      const r = this.yearRunner(site);
      r.advance(365);
      return r.result();
    });
  }
}

/** The template's placeholder scene (src/three/device.ts) until the 3D role replaces it: it only reads a turning angle. */
export type DemoState = { readonly angle: number };
