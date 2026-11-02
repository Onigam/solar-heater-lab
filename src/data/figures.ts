// The figures the texts of src/data write by {placeholder}: the French and English spellings of a number can never drift apart, and each one carries its mark by construction, so that a computed or an
// estimated number cannot be written without it.
//
// What the marks mean to the visitor (the same as the simulation panel, `tagLegend` in src/panels/strings.ts, and the sheets, `marksLegend` in src/drawings/draw.ts):
//   no mark    REPORTED: stated by a source of docs/research.md. Written in the text itself, and checked against the list of data.test.ts.
//   †          COMPUTED: arithmetic on reported figures (research: derived), or a result of this lab's model (src/sim). The sentence says which.
//   *          ESTIMATE: the sources are silent, a choice of this lab (research §3, the tags of src/three/dims.ts, an assumption of how to run the model).
// Nothing here is tuned to anything. `figures.test.ts` recomputes the model's and the derived figures from src/sim and src/three/dims.ts, so that a change of either cannot go unnoticed.
import {
  BANK,
  COLLECTOR,
  drawnTankHeight,
  HEADER_BORE_MM,
  PIPE_BORE_MM,
  RAIL_ANGLE_DEG,
  ROOF_NUMBERS,
  TANK,
} from './dims-read';

export type FigStatus = 'derived' | 'model' | 'assumption' | 'estimate';

export interface Fig {
  /** The value, in the unit shown. */
  v: number;
  /** Decimals shown. */
  d: number;
  s: FigStatus;
  /** Unit with its leading space when it takes one: a string, or [fr, en] when the languages differ. */
  u?: string | readonly [string, string];
  /** A value that is no plain number: an hour, a signed figure spelt differently. */
  t?: readonly [string, string];
}

/** † for what is computed, * for what is estimated. The one place that decides it. */
export const markOf = (s: FigStatus): string => (s === 'derived' || s === 'model' ? '†' : '*');

const pct: readonly [string, string] = [' %', '%'];

const d = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'derived', u });
const m = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'model', u });
const a = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'assumption', u });
const e = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'estimate', u });
const hour = (v: number, fr: string, en: string): Fig => ({ v, d: 2, s: 'model', t: [fr, en] });

