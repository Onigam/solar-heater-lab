import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import { ROOF_UNIT } from '../sim/machine';
import { BANK, BANK_WIDTH, COLLECTOR, COLLECTOR_X, PIPE, RAIL, SPACER, SPACER_XS, TANK, TILT_DEG } from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, mmL, note, roofP } from './draw';

// PL-S01: the machine as its maker's sheet draws it, from above and from the side, and the machine's own outline. Every length is read from dims.ts.

export const ITEMS = [
  'collector-left',
  'collector-right',
  'collector-link',
  'storage-tank',
  'hot-pipe',
  'cold-pipe',
  'collector-rail',
  'tank-spacer',
  'tank-strap',
  'fill-port',
  'top-plug',
] as const;

/** The machine from above: X across, s up the slope, model millimetres. */
export function drawPlan(d: Drawing, x: number, y: number, scale: number): void {
  const v = d.view(x, y, scale);
  const L = COLLECTOR.length;
  const W2 = COLLECTOR.width / 2;
  // rail
  v.rect([mm(-RAIL.halfLength), mm(-0.02)], [mm(RAIL.halfLength), mm(0.03)], { w: W.medium, fill: FILL.steel });
  for (const cx of [COLLECTOR_X.left, COLLECTOR_X.right]) {
    v.rect([mm(cx - W2), 0], [mm(cx + W2), mm(L)], { w: W.thick, fill: FILL.alu });
    const A = COLLECTOR.frameWidth;
    v.rect([mm(cx - W2 + A), mm(A)], [mm(cx + W2 - A), mm(L - A)], { w: W.thin, fill: FILL.glass });
    for (let i = 0; i < COLLECTOR.risers; i++) {
      const rx = cx - W2 + (i + 0.5) * COLLECTOR.riserPitch;
      v.line([mm(rx), mm(COLLECTOR.headerInset)], [mm(rx), mm(L - COLLECTOR.headerInset)], {
        w: W.thin,
        color: '#7f9aa9',
      });
    }
    for (const hs of [COLLECTOR.headerInset, L - COLLECTOR.headerInset])
      v.line([mm(cx - W2), mm(hs)], [mm(cx + W2), mm(hs)], { w: W.medium, color: INK_2 });
  }
  // the tank, its caps, its spacers
  const cs = TANK.centreS;
  v.rect([mm(-TANK.caseLength / 2), mm(cs - TANK.caseR)], [mm(TANK.caseLength / 2), mm(cs + TANK.caseR)], {
    w: W.thick,
    fill: FILL.alu,
  });
  for (const s of [-1, 1]) {
    const a = s * (TANK.caseLength / 2 - TANK.capDepth);
    const b = s * (TANK.caseLength / 2);
    v.rect([mm(Math.min(a, b)), mm(cs - TANK.caseR)], [mm(Math.max(a, b)), mm(cs + TANK.caseR)], {
      w: W.medium,
      fill: FILL.black,
    });
  }
  for (const sx of SPACER_XS)
    v.rect([mm(sx - SPACER.width / 2), mm(SPACER.from)], [mm(sx + SPACER.width / 2), mm(cs - TANK.caseR + 0.02)], {
      w: W.medium,
      fill: FILL.steel,
    });
  for (const sx of TANK.strapXs)
    v.line([mm(sx), mm(cs - TANK.caseR - 0.06)], [mm(sx), mm(cs + TANK.caseR + 0.06)], { w: W.medium, color: INK_2 });
  v.center([0, mm(-0.1)], [0, mm(cs + TANK.caseR + 0.1)]);
  // the pipes
  v.polyline(
    [
      [mm(PIPE.coldTurnX), mm(cs - 0.1)],
      [mm(PIPE.coldRunX), mm(L - 0.1)],
      [mm(PIPE.coldRunX), mm(COLLECTOR.headerInset)],
    ],
    { w: W.thick, color: COLORS.water },
  );
  v.polyline(
    [
      [mm(-BANK_WIDTH / 2), mm(L - COLLECTOR.headerInset)],
      [mm(PIPE.hotTurnX), mm(L - COLLECTOR.headerInset)],
      [mm(PIPE.hotTurnX), mm(cs - 0.1)],
      [mm(-TANK.caseLength / 2), mm(cs - 0.1)],
    ],
    { w: W.thick, color: COLORS.red },
  );
  // dimensions, the maker's with no mark
  const lim = ROOF_UNIT.systemWidth / 2;
  v.dim([mm(-lim), mm(-0.02)], [mm(lim), mm(-0.02)], 12, { dir: 'h', label: mL(ROOF_UNIT.systemWidth, '') });
  v.dim([mm(COLLECTOR_X.left - W2), 0], [mm(COLLECTOR_X.left + W2), 0], 5, {
    dir: 'h',
    label: mmL(COLLECTOR.width, ''),
    size: 1.8,
  });
  v.dim([mm(COLLECTOR_X.left + W2), mm(L)], [mm(COLLECTOR_X.right - W2), mm(L)], -3, {
    dir: 'h',
    label: mmL(BANK.gap, '*'),
    size: 1.7,
  });
  v.dim([mm(-TANK.caseLength / 2), mm(cs + TANK.caseR)], [mm(TANK.caseLength / 2), mm(cs + TANK.caseR)], -5, {
    dir: 'h',
    label: mL(TANK.caseLength, ''),
  });
  v.dim([mm(lim), 0], [mm(lim), mm(L)], 7, { dir: 'v', label: mmL(L, ''), size: 1.8 });
  v.dim([mm(lim), 0], [mm(lim), mm(ROOF_UNIT.alongSlope)], 19, { dir: 'v', label: mL(ROOF_UNIT.alongSlope, '') });
  v.dim([mm(-lim), 0], [mm(-lim), mm(RAIL.toFoot)], -7, { dir: 'v', label: mmL(RAIL.toFoot, ''), size: 1.8 });
  v.leader([mm(-BANK_WIDTH / 2 + 0.03), mm(COLLECTOR.headerInset)], -12, 8, l('Remplissage', 'Fill'), { size: 1.7 });
  v.leader([mm(BANK_WIDTH / 2 - 0.03), mm(L - COLLECTOR.headerInset)], 14, -3, l('Bouchon', 'Plug'), { size: 1.7 });
  v.leader([mm(PIPE.hotTurnX), mm(L + 0.2)], -4, -10, l('Tuyau chaud', 'Hot pipe'), { size: 1.7 });
  v.leader([mm(PIPE.coldRunX), mm(0.9)], 14, 0, l('Tuyau froid', 'Cold pipe'), { size: 1.7 });
}

