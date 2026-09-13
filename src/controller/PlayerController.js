const EYE = 1.65;
const STAIR_Z = 27;
const STAIR_HALF = 1.6;

function groundY(x, z) {
  const ax = Math.abs(x);
  if (ax <= 4) return 0;
  if (ax >= 6) return -1.2;
  if (Math.abs(Math.abs(z) - STAIR_Z) <= STAIR_HALF) return -((ax - 4) / 2) * 1.2;
  return -1.2;
}

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
    const speed = 4.3;
    p.pos.x += mx * speed * dt;
    p.pos.z += mz * speed * dt;
    p.pos.z = Math.max(-29, Math.min(29, p.pos.z));

    let feet = p.pos.y - EYE;
    const inStair = Math.abs(Math.abs(p.pos.z) - STAIR_Z) <= STAIR_HALF;
    const ax = Math.abs(p.pos.x);
    if (inStair) {
      p.pos.x = Math.max(-7.6, Math.min(7.6, p.pos.x));
    } else if (feet < -0.3) {
      if (ax < 4.2) p.pos.x = 4.2 * (p.pos.x < 0 ? -1 : 1);
      p.pos.x = Math.max(-7.6, Math.min(7.6, p.pos.x));
    } else {
      p.pos.x = Math.max(-3.7, Math.min(3.7, p.pos.x));
    }
    pushOut(p.pos, 0.32, this.cols, 'player', feet);

    const gy = groundY(p.pos.x, p.pos.z);
    p.velY -= 22 * dt;
    feet += p.velY * dt;
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
