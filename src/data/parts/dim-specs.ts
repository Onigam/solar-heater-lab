// The dimension rows of the part sheets, ALL read from src/three/dims.ts (the single source of lengths, BRIEF §5): no number is typed in this file. They are appended to each sheet's specs by ../parts.ts. A row with no mark is the maker's figure, as dims.ts tags it;
// † is derived, * is an estimate of the 3D model (dims.ts says which, and the sheets' own texts say why).
import type { Spec } from '@onigam/lab-kit/content';
import { l, type L } from '@onigam/lab-kit/i18n';
import {
  BANK,
  BANK_WIDTH,
  COLLECTOR,
  COLLECTOR_STRAP,
  FITTING,
  HEADER_N,
  HOUSE,
  PENETRATION,
  RAFTER_PITCH,
  RAIL,
  ROOFING,
  SPACER,
  TANK,
} from '../../three/dims';
import { sp } from '../part-helpers';
import { nEn, nFr } from '../units';

const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;

/** Metres, at most three decimals, no trailing zero, with its mark. */
const lenM = (mark: '*' | '†' | '', ...m: number[]): L =>
  l(
    `${m.map((x) => trim(nFr(x, 3), ',')).join(' × ')} m${mark}`,
    `${m.map((x) => trim(nEn(x, 3), '.')).join(' × ')} m${mark}`,
  );
/** Millimetres, one decimal only when it matters, with its mark. */
const lenMm = (mark: '*' | '†' | '', ...m: number[]): L => {
  const one = (x: number, f: (v: number, d: number) => string): string =>
    f(x * 1000, Math.abs(x * 1000 - Math.round(x * 1000)) < 0.05 ? 0 : 1);
  return l(`${m.map((x) => one(x, nFr)).join(' × ')} mm${mark}`, `${m.map((x) => one(x, nEn)).join(' × ')} mm${mark}`);
};

const COLLECTOR_ALL = sp(
  'Dessiné, longueur × largeur × épaisseur',
  'As drawn, length × width × depth',
  lenMm('', COLLECTOR.length, COLLECTOR.width, COLLECTOR.depth),
);

