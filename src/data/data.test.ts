import { describe, expect, it } from 'vitest';
import type { GuideStep, PartInfo } from '@onigam/lab-kit/content';
import { setLang, type L } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { LAB_STRINGS } from '../i18n/ui';
import { installFakeDom } from '../panels/test-dom';
import { PART_NAMES } from '../three/part-ids';
import { WORLD } from '../three/index';
import { checkStandard, STANDARD } from '../standard';
import { SHEETS } from '../drawings';
import { ASSEMBLY, ORIGIN } from './assembly';
import { CHAPTERS, VIDEO_ID } from './chapters';
import { FIG, markOf, type Fig } from './figures';
import { INSTALL } from './install';
import { LESSONS } from './lessons';
import { OVERVIEWS, WORLD_IDS } from './overviews';
import { PARTS } from './parts';
import { DIM_SPECS } from './parts/dim-specs';
import { MAIN_VIDEO, SOURCE_GROUPS, sourcesPanel } from './sources';
import { nEn, nFr } from './units';
import partsHouse from './parts/house.ts?raw';
import partsRig from './parts/rig.ts?raw';
import partsCollector from './parts/collector.ts?raw';
import partsTank from './parts/tank.ts?raw';
import assemblySource from './assembly.ts?raw';
import installSource from './install.ts?raw';
import overviewsSource from './overviews.ts?raw';
import lessonsSource from './lessons.ts?raw';

// Content checks: the catalogue and the guides against the ids of docs/research.md §4, FR/EN parity, the rules of the visitor's texts (no research code, no internal word, the maker named in the Sources only, British spelling, no wording that promises safety), the marks on the numbers, and what must be said once.

