import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import type { SolarParams } from '../../sim/types';
import { RAIL, RIG_FOOT_Y, STAND_SIDEWAYS, TANK } from '../dims';
import { dotSpeed, MIN_SPEED } from '../flows';
import { UNIT_PARTS } from '../machine/unit';
import { boxOf, drawStats, finiteTree, stateWith, view } from '../test-utils';
import { createRigScene, EXPLODE } from './scene';

const mod = createRigScene(() => ({}) as SolarParams);
const st = stateWith({}, 0.1);

describe('the rig: the slider moves the tank, and only the tank', () => {
  it('at y = 0 the tank is the maker’s, the stand folded away', () => {
    mod.snap(0);
    expect(mod.drawn()).toEqual({ side: 0, up: 0 });
    const stand = boxOf(mod.stand.root);
    // the staff is all there is: nothing of the stand anywhere near the machine
    expect(stand.max.x).toBeLessThan(-1.2);
  });
  for (const y of [0.3, 1.83]) {
    it(`at y = +${y} it goes straight up by exactly that`, () => {
      mod.snap(y);
      expect(mod.drawn()).toEqual({ side: 0, up: y });
    });
  }
  for (const y of [-0.1, -0.61, -1.22]) {
    it(`at y = ${y} it goes beside the bank and down by exactly that`, () => {
      mod.snap(y);
      expect(mod.drawn().side).toBeCloseTo(STAND_SIDEWAYS, 6);
      expect(mod.drawn().up).toBeCloseTo(y, 6);
    });
  }
  it('everything of the tank rides with it: nothing of it, nor of what is strapped to it, stays behind', () => {
    mod.snap(0);
    const ids = ['storage-tank', 'tank-strap', 'overflow-reservoir'] as const;
    const at = ids.map((id) => boxOf(mod.unit.parts[id]));
    mod.snap(0.5);
    ids.forEach((id, i) => {
      const b = boxOf(mod.unit.parts[id]);
      expect(b.min.y - at[i].min.y, id).toBeCloseTo(0.5, 2);
      expect(b.max.y - at[i].max.y, id).toBeCloseTo(0.5, 2);
    });
    mod.snap(-0.61);
    ids.forEach((id, i) => {
      const b = boxOf(mod.unit.parts[id]);
      expect(b.min.x - at[i].min.x, id).toBeGreaterThan(2.3);
    });
    mod.snap(0);
  });
  it('the clips that hold the cold pipe to the tray go with the tray’s pipe, when it leaves', () => {
    mod.snap(-0.61);
    const clips = mod.unit.parts['cold-pipe'].children.find((c) => c.name === 'clips')!;
    expect(clips.visible).toBe(false);
    expect(clips.children.length).toBeGreaterThan(0);
    mod.snap(0);
    expect(clips.visible).toBe(true);
  });
  it('coming down from home, it slides sideways before it drops: never through the bank', () => {
    const m = createRigScene(() => ({}) as SolarParams);
    m.snap(0);
    let lowest = 0;
    const s = stateWith({ tankHeight: -0.61 }, 0.05);
    for (let i = 0; i < 600; i++) {
      m.update(s, 1 / 60, view());
      const d = m.drawn();
      if (d.side < STAND_SIDEWAYS * 0.95) lowest = Math.min(lowest, d.up);
    }
    expect(lowest).toBeGreaterThanOrEqual(-0.021);
    expect(m.drawn().up).toBeCloseTo(-0.61, 2);
    expect(m.drawn().side).toBeCloseTo(STAND_SIDEWAYS, 2);
  });
  it('a leg of the stand stands on the paper and reaches the batten under the tank, at every height', () => {
    for (const y of [0.3, 1.83, -0.3, -0.97, -1.22]) {
      mod.snap(y);
      const d = mod.drawn();
      mod.stand.update(d.side, d.up, y);
      const b = boxOf(mod.stand.root);
      expect(b.min.y, `${y}`).toBeCloseTo(0, 3);
      // the stand's cradle reaches the tank's feet: same plane as the machine's, moved by the pose
      const feet = boxOf(mod.unit.parts['storage-tank']);
      expect(b.max.y).toBeGreaterThan(feet.min.y);
    }
  });
});

describe('the rig: attached, and held', () => {
  it('stands on its paper: the bench’s posts reach the floor, the bench’s bars reach the rail', () => {
    mod.snap(0);
    const bench = boxOf(mod.bench);
    expect(bench.min.y).toBeCloseTo(0, 2);
    const rail = boxOf(mod.unit.parts['collector-rail']);
    // the rail's lowest edge rests on the bench's bar
    expect(rail.min.y).toBeLessThan(RIG_FOOT_Y + RAIL.lipTop);
    expect(rail.min.y).toBeGreaterThan(RIG_FOOT_Y - 0.05);
  });
  it('isolate takes the bench away: no post stands holding nothing', () => {
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, id === 'hot-pipe' ? 'solid' : 'hidden');
    mod.update(st, 1 / 60, view());
    expect(mod.bench.visible).toBe(false);
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, 'solid');
    mod.update(st, 1 / 60, view());
    expect(mod.bench.visible).toBe(true);
  });
  it('the exploded view moves every part but the stand, each by its own line', () => {
    for (const id of UNIT_PARTS) expect(Math.hypot(...EXPLODE[id]), id).toBeGreaterThan(0.05);
    const start = new Map(mod.registry.ids().map((id) => [id, mod.registry.get(id)!.object.position.clone()]));
    mod.registry.setAllFactors(1);
    for (const id of UNIT_PARTS)
      expect(mod.registry.get(id)!.object.position.distanceTo(start.get(id)!), id).toBeGreaterThan(0.05);
    mod.registry.setAllFactors(0);
  });
  it('dots stop while exploded or isolated: no pipe of dots stays behind', () => {
    mod.registry.setAllFactors(1);
    mod.update(st, 1 / 60, view({ schematic: true }));
    expect(mod.flows.object.visible).toBe(false);
    mod.registry.setAllFactors(0);
    mod.update(st, 1 / 60, view({ schematic: true }));
    expect(mod.flows.object.visible).toBe(true);
  });
  it('the tank’s axis stays at its own height above the collector’s top at home', () => {
    mod.snap(0);
    const tank = boxOf(mod.unit.tank.parts['outer-case']);
    const c = boxOf(mod.unit.parts['collector-left']);
    expect(tank.min.y - c.max.y).toBeGreaterThan(0);
    expect(tank.min.y - c.max.y).toBeLessThan(0.06);
    expect(TANK.caseR).toBeGreaterThan(0);
  });
});

describe('the flows run with the model', () => {
  it('forward by day, backward at night, still when the state says still', () => {
    expect(dotSpeed(0.12, 1)).toBeCloseTo(0.12, 6);
    expect(dotSpeed(-0.002, -1)).toBeCloseTo(-MIN_SPEED, 6);
    expect(dotSpeed(0.002, 0)).toBe(0);
  });
  it('the dots follow the state over a whole day: finite everywhere', () => {
    const s = stateWith({ hour: 12 }, 0.5);
    mod.update(s, 1 / 60, view({ schematic: true, slowMo: 0.5 }));
    expect(finiteTree(mod.scene)).toBe(true);
    expect(mod.flows.count + mod.fine.count).toBeGreaterThan(100);
  });
});

describe('budgets', () => {
  it('stays cheap: draw calls and triangles of the assembled world', () => {
    mod.snap(0);
    mod.update(st, 1 / 60, view());
    const s = drawStats(mod.scene);
    expect(s.calls).toBeLessThan(110);
    expect(s.triangles).toBeLessThan(120000);
  });
});

void THREE;
