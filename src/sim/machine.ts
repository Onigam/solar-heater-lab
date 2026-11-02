import { localCurve, type CollectorCurve, type LocalCurve } from './thermal';

// The machines of the model, every constant with its tag. `ROOF_UNIT` is the one the 3D draws, and the one source of its numbers: `src/three/dims.ts` imports
// from here, as the other labs' dims do from their simulation. The words:
//   reported  said by a source of docs/research.md (K and S numbers)
//   derived   computed from reported figures, the formula is beside it
//   estimate  the sources are silent: a choice of ours, with its reason
//   assumption a choice of how to run it

export type Circuit = 'closed' | 'direct';
export type Absorber = 'black' | 'selective';
export type BoostMode = 'off' | 'timer' | 'always';

/** The certified curve of the machine's black collector, on its gross area, referred to the inlet. reported, independent (K17). */
export const CURVE_BLACK: CollectorCurve = { eta0: 0.778, a1: 6.541, a2: 0.025 };
/** The same maker's selective collector, for comparison. reported (K25). On 1.986 m² gross: the model carries it on this machine's area, a simplification. */
export const CURVE_SELECTIVE: CollectorCurve = { eta0: 0.671, a1: 3.592, a2: 0.007 };
/** The linear form of the first certificate, for the arithmetic of K39. reported (K17). */
export const LINEAR_BLACK = { eta0: 0.789, a1: 7.939 };

/** The incidence modifier of the same collector, K(10°…70°). reported (K18). */
export const IAM_BLACK: readonly (readonly [number, number])[] = [
  [10, 0.98],
  [20, 0.97],
  [30, 0.96],
  [40, 0.94],
  [50, 0.9],
  [60, 0.83],
  [70, 0.69],
];

/** The certificates' test flow, kg/s per m². reported (K36). */
export const TEST_FLOW = 0.02;
/** The test's capacity rate per m², W/m²·K: that flow of water, an assumption, the certificate does not name the fluid. */
export const TEST_RATE = TEST_FLOW * 4180;

/** Emissivity of the plates. estimate: black paint about 0.9; selective 0.05 to 0.15 (S13, S20). */
export const EMISSIVITY: Record<Absorber, number> = { black: 0.9, selective: 0.1 };

/** The machine on the roof, its dimensions in metres and its masses in kg. */
export const ROOF_UNIT = {
  /** System width with fittings. reported (K2). */
  systemWidth: 2.43,
  /** Foot of the collectors to the back of the tank, along the slope. reported (K2). */
  alongSlope: 2.49,
  /** The same with fittings, side and plan view: the sheet prints both. reported (K2). */
  alongSlopeSide: 2.6,
  alongSlopePlan: 2.63,
  /** Masses, empty and full, with fittings. reported (K3). */
  massEmpty: 196,
  massFull: 515,
  tankEmpty: 107,
  tankFull: 417,
  collectorEmpty: 43,
  collectorFull: 49,
  /** One collector, overall. reported (K4). */
  collectorLength: 1.943,
  collectorWidth: 1.027,
  collectorDepth: 0.083,
  /** Areas of one collector, m². reported (K4, K17). */
  apertureArea: 1.87,
  grossArea: 2.003,
  collectors: 2,
  /** Risers in one collector. reported (K4). Their pitch: derived, width / count. */
  risersPerCollector: 35,
  riserPitch: 1.027 / 35,
  /** Fluid in one collector, m³. reported (K4). */
  collectorFluid: 3.8e-3,
  /** Bore of a riser, m. estimate: the research's 7 mm, between Ingolstadt's 8 × 0.5 and what 29 mm of pitch suggests. */
  riserBore: 7e-3,
  /** Closed circuit, m³. reported (K5). */
  circuitVolume: 19e-3,
  /** The tank. reported: 300 L, boost 150 L, the case (K1, K6). */
  tankVolume: 0.3,
  boostVolume: 0.15,
  tankCaseWidth: 0.51,
  tankCaseLength: 2.31,
  /** The drinking-water vessel: a diameter estimated from the comparators and what a 510 mm case leaves. Its length follows from 300 L. */
  vesselDiameter: 0.44,
  /** Steel wall of the vessel, m. reported (K6). */
  vesselWall: 2.5e-3,
  /** The jacket: gap and the height it wraps. estimate (Ingolstadt: 7.7 L on about 1 m², so 7.5 mm), on the lower half. */
  jacketGap: 7.5e-3,
  /** Hot and cold pipes at the machine's own place. estimate, the shapes are reported (S7 p. 44). */
  hotPipe: 0.35,
  coldPipe: 2.3,
  /** Bore of the pipes, m. estimate (comparators 18 to 22 mm). */
  pipeBore: 20e-3,
  /** Rail below the batten of the tank's foot, along the slope. reported (K8). */
  railToFoot: 2.05,
  /** Pitch of the roof, degrees. Default an assumption, range reported (K7). */
  tilt: 30,
  tiltMin: 10,
  tiltMax: 45,
  /** How far the test stand moves the tank, m. reported range (K28). */
  tankHeightMin: -1.22,
  tankHeightMax: 1.83,
} as const;

