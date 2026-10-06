// 8-bit pixel student, rasterised from a small bone rig each frame so the poses can
// blend between lying in bed, standing, walking and sitting while every pixel stays
// on the grid. Arms and legs are two-bone IK; the head can face the ceiling.
const { createCanvas, Path2D } = require('@napi-rs/canvas');
const { lerp } = require('./paper');

const SW = 112, SH = 112;    // sprite buffer
const OX = 56, OY = 64;      // hip inside the buffer
const A1 = 12, A2 = 11;      // upper arm, forearm
const G1 = 15, G2 = 14;      // thigh, shin

const OUT = [40, 26, 22];
const PAL = {
  skin: { base: [240, 190, 146], hi: [252, 216, 178], sh: [212, 146, 106] },
  skinFar: { base: [214, 152, 112], hi: [226, 170, 128], sh: [186, 124, 90] },
  hair: { base: [70, 42, 28], hi: [112, 70, 44], sh: [44, 26, 17] },
  top: { base: [150, 152, 160], hi: [184, 186, 194], sh: [110, 112, 122] },
  topFar: { base: [112, 114, 124], hi: [132, 134, 144], sh: [86, 88, 96] },
  pants: { base: [166, 48, 52], hi: [200, 74, 76], sh: [118, 30, 36] },
  pantsDark: { base: [42, 36, 44], hi: [66, 58, 68], sh: [26, 22, 28] },
  pantsFar: { base: [124, 36, 40], hi: [148, 52, 56], sh: [92, 24, 28] },
  pantsFarDark: { base: [30, 26, 32], hi: [48, 42, 50], sh: [20, 18, 22] },
};
// the pyjama stripe: black bands running diagonally across the red
const STRIPE = (x, y) => (x + y) % 11 < 4;
const EYE = OUT, WHITE = [255, 250, 240], BLUSH = [236, 128, 110], MOUTH = [150, 60, 50];

function makeMask() { return new Uint8Array(SW * SH); }
function each(m, x0, y0, x1, y1, test) {
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(SW - 1, Math.ceil(x1)); y1 = Math.min(SH - 1, Math.ceil(y1));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (test(x + 0.5, y + 0.5)) m[y * SW + x] = 1;
}
function disc(m, cx, cy, r) { each(m, cx - r, cy - r, cx + r, cy + r, (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r); }
function capsule(m, ax, ay, bx, by, ra, rb = ra) {
  const r = Math.max(ra, rb);
  each(m, Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r, (x, y) => {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const rr = lerp(ra, rb, t);
    return (x - ax - dx * t) ** 2 + (y - ay - dy * t) ** 2 <= rr * rr;
  });
}

// Head pieces are described in head-local pixels with the face pointing +x, then
// blitted through a quarter turn when the student is lying on their back.
function headPart(m, hx, hy, R, up, test) {
  for (let ly = -R; ly <= R; ly++) for (let lx = -R; lx <= R; lx++) {
    if (!test(lx, ly)) continue;
    const x = hx + (up ? ly : lx), y = hy + (up ? -lx : ly);
    if (x >= 0 && y >= 0 && x < SW && y < SH) m[y * SW + x] = 1;
  }
}

const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// Fill a part: 1px outline, shade band away from the light, highlight toward it,
// optional rim light on the side the phone or lamp is on.
// `alt` swaps in a second palette wherever its test passes, which is how the
// pyjama pants get their black stripes without a second mask.
function paint(buf, m, pal, rim, alt) {
  const g = (x, y) => x >= 0 && y >= 0 && x < SW && y < SH && m[y * SW + x];
  const [rx, ry] = rim ? rim.dir : [1, 0];
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (!m[y * SW + x]) continue;
    const pp = alt && alt.test(x, y) ? alt.pal : pal;
    let c;
    if (!g(x - 1, y) || !g(x + 1, y) || !g(x, y - 1) || !g(x, y + 1)) c = OUT;
    else if (rim && !g(x + rx * 2, y + ry * 2)) c = mixc(pp.hi, rim.c, rim.a);
    else if (!g(x + 2, y + 1) || !g(x + 1, y + 2) || !g(x, y + 2)) c = pp.sh;
    else if (!g(x - 2, y) || !g(x, y - 2) || !g(x - 1, y - 2)) c = pp.hi;
    else c = pp.base;
    set(buf, x, y, c);
  }
}
function set(buf, x, y, c) {
  if (x < 0 || y < 0 || x >= SW || y >= SH) return;
  const i = (y * SW + x) * 4;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
}

