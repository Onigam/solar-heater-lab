import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { ROOF_UNIT } from '../../sim/machine';
import {
  BANK,
  BANK_WIDTH,
  COLLECTOR,
  COLLECTOR_X,
  CASE_INNER,
  drawnTankHeight,
  HEADER_N,
  JACKET_OUTER,
  LOWER_HEADER_S,
  RAIL,
  SPACER_XS,
  TANK,
  UPPER_HEADER_S,
  VESSEL_OUTER,
} from '../dims';
import { boxOf, finiteTree } from '../test-utils';
import { buildCollector, COLLECTOR_LAYERS, riserX } from './collector';
import { machineLook } from './look';
import { buildTank, TANK_PARTS } from './tank';
import { buildRoofUnit, UNIT_PARTS } from './unit';

const unit = buildRoofUnit(machineLook());

/** Everything drawn of an object, in the body's frame: its box. */
function inBody(o: THREE.Object3D): THREE.Box3 {
  unit.root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(unit.body.matrixWorld).invert();
  const out = new THREE.Box3();
  const v = new THREE.Vector3();
  o.traverseVisible((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    const pos = m.geometry.attributes.position;
    const rel = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
    for (let i = 0; i < pos.count; i++) out.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(rel));
  });
  return out;
}

describe('the machine holds the maker’s dimensions', () => {
  const all = inBody(unit.body);
  it('is 2.43 m wide with its fittings (K2)', () => {
    expect(all.max.x - all.min.x).toBeLessThanOrEqual(ROOF_UNIT.systemWidth + 0.005);
    expect(all.max.x - all.min.x).toBeGreaterThan(ROOF_UNIT.systemWidth - 0.05);
  });
  it('is 2.49 m from the foot of the collectors to the back of the tank (K2)', () => {
    expect(TANK.centreS + TANK.caseR).toBeCloseTo(ROOF_UNIT.alongSlope, 6);
    const tank = inBody(unit.parts['storage-tank']);
    expect(-tank.min.z).toBeLessThanOrEqual(ROOF_UNIT.alongSlopePlan);
  });
  it('stays inside 2.63 m along the slope with its fittings (K2)', () => {
    expect(-all.min.z).toBeLessThanOrEqual(ROOF_UNIT.alongSlopePlan + 0.002);
  });
  it('has collectors of 1.943 × 1.027 × 0.083 m and 35 risers at 29.3 mm (K4)', () => {
    const c = buildCollector(machineLook());
    const b = boxOf(c.layers['collector-tray']);
    expect(Math.abs(b.max.x - b.min.x - COLLECTOR.width)).toBeLessThan(0.0025); // its rivet heads stand a millimetre proud
    expect(-b.min.z).toBeCloseTo(COLLECTOR.length, 4);
    expect(b.max.y).toBeCloseTo(COLLECTOR.depth, 4);
    expect(riserX(1) - riserX(0)).toBeCloseTo(COLLECTOR.width / 35, 6);
    expect(riserX(34)).toBeLessThan(COLLECTOR.width / 2);
  });
  it('leaves 1.87 m² of aperture inside its frame (K4)', () => {
    const A = COLLECTOR.frameWidth;
    expect((COLLECTOR.length - 2 * A) * (COLLECTOR.width - 2 * A)).toBeCloseTo(ROOF_UNIT.apertureArea, 6);
  });
  it('sits at y within the 5 cm of K30, its case above the collector’s top', () => {
    expect(Math.abs(drawnTankHeight())).toBeLessThanOrEqual(0.05);
    expect(drawnTankHeight()).toBeGreaterThan(0);
  });
  it('wraps 300 L in a Ø0.44 m vessel (K1, research §3)', () => {
    expect((Math.PI * TANK.vesselR ** 2 * TANK.vesselLength * 1000).toFixed(1)).toBe('300.0');
    expect(VESSEL_OUTER).toBeLessThan(JACKET_OUTER);
    expect(JACKET_OUTER).toBeLessThan(CASE_INNER);
  });
  it('builds every part with finite numbers', () => {
    expect(finiteTree(unit.root)).toBe(true);
    for (const id of UNIT_PARTS) expect(inBody(unit.parts[id]).isEmpty(), id).toBe(false);
    for (const id of COLLECTOR_LAYERS) expect(boxOf(unit.collectors.left.layers[id]).isEmpty(), id).toBe(false);
    for (const id of TANK_PARTS) expect(boxOf(unit.tank.parts[id]).isEmpty(), id).toBe(false);
  });
});

