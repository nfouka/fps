// Weapon definitions (stats) + per-weapon inventory state.
export const WEAPONS = {
  carbine: {
    id: 'carbine', name: 'Carabine 1911', kind: 'rifle',
    fireInterval: 0.09, damage: 30, headshotMult: 2.2,
    magSize: 30, reserve: 150, reloadTime: 1.9,
    auto: true, spread: 0.032, recoil: 1.0, zoomFov: 40,
    model: 'rifle'
  },
  m16: {
    id: 'm16', name: 'M16', kind: 'rifle',
    fireInterval: 0.072, damage: 24, headshotMult: 2.0,
    magSize: 30, reserve: 240, reloadTime: 1.85,
    auto: true, spread: 0.046, recoil: 1.15, zoomFov: 42,
    model: 'rifle'
  },
  bazooka: {
    id: 'bazooka', name: 'Bazooka', kind: 'rocket',
    fireInterval: 1.5, damage: 130, headshotMult: 1.0,
    magSize: 4, reserve: 24, reloadTime: 3.3,
    auto: false, spread: 0.0, recoil: 3.4, zoomFov: 36, aoeradius: 3.4,
    model: 'bazooka'
  },
  napalm: {
    id: 'napalm', name: 'Napalm', kind: 'napalm',
    fireInterval: 0.45, damage: 0, headshotMult: 1.0,
    magSize: 16, reserve: 48, reloadTime: 2.7,
    auto: true, spread: 0.07, recoil: 0.75, zoomFov: 56,
    model: 'napalm', poolRadius: 2.7, poolLife: 3.4, dmgPerSec: 44
  },
  mg: {
    id: 'mg', name: 'Minigun M134', kind: 'rifle',
    fireInterval: 0.028, damage: 14, headshotMult: 1.4,
    magSize: 1000, reserve: 1000, reloadTime: 3.2,
    auto: true, spread: 0.06, recoil: 1.9, zoomFov: 52,
    model: 'mg'
  }
};

export const LOADOUT = ['carbine', 'm16', 'bazooka', 'napalm', 'mg'];

export class WeaponState {
  constructor(def) {
    this.def = def;
    this.name = def.name;
    this.ammo = def.magSize;
    this.reserve = def.reserve;
    this.reloadTime = def.reloadTime;
    this.reloadEnd = -1;
    this.nextFireAt = 0;
  }

  get reloading() { return this.reloadEnd >= 0; }

  canFire(now) {
    return !this.reloading && this.ammo > 0 && now >= this.nextFireAt;
  }

  fire(now) {
    if (!this.canFire(now)) return false;
    this.ammo--;
    this.nextFireAt = now + this.def.fireInterval;
    return true;
  }

  startReload(now) {
    if (this.reloading || this.ammo === this.def.magSize || this.reserve <= 0) return false;
    this.reloadEnd = now + this.def.reloadTime;
    return true;
  }

  finishReload(now) {
    if (this.reloadEnd >= 0 && now >= this.reloadEnd) {
      const need = this.def.magSize - this.ammo;
      const take = Math.min(need, this.reserve);
      this.ammo += take;
      this.reserve -= take;
      this.reloadEnd = -1;
      return true;
    }
    return false;
  }
}
