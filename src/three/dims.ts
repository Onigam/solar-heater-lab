import { HEADER_BORE, JACKET_HEIGHT, ROOF_UNIT, VESSEL_LENGTH } from '../sim/machine';

// The single source of the lab's dimensions, in metres, in degrees where it says so. The 3D imports from here and nowhere else; the drawings and the part sheets are to do the same.
// What the simulation already holds (`src/sim/machine.ts`, `ROOF_UNIT`) is taken from it, never retyped: a figure of the maker lives there once.
//
// Every constant carries its tag, the words of `docs/research.md`:
//   reported  said by a source (K and S numbers of the research)
//   derived   computed from reported figures, the computation is beside it
//   estimate  the sources are silent (research §2.10): a choice of ours, with its reason. The sheets mark it `*`.
//   generic   a setting, no real house or street (research §3)
//
// Frames. `roof` (a machine's own): X across the slope, right when looking up it; Y out of the roof, its plane at 0; Z down the slope, so `s`, the distance up the slope from the foot
// of the collectors, is -Z. Rotating that frame by +tilt about X stands it on a pitched roof. `tank`: the tank's centre, X its axis, Y up, Z towards the equator, horizontal.

// ------------------------------------------------------------------------------------------------ the roof

/** Pitch drawn in every world, degrees. reported range 10° to 30° on a roof (K7); this value an assumption of the research (§3), the one slider that moves the 3D is the tank's height. */
export const TILT_DEG = ROOF_UNIT.tilt;
export const TILT = (TILT_DEG * Math.PI) / 180;
export const COS = Math.cos(TILT);
export const SIN = Math.sin(TILT);

/**
 * Rail raised per collector on one side, along the slope: 12 mm a collector. reported (K8), a raise in the plane of the roof, so the whole unit keeps flat on it.
 * Which side: estimate, the hot outlet's, so that the headers climb towards it; the research's reading of the manual does not say.
 */
export const RAIL_RAISE_PER_COLLECTOR = 0.012;

// ------------------------------------------------------------------------------------------------ one collector

const FRAME_WIDTH_SOLVED = (() => {
  // derived: the frame's width that leaves the aperture of a collector (1.87 m²) inside its overall 1.943 × 1.027 m
  const L = ROOF_UNIT.collectorLength;
  const W = ROOF_UNIT.collectorWidth;
  const b = -(L + W);
  const c = (L * W - ROOF_UNIT.apertureArea) / 2;
  return (-b - Math.sqrt(b * b - 8 * c)) / 4;
})();

export const COLLECTOR = {
  /** reported (K4). */
  length: ROOF_UNIT.collectorLength,
  width: ROOF_UNIT.collectorWidth,
  depth: ROOF_UNIT.collectorDepth,
  /** reported (K4) count; derived pitch, width / count. */
  risers: ROOF_UNIT.risersPerCollector,
  riserPitch: ROOF_UNIT.riserPitch,
  /** estimate (research §3), in the simulation too; the wall an estimate, Ingolstadt's 8 × 0.5. */
  riserBore: ROOF_UNIT.riserBore,
  riserWall: 0.5e-3,
  /** derived (K4 forces it, physics §1.3); the wall an estimate. */
  headerBore: HEADER_BORE,
  headerWall: 1.5e-3,
  /** reported (K4). */
  trayThickness: 0.7e-3,
  blanket: 0.038,
  glassThickness: 3.2e-3,
  /** derived: what leaves 1.87 m² of aperture in 1.943 × 1.027 m. */
  frameWidth: FRAME_WIDTH_SOLVED,
  /** Axis of the header and the risers above the tray's back. estimate: on the blanket, a riser's radius and a little. */
  waterwayY: 0.043,
  /** Header's axis from each end of the tray. estimate, room for the header's radius. */
  headerInset: 0.038,
  /** Underside of the glass above the tray's back, and the top of its frame. estimate: what 83 mm leaves. reported overall. */
  glassY: 0.0766,
  /** A saddle of the plate over a riser, its radius above the fin. estimate: the riser's outer radius, and the sheet. */
  plateThickness: 0.6e-3,
  /** How far the header's stub leaves the tray at each end. estimate: half the bank's 30 mm gap. */
  stub: 0.015,
} as const;

/** Outer radius of a riser and a header. derived. */
export const RISER_R = COLLECTOR.riserBore / 2 + COLLECTOR.riserWall;
export const HEADER_R = COLLECTOR.headerBore / 2 + COLLECTOR.headerWall;

// ------------------------------------------------------------------------------------------------ the bank on the roof

export const BANK = {
  /** Between the two collectors. estimate (research §3): 2 × 1.027 + gap + cold pipe and valves inside the system's width. */
  gap: 0.03,
  /** The tray's back above the roof's plane: the rail's web. estimate. */
  standoff: 0.022,
} as const;

