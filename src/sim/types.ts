import type { SiteId, SkyMode } from './climate';
import type { Absorber, BoostMode, Circuit, MachineId } from './machine';

// The shared types of the simulation. The engine writes `SolarState` every frame; the 3D worlds, the strip and the panel only read it. SI inside (m, W, J, m³/s), temperatures in °C;
// the flow is also given in L/h, the unit every source of this lab speaks.

export type PresetId = 'family-300' | 'lbl-1981' | 'cyprus-1' | 'cyprus-2' | 'cyprus-3' | 'isfh-200' | 'ingolstadt-180';

export type ScenarioId =
  | 'first-light'
  | 'june-day'
  | 'passing-cloud'
  | 'good-night'
  | 'bad-tank'
  | 'one-way-valve'
  | 'frost'
  | 'holiday-week'
  | 'family-morning'
  | 'mixed-tank'
  | 'narrow-tubes'
  | 'boost-always-on';

export type AlarmKey =
  | 'tapHot'
  | 'legionellaZone'
  | 'frostNear'
  | 'frostIce'
  | 'tankOver95'
  | 'reliefOpen'
  | 'overheatShut'
  | 'circuitVented'
  | 'reverseFlow';

/** Everything the visitor can edit live (all through `SolarSim.set`). Ranges are in presets.ts. All keys are flat: a film sets them directly. */
export interface SolarParams {
  // ---- the kit's time controls
  slowMo: number;
  /** Simulated seconds per real second. */
  timeScale: number;
  running: boolean;
  /** Where the values come from; 'custom' as soon as the visitor edits something physical. */
  preset: PresetId | 'custom';

  // ---- the machine
  machine: MachineId;
  /** Bottom of the tank above the top of the collector, m: the one slider that moves the 3D. */
  tankHeight: number;
  tilt: number;
  azimuth: number;
  circuit: Circuit;
  /** Glycol in a closed circuit, %. */
  glycol: number;
  absorber: Absorber;
  checkValve: boolean;
  overheatValve: boolean;
  pipeInsulation: boolean;
  /** W/K. */
  tankLoss: number;
  // the estimates, which the panel lets the visitor move
  riserBore: number;
  pipeBore: number;
  /** W/K. */
  jacketUA: number;
  /** Share of the jacket's heat that reaches its own level in the tank, 0 to 1. */
  stratify: number;
  /** Share of the volume the cold inlet mixes, 0 to 1. */
  drawMix: number;
  /** Stratification removed by hand: the whole tank at one temperature. */
  mixedTank: boolean;

  // ---- the place and the clock
  site: SiteId;
  /** Day of the year, 1 to 365; hour of the day, 0 to 24. They follow the clock; setting one moves it. */
  day: number;
  hour: number;
  sky: SkyMode;
  /** A cloud passing in front of the sun, 0 to 1. */
  cloud: number;
  /** Added to the air, K. */
  airOffset: number;
  /** m/s. */
  wind: number;

  // ---- the house
  /** Litres a day at 45 °C. */
  demand: number;
  boost: BoostMode;
  /** W. */
  boostPower: number;
  /** °C. */
  setPoint: number;
  tempering: boolean;
  /** Tempering valve, °C. */
  temperSet: number;
}

/** The state handed to the 3D scene, the strip and the panel every frame (read only). */
export interface SolarState {
  // ---- clock
  simTime: number;
  /** Day of the year (0 = 1 January) and hour of the day. */
  dayOfYear: number;
  hour: number;

  // ---- the sky
  /** On the plane, W/m². */
  sunG: number;
  /** Degrees above the horizon, and from the equator towards the west. */
  sunAlt: number;
  sunAz: number;
  airT: number;
  /** What the plate would fall to with nothing moving, °C: the air by day. */
  plateFloorT: number;

  // ---- the loop
  /** Signed, L/h: backward is negative. */
  flowLph: number;
  /** +1 forward, 0 still, −1 backward (past the threshold of a notice). */
  flowDir: number;
  /** True speed in the pipes, m/s, signed: the dots run at this, on `view.slowMo`. */
  pipeSpeed: number;
  /** The push round the loop, Pa; the same in millimetres of water. */
  headPa: number;
  headMm: number;
  /** Per node, in the order of the circuit: cold pipe from the tank, lower header, risers, upper header, hot pipe, jacket (closed circuit only). Updated in place. */
  loopT: Float64Array;
  /** Height of each node's centre above the lower header, m, and what it rises in the direction of the day's flow. */
  loopZ: Float64Array;
  loopDz: Float64Array;
  /** Where each stretch starts in `loopT`, and how long it is. */
  loopMap: {
    cold: [number, number];
    lowerHeader: number;
    risers: [number, number];
    upperHeader: number;
    hot: [number, number];
    jacket: [number, number];
  };
  /** The collector's two ends, °C: inlet and outlet in the direction of the day's flow. */
  collectorIn: number;
  collectorOut: number;
  /** Mean of the risers, °C; the plate minus the air, K. */
  plateT: number;
  plateMinusAir: number;
  /** The coldest node of the circuit, °C, the fluid's freezing point, and the margin between them, K. */
  coldestT: number;
  freezeT: number;
  frostMargin: number;
  circuit: 'closed' | 'direct';
  /** The hot return of a direct circuit above the tank's bottom, m. */
  returnHeight: number;

  // ---- the tank
  /** Ten values from the bottom, °C. Updated in place. */
  layers: Float64Array;
  /** Height of a layer, m. */
  layerHeight: number;
  tankTop: number;
  tankBottom: number;
  tankMean: number;
  /** Bottom of the tank above the top of the collector, m; and above the lower header. */
  tankHeight: number;
  tankBase: number;
  /** The 3D draws this machine (the other presets run in the charts only). */
  onDrawnMachine: boolean;
  boostOn: boolean;
  /** The cold relief's drip from expansion, L/h, and the litres out so far. */
  reliefDrip: number;
  reliefLitres: number;
  reliefOpen: boolean;
  overheatShut: boolean;
  vented: boolean;

  // ---- the tap
  /** L/min and °C at the tap, 0 when nothing runs. */
  tapFlow: number;
  tapT: number;

  // ---- powers, W
  gain: number;
  collectorLoss: number;
  pipeLoss: number;
  toTank: number;
  tankLoss: number;
  boost: number;

  // ---- today, from midnight, J
  todaySun: number;
  todayGain: number;
  todayToTank: number;
  todayDelivered: number;
  todayDemand: number;
  todayBoost: number;
  /** Share of today's demand the sun covered, 0 to 1. */
  todayFraction: number;

  // ---- moments, for a film: numbers that rise
  /** Mornings the flow has started. */
  flowStarted: number;
  /** Times the flow has gone backward. */
  reversalCount: number;
  showerCount: number;

  alarms: AlarmKey[];
}

/** The last days of the live quantities, one sample per 15 simulated minutes. */
export interface Scope {
  t: number[];
  flow: number[];
  collectorOut: number[];
  top: number[];
  bottom: number[];
  air: number[];
  plate: number[];
  sun: number[];
  gain: number[];
}
