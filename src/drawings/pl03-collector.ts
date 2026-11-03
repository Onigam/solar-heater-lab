import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { nEn, nFr } from '../data/units';
import { CURVE_BLACK, CURVE_SELECTIVE } from '../sim/machine';
import { curveEfficiency } from '../sim/thermal';
import { COLLECTOR, HEADER_R, RISER_R } from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mm, mmL, note, PAPER } from './draw';

// PL-S03: the collector cut across its tubes at 1:1, along them at 1:10, and its certified curve against the selective one. Layers read from dims.ts; the curves from the certificates, through the simulation's own constants.

export const ITEMS = [
  'glass-cover',
  'glass-seal',
  'air-gap',
  'absorber-plate',
  'riser-tube',
  'upper-header',
  'lower-header',
  'back-insulation',
  'collector-tray',
] as const;

function across(d: Drawing): void {
  const v = d.view(26, 116, 1);
  const c = COLLECTOR;
  const w = mm(c.frameWidth + 5 * c.riserPitch);
  v.rect([0, 0], [w, mm(c.trayThickness) + 0.6], { w: W.medium, fill: FILL.steel });
  v.rect([0, 0], [mm(1.4e-3), mm(c.depth)], { w: W.medium, fill: FILL.alu });
  v.rect([1.4, mm(c.trayThickness)], [w, mm(c.blanket)], { w: W.thin, fill: FILL.blanket });
  v.rect([mm(c.frameWidth) - 4, mm(c.glassY)], [w, mm(c.glassY + c.glassThickness)], { w: W.medium, fill: FILL.glass });
  v.rect([1.4, mm(c.glassY) - 1.5], [mm(c.frameWidth) - 4, mm(c.glassY + c.glassThickness) + 1.5], {
    w: W.medium,
    fill: FILL.black,
  });
  const plate = mm(c.waterwayY + RISER_R);
  const pts: [number, number][] = [[mm(c.frameWidth) - 4, plate]];
  for (let i = 0; i < 5; i++) {
    const cx = mm(c.frameWidth + (i + 0.5) * c.riserPitch);
    const r = mm(RISER_R);
    v.circle([cx, mm(c.waterwayY)], r, { w: W.medium, fill: FILL.hot });
    v.circle([cx, mm(c.waterwayY)], mm(c.riserBore / 2), { w: W.thin });
    pts.push([cx - r - 2, plate], [cx - r, plate + 1], [cx + r, plate + 1], [cx + r + 2, plate]);
  }
  pts.push([w, plate]);
  v.polyline(pts, { w: W.thick, color: FILL.black });
  // dimensions
  v.dim([-0.1, 0], [-0.1, mm(c.depth)], -9, { dir: 'v', label: mmL(c.depth, ''), size: 1.9 });
  v.dim([w, mm(c.trayThickness)], [w, mm(c.blanket)], 6, { dir: 'v', label: mmL(c.blanket, ''), size: 1.9 });
  // the glass is too thin for a label between its arrows: it goes beside them
  v.dim([w, mm(c.glassY)], [w, mm(c.glassY + c.glassThickness)], 6, { dir: 'v', label: '', size: 1.9 });
  v.text([w + 8, mm(c.glassY + c.glassThickness / 2)], mmL(c.glassThickness, ''), {
    size: 1.9,
    mono: true,
    baseline: 'middle',
  });
  v.dim([mm(c.frameWidth + 0.5 * c.riserPitch), plate + 3], [mm(c.frameWidth + 1.5 * c.riserPitch), plate + 3], -8, {
    dir: 'h',
    label: fig('riserPitch'),
    size: 1.9,
  });
  v.leader(
    [mm(c.frameWidth + 2.5 * c.riserPitch), mm(c.waterwayY)],
    12,
    22,
    cat(l('tube ', 'tube '), fig('riserBore')),
    { size: 1.8 },
  );
  v.leader([mm(c.frameWidth + 3.6 * c.riserPitch), mm(c.glassY) - 8], 16, -14, l('lame d’air', 'air gap'), {
    size: 1.8,
  });
  v.leader([mm(c.frameWidth + 4.2 * c.riserPitch), plate + 1], 30, -6, l('plaque noire', 'black plate'), { size: 1.8 });
  v.leader([mm(c.frameWidth + 3.2 * c.riserPitch), 18], 60, 8, l('laine de polyester', 'polyester blanket'), {
    size: 1.8,
  });
  v.leader([mm(c.frameWidth + 3.2 * c.riserPitch), 0.3], 50, 2, cat(l('caisson ', 'tray '), mmL(c.trayThickness, '')), {
    size: 1.8,
  });
  v.leader([6, mm(c.glassY)], 6, -9, l('joint', 'seal'), { size: 1.8 });
}

