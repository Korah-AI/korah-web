// The paper-cut Amazon clearing: misty canopy layers, buttress trees, vines, big leaves,
// the toucan, butterflies, the score sign and ground props.
// World units are output pixels at zoom 1 (1080 x 1920).
const { Path2D } = require('@napi-rs/canvas');
const {
  rng, clamp01, lerp, span, spring, mixHex, rectPts, rrectPts, ellipsePts, cut, paper, light,
} = require('../korah-not-cooked/paper');
const { T, score, SCORE_FROM, SCORE_TO } = require('./timeline');

const BIRD = { x: 720, y: 557 };
const TAG = { x: 395, y: 574 };
const LOG = { x0: 10, x1: 560, top: 1285, bot: 1420 };
const LAP_GLOW = { x: 725, y: 1285 };   // where the bloom spreads from

// ---- shape builders ------------------------------------------------------------
// Scalloped edge from x0 to x1 around y; dir -1 bumps up (crowns), +1 bumps down (canopy).
function bumpEdge(x0, x1, y, amp, w, seed, dir) {
  const r = rng(seed);
  const pts = [];
  let x = x0;
  while (x < x1) {
    const bw = w * (0.7 + 0.6 * r()), bh = amp * (0.55 + 0.8 * r()), yo = (r() - 0.5) * amp * 0.5;
    for (let i = 0; i < 6; i++) pts.push([x + (bw * i) / 6, y + yo + dir * bh * Math.sin((Math.PI * i) / 6)]);
    x += bw;
  }
  pts.push([x1, y]);
  return pts;
}
// Cloud-like blob: an ellipse with n scallops.
function blob(cx, cy, rx, ry, n, amp, seed) {
  const ph = rng(seed)() * Math.PI;
  const pts = [];
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * Math.PI * 2;
    const k = 1 - amp + amp * Math.abs(Math.sin((n * a) / 2 + ph));
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return pts;
}
// Palm or fern frond from its base (0,0) going up, leaflets on both sides.
function frond(len, curl, width, n) {
  const c = [], nrm = [];
  let x = 0, y = 0, a = -Math.PI / 2;
  for (let i = 0; i <= 60; i++) {
    c.push([x, y]); nrm.push([-Math.sin(a), Math.cos(a)]);
    a += curl / 60; x += Math.cos(a) * (len / 60); y += Math.sin(a) * (len / 60);
  }
  const at = (s) => Math.min(60, Math.round(s * 60));
  const wid = (s) => width * Math.sin(Math.PI * Math.min(1, 0.12 + s)) * (1 - s * 0.5);
  const left = [], right = [];
  for (let i = 0; i < n; i++) {
    const s0 = i / n, s1 = (i + 0.6) / n;
    const p0 = c[at(s0)], n0 = nrm[at(s0)], p1 = c[at(s1)], n1 = nrm[at(s1)];
    left.push([p0[0] + n0[0] * 3, p0[1] + n0[1] * 3], [p1[0] + n1[0] * wid(s1), p1[1] + n1[1] * wid(s1)]);
    right.push([p0[0] - n0[0] * 3, p0[1] - n0[1] * 3], [p1[0] - n1[0] * wid(s1), p1[1] - n1[1] * wid(s1)]);
  }
  return [...left, c[60], ...right.reverse()];
}
// Big tropical leaf, base at (0,0), tip at (0,-L). Slits cut in from the edge:
// many deep ones read as monstera, a few ragged ones as banana.
function bigLeaf(L, W, slits, depth, seed) {
  const r = rng(seed);
  const hw = (s) => W * Math.pow(Math.sin(Math.PI * Math.min(1, 0.04 + s * 1.02)), 0.75) * (1 - s * 0.3);
  const side = (sgn) => {
    const pts = [];
    const cuts = [...Array(slits)].map((_, k) => 0.16 + ((k + 0.5 + (r() - 0.5) * 0.4) / slits) * 0.72);
    for (let i = 0; i <= 40; i++) {
      const s = i / 40;
      pts.push([sgn * hw(s), -L * s]);
      const k = cuts.findIndex((cs) => cs > s && cs <= s + 1 / 40);
      if (k >= 0) {
        const cs = cuts[k], d = depth * (0.8 + r() * 0.4);
        pts.push([sgn * hw(cs) * (1 - d), -L * (cs + 0.035)], [sgn * hw(cs + 0.012), -L * (cs + 0.012)]);
      }
    }
    return pts;
  };
  return [[0, 0], ...side(1), ...side(-1).reverse()];
}
function tuft(x, y, n, h, seed) {
  const r = rng(seed);
  const pts = [[x - n * 7, y]];
  for (let i = 0; i < n; i++) {
    const bx = x - n * 7 + i * 14 + 7;
    pts.push([bx - 4, y], [bx + (r() - 0.5) * 22, y - h * (0.6 + 0.5 * r())], [bx + 4, y]);
  }
  pts.push([x + n * 7, y]);
  return pts;
}
const leafPts = (l, w) => [[0, 0], [w * 0.8, -l * 0.3], [w * 0.5, -l * 0.75], [0, -l], [-w * 0.5, -l * 0.75], [-w * 0.8, -l * 0.3]];
// Heliconia: alternating red bracts with yellow tips up a stem
function heliconia(n, seed) {
  const r = rng(seed);
  return [...Array(n)].map((_, k) => {
    const s = k % 2 ? 1 : -1, y = -30 - k * 34, l = 58 - k * 4;
    return { s, pts: [[0, y + 12], [s * l, y - 10 - r() * 6], [s * l * 0.35, y - 16], [0, y - 4]], tip: [s * l, y - 10] };
  });
}
// Bromeliad rosette: spiky leaves fanning up from a base
const bromeliad = (n, l) => [...Array(n)].map((_, k) => { const a = -Math.PI / 2 + (k / (n - 1) - 0.5) * 2.4; return [[-6, 0], [Math.cos(a) * l, Math.sin(a) * l * (1 - Math.abs(k / (n - 1) - 0.5) * 0.8)], [6, 0]]; });
function star4(r) {
  const p = new Path2D();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.22 : r;
    i ? p.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : p.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  p.closePath();
  return p;
}

