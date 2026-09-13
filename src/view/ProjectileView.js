import * as THREE from 'three';

const R = (a, b) => a + Math.random() * (b - a);

// Rendu des projectiles en vol (rockets bazooka / bombes napalm) : mesh +
// lumière + traînée, synchronisé frame après frame avec state.projectiles.
export class ProjectileView {
  constructor(scene) {
    this.scene = scene;
    this.rockets = new Map(); // proj -> { g, light }
    this.trails = [];
    this.trailPool = [];

    this.trailGeo = new THREE.SphereGeometry(0.14, 6, 6);
    this.trailSharedGeo = new THREE.SphereGeometry(0.14, 6, 6);
  }

  _makeRocket() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 0.5, 10),
      new THREE.MeshStandardMaterial({ color: 0x8a8d90, metalness: 0.85, roughness: 0.4 })
    );
    body.rotation.x = Math.PI / 2;
    g.add(body);
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.05, 0.18, 10),
      new THREE.MeshStandardMaterial({ color: 0xd94a2a, roughness: 0.55 })
    );
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = 0.3;
    g.add(nose);
    const light = new THREE.PointLight(0xff9030, 7, 9);
    g.add(light);
    return g;
  }

  _makeTrailMesh() {
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffb040, transparent: true, opacity: 1,
      blending: THREE.AdditiveBlending, depthWrite: false
    });
    const m = new THREE.Mesh(this.trailSharedGeo, mat);
    m.visible = false;
    this.scene.add(m);
    return m;
  }

  _spawnTrail(x, y, z) {
    const m = this.trailPool.pop() || this._makeTrailMesh();
    m.position.set(x + R(-0.06, 0.06), y + R(-0.06, 0.06), z + R(-0.06, 0.06));
    m.material.opacity = 1;
    m.material.color.setHex(Math.random() < 0.4 ? 0x555555 : 0xffb040);
    const s = R(0.6, 1.5);
    m.scale.set(s, s, s);
    m.visible = true;
    this.trails.push({ m, life: 0.55, max: 0.55, vy: R(0.1, 0.5) });
    if (this.trails.length > 260) {
      const old = this.trails.shift();
      old.m.visible = false;
      this.trailPool.push(old.m);
    }
  }

  update(dt, projectiles) {
    const seen = new Set();
    for (const pr of projectiles) {
      seen.add(pr);
      let r = this.rockets.get(pr);
      if (!r) {
        r = { g: this._makeRocket() };
        this.rockets.set(pr, r);
        this.scene.add(r.g);
      }
      r.g.position.set(pr.x, pr.y, pr.z);
      const dir = new THREE.Vector3(pr.dx, pr.dy, pr.dz);
      if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
      dir.normalize();
      r.g.rotation.y = Math.atan2(dir.x, dir.z);
      r.g.rotation.x = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
      this._spawnTrail(pr.x, pr.y, pr.z);
    }
    for (const [pr, r] of this.rockets) {
      if (!seen.has(pr)) {
        this.scene.remove(r.g);
        this.rockets.delete(pr);
      }
    }

    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.life -= dt;
      t.m.material.opacity = Math.max(0, t.life / t.max);
      t.m.scale.multiplyScalar(1 + dt * 1.2);
      t.m.position.y += t.vy * dt;
      if (t.life <= 0) {
        t.m.visible = false;
        this.trailPool.push(t.m);
        this.trails.splice(i, 1);
      }
    }
  }

  clear() {
    for (const [, r] of this.rockets) this.scene.remove(r.g);
    this.rockets.clear();
    for (const t of this.trails) this.scene.remove(t.m);
    this.trails.length = 0;
    for (const m of this.trailPool) this.scene.remove(m);
    this.trailPool.length = 0;
  }
}
