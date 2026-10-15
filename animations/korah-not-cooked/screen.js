// The laptop display: a Bluebook-style practice test, then Korah SAT opening warm.
// Drawn in screen units (442 x 262) onto a 2x canvas that the scene maps onto the laptop.
const { createCanvas, Path2D } = require('@napi-rs/canvas');
const { span, lerp, inOut, outBack, spring, clamp01, rrectPts, cut, paper, light } = require('./paper');
const { T, PICKS, SCORE_FROM } = require('./timeline');

const UW = 442, UH = 262, US = 2;
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

// ---- the practice test app (Bluebook-style) ---------------------------------
const BB = { ink: '#1b1b1b', dim: '#5f5f5f', line: '#9a9a9a', blue: '#2f4fd1', bar: '#f1f1f1' };
const PASSAGE = [
  'Urban beekeepers have found that rooftop',
  'hives are surprisingly ______. Colonies',
  'kept above busy streets often produce as',
  'much honey as those in rural fields.',
];
const CHOICES = ['fragile', 'productive', 'temporary', 'isolated'];

// the dashed rule under the header, with its yellow and blue flecks
function rule(y, x0 = 0, x1 = UW) {
  const pat = [[16, BB.ink], [3], [10, BB.ink], [3], [7, '#f2c200'], [3], [14, BB.ink], [3], [5, '#6cb4e6'], [3], [12, BB.ink], [3]];
  let x = x0, i = 0;
  ctx.lineWidth = 1.1;
  while (x < x1) {
    const [len, col] = pat[i++ % pat.length];
    if (col) { ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(Math.min(x1, x + len), y); ctx.stroke(); }
    x += len;
  }
}
function chevron(x, y, up) {
  ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 2, y + (up ? 1 : -1)); ctx.lineTo(x, y + (up ? -1 : 1)); ctx.lineTo(x + 2, y + (up ? 1 : -1)); ctx.stroke();
}

function drawCold(t) {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, UW, UH);
  if (t >= T.reveal) return drawScoreReport(t);

  // header
  text('Section 1, Module 2: Reading and Writing', 10, 15, JK(700, 8.5), BB.ink);
  text('Directions', 10, 27, JK(600, 6.2), BB.ink);
  chevron(47, 25, false);
  text('3:07', UW / 2, 16, JK(800, 11), BB.ink, 'center');
  ctx.strokeStyle = BB.ink; ctx.lineWidth = 0.8; ctx.stroke(rr(UW / 2 - 12, 20, 24, 9, 4.5));
  text('Hide', UW / 2, 27, JK(700, 5.4), BB.ink, 'center');
  text('Annotate', UW - 40, 27, JK(600, 5.4), BB.ink, 'center');
  text('More', UW - 13, 27, JK(600, 5.4), BB.ink, 'center');
  ctx.strokeStyle = BB.ink; ctx.lineWidth = 0.9;
  ctx.beginPath(); ctx.moveTo(UW - 43, 18); ctx.lineTo(UW - 37, 12); ctx.moveTo(UW - 45, 19); ctx.lineTo(UW - 38, 19); ctx.stroke();
  ctx.fillStyle = BB.ink; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.arc(UW - 13, 12 + k * 2.6, 0.8, 0, 7); ctx.fill(); }
  rule(35);

  if (t < T.submit + 0.05) {
    // passage | question
    ctx.fillStyle = BB.line; ctx.fillRect(UW / 2 - 0.8, 42, 1.6, 180);
    PASSAGE.forEach((l, i) => text(l, 12, 58 + i * 11, JK(500, 7.4), BB.ink));
    ctx.fillStyle = BB.bar; ctx.fillRect(232, 44, 198, 14);
    ctx.fillStyle = BB.ink; ctx.fillRect(232, 44, 14, 14);
    text('27', 239, 54, JK(800, 7), '#fff', 'center');
    ctx.strokeStyle = BB.ink; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(251, 47); ctx.lineTo(251, 55.5); ctx.lineTo(254, 53); ctx.lineTo(257, 55.5); ctx.lineTo(257, 47); ctx.closePath(); ctx.stroke();
    text('Mark for Review', 261, 54, JK(600, 6.4), BB.ink);
    rule(59, 232, 430);
    text('Which choice completes the text with the most', 232, 72, JK(500, 7.2), BB.ink);
    text('logical and precise word or phrase?', 232, 82, JK(500, 7.2), BB.ink);
    const pick = PICKS.filter(([k]) => k <= t).pop();
    CHOICES.forEach((c, i) => {
      const y = 92 + i * 27;
      const on = pick && pick[1] === i;
      ctx.strokeStyle = on ? BB.blue : BB.ink; ctx.lineWidth = on ? 1.8 : 0.8;
      ctx.stroke(rr(232, y, 198, 21, 4));
      ctx.beginPath(); ctx.arc(245, y + 10.5, 5.2, 0, 7);
      if (on) { ctx.fillStyle = BB.blue; ctx.fill(); } else { ctx.lineWidth = 0.8; ctx.stroke(); }
      text('ABCD'[i], 245, y + 12.6, JK(800, 6), on ? '#fff' : BB.ink, 'center');
      text(c, 258, y + 13.4, JK(500, 7.4), BB.ink);
    });
    // footer
    ctx.fillStyle = '#1f1f1f'; ctx.fill(rr(UW / 2 - 40, 238, 80, 15, 3));
    text('Question 27 of 27', UW / 2 - 4, 248.5, JK(700, 6.4), '#fff', 'center');
    chevron(UW / 2 + 30, 246.5, true);
    const pressed = t > T.submit - 0.05;
    ctx.fillStyle = pressed ? '#223b9e' : BB.blue;
    ctx.fill(rr(UW - 52, 237, 40, 17, 8.5));
    text('Next', UW - 32, 248.5, JK(700, 7), '#fff', 'center');
  } else {
    const a = t * 9;
    ctx.strokeStyle = BB.blue; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(UW / 2, 118, 12, a, a + 4.2); ctx.stroke();
    text('Scoring your test…', UW / 2, 152, JK(700, 9), BB.dim, 'center');
  }
}

