// Die-cut kinetic type. Every letter is baked once into its own little paper
// canvas (fill, grain, cut rim) and then animated as an independent card.
const { createCanvas } = require('@napi-rs/canvas');
const { clamp01, lerp, spring, grain, light } = require('./paper');

const scratch = createCanvas(8, 8).getContext('2d');
const cache = new Map();

// One letter, baked. The canvas is always advance-width + padding, with the
// baseline at a fixed fraction, so every glyph in a line lines up by construction.
function glyph(ch, font, color) {
  const key = `${ch}|${font}|${color}`;
  let g = cache.get(key);
  if (g) return g;
  scratch.font = font;
  const size = parseFloat(font.match(/(\d+(?:\.\d+)?)px/)[1]);
  const adv = scratch.measureText(ch).width;
  const pad = Math.ceil(size * 0.34);
  const base = Math.round(size * 1.12);
  const c = createCanvas(Math.max(1, Math.ceil(adv) + pad * 2), Math.round(size * 1.62));
  const x = c.getContext('2d');
  x.font = font;
  x.textBaseline = 'alphabetic';
  x.fillStyle = color;
  x.fillText(ch, pad, base);
  x.globalCompositeOperation = 'multiply';
  x.globalAlpha = 0.8;
  x.fillStyle = grain(x);
  x.fillText(ch, pad, base);
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-atop';
  x.lineWidth = Math.max(1.6, size * 0.028);
  x.strokeStyle = 'rgba(255,248,234,0.4)';
  x.strokeText(ch, pad + 1.1, base + 1.5);
  x.strokeStyle = 'rgba(58,32,14,0.2)';
  x.strokeText(ch, pad - 1.1, base - 1.5);
  g = { c, adv, pad, base };
  cache.set(key, g);
  return g;
}

// Lay a line out around x = 0, baseline at y = 0. `track` is extra letter spacing.
function layout(text, font, track = 0) {
  const gs = [];
  let w = 0;
  for (const ch of text) {
    const g = glyph(ch === ' ' ? 'n' : ch, font, '#000');
    const adv = (ch === ' ' ? g.adv * 0.62 : g.adv) + track;
    gs.push({ ch, x: w, adv });
    w += adv;
  }
  for (const g of gs) g.x -= w / 2;
  return { gs, w };
}

// Draw a laid-out line. Each letter flicks up into place on its own beat.
// `u` per letter: 0 hidden, 1 settled. `at(i)` can override the stagger.
function line(ctx, text, font, color, cx, cy, opt = {}) {
  const track = opt.track ?? 0;
  const { gs, w } = layout(text, font, track);
  const step = opt.step ?? 0.035;
  const t = opt.t ?? 1;
  const z = opt.z ?? 1.6;
  const k = light.k;
  for (let i = 0; i < gs.length; i++) {
    const it = gs[i];
    if (it.ch === ' ') continue;
    const order = opt.order === 'mid' ? Math.abs(i - (gs.length - 1) / 2) : i;
    let u = clamp01(spring(t - order * step, 1.3, 9));
    if (opt.out != null) u *= 1 - clamp01(opt.out);
    if (u <= 0.002) continue;
    const g = glyph(it.ch, font, color);
    const a = clamp01(u * 2.4);
    const sy = lerp(0.42, 1, clamp01(u * 1.25));
    const rot = (1 - clamp01(u)) * (i % 2 ? 0.16 : -0.16);
    ctx.save();
    ctx.globalAlpha = a * (opt.alpha ?? 1);
    ctx.translate(cx + it.x + it.adv / 2, cy);
    ctx.rotate(rot);
    ctx.scale(1, sy);
    ctx.translate(-it.adv / 2, 0);
    if (z > 0) {
      ctx.shadowColor = `rgba(58,32,14,${0.3 * a})`;
      ctx.shadowBlur = z * 5 * k;
      ctx.shadowOffsetX = z * 1.5 * k;
      ctx.shadowOffsetY = z * 2.6 * k;
    }
    ctx.drawImage(g.c, -g.pad, -g.base);
    ctx.restore();
  }
  return w;
}

// Plain text width, for laying blocks out before drawing them.
function width(text, font, track = 0) {
  return layout(text, font, track).w;
}

module.exports = { line, width };
