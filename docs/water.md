# The water of the lab, what follows the model and what is decoration

| What                           | World                                                        | From the model                            | How                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **The ten layers of the tank** | `tank-and-tap` section; `rig` x-ray                          | `layers`                                  | Nearest-filter strip of ten cells, by height: a layer is a layer, no smoothing between them. False colour, the ramp of `heat.ts`                                      |
| **The mix in the jacket**      | `tank-and-tap` section                                       | `loopT`, stretch `jacket`                 | A strip of 40 cells along the axis. Drawn in the gap, seen only in section                                                                                            |
| **The risers**                 | `collector`; `rig` x-ray                                     | `loopT`, stretch `risers`                 | A strip of 32 cells up the slope                                                                                                                                      |
| **The headers**                | `collector`                                                  | `loopT`, `lowerHeader`, `upperHeader`     | The node's colour                                                                                                                                                     |
| **The dots of the circuit**    | `rig`, `collector`, `tank-and-tap`                           | `pipeSpeed`, `flowDir`, `loopT`           | True speed, scaled by each stretch's section, with a floor of 8 mm/s in the pipes while the state says it flows (`docs/3d.md` §2). Each dot its node's colour         |
| **The drinking water's dots**  | `house`, `tank-and-tap`                                      | `tapFlow`, `layers[0]`, `tankTop`, `tapT` | v = Q / A on a 22 mm line. Still when no tap runs                                                                                                                     |
| **The shower's drops**         | `tank-and-tap`, `house`                                      | `tapFlow`                                 | Each drop falls under gravity from the head, from an initial 1.6 m/s (estimate), down to the tray. How many: in proportion to the flow, a full 420 at 8 L/min. Tested |
| **The drip at the relief**     | `tank-and-tap`, at its funnel; `house`, at the drain's gully | `reliefDrip`                              | One drop of 0.05 mL (a usual size), at the model's L/h, in real time, capped at 10 a second. Tested                                                                   |

**Decoration, listed as such:**

- **The steam at the shower.** Sprites, its strength a function of `tapT` above `airT`. No model of evaporation. Off when the tap is.
- The spread of the shower's drops, and their phases: seeded, no physics.

**Not drawn, because the model has none:** water in the pipes as a visible surface (they are closed), the boiling of the circuit past `vented`, any leak.
