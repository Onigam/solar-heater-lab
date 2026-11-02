import { describe, expect, it } from 'vitest';
import { buildTank, TANK_PARTS } from '../machine/tank';
import { machineLook } from '../machine/look';
import { PART_NAMES } from '../part-ids';
import { boxOf, drawStats, finiteTree, stateWith, view } from '../test-utils';
import { TANK, TAP } from '../dims';
import { createTankScene, EXPLODE } from './scene';
import { reliefRate, showerDrops } from './water';

const mod = createTankScene();
const st = stateWith({ hour: 15 }, 0.1);

describe('the tank-and-tap world', () => {
  it('registers the seventeen parts of research §4.4', () => {
    const want = PART_NAMES.filter((p) => p.world === 'tank-and-tap')
      .map((p) => p.id)
      .sort();
    expect(mod.registry.ids().sort()).toEqual(want);
  });
  it('has every label on a part of this world', () => {
    for (const h of mod.hotspots) expect(mod.registry.get(h.partId), h.partId).toBeDefined();
  });
  it('joins its lines: each end within 3 mm of what it joins', () => {
    for (const j of mod.joints) expect(j.a.distanceTo(j.b), j.name).toBeLessThan(0.003);
  });
  it('the shower’s drops follow the model’s flow, and stop with it', () => {
    expect(showerDrops(0, 400)).toBe(0);
    expect(showerDrops(4, 400)).toBe(200);
    expect(showerDrops(8, 400)).toBe(400);
    expect(showerDrops(30, 400)).toBe(400);
    mod.update({ ...st, tapFlow: 0 }, 1 / 60, view());
    expect(mod.shower.alive).toBe(0);
    mod.update({ ...st, tapFlow: 6, tapT: 40 }, 1 / 60, view());
    expect(mod.shower.alive).toBeGreaterThan(0);
  });
  it('its steam grows with the water’s heat, and is off when the tap is', () => {
    mod.update({ ...st, tapFlow: 6, tapT: 25, airT: 20 }, 1 / 60, view());
    const low = mod.shower.steamNow;
    mod.update({ ...st, tapFlow: 6, tapT: 50, airT: 20 }, 1 / 60, view());
    expect(mod.shower.steamNow).toBeGreaterThan(low);
    mod.update({ ...st, tapFlow: 0, tapT: 50, airT: 20 }, 1 / 60, view());
    expect(mod.shower.steamNow).toBe(0);
  });
  it('the relief drips at the model’s rate, one drop at a time', () => {
    expect(reliefRate(0)).toBe(0);
    expect(reliefRate(0.18)).toBeCloseTo(1, 5);
    expect(reliefRate(100)).toBe(10);
    mod.update({ ...st, reliefDrip: 0 }, 1 / 60, view());
    expect(mod.drip.object.visible).toBe(false);
    const before = mod.drip.fallen;
    for (let i = 0; i < 600; i++) mod.update({ ...st, reliefDrip: 1.8 }, 1 / 60, view());
    expect(mod.drip.fallen).toBeGreaterThan(before + 4);
  });
  it('the booster lights only when the model says so', () => {
    mod.update({ ...st, boostOn: true }, 1 / 60, view());
    expect(mod.element.emissiveIntensity).toBeGreaterThan(0);
    mod.update({ ...st, boostOn: false }, 1 / 60, view());
    expect(mod.element.emissiveIntensity).toBe(0);
  });
  it('rests on its brackets: the case’s lowest line on the arms', () => {
    mod.update(st, 1 / 60, view());
    const c = boxOf(mod.tank.parts['outer-case']);
    expect(c.min.y).toBeCloseTo(TAP.tankY - TANK.caseR, 2);
  });
  it('the exploded view: the case goes first, up; nothing is left where it hides another', () => {
    expect(EXPLODE['outer-case'][1]).toBeGreaterThan(EXPLODE['tank-foam'][1]);
    expect(EXPLODE['tank-foam'][1]).toBeGreaterThan(EXPLODE['inner-vessel'][1]);
    expect(EXPLODE['mantle-jacket'][1]).toBeLessThan(0);
    expect(EXPLODE['water-column']).toEqual([0, 0, 0]);
    mod.registry.setAllFactors(1);
    const left = mod.tank.caps.left.position.x;
    const right = mod.tank.caps.right.position.x;
    expect(left).toBeLessThan(-0.3);
    expect(right).toBeGreaterThan(0.3);
    mod.registry.setAllFactors(0);
    expect(mod.tank.caps.left.position.x).toBeCloseTo(0, 6);
  });
  it('isolate takes the wall and the brackets away', () => {
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, id === 'water-column' ? 'solid' : 'hidden');
    mod.update(st, 1 / 60, view());
    expect(mod.wall.visible).toBe(false);
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, 'solid');
    mod.update(st, 1 / 60, view());
    expect(mod.wall.visible).toBe(true);
  });
  it('a section across keeps the case round', () => {
    mod.update(st, 1 / 60, view({ cutaway: true }));
    const c = boxOf(mod.tank.parts['outer-case']);
    expect(c.max.z).toBeGreaterThan(0.2);
    mod.update(st, 1 / 60, view());
    const d = boxOf(mod.tank.parts['outer-case']);
    expect(d.max.z).toBeLessThan(0.01);
    expect(finiteTree(mod.scene)).toBe(true);
  });
  it('holds its budget', () => {
    const s = drawStats(mod.scene);
    expect(s.calls).toBeLessThan(90);
    expect(s.triangles).toBeLessThan(120000);
  });
});

describe('it is the roof’s tank', () => {
  it('the same function gives the same dimensions, within 3 mm', () => {
    const a = buildTank(machineLook());
    const b = buildTank(machineLook(), { views: true });
    b.setView('full');
    for (const id of TANK_PARTS) {
      const A = boxOf(a.parts[id]);
      const B = boxOf(b.parts[id]);
      expect(A.min.distanceTo(B.min), id).toBeLessThan(0.003);
      expect(A.max.distanceTo(B.max), id).toBeLessThan(0.003);
    }
  });
});
