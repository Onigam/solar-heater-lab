import { describe, expect, it } from 'vitest';
import { BAND_HIGH, BAND_LOW, TAP_LIMIT } from './engine';
import { ClearNight, DEFAULT_SKY, SITES, type SiteId } from './climate';
import {
  circuitVolume,
  collectorRise,
  CURVE_BLACK,
  CURVE_SELECTIVE,
  CYPRUS_1,
  CYPRUS_2,
  CYPRUS_3,
  EMISSIVITY,
  HEADER_BORE,
  IAM_BLACK,
  INGOLSTADT_180,
  ISFH_200,
  JACKET_VOLUME,
  LBL_1981,
  LINEAR_BLACK,
  localOf,
  ONE_COLLECTOR_180,
  ROOF_MACHINE,
  ROOF_UNIT,
  TEST_RATE,
  VESSEL_LENGTH,
  type MachineSpec,
} from './machine';
import { Operator } from './operate';
import {
  createPlant,
  CUT_OUT,
  LAYERS,
  RELIEF_OVERHEAT,
  RELIEF_PLAIN,
  RHO_C_WATER,
  setPlantField,
  TPR_POWER,
  TPR_T,
} from './plant';
import {
  certificateDay,
  climateFor,
  dayNightRun,
  drawOffRun,
  frostNight,
  frostThreshold,
  heightSweep,
  heightWhereLossPasses,
  juneOptions,
  keymarkLoad,
  KWH,
  lblOptions,
  nightTestRun,
  qFactorRun,
  stagnationRun,
  yearRun,
  type NightResult,
  type YearResult,
} from './runs';
import {
  boilingPoint,
  cellsEfficiency,
  curveEfficiency,
  glycolFreeze,
  glycolMix,
  incidenceModifier,
  localLoss,
  plateDepression,
  removalRatio,
  stagnationRise,
  water,
  waterRho,
} from './thermal';

// One test per key figure of docs/research.md, with its K number and the reported value in the name.
//   exact figures: arithmetic, the model retrieves them.
//   compare figures: the test pins WHAT THE MODEL GIVES, in the table below. A pin is not a target: nothing in the model is tuned to these. When a pin moves, the tables of docs/physics.md move with it.
//   find figures: no target at all, the pin is the finding.
// No figure of the whole machine on a roof was ever measured: the Keymark table is a test plus a calculation, LBL's sweep a model of 1981.

const raw = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;

