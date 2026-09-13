import * as THREE from 'three';
import * as P from '../core/Procedural.js';

export const STATION = {
  halfW: 4,
  trackOuter: 8,
  zMin: -30,
  zMax: 30,
  ceilY: 5,
  trackY: -1.2,
  eye: 1.65,
  edge: 4.05,
  stairZ: 27,
  stairHalf: 1.6
};

export class SubwayStation {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.collidables = [];

    const S = STATION;
    const floorTile = P.tileTexture(2, 15);
    const wallTile = P.tileTexture(17, 1.6);
    const colTile = P.tileTexture(1, 2);
    const edgeTile = P.tileTexture(14, 0.3);
    const concrete = P.concreteTexture(8, 8);
    const concreteBig = P.concreteTexture(16, 16);
    const ballast = P.ballastTexture(2, 34);

    const matFloor = new THREE.MeshStandardMaterial({ map: floorTile, roughness: 0.5, metalness: 0.05 });
    const matWall = new THREE.MeshStandardMaterial({ map: wallTile, roughness: 0.5, metalness: 0.05 });
    const matCol = new THREE.MeshStandardMaterial({ map: colTile, roughness: 0.5, metalness: 0.05 });
    const matEdge = new THREE.MeshStandardMaterial({ map: edgeTile, roughness: 0.6 });
    const matConc = new THREE.MeshStandardMaterial({ map: concrete, roughness: 0.9 });
    const matConcBig = new THREE.MeshStandardMaterial({ map: concreteBig, roughness: 0.9 });
    const matBallast = new THREE.MeshStandardMaterial({ map: ballast, roughness: 1 });
    const matRail = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.9, roughness: 0.35 });
    const matTie = new THREE.MeshStandardMaterial({ color: 0x2e2418, roughness: 0.95 });
    const matDark = new THREE.MeshStandardMaterial({ color: 0x121519, roughness: 1, side: THREE.BackSide });
    const matYellow = new THREE.MeshStandardMaterial({ color: 0xd9a520, emissive: 0x3a2a00, roughness: 0.7 });

    const box = (w, h, d, x, y, z, mat, player = false, enemy = false) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
      m.position.set(x, y, z);
      this.group.add(m);
      if (player || enemy) {
        this.collidables.push({
          minX: x - w / 2, maxX: x + w / 2,
          minY: y - h / 2, maxY: y + h / 2,
          minZ: z - d / 2, maxZ: z + d / 2,
          player, enemy
        });
      }
      return m;
    };

    box(8, 0.3, 60, 0, -0.15, 0, matFloor);
    this.collidables.push({ minX: -4, maxX: 4, minY: -0.3, maxY: 0, minZ: -30, maxZ: 30, player: false, enemy: false });
    box(4, 0.2, 68, 6, -1.3, 0, matBallast);
    box(4, 0.2, 68, -6, -1.3, 0, matBallast);
    this.collidables.push({ minX: -8, maxX: 8, minY: -1.4, maxY: -1.2, minZ: -34, maxZ: 34, player: false, enemy: false });

    box(0.22, 0.02, 60, 3.62, 0.006, 0, matYellow);
    box(0.22, 0.02, 60, -3.62, 0.006, 0, matYellow);

    for (const sx of [1, -1]) {
      for (const off of [-0.72, 0.72]) {
        box(0.09, 0.12, 68, sx * 6 + off, -1.14, 0, matRail);
      }
    }

    const tieGeo = new THREE.BoxGeometry(2.8, 0.1, 0.26);
    const tieCount = 2 * 76;
    const ties = new THREE.InstancedMesh(tieGeo, matTie, tieCount);
    const mtx = new THREE.Matrix4();
    let ti = 0;
    for (const sx of [1, -1]) {
      for (let i = 0; i < 76; i++) {
        const z = -34 + i * 0.9 + 0.45;
        mtx.makeTranslation(sx * 6, -1.21, z);
        ties.setMatrixAt(ti++, mtx);
      }
    }
    ties.instanceMatrix.needsUpdate = true;
    this.group.add(ties);

    for (const sx of [1, -1]) {
      box(0.25, 1.2, 1.4, sx * 4.12, -0.6, -29.3, matEdge, true, false);
      box(0.25, 1.2, 50.8, sx * 4.12, -0.6, 0, matEdge, true, false);
      box(0.25, 1.2, 1.4, sx * 4.12, -0.6, 29.3, matEdge, true, false);
    }

    for (const sx of [1, -1]) {
      box(0.4, 6.4, 68, sx * 8.2, 1.9, 0, matWall, true, true);
    }

    for (const ez of [1, -1]) {
      for (const sx of [1, -1]) {
        box(0.35, 6.4, 0.4, 4.4 * sx, 1.9, ez * 30.6, matConc, true, true);
        box(0.35, 6.4, 0.4, 7.6 * sx, 1.9, ez * 30.6, matConc, true, true);
        box(3.6, 3.4, 0.4, 6 * sx, 3.4, ez * 30.6, matConc, true, true);
      }
      const tube = new THREE.Mesh(
        new THREE.CylinderGeometry(1.5, 1.5, 6, 14, 1, true),
        matDark
      );
      tube.rotation.x = Math.PI / 2;
      tube.position.set(6, 0.2, ez * 33.6);
      this.group.add(tube);
      const tube2 = tube.clone();
      tube2.position.x = -6;
      this.group.add(tube2);

      box(3, 3, 0.2, 6, 0.2, ez * 36.6, matDark, false, false);
      box(3, 3, 0.2, -6, 0.2, ez * 36.6, matDark, false, false);
      this.collidables.push({ minX: -7.5, maxX: -4.5, minY: -1.3, maxY: 1.7, minZ: ez * 36.6 - 0.1, maxZ: ez * 36.6 + 0.1, player: false, enemy: false });
      this.collidables.push({ minX: 4.5, maxX: 7.5, minY: -1.3, maxY: 1.7, minZ: ez * 36.6 - 0.1, maxZ: ez * 36.6 + 0.1, player: false, enemy: false });
    }

    box(16.8, 0.4, 68, 0, 5.2, 0, matConcBig, false, false);
    this.collidables.push({ minX: -8.4, maxX: 8.4, minY: 5, maxY: 5.4, minZ: -34, maxZ: 34, player: false, enemy: false });

    for (let z = -24; z <= 24; z += 8) {
      box(0.7, 5, 0.7, 0, 2.5, z, matCol, true, true);
    }

    for (const sx of [1, -1]) {
      for (const sz of [S.stairZ, -S.stairZ]) {
        for (let i = 0; i < 6; i++) {
          const h = 0.2 * (i + 1);
          const x = sx * (6 - 0.34 * i - 0.17);
          box(0.34, h, 3.2, x, -1.2 + h / 2, sz, matConc, false, false);
        }
      }
    }
  }
}