function ik(S, T, l1, l2, bend = 1) {
  const dx = T[0] - S[0], dy = T[1] - S[1];
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)));
  const a = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)) * bend;
  const b = Math.atan2(dy, dx);
  const E = [S[0] + Math.cos(b + a) * l1, S[1] + Math.sin(b + a) * l1];
  const ex = T[0] - E[0], ey = T[1] - E[1], el = Math.hypot(ex, ey) || 1;
  return [E, [E[0] + (ex / el) * l2, E[1] + (ey / el) * l2]];
}

function bez(a, c, b, t) {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

// pose: { lean, bulge, headTilt, headDrop, lift, headUp, near, far, bendNear, bendFar,
//         footNear, footFar, kneeNear, kneeFar, face, rim }
function rasterize(pose) {
  const buf = new Uint8ClampedArray(SW * SH * 4);
  const O = (p) => [p[0] + OX, p[1] + OY];
  const th = pose.lean;
  const H = [0, pose.lift];
  const N = [H[0] + Math.sin(th) * 26, H[1] - Math.cos(th) * 26];
  const back = [-Math.cos(th), -Math.sin(th)];
  const mid = [(H[0] + N[0]) / 2 + back[0] * pose.bulge * 3, (H[1] + N[1]) / 2 + back[1] * pose.bulge * 3];
  const ht = th + pose.headTilt;
  const head = [N[0] + Math.sin(ht) * 11.5 + back[0] * 0.5, N[1] - Math.cos(ht) * 11.5 + pose.headDrop];
  const hr = [Math.round(head[0]), Math.round(head[1])];
  const sh = bez(H, mid, N, 0.82);
  const S = [sh[0] + 1, sh[1]];
  const rim = pose.rim;
  const up = !!pose.headUp;

  let m;
  const leg = (tgt, bend, far, hipDx) => {
    const P0 = [H[0] + hipDx, H[1] + 1];
    const [K, F] = ik(P0, [tgt[0], tgt[1]], G1, G2, bend);
    m = makeMask();
    capsule(m, ...O(P0), ...O(K), 5, 4.2); capsule(m, ...O(K), ...O(F), 4.1, 3.3);
    paint(buf, m, far ? PAL.pantsFar : PAL.pants, rim, { pal: far ? PAL.pantsFarDark : PAL.pantsDark, test: STRIPE });
    // bare foot, flat on the ground and pointing the way they face
    m = makeMask();
    capsule(m, ...O([F[0] - 1.5, F[1] + 1.4]), ...O([F[0] + 5, F[1] + 1.4]), 2.7, 2.3);
    paint(buf, m, far ? PAL.skinFar : PAL.skin, rim);
  };

  // far leg and far arm sit behind the body
  leg(pose.footFar, pose.kneeFar, true, -1.5);
  const Sf = [S[0] + 2, S[1] - 1];
  const [Ef, Wf] = ik(Sf, pose.far, A1, A2, pose.bendFar ?? 1);
  m = makeMask();
  capsule(m, ...O(Sf), ...O(Ef), 3.7, 3.4); capsule(m, ...O(Ef), ...O(Wf), 3.4, 3.1);
  paint(buf, m, PAL.topFar);
  m = makeMask(); disc(m, ...O([Wf[0] + (Wf[0] - Ef[0]) / A2 * 1.8, Wf[1] + (Wf[1] - Ef[1]) / A2 * 1.8]), 2.7);
  paint(buf, m, PAL.skinFar);

  // torso as a swept body
  m = makeMask();
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const p = bez(H, mid, N, t);
    const r = t < 0.55 ? lerp(8.3, 9, t / 0.55) : lerp(9, 7.4, (t - 0.55) / 0.45);
    disc(m, ...O(p), r);
  }
  paint(buf, m, PAL.top, rim && { ...rim, a: rim.a * 0.6 });
  // near leg over the torso
  leg(pose.footNear, pose.kneeNear, false, 1.5);

  // neck
  m = makeMask(); capsule(m, ...O(N), ...O([lerp(N[0], head[0], 0.6), lerp(N[1], head[1], 0.6)]), 3.2);
  paint(buf, m, PAL.skin);

  // head
  const [hx, hy] = O(hr);
  m = makeMask();
  headPart(m, hx, hy, 14, up, (lx, ly) => (lx / 12.2) ** 2 + (ly / 11.4) ** 2 <= 1);
  paint(buf, m, PAL.skin, rim);
  // hair: everything behind and above the hairline
  m = makeMask();
  const fringe = [-5, -4, -6, -5, -4, -5, -3, -4, -5, -6, -7];
  const tufts = [[-6, -12], [-5, -12], [-5, -13], [-2, -13], [-1, -13], [-1, -14], [2, -12], [3, -12], [-9, -9], [-10, -8], [-11, -6], [-12, -3], [-12, -1], [-11, 3]];
  headPart(m, hx, hy, 15, up, (lx, ly) => {
    if (tufts.some(([a, b]) => a === lx && b === ly)) return true;
    if ((lx / 13.2) ** 2 + ((ly + 0.8) / 12.4) ** 2 > 1) return false;
    if (lx < -1) return ly < 6;
    if (lx <= 1) return ly < -1;
    return ly < fringe[Math.min(fringe.length - 1, Math.round(lx) - 2)];
  });
  paint(buf, m, PAL.hair, rim && { ...rim, a: rim.a * 0.35 });
  // ear
  m = makeMask();
  headPart(m, hx, hy, 5, up, (lx, ly) => ((lx + 0.5) / 2.4) ** 2 + ((ly - 1.5) / 3.1) ** 2 <= 1);
  paint(buf, m, PAL.skin);

  face(buf, hx, hy, up, pose.face, rim);

  // near arm last so the hand reads in front of everything
  const [E, W] = ik(S, pose.near, A1, A2, pose.bendNear ?? 1);
  m = makeMask(); capsule(m, ...O(S), ...O(E), 4, 3.6); paint(buf, m, PAL.top, rim);
  m = makeMask(); capsule(m, ...O(E), ...O(W), 3.5, 3.2); paint(buf, m, PAL.top, rim);
  const handC = [W[0] + (W[0] - E[0]) / A2 * 1.8, W[1] + (W[1] - E[1]) / A2 * 1.8];
  m = makeMask(); disc(m, ...O(handC), 2.9); paint(buf, m, PAL.skin, rim);

  return { buf, head: [hx, hy], hand: O(handC) };
}

