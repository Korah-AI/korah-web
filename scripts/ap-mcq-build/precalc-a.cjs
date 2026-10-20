// AP Precalculus units 1–2: Polynomial and Rational Functions, and Exponential and
// Logarithmic Functions. Block format as in calculus.cjs:
// "@ unit | n (no calculator) or c (graphing calculator) | skill | optional figure key".
// Calculator questions have purely numerical choices; scripts/ap-mcq.test.cjs recomputes
// each key, in order, so keep calculator questions in the same order as that list.
const { graph, table } = require('./figures.cjs');

const PINK = '#ec4899';
const m = v => String.raw`\(${v}\)`;
const quartic = x => 0.1 * (x + 3) * (x - 1) ** 2 * (x - 4);

const figures = {
  quartic: graph({ x: [-4, 5], y: [-6, 7], ylabel: 'p(x)', curves: [{ fn: quartic, from: -3.4, to: 4.6 }], dots: [{ x: -3, y: 0 }, { x: 1, y: 0 }, { x: 4, y: 0 }],
    alt: 'Graph of a polynomial p. It falls from the upper left, crosses the x-axis at x = −3, reaches a minimum near (−1.4, −5), rises to touch the x-axis at x = 1 without crossing, falls to a minimum near (3.1, −2.4), and rises across the x-axis at x = 4 toward the upper right' }),
  rateGraph: graph({ x: [0, 7], y: [0, 9], ylabel: 'f(x)', curves: [{ pts: [[0, 1], [2, 5], [3, 5], [5, 8], [6, 2]] }], dots: [[0, 1], [2, 5], [3, 5], [5, 8], [6, 2]].map(([x, y]) => ({ x, y })),
    alt: 'Graph of f, made of line segments joining the points (0, 1), (2, 5), (3, 5), (5, 8), and (6, 2)' }),
  rational: graph({ x: [-4, 6], y: [-4, 6], ylabel: 'r(x)', curves: [{ fn: x => (x - 3) / (x - 2), from: -4, to: 1.8 }, { fn: x => (x - 3) / (x - 2), from: 2.2, to: 6 }, { pts: [[2, -4], [2, 6]], dash: true, color: PINK }, { pts: [[-4, 1], [6, 1]], dash: true, color: PINK }],
    dots: [{ x: -1, y: 4 / 3, open: true }, { x: 3, y: 0 }],
    alt: 'Graph of a rational function r. It has a vertical asymptote at x = 2 and a horizontal asymptote at y = 1, both dashed. The graph has an open circle (a hole) at (−1, 4/3) and crosses the x-axis at (3, 0)' }),
  transform: graph({ x: [-4, 6], y: [-3, 5], ylabel: 'y', curves: [{ pts: [[-3, 0], [-1, 2], [1, 2], [2, 0]] }, { pts: [[-1, 3], [1, -1], [3, -1], [4, 3]], color: PINK }],
    notes: [{ x: -3.6, y: 0.5, text: 'f' }, { x: 4.15, y: 3.2, text: 'g' }],
    alt: 'Graphs of two functions made of line segments. Function f joins (−3, 0), (−1, 2), (1, 2), and (2, 0). Function g joins (−1, 3), (1, −1), (3, −1), and (4, 3)' }),
  diffs: table([m('x'), ...[0, 1, 2, 3, 4, 5].map(m)], [[m('h(x)'), ...[4, 7, 12, 19, 28, 39].map(m)]], 'Table of values: h(0) = 4, h(1) = 7, h(2) = 12, h(3) = 19, h(4) = 28, and h(5) = 39'),
  tandem: table([m('t') + ' (years)', ...[0, 2, 4, 6, 8].map(m)], [[m('P(t)') + ' (thousands)', ...[10, 14, 17, 19, 20].map(m)]], 'Table of a town\'s population P, in thousands, at t = 0, 2, 4, 6, and 8 years: 10, 14, 17, 19, and 20'),
  signs: table([m('x'), ...[-3, -2, -1, 0, 1, 2, 3].map(m)], [[m('q(x)'), ...[-14, 3, 2, -1, 1, -2, 9].map(m)]], 'Table of values of a polynomial q: q(−3) = −14, q(−2) = 3, q(−1) = 2, q(0) = −1, q(1) = 1, q(2) = −2, q(3) = 9'),
  concave: graph({ x: [0, 8], y: [0, 8], ylabel: 'g(x)', curves: [{ fn: x => 8 * (1 - Math.exp(-x / 2.5)), from: 0, to: 8 }], dots: [{ x: 1, y: 8 * (1 - Math.exp(-0.4)) }, { x: 5, y: 8 * (1 - Math.exp(-2)) }],
    alt: 'Graph of g on the interval from 0 to 8. The graph increases throughout, rising steeply at first and then leveling off, so it is concave down. Points are marked at x = 1 and x = 5' }),

  expPoints: graph({ x: [-1, 4], y: [0, 26], ystep: 4, ylabel: 'f(x)', curves: [{ fn: x => 3 * 2 ** x, from: -1, to: 3.1 }], dots: [{ x: 0, y: 3 }, { x: 2, y: 12 }],
    alt: 'Graph of an increasing exponential function f passing through the points (0, 3) and (2, 12), with the x-axis as a horizontal asymptote on the left' }),
  semilog: graph({ x: [0, 6], y: [0, 5], ylabel: 'ln y', curves: [{ pts: [[0, 1], [6, 4]] }], dots: [{ x: 0, y: 1 }, { x: 2, y: 2 }, { x: 4, y: 3 }, { x: 6, y: 4 }],
    alt: 'Semi-log plot of data, with ln y on the vertical axis against x. The points (0, 1), (2, 2), (4, 3), and (6, 4) lie on a straight line' }),
  residuals: graph({ x: [0, 9], y: [-3, 3], ylabel: 'residual', dots: [[1, 2.2], [2, 0.8], [3, -0.4], [4, -1.3], [5, -1.6], [6, -1.2], [7, -0.3], [8, 1.1]].map(([x, y]) => ({ x, y })),
    alt: 'Residual plot for a linear model. The residuals are positive at x = 1 and 2, negative from x = 3 to 7, and positive again at x = 8, forming a U-shaped pattern' }),
  logGraph: graph({ x: [0, 10], y: [-2, 3], ylabel: 'y', curves: [{ fn: x => Math.log(x) / Math.log(3), from: 0.12, to: 10 }], dots: [{ x: 1, y: 0 }, { x: 3, y: 1 }, { x: 9, y: 2 }],
    alt: 'Graph of a logarithmic function y = log base b of x, passing through the points (1, 0), (3, 1), and (9, 2), with the y-axis as a vertical asymptote' }),
  compose: table([m('x'), ...[0, 1, 2, 3, 4].map(m)], [[m('f(x)'), ...[2, 4, 1, 0, 3].map(m)], [m('g(x)'), ...[3, 0, 4, 2, 1].map(m)]], 'Table of values. f(0) = 2, f(1) = 4, f(2) = 1, f(3) = 0, f(4) = 3. g(0) = 3, g(1) = 0, g(2) = 4, g(3) = 2, g(4) = 1'),
  seqs: table([m('n'), ...[1, 2, 3, 4].map(m)], [[m('a_n'), ...[5, 11, 17, 23].map(m)], [m('b_n'), ...[5, 15, 45, 135].map(m)]], 'Table of the first four terms of two sequences. Sequence a: 5, 11, 17, 23. Sequence b: 5, 15, 45, 135'),
};

