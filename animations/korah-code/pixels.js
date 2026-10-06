// The 8-bit half of the film: rasterising anything into grid cells, flying those
// cells into place, and drawing a landed field flat.
const { createCanvas } = require('@napi-rs/canvas');
const { rng, clamp01, outCubic } = require('./paper');

// ---- rasterising ----------------------------------------------------------
// Draw something at full size, downsample it to one sample per cell, keep the
// samples that are solid enough. Everything pixelated in the film comes through here.
function rasterize(w, h, cell, drawFn, alphaMin = 0.42) {
  const bw = Math.max(1, Math.round(w)), bh = Math.max(1, Math.round(h));
  const big = createCanvas(bw, bh);
  drawFn(big.getContext('2d'));
  const cols = Math.max(1, Math.round(bw / cell)), rows = Math.max(1, Math.round(bh / cell));
  const small = createCanvas(cols, rows);
  const sx = small.getContext('2d');
  sx.drawImage(big, 0, 0, cols, rows);
  const d = sx.getImageData(0, 0, cols, rows).data;
  const cells = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const k = (j * cols + i) * 4;
      const a = d[k + 3] / 255;
      if (a < alphaMin) continue;
      cells.push({ i, j, x: i * cell, y: j * cell, css: `rgb(${d[k]},${d[k + 1]},${d[k + 2]})` });
    }
  }
  return { cells, cols, rows, cell, w: cols * cell, h: rows * cell };
}

// Give every cell a deterministic seed, a scatter start and an order in the wave.
// `order` runs 0..1 and drives the stagger; the field lands in that order.
function seedField(field, seed, opt = {}) {
  const r = rng(seed);
  const { cols, rows, cell } = field;
  const dir = opt.order || 'radial';   // radial | left | up | random
  const cx = (cols - 1) / 2, cy = (rows - 1) / 2;
  const maxR = Math.hypot(cx, cy) || 1;
  for (const c of field.cells) {
    c.k = r();
    c.k2 = r();
    c.x = c.i * cell;
    c.y = c.j * cell;
    if (opt.from) {
      // start somewhere specific (the screen the code lifted off, say)
      const [fx, fy] = opt.from(c, r);
      c.sx = fx - c.x;
      c.sy = fy - c.y;
    } else {
      const ang = r() * Math.PI * 2;
      const far = (opt.throw ?? 520) * (0.45 + r() * 0.85);
      c.sx = Math.cos(ang) * far;
      c.sy = Math.sin(ang) * far - (opt.rise ?? 0);
    }
    c.order =
      dir === 'left' ? c.i / Math.max(1, cols - 1) :
      dir === 'up' ? 1 - c.j / Math.max(1, rows - 1) :
      dir === 'random' ? c.k :
      clamp01(Math.hypot(c.i - cx, c.j - cy) / maxR);
    c.order = clamp01(c.order * 0.82 + c.k * 0.18);
  }
  return field;
}

// Draw a seeded field at `u` (0 = scattered, 1 = fully landed). Cells snap to the
// grid while they travel, which keeps the movement reading as 8-bit and not as
// smooth motion graphics.
function drawField(ctx, field, ox, oy, u, opt = {}) {
  const { cell } = field;
  const stagger = opt.stagger ?? 0.55;
  const fade = opt.fade ?? 1;         // 1 = solid, drops to 0 once it has resolved
  const glitch = opt.glitch ?? 0;     // 0..1, how much slice tearing and colour split
  const tint = opt.tint || null;      // override colour
  const gsize = cell * (opt.size ?? 1);
  const inset = (cell - gsize) / 2;
  const clock = opt.clock ?? 0;
  const swirl = opt.swirl ?? 0;
  if (fade <= 0.003) return;
  ctx.save();
  ctx.globalAlpha = fade;
  for (const c of field.cells) {
    const a = c.order * stagger;
    const cu = clamp01((u - a) / Math.max(0.0001, 1 - stagger));
    if (cu <= 0 && u < 1) {
      if (u < 0.02) continue;
      if (c.k2 > u * 3) continue;     // the field pops in a few cells at a time
    }
    const e = outCubic(clamp01(cu));
    // the remaining offset shrinks and, if asked, spirals in
    let dx = c.sx * (1 - e), dy = c.sy * (1 - e);
    if (swirl) {
      const a = (1 - e) * swirl * (0.7 + c.k * 0.7);
      const ca = Math.cos(a), sa = Math.sin(a);
      const tx = dx * ca - dy * sa;
      dy = dx * sa + dy * ca;
      dx = tx;
    }
    let x = ox + c.x + dx;
    let y = oy + c.y + dy;
    // snap to the grid while travelling, land exactly
    if (e < 0.995) {
      x = ox + Math.round((x - ox) / cell) * cell;
      y = oy + Math.round((y - oy) / cell) * cell;
    }
    let alpha = 1;
    let col = tint;
    if (e < 0.92) {
      // flicker on the way in, and again for a beat before settling
      const ph = Math.floor(clock * 22 + c.k * 9);
      if (ph % 3 === 2 && c.k2 > 0.55) alpha = 0.22;
      if (!col && c.k > 0.72) col = opt.hot || null;
    }
    if (glitch > 0 && c.k2 < glitch * 0.3) {
      x += Math.round((c.k - 0.5) * 5 * glitch) * cell;
      col = c.k > 0.5 ? '#3ddad7' : '#f0abfc';
    }
    ctx.globalAlpha = fade * alpha;
    ctx.fillStyle = col || c.css;
    ctx.fillRect(x + inset, y + inset, gsize, gsize);
  }
  ctx.restore();
}

// Draw a rasterised field at rest. Pixel figures are painted as plain shapes and
// put through `rasterize`, so they come out on the same grid as everything else.
function blit(ctx, field, ox, oy, alpha = 1, shadow = 0) {
  if (alpha <= 0.004) return;
  const { cell } = field;
  ctx.save();
  if (shadow) {
    ctx.globalAlpha = alpha * 0.15;
    ctx.fillStyle = '#4a3a2a';
    for (const c of field.cells) ctx.fillRect(ox + c.x + shadow, oy + c.y + shadow * 1.5, cell, cell);
  }
  ctx.globalAlpha = alpha;
  for (const c of field.cells) {
    ctx.fillStyle = c.css;
    ctx.fillRect(ox + c.x, oy + c.y, cell, cell);
  }
  ctx.restore();
}

module.exports = { rasterize, seedField, drawField, blit };
