import * as THREE from 'three';

export class Lighting {
  constructor(scene, renderer) {
    this.renderer = renderer;
    this.lights = [];

    // éclairage "journée" : ambiance daylight douce + soleil directionnel
    this.amb = new THREE.AmbientLight(0xc8d8e6, 0.45);
    scene.add(this.amb);
    this.hemi = new THREE.HemisphereLight(0xe4effa, 0xb0bcc6, 0.4);
    scene.add(this.hemi);
    this.sun = new THREE.DirectionalLight(0xf4f8ff, 0.8);
    this.sun.position.set(6, 9, 8);
    scene.add(this.sun);

    const stripGeo = new THREE.BoxGeometry(0.5, 0.06, 2.4);
    for (let z = -24; z <= 24; z += 6) {
      const l = new THREE.PointLight(0xffe6c0, 14, 17, 1.9);
      l.position.set(0, 4.6, z);
      scene.add(l);
      const stripMat = new THREE.MeshStandardMaterial({
        color: 0xfff6e8, emissive: 0xffe9c8, emissiveIntensity: 0.5
      });
      const strip = new THREE.Mesh(stripGeo, stripMat);
      strip.position.set(0, 4.92, z);
      scene.add(strip);
      const flicker = false;
      this.lights.push({ l, strip, base: 24, flicker, drop: 0, next: 0, curBase: 24 });
    }

    for (const sx of [1, -1]) {
      for (const ez of [1, -1]) {
        const l = new THREE.PointLight(0xcfe4ff, 7, 12, 2);
        l.position.set(6 * sx, 0.6, ez * 29);
        scene.add(l);
        this.lights.push({ l, strip: null, base: 7, flicker: false, curBase: 7 });
      }
    }

    this.setBrightness(0.6);
  }

  setBrightness(b) {
    const m = 0.15 + b * 1.7;
    this.amb.intensity = 0.45 * m;
    this.hemi.intensity = 0.4 * m;
    this.sun.intensity = 0.8 * m;
    for (const o of this.lights) o.curBase = o.base * m;
    this.renderer.toneMappingExposure = 0.22 + b * 0.6;
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