const PINS: Record<string, number> = {
  // PINS-START
  'K7-tilt-18-off': -0.064,
  'K7-tilt-30': -0.02,
  'K7-tilt-50': 0.011,
  'K7-az-45': -0.035,
  'K7-az-20': -0.004,
  'K9-hours': 2.817,
  'K11-top-evening': 72.501,
  'K11-top-morning': 68.099,
  'K11-bottom-evening': 46.6,
  'K11-holiday-no-valve': 93.574,
  'K11-holiday-valve': 85.02,
  'K11-holiday-collector': 115.923,
  'K14-cooling-kWh': 2.3,
  'K17-local-F': 0.811,
  'K17-local-u1': 6.583,
  'K17-local-u2': 0.029,
  'K19--5-6.3': 9.688,
  'K19--5-4.7': 7.424,
  'K19--5-3.1': 5.159,
  'K19-5-6.3': 8.171,
  'K19-5-4.7': 5.915,
  'K19-5-3.1': 3.666,
  'K19-20-6.3': 6.014,
  'K19-20-4.7': 3.83,
  'K19-20-3.1': 1.728,
  'K19-50-6.3': 2.045,
  'K19-50-4.7': 0.459,
  'K19-50-3.1': 0,
  'K19-80-6.3': 0,
  'K19-80-4.7': 0,
  'K19-80-3.1': 0,
  'K21-stockholm-200': 4845.005,
  'K21f-stockholm-200': 43.637,
  'K21-stockholm-250': 5529.029,
  'K21f-stockholm-250': 39.838,
  'K21-stockholm-300': 6053.214,
  'K21f-stockholm-300': 36.346,
  'K21-stockholm-400': 6775.045,
  'K21f-stockholm-400': 30.51,
  'K21-wurzburg-200': 5263.89,
  'K21f-wurzburg-200': 49.459,
  'K21-wurzburg-250': 6010.734,
  'K21f-wurzburg-250': 45.181,
  'K21-wurzburg-300': 6580.549,
  'K21f-wurzburg-300': 41.22,
  'K21-wurzburg-400': 7354.379,
  'K21f-wurzburg-400': 34.55,
  'K21-davos-200': 6907.196,
  'K21f-davos-200': 57.321,
  'K21-davos-250': 7800.051,
  'K21f-davos-250': 51.785,
  'K21-davos-300': 8469.353,
  'K21f-davos-300': 46.857,
  'K21-davos-400': 9362.455,
  'K21f-davos-400': 38.848,
  'K21-athens-200': 6795.952,
  'K21f-athens-200': 82.246,
  'K21-athens-250': 8087.014,
  'K21f-athens-250': 78.296,
  'K21-athens-300': 9201.277,
  'K21f-athens-300': 74.237,
  'K21-athens-400': 10864.084,
  'K21f-athens-400': 65.739,
  'K22-stockholm': 5060.117,
  'K22-wurzburg': 5525.111,
  'K22-davos': 7353.143,
  'K22-athens': 7001.71,
  'K23-stockholm': 3385.258,
  'K23-wurzburg': 3662.046,
  'K23-davos': 4630.726,
  'K24-MJ': 34.205,
  'K28-peak-1.83': 159.536,
  'K28-night-1.83': -1.223,
  'K28-lost-1.83': 0.456,
  'K28-E-1.83': 11.55,
  'K28-peak-0.61': 122.657,
  'K28-night-0.61': -1.698,
  'K28-lost-0.61': 1.044,
  'K28-E-0.61': 11.653,
  'K28-peak-0': 99.058,
  'K28-night-0': -2.292,
  'K28-lost-0': 2.25,
  'K28-E-0': 11.772,
  'K28-peak--0.61': 70.937,
  'K28-night--0.61': -3.678,
  'K28-lost--0.61': 4.88,
  'K28-E--0.61': 11.93,
  'K28-peak--1.22': 41.187,
  'K28-night--1.22': -6.932,
  'K28-lost--1.22': 8.391,
  'K28-E--1.22': 11.805,
  'K29-E-high': 11.55,
  'K29-E-low': 11.805,
  'K29-tube-quarter-flow': 85.883,
  'K29-tube-half-flow': 115.57,
  'K29-tube-quarter-half-energy': -0.008,
  'K29-tube-eighth-energy': -0.004,
  'K29-pipe-flow': -0.887,
  'K29-pipe-energy': -0.35,
  'K29-mixed': -0.134,
  'K31-1-10': 4561.187,
  'K31-1-20': 3693.883,
  'K31-1-share': 0.311,
  'K31-2-10': 4773.661,
  'K31-2-20': 3866.862,
  'K31-2-share': 0.195,
  'K31-3-10': 4446.058,
  'K31-3-20': 3547.034,
  'K31-3-share': 0.128,
  'sweep-lost-1.83': 0.941,
  'sweep-gain-1.83': 8.811,
  'sweep-kWh-1.83': 0.083,
  'sweep-skin-1.83': 0.829,
  'sweep-night-1.83': -0.144,
  'sweep-peak-1.83': 173.034,
  'sweep-lost-0.61': 1.147,
  'sweep-gain-0.61': 9.001,
  'sweep-kWh-0.61': 0.103,
  'sweep-skin-0.61': 0.871,
  'sweep-night-0.61': -0.172,
  'sweep-peak-0.61': 153.13,
  'sweep-lost-0.3': 1.46,
  'sweep-gain-0.3': 9.074,
  'sweep-kWh-0.3': 0.132,
  'sweep-skin-0.3': 0.88,
  'sweep-night-0.3': -0.241,
  'sweep-peak-0.3': 144.306,
  'sweep-lost-0.1': 2.716,
  'sweep-gain-0.1': 9.191,
  'sweep-kWh-0.1': 0.25,
  'sweep-skin-0.1': 0.877,
  'sweep-night-0.1': -0.609,
  'sweep-peak-0.1': 136.712,
  'sweep-lost-0': 4.806,
  'sweep-gain-0': 9.339,
  'sweep-kWh-0': 0.449,
  'sweep-skin-0': 0.863,
  'sweep-night-0': -1.497,
  'sweep-peak-0': 132.065,
  'sweep-lost--0.1': 7.899,
  'sweep-gain--0.1': 9.528,
  'sweep-kWh--0.1': 0.753,
  'sweep-skin--0.1': 0.834,
  'sweep-night--0.1': -3.076,
  'sweep-peak--0.1': 124.52,
  'sweep-lost--0.2': 10.901,
  'sweep-gain--0.2': 9.717,
  'sweep-kWh--0.2': 1.059,
  'sweep-skin--0.2': 0.804,
  'sweep-night--0.2': -4.923,
  'sweep-peak--0.2': 114.631,
  'sweep-lost--0.3': 13.707,
  'sweep-gain--0.3': 9.893,
  'sweep-kWh--0.3': 1.356,
  'sweep-skin--0.3': 0.772,
  'sweep-night--0.3': -7.063,
  'sweep-peak--0.3': 101.888,
  'sweep-lost--0.61': 15.327,
  'sweep-gain--0.61': 9.165,
  'sweep-kWh--0.61': 1.405,
  'sweep-skin--0.61': 0.505,
  'sweep-night--0.61': -14.048,
  'sweep-peak--0.61': 31.914,
  'sweep-lost--0.9': 6.0,
  'sweep-gain--0.9': 3.582,
  'sweep-kWh--0.9': 0.215,
  'sweep-skin--0.9': 0.058,
  'sweep-night--0.9': -10.084,
  'sweep-peak--0.9': 9.387,
  'sweep-lost--1.22': 8.436,
  'sweep-gain--1.22': 1.276,
  'sweep-kWh--1.22': 0.108,
  'sweep-skin--1.22': -0.033,
  'sweep-night--1.22': -9.297,
  'sweep-peak--1.22': 5.592,
  'find-5pct': -0.006,
  'find-10pct': -0.17,
  'nosky-lost-0.61': 0.499,
  'nosky-lost-0': 1.042,
  'nosky-lost--0.3': 3.027,
  'nosky-lost--0.61': 3.731,
  'nosky-1pct': 0.007,
  'K61-good': 0.974,
  'K61-bad': 2.128,
  'K33-depression-black-10C': 5.391,
  'K33-depression-selective-10C': 3.939,
  'K33-depression-calm': 7.901,
  'K33-depression-windy': 3.297,
  'K33-depression-black-minus7C': 6.074,
  'valve-plate-0-open': -2.07,
  'valve-plate-0-shut': -3.81,
  'valve-plate-low-open': 1.723,
  'valve-plate-low-shut': -3.811,
  'valve-coldest-0-open': 15.79,
  'valve-coldest-0-shut': 15.79,
  'valve-coldest-low-open': 18.388,
  'valve-coldest-low-shut': 15.79,
  'K33-outlet-below-share': 0.937,
  'K33-plate-below-trickle': 3.109,
  'K33-plate-below-valve': 4.897,
  'frost-mix': -3.228,
  'frost-mix-valve': -3.228,
  'frost-mix-40': -15.797,
  'frost-direct': 5.634,
  'frost-direct-valve': 5.634,
  'frost-direct-selective': 4.077,
  'frost-direct-low': 3.392,
  'frost-direct-low-valve': 5.634,
  'frost-mix-low': -3.94,
  'frost-mix-low-valve': -3.228,
  'K34-athens--1.22': 722.262,
  'K34-athens--0.61': 5325.261,
  'K34-athens--0.3': 6521.518,
  'K34-athens--0.1': 6723.121,
  'K34-athens-0': 6795.952,
  'K34-athens-0.1': 6830.479,
  'K34-athens-0.3': 6854.203,
  'K34-athens-0.61': 6847.35,
  'K34-athens-1.83': 6754.86,
  'K34-wurzburg--0.3': 4908.822,
  'K34-wurzburg-0': 5263.89,
  'K34-wurzburg-0.3': 5340.277,
  'valve-year-stockholm': 0.009,
  'valve-year-wurzburg': 0.01,
  'valve-year-davos': 0.02,
  'valve-year-athens': 0.012,
  'pipes-year-stockholm': 0.011,
  'pipes-year-wurzburg': 0.011,
  'pipes-year-davos': 0.017,
  'pipes-year-athens': 0.009,
  'pipes-day-bare': 9.339,
  'pipes-day-insulated': 9.351,
  'K35-flow': 71.323,
  'K35-rise': 18.841,
  'K37-model-speed': 11.677,
  'K38-head': 64.828,
  'K38-rise': 16.671,
  'K38-mm': 6.608,
  'K38-peak-flow': 132.065,
  'find-Re': 3944.298,
  'find-flow-start': 7.133,
  'find-gain-start': 4.858,
  'K41-athens-80': 811.071,
  'K41-davos-80': 905.555,
  'K41-wurzburg-80': 668.357,
  'K41-stockholm-80': 614.39,
  'K41-athens-170': 1441.524,
  'K41-davos-170': 1331.036,
  'K41-wurzburg-170': 1018.539,
  'K41-stockholm-170': 935.576,
  'K42-top': 103.658,
  'K44-fraction': 0.611,
  K66: 753.32,
  'K62-stockholm': 0.044,
  'K62-wurzburg': 0.05,
  'K62-davos': 0.065,
  'K62-athens': 0.03,
  K63: 1.492,
  'K65-model': 0.572,
  'K65-lbl': 0.541,
  'K28-mixed-lost-0': 7.3,
  'K28-mixed-night-0': -5.9,
  'K28-mixed-E-0': 10.2,
  'K28-mixed-lost--0.61': 12.7,
  'K28-mixed-night--0.61': -11.2,
  'K28-mixed-E--0.61': 10.29,
  'K28-mixed-lost--1.22': 16.6,
  'K28-mixed-night--1.22': -18.7,
  'K28-mixed-E--1.22': 10.21,
  // PINS-END
};

