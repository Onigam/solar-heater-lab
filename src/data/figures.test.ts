import { describe, expect, it } from 'vitest';
import { ROOF_MACHINE } from '../sim/machine';
import { dayNightRun, juneOptions, KWH, yearRun } from '../sim/runs';
import { ROOF_UNIT } from '../sim/machine';
import { BANK_WIDTH, COLLECTOR, drawnTankHeight, RAIL_ANGLE } from '../three/dims';
import pinsSource from '../sim/figures.test.ts?raw';
import { FIG, markOf, SWEEP_TABLE, YEAR_TABLE, type FigName } from './figures';

// Each figure the texts print against its source: the pins of src/sim/figures.test.ts (what the model gives, read as text, so that a moved pin shows here), one live year and one live day of the model, and the arithmetic of the derived ones. A failure here means a sheet says something the model no longer does.

const pin = (key: string): number => {
  const m = pinsSource.match(new RegExp(`['"]?${key.replace(/[.-]/g, (c) => `\\${c}`)}['"]?: (-?[\\d.]+),`));
  if (!m) throw new Error(`no pin ${key}`);
  return Number(m[1]);
};

/** name, pin key, multiplier from the pin's unit to the figure's. The figure must print the pin's value at its own number of decimals, or within half a unit of its last digit. */
const FROM_PINS: [FigName, string, number][] = [
  ['pushPa', 'K38-head', 1],
  ['pushMm', 'K38-mm', 1],
  ['peakRise', 'K38-rise', 1],
  ['peakFlow', 'sweep-peak-0', 1],
  ['nightFlow', 'sweep-night-0', 1],
  ['skin0', 'sweep-skin-0', 1],
  ['lost0', 'sweep-kWh-0', 1],
  ['lost0Pct', 'sweep-lost-0', 1],
  ['lostP061', 'sweep-lost-0.61', 1],
  ['lostM03Pct', 'sweep-lost--0.3', 1],
  ['lostM03', 'sweep-kWh--0.3', 1],
  ['nightM03', 'K61-bad', 1],
  ['nightGood', 'K61-good', 1],
  ['lostM061Pct', 'sweep-lost--0.61', 1],
  ['gainM061', 'sweep-gain--0.61', 1],
  ['gainM09', 'sweep-gain--0.9', 1],
  ['gainM122', 'sweep-gain--1.22', 1],
  ['y10pct', 'find-10pct', 1],
  ['noSky0', 'nosky-lost-0', 1],
  ['noSkyM03', 'nosky-lost--0.3', 1],
  ['yearAthens', 'K21-athens-200', 1],
  ['yearM03', 'K34-athens--0.3', 1],
  ['yearM061', 'K34-athens--0.61', 1],
  ['yearM122', 'K34-athens--1.22', 1],
  ['yearP03', 'K34-athens-0.3', 1],
  ['valveYearLow', 'valve-year-stockholm', 100],
  ['valveYearHigh', 'valve-year-davos', 100],
  ['depression', 'K33-depression-black-10C', 1],
  ['depressionCalm', 'K33-depression-calm', 1],
  ['depressionWindy', 'K33-depression-windy', 1],
  ['depressionSel', 'K33-depression-selective-10C', 1],
  ['frostMix', 'frost-mix', 1],
  ['frostMix40', 'frost-mix-40', 1],
  ['frostWater', 'frost-direct', 1],
  ['topEvening', 'K11-top-evening', 1],
  ['topMorning', 'K11-top-morning', 1],
  ['bottomEvening', 'K11-bottom-evening', 1],
  ['holidayNoValve', 'K11-holiday-no-valve', 1],
  ['holidayValve', 'K11-holiday-valve', 1],
  ['holidayCollector', 'K11-holiday-collector', 1],
  ['stagnationModel', 'K42-top', 1],
  ['drawFraction', 'K44-fraction', 100],
  ['boostHours', 'K9-hours', 1],
  ['selectiveModelLow', 'K62-athens', 100],
  ['selectiveModelHigh', 'K62-davos', 100],
  ['pipesYearLow', 'pipes-year-athens', 100],
  ['pipesYearHigh', 'pipes-year-davos', 100],
];