export const DIM_SPECS: Record<string, Spec[]> = {
  // ---- house
  'roof-structure': [
    sp('Entraxe dessiné', 'Spacing as drawn', lenMm('', RAFTER_PITCH)),
    sp(
      'Sous les tuiles dessinées, chevron compris',
      'Under the drawn tiles, rafter included',
      lenMm('*', -ROOFING.rafterBottom),
    ),
  ],
  'roof-penetration': [
    sp(
      'Depuis le pied des capteurs, le long de la pente',
      'From the collectors’ foot, along the slope',
      lenM('*', PENETRATION.s),
    ),
  ],
  'load-bearing-wall': [
    sp(
      'Maison dessinée, avant-toit et faîtage',
      'House as drawn, eaves and ridge',
      lenM('*', HOUSE.eaves, HOUSE.ridge),
    ),
  ],

  // ---- rig
  'collector-left': [COLLECTOR_ALL],
  'collector-right': [COLLECTOR_ALL],
  'collector-link': [
    sp(
      'Raccord dessiné, Ø × longueur',
      'Union as drawn, Ø × length',
      lenMm('*', FITTING.unionR * 2, FITTING.unionLength),
    ),
  ],
  'storage-tank': [
    sp('Enveloppe, diamètre × longueur', 'Case, diameter × length', lenMm('', TANK.caseR * 2, TANK.caseLength)),
  ],
  'collector-rail': [
    sp('Longueur dessinée', 'Length as drawn', lenM('*', RAIL.halfLength * 2)),
    sp('Largeur de la rangée', 'Width of the bank', lenM('†', BANK_WIDTH)),
  ],
  'collector-strap': [
    sp(
      'Largeur × épaisseur dessinées',
      'Width × thickness as drawn',
      lenMm('*', COLLECTOR_STRAP.width, COLLECTOR_STRAP.thickness),
    ),
  ],
  'tank-spacer': [sp('Largeur dessinée', 'Width as drawn', lenMm('*', SPACER.width))],
  'tank-strap': [
    sp('Largeur × épaisseur dessinées', 'Width × thickness as drawn', lenMm('*', TANK.strapWidth, TANK.strapThickness)),
  ],
  'fill-port': [sp('Longueur dessinée', 'Length as drawn', lenMm('*', FITTING.fillLength))],
  'top-plug': [sp('Longueur dessinée', 'Length as drawn', lenMm('*', FITTING.plugLength))],
  'overheat-valve': [
    sp(
      'Corps dessiné, Ø × longueur',
      'Body as drawn, Ø × length',
      lenMm('*', FITTING.overheatR * 2, FITTING.overheatLength),
    ),
  ],
  'overflow-reservoir': [
    sp(
      'Corps dessiné, Ø × longueur',
      'Body as drawn, Ø × length',
      lenMm('*', FITTING.reservoirR * 2, FITTING.reservoirLength),
    ),
  ],

  // ---- collector
  'glass-seal': [
    sp(
      'Dessous du verre, au-dessus du fond du caisson',
      'Underside of the glass, above the tray’s back',
      lenMm('*', COLLECTOR.glassY),
    ),
  ],
  'air-gap': [
    sp(
      'Entre l’axe des tubes et le verre, dessiné',
      'From the tubes’ axis to the glass, as drawn',
      lenMm('*', COLLECTOR.glassY - COLLECTOR.waterwayY),
    ),
  ],
  'absorber-plate': [sp('Tôle dessinée', 'Sheet as drawn', lenMm('*', COLLECTOR.plateThickness))],
  'riser-tube': [
    sp('Paroi', 'Wall', lenMm('*', COLLECTOR.riserWall)),
    sp('Longueur', 'Length', lenMm('', COLLECTOR.length)),
  ],
  'upper-header': [sp('Paroi', 'Wall', lenMm('*', COLLECTOR.headerWall))],
  'lower-header': [
    sp('Longueur', 'Length', lenMm('', COLLECTOR.width)),
    sp('Paroi', 'Wall', lenMm('*', COLLECTOR.headerWall)),
    sp('Axe au-dessus du toit', 'Axis above the roof', lenMm('*', HEADER_N)),
  ],
  'back-insulation': [sp('Laine, dessinée', 'Blanket, as drawn', lenMm('', COLLECTOR.blanket))],
  'collector-tray': [COLLECTOR_ALL, sp('Écart au toit', 'Stand-off from the roof', lenMm('*', BANK.standoff))],

  // ---- tank-and-tap
  'inner-vessel': [sp('Paroi', 'Wall', lenMm('', TANK.vesselWall))],
  'mantle-jacket': [sp('Tôle de la double enveloppe', 'The jacket’s sheet', lenMm('*', TANK.jacketShell))],
  'outer-case': [sp('Entre deux flasques', 'Between the two caps', lenM('*', TANK.caseLength - 2 * TANK.capDepth))],
  'end-cap': [sp('Bombé', 'Dome', lenMm('*', TANK.capDepth)), sp('Trappe', 'Hatch', lenMm('*', TANK.hatchR * 2))],
  'sacrificial-anode': [
    sp('Dessinée, Ø × longueur', 'As drawn, Ø × length', lenMm('*', TANK.anodeR * 2, TANK.anodeLength)),
  ],
  'booster-element': [
    sp('Dessinée, Ø × longueur', 'As drawn, Ø × length', lenMm('*', TANK.elementR * 2, TANK.elementLength)),
  ],
  'tank-thermostat': [
    sp('Doigt de gant, Ø × longueur', 'Pocket, Ø × length', lenMm('*', TANK.pocketR * 2, TANK.pocketLength)),
  ],
  'jacket-relief-valve': [sp('Corps dessiné, Ø', 'Body as drawn, Ø', lenMm('*', FITTING.reliefR * 2))],
  'cold-diffuser': [
    sp('Dessiné, Ø × longueur', 'As drawn, Ø × length', lenMm('*', TANK.diffuserR * 2, TANK.diffuserLength)),
  ],
  'hot-outlet': [sp('Tube dessiné, Ø', 'Tube as drawn, Ø', lenMm('*', TANK.hotOutletR * 2))],
};
