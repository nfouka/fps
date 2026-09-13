import { Spawner } from '../model/Spawner.js';
import { pushOut } from './PlayerController.js';

const EDGE = 4.05;
const SZ = 27;
const SH = 1.6;
const EYE = 1.65;

export class EnemyController {
  constructor(state, bus, collidables) {
    this.state = state;
    this.bus = bus;
    this.cols = collidables;
    this.spawner = new Spawner(state);
    this.growlT = 2;

    bus.on('startGame', () => {
      this.spawner.reset();
      this.spawner.startWave(1);
      this.bus.emit('waveStart', 1);
    });
  }

  update(dt, time) {
    const st = this.state;
    if (st.status !== 'playing') return;
    this.spawner.update(dt, st, this.bus);

    const p = st.player.pos;

    for (let i = st.enemies.length - 1; i >= 0; i--) {
      const e = st.enemies[i];
      e.hitFlash = Math.max(0, e.hitFlash - dt * 4);

      if (e.state === 'dying') {
        e.stateT += dt;
        if (e.stateT > 1.1) st.enemies.splice(i, 1);
        continue;
      }
      if (e.state === 'spawn') {
        e.stateT += dt;
        e.spawnAlpha = Math.min(1, e.stateT / 0.6);
        if (e.stateT >= 0.6) e.state = 'chase';
        continue;
      }

      if (e.state === 'attack') {
        e.atkT += dt;
        const dx0 = p.x - e.pos.x, dz0 = p.z - e.pos.z;
        const d0 = Math.hypot(dx0, dz0);
        e.yaw = Math.atan2(dx0, dz0);
        if (!e.atkHit && e.atkT > 0.45) {
          e.atkHit = true;
          st.player.damage(e.dmg);
          this.bus.emit('playerHit', { dmg: e.dmg });
        }
        if (e.atkT > 1.0 || d0 > 2.2) {
          e.state = 'chase';
          e.atkT = 0;
          e.atkHit = false;
        }
        continue;
      }

      const ax = Math.abs(e.pos.x);
      const onTrack = ax > EDGE;
      const pFeet = p.y - EYE;
      const playerOnTrack = pFeet < -0.6;
      let tx, tz;
      if (onTrack && !playerOnTrack) {
        const sx = Math.sign(e.pos.x);
        const sz = e.pos.z >= 0 ? SZ : -SZ;
        if (Math.abs(e.pos.z - sz) < SH) {
          tx = 3.6 * sx;
          tz = e.pos.z;
        } else {
          tx = 5.2 * sx;
          tz = sz;
        }
      } else {
        tx = p.x;
        tz = p.z;
      }

      let dx = tx - e.pos.x, dz = tz - e.pos.z;
      const dl = Math.hypot(dx, dz) || 1;
      let vx = (dx / dl) * e.speed;
      let vz = (dz / dl) * e.speed;

      for (const o of st.enemies) {
        if (o === e || o.state === 'dying' || o.state === 'spawn') continue;
        const ox = e.pos.x - o.pos.x, oz = e.pos.z - o.pos.z;
        const d2 = ox * ox + oz * oz;
        if (d2 > 0.0001 && d2 < 0.36) {
          const d = Math.sqrt(d2);
          vx += (ox / d) * 1.2;
          vz += (oz / d) * 1.2;
        }
      }

      e.pos.x += vx * dt;
      e.pos.z += vz * dt;

      const ax2 = Math.abs(e.pos.x);
      const sz2 = e.pos.z >= 0 ? SZ : -SZ;
      const inStair = Math.abs(e.pos.z - sz2) < SH + 0.35;
      if (ax2 <= 3.95) {
        e.pos.y = 0;
      } else if (ax2 >= 6.0) {
        e.pos.y = -1.2;
      } else if (inStair) {
        e.pos.y = -1.2 * ((ax2 - 3.95) / 2.05);
      } else {
        e.pos.x = EDGE * Math.sign(e.pos.x);
        e.pos.y = -1.2;
      }

      e.pos.x = Math.max(-7.5, Math.min(7.5, e.pos.x));
      e.pos.z = Math.max(-33.5, Math.min(33.5, e.pos.z));
      pushOut(e.pos, 0.3, this.cols, 'enemy', e.pos.y);

      e.walkPhase += dt * e.speed * 2.4;

      if (onTrack) {
        e.yaw = Math.atan2(vx, vz);
      } else {
        e.yaw = Math.atan2(p.x - e.pos.x, p.z - e.pos.z);
      }

      const pdx = p.x - e.pos.x, pdz = p.z - e.pos.z;
      const dist = Math.hypot(pdx, pdz);
      if (dist < 1.55 && Math.abs(pFeet - e.pos.y) < 1.0) {
        e.state = 'attack';
        e.atkT = 0;
        e.atkHit = false;
      }
    }

    this.growlT -= dt;
    if (this.growlT <= 0) {
      let near = false;
      for (const e of st.enemies) {
        if (e.state !== 'chase') continue;
        const dx = e.pos.x - p.x, dz = e.pos.z - p.z;
        if (dx * dx + dz * dz < 324) { near = true; break; }
      }
      if (near && Math.random() < 0.7) {
        this.bus.emit('growl', { pitch: 0.8 + Math.random() * 0.5 });
      }
      this.growlT = 1.5 + Math.random() * 2.5;
    }

    if (st.player.hp <= 0 && st.status === 'playing') {
      st.status = 'gameover';
      this.bus.emit('gameover');
    }
  }
}
