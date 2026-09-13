import * as THREE from 'three';

const R = (a, b) => a + Math.random() * (b - a);
const PI2 = Math.PI * 2;

export class EnemyView {
  constructor(scene) {
    this.scene = scene;
    this.views = new Map();
  }

  build(opts) {
    opts = opts || {};
    const g = new THREE.Group();

    const skinTint = new THREE.Color().setHSL(0.28, 0.18, 0.28 + Math.random() * 0.06);
    const skin = new THREE.MeshStandardMaterial({
      color: skinTint, roughness: 0.85, metalness: 0.0, clearcoat: 0.1
    });
    const vein = new THREE.MeshStandardMaterial({ color: 0x3a5a30, roughness: 0.9, transparent: true, opacity: 0.7 });
    const clothBase = new THREE.Color().setHSL(R(0, 0.9), 0.08, R(0.08, 0.18));
    const cloth = new THREE.MeshStandardMaterial({
      color: clothBase, roughness: 0.95, metalness: 0.0, transparent: true, opacity: 0.94
    });
    const clothTorn = new THREE.MeshStandardMaterial({ color: clothBase.clone().multiplyScalar(0.7), roughness: 1 });
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111, emissive: 0x7a2010, emissiveIntensity: 1.1, roughness: 0.6 });
    const pupil = new THREE.MeshStandardMaterial({ color: 0x200202, emissive: 0xff3010, emissiveIntensity: 1.4, roughness: 0.4 });
    const bloodMat = new THREE.MeshBasicMaterial({ color: 0x5a0f0f, transparent: true, opacity: 0.75 });
    const teeth = new THREE.MeshStandardMaterial({ color: 0xb9b088, roughness: 0.8 });
    const bone = new THREE.MeshStandardMaterial({ color: 0x9a9078, roughness: 0.9 });
    const gunMetal = new THREE.MeshStandardMaterial({ color: 0x23262a, roughness: 0.4, metalness: 0.85 });
    const gunWood = new THREE.MeshStandardMaterial({ color: 0x3a2a18, roughness: 0.7 });

    // --- pelvis / spine ---
    const pelvis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.28, 0.26), cloth);
    pelvis.position.y = 0.86;
    g.add(pelvis);

    // --- torso (torso core + torn shirt) ---
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.2, 0.58, 10), cloth);
    torso.position.y = 1.22;
    torso.rotation.z = R(-0.08, 0.08);
    g.add(torso);
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.16), clothTorn);
    rib.position.set(R(-0.05, 0.05), 1.28, 0.14);
    g.add(rib);

    // --- neck + head ---
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.12, 8), skin);
    neck.position.y = 1.52;
    g.add(neck);
    const head = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), skin);
    head.position.y = 1.72;
    head.scale.set(1, 1.12, 0.98);
    head.rotation.set(R(-0.2, 0.2), R(0, PI2), R(-0.1, 0.1));
    g.add(head);
    // jaw
    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.09, 0.14), bone);
    jaw.position.set(0, 1.62, 0.06);
    g.add(jaw);
    // eyes sockets + glowing eyes
    for (const sx of [-1, 1]) {
      const socket = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), new THREE.MeshStandardMaterial({ color: 0x05060a }));
      socket.position.set(sx * 0.08, 1.74, 0.16);
      g.add(socket);
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 8), pupil);
      eye.position.set(sx * 0.078, 1.74, 0.18);
      g.add(eye);
    }
    // wounds / blood drips
    for (let i = 0; i < 3; i++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(0.03, R(0.06, 0.16), 0.02), bloodMat);
      w.position.set(R(-0.12, 0.12), R(1.6, 1.8), 0.16);
      g.add(w);
    }
    // brow ridge
    const brow = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.04), skin);
    brow.position.set(0, 1.79, 0.15);
    g.add(brow);

    // --- arms (reaching forward, zombie pose) ---
    const armL = buildArm(skin, cloth, -1);
    armL.group.position.set(-0.27, 1.42, 0);
    g.add(armL.group);
    const armR = buildArm(skin, cloth, 1);
    armR.group.position.set(0.27, 1.42, 0);
    g.add(armR.group);

    // --- legs ---
    const legL = buildLeg(cloth, skin, bone, -1);
    legL.group.position.set(-0.12, 0.74, 0);
    g.add(legL.group);
    const legR = buildLeg(cloth, skin, bone, 1);
    legR.group.position.set(0.12, 0.74, 0);
    g.add(legR.group);

    // --- armed variant: rifle held in front ---
    let gun = null;
    if (opts.armed) {
      gun = buildGun(gunMetal, gunWood);
      gun.group.position.set(0, 1.15, 0.28);
      gun.group.rotation.set(0.15, 0, 0);
      g.add(gun.group);
    }

    return {
      g, skin, cloth, eyeMat, pupil, bloodMat, bone, gunMetal, gunWood,
      legL, legR, armL, armR, pelvis, torso, head, jaw, gun,
      mats: [skin, cloth, clothTorn, eyeMat, pupil, bloodMat, bone, gunMetal, gunWood]
    };
  }

  update(dt, enemies) {
    const seen = new Set();
    for (const e of enemies) {
      let v = this.views.get(e.id);
      if (!v) {
        v = this.build({ armed: e.armed });
        this.views.set(e.id, v);
        this.scene.add(v.g);
      }
      seen.add(e.id);
      v.g.position.set(e.pos.x, e.pos.y, e.pos.z);
      v.g.rotation.y = e.yaw;

      const f = e.hitFlash;
      for (const m of v.mats) {
        if (m.emissive) m.emissive.setRGB(f * 0.8, f * 0.1, f * 0.06);
      }

      for (const m of v.mats) m.opacity = e.spawnAlpha;

      const moving = e.state === 'chase' || e.state === 'climb' || e.state === 'attack';
      const sw = moving ? Math.sin(e.walkPhase) * 0.6 : 0;
      v.legL.group.rotation.x = sw;
      v.legR.group.rotation.x = -sw;
      v.armL.group.rotation.x = -1.5 + Math.sin(e.walkPhase * 0.5) * 0.1;
      v.armR.group.rotation.x = -1.5 + Math.cos(e.walkPhase * 0.5) * 0.1;
      v.armL.group.rotation.z = 0.15;
      v.armR.group.rotation.z = -0.15;
      // slight lurch
      v.torso.rotation.z = Math.sin(e.walkPhase) * 0.04;

      if (e.state === 'dying') {
        const p = Math.min(1, e.stateT / 0.9);
        v.g.rotation.x = p * 1.6;
        v.g.position.y = -p * 0.3;
      }
    }
    for (const [id, v] of this.views) {
      if (!seen.has(id)) {
        this.scene.remove(v.g);
        for (const m of v.mats) m.dispose();
        this.views.delete(id);
      }
    }
  }

  clear() {
    for (const [, v] of this.views) {
      this.scene.remove(v.g);
      for (const m of v.mats) m.dispose();
    }
    this.views.clear();
  }
}