// score report page: blue banner with the total score card centered over it
function drawScoreReport(t) {
  const blue = '#3a4ec0';
  text('Your Score Reports', 14, 15, JK(700, 8), BB.ink);
  ctx.fillStyle = blue; ctx.fillRect(0, 23, UW, 128);
  text('Your Latest Test', 16, 44, JK(500, 14), '#fff');
  text('SAT Practice Test 6  ·  Tested on Oct 2, 11th Grade', 16, 56, JK(500, 6.4), '#dfe4ff');

  const p = spring(t - T.reveal, 1.5, 6);
  const cx = UW / 2, x = cx - 135, y = 64, w = 270, h = 152;
  ctx.save();
  ctx.globalAlpha = clamp01((t - T.reveal) * 5);
  ctx.translate(0, 10 * (1 - p));
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.18)'; ctx.shadowBlur = 8 * US; ctx.shadowOffsetY = 2 * US;
  ctx.fillStyle = '#fff'; ctx.fill(rr(x, y, w, h, 9));
  ctx.restore();
  text('TOTAL SCORE', cx, y + 18, JK(800, 7), BB.ink, 'center', 0.6);
  text(String(SCORE_FROM), cx, y + 67, JK(800, 54), BB.ink, 'center');
  text('400 - 1600', cx, y + 80, JK(500, 6.6), BB.ink, 'center');
  ctx.fillStyle = BB.ink; ctx.fillRect(cx - 17, y + 82, 34, 0.6);
  // section scores
  ctx.fillStyle = '#e3e3e3'; ctx.fillRect(cx - 0.4, y + 90, 0.8, 26);
  [['Reading and Writing', cx - 62], ['Math', cx + 62]].forEach(([name, sx]) => {
    text(name, sx, y + 97, JK(700, 6.2), BB.ink, 'center');
    text('520', sx, y + 114, JK(800, 16), BB.ink, 'center');
  });
  // actions
  ctx.strokeStyle = blue; ctx.lineWidth = 0.9; ctx.stroke(rr(x + 14, y + 124, 118, 17, 8.5));
  text('\u2192  See Score Details', x + 73, y + 135, JK(700, 6.6), blue, 'center');
  ctx.fillStyle = '#efefef'; ctx.fill(rr(x + 138, y + 124, 118, 17, 8.5));
  text('Download Report', x + 197, y + 135, JK(600, 6.6), '#a3a3a3', 'center');
  ctx.restore();
}

