import type { WeatherNow } from './climate';
import { collectorRise, localOf, pipeLengths, type MachineSpec } from './machine';
import {
  boilingPoint,
  createChain,
  createMixWork,
  createNetwork,
  drawFromTop,
  fittingResistance,
  glycolMix,
  GRAVITY,
  horizontalCylinderLayers,
  layerAt,
  mixInlet,
  neutralLayer,
  slotResistance,
  stabilize,
  stepChain,
  stepFlow,
  stepNetwork,
  totalBoundaryEnergy,
  totalEnthalpy,
  tubeResistance,
  verticalCylinderLayers,
  water,
  type FluidChain,
  type Fluid,
  type LinkSpec,
  type LocalCurve,
  type MixWork,
  type NodeSpec,
  type RCNetwork,
  type TankLayers,
} from './thermal';

// The machine at one instant and one step. The loop is a chain of fluid nodes round the circuit, the tank ten layers with the core's RC network for its conduction and its
// skin. Forward is the flow by day: up the risers, into the tank, back down the cold pipe. Everything allocates once, so a step stays cheap: about 2 µs on this machine.

/** Water in a draw and in the tank, as K21's own arithmetic has it: 1 kg per litre, 4186 J/kg·K. */
export const RHO_C_WATER = 1000 * 4186;

/** Number of layers in the tank. */
export const LAYERS = 10;

/** Conductivities behind the layers' conduction, W/m·K: water, and the steel of the vessel's wall. */
const K_WATER = 0.6;
const K_STEEL = 50;

/** Where the cut-out of the booster stands, °C. reported (K9). */
export const CUT_OUT = 83;
/** The combined valve of the tank. reported (K10): 99 °C, at most 10 kW. */
export const TPR_T = 99;
export const TPR_POWER = 10e3;
/** The jacket's relief, gauge Pa. reported (K10): 80 kPa, 200 kPa with the overheat valve. */
export const RELIEF_PLAIN = 80e3;
export const RELIEF_OVERHEAT = 200e3;

/** Energy counters, J. */
export interface EnergyBook {
  sun: number;
  absorbed: number;
  collectorLoss: number;
  pipeLoss: number;
  /** Net from the loop to the tank. */
  toTank: number;
  tankLoss: number;
  /** From the tank to the taps, above the cold water. */
  delivered: number;
  demand: number;
  /** The rest of the demand, from outside the tank. */
  backup: number;
  boost: number;
  relief: number;
}

export const newBook = (): EnergyBook => ({
  sun: 0,
  absorbed: 0,
  collectorLoss: 0,
  pipeLoss: 0,
  toTank: 0,
  tankLoss: 0,
  delivered: 0,
  demand: 0,
  backup: 0,
  boost: 0,
  relief: 0,
});

/** What happened in the last step, W and °C. */
export interface PlantNow {
  gain: number;
  collectorLoss: number;
  pipeLoss: number;
  toTank: number;
  tankLoss: number;
  boost: number;
  head: number;
  /** At the tap, L/min and °C; 0 when nothing runs. */
  tapFlow: number;
  tapT: number;
  /** The combined valve has opened. */
  reliefOpen: boolean;
  /** The overheat valve has closed the circuit. */
  shut: boolean;
  /** A node of the circuit stands above its boiling point at the relief's pressure. */
  vented: boolean;
  /** Coldest node of the circuit, and of the risers alone. */
  coldest: number;
  coldestPlate: number;
  hottest: number;
}

