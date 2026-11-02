import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { SolarSim, SWEEP_HEIGHTS } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import {
  KEYMARK,
  layersChartData,
  loopChartData,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  scopeData,
  statusOf,
  sweepChartData,
  yearLine,
} from './model';
import { SimPanel } from './sim';
import { st, sx } from './strings';
import { monthOf, stripAlarms, stripClock, stripValues, STRIP_SPEEDS } from './strip';
import { FakeElement, installFakeDom } from './test-dom';

// The panel rendered on a stand-in for the DOM: that it builds, what it offers, that it follows the simulation, that a click does what it says, in both languages.

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

interface Fixture {
  sim: SolarSim;
  panel: SimPanel;
  root: FakeElement;
}

function open(lang: 'fr' | 'en' = 'fr', sim = new SolarSim()): Fixture {
  setLang(lang);
  const ctx = { sim, ui: { scene: 'house' }, gotoScene: () => undefined } as unknown as AppContext<SolarSim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement };
}

const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
const run = (panel: SimPanel, sim: SolarSim, seconds: number): void => {
  for (let i = 0; i < seconds * 30; i++) {
    sim.step(1 / 30);
    panel.tick(1 / 30);
  }
};

describe('what the panel offers', () => {
  it('opens on the machine with its presets, a custom entry and a chip per scenario', () => {
    const { root, sim } = open();
    const options = root.find('option');
    expect(options.slice(0, PRESET_IDS.length).map((o) => o.textContent)).toEqual(
      PRESET_IDS.map((id) => sx('preset', id)),
    );
    expect(options.some((o) => o.textContent === st('custom'))).toBe(true);
    for (const id of SCENARIO_IDS) expect(button(root, sx('scenario', id))).toBeDefined();
    expect(sim.params.preset).toBe('family-300');
  });

  it('shows the live figures in boxes, each with its tag in the data', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    expect(root.find('.readout')).toHaveLength(mainReadouts(sim.state).length);
    for (const r of [...mainReadouts(sim.state), ...moreReadouts(sim.state)]) {
      expect(['†', '*', '']).toContain(r.tag);
      expect(Number.isFinite(r.value), r.key).toBe(true);
    }
    expect(root.textContent).toContain('†');
    expect(root.textContent).toContain('°C');
  });

  it('says once that it is a glycol mix that climbs, not the water you drink', () => {
    setLang('en');
    const { root } = open('en');
    const text = root.textContent;
    expect(text.match(/not the water you drink/g)).toHaveLength(1);
  });

  it('runs the long jobs one by one and fills the sweep and the year', () => {
    const { root, sim, panel } = open('en');
    expect(root.textContent).not.toContain('MJ');
    run(panel, sim, 8);
    const text = root.textContent;
    expect(text).toContain('MJ');
    expect(text).toContain(sx('site', 'athens'));
    expect(text).toContain(sx('site', 'stockholm'));
    // the published value is shown next to the model's, for this machine
    expect(text).toContain('(6,726)');
    expect(text).toContain(st('yearSolar'));
    // and only on the machine it belongs to
    sim.set({ tankHeight: 0.5 });
    run(panel, sim, 40);
    expect(root.textContent).not.toContain('(6,726)');
  }, 300000);

  it('builds in both languages, with no empty label', () => {
    for (const lang of ['fr', 'en'] as const) {
      const { root, sim, panel } = open(lang);
      run(panel, sim, 0.5);
      for (const b of root.find('button')) {
        if (b.children.length) expect(b.textContent.length + b.find('svg').length, 'button').toBeGreaterThan(0);
      }
    }
  });
});