const DOCK = { cx: UW / 2, y: 226, n: 6, size: 18, gap: 8 };
const iconX = (i) => DOCK.cx - ((DOCK.n - 1) * (DOCK.size + DOCK.gap)) / 2 + i * (DOCK.size + DOCK.gap);
const KORAH_ICON = { x: iconX(5), y: DOCK.y + DOCK.size / 2 + 4 };

function drawDock(t, sprite) {
  // hidden during the test; slides up when the cursor heads for the bottom edge
  const up = spring(t - T.cursor - 0.3, 1.5, 6);
  if (t < T.cursor + 0.3) return;
  ctx.save();
  ctx.translate(0, (1 - up) * 36);
  const w = DOCK.n * (DOCK.size + DOCK.gap) + 10;
  ctx.fillStyle = 'rgba(225,228,235,0.92)';
  ctx.fill(rr(DOCK.cx - w / 2, DOCK.y, w, DOCK.size + 8, 9));
  const cols = ['#5b8def', '#d9dde6', '#f2c14e', '#46b38a', '#e25d5d'];
  for (let i = 0; i < DOCK.n; i++) {
    const x = iconX(i) - DOCK.size / 2;
    let y = DOCK.y + 4;
    if (i === 5) {
      const b = t - T.click - 0.05;
      if (b > 0 && b < 0.7) y -= Math.abs(Math.sin(b * Math.PI * 2 / 0.7 * 1.0)) * 9 * (1 - b / 0.7);
      ctx.fillStyle = '#8b5cf6';
      ctx.fill(rr(x, y, DOCK.size, DOCK.size, 5));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite, 0, 0, 64, 64, x + 1, y + 1, DOCK.size - 2, DOCK.size - 2);
      ctx.imageSmoothingEnabled = true;
    } else {
      ctx.fillStyle = cols[i];
      ctx.fill(rr(x, y, DOCK.size, DOCK.size, 5));
    }
  }
  ctx.restore();
}

function drawCursor(t) {
  if (t < T.cursor - 0.3 || t > T.open + 0.25) return;
  const p = inOut(span(t, T.cursor, T.cursor + 0.6));
  const x = lerp(300, KORAH_ICON.x + 2, p);
  const y = lerp(150, KORAH_ICON.y - 2, p) - Math.sin(p * Math.PI) * 18;
  const s = t > T.click && t < T.click + 0.12 ? 0.85 : 1;
  ctx.save();
  ctx.globalAlpha = clamp01((t - T.cursor + 0.3) * 5) * clamp01((T.open + 0.25 - t) * 6);
  ctx.translate(x, y); ctx.scale(s, s);
  const c = new Path2D();
  c.moveTo(0, 0); c.lineTo(0, 15); c.lineTo(3.8, 11.4); c.lineTo(6.4, 17); c.lineTo(8.6, 16); c.lineTo(6.1, 10.6); c.lineTo(11, 10.6); c.closePath();
  ctx.fillStyle = '#111'; ctx.fill(c);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.1; ctx.lineJoin = 'round'; ctx.stroke(c);
  ctx.restore();
}

// ---- Korah SAT ---------------------------------------------------------------
const K = { purple: '#7c3aed', deep: '#4c1d95', violet: '#8b5cf6', lilac: '#a78bfa', pink: '#f0abfc', cream: '#fff7ea', brown: '#3b2412', tan: '#a57a57' };
const CARDS = [
  ['Linear equations', 'Math  ·  Hard', '#f59e0b', 2],
  ['Words in context', 'Reading & Writing  ·  Medium', '#ec4899', 0],
  ['Circles and arcs', 'Math  ·  Medium', '#8b5cf6', 3],
];
const paths = {
  bar: cut(rrectPts(0, 0, UW, 34, 0.01, 1), 31, 0.5, 30),
  card: cut(rrectPts(0, 0, 418, 62, 10), 34, 0.6, 22),
};

// Hinge at the top edge: the piece lifts, then unfolds downward and settles with a bounce.
function fold(t0, t, draw, lift = 7) {
  const p = spring(t - t0, 1.4, 5.2);
  if (t < t0) return;
  ctx.save();
  ctx.translate(0, -lift * (1 - clamp01(p)));
  ctx.scale(1, Math.max(0.02, p));
  draw(p);
  ctx.restore();
}
function foldShade(p, path) {
  if (p >= 1) return;
  ctx.fillStyle = `rgba(90,45,15,${0.5 * (1 - p)})`;
  ctx.fill(path);
}

