import { strL } from '@onigam/lab-kit/i18n';
import type { AppContext, LabDefinition } from '@onigam/lab-kit/ui';
import { ASSEMBLY } from './data/assembly';
import { VIDEO_ID } from './data/chapters';
import { INSTALL } from './data/install';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { sourcesPanel } from './data/sources';
import { SHEET_GROUPS, SHEETS } from './drawings';
import './i18n/ui';
import { SimPanel } from './panels/sim';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { SolarSim } from './sim/engine';
import { createCollectorScene, createHouseScene, createRigScene, createTankScene, PART_OPENS, WORLD } from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

const sim = new SolarSim();

/** What each part that opens a detailed world says on its button. */
const OPEN_LABEL = { rig: strL('goRig'), collector: strL('goCollector'), 'tank-and-tap': strL('goTank') } as const;

export const lab: LabDefinition<SolarSim> = {
  id: 'solar-heater-lab',
  brand: { title: strL('labTitle'), tagline: strL('tagline') },
  sim,
  defaultScene: 'house',
  video: { id: VIDEO_ID },
  // the envelope of a part sheet is measured on the 3D model: in this lab a figure carries its mark
  envelopeMark: '*',
  parts: PARTS,
  scenes: [
    {
      id: 'house',
      label: strL('sceneHouse'),
      module: createHouseScene(() => sim.params),
      ...WORLD.house,
      overview: {
        ...OVERVIEWS.house,
        actions: [
          { label: strL('goRig'), scene: 'rig', primary: true },
          { label: strL('goSimulation'), mode: 'sim' },
        ],
      },
    },
    {
      id: 'rig',
      label: strL('sceneRig'),
      module: createRigScene(() => sim.params),
      ...WORLD.rig,
      overview: {
        ...OVERVIEWS.rig,
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goCollector'), scene: 'collector' },
          { label: strL('goTank'), scene: 'tank-and-tap' },
          { label: strL('goHouse'), scene: 'house' },
        ],
      },
    },
    {
      id: 'collector',
      label: strL('sceneCollector'),
      module: createCollectorScene(),
      ...WORLD.collector,
      overview: {
        ...OVERVIEWS.collector,
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goTank'), scene: 'tank-and-tap' },
          { label: strL('goRig'), scene: 'rig' },
        ],
      },
    },
    {
      id: 'tank-and-tap',
      label: strL('sceneTank'),
      module: createTankScene(),
      ...WORLD['tank-and-tap'],
      overview: {
        ...OVERVIEWS['tank-and-tap'],
        actions: [
          { label: strL('goSimulation'), mode: 'sim', primary: true },
          { label: strL('goCollector'), scene: 'collector' },
          { label: strL('goRig'), scene: 'rig' },
        ],
      },
    },
  ],
  partLinks: Object.fromEntries(
    Object.entries(PART_OPENS).map(([part, scene]) => [part, { scene, label: OPEN_LABEL[scene] }]),
  ),
  guides: {
    // the assembly starts in the factory, on one collector, and ends on the roof; the installation starts on the house. Each step names its own world.
    assembly: { scene: 'collector', steps: ASSEMBLY },
    install: { scene: 'house', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: {
    sheets: SHEETS,
    groups: [...SHEET_GROUPS],
    intro: strL('plansIntro'),
  },
  // spoken guide: audio and subtitles generated from narration/<lang>.json. Until they exist, the manifest answers 404 and nothing of the feature shows.
  narration: { manifest: 'audio/{lang}/manifest.json' },
  simPanel: (ctx: AppContext<SolarSim>) => new SimPanel(ctx),
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: sourcesPanel,
};
