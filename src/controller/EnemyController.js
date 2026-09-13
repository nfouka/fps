import { Spawner } from '../model/Spawner.js';
import { groundY, BOUNDS } from '../core/Level.js';
import { pushOut } from './PlayerController.js';

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

      // --- ranged (armed) zombies: keep distance and shoot ---
      if (e.armed) {
        e.atkT += dt;
        const dx0 = p.x - e.pos.x, dz0 = p.z - e.pos.z;
        const d0 = Math.hypot(dx0, dz0);
        e.yaw = Math.atan2(dx0, dz0);
        if (d0 > 2.5) {
          // advance toward the player without charging into melee
          const tx = p.x, tz = p.z;
          const ddx = tx - e.pos.x, ddz = tz - e.pos.z;
          const dl = Math.hypot(ddx, ddz) || 1;
          e.pos.x += (ddx / dl) * e.speed * 0.85 * dt;
          e.pos.z += (ddz / dl) * e.speed * 0.85 * dt;
        }
        if (!e.atkHit && e.atkT > e.fireRate) {
          e.atkHit = true;
          e.atkT = 0;
          if (d0 < 30) {
            st.player.damage(e.dmg);
            this.bus.emit('playerHit', { dmg: e.dmg, from: e });
            this.bus.emit('enemyShot', {
              a: { x: e.pos.x, y: e.pos.y + 1.1, z: e.pos.z },
              b: { x: p.x, y: p.y, z: p.z }
            });
            this.bus.emit('enemyFlash', { x: e.pos.x, y: e.pos.y + 1.1, z: e.pos.z - 0.35 });
          }
        }
        continue;
      }

      // --- melee zombies: chase and bite when glued ---
      if (e.state === 'attack') {
        e.atkT += dt;
        const dx0 = p.x - e.pos.x, dz0 = p.z - e.pos.z;
        const d0 = Math.hypot(dx0, dz0);
        e.yaw = Math.atan2(dx0, dz0);
        if (!e.atkHit && e.atkT > 0.38) {
          e.atkHit = true;
          st.player.damage(e.dmg);
          this.bus.emit('playerHit', { dmg: e.dmg });
        }
        if (e.atkT > 0.85 || d0 > 2.4) {
          e.state = 'chase';
          e.atkT = 0;
          e.atkHit = false;
        }
        continue;
      }

      // --- chase ---
      const tx = p.x, tz = p.z;
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
      e.pos.x = Math.max(-BOUNDS.x, Math.min(BOUNDS.x, e.pos.x));
      e.pos.z = Math.max(-BOUNDS.z, Math.min(BOUNDS.z, e.pos.z));

      // Follow the level height field so enemies climb ramps and drop to the
      // tracks exactly like the player — they can follow you up and down.
      e.pos.y = groundY(e.pos.x, e.pos.z);

      pushOut(e.pos, 0.3, this.cols, 'enemy', e.pos.y);
      e.pos.x = Math.max(-BOUNDS.x, Math.min(BOUNDS.x, e.pos.x));
      e.pos.z = Math.max(-BOUNDS.z, Math.min(BOUNDS.z, e.pos.z));

      e.walkPhase += dt * e.speed * 2.4;
      e.yaw = Math.atan2(vx, vz);

      // Attack as soon as the zombie is glued to the player, regardless of the
      // small height difference on the ramps — it always threatens when close.
      const pdx = p.x - e.pos.x, pdz = p.z - e.pos.z;
      const dist = Math.hypot(pdx, pdz);
      if (dist < 1.5) {
        e.state = 'attack';
        e.atkT = 0;
        e.atkHit = false;
      }
    }

    // --- projectiles (bazooka rockets): physics + AoE ---
    const PROJ_SPEED = 32;
    const inBox = (px, py, pz, b) =>
      px >= b.minX && px <= b.maxX && py >= b.minY && py <= b.maxY && pz >= b.minZ && pz <= b.maxZ;
    for (let i = this.state.projectiles.length - 1; i >= 0; i--) {
      const pr = this.state.projectiles[i];
      pr.life -= dt;
      pr.x += pr.dx * PROJ_SPEED * dt;
      pr.y += pr.dy * PROJ_SPEED * dt;
      pr.z += pr.dz * PROJ_SPEED * dt;
      let exploded = pr.life <= 0;
      if (!exploded) {
        for (const e of st.enemies) {
          if (e.state === 'dying' || e.state === 'spawn') continue;
          if (Math.hypot(e.pos.x - pr.x, e.pos.z - pr.z) < 1.3 && Math.abs(e.pos.y + 1 - pr.y) < 1.5) { exploded = true; break; }
        }
      }
      if (!exploded) {
        for (const b of this.cols) {
          if (inBox(pr.x, pr.y, pr.z, b)) { exploded = true; break; }
        }
      }
      if (exploded) {
        if (pr.napalm) {
          const gy = groundY(pr.x, pr.z);
          this.state.firePools.push({
            x: pr.x, y: Math.max(pr.y, gy + 0.06), z: pr.z,
            radius: pr.radius, life: pr.poolLife, max: pr.poolLife,
            dmgPerSec: pr.dmgPerSec, tick: 0
          });
          this.bus.emit('napalmImpact', { x: pr.x, y: pr.y, z: pr.z });
        } else {
          for (const e of st.enemies) {
            if (e.state === 'dying' || e.state === 'spawn') continue;
            const d = Math.hypot(e.pos.x - pr.x, e.pos.z - pr.z, e.pos.y + 1 - pr.y);
            if (d < pr.radius) e.damage(pr.dmg * (1 - d / pr.radius * 0.5));
          }
          this.bus.emit('explosion', { x: pr.x, y: pr.y, z: pr.z, r: pr.radius });
        }
        this.state.projectiles.splice(i, 1);
      }
    }

    // --- fire pools (napalm) : flammes persistantes, dégâts dans le temps ---
    for (let i = st.firePools.length - 1; i >= 0; i--) {
      const fp = st.firePools[i];
      fp.life -= dt;
      fp.tick -= dt;
      if (fp.life <= 0) { st.firePools.splice(i, 1); continue; }
      if (fp.tick <= 0) {
        fp.tick = 0.25;
        for (const e of st.enemies) {
          if (e.state === 'dying' || e.state === 'spawn') continue;
          if (Math.hypot(e.pos.x - fp.x, e.pos.z - fp.z) < fp.radius) {
            e.damage(fp.dmgPerSec * 0.25);
          }
        }
      }
    }

    this.growlT -= dt;
    if (this.growlT <= 0) {
      let near = false;
      for (const e of st.enemies) {
        if (e.state !== 'chase' && e.state !== 'attack') continue;
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
