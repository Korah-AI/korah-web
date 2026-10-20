// AP Precalculus unit 3: Trigonometric and Polar Functions. Same block format as
// precalc-a.cjs; calculator questions stay in the order checked by the tests.
const { table } = require('./figures.cjs');

const BLUE = '#3b82f6', PINK = '#ec4899';
const r2 = n => Math.round(n * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const m = v => String.raw`\(${v}\)`;
const open = (w, h, alt) => `<svg class="ap-fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(alt)}" font-family="inherit" font-size="12" fill="none">`;
const label = (x, y, s, anchor = 'middle', italic = false) => `<text x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}" fill="currentColor"${italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;

// "π/2", "3π/4", "−π" for k·(π/den).
function piLabel(k, den) {
  if (k === 0) return '0';
  const g = (a, b) => (b ? g(b, a % b) : a), d = g(Math.abs(k), den), n = k / d, q = den / d;
  const num = (n < 0 ? '−' : '') + (Math.abs(n) === 1 ? '' : Math.abs(n)) + 'π';
  return q === 1 ? num : `${num}/${q}`;
}

// Graph of trigonometric functions with the x-axis marked in multiples of π/den.
function trigGraph({ curves, xmin = 0, xmax = 2 * Math.PI, ymin, ymax, ystep = 1, den = 2, asymptotes = [], ylabel = 'y', xlabel = 'x', w = 400, h = 240, alt }) {
  const L = 34, R = 18, T = 14, B = 26, sx = x => L + (x - xmin) / (xmax - xmin) * (w - L - R), sy = y => h - B - (y - ymin) / (ymax - ymin) * (h - T - B);
  const x0 = sx(Math.max(xmin, Math.min(0, xmax))), y0 = sy(Math.max(ymin, Math.min(0, ymax)));
  let s = open(w, h, alt);
  for (let k = Math.ceil(xmin / (Math.PI / den) - 1e-9); k * Math.PI / den <= xmax + 1e-9; k++) {
    const x = sx(k * Math.PI / den);
    s += `<line x1="${r2(x)}" y1="${r2(sy(ymin))}" x2="${r2(x)}" y2="${r2(sy(ymax))}" stroke="currentColor" stroke-opacity=".2"/>`;
    if (k) s += label(x, y0 + 15, piLabel(k, den));
  }
  for (let v = Math.ceil(ymin / ystep) * ystep; v <= ymax + 1e-9; v += ystep) {
    s += `<line x1="${r2(sx(xmin))}" y1="${r2(sy(v))}" x2="${r2(sx(xmax))}" y2="${r2(sy(v))}" stroke="currentColor" stroke-opacity=".2"/>`;
    if (Math.abs(v) > 1e-9) s += label(x0 - 5, sy(v) + 4, String(r2(v)).replace('-', '−'), 'end');
  }
  s += `<path d="M${r2(sx(xmin))} ${r2(y0)}H${r2(sx(xmax) + 8)}M${r2(x0)} ${r2(sy(ymin))}V${r2(sy(ymax) - 8)}" stroke="currentColor" stroke-width="1.5"/>`;
  s += label(sx(xmax) + 12, y0 + 4, xlabel, 'start', true) + label(x0 + 7, sy(ymax) - 2, ylabel, 'start', true);
  for (const a of asymptotes) s += `<line x1="${r2(sx(a))}" y1="${r2(sy(ymin))}" x2="${r2(sx(a))}" y2="${r2(sy(ymax))}" stroke="${PINK}" stroke-width="1.4" stroke-dasharray="5 4"/>`;
  for (const c of curves) {
    let d = '', pen = false;
    for (let i = 0; i <= 400; i++) {
      const x = xmin + (xmax - xmin) * i / 400, y = c.fn(x);
      if (!Number.isFinite(y) || y < ymin - 0.5 || y > ymax + 0.5) { pen = false; continue; }
      d += `${pen ? 'L' : 'M'}${r2(sx(x))} ${r2(sy(Math.max(ymin, Math.min(ymax, y))))}`; pen = true;
    }
    s += `<path d="${d}" stroke="${c.color || BLUE}" stroke-width="2.2"/>`;
  }
  return { svg: s + '</svg>', alt };
}

// Polar curve r = f(θ) on a polar grid with rings at 1, 2, …, rmax.
function polarFig({ r, from = 0, to = 2 * Math.PI, rmax, size = 280, alt, points = [] }) {
  const c = size / 2, k = (c - 22) / rmax, P = (rr, t) => [c + k * rr * Math.cos(t), c - k * rr * Math.sin(t)];
  let s = open(size, size, alt);
  for (let i = 1; i <= rmax; i++) s += `<circle cx="${c}" cy="${c}" r="${r2(k * i)}" stroke="currentColor" stroke-opacity=".2"/>` + label(c + k * i, c + 14, String(i));
  for (let a = 0; a < 6; a++) { const t = a * Math.PI / 6, [x1, y1] = P(rmax, t), [x2, y2] = P(rmax, t + Math.PI); s += `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}" stroke="currentColor" stroke-opacity="${a % 3 ? '.15' : '.6'}"/>`; }
  let d = '';
  for (let i = 0; i <= 600; i++) { const t = from + (to - from) * i / 600, [x, y] = P(r(t), t); d += `${i ? 'L' : 'M'}${r2(x)} ${r2(y)}`; }
  s += `<path d="${d}" stroke="${BLUE}" stroke-width="2.2"/>`;
  for (const p of points) { const [x, y] = P(p.r, p.t); s += `<circle cx="${r2(x)}" cy="${r2(y)}" r="3.5" fill="${PINK}"/>` + label(x + (p.dx || 8), y + (p.dy || -6), p.text, 'start', true); }
  return { svg: s + '</svg>', alt };
}

