// Korah parabola-b reel: the source video's narration and Desmos footage restaged on a
// paper page. A virtual camera pushes in on whatever is being talked about and blurs the rest.
// Emphasis is made by hand: a felt highlighter over the line being read, a ballpoint
// underline under each equation, and the answer written in red marker.
const fs = require('fs');
const path = require('path');
const { spawn, execFileSync } = require('child_process');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const ffmpeg = require('ffmpeg-static');
const { rng, lerp, span, inOut, outCubic, outBack, mixHex, cut, rectPts } = require('../korah-not-cooked/paper');
const { FPS, DURATION, T, SHOTS, MOVE, ENTER_MOVE, CAPTIONS } = require('./timeline');
const { writeMix } = require('./audio');

require('v8').setFlagsFromString('--expose-gc');
const gc = require('vm').runInNewContext('gc');

const HERE = __dirname;
const W = 1080, H = 1920;
const FRAMES = Math.round(DURATION * FPS);
const SRC = path.join(HERE, 'assets/source.mp4');
const DESMOS = path.join(HERE, 'assets/desmos.mp4');   // Desmos window cut from the source, lossless
const NARRATION = path.join(HERE, 'assets/narration.wav');
const OUT = path.join(HERE, 'out');

GlobalFonts.registerFromPath(path.join(HERE, 'assets/fonts/PlusJakartaSans-Bold.ttf'), 'Jakarta');
const SUP = '/System/Library/Fonts/Supplemental/';
GlobalFonts.registerFromPath(SUP + 'Times New Roman.ttf', 'TNR');
GlobalFonts.registerFromPath(SUP + 'Times New Roman Italic.ttf', 'TNRi');
GlobalFonts.registerFromPath(SUP + 'Times New Roman Bold.ttf', 'TNRb');
GlobalFonts.registerFromPath('/System/Library/Fonts/MarkerFelt.ttc', 'Felt');

const INK = '#151515';
const RED = '#cf1a1f';       // red pen
const HL = 'rgb(253,222,86)'; // highlighter yellow
const PILL = '#019ce1';
const PAPER = '#e9e9e9';
const FRAME = '#f4d56a'; // pastel yellow border around the video
const CARD_FILL = '#f6f6f4';
const BLUR = 7;        // out-of-focus blur in world px, so it grows as the camera pushes in
const HEADER_BLUR = 7; // the header bar is always soft, like the reference
const CAP_Y = 1470;    // caption centre

// ---- layout (world units, 1:1 with the frame at zoom 1) -----------------------------
const CARD = { x: 50, y: 120, w: 980, h: 980 };
const COL = 130, COLW = 820;
const Y1 = 322;            // "In the xy-plane, a line with equation"
const EQ1_Y = 436;         // 2y = 4.5
const Y2 = 556;            // "intersects a parabola ... has equation"
const EQ2_Y = 728;         // y = -4x^2 + bx
const Y3 = 846;            // "where b is a positive constant, what is the value of b?"
const ANS_Y = 1006;        // b = 6, written in at the end
// Desmos crop is 720x404 source px; s maps it to world units
const DES = { x: 40, y: 1170, s: 1000 / 720 };
DES.w = 720 * DES.s; DES.h = 404 * DES.s;
const REG = { bar: [0, 0, 720, 37], panel: [0, 37, 274, 367], graph: [274, 37, 446, 367] };
const dAt = (x, y) => [DES.x + x * DES.s, DES.y + y * DES.s];