const S = {};
function build() {
  let seed = 100;
  const c = (pts, amp = 1.3, step = 16) => cut(pts, seed++, amp, step);

  // far layer (depth 0.55): misty crowns, emergent trees, palms
  S.farCrowns = [
    { path: c([[-500, 1700], ...bumpEdge(-500, 1600, 640, 120, 230, seed++, -1), [1600, 1700]], 2, 16), col: '#a6d68a' },
    { path: c([[-500, 1700], ...bumpEdge(-500, 1600, 800, 95, 180, seed++, -1), [1600, 1700]], 2, 16), col: '#86c56c' },
  ];
  S.emergents = [[120, 360], [880, 300]].map(([x, y]) => ({
    trunk: c([[x - 9, y], [x + 9, y], [x + 14, 900], [x - 14, 900]], 1, 20),
    crown: c(blob(x, y - 20, 170, 58, 9, 0.2, seed++), 1.6, 14),
  }));
  S.farPalms = [[430, 540, -0.15], [660, 610, 0.12], [-60, 570, 0.08], [1130, 530, -0.1]].map(([x, y, lean]) => ({
    x, y, trunk: c([[x - 6, y], [x + 6, y], [x + 10 - lean * 200, 1000], [x - 10 - lean * 200, 1000]], 0.8, 20),
    fronds: [-1.55, -0.95, -0.4, 0.3, 0.9, 1.5].map((a) => ({ a, path: c(frond(170, Math.sign(a) * (Math.abs(a) < 0.5 ? 0.7 : 1.5), 15, 18), 0.8, 8) })),
  }));
  S.midCrowns = c([[-500, 1700], ...bumpEdge(-500, 1600, 960, 80, 150, seed++, -1), [1600, 1700]], 2, 14);

  // canopy overhang (depth 0.78): dark mass, hanging leaves, vines
  S.canopy = [
    { path: c([[-500, -500], [1600, -500], ...bumpEdge(-500, 1600, 250, 90, 170, seed++, 1).reverse()], 2, 14), col: '#23803a' },
    { path: c([[-500, -500], [1600, -500], ...bumpEdge(-500, 1600, 150, 70, 130, seed++, 1).reverse()], 2, 14), col: '#16662e' },
  ];
  S.hanging = [[-40, 180, 2.6, 'm'], [200, 230, 3.3, 'b'], [470, 200, 2.9, 'm'], [690, 250, 3.5, 'b'], [960, 170, 3.1, 'm'], [1130, 220, 2.8, 'b']].map(([x, y, a, kind], i) => ({
    x, y, a, path: c(kind === 'm' ? bigLeaf(230, 105, 5, 0.55, 40 + i) : bigLeaf(300, 62, 4, 0.9, 40 + i), 1, 10), col: i % 2 ? '#2a9443' : '#3aa84a',
  }));
  S.vines = [[90, 150, 520], [300, 190, 380], [585, 160, 640], [800, 210, 300], [1020, 160, 560]].map(([x, y, len], i) => {
    const r = rng(500 + i);
    return { x, y, len, ph: r() * 6, leaves: [...Array(Math.floor(len / 44))].map((_, k) => ({ s: (k + 0.5) / Math.floor(len / 44), side: k % 2 ? 1 : -1, sc: 0.5 + r() * 0.5 })) };
  });
  S.vineLeaf = c(leafPts(34, 20), 0.6, 6);

  // mid layer (depth 0.88): buttress trees, the toucan's branch, far ground, river
  S.trunkL = c([[-220, -400], [40, -400], [46, 900], [70, 1020], [130, 1110], [-240, 1110]], 1.4, 18);
  S.trunkR = c([[930, -400], [1080, -400], [1080, 880], [1120, 1010], [1190, 1105], [850, 1105], [905, 1010], [925, 880]], 1.4, 18);
  S.buttress = [[66, 1020, 108, 1105], [920, 1000, 880, 1100], [1070, 1000, 1150, 1100], [995, 980, 1000, 1100]];
  S.bark = [];
  const br = rng(7);
  for (const [x0, x1] of [[-200, 36], [940, 1070]])
    for (let k = 0; k < 7; k++) {
      const x = lerp(x0 + 12, x1 - 12, br()), y = -100 + br() * 950, l = 80 + br() * 160;
      S.bark.push([x, y, x + (br() - 0.5) * 16, y + l / 2, x + (br() - 0.5) * 10, y + l]);
    }
  S.trunkBromeliad = { x: 1000, y: 760, leaves: bromeliad(7, 60).map((p) => c(p, 0.6, 8)) };
  const top = (x) => 540 + (980 - x) * 0.03 + 10 * Math.sin(x / 90);
  const th = (x) => 12 + (32 * (x - 130)) / 850;
  const bt = [], bb = [];
  for (let x = 130; x <= 990; x += 20) { bt.push([x, top(x)]); bb.push([x, top(x) + th(x)]); }
  S.branch = c([[112, top(130) + 6], ...bt, ...bb.reverse()], 1.2, 14);
  S.branchVines = [[190, top(190) + 14, 150], [520, top(520) + 20, 110], [870, top(870) + 36, 190]];
  S.branchLeaves = [[150, top(150) - 6, 0.9], [520, top(520) - 4, -0.5], [900, top(900) - 20, 0.4]]
    .map(([x, y, a], i) => ({ x, y, a, path: c(bigLeaf(120, 50, 3, 0.5, 70 + i), 1, 8) }));
  S.farGround = c([[-400, 1110], ...bumpEdge(-400, 1500, 1085, 12, 200, seed++, -1), [1500, 2400], [-400, 2400]], 1.6, 20);
  const sy = (x) => 1180 + 24 * Math.sin(x / 230 + 0.6);
  const sw = (x) => 34 + 12 * Math.sin(x / 140);
  const st = [], sb = [];
  for (let x = -400; x <= 1500; x += 30) { st.push([x, sy(x) - sw(x) / 2]); sb.push([x, sy(x) + sw(x) / 2]); }
  S.bank = c([...st.map(([x, y]) => [x, y - 8]), ...sb.map(([x, y]) => [x, y + 12]).reverse()], 1.5, 16);
  S.stream = c([...st, ...sb.reverse()], 1.2, 16);
  S.sy = sy; S.sw = sw;

  // near ground (depth 1)
  S.ground = c([[-400, 1262], ...bumpEdge(-400, 1500, 1250, 10, 160, seed++, -1), [1500, 2400], [-400, 2400]], 1.6, 20);
  S.patches = [[140, 1560, 220, 40, '#3f8a33'], [760, 1600, 260, 46, '#3f8a33'], [480, 1480, 300, 42, '#62b045'], [940, 1480, 150, 30, '#62b045']]
    .map(([x, y, rx, ry, col]) => ({ path: c(ellipsePts(x, y, rx, ry, 30), 2, 16), col }));
  S.litter = [...Array(18)].map((_, i) => { const r = rng(1200 + i); return { x: r() * 1080, y: 1300 + r() * 520, a: r() * 6, s: 0.5 + r() * 0.5, col: ['#d98a2b', '#b5602a', '#e6ad3a'][i % 3] }; });
  S.groundPlants = [[250, 1275, -0.3], [640, 1265, 0.35], [40, 1290, 0.15]].map(([x, y, a], i) => ({ x, y, a, path: c(bigLeaf(110, 60, 0, 0, 80 + i), 1, 8) }));
  S.tufts = [[70, 1450], [330, 1440], [610, 1500], [240, 1600], [520, 1650], [960, 1540], [700, 1720], [120, 1760]]
    .map(([x, y], i) => c(tuft(x, y, 3 + (i % 3), 38, 300 + i), 1, 8));
  S.rocks = [[590, 1455, 38, 24], [60, 1500, 30, 20]].map(([x, y, rx, ry]) => ({ x, y, path: c(ellipsePts(x, y, rx, ry, 18, Math.PI, Math.PI * 2).concat([[x + rx, y + 4], [x - rx, y + 4]]), 1.5, 10) }));
  S.mushrooms = [[40, 1432, 1, '#f2a623'], [70, 1440, 0.7, '#f2a623'], [980, 1610, 1.1, '#e8502f'], [1010, 1616, 0.75, '#f2a623']]
    .map(([x, y, s, col]) => ({ x, y, s, col, cap: c(ellipsePts(0, -38, 30, 22, 20, Math.PI, Math.PI * 2).concat([[30, -34], [-30, -34]]), 1, 8), stem: c(rrectPts(-9, -38, 18, 40, 7), 0.8, 8) }));
  S.pages = [[130, 1475, -0.5], [270, 1535, 0.35], [640, 1600, 0.18], [470, 1545, -0.2], [880, 1545, 0.5], [60, 1640, 0.2], [380, 1700, -0.12], [810, 1700, 0.3], [200, 1780, -0.35], [1000, 1760, 0.1]]
    .map(([x, y, rot], i) => ({ x, y, rot, i, path: c(rectPts(-52, -66, 104, 132), 1.3, 14) }));

  // log
  S.log = c(rrectPts(LOG.x0, LOG.top, LOG.x1 - LOG.x0, LOG.bot - LOG.top, 55), 1.4, 18);
  S.logEnd = c(ellipsePts(LOG.x1, (LOG.top + LOG.bot) / 2, 40, 67, 30), 1.2, 10);
  S.logBark = [];
  const lb = rng(8);
  for (let k = 0; k < 9; k++) { const y = LOG.top + 18 + lb() * 110, x = 40 + lb() * 420; S.logBark.push([x, y, x + 60, y + (lb() - 0.5) * 8, x + 120 + lb() * 60, y + (lb() - 0.5) * 6]); }
  S.moss = [c(blob(110, 1412, 90, 20, 7, 0.3, 41), 1.2, 10), c(blob(330, 1418, 70, 16, 6, 0.3, 42), 1.2, 10), c(blob(60, 1300, 60, 22, 6, 0.3, 43), 1.2, 10)];
  S.logBromeliad = bromeliad(7, 46).map((p) => c(p, 0.6, 8));

  // underbrush the friend hides behind (depth 1)
  S.bushBack = c(blob(930, 1250, 230, 175, 8, 0.12, 51), 1.5, 14);
  S.bushLeaves = [[800, 1330, -0.7, 'm'], [1070, 1300, 0.5, 'm'], [960, 1260, 0.05, 'b'], [1150, 1350, 0.9, 'b']]
    .map(([x, y, a, kind], i) => ({ x, y, a, path: c(kind === 'm' ? bigLeaf(210, 95, 5, 0.55, 90 + i) : bigLeaf(260, 58, 3, 0.9, 90 + i), 1, 10), col: i % 2 ? '#2a9443' : '#3bab4b' }));
  S.bushFront = [[725, 1475, 150, 72], [905, 1445, 185, 110], [1110, 1400, 210, 160]]
    .map(([x, y, rx, ry], i) => ({ path: c(blob(x, y, rx, ry, 7, 0.14, 60 + i), 1.4, 12), col: ['#3c9c42', '#2f8c3b', '#257a34'][i] }));
  S.bushFrontLeaves = [[1075, 1575, -0.15], [960, 1590, 0.4]].map(([x, y, a], i) => ({ x, y, a, path: c(bigLeaf(230, 105, 5, 0.55, 130 + i), 1, 10) }));
  S.bushFronds = [[640, 1470, -1.0, 170], [1010, 1380, 0.3, 200], [820, 1400, -0.25, 120]].map(([x, y, a, l]) => ({ x, y, a, path: c(frond(l, 0.9, 20, 9), 0.8, 8) }));
  S.helico = { x: 1000, y: 1390, bracts: heliconia(6, 95).map((b) => ({ ...b, path: c(b.pts, 0.6, 8) })) };

  // foreground (depth 1.2): big leaves in the bottom corners
  S.fgGround = c([[-400, 1690], ...bumpEdge(-400, 1500, 1680, 18, 90, seed++, -1), [1500, 2500], [-400, 2500]], 1.6, 16);
  S.fgLeaves = [[-40, 1990, -0.55, 'm', 560], [150, 2010, -0.15, 'b', 520], [-80, 2000, -1.1, 'b', 480], [1100, 1990, 0.55, 'm', 540], [930, 2010, 0.2, 'b', 480], [1160, 2000, 1.05, 'b', 460]]
    .map(([x, y, a, kind, l], i) => ({ x, y, a, path: c(kind === 'm' ? bigLeaf(l, l * 0.46, 6, 0.55, 110 + i) : bigLeaf(l, l * 0.2, 4, 0.9, 110 + i), 1, 12), col: i % 2 ? '#1f7a34' : '#176a2c' }));
  S.overhang = c(frond(560, 0.7, 70, 16), 1, 10);

  // keel-billed toucan, facing left; origin at its feet on the branch
  S.bird = {
    tail: c([[8, -44], [30, -48], [44, 52], [26, 58]], 1, 10),
    body: c(ellipsePts(8, -62, 34, 50, 30), 1.2, 10),
    wing: c([[20, -102], [42, -72], [38, -22], [18, -12], [8, -60]], 1, 10),
    bib: c(ellipsePts(-12, -92, 21, 27, 24), 1, 8),
    band: c(ellipsePts(-6, -66, 18, 6, 16), 0.6, 6),
    vent: c(ellipsePts(24, -20, 12, 8, 14), 0.6, 6),
    head: c(ellipsePts(-4, -112, 27, 25, 26), 1.2, 10),
    patch: c(ellipsePts(-14, -116, 12, 10, 18), 0.6, 6),
    upper: c([[-26, -128], [-60, -134], [-98, -126], [-124, -108], [-118, -102], [-70, -112], [-26, -108]], 0.8, 10),
    lower: c([[-26, -108], [-70, -110], [-116, -100], [-104, -94], [-66, -96], [-26, -98]], 0.8, 10),
    feet: [-6, 12].map((x) => c(ellipsePts(x, 2, 9, 5, 12), 0.6, 6)),
  };
  S.orchids = [[975, 700, 0.9], [1010, 730, 0.7], [30, 820, 0.8]].map(([x, y, s]) => ({ x, y, s }));
  S.orchidPetal = c(ellipsePts(0, -14, 8, 14, 12), 0.6, 6);
  S.wingUp = c([[0, 0], [-8, -30], [-34, -40], [-44, -24], [-30, -6]], 0.8, 8);
  S.wingDown = c([[0, 2], [-26, 6], [-34, 22], [-16, 30], [-4, 16]], 0.8, 8);

  // score sign
  S.tag = c(rrectPts(-195, 0, 390, 92, 16), 1.3, 16);
  S.plusPill = c(rrectPts(-52, -20, 104, 40, 20), 1, 10);

  // tropical flowers that bloom out from the Mac, delay by distance
  S.flowers = [[600, 1470], [520, 1560], [700, 1520], [380, 1500], [860, 1600], [250, 1650], [960, 1470], [150, 1520], [640, 1700], [440, 1760], [1030, 1690], [60, 1590], [300, 1340], [180, 1390], [800, 1395]]
    .map(([x, y], i) => ({ x, y, d: Math.hypot(x - LAP_GLOW.x, y - LAP_GLOW.y), col: ['#fff4dc', '#ffd23f', '#ff7a2a', '#ff4f8b'][i % 4], s: 0.8 + (i % 3) * 0.15, petals: c(ellipsePts(0, -16, 10, 16, 14), 0.6, 6) }));

  S.leaf = c(leafPts(40, 22), 0.8, 8);
  S.sparkle = star4(26);
}

