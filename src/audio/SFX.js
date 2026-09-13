export class SFX {
  constructor(audio) {
    this.a = audio;
  }

  ok() {
    return !!(this.a && this.a.ctx);
  }

  noiseBurst(dur, type, freq, gain, q = 1) {
    const a = this.a, t = a.ctx.currentTime;
    const src = a.ctx.createBufferSource();
    src.buffer = a.noiseBuf;
    src.loop = true;
    src.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = a.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(a.master);
    src.start(t, Math.random());
    src.stop(t + dur + 0.02);
  }

  tone(type, f0, f1, dur, gain, filterFreq) {
    const a = this.a, t = a.ctx.currentTime;
    const o = a.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
    const g = a.ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    let node = o;
    if (filterFreq) {
      const f = a.ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = filterFreq;
      o.connect(f);
      node = f;
    }
    node.connect(g);
    g.connect(a.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  shot() {
    if (!this.ok()) return;
    this.noiseBurst(0.09, 'bandpass', 800 + Math.random() * 400, 0.5, 0.8);
    this.tone('square', 170, 50, 0.12, 0.35);
  }

  reloadStart() {
    if (!this.ok()) return;
    this.noiseBurst(0.04, 'highpass', 2200, 0.25);
    this.tone('triangle', 120, 60, 0.08, 0.15);
  }

  reloadEnd() {
    if (!this.ok()) return;
    this.noiseBurst(0.035, 'highpass', 2600, 0.3);
    setTimeout(() => {
      if (this.ok()) this.noiseBurst(0.05, 'highpass', 1800, 0.35);
    }, 120);
  }

  impact() {
    if (!this.ok()) return;
    this.noiseBurst(0.07, 'lowpass', 500, 0.25);
    this.tone('sine', 110, 60, 0.06, 0.12);
  }

  blood() {
    if (!this.ok()) return;
    this.noiseBurst(0.14, 'lowpass', 320, 0.3);
  }

  growl(d) {
    if (!this.ok()) return;
    const a = this.a, t = a.ctx.currentTime;
    const base = 70 + Math.random() * 50;
    const o = a.ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = base;
    const vib = a.ctx.createOscillator();
    vib.frequency.value = 5 + Math.random() * 4;
    const vg = a.ctx.createGain();
    vg.gain.value = 18;
    vib.connect(vg);
    vg.connect(o.frequency);
    const f = a.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 420;
    const g = a.ctx.createGain();
    const pitch = d && d.pitch ? d.pitch : 1;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.22 * pitch, t + 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
    o.connect(f);
    f.connect(g);
    g.connect(a.master);
    o.start(t);
    vib.start(t);
    o.stop(t + 0.65);
    vib.stop(t + 0.65);
  }

  death() {
    if (!this.ok()) return;
    this.tone('sawtooth', 150, 40, 0.5, 0.28, 500);
    setTimeout(() => {
      if (this.ok()) this.noiseBurst(0.12, 'lowpass', 250, 0.3);
    }, 350);
  }

  step() {
    if (!this.ok()) return;
    this.noiseBurst(0.05, 'lowpass', 220, 0.1);
  }

  hurt() {
    if (!this.ok()) return;
    this.tone('sine', 80, 40, 0.2, 0.4);
    this.noiseBurst(0.1, 'lowpass', 400, 0.2);
  }

  flame() {
    if (!this.ok()) return;
    this.noiseBurst(0.12, 'lowpass', 600 + Math.random() * 200, 0.3, 0.7);
    this.tone('sawtooth', 130, 70, 0.14, 0.18, 700);
  }

  splash() {
    if (!this.ok()) return;
    this.noiseBurst(0.18, 'lowpass', 320, 0.32);
    this.tone('sine', 200, 90, 0.16, 0.18, 500);
  }

  mgFire() {
    if (!this.ok()) return;
    // bourdonnement grave qui se superpose = grondement de minigun
    this.tone('sawtooth', 60 + Math.random() * 20, 45, 0.09, 0.14, 300);
    this.noiseBurst(0.09, 'bandpass', 500, 0.14, 1.2);
  }
}
