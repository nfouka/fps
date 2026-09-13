import * as THREE from 'three';

export class Lighting {
  constructor(scene, renderer) {
    this.renderer = renderer;
    this.lights = [];

    this.amb = new THREE.AmbientLight(0x3a4452, 0.5);
    scene.add(this.amb);
    this.hemi = new THREE.HemisphereLight(0x556677, 0x120e0a, 0.35);
    scene.add(this.hemi);

    const stripGeo = new THREE.BoxGeometry(0.5, 0.06, 2.4);
    for (let z = -24; z <= 24; z += 6) {
      const l = new THREE.PointLight(0xffe6c0, 55, 17, 1.9);
      l.position.set(0, 4.6, z);
      scene.add(l);
      const stripMat = new THREE.MeshStandardMaterial({
        color: 0xfff6e8, emissive: 0xffe9c8, emissiveIntensity: 1.6
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 4.92, z);
      scene.add(strip);
      const flicker = z === -12 || z === 12;
      this.lights.push({ l, strip, base: 55, flicker, drop: 0, next: 0, curBase: 55 });
    }

    for (const sx of [1, -1]) {
      for (const ez of [1, -1]) {
        const l = new THREE.PointLight(0x7fa8ff, 14, 12, 2);
        l.position.set(6 * sx, 0.6, ez * 29);
        scene.add(l);
        this.lights.push({ l, strip: null, base: 14, flicker: false, curBase: 14 });
      }
    }

    this.setBrightness(0.6);
  }

  setBrightness(b) {
    const m = 0.15 + b * 1.7;
    this.amb.intensity = 0.5 * m;
    this.hemi.intensity = 0.35 * m;
    for (const o of this.lights) o.curBase = o.base * m;
    this.renderer.toneMappingExposure = 0.35 + b * 1.2;
  }

  update(dt, time) {
    for (const o of this.lights) {
      if (!o.flicker) {
        o.l.intensity = o.curBase;
        continue;
      }
      if (time > o.next) {
        if (o.drop > 0) {
          o.drop = 0;
        } else if (Math.random() < 0.12) {
          o.drop = 0.05 + Math.random() * 0.2;
        }
        o.next = time + 0.03 + Math.random() * 0.3;
      }
      if (o.drop > 0) {
        o.drop -= dt;
        o.l.intensity = o.curBase * 0.08;
        if (o.strip) o.strip.material.emissiveIntensity = 0.1;
      } else {
        const f = 0.9 + 0.1 * Math.sin(time * 47 + o.base);
        o.l.intensity = o.curBase * f;
        if (o.strip) o.strip.material.emissiveIntensity = 1.6 * f;
      }
    }
  }
}