function buildArm(skin, cloth, side) {
  const group = new THREE.Group();
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.32, 8), skin);
  upper.position.y = -0.16;
  group.add(upper);
  const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.3, 8), cloth);
  fore.position.set(0, -0.42, 0.06);
  fore.rotation.x = 0.3;
  group.add(fore);
  const hand = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), skin);
  hand.position.set(0, -0.58, 0.12);
  hand.scale.set(1, 1.2, 0.8);
  group.add(hand);
  return { group, upper, fore, hand };
}

function buildLeg(cloth, skin, bone, side) {
  const group = new THREE.Group();
  const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.065, 0.36, 8), cloth);
  thigh.position.y = -0.18;
  group.add(thigh);
  const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.34, 8), skin);
  shin.position.y = -0.52;
  group.add(shin);
  const foot = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.06, 0.18), bone);
  foot.position.set(0, -0.72, 0.05);
  group.add(foot);
  return { group, thigh, shin, foot };
}

function buildGun(gunMetal, gunWood) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.07, 0.42), gunMetal);
  body.position.set(0, 0, 0.02);
  group.add(body);
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.3, 8), gunMetal);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.01, -0.28);
  group.add(barrel);
  const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.14, 0.06), gunMetal);
  mag.position.set(0, -0.1, 0.02);
  mag.rotation.x = 0.25;
  group.add(mag);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.12), gunWood);
  stock.position.set(0, -0.01, 0.24);
  group.add(stock);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.09, 0.04), gunWood);
  grip.position.set(0, -0.09, 0.12);
  grip.rotation.x = -0.3;
  group.add(grip);
  return { group };
}