export const FIG = {
  // ---- arithmetic on reported figures
  risersAll: d(70, 0), // 2 × 35
  apertureAll: d(ROOF_NUMBERS.collectors * ROOF_NUMBERS.apertureArea, 2, ' m²'), // 2 × 1.87
  riserPitch: d(COLLECTOR.riserPitch * 1000, 1, ' mm'), // 1,027 / 35
  frameWidth: d(COLLECTOR.frameWidth * 1000, 0, ' mm'), // what leaves 1.87 m² in 1.943 × 1.027 m
  rise30: d(COLLECTOR.length * Math.sin(Math.PI / 6), 2, ' m'), // the collector's rise at 30°
  jacketL: d(ROOF_NUMBERS.tankFull - ROOF_NUMBERS.tankEmpty - 300, 0, ' L'), // 417 − 107 − 300
  loadArea: d((ROOF_NUMBERS.massFull * 9.81) / (2.43 * 2.49) / 1000, 2, ' kN/m²'), // 515 kg on 2.43 × 2.49 m
  loadLine: d((ROOF_NUMBERS.tankFull * 9.81) / 2.43 / 1000, 1, ' kN/m'), // 417 kg along 2.43 m
  expansionL: d(8.6, 1, ' L'), // 300 L from 10 to 80 °C, by the density of water
  tankfulKwh: d(13.9, 1, ' kWh'), // 300 L from 20 to 60 °C
  tankfulHours: d(7, 0, ' h'), // 13.9 kWh at 2 kW
  glycolPct: d((4.5 / 19) * 100, 0, pct), // one 4.5 L bottle in 19 L
  glycolFreeze: d(-9.2, 1, ' °C'), // the maker's table at that share
  railRaiseAll: d(24, 0, ' mm'), // 2 × 12
  railAngle: d(RAIL_ANGLE_DEG, 2, '°'), // atan(24 mm over the bank's width)
  fourPeople: d(190, 0, ' L'), // 4 × 56 L at 40 °C, as litres at 45 °C from 12 °C mains
  fourPeopleLow: d(112, 0, ' L'),
  fourPeopleHigh: d(268, 0, ' L'),
  cyprusKwh: d(1.9, 1, ' kWh'), // 7,000 kJ
  tankLossWk: d(2.4, 1, ' W/K'), // 2.595 kWh in 24 h at 45 K
  blackStag: d(119, 0, ' °C'), // the certificate's curve at η = 0, 1,000 W/m², 30 °C air, beyond its range
  crossK: d(25, 0, ' K'), // where the two curves cross at 800 W/m², quadratic terms kept
  crossG: d(800, 0, ' W/m²'),
  selectiveLow: d(6, 0, pct), // K22 over K21: Athens
  selectiveHigh: d(11, 0, pct), // K22 over K21: Davos
  fittingsWidth: d(12, 0, ' cm'), // 2.43 − 2.31 m

  // ---- the model on the machine: Athens, a clear June day, 200 L a day (docs/physics.md §4.2), y = 0 unless named
  flowStart: hour(7.133, '7 h 10', '7:10'),
  gainStart: hour(4.858, '4 h 50', '4:50'),
  peakFlow: m(132, 0, ' L/h'),
  pipeSpeed: m(12, 0, ' cm/s'),
  pushPa: m(65, 0, ' Pa'),
  pushMm: m(6.6, 1, ' mm'),
  peakRise: m(17, 0, ' K'),
  nightFlow: m(-1.5, 1, ' L/h'),
  skin0: m(0.86, 2, ' kWh'),
  lost0: m(0.45, 2, ' kWh'),
  lost0Pct: m(4.8, 1, pct),
  lostP061: m(1.1, 1, pct),
  lostM03Pct: m(13.7, 1, pct),
  lostM03: m(1.36, 2, ' kWh'),
  nightM03: m(2.13, 2, ' kWh'),
  nightGood: m(0.97, 2, ' kWh'),
  lostM061Pct: m(15.3, 1, pct),
  gainM061: m(9.17, 2, ' kWh'),
  gainM09: m(3.58, 2, ' kWh'),
  gainM122: m(1.28, 2, ' kWh'),
  y10pct: m(-0.17, 2, ' m'),
  noSky0: m(1, 1, pct),
  noSkyM03: m(3, 1, pct),
  yearAthens: m(6796, 0, ' MJ'),
  yearM03: m(6522, 0, ' MJ'),
  yearM061: m(5325, 0, ' MJ'),
  yearM122: m(722, 0, ' MJ'),
  yearP03: m(6854, 0, ' MJ'),
  yearSpreadLow: m(-12, 0, pct),
  yearSpreadHigh: m(8, 0, pct),
  valveYearLow: m(0.9, 1, pct),
  valveYearHigh: m(2, 1, pct),
  valveLost0: m(0.4, 1, pct),
  plateOpen0: m(-2.1, 1, ' K'),
  plateValve0: m(-3.8, 1, ' K'),
  depression: m(5.4, 1, ' K'),
  depressionCalm: m(7.9, 1, ' K'),
  depressionWindy: m(3.3, 1, ' K'),
  depressionSel: m(3.9, 1, ' K'),
  frostMix: m(-3.2, 1, ' °C'),
  frostMix40: m(-15.8, 1, ' °C'),
  frostWater: m(5.6, 1, ' °C'),
  topEvening: m(72.5, 1, ' °C'),
  topMorning: m(68.1, 1, ' °C'),
  bottomEvening: m(46.6, 1, ' °C'),
  holidayNoValve: m(94, 0, ' °C'),
  holidayValve: m(85, 0, ' °C'),
  holidayCollector: m(116, 0, ' °C'),
  stagnationModel: m(104, 0, ' °C'),
  drawFraction: m(61, 0, pct),
  mixedYear: m(12, 0, pct),
  stratLow: m(-3, 0, pct),
  stratHigh: m(1.4, 1, pct),
  cliffY: m(-0.6, 1, ' m'),
  narrow3Flow: m(53, 0, ' L/h'),
  narrow3Day: m(3, 0, pct),
  narrow3Year: m(8, 0, pct),
  narrow2Flow: m(23, 0, ' L/h'),
  narrow2Rise: m(61, 0, ' K'),
  narrow2Day: m(13, 0, pct),
  pipesYearLow: m(0.9, 1, pct),
  pipesYearHigh: m(1.7, 1, pct),
  boostHours: m(2.8, 1, ' h'),
  selectiveModelLow: m(3, 0, pct),
  selectiveModelHigh: m(6.5, 1, pct),
  boil80: m(117, 0, ' °C'),
  boil200: m(133, 0, ' °C'),
  loopTurn: m(9, 0, ' min'),

  // ---- a year of the model, Athens and Stockholm at 200 L a day (`book` of yearRun), kWh
  ySun: m(7116, 0, ' kWh'),
  yOptics: m(1955, 0, ' kWh'), // sun − absorbed
  yCollectorLoss: m(2592, 0, ' kWh'),
  yPipeLoss: m(189, 0, ' kWh'),
  yTankLoss: m(492, 0, ' kWh'),
  yDelivered: m(1888, 0, ' kWh'),
  yBackup: m(408, 0, ' kWh'),
  sSun: m(4522, 0, ' kWh'),
  sOptics: m(1297, 0, ' kWh'), // sun − absorbed
  sCollectorLoss: m(1518, 0, ' kWh'),
  sPipeLoss: m(88, 0, ' kWh'),
  sTankLoss: m(273, 0, ' kWh'),
  sDelivered: m(1346, 0, ' kWh'),
  sBackup: m(1738, 0, ' kWh'),

  // ---- estimates: the sources are silent. Dimensions from src/three/dims.ts, the rest from docs/research.md §3, docs/physics.md §1
  riserBore: e(COLLECTOR.riserBore * 1000, 0, ' mm'),
  headerBore: e(HEADER_BORE_MM, 0, ' mm'),
  pipeBore: e(PIPE_BORE_MM, 0, ' mm'),
  gapBank: e(BANK.gap * 1000, 0, ' mm'),
  vesselDia: e(TANK.vesselR * 2 * 1000, 0, ' mm'),
  vesselLength: e(TANK.vesselLength, 2, ' m'),
  jacketGap: e(TANK.jacketGap * 1000, 1, ' mm'),
  jacketHeight: e(TANK.jacketHeight * 1000, 0, ' mm'),
  jacketModelL: e(10.6, 1, ' L'),
  jacketArea: e(1.3, 1, ' m²'),
  jacketUA: e(300, 0, ' W/K'),
  foamThick: e(25, 0, ' mm'),
  hotPipe: e(0.35, 2, ' m'),
  coldPipe: e(2.3, 1, ' m'),
  pipesAll: e(2.65, 2, ' m'),
  belowDetour: e(2.2, 1, ' m'),
  drawnY: e(drawnTankHeight() * 100, 1, ' cm'),
  yBand: e(5, 0, ' cm'),
  overheatSet: e(85, 0, ' °C'),
  overheatLow: e(80, 0, ' °C'),
  overheatHigh: e(90, 0, ' °C'),
  plateEps: e(0.9, 1),
  dryCapacity: e(6, 0, ' kJ/m²K'),
  stratify: e(70, 0, pct),
  layerEnd: e(16, 0, ' L'),
  layerMid: e(37, 0, ' L'),
  layersN: a(10, 0),
  riserSpeed: e(1.4, 1, ' cm/s'),
  showerFlow: a(10, 0, ' L/min'),
  showerMin: a(8, 0, ' min'),
  tiltDrawn: a(30, 0, '°'),
  swingOpen: e(5, 0, ' Pa'),
  dotFloor: e(8, 0, ' mm/s'),
  timerFrom: a(16, 0, ' h'),
  timerTo: a(19, 0, ' h'),
  kettle2: d(2, 0, ' kW'),
} as const satisfies Record<string, Fig>;

