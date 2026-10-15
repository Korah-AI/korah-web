// "You're Not Cooked" - paper-cut Korah SAT reel, 1080x1920 @ 30fps.
//   node korah-not-cooked/render.js                 render the mp4
//   node korah-not-cooked/render.js --stills 2,9.5  write review PNGs for those seconds
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createCanvas, GlobalFonts, loadImage, Path2D } = require('@napi-rs/canvas');
const ffmpeg = require('ffmpeg-static');
const {
  rng, clamp01, lerp, span, inOut, outBack, outCubic, spring, mixHex,
  rectPts, rrectPts, ellipsePts, cut, paper, light, grain,
} = require('./paper');
const student = require('./student');
const { drawScreen, mascotFrame } = require('./screen');
const { T, BALL, KEYS, CLICKS, score, SCORE_FROM, SCORE_TO } = require('./timeline');
const { writeWav } = require('./audio');

// Canvas buffers live outside the JS heap, so collect often to keep memory flat.
require('v8').setFlagsFromString('--expose-gc');
const gc = require('vm').runInNewContext('gc');

const W = 1080, H = 1920, FPS = 30;
const HERE = __dirname;
for (const f of fs.readdirSync(path.join(HERE, 'assets/fonts'))) GlobalFonts.registerFromPath(path.join(HERE, 'assets/fonts', f));

// ---- layout (world units = output pixels at zoom 1) ---------------------------
const DY = 1272;                 // front edge of the desk top
const SURF = DY - 26;            // back edge of the desk top
const P = 8;                     // sprite pixel size
const HX = 250, HY = DY - 8 + 8 * P;
const LAP = { x: 476, y: 942, w: 470, h: 300 };
const SCR = { x: LAP.x + 14, y: LAP.y + 16, w: LAP.w - 28, h: LAP.h - 38 };
const COLD_GLOW = '#7f9ee6', WARM_GLOW = '#ffb347';
const MUG = { x: 360 };
const BADGE = { x: 551, y: 640, w: 320, h: 196 };
const TRACK = { x: 496, y: 874, w: 430, h: 50 };
const LOGO_BOX = [72, 36, 1110, 1182]; // opaque area of newlogo2.png

