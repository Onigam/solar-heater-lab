import type { SiteId } from './climate';
import {
  CURVE_SELECTIVE,
  EMISSIVITY,
  MACHINES,
  ROOF_MACHINE,
  ROOF_UNIT,
  type MachineId,
  type MachineSpec,
} from './machine';
import type { PresetId, ScenarioId, SolarParams } from './types';

// The starting points and the small scripted situations. The other machines live in the simulation only: the 3D draws one machine.

export const PRESET_IDS: PresetId[] = [
  'family-300',
  'lbl-1981',
  'cyprus-1',
  'cyprus-2',
  'cyprus-3',
  'isfh-200',
  'ingolstadt-180',
];

export const SCENARIO_IDS: ScenarioId[] = [
  'first-light',
  'june-day',
  'passing-cloud',
  'good-night',
  'bad-tank',
  'one-way-valve',
  'frost',
  'holiday-week',
  'family-morning',
  'mixed-tank',
  'narrow-tubes',
  'boost-always-on',
];

const PRESET_MACHINE: Record<PresetId, MachineId> = {
  'family-300': 'roof-unit',
  'lbl-1981': 'lbl-1981',
  'cyprus-1': 'cyprus-1',
  'cyprus-2': 'cyprus-2',
  'cyprus-3': 'cyprus-3',
  'isfh-200': 'isfh-200',
  'ingolstadt-180': 'ingolstadt-180',
};

/** The clock opens at an hour simulated per real second: a day in 24 s. */
export const DEFAULT_TIME_SCALE = 3600;
/** The speeds of the strip: real time for the dots, then up to a day per second. Five: more do not fit at 768 px. */
export const SPEEDS = [1, 60, 600, 3600, 86400];

/** The ranges of the sliders. */
export const RANGES = {
  tankHeight: { min: ROOF_UNIT.tankHeightMin, max: ROOF_UNIT.tankHeightMax, step: 0.01 },
  tilt: { min: ROOF_UNIT.tiltMin, max: ROOF_UNIT.tiltMax, step: 1 },
  azimuth: { min: -90, max: 90, step: 5 },
  glycol: { min: 20, max: 60, step: 1 },
  tankLoss: { min: 1, max: 5, step: 0.05 },
  riserBore: { min: 0.002, max: 0.012, step: 0.0005 },
  pipeBore: { min: 0.008, max: 0.03, step: 0.001 },
  jacketUA: { min: 100, max: 600, step: 10 },
  stratify: { min: 0, max: 1, step: 0.05 },
  drawMix: { min: 0, max: 0.5, step: 0.005 },
  day: { min: 1, max: 365, step: 1 },
  hour: { min: 0, max: 24, step: 0.25 },
  cloud: { min: 0, max: 1, step: 0.05 },
  airOffset: { min: -25, max: 15, step: 1 },
  wind: { min: 0, max: 10, step: 0.5 },
  demand: { min: 0, max: 400, step: 10 },
  setPoint: { min: 50, max: 70, step: 1 },
  temperSet: { min: 40, max: 50, step: 1 },
} as const;

export type RangedKey = keyof typeof RANGES;

export function presetParams(id: PresetId): SolarParams {
  const machine = PRESET_MACHINE[id];
  const m: MachineSpec = MACHINES[machine];
  return {
    slowMo: 1,
    timeScale: DEFAULT_TIME_SCALE,
    running: true,
    preset: id,
    machine,
    tankHeight: m.tankHeight,
    tilt: m.tilt,
    azimuth: m.azimuth,
    circuit: m.circuit,
    glycol: m.circuit === 'direct' ? ROOF_MACHINE.glycol : m.glycol,
    absorber: 'black',
    checkValve: false,
    overheatValve: m.overheatValve,
    pipeInsulation: m.pipeInsulated,
    tankLoss: m.tankLoss,
    riserBore: m.riserBore,
    pipeBore: m.pipeBore,
    jacketUA: m.exchangerUA,
    stratify: m.stratify,
    drawMix: m.drawMix,
    mixedTank: false,
    site: 'athens',
    day: 172,
    hour: 7,
    sky: 'mean',
    cloud: 0,
    airOffset: 0,
    wind: 2,
    demand: 200,
    boost: 'off',
    boostPower: m.boostPower,
    setPoint: m.setPoint,
    tempering: true,
    temperSet: 50,
  };
}