/** Width of the two collectors and their gap. derived. */
export const BANK_WIDTH = 2 * COLLECTOR.width + BANK.gap;
/** Centre of each collector, X. derived. */
export const COLLECTOR_X = {
  left: -(COLLECTOR.width + BANK.gap) / 2,
  right: (COLLECTOR.width + BANK.gap) / 2,
} as const;
/** Height of the header's axis over the roof's plane. derived. */
export const HEADER_N = BANK.standoff + COLLECTOR.waterwayY;
/** The two headers along the slope. derived. */
export const LOWER_HEADER_S = COLLECTOR.headerInset;
export const UPPER_HEADER_S = COLLECTOR.length - COLLECTOR.headerInset;
/** Angle in the plane of the roof, radians: the rail raised 12 mm per collector over the bank's width. derived. Negative about Y raises the -X end up the slope. */
export const RAIL_ANGLE = -Math.atan((ROOF_UNIT.collectors * RAIL_RAISE_PER_COLLECTOR) / BANK_WIDTH);

/** Bars across the roof, rafters across them. The rafter pitch 600 mm is in the maker's rafter table (S7 p. 51), a house chosen, generic. Set so that the unit stands between two. */
export const RAFTER_PITCH = 0.6;
export const RAFTER_XS: readonly number[] = [-0.9, -0.3, 0.3, 0.9];

export const RAIL = {
  /** Along the slope from the collectors' foot. reported, the rail to the batten of the tank's front foot (K8). */
  toFoot: ROOF_UNIT.railToFoot,
  /** The rail. estimate: an aluminium channel wide enough for the bank. */
  halfLength: BANK_WIDTH / 2 + 0.016,
  lipBelow: 0.022,
  lipThickness: 0.004,
  lipTop: 0.055,
  webUp: 0.05,
} as const;

/** The collector straps. reported that they hook the rail and fix to the rafters (R); their place on the rafters derived, their size an estimate. */
export const COLLECTOR_STRAP = { xs: RAFTER_XS, width: 0.025, thickness: 0.0015, down: 0.2 } as const;

// ------------------------------------------------------------------------------------------------ the tank

const caseR = ROOF_UNIT.tankCaseWidth / 2;

export const TANK = {
  /** reported (K6): 510 mm, 2.31 m (2013). */
  caseR,
  caseLength: ROOF_UNIT.tankCaseLength,
  /** Foot of the collectors to the back of the tank along the slope. reported (K2). So the centre, derived. */
  centreS: ROOF_UNIT.alongSlope - caseR,
  /** Centre over the roof's plane. estimate: the case's radius and 15 mm of saddle; K30 asks y ≈ 0 ± 5 cm, this gives +3.4 cm (see `drawnTankHeight`). */
  centreN: caseR + 0.015,
  /** How far each end cap bulges beyond the drum. estimate: 2.31 m overall with a slight bulge. */
  capDepth: 0.07,
  /** Case's wall. reported 0.4 mm (K6). */
  caseWall: 0.4e-3,
  /** The vessel. estimate Ø0.44 (research §3); length derived from 300 L; wall reported 2.5 mm (K6). */
  vesselR: ROOF_UNIT.vesselDiameter / 2,
  vesselLength: VESSEL_LENGTH,
  vesselWall: ROOF_UNIT.vesselWall,
  /** The jacket's gap, estimate 7.5 mm (S20), and the height it wraps, half the vessel, estimate (physics §7.3). */
  jacketGap: ROOF_UNIT.jacketGap,
  jacketHeight: JACKET_HEIGHT,
  /** The jacket's own shell. estimate. */
  jacketShell: 1.5e-3,
  /** Ports of the jacket, in the end caps, below the axis: near the bottom as S27, S20 draw them. estimate. */
  portY: -0.226,
  /** Reach of a port's nipple beyond the drum's end. estimate, inside the system's width. */
  portX: ROOF_UNIT.tankCaseLength / 2 + 0.02,
  /** The tank's saddle feet. reported the front foot's place (K8); their length to the back of the tank, and their X, estimates. */
  footXs: [-0.62, 0.62] as readonly number[],
  footWidth: 0.07,
  rearFootS: 2.4,
  /** The straps. reported they exist, fixed to the rafters. estimate their size, and X on the rafters. */
  strapXs: [-0.9, 0.9] as readonly number[],
  strapWidth: 0.03,
  strapThickness: 0.0018,
  /** Element at half height (boost 150 L of 300 L). reported volume (K6), derived height. estimate its length and diameter. */
  elementY: 0,
  elementLength: 0.72,
  elementR: 0.006,
  /** Thermostat's pocket, just above the element. estimate. */
  pocketR: 0.009,
  pocketLength: 0.3,
  /** Anode along the top of the vessel. reported magnesium on a steel core (K6), estimate size. */
  anodeR: 0.011,
  anodeLength: 1.25,
  anodeY: 0.13,
  /** Cold diffuser: a tube along the bottom, turned up over a spreader. estimate (S20 says it matters). */
  diffuserLength: 0.62,
  diffuserR: 0.014,
  diffuserY: -0.175,
  /** Hot outlet: a dip-up tube to the very top. reported it takes from the top (R), estimate its place. */
  hotOutletX: 0.85,
  hotOutletR: 0.01,
  /** The oval hatch for the element, on one end. reported shape (research §3), estimate size. */
  hatchR: 0.075,
} as const;

