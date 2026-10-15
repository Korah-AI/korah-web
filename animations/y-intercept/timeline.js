// Beat sheet shared by picture and sound. Times are seconds on the source narration,
// which plays unchanged, so the Desmos footage runs frame for frame with it.

const FPS = 30;
const DURATION = 84.869; // length of the narration track

const T = {
  cardIn: 0.0,        // problem card rises onto the page
  underline1: [7.2, 11.28],  // "the table shows ... values of g(x), where"
  eqRed: [11.46, 16.9],      // "where g(x) equals f(x) divided by x plus 3"
  underline2: [15.0, 16.78], // "and f is a linear function"
  underline3: [17.22, 20.94], // "What is the y-intercept ... xy-plane?"
  desmosIn: 21.0,     // window slides up from below and lands
  desmosLand: 21.72,
  aRed: 77.3,         // "(0, 36)": choice A turns red
  aCircle: 78.44,     // "making option A": red ring drawn around it
};

// Camera shots in order. Each move takes MOVE seconds (the Desmos entrance a bit longer).
// Shot framings and blur live in render.js.
const SHOTS = [
  [0.0, 'wide'],
  [6.0, 'question'],   // "The problem states"
  [11.4, 'equation'],  // "where g(x) equals f(x) divided by x plus 3"
  [15.0, 'ask'],       // "and f is a linear function. What is the y-intercept..."
  [21.0, 'desmos'],    // "Now the first thing we do..." window enters
  [22.6, 'table'],     // table row appears in Desmos, typing starts
  [44.5, 'regression'], // linear regression row appears
  [52.9, 'custom'],    // "Export as custom regression" opens the new row
  [59.95, 'graph'],    // rational curve lands on the graph
  [68.0, 'params'],    // "The regression parameters show m = 4 and b = 36"
  [76.1, 'choices'],   // "and the y-intercept is (0, 36), making option A..."
  [80.46, 'end'],      // outro, everything in view
];
const MOVE = 0.7;
const ENTER_MOVE = 0.8;

// captions: [start, end, text], phrase timings from a word-level transcript of the narration
const CAPTIONS = [
  [0.00, 2.54, "If you can solve this SAT problem,"],
  [2.54, 3.20, "then you're on track"],
  [3.20, 4.56, "to getting a 750 plus"],
  [4.56, 6.04, "on the math section."],
  [6.04, 7.20, "The problem states,"],
  [7.20, 9.04, "the table shows three values of x"],
  [9.04, 11.46, "and their corresponding values of g(x),"],
  [11.46, 12.56, "where g(x) equals"],
  [12.56, 15.00, "f(x) divided by x plus 3,"],
  [15.00, 17.22, "and f is a linear function."],
  [17.22, 18.32, "What is the y-intercept"],
  [18.32, 20.06, "of the graph y equals f(x)"],
  [20.06, 21.30, "in the xy-plane?"],
  [21.30, 22.36, "Now the first thing we do"],
  [22.36, 23.40, "to solve this problem"],
  [23.40, 25.02, "is to make a table on Desmos."],
  [25.02, 26.82, "Now according to the table"],
  [26.82, 28.25, "given in the problem,"],
  [28.40, 30.18, "x equals −27"],
  [30.18, 32.56, "corresponds to g(x) equals 3,"],
  [32.56, 34.32, "x equals −9"],
  [34.32, 35.92, "to g(x) equals 0,"],
  [35.92, 37.56, "and x equals 21"],
  [37.56, 39.34, "to g(x) equals 5."],
  [39.34, 40.86, "Now that we filled out the table,"],
  [40.86, 42.29, "we can create a regression."],
  [42.66, 44.24, "Now Desmos doesn't have an option"],
  [44.24, 45.54, "for a rational regression,"],
  [45.54, 46.74, "so what we can do instead"],
  [46.74, 48.18, "is click the three little dots"],
  [48.18, 49.62, "and click Export"],
  [49.62, 51.04, "as a custom regression."],
  [51.04, 52.32, "After creating"],
  [52.32, 53.90, "a custom regression model,"],
  [53.90, 54.94, "we can turn it into"],
  [54.94, 58.24, "y1 equals mx1 plus b"],
  [58.24, 60.52, "over x1 plus 3."],
  [60.52, 63.14, "mx1 plus b represents f(x),"],
  [63.14, 64.44, "so this regression model"],
  [64.44, 65.48, "is able to show both"],
  [65.48, 68.08, "g(x) and f(x) at once."],
  [68.08, 69.12, "The regression parameters"],
  [69.12, 70.78, "show that m equals 4"],
  [70.78, 72.54, "and b equals 36,"],
  [72.54, 73.84, "therefore f(x)"],
  [73.84, 76.12, "equals 4x plus 36,"],
  [76.12, 78.44, "and the y-intercept is (0, 36),"],
  [78.44, 79.30, "making option A"],
  [79.30, 80.46, "the correct answer choice."],
  [80.46, 82.20, "If you want to score a 1500"],
  [82.20, 83.78, "or higher on the SAT,"],
  [83.78, 84.87, "follow Korah.ai for more."],
];

module.exports = { FPS, DURATION, T, SHOTS, MOVE, ENTER_MOVE, CAPTIONS };
