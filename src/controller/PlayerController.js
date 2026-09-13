import { EYE } from '../constants.js';
import { groundY, BOUNDS } from '../core/Level.js';

export function pushOut(pos, r, cols, who, feetY) {
  for (const b of cols) {
    if (b[who] !== true) continue;
    if (b.maxY < feetY + 0.15 || b.minY > feetY + 1.6) continue;
    const cx = Math.max(b.minX, Math.min(pos.x, b.maxX));
    const cz = Math.max(b.minZ, Math.min(pos.z, b.maxZ));
    const dx = pos.x - cx, dz = pos.z - cz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= r * r) continue;
    if (d2 < 1e-6) {
      const px = Math.min(pos.x - b.minX, b.maxX - pos.x);
      const pz = Math.min(pos.z - b.minZ, b.maxZ - pos.z);
      if (px < pz) {
        pos.x += pos.x < (b.minX + b.maxX) / 2 ? -(px + r) : px + r;
      } else {
        pos.z += pos.z < (b.minZ + b.maxZ) / 2 ? -(pz + r) : pz + r;
      }
    } else {
      const d = Math.sqrt(d2);
      pos.x = cx + (dx / d) * r;
      pos.z = cz + (dz / d) * r;
    }
  }
}

export class PlayerController {
  constructor(engine, state, collidables, bus) {
    this.engine = engine;
    this.state = state;
    this.cols = collidables;
    this.bus = bus;
    this.keys = {};
    this.recoilOff = 0;
    this.recoilVel = 0;
    this.stepT = 0;

    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyR') bus.emit('reloadRequest');
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('blur', () => { this.keys = {}; });
    window.addEventListener('mousemove', (e) => {
      if (!document.pointerLockElement || state.status !== 'playing') return;
      const p = state.player;
      p.yaw -= e.movementX * 0.0023;
      p.pitch = Math.max(-1.5, Math.min(1.5, p.pitch - e.movementY * 0.0023));
    });
    bus.on('playerHit', () => { this.recoilVel += 1.4; });
    bus.on('recoil', (d) => { this.recoilVel += d.pitch; });
  }

  update(dt) {
    if (this.state.status !== 'playing') return;
    const p = this.state.player;
    const k = this.keys;

    const ix = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);
    const iz = (k.KeyS ? 1 : 0) - (k.KeyW ? 1 : 0);
    let mx = 0, mz = 0;
    if (ix !== 0 || iz !== 0) {
      const cos = Math.cos(p.yaw), sin = Math.sin(p.yaw);
      mx = cos * ix + sin * iz;
      mz = -sin * ix + cos * iz;
      const l = Math.hypot(mx, mz);
      mx /= l; mz /= l;
    }
    const speed = 4.5;
    p.pos.x += mx * speed * dt;
    p.pos.z += mz * speed * dt;
    p.pos.x = Math.max(-BOUNDS.x, Math.min(BOUNDS.x, p.pos.x));
    p.pos.z = Math.max(-BOUNDS.z, Math.min(BOUNDS.z, p.pos.z));

    pushOut(p.pos, 0.32, this.cols, 'player', p.pos.y - EYE);
    p.pos.x = Math.max(-BOUNDS.x, Math.min(BOUNDS.x, p.pos.x));
    p.pos.z = Math.max(-BOUNDS.z, Math.min(BOUNDS.z, p.pos.z));

    // Vertical follows the level height field: fall by gravity, snap onto the
    // ground so the player climbs ramps and steps down ledges smoothly.
    const gy = groundY(p.pos.x, p.pos.z);
    p.velY = p.velY === undefined ? 0 : p.velY;
    p.velY -= 24 * dt;
    let feet = p.pos.y - EYE + p.velY * dt;
    if (feet <= gy) { feet = gy; p.velY = 0; }
    p.pos.y = feet + EYE;

    const moving = ix !== 0 || iz !== 0;
    p.speed += ((moving ? speed : 0) - p.speed) * Math.min(1, dt * 10);
    if (moving) {
      p.bobPhase += dt * 10;
      p.bobAmp += (1 - p.bobAmp) * Math.min(1, dt * 6);
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.bus.emit('step');
        this.stepT = 0.42;
      }
    } else {
      p.bobAmp += (0 - p.bobAmp) * Math.min(1, dt * 6);
    }

    p.damageFlash = Math.max(0, p.damageFlash - dt * 1.6);

    const k2 = 110, c2 = 13;
    this.recoilVel += (-k2 * this.recoilOff - c2 * this.recoilVel) * dt;
    this.recoilOff += this.recoilVel * dt;

    const cam = this.engine.camera;
    const bobY = Math.sin(p.bobPhase * 2) * 0.025 * p.bobAmp;
    const bobX = Math.sin(p.bobPhase) * 0.018 * p.bobAmp;
    cam.position.set(p.pos.x + bobX, p.pos.y + bobY, p.pos.z);
    cam.rotation.set(
      p.pitch + this.recoilOff,
      p.yaw,
      Math.sin(p.bobPhase) * 0.004 * p.bobAmp
    );
  }
}
