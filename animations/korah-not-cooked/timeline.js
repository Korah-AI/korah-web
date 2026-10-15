// Shared beat sheet: the picture and the sound both read their timing from here.
const { rng, span, outCubic } = require('./paper');

const T = {
  duration: 24,
  submit: 1.6,          // test submitted, results replace the question
  reveal: 1.85,         // discouraging score shows
  sigh: 2.95,
  sheetSlip: 3.3,
  ballFall: 4.6,
  cursor: 6.0,          // cursor heads to the dock
  click: 6.65,          // Korah icon clicked
  open: 7.15,           // Korah window pops open
  cards: [8.2, 8.75, 9.3],
  badge: 8.55,          // score badge pops up from behind the laptop
  track: 8.95,
  ribbon: [9.2, 10.8],  // study plan ribbon unrolls
  count: [10.3, 13.0],  // score ticks up
  chime: 13.0,
  pullBack: 13.6,
  morning: [14.0, 16.4],
  clutter: 14.6,
  relief: 14.9,
  steam: 15.3,
  fade: [18.2, 19.2],
  title: 19.35,
  tag: 21.1,
};

// the crumpled test that rolls off the stack and drops to the floor
const BALL = { y0: 1200, floor: 1780, g: 5200, roll: 0.25 };
BALL.land = T.ballFall + BALL.roll + Math.sqrt((2 * (BALL.floor - BALL.y0)) / BALL.g);

const SCORE_FROM = 1040, SCORE_TO = 1450;
function score(t) {
  const p = outCubic(span(t, T.count[0], T.count[1]));
  return SCORE_FROM + Math.round(((SCORE_TO - SCORE_FROM) / 10) * p) * 10;
}

// Arrow-key answer changes on the last test question: [time, choice index]
const PICKS = [[0.35, 0], [0.62, 2], [0.88, 1], [1.12, 3], [1.36, 1]];

// Key presses: [time, hand]. Hand 0 = near, 1 = far.
function keypresses() {
  const r = rng(42);
  const out = [];
  const run = (a, b, pauses) => {
    let t = a;
    while (t < b) {
      out.push([t, r() < 0.55 ? 0 : 1]);
      t += 0.085 + r() * 0.11;
      if (pauses && r() < 0.12) t += 0.3 + r() * 0.35;
    }
  };
  for (const [t] of PICKS) out.push([t, 0]);
  run(8.3, 9.9, true);
  run(10.9, 12.8, true);
  return out;
}
const KEYS = keypresses();
const CLICKS = [T.submit, T.click];

module.exports = { T, BALL, score, KEYS, PICKS, CLICKS, SCORE_FROM, SCORE_TO };
