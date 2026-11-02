import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { SWEEP_TABLE } from '../data/figures';
import { lf } from '../data/part-helpers';
import { nEn, nFr } from '../data/units';
import { ROOF_UNIT } from '../sim/machine';
import { BANK, COLLECTOR, COS, SIN, TANK } from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mm, note } from './draw';

// PL-S02: the loop's heights, y from −1.22 to +1.83 m, and what the model gives at each. Read by side: the collector stays, the tank moves, the real machine is at zero. The table is SWEEP_TABLE, which figures.test.ts holds against the simulation's pins.

export const ITEMS = ['storage-tank', 'hot-pipe', 'cold-pipe', 'test-stand', 'tank-spacer'] as const;

const signed = (v: number, digits: number, lang: 'fr' | 'en'): string => {
  const s = lang === 'fr' ? nFr(Math.abs(v), digits) : nEn(Math.abs(v), digits);
  return v === 0 ? s : `${v > 0 ? '+' : '−'}${s}`;
};

const HEIGHTS_DRAWN = [1.83, 0.61, 0, -0.61, -1.22] as const;

function loopSide(d: Drawing): void {
  // the side view on an elevation scale: heights true, the tank's places shifted sideways so as to read one by one
  const v = d.view(30, 192, 1 / 25);
  const L = COLLECTOR.length;
  const top = L * SIN + (BANK.standoff + COLLECTOR.depth) * COS;
  // the collector, from its foot
  v.polyline(
    [
      [0, 0],
      [mm(L * COS), mm(L * SIN)],
      [mm(L * COS) - mm(0.05), mm(L * SIN) + mm(0.1)],
      [-mm(0.05), mm(0.1)],
    ],
    {
      w: W.thick,
      closed: true,
      fill: FILL.alu,
    },
  );
  // the level y = 0, and each drawn place
  const xStart = mm(L * COS + 0.2);
  HEIGHTS_DRAWN.forEach((y, i) => {
    const x = xStart + mm(0.55) + i * mm(0.74);
    const bottom = top + y;
    const home = y === 0;
    v.circle([x, mm(bottom + TANK.caseR)], mm(TANK.caseR), {
      w: home ? W.thick : W.medium,
      color: home ? undefined : INK_2,
      fill: home ? FILL.hot : undefined,
      dash: home ? undefined : 'phantom',
    });
    v.line([x, mm(bottom + 2 * TANK.caseR)], [x, mm(bottom + 2 * TANK.caseR + 0.06)], { w: W.thin, color: INK_2 });
    v.text(
      [x, y < 0 ? mm(bottom - 0.14) : mm(bottom + 2 * TANK.caseR + 0.1)],
      l(`${signed(y, 2, 'fr')} m`, `${signed(y, 2, 'en')} m`),
      {
        size: 1.9,
        anchor: 'middle',
        weight: home ? 'bold' : 'normal',
      },
    );
  });
  // the level of the collector's top, and of its middle
  v.line([-mm(0.1), mm(top)], [xStart + mm(4.4), mm(top)], { w: W.medium, color: COLORS.red, dash: 'hidden' });
  v.text([xStart + mm(4.45), mm(top)], l('y = 0', 'y = 0'), {
    size: 2,
    color: COLORS.red,
    baseline: 'middle',
    weight: 'bold',
  });
  const mid = (L * SIN) / 2;
  v.line([-mm(0.1), mm(mid)], [xStart + mm(4.4), mm(mid)], { w: W.thin, color: INK_2, dash: 'center' });
  v.text([xStart + mm(4.45), mm(mid)], l('le milieu du capteur', 'the collector’s middle'), {
    size: 1.75,
    baseline: 'middle',
  });
  v.line([-mm(0.1), 0], [xStart + mm(4.4), 0], { w: W.thin, color: INK_2 });
  v.text([xStart + mm(4.45), 0], l('le pied du capteur', 'the collector’s foot'), { size: 1.75, baseline: 'middle' });
  v.dim([0, 0], [0, mm(L * SIN)], -8, { dir: 'v', label: fig('rise30'), size: 1.8 });
}

