// The parts of the lab, the list of `docs/research.md` §4: the id of each, its world and its name. The registry of each world uses these ids and no other; `src/data/parts.ts` is to give each a sheet.
// Fifty-one. The names are the research's, for the labels; the sheets stay the author's.

export interface PartName {
  id: string;
  world: 'house' | 'rig' | 'collector' | 'tank-and-tap';
  fr: string;
  en: string;
}

const row = (world: PartName['world'], list: [string, string, string][]): PartName[] =>
  list.map(([id, fr, en]) => ({ id, world, fr, en }));

export const PART_NAMES: PartName[] = [
  ...row('house', [
    ['roof-unit', 'Le chauffe-eau sur le toit', 'The roof unit'],
    ['roof-structure', 'Chevrons et liteaux', 'Rafters and battens'],
    ['roof-tiles', 'Tuiles', 'Roof tiles'],
    ['roof-penetration', 'Traversée de toit', 'Roof penetration'],
    ['load-bearing-wall', 'Mur porteur', 'Load-bearing wall'],
    ['cold-main', 'Arrivée d’eau froide', 'Cold water main'],
    ['hot-line', 'Conduite d’eau chaude', 'Hot water line'],
    ['drain-outlet', 'Évacuation des soupapes', 'Relief drain outlet'],
    ['meter-box', 'Tableau et interrupteur', 'Meter box and isolator'],
    ['shade-tree', 'L’olivier', 'The olive tree'],
  ]),
  ...row('rig', [
    ['collector-left', 'Capteur de gauche', 'Left collector'],
    ['collector-right', 'Capteur de droite', 'Right collector'],
    ['collector-link', 'Raccord entre capteurs', 'Collector connector'],
    ['storage-tank', 'Le ballon', 'The storage tank'],
    ['hot-pipe', 'Tuyau chaud', 'Hot pipe'],
    ['cold-pipe', 'Tuyau froid', 'Cold pipe'],
    ['collector-rail', 'Rail de pied', 'Collector rail'],
    ['collector-strap', 'Feuillard de capteur', 'Collector strap'],
    ['tank-spacer', 'Cale capteur-ballon', 'Tank-to-collector spacer'],
    ['tank-strap', 'Feuillard du ballon', 'Tank strap'],
    ['fill-port', 'Remplissage', 'Fill assembly'],
    ['top-plug', 'Bouchon haut', 'Collector plug'],
    ['overheat-valve', 'Vanne anti-surchauffe', 'Overheat valve'],
    ['overflow-reservoir', 'Vase du circuit', 'Circuit reservoir'],
    ['test-stand', 'Banc d’essai', 'Test stand'],
  ]),
  ...row('collector', [
    ['glass-cover', 'Vitrage', 'Glass cover'],
    ['glass-seal', 'Joint de vitrage', 'Glass seal'],
    ['air-gap', 'Lame d’air', 'Air gap'],
    ['absorber-plate', 'Absorbeur', 'Absorber plate'],
    ['riser-tube', 'Tube montant', 'Riser tube'],
    ['upper-header', 'Collecteur haut', 'Upper header'],
    ['lower-header', 'Collecteur bas', 'Lower header'],
    ['back-insulation', 'Isolant arrière', 'Back insulation'],
    ['collector-tray', 'Caisson', 'Tray'],
  ]),
  ...row('tank-and-tap', [
    ['inner-vessel', 'Cuve émaillée', 'Enamelled vessel'],
    ['mantle-jacket', 'Double enveloppe', 'Heat-exchange jacket'],
    ['water-column', 'La colonne d’eau', 'The water column'],
    ['tank-foam', 'Mousse isolante', 'Insulating foam'],
    ['outer-case', 'Enveloppe aluminium', 'Aluminium case'],
    ['end-cap', 'Flasque', 'End cap'],
    ['sacrificial-anode', 'Anode', 'Sacrificial anode'],
    ['booster-element', 'Résistance d’appoint', 'Booster element'],
    ['tank-thermostat', 'Thermostat', 'Thermostat'],
    ['tpr-valve', 'Soupape température-pression', 'Temperature and pressure relief valve'],
    ['jacket-relief-valve', 'Soupape du circuit', 'Jacket relief valve'],
    ['cold-diffuser', 'Diffuseur d’eau froide', 'Cold water diffuser'],
    ['hot-outlet', 'Sortie d’eau chaude', 'Hot outlet'],
    ['trio-valve', 'Clapet et robinet d’arrêt', 'Isolating and non-return valve'],
    ['cold-relief-valve', 'Soupape d’eau froide', 'Cold relief valve'],
    ['tempering-valve', 'Mitigeur thermostatique', 'Tempering valve'],
    ['shower-head', 'La douche', 'The shower'],
  ]),
];

const BY_ID = new Map(PART_NAMES.map((p) => [p.id, p]));

/** The two names of a part, for a hotspot. */
export function partName(id: string): { fr: string; en: string } {
  const p = BY_ID.get(id);
  if (!p) throw new Error(`unknown part ${id}`);
  return { fr: p.fr, en: p.en };
}
