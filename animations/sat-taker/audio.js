// Sound: the narration over synthesised rainforest ambience, keyboard and paper
// foley, the toucan and sparkles. The jungle and foley duck under the voice.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const ffmpeg = require('ffmpeg-static');
const { rng } = require('../korah-not-cooked/paper');
const { T, KEYS, score, SPARKS } = require('./timeline');
const { S: FOREST, LAP_GLOW } = require('./forest');

const SR = 48000;
const TAU = Math.PI * 2;
const GAIN = 1.0;   // master drive before the limiter, tuned for about -14 LUFS
const NARRATION = path.join(__dirname, 'assets/narration.mp3');

// The whole recording, with short fades at both ends.
function narration() {
  const raw = execFileSync(ffmpeg, ['-v', 'error', '-i', NARRATION, '-ac', '1', '-ar', String(SR), '-f', 'f32le', '-'], { maxBuffer: 1 << 26 });
  const v = new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
  const fin = 0.02 * SR, fout = 0.08 * SR;
  for (let i = 0; i < v.length; i++) v[i] *= Math.min(1, i / fin, (v.length - i) / fout);
  return v;
}
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
  const rand = rng(2026);
  const noise = () => rand() * 2 - 1;

  // write a mono voice into a bus with pan (-1..1) and reverb send
  function add(t0, buf, gain, pan = 0, send = 0.1, bus = [L, R]) {
    const i0 = Math.round(t0 * SR);
    const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
    for (let i = 0; i < buf.length; i++) {
      const j = i0 + i;
      if (j < 0 || j >= n) continue;
      bus[0][j] += buf[i] * gl; bus[1][j] += buf[i] * gr; verb[j] += buf[i] * gain * send;
    }
  }
  const make = (sec, fn) => { const b = new Float32Array(Math.round(sec * SR)); for (let i = 0; i < b.length; i++) b[i] = fn(i / SR, i); return b; };

  // ---- voices ----
  // crackly paper: short grains at a rate that follows an envelope
  function rustle(dur, rate, bright = 1, env = (u) => Math.sin(Math.PI * u)) {
    const b = new Float32Array(Math.round(dur * SR));
    const hp = new Biquad('hp', 1500 * bright, 0.7), bp = new Biquad('bp', 3000 * bright, 0.8);
    for (let i = 0; i < b.length; i++) b[i] = bp.run(hp.run(noise())) * 0.18 * env(i / b.length);
    let t = 0;
    while (t < dur) {
      t += -Math.log(1 - rand() + 1e-9) / (rate * (0.2 + env(t / dur)));
      if (t >= dur) break;
      const g = new Biquad('bp', (1500 + rand() * 5000) * bright, 1.5 + rand() * 2);
      const len = Math.round((0.002 + rand() * 0.008) * SR), amp = (0.3 + rand() * 0.7) * env(t / dur);
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
  // voiced "uhhh" through formants: the SAT Taker's groan
  function groan(dur, f0 = 118) {
    const f1 = new Biquad('bp', 620, 5), f2 = new Biquad('bp', 1150, 6), f3 = new Biquad('bp', 2450, 6);
    let ph = 0;
    return make(dur, (t) => {
      const u = t / dur;
      ph += (TAU * f0 * (1 - 0.22 * u) * (1 + 0.012 * Math.sin(TAU * 5.5 * t))) / SR;
      const src = (((ph / TAU) % 1) * 2 - 1) * 0.6 + noise() * 0.25;
      const env = Math.min(1, t / 0.12) * Math.pow(1 - u, 1.2);
      return (f1.run(src) + f2.run(src) * 0.6 + f3.run(src) * 0.25) * env;
    });
  }
  // breathy exhale through moving formants
  function sigh(dur, bright = 1, voiced = 0.12) {
    const f1 = new Biquad('bp', 650, 4), f2 = new Biquad('bp', 1150, 5), f3 = new Biquad('bp', 2500, 5), air = new Biquad('hp', 1800, 0.7);
    let ph = 0;
    return make(dur, (t, i) => {
      const u = t / dur;
      if (i % 64 === 0) { f1.set((650 - 180 * u) * bright, 4); f2.set((1150 - 250 * u) * bright, 5); f3.set(2500 * bright, 5); }
      const env = Math.min(1, t / 0.14) * Math.pow(1 - u, 1.4);
      const x = noise();
      ph += (TAU * (150 - 45 * u)) / SR;
      const src = x + (Math.sin(ph) + 0.5 * Math.sin(2 * ph)) * voiced * Math.min(1, t / 0.25);
      return (f1.run(src) + f2.run(src) * 0.7 + f3.run(src) * 0.35 + air.run(x) * 0.25) * env;
    });
  }
  function tok(f) {
    return make(0.12, (t) => Math.sin(TAU * f * t) * Math.exp(-t / 0.018) + Math.sin(TAU * f * 2.01 * t) * Math.exp(-t / 0.008) * 0.4 + noise() * Math.exp(-t / 0.0015) * 0.3);
  }
  function tick() { return make(0.03, (t) => Math.sin(TAU * 2300 * t) * Math.exp(-t / 0.004)); }
  function bell(f, dur = 2.4) {
    const parts = [[1, 1, 1.6], [2.76, 0.32, 0.6], [5.4, 0.14, 0.3], [0.5, 0.22, 1.2]];
    return make(dur, (t) => Math.min(1, t / 0.004) * parts.reduce((s, [r, a, d]) => s + Math.sin(TAU * f * r * t) * a * Math.exp(-t / d), 0));
  }
  // tiny glassy ping for sparkles
  function ping(f) {
    return make(0.9, (t) => Math.min(1, t / 0.002) * (Math.sin(TAU * f * t) * Math.exp(-t / 0.22) + Math.sin(TAU * f * 2.98 * t) * 0.25 * Math.exp(-t / 0.08)));
  }
  // noise swept upward: whoosh
  function whoosh(dur, lo, hi) {
    const bp = new Biquad('bp', lo, 1.4);
    return make(dur, (t, i) => {
      const u = t / dur;
      if (i % 32 === 0) bp.set(lo * Math.pow(hi / lo, u), 1.4);
      return bp.run(noise()) * Math.sin(Math.PI * u) ** 1.5;
    });
  }
  // birds and frogs
  function whistle(f0, f1, dur, vib = 0) {
    let ph = 0;
    return make(dur, (t) => {
      const u = t / dur;
      ph += (TAU * (f0 + (f1 - f0) * u) * (1 + vib * Math.sin(TAU * 28 * t))) / SR;
      return Math.sin(ph) * Math.sin(Math.PI * u) ** 0.7;
    });
  }
  function croak() {
    const f1 = new Biquad('bp', 850, 4), f2 = new Biquad('bp', 1900, 5);
    return make(0.16, (t) => {
      const pulse = (t * 85) % 1 < 0.12 ? 1 : 0;
      const env = Math.sin(Math.PI * t / 0.16);
      return (f1.run(pulse) * 2 + f2.run(pulse)) * env;
    });
  }

  // ---- jungle bed ----
  const insectA = new Biquad('bp', 4600, 7), insectB = new Biquad('bp', 6300, 8);
  const leafHp = new Biquad('hp', 1400, 0.7), leafBp = new Biquad('bp', 2800, 0.7), leafBp2 = new Biquad('bp', 3200, 0.7);
  const waterLp = new Biquad('lp', 900, 0.7);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const env = Math.min(1, t / 0.4) * Math.max(0, Math.min(1, (T.fade[1] + 0.3 - t) / 0.8));
    const ia = insectA.run(noise()) * (0.5 + 0.5 * Math.sin(TAU * 38 * t)) * (0.7 + 0.3 * Math.sin(TAU * 0.13 * t));
    const ib = insectB.run(noise()) * (Math.sin(TAU * 55 * t) > 0.3 ? 1 : 0) * (0.5 + 0.5 * Math.sin(TAU * 0.21 * t + 1));
    const gust = 0.5 + 0.5 * Math.sin(TAU * 0.11 * t) * Math.sin(TAU * 0.047 * t + 2);
    const lv = leafHp.run(noise());
    const w = waterLp.run(noise());
    L[i] += (ia * 0.05 + ib * 0.02 + leafBp.run(lv) * 0.035 * gust + w * 0.02) * env;
    R[i] += (ia * 0.035 + ib * 0.03 + leafBp2.run(lv) * 0.035 * gust + w * 0.03) * env;
  }
  // babbling stream off to the right: little pitch-gliding blips
  for (let t = 0.1; t < T.fade[1]; t += 0.03 + rand() * 0.07) {
    const f = 500 + rand() * 800;
    add(t, make(0.03 + rand() * 0.03, (u) => Math.sin(TAU * f * (1 + u * 6) * u) * Math.sin(Math.PI * u / 0.06)), 0.012, 0.55, 0.3);
  }
  // crickets
  for (let t = 0.3; t < T.fade[1]; t += 0.62) for (let k = 0; k < 3; k++) add(t + k * 0.05, whistle(4900, 4800, 0.03), 0.012, -0.6, 0.1);
  // birds: songbirds, a distant screaming piha, toucan croaks, frogs
  const bird = (t, pan, g) => { const b = 2200 + rand() * 1200; for (let k = 0; k < 3 + Math.floor(rand() * 3); k++) add(t + k * 0.13, whistle(b * (1 + rand() * 0.3), b * (1.3 + rand() * 0.3), 0.09, 0.02), g, pan, 0.2); };
  [0.2, 2.6, 6.1, 9.2, 12.4, 16.8, 21.2, 24.6, 27.4].forEach((t, i) => bird(t, i % 2 ? 0.6 : -0.5, 0.05));
  const piha = (t, pan) => { add(t, whistle(1500, 2700, 0.32), 0.05, pan, 0.45); add(t + 0.42, whistle(1600, 2800, 0.32), 0.05, pan, 0.45); add(t + 0.86, whistle(2600, 1300, 0.45), 0.055, pan, 0.45); };
  piha(1.2, 0.7); piha(10.8, -0.7);
  [3.7, 9.6, 16.4].forEach((t, i) => { for (let k = 0; k < 3; k++) add(t + k * 0.26, croak(), 0.05, i % 2 ? -0.75 : 0.75, 0.4); });
  for (let t = 0.5; t < T.fade[1]; t += 0.9 + rand() * 1.6) add(t, whistle(1900, 2100, 0.025), 0.02, (rand() - 0.5) * 1.4, 0.2);

  // ---- foley and cues ----
  for (const [k, hand] of KEYS) add(k, keyClick(rand()), 0.16 + rand() * 0.05, hand ? -0.1 : -0.2, 0.04);
  T.groans.forEach((t, i) => add(t, groan(0.65 - i * 0.15, 122 - i * 8), 0.2, -0.25, 0.08));
  add(T.tag, fwip(0.3, 500, 2600), 0.2, -0.2, 0.15); add(T.tag + 0.35, tok(620), 0.1, -0.2, 0.2);
  add(T.low, fwip(0.4, 1200, 3200), 0.1, -0.2, 0.05);
  add(T.slump + 0.2, sigh(1.2), 0.2, -0.2, 0.15);
  // face-plant on the keyboard
  add(T.mash - 0.05, thud(110), 0.14, -0.15, 0.1);
  for (let i = 0; i < 9; i++) add(T.mash - 0.04 + rand() * 0.14, keyClick(rand()), 0.14, -0.15 + rand() * 0.1, 0.05);
  add(T.croak, croak(), 0.22, 0.3, 0.3); add(T.croak + 0.3, croak(), 0.2, 0.3, 0.3);
  add(T.rustle, rustle(T.emerge + 0.35 - T.rustle, 110, 0.8), 0.32, 0.35, 0.1);
  add(T.emerge + 0.05, fwip(0.3, 400, 2400), 0.28, 0.35, 0.15); add(T.emerge + 0.1, thud(120), 0.14, 0.35);

  // the Mac lights up: whoosh, a rising cascade of pings, then a soft twinkle bed
  const PENTA = [0, 2, 4, 7, 9];
  const note = (k) => 880 * Math.pow(2, (PENTA[k % 5] + 12 * Math.floor(k / 5)) / 12);
  add(T.glow - 0.25, whoosh(0.7, 500, 7000), 0.2, 0.25, 0.3);
  SPARKS.forEach(([t, x], i) => add(t, ping(i < 14 ? note(i + 2) : note(5 + Math.floor(rand() * 8))), i < 14 ? 0.07 : 0.035, Math.max(-1, Math.min(1, x / 300)), 0.5));
  const shim = make(T.fade[1] - T.glow, (t) => {
    const env = Math.min(1, t / 0.6) * Math.min(1, (T.fade[1] - T.glow - t) / 0.6);
    return [2637, 3136, 3520, 4186].reduce((s, f, k) => s + Math.sin(TAU * f * t + k) * (0.5 + 0.5 * Math.sin(TAU * (3 + k) * t)), 0) * env;
  });
  add(T.glow, shim, 0.006, 0.2, 0.5);
  T.cards.forEach((t, i) => { add(t, fwip(0.16, 800, 3200), 0.12, 0.25); add(t + 0.4, tok(880 + i * 120), 0.08, 0.25, 0.2); });

  // bloom: flowers pop in a wave, whoosh of warm air
  add(T.bloom[0] - 0.1, whoosh(1.2, 300, 3000), 0.12, 0, 0.4);
  for (const f of FOREST.flowers) add(T.bloom[0] + f.d / 900, tok(500 + (1 - f.d / 1200) * 500), 0.05, (f.x - LAP_GLOW.x) / 700, 0.2);
  let last = score(T.count[0]);
  for (let t = T.count[0]; t <= T.count[1]; t += 0.002) {
    const s = score(t);
    if (s !== last) { add(t, tick(), 0.08, -0.25, 0.1); last = s; }
  }
  add(T.chime, bell(1318.5), 0.08, -0.1, 0.4);
  add(T.chime + 0.11, bell(1975.5), 0.06, 0.05, 0.4);

  // cheer: pages and leaves swirl up, the old laptop snaps shut, the toucan clacks
  add(T.chime, whoosh(1.4, 400, 5000), 0.18, 0, 0.3);
  add(T.chime + 0.1, rustle(1.3, 140, 1, (u) => Math.sin(Math.PI * u) * (1 - u * 0.4)), 0.25, 0, 0.2);
  add(T.cheer + 0.1, sigh(0.7, 1.3, 0.3), 0.18, -0.2, 0.15);
  add(T.lid + 0.28, thud(150), 0.18, -0.05); add(T.lid + 0.28, tok(1300), 0.1, -0.05); add(T.lid + 0.4, tok(1500), 0.04, -0.05);
  for (let i = 0; i < 4; i++) add(T.cheer + 0.05 + i * 0.125, tok(1700 - i * 60), 0.05, 0.3, 0.2);
  add(T.cheer + 0.05, rustle(0.4, 90, 1.2), 0.12, 0.3, 0.2);

  // end card
  for (let i = 0; i < 16; i += 2) add(T.title + i * 0.065 + (i >= 6 ? 0.12 : 0) + (i >= 9 ? 0.12 : 0), fwip(0.12, 900, 3600), 0.14, -0.3 + i * 0.04);
  add(T.endTag, fwip(0.22, 600, 2800), 0.26, 0);
  add(T.endTag + 0.25, bell(1046.5, 3), 0.07, -0.05, 0.45);
  add(T.endTag + 0.36, bell(1568, 3), 0.055, 0.05, 0.45);

  // ---- open-air reverb on the send (comb + allpass) ----
  const reverb = (delays, ap) => {
    const out = new Float32Array(n);
    for (const d of delays) {
      const buf = new Float32Array(d); let p = 0, f = 0;
      for (let i = 0; i < n; i++) { const y = buf[p]; f = y * 0.6 + f * 0.4; buf[p] = verb[i] + f * 0.8; p = (p + 1) % d; out[i] += y / delays.length; }
    }
    for (const d of ap) {
      const buf = new Float32Array(d); let p = 0;
      for (let i = 0; i < n; i++) { const b = buf[p]; const y = -out[i] + b; buf[p] = out[i] + b * 0.5; p = (p + 1) % d; out[i] = y; }
    }
    return out;
  };
  const vl = reverb([1913, 2087, 1777, 1621], [225, 556]), vr = reverb([1951, 2111, 1811, 1663], [248, 579]);
  // ---- narrator: dry and up front; everything else ducks under it ----
  const voice = narration(), hp = new Biquad('hp', 70, 0.7);
  let vpk = 0;
  for (let i = 0; i < voice.length; i++) { voice[i] = hp.run(voice[i]); vpk = Math.max(vpk, Math.abs(voice[i])); }
  const i0 = Math.round(T.narr * SR);
  let env = 0, peak = 0;
  for (let i = 0; i < n; i++) {
    const v = i >= i0 && i - i0 < voice.length ? (voice[i - i0] * 0.62) / vpk : 0;
    const a = Math.abs(v);
    env = a > env ? env + (a - env) * 0.002 : env * 0.99995;
    const duck = 1 - Math.min(0.5, env * 3);
    L[i] = (L[i] + vl[i] * 0.8) * duck + v; R[i] = (R[i] + vr[i] * 0.8) * duck + v;
    peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  }
  // bring it up to phone loudness; a 4ms look-ahead limiter catches the peaks
  const drive = GAIN / peak, CEIL = 0.93, LOOK = 192, rel = 1 / (0.08 * SR);
  const need = new Float32Array(n);
  for (let i = 0; i < n; i++) need[i] = Math.min(1, CEIL / (Math.max(Math.abs(L[i]), Math.abs(R[i])) * drive + 1e-9));
  let g = 1;
  for (let i = 0; i < n; i++) {
    let m = 1;
    for (let k = i; k < Math.min(n, i + LOOK); k++) if (need[k] < m) m = need[k];
    g = m < g ? m : g + (m - g) * rel;
    L[i] *= drive * g; R[i] *= drive * g;
  }
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
