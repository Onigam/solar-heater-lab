import { describe, expect, it } from 'vitest';
import { SWEEP_HEIGHTS, SolarSim, TAP_LIMIT, THERMAL_STEP } from './engine';
import { ROOF_MACHINE } from './machine';
import { loopHead, plantEnergy } from './plant';
import { PRESET_IDS, RANGES, scenarioSetup, SCENARIO_IDS, SPEEDS } from './presets';
import { dayNightRun, juneOptions } from './runs';
import { ALARM_TEXTS, PRESET_TEXTS, SCENARIO_TEXTS } from './texts';

// The engine as the kit and a film see it: the LabSim contract, the two clocks, the moments, and that every scenario does what it says.

const run = (sim: SolarSim, seconds: number, dt = 1 / 30): void => {
  for (let i = 0; i < seconds / dt; i++) sim.step(dt);
};

describe('the LabSim contract', () => {
  it('has the kit’s time controls and a state', () => {
    const sim = new SolarSim();
    expect(sim.params.slowMo).toBe(1);
    expect(sim.params.running).toBe(true);
    expect(sim.params.timeScale).toBeGreaterThan(0);
    expect(sim.state.layers).toHaveLength(10);
    expect(sim.state.onDrawnMachine).toBe(true);
  });
  it('does nothing while paused', () => {
    const sim = new SolarSim();
    sim.set({ running: false });
    const t = sim.state.simTime;
    run(sim, 1);
    expect(sim.state.simTime).toBe(t);
  });
  it('clamps what it is given, and a change of machine makes it custom', () => {
    const sim = new SolarSim();
    expect(sim.params.preset).toBe('family-300');
    sim.set({ tankHeight: 99 });
    expect(sim.params.tankHeight).toBe(RANGES.tankHeight.max);
    expect(sim.state.tankHeight).toBe(RANGES.tankHeight.max);
    expect(sim.params.preset).toBe('custom');
    sim.set({ tankHeight: -99 });
    expect(sim.params.tankHeight).toBe(RANGES.tankHeight.min);
    sim.applyPreset('family-300');
    sim.set({ timeScale: 60 });
    expect(sim.params.preset).toBe('family-300');
  });
  it('tells its listeners', () => {
    const sim = new SolarSim();
    let n = 0;
    sim.onChange(() => n++);
    sim.set({ hour: 12 });
    expect(n).toBeGreaterThan(0);
  });
  it('knows when it is the machine of the published table', () => {
    const sim = new SolarSim();
    expect(sim.onPublishedMachine).toBe(true);
    sim.set({ tankHeight: 0.2 });
    expect(sim.onPublishedMachine).toBe(false);
    sim.set({ tankHeight: 0 });
    sim.set({ demand: 300, site: 'davos' });
    expect(sim.onPublishedMachine).toBe(true);
    sim.applyPreset('lbl-1981');
    expect(sim.onPublishedMachine).toBe(false);
  });
  it('offers speeds up to a day per second', () => {
    expect(SPEEDS[0]).toBe(1);
    expect(SPEEDS[SPEEDS.length - 1]).toBe(86400);
  });
});

describe('same inputs, same state', () => {
  it('two engines with the same steps are identical', () => {
    const a = new SolarSim();
    const b = new SolarSim();
    for (const s of [a, b]) {
      s.applyScenario('june-day');
      run(s, 30);
      s.set({ tankHeight: -0.3 });
      run(s, 10);
    }
    expect(a.state.flowLph).toBe(b.state.flowLph);
    expect(Array.from(a.state.layers)).toEqual(Array.from(b.state.layers));
    expect(Array.from(a.state.loopT)).toEqual(Array.from(b.state.loopT));
  });
  it('reset comes back to the same start', () => {
    const sim = new SolarSim();
    sim.applyScenario('bad-tank');
    const top = sim.state.tankTop;
    run(sim, 5);
    sim.reset();
    expect(sim.state.tankTop).toBe(top);
    expect(sim.state.simTime).toBe(0);
  });
});

