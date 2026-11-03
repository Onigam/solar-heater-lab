# The A3 sheets of the Solar Heater Lab

Ten sheets in `src/drawings/`, generated from `src/three/dims.ts`, `ROOF_UNIT` and `src/data/figures.ts`, pinned by `src/drawings/drawings.test.ts`. The cartouche of each says « for understanding, not for manufacture » (`configureDrawings` in `src/drawings/index.ts`). The maker is named on none. `SHEET_GROUPS` is for `plans.groups` in `src/lab.ts`.

| No.    | Sheet                 | Group     | What it shows                                                                                           |
| ------ | --------------------- | --------- | ------------------------------------------------------------------------------------------------------- |
| PL-S01 | `general-arrangement` | `machine` | from above and from the side at 1:20: the maker's outline, y measured in red, what we estimate          |
| PL-S02 | `loop-heights`        | `machine` | the collector and five places of the tank at 1:25; the model's sweep beside the 1981 model's            |
| PL-S03 | `collector-section`   | `parts`   | across the tubes at 1:1, along them at 1:10; the certified curve against the selective one              |
| PL-S04 | `tank-section`        | `parts`   | along the axis at 1:8, across at 1:5, ten layers; the maker's figures and our estimates in two tables   |
| PL-S05 | `hydraulic-schematic` | `parts`   | the closed circuit and the drinking water, no scale, the valves in the maker's order with each setting  |
| PL-S06 | `roof-fixing`         | `house`   | rafters, rail, straps, spacers at 1:15; the rail's raise, exaggerated, and why it reads as it does      |
| PL-S07 | `loads-and-pressures` | `house`   | masses and what they do to the roof, the chain of pressures, a ladder of temperatures                   |
| PL-S08 | `heat-budget`         | `budget`  | a year of the model from the sun to the tap, Athens and Stockholm; the published years beside the model |
| PL-S09 | `assembly-sequence`   | `build`   | the machine exploded along the roof's normal, numbered from `src/data/assembly.ts`                      |
| PL-S10 | `bill-of-materials`   | `build`   | 51 lines, read from the part sheets                                                                     |

**Order.** The kit lists the sheets group by group, in the order `src/lab.ts` gives the groups: `SHEET_GROUPS` keeps the numbers running, and a test holds it.

**Numbers.** A length is read from `dims.ts`, a maker's figure from `ROOF_UNIT`, a result from `FIG`, `SWEEP_TABLE` or `YEAR_TABLE` through `fig()`; the curves through the simulation's own `curveEfficiency`. The tests check that no text falls on another or off the sheet, in both languages. **Not shown:** the maker's table of slots by rafter spacing, which the research did not transcribe; PL-S06 says so.

**Looked at:** each sheet rasterised once by Quick Look, in French or English, for layout; then in the browser by the lead, at twice the pixels in both languages. Eight labels and one view moved in that look, positions only, no figure (PL-S01, S03, S04, S06, S09). **Still for the author:** PL-S07 and PL-S10 fill less than half their paper. Thin lines still cross text in places: « Tuyau froid » on the 2,49 m line and « 30 mm\* » on the centre line of PL-S01, the Ø510 mm on the tank in PL-S01 and the « 3,2 mm » beside its arrows in PL-S03.
