import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { SolarParams, SolarState } from '../sim/types';
import { createCollectorScene as buildCollectorScene } from './collector/scene';
import { createHouseScene as buildHouseScene } from './house/scene';
import { createRigScene as buildRigScene } from './rig/scene';
import { createTankScene as buildTankScene } from './tank/scene';

// The four worlds, all `lazyModule`s: nothing is built until the visitor goes there. Use the result as the `module` of the `SceneDef`, and spread `WORLD[id]` next to it.

export const createHouseScene = (params: () => SolarParams): SceneModule<SolarState> =>
  lazyModule<SolarState>('house', () => buildHouseScene(params));
export const createRigScene = (params: () => SolarParams): SceneModule<SolarState> =>
  lazyModule<SolarState>('rig', () => buildRigScene(params));

export const createCollectorScene = (): SceneModule<SolarState> =>
  lazyModule<SolarState>('collector', () => buildCollectorScene());
export const createTankScene = (): SceneModule<SolarState> =>
  lazyModule<SolarState>('tank-and-tap', () => buildTankScene());

/** The parts that open a detailed world, for `LabDefinition.partLinks` (research §0.4): the label is the application's. */
export const PART_OPENS = {
  'roof-unit': 'rig',
  'collector-left': 'collector',
  'collector-right': 'collector',
  'storage-tank': 'tank-and-tap',
} as const;

/** What `src/lab.ts` needs to know of each world, as `SceneDef` fields. */
export const WORLD = {
  house: {
    /** A house does not come apart: a guide's parts still drop in. Its slice is always there, no other cut (research §0.4). */
    cutaway: false,
    explode: false,
    xrayNeedsSelection: true,
    partPadding: 1.5,
    stepFrame: { padding: 1.6, minRadius: 0.8 },
  },
  rig: {
    /** The tank's section is the `tank-and-tap` world's: `storage-tank` opens it (research §0.4). */
    cutaway: false,
    partPadding: 1.9,
    stepFrame: { padding: 1.5, minRadius: 0.3 },
    xrayShell: (id: string): boolean => id === 'collector-left' || id === 'collector-right' || id === 'storage-tank',
  },
  collector: {
    /** The world opens on its stair at the corner; the section tool is a true cut across the risers. */
    cutaway: true,
    partPadding: 1.5,
    stepFrame: { padding: 1.5, minRadius: 0.25 },
    xrayShell: (id: string): boolean => id === 'glass-cover' || id === 'glass-seal' || id === 'absorber-plate',
  },
  'tank-and-tap': {
    /** The world opens on the tank cut along its axis; the section tool cuts it across, for the ten layers as slices of a circle. */
    cutaway: true,
    partPadding: 1.6,
    stepFrame: { padding: 1.5, minRadius: 0.25 },
    xrayShell: (id: string): boolean => id === 'tank-foam' || id === 'outer-case',
  },
} as const;
