import { Drawing, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { PARTS } from '../data/parts';
import { grid, type Cell } from './draw';

// PL-S10: the bill of materials, read from the part sheets: 51 lines, one for each sheet of the lab, in two columns.

export const ITEMS = ['roof-unit', 'roof-structure', 'cold-main', 'hot-line'] as const;

export const bomSheet: DrawingSheet = {
  id: 'bill-of-materials',
  number: 'PL-S10',
  group: 'build',
  title: l('La nomenclature', 'The bill of materials'),
  description: l(
    'Toutes les pièces du lab, monde par monde, avec leur matière et leur quantité : la même liste que les fiches. Le banc d’essai y figure pour mémoire, mais n’appartient pas à la machine. Une matière marquée « non publiée » ou « estimée » n’a pas de source.',
    'Every part in the lab, world by world, with its material and quantity: the same list as the sheets. The test stand appears for the record, but is no part of the machine. A material marked “not published” or “an estimate” has no source.',
  ),
  scene: 'house',
  parts: [...ITEMS],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La nomenclature', 'The bill of materials'),
      subtitle: l('51 lignes, comme les fiches', '51 lines, like the sheets'),
      number: 'PL-S10',
      scale: '—',
    });
    const cols = [
      { label: l('Pièce', 'Part'), w: 62 },
      { label: l('Matière', 'Material'), w: 118 },
      { label: l('Qté', 'Qty'), w: 8, align: 'end' as const },
    ];
    const worlds: Record<string, ReturnType<typeof l>> = {
      house: l('La maison', 'The house'),
      rig: l('La machine', 'The machine'),
      collector: l('Le capteur', 'The collector'),
      'tank-and-tap': l('Ballon et douche', 'Tank and shower'),
    };
    const rows: (Cell | string | ReturnType<typeof l>)[][] = [];
    let last = '';
    for (const p of PARTS) {
      if (p.scene !== last) {
        rows.push([{ t: worlds[p.scene]!, bold: true }, '', '']);
        last = String(p.scene);
      }
      rows.push([p.name, p.material, String(p.qty ?? 1)]);
    }
    // the type and the rows are sized to fill the sheet: the right-hand table must stop above the title block
    const half = 29;
    const look = { size: 2.3, pad: 1.9, lineH: 3.6 };
    grid(d, 14, 14, cols, rows.slice(0, half), look);
    grid(d, 214, 14, cols, rows.slice(half), look);
    return d;
  },
};
