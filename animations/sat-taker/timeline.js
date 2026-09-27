// Shared beat sheet: picture, captions and sound all read their timing from here.
// Beats are placed on the narration (assets/narration.mp3), which starts at T.narr;
// cue times are video times, measured from the recording's phrases.
const { rng, span, outCubic } = require('../korah-not-cooked/paper');

const T = {
  duration: 33.75,
  narr: 0.6,                 // narration starts here
  groans: [3.1, 18.0],       // in the pauses after "habitat" and "perpetually low"
  scratch: [9.1, 11.0],      // "as it has for generations": hand to the back of the head
  tag: 11.3,                 // "its score...": the score sign unfolds
  glance: 15.0,              // "Its math score": the SAT Taker peeks up at the sign
  low: 16.7,                 // "perpetually low"
  slump: 18.75,              // "Its English score": the head starts to sink
  mash: 20.9,                // "even worse": face lands on the keyboard on "worse"
  croak: 21.6,               // the toucan weighs in, in the pause
  rustle: 21.75,
  emerge: 22.1,              // "But watch": friend pops out of the bush with the Mac
  look: 22.35,
  glow: 23.05,               // "an encounter with Korah AI": the screen lights up
  cards: [23.55, 23.9, 24.25],
  leanIn: 23.6,
  bloom: [26.3, 28.0],       // "a rare and remarkable adaptation"
  count: [27.3, 29.6],
  chime: 29.75,              // right after "adaptation"
  cheer: 29.8,
  lid: 29.9,                 // the old laptop snaps shut, forgotten
  fade: [30.85, 31.35],
  title: 31.4,
  endTag: 32.4,
};

// on-screen captions: [start, end, text]; *words* get the accent colour
const CAPTIONS = [
  [0.7, 3.2, 'Here, in its natural habitat...'],
  [3.8, 7.5, 'we observe the elusive *SAT Taker*.'],
  [7.8, 11.15, 'Struggling, as it has for generations,'],
  [11.25, 14.8, "its score just doesn't seem to improve."],
  [14.95, 18.1, 'Its math score: *perpetually low*.'],
  [18.7, 21.65, 'Its English score: *even worse*.'],
  [21.9, 22.95, 'But watch.'],
  [23.0, 25.8, 'An encounter with *Korah AI*.'],
  [26.2, 29.9, 'A rare and remarkable adaptation.'],
];

// typing, [start, end, slow?]: frantic, then a few sad pecks after "perpetually low"
const TYPING = [[0, 3.05], [3.85, 9.05], [11.3, 14.95], [17.2, 17.95, true]];

// key presses: [time, hand]; hand 0 = near, 1 = far
function keypresses() {
  const r = rng(42);
  const out = [];
  for (const [a, b, slow] of TYPING) {
    let t = a + 0.05;
    while (t < b) {
      out.push([t, r() < 0.55 ? 0 : 1]);
      t += slow ? 0.35 + r() * 0.3 : 0.07 + r() * 0.09;
      if (!slow && r() < 0.08) t += 0.25 + r() * 0.3;
    }
  }
  return out;
}
const KEYS = keypresses();

const SCORE_FROM = 1250, SCORE_TO = 1450;
function score(t) {
  const p = outCubic(span(t, T.count[0], T.count[1]));
  return SCORE_FROM + Math.round(((SCORE_TO - SCORE_FROM) / 10) * p) * 10;
}

// sparkles around the glowing Mac: [time, x, y, size] in laptop-local units
function sparkles() {
  const r = rng(77);
  const out = [];
  for (let i = 0; i < 14; i++) out.push([T.glow + i * 0.025, (r() - 0.5) * 380, -70 + (r() - 0.5) * 260, 0.8 + r() * 0.7]);
  for (let t = T.glow + 0.6; t < T.fade[0]; t += 0.16 + r() * 0.2) out.push([t, (r() - 0.5) * 340, -80 + (r() - 0.5) * 240, 0.5 + r() * 0.6]);
  return out;
}
const SPARKS = sparkles();

module.exports = { T, CAPTIONS, KEYS, score, SCORE_FROM, SCORE_TO, SPARKS };
