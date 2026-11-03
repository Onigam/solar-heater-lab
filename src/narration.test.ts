import { readManifest, validateManifest } from '@onigam/lab-kit/narration';
import type { SceneModule } from '@onigam/lab-kit/three';
import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ROOF_NUMBERS } from './data/dims-read';
import { FIG, YEAR_TABLE } from './data/figures';
import { LESSONS } from './data/lessons';
import { WORLD_IDS, type WorldId } from './data/overviews';
import { PARTS } from './data/parts';
import { SHEETS } from './drawings';
import { PANEL_STRINGS } from './panels/strings';
import { DEFAULT_TIME_SCALE, presetParams, SCENARIO_IDS } from './sim/presets';
import { SCENARIO_TEXTS } from './sim/texts';
import type { SolarState } from './sim/types';
import { WORLD } from './three';
import { createCollectorScene } from './three/collector/scene';
import { dotSpeed, MIN_SPEED } from './three/flows';
import { createHouseScene } from './three/house/scene';
import { PART_NAMES } from './three/part-ids';
import { createRigScene } from './three/rig/scene';
import { createTankScene } from './three/tank/scene';
import { stateWith, view } from './three/test-utils';

// The spoken guide: the scripts (narration/<lang>.json) and the manifests generated from them (public/audio/<lang>) must agree with the lab's worlds, parts and modes, say each of the
// lab's truths once, say today's figures, name only the tools a world has, and point only at what can be seen from where the camera goes. The audio files are only listed, never loaded.

const sceneIds: string[] = [...WORLD_IDS];
const partIds: string[] = PARTS.map((p) => p.id);
const worldOf = (partId: string): string | undefined => PARTS.find((p) => p.id === partId)?.scene;

const CUE = /\[\[([a-z]+)(?::([^\]]*))?\]\]/g;
const BOOLEAN_CUES = ['xray', 'cutaway', 'flows', 'isolate'];
const MODES = ['explore', 'assembly', 'install', 'sim', 'plans', 'lessons'];
const CAMERA_CUES = ['home', 'scene', 'frame', 'select'];
/** Ceiling set by the owner for the spoken characters of one language. */
const BUDGET = 30_000;
/** What this lab's guide aims for: the research said about 20,000, the series 17,000 to 24,000. */
const AIM = [19_000, 24_000] as const;
/** generate.mjs refuses a longer segment. */
const SEGMENT_CAP = 2_500;
/** This lab's guide is in the local voice (generate.mjs --engine voicebox): a change of voice must be a decision, not an accident. */
const LOCAL_VOICE = 'qwen3-tts-1.7B';

interface Segment {
  id: string;
  scope: string;
  title: string;
  scene: string;
  text: string;
}
interface Script {
  lang: string;
  segments: Segment[];
}
type Lang = 'fr' | 'en';

