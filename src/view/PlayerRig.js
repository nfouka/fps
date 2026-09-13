import * as THREE from 'three';
import * as P from '../core/Procedural.js';

const R = (a, b) => a + Math.random() * (b - a);

export class PlayerRig {
  constructor(camera, scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    camera.add(this.group);

    const metal = new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.45, metalness: 0.85 });
    const metalDark = new THREE.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.5, metalness: 0.8 });
    const polymer = new THREE.MeshStandardMaterial({ color: 0x202326, roughness: 0.85, metalness: 0.1 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.7 });
    const accent = new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.4, metalness: 0.8 });
    const tube = new THREE.MeshStandardMaterial({ color: 0x313438, roughness: 0.5, metalness: 0.7 });
    const lens = new THREE.MeshStandardMaterial({ color: 0x111822, roughness: 0.2, metalness: 0.4, emissive: 0x0a1420, emissiveIntensity: 0.5 });

    const g = this.group;
    const mk = (w, h, d, x, y, z, m) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z);
      g.add(o);
      return o;
    };

    // ---------- modern AR rifle ----------
    this.rifle = new THREE.Group();
    const rx = 0, ry = 0, rz = -0.5;
    mk(0.06, 0.1, 0.42, rx, ry, rz, polymer);         // receiver
    mk(0.05, 0.045, 0.46, rx, ry + 0.06, rz - 0.02, metal);  // upper rail
    mk(0.03, 0.03, 0.42, rx, ry + 0.02, rz - 0.4, metalDark); // barrel
    mk(0.045, 0.045, 0.12, rx, ry + 0.02, rz - 0.62, metalDark); // muzzle tip
    mk(0.055, 0.075, 0.3, rx, ry - 0.01, rz - 0.28, polymer);    // handguard
    mk(0.04, 0.16, 0.09, rx, ry - 0.12, rz - 0.04, metalDark);   // magazine
    mk(0.05, 0.09, 0.18, rx, ry - 0.01, rz + 0.3, polymer);      // stock
    mk(0.045, 0.12, 0.05, rx, ry - 0.11, rz + 0.12, polymer);    // grip
    mk(0.045, 0.035, 0.12, rx, ry + 0.095, rz - 0.02, accent);   // optic base
    mk(0.03, 0.05, 0.03, rx, ry + 0.125, rz - 0.12, metalDark);  // sight
    g.add(this.rifle);

    // ---------- bazooka ----------
    this.bazooka = new THREE.Group();
    mk(0.09, 0.12, 0.16, 0, -0.02, 0.04, metalDark);       // rear body
    mk(0.05, 0.07, 0.3, 0, -0.04, 0.26, polymer);          // stock shaft
    mk(0.045, 0.11, 0.05, 0, -0.12, 0.12, polymer);        // grip
    mk(0.025, 0.025, 0.025, 0, 0.08, -0.5, accent);        // sight dot
    const tubeGeo = new THREE.CylinderGeometry(0.075, 0.075, 1.0, 16);
    const t = new THREE.Mesh(tubeGeo, tube);
    t.rotation.x = Math.PI / 2;
    t.position.set(0, 0, -0.55);
    this.bazooka.add(t);
    const ringGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.05, 16);
    const ring = new THREE.Mesh(ringGeo, metalDark);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0, -1.05);
    this.bazooka.add(ring);
    const lensGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
    const lensM = new THREE.Mesh(lensGeo, lens);
    lensM.rotation.x = Math.PI / 2;
    lensM.position.set(0, 0, -1.07);
    this.bazooka.add(lensM);
    g.add(this.bazooka);

    // ---------- napalm flamethrower ----------
    this.napalm = new THREE.Group();
    const tank = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.09, 0.34, 12),
      new THREE.MeshStandardMaterial({ color: 0x7a3a1a, roughness: 0.7 })
    );
    tank.rotation.x = Math.PI / 2;
    tank.position.set(0, -0.02, 0.14);
    this.napalm.add(tank);
    const hose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.32, 8),
      new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 })
    );
    hose.rotation.x = Math.PI / 2;
    hose.position.set(0, -0.07, 0.02);
    this.napalm.add(hose);
    const gunBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.06, 0.42),
      new THREE.MeshStandardMaterial({ color: 0x2a2d31, roughness: 0.5, metalness: 0.7 })
    );
    gunBody.position.set(0, 0.02, -0.3);
    this.napalm.add(gunBody);
    const nozzle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.028, 0.034, 0.09, 10),
      metalDark
    );
    nozzle.rotation.x = Math.PI / 2;
    nozzle.position.set(0, 0.02, -0.54);
    this.napalm.add(nozzle);
    g.add(this.napalm);

    // ---------- M134 minigun ( American style, canons rotatifs ) ----------
    this.mg = new THREE.Group();
    const barrelGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.42, 7);
    this.mgBarrels = new THREE.Group();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(barrelGeo, metal);
      b.position.set(Math.cos(a) * 0.03, Math.sin(a) * 0.03, 0.04);
      b.rotation.x = Math.PI / 2;
      this.mgBarrels.add(b);
    }
    this.mgBarrels.position.set(0, 0.02, -0.28);
    this.mg.add(this.mgBarrels);
    const hub = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.14, 10),
      metalDark
    );
    hub.rotation.x = Math.PI / 2;
    hub.position.set(0, 0.02, -0.14);
    this.mg.add(hub);
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(0.07, 0.1, 0.14),
      new THREE.MeshStandardMaterial({ color: 0x3a3d41, roughness: 0.55, metalness: 0.75 })
    );
    box.position.set(0, -0.06, 0.04);
    this.mg.add(box);
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.12, 0.05),
      metalDark
    );
    handle.position.set(0, -0.14, 0.12);
    handle.rotation.x = 0.3;
    this.mg.add(handle);
    g.add(this.mg);

    this.basePos = new THREE.Vector3(0.28, -0.27, -0.52);
    this.group.position.copy(this.basePos);
    this.muzzleLocal = new THREE.Vector3(0, 0.02, -0.92);

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
    this.switchT = 0;
    this.mgFiring = false;

    this.shells = [];
    this.shellGeo = new THREE.CylinderGeometry(0.011, 0.013, 0.035, 6);
    this.shellMat = new THREE.MeshStandardMaterial({ color: 0xc9a227, metalness: 0.9, roughness: 0.3 });
  }

  flashNow() {
    this.flashT = 0.07;
    this.flash.visible = true;
    this.flash.material.rotation = Math.random() * Math.PI * 2;
    if (this.current === 'bazooka') {
      this.flash.scale.set(0.95, 0.95, 0.95);
      this.flashLight.intensity = 40;
    } else if (this.current === 'napalm') {
      this.flash.scale.set(0.7 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, 0.7 + Math.random() * 0.3);
      this.flash.material.color.setHex(0xff7a20);
      this.flashLight.intensity = 30;
      this.flashLight.color.setHex(0xff7a20);
    } else {
      this.flash.scale.set(0.45 + Math.random() * 0.25, 0.45 + Math.random() * 0.25, 0.45 + Math.random() * 0.25);
      this.flash.material.color.setHex(0xffd080);
      this.flashLight.intensity = 26;
      this.flashLight.color.setHex(0xffb066);
    }
  }

  kick() {
    this.recoilV += 2.8;
    this.kickRV += 1.3;
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

    // switch animation: quick dip when changing weapon
    const model = player.weapon.def.model;
    if (model !== this.current) {
      this.current = model;
      this.switchT = 0.35;
    }
    if (this.switchT > 0) this.switchT -= dt;

    this.rifle.visible = this.current === 'rifle';
    this.bazooka.visible = this.current === 'bazooka';
    this.napalm.visible = this.current === 'napalm';
    this.mg.visible = this.current === 'mg';

    // rotation des canons minigun (plus vite en tir)
    if (this.current === 'mg') {
      this.mgBarrels.rotation.z += dt * (this.mgFiring ? 60 : 8);
    }

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
    if (this.switchT > 0) {
      this.group.position.y -= Math.sin((0.35 - this.switchT) / 0.35 * Math.PI) * 0.06;
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