describe('what the controls do', () => {
  it('a scenario chip starts it and says its lesson; a change of setting takes the lesson away', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'bad-tank')).click();
    expect(sim.params.tankHeight).toBeCloseTo(-0.61, 6);
    expect(root.textContent).toContain(sx('lesson', 'bad-tank'));
    panel.tick(0.3);
    const slider = root.find('input')[0]!;
    slider.value = '0.5';
    slider.dispatch('input', { target: slider });
    expect(sim.params.tankHeight).toBeCloseTo(0.5, 6);
    expect(root.textContent).not.toContain(sx('lesson', 'bad-tank'));
  });

  it('the preset select changes the machine', () => {
    const { root, sim } = open();
    const select = root.find('select')[0]!;
    select.value = 'lbl-1981';
    select.dispatch('change', { target: select });
    expect(sim.params.machine).toBe('lbl-1981');
    expect(sim.state.onDrawnMachine).toBe(false);
    expect(root.find('.readout').length).toBeGreaterThan(0);
  });

  it('the panel follows a scenario that moves a setting by itself', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'passing-cloud')).click();
    for (let i = 0; i < 270; i++) sim.step(1 / 30);
    expect(sim.params.cloud).toBeGreaterThan(0.5);
    panel.tick(0.3);
    const inputs = root.find('input');
    expect(inputs.some((i) => Math.abs(Number(i.value) - sim.params.cloud) < 1e-6)).toBe(true);
  });

  it('the shower button runs a shower', () => {
    const { root, sim, panel } = open('en');
    sim.set({ timeScale: 60, hour: 15 });
    button(root, st('shower')).click();
    expect(sim.state.showerCount).toBe(1);
    run(panel, sim, 2);
    expect(sim.state.tapFlow).toBeGreaterThan(0);
  });

  it('reset starts the machine again', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    const reset = root.find('button').find((b) => b.getAttribute('aria-label') === st('resetSim'))!;
    reset.click();
    expect(sim.state.simTime).toBeLessThan(5);
  });

  it('a backward flow shows in the status', () => {
    const { root, sim, panel } = open('en');
    button(root, sx('scenario', 'bad-tank')).click();
    sim.set({ hour: 23 });
    run(panel, sim, 2);
    expect(sim.state.flowDir).toBe(-1);
    expect(root.textContent).toContain(st('statusBackward'));
    expect(stripAlarms(sim).map((a) => a.key)).toContain('reverseFlow');
    expect(stripAlarms(sim).find((a) => a.key === 'reverseFlow')?.severe).toBe(false);
  });
});

describe('the status line', () => {
  it('tells the states apart, the most important first', () => {
    const s = new SolarSim();
    const state = { ...s.state, frostMargin: 10, overheatShut: false, flowDir: 0, tapFlow: 0, tapT: 50 };
    const p = s.params;
    expect(statusOf(state, p).key).toBe('statusStill');
    expect(statusOf({ ...state, flowDir: 1 }, p).key).toBe('statusForward');
    expect(statusOf({ ...state, flowDir: -1 }, p).key).toBe('statusBackward');
    expect(statusOf({ ...state, overheatShut: true }, p).key).toBe('statusShut');
    expect(statusOf({ ...state, tapFlow: 10, tapT: 30 }, p).key).toBe('statusLow');
    expect(statusOf({ ...state, frostMargin: -1 }, p)).toEqual({ key: 'statusFrost', tone: 'warn' });
  });
});

