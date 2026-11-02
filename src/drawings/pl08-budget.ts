import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { FIG, YEAR_TABLE, type FigName } from '../data/figures';
import { lf } from '../data/part-helpers';
import { nEn, nFr } from '../data/units';
import { fig, FILL, grid, heading, marksLegend, note } from './draw';

// PL-S08: a year of the model, as bands from the sun to the tap, Athens above and Stockholm below, then the published table beside the model's. Bands are read from FIG, and figures.test.ts holds them against yearRun.

export const ITEMS = ['roof-unit', 'hot-line', 'meter-box'] as const;

const SITE_NAMES: Record<string, L> = {
  stockholm: l('Stockholm', 'Stockholm'),
  wurzburg: l('Wurtzbourg', 'Würzburg'),
  davos: l('Davos', 'Davos'),
  athens: l('Athènes', 'Athens'),
};

interface Stage {
  from: FigName;
  lost: FigName;
  name: L;
}

function sankey(
  d: Drawing,
  x: number,
  y0: number,
  title: L,
  scale: number,
  stages: Stage[],
  end: FigName,
  endName: L,
): void {
  const p = d.paper();
  p.text([x, y0 - 12], title, { size: 2.2, weight: 'bold', baseline: 'top' });
  const stepX = 53;
  let top = y0;
  let h = FIG[stages[0]!.from].v * scale;
  p.text([x, top + h / 2], fig(stages[0]!.from), {
    size: 1.9,
    mono: true,
    weight: 'bold',
    baseline: 'middle',
    color: COLORS.red,
  });
  const x0 = x + 22;
  stages.forEach((s, i) => {
    const xa = x0 + i * stepX;
    const lostW = FIG[s.lost].v;
    const lossH = lostW * scale;
    p.polyline(
      [
        [xa, top],
        [xa + stepX, top + lossH],
        [xa + stepX, top + h],
        [xa, top + h],
      ],
      { w: W.thin, closed: true, fill: FILL.cold, color: INK_2 },
    );
    p.polyline(
      [
        [xa, top],
        [xa + stepX, top + lossH],
        [xa + stepX * 0.5, top - 3],
      ],
      { w: W.thin, closed: true, fill: FILL.hot, color: INK_2 },
    );
    p.text([xa + stepX * 0.5, top - 5.5], fig(s.lost), {
      size: 1.75,
      mono: true,
      anchor: 'middle',
      baseline: 'middle',
    });
    p.text([xa + stepX * 0.5, top - 9], s.name, { size: 1.7, anchor: 'middle', baseline: 'middle' });
    top += lossH;
    h -= lossH;
  });
  const xe = x0 + stages.length * stepX + 2;
  p.text([xe, top + h / 2 - 2], fig(end), {
    size: 1.9,
    mono: true,
    weight: 'bold',
    baseline: 'middle',
    color: COLORS.red,
  });
  p.text([xe, top + h / 2 + 2], endName, { size: 1.7, baseline: 'middle' });
}

const STAGES = (sun: FigName, c: FigName, pipe: FigName, tank: FigName, optics: FigName): Stage[] => [
  { from: sun, lost: optics, name: l('Le verre et la plaque', 'The glass and the plate') },
  { from: sun, lost: c, name: l('Le capteur, vers l’air', 'The collector, to the air') },
  { from: sun, lost: pipe, name: l('Les tuyaux', 'The pipes') },
  { from: sun, lost: tank, name: l('La peau du ballon', 'The tank’s skin') },
];