/** The machine from the side, on its roof. */
export function drawSide(d: Drawing, x: number, y: number, scale: number): void {
  const v = d.view(x, y, scale);
  const roofEnd = ROOF_UNIT.alongSlope + 0.45;
  v.line(roofP(-0.35), roofP(roofEnd), { w: W.medium });
  for (let s = -0.3; s < roofEnd; s += 0.35) v.line(roofP(s), roofP(s + 0.08, -0.06), { w: W.thin, color: INK_2 });
  const L = COLLECTOR.length;
  const n0 = BANK.standoff;
  const n1 = n0 + COLLECTOR.depth;
  v.polyline([roofP(0, n0), roofP(L, n0), roofP(L, n1), roofP(0, n1)], { w: W.thick, closed: true, fill: FILL.alu });
  v.line(roofP(COLLECTOR.frameWidth, n0 + COLLECTOR.glassY), roofP(L - COLLECTOR.frameWidth, n0 + COLLECTOR.glassY), {
    w: W.medium,
    color: COLORS.water,
  });
  // the tank
  const c = roofP(TANK.centreS, TANK.centreN);
  v.circle(c, mm(TANK.caseR), { w: W.thick, fill: FILL.alu });
  v.circle(c, mm(TANK.vesselR), { w: W.thin, dash: 'hidden', color: INK_2 });
  v.line(roofP(RAIL.toFoot, 0), roofP(RAIL.toFoot, 0.06), { w: W.medium });
  // level line from the collector's top corner: y
  const top = roofP(L, n1);
  const lowest: [number, number] = [c[0], c[1] - mm(TANK.caseR)];
  v.line([top[0] - 150, top[1]], [c[0] + 500, top[1]], { w: W.thin, dash: 'hidden', color: COLORS.red });
  v.line([c[0] - 200, lowest[1]], [c[0] + 500, lowest[1]], { w: W.thin, dash: 'hidden', color: COLORS.red });
  v.leader([c[0] + 400, (top[1] + lowest[1]) / 2], 16, 6, cat('y = ', fig('drawnY')), { size: 1.9, color: COLORS.red });
  v.dim(roofP(0, 0), roofP(L, 0), 8, { dir: 'aligned', label: mmL(L, ''), size: 1.8 });
  v.dim([mm(L * COS_ + 0.32), 0], [mm(L * COS_ + 0.32), mm(L * SIN_)], 9, {
    dir: 'v',
    label: fig('rise30'),
    size: 1.8,
  });
  v.text(
    [mm(-0.2), mm(-0.32)],
    l(`${TILT_DEG}°* de pente, 10° à 30° sur un toit`, `${TILT_DEG}°* of pitch, 10° to 30° on a roof`),
    { size: 1.8 },
  );
  v.dimDiameter(c, mm(TANK.caseR), 150, { label: mmL(TANK.caseR * 2, '', 'Ø'), size: 1.8 });
}

