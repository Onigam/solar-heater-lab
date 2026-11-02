import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { JACKET_OUTER, TANK, TANK_DRUM_HALF, VESSEL_HALF, VESSEL_OUTER } from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, mmL, note } from './draw';

// PL-S04: the tank, cut along its axis and across it. Official and estimated dimensions are told apart by their marks: the maker publishes the case, the wall and the volumes, nobody publishes the vessel's size or the jacket. The ten layers are the model's.

export const ITEMS = [
  'inner-vessel',
  'mantle-jacket',
  'water-column',
  'tank-foam',
  'outer-case',
  'end-cap',
  'sacrificial-anode',
  'booster-element',
  'tank-thermostat',
  'cold-diffuser',
  'hot-outlet',
] as const;

const LAYERS = 10;

function longSection(d: Drawing): void {
  const v = d.view(170, 118, 1 / 8);
  const H = TANK.caseLength / 2;
  v.rect([mm(-TANK_DRUM_HALF), mm(-TANK.caseR)], [mm(TANK_DRUM_HALF), mm(TANK.caseR)], { w: W.thick, fill: FILL.foam });
  for (const s of [-1, 1]) {
    const a = s * TANK_DRUM_HALF;
    const b = s * H;
    v.rect([mm(Math.min(a, b)), mm(-TANK.caseR)], [mm(Math.max(a, b)), mm(TANK.caseR)], {
      w: W.medium,
      fill: FILL.black,
    });
  }
  // jacket, lower half
  v.rect([mm(-VESSEL_HALF), mm(-JACKET_OUTER)], [mm(VESSEL_HALF), 0], { w: W.medium, fill: FILL.hot });
  // vessel and its layers
  v.rect([mm(-VESSEL_HALF), mm(-VESSEL_OUTER)], [mm(VESSEL_HALF), mm(VESSEL_OUTER)], { w: W.thick, fill: FILL.water });
  for (let i = 1; i < LAYERS; i++) {
    const y = -TANK.vesselR + (2 * TANK.vesselR * i) / LAYERS;
    v.line([mm(-VESSEL_HALF), mm(y)], [mm(VESSEL_HALF), mm(y)], { w: W.thin, color: '#7f9aa9', dash: 'hidden' });
  }
  // what is in it
  v.rect(
    [mm(-VESSEL_HALF), mm(TANK.elementY - TANK.elementR)],
    [mm(-VESSEL_HALF + TANK.elementLength), mm(TANK.elementY + TANK.elementR)],
    { w: W.medium, fill: COLORS.copper },
  );
  v.rect(
    [mm(-VESSEL_HALF), mm(TANK.elementY + 0.03 - TANK.pocketR)],
    [mm(-VESSEL_HALF + TANK.pocketLength), mm(TANK.elementY + 0.03 + TANK.pocketR)],
    { w: W.thin, fill: FILL.steel },
  );
  v.rect(
    [mm(VESSEL_HALF - TANK.anodeLength), mm(TANK.anodeY - TANK.anodeR)],
    [mm(VESSEL_HALF), mm(TANK.anodeY + TANK.anodeR)],
    { w: W.medium, fill: FILL.steel },
  );
  v.rect(
    [mm(VESSEL_HALF - TANK.diffuserLength), mm(TANK.diffuserY - TANK.diffuserR)],
    [mm(VESSEL_HALF), mm(TANK.diffuserY + TANK.diffuserR)],
    { w: W.medium, fill: FILL.cold },
  );
  v.line([mm(TANK.hotOutletX), mm(TANK.vesselR - 0.01)], [mm(TANK.hotOutletX), mm(TANK.caseR)], {
    w: W.thick,
    color: COLORS.red,
  });
  v.center([mm(-H - 0.05), 0], [mm(H + 0.05), 0]);
  // dimensions
  v.dim([mm(-H), mm(TANK.caseR)], [mm(H), mm(TANK.caseR)], -6, { dir: 'h', label: mL(TANK.caseLength, '') });
  v.dim([mm(-VESSEL_HALF), mm(-TANK.caseR)], [mm(VESSEL_HALF), mm(-TANK.caseR)], 7, {
    dir: 'h',
    label: fig('vesselLength'),
  });
  v.dim([mm(H), mm(-TANK.caseR)], [mm(H), mm(TANK.caseR)], 8, { dir: 'v', label: mmL(TANK.caseR * 2, '') });
  v.leader([mm(-0.65), mm(TANK.elementY)], -14, 50, cat(l('résistance ', 'element '), mmL(TANK.elementLength, '*')), {
    size: 1.8,
  });
  v.leader([mm(-0.85), mm(TANK.elementY + 0.03)], -4, -44, l('thermostat', 'thermostat'), { size: 1.8 });
  v.leader([mm(0.25), mm(TANK.anodeY)], -18, -34, cat(l('anode ', 'anode '), mmL(TANK.anodeLength, '*')), {
    size: 1.8,
  });
  v.leader([mm(0.72), mm(TANK.diffuserY)], 38, 18, cat(l('diffuseur ', 'diffuser '), mmL(TANK.diffuserLength, '*')), {
    size: 1.8,
  });
  v.leader([mm(TANK.hotOutletX), mm(TANK.caseR)], 16, -14, l('sortie d’eau chaude', 'hot outlet'), { size: 1.8 });
  v.leader([mm(-0.25), mm(-0.232)], 8, 28, l('double enveloppe, moitié basse', 'jacket, lower half'), { size: 1.8 });
  v.leader([mm(-1.02), mm(TANK.caseR - 0.02)], 22, -14, l('mousse de polyuréthane', 'polyurethane foam'), {
    size: 1.8,
  });
}

