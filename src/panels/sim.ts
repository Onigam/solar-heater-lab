import {
  fill,
  h,
  icon,
  ICONS,
  LineChart,
  SERIES_COLORS,
  section as kitSection,
  select as kitSelect,
  slider as kitSlider,
  toggle as kitToggle,
  type AppContext,
  type PanelController,
} from '@onigam/lab-kit/ui';
import { SITE_IDS, type SiteId, type SkyMode } from '../sim/climate';
import { SWEEP_HEIGHTS, type SolarSim, type SweepRow } from '../sim/engine';
import type { Absorber, BoostMode, Circuit } from '../sim/machine';
import { PRESET_IDS, RANGES, SCENARIO_IDS, type RangedKey } from '../sim/presets';
import type { YearResult, YearRunner } from '../sim/runs';
import type { PresetId, ScenarioId, SolarParams } from '../sim/types';
import {
  layersChartData,
  loopChartData,
  mainReadouts,
  moreReadouts,
  niceCeil3,
  scopeData,
  statusOf,
  sweepChartData,
  yearLine,
  type Readout,
} from './model';
import { num, st, sx, type PanelKey } from './strings';

// Simulation mode: starting points and scenarios, a few live figures, the height of the tank and what the night does with it, then the loop, the layers, the days, the year, and the rest folded.
// Built only from the kit's widgets and charts.

type ChartOpts = ConstructorParameters<typeof LineChart>[0];

/** Real seconds the machine must stay unchanged before the runs behind the charts start again. */
const QUIET = 0.35;
/** Days of a year's run in one frame: a few tens of milliseconds. */
const YEAR_CHUNK = 10;
/** The air's dashed line, a reference. The kit's `pv` is 2.5:1 on the light card; this grey is 3.7:1 there and 3.9:1 on the dark one, and a canvas cannot read a token. */
const AIR_LINE = '#78838d';

interface Control {
  key: keyof SolarParams;
  el: HTMLElement;
  kind: 'slider' | 'toggle' | 'select';
  fmt?: (v: number) => string;
}

export class SimPanel implements PanelController {
  readonly el = h('div', { class: 'sim' });
  private presetSelect: HTMLSelectElement | null = null;
  private lesson = h('div', {});
  private status = h('div', {});
  private readouts = h('div', { class: 'readouts' });
  private more = h('div', { class: 'loss-legend' });
  private yearBox = h('div', { class: 'loss-legend' });
  private computing = h('p', { class: 'hint' });
  private controls: Control[] = [];

  private loopChart: LineChart;
  private layersChart: LineChart;
  private sweepChart: LineChart;
  private gainChart: LineChart;
  private plateChart: LineChart;
  private flowChart: LineChart;
  private tempChart: LineChart;
  private loopOpts: ChartOpts;
  private layersOpts: ChartOpts;
  private sweepOpts: ChartOpts;
  private gainOpts: ChartOpts;
  private plateOpts: ChartOpts;
  private flowOpts: ChartOpts;
  private tempOpts: ChartOpts;

  private lastReadouts = 0;
  private lastLive = 0;
  private key = '';
  private wait = 0;
  /** The long runs still to do, one a frame, so that none of them holds a frame back by more than a few tens of ms. */
  private jobs: (() => void)[] = [];
  private sweepData: SweepRow[] = [];
  private years: YearResult[] = [];
  private scenario: ScenarioId | null = null;

