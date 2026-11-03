# Narration scripts (French and English)

`fr.json` and `en.json` follow `lab-kit/docs/narration.md`: **56 segments each** (`intro`, 4 worlds, 51 parts: house 10, rig 15, collector 9, tank and tap 17), ids `intro`, `scene-<world>`, `part-<id>`, no lesson segments. **No audio exists yet.** This lab uses the local voice (`--engine voicebox`, profiles `Onigam narrateur FR` and `EN`, 0 credit, the Voicebox application open); the session that orchestrates the lab generates it after these checks, and the agent that writes this script never does.

Check the length without generating anything (`HOME=<empty dir>` keeps the tool from even opening a key file):

```
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/fr.json --out public/audio/fr --dry-run --engine voicebox
HOME=$(mktemp -d) node ~/Dev/lab-kit/tools/narration/generate.mjs --src narration/en.json --out public/audio/en --dry-run --engine voicebox
```

## Budget (spoken characters, cues removed)

| Language | Total  | Intro | Worlds                                                | Parts  | Longest parts                                                                                 |
| -------- | ------ | ----- | ----------------------------------------------------- | ------ | --------------------------------------------------------------------------------------------- |
| French   | 23,899 | 2,275 | 3,332 (house 764, rig 1,018, collector 733, tank 817) | 18,292 | `test-stand` 595, `hot-pipe` 575, `riser-tube` 551, `tempering-valve` 536, `water-column` 478 |
| English  | 22,606 | 2,194 | 3,211 (house 747, rig 969, collector 704, tank 791)   | 17,201 | `hot-pipe` 559, `test-stand` 545, `riser-tube` 510, `tempering-valve` 482, `water-column` 463 |

The ceiling is 30,000 per language; the research said about 20,000, the series aims for 17,000 to 24,000 (`src/narration.test.ts` holds 19,000 to 24,000). `generate.mjs` refuses a segment over 2,500 characters. The median part is 337 characters in French, 311 in English. The French is near the top of the aim: this lab has many figures that each carry their condition (at noon, on a clear June night, as a mean). `scene-rig` is the longest world because it carries most of the honesty: the bench, the clock, the dots by day and by night, the worst tank, the 1981 model.

## Register

Pelton Lab's tone (`lab-kit/docs/narration-style.md`). The thread is **one small blue drop**, « une petite goutte bleue »: the blue is the glycol's dye. It sleeps in a riser at first light, climbs the hot pipe, gives up its heat through the steel, comes back down the cold pipe, would like to run backward at night, and never sees the shower it heats (`part-shower-head`: « Elle n’aura jamais vu cette douche. Demain matin, elle recommence. »). The intro closes on the sun rising, the hour the simulation opens on (7:00).

## The truths, each said once (`src/narration.test.ts` counts them)

| Truth                                                                                                         | Where                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Educational reconstruction of a real machine, from its maker's documents; neither a plan nor its product      | `intro`                                                                                                                                        |
| Where the figures come from; ours are calculations, not measurements                                          | `intro`                                                                                                                                        |
| It is not the water you drink that climbs                                                                     | `intro`                                                                                                                                        |
| The 3D always draws this one machine; the other starting points change only the figures                       | `intro`                                                                                                                                        |
| The year's share is a test plus a calculation                                                                 | `scene-house`                                                                                                                                  |
| The bench has no source                                                                                       | `scene-rig`                                                                                                                                    |
| The clock starts at an hour a second; the dots run at their true speed by day, faster than the truth at night | `scene-rig`                                                                                                                                    |
| The worst place is 0.61 m below the top; these figures are a 1981 model or ours; we found no measurement      | `scene-rig`                                                                                                                                    |
| False colour                                                                                                  | `scene-collector`                                                                                                                              |
| The wall brackets have no source                                                                              | `scene-tank-and-tap`                                                                                                                           |
| The night's figures rest on a sum for the sky, with no dew; the drawing's detour of pipe                      | `part-test-stand`                                                                                                                              |
| Air has no surface                                                                                            | `part-air-gap`                                                                                                                                 |
| First crystals, not a burst                                                                                   | `part-lower-header`                                                                                                                            |
| Roof and weight · mains current · trained installers · hydrogen · blue leak · hot discharge · scald           | `part-roof-structure`, `part-meter-box`, `part-fill-port`, `part-inner-vessel`, `part-mantle-jacket`, `part-tpr-valve`, `part-tempering-valve` |

