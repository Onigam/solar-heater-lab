import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { COLLECTOR, HEADER_R, RISER_R } from '../dims';
import { buildCollector, COLLECTOR_LAYERS, SECTION_S, STAIR } from '../machine/collector';
import { machineLook } from '../machine/look';
import { boxOf, drawStats, finiteTree, stateWith, view } from '../test-utils';
import { createCollectorScene, EXPLODE } from './scene';

const mod = createCollectorScene();
const st = stateWith({ hour: 12 }, 0.2);

describe('the collector world', () => {
  it('registers the nine layers of research §4.3', () => {
    expect(mod.registry.ids().sort()).toEqual([...COLLECTOR_LAYERS].sort());
  });
  it('has every label on a part of this world', () => {
    for (const h of mod.hotspots) {
      expect(mod.registry.get(h.partId), h.partId).toBeDefined();
      expect(h.anchor.parent, h.partId).toBeTruthy();
    }
  });
  it('its easel reaches the floor and carries the tray: the tray’s back lies on the bearers', () => {
    const e = boxOf(mod.easel);
    expect(e.min.y).toBeCloseTo(0, 2);
    const t = boxOf(mod.collector.layers['collector-tray']);
    expect(t.min.y).toBeGreaterThan(e.min.y);
    // the foot of the tray stands against the stop
    expect(e.max.z).toBeGreaterThan(t.max.z - 0.02);
  });
  it('stands open on its stair: each layer stops short of the one under it, the headers and the tray whole', () => {
    mod.update(st, 1 / 60, view());
    const [gx] = STAIR.glass;
    const [px] = STAIR.plate;
    const [bx] = STAIR.blanket;
    expect(gx).toBeGreaterThan(px);
    expect(px).toBeGreaterThan(bx);
    const pos = (id: (typeof COLLECTOR_LAYERS)[number]) => {
      const m = mod.collector.layers[id].children.find((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh;
      return m.geometry.attributes.position as THREE.BufferAttribute;
    };
    // no glass in the corner; no plate in the corner; some blanket gone there too
    const inCorner = (a: THREE.BufferAttribute, dx: number, dz: number) => {
      for (let i = 0; i < a.count; i++)
        if (a.getX(i) < -COLLECTOR.width / 2 + dx - 1e-4 && a.getZ(i) < -COLLECTOR.length + dz - 1e-4) return true;
      return false;
    };
    expect(inCorner(pos('glass-cover'), gx * 0.99, STAIR.glass[1] * 0.99)).toBe(false);
    expect(inCorner(pos('absorber-plate'), px * 0.99, STAIR.plate[1] * 0.99)).toBe(false);
    expect(inCorner(pos('back-insulation'), bx * 0.99, STAIR.blanket[1] * 0.99)).toBe(false);
  });
  it('the section is a true cut across the risers: nothing left below it but what the world keeps', () => {
    mod.update(st, 1 / 60, view({ cutaway: true }));
    const b = boxOf(mod.collector.layers['glass-cover']);
    mod.collector.root.updateMatrixWorld(true);
    const local = mod.collector.root.worldToLocal(b.getCenter(new THREE.Vector3()));
    expect(-local.z).toBeGreaterThan(SECTION_S);
    mod.update(st, 1 / 60, view());
  });
  it('the exploded view leaves straight out of the tray, in the order the layers went on, the tray staying', () => {
    expect(EXPLODE['collector-tray']).toEqual([0, 0, 0]);
    const order = ['back-insulation', 'riser-tube', 'absorber-plate', 'air-gap', 'glass-seal', 'glass-cover'] as const;
    for (let i = 1; i < order.length; i++) expect(EXPLODE[order[i]][1]).toBeGreaterThan(EXPLODE[order[i - 1]][1]);
  });
  it('isolate takes the easel and the scale away', () => {
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, id === 'riser-tube' ? 'solid' : 'hidden');
    mod.update(st, 1 / 60, view());
    expect(mod.easel.visible).toBe(false);
    expect(mod.legend.root.visible).toBe(false);
    for (const id of mod.registry.ids()) mod.registry.setDisplay(id, 'solid');
    mod.update(st, 1 / 60, view());
    expect(mod.easel.visible).toBe(true);
  });
  it('the risers end in the headers, and read the model', () => {
    const y = COLLECTOR.waterwayY;
    expect(y + RISER_R).toBeLessThan(y + HEADER_R);
    const before = mod.collector.risers.texture.version;
    const later = stateWith({ hour: 13 }, 0.4);
    mod.update(later, 1 / 60, view());
    expect(mod.collector.risers.texture.version).toBeGreaterThanOrEqual(before);
    expect(finiteTree(mod.scene)).toBe(true);
  });
  it('at night its paper goes blue, and comes back', () => {
    const night = stateWith({ hour: 2 }, 0.1);
    for (let i = 0; i < 120; i++) mod.update(night, 1 / 30, view());
    const bgNight = (mod.scene.background as THREE.Color).getHex();
    const noon = stateWith({ hour: 13 }, 0.1);
    for (let i = 0; i < 120; i++) mod.update(noon, 1 / 30, view());
    expect((mod.scene.background as THREE.Color).getHex()).not.toBe(bgNight);
  });
  it('holds its budget', () => {
    const s = drawStats(mod.scene);
    expect(s.calls).toBeLessThan(40);
    expect(s.triangles).toBeLessThan(60000);
  });
});

describe('it is the bank’s collector', () => {
  it('the same function gives the same box in every view but the cut ones', () => {
    const a = buildCollector(machineLook());
    const b = buildCollector(machineLook(), { views: true });
    b.setView('full');
    for (const id of COLLECTOR_LAYERS) {
      const A = boxOf(a.layers[id]);
      const B = boxOf(b.layers[id]);
      expect(A.min.distanceTo(B.min), id).toBeLessThan(0.003);
      expect(A.max.distanceTo(B.max), id).toBeLessThan(0.003);
    }
  });
});
