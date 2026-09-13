import { WeaponState, LOADOUT, WEAPONS } from './Weapon.js';

export class Player {
  constructor() {
    this.maxHp = 100;
    this.hp = 100;
    this.pos = { x: 0, y: 1.65, z: 16 };
    this.velY = 0;
    this.yaw = 0;
    this.pitch = 0;
    this.weapons = LOADOUT.map((id) => new WeaponState(WEAPONS[id]));
    this.weaponIndex = 0;
    this.bobPhase = 0;
    this.bobAmp = 0;
    this.speed = 0;
    this.damageFlash = 0;
    this.zoom = 0; // 0..1 zoom amount for the scope
  }

  get weapon() { return this.weapons[this.weaponIndex]; }

  damage(n) {
    this.hp = Math.max(0, this.hp - n);
    this.damageFlash = 1;
  }

  nextWeapon() {
    this.weaponIndex = (this.weaponIndex + 1) % this.weapons.length;
  }

  prevWeapon() {
    this.weaponIndex = (this.weaponIndex + this.weapons.length - 1) % this.weapons.length;
  }
}