const SHEET_SOURCES = import.meta.glob('../drawings/pl*.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const isL = (v: unknown): v is L => typeof v === 'object' && v !== null && 'fr' in v && 'en' in v;

function partTexts(p: PartInfo): [string, L][] {
  const out: [string, L][] = [
    ['name', p.name],
    ['short', p.short],
    ['description', p.description],
    ['material', p.material],
  ];
  if (p.maintenance) out.push(['maintenance', p.maintenance]);
  if (p.tip) out.push(['tip', p.tip]);
  if (p.design) out.push(['design', p.design]);
  const generated = DIM_SPECS[p.id]?.length ?? 0;
  p.specs.slice(0, p.specs.length - generated).forEach((s, i) => {
    out.push([`specs[${i}].label`, s.label]);
    if (isL(s.value)) out.push([`specs[${i}].value`, s.value]);
    else out.push([`specs[${i}].value`, { fr: s.value, en: s.value }]);
  });
  return out;
}

function stepTexts(s: GuideStep): [string, L][] {
  const out: [string, L][] = [
    ['title', s.title],
    ['text', s.text],
  ];
  if (s.tip) out.push(['tip', s.tip]);
  if (s.warning) out.push(['warning', s.warning]);
  return out;
}

/** Every bilingual text of the sheets, the guides, the overviews and the chapters, labelled. The Sources have their own rules. */
function allTexts(): [string, L][] {
  const out: [string, L][] = [];
  for (const p of PARTS) for (const [k, v] of partTexts(p)) out.push([`part ${p.id}.${k}`, v]);
  for (const [guide, steps] of [
    ['assembly', ASSEMBLY],
    ['install', INSTALL],
  ] as const)
    for (const s of steps) for (const [k, v] of stepTexts(s)) out.push([`${guide} ${s.id}.${k}`, v]);
  for (const [world, o] of Object.entries(OVERVIEWS)) {
    out.push([`overview ${world}.title`, o.title]);
    out.push([`overview ${world}.text`, o.text]);
  }
  for (const [ts, fr, en] of CHAPTERS) out.push([`chapter ${ts}`, { fr, en }]);
  return out;
}

/** Numbers of a text, normalised so that the French and English spellings compare equal (7,5 / 7.5, 5 700 / 5,700). */
function numbers(text: string, lang: 'fr' | 'en'): string[] {
  let t = text.replace(/[−–]/g, '-');
  if (lang === 'fr') t = t.replace(/(\d) (\d{3})(?!\d)/g, '$1$2').replace(/(\d),(\d)/g, '$1.$2');
  else t = t.replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
  return (t.match(/\d+(?:\.\d+)?/g) ?? []).sort();
}

/** Names that hold a digit and are no figures. */
const bare = (t: string): string =>
  t
    .replace(/CaCO₃/g, 'CaCO')
    .replace(/\bm²\b/g, 'm2x')
    .replace(/kN\/m²|kWh\/m²|W\/m²K²|W\/m²K|W\/m²|L\/h|L\/min/g, 'unit')
    .replace(/\bR ½|Rp ¾/g, 'thread')
    .replace(/\d{1,2}(?: h |:)\d{2}†/g, 'hour†');

/**
 * The figures REPORTED by a source, written in the text with no mark, each with where it comes from (research numbers). Anything else must carry a mark: `lf` adds it to a placeholder, and the test below catches a number typed by hand.
 */
const REPORTED = new Set(
  [
    '90',
    '100',
    '4', // 90 to 100 % of the latitude, −4 to −5 % (K7)
    '180', // the same maker's one-collector machine (K23)
    '0', // y = 0, the machine's place (K30)
    '1.87',
    '2.003',
    '0.778',
    '6.541',
    '0.025',
    '3.8',
    '35',
    '43',
    '49', // the collector: K4, K17
    '1943',
    '1027',
    '83',
    '0.7',
    '38',
    '3.2',
    '80', // K4
    '0.98',
    '0.96',
    '0.90',
    '0.83',
    '0.69',
    '10',
    '30',
    '50',
    '60',
    '70', // K18 (10° to 70°)
    '6.0',
    '4.0',
    '4.7',
    '5',
    '20', // K19
    '300',
    '417',
    '107',
    '196',
    '515',
    '2.43',
    '2.49',
    '510',
    '2.31',
    '2.5',
    '0.4',
    '150',
    '260',
    '0.62', // K1, K2, K3, K6, §3
    '2.595',
    '45', // K14; 45 K is the difference behind it (§2.9)
    '19',
    '4.5',
    '7',
    '13',
    '22',
    '34', // K5, K12
    '2050',
    '2.05',
    '12',
    '200',
    '1', // K8
    '1.8',
    '2.4',
    '3.6',
    '240',
    '8',
    '15',
    '3', // K9; 8–15 A (§7); 3 for ¾, the 3-bar relief (K42), the 3 mm slider
    '83',
    '95',
    '99',
    '1000',
    '850',
    '680',
    '800',
    '10', // K9, K10, K11
    '56.6',
    '203.6',
    '2',
    '2000', // K13
    '6',
    '24', // 6 months (K16), 24 h (K13, K14)
    '109',
    '3.7', // K42
    '40',
    '600',
    '95',
    '5.5', // K44, K40
    '220', // K25
    '9', // 9 m at most for a drain (§4.5, S7)
    '25',
    '55', // K53, K55
    '56',
    '23', // K51
    '8.7', // K9: 150 L × 50 K, as the manual's own sum (S7)
    '0.671',
    '3.592',
    '0.007', // K25
    '1981', // the year of the model (S17)
    '7000', // kJ, Cyprus (K31)
    '45.3',
    '51.5',
    '65.0',
    '81.4',
    '28.7',
    '34.2',
    '40.4',
    '60.7', // K21
    '1.22',
    '1.83',
    '0.61',
    '0.30',
    '0.90', // the slider's and the sweep's heights (K28, the scenario's y)
    '2023',
    '2013', // the dates of the two documents (K2)
  ].map(String),
);

const figNumbers = new Set(
  Object.values(FIG as Record<string, Fig>).flatMap((f) => [
    numbers(nFr(f.v, f.d), 'fr')[0],
    numbers(nEn(f.v, f.d), 'en')[0],
    ...(f.t ? [...numbers(f.t[0], 'fr'), ...numbers(f.t[1], 'en')] : []),
  ]),
);

const ALL_IDS = PART_NAMES.map((p) => p.id);

describe('parts catalogue', () => {
  it('has exactly the ids of src/three/part-ids.ts, in that order, 51 in all, and the same names', () => {
    expect(PARTS.map((p) => p.id)).toEqual(ALL_IDS);
    expect(ALL_IDS.length).toBe(51);
    for (const p of PARTS) {
      const named = PART_NAMES.find((n) => n.id === p.id)!;
      expect(p.scene, p.id).toBe(named.world);
      expect(p.name.fr, p.id).toBe(named.fr);
      expect(p.name.en, p.id).toBe(named.en);
    }
  });
  it('gives every part the four tabs: an overview, specs, maintenance and design, with a concrete tip', () => {
    for (const p of PARTS) {
      for (const lang of ['fr', 'en'] as const) {
        expect(p.short[lang].length, `${p.id} short`).toBeGreaterThan(40);
        expect(p.description[lang].length, `${p.id} description`).toBeGreaterThan(280);
        expect(p.maintenance?.[lang].length, `${p.id} maintenance`).toBeGreaterThan(120);
        expect(p.design?.[lang].length, `${p.id} design`).toBeGreaterThan(60);
        expect(p.tip?.[lang].length, `${p.id} tip`).toBeGreaterThan(40);
      }
      expect(p.specs.length, `${p.id} specs`).toBeGreaterThanOrEqual(2);
      expect(['hydraulic', 'mechanical', 'electrical', 'structure', 'site'], p.id).toContain(p.category);
    }
  });
  it('opens the maintenance tab on the failure, the check and the care, in that order, in both languages', () => {
    for (const p of PARTS) {
      expect(p.maintenance?.fr.indexOf('**Panne à prévoir.**'), p.id).toBe(0);
      expect(p.maintenance?.fr, p.id).toContain('**À vérifier.**');
      expect(p.maintenance?.fr, p.id).toContain('**Entretien.**');
      expect(p.maintenance?.en.indexOf('**Typical failure.**'), p.id).toBe(0);
    }
  });
  it('reads the dimension rows from dims.ts only: its file types no digit in a value', () => {
    for (const [id, specs] of Object.entries(DIM_SPECS)) {
      expect(ALL_IDS, id).toContain(id);
      expect(specs.length, id).toBeGreaterThan(0);
    }
  });
});

describe('the guides', () => {
  const sceneOf = new Map(PART_NAMES.map((p) => [p.id, p.world]));
  const check = (steps: GuideStep[]): void => {
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length);
    for (const s of steps) {
      expect(s.parts.length, s.id).toBeGreaterThan(0);
      for (const id of s.parts) {
        expect(sceneOf.has(id), `${s.id}: ${id}`).toBe(true);
        expect(sceneOf.get(id), `${s.id}: ${id} is not in ${s.scene}`).toBe(s.scene);
      }
      // what the step installs, it names in bold
      expect(s.text.fr, s.id).toContain('**');
      expect(s.text.en, s.id).toContain('**');
      // no torque, no tool list, no duration: no source has one
      expect(s.torque, s.id).toBeUndefined();
      expect(s.duration, s.id).toBeUndefined();
      expect(s.tools, s.id).toBeUndefined();
    }
  };
  it('run to 20 and 10 steps, each in one world, each with its parts in that world', () => {
    expect(ASSEMBLY.length).toBe(20);
    expect(INSTALL.length).toBe(10);
    check(ASSEMBLY);
    check(INSTALL);
  });
  it('end every step on where it comes from', () => {
    const origins = Object.values(ORIGIN);
    for (const s of [...ASSEMBLY, ...INSTALL]) {
      expect(
        origins.some((o) => s.text.fr.endsWith(o.fr)),
        s.id,
      ).toBe(true);
      expect(
        origins.some((o) => s.text.en.endsWith(o.en)),
        s.id,
      ).toBe(true);
    }
    expect(ASSEMBLY.slice(0, 8).every((s) => s.text.en.endsWith(ORIGIN.reconstruction.en))).toBe(true);
    expect(ASSEMBLY.slice(8).every((s) => s.text.en.endsWith(ORIGIN.reported.en))).toBe(true);
  });
  it('install every part once: the test stand is in no step, and only what the gesture needs comes back', () => {
    const inAssembly = ASSEMBLY.flatMap((s) => s.parts);
    const inInstall = INSTALL.flatMap((s) => s.parts);
    expect(new Set(inAssembly).size).toBe(inAssembly.length);
    const all = new Set([...inAssembly, ...inInstall]);
    expect(all.has('test-stand')).toBe(false);
    for (const id of ALL_IDS) if (id !== 'test-stand') expect(all.has(id), id).toBe(true);
    const twice = inInstall.filter((id, i) => inInstall.indexOf(id) !== i).sort();
    expect(twice).toEqual(['cold-relief-valve', 'roof-unit']);
  });
  it('hold the maker’s order on the roof', () => {
    const at = (id: string): number => ASSEMBLY.findIndex((s) => s.parts.includes(id));
    expect(at('collector-rail')).toBeLessThan(at('collector-left'));
    expect(at('tank-spacer')).toBeLessThan(at('storage-tank'));
    expect(at('cold-pipe')).toBeLessThan(at('hot-pipe'));
    expect(at('water-column')).toBeLessThan(at('overheat-valve'));
    const i = (id: string): number => INSTALL.findIndex((s) => s.parts.includes(id));
    expect(i('roof-structure')).toBeLessThan(i('roof-unit'));
    // power only after filling
    expect(ASSEMBLY.find((s) => s.id === 'fill-water')?.text.en).toMatch(/the tank’s water before the circuit’s fluid/);
    expect(INSTALL.find((s) => s.id === 'power')?.text.en).toMatch(/only once the tank is full/);
  });
  it('say the reading is no procedure once, at the top of each guide', () => {
    const count = (steps: GuideStep[]): number =>
      steps.filter((s) => /no procedure|not a procedure/.test(s.text.en)).length;
    expect(count(ASSEMBLY)).toBe(1);
    expect(count(INSTALL)).toBe(1);
    expect(ASSEMBLY[0]!.text.en).toMatch(/not a procedure/);
    expect(INSTALL[0]!.text.en).toMatch(/no procedure/);
  });
  it('keep the filling of the circuit to trained installers, in the step where it happens', () => {
    const w = ASSEMBLY.find((s) => s.id === 'fill-circuit')!.warning!;
    expect(w.en).toMatch(/trained installers/);
    expect(w.fr).toMatch(/installateurs formés/);
  });
});

