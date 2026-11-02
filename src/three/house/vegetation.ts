import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { patchMaterial, rng } from '@onigam/lab-kit/three';
import { mergeAll, rounded, tubeThrough } from '../machine/shapes';
import { leafCard, woodGrain } from './materials';

// The setting's trees: an olive, a cypress, the far trees. An olive is a thick, short, twisted bole, a few limbs that fork and wander, and a crown of narrow silver-green leaves in loose clouds: sprays of
// leaf cards at the ends of the twigs, a dark mass within them so that the crown does not read as a veil. A cypress is a narrow dark flame. All of it seeded: the same tree at every load.

export interface TreeMeshes {
  root: THREE.Group;
  wood: THREE.Mesh;
  leaves: THREE.Mesh;
  mass: THREE.Mesh;
  /** Height of its top, m: the tests compare the tree's shadow with the collectors'. */
  height: number;
  /** Where the crown is, for the same test. */
  crown: THREE.Sphere;
}

/** A smooth irregular lump, no facets: what a tree's dark mass is, and a far tree. */
function lump(R: number, rough: number, r: () => number, detail = 1): THREE.BufferGeometry {
  const ico = new THREE.IcosahedronGeometry(R, detail);
  ico.deleteAttribute('uv');
  ico.deleteAttribute('normal');
  const g = mergeVertices(ico, 1e-4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const k = 1 - rough / 2 + r() * rough;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Cards crossing at a point, facing about `normal`, all sharing a lighting normal that points out of the crown. */
function sprayCards(
  points: { p: THREE.Vector3; size: number; out: THREE.Vector3 }[],
  r: () => number,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const tmp = new THREE.Vector3();
  for (const q of points) {
    for (let c = 0; c < 2; c++) {
      tmp.set(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      a.crossVectors(q.out, tmp).normalize();
      b.crossVectors(q.out, a).normalize();
      if (c === 1) b.lerp(q.out, 0.7).normalize();
      const first = pos.length / 3;
      const s = q.size;
      for (const [u, v] of [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
      ]) {
        const x = (u - 0.5) * s;
        const y = (v - 0.5) * s;
        pos.push(q.p.x + a.x * x + b.x * y, q.p.y + a.y * x + b.y * y, q.p.z + a.z * x + b.z * y);
        // the crown's own normal, softened: the sprays shade as a volume
        nor.push(q.out.x, q.out.y, q.out.z);
        uv.push(u, v);
      }
      idx.push(first, first + 1, first + 2, first, first + 2, first + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

/** Both sides of a card take the crown's normal: three would turn it round on the far side, and half of every card would go black. */
function keepNormal(m: THREE.MeshStandardMaterial): THREE.MeshStandardMaterial {
  patchMaterial(m, 'keep-normal', (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      '#include <normal_fragment_begin>\n  normal = normalize( vNormal );',
    );
  });
  return m;
}

function leafMaterial(map: THREE.Texture, name: string): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({
    map,
    alphaTest: 0.45,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    roughness: 0.82,
    metalness: 0,
    name,
  });
  m.userData.noShare = true;
  return keepNormal(m);
}

function barkMat(): THREE.MeshStandardMaterial {
  // an olive's bark: long fissures along the limb, grey over brown
  const map = woodGrain(47, [128, 116, 98]);
  map.repeat.set(3.5, 0.8);
  const m = new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 1.2, roughness: 0.97, name: 'bark' });
  m.userData.noShare = true;
  return m;
}

export function olive(seed = 7, H = 5.0): TreeMeshes {
  const r = rng(seed);
  const root = new THREE.Group();
  root.name = 'olive';
  const woods: THREE.BufferGeometry[] = [];
  const clouds: { c: THREE.Vector3; R: number }[] = [];

  const path = (
    from: THREE.Vector3,
    dir: THREE.Vector3,
    len: number,
    wander: number,
    steps: number,
  ): THREE.Vector3[] => {
    const pts = [from.clone()];
    const d = dir.clone().normalize();
    for (let i = 1; i <= steps; i++) {
      d.x += (r() - 0.5) * wander;
      d.y += (r() - 0.5) * wander * 0.5;
      d.z += (r() - 0.5) * wander;
      d.normalize();
      pts.push(pts[i - 1].clone().addScaledVector(d, len / steps));
    }
    return pts;
  };
  const taper = (pts: THREE.Vector3[], r0: number, r1: number, radial = 8) => {
    // one continuous tube, narrowing all the way: no ring where a stretch ends
    const smooth = rounded(pts, 0.25, 4);
    woods.push(tubeThrough(smooth, (t) => r0 + (r1 - r0) * t, radial));
  };

  // the bole: short, very thick, twisted, its foot flaring into the ground
  const boleTop = new THREE.Vector3(0.1, H * 0.3, -0.05);
  const bole = [
    new THREE.Vector3(0, -0.15, 0),
    new THREE.Vector3(0.02, 0.45, 0.06),
    new THREE.Vector3(-0.1, 0.95, 0.02),
    boleTop,
  ];
  taper(bole, 0.34, 0.2, 12);
  // the flare: three roots
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4;
    taper(
      [
        new THREE.Vector3(0, 0.34, 0),
        new THREE.Vector3(Math.cos(a) * 0.28, 0.08, Math.sin(a) * 0.28),
        new THREE.Vector3(Math.cos(a) * 0.62, -0.1, Math.sin(a) * 0.62),
      ],
      0.15,
      0.05,
      7,
    );
  }

  // the limbs, each forking twice, its end carrying a cloud of leaves
  const limbs = 5;
  for (let i = 0; i < limbs; i++) {
    const a = (i / limbs) * Math.PI * 2 + r();
    const out = new THREE.Vector3(Math.cos(a) * 0.72, 0.72 + r() * 0.34, Math.sin(a) * 0.72);
    const L1 = H * (0.26 + r() * 0.1);
    const p1 = path(boleTop, out, L1, 0.55, 4);
    taper(p1, 0.15, 0.085, 8);
    const end1 = p1[p1.length - 1];
    for (let j = 0; j < 3; j++) {
      const a2 = a + (j - 1) * (0.75 + r() * 0.35);
      const d2 = new THREE.Vector3(Math.cos(a2) * 0.78, 0.42 + r() * 0.42, Math.sin(a2) * 0.78);
      const L2 = H * (0.16 + r() * 0.1);
      const p2 = path(end1, d2, L2, 0.8, 3);
      taper(p2, 0.075, 0.035, 6);
      const end2 = p2[p2.length - 1];
      for (let k = 0; k < 3; k++) {
        const a3 = a2 + (k - 1) * (0.7 + r() * 0.5);
        const d3 = new THREE.Vector3(Math.cos(a3) * 0.75, 0.25 + r() * 0.5, Math.sin(a3) * 0.75);
        const p3 = path(end2, d3, H * (0.09 + r() * 0.07), 1.1, 2);
        taper(p3, 0.03, 0.012, 5);
        const end = p3[p3.length - 1];
        clouds.push({ c: end, R: H * (0.09 + r() * 0.05) });
      }
    }
  }
  const woodMat = barkMat();
  const wood = new THREE.Mesh(mergeAll(woods), woodMat);
  wood.castShadow = wood.receiveShadow = true;
  root.add(wood);

  // the crown: sprays spread in each cloud; a card is about a span across, the leaves on it finger length
  const sprays: { p: THREE.Vector3; size: number; out: THREE.Vector3 }[] = [];
  const centre = new THREE.Vector3();
  for (const c of clouds) centre.add(c.c);
  centre.divideScalar(clouds.length);
  for (const c of clouds) {
    const n = 64;
    for (let i = 0; i < n; i++) {
      const dir = new THREE.Vector3(r() - 0.5, (r() - 0.42) * 0.8, r() - 0.5).normalize();
      const rad = c.R * Math.cbrt(r());
      const p = c.c.clone().addScaledVector(dir, rad);
      const out = p.clone().sub(centre).normalize().lerp(dir, 0.4).normalize();
      sprays.push({ p, size: 0.2 + r() * 0.15, out });
    }
  }
  const leaves = new THREE.Mesh(
    sprayCards(sprays, r),
    leafMaterial(leafCard(seed + 1, [156, 170, 132], [74, 94, 66], 120, 128, 0.2), 'olive-leaf'),
  );
  leaves.castShadow = leaves.receiveShadow = true;
  leaves.frustumCulled = false;
  root.add(leaves);

  // the dark mass inside each cloud: seen only in the gaps between the sprays, it gives the crown its depth
  const blobs: THREE.BufferGeometry[] = [];
  for (const c of clouds) {
    const g = lump(c.R * 0.6, 0.3, r);
    g.scale(1, 0.84, 1);
    g.translate(c.c.x, c.c.y, c.c.z);
    blobs.push(g);
  }
  const massMat = new THREE.MeshStandardMaterial({ color: 0x38452f, roughness: 0.96, name: 'olive-mass' });
  const mass = new THREE.Mesh(mergeAll(blobs), massMat);
  mass.castShadow = true;
  root.add(mass);

  const box = new THREE.Box3().setFromObject(leaves, true);
  box.union(new THREE.Box3().setFromObject(wood, true));
  const crown = new THREE.Sphere();
  box.getBoundingSphere(crown);
  return { root, wood, leaves, mass, height: box.max.y, crown };
}

/** A cypress: a thin trunk, a narrow dark flame of sprays. Height in metres. */
export function cypress(seed: number, H = 9): THREE.Group {
  const r = rng(seed);
  const root = new THREE.Group();
  root.name = 'cypress';
  const R = H * 0.085;
  const sprays: { p: THREE.Vector3; size: number; out: THREE.Vector3 }[] = [];
  for (let i = 0; i < 620; i++) {
    const t = Math.pow(r(), 0.8);
    const y = 0.5 + t * (H - 0.5);
    // a flame: widest a third of the way up, closing to a point
    const prof = Math.pow(Math.sin(Math.min(1, t * 1.02 + 0.08) * Math.PI), 0.55) * (1 - t * 0.35);
    const a = r() * Math.PI * 2;
    const rad = R * prof * (0.55 + r() * 0.5);
    const out = new THREE.Vector3(Math.cos(a), 0.28, Math.sin(a)).normalize();
    sprays.push({ p: new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad), size: 0.42 + r() * 0.3, out });
  }
  const leaves = new THREE.Mesh(
    sprayCards(sprays, r),
    leafMaterial(leafCard(seed + 1, [46, 66, 42], [24, 40, 28], 140, 128, 0.38), 'cypress-leaf'),
  );
  leaves.castShadow = true;
  leaves.frustumCulled = false;
  root.add(leaves);
  const core = new THREE.LatheGeometry(
    [
      new THREE.Vector2(0.001, 0),
      new THREE.Vector2(R * 0.4, 0.3),
      new THREE.Vector2(R * 0.62, H * 0.3),
      new THREE.Vector2(R * 0.5, H * 0.6),
      new THREE.Vector2(R * 0.22, H * 0.86),
      new THREE.Vector2(0.001, H * 0.98),
    ],
    10,
  );
  const m = new THREE.Mesh(
    core,
    new THREE.MeshStandardMaterial({ color: 0x20301f, roughness: 0.96, name: 'cypress-core' }),
  );
  m.castShadow = true;
  root.add(m);
  return root;
}

/** A crown seen from afar, on a card: a round cloud of small leaves, paler where the sun takes it, darker under. Alpha-tested. */
function crownCard(seed: number, N = 128): THREE.DataTexture {
  const r = rng(seed);
  const d = new Uint8Array(N * N * 4);
  const dabs = 760;
  for (let i = 0; i < dabs; i++) {
    const a = r() * Math.PI * 2;
    const q = Math.sqrt(r()) * 0.46;
    const cx = 0.5 + Math.cos(a) * q;
    const cy = 0.5 + Math.sin(a) * q * 0.9;
    const R = 0.018 + r() * 0.03;
    const lit = 0.74 + 0.42 * cy + (r() - 0.5) * 0.12;
    const x0 = Math.floor((cx - R) * N);
    const x1 = Math.ceil((cx + R) * N);
    const y0 = Math.floor((cy - R) * N);
    const y1 = Math.ceil((cy + R) * N);
    for (let y = Math.max(0, y0); y < Math.min(N, y1); y++)
      for (let x = Math.max(0, x0); x < Math.min(N, x1); x++) {
        if (Math.hypot(x / N - cx, y / N - cy) > R) continue;
        const k = (y * N + x) * 4;
        const v = Math.min(255, Math.round(180 * lit));
        d[k] = v;
        d[k + 1] = v;
        d[k + 2] = v;
        d[k + 3] = 255;
      }
  }
  const t = new THREE.DataTexture(d, N, N, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/** The far trees: from afar an olive grove is soft dabs of grey-green, a cypress a dark flame. One card each that always faces the camera, so no ribs where cards would cross and no facets; a fuzzy edge; never closer than sixty metres. Lit from above, whatever it faces. */
export function farTrees(places: { x: number; y: number; z: number; s: number; dark: boolean }[]): THREE.InstancedMesh {
  const r = rng(99);
  const g = new THREE.PlaneGeometry(2.3, 2.1);
  const nor = g.attributes.normal;
  for (let i = 0; i < nor.count; i++) nor.setXYZ(i, 0, 1, 0);
  const mat = new THREE.MeshStandardMaterial({
    map: crownCard(301),
    alphaTest: 0.35,
    alphaToCoverage: true,
    side: THREE.DoubleSide,
    roughness: 0.95,
    name: 'far-trees',
  });
  mat.userData.noShare = true;
  keepNormal(mat);
  patchMaterial(mat, 'far-tree-billboard', (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
       mvPosition.xy += position.xy * vec2( length( instanceMatrix[0].xyz ), length( instanceMatrix[1].xyz ) );
       gl_Position = projectionMatrix * mvPosition;`,
    );
  });
  const m = new THREE.InstancedMesh(g, mat, places.length);
  const M = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const c = new THREE.Color();
  const P = new THREE.Vector3();
  const S = new THREE.Vector3();
  places.forEach((t, i) => {
    if (t.dark) S.set(t.s * 0.55, t.s * 2.6, t.s * 0.55);
    else S.set(t.s * 1.15, t.s, t.s * 1.15);
    P.set(t.x, t.y + S.y * 0.92, t.z);
    M.compose(P, q, S);
    m.setMatrixAt(i, M);
    c.setHex(t.dark ? 0x4a5a3c : 0x93a07c).multiplyScalar(0.82 + r() * 0.3);
    m.setColorAt(i, c);
  });
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.castShadow = false;
  m.receiveShadow = false;
  m.frustumCulled = false;
  return m;
}