// ---- static paper shapes -----------------------------------------------------------
const S = {};
function build() {
  let seed = 100;
  const c = (pts, amp = 1.3, step = 16) => cut(pts, seed++, amp, step);
  S.wall = c(rectPts(-80, -80, W + 160, 1740), 0, 400);
  S.stripes = [];
  for (let x = -80; x < W + 80; x += 120) S.stripes.push(c(rectPts(x, -80, 60, 1740), 1.2, 30));
  S.molding = c(rectPts(-80, -80, W + 160, 150), 1.5, 24);
  S.baseboard = c(rectPts(-80, 1630, W + 160, 34), 1.2, 24);
  S.floor = c(rectPts(-80, 1650, W + 160, 400), 0, 400);
  S.planks = [];
  for (let y = 1680; y < 2000; y += 46) S.planks.push(c(rectPts(-80, y, W + 160, 22), 1.4, 30));
  S.rug = c(rrectPts(90, 1735, 900, 150, 70), 2, 18);
  S.rugStripes = [0, 1, 2].map((i) => c(rrectPts(150 + i * 12, 1760 + i * 34, 780 - i * 24, 14, 7), 1.2, 18));

  // bunting
  S.bunting = [];
  for (let i = 0; i < 12; i++) {
    const x = -10 + i * 95;
    const y = 120 + Math.sin((i / 11) * Math.PI) * 55;
    S.bunting.push({ x, y, path: c([[-34, 0], [34, 0], [0, 66]], 1.2, 12), col: ['#e8893f', '#f6e3c0', '#b8744c', '#f3b36b'][i % 4], rot: (i - 5.5) * -0.035 });
  }

  // window
  S.winFrame = c(rrectPts(70, 250, 410, 460, 14), 1.4, 18);
  S.winHole = new Path2D(); S.winHole.rect(100, 280, 350, 400);
  S.mullionV = c(rectPts(265, 280, 20, 400), 1, 20);
  S.mullionH = c(rectPts(100, 470, 350, 18), 1, 20);
  S.hillFar = c([[90, 690], [90, 590], [150, 570], [230, 600], [300, 560], [380, 585], [460, 560], [460, 690]], 2, 14);
  S.hillNear = c([[90, 690], [90, 640], [170, 610], [260, 640], [340, 615], [460, 650], [460, 690]], 2, 14);
  S.cloud1 = c(ellipsePts(0, 0, 60, 16, 20), 1.5, 10);
  S.cloud2 = c(ellipsePts(0, 0, 44, 12, 20), 1.5, 10);
  S.moon = c(ellipsePts(0, 0, 40, 40, 30), 1.2, 10);
  S.moonBite = c(ellipsePts(16, -10, 34, 34, 30), 1.2, 10);
  S.sun = c(ellipsePts(0, 0, 48, 48, 32), 1.2, 10);
  S.star = new Path2D();
  for (let i = 0; i < 8; i++) { const r = i % 2 ? 3 : 9, a = (i / 8) * Math.PI * 2 - Math.PI / 2; i ? S.star.lineTo(Math.cos(a) * r, Math.sin(a) * r) : S.star.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  S.star.closePath();
  S.curtainL = c([[36, 236], [140, 236], [128, 420], [150, 740], [118, 752], [92, 740], [66, 754], [40, 742]], 2, 14);
  S.curtainR = c([[410, 236], [514, 236], [510, 742], [484, 754], [458, 740], [432, 752], [400, 740], [422, 420]], 2, 14);
  S.rod = c(rrectPts(22, 226, 506, 14, 7), 1, 20);
  S.sill = c(rrectPts(56, 704, 438, 22, 6), 1.2, 16);
  S.pot = c([[372, 664], [418, 664], [412, 706], [378, 706]], 1, 10);
  S.cactus = c(rrectPts(385, 612, 20, 56, 10), 1.2, 10);
  S.cactusArm = c(rrectPts(400, 630, 22, 12, 6), 1, 8);

  // corkboard
  S.cork = c(rrectPts(608, 300, 370, 236, 10), 1.5, 18);
  S.corkIn = c(rrectPts(624, 316, 338, 204, 6), 1.5, 18);
  S.pinSheet = c(rectPts(-60, -78, 120, 156), 1.2, 16);
  S.sticky = c(rectPts(-50, -48, 100, 96), 1.2, 16);
  S.cal = c(rectPts(-62, -56, 124, 112), 1.2, 16);

  // shelf
  S.shelf = c(rrectPts(590, 640, 410, 20, 4), 1.2, 20);
  S.brackets = [c([[640, 660], [664, 660], [640, 700]], 1, 10), c([[926, 660], [950, 660], [950, 700]], 1, 10)];
  S.books = [];
  const bw = [34, 28, 40, 30, 24, 36];
  const bh = [96, 82, 104, 88, 74, 92];
  const bc = ['#c8653f', '#e7a35a', '#7a4b33', '#f1d6a8', '#8b5cf6', '#b2542f'];
  let bx = 612;
  bw.forEach((w, i) => {
    const tilt = i === 5 ? 0.18 : 0;
    S.books.push({ path: c(rrectPts(0, -bh[i], w, bh[i], 3), 1, 14), x: bx, col: bc[i], tilt, band: c(rectPts(4, -bh[i] + 12, w - 8, 8), 0.6, 10) });
    bx += w + 4 + (i === 4 ? 10 : 0);
  });
  S.plantPot = c([[880, 590], [940, 590], [932, 640], [888, 640]], 1, 10);
  S.leaves = [[-0.9, 50], [-0.4, 62], [0.1, 58], [0.6, 60], [1.0, 46]].map(([a, l]) => ({ a, path: c([[0, 0], [-10, -l * 0.5], [0, -l], [10, -l * 0.5]], 1, 8) }));

  // clock
  S.clockRim = c(ellipsePts(0, 0, 62, 62, 36), 1.3, 10);
  S.clockFace = c(ellipsePts(0, 0, 50, 50, 36), 1.1, 10);

  // Korah pieces that pop up from behind the laptop
  S.badge = c(rrectPts(BADGE.x, BADGE.y, BADGE.w, BADGE.h, 26), 1.2, 18);
  S.badgeBand = c(rrectPts(BADGE.x + 12, BADGE.y + 12, BADGE.w - 24, 46, 18), 1, 16);
  S.struts = [-92, 92].map((dx) => c(rectPts(BADGE.x + BADGE.w / 2 + dx - 13, BADGE.y + BADGE.h - 12, 26, 130), 1, 14));
  S.plus = c(rrectPts(-62, -22, 124, 44, 22), 1, 12);
  S.track = c(rrectPts(TRACK.x, TRACK.y, TRACK.w, TRACK.h, 25), 1.2, 18);

  // chair back, pivots at the student's hip
  S.chair = c(rrectPts(-150, -262, 96, 330, 38), 1.4, 16);
  S.chairPad = c(rrectPts(-138, -246, 72, 150, 28), 1.2, 16);

  // desk
  S.deskTop = c([[46, SURF], [1034, SURF], [1054, DY], [26, DY]], 1.4, 20);
  S.deskEdge = c(rectPts(26, DY, 1028, 28), 1.2, 20);
  S.deskFront = c(rectPts(46, DY + 28, 988, 262), 1.4, 20);
  S.drawers = [c(rrectPts(80, DY + 60, 250, 90, 8), 1.2, 16), c(rrectPts(80, DY + 168, 250, 90, 8), 1.2, 16), c(rrectPts(750, DY + 60, 250, 198, 8), 1.2, 16)];
  S.knobs = [[205, DY + 105], [205, DY + 213], [875, DY + 159]].map(([x, y]) => c(rrectPts(x - 26, y - 7, 52, 14, 7), 0.8, 8));
  S.legs = [c(rectPts(70, DY + 290, 46, 90), 1, 14), c(rectPts(964, DY + 290, 46, 90), 1, 14)];

  // laptop
  S.lid = c(rrectPts(LAP.x, LAP.y, LAP.w, LAP.h, 20), 0.8, 24);
  S.bezel = new Path2D(); S.bezel.roundRect(LAP.x + 5, LAP.y + 5, LAP.w - 10, LAP.h - 8, 16);
  S.base = c([[LAP.x - 22, LAP.y + LAP.h - 2], [LAP.x + LAP.w + 22, LAP.y + LAP.h - 2], [LAP.x + LAP.w + 38, SURF + 16], [LAP.x - 38, SURF + 16]], 0.8, 24);
  S.notch = new Path2D(); S.notch.roundRect(LAP.x + LAP.w / 2 - 40, SURF + 8, 80, 8, 4);

  // mug
  S.mug = c(rrectPts(MUG.x, 1172, 82, 92, 12), 1.1, 12);
  S.mugBand = c(rectPts(MUG.x, 1200, 82, 20), 0.8, 12);
  S.mugTop = c(ellipsePts(MUG.x + 41, 1174, 41, 9, 24), 0.6, 10);
  S.coffee = c(ellipsePts(MUG.x + 41, 1175, 34, 6, 24), 0.4, 10);
  S.handle = new Path2D(); S.handle.ellipse(MUG.x, 1216, 22, 26, 0, Math.PI / 2, Math.PI * 1.5); S.handle.ellipse(MUG.x, 1216, 11, 15, 0, Math.PI * 1.5, Math.PI / 2, true); S.handle.closePath();

  // practice test pages hanging over the desk edge
  S.sheets = [c(rectPts(-78, -10, 156, 190), 1.4, 16), c(rectPts(-72, -8, 150, 176), 1.4, 16)];
  S.stack = [0, 1, 2].map((i) => c(rectPts(150 + i * 6, SURF - 10 - i * 7, 140 - i * 10, 12), 1, 16));

  // crumpled practice tests
  S.balls = [
    { x: 226, y: BALL.y0, r: 24, fall: true },
    { x: 62, y: SURF - 4, r: 24 },
    { x: 990, y: SURF - 6, r: 26 },
    { x: 1036, y: SURF + 4, r: 18 },
    { x: 330, y: 1790, r: 32 },
    { x: 560, y: 1850, r: 26 },
    { x: 790, y: 1800, r: 34 },
    { x: 960, y: 1860, r: 24 },
  ].map((b, i) => ({ ...b, ...crumple(b.r, 500 + i) }));
}

function crumple(r, seed) {
  const R = rng(seed);
  const pts = [];
  const n = 13;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (0.78 + R() * 0.28);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr * 0.92]);
  }
  const creases = [];
  for (let k = 0; k < 5; k++) {
    const a = R() * Math.PI * 2, l = r * (0.3 + R() * 0.45);
    const x = (R() - 0.5) * r * 0.9, y = (R() - 0.5) * r * 0.8;
    creases.push([x, y, x + Math.cos(a) * l * 0.5 + (R() - 0.5) * 6, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l]);
  }
  return { path: cut(pts, seed, 1.5, 10), creases };
}

// ---- helpers -----------------------------------------------------------------
// Keyframe track: [[time, value, ease?], ...]; ease 'back' overshoots a little.
function track(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    if (t < t1) {
      const [t0, v0] = keys[i - 1];
      const u = (t - t0) / (t1 - t0);
      const k = e === 'back' ? outBack(u, 1.6) : e === 'lin' ? u : inOut(u);
      return lerp(v0, v1, k);
    }
  }
  return keys[keys.length - 1][1];
}
// Named-pose track for the arms: [[time, pose, blendSeconds]]
function poseTrack(t, keys) {
  let a = keys[0][1], b = keys[0][1], e = 0;
  for (let i = 1; i < keys.length; i++) {
    const [t0, pose, dur] = keys[i];
    if (t < t0) break;
    a = keys[i - 1][1]; b = pose;
    e = inOut(clamp01((t - t0) / dur));
  }
  if (e >= 1) a = b;
  return { a, b, e };
}