/** What the model gives this run, for a one-off print when the model has moved on purpose. */
const given: Record<string, number> = {};
const pin = (key: string, model: number, digits: number): void => {
  given[key] = model;
  if (!(key in PINS)) return;
  expect(model, key).toBeCloseTo(PINS[key]!, digits);
};

/** A test that runs several years or many nights: the machine may be shared, and a year takes a second or several. */
const LONG = 300000;

const yearCache = new Map<string, YearResult>();
const year = (spec: MachineSpec, site: SiteId, demand: number): YearResult => {
  const key = `${JSON.stringify(spec)}|${site}|${demand}`;
  let y = yearCache.get(key);
  if (!y) {
    y = yearRun(spec, site, demand);
    yearCache.set(key, y);
  }
  return y;
};

const SITES_ALL: SiteId[] = ['stockholm', 'wurzburg', 'davos', 'athens'];
const DRAWS = [200, 250, 300, 400];

/** K21: Qd, QL, f by site and draw. reported (S7 p. 33). */
const K21: Record<SiteId, [number, number, number][]> = {
  stockholm: [
    [11103, 5030, 45.3],
    [13879, 5676, 40.9],
    [16655, 6096, 36.6],
    [22206, 6373, 28.7],
  ],
  wurzburg: [
    [10643, 5481, 51.5],
    [13304, 6279, 47.2],
    [15965, 6865, 43.0],
    [21286, 7280, 34.2],
  ],
  davos: [
    [12050, 7833, 65.0],
    [15063, 8751, 58.1],
    [18075, 9345, 51.7],
    [24100, 9736, 40.4],
  ],
  athens: [
    [8263, 6726, 81.4],
    [10329, 7871, 76.2],
    [12395, 8825, 71.2],
    [16526, 10031, 60.7],
  ],
};

describe('the machine, from its maker', () => {
  it('K1: one tank of 300 L, two collectors, closed circuit', () => {
    expect(ROOF_UNIT.tankVolume).toBe(0.3);
    expect(ROOF_UNIT.collectors).toBe(2);
    expect(ROOF_MACHINE.circuit).toBe('closed');
    expect(createPlant(ROOF_MACHINE, 20).layers.volume.reduce((a, b) => a + b, 0)).toBeCloseTo(0.3, 6);
  });
  it('K2: outline 2.43 × 2.49 m, and the tank’s 2.31 m case leaves 0.12 m for valves and pipes', () => {
    expect(ROOF_UNIT.systemWidth).toBe(2.43);
    expect(ROOF_UNIT.alongSlope).toBe(2.49);
    expect(ROOF_UNIT.systemWidth - ROOF_UNIT.tankCaseLength).toBeCloseTo(0.12, 6);
    expect(VESSEL_LENGTH).toBeCloseTo(1.973, 2);
  });
  it('K3: 196 kg empty, 515 kg full; tank 107 and 417 kg; collector 43 and 49 kg', () => {
    expect(ROOF_UNIT.massFull - ROOF_UNIT.massEmpty).toBe(319);
    expect(ROOF_UNIT.tankFull - ROOF_UNIT.tankEmpty).toBe(310);
    expect(ROOF_UNIT.collectorFull - ROOF_UNIT.collectorEmpty).toBe(6);
  });
  it('K4: a collector holds 3.8 L; with risers of 7 mm that asks for headers of about 27 mm, not 18', () => {
    const risers = 2 * 35 * ((Math.PI * 0.007 * 0.007) / 4) * ROOF_UNIT.collectorLength;
    const headers = 2 * 2 * ROOF_UNIT.collectorWidth * ((Math.PI * HEADER_BORE * HEADER_BORE) / 4);
    expect(risers + headers).toBeCloseTo(7.6e-3, 6);
    expect(HEADER_BORE * 1000).toBeCloseTo(27.1, 0);
    expect(ROOF_UNIT.riserPitch * 1000).toBeCloseTo(29.3, 1);
  });
  it('K5: the closed circuit holds 19 L', () => {
    expect(circuitVolume(ROOF_MACHINE) * 1000).toBeCloseTo(19, 6);
  });
  it('K6: boost volume 150 L of 300: the element at half height', () => {
    const p = createPlant(ROOF_MACHINE, 20);
    expect(p.boostLayer).toBe(5);
    let above = 0;
    for (let l = p.boostLayer; l < LAYERS; l++) above += p.layers.volume[l]!;
    expect(above * 1000).toBeCloseTo(150, 0);
  });
  it(
    'K7: 20° off the best tilt about −10 %, 45° off south −4 to −5 %; the model at Athens, 200 L/day',
    () => {
      const q = (t: number, az: number): number => year({ ...ROOF_MACHINE, tilt: t, azimuth: az }, 'athens', 200).QLMJ;
      const best = q(38, 0);
      pin('K7-tilt-18-off', q(20, 0) / best - 1, 2);
      pin('K7-tilt-30', q(30, 0) / best - 1, 2);
      pin('K7-tilt-50', q(50, 0) / best - 1, 2);
      pin('K7-az-45', q(30, 45) / q(30, 0) - 1, 2);
      pin('K7-az-20', q(30, 20) / q(30, 0) - 1, 2);
    },
    LONG,
  );
  it('K8: the rail 2.05 m below the batten, the collector 1.943 m long', () => {
    expect(ROOF_UNIT.railToFoot - ROOF_UNIT.collectorLength).toBeCloseTo(0.107, 3);
  });
  it(
    'K9: 150 L × 50 K is 8.7 kWh, 2½ h at 3.6 kW; the model’s booster from cold',
    () => {
      expect((150 * 4186 * 50) / KWH).toBeCloseTo(8.72, 2);
      expect((150 * 4186 * 50) / KWH / 3.6).toBeCloseTo(2.42, 2);
      const spec: MachineSpec = { ...ROOF_MACHINE, boost: 'always', checkValve: true };
      const plant = createPlant(spec, 10);
      const op = new Operator(plant, new ClearNight(10, EMISSIVITY.black), {
        draws: [],
        temper: true,
        Tuse: 45,
        Tc: 10,
        temperOn: false,
        Tset: 99,
      });
      let hours = 0;
      do {
        op.step(30);
        hours += 30 / 3600;
      } while (plant.now.boost > 0 && hours < 8);
      pin('K9-hours', hours, 1);
      expect(plant.T[plant.boostLayer]).toBeGreaterThanOrEqual(ROOF_MACHINE.setPoint - 0.5);
      expect(CUT_OUT).toBe(83);
    },
    LONG,
  );
  it('K10: the chain of pressures, and the combined valve at 99 °C, 10 kW', () => {
    expect(RELIEF_PLAIN).toBe(80e3);
    expect(RELIEF_OVERHEAT).toBe(200e3);
    expect(TPR_T).toBe(99);
    expect(TPR_POWER).toBe(10e3);
    expect(boilingPoint(RELIEF_PLAIN)).toBeCloseTo(117, 0);
    const spec: MachineSpec = { ...ROOF_MACHINE, overheatValve: false, checkValve: true };
    const plant = createPlant(spec, 105);
    setPlantField(plant, 20, 105, 20);
    const op = new Operator(plant, new ClearNight(20, EMISSIVITY.black), {
      draws: [],
      temper: true,
      Tuse: 45,
      Tc: 15,
      temperOn: false,
      Tset: 99,
    });
    op.step(60);
    expect(plant.now.reliefOpen).toBe(true);
    expect(plant.book.relief).toBeLessThanOrEqual(TPR_POWER * 60 + 1);
  });
  it(
    'K11: « should operate between 60 and 70 °C » in family use in summer, « may be as high as 95 °C »',
    () => {
      const r = dayNightRun(ROOF_MACHINE, juneOptions('athens', ROOF_MACHINE, 'clear'));
      pin('K11-top-evening', r.topEvening, 0);
      pin('K11-top-morning', r.topMorning, 0);
      pin('K11-bottom-evening', r.bottomEvening, 0);
      const holiday = stagnationRun({ ...ROOF_MACHINE, overheatValve: false }, 'athens', 196, 7, 60);
      pin('K11-holiday-no-valve', holiday.maxTop, 0);
      const valve = stagnationRun(ROOF_MACHINE, 'athens', 196, 7, 60);
      pin('K11-holiday-valve', valve.maxTop, 0);
      expect(valve.shut).toBe(true);
      pin('K11-holiday-collector', valve.maxCollector, 0);
    },
    LONG,
  );
  it('K12: the freezing table, and one 4.5 L bottle in 19 L is 24 %, about −9 °C', () => {
    expect(glycolFreeze(20)).toBeCloseTo(-7, 6);
    expect(glycolFreeze(30)).toBeCloseTo(-13, 6);
    expect(glycolFreeze(40)).toBeCloseTo(-22, 6);
    expect(glycolFreeze(50)).toBeCloseTo(-34, 6);
    expect((4.5 / 19) * 100).toBeCloseTo(23.7, 1);
    expect(glycolFreeze(ROOF_MACHINE.glycol)).toBeCloseTo(-9.2, 1);
  });
  it(
    'K13: below −15 °C, ask the dealer: the model’s mix is past its point long before; wind 56.6 m/s is 203.6 km/h',
    () => {
      expect(frostNight(ROOF_MACHINE, -15).coldestMin).toBeLessThan(glycolFreeze(ROOF_MACHINE.glycol));
      expect(56.6 * 3.6).toBeCloseTo(203.8, 0);
    },
    LONG,
  );
  it('K14: 2.595 kWh per 24 h at 45 K: the loss chosen, 2.4 W/K, gives 2.59; a tank cooling from 65 °C over 24 h', () => {
    expect((ROOF_MACHINE.tankLoss * 45 * 24) / 1000).toBeCloseTo(2.595, 1);
    const r = nightTestRun({ ...ROOF_MACHINE, checkValve: true }, 20, 65, 24);
    pin('K14-cooling-kWh', r.skin / KWH, 1);
  });
});