  constructor(private ctx: AppContext<SolarSim>) {
    const deg = (v: number) => num(v);
    const metres = (v: number) => `${num(v, 2)} m`;
    const days = (v: number) => (v === 0 ? '0' : `${num(v, Math.abs(v) < 2 ? 1 : 0)} ${st('unitDays')}`);
    const here = () => {
      const p = this.ctx.sim.params;
      return [{ x: p.tankHeight, label: st('markNow') }];
    };
    this.loopOpts = {
      height: 140,
      series: [
        { key: 'up', label: () => st('seriesUp'), color: SERIES_COLORS.dump, bold: true },
        { key: 'down', label: () => st('seriesDown'), color: SERIES_COLORS.hydro, bold: true },
      ],
      yFmt: deg,
      xFmt: metres,
    };
    this.loopChart = new LineChart(this.loopOpts);
    this.layersOpts = {
      height: 110,
      series: [{ key: 'T', label: () => st('seriesLayers'), color: SERIES_COLORS.dump, bold: true }],
      yFmt: deg,
      xFmt: (v) => `${num(v)} cm`,
      legend: false,
    };
    this.layersChart = new LineChart(this.layersOpts);
    this.sweepOpts = {
      height: 130,
      series: [
        { key: 'lost', label: () => st('seriesLost'), color: SERIES_COLORS.dump, bold: true },
        { key: 'valve', label: () => st('seriesValve'), color: SERIES_COLORS.hydro, dash: true },
      ],
      yMin: 0,
      yFmt: deg,
      xFmt: metres,
      markers: here,
    };
    this.sweepChart = new LineChart(this.sweepOpts);
    this.gainOpts = {
      height: 110,
      series: [
        { key: 'gain', label: () => st('seriesGain'), color: SERIES_COLORS.load, bold: true },
        { key: 'valve', label: () => st('seriesValve'), color: SERIES_COLORS.hydro, dash: true },
      ],
      yMin: 0,
      yFmt: (v) => num(v, 1),
      xFmt: metres,
      markers: here,
    };
    this.gainChart = new LineChart(this.gainOpts);
    this.plateOpts = {
      height: 110,
      series: [
        { key: 'plate', label: () => st('seriesGain'), color: SERIES_COLORS.dump, bold: true },
        { key: 'valve', label: () => st('seriesValve'), color: SERIES_COLORS.hydro, dash: true },
      ],
      yFmt: (v) => num(v, 1),
      xFmt: metres,
      markers: here,
    };
    this.plateChart = new LineChart(this.plateOpts);
    this.flowOpts = {
      height: 110,
      series: [{ key: 'flow', label: () => st('seriesFlow'), color: SERIES_COLORS.hydro, bold: true }],
      yFmt: deg,
      xFmt: days,
      legend: false,
    };
    this.flowChart = new LineChart(this.flowOpts);
    this.tempOpts = {
      height: 130,
      series: [
        { key: 'out', label: () => st('seriesOut'), color: SERIES_COLORS.load },
        { key: 'top', label: () => st('seriesTop'), color: SERIES_COLORS.dump, bold: true },
        { key: 'bottom', label: () => st('seriesBottom'), color: SERIES_COLORS.hydro, bold: true },
        { key: 'air', label: () => st('seriesAir'), color: AIR_LINE, dash: true },
      ],
      yFmt: deg,
      xFmt: days,
    };
    this.tempChart = new LineChart(this.tempOpts);
  }

  /** Apply a change live; the panel is not rebuilt, so the dragged input survives. */
  private set(patch: Partial<SolarParams>): void {
    this.ctx.sim.set(patch);
    this.scenario = null;
    this.renderLesson();
    this.renderStatus();
    this.renderReadouts();
  }

