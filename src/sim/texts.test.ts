import { describe, expect, it } from 'vitest';
import { SolarSim } from './engine';
import { EMISSIVITY, ROOF_MACHINE, type MachineSpec } from './machine';
import { scenarioSetup } from './presets';
import { dayNightRun, frostThreshold, juneOptions } from './runs';
import { SCENARIO_TEXTS } from './texts';
import { plateDepression } from './thermal';

// The figures in the words of two scenarios, read out of the words and held against the model, and the doc's table against the same runs. A pin is not a target: when the model moves, the words
// and docs/physics.md move with it. The words round to what a sentence needs; the tenths are in figures.test.ts.

const raw = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const DOC = raw['../../docs/physics.md'] ?? '';

/** The numbers a pattern captures in a text, the typographic minus read as a minus. */
const read = (text: string, re: RegExp): number[] => {
  const m = text.match(re);
  expect(m, `${re} in « ${text} »`).not.toBeNull();
  return m!.slice(1).map((n) => Number(n.replace('−', '-')));
};
const signed = (x: number): string => `${x < 0 ? '−' : '+'}${Math.abs(x).toFixed(1)}`;

const LONG = 120000;
const LOW = -0.61;
const direct: Partial<MachineSpec> = { circuit: 'direct', glycol: 0 };

const juneNight = (y: number, checkValve: boolean) => {
  const s = { ...ROOF_MACHINE, tankHeight: y, checkValve };
  return dayNightRun(s, juneOptions('athens', s, 'clear'));
};

describe('« Le clapet » says what the model finds, in both languages', () => {
  const [fr, en] = SCENARIO_TEXTS['one-way-valve'].lesson;
  const open = juneNight(LOW, false);
  const shut = juneNight(LOW, true);

  it('its words are measured where it runs: the tank at −0.61 m, a clear June day at Athens, the mix', () => {
    const p = scenarioSetup('one-way-valve').params;
    expect(p.tankHeight).toBe(LOW);
    expect(p.checkValve).toBe(true);
    expect([p.site, p.sky, p.day, p.demand, p.circuit]).toEqual(['athens', 'clear', 172, 200, 'closed']);
  });
  it('the plate’s mean: the valve takes 5.5 K off it, between the words’ two figures', () => {
    const gap = shut.plateMeanBelow - open.plateMeanBelow;
    expect(gap).toBeCloseTo(5.53, 1);
    for (const [lo, hi] of [
      read(fr, /entre (\d+) et (\d+) K †/),
      read(en, /between (\d+) and (\d+) K †/),
    ] as number[][]) {
      expect(gap).toBeGreaterThan(lo!);
      expect(gap).toBeLessThan(hi!);
    }
  });
  it('the live scenario agrees with the run the words come from', () => {
    const night = (valve: boolean): number => {
      const sim = new SolarSim();
      sim.applyScenario('one-way-valve');
      if (!valve) sim.set({ checkValve: false });
      let sum = 0;
      let n = 0;
      for (let i = 0; i < 24 * 20; i++) {
        sim.step(0.05);
        if (sim.state.sunG < 1) {
          sum += sim.state.plateMinusAir;
          n++;
        }
      }
      return sum / n;
    };
    expect(night(false) - night(true)).toBeCloseTo(5.53, 0);
  });
  it(
    'at the coldest point, on a frosty night: under 1 K for the mix, a little over 2 K for water',
    () => {
      const low = { ...ROOF_MACHINE, tankHeight: LOW };
      const gain = (patch: Partial<MachineSpec>): number =>
        frostThreshold({ ...low, ...patch, checkValve: true }) - frostThreshold({ ...low, ...patch });
      const mix = gain({});
      const water = gain(direct);
      expect(mix).toBeCloseTo(0.71, 1);
      expect(water).toBeCloseTo(2.24, 1);
      const [underFr, overFr] = read(fr, /moins de (\d+) K † pour le mélange, un peu plus de (\d+) K †/);
      const [underEn, overEn] = read(en, /under (\d+) K † for the mix, a little over (\d+) K †/);
      for (const under of [underFr!, underEn!]) expect(mix).toBeLessThan(under);
      for (const over of [overFr!, overEn!]) {
        expect(water).toBeGreaterThan(over);
        expect(water).toBeLessThan(over + 0.5);
      }
    },
    LONG,
  );
  it('the June night itself gives 2.6 K at the coldest node at −0.61 m, nothing at y = 0: the words speak of frost', () => {
    expect(open.coldestMin - shut.coldestMin).toBeCloseTo(2.6, 1);
    expect(juneNight(0, false).coldestMin - juneNight(0, true).coldestMin).toBeCloseTo(0, 1);
  });
});