describe('independent figures on this machine', () => {
  const local = localOf(ROOF_MACHINE);
  const n = ROOF_MACHINE.nodes.risers;
  it('K17: at its test flow the chain returns the certificate at three points', () => {
    for (const x of [0, 0.03, 0.06]) {
      expect(cellsEfficiency(local, x, 800, TEST_RATE, n)).toBeCloseTo(curveEfficiency(CURVE_BLACK, x, 800), 5);
    }
    expect(curveEfficiency(CURVE_BLACK, 0, 800)).toBe(0.778);
    pin('K17-local-F', local.F, 3);
    pin('K17-local-u1', local.u1, 2);
    pin('K17-local-u2', local.u2, 3);
  });
  it('K18: the incidence modifier, K(10°…70°)', () => {
    const expected = [0.98, 0.97, 0.96, 0.94, 0.9, 0.83, 0.69];
    [10, 20, 30, 40, 50, 60, 70].forEach((t, i) => expect(incidenceModifier(IAM_BLACK, t)).toBe(expected[i]));
  });
  it('K19: the collector’s standard day, 9.8/7.5/5.2 … 80 K: 0/0/0 kWh per panel', () => {
    const table: [number, number[]][] = [
      [-5, [9.8, 7.5, 5.2]],
      [5, [8.3, 6.0, 3.7]],
      [20, [6.2, 4.0, 1.8]],
      [50, [2.4, 0.7, 0]],
      [80, [0, 0, 0]],
    ];
    for (const [dT, row] of table) {
      [6.3, 4.7, 3.1].forEach((H, i) => {
        const v = certificateDay(CURVE_BLACK, ROOF_UNIT.grossArea, H, dT, IAM_BLACK);
        pin(`K19-${dT}-${H}`, v, 1);
        expect(Math.abs(v - row[i]!)).toBeLessThan(0.5);
      });
    }
  });
  for (const site of SITES_ALL) {
    DRAWS.forEach((d, i) => {
      const [Qd, QL, f] = K21[site][i]!;
      it(
        `K21 ${site} ${d} L/day: reported ${QL} MJ/a, ${f} %`,
        () => {
          const y = year(ROOF_MACHINE, site, d);
          pin(`K21-${site}-${d}`, y.QLMJ, -2);
          pin(`K21f-${site}-${d}`, 100 * y.fraction, 0);
          // K52, the arithmetic of the load: Qd retrieved exactly
          expect(y.QdMJ / Qd).toBeCloseTo(1, 3);
          // a flag, not a target: the model stays within a quarter of the table
          expect(Math.abs(y.QLMJ / QL - 1)).toBeLessThan(0.25);
          // the sun of the year is Keymark's, by construction
          expect(y.planeKWh).toBeGreaterThan(0.95 * SITES[site].planeAnnual);
          expect(Math.abs(y.imbalance) / y.book.absorbed).toBeLessThan(1e-6);
        },
        LONG,
      );
    });
  }
  const selective: MachineSpec = { ...ROOF_MACHINE, curve: CURVE_SELECTIVE, plateEmissivity: EMISSIVITY.selective };
  const K22: [SiteId, number][] = [
    ['stockholm', 5540],
    ['wurzburg', 5949],
    ['davos', 8688],
    ['athens', 7114],
  ];
  for (const [site, QL] of K22) {
    it(
      `K22 ${site}: a selective plate at 200 L/day, reported ${QL} MJ/a`,
      () => {
        pin(`K22-${site}`, year(selective, site, 200).QLMJ, -2);
      },
      LONG,
    );
  }
  const K23: [SiteId, number][] = [
    ['stockholm', 3486],
    ['wurzburg', 3959],
    ['davos', 5314],
  ];
  for (const [site, QL] of K23) {
    it(
      `K23 ${site}: one collector, 180 L, reported ${QL} MJ/a`,
      () => {
        pin(`K23-${site}`, year(ONE_COLLECTOR_180, site, 200).QLMJ, -2);
      },
      LONG,
    );
  }
  it(
    'K24: « Q factor » 35.535 MJ at 16 MJ/m²·day, ΔT 10 °C',
    () => {
      pin('K24-MJ', qFactorRun(ROOF_MACHINE, 16e6, 10) / 1e6, 0);
    },
    LONG,
  );
  it('K20, K25: comparators as data; the selective curve stagnates far above the black one', () => {
    expect(stagnationRise(CURVE_SELECTIVE, 1000)).toBeGreaterThan(stagnationRise(CURVE_BLACK, 1000));
  });
});