  render(): void {
    const sim = this.ctx.sim;
    const p = sim.params;
    this.controls = [];

    const presetSelect = h(
      'select',
      {
        'aria-label': st('preset'),
        onchange: (ev: Event) => {
          sim.applyPreset((ev.target as HTMLSelectElement).value as PresetId);
          this.scenario = null;
          this.render();
        },
      },
      ...PRESET_IDS.map((id) => h('option', { value: id, selected: p.preset === id }, sx('preset', id))),
      h('option', { value: 'custom', selected: p.preset === 'custom', disabled: true }, st('custom')),
    );
    this.presetSelect = presetSelect;

    const track = (key: keyof SolarParams, el: HTMLElement, kind: Control['kind'], fmt?: (v: number) => string) => {
      this.controls.push({ key, el, kind, fmt });
      return el;
    };
    const slider = (key: PanelKey, field: RangedKey, fmt: (v: number) => string) => {
      const r = RANGES[field];
      return track(
        field,
        kitSlider(st(key), p[field] as number, r.min, r.max, r.step, fmt, (v) =>
          this.set({ [field]: v } as Partial<SolarParams>),
        ),
        'slider',
        fmt,
      );
    };
    const toggle = (
      key: PanelKey,
      field: 'checkValve' | 'pipeInsulation' | 'overheatValve' | 'tempering' | 'mixedTank',
    ) =>
      track(
        field,
        kitToggle(st(key), p[field], (v) => this.set({ [field]: v } as Partial<SolarParams>)),
        'toggle',
      );
    const pick = <T extends string>(key: PanelKey, field: keyof SolarParams, options: [T, string][]) =>
      track(
        field,
        kitSelect<T>(st(key), p[field] as unknown as T, options, (v) =>
          this.set({ [field]: v } as Partial<SolarParams>),
        ),
        'select',
      );
    const hint = (key: PanelKey) => h('p', { class: 'hint' }, st(key));
    const folded = (title: string, ...children: (HTMLElement | null)[]) => {
      const d = kitSection(title, ...children) as HTMLDetailsElement;
      d.open = false;
      return d;
    };
    const deg = (v: number) => `${num(v)} °C`;
    const metres = (v: number) => `${v > 0 ? '+' : ''}${num(v, 2)} m`;
    const hourText = (v: number) => {
      const hh = Math.floor(v);
      return `${String(hh).padStart(2, '0')}:${String(Math.floor((v - hh) * 60)).padStart(2, '0')}`;
    };
    const kw = (v: number) => `${num(v / 1000, 1)} kW`;

    fill(
      this.el,
      h('div', { class: 'eyebrow eyebrow--accent' }, st('simTitle2')),
      hint('simIntro'),
      hint('tagLegend'),
      h(
        'div',
        { class: 'sim-top' },
        presetSelect,
        h(
          'button',
          {
            class: 'btn',
            'aria-label': st('resetSim'),
            title: st('resetSim'),
            onclick: () => (sim.reset(), this.render()),
          },
          icon(ICONS.reset, 16),
        ),
      ),
      hint('drawnHint'),
      h('div', { class: 'eyebrow' }, st('scenarios')),
      h(
        'div',
        { class: 'part-chips' },
        ...SCENARIO_IDS.map((id) =>
          h(
            'button',
            {
              class: 'part-chip',
              onclick: () => {
                sim.applyScenario(id);
                this.scenario = id;
                this.render();
              },
            },
            sx('scenario', id),
          ),
        ),
      ),
      this.lesson,
      this.status,
      this.readouts,
      slider('tankHeight', 'tankHeight', metres),
      hint('tankHeightHint'),
      toggle('checkValve', 'checkValve'),
      pick<Circuit>('circuit', 'circuit', [
        ['closed', sx('circuit', 'closed')],
        ['direct', sx('circuit', 'direct')],
      ]),
      hint('circuitHint'),
      pick<SiteId>(
        'site',
        'site',
        SITE_IDS.map((id) => [id, sx('site', id)] as [SiteId, string]),
      ),
      pick<SkyMode>('sky', 'sky', [
        ['mean', sx('sky', 'mean')],
        ['clear', sx('sky', 'clear')],
        ['series', sx('sky', 'series')],
      ]),
      slider('hour', 'hour', hourText),
      slider('day', 'day', (v) => num(v)),
      h(
        'div',
        { class: 'part-chips' },
        h('button', { class: 'part-chip', onclick: () => sim.drawShower() }, st('shower')),
      ),
      h('div', { class: 'eyebrow' }, `${st('chartLoop')} (°C)`),
      this.loopChart.el,
      hint('chartLoopHint'),
      h('div', { class: 'eyebrow' }, `${st('chartSweep')} (%)`),
      this.sweepChart.el,
      hint('chartSweepHint'),
      h('div', { class: 'eyebrow' }, `${st('chartGain')} (kWh)`),
      this.gainChart.el,
      hint('chartGainHint'),
      h('div', { class: 'eyebrow' }, `${st('chartPlate')} (K)`),
      this.plateChart.el,
      hint('chartPlateHint'),
      h('div', { class: 'eyebrow' }, `${st('chartLayers')} (°C)`),
      this.layersChart.el,
      h('div', { class: 'eyebrow' }, `${st('chartFlow')} (L/h)`),
      this.flowChart.el,
      h('div', { class: 'eyebrow' }, `${st('chartTemps')} (°C)`),
      this.tempChart.el,
      h('div', { class: 'eyebrow' }, st('chartYear')),
      this.yearBox,
      hint('yearHint'),
      this.computing,
      folded(
        st('secMachine'),
        slider('tilt', 'tilt', (v) => `${num(v)}°`),
        slider('azimuth', 'azimuth', (v) => `${num(v)}°`),
        pick<Absorber>('absorber', 'absorber', [
          ['black', sx('absorber', 'black')],
          ['selective', sx('absorber', 'selective')],
        ]),
        slider('glycol', 'glycol', (v) => `${num(v)} %`),
        toggle('pipeInsulation', 'pipeInsulation'),
        toggle('overheatValve', 'overheatValve'),
        slider('tankLoss', 'tankLoss', (v) => `${num(v, 2)} W/K`),
        hint('machineHint'),
      ),
      folded(
        st('secHouse'),
        slider('demand', 'demand', (v) => `${num(v)} L`),
        toggle('tempering', 'tempering'),
        slider('temperSet', 'temperSet', deg),
        pick<BoostMode>('boost', 'boost', [
          ['off', sx('boost', 'off')],
          ['timer', sx('boost', 'timer')],
          ['always', sx('boost', 'always')],
        ]),
        kitSelect<number>(
          st('boostPower'),
          p.boostPower,
          [
            [1800, kw(1800)],
            [2400, kw(2400)],
            [3600, kw(3600)],
          ],
          (v) => this.set({ boostPower: Number(v) }),
        ),
        slider('setPoint', 'setPoint', deg),
        hint('houseHint'),
      ),
      folded(
        st('secWeather'),
        slider('cloud', 'cloud', (v) => `${num(100 * v)} %`),
        slider('airOffset', 'airOffset', (v) => `${v > 0 ? '+' : ''}${num(v)} K`),
        slider('wind', 'wind', (v) => `${num(v, 1)} m/s`),
      ),
      folded(
        st('secEstimates'),
        slider('riserBore', 'riserBore', (v) => `${num(v * 1000, 1)} mm *`),
        slider('pipeBore', 'pipeBore', (v) => `${num(v * 1000)} mm *`),
        slider('jacketUA', 'jacketUA', (v) => `${num(v)} W/K *`),
        slider('stratify', 'stratify', (v) => `${num(100 * v)} % *`),
        slider('drawMix', 'drawMix', (v) => `${num(100 * v, 1)} %`),
        toggle('mixedTank', 'mixedTank'),
        hint('estimatesHint'),
      ),
      folded(st('moreTitle'), this.more),
    );
    this.key = this.runKey();
    this.wait = 0;
    this.sweepData = [];
    this.years = [];
    this.jobs = this.makeJobs();
    this.renderLesson();
    this.refresh();
  }