export type FigName = keyof typeof FIG;

/** The model's sweep of the tank's height, as docs/physics.md §4.2 and the pins of src/sim/figures.test.ts have it: Athens, a clear June day, 200 L a day. `lbl`: the 1981 model's share, reported, read by eye, on its upright tank. */
export const SWEEP_TABLE: readonly {
  y: number;
  peak: number;
  night: number;
  gain: number;
  lost: number;
  kwh: number;
  skin: number;
  lbl?: string;
}[] = [
  { y: 1.83, peak: 173, night: -0.1, gain: 8.81, lost: 0.9, kwh: 0.08, skin: 0.83, lbl: '0' },
  { y: 0.61, peak: 153, night: -0.2, gain: 9.0, lost: 1.1, kwh: 0.1, skin: 0.87, lbl: '0' },
  { y: 0.3, peak: 144, night: -0.2, gain: 9.07, lost: 1.5, kwh: 0.13, skin: 0.88 },
  { y: 0.1, peak: 137, night: -0.6, gain: 9.19, lost: 2.7, kwh: 0.25, skin: 0.88 },
  { y: 0, peak: 132, night: -1.5, gain: 9.34, lost: 4.8, kwh: 0.45, skin: 0.86, lbl: '< 1' },
  { y: -0.1, peak: 125, night: -3.1, gain: 9.53, lost: 7.9, kwh: 0.75, skin: 0.83 },
  { y: -0.2, peak: 115, night: -4.9, gain: 9.72, lost: 10.9, kwh: 1.06, skin: 0.8 },
  { y: -0.3, peak: 102, night: -7.1, gain: 9.89, lost: 13.7, kwh: 1.36, skin: 0.77 },
  { y: -0.61, peak: 32, night: -14, gain: 9.17, lost: 15.3, kwh: 1.4, skin: 0.51, lbl: '10' },
  { y: -0.9, peak: 9, night: -10.1, gain: 3.58, lost: 6, kwh: 0.21, skin: 0.06 },
  { y: -1.22, peak: 6, night: -9.3, gain: 1.28, lost: 8.4, kwh: 0.11, skin: 0, lbl: '21' },
];

/** The published yearly results at 200, 250, 300 and 400 L a day (reported: solar energy to the load, MJ, and the fraction, %), with what the model gives (docs/physics.md §3.1). */
export const YEAR_TABLE: readonly {
  site: 'stockholm' | 'wurzburg' | 'davos' | 'athens';
  rows: readonly (readonly [number, number, number])[];
}[] = [
  {
    site: 'stockholm',
    rows: [
      [5030, 45.3, 4845],
      [5676, 40.9, 5529],
      [6096, 36.6, 6053],
      [6373, 28.7, 6775],
    ],
  },
  {
    site: 'wurzburg',
    rows: [
      [5481, 51.5, 5264],
      [6279, 47.2, 6011],
      [6865, 43.0, 6581],
      [7280, 34.2, 7354],
    ],
  },
  {
    site: 'davos',
    rows: [
      [7833, 65.0, 6907],
      [8751, 58.1, 7800],
      [9345, 51.7, 8469],
      [9736, 40.4, 9362],
    ],
  },
  {
    site: 'athens',
    rows: [
      [6726, 81.4, 6796],
      [7871, 76.2, 8087],
      [8825, 71.2, 9201],
      [10031, 60.7, 10864],
    ],
  },
];