describe('the night, and the height of the tank', () => {
  const clear = (s: MachineSpec) => juneOptions('athens', s, 'clear');
  const roof = (y: number, patch: Partial<MachineSpec> = {}): NightResult => {
    const s = { ...ROOF_MACHINE, ...patch, tankHeight: y };
    return dayNightRun(s, clear(s));
  };
  const LBL: [number, number, string, number][] = [
    [1.83, 171, 'about 0', 0],
    [0.61, 149, 'about −2', 0],
    [0, 131, 'about −2', 1],
    [-0.61, 104, 'about −6', 10],
    [-1.22, 68, '−20 to −16', 21],
  ];
  for (const [y, peak, night, lost] of LBL) {
    it(
      `K28 LBL y = ${y}: reported peak ${peak} L/h, night ${night} L/h, ${lost} % lost by morning (a model of 1981, by eye)`,
      () => {
        const s = { ...LBL_1981, tankHeight: y };
        const r = dayNightRun(s, lblOptions());
        pin(`K28-peak-${y}`, r.peakFlow, -1);
        pin(`K28-night-${y}`, r.nightFlow, 0);
        pin(`K28-lost-${y}`, 100 * r.lostShare, 0);
        pin(`K28-E-${y}`, r.peakEnergy / KWH, 0);
        expect(r.nightFlow).toBeLessThan(0.1);
      },
      LONG,
    );
  }
  it(
    'K27: reverse flow « negligible » with the tank’s bottom at or above the collector’s top, « substantial » below: on the machine of LBL',
    () => {
      const at = (y: number) => dayNightRun({ ...LBL_1981, tankHeight: y }, lblOptions()).lostShare;
      expect(at(0)).toBeLessThan(0.05);
      expect(at(-1.22)).toBeGreaterThan(2 * at(0));
    },
    LONG,
  );
  it(
    'K29: the day does not care about the height, on LBL’s machine: daytime energy, tubes, pipes, a mixed tank',
    () => {
      const r = (patch: Partial<MachineSpec>): NightResult => dayNightRun({ ...LBL_1981, ...patch }, lblOptions());
      const base = r({});
      const low = r({ tankHeight: -1.22 });
      const high = r({ tankHeight: 1.83 });
      pin('K29-E-high', high.peakEnergy / KWH, 0);
      pin('K29-E-low', low.peakEnergy / KWH, 0);
      expect(Math.abs(low.peakEnergy / high.peakEnergy - 1)).toBeLessThan(0.1);
      // reported: tubes of ¼ to ½ in, no change; ⅛ in, −2 %; pipes 1 → ¼ in, flow −87 %, energy −16 %; mixed against 11 K layered, about −10 %
      const q = r({ riserBore: 0.008 });
      const h = r({ riserBore: 0.01384 });
      const e = r({ riserBore: 0.00483 });
      pin('K29-tube-quarter-flow', q.peakFlow, -1);
      pin('K29-tube-half-flow', h.peakFlow, -1);
      pin('K29-tube-quarter-half-energy', h.peakEnergy / q.peakEnergy - 1, 2);
      pin('K29-tube-eighth-energy', e.peakEnergy / q.peakEnergy - 1, 2);
      const inch = r({ pipeBore: 0.0266 });
      const quarter = r({ pipeBore: 0.008 });
      pin('K29-pipe-flow', quarter.peakFlow / inch.peakFlow - 1, 1);
      pin('K29-pipe-energy', quarter.peakEnergy / inch.peakEnergy - 1, 1);
      const mixed = r({ mixedTank: true });
      pin('K29-mixed', mixed.peakEnergy / base.peakEnergy - 1, 1);
    },
    LONG,
  );
  it('K30: on the real roof the tank’s bottom is within 5 cm of the collector’s top, at any pitch', () => {
    for (const tilt of [10, 20, 30]) {
      const y = (ROOF_UNIT.railToFoot - ROOF_UNIT.collectorLength) * Math.sin((tilt * Math.PI) / 180) - 0.05;
      expect(Math.abs(y)).toBeLessThan(0.05);
    }
    expect(ROOF_MACHINE.tankHeight).toBe(0);
  });
  it(
    'K31: three real systems, clear nights: about 7,000 kJ a night, almost 8,000 kJ at 10 °C; « rather unimportant »',
    () => {
      for (const [c, key] of [
        [CYPRUS_1, '1'],
        [CYPRUS_2, '2'],
        [CYPRUS_3, '3'],
      ] as const) {
        const r10 = nightTestRun(c, 10);
        const r20 = nightTestRun(c, 20);
        pin(`K31-${key}-10`, r10.lost / 1000, -2);
        pin(`K31-${key}-20`, r20.lost / 1000, -2);
        pin(`K31-${key}-share`, (r10.lost - r10.skin) / r10.lost, 1);
        expect(c.tankHeight).toBeGreaterThan(0);
      }
      // their heights: Ho − Hc = 25, 90, 240 mm
      expect(CYPRUS_1.tankHeight).toBeCloseTo(0.025, 6);
      expect(CYPRUS_2.tankHeight).toBeCloseTo(0.09, 6);
      expect(CYPRUS_3.tankHeight).toBeCloseTo(0.24, 6);
    },
    LONG,
  );
  it(
    'find, the sweep on this machine: a clear June night at Athens',
    () => {
      const heights = [1.83, 0.61, 0.3, 0.1, 0, -0.1, -0.2, -0.3, -0.61, -0.9, -1.22];
      const pts = heightSweep(ROOF_MACHINE, heights, clear);
      for (const { y, result: r } of pts) {
        pin(`sweep-lost-${y}`, 100 * r.lostShare, 0);
        pin(`sweep-gain-${y}`, r.peakEnergy / KWH, 0);
        pin(`sweep-kWh-${y}`, r.lost / KWH, 1);
        pin(`sweep-skin-${y}`, r.skin / KWH, 1);
        pin(`sweep-night-${y}`, r.nightFlow, 0);
        pin(`sweep-peak-${y}`, r.peakFlow, -1);
      }
      pin('find-5pct', heightWhereLossPasses(pts, 0.05)!, 1);
      pin('find-10pct', heightWhereLossPasses(pts, 0.1)!, 1);
    },
    LONG,
  );
  it(
    'find, without the sky: the same sweep on a plate that only sees the air',
    () => {
      const heights = [1.83, 0.61, 0.3, 0.1, 0, -0.1, -0.2, -0.3, -0.61, -0.9, -1.22];
      const pts = heightSweep({ ...ROOF_MACHINE, skyTerm: false }, heights, clear);
      for (const y of [0.61, 0, -0.3, -0.61]) {
        pin(`nosky-lost-${y}`, 100 * pts.find((p) => p.y === y)!.result.lostShare, 0);
      }
      expect(heightWhereLossPasses(pts, 0.05)).toBeNull();
      pin('nosky-1pct', heightWhereLossPasses(pts, 0.01)!, 1);
    },
    LONG,
  );
  it(
    'K61: a tank alone loses about 1.3 kWh in 12 h; a bad tank about doubles the night’s loss',
    () => {
      const good = roof(0.61);
      const bad = roof(-0.3);
      const night = (r: NightResult): number => (r.skin + r.lost) / KWH;
      pin('K61-good', night(good), 1);
      pin('K61-bad', night(bad), 1);
      expect(night(bad) / night(good)).toBeGreaterThan(1.5);
    },
    LONG,
  );
  it(
    'K33, find: the plate below the air on a clear night; the reverse flow’s outlet below the air; the guard’s size',
    () => {
      pin('K33-depression-black-10C', plateDepression(10, 1, 2, { plateEmissivity: EMISSIVITY.black }), 1);
      pin('K33-depression-selective-10C', plateDepression(10, 1, 2, { plateEmissivity: EMISSIVITY.selective }), 1);
      pin('K33-depression-calm', plateDepression(10, 1, 0.5, { plateEmissivity: EMISSIVITY.black }), 1);
      pin('K33-depression-windy', plateDepression(10, 1, 5, { plateEmissivity: EMISSIVITY.black }), 1);
      pin('K33-depression-black-minus7C', plateDepression(-7, 1, 2, { plateEmissivity: EMISSIVITY.black }), 1);
      const r = frostNight(ROOF_MACHINE, 0);
      pin('K33-outlet-below-share', r.outletBelowAirShare, 1);
      pin('K33-plate-below-trickle', r.plateMeanBelow, 1);
      const v = frostNight({ ...ROOF_MACHINE, checkValve: true }, 0);
      pin('K33-plate-below-valve', v.plateMeanBelow, 1);
      expect(v.plateMeanBelow).toBeGreaterThan(r.plateMeanBelow);
    },
    LONG,
  );
  it(
    'find, the valve on a clear June night: the plate’s mean against the air, and its coldest node',
    () => {
      for (const [name, y] of [
        ['0', 0],
        ['low', -0.61],
      ] as const) {
        const open = roof(y);
        const shut = roof(y, { checkValve: true });
        pin(`valve-plate-${name}-open`, -open.plateMeanBelow, 1);
        pin(`valve-plate-${name}-shut`, -shut.plateMeanBelow, 1);
        pin(`valve-coldest-${name}-open`, open.coldestMin, 1);
        pin(`valve-coldest-${name}-shut`, shut.coldestMin, 1);
      }
    },
    LONG,
  );
  it(
    'find, the frost margin: the coldest hour of the air at which a clear night reaches the fluid’s freezing point',
    () => {
      const f = (patch: Partial<MachineSpec>): number => frostThreshold({ ...ROOF_MACHINE, ...patch });
      pin('frost-mix', f({}), 0);
      pin('frost-mix-valve', f({ checkValve: true }), 0);
      pin('frost-mix-40', f({ glycol: 40 }), 0);
      const direct: Partial<MachineSpec> = { circuit: 'direct', glycol: 0 };
      pin('frost-direct', f(direct), 0);
      pin('frost-direct-valve', f({ ...direct, checkValve: true }), 0);
      pin('frost-direct-selective', f({ ...direct, curve: CURVE_SELECTIVE, plateEmissivity: EMISSIVITY.selective }), 0);
      pin('frost-direct-low', f({ ...direct, tankHeight: -0.61 }), 0);
      pin('frost-direct-low-valve', f({ ...direct, tankHeight: -0.61, checkValve: true }), 0);
      pin('frost-mix-low', f({ tankHeight: -0.61 }), 0);
      pin('frost-mix-low-valve', f({ tankHeight: -0.61, checkValve: true }), 0);
      // the maker: open circuits « not suitable » below 5 °C (K12)
      expect(f(direct)).toBeGreaterThan(0);
    },
    LONG,
  );
  it(
    'K34: beliefs and optima: « at least 18 inches », or 15 to 20 cm below; the year by height, Athens and Würzburg',
    () => {
      for (const y of [-1.22, -0.61, -0.3, -0.1, 0, 0.1, 0.3, 0.61, 1.83]) {
        pin(`K34-athens-${y}`, year({ ...ROOF_MACHINE, tankHeight: y }, 'athens', 200).QLMJ, -2);
      }
      for (const y of [-0.3, 0, 0.3]) {
        pin(`K34-wurzburg-${y}`, year({ ...ROOF_MACHINE, tankHeight: y }, 'wurzburg', 200).QLMJ, -2);
      }
    },
    LONG,
  );
  it(
    'find, the valve over a year: what the reverse flow costs at y = 0',
    () => {
      for (const site of SITES_ALL) {
        const a = year(ROOF_MACHINE, site, 200).QLMJ;
        const b = year({ ...ROOF_MACHINE, checkValve: true }, site, 200).QLMJ;
        pin(`valve-year-${site}`, b / a - 1, 2);
      }
    },
    LONG,
  );
  it(
    'find, K45: pipes bare against insulated over a year (the maker says no need; a simulation ranks them over 10 %)',
    () => {
      for (const site of SITES_ALL) {
        const a = year(ROOF_MACHINE, site, 200).QLMJ;
        const b = year({ ...ROOF_MACHINE, pipeInsulated: true }, site, 200).QLMJ;
        pin(`pipes-year-${site}`, b / a - 1, 2);
      }
      const bare = dayNightRun(ROOF_MACHINE, clear(ROOF_MACHINE));
      const ins = dayNightRun({ ...ROOF_MACHINE, pipeInsulated: true }, clear(ROOF_MACHINE));
      pin('pipes-day-bare', bare.peakEnergy / KWH, 0);
      pin('pipes-day-insulated', ins.peakEnergy / KWH, 0);
    },
    LONG,
  );
});

