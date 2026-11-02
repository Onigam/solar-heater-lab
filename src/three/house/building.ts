import * as THREE from 'three';
import { group } from '@onigam/lab-kit/three';
import { COS, HOUSE, HOUSE_HALF_DEPTH, HOUSE_X, ROOFING, ROOM_BACK_X, SPINE, tilePlaneY } from '../dims';
import { box, mergeAll } from '../machine/shapes';
import { limewash, rubbleStone, woodGrain } from './materials';

// The house: a stone village house, two floors, sliced to the west beside the machine, so that the roof's rafters and the way down to the bathroom show. Walls with real openings and reveals, shutters, a door.
// Scenery but for the spine wall, which is a part. Everything in metres; UVs in metres on each face, so a stone is the size of a stone.

export interface HouseLook {
  stone: THREE.MeshStandardMaterial;
  stoneCut: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  plasterWarm: THREE.MeshStandardMaterial;
  floorTerra: THREE.MeshStandardMaterial;
  floorTile: THREE.MeshStandardMaterial;
  wallTile: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
  shutter: THREE.MeshStandardMaterial;
  windowGlass: THREE.MeshStandardMaterial;
  frame: THREE.MeshStandardMaterial;
  sill: THREE.MeshStandardMaterial;
}

function squareTile(c: [number, number, number], joint: [number, number, number], N = 64): THREE.DataTexture {
  const d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++)
    for (let i = 0; i < N; i++) {
      const e = i < 2 || j < 2;
      const k = (j * N + i) * 4;
      const v = e ? joint : c;
      d[k] = v[0];
      d[k + 1] = v[1];
      d[k + 2] = v[2];
      d[k + 3] = 255;
    }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export function houseLook(): HouseLook {
  const rub = rubbleStone(11);
  const own = (m: THREE.MeshStandardMaterial) => {
    m.userData.noShare = true;
    return m;
  };
  return {
    stone: own(
      new THREE.MeshStandardMaterial({
        map: rub.map,
        bumpMap: rub.bump,
        bumpScale: 0.4,
        roughness: 0.94,
        name: 'stone',
      }),
    ),
    stoneCut: own(new THREE.MeshStandardMaterial({ color: 0xb6ab97, roughness: 0.95, name: 'stone-cut' })),
    plaster: own(
      new THREE.MeshStandardMaterial({ map: limewash(31, [240, 232, 214]), roughness: 0.93, name: 'plaster' }),
    ),
    plasterWarm: own(
      new THREE.MeshStandardMaterial({ map: limewash(33, [232, 216, 186]), roughness: 0.93, name: 'plaster-warm' }),
    ),
    floorTerra: own(
      new THREE.MeshStandardMaterial({
        map: squareTile([172, 110, 76], [110, 84, 64]),
        roughness: 0.75,
        name: 'floor-terra',
      }),
    ),
    floorTile: own(
      new THREE.MeshStandardMaterial({
        map: squareTile([158, 170, 172], [96, 104, 106]),
        roughness: 0.5,
        name: 'floor-tile',
      }),
    ),
    wallTile: own(
      new THREE.MeshStandardMaterial({
        map: squareTile([226, 232, 228], [150, 156, 152]),
        roughness: 0.3,
        name: 'wall-tile',
      }),
    ),
    timber: own(
      new THREE.MeshStandardMaterial({ map: woodGrain(41, [138, 106, 74]), roughness: 0.88, name: 'timber' }),
    ),
    shutter: new THREE.MeshStandardMaterial({ color: 0x4d6a5e, roughness: 0.72, name: 'shutter' }),
    windowGlass: own(
      new THREE.MeshStandardMaterial({
        color: 0x1b2a33,
        roughness: 0.18,
        metalness: 0.1,
        emissive: 0xffb870,
        emissiveIntensity: 0,
        name: 'window',
      }),
    ),
    frame: new THREE.MeshStandardMaterial({ color: 0xd9d3c4, roughness: 0.65, name: 'window-frame' }),
    sill: new THREE.MeshStandardMaterial({ color: 0xcabda2, roughness: 0.9, name: 'sill' }),
  };
}

/** A box whose UVs are in metres on each face, `tile` metres to a repeat. */
export function bx(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  tile = 1,
): THREE.BufferGeometry {
  const g = box(x0, x1, y0, y1, z0, z1);
  const pos = g.attributes.position;
  const nor = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const u = nx > 0.5 ? pos.getZ(i) : pos.getX(i);
    const v = ny > 0.5 ? pos.getZ(i) : pos.getY(i);
    uv.setXY(i, u / tile, v / tile);
  }
  return g;
}