  /** Called every frame while the panel is open: figures at 5 Hz, the live charts at 2 Hz, one long run at a time. */
  tick(dt: number): void {
    this.lastReadouts += dt;
    this.lastLive += dt;
    this.schedule(dt);
    if (this.lastReadouts > 0.2) {
      this.lastReadouts = 0;
      this.renderStatus();
      this.renderReadouts();
      this.followScript();
    }
    if (this.lastLive > 0.5) {
      this.lastLive = 0;
      this.drawLive();
    }
  }

  private refresh(): void {
    this.renderStatus();
    this.renderReadouts();
    this.drawLive();
    this.drawStatic();
  }

  // ------------------------------------------------------------------ the long runs

  /** Everything the runs depend on. */
  private runKey(): string {
    const sim = this.ctx.sim;
    const p = sim.params;
    return JSON.stringify([sim.yearKey(), p.site, Math.floor(p.day / 30.4)]);
  }

  private schedule(dt: number): void {
    const key = this.runKey();
    if (key !== this.key) {
      this.key = key;
      this.wait = QUIET;
      this.jobs = [];
    } else if (this.wait > 0) {
      this.wait -= dt;
      if (this.wait <= 0) {
        this.sweepData = [];
        this.years = [];
        this.jobs = this.makeJobs();
      }
    }
    const job = this.jobs.shift();
    if (!job) return;
    job();
    this.drawStatic();
  }

