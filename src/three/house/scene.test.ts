import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { SITES } from '../../sim/climate';
import { sunAltitude, sunAzimuth, sunTerms } from '../../sim/thermal';
import type { SolarParams } from '../../sim/types';
import {
  COLLECTOR,
  COS,
  HOUSE,
  HOUSE_FOOT,
  HOUSE_HALF_DEPTH,
  RAFTER_XS,
  ROOFING,
  SIN,
  TILT,
  tilePlaneY,
} from '../dims';
import { machineLook } from '../machine/look';
import { buildRoofUnit } from '../machine/unit';
import { PART_NAMES } from '../part-ids';
import { boxOf, drawStats, finiteTree, stateWith, view } from '../test-utils';
import { rubbleStone, cobbles, leafCard } from './materials';
import { createHouseScene } from './scene';
import { sunDirection } from './sky';

const mod = createHouseScene(() => ({ site: 'athens', day: 172 }) as SolarParams);
const st = stateWith({ hour: 11 }, 0.1);
mod.update(st, 1 / 60, view());

/** The lowest point of a tree of meshes along the roof's normal, m, from the plane of the tile tops. */
function lowestN(o: THREE.Object3D): number {
  o.updateWorldMatrix(true, true);
  let low = Infinity;
  const v = new THREE.Vector3();
  const normal = new THREE.Vector3(0, COS, SIN);
  const foot = new THREE.Vector3(0, HOUSE_FOOT.y, HOUSE_FOOT.z);
  o.traverse((c) => {
    const m = c as THREE.Mesh;
    if (!m.isMesh) return;
    const pos = m.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld);
      low = Math.min(low, v.sub(foot).dot(normal));
    }
  });
  return low;
}

describe('the house world', () => {
  it('registers the ten parts of research §4.1', () => {
    const want = PART_NAMES.filter((p) => p.world === 'house')
      .map((p) => p.id)
      .sort();
    expect(mod.registry.ids().sort()).toEqual(want);
  });
  it('has every label on a part of this world', () => {
    for (const h of mod.hotspots) expect(mod.registry.get(h.partId), h.partId).toBeDefined();
  });
  it('joins its lines to the machine’s fittings, within 3 mm', () => {
    for (const j of mod.joints) expect(j.a.distanceTo(j.b), j.name).toBeLessThan(0.003);
  });
  it('builds finite', () => {
    expect(finiteTree(mod.scene)).toBe(true);
  });
});

describe('the machine on the roof', () => {
  it('stands on the plane of the tile tops: its lowest point within a few millimetres, none below', () => {
    const by: string[] = [];
    mod.unit.root.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh && lowestN(m) < -0.0025)
        by.push(`${m.name} ${(m.material as THREE.Material).name} ${lowestN(m).toFixed(4)}`);
    });
    expect(by).toEqual([]);
    const n = lowestN(mod.unit.root);
    expect(n).toBeGreaterThanOrEqual(-0.0025);
    expect(n).toBeLessThan(0.005);
  });
  it('the tile tops are that plane: a cap’s crown reaches it, a pan is under it, the rafters under the battens', () => {
    expect(tilePlaneY(HOUSE_FOOT.z)).toBeCloseTo(HOUSE_FOOT.y, 6);
    const tiles = mod.registry.get('roof-tiles')!.object;
    const insts = tiles.children.filter((c) => (c as THREE.InstancedMesh).isInstancedMesh) as THREE.InstancedMesh[];
    expect(insts.length).toBeGreaterThanOrEqual(2);
    const M = new THREE.Matrix4();
    insts[1].getMatrixAt(Math.floor(insts[1].count * 0.1), M);
    const p = new THREE.Vector3().setFromMatrixPosition(M);
    const expected = tilePlaneY(p.z);
    expect(Math.abs(p.y - expected)).toBeLessThan(0.02);
    expect(ROOFING.rafterBottom).toBeLessThan(ROOFING.battenBottom);
  });
  it('its straps land on the rafters: the same X, 600 mm apart', () => {
    for (let i = 1; i < RAFTER_XS.length; i++) expect(RAFTER_XS[i] - RAFTER_XS[i - 1]).toBeCloseTo(0.6, 6);
  });
  it('is the rig’s machine: the same triangles in its own frame, within 3 mm', () => {
    const fresh = buildRoofUnit(machineLook());
    fresh.root.updateMatrixWorld(true);
    const a = fresh.body;
    const ba = new THREE.Box3().setFromObject(a, true);
    const u = mod.unit;
    u.root.updateMatrixWorld(true);
    const inv = new THREE.Matrix4().copy(u.root.matrixWorld).invert();
    const bb = new THREE.Box3();
    const v = new THREE.Vector3();
    u.body.traverse((c) => {
      const m = c as THREE.Mesh;
      if (!m.isMesh) return;
      const pos = m.geometry.attributes.position;
      const rel = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
      const R = new THREE.Matrix4().makeRotationX(TILT);
      for (let i = 0; i < pos.count; i++)
        bb.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(rel).applyMatrix4(R));
    });
    expect(ba.min.distanceTo(bb.min)).toBeLessThan(0.003);
    expect(ba.max.distanceTo(bb.max)).toBeLessThan(0.003);
    const count = (o: THREE.Object3D) => {
      let n = 0;
      o.traverse((c) => {
        const m = c as THREE.Mesh;
        if (m.isMesh) n += m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count;
      });
      return n;
    };
    expect(count(u.body)).toBe(count(fresh.body));
  });
});

