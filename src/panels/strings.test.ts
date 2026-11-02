import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { months, num, PANEL_STRINGS, st, sx, type PanelKey } from './strings';
import { installFakeDom } from './test-dom';

// The panel's words: French and English written together, same detail, no placeholder, no research code, no internal word, no maker's name, and no number in a text that does not come from
// docs/research.md or docs/physics.md.

beforeAll(() => installFakeDom()); // setLang writes the language on the document element
afterEach(() => setLang('fr'));

const entries = Object.entries(PANEL_STRINGS);
/** The numbers of a text, decimal commas read as points: "0,8" and "0.8" give the same list. */
const numbers = (s: string): string[] => (s.replace(/(\d),(\d)/g, '$1.$2').match(/\d+(\.\d+)?/g) ?? []).sort();

/**
 * Every number a text may contain, with its source.
 * 300: litres of the tank. 3: the bore of a riser in the scenario of narrow tubes (the slider's own 3 mm), and its model range. 7: the frost scenario's air (−7 °C).
 * 15: the maker's limit (−15 °C). 25, 45: the band where legionella grows. 50, 60: the tap's limit and the tank's minimum. 95: the maker's « as high as ». 45 also the load behind the Keymark table.
 * 1981: the year of the only model of the height. 180, 200: the sizes of two presets' tanks. Model results quoted in a lesson carry their † in the text: 6 K, −3 °C, +5 °C (docs/physics.md).
 */
const ALLOWED = new Set([
  '1',
  '2',
  '3',
  '5',
  '6',
  '7',
  '15',
  '25',
  '45',
  '50',
  '60',
  '95',
  '180',
  '200',
  '300',
  '1981',
]);

describe('the panel’s words', () => {
  it('there are words to check', () => {
    expect(entries.length).toBeGreaterThan(120);
  });
  it('never show a research code (K12, S3…), an internal word, or the maker’s name', () => {
    for (const [key, [fr, en]] of entries) {
      for (const text of [fr, en]) {
        expect(text, key).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, key).not.toMatch(/\bid\b|\bworld\b|\bpreset id\b|\bundefined\b/i);
        expect(text, key).not.toMatch(/solahart|302J|hartgard/i);
      }
    }
  });
  it('exist in both languages, non-empty, with no placeholder', () => {
    for (const [key, [fr, en]] of entries) {
      expect(fr.trim().length, `${key} fr`).toBeGreaterThan(0);
      expect(en.trim().length, `${key} en`).toBeGreaterThan(0);
      for (const text of [fr, en]) expect(text, key).not.toMatch(/TODO|FIXME|lorem|xxx|\[\[|\{\{/i);
    }
  });
  it('carry the same numbers in French and in English', () => {
    for (const [key, [fr, en]] of entries) expect(numbers(fr), key).toEqual(numbers(en));
  });
  it('have the same level of detail', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr.length < 40 && en.length < 40) continue;
      expect(fr.length / en.length, key).toBeGreaterThan(0.6);
      expect(fr.length / en.length, key).toBeLessThan(1.7);
    }
  });
  it('are only the same in both languages for a unit, a name or a single word', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr === en) expect(fr.split(/\s+/).length, `${key}: ${fr}`).toBeLessThanOrEqual(2);
    }
  });
  it('hold no number but those of the research and the model', () => {
    for (const [key, [, en]] of entries) {
      const text = en.replace(/\bA3\b|\b3D\b/g, '');
      for (const n of numbers(text)) expect(ALLOWED.has(n), `${key}: ${n} in « ${en} »`).toBe(true);
    }
  });
  it('say once what climbs, once that the height below zero is unmeasured, once that the table is a calculation', () => {
    const count = (re: RegExp) => entries.filter(([, [, en]]) => re.test(en)).length;
    expect(count(/not the water you drink/)).toBe(1);
    expect(count(/nobody has measured anything/)).toBe(1);
    expect(count(/a test plus a calculation/)).toBe(1);
  });
  it('the panel’s lookups work in both languages', () => {
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      expect(months()).toHaveLength(12);
      expect(st('simIntro' as PanelKey).length).toBeGreaterThan(40);
      expect(sx('alarm', 'frostIce').length).toBeGreaterThan(5);
    }
  });
});

describe('num', () => {
  it('writes the decimal mark of the language', () => {
    setLang('fr');
    expect(num(7.5, 1)).toBe('7,5');
    setLang('en');
    expect(num(7.5, 1)).toBe('7.5');
    expect(num(Number.NaN)).toBe('—');
    expect(num(-0.001, 1)).toBe('0.0');
  });
});