function face(buf, hx, hy, up, f, rim) {
  const p = (dx, dy, c) => set(buf, hx + (up ? dy : dx + 1), hy + (up ? -(dx + 1) : dy), c);
  const ey = f.look || 0; // 1 = eyes rolled toward the screen
  // nose
  p(11, 1, PAL.skin.base); p(11, 2, rim ? mixc(PAL.skin.hi, rim.c, rim.a) : PAL.skin.base);
  p(12, 1, OUT); p(12, 2, OUT); p(11, 3, OUT); p(11, 0, OUT);
  switch (f.eye) {
    case 'open':
      for (const [x, y] of [[5, -1], [6, -1], [5, 0], [6, 0], [5, 1], [6, 1]]) p(x, y + ey, EYE);
      p(6, -1 + ey, WHITE);
      break;
    case 'wide':
      for (const [x, y] of [[5, -3], [6, -3], [5, -2], [6, -2], [5, -1], [6, -1], [5, 0], [6, 0], [5, 1], [6, 1]]) p(x, y, EYE);
      p(6, -2, WHITE); p(6, 1, WHITE); p(7, -1, PAL.skin.base);
      break;
    case 'half':
      for (const [x, y] of [[4, 0], [5, 0], [6, 0], [7, 0]]) p(x, y + ey, EYE);
      p(5, 1 + ey, EYE); p(6, 1 + ey, EYE);
      break;
    case 'closed':
      for (const [x, y] of [[4, 0], [5, 1], [6, 1], [7, 0]]) p(x, y, EYE);
      break;
    case 'happy':
      for (const [x, y] of [[4, 1], [5, 0], [6, 0], [7, 1]]) p(x, y, EYE);
      break;
  }
  const brows = {
    neutral: [[4, -4], [5, -4], [6, -4], [7, -4]],
    droop: [[3, -2], [4, -3], [5, -3], [6, -4], [7, -4]],
    worried: [[3, -3], [4, -3], [5, -4], [6, -4], [7, -5]],
    happy: [[4, -4], [5, -5], [6, -5], [7, -4]],
    up: [[4, -6], [5, -7], [6, -7], [7, -6]],
    focus: [[4, -4], [5, -4], [6, -3], [7, -3]],
  };
  for (const [x, y] of brows[f.brow || 'neutral']) p(x, y, PAL.hair.sh);
  if (f.bags) { p(5, 2 + ey, PAL.skin.sh); p(6, 2 + ey, PAL.skin.sh); p(4, 2 + ey, PAL.skin.sh); }
  if (f.blush) { p(5, 3, BLUSH); p(6, 3, BLUSH); p(7, 3, BLUSH); }
  const mouths = {
    flat: [[8, 6, OUT], [9, 6, OUT], [10, 6, OUT]],
    slack: [[8, 6, OUT], [9, 6, MOUTH], [10, 6, OUT], [9, 7, OUT]],
    frown: [[7, 7, OUT], [8, 6, OUT], [9, 6, OUT], [10, 6, OUT]],
    smile: [[7, 5, OUT], [8, 6, OUT], [9, 6, OUT], [10, 5, OUT]],
    grin: [[7, 5, OUT], [8, 6, OUT], [9, 6, OUT], [10, 5, OUT], [8, 5, WHITE], [9, 5, WHITE], [10, 4, OUT]],
    o: [[9, 5, OUT], [10, 5, OUT], [9, 6, MOUTH], [10, 6, OUT], [9, 7, OUT]],
  };
  for (const [x, y, c] of mouths[f.mouth || 'flat']) p(x, y, c);
}