export interface Plant {
  readonly spec: MachineSpec;
  readonly fluid: Fluid;
  readonly local: LocalCurve;
  readonly chain: FluidChain;
  /** Rise of each node in the direction of positive flow, m. */
  readonly dz: Float64Array;
  /** Height of each node's centre above the lower header, m. */
  readonly zMid: Float64Array;
  /** A node's kind, for the charts and the 3D: 0 cold pipe, 1 lower header, 2 riser, 3 upper header, 4 hot pipe, 5 exchanger. */
  readonly kind: Uint8Array;
  readonly n: number;
  readonly iLow: number;
  readonly iRiser: number;
  readonly nRiser: number;
  readonly iUp: number;
  readonly iHot: number;
  readonly nHot: number;
  readonly iEx: number;
  readonly nEx: number;
  readonly nCold: number;
  /** The tank. */
  readonly layers: TankLayers;
  readonly net: RCNetwork;
  /** Layer temperatures: a view into the network's. */
  readonly T: Float64Array;
  /** Capacity of each layer, J/K. */
  readonly w: Float64Array;
  readonly mix: MixWork;
  /** Above the lower header: bottom of the tank, m. */
  readonly tankBase: number;
  /** Exchanger's nodes: the layers each touches, by share of its area. */
  readonly spanStart: Int32Array;
  readonly spanLayer: Int32Array;
  readonly spanWeight: Float64Array;
  /** A direct circuit's tank path: how much of each layer the flow crosses, in the positive direction (downward), m. */
  readonly tankDz: Float64Array;
  readonly portLayer: number;
  readonly boostLayer: number;
  readonly pipeG: { hot: number; cold: number };
  /** Lengths of the pipes at this height, m. */
  readonly pipes: { hot: number; cold: number };
  /** Σρ·L/A of the loop, for the momentum. */
  readonly inertia: number;
  readonly rhoRef: number;
  /** Boiling point of the circuit at its relief, °C. */
  readonly ventT: number;
  /** Flow, m³/s, positive forward. */
  Q: number;
  shut: boolean;
  book: EnergyBook;
  now: PlantNow;
}

const area = (d: number): number => (Math.PI * d * d) / 4;