describe('the figures of the texts', () => {
  for (const [name, key, k] of FROM_PINS) {
    it(`${name} prints the pin ${key}`, () => {
      const f = FIG[name];
      // a pin rounded to its decimals, up to half a unit of the last digit shown, plus what the pin's own rounding holds
      const tol = 0.5 * 10 ** -f.d + 1e-3 * k + 1e-9;
      expect(Math.abs(f.v - pin(key) * k), `${f.v} against ${pin(key) * k}`).toBeLessThanOrEqual(
        tol + 0.051 * 10 ** -(f.d - 1) * 0,
      );
    });
  }
  it('the sweep’s table is the pins, row by row', () => {
    for (const r of SWEEP_TABLE) {
      const y = String(r.y);
      expect(Math.abs(r.peak - pin(`sweep-peak-${y}`)), `peak ${y}`).toBeLessThan(0.6);
      expect(Math.abs(r.night - pin(`sweep-night-${y}`)), `night ${y}`).toBeLessThan(0.06);
      expect(Math.abs(r.gain - pin(`sweep-gain-${y}`)), `gain ${y}`).toBeLessThan(0.006);
      expect(Math.abs(r.lost - pin(`sweep-lost-${y}`)), `lost ${y}`).toBeLessThan(0.06);
      expect(Math.abs(r.kwh - pin(`sweep-kWh-${y}`)), `kwh ${y}`).toBeLessThan(0.006);
      expect(Math.abs(Math.max(0, r.skin) - Math.max(0, pin(`sweep-skin-${y}`))), `skin ${y}`).toBeLessThan(0.006);
    }
  });
  it('the yearly table: the model’s column is the pins, and the spread is what the texts say', () => {
    const draws = [200, 250, 300, 400];
    let low = 0;
    let high = 0;
    for (const row of YEAR_TABLE) {
      row.rows.forEach(([ql, , model], i) => {
        expect(Math.abs(model - pin(`K21-${row.site}-${draws[i]}`)), `${row.site} ${draws[i]}`).toBeLessThan(1);
        const r = (100 * (model - ql)) / ql;
        low = Math.min(low, r);
        high = Math.max(high, r);
      });
    }
    expect(Math.round(low)).toBe(FIG.yearSpreadLow.v);
    expect(Math.round(high)).toBe(FIG.yearSpreadHigh.v);
  });
  it(
    'a year at Athens and at Stockholm is what the bands of the sheet say, and it adds up',
    { timeout: 120000 },
    () => {
      const check = (site: 'athens' | 'stockholm', names: Record<string, FigName>): void => {
        const b = yearRun(ROOF_MACHINE, site, 200).book;
        const near = (n: FigName, j: number): void => expect(Math.abs(FIG[n].v - j / KWH), n).toBeLessThan(1);
        near(names.sun!, b.sun);
        near(names.optics!, b.sun - b.absorbed);
        near(names.coll!, b.collectorLoss);
        near(names.pipe!, b.pipeLoss);
        near(names.tank!, b.tankLoss);
        near(names.delivered!, b.delivered);
        near(names.backup!, b.backup);
      };
      check('athens', {
        sun: 'ySun',
        optics: 'yOptics',
        coll: 'yCollectorLoss',
        pipe: 'yPipeLoss',
        tank: 'yTankLoss',
        delivered: 'yDelivered',
        backup: 'yBackup',
      });
      check('stockholm', {
        sun: 'sSun',
        optics: 'sOptics',
        coll: 'sCollectorLoss',
        pipe: 'sPipeLoss',
        tank: 'sTankLoss',
        delivered: 'sDelivered',
        backup: 'sBackup',
      });
      expect(FIG.ySun.v - FIG.yOptics.v - FIG.yCollectorLoss.v - FIG.yPipeLoss.v - FIG.yTankLoss.v).toBeCloseTo(
        FIG.yDelivered.v,
        -1,
      );
    },
  );
  it('a clear June day gives the hours and the speeds the texts say', { timeout: 60000 }, () => {
    const r = dayNightRun(ROOF_MACHINE, juneOptions('athens', ROOF_MACHINE, 'clear'));
    expect(FIG.flowStart.v).toBeCloseTo(r.flowStartHour, 2);
    expect(FIG.gainStart.v).toBeCloseTo(r.gainStartHour, 2);
    // 7.133 h is 7 h 08; the text says about 7:10. 4.858 h is 4 h 51; the text says 4:50
    expect(Math.abs(r.flowStartHour * 60 - (7 * 60 + 10))).toBeLessThan(3);
    expect(Math.abs(r.gainStartHour * 60 - (4 * 60 + 50))).toBeLessThan(3);
    const A = (Math.PI * ROOF_UNIT.pipeBore ** 2) / 4;
    expect(Math.round(((r.peakFlow * 1e-3) / 3600 / A) * 100)).toBe(FIG.pipeSpeed.v);
    expect(Math.round((19 / r.peakFlow) * 60)).toBe(FIG.loopTurn.v);
    // the speed in a riser: the same flow over 70 tubes of the estimated bore
    const riser = (r.peakFlow * 1e-3) / 3600 / (FIG.risersAll.v * ((Math.PI * COLLECTOR.riserBore ** 2) / 4));
    expect(Math.abs(riser * 100 - FIG.riserSpeed.v)).toBeLessThan(0.06);
  });
});

