export class Enemy {
  constructor(id, opts) {
    this.id = id;
    this.maxHp = opts.hp;
    this.hp = opts.hp;
    this.speed = opts.speed;
    this.dmg = opts.damage;
    this.pos = { x: 0, y: -1.2, z: 0 };
    this.yaw = 0;
    this.state = 'spawn';
    this.stateT = 0;
    this.spawnAlpha = 0;
    this.hitFlash = 0;
    this.walkPhase = Math.random() * Math.PI * 2;
    this.atkT = 0;
    this.atkHit = false;
  }

  damage(n) {
    if (this.state === 'dying' || this.state === 'dead') return false;
    this.hp -= n;
    this.hitFlash = 1;
    if (this.hp <= 0) {
      this.state = 'dying';
      this.stateT = 0;
      this.atkT = 0;
      return true;
    }
    return false;
  }
}

export function raySphere(ox, oy, oz, dx, dy, dz, cx, cy, cz, r) {
  const ex = cx - ox, ey = cy - oy, ez = cz - oz;
  const b = ex * dx + ey * dy + ez * dz;
  const c = ex * ex + ey * ey + ez * ez - r * r;
  if (c > 0 && b < 0) return -1;
  const disc = b * b - c;
  if (disc < 0) return -1;
  const t = b - Math.sqrt(disc);
  return t >= 0 ? t : -1;
}
