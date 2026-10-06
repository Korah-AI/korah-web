// Korah CODE reel: 1080x1920, 30fps. Pixels build, glitch and resolve into a
// paper-cut world. Everything is drawn in code.
// Usage:
//   node korah-code/render.js                      write out/korah-code.mp4
//   node korah-code/render.js --stills 1.8,7.5     write review PNGs for those seconds
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createCanvas, GlobalFonts, loadImage } = require('@napi-rs/canvas');
const ffmpeg = require('ffmpeg-static');
const {
  rng, clamp01, lerp, span, inOut, outCubic, outBack, spring,
  rectPts, rrectPts, ellipsePts, cut, paper, light,
} = require('./paper');
const px = require('./pixels');
const typo = require('./typo');
const world = require('./world');
const { T, KEYS, UI_PIECES, RIPPLE } = require('./timeline');
const { writeWav } = require('./audio');

require('v8').setFlagsFromString('--expose-gc');
const gc = require('vm').runInNewContext('gc');

const W = 1080, H = 1920, FPS = 30;
const HERE = __dirname;
for (const f of fs.readdirSync(path.join(HERE, 'assets/fonts'))) GlobalFonts.registerFromPath(path.join(HERE, 'assets/fonts', f));

// ---- palette ---------------------------------------------------------------
const C = {
  cream: '#f6eddd',
  cream2: '#efe3ce',
  paper: '#fdf8ef',
  ink: '#0f0b1e',
  ink2: '#171130',
  text: '#241a3d',
  text2: '#6a5a8c',
  purple: '#8b5cf6',
  deep: '#6d28d9',
  light: '#a78bfa',
  pale: '#e7dcfd',
  mag: '#c026d3',
  glow: '#f0abfc',
  teal: '#2dd4bf',
  sand: '#e6d3ae',
  shade: '#d9c8a8',
};

// All three weights register under one family, so the weight goes in the shorthand.
const EB = (s) => `800 ${s}px "Plus Jakarta Sans"`;
const BD = (s) => `700 ${s}px "Plus Jakarta Sans"`;
const MD = (s) => `500 ${s}px "Plus Jakarta Sans"`;

// Largest size that keeps a line inside `maxW`.
function fit(text, mk, maxW, cap, track = 0) {
  let s = cap;
  while (s > 10 && typo.width(text, mk(s), track * s) > maxW) s -= 1;
  return { font: mk(s), size: s, track: track * s };
}

// ---- world staging ---------------------------------------------------------
// One shared desk, used by beat 3 and beat 4. Scene units are "world" units; the
// camera decides how much of them the frame sees.
// Over the shoulder: monitor far, keyboard mid, the student's head and shoulders
// closest to camera. A desk seen side on does not fill a 9:16 frame; the same
// furniture stacked up the frame does.
const DESK_Y = 1120;                                     // far edge of the desk surface
const MON = { x: 150, y: 430, w: 780, h: 620 };
const SCR = { x: 186, y: 466, w: 708, h: 500 };
const KBD = { x: 300, y: 1330, w: 480, h: 96 };
const FIG = { x: 210, y: 1330, w: 660, h: 620, cell: 15 };
const HANDL = { x: 387, y: 1381 };
const HANDR = { x: 693, y: 1381 };
const STAND = { x: 40, y: 510, w: 340, h: 510, cell: 17 };
const MAP = { x: 60, y: 580, w: 960, h: 420 };
const UI = { x: 320, y: 300, w: 440, h: 740 };

const rr = (x, y, w, h, r, seed, amp) => cut(rrectPts(x, y, w, h, r, 6), seed, amp ?? 1.1, 15);

// ---- camera ----------------------------------------------------------------
// (cx, cy) is the world point parked in the middle of the frame.
function cam(ctx, cx, cy, zoom) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.translate(W / 2, H / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-cx, -cy);
  light.k = zoom;
  CAM.x = cx; CAM.y = cy; CAM.z = zoom;
}
const CAM = { x: 540, y: 960, z: 1 };

// ---- prebuilt geometry -----------------------------------------------------
const S = {};
function build(assets) {
  if (S.ready) return;
  // soft background paper shapes, the parallax layer behind every cream beat
  S.blobs = [];
  const r = rng(52);
  for (let i = 0; i < 5; i++) {
    const cx = 120 + r() * 840, cy = 200 + r() * 1500;
    const rad = 260 + r() * 340;
    S.blobs.push({
      path: cut(ellipsePts(cx, cy, rad, rad * (0.62 + r() * 0.3), 26), 200 + i, 3.2, 40),
      depth: 0.16 + r() * 0.2,
      tone: i % 2 ? C.cream2 : C.sand,
      a: 0.3 + r() * 0.22,
    });
  }
  // transition curtain: one threshold per cell, so the front is ragged but stable
  S.wipeCell = 24;
  S.wipeCols = Math.ceil(W / S.wipeCell); S.wipeRows = Math.ceil(H / S.wipeCell);
  S.wipe = new Float32Array(S.wipeCols * S.wipeRows);
  const rw = rng(808);
  for (let j = 0; j < S.wipeRows; j++)
    for (let i = 0; i < S.wipeCols; i++)
      S.wipe[j * S.wipeCols + i] = (i / S.wipeCols) * 0.74 + (j / S.wipeRows) * 0.14 + rw() * 0.12;

  buildBeat1(assets);
  buildBeat2();
  buildBeat3();
  buildBeat4();
  buildEnd(assets);
  S.ready = true;
}

