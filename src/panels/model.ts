import type { SweepRow } from '../sim/engine';
import type { SiteId } from '../sim/climate';
import { TAP_LIMIT } from '../sim/engine';
import { KWH, type YearResult } from '../sim/runs';
import type { Scope, SolarParams, SolarState } from '../sim/types';
import type { PanelKey } from './strings';

// What the panel plots and says, as plain functions of the simulation: a test checks the numbers and the status line without a browser.

/** A figure of the panel, with its tag: `†` a result of the model, `*` an estimate, nothing when it is a setting or a reported value. */
export interface Readout {
  key: PanelKey;
  value: number;
  digits: number;
  unit: string;
  tag: '' | '†' | '*';
}

const m = (key: PanelKey, value: number, digits: number, unit: string, tag: Readout['tag'] = '†'): Readout => ({
  key,
  value,
  digits,
  unit,
  tag,
});

/** The few live figures that stay in sight. */
export function mainReadouts(s: SolarState): Readout[] {
  return [
    m('liveFlow', s.flowLph, Math.abs(s.flowLph) < 10 ? 1 : 0, 'L/h'),
    m('liveHead', s.headPa, Math.abs(s.headPa) < 10 ? 1 : 0, 'Pa'),
    m('liveOut', s.collectorOut, 0, '°C'),
    m('liveTop', s.tankTop, 0, '°C'),
    m('liveBottom', s.tankBottom, 0, '°C'),
    m('livePlate', s.plateMinusAir, 1, 'K'),
    m('liveGain', s.gain / 1000, 2, 'kW'),
    m('liveLoss', (s.collectorLoss + s.pipeLoss + s.tankLoss) / 1000, 2, 'kW'),
    m('liveToday', s.todayToTank / KWH, 1, 'kWh'),
    m('liveFraction', 100 * s.todayFraction, 0, '%'),
    m('liveSun', s.sunG, 0, 'W/m²', '*'),
    m('liveTap', s.tapT, 0, '°C'),
  ];
}

/** The rest, folded. */
export function moreReadouts(s: SolarState): Readout[] {
  return [
    m('moreAir', s.airT, 1, '°C', '*'),
    m('moreFloor', s.plateFloorT, 1, '°C'),
    m('moreIn', s.collectorIn, 1, '°C'),
    m('moreColdest', s.coldestT, 1, '°C'),
    m('moreFreeze', s.freezeT, 0, '°C', ''),
    m('moreMargin', s.frostMargin, 1, 'K'),
    m('moreMean', s.tankMean, 1, '°C'),
    m('moreSpeed', s.pipeSpeed * 100, 1, 'cm/s'),
    m('moreCollector', s.collectorLoss, 0, 'W'),
    m('morePipes', s.pipeLoss, 0, 'W'),
    m('moreTank', s.tankLoss, 0, 'W'),
    m('moreToTank', s.toTank, 0, 'W'),
    m('moreBoost', s.boost, 0, 'W', ''),
    m('moreDrip', s.reliefDrip, 2, 'L/h'),
    m('moreLitres', s.reliefLitres, 1, 'L'),
    m('moreTapFlow', s.tapFlow, 1, 'L/min', ''),
    m('moreDelivered', s.todayDelivered / KWH, 1, 'kWh'),
    m('moreDemand', s.todayDemand / KWH, 1, 'kWh', ''),
    m('moreSun', s.todaySun / KWH, 1, 'kWh', '*'),
  ];
}

export type Tone = 'note' | 'warn';

/** What the status line says: one message, the most important first. */
export function statusOf(s: SolarState, p: SolarParams): { key: PanelKey; tone: Tone } {
  if (s.frostMargin <= 0) return { key: 'statusFrost', tone: 'warn' };
  if (p.machine !== 'roof-unit' && !s.onDrawnMachine && s.flowDir === 0)
    return { key: 'statusOffMachine', tone: 'note' };
  if (s.overheatShut) return { key: 'statusShut', tone: 'note' };
  if (s.flowDir < 0) return { key: 'statusBackward', tone: 'note' };
  if (s.tapFlow > 0 && s.tapT < 40) return { key: 'statusLow', tone: 'note' };
  if (s.flowDir > 0) return { key: 'statusForward', tone: 'note' };
  return { key: 'statusStill', tone: 'note' };
}

/** A tap over the limit: for a test and the alarm's wording. */
export const tapOver = (s: SolarState): boolean => s.tapT > TAP_LIMIT;