function along(d: Drawing): void {
  const v = d.view(26, 196, 1 / 10);
  const c = COLLECTOR;
  v.rect([0, 0], [mm(c.length), mm(c.depth)], { w: W.medium, fill: FILL.alu });
  v.rect([20, mm(c.trayThickness)], [mm(c.length) - 20, mm(c.blanket)], { w: W.thin, fill: FILL.blanket });
  v.line([mm(c.headerInset), mm(c.waterwayY)], [mm(c.length - c.headerInset), mm(c.waterwayY)], {
    w: W.thick,
    color: COLORS.red,
  });
  for (const s of [c.headerInset, c.length - c.headerInset])
    v.circle([mm(s), mm(c.waterwayY)], mm(HEADER_R), { w: W.medium, fill: FILL.hot });
  v.rect([mm(c.frameWidth), mm(c.glassY)], [mm(c.length - c.frameWidth), mm(c.glassY + c.glassThickness)], {
    w: W.thin,
    fill: FILL.glass,
  });
  v.dim([0, 0], [mm(c.length), 0], 7, { dir: 'h', label: mmL(c.length, ''), size: 1.9 });
  v.leader(
    [mm(c.headerInset), mm(c.waterwayY)],
    22,
    -14,
    cat(l('collecteur bas ', 'lower header '), fig('headerBore')),
    { size: 1.8 },
  );
  v.leader(
    [mm(c.length - c.headerInset), mm(c.waterwayY)],
    -18,
    -14,
    cat(l('collecteur haut ', 'upper header '), fig('headerBore')),
    { size: 1.8 },
  );
}

/** The two certified curves at this irradiance, efficiency against the difference to the air, K. */
export function curves(G = 800): { dT: number; black: number; selective: number }[] {
  const out: { dT: number; black: number; selective: number }[] = [];
  for (let dT = 0; dT <= 90; dT += 5) {
    const x = dT / G;
    out.push({ dT, black: curveEfficiency(CURVE_BLACK, x, G), selective: curveEfficiency(CURVE_SELECTIVE, x, G) });
  }
  return out;
}

function chart(d: Drawing, x: number, y: number, w: number, h: number): void {
  const p = d.paper();
  p.rect([x, y], [x + w, y + h], { w: W.medium, fill: PAPER });
  const X = (dT: number): number => x + (dT / 90) * w;
  const Y = (eta: number): number => y + h - (eta / 0.8) * h;
  for (let e = 0; e <= 8; e += 2) {
    p.line([x, Y(e / 10)], [x + w, Y(e / 10)], { w: W.thin, color: '#d5d2c8' });
    p.text([x - 1.5, Y(e / 10)], l(nFr(e / 10, 1), nEn(e / 10, 1)), {
      size: 1.7,
      anchor: 'end',
      baseline: 'middle',
      mono: true,
    });
  }
  for (let t = 0; t <= 90; t += 30) {
    p.line([X(t), y + h], [X(t), y], { w: W.thin, color: '#d5d2c8' });
    p.text([X(t), y + h + 2], String(t), { size: 1.7, anchor: 'middle', baseline: 'top', mono: true });
  }
  const pts = curves();
  const clip = (a: number): number => Math.max(0, a);
  p.polyline(
    pts.map((c) => [X(c.dT), Y(clip(c.black))]),
    { w: W.thick, color: FILL.black },
  );
  p.polyline(
    pts.map((c) => [X(c.dT), Y(clip(c.selective))]),
    { w: W.thick, color: COLORS.copper },
  );
  p.text([X(33), Y(0.74)], l('noir, ce capteur', 'black, this collector'), { size: 1.8, weight: 'bold' });
  p.text([X(61), Y(0.5)], l('sélectif, le même constructeur', 'selective, the same maker'), {
    size: 1.8,
    color: COLORS.copper,
    weight: 'bold',
  });
  p.text([x + w / 2, y + h + 6], l('Écart à l’air, K, à 800 W/m²', 'Difference to the air, K, at 800 W/m²'), {
    size: 1.9,
    anchor: 'middle',
    baseline: 'top',
    weight: 'bold',
  });
  p.line([X(25), y], [X(25), y + h], { w: W.thin, dash: 'hidden', color: COLORS.red });
  p.text([X(25) - 1, y + 2.5], fig('crossK'), {
    size: 1.9,
    color: COLORS.red,
    anchor: 'end',
    baseline: 'middle',
    weight: 'bold',
  });
}