/** Length of the vessel for 300 L at its estimated diameter, m. derived. The research rounds it to 2.0. */
export const VESSEL_LENGTH = ROOF_UNIT.tankVolume / ((Math.PI * ROOF_UNIT.vesselDiameter ** 2) / 4);
/** Height the jacket wraps: half the vessel. estimate. */
export const JACKET_HEIGHT = ROOF_UNIT.vesselDiameter / 2;

const area = (d: number): number => (Math.PI * d * d) / 4;
const RISERS_ALL = ROOF_UNIT.collectors * ROOF_UNIT.risersPerCollector;
const riserVolume = (bore: number): number => RISERS_ALL * area(bore) * ROOF_UNIT.collectorLength;

/**
 * Bore of a header, m. derived from K4: 3.8 L a collector, less what 35 risers of 7 mm hold, leaves about 1.25 L for its two headers. That is about 27 mm, like LBL's 26.8
 * and the Cypriot 28, where §3 of the research wrote 18 mm; with 18 mm headers, 3.8 L would need risers of about 8.9 mm. Either way the volume holds.
 */
export const HEADER_BORE = Math.sqrt(
  (ROOF_UNIT.collectors * ROOF_UNIT.collectorFluid - riserVolume(ROOF_UNIT.riserBore)) /
    ((Math.PI / 4) * (2 * ROOF_UNIT.collectors * ROOF_UNIT.collectorWidth)),
);

/** Jacket's volume, m³. derived: 19 L less the collectors and the pipes. K58 finds about 10 L another way. */
export const JACKET_VOLUME =
  ROOF_UNIT.circuitVolume -
  ROOF_UNIT.collectors * ROOF_UNIT.collectorFluid -
  (ROOF_UNIT.hotPipe + ROOF_UNIT.coldPipe) * area(ROOF_UNIT.pipeBore);

