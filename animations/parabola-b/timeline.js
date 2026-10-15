// Beat sheet shared by picture and sound. Times are seconds on the source narration,
// which plays unchanged, so the Desmos footage runs frame for frame with it.

const FPS = 30;
const DURATION = 42.0746; // length of the narration track

const T = {
  cardIn: 0.0,          // problem card rises onto the page
  hl1: [6.74, 8.72],    // "in the xy-plane, a line with equation"
  eq1Red: [8.72, 10.38],  // "2y equals 4.5"
  hl2: [10.38, 14.48],  // "intersects a parabola at exactly one point. If the parabola has equation"
  eq2Red: [14.48, 17.28], // "y equals negative 4x squared plus bx"
  hl3: [17.60, 20.38],  // "where b is a positive constant, what is the value of b?"
  desmosIn: 20.5,       // window slides up from below and lands
  desmosLand: 21.3,
  ansWrite: 37.70,      // "so the answer is": b = 6 written in red marker
  ansRing: 38.50,       // ring drawn around it
};

// Camera shots in order. Each move takes MOVE seconds (the Desmos entrance a bit longer).
// Shot framings and blur live in render.js.
const SHOTS = [
  [0.0, 'wide'],
  [5.0, 'intro'],      // "Alright, so the problem states, in the xy-plane..."
  [8.7, 'eq1'],        // "2y equals 4.5"
  [10.4, 'body'],      // "intersects a parabola at exactly one point. If the parabola has equation"
  [14.5, 'eq2'],       // "y equals negative 4x squared plus bx"
  [17.6, 'ask'],       // "where b is a positive constant, what is the value of b?"
  [20.5, 'desmos'],    // "All we have to do ... is graph the two functions." window enters
  [24.0, 'panel'],     // typing y = -4x^2 + bx, then the "add slider: b" chip
  [29.2, 'slider'],    // slider row appears at b = 1
  [30.5, 'graph'],     // the parabola narrows onto the line as b is dragged to 6
  [34.6, 'touch'],     // the single intersection, labelled (0.75, 2.25) at 35.2
  [37.0, 'answer'],    // back to the page: b = 6 written in
  [39.2, 'end'],       // outro, answer and graph together
];
const MOVE = 0.7;
const ENTER_MOVE = 0.8;

// captions: [start, end, text], phrase timings from a word-level transcript of the narration
const CAPTIONS = [
  [0.00, 1.18, "You actually don't need to do"],
  [1.18, 2.24, "any math to"],
  [2.24, 2.88, "solve this hard"],
  [2.88, 5.02, "module 2 SAT problem."],
  [5.02, 6.74, "Alright, so the problem states,"],
  [6.74, 7.84, "in the xy-plane,"],
  [7.84, 8.72, "a line with equation"],
  [8.72, 10.38, "2y = 4.5"],
  [10.38, 11.46, "intersects a parabola"],
  [11.46, 13.12, "at exactly one point."],
  [13.12, 14.48, "If the parabola has equation"],
  [14.48, 17.60, "y = −4x² + bx,"],
  [17.60, 19.32, "where b is a positive constant,"],
  [19.32, 20.88, "what is the value of b?"],
  [20.88, 21.78, "All we have to do"],
  [21.78, 22.68, "to solve this is"],
  [22.68, 24.32, "graph the two functions."],
  [24.32, 26.64, "Then, since constant b isn't defined,"],
  [26.64, 28.00, "we can add a slider for it"],
  [28.00, 28.90, "and slide it until"],
  [28.90, 30.58, "the parabola intersects the line"],
  [30.58, 32.44, "at exactly one point."],
  [32.44, 33.64, "As we can see,"],
  [33.64, 34.64, "there is one intersection"],
  [34.64, 35.90, "between the two functions"],
  [35.90, 37.20, "when b equals 6,"],
  [37.20, 39.06, "so the answer is 6."],
  [39.06, 39.98, "Follow Korah.ai"],
  [39.98, 40.84, "if you want to become"],
  [40.84, 42.07, "a Desmos master."],
];

module.exports = { FPS, DURATION, T, SHOTS, MOVE, ENTER_MOVE, CAPTIONS };