describe('two clocks', () => {
  it('at a time scale of 0 the hour stops, and the flow still settles', () => {
    const sim = new SolarSim();
    sim.applyScenario('june-day');
    sim.set({ hour: 12 });
    run(sim, 2);
    sim.set({ timeScale: 0 });
    sim.plantNow.Q = 0; // a film starts a machine that is not up to speed
    const hour = sim.state.hour;
    const layers = Array.from(sim.state.layers);
    run(sim, 120, 0.1);
    expect(sim.state.hour).toBe(hour);
    expect(Array.from(sim.state.layers)).toEqual(layers);
    expect(sim.state.flowLph).toBeGreaterThan(50);
  });
  it('at high speed the clock keeps time', () => {
    const sim = new SolarSim();
    sim.set({ timeScale: 3600 });
    const h0 = sim.state.hour;
    run(sim, 2);
    expect(sim.state.hour - h0).toBeCloseTo(2, 1);
  });
  it('the heat moves in fixed steps, whatever the frame', () => {
    expect(THERMAL_STEP).toBe(5);
    const a = new SolarSim();
    const b = new SolarSim();
    for (const s of [a, b]) s.set({ timeScale: 60 });
    for (let i = 0; i < 300; i++) a.step(1 / 60);
    for (let i = 0; i < 150; i++) b.step(1 / 30);
    expect(a.state.simTime).toBe(b.state.simTime);
    expect(a.state.tankTop).toBeCloseTo(b.state.tankTop, 9);
  });
  it('a long frame cannot run away', () => {
    const sim = new SolarSim();
    sim.set({ timeScale: 86400 });
    const t0 = performance.now();
    sim.step(10);
    expect(performance.now() - t0).toBeLessThan(200);
  });
});

describe('energy', () => {
  it('is conserved over a week to better than a millionth', () => {
    const sim = new SolarSim();
    sim.applyScenario('june-day');
    sim.set({ timeScale: 14400 });
    const plant = sim.plantNow;
    const E0 = plantEnergy(plant);
    const b0 = { ...plant.book };
    run(sim, 42, 0.1);
    const b = plant.book;
    const inflow = b.absorbed - b0.absorbed + (b.boost - b0.boost);
    const outflow =
      b.collectorLoss -
      b0.collectorLoss +
      (b.pipeLoss - b0.pipeLoss) +
      (b.tankLoss - b0.tankLoss) +
      (b.delivered - b0.delivered) +
      (b.relief - b0.relief);
    expect(sim.state.simTime).toBeGreaterThan(6 * 86400);
    expect(Math.abs(plantEnergy(plant) - E0 - (inflow - outflow)) / inflow).toBeLessThan(1e-6);
  });
});

describe('the height of the tank', () => {
  it('a low tank runs backward at night, a high one hardly, with the sign alone', () => {
    const low = new SolarSim();
    low.applyScenario('bad-tank');
    const high = new SolarSim();
    high.applyScenario('good-night');
    high.set({ tankHeight: 1 });
    for (const s of [low, high]) s.set({ hour: 23 });
    run(low, 6);
    run(high, 6);
    expect(low.state.flowLph).toBeLessThan(-5);
    expect(low.state.flowDir).toBe(-1);
    expect(low.state.alarms).toContain('reverseFlow');
    expect(Math.abs(high.state.flowLph)).toBeLessThan(1);
  });
  it('below the middle of the collector the day stops too: a false flow does not appear at any step', () => {
    const at = (h: number): number => {
      const spec = { ...ROOF_MACHINE, tankHeight: -1.22 };
      return dayNightRun(spec, { ...juneOptions('athens', spec, 'clear'), h }).peakFlow;
    };
    expect(at(5)).toBeLessThan(20);
    expect(at(60)).toBeLessThan(20);
  });
  it('the one-way valve stops it dead, and the head stays', () => {
    const sim = new SolarSim();
    sim.applyScenario('one-way-valve');
    sim.set({ hour: 23 });
    run(sim, 6);
    expect(sim.state.flowLph).toBe(0);
    expect(loopHead(sim.plantNow)).toBeLessThan(0);
    expect(sim.state.alarms).not.toContain('reverseFlow');
  });
  it('the hot pipe and the state follow the slider', () => {
    const sim = new SolarSim();
    sim.set({ tankHeight: 0.5 });
    const base = sim.state.tankBase;
    sim.set({ tankHeight: 1.0 });
    expect(sim.state.tankBase - base).toBeCloseTo(0.5, 6);
    expect(sim.state.loopZ.length).toBe(sim.state.loopT.length);
  });
  it('the sweep’s heights span the slider', () => {
    expect(SWEEP_HEIGHTS[0]).toBe(RANGES.tankHeight.min);
    expect(SWEEP_HEIGHTS[SWEEP_HEIGHTS.length - 1]).toBe(RANGES.tankHeight.max);
    const sim = new SolarSim();
    const row = sim.getSweepRow(SWEEP_HEIGHTS.indexOf(0));
    expect(row.y).toBe(0);
    expect(row.gainKWh).toBeGreaterThan(1);
    expect(row.valveLostShare).toBeLessThanOrEqual(row.lostShare);
  });
});