// ---- drawing --------------------------------------------------------------------
function drawSky(ctx) {
  const g = ctx.createLinearGradient(0, -200, 0, 1300);
  g.addColorStop(0, '#f6e39c'); g.addColorStop(1, '#fbf0c8');
  ctx.fillStyle = g; ctx.fillRect(-500, -500, 2100, 2900);
  const sun = ctx.createRadialGradient(80, 140, 0, 80, 140, 700);
  sun.addColorStop(0, 'rgba(255,244,205,0.95)'); sun.addColorStop(1, 'rgba(255,244,205,0)');
  ctx.fillStyle = sun; ctx.fillRect(-500, -500, 2100, 2900);
}

// jungle haze: a warm mist band that sits between the depth layers
function mist(ctx, y0, y1, a) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(248,240,214,0)'); g.addColorStop(0.55, `rgba(248,240,214,${a})`); g.addColorStop(1, 'rgba(248,240,214,0)');
  ctx.fillStyle = g; ctx.fillRect(-500, y0, 2100, y1 - y0);
}

function drawFar(ctx) {
  paper(ctx, S.farCrowns[0].path, S.farCrowns[0].col, { z: 0.8, grain: 0.5 });
  for (const e of S.emergents) { paper(ctx, e.trunk, '#9fae7c', { z: 0.8, grain: 0.5 }); paper(ctx, e.crown, '#9dd07e', { z: 1, grain: 0.5 }); }
  mist(ctx, 560, 900, 0.4);
  paper(ctx, S.farCrowns[1].path, S.farCrowns[1].col, { z: 1.2 });
  for (const p of S.farPalms) {
    paper(ctx, p.trunk, '#8fa86a', { z: 1 });
    for (const f of p.fronds) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(f.a);
      paper(ctx, f.path, '#6fb852', { z: 1, grain: 0.5 }); ctx.restore();
    }
  }
  mist(ctx, 780, 1080, 0.32);
  paper(ctx, S.midCrowns, '#4fa546', { z: 1.6 });
}

