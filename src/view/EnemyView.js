import * as THREE from 'three';

const R = (a, b) => a + Math.random() * (b - a);
const PI2 = Math.PI * 2;

export class EnemyView {
  constructor(scene) {
    this.scene = scene;
    this.views = new Map();
  }

  build() {
    const g = new THREE.Group();
    const skin = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.08 + Math.random() * 0.05, 0.15, 0.18),
      roughness: 1.0, metalness: 0.0
    });
    const cloth = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(0.12 + Math.random() * 0.08, 0.05, 0.08),
      roughness: 0.95, transparent: true, opacity: 0.92
    });
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x1a1210, emissive: 0x662211, emissiveIntensity: 0.8, roughness: 0.8
    });
    const bloodMat = new THREE.MeshBasicMaterial({
      color: 0x8a1c1c, transparent: true, opacity: 0.6
    });

    // Corps principal avec texture de tissu déchiré
    const torso = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.62, 0.28),
      cloth
    );
    torso.position.y = 1.12;
    g.add(torso);

    // Tête - visage réaliste zombie
    const head = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.32, 0.26),
      skin
    );
    head.position.y = 1.63;
    g.add(head);

    // Yeux pourris avec cernes
    const eyeL = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.02),
      eyeMat
    );
    eyeL.position.set(-0.06, 1.66, 0.135);
    g.add(eyeL);

    const eyeR = new THREE.Mesh(
      new THREE.BoxGeometry(0.05, 0.05, 0.02),
      eyeMat
    );
    eyeR.position.set(0.06, 1.66, 0.135);
    g.add(eyeR);

    // Sang sur le visage
    const cheekL = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.03, 0.02),
      bloodMat
    );
    cheekL.position.set(-0.09, 1.64, 0.14);
    g.add(cheekL);

    const cheekR = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.03, 0.02),
      bloodMat
    );
    cheekR.position.set(0.09, 1.64, 0.14);
    g.add(cheekR);

    // Bras
    const armL = new THREE.Group();
    armL.position.set(-0.3, 1.36, 0);
    const armLMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.55, 0.13),
      skin
    );
    armLMesh.position.y = -0.27;
    armL.add(armLMesh);
    armL.rotation.x = -1.35;
    g.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.3, 1.36, 0);
    const armRMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.55, 0.13),
      skin
    );
    armRMesh.position.y = -0.27;
    armR.add(armRMesh);
    armR.rotation.x = -1.35;
    g.add(armR);

    // Jambes
    const legL = new THREE.Group();
    legL.position.set(-0.12, 0.78, 0);
    const legLMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.78, 0.18),
      cloth
    );
    legLMesh.position.y = -0.39;
    legL.add(legLMesh);
    g.add(legL);

    const legR = new THREE.Group();
    legR.position.set(0.12, 0.78, 0);
    const legRMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.16, 0.78, 0.18),
      cloth
    );
    legRMesh.position.y = -0.39;
    legR.add(legRMesh);
    g.add(legR);

    // Bandage autour de la tête
    const bandage = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 0.03, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0xdddddd, roughness: 0.7, transparent: true, opacity: 0.85
      })
    );
    bandage.position.set(0, 1.68, 0);
    g.add(bandage);

    // Trous dans le tissu
    const torsoDirt = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, 0.12, 0.05),
      new THREE.MeshBasicMaterial({ color: 0x1a1a1a, transparent: true, opacity: 0.4 })
    );
    torsoDirt.position.set(0, 1.15, 0.14);
    g.add(torsoDirt);

    return {
      g, skin, cloth, eyeMat, legL, legR, armL, armR,
      bandage, torsoDirt, cheekL, cheekR, mats: [skin, cloth, eyeMat, bloodMat]
    };
  }

  update(dt, enemies) {
    const seen = new Set();
    for (const e of enemies) {
      let v = this.views.get(e.id);
      if (!v) {
        v = this.build();
        this.views.set(e.id, v);
        this.scene.add(v.g);
      }
      seen.add(e.id);
      v.g.position.set(e.pos.x, e.pos.y, e.pos.z);
      v.g.rotation.y = e.yaw;

      const f = e.hitFlash;
      v.skin.emissive.setRGB(f * 0.9, f * 0.12, f * 0.08);
      v.cloth.emissive.setRGB(f * 0.9, f * 0.12, f * 0.08);

      for (const m of v.mats) m.opacity = e.spawnAlpha;

      const moving = e.state === 'chase' || e.state === 'climb';
      const sw = moving ? Math.sin(e.walkPhase) * 0.55 : 0;
      v.legL.rotation.x = sw;
      v.legR.rotation.x = -sw;
      v.armL.rotation.x = -1.35 + Math.sin(e.walkPhase * 0.5) * 0.12;
      v.armR.rotation.x = -1.35 + Math.cos(e.walkPhase * 0.5) * 0.12;

      if (e.state === 'dying') {
        const p = Math.min(1, e.stateT / 0.9);
        v.g.rotation.x = p * 1.5;
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
