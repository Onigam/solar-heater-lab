import type { PartInfo } from '@onigam/lab-kit/content';
import { COLLECTOR_PARTS } from './parts/collector';
import { DIM_SPECS } from './parts/dim-specs';
import { HOUSE_PARTS } from './parts/house';
import { RIG_PARTS } from './parts/rig';
import { TANK_PARTS } from './parts/tank';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the order of docs/research.md §4: `house` 10, `rig` 15, `collector` 9, `tank-and-tap` 17. The ids are the contract with the 3D role (src/three/part-ids.ts): data.test.ts holds them against
// that list. The dimension rows of each sheet are read from src/three/dims.ts in ./parts/dim-specs.ts and appended here, so that no length is typed twice.
export const PARTS: PartInfo[] = [...HOUSE_PARTS, ...RIG_PARTS, ...COLLECTOR_PARTS, ...TANK_PARTS].map((p) => ({
  ...p,
  specs: [...p.specs, ...(DIM_SPECS[p.id] ?? [])],
}));