// ---- the student's performance ---------------------------------------------------
const NEAR = [[0, 'type'], [2.55, 'type', 0.3], [3.35, 'cheek', 0.55], [5.5, 'pad', 0.5], [7.6, 'type', 0.4], [14.85, 'chest', 0.7]];
const FAR = [[0, 'type'], [2.7, 'desk', 0.6], [5.7, 'type', 0.5], [14.9, 'relax', 0.7]];
const FACES = [
  [0, { eye: 'open', brow: 'focus', mouth: 'flat', look: 1 }],
  [1.9, { eye: 'wide', brow: 'up', mouth: 'o' }],
  [2.35, { eye: 'half', brow: 'worried', mouth: 'frown', bags: 1 }],
  [3.0, { eye: 'closed', brow: 'worried', mouth: 'o', bags: 1 }],
  [3.85, { eye: 'half', brow: 'worried', mouth: 'frown', bags: 1 }],
  [5.6, { eye: 'open', brow: 'neutral', mouth: 'flat', bags: 1 }],
  [7.3, { eye: 'wide', brow: 'up', mouth: 'flat' }],
  [8.1, { eye: 'open', brow: 'focus', mouth: 'smile', look: 1 }],
  [13.05, { eye: 'wide', brow: 'up', mouth: 'grin' }],
  [13.7, { eye: 'happy', brow: 'happy', mouth: 'grin', blush: 1 }],
  [14.9, { eye: 'closed', brow: 'happy', mouth: 'smile', blush: 1 }],
  [16.7, { eye: 'happy', brow: 'happy', mouth: 'smile', blush: 1 }],
];
const BLINKS = [1.1, 4.95, 6.3, 9.7, 12.1];

function studentPose(t, glow, warm) {
  const face = { ...FACES.filter(([ft]) => ft <= t).pop()[1] };
  if (BLINKS.some((b) => t >= b && t < b + 0.13) && (face.eye === 'open' || face.eye === 'half')) face.eye = 'closed';
  const bob = (hand) => (KEYS.some(([k, h]) => h === hand && t >= k && t < k + 0.07) || (hand === 0 && CLICKS.some((c) => t >= c && t < c + 0.1)) ? 1 : 0);
  const near = poseTrack(t, NEAR), far = poseTrack(t, FAR);
  near.bob = bob(0); far.bob = bob(1);
  return {
    lean: track(t, [[0, 0.35], [2.5, 0.35], [3.0, 0.27], [3.8, 0.4, 'back'], [5.4, 0.4], [6.0, 0.34], [8.0, 0.34], [10.0, 0.14, 'back'], [14.8, 0.12], [15.9, -0.3, 'back']]),
    bulge: track(t, [[0, 1], [8, 1], [10, 0.3], [14.8, 0.3], [15.9, 0]]),
    headTilt: track(t, [[0, 0.16], [2.5, 0.16], [3.0, 0.08], [3.8, 0.3, 'back'], [5.4, 0.3], [6.0, 0.16], [8, 0.16], [10, 0.04], [14.8, 0.04], [15.9, -0.16]]),
    headDrop: track(t, [[0, 0], [3.0, -0.5], [3.8, 1.5], [5.4, 1.5], [6.0, 0]]),
    lift: track(t, [[2.5, 0], [3.0, -1.6], [3.7, 0.8], [4.4, 0], [13.05, 0], [13.2, -2.2], [13.5, 0.4], [13.7, 0], [14.9, 0], [15.3, -1.2], [16.2, 0.4], [16.8, 0]]),
    near, far, face,
    rim: { c: glow, a: lerp(0.5, 0.42, warm) },
  };
}

// ---- camera ------------------------------------------------------------------
function camera(t) {
  const s = track(t, [[0, 1.18], [6.0, 1.24], [7.5, 1.38], [8.4, 1.38], [9.3, 1.36], [13.6, 1.4], [15.3, 1.0], [15.6, 1.02, 'lin'], [18.2, 1.06], [19.2, 1.12]]);
  const cx = track(t, [[0, 560], [6.0, 565], [7.5, 590], [8.4, 590], [9.3, 585], [13.6, 587], [15.3, 540], [19.2, 540]]);
  const cy = track(t, [[0, 1075], [6.0, 1080], [7.5, 1060], [8.4, 1055], [9.3, 915], [13.6, 905], [15.3, 960], [15.6, 968], [19.2, 985]]);
  return { s, cx, cy };
}
function applyCam(ctx, cam, depth) {
  const s = 1 + (cam.s - 1) * depth;
  const cx = W / 2 + (cam.cx - W / 2) * depth, cy = H / 2 + (cam.cy - H / 2) * depth;
  ctx.setTransform(s, 0, 0, s, W / 2 - cx * s, H / 2 - cy * s);
  light.k = s;
}

// ---- scene pieces ------------------------------------------------------------------
function drawWall(ctx, t, m) {
  paper(ctx, S.wall, mixHex('#ecd6b2', '#f3dfbb', m), { z: 0, edge: false });
  for (const s of S.stripes) paper(ctx, s, mixHex('#e6cda6', '#eed6ae', m), { z: 0, grain: 0.5 });
  paper(ctx, S.molding, '#d7ae80', { z: 2 });
  S.bunting.forEach((b, i) => {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.rot + Math.sin(t * 1.7 + i) * 0.03);
    paper(ctx, b.path, b.col, { z: 1.5 });
    ctx.restore();
  });
  ctx.strokeStyle = '#8a5a3b'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const x = -60 + (i / 40) * (W + 120); const y = 120 + Math.sin(((x + 10) / 1045) * Math.PI) * 55; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
  paper(ctx, S.baseboard, '#c9996b', { z: 1 });
}

