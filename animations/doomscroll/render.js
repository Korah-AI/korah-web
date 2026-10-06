// "Stop doomscrolling" - paper-cut Korah reel, 1080x1920 @ 30fps (9:16 for Reels).
//   node doomscroll/render.js                  render the mp4
//   node doomscroll/render.js --stills 2,7.5   write review PNGs for those seconds
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { createCanvas, GlobalFonts, loadImage, Path2D } = require('@napi-rs/canvas');
const ffmpeg = require('ffmpeg-static');
const {
  rng, clamp01, lerp, span, inOut, outBack, spring, mixHex,
  rectPts, rrectPts, ellipsePts, cut, paper, light, grain,
} = require('./paper');
const student = require('./student');
const { drawApp, mascotFrame } = require('./phone');
const { T, STEPS, FEED_NOTIFS, NOTIF_LIFE } = require('./timeline');
const { writeWav } = require('./audio');

// Canvas buffers live outside the JS heap, so collect often to keep memory flat.
require('v8').setFlagsFromString('--expose-gc');
const gc = require('vm').runInNewContext('gc');

const W = 1080, H = 1920, FPS = 30;
const HERE = __dirname;
for (const f of fs.readdirSync(path.join(HERE, 'assets/fonts'))) GlobalFonts.registerFromPath(path.join(HERE, 'assets/fonts', f));

// ---- layout (world units = output pixels at zoom 1) --------------------------
const P = 7;                     // sprite pixel size
const FLOOR = 1420;              // where feet stand
const BED = { x0: 60, x1: 840, top: 1196, frame: 1252 };
const DESK = { x0: 1230, x1: 1720, top: 1112 };
const LAMP = { x: 1556, base: 1112, joint: 892, shade: [1466, 878] };
const CAL = { x: 790, y: 430, w: 340, h: 400 };
const WIN = { x: 130, y: 470, w: 430, h: 460 };
const PHONE = { w: 96, h: 206 };       // seen from the back; the screen faces local +x
const APPV = { w: 300, h: 600, y: 330 }; // the paper "app view" panel beside the phone
const NOTIF = { w: 350, h: 100 };
const COLD = '#6f93ff', WARM = '#ffb347';
const LOGO_BOX = [72, 36, 1110, 1182]; // opaque area of newlogo2.png
// the three pieces of the blanket: scale, launch lag, upward speed, drift, spin
const BLANKET = [
  { k: 1.0, lag: 0, vy: 660, dx: 250, ox: 0, oy: 0, rot0: 0, spin: 0 },
  { k: 0.74, lag: 0.05, vy: 740, dx: 318, ox: 40, oy: -16, rot0: 0.1, spin: 0.5 },
  { k: 0.5, lag: 0.1, vy: 820, dx: 386, ox: -30, oy: -26, rot0: -0.14, spin: -0.7 },
];

