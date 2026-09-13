import * as THREE from 'three';
import * as P from '../core/Procedural.js';

const R = (a, b) => a + Math.random() * (b - a);

export class PlayerRig {
  constructor(camera, scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    camera.add(this.group);

    const dark = new THREE.MeshStandardMaterial({ color: 0x22262b, roughness: 0.5, metalness: 0.6 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.7 });
    const mk = (w, h, d, x, y, z, m) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z);
      this.group.add(o);
      return o;
    };
    mk(0.09, 0.1, 0.55, 0, 0, -0.15, dark);
    mk(0.05, 0.05, 0.5, 0, 0.02, -0.62, dark);
    mk(0.07, 0.16, 0.1, 0, -0.11, -0.05, dark);
    mk(0.09, 0.12, 0.22, 0, -0.02, 0.28, wood);
    mk(0.05, 0.09, 0.07, 0, -0.13, 0.12, wood);
    mk(0.04, 0.05, 0.18, 0, 0.09, -0.1, dark);

    this.basePos = new THREE.Vector3(0.27, -0.25, -0.5);
    this.group.position.copy(this.basePos);
    this.muzzleLocal = new THREE.Vector3(0, 0.02, -0.9);

    this.flash = new THREE.Sprite(new THREE.SpriteMaterial({
      map: P.muzzleFlashTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    }));
    this.flash.scale.set(0.5, 0.5, 0.5);
    this.flash.visible = false;
    this.group.add(this.flash);
    this.flashLight = new THREE.PointLight(0xffb066, 0, 9, 2);
    this.group.add(this.flashLight);
    this.flashT = 0;

    this.recoilZ = 0;
    this.recoilV = 0;
    this.kickR = 0;
    this.kickRV = 0;

    this.shells = [];
    this.shellGeo = new THREE.CylinderGeometry(0.011, 0.013, 0.035, 6);
    this.shellMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.3 });
  }

  flashNow() {
    this.flashT = 0.055;
    this.flash.visible = true;
    this.flash.material.rotation = Math.random() * Math.PI * 2;
    const s = 0.35 + Math.random() * 0.25;
    this.flash.scale.set(s, s, s);
    this.flashLight.intensity = 26;
  }

  kick() {
    this.recoilV += 2.6;
    this.kickRV += 1.1;
  }

  ejectShell(camera) {
    const m = new THREE.Mesh(this.shellGeo, this.shellMat);
    const muzzle = this.getMuzzleWorld();
    m.position.copy(muzzle);
    m.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    const vel = new THREE.Vector3(R(0.8, 1.6), R(1.8, 2.6), R(-0.3, 0.3));
    vel.applyQuaternion(camera.quaternion);
    this.scene.add(m);
    this.shells.push({ m, vel, life: 2.5 });
  }

  getMuzzleWorld() {
    return this.group.localToWorld(this.muzzleLocal.clone());
  }

  clearShells() {
    for (const s of this.shells) this.scene.remove(s.m);
    this.shells.length = 0;
  }

  update(dt, player, time) {
    this.group.position.copy(this.basePos);
    const b = player.bobPhase, a = player.bobAmp;
    this.group.position.x += Math.sin(b) * 0.012 * a;
    this.group.position.y += Math.abs(Math.cos(b)) * 0.01 * a;

    const k = 140, c = 16;
    this.recoilV += (-k * this.recoilZ - c * this.recoilV) * dt;
    this.recoilZ += this.recoilV * dt;
    this.kickRV += (-120 * this.kickR - 15 * this.kickRV) * dt;
    this.kickR += this.kickRV * dt;
    this.group.position.z += this.recoilZ * 0.12;
    this.group.rotation.x = this.kickR * 0.15;

    const w = player.weapon;
    if (w.reloading) {
      const p = Math.min(1, Math.max(0, 1 - (w.reloadEnd - time) / w.reloadTime));
      const dip = Math.sin(p * Math.PI);
      this.group.rotation.x += dip * 0.6;
      this.group.position.y -= dip * 0.12;
    }

    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) {
        this.flash.visible = false;
        this.flashLight.intensity = 0;
      }
    }

    for (let i = this.shells.length - 1; i >= 0; i--) {
      const s = this.shells[i];
      s.life -= dt;
      if (s.life <= 0) {
        this.scene.remove(s.m);
        this.shells.splice(i, 1);
        continue;
      }
      s.vel.y -= 9.8 * dt;
      s.m.position.addScaledVector(s.vel, dt);
      const floorY = Math.abs(s.m.position.x) < 4 ? 0.02 : -1.18;
      if (s.m.position.y < floorY) {
        s.m.position.y = floorY;
        s.vel.set(0, 0, 0);
      }
    }
  }
}