/** Everything the model needs to know about one machine. */
export interface MachineSpec {
  id: string;
  /** Number of collectors, their gross area in all (m²), the curve on that area, or the local coefficients directly. */
  collectors: number;
  grossArea: number;
  apertureArea: number;
  curve: CollectorCurve;
  local?: LocalCurve;
  iam: readonly (readonly [number, number])[] | null;
  plateEmissivity: number;
  /** Dry capacity of the collector, J/K per m² gross. estimate: a5 about 6 kJ/m²K (S11, S12), other collectors. */
  dryCapacity: number;
  risers: number;
  riserBore: number;
  riserLength: number;
  headerBore: number;
  /** Width of one collector along its headers, m. */
  collectorWidth: number;
  tilt: number;
  azimuth: number;
  /** Bottom of the tank above the top of the collector, m. */
  tankHeight: number;
  /** Pipes at height 0: their lengths follow the height when `pipesFollow`. */
  hotPipe: number;
  coldPipe: number;
  pipesFollow: boolean;
  pipeBore: number;
  bends: number;
  /** Loss of a pipe, W/K per metre: bare and with its insulation. estimate. */
  pipeLossBare: number;
  pipeLossInsulated: number;
  pipeInsulated: boolean;
  circuit: Circuit;
  /** Percentage of glycol in a closed circuit. */
  glycol: number;
  /** The exchanger of a closed circuit. A jacket rises then sinks over `exchangerHeight` from the tank's bottom; a coil only falls. */
  exchanger: 'jacket' | 'coil';
  exchangerUA: number;
  exchangerVolume: number;
  exchangerHeight: number;
  /** Resistance of the exchanger: a slot, or tubes. */
  slot?: { length: number; width: number; gap: number };
  tubes?: { bore: number; length: number; count: number };
  /** The hot return of a direct circuit, above the tank's bottom, m. */
  returnHeight: number;
  tankVolume: number;
  tankDiameter: number;
  tankVertical: boolean;
  /** Loss of the tank, W/K. */
  tankLoss: number;
  /** Steel that follows the water, J/K. */
  wallCapacity: number;
  wallThickness: number;
  boostVolume: number;
  boost: BoostMode;
  boostPower: number;
  setPoint: number;
  /** Share of the exchanger's heat that reaches its own level in the tank rather than the layer beside it. */
  stratify: number;
  /** Share of the volume the cold inlet mixes. */
  drawMix: number;
  mixedTank: boolean;
  checkValve: boolean;
  overheatValve: boolean;
  overheatSet: number;
  tprValve: boolean;
  /** Sink to the night sky under the glass. */
  skyTerm: boolean;
  /** A multiplier on the number of nodes, for a convergence test. */
  nodeScale: number;
  /** Nodes of each stretch of the circuit, before that multiplier. */
  nodes: { cold: number; risers: number; hot: number; exchanger: number };
}

const tankWallCapacity = (V: number): number => 110 * V * 1000 * 0.3; // estimate: about 33 kJ/K at 300 L, 68 kg of steel at 480 J/kg·K

/** The machine the 3D draws. */
export const ROOF_MACHINE: MachineSpec = {
  id: 'roof-unit',
  collectors: ROOF_UNIT.collectors,
  grossArea: ROOF_UNIT.collectors * ROOF_UNIT.grossArea,
  apertureArea: ROOF_UNIT.collectors * ROOF_UNIT.apertureArea,
  curve: CURVE_BLACK,
  iam: IAM_BLACK,
  plateEmissivity: EMISSIVITY.black,
  dryCapacity: 6000,
  risers: RISERS_ALL,
  riserBore: ROOF_UNIT.riserBore,
  riserLength: ROOF_UNIT.collectorLength,
  headerBore: HEADER_BORE,
  collectorWidth: ROOF_UNIT.collectorWidth,
  tilt: ROOF_UNIT.tilt,
  azimuth: 0,
  tankHeight: 0,
  hotPipe: ROOF_UNIT.hotPipe,
  coldPipe: ROOF_UNIT.coldPipe,
  pipesFollow: true,
  pipeBore: ROOF_UNIT.pipeBore,
  bends: 6,
  // bare: about 15 W/m²K on a 22 mm tube; insulated: 13 mm of foam at 0.04 W/m·K. Usual values.
  pipeLossBare: 1.04,
  pipeLossInsulated: 0.32,
  pipeInsulated: false,
  circuit: 'closed',
  glycol: 23.7, // derived: one 4.5 L bottle in 19 L (K5, K12)
  exchanger: 'jacket',
  exchangerUA: 300,
  exchangerVolume: JACKET_VOLUME,
  exchangerHeight: JACKET_HEIGHT,
  slot: { length: VESSEL_LENGTH, width: (Math.PI * ROOF_UNIT.vesselDiameter) / 2, gap: ROOF_UNIT.jacketGap },
  returnHeight: 0.3, // the Cypriot systems (K31): 290 to 390 mm
  tankVolume: ROOF_UNIT.tankVolume,
  tankDiameter: ROOF_UNIT.vesselDiameter,
  tankVertical: false,
  tankLoss: 2.4,
  wallCapacity: tankWallCapacity(ROOF_UNIT.tankVolume),
  wallThickness: ROOF_UNIT.vesselWall,
  boostVolume: ROOF_UNIT.boostVolume,
  boost: 'off',
  boostPower: 3600,
  setPoint: 60,
  stratify: 0.7, // estimate: no measurement of this tank; K44 and K40 say a double jacket holds some layering, not all
  drawMix: 0.055, // reported on a comparable tank (K40)
  mixedTank: false,
  checkValve: false,
  overheatValve: true,
  overheatSet: 85, // estimate: not published, 80 to 90 °C
  tprValve: true,
  skyTerm: true,
  nodeScale: 1,
  // upwind smears a slow front: under about this many nodes the night's loss comes out too high at a low tank (docs/physics.md)
  nodes: { cold: 12, risers: 32, hot: 8, exchanger: 40 },
};