// ---- static paper shapes ----------------------------------------------------
const S = {};
function build() {
  let seed = 200;
  const c = (pts, amp = 1.3, step = 16) => cut(pts, seed++, amp, step);
  S.wall = c(rectPts(-400, -400, 2600, 1830), 0, 600);
  S.stripes = [];
  for (let x = -400; x < 2200; x += 150) S.stripes.push(c(rectPts(x, -400, 72, 1830), 1.2, 40));
  S.baseboard = c(rectPts(-400, FLOOR - 40, 2600, 40), 1.2, 24);
  S.floor = c(rectPts(-400, FLOOR, 2600, 600), 0, 600);
  S.planks = [];
  for (let y = FLOOR + 44; y < 2000; y += 52) S.planks.push(c(rectPts(-400, y, 2600, 24), 1.4, 34));
  S.rug = c(rrectPts(430, 1486, 760, 150, 70), 2, 18);

  // window with the moon in it, curtains pulled back to the sides
  S.winFrame = c(rrectPts(WIN.x - 24, WIN.y - 24, WIN.w + 48, WIN.h + 48, 14), 1.4, 20);
  S.winHole = new Path2D(); S.winHole.rect(WIN.x, WIN.y, WIN.w, WIN.h);
  S.mullionV = c(rectPts(WIN.x + WIN.w / 2 - 9, WIN.y, 18, WIN.h), 1, 20);
  S.mullionH = c(rectPts(WIN.x, WIN.y + WIN.h * 0.44, WIN.w, 16), 1, 20);
  S.sill = c(rrectPts(WIN.x - 44, WIN.y + WIN.h + 20, WIN.w + 88, 26, 6), 1.2, 18);
  S.moon = c(ellipsePts(0, 0, 58, 58, 34), 1.2, 10);
  S.cloud1 = c(ellipsePts(0, 0, 86, 19, 22), 1.6, 12);
  S.cloud2 = c(ellipsePts(0, 0, 62, 14, 20), 1.6, 12);
  S.curtainL = c([[WIN.x - 62, WIN.y - 48], [WIN.x + 42, WIN.y - 48], [WIN.x + 28, WIN.y + 190],
    [WIN.x + 48, WIN.y + WIN.h + 26], [WIN.x + 12, WIN.y + WIN.h + 44], [WIN.x - 18, WIN.y + WIN.h + 26],
    [WIN.x - 60, WIN.y + WIN.h + 42]], 2, 14);
  S.curtainR = c([[WIN.x + WIN.w - 42, WIN.y - 48], [WIN.x + WIN.w + 62, WIN.y - 48], [WIN.x + WIN.w + 60, WIN.y + WIN.h + 42],
    [WIN.x + WIN.w + 18, WIN.y + WIN.h + 26], [WIN.x + WIN.w - 12, WIN.y + WIN.h + 44], [WIN.x + WIN.w - 48, WIN.y + WIN.h + 26],
    [WIN.x + WIN.w - 28, WIN.y + 190]], 2, 14);
  S.rod = c(rrectPts(WIN.x - 76, WIN.y - 60, WIN.w + 152, 14, 7), 1, 20);

  // calendar
  S.cal = c(rectPts(CAL.x, CAL.y, CAL.w, CAL.h), 1.6, 20);
  S.calBand = c(rectPts(CAL.x, CAL.y, CAL.w, 88), 1.2, 20);
  S.calHook = c(ellipsePts(CAL.x + CAL.w / 2, CAL.y - 14, 9, 9, 16), 0.8, 8);

  // bed
  S.headboard = c(rrectPts(26, 1000, 84, 310, 16), 1.4, 20);
  S.bedFrame = c(rectPts(BED.x0, BED.frame, BED.x1 - BED.x0, 122), 1.4, 22);
  S.bedLegs = [c(rectPts(84, 1374, 40, 50), 1, 14), c(rectPts(782, 1374, 40, 50), 1, 14)];
  S.mattress = c(rrectPts(96, BED.top, 728, 68, 14), 1.6, 20);
  S.sheet = c(rrectPts(102, BED.top + 40, 716, 34, 10), 1.4, 20);
  S.pillow = c(rrectPts(-108, -42, 216, 84, 34), 2, 16);
  const cloth = (k) => c([[-250, -74], [-176, -86], [-92, -68], [-8, -84], [76, -66], [158, -82], [244, -64],
    [256, 18], [244, 76], [150, 62], [62, 80], [-30, 64], [-120, 82], [-210, 66], [-254, 22]].map(([x, y]) => [x * k, y * k]), 2.4, 18);
  S.blanket = BLANKET.map((b) => cloth(b.k));
  S.blanketFold = c([[-244, -70], [-120, -78], [12, -64], [140, -76], [246, -62], [242, -16], [-244, -22]], 1.8, 16);

  // desk, chair, lamp
  S.deskTop = c([[DESK.x0, DESK.top], [DESK.x1, DESK.top], [DESK.x1 - 14, DESK.top + 34], [DESK.x0 + 14, DESK.top + 34]], 1.4, 20);
  S.deskFront = c(rectPts(DESK.x0 + 20, DESK.top + 34, DESK.x1 - DESK.x0 - 40, 160), 1.4, 22);
  S.deskLegs = [c(rectPts(DESK.x0 + 30, DESK.top + 194, 42, 230), 1, 16), c(rectPts(DESK.x1 - 96, DESK.top + 194, 42, 230), 1, 16)];
  S.chairSeat = c(rrectPts(1074, 1240, 160, 34, 12), 1.4, 18);
  S.chairBack = c(rrectPts(1078, 1006, 34, 240, 16), 1.4, 18);
  S.chairLeg = c(rectPts(1140, 1274, 22, 150), 1, 14);
  S.chairFoot = c(rrectPts(1086, 1414, 132, 18, 9), 1, 14);
  S.lampBase = c(ellipsePts(LAMP.x, LAMP.base, 62, 16, 26), 1.2, 12);
  S.lampStem = c(rectPts(LAMP.x - 8, LAMP.joint, 16, LAMP.base - LAMP.joint), 0.9, 18);
  S.lampArm = c([[LAMP.x - 8, LAMP.joint + 12], [LAMP.x + 6, LAMP.joint - 2], [LAMP.shade[0] + 34, LAMP.shade[1] - 18], [LAMP.shade[0] + 20, LAMP.shade[1] - 2]], 1, 14);
  S.lampShade = c([[LAMP.shade[0] - 30, LAMP.shade[1] - 34], [LAMP.shade[0] + 44, LAMP.shade[1] - 6], [LAMP.shade[0] + 30, LAMP.shade[1] + 40], [LAMP.shade[0] - 40, LAMP.shade[1] + 12]], 1.6, 14);
  S.poster = c(rectPts(1302, 540, 250, 316), 1.6, 20);
  S.posterArt = c(ellipsePts(1427, 664, 78, 78, 30), 1.4, 12);
  S.laundry = [c(ellipsePts(628, 1512, 74, 30, 20), 2.4, 10), c(ellipsePts(676, 1534, 58, 24, 18), 2.4, 10)];
  S.notebook = c(rrectPts(1290, 1086, 150, 30, 5), 1.2, 16);
  S.pencil = c(rrectPts(1476, 1094, 96, 12, 4), 0.8, 12);

  // the phone, seen from the back, plus the notifications and the app view panel
  S.phone = c(rrectPts(-PHONE.w / 2, -PHONE.h / 2, PHONE.w, PHONE.h, 16), 0.7, 20);
  S.phoneBack = c(rrectPts(-PHONE.w / 2 + 8, -PHONE.h / 2 + 8, PHONE.w - 16, PHONE.h - 16, 11), 0.6, 18);
  S.phoneCam = c(rrectPts(-34, -88, 42, 42, 13), 0.6, 10);
  S.notif = c(rrectPts(-NOTIF.w / 2, -NOTIF.h / 2, NOTIF.w, NOTIF.h, 22), 1.1, 16);
  S.notifIcon = c(rrectPts(-NOTIF.w / 2 + 16, -26, 52, 52, 15), 0.8, 10);
  S.appFrame = c(rrectPts(0, 0, APPV.w, APPV.h, 20), 1.2, 20);
  S.tag = c(rrectPts(-410, 0, 820, 104, 20), 1.6, 18);
}

// ---- helpers ----------------------------------------------------------------
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
const pt = (t, kx, ky) => [track(t, kx), track(t, ky)];

// ---- the student's performance ----------------------------------------------
const FACES = [
  [0, { eye: 'half', brow: 'droop', mouth: 'flat', bags: 1 }],
  [T.notify, { eye: 'open', brow: 'up', mouth: 'flat', bags: 1 }],
  [T.glance, { eye: 'open', brow: 'worried', mouth: 'flat', bags: 1 }],
  [T.realise, { eye: 'wide', brow: 'up', mouth: 'o', bags: 1 }],
  [T.bolt + 0.6, { eye: 'wide', brow: 'worried', mouth: 'o' }],
  [T.stand, { eye: 'open', brow: 'worried', mouth: 'flat' }],
  [T.lamp + 0.25, { eye: 'open', brow: 'neutral', mouth: 'flat' }],
  [T.open + 0.3, { eye: 'open', brow: 'focus', mouth: 'smile', look: 1 }],
  [T.focus, { eye: 'open', brow: 'focus', mouth: 'smile', look: 1 }],
];
const BLINKS = [1.25, 2.6, 3.45, 5.3, 11.9, 13.9];

// the walk cycle: feet plant and swing, the hips bob on each step
function walkFeet(t) {
  const u = (t - STEPS[0]) / (2 * (STEPS[1] - STEPS[0]));
  const foot = (ph) => {
    const v = ((ph % 1) + 1) % 1;
    if (v < 0.5) return [lerp(6.5, -6.5, v / 0.5), 27];
    const s = (v - 0.5) / 0.5;
    return [lerp(-6.5, 6.5, inOut(s)), 27 - Math.sin(Math.PI * s) * 8];
  };
  return { near: foot(u), far: foot(u + 0.5), bob: Math.abs(Math.sin(2 * Math.PI * u)) * 2 };
}