// ---- rich text -------------------------------------------------------------------
// styles: r roman, i italic, b bold, s superscript (roman, raised and smaller)
const FONT = { r: 'TNR', i: 'TNRi', b: 'TNRb', s: 'TNR' };
const font = (st, size) => `${size * (st === 's' ? 0.62 : 1)}px ${FONT[st]}`;
const rise = (st, size) => (st === 's' ? -size * 0.36 : 0);
const i = (s) => [s, 'i'], r = (s) => [s, 'r'], sup = (s) => [s, 's'];
// a word is a list of [text, style] runs; plain strings become roman words
function words(...parts) {
  const out = [];
  for (const p of parts) {
    if (typeof p === 'string') for (const w of p.split(' ')) out.push([[w, 'r']]);
    else out.push(p);
  }
  return out;
}
function runsWidth(ctx, runs, size) {
  let w = 0;
  runs.forEach(([s, st], k) => {
    ctx.font = font(st, size);
    w += ctx.measureText(s).width + (st === 'i' && k < runs.length - 1 ? size * 0.05 : 0);
  });
  return w;
}
function drawRuns(ctx, runs, x, y, size) {
  runs.forEach(([s, st], k) => {
    ctx.font = font(st, size);
    ctx.fillText(s, x, y + rise(st, size));
    x += ctx.measureText(s).width + (st === 'i' && k < runs.length - 1 ? size * 0.05 : 0);
  });
}
function flow(ctx, ws, y, size, lh) {
  ctx.font = font('r', size);
  const space = ctx.measureText(' ').width;
  const lines = [[]];
  let lx = 0;
  for (const w of ws) {
    const ww = runsWidth(ctx, w, size);
    let x = lines[lines.length - 1].length ? lx + space : 0;
    if (x && x + ww > COLW) { lines.push([]); x = 0; }
    lines[lines.length - 1].push({ runs: w, x: COL + x });
    lx = x + ww;
    lines[lines.length - 1].x1 = COL + lx;
  }
  return lines.map((l, k) => ({ words: l, y: y + k * lh, x0: COL, x1: l.x1 }));
}

const TEXT1 = words('In the', [i('xy'), r('-plane,')], 'a line with equation');
const TEXT2 = words('intersects a parabola at exactly one point. If the parabola has equation');
const TEXT3 = words('where', [i('b')], 'is a positive constant, what is the value of', [i('b'), r('?')]);
const ANS = 'b = 6';

let L; // measured layout, built once
function buildLayout(ctx) {
  const size = 42, lh = 58;
  const es = 58;
  const eqn = (runs) => {
    const w = runsWidth(ctx, runs, es);
    return { runs, w, x0: 540 - w / 2, size: es };
  };
  ctx.font = '76px Felt';
  return {
    size,
    text1: flow(ctx, TEXT1, Y1, size, lh),
    text2: flow(ctx, TEXT2, Y2, size, lh),
    text3: flow(ctx, TEXT3, Y3, size, lh),
    eq1: eqn([r('2'), i('y'), r(' = 4.5')]),
    eq2: eqn([i('y'), r(' = −4'), i('x'), sup('2'), r(' + '), i('b'), i('x')]),
    ansW: ctx.measureText(ANS).width,
  };
}