describe('the world overviews', () => {
  it('cover the four worlds, named as the 3D names them', () => {
    expect(Object.keys(OVERVIEWS)).toEqual([...WORLD_IDS]);
    expect(Object.keys(WORLD).sort()).toEqual([...WORLD_IDS].sort());
  });
  it('tell the marks once, in the first world', () => {
    const count = Object.values(OVERVIEWS).filter((o) => /The figures/.test(o.text.en)).length;
    expect(count).toBe(1);
    expect(OVERVIEWS.house.text.en).toMatch(/The figures/);
  });
  it('say what each world opens on and what is no source’s: both cut worlds, the bench, the brackets, the dots at night', () => {
    expect(OVERVIEWS.collector.text.en).toMatch(/opens already cut/);
    expect(OVERVIEWS.collector.text.fr).toMatch(/s’ouvre déjà coupé/);
    expect(OVERVIEWS['tank-and-tap'].text.en).toMatch(/opens already cut/);
    expect(OVERVIEWS.rig.text.en).toMatch(/bench is a support of this world, with no source/);
    expect(OVERVIEWS['tank-and-tap'].text.en).toMatch(/wall brackets, a support of this world, with no source/);
    expect(OVERVIEWS.rig.text.en).toMatch(/faster than the truth/);
    expect(OVERVIEWS.rig.text.fr).toMatch(/plus vite que la vérité/);
    expect(OVERVIEWS.collector.text.en).toMatch(/false colour/);
  });
});

