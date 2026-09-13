export class Weapon {
  constructor() {
    this.name = 'Carabine 1911';
    this.fireInterval = 0.11;
    this.damage = 34;
    this.headshotMult = 2.2;
    this.magSize = 30;
    this.ammo = 30;
    this.reserve = 150;
    this.reloadTime = 2.2;
    this.reloadEnd = -1;
    this.nextFireAt = 0;
  }

  get reloading() {
    return this.reloadEnd >= 0;
  }

  canFire(now) {
    return !this.reloading && this.ammo > 0 && now >= this.nextFireAt;
  }

  fire(now) {
    if (!this.canFire(now)) return false;
    this.ammo--;
    this.nextFireAt = now + this.fireInterval;
    return true;
  }

  startReload(now) {
    if (this.reloading || this.ammo === this.magSize || this.reserve <= 0) return false;
    this.reloadEnd = now + this.reloadTime;
    return true;
  }

  finishReload(now) {
    if (this.reloadEnd >= 0 && now >= this.reloadEnd) {
      const need = this.magSize - this.ammo;
      const take = Math.min(need, this.reserve);
      this.ammo += take;
      this.reserve -= take;
      this.reloadEnd = -1;
      return true;
    }
    return false;
  }
}