  private makeJobs(): (() => void)[] {
    const sim = this.ctx.sim;
    const jobs: (() => void)[] = [];
    const rows: SweepRow[] = [];
    SWEEP_HEIGHTS.forEach((_, i) => {
      jobs.push(() => sim.prepareSweep(i, false));
      jobs.push(() => {
        sim.prepareSweep(i, true);
        rows.push(sim.getSweepRow(i));
        if (rows.length === SWEEP_HEIGHTS.length) this.sweepData = rows;
      });
    });
    for (const site of SITE_IDS) {
      let runner: YearRunner | null = null;
      for (let d = 0; d < Math.ceil(365 / YEAR_CHUNK); d++) {
        jobs.push(() => {
          runner ??= sim.yearRunner(site);
          runner.advance(YEAR_CHUNK);
          if (runner.done) this.years = [...this.years, runner.result()];
        });
      }
    }
    return jobs;
  }

  // ------------------------------------------------------------------ figures

  private renderLesson(): void {
    if (this.scenario)
      fill(this.lesson, h('div', { class: 'callout callout--tip' }, h('span', {}, sx('lesson', this.scenario))));
    else fill(this.lesson, h('p', { class: 'hint' }, st('scenarioHint')));
  }

  private renderStatus(): void {
    const sim = this.ctx.sim;
    if (this.presetSelect && this.presetSelect.value !== sim.params.preset) this.presetSelect.value = sim.params.preset;
    const { key, tone } = statusOf(sim.state, sim.params);
    fill(
      this.status,
      tone === 'warn'
        ? h('div', { class: 'callout callout--warn' }, icon(ICONS.warn, 16), h('span', {}, st(key)))
        : h('p', { class: 'hint' }, st(key)),
    );
  }

  private renderReadouts(): void {
    const sim = this.ctx.sim;
    const box = (r: Readout) =>
      h(
        'div',
        { class: 'readout' },
        h('span', {}, st(r.key)),
        h('b', {}, num(r.value, r.digits), h('small', {}, ` ${r.unit}${r.tag ? ` ${r.tag}` : ''}`)),
      );
    const line = (r: Readout) =>
      h(
        'span',
        {},
        `${st(r.key)} `,
        h('b', {}, num(r.value, r.digits)),
        h('small', {}, ` ${r.unit}${r.tag ? ` ${r.tag}` : ''}`),
      );
    fill(this.readouts, ...mainReadouts(sim.state).map(box));
    fill(this.more, ...moreReadouts(sim.state).map(line));
  }

  private renderYears(): void {
    const on = this.ctx.sim.onPublishedMachine;
    fill(
      this.yearBox,
      ...this.years.map((y) => {
        const l = yearLine(y, on);
        const published = l.published !== null ? `(${num(l.published)}) ` : '';
        const frost = l.frostHours > 0 ? ` · ${num(l.frostHours)} ${st('yearFrost')} †` : '';
        return h(
          'span',
          {},
          h('b', {}, sx('site', l.site)),
          h('small', {}, ` ${num(l.QL)} MJ † ${published}· ${num(100 * l.fraction)} % ${st('yearSolar')} †${frost}`),
        );
      }),
    );
  }