function drawVine(ctx, v, tq, col) {
  const sway = Math.sin(tq * 0.8 + v.ph) * 18;
  const pt = (s) => [v.x + sway * s * s + Math.sin(s * 3 + v.ph) * 10 * s, v.y + v.len * s];
  ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 20; i++) { const [x, y] = pt(i / 20); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
  ctx.stroke();
  for (const l of v.leaves) {
    const [x, y] = pt(l.s);
    ctx.save(); ctx.translate(x, y); ctx.rotate(l.side * 1.9 + Math.sin(tq * 1.3 + l.s * 9) * 0.1); ctx.scale(l.sc, l.sc);
    paper(ctx, S.vineLeaf, '#46b04a', { z: 1.2, grain: 0.5 }); ctx.restore();
  }
}

function drawVines(ctx, tq) {
  for (const v of S.vines) drawVine(ctx, v, tq, '#4a6a1c');
}
function drawCanopyMass(ctx) {
  S.canopy.forEach((l, i) => paper(ctx, l.path, l.col, { z: 2 + i }));
}
function drawHanging(ctx, tq) {
  for (const h of S.hanging) {
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.a + Math.sin(tq * 0.9 + h.x) * 0.04);
    paper(ctx, h.path, h.col, { z: 3 });
    ctx.strokeStyle = 'rgba(190,220,140,0.45)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -200); ctx.stroke();
    ctx.restore();
  }
}