**Anonymous.** « le constructeur », « un laboratoire indépendant », « un guide officiel » (a French agency on the sheets), « un essai allemand », « une enquête française », « un modèle de mil neuf cent quatre-vingt-un ». A test refuses every name of the Sources. Places stay: Athens, Stockholm, Australia, because they say where a figure holds or where the machine's north comes from.

**Hedges.** « dans le modèle » is never said. « notre modèle » and its kin appear in 14 segments (a test caps them), where the model is the subject or stands against a source. The word « mesure » only denies a measurement, names what a tool does, or tells of other people's tests (`part-cold-diffuser`): a test holds the list. **« Personne n’a mesuré » is refused:** the research says « I found no measurement », so the voice says « nous n’avons trouvé aucune mesure ».

**Instant or mean.** The push, the flow and the speeds are « vers midi »; the night's trickle is « en moyenne de minuit à l’aube » (`nightFlow` of `src/sim/runs.ts`, midnight to 04:30); the losses are one clear June night; the holiday week's temperatures are peaks (« monte à »); the hours are solar hours, as the panel's slider says. `src/narration.test.ts` holds those words with the figures.

## What the voice says differently from the sheets, by choice

- **« Deux boucles », not « deux couleurs ».** Both loops of `tank-and-tap` are drawn by `FlowDots`, each dot coloured by its temperature: no loop has a colour of its own. The voice refuses the words.
- **`drain-outlet`:** « C’est normal », not « tout va bien »: a drip while heating is normal, a drain that never stops is a fault, by the sheet's own maintenance.
- **Heavy numbers:** 0.83 kN/m² is said as « environ quatre-vingt-cinq kilos par mètre carré » (515 kg over 2.43 × 2.49 m). The sheet's 1.7 kN/m is said as « sur une seule ligne ».
- **`storage-tank`:** the sheet's « tous les monoblocs » is left out, a universal the research does not establish.
- **« Heure solaire »:** said once, at `hot-pipe`, where 4:50 and 7:10 are spoken. The sheets print the hours without it; the panel's slider has it.
- **One image of ours:** « à peu près l’épaisseur d’un crayon » (`hot-pipe`), for 6.6 mm. No source: flagged for the reviewer.

## For the reviewer: spoken wording that rests on sources read only in summary (research §1, access f)

None from **s** or **w**. From **f**, to re-read before a visitor hears it (research §9):

| Spoken                                                               | Segment                | Source                      |
| -------------------------------------------------------------------- | ---------------------- | --------------------------- |
| An adult burns at 60 °C in 2 to 5 s, a child about four times faster | `part-tempering-valve` | K53: S39, S40 (f)           |
| Legionella multiply at 25 to 45 °C                                   | `part-tank-thermostat` | K55: S37 (f)                |
| 56 L at 40 °C per person per day, give or take 23                    | `part-shower-head`     | K51: S34 (f)                |
| The backward trickle leaves colder than the air                      | `part-lower-header`    | K33: S21 (f), and the model |

## Cues (104 in each language, the same in both)

- Totals: frame 27, xray 26, flows 18, home 9, scene 7, mode 6, explode 6, cutaway 4, select 1. Every « on » has its « off » before the end of the segment.
- Intro (23): `home`, `frame` the unit; `scene` to the collector and its plate; `scene` to the rig, `flows`, the hot pipe; `scene` to the tank, jacket, water; `scene` to the rig for the night; `scene` to the tank for the shower; `scene:house`; `mode` hops assembly, install, sim, lessons, plans, explore; `scene:house`, `select:none`.
- Worlds: `home` first, then at least five parts. `flows` in the house, the rig and the tank; `xray` in the rig; `cutaway` in the collector and the tank; `explode` in the collector.
- Parts: no camera cue. `xray` where the part is hidden from its own framing (`cold-main`, `hot-line`, `drain-outlet`, `collector-link`, `tank-spacer`, `lower-header`) or reads better alone (`tank-strap`, `inner-vessel`, `mantle-jacket`, `tank-foam`, `outer-case`); `flows` on `hot-line`, `hot-pipe`, `cold-pipe`, `riser-tube`, `mantle-jacket`; `explode` on `back-insulation`, `end-cap`.
- No flows under explode, no flows under the tank's section: `src/three` hides the dots there, and a test refuses it.
- **The section across the tank is asked for from the end cap's direction**, 46° off the normal of the cut: from home it is 75° off, from `water-column`'s own direction 84°, almost edge on. A test holds the angle.
- **No `lab:` cue:** `src/lab.ts` defines no `narration.onCue`, so the voice cannot set the hour or the tank's height. No sentence says « regardez » about a dot at a given word: the clock runs at an hour a second and the voice cannot know the hour it falls on.

