// 16-bit pixel-art student, rasterised from a small bone rig each frame so the
// poses can blend while every pixel stays on the grid.
const { createCanvas, Path2D } = require('@napi-rs/canvas');
const { lerp } = require('./paper');

const SW = 76, SH = 84;      // sprite buffer
const OX = 30, OY = 78;      // hip inside the buffer
const L1 = 12, L2 = 11;      // upper arm, forearm

const OUT = [44, 27, 20];
const PAL = {
  skin: { base: [240, 190, 146], hi: [252, 216, 178], sh: [212, 146, 106] },
  skinFar: { base: [214, 152, 112], hi: [226, 170, 128], sh: [186, 124, 90] },
  hair: { base: [70, 42, 28], hi: [112, 70, 44], sh: [44, 26, 17] },
  hood: { base: [198, 98, 62], hi: [228, 132, 88], sh: [156, 70, 42] },
  hoodFar: { base: [150, 68, 42], hi: [170, 82, 52], sh: [122, 54, 34] },
};
const EYE = OUT, WHITE = [255, 250, 240], BLUSH = [236, 128, 110], MOUTH = [150, 60, 50];

function makeMask() { return new Uint8Array(SW * SH); }
function each(m, x0, y0, x1, y1, test) {
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
  x1 = Math.min(SW - 1, Math.ceil(x1)); y1 = Math.min(SH - 1, Math.ceil(y1));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (test(x + 0.5, y + 0.5)) m[y * SW + x] = 1;
}
function disc(m, cx, cy, r) { each(m, cx - r, cy - r, cx + r, cy + r, (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r); }
function ellipse(m, cx, cy, rx, ry) { each(m, cx - rx, cy - ry, cx + rx, cy + ry, (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1); }
function capsule(m, ax, ay, bx, by, ra, rb = ra) {
  const r = Math.max(ra, rb);
  each(m, Math.min(ax, bx) - r, Math.min(ay, by) - r, Math.max(ax, bx) + r, Math.max(ay, by) + r, (x, y) => {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    const rr = lerp(ra, rb, t);
    return (x - ax - dx * t) ** 2 + (y - ay - dy * t) ** 2 <= rr * rr;
  });
}
function poly(m, pts) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  each(m, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (x, y) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  });
}

const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// Fill a part: 1px outline, shade band bottom-right, highlight top-left, optional rim light on the right.
function paint(buf, m, pal, rim) {
  const g = (x, y) => x >= 0 && y >= 0 && x < SW && y < SH && m[y * SW + x];
  for (let y = 0; y < SH; y++) for (let x = 0; x < SW; x++) {
    if (!m[y * SW + x]) continue;
    let c;
    if (!g(x - 1, y) || !g(x + 1, y) || !g(x, y - 1) || !g(x, y + 1)) c = OUT;
    else if (rim && !g(x + 2, y)) c = mixc(pal.hi, rim.c, rim.a);
    else if (!g(x + 2, y + 1) || !g(x + 1, y + 2) || !g(x, y + 2)) c = pal.sh;
    else if (!g(x - 2, y) || !g(x, y - 2) || !g(x - 1, y - 2)) c = pal.hi;
    else c = pal.base;
    set(buf, x, y, c);
  }
}
function set(buf, x, y, c) {
  if (x < 0 || y < 0 || x >= SW || y >= SH) return;
  const i = (y * SW + x) * 4;
  buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255;
}

function ik(S, T, bend = 1) {
  const dx = T[0] - S[0], dy = T[1] - S[1];
  const d = Math.max(Math.abs(L1 - L2) + 0.01, Math.min(L1 + L2 - 0.01, Math.hypot(dx, dy)));
  const a = Math.acos((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d)) * bend;
  const b = Math.atan2(dy, dx);
  const E = [S[0] + Math.cos(b + a) * L1, S[1] + Math.sin(b + a) * L1];
  const ex = T[0] - E[0], ey = T[1] - E[1], el = Math.hypot(ex, ey) || 1;
  return [E, [E[0] + (ex / el) * L2, E[1] + (ey / el) * L2]];
}

function bez(a, c, b, t) {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]];
}

// Hand targets per named pose, in sprite space (hip = 0,0).
function target(name, side, head, N) {
  const far = side === 'far';
  switch (name) {
    case 'type': return far ? [27.5, -12.5] : [26, -11.5];
    case 'pad': return far ? [27.5, -12.5] : [27, -11];
    case 'desk': return [19, -10];
    case 'cheek': return [head[0] + 4, head[1] + 9.5];
    case 'relax': return [7, 2];
    case 'chest': return [N[0] + 6.5, N[1] + 6.5];
    case 'behind': return [head[0] - 8, head[1] - 3];
    default: throw new Error('pose ' + name);
  }
}
function armTarget(arm, side, head, N) {
  const A = target(arm.a, side, head, N), B = target(arm.b, side, head, N);
  const e = arm.e;
  const arc = Math.sin(Math.PI * e) * (arm.a !== arm.b ? 1 : 0);
  return [lerp(A[0], B[0], e) + arc * 5, lerp(A[1], B[1], e) - arc * 3 + (arm.bob || 0)];
}