function drawWindow(ctx, t, m) {
  paper(ctx, S.winFrame, '#f8eddb', { z: 2 });
  ctx.save();
  ctx.clip(S.winHole);
  const sky = ctx.createLinearGradient(0, 280, 0, 680);
  sky.addColorStop(0, mixHex('#27345a', '#ffc98a', m)); sky.addColorStop(1, mixHex('#3f4f7e', '#ffe2b0', m));
  ctx.fillStyle = sky; ctx.fillRect(100, 280, 350, 400);
  // stars
  const R = rng(9);
  for (let i = 0; i < 9; i++) {
    const x = 120 + R() * 300, y = 300 + R() * 200, s = 0.5 + R() * 0.6;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(R());
    ctx.globalAlpha = (1 - m) * (0.7 + 0.3 * Math.sin(t * 3 + i));
    paper(ctx, S.star, '#fff4d6', { z: 0.5, edge: false, alpha: (1 - m) * (0.7 + 0.3 * Math.sin(t * 3 + i)) });
    ctx.restore();
  }
  // moon sets, sun rises with a little bounce
  ctx.save(); ctx.translate(345, 370 + m * 360);
  paper(ctx, S.moon, '#fff1cf', { z: 1.2 });
  ctx.restore();
  const sunY = lerp(760, 392, outBack(span(m, 0.25, 1), 1.8));
  ctx.save(); ctx.translate(184, sunY);
  const halo = ctx.createRadialGradient(0, 0, 30, 0, 0, 150);
  halo.addColorStop(0, 'rgba(255,240,190,0.7)'); halo.addColorStop(1, 'rgba(255,240,190,0)');
  ctx.fillStyle = halo; ctx.globalAlpha = m; ctx.fillRect(-150, -150, 300, 300); ctx.globalAlpha = 1;
  paper(ctx, S.sun, '#ffe29a', { z: 1.2 });
  ctx.restore();
  // clouds drift
  ctx.save(); ctx.translate(180 + t * 4, 400); paper(ctx, S.cloud1, mixHex('#56679a', '#fff3de', m), { z: 1 }); ctx.restore();
  ctx.save(); ctx.translate(380 - t * 3, 520); paper(ctx, S.cloud2, mixHex('#4d5e90', '#fff0d6', m), { z: 1 }); ctx.restore();
  paper(ctx, S.hillFar, mixHex('#34446f', '#eaa76c', m), { z: 1.5 });
  paper(ctx, S.hillNear, mixHex('#2b3a61', '#d98655', m), { z: 2 });
  ctx.restore();
  paper(ctx, S.mullionV, '#f8eddb', { z: 1.5 });
  paper(ctx, S.mullionH, '#f8eddb', { z: 1.5 });
  paper(ctx, S.sill, '#f1dfc3', { z: 2 });
  paper(ctx, S.cactus, '#7f9b5f', { z: 1.5 });
  paper(ctx, S.cactusArm, '#7f9b5f', { z: 1.5 });
  paper(ctx, S.pot, '#d9864c', { z: 2 });
  paper(ctx, S.curtainL, '#ea9a5b', { z: 3 });
  paper(ctx, S.curtainR, '#ea9a5b', { z: 3 });
  paper(ctx, S.rod, '#8a5a3b', { z: 3 });
}

function drawRightWall(ctx, t, m) {
  paper(ctx, S.cork, '#8a5a3b', { z: 2 });
  paper(ctx, S.corkIn, '#c79c6e', { z: 0.6 });
  // pinned test with a red grade
  ctx.save(); ctx.translate(700, 420); ctx.rotate(-0.06);
  paper(ctx, S.pinSheet, '#fbf4e6', { z: 1.5 });
  ctx.fillStyle = '#d6cbb8';
  for (let i = 0; i < 6; i++) ctx.fillRect(-46, -40 + i * 16, i % 3 === 2 ? 60 : 90, 5);
  ctx.strokeStyle = '#d2463c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(26, -56, 26, 16, -0.1, 0, 7); ctx.stroke();
  ctx.fillStyle = '#d2463c'; ctx.font = '26px "Luckiest Guy"'; ctx.textAlign = 'center'; ctx.fillText('1070', 26, -46);
  ctx.restore();
  pin(ctx, 700, 350, '#e0584a');
  // sticky
  ctx.save(); ctx.translate(815, 395); ctx.rotate(0.07);
  paper(ctx, S.sticky, '#ffd27a', { z: 1.5 });
  ctx.fillStyle = '#6b4430'; ctx.font = '22px "Luckiest Guy"'; ctx.textAlign = 'center';
  ctx.fillText('STUDY', 0, -8); ctx.fillText('MORE??', 0, 20);
  ctx.restore();
  pin(ctx, 815, 355, '#8b5cf6');
  // calendar with test day circled
  ctx.save(); ctx.translate(912, 450); ctx.rotate(-0.04);
  paper(ctx, S.cal, '#fbf4e6', { z: 1.5 });
  ctx.fillStyle = '#e8893f'; ctx.fillRect(-62, -56, 124, 26);
  ctx.fillStyle = '#fff6e8'; ctx.font = '800 15px "Plus Jakarta Sans"'; ctx.textAlign = 'center'; ctx.fillText('OCT', 0, -38);
  ctx.fillStyle = '#b39a82';
  for (let r = 0; r < 4; r++) for (let q = 0; q < 5; q++) ctx.fillRect(-50 + q * 22, -18 + r * 18, 10, 8);
  ctx.strokeStyle = '#d2463c'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(-50 + 3 * 22 + 5, -18 + 2 * 18 + 4, 12, 0, 7); ctx.stroke();
  ctx.restore();

  // shelf
  paper(ctx, S.shelf, '#a8714a', { z: 2.5 });
  for (const b of S.brackets) paper(ctx, b, '#8a5a3b', { z: 1.5 });
  for (const b of S.books) {
    ctx.save(); ctx.translate(b.x, 640); ctx.rotate(b.tilt);
    paper(ctx, b.path, b.col, { z: 1.6 });
    paper(ctx, b.band, 'rgba(255,245,225,0.6)', { z: 0, edge: false, grain: 0 });
    ctx.restore();
  }
  for (const l of S.leaves) {
    ctx.save(); ctx.translate(910, 596); ctx.rotate(l.a + Math.sin(t * 1.3 + l.a) * 0.03);
    paper(ctx, l.path, '#86a064', { z: 1.2 });
    ctx.restore();
  }
  paper(ctx, S.plantPot, '#e29a62', { z: 2 });

  // clock: time jumps from night to morning
  const hours = lerp(1.9, 7.1, inOut(span(t, T.morning[0], T.morning[1])));
  ctx.save(); ctx.translate(205, 830);
  paper(ctx, S.clockRim, '#b8744c', { z: 2.5 });
  paper(ctx, S.clockFace, '#fbf1de', { z: 0.8 });
  ctx.fillStyle = '#8a5a3b';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.arc(Math.cos(a) * 40, Math.sin(a) * 40, i % 3 ? 2.2 : 3.6, 0, 7); ctx.fill(); }
  hand(ctx, (hours / 12) * Math.PI * 2, 24, 6);
  hand(ctx, (hours % 1) * Math.PI * 2, 36, 4);
  ctx.fillStyle = '#4e3124'; ctx.beginPath(); ctx.arc(0, 0, 5, 0, 7); ctx.fill();
  ctx.restore();
}
function pin(ctx, x, y, col) {
  ctx.save();
  ctx.shadowColor = 'rgba(60,30,10,0.35)'; ctx.shadowBlur = 4 * light.k; ctx.shadowOffsetX = 2 * light.k; ctx.shadowOffsetY = 3 * light.k;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(x - 2.5, y - 2.5, 2.5, 0, 7); ctx.fill();
}
function hand(ctx, a, len, w) {
  ctx.save(); ctx.rotate(a);
  ctx.shadowColor = 'rgba(60,30,10,0.3)'; ctx.shadowBlur = 3 * light.k; ctx.shadowOffsetX = 1.5 * light.k; ctx.shadowOffsetY = 2 * light.k;
  ctx.fillStyle = '#4e3124'; ctx.beginPath(); ctx.roundRect(-w / 2, -len, w, len + 6, w / 2); ctx.fill();
  ctx.restore();
}

