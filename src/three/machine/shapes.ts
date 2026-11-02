import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// The geometry every world's machine is made of: plain boxes, cylinders along a line, a profile extruded across the slope, a profile revolved around a tank's axis. Geometry only:
// no canvas, no GL context, so all of it runs in Node under vitest. A section is geometry too: a shell of half a turn with its flat faces, swapped in by the section tool. No clipping
// plane, so nothing to z-fight, nothing to clip the shadows, and a click goes where the eye goes.

export type P2 = readonly [number, number];
const TAU = Math.PI * 2;

/** Merge geometries of any kind: a common set of attributes (position, normal, uv), an index on each. */
export function mergeAll(list: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const norm = list.map((g) => {
    const out = new THREE.BufferGeometry();
    const pos = g.attributes.position;
    out.setAttribute('position', pos);
    if (!g.attributes.normal) g.computeVertexNormals();
    out.setAttribute('normal', g.attributes.normal);
    out.setAttribute('uv', g.attributes.uv ?? new THREE.BufferAttribute(new Float32Array(pos.count * 2), 2));
    if (g.index) out.setIndex(g.index);
    else {
      const idx = new Uint32Array(pos.count);
      for (let i = 0; i < pos.count; i++) idx[i] = i;
      out.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    return out;
  });
  const merged = mergeGeometries(norm, false);
  if (!merged) throw new Error('mergeAll: nothing to merge');
  return merged;
}

/** A box between two corners. */
export function box(x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return g;
}

/** A solid cylinder from `a` to `b`. */
export function rod(a: THREE.Vector3, b: THREE.Vector3, r: number, seg = 12, r2 = r): THREE.BufferGeometry {
  const d = b.clone().sub(a);
  const g = new THREE.CylinderGeometry(r2, r, d.length(), seg);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
  g.applyQuaternion(q);
  g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
  return g;
}

/** A solid cylinder around X. */
export function cylX(r: number, x0: number, x1: number, y = 0, z = 0, seg = 16): THREE.BufferGeometry {
  return rod(new THREE.Vector3(x0, y, z), new THREE.Vector3(x1, y, z), r, seg);
}

/** A hex nut or bar around X. */
export function hexX(r: number, x0: number, x1: number, y = 0, z = 0): THREE.BufferGeometry {
  const g = rod(new THREE.Vector3(x0, y, z), new THREE.Vector3(x1, y, z), r, 6).toNonIndexed();
  g.computeVertexNormals();
  return g;
}

/**
 * A closed polygon in the roof's own section (`s` up the slope, `n` out of the roof), extruded across it from x0 to x1: a bracket, a saddle, a strap's band. `s` maps to -Z, as everywhere.
 */
export function acrossSlope(profile: readonly P2[], x0: number, x1: number, bevel = 0): THREE.BufferGeometry {
  const shape = new THREE.Shape(profile.map(([s, n]) => new THREE.Vector2(s, n)));
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.abs(x1 - x0) - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 1,
    curveSegments: 4,
  });
  // (u, v, w) -> (x0 + w, v, -u): a proper rotation, so the faces keep their sense
  const m = new THREE.Matrix4().set(0, 0, 1, Math.min(x0, x1) + bevel, 0, 1, 0, 0, -1, 0, 0, 0, 0, 0, 0, 1);
  g.applyMatrix4(m);
  return g;
}

/** A closed polygon (x, y) extruded along Z from z0 to z1: an end-on section. */
export function alongZ(profile: readonly P2[], z0: number, z1: number): THREE.BufferGeometry {
  const shape = new THREE.Shape(profile.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.abs(z1 - z0), bevelEnabled: false, curveSegments: 4 });
  g.translate(0, 0, Math.min(z0, z1));
  return g;
}

/**
 * A profile of (x, r) points turned around the X axis. `phi0` and `phiLength` set how much of the turn (0 is +Y, towards +Z): the whole for the machine, half for the section.
 * Each segment of the profile keeps its own normals around the turn, sharp between segments, unless `smooth`, for a dome.
 */