/** Half the drum between the caps. derived. */
export const TANK_DRUM_HALF = TANK.caseLength / 2 - TANK.capDepth;
/** The vessel's half length. derived. */
export const VESSEL_HALF = TANK.vesselLength / 2;
/** Case's inner radius, the vessel's outer, the jacket's outer. derived. */
export const CASE_INNER = TANK.caseR - TANK.caseWall;
export const VESSEL_OUTER = TANK.vesselR + TANK.vesselWall;
export const JACKET_OUTER = VESSEL_OUTER + TANK.jacketGap + TANK.jacketShell;

/** The tank's spacers, on the collectors' top. reported 200 mm from the outer edges (K8); size an estimate, what the gap to the case takes. */
export const SPACER = { inset: 0.2, width: 0.05, from: 1.86 } as const;
/** X of the two spacers. derived. */
export const SPACER_XS: readonly number[] = [-(BANK_WIDTH / 2 - SPACER.inset), BANK_WIDTH / 2 - SPACER.inset];

// ------------------------------------------------------------------------------------------------ the pipes and what hangs on them

export const PIPE = {
  /** Bore. estimate (comparators 18 to 22 mm), in the simulation too. Outer: 22 × 1. */
  bore: ROOF_UNIT.pipeBore,
  r: ROOF_UNIT.pipeBore / 2 + 0.001,
  /** X of the hot pipe's turn at the left, and of the cold pipe's run down the right: inside the 2.43 m of K2. derived. */
  hotTurnX: -1.2,
  coldRunX: BANK_WIDTH / 2 + 0.048,
  coldTurnX: 1.2,
  /** Radius of its bends. estimate. */
  bend: 0.03,
} as const;

/** Parts on the circuit. Their sizes: the maker's drawings give none; estimates, kept to what the outline of K2 allows. */
export const FITTING = {
  /** Union of the bank. */
  unionR: 0.019,
  unionLength: 0.04,
  /** Fill assembly at the bottom left, reported place (K8). */
  fillLength: 0.075,
  /** Plug at the top right, reported place (K8). */
  plugLength: 0.022,
  /** Overheat valve on the hot outlet: reported optional, closes hot; set point not published (K10). */
  overheatR: 0.024,
  overheatLength: 0.052,
  /** Circuit reservoir: research §4 R, E. Its volume is not published (§2.10). */
  reservoirR: 0.05,
  reservoirLength: 0.26,
  /** Valve on the jacket, reported 80 kPa (K10). */
  reliefR: 0.016,
} as const;

// ------------------------------------------------------------------------------------------------ heights

/**
 * Height of the case's lowest point above the collector's top corner, in the machine's own place, m. K30 says 0 ± 5 cm; the model runs its y from there.
 * derived from the dimensions above: the sheet's 2.49 m, the case's 510 mm, the collector's 1.943 m and 83 mm.
 */
export function drawnTankHeight(): number {
  const lowest = TANK.centreS * SIN + TANK.centreN * COS - TANK.caseR;
  const top = COLLECTOR.length * SIN + (BANK.standoff + COLLECTOR.depth) * COS;
  return lowest - top;
}

/** How far sideways the test stand carries the tank when y < 0, m: its left end clear of the bank and the cold pipe. derived from the widths; the place beside the bank, research §0.4. */
export const STAND_SIDEWAYS = BANK_WIDTH / 2 + TANK.caseLength / 2 + 0.16;

/** Below this |y| the machine is in its own place and the stand stays away, m. estimate: half the slider's step. */
export const AT_HOME = 0.005;

/** The rig's roof: the collectors' foot above the paper. estimate: the tank at y = -1.22 m keeps its stand's legs in sight. */
export const RIG_FOOT_Y = 0.75;

