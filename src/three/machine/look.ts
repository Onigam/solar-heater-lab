import * as THREE from 'three';
import { MAT } from '@onigam/lab-kit/three';

// The materials of the machine, made once per world: the same machine in every world is the same colours too. What the x-ray of the `rig` keeps solid, or the section swaps, is flagged
// `noShare`, so that merging keeps it a material of its own.

export type MachineLook = ReturnType<typeof machineLook>;

const own = <T extends THREE.Material>(m: T, name: string): T => {
  m.name = name;
  m.userData.noShare = true;
  return m;
};

export function machineLook() {
  const std = (color: number, roughness: number, metalness: number, name: string) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness, name });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x16242c,
    transparent: true,
    opacity: 0.3,
    roughness: 0.2,
    metalness: 0,
    envMapIntensity: 0.9,
    specularIntensity: 0.25,
    depthWrite: false,
    name: 'glass',
  });
  const air = new THREE.MeshStandardMaterial({
    color: 0xbcd8e8,
    transparent: true,
    opacity: 0.035,
    roughness: 0.9,
    metalness: 0,
    depthWrite: false,
    name: 'air',
  });
  return {
    // ---- the collector
    glass,
    air,
    /** The pale frame and the tray: bare aluminium, reported 0.7 mm. */
    tray: std(0xc9ccc9, 0.5, 0.75, 'tray'),
    frame: std(0xd9dbd6, 0.42, 0.7, 'frame'),
    seal: std(0x1a1a1b, 0.85, 0, 'seal'),
    /** Black polyester powder on steel: reported. Not a mirror. */
    plate: own(std(0x0b0c0e, 0.62, 0, 'plate'), 'plate'),
    /** The polyester blanket: pale and fibrous, reported. */
    blanket: std(0xe6dfc6, 0.98, 0, 'blanket'),
    headerSteel: own(std(0x6d7276, 0.45, 0.8, 'header'), 'header'),
    // ---- the tank
    caseSkin: std(0xd8dad6, 0.46, 0.62, 'case'),
    capBlack: std(0x1d1e20, 0.62, 0, 'cap'),
    /** Injected polyurethane, reported. */
    foam: std(0xd8bd76, 0.92, 0, 'foam'),
    vessel: std(0x4c5359, 0.5, 0.75, 'vessel'),
    /** Vitreous enamel inside, reported: seen in the section's thin band. */
    enamel: std(0xb4cdd8, 0.22, 0.1, 'enamel'),
    jacket: std(0x5b6268, 0.5, 0.8, 'jacket'),
    anode: std(0xbcc2c6, 0.72, 0.5, 'anode'),
    element: MAT.copperBright(),
    terminal: std(0x3a3d40, 0.7, 0.1, 'terminal'),
    // ---- the fittings
    brass: MAT.brass(),
    copper: MAT.copper(),
    zinc: MAT.zinc(),
    steel: MAT.steel(),
    rubber: MAT.rubber(),
    alu: std(0xb9bcb8, 0.55, 0.78, 'rail'),
    /** The grey flex of the booster's supply. */
    flex: std(0x6a6e70, 0.8, 0, 'flex'),
    reservoir: std(0xe4e1d4, 0.55, 0, 'reservoir'),
    /** The test stand: translucent, not part of the machine (research §0.4). */
    stand: new THREE.MeshStandardMaterial({
      color: 0x7fa8c4,
      transparent: true,
      opacity: 0.42,
      roughness: 0.4,
      metalness: 0.1,
      depthWrite: false,
      name: 'stand',
    }),
    standSolid: std(0x5e7f96, 0.45, 0.3, 'stand-marks'),
    level: std(0xb5622f, 0.5, 0.2, 'level'),
  };
}
