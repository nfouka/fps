import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Pass d'étirage cinématique : contraste, saturation, teinte orange/teal,
// vignette et grain de film subtils pour un rendu moderne et élégant.
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uVignette: { value: 0.26 },
    uGrain: { value: 0.032 },
    uContrast: { value: 1.09 },
    uSaturation: { value: 1.13 },
    uWarmth: { value: 0.05 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    precision highp float;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uContrast;
    uniform float uSaturation;
    uniform float uWarmth;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }
    float lum(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }

    void main() {
      vec3 c = texture2D(tDiffuse, vUv).rgb;

      // contraste doux centré sur le gris
      c = (c - 0.5) * uContrast + 0.5;

      // saturation
      c = mix(vec3(lum(c)), c, clamp(uSaturation, 0.0, 2.0));

      // teinte cinématique : reflets chauds, ombres frais (teal)
      c.r += uWarmth * 0.55;
      c.b -= uWarmth * 0.3;
      float sh = clamp(1.0 - lum(c), 0.0, 1.0);
      c += vec3(-0.012, 0.0, 0.022) * sh * sh;

      // vignette douce
      vec2 q = vUv - 0.5;
      float v = clamp(1.0 - dot(q, q) * uVignette * 1.7, 0.0, 1.0);
      c *= mix(0.5, 1.0, v);

      // grain de film
      float g = (hash(vUv * 900.0 + uTime) - 0.5) * uGrain;
      c += g;

      gl_FragColor = vec4(c, 1.0);
    }
  `
};

export class PostProc {
  constructor(renderer, scene, camera, width, height) {
    this.composer = new EffectComposer(renderer);
    this.composer.addPass(new RenderPass(scene, camera));

    this.bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height), 0.42, 0.7, 0.82
    );
    this.composer.addPass(this.bloom);

    this.grade = new ShaderPass(GradeShader);
    this.grade.renderToScreen = true;
    this.composer.addPass(this.grade);

    this.time = 0;
  }

  resize(w, h) {
    this.composer.resize(w, h);
    this.bloom.setSize(w, h);
  }

  update(dt) {
    this.time += dt;
    this.grade.uniforms.uTime.value = this.time;
  }

  render() {
    this.composer.render();
  }
}