export const heightsSheet: DrawingSheet = {
  id: 'loop-heights',
  number: 'PL-S02',
  group: 'machine',
  title: l('Les hauteurs de la boucle', 'The heights of the loop'),
  description: lf(
    'Le capteur reste en place, le ballon change de hauteur : de −1,22 m à +1,83 m, la plage du modèle de 1981. Le tableau donne ce que ce lab calcule à chaque hauteur. Sous zéro, le modèle voit la nuit coûter de plus en plus, jusqu’à ce que le jour lui-même s’arrête. La vraie machine reste à zéro, sur ses cales.',
    'The collector stays put, the tank changes height: from −1.22 m to +1.83 m, the range of the 1981 model. The table gives what this lab computes at each height. Below zero, the model sees the night cost more and more, until the day itself stops. The real machine stays at zero, on its spacers.',
  ),
  scene: 'rig',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Les hauteurs de la boucle', 'The heights of the loop'),
      subtitle: l('Un jour clair de juin, à Athènes', 'A clear June day, at Athens'),
      number: 'PL-S02',
      scale: '1:25',
    });
    heading(
      d,
      14,
      14,
      cat(l('LE CAPTEUR, ET CINQ PLACES DU BALLON', 'THE COLLECTOR, AND FIVE PLACES OF THE TANK'), ' 1:25'),
    );
    loopSide(d);
    const x = 216;
    let y = 14;
    y = heading(d, x, y, l('CE QUE LE MODÈLE TROUVE, HAUTEUR PAR HAUTEUR', 'WHAT THE MODEL FINDS, HEIGHT BY HEIGHT'));
    const r = (v: number, digits: number): ReturnType<typeof l> =>
      l(nFr(v, digits).replace('-', '−'), nEn(v, digits).replace('-', '−'));
    y += grid(
      d,
      x,
      y,
      [
        { label: 'y', w: 15, align: 'end', mono: true },
        { label: l('Pointe, L/h†', 'Peak, L/h†'), w: 22, align: 'end', mono: true },
        { label: l('Nuit, L/h†', 'Night, L/h†'), w: 21, align: 'end', mono: true },
        { label: l('Jour, kWh†', 'Day, kWh†'), w: 21, align: 'end', mono: true },
        { label: l('Perdu au matin, %†', 'Lost by morning, %†'), w: 28, align: 'end', mono: true },
        { label: l('Soit, kWh†', 'So, kWh†'), w: 19, align: 'end', mono: true },
        { label: l('Peau, kWh†', 'Skin, kWh†'), w: 21, align: 'end', mono: true },
        { label: l('1981, %', '1981, %'), w: 20, align: 'end', mono: true },
      ],
      SWEEP_TABLE.map((row) => [
        { t: l(signed(row.y, 2, 'fr'), signed(row.y, 2, 'en')), bold: row.y === 0 },
        r(row.peak, 0),
        r(row.night, 1),
        r(row.gain, 2),
        r(row.lost, 1),
        r(row.kwh, 2),
        r(row.skin, 2),
        row.lbl ?? '',
      ]),
    );
    y += 3;
    y = note(
      d,
      x,
      y,
      186,
      lf(
        'Colonne « 1981 » : la part perdue selon le seul modèle publié qui balaie cette hauteur, lue à l’œil sur sa figure, pour un ballon debout de 1,52 m et sans ciel de nuit : c’est un autre calcul, sur une autre machine. Le modèle de ce lab passe 5 % vers y = 0 et 10 % vers {y10pct}. Sans son terme de ciel de nuit, il trouverait {noSky0} à zéro et {noSkyM03} à −0,30 m : la vérité est entre les deux, et personne n’a mesuré un capteur plan sous cette ligne.',
        'The “1981” column: the share lost according to the only published model that sweeps this height, read by eye from its figure, for an upright tank 1.52 m tall and with no night sky: another calculation, on another machine. This lab’s model passes 5% near y = 0 and 10% near {y10pct}. Without its night-sky term, it would find {noSky0} at zero and {noSkyM03} at −0.30 m: the truth lies between, and nobody has measured a flat collector below this line.',
      ),
    );
    y = note(
      d,
      x,
      y,
      186,
      lf(
        'À 30° de pente, le milieu du capteur et le bas de la double enveloppe se rejoignent vers {cliffY} : plus bas, le fluide ne monte plus, et le jour s’arrête. L’année à Athènes, à 200 L/jour : {yearM122} à −1,22 m, {yearM061} à −0,61 m, {yearM03} à −0,30 m, {yearAthens} à zéro, {yearP03} à +0,30 m.',
        'At a 30° pitch, the collector’s middle and the jacket’s base meet near {cliffY}: lower down, the fluid no longer climbs, and the day stops. The year at Athens, at 200 L a day: {yearM122} at −1.22 m, {yearM061} at −0.61 m, {yearM03} at −0.30 m, {yearAthens} at zero, {yearP03} at +0.30 m.',
      ),
    );
    marksLegend(d, x, y + 1, 100);
    grid(
      d,
      14,
      214,
      [
        { label: l('Place de la vraie machine', 'The real machine’s place'), w: 66 },
        { label: l('Valeur', 'Value'), w: 44, align: 'end', mono: true },
      ],
      [
        [l('Selon les plans du constructeur', 'By the maker’s drawings'), lf('0, à {yBand} près', '0, within {yBand}')],
        [l('Sur ce dessin', 'In this drawing'), fig('drawnY')],
        [
          l('Le curseur du lab, en bas et en haut', 'The lab’s slider, bottom and top'),
          l(
            `${signed(ROOF_UNIT.tankHeightMin, 2, 'fr')} m, ${signed(ROOF_UNIT.tankHeightMax, 2, 'fr')} m`,
            `${signed(ROOF_UNIT.tankHeightMin, 2, 'en')} m, ${signed(ROOF_UNIT.tankHeightMax, 2, 'en')} m`,
          ),
        ],
      ],
    );
    return d;
  },
};
