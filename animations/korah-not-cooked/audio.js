// Synthesised sound: key clicks, paper, a sigh, ticks and chimes. No samples.
const fs = require('fs');
const { rng } = require('./paper');
const { T, BALL, KEYS, CLICKS, score } = require('./timeline');

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

function render() {
  const n = Math.ceil(T.duration * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  const verb = new Float32Array(n);
  const rand = rng(2024);
  const noise = () => rand() * 2 - 1;

  // write a mono voice into the mix with pan (-1..1) and reverb send
  function add(t0, buf, gain, pan = 0, send = 0.12) {
    const i0 = Math.round(t0 * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < buf.length; i++) {
      const j = i0 + i;
      if (j < 0 || j >= n) continue;
      L[j] += buf[i] * gl; R[j] += buf[i] * gr; verb[j] += buf[i] * gain * send;
    }
  }
  const make = (sec, fn) => { const b = new Float32Array(Math.round(sec * SR)); for (let i = 0; i < b.length; i++) b[i] = fn(i / SR, i); return b; };

  // ---- voices ----
  function keyClick(v) {
    const bp = new Biquad('bp', 2600 + v * 1400, 1.4), body = new Biquad('bp', 1100 + v * 300, 3), rel = new Biquad('bp', 3000 + v * 1200, 1.4);
    const f = 170 + v * 90;
    const up = 0.05 + v * 0.03;
    return make(0.14, (t) => {
      let s = bp.run(noise() * Math.exp(-t / 0.0013)) * 1.1;
      s += body.run(noise() * Math.exp(-t / 0.007)) * 0.8;
      s += Math.sin(TAU * f * t) * Math.exp(-t / 0.011) * 0.35;
      if (t > up) { const u = t - up; s += rel.run(noise() * Math.exp(-u / 0.001)) * 0.35 + Math.sin(TAU * f * 1.3 * u) * Math.exp(-u / 0.006) * 0.12; }
      return s;
    });
  }
  function padClick() {
    const hp = new Biquad('hp', 2000, 0.7);
    return make(0.06, (t) => Math.sin(TAU * 1400 * t) * Math.exp(-t / 0.003) * 0.6 + hp.run(noise()) * Math.exp(-t / 0.002) * 0.7);
  }
  // crackly paper: short grains at a rate that follows an envelope
  function rustle(dur, rate, bright = 1, env = (u) => Math.sin(Math.PI * u)) {
    const b = new Float32Array(Math.round(dur * SR));
    const hp = new Biquad('hp', 1500 * bright, 0.7), bp = new Biquad('bp', 3000 * bright, 0.8);
    for (let i = 0; i < b.length; i++) b[i] = bp.run(hp.run(noise())) * 0.18 * env(i / b.length);
    let t = 0;
    while (t < dur) {
      const e = env(t / dur);
      t += (-Math.log(1 - rand() + 1e-9) / (rate * (0.2 + e))) ;
      if (t >= dur) break;
      const g = new Biquad('bp', (1500 + rand() * 5000) * bright, 1.5 + rand() * 2);
      const len = Math.round((0.002 + rand() * 0.008) * SR), amp = (0.3 + rand() * 0.7) * e;
      const i0 = Math.round(t * SR);
      for (let k = 0; k < len && i0 + k < b.length; k++) b[i0 + k] += g.run(noise()) * amp * Math.exp(-k / (len * 0.3));
    }
    return b;
  }
  function fwip(dur = 0.18, lo = 700, hi = 3200) {
    const bp = new Biquad('bp', lo, 1.2);
    const b = make(dur, (t, i) => {
      const u = t / dur;
      if (i % 32 === 0) bp.set(lo + (hi - lo) * u, 1.2);
      return bp.run(noise()) * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.4)), 1.5) * (1 - u * 0.5);
    });
    const r = rustle(dur, 60, 1.1);
    for (let i = 0; i < b.length; i++) b[i] = b[i] * 0.9 + r[i] * 0.6;
    return b;
  }
  function thud(f = 95) {
    const lp = new Biquad('lp', 600, 0.7);
    return make(0.25, (t) => Math.sin(TAU * f * t * (1 - t * 0.8)) * Math.exp(-t / 0.045) * 0.9 + lp.run(noise()) * Math.exp(-t / 0.03) * 0.5);
  }
  // breathy exhale through moving formants
  function sigh(dur, bright = 1, voiced = 0.12) {
    const f1 = new Biquad('bp', 650, 4), f2 = new Biquad('bp', 1150, 5), f3 = new Biquad('bp', 2500, 5), air = new Biquad('hp', 1800, 0.7);
    let ph = 0;
    return make(dur, (t, i) => {
      const u = t / dur;
      if (i % 64 === 0) { f1.set((650 - 180 * u) * bright, 4); f2.set((1150 - 250 * u) * bright, 5); f3.set(2500 * bright, 5); }
      const env = Math.min(1, t / 0.14) * Math.pow(1 - u, 1.4) * (1 + 0.08 * Math.sin(TAU * 7 * t));
      const x = noise();
      ph += TAU * (150 - 45 * u) / SR;
      const vo = (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sin(3 * ph)) * voiced * Math.min(1, t / 0.25);
      const src = x + vo;
      return (f1.run(src) * 1.0 + f2.run(src) * 0.7 + f3.run(src) * 0.35 + air.run(x) * 0.25) * env;
    });
  }
  function tok(f) {
    return make(0.12, (t) => (Math.sin(TAU * f * t) * Math.exp(-t / 0.018) + Math.sin(TAU * f * 2.01 * t) * Math.exp(-t / 0.008) * 0.4 + noise() * Math.exp(-t / 0.0015) * 0.3));
  }
  function tick() { return make(0.03, (t) => Math.sin(TAU * 2300 * t) * Math.exp(-t / 0.004)); }
  function bell(f, dur = 2.4) {
    const parts = [[1, 1, 1.6], [2.76, 0.32, 0.6], [5.4, 0.14, 0.3], [0.5, 0.22, 1.2]];
    return make(dur, (t) => Math.min(1, t / 0.004) * parts.reduce((s, [r, a, d]) => s + Math.sin(TAU * f * r * t) * a * Math.exp(-t / d), 0));
  }
  function swell() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    return make(1.8, (t) => {
      const env = Math.min(1, t / 0.35) * Math.exp(-Math.max(0, t - 0.35) / 0.55);
      return notes.reduce((s, f, k) => s + Math.sin(TAU * f * t + k) * (0.6 - k * 0.1), 0) * env * 0.25;
    });
  }

  // ---- cue sheet ----
  // room tone under the scene
  const lp = new Biquad('lp', 380, 0.7);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    brown = (brown + noise() * 0.02) * 0.995;
    const env = Math.min(1, t / 0.6) * Math.max(0, Math.min(1, (T.fade[1] - t) / 1.0));
    const s = lp.run(brown) * 0.03 * env;
    L[i] += s; R[i] += s;
  }

  for (const [k, hand] of KEYS) add(k, keyClick(rand()), 0.22 + rand() * 0.06, hand ? -0.25 : -0.1, 0.06);
  for (const c of CLICKS) add(c, padClick(), 0.25, -0.05, 0.05);
  add(T.reveal, thud(110), 0.3, 0, 0.2);
  add(T.sigh, sigh(1.35), 0.55, -0.15, 0.25);
  add(T.sheetSlip, rustle(0.45, 90, 0.9), 0.32, -0.3);
  add(T.ballFall, rustle(0.3, 70), 0.3, -0.3);
  add(BALL.land, thud(80), 0.28, -0.3); add(BALL.land, rustle(0.25, 120), 0.3, -0.3);
  add(T.open, fwip(0.22, 500, 2600), 0.3, 0.1, 0.2);
  add(T.open + 0.05, swell(), 0.18, 0, 0.35);
  [T.open + 0.45, T.open + 0.7, T.open + 0.9].forEach((t, i) => add(t, fwip(0.16, 800, 3000), 0.22, 0.05 + i * 0.05));
  add(T.badge, fwip(0.26, 500, 2400), 0.3, 0.1, 0.2); add(T.badge + 0.22, tok(520), 0.16, 0.1, 0.25);
  add(T.track, fwip(0.16, 800, 3000), 0.22, 0.05);
  T.cards.forEach((t, i) => { add(t, fwip(0.2, 700, 3400), 0.3, 0.2); add(t + 0.45, tok(880 + i * 120), 0.22, 0.2, 0.2); });
  add(T.ribbon[0], rustle(T.ribbon[1] - T.ribbon[0], 55, 0.8, (u) => Math.sin(Math.PI * Math.min(1, u * 1.2)) * (1 - u * 0.6)), 0.28, -0.05);
  let last = score(T.count[0]);
  for (let t = T.count[0]; t <= T.count[1]; t += 0.002) {
    const s = score(t);
    if (s !== last) { add(t, tick(), 0.1, 0, 0.1); last = s; }
  }
  add(T.chime, bell(1318.5), 0.085, -0.05, 0.4);
  add(T.chime + 0.11, bell(1975.5), 0.065, 0.05, 0.4);
  add(T.relief, sigh(1.0, 1.15, 0.18), 0.4, -0.15, 0.25);
  for (let i = 0; i < 9; i++) add(T.clutter + i * 0.16, fwip(0.14, 900, 3200), 0.13, -0.3 + i * 0.07);
  for (let i = 0; i < 16; i += 2) add(T.title + i * 0.065 + (i >= 6 ? 0.12 : 0) + (i >= 9 ? 0.12 : 0), fwip(0.12, 900, 3600), 0.14, -0.3 + i * 0.04);
  add(T.tag, fwip(0.22, 600, 2800), 0.26, 0);
  add(T.tag + 0.25, bell(1046.5, 3), 0.07, -0.05, 0.45);
  add(T.tag + 0.36, bell(1568, 3), 0.055, 0.05, 0.45);

  // ---- small room reverb on the send (comb + allpass) ----
  const reverb = (delays, ap) => {
    const out = new Float32Array(n);
    for (const d of delays) {
      const buf = new Float32Array(d); let p = 0, f = 0;
      for (let i = 0; i < n; i++) { const y = buf[p]; f = y * 0.7 + f * 0.3; buf[p] = verb[i] + f * 0.78; p = (p + 1) % d; out[i] += y / delays.length; }
    }
    for (const d of ap) {
      const buf = new Float32Array(d); let p = 0;
      for (let i = 0; i < n; i++) { const b = buf[p]; const y = -out[i] + b; buf[p] = out[i] + b * 0.5; p = (p + 1) % d; out[i] = y; }
    }
    return out;
  };
  const vl = reverb([1557, 1617, 1491, 1422], [225, 556]), vr = reverb([1580, 1640, 1514, 1445], [248, 579]);
  let peak = 0;
  for (let i = 0; i < n; i++) { L[i] += vl[i] * 0.9; R[i] += vr[i] * 0.9; peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i])); }
  const g = 0.89 / peak;
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return [L, R];
}

function writeWav(file) {
  const [L, R] = render();
  const n = L.length;
  const buf = Buffer.alloc(44 + n * 4);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) {
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i])) * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i])) * 32767), 46 + i * 4);
  }
  fs.writeFileSync(file, buf);
}

module.exports = { writeWav };