// Parallax background: a cream wash plus a few big soft paper shapes that lag
// behind the camera, so nothing in frame is ever completely still.
function creamBack(ctx, tone = C.cream) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 220, H);
  g.addColorStop(0, '#fbf5ea');
  g.addColorStop(0.55, tone);
  g.addColorStop(1, C.cream2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (const b of S.blobs) {
    ctx.save();
    ctx.translate((540 - CAM.x) * b.depth, (960 - CAM.y) * b.depth);
    ctx.globalAlpha = b.a;
    ctx.fillStyle = b.tone;
    ctx.fill(b.path);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

function vignette(ctx, strength = 0.2) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.24, W / 2, H * 0.5, H * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(38,22,10,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// The transition curtain. u 0..1 fills the frame from the left with a ragged front.
function curtain(ctx, u, color) {
  if (u <= 0) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = color;
  const cs = S.wipeCell;
  for (let j = 0; j < S.wipeRows; j++)
    for (let i = 0; i < S.wipeCols; i++)
      if (u > S.wipe[j * S.wipeCols + i]) ctx.fillRect(i * cs, j * cs, cs + 0.5, cs + 0.5);
}

// ---- beat 1: the mark resolves --------------------------------------------
function buildBeat1(assets) {
  const s = 336;
  S.b1 = { s, cx: 540, cy: 762 };
  S.b1.field = px.seedField(
    px.rasterize(s, s, 12, (x) => x.drawImage(assets.logo, 0, 0, s, s)),
    1207, { order: 'radial', throw: 700 });
  S.b1.card = rr(540 - 214, 762 - 214, 428, 428, 58, 31);
  S.b1.title = fit('Korah CODE', EB, 880, 136, 0.004);
  S.b1.subLines = ['A software engineering internship', 'for high schoolers'];
  S.b1.sub = fit(S.b1.subLines[0], MD, 830, 54, 0.002);
}

function drawBeat1(ctx, t, assets) {
  const p = span(t, 0, T.b1End);
  creamBack(ctx);
  cam(ctx, 540, lerp(958, 928, inOut(p)), lerp(1.0, 1.07, inOut(p)));

  const { s, cx, cy, field } = S.b1;
  const u = span(t, T.markIn, T.markSet);
  const res = span(t, T.markResolve, T.markResolve + 0.26);

  // the paper card blooms out from behind the mark as it resolves
  if (res > 0) {
    const k = outBack(clamp01(res * 1.2), 2.1);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(lerp(0.72, 1, k), lerp(0.72, 1, k));
    ctx.translate(-cx, -cy);
    paper(ctx, S.b1.card, C.paper, { z: 2.4, alpha: clamp01(res * 2) });
    ctx.restore();
  }
  // clean mark in, pixel mark out
  if (res > 0) {
    ctx.save();
    ctx.globalAlpha = clamp01(res * 1.6);
    const k = lerp(1.06, 1, outCubic(clamp01(res * 1.2)));
    ctx.drawImage(assets.logo, cx - (s * k) / 2, cy - (s * k) / 2, s * k, s * k);
    ctx.restore();
  }
  px.drawField(ctx, field, cx - s / 2, cy - s / 2, u, {
    stagger: 0.6, clock: t, fade: 1 - clamp01(res * 1.5),
    hot: C.glow, glitch: 0.5 * (1 - span(t, T.markIn, T.markIn + 0.75)),
  });
  // the blip: a quick bloom of light where the pixels became paper
  const fl = 1 - span(t, T.markResolve, T.markResolve + 0.42);
  if (fl > 0 && t >= T.markResolve) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 460);
    g.addColorStop(0, `rgba(255,252,244,${0.6 * fl * fl})`);
    g.addColorStop(1, 'rgba(255,252,244,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 500, cy - 500, 1000, 1000);
  }

  const out = span(t, T.b1Out - 0.1, T.b1End);
  typo.line(ctx, 'Korah CODE', S.b1.title.font, C.text, 540, 1166,
    { t: t - T.title, track: S.b1.title.track, step: 0.036, z: 1.7, out: out * 1.4 });
  S.b1.subLines.forEach((ln, i) => {
    typo.line(ctx, ln, S.b1.sub.font, C.text2, 540, 1268 + i * 66,
      { t: t - T.sub - i * 0.16, track: S.b1.sub.track, step: 0.012, z: 0.7, out: out * 1.6 });
  });

  vignette(ctx, 0.17);
  curtain(ctx, span(t, T.b1Out, T.b1End), C.ink);
}

// ---- beat 2: pixels become die-cut letters ---------------------------------
function buildBeat2() {
  const l1 = fit('JOIN AN', EB, 560, 92, 0.03);
  const l2 = fit('AI STARTUP.', EB, 950, 168, 0.005);
  S.b2 = { l1, l2, bx: 40, by: 760, bw: 1000, bh: 340 };
  // rasterise both lines exactly where they sit, so the pixels land on the letters
  S.b2.field = px.seedField(
    px.rasterize(S.b2.bw, S.b2.bh, 13, (x) => {
      x.translate(-S.b2.bx, -S.b2.by);
      typo.line(x, 'JOIN AN', l1.font, C.light, 540, 880, { t: 9, track: l1.track, z: 0 });
      typo.line(x, 'AI STARTUP.', l2.font, C.cream, 540, 1040, { t: 9, track: l2.track, z: 0 });
    }, 0.3),
    4422, { order: 'left', throw: 520 });
  // pixel dust drifting behind the type
  const r = rng(77);
  S.b2.dust = [];
  for (let i = 0; i < 90; i++) S.b2.dust.push([r() * 1200 - 60, r() * 2000 - 40, 6 + r() * 16, 0.05 + r() * 0.16, r()]);
}

function drawBeat2(ctx, t) {
  const p = span(t, T.b2, T.b2End);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 300, H);
  g.addColorStop(0, C.ink2);
  g.addColorStop(0.6, C.ink);
  g.addColorStop(1, '#0a0716');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // a slow purple wash behind the words
  const rg = ctx.createRadialGradient(540, 960, 60, 540, 960, 900);
  rg.addColorStop(0, `rgba(139,92,246,${0.2 + 0.06 * Math.sin(t * 1.2)})`);
  rg.addColorStop(1, 'rgba(139,92,246,0)');
  ctx.fillStyle = rg;
  ctx.fillRect(0, 0, W, H);

  cam(ctx, 540, lerp(975, 945, inOut(p)), lerp(0.97, 1.11, inOut(p)));

  for (const [x, y, sz, a, k] of S.b2.dust) {
    const dy = ((y - t * (18 + k * 40)) % 2100 + 2100) % 2100 - 60;
    ctx.globalAlpha = a * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.7 + k * 9)));
    ctx.fillStyle = k > 0.6 ? C.light : '#6d4fd0';
    ctx.fillRect(x, dy, sz, sz);
  }
  ctx.globalAlpha = 1;

  const u = span(t, T.joinIn, T.joinResolve - 0.12);
  const res = span(t, T.joinResolve, T.joinResolve + 0.24);
  const out = span(t, T.b2Out, T.b2Out + 0.5);

  px.drawField(ctx, S.b2.field, S.b2.bx, S.b2.by, out > 0 ? 1 - out * 0.75 : u, {
    stagger: 0.48, clock: t, hot: C.glow,
    fade: out > 0 ? clamp01(out * 2.2) * (1 - span(t, T.b2Out + 0.28, T.b2End)) : 1 - clamp01(res * 1.6),
    glitch: out > 0 ? 0.9 * out : 0.45 * (1 - span(t, T.joinIn, T.joinIn + 0.6)),
  });

  const on = clamp01(res * 1.7) * (1 - clamp01(out * 2.6));
  if (on > 0) {
    ctx.globalAlpha = on;
    typo.line(ctx, 'JOIN AN', S.b2.l1.font, C.light, 540, 880, { t: 9, track: S.b2.l1.track, z: 1.2 });
    typo.line(ctx, 'AI STARTUP.', S.b2.l2.font, C.cream, 540, 1040, { t: 9, track: S.b2.l2.track, z: 1.8 });
    ctx.globalAlpha = 1;
  }
  const fl = 1 - span(t, T.joinResolve, T.joinResolve + 0.4);
  if (fl > 0 && t >= T.joinResolve) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(233,222,255,${0.2 * fl * fl})`;
    ctx.fillRect(0, 0, W, H);
  }
  vignette(ctx, 0.4);
  // hand off to the cream world
  const fade = span(t, T.b2End - 0.34, T.b2End);
  if (fade > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(246,237,221,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---- the desk (shared by beats 3 and 4) ------------------------------------
// The two figures are painted as plain shapes and then rasterised onto a 15px
// grid, so they land on the same pixel grid as everything else in the film.
function rrx(x, px_, py, w, h, r) {
  x.beginPath();
  x.moveTo(px_ + r, py);
  x.arcTo(px_ + w, py, px_ + w, py + h, r);
  x.arcTo(px_ + w, py + h, px_, py + h, r);
  x.arcTo(px_, py + h, px_, py, r);
  x.arcTo(px_, py, px_ + w, py, r);
  x.closePath();
  x.fill();
}

// Seen from behind, hands up on the keys. `lift` swaps which hand is raised.
function paintBack(x, lift) {
  const hl = lift ? -16 : 0, hr = lift ? 0 : -16;
  x.lineCap = 'round';
  x.lineWidth = 74;
  x.strokeStyle = '#a78bfa';
  x.beginPath(); x.moveTo(118, 340); x.quadraticCurveTo(102, 198, 177, 62 + hl); x.stroke();
  x.beginPath(); x.moveTo(542, 340); x.quadraticCurveTo(558, 198, 483, 62 + hr); x.stroke();
  x.fillStyle = '#f0c49b';
  rrx(x, 140, 20 + hl, 74, 62, 22);
  rrx(x, 446, 20 + hr, 74, 62, 22);
  x.fillStyle = '#8b5cf6';
  x.beginPath(); x.ellipse(330, 500, 292, 200, 0, 0, 7); x.fill();
  x.fillStyle = '#7c4df0';
  x.beginPath(); x.ellipse(330, 618, 292, 112, 0, 0, 7); x.fill();
  x.beginPath(); x.ellipse(330, 400, 112, 44, 0, 0, 7); x.fill();
  x.fillStyle = '#e0b189';
  rrx(x, 292, 330, 76, 96, 18);
  x.fillStyle = '#2b2040';
  x.beginPath(); x.ellipse(330, 265, 142, 152, 0, 0, 7); x.fill();
  x.fillStyle = '#4e3a66';
  x.beginPath(); x.ellipse(292, 198, 100, 80, -0.3, 0, 7); x.fill();
}

// Standing, facing us, for the pull-back at the end of beat 4.
function paintStand(x) {
  x.fillStyle = '#3a3450';
  rrx(x, 102, 296, 42, 116, 12);
  rrx(x, 156, 296, 42, 116, 12);
  x.fillStyle = '#211c33';
  rrx(x, 94, 400, 56, 32, 10);
  rrx(x, 150, 400, 56, 32, 10);
  x.fillStyle = '#a78bfa';
  rrx(x, 58, 166, 36, 126, 16);
  rrx(x, 206, 166, 36, 126, 16);
  x.fillStyle = '#f0c49b';
  rrx(x, 56, 282, 40, 38, 15);
  rrx(x, 204, 282, 40, 38, 15);
  x.fillStyle = '#8b5cf6';
  rrx(x, 86, 156, 128, 156, 26);
  x.fillStyle = '#7c4df0';
  rrx(x, 86, 156, 128, 26, 13);
  x.fillStyle = '#e0b189';
  rrx(x, 132, 128, 36, 38, 10);
  x.fillStyle = '#f0c49b';
  x.beginPath(); x.ellipse(150, 86, 74, 76, 0, 0, 7); x.fill();
  x.fillStyle = '#2b2040';
  x.beginPath(); x.ellipse(150, 34, 78, 54, 0, 0, 7); x.fill();
  x.fillRect(72, 34, 24, 52);
  x.fillRect(204, 34, 24, 52);
  x.fillStyle = '#221833';
  x.fillRect(114, 96, 16, 20);
  x.fillRect(170, 96, 16, 20);
  x.fillRect(136, 134, 28, 8);
}

function buildDesk() {
  S.desk = {
    top: cut(rectPts(-300, DESK_Y, 1700, 470), 61, 1.8, 30),
    far: cut(rectPts(-300, DESK_Y, 1700, 14), 62, 1.1, 24),
    front: cut(rectPts(-300, DESK_Y + 458, 1700, 520), 68, 1.6, 30),
    mon: rr(MON.x, MON.y, MON.w, MON.h, 26, 63),
    scr: rr(SCR.x, SCR.y, SCR.w, SCR.h, 12, 64, 0.7),
    neck: cut(rectPts(502, MON.y + MON.h - 8, 76, 82), 65, 1, 14),
    foot: cut(ellipsePts(540, DESK_Y + 14, 132, 26, 22), 66, 1, 14),
    kbd: rr(KBD.x, KBD.y, KBD.w, KBD.h, 14, 67, 0.9),
    mug: cut([[846, 1180], [934, 1180], [922, 1300], [858, 1300]], 69, 1.2, 16),
    mugLip: cut(ellipsePts(890, 1182, 44, 13, 20), 70, 0.9, 12),
    mugEar: cut([[934, 1204], [972, 1214], [968, 1252], [930, 1254]], 71, 1, 14),
  };
  S.fig = [
    px.rasterize(FIG.w, FIG.h, FIG.cell, (x) => paintBack(x, 0)),
    px.rasterize(FIG.w, FIG.h, FIG.cell, (x) => paintBack(x, 1)),
  ];
  S.stand = px.rasterize(STAND.w, STAND.h, STAND.cell, (x) => { x.scale(STAND.w / 300, STAND.h / 450); paintStand(x); });
  // the code that runs on the screen: rows of token blocks
  const r = rng(909);
  S.code = [];
  for (let i = 0; i < 30; i++) {
    const row = { ind: Math.floor(r() * 4), toks: [] };
    const n = 1 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) row.toks.push([28 + Math.floor(r() * 120), Math.floor(r() * 4)]);
    S.code.push(row);
  }
  S.codeCols = [C.purple, C.teal, '#8f86a8', '#e0b0ff'];
}

function drawDesk(ctx, t, opt = {}) {
  const a = opt.alpha ?? 1;
  if (a <= 0.004) return;
  ctx.save();
  ctx.globalAlpha = a;

  paper(ctx, S.desk.front, '#d9bd95', { z: 0, alpha: a, grain: 0.7 });
  paper(ctx, S.desk.top, '#ead6b6', { z: 2.4, alpha: a });
  paper(ctx, S.desk.far, '#f6e6cb', { z: 0, alpha: a, edge: false });

  if (opt.monitor !== false) {
    paper(ctx, S.desk.foot, '#c0a179', { z: 0.8, alpha: a, edge: false });
    paper(ctx, S.desk.neck, '#cbb89a', { z: 1.2, alpha: a });
    paper(ctx, S.desk.mon, C.paper, { z: 3, alpha: a });
    paper(ctx, S.desk.scr, '#1b1430', { z: 0, alpha: a, grain: 0.3 });
    const codeA = opt.code ?? 1;
    if (codeA > 0.004) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(SCR.x + 8, SCR.y + 8, SCR.w - 16, SCR.h - 16);
      ctx.clip();
      ctx.globalAlpha = a * codeA;
      const lh = 26, scroll = (t - T.b3) * 74;
      for (let i = -2; i < 20; i++) {
        const row = S.code[((i + Math.floor(scroll / lh)) % S.code.length + S.code.length) % S.code.length];
        const y = SCR.y + 20 + i * lh - (scroll % lh);
        let x = SCR.x + 26 + row.ind * 22;
        for (const [w, ci] of row.toks) {
          ctx.fillStyle = S.codeCols[ci];
          ctx.fillRect(x, y, w, 11);
          x += w + 14;
        }
      }
      ctx.restore();
      ctx.globalAlpha = a * codeA * 0.45;
      ctx.globalCompositeOperation = 'screen';
      const g = ctx.createRadialGradient(540, SCR.y + SCR.h / 2, 40, 540, SCR.y + SCR.h / 2, 520);
      g.addColorStop(0, 'rgba(150,120,255,0.5)');
      g.addColorStop(1, 'rgba(150,120,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-200, SCR.y - 520, 1500, SCR.h + 1040);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = a;
    }
  }

  paper(ctx, S.desk.mugEar, '#d7cbb4', { z: 1, alpha: a });
  paper(ctx, S.desk.mug, C.paper, { z: 1.8, alpha: a });
  paper(ctx, S.desk.mugLip, '#c9b9f2', { z: 0, alpha: a, edge: false });
  paper(ctx, S.desk.kbd, '#efe6d4', { z: 1.6, alpha: a });
  ctx.globalAlpha = a * 0.45;
  ctx.fillStyle = '#b8a88c';
  for (let i = 0; i < 11; i++) for (let j = 0; j < 4; j++) ctx.fillRect(KBD.x + 22 + i * 41, KBD.y + 15 + j * 20, 30, 12);
  ctx.globalAlpha = a;

  const lift = (opt.typing ?? false) && Math.floor(t * 7) % 2 === 0;
  px.blit(ctx, S.fig[lift ? 1 : 0], FIG.x, FIG.y, a, 9);
  ctx.restore();
}

// ---- beat 3: the map -------------------------------------------------------
const MAPIN = { x: MAP.x + 42, y: MAP.y + 50, w: 876, h: 320 };

function paintMap(ctx, fill) {
  const proj = world.projector(MAPIN.x, MAPIN.y, MAPIN.w, MAPIN.h);
  let i = 0;
  for (const name of Object.keys(world.LANDS)) {
    const pts = world.LANDS[name].map(([lo, la]) => proj(lo, la));
    const p = cut(pts, 300 + i++, 1.1, 22);
    if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
    else paper(ctx, p, i % 2 ? '#8b5cf6' : '#7c4df0', { z: 1.3, grain: 0.55 });
  }
}

function buildBeat3() {
  buildDesk();
  S.b3 = {
    card: rr(MAP.x, MAP.y, MAP.w, MAP.h, 30, 71),
    proj: world.projector(MAPIN.x, MAPIN.y, MAPIN.w, MAPIN.h),
  };
  const home = S.b3.proj(...world.HOME);
  let far = 1;
  S.b3.dots = world.DOTS.map(([lo, la]) => {
    const [x, y] = S.b3.proj(lo, la);
    const d = Math.hypot(x - home[0], y - home[1]);
    far = Math.max(far, d);
    return { x, y, d };
  });
  for (const d of S.b3.dots) d.delay = (d.d / far) * RIPPLE;
  S.b3.cluster = world.CLUSTER.map(([lo, la, ph]) => { const [x, y] = S.b3.proj(lo, la); return { x, y, ph }; });
  // the swirl: map pixels start life scattered over the little screen
  const sr = rng(313);
  S.b3.field = px.seedField(
    px.rasterize(MAPIN.w, MAPIN.h, 11, (x) => {
      x.translate(-MAPIN.x, -MAPIN.y);
      paintMap(x, '#8b5cf6');
    }, 0.3),
    5150, {
      order: 'random',
      from: (c) => [
        (SCR.x - MAPIN.x) + 18 + sr() * (SCR.w - 36),
        (SCR.y - MAPIN.y) + 18 + sr() * (SCR.h - 36),
      ],
    });
  S.b3.stats = [
    { big: '100,000+', small: 'REACHED ONLINE', t: T.stat1, until: T.stat2 },
    { big: 'HUNDREDS', small: 'OF ACTIVE USERS', t: T.stat2, until: T.stat3 },
    { big: 'GROWING', small: 'DAILY', t: T.stat3, until: T.b3Out + 0.35 },
  ];
  for (const s of S.b3.stats) {
    s.bf = fit(s.big, EB, 900, 150, 0.004);
    s.sf = fit(s.small, EB, 820, 56, 0.06);
  }
}

function drawBeat3(ctx, t) {
  creamBack(ctx);
  // close on the desk, then up and out to take in the map
  const m = inOut(span(t, T.lift - 0.2, T.mapResolve + 0.35));
  const push = inOut(span(t, T.mapResolve, T.b3End));
  cam(ctx, 540, lerp(1062, 900, m) - push * 12, lerp(1.05, 1.0, m) + push * 0.05);

  const deskA = 1 - span(t, T.lift + 0.15, T.mapResolve - 0.05);
  drawDesk(ctx, t, { alpha: deskA, typing: t < T.lift, code: 1 - span(t, T.lift, T.lift + 0.45) });

  const u = span(t, T.lift, T.mapResolve);
  const res = span(t, T.mapResolve, T.mapResolve + 0.3);
  const out = span(t, T.b3Out, T.b3End - 0.12);

  // the paper card the map is cut into
  if (res > 0) {
    const k = outBack(clamp01(res * 1.25), 1.8);
    ctx.save();
    ctx.translate(540, MAP.y + MAP.h / 2);
    ctx.scale(lerp(0.88, 1, k), lerp(0.7, 1, k));
    ctx.translate(-540, -(MAP.y + MAP.h / 2));
    paper(ctx, S.b3.card, C.paper, { z: 2.6, alpha: clamp01(res * 2) * (1 - out) });
    ctx.restore();
  }
  if (res > 0.02) {
    ctx.save();
    ctx.globalAlpha = clamp01(res * 1.8) * (1 - out);
    paintMap(ctx, null);
    ctx.restore();
    drawDots(ctx, t, clamp01(res * 2) * (1 - out));
  }
  px.drawField(ctx, S.b3.field, MAPIN.x, MAPIN.y, u, {
    stagger: 0.42, clock: t, swirl: 2.4, hot: C.glow,
    fade: (1 - clamp01(res * 1.6)) * clamp01(span(t, T.lift, T.lift + 0.12) * 3),
  });
  const fl = 1 - span(t, T.mapResolve, T.mapResolve + 0.4);
  if (fl > 0 && t >= T.mapResolve) {
    const g = ctx.createRadialGradient(540, MAP.y + MAP.h / 2, 0, 540, MAP.y + MAP.h / 2, 700);
    g.addColorStop(0, `rgba(255,252,244,${0.5 * fl * fl})`);
    g.addColorStop(1, 'rgba(255,252,244,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, MAP.y - 400, W, MAP.h + 800);
  }

  for (const s of S.b3.stats) {
    const o = span(t, s.until - 0.3, s.until);
    if (t < s.t - 0.1 || o >= 1) continue;
    typo.line(ctx, s.big, s.bf.font, C.purple, 540, 1200, { t: t - s.t, track: s.bf.track, step: 0.03, z: 1.6, out: o });
    typo.line(ctx, s.small, s.sf.font, C.text, 540, 1274, { t: t - s.t - 0.2, track: s.sf.track, step: 0.012, z: 0.8, out: o });
  }

  vignette(ctx, 0.17);
  const fade = span(t, T.b3End - 0.3, T.b3End);
  if (fade > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(246,237,221,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// Glowing dots rippling out from the home cluster, with live activity on top.
function drawDots(ctx, t, alpha) {
  const e = t - T.dots;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const d of S.b3.dots) {
    const u = clamp01((e - d.delay) / 0.4);
    if (u <= 0) continue;
    const pop = outBack(u, 2.4);
    const pulse = 0.72 + 0.28 * Math.sin((e - d.delay) * 2.4 + d.d * 0.02);
    const r = 5.4 * pop;
    ctx.globalAlpha = alpha * 0.22 * pulse;
    ctx.fillStyle = C.glow;
    ctx.beginPath(); ctx.arc(d.x, d.y, r * 3.1, 0, 7); ctx.fill();
    ctx.globalAlpha = alpha * clamp01(u * 2);
    ctx.fillStyle = '#fceaff';
    ctx.beginPath(); ctx.arc(d.x, d.y, r, 0, 7); ctx.fill();
    ctx.fillStyle = C.mag;
    ctx.beginPath(); ctx.arc(d.x, d.y, r * 0.5, 0, 7); ctx.fill();
  }
  // the cluster: expanding rings plus typing bubbles and a couple of live cursors
  for (const c of S.b3.cluster) {
    const ph = ((e + c.ph) % 1.9) / 1.9;
    if (e + c.ph < 0.3) continue;
    ctx.globalAlpha = alpha * 0.5 * (1 - ph);
    ctx.strokeStyle = C.mag;
    ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(c.x, c.y, 6 + ph * 40, 0, 7); ctx.stroke();
  }
  const home = S.b3.cluster[0];
  drawTyping(ctx, home.x - 96, home.y - 74, e - 0.9, alpha);
  drawTyping(ctx, home.x + 74, home.y + 40, e - 1.9, alpha);
  drawCursor(ctx, home.x + 46, home.y - 96, e - 1.35, alpha, 'ava');
  drawCursor(ctx, home.x - 130, home.y + 58, e - 2.4, alpha, 'dev');
  ctx.restore();
}

function drawTyping(ctx, x, y, e, alpha) {
  if (e < 0) return;
  const u = clamp01(outBack(clamp01(e * 4), 2.6));
  ctx.save();
  ctx.globalAlpha = alpha * clamp01(e * 5);
  ctx.translate(x, y);
  ctx.scale(u, u);
  paper(ctx, rr(-34, -20, 68, 40, 16, 81, 0.7), C.paper, { z: 1.4 });
  for (let i = 0; i < 3; i++) {
    const b = 0.5 + 0.5 * Math.sin(e * 8 - i * 0.9);
    ctx.globalAlpha = alpha * (0.35 + 0.65 * b);
    ctx.fillStyle = C.purple;
    ctx.beginPath(); ctx.arc(-17 + i * 17, -1 - b * 3, 5, 0, 7); ctx.fill();
  }
  ctx.restore();
}

function drawCursor(ctx, x, y, e, alpha, name) {
  if (e < 0) return;
  const u = clamp01(outBack(clamp01(e * 3.4), 2.2));
  const drift = Math.sin(e * 1.4) * 16;
  ctx.save();
  ctx.globalAlpha = alpha * clamp01(e * 4);
  ctx.translate(x + drift, y + Math.cos(e * 1.1) * 10);
  ctx.scale(u, u);
  ctx.fillStyle = C.deep;
  ctx.beginPath();
  ctx.moveTo(0, 0); ctx.lineTo(0, 26); ctx.lineTo(7, 19); ctx.lineTo(12, 30); ctx.lineTo(17, 27); ctx.lineTo(12, 17); ctx.lineTo(21, 15);
  ctx.closePath(); ctx.fill();
  paper(ctx, rr(16, 26, 20 + name.length * 15, 30, 9, 91, 0.6), C.purple, { z: 1, grain: 0.4 });
  ctx.fillStyle = '#fff';
  ctx.font = BD(19);
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 26, 42);
  ctx.restore();
}

// ---- beat 4: typing builds the interface -----------------------------------
const SLOTS = {
  frame:  { x: UI.x,      y: UI.y,       w: UI.w,      h: UI.h, r: 40 },
  header: { x: UI.x + 28, y: UI.y + 32,  w: UI.w - 56, h: 68,  r: 18 },
  card:   { x: UI.x + 28, y: UI.y + 116, w: UI.w - 56, h: 128, r: 20 },
  card2:  { x: UI.x + 28, y: UI.y + 258, w: UI.w - 56, h: 128, r: 20 },
  chart:  { x: UI.x + 28, y: UI.y + 400, w: UI.w - 56, h: 166, r: 20 },
  row:    { x: UI.x + 28, y: UI.y + 580, w: UI.w - 56, h: 56,  r: 16 },
  button: { x: UI.x + 28, y: UI.y + 652, w: UI.w - 56, h: 68,  r: 34 },
};
const TILE = (SLOTS.card2.w - 16) / 2;

function buildBeat4() {
  S.b4 = { slot: {}, at: {} };
  let seed = 400;
  for (const [name, s] of Object.entries(SLOTS)) S.b4.slot[name] = rr(s.x, s.y, s.w, s.h, s.r, seed++);
  S.b4.hand = {};
  UI_PIECES.forEach(([i, name], k) => { S.b4.at[name] = KEYS[i]; S.b4.hand[name] = k % 2 ? HANDR : HANDL; });
  S.b4.tileL = rr(SLOTS.card2.x, SLOTS.card2.y, TILE, 128, 20, 431);
  S.b4.tileR = rr(SLOTS.card2.x + TILE + 16, SLOTS.card2.y, TILE, 128, 20, 432);
  S.b4.ground = cut(rectPts(-500, 1020, 2100, 150), 441, 1.6, 34);
  S.b4.team = fit('BECOME PART', EB, 900, 122, 0.01);
  S.b4.team2 = fit('OF THE TEAM.', EB, 900, 122, 0.01);
  // the chart line inside the interface
  const r = rng(77);
  S.b4.spark = [];
  for (let i = 0; i < 9; i++) S.b4.spark.push(0.18 + (i / 8) * 0.62 + (r() - 0.5) * 0.22);
  S.b4.spark[8] = 0.9;
}

// One piece: a pixel flies up off the keys, then unfolds into paper mid-air.
function drawPiece(ctx, name, t) {
  const t0 = S.b4.at[name];
  const hand = S.b4.hand[name];
  const fly = span(t, t0, t0 + 0.32);
  const open = span(t, t0 + 0.3, t0 + 0.94);
  if (fly <= 0) return;
  const s = SLOTS[name];
  const cx = s.x + s.w / 2, cy = s.y + s.h / 2;

  if (open <= 0) {
    const e = outCubic(fly);
    const mx = (hand.x + cx) / 2 + (hand.x - cx) * 0.3, my = Math.min(hand.y, cy) - 230;
    const sz = lerp(16, 30, e);
    ctx.save();
    for (let i = 2; i >= 0; i--) {
      const ee = Math.max(0, e - i * 0.07);
      ctx.globalAlpha = i === 0 ? 1 : 0.2 / i;
      ctx.fillStyle = i === 0 ? C.purple : C.light;
      const q = (a, b, c) => (1 - ee) * (1 - ee) * a + 2 * (1 - ee) * ee * b + ee * ee * c;
      ctx.fillRect(q(hand.x, mx, cx) - sz / 2, q(hand.y, my, cy) - sz / 2, sz, sz);
    }
    ctx.restore();
    return;
  }

  const k = clamp01(spring(open * 0.78, 1.1, 8.5));
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((1 - k) * (name === 'frame' ? 0.18 : 0.3));
  ctx.scale(lerp(0.34, 1, clamp01(k * 1.4)), lerp(0.04, 1, k));
  ctx.translate(-cx, -cy);
  const body = clamp01(open * 4);
  if (name === 'frame') paper(ctx, S.b4.slot.frame, '#fdfbff', { z: 4.6, alpha: body, grain: 0.55 });
  else if (name === 'header') {
    paper(ctx, S.b4.slot.header, C.purple, { z: 1.4, alpha: body, grain: 0.5 });
    ctx.globalAlpha = body;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(s.x + 34, cy, 13, 0, 7); ctx.fill();
    for (let i = 0; i < 3; i++) ctx.fillRect(s.x + 66, cy - 13 + i * 12, i === 2 ? 98 : 150, 7);
    ctx.globalAlpha = 1;
  } else if (name === 'card') {
    paper(ctx, S.b4.slot.card, C.pale, { z: 1.4, alpha: body });
    ctx.globalAlpha = body * 0.75;
    ctx.fillStyle = C.deep;
    for (let i = 0; i < 3; i++) ctx.fillRect(s.x + 26, s.y + 28 + i * 29, [256, 312, 190][i], 11);
    ctx.globalAlpha = 1;
  } else if (name === 'card2') {
    paper(ctx, S.b4.tileL, C.paper, { z: 1.4, alpha: body });
    paper(ctx, S.b4.tileR, C.paper, { z: 1.4, alpha: body });
    ctx.globalAlpha = body;
    ctx.fillStyle = C.purple;
    ctx.fillRect(s.x + 24, s.y + 26, 50, 50);
    ctx.fillStyle = C.mag;
    ctx.fillRect(s.x + TILE + 40, s.y + 26, 50, 50);
    ctx.globalAlpha = body * 0.5;
    ctx.fillStyle = C.text2;
    ctx.fillRect(s.x + 24, s.y + 92, TILE - 48, 10);
    ctx.fillRect(s.x + TILE + 40, s.y + 92, TILE - 48, 10);
    ctx.globalAlpha = 1;
  } else if (name === 'chart') {
    paper(ctx, S.b4.slot.chart, C.paper, { z: 1.4, alpha: body });
    const grow = clamp01((open - 0.35) / 0.5);
    if (grow > 0) {
      ctx.save();
      ctx.globalAlpha = body;
      const n = S.b4.spark.length;
      const pt = (i) => [s.x + 22 + (i / (n - 1)) * (s.w - 44), s.y + s.h - 22 - S.b4.spark[i] * (s.h - 52)];
      const last = 1 + grow * (n - 1);
      ctx.beginPath();
      ctx.moveTo(...pt(0));
      for (let i = 1; i < last; i++) ctx.lineTo(...pt(Math.min(i, n - 1)));
      const [ex, ey] = pt(Math.min(Math.floor(last), n - 1));
      ctx.lineTo(ex, s.y + s.h - 22);
      ctx.lineTo(s.x + 22, s.y + s.h - 22);
      ctx.closePath();
      ctx.fillStyle = 'rgba(139,92,246,0.16)';
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(...pt(0));
      for (let i = 1; i < last; i++) ctx.lineTo(...pt(Math.min(i, n - 1)));
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.stroke();
      ctx.fillStyle = C.mag;
      ctx.beginPath(); ctx.arc(ex, ey, 8, 0, 7); ctx.fill();
      ctx.restore();
    }
  } else if (name === 'row') {
    paper(ctx, S.b4.slot.row, C.pale, { z: 1.2, alpha: body });
    ctx.globalAlpha = body;
    ctx.fillStyle = C.purple;
    ctx.beginPath(); ctx.arc(s.x + 32, cy, 13, 0, 7); ctx.fill();
    ctx.globalAlpha = body * 0.6;
    ctx.fillStyle = C.text2;
    ctx.fillRect(s.x + 58, cy - 6, 224, 11);
    ctx.globalAlpha = 1;
  } else if (name === 'button') {
    paper(ctx, S.b4.slot.button, C.mag, { z: 1.8, alpha: body, grain: 0.5 });
    ctx.globalAlpha = body;
    ctx.fillStyle = '#fff';
    ctx.font = EB(34);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Apply', cx, cy + 2);
    ctx.textAlign = 'left';
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function drawBeat4(ctx, t) {
  creamBack(ctx);
  const back = inOut(span(t, T.pullBack, T.pullBack + 1.15));
  const p1 = inOut(span(t, T.b4, T.pullBack));
  cam(ctx,
    lerp(540, 470, back),
    lerp(lerp(972, 950, p1), 790, back),
    lerp(lerp(1.0, 1.06, p1), 0.76, back));

  const deskA = 1 - span(t, T.pullBack + 0.05, T.pullBack + 0.45);
  const standA = span(t, T.pullBack + 0.5, T.pullBack + 0.95);

  if (standA > 0) {
    paper(ctx, S.b4.ground, C.shade, { z: 1.6, alpha: standA * 0.75, grain: 0.5 });
    const rise = (1 - outBack(clamp01(standA), 1.6)) * 70;
    px.blit(ctx, S.stand, STAND.x, STAND.y + rise, standA, 9);
  }
  drawDesk(ctx, t, { alpha: deskA, typing: t < T.typeTo + 0.2, monitor: false, code: 0 });

  // on the pull-back the finished thing lifts off the desk and scales up
  ctx.save();
  if (back > 0) {
    const hx = UI.x + UI.w / 2, hy = UI.y + UI.h / 2;
    ctx.translate(hx + 130 * back, hy - 30 * back);
    ctx.scale(lerp(1, 1.06, back), lerp(1, 1.06, back));
    ctx.translate(-hx, -hy);
  }
  const glow = span(t, T.uiGlow, T.uiGlow + 0.8) * (0.82 + 0.18 * Math.sin(t * 2.1));
  if (glow > 0) {
    const g = ctx.createRadialGradient(UI.x + UI.w / 2, UI.y + UI.h / 2, 60, UI.x + UI.w / 2, UI.y + UI.h / 2, 620);
    g.addColorStop(0, `rgba(192,38,211,${0.42 * glow})`);
    g.addColorStop(0.5, `rgba(139,92,246,${0.22 * glow})`);
    g.addColorStop(1, 'rgba(139,92,246,0)');
    ctx.fillStyle = g;
    ctx.fillRect(UI.x - 640, UI.y - 640, UI.w + 1280, UI.h + 1280);
  }
  for (const name of Object.keys(SLOTS)) drawPiece(ctx, name, t);
  ctx.restore();

  // the keystrokes that did not spawn a piece still throw a spark
  for (const k of KEYS) {
    const e = span(t, k, k + 0.34);
    if (e <= 0 || e >= 1) continue;
    ctx.globalAlpha = (1 - e) * 0.85;
    ctx.fillStyle = C.light;
    const h = KEYS.indexOf(k) % 2 ? HANDR : HANDL;
    ctx.fillRect(h.x - 7 + (e - 0.5) * 22, h.y - 14 - e * 120, 14, 14);
    ctx.globalAlpha = 1;
  }

  const out = span(t, T.b4Out, T.b4End - 0.14);
  typo.line(ctx, 'BECOME PART', S.b4.team.font, C.text, 470, 1258, { t: t - T.team, track: S.b4.team.track, step: 0.028, z: 1.7, out });
  typo.line(ctx, 'OF THE TEAM.', S.b4.team2.font, C.purple, 470, 1376, { t: t - T.team - 0.18, track: S.b4.team2.track, step: 0.028, z: 1.7, out });

  vignette(ctx, 0.18);
  const fade = span(t, T.b4End - 0.32, T.b4End);
  if (fade > 0) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = `rgba(246,237,221,${fade})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ---- end card --------------------------------------------------------------