/** A new plant, the whole machine at one temperature. */
export function createPlant(spec: MachineSpec, T0: number): Plant {
  const k = spec.nodeScale;
  const nCold = spec.nodes.cold * k;
  const nRiser = spec.nodes.risers * k;
  const nHot = spec.nodes.hot * k;
  const direct = spec.circuit === 'direct';
  const nEx = direct ? 0 : spec.nodes.exchanger * k;
  const iLow = nCold;
  const iRiser = iLow + 1;
  const iUp = iRiser + nRiser;
  const iHot = iUp + 1;
  const iEx = iHot + nHot;
  const n = iEx + nEx;
  const fluid = direct ? water() : glycolMix(spec.glycol);
  const rhoRef = fluid.rho(40);
  const rhoC = rhoRef * fluid.cp;

  const chain = createChain(n, T0);
  const dz = new Float64Array(n);
  const zMid = new Float64Array(n);
  const kind = new Uint8Array(n);
  const rise = collectorRise(spec);
  const tankBase = rise + spec.tankHeight;
  const { hot: Lhot, cold: Lcold } = pipeLengths(spec);

  // the ends of the pipes on the tank's side
  const exH = spec.exchangerHeight;
  const hotEnd = direct ? tankBase + spec.returnHeight : spec.exchanger === 'coil' ? tankBase + exH : tankBase;
  const coldEnd = tankBase;
  const set = (i: number, zFrom: number, zTo: number, K: number, volume: number): void => {
    dz[i] = zTo - zFrom;
    zMid[i] = (zFrom + zTo) / 2;
    kind[i] = K;
    chain.C[i] = volume * rhoC;
  };
  const pipeVol = (L: number, parts: number): number => (L * area(spec.pipeBore)) / parts;
  for (let i = 0; i < nCold; i++) {
    set(
      i,
      coldEnd + ((0 - coldEnd) * i) / nCold,
      coldEnd + ((0 - coldEnd) * (i + 1)) / nCold,
      0,
      pipeVol(Lcold, nCold),
    );
  }
  const headerVol = spec.collectors * spec.collectorWidth * area(spec.headerBore);
  set(iLow, 0, 0, 1, headerVol);
  const riserVol = (spec.risers * area(spec.riserBore) * spec.riserLength) / nRiser;
  for (let i = 0; i < nRiser; i++) {
    set(iRiser + i, (rise * i) / nRiser, (rise * (i + 1)) / nRiser, 2, riserVol);
    chain.C[iRiser + i]! += (spec.dryCapacity * spec.grossArea) / nRiser;
  }
  set(iUp, rise, rise, 3, headerVol);
  for (let i = 0; i < nHot; i++) {
    set(
      iHot + i,
      rise + ((hotEnd - rise) * i) / nHot,
      rise + ((hotEnd - rise) * (i + 1)) / nHot,
      4,
      pipeVol(Lhot, nHot),
    );
  }

  // the tank
  const D = spec.tankDiameter;
  const layers = spec.tankVertical
    ? verticalCylinderLayers(D, spec.tankVolume / area(D), LAYERS)
    : horizontalCylinderLayers(D, spec.tankVolume / area(D), LAYERS);
  const w = new Float64Array(LAYERS);
  const totalWall = layers.wallArea.reduce((a, b) => a + b, 0);
  const nodes: NodeSpec[] = [];
  for (let i = 0; i < LAYERS; i++) {
    const cap = layers.volume[i]! * RHO_C_WATER + (spec.wallCapacity * layers.wallArea[i]!) / totalWall;
    w[i] = cap;
    nodes.push({ T: T0, capacity: cap });
  }
  nodes.push({ T: T0, fixed: true });
  const links: LinkSpec[] = [];
  const dzLayer = layers.height / LAYERS;
  for (let i = 0; i < LAYERS - 1; i++) {
    // water across the interface, and the steel of the wall along it
    const wallPath = spec.tankVertical
      ? Math.PI * D * spec.wallThickness
      : 2 * (spec.tankVolume / area(D)) * spec.wallThickness;
    const G = (K_WATER * layers.interfaceArea[i]! + K_STEEL * wallPath) / dzLayer;
    links.push({ a: i, b: i + 1, G });
  }
  for (let i = 0; i < LAYERS; i++)
    links.push({ a: i, b: LAYERS, G: (spec.tankLoss * layers.wallArea[i]!) / totalWall });
  const net = createNetwork(nodes, links);
  const T = net.T.subarray(0, LAYERS);

  // the exchanger's nodes against the layers they touch
  const starts: number[] = [];
  const spanLayer: number[] = [];
  const spanWeight: number[] = [];
  const addSpan = (zFrom: number, zTo: number): void => {
    starts.push(spanLayer.length);
    const lo = Math.min(zFrom, zTo);
    const hi = Math.max(zFrom, zTo);
    let total = 0;
    const entries: [number, number][] = [];
    for (let l = 0; l < LAYERS; l++) {
      const a = Math.max(lo, layers.zEdges[l]!);
      const b = Math.min(hi, layers.zEdges[l + 1]!);
      if (b <= a) continue;
      // by the wall that faces it
      const share = ((b - a) / dzLayer) * layers.wallArea[l]!;
      entries.push([l, share]);
      total += share;
    }
    for (const [l, s] of entries) {
      spanLayer.push(l);
      spanWeight.push(s / total);
    }
  };
  if (!direct) {
    const half = nEx / 2;
    for (let i = 0; i < nEx; i++) {
      let from: number;
      let to: number;
      if (spec.exchanger === 'jacket') {
        // up one side, down the other, both ports at the bottom (S27, S20)
        if (i < half) {
          from = (exH * i) / half;
          to = (exH * (i + 1)) / half;
        } else {
          from = exH - (exH * (i - half)) / half;
          to = exH - (exH * (i - half + 1)) / half;
        }
      } else {
        // a coil only falls
        from = exH - (exH * i) / nEx;
        to = exH - (exH * (i + 1)) / nEx;
      }
      set(iEx + i, tankBase + from, tankBase + to, 5, spec.exchangerVolume / nEx);
      addSpan(from, to);
    }
  }
  starts.push(spanLayer.length);

  // a direct circuit crosses the tank from its return down to its bottom
  const portLayer = direct ? layerAt(layers, spec.returnHeight) : 0;
  const tankDz = new Float64Array(LAYERS);
  if (direct) {
    for (let l = 0; l <= portLayer; l++) {
      const top = Math.min(layers.zEdges[l + 1]!, spec.returnHeight);
      tankDz[l] = -(top - layers.zEdges[l]!);
    }
  }

  // the booster sits at the bottom of the boost volume, counted from the top
  let above = 0;
  let boostLayer = LAYERS - 1;
  for (let l = LAYERS - 1; l >= 0; l--) {
    above += layers.volume[l]!;
    boostLayer = l;
    if (above >= spec.boostVolume - 1e-9) break;
  }

  const pipeU = spec.pipeInsulated ? spec.pipeLossInsulated : spec.pipeLossBare;
  const riserA = spec.risers * area(spec.riserBore);
  const inertia =
    rhoRef *
    (spec.riserLength / riserA +
      (2 * spec.collectors * spec.collectorWidth) / area(spec.headerBore) +
      (Lhot + Lcold) / area(spec.pipeBore) +
      (spec.slot ? spec.slot.length / (spec.slot.width * spec.slot.gap) : 0));

  const reliefP = spec.overheatValve ? RELIEF_OVERHEAT : RELIEF_PLAIN;
  return {
    spec,
    fluid,
    local: localOf(spec),
    chain,
    dz,
    zMid,
    kind,
    n,
    iLow,
    iRiser,
    nRiser,
    iUp,
    iHot,
    nHot,
    iEx,
    nEx,
    nCold,
    layers,
    net,
    T,
    w,
    mix: createMixWork(LAYERS),
    tankBase,
    spanStart: Int32Array.from(starts),
    spanLayer: Int32Array.from(spanLayer),
    spanWeight: Float64Array.from(spanWeight),
    tankDz,
    portLayer,
    boostLayer,
    pipeG: { hot: (pipeU * Lhot) / nHot, cold: (pipeU * Lcold) / nCold },
    pipes: { hot: Lhot, cold: Lcold },
    inertia,
    rhoRef,
    // a mix boils a little above water: about 2 K at this strength, usual values
    ventT: boilingPoint(reliefP) + (direct ? 0 : 2),
    Q: 0,
    shut: false,
    book: newBook(),
    now: {
      gain: 0,
      collectorLoss: 0,
      pipeLoss: 0,
      toTank: 0,
      tankLoss: 0,
      boost: 0,
      head: 0,
      tapFlow: 0,
      tapT: T0,
      reliefOpen: false,
      shut: false,
      vented: false,
      coldest: T0,
      coldestPlate: T0,
      hottest: T0,
    },
  };
}

