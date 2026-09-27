// "The Elusive SAT Taker" - paper-cut Amazon documentary reel, 1080x1920 @ 30fps.
//   node sat-taker/render.js                   render the mp4
//   node sat-taker/render.js --stills 2,9.5    write review PNGs for those seconds
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createCanvas, GlobalFonts, loadImage, Path2D } = require('@napi-rs/canvas');
const ffmpeg = require('ffmpeg-static');
const {
  rng, clamp01, lerp, span, inOut, outBack, spring, mixHex, parseHex, rrectPts, cut, paper, light, grain,
} = require('../korah-not-cooked/paper');
const student = require('./student');
const F = require('./forest');
const { drawScreen } = require('./screen');
const { T, CAPTIONS, KEYS, SPARKS } = require('./timeline');
const { writeWav } = require('./audio');

// Canvas buffers live outside the JS heap, so collect often to keep memory flat.
require('v8').setFlagsFromString('--expose-gc');
const gc = require('vm').runInNewContext('gc');

const W = 1080, H = 1920, FPS = 30;
const HERE = __dirname;
const FONTS = path.join(HERE, '../korah-not-cooked/assets/fonts');
for (const f of fs.readdirSync(FONTS)) GlobalFonts.registerFromPath(path.join(FONTS, f));

const P = 7;                        // sprite pixel size
const HX = 240, HY = 1360;          // student's hip, behind the log
const FX = 850, FY = 1390;          // friend's hip, behind the bush
const BUSH_BASE = 1500;
const OLD = { x: 560, y: 1273, len: 190 };   // hinge of the SAT Taker's own laptop, seen side-on
const LOGO_BOX = [72, 36, 1110, 1182]; // opaque area of newlogo2.png

