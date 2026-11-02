import { beforeAll, describe, expect, it } from 'vitest';
import { configureDrawings } from '@onigam/lab-kit/drawings';
import { setLang } from '@onigam/lab-kit/i18n';
import { ASSEMBLY } from '../data/assembly';
import { SWEEP_TABLE } from '../data/figures';
import { PARTS } from '../data/parts';
import { nEn, nFr } from '../data/units';
import { ROOF_UNIT } from '../sim/machine';
import { COLLECTOR, RAIL, SPACER, TANK } from '../three/dims';
import { SHEET_GROUPS, SHEETS } from './index';
import { curves } from './pl03-collector';
import { PRESSURES } from './pl07-loads';
import { FakeElement, installFakeDom, textBoxes, textExtent } from './test-dom';

// The ten A3 sheets of the "Plans" mode: the contract, a render in French and in English with no NaN and no text on text or off the sheet, the cartouche, the dimensions read from dims.ts, and the model's figures.

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;
const key = (id: string, lang: Lang): string => `${id}/${lang}`;
const textsOf = (id: string, lang: Lang): string[] => textBoxes(rendered.get(key(id, lang))!).map((t) => t.content);
const n = (v: number, lang: Lang, d = 0): string => (lang === 'fr' ? nFr(v, d) : nEn(v, d));

beforeAll(() => {
  installFakeDom();
  configureDrawings({ date: '2026-11-02' });
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
  }
  setLang('fr');
});

describe('the contract', () => {
  it('has ten sheets, numbered in order, each with a group, a world and existing parts of that world', () => {
    expect(SHEETS.length).toBe(10);
    expect(SHEETS.map((s) => s.number)).toEqual(
      Array.from({ length: 10 }, (_, i) => `PL-S${String(i + 1).padStart(2, '0')}`),
    );
    expect(new Set(SHEETS.map((s) => s.id)).size).toBe(10);
    for (const s of SHEETS) {
      expect(SHEET_GROUPS.map((g) => g.id) as string[], s.id).toContain(s.group);
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      for (const id of s.parts ?? []) expect(PARTS.find((p) => p.id === id)?.scene, `${s.id}: ${id}`).toBe(s.scene);
    }
  });
  it('lists the sheets in the order of their numbers: the kit shows them group by group, in the order the lab gives the groups', () => {
    const listed = SHEET_GROUPS.flatMap((g) => SHEETS.filter((s) => s.group === g.id).map((s) => s.number));
    expect(listed).toEqual([...SHEETS.map((s) => s.number)].sort());
    expect(listed).toHaveLength(10);
  });
  it('follows the list of the research', () => {
    expect(SHEETS.map((s) => s.id)).toEqual([
      'general-arrangement',
      'loop-heights',
      'collector-section',
      'tank-section',
      'hydraulic-schematic',
      'roof-fixing',
      'loads-and-pressures',
      'heat-budget',
      'assembly-sequence',
      'bill-of-materials',
    ]);
  });
  it('describes each sheet in both languages, with what it shows and how to read it', () => {
    for (const s of SHEETS) {
      for (const lang of LANGS) {
        expect(s.title[lang].length, s.id).toBeGreaterThan(5);
        expect(s.description[lang].split(/(?<=[.!?])\s+/).length, s.id).toBeGreaterThanOrEqual(2);
      }
      expect(s.title.fr).not.toBe(s.title.en);
      const ratio = s.description.fr.length / s.description.en.length;
      expect(ratio, s.id).toBeGreaterThan(0.8);
      expect(ratio, s.id).toBeLessThan(1.3);
    }
  });
  it('names no maker on a sheet', () => {
    const names = /solahart|302J|hartgard|ICC-SRCC|keymark/i;
    for (const s of SHEETS)
      for (const lang of LANGS) {
        expect(names.test(s.description[lang]), s.id).toBe(false);
        for (const t of textsOf(s.id, lang)) expect(names.test(t), `${s.id}: ${t}`).toBe(false);
      }
  });
});

describe('the render', () => {
  it('prints no bad number, no placeholder', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textsOf(s.id, lang)) expect(t, s.id).not.toMatch(/NaN|undefined|Infinity|\{\w+\}|\[object/);
  });
  it('says in every cartouche that a sheet is for understanding, in both languages, with its number', () => {
    for (const s of SHEETS) {
      expect(textsOf(s.id, 'fr').join(' '), s.id).toContain('Pour comprendre');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain('For understanding');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain(s.number);
    }
  });
  it('has its own French and English, not one language in both', () => {
    for (const s of SHEETS) expect(textsOf(s.id, 'fr').join(' ')).not.toBe(textsOf(s.id, 'en').join(' '));
  });
  it('keeps every text on the sheet', () => {
    const off: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textBoxes(rendered.get(key(s.id, lang))!)) {
          if (t.rotated) continue;
          const e = textExtent(t);
          if (e.x0 < 7 || e.x1 > 413 || e.y0 < 7 || e.y1 > 290)
            off.push(
              `${s.number} ${lang}: ${t.content} (${e.x0.toFixed(0)}, ${e.x1.toFixed(0)}, ${e.y0.toFixed(0)}, ${e.y1.toFixed(0)})`,
            );
        }
    expect(off.join('\n')).toBe('');
  });
  it('writes no text on another text', () => {
    const clashes: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const boxes = textBoxes(rendered.get(key(s.id, lang))!).filter((t) => !t.rotated && t.content.trim());
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = textExtent(boxes[i]!);
            const b = textExtent(boxes[j]!);
            const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
            if (w > 1 && h > 0.6) clashes.push(`${s.number} ${lang}: “${boxes[i]!.content}” / “${boxes[j]!.content}”`);
          }
      }
    expect(clashes.join('\n')).toBe('');
  });
  it('keeps out of the title block', () => {
    const X0 = 232;
    const Y0 = 249;
    const inside: string[] = [];
    for (const s of SHEETS) {
      const fr = textBoxes(rendered.get(key(s.id, 'fr'))!);
      const outside = fr.filter((t) => {
        const e = textExtent(t);
        return e.x1 > X0 + 1 && e.y1 > Y0 + 1;
      });
      if (outside.length > 13) inside.push(`${s.number}: ${outside.map((t) => t.content).join(' | ')}`);
    }
    expect(inside.join('\n')).toBe('');
  });
});