// ---- camera shots -------------------------------------------------------------------
// world point (x, y) lands at screen (540, sy) at zoom z
const frame = (x, y, z, sy = 900) => ({ c: [x, y + (960 - sy) / z], z });
const CARD_BLUR = { t1: 1, eq1: 1, t2: 1, eq2: 1, t3: 1, ans: 1 };
const PANEL_BLUR = { ...CARD_BLUR, bar: 1, graph: 1 };
const GRAPH_BLUR = { ...CARD_BLUR, bar: 1, panel: 1 };
const SHOT = {
  wide: { ...frame(540, CARD.y + CARD.h / 2, 1.02, 780), blur: {} },
  intro: { ...frame(540, 379, 1.2, 850), blur: { t2: 1, eq2: 1, t3: 1 } },
  eq1: { ...frame(540, EQ1_Y, 1.6, 880), blur: { t1: 1, t2: 1, eq2: 1, t3: 1 } },
  body: { ...frame(540, 642, 1.15, 850), blur: { t1: 1, eq1: 1, t3: 1 } },
  eq2: { ...frame(540, EQ2_Y, 1.55, 880), blur: { t1: 1, eq1: 1, t2: 1, t3: 1 } },
  ask: { ...frame(540, 875, 1.2, 860), blur: { t1: 1, eq1: 1, t2: 1, eq2: 1 } },
  // the window lands low enough that the caption sits just under it, not on empty page
  desmos: { ...frame(540, DES.y + DES.h, 1.0, 1415), blur: CARD_BLUR },
  panel: { ...frame(...dAt(140, 150), 2.25, 880), blur: PANEL_BLUR },
  slider: { ...frame(...dAt(140, 185), 2.1, 900), blur: PANEL_BLUR },
  graph: { ...frame(...dAt(480, 200), 1.7, 930), blur: GRAPH_BLUR },
  touch: { ...frame(...dAt(505, 92), 2.1, 800), blur: GRAPH_BLUR },
  answer: { ...frame(540, 970, 1.45, 860), blur: { ...CARD_BLUR, ans: 0, bar: 1, panel: 1, graph: 1 } },
  // the answer and the tangency point together; the point (crop 456, 74) sits above the caption
  end: { ...frame(540, dAt(456, 74)[1], 0.97, 1230), blur: { ...CARD_BLUR, ans: 0, bar: 1, panel: 1 } },
};
const GROUPS = ['t1', 'eq1', 't2', 'eq2', 't3', 'ans', 'bar', 'panel', 'graph'];

function camera(t) {
  let k = 0;
  while (k + 1 < SHOTS.length && SHOTS[k + 1][0] <= t) k++;
  const cur = SHOT[SHOTS[k][1]];
  if (k === 0) return { cx: cur.c[0], cy: cur.c[1], z: cur.z, blur: GROUPS.map((g) => cur.blur[g] || 0) };
  const prev = SHOT[SHOTS[k - 1][1]];
  const u = inOut(span(t, SHOTS[k][0], SHOTS[k][0] + (SHOTS[k][1] === 'desmos' ? ENTER_MOVE : MOVE)));
  return {
    cx: lerp(prev.c[0], cur.c[0], u),
    cy: lerp(prev.c[1], cur.c[1], u),
    z: Math.exp(lerp(Math.log(prev.z), Math.log(cur.z), u)),
    blur: GROUPS.map((g) => lerp(prev.blur[g] || 0, cur.blur[g] || 0, u)),
  };
}