/** The machine a set of parameters describes. The base machine, with what the panel can move. */
export function specOf(p: SolarParams): MachineSpec {
  const base = MACHINES[p.machine];
  const selective = p.absorber === 'selective';
  const direct = p.circuit === 'direct';
  return {
    ...base,
    curve: selective ? CURVE_SELECTIVE : base.curve,
    local: selective ? undefined : base.local,
    plateEmissivity: selective ? EMISSIVITY.selective : base.plateEmissivity,
    tankHeight: p.tankHeight,
    tilt: p.tilt,
    azimuth: p.azimuth,
    circuit: p.circuit,
    glycol: direct ? 0 : p.glycol,
    checkValve: p.checkValve,
    overheatValve: p.overheatValve && !direct,
    pipeInsulated: p.pipeInsulation,
    tankLoss: p.tankLoss,
    riserBore: p.riserBore,
    pipeBore: p.pipeBore,
    exchangerUA: p.jacketUA,
    stratify: p.stratify,
    drawMix: p.drawMix,
    mixedTank: p.mixedTank,
    boost: p.boost,
    boostPower: p.boostPower,
    setPoint: p.setPoint,
  };
}

/** A change scheduled in a scenario, at a time in real seconds. */
export interface ScheduledEvent {
  at: number;
  patch?: Partial<SolarParams>;
  /** A shower starts. */
  shower?: boolean;
}

export interface ScenarioSetup {
  params: SolarParams;
  /** Days run before the start, so that the tank has its history. */
  spinUp: number;
  /** Start from a tank at this temperature instead of a run. */
  tankT?: number;
  events: ScheduledEvent[];
}

const clearJune = (patch: Partial<SolarParams>): Partial<SolarParams> => ({
  sky: 'clear',
  site: 'athens' as SiteId,
  day: 172,
  ...patch,
});

/** Air shift that brings January's coldest hour at Athens down to −7 °C, K. derived from the site's air (the January mean, 5.5 K of swing). */
export const FROST_AIR_OFFSET = -7 - (9.6 - 5.5);

export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const s = scenarioBase(id);
  return { ...s, params: { ...s.params, preset: 'custom' } };
}

function scenarioBase(id: ScenarioId): ScenarioSetup {
  const base = presetParams('family-300');
  const make = (patch: Partial<SolarParams>, more: Partial<ScenarioSetup> = {}): ScenarioSetup => ({
    params: { ...base, ...patch },
    spinUp: 3,
    events: [],
    ...more,
  });
  switch (id) {
    case 'first-light':
      // dawn to mid-morning, slowly: the moment the flow starts
      return make(clearJune({ hour: 4.5, timeScale: 600 }));
    case 'june-day':
      return make(clearJune({ hour: 5, timeScale: DEFAULT_TIME_SCALE }));
    case 'passing-cloud':
      // minutes per second: the flow follows the cloud, the tank does not notice
      return make(clearJune({ hour: 11.5, timeScale: 60 }), {
        events: [
          { at: 8, patch: { cloud: 0.9 } },
          { at: 28, patch: { cloud: 0 } },
        ],
      });
    case 'good-night':
      return make(clearJune({ hour: 19, timeScale: DEFAULT_TIME_SCALE, tankHeight: 0 }));
    case 'bad-tank':
      // not the lowest place of the slider: lower still, the model's tank hardly charges by day and has little left to lose
      return make(clearJune({ hour: 15, timeScale: DEFAULT_TIME_SCALE, tankHeight: -0.61 }));
    case 'one-way-valve':
      return make(clearJune({ hour: 15, timeScale: DEFAULT_TIME_SCALE, tankHeight: -0.61, checkValve: true }));
    case 'frost':
      // a clear January night: the mix first, then the same night with water in the collector
      return make(
        {
          site: 'athens',
          sky: 'clear',
          day: 15,
          hour: 17,
          airOffset: FROST_AIR_OFFSET,
          timeScale: DEFAULT_TIME_SCALE,
          demand: 200,
        },
        { events: [{ at: 16, patch: { circuit: 'direct', hour: 17 } }] },
      );
    case 'holiday-week':
      // no draw in July: the tank climbs, the overheat valve closes the circuit, the cold relief drips
      return make({ site: 'athens', sky: 'clear', day: 190, hour: 6, demand: 0, timeScale: 14400 }, { spinUp: 2 });
    case 'family-morning':
      // four showers, a few minutes per second: the top layer falls, and the valve is taken away for the third
      return make(clearJune({ hour: 6.5, timeScale: 60 }), {
        events: [
          { at: 1, shower: true },
          { at: 11, shower: true },
          { at: 20, patch: { tempering: false } },
          { at: 21, shower: true },
          { at: 31, shower: true },
          { at: 40, patch: { tempering: true } },
        ],
      });
    case 'mixed-tank':
      return make(clearJune({ hour: 5, mixedTank: true, timeScale: DEFAULT_TIME_SCALE }));
    case 'narrow-tubes':
      // tubes of a third the bore: the flow collapses; does the energy?
      return make(clearJune({ hour: 5, riserBore: 0.003, timeScale: DEFAULT_TIME_SCALE }));
    case 'boost-always-on':
      return make({ site: 'davos', sky: 'mean', day: 15, hour: 6, boost: 'always', timeScale: 14400 });
  }
}
