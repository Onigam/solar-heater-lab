import { describe, expect, it } from 'vitest';
import type { L } from '@onigam/lab-kit/i18n';
import { SCENARIO_IDS } from '../sim/presets';
import { SCENARIO_TEXTS } from '../sim/texts';
import { ASSEMBLY } from './assembly';
import { FIG, type Fig } from './figures';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS } from './overviews';
import { PARTS } from './parts';
import { nEn, nFr } from './units';

// The six lessons: the contract (ids, worlds, parts, scenarios), the shape, the honest points, and the names of the scenarios, which the visitor must find in the panel word for word.

const words = (t: string): number => t.trim().split(/\s+/).length;
const labels = (id: string): { fr: string; en: string } => {
  const [fr, en] = SCENARIO_TEXTS[id as keyof typeof SCENARIO_TEXTS].name;
  return { fr, en };
};
const bodyOf = (lesson: (typeof LESSONS)[number], lang: 'fr' | 'en'): string =>
  lesson.body.map((b) => b[lang]).join(' ');

function texts(): [string, L][] {
  const out: [string, L][] = [];
  for (const les of LESSONS) {
    out.push([`${les.id}.title`, les.title], [`${les.id}.summary`, les.summary]);
    les.body.forEach((b, i) => out.push([`${les.id}.body[${i}]`, b]));
    les.figures?.forEach((f, i) => {
      out.push([`${les.id}.figures[${i}].label`, f.label]);
      if (typeof f.value !== 'string') out.push([`${les.id}.figures[${i}].value`, f.value]);
    });
    les.quiz?.forEach((qu, i) => {
      out.push([`${les.id}.quiz[${i}].q`, qu.q], [`${les.id}.quiz[${i}].explain`, qu.explain]);
      qu.choices.forEach((c, j) => out.push([`${les.id}.quiz[${i}].choices[${j}]`, c]));
    });
  }
  return out;
}

