// What the data and the drawings read of the machine, in one line each: `src/three/dims.ts` for what the 3D draws, `ROOF_UNIT` of `src/sim/machine.ts` for the maker's figures. Nothing is retyped here. dims.ts itself imports only from the simulation, not from three.js.
import { RAIL_ANGLE } from '../three/dims';
import { HEADER_BORE, ROOF_UNIT } from '../sim/machine';

export { BANK, BANK_WIDTH, COLLECTOR, drawnTankHeight, RAIL_ANGLE, TANK } from '../three/dims';

/** The maker's figures, as the simulation holds them. */
export const ROOF_NUMBERS = ROOF_UNIT;

/** The rail's angle in the plane of the roof, degrees. derived. */
export const RAIL_ANGLE_DEG = (Math.abs(RAIL_ANGLE) * 180) / Math.PI;
/** Bore of a header, mm. derived from 3.8 L a collector, with risers of an estimated 7 mm. */
export const HEADER_BORE_MM = HEADER_BORE * 1000;
/** Bore of the two pipes, mm. estimate. */
export const PIPE_BORE_MM = ROOF_UNIT.pipeBore * 1000;