/** Set the whole machine, or the tank alone, to temperatures. */
export function setPlantField(p: Plant, loopT: number, tankT: number | ((layer: number) => number), airT = 15): void {
  p.chain.T.fill(loopT);
  for (let l = 0; l < LAYERS; l++) p.T[l] = typeof tankT === 'number' ? tankT : tankT(l);
  p.net.T[LAYERS] = airT;
  syncTank(p);
}

/** Bring the network's enthalpies back in line after the layers were changed by hand. */
function syncTank(p: Plant): void {
  const { net, T } = p;
  for (let l = 0; l < LAYERS; l++) net.H[l] = net.capacity[l]! * T[l]!;
}

/** The energy the machine holds, J above 0 °C, on its own capacities. */
export function plantEnergy(p: Plant): number {
  const { chain } = p;
  let e = totalEnthalpy(p.net);
  for (let i = 0; i < p.n; i++) e += chain.C[i]! * chain.T[i]!;
  return e;
}

/** The head of the loop at its present temperatures, Pa: positive drives the flow forward. */
export function loopHead(p: Plant): number {
  const { chain, dz, n, fluid } = p;
  const T = chain.T;
  let s = 0;
  for (let i = 0; i < n; i++) {
    const d = dz[i]!;
    if (d !== 0) s += fluid.rho(T[i]!) * d;
  }
  if (p.spec.circuit === 'direct') {
    for (let l = 0; l <= p.portLayer; l++) s += fluid.rho(p.T[l]!) * p.tankDz[l]!;
  }
  return -GRAVITY * s;
}