describe('nothing floats, nothing sinks: each body on its support, in the roof’s frame', () => {
  const R = TANK.caseR;
  it('the rail stands on the roof’s plane', () => {
    expect(inBody(unit.parts['collector-rail']).min.y).toBeCloseTo(0, 4);
  });
  it('the collectors lie on the rail’s web', () => {
    const a = inBody(unit.parts['collector-left']);
    expect(a.min.y).toBeCloseTo(BANK.standoff, 4);
    const rail = inBody(unit.parts['collector-rail']);
    expect(rail.max.z).toBeGreaterThan(0); // the lip is below the collector's foot
    expect(a.max.z).toBeLessThanOrEqual(1e-6);
    expect(-rail.max.z).toBeLessThan(0.03); // the lip within a finger of the foot
  });
  it('the spacers stand on the roof’s plane, against the collector’s top, under its back', () => {
    const b = inBody(unit.parts['tank-spacer']);
    expect(b.min.y).toBeCloseTo(0, 4);
    expect(-b.max.z).toBeLessThan(COLLECTOR.length); // runs under the tray's top end
    expect(SPACER_XS[1] - SPACER_XS[0]).toBeCloseTo(BANK_WIDTH - 0.4, 4); // 200 mm from the outer edges (K8)
  });
  it('the tank’s saddles stand on the plane, the front at 2.05 m (K8)', () => {
    // the saddles are the lowest thing the tank carries
    const b = inBody(unit.parts['storage-tank']);
    expect(b.min.y).toBeGreaterThanOrEqual(-0.0005);
    expect(b.min.y).toBeLessThan(0.002);
    const front = TANK.centreS - Math.sqrt(R * R - (TANK.centreN - 0.0945) ** 2);
    expect(RAIL.toFoot).toBeGreaterThan(front - 0.05);
  });
  it('the case lies in the saddles, within a millimetre', () => {
    const s = 2.3;
    const n = TANK.centreN - Math.sqrt(R * R - (s - TANK.centreS) ** 2);
    expect(Math.hypot(s - TANK.centreS, n - TANK.centreN) - R).toBeCloseTo(0, 5);
  });
  it('the straps run from the plane over the case, on the rafters’ X', () => {
    const b = inBody(unit.parts['tank-strap']);
    expect(b.min.y).toBeCloseTo(0, 3);
    expect(b.max.y).toBeCloseTo(TANK.centreN + R + 0.0015 + TANK.strapThickness, 3);
  });
  it('the reservoir’s saddles reach the case', () => {
    const top = unit.tankToBody(new THREE.Vector3(-0.7, R, 0));
    const res = inBody(unit.parts['overflow-reservoir']);
    expect(res.containsPoint(top) || res.distanceToPoint(top) < 0.005).toBe(true);
  });
});

