// The phone display: a cold dark feed that scrolls on autopilot, then Korah SAT
// opening warm. Drawn in screen units (120 x 250) onto a 2x canvas that the scene
// maps onto the phone.
const { createCanvas, Path2D } = require('@napi-rs/canvas');
const { clamp01, spring, rrectPts, cut, paper, light } = require('./paper');
const { T } = require('./timeline');

const UW = 120, UH = 250, US = 2;
const canvas = createCanvas(UW * US, UH * US);
const ctx = canvas.getContext('2d');

const JK = (w, px) => `${w} ${px}px "Plus Jakarta Sans"`;

function rr(x, y, w, h, r) {
  const p = new Path2D();
  p.roundRect(x, y, w, h, r);
  return p;
}
function text(s, x, y, font, color, align = 'left', spacing = 0) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.letterSpacing = `${spacing}px`;
  ctx.fillText(s, x, y);
  ctx.letterSpacing = '0px';
}

// ---- Korah SAT ---------------------------------------------------------------
const K = { deep: '#4c1d95', violet: '#8b5cf6', brown: '#3b2412', tan: '#a57a57' };
const CARDS = [
  ['Q12', 'Linear equations', 'Math', '#f59e0b'],
  ['Q13', 'Words in context', 'Reading', '#ec4899'],
  ['Q14', 'Circles and arcs', 'Math', '#8b5cf6'],
];
const paths = {
  bar: cut(rrectPts(0, 0, UW, 30, 0.01, 1), 31, 0.4, 24),
  card: cut(rrectPts(0, 0, 108, 50, 9), 34, 0.5, 18),
};

function drawKorah(t, sprite) {
  const g = ctx.createLinearGradient(0, 0, UW * 0.4, UH);
  g.addColorStop(0, '#ffdc95'); g.addColorStop(1, '#f6a049');
  ctx.fillStyle = g; ctx.fillRect(0, 0, UW, UH);
  const sun = ctx.createRadialGradient(28, 22, 0, 28, 22, 190);
  sun.addColorStop(0, 'rgba(255,246,218,0.6)'); sun.addColorStop(1, 'rgba(255,246,218,0)');
  ctx.fillStyle = sun; ctx.fillRect(0, 0, UW, UH);

  paper(ctx, paths.bar, '#fff3df', { z: 1 });
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite, mascotFrame(t) * 64, 0, 64, 64, 5, 3, 24, 24);
  ctx.imageSmoothingEnabled = true;
  text('Korah', 33, 20, JK(800, 12), K.deep);
  ctx.font = JK(800, 12);
  text(' SAT', 33 + ctx.measureText('Korah').width, 20, JK(800, 12), K.violet);
  ctx.fillStyle = K.violet; ctx.fill(rr(UW - 26, 8, 20, 14, 7));
  text('12', UW - 16, 18, JK(800, 8), '#fff', 'center');

  text('TODAY', 8, 44, JK(800, 7), '#a2703a', 'left', 1.2);

  CARDS.forEach(([q, title, sub, tab], i) => {
    const t0 = T.cards[i];
    if (t < t0) return;
    const p = spring(t - t0, 1.4, 5.2);
    ctx.save();
    ctx.translate(6, 52 + i * 58);
    ctx.translate(0, -8 * (1 - clamp01(p)));
    ctx.scale(1, Math.max(0.02, p));
    paper(ctx, paths.card, '#fffaf1', { z: 1.2 });
    ctx.fillStyle = tab; ctx.fill(rr(0, 0, 6, 50, 3));
    text(q, 14, 16, JK(800, 7), K.tan, 'left', 0.6);
    text(title, 14, 30, JK(800, 10), K.brown);
    text(sub, 14, 42, JK(600, 7), K.tan);
    'ABCD'.split('').forEach((ch, k) => {
      const cx = 62 + k * 13;
      const on = k === [2, 0, 3][i] && t > t0 + 0.35;
      ctx.fillStyle = on ? K.violet : '#f3e6d2'; ctx.beginPath(); ctx.arc(cx, 34, 5, 0, 7); ctx.fill();
      text(ch, cx, 36.6, JK(800, 6), on ? '#fff' : K.tan, 'center');
    });
    if (p < 1) { ctx.fillStyle = `rgba(90,45,15,${0.5 * (1 - p)})`; ctx.fill(paths.card); }
    ctx.restore();
  });
}

function mascotFrame(t) {
  if (t > T.focus && t < T.focus + 0.5) return 3 + Math.min(4, Math.floor((t - T.focus) / 0.1));
  if (t % 2.7 < 0.13) return 2;
  return Math.floor(t * 2) % 2;
}

// Rendered once per frame and drawn into the paper "app view" panel beside the phone.
function drawApp(t, sprite) {
  ctx.save();
  ctx.setTransform(US, 0, 0, US, 0, 0);
  light.k = US;
  drawKorah(t, sprite);
  ctx.restore();
  return canvas;
}

module.exports = { drawApp, mascotFrame, UW, UH };