/** The loop's resistance at a flow of absolute value Qa, Pa per m³/s. */
export function loopResistance(p: Plant, Qa: number): number {
  const { spec, fluid, chain, iLow, iRiser, nRiser, iUp, iHot, nHot, iEx, nEx } = p;
  const T = chain.T;
  const rho = p.rhoRef;
  const muRiser = fluid.mu(T[iRiser + (nRiser >> 1)]!);
  let R = tubeResistance(Qa, spec.riserBore, spec.riserLength, spec.risers, rho, muRiser);
  // a manifold carries the flow over its length, falling to nothing: a third of the length, as seen by the whole flow
  const Lh = (spec.collectors * spec.collectorWidth) / 3;
  R += tubeResistance(Qa, spec.headerBore, Lh, 1, rho, fluid.mu(T[iLow]!));
  R += tubeResistance(Qa, spec.headerBore, Lh, 1, rho, fluid.mu(T[iUp]!));
  const muHot = fluid.mu(T[iHot + (nHot >> 1)]!);
  const muCold = fluid.mu(T[1]!);
  R += tubeResistance(Qa, spec.pipeBore, p.pipes.hot, 1, rho, muHot);
  R += tubeResistance(Qa, spec.pipeBore, p.pipes.cold, 1, rho, muCold);
  R += fittingResistance(Qa, spec.pipeBore, spec.bends / 2, rho, muHot);
  R += fittingResistance(Qa, spec.pipeBore, spec.bends / 2, rho, muCold);
  if (nEx > 0) {
    const muEx = fluid.mu(T[iEx + (nEx >> 1)]!);
    if (spec.slot) R += slotResistance(muEx, spec.slot.length, spec.slot.width, spec.slot.gap);
    else if (spec.tubes) R += tubeResistance(Qa, spec.tubes.bore, spec.tubes.length, spec.tubes.count, rho, muEx);
  }
  if (spec.checkValve) R += (2 * rho * (Qa / area(spec.pipeBore))) / (2 * area(spec.pipeBore)); // K = 2 in the forward direction
  return R;
}

/** A light swing check: the push it takes to open, Pa. estimate; a spring-loaded one needs far more than the loop's whole push, see docs/physics.md. */
export const CHECK_CRACK = 5;

/**
 * The longest time the flow is allowed to settle in one step, s. The live engine and the runs of a day step below it and never see it. Runs of a year step over it: without it a fixed step of a minute
 * or more finds a false, strong flow with the tank far below the collector (tested), the step carrying the fluid across a stretch at once.
 */
export const FLOW_SETTLE = 10;

/** Relax the flow for `dt` seconds at the present temperatures. The fast clock: at a held hour the flow still settles. */
export function relaxFlow(p: Plant, dt: number): void {
  const head = loopHead(p);
  p.now.head = head;
  if (p.shut) {
    p.Q = 0;
    return;
  }
  let drive = head;
  if (p.spec.checkValve) {
    if (p.Q <= 0 && head <= CHECK_CRACK) {
      p.Q = 0;
      return;
    }
    drive = head - CHECK_CRACK;
  }
  const R = loopResistance(p, Math.abs(p.Q));
  const next = stepFlow(p.Q, drive, R, p.inertia, dt);
  // over a long step the flow may not jump at once: the fluid would be carried across the loop in one go, and could feed a false flow (see FLOW_SETTLE)
  p.Q = dt > FLOW_SETTLE ? p.Q + ((next - p.Q) * FLOW_SETTLE) / dt : next;
  if (p.spec.checkValve && p.Q < 0) p.Q = 0;
}

/** What the taps and the booster do during a step. */
export interface LoadStep {
  /** Cold water, °C. */
  Tc: number;
  /** Litres asked for at the tap in this step, m³, at a use temperature; 0 for none. */
  volume: number;
  Tuse: number;
  /** Mixed down to Tuse by a valve (the tank gives less). Off: the tank gives this volume as it is, hot or not. */
  temper: boolean;
  /** Share of the booster's clock: on or off now. */
  boostAllowed: boolean;
  /** A set point at the tap, for the reading only. */
  Tset: number;
  temperOn: boolean;
}

export const newLoad = (): LoadStep => ({
  Tc: 15,
  volume: 0,
  Tuse: 45,
  temper: true,
  boostAllowed: false,
  Tset: 50,
  temperOn: true,
});