describe('the building is at its scale', () => {
  it('eaves at 5 m, ridge near 7.5 m (research §3, generic)', () => {
    expect(HOUSE.eaves).toBe(5);
    expect(tilePlaneY(0)).toBeGreaterThan(7.4);
    expect(tilePlaneY(0)).toBeLessThan(7.8);
  });
  it('its walls stand on the ground', () => {
    const b = boxOf(mod.building);
    expect(b.min.y).toBeLessThanOrEqual(0.001);
    expect(b.max.z).toBeGreaterThan(HOUSE_HALF_DEPTH);
  });
  it('the slice opens to the west, with the machine right beside it', () => {
    const b = boxOf(mod.unit.root);
    const wall = boxOf(mod.building);
    expect(b.min.x - wall.min.x).toBeGreaterThan(0);
    expect(b.min.x - wall.min.x).toBeLessThan(1);
  });
});

describe('the olive’s shadow misses the collectors all year', () => {
  it('in every site of the model, at every hour of the sun above 3°', () => {
    const c = boxOf(mod.tree.root);
    const corners = [
      new THREE.Vector3(-1.04, HOUSE_FOOT.y, HOUSE_FOOT.z),
      new THREE.Vector3(1.04, HOUSE_FOOT.y, HOUSE_FOOT.z),
      new THREE.Vector3(-1.04, HOUSE_FOOT.y + COLLECTOR.length * SIN, HOUSE_FOOT.z - COLLECTOR.length * COS),
      new THREE.Vector3(1.04, HOUSE_FOOT.y + COLLECTOR.length * SIN, HOUSE_FOOT.z - COLLECTOR.length * COS),
    ];
    const ray = new THREE.Ray();
    let checks = 0;
    for (const site of Object.values(SITES)) {
      for (let day = 1; day <= 365; day += 15) {
        const t = sunTerms(site.latitude, day, 30, 0);
        for (let h = 5; h <= 19; h += 0.5) {
          const alt = sunAltitude(t, h);
          if (alt < 3) continue;
          const dir = sunDirection(alt, sunAzimuth(t, h));
          for (const p of corners) {
            ray.set(p, dir);
            expect(ray.intersectsBox(c), `${site.latitude}°, day ${day}, ${h} h`).toBe(false);
            checks++;
          }
        }
      }
    }
    expect(checks).toBeGreaterThan(1000);
    expect(mod.tree.height).toBeLessThan(HOUSE_FOOT.y);
  });
  it('and it stands on the ground, its bole in it', () => {
    const b = boxOf(mod.tree.wood);
    expect(b.min.y).toBeLessThan(0);
    expect(b.min.y).toBeGreaterThan(-0.4);
  });
});

describe('the sun is the model’s', () => {
  it('its direction comes from the state: south at noon, west after it, up in June', () => {
    const d = sunDirection(70, 0);
    expect(d.z).toBeGreaterThan(0);
    expect(d.y).toBeGreaterThan(0.9);
    const w = sunDirection(40, 60);
    expect(w.x).toBeLessThan(0);
  });
  it('the world’s light follows the hour', () => {
    const noon = stateWith({ hour: 12.5 }, 0.05);
    mod.update(noon, 1 / 60, view());
    expect(mod.sky.night).toBeLessThan(0.2);
    expect(mod.sky.sun.position.y).toBeGreaterThan(mod.sky.sun.target.position.y);
    const midnight = stateWith({ hour: 0.5 }, 0.05);
    mod.update(midnight, 1 / 60, view());
    expect(mod.sky.night).toBeGreaterThan(0.8);
    mod.update(noon, 1 / 60, view());
  });
});

describe('isolate leaves nothing standing', () => {
  it('walls and bathroom go with the rest', () => {
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, id === 'hot-line' ? 'solid' : 'hidden');
    mod.update(st, 1 / 60, view());
    expect(mod.building.visible).toBe(false);
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, 'solid');
    mod.update(st, 1 / 60, view());
    expect(mod.building.visible).toBe(true);
  });
});

describe('textures read as what they are', () => {
  it('the stone is courses of near tones, not dots: the mortar a thin share', () => {
    const t = rubbleStone(11, 256);
    const d = t.map.image.data as Uint8Array;
    let mortar = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] === 138 && d[i + 1] === 126) mortar++;
    const share = mortar / (d.length / 4);
    expect(share).toBeLessThan(0.35);
    expect(share).toBeGreaterThan(0.01);
  });
  it('the cobbles are packed: dark joints a small share of the street', () => {
    const t = cobbles(21, 256);
    const d = t.map.image.data as Uint8Array;
    let joint = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 116) joint++;
    const share = joint / (d.length / 4);
    expect(share).toBeLessThan(0.25);
    expect(share).toBeGreaterThan(0.005);
  });
  it('a leaf card is leaves on nothing', () => {
    const d = leafCard(3, [150, 160, 120], [80, 100, 70], 80).image.data as Uint8Array;
    let on = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) on++;
    const share = on / (d.length / 4);
    expect(share).toBeGreaterThan(0.15);
    expect(share).toBeLessThan(0.85);
  });
});

describe('budgets', () => {
  it('stays within the world’s budget', () => {
    mod.update(st, 1 / 60, view());
    const s = drawStats(mod.scene);
    expect(s.calls).toBeLessThan(160);
    expect(s.triangles).toBeLessThan(450000);
  });
});