function numbers(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

/** The numbers a lesson may quote with no mark, with their source (research numbers). Reported figures only; the model's heights are the slider's. */
const REPORTED = new Set([
  '0', // y = 0, the machine's place (K30)
  '19', // L (K5)
  '3', // the 3 mm slider of the scenario; the 3-bar relief (K42)
  '0.778',
  '6.541',
  '0.025',
  '0.671',
  '3.592', // K17, K25
  '4.7',
  '6.0',
  '5',
  '4.0',
  '20',
  '0.7',
  '50', // K19
  '300', // L (K1)
  '60',
  '10',
  '80', // K60, K53
  '1981', // S17
  '40', // % (K44), and K12's 40 %
  '0.30',
  '0.61',
  '0.90',
  '1.22', // heights of the sweep (K28, the slider)
  '7000', // kJ (K31)
  '7',
  '13',
  '22',
  '34',
  '30',
  '4.5', // K12, K5
  '15', // K13
  '109',
  '3.7', // K42
  '220',
  '200', // K25
  '150', // K44 (S44): about 150 °C
  '25',
  '45',
  '55',
  '2',
  '1', // K53, K55
  '45.3',
  '51.5',
  '65.0',
  '81.4',
  '28.7',
  '34.2',
  '40.4',
  '60.7',
  '400', // K21
]);
const figNumbers = new Set(
  Object.values(FIG as Record<string, Fig>).flatMap((f) => [
    numbers(nFr(f.v, f.d), 'fr')[0],
    numbers(nEn(f.v, f.d), 'en')[0],
    ...(f.t ? [...numbers(f.t[0], 'fr'), ...numbers(f.t[1], 'en')] : []),
  ]),
);
const bare = (t: string): string =>
  t
    .replace(/kWh\/m²|W\/m²K²|W\/m²K|W\/m²|L\/h|L\/jour|L a day/g, (u) => (u.includes('L') ? 'L' : 'unit'))
    .replace(/\d{1,2}(?: h |:)\d{2}†/g, 'hour†')
    .replace(/2 m\/s/g, 'wind-a')
    .replace(/5 m\/s/g, 'wind-b');

describe('the lessons', () => {
  it('are six, with twelve questions, two each', () => {
    expect(LESSONS.length).toBe(6);
    expect(LESSONS.map((l) => l.quiz?.length)).toEqual([2, 2, 2, 2, 2, 2]);
    expect(LESSONS.map((l) => l.id)).toEqual([
      'why-it-climbs',
      'black-plate-under-glass',
      'the-layers',
      'the-night',
      'too-cold-too-hot',
      'the-shower',
    ]);
  });
  it('open each on one world, one existing part of that world, and a scenario of the simulation', () => {
    for (const les of LESSONS) {
      const part = PARTS.find((p) => p.id === les.focus.part);
      expect(part?.scene, les.id).toBe(les.focus.scene);
      expect(SCENARIO_IDS, les.id).toContain(les.focus.scenario);
    }
  });
  it('reach all twelve scenarios: opened by a lesson, or named word for word in its text', () => {
    for (const id of SCENARIO_IDS) {
      const opened = LESSONS.some((l) => l.focus.scenario === id);
      const named =
        LESSONS.some((l) => bodyOf(l, 'fr').includes(`« ${labels(id).fr} »`)) &&
        LESSONS.some((l) => bodyOf(l, 'en').includes(`“${labels(id).en}”`));
      expect(opened || named, id).toBe(true);
    }
  });
  it('name every scenario the way the panel does, in the sheets, guides and overviews too', () => {
    const known = {
      fr: new Set(SCENARIO_IDS.map((i) => labels(i).fr)),
      en: new Set(SCENARIO_IDS.map((i) => labels(i).en)),
    };
    const panelLabels =
      /Tous les chiffres|Hauteur du ballon|Clapet anti-retour|Tuyaux isolés|Sélectif|Prendre une douche|Thermostat|Horloge|Goutte de la soupape|Sortis par dilatation|Haut du ballon|Sortie capteur|Robinet|Ballon au-delà de 95 °C/;
    const all: L[] = [
      ...PARTS.flatMap((p) => (p.tip ? [p.tip] : [])),
      ...PARTS.map((p) => p.description),
      ...[...ASSEMBLY, ...INSTALL].flatMap((s) => (s.tip ? [s.tip] : [])),
      ...Object.values(OVERVIEWS).map((o) => o.text),
      ...LESSONS.flatMap((l) => l.body),
    ];
    for (const t of all) {
      for (const m of t.fr.matchAll(/« ([^»]+) »/g)) {
        const q = m[1] ?? '';
        if (/^[A-ZÉ]/.test(q) && !/bien moins|souhaitable|pas adapté|18 pouces/.test(q)) {
          expect(known.fr.has(q) || panelLabels.test(q), q).toBe(true);
        }
      }
    }
  });
  it('have four paragraphs of at most 95 words, a formula and three chips', () => {
    for (const les of LESSONS) {
      expect(les.body.length, les.id).toBe(4);
      expect(les.formula, les.id).toBeTruthy();
      expect(les.figures?.length, les.id).toBe(3);
      for (const b of les.body)
        for (const lang of ['fr', 'en'] as const)
          expect(words(b[lang]), `${les.id} ${lang}: ${words(b[lang])} words`).toBeLessThanOrEqual(95);
    }
  });
  it('ask questions with three choices of about the same length, the right answer not always in one place', () => {
    const answers = new Set<number>();
    for (const les of LESSONS) {
      for (const qu of les.quiz ?? []) {
        expect(qu.choices.length, les.id).toBe(3);
        expect(qu.answer, les.id).toBeLessThan(3);
        answers.add(qu.answer);
        for (const lang of ['fr', 'en'] as const) {
          const lengths = qu.choices.map((c) => c[lang].length);
          expect(Math.max(...lengths) / Math.min(...lengths), `${les.id}: ${qu.q[lang]}`).toBeLessThan(2.1);
        }
      }
    }
    expect(answers).toEqual(new Set([0, 1, 2]));
  });
  it('do not give the answer away by its length: the longest is right about one time in three, in each language', () => {
    const questions = LESSONS.flatMap((les) => les.quiz ?? []);
    for (const lang of ['fr', 'en'] as const) {
      const lengths = questions.map((qu) => ({ of: qu.choices.map((c) => c[lang].length), right: qu.answer }));
      const longest = lengths.filter((q) => q.of[q.right] === Math.max(...q.of)).length;
      const shortest = lengths.filter((q) => q.of[q.right] === Math.min(...q.of)).length;
      // chance is 4 of 12: neither the longest nor the shortest may become a tell, whichever way
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeGreaterThanOrEqual(2);
      expect(longest, `${lang}: the longest is right in ${longest} of ${questions.length}`).toBeLessThanOrEqual(5);
      expect(shortest, `${lang}: the shortest is right in ${shortest} of ${questions.length}`).toBeLessThanOrEqual(5);
    }
  });
  it('write French and English together, with the same numbers', () => {
    for (const [where, t] of texts()) {
      expect(t.fr.trim().length, where).toBeGreaterThan(0);
      expect(t.en.trim().length, where).toBeGreaterThan(0);
      expect(numbers(bare(t.fr), 'fr'), where).toEqual(numbers(bare(t.en), 'en'));
      if (t.fr.length > 60 && t.en.length > 60) {
        expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeGreaterThan(0.72);
        expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeLessThan(1.45);
      }
    }
  });
  it('quote no number but the research’s, and mark every other', () => {
    const problems: string[] = [];
    for (const [where, t] of texts()) {
      for (const lang of ['fr', 'en'] as const) {
        const text = bare(t[lang]);
        const re = lang === 'fr' ? /\d+(?: \d{3})*(?:,\d+)?/g : /\d+(?:,\d{3})*(?:\.\d+)?/g;
        for (const m of text.matchAll(re)) {
          const n = numbers(m[0], lang)[0] ?? '';
          const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 14);
          const marked = /^(?: ?(?:°C|°|[\p{L}/%²³·]+)(?:\/\p{L}+)?\d?)?[†*]/u.test(after);
          if (marked) {
            if (!figNumbers.has(n)) problems.push(`${where} (${lang}): marked, no figure: ${m[0]}${after}`);
          } else if (!REPORTED.has(n)) problems.push(`${where} (${lang}): unmarked ${m[0]}${after}`);
        }
      }
    }
    expect(problems.join('\n')).toBe('');
  });
  it('tell the physics as it came out, not the research’s first guess', () => {
    const one = LESSONS[0]!;
    expect(bodyOf(one, 'en')).toMatch(/6\.6 mm†/);
    expect(bodyOf(one, 'fr')).toMatch(/6,6 mm†/);
    expect(bodyOf(one, 'en')).toMatch(/7:10†/);
    const four = LESSONS.find((l) => l.id === 'the-night')!;
    expect(bodyOf(four, 'en')).toMatch(/model’s worst place/);
    expect(bodyOf(four, 'en')).toMatch(/We found no measurement of a flat collector/);
    expect(bodyOf(four, 'en')).toMatch(/beside the bank/);
    expect(bodyOf(four, 'en')).toMatch(/at the coldest point the model finds no gain/);
    for (const [where, t] of texts()) {
      expect(/\b4 mm|\b90 %|\b75 %/.test(t.fr + t.en), where).toBe(false);
    }
  });
  it('say what we found rather than what nobody did, the night’s flow as a mean, and the hours in solar time', () => {
    const claim =
      /personne n’a (rien )?mesuré|nobody has measured|jamais été mesurée|never measured|tous les monoblocs|every compact unit|all compact units/i;
    for (const [where, t] of texts()) expect(t.fr + t.en, where).not.toMatch(claim);
    const four = LESSONS.find((l) => l.id === 'the-night')!;
    expect(bodyOf(four, 'fr')).toMatch(/en moyenne de minuit à l’aube/);
    expect(bodyOf(four, 'en')).toMatch(/as a mean from midnight to dawn/);
    expect(bodyOf(LESSONS[0]!, 'fr')).toMatch(/à l’heure solaire/);
    expect(bodyOf(LESSONS[0]!, 'en')).toMatch(/in solar time/);
  });
  it('name the home builds and the Low-tech Lab once, as pumped, in lesson 1', () => {
    const named = LESSONS.filter((l) => /Low-tech Lab/.test(bodyOf(l, 'en')));
    expect(named.map((l) => l.id)).toEqual(['why-it-climbs']);
    expect(bodyOf(named[0]!, 'en')).toMatch(/driven by a circulator/);
  });
  it('do not repeat the reconstruction, and name no maker', () => {
    for (const [where, t] of texts()) {
      expect(/reconstitution|reconstruction/i.test(t.fr + t.en), where).toBe(false);
      expect(/solahart|302J|keymark/i.test(t.fr + t.en), where).toBe(false);
    }
  });
  it('show no research code and no placeholder, in British English', () => {
    const us = /\b(color|center|aluminum|gray|fiber|liter|organiz|recogniz|analyz|neighbor|labor)\b/i;
    for (const [where, t] of texts()) {
      for (const text of [t.fr, t.en]) {
        expect(text, where).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, where).not.toMatch(/\{\w+\}|undefined|NaN/);
        expect(text, where).not.toMatch(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/);
        expect(text, where).not.toMatch(/ {2,}/);
      }
      expect(us.test(t.en), `${where}: ${t.en.match(us)?.[0]}`).toBe(false);
    }
  });
});