function body(t) {
  const face = { ...FACES.filter(([ft]) => ft <= t).pop()[1] };
  if (BLINKS.some((b) => t >= b && t < b + 0.16) && face.eye !== 'wide') face.eye = 'closed';
  const walking = t > T.walk[0] && t < T.walk[1] + 0.12;
  const wk = walkFeet(t);
  const blend = clamp01((t - T.walk[0]) / 0.22) * clamp01((T.walk[1] + 0.12 - t) / 0.3);

  const hipX = track(t, [[0, 520], [T.bolt, 520], [T.edge, 690], [T.stand, 748], [T.walk[0], 762], [T.walk[1], 1120], [T.sit, 1152]]);
  const hipY = track(t, [[0, 1150], [T.bolt, 1150], [T.bolt + 0.3, 1186], [T.edge, 1180], [T.stand, 1231], [T.walk[0], 1231], [T.walk[1], 1231], [T.sit, 1246]])
    - (walking ? wk.bob : 0);
  const lean = track(t, [[0, -1.5], [T.bolt, -1.5], [T.bolt + 0.28, -0.06, 'back'], [T.edge, -0.04], [T.stand, 0.05], [T.walk[0], 0.16], [T.walk[1], 0.16], [T.sit, 0.24], [T.focus, 0.05, 'back']]);

  const legT = [[0, 27], [T.bolt, 27], [T.bolt + 0.3, 22], [T.edge, 29], [T.stand, 27], [T.walk[0], 27], [T.walk[1] + 0.12, 27], [T.sit, 25]];
  const feet = {
    near: [track(t, [[0, 27], [T.bolt, 27], [T.bolt + 0.3, 22], [T.edge, 6], [T.stand, 4], [T.walk[0], 6], [T.walk[1] + 0.12, 6], [T.sit, 14]]), track(t, legT)],
    far: [track(t, [[0, 25], [T.bolt, 25], [T.bolt + 0.3, 20], [T.edge, 2], [T.stand, -2], [T.walk[0], 0], [T.walk[1] + 0.12, 0], [T.sit, 11]]), track(t, legT.map(([a, b], i) => [a, b + (i < 3 ? 4 : 0)]))],
  };
  if (blend > 0) {
    feet.near = [lerp(feet.near[0], wk.near[0], blend), lerp(feet.near[1], wk.near[1], blend)];
    feet.far = [lerp(feet.far[0], wk.far[0], blend), lerp(feet.far[1], wk.far[1], blend)];
  }

  // the near hand keeps hold of the phone the whole way through
  const near = pt(t,
    [[0, -16], [T.bolt, -16], [T.bolt + 0.35, 6], [T.edge, 9], [T.stand, 10], [T.walk[0], 11], [T.walk[1], 11], [T.sit, 15], [T.focus, 15]],
    [[0, -18], [T.bolt, -18], [T.bolt + 0.35, -4], [T.edge, -3], [T.stand, -3], [T.walk[0], -4], [T.walk[1], -4], [T.sit, -13], [T.focus, -14]]);
  const far = pt(t,
    [[0, -24], [T.bolt, -24], [T.bolt + 0.28, 6], [T.edge, 4], [T.stand, 2], [T.walk[0], -4], [T.lamp, 16], [T.lamp + 0.3, 8], [T.sit, 9]],
    [[0, -6], [T.bolt, -6], [T.bolt + 0.28, -2], [T.edge, 0], [T.stand, -2], [T.walk[0], -4], [T.lamp, -20], [T.lamp + 0.3, -6], [T.sit, -8]]);
  if (walking) far[0] += Math.sin(2 * Math.PI * (t - STEPS[0]) / (2 * (STEPS[1] - STEPS[0]))) * 7 * blend;

  const warm = inOut(span(t, T.lamp, T.lamp + 0.45));
  const up = t < T.flip;
  return {
    hip: [hipX, hipY],
    pose: {
      lean, bulge: track(t, [[0, 1], [T.bolt, 1], [T.stand, 0.55], [T.focus, 0.2]]),
      headTilt: track(t, [[0, -0.12], [T.bolt, -0.12], [T.bolt + 0.28, 0.14], [T.stand, 0.1], [T.sit, 0.14], [T.focus, 0.04]]),
      headDrop: 0,
      lift: track(t, [[T.realise, 0], [T.realise + 0.12, -1.6], [T.realise + 0.3, 0], [T.bolt, 0]]),
      headUp: up,
      near, far, footNear: feet.near, footFar: feet.far,
      kneeNear: -1, kneeFar: -1,
      face,
      rim: { c: parse(mixHex(COLD, WARM, warm)), a: up ? 0.45 : 0.5, dir: up ? [0, -1] : [1, 0] },
    },
  };
}

// where the phone sits in the hand
function phoneAt(t, hand) {
  const rot = track(t, [[0, 1.72], [T.bolt, 1.72], [T.bolt + 0.35, 2.24], [T.edge, 2.38], [T.walk[0], 2.5], [T.sit, 3.06]]);
  const [dx, dy] = pt(t,
    [[0, -76], [T.bolt, -76], [T.bolt + 0.35, 24], [T.sit, 16]],
    [[0, -36], [T.bolt, -36], [T.bolt + 0.35, -40], [T.walk[0], -40], [T.sit, -104]]);
  return { x: hand[0] + dx, y: hand[1] + dy, rot };
}

