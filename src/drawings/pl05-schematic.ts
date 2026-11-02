import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { box, cat, fig, FILL, heading, marksLegend, note } from './draw';

// PL-S05: the hydraulic diagram, not to scale: the closed circuit above, the drinking water below, the valves in the maker's order, each with its setting. Nothing here is drawn from a dimension: its numbers are the maker's, or marked.

export const ITEMS = [
  'trio-valve',
  'cold-relief-valve',
  'tpr-valve',
  'jacket-relief-valve',
  'mantle-jacket',
  'inner-vessel',
  'tempering-valve',
  'shower-head',
  'hot-outlet',
  'cold-diffuser',
] as const;

export const schematicSheet: DrawingSheet = {
  id: 'hydraulic-schematic',
  number: 'PL-S05',
  group: 'parts',
  title: l('Le schéma hydraulique', 'The hydraulic diagram'),
  description: lf(
    'Deux liquides, une seule paroi d’acier. En rouge et bleu, le circuit fermé : du capteur à la double enveloppe, et retour, sans pompe. En gris, l’eau que l’on boit : du réseau à la douche, en passant par les vannes dans l’ordre du constructeur. Il n’y a pas d’échelle ici : ce schéma dit qui est relié à quoi, et à quelle pression.',
    'Two liquids, a single steel wall. In red and blue, the closed circuit: from the collector to the jacket and back, with no pump. In grey, the water you drink: from the mains to the shower, through the valves in the maker’s order. There is no scale here: this diagram says what is joined to what, and at what pressure.',
  ),
  scene: 'tank-and-tap',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le schéma hydraulique', 'The hydraulic diagram'),
      subtitle: l('Le circuit fermé et l’eau potable', 'The closed circuit and the drinking water'),
      number: 'PL-S05',
      scale: '—',
    });
    const p = d.paper();
    const red = { w: W.thick, color: COLORS.red };
    const blue = { w: W.thick, color: COLORS.water };
    const ink = { w: W.thick, color: '#5b6878' };
    heading(d, 14, 14, l('LE CIRCUIT FERMÉ : 19 L, SANS POMPE', 'THE CLOSED CIRCUIT: 19 L, WITH NO PUMP'));
    box(d, 30, 62, 62, 44, l('Deux capteurs', 'Two collectors'), { fill: FILL.glass, sub: fig('apertureAll') });
    box(d, 170, 28, 96, 34, l('Double enveloppe', 'Jacket'), { fill: FILL.hot, sub: fig('jacketL') });
    box(d, 170, 62, 96, 44, l('Cuve émaillée : 300 L', 'Enamelled vessel: 300 L'), {
      fill: FILL.water,
      sub: l('1 000 kPa', '1,000 kPa'),
    });
    p.polyline(
      [
        [61, 62],
        [61, 38],
        [120, 38],
        [170, 38],
      ],
      red,
    );
    p.polyline(
      [
        [170, 54],
        [130, 54],
        [130, 118],
        [61, 118],
        [61, 106],
      ],
      blue,
    );
    p.text([90, 34], l('tuyau chaud', 'hot pipe'), { size: 2, weight: 'bold', color: COLORS.red, anchor: 'middle' });
    p.text([96, 123], l('tuyau froid', 'cold pipe'), {
      size: 2,
      weight: 'bold',
      color: COLORS.water,
      anchor: 'middle',
    });
    box(d, 104, 26, 24, 9, cat(l('vanne ', 'valve '), fig('overheatSet')), { size: 1.6 });
    p.text([116, 24], l('option, place estimée', 'option, place estimated'), { size: 1.6, anchor: 'middle' });
    box(d, 200, 14, 26, 9, l('vase, volume non publié', 'reservoir, volume not published'), { size: 1.5 });
    p.line([213, 23], [213, 28], { w: W.medium });
    box(d, 276, 34, 52, 16, l('Soupape du circuit', 'Jacket relief'), { sub: l('80 ou 200 kPa', '80 or 200 kPa') });
    p.line([266, 42], [276, 42], { w: W.medium });
    p.line([328, 42], [340, 42], { w: W.medium });
    p.text([342, 42], l('évacuation à l’air libre', 'drain, in the open'), { size: 1.75, baseline: 'middle' });
    box(d, 18, 106, 20, 8, l('Remplissage', 'Fill'), { size: 1.6 });
    box(d, 84, 54, 16, 8, l('Bouchon', 'Plug'), { size: 1.6 });
    note(
      d,
      276,
      64,
      126,
      lf(
        'Le jour, la poussée vaut {pushPa} à midi d’après le modèle, soit {pushMm} d’eau, et le fluide tourne dans ce sens. La nuit, sur une machine à sa place, il repart lentement à l’envers, {nightFlow}. Le clapet anti-retour, en option dans la Simulation, se dessine sur le tuyau froid.',
        'By day, the push is {pushPa} at noon by the model, or {pushMm} of water, and the fluid runs this way. At night, on a machine in its place, it slowly runs backward, {nightFlow}. The one-way valve, an option in the Simulation, is drawn on the cold pipe.',
      ),
      { size: 2 },
    );
    heading(d, 14, 134, l('L’EAU QUE L’ON BOIT : À LA PRESSION DU RÉSEAU', 'THE WATER YOU DRINK: AT MAINS PRESSURE'));
    const row = 176;
    const cells: [number, number, ReturnType<typeof l>, ReturnType<typeof l>][] = [
      [14, 36, l('Réseau', 'Mains'), l('680 ou 800 kPa', '680 or 800 kPa')],
      [58, 30, l('Vanne d’arrêt', 'Isolating valve'), l('d’abord', 'first')],
      [96, 30, l('Clapet', 'Non-return'), l('ensuite', 'next')],
      [134, 36, l('Soupape d’eau froide', 'Cold relief'), l('850 kPa', '850 kPa')],
    ];
    for (const [x, w, t, s] of cells) box(d, x, row - 11, w, 22, t, { sub: s, size: 1.8 });
    p.line([50, row], [58, row], ink);
    p.line([88, row], [96, row], ink);
    p.line([126, row], [134, row], ink);
    p.polyline(
      [
        [170, row],
        [200, row],
        [200, 106],
      ],
      ink,
    );
    p.text([185, row - 3], l('par le bas', 'from below'), { size: 1.7, anchor: 'middle' });
    p.line([152, row + 11], [152, row + 22], { w: W.medium });
    p.text([152, row + 26], cat(l('la dilatation : ', 'expansion: '), fig('expansionL')), {
      size: 1.75,
      anchor: 'middle',
    });
    p.line([58, row + 28], [152, row + 28], { w: W.thin });
    p.text([75, row + 24], l('au moins 1 m', 'at least 1 m'), { size: 1.7, anchor: 'middle' });
    box(d, 224, 112, 44, 16, l('Soupape du ballon', 'Tank’s relief'), {
      sub: l('99 °C, 1 000 kPa', '99 °C, 1,000 kPa'),
      size: 1.8,
    });
    p.line([246, 106], [246, 112], { w: W.medium });
    p.line([268, 120], [280, 120], { w: W.medium });
    p.text([282, 120], l('évacuation à l’air libre', 'drain, in the open'), { size: 1.75, baseline: 'middle' });
    box(d, 230, row - 11, 52, 22, l('Mitigeur thermostatique', 'Tempering valve'), {
      sub: l('50 °C au plus', '50 °C at most'),
      size: 1.8,
    });
    box(d, 306, row - 11, 44, 22, l('Douche', 'Shower'), { sub: l('40 °C', '40 °C'), fill: FILL.water, size: 1.8 });
    p.polyline(
      [
        [215, 106],
        [215, row],
        [230, row],
      ],
      red,
    );
    p.text([218, row - 18], l('par le haut', 'from the top'), { size: 1.7 });
    p.line([282, row], [306, row], ink);
    note(
      d,
      14,
      214,
      210,
      l(
        'Le clapet empêche l’eau du ballon de repartir vers la rue. La cuve et la double enveloppe partagent une seule paroi : de l’eau bleue au robinet veut dire une fuite de glycol. Le clapet de cette ligne n’est pas le clapet facultatif du circuit fermé : ce sont deux pièces différentes.',
        'The non-return keeps the tank’s water from going back to the street. The vessel and the jacket share a single wall: blue water at the tap means a glycol leak. The non-return on this line is not the optional valve on the closed circuit: those are two different parts.',
      ),
      { size: 2 },
    );
    marksLegend(d, 300, 206, 100);
    return d;
  },
};