describe('what the sheets must say for the 3D to read honest', () => {
  const part = (id: string): PartInfo => PARTS.find((p) => p.id === id)!;
  it('`air-gap` says it has no surface, and that its outline is only a marker', () => {
    expect(part('air-gap').description.en).toMatch(/air has no surface/);
    expect(part('air-gap').description.fr).toMatch(/l’air n’a pas de surface/);
    expect(part('air-gap').short.en).toMatch(/only a marker/);
  });
  it('`collector-rail` says why the unit stands out of square, and that it is the maker’s figure', () => {
    const t = part('collector-rail').description;
    expect(t.en).toMatch(/0\.66°†/);
    expect(t.fr).toMatch(/0,66°†/);
    expect(t.en).toMatch(/no slip of the drawing/);
    expect(t.en).toMatch(/our reading/);
    expect(t.en).toMatch(/raised side, the hot pipe’s, is an estimate/);
  });
  it('`test-stand` says it is no part of the machine, that its staff stays at zero, where it goes below zero and what the model does not count', () => {
    const t = part('test-stand').description;
    expect(part('test-stand').short.en).toMatch(/no part of the machine/);
    expect(t.en).toMatch(/graduated staff/);
    expect(t.en).toMatch(/beside the bank/);
    expect(t.en).toMatch(/−0\.61 m/);
    expect(t.en).toMatch(/about 2\.2 m\* of pipe/);
    expect(t.en).toMatch(/which the model does not count/);
  });
  it('the overheat valve’s place and the reservoir’s mount are marked as estimates', () => {
    expect(part('overheat-valve').description.en).toMatch(/hot outlet, an estimate/);
    expect(part('overflow-reservoir').short.en).toMatch(/mount is ours/);
    expect(part('overflow-reservoir').description.en).toMatch(/our estimate/);
  });
  it('the blue leak, the hydrogen, the scald and the hot discharge are each said where they belong', () => {
    expect(part('mantle-jacket').maintenance?.en).toMatch(/Blue water at the tap means a leak/);
    expect(part('inner-vessel').maintenance?.en).toMatch(/flammable hydrogen/);
    expect(part('tempering-valve').description.en).toMatch(/burns in 2 to 5 seconds/);
    expect(part('tpr-valve').description.en).toMatch(/never on the roof or into a gutter/);
  });
});

