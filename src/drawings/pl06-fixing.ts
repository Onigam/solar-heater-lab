import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { lf } from '../data/part-helpers';
import {
  BANK_WIDTH,
  COLLECTOR,
  COLLECTOR_STRAP,
  RAFTER_PITCH,
  RAFTER_XS,
  RAIL,
  SPACER,
  SPACER_XS,
  TANK,
} from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, mmL, note } from './draw';

// PL-S06: what holds the machine on the roof, from above: rafters, rail, straps, spacers. A small sketch shows the rail's raise, much exaggerated, and says why it is there. The maker's table of slots by rafter spacing is not reproduced.

export const ITEMS = ['collector-rail', 'collector-strap', 'tank-spacer', 'tank-strap', 'storage-tank'] as const;

function plan(d: Drawing): void {
  const v = d.view(120, 200, 1 / 15);
  const cs = TANK.centreS;
  // rafters, under everything
  for (const x of RAFTER_XS)
    v.rect([mm(x - 0.025), mm(-0.3)], [mm(x + 0.025), mm(cs + TANK.caseR + 0.25)], { w: W.thin, fill: FILL.timber });
  // rail and bank, in outline
  v.rect([mm(-RAIL.halfLength), mm(-0.02)], [mm(RAIL.halfLength), mm(0.03)], { w: W.thick, fill: FILL.steel });
  v.rect([mm(-BANK_WIDTH / 2), 0], [mm(BANK_WIDTH / 2), mm(COLLECTOR.length)], {
    w: W.medium,
    dash: 'phantom',
    color: INK_2,
  });
  for (const x of COLLECTOR_STRAP.xs)
    v.rect(
      [mm(x - COLLECTOR_STRAP.width / 2), mm(-COLLECTOR_STRAP.down)],
      [mm(x + COLLECTOR_STRAP.width / 2), mm(0.03)],
      {
        w: W.medium,
        fill: COLORS.copper,
      },
    );
  for (const x of SPACER_XS)
    v.rect([mm(x - SPACER.width / 2), mm(SPACER.from)], [mm(x + SPACER.width / 2), mm(cs - TANK.caseR + 0.02)], {
      w: W.thick,
      fill: FILL.steel,
    });
  // the tank, its straps
  v.rect([mm(-TANK.caseLength / 2), mm(cs - TANK.caseR)], [mm(TANK.caseLength / 2), mm(cs + TANK.caseR)], {
    w: W.medium,
    dash: 'phantom',
    color: INK_2,
  });
  for (const x of TANK.strapXs)
    v.rect(
      [mm(x - TANK.strapWidth / 2), mm(cs - TANK.caseR - 0.1)],
      [mm(x + TANK.strapWidth / 2), mm(cs + TANK.caseR + 0.1)],
      {
        w: W.medium,
        fill: COLORS.copper,
      },
    );
  // dimensions
  v.dim([mm(RAFTER_XS[0]!), mm(cs + TANK.caseR + 0.25)], [mm(RAFTER_XS[1]!), mm(cs + TANK.caseR + 0.25)], -4, {
    dir: 'h',
    label: mmL(RAFTER_PITCH, ''),
    size: 1.8,
  });
  v.dim([mm(BANK_WIDTH / 2), 0], [mm(BANK_WIDTH / 2), mm(RAIL.toFoot)], 10, {
    dir: 'v',
    label: mmL(RAIL.toFoot, ''),
    size: 1.9,
  });
  v.dim([mm(BANK_WIDTH / 2 - SPACER.inset), mm(SPACER.from)], [mm(BANK_WIDTH / 2), mm(SPACER.from)], 3, {
    dir: 'h',
    label: mmL(SPACER.inset, ''),
    size: 1.7,
  });
  v.leader([mm(RAFTER_XS[2]! - 0.025), mm(-0.2)], -30, 3, l('feuillard de capteur', 'collector strap'), { size: 1.8 });
  v.leader([mm(0), mm(0.005)], -60, 18, l('rail de pied', 'collector rail'), { size: 1.8 });
  v.leader([mm(TANK.strapXs[1]!), mm(cs + TANK.caseR + 0.05)], 14, -3, l('feuillard du ballon', 'tank strap'), {
    size: 1.8,
  });
  v.leader([mm(SPACER_XS[0]!), mm(SPACER.from + 0.02)], -14, -30, l('cale', 'spacer'), { size: 1.8 });
}

