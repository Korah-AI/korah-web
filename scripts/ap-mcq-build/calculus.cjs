// Source for korah-bot/ap/data/ap-calculus-ab/mcqs.json. Run build.cjs to regenerate.
// Each block: "@ unit | n (non-calculator) or c (calculator) | skill | optional figure key",
// stem lines, "*" the correct choice, "-" three distractors, "=" the explanation.
// Math is LaTeX between \( and \).
const { graph, table } = require('./figures.cjs');

const velocity = [[0, 2], [2, 2], [4, -2], [6, -2], [8, 0]];
const fprime = x => (x + 2) * (x - 1) * (x - 4) / 4;
const accum = [[0, 0], [2, 4], [4, 4], [6, 0], [8, -2]];
const m = v => String.raw`\(${v}\)`;
const fgTable = table(["x", "f(x)", "f'(x)", "g(x)", "g'(x)"].map(m), [[1, 3, -2, 2, 3], [2, 1, 4, 3, -1], [3, 2, 5, 1, 6]].map(row => row.map(m)), "Table of values of f, f prime, g, and g prime at x = 1, 2, 3");

const figures = {
  jump: graph({ x: [-3, 6], y: [-3, 5], alt: 'Graph of f: a line rising to an open circle at (2, 3), a filled point at (2, 1), and a second line rising from an open circle at (2, −1) to (5, 2)',
    curves: [{ pts: [[-3, -2], [2, 3]] }, { pts: [[2, -1], [5, 2]] }], dots: [{ x: 2, y: 3, open: true }, { x: 2, y: 1 }, { x: 2, y: -1, open: true }, { x: 5, y: 2 }] }),
  holes: graph({ x: [-4, 6], y: [-1, 5], alt: 'Graph of f on [−3, 5]: a segment from (−3, 0) to an open circle at (−1, 2); a segment from a filled point at (−1, 3) to an open circle at (3, 1); a filled point at (3, 3); a segment from an open circle at (3, 1) to (5, 3)',
    curves: [{ pts: [[-3, 0], [-1, 2]] }, { pts: [[-1, 3], [3, 1]] }, { pts: [[3, 1], [5, 3]] }], dots: [{ x: -3, y: 0 }, { x: -1, y: 2, open: true }, { x: -1, y: 3 }, { x: 3, y: 1, open: true }, { x: 3, y: 3 }, { x: 5, y: 3 }] }),
  corners: graph({ x: [-5, 6], y: [-3, 4], alt: 'Graph of f consisting of line segments joining (−4, −2), (−2, 2), (1, 2), (3, −2), and (5, 0)',
    curves: [{ pts: [[-4, -2], [-2, 2], [1, 2], [3, -2], [5, 0]] }], dots: [{ x: -4, y: -2 }, { x: 5, y: 0 }] }),
  fg: fgTable,
  velocity: graph({ x: [0, 9], y: [-3, 3], xlabel: 't', ylabel: 'v(t)', alt: 'Graph of velocity v consisting of line segments joining (0, 2), (2, 2), (4, −2), (6, −2), and (8, 0)',
    curves: [{ pts: velocity }], dots: [{ x: 0, y: 2 }, { x: 8, y: 0 }] }),
  fprime: graph({ x: [-3, 5], y: [-4, 4], ylabel: "f′(x)", alt: 'Graph of f prime, a smooth curve crossing the x-axis at x = −2, 1, and 4, with a local maximum near x = −0.7 and a local minimum near x = 2.7',
    curves: [{ fn: fprime, from: -2.75, to: 4.7 }], notes: [{ x: -2.6, y: 3.2, text: 'Graph of f′' }] }),
  accum: graph({ x: [0, 9], y: [-3, 5], xlabel: 't', ylabel: 'f(t)', alt: 'Graph of f consisting of line segments joining (0, 0), (2, 4), (4, 4), (6, 0), and (8, −2)',
    curves: [{ pts: accum }], dots: [{ x: 0, y: 0 }, { x: 8, y: -2 }] }),
  rate: table([m('t') + ' (minutes)', ...[0, 2, 5, 7, 10].map(m)], [[m('r(t)') + ' (liters per minute)', ...[3, 5, 6, 4, 2].map(m)]], "Table of r(t) at t = 0, 2, 5, 7, 10: 3, 5, 6, 4, 2"),
  fieldSum: graph({ x: [-3.5, 3.5], y: [-3.5, 3.5], field: (x, y) => x + y, alt: 'Slope field with horizontal segments along the line y = −x, positive slopes above that line, and negative slopes below it' }),
  fieldLogistic: graph({ x: [-0.5, 5.5], y: [-1.5, 3.5], h: 250, xlabel: 't', field: (x, y) => y * (2 - y), alt: 'Slope field with horizontal segments along y = 0 and y = 2, positive slopes between them, and negative slopes above y = 2 and below y = 0' }),
  region: graph({ x: [-1, 5], y: [-1, 3], alt: 'Region R bounded above by y = square root of x and below by y = x over 2, meeting at (0, 0) and (4, 2)',
    shade: [{ top: Math.sqrt, bottom: x => x / 2, from: 0, to: 4 }], curves: [{ fn: Math.sqrt, from: 0, to: 5 }, { fn: x => x / 2, from: -1, to: 5, color: '#ec4899' }],
    notes: [{ x: 3.2, y: 2.2, text: 'y = √x' }, { x: 3.6, y: 1.35, text: 'y = x/2' }, { x: 1.6, y: 1.02, text: 'R' }] }),
};

