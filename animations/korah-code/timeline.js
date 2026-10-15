// Shared beat sheet: picture and sound both read their timing from here.

const T = {
  duration: 28,

  // Beat 1 - pixels settle, the logo mark resolves
  b1: 0,
  markIn: 0.2,        // pixels sweep in from the edges and start snapping to the grid
  markSet: 1.55,       // last pixel lands
  markResolve: 1.75,   // pixel mark crossfades to the clean logo on a paper card
  title: 2.05,         // "Korah CODE" folds in letter by letter
  sub: 3.05,           // the internship line wipes in
  b1Out: 5.15,         // pixel wipe across the frame
  b1End: 5.7,

  // Beat 2 - ink screen, pixels assemble into die-cut letters
  b2: 5.7,
  joinIn: 5.95,        // scattered pixels flicker in
  joinResolve: 7.15,   // they resolve into "JOIN AN AI STARTUP"
  b2Out: 9.5,
  b2End: 10.05,

  // Beat 3 - the desk, then the world map
  b3: 10.05,
  codeScroll: 10.45,   // pixel code runs on the tiny screen
  lift: 11.75,         // the code pixels lift off the screen and swirl out
  mapResolve: 12.95,   // they resolve into the paper-cut world map
  dots: 13.25,         // glowing dots ripple outward across it
  stat1: 13.55,        // "100,000+ reached online"
  stat2: 14.85,        // "Hundreds of active users"
  stat3: 16.15,        // "Growing daily"
  b3Out: 17.15,
  b3End: 17.7,

  // Beat 4 - typing builds the interface
  b4: 17.7,
  typeFrom: 17.95,     // first keystroke
  typeTo: 20.2,        // last keystroke
  uiGlow: 21.2,        // the finished interface lights up, once the last piece has landed
  pullBack: 21.45,     // camera pulls back, the student stands up beside it
  team: 22.5,          // "Become part of the team."
  b4Out: 24.0,
  b4End: 24.5,

  // End card
  endFold: 24.5,       // cream paper layers fold in
  endMark: 25.05,
  endTitle: 25.5,      // "Korah CODE"
  endUrl: 26.15,       // "Apply now at korah.app/code"
  endSpark: 26.85,
};

// Beat 4 keystrokes. Each one launches a pixel that unfolds into a piece of the UI.
const KEYS = [];
for (let i = 0; i < 13; i++) KEYS.push(T.typeFrom + i * ((T.typeTo - T.typeFrom) / 12));

// Which keystroke spawns a UI piece, and which piece. The rest are filler taps.
const UI_PIECES = [
  [1, 'frame'], [3, 'header'], [5, 'card'], [6, 'card2'],
  [8, 'chart'], [10, 'row'], [12, 'button'],
];

// Beat 3 dot ripple: each dot lights up when the ripple front passes it.
const RIPPLE = 2.0;   // seconds for the front to cross the map

module.exports = { T, KEYS, UI_PIECES, RIPPLE };