  /** A scenario can move a slider or flip a switch by itself: the controls follow. */
  private followScript(): void {
    const p = this.ctx.sim.params;
    for (const c of this.controls) {
      const value = p[c.key];
      if (c.kind === 'select') {
        const sel = c.el.querySelector('select') as HTMLSelectElement | null;
        if (sel && sel.value !== String(value)) sel.value = String(value);
        continue;
      }
      const input = c.el.querySelector('input') as HTMLInputElement | null;
      if (!input) continue;
      if (c.kind === 'toggle') {
        if (input.checked !== value) input.checked = Boolean(value);
      } else if (typeof value === 'number' && Math.abs(Number(input.value) - value) > 1e-9) {
        input.value = String(value);
        const out = c.el.querySelector('output');
        if (out && c.fmt) out.textContent = c.fmt(value);
      }
    }
  }

  // ------------------------------------------------------------------ charts

  private drawLive(): void {
    const sim = this.ctx.sim;
    const s = sim.state;
    const loop = loopChartData(s);
    const finite = (a: number[]) => a.filter(Number.isFinite);
    const lo = Math.min(...finite(loop.up), ...finite(loop.down));
    const hi = Math.max(...finite(loop.up), ...finite(loop.down));
    this.loopOpts.yMin = Math.floor(lo / 5) * 5;
    this.loopOpts.yMax = this.loopOpts.yMin + niceCeil3(Math.max(hi - this.loopOpts.yMin, 3) * 1.05);
    this.loopChart.setData(loop.xs, { up: loop.up, down: loop.down });
    this.loopChart.draw();
    const layers = layersChartData(s);
    this.layersOpts.yMin = Math.floor(Math.min(...layers.T) / 5) * 5;
    this.layersOpts.yMax =
      this.layersOpts.yMin + niceCeil3(Math.max(Math.max(...layers.T) - this.layersOpts.yMin, 3) * 1.05);
    this.layersChart.setData(layers.xs, { T: layers.T });
    this.layersChart.draw();
    const d = scopeData(sim.scope);
    const fTop = Math.max(5, ...d.flow);
    const fLow = Math.min(0, ...d.flow);
    this.flowOpts.yMin = fLow < 0 ? -niceCeil3(-fLow) : 0;
    this.flowOpts.yMax = niceCeil3(fTop * 1.05);
    this.flowChart.setData(d.xs, { flow: d.flow });
    this.flowChart.draw();
    const all = [...d.top, ...d.out, ...d.bottom, ...d.air];
    const tLow = all.length ? Math.floor(Math.min(...all) / 10) * 10 : 0;
    this.tempOpts.yMin = tLow;
    this.tempOpts.yMax = tLow + niceCeil3(Math.max(all.length ? Math.max(...all) - tLow : 30, 3) * 1.05);
    this.tempChart.setData(d.xs, { out: d.out, top: d.top, bottom: d.bottom, air: d.air });
    this.tempChart.draw();
    this.sweepChart.draw();
    this.gainChart.draw();
    this.plateChart.draw();
  }

  private drawStatic(): void {
    if (this.sweepData.length) {
      const w = sweepChartData(this.sweepData);
      this.sweepOpts.yMax = niceCeil3(Math.max(3, ...w.lost, ...w.valve) * 1.05);
      this.sweepChart.setData(w.xs, { lost: w.lost, valve: w.valve });
      this.sweepChart.draw();
      this.gainOpts.yMax = niceCeil3(Math.max(1, ...w.gain, ...w.valveGain) * 1.05);
      this.gainChart.setData(w.xs, { gain: w.gain, valve: w.valveGain });
      this.gainChart.draw();
      const lo = Math.min(...w.plate, ...w.valvePlate);
      const hi = Math.max(...w.plate, ...w.valvePlate);
      this.plateOpts.yMin = Math.floor(lo);
      this.plateOpts.yMax = Math.floor(lo) + niceCeil3(Math.max(hi - Math.floor(lo), 3) * 1.05);
      this.plateChart.setData(w.xs, { plate: w.plate, valve: w.valvePlate });
      this.plateChart.draw();
    }
    this.renderYears();
    this.computing.textContent = this.wait > 0 || this.jobs.length > 0 ? st('computing') : '';
  }
}