/** One fixed step of the slow clock, in seconds. The flow, then the fluid, then the tank. */
export function stepPlant(p: Plant, wx: WeatherNow, load: LoadStep, h: number): void {
  relaxFlow(p, h);
  const {
    chain,
    spec,
    net,
    T,
    w,
    now,
    book,
    n,
    iRiser,
    nRiser,
    iHot,
    nHot,
    iEx,
    nEx,
    nCold,
    local,
    spanStart,
    spanLayer,
    spanWeight,
  } = p;
  const direct = spec.circuit === 'direct';
  const Ta = wx.Ta;
  const Tenv = Ta - wx.depression;
  const mc = p.Q * p.rhoRef * p.fluid.cp;

  // what each node exchanges
  const { G, Text, S } = chain;
  const Ai = spec.grossArea / nRiser;
  for (let i = iRiser; i < iRiser + nRiser; i++) {
    const dT = chain.T[i]! - Tenv;
    G[i] = Ai * (local.u1 + local.u2 * Math.abs(dT));
    Text[i] = Tenv;
    S[i] = Ai * local.F * wx.Geff;
  }
  for (let i = 0; i < nCold; i++) {
    G[i] = p.pipeG.cold;
    Text[i] = Ta;
  }
  for (let i = iHot; i < iHot + nHot; i++) {
    G[i] = p.pipeG.hot;
    Text[i] = Ta;
  }
  if (!direct) {
    const gx = spec.exchangerUA / nEx;
    for (let k = 0; k < nEx; k++) {
      let t = 0;
      for (let s = spanStart[k]!; s < spanStart[k + 1]!; s++) t += spanWeight[s]! * T[spanLayer[s]!]!;
      G[iEx + k] = gx;
      Text[iEx + k] = t;
    }
  }

  // the fluid moves and exchanges
  const Tin = direct ? (mc >= 0 ? T[0]! : T[p.portLayer]!) : undefined;
  stepChain(chain, mc, h, Tin);

  // the book of the fluid
  let absorbed = 0;
  let collLoss = 0;
  let coldestPlate = Infinity;
  for (let i = iRiser; i < iRiser + nRiser; i++) {
    absorbed += S[i]!;
    collLoss += G[i]! * (chain.T[i]! - Text[i]!);
    if (chain.T[i]! < coldestPlate) coldestPlate = chain.T[i]!;
  }
  let pipeLoss = 0;
  for (let i = 0; i < nCold; i++) pipeLoss += G[i]! * (chain.T[i]! - Text[i]!);
  for (let i = iHot; i < iHot + nHot; i++) pipeLoss += G[i]! * (chain.T[i]! - Text[i]!);

  // the tank receives
  const Qt = net.Q;
  Qt.fill(0);
  net.T[LAYERS] = Ta;
  let toTank = 0;
  if (!direct) {
    const s = spec.stratify;
    for (let k = 0; k < nEx; k++) {
      const i = iEx + k;
      const Tx = chain.T[i]!;
      const q = G[i]! * (Tx - Text[i]!);
      toTank += q;
      const heating = q > 0;
      for (let a = spanStart[k]!; a < spanStart[k + 1]!; a++) {
        const l = spanLayer[a]!;
        const ql = q * spanWeight[a]!;
        const target = neutralLayer(T, l, Tx, heating);
        Qt[l]! += (1 - s) * ql;
        Qt[target]! += s * ql;
      }
    }
  }

  // the booster
  let boost = 0;
  if (spec.boost !== 'off' && load.boostAllowed && T[p.boostLayer]! < spec.setPoint && T[LAYERS - 1]! < CUT_OUT) {
    boost = spec.boostPower;
    Qt[p.boostLayer]! += boost;
  }

  // conduction, skin
  const lossBefore = totalBoundaryEnergy(net);
  stepNetwork(net, h);
  const tankLoss = (totalBoundaryEnergy(net) - lossBefore) / h;

  // a direct circuit carries water through the tank
  if (direct && mc !== 0) {
    const m = Math.abs(mc) * h;
    const out = mc > 0 ? chain.T[n - 1]! : chain.T[0]!;
    toTank = (mc > 0 ? mc : -mc) * (out - Tin!);
    moveThroughTank(p, mc, m, out);
  }

  // the taps
  now.tapFlow = 0;
  if (load.volume > 0) {
    const V = load.volume;
    const top = T[LAYERS - 1]!;
    const Tc = load.Tc;
    let Vtank = V;
    if (load.temper) {
      const need = RHO_C_WATER * V * (load.Tuse - Tc);
      book.demand += need;
      if (top > load.Tuse) Vtank = (V * (load.Tuse - Tc)) / (top - Tc);
      if (top <= Tc) Vtank = 0;
      const mcDraw = RHO_C_WATER * Vtank;
      const out = drawFromTop(T, w, mcDraw, Tc);
      const given = mcDraw * (out - Tc);
      book.delivered += given;
      if (need > given) book.backup += need - given;
    } else {
      const mcDraw = RHO_C_WATER * Vtank;
      const out = drawFromTop(T, w, mcDraw, Tc);
      book.delivered += mcDraw * (out - Tc);
    }
    mixInlet(T, w, p.layers.volume, spec.drawMix);
    now.tapFlow = (V / h) * 60000;
    now.tapT = load.temperOn ? Math.min(top, load.Tset) : top;
  } else {
    now.tapT = load.temperOn ? Math.min(T[LAYERS - 1]!, load.Tset) : T[LAYERS - 1]!;
  }

  // the combined valve
  now.reliefOpen = false;
  if (spec.tprValve && T[LAYERS - 1]! > TPR_T) {
    const top = T[LAYERS - 1]!;
    const excess = (top - TPR_T) * w[LAYERS - 1]!;
    const e = Math.min(excess, TPR_POWER * h);
    const mcR = e / Math.max(top - load.Tc, 1);
    const out = drawFromTop(T, w, mcR, load.Tc);
    book.relief += mcR * (out - load.Tc);
    now.reliefOpen = true;
  }

  stabilize(T, w, p.mix);
  if (spec.mixedTank) {
    let e = 0;
    let c = 0;
    for (let l = 0; l < LAYERS; l++) {
      e += w[l]! * T[l]!;
      c += w[l]!;
    }
    T.fill(e / c);
  }
  for (let l = 0; l < LAYERS; l++) net.H[l] = net.capacity[l]! * T[l]!;

  // the overheat valve closes the circuit, and opens again 5 K lower
  if (spec.overheatValve) {
    const top = T[LAYERS - 1]!;
    if (!p.shut && top >= spec.overheatSet) p.shut = true;
    else if (p.shut && top < spec.overheatSet - 5) p.shut = false;
  }

  // the book
  book.sun += wx.G * spec.grossArea * h;
  book.absorbed += absorbed * h;
  book.collectorLoss += collLoss * h;
  book.pipeLoss += pipeLoss * h;
  book.toTank += toTank * h;
  book.tankLoss += tankLoss * h;
  book.boost += boost * h;

  let coldest = coldestPlate;
  let hottest = -Infinity;
  for (let i = 0; i < n; i++) {
    const t = chain.T[i]!;
    if (t < coldest) coldest = t;
    if (t > hottest) hottest = t;
  }
  now.gain = absorbed - collLoss;
  now.collectorLoss = collLoss;
  now.pipeLoss = pipeLoss;
  now.toTank = toTank;
  now.tankLoss = tankLoss;
  now.boost = boost;
  now.shut = p.shut;
  now.vented = hottest > p.ventT;
  now.coldest = coldest;
  now.coldestPlate = coldestPlate;
  now.hottest = hottest;
}

