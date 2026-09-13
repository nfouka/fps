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
    this.pending = 10 + n * 5;
    this.timer = 0.4;
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
        this.timer = Math.max(0.18, 0.7 - st.wave * 0.03);
        this.spawn(st, bus);
        this.pending--;
      }
    } else if (st.enemies.length === 0) {
      this.active = false;
      this.inter = 2.2;
      bus.emit('waveClear', st.wave);
    }
  }

  spawn(st, bus) {
    const t = TUNNELS[(Math.random() * TUNNELS.length) | 0];
    const armed = Math.random() < Math.min(0.7, 0.25 + st.wave * 0.09);
    const hp = armed ? 52 + st.wave * 11 : 66 + st.wave * 13;
    const speed = 1.5 + Math.min(1.7, st.wave * 0.14) + Math.random() * 0.35;
    const e = new Enemy(st.nextEnemyId++, {
      hp,
      speed,
      damage: armed ? 5 + st.wave : 7 + st.wave,
      armed,
      fireRate: armed ? 1.1 + Math.random() * 0.7 : 0
    });
    e.pos.x = t.x + (Math.random() * 2 - 1) * 0.8;
    e.pos.z = t.z + (Math.random() * 2 - 1) * 1.2;
    e.pos.y = -1.2;
    st.enemies.push(e);
    bus.emit('enemySpawned', e);
  }
}