function buildEnd(assets) {
  const url = 'korah.app/code';
  const uf = fit(url, EB, 720, 62, 0.004);
  const uw = typo.width(url, uf.font, uf.track);
  S.end = {
    url, uf, uw,
    card: rr(540 - 176, 706 - 176, 352, 352, 52, 501),
    pill: rr(540 - uw / 2 - 52, 1192, uw + 104, 104, 52, 502),
    title: fit('Korah CODE', EB, 880, 142, 0.004),
    eyebrow: fit('APPLY NOW AT', EB, 520, 40, 0.14),
    folds: [
      { path: cut(ellipsePts(210, 380, 560, 420, 24), 511, 3, 44), tone: C.sand, a: 0.5, from: [-380, -260], t: 0 },
      { path: cut(ellipsePts(900, 1560, 640, 470, 24), 512, 3, 44), tone: C.cream2, a: 0.75, from: [420, 320], t: 0.12 },
      { path: cut(ellipsePts(560, 1180, 720, 300, 24), 513, 3, 44), tone: C.sand, a: 0.35, from: [0, 420], t: 0.22 },
    ],
  };
  const r = rng(555);
  S.end.sparks = [];
  for (let i = 0; i < 22; i++) {
    const a = r() * Math.PI * 2, d = 190 + r() * 130;
    S.end.sparks.push([540 + Math.cos(a) * d, 706 + Math.sin(a) * d * 0.9, 8 + r() * 14, r() * 0.5, r()]);
  }
  S.end.logo = assets.logo;
}

