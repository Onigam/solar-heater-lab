# Data of the Solar Heater Lab (data role)

51 part sheets, two guides, four overviews, six lessons, the Sources and the lab's interface strings, bilingual `l(fr, en)`, written together. The machine is one real unit, read from its maker's documents; **the maker is named in the Sources panel only** (`noticeMachine`, the source list). Everywhere else it is « le constructeur », « the maker ».

## Files

| File                                 | What                                                                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `src/data/parts.ts`                  | `PARTS`: the 51 sheets in the order of `src/three/part-ids.ts`, with the dimension rows appended               |
| `src/data/parts/house.ts`            | 10 sheets of `house`                                                                                           |
| `src/data/parts/rig.ts`              | 15 sheets of `rig`                                                                                             |
| `src/data/parts/collector.ts`        | 9 sheets of `collector`                                                                                        |
| `src/data/parts/tank.ts`             | 17 sheets of `tank-and-tap`                                                                                    |
| `src/data/parts/dim-specs.ts`        | every length of a sheet, **read from `src/three/dims.ts`**, nothing typed                                      |
| `src/data/assembly.ts`, `install.ts` | the guides: 20 and 10 steps. Each ends on its origin. No torque, tool list or duration: no source has any      |
| `src/data/overviews.ts`              | `OVERVIEWS`: title and text per world, wired in `src/lab.ts` with the `go…` actions                            |
| `src/data/lessons.ts`                | `LESSONS`, see `docs/lessons.md`                                                                               |
| `src/data/sources.ts`                | `SOURCE_GROUPS`, `MAIN_VIDEO`, `sourcesPanel(ctx)`: `about: sourcesPanel` in `src/lab.ts`                      |
| `src/data/chapters.ts`               | `CHAPTERS` of the main video, `VIDEO_ID` for `video: { id }` in `src/lab.ts`                                   |
| `src/data/figures.ts`                | `FIG`: every figure that is not reported, with its unit and status; `SWEEP_TABLE`, `YEAR_TABLE` for the sheets |
| `src/data/part-helpers.ts`           | `lf` fills `{placeholders}` with number, unit and mark; `sp`, `maint`, `v`                                     |
| `src/data/dims-read.ts`              | what `figures.ts` reads of `dims.ts` and `ROOF_UNIT`, in one place                                             |
| `src/i18n/ui.ts`                     | `LAB_STRINGS`: only the lab's own. The sheets' groups are in `SHEET_GROUPS`, `src/drawings/index.ts`           |

## The marks

**No mark**: reported by a source of `docs/research.md`, typed in the text, checked against `REPORTED` in `data.test.ts`, each with its research number. **†**: computed, by arithmetic on reported figures (research: _derived_) or by the model (`src/sim`); the sentence says which. **\***: an estimate of this lab, the sources being silent (research §3, the tags of `dims.ts`, an assumption of how to run). The physics role's `†` in the panel meant « model result »: the legend of the panel (`tagLegend`) now says « computed », so that one mark has one meaning across the panel, the sheets and the A3.

`lf` adds the mark by construction; a test catches a number typed by hand with a mark, and a marked number that is no figure. `figures.test.ts` holds each figure against the pins of `src/sim/figures.test.ts` (read as text, so that a moved pin shows there), runs one year at Athens and at Stockholm and one June day live, and redoes the arithmetic.

## What the physics changed from the research, and the sheets say

The push is **65 Pa†, 6.6 mm† of water**, not 40 Pa and 4 mm. The flow starts about **7:10†**, not when the gain turns positive (**4:50†**). The worst tank is at **−0.61 m**, not −1.22 m: lower, the day stops. Below zero we found no measurement of a flat collector. The valve gains **0.9 to 2 %†** a year at y = 0, and buys no frost margin there. Header **27 mm\***, forced by 3.8 L, not the research's 18 mm. Night through the skin **0.86 kWh†** on a clear June night at Athens, not the research's 1.3 kWh in 12 h at 45 K.

## Said once

Educational reconstruction, the maker's name, the law: the Sources (`disclaimer`, `noticeMachine`, `legal`), held by a test. The marks in short: the `house` overview; in full: Sources. False colour: the `collector` overview. That the dots run faster than the truth at night, and that the bench has no source: the `rig` overview. The wall brackets: the `tank-and-tap` overview. Scald: `tempering-valve` and step 7 of the installation. Hot discharge: `tpr-valve`, `drain-outlet` and step 9. Hydrogen: `inner-vessel`. Blue leak: `mantle-jacket`. Roof and weight: `roof-structure`, and steps 10 of assembly and 3 of installation. Mains current: `booster-element`, `meter-box` and step 8. The reading is no procedure: step 1 of each guide. Trained installers: step 20 of assembly.

No wording promises safety: a test bans « safely », « sans danger », « guaranteed ».

## From the modeler's notes

| Note                                                   | Where it is said                                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Presets, direct circuit, `tilt` move only the numbers  | one hint under the starting points, `drawnHint` in `src/panels/strings.ts`; the pitch's own label says « figures only » |
| `bad-tank` at y = −0.61 m, the stand beside the bank   | lesson 4, `test-stand`                                                                                                  |
| Below zero the drawn pipes are longer than the model's | `test-stand` (about 2.2 m\*), and `tankHeightHint` in the panel, where the visitor moves the slider                     |
| Night dots faster than the truth (8 mm/s\* floor)      | the `rig` overview                                                                                                      |
| The rail's 0.66°†                                      | `collector-rail`, step 9 of the assembly and its tip, sheet PL-S06: the maker's figure, and our reading of why          |
| Overheat valve's place, reservoir's mount              | their sheets, step 20                                                                                                   |
| Bench, wall brackets                                   | the `rig` and `tank-and-tap` overviews                                                                                  |
| `air-gap` has no surface                               | its sheet, three times over: short, overview, tip                                                                       |
| `test-stand` not fully hidden at y = 0                 | its sheet: the staff, and its copper zero                                                                               |
| `collector` and `tank-and-tap` open already cut        | their overviews, and a tip on `collector-tray` and `inner-vessel`                                                       |

## Choices

**The installation guide crosses two worlds in ten steps:** a step plays in one world, so `cold-main` and `hot-line` share step 4 in `house`, and the valves come in step 5 in `tank-and-tap`. Steps 9 and 10 frame again what the gesture is on: `cold-relief-valve`, `roof-unit`. **Glycol in the circuit** is said to be the maker's bottle, 24 %†; its brand is not named. **Timestamps** of the main video are approximate, from a private transcription. **The French names** of `src/three/part-ids.ts` and of the sheets use the same typographic apostrophe, and the data test compares them as they are. **The kit's X-ray tool** is « Transparence » in French. With a part selected it keeps that part alone solid and fades everything else, so a tip that needs the shells faded says so, and says to close the sheet first (`glass-cover`, `collector-link`, `outer-case`). **Flows** colours each dot by its temperature: no path has a colour of its own.