export interface Hole {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** A wall along X with rectangular holes: boxes around them, the reveals are real. */
export function wallAlongX(
  x0: number,
  x1: number,
  y0: number,
  y1: number,
  z0: number,
  z1: number,
  holes: Hole[],
  tile: number,
): THREE.BufferGeometry {
  const xs = [...new Set([x0, x1, ...holes.flatMap((h) => [h.x0, h.x1])])].sort((a, b) => a - b);
  const list: THREE.BufferGeometry[] = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    const here = holes.filter((h) => h.x0 <= a && h.x1 >= b).sort((p, q) => p.y0 - q.y0);
    let y = y0;
    for (const h of here) {
      if (h.y0 > y) list.push(bx(a, b, y, h.y0, z0, z1, tile));
      y = h.y1;
    }
    if (y < y1) list.push(bx(a, b, y, y1, z0, z1, tile));
  }
  return mergeAll(list);
}

/** A triangular gable above a wall, from one eave line to the other: extruded along X. */
function gable(x0: number, x1: number, tile: number): THREE.BufferGeometry {
  const H = HOUSE_HALF_DEPTH;
  const yE = HOUSE.eaves;
  const peak = tilePlaneY(0) + ROOFING.battenBottom / COS;
  const shape = new THREE.Shape([new THREE.Vector2(-H, yE), new THREE.Vector2(H, yE), new THREE.Vector2(0, peak)]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.abs(x1 - x0), bevelEnabled: false });
  // (u, v, w) -> (x0 + w, v, -u)
  g.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, x0, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1));
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getZ(i) / tile, pos.getY(i) / tile);
  return g;
}

export interface Building {
  shell: THREE.Group;
  /** A window's glass, lit at night. */
  glass: THREE.MeshStandardMaterial;
  /** The spine wall, the part `load-bearing-wall`. */
  spine: THREE.Group;
}

