import { COLORS, Drawing, INK_2, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from '../data/assembly';
import { lf } from '../data/part-helpers';
import { BANK, COLLECTOR, TANK } from '../three/dims';
import { balloon, cat, FILL, grid, heading, mm, note, roofP } from './draw';

// PL-S09: the machine exploded along the roof's normal, numbered by the steps of the assembly guide: the list is read from src/data/assembly.ts, so that the sheet and the guide cannot disagree.

export const ITEMS = [
  'collector-left',
  'collector-rail',
  'tank-spacer',
  'storage-tank',
  'tank-strap',
  'cold-pipe',
  'hot-pipe',
  'fill-port',
] as const;

/** Step number of a part in the guide. */
const stepOf = (id: string): number => ASSEMBLY.findIndex((s) => s.parts.includes(id)) + 1;

function exploded(d: Drawing): void {
  const v = d.view(44, 208, 1 / 16);
  const L = COLLECTOR.length;
  v.line(roofP(-0.3), roofP(2.9), { w: W.medium });
  for (let s = -0.25; s < 2.9; s += 0.3) v.line(roofP(s), roofP(s + 0.07, -0.05), { w: W.thin, color: INK_2 });
  const lift = (n: number): number => n;
  // rail on the roof
  v.polyline([roofP(-0.02, 0), roofP(0.05, 0), roofP(0.05, 0.05), roofP(-0.02, 0.05)], {
    w: W.thick,
    closed: true,
    fill: FILL.steel,
  });
  // collector lifted
  const nc = lift(0.55);
  v.polyline([roofP(0, nc), roofP(L, nc), roofP(L, nc + COLLECTOR.depth), roofP(0, nc + COLLECTOR.depth)], {
    w: W.thick,
    closed: true,
    fill: FILL.alu,
  });
  v.line(roofP(0.1, BANK.standoff), roofP(0.1, nc), { w: W.thin, dash: 'center' });
  v.line(roofP(L - 0.1, BANK.standoff), roofP(L - 0.1, nc), { w: W.thin, dash: 'center' });
  // spacer
  v.polyline([roofP(1.86, 0.05), roofP(2.0, 0.05), roofP(2.0, 0.12), roofP(1.86, 0.12)], {
    w: W.medium,
    closed: true,
    fill: FILL.steel,
  });
  // tank lifted further
  const nt = lift(1.15);
  const c = roofP(TANK.centreS, TANK.centreN + nt);
  v.circle(c, mm(TANK.caseR), { w: W.thick, fill: FILL.alu });
  v.line(roofP(TANK.centreS, TANK.centreN), roofP(TANK.centreS, TANK.centreN + nt - TANK.caseR), {
    w: W.thin,
    dash: 'center',
  });
  // strap, above the tank
  v.arc(roofP(TANK.centreS, TANK.centreN + nt + 0.16), mm(TANK.caseR + 0.02), 40, 220, { w: W.medium });
  // the two pipes, lifted with the collector
  const pipeN = nc + COLLECTOR.depth + 0.16;
  v.line(roofP(0.12, pipeN), roofP(L + 0.1, pipeN), { w: W.thick, color: COLORS.water });
  v.line(roofP(L - 0.1, pipeN + 0.16), roofP(L + 0.34, pipeN + 0.16), { w: W.thick, color: COLORS.red });
  /** A balloon with its step's number, tied to what it names by a thin line. */
  const mark = (id: string, s: number, n: number, ts: number, tn: number): void => {
    const pt = v.map(roofP(s, n));
    v.line(roofP(s, n), roofP(ts, tn), { w: W.thin, color: INK_2 });
    balloon(d, pt[0], pt[1], stepOf(id));
  };
  mark('collector-rail', -0.02, 0.34, 0.015, 0.05);
  mark('collector-left', 0.9, nc - 0.2, 0.9, nc);
  mark('tank-spacer', 2.12, 0.28, 1.95, 0.12);
  mark('storage-tank', TANK.centreS - 0.5, TANK.centreN + nt + 0.28, TANK.centreS - 0.2, TANK.centreN + nt + 0.14);
  mark('tank-strap', TANK.centreS + 0.05, TANK.centreN + nt + 0.66, TANK.centreS + 0.05, TANK.centreN + nt + 0.46);
  mark('fill-port', 0.02, nc + 0.32, 0.03, nc + COLLECTOR.depth / 2);
  mark('cold-pipe', 1.2, pipeN + 0.2, 1.2, pipeN);
  mark('hot-pipe', L - 0.3, pipeN + 0.36, L - 0.02, pipeN + 0.16);
}

export const assemblySheet: DrawingSheet = {
  id: 'assembly-sequence',
  number: 'PL-S09',
  group: 'build',
  title: l('L’ordre de montage', 'The order of assembly'),
  description: lf(
    'La machine éclatée le long de la normale au toit, numérotée comme le guide de montage : de l’usine, notre reconstitution, jusqu’au toit, l’ordre du constructeur. Le détail qui surprend : le ballon se remplit d’eau avant le circuit, le tuyau froid se pose avant le chaud, et les capteurs restent dans leur carton jusqu’à la fin.',
    'The machine exploded along the roof’s normal, numbered as in the assembly guide: from the factory, our reconstruction, to the roof, the maker’s order. The details that surprise: the tank fills with water before the circuit, the cold pipe goes on before the hot, and the collectors stay in their cartons until the end.',
  ),
  scene: 'rig',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('L’ordre de montage', 'The order of assembly'),
      subtitle: l('Numéros du guide de montage', 'Numbered as in the assembly guide'),
      number: 'PL-S09',
      scale: '1:16',
    });
    heading(d, 14, 14, l('LA MACHINE ÉCLATÉE, 1:16', 'THE MACHINE EXPLODED, 1:16'));
    exploded(d);
    const cols = [
      { label: l('N°', 'No.'), w: 8, align: 'middle' as const },
      { label: l('Étape', 'Step'), w: 72 },
    ];
    const rows = ASSEMBLY.map((s, i) => [String(i + 1), l(s.title.fr, s.title.en)]);
    grid(d, 232, 14, cols, rows.slice(0, 10), { size: 1.75 });
    grid(d, 318, 14, cols, rows.slice(10), { size: 1.75 });
    note(
      d,
      232,
      178,
      170,
      cat(
        l(
          'Les étapes 1 à 8, à l’usine, sont notre reconstitution d’après la liste des matières : aucune source ne donne cet ordre. ',
          'Steps 1 to 8, in the factory, are our reconstruction from the material list: no source gives that order. ',
        ),
        l(
          'Les étapes 9 à 20, sur le toit, suivent le manuel du constructeur.',
          'Steps 9 to 20, on the roof, follow the maker’s manual.',
        ),
      ),
      { size: 2 },
    );
    return d;
  },
};
