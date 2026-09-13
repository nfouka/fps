import { Enemy } from './Enemy.js';

export const TUNNELS = [
  { x: 6, z: 33 },
  { x: -6, z: 33 },
  { x: 6, z: -33 },
  { x: -6, z: -33 }
];

export class Spawner {
  constructor(state) {
    this.state = state;
    this.reset();
  }

  reset() {
    this.pending = 0;
    this.timer = 0;
    this.inter = 0;
    this.active = false;
  }

  startWave(n) {
    this.state.wave = n;
    this.pending = 4 + n * 2;
    this.timer = 0.6;
    this.active = true;
    this.inter = 0;
  }

  update(dt, st, bus) {
    if (!this.active) {
      if (this.inter > 0) {
        this.inter -= dt;
        if (this.inter <= 0) {
          const n = st.wave + 1;
          this.startWave(n);
          bus.emit('waveStart', n);
        }
      }
      return;
    }
    if (this.pending > 0) {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = Math.max(0.45, 1.3 - st.wave * 0.07);
        this.spawn(st, bus);
        this.pending--;
      }
    } else if (st.enemies.length === 0) {
      this.active = false;
      this.inter = 4;
      bus.emit('waveClear', st.wave);
    }
  }

  spawn(st, bus) {
    const t = TUNNELS[(Math.random() * TUNNELS.length) | 0];
    const hp = 60 + st.wave * 12;
    const speed = 1.5 + Math.min(1.4, st.wave * 0.12) + Math.random() * 0.3;
    const e = new Enemy(st.nextEnemyId++, {
      hp,
      speed,
      damage: 7 + st.wave
    });
    e.pos.x = t.x + (Math.random() * 2 - 1) * 0.8;
    e.pos.z = t.z + (Math.random() * 2 - 1) * 1.2;
    e.pos.y = -1.2;
    st.enemies.push(e);
    bus.emit('enemySpawned', e);
  }
}