describe('the moments, for a film', () => {
  it('the flow starts in the morning: a counter rises', () => {
    const sim = new SolarSim();
    sim.applyScenario('first-light');
    expect(sim.state.flowStarted).toBe(0);
    run(sim, 30);
    expect(sim.state.flowStarted).toBeGreaterThanOrEqual(1);
  });
  it('the reversal counts, on a low tank', () => {
    const sim = new SolarSim();
    sim.applyScenario('bad-tank');
    run(sim, 60);
    expect(sim.state.reversalCount).toBeGreaterThanOrEqual(1);
  });
  it('a shower is a gesture, and it counts', () => {
    const sim = new SolarSim();
    sim.set({ timeScale: 60, hour: 15, demand: 0 });
    sim.drawShower();
    expect(sim.state.showerCount).toBe(1);
    const bottom = sim.state.tankBottom;
    run(sim, 5);
    expect(sim.state.tapFlow).toBeGreaterThan(5);
    expect(sim.state.tankBottom).toBeLessThan(bottom);
    run(sim, 10);
    expect(sim.state.tapFlow).toBe(0);
  });
  it('all keys of the parameters are flat', () => {
    const sim = new SolarSim();
    for (const v of Object.values(sim.params)) expect(typeof v === 'object').toBe(false);
  });
});

describe('what the alarms say', () => {
  it('the tap burns with no mixing valve on a hot tank', () => {
    const sim = new SolarSim();
    sim.applyScenario('june-day');
    sim.set({ hour: 15, tempering: false });
    run(sim, 2);
    expect(sim.state.tapT).toBeGreaterThan(TAP_LIMIT);
    expect(sim.state.alarms).toContain('tapHot');
    sim.set({ tempering: true });
    run(sim, 0.5);
    expect(sim.state.tapT).toBeLessThanOrEqual(TAP_LIMIT);
    expect(sim.state.alarms).not.toContain('tapHot');
  });
  it('a holiday week shuts the overheat valve, and the cold relief drips on the way', () => {
    const sim = new SolarSim();
    sim.applyScenario('holiday-week');
    let shut = false;
    let drip = 0;
    for (let i = 0; i < 42 * 20; i++) {
      sim.step(0.05);
      shut ||= sim.state.alarms.includes('overheatShut');
      drip = Math.max(drip, sim.state.reliefDrip);
    }
    expect(shut).toBe(true);
    expect(drip).toBeGreaterThan(0.1);
    expect(sim.state.reliefLitres).toBeGreaterThan(1);
  });
  it('frost: a clear night at −7 °C reaches the mix’s freezing point, water much sooner', () => {
    const sim = new SolarSim();
    sim.applyScenario('frost');
    let first = -Infinity;
    for (let i = 0; i < 15.5 * 20; i++) {
      sim.step(0.05);
      if (sim.state.frostMargin <= 0) first = Math.max(first, sim.state.airT);
    }
    expect(first).toBeLessThan(0);
    expect(first).toBeGreaterThan(-7);
    expect(sim.state.freezeT).toBeLessThan(-8);
    run(sim, 2);
    expect(sim.state.circuit).toBe('direct');
    expect(sim.state.freezeT).toBe(0);
  });
  it('a tank in the band for days gets its notice, once, and only there', () => {
    const sim = new SolarSim();
    sim.set({ site: 'stockholm', day: 15, hour: 0, sky: 'mean', timeScale: 86400, demand: 200 });
    run(sim, 6, 0.05);
    expect(sim.state.tankTop).toBeGreaterThan(5);
    const text = sim.state.alarms.filter((a) => a === 'legionellaZone');
    expect(text.length).toBeLessThanOrEqual(1);
  });
  it('every alarm has its words', () => {
    for (const [k, v] of Object.entries(ALARM_TEXTS)) {
      expect(v.text[0].length, k).toBeGreaterThan(5);
      expect(v.text[1].length, k).toBeGreaterThan(5);
    }
  });
});