function drawMid(ctx) {
  paper(ctx, S.farGround, '#6fb04a', { z: 1.5 });
  paper(ctx, S.trunkL, '#6a4024', { z: 2.5 });
  paper(ctx, S.trunkR, '#6a4024', { z: 2.5 });
  ctx.strokeStyle = 'rgba(70,48,30,0.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const [x0, y0, cx, cy, x1, y1] of S.bark) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(160,125,90,0.5)'; ctx.lineWidth = 5;
  for (const [x0, y0, x1, y1] of S.buttress) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0, y1 - 30, x1, y1); ctx.stroke(); }
  const b = S.trunkBromeliad;
  b.leaves.forEach((l, k) => { ctx.save(); ctx.translate(b.x, b.y); paper(ctx, l, k % 2 ? '#4fb043' : '#7ccf4a', { z: 1.2 }); ctx.restore(); });
  ctx.fillStyle = '#f03a2e'; ctx.beginPath(); ctx.ellipse(b.x, b.y - 8, 10, 14, 0, 0, 7); ctx.fill();
  for (const o of S.orchids) {
    ctx.save(); ctx.translate(o.x, o.y); ctx.scale(o.s, o.s);
    for (let k = 0; k < 5; k++) { ctx.save(); ctx.rotate((k / 5) * Math.PI * 2); paper(ctx, S.orchidPetal, '#ff6fb5', { z: 1 }); ctx.restore(); }
    ctx.fillStyle = '#fff1c2'; ctx.beginPath(); ctx.ellipse(0, 4, 8, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
    ctx.restore();
  }
  paper(ctx, S.branch, '#6f4526', { z: 3 });
  for (const l of S.branchLeaves) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a);
    paper(ctx, l.path, '#34a04a', { z: 2 }); ctx.restore();
  }
}
function drawBranchVines(ctx, tq) {
  for (const [x, y, len] of S.branchVines) drawVine(ctx, { x, y, len, ph: x, leaves: [0.3, 0.55, 0.8].map((s, k) => ({ s, side: k % 2 ? 1 : -1, sc: 0.7 })) }, tq, '#4a6a1c');
}

function drawStream(ctx, t) {
  paper(ctx, S.bank, '#5d9a3c', { z: 0.6 });
  paper(ctx, S.stream, '#3fb0a0', { z: 0, grain: 0.5 });
  // glints drifting downstream
  ctx.save(); ctx.clip(S.stream);
  ctx.strokeStyle = 'rgba(240,250,240,0.8)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 18; i++) {
    const x = ((i * 137 + t * 55) % 1900) - 400;
    const y = S.sy(x) + Math.sin(i * 2.3) * S.sw(x) * 0.25;
    ctx.globalAlpha = 0.5 + 0.5 * Math.sin(t * 3 + i);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 16 + (i % 3) * 8, y + 1); ctx.stroke();
  }
  ctx.restore();
}

function drawPage(ctx, p, a = 1) {
  paper(ctx, p.path, '#fbf4e6', { z: 1.2, alpha: a });
  ctx.globalAlpha = a;
  ctx.fillStyle = '#cfc2ad';
  for (let i = 0; i < 6; i++) ctx.fillRect(-40, -46 + i * 18, i % 3 === 1 ? 56 : 80, 5);
  ctx.strokeStyle = '#d2463c'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const [mx, my] of [[30, -40], [34, 14]].slice(0, 1 + (p.i % 2))) { ctx.beginPath(); ctx.moveTo(mx - 7, my - 7); ctx.lineTo(mx + 7, my + 7); ctx.moveTo(mx + 7, my - 7); ctx.lineTo(mx - 7, my + 7); ctx.stroke(); }
  ctx.globalAlpha = 1;
}

// Test pages lying on the ground like fallen leaves; at the cheer they swirl up and away.
function drawPages(ctx, t, front) {
  for (const p of S.pages) {
    if ((p.y > 1560) !== front) continue;
    const u = t - T.chime - 0.05 - p.i * 0.045;
    ctx.save();
    if (u <= 0) {
      ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(0.9, 0.5);
      drawPage(ctx, p);
    } else {
      const rise = 420 * u * u + 120 * u;
      const r = 60 + 90 * u;
      ctx.translate(p.x + Math.sin(u * 5 + p.i) * r - (p.x - 540) * u * 0.35, p.y - rise);
      ctx.rotate(p.rot + u * (p.i % 2 ? 5 : -5));
      ctx.scale(0.9 * Math.cos(u * (5 + p.i)), lerp(0.5, 0.9, clamp01(u * 2)));
      drawPage(ctx, p, clamp01(1.6 - u * 0.6));
    }
    ctx.restore();
  }
}

