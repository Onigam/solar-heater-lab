import { describe, expect, it } from 'vitest';
import type { SolarParams } from '../sim/types';
import { createCollectorScene } from './collector/scene';
import { createHouseScene } from './house/scene';
import { createRigScene } from './rig/scene';
import { createTankScene } from './tank/scene';
import { PART_NAMES, partName } from './part-ids';
import { finiteTree, stateWith, view } from './test-utils';
import { WORLD } from './index';

const params = () => ({ site: 'athens', day: 172 }) as SolarParams;
const worlds = {
  house: createHouseScene(params),
  rig: createRigScene(params),
  collector: createCollectorScene(),
  'tank-and-tap': createTankScene(),
};

describe('the lab’s parts', () => {
  it('reach the standard’s bar: 36 parts or more across the lab', () => {
    const ids = Object.values(worlds).flatMap((w) => w.registry.ids());
    expect(ids.length).toBeGreaterThanOrEqual(36);
    expect(ids.length).toBe(51);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('are the research’s ids, each in its world, none other', () => {
    for (const p of PART_NAMES) expect(worlds[p.world].registry.get(p.id), p.id).toBeDefined();
    expect(() => partName('no-such-part')).toThrow();
  });
  it('are kebab-case', () => {
    for (const p of PART_NAMES) expect(p.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
  it('each has meshes to show and to click', () => {
    for (const w of Object.values(worlds))
      for (const id of w.registry.ids()) expect(w.registry.get(id)!.meshes.length, id).toBeGreaterThan(0);
  });
});

describe('each world', () => {
  it('has a home, limits, labels with `declutter`', () => {
    for (const [id, w] of Object.entries(worlds)) {
      expect(w.id).toBe(id);
      expect(w.declutter, id).toBe(true);
      expect(w.minDistance).toBeLessThan(w.maxDistance);
      expect(w.near, id).toBeGreaterThan(0);
      expect(w.far!, id).toBeGreaterThan(w.maxDistance);
      expect(w.hotspots.length, id).toBeGreaterThan(3);
    }
  });
  it('has its fields for `src/lab.ts`', () => {
    for (const id of Object.keys(worlds)) expect(WORLD[id as keyof typeof WORLD]).toBeDefined();
    expect(WORLD.house.explode).toBe(false);
  });
  it('runs through a day and a night on the model’s state with nothing that is not a number, flows on, cut on', () => {
    for (const hour of [3, 7.2, 12, 17, 21]) {
      const s = stateWith({ hour }, 0.1);
      for (const w of Object.values(worlds)) {
        w.update(s, 1 / 60, view({ schematic: true }));
        expect(finiteTree(w.scene), `${w.id} at ${hour}`).toBe(true);
        w.update(s, 1 / 60, view({ schematic: true, cutaway: true }));
        expect(finiteTree(w.scene), `${w.id} cut at ${hour}`).toBe(true);
      }
    }
  });
  it('takes the slider to its ends in the rig, and a direct circuit, with no NaN', () => {
    for (const p of [{ tankHeight: -1.22 }, { tankHeight: 1.83 }, { circuit: 'direct' as const }]) {
      const s = stateWith(p, 0.1);
      worlds.rig.update(s, 1 / 60, view({ schematic: true }));
      expect(finiteTree(worlds.rig.scene)).toBe(true);
    }
  });
});
