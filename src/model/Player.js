import { Weapon } from './Weapon.js';

export class Player {
  constructor() {
    this.maxHp = 100;
    this.hp = 100;
    this.pos = { x: 0, y: 1.65, z: 16 };
    this.velY = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.weapon = new Weapon();
    this.bobPhase = 0;
    this.bobAmp = 0;
    this.speed = 0;
    this.damageFlash = 0;
  }

  damage(n) {
    if (this.hp <= 0) return;
    this.hp = Math.max(0, this.hp - n);
    this.damageFlash = 1;
  }
}