const COS_ = Math.cos((TILT_DEG * Math.PI) / 180);
const SIN_ = Math.sin((TILT_DEG * Math.PI) / 180);

export const arrangementSheet: DrawingSheet = {
  id: 'general-arrangement',
  number: 'PL-S01',
  group: 'machine',
  title: l('Vue d’ensemble : du dessus et de côté', 'General arrangement: from above and from the side'),
  description: lf(
    'Du dessus, les deux capteurs et leurs tubes, le ballon, les cales et les deux tuyaux ; de côté, le capteur sur le toit et le ballon juste au-dessus. Les cotes sans marque sont celles de la fiche du constructeur. La ligne rouge mesure y, la hauteur du bas du ballon sur le haut des capteurs : {drawnY} sur ce dessin.',
    'From above, the two collectors and their tubes, the tank, the spacers and the two pipes; from the side, the collector on the roof and the tank just above it. The dimensions with no mark are those of the maker’s sheet. The red line measures y, the height of the tank’s bottom above the collectors’ top: {drawnY} in this drawing.',
  ),
  scene: 'rig',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Vue d’ensemble', 'General arrangement'),
      subtitle: l('Du dessus et de côté, à 1:20', 'From above and from the side, at 1:20'),
      number: 'PL-S01',
      scale: '1:20',
    });
    heading(d, 14, 14, cat(l('DU DESSUS', 'FROM ABOVE'), ' 1:20'));
    drawPlan(d, 96, 172, 1 / 20);
    heading(d, 200, 14, cat(l('DE CÔTÉ', 'FROM THE SIDE'), ' 1:20'));
    drawSide(d, 220, 150, 1 / 20);
    const x = 14;
    let y = 196;
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Ce que dit le constructeur', 'What the maker says'), w: 74 },
        { label: l('Valeur', 'Value'), w: 42, align: 'end', mono: true },
      ],
      [
        [l('Largeur, raccords compris', 'Width, fittings included'), mL(ROOF_UNIT.systemWidth, '')],
        [l('Pied des capteurs au dos du ballon', 'Collectors’ foot to back of tank'), mL(ROOF_UNIT.alongSlope, '')],
        [
          l('Le même, raccords compris, de côté', 'The same with fittings, side view'),
          mL(ROOF_UNIT.alongSlopeSide, ''),
        ],
        [
          l('Le même, raccords compris, en plan', 'The same with fittings, plan view'),
          mL(ROOF_UNIT.alongSlopePlan, ''),
        ],
        [l('Masse à vide, en charge', 'Mass empty, full'), `${ROOF_UNIT.massEmpty} kg, ${ROOF_UNIT.massFull} kg`],
      ],
    );
    grid(
      d,
      138,
      196,
      [
        { label: l('Ce que nous estimons', 'What we estimate'), w: 62 },
        { label: l('Valeur', 'Value'), w: 28, align: 'end', mono: true },
      ],
      [
        [l('Jour entre capteurs', 'Gap between collectors'), mmL(BANK.gap, '*')],
        [l('y, sur ce dessin', 'y, in this drawing'), fig('drawnY')],
        [l('Tuyau chaud, dans le modèle', 'Hot pipe, in the model'), fig('hotPipe')],
        [l('Tuyau froid, dans le modèle', 'Cold pipe, in the model'), fig('coldPipe')],
      ],
    );
    note(
      d,
      138,
      224,
      92,
      l(
        'Ce dessin suit la largeur du constructeur à 1 cm près : les raccords dessinés restent dans ses 2,43 m.',
        'This drawing follows the maker’s width within 1 cm: the fittings as drawn stay inside its 2.43 m.',
      ),
    );
    marksLegend(d, 14, 244, 116);
    note(
      d,
      252,
      196,
      150,
      lf(
        'Hauteur y : le bas du ballon au-dessus du haut des capteurs. Elle vaut 0 à {yBand} près d’après les plans du constructeur, et le dessin en tire {drawnY}, sans que rien ne soit réglé pour cela. Les tuyaux du dessin sont un peu plus courts que ceux du modèle, {hotPipe} et {coldPipe} ; leurs formes viennent des plans du constructeur, pas leurs longueurs.',
        'Height y: the tank’s bottom above the collectors’ top. It is 0 within {yBand} by the maker’s drawings, and this drawing gets {drawnY}, with nothing adjusted to that end. The drawn pipes are a little shorter than the model’s, {hotPipe} and {coldPipe}; their shapes come from the maker’s drawings, not their lengths.',
      ),
      { size: 2 },
    );
    return d;
  },
};
