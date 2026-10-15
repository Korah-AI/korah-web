// Beat sheet shared by picture and sound. Times are seconds on the source narration,
// which plays unchanged, so the Desmos footage runs frame for frame with it.

const FPS = 30;
const DURATION = 76.0918; // length of the narration track

const T = {
  cardIn: 0.0,          // problem card rises onto the page
  hl1: [7.98, 10.20],   // "a machine launches a softball from ground level"
  hl2: [10.48, 18.00],  // "the softball reaches a max height of 51.84 ... at 3.6 seconds"
  hl3: [18.52, 24.20],  // "which equation represents the height above h ... after it is launched"
  desmosIn: 30.90,      // window slides up from below and lands
  desmosLand: 31.70,
  strike: [51.90, 52.35], // "option a and b": A then B crossed out
  dRed: 71.05,          // "making option d"
  dRing: 71.95,         // ring drawn round D
};

// Desmos moments that get their own mechanical sound: a click for a menu or a row,
// a run of key ticks while something is typed. Read off the panel-diff scan.
const CLICKS = [32.65, 34.05, 41.55, 42.70, 44.10, 52.50];
const TYPE = [[35.00, 39.20], [53.95, 59.10], [60.60, 61.00], [62.30, 62.72]];

// Camera shots in order. Each move takes MOVE seconds (the Desmos entrance a bit longer).
// Shot framings and blur live in render.js.
const SHOTS = [
  [0.0, 'wide'],
  [6.50, 't1'],       // "this problem states, a machine launches a softball from ground level"
  [10.30, 't2'],      // "the softball reaches a max height of 51.84 meters ..."
  [18.40, 't3'],      // "which equation represents the height above h, in meters ..."
  [24.40, 'choices'], // "now remember that a ball takes the path of a parabola when thrown"
  [30.90, 'desmos'],  // "to find our function we can create a table on Desmos" window enters
  [33.00, 'table'],   // "+" menu, table created, 1.8 / 51.84 and 3.6 / 0 typed
  [41.40, 'reg'],     // linear regression row appears, then the type dropdown
  [47.30, 'eqn'],     // "since the leading coefficient of the regression is negative 16"
  [50.80, 'rule'],    // "we can rule out option a and b": back to the card, A and B struck
  [53.30, 'custom'],  // "a new regression in the form of y1 = -16(x1 - 1.8)^2 + b", typed
  [60.55, 'graph'],   // the parabola forms, vertex sitting on the x-axis at t = 1.8
  [62.20, 'param'],   // "b equals 51.84": the regression parameter appears
  [65.30, 'row'],     // "meaning y1 equals -16 times x1 minus 1.8 squared plus 51.84"
  [70.90, 'answer'],  // "making option d the correct answer"
  [73.20, 'end'],     // outro, the page and the Desmos window together
];
const MOVE = 0.7;
const ENTER_MOVE = 0.8;

// captions: [start, end, text], phrase timings from a word-level transcript of the narration
const CAPTIONS = [
  [0.00, 1.66, "The best strategy for word problems"],
  [1.66, 3.10, "on the SAT math section"],
  [3.10, 4.32, "is to ignore all the fluff"],
  [4.32, 5.70, "and use Desmos."],
  [5.70, 6.58, "For example,"],
  [6.58, 7.98, "this problem states,"],
  [7.98, 9.42, "a machine launches a softball"],
  [9.42, 10.48, "from ground level."],
  [10.48, 12.00, "The softball reaches a max height"],
  [12.00, 13.64, "of 51.84 meters"],
  [13.64, 15.72, "above the ground at 1.8 seconds"],
  [15.72, 16.88, "and hits the ground"],
  [16.88, 18.52, "at 3.6 seconds."],
  [18.52, 19.68, "Which equation represents"],
  [19.68, 21.68, "the height above h, in meters,"],
  [21.68, 23.22, "of the softball t seconds"],
  [23.22, 24.56, "after it is launched."],
  [24.56, 25.56, "Now remember that a ball"],
  [25.56, 26.86, "takes the path of a parabola"],
  [26.86, 27.90, "when thrown, so we need"],
  [27.90, 29.04, "to make a quadratic function"],
  [29.04, 30.98, "with height as a function of time."],
  [30.98, 31.80, "To find our function"],
  [31.80, 33.40, "we can create a table on Desmos"],
  [33.40, 35.06, "with x1 representing t"],
  [35.06, 36.98, "and y1 representing h."],
  [36.98, 38.42, "We can then add 1.8"],
  [38.42, 40.10, "and 3.6 as x values"],
  [40.10, 42.30, "and have 51.84 and 0"],
  [42.30, 44.16, "as their corresponding y values"],
  [44.16, 45.28, "respectively."],
  [45.28, 45.90, "We can then make"],
  [45.90, 47.38, "a quadratic regression."],
  [47.38, 48.62, "Since the leading coefficient"],
  [48.62, 50.84, "of the regression is negative 16,"],
  [50.84, 51.64, "we can rule out"],
  [51.64, 52.54, "option a and b,"],
  [52.54, 53.28, "and we can make"],
  [53.28, 54.86, "a new regression in the form of"],
  [54.86, 56.84, "y1 equals negative 16"],
  [56.84, 59.08, "times x1 minus 1.8 squared"],
  [59.08, 59.66, "plus b,"],
  [59.66, 60.70, "to deduce whether"],
  [60.70, 62.32, "c or d is correct."],
  [62.32, 63.96, "b equals 51.84,"],
  [63.96, 65.44, "meaning y1 equals"],
  [65.44, 66.72, "negative 16 times"],
  [66.72, 69.10, "x1 minus 1.8 squared"],
  [69.10, 71.02, "plus 51.84,"],
  [71.02, 72.10, "making option d"],
  [72.10, 73.24, "the correct answer."],
  [73.24, 74.22, "Follow Korah.ai"],
  [74.22, 76.09, "to get your dream SAT score."],
];

module.exports = { FPS, DURATION, T, CLICKS, TYPE, SHOTS, MOVE, ENTER_MOVE, CAPTIONS };