export const budgetSheet: DrawingSheet = {
  id: 'heat-budget',
  number: 'PL-S08',
  group: 'budget',
  title: l('Le bilan de chaleur', 'The heat balance'),
  description: lf(
    'En haut, une année du modèle, du soleil au robinet, à 200 L/jour : à Athènes, {yDelivered} arrivent à l’eau du robinet sur {ySun} de soleil, à Stockholm {sDelivered} sur {sSun}. En bas, les résultats publiés à côté de ceux du modèle, par lieu et par tirage. Les bandes sont le modèle ; le tableau publié est un essai plus un calcul, pas une année mesurée sur un toit.',
    'At the top, a year of the model, from the sun to the tap, at 200 L a day: at Athens, {yDelivered} reach the tap’s water out of {ySun} of sun, at Stockholm {sDelivered} out of {sSun}. Below, the published results beside the model’s, by place and by draw. The bands are the model; the published table is a test plus a calculation, not a year measured on a roof.',
  ),
  scene: 'house',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le bilan de chaleur', 'The heat balance'),
      subtitle: l('Une année, du soleil au robinet', 'A year, from the sun to the tap'),
      number: 'PL-S08',
      scale: '—',
    });
    heading(d, 14, 14, l('UNE ANNÉE DU MODÈLE, À 200 L/JOUR', 'A YEAR OF THE MODEL, AT 200 L A DAY'));
    const scale = 0.0062;
    sankey(
      d,
      14,
      42,
      l('Athènes', 'Athens'),
      scale,
      STAGES('ySun', 'yCollectorLoss', 'yPipeLoss', 'yTankLoss', 'yOptics'),
      'yDelivered',
      l('à l’eau du robinet', 'to the tap’s water'),
    );
    sankey(
      d,
      14,
      112,
      l('Stockholm', 'Stockholm'),
      scale,
      STAGES('sSun', 'sCollectorLoss', 'sPipeLoss', 'sTankLoss', 'sOptics'),
      'sDelivered',
      l('à l’eau du robinet', 'to the tap’s water'),
    );
    note(
      d,
      252,
      24,
      150,
      lf(
        'Le plus gros de la perte part vers l’air depuis le capteur, parce qu’il travaille plus chaud que lui. Le verre et la plaque en prennent une autre grosse part dès l’entrée. Le reste de la demande, {yBackup} à Athènes et {sBackup} à Stockholm, revient à l’appoint, compté hors de ces bandes.',
        'Most of the loss goes to the air from the collector, since it runs warmer than the air. The glass and the plate take another large share right at the entrance. The rest of the demand, {yBackup} at Athens and {sBackup} at Stockholm, falls to the booster, counted outside these bands.',
      ),
      { size: 2 },
    );
    marksLegend(d, 252, 60, 110);
    const y = 158;
    heading(d, 14, y, l('LES ANNÉES PUBLIÉES, ET CELLES DU MODÈLE (MJ)', 'THE PUBLISHED YEARS, AND THE MODEL’S (MJ)'));
    const draws = ['200', '250', '300', '400'];
    const n = (v: number, digits = 0): L => l(nFr(v, digits), nEn(v, digits));
    grid(
      d,
      14,
      y + 6,
      [
        { label: l('Lieu', 'Place'), w: 28 },
        ...draws.flatMap((dr) => [
          { label: l(`${dr} L/j, publié`, `${dr} L/d, published`), w: 21, align: 'end' as const, mono: true },
          { label: l(`part, %`, `share, %`), w: 12, align: 'end' as const, mono: true },
          { label: l('modèle†', 'model†'), w: 15, align: 'end' as const, mono: true },
        ]),
      ],
      YEAR_TABLE.map((row) => [
        { t: SITE_NAMES[row.site]!, bold: true },
        ...row.rows.flatMap(([ql, f, model]) => [n(ql), n(f, 1), n(model)]),
      ]),
      { size: 1.65 },
    );
    note(
      d,
      14,
      204,
      212,
      lf(
        'Le modèle suit le tableau publié de {yearSpreadLow} à {yearSpreadHigh} sans qu’aucun réglage ne vise ces chiffres : Davos est le plus éloigné, car son climat diffère le plus entre les deux sources. Un accord ne prouve pas grand-chose : les deux côtés reposent sur la même courbe de capteur et la même année de soleil. À Davos, le chiffre ne dit pas que la machine y tient.',
        'The model follows the published table within {yearSpreadLow} to {yearSpreadHigh}, with no setting aimed at those figures: Davos is the furthest, since its climate differs most between the two sources. An agreement proves little: both sides rest on the same collector curve and the same year of sun. At Davos, the figure does not say the machine survives there.',
      ),
      { size: 2 },
    );
    return d;
  },
};