describe('the numbers are read, not typed', () => {
  it('PL-S01 prints the maker’s outline with no mark, and the estimated gap with its star', () => {
    for (const lang of LANGS) {
      const t = textsOf('general-arrangement', lang);
      expect(t).toContain(`${n(ROOF_UNIT.systemWidth, lang, 2)} m`);
      expect(t).toContain(`${n(ROOF_UNIT.alongSlope, lang, 2)} m`);
      expect(t).toContain(`${n(COLLECTOR.length * 1000, lang)} mm`);
      expect(t).toContain(`${n(COLLECTOR.width * 1000, lang)} mm`);
      expect(t).toContain(`${n(RAIL.toFoot * 1000, lang)} mm`);
      expect(t.join(' ')).toContain('30 mm*');
    }
  });
  it('PL-S02 prints the sweep, a line per height, with y = 0 in bold', () => {
    for (const lang of LANGS) {
      const t = textsOf('loop-heights', lang);
      for (const r of SWEEP_TABLE) expect(t, String(r.y)).toContain(n(r.gain, lang, 2));
      expect(t).toContain(n(SWEEP_TABLE[8]!.lost, lang, 1));
    }
    expect(textsOf('loop-heights', 'en').join(' ')).toMatch(/upright tank/);
  });
  it('PL-S03 prints the collector’s layers, and its curves cross where the text says', () => {
    for (const lang of LANGS) {
      const t = textsOf('collector-section', lang);
      expect(t).toContain(`${n(COLLECTOR.blanket * 1000, lang)} mm`);
      expect(t).toContain(`${n(COLLECTOR.depth * 1000, lang)} mm`);
      expect(t.join(' ')).toContain(`${n(COLLECTOR.riserPitch * 1000, lang, 1)} mm†`);
    }
    const c = curves();
    expect(c[0]!.black).toBe(0.778);
    const after = c.find((p) => p.selective > p.black)!;
    expect(after.dT).toBe(30); // they cross between 25 and 30 K
  });
  it('PL-S04 tells the maker’s figures from our estimates', () => {
    for (const lang of LANGS) {
      const t = textsOf('tank-section', lang).join(' ');
      expect(t).toContain(`${n(TANK.caseLength, lang, 2)} m`);
      expect(t).toContain(`${n(TANK.vesselR * 2000, lang)} mm*`);
      expect(t).toContain(`${n(TANK.jacketGap * 1000, lang, 1)} mm*`);
    }
  });
  it('PL-S05 keeps the maker’s order on the cold line, and every valve’s setting', () => {
    const t = textsOf('hydraulic-schematic', 'en').join(' ');
    expect(t.indexOf('Isolating valve')).toBeLessThan(t.indexOf('Non-return'));
    expect(t.indexOf('Non-return')).toBeLessThan(t.indexOf('Cold relief'));
    for (const s of ['850 kPa', '80 or 200 kPa', '99 °C, 1,000 kPa', '50 °C at most', 'at least 1 m'])
      expect(t, s).toContain(s);
  });
  it('PL-S06 says the rail’s angle is the maker’s, and prints the spacers’ 200 mm', () => {
    for (const lang of LANGS)
      expect(textsOf('roof-fixing', lang).join(' ')).toContain(`${n(SPACER.inset * 1000, lang)} mm`);
    expect(textsOf('roof-fixing', 'en').join(' ')).toMatch(/Our reading/);
    expect(SHEETS.find((s) => s.id === 'roof-fixing')!.description.en).toMatch(/0\.66°†.*maker’s figure/);
  });
  it('PL-S07 draws its bars from the pressures it lists, in order', () => {
    const kpa = PRESSURES.map((p) => p.kpa);
    expect(kpa).toEqual([...kpa].sort((a, b) => a - b));
    expect(kpa[0]).toBe(80);
    expect(kpa[kpa.length - 1]).toBe(1000);
    for (const lang of LANGS) expect(textsOf('loads-and-pressures', lang).join(' ')).toContain(n(0.83, lang, 2));
  });
  it('PL-S08 sets the published years beside the model’s', () => {
    for (const lang of LANGS) {
      const t = textsOf('heat-budget', lang);
      expect(t).toContain(n(6726, lang));
      expect(t).toContain(n(6796, lang));
      expect(t).toContain(n(81.4, lang, 1));
    }
  });
  it('PL-S09 is the guide’s own list, twenty steps', () => {
    for (const lang of LANGS) {
      const t = textsOf('assembly-sequence', lang).join(' ');
      expect(t).toContain('20');
      for (const s of ASSEMBLY) expect(t).toContain(s.title[lang].split(' ')[0]);
    }
  });
  it('PL-S10 has a line for every part', () => {
    for (const lang of LANGS) {
      const t = textsOf('bill-of-materials', lang).join(' ');
      for (const p of PARTS) expect(t, p.id).toContain(p.name[lang].split(' ').slice(0, 2).join(' '));
    }
  });
});