describe('the presets', () => {
  it('there is one for each machine, the 3D draws only the first', () => {
    expect(PRESET_IDS).toHaveLength(7);
    const sim = new SolarSim();
    for (const id of PRESET_IDS) {
      expect(PRESET_TEXTS[id][0].length).toBeGreaterThan(3);
      sim.applyPreset(id);
      expect(sim.params.preset).toBe(id);
      expect(sim.state.onDrawnMachine).toBe(id === 'family-300');
      run(sim, 0.5);
      expect(Number.isFinite(sim.state.tankTop), id).toBe(true);
      expect(Number.isFinite(sim.state.flowLph), id).toBe(true);
    }
  });
});

describe('the twelve scenarios', () => {
  it('there are twelve, with their words, and each runs to the end', () => {
    expect(SCENARIO_IDS).toHaveLength(12);
    for (const id of SCENARIO_IDS) {
      const t = SCENARIO_TEXTS[id];
      expect(t.lesson[0].length, id).toBeGreaterThan(60);
      expect(t.lesson[1].length, id).toBeGreaterThan(60);
      const sim = new SolarSim();
      sim.applyScenario(id);
      expect(sim.params.preset).toBe('custom');
      expect(sim.params.timeScale).toBe(scenarioSetup(id).params.timeScale);
      for (let i = 0; i < 45 * 10; i++) {
        sim.step(0.1);
        expect(Number.isFinite(sim.state.tankTop), id).toBe(true);
        expect(Number.isFinite(sim.state.flowLph), id).toBe(true);
      }
    }
  });
  it('first-light: nothing moves at dawn, then the flow starts by itself', () => {
    const sim = new SolarSim();
    sim.applyScenario('first-light');
    expect(Math.abs(sim.state.flowLph)).toBeLessThan(5);
    run(sim, 40);
    expect(sim.state.flowLph).toBeGreaterThan(30);
  });
  it('passing-cloud: the flow falls within minutes, the tank does not notice', () => {
    const sim = new SolarSim();
    sim.applyScenario('passing-cloud');
    run(sim, 7.5);
    const flow = sim.state.flowLph;
    const top = sim.state.tankTop;
    run(sim, 8);
    expect(sim.state.flowLph).toBeLessThan(0.7 * flow);
    expect(Math.abs(sim.state.tankTop - top)).toBeLessThan(1.5);
    run(sim, 20);
    expect(sim.state.flowLph).toBeGreaterThan(0.7 * flow);
    expect(sim.params.cloud).toBe(0);
  });
  it('family-morning: four showers, and the tap is told when the valve goes', () => {
    const sim = new SolarSim();
    sim.applyScenario('family-morning');
    let hot = false;
    for (let i = 0; i < 45 * 20; i++) {
      sim.step(0.05);
      hot ||= sim.state.alarms.includes('tapHot');
    }
    expect(sim.state.showerCount).toBe(4);
    expect(hot).toBe(true);
    expect(sim.params.tempering).toBe(true);
  });
  it('mixed-tank: top and bottom are one', () => {
    const sim = new SolarSim();
    sim.applyScenario('mixed-tank');
    run(sim, 10);
    expect(sim.state.tankTop).toBeCloseTo(sim.state.tankBottom, 6);
  });
  it('narrow-tubes: the flow collapses', () => {
    const sim = new SolarSim();
    sim.applyScenario('narrow-tubes');
    sim.set({ hour: 11, timeScale: 60 });
    run(sim, 3);
    const flow = sim.state.flowLph;
    sim.set({ riserBore: 0.007 });
    run(sim, 6);
    expect(flow).toBeLessThan(0.6 * sim.state.flowLph);
  });
  it('boost-always-on: the booster runs, the top of the tank sits at the set point', () => {
    const sim = new SolarSim();
    sim.applyScenario('boost-always-on');
    run(sim, 3);
    expect(sim.state.tankTop).toBeGreaterThan(50);
    expect(sim.state.tankBottom).toBeLessThan(sim.state.tankTop - 5);
  });
});

describe('a step stays cheap', () => {
  it('a day per second at 60 frames stays well under a frame', () => {
    const sim = new SolarSim();
    sim.set({ timeScale: 86400 });
    const t0 = performance.now();
    for (let i = 0; i < 300; i++) sim.step(1 / 60);
    const perFrame = (performance.now() - t0) / 300;
    expect(perFrame).toBeLessThan(10);
  });
});