// pose: { lean, bulge, headTilt, headDrop, lift, near, far, face, rim }
function rasterize(pose) {
  const buf = new Uint8ClampedArray(SW * SH * 4);
  const O = (p) => [p[0] + OX, p[1] + OY];
  const th = pose.lean;
  const H = [0, 0];
  const N = [Math.sin(th) * 26, -Math.cos(th) * 26 + pose.lift];
  const back = [-Math.cos(th), -Math.sin(th)];
  const mid = [(H[0] + N[0]) / 2 + back[0] * pose.bulge * 3, (H[1] + N[1]) / 2 + back[1] * pose.bulge * 3];
  const ht = th + pose.headTilt;
  const head = [N[0] + Math.sin(ht) * 11.5 + back[0] * 0.5, N[1] - Math.cos(ht) * 11.5 + pose.headDrop];
  const hr = [Math.round(head[0]), Math.round(head[1])];
  const sh = bez(H, mid, N, 0.82);
  const S = [sh[0] + 1, sh[1] + pose.lift * 0.3];
  const rim = pose.rim;

  let m;
  // far arm, behind the body
  const tf = armTarget(pose.far, 'far', [head[0] + 1, head[1]], N);
  const Sf = [S[0] + 2, S[1] - 1];
  const [Ef, Wf] = ik(Sf, tf);
  m = makeMask();
  capsule(m, ...O(Sf), ...O(Ef), 3.7, 3.4); capsule(m, ...O(Ef), ...O(Wf), 3.4, 3.1);
  paint(buf, m, PAL.hoodFar);
  m = makeMask(); disc(m, ...O([Wf[0] + (Wf[0] - Ef[0]) / L2 * 1.8, Wf[1] + (Wf[1] - Ef[1]) / L2 * 1.8]), 2.7);
  paint(buf, m, PAL.skinFar);

  // near arm pieces; the forearm goes behind the head when the hand is behind it
  const tn = armTarget(pose.near, 'near', head, N);
  const [E, W] = ik(S, tn);
  const handC = [W[0] + (W[0] - E[0]) / L2 * 1.8, W[1] + (W[1] - E[1]) / L2 * 1.8];
  const behind = (pose.near.a === 'behind' ? 1 - pose.near.e : 0) + (pose.near.b === 'behind' ? pose.near.e : 0) > 0.55;
  const drawFore = () => {
    m = makeMask(); capsule(m, ...O(E), ...O(W), 3.5, 3.2); paint(buf, m, PAL.hood, rim);
    m = makeMask(); disc(m, ...O(handC), 2.8); paint(buf, m, PAL.skin, rim);
  };
  const drawUpper = () => { m = makeMask(); capsule(m, ...O(S), ...O(E), 4, 3.6); paint(buf, m, PAL.hood, rim); };

  if (behind) drawFore();

  // hood bump behind the neck
  m = makeMask(); disc(m, ...O([N[0] + back[0] * 5.5, N[1] + back[1] * 5.5 + 2]), 5.8);
  paint(buf, m, PAL.hood);
  // torso as a swept body
  m = makeMask();
  for (let i = 0; i <= 32; i++) {
    const t = i / 32;
    const p = bez(H, mid, N, t);
    const r = t < 0.55 ? lerp(8.3, 9, t / 0.55) : lerp(9, 7.4, (t - 0.55) / 0.45);
    disc(m, ...O(p), r);
  }
  paint(buf, m, PAL.hood, rim && { c: rim.c, a: rim.a * 0.6 });
  // drawstrings
  const ds = bez(H, mid, N, 0.78);
  const fwd = [Math.cos(th), Math.sin(th)];
  const dsx = Math.round(ds[0] + fwd[0] * 6 + OX), dsy = Math.round(ds[1] + fwd[1] * 6 + OY);
  for (let k = 0; k < 4; k++) set(buf, dsx, dsy + k, PAL.hood.hi);
  set(buf, dsx, dsy + 4, [250, 236, 210]);

  // neck
  m = makeMask(); capsule(m, ...O(N), ...O([lerp(N[0], head[0], 0.6), lerp(N[1], head[1], 0.6)]), 3.2);
  paint(buf, m, PAL.skin);

  // head
  const [hx, hy] = O(hr);
  m = makeMask(); ellipse(m, hx + 0.5, hy + 0.5, 12.2, 11.4);
  paint(buf, m, PAL.skin, rim);
  // hair: everything behind and above the hairline
  m = makeMask();
  const fringe = [-5, -4, -6, -5, -4, -5, -3, -4, -5, -6, -7];
  each(m, hx - 14, hy - 15, hx + 13, hy + 9, (x, y) => {
    const dx = x - 0.5 - hx, dy = y - 0.5 - hy;
    const inHead = (dx / 13.2) ** 2 + ((dy + 0.8) / 12.4) ** 2 <= 1;
    if (!inHead) return false;
    if (dx < -1) return dy < 6 - Math.max(0, dx + 4) * 0;
    if (dx <= 1) return dy < -1;
    const line = fringe[Math.min(fringe.length - 1, Math.round(dx) - 2)];
    return dy < line;
  });
  for (const [dx, dy] of [[-6, -12], [-5, -12], [-5, -13], [-2, -13], [-1, -13], [-1, -14], [2, -12], [3, -12], [-9, -9], [-10, -8], [-11, -6], [-12, -3], [-12, -1], [-11, 3]])
    m[(hy + dy) * SW + hx + dx] = 1;
  paint(buf, m, PAL.hair, rim && { c: rim.c, a: rim.a * 0.35 });
  // ear
  m = makeMask(); ellipse(m, hx - 0.5, hy + 1.5, 2.4, 3.1);
  paint(buf, m, PAL.skin);
  set(buf, hx - 1, hy + 1, PAL.skin.sh); set(buf, hx - 1, hy + 2, PAL.skin.sh);

  face(buf, hx, hy, pose.face, rim);

  drawUpper();
  if (!behind) drawFore();

  // outline pixels are where the paper sticker border is grown from
  return { buf, head: [hx, hy] };
}

