import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { heatColor, HeatStrip, HEAT_STOPS } from './heat';

describe('the false colour', () => {
  it('holds its stops', () => {
    for (const [T, hex] of HEAT_STOPS) expect(heatColor(T).getHex()).toBe(new THREE.Color(hex).getHex());
  });
  it('keeps its neighbours apart at the temperatures the lab shows', () => {
    const a = new THREE.Color();
    const b = new THREE.Color();
    for (let T = 0; T < 110; T += 10) {
      heatColor(T, a);
      heatColor(T + 10, b);
      const d = Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
      expect(d, `${T} °C`).toBeGreaterThan(0.03);
    }
  });
  it('is safe on what is not a number', () => {
    expect(Number.isFinite(heatColor(NaN).r)).toBe(true);
    expect(Number.isFinite(heatColor(1e6).r)).toBe(true);
  });
  it('a strip rewrites its texture only when a value has moved', () => {
    const s = new HeatStrip(4);
    const v0 = s.texture.version;
    s.update([20, 20, 20, 20]);
    const v1 = s.texture.version;
    s.update([20, 20, 20, 20]);
    expect(s.texture.version).toBe(v1);
    s.update([20, 20, 30, 20]);
    expect(s.texture.version).toBeGreaterThan(v1);
    expect(v1).toBeGreaterThanOrEqual(v0);
  });
});