// ---- camera -----------------------------------------------------------------
function camera(t) {
  const s = track(t, [[0, 1.62], [3.6, 1.5], [4.25, 1.44], [5.0, 1.06], [5.6, 1.05], [6.1, 1.26], [6.6, 1.16], [7.7, 1.1], [8.1, 1.02], [9.5, 1.02], [10.3, 1.16], [11.1, 1.3], [14.2, 1.34], [15.25, 1.2]]);
  const cx = track(t, [[0, 300], [3.6, 336], [4.25, 350], [5.0, 672], [5.6, 678], [6.1, 430], [6.6, 520], [7.7, 650], [8.1, 830], [9.5, 1052], [10.3, 1206], [11.1, 1280], [14.2, 1300], [15.25, 1272]]);
  const cy = track(t, [[0, 1046], [3.6, 1062], [4.25, 1086], [5.0, 900], [5.6, 896], [6.1, 1072], [6.6, 1046], [7.7, 1056], [8.1, 1074], [9.5, 1074], [10.3, 1040], [11.1, 980], [14.2, 958], [15.25, 1000]]);
  return { s, cx, cy };
}
function applyCam(ctx, cam, depth) {
  const s = 1 + (cam.s - 1) * depth;
  const cx = W / 2 + (cam.cx - W / 2) * depth, cy = H / 2 + (cam.cy - H / 2) * depth;
  ctx.setTransform(s, 0, 0, s, W / 2 - cx * s, H / 2 - cy * s);
  light.k = s;
}

// ---- room -------------------------------------------------------------------
function drawWall(ctx, t) {
  paper(ctx, S.wall, '#3d4468', { z: 0, edge: false });
  for (const s of S.stripes) paper(ctx, s, '#434a70', { z: 0, grain: 0.5 });
  paper(ctx, S.baseboard, '#333a59', { z: 1 });
}

function drawWindow(ctx, t) {
  paper(ctx, S.winFrame, '#4a5177', { z: 2 });
  ctx.save();
  ctx.clip(S.winHole);
  const sky = ctx.createLinearGradient(0, WIN.y, 0, WIN.y + WIN.h);
  sky.addColorStop(0, '#0e1730'); sky.addColorStop(1, '#222d54');
  ctx.fillStyle = sky; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
  const R = rng(9);
  for (let i = 0; i < 16; i++) {
    const x = WIN.x + 14 + R() * (WIN.w - 28), y = WIN.y + 14 + R() * (WIN.h - 28);
    ctx.fillStyle = `rgba(226,236,255,${0.3 + 0.3 * Math.sin(t * 2.2 + i)})`;
    ctx.beginPath(); ctx.arc(x, y, 1.6 + R() * 1.6, 0, 7); ctx.fill();
  }
  const mx = WIN.x + WIN.w * 0.26, my = WIN.y + WIN.h * 0.28;
  const halo = ctx.createRadialGradient(mx, my, 40, mx, my, 230);
  halo.addColorStop(0, 'rgba(198,214,255,0.34)'); halo.addColorStop(1, 'rgba(198,214,255,0)');
  ctx.fillStyle = halo; ctx.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
  ctx.save(); ctx.translate(mx, my);
  paper(ctx, S.moon, '#e8eeff', { z: 1.2 });
  ctx.fillStyle = 'rgba(180,196,238,0.45)';
  for (const [cx, cy, r] of [[-18, -10, 11], [14, 16, 8], [6, -22, 6]]) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); }
  ctx.restore();
  ctx.save(); ctx.translate(WIN.x + 90 + ((t * 7) % (WIN.w + 240)), WIN.y + 150);
  paper(ctx, S.cloud1, 'rgba(60,74,116,0.85)', { z: 1, edge: false }); ctx.restore();
  ctx.save(); ctx.translate(WIN.x + WIN.w - ((t * 5) % (WIN.w + 200)), WIN.y + 320);
  paper(ctx, S.cloud2, 'rgba(48,60,98,0.85)', { z: 1, edge: false }); ctx.restore();
  ctx.restore();
  paper(ctx, S.mullionV, '#4a5177', { z: 1.5 });
  paper(ctx, S.mullionH, '#4a5177', { z: 1.5 });
  paper(ctx, S.sill, '#525a82', { z: 2.2 });
  paper(ctx, S.curtainL, '#39406a', { z: 3 });
  paper(ctx, S.curtainR, '#39406a', { z: 3 });
  paper(ctx, S.rod, '#2b3050', { z: 3 });
}

function drawCalendar(ctx, t) {
  paper(ctx, S.calHook, '#2b3050', { z: 1 });
  paper(ctx, S.cal, '#f2e6cf', { z: 2.5 });
  paper(ctx, S.calBand, '#c0603f', { z: 0.8 });
  ctx.fillStyle = '#fff3e2'; ctx.font = '54px "Luckiest Guy"'; ctx.textAlign = 'center';
  ctx.fillText('OCT', CAL.x + CAL.w / 2, CAL.y + 62);
  // grid
  const gx = CAL.x + 26, gy = CAL.y + 116, cw = (CAL.w - 52) / 7, ch = 44;
  ctx.fillStyle = '#b9a98c';
  for (let r = 0; r < 4; r++) for (let q = 0; q < 7; q++) {
    if (r === 2 && q === 4) continue;
    ctx.beginPath(); ctx.roundRect(gx + q * cw + 6, gy + r * ch + 8, cw - 14, 16, 4); ctx.fill();
  }
  // the circled day
  const dx = gx + 4 * cw + cw / 2, dy = gy + 2 * ch + 16;
  ctx.fillStyle = '#8a3b2a'; ctx.font = '30px "Luckiest Guy"';
  ctx.fillText('14', dx, dy + 10);
  const glint = 0.75 + 0.25 * Math.sin(t * 3.4);
  ctx.strokeStyle = `rgba(206,58,46,${glint})`; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.ellipse(dx, dy, 30, 26, 0.12, 0, 7); ctx.stroke();
  // hand-lettered under the grid
  ctx.fillStyle = '#ce3a2e'; ctx.font = '62px "Luckiest Guy"';
  ctx.save(); ctx.translate(CAL.x + CAL.w / 2, CAL.y + 322); ctx.rotate(-0.035);
  ctx.fillText('SAT', 0, 0);
  ctx.font = '40px "Luckiest Guy"';
  ctx.fillText('THIS WEEK', 0, 48);
  ctx.restore();
}

function drawPoster(ctx) {
  paper(ctx, S.poster, '#e8dcc0', { z: 2 });
  paper(ctx, S.posterArt, '#c9744f', { z: 0.6 });
  ctx.fillStyle = '#8a5a3b';
  ctx.fillRect(1330, 786, 194, 14); ctx.fillRect(1330, 812, 130, 10);
}