/** The same machine with one collector and 180 L, for K23 and K63. reported (K5, K23); the 180 L case is scaled from the 300 L. */
export const ONE_COLLECTOR_180: MachineSpec = {
  ...ROOF_MACHINE,
  id: 'one-collector-180',
  collectors: 1,
  grossArea: ROOF_UNIT.grossArea,
  apertureArea: ROOF_UNIT.apertureArea,
  risers: ROOF_UNIT.risersPerCollector,
  exchangerVolume: 13.5e-3 - ROOF_UNIT.collectorFluid - (ROOF_UNIT.hotPipe + 1.3) * area(ROOF_UNIT.pipeBore),
  coldPipe: 1.3,
  exchangerUA: 180, // scaled by volume
  tankVolume: 0.18,
  wallCapacity: tankWallCapacity(0.18),
  slot: {
    length: 0.18 / area(ROOF_UNIT.vesselDiameter),
    width: (Math.PI * ROOF_UNIT.vesselDiameter) / 2,
    gap: ROOF_UNIT.jacketGap,
  },
  tankLoss: 1.93, // derived from the standing loss of the 180 L (§2.9)
  boostVolume: 0.09,
};

/**
 * LBL's machine, the 1981 model's Table 1 (S17, K28). A vertical tank 1.52 m tall: **this is why its « y = 0 » is not ours**, its exchanger reaches 1.5 m above the tank's
 * bottom where our jacket stops at 0.22 m. Its figures are the model's own: comparing is model against model.
 */
export const LBL_1981: MachineSpec = {
  ...ROOF_MACHINE,
  id: 'lbl-1981',
  collectors: 2,
  grossArea: 3.9,
  apertureArea: 3.9,
  curve: { eta0: 0.774, a1: 4.201, a2: 0 },
  local: { F: 0.9 * 0.86, u1: 4.201, u2: 0 }, // F' = 0.9, τα = 0.86, F'U_L = 4.201 (Table 1)
  iam: null,
  plateEmissivity: 0.1,
  dryCapacity: 0, // « negligible collector heat capacity »
  risers: 18,
  riserBore: 9.5e-3,
  riserLength: 1.75,
  headerBore: 26.8e-3,
  collectorWidth: 1.12,
  tilt: 45,
  tankHeight: 0,
  // 4.54 m in all, how it splits is not said: a third hot, an estimate. Their sweep keeps the length.
  hotPipe: 1.5,
  coldPipe: 3.04,
  pipesFollow: false,
  pipeBore: 26e-3,
  bends: 10,
  // U_in = 0.85 W/m²K on the pipe: well insulated
  pipeLossBare: 0.85 * Math.PI * 0.026,
  pipeLossInsulated: 0.85 * Math.PI * 0.026,
  pipeInsulated: true,
  glycol: 60,
  exchanger: 'coil',
  exchangerUA: 170 * 3 * Math.PI * 0.0504 * 1.52, // U_he × 3 tubes of 5.04 cm over 1.52 m
  exchangerVolume: 3 * area(0.0504) * 1.52,
  exchangerHeight: 1.52,
  slot: undefined,
  tubes: { bore: 0.0504, length: 1.52, count: 3 },
  // as its own model: 100 increments in the exchanger. A vertical coil needs them, its night flow changes below about 60
  nodes: { ...ROOF_MACHINE.nodes, exchanger: 100 },
  tankVolume: 0.302,
  tankDiameter: 0.508,
  tankVertical: true,
  tankLoss: 0.85 * (Math.PI * 0.508 * 1.52 + (2 * Math.PI * 0.508 * 0.508) / 4),
  wallCapacity: 0,
  boostVolume: 0,
  overheatValve: false,
  tprValve: false,
  skyTerm: false,
};

