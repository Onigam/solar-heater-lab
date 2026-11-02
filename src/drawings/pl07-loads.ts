import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { nEn, nFr } from '../data/units';
import { ROOF_UNIT } from '../sim/machine';
import { fig, FILL, grid, heading, marksLegend, note } from './draw';

// PL-S07: the weights, the chain of pressures and the ladder of temperatures. Bars and rungs are drawn from the listed values, so that a bar cannot disagree with its label.

export const ITEMS = ['roof-structure', 'load-bearing-wall', 'roof-unit', 'cold-main', 'drain-outlet'] as const;

/** The chain of pressures, kPa: the maker's (reported). */
export const PRESSURES: readonly { kpa: number; name: L }[] = [
  { kpa: 80, name: l('Soupape du circuit', 'Jacket relief') },
  { kpa: 200, name: l('La même, avec la vanne de surchauffe', 'The same, with the overheat valve') },
  { kpa: 680, name: l('Réseau, avec soupape d’eau froide', 'Mains, with a cold relief') },
  { kpa: 800, name: l('Réseau, sans elle', 'Mains, without it') },
  { kpa: 850, name: l('Soupape d’eau froide', 'Cold relief') },
  { kpa: 1000, name: l('Soupape du ballon', 'Tank’s relief') },
];

/** The ladder of temperatures, °C: what each one means. */
export const TEMPERATURES: readonly { t: number; v: L; name: L; hot?: boolean }[] = [
  {
    t: 25,
    v: l('25 °C', '25 °C'),
    name: l('Les légionelles se multiplient, de 25 °C…', 'Legionella multiply, from 25 °C…'),
  },
  { t: 45, v: l('45 °C', '45 °C'), name: l('… à 45 °C', '… to 45 °C') },
  { t: 50, v: l('50 °C', '50 °C'), name: l('Au robinet, au plus', 'At the tap, at most') },
  { t: 60, v: l('60 °C', '60 °C'), name: l('Thermostat ; une brûlure en 2 à 5 s', 'Thermostat; a scald in 2 to 5 s') },
  { t: 70, v: l('70 °C', '70 °C'), name: l('Thermostat, au plus', 'Thermostat, at most') },
  { t: 83, v: l('83 °C', '83 °C'), name: l('Coupure de l’appoint', 'The booster’s cut-out') },
  { t: 85, v: fig('overheatSet'), name: l('Vanne de surchauffe, non publiée', 'Overheat valve, not published') },
  { t: 95, v: l('95 °C', '95 °C'), name: l('Ce que le ballon peut atteindre', 'What the tank may reach') },
  { t: 99, v: l('99 °C', '99 °C'), name: l('Soupape du ballon', 'Tank’s relief'), hot: true },
  { t: 109, v: l('109 °C', '109 °C'), name: l('Mesuré sur un autre ballon', 'Measured on another tank') },
  {
    t: 119,
    v: fig('blackStag'),
    name: l('Plafond de cette plaque noire, fragile', 'This black plate’s ceiling, shaky'),
  },
];

function pressures(d: Drawing, x: number, y0: number): number {
  const p = d.paper();
  const maxW = 100;
  let y = y0;
  for (const row of PRESSURES) {
    const w = (row.kpa / 1000) * maxW;
    p.rect([x, y], [x + w, y + 5], { w: W.thin, fill: row.kpa >= 680 ? FILL.cold : FILL.hot });
    p.text([x + maxW + 4, y + 2.5], l(`${nFr(row.kpa)} kPa`, `${nEn(row.kpa)} kPa`), {
      size: 1.9,
      mono: true,
      baseline: 'middle',
      weight: 'bold',
    });
    p.text([x + maxW + 22, y + 2.5], row.name, { size: 1.85, baseline: 'middle' });
    y += 7;
  }
  return y;
}

function ladder(d: Drawing, x: number, y0: number): void {
  const p = d.paper();
  const Y = (t: number): number => y0 + (130 - t);
  p.line([x, Y(125)], [x, Y(20)], { w: W.medium });
  // hottest first: a label moves down when the one above it is too close, and a thin line ties it to its rung
  let next = -Infinity;
  for (const r of [...TEMPERATURES].sort((a, b) => b.t - a.t)) {
    const yy = Math.max(Y(r.t), next);
    next = yy + 6;
    p.line([x - 2, Y(r.t)], [x + 2, Y(r.t)], { w: W.medium });
    p.line([x + 2, Y(r.t)], [x + 6, yy], { w: W.thin, color: INK_2 });
    p.text([x + 7, yy], r.v, {
      size: 1.9,
      mono: true,
      baseline: 'middle',
      weight: 'bold',
      color: r.hot ? COLORS.red : undefined,
    });
    p.text([x + 23, yy], r.name, { size: 1.85, baseline: 'middle' });
  }
}

