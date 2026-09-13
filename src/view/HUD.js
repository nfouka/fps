import { WEAPONS } from '../model/Weapon.js';

export class HUD {
  constructor() {
    this.ammoEl = document.getElementById('ammoText');
    this.weaponNameEl = document.getElementById('weaponName');
    this.hpFill = document.getElementById('hpFill');
    this.hpText = document.getElementById('hpText');
    this.waveEl = document.getElementById('waveLabel');
    this.scoreEl = document.getElementById('scoreLabel');
    this.hitEl = document.getElementById('hitmarker');
    this.vignette = document.getElementById('vignette');
    this.lowhp = document.getElementById('lowhp');
    this.waveBanner = document.getElementById('waveBanner');
    this.brightVal = document.getElementById('brightVal');
    this.reticleZoom = document.getElementById('reticleZoom');
    this.crosshair = document.getElementById('crosshair');
    this.minimap = document.getElementById('minimap');
    this.mm = this.minimap.getContext('2d');
    this.hitT = 0;
    this.hitKill = false;
    this.waveT = 0;
    this.t = 0;
  }

  hit(kill) {
    this.hitT = 0.16;
    this.hitKill = kill;
    this.hitEl.classList.remove('show');
    void this.hitEl.getBoundingClientRect();
    this.hitEl.classList.add('show');
    this.hitEl.style.color = this.hitKill ? '#ff4030' : '#ffffff';
  }

  wave(n) {
    this.waveBanner.textContent = 'VAGUE ' + n;
    this.waveT = 2.4;
  }

  drawMinimap(state) {
    const ctx = this.mm;
    const W = 180;
    ctx.clearRect(0, 0, W, W);
    this.state = state;
    const scale = 1.7;

    const P = (x, z) => {
      const dx = x - state.player.pos.x, dz = z - state.player.pos.z;
      const yaw = state.player.yaw;
      const right = dx * Math.cos(yaw) - dz * Math.sin(yaw);
      const fwd = -dx * Math.sin(yaw) - dz * Math.cos(yaw);
      return { x: 90 + right * scale, y: 90 - fwd * scale };
    };

    // level geometry: platform + two tracks
    const poly = (pts, fill, stroke) => {
      ctx.beginPath();
      pts.forEach((pt, i) => { const px = P(pt[0], pt[1]); if (i === 0) ctx.moveTo(px.x, px.y); else ctx.lineTo(px.x, px.y); });
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
    };

    poly([[-4, -30], [4, -30], [4, 30], [-4, 30]], 'rgba(60,72,86,0.42)', 'rgba(160,180,200,0.5)');   // platform
    poly([[4, -30], [6, -30], [6, 30], [4, 30]], 'rgba(40,48,58,0.45)', 'rgba(120,130,140,0.35)');    // right track
    poly([[-6, -30], [-4, -30], [-4, 30], [-6, 30]], 'rgba(40,48,58,0.45)', 'rgba(120,130,140,0.35)'); // left track

    // stair ramps at both ends
    const stairMark = (x, z) => {
      const a = P(x, z - 2.2), b = P(x, z + 2.2);
      ctx.strokeStyle = 'rgba(232,184,74,0.55)';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    };
    stairMark(5, 27); stairMark(-5, 27); stairMark(5, -27); stairMark(-5, -27);

    // enemies
    for (const e of state.enemies) {
      if (e.state === 'dying' || e.state === 'spawn') continue;
      const pt = P(e.pos.x, e.pos.z);
      const armed = e.armed;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, armed ? 3.4 : 2.6, 0, Math.PI * 2);
      ctx.fillStyle = armed ? '#ff8a3a' : '#ff4030';
      ctx.fill();
      if (armed) {
        ctx.strokeStyle = 'rgba(255,150,90,0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // player arrow (center, points forward)
    const yaw = state.player.yaw;
    ctx.save();
    ctx.translate(90, 90);
    ctx.rotate(-yaw);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(5, 7);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 7);
    ctx.closePath();
    ctx.fillStyle = '#7fd0ff';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // ring
    ctx.beginPath();
    ctx.arc(90, 90, 88, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(160,180,200,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  update(state, dt) {
    this.t += dt;
    this.state = state;
    const p = state.player;
    const w = p.weapon;

    this.ammoEl.textContent = w.reloading ? 'RECHARGE\u2026' : `${w.ammo} / ${w.reserve}`;
    this.ammoEl.style.color = w.def.kind === 'rocket' ? '#e8b84a'
      : w.def.kind === 'napalm' ? '#ff7a2a'
      : w.def.kind === 'mg' ? '#7fdfff' : '#eef4fa';
    this.weaponNameEl.textContent = w.name;
    const hpPct = Math.max(0, p.hp / p.maxHp);
    this.hpFill.style.width = (hpPct * 100).toFixed(1) + '%';
    this.hpFill.style.background = hpPct < 0.3
      ? 'linear-gradient(90deg, #c0392b, #e8553f)'
      : hpPct < 0.6
        ? 'linear-gradient(90deg, #c99a1c, #e0c03a)'
        : 'linear-gradient(90deg, #3f9e4d, #5fce73)';
    this.hpText.textContent = Math.ceil(p.hp);
    this.waveEl.textContent = 'VAGUE ' + state.wave;
    this.scoreEl.textContent = 'SCORE ' + state.score;

    if (this.hitT > 0) {
      this.hitT -= dt;
      this.hitEl.classList.add('show');
    } else {
      this.hitEl.classList.remove('show');
    }

    this.vignette.style.opacity = (p.damageFlash * 0.8).toFixed(3);

    if (hpPct < 0.35 && p.hp > 0) {
      this.lowhp.style.opacity = (0.25 + 0.15 * Math.sin(this.t * 6)).toFixed(3);
    } else {
      this.lowhp.style.opacity = 0;
    }

    if (this.waveT > 0) {
      this.waveT -= dt;
      this.waveBanner.classList.add('show');
    } else {
      this.waveBanner.classList.remove('show');
    }

    this.brightVal.textContent = Math.round(state.brightness * 100) + '%';

    // scope reticle: fade in with zoom, show nearest-enough range reading
    const z = p.zoom;
    const showZoom = z > 0.08;
    if (showZoom) this.reticleZoom.classList.add('in');
    else this.reticleZoom.classList.remove('in');
    this.reticleZoom.style.opacity = showZoom ? (0.55 + 0.45 * z).toFixed(3) : '0';
    this.crosshair.style.opacity = showZoom ? '0.12' : '1';
    let nearest = Infinity;
    for (const e of state.enemies) {
      if (e.state === 'dying' || e.state === 'spawn') continue;
      const d = Math.hypot(e.pos.x - p.pos.x, e.pos.z - p.pos.z);
      if (d < nearest) nearest = d;
    }
    const reading = nearest < 30 ? Math.round(nearest * 3.2) + ' MIL' : '\u2014\u2014';
    this.reticleZoom.querySelector('.turret.top').textContent = reading;
    const targetFov = 74 + (WEAPONS[w.def.id].zoomFov - 74) * p.zoom;
    const mag = targetFov > 1 ? (74 / targetFov).toFixed(1) : '1.0';
    this.reticleZoom.querySelector('.turret.bottom').textContent = mag + '\u00d7';
    this.reticleZoom.querySelector('.range').textContent = 'RIFLE SCOPE / MIL-DOT';

    this.drawMinimap(state);
  }
}
