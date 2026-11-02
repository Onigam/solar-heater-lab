import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import { PAPER_STUDIO, patchMaterial, type Hotspot, type PartRegistry } from '@onigam/lab-kit/three';

// What the three workshop worlds share: the paper, its light, the hotspots' declarations. No fog: the paper floor fades by itself, so nothing can eat the machine, wherever the camera stands.

export const PAPER = 0xefe6d3;

export interface WorkshopOptions {
  name: string;
  key: [number, number, number];
  target: [number, number, number];
  shadowHalf: number;
  shadowFar: number;
}

export function workshopScene(o: WorkshopOptions): THREE.Scene {
  const scene = new THREE.Scene();
  scene.name = o.name;
  scene.background = new THREE.Color(PAPER);
  scene.userData.wantsEnv = true;
  scene.userData.look = { ...PAPER_STUDIO, exposure: 0.98 };
  scene.environmentIntensity = 0.5;
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0xb6a68c, 0.3));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.1);
  key.position.set(...o.key);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  const sc = key.shadow.camera;
  sc.left = -o.shadowHalf;
  sc.right = o.shadowHalf;
  sc.top = o.shadowHalf;
  sc.bottom = -o.shadowHalf;
  sc.near = 0.1;
  sc.far = o.shadowFar;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = o.shadowHalf * 0.003;
  key.target.position.set(...o.target);
  scene.add(key, key.target);
  const fill = new THREE.DirectionalLight(0xdfe9ff, 0.28);
  fill.position.set(-o.key[0], o.key[1] * 0.6, o.key[2] * 0.4);
  scene.add(fill);
  return scene;
}

/** Drafting-table floor: a disc of paper with its grid, fading into the background by its own radius. A DataTexture, so it also builds in Node. */
export function paperFloor(radius = 16, tile = 8, y = 0): THREE.Mesh {
  const N = 512;
  const data = new Uint8Array(N * N * 4);
  const cell = N / 8;
  for (let py = 0; py < N; py++) {
    for (let px = 0; px < N; px++) {
      const k = (py * N + px) * 4;
      let a = 0;
      const mx = px % cell;
      const my = py % cell;
      if (mx < 2 || my < 2) a = 0.16;
      else if (mx % (cell / 5) < 1 || my % (cell / 5) < 1) a = 0.06;
      data[k] = Math.round(239 * (1 - a) + 40 * a);
      data[k + 1] = Math.round(230 * (1 - a) + 60 * a);
      data[k + 2] = Math.round(211 * (1 - a) + 90 * a);
      data[k + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set((2 * radius) / tile, (2 * radius) / tile);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = 8;
  tex.needsUpdate = true;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
  const from = radius * 0.45;
  const to = radius * 0.98;
  const uPaper = { value: new THREE.Color(PAPER) };
  mat.userData.uPaper = uPaper;
  patchMaterial(mat, `floor-fade:${from}:${to}`, (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvFloorP = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vFloorP;\nuniform vec3 uPaper;')
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        gl_FragColor.rgb = mix( gl_FragColor.rgb, uPaper, smoothstep( ${from.toFixed(2)}, ${to.toFixed(2)}, length( vFloorP ) ) );`,
      );
    shader.uniforms.uPaper = uPaper;
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), mat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.receiveShadow = true;
  floor.name = 'floor';
  return floor;
}

/** A direction to look at a part from, as the camera sees it: its elevation over the horizon and its bearing from +Z towards +X, in degrees. */
export function viewFrom(elevation: number, bearing: number): THREE.Vector3 {
  const e = (elevation * Math.PI) / 180;
  const b = (bearing * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e));
}

export interface HotspotDef {
  id: string;
  fr: string;
  en: string;
  minor?: boolean;
  goto?: string;
}

/** An empty marker at a position of `parent`: the label follows it, also during the explode. */
export function anchor(parent: THREE.Object3D, x: number, y: number, z: number, name = 'anchor'): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  o.userData.keep = true;
  parent.add(o);
  return o;
}

export function hotspots(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): Hotspot[] {
  return defs.map((d) => ({
    partId: d.id.replace(/#.*$/, ''),
    anchor: anchors[d.id],
    label: l(d.fr, d.en),
    minor: d.minor,
    goto: d.goto,
  }));
}

/**
 * What the registry says of a world's parts this frame. `isolated`: one part alone is left, the others hidden: what holds the machine goes too, or posts would stand holding nothing. A guide's step also hides parts, and there
 * the bench and the wall stay, as long as more than one part shows. `exploded`: one has left its place.
 */
export function partsNow(reg: PartRegistry): { hidden: boolean; isolated: boolean; exploded: boolean } {
  let hidden = 0;
  let solid = 0;
  let exploded = false;
  const ids = reg.ids();
  for (const id of ids) {
    const p = reg.get(id)!;
    if (p.display === 'hidden') hidden++;
    if (p.display === 'solid') solid++;
    if (p.factor > 0.001) exploded = true;
  }
  return { hidden: hidden > 0, isolated: solid === 1 && hidden === ids.length - 1, exploded };
}