describe('the numbers behind the charts', () => {
  it('the loop is two lines that close on the same heights', () => {
    const s = new SolarSim();
    s.set({ hour: 12, sky: 'clear' });
    for (let i = 0; i < 60; i++) s.step(0.1);
    const d = loopChartData(s.state);
    expect(d.xs.length).toBe(36);
    for (let i = 1; i < d.xs.length; i++) expect(d.xs[i]!).toBeGreaterThan(d.xs[i - 1]!);
    // by day what goes up is warmer than what comes down, and the sign of the push agrees
    let area = 0;
    for (let i = 0; i < d.xs.length; i++) {
      if (Number.isFinite(d.up[i]!) && Number.isFinite(d.down[i]!)) area += d.up[i]! - d.down[i]!;
    }
    expect(area).toBeGreaterThan(0);
    expect(s.state.headPa).toBeGreaterThan(0);
  });
  it('a direct circuit closes through the tank', () => {
    const s = new SolarSim();
    s.set({ circuit: 'direct' });
    const d = loopChartData(s.state);
    expect(d.down.filter(Number.isFinite).length).toBeGreaterThan(20);
    expect(s.state.loopMap.jacket[1]).toBe(0);
  });
  it('the tank runs from bottom to top', () => {
    const s = new SolarSim();
    const d = layersChartData(s.state);
    expect(d.xs).toHaveLength(10);
    expect(d.xs[9]).toBeGreaterThan(d.xs[0]!);
    expect(d.T[9]).toBeGreaterThanOrEqual(d.T[0]!);
  });
  it('the scope counts back from now', () => {
    const scope = {
      t: [0, 24, 48],
      flow: [1, 2, 3],
      collectorOut: [1, 2, 3],
      top: [1, 2, 3],
      bottom: [1, 2, 3],
      air: [1, 2, 3],
      plate: [1, 2, 3],
      sun: [1, 2, 3],
      gain: [1, 2, 3],
    };
    expect(scopeData(scope).xs).toEqual([-2, -1, 0]);
  });
  it('the sweep is in percent and kilowatt-hours, by height', () => {
    const s = new SolarSim();
    const rows = [s.getSweepRow(SWEEP_HEIGHTS.indexOf(0)), s.getSweepRow(SWEEP_HEIGHTS.indexOf(0.3))];
    const d = sweepChartData(rows);
    expect(d.xs).toEqual([0, 0.3]);
    expect(d.lost[0]).toBeCloseTo(100 * rows[0]!.lostShare, 8);
    expect(d.gain[1]).toBeGreaterThan(1);
  });
  it('an axis top has three round intervals', () => {
    expect(niceCeil3(100) % 3).toBe(0);
    expect(niceCeil3(0)).toBe(3);
  });
  it('a year’s line shows the published value only on the machine it belongs to', () => {
    const y = {
      site: 'davos' as const,
      demand: 200,
      book: {} as never,
      QdMJ: 12050,
      QLMJ: 7000,
      fraction: 0.58,
      planeKWh: 1630,
      maxTop: 60,
      coldest: -15,
      frostHours: 12,
      backwardHours: 100,
      monthly: [],
      imbalance: 0,
    };
    expect(yearLine(y, true).published).toBe(KEYMARK.davos[200]);
    expect(yearLine(y, false).published).toBeNull();
    expect(yearLine({ ...y, demand: 180 }, true).published).toBeNull();
  });
});

describe('the strip', () => {
  it('shows the values, the clock and the alarms', () => {
    setLang('en');
    const sim = new SolarSim();
    const v = stripValues(sim);
    expect(v.map((x) => x.unit)).toContain('°C');
    expect(v.map((x) => x.unit)).toContain('L/h');
    expect(stripClock(sim).time).toMatch(/^\d\d:\d\d$/);
    expect(stripClock(sim).sub).toMatch(/\d+ [A-Z][a-z]+/);
    expect(stripAlarms(sim)).toEqual([]);
    expect(STRIP_SPEEDS).toContain(1);
  });
  it('marks a flow that runs backward', () => {
    setLang('en');
    const sim = new SolarSim();
    sim.applyScenario('bad-tank');
    sim.set({ hour: 23 });
    for (let i = 0; i < 30; i++) sim.step(0.1);
    const flow = stripValues(sim).find((x) => x.unit === 'L/h')!;
    expect(flow.value).toContain('↓');
    expect(flow.value).toContain('-');
  });
  it('knows its months', () => {
    expect(monthOf(0)).toBe(0);
    expect(monthOf(31)).toBe(1);
    expect(monthOf(364)).toBe(11);
  });
});
