export class HUD {
  constructor() {
    this.ammoEl = document.getElementById('ammoText');
    this.hpFill = document.getElementById('hpFill');
    this.hpText = document.getElementById('hpText');
    this.waveEl = document.getElementById('waveLabel');
    this.scoreEl = document.getElementById('scoreLabel');
    this.hitEl = document.getElementById('hitmarker');
    this.vignette = document.getElementById('vignette');
    this.lowhp = document.getElementById('lowhp');
    this.waveBanner = document.getElementById('waveBanner');
    this.brightVal = document.getElementById('brightVal');
    this.hitT = 0;
    this.hitKill = false;
    this.waveT = 0;
    this.t = 0;
  }

  hit(kill) {
    this.hitT = 0.12;
    this.hitKill = kill;
  }

  wave(n) {
    this.waveBanner.textContent = 'VAGUE ' + n;
    this.waveT = 2.4;
  }

  update(state, dt) {
    this.t += dt;
    const p = state.player;
    const w = p.weapon;

    this.ammoEl.textContent = w.reloading ? 'RECHARGE\u2026' : `${w.ammo} / ${w.reserve}`;
    const hpPct = Math.max(0, p.hp / p.maxHp);
    this.hpFill.style.width = (hpPct * 100).toFixed(1) + '%';
    this.hpFill.style.background = hpPct < 0.3 ? '#c0392b' : hpPct < 0.6 ? '#d9a520' : '#3f9e4d';
    this.hpText.textContent = Math.ceil(p.hp);
    this.waveEl.textContent = 'VAGUE ' + state.wave;
    this.scoreEl.textContent = 'SCORE ' + state.score;

    if (this.hitT > 0) {
      this.hitT -= dt;
      this.hitEl.style.opacity = 1;
      this.hitEl.style.color = this.hitKill ? '#ff4030' : '#ffffff';
    } else {
      this.hitEl.style.opacity = 0;
    }

    this.vignette.style.opacity = (p.damageFlash * 0.8).toFixed(3);

    if (hpPct < 0.35 && p.hp > 0) {
      this.lowhp.style.opacity = (0.25 + 0.15 * Math.sin(this.t * 6)).toFixed(3);
    } else {
      this.lowhp.style.opacity = 0;
    }

    if (this.waveT > 0) {
      this.waveT -= dt;
      this.waveBanner.style.opacity = Math.min(1, this.waveT / 0.6).toFixed(3);
    } else {
      this.waveBanner.style.opacity = 0;
    }

    this.brightVal.textContent = Math.round(state.brightness * 100) + '%';
  }
}