describe('« Une nuit de gel » says what the model finds, in both languages', () => {
  const [fr, en] = SCENARIO_TEXTS.frost.lesson;
  const black = { plateEmissivity: EMISSIVITY.black };

  /** The scenario, live: what the air and the fluid do as the visitor watches. */
  const live = () => {
    const sim = new SolarSim();
    sim.applyScenario('frost');
    let firstMix = Number.NaN;
    let firstWater = Number.NaN;
    let airMin = Infinity;
    let coldestBelow = 0;
    let meanBelow = 0;
    for (let i = 0; i < 20 * 20; i++) {
      sim.step(0.05);
      const s = sim.state;
      const ice = s.frostMargin <= 0;
      if (s.circuit === 'closed') {
        if (ice && Number.isNaN(firstMix)) firstMix = s.airT;
        if (s.airT < airMin) {
          airMin = s.airT;
          coldestBelow = s.airT - s.coldestT;
          meanBelow = -s.plateMinusAir;
        }
      } else if (ice && Number.isNaN(firstWater)) firstWater = s.airT;
    }
    return { firstMix, firstWater, airMin, coldestBelow, meanBelow };
  };
  const seen = live();

  it('about 6 K: the plate at −7 °C of air, not the 5.4 K of a night at 10 °C, which the sheets quote with its air', () => {
    const at7 = plateDepression(-7, 1, 2, black);
    expect(plateDepression(10, 1, 2, black)).toBeCloseTo(5.39, 1);
    expect(at7).toBeCloseTo(6.07, 1);
    for (const said of [read(fr, /environ (\d+) K †/)[0]!, read(en, /about (\d+) K †/)[0]!]) {
      expect(Math.abs(at7 - said)).toBeLessThan(0.5);
      expect(Math.abs(seen.coldestBelow - said)).toBeLessThan(0.5);
    }
  });
  it('that is the coldest point: the mean of the plate, on the panel’s readout, stands nearer the air', () => {
    expect(seen.airMin).toBeCloseTo(-7, 0);
    expect(seen.coldestBelow).toBeCloseTo(6, 0);
    expect(seen.meanBelow).toBeCloseTo(4.3, 0);
    expect(seen.meanBelow).toBeLessThan(seen.coldestBelow);
  });
  it(
    'about −3 °C for the mix and about +6 °C for water: the coldest hour of a clear night',
    () => {
      const mix = frostThreshold(ROOF_MACHINE);
      const water = frostThreshold({ ...ROOF_MACHINE, ...direct });
      expect(mix).toBeCloseTo(-3.23, 1);
      expect(water).toBeCloseTo(5.63, 1);
      for (const [saidMix, saidWater] of [
        read(fr, /environ (−\d+) °C †.*environ \+(\d+) °C †/),
        read(en, /about (−\d+) °C †.*about \+(\d+) °C †/),
      ] as number[][]) {
        expect(Math.abs(mix - saidMix!)).toBeLessThan(0.5);
        expect(Math.abs(water - saidWater!)).toBeLessThan(0.5);
      }
    },
    LONG,
  );
  it('live, the air only passes through those figures: the alarm comes at −3.9 °C for the mix, at +2.5 °C for water', () => {
    expect(seen.firstMix).toBeCloseTo(-3.9, 0);
    expect(seen.firstWater).toBeCloseTo(2.5, 0);
    // the fluid lags a falling air, and that evening starts below water's figure
    expect(seen.firstMix).toBeLessThan(-3.23);
    expect(seen.firstWater).toBeLessThan(5.63);
  });
});

describe('the tags and the doc', () => {
  it('every model figure of the two lessons carries its †; −7 °C is the scenario’s own air', () => {
    for (const id of ['one-way-valve', 'frost'] as const) {
      for (const text of SCENARIO_TEXTS[id].lesson) {
        const figures = [...text.matchAll(/[−+]?\d+ (?:K|°C)( †)?/g)];
        expect(figures.length, text).toBeGreaterThanOrEqual(3);
        for (const f of figures) {
          if (f[0] === '−7 °C') continue;
          expect(f[1], `${f[0]} in « ${text} »`).toBe(' †');
        }
      }
    }
  });
  it('physics §4.3 prints what the runs give', () => {
    const open0 = juneNight(0, false);
    const shut0 = juneNight(0, true);
    const openLow = juneNight(LOW, false);
    const shutLow = juneNight(LOW, true);
    const row = DOC.split('\n').find((l) => l.startsWith('| Plate minus air, mean of a clear June night'));
    expect(row).toBeDefined();
    expect(row).toContain(`${signed(-open0.plateMeanBelow)} K, ${signed(-shut0.plateMeanBelow)} K`);
    expect(row).toContain(`${signed(-openLow.plateMeanBelow)} K, ${signed(-shutLow.plateMeanBelow)} K`);
    const coldest = DOC.split('\n').find((l) => l.startsWith('| Coldest node, clear June night'));
    expect(coldest).toBeDefined();
    expect(coldest).toContain(`${open0.coldestMin.toFixed(1)}, ${shut0.coldestMin.toFixed(1)} °C`);
    expect(coldest).toContain(`${openLow.coldestMin.toFixed(1)}, ${shutLow.coldestMin.toFixed(1)} °C`);
    const gap0 = (shut0.plateMeanBelow - open0.plateMeanBelow).toFixed(1);
    const gapLow = (shutLow.plateMeanBelow - openLow.plateMeanBelow).toFixed(1);
    expect(gap0).toBe('1.7');
    expect(gapLow).toBe('5.5');
    expect(DOC).toContain(`**on average** (${gap0} K at y = 0, ${gapLow} K at −0.61 m)`);
    expect(DOC).toContain(`warms the plate's average by about ${gap0} K`);
    expect(DOC).not.toMatch(/\b1\.8 K\b/);
  });
});