describe('flow in the loop', () => {
  const noon = dayNightRun(ROOF_MACHINE, juneOptions('athens', ROOF_MACHINE, 'clear'));
  it('K35: Ingolstadt’s reference on water: 35–45 kg/h, a rise of 20–30 K', () => {
    const r = dayNightRun(INGOLSTADT_180, juneOptions('wurzburg', INGOLSTADT_180, 'clear', 170));
    pin('K35-flow', r.peakFlow, -1);
    pin('K35-rise', r.peakRise, 0);
  });
  it('K36: test flow 0.020 kg/s·m²; LBL’s 171 L/h on 3.9 m² is about 0.012', () => {
    expect(TEST_RATE).toBeCloseTo(83.6, 1);
    expect((171 / 3600 / 3.9) * 1.0).toBeCloseTo(0.012, 3);
  });
  it('K37: at 131 L/h in a 20 mm pipe about 12 cm/s; −6 L/h about 0.5 cm/s; 19 L in 9 min, 3 h 10', () => {
    const A = (Math.PI * ROOF_UNIT.pipeBore ** 2) / 4;
    expect((131e-3 / 3600 / A) * 100).toBeCloseTo(11.6, 1);
    expect((6e-3 / 3600 / A) * 100).toBeCloseTo(0.53, 2);
    expect((19 / 131) * 60).toBeCloseTo(8.7, 1);
    expect(19 / 6).toBeCloseTo(3.17, 2);
    // the model's own noon
    pin('K37-model-speed', ((noon.peakFlow * 1e-3) / 3600 / A) * 100, 0);
  });
  it('K38: the push, about 40 Pa or 4 mm of water at a 15 K rise (an order of magnitude); the model at the peak', () => {
    pin('K38-head', noon.peakHead, -1);
    pin('K38-rise', noon.peakRise, 0);
    pin('K38-mm', noon.peakHead / 9.81, 0);
    pin('K38-peak-flow', noon.peakFlow, -1);
    pin('find-Re', noon.peakRe, -2);
  });
  it('K39: F’U_L 8.34, F’(τα) 0.829; at 0.012 kg/s·m² of mix F_R(τα) about 0.756, at 0.006 −12 %', () => {
    const FpU = localLoss(LINEAR_BLACK.a1, TEST_RATE);
    expect(FpU).toBeCloseTo(8.34, 2);
    const Fp = LINEAR_BLACK.eta0 / removalRatio(FpU, TEST_RATE);
    expect(Fp).toBeCloseTo(0.829, 3);
    const c = glycolMix(ROOF_MACHINE.glycol).cp;
    expect(c).toBeCloseTo(3980, -1);
    expect(Fp * removalRatio(FpU, 0.012 * c)).toBeCloseTo(0.761, 2);
    expect((Fp * removalRatio(FpU, 0.006 * c)) / LINEAR_BLACK.eta0 - 1).toBeCloseTo(-0.11, 2);
  });
  it('first light: the flow starts well after the plate’s net gain turns positive', () => {
    pin('find-flow-start', noon.flowStartHour, 0);
    pin('find-gain-start', noon.gainStartHour, 0);
  });
});