## Checked

`npx vitest run src/narration.test.ts`: the contract, ids, scopes, titles and starting worlds, known cues on real ids, frames in the current world, what is switched on is switched off, tools per world, tools named per world, no camera cue in a part, 35 characters between camera moves, the hops and counts of the intro, each truth once in its place, what is refused everywhere, **48 rows of spoken figures held to today's `src/data/figures.ts` and `dims-read.ts`**, the dots against `dotSpeed`, the word « mesure », the hedges, the controls named against the panel's own words, the blue drop, no name, spoken text only, sentences at most 135 characters, exclamations and questions, no « tu », British English, the budget, no run of seven words from the private transcripts (`~/.cache/lab-review/research/solar-heater-lab/`), the same cues in the same order within a tenth of the segment between languages, and the manifests once they exist, in the local voice.

**Rays (`the voice points at what can be seen`):** the gravity lab's method. Each cue flown as `Stage.frameParts` flies it, a part's `viewDir` carrying over to the next cue that has none, at the kit's narration padding, on the default machine in the opening state. Each framed part reached by at least half the rays, from no farther than home; each of the 51 parts seen from its own framing with what its segment switches on at its start. Two additions: points sampled inside triangles, and instanced meshes as occluders. Exceptions, each named in the test: `mantle-jacket` 0.4 (a thin half shell), `tank-strap` 0.3 (a band round the tank), `cold-pipe` framed up to 1.1 × home.

`node ~/Dev/lab-kit/tools/narration/tone-stats.mjs narration/fr.json`, against Pelton's script:

| Measure                      | French | Pelton | English | Pelton's English | Why they differ                                                                                                                          |
| ---------------------------- | ------ | ------ | ------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Average sentence, characters | 69     | 79     | 65      | 69               | Subtitles cut at sentence ends: the same band as the sand lab (70, 67), Mill (71), Piggott (67), the mass heater (68, 63)                |
| Sentences over 120           | 3      | 35     | 1       | 2                | Pelton's 35 are its one departure from its own rule. Each of ours carries a figure with its condition                                    |
| Exclamations per 1,000       | 0.75   | 0.80   | 0.80    | 0.83             | Held there on purpose                                                                                                                    |
| Questions per 1,000          | 0.50   | 0.29   | 0.53    | 0.35             | Above Pelton, like the mass heater (0.53, 0.56) and Piggott (0.48). The lab asks a question: what if the tank stood lower? Twelve in all |
| « tu », digits or symbols    | 0      | 0      | 0       | 0                |                                                                                                                                          |

## What only a look can confirm (no browser was used)

The rays say a part can be reached, not that it reads. To look at: `mantle-jacket` and the water together, and the same segment's `xray`; the collector's section from home, whose face is about 63° off the line of sight, computed; the tank's slices from the end cap, about 13 % of the view's height, computed; `glass-seal`, whose frame box holds none of the seal, which runs round the glass and stays off the stair's notch (the camera keeps it at the side of the view); the flows dots over the X-ray in `scene-rig`; the house at night, which the voice can land on since the clock does not stop for it: a day lasts 24 s and the intro about two minutes, by its length.

## To listen for in the sample (not measured, a script cannot tell)

French: feuillard, liteaux, mitigeur, kilopascals, kilowattheure, polyuréthane, polypropylène, légionelle, « zéro virgule quatre-vingt-six kilowattheure », « mil neuf cent quatre-vingt-un », « un virgule quatre centimètre », Stockholm. English: glycol, legionella, polyurethane, kilopascals, kilowatt-hours, « ten to five » and « ten past seven » read as hours, « two metres thirty-one », « nineteen eighty-one ». Whether « Si peu ! » lands, and whether the last line of the shower lands: an ear's business. Nobody has listened to anything yet.

## After generation

`src/lab.ts` already asks for `audio/{lang}/manifest.json`. **This lab has no `scripts/check-narration.mjs`, and its `npm run build` does not call one** (the mass heater and the gravity lab both have it): the lead must add it, outside this role's files. A copy of the mass heater's, run on this lab with no audio, exits 0. Then back-transcription, rate and subtitles, as `lab-narrator` says.