function drawGround(ctx) {
  for (const g of S.groundPlants) {
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.a);
    paper(ctx, g.path, '#2f9a45', { z: 1.5 }); ctx.restore();
  }
  paper(ctx, S.ground, '#4f9a3a', { z: 1.2 });
  for (const p of S.patches) paper(ctx, p.path, p.col, { z: 0.2, edge: false });
  for (const l of S.litter) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a); ctx.scale(l.s, l.s * 0.6);
    paper(ctx, S.leaf, l.col, { z: 0.6, grain: 0.6 }); ctx.restore();
  }
  for (const r of S.rocks) paper(ctx, r.path, '#9c9a82', { z: 1.6 });
  S.tufts.forEach((tf, i) => paper(ctx, tf, i % 2 ? '#4c9a36' : '#3f8a30', { z: 1 }));
  for (const m of S.mushrooms) drawMushroom(ctx, m, 0);
}

function drawMushroom(ctx, m, tq) {
  ctx.save(); ctx.translate(m.x, m.y); ctx.scale(m.s, m.s); ctx.rotate(Math.sin(tq * 1.1 + m.x) * 0.02);
  paper(ctx, m.stem, '#f1e3c6', { z: 1.2 });
  paper(ctx, m.cap, m.col, { z: 1.8 });
  ctx.fillStyle = '#fbf1dc';
  for (const [dx, dy, r] of [[-14, -46, 5], [6, -52, 4], [16, -42, 3.5], [-2, -40, 3]]) { ctx.beginPath(); ctx.arc(dx, dy, r, 0, 7); ctx.fill(); }
  ctx.restore();
}

function drawLog(ctx) {
  paper(ctx, S.log, '#7a4a2a', { z: 2.5 });
  ctx.strokeStyle = 'rgba(92,62,40,0.7)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (const [x0, y0, cx, cy, x1, y1] of S.logBark) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(cx, cy, x1, y1); ctx.stroke(); }
  paper(ctx, S.logEnd, '#e2b67e', { z: 1.5 });
  ctx.strokeStyle = 'rgba(160,118,74,0.8)'; ctx.lineWidth = 3;
  for (const k of [0.3, 0.55, 0.8]) { ctx.beginPath(); ctx.ellipse(LOG.x1 + 2, (LOG.top + LOG.bot) / 2 + 2, 40 * k, 67 * k, 0, 0, 7); ctx.stroke(); }
}
function drawLogFront(ctx, tq) {
  for (const m of S.moss) paper(ctx, m, '#4fae3c', { z: 1 });
  S.logBromeliad.forEach((l, k) => { ctx.save(); ctx.translate(120, LOG.top + 22); ctx.rotate(Math.sin(tq * 1.2) * 0.02); paper(ctx, l, k % 2 ? '#4fb043' : '#7ccf4a', { z: 1.2 }); ctx.restore(); });
  ctx.fillStyle = '#f03a2e'; ctx.beginPath(); ctx.ellipse(120, LOG.top + 14, 8, 11, 0, 0, 7); ctx.fill();
}

function drawBushBack(ctx, tq, shake) {
  ctx.save(); ctx.translate(Math.sin(tq * 40) * shake * 6, 0);
  paper(ctx, S.bushBack, '#1f6a30', { z: 2 });
  for (const l of S.bushLeaves) {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a + Math.sin(tq * 1.2 + l.x) * 0.03 + Math.sin(tq * 37 + l.x) * shake * 0.1);
    paper(ctx, l.path, l.col, { z: 2 }); ctx.restore();
  }
  ctx.restore();
}
function drawBushFront(ctx, tq, shake) {
  S.bushFronds.forEach((f, i) => {
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.a + Math.sin(tq * 1.5 + i) * 0.04 + Math.sin(tq * 37 + i) * shake * 0.12);
    paper(ctx, f.path, '#3a9e3e', { z: 1.6 }); ctx.restore();
  });
  const h = S.helico;
  ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(0.12 + Math.sin(tq * 1.1) * 0.03 + Math.sin(tq * 33) * shake * 0.1);
  ctx.strokeStyle = '#2f7a2e'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 60); ctx.lineTo(0, -230); ctx.stroke();
  for (const b of h.bracts) {
    paper(ctx, b.path, '#f03a2e', { z: 1.4 });
    ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(b.tip[0] - b.s * 6, b.tip[1] + 1, 5, 0, 7); ctx.fill();
  }
  ctx.restore();
  S.bushFront.forEach((b, i) => {
    ctx.save(); ctx.translate(Math.sin(tq * 43 + i * 2) * shake * 7, Math.sin(tq * 31 + i) * shake * 3);
    paper(ctx, b.path, b.col, { z: 2.2 });
    ctx.restore();
  });
  S.bushFrontLeaves.forEach((l, i) => {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a + Math.sin(tq * 1.3 + i) * 0.03 + Math.sin(tq * 41 + i) * shake * 0.1);
    paper(ctx, l.path, i ? '#45b24a' : '#2f9a40', { z: 2.6 }); ctx.restore();
  });
}

// tropical flowers pop open in a wave spreading out from the Mac
function drawFlowers(ctx, t) {
  for (const f of S.flowers) {
    const t0 = T.bloom[0] + f.d / 900;
    if (t < t0) continue;
    const p = spring(t - t0, 1.5, 4.6);
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(f.s * p, f.s * p); ctx.rotate((1 - Math.min(1, p)) * 0.8);
    for (let k = 0; k < 5; k++) {
      ctx.save(); ctx.rotate((k / 5) * Math.PI * 2);
      paper(ctx, f.petals, f.col, { z: 1.2, grain: 0.5 });
      ctx.restore();
    }
    ctx.fillStyle = '#f2c14e'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = '#b8541f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -22); ctx.stroke();
    ctx.restore();
  }
}