describe('the Sources', () => {
  it('credits the main video and the maker, and links every source over https', () => {
    expect(MAIN_VIDEO.href).toContain(VIDEO_ID);
    const links = SOURCE_GROUPS.flatMap((g) => g.links);
    expect(links.length).toBeGreaterThan(30);
    for (const s of [MAIN_VIDEO, ...links]) {
      expect(s.href, String(s.label)).toMatch(/^https:\/\//);
      expect(s.note.fr.length).toBeGreaterThan(15);
      expect(s.note.en.length).toBeGreaterThan(15);
      expect(s.note.fr).not.toBe(s.note.en);
    }
    expect(links.map((s) => s.href).length).toBe(new Set(links.map((s) => s.href)).size);
  });
  it('builds in both languages', () => {
    installFakeDomForPanel();
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      expect(sourcesPanel({ videoUrl: (ts: string) => `#${ts}` } as unknown as AppContext).length).toBeGreaterThan(10);
    }
    setLang('fr');
  });
  it('holds the reconstruction, the machine and the law once', () => {
    const count = (re: RegExp): number => Object.values(LAB_STRINGS).filter(([, en]) => re.test(en)).length;
    expect(count(/independent educational reconstruction/i)).toBe(1);
    expect(count(/Solahart/)).toBe(1);
    expect(count(/gives no legal advice/)).toBe(1);
  });
  it('credits PVGIS as it asks, and calls the bad-tank figures a model', () => {
    const notes = SOURCE_GROUPS.flatMap((g) => g.links.map((s) => s.note.en)).join(' ');
    expect(notes).toMatch(/© European Union/);
    expect(LAB_STRINGS.noticeMarks[1]).toMatch(/asks for its own validation/);
    expect(LAB_STRINGS.noticeMarks[1]).toMatch(/we found no measurement of a flat collector with its tank below it/);
  });
});

