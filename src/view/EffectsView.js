import * as THREE from 'three';
import * as P from '../core/Procedural.js';

const R = (a, b) => a + Math.random() * (b - a);

export class EffectsView {
  constructor(scene) {
    this.scene = scene;

    const decalTex = P.decalTexture();
    const decalGeo = new THREE.CircleGeometry(0.055, 10);
    this.decals = [];
    for (let i = 0; i < 70; i++) {
      const mat = new THREE.MeshBasicMaterial({
        map: decalTex, transparent: true, depthWrite: false, opacity: 1
      });
      const m = new THREE.Mesh(decalGeo, mat);
      m.visible = false;
      scene.add(m);
      this.decals.push({ m, life: 0 });
    }
    this.decalIdx = 0;

    this.tracers = [];
    for (let i = 0; i < 24; i++) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const mat = new THREE.LineBasicMaterial({
        color: 0xffd9a0, transparent: true, opacity: 1,
        blending: THREE.AdditiveBlending, depthWrite: false
      });
      const line = new THREE.Line(geo, mat);
      line.frustumCulled = false;
      line.visible = false;
      scene.add(line);
      this.tracers.push({ line, life: 0 });
    }

    this.bloodMax = 500;
    this.bloodPos = new Float32Array(this.bloodMax * 3);
    this.bloodCol = new Float32Array(this.bloodMax * 3);
    const bgeo = new THREE.BufferGeometry();
    bgeo.setAttribute('position', new THREE.BufferAttribute(this.bloodPos, 3));
    bgeo.setAttribute('color', new THREE.BufferAttribute(this.bloodCol, 3));
    bgeo.setDrawRange(0, 0);
    const bmat = new THREE.PointsMaterial({
      size: 0.07, vertexColors: true, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true
    });
    this.bloodPoints = new THREE.Points(bgeo, bmat);
    this.bloodPoints.frustumCulled = false;
    scene.add(this.bloodPoints);
    this.bloods = [];

