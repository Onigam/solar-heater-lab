import { configureDrawings, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { assemblySheet } from './pl09-assembly';
import { bomSheet } from './pl10-bom';
import { budgetSheet } from './pl08-budget';
import { collectorSheet } from './pl03-collector';
import { arrangementSheet } from './pl01-arrangement';
import { fixingSheet } from './pl06-fixing';
import { heightsSheet } from './pl02-heights';
import { loadsSheet } from './pl07-loads';
import { schematicSheet } from './pl05-schematic';
import { tankSheet } from './pl04-tank';

// The cartouche of every sheet: they explain, they do not manufacture. The reconstruction itself is said once, in the Sources.
configureDrawings({
  project: { fr: 'CHAUFFE-EAU SOLAIRE — thermosiphon de 300 L', en: 'SOLAR WATER HEATER — a 300 L thermosiphon' },
  disclaimer: { fr: 'Pour comprendre, non pour fabriquer', en: 'For understanding, not for manufacture' },
  date: '2026-11-02',
});

/** Every drawing of the "Plans" mode, in reading order (the numbers of the title blocks). */
export const SHEETS: DrawingSheet[] = [
  arrangementSheet,
  heightsSheet,
  collectorSheet,
  tankSheet,
  schematicSheet,
  fixingSheet,
  loadsSheet,
  budgetSheet,
  assemblySheet,
  bomSheet,
];

/** The groups of the Plans mode, for `plans.groups` in src/lab.ts, in the order that keeps the numbers running: the kit lists the sheets group by group. */
export const SHEET_GROUPS = [
  { id: 'machine', label: l('La machine', 'The machine') },
  { id: 'parts', label: l('Le capteur et le ballon', 'The collector and the tank') },
  { id: 'house', label: l('La machine sur la maison', 'The machine on the house') },
  { id: 'budget', label: l('Le bilan', 'The balance') },
  { id: 'build', label: l('Le montage', 'How it goes together') },
] as const;
