// Paper-cut drawing helpers: seeded randomness, hand-cut edges, grain, easing.
const { createCanvas, Path2D } = require('@napi-rs/canvas');

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- easing -------------------------------------------------------------
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a, b, t) => a + (b - a) * t;
const span = (t, a, b) => clamp01((t - a) / (b - a));
const inOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const outCubic = (t) => 1 - Math.pow(1 - t, 3);
const outBack = (t, k = 1.7) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
// damped spring from 0 to 1 over t in seconds, settles with a small wobble
const spring = (t, f = 1.6, d = 5.5) =>
  t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(2 * Math.PI * f * t);

function mixHex(a, b, t) {
  const pa = parseHex(a), pb = parseHex(b);
  return `rgb(${Math.round(lerp(pa[0], pb[0], t))},${Math.round(lerp(pa[1], pb[1], t))},${Math.round(lerp(pa[2], pb[2], t))})`;
}
function parseHex(h) {
  if (h.startsWith('rgb')) return h.match(/\d+/g).map(Number);
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ---- grain texture ---------------------------------------------------------
function makeGrain(size = 512, seed = 11) {
  const c = createCanvas(size, size);
  const x = c.getContext('2d');
  const r = rng(seed);
  const img = x.createImageData(size, size);
  const grid = (cell) => {
    const n = size / cell;
    const g = new Float32Array(n * n).map(() => r());
    return (px, py) => {
      const fx = px / cell, fy = py / cell;
      const x0 = Math.floor(fx), y0 = Math.floor(fy);
      const tx = fx - x0, ty = fy - y0;
      const at = (i, j) => g[((j % n) + n) % n * n + (((i % n) + n) % n)];
      const a = lerp(at(x0, y0), at(x0 + 1, y0), tx);
      const b = lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx);
      return lerp(a, b, ty);
    };
  };
  const big = grid(64), mid = grid(16), small = grid(4);
  for (let y = 0; y < size; y++) {
    for (let px = 0; px < size; px++) {
      const v = 255 - (big(px, y) * 10 + mid(px, y) * 9 + small(px, y) * 7 + r() * 9);
      const i = (y * size + px) * 4;
      img.data[i] = v; img.data[i + 1] = v - 2; img.data[i + 2] = v - 5; img.data[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  // fibres, wrapped so the tile repeats cleanly
  for (let k = 0; k < 420; k++) {
    const fx = r() * size, fy = r() * size, a = r() * Math.PI, l = 5 + r() * 26;
    const dark = r() < 0.7;
    x.strokeStyle = dark ? `rgba(120,85,50,${0.05 + r() * 0.08})` : `rgba(255,255,255,${0.2 + r() * 0.25})`;
    x.lineWidth = 0.6 + r() * 0.8;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
      x.beginPath();
      x.moveTo(fx + dx * size, fy + dy * size);
      x.quadraticCurveTo(fx + dx * size + Math.cos(a) * l * 0.5 + (r() - 0.5) * 4, fy + dy * size + Math.sin(a) * l * 0.5 + (r() - 0.5) * 4,
        fx + dx * size + Math.cos(a) * l, fy + dy * size + Math.sin(a) * l);
      x.stroke();
    }
  }
  return c;
}

// ---- shapes -------------------------------------------------------------------
const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
function rrectPts(x, y, w, h, rad, n = 5) {
  const pts = [];
  const corners = [[x + w - rad, y + rad, -Math.PI / 2], [x + w - rad, y + h - rad, 0], [x + rad, y + h - rad, Math.PI / 2], [x + rad, y + rad, Math.PI]];
  for (const [cx, cy, a0] of corners)
    for (let i = 0; i <= n; i++) {
      const a = a0 + (i / n) * (Math.PI / 2);
      pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
    }
  return pts;
}
function ellipsePts(cx, cy, rx, ry, n = 28, a0 = 0, a1 = Math.PI * 2) {
  const pts = [];
  const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const cnt = full ? n : n + 1;
  for (let i = 0; i < cnt; i++) {
    const a = a0 + (i / n) * (a1 - a0);
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return pts;
}

// Hand-cut outline: subdivide each edge and nudge the points sideways.
function cut(pts, seed = 1, amp = 1.3, step = 16) {
  const r = rng(seed);
  const p = new Path2D();
  const n = pts.length;
  let first = true;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % n];
    const len = Math.hypot(bx - ax, by - ay);
    const segs = Math.max(1, Math.round(len / step));
    const nx = -(by - ay) / (len || 1), ny = (bx - ax) / (len || 1);
    for (let s = 0; s < segs; s++) {
      const t = s / segs;
      const j = (r() - 0.5) * 2 * amp * (s === 0 ? 0.4 : 1);
      const px = lerp(ax, bx, t) + nx * j, py = lerp(ay, by, t) + ny * j;
      if (first) { p.moveTo(px, py); first = false; } else p.lineTo(px, py);
    }
  }
  p.closePath();
  return p;
}

// Shared lighting state: shadow sizes are in device pixels, so they follow the camera zoom.
const light = { k: 1, grainCanvas: null, patterns: new Map() };
function grain(ctx) {
  if (!light.grainCanvas) light.grainCanvas = makeGrain();
  if (!light.patterns.has(ctx)) light.patterns.set(ctx, ctx.createPattern(light.grainCanvas, 'repeat'));
  return light.patterns.get(ctx);
}

function paper(ctx, path, fill, opt = {}) {
  const z = opt.z ?? 1;
  const k = light.k;
  ctx.save();
  if (opt.alpha != null) ctx.globalAlpha = opt.alpha;
  if (z > 0) {
    ctx.shadowColor = `rgba(62,34,16,${Math.min(0.42, 0.2 + 0.05 * z) * (opt.alpha ?? 1)})`;
    ctx.shadowBlur = (3 + z * 4.5) * k;
    ctx.shadowOffsetX = 1.6 * z * k;
    ctx.shadowOffsetY = 2.8 * z * k;
  }
  ctx.fillStyle = fill;
  ctx.fill(path);
  ctx.shadowColor = 'transparent';
  if (opt.grain !== 0) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = (opt.grain ?? 0.85) * (opt.alpha ?? 1);
    ctx.fillStyle = grain(ctx);
    ctx.fill(path);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = opt.alpha ?? 1;
  }
  if (opt.edge !== false) {
    ctx.clip(path);
    ctx.lineWidth = 2.4;
    ctx.translate(1.1, 1.5);
    ctx.strokeStyle = 'rgba(255,247,232,0.38)';
    ctx.stroke(path);
    ctx.translate(-2.2, -3);
    ctx.strokeStyle = 'rgba(70,38,18,0.22)';
    ctx.stroke(path);
  }
  ctx.restore();
}

module.exports = {
  rng, clamp01, lerp, span, inOut, outCubic, outBack, spring, mixHex, parseHex,
  makeGrain, grain, rectPts, rrectPts, ellipsePts, cut, paper, light,
};