function mascotFrame(t) {
  if (t > 11.1 && t < 11.6) return 3 + Math.min(4, Math.floor((t - 11.1) / 0.1));
  if (t % 2.7 < 0.13) return 2;
  return Math.floor(t * 2) % 2;
}

function drawKorah(t, sprite) {
  const g = ctx.createLinearGradient(0, 0, UW * 0.3, UH);
  g.addColorStop(0, '#ffdc95'); g.addColorStop(1, '#f6a049');
  ctx.fillStyle = g; ctx.fillRect(0, 0, UW, UH);
  const sun = ctx.createRadialGradient(80, 30, 0, 80, 30, 260);
  sun.addColorStop(0, 'rgba(255,245,215,0.55)'); sun.addColorStop(1, 'rgba(255,245,215,0)');
  ctx.fillStyle = sun; ctx.fillRect(0, 0, UW, UH);

  // top bar
  fold(T.open + 0.45, t, (p) => {
    paper(ctx, paths.bar, '#fff3df', { z: 1.2 });
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sprite, mascotFrame(t) * 64, 0, 64, 64, 6, 1, 32, 32);
    ctx.imageSmoothingEnabled = true;
    text('Korah', 42, 23, JK(800, 15), K.deep);
    ctx.font = JK(800, 15);
    text(' SAT', 42 + ctx.measureText('Korah').width, 23, JK(800, 15), K.violet);
    ctx.fillStyle = K.violet; ctx.fill(rr(UW - 88, 9, 76, 17, 8.5));
    text('Day 12 streak', UW - 50, 21, JK(800, 8), '#fff', 'center');
    foldShade(p, paths.bar);
  }, 4);

  // practice questions
  CARDS.forEach(([title, sub, tab, pick], i) => {
    const y = 44 + i * 71;
    ctx.save();
    ctx.translate(12, y);
    fold(T.cards[i], t, (p) => {
      paper(ctx, paths.card, '#fffaf1', { z: 1.2 + (1 - clamp01(p)) * 2.5 });
      ctx.fillStyle = tab; ctx.fill(rr(0, 0, 8, 62, 4));
      text(`Q${12 + i}`, 20, 22, JK(800, 9), K.tan, 'left', 0.8);
      text(title, 20, 40, JK(800, 14), K.brown);
      text(sub, 20, 54, JK(600, 8.5), K.tan);
      // answer choices, the right one filled in
      'ABCD'.split('').forEach((ch, k) => {
        const cx = 238 + k * 30;
        const on = k === pick && t > T.cards[i] + 0.3;
        ctx.fillStyle = on ? K.violet : '#f3e6d2'; ctx.beginPath(); ctx.arc(cx, 31, 10, 0, 7); ctx.fill();
        text(ch, cx, 35, JK(800, 10), on ? '#fff' : K.tan, 'center');
      });
      foldShade(p, paths.card);
    }, 12);
    const st = T.cards[i] + 0.45;
    if (t > st) {
      const q = spring(t - st, 1.8, 5);
      ctx.save();
      ctx.translate(390, 31); ctx.rotate((1 - q) * -0.6); ctx.scale(q, q);
      ctx.fillStyle = '#22a55a'; ctx.beginPath(); ctx.arc(0, 0, 13, 0, 7); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-5.6, 0.4); ctx.lineTo(-1.4, 4.6); ctx.lineTo(5.8, -4.2); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  });
}

function drawScreen(t, sprite) {
  ctx.save();
  ctx.setTransform(US, 0, 0, US, 0, 0);
  light.k = US;
  if (t < T.open + 0.6) {
    drawCold(t);
    drawDock(t, sprite);
  }
  if (t >= T.open) {
    // the app window grows out of the dock icon
    const p = outBack(span(t, T.open, T.open + 0.55), 1.25);
    const x = lerp(KORAH_ICON.x - 9, 0, p), y = lerp(KORAH_ICON.y - 9, 0, p);
    const w = lerp(18, UW, p), h = lerp(18, UH, p);
    ctx.save();
    ctx.beginPath(); ctx.roundRect(x, y, w, h, lerp(5, 0, clamp01(p)));
    ctx.clip();
    ctx.translate(x, y); ctx.scale(w / UW, h / UH);
    drawKorah(t, sprite);
    ctx.restore();
  }
  drawCursor(t);
  ctx.restore();
  return canvas;
}

module.exports = { drawScreen, mascotFrame };
