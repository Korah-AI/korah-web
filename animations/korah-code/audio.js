// Synthesised sound: soft whooshes, mechanical clicks, 8-bit blips when pixels
// become paper, and paper folds. No samples, no music, no narration.
const fs = require('fs');
const { rng } = require('./paper');
const { T, KEYS, UI_PIECES } = require('./timeline');

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
    else { b0 = a; b1 = 0; b2 = -a; }
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
  const rand = rng(8191);
  const noise = () => rand() * 2 - 1;

  function add(t0, buf, gain, pan = 0, send = 0.1) {
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
  // air moving past: band-passed noise with the centre sweeping through
  function whoosh(dur, f0, f1, q = 1.1) {
    const bp = new Biquad('bp', f0, q);
    return make(dur, (t) => {
      const u = t / dur;
      bp.set(f0 + (f1 - f0) * u, q);
      const env = Math.sin(u * Math.PI) ** 1.7;
      return bp.run(noise()) * env * 3.2;
    });
  }
  // a key switch: a hard tick with a small plastic body under it
  function click(bright = 1) {
    const bp = new Biquad('bp', 2600 * bright, 1.4);
    const lp = new Biquad('lp', 760, 0.9);
    return make(0.05, (t) => {
      const tick = bp.run(noise()) * Math.exp(-t * 520) * 2.6;
      const body = lp.run(noise()) * Math.exp(-t * 180) * 1.1;
      return tick + body;
    });
  }
  // 8-bit blip: a square wave stepping up, the sound of pixels turning into paper
  function blip(f0 = 760, steps = [1, 1.5, 2], dur = 0.16) {
    const lp = new Biquad('lp', 7200, 0.7);
    const step = dur / (steps.length + 1.4);
    let ph = 0;
    return make(dur, (t) => {
      const k = Math.min(steps.length - 1, Math.floor(t / step));
      ph += (TAU * f0 * steps[k]) / SR;
      const sq = Math.sin(ph) > 0 ? 1 : -1;
      const env = t < 0.004 ? t / 0.004 : Math.exp(-(t - 0.004) * 11);
      return lp.run(sq) * env * 0.5;
    });
  }
  // a tiny pixel landing
  function tick(f = 3400) {
    const bp = new Biquad('bp', f, 5);
    return make(0.02, (t) => bp.run(noise()) * Math.exp(-t * 900) * 2.2);
  }
  // card of paper landing on a table
  function thunk() {
    const lp = new Biquad('lp', 340, 0.8);
    const bp = new Biquad('bp', 1500, 1.1);
    return make(0.3, (t) => lp.run(noise()) * Math.exp(-t * 26) * 1.5 + bp.run(noise()) * Math.exp(-t * 90) * 0.7);
  }
  // paper folding: a short crisp sweep
  function fold() {
    const bp = new Biquad('bp', 1700, 1);
    return make(0.16, (t) => {
      bp.set(1700 + t * 13000, 1);
      return bp.run(noise()) * Math.exp(-t * 22) * Math.min(1, t * 90) * 2.4;
    });
  }
  // the interface lighting up: a slow filtered swell
  function shimmer(dur) {
    const hp = new Biquad('hp', 2200, 0.7);
    return make(dur, (t) => {
      const u = t / dur;
      return hp.run(noise()) * Math.sin(u * Math.PI) ** 2 * (0.5 + 0.5 * Math.sin(t * 9)) * 0.9;
    });
  }
  // a low push under a cut, felt more than heard
  function sub(f = 54, dur = 0.5) {
    return make(dur, (t) => Math.sin(TAU * f * t * (1 - t * 0.3)) * Math.exp(-t * 7) * 0.8);
  }

  // ---- cue sheet ----
  const r2 = rng(4242);

  // a very quiet room under the whole thing, so the cuts are not into dead air
  const air = new Biquad('lp', 620, 0.7);
  for (let i = 0; i < n; i++) {
    const v = air.run(noise()) * 0.0055;
    L[i] += v; R[i] += v * 0.92;
  }

  // Beat 1 - the mark assembles, then resolves
  add(0.0, whoosh(1.1, 300, 1500, 0.9), 0.3, 0);
  for (let i = 0; i < 26; i++) {
    const t = T.markIn + i * 0.045 + r2() * 0.03;
    add(t, tick(2600 + r2() * 2600), 0.1 + r2() * 0.1, (r2() - 0.5) * 1.3);
  }
  add(T.markResolve, blip(720, [1, 1.5, 2]), 0.42, 0, 0.16);
  add(T.markResolve + 0.02, thunk(), 0.4, 0);
  add(T.markResolve, sub(60), 0.3, 0);
  for (let i = 0; i < 10; i++) add(T.title + i * 0.036, fold(), 0.1 + r2() * 0.05, (i / 10 - 0.5) * 1.1);
  add(T.sub - 0.05, whoosh(0.5, 900, 300, 1.4), 0.14, 0.2);
  for (let i = 0; i < 6; i++) add(T.sub + i * 0.16, fold(), 0.05, -0.3);

  // Beat 1 -> 2, the curtain sweeps across
  add(T.b1Out - 0.05, whoosh(0.7, 240, 2600, 0.8), 0.4, -0.5);
  for (let i = 0; i < 20; i++) add(T.b1Out + i * 0.026, tick(1800 + r2() * 3200), 0.12, -0.6 + i * 0.06);
  add(T.b2, sub(44, 0.7), 0.42, 0);

  // Beat 2 - pixels flicker into letters
  for (let i = 0; i < 34; i++) add(T.joinIn + i * 0.034 + r2() * 0.02, tick(2200 + r2() * 3400), 0.09 + r2() * 0.08, (r2() - 0.5) * 1.5);
  add(T.joinResolve, blip(560, [1, 1.33, 2, 2.66], 0.22), 0.46, 0, 0.2);
  add(T.joinResolve + 0.02, thunk(), 0.45, 0);
  add(T.joinResolve, sub(52), 0.32, 0);
  add(T.b2Out - 0.08, whoosh(0.85, 2800, 200, 0.8), 0.36, 0.4);
  for (let i = 0; i < 16; i++) add(T.b2Out + i * 0.03, tick(900 + r2() * 4200), 0.11, (r2() - 0.5) * 1.6);

  // Beat 3 - typing, then the code lifts off and becomes the map
  add(T.b3, sub(48, 0.6), 0.3, 0);
  for (let t = T.codeScroll; t < T.lift - 0.05; t += 0.1 + r2() * 0.08) add(t, click(0.85 + r2() * 0.3), 0.18 + r2() * 0.08, -0.25);
  add(T.lift, whoosh(1.15, 320, 2400, 0.95), 0.42, 0);
  for (let i = 0; i < 40; i++) add(T.lift + 0.1 + i * 0.028 + r2() * 0.02, tick(2400 + r2() * 4000), 0.07 + r2() * 0.06, (r2() - 0.5) * 1.7);
  add(T.mapResolve, blip(640, [1, 1.5, 2, 3], 0.26), 0.5, 0, 0.22);
  add(T.mapResolve + 0.02, thunk(), 0.5, 0);
  add(T.mapResolve, sub(46, 0.7), 0.4, 0);
  for (let i = 0; i < 22; i++) add(T.dots + i * 0.07 + r2() * 0.05, blip(1500 + r2() * 900, [1], 0.06), 0.055, (r2() - 0.5) * 1.6, 0.25);
  for (const s of [T.stat1, T.stat2, T.stat3]) {
    add(s, click(1.2), 0.24, 0);
    for (let i = 0; i < 7; i++) add(s + i * 0.03, fold(), 0.09, (i / 7 - 0.5));
  }
  add(T.b3Out, whoosh(0.7, 1800, 260, 1), 0.3, -0.3);

  // Beat 4 - each keystroke throws a pixel that unfolds into the interface
  add(T.b4, sub(50, 0.6), 0.28, 0);
  const pieceKeys = new Set(UI_PIECES.map(([i]) => i));
  KEYS.forEach((k, i) => {
    add(k, click(0.9 + r2() * 0.4), 0.26, -0.3 + r2() * 0.2);
    if (!pieceKeys.has(i)) return;
    add(k + 0.01, whoosh(0.34, 700, 2600, 1.3), 0.16, 0.1);
    add(k + 0.3, fold(), 0.26, (r2() - 0.5) * 0.9);
    add(k + 0.31, blip(900 + r2() * 300, [1, 1.5], 0.1), 0.14, (r2() - 0.5) * 0.9, 0.18);
  });
  add(T.uiGlow, shimmer(1.1), 0.16, 0, 0.3);
  add(T.uiGlow, blip(520, [1, 1.25, 1.5, 2], 0.3), 0.3, 0, 0.26);
  add(T.pullBack - 0.05, whoosh(1.3, 2200, 300, 0.85), 0.3, 0);
  add(T.pullBack + 0.4, thunk(), 0.3, -0.4);
  for (let i = 0; i < 12; i++) add(T.team + i * 0.03, fold(), 0.12, (i / 12 - 0.5) * 1.2);
  add(T.b4Out, whoosh(0.6, 1400, 300, 1.1), 0.26, 0.3);

  // End card
  {
    for (let i = 0; i < 3; i++) add(T.endFold + i * 0.12, fold(), 0.3, i - 1);
    add(T.endFold, whoosh(0.8, 260, 900, 1.2), 0.2, 0);
    add(T.endMark, thunk(), 0.42, 0);
    add(T.endMark, blip(700, [1, 1.5], 0.14), 0.22, 0, 0.2);
    for (let i = 0; i < 10; i++) add(T.endTitle + i * 0.033, fold(), 0.13, (i / 10 - 0.5) * 1.1);
    add(T.endUrl + 0.16, thunk(), 0.34, 0);
    add(T.endUrl + 0.16, blip(600, [1, 1.33, 2], 0.2), 0.3, 0, 0.24);
    for (let i = 0; i < 14; i++) add(T.endSpark + r2() * 0.55, blip(1800 + r2() * 1600, [1], 0.05), 0.07, (r2() - 0.5) * 1.7, 0.3);
  }

  // ---- small room on the send (comb + allpass) ----
  const combs = [[1279, 0.74], [1543, 0.72], [1811, 0.7], [2113, 0.68]];
  const ap = [[229, 0.6], [443, 0.55]];
  const wet = new Float32Array(n);
  for (const [d, g] of combs) {
    const buf = new Float32Array(d);
    let p = 0;
    for (let i = 0; i < n; i++) {
      const v = buf[p];
      wet[i] += v * 0.25;
      buf[p] = verb[i] + v * g;
      p = (p + 1) % d;
    }
  }
  for (const [d, g] of ap) {
    const buf = new Float32Array(d);
    let p = 0;
    for (let i = 0; i < n; i++) {
      const v = buf[p];
      const out = -g * wet[i] + v;
      buf[p] = wet[i] + v * g;
      wet[i] = out;
      p = (p + 1) % d;
    }
  }
  const hp = new Biquad('hp', 260, 0.7);
  for (let i = 0; i < n; i++) {
    const v = hp.run(wet[i]) * 0.5;
    L[i] += v; R[i] += v * 0.95;
  }

  // normalise to about -1 dBFS
  let peak = 1e-6;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const g = 0.891 / peak;
  for (let i = 0; i < n; i++) { L[i] *= g; R[i] *= g; }
  return { L, R, n };
}

function writeWav(file) {
  const { L, R, n } = render();
  const data = Buffer.alloc(n * 4);
  for (let i = 0; i < n; i++) {
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(L[i] * 32767))), i * 4);
    data.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(R[i] * 32767))), i * 4 + 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0); head.writeUInt32LE(36 + data.length, 4); head.write('WAVE', 8);
  head.write('fmt ', 12); head.writeUInt32LE(16, 16); head.writeUInt16LE(1, 20); head.writeUInt16LE(2, 22);
  head.writeUInt32LE(SR, 24); head.writeUInt32LE(SR * 4, 28); head.writeUInt16LE(4, 32); head.writeUInt16LE(16, 34);
  head.write('data', 36); head.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([head, data]));
  return file;
}

module.exports = { writeWav };