describe('whole-system tests by others', () => {
  it('K40: the store’s measured loss and capacity go in as they are', () => {
    expect(ISFH_200.tankLoss).toBe(2.21);
    expect((ISFH_200.tankVolume * RHO_C_WATER) / 1e6).toBeCloseTo(0.79, 2);
  });
  const K41: [SiteId, number, number][] = [
    ['athens', 80, 850],
    ['davos', 80, 1110],
    ['wurzburg', 80, 800],
    ['stockholm', 80, 720],
    ['athens', 170, 1490],
    ['davos', 170, 1570],
    ['wurzburg', 170, 1170],
    ['stockholm', 170, 1040],
  ];
  for (const [site, d, v] of K41) {
    it(
      `K41 ${site} ${d} L/day: reported about ${v} kWh/a, read by eye`,
      () => {
        pin(`K41-${site}-${d}`, year(ISFH_200, site, d).QLMJ / 3.6, -2);
      },
      LONG,
    );
  }
  it(
    'K42: stagnation measured: 109 °C in a closed tank, about +3.7 bar',
    () => {
      const r = stagnationRun(ISFH_200, 'wurzburg', 180, 5, 95);
      pin('K42-top', r.maxTop, 0);
      // the pressure of a closed tank at that temperature: the water's own expansion (bar over a stiff tank is beyond this model)
      expect(boilingPoint(3.7e5)).toBeGreaterThan(r.maxTop);
    },
    LONG,
  );
  it('K44: most double-jacket tanks stay layered over 40 to 60 % of their volume at 600 L/h', () => {
    pin('K44-fraction', drawOffRun(ROOF_MACHINE).fraction, 1);
  });
  it(
    'K66: measured, 800 and 763 kWh/m²a on 4 m², 300 L; the model at Athens, 400 L/day',
    () => {
      const v = year(ROOF_MACHINE, 'athens', 400).QLMJ / 3.6 / ROOF_MACHINE.grossArea;
      pin('K66', v, -1);
      expect(10031 / 3.6 / ROOF_MACHINE.grossArea).toBeCloseTo(696, -1);
    },
    LONG,
  );
});

describe('demand and safety', () => {
  it('K51: four people at 56 L at 40 °C and 12 °C mains are 190 L at 45 °C, range 112 to 268', () => {
    const atLoad = (l: number) => (4 * l * (40 - 12)) / (45 - 12);
    expect(atLoad(56)).toBeCloseTo(190, 0);
    expect(atLoad(56 - 23)).toBeCloseTo(112, 0);
    expect(atLoad(56 + 23)).toBeCloseTo(268, 0);
  });
  it('K52: the load behind K21 is 45 °C: the cold water follows the air', () => {
    for (const site of SITES_ALL) {
      const dT = 45 - SITES[site].coldWater;
      expect((200 * 365 * 4186 * dT) / 1e6).toBeCloseTo(K21[site][0]![0], 3);
    }
    expect(SITES.athens.coldWater).toBeCloseTo(17.96, 2);
  });
  it('K53–K55: the limits of the tap and the band', () => {
    expect(TAP_LIMIT).toBe(50);
    expect(BAND_LOW).toBe(25);
    expect(BAND_HIGH).toBe(45);
  });
});

