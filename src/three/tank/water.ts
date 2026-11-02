import * as THREE from 'three';

// The water of the `tank-and-tap` world (`docs/water.md`): the shower's drops fall under gravity from the head, in the number the model's `tapFlow` says; the drip at the relief's funnel falls one drop at
// a time, at the rate of the model's `reliefDrip`, in real time. The steam is decoration, and its strength follows `tapT`. No random draw that is not seeded by the index: a film's frame is the same twice.

const G = 9.81;

function softDot(): THREE.DataTexture {
  const n = 32;
  const data = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const d = Math.hypot((i + 0.5) / n - 0.5, (j + 0.5) / n - 0.5) * 2;
      const a = Math.max(0, 1 - d);
      const k = (j * n + i) * 4;
      data[k] = data[k + 1] = data[k + 2] = 255;
      data[k + 3] = Math.round(255 * a * a);
    }
  }
  const t = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

const hash = (i: number): number => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** How many of the shower's drops are alive for a flow, L/min. derived: a full shower of 8 L/min fills the pool. Proportional, tested. */
export function showerDrops(flow: number, pool: number): number {
  return Math.round(Math.min(1, Math.max(0, flow) / 8) * pool);
}

/** Drops a second at the relief's funnel: one drop of 0.05 mL, the usual size, at the model's L/h, capped where the eye stops counting. derived. */
export function reliefRate(lph: number): number {
  return Math.min(10, (Math.max(0, lph) * 1000) / 3600 / 0.05);
}

export class ShowerWater {
  readonly root = new THREE.Group();
  /** The drops, each a short streak along its fall: one draw call. */
  readonly spray: THREE.InstancedMesh;
  readonly steam: THREE.Points;
  /** Drops alive now, and steam's strength now: for a test. */
  alive = 0;
  steamNow = 0;
  private readonly pool = 420;
  private readonly fall: number;
  private readonly m = new THREE.Matrix4();
  private readonly p = new THREE.Vector3();
  private readonly q = new THREE.Quaternion();
  private readonly s = new THREE.Vector3();

  constructor(
    private readonly head: THREE.Vector3,
    private readonly floorY: number,
    private readonly spreadR: number,
  ) {
    this.root.name = 'shower-water';
    const v0 = 1.6;
    // time to the tray from the head, from the equation of the fall
    this.fall = (-v0 + Math.sqrt(v0 * v0 + 2 * G * (head.y - floorY))) / G;
    const g = new THREE.CylinderGeometry(0.0022, 0.0022, 1, 5);
    this.spray = new THREE.InstancedMesh(
      g,
      new THREE.MeshStandardMaterial({
        color: 0x6da7d0,
        roughness: 0.2,
        metalness: 0,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
        name: 'shower-drops',
      }),
      this.pool,
    );
    this.spray.count = 0;
    this.spray.frustumCulled = false;
    this.spray.castShadow = false;
    this.spray.userData.noShadow = true;
    const n = 60;
    const gs = new THREE.BufferGeometry();
    gs.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.steam = new THREE.Points(
      gs,
      new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.42,
        map: softDot(),
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    this.steam.frustumCulled = false;
    this.steam.castShadow = false;
    this.steam.userData.noShadow = true;
    this.root.add(this.spray, this.steam);
  }

  /** `t` is the view's clock. `flow` L/min and `T` °C from the model, `air` °C. */
  update(flow: number, T: number, air: number, t: number): void {
    this.alive = showerDrops(flow, this.pool);
    const v0 = 1.6;
    for (let i = 0; i < this.alive; i++) {
      const phase = (t / this.fall + hash(i)) % 1;
      const age = phase * this.fall;
      const a = hash(i + 0.37) * Math.PI * 2;
      const r = Math.sqrt(hash(i + 0.71)) * this.spreadR;
      const out = 1 + age * 0.9;
      this.p.set(
        this.head.x + r * out * Math.cos(a),
        this.head.y - v0 * age - 0.5 * G * age * age,
        this.head.z + r * out * Math.sin(a),
      );
      // a streak as long as the drop falls in a sixtieth of a second, what the eye keeps of it
      const v = v0 + G * age;
      this.s.set(1, v / 60, 1);
      this.m.compose(this.p, this.q, this.s);
      this.spray.setMatrixAt(i, this.m);
    }
    this.spray.count = this.alive;
    this.spray.instanceMatrix.needsUpdate = true;
    this.spray.visible = this.alive > 0;

    // steam: decoration, it grows with how far the water is above the air
    const strength = flow > 0.05 ? Math.min(1, Math.max(0, (T - air - 8) / 30)) : 0;
    this.steamNow = strength;
    const ps = this.steam.geometry.attributes.position as THREE.BufferAttribute;
    (this.steam.material as THREE.PointsMaterial).opacity = 0.09 * strength;
    this.steam.visible = strength > 0.01;
    if (this.steam.visible) {
      for (let i = 0; i < ps.count; i++) {
        const life = (t * 0.16 + hash(i * 3.1)) % 1;
        const a = hash(i * 7.7) * Math.PI * 2 + t * 0.2;
        const r = 0.08 + life * 0.42;
        ps.setXYZ(i, this.head.x + r * Math.cos(a), this.floorY + 0.25 + life * 1.9, this.head.z + r * Math.sin(a));
      }
      ps.needsUpdate = true;
    }
  }
}

/** One drop at a time, at a rate from the model. Falling from `from` to `to`. */
export class Drip {
  readonly object: THREE.Mesh;
  private phase = 0;
  /** Drops fallen so far: for a test. */
  fallen = 0;
  constructor(
    private readonly from: THREE.Vector3,
    private readonly to: number,
    size = 0.0045,
  ) {
    this.object = new THREE.Mesh(
      new THREE.SphereGeometry(size, 10, 8),
      new THREE.MeshStandardMaterial({
        color: 0xbcdcee,
        roughness: 0.15,
        metalness: 0,
        transparent: true,
        opacity: 0.85,
      }),
    );
    this.object.scale.y = 1.5;
    this.object.castShadow = false;
    this.object.userData.noShadow = true;
    this.object.visible = false;
  }
  update(lph: number, dt: number): void {
    const rate = reliefRate(lph);
    if (rate <= 0) {
      this.object.visible = false;
      this.phase = 0;
      return;
    }
    const fall = Math.sqrt((2 * (this.from.y - this.to)) / G);
    // a drop swells for the rest of the period, then falls
    const period = 1 / rate;
    this.phase += dt;
    if (this.phase > Math.max(period, fall)) {
      this.phase = 0;
      this.fallen++;
    }
    const age = this.phase;
    this.object.visible = age < fall;
    this.object.position.set(this.from.x, this.from.y - 0.5 * G * age * age, this.from.z);
  }
}