export const collectorSheet: DrawingSheet = {
  id: 'collector-section',
  number: 'PL-S03',
  group: 'parts',
  title: l('Le capteur en coupe', 'The collector in section'),
  description: lf(
    'En haut à 1:1, le capteur coupé en travers de ses tubes : verre, lame d’air, plaque, tubes, laine, caisson. En bas à 1:10, le même dans le sens de la pente, avec ses deux collecteurs. À droite, sa courbe certifiée face à celle d’un capteur sélectif : le noir gagne jusqu’à {crossK} au-dessus de l’air, à {crossG}. Les diamètres ne sont pas publiés : ce sont nos estimations.',
    'At the top at 1:1, the collector cut across its tubes: glass, air gap, plate, tubes, blanket, tray. Below at 1:10, the same along the slope, with its two headers. On the right, its certified curve against that of a selective collector: black wins up to {crossK} above the air, at {crossG}. The bores are not published: they are our estimates.',
  ),
  scene: 'collector',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le capteur en coupe', 'The collector in section'),
      subtitle: l('En travers à 1:1, le long des tubes à 1:10', 'Across at 1:1, along the tubes at 1:10'),
      number: 'PL-S03',
      scale: '1:1 · 1:10',
    });
    heading(d, 14, 14, cat(l('EN TRAVERS DES TUBES', 'ACROSS THE TUBES'), ' 1:1'));
    across(d);
    heading(d, 14, 145, cat(l('LE LONG DES TUBES', 'ALONG THE TUBES'), ' 1:10'));
    along(d);
    const x = 256;
    let y = 14;
    y = heading(d, x, y, l('LA COURBE DU CAPTEUR', 'THE COLLECTOR’S CURVE'));
    chart(d, x + 6, y + 1, 138, 70);
    y += 84;
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Couche ou chiffre', 'Layer or figure'), w: 92 },
        { label: l('Valeur', 'Value'), w: 56, align: 'end', mono: true },
      ],
      [
        [l('Verre trempé à faible teneur en fer', 'Tempered low-iron glass'), mmL(COLLECTOR.glassThickness, '')],
        [l('Laine de polyester', 'Polyester blanket'), mmL(COLLECTOR.blanket, '')],
        [l('Caisson en aluminium', 'Aluminium tray'), mmL(COLLECTOR.trayThickness, '')],
        [l('Tubes par capteur', 'Tubes per collector'), String(COLLECTOR.risers)],
        [l('Espacement des tubes', 'Tube spacing'), fig('riserPitch')],
        [l('Paroi d’un tube, dessinée', 'A tube’s wall, as drawn'), mmL(COLLECTOR.riserWall, '*')],
        [l('Diamètre des collecteurs, de ses 3,8 L', 'Header bore, from its 3.8 L'), fig('headerBore')],
        [
          l('Courbe : rendement, perte, carré', 'Curve: efficiency, loss, square'),
          l('0,778, 6,541, 0,025', '0.778, 6.541, 0.025'),
        ],
        [
          l('Courbe sélective, pour comparer', 'Selective curve, to compare'),
          l('0,671, 3,592, 0,007', '0.671, 3.592, 0.007'),
        ],
      ],
    );
    y += 3;
    marksLegend(d, x, y, 100);
    note(
      d,
      120,
      146,
      126,
      l(
        'Les 3,8 L du capteur sont la seule donnée publiée sur son eau. Une fois choisis des tubes de 7 mm, ils forcent des collecteurs de 27 mm : c’est un calcul, pas une mesure.',
        'The collector’s 3.8 L is the only published figure on its fluid. Once tubes of 7 mm are chosen, it forces headers of 27 mm: a calculation, not a measurement.',
      ),
    );
    return d;
  },
};