export const loadsSheet: DrawingSheet = {
  id: 'loads-and-pressures',
  number: 'PL-S07',
  group: 'house',
  title: l('Les charges et les pressions', 'The loads and the pressures'),
  description: lf(
    'Trois échelles pour une seule machine : ce qu’elle pèse sur le toit, la chaîne des pressions du circuit jusqu’à la soupape du ballon, et ce que chaque température veut dire. La charge moyenne de {loadArea} trompe : le ballon fait {loadLine} sur une seule ligne. Et il y a dix fois plus de pression côté eau potable que côté circuit.',
    'Three scales for one machine: what it weighs on the roof, the chain of pressures from the circuit to the tank’s relief, and what each temperature means. The average load of {loadArea} misleads: the tank makes {loadLine} on a single line. And there is ten times the pressure on the drinking-water side as on the circuit’s.',
  ),
  scene: 'house',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Les charges et les pressions', 'The loads and the pressures'),
      subtitle: l('Masses, pressions, températures', 'Masses, pressures, temperatures'),
      number: 'PL-S07',
      scale: '—',
    });
    let y = 14;
    y = heading(d, 14, y, l('LES MASSES ET CE QU’ELLES FONT SUR LE TOIT', 'THE MASSES AND WHAT THEY DO TO THE ROOF'));
    const kg = (v: number): string => `${v} kg`;
    y += grid(
      d,
      14,
      y,
      [
        { label: l('Quoi', 'What'), w: 84 },
        { label: l('À vide', 'Empty'), w: 30, align: 'end', mono: true },
        { label: l('En charge', 'Full'), w: 30, align: 'end', mono: true },
      ],
      [
        [
          l('La machine, raccords compris', 'The machine, fittings included'),
          kg(ROOF_UNIT.massEmpty),
          kg(ROOF_UNIT.massFull),
        ],
        [l('Le ballon', 'The tank'), kg(ROOF_UNIT.tankEmpty), kg(ROOF_UNIT.tankFull)],
        [l('Un capteur', 'One collector'), kg(ROOF_UNIT.collectorEmpty), kg(ROOF_UNIT.collectorFull)],
        [l('Moyenne sur 2,43 × 2,49 m', 'Average over 2.43 × 2.49 m'), '', fig('loadArea')],
        [l('Sous le ballon, sur 2,43 m', 'Under the tank, along 2.43 m'), '', fig('loadLine')],
        [
          l('Limites d’essai : vent, neige', 'Test limits: wind, snow'),
          l('56,6 m/s', '56.6 m/s'),
          l('2 kN/m²', '2 kN/m²'),
        ],
      ],
    );
    y += 6;
    y = heading(d, 14, y, l('LA CHAÎNE DES PRESSIONS', 'THE CHAIN OF PRESSURES'));
    y = pressures(d, 14, y);
    y += 2;
    y = note(
      d,
      14,
      y,
      205,
      lf(
        'Le circuit et la cuve ne se voient qu’à travers une paroi d’acier. Un ballon de 300 L qui passe de 10 à 80 °C pousse {expansionL} vers la soupape d’eau froide : voilà pourquoi celle-ci goutte normalement, et pourquoi le réseau ne doit pas être réglé trop près de ses 850 kPa. Le constructeur demande de le consulter sous −15 °C, ou avec une neige qui reste plus de 24 h.',
        'The circuit and the vessel only meet through a steel wall. A 300 L tank going from 10 to 80 °C pushes {expansionL} to the cold relief: that is why it normally drips, and why the mains must not be set too near its 850 kPa. The maker asks to be consulted below −15 °C, or with snow lying more than 24 h.',
      ),
      { size: 2 },
    );
    marksLegend(d, 14, y + 2, 100);
    heading(d, 244, 14, l('CE QUE VEUT DIRE CHAQUE TEMPÉRATURE', 'WHAT EACH TEMPERATURE MEANS'));
    ladder(d, 250, 24);
    return d;
  },
};
