// A closed loop of fluid driven by its own buoyancy, or by anything else: the signed head round the loop, friction, the flow, and a chain of fluid nodes
// that hold heat and are carried along by the flow, whichever way it runs.
//
// Why the nodes hold heat: `fluidLine` and `marchFluid` of exchange.ts take the nodes as constant during a crossing, which is fine for air in stone and
// false here, where the fluid is a real capacity and may take hours to go round. Why implicit upwind: a small node in a big flow would otherwise set the
// step; this one is stable and monotone at any fixed step, and conserves energy to rounding.

/** Gravity, m/s². */
export const GRAVITY = 9.81;

/**
 * Head round a closed loop, Pa: −g·∮ρ dz, the sum over the cells of a closed chain. `dz[i]` is the rise of cell i in the direction of positive flow, `rho[i]`
 * its density. Positive drives the flow forward. The chain being closed, dz sums to zero and only the differences of density count. This is also a chimney's
 * draft (the outside air being the other leg).
 */
export function buoyantHead(dz: ArrayLike<number>, rho: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < dz.length; i++) s += rho[i]! * dz[i]!;
  return -GRAVITY * s;
}

/** Darcy friction factor: 64/Re, then Petukhov, blended smoothly over the transition, so that no jump can drive a limit cycle. */
export function frictionFactor(Re: number): number {
  const lam = 64 / Math.max(Re, 1e-9);
  if (Re <= 2300) return lam;
  const turb = Math.pow(0.79 * Math.log(Re) - 1.64, -2);
  if (Re >= 4000) return turb;
  const u = (Re - 2300) / 1700;
  const s = u * u * (3 - 2 * u);
  return lam + (turb - lam) * s;
}

/** Resistance of N tubes in parallel, Pa per m³/s: Δp = R·Q, for a flow of absolute value `Q`. Goes to the laminar value, not to zero, as the flow stops. */
export function tubeResistance(Q: number, D: number, L: number, N: number, rho: number, mu: number): number {
  const lam = (128 * mu * L) / (Math.PI * D * D * D * D * N);
  const A = (Math.PI * D * D) / 4;
  const v = Q / (N * A);
  const Re = (rho * v * D) / mu;
  if (Re <= 2300) return lam;
  return (frictionFactor(Re) * (L / D) * rho * v) / (2 * N * A);
}

/** Resistance of a thin rectangular slot, Pa per m³/s, laminar: 12·μ·L/(w·g³). */
export const slotResistance = (mu: number, L: number, width: number, gap: number): number =>
  (12 * mu * L) / (width * gap * gap * gap);

/**
 * Resistance of `count` fittings in a tube, Pa per m³/s: Hooper's two-constant form K = K1/Re + K∞, which falls back on a laminar loss at low flow. Usual values
 * for a long-radius 90° bend: K1 = 800, K∞ = 0.25.
 */
export function fittingResistance(
  Q: number,
  D: number,
  count: number,
  rho: number,
  mu: number,
  K1 = 800,
  Kinf = 0.25,
): number {
  const A = (Math.PI * D * D) / 4;
  const v = Q / A;
  return count * ((K1 * mu) / (2 * D * A) + (Kinf * rho * v) / (2 * A));
}

/**
 * One step of the momentum of a loop: I·dQ/dt = head − R(Q)·Q, implicit in the resistance, so stable and monotone at any step. `inertia` is Σρ·L/A. Reversal is
 * not a mode: it is the sign of the flow. Returns the new flow, m³/s.
 */
export function stepFlow(Q: number, head: number, R: number, inertia: number, dt: number): number {
  const a = dt / inertia;
  return (Q + a * head) / (1 + a * R);
}

/** A chain of nodes and the work space to solve it: everything per node, allocated once. */
export interface FluidChain {
  readonly n: number;
  /** Temperature of each node, °C. */
  readonly T: Float64Array;
  /** Heat capacity, J/K. */
  readonly C: Float64Array;
  /** Conductance to the node's outside, W/K, and the temperature there. Set them before each step. */
  readonly G: Float64Array;
  readonly Text: Float64Array;
  /** Heat applied, W. */
  readonly S: Float64Array;
  readonly alpha: Float64Array;
  readonly beta: Float64Array;
}

export function createChain(n: number, T0: number): FluidChain {
  return {
    n,
    T: new Float64Array(n).fill(T0),
    C: new Float64Array(n),
    G: new Float64Array(n),
    Text: new Float64Array(n),
    S: new Float64Array(n),
    alpha: new Float64Array(n),
    beta: new Float64Array(n),
  };
}

/**
 * One step of the chain, implicit upwind: C·(T′ − T)/dt = m·(T′_up − T′) + G·(Text − T′) + S, with m = |ṁ|·c the capacity rate. `mc` carries the sign of the flow:
 * positive runs from node 0 to node n−1. With `Tin` undefined the chain is a closed ring and the last node feeds the first; with `Tin` it is open, and fed
 * at that temperature at whichever end the flow enters. Summed over the chain the advection cancels, so the energy is conserved to rounding. O(n), no allocation.
 */
export function stepChain(chain: FluidChain, mc: number, dt: number, Tin?: number): void {
  const { n, T, C, G, Text, S, alpha, beta } = chain;
  const m = Math.abs(mc);
  const forward = mc >= 0;
  const closed = Tin === undefined;
  let a = closed ? 0 : m * Tin;
  let b = closed ? m : 0;
  for (let k = 0; k < n; k++) {
    const i = forward ? k : n - 1 - k;
    const c = C[i]! / dt;
    const d = c + m + G[i]!;
    const al = (c * T[i]! + G[i]! * Text[i]! + S[i]! + a) / d;
    const be = b / d;
    alpha[k] = al;
    beta[k] = be;
    a = m * al;
    b = m * be;
  }
  const last = closed ? alpha[n - 1]! / (1 - beta[n - 1]!) : 0;
  for (let k = 0; k < n; k++) {
    const i = forward ? k : n - 1 - k;
    T[i] = alpha[k]! + beta[k]! * last;
  }
}

/** The temperature the flow leaves an open chain with: the end the flow reaches last. */
export const chainOutlet = (chain: FluidChain, mc: number): number => (mc >= 0 ? chain.T[chain.n - 1]! : chain.T[0]!);