const langOf = (path: string, folder: RegExp): string => folder.exec(path)![1]!;
const scripts = Object.fromEntries(
  Object.entries(
    import.meta.glob('../narration/*.json', { import: 'default', eager: true }) as Record<string, Script>,
  ).map(([path, script]) => [langOf(path, /\/(\w+)\.json$/), script]),
);
const manifests = Object.fromEntries(
  Object.entries(import.meta.glob('../public/audio/*/manifest.json', { import: 'default', eager: true })).map(
    ([path, raw]) => [langOf(path, /\/audio\/(\w+)\//), raw],
  ),
);
const audioFiles = Object.keys(import.meta.glob('../public/audio/*/*.mp3'));

const spokenOf = (s: Pick<Segment, 'text'>): string => s.text.replace(CUE, '').replace(/\s+/g, ' ').trim();

/**
 * Each truth of the lab, said in one segment and no other (the owner, of the disclaimers: « à chaque fois c'est un peu chiant »).
 * Regular expressions per language; the segment is the only one allowed.
 */
const ONCE: Record<Lang, Record<string, [RegExp, string]>> = {
  fr: {
    reconstruction: [/reconstitution pédagogique/i, 'intro'],
    realMachine: [/une vraie machine/i, 'intro'],
    noPlan: [/ni un plan/i, 'intro'],
    figures: [/les chiffres viennent/i, 'intro'],
    calculations: [/des calculs, pas des mesures/i, 'intro'],
    notTheWater: [/ce n’est pas l’eau que vous buvez/i, 'intro'],
    oneMachine: [/dessine toujours cette machine/i, 'intro'],
    aYear: [/un essai plus un calcul/i, 'scene-house'],
    benchNoSource: [/ce support-là n’a pas de source/i, 'scene-rig'],
    clock: [/une heure par seconde/i, 'scene-rig'],
    trueSpeedByDay: [/à leur vraie vitesse/i, 'scene-rig'],
    fasterAtNight: [/plus vite que la vérité/i, 'scene-rig'],
    worstTank: [/la pire place/i, 'scene-rig'],
    the1981Model: [/mil neuf cent quatre-vingt-un/i, 'scene-rig'],
    noMeasurementFound: [/aucune mesure/i, 'scene-rig'],
    falseColour: [/fausses couleurs/i, 'scene-collector'],
    bracketsNoSource: [/consoles/i, 'scene-tank-and-tap'],
    skySum: [/calcul du ciel/i, 'part-test-stand'],
    detour: [/détour de tuyau/i, 'part-test-stand'],
    noSurface: [/l’air n’a pas de surface/i, 'part-air-gap'],
    firstCrystals: [/premiers cristaux/i, 'part-lower-header'],
    roofAndWeight: [/engin de levage/i, 'part-roof-structure'],
    mainsCurrent: [/courant du réseau/i, 'part-meter-box'],
    trained: [/installateurs formés/i, 'part-fill-port'],
    hydrogen: [/hydrogène/i, 'part-inner-vessel'],
    blueLeak: [/eau bleue/i, 'part-mantle-jacket'],
    hotDischarge: [/jamais sur le toit/i, 'part-tpr-valve'],
    scald: [/se brûle/i, 'part-tempering-valve'],
    testBeforeEntering: [/testez toujours/i, 'part-tempering-valve'],
    pencil: [/crayon/i, 'part-hot-pipe'],
  },
  en: {
    reconstruction: [/educational reconstruction/i, 'intro'],
    realMachine: [/a real machine/i, 'intro'],
    noPlan: [/neither a plan/i, 'intro'],
    figures: [/the figures come from/i, 'intro'],
    calculations: [/calculations, not measurements/i, 'intro'],
    notTheWater: [/not the water you drink/i, 'intro'],
    oneMachine: [/always draws this one machine/i, 'intro'],
    aYear: [/a test plus a calculation/i, 'scene-house'],
    benchNoSource: [/that support has no source/i, 'scene-rig'],
    clock: [/an hour a second/i, 'scene-rig'],
    trueSpeedByDay: [/at their true speed/i, 'scene-rig'],
    fasterAtNight: [/faster than the truth/i, 'scene-rig'],
    worstTank: [/the worst place/i, 'scene-rig'],
    the1981Model: [/nineteen eighty-one/i, 'scene-rig'],
    noMeasurementFound: [/we found no measurement/i, 'scene-rig'],
    falseColour: [/false colour/i, 'scene-collector'],
    bracketsNoSource: [/brackets/i, 'scene-tank-and-tap'],
    skySum: [/sum for the sky/i, 'part-test-stand'],
    detour: [/detour of pipe/i, 'part-test-stand'],
    noSurface: [/air has no surface/i, 'part-air-gap'],
    firstCrystals: [/first crystals/i, 'part-lower-header'],
    roofAndWeight: [/lifting device/i, 'part-roof-structure'],
    mainsCurrent: [/mains current/i, 'part-meter-box'],
    trained: [/trained installers/i, 'part-fill-port'],
    hydrogen: [/hydrogen/i, 'part-inner-vessel'],
    blueLeak: [/blue water/i, 'part-mantle-jacket'],
    hotDischarge: [/never on the roof/i, 'part-tpr-valve'],
    scald: [/\bburns?\b in/i, 'part-tempering-valve'],
    testBeforeEntering: [/always test/i, 'part-tempering-valve'],
    pencil: [/pencil/i, 'part-hot-pipe'],
  },
};

/**
 * Never said, anywhere: a promise (a reviewer's find on the last two labs), a figure the physics withdrew (docs/physics.md §8: the push is not 4 mm, the worst tank is not at −1.22 m), the roadmap's stale figures, or
 * « two colours » for the two paths of `tank-and-tap`: `FlowDots` colours every dot by its temperature, so no path has a colour of its own.
 */
const REFUSED: Record<Lang, RegExp> = {
  fr: /sans danger|sans risque|en toute sécurité|(?<!\p{L})sûre?s?(?!\p{L})|garanti|protég|tout va bien|veille sur|quatre millimètres d’eau|quarante pascals|un mètre vingt-deux|dix-huit pouces|cent pour cent|quatre-vingt-dix pour cent|temps réel|deux couleurs|personne n’a mesuré/iu,
  en: /without danger|no risk|without risk|\bsafely\b|\bsafe\b|guarantee|protect|all is well|watch over|four millimetres of water|forty pascals|one point two two|eighteen inches|a hundred per cent|ninety per cent|real time|two colours|nobody has measured/i,
};

/** A figure of the sheets, as the voice rounds it, and where the voice says it, with the words that say if it is an instant or a mean: if the physics moves, this says which segments to rewrite. */
const FIGURES: [value: number, said: number, fr: RegExp, en: RegExp, id: string][] = [
  // at noon on a clear June day, at Athens: an instant
  [
    FIG.pushMm.v,
    6.6,
    /vers midi, par ciel clair, notre modèle trouve une poussée de six virgule six millimètres d’eau/i,
    /around noon, under a clear sky, our model finds a push of six point six millimetres of water/i,
    'part-hot-pipe',
  ],
  [FIG.pushMm.v, 6.6, /six virgule six millimètres d’eau/, /six point six millimetres of water/, 'intro'],
  [
    FIG.peakFlow.v,
    132,
    /cent trente-deux litres par heure/,
    /a hundred and thirty-two litres an hour/,
    'part-hot-pipe',
  ],
  [FIG.gainStart.v, 4.858, /quatre heures cinquante/, /ten to five/, 'part-hot-pipe'],
  [FIG.flowStart.v, 7.133, /sept heures dix/, /ten past seven/, 'part-hot-pipe'],
  // the mean from midnight to 04:30 (`nightFlow` of runs.ts), which must say so
  [
    Math.abs(FIG.nightFlow.v),
    1.5,
    /un litre et demi par heure, en moyenne de minuit à l’aube/,
    /a litre and a half an hour, as a mean from midnight to dawn/,
    'part-hot-pipe',
  ],
  [FIG.pipeSpeed.v, 12, /douze centimètres par seconde à midi/, /twelve centimetres a second at noon/, 'scene-rig'],
  [
    FIG.riserSpeed.v,
    1.4,
    /vers midi.*un virgule quatre centimètre/i,
    /around noon.*one point four centimetres/i,
    'part-riser-tube',
  ],
  [FIG.loopTurn.v, 9, /au débit de midi.*neuf minutes/i, /at noon’s flow.*nine minutes/i, 'part-cold-pipe'],
  // the sheets' sweep: one clear June night at Athens, by height
  [FIG.lostP061.v, 1.1, /un virgule un pour cent/, /one point one per cent/, 'part-test-stand'],
  [FIG.lostM03Pct.v, 13.7, /treize virgule sept/, /thirteen point seven/, 'part-test-stand'],
  [FIG.lostM061Pct.v, 15.3, /quinze virgule trois/, /fifteen point three/, 'part-test-stand'],
  [FIG.skin0.v, 0.86, /zéro virgule quatre-vingt-six/, /zero point eight six/, 'part-tank-foam'],
  [FIG.lost0.v, 0.45, /zéro virgule quarante-cinq/, /zero point four five/, 'part-tank-foam'],
  [Math.abs(FIG.cliffY.v), 0.6, /plus bas, le jour s’arrête/i, /lower still, the day stops/i, 'part-test-stand'],
  [FIG.depression.v, 5.4, /cinq virgule quatre degrés/, /five point four degrees/, 'part-absorber-plate'],
  [FIG.frostWater.v, 5.6, /cinq virgule six degrés d’air/, /five point six degrees of air/, 'part-lower-header'],
  [Math.abs(FIG.frostMix.v), 3.2, /moins trois virgule deux/, /minus three point two/, 'part-lower-header'],
  [FIG.topEvening.v, 72.5, /soixante-douze degrés et demi/, /seventy-two and a half degrees/, 'part-water-column'],
  [FIG.bottomEvening.v, 46.6, /près de quarante-sept/, /nearly forty-seven/, 'part-water-column'],
  [FIG.topMorning.v, 68.1, /à l’aube.*soixante-huit/i, /at dawn.*sixty-eight/i, 'part-water-column'],
  [FIG.holidayNoValve.v, 94, /quatre-vingt-quatorze/, /ninety-four/, 'part-overheat-valve'],
  [FIG.holidayValve.v, 85, /quatre-vingt-cinq avec/, /eighty-five with/, 'part-overheat-valve'],
  [FIG.holidayCollector.v, 116, /cent seize/, /a hundred and sixteen/, 'part-overheat-valve'],
  [FIG.narrow3Flow.v, 53, /cinquante-trois litres par heure/, /fifty-three litres an hour/, 'part-riser-tube'],
  [FIG.narrow3Day.v, 3, /trois pour cent/, /three per cent/, 'part-riser-tube'],
  [FIG.narrow3Year.v, 8, /l’année huit/, /eight over the year/, 'part-riser-tube'],
  [FIG.drawFraction.v, 61, /soixante et un/, /sixty-one/, 'part-cold-diffuser'],
  [FIG.mixedYear.v, 12, /douze pour cent de son année/, /twelve per cent of its year/, 'part-hot-outlet'],
  [FIG.boostHours.v, 2.8, /deux virgule huit heures/, /two point eight hours/, 'part-booster-element'],
  // arithmetic on what the maker gives
  [FIG.expansionL.v, 8.6, /huit virgule six litres/, /eight point six litres/, 'part-drain-outlet'],
  [FIG.glycolPct.v, 24, /vingt-quatre pour cent/, /twenty-four per cent/, 'part-fill-port'],
  [Math.abs(FIG.glycolFreeze.v), 9.2, /moins neuf virgule deux/, /minus nine point two/, 'part-fill-port'],
  [FIG.jacketL.v, 10, /dix litres/, /ten litres/, 'part-mantle-jacket'],
  [FIG.fourPeople.v, 190, /cent quatre-vingt-dix litres/, /a hundred and ninety litres/, 'part-shower-head'],
  [
    FIG.crossK.v,
    25,
    /vingt-cinq degrés au-dessus de l’air/,
    /twenty-five degrees above the air/,
    'part-absorber-plate',
  ],
  [FIG.crossG.v, 800, /huit cents watts/, /eight hundred watts/, 'part-absorber-plate'],
  [
    (ROOF_NUMBERS.massFull / (2.43 * 2.49)) | 0,
    85,
    /quatre-vingt-cinq kilos par mètre carré/,
    /eighty-five kilos a square metre/,
    'part-roof-structure',
  ],
  // estimates, each said to be one
  [FIG.riserBore.v, 7, /sept millimètres, c’est une estimation/, /seven millimetres is an estimate/, 'part-riser-tube'],
  [FIG.headerBore.v, 27, /vingt-sept millimètres/, /twenty-seven millimetres/, 'part-upper-header'],
  [FIG.foamThick.v, 25, /environ vingt-cinq millimètres/, /about twenty-five millimetres/, 'part-tank-foam'],
  [FIG.yBand.v, 5, /cinq centimètres près/, /within five centimetres/, 'part-tank-spacer'],
  [
    FIG.timerFrom.v,
    16,
    /de seize à dix-neuf heures : une hypothèse/,
    /from four to seven in the afternoon: an assumption/,
    'part-meter-box',
  ],
  [
    FIG.timerTo.v,
    19,
    /de seize à dix-neuf heures : une hypothèse/,
    /from four to seven in the afternoon: an assumption/,
    'part-meter-box',
  ],
  // reported, and what the sheets print: at 200 L a day, the year's share of the published table
  [
    YEAR_TABLE.find((r) => r.site === 'stockholm')!.rows[0]![1],
    45.3,
    /quarante-cinq pour cent à Stockholm/,
    /forty-five per cent at Stockholm/,
    'scene-house',
  ],
  [
    YEAR_TABLE.find((r) => r.site === 'athens')!.rows[0]![1],
    81.4,
    /quatre-vingt-un à Athènes/,
    /eighty-one at Athens/,
    'scene-house',
  ],
  [ROOF_NUMBERS.massFull, 515, /cinq cent quinze kilos/i, /five hundred and fifteen kilos/i, 'part-roof-structure'],
  [ROOF_NUMBERS.tankFull, 417, /quatre cent dix-sept/, /four hundred and seventeen/, 'part-storage-tank'],
];

describe('narration wiring', () => {
  // the lab asks for the manifests only once the audio is generated
  it.skipIf(Object.keys(manifests).length === 0)('asks for the manifest of the interface language', async () => {
    const { lab } = await import('./lab');
    expect(lab.narration?.manifest).toBe('audio/{lang}/manifest.json');
  });
});

describe('the contract', () => {
  it('has 4 worlds and 51 parts, so 56 segments per language, in French and in English', () => {
    expect(sceneIds).toHaveLength(4);
    expect(partIds).toHaveLength(51);
    expect(Object.keys(scripts).sort()).toEqual(['en', 'fr']);
    for (const lang of Object.keys(scripts)) expect(scripts[lang]!.segments, lang).toHaveLength(1 + 4 + 51);
  });
});

describe.each(Object.keys(scripts))('narration script %s', (lang) => {
  const script = scripts[lang]!;
  const i = lang === 'fr' ? 0 : 1;
  const seg = (id: string): Segment => script.segments.find((s) => s.id === id)!;
  const where = (re: RegExp): string[] => script.segments.filter((s) => re.test(spokenOf(s))).map((s) => s.id);

  it('has the lab language and a segment for the intro, every world and every part, once each', () => {
    expect(script.lang).toBe(lang);
    const scopes = script.segments.map((s) => s.scope);
    expect(new Set(scopes).size).toBe(scopes.length);
    expect(new Set(script.segments.map((s) => s.id)).size).toBe(script.segments.length);
    expect([...scopes].sort()).toEqual(
      ['intro', ...sceneIds.map((id) => `scene:${id}`), ...partIds.map((id) => `part:${id}`)].sort(),
    );
  });

  it('names its segments intro, scene-<world> and part-<id>, titles a part by its sheet, and shows the voice label', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      expect(s.id, s.scope).toBe(kind === 'intro' ? 'intro' : `${kind === 'part' ? 'part' : 'scene'}-${id}`);
      expect(s.title.trim().length, s.id).toBeGreaterThan(2);
      expect(s.title, s.id).not.toMatch(/\d/);
      expect(spokenOf(s).length, s.id).toBeGreaterThan(200);
      if (kind === 'part') expect(s.title, s.id).toBe(PART_NAMES.find((p) => p.id === id)![lang as Lang]);
    }
    expect(script).toHaveProperty('voiceLabel.fr', 'Voix de synthèse');
    expect(script).toHaveProperty('voiceLabel.en', 'Synthetic voice');
  });

  it('starts every segment in the right world', () => {
    for (const s of script.segments) {
      const [kind, id = ''] = s.scope.split(':');
      const expected = kind === 'part' ? worldOf(id) : kind === 'scene' ? id : 'house';
      expect(s.scene, s.id).toBe(expected);
    }
  });

  it('writes only cues the app knows, on worlds, parts and modes of the lab', () => {
    for (const s of script.segments) {
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        const at = `${s.id}: [[${name}${arg ? ':' + arg : ''}]]`;
        if (name === 'home') expect(arg, at).toBe('');
        else if (name === 'scene') expect(sceneIds, at).toContain(arg);
        else if (name === 'frame') for (const id of arg.split(',')) expect(partIds, at).toContain(id);
        else if (name === 'select') expect([...partIds, 'none'], at).toContain(arg);
        else if (name === 'explode') {
          expect(Number(arg), at).toBeGreaterThanOrEqual(0);
          expect(Number(arg), at).toBeLessThanOrEqual(1);
        } else if (BOOLEAN_CUES.includes(name)) expect(['on', 'off'], at).toContain(arg);
        else if (name === 'mode') expect(MODES, at).toContain(arg);
        // no `lab:` cue: src/lab.ts defines no narration.onCue, so the voice cannot set the hour or the tank's height (README)
        else expect.fail(`${at}: unknown cue`);
      }
    }
  });

  it('frames only parts of the current world and switches off what it switches on', () => {
    for (const s of script.segments) {
      let world = s.scene;
      const on = new Set<string>();
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg;
        if (name === 'frame') for (const id of arg.split(',')) expect(worldOf(id), `${s.id}: frame ${id}`).toBe(world);
        if (name === 'select' && arg !== 'none') expect(worldOf(arg), `${s.id}: select ${arg}`).toBe(world);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
      }
      expect([...on], `${s.id} leaves cues on`).toEqual([]);
    }
  });

  it('uses only the tools of the world it is in (src/three/index.ts), and never one that hides what the other shows', () => {
    for (const s of script.segments) {
      let world = s.scene as WorldId;
      const on = new Set<string>();
      for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
        if (name === 'scene') world = arg as WorldId;
        if (name === 'cutaway' && arg === 'on') expect(WORLD[world].cutaway, `${s.id}: section in ${world}`).toBe(true);
        // the house does not come apart, and its X-ray needs a part selected
        if (name === 'explode' && Number(arg) > 0) expect(world, `${s.id}: explode in the house`).not.toBe('house');
        if (name === 'xray' && arg === 'on' && world === 'house')
          expect(s.scope, `${s.id}: X-ray with nothing selected`).toMatch(/^part:/);
        if (name === 'isolate' && arg === 'on') expect(s.scope, `${s.id}: isolate needs a selection`).toMatch(/^part:/);
        if (BOOLEAN_CUES.includes(name)) {
          if (arg === 'on') on.add(name);
          else on.delete(name);
        }
        if (name === 'explode') {
          if (Number(arg) === 0) on.delete(name);
          else on.add(name);
        }
        // the dots stand down in an exploded view, and the jacket's under the section across
        expect(on.has('flows') && on.has('explode'), `${s.id}: flows under explode`).toBe(false);
        if (world === 'tank-and-tap')
          expect(on.has('flows') && on.has('cutaway'), `${s.id}: flows under the section`).toBe(false);
      }
    }
  });

  it('names a tool of the toolbar only in a world that has it, and only when it switches it on', () => {
    const tools = {
      fr: { section: /\bCoupe\b/, explode: /Éclaté/, xray: /Transparence/, flows: /\bFlux\b/ },
      en: { section: /\bSection\b/, explode: /\bExplode\b/, xray: /\bX-ray\b/, flows: /\bFlows\b/ },
    }[lang as Lang];
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      if (tools.section.test(spoken)) {
        expect(s.scene, s.id).not.toBe('house');
        expect(s.scene, s.id).not.toBe('rig');
        expect(s.text, s.id).toContain('[[cutaway:on]]');
      }
      if (tools.flows.test(spoken)) expect(s.text, s.id).toContain('[[flows:on]]');
      if (tools.explode.test(spoken)) expect(s.scene, s.id).not.toBe('house');
      if (tools.xray.test(spoken)) expect(s.text, s.id).toContain('[[xray:on]]');
    }
  });

  it('says of the flows of the house and of the tap what they do: they move only when a tap draws', () => {
    const tap = { fr: /quand un robinet tire/, en: /when a tap draws/ }[lang as Lang];
    expect(where(tap)).toEqual(['scene-house', 'scene-tank-and-tap', 'part-hot-line']);
  });

  it('keeps a part segment framed by itself: no camera cue, no change of world or mode', () => {
    for (const s of script.segments.filter((x) => x.scope.startsWith('part:'))) {
      const camera = [...s.text.matchAll(CUE)].filter((m) => CAMERA_CUES.includes(m[1] ?? '') || m[1] === 'mode');
      expect(
        camera.map((m) => m[0]),
        s.id,
      ).toEqual([]);
    }
  });

  it('moves the camera at most once every 35 spoken characters', () => {
    for (const s of script.segments) {
      let last: { at: number; cue: string } | undefined;
      for (const m of s.text.matchAll(CUE)) {
        if (!CAMERA_CUES.includes(m[1] ?? '')) continue;
        const at = spokenOf({ text: s.text.slice(0, m.index) }).length;
        if (last) expect(at - last.at, `${s.id}: ${last.cue} then ${m[0]}`).toBeGreaterThanOrEqual(35);
        last = { at, cue: m[0] };
      }
    }
  });

  it('hops through the worlds and the modes in the introduction, and ends on the house, nothing selected', () => {
    const cues = [...seg('intro').text.matchAll(CUE)].map((m) => m[0]);
    for (const w of sceneIds) if (w !== 'house') expect(cues, w).toContain(`[[scene:${w}]]`);
    const modes = cues.filter((c) => c.startsWith('[[mode:'));
    expect(modes).toEqual(['assembly', 'install', 'sim', 'lessons', 'plans', 'explore'].map((m) => `[[mode:${m}]]`));
    expect(cues.slice(-2)).toEqual(['[[scene:house]]', '[[select:none]]']);
  });

  it('counts in the introduction what the lab has', () => {
    const intro = spokenOf(seg('intro'));
    expect(SCENARIO_IDS).toHaveLength(12);
    expect(LESSONS).toHaveLength(6);
    expect(SHEETS).toHaveLength(10);
    const counts = {
      fr: [/douze scénarios/, /six leçons/i, /dix planches/i, /quatre vues/],
      en: [/twelve scenarios/, /six lessons/i, /ten sheets/i, /four views/],
    }[lang as Lang];
    for (const re of counts) expect(intro).toMatch(re);
  });

  it('gives each world a home view first and walks through its parts', () => {
    for (const w of sceneIds) {
      const text = seg(`scene-${w}`).text;
      expect(text.startsWith('[[home]]'), w).toBe(true);
      const framed = new Set([...text.matchAll(/\[\[frame:([^\]]*)\]\]/g)].flatMap((m) => m[1]!.split(',')));
      expect(framed.size, `${w} frames at least 5 parts`).toBeGreaterThanOrEqual(5);
    }
  });

  it('carries each truth of the lab once, in its place, and never again', () => {
    for (const [truth, [re, id]] of Object.entries(ONCE[lang as Lang])) expect(where(re), truth).toEqual([id]);
  });

  it('never makes a promise, and never says what the physics withdrew', () => {
    expect(where(REFUSED[lang as Lang])).toEqual([]);
  });

  it('says only today’s figures, and says of a figure if it is an instant or a mean', () => {
    const k = lang === 'fr' ? 2 : 3;
    for (const row of FIGURES) {
      const [value, said] = row;
      const re = row[k] as RegExp;
      expect(Math.abs(value - said), `${re} against ${value}`).toBeLessThanOrEqual(Math.max(0.5, said * 0.01));
      expect(where(re), String(re)).toContain(row[4]);
    }
  });

  it('says of the dots what they do: true by day, faster than the truth at night', () => {
    expect(DEFAULT_TIME_SCALE, 'the voice says « an hour a second »').toBe(3600);
    // about 12 cm/s at noon, the true speed
    expect(dotSpeed(0.12, 1)).toBe(0.12);
    // a night's 1.5 L/h in a 20 mm bore is about 1.3 mm/s: the dots run at their floor
    expect(Math.abs(dotSpeed(-0.0013, -1))).toBe(MIN_SPEED);
    expect(MIN_SPEED).toBeGreaterThan(0.0013);
  });

  it('never says a measurement it does not have: the word only denies one, names what a tool does, or tells the others’ tests', () => {
    const measured = { fr: /mesur/i, en: /measur/i }[lang as Lang];
    const allowed = {
      fr: [
        'intro',
        'scene-house',
        'scene-rig',
        'part-collector-rail',
        'part-upper-header',
        'part-tank-thermostat',
        'part-cold-diffuser',
      ],
      en: [
        'intro',
        'scene-house',
        'scene-rig',
        'part-collector-rail',
        'part-upper-header',
        'part-tank-thermostat',
        'part-cold-diffuser',
      ],
    }[lang as Lang];
    expect(where(measured)).toEqual(allowed);
  });

  it('does not hang a hedge on every figure', () => {
    const inTheModel = { fr: /dans le modèle/i, en: /in the model/i }[lang as Lang];
    expect(where(inTheModel)).toEqual([]);
    const ours = {
      fr: /notre (modèle|simulation|estimation)|le modèle|nos calculs/i,
      en: /our (model|simulation|estimate|sums)|the model/i,
    }[lang as Lang];
    expect(where(ours).length).toBeLessThanOrEqual(14);
  });

  it('points to the controls the lab really has: the scenarios and the slider, in the panel’s own words', () => {
    expect(where(new RegExp(PANEL_STRINGS.tankHeight![i]))).toEqual(['scene-rig']);
    expect(where(new RegExp(SCENARIO_TEXTS['bad-tank'].name[i]))).toEqual(['scene-rig']);
    expect(where(new RegExp(SCENARIO_TEXTS['family-morning'].name[i]))).toEqual([
      'scene-tank-and-tap',
      'part-water-column',
    ]);
    expect(where(new RegExp(SCENARIO_TEXTS['holiday-week'].name[i]))).toEqual(['part-cold-relief-valve']);
  });

  it('follows one blue drop through the machine, from the intro to the shower', () => {
    const drop = { fr: /notre goutte/i, en: /our (blue )?drop/i }[lang as Lang];
    const heard = where(drop);
    for (const id of [
      'intro',
      'scene-rig',
      'scene-collector',
      'scene-tank-and-tap',
      'part-fill-port',
      'part-riser-tube',
      'part-upper-header',
      'part-hot-pipe',
      'part-cold-pipe',
      'part-mantle-jacket',
      'part-shower-head',
    ])
      expect(heard, id).toContain(id);
  });

  it('is anonymous: no person, channel, company, brand, institution or series, in a text or a title', () => {
    const names =
      /solahart|rheem|hartgard|soltrain|low-?tech|k1000|riké|lafond|lawrence|berkeley|\blbl\b|mertol|michaelides|kalogirou|schiebler|isfh|brandmayr|ingolstadt|morrison|norton|ademe|agence française|french energy agency|keymark|srcc|greenonetec|buderus|de dietrich|solimpeks|eurostar|hedestoker|fafco|apper|bidalot|warp builds|myshop|youtube|wikipedia|pvgis|engineering toolbox|inspq|ofsp|suissetec|a\. ?o\. ?smith|pelton|il était une fois|once upon a time|maestro/i;
    for (const s of script.segments) expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(names);
  });

  it('is spoken text: no digit, symbol, abbreviation or straight quote, one space, no markdown', () => {
    for (const s of script.segments) {
      const spoken = spokenOf(s);
      expect(spoken, s.id).not.toMatch(/[*≈×Ø″%°²³_#<>/\\|†«»]|\d/);
      expect(spoken, s.id).not.toMatch(/\b(kWh|Wh|kW|kN|kPa|Pa|ppm|mm|cm|km|kg|etc|3D)\b/);
      expect(spoken, s.id).not.toMatch(/['"]/);
      // a cue stands between two spaces (or at an edge), so that taking it out never glues two words together
      expect(s.text, s.id).not.toMatch(/ {2}|\n|^\s|\s$|\S\[\[|\]\]\S/);
      expect(spoken, s.id).not.toMatch(/\.\.(?!\.)|\.{3}/);
    }
  });

  it('keeps the sentences short enough for the subtitles', () => {
    let over120 = 0;
    for (const s of script.segments) {
      for (const sentence of spokenOf(s).split(/(?<=[.!?…])\s+/)) {
        expect(sentence.length, `${s.id}: ${sentence.slice(0, 60)}`).toBeLessThanOrEqual(135);
        if (sentence.length > 120) over120++;
      }
    }
    expect(over120).toBeLessThanOrEqual(6);
  });

  it('marvels without gushing, and asks questions: exclamations and questions as in the style page', () => {
    const all = script.segments.map(spokenOf).join(' ');
    const per1000 = (re: RegExp): number => ((all.match(re) ?? []).length / all.length) * 1000;
    expect(per1000(/!/g)).toBeGreaterThanOrEqual(0.5);
    expect(per1000(/!/g)).toBeLessThanOrEqual(1);
    expect(per1000(/\?/g)).toBeGreaterThanOrEqual(0.25);
    expect(per1000(/\?/g)).toBeLessThanOrEqual(0.6);
  });

  it('speaks to the listener the way the series does: "vous", "on", never "tu"', () => {
    if (lang !== 'fr') return;
    const tu = /(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu;
    for (const s of script.segments) expect(spokenOf(s), s.id).not.toMatch(tu);
  });

  it('writes British English', () => {
    if (lang !== 'en') return;
    for (const s of script.segments)
      expect(`${s.title} ${spokenOf(s)}`, s.id).not.toMatch(
        /\b(color\w*|center\w*|liter\w*|fiber\w*|neighbor\w*|gray|meters|kilometers|centimeters|millimeters|aluminum|labor|faucet|gallons?|inches)\b/i,
      );
  });

  it('stays within the budget, the aim and what the generator accepts', () => {
    const lengths = script.segments.map((s) => spokenOf(s).length);
    const total = lengths.reduce((n, l) => n + l, 0);
    expect(total).toBeLessThanOrEqual(BUDGET);
    expect(total).toBeGreaterThanOrEqual(AIM[0]);
    expect(total).toBeLessThanOrEqual(AIM[1]);
    expect(Math.max(...lengths)).toBeLessThanOrEqual(SEGMENT_CAP);
  });
});

describe.each(Object.keys(manifests))('narration audio %s', (lang) => {
  const { manifest, problems } = readManifest(manifests[lang]);

  it('is a usable manifest that agrees with the lab, in the local voice', () => {
    expect(problems).toEqual([]);
    expect(manifest).not.toBeNull();
    expect(validateManifest(manifest!, { scenes: sceneIds, parts: partIds })).toEqual([]);
    expect((manifests[lang] as { model?: string }).model).toBe(LOCAL_VOICE);
  });

  it('has an audio file for every segment and none without a segment', () => {
    const files = audioFiles.filter((f) => f.includes(`/audio/${lang}/`)).map((f) => f.split('/').pop());
    expect(files.sort()).toEqual(manifest!.segments.map((s) => s.file).sort());
  });

  it('is the audio of the script of the same language', () => {
    const script = scripts[lang];
    if (!script) return;
    expect(manifest!.segments.map((s) => s.id).sort()).toEqual(script.segments.map((s) => s.id).sort());
  });
});

describe('the voice points at what can be seen', () => {
  // A cue as the kit flies it (`Stage.frameParts`, `framePadding` of the narration), with no canvas: one part from its own `viewDir`, several parts or a part with none from where the camera
  // already is, so a view direction given to a part also moves the camera of the cues after it. Distances are those of a wide view, the dock of the narration down. The rays are those of the
  // gravity lab's test, on the default machine (the tank at y = 0) in the state the simulation opens on, with two additions: points sampled inside the triangles, for the long thin meshes whose
  // vertices fall outside their frame box, and instanced meshes, which are the tiles of this roof.
  type Module = SceneModule<SolarState>;
  const SIN_FIT = Math.sin((20 * Math.PI) / 180);
  const params = presetParams('family-300');
  const homeDir = (m: Module): THREE.Vector3 => m.home.position.clone().sub(m.home.target).normalize();
  const distance = (mod: Module, box: THREE.Box3, padding: number): number =>
    Math.min(
      mod.maxDistance,
      Math.max(mod.minDistance, (box.getBoundingSphere(new THREE.Sphere()).radius * padding) / SIN_FIT),
    );
  const shown = (o: THREE.Object3D): boolean => {
    for (let q: THREE.Object3D | null = o; q; q = q.parent) if (!q.visible) return false;
    return true;
  };
  const shell = (world: string, id: string): boolean => {
    const def = WORLD[world as WorldId] as { xrayShell?: (part: string) => boolean };
    return def.xrayShell?.(id) ?? false;
  };
  const worlds = (() => {
    const made: Partial<Record<string, Module>> = {};
    return (id: string): Module => {
      if (!made[id]) {
        const make: Record<string, () => Module> = {
          house: () => createHouseScene(() => params),
          rig: () => createRigScene(() => params),
          collector: () => createCollectorScene(),
          'tank-and-tap': () => createTankScene(),
        };
        made[id] = make[id]!();
      }
      return made[id]!;
    };
  })();
  const state = stateWith({}, 0.2);

  /** Points on the part: its vertices, then points inside its triangles, inside its frame box if it has one. A fixed generator: a stride falls in step with a mesh's rings. */
  const pointsOn = (mod: Module, id: string): THREE.Vector3[] => {
    const part = mod.registry.get(id)!;
    const box = part.frame ? mod.registry.frameBounds(id) : null;
    const near = box?.getBoundingSphere(new THREE.Sphere());
    if (near) near.radius *= 1.5;
    const out: THREE.Vector3[] = [];
    const aside: THREE.Vector3[] = [];
    const inst = new THREE.Matrix4();
    const [a, b, c] = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    let seed = 777;
    const next = (): number => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    for (const m of part.meshes) {
      if (!shown(m)) continue;
      const pos = m.geometry.attributes.position as THREE.BufferAttribute | undefined;
      if (!pos || pos.count === 0) continue;
      const index = m.geometry.index;
      const many = m as THREE.Mesh & {
        isInstancedMesh?: boolean;
        count?: number;
        getMatrixAt?(i: number, to: THREE.Matrix4): void;
      };
      const triangles = (index ? index.count : pos.count) / 3;
      let found = 0;
      for (let draw = 0; draw < 4000 && found < 400; draw++) {
        if (many.isInstancedMesh) many.getMatrixAt!(Math.floor(next() * many.count!), inst);
        const k = Math.floor(next() * triangles) * 3;
        const at = (n: number): number => (index ? index.getX(k + n) : k + n);
        a.fromBufferAttribute(pos, at(0));
        b.fromBufferAttribute(pos, at(1));
        c.fromBufferAttribute(pos, at(2));
        const [u, v] = [next(), next()];
        const [s, w] = u + v > 1 ? [1 - u, 1 - v] : [u, v];
        const p = a
          .clone()
          .multiplyScalar(1 - s - w)
          .addScaledVector(b, s)
          .addScaledVector(c, w);
        if (many.isInstancedMesh) p.applyMatrix4(inst);
        p.applyMatrix4(m.matrixWorld);
        if (!box || box.containsPoint(p)) {
          out.push(p);
          found++;
        } else if (near && p.distanceTo(near.center) <= near.radius) {
          aside.push(p);
        }
      }
    }
    // a frame box with none of the part in it (the seal round the glass, README): what counts is what the camera keeps in its view around that box
    return out.length ? out : aside;
  };

  /** The share of the rays from the eye that reach the part. */
  const seen = (mod: Module, id: string, eye: THREE.Vector3): number => {
    const part = mod.registry.get(id)!;
    const points = pointsOn(mod, id);
    const own = new Set<THREE.Object3D>(part.meshes);
    const rc = new THREE.Raycaster();
    let seed = 12345;
    let arrive = 0;
    const count = Math.min(points.length, 96);
    for (let k = 0; k < count; k++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const point = points[points.length <= 96 ? k : Math.floor((seed / 2 ** 32) * points.length)]!;
      const dir = point.clone().sub(eye);
      const far = dir.length();
      rc.set(eye, dir.normalize());
      rc.far = far + 0.05;
      const hit = rc.intersectObjects(mod.scene.children, true).find((h) => {
        const o = h.object as THREE.Mesh;
        const mat = o.material as THREE.Material | undefined;
        return o.isMesh && shown(o) && !(mat?.transparent && mat.opacity < 0.9);
      });
      if (!hit || own.has(hit.object) || hit.distance >= far - 0.02) arrive++;
    }
    return count ? arrive / count : 0;
  };

  /** A thin half shell cut along its axis: what reads is its cut edge and its strip of colour, most of its surface faces the steel on each side. A band round the tank: the half behind it cannot be seen from any side. A look must confirm both (README). */
  const LOWER: Record<string, number> = { 'mantle-jacket': 0.4, 'tank-strap': 0.3 };
  /** The long pipe runs the machine's whole height: its frame is a little wider than home, and the cue is there for its own side of the machine, its `viewDir`. */
  const WIDER: Record<string, number> = { 'cold-pipe': 1.1 };

  it.each(['intro', 'scene-house', 'scene-rig', 'scene-collector', 'scene-tank-and-tap'])(
    '%s: each part is seen, from no farther than home',
    (id) => {
      const segment = scripts.fr!.segments.find((s) => s.id === id)!;
      let world = segment.scene;
      let dir = homeDir(worlds(world));
      let xray = false;
      let cutaway = false;
      const cues = [...segment.text.matchAll(CUE)];
      cues.forEach((m, c) => {
        const [, name = '', arg = ''] = m;
        if (name === 'scene' && arg !== world) {
          world = arg;
          xray = false;
          dir = homeDir(worlds(world));
        }
        const mod = worlds(world);
        if (name === 'home') dir = homeDir(mod);
        if (name === 'xray') xray = arg === 'on';
        if (name === 'cutaway') cutaway = arg === 'on';
        if (name !== 'frame') return;
        // cues that fall together run as one batch, and the camera measures after them
        const next = cues[c + 1];
        const together = next && !segment.text.slice(m.index + m[0].length, next.index).trim();
        const inXray = xray || (together && next![1] === 'xray' && next![2] === 'on');
        for (const part of mod.registry.ids())
          mod.registry.setDisplay(part, inXray && shell(world, part) ? 'ghost' : 'solid');
        mod.update(state, 1 / 60, view({ cutaway }));
        mod.scene.updateMatrixWorld(true);
        const ids = arg.split(',');
        const box = new THREE.Box3();
        for (const part of ids) box.union(mod.registry.frameBounds(part));
        const own = ids.length === 1 ? mod.registry.get(ids[0]!)?.viewDir : undefined;
        dir = (own ?? dir).clone().normalize();
        const padding = Math.min(WORLD[world as WorldId].partPadding, ids.length > 1 ? 1.5 : 1.9);
        const far = distance(mod, box, padding);
        const eye = box.getCenter(new THREE.Vector3()).addScaledVector(dir, far);
        for (const part of ids) {
          expect(seen(mod, part, eye), `${id}: ${part}`).toBeGreaterThanOrEqual(LOWER[part] ?? 0.5);
        }
        const whole = new THREE.Box3();
        for (const part of mod.registry.ids()) whole.union(mod.registry.bounds(part));
        expect(far, `${id}: ${arg}`).toBeLessThanOrEqual(
          distance(mod, whole, mod.homePadding ?? 0.82) * (WIDER[arg] ?? 1),
        );
      });
      for (const w of sceneIds) worlds(w).registry.setAllDisplay('solid');
    },
  );

  it.each(partIds)('part %s: seen from its own framing, with what its segment switches on as it starts', (id) => {
    const segment = scripts.fr!.segments.find((s) => s.id === `part-${id}`)!;
    const mod = worlds(segment.scene);
    // the kit shows the other parts as ghosts under X-ray when a part is selected
    const opening = /^(?:\[\[[a-z]+(?::[^\]]*)?\]\] ?)*/.exec(segment.text)![0];
    const xray = opening.includes('[[xray:on]]');
    const cutaway = opening.includes('[[cutaway:on]]');
    for (const part of mod.registry.ids()) mod.registry.setDisplay(part, xray && part !== id ? 'ghost' : 'solid');
    mod.update(state, 1 / 60, view({ cutaway }));
    mod.scene.updateMatrixWorld(true);
    const box = mod.registry.frameBounds(id);
    const dir = (mod.registry.get(id)!.viewDir ?? homeDir(mod)).clone().normalize();
    const far = distance(mod, box, Math.min(WORLD[segment.scene as WorldId].partPadding, 1.9));
    const eye = box.getCenter(new THREE.Vector3()).addScaledVector(dir, far);
    expect(seen(mod, id, eye), id).toBeGreaterThanOrEqual(LOWER[id] ?? 0.5);
    mod.registry.setAllDisplay('solid');
    mod.update(state, 1 / 60, view());
  });

  it('asks for a section only from where its cut can be read', () => {
    // the faces of the two cuts, in the world: the tank's looks along −X (machine/tank.ts), the collector's down the slope of the roof (machine/collector.ts)
    const faces: Record<string, THREE.Vector3> = {
      'tank-and-tap': new THREE.Vector3(-1, 0, 0),
      collector: new THREE.Vector3(0, -Math.sin(Math.PI / 6), Math.cos(Math.PI / 6)),
    };
    for (const lang of ['fr', 'en']) {
      for (const s of scripts[lang]!.segments.filter((x) => !x.scope.startsWith('part:'))) {
        let world = s.scene;
        let dir = homeDir(worlds(world));
        for (const [, name = '', arg = ''] of s.text.matchAll(CUE)) {
          if (name === 'scene') {
            world = arg;
            dir = homeDir(worlds(world));
          }
          if (name === 'home') dir = homeDir(worlds(world));
          if (name === 'frame') {
            const ids = arg.split(',');
            const own = ids.length === 1 ? worlds(world).registry.get(ids[0]!)?.viewDir : undefined;
            dir = (own ?? dir).clone().normalize();
          }
          if (name === 'cutaway' && arg === 'on')
            expect(dir.dot(faces[world]!), `${lang} ${s.id}: section seen edge on`).toBeGreaterThan(0.4);
        }
      }
    }
  });
});

describe('the private transcripts', () => {
  // Transcripts of third-party videos stay private, in ~/.cache/lab-review/research/solar-heater-lab/. When they are present, no run of seven words of a script may be copied from them (they only serve to
  // check facts). Absent in CI: skipped. They are in English and in French, so both scripts are held to them.
  const words = (t: string): string[] =>
    t
      .toLowerCase()
      .replace(/’/g, "'")
      .replace(/[^a-zàâäçéèêëîïôöùûüÿœ0-9' ]+/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const grams = (w: string[], n: number): string[] =>
    Array.from({ length: Math.max(0, w.length - n + 1) }, (_, i) => w.slice(i, i + n).join(' '));
  /** Only what was said: no WebVTT or SubRip header, no timing line, no inline tag, and rolling captions counted once. */
  const captions = (raw: string): string =>
    raw
      .split('\n')
      .filter((line) => !/^WEBVTT|^Kind:|^Language:|-->|^\d+$/.test(line.trim()))
      .map((line) => line.replace(/<[^>]*>/g, '').trim())
      .filter((line, i, all) => line && line !== all[i - 1])
      .join(' ');
  /** The cache is outside the repository, so it is read at run time; this repo has no Node types, hence the narrow one here. */
  interface Files {
    existsSync(path: string): boolean;
    readdirSync(path: string): string[];
    readFileSync(path: string, encoding: 'utf8'): string;
  }
  const inCache = async (): Promise<string[]> => {
    const home = (globalThis as unknown as { process?: { env: Record<string, string | undefined> } }).process?.env.HOME;
    if (!home) return [];
    const fs = (await import(/* @vite-ignore */ `node:${'fs'}`)) as Files;
    const root = `${home}/.cache/lab-review/research/solar-heater-lab`;
    if (!fs.existsSync(root)) return [];
    const out: string[] = [];
    for (const dir of [root, `${root}/whisper`, `${root}/whisper-tiny`, `${root}/audio`]) {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir))
        if (/\.(srt|vtt|txt|description)$/.test(f)) out.push(fs.readFileSync(`${dir}/${f}`, 'utf8'));
    }
    return out;
  };

  it('copies no seven-word run of the captions', async (ctx) => {
    const transcripts = await inCache();
    if (transcripts.length === 0) ctx.skip();
    const source = new Set(transcripts.flatMap((t) => grams(words(captions(t)), 7)));
    const copied = Object.entries(scripts).flatMap(([lang, script]) =>
      script.segments.flatMap((s) =>
        grams(words(spokenOf(s)), 7)
          .filter((g) => source.has(g))
          .map((g) => `${lang}/${s.id}: "${g}"`),
      ),
    );
    expect(copied).toEqual([]);
  });
});

describe('narration scripts agree between languages', () => {
  const cues = (text: string) => [...text.matchAll(CUE)].map((m) => m[0]);

  it('have the same segments and the same cues in the same order', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    expect(en.segments.map((s) => [s.id, s.scope, s.scene])).toEqual(fr.segments.map((s) => [s.id, s.scope, s.scene]));
    for (const s of fr.segments) expect(cues(en.segments.find((x) => x.id === s.id)!.text), s.id).toEqual(cues(s.text));
  });

  it('put the cues at the same place in the sentence (within a tenth of the segment)', () => {
    const [fr, en] = [scripts.fr!, scripts.en!];
    const share = (s: Segment): number[] => {
      const total = spokenOf(s).length || 1;
      return [...s.text.matchAll(CUE)].map((m) => spokenOf({ text: s.text.slice(0, m.index) }).length / total);
    };
    for (const s of fr.segments) {
      const [a, b] = [share(s), share(en.segments.find((x) => x.id === s.id)!)];
      a.forEach((x, i) => expect(Math.abs(x - b[i]!), `${s.id}: cue ${i}`).toBeLessThanOrEqual(0.1));
    }
  });
});