export function revolveX(
  profile: readonly P2[],
  o: { phi0?: number; phiLength?: number; seg?: number; smooth?: boolean } = {},
): THREE.BufferGeometry {
  const phi0 = o.phi0 ?? 0;
  const len = o.phiLength ?? TAU;
  const seg = o.seg ?? 40;
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const addStrip = (a: P2, b: P2, na: P2, nb: P2) => {
    const first = pos.length / 3;
    for (let i = 0; i <= seg; i++) {
      const phi = phi0 + (len * i) / seg;
      const c = Math.cos(phi);
      const s = Math.sin(phi);
      for (const [p, n, v] of [
        [a, na, 0],
        [b, nb, 1],
      ] as const) {
        pos.push(p[0], p[1] * c, p[1] * s);
        nor.push(n[0], n[1] * c, n[1] * s);
        uv.push(i / seg, v);
      }
    }
    for (let i = 0; i < seg; i++) {
      const k = first + i * 2;
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  };
  // a segment's outward normal in (x, r): the profile runs so that this side is the outside
  const normalOf = (a: P2, b: P2): P2 => {
    const dx = b[0] - a[0];
    const dr = b[1] - a[1];
    const L = Math.hypot(dx, dr) || 1;
    return [-dr / L, dx / L];
  };
  for (let i = 0; i < profile.length - 1; i++) {
    const a = profile[i];
    const b = profile[i + 1];
    let na = normalOf(a, b);
    let nb = na;
    if (o.smooth) {
      const before = i > 0 ? normalOf(profile[i - 1], a) : na;
      const after = i < profile.length - 2 ? normalOf(b, profile[i + 2]) : na;
      na = unit2(before[0] + na[0], before[1] + na[1]);
      nb = unit2(after[0] + nb[0], after[1] + nb[1]);
    }
    addStrip(a, b, na, nb);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

function unit2(x: number, y: number): P2 {
  const L = Math.hypot(x, y) || 1;
  return [x / L, y / L];
}

/**
 * The flat face where a revolved solid is cut by the vertical plane through its axis: the closed polygon (x, r), drawn above and below the axis on the plane z = `z`, facing +Z.
 * `lower` says if the lower half is there too, `below` draws it only below the axis, for a jacket that wraps half the vessel.
 */
export function sectionFace(
  polygon: readonly P2[],
  o: { z?: number; upper?: boolean; lower?: boolean } = {},
): THREE.BufferGeometry {
  const z = o.z ?? 0;
  const contour = polygon.map(([x, r]) => new THREE.Vector2(x, r));
  if (!THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
  // ShapeUtils' triangles follow the contour's sense; it is clockwise here: the faces are wound by hand below
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const addTri = (a: THREE.Vector2, b: THREE.Vector2, c: THREE.Vector2, sign: number) => {
    const area = (b.x - a.x) * (c.y * sign - a.y * sign) - (c.x - a.x) * (b.y * sign - a.y * sign);
    const order = area > 0 ? [a, b, c] : [a, c, b];
    for (const v of order) {
      pos.push(v.x, v.y * sign, z);
      nor.push(0, 0, 1);
      uv.push(v.x, v.y * sign);
    }
  };
  for (const [i, j, k] of tris) {
    if (o.upper !== false) addTri(contour[i], contour[j], contour[k], 1);
    if (o.lower !== false) addTri(contour[i], contour[j], contour[k], -1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  return g;
}

/** The centre line of a pipe: a polyline with rounded corners, as points close enough for a tube and for flow dots. */
export function rounded(points: readonly THREE.Vector3[], bend: number, perCorner = 5): THREE.Vector3[] {
  const out: THREE.Vector3[] = [points[0].clone()];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i];
    const a = points[i - 1].clone().sub(p);
    const b = points[i + 1].clone().sub(p);
    const r = Math.min(bend, a.length() * 0.45, b.length() * 0.45);
    if (r < 1e-4) {
      out.push(p.clone());
      continue;
    }
    const pa = p.clone().addScaledVector(a.normalize(), r);
    const pb = p.clone().addScaledVector(b.normalize(), r);
    for (let k = 0; k <= perCorner; k++) {
      const t = k / perCorner;
      // a quadratic Bézier from pa to pb with its control point on the corner
      const q = new THREE.Vector3()
        .addScaledVector(pa, (1 - t) * (1 - t))
        .addScaledVector(p, 2 * t * (1 - t))
        .addScaledVector(pb, t * t);
      out.push(q);
    }
  }
  out.push(points[points.length - 1].clone());
  return out;
}

/** A tube through a polyline (exact at its ends), with parallel-transported frames and a closed end disc. Rebuilt in place, as the tank's height changes. */
export function tubeThrough(
  path: readonly THREE.Vector3[],
  r: number | ((share: number) => number),
  radial = 10,
): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let tangent = path[1].clone().sub(path[0]).normalize();
  let n = new THREE.Vector3(0, 1, 0);
  if (Math.abs(n.dot(tangent)) > 0.9) n.set(0, 0, 1);
  n.addScaledVector(tangent, -n.dot(tangent)).normalize();
  let len = 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) total += path[i].distanceTo(path[i - 1]);
  const radius = typeof r === 'number' ? () => r : r;
  const q = new THREE.Quaternion();
  for (let i = 0; i < path.length; i++) {
    const next = i < path.length - 1 ? path[i + 1].clone().sub(path[i]).normalize() : tangent;
    const t = i === 0 ? tangent : tangent.clone().add(next).normalize();
    if (i > 0) len += path[i].distanceTo(path[i - 1]);
    const bin = new THREE.Vector3().crossVectors(t, n).normalize();
    const here = radius(total > 0 ? len / total : 0);
    for (let k = 0; k <= radial; k++) {
      const a = (k / radial) * TAU;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const nx = n.x * c + bin.x * s;
      const ny = n.y * c + bin.y * s;
      const nz = n.z * c + bin.z * s;
      pos.push(path[i].x + here * nx, path[i].y + here * ny, path[i].z + here * nz);
      nor.push(nx, ny, nz);
      uv.push(k / radial, len);
    }
    q.setFromUnitVectors(tangent, next);
    n.applyQuaternion(q);
    n.addScaledVector(next, -n.dot(next)).normalize();
    tangent = next;
  }
  const row = radial + 1;
  for (let i = 0; i < path.length - 1; i++) {
    for (let k = 0; k < radial; k++) {
      const a = i * row + k;
      const b = a + row;
      idx.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