// Draw the sprite as a paper sticker: a cut border with a soft shadow, pixels on top.
const sprite = createCanvas(SW, SH);
function draw(ctx, pose, x, y, P, paperFn, borderColor) {
  const { buf, hand, head } = rasterize(pose);
  const sctx = sprite.getContext('2d');
  sctx.clearRect(0, 0, SW, SH);
  const img = sctx.createImageData(SW, SH);
  img.data.set(buf);
  sctx.putImageData(img, 0, 0);
  const x0 = x - OX * P, y0 = y - OY * P;
  const border = new Path2D();
  const R = P * 1.25;
  for (let py = 0; py < SH; py++) for (let px = 0; px < SW; px++) {
    if (!buf[(py * SW + px) * 4 + 3]) continue;
    const edge = px === 0 || py === 0 || !buf[(py * SW + px - 1) * 4 + 3] || !buf[(py * SW + px + 1) * 4 + 3] || !buf[((py - 1) * SW + px) * 4 + 3] || !buf[((py + 1) * SW + px) * 4 + 3];
    if (!edge) continue;
    const cx = x0 + (px + 0.5) * P, cy = y0 + (py + 0.5) * P;
    border.moveTo(cx + R, cy);
    border.arc(cx, cy, R, 0, Math.PI * 2);
  }
  paperFn(ctx, border, borderColor, { z: 2, edge: false, grain: 0.6 });
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, x0, y0, SW * P, SH * P);
  ctx.restore();
  return { hand: [x0 + hand[0] * P, y0 + hand[1] * P], head: [x0 + head[0] * P, y0 + head[1] * P] };
}

module.exports = { draw, rasterize, SW, SH, OX, OY };