function drawForeground(ctx) {
  paper(ctx, S.fgGround, '#2f7a30', { z: 2 });
  ctx.save();
  ctx.filter = `blur(${2.4 * light.k}px)`;
  S.fgLeaves.forEach((l) => {
    ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.a);
    paper(ctx, l.path, l.col, { z: 3, grain: 0.5 });
    ctx.strokeStyle = 'rgba(150,190,110,0.4)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -380); ctx.stroke();
    ctx.restore();
  });
  ctx.restore();
}

// out-of-focus palm frond hanging into the top-left corner, like shooting through foliage
function drawOverhang(ctx) {
  ctx.save();
  ctx.filter = `blur(${6 * light.k}px)`;
  ctx.translate(-150, -40); ctx.rotate(2.05);
  paper(ctx, S.overhang, '#145c28', { z: 2, grain: 0.4 });
  ctx.restore();
}

// ---- toucan ------------------------------------------------------------------------
// o: { face 1 left..-1 right (flips through 0 like a paper cut-out), tilt bill up, lid 0..1, wide, beak 0..1, hop, puff }
function drawToucan(ctx, o) {
  const B = S.bird;
  ctx.save();
  ctx.translate(BIRD.x, BIRD.y - o.hop);
  ctx.scale(o.face, 1);
  for (const f of B.feet) paper(ctx, f, '#5d78a8', { z: 0.8 });
  ctx.save(); ctx.translate(8, -60); ctx.rotate(o.puff * 0.08); ctx.translate(-8, 60);
  paper(ctx, B.tail, '#1c1a20', { z: 2 });
  ctx.restore();
  ctx.save(); ctx.translate(8, -30); ctx.scale(1 + o.puff * 0.06, 1 + o.puff * 0.05); ctx.translate(-8, 30);
  paper(ctx, B.body, '#24212a', { z: 2.4 });
  paper(ctx, B.vent, '#e8322a', { z: 0.6 });
  paper(ctx, B.bib, '#ffd84a', { z: 0.6 });
  paper(ctx, B.band, '#e8322a', { z: 0.5 });
  ctx.save(); ctx.translate(20, -100); ctx.rotate(-o.puff * 0.3); ctx.translate(-20, 100);
  paper(ctx, B.wing, '#2f2b38', { z: 1.2 });
  ctx.restore();
  ctx.restore();
  // head and bill tilt together around the neck
  ctx.save();
  ctx.translate(-4, -100); ctx.rotate(o.tilt); ctx.translate(4, 100);
  paper(ctx, B.head, '#24212a', { z: 1.6 });
  paper(ctx, B.patch, '#6fd6e8', { z: 0.5 });
  const ex = -15, ey = -116;
  ctx.fillStyle = '#16141a'; ctx.beginPath(); ctx.arc(ex, ey, 5 * o.wide, 0, 7); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ex - 1.6, ey - 1.8, 1.8, 0, 7); ctx.fill();
  if (o.lid > 0) {
    ctx.save();
    ctx.beginPath(); ctx.arc(ex, ey, 6 * o.wide, 0, 7); ctx.clip();
    ctx.fillStyle = '#58c2d6'; ctx.fillRect(ex - 8, ey - 8, 16, 14 * o.lid);
    ctx.fillStyle = '#1a3e48'; ctx.fillRect(ex - 8, ey - 8 + 14 * o.lid - 1.5, 16, 2);
    ctx.restore();
  }
  const bill = ctx.createLinearGradient(-26, 0, -124, 0);
  bill.addColorStop(0, '#9ad33a'); bill.addColorStop(0.45, '#ffb020'); bill.addColorStop(0.85, '#ff4d2e'); bill.addColorStop(1, '#3a1a14');
  ctx.save(); ctx.translate(-26, -103); ctx.rotate(-o.beak * 0.35); ctx.translate(26, 103);
  paper(ctx, B.lower, bill, { z: 1 });
  ctx.restore();
  paper(ctx, B.upper, bill, { z: 1.4 });
  ctx.strokeStyle = 'rgba(40,20,10,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-50, -126); ctx.lineTo(-50, -110); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

// ---- blue morpho butterflies -----------------------------------------------------------
const MORPHOS = [{ x: 190, y: 880, ph: 0 }, { x: 860, y: 780, ph: 2.1 }];
function drawButterflies(ctx, t) {
  for (const b of MORPHOS) {
    const x = b.x + Math.sin(t * 0.55 + b.ph) * 130 + Math.sin(t * 1.3 + b.ph) * 30;
    const y = b.y + Math.sin(t * 0.8 + b.ph * 2) * 70;
    const flap = Math.abs(Math.cos(t * 11 + b.ph));
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.9 + b.ph) * 0.25);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.scale(s * (0.25 + 0.75 * flap), 1);
      paper(ctx, S.wingDown, '#1b3f8f', { z: 1.2 });
      paper(ctx, S.wingUp, '#2f8cff', { z: 1.4 });
      ctx.strokeStyle = '#0d1f45'; ctx.lineWidth = 3; ctx.stroke(S.wingUp);
      ctx.restore();
    }
    ctx.fillStyle = '#16141a'; ctx.beginPath(); ctx.ellipse(0, 6, 3, 16, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
}