function drawEnd(ctx, t) {
  const e = t - T.endFold;
  creamBack(ctx);
  cam(ctx, 540, 960, lerp(1.0, 1.045, inOut(clamp01(e / 4))));

  for (const f of S.end.folds) {
    const u = clamp01(spring(e - f.t, 0.9, 7));
    if (u <= 0.002) continue;
    ctx.save();
    ctx.globalAlpha = f.a * clamp01(u * 1.6);
    ctx.translate(f.from[0] * (1 - u), f.from[1] * (1 - u));
    ctx.fillStyle = f.tone;
    ctx.fill(f.path);
    ctx.restore();
  }

  const mk = clamp01(spring(t - T.endMark, 1.2, 8.5));
  if (mk > 0.002) {
    ctx.save();
    ctx.globalAlpha = clamp01(mk * 1.8);
    ctx.translate(540, 706);
    ctx.scale(lerp(0.7, 1, mk), lerp(0.7, 1, mk));
    ctx.translate(-540, -706);
    paper(ctx, S.end.card, C.paper, { z: 2.6, alpha: clamp01(mk * 1.8) });
    ctx.drawImage(S.end.logo, 540 - 138, 706 - 138, 276, 276);
    ctx.restore();
  }

  for (const [x, y, sz, ph, k] of S.end.sparks) {
    const u = span(t, T.endSpark + ph, T.endSpark + ph + 0.5);
    if (u <= 0 || u >= 1) continue;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    ctx.fillStyle = k > 0.5 ? C.glow : C.light;
    const d = 1 + u * 0.5;
    ctx.fillRect(540 + (x - 540) * d - sz / 2, 706 + (y - 706) * d - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;

  typo.line(ctx, 'Korah CODE', S.end.title.font, C.text, 540, 1068, { t: t - T.endTitle, track: S.end.title.track, step: 0.033, z: 1.8 });
  typo.line(ctx, 'APPLY NOW AT', S.end.eyebrow.font, C.text2, 540, 1152, { t: t - T.endUrl, track: S.end.eyebrow.track, step: 0.01, z: 0.6 });

  const pu = clamp01(spring(t - T.endUrl - 0.16, 1.1, 8));
  if (pu > 0.002) {
    ctx.save();
    ctx.globalAlpha = clamp01(pu * 1.8);
    ctx.translate(540, 1244);
    ctx.scale(lerp(0.82, 1, pu), lerp(0.5, 1, pu));
    ctx.translate(-540, -1244);
    paper(ctx, S.end.pill, C.purple, { z: 2, alpha: clamp01(pu * 1.8), grain: 0.45 });
    ctx.restore();
    typo.line(ctx, S.end.url, S.end.uf.font, '#fdf8ef', 540, 1264,
      { t: t - T.endUrl - 0.3, track: S.end.uf.track, step: 0.012, z: 0.8 });
  }

  vignette(ctx, 0.2);
}

// ---- frame -----------------------------------------------------------------
function drawFrame(ctx, t, assets) {
  build(assets);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (t < T.b2) drawBeat1(ctx, t, assets);
  else if (t < T.b3) drawBeat2(ctx, t);
  else if (t < T.b4) drawBeat3(ctx, t);
  else if (t < T.endFold) drawBeat4(ctx, t);
  else drawEnd(ctx, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

// ---- main ------------------------------------------------------------------
async function main() {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const assets = { logo: await loadImage(path.join(HERE, '../../korah-bot/logo-images/newlogo12.png')) };

  const args = process.argv.slice(2);
  const si = args.indexOf('--stills');
  if (si >= 0) {
    const dir = args[si + 2] || path.join(HERE, 'frames');
    fs.mkdirSync(dir, { recursive: true });
    for (const s of args[si + 1].split(',').map(Number)) {
      const t0 = Date.now();
      drawFrame(ctx, s, assets);
      const file = path.join(dir, `still-${s.toFixed(2)}.png`);
      fs.writeFileSync(file, canvas.toBuffer('image/png'));
      console.log(file, `${Date.now() - t0}ms`);
    }
    return;
  }

  // --frames a:b writes raw RGBA frames to stdout; the parent pipes them into ffmpeg
  const fi = args.indexOf('--frames');
  if (fi >= 0) {
    const [a, b] = args[fi + 1].split(':').map(Number);
    for (let i = a; i < b; i++) {
      drawFrame(ctx, i / FPS, assets);
      const data = ctx.getImageData(0, 0, W, H).data;
      if (!process.stdout.write(Buffer.from(data.buffer, data.byteOffset, data.byteLength))) await new Promise((r) => process.stdout.once('drain', r));
      if (i % 2 === 0) gc();
    }
    return;
  }

  const outDir = path.join(HERE, 'out');
  fs.mkdirSync(outDir, { recursive: true });
  const wav = path.join(outDir, 'korah-code.wav');
  writeWav(wav);
  const out = path.join(outDir, 'korah-code.mp4');
  const ff = spawn(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart', '-shortest', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(T.duration * FPS);
  const CHUNK = 90;
  const start = Date.now();
  for (let a = 0; a < frames; a += CHUNK) {
    const b = Math.min(frames, a + CHUNK);
    const child = spawn(process.execPath, [__filename, '--frames', `${a}:${b}`], { stdio: ['ignore', 'pipe', 'inherit'] });
    child.stdout.pipe(ff.stdin, { end: false });
    const code = await new Promise((r) => child.on('close', r));
    if (code !== 0) throw new Error(`frames ${a}-${b} failed (${code})`);
    process.stdout.write(`\rframe ${b}/${frames}  ${((Date.now() - start) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r, j) => ff.on('close', (code) => (code ? j(new Error('ffmpeg exited ' + code)) : r())));
  console.log(`\nwrote ${out}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
