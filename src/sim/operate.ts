import { newWeather, type WeatherNow, type WeatherSource } from './climate';
import { newLoad, stepPlant, type LoadStep, type Plant } from './plant';

// What drives a plant over time, on a clock of seconds from the start of a day: the weather, the taps, the booster's clock. Used by the live engine and by the long runs alike.

/** One draw at the tap: between two hours, at a flow in litres per second. */
export interface DrawWindow {
  from: number;
  to: number;
  lps: number;
}

/** A flow at the tap, L/s: 600 L/h, the figure tanks are tested at (K44). An assumption for the household. */
export const TAP_FLOW = 600 / 3600;

/** The household's day: three draws, morning, noon and evening, reported as a shape (S20); the split, 40, 20 and 40 %, is an assumption. */
export const DRAW_SHARES: readonly (readonly [number, number])[] = [
  [7, 0.4],
  [12.5, 0.2],
  [19, 0.4],
];

export function dayDraws(litresPerDay: number, lps = TAP_FLOW): DrawWindow[] {
  if (litresPerDay <= 0) return [];
  return DRAW_SHARES.map(([hour, share]) => ({ from: hour, to: hour + (litresPerDay * share) / lps / 3600, lps }));
}

/** The booster's timer: late in the day, after the sun has done what it could, before the evening's draw. An assumption. */
export const TIMER_FROM = 16;
export const TIMER_TO = 19;

export interface OperatorSettings {
  draws: DrawWindow[];
  /** Tempered: the tank gives less when it runs hot (the load at Tuse). Off: LBL's way, a fixed volume out. */
  temper: boolean;
  Tuse: number;
  Tc: number;
  /** A tempering valve on the tap's reading, and its set point. */
  temperOn: boolean;
  Tset: number;
}

export class Operator {
  /** Seconds since the start of day 0, at 00:00. */
  t: number;
  /** Litres of a shower still to run. */
  showerLeft = 0;
  readonly wx: WeatherNow = newWeather();
  readonly load: LoadStep = newLoad();

  constructor(
    readonly plant: Plant,
    public source: WeatherSource,
    public settings: OperatorSettings,
    day = 0,
    hour = 0,
  ) {
    this.t = (day * 24 + hour) * 3600;
  }

  get day(): number {
    return Math.floor(this.t / 86400) % 365;
  }

  get hour(): number {
    return (((this.t % 86400) + 86400) % 86400) / 3600;
  }

  /** Read the weather at the present time, without moving. */
  readWeather(): WeatherNow {
    this.source.at(this.day, this.hour, this.wx);
    return this.wx;
  }

  /** One fixed step. The weather is read at the end of the step, as the fluid is implicit. */
  step(h: number): void {
    const hour0 = this.hour;
    const hour1 = hour0 + h / 3600;
    const s = this.settings;
    const load = this.load;
    let volume = 0;
    for (const w of s.draws) {
      const a = Math.max(hour0, w.from);
      const b = Math.min(hour1, w.to);
      if (b > a) volume += (b - a) * 3600 * w.lps * 1e-3;
    }
    load.Tc = s.Tc;
    load.temper = s.temper;
    load.Tuse = s.Tuse;
    load.temperOn = s.temperOn;
    load.Tset = s.Tset;
    // a shower runs on top, at 40 °C, after what the windows ask; the household's windows carry on through it
    if (this.showerLeft > 0) {
      const take = Math.min(this.showerLeft, (10 / 60) * h);
      this.showerLeft -= take;
      volume += take * 1e-3;
      load.Tuse = 40;
      load.temper = true;
    }
    load.volume = volume;
    const boost = this.plant.spec.boost;
    load.boostAllowed = boost === 'always' || (boost === 'timer' && hour0 >= TIMER_FROM && hour0 < TIMER_TO);
    this.t += h;
    this.source.at(this.day, this.hour, this.wx);
    stepPlant(this.plant, this.wx, load, h);
  }

  /** Advance by a length of time, in equal fixed steps. */
  run(seconds: number, h: number): void {
    const steps = Math.round(seconds / h);
    for (let i = 0; i < steps; i++) this.step(h);
  }
}