function drawChair(ctx, t) {
  const lean = studentPose(t, [0, 0, 0], 0).lean;
  ctx.save();
  ctx.translate(HX, HY);
  ctx.rotate(Math.min(0, lean) * 0.9);
  paper(ctx, S.chair, '#6f4a3a', { z: 2.5 });
  paper(ctx, S.chairPad, '#86594a', { z: 1 });
  ctx.restore();
}

function drawDesk(ctx) {
  for (const l of S.legs) paper(ctx, l, '#7a4d33', { z: 2 });
  paper(ctx, S.deskFront, '#9a6743', { z: 3 });
  for (const d of S.drawers) paper(ctx, d, '#a8744d', { z: 1.2 });
  for (const k of S.knobs) paper(ctx, k, '#5e3c29', { z: 1.2 });
  paper(ctx, S.deskEdge, '#a26d48', { z: 2 });
  paper(ctx, S.deskTop, '#c8905f', { z: 1 });
}

function drawLaptop(ctx, t, screen, glow, warm) {
  paper(ctx, S.lid, '#cfc7bb', { z: 3 });
  ctx.fillStyle = '#25201e'; ctx.fill(S.bezel);
  ctx.fillStyle = '#0d0b0a'; ctx.beginPath(); ctx.roundRect(LAP.x + LAP.w / 2 - 36, LAP.y + 5, 72, 10, 5); ctx.fill();
  // the display glows
  ctx.save();
  ctx.shadowColor = glow; ctx.shadowBlur = lerp(26, 40, warm) * light.k;
  ctx.fillStyle = glow; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
  ctx.restore();
  const dim = lerp(0.82, 1, warm);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.drawImage(screen, SCR.x, SCR.y, SCR.w, SCR.h);
  if (dim < 1) { ctx.fillStyle = `rgba(10,14,30,${1 - dim})`; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h); }
  const sheen = ctx.createLinearGradient(SCR.x, SCR.y, SCR.x + SCR.w * 0.6, SCR.y + SCR.h);
  sheen.addColorStop(0, 'rgba(255,255,255,0.10)'); sheen.addColorStop(0.45, 'rgba(255,255,255,0.03)'); sheen.addColorStop(0.46, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen; ctx.fillRect(SCR.x, SCR.y, SCR.w, SCR.h);
  ctx.restore();
  paper(ctx, S.base, '#d6cec2', { z: 2 });
  ctx.fillStyle = 'rgba(120,105,90,0.45)'; ctx.fill(S.notch);
}

function drawBall(ctx, b, x, y, rot, s, a) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  paper(ctx, b.path, '#f6eddc', { z: 2, alpha: a });
  ctx.globalAlpha = a;
  ctx.strokeStyle = 'rgba(150,125,95,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (const [x0, y0, cx, cy, x1, y1] of b.creases) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(210,70,60,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-b.r * 0.3, -b.r * 0.1); ctx.lineTo(-b.r * 0.05, b.r * 0.2); ctx.moveTo(-b.r * 0.05, -b.r * 0.1); ctx.lineTo(-b.r * 0.3, b.r * 0.2); ctx.stroke();
  ctx.restore();
}

// clutter leaves one piece at a time: a small hop, then it folds away
function clutterOut(t, i) {
  const u = span(t, T.clutter + i * 0.16, T.clutter + i * 0.16 + 0.55);
  if (u <= 0) return { s: 1, a: 1, dy: 0 };
  return { s: u < 0.3 ? 1 + 0.12 * Math.sin((u / 0.3) * Math.PI) : 1 - outCubic((u - 0.3) / 0.7), a: 1 - clamp01((u - 0.5) / 0.5), dy: -18 * Math.sin(Math.min(1, u / 0.6) * Math.PI) };
}

function drawDeskClutter(ctx, t) {
  // stacked tests
  const st = clutterOut(t, 0);
  S.stack.forEach((p, i) => paper(ctx, p, i % 2 ? '#f3e7d2' : '#fbf4e6', { z: 1.2, alpha: st.a }));
  // pages draped over the front edge
  const slip = outBack(span(t, T.sheetSlip, T.sheetSlip + 0.5), 2) * 14;
  [[170, -0.06, 0], [262, 0.05, 1]].forEach(([x, r, k]) => {
    const c = clutterOut(t, 1 + k);
    ctx.save();
    ctx.translate(x, DY - 4 + (k ? 0 : slip) + (1 - c.s) * 60);
    ctx.rotate(r + (k ? 0 : slip * 0.004));
    paper(ctx, S.sheets[k], '#fbf4e6', { z: 2.2, alpha: c.a });
    ctx.globalAlpha = c.a;
    ctx.fillStyle = '#cfc2ad';
    for (let i = 0; i < 7; i++) ctx.fillRect(-60, 18 + i * 20, i % 3 === 1 ? 70 : 110, 5);
    ctx.strokeStyle = '#d2463c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (const [mx, my] of [[48, 22], [52, 82], [44, 122]]) { ctx.beginPath(); ctx.moveTo(mx - 7, my - 7); ctx.lineTo(mx + 7, my + 7); ctx.moveTo(mx + 7, my - 7); ctx.lineTo(mx - 7, my + 7); ctx.stroke(); }
    ctx.restore();
  });
  S.balls.slice(0, 4).forEach((b, i) => {
    const c = clutterOut(t, 3 + i);
    let x = b.x, y = b.y, rot = 0;
    if (b.fall) {
      // tips off the stack, drops past the desk front and bounces on the floor
      const u = t - T.ballFall;
      if (u > 0) {
        const roll = Math.min(u, BALL.roll);
        y -= Math.sin((roll / BALL.roll) * Math.PI) * 16; x += roll * 90; rot += roll * 6;
        if (u > BALL.roll) {
          const f = u - BALL.roll;
          const tFall = BALL.land - T.ballFall - BALL.roll;
          if (f < tFall) { y = BALL.y0 + 0.5 * BALL.g * f * f; x += f * 60; rot += f * 5; }
          else {
            const g = f - tFall;
            const hop = Math.max(0, 420 * g - 0.5 * BALL.g * g * g) + Math.max(0, 130 * (g - 0.16) - 0.5 * BALL.g * (g - 0.16) ** 2);
            y = BALL.floor - hop; x += tFall * 60 + Math.min(g, 0.5) * 70; rot += tFall * 5 + Math.min(g, 0.5) * 4;
          }
        }
      }
    }
    drawBall(ctx, b, x, y + c.dy, rot, c.s * (1 - 0.0), c.a);
  });
}