function unitCircle() {
  const c = 150, k = 110, px = c - 0.6 * k, py = c - 0.8 * k, alt = 'Unit circle centered at the origin. A terminal ray from the origin makes an angle θ, measured counterclockwise from the positive x-axis, and meets the circle at point P with coordinates (−3/5, 4/5) in the second quadrant';
  let s = open(300, 300, alt);
  s += `<path d="M20 ${c}H285M${c} 285V15" stroke="currentColor" stroke-width="1.5"/><circle cx="${c}" cy="${c}" r="${k}" stroke="currentColor" stroke-width="1.8"/>`;
  s += `<line x1="${c}" y1="${c}" x2="${r2(px)}" y2="${r2(py)}" stroke="${BLUE}" stroke-width="2.2"/><circle cx="${r2(px)}" cy="${r2(py)}" r="4" fill="${PINK}"/>`;
  const a = Math.atan2(0.8, -0.6), arc = 26;
  s += `<path d="M${c + arc} ${c} A${arc} ${arc} 0 0 0 ${r2(c + arc * Math.cos(a))} ${r2(c - arc * Math.sin(a))}" stroke="${PINK}" stroke-width="1.6"/>`;
  s += label(c + 18, c - 30, 'θ', 'start', true) + label(px - 8, py - 8, 'P(−3/5, 4/5)', 'end') + label(c + k + 4, c + 15, '1', 'start') + label(288, c + 4, 'x', 'end', true) + label(c + 6, 22, 'y', 'start', true);
  return { svg: s + '</svg>', alt };
}

const figures = {
  unitCircle: unitCircle(),
  sinA: trigGraph({ curves: [{ fn: x => 3 * Math.sin(2 * x) + 1 }], ymin: -3, ymax: 5, den: 4, alt: 'Graph of a sinusoidal function f on the interval from 0 to 2π. The graph starts at (0, 1), rises to a maximum of 4 at x = π/4, falls through 1 at x = π/2 to a minimum of −2 at x = 3π/4, and returns to 1 at x = π. The pattern then repeats once more' }),
  tide: table([m('t') + ' (hours)', ...[0, 2, 4, 6, 8, 10, 12].map(m)], [[m('D(t)') + ' (meters)', ...['7.5', '9', '7.5', '4.5', '3', '4.5', '7.5'].map(m)]], 'Table of water depth D at a harbor, in meters, at t = 0, 2, 4, 6, 8, 10, and 12 hours: 7.5, 9, 7.5, 4.5, 3, 4.5, and 7.5'),
  tanG: trigGraph({ curves: [{ fn: Math.tan }], xmin: -Math.PI / 2, xmax: 3 * Math.PI / 2, ymin: -4, ymax: 4, ystep: 2, asymptotes: [-Math.PI / 2, Math.PI / 2, 3 * Math.PI / 2], alt: 'Graph of y = tan x from −π/2 to 3π/2, with dashed vertical asymptotes at x = −π/2, π/2, and 3π/2. Each branch increases from negative to positive values, passing through (0, 0) and (π, 0)' }),
  rose: polarFig({ r: t => 3 * Math.cos(2 * t), rmax: 3, alt: 'Polar graph of a rose curve with four petals, each of length 3, centered on the positive and negative x- and y-axes', points: [{ r: 3, t: 0, text: 'A', dx: 6, dy: -10 }] }),
  limacon: polarFig({ r: t => 1 + 2 * Math.sin(t), rmax: 3, alt: 'Polar graph of a limaçon with an inner loop. The large outer loop reaches 3 units up the positive y-axis, and a small inner loop lies inside it, touching the origin', points: [{ r: 3, t: Math.PI / 2, text: '(0, 3)' }] }),
  rTheta: trigGraph({ curves: [{ fn: t => 1 + 2 * Math.cos(t) }], ymin: -2, ymax: 3, den: 3, xlabel: 'θ', ylabel: 'r', alt: 'Graph of r = f(θ) in the θr-plane for θ from 0 to 2π. The graph starts at r = 3 when θ = 0, decreases through 0 at θ = 2π/3 to a minimum of −1 at θ = π, increases through 0 at θ = 4π/3, and returns to 3 at θ = 2π' }),
};