function crossSection(d: Drawing): void {
  const v = d.view(106, 216, 1 / 5);
  const c: [number, number] = [0, 0];
  v.circle(c, mm(TANK.caseR), { w: W.thick, fill: FILL.foam });
  v.arc(c, mm(JACKET_OUTER), 180, 360, { w: W.medium, fill: FILL.hot });
  v.circle(c, mm(VESSEL_OUTER), { w: W.thick, fill: FILL.water });
  for (let i = 1; i < LAYERS; i++) {
    const y = -TANK.vesselR + (2 * TANK.vesselR * i) / LAYERS;
    const half = Math.sqrt(TANK.vesselR ** 2 - y ** 2);
    v.line([mm(-half), mm(y)], [mm(half), mm(y)], { w: W.thin, color: '#7f9aa9' });
  }
  v.dimDiameter(c, mm(TANK.caseR), 18, { label: mmL(TANK.caseR * 2, '', 'Ø'), size: 1.8 });
  v.leader([mm(-TANK.vesselR * 0.5), mm(TANK.vesselR * 0.6)], -40, -14, cat(l('cuve ', 'vessel '), fig('vesselDia')), {
    size: 1.8,
  });
  v.leader(
    [mm(-(VESSEL_OUTER + TANK.jacketGap / 2) * 0.6), mm(-(VESSEL_OUTER + TANK.jacketGap / 2) * 0.8)],
    -36,
    10,
    cat(l('fente ', 'gap '), fig('jacketGap')),
    { size: 1.8 },
  );
}

export const tankSheet: DrawingSheet = {
  id: 'tank-section',
  number: 'PL-S04',
  group: 'parts',
  title: l('Le ballon en coupe', 'The tank in section'),
  description: lf(
    'En haut, le ballon coupé le long de son axe, ses dix couches en pointillé ; en bas, le même en travers, où l’on voit la double enveloppe sur sa moitié basse. Le constructeur donne l’enveloppe, les volumes et la paroi de la cuve : ils n’ont pas de marque. Personne ne publie le diamètre de la cuve ni la double enveloppe : {vesselDia} et {jacketGap} sont nos estimations.',
    'At the top, the tank cut along its axis, its ten layers dotted; below, the same cut across, showing the jacket on its lower half. The maker gives the case, the volumes and the vessel’s wall: they carry no mark. Nobody publishes the vessel’s diameter or the jacket: {vesselDia} and {jacketGap} are our estimates.',
  ),
  scene: 'tank-and-tap',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le ballon en coupe', 'The tank in section'),
      subtitle: l('Le long de l’axe à 1:8, en travers à 1:5', 'Along the axis at 1:8, across at 1:5'),
      number: 'PL-S04',
      scale: '1:8 · 1:5',
    });
    heading(d, 14, 14, cat(l('LE LONG DE L’AXE', 'ALONG THE AXIS'), ' 1:8'));
    longSection(d);
    heading(d, 14, 158, cat(l('EN TRAVERS', 'ACROSS'), ' 1:5'));
    crossSection(d);
    const x = 228;
    let y = 170;
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Donné par le constructeur', 'Given by the maker'), w: 54 },
        { label: l('Valeur', 'Value'), w: 30, align: 'end', mono: true },
      ],
      [
        [l('Volume', 'Volume'), '300 L'],
        [l('Livraison solaire', 'Solar delivery'), '260 L'],
        [l('Volume d’appoint', 'Boost volume'), '150 L'],
        [l('Paroi de la cuve', 'Vessel’s wall'), mmL(TANK.vesselWall, '')],
        [l('Enveloppe', 'Case'), mmL(TANK.caseWall, '')],
        [l('Pertes à l’arrêt, en 24 h', 'Standing loss, in 24 h'), l('2,595 kWh', '2.595 kWh')],
      ],
    );
    grid(
      d,
      x + 90,
      170,
      [
        { label: l('Estimé ou calculé', 'Estimated or computed'), w: 54 },
        { label: l('Valeur', 'Value'), w: 34, align: 'end', mono: true },
      ],
      [
        [l('Diamètre de la cuve', 'Vessel’s diameter'), fig('vesselDia')],
        [l('Longueur de la cuve', 'Vessel’s length'), fig('vesselLength')],
        [l('Fente de la double enveloppe', 'The jacket’s gap'), fig('jacketGap')],
        [l('Sa surface', 'Its area'), fig('jacketArea')],
        [l('Son volume, par les masses', 'Its volume, by the masses'), fig('jacketL')],
        [l('Son échange', 'Its exchange'), fig('jacketUA')],
        [l('Mousse, sur la double enveloppe', 'Foam, over the jacket'), fig('foamThick')],
      ],
    );
    marksLegend(d, x, y + 3, 84);
    note(
      d,
      x + 90,
      y + 22,
      88,
      lf(
        'Les dix couches sont celles du modèle : {layerEnd} aux bouts, {layerMid} au milieu. Elles se colorent en direct dans le monde du ballon.',
        'The ten layers are the model’s: {layerEnd} at the ends, {layerMid} in the middle. They colour live in the tank’s world.',
      ),
    );
    return d;
  },
};