// the blanket: flat over the legs, then thrown off in a paper flutter. Three pieces
// with slightly different weights, so it fans apart instead of reading as one board.
const LAND = 0.9;
function blanketAt(t, b) {
  const u = t - T.bolt - b.lag;
  const rest = { x: 625 + b.ox, y: 1172 + b.oy, rot: b.rot0, s: 1 };
  if (u <= 0) return rest;
  const fly = Math.min(u, LAND);
  const f = fly / LAND;
  const g = (b.vy * LAND + 34) / (0.5 * LAND * LAND);
  const wob = u > LAND ? Math.exp(-(u - LAND) * 4.5) * Math.sin((u - LAND) * 16) * 0.05 : 0;
  return {
    x: rest.x + b.dx * fly / LAND,
    y: rest.y - b.vy * fly + 0.5 * g * fly * fly,
    rot: b.rot0 - 1.7 * Math.sin(Math.PI * f) - (0.18 + b.spin) * f + wob,
    s: 1 + 0.16 * Math.sin(Math.PI * f * 3 + b.lag * 20),
  };
}

function drawBed(ctx, t) {
  paper(ctx, S.headboard, '#5a4230', { z: 2.5 });
  for (const l of S.bedLegs) paper(ctx, l, '#4a3626', { z: 1.5 });
  paper(ctx, S.bedFrame, '#6b4f39', { z: 2.5 });
  paper(ctx, S.mattress, '#e2d7c2', { z: 2 });
  paper(ctx, S.sheet, '#cfc3ab', { z: 0.8 });
  ctx.save(); ctx.translate(248, 1172); ctx.rotate(-0.05);
  paper(ctx, S.pillow, '#efe6d3', { z: 2.2 });
  ctx.restore();
}

function drawBlanket(ctx, t) {
  BLANKET.forEach((cfg, i) => {
    const b = blanketAt(t, cfg);
    ctx.save();
    ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.scale(b.s, 1 / b.s);
    paper(ctx, S.blanket[i], ['#6d4a63', '#7b5570', '#5f4057'][i], { z: 3 - i * 0.6 });
    if (i === 0) paper(ctx, S.blanketFold, '#7d586f', { z: 0.6 });
    ctx.restore();
  });
}

function drawDesk(ctx, t) {
  for (const l of S.deskLegs) paper(ctx, l, '#5a4230', { z: 1.5 });
  paper(ctx, S.deskFront, '#6b4f39', { z: 2 });
  paper(ctx, S.deskTop, '#8a6444', { z: 2.5 });
  paper(ctx, S.notebook, '#e6dac2', { z: 1.4 });
  paper(ctx, S.pencil, '#d8a24a', { z: 1.2 });
}

function drawChair(ctx) {
  paper(ctx, S.chairLeg, '#4a3626', { z: 1.2 });
  paper(ctx, S.chairFoot, '#4a3626', { z: 1.2 });
  paper(ctx, S.chairBack, '#5f4534', { z: 2.5 });
  paper(ctx, S.chairSeat, '#6b4f39', { z: 2 });
}

function drawLamp(ctx, t) {
  paper(ctx, S.lampBase, '#3f4668', { z: 2 });
  paper(ctx, S.lampStem, '#4a5177', { z: 1.5 });
  paper(ctx, S.lampArm, '#4a5177', { z: 1.6 });
  const on = clamp01((t - T.lamp) * 6);
  paper(ctx, S.lampShade, mixHex('#5b638f', '#f0b35e', on), { z: 2.6 });
  if (on > 0) {
    const g = ctx.createRadialGradient(LAMP.shade[0], LAMP.shade[1] + 18, 4, LAMP.shade[0], LAMP.shade[1] + 18, 70);
    g.addColorStop(0, `rgba(255,230,170,${0.9 * on})`); g.addColorStop(1, 'rgba(255,230,170,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(LAMP.shade[0], LAMP.shade[1] + 18, 70, 0, 7); ctx.fill();
  }
}

function drawFloor(ctx) {
  paper(ctx, S.floor, '#3a3252', { z: 0, edge: false });
  for (const p of S.planks) paper(ctx, p, '#403858', { z: 0.4 });
  paper(ctx, S.rug, '#4c4068', { z: 1.2 });
  paper(ctx, S.laundry[0], '#584a74', { z: 1.6 });
  paper(ctx, S.laundry[1], '#6b5a84', { z: 1.6 });
}

// ---- the phone and what comes out of it ---------------------------------------
// We see the back of the phone, the way it would look from across the room. The
// screen faces local +x, so all that reaches us is the light it throws.
function drawPhone(ctx, ph, glow) {
  const [gr, gg, gb] = parse(glow);
  ctx.save();
  ctx.translate(ph.x, ph.y); ctx.rotate(ph.rot);
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const fan = ctx.createLinearGradient(46, 0, 386, 0);
  fan.addColorStop(0, `rgba(${gr},${gg},${gb},0.22)`); fan.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
  ctx.fillStyle = fan;
  ctx.beginPath();
  ctx.moveTo(46, -PHONE.h / 2); ctx.lineTo(386, -PHONE.h / 2 - 170);
  ctx.lineTo(386, PHONE.h / 2 + 170); ctx.lineTo(46, PHONE.h / 2);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  paper(ctx, S.phone, '#1c2033', { z: 3 });
  paper(ctx, S.phoneBack, '#272c44', { z: 0.5 });
  paper(ctx, S.phoneCam, '#161a2b', { z: 0.8 });
  for (const [cx, cy] of [[-22, -76], [-4, -58]]) {
    ctx.fillStyle = '#0c0f1d'; ctx.beginPath(); ctx.arc(cx, cy, 8.5, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(150,170,220,0.4)'; ctx.beginPath(); ctx.arc(cx - 2.5, cy - 2.5, 3, 0, 7); ctx.fill();
  }
  ctx.fillStyle = '#48507a'; ctx.beginPath(); ctx.arc(-22, -54, 3.5, 0, 7); ctx.fill();
  ctx.save();
  ctx.shadowColor = glow; ctx.shadowBlur = 26 * light.k;
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.roundRect(41, -PHONE.h / 2 + 10, 7, PHONE.h - 20, 3.5); ctx.fill();
  ctx.restore();
  ctx.restore();
}

// Notifications drifting up out of the phone, then the one that stops the scroll.
const BODIES = [
  '@zaneclips posted a video',
  '3 new videos for you',
  '@mika.edits went live',
  'Someone replied to your comment',
  '@dev.hoops posted a video',
  'New from creators you follow',
];
function drawNotif(ctx, x, y, kind, a, sc) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y); ctx.scale(sc, sc);
  const ix = -NOTIF.w / 2 + 42, tx = -NOTIF.w / 2 + 84;
  ctx.textAlign = 'left';
  if (kind === 'sat') {
    paper(ctx, S.notif, '#fdf4e2', { z: 2.8 });
    paper(ctx, S.notifIcon, '#ce3a2e', { z: 1 });
    ctx.fillStyle = '#fdf4e2';
    ctx.beginPath(); ctx.roundRect(ix - 17, -16, 34, 30, 4); ctx.fill();
    ctx.fillStyle = '#ce3a2e'; ctx.fillRect(ix - 17, -16, 34, 9);
    ctx.fillStyle = '#c9b79a';
    for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) ctx.fillRect(ix - 12 + q * 10, -3 + r * 9, 6, 5);
    ctx.fillStyle = '#3b2412'; ctx.font = '800 21px "Plus Jakarta Sans"';
    ctx.fillText('Reminder', tx, -8);
    ctx.fillStyle = '#a57a57'; ctx.font = '600 17px "Plus Jakarta Sans"';
    ctx.textAlign = 'right'; ctx.fillText('now', NOTIF.w / 2 - 22, -8); ctx.textAlign = 'left';
    ctx.fillStyle = '#5a3a24'; ctx.font = '600 19px "Plus Jakarta Sans"';
    ctx.fillText('Your SAT is this Saturday', tx, 22);
  } else {
    paper(ctx, S.notif, '#1b2036', { z: 2.4, grain: 0.4 });
    paper(ctx, S.notifIcon, '#0f1220', { z: 1 });
    const g = ctx.createLinearGradient(ix - 14, -14, ix + 14, 14);
    g.addColorStop(0, '#39e8e0'); g.addColorStop(1, '#ff3d70');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(ix - 9, -14); ctx.lineTo(ix + 14, 0); ctx.lineTo(ix - 9, 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9edff'; ctx.font = '800 21px "Plus Jakarta Sans"';
    ctx.fillText('For You', tx, -8);
    ctx.fillStyle = '#6f7799'; ctx.font = '600 17px "Plus Jakarta Sans"';
    ctx.textAlign = 'right'; ctx.fillText('now', NOTIF.w / 2 - 22, -8); ctx.textAlign = 'left';
    ctx.fillStyle = '#aeb6d4'; ctx.font = '600 18px "Plus Jakarta Sans"';
    ctx.fillText(kind, tx, 22);
  }
  ctx.restore();
}