export const RIG = {
  /** The bench's rafters, a section of the same roof (research §3: rafters at 0.6 m). generic. */
  rafterW: 0.05,
  rafterH: 0.12,
  rafterFrom: -0.34,
  rafterTo: 2.76,
  battenH: 0.03,
  battenW: 0.04,
  /** Bars under each thing that bears: the rail's web, the spacers, the tank's two feet, its straps. Then every 35 cm. generic. */
  battenS: [-0.2, 0.015, 0.36, 0.71, 1.06, 1.41, 1.74, 1.97, 2.05, 2.4, 2.48, 2.68] as readonly number[],
  postW: 0.08,
  postS: [0.22, 2.58] as readonly number[],
} as const;

// ------------------------------------------------------------------------------------------------ the house: generic, no real house (research §3)

export const HOUSE = {
  /** generic (research §3): two floors, eaves 5 m, ridge 7.5 m. */
  eaves: 5,
  ridge: 7.5,
  /** generic: along the ridge, east of the slice, and how far the slice leaves of it to the west of the unit. */
  length: 10.4,
  /** Walls. generic: a stone village house. */
  wall: 0.5,
  /** The tile plane above the rafters' top. generic: rafter 15 cm deep, batten 3 cm, tile about 6 cm. */
  overhang: 0.42,
  floor1: 2.55,
  /** Foot of the collectors along the slope, from the eaves. generic: the unit stands well inside the roof, with room below. */
  footFromEaves: 1.25,
} as const;

/** Half the depth of the house, wall to ridge, from the pitch. derived. */
export const HOUSE_HALF_DEPTH = (HOUSE.ridge - HOUSE.eaves) / Math.tan(TILT);
/** The slope, eaves to ridge. derived. */
export const HOUSE_SLOPE = (HOUSE.ridge - HOUSE.eaves) / SIN;

/** The cold valves: at least 1 m from the tank, reported (K8). */
export const COLD_VALVES_FROM_TANK = 1;

// ------------------------------------------------------------------------------------------------ the tank-and-tap world

export const TAP = {
  /** The tank's axis above the floor. estimate: the world is a section of a house laid out in the order of the flow, no real distance. */
  tankY: 2.28,
  /** The wall of the bathroom. generic. */
  wallX0: 1.72,
  wallX1: 3.72,
  wallZ: -0.62,
  wallH: 2.62,
  /** Shower head above the floor. generic. */
  showerY: 2.08,
  showerX: 3.05,
  showerZ: -0.15,
  /** A tray on the floor. generic. */
  trayW: 0.9,
  trayD: 0.9,
  trayH: 0.06,
  /** Valve board heights. generic; the order of the valves reported (S7 p. 13-14). */
  valveY: 1.1,
  temperY: 1.42,
  temperX: 2.56,
} as const;

// ------------------------------------------------------------------------------------------------ the house, derived from the above

/** Layers under the tile tops, along the roof's normal: pan's bottom, batten, rafter. generic. */
export const ROOFING = { panBottom: -0.055, battenTop: -0.06, battenBottom: -0.09, rafterBottom: -0.24 } as const;

/** Where the house stops to the west, the slice, and to the east, from the unit's centre. generic: a slice right beside the machine, to show the rafters under it. */
export const HOUSE_X = { slice: -1.72, east: 8.68 } as const;

/** The tile tops' height at `z`, m: the machine stands on this plane. derived: the rafter's underside rests on the wall's centre at the eaves. */
export function tilePlaneY(z: number): number {
  const atWall = HOUSE.eaves - ROOFING.rafterBottom / COS;
  return atWall + (HOUSE_HALF_DEPTH - HOUSE.wall / 2 - Math.abs(z)) * Math.tan(TILT);
}

/** The foot of the collectors in the house. derived. */
export const HOUSE_FOOT = {
  y: tilePlaneY(HOUSE_HALF_DEPTH - HOUSE.footFromEaves * COS),
  z: HOUSE_HALF_DEPTH - HOUSE.footFromEaves * COS,
} as const;

/** The roof's slope above the eaves line, from a distance `s` from the foot of the collectors: (y, z) at normal `n`. derived. */
export function houseRoofPoint(s: number, n = 0): { y: number; z: number } {
  return { y: HOUSE_FOOT.y + s * SIN + n * COS, z: HOUSE_FOOT.z - s * COS + n * SIN };
}

/** Where the lines leave the roof, behind the tank, along the slope from the foot. reported that it sits high and behind the tank (R); the place an estimate. */
export const PENETRATION = { s: 2.72, xs: { flex: 0.8, hot: 0.9, cold: 1.0, drain: 1.1 } } as const;

/** The spine wall that takes the tank's weight, below the tank's line. generic. reported: « advisable » to brace on a load-bearing wall (K13). */
export const SPINE = { z0: 1.25, z1: 1.65 } as const;
/** The rooms the slice opens, their depth from the slice. generic. */
export const ROOM_BACK_X = 1.4;
