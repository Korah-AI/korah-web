// The source narration, untouched, with quiet synthesized mechanical effects laid under it.
const fs = require('fs');
const { rng } = require('../korah-not-cooked/paper');
const { T, SHOTS, MOVE } = require('./timeline');

const SR = 48000;
const TAU = Math.PI * 2;

// RBJ biquad; set() can be called while running for sweeps.
class Biquad {
  constructor(type, f, q) { this.type = type; this.x1 = this.x2 = this.y1 = this.y2 = 0; this.set(f, q); }
  set(f, q) {
    const w = (TAU * Math.min(f, SR * 0.45)) / SR, c = Math.cos(w), a = Math.sin(w) / (2 * q);
    let b0, b1, b2;
    if (this.type === 'lp') { b0 = (1 - c) / 2; b1 = 1 - c; b2 = b0; }
    else if (this.type === 'hp') { b0 = (1 + c) / 2; b1 = -(1 + c); b2 = b0; }
    else { b0 = a; b1 = 0; b2 = -a; } // band-pass, 0 dB peak
    const a0 = 1 + a;
    this.b0 = b0 / a0; this.b1 = b1 / a0; this.b2 = b2 / a0; this.a1 = (-2 * c) / a0; this.a2 = (1 - a) / a0;
  }
  run(x) {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1; this.x1 = x; this.y2 = this.y1; this.y1 = y;
    return y;
  }
}

function readWav(file) {
  const b = fs.readFileSync(file);
  let p = 12, ch = 2, data = null;
  while (p < b.length) {
    const id = b.toString('ascii', p, p + 4), len = b.readUInt32LE(p + 4);
    if (id === 'fmt ') ch = b.readUInt16LE(p + 10);
    if (id === 'data') { data = b.subarray(p + 8, p + 8 + len); break; }
    p += 8 + len + (len & 1);
  }
  const n = data.length / (2 * ch);
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    L[k] = data.readInt16LE(k * 2 * ch) / 32768;
    R[k] = data.readInt16LE(k * 2 * ch + (ch > 1 ? 2 : 0)) / 32768;
  }
  return [L, R];
}

function writeMix(narration, file) {
  const [L, R] = readWav(narration);
  const n = L.length;
  const fx = new Float32Array(n);
  const rand = rng(99);
  const noise = () => rand() * 2 - 1;
  const make = (sec, f) => { const b = new Float32Array(Math.round(sec * SR)); for (let k = 0; k < b.length; k++) b[k] = f(k / SR, k); return b; };
  const add = (t0, buf, gain) => { const k0 = Math.round(t0 * SR); for (let k = 0; k < buf.length && k0 + k < n; k++) fx[k0 + k] += buf[k] * gain; };

  // soft detent click: a tiny band-passed tap with a short metallic ring
  function click(f = 2400) {
    const bp = new Biquad('bp', f, 2.2);
    return make(0.05, (t) => bp.run(noise() * Math.exp(-t / 0.0012)) * 1.2 + Math.sin(TAU * f * 1.4 * t) * Math.exp(-t / 0.005) * 0.25);
  }
  // lens focus motor: a quiet geared whirr that speeds up and settles
  function whirr(dur, pitch = 1) {
    const lp = new Biquad('lp', 1800, 0.7), bp = new Biquad('bp', 900 * pitch, 1.4);
    let ph = 0;
    return make(dur, (t, k) => {
      const u = t / dur, env = Math.pow(Math.sin(Math.PI * u), 1.3);
      const rate = (120 + 90 * Math.sin(Math.PI * u)) * pitch;
      ph += rate / SR;
      const teeth = Math.exp(-(ph % 1) * 9) * 0.6;          // gear teeth
      const hum = Math.sin(TAU * rate * 2 * t) * 0.35 + Math.sin(TAU * rate * 3 * t) * 0.15;
      if (k % 64 === 0) bp.set((800 + 500 * u) * pitch, 1.4);
      return lp.run(bp.run(noise()) * 0.8 * teeth + hum * 0.4) * env;
    });
  }
  // paper sliding across paper
  function slide(dur, lo = 500, hi = 2200) {
    const bp = new Biquad('bp', lo, 0.9), lp = new Biquad('lp', 3500, 0.7);
    return make(dur, (t, k) => {
      const u = t / dur;
      if (k % 32 === 0) bp.set(lo + (hi - lo) * u, 0.9);
      const grit = rand() < 0.004 ? noise() * 3 : 0;
      return lp.run(bp.run(noise() + grit)) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.15)), 1.6);
    });
  }
  // a sheet settling onto the desk: low soft thock plus a light tap
  function land() {
    const lp = new Biquad('lp', 500, 0.7), c = click(1800);
    return make(0.22, (t, k) => Math.sin(TAU * 105 * t * (1 - t * 1.2)) * Math.exp(-t / 0.035) * 0.8
      + lp.run(noise()) * Math.exp(-t / 0.025) * 0.5 + (k < c.length ? c[k] * 0.35 : 0));
  }
  function tok(f) {
    return make(0.1, (t) => Math.sin(TAU * f * t) * Math.exp(-t / 0.016) + Math.sin(TAU * f * 2.02 * t) * Math.exp(-t / 0.007) * 0.3 + noise() * Math.exp(-t / 0.0012) * 0.25);
  }

  // cue sheet
  add(T.cardIn + 0.02, slide(0.4, 700, 2600), 0.05);
  add(T.cardIn + 0.36, land(), 0.1);
  SHOTS.forEach(([t, name], k) => {
    if (k === 0 || name === 'desmos') return;
    add(t, click(2600), 0.12);
    add(t + 0.03, whirr(MOVE - 0.08, 0.9 + (k % 3) * 0.08), 0.11);
    add(t + MOVE - 0.04, click(2100), 0.1);
  });
  add(T.desmosIn, slide(0.72, 450, 2000), 0.07);
  add(T.desmosLand - 0.03, land(), 0.13);
  add(T.aRed, tok(1150), 0.07);
  add(T.aCircle, slide(0.42, 1400, 3200), 0.03);
  add(T.aCircle + 0.44, tok(1500), 0.06);

  let peak = 0;
  for (let k = 0; k < n; k++) { L[k] += fx[k]; R[k] += fx[k]; peak = Math.max(peak, Math.abs(L[k]), Math.abs(R[k])); }
  if (peak > 0.99) throw new Error(`mix clips (peak ${peak.toFixed(3)})`);

  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let k = 0; k < n; k++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[k])) * 32767), 44 + k * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[k])) * 32767), 46 + k * 4);
  }
  fs.writeFileSync(file, buf);
}

module.exports = { writeMix };