function drawNotifs(ctx, t, ph) {
  const gone = clamp01((T.notify + 0.35 - t) * 1.8);
  if (gone <= 0) return;
  for (const [t0, i] of FEED_NOTIFS) {
    const u = (t - t0) / NOTIF_LIFE;
    if (u < 0 || u > 1) continue;
    const a = Math.min(1, u * 6) * Math.min(1, (1 - u) * 3.2) * gone;
    drawNotif(ctx, ph.x + 126 + Math.sin(u * 2.2 + i) * 16, ph.y - 130 - u * 520,
      BODIES[i % BODIES.length], a * 0.95, lerp(0.86, 1.02, u));
  }
}

// The reminder that stops the scroll: it drops in, sits there, and leaves with the blanket.
function drawSatNotif(ctx, t, ph) {
  if (t < T.notify || t > T.bolt + 0.6) return;
  const p = spring(t - T.notify, 1.2, 4.8);
  const out = clamp01((t - T.bolt) / 0.4);
  const a = clamp01((t - T.notify) * 6) * (1 - out);
  const y = ph.y - 300 - 170 * (1 - clamp01(p)) - out * 300;
  drawNotif(ctx, ph.x + 126, y + Math.sin(t * 1.7) * 5, 'sat', a, 1.14);
}

// the Korah practice cards rising out of the phone like a pop-up book
// A paper window beside the phone showing what is actually on the screen, because
// the phone itself is turned away from us.
function drawAppView(ctx, t, ph, sprite) {
  if (t < T.open + 0.2) return;
  const p = spring(t - T.open - 0.2, 1.2, 4.4);
  const x = ph.x - APPV.w / 2 - 6, y = APPV.y;
  // light from the screen spreading up into the panel
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = 0.55 * clamp01(p);
  const bg = ctx.createLinearGradient(0, ph.y - 100, 0, y + APPV.h);
  bg.addColorStop(0, 'rgba(255,196,110,0.34)'); bg.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.moveTo(ph.x - 44, ph.y - 96); ctx.lineTo(ph.x + 44, ph.y - 96);
  ctx.lineTo(x + APPV.w - 24, y + APPV.h); ctx.lineTo(x + 24, y + APPV.h);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x + APPV.w / 2, y + APPV.h);
  ctx.scale(1, Math.max(0.02, p));
  ctx.translate(-(x + APPV.w / 2), -(y + APPV.h));
  ctx.translate(x, y);
  paper(ctx, S.appFrame, '#fffaf1', { z: 3.6 });
  ctx.save();
  ctx.beginPath(); ctx.roundRect(14, 14, APPV.w - 28, APPV.h - 28, 12); ctx.clip();
  ctx.drawImage(drawApp(t, sprite), 14, 14, APPV.w - 28, APPV.h - 28);
  ctx.restore();
  if (p < 1) { ctx.fillStyle = `rgba(90,45,15,${0.45 * (1 - p)})`; ctx.fill(S.appFrame); }
  ctx.restore();

  if (t > T.focus) {
    const q = spring(t - T.focus, 1.5, 5);
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = clamp01(q);
    ctx.translate(x + APPV.w - 74, y - 6 - 44 * Math.min(1, q));
    ctx.drawImage(sprite, mascotFrame(t) * 64, 0, 64, 64, -54, -54, 108, 108);
    ctx.restore();
  }
}