/** Common to the three Cypriot rigs of the measured nights (S18). Direct, copper, about 3 m² at 45°. Riser and header sizes from the typical Cypriot system (S26). */
const CYPRUS_BASE: MachineSpec = {
  ...ROOF_MACHINE,
  collectors: 2,
  grossArea: 3,
  apertureArea: 2.8,
  // S18 does not print its collectors' curve here: a usual selective flat plate of the time, an estimate
  curve: { eta0: 0.75, a1: 4.5, a2: 0.015 },
  plateEmissivity: 0.15,
  risers: 20,
  riserBore: 15e-3,
  headerBore: 28e-3,
  collectorWidth: 0.75,
  tilt: 45,
  circuit: 'direct',
  glycol: 0,
  exchangerVolume: 0,
  exchangerUA: 0,
  hotPipe: 0.5,
  coldPipe: 2,
  pipesFollow: false,
  pipeInsulated: true,
  tankVertical: false,
  overheatValve: false,
  tprValve: false,
};

const cyprus = (id: string, Hc: number, Ho: number, Hr: number, D: number, V: number): MachineSpec => ({
  ...CYPRUS_BASE,
  id,
  riserLength: Hc / Math.sin((45 * Math.PI) / 180), // Hc is the collector's rise (Table 1)
  tankHeight: Ho - Hc,
  returnHeight: Hr,
  tankDiameter: D - 0.1, // Ds looks like the outer diameter: 50 mm of foam a side, an estimate
  tankVolume: V,
  // the 180 L of S7's table, scaled for the 150: an estimate, S18 does not print them
  tankLoss: (1.93 * V) / 0.18,
  wallCapacity: tankWallCapacity(V),
  boostVolume: V / 2,
});

// which volume goes with which system is not stated (research K26): in the order of the table
export const CYPRUS_1 = cyprus('cyprus-1', 1.245, 1.27, 0.29, 0.59, 0.15);
export const CYPRUS_2 = cyprus('cyprus-2', 1.32, 1.41, 0.3, 0.58, 0.18);
export const CYPRUS_3 = cyprus('cyprus-3', 0.9, 1.14, 0.39, 0.58, 0.18);

/**
 * ISFH's standard double-jacket system (S19, K40), measured by ISO 9459-5. The test identifies an effective loop (A* 1.05 m², u 4.76 W/m²K), which already holds the jacket and the
 * pipes, so it cannot be used as a collector here: the preset takes the store's measured loss and capacity, and for the collector the IEA's reference curve on this collector's areas, an estimate.
 */
export const ISFH_200: MachineSpec = {
  ...ROOF_MACHINE,
  id: 'isfh-200',
  collectors: 1,
  grossArea: 2.02,
  apertureArea: 1.83,
  curve: { eta0: (0.8 * 1.83) / 2.02, a1: (3.69 * 1.83) / 2.02, a2: (0.007 * 1.83) / 2.02 },
  plateEmissivity: 0.1,
  risers: 10,
  riserLength: 1.9,
  headerBore: 18e-3,
  collectorWidth: 1.06,
  hotPipe: 0.4,
  coldPipe: 1.8,
  pipesFollow: false,
  pipeInsulated: true,
  exchangerUA: 200,
  exchangerVolume: 8e-3,
  exchangerHeight: 0.24,
  slot: { length: 1.2, width: 0.75, gap: 7.5e-3 },
  tankVolume: 0.189, // from C_S = 0.79 MJ/K at 4186 J/L·K; nominal 200 L
  tankDiameter: 0.48,
  tankLoss: 2.21,
  wallCapacity: 0, // the identified capacity holds it
  boostVolume: 0.095,
  overheatValve: false,
  tprValve: false,
};