function drawFloor(ctx, t) {
  paper(ctx, S.floor, '#8c5f40', { z: 0, edge: false });
  for (const p of S.planks) paper(ctx, p, '#966746', { z: 0.4 });
  paper(ctx, S.rug, '#e39459', { z: 1.5 });
  S.rugStripes.forEach((p, i) => paper(ctx, p, i % 2 ? '#c8653f' : '#f6e3c0', { z: 0.5 }));
  S.balls.slice(4).forEach((b, i) => {
    const c = clutterOut(t, 7 + i);
    drawBall(ctx, b, b.x, b.y + c.dy, i * 1.3, c.s, c.a);
  });
}

function drawMug(ctx, t) {
  paper(ctx, S.handle, '#f2e1c4', { z: 2 });
  paper(ctx, S.mug, '#f2e1c4', { z: 2.2 });
  paper(ctx, S.mugBand, '#e8893f', { z: 0.4, edge: false });
  paper(ctx, S.mugTop, '#fbf1de', { z: 0.3, edge: false });
  paper(ctx, S.coffee, '#6b4430', { z: 0, edge: false });
  // steam: paper ribbons curling up
  const g = spring(t - T.steam, 0.9, 3.2);
  if (t > T.steam) {
    for (let k = 0; k < 3; k++) {
      const len = (120 + k * 30) * Math.min(1.1, g);
      const x0 = MUG.x + 20 + k * 20, y0 = 1166;
      const p = new Path2D();
      const left = [], right = [];
      for (let i = 0; i <= 18; i++) {
        const u = i / 18;
        const y = y0 - u * len;
        const x = x0 + Math.sin(u * 5.5 + t * 2.4 + k * 2) * 12 * u + Math.sin(t * 1.3 + k) * 3;
        const w = 7 * (1 - u) + 1.5;
        left.push([x - w, y]); right.push([x + w, y]);
      }
      left.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
      right.reverse().forEach(([x, y]) => p.lineTo(x, y));
      p.closePath();
      paper(ctx, p, '#fffaf0', { z: 1, alpha: 0.85 * clamp01((t - T.steam) * 2), edge: false });
    }
  }
}