// ---- textures -----------------------------------------------------------------------
const BG = { x: -500, y: -500, w: 2080, h: 3100 };
function buildPaper() {
  const c = createCanvas(BG.w, BG.h);
  const x = c.getContext('2d');
  const rand = rng(7);
  const img = x.createImageData(BG.w, BG.h);
  // value noise at two scales for soft unevenness, plus per-pixel grain
  const grid = (cell) => {
    const nx = Math.ceil(BG.w / cell) + 2, ny = Math.ceil(BG.h / cell) + 2;
    const g = new Float32Array(nx * ny).map(() => rand());
    return (px, py) => {
      const fx = px / cell, fy = py / cell, x0 = fx | 0, y0 = fy | 0, tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = lerp(g[y0 * nx + x0], g[y0 * nx + x0 + 1], sx), b = lerp(g[(y0 + 1) * nx + x0], g[(y0 + 1) * nx + x0 + 1], sx);
      return lerp(a, b, sy);
    };
  };
  const big = grid(420), mid = grid(60);
  for (let py = 0; py < BG.h; py++) {
    for (let px = 0; px < BG.w; px++) {
      const v = 227 + big(px, py) * 7 + mid(px, py) * 3 + rand() * 4;
      const k = (py * BG.w + px) * 4;
      img.data[k] = v; img.data[k + 1] = v; img.data[k + 2] = v + 0.6; img.data[k + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  // faint creases: a light edge with a soft dark side
  for (let k = 0; k < 7; k++) {
    const x0 = rand() * BG.w, y0 = rand() * BG.h, a = rand() * Math.PI, len = 500 + rand() * 900;
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    const mx = (x0 + x1) / 2 + (rand() - 0.5) * 120, my = (y0 + y1) / 2 + (rand() - 0.5) * 120;
    for (const [dx, col, lw] of [[0, 'rgba(255,255,255,0.35)', 1.6], [2.2, 'rgba(0,0,0,0.045)', 4]]) {
      x.strokeStyle = col; x.lineWidth = lw;
      x.beginPath(); x.moveTo(x0 + dx, y0 + dx); x.quadraticCurveTo(mx + dx, my + dx, x1 + dx, y1 + dx); x.stroke();
    }
  }
  // dust specks
  for (let k = 0; k < 1400; k++) {
    x.fillStyle = `rgba(60,60,60,${0.15 + rand() * 0.35})`;
    x.beginPath(); x.arc(rand() * BG.w, rand() * BG.h, 0.5 + rand() * 1.1, 0, Math.PI * 2); x.fill();
  }
  return c;
}
function buildGrain() {
  const n = 256, c = createCanvas(n, n), x = c.getContext('2d');
  const rand = rng(21), img = x.createImageData(n, n);
  for (let k = 0; k < n * n; k++) {
    const v = 255 - rand() * 14;
    img.data[k * 4] = v; img.data[k * 4 + 1] = v; img.data[k * 4 + 2] = v; img.data[k * 4 + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

// ---- drawing ------------------------------------------------------------------------
function rrect(ctx, x, y, w, h, rad) {
  ctx.beginPath();
  ctx.moveTo(x + rad, y); ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad); ctx.closePath();
}

// a cut paper sheet with a drop shadow that grows while it's lifted off the page
function sheet(ctx, p, fill, cam, lift, grainPat) {
  const k = cam.z;
  ctx.save();
  ctx.shadowColor = `rgba(0,0,0,${0.2 + lift * 0.06})`;
  ctx.shadowBlur = (12 + lift * 34) * k;
  ctx.shadowOffsetX = (2 + lift * 8) * k;
  ctx.shadowOffsetY = (5 + lift * 30) * k;
  ctx.fillStyle = fill;
  ctx.fill(p);
  ctx.shadowColor = 'transparent';
  if (grainPat) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha *= 0.55;
    ctx.fillStyle = grainPat;
    ctx.fill(p);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
  ctx.save();
  ctx.clip(p);
  ctx.lineWidth = 2.4;
  ctx.translate(1, 1.3);
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.stroke(p);
  ctx.translate(-2, -2.6);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.stroke(p);
  ctx.restore();
}

function drawHeader(ctx) {
  ctx.fillStyle = '#c8cccd';
  ctx.fillRect(COL - 30 + 130, 150, CARD.x + CARD.w - 30 - (COL + 100), 64);
  ctx.fillStyle = '#26407e';
  rrect(ctx, COL - 30, 150, 130, 64, 5); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = font('b', 32); ctx.textAlign = 'center';
  ctx.fillText('Math', COL + 35, 193);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#555b61'; ctx.font = font('r', 30);
  ctx.fillText('Difficulty: Hard', COL + 130, 192);
}

// ---- hand-made marks ----------------------------------------------------------------
// Every stroke's wobble is a function of its parameter, never of a random draw, so the
// mark is identical from frame to frame; how much of it is on the page is a clip.

// felt highlighter over a block of text: three overlapping passes, so the ink builds up
// unevenly and the edges stay ragged. p is how much of the block is covered.
const NIB = [[-14, 38, 0.44], [-27, 16, 0.2], [-2, 14, 0.17]];
function swipe(ctx, lines, p) {
  if (p <= 0) return;
  const total = lines.reduce((s, l) => s + l.x1 - l.x0, 0);
  let left = p * total;
  const base = ctx.globalAlpha;
  ctx.save();
  ctx.strokeStyle = HL; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const l of lines) {
    if (left <= 0) break;
    const w = l.x1 - l.x0, len = Math.min(left, w);
    left -= len;
    ctx.save();
    ctx.beginPath(); ctx.rect(l.x0 - 16, l.y - 52, len + 24, 78); ctx.clip();
    for (const [dy, lw, a] of NIB) {
      ctx.globalAlpha = base * a;
      ctx.lineWidth = lw;
      ctx.beginPath();
      const n = Math.max(2, Math.round(w / 36));
      for (let k = 0; k <= n; k++) {
        const u = k / n;
        ctx.lineTo(l.x0 + 5 + (w - 10) * u, l.y + dy + Math.sin(u * 11 + dy) * 2.3);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

// ballpoint underline, drawn left to right: a firm pass and a lighter second stroke
function penLine(ctx, x0, x1, y, p, alpha) {
  if (p <= 0 || alpha <= 0) return;
  const base = ctx.globalAlpha, w = x1 - x0 + 22;
  ctx.save();
  ctx.beginPath(); ctx.rect(x0 - 13, y - 14, w * p + 2, 34); ctx.clip();
  ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [dy, lw, a] of [[0, 4.4, 0.95], [2.4, 2.2, 0.45]]) {
    ctx.globalAlpha = base * alpha * a;
    ctx.lineWidth = lw;
    ctx.beginPath();
    const n = Math.max(2, Math.round(w / 26));
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      ctx.lineTo(x0 - 11 + w * u, y + dy + Math.sin(u * 7 + dy) * 1.6);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// a ring round the answer, drawn in one loop and a bit past the start, like a pen would
function ring(ctx, cx, cy, rx, ry, p) {
  if (p <= 0) return;
  const base = ctx.globalAlpha;
  ctx.save();
  ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const [a0, sweep, lw, ox, oy, a] of [[-2.5, Math.PI * 2 + 0.45, 5, 0, 0, 1], [-2.3, Math.PI * 2 + 0.15, 2.6, 3, -3, 0.5]]) {
    ctx.globalAlpha = base * a;
    ctx.lineWidth = lw;
    ctx.beginPath();
    const n = Math.max(2, Math.round(90 * p));
    for (let k = 0; k <= n; k++) {
      const ang = a0 + (k / n) * sweep * p;
      const g = 1 + 0.04 * Math.sin(ang * 3 + 1) + 0.022 * (ang - a0);
      ctx.lineTo(cx + ox + Math.cos(ang) * rx * g, cy + oy + Math.sin(ang) * ry * g);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// ---- card content -------------------------------------------------------------------
function drawLines(ctx, lines) {
  for (const l of lines) for (const w of l.words) drawRuns(ctx, w.runs, w.x, l.y, L.size);
}

// highlighter first, then the type, so the words stay crisp on top of the ink
function drawBlock(ctx, lines, p) {
  swipe(ctx, lines, p);
  ctx.fillStyle = INK;
  drawLines(ctx, lines);
}

// display equation: red while it is read, with a pen underline that stays on the page
function drawEq(ctx, t, e, y, at) {
  const k = Math.min(span(t, at[0], at[0] + 0.25), 1 - span(t, at[1], at[1] + 0.35));
  ctx.fillStyle = mixHex(INK, RED, k);
  drawRuns(ctx, e.runs, e.x0, y, e.size);
  penLine(ctx, e.x0, e.x0 + e.w, y + 22, span(t, at[0] + 0.15, at[1] - 0.2), 1);
}

function drawAnswer(ctx, t) {
  const p = span(t, T.ansWrite, T.ansWrite + 0.5);
  if (p <= 0) return;
  const w = L.ansW;
  ctx.save();
  ctx.beginPath(); ctx.rect(540 - w / 2 - 16, ANS_Y - 90, w * p + 22, 140); ctx.clip();
  ctx.fillStyle = RED;
  ctx.font = '76px Felt'; ctx.textAlign = 'center';
  ctx.fillText(ANS, 540, ANS_Y);
  ctx.textAlign = 'left';
  ctx.restore();
  ring(ctx, 540, ANS_Y - 22, w / 2 + 42, 54, outCubic(span(t, T.ansRing, T.ansRing + 0.5)));
}

// Draw one card group, blurred through an offscreen layer when it's out of focus.
function group(ctx, off, m, bbox, rad, draw) {
  if (rad < 0.05) { draw(ctx); return; }
  const pad = rad * 3;
  const x0 = Math.max(0, Math.floor(bbox[0] * m[0] + m[4] - pad)), y0 = Math.max(0, Math.floor(bbox[1] * m[0] + m[5] - pad));
  const x1 = Math.min(W, Math.ceil((bbox[0] + bbox[2]) * m[0] + m[4] + pad)), y1 = Math.min(H, Math.ceil((bbox[1] + bbox[3]) * m[0] + m[5] + pad));
  if (x1 <= x0 || y1 <= y0) return;
  const o = off.getContext('2d');
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.clearRect(x0, y0, x1 - x0, y1 - y0);
  o.setTransform(...m);
  draw(o);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.filter = `blur(${rad.toFixed(2)}px)`;
  ctx.drawImage(off, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0);
  ctx.restore();
}

// Desmos footage: pixels as recorded, only scaled, with a per-region blur done at source size.
function drawDesmos(ctx, t, cam, blur, R) {
  const u = span(t, T.desmosIn, T.desmosLand);
  const dy = 1250 * (1 - outBack(u, 0.8));
  const lift = 1 - outCubic(u);
  const cx = DES.x + DES.w / 2, cy = DES.y + DES.h / 2;
  ctx.save();
  ctx.translate(cx, cy + dy); ctx.rotate(-0.05 * lift); ctx.translate(-cx, -cy);
  sheet(ctx, R.desPath, '#fbfbfa', cam, lift, null);
  const s = DES.s;
  const src = (g) => {
    const rad = blur[GROUPS.indexOf(g)] * BLUR / s;
    if (rad < 0.05) return R.frame;
    const hit = R.tmp.find((b) => b.rad === rad);
    if (hit) return hit.c;
    const b = R.tmp.find((b) => !b.used);
    b.used = true; b.rad = rad;
    const x = b.c.getContext('2d');
    x.filter = 'none'; x.drawImage(R.frame, 0, 0);
    x.filter = `blur(${rad.toFixed(2)}px)`; x.drawImage(R.frame, 0, 0);
    x.filter = 'none';
    return b.c;
  };
  R.tmp.forEach((b) => { b.used = false; b.rad = -1; });
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  // whole frame first (as the graph), then the panel and top bar over it, so no seams show
  ctx.drawImage(src('graph'), DES.x, DES.y, DES.w, DES.h);
  for (const g of ['panel', 'bar']) {
    const [x, y, w, h] = REG[g];
    ctx.drawImage(src(g), x, y, w, h, DES.x + x * s, DES.y + y * s, w * s, h * s);
  }
  ctx.restore();
}

function drawCaption(ctx, t) {
  const c = CAPTIONS.find(([a, b]) => t >= a && t < b);
  if (!c) return;
  ctx.font = '42px Jakarta';
  const w = ctx.measureText(c[2]).width + 44, h = 68;
  ctx.fillStyle = PILL;
  rrect(ctx, W / 2 - w / 2, CAP_Y - h / 2, w, h, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
  ctx.fillText(c[2], W / 2, CAP_Y + 15);
  ctx.textAlign = 'left';
}

function drawFrame(ctx, t, R) {
  const cam = camera(t);
  const m = [cam.z, 0, 0, cam.z, W / 2 - cam.cx * cam.z, H / 2 - cam.cy * cam.z];
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
  ctx.setTransform(...m);
  ctx.drawImage(R.paper, BG.x, BG.y);

  // problem card, rising onto the page at the start
  const cu = span(t, T.cardIn, T.cardIn + 0.5);
  const cdy = 70 * (1 - outBack(cu, 1.4));
  ctx.save();
  ctx.globalAlpha = span(t, T.cardIn, T.cardIn + 0.18);
  ctx.translate(0, cdy);
  sheet(ctx, R.cardPath, CARD_FILL, cam, 1 - outCubic(cu), R.grain);
  const cm = [m[0], 0, 0, m[3], m[4], m[5] + cdy * cam.z];
  const b = (g) => cam.blur[GROUPS.indexOf(g)] * BLUR * cam.z;
  group(ctx, R.off, cm, [CARD.x, 140, CARD.w, 90], HEADER_BLUR * cam.z, drawHeader);
  group(ctx, R.off, cm, [CARD.x, Y1 - 62, CARD.w, 100], b('t1'), (x) => drawBlock(x, L.text1, span(t, ...T.hl1)));
  group(ctx, R.off, cm, [CARD.x, EQ1_Y - 70, CARD.w, 120], b('eq1'), (x) => drawEq(x, t, L.eq1, EQ1_Y, T.eq1Red));
  group(ctx, R.off, cm, [CARD.x, Y2 - 62, CARD.w, 160], b('t2'), (x) => drawBlock(x, L.text2, span(t, ...T.hl2)));
  group(ctx, R.off, cm, [CARD.x, EQ2_Y - 70, CARD.w, 120], b('eq2'), (x) => drawEq(x, t, L.eq2, EQ2_Y, T.eq2Red));
  group(ctx, R.off, cm, [CARD.x, Y3 - 62, CARD.w, 160], b('t3'), (x) => drawBlock(x, L.text3, span(t, ...T.hl3)));
  group(ctx, R.off, cm, [CARD.x, ANS_Y - 110, CARD.w, 180], b('ans'), (x) => drawAnswer(x, t));
  ctx.restore();

  if (t >= T.desmosIn) drawDesmos(ctx, t, cam, cam.blur, R);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawCaption(ctx, t);
  ctx.strokeStyle = FRAME; ctx.lineWidth = 24;
  ctx.strokeRect(0, 0, W, H);
}

// ---- Desmos frames from the extracted footage ---------------------------------------
const DW = 720, DH = 404, DSIZE = DW * DH * 4, DLAST = 1261;
function desmosReader(first, count) {
  const ff = spawn(ffmpeg, ['-v', 'error', '-ss', (first / FPS).toFixed(4), '-i', DESMOS, '-frames:v', String(count),
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { stdio: ['ignore', 'pipe', 'inherit'] });
  const parts = [];
  let have = 0, ended = false, wake = null, last = null;
  ff.stdout.on('data', (d) => { parts.push(d); have += d.length; if (wake) wake(); });
  ff.stdout.on('end', () => { ended = true; if (wake) wake(); });
  return async () => {
    while (have < DSIZE && !ended) await new Promise((r) => (wake = r));
    wake = null;
    if (have < DSIZE) return last; // past the end of the footage: hold the last frame
    const all = Buffer.concat(parts);
    last = Buffer.from(all.subarray(0, DSIZE));
    parts.length = 0; parts.push(all.subarray(DSIZE)); have -= DSIZE;
    return last;
  };
}

function setup() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  L = buildLayout(ctx);
  const frameCanvas = createCanvas(DW, DH);
  const pad = 11;
  const R = {
    paper: buildPaper(),
    grain: ctx.createPattern(buildGrain(), 'repeat'),
    off: createCanvas(W, H),
    frame: frameCanvas,
    tmp: [0, 1, 2].map(() => ({ c: createCanvas(DW, DH), used: false, rad: -1 })),
    cardPath: cut(rectPts(CARD.x, CARD.y, CARD.w, CARD.h), 3, 1.2, 18),
    desPath: cut(rectPts(DES.x - pad, DES.y - pad, DES.w + pad * 2, DES.h + pad * 2), 5, 1.0, 18),
    setFrame(buf) {
      const x = frameCanvas.getContext('2d');
      const img = x.createImageData(DW, DH);
      img.data.set(buf);
      x.putImageData(img, 0, 0);
    },
  };
  return { canvas, ctx, R };
}

function prepareAssets() {
  if (!fs.existsSync(DESMOS)) {
    // the Desmos window sits at y 627..1030 of the 720x1280 source (rotated by ffmpeg from
    // the 1280x720 recording); keep its pixels exactly
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', SRC, '-an', '-vf', 'crop=720:404:0:627',
      '-c:v', 'libx264', '-qp', '0', '-g', '30', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', DESMOS]);
  }
  if (!fs.existsSync(NARRATION)) {
    execFileSync(ffmpeg, ['-y', '-v', 'error', '-i', SRC, '-vn', '-ac', '2', '-ar', '48000', '-c:a', 'pcm_s16le', NARRATION]);
  }
}

const run = (args) => new Promise((res, rej) => {
  const p = spawn(process.execPath, [__filename, ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  p.on('close', (code) => (code ? rej(new Error(`${args.join(' ')} exited ${code}`)) : res()));
});

async function main() {
  const args = process.argv.slice(2);
  prepareAssets();

  const si = args.indexOf('--stills');
  if (si >= 0) {
    const { canvas, ctx, R } = setup();
    const dir = args[si + 2] || path.join(HERE, 'frames');
    fs.mkdirSync(dir, { recursive: true });
    for (const s of args[si + 1].split(',').map(Number)) {
      const f = Math.round(s * FPS);
      if (s >= T.desmosIn) R.setFrame(await desmosReader(Math.min(f, DLAST), 1)());
      const t0 = Date.now();
      drawFrame(ctx, f / FPS, R);
      const file = path.join(dir, `still-${s.toFixed(2)}.png`);
      fs.writeFileSync(file, canvas.toBuffer('image/png'));
      console.log(file, `${Date.now() - t0}ms`);
    }
    return;
  }

  // --segment k a b: render frames a..b-1 into out/segments/seg-k.mp4
  const gi = args.indexOf('--segment');
  if (gi >= 0) {
    const [k, a, b] = args.slice(gi + 1, gi + 4).map(Number);
    const { ctx, R } = setup();
    const ff = spawn(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error',
      '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      path.join(OUT, 'segments', `seg-${String(k).padStart(3, '0')}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
    const d0 = Math.max(a, Math.ceil(T.desmosIn * FPS));
    const next = d0 < b ? desmosReader(d0, b - d0) : null;
    for (let f = a; f < b; f++) {
      if (f >= d0) R.setFrame(await next());
      drawFrame(ctx, f / FPS, R);
      const data = ctx.getImageData(0, 0, W, H).data;
      if (!ff.stdin.write(Buffer.from(data.buffer, data.byteOffset, data.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
      if (f % 4 === 0) gc();
    }
    ff.stdin.end();
    await new Promise((r, j) => ff.on('close', (code) => (code ? j(new Error('ffmpeg exited ' + code)) : r())));
    return;
  }

  fs.mkdirSync(path.join(OUT, 'segments'), { recursive: true });
  const mix = path.join(OUT, 'parabola-b.wav');
  writeMix(NARRATION, mix);
  const SEG = 120, WORKERS = 3;
  const segs = [];
  for (let a = 0, k = 0; a < FRAMES; a += SEG, k++) segs.push([k, a, Math.min(FRAMES, a + SEG)]);
  const start = Date.now();
  let next = 0, done = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    while (next < segs.length) {
      const [k, a, b] = segs[next++];
      await run(['--segment', k, a, b].map(String));
      done++;
      process.stdout.write(`\rsegments ${done}/${segs.length}  ${((Date.now() - start) / 1000).toFixed(0)}s`);
    }
  }));
  const list = path.join(OUT, 'segments', 'list.txt');
  fs.writeFileSync(list, segs.map(([k]) => `file 'seg-${String(k).padStart(3, '0')}.mp4'`).join('\n') + '\n');
  const out = path.join(OUT, 'parabola-b.mp4');
  execFileSync(ffmpeg, ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-i', mix,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
  console.log(`\nwrote ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