describe('the visitor’s texts', () => {
  const texts = allTexts();
  it('say everything in French and English, with no placeholder, no research code and no internal word', () => {
    for (const [where, t] of texts) {
      expect(t.fr.trim().length, where).toBeGreaterThan(0);
      expect(t.en.trim().length, where).toBeGreaterThan(0);
      for (const text of [t.fr, t.en]) {
        expect(text, where).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, where).not.toMatch(/\{\w+\}|undefined|\bNaN\b|TODO|FIXME|lorem/);
        expect(text, where).not.toMatch(/\bworld id\b|\bpreset id\b/i);
        expect(text, where).not.toMatch(/[A-Za-zÀ-ÿ]'[A-Za-zÀ-ÿ]/);
        expect(text, where).not.toMatch(/ {2,}/);
      }
    }
  });
  it('name the maker nowhere but the Sources', () => {
    for (const [where, t] of texts)
      for (const text of [t.fr, t.en]) expect(text, where).not.toMatch(/solahart|302J|hartgard|ICC-SRCC|keymark/i);
  });
  it('promise no safety: nothing is called safe, guaranteed or without danger', () => {
    const promise = /\bsafely\b|\bis safe\b|guarantee|sans danger|en toute sécurité|garanti/i;
    for (const [where, t] of texts) for (const text of [t.fr, t.en]) expect(text, where).not.toMatch(promise);
  });
  const part = (id: string) => PARTS.find((p) => p.id === id)!;
  it('claim no universal the research does not hold, and give no path of dots a colour of its own', () => {
    const claim =
      /personne n’a (rien )?mesuré|nobody has measured|tous les monoblocs|every compact unit|all compact units|deux couleurs|two colours/i;
    for (const [where, t] of texts) for (const text of [t.fr, t.en]) expect(text, where).not.toMatch(claim);
    expect(part('drain-outlet').description.fr).toMatch(/une goutte à cet endroit est normale/);
    expect(part('drain-outlet').description.en).toMatch(/a drip at this spot is normal/);
    expect(part('drain-outlet').description.en).not.toMatch(/all is well/);
  });
  it('name the X-ray tool as the kit’s button does in French, and say what it shows with the sheet open', () => {
    for (const [where, t] of texts) expect(t.fr, where).not.toMatch(/x-ray/i);
    for (const id of ['glass-cover', 'collector-link', 'outer-case']) {
      expect(part(id).tip?.fr, id).toMatch(/l’outil Transparence ne garde en plein que/);
      expect(part(id).tip?.fr, id).toMatch(/Fermez la fiche/);
      expect(part(id).tip?.en, id).toMatch(/X-ray keeps only/);
      expect(part(id).tip?.en, id).toMatch(/Close the sheet/);
    }
  });
  it('give the night’s flow as a mean, and the hours of first light in solar time', () => {
    const hot = part('hot-pipe');
    expect(hot.description.fr).toMatch(/en moyenne de minuit à l’aube/);
    expect(hot.description.en).toMatch(/as a mean from midnight to dawn/);
    expect(hot.tip?.fr).toMatch(/à l’heure solaire/);
    expect(hot.tip?.en).toMatch(/in solar time/);
  });
  it('write British English', () => {
    const us = /\b(color|center|aluminum|gray|fiber|liter|organiz|recogniz|analyz|neighbor|labor|vapor)\b/i;
    for (const [where, t] of texts) expect(us.test(t.en), `${where}: ${t.en}`).toBe(false);
  });
  it('carry the same numbers in French and in English', () => {
    for (const [where, t] of texts) expect(numbers(bare(t.fr), 'fr'), where).toEqual(numbers(bare(t.en), 'en'));
  });
  it('have the same level of detail in both', () => {
    for (const [where, t] of texts) {
      if (t.fr.length < 60 || t.en.length < 60) continue;
      expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeGreaterThan(0.72);
      expect(t.fr.length / t.en.length, `${where}: ${t.fr.length} / ${t.en.length}`).toBeLessThan(1.45);
    }
  });
  it('are not one language in both: only a unit or a name may read the same', () => {
    for (const [where, t] of texts) {
      if (t.fr === t.en) expect(t.fr.split(/\s+/).length, `${where}: ${t.fr}`).toBeLessThanOrEqual(5);
    }
  });
  it('quote no number but the research’s, and mark every other', () => {
    const problems: string[] = [];
    for (const [where, t] of texts) {
      if (where.startsWith('chapter')) continue;
      for (const lang of ['fr', 'en'] as const) {
        const text = bare(t[lang]);
        const re = lang === 'fr' ? /\d+(?: \d{3})*(?:,\d+)?/g : /\d+(?:,\d{3})*(?:\.\d+)?/g;
        for (const m of text.matchAll(re)) {
          const n = numbers(m[0], lang)[0] ?? '';
          const after = text.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 12);
          const marked = /^(?: ?(?:°C|°|[\p{L}/%²³·]+)(?:\/\p{L}+)?\d?)?(?: h)?[†*]/u.test(after);
          if (marked) {
            if (!figNumbers.has(n)) problems.push(`${where} (${lang}): marked but no figure ${m[0]}${after}`);
          } else if (!REPORTED.has(n)) problems.push(`${where} (${lang}): unmarked ${m[0]}${after}`);
        }
      }
    }
    expect(problems.join('\n')).toBe('');
  });
  it('type no marked number by hand: every † and * comes from a figure of figures.ts', () => {
    for (const [name, src] of [
      ['house', partsHouse],
      ['rig', partsRig],
      ['collector', partsCollector],
      ['tank', partsTank],
      ['assembly', assemblySource],
      ['install', installSource],
      ['overviews', overviewsSource],
      ['lessons', lessonsSource],
    ] as const) {
      const code = src.replace(/^\s*\/\/.*$/gm, '');
      expect(code.match(/\d[^'’\s]{0,8}\s?[a-zA-Z/²%]{0,6}[†*](?!\*)/g) ?? [], name).toEqual([]);
    }
  });
  it('use every figure of the table, in a text or on a sheet, and each with the mark of its status', () => {
    const used = [
      partsHouse,
      partsRig,
      partsCollector,
      partsTank,
      assemblySource,
      installSource,
      overviewsSource,
      lessonsSource,
      ...Object.values(SHEET_SOURCES),
    ].join(' ');
    const unused = Object.keys(FIG).filter((k) => !used.includes(`{${k}}`) && !used.includes(`'${k}'`));
    expect(unused).toEqual([]);
    for (const f of Object.values(FIG as Record<string, Fig>)) {
      expect(markOf(f.s)).toBe(f.s === 'derived' || f.s === 'model' ? '†' : '*');
    }
  });
});

describe('the standard, on the data alone (src/lab.ts is the lead’s to wire)', () => {
  it('meets the bar: 4 worlds, 36 parts, 20 and 10 steps, 6 lessons, 12 questions, 8 sheets', () => {
    const missing = checkStandard({
      worlds: Object.keys(WORLD),
      parts: PARTS.length,
      assembly: ASSEMBLY.length,
      install: INSTALL.length,
      lessons: LESSONS.length,
      quiz: LESSONS.reduce((n, les) => n + (les.quiz?.length ?? 0), 0),
      sheets: SHEETS.length,
      narration: { fr: 999, en: 999 },
      readmeBilingual: true,
      labJsonFilled: true,
    });
    expect(missing).toEqual([]);
    expect(PARTS.length).toBeGreaterThanOrEqual(STANDARD.parts);
    expect(SHEETS.length).toBeGreaterThanOrEqual(STANDARD.sheets);
  });
});

function installFakeDomForPanel(): void {
  installFakeDom();
}