describe('derived figures', () => {
  it('K57: 300 L from 20 to 60 °C is 50.2 MJ, 13.9 kWh', () => {
    expect((300 * 4186 * 40) / 1e6).toBeCloseTo(50.2, 1);
    expect((300 * 4186 * 40) / KWH).toBeCloseTo(13.95, 1);
  });
  it('K58: full minus empty leaves about 10 L of jacket, and the circuit agrees', () => {
    expect(ROOF_UNIT.tankFull - ROOF_UNIT.tankEmpty - 300).toBe(10);
    expect(JACKET_VOLUME * 1000).toBeCloseTo(10.57, 1);
  });
  it('K59: 515 kg is 0.83 kN/m² averaged, the tank 1.7 kN/m', () => {
    expect((515 * 9.81) / (2.43 * 2.49) / 1000).toBeCloseTo(0.835, 2);
    expect((417 * 9.81) / 2.43 / 1000).toBeCloseTo(1.683, 2);
  });
  it('K60: 300 L from 10 to 80 °C pushes out 8.6 L', () => {
    expect(300 * (waterRho(10) / waterRho(80) - 1)).toBeCloseTo(8.6, 1);
  });
  it(
    'K62: selective against black: the research’s 29 K drops the quadratic term; with it the curves cross at 25 K at 800 W/m²',
    () => {
      const linear = (CURVE_BLACK.eta0 - CURVE_SELECTIVE.eta0) / (CURVE_BLACK.a1 - CURVE_SELECTIVE.a1);
      expect(linear).toBeCloseTo(0.0363, 3);
      expect(linear * 800).toBeCloseTo(29, 0);
      // both curves, the full form
      const G = 800;
      let x = 0.03;
      for (let i = 0; i < 30; i++) {
        const d = curveEfficiency(CURVE_BLACK, x, G) - curveEfficiency(CURVE_SELECTIVE, x, G);
        const dd = -(CURVE_BLACK.a1 - CURVE_SELECTIVE.a1) - 2 * (CURVE_BLACK.a2 - CURVE_SELECTIVE.a2) * G * x;
        x -= d / dd;
      }
      expect(x * G).toBeCloseTo(25.2, 0);
      // the year: reported +10, +9, +11, +6 % (K22 over K21)
      const sel: MachineSpec = { ...ROOF_MACHINE, curve: CURVE_SELECTIVE, plateEmissivity: EMISSIVITY.selective };
      for (const site of SITES_ALL)
        pin(`K62-${site}`, year(sel, site, 200).QLMJ / year(ROOF_MACHINE, site, 200).QLMJ - 1, 2);
    },
    LONG,
  );
  it(
    'K63: two collectors against one, Davos: reported 1.47',
    () => {
      pin('K63', year(ROOF_MACHINE, 'davos', 200).QLMJ / year(ONE_COLLECTOR_180, 'davos', 200).QLMJ, 1);
    },
    LONG,
  );
  it('K64: the curve extrapolated at 1,000 W/m², 30 °C air: about 119 °C; through the model, a collector with nothing moving', () => {
    expect(30 + stagnationRise(CURVE_BLACK, 1000)).toBeCloseTo(119, 0);
    const local = localOf(ROOF_MACHINE);
    const dT = 30 + (-local.u1 + Math.sqrt(local.u1 * local.u1 + 4 * local.u2 * local.F * 1000)) / (2 * local.u2);
    expect(dT).toBeCloseTo(30 + 88.8, -1);
  });
  it(
    'K65: K24 is 59 % of the sun on the aperture; LBL 45 %',
    () => {
      expect(35.535 / (16 * 3.74)).toBeCloseTo(0.594, 2);
      pin('K65-model', qFactorRun(ROOF_MACHINE, 16e6, 10) / 1e6 / (16 * 3.74), 2);
      const lbl = dayNightRun(LBL_1981, lblOptions());
      pin('K65-lbl', lbl.peakEnergy / (20.08e6 * 3.9), 2);
    },
    LONG,
  );
});

describe('how good the numbers are', () => {
  const clear = (s: MachineSpec) => juneOptions('athens', s, 'clear');
  it(
    'the step: halving it moves a year by under 0.5 % and a night by under a point',
    () => {
      const a = yearRun(ROOF_MACHINE, 'athens', 200, 120).QLMJ;
      const b = yearRun(ROOF_MACHINE, 'athens', 200, 60).QLMJ;
      expect(Math.abs(a / b - 1)).toBeLessThan(0.005);
      const s = { ...ROOF_MACHINE, tankHeight: -0.3 };
      const c = dayNightRun(s, { ...clear(s), h: 10 });
      const d = dayNightRun(s, { ...clear(s), h: 5 });
      expect(Math.abs(c.lostShare - d.lostShare)).toBeLessThan(0.01);
    },
    LONG,
  );
  it(
    'the nodes: doubling them moves a night by under a point',
    () => {
      for (const y of [0, -0.3, -0.61]) {
        const s = { ...ROOF_MACHINE, tankHeight: y };
        const a = dayNightRun(s, clear(s));
        const t = { ...s, nodeScale: 2 };
        const b = dayNightRun(t, clear(t));
        expect(Math.abs(a.lostShare - b.lostShare), `y ${y}`).toBeLessThan(0.012);
      }
    },
    LONG,
  );
  it(
    'the seed of the weather moves a year by under 0.5 %, the sky’s form by under 2 %',
    () => {
      const a = yearRun(ROOF_MACHINE, 'athens', 200, 120, 1).QLMJ;
      const b = yearRun(ROOF_MACHINE, 'athens', 200, 120, 2).QLMJ;
      const m = yearRun(ROOF_MACHINE, 'athens', 200, 120, 1, 'mean').QLMJ;
      expect(Math.abs(a / b - 1)).toBeLessThan(0.005);
      expect(Math.abs(a / m - 1)).toBeLessThan(0.02);
    },
    LONG,
  );
  it('the month sums to the site’s figure, day by day', () => {
    const c = climateFor(ROOF_MACHINE, { ...DEFAULT_SKY, site: 'athens', sky: 'series', seed: 3 });
    let june = 0;
    for (let d = 151; d < 181; d++) june += c.dayIrradiation(d);
    const scale = SITES.athens.planeAnnual / SITES.athens.monthlyPlane.reduce((a, b) => a + b, 0);
    // on the machine's 30°, from the site's 25°: a few percent off the site's own plane
    expect(june / KWH).toBeGreaterThan(0.85 * SITES.athens.monthlyPlane[5]! * scale);
    expect(june / KWH).toBeLessThan(1.1 * SITES.athens.monthlyPlane[5]! * scale);
  });
  it('the load is exact: a year’s draws sum to the demand', () => {
    const load = keymarkLoad('athens', 200);
    const litres = load.draws.reduce((a, w) => a + (w.to - w.from) * 3600 * w.lps, 0);
    expect(litres).toBeCloseTo(200, 6);
  });
});

describe('the doc', () => {
  it('names every key figure, retrieved or not', () => {
    const doc = raw['../../docs/physics.md'] ?? '';
    for (let k = 1; k <= 66; k++) expect(doc, `K${k}`).toMatch(new RegExp(`\\bK${k}\\b`));
  });
  it('the plant’s friction is tubeResistance, whichever way the flow runs: no simulation file calls tubeFlow', () => {
    const sources = import.meta.glob(['./*.ts', '!./*.test.ts'], {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>;
    expect(Object.keys(sources).length).toBeGreaterThan(5);
    for (const [file, text] of Object.entries(sources)) expect(text, file).not.toMatch(/\btubeFlow\b/);
    expect(sources['./plant.ts']).toMatch(/loopResistance\(p, Math\.abs\(p\.Q\)\)/);
  });
  it('the core’s water: same specific heat as the core’s liquidWater, real density', () => {
    expect(water().cp).toBe(4186);
    expect(water().rho(60)).toBeLessThan(water().rho(20));
    expect(collectorRise(ROOF_MACHINE)).toBeCloseTo(0.97, 2);
  });
  it('prints what the model gives when asked: VITE_PRINT_PINS=1 npx vitest run src/sim/figures.test.ts --disable-console-intercept', () => {
    if (import.meta.env.VITE_PRINT_PINS) console.log(`PINS${JSON.stringify(given)}`);
  });
});