/** Ingolstadt's reference (S20, K35). Water, 1.89 m², 10 risers 8 × 0.5, headers 18 × 1, 22 × 1 pipes over 2.64 m, 180 L, jacket 8.5 L. Height not stated: y = 0. */
export const INGOLSTADT_180: MachineSpec = {
  ...ROOF_MACHINE,
  id: 'ingolstadt-180',
  collectors: 1,
  grossArea: 2.05,
  apertureArea: 1.89,
  // not printed in what was read: a usual selective plate on 2.05 m² gross, an estimate
  curve: { eta0: 0.72, a1: 3.6, a2: 0.012 },
  plateEmissivity: 0.1,
  risers: 10,
  riserBore: 7e-3,
  riserLength: 1.9,
  headerBore: 16e-3,
  collectorWidth: 1.06,
  tilt: 38,
  hotPipe: 0.5,
  coldPipe: 2.14,
  pipesFollow: false,
  pipeInsulated: true,
  glycol: 0,
  exchangerUA: 180,
  exchangerVolume: 8.5e-3,
  exchangerHeight: 0.24,
  slot: { length: 1.46, width: 0.75, gap: 7.5e-3 },
  tankVolume: 0.18,
  tankDiameter: 0.48,
  tankLoss: 1.93,
  wallCapacity: tankWallCapacity(0.18),
  boostVolume: 0.09,
  overheatValve: false,
};

export type MachineId =
  'roof-unit' | 'one-collector-180' | 'lbl-1981' | 'cyprus-1' | 'cyprus-2' | 'cyprus-3' | 'isfh-200' | 'ingolstadt-180';

export const MACHINES: Record<MachineId, MachineSpec> = {
  'roof-unit': ROOF_MACHINE,
  'one-collector-180': ONE_COLLECTOR_180,
  'lbl-1981': LBL_1981,
  'cyprus-1': CYPRUS_1,
  'cyprus-2': CYPRUS_2,
  'cyprus-3': CYPRUS_3,
  'isfh-200': ISFH_200,
  'ingolstadt-180': INGOLSTADT_180,
};

const localCache = new Map<string, LocalCurve>();

/** The local coefficients of a machine's collector, derived from its certificate once. */
export function localOf(spec: MachineSpec): LocalCurve {
  if (spec.local) return spec.local;
  const n = spec.nodes.risers * spec.nodeScale;
  const key = `${spec.curve.eta0}|${spec.curve.a1}|${spec.curve.a2}|${n}`;
  let p = localCache.get(key);
  if (!p) {
    p = localCurve(spec.curve, TEST_RATE, n);
    localCache.set(key, p);
  }
  return p;
}

/** Rise of the collector, m, at its tilt. derived. */
export const collectorRise = (spec: Pick<MachineSpec, 'riserLength' | 'tilt'>): number =>
  spec.riserLength * Math.sin((spec.tilt * Math.PI) / 180);

/** The volume of the whole circuit, m³, at the machine's present height. */
export function circuitVolume(spec: MachineSpec): number {
  const { hot, cold } = pipeLengths(spec);
  const pipes = (hot + cold) * area(spec.pipeBore);
  const risers = spec.risers * area(spec.riserBore) * spec.riserLength;
  const headers = 2 * spec.collectors * spec.collectorWidth * area(spec.headerBore);
  return pipes + risers + headers + (spec.circuit === 'closed' ? spec.exchangerVolume : 0);
}

/** The pipes' lengths at the present height, m: they stretch with the tank, and never get shorter than the rise they must make. */
export function pipeLengths(spec: MachineSpec): { hot: number; cold: number } {
  if (!spec.pipesFollow) return { hot: spec.hotPipe, cold: spec.coldPipe };
  const y = spec.tankHeight;
  const rise = Math.abs(collectorRise(spec) + y);
  return { hot: spec.hotPipe + Math.abs(y), cold: Math.max(spec.coldPipe + y, rise + 0.3) };
}
