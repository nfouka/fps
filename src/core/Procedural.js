import * as THREE from 'three';

const R = (a, b) => a + Math.random() * (b - a);

function makeCanvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { c, x: c.getContext('2d') };
}

function toTexture(canvas, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(rx, ry);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function addNoise(x, w, h, amount) {
  const img = x.getImageData(0, 0, w, h);
  const d = img.data;
  for (let p = 0; p < d.length; p += 4) {
    const n = R(-amount, amount);
    d[p] = Math.max(0, Math.min(255, d[p] + n));
    d[p + 1] = Math.max(0, Math.min(255, d[p + 1] + n));
    d[p + 2] = Math.max(0, Math.min(255, d[p + 2] + n));
  }
  x.putImageData(img, 0, 0);
}

export function tileTexture(rx = 1, ry = 1) {
  const S = 512;
  const { c, x } = makeCanvas(S);
  const cols = 8, rows = 8;
  x.fillStyle = '#23262a';
  x.fillRect(0, 0, S, S);
  const tw = S / cols, th = S / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const px = i * tw, py = j * th;
      const damaged = Math.random() < 0.05;
      const h = R(185, 208);
      const s = damaged ? R(2, 6) : R(8, 16);
      const l = damaged ? R(16, 30) : R(64, 78);
      x.fillStyle = `hsl(${h},${s}%,${l}%)`;
      x.fillRect(px + 2, py + 2, tw - 4, th - 4);
      x.fillStyle = 'rgba(255,255,255,0.22)';
      x.fillRect(px + 2, py + 2, tw - 4, 2);
      x.fillRect(px + 2, py + 2, 2, th - 4);
      x.fillStyle = 'rgba(0,0,0,0.30)';
      x.fillRect(px + 2, py + th - 4, tw - 4, 2);
      x.fillRect(px + tw - 4, py + 2, 2, th - 4);
    }
  }
  for (let k = 0; k < 26; k++) {
    const g = x.createLinearGradient(0, 0, 0, 340);
    g.addColorStop(0, 'rgba(18,22,16,0.16)');
    g.addColorStop(1, 'rgba(18,22,16,0)');
    x.fillStyle = g;
    x.fillRect(R(0, S), R(0, 180), R(6, 42), 340);
  }
  addNoise(x, S, S, 12);
  return toTexture(c, rx, ry);
}