    // --- explosions (bazooka) ---
    this.explTex = new THREE.SpriteMaterial({
      map: P.burstTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffb066
    });
    this.explosions = [];
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Sprite(this.explTex);
      s.visible = false;
      s.renderOrder = -1;
      scene.add(s);
      this.explosions.push({ s, life: 0 });
    }

    // --- flammes napalm au sol ---
    this.napalmTex = new THREE.SpriteMaterial({
      map: P.burstTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xff5a1a
    });
    this.napalmPools = [];
    for (let i = 0; i < 12; i++) {
      const s = new THREE.Sprite(this.napalmTex);
      s.visible = false;
      s.renderOrder = -1;
      scene.add(s);
      this.napalmPools.push({ s, life: 0 });
    }
    this.napalmT = 0;

    // --- muzzle flashes ---
    this.flashTex = new THREE.SpriteMaterial({
      map: P.burstTexture(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      color: 0xffd080
    });
    this.flashes = [];
    for (let i = 0; i < 16; i++) {
      const s = new THREE.Sprite(this.flashTex);
      s.visible = false;
      s.renderOrder = 1;
      scene.add(s);
      this.flashes.push({ s, life: 0 });
    }
  }

  muzzleFlash(x, y, z) {
    const f = this.flashes.find((f) => f.life <= 0);
    if (!f) return;
    f.s.position.set(x, y, z);
    f.s.material.opacity = 1;
    f.s.material.color.setHex(0xffd080);
    f.s.scale.set(0.9, 0.9, 1);
    f.s.rotation.x = Math.random() * Math.PI;
    f.s.rotation.y = Math.random() * Math.PI;
    f.life = 0.06;
    f.s.visible = true;
  }

  explosion(x, y, z, r) {
    const e = this.explosions.find((e) => e.life <= 0);
    if (!e) return;
    e.s.position.set(x, y, z);
    e.s.material.opacity = 1;
    e.s.material.color.setHex(0xffc47a);
    e.radius = r;
    e.maxLife = 0.32;
    e.life = 0.32;
    e.s.visible = true;
  }

  napalmPool(x, y, z, r) {
    const p = this.napalmPools.find((p) => p.life <= 0);
    if (!p) return;
    p.s.position.set(x, y + 0.22, z);
    p.s.material.opacity = 1;
    p.s.material.color.setHex(0xff5a1a);
    p.radius = r;
    p.maxLife = 0.35;
    p.life = 0.35;
    p.s.visible = true;
  }

  impact(pos, normal) {
    const d = this.decals[this.decalIdx];
    this.decalIdx = (this.decalIdx + 1) % this.decals.length;
    d.m.visible = true;
    d.m.position.set(
      pos.x + normal[0] * 0.012,
      pos.y + normal[1] * 0.012,
      pos.z + normal[2] * 0.012
    );
    d.m.lookAt(pos.x + normal[0], pos.y + normal[1], pos.z + normal[2]);
    d.m.rotation.z = Math.random() * Math.PI * 2;
    d.m.material.opacity = 1;
    d.life = 18;
  }

  tracer(a, b) {
    for (const t of this.tracers) {
      if (t.life <= 0) {
        const arr = t.line.geometry.attributes.position.array;
        arr[0] = a.x; arr[1] = a.y; arr[2] = a.z;
        arr[3] = b.x; arr[4] = b.y; arr[5] = b.z;
        t.line.geometry.attributes.position.needsUpdate = true;
        t.line.material.opacity = 1;
        t.line.visible = true;
        t.life = 0.07;
        return;
      }
    }
  }

  blood(pos) {
    for (let i = 0; i < 14; i++) {
      if (this.bloods.length >= this.bloodMax) break;
      this.bloods.push({
        x: pos.x, y: pos.y, z: pos.z,
        vx: R(-1.2, 1.2), vy: R(0.4, 2.2), vz: R(-1.2, 1.2),
        life: 0.45 + Math.random() * 0.4,
        max: 0.85
      });
    }
  }

  update(dt, firePools) {
    for (const t of this.tracers) {
      if (t.life > 0) {
        t.life -= dt;
        t.line.material.opacity = Math.max(0, t.life / 0.07);
        if (t.life <= 0) t.line.visible = false;
      }
    }

    for (const e of this.explosions) {
      if (e.life > 0) {
        e.life -= dt;
        const k = Math.max(0, e.life / e.maxLife);
        e.s.material.opacity = k;
        const sc = e.radius * 4.2 * (0.5 + (1 - k) * 2.2);
        e.s.scale.set(sc, sc, 1);
        if (e.life <= 0) e.s.visible = false;
      }
    }

    for (const f of this.flashes) {
      if (f.life > 0) {
        f.life -= dt;
        f.s.material.opacity = Math.max(0, f.life / 0.06);
        const sc = 0.9 * (1 + (1 - f.life / 0.06) * 1.5);
        f.s.scale.set(sc, sc, 1);
        if (f.life <= 0) f.s.visible = false;
      }
    }

    // flammes napalm : rafraîchissement continu tant que la flamme existe
    this.napalmT += dt;
    if (firePools && firePools.length) {
      for (const fp of firePools) {
        const flick = 0.55 + 0.45 * Math.sin(this.napalmT * 18 + fp.x * 3);
        const sc = fp.radius * (2.4 + Math.sin(this.napalmT * 9 + fp.z) * 0.25);
        const p = this.napalmPools.find((p) => p.s.visible);
        if (p) {
          p.s.position.set(fp.x, fp.y, fp.z);
          p.s.material.opacity = flick;
          p.s.material.color.setRGB(1, 0.35 + 0.2 * flick, 0.05);
          p.s.scale.set(sc, sc * 0.55, 1);
        }
      }
    }

    for (const d of this.decals) {
      if (d.life > 0) {
        d.life -= dt;
        if (d.life < 3) d.m.material.opacity = Math.max(0, d.life / 3);
        if (d.life <= 0) d.m.visible = false;
      }
    }

    let n = 0;
    for (let i = this.bloods.length - 1; i >= 0; i--) {
      const p = this.bloods[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.bloods[i] = this.bloods[this.bloods.length - 1];
        this.bloods.pop();
        continue;
      }
      p.vy -= 9.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      const floorY = Math.abs(p.x) < 4 ? 0.02 : -1.18;
      if (p.y < floorY) {
        p.y = floorY;
        p.vy = 0;
        p.vx *= 0.6;
        p.vz *= 0.6;
      }
      this.bloodPos[n * 3] = p.x;
      this.bloodPos[n * 3 + 1] = p.y;
      this.bloodPos[n * 3 + 2] = p.z;
      const f = Math.max(0, p.life / p.max);
      this.bloodCol[n * 3] = 0.8 * f;
      this.bloodCol[n * 3 + 1] = 0.05 * f;
      this.bloodCol[n * 3 + 2] = 0.05 * f;
      n++;
    }
    this.bloodPoints.geometry.setDrawRange(0, n);
    this.bloodPoints.geometry.attributes.position.needsUpdate = true;
    this.bloodPoints.geometry.attributes.color.needsUpdate = true;
  }

  clear() {
    for (const t of this.tracers) { t.life = 0; t.line.visible = false; }
    for (const d of this.decals) { d.life = 0; d.m.visible = false; }
    for (const p of this.napalmPools) p.s.visible = false;
    this.bloods.length = 0;
    this.bloodPoints.geometry.setDrawRange(0, 0);
  }
}