// ---- lighting ---------------------------------------------------------------
// The room is lit by one small source at a time, so the night is a dark sheet with
// a pool of light rubbed out of it wherever the phone or the lamp is.
const shadeCanvas = createCanvas(W, H);
function darkness(ctx, t, cam, ph) {
  const base = track(t, [[0, 0.93], [T.lamp, 0.93], [T.lamp + 0.5, 0.74], [T.settle, 0.72]]);
  const sx = shadeCanvas.getContext('2d');
  sx.setTransform(1, 0, 0, 1, 0, 0);
  sx.globalCompositeOperation = 'source-over'; sx.globalAlpha = 1;
  sx.fillStyle = '#141a38'; sx.fillRect(0, 0, W, H);
  sx.globalCompositeOperation = 'destination-out';
  const pool = (wx, wy, r, a) => {
    const x = W / 2 + (wx - cam.cx) * cam.s, y = H / 2 + (wy - cam.cy) * cam.s, rr = r * cam.s;
    const g = sx.createRadialGradient(x, y, 0, x, y, rr);
    g.addColorStop(0, `rgba(0,0,0,${a})`);
    g.addColorStop(0.5, `rgba(0,0,0,${a * 0.5})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    sx.fillStyle = g; sx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  };
  pool(ph.x + Math.cos(ph.rot) * 150, ph.y + Math.sin(ph.rot) * 150, 430, 0.62);
  pool(WIN.x + WIN.w * 0.26, WIN.y + WIN.h * 0.28, 250, 0.72);    // the moon itself
  pool(WIN.x + WIN.w / 2 + 60, WIN.y + WIN.h * 0.8, 600, 0.2);    // what it spills
  const on = inOut(clamp01((t - T.lamp) / 0.35));
  if (on > 0) pool(LAMP.shade[0] - 30, LAMP.shade[1] + 120, 640, 0.82 * on);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = base;
  ctx.drawImage(shadeCanvas, 0, 0);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
}

function drawLighting(ctx, t, cam, ph, glow, assets) {
  darkness(ctx, t, cam, ph);

  // moonlight falling through the window onto the bed
  applyCam(ctx, cam, 1);
  ctx.globalCompositeOperation = 'screen';
  ctx.filter = `blur(${20 * light.k}px)`;
  for (const [x0, x1, al] of [[WIN.x + 18, WIN.x + WIN.w / 2 - 16, 0.09], [WIN.x + WIN.w / 2 + 16, WIN.x + WIN.w - 18, 0.075]]) {
    ctx.fillStyle = `rgba(150,180,255,${al})`;
    ctx.beginPath();
    ctx.moveTo(x0, WIN.y + 60); ctx.lineTo(x1, WIN.y + 60);
    ctx.lineTo(x1 + 380, 1520); ctx.lineTo(x0 + 320, 1520); ctx.closePath(); ctx.fill();
  }
  ctx.filter = 'none';
  ctx.globalCompositeOperation = 'source-over';

  // self-lit: the phone, its notifications, and the app view
  applyCam(ctx, cam, 1);
  drawPhone(ctx, ph, glow);
  drawNotifs(ctx, t, ph);
  drawSatNotif(ctx, t, ph);
  drawAppView(ctx, t, ph, assets.sprite);

  // the lamp throws a cone down over the desk
  const on = inOut(clamp01((t - T.lamp) / 0.35));
  if (on > 0) {
    applyCam(ctx, cam, 1);
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = `blur(${16 * light.k}px)`;
    const [lx, ly] = [LAMP.shade[0] - 4, LAMP.shade[1] + 24];
    const cone = ctx.createLinearGradient(lx, ly, lx - 150, ly + 620);
    cone.addColorStop(0, `rgba(255,214,140,${0.32 * on})`); cone.addColorStop(1, 'rgba(255,190,110,0)');
    ctx.fillStyle = cone;
    ctx.beginPath(); ctx.moveTo(lx - 46, ly); ctx.lineTo(lx + 34, ly);
    ctx.lineTo(lx + 150, ly + 640); ctx.lineTo(lx - 400, ly + 640); ctx.closePath(); ctx.fill();
    ctx.filter = 'none';
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'screen';
  // glow off the phone screen
  const px = W / 2 + (ph.x - cam.cx) * cam.s, py = H / 2 + (ph.y - cam.cy) * cam.s;
  const [gr, gg, gb] = parse(glow);
  const spill = ctx.createRadialGradient(px, py, 40 * cam.s, px, py, 460 * cam.s);
  spill.addColorStop(0, `rgba(${gr},${gg},${gb},0.2)`); spill.addColorStop(1, `rgba(${gr},${gg},${gb},0)`);
  ctx.fillStyle = spill; ctx.fillRect(0, 0, W, H);
  if (on > 0) {
    const sx = W / 2 + (LAMP.shade[0] - cam.cx) * cam.s, sy = H / 2 + (LAMP.shade[1] + 20 - cam.cy) * cam.s;
    const lg = ctx.createRadialGradient(sx, sy, 30 * cam.s, sx, sy, 620 * cam.s);
    lg.addColorStop(0, `rgba(255,206,132,${0.26 * on})`); lg.addColorStop(1, 'rgba(255,206,132,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
  }
  ctx.globalCompositeOperation = 'soft-light';
  const warmth = ctx.createLinearGradient(W, 0, 0, H);
  warmth.addColorStop(0, `rgba(255,196,120,${0.17 * on})`); warmth.addColorStop(1, `rgba(255,170,90,${0.05 * on})`);
  ctx.fillStyle = warmth; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  const v = ctx.createRadialGradient(W / 2, H * 0.5, H * 0.3, W / 2, H * 0.5, H * 0.74);
  v.addColorStop(0, 'rgba(6,8,20,0)'); v.addColorStop(1, `rgba(6,8,20,${lerp(0.42, 0.26, on)})`);
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
}

// ---- end cards --------------------------------------------------------------
const CARD_A = [{ text: 'STOP', col: '#8b5cf6', back: '#4c1d95' }, { text: 'DOOMSCROLLING...', col: '#ec8a3c', back: '#9c4f22' }];
CARD_A.cap = 180;
const CARD_B = [
  { text: 'SCROLL PROBLEMS', col: '#ec8a3c', back: '#9c4f22' },
  { text: 'ON KORAH', col: '#8b5cf6', back: '#4c1d95' },
  { text: 'INSTEAD', col: '#ec8a3c', back: '#9c4f22' },
];
CARD_B.cap = 132;
const endPaths = {};
function buildEnd(ctx) {
  let seed = 900;
  endPaths.hills = [
    { path: cut([[-60, 1580], [200, 1500], [460, 1556], [760, 1486], [1140, 1544], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#f3c48d', z: 1.5 },
    { path: cut([[-60, 1690], [280, 1618], [600, 1678], [900, 1610], [1140, 1662], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#e8934f', z: 2 },
    { path: cut([[-60, 1804], [340, 1744], [660, 1794], [1140, 1736], [1140, 2000], [-60, 2000]], seed++, 3, 16), col: '#a8714a', z: 2.5 },
  ];
  endPaths.top = [
    { path: cut([[-60, -60], [1140, -60], [1140, 178], [820, 248], [520, 196], [220, 256], [-60, 196]], seed++, 3, 16), col: '#f1dcb8', z: 1.5 },
    { path: cut([[-60, -60], [1140, -60], [1140, 96], [760, 146], [380, 106], [-60, 136]], seed++, 3, 16), col: '#e8c290', z: 2 },
  ];
  for (const lines of [CARD_A, CARD_B]) {
    ctx.font = '100px "Luckiest Guy"';
    for (const l of lines) l.size = Math.min(lines.cap, (940 / ctx.measureText(l.text).width) * 100);
    let y = lines[0].size * 0.72;
    lines.forEach((l, i) => { if (i) y += l.size * 0.9; l.base = y; });
    lines.block = y;
  }
}

// One hand-lettered card: letters fold up off the page one at a time.
function drawLines(ctx, t, lines, t0, top, out) {
  const R = rng(77);
  let idx = 0;
  ctx.save();
  if (out > 0) { ctx.translate(W / 2, 880); ctx.scale(1, Math.max(0.02, 1 - out)); ctx.translate(-W / 2, -880); ctx.globalAlpha = 1 - out * 0.7; }
  lines.forEach((l, li) => {
    ctx.font = `${l.size}px "Luckiest Guy"`;
    const chars = [...l.text];
    const widths = chars.map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = W / 2 - total / 2;
    const y = l.base + top;
    chars.forEach((ch, ci) => {
      const ts = t0 + idx * 0.03 + li * 0.08;
      const p = spring(t - ts, 1.3, 4.8);
      const tilt = (R() - 0.5) * 0.09;
      const boil = Math.floor(t * 8) % 2 ? 0.006 : -0.006;
      idx++;
      if (t > ts) {
        ctx.save();
        ctx.translate(x + widths[ci] / 2, y);
        ctx.rotate(tilt + (t > ts + 1 ? boil * (ci % 2 ? 1 : -1) : 0));
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
  ctx.restore();
}
function drawEnd(ctx, tt, logo) {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  light.k = 1;
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#f8ecd6'); g.addColorStop(1, '#f3e0c2');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = grain(ctx); ctx.globalAlpha = 0.8; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  const u = tt - T.fade[1];
  endPaths.top.forEach((l, i) => {
    ctx.save(); ctx.translate(0, -240 * (1 - spring(u - i * 0.08, 1.2, 5)));
    paper(ctx, l.path, l.col, { z: l.z }); ctx.restore();
  });
  endPaths.hills.forEach((l, i) => {
    ctx.save(); ctx.translate(0, 320 * (1 - spring(u - 0.1 - i * 0.08, 1.2, 5)));
    paper(ctx, l.path, l.col, { z: l.z }); ctx.restore();
  });

  if (tt < T.line2) {
    drawLines(ctx, tt, CARD_A, T.line1, 950 - CARD_A.block / 2, inOut(clamp01((tt - T.swap) / 0.25)));
  } else {
    drawLines(ctx, tt, CARD_B, T.line2, 860 - CARD_B.block / 2, 0);
    if (tt > T.store) {
      const p = spring(tt - T.store, 1.3, 4.6);
      ctx.save();
      ctx.translate(W / 2, 1210); ctx.rotate(-0.02); ctx.scale(1, Math.max(0.02, p));
      paper(ctx, S.tag, '#fffaf1', { z: 2.5 });
      ctx.font = '800 40px "Plus Jakarta Sans"';
      const a = 'Now available on the ', b = 'App Store';
      const wa = ctx.measureText(a).width, wb = ctx.measureText(b).width;
      const lh = 74, lw = (lh * LOGO_BOX[2]) / LOGO_BOX[3], gap = 16;
      const x0 = -(wa + wb + gap + lw) / 2;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#4e3124'; ctx.fillText(a, x0, 66);
      ctx.fillStyle = '#7c3aed'; ctx.fillText(b, x0 + wa, 66);
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logo, ...LOGO_BOX, x0 + wa + wb + gap, 15, lw, lh);
      if (p < 1) { ctx.fillStyle = `rgba(80,40,15,${0.5 * (1 - clamp01(p))})`; ctx.fill(S.tag); }
      ctx.restore();
    }
  }
}

// ---- frame ------------------------------------------------------------------
function drawFrame(ctx, tt, assets) {
  const cam = camera(tt);
  const warm = inOut(span(tt, T.open, T.open + 0.5));
  const glow = mixHex(COLD, WARM, warm);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

  if (tt < T.fade[1]) {
    const tq = Math.floor(tt * 15) / 15;  // the sprite animates on twos
    applyCam(ctx, cam, 0.92);
    drawWall(ctx, tt);
    drawWindow(ctx, tt);
    drawCalendar(ctx, tt);
    drawPoster(ctx);

    applyCam(ctx, cam, 1);
    drawFloor(ctx);
    drawChair(ctx);
    drawBed(ctx, tt);
    drawDesk(ctx, tt);
    drawLamp(ctx, tt);

    const b = body(tq);
    if (tt >= T.bolt) drawBlanket(ctx, tt);
    const hand = student.draw(ctx, b.pose, b.hip[0], b.hip[1], P, paper, '#dcccae').hand;
    if (tt < T.bolt) drawBlanket(ctx, tt);
    const ph = phoneAt(tq, hand);
    drawLighting(ctx, tt, cam, ph, glow, assets);
  }
  if (tt >= T.fade[0]) {
    const f = inOut(span(tt, T.fade[0], T.fade[1]));
    if (tt < T.fade[1]) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = `rgba(247,234,212,${f})`;
      ctx.fillRect(0, 0, W, H);
    } else {
      drawEnd(ctx, tt, assets.logo);
    }
  }
}
const parse = (col) => (col.startsWith('rgb') ? col.match(/\d+/g).map(Number) : [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16)));

// ---- main -------------------------------------------------------------------
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
  const wav = path.join(outDir, 'doomscroll.wav');
  writeWav(wav);
  const out = path.join(outDir, 'doomscroll.mp4');
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