describe('every line reaches what it joins', () => {
  const stubX = BANK_WIDTH / 2 + COLLECTOR.stub;
  const heights: [number, number][] = [
    [0, 0],
    [0, 0.3],
    [0, 1.83],
    [2.36, -0.02],
    [2.36, -0.3],
    [2.36, -0.61],
    [2.36, -1.22],
  ];
  for (const [side, up] of heights) {
    it(`at side ${side}, up ${up}: both pipes end on their fittings, within 3 mm`, () => {
      unit.setPose(side, up);
      const e = unit.ends();
      const h = unit.hotPath;
      const c = unit.coldPath;
      expect(h[0].distanceTo(e.hotHeader)).toBeLessThan(0.1); // on the valve, itself on the stub
      expect(h[h.length - 1].distanceTo(e.hotPort)).toBeLessThan(0.003);
      expect(c[0].distanceTo(e.coldPort)).toBeLessThan(0.003);
      expect(c[c.length - 1].distanceTo(e.coldHeader)).toBeLessThan(0.003);
      expect(finiteTree(unit.root)).toBe(true);
    });
  }
  it('neither pipe runs into the roof, at home or above it', () => {
    for (const up of [0, 0.1, 0.5, 1.83]) {
      unit.setPose(0, up);
      for (const p of [...unit.hotPath, ...unit.coldPath]) expect(p.y, `${up}`).toBeGreaterThan(0.012);
    }
    unit.setPose(0, 0);
  });
  it('the hot pipe is short and the cold one long, as the maker draws them: about 0.35 m and 2.3 m', () => {
    unit.setPose(0, 0);
    const length = (path: THREE.Vector3[]) => path.slice(1).reduce((a, p, i) => a + p.distanceTo(path[i]), 0);
    expect(length(unit.hotPath)).toBeGreaterThan(0.25);
    expect(length(unit.hotPath)).toBeLessThan(0.45);
    expect(length(unit.coldPath)).toBeGreaterThan(2.1);
    expect(length(unit.coldPath)).toBeLessThan(2.5);
  });
  it('the valve on the hot outlet sits on the header’s stub', () => {
    unit.setPose(0, 0);
    const v = inBody(unit.parts['overheat-valve']);
    expect(v.max.x).toBeGreaterThanOrEqual(-stubX);
    expect(v.min.x).toBeLessThanOrEqual(unit.hotPath[0].x);
    expect(Math.abs((v.min.y + v.max.y) / 2 - HEADER_N)).toBeLessThan(0.03);
  });
  it('the unions join the two headers, top and bottom', () => {
    const u = inBody(unit.parts['collector-link']);
    expect(u.min.x).toBeLessThan(COLLECTOR_X.right - COLLECTOR.width / 2);
    expect(u.max.x).toBeGreaterThan(COLLECTOR_X.left + COLLECTOR.width / 2);
    expect(-u.max.z).toBeCloseTo(LOWER_HEADER_S - 0.019, 2);
    expect(-u.min.z).toBeCloseTo(UPPER_HEADER_S + 0.019, 2);
  });
  it('the fill is at the bottom left and the plug at the top right (K8)', () => {
    const f = inBody(unit.parts['fill-port']);
    const p = inBody(unit.parts['top-plug']);
    expect(f.max.x).toBeLessThan(0);
    expect(-f.max.z).toBeLessThan(0.2);
    expect(p.min.x).toBeGreaterThan(0);
    expect(-p.min.z).toBeGreaterThan(1.7);
  });
});

describe('the panel’s two switches', () => {
  it('put a valve on the cold pipe and sleeves on both, on their own axis', () => {
    unit.setPose(0, 0);
    unit.setExtras(true, true);
    expect(unit.extras.valve.visible).toBe(true);
    expect(unit.extras.hotSleeve.visible).toBe(true);
    const v = boxOf(unit.extras.valve);
    const c = boxOf(unit.parts['cold-pipe']);
    expect(c.containsBox(v)).toBe(true);
    unit.setPose(2.36, -0.61);
    expect(finiteTree(unit.root)).toBe(true);
    unit.setExtras(false, false);
    expect(unit.extras.valve.visible).toBe(false);
    unit.setPose(0, 0);
  });
});

describe('the tank never passes through the bank', () => {
  for (const up of [0.01, 0.5, 1.83]) {
    it(`above: at up ${up}`, () => {
      unit.setPose(0, up);
      const a = inBody(unit.tank.parts['outer-case']);
      const b = inBody(unit.parts['collector-left']);
      // a box of a tilted body is generous: it is checked against the collector's own plane
      expect(a.min.z).toBeLessThan(b.min.z);
    });
  }
  for (const up of [-0.05, -0.61, -1.22]) {
    it(`beside: at up ${up}`, () => {
      unit.setPose(2.36, up);
      const a = boxOf(unit.tank.parts['outer-case']);
      const b = boxOf(unit.parts['collector-right']);
      expect(a.min.x).toBeGreaterThan(b.max.x);
    });
  }
});

describe('a tank’s views', () => {
  const tank = buildTank(machineLook(), { views: true });
  it('are the same dimensions: the section and the whole share the case’s extent', () => {
    tank.setView('full');
    const full = boxOf(tank.parts['outer-case']);
    tank.setView('length');
    const half = boxOf(tank.parts['outer-case']);
    expect(half.min.x).toBeCloseTo(full.min.x, 4);
    expect(half.max.x).toBeCloseTo(full.max.x, 4);
    expect(half.max.y).toBeCloseTo(full.max.y, 3);
    expect(half.min.z).toBeCloseTo(full.min.z, 3);
    expect(half.max.z).toBeLessThan(0.001);
    tank.setView('across');
    const cross = boxOf(tank.parts['outer-case']);
    expect(cross.max.x).toBeCloseTo(full.max.x, 4);
    expect(cross.min.x).toBeGreaterThan(full.min.x + 0.5);
  });
  it('have ten cells of water', () => {
    expect(tank.layers.cells).toBe(10);
  });
});