const L = {};
function build() {
  let seed = 3000;
  const c = (pts, amp = 1, step = 14) => cut(pts, seed++, amp, step);
  L.lid = c(rrectPts(-124, -184, 248, 168, 14), 0.8, 24);
  L.base = c([[-131, 0], [131, 0], [124, -16], [-124, -16]], 0.8, 24);
  L.bezel = new Path2D(); L.bezel.roundRect(-119, -180, 238, 160, 11);
  L.oldBase = c(rrectPts(OLD.x - OLD.len - 5, OLD.y - 1, OLD.len + 10, 12, 4), 0.6, 20);
  L.oldLid = c(rrectPts(-6, -OLD.len, 10, OLD.len, 4), 0.6, 20);
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
// Static layers are drawn once per process into bitmaps, then placed with the camera.
const caches = {};
function layer(ctx, cam, name, depth, [x0, y0, x1, y1], scale, draw, alpha = 1) {
  let c = caches[name];
  if (!c) {
    c = caches[name] = createCanvas(Math.ceil((x1 - x0) * scale), Math.ceil((y1 - y0) * scale));
    const cx = c.getContext('2d');
    cx.setTransform(scale, 0, 0, scale, -x0 * scale, -y0 * scale);
    light.k = scale;
    draw(cx);
  }
  applyCam(ctx, cam, depth);
  ctx.globalAlpha = alpha;
  ctx.drawImage(c, x0, y0, x1 - x0, y1 - y0);
  ctx.globalAlpha = 1;
}

// ---- the student's performance ---------------------------------------------------
const NEAR = [[0, 'type'], [T.groans[0] - 0.05, 'cheek', 0.3], [T.groans[0] + 0.7, 'type', 0.3], [T.scratch[0], 'behind', 0.35], [T.scratch[1], 'type', 0.3], [T.groans[1] - 0.05, 'cheek', 0.3], [T.slump, 'flop', 0.8], [T.look, 'type', 0.4], [T.cheer, 'up', 0.3]];
const FAR = [[0, 'type'], [T.slump, 'flop', 0.8], [T.look, 'type', 0.4], [T.cheer + 0.03, 'up', 0.3]];
const typingFace = { eye: 'open', brow: 'worried', mouth: 'frown', bags: 1 };
const groanFace = { eye: 'closed', brow: 'worried', mouth: 'o', bags: 1 };
const FACES = [
  [0, typingFace],
  [T.groans[0] - 0.05, groanFace],
  [T.groans[0] + 0.7, typingFace],
  [T.scratch[0], { eye: 'half', brow: 'worried', mouth: 'o', bags: 1 }],
  [T.scratch[1], { eye: 'half', brow: 'worried', mouth: 'frown', bags: 1 }],
  [T.glance, { eye: 'open', brow: 'worried', mouth: 'flat', bags: 1 }],
  [T.low, { eye: 'half', brow: 'worried', mouth: 'frown', bags: 1 }],
  [T.groans[1] - 0.05, groanFace],
  [T.slump, { eye: 'closed', brow: 'worried', mouth: 'frown', bags: 1 }],
  [T.emerge, { eye: 'wide', brow: 'up', mouth: 'o' }],
  [T.leanIn + 0.8, { eye: 'open', brow: 'happy', mouth: 'smile' }],
  [T.chime - 0.2, { eye: 'wide', brow: 'up', mouth: 'grin' }],
  [T.cheer, { eye: 'happy', brow: 'happy', mouth: 'grin', blush: 1 }],
];
const BLINKS = [2.2, 5.9, 8.4, 13.3, 16.2, 24.4, 26.8, 28.6];

function studentPose(t, glow, bloom) {
  const face = { ...FACES.filter(([ft]) => ft <= t).pop()[1] };
  if (BLINKS.some((b) => t >= b && t < b + 0.13) && (face.eye === 'open' || face.eye === 'half')) face.eye = 'closed';
  const near = poseTrack(t, NEAR), far = poseTrack(t, FAR);
  const pressed = (hand) => (KEYS.some(([k, h]) => h === hand && t >= k && t < k + 0.07) ? 1 : 0);
  near.bob = pressed(0); far.bob = pressed(1);
  if (t > T.scratch[0] + 0.35 && t < T.scratch[1]) near.bob = Math.sin(t * 28) * 1.3; // scratching
  // cold light from the old laptop, then the warm Korah glow
  const rim = { c: parseHex(mixHex('#a9c9ff', mixHex('#f3dcae', '#ffcf73', bloom), glow)), a: 0.35 + 0.05 * glow };
  return {
    lean: track(t, [[0, 0.35], [T.groans[0] - 0.05, 0.35], [T.groans[0] + 0.25, 0.2, 'back'], [T.groans[0] + 0.7, 0.35], [T.scratch[0], 0.35], [T.scratch[0] + 0.35, 0.24, 'back'], [T.scratch[1], 0.24], [T.scratch[1] + 0.3, 0.35], [T.glance - 0.1, 0.35], [T.glance + 0.25, 0.22, 'back'], [T.groans[1] - 0.05, 0.24], [T.groans[1] + 0.25, 0.18, 'back'], [T.slump - 0.1, 0.22], [T.mash, 0.62, 'back'], [T.emerge, 0.62], [T.look, 0.3, 'back'], [T.leanIn - 0.2, 0.3], [T.leanIn + 0.5, 0.5, 'back'], [T.cheer - 0.1, 0.48], [T.cheer + 0.25, -0.2, 'back']]),
    bulge: track(t, [[0, 1], [T.look - 0.1, 1], [T.glow, 0.4], [T.cheer, 0.4], [T.cheer + 0.3, 0]]),
    headTilt: track(t, [[0, 0.16], [T.groans[0] - 0.05, 0.16], [T.groans[0] + 0.25, -0.14], [T.groans[0] + 0.7, 0.16], [T.scratch[0], 0.16], [T.scratch[0] + 0.35, 0.05], [T.scratch[1], 0.05], [T.scratch[1] + 0.3, 0.16], [T.glance - 0.1, 0.16], [T.glance + 0.25, -0.32, 'back'], [T.low, -0.22], [T.groans[1] - 0.05, -0.2], [T.groans[1] + 0.25, -0.12], [T.slump - 0.1, -0.18], [T.mash, 0.3, 'back'], [T.emerge, 0.3], [T.look, -0.06, 'back'], [T.leanIn + 0.5, 0.04], [T.cheer - 0.1, 0.04], [T.cheer + 0.25, -0.2, 'back']]),
    headDrop: track(t, [[T.slump - 0.1, 0], [T.mash, 2.6, 'back'], [T.emerge - 0.05, 2.6], [T.emerge + 0.1, 0]]),
    lift: track(t, [[T.emerge + 0.02, 0], [T.emerge + 0.12, -2.2], [T.emerge + 0.4, 0.4], [T.emerge + 0.55, 0], [T.cheer, 0], [T.cheer + 0.12, -2.6], [T.cheer + 0.38, 0.5], [T.cheer + 0.52, 0]]),
    near, far, face, rim,
  };
}

// the friend holds the Mac out in front, peeking over it
function friendY(t, tq) {
  if (t < T.emerge) return FY + 440;
  const up = spring(t - T.emerge, 1.3, 4.6);
  const bounce = t > T.cheer ? -Math.max(0, Math.sin((t - T.cheer - 0.05) * 9) * 26 * Math.exp(-(t - T.cheer) * 2)) : 0;
  return FY + 440 * (1 - up) + Math.sin(tq * 3.2) * 3 + bounce;
}
function friendPose(t) {
  const face = t < T.glow ? { eye: 'open', brow: 'up', mouth: 'grin' } : { eye: 'happy', brow: 'happy', mouth: 'grin', blush: 1 };
  if ([24.6, 27.0, 28.8].some((b) => t >= b && t < b + 0.13) && face.eye === 'open') face.eye = 'closed';
  const hold = { a: 'hold', b: 'hold', e: 0 };
  return { lean: -0.06, bulge: 0.3, headTilt: 0.08, headDrop: 0, lift: 0, near: hold, far: { ...hold }, face, pal: student.FRIEND };
}

// the toucan: looks down its bill at the SAT Taker until the Mac lights up
function birdState(t, tq) {
  const shut = [4.6, 13.0].some((b) => t >= b && t < b + 0.14);
  const skeptic = 1 - span(t, T.glow, T.glow + 0.3);
  const croak = [T.croak, T.croak + 0.3].some((h) => t >= h && t < h + 0.18) ? 0.9 : 0;
  const clack = t > T.cheer && t < T.cheer + 0.6 ? Math.max(0, Math.sin((t - T.cheer) * 25)) * 0.6 : 0;
  const disdain = t > T.low && t < T.slump + 0.8;
  return {
    face: track(tq, [[0, 1], [T.rustle + 0.05, 1], [T.rustle + 0.2, -1, 'lin'], [T.cheer + 0.35, -1], [T.cheer + 0.5, 1, 'lin']]),
    tilt: track(t, [[0, 0.18], [T.low - 0.1, 0.18], [T.low + 0.3, 0.34, 'back'], [T.slump + 0.8, 0.34], [T.slump + 1.1, 0.2], [T.glow, 0.2], [T.glow + 0.3, -0.12, 'back'], [T.cheer, -0.12], [T.cheer + 0.25, 0.08, 'back']]),
    lid: shut ? 1 : 0.5 * skeptic + (disdain ? 0.18 : 0),
    wide: 1 + 0.35 * (t > T.glow + 0.1 ? spring(t - T.glow - 0.1, 1.4, 4) : 0),
    beak: Math.max(croak, clack),
    hop: t > T.cheer ? Math.max(0, Math.sin((t - T.cheer) * 7) * 24 * Math.exp(-(t - T.cheer) * 1.5)) : 0,
    puff: (t > T.croak && t < T.croak + 0.8 ? Math.sin(((t - T.croak) / 0.8) * Math.PI) : 0) + (t > T.cheer ? Math.exp(-(t - T.cheer) * 3) * Math.sin((t - T.cheer) * 14) * 0.6 : 0),
  };
}

// ---- camera ------------------------------------------------------------------
function camera(t) {
  const s = track(t, [[0, 1.0], [7, 1.08], [T.glance, 1.15], [T.slump - 0.1, 1.18], [T.croak, 1.22], [T.rustle, 1.2], [T.emerge + 0.5, 1.22], [T.glow + 1.2, 1.34], [T.bloom[0], 1.34], [T.bloom[1], 1.05], [T.fade[1], 1.08]]);
  const cx = track(t, [[0, 560], [7, 520], [T.glance, 490], [T.slump - 0.1, 480], [T.croak, 470], [T.rustle, 480], [T.emerge + 0.5, 610], [T.glow + 1.2, 600], [T.bloom[0], 600], [T.bloom[1], 540], [T.fade[1], 540]]);
  const cy = track(t, [[0, 960], [7, 990], [T.glance, 1010], [T.slump - 0.1, 1025], [T.croak, 1060], [T.rustle, 1050], [T.emerge + 0.5, 1080], [T.glow + 1.2, 1130], [T.bloom[0], 1130], [T.bloom[1], 990], [T.fade[1], 985]]);
  return { s, cx, cy };
}
function applyCam(ctx, cam, depth) {
  const s = 1 + (cam.s - 1) * depth;
  const cx = W / 2 + (cam.cx - W / 2) * depth, cy = H / 2 + (cam.cy - H / 2) * depth;
  ctx.setTransform(s, 0, 0, s, W / 2 - cx * s, H / 2 - cy * s);
  light.k = s;
}
const dev = (cam, x, y) => [W / 2 + (x - cam.cx) * cam.s, H / 2 + (y - cam.cy) * cam.s];

// ---- props -----------------------------------------------------------------------
// The SAT Taker's own laptop, side-on: the screen faces them, and the lid slams
// shut, forgotten, when the arms go up.
function oldLid(t) {
  if (t < T.lid) return 0.2;
  const u = t - T.lid;
  if (u < 0.28) return lerp(0.2, -Math.PI / 2, (u / 0.28) ** 2);
  return -Math.PI / 2 + 0.14 * Math.abs(Math.sin((u - 0.28) * 16)) * Math.exp(-(u - 0.28) * 9);
}
function drawOldLaptop(ctx, t) {
  paper(ctx, L.oldBase, '#c9c4bc', { z: 2 });
  ctx.fillStyle = 'rgba(90,86,80,0.55)'; ctx.fillRect(OLD.x - OLD.len + 6, OLD.y + 3, OLD.len - 20, 2);
  const a = oldLid(t);
  ctx.save();
  ctx.translate(OLD.x, OLD.y); ctx.rotate(a);
  paper(ctx, L.oldLid, '#d6d1c8', { z: 2.4 });
  if (a > -1.2) { ctx.fillStyle = '#b9d6ff'; ctx.fillRect(-7.5, -OLD.len + 9, 3, OLD.len - 16); }
  ctx.restore();
}

function drawLaptop(ctx, t, lap, screen, g) {
  ctx.save();
  ctx.translate(lap.x, lap.y);
  paper(ctx, L.lid, '#d3ccc1', { z: 3.2 });
  ctx.fillStyle = '#25201e'; ctx.fill(L.bezel);
  ctx.fillStyle = '#0d0b0a'; ctx.beginPath(); ctx.roundRect(-26, -180, 52, 7, 3.5); ctx.fill();
  if (screen) {
    ctx.save();
    ctx.shadowColor = mixHex('#c3a4ff', '#ffd27a', g); ctx.shadowBlur = 40 * light.k;
    ctx.fillStyle = '#ffe3a6'; ctx.fillRect(-115, -176, 230, 150);
    ctx.restore();
    ctx.drawImage(screen, -115, -176, 230, 150);
  } else {
    ctx.fillStyle = '#1d1b24'; ctx.fillRect(-115, -176, 230, 150);
  }
  const sheen = ctx.createLinearGradient(-115, -176, 30, -26);
  sheen.addColorStop(0, 'rgba(255,255,255,0.12)'); sheen.addColorStop(0.45, 'rgba(255,255,255,0.03)'); sheen.addColorStop(0.46, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen; ctx.fillRect(-115, -176, 230, 150);
  paper(ctx, L.base, '#dcd5ca', { z: 2 });
  ctx.fillStyle = 'rgba(120,105,90,0.45)'; ctx.beginPath(); ctx.roundRect(-34, -9, 68, 5, 2.5); ctx.fill();
  ctx.restore();
}

// soft rays fanning out behind the glowing Mac
function drawRays(ctx, t, lap, g) {
  const cx = lap.x, cy = lap.y - 101;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.translate(cx, cy); ctx.rotate(t * 0.12);
  const rg = ctx.createRadialGradient(0, 0, 40, 0, 0, 620);
  rg.addColorStop(0, `rgba(255,228,160,${0.55 * g})`); rg.addColorStop(1, 'rgba(255,228,160,0)');
  ctx.fillStyle = rg;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, w = 0.11 + 0.05 * Math.sin(i * 1.7);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 620 * (0.8 + 0.2 * Math.sin(i * 2.3 + t)), a - w, a + w); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

// ---- lighting ----------------------------------------------------------------
const MOTES = [...Array(34)].map((_, i) => { const r = rng(1500 + i); return { x: 60 + r() * 960, y: 250 + r() * 1300, ph: r() * 6, s: 2 + r() * 3 }; });
function drawLighting(ctx, t, cam, g, b, lap) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const shade = new Path2D();
  shade.rect(0, 0, W, H);
  if (g > 0) { const [sx, sy] = dev(cam, lap.x - 115, lap.y - 176); shade.rect(sx, sy, 230 * cam.s, 150 * cam.s); }
  // light from the upper left
  const d = ctx.createLinearGradient(0, 0, W, H);
  d.addColorStop(0, 'rgb(255,252,244)'); d.addColorStop(1, 'rgb(214,206,170)');
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.5; ctx.fillStyle = d; ctx.fill(shade, 'evenodd');
  // before Korah the clearing sits in dull shade
  ctx.globalAlpha = 0.2 * (1 - b); ctx.fillStyle = '#6f8f86'; ctx.fill(shade, 'evenodd');
  ctx.globalAlpha = 1;
  // sun shafts through the canopy, brighter once the scene blooms
  ctx.globalCompositeOperation = 'screen';
  layer(ctx, cam, 'shafts', 0.9, [-100, 0, 1400, 1850], 0.5, (c) => {
    c.filter = `blur(${22 * light.k}px)`;
    for (const [x, w, al] of [[40, 120, 0.13], [260, 70, 0.1], [470, 150, 0.12], [760, 90, 0.08]]) {
      c.fillStyle = `rgba(255,226,160,${al * 2.4})`;
      c.beginPath(); c.moveTo(x, 150); c.lineTo(x + w, 150); c.lineTo(x + w + 520, 1700); c.lineTo(x + 460, 1700); c.closePath(); c.fill();
    }
  }, (1 + 0.7 * b) / 2.4);
  applyCam(ctx, cam, 0.9);
  // dust motes drifting in the light
  for (const m of MOTES) {
    const x = m.x + Math.sin(t * 0.5 + m.ph) * 24, y = m.y + Math.cos(t * 0.37 + m.ph) * 18 - t * 6;
    ctx.fillStyle = `rgba(255,240,196,${(0.25 + 0.3 * b) * (0.6 + 0.4 * Math.sin(t * 2 + m.ph * 3))})`;
    ctx.beginPath(); ctx.arc(x, y, m.s * (1 + b * 0.5), 0, 7); ctx.fill();
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // cold light off the old laptop's screen until the lid shuts
  const cold = (1 - 0.6 * g) * (oldLid(t) > -1.2 ? 1 : 0);
  if (cold > 0) {
    const [ox, oy] = dev(cam, OLD.x - 30, OLD.y - 110);
    const spill = ctx.createRadialGradient(ox, oy, 10 * cam.s, ox, oy, 260 * cam.s);
    spill.addColorStop(0, `rgba(150,190,255,${0.3 * cold})`); spill.addColorStop(1, 'rgba(150,190,255,0)');
    ctx.fillStyle = spill; ctx.fill(shade, 'evenodd');
  }
  // the Mac's glow spills onto everything nearby, then the whole scene blooms gold
  if (g > 0) {
    const [cx, cy] = dev(cam, lap.x, lap.y - 101);
    const [r0, g0, b0] = parseHex(mixHex('#b58cff', '#ffcf73', 0.35 + 0.65 * b));
    const spill = ctx.createRadialGradient(cx, cy, 60 * cam.s, cx, cy, (480 + 520 * b) * cam.s);
    spill.addColorStop(0, `rgba(${r0},${g0},${b0},${0.18 * g})`); spill.addColorStop(1, `rgba(${r0},${g0},${b0},0)`);
    ctx.fillStyle = spill; ctx.fill(shade, 'evenodd');
  }
  if (b > 0) {
    const warmth = ctx.createLinearGradient(0, 0, W, H);
    warmth.addColorStop(0, `rgba(255,200,110,${0.4 * b})`); warmth.addColorStop(1, `rgba(255,170,80,${0.2 * b})`);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = warmth; ctx.fillRect(0, 0, W, H);
  }
  // vignette
  const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.34, W / 2, H * 0.5, H * 0.72);
  v.addColorStop(0, 'rgba(30,26,10,0)'); v.addColorStop(1, `rgba(30,26,10,${0.3 - 0.1 * b})`);
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// twinkling stars around the Mac once it glows
function drawSparkles(ctx, t, cam, lap) {
  applyCam(ctx, cam, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const [t0, x, y, s] of SPARKS) {
    const u = (t - t0) / 0.7;
    if (u <= 0 || u >= 1) continue;
    const k = Math.sin(Math.PI * u) * s;
    ctx.save();
    ctx.translate(lap.x + x, lap.y - 101 + y - u * 20);
    ctx.rotate(u * 1.6);
    const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, 40 * k);
    halo.addColorStop(0, 'rgba(255,236,170,0.8)'); halo.addColorStop(1, 'rgba(255,236,170,0)');
    ctx.fillStyle = halo; ctx.fillRect(-40 * k, -40 * k, 80 * k, 80 * k);
    ctx.scale(k, k);
    ctx.fillStyle = '#fffbe8'; ctx.fill(F.S.sparkle);
    ctx.restore();
  }
  ctx.restore();
}

// ---- captions ----------------------------------------------------------------
// Paper strips that fade in and out; *words* get an accent colour.
const CAP = { y: 1470, maxW: 860, size: 46, line: 58 };
const capCache = new Map();
function capLayout(ctx, i, text) {
  if (capCache.has(i)) return capCache.get(i);
  ctx.font = `800 ${CAP.size}px "Plus Jakarta Sans"`;
  const words = [];
  let accent = false;
  for (const raw of text.split(' ')) {
    const start = raw.startsWith('*'), end = raw.replace(/[.,]$/, '').endsWith('*');
    if (start) accent = true;
    words.push({ w: raw.replace(/\*/g, ''), accent });
    if (end) accent = false;
  }
  const space = ctx.measureText(' ').width;
  const lines = [[]];
  let lw = 0;
  for (const wd of words) {
    wd.width = ctx.measureText(wd.w).width;
    if (lw + wd.width > CAP.maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(wd); lw += wd.width + space;
  }
  const widths = lines.map((l) => l.reduce((a, wd) => a + wd.width, 0) + space * (l.length - 1));
  const w = Math.max(...widths) + 56, h = lines.length * CAP.line + 30;
  const out = { lines, widths, space, w, h, path: cut(rrectPts(-w / 2, 0, w, h, 16), 4000 + i, 1.4, 16), tilt: (i % 2 ? 1 : -1) * 0.012 };
  capCache.set(i, out);
  return out;
}
function drawCaptions(ctx, t) {
  const i = CAPTIONS.findIndex(([a, b]) => t >= a && t < b);
  if (i < 0) return;
  const [a, b, text] = CAPTIONS[i];
  const L = capLayout(ctx, i, text);
  const alpha = clamp01(Math.min((t - a) / 0.25, (b - t) / 0.25));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  light.k = 1;
  ctx.save();
  ctx.translate(W / 2 - 20, CAP.y - L.h / 2); ctx.rotate(L.tilt);
  paper(ctx, L.path, '#fbf4e6', { z: 2.5, alpha });
  ctx.globalAlpha = alpha;
  ctx.font = `800 ${CAP.size}px "Plus Jakarta Sans"`; ctx.textAlign = 'left';
  L.lines.forEach((line, li) => {
    let x = -L.widths[li] / 2;
    for (const wd of line) {
      ctx.fillStyle = wd.accent ? (wd.w.startsWith('Korah') || wd.w === 'AI.' ? '#7c3aed' : '#e0521f') : '#3b2412';
      ctx.fillText(wd.w, x, 15 + CAP.line * (li + 0.78));
      x += wd.width + L.space;
    }
  });
  ctx.restore();
}

// ---- end card ----------------------------------------------------------------
const LINES = [
  { text: "YOU'RE", col: '#e39b2d', back: '#8a4f16' },
  { text: 'NOT', col: '#2f9e44', back: '#16552a' },
  { text: 'COOKED.', col: '#e39b2d', back: '#8a4f16' },
];
const endPaths = {};
function buildEnd(ctx) {
  let seed = 900;
  endPaths.hills = [
    { path: cut([[-60, 1640], [180, 1570], [420, 1615], [700, 1545], [1140, 1600], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#9fd67a', z: 1.5 },
    { path: cut([[-60, 1735], [260, 1665], [560, 1725], [860, 1655], [1140, 1705], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#45a846', z: 2 },
    { path: cut([[-60, 1835], [320, 1775], [640, 1825], [1140, 1765], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#1f7a34', z: 2.5 },
  ];
  endPaths.top = [
    { path: cut([[-60, -60], [1140, -60], [1140, 170], [820, 240], [520, 190], [220, 250], [-60, 190]], seed++, 3, 16), col: '#6fc25a', z: 1.5 },
    { path: cut([[-60, -60], [1140, -60], [1140, 90], [760, 140], [380, 100], [-60, 130]], seed++, 3, 16), col: '#1f8a3a', z: 2 },
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

function drawEnd(ctx, t, logo, tq) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  light.k = 1;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f8ecd6'); g.addColorStop(1, '#f3e3c4');
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
  // big jungle leaves poke in from the bottom corners
  [[F.S.fgLeaves[0], 70, 2010, -0.32], [F.S.fgLeaves[3], 1010, 2010, 0.32]].forEach(([l, x, y, a], i) => {
    const p = spring(u - 0.25 - i * 0.06, 1.1, 4.5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a + (1 - p) * (i ? 0.8 : -0.8) + Math.sin(tq * 1.2 + i) * 0.015); ctx.scale(0.7, 0.7);
    paper(ctx, l.path, i ? '#2a9443' : '#3bab4b', { z: 3 }); ctx.restore();
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
  if (t > T.endTag) {
    const p = spring(t - T.endTag, 1.3, 4.6);
    ctx.save();
    ctx.translate(W / 2, endPaths.tagY);
    ctx.rotate(-0.02);
    ctx.scale(1, Math.max(0.02, p));
    paper(ctx, endPaths.tag, '#fffaf1', { z: 2.5 });
    ctx.font = '800 58px "Plus Jakarta Sans"';
    const a = 'Visit ', b = 'Korah.app';
    const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
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
  const tq = Math.floor(t * 15) / 15;   // paper and sprites animate on twos
  const cam = camera(t);
  const g = inOut(span(t, T.glow, T.glow + 0.5));
  const b = inOut(span(t, T.bloom[0], T.bloom[1]));
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  if (t < T.fade[1]) {
    layer(ctx, cam, 'back', 0.55, [-80, -60, 1160, 2080], 1.2, (c) => { F.drawSky(c); F.drawFar(c); });
    applyCam(ctx, cam, 0.78); F.drawVines(ctx, tq);
    layer(ctx, cam, 'canopy', 0.78, [-80, -40, 1160, 440], 1.3, F.drawCanopyMass);
    F.drawHanging(ctx, tq);
    layer(ctx, cam, 'mid', 0.88, [-80, -60, 1160, 2080], 1.3, F.drawMid);
    F.drawBranchVines(ctx, tq); F.drawToucan(ctx, birdState(t, tq)); F.drawTag(ctx, t, tq, b);
    applyCam(ctx, cam, 0.93); F.drawStream(ctx, t);
    applyCam(ctx, cam, 0.95); F.drawButterflies(ctx, tq);

    layer(ctx, cam, 'ground', 1, [-80, 1140, 1160, 2110], 1.35, F.drawGround);
    F.drawPages(ctx, t, false);
    F.drawLog(ctx);
    drawOldLaptop(ctx, t);
    // the student sits behind the log; hands reach over the workbook
    ctx.save();
    const clip = new Path2D();
    clip.rect(-200, -200, 560, F.LOG.top + 206);
    clip.rect(360, -200, 900, F.LOG.top + 222);
    ctx.clip(clip);
    student.draw(ctx, studentPose(tq, g, b), HX, HY, P, paper, '#fbf2e2');
    ctx.restore();
    F.drawLogFront(ctx, tq);

    const shake = t > T.rustle && t < T.emerge + 0.35 ? Math.sin(Math.PI * span(t, T.rustle, T.emerge + 0.35)) : 0;
    F.drawBushBack(ctx, tq, shake);
    const fy = friendY(t, tq);
    const lap = { x: FX - 112, y: fy - 30 };
    if (t >= T.emerge) {
      if (g > 0) drawRays(ctx, t, lap, g);
      ctx.save();
      ctx.beginPath(); ctx.rect(-200, -200, 1600, BUSH_BASE + 200); ctx.clip();
      ctx.save(); ctx.translate(FX, 0); ctx.scale(-1, 1);
      student.draw(ctx, friendPose(tq), 0, fy, P, paper, '#fbf2e2');
      ctx.restore();
      drawLaptop(ctx, t, lap, t >= T.glow ? drawScreen(t, assets.sprite) : null, g);
      applyCam(ctx, cam, 1);
      ctx.restore();
    }
    F.drawBushFront(ctx, tq, shake);
    F.drawFlowers(ctx, t);
    F.drawPages(ctx, t, true);
    F.drawSwirl(ctx, t);
    F.drawFallingLeaves(ctx, tq);

    layer(ctx, cam, 'fg', 1.2, [-80, 1350, 1180, 2140], 1.45, F.drawForeground);
    layer(ctx, cam, 'over', 1.35, [-220, -220, 620, 520], 1.5, F.drawOverhang);
    drawLighting(ctx, t, cam, g, b, lap);
    if (g > 0) drawSparkles(ctx, t, cam, lap);
    drawCaptions(ctx, t);
  }
  if (t >= T.fade[0]) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (t < T.fade[1]) {
      ctx.fillStyle = `rgba(247,234,212,${inOut(span(t, T.fade[0], T.fade[1]))})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      drawEnd(ctx, t, assets.logo, tq);
    }
  }
}

// ---- main --------------------------------------------------------------------
async function main() {
  F.build();
  build();
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  buildEnd(ctx);
  const assets = {
    sprite: await loadImage(path.join(HERE, '../korah-not-cooked/assets/korah-idle-sheet.png')),
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
  const wav = path.join(outDir, 'sat-taker.wav');
  writeWav(wav);
  if (args.includes('--audio')) return;
  const out = path.join(outDir, 'sat-taker.mp4');
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
