import * as THREE from 'three';
import { canvasTexture, group } from '@onigam/lab-kit/three';
import { heatColor, HEAT_MAX, HEAT_MIN } from './heat';

// The false colour's scale, in °C, standing on the paper as a drawing's scale bar does: a colour means the same in every world. Language free. Two marks ride on it: the air and what is being looked
// at. The numbers are drawn on a canvas in the browser; in Node (the tests) the bar stays bare. (Kit request 6: a `heatLegend` of the kit would replace this.)

const STEPS = [0, 20, 40, 60, 80, 100];

export interface HeatLegend {
  root: THREE.Group;
  /** The two marks, °C. */
  setMarks(air: number, subject: number): void;
  marks: { air: THREE.Mesh; subject: THREE.Mesh };
}

const H = 0.86;
const Y0 = 0.1;
const yOf = (T: number) => Y0 + (H * (Math.min(HEAT_MAX, Math.max(HEAT_MIN, T)) - HEAT_MIN)) / (HEAT_MAX - HEAT_MIN);

export function heatLegend(): HeatLegend {
  const root = group('heat-legend');
  const steel = new THREE.MeshStandardMaterial({ color: 0x5a5e62, roughness: 0.5, metalness: 0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.014, 0.12), steel);
  base.position.y = 0.007;
  base.castShadow = true;
  root.add(base);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.012, Y0 + H + 0.04, 0.012), steel);
  post.position.set(-0.03, (Y0 + H + 0.04) / 2, -0.014);
  post.castShadow = true;
  root.add(post);

  // the bar: a strip of colours in linear steps
  const N = 96;
  const data = new Uint8Array(N * 4);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) {
    heatColor(HEAT_MIN + ((HEAT_MAX - HEAT_MIN) * i) / (N - 1), c).convertLinearToSRGB();
    data[i * 4] = Math.round(c.r * 255);
    data[i * 4 + 1] = Math.round(c.g * 255);
    data[i * 4 + 2] = Math.round(c.b * 255);
    data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, 1, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.045, H, 0.006), [
    steel,
    steel,
    steel,
    steel,
    new THREE.MeshBasicMaterial({ map: tex }),
    steel,
  ]);
  bar.position.set(-0.03, Y0 + H / 2, -0.004);
  root.add(bar);

  // the numbers
  if (typeof document !== 'undefined') {
    const { texture } = canvasTexture(128, 680, (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(31, 41, 51, 0.92)';
      ctx.font = '600 30px "JetBrains Mono", monospace';
      ctx.textBaseline = 'middle';
      for (const T of STEPS) {
        const y = h - ((T - HEAT_MIN) / (HEAT_MAX - HEAT_MIN)) * h;
        ctx.fillRect(0, y - 1.5, 14, 3);
        ctx.fillText(`${T}`, 20, y);
      }
      ctx.fillText('°C', 66, h - ((100 - HEAT_MIN) / (HEAT_MAX - HEAT_MIN)) * h);
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(0.17, H),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }),
    );
    label.position.set(0.078, Y0 + H / 2, -0.001);
    root.add(label);
  }

  // the two marks: a pale triangle for the air, a copper one for the subject, on the bar's left
  const tri = () => {
    const s = new THREE.Shape([
      new THREE.Vector2(0, 0),
      new THREE.Vector2(-0.04, 0.016),
      new THREE.Vector2(-0.04, -0.016),
    ]);
    return new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: false });
  };
  const air = new THREE.Mesh(tri(), new THREE.MeshStandardMaterial({ color: 0xe9eef2, roughness: 0.6 }));
  const subject = new THREE.Mesh(tri(), new THREE.MeshStandardMaterial({ color: 0x1a1c1e, roughness: 0.6 }));
  air.position.set(-0.054, yOf(20), -0.004);
  subject.position.set(-0.054, yOf(20), -0.004);
  root.add(air, subject);

  return {
    root,
    marks: { air, subject },
    setMarks(a, s) {
      air.position.y = yOf(a);
      subject.position.y = yOf(s);
    },
  };
}
