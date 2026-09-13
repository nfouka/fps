import * as THREE from 'three';
import * as P from '../core/Procedural.js';

export class Walls {
  constructor(scene, collidables) {
    this.group = new THREE.Group();
    scene.add(this.group);
    const G = this.group;

    const signTex = P.signTexture('MORGUE - CENTRALE');
    const matSign = new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.6 });
    for (const sx of [1, -1]) {
      for (const z of [-18, -6, 6, 18]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.85), matSign);
        m.position.set(sx * 7.97, 2.7, z);
        m.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        G.add(m);
      }
    }

    const woTex = P.wayOutTexture();
    const matWO = new THREE.MeshStandardMaterial({
      map: woTex, emissiveMap: woTex, emissive: 0x66ff88, emissiveIntensity: 0.7, roughness: 0.6
    });
    for (const sx of [1, -1]) {
      for (const z of [27, -27]) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.65), matWO);
        m.position.set(sx * 7.97, 3.3, z);
        m.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        G.add(m);
      }
    }

    for (const sx of [1, -1]) {
      for (const z of [-24, -12, 0, 12, 24]) {
        const tex = P.posterTexture();
        const mat = new THREE.MeshStandardMaterial({
          map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.18, roughness: 0.8
        });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.05), mat);
        m.position.set(sx * 7.96, 2.1, z + (Math.random() * 2 - 1) * 1.5);
        m.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        G.add(m);
      }
    }

    const matGraf = [];
    for (let i = 0; i < 6; i++) {
      matGraf.push(new THREE.MeshBasicMaterial({
        map: P.graffitiTexture(), transparent: true, depthWrite: false
      }));
    }
    for (const sx of [1, -1]) {
      for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.6), matGraf[(Math.random() * matGraf.length) | 0]);
        m.position.set(sx * 7.95, 1.1, -26 + Math.random() * 52);
        m.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        G.add(m);
      }
    }

    for (const sx of [1, -1]) {
      for (const z of [-12, 0, 12]) {
        const mat = new THREE.MeshStandardMaterial({
          map: P.arabicSloganTexture(), transparent: true, depthWrite: false, roughness: 0.9
        });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), mat);
        m.position.set(sx * 7.94, 2.5, z);
        m.rotation.y = sx > 0 ? -Math.PI / 2 : Math.PI / 2;
        G.add(m);
      }
    }

    const matPipe = new THREE.MeshStandardMaterial({ color: 0x6a7076, metalness: 0.85, roughness: 0.4 });
    const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 60, 8);
    for (const sx of [1, -1]) {
      const p1 = new THREE.Mesh(pipeGeo, matPipe);
      p1.rotation.x = Math.PI / 2;
      p1.position.set(sx * 7.8, 4.35, 0);
      G.add(p1);
      const p2 = new THREE.Mesh(pipeGeo, matPipe);
      p2.rotation.x = Math.PI / 2;
      p2.position.set(sx * 7.55, 4.6, 0);
      p2.scale.set(0.7, 1, 0.7);
      G.add(p2);
    }

    const matWood = new THREE.MeshStandardMaterial({ color: 0x5a3d22, roughness: 0.8 });
    const matMetal = new THREE.MeshStandardMaterial({ color: 0x3c4046, metalness: 0.8, roughness: 0.5 });
    for (const sx of [1, -1]) {
      for (const z of [-15, -5, 5, 15]) {
        const b = new THREE.Group();
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 1.8), matWood);
        seat.position.y = 0.45;
        b.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 1.8), matWood);
        back.position.set(sx * 0.25, 0.72, 0);
        b.add(back);
        for (const lz of [-0.75, 0.75]) {
          const leg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.06), matMetal);
          leg.position.set(0, 0.225, lz);
          b.add(leg);
        }
        b.position.set(sx * 3.15, 0, z);
        G.add(b);
        collidables.push({
          minX: sx * 3.15 - 0.35, maxX: sx * 3.15 + 0.35,
          minY: 0, maxY: 1.0,
          minZ: z - 0.95, maxZ: z + 0.95,
          player: true, enemy: true
        });
      }
    }

    const matBin = new THREE.MeshStandardMaterial({ color: 0x4a5058, metalness: 0.7, roughness: 0.5 });
    for (const sx of [1, -1]) {
      for (const z of [22, -22]) {
        const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.85, 10), matBin);
        bin.position.set(sx * 3.35, 0.425, z);
        G.add(bin);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.03, 6, 12), matMetal);
        rim.rotation.x = Math.PI / 2;
        rim.position.set(sx * 3.35, 0.85, z);
        G.add(rim);
      }
    }

    const vendTex = P.vendingTexture();
    const matVend = new THREE.MeshStandardMaterial({ color: 0x1a2030, roughness: 0.6 });
    const matVendFront = new THREE.MeshStandardMaterial({
      map: vendTex, emissiveMap: vendTex, emissive: 0xffffff, emissiveIntensity: 0.9, roughness: 0.4
    });
    const vend = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.9, 0.8), matVend);
    vend.position.set(3.35, 0.95, -26);
    G.add(vend);
    const vfront = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), matVendFront);
    vfront.position.set(2.79, 1.05, -26);
    vfront.rotation.y = -Math.PI / 2;
    G.add(vfront);
    collidables.push({ minX: 2.8, maxX: 3.9, minY: 0, maxY: 1.9, minZ: -26.4, maxZ: -25.6, player: true, enemy: true });
  }
}