/** Water through the tank of a direct circuit: out at one end, in at the other, the layers between pushed along. The energy balance is exact. */
function moveThroughTank(p: Plant, mc: number, m: number, out: number): void {
  const { T, w } = p;
  if (mc > 0) {
    // from the bottom; the return goes to the level of its own temperature
    const target = neutralLayer(T, p.portLayer, out, out > T[p.portLayer]!);
    const steps = Math.max(1, Math.ceil(m / (0.5 * w[0]!)));
    const part = m / steps;
    for (let s = 0; s < steps; s++) {
      for (let j = 0; j < target; j++) T[j] = T[j]! + (part / w[j]!) * (T[j + 1]! - T[j]!);
      T[target] = T[target]! + (part / w[target]!) * (out - T[target]!);
    }
  } else {
    // from the return, back in at the bottom
    const k = p.portLayer;
    const steps = Math.max(1, Math.ceil(m / (0.5 * w[0]!)));
    const part = m / steps;
    for (let s = 0; s < steps; s++) {
      for (let j = k; j > 0; j--) T[j] = T[j]! + (part / w[j]!) * (T[j - 1]! - T[j]!);
      T[0] = T[0]! + (part / w[0]!) * (out - T[0]!);
    }
  }
}

/** Heat left in the book: what must be zero if the energy is conserved, J. */
export const bookBalance = (p: Plant, E0: number): number => {
  const b = p.book;
  return (
    plantEnergy(p) - E0 - (b.absorbed + b.boost - b.collectorLoss - b.pipeLoss - b.tankLoss - b.delivered - b.relief)
  );
};
