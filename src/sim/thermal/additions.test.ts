import { describe, expect, it } from 'vitest';
import {
  airMass,
  boilingPoint,
  buoyancyMix,
  buoyantHead,
  cellsEfficiency,
  chainOutlet,
  clearSkyPlane,
  cosIncidence,
  createChain,
  createMixWork,
  curveEfficiency,
  declination,
  drawFromTop,
  expansion,
  fittingResistance,
  frictionFactor,
  glycolFreeze,
  glycolMix,
  glycolMu,
  glycolRho,
  GRAVITY,
  horizontalCylinderLayers,
  incidenceModifier,
  layerAt,
  localCurve,
  localLoss,
  mixInlet,
  neutralLayer,
  plateDepression,
  removalRatio,
  skyTemperature,
  slotResistance,
  stabilize,
  stagnationRise,
  stepChain,
  stepFlow,
  sunAltitude,
  sunAzimuth,
  sunTerms,
  tubeFlow,
  tubeResistance,
  verticalCylinderLayers,
  water,
  waterMu,
  waterRho,
} from './index';

// What this lab added to the core, checked against closed forms and printed tables, with no figure from the machine: its figures are in src/sim/figures.test.ts.

describe('the additions can move to the kit with the rest', () => {
  const sources = import.meta.glob(['./fluids.ts', './solar.ts', './loop.ts', './layers.ts'], {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  it('have no name from this lab', () => {
    expect(Object.keys(sources)).toHaveLength(4);
    for (const [file, text] of Object.entries(sources)) {
      expect(text, file).not.toMatch(/solahart|keymark|athens|davos|\broof\b|\bshower\b/i);
    }
  });
});

describe('water', () => {
  it('has the density of Kell (1975) at the table’s points', () => {
    const table: [number, number][] = [
      [0, 999.84],
      [4, 999.97],
      [20, 998.2],
      [40, 992.21],
      [60, 983.2],
      [80, 971.79],
      [100, 958.35],
    ];
    for (const [T, rho] of table) expect(waterRho(T)).toBeCloseTo(rho, 1);
  });
  it('is densest near 4 °C, which matters on a frosty night', () => {
    expect(waterRho(4)).toBeGreaterThan(waterRho(1));
    expect(waterRho(4)).toBeGreaterThan(waterRho(8));
  });
  it('has its viscosity within 2.5 % of the IAPWS table', () => {
    const table: [number, number][] = [
      [0, 1.792e-3],
      [20, 1.002e-3],
      [40, 0.653e-3],
      [60, 0.466e-3],
      [80, 0.355e-3],
      [100, 0.282e-3],
    ];
    for (const [T, mu] of table) expect(Math.abs(waterMu(T) / mu - 1)).toBeLessThan(0.025);
  });
  it('the tabulated fluid returns the formula', () => {
    const w = water();
    for (const T of [3, 21, 57, 99]) {
      expect(w.rho(T)).toBeCloseTo(waterRho(T), 1);
      expect(w.mu(T) / waterMu(T)).toBeCloseTo(1, 2);
    }
    expect(w.cp).toBe(4186);
  });
  it('boils at the right place', () => {
    expect(boilingPoint(0)).toBeCloseTo(100, 0);
    expect(boilingPoint(80e3)).toBeCloseTo(117, 0);
    expect(boilingPoint(200e3)).toBeCloseTo(133.5, 0);
  });
});

describe('the glycol mix', () => {
  it('has the makers’ freezing table', () => {
    expect(glycolFreeze(20)).toBeCloseTo(-7, 6);
    expect(glycolFreeze(30)).toBeCloseTo(-13, 6);
    expect(glycolFreeze(40)).toBeCloseTo(-22, 6);
    expect(glycolFreeze(50)).toBeCloseTo(-34, 6);
    expect(glycolFreeze(0)).toBeCloseTo(0, 6);
  });
  it('reads its density table', () => {
    expect(glycolRho(30, 20)).toBeCloseTo(1022, 6);
    expect(glycolRho(60, 40)).toBeCloseTo(1029, 6);
    expect(glycolRho(35, 20)).toBeCloseTo((1022 + 1030) / 2, 6);
  });
  it('is more viscous with more glycol and when cold, and joins water at 0 %', () => {
    expect(glycolMu(40, 20)).toBeGreaterThan(glycolMu(20, 20));
    expect(glycolMu(30, 5)).toBeGreaterThan(glycolMu(30, 60));
    expect(glycolMu(0, 20)).toBeCloseTo(waterMu(20), 8);
    expect(glycolMu(60, 37.8) * 1000).toBeGreaterThan(4); // LBL's Fig. 2: about 5 mPa·s at 100 °F, 60 % by weight
    expect(glycolMu(60, 37.8) * 1000).toBeLessThan(6);
  });
  it('expands more than water when cool: the push of a mix is larger', () => {
    const mix = glycolMix(24);
    expect(expansion(mix, 30)).toBeGreaterThan(expansion(water(), 30));
    expect(expansion(water(), 30)).toBeCloseTo(3.0e-4, 4);
    expect(mix.cp).toBeGreaterThan(3700);
    expect(mix.cp).toBeLessThan(4186);
    expect(mix.freezeT).toBeLessThan(-8);
    expect(glycolMix(24)).toBe(mix); // cached
  });
});

describe('the sun', () => {
  it('declination', () => {
    expect(declination(172)).toBeCloseTo(23.45, 1);
    expect(declination(355)).toBeCloseTo(-23.45, 1);
    expect(Math.abs(declination(81))).toBeLessThan(0.5);
  });
  it('at solar noon the incidence on a plane facing the equator is latitude − declination − tilt', () => {
    const t = sunTerms(38, 172, 30, 0);
    const expected = Math.abs(38 - declination(172) - 30);
    expect((Math.acos(cosIncidence(t, 12)) * 180) / Math.PI).toBeCloseTo(expected, 6);
    expect(sunAltitude(t, 12)).toBeCloseTo(90 - (38 - declination(172)), 6);
    expect(sunAzimuth(t, 12)).toBeCloseTo(0, 6);
    expect(sunAzimuth(t, 16)).toBeGreaterThan(0); // west in the afternoon
  });
  it('a plane turned away has a morning and an afternoon that differ', () => {
    const t = sunTerms(38, 172, 30, 45);
    expect(cosIncidence(t, 15)).toBeGreaterThan(cosIncidence(t, 9));
  });
  it('air mass is 1 at the zenith', () => {
    expect(airMass(1)).toBeCloseTo(1, 2);
    expect(airMass(0.5)).toBeCloseTo(2, 1);
    expect(airMass(-0.1)).toBe(Infinity);
  });
  it('a clear noon gives about a kilowatt, the night nothing', () => {
    const t = sunTerms(38, 172, 30, 0);
    const noon = clearSkyPlane(t, 12);
    expect(noon.beam + noon.diffuse).toBeGreaterThan(850);
    expect(noon.beam + noon.diffuse).toBeLessThan(1150);
    const night = clearSkyPlane(t, 1);
    expect(night.beam + night.diffuse).toBe(0);
  });
  it('the incidence modifier reads its table', () => {
    const table = [
      [20, 0.97],
      [60, 0.83],
    ] as const;
    expect(incidenceModifier(table, 0)).toBe(1);
    expect(incidenceModifier(table, 20)).toBeCloseTo(0.97, 6);
    expect(incidenceModifier(table, 40)).toBeCloseTo(0.9, 6);
    expect(incidenceModifier(table, 90)).toBe(0);
  });
});

describe('a certificate turned into local coefficients', () => {
  const curve = { eta0: 0.778, a1: 6.541, a2: 0.025 };
  const m = 0.02 * 4180;
  it('the chain returns the certificate at its test flow, whatever the number of cells', () => {
    for (const n of [1, 6, 32]) {
      const p = localCurve(curve, m, n);
      for (const x of [0, 0.03, 0.06]) {
        expect(cellsEfficiency(p, x, 800, m, n)).toBeCloseTo(curveEfficiency(curve, x, 800), 6);
      }
      // and between them, and past them, within a thousandth
      for (const x of [0.015, 0.045, 0.08]) {
        expect(Math.abs(cellsEfficiency(p, x, 800, m, n) - curveEfficiency(curve, x, 800))).toBeLessThan(1e-3);
      }
    }
  });
  it('a slower fluid runs hotter and gives less', () => {
    const p = localCurve(curve, m, 12);
    expect(cellsEfficiency(p, 0.03, 800, m / 4, 12)).toBeLessThan(cellsEfficiency(p, 0.03, 800, m, 12));
  });
  it('stagnates where the curve says', () => {
    expect(stagnationRise(curve, 1000)).toBeCloseTo(88.8, 1);
    expect(curveEfficiency(curve, stagnationRise(curve, 1000) / 1000, 1000)).toBeCloseTo(0, 8);
    expect(stagnationRise({ eta0: 0.7, a1: 5, a2: 0 }, 1000)).toBeCloseTo(140, 8);
  });
  it('the linear forms invert', () => {
    const FpU = localLoss(7.939, m);
    expect(m * (1 - Math.exp(-FpU / m))).toBeCloseTo(7.939, 8);
    expect(removalRatio(FpU, m) * FpU).toBeCloseTo(7.939, 8);
  });
});

describe('the night sky', () => {
  it('Swinbank', () => {
    expect(skyTemperature(10)).toBeCloseTo(0.0552 * Math.pow(283.15, 1.5) - 273.15, 8);
    expect(skyTemperature(10)).toBeCloseTo(-10.1, 0);
    expect(skyTemperature(30)).toBeGreaterThan(skyTemperature(10));
  });
  const black = { plateEmissivity: 0.9 };
  it('a cloud sends back what the sky took', () => {
    expect(plateDepression(10, 0, 2, black)).toBe(0);
    expect(plateDepression(10, 1, 2, black)).toBeGreaterThan(plateDepression(10, 0.5, 2, black));
  });
  it('a calm night is colder, a windy one closer to the air', () => {
    expect(plateDepression(10, 1, 0.5, black)).toBeGreaterThan(plateDepression(10, 1, 5, black));
  });
  it('black paint falls further than a selective plate, which sees the glass less', () => {
    expect(plateDepression(5, 1, 2, black)).toBeGreaterThan(plateDepression(5, 1, 2, { plateEmissivity: 0.1 }));
  });
  it('satisfies its own balance', () => {
    const Ta = 10;
    const hPlate = (1 / (1 / 0.9 + 1 / 0.88 - 1)) * 4 * 5.670374e-8 * Math.pow(283.15, 3) + 1;
    const hSky = 0.88 * 4 * 5.670374e-8 * Math.pow(283.15, 3);
    const hAir = 2.8 + 3 * 2;
    const y = -plateDepression(Ta, 1, 2, black);
    const x = (y * (hPlate + 1)) / hPlate; // the plate's balance gives the glass
    const skyDrop = Ta - skyTemperature(Ta);
    // the glass's balance
    expect(hAir * x + hSky * (x + skyDrop) + hPlate * (x - y)).toBeCloseTo(0, 6);
  });
});

describe('the head round a loop', () => {
  it('a level loop and a uniform one push nothing', () => {
    expect(buoyantHead([0, 0], [1000, 900])).toBeCloseTo(0, 10);
    expect(buoyantHead([1, -1], [1000, 1000])).toBeCloseTo(0, 10);
  });
  it('light going up and heavy coming down pushes forward', () => {
    expect(buoyantHead([1, -1], [990, 1000])).toBeCloseTo(GRAVITY * 10, 8);
    expect(buoyantHead([1, -1], [1000, 990])).toBeCloseTo(-GRAVITY * 10, 8);
  });
  it('returns the closed form of Kalogirou (S26, eq. 12) on its own geometry', () => {
    // no pipe losses, a linear tank: hT = ½(Si − So)[2(H3 − H1) − (H2 − H1) − (H3 − H5)²/(H4 − H5)], Si and So in the unit of the density
    const H1 = 0;
    const H2 = 1.2;
    const H3 = 2.1;
    const H4 = 2.4;
    const H5 = 1.5;
    const Si = 1000;
    const So = 985;
    const closed = 0.5 * (Si - So) * (2 * (H3 - H1) - (H2 - H1) - ((H3 - H5) * (H3 - H5)) / (H4 - H5));
    const dz: number[] = [];
    const rho: number[] = [];
    const N = 2000;
    // up the collector, linear
    for (let i = 0; i < N; i++) {
      dz.push((H2 - H1) / N);
      rho.push(Si + ((So - Si) * (i + 0.5)) / N);
    }
    // hot pipe at So
    dz.push(H3 - H2);
    rho.push(So);
    // down the tank from H3 to H5: linear between H5 (Si) and H4 (So)
    for (let i = 0; i < N; i++) {
      const z = H3 + ((H5 - H3) * (i + 0.5)) / N;
      dz.push((H5 - H3) / N);
      rho.push(Si + ((So - Si) * (z - H5)) / (H4 - H5));
    }
    // cold pipe at Si
    dz.push(H1 - H5);
    rho.push(Si);
    expect(buoyantHead(dz, rho) / GRAVITY).toBeCloseTo(closed, 6);
  });
});

describe('friction', () => {
  it('a tube is Hagen-Poiseuille while laminar, and does not vanish as the flow stops', () => {
    const r = tubeResistance(1e-6, 0.02, 2, 1, 1000, 1e-3);
    expect(r).toBeCloseTo((128 * 1e-3 * 2) / (Math.PI * 0.02 ** 4), 3);
    expect(tubeResistance(0, 0.02, 2, 1, 1000, 1e-3)).toBeCloseTo(r, 3);
    expect(tubeResistance(1e-6, 0.02, 2, 10, 1000, 1e-3)).toBeCloseTo(r / 10, 3);
  });
  it('the friction factor has no jump', () => {
    expect(frictionFactor(1000)).toBeCloseTo(0.064, 8);
    expect(frictionFactor(2300)).toBeCloseTo(64 / 2300, 8);
    expect(frictionFactor(4000)).toBeCloseTo(Math.pow(0.79 * Math.log(4000) - 1.64, -2), 8);
    for (let Re = 2300; Re < 4000; Re += 50) {
      expect(Math.abs(frictionFactor(Re + 50) - frictionFactor(Re))).toBeLessThan(0.002);
    }
  });
  it('a turbulent tube is Darcy', () => {
    const Q = 3e-4;
    const D = 0.02;
    const A = (Math.PI * D * D) / 4;
    const v = Q / A;
    const f = frictionFactor((1000 * v * D) / 1e-3);
    expect(tubeResistance(Q, D, 2, 1, 1000, 1e-3) * Q).toBeCloseTo((f * (2 / D) * 1000 * v * v) / 2, 3);
  });
  it('a slot and a bend', () => {
    expect(slotResistance(1e-3, 2, 0.7, 0.01)).toBeCloseTo((12 * 1e-3 * 2) / (0.7 * 1e-6), 3);
    const R0 = fittingResistance(0, 0.02, 1, 1000, 1e-3);
    expect(R0).toBeCloseTo((800 * 1e-3) / (2 * 0.02 * ((Math.PI * 0.02 * 0.02) / 4)), 3);
    expect(fittingResistance(1e-4, 0.02, 2, 1000, 1e-3)).toBeGreaterThan(2 * R0);
  });
  it('tubeFlow takes a flow of either sign (the core’s one change for this lab)', () => {
    const gas = { rho: 1000, mu: 1e-3, k: 0.6, Pr: 7 };
    const a = tubeFlow(0.02, 0.02, gas);
    const b = tubeFlow(-0.02, 0.02, gas);
    expect(b.Re).toBeCloseTo(a.Re, 8);
    expect(b.h).toBeCloseTo(a.h, 8);
    expect(b.velocity).toBeCloseTo(-a.velocity, 8);
  });
});

describe('the flow', () => {
  it('settles where the push equals the friction, without overshoot, at any step', () => {
    for (const dt of [1, 10, 100, 1000]) {
      let Q = 0;
      let prev = 0;
      for (let i = 0; i < 400; i++) {
        Q = stepFlow(Q, 40, 1e6, 1e7, dt);
        expect(Q).toBeGreaterThanOrEqual(prev - 1e-12);
        prev = Q;
      }
      expect(Q).toBeCloseTo(40 / 1e6, 8);
    }
  });
  it('reversal is a sign', () => {
    let Q = 1e-5;
    for (let i = 0; i < 400; i++) Q = stepFlow(Q, -20, 1e6, 1e7, 5);
    expect(Q).toBeCloseTo(-20 / 1e6, 8);
  });
});

describe('a chain of fluid nodes', () => {
  const energy = (c: ReturnType<typeof createChain>): number => {
    let e = 0;
    for (let i = 0; i < c.n; i++) e += c.C[i]! * c.T[i]!;
    return e;
  };
  it('a closed ring conserves energy to rounding, at any step and in either direction', () => {
    for (const mc of [120, -120, 0.5, -0.5]) {
      for (const dt of [1, 60, 3600]) {
        const c = createChain(8, 20);
        c.C.fill(2000);
        c.T[3] = 80;
        const e0 = energy(c);
        for (let s = 0; s < 50; s++) stepChain(c, mc, dt);
        expect(Math.abs(energy(c) - e0) / e0).toBeLessThan(1e-12);
        // and it mixes towards the mean
        expect(Math.max(...c.T)).toBeLessThanOrEqual(80);
        expect(Math.min(...c.T)).toBeGreaterThanOrEqual(20 - 1e-9);
      }
    }
  });
  it('is monotone: a large step never overshoots', () => {
    const c = createChain(4, 10);
    c.C.fill(100);
    c.T[0] = 100;
    stepChain(c, 1000, 1000);
    for (const t of c.T) {
      expect(t).toBeGreaterThanOrEqual(10);
      expect(t).toBeLessThanOrEqual(100);
    }
  });
  it('an open chain relaxes to the exponential of a heated pipe', () => {
    const n = 400;
    const c = createChain(n, 20);
    c.C.fill(10);
    const G = 50;
    c.G.fill(G / n);
    c.Text.fill(100);
    const mc = 100;
    for (let s = 0; s < 40; s++) stepChain(c, mc, 100, 20);
    const expected = 100 + (20 - 100) * Math.exp(-G / mc);
    expect(chainOutlet(c, mc)).toBeCloseTo(expected, 1);
  });
  it('runs the other way with the other sign', () => {
    const c = createChain(4, 50);
    c.C.fill(10);
    for (let s = 0; s < 200; s++) stepChain(c, -100, 10, 20);
    expect(chainOutlet(c, -100)).toBeCloseTo(20, 6);
    expect(c.T[0]).toBeCloseTo(20, 6);
  });
  it('an open chain balances what enters and leaves', () => {
    const c = createChain(5, 30);
    c.C.fill(500);
    const e0 = energy(c);
    const mc = 80;
    const dt = 10;
    let carried = 0;
    for (let s = 0; s < 20; s++) {
      stepChain(c, mc, dt, 60);
      carried += mc * dt * (60 - chainOutlet(c, mc));
    }
    expect(energy(c) - e0).toBeCloseTo(carried, 5);
  });
});

describe('a tank in layers', () => {
  it('a horizontal cylinder: volumes add up, the middle is the largest, the two ends match', () => {
    const t = horizontalCylinderLayers(0.44, 2, 10);
    const V = t.volume.reduce((a, b) => a + b, 0);
    expect(V).toBeCloseTo((Math.PI * 0.44 * 0.44 * 2) / 4, 6);
    expect(t.volume[0]).toBeCloseTo(t.volume[9]!, 8);
    expect(t.volume[4]).toBeGreaterThan(t.volume[0]! * 2);
    expect(t.zEdges[10]).toBeCloseTo(0.44, 8);
    expect(t.interfaceArea[4]).toBeCloseTo(0.44 * 2, 6);
    // the side and two ends
    const wall = t.wallArea.reduce((a, b) => a + b, 0);
    expect(wall).toBeCloseTo(Math.PI * 0.44 * 2 + (2 * Math.PI * 0.44 * 0.44) / 4, 6);
  });
  it('a vertical cylinder has equal layers', () => {
    const t = verticalCylinderLayers(0.5, 1.5, 10);
    expect(t.volume[3]).toBeCloseTo((Math.PI * 0.25 * 1.5) / 40, 8);
    expect(layerAt(t, 0)).toBe(0);
    expect(layerAt(t, 1.49)).toBe(9);
    expect(layerAt(t, 5)).toBe(9);
  });
  it('`stabilize` gives what `buoyancyMix` gives, with no allocation', () => {
    const w = [10, 20, 30, 30, 20, 10];
    const a = new Float64Array([50, 20, 60, 30, 40, 70]);
    const b = [...a];
    buoyancyMix(b, w);
    expect(stabilize(a, w, createMixWork(6))).toBe(true);
    for (let i = 0; i < 6; i++) expect(a[i]).toBeCloseTo(b[i]!, 10);
    const already = new Float64Array([1, 2, 3, 4, 5, 6]);
    expect(stabilize(already, w, createMixWork(6))).toBe(false);
  });
  it('a draw takes from the top what comes in at the bottom', () => {
    const T = new Float64Array([20, 30, 40, 50]);
    const w = [100, 100, 100, 100];
    const e0 = T.reduce((a, t, i) => a + t * w[i]!, 0);
    const out = drawFromTop(T, w, 50, 10);
    expect(out).toBe(50);
    expect(T.reduce((a, t, i) => a + t * w[i]!, 0)).toBeCloseTo(e0 - 50 * (out - 10), 6);
    expect(T[0]).toBeLessThan(20);
  });
  it('a long draw empties in substeps, the outlet falling', () => {
    const T = new Float64Array([20, 30, 40, 50]);
    const w = [100, 100, 100, 100];
    const out = drawFromTop(T, w, 500, 10);
    expect(out).toBeLessThan(50);
    expect(T[3]).toBeLessThan(45);
  });
  it('the inlet mixes the share it reaches', () => {
    const T = new Float64Array([10, 30, 60, 60]);
    const w = [1, 1, 1, 1];
    expect(mixInlet(T, w, [1, 1, 1, 1], 0.4)).toBe(2);
    expect(T[0]).toBeCloseTo(20, 8);
    expect(T[1]).toBeCloseTo(20, 8);
    expect(T[2]).toBe(60);
  });
  it('a warm film rises to its level, a cold one sinks to its own', () => {
    const T = [20, 30, 40, 50, 60];
    expect(neutralLayer(T, 0, 45, true)).toBe(2);
    expect(neutralLayer(T, 0, 70, true)).toBe(4);
    expect(neutralLayer(T, 0, 10, true)).toBe(0);
    expect(neutralLayer(T, 3, 35, false)).toBe(2);
    expect(neutralLayer(T, 3, 10, false)).toBe(0);
    expect(neutralLayer(T, 3, 70, false)).toBe(3);
  });
});