const source = String.raw`
@ 3 | n | Periodic phenomena | tide
The depth of water at a harbor is periodic, and the table shows one full cycle. What are the period and the amplitude of the depth function?
* Period \(12\) hours, amplitude \(3\) meters
- Period \(12\) hours, amplitude \(6\) meters
- Period \(6\) hours, amplitude \(3\) meters
- Period \(8\) hours, amplitude \(4.5\) meters
= The depth returns to \(7.5\) on the rising side after \(12\) hours, so the period is \(12\). The amplitude is half the distance from the maximum, \(9\), to the minimum, \(3\), which is \(3\).

@ 3 | n | Sinusoidal context and data modeling | tide
Which function models the depth in the table?
* \(D(t)=6+3\cos\!\left(\dfrac{\pi}{6}(t-2)\right)\)
- \(D(t)=6+3\cos\!\left(\dfrac{\pi}{12}(t-2)\right)\)
- \(D(t)=6+3\sin\!\left(\dfrac{\pi}{6}(t-2)\right)\)
- \(D(t)=3+6\cos\!\left(\dfrac{\pi}{6}(t-2)\right)\)
= The midline is \(\tfrac{9+3}{2}=6\), the amplitude is \(3\), and the period \(12\) gives \(b=\dfrac{2\pi}{12}=\dfrac{\pi}{6}\). A cosine has its maximum when its argument is \(0\), and the maximum occurs at \(t=2\).

@ 3 | n | Periodic phenomena | tide
Based on the model for the depth in the table, on which interval is the depth decreasing at an increasing rate?
* \(2<t<5\)
- \(5<t<8\)
- \(0<t<2\)
- \(8<t<11\)
= The depth decreases from the maximum at \(t=2\) to the minimum at \(t=8\). It falls fastest at the midline crossing, \(t=5\), so its rate of decrease grows from \(t=2\) to \(t=5\) and shrinks afterward.

@ 3 | n | Sine and cosine values | unitCircle
In the diagram, the terminal ray of angle \(\theta\) meets the unit circle at \(P\). What is \(\cos\theta\)?
* \(-\tfrac{3}{5}\)
- \(\tfrac{4}{5}\)
- \(-\tfrac{4}{3}\)
- \(\tfrac{3}{5}\)
= On the unit circle, the point on the terminal ray is \((\cos\theta,\sin\theta)\). The \(x\)-coordinate of \(P\) is \(-\tfrac{3}{5}\).

@ 3 | n | Tangent function | unitCircle
For the angle \(\theta\) shown, what is \(\tan\theta\)?
* \(-\tfrac{4}{3}\)
- \(-\tfrac{3}{4}\)
- \(\tfrac{4}{3}\)
- \(\tfrac{4}{5}\)
= \(\tan\theta=\dfrac{\sin\theta}{\cos\theta}=\dfrac{4/5}{-3/5}=-\tfrac{4}{3}\), the slope of the terminal ray.

@ 3 | n | Sine and cosine values | unitCircle
For the angle \(\theta\) shown, what is \(\sin(\theta+\pi)\)?
* \(-\tfrac{4}{5}\)
- \(\tfrac{4}{5}\)
- \(\tfrac{3}{5}\)
- \(-\tfrac{3}{5}\)
= Adding \(\pi\) rotates \(P\) halfway around the circle to \(\left(\tfrac{3}{5},-\tfrac{4}{5}\right)\), so the sine changes sign.

@ 3 | n | Sine and cosine values
What is the value of \(\sin\dfrac{5\pi}{6}+\cos\dfrac{4\pi}{3}\)?
* \(0\)
- \(1\)
- \(\dfrac{1+\sqrt{3}}{2}\)
- \(-1\)
= \(\sin\dfrac{5\pi}{6}=\tfrac{1}{2}\), with reference angle \(\tfrac{\pi}{6}\) in Quadrant II, and \(\cos\dfrac{4\pi}{3}=-\tfrac{1}{2}\), with reference angle \(\tfrac{\pi}{3}\) in Quadrant III.

@ 3 | n | Tangent function
What is \(\tan\left(-\dfrac{\pi}{3}\right)\)?
* \(-\sqrt{3}\)
- \(\sqrt{3}\)
- \(-\dfrac{\sqrt{3}}{3}\)
- \(-\tfrac{1}{2}\)
= The angle \(-\tfrac{\pi}{3}\) ends in Quadrant IV at \(\left(\tfrac{1}{2},-\tfrac{\sqrt{3}}{2}\right)\), so \(\tan=\dfrac{-\sqrt{3}/2}{1/2}=-\sqrt{3}\). Tangent is an odd function.

@ 3 | n | Radian measure
A circle has a radius of \(6\) centimeters. What is the length of the arc subtended by a central angle of \(\dfrac{2\pi}{3}\) radians?
* \(4\pi\) centimeters
- \(\dfrac{\pi}{9}\) centimeters
- \(12\pi\) centimeters
- \(120\) centimeters
= In radians, arc length is \(s=r\theta=6\cdot\dfrac{2\pi}{3}=4\pi\). A radian is defined as the angle whose arc equals the radius.

@ 3 | n | Sinusoidal functions | sinA
Which equation defines the function graphed?
* \(f(x)=3\sin(2x)+1\)
- \(f(x)=3\sin\!\left(\tfrac{1}{2}x\right)+1\)
- \(f(x)=4\sin(2x)\)
- \(f(x)=3\cos(2x)+1\)
= The graph oscillates between \(-2\) and \(4\), so the midline is \(y=1\) and the amplitude is \(3\). One cycle takes \(\pi\), so \(b=2\). It starts at the midline and rises, as sine does; cosine would start at a maximum.

@ 3 | n | Sinusoidal functions | sinA
For the function graphed, on which interval is \(f\) increasing and concave down?
* \(0<x<\tfrac{\pi}{4}\)
- \(\tfrac{\pi}{4}<x<\tfrac{\pi}{2}\)
- \(\tfrac{3\pi}{4}<x<\pi\)
- \(\tfrac{\pi}{2}<x<\tfrac{3\pi}{4}\)
= From the midline at \(x=0\) to the maximum at \(\tfrac{\pi}{4}\), the graph rises while bending downward. A sinusoid is concave down above its midline and concave up below it.

@ 3 | n | Sinusoidal functions | sinA
How many solutions does \(f(x)=4\) have on the interval \(0\le x\le 2\pi\) for the function graphed?
* \(2\)
- \(4\)
- \(1\)
- \(0\)
= The maximum value is \(4\), reached once per period at \(x=\tfrac{\pi}{4}\) and \(x=\tfrac{5\pi}{4}\). There are two full periods on the interval.

@ 3 | n | Sinusoidal transformations
For \(g(x)=-2\cos(3x-\pi)+4\), what are the amplitude, period, phase shift, and midline?
* Amplitude \(2\), period \(\tfrac{2\pi}{3}\), phase shift \(\tfrac{\pi}{3}\) to the right, midline \(y=4\)
- Amplitude \(-2\), period \(\tfrac{2\pi}{3}\), phase shift \(\pi\) to the right, midline \(y=4\)
- Amplitude \(2\), period \(6\pi\), phase shift \(\tfrac{\pi}{3}\) to the left, midline \(y=4\)
- Amplitude \(2\), period \(\tfrac{2\pi}{3}\), phase shift \(\pi\) to the right, midline \(y=-4\)
= Writing \(3x-\pi=3\left(x-\tfrac{\pi}{3}\right)\) shows the shift of \(\tfrac{\pi}{3}\). The amplitude is the absolute value of \(-2\), and the period is \(\tfrac{2\pi}{3}\).

@ 3 | n | Sinusoidal functions
What is the maximum value of \(h(x)=5-3\sin x\), and where on \([0,2\pi)\) does it occur?
* \(8\), at \(x=\tfrac{3\pi}{2}\)
- \(8\), at \(x=\tfrac{\pi}{2}\)
- \(5\), at \(x=0\)
- \(2\), at \(x=\tfrac{\pi}{2}\)
= \(h\) is largest when \(\sin x\) is smallest, \(-1\), at \(x=\tfrac{3\pi}{2}\). Then \(h=5+3=8\).

@ 3 | n | Sinusoidal functions
A sinusoidal function has a maximum at \((1,7)\), and the next minimum is at \((4,-1)\). Which equation could define it?
* \(f(x)=4\cos\!\left(\dfrac{\pi}{3}(x-1)\right)+3\)
- \(f(x)=4\cos\!\left(\dfrac{\pi}{6}(x-1)\right)+3\)
- \(f(x)=8\cos\!\left(\dfrac{\pi}{3}(x-1)\right)+3\)
- \(f(x)=4\sin\!\left(\dfrac{\pi}{3}(x-1)\right)+3\)
= The midline is \(\tfrac{7+(-1)}{2}=3\) and the amplitude \(4\). A maximum to the next minimum is half a period, so the period is \(6\) and \(b=\tfrac{2\pi}{6}=\tfrac{\pi}{3}\). A cosine shifted right \(1\) peaks at \(x=1\).

@ 3 | n | Sinusoidal context and data modeling
A Ferris wheel \(50\) meters in diameter has its center \(30\) meters above the ground and turns once every \(8\) minutes. A rider boards at the lowest point at \(t=0\). Which function gives the rider's height, in meters, after \(t\) minutes?
* \(h(t)=30-25\cos\!\left(\dfrac{\pi t}{4}\right)\)
- \(h(t)=30+25\cos\!\left(\dfrac{\pi t}{4}\right)\)
- \(h(t)=30-50\cos\!\left(\dfrac{\pi t}{4}\right)\)
- \(h(t)=30-25\cos(8t)\)
= The radius \(25\) is the amplitude and the center height \(30\) is the midline. Starting at the lowest point calls for \(-\cos\). The period \(8\) gives \(b=\tfrac{2\pi}{8}=\tfrac{\pi}{4}\).

@ 3 | n | Tangent function | tanG
What is the period of the function graphed, and why does it have vertical asymptotes?
* The period is \(\pi\); the asymptotes occur where \(\cos x=0\), so \(\tan x=\dfrac{\sin x}{\cos x}\) is undefined.
- The period is \(2\pi\); the asymptotes occur where \(\sin x=0\).
- The period is \(\pi\); the asymptotes occur where \(\tan x=1\).
- The period is \(\tfrac{\pi}{2}\); the asymptotes occur where \(\sin x=\cos x\).
= The branches repeat every \(\pi\). Near \(x=\tfrac{\pi}{2}\), \(\cos x\to 0\) while \(\sin x\to 1\), so the quotient grows without bound.

@ 3 | n | Tangent function | tanG
On the interval \(0<x<\tfrac{\pi}{2}\), which describes the function graphed?
* It is increasing and concave up.
- It is increasing and concave down.
- It is decreasing and concave up.
- It is increasing at a constant rate.
= Each branch of \(y=\tan x\) increases throughout. It is concave down left of its zero and concave up right of it, curving upward toward the asymptote at \(\tfrac{\pi}{2}\).

@ 3 | n | Inverse trigonometric functions
What is \(\arcsin\left(-\tfrac{1}{2}\right)\)?
* \(-\dfrac{\pi}{6}\)
- \(\dfrac{7\pi}{6}\)
- \(\dfrac{11\pi}{6}\)
- \(-\dfrac{\pi}{3}\)
= The arcsine returns values only in \(\left[-\tfrac{\pi}{2},\tfrac{\pi}{2}\right]\). The angle in that range with sine \(-\tfrac{1}{2}\) is \(-\tfrac{\pi}{6}\); \(\tfrac{7\pi}{6}\) and \(\tfrac{11\pi}{6}\) are outside the range.

@ 3 | n | Inverse trigonometric functions
What is \(\arccos\left(\cos\dfrac{5\pi}{3}\right)\)?
* \(\dfrac{\pi}{3}\)
- \(\dfrac{5\pi}{3}\)
- \(-\dfrac{\pi}{3}\)
- \(\dfrac{2\pi}{3}\)
= \(\cos\dfrac{5\pi}{3}=\tfrac{1}{2}\), and the arccosine returns the angle in \([0,\pi]\) with cosine \(\tfrac{1}{2}\), which is \(\tfrac{\pi}{3}\). The output must lie in the restricted range, not equal the original angle.

@ 3 | n | Inverse trigonometric functions
What is \(\sin\left(\arccos\tfrac{3}{5}\right)\)?
* \(\tfrac{4}{5}\)
- \(-\tfrac{4}{5}\)
- \(\tfrac{3}{5}\)
- \(\tfrac{5}{3}\)
= Let \(\theta=\arccos\tfrac{3}{5}\), so \(\cos\theta=\tfrac{3}{5}\) with \(\theta\) in \([0,\pi]\), where sine is nonnegative. Then \(\sin\theta=\sqrt{1-\tfrac{9}{25}}=\tfrac{4}{5}\).

@ 3 | n | Trigonometric equations
What are the solutions of \(2\sin x+1=0\) on \([0,2\pi)\)?
* \(\dfrac{7\pi}{6}\) and \(\dfrac{11\pi}{6}\)
- \(\dfrac{\pi}{6}\) and \(\dfrac{5\pi}{6}\)
- \(\dfrac{4\pi}{3}\) and \(\dfrac{5\pi}{3}\)
- \(-\dfrac{\pi}{6}\) only
= \(\sin x=-\tfrac{1}{2}\) in Quadrants III and IV, with reference angle \(\tfrac{\pi}{6}\). The value \(-\tfrac{\pi}{6}\) is coterminal with \(\tfrac{11\pi}{6}\) but outside the interval.

@ 3 | n | Trigonometric equations
What are the solutions of \(\cos(2x)=\tfrac{1}{2}\) on \([0,\pi)\)?
* \(\dfrac{\pi}{6}\) and \(\dfrac{5\pi}{6}\)
- \(\dfrac{\pi}{3}\) and \(\dfrac{5\pi}{3}\)
- \(\dfrac{\pi}{6}\) only
- \(\dfrac{\pi}{3}\) only
= For \(0\le x<\pi\), \(2x\) ranges over \([0,2\pi)\), where \(\cos(2x)=\tfrac{1}{2}\) at \(2x=\tfrac{\pi}{3}\) and \(2x=\tfrac{5\pi}{3}\). Dividing by \(2\) gives the solutions.

@ 3 | n | Trigonometric inequalities
On \([0,2\pi]\), for which values of \(x\) is \(\sin x\ge\cos x\)?
* \(\dfrac{\pi}{4}\le x\le\dfrac{5\pi}{4}\)
- \(0\le x\le\dfrac{\pi}{4}\)
- \(\dfrac{\pi}{2}\le x\le\pi\)
- \(\dfrac{\pi}{4}\le x\le\dfrac{3\pi}{4}\)
= The graphs of sine and cosine intersect at \(\tfrac{\pi}{4}\) and \(\tfrac{5\pi}{4}\). Between them, the sine graph lies above the cosine graph.

@ 3 | n | Trigonometric equations
What are the solutions of \(2\cos^2 x-\cos x-1=0\) on \([0,2\pi)\)?
* \(0\), \(\dfrac{2\pi}{3}\), and \(\dfrac{4\pi}{3}\)
- \(0\) and \(\pi\)
- \(\dfrac{\pi}{3}\), \(\dfrac{5\pi}{3}\), and \(\pi\)
- \(\dfrac{2\pi}{3}\) and \(\dfrac{4\pi}{3}\) only
= Factoring gives \((2\cos x+1)(\cos x-1)=0\), so \(\cos x=-\tfrac{1}{2}\) or \(\cos x=1\).

@ 3 | n | Secant, cosecant, and cotangent
What is the value of \(\sec\dfrac{2\pi}{3}+\csc\dfrac{\pi}{6}\)?
* \(0\)
- \(4\)
- \(-\tfrac{3}{2}\)
- \(\dfrac{2\sqrt{3}}{3}+2\)
= \(\sec\dfrac{2\pi}{3}=\dfrac{1}{\cos(2\pi/3)}=-2\) and \(\csc\dfrac{\pi}{6}=\dfrac{1}{\sin(\pi/6)}=2\).

@ 3 | n | Secant, cosecant, and cotangent
Which statement about \(y=\cot x\) is true?
* It has period \(\pi\) and vertical asymptotes where \(\sin x=0\).
- It has period \(2\pi\) and vertical asymptotes where \(\cos x=0\).
- It has period \(\pi\) and is increasing on each branch.
- It has zeros where \(\sin x=0\).
= \(\cot x=\dfrac{\cos x}{\sin x}\) is undefined at multiples of \(\pi\) and zero where \(\cos x=0\). Each branch decreases, the opposite of tangent.

@ 3 | n | Trigonometric identities
Which expression is equivalent to \(\dfrac{1-\cos^2 x}{\sin x}\) wherever it is defined?
* \(\sin x\)
- \(\cos x\)
- \(1\)
- \(\tan x\)
= By the Pythagorean identity, \(1-\cos^2 x=\sin^2 x\), and \(\dfrac{\sin^2 x}{\sin x}=\sin x\) where \(\sin x\ne 0\).

@ 3 | n | Sum identities
What is the exact value of \(\sin\dfrac{5\pi}{12}\)?
* \(\dfrac{\sqrt{6}+\sqrt{2}}{4}\)
- \(\dfrac{\sqrt{6}-\sqrt{2}}{4}\)
- \(\dfrac{1+\sqrt{3}}{2}\)
- \(\dfrac{\sqrt{3}}{4}\)
= \(\sin\left(\tfrac{\pi}{4}+\tfrac{\pi}{6}\right)=\sin\tfrac{\pi}{4}\cos\tfrac{\pi}{6}+\cos\tfrac{\pi}{4}\sin\tfrac{\pi}{6}=\dfrac{\sqrt{2}}{2}\cdot\dfrac{\sqrt{3}}{2}+\dfrac{\sqrt{2}}{2}\cdot\dfrac{1}{2}\). Adding the sines directly gives the incorrect \(\tfrac{1+\sqrt{3}}{2}\).

@ 3 | n | Double-angle identities
If \(\sin\theta=\tfrac{3}{5}\) and \(\tfrac{\pi}{2}<\theta<\pi\), what is \(\sin(2\theta)\)?
* \(-\tfrac{24}{25}\)
- \(\tfrac{24}{25}\)
- \(\tfrac{6}{5}\)
- \(-\tfrac{7}{25}\)
= In Quadrant II, \(\cos\theta=-\tfrac{4}{5}\). Then \(\sin 2\theta=2\sin\theta\cos\theta=2\cdot\tfrac{3}{5}\cdot\left(-\tfrac{4}{5}\right)\). The value \(-\tfrac{7}{25}\) is \(\cos 2\theta\).

@ 3 | n | Trigonometric identities
Which expression is equivalent to \(\dfrac{\sec^2 x-1}{\tan x}\) wherever it is defined?
* \(\tan x\)
- \(\cot x\)
- \(1\)
- \(\sec x\)
= Dividing \(\sin^2 x+\cos^2 x=1\) by \(\cos^2 x\) gives \(\tan^2 x+1=\sec^2 x\), so the numerator is \(\tan^2 x\).

@ 3 | n | Double-angle identities
Which expression is equivalent to \(\cos(2x)\)?
* \(1-2\sin^2 x\)
- \(2\cos x\)
- \(1-2\cos^2 x\)
- \(2\sin x\cos x\)
= \(\cos(2x)=\cos^2 x-\sin^2 x=1-2\sin^2 x=2\cos^2 x-1\). The expression \(2\sin x\cos x\) equals \(\sin(2x)\).

@ 3 | n | Equivalent representations of sinusoids
The function \(f(x)=3\sin x+4\cos x\) can be written as a single sinusoid \(A\sin(x+c)\). What is its amplitude \(A\)?
* \(5\)
- \(7\)
- \(1\)
- \(12\)
= Expanding \(A\sin(x+c)=A\cos c\sin x+A\sin c\cos x\) and matching coefficients gives \(A\cos c=3\) and \(A\sin c=4\), so \(A^2=9+16\) and \(A=5\).

@ 3 | n | Polar coordinates
What are the rectangular coordinates of the point with polar coordinates \(\left(4,\dfrac{5\pi}{6}\right)\)?
* \(\left(-2\sqrt{3},\,2\right)\)
- \(\left(2\sqrt{3},\,2\right)\)
- \(\left(-2,\,2\sqrt{3}\right)\)
- \(\left(-2\sqrt{3},\,-2\right)\)
= \(x=r\cos\theta=4\left(-\tfrac{\sqrt{3}}{2}\right)\) and \(y=r\sin\theta=4\left(\tfrac{1}{2}\right)\). The point is in Quadrant II.

@ 3 | n | Polar coordinates
Which polar coordinates represent the rectangular point \((-1,-1)\)?
* \(\left(\sqrt{2},\,\dfrac{5\pi}{4}\right)\)
- \(\left(\sqrt{2},\,\dfrac{\pi}{4}\right)\)
- \(\left(2,\,\dfrac{5\pi}{4}\right)\)
- \(\left(-\sqrt{2},\,\dfrac{5\pi}{4}\right)\)
= \(r=\sqrt{1+1}=\sqrt{2}\), and the point is in Quadrant III, so \(\theta=\tfrac{5\pi}{4}\). Although \(\tan\theta=1\) also at \(\tfrac{\pi}{4}\), that angle gives \((1,1)\) with positive \(r\).

@ 3 | n | Polar functions
Which describes the graph of the polar equation \(r=4\cos\theta\)?
* A circle of radius \(2\) centered at \((2,0)\)
- A circle of radius \(4\) centered at the origin
- A rose with four petals
- A line through the origin
= Multiplying by \(r\): \(r^2=4r\cos\theta\), so \(x^2+y^2=4x\), which is \((x-2)^2+y^2=4\).

@ 3 | n | Polar function graphs | rose
Which polar equation could produce the graph shown, with point A at \((3,0)\)?
* \(r=3\cos(2\theta)\)
- \(r=3\sin(2\theta)\)
- \(r=3\cos(4\theta)\)
- \(r=3+3\cos\theta\)
= The rose \(r=a\cos(n\theta)\) with even \(n\) has \(2n\) petals, so \(n=2\) gives four. Cosine puts a petal on the positive \(x\)-axis, where \(r(0)=3\); \(3\sin(2\theta)\) has petals between the axes.

@ 3 | n | Polar function graphs | rose
For the rose \(r=3\cos(2\theta)\) shown, for which values of \(\theta\) in \([0,\pi]\) does the curve pass through the origin?
* \(\theta=\tfrac{\pi}{4}\) and \(\theta=\tfrac{3\pi}{4}\)
- \(\theta=0\) and \(\theta=\pi\)
- \(\theta=\tfrac{\pi}{2}\) only
- \(\theta=\tfrac{\pi}{8}\) and \(\theta=\tfrac{3\pi}{8}\)
= The curve is at the origin when \(r=0\): \(\cos(2\theta)=0\), so \(2\theta=\tfrac{\pi}{2}\) or \(\tfrac{3\pi}{2}\).

@ 3 | n | Polar function graphs | limacon
Which polar equation could produce the graph shown?
* \(r=1+2\sin\theta\)
- \(r=2+\sin\theta\)
- \(r=1+2\cos\theta\)
- \(r=2\sin\theta\)
= A limaçon \(r=a+b\sin\theta\) has an inner loop when \(|b|>|a|\). The greatest distance, \(3\), occurs on the positive \(y\)-axis at \(\theta=\tfrac{\pi}{2}\), which points to sine rather than cosine.

@ 3 | n | Polar function graphs | limacon
For the limaçon \(r=1+2\sin\theta\) shown, on which interval of \(\theta\) is the inner loop traced?
* \(\dfrac{7\pi}{6}<\theta<\dfrac{11\pi}{6}\)
- \(0<\theta<\dfrac{\pi}{2}\)
- \(\dfrac{\pi}{6}<\theta<\dfrac{5\pi}{6}\)
- \(\pi<\theta<2\pi\)
= The inner loop is traced when \(r<0\), that is, when \(\sin\theta<-\tfrac{1}{2}\). The curve passes through the origin at the endpoints, where \(r=0\).

@ 3 | n | Rates of change in polar functions | rTheta
The graph shows \(r=f(\theta)\) for a polar curve. On the interval \(0<\theta<\dfrac{2\pi}{3}\), what is happening to the distance between the point on the curve and the origin?
* It is decreasing, because \(r\) is positive and decreasing.
- It is increasing, because \(r\) is positive and decreasing.
- It is increasing, because \(\theta\) is increasing.
- It stays constant.
= The distance from the origin is \(|r|\). When \(r\) is positive and decreasing, \(|r|\) decreases, so the curve approaches the origin.

@ 3 | n | Rates of change in polar functions | rTheta
For the function graphed, on the interval \(\dfrac{2\pi}{3}<\theta<\pi\), what is happening to the distance between the point on the polar curve and the origin?
* It is increasing, because \(r\) is negative and decreasing.
- It is decreasing, because \(r\) is decreasing.
- It is decreasing, because \(r\) is negative.
- It is zero throughout the interval.
= Here \(r\) falls from \(0\) to \(-1\). A negative \(r\) that decreases has a growing absolute value, so the point moves away from the origin, on the side opposite the direction \(\theta\).

@ 3 | n | Rates of change in polar functions
What is the average rate of change of \(r=2+\sin\theta\) with respect to \(\theta\) on the interval \(\left[0,\dfrac{\pi}{2}\right]\)?
* \(\dfrac{2}{\pi}\)
- \(\dfrac{\pi}{2}\)
- \(1\)
- \(\dfrac{6}{\pi}\)
= \(\dfrac{r(\pi/2)-r(0)}{\pi/2-0}=\dfrac{3-2}{\pi/2}=\dfrac{2}{\pi}\) units per radian.

@ 3 | n | Periodic phenomena
The function \(f\) is periodic with period \(4\), and \(f(1)=3\). Which of the following must also equal \(3\)?
* \(f(9)\) and \(f(-3)\)
- \(f(4)\) and \(f(5)\) only
- \(f(3)\)
- \(f(13)\) and \(f(-1)\)
= A period of \(4\) means \(f(x+4k)=f(x)\) for every integer \(k\). Both \(9=1+2\cdot 4\) and \(-3=1-4\) differ from \(1\) by multiples of \(4\); \(-1\) does not.

@ 3 | n | Sine and cosine graphs
Which equation is true for all real \(x\)?
* \(\cos\left(x-\dfrac{\pi}{2}\right)=\sin x\)
- \(\cos\left(x+\dfrac{\pi}{2}\right)=\sin x\)
- \(\sin\left(x-\dfrac{\pi}{2}\right)=\cos x\)
- \(\sin(x+\pi)=\sin x\)
= Shifting the cosine graph right by \(\tfrac{\pi}{2}\) moves its maximum from \(0\) to \(\tfrac{\pi}{2}\), producing the sine graph. The other shifts change the sign.

@ 3 | n | Sinusoidal transformations
The graph of \(y=\sin x\) is horizontally compressed by a factor of \(\tfrac{1}{3}\) and then translated up \(2\). Which equation describes the result?
* \(y=\sin(3x)+2\)
- \(y=\sin\!\left(\tfrac{1}{3}x\right)+2\)
- \(y=3\sin x+2\)
- \(y=\sin(3x+2)\)
= A horizontal dilation by \(\tfrac{1}{3}\) replaces \(x\) with \(3x\), shrinking the period to \(\tfrac{2\pi}{3}\). The translation adds \(2\) to every output.

@ 3 | c | Trigonometric equations
What is the greater solution of \(\sin x=0.3\) on \([0,2\pi)\)?
* \(2.837\)
- \(0.305\)
- \(3.447\)
- \(5.978\)
= The calculator gives \(\arcsin 0.3\approx 0.305\), in Quadrant I. The other solution is in Quadrant II: \(\pi-0.305\approx 2.837\).

@ 3 | c | Trigonometric equations
What is the solution of \(2\cos x=x\)?
* \(1.030\)
- \(0.739\)
- \(1.571\)
- \(0.450\)
= Graphing \(y=2\cos x\) and \(y=x\) shows a single intersection near \(x\approx 1.030\). The value \(0.739\) solves \(\cos x=x\).

@ 3 | c | Sinusoidal models
The average monthly temperature in a town is modeled by \(T(t)=15-8\cos\!\left(\dfrac{\pi t}{6}\right)\) degrees Celsius, where \(t\) is the month, with \(0\le t\le 12\). For how many months of the year is the average temperature above \(18^\circ\text{C}\)?
* \(4.532\)
- \(3.734\)
- \(8.266\)
- \(6.000\)
= \(T(t)>18\) when \(\cos\left(\tfrac{\pi t}{6}\right)<-0.375\), between \(t\approx 3.734\) and \(t\approx 8.266\). The length of that interval is about \(4.532\) months.

@ 3 | c | Polar functions
For the polar function \(r=2+3\cos\theta\), what is the value of \(r\) when \(\theta=2\)?
* \(0.752\)
- \(4.998\)
- \(1.876\)
- \(2.104\)
= \(r=2+3\cos 2\approx 2+3(-0.416)=0.752\), with the calculator in radian mode. Degree mode would give the incorrect \(4.998\).

@ 3 | c | Polar functions
For the polar curve \(r=3\sin(2\theta)\), what is the distance from the origin to the point on the curve where \(\theta=1.1\)?
* \(2.425\)
- \(2.674\)
- \(1.213\)
- \(3.000\)
= The distance is \(|r|=|3\sin 2.2|\approx 2.425\). The value \(2.674\) is \(3\sin 1.1\), which omits the factor of \(2\).

@ 3 | c | Polar coordinates
What is the \(x\)-coordinate of the point with polar coordinates \((4,2.3)\)?
* \(-2.665\)
- \(2.983\)
- \(-0.666\)
- \(2.665\)
= \(x=r\cos\theta=4\cos 2.3\approx -2.665\). The angle \(2.3\) is between \(\tfrac{\pi}{2}\) and \(\pi\), so the point is in Quadrant II. The value \(2.983\) is the \(y\)-coordinate.

@ 3 | c | Inverse trigonometric functions
What is the solution of \(\tan x=2.5\) on \(\left(\pi,\tfrac{3\pi}{2}\right)\)?
* \(4.332\)
- \(1.190\)
- \(1.951\)
- \(5.093\)
= The calculator gives \(\arctan 2.5\approx 1.190\), in \(\left(-\tfrac{\pi}{2},\tfrac{\pi}{2}\right)\). Tangent has period \(\pi\), so the solution in the given interval is \(\pi+1.190\approx 4.332\).

@ 3 | c | Rates of change
What is the average rate of change of \(f(\theta)=3\sin\theta+\theta\) over \([0.5,2]\)?
* \(1.860\)
- \(2.790\)
- \(1.240\)
- \(0.930\)
= \(\dfrac{f(2)-f(0.5)}{1.5}\approx\dfrac{4.728-1.938}{1.5}\approx 1.860\). Forgetting to divide by the interval length gives \(2.790\).

@ 3 | c | Sinusoidal models
A rider's height on a Ferris wheel is \(h(t)=30-25\cos\!\left(\dfrac{2\pi t}{8}\right)\) meters after \(t\) minutes. When does the rider first reach a height of \(40\) meters?
* \(2.524\)
- \(1.476\)
- \(5.476\)
- \(3.000\)
= Solve \(\cos\left(\tfrac{\pi t}{4}\right)=-0.4\): \(\tfrac{\pi t}{4}=\arccos(-0.4)\approx 1.982\), so \(t\approx 2.524\). The rider is at \(40\) meters again, going down, at \(t\approx 5.476\).

@ 3 | c | Inverse trigonometric functions
What is \(\arccos(-0.6)\)?
* \(2.214\)
- \(0.927\)
- \(-0.927\)
- \(2.498\)
= The arccosine of a negative number lies in \(\left(\tfrac{\pi}{2},\pi\right]\), here about \(2.214\). It equals \(\pi-\arccos 0.6\).

@ 3 | c | Secant, cosecant, and cotangent
What is \(\sec(1.2)\)?
* \(2.760\)
- \(0.362\)
- \(1.073\)
- \(0.932\)
= \(\sec(1.2)=\dfrac{1}{\cos 1.2}\approx\dfrac{1}{0.362}\approx 2.760\). The value \(0.362\) is \(\cos 1.2\) itself.

@ 3 | c | Polar function graphs
What is the smallest positive value of \(\theta\) at which the polar curve \(r=1+2\sin\theta\) passes through the origin?
* \(3.665\)
- \(0.524\)
- \(5.760\)
- \(2.618\)
= The curve reaches the origin when \(r=0\), so \(\sin\theta=-\tfrac{1}{2}\). The first such angle is \(\tfrac{7\pi}{6}\approx 3.665\); the next is \(\tfrac{11\pi}{6}\approx 5.760\).

@ 3 | c | Tangent function
What is the solution of \(\tan x=x\) on \(\left(\pi,\tfrac{3\pi}{2}\right)\)?
* \(4.493\)
- \(4.712\)
- \(3.142\)
- \(4.000\)
= Graphing \(y=\tan x\) and \(y=x\) shows an intersection just before the asymptote at \(\tfrac{3\pi}{2}\approx 4.712\), near \(x\approx 4.493\).

@ 3 | c | Sinusoidal models
The hours of daylight in a city are modeled by \(D(t)=12+2.4\sin\!\left(\dfrac{2\pi(t-80)}{365}\right)\), where \(t\) is the day of the year. How many hours of daylight does the model predict on day \(172\)?
* \(14.400\)
- \(12.000\)
- \(9.600\)
- \(13.200\)
= \(D(172)=12+2.4\sin\left(\tfrac{2\pi\cdot 92}{365}\right)\approx 12+2.4(0.9999)\approx 14.400\). Day 172 is near the summer solstice, the maximum of the model.

@ 3 | c | Trigonometric equations
What is the smallest positive solution of \(\cos x=\sin(x-0.5)\)?
* \(1.035\)
- \(0.785\)
- \(2.071\)
- \(0.535\)
= Graphing both sides shows the first positive intersection near \(x\approx 1.035\). Analytically, \(\cos x=\sin\left(\tfrac{\pi}{2}-x\right)\), so \(\tfrac{\pi}{2}-x=x-0.5\) gives \(x=\tfrac{\pi/2+0.5}{2}\).

@ 3 | c | Secant, cosecant, and cotangent
What is \(\csc(0.4)\)?
* \(2.568\)
- \(0.389\)
- \(1.086\)
- \(2.365\)
= \(\csc(0.4)=\dfrac{1}{\sin 0.4}\approx\dfrac{1}{0.389}\approx 2.568\). The value \(1.086\) is \(\sec(0.4)\).

@ 3 | c | Polar coordinates
For the polar curve \(r=3\cos(2\theta)\), what is the \(x\)-coordinate of the point where \(\theta=0.7\)?
* \(0.390\)
- \(0.510\)
- \(0.328\)
- \(2.294\)
= First \(r=3\cos 1.4\approx 0.510\). Then \(x=r\cos\theta\approx 0.510\cos 0.7\approx 0.390\). The value \(0.328\) is the \(y\)-coordinate, \(r\sin\theta\).

@ 3 | c | Equivalent representations of sinusoids
What is the smallest positive \(x\)-value at which \(f(x)=3\sin(2x)+4\cos(2x)\) reaches its maximum?
* \(0.322\)
- \(0.644\)
- \(0.785\)
- \(0.464\)
= A calculator shows the maximum, \(5\), near \(x\approx 0.322\). Writing \(f(x)=5\cos(2x-c)\) with \(\tan c=\tfrac{3}{4}\) gives \(c\approx 0.644\), so the maximum is at \(x=\tfrac{c}{2}\).

@ 3 | c | Trigonometric inequalities
What is the total length of the intervals in \([0,2\pi]\) on which \(\sin x>0.7\)?
* \(1.591\)
- \(0.775\)
- \(2.366\)
- \(3.142\)
= \(\sin x>0.7\) between \(\arcsin 0.7\approx 0.775\) and \(\pi-0.775\approx 2.366\), an interval of length about \(1.591\). Sine is negative on \((\pi,2\pi)\), so there are no other intervals.

@ 3 | c | Inverse trigonometric functions
On \(\left[-\tfrac{\pi}{6},\tfrac{\pi}{6}\right]\), the function \(f(x)=\sin(3x)\) is increasing. What is the distance between the \(x\)-values at which \(f(x)=-0.2\) and \(f(x)=0.6\)?
* \(0.282\)
- \(0.845\)
- \(0.643\)
- \(0.215\)
= Solving gives \(x=\tfrac{1}{3}\arcsin(-0.2)\approx -0.067\) and \(x=\tfrac{1}{3}\arcsin 0.6\approx 0.214\). The distance is about \(0.282\). Forgetting the factor of \(\tfrac{1}{3}\) gives \(0.845\).
`;

module.exports = { source, figures };