// ---- score sign ------------------------------------------------------------------
function drawTag(ctx, t, tq, gold) {
  if (t < T.tag) return;
  const u = t - T.tag;
  const p = spring(u, 1.2, 4.4);
  const swing = Math.sin(tq * 1.5) * 0.025 + Math.sin(u * 6) * 0.1 * Math.exp(-u * 2.2) + (t > T.chime ? Math.sin((t - T.chime) * 9) * 0.06 * Math.exp(-(t - T.chime) * 2.5) : 0);
  ctx.save();
  ctx.translate(TAG.x, TAG.y); ctx.rotate(swing);
  ctx.strokeStyle = '#6b4a33'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 52 * clamp01(p * 1.5) + 4); ctx.stroke();
  ctx.translate(0, 50);
  ctx.scale(1, Math.max(0.02, p));
  paper(ctx, S.tag, mixHex('#fbf1dc', '#fff4cf', gold), { z: 2.5 });
  ctx.fillStyle = '#c9b48f'; ctx.beginPath(); ctx.arc(0, 12, 5, 0, 7); ctx.fill();
  // one line, centred on a fixed-width number slot so the count doesn't jiggle it
  const label = 'Current Score: ', base = 64;
  ctx.font = '700 34px "Plus Jakarta Sans"';
  const wl = ctx.measureText(label).width;
  ctx.font = '800 38px "Plus Jakarta Sans"';
  const wn = ctx.measureText('1888').width;
  const gap = 10, x0 = -(wl + gap + wn) / 2, nx = x0 + wl + gap + wn / 2;
  ctx.textAlign = 'left'; ctx.fillStyle = '#4e3124'; ctx.font = '700 34px "Plus Jakarta Sans"';
  ctx.fillText(label, x0, base);
  // the number shakes on "perpetually low", counts up, then pops green
  const done = t > T.chime;
  const shake = t > T.low && t < T.low + 0.5 ? Math.sin((t - T.low) * 60) * 3 * (1 - (t - T.low) / 0.5) : 0;
  const pop = done ? 1 + 0.18 * Math.exp(-5 * (t - T.chime)) * Math.cos((t - T.chime) * 16) : 1;
  ctx.save(); ctx.translate(nx + shake, base - 13); ctx.scale(pop, pop);
  ctx.textAlign = 'center'; ctx.font = '800 38px "Plus Jakarta Sans"';
  ctx.fillStyle = done ? '#3f8f4a' : t > T.count[0] ? mixHex('#c8452f', '#b07a2a', span(t, T.count[0], T.count[1])) : '#c8452f';
  ctx.fillText(String(score(t)), 0, 13);
  ctx.restore();
  // red pen circle drawn around the low score
  if (t > T.low && !done) {
    const d = clamp01((t - T.low) / 0.45);
    const rx = wn / 2 + 9;
    ctx.save();
    ctx.globalAlpha = 1 - span(t, T.count[0], T.count[0] + 0.3);
    ctx.strokeStyle = '#c8452f'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    // Skia draws nothing for sweeps past a full turn, so the overshoot is its own stroke
    const sweep = d * 6.6;
    ctx.beginPath(); ctx.ellipse(nx, base - 13, rx, 28, -0.05, -2.4, -2.4 + Math.min(sweep, 6.2)); ctx.stroke();
    if (sweep > 6.2) { ctx.beginPath(); ctx.ellipse(nx, base - 14, rx + 4, 31, -0.05, -2.4 + 6.2, -2.4 + sweep); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
  // "+200" pill pops off the sign's corner
  if (done) {
    const q = spring(t - T.chime - 0.1, 1.6, 4.5);
    ctx.save(); ctx.translate(TAG.x + 185, TAG.y + 48); ctx.rotate(0.12 + swing); ctx.scale(q, q);
    paper(ctx, S.plusPill, '#34a55a', { z: 2.5 });
    ctx.fillStyle = '#fff'; ctx.font = '800 24px "Plus Jakarta Sans"'; ctx.textAlign = 'center';
    ctx.fillText(`+${SCORE_TO - SCORE_FROM}`, 0, 9);
    ctx.restore();
  }
}

// ---- particles -------------------------------------------------------------------
const LEAVES = [...Array(9)].map((_, i) => { const r = rng(900 + i); return { x: r() * 1080, ph: r() * 10, v: 110 + r() * 80, s: 0.7 + r() * 0.6, col: ['#e0902a', '#5fb84a', '#f2b632', '#c0622a'][i % 4] }; });
function drawFallingLeaves(ctx, tq) {
  for (const l of LEAVES) {
    const y = ((tq * l.v + l.ph * 300) % 2300) - 200;
    const x = l.x + Math.sin(tq * 1.4 + l.ph) * 70;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(tq * 2 + l.ph) * 1.1); ctx.scale(l.s * Math.cos(tq * 2.6 + l.ph), l.s);
    paper(ctx, S.leaf, l.col, { z: 2.5 }); ctx.restore();
  }
}
// celebration: leaves spiral up from around the student
const SWIRL = [...Array(22)].map((_, i) => { const r = rng(700 + i); return { x: 150 + r() * 800, y: 1350 + r() * 350, ph: r() * 6, s: 0.6 + r() * 0.7, d: r() * 0.35, col: ['#f2a623', '#5fb84a', '#ffd23f', '#e0902a', '#ff4f8b'][i % 5] }; });
function drawSwirl(ctx, t) {
  for (const l of SWIRL) {
    const u = t - T.chime - l.d;
    if (u <= 0) continue;
    const rise = 520 * u * u + 260 * u, r = 40 + 120 * u;
    ctx.save();
    ctx.translate(l.x + Math.sin(u * 6 + l.ph) * r, l.y - rise);
    ctx.rotate(u * 7 + l.ph); ctx.scale(l.s * Math.cos(u * 9 + l.ph), l.s);
    paper(ctx, S.leaf, l.col, { z: 2.5, alpha: clamp01(u * 6) * clamp01(2.2 - u) });
    ctx.restore();
  }
}

module.exports = {
  build, S, LOG, LAP_GLOW,
  drawSky, drawFar, drawVines, drawCanopyMass, drawHanging, drawMid, drawBranchVines, drawStream, drawGround, drawPages, drawLog, drawLogFront,
  drawBushBack, drawBushFront, drawFlowers, drawForeground, drawOverhang, drawToucan, drawButterflies, drawTag,
  drawFallingLeaves, drawSwirl,
};
