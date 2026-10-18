// AP Precalculus free-response practice: eight original questions, one full set of four for
// each of the 2025 and 2026 released exams, each modeled on the released question with the
// same type, calculator rule, point total (6), and part structure.
const { draw } = require('../ap-mcq-build/diagram.cjs');
const { graph } = require('../ap-mcq-build/figures.cjs');
const { pt, part, tableFigure, text, fig } = require('./frq-helpers.cjs');

const BLUE = '#3b82f6';
const SG = year => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-precalculus.pdf`;
const modeled = (year, n, type) => ({ year, question: n, type, label: `${year} AP Precalculus Question ${n} (${type})`, url: SG(year) });

// Two cycles of a sinusoid with its dashed midline and five labeled points, no axes or scale.
// `start` is 'max' or 'min': where the graph begins.
function sinusoid(alt, start, labels) {
  const W = 400, mid = 90, amp = 55, x0 = 30, per = 170, sign = start === 'max' ? -1 : 1;
  let d = '';
  for (let i = 0; i <= 120; i++) { const x = x0 + (2 * per) * i / 120, y = mid + sign * amp * Math.cos(2 * Math.PI * (x - x0) / per); d += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; }
  const items = [['line', 20, mid - amp, W - 20, mid - amp, { color: BLUE, width: 1 }], ['line', 20, mid + amp, W - 20, mid + amp, { color: BLUE, width: 1 }], ['line', 20, mid, W - 20, mid, { dash: true, width: 1 }], ['path', d, { color: BLUE, width: 2.4 }]];
  labels.forEach((l, i) => {
    const x = x0 + i * per / 4, y = mid + sign * amp * Math.cos(2 * Math.PI * i / 4);
    items.push(['circle', x, y, 3.5, { fill: 'currentColor' }], text(x + (i % 2 ? 10 : 0), y + (y < mid ? -10 : y > mid ? 20 : -8), l, { italic: true, bold: true, anchor: i % 2 ? 'start' : 'middle' }));
  });
  return draw(W, 180, alt, items);
}

const frqs = [];

// ════════════════ Set modeled on the 2025 exam ════════════════

// ── 1. Function Concepts, calculator (2025 Q1) ──
frqs.push({
  id: 'precalc-fc-table-cubic', questionNumber: 1, title: 'A Table and a Cubic', topic: 'Function Concepts · Composition, inverses, zeros, and end behavior',
  modeledOn: modeled(2025, 1, 'Function Concepts'), timeAllottedMin: 15, calculatorAllowed: true,
  prompt: String.raw`The function \(f\) is increasing and is defined for \(x \ge 0\). The table gives values of \(f(x)\) at selected values of \(x\). The function \(g\) is given by \(g(x) = 0.5x^3 - 2x^2 + 1.2\).`,
  figures: [tableFigure('Table', ['x', 'f(x)'], [['0', '2'], ['1', '5'], ['2', '10'], ['3', '17'], ['4', '26']])],
  parts: [
    part('A', String.raw`(i) The function \(h\) is defined by \(h(x) = (g \circ f)(x) = g(f(x))\). Find the value of \(h(1)\), or indicate that it is not defined. Show the work that leads to your answer. (ii) Find the value of \(f^{-1}(10)\), or indicate that it is not defined.`, [
      pt('precalc-fc-table-cubic-a1', 'computation', String.raw`Finds \(h(1) = g(f(1)) = g(5) = 13.7\), with supporting work showing \(f(1) = 5\) or \(g(5)\).`, ['computes f(g(1))', 'gives the value without supporting work'], String.raw`\(h(1) = g(f(1)) = g(5) = 62.5 - 50 + 1.2 = 13.7\).`, String.raw`\(f(g(1)) = f(-0.3)\), not defined.`),
      pt('precalc-fc-table-cubic-a2', 'computation', String.raw`Finds \(f^{-1}(10) = 2\).`, ['reports f(10)', 'reports 1/10'], String.raw`From the table, \(f(2) = 10\), so \(f^{-1}(10) = 2\).`, String.raw`\(f^{-1}(10) = \tfrac{1}{10}\).`),
    ]),
    part('B', String.raw`(i) Find all values of \(x\), as decimal approximations, for which \(g(x) = 0\), or indicate that there are no such values. (ii) Determine the end behavior of \(g\) as \(x\) decreases without bound. Express your answer using the mathematical notation of a limit.`, [
      pt('precalc-fc-table-cubic-b1', 'computation', String.raw`Finds all three zeros: \(x \approx -0.713\) (or \(-0.714\)), \(0.876\) (or \(0.877\)), and \(3.836\) (or \(3.837\)).`, ['reports only one or two zeros', 'rounds to fewer than three decimal places'], String.raw`\(x = -0.713,\ 0.876,\ 3.836\).`, String.raw`\(x = 3.8\).`),
      pt('precalc-fc-table-cubic-b2', 'notation', String.raw`Writes \(\displaystyle\lim_{x \to -\infty} g(x) = -\infty\).`, ['writes x → ∞', 'describes the behavior in words only'], String.raw`\(\displaystyle\lim_{x \to -\infty} g(x) = -\infty\).`, String.raw`As \(x\) gets very negative, \(g\) goes down.`),
    ]),
    part('C', String.raw`(i) Based on the table, which of the following function types best models \(f\): linear, quadratic, exponential, or logarithmic? (ii) Give a reason for your answer based on the relationship between the change in the output values of \(f\) and the change in the input values of \(f\). Refer to values in the table.`, [
      pt('precalc-fc-table-cubic-c1', 'reasoning', 'Identifies quadratic.', ['identifies exponential because the values grow quickly'], 'Quadratic.', 'Exponential.'),
      pt('precalc-fc-table-cubic-c2', 'reasoning', 'Explains that over equal-length input intervals the first differences (3, 5, 7, 9) change by a constant amount (second differences all 2), so the rate of change changes at a constant rate.', ['refers only to a regression or r²', 'uses ratios'], 'Over input intervals of length 1, the output changes are 3, 5, 7, 9, which increase by 2 each time; constant second differences mean quadratic.', 'A quadratic regression fits best.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(h(1) = g(f(1)) = g(5) = 0.5(125) - 2(25) + 1.2 = 13.7\). (ii) \(f(2) = 10\), so \(f^{-1}(10) = 2\). B (i) \(x = -0.713,\ 0.876,\ 3.836\). (ii) \(\displaystyle\lim_{x \to -\infty} g(x) = -\infty\). C (i) Quadratic. (ii) On input intervals of length 1, the changes in output are 3, 5, 7, 9; these increase by a constant 2, so the second differences are constant and a quadratic model is best.`,
});