export function buildBuilding(look: HouseLook): Building {
  const shell = group('house-shell');
  const tile = 3.2;
  const X0 = HOUSE_X.slice;
  const X1 = HOUSE_X.east;
  const H = HOUSE_HALF_DEPTH;
  const T = HOUSE.wall;
  const yE = HOUSE.eaves;
  const F1 = HOUSE.floor1;
  const put = (g: THREE.BufferGeometry, m: THREE.Material) => {
    const o = new THREE.Mesh(g, m);
    o.castShadow = true;
    o.receiveShadow = true;
    shell.add(o);
    return o;
  };

  // ---- openings of the south front. The west end of the house is the slice: no opening within a metre of it
  const south: Hole[] = [
    { x0: 0.5, x1: 1.5, y0: 3.15, y1: 4.5 },
    { x0: 3.3, x1: 4.3, y0: 3.15, y1: 4.5 },
    { x0: 6.1, x1: 7.1, y0: 3.15, y1: 4.5 },
    { x0: 0.5, x1: 1.5, y0: 0.85, y1: 2.15 },
    { x0: 3.2, x1: 4.4, y0: 0.04, y1: 2.25 },
    { x0: 6.1, x1: 7.1, y0: 0.85, y1: 2.15 },
  ];
  const north: Hole[] = [
    { x0: 2.0, x1: 2.9, y0: 3.3, y1: 4.5 },
    { x0: 5.8, x1: 6.7, y0: 3.3, y1: 4.5 },
    { x0: 4.0, x1: 4.9, y0: 0.9, y1: 2.1 },
  ];
  const east: Hole[] = [{ x0: -0.5, x1: 0.5, y0: 3.3, y1: 4.5 }];
  put(wallAlongX(X0, X1, 0, yE, H - T, H, south, tile), look.stone);
  put(wallAlongX(X0, X1, 0, yE, -H, -H + T, north, tile), look.stone);
  // the east wall, along Z: built in its own frame, turned; its gable above
  const eastWall = wallAlongX(-H, H, 0, yE, 0, T, east, tile);
  eastWall.applyMatrix4(new THREE.Matrix4().set(0, 0, 1, X1 - T, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1));
  put(eastWall, look.stone);
  put(gable(X1 - T, X1, tile), look.stone);

  // ---- window dressing: frames, panes, stone sills and lintels, shutters folded against the wall
  const glassList: THREE.BufferGeometry[] = [];
  const frameList: THREE.BufferGeometry[] = [];
  const sillList: THREE.BufferGeometry[] = [];
  const shutterList: THREE.BufferGeometry[] = [];
  const dress = (h: Hole, zOut: number, sign: number, door = false) => {
    const zf = zOut - sign * 0.22;
    const y0 = h.y0;
    const f = 0.05;
    glassList.push(box(h.x0, h.x1, y0, h.y1, zf - 0.006, zf + 0.006));
    frameList.push(box(h.x0, h.x1, y0, y0 + f, zf - 0.03, zf + 0.03));
    frameList.push(box(h.x0, h.x1, h.y1 - f, h.y1, zf - 0.03, zf + 0.03));
    frameList.push(box(h.x0, h.x0 + f, y0, h.y1, zf - 0.03, zf + 0.03));
    frameList.push(box(h.x1 - f, h.x1, y0, h.y1, zf - 0.03, zf + 0.03));
    frameList.push(box((h.x0 + h.x1) / 2 - 0.018, (h.x0 + h.x1) / 2 + 0.018, y0, h.y1, zf - 0.02, zf + 0.02));
    frameList.push(box(h.x0, h.x1, (y0 + h.y1) / 2 - 0.015, (y0 + h.y1) / 2 + 0.015, zf - 0.02, zf + 0.02));
    // lintel over, sill under, a stone proud of the wall
    const zp = zOut + sign * 0.035;
    sillList.push(box(h.x0 - 0.12, h.x1 + 0.12, h.y1, h.y1 + 0.2, Math.min(zOut, zp), Math.max(zOut, zp)));
    if (!door)
      sillList.push(
        box(
          h.x0 - 0.07,
          h.x1 + 0.07,
          y0 - 0.08,
          y0,
          Math.min(zOut, zp + sign * 0.03),
          Math.max(zOut, zp + sign * 0.03),
        ),
      );
    // shutters: two leaves, open, flat against the wall, each with its boards
    const w = (h.x1 - h.x0) / 2;
    for (const side of [-1, 1]) {
      const a = side < 0 ? h.x0 - w - 0.01 : h.x1 + 0.01;
      const b = a + w;
      const zs = zOut + sign * 0.02;
      if (door) continue;
      for (let i = 0; i < 5; i++) {
        const x0 = a + (i * w) / 5;
        shutterList.push(
          box(
            x0 + 0.003,
            x0 + w / 5 - 0.003,
            y0,
            h.y1,
            Math.min(zs, zs + sign * 0.022),
            Math.max(zs, zs + sign * 0.022),
          ),
        );
      }
      shutterList.push(
        box(
          a,
          b,
          y0 + 0.1,
          y0 + 0.16,
          Math.min(zs + sign * 0.022, zs + sign * 0.03),
          Math.max(zs + sign * 0.022, zs + sign * 0.03),
        ),
      );
      shutterList.push(
        box(
          a,
          b,
          h.y1 - 0.16,
          h.y1 - 0.1,
          Math.min(zs + sign * 0.022, zs + sign * 0.03),
          Math.max(zs + sign * 0.022, zs + sign * 0.03),
        ),
      );
    }
  };
  south.forEach((h, i) => dress(h, H, 1, i === 4));
  north.forEach((h) => dress(h, -H, -1));
  // the east window: its dressing in the wall's own frame
  const xE = X1 - 0.22;
  glassList.push(box(xE - 0.006, xE + 0.006, 3.3, 4.5, -0.5, 0.5));
  frameList.push(box(xE - 0.03, xE + 0.03, 3.3, 3.35, -0.5, 0.5), box(xE - 0.03, xE + 0.03, 4.45, 4.5, -0.5, 0.5));
  frameList.push(box(xE - 0.02, xE + 0.02, 3.3, 4.5, -0.018, 0.018));
  sillList.push(box(X1, X1 + 0.05, 3.22, 3.3, -0.58, 0.58), box(X1, X1 + 0.035, 4.5, 4.68, -0.62, 0.62));
  const glassMesh = put(mergeAll(glassList), look.windowGlass);
  glassMesh.castShadow = false;
  put(mergeAll(frameList), look.frame);
  put(mergeAll(sillList), look.sill);
  put(mergeAll(shutterList), look.shutter);
  // the door: boards over the door's hole, darker wood, set back
  const door = south[4];
  const doorZ = H - 0.16;
  put(bx(door.x0 + 0.04, door.x1 - 0.04, door.y0, door.y1 - 0.04, doorZ - 0.03, doorZ + 0.03, 0.8), look.timber);
  const step = new THREE.Mesh(box(door.x0 - 0.2, door.x1 + 0.2, 0, 0.1, H, H + 0.42), look.sill);
  step.castShadow = step.receiveShadow = true;
  shell.add(step);

  // ---- the rooms the slice opens, floors, ceilings, a partition
  const pl = 0.012;
  const zS = H - T;
  const zN = -H + T;
  const roomX1 = ROOM_BACK_X;
  // ground
  put(bx(X0, X1 - T, -0.04, 0.03, zN, zS, 0.3), look.floorTerra);
  // first floor, its timber thickness shows in the slice
  put(bx(X0, roomX1 + 0.1, F1 - 0.2, F1 - 0.03, zN, zS, 0.8), look.timber);
  put(bx(X0, roomX1 + 0.1, F1 - 0.03, F1, SPINE.z1, zS, 0.3), look.floorTile);
  put(bx(X0, roomX1 + 0.1, F1 - 0.03, F1, zN, SPINE.z0, 0.3), look.floorTerra);
  // the attic floor: boards on joists
  put(bx(X0, roomX1 + 0.1, yE - 0.14, yE - 0.03, zN, zS, 0.8), look.timber);
  put(bx(X0, roomX1 + 0.1, yE - 0.03, yE, zN, zS, 0.6), look.timber);
  // the partition behind the rooms
  put(bx(roomX1, roomX1 + 0.1, 0, yE, zN, zS, 2), look.plaster);
  // linings
  const lining = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, m: THREE.Material) => {
    const o = new THREE.Mesh(bx(x0, x1, y0, y1, z0, z1, m === look.wallTile ? 0.15 : 2), m);
    o.receiveShadow = true;
    shell.add(o);
  };
  // the south rooms
  lining(X0, roomX1, 0.03, F1 - 0.2, zS - pl, zS, look.plaster);
  lining(X0, roomX1, 0.03, F1 - 0.2, SPINE.z1, SPINE.z1 + pl, look.plaster);
  lining(X0, roomX1, F1, yE - 0.14, zS - pl, zS, look.plaster);
  lining(X0, roomX1, F1, yE - 0.14, SPINE.z1, SPINE.z1 + pl, look.plaster);
  lining(X0, roomX1, F1, F1 + 2.0, zS - pl * 2, zS - pl, look.wallTile);
  lining(X0, roomX1, F1, F1 + 2.0, SPINE.z1 + pl, SPINE.z1 + pl * 2, look.wallTile);
  lining(roomX1 - pl * 2, roomX1, F1, F1 + 2.0, SPINE.z1, zS, look.wallTile);
  // the north rooms
  lining(X0, roomX1, 0.03, F1 - 0.2, zN, zN + pl, look.plasterWarm);
  lining(X0, roomX1, 0.03, F1 - 0.2, SPINE.z0 - pl, SPINE.z0, look.plasterWarm);
  lining(X0, roomX1, F1, yE - 0.14, zN, zN + pl, look.plasterWarm);
  lining(X0, roomX1, F1, yE - 0.14, SPINE.z0 - pl, SPINE.z0, look.plasterWarm);

  // ---- what the slice cuts: a pale face on the walls' ends, so that a section reads as one
  const cut: THREE.BufferGeometry[] = [];
  const cutT = 0.004;
  cut.push(box(X0 - cutT, X0, 0, yE, H - T, H));
  cut.push(box(X0 - cutT, X0, 0, yE, -H, -H + T));
  put(mergeAll(cut), look.stoneCut);

  // ---- the spine wall, the one that takes the tank: under the tank's line, up to the rafters. Its own part
  const spine = group('load-bearing-wall');
  const topZ = (SPINE.z0 + SPINE.z1) / 2;
  const top = tilePlaneY(topZ) + ROOFING.rafterBottom / COS;
  const sp = new THREE.Mesh(bx(X0, roomX1 + 0.1, 0, top, SPINE.z0, SPINE.z1, tile), look.stone);
  sp.castShadow = sp.receiveShadow = true;
  spine.add(sp);
  const spCut = new THREE.Mesh(box(X0 - cutT, X0, 0, top, SPINE.z0, SPINE.z1), look.stoneCut);
  spine.add(spCut);
  return { shell, glass: look.windowGlass, spine };
}
