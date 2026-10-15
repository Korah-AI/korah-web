// Shared beat sheet: the picture and the sound both read their timing from here.
const { rng } = require('./paper');

const T = {
  duration: 20,
  notify: 4.25,         // a reminder drops in on top of the feed
  glance: 4.6,          // eyes open and actually read it
  calendar: [4.95, 5.7],// camera drifts across to the calendar and back
  realise: 5.95,        // pause, eyes go wide
  bolt: 6.4,            // sits up, blanket flies off
  flip: 6.54,           // head swings from facing the ceiling to facing the room
  edge: 7.0,            // hips slide to the edge of the bed, feet find the floor
  stand: 7.55,
  walk: [7.95, 9.6],
  lamp: 9.78,           // desk lamp clicks on
  sit: 10.25,
  open: 10.95,          // Korah opens, the screen turns from cold blue to gold
  cards: [11.55, 12.3, 13.05],
  focus: 13.5,          // posture straightens
  settle: 14.2,
  fade: [14.9, 15.65],
  line1: 15.8,          // "Stop doomscrolling..."
  swap: 17.35,
  line2: 17.6,          // "Scroll problems on Korah instead"
  store: 18.8,
};

// The walk: 4 footfalls between the bed and the chair.
const STEP = 0.42;
const STEPS = [0, 1, 2, 3].map((i) => T.walk[0] + 0.18 + i * STEP);

// Thumb flicks while doomscrolling.
const SWIPES = [0.55, 1.35, 2.2, 3.05, 3.8];

// Short-video notifications drifting up out of the phone: [spawn time, body index].
const FEED_NOTIFS = [-1.1, -0.25, 0.6, 1.45, 2.3, 3.15].map((t, i) => [t, i]);
const NOTIF_LIFE = 3.6;

// House creaks and cricket bursts under the night.
function ambience() {
  const r = rng(7);
  const creaks = [];
  for (let t = 0.9; t < T.fade[0]; t += 2.6 + r() * 2.4) creaks.push([t, 60 + r() * 45, 0.7 + r() * 0.8]);
  const chirps = [];
  for (let t = 0.2; t < T.fade[0]; t += 0.28 + r() * 0.5) chirps.push([t, 3900 + r() * 1400, 0.5 + r() * 0.5]);
  return { creaks, chirps };
}
const AMB = ambience();

module.exports = { T, STEP, STEPS, SWIPES, FEED_NOTIFS, NOTIF_LIFE, AMB };