export function concreteTexture(rx = 1, ry = 1) {
  const S = 512;
  const { c, x } = makeCanvas(S);
  x.fillStyle = '#5c5c58';
  x.fillRect(0, 0, S, S);
  for (let k = 0; k < 220; k++) {
    const px = R(0, S), py = R(0, S), r = R(10, 90);
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    const dark = Math.random() < 0.5;
    g.addColorStop(0, dark ? 'rgba(30,30,28,0.10)' : 'rgba(150,150,145,0.08)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.strokeStyle = 'rgba(20,20,18,0.5)';
  for (let k = 0; k < 7; k++) {
    x.lineWidth = R(0.6, 1.6);
    x.beginPath();
    let px = R(0, S), py = R(0, S);
    x.moveTo(px, py);
    const steps = 6 + (Math.random() * 8) | 0;
    for (let i = 0; i < steps; i++) {
      px += R(-40, 40);
      py += R(-40, 40);
      x.lineTo(px, py);
    }
    x.stroke();
  }
  addNoise(x, S, S, 14);
  return toTexture(c, rx, ry);
}

export function ballastTexture(rx = 1, ry = 1) {
  const S = 512;
  const { c, x } = makeCanvas(S);
  x.fillStyle = '#2e2a24';
  x.fillRect(0, 0, S, S);
  for (let k = 0; k < 4200; k++) {
    const g = R(40, 120);
    x.fillStyle = `rgb(${g},${g * 0.92 | 0},${g * 0.78 | 0})`;
    const r = R(1, 3.4);
    x.beginPath();
    x.arc(R(0, S), R(0, S), r, 0, Math.PI * 2);
    x.fill();
  }
  addNoise(x, S, S, 10);
  return toTexture(c, rx, ry);
}

export function graffitiTexture() {
  const S = 256;
  const { c, x } = makeCanvas(S);
  x.clearRect(0, 0, S, S);
  const strokes = 3 + (Math.random() * 3) | 0;
  for (let k = 0; k < strokes; k++) {
    const hue = R(0, 360);
    x.strokeStyle = `hsla(${hue},85%,55%,0.85)`;
    x.lineWidth = R(7, 18);
    x.lineCap = 'round';
    x.beginPath();
    x.moveTo(R(20, S - 20), R(40, S - 60));
    x.bezierCurveTo(R(0, S), R(0, S), R(0, S), R(0, S), R(20, S - 20), R(40, S - 60));
    x.stroke();
    x.strokeStyle = `hsla(${hue},90%,25%,0.9)`;
    x.lineWidth = 2;
    x.stroke();
    for (let d = 0; d < 3; d++) {
      x.strokeStyle = `hsla(${hue},85%,50%,0.5)`;
      x.lineWidth = R(1.5, 3);
      const dx = R(30, S - 30), dy = R(60, S - 40);
      x.beginPath();
      x.moveTo(dx, dy);
      x.lineTo(dx + R(-3, 3), dy + R(10, 40));
      x.stroke();
    }
  }
  return toTexture(c);
}

const SLOGANS = [
  'الحرية لنا',
  'لن نسلم المحطة',
  'المنطقة محررة',
  'لا استسلام',
  'نصر المقاومة',
  'امضي قدما',
  'نحن هنا',
  'الحرية أو الموت',
  'كلنا للمحطة',
  'المقاومة ستنتصر'
];

const ARABIC_FONT = "'Times New Roman', Times, serif";

export function arabicSloganTexture(slogan) {
  const S = 512;
  const { c, x } = makeCanvas(S, 256);
  x.clearRect(0, 0, S, 256);
  const text = slogan || SLOGANS[(Math.random() * SLOGANS.length) | 0];
  const hue = R(0, 360);
  for (let k = 0; k < 3; k++) {
    const g = x.createRadialGradient(S / 2, 128, 0, S / 2, 128, R(110, 210));
    g.addColorStop(0, `hsla(${hue},80%,50%,0.30)`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, S, 256);
  }
  const maxW = S * 0.92, maxH = 150;
  let size = 160;
  x.font = `bold ${size}px ${ARABIC_FONT}`;
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  while (size > 28 && (x.measureText(text).width > maxW || x.measureText(text).height > maxH)) {
    size -= 4;
    x.font = `bold ${size}px ${ARABIC_FONT}`;
  }
  const tx = S / 2, ty = 128 + size * 0.06;
  x.strokeStyle = 'rgba(0,0,0,0.9)';
  x.lineWidth = size * 0.09;
  x.lineJoin = 'round';
  x.strokeText(text, tx, ty);
  x.fillStyle = `hsla(${(hue + 185) % 360},85%,62%,0.95)`;
  x.fillText(text, tx, ty);
  x.strokeStyle = `hsla(${hue},92%,78%,0.75)`;
  x.lineWidth = size * 0.03;
  x.strokeText(text, tx, ty);
  addNoise(x, S, 256, 8);
  return toTexture(c);
}

export function signTexture(text) {
  const { c, x } = makeCanvas(512, 128);
  x.fillStyle = '#0a2a5e';
  x.fillRect(0, 0, 512, 128);
  x.strokeStyle = '#e8ecf2';
  x.lineWidth = 6;
  x.strokeRect(8, 8, 496, 112);
  x.fillStyle = '#e8ecf2';
  x.beginPath();
  x.arc(58, 64, 30, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = '#0a2a5e';
  x.font = 'bold 34px Arial';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('M', 58, 66);
  x.fillStyle = '#e8ecf2';
  x.font = 'bold 40px Arial';
  x.fillText(text, 292, 66);
  addNoise(x, 512, 128, 8);
  return toTexture(c);
}

export function wayOutTexture() {
  const { c, x } = makeCanvas(256, 128);
  x.fillStyle = '#0a7a2a';
  x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#fff';
  x.lineWidth = 4;
  x.strokeRect(6, 6, 244, 116);
  x.fillStyle = '#fff';
  x.font = 'bold 34px Arial';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText('WAY OUT', 128, 46);
  x.strokeStyle = '#fff';
  x.lineWidth = 6;
  x.beginPath();
  x.moveTo(96, 96);
  x.lineTo(160, 76);
  x.stroke();
  x.beginPath();
  x.moveTo(160, 76);
  x.lineTo(146, 74);
  x.moveTo(160, 76);
  x.lineTo(156, 90);
  x.stroke();
  return toTexture(c);
}

export function posterTexture() {
  const { c, x } = makeCanvas(256, 384);
  const palette = ['#b8432e', '#2e6ab8', '#c9a227', '#3a8a55', '#7a3a8a', '#22262b'];
  x.fillStyle = palette[(Math.random() * palette.length) | 0];
  x.fillRect(0, 0, 256, 384);
  x.fillStyle = palette[(Math.random() * palette.length) | 0];
  x.fillRect(R(0, 120), R(0, 200), R(80, 220), R(60, 160));
  x.fillStyle = 'rgba(255,255,255,0.9)';
  x.beginPath();
  x.arc(R(60, 190), R(80, 220), R(30, 70), 0, Math.PI * 2);
  x.fill();
  x.fillStyle = 'rgba(20,20,24,0.85)';
  for (let i = 0; i < 5; i++) {
    x.fillRect(24, 260 + i * 22, R(90, 208), 10);
  }
  x.fillStyle = 'rgba(255,255,255,0.75)';
  x.fillRect(24, 24, R(100, 180), 16);
  addNoise(x, 256, 384, 10);
  return toTexture(c);
}

export function vendingTexture() {
  const { c, x } = makeCanvas(128, 256);
  x.fillStyle = '#10141c';
  x.fillRect(0, 0, 128, 256);
  const cols = 4, rows = 6;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      x.fillStyle = `hsl(${R(0, 360)},70%,${R(35, 60)}%)`;
      x.fillRect(10 + i * 28, 14 + j * 30, 22, 22);
    }
  }
  x.fillStyle = '#e8f2ff';
  x.fillRect(8, 200, 112, 10);
  x.fillStyle = '#ffd23a';
  x.fillRect(8, 224, 60, 16);
  return toTexture(c);
}

export function muzzleFlashTexture() {
  const S = 128;
  const { c, x } = makeCanvas(S);
  x.clearRect(0, 0, S, S);
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,240,1)');
  g.addColorStop(0.25, 'rgba(255,210,120,0.9)');
  g.addColorStop(1, 'rgba(255,140,40,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  x.fillStyle = 'rgba(255,250,230,0.95)';
  const spikes = 6;
  for (let i = 0; i < spikes; i++) {
    x.save();
    x.translate(S / 2, S / 2);
    x.rotate((i / spikes) * Math.PI * 2 + R(-0.2, 0.2));
    x.beginPath();
    x.moveTo(0, -4);
    x.lineTo(S / 2 - 4, 0);
    x.lineTo(0, 4);
    x.closePath();
    x.fill();
    x.restore();
  }
  return toTexture(c);
}

export function burstTexture() {
  const S = 128;
  const { c, x } = makeCanvas(S);
  x.clearRect(0, 0, S, S);
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,240,200,1)');
  g.addColorStop(0.3, 'rgba(255,150,50,0.9)');
  g.addColorStop(0.7, 'rgba(220,70,20,0.4)');
  g.addColorStop(1, 'rgba(120,20,0,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  return toTexture(c);
}

export function decalTexture() {
  const S = 64;
  const { c, x } = makeCanvas(S);
  x.clearRect(0, 0, S, S);
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(5,5,8,0.95)');
  g.addColorStop(0.55, 'rgba(10,10,12,0.75)');
  g.addColorStop(1, 'rgba(10,10,12,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  x.fillStyle = 'rgba(0,0,0,0.85)';
  x.beginPath();
  x.arc(S / 2, S / 2, 6, 0, Math.PI * 2);
  x.fill();
  return toTexture(c);
}