const source = String.raw`
@ 1 | n | Limit laws
For \(x \ne 4\), \(f(x)=\dfrac{x^2-3x-4}{x-4}\). If \(f(4)=-2\), what is \(\displaystyle\lim_{x\to 4} f(x)\)?
* \(5\)
- \(-2\)
- \(0\)
- The limit does not exist.
= Factor the numerator as \((x-4)(x+1)\). For \(x\ne 4\), \(f(x)=x+1\), so the limit is \(5\) regardless of the isolated value \(f(4)\).

@ 1 | n | One-sided limits
Let \(f(x)=\dfrac{|2x-6|}{x-3}\) for \(x\ne 3\). What are \(\displaystyle\lim_{x\to 3^-} f(x)\) and \(\displaystyle\lim_{x\to 3^+} f(x)\), in that order?
* \(-2\) and \(2\)
- \(2\) and \(-2\)
- \(0\) and \(0\)
- \(2\) and \(2\)
= For \(x<3\), \(|2x-6|=-(2x-6)\), so the quotient is \(-2\); for \(x>3\) it is \(2\). Because the one-sided limits differ, the two-sided limit does not exist.

@ 1 | n | Continuity
Let \(f(x)=\begin{cases} x^2+k, & x<2 \\ m, & x=2 \\ 3x-1, & x>2 \end{cases}\). For which values of \(k\) and \(m\) is \(f\) continuous at \(x=2\)?
* \(k=1\) and \(m=5\)
- \(k=5\) and \(m=1\)
- \(k=1\) and \(m=4\)
- \(k=-1\) and \(m=5\)
= The right-hand limit is \(3(2)-1=5\). Matching the left-hand limit gives \(4+k=5\), so \(k=1\), and the function value must also equal the limit, so \(m=5\).

@ 1 | n | Squeeze theorem
For \(0<|x|<1\), \(4-x^2\le g(x)\le 4+2|x|\). Which of the following must be true?
* \(\displaystyle\lim_{x\to 0} g(x)=4\)
- \(g(0)=4\)
- \(g\) is differentiable at \(x=0\)
- \(g\) is increasing near \(x=0\)
= Both bounding functions approach \(4\) as \(x\to 0\), so the squeeze theorem gives \(\lim_{x\to 0} g(x)=4\). Nothing is stated about \(g(0)\) or about differentiability.

@ 1 | n | Intermediate value theorem
The function \(f\) is continuous on \([-2,3]\), with \(f(-2)=7\) and \(f(3)=-1\). Which of the following is guaranteed?
* \(f(c)=2\) for some \(c\) in \((-2,3)\)
- \(f\) has exactly one zero in \((-2,3)\)
- \(f'(c)=-\dfrac{8}{5}\) for some \(c\) in \((-2,3)\)
- \(f\) is decreasing on \([-2,3]\)
= Because \(f\) is continuous and \(2\) lies between \(-1\) and \(7\), the Intermediate Value Theorem guarantees \(f(c)=2\). Uniqueness and monotonicity do not follow, and the derivative claim would require differentiability.

@ 1 | n | Limits at infinity
What is \(\displaystyle\lim_{x\to -\infty} \dfrac{\sqrt{9x^2+4}}{2x-1}\)?
* \(-\dfrac{3}{2}\)
- \(\dfrac{3}{2}\)
- \(0\)
- \(-\infty\)
= For negative \(x\), \(\sqrt{9x^2+4}\) behaves like \(3|x|=-3x\). Dividing by the leading term \(2x\) of the denominator gives \(-\dfrac{3}{2}\).

@ 1 | n | Trigonometric limits
What is \(\displaystyle\lim_{x\to 0} \dfrac{\sin(7x)}{\tan(2x)}\)?
* \(\dfrac{7}{2}\)
- \(\dfrac{2}{7}\)
- \(1\)
- \(14\)
= Write the ratio as \(\dfrac{\sin(7x)}{7x}\cdot\dfrac{2x}{\tan(2x)}\cdot\dfrac{7}{2}\). The first two factors approach \(1\).

@ 1 | n | Algebraic limits
What is \(\displaystyle\lim_{x\to 0} \dfrac{\sqrt{16+3x}-4}{x}\)?
* \(\dfrac{3}{8}\)
- \(\dfrac{1}{8}\)
- \(\dfrac{3}{4}\)
- \(0\)
= Multiplying numerator and denominator by the conjugate gives \(\dfrac{3}{\sqrt{16+3x}+4}\), which approaches \(\dfrac{3}{8}\).

@ 1 | n | Discontinuities
Let \(f(x)=\dfrac{x^2-4}{(x-2)(x+3)}\). Which of the following describes the graph of \(f\)?
* A removable discontinuity at \(x=2\) and a vertical asymptote at \(x=-3\)
- Vertical asymptotes at \(x=2\) and \(x=-3\)
- A removable discontinuity at \(x=-3\) only
- Continuous at \(x=2\) with a vertical asymptote at \(x=-3\)
= For \(x\ne 2\), \(f(x)=\dfrac{x+2}{x+3}\). The canceled factor leaves a hole at \(x=2\); the remaining factor in the denominator is zero at \(x=-3\).

@ 1 | n | Limits of composite functions
Suppose \(\displaystyle\lim_{x\to 1} g(x)=2\), \(f(2)=5\), and \(\displaystyle\lim_{t\to 2} f(t)=3\). Why can \(\displaystyle\lim_{x\to 1} f(g(x))\) not be determined from this information?
* \(g(x)\) might equal \(2\) near \(x=1\), or approach \(2\) without equaling it
- A composition of two functions never has a limit
- The limit must equal \(f(2)=5\)
- The limit must equal \(3\)
= If \(g\) is constantly \(2\), the composition equals \(5\). If \(g\) approaches \(2\) without taking that value, the composition approaches \(3\). The result depends on \(g\) because \(f\) is not continuous at \(2\).

@ 1 | n | Infinite limits
What is \(\displaystyle\lim_{x\to 2^-} \dfrac{x+1}{x^2-4}\)?
* \(-\infty\)
- \(+\infty\)
- \(\dfrac{3}{4}\)
- \(0\)
= The numerator approaches \(3\) while \((x-2)(x+2)\) approaches \(0\) through negative values, so the quotient decreases without bound.

@ 1 | n | Continuity from a graph
The graph of a function \(f\) approaches the point \((-1,4)\) from both sides, but the graph has an open circle there and a filled point at \((-1,2)\). Which single change would make \(f\) continuous at \(x=-1\)?
* Redefine \(f(-1)\) to be \(4\)
- Remove the point \((-1,2)\) and leave \(f(-1)\) undefined
- Redefine \(f(-1)\) to be \(0\)
- Change the values of \(f\) only for \(x>3\)
= The limit as \(x\to -1\) is \(4\). Continuity requires the function value at \(-1\) to equal that limit.

@ 1 | n | Limits from a graph | jump
The graph of the function \(f\) is shown. What is the value of \(\displaystyle\lim_{x\to 2^-} f(x)-\lim_{x\to 2^+} f(x)\)?
* \(4\)
- \(2\)
- \(0\)
- The value cannot be determined because \(\displaystyle\lim_{x\to 2} f(x)\) does not exist.
= From the left the graph approaches \(3\); from the right it approaches \(-1\). The difference is \(3-(-1)=4\). The filled point \(f(2)=1\) does not affect either one-sided limit.

@ 1 | n | Types of discontinuity | holes
The graph of the function \(f\) on \([-3,5]\) is shown. For which values of \(a\) does \(\displaystyle\lim_{x\to a} f(x)\) exist while \(f\) is not continuous at \(x=a\)?
* \(a=3\) only
- \(a=-1\) only
- \(a=-1\) and \(a=3\)
- There is no such value of \(a\).
= At \(x=3\) both sides approach \(1\) but \(f(3)=3\), a removable discontinuity. At \(x=-1\) the left- and right-hand limits are \(2\) and \(3\), so the limit does not exist.

@ 1 | c | Numerical limits
Let \(f(x)=\dfrac{2^x-4}{x-2}\) for \(x\ne 2\). Based on values of \(f\) near \(x=2\), what is \(\displaystyle\lim_{x\to 2} f(x)\) to the nearest thousandth?
* \(2.773\)
- \(1.386\)
- \(2.000\)
- \(4.000\)
= Evaluating \(f\) at inputs such as \(1.999\) and \(2.001\) gives values near \(2.773\). The limit is the derivative of \(2^x\) at \(x=2\), which is \(4\ln 2\approx 2.773\).

@ 1 | c | Intermediate value theorem
The function \(f(x)=\cos x-\dfrac{x}{2}\) is continuous, with \(f(0)>0\) and \(f(2)<0\). At what value \(c\) in \((0,2)\) does \(f(c)=0\)?
* \(1.030\)
- \(0.739\)
- \(1.571\)
- \(0.667\)
= The Intermediate Value Theorem guarantees a zero in \((0,2)\). Solving \(\cos x=\dfrac{x}{2}\) numerically gives \(c\approx 1.030\); \(0.739\) solves \(\cos x=x\) instead.

@ 1 | c | Numerical limits
What is \(\displaystyle\lim_{x\to 0} (1+0.3x)^{1/x}\) to the nearest thousandth?
* \(1.350\)
- \(1.300\)
- \(1.000\)
- \(2.718\)
= Values of the expression for \(x\) near \(0\) approach \(1.350\). Analytically, the natural logarithm of the expression is \(\dfrac{\ln(1+0.3x)}{x}\), which approaches \(0.3\), so the limit is \(e^{0.3}\approx 1.350\).

@ 1 | c | Continuity
Let \(f(x)=\begin{cases} \dfrac{\sin(2x)}{x}, & x<0 \\[2ex] k\,e^{x}+\ln(x+3), & x\ge 0 \end{cases}\). For what value of \(k\) is \(f\) continuous at \(x=0\)?
* \(0.901\)
- \(1.099\)
- \(2.000\)
- \(-0.099\)
= The left-hand limit is \(2\) because \(\dfrac{\sin(2x)}{2x}\to 1\). The right-hand value is \(k+\ln 3\), so \(k=2-\ln 3\approx 0.901\).

@ 2 | n | Definition of the derivative
For \(f(x)=\ln x\), which of the following expressions equals \(f'(3)\)?
* \(\displaystyle\lim_{h\to 0} \dfrac{\ln\!\left(1+\frac{h}{3}\right)}{h}\)
- \(\displaystyle\lim_{h\to 0} \dfrac{\ln(3+h)}{h}\)
- \(\displaystyle\lim_{h\to 0} \dfrac{\ln(3+h)-\ln 3}{3}\)
- \(\displaystyle\lim_{h\to 0} \dfrac{\ln(1+h)}{h}\)
= The difference quotient is \(\dfrac{\ln(3+h)-\ln 3}{h}=\dfrac{\ln\!\left(\frac{3+h}{3}\right)}{h}\). Its limit is \(f'(3)=\dfrac{1}{3}\).

@ 2 | n | Product rule
At \(x=2\): \(f=3\), \(f'=-4\), \(g=-2\), and \(g'=5\). If \(H(x)=f(x)\,g(x)\), what is \(H'(2)\)?
* \(23\)
- \(7\)
- \(-20\)
- \(-23\)
= \(H'=f'g+fg'=(-4)(-2)+(3)(5)=23\). Multiplying the two derivatives is not the product rule.

@ 2 | n | Quotient rule
At \(x=1\): \(p=4\), \(p'=-1\), \(q=2\), and \(q'=3\). What is the derivative of \(\dfrac{p}{q}\) at \(x=1\)?
* \(-\dfrac{7}{2}\)
- \(-\dfrac{1}{3}\)
- \(\dfrac{5}{2}\)
- \(-7\)
= The quotient rule gives \(\dfrac{p'q-pq'}{q^2}=\dfrac{(-1)(2)-(4)(3)}{4}=-\dfrac{7}{2}\).

@ 2 | n | Differentiability
Let \(f(x)=\begin{cases} x^2, & x\le 1 \\ ax+b, & x>1 \end{cases}\). For which values of \(a\) and \(b\) is \(f\) differentiable at \(x=1\)?
* \(a=2\) and \(b=-1\)
- \(a=1\) and \(b=0\)
- \(a=2\) and \(b=1\)
- \(a=0\) and \(b=1\)
= Matching derivatives at \(x=1\) gives \(a=2\). Continuity then requires \(a+b=1\), so \(b=-1\).

@ 2 | n | Tangent lines
Which of the following is an equation of the line tangent to \(y=x^3-2x\) at \(x=-1\)?
* \(y=x+2\)
- \(y=-x\)
- \(y=5x+6\)
- \(y=x-2\)
= At \(x=-1\) the point is \((-1,1)\) and the slope is \(3x^2-2=1\). The tangent line is \(y-1=x+1\).

@ 2 | n | Higher-order derivatives
If \(f(x)=x^4-2x^3+5x\), what is \(f''(-1)\)?
* \(24\)
- \(-24\)
- \(12\)
- \(-5\)
= \(f'(x)=4x^3-6x^2+5\) and \(f''(x)=12x^2-12x\). At \(x=-1\) this is \(12+12=24\).

@ 2 | n | Derivatives of trigonometric functions
If \(y=x\cos x\), what is the slope of the line tangent to the graph at \(x=\dfrac{\pi}{2}\)?
* \(-\dfrac{\pi}{2}\)
- \(0\)
- \(\dfrac{\pi}{2}\)
- \(-1\)
= \(\dfrac{dy}{dx}=\cos x-x\sin x\). At \(x=\dfrac{\pi}{2}\) this is \(0-\dfrac{\pi}{2}\).

@ 2 | n | Differentiability and continuity
If \(f\) is differentiable at \(x=a\) and \(f'(a)=0\), which of the following must be true?
* \(f\) is continuous at \(x=a\)
- \(f\) has a local maximum at \(x=a\)
- \(f\) has a local minimum at \(x=a\)
- \(f\) is constant near \(x=a\)
= Differentiability implies continuity. A zero derivative alone does not guarantee an extremum, as \(f(x)=x^3\) at \(x=0\) shows.

@ 2 | n | Estimating derivatives
A table gives \(f(1.8)=6.02\) and \(f(2.2)=6.94\). Using the secant line through these points, what is the best estimate of \(f'(2)\)?
* \(2.3\)
- \(0.92\)
- \(0.46\)
- \(4.6\)
= The estimate is \(\dfrac{6.94-6.02}{2.2-1.8}=\dfrac{0.92}{0.4}=2.3\).

@ 2 | n | Vertical tangents
For \(f(x)=x^{1/3}\), which statement about \(x=0\) is true?
* \(f\) is continuous at \(x=0\) but not differentiable there
- \(f\) is not continuous at \(x=0\)
- \(f'(0)=0\)
- The left- and right-hand limits of \(f\) at \(x=0\) differ
= \(f\) approaches \(0\) from both sides, but the difference quotient \(\dfrac{h^{1/3}}{h}=\dfrac{1}{h^{2/3}}\) grows without bound, so the graph has a vertical tangent.

@ 2 | n | Horizontal tangents
For \(x>0\), let \(f(x)=\dfrac{e^x}{x}\). At what value of \(x\) is the line tangent to the graph of \(f\) horizontal?
* \(x=1\)
- \(x=e\)
- \(x=\dfrac{1}{e}\)
- There is no such value of \(x\).
= \(f'(x)=\dfrac{e^x(x-1)}{x^2}\). Since \(e^x\) and \(x^2\) are never zero for \(x>0\), \(f'(x)=0\) only at \(x=1\).

@ 2 | n | Difference quotients
If \(f'(5)=-3\), what is \(\displaystyle\lim_{h\to 0} \dfrac{f(5+2h)-f(5)}{h}\)?
* \(-6\)
- \(-3\)
- \(-\dfrac{3}{2}\)
- \(6\)
= Let \(k=2h\). The expression equals \(2\cdot\dfrac{f(5+k)-f(5)}{k}\), whose limit is \(2f'(5)=-6\).

@ 2 | n | Derivatives from a graph | corners
The graph of \(f\), consisting of four line segments, is shown. What is \(f'(2)\)?
* \(-2\)
- \(2\)
- \(0\)
- \(-\dfrac{1}{2}\)
= At \(x=2\) the graph lies on the segment from \((1,2)\) to \((3,-2)\), whose slope is \(\dfrac{-2-2}{3-1}=-2\).

@ 2 | n | Differentiability from a graph | corners
The graph of \(f\), consisting of four line segments, is shown. At how many values of \(x\) in the open interval \((-4,5)\) is \(f\) not differentiable?
* Three
- One
- Two
- Four
= The slope changes abruptly at the corners \(x=-2\), \(x=1\), and \(x=3\), so \(f\) is not differentiable at those three points. It is differentiable everywhere else in the interval.

@ 2 | c | Derivatives at a point
If \(f(x)=x^2\sin x\), what is \(f'(1.7)\)?
* \(2.999\)
- \(3.372\)
- \(-0.438\)
- \(-0.372\)
= The product rule gives \(f'(x)=2x\sin x+x^2\cos x\). In radian mode, \(f'(1.7)\approx 3.372-0.372=2.999\).

@ 2 | c | Average rate of change
What is the average rate of change of \(f(x)=\ln(x^2+1)\) on the interval \([1,3]\)?
* \(0.805\)
- \(1.609\)
- \(0.600\)
- \(1.000\)
= The average rate is \(\dfrac{f(3)-f(1)}{3-1}=\dfrac{\ln 10-\ln 2}{2}\approx 0.805\). The values \(0.600\) and \(1.000\) are the instantaneous rates \(f'(3)\) and \(f'(1)\).

@ 2 | c | Tangent lines
The line tangent to the graph of \(f(x)=\sqrt{x}+\cos x\) at \(x=2\) crosses the \(y\)-axis at what value of \(y\)?
* \(2.110\)
- \(0.998\)
- \(-0.556\)
- \(-0.113\)
= \(f(2)\approx 0.998\) and \(f'(2)=\dfrac{1}{2\sqrt{2}}-\sin 2\approx -0.556\). The tangent line \(y=0.998-0.556(x-2)\) has \(y\)-intercept \(0.998+1.111\approx 2.110\).

@ 2 | c | Parallel tangents
At what value of \(x\) in the interval \((0,3)\) is the line tangent to the graph of \(f(x)=x^3-e^x\) parallel to the line \(y=2x\)?
* \(1.440\)
- \(0.910\)
- \(2.818\)
- \(2.000\)
= Parallel lines have equal slopes, so solve \(f'(x)=3x^2-e^x=2\). The only solution in \((0,3)\) is \(x\approx 1.440\); \(0.910\) is where \(f'(x)=0\).

@ 3 | n | Chain rule
If \(f(x)=\sin^2(3x)\), what is \(f'(x)\)?
* \(6\sin(3x)\cos(3x)\)
- \(2\sin(3x)\cos(3x)\)
- \(6\sin(3x)\)
- \(3\cos^2(3x)\)
= Differentiate the square, then \(\sin(3x)\), then \(3x\): \(2\sin(3x)\cdot\cos(3x)\cdot 3\).

@ 3 | n | Implicit differentiation
The curve \(x^2+2xy+3y^2=12\) passes through the point \((0,2)\). What is \(\dfrac{dy}{dx}\) at that point?
* \(-\dfrac{1}{3}\)
- \(-3\)
- \(0\)
- \(\dfrac{1}{3}\)
= Differentiating gives \(2x+2y+2x\dfrac{dy}{dx}+6y\dfrac{dy}{dx}=0\). At \((0,2)\): \(4+12\dfrac{dy}{dx}=0\), so \(\dfrac{dy}{dx}=-\dfrac{1}{3}\).

@ 3 | n | Derivatives of inverse functions
The function \(f\) is one-to-one and differentiable, with \(f(3)=7\) and \(f'(3)=-2\). If \(g=f^{-1}\), what is \(g'(7)\)?
* \(-\dfrac{1}{2}\)
- \(-2\)
- \(\dfrac{1}{2}\)
- \(\dfrac{1}{7}\)
= \(g'(7)=\dfrac{1}{f'(g(7))}=\dfrac{1}{f'(3)}=-\dfrac{1}{2}\).

@ 3 | n | Derivatives of logarithmic functions
What is \(\dfrac{d}{dx}\left[\ln(x^2+4)\right]\)?
* \(\dfrac{2x}{x^2+4}\)
- \(\dfrac{1}{x^2+4}\)
- \(\dfrac{2}{x}\)
- \(\dfrac{x^2+4}{2x}\)
= For \(\ln u\), the derivative is \(\dfrac{u'}{u}\). Here \(u=x^2+4\) and \(u'=2x\).

@ 3 | n | Derivatives of inverse trigonometric functions
What is the value of \(\dfrac{d}{dx}\left[\arctan(2x)\right]\) at \(x=\dfrac{1}{2}\)?
* \(1\)
- \(\dfrac{1}{2}\)
- \(2\)
- \(4\)
= The chain rule gives \(\dfrac{2}{1+4x^2}\), which equals \(\dfrac{2}{2}=1\) at \(x=\dfrac{1}{2}\).

@ 3 | n | Chain rule with selected values
Given \(f'(2)=4\), \(g(2)=5\), \(g'(2)=-3\), and \(f'(5)=7\), what is \((f\circ g)'(2)\)?
* \(-21\)
- \(-12\)
- \(28\)
- \(-\dfrac{3}{7}\)
= The outer derivative is evaluated at \(g(2)=5\): \(f'(g(2))\,g'(2)=f'(5)(-3)=-21\).

@ 3 | n | Second derivatives of implicit relations
For the circle \(x^2+y^2=25\), what is \(\dfrac{d^2y}{dx^2}\) at the point \((3,4)\)?
* \(-\dfrac{25}{64}\)
- \(-\dfrac{3}{4}\)
- \(\dfrac{25}{64}\)
- \(-\dfrac{1}{4}\)
= From \(x+y\,y'=0\), \(y'=-\dfrac{3}{4}\). Differentiating again gives \(1+(y')^2+y\,y''=0\), so \(y''=-\dfrac{1+\frac{9}{16}}{4}=-\dfrac{25}{64}\).

@ 3 | n | Exponential composites
If \(y=e^{x^2-3x}\), at what value of \(x\) is the tangent line horizontal?
* \(x=\dfrac{3}{2}\)
- \(x=0\) and \(x=3\)
- \(x=-\dfrac{3}{2}\)
- There is no such value of \(x\).
= \(\dfrac{dy}{dx}=(2x-3)e^{x^2-3x}\). The exponential factor is never zero, so \(2x-3=0\).

@ 3 | n | Inverse functions and the chain rule
The function \(f\) is invertible and differentiable, with \(f(2)=4\) and \(f'(2)=5\). If \(H(x)=f^{-1}(3x+1)\), what is \(H'(1)\)?
* \(\dfrac{3}{5}\)
- \(\dfrac{1}{5}\)
- \(\dfrac{5}{3}\)
- \(15\)
= \(H'(x)=3\,(f^{-1})'(3x+1)\). At \(x=1\), \((f^{-1})'(4)=\dfrac{1}{f'(2)}=\dfrac{1}{5}\), so \(H'(1)=\dfrac{3}{5}\).

@ 3 | n | Horizontal tangents of implicit curves
For the curve \(x^2+xy+y^2=7\), which condition must hold at any point where the tangent line is horizontal?
* \(2x+y=0\)
- \(x+2y=0\)
- \(x+y=0\)
- \(x=0\)
= Implicit differentiation gives \(\dfrac{dy}{dx}=-\dfrac{2x+y}{x+2y}\). A horizontal tangent requires the numerator to be zero (with a nonzero denominator).

@ 3 | n | Nested chain rule
What is \(\dfrac{d}{dx}\left[\sqrt{1+e^{2x}}\right]\)?
* \(\dfrac{e^{2x}}{\sqrt{1+e^{2x}}}\)
- \(\dfrac{1}{2\sqrt{1+e^{2x}}}\)
- \(2e^{2x}\sqrt{1+e^{2x}}\)
- \(\dfrac{e^{x}}{\sqrt{1+e^{2x}}}\)
= The square root contributes \(\dfrac{1}{2\sqrt{u}}\) and the inner function contributes \(2e^{2x}\); the factors of \(2\) cancel.

@ 3 | n | Piecewise differentiability
Let \(f(x)=\begin{cases} \sin x, & x\le 0 \\ ax^2+bx+c, & x>0 \end{cases}\). Which condition makes \(f\) differentiable at \(x=0\)?
* \(b=1\) and \(c=0\), with \(a\) any real number
- \(a=1\) and \(b=c=0\)
- \(b=0\) and \(c=1\), with \(a\) any real number
- \(a=b=c=0\)
= Continuity requires \(c=\sin 0=0\). The left-hand derivative is \(\cos 0=1\), and the right-hand derivative at \(0\) is \(b\), so \(b=1\). The quadratic term does not affect either condition.

@ 3 | n | Chain rule from a table | fg
Selected values of the differentiable functions \(f\) and \(g\) and their derivatives are shown in the table. If \(h(x)=f(g(x))\), what is \(h'(1)\)?
* \(12\)
- \(-6\)
- \(4\)
- \(15\)
= \(h'(1)=f'(g(1))\,g'(1)=f'(2)\cdot 3=4\cdot 3=12\). Using \(f'(1)\) instead of \(f'(g(1))\) gives \(-6\).

@ 3 | n | Inverse derivatives from a table | fg
Selected values of the differentiable functions \(f\) and \(g\) and their derivatives are shown in the table. The function \(g\) is invertible. What is \(\left(g^{-1}\right)'(1)\)?
* \(\dfrac{1}{6}\)
- \(\dfrac{1}{3}\)
- \(6\)
- \(-1\)
= Since \(g(3)=1\), \(g^{-1}(1)=3\) and \(\left(g^{-1}\right)'(1)=\dfrac{1}{g'(3)}=\dfrac{1}{6}\). Using \(g'(1)\) gives \(\dfrac{1}{3}\), which evaluates the derivative at the wrong input.

@ 3 | c | Chain rule
If \(y=\ln\!\left(3+\sin(x^2)\right)\), what is \(\dfrac{dy}{dx}\) at \(x=1.2\)?
* \(0.078\)
- \(0.033\)
- \(0.313\)
- \(0.251\)
= The chain rule gives \(\dfrac{dy}{dx}=\dfrac{2x\cos(x^2)}{3+\sin(x^2)}\). At \(x=1.2\) this is \(\dfrac{0.313}{3.991}\approx 0.078\).

@ 3 | c | Implicit differentiation
The curve \(y+\cos y=x^3\) contains a point with \(y=1\). What is \(\dfrac{dy}{dx}\) at that point?
* \(25.240\)
- \(4.001\)
- \(2.173\)
- \(0.040\)
= At \(y=1\), \(x^3=1+\cos 1\), so \(x\approx 1.155\). Differentiating implicitly gives \((1-\sin y)\dfrac{dy}{dx}=3x^2\), so \(\dfrac{dy}{dx}=\dfrac{3x^2}{1-\sin 1}\approx 25.240\).

@ 3 | c | Derivatives of inverse functions
Let \(f(x)=x^3+2x+e^x\) and let \(g\) be the inverse of \(f\). What is \(g'(4)\)?
* \(0.174\)
- \(0.010\)
- \(5.760\)
- \(0.333\)
= Solve \(f(a)=4\) to get \(a\approx 0.743\). Then \(g'(4)=\dfrac{1}{f'(a)}=\dfrac{1}{3a^2+2+e^a}\approx\dfrac{1}{5.760}\approx 0.174\). Using \(f'(4)\) evaluates the derivative at the wrong input.

@ 3 | c | Derivatives of inverse trigonometric functions
If \(f(x)=\arctan(e^x)\), what is \(f'(0.5)\)?
* \(0.443\)
- \(0.269\)
- \(1.649\)
- \(0.800\)
= The chain rule gives \(f'(x)=\dfrac{e^x}{1+e^{2x}}\). At \(x=0.5\) this is \(\dfrac{1.649}{3.718}\approx 0.443\).

@ 4 | n | Related rates
A 10-foot ladder leans against a vertical wall. The base of the ladder slides away from the wall at 2 feet per second. When the base is 6 feet from the wall, at what rate is the height of the top of the ladder changing?
* \(-\dfrac{3}{2}\) ft/s
- \(\dfrac{3}{2}\) ft/s
- \(-\dfrac{8}{3}\) ft/s
- \(-2\) ft/s
= With \(x^2+y^2=100\), \(y=8\) when \(x=6\). Differentiating: \(x\dfrac{dx}{dt}+y\dfrac{dy}{dt}=0\), so \(\dfrac{dy}{dt}=-\dfrac{6(2)}{8}=-\dfrac{3}{2}\) ft/s.

@ 4 | n | Related rates
Water is poured into a conical container in which the radius of the water surface is always half the depth \(h\) of the water. The volume of water increases at \(3\pi\text{ cm}^3\text{/s}\). What is \(\dfrac{dh}{dt}\) when \(h=6\) cm? (The volume of a cone is \(V=\frac{1}{3}\pi r^2h\).)
* \(\dfrac{1}{3}\) cm/s
- \(1\) cm/s
- \(\dfrac{1}{12}\) cm/s
- \(3\) cm/s
= With \(r=\dfrac{h}{2}\), \(V=\dfrac{\pi h^3}{12}\), so \(\dfrac{dV}{dt}=\dfrac{\pi h^2}{4}\dfrac{dh}{dt}\). At \(h=6\): \(3\pi=9\pi\dfrac{dh}{dt}\), giving \(\dfrac{1}{3}\) cm/s.

@ 4 | n | Rectilinear motion
A particle moves along the \(x\)-axis with velocity \(v(t)=(t-1)(t-4)\) for \(0<t<5\). On which intervals is the speed of the particle increasing?
* \(\left(1,\dfrac{5}{2}\right)\) and \((4,5)\)
- \((0,1)\) and \(\left(\dfrac{5}{2},4\right)\)
- \((1,4)\) only
- \(\left(\dfrac{5}{2},5\right)\) only
= Acceleration is \(a(t)=2t-5\). Speed increases when \(v\) and \(a\) have the same sign: both negative on \(\left(1,\dfrac{5}{2}\right)\) and both positive on \((4,5)\).

@ 4 | n | Linear approximation
Using the line tangent to \(f(x)=x^{1/3}\) at \(x=8\), what is the approximation of \(f(8.24)\)?
* \(2.02\)
- \(2.08\)
- \(2.24\)
- \(1.98\)
= \(f(8)=2\) and \(f'(8)=\dfrac{1}{3}(8)^{-2/3}=\dfrac{1}{12}\). The estimate is \(2+\dfrac{1}{12}(0.24)=2.02\).

@ 4 | n | Interpreting derivatives
\(W(t)\) is the volume of water in a tank, in liters, at time \(t\) minutes. Given \(W'(4)=-6\) and \(W''(4)=2\), which statement describes the tank at \(t=4\)?
* The volume is decreasing, and its rate of change is increasing.
- The volume is increasing at 2 liters per minute.
- The volume is decreasing at a faster and faster rate.
- The tank contains \(-6\) liters of water.
= \(W'(4)<0\) means the volume is decreasing. \(W''(4)>0\) means \(W'\) is increasing, so the rate of loss is becoming less negative.

@ 4 | n | L’Hospital’s Rule
What is \(\displaystyle\lim_{x\to 0} \dfrac{e^{3x}-1-3x}{x^2}\)?
* \(\dfrac{9}{2}\)
- \(3\)
- \(9\)
- \(0\)
= The limit has the form \(\dfrac{0}{0}\). Applying L’Hospital’s Rule twice gives \(\displaystyle\lim_{x\to 0}\dfrac{9e^{3x}}{2}=\dfrac{9}{2}\).

@ 4 | n | Linearization error
The function \(f\) is twice differentiable with \(f''(x)>0\) near \(x=2\). How does the tangent-line approximation \(L(2.1)\) compare with \(f(2.1)\)?
* \(L(2.1)\) is an underestimate.
- \(L(2.1)\) is an overestimate.
- \(L(2.1)=f(2.1)\)
- The sign of \(f'(2)\) is needed to decide.
= A graph that is concave up lies above its tangent lines near the point of tangency, so the tangent line underestimates \(f\). The sign of \(f'(2)\) does not matter.

@ 4 | n | Related rates
At a certain instant, a rectangle has length 8 cm increasing at 2 cm/s and width 5 cm decreasing at 1 cm/s. At what rate is the area changing at that instant?
* \(2\text{ cm}^2\text{/s}\)
- \(-2\text{ cm}^2\text{/s}\)
- \(18\text{ cm}^2\text{/s}\)
- \(-16\text{ cm}^2\text{/s}\)
= Differentiate \(A=\ell w\): \(\dfrac{dA}{dt}=\dfrac{d\ell}{dt}w+\ell\dfrac{dw}{dt}=2(5)+8(-1)=2\text{ cm}^2\text{/s}\).

@ 4 | n | Rates of change in context
\(C(q)\) is the cost, in dollars, of producing \(q\) items. Which quantity is best estimated by \(C'(200)=12\)?
* The additional cost of producing the 201st item
- The average cost per item of the first 200 items
- The total cost of producing 200 items
- The number of items produced per dollar
= \(C'(200)\) is the marginal cost in dollars per item. Increasing production by one item changes cost by approximately 12 dollars.

@ 4 | n | Conditions for L’Hospital’s Rule
To which of the following limits can L’Hospital’s Rule be applied directly, without first rewriting the expression?
* \(\displaystyle\lim_{x\to 0} \dfrac{1-\cos x}{x^2}\)
- \(\displaystyle\lim_{x\to 0} \dfrac{2+\sin x}{1+x}\)
- \(\displaystyle\lim_{x\to 0^+} x\ln x\)
- \(\displaystyle\lim_{x\to \infty} \left(x-\sqrt{x^2+1}\right)\)
= \(\dfrac{1-\cos x}{x^2}\) is a \(\dfrac{0}{0}\) quotient of differentiable functions, so the rule applies as written. The product \(x\ln x\) and the difference \(x-\sqrt{x^2+1}\) must first be rewritten as quotients, and \(\dfrac{2+\sin x}{1+x}\) is not indeterminate.

@ 4 | n | Derivative of an inverse in context
The temperature \(T(t)\) of an object, in degrees, decreases as time \(t\), in minutes, increases. Given \(T(10)=60\) and \(T'(10)=-4\), what is the derivative of the inverse function \(T^{-1}\) at 60 degrees?
* \(-\dfrac{1}{4}\) minute per degree
- \(-4\) degrees per minute
- \(\dfrac{1}{4}\) minute per degree
- \(-15\) minutes per degree
= The inverse rate is the reciprocal: \(\dfrac{dt}{dT}=\dfrac{1}{dT/dt}=-\dfrac{1}{4}\). The units also invert.

@ 4 | n | Motion at a turning point
A particle moves along a line with \(v(2)=0\) and continuous acceleration \(a(t)>0\) near \(t=2\). What happens at \(t=2\)?
* The particle changes from moving left to moving right.
- The particle changes from moving right to moving left.
- The position of the particle has a local maximum.
- The speed of the particle is increasing just before and just after \(t=2\).
= Positive acceleration makes \(v\) increasing near \(t=2\), so \(v\) changes from negative to positive. The particle reverses from left to right and its position has a local minimum.

@ 4 | n | Acceleration from a velocity graph | velocity
A particle moves along the \(x\)-axis. The graph of its velocity \(v\), consisting of four line segments, is shown for \(0\le t\le 8\). What is the acceleration of the particle at \(t=3\)?
* \(-2\)
- \(0\)
- \(2\)
- \(-1\)
= Acceleration is the slope of the velocity graph. On \(2<t<4\) the graph falls from \(2\) to \(-2\), so \(a(3)=\dfrac{-2-2}{4-2}=-2\). The velocity is \(0\) at \(t=3\), but the acceleration is not.

@ 4 | n | Speed from a velocity graph | velocity
A particle moves along the \(x\)-axis. The graph of its velocity \(v\), consisting of four line segments, is shown for \(0\le t\le 8\). On which interval is the speed of the particle increasing?
* \(3<t<4\)
- \(2<t<3\)
- \(2<t<4\)
- \(6<t<8\)
= Speed increases when velocity and acceleration have the same sign. On \(3<t<4\) both are negative. On \(2<t<3\) velocity is positive while acceleration is negative, and on \(6<t<8\) velocity is negative while acceleration is positive.

@ 4 | c | Rates of change
A sample cools according to \(T(t)=20+30e^{-0.24t}\), where \(t\) is in minutes and \(T\) is in degrees. What is \(T'(5)\), in degrees per minute?
* \(-2.169\)
- \(-9.036\)
- \(-0.072\)
- \(2.169\)
= \(T'(t)=-7.2e^{-0.24t}\). At \(t=5\) the rate is approximately \(-2.169\) degrees per minute.

@ 4 | c | Rectilinear motion
A particle moves along a line with velocity \(v(t)=\sin t-0.2t\). At what time \(t\) in the interval \((2,3)\) does the particle change direction?
* \(2.596\)
- \(2.000\)
- \(2.500\)
- \(3.000\)
= Solve \(\sin t=0.2t\) numerically on \((2,3)\). The velocity changes from positive to negative at \(t\approx 2.596\).

@ 4 | c | Instantaneous rates
The volume of water in a tank is \(V(t)=40+4\sin t+\dfrac{t^3}{3}\) liters at time \(t\) minutes. What is the instantaneous rate of change of the volume at \(t=1.3\)?
* \(2.760\)
- \(1.737\)
- \(3.567\)
- \(5.398\)
= \(V'(t)=4\cos t+t^2\). In radian mode, \(V'(1.3)\approx 2.760\) liters per minute.

@ 4 | c | L’Hospital’s Rule
Let \(a=1.7\). What is \(\displaystyle\lim_{x\to 0} \dfrac{a^x-1-x\ln a}{x^2/2}\) to the nearest thousandth?
* \(0.282\)
- \(0.531\)
- \(1.061\)
- \(1.700\)
= Two applications of L’Hospital’s Rule give \((\ln a)^2\). For \(a=1.7\) the value is approximately \(0.282\).

@ 5 | n | Mean Value Theorem
The function \(f\) is continuous on \([1,5]\) and differentiable on \((1,5)\), with \(f(1)=8\) and \(f(5)=0\). Which of the following must be true?
* \(f'(c)=-2\) for some \(c\) in \((1,5)\)
- \(f'(3)=-2\)
- \(f\) has a local minimum in \((1,5)\)
- \(f'(x)<0\) for all \(x\) in \((1,5)\)
= The average rate of change is \(\dfrac{0-8}{5-1}=-2\). The Mean Value Theorem guarantees an equal instantaneous rate somewhere in the interval, not necessarily at the midpoint.

@ 5 | n | Critical points
If \(f'(x)=(x+1)^2(x-3)\), which statement about \(f\) is true?
* \(f\) has a local minimum at \(x=3\) and no extremum at \(x=-1\)
- \(f\) has a local maximum at \(x=-1\) and a local minimum at \(x=3\)
- \(f\) has local minima at both \(x=-1\) and \(x=3\)
- \(f\) has a local maximum at \(x=3\)
= The squared factor does not change sign at \(x=-1\). \(f'\) changes from negative to positive at \(x=3\), giving a local minimum there.

@ 5 | n | Concavity
If \(f''(x)=x(x-2)^2\), at which values of \(x\) does the graph of \(f\) have a point of inflection?
* \(x=0\) only
- \(x=2\) only
- \(x=0\) and \(x=2\)
- The graph has no points of inflection.
= \(f''\) changes sign at \(x=0\) but not at \(x=2\). A zero of \(f''\) without a change in concavity is not a point of inflection.

@ 5 | n | Absolute extrema
What is the absolute minimum value of \(f(x)=x^3-3x\) on the interval \([-2,3]\)?
* \(-2\)
- \(-18\)
- \(0\)
- \(2\)
= Compare endpoints and critical points \(x=\pm 1\): \(f(-2)=-2\), \(f(-1)=2\), \(f(1)=-2\), \(f(3)=18\). The minimum value is \(-2\).

@ 5 | n | Optimization
A rectangle has a perimeter of 36 cm. What is its greatest possible area?
* \(81\text{ cm}^2\)
- \(72\text{ cm}^2\)
- \(162\text{ cm}^2\)
- \(324\text{ cm}^2\)
= With side lengths \(x\) and \(18-x\), \(A=18x-x^2\), a concave-down quadratic maximized at \(x=9\). The maximum area is \(81\text{ cm}^2\).

@ 5 | n | Second Derivative Test
If \(f'(4)=0\) and \(f''(4)=-3\), which conclusion follows?
* \(f\) has a local maximum at \(x=4\)
- \(f\) has a local minimum at \(x=4\)
- The graph of \(f\) has a point of inflection at \(x=4\)
- \(f(4)=-3\)
= At a critical point where the second derivative is negative, the graph is concave down, so \(f\) has a local maximum. Nothing is known about the value \(f(4)\).

@ 5 | n | Behavior of \(f\) from \(f'\)
The graph of \(f'\) lies above the \(x\)-axis and is decreasing on the interval \((2,6)\). Which of the following describes \(f\) on that interval?
* Increasing and concave down
- Decreasing and concave up
- Increasing and concave up
- Decreasing and concave down
= \(f'>0\) means \(f\) is increasing, and a decreasing \(f'\) means \(f''<0\), so the graph of \(f\) is concave down.

@ 5 | n | Hypotheses of the Mean Value Theorem
Why does the Mean Value Theorem not apply to \(f(x)=|x-2|\) on the interval \([0,4]\)?
* \(f\) is not differentiable at a point in \((0,4)\)
- \(f\) is not continuous at an endpoint
- \(f(0)=f(4)\)
- \(f\) has a zero in the interval
= The graph has a corner at \(x=2\), inside the interval. \(f\) is continuous everywhere, but it is not differentiable on all of \((0,4)\).

@ 5 | n | Bounds from the derivative
Suppose \(f(1)=3\) and \(2\le f'(x)\le 5\) for all \(x\) in \([1,4]\). Which interval must contain \(f(4)\)?
* \([9,18]\)
- \([5,8]\)
- \([6,15]\)
- \([2,5]\)
= Over an interval of length \(3\), \(f\) increases by between \(6\) and \(15\). Adding \(f(1)=3\) gives \(9\le f(4)\le 18\).

@ 5 | n | Optimization
An open-top box is made from a 12-inch by 18-inch sheet by cutting a square of side \(x\) from each corner and folding up the sides. Which equation is solved to find the interior critical points of the volume?
* \(12x^2-120x+216=0\)
- \(4x^2-60x+216=0\)
- \((12-2x)(18-2x)=0\)
- \(12x^2+120x+216=0\)
= \(V=x(12-2x)(18-2x)=4x^3-60x^2+216x\) for \(0<x<6\). Critical points satisfy \(V'(x)=12x^2-120x+216=0\).

@ 5 | n | Critical points where \(f'\) is undefined
For \(f(x)=x^{2/3}\), which statement explains why \(f\) has a minimum at \(x=0\)?
* \(f'\) changes from negative to positive at \(x=0\), although \(f'(0)\) does not exist
- Every minimum occurs where the derivative equals zero
- \(f\) changes from positive to negative at \(x=0\)
- \(f''(x)>0\) on both sides of \(x=0\)
= For \(x\ne 0\), \(f'(x)=\dfrac{2}{3}x^{-1/3}\), which is negative for \(x<0\) and positive for \(x>0\). A critical point can occur where the derivative is undefined.

@ 5 | n | Existence and uniqueness of zeros
The function \(f\) is continuous on \([0,4]\) and differentiable on \((0,4)\), with \(f(0)<0<f(4)\) and \(f'(x)>0\) on \((0,4)\). How many zeros does \(f\) have on \([0,4]\)?
* Exactly one
- At least two
- None
- At least one, but the number cannot be determined
= The Intermediate Value Theorem guarantees a zero. Because \(f'>0\), \(f\) is strictly increasing, so it cannot have two zeros.

@ 5 | n | Extrema from the graph of \(f'\) | fprime
The graph of \(f'\), the derivative of the function \(f\), is shown. At what value of \(x\) does \(f\) have a local maximum?
* \(x=1\)
- \(x=-2\)
- \(x=4\)
- \(x=-2\) and \(x=4\)
= \(f\) has a local maximum where \(f'\) changes from positive to negative, which happens only at \(x=1\). At \(x=-2\) and \(x=4\), \(f'\) changes from negative to positive, so \(f\) has local minima there.

@ 5 | n | Concavity from the graph of \(f'\) | fprime
The graph of \(f'\), the derivative of the function \(f\), is shown. On which interval is the graph of \(f\) concave down?
* Approximately \(-0.7<x<2.7\)
- \(-2<x<1\)
- \(1<x<4\)
- \(x<-2\) and \(1<x<4\)
= The graph of \(f\) is concave down where \(f'\) is decreasing, which is between the local maximum and the local minimum of \(f'\). The intervals where \(f'\) is negative describe where \(f\) is decreasing, not its concavity.

@ 5 | c | Optimization
At what value of \(x\) in \([0,2]\) does \(f(x)=\sin x-\dfrac{x^2}{6}\) attain its maximum?
* \(1.170\)
- \(0.000\)
- \(1.571\)
- \(2.000\)
= Solve \(f'(x)=\cos x-\dfrac{x}{3}=0\). \(f'\) changes from positive to negative at \(x\approx 1.170\), and comparing with the endpoints confirms the maximum.

@ 5 | c | Points of inflection
For \(f(x)=xe^{-x^2/4}\), what is the positive \(x\)-coordinate of a point of inflection, to the nearest thousandth?
* \(2.449\)
- \(1.414\)
- \(2.000\)
- \(3.464\)
= \(f''(x)=e^{-x^2/4}\left(\dfrac{x^3}{4}-\dfrac{3x}{2}\right)\). The positive zero at which \(f''\) changes sign is \(x=\sqrt{6}\approx 2.449\).

@ 5 | c | Absolute extrema
At what value of \(x\) does \(f(x)=e^x-3x\) attain its absolute minimum on \([0,2]\)?
* \(1.099\)
- \(0.000\)
- \(0.693\)
- \(2.000\)
= \(f'(x)=e^x-3=0\) at \(x=\ln 3\approx 1.099\). Because \(f''(x)=e^x>0\), this critical point is the minimum.

@ 5 | c | Minimum values
What is the minimum value of \(f(x)=x^2+e^{-x}\) on \([0,2]\)?
* \(0.827\)
- \(0.352\)
- \(1.000\)
- \(4.135\)
= Solving \(2x-e^{-x}=0\) gives \(x\approx 0.352\). Substituting, \(f(0.352)\approx 0.827\). Because \(f'\) is increasing, this critical point gives the minimum.

@ 6 | n | Fundamental Theorem of Calculus
If \(F(x)=\displaystyle\int_2^{x^2}\sqrt{1+t^3}\,dt\), what is \(F'(x)\)?
* \(2x\sqrt{1+x^6}\)
- \(\sqrt{1+x^6}\)
- \(2x\sqrt{1+x^3}\)
- \(\sqrt{1+2x^3}\)
= By the Fundamental Theorem of Calculus and the chain rule, evaluate the integrand at \(x^2\) and multiply by the derivative of \(x^2\).

@ 6 | n | Properties of definite integrals
If \(\displaystyle\int_0^2 f(x)\,dx=3\) and \(\displaystyle\int_2^5 f(x)\,dx=-4\), what is \(\displaystyle\int_5^0 \left[2f(x)+1\right]dx\)?
* \(-3\)
- \(3\)
- \(7\)
- \(-7\)
= \(\displaystyle\int_0^5 f=-1\), so \(\displaystyle\int_0^5(2f+1)\,dx=-2+5=3\). Reversing the limits changes the sign.

@ 6 | n | Integration by substitution
What is the value of \(\displaystyle\int_0^1 x\sqrt{1+3x^2}\,dx\)?
* \(\dfrac{7}{9}\)
- \(\dfrac{7}{3}\)
- \(\dfrac{14}{9}\)
- \(1\)
= Let \(u=1+3x^2\), so \(du=6x\,dx\) and the limits become \(1\) and \(4\). The integral is \(\left[\dfrac{u^{3/2}}{9}\right]_1^4=\dfrac{8-1}{9}\).

@ 6 | n | Riemann sums and definite integrals
Which definite integral equals \(\displaystyle\lim_{n\to\infty}\sum_{i=1}^{n}\dfrac{3}{n}\sqrt{1+\dfrac{9i}{n}}\)?
* \(\displaystyle\int_0^3\sqrt{1+3x}\,dx\)
- \(\displaystyle\int_0^1\sqrt{1+9x}\,dx\)
- \(\displaystyle\int_0^3\sqrt{1+9x}\,dx\)
- \(\displaystyle\int_1^3\sqrt{1+3x}\,dx\)
= The width is \(\Delta x=\dfrac{3}{n}\) and the right endpoints are \(x_i=\dfrac{3i}{n}\), so \(\dfrac{9i}{n}=3x_i\). The sum is a Riemann sum for \(\sqrt{1+3x}\) on \([0,3]\).

@ 6 | n | Trapezoidal sums
A table gives \(f(0)=2\), \(f(1)=6\), and \(f(4)=4\). What is the trapezoidal approximation of \(\displaystyle\int_0^4 f(x)\,dx\) using the two subintervals indicated by the table?
* \(19\)
- \(18\)
- \(16\)
- \(12\)
= The subintervals have different widths: \(\dfrac{1}{2}(1)(2+6)+\dfrac{1}{2}(3)(6+4)=4+15=19\).

@ 6 | n | Accumulation functions
Let \(g(x)=\displaystyle\int_0^x (t-2)(t-5)\,dt\). At what value of \(x\) does \(g\) have a local maximum?
* \(x=2\)
- \(x=5\)
- \(x=0\)
- \(x=\dfrac{7}{2}\)
= \(g'(x)=(x-2)(x-5)\) changes from positive to negative at \(x=2\), so \(g\) has a local maximum there.

@ 6 | n | Net signed area
The graph of the continuous function \(f\) encloses a region of area 6 above the \(x\)-axis on \([0,2]\) and a region of area 9 below the \(x\)-axis on \([2,5]\). If \(G(x)=4+\displaystyle\int_0^x f(t)\,dt\), what is \(G(5)\)?
* \(1\)
- \(19\)
- \(-3\)
- \(7\)
= The definite integral is the net signed area \(6-9=-3\). Adding the initial value gives \(4+(-3)=1\).

@ 6 | n | Comparing Riemann sums
The function \(f\) is positive and decreasing on \([0,4]\). For Riemann sums with subintervals of equal width, which ordering is correct?
* Right sum \(<\displaystyle\int_0^4 f(x)\,dx<\) left sum
- Left sum \(<\displaystyle\int_0^4 f(x)\,dx<\) right sum
- \(\displaystyle\int_0^4 f(x)\,dx\) is less than both sums
- \(\displaystyle\int_0^4 f(x)\,dx\) is greater than both sums
= On each subinterval a decreasing function is largest at the left endpoint and smallest at the right endpoint, so left sums overestimate and right sums underestimate.

@ 6 | n | Antiderivatives with an initial condition
If \(F'(x)=\dfrac{6x}{x^2+2}\) and \(F(0)=1\), what is \(F(x)\)?
* \(1+3\ln\!\left(\dfrac{x^2+2}{2}\right)\)
- \(1+6\ln(x^2+2)\)
- \(3\ln(x^2+2)\)
- \(1+\dfrac{3}{x^2+2}\)
= With \(u=x^2+2\), an antiderivative is \(3\ln(x^2+2)+C\). The condition \(F(0)=1\) gives \(C=1-3\ln 2\).

@ 6 | n | Fundamental Theorem of Calculus
Let \(H(x)=\displaystyle\int_x^4\cos(t^2)\,dt\). What is \(H''(x)\)?
* \(2x\sin(x^2)\)
- \(-2x\sin(x^2)\)
- \(-\cos(x^2)\)
- \(\cos(x^2)\)
= Because \(x\) is the lower limit, \(H'(x)=-\cos(x^2)\). Differentiating again gives \(H''(x)=2x\sin(x^2)\).

@ 6 | n | Accumulation from a graph | accum
The graph of the function \(f\), consisting of four line segments, is shown. Let \(g(x)=\displaystyle\int_0^x f(t)\,dt\). What is \(g(6)\)?
* \(16\)
- \(12\)
- \(8\)
- \(14\)
= Add the areas under the graph from \(0\) to \(6\): a triangle of area \(4\), a rectangle of area \(8\), and a triangle of area \(4\), for a total of \(16\). The value \(14\) is \(g(8)\), which includes the region below the axis.

@ 6 | n | Extrema of an accumulation function | accum
The graph of the function \(f\), consisting of four line segments, is shown. Let \(g(x)=\displaystyle\int_0^x f(t)\,dt\). At what value of \(x\) in \([0,8]\) does \(g\) attain its maximum value?
* \(x=6\)
- \(x=2\)
- \(x=4\)
- \(x=8\)
= \(g'(x)=f(x)\) is positive on \((0,6)\) and negative on \((6,8)\), so \(g\) increases until \(x=6\) and then decreases. The maximum of \(f\) itself occurs on \([2,4]\), which is not where \(g\) is largest.

@ 6 | n | Riemann sums from a table | rate
Water flows into a tank at a rate \(r(t)\), where selected values of the continuous function \(r\) are given in the table. Using a right Riemann sum with the four subintervals indicated by the table, what is the approximation of \(\displaystyle\int_0^{10} r(t)\,dt\)?
* \(42\)
- \(45\)
- \(43.5\)
- \(17\)
= The subinterval widths are \(2\), \(3\), \(2\), and \(3\). Using right endpoints: \(2(5)+3(6)+2(4)+3(2)=42\) liters. The left Riemann sum is \(45\) and the trapezoidal sum is \(43.5\).

@ 6 | c | Numerical integration
What is the value of \(\displaystyle\int_0^2 e^{-x^2}\,dx\) to the nearest thousandth?
* \(0.882\)
- \(0.747\)
- \(1.493\)
- \(1.764\)
= The integrand has no elementary antiderivative; numerical integration gives approximately \(0.882\).

@ 6 | c | Accumulation of a rate
A tank contains 12 liters of water at \(t=0\). Water enters at a rate of \(4+\sin(t^2)\) liters per minute, and no water leaves. How many liters are in the tank at \(t=3\)?
* \(24.774\)
- \(12.000\)
- \(24.000\)
- \(28.000\)
= The amount is the initial amount plus the accumulated inflow: \(12+\displaystyle\int_0^3\left[4+\sin(t^2)\right]dt\approx 24.774\) liters.

@ 6 | c | Net change
A plant grows at a rate of \(\ln(t+2)\) centimeters per day for \(0\le t\le 5\). Approximately how many centimeters does it grow during those five days?
* \(7.235\)
- \(1.443\)
- \(5.000\)
- \(9.730\)
= The growth is \(\displaystyle\int_0^5\ln(t+2)\,dt\approx 7.235\) cm. Dividing by \(5\) would give the average rate instead.

@ 6 | c | Fundamental Theorem of Calculus
If \(F(x)=\displaystyle\int_0^{x^2}\sin(t^2)\,dt\), what is \(F'(1.4)\)?
* \(-1.804\)
- \(-0.644\)
- \(0.986\)
- \(2.759\)
= By the Fundamental Theorem of Calculus and the chain rule, \(F'(x)=2x\sin(x^4)\). In radian mode, \(F'(1.4)\approx -1.804\).

@ 6 | c | Midpoint sums
Using a midpoint Riemann sum with four subintervals of equal width, what is the approximation of \(\displaystyle\int_0^2 e^{-x^2}\,dx\)?
* \(0.883\)
- \(0.932\)
- \(1.130\)
- \(0.632\)
= The width is \(0.5\) and the midpoints are \(0.25\), \(0.75\), \(1.25\), and \(1.75\). The sum \(0.5\left(e^{-0.0625}+e^{-0.5625}+e^{-1.5625}+e^{-3.0625}\right)\approx 0.883\).

@ 6 | c | Net accumulation
A reservoir contains 50 liters at \(t=0\). Water flows in at \(8e^{-0.1t}\) liters per minute and flows out at 3 liters per minute. How many liters are in the reservoir at \(t=6\)?
* \(68.095\)
- \(36.095\)
- \(86.095\)
- \(18.095\)
= The amount is \(50+\displaystyle\int_0^6\left[8e^{-0.1t}-3\right]dt\approx 68.095\) liters. The outflow must be accumulated over the whole interval.

@ 7 | n | Separation of variables
Which function is the solution to \(\dfrac{dy}{dx}=2xy\) with \(y(0)=3\)?
* \(y=3e^{x^2}\)
- \(y=3e^{2x}\)
- \(y=x^2+3\)
- \(y=e^{x^2}+2\)
= Separating variables gives \(\ln|y|=x^2+C\), so \(y=Ce^{x^2}\). The initial condition gives \(C=3\).

@ 7 | n | Slope fields
In the slope field for \(\dfrac{dy}{dx}=x-y\), the line segments are horizontal at every point on which line?
* \(y=x\)
- \(y=-x\)
- \(x=0\)
- \(y=0\)
= Horizontal segments have slope zero, so \(x-y=0\). This line is where solution curves have horizontal tangents; it is not itself a solution.

@ 7 | n | Verifying solutions
Which function satisfies \(\dfrac{dy}{dx}=3y-6\) and \(y(0)=5\)?
* \(y=2+3e^{3x}\)
- \(y=5e^{3x}-6\)
- \(y=2+5e^{3x}\)
- \(y=3+2e^{3x}\)
= For \(y=2+3e^{3x}\), \(\dfrac{dy}{dx}=9e^{3x}=3\left(2+3e^{3x}\right)-6\), and \(y(0)=5\).

@ 7 | n | Particular solutions
If \(\dfrac{dy}{dx}=-\dfrac{x}{y}\) and \(y(0)=4\), which of the following is the solution near \(x=0\)?
* \(y=\sqrt{16-x^2}\)
- \(y=-\sqrt{16-x^2}\)
- \(y=\sqrt{16+x^2}\)
- \(y=4-\dfrac{x^2}{2}\)
= Integrating \(y\,dy=-x\,dx\) gives \(x^2+y^2=16\). The initial condition \(y(0)=4\) selects the positive square root.

@ 7 | n | Long-run behavior
A population \(P\) satisfies \(\dfrac{dP}{dt}=0.2(80-P)\) with \(P(0)=100\). Which statement is true?
* \(P\) decreases toward 80
- \(P\) increases without bound
- \(P\) decreases toward 0
- \(P\) remains at 100
= The solution is \(P=80+20e^{-0.2t}\). Its derivative is negative and \(P\) approaches the equilibrium value \(80\).

@ 7 | n | Concavity of a solution curve
A solution to \(\dfrac{dy}{dx}=x+y\) passes through the point \((0,1)\). What is the concavity of the solution curve at that point?
* Concave up, because \(\dfrac{d^2y}{dx^2}=2\)
- Concave down, because \(\dfrac{d^2y}{dx^2}=-2\)
- Neither, because \(\dfrac{dy}{dx}=1\)
- Concave up, because \(y=1>0\)
= Differentiating gives \(\dfrac{d^2y}{dx^2}=1+\dfrac{dy}{dx}=1+x+y\). At \((0,1)\) this equals \(2>0\).

@ 7 | n | Matching a slope field | fieldSum
A slope field for a differential equation is shown. Which of the following could be the differential equation?
* \(\dfrac{dy}{dx}=x+y\)
- \(\dfrac{dy}{dx}=x-y\)
- \(\dfrac{dy}{dx}=xy\)
- \(\dfrac{dy}{dx}=y-x\)
= The segments are horizontal along the line \(y=-x\), where \(x+y=0\), and slopes are positive above that line. For \(x-y\) and \(y-x\) the horizontal segments would lie along \(y=x\); for \(xy\) they would lie along the axes.

@ 7 | n | Solution curves in a slope field | fieldLogistic
The slope field for a differential equation \(\dfrac{dy}{dt}=g(y)\) is shown. For the particular solution \(y=f(t)\) with \(f(0)=1\), what is \(\displaystyle\lim_{t\to\infty} f(t)\)?
* \(2\)
- \(0\)
- \(1\)
- The limit is infinite.
= The segments are horizontal at \(y=0\) and \(y=2\), which are equilibrium solutions. Between them the slopes are positive, so a solution starting at \(y=1\) increases and levels off toward \(y=2\) without crossing it.

@ 7 | c | Exponential decay
The mass \(M\) of a substance, in grams, satisfies \(\dfrac{dM}{dt}=-0.17M\) with \(M(0)=100\). What is \(M(8)\)?
* \(25.666\)
- \(13.600\)
- \(74.082\)
- \(86.400\)
= \(M(t)=100e^{-0.17t}\), so \(M(8)\approx 25.666\) grams. Subtracting a fixed amount each unit of time does not model proportional decay.

@ 7 | c | Newton’s law of cooling
A temperature \(T\) satisfies \(\dfrac{dT}{dt}=-0.12(T-20)\) with \(T(0)=80\). At what time \(t\) does \(T\) first equal 45?
* \(7.296\)
- \(5.776\)
- \(8.333\)
- \(12.500\)
= The solution is \(T=20+60e^{-0.12t}\). Setting \(T=45\) gives \(t=\dfrac{\ln(60/25)}{0.12}\approx 7.296\).

@ 7 | c | Separation of variables
A positive function \(y\) satisfies \(\dfrac{dy}{dx}=\dfrac{\cos x}{y}\) with \(y(0)=2\). What is \(y(1.2)\)?
* \(2.422\)
- \(2.932\)
- \(1.734\)
- \(4.932\)
= Integrating \(y\,dy=\cos x\,dx\) gives \(y^2=4+2\sin x\). At \(x=1.2\), \(y=\sqrt{4+2\sin(1.2)}\approx 2.422\).

@ 7 | c | Exponential growth
A culture of cells satisfies \(\dfrac{dP}{dt}=0.035P\) with \(P(0)=40\), where \(P\) is measured in thousands of cells. What is \(P(18)\)?
* \(75.104\)
- \(65.200\)
- \(21.304\)
- \(112.718\)
= Growth proportional to \(P\) gives \(P=40e^{0.035t}\), so \(P(18)\approx 75.104\) thousand cells.

@ 8 | n | Area between curves
What is the area of the region enclosed by the graphs of \(y=2x\) and \(y=x^2\)?
* \(\dfrac{4}{3}\)
- \(\dfrac{8}{3}\)
- \(\dfrac{2}{3}\)
- \(4\)
= The graphs intersect at \(x=0\) and \(x=2\), with \(2x\ge x^2\) between them. The area is \(\displaystyle\int_0^2(2x-x^2)\,dx=4-\dfrac{8}{3}=\dfrac{4}{3}\).

@ 8 | n | Average value of a function
What is the average value of \(f(x)=3x^2-2\) on the interval \([1,3]\)?
* \(11\)
- \(22\)
- \(12\)
- \(9\)
= The average value is \(\dfrac{1}{3-1}\displaystyle\int_1^3(3x^2-2)\,dx=\dfrac{1}{2}\left[x^3-2x\right]_1^3=11\).

@ 8 | n | Distance and displacement
A particle moves along a line with velocity \(v(t)=t-2\) for \(0\le t\le 5\). What is the total distance traveled by the particle?
* \(\dfrac{13}{2}\)
- \(\dfrac{5}{2}\)
- \(\dfrac{9}{2}\)
- \(\dfrac{25}{2}\)
= Total distance is \(\displaystyle\int_0^5|t-2|\,dt\). The two triangular areas are \(2\) and \(\dfrac{9}{2}\), for a total of \(\dfrac{13}{2}\); the displacement is \(\dfrac{5}{2}\).

@ 8 | n | Volumes with washers
The region between \(y=3\) and \(y=x^2\) for \(-\sqrt{3}\le x\le\sqrt{3}\) is revolved about the \(x\)-axis. Which integral gives the volume of the solid?
* \(\pi\displaystyle\int_{-\sqrt{3}}^{\sqrt{3}}\left(9-x^4\right)dx\)
- \(\pi\displaystyle\int_{-\sqrt{3}}^{\sqrt{3}}\left(3-x^2\right)^2dx\)
- \(\pi\displaystyle\int_{-\sqrt{3}}^{\sqrt{3}}\left(3-x^2\right)dx\)
- \(2\pi\displaystyle\int_{-\sqrt{3}}^{\sqrt{3}}x\left(3-x^2\right)dx\)
= The outer radius is \(3\) and the inner radius is \(x^2\). The area of each washer is \(\pi\left(3^2-(x^2)^2\right)\): the difference of the squares, not the square of the difference.

@ 8 | n | Volumes with known cross sections
The base of a solid is the region bounded by \(y=x\) and \(y=x^2\) for \(0\le x\le 1\). Cross sections perpendicular to the \(x\)-axis are squares. What is the volume of the solid?
* \(\dfrac{1}{30}\)
- \(\dfrac{1}{6}\)
- \(\dfrac{1}{3}\)
- \(\dfrac{1}{15}\)
= Each square has side \(x-x^2\), so the volume is \(\displaystyle\int_0^1(x-x^2)^2dx=\dfrac{1}{3}-\dfrac{1}{2}+\dfrac{1}{5}=\dfrac{1}{30}\).

@ 8 | n | Revolving around other axes
The region under \(y=\sqrt{x}\) and above \(y=0\) for \(0\le x\le 4\) is revolved about the line \(y=-1\). Which expression gives the volume of the solid?
* \(\pi\displaystyle\int_0^4\left[\left(\sqrt{x}+1\right)^2-1\right]dx\)
- \(\pi\displaystyle\int_0^4\left(\sqrt{x}-1\right)^2dx\)
- \(\pi\displaystyle\int_0^4 x\,dx\)
- \(\pi\displaystyle\int_0^4\left[\left(\sqrt{x}+1\right)^2+1\right]dx\)
= Measured from the line \(y=-1\), the outer radius is \(\sqrt{x}+1\) and the inner radius is \(1\). Subtract the area of the inner disk from the area of the outer disk.

@ 8 | n | Horizontal slices
The region between \(x=y^2\) and \(x=4\) for \(-2\le y\le 2\) is revolved about the \(y\)-axis. Which integral gives the volume of the solid?
* \(\pi\displaystyle\int_{-2}^{2}\left(16-y^4\right)dy\)
- \(\pi\displaystyle\int_{-2}^{2}\left(4-y^2\right)^2dy\)
- \(\pi\displaystyle\int_0^4\left(4-x^2\right)dx\)
- \(2\pi\displaystyle\int_{-2}^{2}y\left(4-y^2\right)dy\)
= Horizontal washers have outer radius \(4\) and inner radius \(y^2\), so each has area \(\pi\left(16-y^4\right)\).

@ 8 | n | Net change in position
A particle starts at \(x(0)=-3\) and moves with velocity \(v(t)=6t-4\). What is \(x(2)\)?
* \(1\)
- \(4\)
- \(-1\)
- \(9\)
= Position is the initial position plus displacement: \(-3+\displaystyle\int_0^2(6t-4)\,dt=-3+(12-8)=1\).

@ 8 | n | Volume from a graph | region
The shaded region \(R\) is bounded by the graphs of \(y=\sqrt{x}\) and \(y=\dfrac{x}{2}\), as shown. Which integral gives the volume of the solid generated when \(R\) is revolved about the \(x\)-axis?
* \(\pi\displaystyle\int_0^4\left(x-\dfrac{x^2}{4}\right)dx\)
- \(\pi\displaystyle\int_0^4\left(\sqrt{x}-\dfrac{x}{2}\right)^2dx\)
- \(\displaystyle\int_0^4\left(\sqrt{x}-\dfrac{x}{2}\right)dx\)
- \(\pi\displaystyle\int_0^4\left(\dfrac{x^2}{4}-x\right)dx\)
= The curves meet at \(x=0\) and \(x=4\). The outer radius is \(\sqrt{x}\) and the inner radius is \(\dfrac{x}{2}\), so each washer has area \(\pi\left(x-\dfrac{x^2}{4}\right)\). The integral without \(\pi\) and without squares gives the area of \(R\).

@ 8 | n | Distance from a velocity graph | velocity
A particle moves along the \(x\)-axis. The graph of its velocity \(v\), consisting of four line segments, is shown for \(0\le t\le 8\). What is the total distance traveled by the particle from \(t=0\) to \(t=8\)?
* \(12\)
- \(-2\)
- \(2\)
- \(5\)
= Total distance is \(\displaystyle\int_0^8|v(t)|\,dt\). The area above the axis (for \(0\le t\le 3\)) is \(5\), and the area below the axis (for \(3\le t\le 8\)) is \(7\), for a total of \(12\). The displacement is \(5-7=-2\).

@ 8 | c | Area between curves
What is the area of the region in the first quadrant enclosed by \(y=e^{-x}\), \(y=x^2\), and the \(y\)-axis?
* \(0.389\)
- \(0.352\)
- \(0.495\)
- \(0.703\)
= The curves intersect at \(x=a\approx 0.703\). The area is \(\displaystyle\int_0^a\left(e^{-x}-x^2\right)dx\approx 0.389\).

@ 8 | c | Total distance
A particle moves along a line with velocity \(v(t)=\sin t-0.3\) for \(0\le t\le\pi\). What is the total distance traveled by the particle?
* \(1.239\)
- \(1.058\)
- \(2.000\)
- \(2.942\)
= Total distance is \(\displaystyle\int_0^{\pi}|\sin t-0.3|\,dt\approx 1.239\). The velocity changes sign at \(t=\arcsin(0.3)\) and \(t=\pi-\arcsin(0.3)\); the displacement is \(1.058\).

@ 8 | c | Average value of a function
What is the average value of \(f(x)=\sqrt{1+x^3}\) on the interval \([0,2]\)?
* \(1.621\)
- \(3.000\)
- \(3.483\)
- \(1.000\)
= The average value is \(\dfrac{1}{2}\displaystyle\int_0^2\sqrt{1+x^3}\,dx\approx 1.621\). The integral alone is twice this value.

@ 8 | c | Volumes with disks
The region under \(y=e^{-x^2}\) and above the \(x\)-axis for \(0\le x\le 1\) is revolved about the \(x\)-axis. What is the volume of the solid?
* \(1.879\)
- \(2.346\)
- \(0.598\)
- \(3.142\)
= Each disk has radius \(e^{-x^2}\), so the volume is \(\pi\displaystyle\int_0^1 e^{-2x^2}\,dx\approx 1.879\).

@ 8 | c | Volumes with known cross sections
A solid has square cross sections perpendicular to the \(x\)-axis with side length \(2+\sin x\) for \(0\le x\le\pi\). What is the volume of the solid?
* \(22.137\)
- \(10.283\)
- \(14.137\)
- \(25.133\)
= Each cross section has area \((2+\sin x)^2\). Integrating from \(0\) to \(\pi\) gives \(\dfrac{9\pi}{2}+8\approx 22.137\).

@ 8 | c | Area between curves that cross
What is the total area between the graphs of \(y=\cos x\) and \(y=0.2x\) on the interval \([0,3]\)?
* \(2.348\)
- \(0.759\)
- \(1.141\)
- \(3.759\)
= The graphs cross once in \(\left(0,\dfrac{\pi}{2}\right)\), so integrate \(|\cos x-0.2x|\) over \([0,3]\). The result is approximately \(2.348\).
`;

const sourceIds = { 1: 'limits', 2: 'derivatives', 3: 'derivatives', 4: 'applications', 5: 'applications', 6: 'integrals', 7: 'integrals', 8: 'volumes' };
module.exports = { source, figures, sourceIds };