describe('the arithmetic of the marked figures', () => {
  it('holds the derived ones', () => {
    expect(FIG.risersAll.v).toBe(2 * ROOF_UNIT.risersPerCollector);
    expect(FIG.apertureAll.v).toBeCloseTo(3.74, 6);
    expect(FIG.riserPitch.v).toBeCloseTo(29.3, 1);
    expect(FIG.jacketL.v).toBe(10);
    expect(FIG.loadArea.v).toBeCloseTo(0.835, 2);
    expect(FIG.loadLine.v).toBeCloseTo(1.683, 2);
    expect(FIG.glycolPct.v).toBeCloseTo(23.7, 1);
    expect(FIG.railAngle.v).toBeCloseTo((Math.atan(FIG.railRaiseAll.v / 1000 / BANK_WIDTH) * 180) / Math.PI, 6);
    expect(FIG.railAngle.v).toBeCloseTo(0.66, 2);
    expect(Math.abs(RAIL_ANGLE)).toBeGreaterThan(0);
    expect(FIG.tankfulKwh.v).toBeCloseTo((300 * 4186 * 40) / KWH, 0);
    expect(FIG.cyprusKwh.v).toBeCloseTo(7000 / 3600, 1);
    expect(FIG.tankLossWk.v).toBeCloseTo(2595 / 24 / 45, 1);
    expect(FIG.fittingsWidth.v).toBeCloseTo((ROOF_UNIT.systemWidth - ROOF_UNIT.tankCaseLength) * 100, 6);
  });
  it('reads the estimates from dims.ts', () => {
    expect(FIG.drawnY.v).toBeCloseTo(drawnTankHeight() * 100, 6);
    expect(FIG.vesselLength.v).toBeCloseTo(1.973, 2);
    expect(FIG.headerBore.v).toBeCloseTo(27.1, 0);
    expect(Math.abs(FIG.jacketModelL.v - 10.57)).toBeLessThan(0.05);
    expect(FIG.hotPipe.v + FIG.coldPipe.v).toBeCloseTo(FIG.pipesAll.v, 6);
  });
  it('marks what is computed †, what is estimated *', () => {
    expect(markOf('derived')).toBe('†');
    expect(markOf('model')).toBe('†');
    expect(markOf('estimate')).toBe('*');
    expect(markOf('assumption')).toBe('*');
  });
});
