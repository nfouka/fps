import * as THREE from 'three';
import { raySphere } from '../model/Enemy.js';
import { WEAPONS } from '../model/Weapon.js';

function rayAABB(ox, oy, oz, dx, dy, dz, b) {
  let tmin = -1e9, tmax = 1e9;
  let axis = 0, sign = 1;
  const test = (oa, da, min, max, ax) => {
    if (Math.abs(da) < 1e-9) {
      return oa >= min && oa <= max;
    }
    let t1 = (min - oa) / da;
    let t2 = (max - oa) / da;
    let s = -1;
    if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp; s = 1; }
    if (t1 > tmin) { tmin = t1; axis = ax; sign = s; }
    if (t2 < tmax) tmax = t2;
    return tmin <= tmax;
  };
  if (!test(ox, dx, b.minX, b.maxX, 0)) return null;
  if (!test(oy, dy, b.minY, b.maxY, 1)) return null;
  if (!test(oz, dz, b.minZ, b.maxZ, 2)) return null;
  if (tmin < 0.01) return null;
  const n = [0, 0, 0];
  n[axis] = sign;
  return { t: tmin, n };
}

export class WeaponController {
  constructor(engine, state, bus, rig, collidables) {
    this.engine = engine;
    this.state = state;
    this.bus = bus;
    this.rig = rig;
    this.cols = collidables;
    this.firing = false;
    this.bloom = 0;
    this.time = 0;
    this.zoomTarget = 0;
    this.aiming = false;

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0 && this.state.status === 'playing' && document.pointerLockElement) {
        this.firing = true;
      } else if ((e.button === 1 || e.button === 2) && this.state.status === 'playing') {
        this.aiming = true;
        this.zoomTarget = 1;
      }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.firing = false;
      if (e.button === 1 || e.button === 2) { this.aiming = false; this.zoomTarget = 0; }
    });
    window.addEventListener('contextmenu', (e) => { if (document.pointerLockElement) e.preventDefault(); });
    window.addEventListener('blur', () => { this.firing = false; this.aiming = false; this.zoomTarget = 0; });

    window.addEventListener('wheel', (e) => {
      if (this.state.status !== 'playing' || !document.pointerLockElement) return;
      const w = this.state.player;
      if (e.deltaY > 0) w.nextWeapon(); else w.prevWeapon();
      this.bus.emit('weaponSwitch');
    }, { passive: true });

    bus.on('reloadRequest', () => {
      if (this.state.status !== 'playing') return;
      if (this.state.player.weapon.startReload(this.time)) {
        this.bus.emit('reloadStart');
      }
    });
  }

  update(dt, time) {
    this.time = time;
    const w = this.state.player.weapon;
    if (w.finishReload(time)) {
      this.bus.emit('reloadEnd');
    }

    // zoom in / out
    const p = this.state.player;
    p.zoom += (this.zoomTarget - p.zoom) * Math.min(1, dt * 12);

    if (this.state.status !== 'playing') return;

    // adjust camera FOV for the scope
    const cam = this.engine.camera;
    const targetFov = 74 + (WEAPONS[w.def.id].zoomFov - 74) * p.zoom;
    cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 14);
    cam.updateProjectionMatrix();

    if (this.firing && w.canFire(time)) this.shoot(time);
    this.bloom = Math.max(0, this.bloom - dt * 0.02);
    this.rig.mgFiring = this.firing;
  }

  shoot(time) {
    const w = this.state.player.weapon;
    const p = this.state.player;
    const cam = this.engine.camera;
    if (!w.fire(time)) return;
    cam.updateMatrixWorld();

    this.bus.emit('shot');
    this.rig.kick();
    this.bus.emit('recoil', { pitch: 0.5 + (w.def.recoil - 1) * 0.4 });

    if (w.def.kind === 'rocket') { this.launchRocket(time); return; }
    if (w.def.kind === 'napalm') { this.launchNapalm(time); return; }

    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const spread = w.def.spread * (1 - 0.8 * p.zoom) + this.bloom + p.speed * 0.004;
    this.bloom = Math.min(0.03, this.bloom + 0.004);
    dir.x += (Math.random() * 2 - 1) * spread;
    dir.y += (Math.random() * 2 - 1) * spread;
    dir.z += (Math.random() * 2 - 1) * spread;
    dir.normalize();

    const ox = cam.position.x, oy = cam.position.y, oz = cam.position.z;

    let best = null, bestT = Infinity;
    for (const e of this.state.enemies) {
      if (e.state === 'dying' || e.state === 'dead') continue;
      const th = raySphere(ox, oy, oz, dir.x, dir.y, dir.z, e.pos.x, e.pos.y + 1.62, e.pos.z, 0.27);
      if (th > 0 && th < bestT) { bestT = th; best = { e, head: true }; }
      const tb = raySphere(ox, oy, oz, dir.x, dir.y, dir.z, e.pos.x, e.pos.y + 0.85, e.pos.z, 0.52);
      if (tb > 0 && tb < bestT) { bestT = tb; best = { e, head: false }; }
    }

    let wallT = Infinity, normal = null;
    for (const b of this.cols) {
      const hit = rayAABB(ox, oy, oz, dir.x, dir.y, dir.z, b);
      if (hit && hit.t < wallT) { wallT = hit.t; normal = hit.n; }
    }

    let end, hitEnemy = null, head = false;
    if (best && bestT < wallT) {
      hitEnemy = best.e;
      head = best.head;
      end = { x: ox + dir.x * bestT, y: oy + dir.y * bestT, z: oz + dir.z * bestT };
    } else if (wallT < Infinity) {
      end = { x: ox + dir.x * wallT, y: oy + dir.y * wallT, z: oz + dir.z * wallT };
    } else {
      end = { x: ox + dir.x * 70, y: oy + dir.y * 70, z: oz + dir.z * 70 };
    }

    const muzzle = this.rig.getMuzzleWorld();
    this.bus.emit('tracer', { a: muzzle, b: end });

    if (hitEnemy) {
      const dmg = head ? w.def.damage * w.def.headshotMult : w.def.damage;
      const killed = hitEnemy.damage(dmg);
      this.state.score += head ? 20 : 10;
      if (killed) {
        this.state.score += 50;
        this.bus.emit('enemyKilled');
      }
      this.bus.emit('hit', { pos: end, head, killed });
    } else if (wallT < Infinity) {
      this.bus.emit('impact', { pos: end, normal });
    }
  }

  launchRocket(time) {
    const cam = this.engine.camera;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const muzzle = this.rig.getMuzzleWorld();
    const w = this.state.player.weapon;
    this.state.projectiles.push({
      x: muzzle.x, y: muzzle.y, z: muzzle.z,
      dx: dir.x, dy: dir.y, dz: dir.z,
      life: 3.0, dmg: w.def.damage, radius: w.def.aoeradius, trail: 0
    });
    this.bus.emit('rocketLaunch', { a: { x: muzzle.x, y: muzzle.y, z: muzzle.z } });
  }

  launchNapalm(time) {
    const cam = this.engine.camera;
    const dir = new THREE.Vector3();
    cam.getWorldDirection(dir);
    const muzzle = this.rig.getMuzzleWorld();
    const w = this.state.player.weapon;
    // légèrement arqué pour poser la bombe un peu en avant
    this.state.projectiles.push({
      x: muzzle.x, y: muzzle.y, z: muzzle.z,
      dx: dir.x, dy: dir.y + 0.05, dz: dir.z,
      life: 2.4, dmg: 0, radius: w.def.poolRadius, trail: 0,
      napalm: true, poolLife: w.def.poolLife, dmgPerSec: w.def.dmgPerSec
    });
    this.bus.emit('napalmLaunch', { x: muzzle.x, y: muzzle.y, z: muzzle.z });
  }
}