function face(buf, hx, hy, f, rim) {
  const p = (dx, dy, c) => set(buf, hx + dx + 1, hy + dy, c);
  const look = f.look || 0; // 1 = eyes down toward the keyboard
  const ey = look;
  // nose
  p(11, 1, PAL.skin.base); p(11, 2, rim ? mixc(PAL.skin.hi, rim.c, rim.a) : PAL.skin.base); p(12, 1, OUT); p(12, 2, OUT); p(11, 3, OUT); p(11, 0, OUT);
  // eye
  switch (f.eye) {
    case 'open':
      for (const [x, y] of [[5, -1], [6, -1], [5, 0], [6, 0], [5, 1], [6, 1]]) p(x, y + ey, EYE);
      p(6, -1 + ey, WHITE);
      break;
    case 'wide':
      for (const [x, y] of [[5, -2], [6, -2], [5, -1], [6, -1], [5, 0], [6, 0], [5, 1], [6, 1]]) p(x, y, EYE);
      p(6, -2, WHITE); p(7, -1, PAL.skin.base);
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
  // brow
  const brows = {
    neutral: [[4, -4], [5, -4], [6, -4], [7, -4]],
    worried: [[3, -3], [4, -3], [5, -4], [6, -4], [7, -5]],
    happy: [[4, -4], [5, -5], [6, -5], [7, -4]],
    up: [[4, -5], [5, -6], [6, -6], [7, -5]],
    focus: [[4, -4], [5, -4], [6, -3], [7, -3]],
  };
  for (const [x, y] of brows[f.brow || 'neutral']) p(x, y, PAL.hair.sh);
  if (f.bags) { p(5, 2 + ey, PAL.skin.sh); p(6, 2 + ey, PAL.skin.sh); }
  if (f.blush) { p(5, 3, BLUSH); p(6, 3, BLUSH); p(7, 3, BLUSH); }
  // mouth
  const mouths = {
    flat: [[8, 6, OUT], [9, 6, OUT], [10, 6, OUT]],
    frown: [[7, 7, OUT], [8, 6, OUT], [9, 6, OUT], [10, 6, OUT]],
    smile: [[7, 5, OUT], [8, 6, OUT], [9, 6, OUT], [10, 5, OUT]],
    grin: [[7, 5, OUT], [8, 6, OUT], [9, 6, OUT], [10, 5, OUT], [8, 5, WHITE], [9, 5, WHITE], [10, 4, OUT]],
    o: [[9, 5, OUT], [10, 5, OUT], [9, 6, MOUTH], [10, 6, OUT], [9, 7, OUT]],
  };
  for (const [x, y, c] of mouths[f.mouth || 'flat']) p(x, y, c);
}

// Draw the sprite as a paper sticker: a cream cut border with a soft shadow, pixels on top.
const sprite = createCanvas(SW, SH);
function draw(ctx, pose, x, y, P, paperFn, borderColor) {
  const { buf } = rasterize(pose);
  const sctx = sprite.getContext('2d');
  const img = sctx.createImageData(SW, SH);
  img.data.set(buf);
  sctx.putImageData(img, 0, 0);
  const x0 = x - OX * P, y0 = y - OY * P;
  const border = new Path2D();
  const R = P * 1.55;
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
}

module.exports = { draw, rasterize, SW, SH, OX, OY };