const source = String.raw`
@ 1 | n | Rates of change | rateGraph
What is the average rate of change of \(f\) over the interval \(0\le x\le 5\)?
* \(\dfrac{7}{5}\)
- \(\dfrac{8}{5}\)
- \(\dfrac{5}{7}\)
- \(7\)
= The average rate of change is \(\dfrac{f(5)-f(0)}{5-0}=\dfrac{8-1}{5}=\dfrac{7}{5}\). Using \(\dfrac{f(5)}{5}\) gives \(\tfrac{8}{5}\), which ignores the starting value.

@ 1 | n | Rates of change | rateGraph
On which interval is the average rate of change of \(f\) negative?
* \([3,6]\)
- \([0,3]\)
- \([2,5]\)
- \([0,6]\)
= Over \([3,6]\) the function falls from \(5\) to \(2\), so the average rate of change is \(-1\). Over \([0,6]\) it rises from \(1\) to \(2\), a positive average rate even though \(f\) decreases at the end.

@ 1 | n | Rates of change | rateGraph
Which statement about \(f\) on the interval \(2<x<3\) is true?
* The rate of change of \(f\) is \(0\).
- \(f\) is increasing.
- \(f\) has a zero.
- The average rate of change of \(f\) is undefined.
= On \((2,3)\) the graph is a horizontal segment at \(y=5\), so \(f\) is constant and its rate of change is \(0\).

@ 1 | n | Change in tandem | concave
For the function \(g\) shown, which statement is true as \(x\) increases from \(0\) to \(8\)?
* \(g\) is increasing, and its rate of change is decreasing.
- \(g\) is increasing, and its rate of change is increasing.
- \(g\) is decreasing, and its rate of change is decreasing.
- \(g\) is increasing at a constant rate.
= The graph rises throughout but flattens, so it is concave down: the outputs increase while the rate of increase becomes smaller.

@ 1 | n | Rates of change | concave
For the function \(g\) shown, how does the average rate of change of \(g\) over \([1,3]\) compare with its average rate of change over \([5,7]\)?
* It is greater over \([1,3]\).
- It is greater over \([5,7]\).
- They are equal, because both intervals have length \(2\).
- It cannot be compared without a formula for \(g\).
= Because \(g\) is increasing and concave down, its rate of change decreases as \(x\) increases. Equal-length intervals farther right have smaller rises, so the earlier interval has the greater average rate.

@ 1 | n | Change in tandem | tandem
Based on the table, which statement best describes the town's population over the 8 years?
* It increases at a decreasing rate.
- It increases at an increasing rate.
- It increases at a constant rate.
- It decreases at a decreasing rate.
= The two-year changes are \(4, 3, 2, 1\). The population grows each period, but by less each time, so the rate of increase is decreasing.

@ 1 | n | Rates of change in quadratic functions | diffs
Which type of function best models the data in the table?
* Quadratic, because the second differences are constant
- Linear, because the first differences are constant
- Exponential, because the ratios of successive outputs are constant
- Cubic, because the third differences are constant and nonzero
= The first differences are \(3, 5, 7, 9, 11\), and their differences are all \(2\). Equally spaced inputs with constant second differences indicate a quadratic, here \(h(x)=x^2+2x+4\).

@ 1 | n | Rates of change in quadratic functions | diffs
For the quadratic function \(h\) in the table, what is the average rate of change of \(h\) over \([4,5]\)?
* \(11\)
- \(9\)
- \(2\)
- \(39\)
= The average rate of change over \([4,5]\) is \(h(5)-h(4)=39-28=11\). For a quadratic, these average rates over consecutive unit intervals increase by the constant second difference, \(2\).

@ 1 | n | Polynomial zeros | quartic
The graph shows a polynomial function \(p\). Which expression could define \(p(x)\)?
* \(0.1(x+3)(x-1)^2(x-4)\)
- \(0.1(x-3)(x+1)^2(x+4)\)
- \(0.1(x+3)(x-1)(x-4)\)
- \(-0.1(x+3)(x-1)^2(x-4)\)
= The graph crosses the \(x\)-axis at \(-3\) and \(4\) and touches it at \(1\), so \((x-1)\) has even multiplicity. Both ends rise, so the degree is even and the leading coefficient positive.

@ 1 | n | Polynomial zeros | quartic
What is the least possible degree of the polynomial \(p\) shown?
* \(4\)
- \(3\)
- \(5\)
- \(2\)
= The graph has zeros at \(-3\) and \(4\) (odd multiplicity, at least 1 each) and at \(1\) (even multiplicity, at least 2). That totals at least \(4\), which is consistent with both ends rising.

@ 1 | n | Polynomial functions and rates of change | quartic
How many points of inflection must the graph of \(p\) shown have?
* \(2\)
- \(1\)
- \(3\)
- \(0\)
= The graph is concave up near its left minimum, concave down near the local maximum at \(x=1\), and concave up again near its right minimum. Concavity changes twice.

@ 1 | n | Polynomial functions and rates of change | quartic
On which interval is the polynomial \(p\) shown both increasing and concave down?
* Between the left minimum and \(x=1\), after the left inflection point
- Between \(x=1\) and the right minimum
- To the left of \(x=-3\)
- To the right of \(x=4\)
= Increasing means the graph rises, and concave down means its rate of increase is falling. That happens just before the local maximum at \(x=1\), after the graph's concavity changes from up to down.

@ 1 | n | Polynomial zeros
The polynomial \(p\) has real coefficients, degree \(4\), and zeros \(2\) and \(3-i\). Which of the following must also be a zero of \(p\)?
* \(3+i\)
- \(-3+i\)
- \(-2\)
- \(i\)
= Nonreal zeros of polynomials with real coefficients come in conjugate pairs, so \(3+i\) is a zero. The fourth zero is real but is not determined by the information given.

@ 1 | n | Polynomial zeros | signs
Based on the table of values of the polynomial \(q\), what is the least number of real zeros \(q\) must have on \([-3,3]\)?
* \(5\)
- \(3\)
- \(6\)
- \(4\)
= Polynomials are continuous, so by the intermediate value theorem each sign change between consecutive table values guarantees a zero. The signs change between \(-3\) and \(-2\), \(-1\) and \(0\), \(0\) and \(1\), \(1\) and \(2\), and \(2\) and \(3\).

@ 1 | n | End behavior of polynomials
Which describes the end behavior of \(f(x)=-2x^5+7x^4+3\)?
* \(\displaystyle\lim_{x\to\infty}f(x)=-\infty\) and \(\displaystyle\lim_{x\to-\infty}f(x)=\infty\)
- \(\displaystyle\lim_{x\to\infty}f(x)=\infty\) and \(\displaystyle\lim_{x\to-\infty}f(x)=-\infty\)
- Both limits are \(-\infty\).
- Both limits are \(\infty\).
= The leading term \(-2x^5\) determines end behavior. An odd-degree term with a negative coefficient falls to the right and rises to the left.

@ 1 | n | Polynomial functions
A polynomial \(f\) of degree \(5\) has real coefficients. Which of the following could be the number of its real zeros, counted without multiplicity?
* \(3\)
- \(0\)
- \(6\)
- \(-1\)
= An odd-degree polynomial must cross the \(x\)-axis at least once, so it has at least one real zero, and it cannot have more than \(5\). Nonreal zeros come in pairs, but repeated real zeros allow counts of \(1\) through \(5\).

@ 1 | n | Even and odd functions
Which of the following functions is odd?
* \(f(x)=x^3-4x\)
- \(f(x)=x^4-4x^2\)
- \(f(x)=x^3-4\)
- \(f(x)=(x-1)^3\)
= A function is odd if \(f(-x)=-f(x)\). For \(x^3-4x\), \(f(-x)=-x^3+4x=-f(x)\). The constant term in \(x^3-4\) breaks the symmetry, and \(x^4-4x^2\) is even.

@ 1 | n | Rational functions | rational
Which expression could define the function \(r\) shown?
* \(r(x)=\dfrac{(x+1)(x-3)}{(x+1)(x-2)}\)
- \(r(x)=\dfrac{x-3}{x-2}\)
- \(r(x)=\dfrac{(x+1)(x-2)}{(x+1)(x-3)}\)
- \(r(x)=\dfrac{(x-1)(x-3)}{(x-1)(x-2)}\)
= The common factor \(x+1\) creates a hole at \(x=-1\), while \(x-2\) remaining in the denominator gives the vertical asymptote. The zero at \(x=3\) and the horizontal asymptote \(y=1\) also match. The simplified form \(\dfrac{x-3}{x-2}\) would have no hole.

@ 1 | n | Holes in rational functions | rational
What is the \(y\)-coordinate of the hole in the graph of \(r\) shown?
* \(\dfrac{4}{3}\)
- \(0\)
- \(1\)
- It is undefined.
= After canceling \(x+1\), \(r(x)=\dfrac{x-3}{x-2}\) for \(x\ne -1\). Evaluating the simplified form at \(x=-1\) gives \(\dfrac{-4}{-3}=\dfrac{4}{3}\), the point the graph approaches.

@ 1 | n | Vertical asymptotes | rational
For the function \(r\) shown, which statement describes its behavior near \(x=2\)?
* \(\displaystyle\lim_{x\to 2^-}r(x)=\infty\) and \(\displaystyle\lim_{x\to 2^+}r(x)=-\infty\)
- \(\displaystyle\lim_{x\to 2^-}r(x)=-\infty\) and \(\displaystyle\lim_{x\to 2^+}r(x)=\infty\)
- \(\displaystyle\lim_{x\to 2}r(x)=1\)
- \(\displaystyle\lim_{x\to 2}r(x)=0\)
= For \(x\) slightly less than \(2\), \(x-3<0\) and \(x-2<0\), so \(r(x)\) is large and positive. For \(x\) slightly greater than \(2\), the denominator is positive and the numerator negative, so \(r(x)\to-\infty\).

@ 1 | n | End behavior of rational functions
What is the horizontal asymptote of \(f(x)=\dfrac{6x^3-5x+1}{2x^3+x^2-4}\)?
* \(y=3\)
- \(y=6\)
- \(y=0\)
- \(y=-\tfrac{1}{4}\)
= The numerator and denominator have the same degree, so the horizontal asymptote is the ratio of the leading coefficients, \(\dfrac{6}{2}=3\). The ratio of constant terms, \(-\tfrac{1}{4}\), is the \(y\)-intercept.

@ 1 | n | End behavior of rational functions
Which describes the end behavior of \(g(x)=\dfrac{x^2-3}{x+1}\)?
* \(g(x)\) behaves like \(x-1\), so it has a slant asymptote and no horizontal asymptote.
- \(g\) has the horizontal asymptote \(y=1\).
- \(g\) has the horizontal asymptote \(y=0\).
- \(g\) has the horizontal asymptote \(y=-3\).
= The numerator's degree is one more than the denominator's. Division gives \(x^2-3=(x+1)(x-1)-2\), so \(g(x)=x-1-\dfrac{2}{x+1}\), which approaches the line \(y=x-1\).

@ 1 | n | Rational functions
Which function has a vertical asymptote at \(x=4\), a hole at \(x=-2\), and a zero at \(x=1\)?
* \(f(x)=\dfrac{(x-1)(x+2)}{(x-4)(x+2)}\)
- \(f(x)=\dfrac{(x+1)(x-2)}{(x+4)(x-2)}\)
- \(f(x)=\dfrac{(x-1)(x-4)}{(x+2)(x-4)}\)
- \(f(x)=\dfrac{x-1}{(x-4)(x+2)}\)
= The factor \(x+2\) cancels, leaving a hole at \(-2\). The remaining denominator \(x-4\) gives the asymptote, and the remaining numerator \(x-1\) gives the zero.

@ 1 | n | Rational function zeros
On which intervals is \(f(x)=\dfrac{(x-3)(x+1)}{(x-1)^2}\) negative?
* \(-1<x<1\) and \(1<x<3\)
- \(x<-1\) and \(x>3\)
- \(-1<x<3\)
- \(1<x<3\) only
= The sign can change only at the zeros \(-1\) and \(3\) and at \(x=1\), where \(f\) is undefined. The squared denominator is always positive, so the sign comes from the numerator, which is negative between \(-1\) and \(3\), excluding \(x=1\).

@ 1 | n | Rational inequalities
What is the solution set of \(\dfrac{x+2}{x-5}\ge 0\)?
* \(x\le -2\) or \(x>5\)
- \(x\le -2\) or \(x\ge 5\)
- \(-2\le x<5\)
- \(x>5\) only
= The quotient is zero at \(x=-2\) and undefined at \(x=5\). Testing intervals shows it is positive for \(x<-2\) and \(x>5\). The endpoint \(-2\) is included, but \(5\) is not.

@ 1 | n | Polynomial division
What is the remainder when \(p(x)=2x^3-3x^2+x-5\) is divided by \(x-2\)?
* \(1\)
- \(-35\)
- \(5\)
- \(0\)
= By the remainder theorem, the remainder is \(p(2)=16-12+2-5=1\). Substituting \(-2\) instead gives \(-35\), which is the remainder for division by \(x+2\).

@ 1 | n | Polynomial division
If \(x+3\) is a factor of \(p(x)=x^3+kx^2-x-12\), what is the value of \(k\)?
* \(4\)
- \(-4\)
- \(\tfrac{4}{3}\)
- \(12\)
= By the factor theorem, \(p(-3)=0\): \(-27+9k+3-12=0\), so \(9k-36=0\) and \(k=4\). Then \(p(x)=(x+3)(x^2+x-4)\).

@ 1 | n | Binomial theorem
What is the coefficient of \(x^3\) in the expansion of \((2x-1)^5\)?
* \(80\)
- \(-80\)
- \(40\)
- \(10\)
= The term containing \(x^3\) is \(\binom{5}{3}(2x)^3(-1)^2=10\cdot 8x^3=80x^3\). The factor \((-1)^2\) is positive.

@ 1 | n | Equivalent representations
Which expression is equivalent to \(\dfrac{x^3-8}{x-2}\) for all \(x\ne 2\)?
* \(x^2+2x+4\)
- \(x^2-2x+4\)
- \(x^2+4\)
- \((x-2)^2\)
= The difference of cubes factors as \(x^3-8=(x-2)(x^2+2x+4)\), so the quotient is \(x^2+2x+4\) wherever \(x\ne 2\).

@ 1 | n | Transformations | transform
The graph of \(g\) is a transformation of the graph of \(f\). Which equation gives \(g\)?
* \(g(x)=-2f(x-2)+3\)
- \(g(x)=2f(x+2)-3\)
- \(g(x)=-2f(x+2)+3\)
- \(g(x)=-f(x-2)+3\)
= The point \((-3,0)\) on \(f\) moves to \((-1,3)\), and \((-1,2)\) moves to \((1,-1)\). A shift right \(2\) moves the \(x\)-values; then each output \(y\) becomes \(-2y+3\), which sends \(0\) to \(3\) and \(2\) to \(-1\).

@ 1 | n | Transformations
The graph of \(y=f(x)\) contains the point \((6,-4)\). Which point must be on the graph of \(y=3f\!\left(\tfrac{1}{2}x\right)+1\)?
* \((12,-11)\)
- \((3,-11)\)
- \((12,-13)\)
- \((3,-12)\)
= The input \(\tfrac{1}{2}x\) must equal \(6\), so \(x=12\). The output is \(3(-4)+1=-11\). A horizontal dilation by a factor of \(\tfrac{1}{2}\) inside the function stretches the graph horizontally by \(2\).

@ 1 | n | Transformations
The function \(f\) has domain \([-2,6]\) and range \([1,5]\). What are the domain and range of \(g(x)=f(x+3)-2\)?
* Domain \([-5,3]\), range \([-1,3]\)
- Domain \([1,9]\), range \([-1,3]\)
- Domain \([-5,3]\), range \([3,7]\)
- Domain \([-2,6]\), range \([-1,3]\)
= The graph shifts left \(3\), so each input decreases by \(3\), and down \(2\), so each output decreases by \(2\).

@ 1 | n | Function model selection
A ball is thrown upward, and its height is recorded every \(0.5\) second. The heights rise, reach a maximum, and fall, and the second differences of the data are nearly constant. Which model is most appropriate?
* A quadratic model
- A linear model
- An exponential model
- A rational model with a horizontal asymptote
= Constant second differences over equal input intervals indicate a quadratic. Physically, constant gravitational acceleration produces a parabolic height function.

@ 1 | n | Function model construction
A rectangular garden has a perimeter of \(40\) meters. Which function gives its area \(A\), in square meters, in terms of the length \(x\) of one side, and what is its domain?
* \(A(x)=x(20-x)\) for \(0<x<20\)
- \(A(x)=x(40-x)\) for \(0<x<40\)
- \(A(x)=x(20-x)\) for all real \(x\)
- \(A(x)=2x+2(20-x)\) for \(0<x<20\)
= The two sides sum to half the perimeter, \(20\), so the other side is \(20-x\). Both sides must be positive, which restricts \(x\) to \((0,20)\).

@ 1 | n | Function model construction
The cost of producing \(x\) items is \(C(x)=500+4x\) dollars. Which function gives the average cost per item, and what happens to it as \(x\) increases without bound?
* \(\dfrac{500+4x}{x}\), which approaches \(4\)
- \(\dfrac{500+4x}{x}\), which approaches \(0\)
- \(\dfrac{500+4x}{x}\), which increases without bound
- \(500+\dfrac{4}{x}\), which approaches \(500\)
= The average cost is \(\dfrac{C(x)}{x}=\dfrac{500}{x}+4\). As production grows, the fixed cost is spread over more items, so the average approaches the per-item cost of \(4\).

@ 1 | n | Polynomial inequalities
What is the solution set of \(x^3-4x>0\)?
* \(-2<x<0\) or \(x>2\)
- \(x<-2\) or \(0<x<2\)
- \(x>2\) only
- \(x<-2\) or \(x>2\)
= Factoring gives \(x(x-2)(x+2)>0\). Testing intervals between the zeros \(-2\), \(0\), and \(2\) shows the product is positive on \((-2,0)\) and \((2,\infty)\).

@ 1 | n | Polynomial functions
Which statement about \(f(x)=x^4-4x^2\) is true?
* \(f\) has a local maximum at \(x=0\) and two absolute minima.
- \(f\) has a local minimum at \(x=0\).
- \(f\) has exactly two real zeros.
- \(f\) is decreasing for all \(x>0\).
= \(f(x)=x^2(x^2-4)\) is even, with zeros at \(-2\), \(0\) (double), and \(2\). It is \(0\) at \(x=0\) and negative nearby, so \(x=0\) is a local maximum, with the absolute minima \(-4\) at \(x=\pm\sqrt{2}\).

@ 1 | n | Complex zeros
How many nonreal zeros does \(p(x)=x^4+5x^2+4\) have?
* \(4\)
- \(2\)
- \(0\)
- \(1\)
= Factoring gives \((x^2+1)(x^2+4)\), with zeros \(\pm i\) and \(\pm 2i\). Since \(p(x)\ge 4\) for all real \(x\), it has no real zeros.

@ 1 | n | Rates of change
The function \(f\) is increasing on \([a,b]\) and its graph is concave up there. Which statement must be true?
* The average rate of change of \(f\) over \([a,b]\) is positive, and the rate of change of \(f\) increases from \(a\) to \(b\).
- The rate of change of \(f\) decreases from \(a\) to \(b\).
- \(f(b)<f(a)\).
- The graph of \(f\) lies above its secant line on \([a,b]\).
= Increasing implies \(f(b)>f(a)\), so the average rate is positive. Concave up means the rate of change increases. A concave-up graph lies below, not above, its secant line.

@ 1 | n | Inverse of polynomial models
The function \(f(x)=(x-1)^2+3\) is not invertible on all real numbers. On which domain restriction does \(f\) have an inverse, and what is that inverse?
* \(x\ge 1\); \(f^{-1}(x)=1+\sqrt{x-3}\)
- \(x\ge 1\); \(f^{-1}(x)=1-\sqrt{x-3}\)
- \(x\ge 3\); \(f^{-1}(x)=3+\sqrt{x-1}\)
- \(x\ge 0\); \(f^{-1}(x)=\sqrt{x-3}+1\)
= Restricting to \(x\ge 1\), the right half of the parabola, makes \(f\) one-to-one. Solving \(y=(x-1)^2+3\) with \(x\ge 1\) gives \(x=1+\sqrt{y-3}\).

@ 1 | n | Rational function graphs
Which function has a graph that crosses its horizontal asymptote?
* \(f(x)=\dfrac{x^2-3x}{x^2+1}\)
- \(f(x)=\dfrac{1}{x-2}\)
- \(f(x)=\dfrac{x+4}{x-1}\)
- \(f(x)=\dfrac{3}{x^2+1}\)
= The asymptote of the first function is \(y=1\), and \(f(x)=1\) when \(x^2-3x=x^2+1\), at \(x=-\tfrac{1}{3}\). A horizontal asymptote describes end behavior only, so a graph can cross it. The others never reach their asymptotes.

@ 1 | n | Rates of change
For \(f(x)=x^2\), what is the average rate of change over \([a,a+h]\)?
* \(2a+h\)
- \(2a\)
- \(h\)
- \(2a+h^2\)
= \(\dfrac{(a+h)^2-a^2}{h}=\dfrac{2ah+h^2}{h}=2a+h\). As \(h\) shrinks, this approaches \(2a\), the rate of change at \(x=a\).

@ 1 | n | Function models
A company models profit by \(P(x)=-2x^2+40x-150\) thousand dollars, where \(x\) is the number of units sold, in thousands. What is the maximum profit?
* \(\$50{,}000\)
- \(\$10{,}000\)
- \(\$150{,}000\)
- \(\$200{,}000\)
= The vertex is at \(x=-\dfrac{40}{2(-2)}=10\), and \(P(10)=-200+400-150=50\) thousand dollars. The value \(10\) is the number of units, in thousands, that maximizes profit.

@ 1 | n | End behavior of polynomials
For \(p(x)=(3-x)(x+2)^2(2x+1)\), what is \(\displaystyle\lim_{x\to\infty}p(x)\)?
* \(-\infty\)
- \(\infty\)
- \(-4\)
- \(0\)
= The leading term is \((-x)(x^2)(2x)=-2x^4\), so the polynomial has even degree with a negative leading coefficient and falls on both ends.

@ 1 | n | Polynomial zeros
The polynomial \(f(x)=x^3-x^2-8x+12\) has a zero at \(x=2\). What are all of its zeros?
* \(2\) (with multiplicity \(2\)) and \(-3\)
- \(2\), \(3\), and \(-2\)
- \(2\) and \(-3\), each with multiplicity \(1\)
- \(2\), \(-2\), and \(-3\)
= Dividing by \(x-2\) gives \(x^2+x-6=(x+3)(x-2)\), so \(f(x)=(x-2)^2(x+3)\). The graph touches the \(x\)-axis at \(2\) and crosses at \(-3\).

@ 1 | c | Polynomial zeros
The function \(f(x)=x^3-2x-5\) has exactly one real zero. What is it, to the nearest thousandth?
* \(2.095\)
- \(2.236\)
- \(1.913\)
- \(2.381\)
= Graphing \(f\) and finding its \(x\)-intercept gives \(x\approx 2.095\). Since \(f(2)=-1\) and \(f(3)=16\), the zero lies between \(2\) and \(3\), closer to \(2\).

@ 1 | c | Polynomial extrema
What is the value of the local maximum of \(f(x)=0.5x^4-3x^2+x\)?
* \(0.084\)
- \(0.168\)
- \(-3.584\)
- \(1.732\)
= A calculator shows a local maximum near \(x\approx 0.168\), where \(f(x)\approx 0.084\). The value \(0.168\) is the location of the maximum, not its value.

@ 1 | c | Polynomial equations
What is the greatest real solution of \(x^4=3x^2+2x+1\)?
* \(2.052\)
- \(1.732\)
- \(2.414\)
- \(1.618\)
= Graph \(y=x^4-3x^2-2x-1\) and find its largest \(x\)-intercept, about \(2.052\). Equivalently, find where \(y=x^4\) and \(y=3x^2+2x+1\) intersect.

@ 1 | c | Polynomial regression
The table shows data: \(x=0,1,2,3,4\) with \(y=3.1,\ 4.9,\ 9.2,\ 15.1,\ 22.8\). Using a quadratic regression, what is the predicted value of \(y\) when \(x=5\)?
* \(32.600\)
- \(30.500\)
- \(34.810\)
- \(28.700\)
= The quadratic regression is \(y\approx 0.957x^2+1.131x+3.014\). Evaluated at \(x=5\), the model predicts \(32.600\). A quadratic is suitable because the second differences of the data are nearly constant.

@ 1 | c | Linear regression
A plant's height \(y\), in centimeters, was recorded at \(x=2,4,6,8,10\) weeks: \(5.1,\ 8.8,\ 13.2,\ 16.4,\ 20.9\). What is the slope of the least-squares regression line?
* \(1.960\)
- \(2.000\)
- \(1.825\)
- \(0.980\)
= Linear regression gives \(y\approx 1.960x+1.120\). The slope means the model predicts growth of about \(1.96\) centimeters per week.

@ 1 | c | Rational equations
What is the real solution of \(\dfrac{x^3+1}{x^2+2}=1.2\)?
* \(1.690\)
- \(1.200\)
- \(1.442\)
- \(2.000\)
= The equation is equivalent to \(x^3-1.2x^2-1.4=0\), since \(x^2+2\) is never zero. Graphing shows a single real zero near \(x\approx 1.690\).

@ 1 | c | Rates of change
What is the average rate of change of \(f(x)=\sqrt{x^3+1}\) over the interval \([1,3]\)?
* \(1.939\)
- \(3.877\)
- \(2.646\)
- \(1.414\)
= \(\dfrac{f(3)-f(1)}{3-1}=\dfrac{\sqrt{28}-\sqrt{2}}{2}\approx 1.939\). Forgetting to divide by the interval length gives \(3.877\).

@ 1 | c | Polynomial inequalities
For \(x>0\), \(x^3-5x+1<0\) on a single interval. What is the length of that interval?
* \(1.927\)
- \(2.128\)
- \(0.202\)
- \(2.330\)
= The positive zeros of \(x^3-5x+1\) are about \(0.202\) and \(2.128\), and the polynomial is negative between them. The length is \(2.128-0.202\approx 1.927\).

@ 1 | c | Intersections of functions
What is the \(x\)-coordinate of the intersection of \(y=x^2-3\) and \(y=\sqrt{x+5}\) with \(x>0\)?
* \(2.391\)
- \(2.828\)
- \(2.000\)
- \(1.732\)
= Graphing both functions and finding their intersection in the first quadrant gives \(x\approx 2.391\). At \(x=2\), \(x^2-3=1\) while \(\sqrt{7}\approx 2.65\), so the intersection is to the right of \(2\).

@ 1 | c | Rational function models
The concentration of a medication in the blood \(t\) hours after a dose is modeled by \(C(t)=\dfrac{8t}{t^2+3}\) milligrams per liter. For how many hours is the concentration at least \(1.5\) milligrams per liter?
* \(4.055\)
- \(4.694\)
- \(0.639\)
- \(5.333\)
= \(C(t)\ge 1.5\) between the solutions of \(1.5t^2-8t+4.5=0\), \(t\approx 0.639\) and \(t\approx 4.694\). The length of that interval is about \(4.055\) hours.

@ 1 | c | Inverse functions
The function \(f(x)=x^3+2x+1\) is increasing for all \(x\), so it has an inverse. What is \(f^{-1}(5)\)?
* \(1.180\)
- \(0.007\)
- \(1.000\)
- \(1.587\)
= \(f^{-1}(5)\) is the input that gives \(5\): solve \(x^3+2x+1=5\), getting \(x\approx 1.180\). The value \(0.007\) is \(\dfrac{1}{f(5)}\), a common confusion of an inverse with a reciprocal.

@ 1 | c | Polynomial models
An open box is made from a \(20\)-inch by \(30\)-inch sheet by cutting a square of side \(x\) inches from each corner and folding up the sides. What value of \(x\) gives the box the greatest volume?
* \(3.924\)
- \(5.000\)
- \(6.667\)
- \(3.333\)
= The volume is \(V(x)=x(20-2x)(30-2x)\) for \(0<x<10\). A calculator shows the maximum at \(x\approx 3.924\) inches.

@ 1 | c | Function models
What is the minimum value of \(g(x)=x^2+\dfrac{8}{x}\) for \(x>0\)?
* \(7.560\)
- \(1.587\)
- \(6.000\)
- \(9.000\)
= Graphing \(g\) for \(x>0\) shows a minimum near \(x\approx 1.587\), where \(g(x)\approx 7.560\). As \(x\to 0^+\) and as \(x\to\infty\), \(g(x)\) grows without bound.

@ 1 | c | Polynomial extrema
At what \(x\)-value does \(p(x)=x^3-3x^2-x+4\) have its local minimum?
* \(2.155\)
- \(-0.155\)
- \(2.000\)
- \(1.000\)
= A calculator locates the local minimum at \(x\approx 2.155\). The local maximum is at \(x\approx -0.155\).

@ 1 | c | Polynomial regression
Data are \(x=0,1,2,3,4,5\) with \(y=2.0,\ 1.1,\ 2.9,\ 8.2,\ 17.8,\ 33.1\). Using a cubic regression, what is the predicted value of \(y\) at \(x=6\)?
* \(54.700\)
- \(48.400\)
- \(58.200\)
- \(51.900\)
= The cubic regression of the six points, evaluated at \(x=6\), gives \(54.700\). Predictions outside the range of the data, called extrapolation, should be treated with caution.

@ 1 | c | Polynomial zeros
What is the smallest positive zero of \(f(x)=x^5-3x+1\)?
* \(0.335\)
- \(1.215\)
- \(0.333\)
- \(0.500\)
= Graphing shows positive zeros near \(0.335\) and \(1.215\). The value \(\tfrac{1}{3}\) comes from ignoring the \(x^5\) term, which is small but not negligible.

@ 1 | c | Rates of change
What is the average rate of change of \(f(x)=x^3-x\) over the interval \([1.2,2.7]\)?
* \(10.970\)
- \(11.322\)
- \(9.970\)
- \(16.455\)
= \(\dfrac{f(2.7)-f(1.2)}{1.5}=\dfrac{16.983-0.528}{1.5}=10.970\). The value \(16.455\) is the change in \(f\) without dividing by the interval length.

@ 1 | c | Polynomial extrema
What is the minimum value of \(q(x)=x^4-2x^3-x+3\)?
* \(-0.238\)
- \(1.600\)
- \(0.000\)
- \(-1.000\)
= A calculator shows the absolute minimum near \(x\approx 1.60\), where \(q(x)\approx -0.238\). Because the leading term is \(x^4\), the function rises without bound in both directions.

@ 1 | c | Polynomial zeros
How many real zeros does \(f(x)=x^5-4x^3+x+1\) have?
* \(3\)
- \(5\)
- \(1\)
- \(2\)
= Graphing shows the curve crossing the \(x\)-axis three times. The other two zeros of this degree-5 polynomial are nonreal and form a conjugate pair.

@ 1 | c | Rational functions
What is the maximum value of \(r(x)=\dfrac{2x^2-5x+1}{x^2+1}\)?
* \(4.050\)
- \(2.000\)
- \(3.550\)
- \(5.099\)
= A calculator shows a maximum near \(x\approx -1.22\), where \(r\approx 4.050\). The horizontal asymptote \(y=2\) is not a maximum; the graph rises above it for negative \(x\).

@ 2 | n | Arithmetic and geometric sequences | seqs
Which statement correctly describes the sequences in the table?
* \(a_n\) is arithmetic with common difference \(6\), and \(b_n\) is geometric with common ratio \(3\).
- \(a_n\) is geometric with ratio \(6\), and \(b_n\) is arithmetic with difference \(10\).
- Both sequences are arithmetic.
- Both sequences are geometric.
= Successive terms of \(a_n\) differ by \(6\), and successive terms of \(b_n\) are multiplied by \(3\). Over equal steps, arithmetic sequences change by a constant amount and geometric sequences by a constant factor.

@ 2 | n | Arithmetic and geometric sequences | seqs
For the sequences in the table, what are \(a_{10}\) and \(b_{6}\)?
* \(a_{10}=59\) and \(b_6=1215\)
- \(a_{10}=65\) and \(b_6=1215\)
- \(a_{10}=59\) and \(b_6=405\)
- \(a_{10}=60\) and \(b_6=3645\)
= \(a_n=5+6(n-1)\), so \(a_{10}=59\). \(b_n=5\cdot 3^{n-1}\), so \(b_6=5\cdot 243=1215\).

@ 2 | n | Geometric sequences
In a geometric sequence, \(g_2=12\) and \(g_5=-96\). What is \(g_1\)?
* \(-6\)
- \(6\)
- \(-24\)
- \(3\)
= From \(g_2\) to \(g_5\) the ratio is applied three times: \(r^3=\dfrac{-96}{12}=-8\), so \(r=-2\). Then \(g_1=\dfrac{g_2}{r}=\dfrac{12}{-2}=-6\).

@ 2 | n | Linear and exponential change
Over equal-length input intervals, the output values of a function change by a factor of \(0.8\) each time. Which type of function is this, and how does it behave?
* Exponential decay, decreasing by \(20\%\) over each interval
- Linear, decreasing by \(0.8\) over each interval
- Exponential growth, increasing by \(80\%\) over each interval
- Exponential decay, decreasing by \(80\%\) over each interval
= A constant multiplicative change over equal intervals is exponential. A factor of \(0.8\) keeps \(80\%\) of the value, a decrease of \(20\%\).

@ 2 | n | Exponential functions | expPoints
Which equation defines the exponential function \(f\) shown?
* \(f(x)=3\cdot 2^x\)
- \(f(x)=3\cdot 4^x\)
- \(f(x)=2\cdot 3^x\)
- \(f(x)=4.5x+3\)
= \(f(0)=3\) gives the initial value. From \(x=0\) to \(x=2\) the output is multiplied by \(4\), so \(b^2=4\) and \(b=2\).

@ 2 | n | Exponential functions | expPoints
For the function \(f\) shown, what is \(\displaystyle\lim_{x\to-\infty}f(x)\)?
* \(0\)
- \(3\)
- \(-\infty\)
- \(1\)
= For \(f(x)=3\cdot 2^x\), as \(x\to-\infty\), \(2^x\to 0\), so \(f(x)\) approaches \(0\). The graph has the horizontal asymptote \(y=0\) on the left.

@ 2 | n | Exponential function manipulation
Which expression is equivalent to \(5\cdot 4^{x+1}\)?
* \(20\cdot 4^x\)
- \(5\cdot 4^x+4\)
- \(20^{x+1}\)
- \(5\cdot 16^x\)
= By the product property, \(4^{x+1}=4\cdot 4^x\), so the expression equals \(20\cdot 4^x\). A horizontal translation of an exponential function is equivalent to a vertical dilation.

@ 2 | n | Exponential function manipulation
Which expression is equivalent to \(9^{x/2}\)?
* \(3^x\)
- \(4.5^x\)
- \(81^x\)
- \(\dfrac{9^x}{2}\)
= \(9^{x/2}=(3^2)^{x/2}=3^x\). The power property of exponents multiplies the exponents.

@ 2 | n | Exponential models
A population of \(2000\) bacteria triples every \(5\) hours. Which function gives the population after \(t\) hours?
* \(P(t)=2000\cdot 3^{t/5}\)
- \(P(t)=2000\cdot 3^{5t}\)
- \(P(t)=2000\cdot 5^{t/3}\)
- \(P(t)=2000+3^{t/5}\)
= The population is multiplied by \(3\) each time \(t\) increases by \(5\). The exponent \(\tfrac{t}{5}\) counts the number of 5-hour periods.

@ 2 | n | Exponential models
A car's value is modeled by \(V(t)=24000(0.85)^t\), where \(t\) is in years. Which statement best interprets the model?
* The car's value decreases by \(15\%\) each year.
- The car's value decreases by \(85\%\) each year.
- The car's value decreases by \(\$0.85\) each year.
- The car's value increases by \(15\%\) each year.
= Each year the value is multiplied by \(0.85\), so \(85\%\) of the value remains and \(15\%\) is lost.

@ 2 | n | Equivalent exponential models
A quantity grows by \(44\%\) every \(2\) years. By what percentage does it grow each year?
* \(20\%\)
- \(22\%\)
- \(44\%\)
- \(12\%\)
= The 2-year factor is \(1.44\), so the 1-year factor is \(\sqrt{1.44}=1.2\), or \(20\%\) growth. Halving \(44\%\) to \(22\%\) ignores compounding.

@ 2 | n | Model validation | residuals
A linear model was fit to data, and the residual plot is shown. What does the plot suggest?
* A linear model is not appropriate, because the residuals show a curved pattern.
- A linear model is appropriate, because the residuals are both positive and negative.
- The linear model is perfect, because the residuals sum to approximately zero.
- The data have no relationship.
= An appropriate model leaves residuals scattered randomly about zero. The U-shaped pattern shows the model systematically overestimates in the middle and underestimates at the ends, so a curved model, such as an exponential or quadratic, may fit better.

@ 2 | n | Model validation | residuals
For the residual plot shown, what does the residual at \(x=5\) indicate?
* The model's prediction at \(x=5\) is about \(1.6\) greater than the actual value.
- The model's prediction at \(x=5\) is about \(1.6\) less than the actual value.
- The actual value at \(x=5\) is \(-1.6\).
- The model has no error at \(x=5\).
= A residual is the actual value minus the predicted value. A residual of about \(-1.6\) means the actual value is \(1.6\) below the prediction.

@ 2 | n | Composition of functions | compose
Using the table, what is \(f(g(2))\)?
* \(3\)
- \(1\)
- \(4\)
- \(2\)
= First, \(g(2)=4\). Then \(f(4)=3\). The inner function is evaluated first.

@ 2 | n | Composition of functions | compose
Using the table, for what value of \(x\) does \(g(f(x))=1\)?
* \(x=1\)
- \(x=4\)
- \(x=3\)
- \(x=0\)
= The only input with \(g(\text{input})=1\) is \(4\), so \(f(x)\) must equal \(4\), which happens only at \(x=1\). Answering \(x=4\) solves \(g(x)=1\) instead.

@ 2 | n | Composition of functions
If \(f(x)=x^2-1\) and \(g(x)=2x+3\), what is \(f(g(x))\)?
* \(4x^2+12x+8\)
- \(2x^2+1\)
- \(4x^2+9\)
- \(2x^3+3x^2-2x-3\)
= \(f(g(x))=(2x+3)^2-1=4x^2+12x+9-1=4x^2+12x+8\). The expression \(2x^2+1\) is \(g(f(x))\), showing that composition is not commutative.

@ 2 | n | Inverse functions
If \(f(x)=\dfrac{2x-1}{x+3}\), what is \(f^{-1}(x)\)?
* \(\dfrac{3x+1}{2-x}\)
- \(\dfrac{x+3}{2x-1}\)
- \(\dfrac{3x-1}{2+x}\)
- \(\dfrac{2x+1}{x-3}\)
= Solve \(y=\dfrac{2x-1}{x+3}\) for \(x\): \(xy+3y=2x-1\), so \(x(y-2)=-1-3y\) and \(x=\dfrac{3y+1}{2-y}\). The reciprocal \(\dfrac{x+3}{2x-1}\) is not the inverse.

@ 2 | n | Inverse functions
The function \(f\) is invertible, \(f(2)=7\), and \(f(5)=-1\). What is \(f^{-1}(-1)\)?
* \(5\)
- \(2\)
- \(-1\)
- \(-\tfrac{1}{5}\)
= \(f^{-1}\) reverses \(f\): since \(f(5)=-1\), \(f^{-1}(-1)=5\). The graph of \(f^{-1}\) contains each point of \(f\) with its coordinates swapped.

@ 2 | n | Logarithmic expressions
What is the value of \(\log_2 32+\log_3\dfrac{1}{9}\)?
* \(3\)
- \(7\)
- \(-3\)
- \(\dfrac{5}{2}\)
= \(\log_2 32=5\) because \(2^5=32\), and \(\log_3\dfrac{1}{9}=-2\) because \(3^{-2}=\dfrac{1}{9}\). The sum is \(3\).

@ 2 | n | Logarithmic functions | logGraph
The graph shown is \(y=\log_b x\). What is \(b\)?
* \(3\)
- \(9\)
- \(2\)
- \(\tfrac{1}{3}\)
= The point \((3,1)\) means \(\log_b 3=1\), so \(b=3\). Likewise \((9,2)\) means \(b^2=9\).

@ 2 | n | Inverses of exponential functions | logGraph
The graph shown is reflected across the line \(y=x\). Which function has the reflected graph?
* \(y=3^x\)
- \(y=x^3\)
- \(y=-\log_3 x\)
- \(y=\log_x 3\)
= Reflecting across \(y=x\) gives the inverse function. The inverse of \(\log_3 x\) is \(3^x\); the reflected graph passes through \((0,1)\), \((1,3)\), and \((2,9)\).

@ 2 | n | Logarithmic functions | logGraph
For the function shown, which statement is true?
* Its domain is \(x>0\), and \(\displaystyle\lim_{x\to 0^+}\log_b x=-\infty\).
- Its domain is all real numbers.
- It has a horizontal asymptote at \(y=0\).
- Its range is \(y>0\).
= Logarithms are defined only for positive inputs. As \(x\) approaches \(0\) from the right, the outputs decrease without bound, giving a vertical asymptote at \(x=0\). The range is all real numbers.

@ 2 | n | Logarithmic function manipulation
Which expression is equivalent to \(2\ln x-\ln(x+1)+\ln 3\)?
* \(\ln\dfrac{3x^2}{x+1}\)
- \(\ln\dfrac{2x}{x+1}+\ln 3\)
- \(\ln(3x^2-x-1)\)
- \(\dfrac{2\ln 3x}{\ln(x+1)}\)
= The power property gives \(2\ln x=\ln x^2\). The product and quotient properties then combine the terms into \(\ln\dfrac{3x^2}{x+1}\).

@ 2 | n | Logarithmic function manipulation
If \(\log_b 2=p\) and \(\log_b 5=q\), what is \(\log_b 40\)?
* \(3p+q\)
- \(8p+q\)
- \(3pq\)
- \(p^3+q\)
= \(40=2^3\cdot 5\), so \(\log_b 40=3\log_b 2+\log_b 5=3p+q\) by the product and power properties. The choice \(8p+q\) multiplies by \(8\) instead of using the exponent \(3\).

@ 2 | n | Change of base
Which expression is equal to \(\log_4 20\)?
* \(\dfrac{\ln 20}{\ln 4}\)
- \(\ln\dfrac{20}{4}\)
- \(\dfrac{\ln 4}{\ln 20}\)
- \(\ln 20-\ln 4\)
= The change of base property gives \(\log_b a=\dfrac{\ln a}{\ln b}\). The quotient \(\ln\dfrac{20}{4}\) equals \(\ln 20-\ln 4\), which is \(\ln 5\), a different number.

@ 2 | n | Logarithmic functions
The graph of \(g(x)=\log_2 x\) is transformed to \(h(x)=\log_2(8x)\). Which describes the transformation?
* A vertical translation up \(3\) units
- A horizontal dilation by a factor of \(8\)
- A vertical dilation by a factor of \(8\)
- A horizontal translation left \(8\) units
= \(\log_2(8x)=\log_2 8+\log_2 x=3+\log_2 x\). A horizontal dilation of a logarithmic function is equivalent to a vertical translation.

@ 2 | n | Exponential equations
What is the solution of \(4^{x-1}=8^{x}\)?
* \(x=-2\)
- \(x=2\)
- \(x=-\tfrac{1}{2}\)
- \(x=1\)
= Writing both sides with base \(2\): \(2^{2x-2}=2^{3x}\), so \(2x-2=3x\) and \(x=-2\).

@ 2 | n | Logarithmic equations
What are the solutions of \(\log_2 x+\log_2(x-6)=4\)?
* \(x=8\) only
- \(x=8\) and \(x=-2\)
- \(x=-2\) only
- \(x=10\)
= Combining gives \(\log_2(x^2-6x)=4\), so \(x^2-6x-16=0\) and \(x=8\) or \(x=-2\). The value \(-2\) is extraneous, because \(\log_2(-2)\) is undefined.

@ 2 | n | Exponential inequalities
What is the solution set of \(\left(\tfrac{1}{2}\right)^x>8\)?
* \(x<-3\)
- \(x>-3\)
- \(x>3\)
- \(x<3\)
= Since \(8=\left(\tfrac{1}{2}\right)^{-3}\) and \(\left(\tfrac{1}{2}\right)^x\) is decreasing, the inequality holds for exponents less than \(-3\). A decreasing function reverses the inequality between inputs.

@ 2 | n | Logarithmic inequalities
What is the solution set of \(\log_3(x-1)\le 2\)?
* \(1<x\le 10\)
- \(x\le 10\)
- \(x\le 7\)
- \(1<x\le 7\)
= Since \(\log_3\) is increasing, \(x-1\le 9\), so \(x\le 10\). The domain requires \(x-1>0\), so \(x>1\).

@ 2 | n | Semi-log plots | semilog
The data plotted on the semi-log graph lie on a line. Which model fits the original data?
* \(y=e\cdot\left(e^{0.5}\right)^x\)
- \(y=0.5x+1\)
- \(y=e^{0.5}x+e\)
- \(y=\ln(0.5x+1)\)
= The line is \(\ln y=0.5x+1\). Exponentiating gives \(y=e^{1}\cdot e^{0.5x}=e\left(e^{0.5}\right)^x\). Data that are linear on a semi-log plot follow an exponential model.

@ 2 | n | Semi-log plots | semilog
For the data shown on the semi-log plot, by what factor does \(y\) change each time \(x\) increases by \(2\)?
* \(e\)
- \(2\)
- \(1\)
- \(e^2\)
= Each increase of \(2\) in \(x\) raises \(\ln y\) by \(1\), so \(y\) is multiplied by \(e^1\).

@ 2 | n | Logarithmic models
In a decibel model, \(L=10\log\dfrac{I}{I_0}\). If the intensity of a sound is multiplied by \(1000\), how does its loudness change?
* It increases by \(30\) decibels.
- It increases by \(1000\) decibels.
- It triples.
- It increases by \(3\) decibels.
= \(10\log\dfrac{1000I}{I_0}=10\left(3+\log\dfrac{I}{I_0}\right)=L+30\). Multiplying the input of a logarithm by a factor adds a constant to the output.

@ 2 | n | Exponential versus polynomial growth
Which statement about \(f(x)=1.01^x\) and \(g(x)=x^{10}\) is true?
* \(f(x)\) eventually exceeds \(g(x)\) and stays greater as \(x\to\infty\).
- \(g(x)\) is always greater than \(f(x)\) for \(x>1\).
- The two functions grow at the same rate as \(x\to\infty\).
- \(f(x)\) is greater than \(g(x)\) for all \(x>0\).
= Any increasing exponential function eventually grows faster than any polynomial. Although \(g\) is much larger for a long interval, \(\displaystyle\lim_{x\to\infty}\dfrac{x^{10}}{1.01^x}=0\).

@ 2 | n | Logarithmic functions
For \(x>1\), which comparison is correct as \(x\to\infty\)?
* \(\ln x\) grows more slowly than \(\sqrt{x}\).
- \(\ln x\) grows faster than \(\sqrt{x}\).
- \(\ln x\) approaches a horizontal asymptote.
- \(\ln x\) and \(\sqrt{x}\) grow at the same rate.
= Logarithmic functions increase without bound but more slowly than any positive power of \(x\). They have no horizontal asymptote.

@ 2 | n | Inverse functions
The function \(f(x)=2^{x-1}+3\) has an inverse. What is \(f^{-1}(x)\)?
* \(\log_2(x-3)+1\)
- \(\log_2(x+3)-1\)
- \(\log_2(x-1)+3\)
- \(\dfrac{1}{2^{x-1}+3}\)
= Solve \(y=2^{x-1}+3\): \(y-3=2^{x-1}\), so \(x-1=\log_2(y-3)\) and \(x=\log_2(y-3)+1\).

@ 2 | n | Exponential models
A radioactive substance has a half-life of \(8\) days. What fraction of a sample remains after \(24\) days?
* \(\tfrac{1}{8}\)
- \(\tfrac{1}{3}\)
- \(\tfrac{1}{24}\)
- \(\tfrac{1}{6}\)
= Twenty-four days is three half-lives, so \(\left(\tfrac{1}{2}\right)^3=\tfrac{1}{8}\) remains.

@ 2 | n | Equivalent exponential models
Which expression is equivalent to \(e^{2\ln 3+\ln x}\)?
* \(9x\)
- \(6x\)
- \(9+x\)
- \(3x^2\)
= \(e^{2\ln 3}\cdot e^{\ln x}=e^{\ln 9}\cdot x=9x\), because \(e^x\) and \(\ln x\) are inverses.

@ 2 | n | Arithmetic sequences
An arithmetic sequence has \(a_3=11\) and \(a_8=31\). Which function defines \(a_n\)?
* \(a_n=4n-1\)
- \(a_n=4n+3\)
- \(a_n=5n-4\)
- \(a_n=20n-49\)
= The common difference is \(\dfrac{31-11}{8-3}=4\). Then \(a_n=11+4(n-3)=4n-1\). An arithmetic sequence is a linear function of \(n\).

@ 2 | n | Exponential and linear models
An investment earns simple interest of \(\$60\) per year on \(\$1000\), while another earns \(6\%\) interest compounded annually on \(\$1000\). Which statement is true?
* After the first year, the compounded account is always greater, and the gap widens each year.
- The two accounts are always equal.
- The simple-interest account eventually becomes greater.
- The compounded account grows by \(\$60\) each year.
= The simple-interest account is linear, and the compounded account is exponential. They are equal after one year, and afterward the exponential account earns interest on its interest.

@ 2 | n | Logarithmic expressions
Which value is closest to \(\log 5000\)?
* \(3.7\)
- \(5\)
- \(3.0\)
- \(4.7\)
= \(\log 1000=3\) and \(\log 10000=4\), so \(\log 5000\) is between them. Because \(\log 5\approx 0.7\), \(\log 5000=3+\log 5\approx 3.7\).

@ 2 | n | Exponential functions
For which value of \(b\) is \(f(x)=a\cdot b^x\) with \(a>0\) both decreasing and concave up?
* \(b=0.6\)
- \(b=1.6\)
- \(b=1\)
- \(b=-0.6\)
= For \(0<b<1\), the exponential decreases toward \(0\), and its decreasing rate shrinks in magnitude, so the graph is concave up. Bases must be positive and not equal to \(1\).

@ 2 | n | Logarithmic equations
What is the solution of \(\ln(x+2)-\ln x=\ln 5\)?
* \(x=\tfrac{1}{2}\)
- \(x=3\)
- \(x=-\tfrac{1}{2}\)
- \(x=\tfrac{5}{2}\)
= The quotient property gives \(\dfrac{x+2}{x}=5\), so \(x+2=5x\) and \(x=\tfrac{1}{2}\), which is in the domain.

@ 2 | n | Geometric sequences and exponential functions
A geometric sequence has \(g_0=50\) and common ratio \(1.04\). Which exponential function \(f\) satisfies \(f(n)=g_n\) for every whole number \(n\)?
* \(f(n)=50(1.04)^n\)
- \(f(n)=50+1.04n\)
- \(f(n)=1.04(50)^n\)
- \(f(n)=50(0.04)^n\)
= A geometric sequence is an exponential function restricted to whole-number inputs, with the initial term as the initial value and the common ratio as the base.

@ 2 | c | Exponential equations
What is the positive solution of \(2^x=x+3\)?
* \(2.445\)
- \(3.000\)
- \(1.585\)
- \(2.000\)
= Graph \(y=2^x\) and \(y=x+3\) and find the positive intersection, \(x\approx 2.445\). The equation cannot be solved with logarithms alone because \(x\) appears both in and outside the exponent.

@ 2 | c | Exponential regression
A quantity was measured at \(x=0,1,2,3,4\): \(12,\ 17,\ 25,\ 37,\ 54\). Using an exponential regression, what is the predicted value at \(x=6\)?
* \(114.632\)
- \(118.000\)
- \(107.500\)
- \(79.000\)
= The regression gives approximately \(y=11.8(1.46)^x\). Evaluating the full-precision model at \(x=6\) gives about \(114.632\).

@ 2 | c | Exponential models
An account with \(\$5000\) earns interest compounded continuously at \(4\%\) per year, \(A(t)=5000e^{0.04t}\). After how many years will it reach \(\$8000\)?
* \(11.750\)
- \(15.000\)
- \(12.051\)
- \(4.700\)
= Solve \(e^{0.04t}=1.6\): \(t=\dfrac{\ln 1.6}{0.04}\approx 11.750\) years.

@ 2 | c | Exponential models
A \(200\)-gram sample of a radioactive isotope decays to \(140\) grams in \(6\) days. What is its half-life, in days?
* \(11.660\)
- \(10.000\)
- \(8.571\)
- \(14.000\)
= From \(140=200b^6\), \(b=0.7^{1/6}\). The half-life solves \(b^h=0.5\), giving \(h=\dfrac{6\ln 2}{\ln(200/140)}\approx 11.660\) days.

@ 2 | c | Logarithmic equations
What is the solution of \(\log_3 x+\log_3(x-2)=2\)?
* \(4.162\)
- \(-2.162\)
- \(3.000\)
- \(5.500\)
= The equation becomes \(x^2-2x-9=0\), with solutions \(1\pm\sqrt{10}\). Only \(1+\sqrt{10}\approx 4.162\) is in the domain; \(1-\sqrt{10}\) is negative.

@ 2 | c | Logarithmic equations
What is the solution of \(\ln x=3-x\)?
* \(2.208\)
- \(1.500\)
- \(3.000\)
- \(2.718\)
= Graphing \(y=\ln x\) and \(y=3-x\) shows one intersection, near \(x\approx 2.208\). The increasing and decreasing functions can meet only once.

@ 2 | c | Exponential versus polynomial growth
The graphs of \(y=e^{0.5x}\) and \(y=x^2\) intersect at more than one point with \(x>0\). What is the greatest \(x\)-coordinate of an intersection?
* \(8.613\)
- \(1.430\)
- \(4.000\)
- \(7.389\)
= The graphs cross near \(x\approx 1.430\) and again near \(x\approx 8.613\). After the second crossing, the exponential stays above the polynomial for good.

@ 2 | c | Exponential models
The temperature of a cooling drink is modeled by \(T(t)=20+70e^{-0.08t}\) degrees Celsius after \(t\) minutes. After how many minutes is the drink at \(40^\circ\text{C}\)?
* \(15.660\)
- \(12.500\)
- \(25.000\)
- \(6.250\)
= Solve \(70e^{-0.08t}=20\): \(t=\dfrac{\ln(70/20)}{0.08}\approx 15.660\) minutes. The model approaches the room temperature of \(20^\circ\text{C}\).

@ 2 | c | Exponential models
How many years does it take \(\$1000\) to double at \(6\%\) annual interest compounded monthly?
* \(11.581\)
- \(11.552\)
- \(12.000\)
- \(11.896\)
= Solve \((1.005)^{12t}=2\): \(t=\dfrac{\ln 2}{12\ln 1.005}\approx 11.581\). Continuous compounding would take \(11.552\) years, and annual compounding \(11.896\).

@ 2 | c | Geometric sequences
A geometric sequence has \(g_1=8\) and common ratio \(1.5\). What is the least value of \(n\) for which \(g_n>1000\)?
* \(13\)
- \(12\)
- \(14\)
- \(11\)
= Solve \(8(1.5)^{n-1}>1000\): \(n-1>\dfrac{\ln 125}{\ln 1.5}\approx 11.9\), so \(n-1\ge 12\) and \(n=13\). Indeed \(g_{12}\approx 691.9\) and \(g_{13}\approx 1037.9\).

@ 2 | c | Logarithmic regression
Data are \(x=1,2,4,8,16\) with \(y=3.0,\ 5.1,\ 7.4,\ 9.3,\ 11.6\). Using a logarithmic regression \(y=a+b\ln x\), what is the predicted value at \(x=30\)?
* \(13.501\)
- \(14.200\)
- \(12.880\)
- \(15.020\)
= The outputs increase by roughly equal amounts each time \(x\) doubles, which suggests a logarithmic model. The regression gives about \(y=3.00+3.09\ln x\), predicting about \(13.501\) at \(x=30\).

@ 2 | c | Rates of change
What is the average rate of change of \(f(x)=3\ln(x+1)\) over \([1,5]\)?
* \(0.824\)
- \(3.296\)
- \(1.099\)
- \(0.549\)
= \(\dfrac{3\ln 6-3\ln 2}{4}=\dfrac{3\ln 3}{4}\approx 0.824\). The value \(3.296\) is the total change, before dividing by \(4\).

@ 2 | c | Inverse functions
The function \(f(x)=e^x+x\) is invertible. What is \(f^{-1}(3)\)?
* \(0.792\)
- \(1.099\)
- \(0.043\)
- \(1.000\)
= Solve \(e^x+x=3\); graphing gives \(x\approx 0.792\). The value \(0.043\) is \(\dfrac{1}{f(3)}\), not the inverse.

@ 2 | c | Exponential models
A population grows by \(7\%\) per year. How many years does it take to double?
* \(10.245\)
- \(10.000\)
- \(9.902\)
- \(14.286\)
= Solve \(1.07^t=2\): \(t=\dfrac{\ln 2}{\ln 1.07}\approx 10.245\). The value \(9.902\) would apply to continuous growth at \(7\%\).

@ 2 | c | Semi-log plots
On a semi-log plot of data, \(\ln y\) is modeled by the line \(\ln y=0.35x+1.2\). What value of \(y\) does the model predict at \(x=4\)?
* \(13.464\)
- \(2.600\)
- \(3.004\)
- \(6.616\)
= At \(x=4\), \(\ln y=2.6\), so \(y=e^{2.6}\approx 13.464\). The value \(2.600\) is \(\ln y\), not \(y\).

@ 2 | c | Exponential equations
What is the solution of \(3^{x+1}=5^{x-2}\)?
* \(8.452\)
- \(2.750\)
- \(6.000\)
- \(4.307\)
= Taking logarithms: \((x+1)\ln 3=(x-2)\ln 5\), so \(x=\dfrac{\ln 3+2\ln 5}{\ln 5-\ln 3}\approx 8.452\).

@ 2 | c | Exponential models
An exponential function \(f(x)=ab^x\) passes through \((1,6)\) and \((4,20)\). What is \(f(7)\)?
* \(66.667\)
- \(34.000\)
- \(44.667\)
- \(48.667\)
= From \(x=1\) to \(x=4\), the output is multiplied by \(\tfrac{20}{6}\). Another 3 units multiplies by the same factor: \(20\cdot\tfrac{10}{3}\approx 66.667\). A linear model would give \(34\).

@ 2 | c | Logarithmic equations
The equation \(\ln x=x-2\) has two solutions. What is the greater solution?
* \(3.146\)
- \(0.159\)
- \(2.000\)
- \(3.000\)
= Graphing \(y=\ln x\) and \(y=x-2\) shows intersections near \(x\approx 0.159\) and \(x\approx 3.146\).

@ 2 | c | Equivalent exponential models
A drug is eliminated according to \(A(t)=A_0e^{-0.2t}\), with \(t\) in hours. By what percentage does the amount decrease each hour?
* \(18.127\)
- \(20.000\)
- \(81.873\)
- \(22.140\)
= The hourly factor is \(e^{-0.2}\approx 0.81873\), so the amount decreases by about \(18.127\%\) each hour. The continuous rate of \(20\%\) is not the same as the hourly percentage decrease.

@ 2 | c | Exponential regression
A cooling liquid's excess temperature was measured at \(t=0,2,4,6,8\) minutes: \(500,\ 410,\ 330,\ 272,\ 220\). Using an exponential regression, what is the predicted value at \(t=10\)?
* \(179.498\)
- \(165.000\)
- \(190.000\)
- \(200.250\)
= Exponential regression gives about \(y=500.9(0.902)^t\). At \(t=10\) the full-precision model predicts about \(179.498\).

@ 1 | n | End behavior of rational functions
Which function has the horizontal asymptote \(y=0\)?
* \(f(x)=\dfrac{3x+1}{x^2-4}\)
- \(f(x)=\dfrac{3x^2+1}{x^2-4}\)
- \(f(x)=\dfrac{3x^3+1}{x^2-4}\)
- \(f(x)=\dfrac{x^2-4}{3x+1}\)
= When the degree of the denominator is greater than the degree of the numerator, the denominator dominates and the quotient approaches \(0\). Equal degrees give the ratio of leading coefficients, and a larger numerator degree gives no horizontal asymptote.

@ 1 | n | Polynomial functions
What is the greatest number of local extrema the graph of a polynomial of degree \(6\) can have?
* \(5\)
- \(6\)
- \(7\)
- \(3\)
= Between consecutive extrema the graph changes direction, and a polynomial of degree \(n\) can change direction at most \(n-1\) times. A degree-6 polynomial can therefore have at most \(5\) local extrema, and it must have at least one.

@ 2 | n | Logarithmic functions
For \(0<b<1\), which statement about \(f(x)=\log_b x\) is true?
* \(f\) is decreasing, and \(\displaystyle\lim_{x\to 0^+}f(x)=\infty\).
- \(f\) is increasing, and \(\displaystyle\lim_{x\to 0^+}f(x)=-\infty\).
- \(f\) is decreasing, and its domain is all real numbers.
- \(f\) has a horizontal asymptote at \(y=0\).
= \(\log_b x\) is the inverse of \(b^x\), which is decreasing when \(0<b<1\). Reflecting the horizontal asymptote of \(b^x\) across \(y=x\) gives a vertical asymptote at \(x=0\), with outputs growing without bound as \(x\to 0^+\).

@ 2 | n | Exponential equations
What are the solutions of \(e^{2x}-5e^x+6=0\)?
* \(x=\ln 2\) and \(x=\ln 3\)
- \(x=2\) and \(x=3\)
- \(x=e^2\) and \(x=e^3\)
- \(x=\ln 6\) only
= Substituting \(u=e^x\) gives \(u^2-5u+6=0\), so \(u=2\) or \(u=3\). Then \(e^x=2\) or \(e^x=3\), and \(x=\ln 2\) or \(x=\ln 3\).

@ 2 | n | Equivalent exponential models
A model gives \(P(t)=300(1.2)^{t/3}\), where \(t\) is in years. Which expression gives the growth factor per year?
* \(1.2^{1/3}\)
- \(1.2\)
- \(\dfrac{1.2}{3}\)
- \(1.2^3\)
= Rewriting \(P(t)=300\left(1.2^{1/3}\right)^t\) shows that each year the quantity is multiplied by \(1.2^{1/3}\approx 1.063\). The base \(1.2\) is the factor for every 3 years.
`;

module.exports = { source, figures };
