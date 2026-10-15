// The held MacBook's display: Korah SAT lighting up, question cards folding in.
// Drawn in screen units (220 x 144) onto a 3x canvas the scene maps onto the laptop.
const { createCanvas, Path2D } = require('@napi-rs/canvas');
const { span, spring, clamp01, rrectPts, cut, paper, light } = require('../korah-not-cooked/paper');
const { T } = require('./timeline');

const UW = 220, UH = 144, US = 3;
const canvas = createCanvas(UW * US, UH * US);
const ctx = canvas.getContext('2d');
const JK = (w, px) => `${w} ${px}px "Plus Jakarta Sans"`;
const K = { deep: '#4c1d95', violet: '#8b5cf6', brown: '#3b2412', tan: '#a57a57' };

function rr(x, y, w, h, r) { const p = new Path2D(); p.roundRect(x, y, w, h, r); return p; }
function text(s, x, y, font, color, align = 'left') {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.fillText(s, x, y);
}

const CARDS = [
  ['Linear equations', 'Math  ·  Hard', '#f59e0b', 2],
  ['Words in context', 'Reading & Writing', '#ec4899', 0],
  ['Circles and arcs', 'Math  ·  Medium', '#8b5cf6', 3],
];
const paths = {
  bar: cut(rrectPts(0, 0, UW, 26, 0.01, 1), 31, 0.4, 24),
  card: cut(rrectPts(0, 0, 196, 30, 6), 34, 0.45, 18),
};

// idle bob on the mascot, with a blink now and then
const mascotFrame = (t) => (t % 2.3 < 0.12 ? 2 : Math.floor(t * 2) % 2);

// hinge at the top edge: lift, unfold downward, settle with a bounce
function fold(t0, t, draw) {
  if (t < t0) return;
  const p = spring(t - t0, 1.4, 5.2);
  ctx.save();
  ctx.translate(0, -5 * (1 - clamp01(p)));
  ctx.scale(1, Math.max(0.02, p));
  draw(p);
  ctx.restore();
}

function drawScreen(t, sprite) {
  ctx.save();
  ctx.setTransform(US, 0, 0, US, 0, 0);
  light.k = US;
  const g = ctx.createLinearGradient(0, 0, UW * 0.3, UH);
  g.addColorStop(0, '#ffdc95'); g.addColorStop(1, '#f6a049');
  ctx.fillStyle = g; ctx.fillRect(0, 0, UW, UH);
  const sun = ctx.createRadialGradient(40, 16, 0, 40, 16, 150);
  sun.addColorStop(0, 'rgba(255,245,215,0.6)'); sun.addColorStop(1, 'rgba(255,245,215,0)');
  ctx.fillStyle = sun; ctx.fillRect(0, 0, UW, UH);

  fold(T.glow + 0.2, t, (p) => {
    paper(ctx, paths.bar, '#fff3df', { z: 1 });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, mascotFrame(t) * 64, 0, 64, 64, 3, 1, 24, 24);
    ctx.imageSmoothingEnabled = true;
    text('Korah', 29, 18, JK(800, 12.5), K.deep);
    ctx.font = JK(800, 12.5);
    text(' SAT', 29 + ctx.measureText('Korah').width, 18, JK(800, 12.5), K.violet);
    ctx.fillStyle = K.violet; ctx.fill(rr(UW - 62, 6.5, 56, 13, 6.5));
    text('Day 12 streak', UW - 34, 15.6, JK(800, 6.4), '#fff', 'center');
    if (p < 1) { ctx.fillStyle = `rgba(90,45,15,${0.5 * (1 - p)})`; ctx.fill(paths.bar); }
  });

  CARDS.forEach(([title, sub, tab, pick], i) => {
    ctx.save();
    ctx.translate(12, 33 + i * 36);
    fold(T.cards[i], t, (p) => {
      paper(ctx, paths.card, '#fffaf1', { z: 1 + (1 - clamp01(p)) * 2 });
      ctx.fillStyle = tab; ctx.fill(rr(0, 0, 5, 30, 2.5));
      text(title, 11, 14, JK(800, 9.5), K.brown);
      text(sub, 11, 24.5, JK(600, 6.4), K.tan);
      'ABCD'.split('').forEach((ch, k) => {
        const cx = 112 + k * 17;
        const on = k === pick && t > T.cards[i] + 0.3;
        ctx.fillStyle = on ? K.violet : '#f3e6d2'; ctx.beginPath(); ctx.arc(cx, 15, 6.5, 0, 7); ctx.fill();
        text(ch, cx, 17.6, JK(800, 7), on ? '#fff' : K.tan, 'center');
      });
      if (p < 1) { ctx.fillStyle = `rgba(90,45,15,${0.5 * (1 - p)})`; ctx.fill(paths.card); }
    });
    const st = T.cards[i] + 0.4;
    if (t > st) {
      const q = spring(t - st, 1.8, 5);
      ctx.save();
      ctx.translate(184, 15); ctx.rotate((1 - q) * -0.6); ctx.scale(q, q);
      ctx.fillStyle = '#22a55a'; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-3.5, 0.3); ctx.lineTo(-0.9, 2.9); ctx.lineTo(3.6, -2.6); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  });

  // the screen wakes with a flash
  const flash = 1 - span(t, T.glow, T.glow + 0.45);
  if (flash > 0) { ctx.fillStyle = `rgba(255,250,235,${flash})`; ctx.fillRect(0, 0, UW, UH); }
  ctx.restore();
  return canvas;
}

module.exports = { drawScreen };
