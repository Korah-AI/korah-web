// Synthesised sound: crickets, house creaks, taps on glass, a blanket, footsteps,
// a lamp switch and paper folds. No samples, no music, no narration.
const fs = require('fs');
const { rng } = require('./paper');
const { T, STEPS, SWIPES, AMB } = require('./timeline');

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
  const rand = rng(3141);
  const noise = () => rand() * 2 - 1;

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
  // a cricket: a few short pulses of a narrow band tone
  function chirp(f, pulses) {
    const bp = new Biquad('bp', f, 14);
    const gap = 0.032;
    return make(pulses * gap + 0.04, (t) => {
      const k = Math.floor(t / gap);
      if (k >= pulses) return 0;
      const u = t - k * gap;
      const env = u < 0.019 ? Math.sin((u / 0.019) * Math.PI) ** 1.6 : 0;
      return bp.run(noise()) * env * 2.4;
    });
  }
  // wood settling: a low groan that slides while it decays
  function creak(f, dur) {
    const bp = new Biquad('bp', f, 9), bp2 = new Biquad('bp', f * 2.7, 7);
    return make(dur, (t, i) => {
      const u = t / dur;
      if (i % 64 === 0) { bp.set(f * (1 + u * 0.5), 9); bp2.set(f * 2.7 * (1 + u * 0.4), 7); }
      const env = Math.sin(Math.PI * Math.min(1, u * 1.3)) * (1 - u * 0.4);
      const grit = 1 + 0.6 * Math.sin(TAU * (18 + 9 * u) * t);
      const x = noise() * grit;
      return (bp.run(x) * 1.0 + bp2.run(x) * 0.4) * env;
    });
  }
  // fingertip on glass: soft, dull, almost no click
  function tap() {
    const bp = new Biquad('bp', 1800, 1.1), lp = new Biquad('lp', 900, 0.8);
    return make(0.07, (t) => bp.run(noise()) * Math.exp(-t / 0.0035) * 0.7 + lp.run(noise()) * Math.exp(-t / 0.012) * 0.5);
  }
  function swipe(dur = 0.16) {
    const bp = new Biquad('bp', 900, 0.9);
    return make(dur, (t, i) => {
      const u = t / dur;
      if (i % 32 === 0) bp.set(900 + 1800 * u, 0.9);
      return bp.run(noise()) * Math.sin(Math.PI * u) * 0.5;
    });
  }
  // the faint electrical whine of a screen held close
  function whine(dur) {
    return make(dur, (t) => {
      const env = Math.min(1, t / 0.5) * Math.min(1, (dur - t) / 0.5);
      return (Math.sin(TAU * 2480 * t + Math.sin(t * 3) * 0.4) * 0.5 + Math.sin(TAU * 4960 * t) * 0.18) * env;
    });
  }
  function rustle(dur, rate, bright = 1, env = (u) => Math.sin(Math.PI * u)) {
    const b = new Float32Array(Math.round(dur * SR));
    const hp = new Biquad('hp', 1500 * bright, 0.7), bp = new Biquad('bp', 3000 * bright, 0.8);
    for (let i = 0; i < b.length; i++) b[i] = bp.run(hp.run(noise())) * 0.18 * env(i / b.length);
    let t = 0;
    while (t < dur) {
      const e = env(t / dur);
      t += -Math.log(1 - rand() + 1e-9) / (rate * (0.2 + e));
      if (t >= dur) break;
      const g = new Biquad('bp', (1400 + rand() * 4600) * bright, 1.5 + rand() * 2);
      const len = Math.round((0.002 + rand() * 0.009) * SR), amp = (0.3 + rand() * 0.7) * e;
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
  function thud(f = 95, dur = 0.25, dec = 0.045) {
    const lp = new Biquad('lp', 520, 0.7);
    return make(dur, (t) => Math.sin(TAU * f * t * (1 - t * 0.8)) * Math.exp(-t / dec) * 0.9 + lp.run(noise()) * Math.exp(-t / 0.03) * 0.5);
  }
  // a foot on a wooden floor: a soft body plus the scuff of a sole
  function step() {
    const lp = new Biquad('lp', 380, 0.8), bp = new Biquad('bp', 2100, 1.2);
    return make(0.22, (t) => lp.run(noise()) * Math.exp(-t / 0.028) * 1.4
      + Math.sin(TAU * 78 * t) * Math.exp(-t / 0.035) * 0.5
      + bp.run(noise()) * Math.exp(-t / 0.008) * 0.25);
  }
  // sharp inhale through the teeth
  function gasp(dur = 0.4) {
    const f1 = new Biquad('bp', 900, 3), air = new Biquad('hp', 2400, 0.7);
    return make(dur, (t, i) => {
      const u = t / dur;
      if (i % 64 === 0) f1.set(900 + 1500 * u, 3);
      const env = Math.pow(Math.min(1, u * 3.5), 1.2) * Math.pow(1 - u, 0.8);
      const x = noise();
      return (f1.run(x) * 0.9 + air.run(x) * 0.6) * env;
    });
  }
  // the phone buzzing in their hand, then the notification tone
  function buzz(dur = 0.34) {
    const lp = new Biquad('lp', 260, 0.9);
    return make(dur, (t) => {
      const env = Math.min(1, t / 0.02) * Math.max(0, 1 - t / dur);
      const rip = 0.6 + 0.4 * Math.sin(TAU * 42 * t);
      return lp.run(Math.sign(Math.sin(TAU * 58 * t)) * rip + noise() * 0.3) * env;
    });
  }
  function blip(f, dur = 0.22) {
    return make(dur, (t) => {
      const env = Math.min(1, t / 0.004) * Math.exp(-t / 0.055);
      return (Math.sin(TAU * f * t) + Math.sin(TAU * f * 2 * t) * 0.25) * env;
    });
  }

  // a rocker switch: two hard little transients
  function switchClick() {
    const bp = new Biquad('bp', 3200, 1.6), body = new Biquad('bp', 1400, 4);
    return make(0.1, (t) => {
      const hit = (u) => bp.run(noise() * Math.exp(-u / 0.0009)) * 1.2 + body.run(noise() * Math.exp(-u / 0.005)) * 0.7;
      let s = hit(t);
      if (t > 0.018) s += hit(t - 0.018) * 0.55;
      return s;
    });
  }

  // ---- cue sheet ----
  // room tone
  const lp = new Biquad('lp', 300, 0.7);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    brown = (brown + noise() * 0.02) * 0.995;
    const env = Math.min(1, t / 0.8) * Math.max(0, Math.min(1, (T.fade[1] - t) / 1.2));
    const s = lp.run(brown) * 0.06 * env;
    L[i] += s; R[i] += s;
  }
  // crickets outside, wide and far off
  AMB.chirps.forEach(([t0, f, g], i) => {
    const away = Math.max(0, Math.min(1, (T.fade[0] - t0) / 1.5));
    add(t0, chirp(f, 3 + (i % 2)), 0.016 * g * away, i % 2 ? -0.85 : 0.85, 0.5);
  });
  for (const [t0, f, g] of AMB.creaks) add(t0, creak(f, 0.9 + g * 0.6), 0.075 * g, (rand() - 0.5) * 1.2, 0.3);

  // the phone, close to the ear
  add(0.1, whine(T.open - 0.1), 0.007, 0.1, 0.02);
  for (const s of SWIPES) { add(s, swipe(), 0.075, 0.12, 0.04); add(s + 0.01, tap(), 0.065, 0.12, 0.04); }
  for (let t0 = 0.9; t0 < T.bolt; t0 += 0.7 + rand() * 0.9) add(t0, tap(), 0.04, 0.1, 0.04);

  // the reminder that stops the scroll
  add(T.notify, buzz(0.36), 0.2, 0.12, 0.12);
  add(T.notify + 0.04, blip(988), 0.1, 0.12, 0.2);
  add(T.notify + 0.13, blip(1319), 0.085, 0.12, 0.2);

  // she reads it, then it lands
  add(T.realise, gasp(0.45), 0.26, 0, 0.3);
  add(T.bolt, creak(120, 0.7), 0.22, -0.2, 0.25);
  add(T.bolt + 0.02, rustle(0.75, 150, 1.05, (u) => Math.pow(1 - u, 0.8)), 0.36, -0.15, 0.25);
  add(T.bolt + 0.06, fwip(0.3, 500, 2800), 0.34, -0.1, 0.25);
  add(T.bolt + 1.05, rustle(0.4, 90, 0.9), 0.2, 0.05, 0.2);
  add(T.edge, rustle(0.3, 80, 0.9), 0.16, -0.1, 0.2);
  add(T.stand, thud(70, 0.3, 0.05), 0.2, -0.05, 0.25);
  for (const s of STEPS) add(s, step(), 0.24, -0.05 + (s - STEPS[0]) * 0.22, 0.28);

  // the lamp
  add(T.lamp, switchClick(), 0.34, 0.3, 0.2);
  add(T.lamp + 0.02, thud(150, 0.12, 0.02), 0.06, 0.3, 0.15);
  add(T.sit, creak(210, 0.5), 0.15, 0.15, 0.2);
  add(T.sit + 0.04, thud(60, 0.22, 0.05), 0.14, 0.15, 0.2);

  // Korah opens and the cards fold out
  add(T.open, tap(), 0.09, 0.15, 0.05);
  add(T.open + 0.04, fwip(0.26, 600, 3000), 0.24, 0.1, 0.22);
  T.cards.forEach((t0, i) => {
    add(t0, fwip(0.22, 700 + i * 120, 3400), 0.28, 0.05 + i * 0.06, 0.24);
    add(t0 + 0.42, tap(), 0.07, 0.1, 0.08);
  });
  add(T.focus, rustle(0.35, 70, 0.85), 0.1, 0, 0.2);

  // end cards
  for (let i = 0; i < 18; i += 2) add(T.line1 + i * 0.05, fwip(0.12, 900, 3600), 0.11, -0.3 + i * 0.035, 0.2);
  add(T.swap, fwip(0.2, 1200, 500), 0.16, 0, 0.2);
  for (let i = 0; i < 24; i += 3) add(T.line2 + i * 0.05, fwip(0.12, 900, 3600), 0.11, -0.3 + i * 0.026, 0.2);
  add(T.store, fwip(0.24, 600, 2800), 0.2, 0, 0.25);

  // ---- small room reverb on the send (comb + allpass) ----
  const reverb = (delays, ap) => {
    const out = new Float32Array(n);
    for (const d of delays) {
      const buf = new Float32Array(d); let p = 0, f = 0;
      for (let i = 0; i < n; i++) { const y = buf[p]; f = y * 0.7 + f * 0.3; buf[p] = verb[i] + f * 0.76; p = (p + 1) % d; out[i] += y / delays.length; }
    }
    for (const d of ap) {
      const buf = new Float32Array(d); let p = 0;
      for (let i = 0; i < n; i++) { const b = buf[p]; const y = -out[i] + b; buf[p] = out[i] + b * 0.5; p = (p + 1) % d; out[i] = y; }
    }
    return out;
  };
  const vl = reverb([1557, 1617, 1491, 1422], [225, 556]), vr = reverb([1580, 1640, 1514, 1445], [248, 579]);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    L[i] = Math.tanh((L[i] + vl[i] * 0.85) * 1.6);
    R[i] = Math.tanh((R[i] + vr[i] * 0.85) * 1.6);
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
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
