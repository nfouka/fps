export class UIController {
  constructor(state, bus, audio, canvas) {
    this.state = state;
    this.bus = bus;
    this.audio = audio;

    this.startScreen = document.getElementById('startScreen');
    this.pauseScreen = document.getElementById('pauseScreen');
    this.overScreen = document.getElementById('overScreen');
    this.finalStats = document.getElementById('finalStats');

    document.getElementById('startBtn').addEventListener('click', () => this.start());
    document.getElementById('resumeBtn').addEventListener('click', () => this.resume());
    document.getElementById('restartBtn').addEventListener('click', () => this.restart());

    this.sliders = [
      document.getElementById('startBright'),
      document.getElementById('pauseBright'),
      document.getElementById('brightSlider')
    ];
    for (const s of this.sliders) {
      s.addEventListener('input', () => this.setBrightness(s.value / 100));
    }

    window.addEventListener('keydown', (e) => {
      if (e.code === 'BracketLeft') this.setBrightness(this.state.brightness - 0.1);
      if (e.code === 'BracketRight') this.setBrightness(this.state.brightness + 0.1);
    });

    canvas.addEventListener('click', () => {
      if (this.state.status === 'playing' && !document.pointerLockElement) {
        this.requestLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement && this.state.status === 'playing') {
        this.pause();
      }
    });

    bus.on('gameover', () => this.showGameOver());
  }

  requestLock() {
    try {
      const r = document.getElementById('c').requestPointerLock();
      if (r && typeof r.catch === 'function') r.catch(() => {});
    } catch (err) { /* lock refused, click will retry */ }
  }

  setBrightness(b) {
    this.state.brightness = Math.max(0, Math.min(1, b));
    const v = String(Math.round(this.state.brightness * 100));
    for (const s of this.sliders) s.value = v;
  }

  start() {
    this.audio.init();
    this.audio.resume();
    this.state.status = 'playing';
    this.startScreen.classList.add('hidden');
    this.requestLock();
    this.bus.emit('startGame');
  }

  restart() {
    this.state.reset();
    this.bus.emit('resetViews');
    this.audio.init();
    this.audio.resume();
    this.state.status = 'playing';
    this.overScreen.classList.add('hidden');
    this.requestLock();
    this.bus.emit('startGame');
  }

  pause() {
    if (this.state.status !== 'playing') return;
    this.state.status = 'paused';
    this.pauseScreen.classList.remove('hidden');
    this.audio.suspend();
    if (document.pointerLockElement) document.exitPointerLock();
  }

  resume() {
    if (this.state.status !== 'paused') return;
    this.state.status = 'playing';
    this.pauseScreen.classList.add('hidden');
    this.audio.resume();
    this.requestLock();
  }

  showGameOver() {
    this.finalStats.textContent = `VAGUE ${this.state.wave}  \u2022  SCORE ${this.state.score}`;
    this.overScreen.classList.remove('hidden');
    this.audio.suspend();
    if (document.pointerLockElement) document.exitPointerLock();
  }
}