// ---- Korah pop-ups -------------------------------------------------------------
// Drawn after the room's shading so they read as lit by the display, and clipped
// at the lid so they rise out from behind the laptop.
function drawPopups(ctx, t, cam, sprite) {
  if (t < T.badge) return;
  applyCam(ctx, cam, 1);
  ctx.save();
  ctx.beginPath(); ctx.rect(-600, -600, 2400, LAP.y + 601); ctx.clip();

  // score badge on two paper struts
  const cx = BADGE.x + BADGE.w / 2;
  const up = spring(t - T.badge, 1.25, 4.4);
  const sway = Math.sin((t - T.badge) * 9) * 0.05 * Math.exp(-(t - T.badge) * 2.5) + Math.sin(t * 1.6) * 0.006;
  ctx.save();
  ctx.translate(0, (1 - up) * 320);
  for (const st of S.struts) paper(ctx, st, '#e6c9a0', { z: 1.2 });
  ctx.translate(cx, BADGE.y + BADGE.h); ctx.rotate(sway); ctx.translate(-cx, -(BADGE.y + BADGE.h));
  paper(ctx, S.badge, '#fff7ea', { z: 3.5 });
  paper(ctx, S.badgeBand, '#8b5cf6', { z: 1 });
  ctx.fillStyle = '#fff'; ctx.font = '800 19px "Plus Jakarta Sans"'; ctx.textAlign = 'center'; ctx.letterSpacing = '3px';
  ctx.fillText('PREDICTED SCORE', cx + 2, BADGE.y + 42);
  ctx.letterSpacing = '0px';
  const pop = t > T.chime ? 1 + 0.14 * Math.exp(-5 * (t - T.chime)) * Math.cos((t - T.chime) * 16) : 1;
  ctx.save();
  ctx.translate(cx, BADGE.y + 160); ctx.scale(pop, pop);
  ctx.fillStyle = '#7c3aed'; ctx.font = '800 100px "Plus Jakarta Sans"';
  ctx.fillText(String(score(t)), 0, 0);
  ctx.restore();
  // the mascot perched on the badge
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.shadowColor = 'rgba(62,34,16,0.35)'; ctx.shadowBlur = 8 * light.k; ctx.shadowOffsetX = 3 * light.k; ctx.shadowOffsetY = 5 * light.k;
  ctx.drawImage(sprite, mascotFrame(t) * 64, 0, 64, 64, BADGE.x + BADGE.w - 106, BADGE.y - 84, 96, 96);
  ctx.restore();
  if (t > T.chime + 0.12) {
    const q = spring(t - T.chime - 0.12, 1.6, 4.5);
    ctx.save(); ctx.translate(cx, BADGE.y + BADGE.h + 2); ctx.rotate(-0.05); ctx.scale(q, q);
    paper(ctx, S.plus, '#34c47a', { z: 2 });
    ctx.fillStyle = '#fff'; ctx.font = '800 26px "Plus Jakarta Sans"'; ctx.fillText(`+${SCORE_TO - SCORE_FROM} pts`, 0, 10);
    ctx.restore();
  }
  ctx.restore();

  // study plan track, then the ribbon unrolls across it
  if (t > T.track) {
    const f = spring(t - T.track, 1.4, 5);
    ctx.save();
    ctx.translate(0, TRACK.y + TRACK.h); ctx.scale(1, Math.max(0.02, f)); ctx.translate(0, -(TRACK.y + TRACK.h));
    paper(ctx, S.track, '#fff3df', { z: 2.4 });
    const x0 = TRACK.x + 7, y0 = TRACK.y + 7, rw = TRACK.w - 14, rh = TRACK.h - 14;
    ctx.fillStyle = '#ecd9bb';
    for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.arc(x0 + (rw * k) / 5, y0 + rh / 2, 4, 0, 7); ctx.fill(); }
    const u = span(t, T.ribbon[0], T.ribbon[1]);
    const pr = inOut(u);
    const settle = t > T.ribbon[1] ? 0.02 * Math.sin((t - T.ribbon[1]) * 14) * Math.exp(-(t - T.ribbon[1]) * 5) : 0;
    const w = rw * (pr + settle);
    if (w > 2) {
      const rib = new Path2D(); rib.roundRect(x0, y0, Math.max(rh, w), rh, rh / 2);
      const g = ctx.createLinearGradient(x0, 0, x0 + rw, 0);
      g.addColorStop(0, '#f2b705'); g.addColorStop(1, '#ffd84d');
      paper(ctx, rib, g, { z: 1.4, grain: 0.5 });
      ctx.save(); ctx.clip(rib);
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x0, y0 + 5, w, 4);
      ctx.fillStyle = '#5a3b0c'; ctx.font = '800 17px "Plus Jakarta Sans"'; ctx.textAlign = 'left'; ctx.letterSpacing = '2px';
      ctx.fillText('STUDY PLAN', x0 + 20, y0 + 24);
      const lw = ctx.measureText('STUDY PLAN').width;
      ctx.letterSpacing = '0px'; ctx.textAlign = 'right';
      const count = `${Math.round(pr * 5)} / 5`;
      ctx.fillText(count, Math.max(x0 + 44 + lw + ctx.measureText(count).width, x0 + w - 22), y0 + 24);
      ctx.restore();
      // the part still rolled up
      if (u < 1) {
        const r = 4 + 10 * (1 - pr);
        const rx = x0 + Math.max(rh, w);
        const cg = ctx.createLinearGradient(rx - r, 0, rx + r, 0);
        cg.addColorStop(0, '#b98300'); cg.addColorStop(0.45, '#fff0a6'); cg.addColorStop(1, '#d19a00');
        ctx.save();
        ctx.shadowColor = 'rgba(90,60,10,0.35)'; ctx.shadowBlur = 6 * light.k; ctx.shadowOffsetX = 2 * light.k; ctx.shadowOffsetY = 3 * light.k;
        ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(rx, y0 + rh / 2, r, rh / 2 + 3, 0, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }
  ctx.restore();

  // confetti when the score lands
  if (t > T.chime) {
    const e = t - T.chime;
    const R = rng(31);
    for (let i = 0; i < 16; i++) {
      const a = -Math.PI / 2 + (R() - 0.5) * 2.6;
      const v = 380 + R() * 320;
      const x = cx + Math.cos(a) * v * e, y = BADGE.y + 110 + Math.sin(a) * v * e + 700 * e * e;
      ctx.save();
      ctx.globalAlpha = clamp01(1.8 - e * 1.2);
      ctx.translate(x, y); ctx.rotate(e * (4 + R() * 6) + i);
      ctx.scale(1, Math.cos(e * (6 + R() * 5)));
      ctx.fillStyle = ['#8b5cf6', '#f0abfc', '#f59e0b', '#fff3df'][i % 4];
      ctx.fillRect(-9, -5, 18, 10);
      ctx.restore();
    }
  }
}

// ---- lighting ----------------------------------------------------------------
function drawLighting(ctx, t, cam, night, glow, warm, m, sprite) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // everything except the display, which gives off its own light
  const sx0 = W / 2 + (SCR.x - cam.cx) * cam.s, sy0 = H / 2 + (SCR.y - cam.cy) * cam.s;
  const shade = new Path2D();
  shade.rect(0, 0, W, H);
  shade.rect(sx0, sy0, SCR.w * cam.s, SCR.h * cam.s);
  // light from the upper left
  const d = ctx.createLinearGradient(0, 0, W, H);
  d.addColorStop(0, 'rgb(255,252,246)'); d.addColorStop(1, 'rgb(214,186,160)');
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = d; ctx.globalAlpha = 0.5; ctx.fill(shade, 'evenodd');
  // night: cool and dim
  if (night > 0) {
    ctx.globalAlpha = night;
    ctx.fillStyle = '#56629a'; ctx.fill(shade, 'evenodd');
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  drawPopups(ctx, t, cam, sprite);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // light spilling from the display
  const cx = sx0 + (SCR.w * cam.s) / 2, cy = sy0 + (SCR.h * cam.s) / 2;
  const spill = ctx.createRadialGradient(cx, cy, 60 * cam.s, cx, cy, 440 * cam.s);
  const [gr, gg, gb] = glow.match(/\d+/g).map(Number);
  const amt = lerp(0.2, 0.17, warm) * (0.3 + 0.7 * night / 0.42);
  spill.addColorStop(0, `rgba(${gr},${gg},${gb},${amt})`); spill.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = spill; ctx.fill(shade, 'evenodd');
  // morning sun through the window
  if (m > 0) {
    applyCam(ctx, cam, 0.95);
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = `blur(${18 * light.k}px)`;
    for (const [a, b, al] of [[[110, 300], [300, 300], 0.2], [[150, 520], [440, 470], 0.16], [[320, 300], [450, 330], 0.12]]) {
      ctx.fillStyle = `rgba(255,214,150,${al * m})`;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] + 700, b[1] + 1250); ctx.lineTo(a[0] + 620, a[1] + 1300); ctx.closePath(); ctx.fill();
    }
    ctx.filter = 'none';
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const warmth = ctx.createLinearGradient(0, 0, W, H);
    warmth.addColorStop(0, `rgba(255,200,130,${0.2 * m})`); warmth.addColorStop(1, `rgba(255,170,90,${0.08 * m})`);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = warmth; ctx.fillRect(0, 0, W, H);
  }
  // vignette
  const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.34, W / 2, H * 0.5, H * 0.72);
  v.addColorStop(0, 'rgba(50,25,12,0)'); v.addColorStop(1, `rgba(50,25,12,${0.22 + 0.16 * night})`);
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---- end card ----------------------------------------------------------------
const LINES = [
  { text: "YOU'RE", col: '#ec8a3c', back: '#9c4f22' },
  { text: 'NOT', col: '#8b5cf6', back: '#4c1d95' },
  { text: 'COOKED.', col: '#ec8a3c', back: '#9c4f22' },
];
const endPaths = {};
function buildEnd(ctx) {
  let seed = 900;
  endPaths.hills = [
    { path: cut([[-60, 1640], [180, 1560], [420, 1610], [700, 1540], [1140, 1600], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#f3c48d', z: 1.5 },
    { path: cut([[-60, 1730], [260, 1660], [560, 1720], [860, 1650], [1140, 1700], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#e8934f', z: 2 },
    { path: cut([[-60, 1830], [320, 1770], [640, 1820], [1140, 1760], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#a8714a', z: 2.5 },
  ];
  endPaths.top = [
    { path: cut([[-60, -60], [1140, -60], [1140, 170], [820, 240], [520, 190], [220, 250], [-60, 190]], seed++, 3, 16), col: '#f1dcb8', z: 1.5 },
    { path: cut([[-60, -60], [1140, -60], [1140, 90], [760, 140], [380, 100], [-60, 130]], seed++, 3, 16), col: '#e8c290', z: 2 },
  ];
  endPaths.tag = cut(rrectPts(-340, 0, 680, 116, 22), seed++, 1.6, 18);
  // fit each line to the same width, then stack the block around y = 900
  ctx.font = '100px "Luckiest Guy"';
  for (const l of LINES) l.size = Math.min(250, (880 / ctx.measureText(l.text).width) * 100);
  let y = LINES[0].size * 0.72;
  LINES.forEach((l, i) => { if (i) y += l.size * 0.84; l.base = y; });
  endPaths.tagY = y + 80;
  const top = 900 - (endPaths.tagY + 116) / 2;
  LINES.forEach((l) => (l.base += top));
  endPaths.tagY += top;
}

function drawEnd(ctx, t, logo) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  light.k = 1;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f8ecd6'); g.addColorStop(1, '#f3e0c2');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = grain(ctx); ctx.globalAlpha = 0.8; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  const u = t - T.fade[1];
  endPaths.top.forEach((l, i) => {
    ctx.save(); ctx.translate(0, -240 * (1 - spring(u - i * 0.08, 1.2, 5)));
    paper(ctx, l.path, l.col, { z: l.z }); ctx.restore();
  });
  endPaths.hills.forEach((l, i) => {
    ctx.save(); ctx.translate(0, 320 * (1 - spring(u - 0.1 - i * 0.08, 1.2, 5)));
    paper(ctx, l.path, l.col, { z: l.z }); ctx.restore();
  });

  // letters fold up off the page one at a time
  const R = rng(77);
  let idx = 0;
  LINES.forEach((l, li) => {
    ctx.font = `${l.size}px "Luckiest Guy"`;
    const chars = [...l.text];
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = W / 2 - total / 2;
    const y = l.base;
    chars.forEach((ch, ci) => {
      const t0 = T.title + idx * 0.065 + li * 0.12;
      const p = spring(t - t0, 1.3, 4.8);
      const tilt = (R() - 0.5) * 0.09;
      const boil = Math.floor(t * 8) % 2 ? 0.006 : -0.006;
      idx++;
      if (t > t0) {
        ctx.save();
        ctx.translate(x + widths[ci] / 2, y);
        ctx.rotate(tilt + (t > t0 + 1 ? boil * (ci % 2 ? 1 : -1) : 0));
        ctx.scale(1, Math.max(0.02, p));
        ctx.font = `${l.size}px "Luckiest Guy"`; ctx.textAlign = 'center';
        // back layer
        ctx.save();
        ctx.shadowColor = 'rgba(62,34,16,0.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetX = 6; ctx.shadowOffsetY = 10;
        ctx.fillStyle = l.back; ctx.fillText(ch, 7, 9);
        ctx.restore();
        ctx.save();
        ctx.shadowColor = 'rgba(62,34,16,0.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 4;
        ctx.fillStyle = l.col; ctx.fillText(ch, 0, 0);
        ctx.restore();
        ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.7; ctx.fillStyle = grain(ctx); ctx.fillText(ch, 0, 0);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        if (p < 1) { ctx.fillStyle = `rgba(80,40,15,${0.55 * (1 - clamp01(p))})`; ctx.fillText(ch, 0, 0); }
        ctx.restore();
      }
      x += widths[ci];
    });
  });

  // "Visit Korah.app" tag folds down from its top edge
  if (t > T.tag) {
    const p = spring(t - T.tag, 1.3, 4.6);
    ctx.save();
    ctx.translate(W / 2, endPaths.tagY);
    ctx.rotate(-0.02);
    ctx.scale(1, Math.max(0.02, p));
    paper(ctx, endPaths.tag, '#fffaf1', { z: 2.5 });
    ctx.font = '800 58px "Plus Jakarta Sans"';
    const a = 'Visit ', b = 'Korah.app';
    const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
    // the Korah logo sits to the right of the URL
    const lh = 92, lw = (lh * LOGO_BOX[2]) / LOGO_BOX[3], gap = 18;
    const x0 = -(wa + wb + gap + lw) / 2;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#4e3124'; ctx.fillText(a, x0, 79);
    ctx.fillStyle = '#7c3aed'; ctx.fillText(b, x0 + wa, 79);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(logo, ...LOGO_BOX, x0 + wa + wb + gap, 12, lw, lh);
    if (p < 1) { ctx.fillStyle = `rgba(80,40,15,${0.5 * (1 - clamp01(p))})`; ctx.fill(endPaths.tag); }
    ctx.restore();
  }
}

// ---- frame -------------------------------------------------------------------
function drawFrame(ctx, t, assets) {
  const cam = camera(t);
  const warm = inOut(span(t, T.open, T.open + 1.0));
  const m = inOut(span(t, T.morning[0], T.morning[1]));
  const night = 0.42 * (1 - m);
  const glow = mixHex(COLD_GLOW, WARM_GLOW, warm);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  if (t < T.fade[1]) {
    const tq = Math.floor(t * 15) / 15;  // the sprite animates on twos
    applyCam(ctx, cam, 0.9);
    drawWall(ctx, t, m);
    drawWindow(ctx, t, m);
    drawRightWall(ctx, t, m);

    applyCam(ctx, cam, 1);
    drawFloor(ctx, t);
    drawChair(ctx, tq);
    drawDesk(ctx);
    const screen = drawScreen(t, assets.sprite);
    applyCam(ctx, cam, 1);
    drawLaptop(ctx, t, screen, glow, warm);
    drawMug(ctx, t);

    // the student sits behind the desk top; hands can reach over the laptop
    ctx.save();
    const clip = new Path2D();
    clip.rect(-100, -100, 520, SURF + 100);
    clip.rect(420, -100, 800, DY + 100);
    ctx.clip(clip);
    student.draw(ctx, studentPose(tq, parse(glow), warm), HX, HY, P, paper, '#fbf2e2');
    ctx.restore();

    drawDeskClutter(ctx, t);
    drawLighting(ctx, t, cam, night, glow, warm, m, assets.sprite);
  }
  if (t >= T.fade[0]) {
    const f = inOut(span(t, T.fade[0], T.fade[1]));
    if (t < T.fade[1]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(247,234,212,${f})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      drawEnd(ctx, t, assets.logo);
    }
  }
}
const parse = (rgb) => rgb.match(/\d+/g).map(Number);

// ---- main --------------------------------------------------------------------
async function main() {
  build();
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  buildEnd(ctx);
  const assets = {
    sprite: await loadImage(path.join(HERE, 'assets/korah-idle-sheet.png')),
    logo: await loadImage(path.join(HERE, '../../korah-bot/logo-images/newlogo2.png')),
  };

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
  const wav = path.join(outDir, 'korah-not-cooked.wav');
  writeWav(wav);
  const out = path.join(outDir, 'korah-not-cooked.mp4');
  const ff = spawn(ffmpeg, [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', '-',
    '-i', wav,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
    '-movflags', '+faststart', '-shortest', out,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  // render in short-lived child processes so memory never builds up in one process
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