/** The chart's round top: three intervals, each a round number. */
export function niceCeil3(v: number): number {
  if (!(v > 0)) return 3;
  const p = Math.pow(10, Math.floor(Math.log10(v / 3)));
  for (const f of [1, 2, 2.5, 5, 10]) if (v <= 3 * f * p) return 3 * f * p;
  return 30 * p;
}

/** Nodes of the circuit that cross a height. */
const crossing = (zMid: number, dz: number, z: number): boolean => {
  const a = zMid - Math.abs(dz) / 2;
  const b = zMid + Math.abs(dz) / 2;
  return dz !== 0 && z >= a && z <= b;
};

/**
 * The loop as two lines on one height axis: the mean temperature of what crosses each height going up, and of what crosses it coming down. A kit chart needs a growing x, so the closed T(z)
 * curve is cut this way (docs/kit-requests.md asks for the real one). The area between the lines, with its sign, is what `headPa` integrates exactly.
 */
export function loopChartData(s: SolarState, points = 36) {
  const n = s.loopT.length;
  let zMin = Infinity;
  let zMax = -Infinity;
  for (let i = 0; i < n; i++) {
    const d = Math.abs(s.loopDz[i]!) / 2;
    if (s.loopDz[i] === 0) continue;
    zMin = Math.min(zMin, s.loopZ[i]! - d);
    zMax = Math.max(zMax, s.loopZ[i]! + d);
  }
  if (s.circuit === 'direct') zMin = Math.min(zMin, s.tankBase);
  const xs: number[] = [];
  const up: number[] = [];
  const down: number[] = [];
  for (let k = 0; k < points; k++) {
    const z = zMin + ((zMax - zMin) * (k + 0.5)) / points;
    let su = 0;
    let nu = 0;
    let sd = 0;
    let nd = 0;
    for (let i = 0; i < n; i++) {
      if (!crossing(s.loopZ[i]!, s.loopDz[i]!, z)) continue;
      if (s.loopDz[i]! > 0) {
        su += s.loopT[i]!;
        nu++;
      } else {
        sd += s.loopT[i]!;
        nd++;
      }
    }
    if (s.circuit === 'direct' && z >= s.tankBase && z <= s.tankBase + s.returnHeight) {
      const l = Math.min(s.layers.length - 1, Math.floor((z - s.tankBase) / s.layerHeight));
      sd += s.layers[l]!;
      nd++;
    }
    xs.push(z);
    up.push(nu ? su / nu : Number.NaN);
    down.push(nd ? sd / nd : Number.NaN);
  }
  return { xs, up, down };
}

/** The tank from bottom to top, °C against centimetres. */
export function layersChartData(s: SolarState) {
  const xs: number[] = [];
  const T: number[] = [];
  for (let l = 0; l < s.layers.length; l++) {
    xs.push((l + 0.5) * s.layerHeight * 100);
    T.push(s.layers[l]!);
  }
  return { xs, T };
}

/** The last days, counted back from now. */
export function scopeData(scope: Scope) {
  const n = scope.t.length;
  const last = n ? scope.t[n - 1]! : 0;
  return {
    xs: scope.t.map((x) => (x - last) / 24),
    flow: scope.flow,
    top: scope.top,
    bottom: scope.bottom,
    out: scope.collectorOut,
    air: scope.air,
  };
}

/** The sweep, by height. */
export function sweepChartData(rows: readonly SweepRow[]) {
  return {
    xs: rows.map((r) => r.y),
    lost: rows.map((r) => 100 * r.lostShare),
    valve: rows.map((r) => 100 * r.valveLostShare),
    gain: rows.map((r) => r.gainKWh),
    valveGain: rows.map((r) => r.valveGainKWh),
    plate: rows.map((r) => r.plateMinusAir),
    valvePlate: rows.map((r) => r.valvePlateMinusAir),
  };
}

/** The Keymark table for this machine, MJ/a at the four sites and four draws. reported (S7 p. 33, K21). */
export const KEYMARK: Record<SiteId, Record<number, number>> = {
  stockholm: { 200: 5030, 250: 5676, 300: 6096, 400: 6373 },
  wurzburg: { 200: 5481, 250: 6279, 300: 6865, 400: 7280 },
  davos: { 200: 7833, 250: 8751, 300: 9345, 400: 9736 },
  athens: { 200: 6726, 250: 7871, 300: 8825, 400: 10031 },
};

/** One line of the year's table: the model, and the published value when one exists for the machine as it is set. */
export function yearLine(y: YearResult, onMachine: boolean) {
  const published = onMachine ? (KEYMARK[y.site][y.demand] ?? null) : null;
  return { site: y.site, QL: y.QLMJ, fraction: y.fraction, published, frostHours: y.frostHours };
}