function raise(d: Drawing): void {
  const p = d.paper();
  const x0 = 272;
  const y0 = 54;
  const w = 118;
  const up = 12; // the sketch's own exaggeration, a drawing convention, no dimension
  p.line([x0, y0], [x0 + w, y0], { w: W.thin, dash: 'hidden', color: INK_2 });
  p.polyline(
    [
      [x0, y0],
      [x0 + w, y0 - up],
      [x0 + w, y0 - up + 4],
      [x0, y0 + 4],
    ],
    { w: W.medium, closed: true, fill: FILL.steel },
  );
  p.line([x0 + w + 4, y0], [x0 + w + 4, y0 - up], { w: W.medium, color: COLORS.red });
  p.text([x0 + w + 2, y0 - up / 2], fig('railRaiseAll'), {
    size: 1.9,
    baseline: 'middle',
    weight: 'bold',
    color: COLORS.red,
    anchor: 'end',
  });
  p.text([x0 + w / 2, y0 + 9], cat(mL(BANK_WIDTH, '†', 3), l(' de largeur de rangée', ' of bank width')), {
    size: 1.9,
    anchor: 'middle',
  });
  p.text([x0, y0 - 16], l('Côté du tuyau froid', 'The cold pipe’s side'), { size: 1.8 });
  p.text([x0 + w, y0 - up - 5], l('côté relevé, le tuyau chaud*', 'raised side, the hot pipe*'), {
    size: 1.8,
    anchor: 'end',
  });
}

export const fixingSheet: DrawingSheet = {
  id: 'roof-fixing',
  number: 'PL-S06',
  group: 'house',
  title: l('La fixation au toit', 'The roof fixing'),
  description: lf(
    'Vue du dessus, ce qui tient la machine : les chevrons, le rail, les feuillards et les cales. Le rail se relève de 12 mm par capteur d’un côté : {railRaiseAll}, soit {railAngle} de l’équerre. C’est le chiffre du constructeur, pas une erreur du dessin, et le petit croquis l’exagère pour le lire. Sa table de fentes selon l’entraxe des chevrons n’est pas reproduite ici.',
    'From above, what holds the machine: the rafters, the rail, the straps and the spacers. The rail is raised 12 mm per collector on one side: {railRaiseAll}, or {railAngle} out of square. That is the maker’s figure, no slip of the drawing, and the small sketch exaggerates it so it can be read. Its table of slots by rafter spacing is not reproduced here.',
  ),
  scene: 'rig',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La fixation au toit', 'The roof fixing'),
      subtitle: l('Vue du dessus, machine en pointillé', 'From above, the machine dotted'),
      number: 'PL-S06',
      scale: '1:15',
    });
    heading(d, 14, 14, cat(l('DU DESSUS', 'FROM ABOVE'), ' 1:15'));
    plan(d);
    heading(d, 272, 14, l('LE RELEVÉ DU RAIL, EXAGÉRÉ', 'THE RAIL’S RAISE, EXAGGERATED'));
    raise(d);
    let y = 72;
    y = note(
      d,
      272,
      y,
      132,
      lf(
        '12 mm par capteur, sur deux capteurs : {railRaiseAll} sur la largeur de la rangée, soit {railAngle} dans le plan du toit. Le manuel le demande sans dire pourquoi dans ce que nous avons lu. Notre lecture : les collecteurs montent vers un seul coin, et l’air comme le fluide chaud n’ont qu’une direction où aller. Quel côté se relève : c’est aussi notre lecture.',
        '12 mm per collector, over two collectors: {railRaiseAll} across the bank’s width, or {railAngle} in the plane of the roof. The manual asks for it without saying why in what we read. Our reading: the headers climb towards one corner, and air and warm fluid have only one way to go. Which side rises is also our reading.',
      ),
      { size: 2 },
    );
    y += 2;
    y += grid(
      d,
      272,
      y,
      [
        { label: l('Du constructeur', 'From the maker'), w: 84 },
        { label: l('Valeur', 'Value'), w: 48, align: 'end', mono: true },
      ],
      [
        [l('Rail sous le liteau du pied du ballon', 'Rail below the batten of the tank’s foot'), mmL(RAIL.toFoot, '')],
        [l('Relevé, par capteur', 'Raise, per collector'), l('12 mm', '12 mm')],
        [l('Cales depuis les bords extérieurs', 'Spacers from the outer edges'), mmL(SPACER.inset, '')],
        [l('Vent de l’essai', 'Test wind'), l('56,6 m/s', '56.6 m/s')],
        [l('Neige de l’essai', 'Test snow'), l('2 kN/m²', '2 kN/m²')],
      ],
    );
    y += 2;
    y += grid(
      d,
      272,
      y,
      [
        { label: l('Du dessin, sans source', 'From the drawing, with no source'), w: 84 },
        { label: l('Valeur', 'Value'), w: 48, align: 'end', mono: true },
      ],
      [
        [l('Feuillard de capteur, largeur', 'Collector strap, width'), mmL(COLLECTOR_STRAP.width, '*')],
        [l('Feuillard de capteur, épaisseur', 'Collector strap, thickness'), mmL(COLLECTOR_STRAP.thickness, '*')],
        [l('Feuillard du ballon, largeur', 'Tank strap, width'), mmL(TANK.strapWidth, '*')],
        [l('Feuillard du ballon, épaisseur', 'Tank strap, thickness'), mmL(TANK.strapThickness, '*')],
        [l('Cale, largeur', 'Spacer, width'), mmL(SPACER.width, '*')],
      ],
    );
    marksLegend(d, 272, y + 2, 100);
    return d;
  },
};