// ── 2. Modeling a Non-Periodic Context, calculator (2025 Q2) ──
frqs.push({
  id: 'precalc-np-reservoir', questionNumber: 2, title: 'Reservoir Level During a Drought', topic: 'Modeling a Non-Periodic Context · Quadratic model, secant line, and domain',
  modeledOn: modeled(2025, 2, 'Modeling a Non-Periodic Context'), timeAllottedMin: 15, calculatorAllowed: true,
  prompt: String.raw`During a drought, engineers record the depth of water in a reservoir. At \(t = 0\) months the depth was 120 feet, at \(t = 3\) months it was 105 feet, and at \(t = 6\) months it was 96 feet. The depth can be modeled by \(W(t) = at^2 + bt + c\), where \(W(t)\) is the depth in feet and \(t\) is measured in months.`,
  figures: [tableFigure('Table', ['t (months)', 'Depth (feet)'], [['0', '120'], ['3', '105'], ['6', '96']])],
  parts: [
    part('A', String.raw`(i) Use the given data to write three equations that can be used to find the values of \(a\), \(b\), and \(c\). (ii) Find the values of \(a\), \(b\), and \(c\) as decimal approximations.`, [
      pt('precalc-np-reservoir-a1', 'setup', String.raw`Writes three equations using the data: \(c = 120\), \(9a + 3b + c = 105\), \(36a + 6b + c = 96\).`, ['swaps inputs and outputs'], String.raw`\(a(0)^2 + b(0) + c = 120\), \(a(3)^2 + 3b + c = 105\), \(a(6)^2 + 6b + c = 96\).`, String.raw`\(120a + b + c = 0\).`),
      pt('precalc-np-reservoir-a2', 'computation', String.raw`Finds \(a \approx 0.333\), \(b = -6\), \(c = 120\).`, ['sign error on b'], String.raw`\(W(t) = 0.333t^2 - 6t + 120\).`, String.raw`\(a = -0.333\), \(b = 6\).`),
    ]),
    part('B', String.raw`(i) Use the given data to find the average rate of change of the depth, in feet per month, from \(t = 0\) to \(t = 6\). Show the computations. (ii) Use this average rate of change to estimate the depth at \(t = 2\). Show the work. (iii) Let \(A_t\) be the estimate of the depth found using the average rate of change from part B (i). Explain why \(A_t > W(t)\) for all \(t\) with \(0 < t < 6\). Refer to the graph of \(W\) and its relationship to \(A_t\).`, [
      pt('precalc-np-reservoir-b1', 'computation', String.raw`Computes \(\dfrac{96 - 120}{6 - 0} = -4\) feet per month, with a difference quotient shown.`, ['divides by 3', 'reports +4'], String.raw`\(\dfrac{W(6) - W(0)}{6 - 0} = \dfrac{-24}{6} = -4\).`, '−4 with no work.'),
      pt('precalc-np-reservoir-b2', 'computation', String.raw`Estimates \(120 + (-4)(2) = 112\) feet (or a value consistent with part B (i)).`, ['uses the model instead of the secant line'], String.raw`\(y = 120 - 4t\); at \(t = 2\), \(y = 112\).`, String.raw`\(W(2) = 109.333\).`),
      pt('precalc-np-reservoir-b3', 'reasoning', 'Explains that A_t lies on the secant line through (0, W(0)) and (6, W(6)), and since the graph of W is concave up on 0 < t < 6, the secant line lies above the graph.', ['says W is concave down', 'does not mention the secant line'], 'A_t is on the secant line from t = 0 to t = 6. W is concave up there (a > 0), so the secant line lies above the graph of W.', 'Because the depth is decreasing.'),
    ]),
    part('C', 'The quadratic model W has exactly one absolute minimum or absolute maximum. Engineers know that the depth cannot increase until the rainy season begins, after the time period being modeled. Explain how the minimum or maximum can be used to determine a boundary for the domain of W.', [
      pt('precalc-np-reservoir-c1', 'reasoning', String.raw`Explains that \(W\) has an absolute minimum (at \(t = 9\)) and increases afterward, but the depth cannot increase, so the domain must end at the time of the minimum.`, ['identifies a maximum', 'uses the zeros of W'], 'W decreases until its minimum at t = 9 and then increases. Since the depth cannot rise during the drought, the model applies only up to t = 9.', 'The depth cannot be negative.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(c = 120\); \(9a + 3b + c = 105\); \(36a + 6b + c = 96\). (ii) \(9a + 3b = -15\) and \(36a + 6b = -24\) give \(a = 0.333\), \(b = -6\), \(c = 120\). B (i) \(\dfrac{96 - 120}{6} = -4\) feet per month. (ii) \(120 - 4(2) = 112\) feet. (iii) \(A_t\) is on the secant line through \((0, W(0))\) and \((6, W(6))\). Because \(W\) is concave up on \(0 < t < 6\), the secant line lies above the graph of \(W\), so \(A_t > W(t)\). C \(W\) has an absolute minimum at \(t = 9\) and increases after it. The depth cannot increase during the drought, so the domain of \(W\) should have right endpoint \(t = 9\).`,
});

// ── 3. Modeling a Periodic Context, no calculator (2025 Q3) ──
frqs.push({
  id: 'precalc-p-buoy', questionNumber: 3, title: 'A Bobbing Buoy', topic: 'Modeling a Periodic Context · Sinusoidal model from a description',
  modeledOn: modeled(2025, 3, 'Modeling a Periodic Context'), timeAllottedMin: 15, calculatorAllowed: false,
  prompt: String.raw`A buoy bobs up and down on ocean waves. At time \(t = 0\) seconds, the buoy is at its lowest position, 0.8 meter below its average position. It rises to its highest position, 0.8 meter above its average position, and then returns to its lowest position. One full cycle takes 4 seconds. The sinusoidal function \(h\) models the buoy's position relative to its average position, in meters, at time \(t\) seconds. Positive values indicate positions above the average position.`,
  figures: [fig('Figure 1', sinusoid('Two full cycles of a sinusoidal graph with a dashed midline and no axes. It starts at a minimum labeled F, rises through the midline at G to a maximum J, falls through the midline at K, and reaches a minimum P', 'min', ['F', 'G', 'J', 'K', 'P']))],
  parts: [
    part('A', String.raw`The graph of \(h\) and its dashed midline for two full cycles is shown in Figure 1. Five points, F, G, J, K, and P, are labeled. No scale is indicated, and no axes are presented. Determine possible coordinates \((t, h(t))\) for the five points.`, [
      pt('precalc-p-buoy-a1', 'transformations', String.raw`Gives correct \(h(t)\)-coordinates: \(-0.8, 0, 0.8, 0, -0.8\).`, ['uses 1.6 as the amplitude'], 'F: −0.8, G: 0, J: 0.8, K: 0, P: −0.8.', 'F: 0, J: 1.6.'),
      pt('precalc-p-buoy-a2', 'transformations', String.raw`Gives correct \(t\)-coordinates: \(0, 1, 2, 3, 4\) (or shifted by a multiple of 4).`, ['spaces the points by 4 seconds'], 'F(0, −0.8), G(1, 0), J(2, 0.8), K(3, 0), P(4, −0.8).', 't = 0, 4, 8, 12, 16.'),
    ]),
    part('B', String.raw`The function \(h\) can be written in the form \(h(t) = a\sin(b(t + c)) + d\). Find values of the constants \(a\), \(b\), \(c\), and \(d\).`, [
      pt('precalc-p-buoy-b1', 'transformations', String.raw`Gives correct vertical transformations: \(a = 0.8\) with \(d = 0\) (or \(a = -0.8\), \(d = 0\)).`, ['uses d = 0.8'], String.raw`\(a = 0.8\), \(d = 0\).`, String.raw`\(a = 1.6\).`),
      pt('precalc-p-buoy-b2', 'transformations', String.raw`Gives correct horizontal transformations: \(b = \dfrac{\pi}{2}\) and \(c = -1\) (or \(c = 3\); with \(a = -0.8\), \(c = 1\)).`, ['uses b = 4'], String.raw`\(b = \dfrac{2\pi}{4} = \dfrac{\pi}{2}\), \(c = -1\): \(h(t) = 0.8\sin\left(\dfrac{\pi}{2}(t - 1)\right)\).`, String.raw`\(b = 4\).`),
    ]),
    part('C', String.raw`Refer to the graph in part A. The \(t\)-coordinate of G is \(t_1\), and the \(t\)-coordinate of J is \(t_2\). (i) On the interval \((t_1, t_2)\), which is true about \(h\)? (a) positive and increasing (b) positive and decreasing (c) negative and increasing (d) negative and decreasing. (ii) On \((t_1, t_2)\), describe the concavity of the graph of \(h\) and determine whether the rate of change of \(h\) is increasing or decreasing.`, [
      pt('precalc-p-buoy-c1', 'reasoning', 'Chooses (a): positive and increasing.', ['chooses negative because the buoy started below'], '(a) h is positive and increasing.', '(c) negative and increasing.'),
      pt('precalc-p-buoy-c2', 'reasoning', 'States that the graph is concave down and the rate of change of h is decreasing.', ['says increasing at an increasing rate', 'gives only one of the two descriptions'], 'Concave down; the rate of change of h is decreasing.', 'Concave down.'),
    ]),
  ],
  sampleResponse: String.raw`A F(0, −0.8), G(1, 0), J(2, 0.8), K(3, 0), P(4, −0.8). B \(a = 0.8\), \(b = \dfrac{2\pi}{4} = \dfrac{\pi}{2}\), \(c = -1\), \(d = 0\), so \(h(t) = 0.8\sin\left(\dfrac{\pi}{2}(t - 1)\right)\). C (i) (a) positive and increasing. (ii) The graph is concave down, and the rate of change of \(h\) is decreasing.`,
});

// ── 4. Symbolic Manipulations, no calculator (2025 Q4) ──
frqs.push({
  id: 'precalc-sm-logs-trig', questionNumber: 4, title: 'Logs, Sines, and Powers of 2', topic: 'Symbolic Manipulations · Equations and equivalent forms',
  modeledOn: modeled(2025, 4, 'Symbolic Manipulations'), timeAllottedMin: 15, calculatorAllowed: false,
  prompt: String.raw`Directions: Unless otherwise specified, the domain of a function is all real numbers for which it is defined, and angles are in radians. Give exact values for expressions that can be found without a calculator, combine terms using algebra and the rules for exponents and logarithms where applicable, and show the work that leads to each answer.`,
  parts: [
    part('A', String.raw`The functions \(g\) and \(h\) are given by \(g(x) = 3\log_2 x\) and \(h(x) = 4\sin^2 x\). (i) Solve \(g(x) = 9\) for values of \(x\) in the domain of \(g\). (ii) Solve \(h(x) = 3\) for values of \(x\) in the interval \(\left[0, \dfrac{\pi}{2}\right)\).`, [
      pt('precalc-sm-logs-trig-a1', 'manipulation', String.raw`Solves to \(x = 8\) with supporting work (\(\log_2 x = 3\), so \(x = 2^3\)).`, ['writes x = 3²', 'leaves 2³ unevaluated'], String.raw`\(\log_2 x = 3 \Rightarrow x = 2^3 = 8\).`, String.raw`\(x = 9\).`),
      pt('precalc-sm-logs-trig-a2', 'manipulation', String.raw`Solves to \(x = \dfrac{\pi}{3}\) with supporting work (\(\sin x = \pm\dfrac{\sqrt{3}}{2}\)).`, ['gives π/6', 'leaves sin⁻¹(√3/2)'], String.raw`\(\sin^2 x = \tfrac{3}{4} \Rightarrow \sin x = \tfrac{\sqrt{3}}{2} \Rightarrow x = \tfrac{\pi}{3}\).`, String.raw`\(x = \tfrac{\pi}{6}\).`),
    ]),
    part('B', String.raw`The functions \(j\) and \(k\) are given by \(j(x) = \ln x - 2\ln 3\) and \(k(x) = \dfrac{3(1 - \sin^2 x)}{\cos x}\). (i) Rewrite \(j(x)\) as a single natural logarithm without negative exponents, in the form \(\ln(\text{expression})\). (ii) Rewrite \(k(x)\) as an expression in which \(\cos x\) appears exactly once and no other trigonometric functions are involved.`, [
      pt('precalc-sm-logs-trig-b1', 'manipulation', String.raw`Writes \(j(x) = \ln\left(\dfrac{x}{9}\right)\).`, ['writes ln(x − 9)', 'writes ln(x · 3⁻²)'], String.raw`\(\ln x - \ln 9 = \ln\left(\dfrac{x}{9}\right)\).`, String.raw`\(\ln(x - 6)\).`),
      pt('precalc-sm-logs-trig-b2', 'manipulation', String.raw`Writes \(k(x) = 3\cos x\) using the Pythagorean identity, with supporting work.`, ['uses 1 − sin²x = sin²x'], String.raw`\(1 - \sin^2 x = \cos^2 x\), so \(k(x) = \dfrac{3\cos^2 x}{\cos x} = 3\cos x\).`, String.raw`\(k(x) = \dfrac{3}{\cos x}\).`),
    ]),
    part('C', String.raw`The function \(m\) is given by \(m(x) = 4^x - 6\cdot 2^x + 8\). Find all input values in the domain of \(m\) that yield an output value of 0.`, [
      pt('precalc-sm-logs-trig-c1', 'manipulation', String.raw`Rewrites in quadratic form with \(y = 2^x\) and factors: \((y - 2)(y - 4) = 0\).`, ['treats 4^x as 2·2^x'], String.raw`\((2^x)^2 - 6(2^x) + 8 = (2^x - 2)(2^x - 4) = 0\).`, String.raw`\(4^x = 2\cdot 2^x\).`),
      pt('precalc-sm-logs-trig-c2', 'computation', String.raw`Finds \(x = 1\) and \(x = 2\), with no incorrect values.`, ['reports only one value', 'reports y-values 2 and 4'], String.raw`\(2^x = 2 \Rightarrow x = 1\); \(2^x = 4 \Rightarrow x = 2\).`, String.raw`\(x = 2, 4\).`),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(3\log_2 x = 9 \Rightarrow \log_2 x = 3 \Rightarrow x = 8\). (ii) \(4\sin^2 x = 3 \Rightarrow \sin x = \pm\tfrac{\sqrt{3}}{2}\); in \([0, \tfrac{\pi}{2})\), \(x = \tfrac{\pi}{3}\). B (i) \(j(x) = \ln x - \ln 9 = \ln\left(\dfrac{x}{9}\right)\). (ii) \(k(x) = \dfrac{3\cos^2 x}{\cos x} = 3\cos x\). C Let \(y = 2^x\): \(y^2 - 6y + 8 = (y - 2)(y - 4) = 0\), so \(2^x = 2\) or \(2^x = 4\), giving \(x = 1\) and \(x = 2\).`,
});

// ════════════════ Set modeled on the 2026 exam ════════════════

// ── 5. Function Concepts, calculator (2026 Q1) ──
const fGraph = graph({ x: [-5, 5], y: [-2, 9], xstep: 1, ystep: 1, curves: [{ pts: [[-4, 8], [-2, 5], [0, 3], [2, 2], [4, -1]] }], dots: [[-4, 8], [-2, 5], [0, 3], [2, 2], [4, -1]].map(([x, y]) => ({ x, y })), w: 340, h: 320, alt: 'Graph of f consisting of four line segments connecting the points (−4, 8), (−2, 5), (0, 3), (2, 2), and (4, −1); f is decreasing on its domain −4 ≤ x ≤ 4' });
frqs.push({
  id: 'precalc-fc-graph-exp', questionNumber: 1, title: 'A Decreasing Graph and an Exponential', topic: 'Function Concepts · Composition, invertibility, and limits',
  modeledOn: modeled(2026, 1, 'Function Concepts'), timeAllottedMin: 15, calculatorAllowed: true,
  prompt: String.raw`The graph of the decreasing function \(f\) on its domain \(-4 \le x \le 4\) consists of four line segments, as shown in Figure 1. The function \(g\) is given by \(g(x) = 1.7 - e^{0.4x}\).`,
  figures: [fig('Figure 1: Graph of f', fGraph)],
  parts: [
    part('A', String.raw`(i) The function \(h\) is defined by \(h(x) = g(f(x))\). Find the value of \(h(2)\) as a decimal approximation, or indicate that it is not defined. Show the work. (ii) Find all values of \(x\) for which \(f(x) = 5\), or indicate that there are no such values.`, [
      pt('precalc-fc-graph-exp-a1', 'computation', String.raw`Finds \(h(2) = g(f(2)) = g(2) \approx -0.525\) (or \(-0.526\)), with supporting work.`, ['computes f(g(2))', 'rounds to −0.53'], String.raw`\(h(2) = g(2) = 1.7 - e^{0.8} \approx -0.525\).`, String.raw`\(-0.53\).`),
      pt('precalc-fc-graph-exp-a2', 'computation', String.raw`Finds \(x = -2\).`, ['reports f(5)'], String.raw`From the graph, \(f(-2) = 5\), so \(x = -2\).`, 'Not defined.'),
    ]),
    part('B', String.raw`(i) Find all values of \(x\), as decimal approximations, for which \(g(x) = -3\), or indicate that there are no such values. (ii) Determine the behavior of \(g\) as \(x\) decreases without bound. Express your answer using the mathematical notation of a limit.`, [
      pt('precalc-fc-graph-exp-b1', 'computation', String.raw`Finds \(x \approx 3.868\) (or \(3.869\)).`, ['solves e^(0.4x) = −4.7'], String.raw`\(e^{0.4x} = 4.7 \Rightarrow x = \dfrac{\ln 4.7}{0.4} \approx 3.869\).`, 'No solution.'),
      pt('precalc-fc-graph-exp-b2', 'notation', String.raw`Writes \(\displaystyle\lim_{x \to -\infty} g(x) = 1.7\).`, ['writes −∞ as the limit value', 'uses x → ∞'], String.raw`\(\displaystyle\lim_{x \to -\infty} g(x) = 1.7\).`, String.raw`\(\displaystyle\lim_{x \to -\infty} g(x) = -\infty\).`),
    ]),
    part('C', String.raw`(i) Is the function \(f\) invertible? (ii) Give a reason for your answer based on properties of \(f\). Refer to points on the graph of \(f\).`, [
      pt('precalc-fc-graph-exp-c1', 'reasoning', 'Answers yes.', ['answers no because the graph is made of segments'], 'Yes.', 'No.'),
      pt('precalc-fc-graph-exp-c2', 'reasoning', 'Explains that f is decreasing on its whole domain, so no two inputs share an output, citing points on the graph (for example, outputs fall from 8 at x = −4 to −1 at x = 4 without repeating).', ['says only “passes the horizontal line test”'], 'f decreases from (−4, 8) through (0, 3) to (4, −1), so every output occurs for exactly one input.', 'It passes the horizontal line test.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(h(2) = g(f(2)) = g(2) = 1.7 - e^{0.8} \approx -0.525\). (ii) \(f(-2) = 5\), so \(x = -2\). B (i) \(1.7 - e^{0.4x} = -3 \Rightarrow e^{0.4x} = 4.7 \Rightarrow x \approx 3.869\). (ii) \(\displaystyle\lim_{x \to -\infty} g(x) = 1.7\). C (i) Yes. (ii) \(f\) is decreasing on its domain, falling from \((-4, 8)\) through \((0, 3)\) to \((4, -1)\), so no output value is repeated; each output comes from exactly one input.`,
});

// ── 6. Modeling a Non-Periodic Context, calculator (2026 Q2) ──
frqs.push({
  id: 'precalc-np-invasive-fish', questionNumber: 2, title: 'An Invasive Fish Population', topic: 'Modeling a Non-Periodic Context · Exponential model, secant line, and domain',
  modeledOn: modeled(2026, 2, 'Modeling a Non-Periodic Context'), timeAllottedMin: 15, calculatorAllowed: true,
  prompt: String.raw`An invasive fish species was discovered in a lake. Two years after the discovery (\(t = 2\)), biologists estimated 1.8 thousand fish; five years after the discovery (\(t = 5\)), they estimated 4.2 thousand fish. The population can be modeled by \(F(t) = ab^t\), where \(F(t)\) is the number of fish, in thousands, and \(t\) is the number of years since the discovery.`,
  parts: [
    part('A', String.raw`(i) Use the given data to write two equations that can be used to find the values of \(a\) and \(b\). (ii) Find the values of \(a\) and \(b\) as decimal approximations.`, [
      pt('precalc-np-invasive-fish-a1', 'setup', String.raw`Writes \(ab^2 = 1.8\) and \(ab^5 = 4.2\).`, ['writes 2ab = 1.8'], String.raw`\(ab^2 = 1.8\), \(ab^5 = 4.2\).`, String.raw`\(a + 2b = 1.8\).`),
      pt('precalc-np-invasive-fish-a2', 'computation', String.raw`Finds \(b \approx 1.326\) and \(a \approx 1.023\).`, ['takes the square root instead of the cube root'], String.raw`\(b^3 = \dfrac{4.2}{1.8} \Rightarrow b \approx 1.326\), \(a = \dfrac{1.8}{b^2} \approx 1.023\).`, String.raw`\(b = 1.528\).`),
    ]),
    part('B', String.raw`(i) Use the given data to find the average rate of change of the population, in thousands of fish per year, from \(t = 2\) to \(t = 5\). Show the computations. (ii) Use this average rate of change to estimate the population at \(t = 3\). (iii) Let \(A(t)\) be the estimate from the secant line through \((2, F(2))\) and \((5, F(5))\). It can be shown that \(A(3) > F(3)\). Use the secant line and the graph of \(F\) to explain why \(A(t) > F(t)\) for all \(t\) with \(2 < t < 5\).`, [
      pt('precalc-np-invasive-fish-b1', 'computation', String.raw`Computes \(\dfrac{4.2 - 1.8}{5 - 2} = 0.8\) thousand fish per year with a difference quotient.`, ['divides by 5'], String.raw`\(\dfrac{F(5) - F(2)}{5 - 2} = \dfrac{2.4}{3} = 0.8\).`, '0.8 with no work.'),
      pt('precalc-np-invasive-fish-b2', 'computation', String.raw`Estimates \(1.8 + 0.8(1) = 2.6\) thousand fish (or a value consistent with part B (i)).`, ['evaluates the model instead'], String.raw`\(y = 1.8 + 0.8(t - 2)\); at \(t = 3\), \(y = 2.6\).`, String.raw`\(F(3) \approx 2.387\).`),
      pt('precalc-np-invasive-fish-b3', 'reasoning', 'Explains that F is concave up (b > 1, its rate of change is increasing), so the secant line on 2 < t < 5 lies above the graph of F.', ['says F is concave down', 'does not reference the interval'], 'An increasing exponential with b > 1 is concave up, so on 2 < t < 5 the secant line lies above the graph and A(t) > F(t).', 'Exponentials grow fast.'),
    ]),
    part('C', 'Biologists estimate that the lake can support at most 20 thousand fish of this species. Explain how this information can be used to determine a domain limitation for the model F.', [
      pt('precalc-np-invasive-fish-c1', 'reasoning', String.raw`Explains that \(F\) increases without bound, but the population cannot exceed 20 thousand, so the model applies only for \(t \le k\), where \(F(k) = 20\) (\(k \approx 10.5\) years).`, ['uses a lower bound only', 'computes k incorrectly when included'], 'F keeps increasing, so the model can only apply until F(k) = 20, about k = 10.5 years; the domain is [0, k].', 'The population cannot be negative.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(ab^2 = 1.8\) and \(ab^5 = 4.2\). (ii) \(b^3 = \tfrac{4.2}{1.8}\), so \(b \approx 1.326\) and \(a = 1.8/b^2 \approx 1.023\). B (i) \(\dfrac{4.2 - 1.8}{5 - 2} = 0.8\) thousand fish per year. (ii) \(1.8 + 0.8(3 - 2) = 2.6\) thousand fish. (iii) \(F\) is an increasing exponential with \(b > 1\), so its graph is concave up; the secant line through \((2, F(2))\) and \((5, F(5))\) lies above the graph on \(2 < t < 5\), so \(A(t) > F(t)\). C \(F\) increases without bound, but the lake can hold at most 20 thousand fish, so the model only applies up to the time \(k\) with \(F(k) = 20\), about \(k = 10.53\) years.`,
});

// ── 7. Modeling a Periodic Context, no calculator (2026 Q3) ──
frqs.push({
  id: 'precalc-p-ferris-wheel', questionNumber: 3, title: 'A Ferris Wheel Seat', topic: 'Modeling a Periodic Context · Sinusoidal model of circular motion',
  modeledOn: modeled(2026, 3, 'Modeling a Periodic Context'), timeAllottedMin: 15, calculatorAllowed: false,
  prompt: String.raw`A Ferris wheel with radius 25 feet has its center 30 feet above the ground. It rotates at a constant rate, completing one revolution every 8 minutes. At time \(t = 0\) minutes, seat S is at the top of the wheel. The sinusoidal function \(h\) models the height of seat S above the ground, in feet, at time \(t\) minutes.`,
  figures: [fig('Figure 1', sinusoid('Two full cycles of a sinusoidal graph with a dashed midline and no axes. It starts at a maximum labeled F, falls through the midline at G to a minimum J, rises through the midline at K, and reaches a maximum P', 'max', ['F', 'G', 'J', 'K', 'P']))],
  parts: [
    part('A', String.raw`The graph of \(h\) and its dashed midline for two full cycles is shown in Figure 1. Five points, F, G, J, K, and P, are labeled. No scale is indicated, and no axes are presented. Determine possible coordinates \((t, h(t))\) for the five points.`, [
      pt('precalc-p-ferris-wheel-a1', 'transformations', String.raw`Gives correct \(h(t)\)-coordinates: 55, 30, 5, 30, 55.`, ['uses heights relative to the center (25, 0, −25)'], 'F: 55, G: 30, J: 5, K: 30, P: 55.', 'F: 25, G: 0, J: −25.'),
      pt('precalc-p-ferris-wheel-a2', 'transformations', String.raw`Gives correct \(t\)-coordinates: 0, 2, 4, 6, 8 (or shifted by a multiple of 8).`, ['spaces the points by 4 minutes'], 'F(0, 55), G(2, 30), J(4, 5), K(6, 30), P(8, 55).', 't = 0, 4, 8, 12, 16.'),
    ]),
    part('B', String.raw`The function \(h\) can be written in the form \(h(t) = a\sin(b(t + c)) + d\). Find values of the constants \(a\), \(b\), \(c\), and \(d\).`, [
      pt('precalc-p-ferris-wheel-b1', 'transformations', String.raw`Gives \(a = 25\) and \(d = 30\) (or \(a = -25\), \(d = 30\)).`, ['uses d = 0 or d = 55'], String.raw`\(a = 25\), \(d = 30\).`, String.raw`\(a = 55\), \(d = 0\).`),
      pt('precalc-p-ferris-wheel-b2', 'transformations', String.raw`Gives \(b = \dfrac{\pi}{4}\) and \(c = 2\) (or \(c = 2 + 8k\); with \(a = -25\), \(c = -2\)).`, ['uses b = 8'], String.raw`\(b = \dfrac{2\pi}{8} = \dfrac{\pi}{4}\), \(c = 2\): \(h(t) = 25\sin\left(\dfrac{\pi}{4}(t + 2)\right) + 30\).`, String.raw`\(b = 8\), \(c = 0\).`),
    ]),
    part('C', String.raw`Refer to the graph in part A. The \(t\)-coordinate of J is \(t_1\), and the \(t\)-coordinate of K is \(t_2\). (i) On the interval \((t_1, t_2)\), which is true about \(h\)? (a) positive and increasing (b) positive and decreasing (c) negative and increasing (d) negative and decreasing. (ii) On \((t_1, t_2)\), describe the concavity of the graph of \(h\) and determine whether the rate of change of \(h\) is increasing or decreasing.`, [
      pt('precalc-p-ferris-wheel-c1', 'reasoning', 'Chooses (a): positive and increasing (heights above the ground are positive).', ['chooses (c) by measuring from the center'], '(a) positive and increasing.', '(c) negative and increasing.'),
      pt('precalc-p-ferris-wheel-c2', 'reasoning', 'States that the graph is concave up and the rate of change of h is increasing.', ['says concave down', 'gives only one description'], 'Concave up; the rate of change of h is increasing.', 'Concave up.'),
    ]),
  ],
  sampleResponse: String.raw`A F(0, 55), G(2, 30), J(4, 5), K(6, 30), P(8, 55). B \(a = 25\), \(b = \dfrac{2\pi}{8} = \dfrac{\pi}{4}\), \(c = 2\), \(d = 30\), so \(h(t) = 25\sin\left(\dfrac{\pi}{4}(t + 2)\right) + 30\). C (i) (a) positive and increasing. (ii) The graph is concave up, and the rate of change of \(h\) is increasing.`,
});

// ── 8. Symbolic Manipulations, no calculator (2026 Q4) ──
frqs.push({
  id: 'precalc-sm-exp-trig', questionNumber: 4, title: 'Exponents, Logs, and a Double Angle', topic: 'Symbolic Manipulations · Equations and identities',
  modeledOn: modeled(2026, 4, 'Symbolic Manipulations'), timeAllottedMin: 15, calculatorAllowed: false,
  prompt: String.raw`Directions: Unless otherwise specified, the domain of a function is all real numbers for which it is defined, and angles are in radians. Give exact values for expressions that can be found without a calculator, combine terms using algebra and the rules for exponents and logarithms where applicable, and show the work that leads to each answer.`,
  parts: [
    part('A', String.raw`The functions \(g\) and \(h\) are given by \(g(x) = 9^x\) and \(h(x) = \log_5(2x + 1)\). (i) Solve \(g(x) = \dfrac{1}{27}\) for values of \(x\) in the domain of \(g\). (ii) Solve \(h(x) = 2\) for values of \(x\) in the domain of \(h\).`, [
      pt('precalc-sm-exp-trig-a1', 'manipulation', String.raw`Solves to \(x = -\tfrac{3}{2}\) with supporting work (rewriting both sides as powers of 3).`, ['writes 9^x = 27⁻¹ and stops', 'gets −3'], String.raw`\(3^{2x} = 3^{-3} \Rightarrow 2x = -3 \Rightarrow x = -\tfrac{3}{2}\).`, String.raw`\(x = -3\).`),
      pt('precalc-sm-exp-trig-a2', 'manipulation', String.raw`Solves to \(x = 12\) with supporting work.`, ['writes 2x + 1 = 10'], String.raw`\(2x + 1 = 5^2 = 25 \Rightarrow x = 12\).`, String.raw`\(x = 4.5\).`),
    ]),
    part('B', String.raw`The functions \(j\) and \(k\) are given by \(j(x) = (2^{x-1})^3 \cdot 2^x\) and \(k(x) = \dfrac{1 - \cos(2x)}{2\sin x}\). (i) Rewrite \(j(x)\) in the form \(2^{(\text{expression})}\). (ii) Rewrite \(k(x)\) as an expression in which \(\sin x\) appears exactly once and no other trigonometric functions are involved.`, [
      pt('precalc-sm-exp-trig-b1', 'manipulation', String.raw`Writes \(j(x) = 2^{4x - 3}\).`, ['writes 2^(3x − 1 + x)', 'multiplies exponents instead of adding'], String.raw`\(2^{3x - 3}\cdot 2^x = 2^{4x - 3}\).`, String.raw`\(2^{3x(x - 1)}\).`),
      pt('precalc-sm-exp-trig-b2', 'manipulation', String.raw`Writes \(k(x) = \sin x\) using \(1 - \cos(2x) = 2\sin^2 x\), with supporting work.`, ['uses cos(2x) = 2cos x'], String.raw`\(\dfrac{2\sin^2 x}{2\sin x} = \sin x\).`, String.raw`\(\dfrac{1 - 2\cos x}{2\sin x}\).`),
    ]),
    part('C', String.raw`The function \(m\) is given by \(m(x) = 4\sin^2(2x) - 3\). Find all input values in the interval \([0, \pi]\) that yield an output value of 0.`, [
      pt('precalc-sm-exp-trig-c1', 'manipulation', String.raw`Finds a correct value of \(2x\) (or \(x\)) for which \(\sin(2x) = \pm\dfrac{\sqrt{3}}{2}\), such as \(2x = \dfrac{\pi}{3}\).`, ['solves sin x instead of sin 2x'], String.raw`\(\sin(2x) = \pm\tfrac{\sqrt{3}}{2} \Rightarrow 2x = \tfrac{\pi}{3}\).`, String.raw`\(x = \tfrac{\pi}{3}\) only, from \(\sin x = \tfrac{\sqrt{3}}{2}\).`),
      pt('precalc-sm-exp-trig-c2', 'computation', String.raw`Gives all four values \(x = \dfrac{\pi}{6}, \dfrac{\pi}{3}, \dfrac{2\pi}{3}, \dfrac{5\pi}{6}\) with no incorrect values.`, ['misses the solutions from the negative root', 'includes values outside [0, π]'], String.raw`\(2x = \tfrac{\pi}{3}, \tfrac{2\pi}{3}, \tfrac{4\pi}{3}, \tfrac{5\pi}{3}\), so \(x = \tfrac{\pi}{6}, \tfrac{\pi}{3}, \tfrac{2\pi}{3}, \tfrac{5\pi}{6}\).`, String.raw`\(x = \tfrac{\pi}{6}, \tfrac{\pi}{3}\).`),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(3^{2x} = 3^{-3} \Rightarrow x = -\tfrac{3}{2}\). (ii) \(2x + 1 = 25 \Rightarrow x = 12\). B (i) \(j(x) = 2^{3x - 3}\cdot 2^x = 2^{4x - 3}\). (ii) \(k(x) = \dfrac{2\sin^2 x}{2\sin x} = \sin x\). C \(\sin^2(2x) = \tfrac{3}{4}\), so \(\sin(2x) = \pm\tfrac{\sqrt{3}}{2}\). For \(0 \le 2x \le 2\pi\): \(2x = \tfrac{\pi}{3}, \tfrac{2\pi}{3}, \tfrac{4\pi}{3}, \tfrac{5\pi}{3}\), so \(x = \tfrac{\pi}{6}, \tfrac{\pi}{3}, \tfrac{2\pi}{3}, \tfrac{5\pi}{6}\).`,
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'precalc-fc-table-cubic',
  transcript: String.raw`A (i) \(h(1) = g(f(1)) = g(5) = 13.7\). (ii) \(f^{-1}(10) = 2\).

B (i) The zeros are \(x = -0.713\), \(x = 0.876\), and \(x = 3.836\). (ii) As \(x\) goes to negative infinity, \(g\) goes to negative infinity.

C (i) Quadratic. (ii) The differences between outputs are 3, 5, 7, 9, which go up by 2 each time, so the second differences are constant.`,
  evidence: {
    'precalc-fc-table-cubic-a1': String.raw`\(h(1) = g(f(1)) = g(5) = 13.7\)`, 'precalc-fc-table-cubic-a2': String.raw`\(f^{-1}(10) = 2\)`,
    'precalc-fc-table-cubic-b1': String.raw`\(x = -0.713\), \(x = 0.876\), and \(x = 3.836\)`,
    'precalc-fc-table-cubic-c1': 'Quadratic.', 'precalc-fc-table-cubic-c2': 'differences between outputs are 3, 5, 7, 9, which go up by 2 each time',
  },
  missed: { 'precalc-fc-table-cubic-b2': String.raw`The end behavior is right, but this point requires limit notation: \(\displaystyle\lim_{x \to -\infty} g(x) = -\infty\). A description in words does not earn it.` },
  priorityFix: String.raw`When a part asks for “the mathematical notation of a limit,” write all four pieces: lim, the input approach (\(x \to -\infty\)), the function, and the value (\(-\infty\)).`,
  sampleResponseComparison: 'Parts A, B (i), and C match the sample response. In B (ii) the sample states the same behavior with limit notation.',
};

module.exports = { course: 'ap-precalculus', frqs, canned };
