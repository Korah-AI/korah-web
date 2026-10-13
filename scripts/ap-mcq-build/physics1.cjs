// Source for korah-bot/ap/data/ap-physics-1/mcqs.json. Run build.cjs to regenerate.
// Each block: "@ unit | c (conceptual) or q (quantitative) | skill | optional figure key",
// stem lines, "*" the correct choice, "-" three distractors, "=" the explanation.
// Math is LaTeX between \( and \). Numerical questions state the value of g to use.
const { graph } = require('./figures.cjs');
const { draw, spring } = require('./diagram.cjs');

const SLOPE = ['poly', [[30, 190], [300, 190], [300, 60]], { fill: true }], TILT = -25.71;
const carts = (a, b, bState, alt) => draw(340, 180, alt, [
  ['hatch', 20, 150, 320, 150],
  ['rect', 60, 112, 64, 28, { fill: true }], ['circle', 76, 145, 5], ['circle', 108, 145, 5], ['text', 92, 131, a],
  ['rect', 216, 112, 64, 28, { fill: true }], ['circle', 232, 145, 5], ['circle', 264, 145, 5], ['text', 248, 131, b],
  ['arrow', 128, 100, 180, 100], ['text', 154, 92, 'v'], ['text', 248, 100, bState, { italic: false }],
]);

const figures = {
  vt: graph({ x: [0, 9], y: [-7, 7], ystep: 2, xlabel: 't (s)', ylabel: 'v (m/s)', curves: [{ pts: [[0, 0], [2, 6], [5, 6], [8, -6]] }], dots: [{ x: 0, y: 0 }, { x: 8, y: -6 }],
    alt: 'Velocity versus time graph made of line segments joining (0 s, 0 m/s), (2 s, 6 m/s), (5 s, 6 m/s), and (8 s, −6 m/s)' }),
  xt: graph({ x: [0, 5], y: [0, 10], ystep: 2, xlabel: 't (s)', ylabel: 'x (m)', curves: [{ pts: [[0, 0], [4.5, 9]], color: '#ec4899' }, { fn: t => t * t / 2, from: 0, to: 4.4 }], notes: [{ x: 2.1, y: 5.4, text: 'A' }, { x: 3.75, y: 5.5, text: 'B' }],
    alt: 'Position versus time graph. Cart A is a straight line from (0 s, 0 m) through (4 s, 8 m). Cart B is an upward-curving parabola from (0 s, 0 m) through (2 s, 2 m) and (4 s, 8 m)' }),
  cliff: draw(340, 220, 'Two balls leave the top edge of a cliff of height h with the same speed. Ball A is launched horizontally and ball B is launched at an angle above the horizontal', [
    ['poly', [[20, 60], [110, 60], [110, 200], [20, 200]], { fill: true }], ['hatch', 110, 200, 330, 200], ['text', 64, 136, 'h'],
    ['path', 'M110 52 Q170 52 232 200', { dash: true }], ['path', 'M110 52 Q190 -8 292 200', { dash: true }],
    ['circle', 110, 52, 5, { fill: 'currentColor' }], ['arrow', 116, 52, 162, 52], ['arrow', 114, 48, 150, 21], ['text', 170, 68, 'A'], ['text', 140, 16, 'B'],
  ]),
  incline: draw(340, 220, 'A block of mass m on a ramp inclined at angle theta above the horizontal', [
    SLOPE, ['text', 96, 184, 'θ'], ['rect', 143, 97, 44, 28, { fill: true, rotate: [TILT, 165, 125] }], ['text', 159, 117, 'm'],
  ]),
  inclineH: draw(340, 220, 'A block of mass m at the top of a ramp of height h inclined at angle theta above the horizontal', [
    SLOPE, ['text', 96, 184, 'θ'], ['rect', 240, 50.3, 44, 28, { fill: true, rotate: [TILT, 262, 78.3] }], ['text', 256, 71, 'm'],
    ['line', 314, 60, 314, 190, { dash: true }], ['text', 326, 130, 'h'],
  ]),
  inclineBall: draw(340, 220, 'A round object at the top of a ramp of height h, about to roll down', [
    SLOPE, ['text', 96, 184, 'θ'], ['circle', 263.1, 60, 16, { fill: true }], ['line', 263.1, 60, 274, 48],
    ['line', 314, 60, 314, 190, { dash: true }], ['text', 326, 130, 'h'],
  ]),
  tablePulley: draw(340, 200, 'Block m1 rests on a horizontal table and is connected by a string over a pulley at the table edge to a hanging block m2', [
    ['hatch', 20, 100, 226, 100], ['rect', 80, 70, 56, 30, { fill: true }], ['text', 108, 90, 'm₁'],
    ['line', 226, 100, 238, 92], ['circle', 238, 92, 12], ['line', 136, 80, 238, 80], ['line', 250, 92, 250, 150],
    ['rect', 232, 150, 36, 32, { fill: true }], ['text', 250, 171, 'm₂'],
  ]),
  atwood: draw(340, 200, 'Two blocks, of mass m and 3m, hang from the ends of a string that passes over a pulley attached to the ceiling', [
    ['hatch', 230, 14, 110, 14], ['line', 170, 14, 170, 40], ['circle', 170, 40, 22], ['line', 148, 40, 148, 150], ['line', 192, 40, 192, 110],
    ['rect', 130, 150, 36, 30, { fill: true }], ['text', 148, 170, 'm'], ['rect', 172, 110, 40, 40, { fill: true }], ['text', 192, 135, '3m'],
  ]),
  pushed: draw(340, 180, 'A horizontal force F pushes block A, which is in contact with smaller block B on its right, along a horizontal surface', [
    ['hatch', 20, 150, 320, 150], ['rect', 110, 95, 70, 55, { fill: true }], ['text', 145, 128, 'A'], ['rect', 180, 115, 40, 35, { fill: true }], ['text', 200, 138, 'B'],
    ['arrow', 45, 125, 108, 125], ['text', 72, 115, 'F'],
  ]),
  stacked: draw(340, 190, 'A small block of mass m rests on top of a larger block of mass M. A horizontal force F pulls the larger block to the right along a horizontal surface', [
    ['hatch', 20, 160, 320, 160], ['rect', 80, 120, 160, 40, { fill: true }], ['text', 160, 145, 'M'], ['rect', 130, 88, 56, 32, { fill: true }], ['text', 158, 109, 'm'],
    ['arrow', 240, 140, 300, 140], ['text', 272, 130, 'F'],
  ]),
  vertical: draw(340, 230, 'A ball on a string of length R moves in a vertical circle; the top and bottom of the circle are marked', [
    ['circle', 170, 115, 75, { dash: true }], ['line', 170, 115, 170, 48], ['circle', 170, 115, 2.5, { fill: 'currentColor' }],
    ['circle', 170, 40, 8, { fill: 'currentColor' }], ['circle', 170, 190, 8, { fill: 'currentColor' }], ['text', 182, 86, 'R'],
    ['text', 205, 44, 'top', { italic: false }], ['text', 218, 196, 'bottom', { italic: false }],
  ]),
  Fx: graph({ x: [0, 9], y: [-7, 7], ystep: 2, xlabel: 'x (m)', ylabel: 'F (N)', curves: [{ pts: [[0, 6], [4, 6], [6, 0], [8, -6]] }], dots: [{ x: 0, y: 6 }, { x: 8, y: -6 }],
    alt: 'Net force versus position graph made of line segments joining (0 m, 6 N), (4 m, 6 N), (6 m, 0 N), and (8 m, −6 N)' }),
  loop: draw(340, 210, 'A track descends from a starting height h, runs along the ground, and passes through a vertical circular loop of radius R', [
    ['path', 'M20 40 C70 40 90 190 140 190 H330'], ['circle', 215, 145, 45], ['circle', 24, 32, 7, { fill: true }],
    ['line', 44, 52, 44, 190, { dash: true }], ['text', 55, 125, 'h'], ['line', 215, 145, 260, 145, { dash: true }], ['text', 238, 138, 'R'],
  ]),
  Ux: graph({ x: [0, 4.5], y: [0, 9], xlabel: 'x (m)', ylabel: 'U (J)', curves: [{ fn: x => 2 * (x - 2) ** 2, from: 0, to: 4 }, { pts: [[0, 6], [4.3, 6]], dash: true, color: '#ec4899' }], notes: [{ x: 3.9, y: 6.4, text: 'E' }],
    alt: 'Potential energy versus position graph: a parabola with minimum 0 J at x = 2 m, rising to 8 J at x = 0 m and x = 4 m. A dashed horizontal line marks total mechanical energy E = 6 J' }),
  Ft: graph({ x: [0, 7], y: [0, 50], ystep: 10, xlabel: 't (s)', ylabel: 'F (N)', curves: [{ pts: [[0, 0], [2, 40], [4, 40], [6, 0]] }],
    alt: 'Force versus time graph made of line segments joining (0 s, 0 N), (2 s, 40 N), (4 s, 40 N), and (6 s, 0 N)' }),
  cartsStick: carts('2m', 'm', 'at rest', 'A cart of mass 2m moves to the right with speed v toward a cart of mass m that is at rest'),
  cartsElastic: carts('m', '3m', 'at rest', 'A cart of mass m moves to the right with speed v toward a cart of mass 3m that is at rest'),
  seesaw: draw(340, 170, 'A uniform plank of length L rests on a pivot located one fourth of its length from the left end. A block of mass m sits on the left end', [
    ['rect', 40, 96, 260, 10, { fill: true }], ['poly', [[105, 106], [92, 134], [118, 134]], { fill: true }], ['hatch', 60, 134, 280, 134],
    ['rect', 40, 70, 26, 26, { fill: true }], ['text', 53, 88, 'm'], ['text', 72, 158, 'L/4'], ['text', 202, 158, '3L/4'],
  ]),
  sign: draw(340, 215, 'A uniform horizontal rod is hinged to a wall at its left end. A cable runs from the right end of the rod up to the wall, making a 30 degree angle with the rod. A sign hangs from the right end of the rod', [
    ['hatch', 50, 10, 50, 205], ['rect', 50, 128, 190, 10, { fill: true }], ['circle', 54, 133, 4, { fill: 'currentColor' }], ['line', 240, 128, 50, 18],
    ['text', 188, 122, '30°', { italic: false }], ['line', 240, 138, 240, 160], ['rect', 220, 160, 40, 30, { fill: true }], ['text', 240, 180, 'sign', { italic: false, size: 11 }],
  ]),
  wt: graph({ x: [0, 8], y: [0, 10], ystep: 2, xlabel: 't (s)', ylabel: 'ω (rad/s)', curves: [{ pts: [[0, 0], [2, 8], [5, 8], [7, 0]] }],
    alt: 'Angular velocity versus time graph made of line segments joining (0 s, 0 rad/s), (2 s, 8 rad/s), (5 s, 8 rad/s), and (7 s, 0 rad/s)' }),
  pulley: draw(340, 215, 'A uniform disk of mass M and radius R turns on a fixed axle. A string wrapped around its rim supports a hanging block of mass m', [
    ['hatch', 200, 14, 60, 14], ['line', 130, 14, 130, 80], ['circle', 130, 80, 50, { fill: true }], ['circle', 130, 80, 3, { fill: 'currentColor' }],
    ['line', 130, 80, 165, 45, { dash: true }], ['text', 157, 74, 'R'], ['text', 104, 96, 'M'], ['line', 180, 80, 180, 170], ['rect', 162, 170, 36, 30, { fill: true }], ['text', 180, 190, 'm'],
  ]),
  putty: draw(340, 170, 'Top view of a rod of length L on a horizontal surface, free to rotate about a pivot at its left end. A lump of clay of mass m moves with speed v perpendicular to the rod toward its free end', [
    ['rect', 60, 105, 200, 10, { fill: true }], ['circle', 60, 110, 5, { fill: 'currentColor' }], ['text', 60, 138, 'pivot', { italic: false, size: 11 }], ['text', 160, 138, 'L'],
    ['circle', 260, 36, 7, { fill: true }], ['arrow', 260, 48, 260, 100], ['text', 278, 40, 'm'], ['text', 273, 78, 'v'], ['text', 300, 20, 'Top view', { italic: false, size: 11 }],
  ]),
  shm: graph({ x: [0, 4.5], y: [-0.3, 0.3], xstep: 0.5, ystep: 0.1, xlabel: 't (s)', ylabel: 'x (m)', curves: [{ fn: t => 0.2 * Math.cos(Math.PI * t), from: 0, to: 4 }],
    alt: 'Position versus time graph of an oscillator: a cosine curve with amplitude 0.2 m and period 2 s, starting at x = 0.2 m when t = 0' }),
  springBlock: draw(340, 180, 'A block of mass m on a frictionless horizontal surface is attached to a spring fixed to a wall. Positions −A, 0, and +A are marked, with 0 the equilibrium position', [
    ['hatch', 30, 60, 30, 150], ['hatch', 30, 150, 320, 150], spring(30, 170, 125), ['rect', 170, 100, 50, 50, { fill: true }], ['text', 195, 130, 'm'],
    ['line', 135, 88, 135, 96], ['line', 195, 88, 195, 96], ['line', 255, 88, 255, 96], ['text', 135, 82, '−A'], ['text', 195, 82, '0'], ['text', 255, 82, '+A'],
  ]),
  pendulum: draw(340, 190, 'A simple pendulum of length L displaced by angle theta from the vertical', [
    ['hatch', 230, 16, 110, 16], ['line', 170, 16, 170, 170, { dash: true }], ['line', 170, 16, 236, 150], ['circle', 236, 150, 12, { fill: true }], ['text', 184, 64, 'θ'], ['text', 216, 80, 'L'],
  ]),
  pipe: draw(340, 200, 'A horizontal pipe narrows from a wide section, labeled 1, to a narrow section, labeled 2. Water flows from left to right', [
    ['poly', [[20, 60], [130, 60], [190, 84], [320, 84], [320, 116], [190, 116], [130, 140], [20, 140]], { fill: true }],
    ['arrow', 36, 100, 84, 100], ['text', 110, 105, '1', { italic: false, bold: true }], ['text', 262, 105, '2', { italic: false, bold: true }],
  ]),
  tank: draw(340, 225, 'An open tank filled with water to height H above the ground. Water streams from a small hole in the side at depth h below the surface and lands on the ground', [
    ['poly', [[70, 50], [210, 50], [210, 205], [70, 205]], { fill: true, color: 'none' }], ['path', 'M70 30 V205 H210 V30'], ['line', 70, 50, 210, 50], ['hatch', 30, 205, 330, 205],
    ['path', 'M210 130 Q252 130 286 205', { color: '#3b82f6', width: 2.4 }], ['line', 230, 50, 230, 130, { dash: true }], ['text', 242, 95, 'h'], ['line', 50, 50, 50, 205, { dash: true }], ['text', 38, 132, 'H'],
  ]),
  float: draw(340, 200, 'A rectangular block floats upright in a container of water with three fourths of its height below the surface', [
    ['poly', [[80, 80], [260, 80], [260, 180], [80, 180]], { fill: true, color: 'none' }], ['path', 'M80 40 V180 H260 V40'], ['line', 80, 80, 260, 80], ['rect', 140, 60, 60, 80, { fill: true }],
  ]),
};

const source = String.raw`
@ 1 | q | Displacement from a velocity graph | vt
The graph shows the velocity of a cart moving along a straight track. What is the displacement of the cart from \(t=0\) to \(t=8\text{ s}\)?
* \(24\text{ m}\)
- \(33\text{ m}\)
- \(28.5\text{ m}\)
- \(19.5\text{ m}\)
= Displacement is the signed area under the graph. The velocity is zero at \(t=6.5\text{ s}\), so the area above the axis is \(6+18+4.5=28.5\text{ m}\) and the area below is \(4.5\text{ m}\), giving \(24\text{ m}\). The total distance traveled is \(33\text{ m}\).

@ 1 | c | Interpreting a velocity graph | vt
The graph shows the velocity of a cart moving along a straight track. At what time is the cart farthest from its position at \(t=0\)?
* \(t=6.5\text{ s}\)
- \(t=2\text{ s}\)
- \(t=5\text{ s}\)
- \(t=8\text{ s}\)
= The cart moves in the positive direction as long as its velocity is positive, which is until the graph crosses the axis at \(t=6.5\text{ s}\). After that it moves back toward the start. The velocity begins to decrease at \(5\text{ s}\), but the cart is still moving away.

@ 1 | q | Acceleration from a velocity graph | vt
The graph shows the velocity of a cart moving along a straight track. What is the acceleration of the cart at the instant its velocity is zero during the interval \(5\text{ s}<t<8\text{ s}\)?
* \(-4\text{ m/s}^2\)
- \(0\)
- \(-2\text{ m/s}^2\)
- \(-12\text{ m/s}^2\)
= Acceleration is the slope of the velocity graph: \(\dfrac{-6-6}{8-5}=-4\text{ m/s}^2\). A velocity of zero does not mean the acceleration is zero; the slope is the same throughout the segment.

@ 1 | c | Comparing motion from position graphs | xt
The graph shows the positions of carts A and B as functions of time. At which time, if any, do the two carts have the same speed?
* At \(t=2\text{ s}\) only
- At \(t=4\text{ s}\) only
- At \(t=0\) and at \(t=4\text{ s}\)
- At no time, because cart B is always accelerating
= Speed is the slope of a position graph. Cart A has a constant slope of \(2\text{ m/s}\); the slope of cart B's curve equals \(2\text{ m/s}\) at \(t=2\text{ s}\). At \(t=4\text{ s}\) the carts are at the same position, but cart B is moving twice as fast.

@ 1 | q | Free fall
A ball is thrown straight up at \(20\text{ m/s}\) from the edge of a cliff \(60\text{ m}\) above the ground. Air resistance is negligible. Using \(g=10\text{ m/s}^2\), how long after it is thrown does the ball reach the ground?
* \(6\text{ s}\)
- \(4\text{ s}\)
- \(3.5\text{ s}\)
- \(2\text{ s}\)
= Taking up as positive, \(-60=20t-5t^2\), so \(t^2-4t-12=0\) and \(t=6\text{ s}\). Four seconds is only the time to return to the launch height.

@ 1 | c | Projectile motion | cliff
Balls A and B are thrown from the top of a cliff with the same initial speed, as shown. Ball A is thrown horizontally and ball B is thrown at an angle above the horizontal. Air resistance is negligible. Which of the following correctly compares the balls when they reach the ground?
* They land with the same speed, and ball B lands later.
- They land with the same speed at the same time.
- Ball B lands with a greater speed and lands later.
- Ball A lands with a greater speed and lands earlier.
= Both balls start with the same kinetic energy and fall through the same height, so they gain the same kinetic energy and land with equal speeds. Ball B has an upward initial velocity component, so it spends more time in the air.

@ 1 | q | Projectile motion
A projectile is launched from level ground at \(30\text{ m/s}\) at an angle of \(53^\circ\) above the horizontal \((\sin 53^\circ=0.8,\ \cos 53^\circ=0.6)\). Using \(g=10\text{ m/s}^2\) and neglecting air resistance, how far has the projectile traveled horizontally when it reaches its maximum height?
* \(43.2\text{ m}\)
- \(86.4\text{ m}\)
- \(28.8\text{ m}\)
- \(57.6\text{ m}\)
= The vertical velocity component is \(24\text{ m/s}\), so the time to the top is \(2.4\text{ s}\). The horizontal component is \(18\text{ m/s}\), giving \(18(2.4)=43.2\text{ m}\). The maximum height is \(28.8\text{ m}\) and the full range is \(86.4\text{ m}\).

@ 1 | c | Motion with air resistance
A ball is thrown straight up and returns to the height from which it was thrown. Air resistance is not negligible. How does the time the ball takes to rise compare with the time it takes to fall back?
* The fall takes longer, because the ball's average speed is smaller on the way down.
- The rise takes longer, because the ball is moving faster on the way up.
- The two times are equal, because the ball covers the same distance each way.
- The two times are equal, because air resistance acts in both directions.
= On the way up, gravity and air resistance both act downward, so the ball slows quickly. On the way down they oppose each other, so the ball speeds up slowly and has lost mechanical energy. At every height the ball is slower coming down than going up, so the same distance takes more time.

@ 1 | q | Constant acceleration
Car A travels at a constant \(20\text{ m/s}\). At the instant it passes car B, which is at rest, car B begins to accelerate at a constant \(4\text{ m/s}^2\) in the same direction. What is the speed of car B at the instant it catches up with car A?
* \(40\text{ m/s}\)
- \(20\text{ m/s}\)
- \(30\text{ m/s}\)
- \(80\text{ m/s}\)
= The cars are side by side when \(20t=\tfrac{1}{2}(4)t^2\), so \(t=10\text{ s}\) and car B's speed is \(4(10)=40\text{ m/s}\). To cover the same distance in the same time from rest, car B must end at twice car A's constant speed.

@ 1 | c | Analyzing data
Students drop a ball from rest from several heights \(h\) and measure the fall time \(t\) for each. Which graph of their data should be a straight line whose slope equals \(\tfrac{1}{2}g\)?
* \(h\) as a function of \(t^2\)
- \(h\) as a function of \(t\)
- \(h^2\) as a function of \(t\)
- \(\sqrt{h}\) as a function of \(t\)
= Because \(h=\tfrac{1}{2}gt^2\), plotting \(h\) against \(t^2\) gives a line of slope \(\tfrac{1}{2}g\). A graph of \(\sqrt{h}\) against \(t\) is also linear, but its slope is \(\sqrt{g/2}\).

@ 1 | q | Relative motion
A boat moves at \(5\text{ m/s}\) relative to the water in a river that flows at \(3\text{ m/s}\). The river is \(100\text{ m}\) wide. If the boat is steered so that it travels straight across to the point directly opposite its starting point, how long does the crossing take?
* \(25\text{ s}\)
- \(20\text{ s}\)
- \(33\text{ s}\)
- \(12.5\text{ s}\)
= The boat must point partly upstream so that \(3\text{ m/s}\) of its velocity cancels the current. The remaining component across the river is \(\sqrt{5^2-3^2}=4\text{ m/s}\), so the time is \(100/4=25\text{ s}\). Twenty seconds is the time if the boat points straight across and is carried downstream.

@ 1 | q | Projectile motion
A ball rolls off a horizontal table of height \(h\) with speed \(v\) and lands a horizontal distance \(d\) from the table. If the ball instead leaves a table of height \(4h\) with speed \(2v\), how far from the table does it land?
* \(4d\)
- \(2d\)
- \(8d\)
- \(d\)
= The fall time is \(\sqrt{2h/g}\), so quadrupling the height doubles the time. The horizontal distance is speed times time, so doubling both gives \(4d\).

@ 2 | q | Friction on an incline | incline
A block of mass \(m\) slides down a ramp inclined at angle \(\theta\), as shown. The coefficient of kinetic friction between the block and the ramp is \(\mu_k\). What is the magnitude of the block's acceleration?
* \(g\left(\sin\theta-\mu_k\cos\theta\right)\)
- \(g\left(\sin\theta-\mu_k\right)\)
- \(g\left(\cos\theta-\mu_k\sin\theta\right)\)
- \(g\sin\theta\left(1-\mu_k\right)\)
= Along the ramp, \(mg\sin\theta-\mu_kN=ma\). Perpendicular to the ramp, \(N=mg\cos\theta\). Substituting gives \(a=g(\sin\theta-\mu_k\cos\theta)\).

@ 2 | c | Static friction on an incline | incline
A block rests on a rough ramp, as shown. The angle \(\theta\) of the ramp is slowly increased, and the block remains at rest. How do the magnitudes of the normal force and the friction force on the block change as \(\theta\) increases?
* The normal force decreases and the friction force increases.
- The normal force decreases and the friction force decreases.
- The normal force stays the same and the friction force increases.
- Both forces stay the same, because the block remains at rest.
= For a block at rest, \(N=mg\cos\theta\) and the static friction force equals \(mg\sin\theta\). As \(\theta\) increases, \(\cos\theta\) decreases and \(\sin\theta\) increases. Static friction equals \(\mu_sN\) only at the point of slipping.

@ 2 | q | Connected objects | tablePulley
Block \(m_1\) is on a frictionless horizontal table and is connected by a light string over a light, frictionless pulley to hanging block \(m_2\), as shown. The blocks are released from rest. What is the tension in the string?
* \(\dfrac{m_1m_2g}{m_1+m_2}\)
- \(m_2g\)
- \(\dfrac{m_2^2g}{m_1+m_2}\)
- \(\left(m_2-m_1\right)g\)
= The system accelerates at \(a=\dfrac{m_2g}{m_1+m_2}\). The string is the only horizontal force on \(m_1\), so \(T=m_1a=\dfrac{m_1m_2g}{m_1+m_2}\).

@ 2 | c | Connected objects | tablePulley
Block \(m_1\) is on a horizontal table and is connected by a light string over a light, frictionless pulley to hanging block \(m_2\), as shown. In trial 1 the table is frictionless and the blocks accelerate. In trial 2 the table is rough and the blocks remain at rest. How does the tension in the string compare in the two trials?
* The tension is greater in trial 2.
- The tension is greater in trial 1.
- The tension is the same, because the same block hangs from the string.
- The tension is zero in trial 2, because nothing moves.
= In trial 2 the hanging block is in equilibrium, so the tension equals \(m_2g\). In trial 1 the hanging block accelerates downward, so the net force on it is downward and the tension must be less than \(m_2g\).

@ 2 | q | Atwood's machine | atwood
Blocks of mass \(m\) and \(3m\) hang from a light string that passes over a light, frictionless pulley, as shown. The blocks are released from rest. What is the tension in the string while the blocks are moving?
* \(\dfrac{3}{2}mg\)
- \(2mg\)
- \(mg\)
- \(3mg\)
= The net force on the system is \(3mg-mg=2mg\) and the total mass is \(4m\), so \(a=\dfrac{g}{2}\). For the lighter block, \(T-mg=m\dfrac{g}{2}\), giving \(T=\dfrac{3}{2}mg\). The tension lies between the two weights.

@ 2 | q | Contact forces | pushed
Blocks A and B, of mass \(3m\) and \(m\), are in contact on a frictionless horizontal surface. A horizontal force of magnitude \(F\) is applied to block A, as shown. What is the magnitude of the force that block A exerts on block B?
* \(\dfrac{F}{4}\)
- \(\dfrac{3F}{4}\)
- \(F\)
- \(\dfrac{F}{3}\)
= The blocks accelerate together at \(a=\dfrac{F}{4m}\). The contact force is the only horizontal force on block B, so it equals \(ma=\dfrac{F}{4}\). If the force were applied to block B instead, the contact force would be \(\dfrac{3F}{4}\).

@ 2 | c | Static friction between surfaces | stacked
A block of mass \(m\) rests on a larger block of mass \(M\), which is pulled to the right by force \(F\) across a frictionless floor, as shown. The two blocks accelerate together without slipping. Which of the following describes the friction force exerted on the top block by the bottom block?
* It is static friction directed to the right.
- It is static friction directed to the left.
- It is kinetic friction directed to the left.
- It is zero, because the blocks do not slide relative to each other.
= The top block accelerates to the right, and the only horizontal force on it is friction from the bottom block, so that force must point to the right. It is static friction because the surfaces do not slide over each other.

@ 2 | q | Static friction between surfaces | stacked
A block of mass \(m\) rests on a larger block of mass \(M\), which is pulled by force \(F\) across a frictionless floor, as shown. The coefficient of static friction between the blocks is \(\mu_s\). What is the greatest value of \(F\) for which the top block does not slip?
* \(\mu_s\left(m+M\right)g\)
- \(\mu_smg\)
- \(\mu_sMg\)
- \(\mu_s\left(M-m\right)g\)
= Friction is the only horizontal force on the top block, so its greatest acceleration is \(\mu_sg\). For both blocks to share that acceleration, \(F=(m+M)\mu_sg\).

@ 2 | q | Circular motion in a vertical plane | vertical
A ball of mass \(m\) on a string moves in a vertical circle, as shown. The only forces on the ball are gravity and the tension in the string. How much greater is the tension when the ball is at the bottom of the circle than when it is at the top?
* \(6mg\)
- \(2mg\)
- \(4mg\)
- \(5mg\)
= At the top, \(T_t+mg=\dfrac{mv_t^2}{R}\); at the bottom, \(T_b-mg=\dfrac{mv_b^2}{R}\). Energy conservation gives \(v_b^2=v_t^2+4gR\). Subtracting, \(T_b-T_t=2mg+4mg=6mg\), whatever the speed.

@ 2 | q | Orbital motion
A satellite moves in a circular orbit of radius \(r\) around a planet with period \(T\). What is the period of a satellite in a circular orbit of radius \(2r\) around the same planet?
* \(2\sqrt{2}\,T\)
- \(2T\)
- \(\sqrt{2}\,T\)
- \(4T\)
= Setting the gravitational force equal to \(\dfrac{mv^2}{r}\) gives \(T^2\propto r^3\). Doubling the radius multiplies \(T^2\) by 8, so the period becomes \(2\sqrt{2}\,T\).

@ 2 | q | Gravitational field
A planet has twice the mass of Earth and half the radius of Earth. In terms of \(g\), the gravitational field strength at Earth's surface, what is the gravitational field strength at the surface of the planet?
* \(8g\)
- \(4g\)
- \(g\)
- \(\dfrac{g}{2}\)
= The surface field is \(\dfrac{GM}{R^2}\). Doubling \(M\) doubles the field, and halving \(R\) multiplies it by 4, for a total factor of 8.

@ 2 | c | Apparent weight
A student stands on a scale in an elevator that is moving upward and slowing down. How does the reading on the scale compare with the student's weight, and why?
* It is less than the weight, because the student's acceleration is downward.
- It is greater than the weight, because the elevator is moving upward.
- It is equal to the weight, because the scale always measures the gravitational force.
- It is greater than the weight, because the student's acceleration is upward.
= The scale reads the normal force. An object moving upward while slowing has a downward acceleration, so the net force is downward and the normal force is smaller than the gravitational force. The direction of motion alone does not determine the reading.

@ 2 | q | Circular motion over a hill
A car of mass \(m\) travels over the top of a hill whose cross section is a circular arc of radius \(r\). The speed of the car at the top is \(\tfrac{1}{2}\sqrt{gr}\). What is the magnitude of the normal force exerted on the car by the road at the top of the hill?
* \(\dfrac{3}{4}mg\)
- \(\dfrac{5}{4}mg\)
- \(mg\)
- \(\dfrac{1}{4}mg\)
= At the top the centripetal acceleration is downward, so \(mg-N=\dfrac{mv^2}{r}=\dfrac{1}{4}mg\) and \(N=\dfrac{3}{4}mg\). The car would lose contact with the road at a speed of \(\sqrt{gr}\).

@ 3 | q | Work and kinetic energy | Fx
The graph shows the net force on a \(2\text{ kg}\) object as a function of its position. The object is at rest at \(x=0\). What is the greatest speed the object reaches between \(x=0\) and \(x=8\text{ m}\)?
* \(5.5\text{ m/s}\)
- \(4.9\text{ m/s}\)
- \(7.7\text{ m/s}\)
- \(3.9\text{ m/s}\)
= The net work is the area under the graph. The area is greatest at \(x=6\text{ m}\), where it equals \(24+6=30\text{ J}\), so \(\tfrac{1}{2}(2)v^2=30\) and \(v\approx 5.5\text{ m/s}\). By \(x=8\text{ m}\) the net work has dropped to \(24\text{ J}\) and the speed to \(4.9\text{ m/s}\).

@ 3 | c | Work and kinetic energy | Fx
The graph shows the net force on an object as a function of its position. The object is at rest at \(x=0\). Which of the following describes the motion of the object between \(x=4\text{ m}\) and \(x=6\text{ m}\)?
* It is speeding up, and its acceleration is decreasing in magnitude.
- It is slowing down, because the force is decreasing.
- It is moving at constant speed, because the force is changing at a constant rate.
- It is speeding up, and its acceleration is increasing in magnitude.
= The net force is still positive in this interval, so it continues to do positive work and the object speeds up. Because the force is getting smaller, the acceleration is getting smaller. The object does not begin to slow until the force becomes negative beyond \(x=6\text{ m}\).

@ 3 | q | Energy with friction | inclineH
A block is released from rest at the top of a rough ramp of height \(h\) inclined at angle \(\theta\), as shown. The coefficient of kinetic friction is \(\mu_k\). What is the speed of the block at the bottom of the ramp?
* \(\sqrt{2gh\left(1-\dfrac{\mu_k}{\tan\theta}\right)}\)
- \(\sqrt{2gh\left(1-\mu_k\right)}\)
- \(\sqrt{2gh\left(1-\mu_k\tan\theta\right)}\)
- \(\sqrt{2gh}\)
= The ramp has length \(\dfrac{h}{\sin\theta}\) and the friction force is \(\mu_kmg\cos\theta\), so the energy dissipated is \(\dfrac{\mu_kmgh}{\tan\theta}\). Then \(\tfrac{1}{2}mv^2=mgh-\dfrac{\mu_kmgh}{\tan\theta}\).

@ 3 | q | Energy and circular motion | loop
A small block is released from rest at height \(h\) on a frictionless track that includes a vertical loop of radius \(R\), as shown. What is the minimum value of \(h\) for which the block stays in contact with the track at the top of the loop?
* \(\dfrac{5}{2}R\)
- \(2R\)
- \(3R\)
- \(\dfrac{3}{2}R\)
= At the top, contact is just maintained when gravity alone supplies the centripetal force: \(mg=\dfrac{mv^2}{R}\), so \(v^2=gR\). Energy conservation gives \(mgh=mg(2R)+\tfrac{1}{2}mgR\), so \(h=\dfrac{5}{2}R\).

@ 3 | c | Energy and circular motion | loop
A small block is released from rest at height \(h=2R\) on a frictionless track that includes a vertical loop of radius \(R\), as shown. Which of the following describes what happens to the block?
* It loses contact with the track at a point between the height of the loop's center and the top of the loop.
- It reaches the top of the loop with zero speed and then falls straight down.
- It travels around the entire loop, because it starts at the height of the top of the loop.
- It stops at the height of the loop's center and slides back down.
= Energy conservation would allow the block to reach height \(2R\) only with zero speed, but staying on the track at the top requires a speed of at least \(\sqrt{gR}\). The normal force therefore reaches zero before the top, and the block leaves the track as a projectile while still moving.

@ 3 | q | Elastic potential energy
A spring compressed a distance \(x\) launches a block from rest up a frictionless ramp, and the block rises to a maximum height \(h\) above its starting point. If the spring is instead compressed a distance \(3x\), to what maximum height does the block rise?
* \(9h\)
- \(3h\)
- \(6h\)
- \(\sqrt{3}\,h\)
= All of the spring's energy becomes gravitational potential energy: \(\tfrac{1}{2}kx^2=mgh\). The stored energy depends on the square of the compression, so tripling it gives nine times the height.

@ 3 | c | Power
A car starts from rest on a level road, and its engine delivers constant power to the wheels. Resistive forces are negligible. Which of the following describes the car's motion?
* Its acceleration decreases as its speed increases.
- Its acceleration is constant.
- Its acceleration increases as its speed increases.
- Its speed is constant, because the power is constant.
= Power is \(P=Fv\), so with constant power the driving force is \(\dfrac{P}{v}\), which shrinks as the speed grows. Equivalently, kinetic energy increases in proportion to time, so the speed is proportional to \(\sqrt{t}\).

@ 3 | c | Potential energy graphs | Ux
The graph shows the potential energy \(U\) of a system as a function of the position \(x\) of an object in the system. The total mechanical energy of the system is \(E=6\text{ J}\). Which of the following describes the object's motion?
* It moves back and forth between about \(x=0.3\text{ m}\) and \(x=3.7\text{ m}\), moving fastest at \(x=2\text{ m}\).
- It moves back and forth between \(x=0\) and \(x=4\text{ m}\), moving fastest at those end points.
- It comes to rest at \(x=2\text{ m}\), where the potential energy is zero.
- It moves in the \(+x\) direction indefinitely, because its total energy is greater than zero.
= The kinetic energy is \(E-U\), which is zero where the curve meets the dashed line and greatest where \(U\) is smallest. The object cannot enter regions where \(U\) would exceed \(E\), so it turns around near \(x=0.3\text{ m}\) and \(x=3.7\text{ m}\).

@ 3 | q | Potential energy graphs | Ux
The graph shows the potential energy \(U\) of a system as a function of the position \(x\) of an object in the system; the curve is \(U=2(x-2)^2\) with \(U\) in joules and \(x\) in meters. What force is exerted on the object when it is at \(x=3\text{ m}\)?
* \(4\text{ N}\) in the \(-x\) direction
- \(4\text{ N}\) in the \(+x\) direction
- \(2\text{ N}\) in the \(-x\) direction
- \(2\text{ N}\) in the \(+x\) direction
= The force is the negative of the slope of the potential energy graph. At \(x=3\text{ m}\) the slope is \(4(3-2)=4\text{ J/m}\), so the force is \(4\text{ N}\) toward decreasing \(x\), back toward the minimum. The value \(2\text{ J}\) is the potential energy there, not the force.

@ 3 | q | Energy with friction
A block of mass \(m\) is pressed against a spring of spring constant \(k\), compressing it a distance \(x\), and released from rest. After leaving the spring, the block slides across a rough horizontal surface with coefficient of kinetic friction \(\mu_k\). How far does the block slide on the rough surface before stopping?
* \(\dfrac{kx^2}{2\mu_kmg}\)
- \(\dfrac{kx^2}{\mu_kmg}\)
- \(\dfrac{kx}{\mu_kmg}\)
- \(\dfrac{kx^2}{2\mu_kg}\)
= The spring's energy is entirely dissipated by friction: \(\tfrac{1}{2}kx^2=\mu_kmgd\), so \(d=\dfrac{kx^2}{2\mu_kmg}\).

@ 3 | c | Choosing a system
A block slides down a frictionless ramp. Students analyze the motion using a system that consists of the block alone. Which of the following is a correct statement about that system?
* Earth does positive work on the system, increasing its kinetic energy; the system has no gravitational potential energy.
- No work is done on the system, and its gravitational potential energy is converted to kinetic energy.
- The normal force does positive work on the system, increasing its kinetic energy.
- The total mechanical energy of the system stays constant.
= Gravitational potential energy belongs to a system of interacting objects, so a single block has none. With the block as the system, Earth's gravitational force is external and does positive work. The description in terms of potential energy applies to the block–Earth system.

@ 3 | q | Energy and circular motion
A pendulum bob of mass \(m\) on a string is released from rest with the string horizontal. What is the tension in the string when the bob passes through the lowest point of its swing?
* \(3mg\)
- \(mg\)
- \(2mg\)
- \(4mg\)
= Falling through the string length \(L\) gives \(v^2=2gL\). At the bottom, \(T-mg=\dfrac{mv^2}{L}=2mg\), so \(T=3mg\).

@ 3 | q | Elastic and gravitational potential energy
A \(1.0\text{ kg}\) block is dropped from rest from \(0.20\text{ m}\) above the top of a vertical spring with spring constant \(200\text{ N/m}\). Using \(g=10\text{ m/s}^2\), what is the maximum compression of the spring?
* \(0.20\text{ m}\)
- \(0.14\text{ m}\)
- \(0.05\text{ m}\)
- \(0.10\text{ m}\)
= The block falls a total distance \(0.20+x\) before stopping, so \(mg(0.20+x)=\tfrac{1}{2}kx^2\), or \(100x^2-10x-2=0\), which gives \(x=0.20\text{ m}\). Ignoring the extra distance \(x\) gives \(0.14\text{ m}\), and \(0.05\text{ m}\) is the compression at which the block would sit in equilibrium.

@ 4 | q | Impulse | Ft
The graph shows the net force exerted on a \(20\text{ kg}\) cart as a function of time. The force is in the \(+x\) direction, and at \(t=0\) the cart is moving at \(2\text{ m/s}\) in the \(-x\) direction. What is the velocity of the cart at \(t=6\text{ s}\)?
* \(6\text{ m/s}\) in the \(+x\) direction
- \(8\text{ m/s}\) in the \(+x\) direction
- \(10\text{ m/s}\) in the \(+x\) direction
- \(4\text{ m/s}\) in the \(+x\) direction
= The impulse is the area under the graph, \(40+80+40=160\text{ N}\cdot\text{s}\), so the velocity changes by \(\dfrac{160}{20}=8\text{ m/s}\). Starting from \(-2\text{ m/s}\), the final velocity is \(+6\text{ m/s}\).

@ 4 | c | Impulse and kinetic energy | Ft
The net force shown in the graph is exerted on cart X, of mass \(m\), and in a separate trial on cart Y, of mass \(2m\). Both carts start from rest. How do the carts compare at \(t=6\text{ s}\)?
* They have the same momentum, and cart X has more kinetic energy.
- They have the same momentum and the same kinetic energy.
- Cart X has more momentum and more kinetic energy.
- They have the same kinetic energy, and cart Y has more momentum.
= Equal forces acting for equal times deliver equal impulses, so the momenta are equal. Kinetic energy is \(\dfrac{p^2}{2m}\), so the cart with less mass has more. The lighter cart also travels farther, so more work is done on it.

@ 4 | q | Inelastic collisions | cartsStick
A cart of mass \(2m\) moving with speed \(v\) collides with and sticks to a cart of mass \(m\) that is at rest, as shown. What fraction of the initial kinetic energy is dissipated in the collision?
* \(\dfrac{1}{3}\)
- \(\dfrac{2}{3}\)
- \(\dfrac{1}{2}\)
- \(\dfrac{1}{9}\)
= Momentum conservation gives a final speed of \(\dfrac{2}{3}v\). The final kinetic energy is \(\tfrac{1}{2}(3m)\left(\tfrac{2}{3}v\right)^2=\tfrac{2}{3}mv^2\), which is two thirds of the initial \(mv^2\), so one third is dissipated.

@ 4 | q | Elastic collisions | cartsElastic
A cart of mass \(m\) moving to the right with speed \(v\) collides elastically with a cart of mass \(3m\) that is at rest, as shown. What are the velocities of the carts after the collision?
* The lighter cart moves left at \(\dfrac{v}{2}\) and the heavier cart moves right at \(\dfrac{v}{2}\).
- The lighter cart stops and the heavier cart moves right at \(\dfrac{v}{3}\).
- Both carts move right at \(\dfrac{v}{4}\).
- The lighter cart moves left at \(v\) and the heavier cart moves right at \(\dfrac{2v}{3}\).
= These velocities conserve momentum, \(mv=-\tfrac{1}{2}mv+\tfrac{3}{2}mv\), and kinetic energy, \(\tfrac{1}{2}mv^2=\tfrac{1}{8}mv^2+\tfrac{3}{8}mv^2\). The other choices conserve momentum at most; the last one would create kinetic energy.

@ 4 | q | Evaluating collision data
A \(1\text{ kg}\) cart moving at \(4\text{ m/s}\) in the \(+x\) direction collides with a \(3\text{ kg}\) cart at rest on a level, frictionless track. Which of the following pairs of velocities after the collision is NOT physically possible?
* \(1\text{ kg}\) cart: \(-3\text{ m/s}\); \(3\text{ kg}\) cart: \(+\tfrac{7}{3}\text{ m/s}\)
- \(1\text{ kg}\) cart: \(-2\text{ m/s}\); \(3\text{ kg}\) cart: \(+2\text{ m/s}\)
- \(1\text{ kg}\) cart: \(+1\text{ m/s}\); \(3\text{ kg}\) cart: \(+1\text{ m/s}\)
- \(1\text{ kg}\) cart: \(-1\text{ m/s}\); \(3\text{ kg}\) cart: \(+\tfrac{5}{3}\text{ m/s}\)
= Every pair conserves the initial momentum of \(4\text{ kg}\cdot\text{m/s}\). The initial kinetic energy is \(8\text{ J}\). The pair with \(-3\text{ m/s}\) and \(\tfrac{7}{3}\text{ m/s}\) has about \(12.7\text{ J}\), more than the carts started with, which a collision cannot produce. The others have \(8\text{ J}\), \(2\text{ J}\), and about \(4.7\text{ J}\).

@ 4 | c | Center of mass
A firework shell is launched at an angle and explodes into many pieces at the top of its path. Air resistance is negligible. Which of the following describes the motion of the center of mass of the pieces after the explosion, before any piece lands?
* It continues along the same parabolic path the shell was following.
- It falls straight down from the point of the explosion.
- It remains at rest at the point of the explosion.
- It moves horizontally at constant velocity.
= The explosion involves only forces internal to the system of pieces, so it cannot change the motion of the center of mass. The only external force is still gravity, so the center of mass continues along the original parabola.

@ 4 | q | Explosions
A \(3\text{ kg}\) object at rest explodes into a \(1\text{ kg}\) piece and a \(2\text{ kg}\) piece that move apart in opposite directions. The explosion gives the pieces a total kinetic energy of \(60\text{ J}\). What is the kinetic energy of the \(1\text{ kg}\) piece?
* \(40\text{ J}\)
- \(20\text{ J}\)
- \(30\text{ J}\)
- \(60\text{ J}\)
= The pieces have momenta of equal magnitude \(p\). Because kinetic energy is \(\dfrac{p^2}{2m}\), the piece with half the mass has twice the kinetic energy, so the energy divides as \(40\text{ J}\) and \(20\text{ J}\).

@ 4 | q | Center of mass
A person of mass \(m\) stands at one end of a boat of mass \(3m\) and length \(L\) that is at rest in still water. The person walks to the other end of the boat. Neglecting any resistance from the water, how far does the boat move relative to the water?
* \(\dfrac{L}{4}\)
- \(\dfrac{L}{3}\)
- \(\dfrac{L}{2}\)
- \(\dfrac{3L}{4}\)
= With no external horizontal force, the center of mass of the person–boat system stays in place. If the boat moves a distance \(d\) one way, the person moves \(L-d\) the other way relative to the water, so \(m(L-d)=3md\) and \(d=\dfrac{L}{4}\).

@ 4 | q | Collisions in two dimensions
A car of mass \(2m\) traveling east at speed \(v\) collides with a car of mass \(m\) traveling north at speed \(2v\). The cars stick together. What is their speed immediately after the collision?
* \(\dfrac{2\sqrt{2}}{3}v\)
- \(\dfrac{4}{3}v\)
- \(\dfrac{2}{3}v\)
- \(\sqrt{2}\,v\)
= Each car has momentum of magnitude \(2mv\), one east and one north, so the total momentum has magnitude \(2\sqrt{2}\,mv\). Dividing by the combined mass \(3m\) gives \(\dfrac{2\sqrt{2}}{3}v\). Adding the momenta as if they were in the same direction gives \(\dfrac{4}{3}v\).

@ 4 | c | Impulse
A rubber ball and a lump of clay have the same mass and are thrown at the same speed at a door that is free to swing. The ball bounces back; the clay sticks. Which object is more likely to make the door swing, and why?
* The ball, because its momentum changes by a greater amount, so it delivers a greater impulse to the door.
- The clay, because it transfers all of its momentum to the door.
- The clay, because it stays in contact with the door for a longer time.
- Neither is more likely, because they strike the door with the same momentum.
= The clay's momentum changes from \(mv\) to nearly zero, while the ball's changes from \(mv\) to nearly \(-mv\), about twice as much. By Newton's third law the door receives an equal and opposite impulse, so the ball delivers roughly twice the impulse.

@ 4 | q | Collisions and energy
A bullet of mass \(m\) is fired horizontally into a block of mass \(M\) hanging at rest from long strings. The bullet becomes embedded, and the block swings upward to a maximum height \(h\) above its starting position. What was the speed of the bullet just before it hit the block?
* \(\dfrac{m+M}{m}\sqrt{2gh}\)
- \(\sqrt{\dfrac{2\left(m+M\right)gh}{m}}\)
- \(\sqrt{2gh}\)
- \(\dfrac{M}{m}\sqrt{2gh}\)
= After the collision, energy conservation gives the combined speed \(V=\sqrt{2gh}\). During the collision only momentum is conserved: \(mv=(m+M)V\). Applying energy conservation to the whole process ignores the energy dissipated as the bullet embeds.

@ 4 | c | Conservation and system choice
Two carts on a level, frictionless track are held together with a compressed spring between them and then released from rest. Which of the following is true as the spring expands, for the system named?
* For the system of both carts and the spring, the total momentum remains zero while the total kinetic energy increases.
- For the system of both carts and the spring, the total momentum and the total kinetic energy both remain zero.
- For a system consisting of one cart alone, the momentum of the system is constant.
- For the system of both carts and the spring, the total momentum increases as the carts speed up.
= No net external force acts on the two carts and spring together, so their total momentum stays at zero: the carts gain equal and opposite momenta. Kinetic energy increases as the spring's potential energy is converted. A single cart is acted on by the external spring force, so its momentum changes.

@ 4 | q | Impulse
A ball of mass \(m\) is dropped from rest from height \(h\), hits the floor, and rebounds to a maximum height of \(\dfrac{h}{4}\). What is the magnitude of the impulse exerted on the ball by the floor? Neglect the impulse of gravity during the brief contact.
* \(\dfrac{3}{2}m\sqrt{2gh}\)
- \(\dfrac{1}{2}m\sqrt{2gh}\)
- \(\dfrac{3}{4}m\sqrt{2gh}\)
- \(m\sqrt{2gh}\)
= The ball arrives with speed \(\sqrt{2gh}\) downward and leaves with speed \(\sqrt{2g(h/4)}=\tfrac{1}{2}\sqrt{2gh}\) upward. Because the direction reverses, the change in momentum is the sum of the two magnitudes, \(\dfrac{3}{2}m\sqrt{2gh}\).

@ 5 | q | Static equilibrium | seesaw
A uniform plank of length \(L\) and mass \(M\) rests on a pivot located \(\dfrac{L}{4}\) from its left end. A block of mass \(m\) placed at the left end keeps the plank balanced horizontally, as shown. What is \(m\) in terms of \(M\)?
* \(M\)
- \(\dfrac{M}{2}\)
- \(2M\)
- \(3M\)
= The plank's weight acts at its center, which is \(\dfrac{L}{4}\) to the right of the pivot. The block is \(\dfrac{L}{4}\) to the left. Equal lever arms require equal weights, so \(m=M\). Treating the plank's weight as acting at its right end gives an incorrect result.

@ 5 | q | Static equilibrium | sign
A uniform horizontal rod of mass \(M\) is attached to a wall by a hinge and is supported by a cable that makes a \(30^\circ\) angle with the rod, as shown. A sign of mass \(M\) hangs from the end of the rod where the cable is attached. What is the tension in the cable?
* \(3Mg\)
- \(2Mg\)
- \(\dfrac{3}{2}Mg\)
- \(4Mg\)
= Taking torques about the hinge for a rod of length \(L\): \(T\sin 30^\circ\,L=Mg\dfrac{L}{2}+MgL\). So \(\dfrac{T}{2}=\dfrac{3}{2}Mg\) and \(T=3Mg\). Only the vertical component of the tension produces torque about the hinge.

@ 5 | c | Static equilibrium | sign
A uniform horizontal rod is attached to a wall by a hinge and is supported by a cable that makes a \(30^\circ\) angle with the rod, as shown. A sign hangs from the end of the rod. What is the direction of the horizontal component of the force the hinge exerts on the rod?
* Away from the wall, because the cable pulls the rod toward the wall.
- Toward the wall, because the hinge holds the rod against the wall.
- It is zero, because all of the weights act vertically.
- It cannot be determined without knowing the masses of the rod and the sign.
= The cable pulls on the rod along its own length, up and toward the wall. Because the rod is in equilibrium, the horizontal forces must cancel, so the hinge must push the rod away from the wall, whatever the masses are.

@ 5 | q | Rotational kinematics | wt
The graph shows the angular velocity of a wheel as a function of time. Through what angle does the wheel turn between \(t=0\) and \(t=7\text{ s}\)?
* \(40\text{ rad}\)
- \(56\text{ rad}\)
- \(32\text{ rad}\)
- \(28\text{ rad}\)
= Angular displacement is the area under the graph: \(8+24+8=40\text{ rad}\). Multiplying the maximum angular velocity by the total time gives \(56\text{ rad}\), which ignores the intervals of speeding up and slowing down.

@ 5 | q | Newton's second law for rotation | wt
The graph shows the angular velocity of a wheel with rotational inertia \(0.50\text{ kg}\cdot\text{m}^2\). What is the magnitude of the net torque on the wheel during the interval from \(t=5\text{ s}\) to \(t=7\text{ s}\)?
* \(2.0\text{ N}\cdot\text{m}\)
- \(4.0\text{ N}\cdot\text{m}\)
- \(8.0\text{ N}\cdot\text{m}\)
- \(0.50\text{ N}\cdot\text{m}\)
= The angular acceleration is the slope of the graph, \(\dfrac{0-8}{7-5}=-4\text{ rad/s}^2\). The net torque is \(I\alpha\), with magnitude \(0.50(4)=2.0\text{ N}\cdot\text{m}\).

@ 5 | q | Newton's second law for rotation | pulley
A string wrapped around a uniform disk of mass \(M\) and radius \(R\) supports a hanging block of mass \(m\), as shown. The disk turns on a frictionless axle, and its rotational inertia is \(\tfrac{1}{2}MR^2\). The block is released from rest. What is the magnitude of the block's acceleration?
* \(\dfrac{2mg}{2m+M}\)
- \(g\)
- \(\dfrac{mg}{m+M}\)
- \(\dfrac{2mg}{m+2M}\)
= For the block, \(mg-T=ma\). For the disk, \(TR=\tfrac{1}{2}MR^2\alpha\) with \(a=R\alpha\), so \(T=\tfrac{1}{2}Ma\). Adding gives \(mg=\left(m+\tfrac{1}{2}M\right)a\), so \(a=\dfrac{2mg}{2m+M}\).

@ 5 | c | Newton's second law for rotation | pulley
A string wrapped around a uniform disk supports a hanging block, as shown, and the block is released from rest. The experiment is repeated with a disk of the same radius but greater mass. How do the block's acceleration and the tension in the string compare with the first trial?
* The acceleration is smaller and the tension is greater.
- The acceleration is smaller and the tension is smaller.
- The acceleration is the same and the tension is greater.
- Both are the same, because the same block exerts the same force.
= A disk with more rotational inertia has a smaller angular acceleration for a given torque, so the block's acceleration decreases. For the block, \(T=m(g-a)\), so a smaller acceleration means a tension closer to the block's weight.

@ 5 | q | Torque
A door of width \(L\) is hinged along one edge. In case 1, a force of magnitude \(F\) is applied at the edge farthest from the hinges, perpendicular to the door. In case 2, a force of magnitude \(2F\) is applied at the middle of the door at an angle of \(30^\circ\) to the plane of the door. What is the ratio of the torque about the hinges in case 1 to that in case 2?
* \(2:1\)
- \(1:1\)
- \(1:2\)
- \(4:1\)
= In case 1 the torque is \(FL\). In case 2 it is \(2F\left(\dfrac{L}{2}\right)\sin 30^\circ=\dfrac{FL}{2}\). Only the component of a force perpendicular to the door contributes to the torque.

@ 5 | q | Rotational inertia and torque
A uniform rod is free to rotate about an axis through its center. A force \(F\) applied perpendicular to the rod at one end gives it angular acceleration \(\alpha\). The axis is then moved to one end of the rod, and the same force is applied perpendicular to the rod at the other end. The rotational inertia of a rod is \(\tfrac{1}{12}ML^2\) about its center and \(\tfrac{1}{3}ML^2\) about one end. What is the new angular acceleration?
* \(\dfrac{\alpha}{2}\)
- \(\dfrac{\alpha}{4}\)
- \(2\alpha\)
- \(\alpha\)
= Moving the axis doubles the lever arm of the force, from \(\dfrac{L}{2}\) to \(L\), so the torque doubles. The rotational inertia becomes four times as large. The angular acceleration is \(\dfrac{\tau}{I}\), which changes by a factor of \(\dfrac{2}{4}=\dfrac{1}{2}\).

@ 5 | q | Static equilibrium
A uniform ladder leans against a frictionless vertical wall, making an angle \(\theta\) with a rough horizontal floor. What is the minimum coefficient of static friction between the ladder and the floor for which the ladder does not slip?
* \(\dfrac{1}{2\tan\theta}\)
- \(\dfrac{1}{\tan\theta}\)
- \(\dfrac{\tan\theta}{2}\)
- \(\tan\theta\)
= The floor's normal force equals the ladder's weight \(W\), and friction \(f\) balances the wall's normal force \(N_w\). Torques about the base give \(N_wL\sin\theta=W\dfrac{L}{2}\cos\theta\), so \(f=\dfrac{W}{2\tan\theta}\). Requiring \(f\le\mu_sW\) gives \(\mu_s\ge\dfrac{1}{2\tan\theta}\).

@ 5 | c | Torque and equilibrium
A heavier child and a lighter child sit on opposite sides of a seesaw, positioned so that it balances horizontally. Each child then moves the same distance \(d\) toward the pivot. What happens to the seesaw?
* The lighter child's side goes down, because the heavier child's torque decreases by a greater amount.
- It stays balanced, because both children moved the same distance.
- The heavier child's side goes down, because that child still exerts the greater force.
- It stays balanced, because the ratio of the children's weights has not changed.
= Each child's torque decreases by that child's weight multiplied by \(d\). The heavier child loses more torque, so the lighter child's torque is now the larger one. The seesaw would stay balanced only if each distance were reduced by the same fraction.

@ 5 | q | Rotational and translational dynamics
A string is wrapped around a uniform solid cylinder of mass \(m\), and the free end of the string is held fixed. The cylinder is released from rest and falls vertically as the string unwinds without slipping. The rotational inertia of the cylinder is \(\tfrac{1}{2}mR^2\). What is the tension in the string?
* \(\dfrac{1}{3}mg\)
- \(\dfrac{2}{3}mg\)
- \(\dfrac{1}{2}mg\)
- \(mg\)
= For translation, \(mg-T=ma\). For rotation about the center, \(TR=\tfrac{1}{2}mR^2\alpha\) with \(a=R\alpha\), so \(T=\tfrac{1}{2}ma\). Then \(mg=\tfrac{3}{2}ma\), so \(a=\tfrac{2}{3}g\) and \(T=\tfrac{1}{3}mg\).

@ 5 | q | Static equilibrium
A uniform horizontal beam that weighs \(40\text{ N}\) is supported by a scale under each end. A block that weighs \(80\text{ N}\) rests on the beam one fourth of the beam's length from the left end. What is the reading on the left scale?
* \(80\text{ N}\)
- \(60\text{ N}\)
- \(40\text{ N}\)
- \(100\text{ N}\)
= Taking torques about the right end for a beam of length \(L\): \(F_{\text{left}}L=40\left(\dfrac{L}{2}\right)+80\left(\dfrac{3L}{4}\right)\), so \(F_{\text{left}}=20+60=80\text{ N}\). The right scale reads the remaining \(40\text{ N}\).

@ 6 | q | Rolling and energy | inclineBall
A uniform solid sphere is released from rest at the top of a ramp of height \(h\) and rolls without slipping, as shown. The rotational inertia of the sphere is \(\tfrac{2}{5}MR^2\). What is the speed of the center of the sphere at the bottom of the ramp?
* \(\sqrt{\dfrac{10gh}{7}}\)
- \(\sqrt{2gh}\)
- \(\sqrt{gh}\)
- \(\sqrt{\dfrac{5gh}{7}}\)
= Energy conservation with \(\omega=\dfrac{v}{R}\) gives \(Mgh=\tfrac{1}{2}Mv^2+\tfrac{1}{2}\left(\tfrac{2}{5}MR^2\right)\dfrac{v^2}{R^2}=\tfrac{7}{10}Mv^2\). The speed is less than \(\sqrt{2gh}\) because part of the energy is rotational.

@ 6 | c | Rolling and energy | inclineBall
A hoop, a solid disk, and a solid sphere are released from rest at the top of the ramp shown and roll without slipping. The objects have different masses and radii. Which of the following correctly predicts the order in which they reach the bottom?
* Sphere, then disk, then hoop, regardless of their masses and radii
- Hoop, then disk, then sphere, regardless of their masses and radii
- The object with the smallest mass arrives first.
- They arrive together, because all objects fall with the same acceleration.
= For rolling without slipping, the acceleration depends only on how the mass is distributed, through the factor \(\dfrac{I}{MR^2}\): \(\tfrac{2}{5}\) for the sphere, \(\tfrac{1}{2}\) for the disk, and \(1\) for the hoop. The smaller that fraction, the smaller the share of energy that goes into rotation and the faster the object travels.

@ 6 | c | Rolling and energy
A ball rolls without slipping along a horizontal floor and then moves up a ramp. In trial 1 the ramp is rough enough that the ball rolls without slipping. In trial 2 the ramp is frictionless. How do the maximum heights the ball reaches compare?
* It rises higher in trial 1, because its rotational kinetic energy is also converted to potential energy.
- It rises higher in trial 2, because no energy is dissipated by friction.
- The heights are equal, because the ball has the same total kinetic energy at the bottom.
- It rises higher in trial 2, because friction opposes the motion in trial 1.
= On the frictionless ramp nothing exerts a torque on the ball, so it keeps spinning at the same rate and only its translational kinetic energy becomes potential energy. On the rough ramp static friction, which dissipates no energy, slows the rotation, so all of the kinetic energy is converted.

@ 6 | q | Conservation of angular momentum
A skater spinning on frictionless ice pulls her arms in, reducing her rotational inertia to one third of its original value. By what factor does her rotational kinetic energy change?
* It increases by a factor of 3.
- It stays the same.
- It increases by a factor of 9.
- It decreases by a factor of 3.
= Angular momentum \(I\omega\) is conserved, so her angular speed triples. Rotational kinetic energy is \(\tfrac{1}{2}I\omega^2=\dfrac{L^2}{2I}\), so reducing \(I\) to one third triples the energy. The skater does work in pulling her arms inward.

@ 6 | q | Conservation of angular momentum
A uniform disk of mass \(M\) and radius \(R\) spins freely with angular speed \(\omega_0\) about a vertical axle through its center. A thin ring of mass \(M\) and radius \(R\), initially not rotating, is dropped onto the disk so that their centers coincide, and friction brings them to a common angular speed. The rotational inertia of the disk is \(\tfrac{1}{2}MR^2\) and that of the ring is \(MR^2\). What is the final angular speed?
* \(\dfrac{\omega_0}{3}\)
- \(\dfrac{\omega_0}{2}\)
- \(\dfrac{2\omega_0}{3}\)
- \(\dfrac{\omega_0}{\sqrt{3}}\)
= Angular momentum is conserved: \(\tfrac{1}{2}MR^2\omega_0=\left(\tfrac{1}{2}MR^2+MR^2\right)\omega\), so \(\omega=\dfrac{\omega_0}{3}\). Assuming kinetic energy is conserved instead gives \(\dfrac{\omega_0}{\sqrt{3}}\), but the friction between the surfaces dissipates energy.

@ 6 | c | Conservation of angular momentum
A child stands at the rim of a merry-go-round that rotates freely on a frictionless axle. The child walks to the center. For the system of the child and the merry-go-round, which of the following describes the changes in angular momentum and rotational kinetic energy?
* The angular momentum stays the same and the kinetic energy increases.
- The angular momentum and the kinetic energy both stay the same.
- The angular momentum increases and the kinetic energy stays the same.
- The angular momentum stays the same and the kinetic energy decreases.
= No external torque acts, so the angular momentum is constant. The rotational inertia decreases, so the angular speed increases, and the kinetic energy \(\dfrac{L^2}{2I}\) increases. The additional energy comes from the work the child does in walking inward.

@ 6 | q | Angular momentum in orbits
A satellite moves in an elliptical orbit around a planet. Its speed is \(v\) at its closest point, a distance \(r\) from the planet's center. What is its speed at its farthest point, a distance \(4r\) from the planet's center?
* \(\dfrac{v}{4}\)
- \(\dfrac{v}{2}\)
- \(\dfrac{v}{16}\)
- \(4v\)
= The gravitational force points toward the planet and exerts no torque about it, so the satellite's angular momentum is conserved. At the closest and farthest points the velocity is perpendicular to the radius, so \(mvr=mv'(4r)\) and \(v'=\dfrac{v}{4}\).

@ 6 | q | Angular momentum in collisions | putty
A uniform rod of mass \(M\) and length \(L\) lies at rest on a frictionless horizontal surface and can rotate about a fixed pivot at one end. A lump of clay of mass \(m\) moving with speed \(v\) perpendicular to the rod strikes the free end and sticks, as shown. The rotational inertia of the rod about the pivot is \(\tfrac{1}{3}ML^2\). What is the angular speed of the rod just after the collision?
* \(\dfrac{3mv}{\left(M+3m\right)L}\)
- \(\dfrac{mv}{\left(M+m\right)L}\)
- \(\dfrac{3mv}{ML}\)
- \(\dfrac{v}{L}\)
= Angular momentum about the pivot is conserved: \(mvL=\left(\tfrac{1}{3}ML^2+mL^2\right)\omega\). Solving gives \(\omega=\dfrac{3mv}{(M+3m)L}\).

@ 6 | c | Angular momentum in collisions | putty
A lump of clay strikes and sticks to the free end of a rod that can rotate about a fixed pivot at its other end, as shown. For the system of the clay and the rod, which quantities are conserved during the collision?
* Angular momentum about the pivot only
- Linear momentum and angular momentum about the pivot
- Linear momentum only
- Linear momentum, angular momentum about the pivot, and kinetic energy
= The pivot exerts an external force on the rod during the collision, so linear momentum is not conserved. That force acts at the pivot, so it exerts no torque about the pivot and angular momentum about that point is conserved. Kinetic energy is dissipated because the clay sticks.

@ 6 | q | Rotational kinetic energy
A uniform solid sphere, with rotational inertia \(\tfrac{2}{5}MR^2\), rolls without slipping along a horizontal surface. What fraction of its total kinetic energy is rotational?
* \(\dfrac{2}{7}\)
- \(\dfrac{2}{5}\)
- \(\dfrac{1}{2}\)
- \(\dfrac{5}{7}\)
= With \(\omega=\dfrac{v}{R}\), the rotational kinetic energy is \(\tfrac{1}{2}\left(\tfrac{2}{5}MR^2\right)\dfrac{v^2}{R^2}=\tfrac{1}{5}Mv^2\) and the translational kinetic energy is \(\tfrac{1}{2}Mv^2\). The rotational fraction is \(\dfrac{1/5}{7/10}=\dfrac{2}{7}\).

@ 6 | q | Work and rotational kinetic energy
A flywheel with rotational inertia \(3.0\text{ kg}\cdot\text{m}^2\) starts from rest and is acted on by a constant net torque of \(6.0\text{ N}\cdot\text{m}\) as it turns through \(25\text{ rad}\). What is its final angular speed?
* \(10\text{ rad/s}\)
- \(50\text{ rad/s}\)
- \(7.1\text{ rad/s}\)
- \(100\text{ rad/s}\)
= The work done by the torque is \(\tau\,\Delta\theta=150\text{ J}\). Setting this equal to \(\tfrac{1}{2}I\omega^2\) gives \(\omega^2=100\), so \(\omega=10\text{ rad/s}\).

@ 6 | q | Angular impulse
A wheel is initially at rest on a frictionless axle. A net torque of \(4.0\text{ N}\cdot\text{m}\) acts on it for \(3.0\text{ s}\), followed immediately by a net torque of \(2.0\text{ N}\cdot\text{m}\) in the opposite direction for \(2.0\text{ s}\). What is the magnitude of the wheel's angular momentum at the end of the \(5.0\text{ s}\)?
* \(8.0\text{ kg}\cdot\text{m}^2\text{/s}\)
- \(16\text{ kg}\cdot\text{m}^2\text{/s}\)
- \(12\text{ kg}\cdot\text{m}^2\text{/s}\)
- \(10\text{ kg}\cdot\text{m}^2\text{/s}\)
= The change in angular momentum equals the angular impulse, the net torque multiplied by the time it acts: \(4.0(3.0)-2.0(2.0)=8.0\text{ kg}\cdot\text{m}^2\text{/s}\). The rotational inertia is not needed.

@ 7 | q | Simple harmonic motion graphs | shm
The graph shows the position of a block oscillating on a spring as a function of time. What is the maximum speed of the block?
* \(0.63\text{ m/s}\)
- \(0.40\text{ m/s}\)
- \(0.20\text{ m/s}\)
- \(1.3\text{ m/s}\)
= The amplitude is \(A=0.20\text{ m}\) and the period is \(T=2.0\text{ s}\), so \(\omega=\dfrac{2\pi}{T}=\pi\text{ rad/s}\). The maximum speed is \(A\omega=0.20\pi\approx 0.63\text{ m/s}\). The average speed over a cycle is \(\dfrac{4A}{T}=0.40\text{ m/s}\).

@ 7 | c | Simple harmonic motion graphs | shm
The graph shows the position of a block oscillating on a spring as a function of time. Which of the following describes the block's velocity and acceleration at \(t=0.5\text{ s}\)?
* The velocity has its maximum magnitude and is negative; the acceleration is zero.
- The velocity is zero; the acceleration has its maximum magnitude and is negative.
- The velocity and the acceleration are both zero.
- The velocity has its maximum magnitude and is positive; the acceleration is zero.
= At \(t=0.5\text{ s}\) the block passes through equilibrium, where the graph is steepest and sloping downward, so the velocity is most negative. The restoring force, and therefore the acceleration, is zero at equilibrium.

@ 7 | q | Period of a spring–block oscillator | springBlock
A block of mass \(m\) attached to a spring of spring constant \(k\) oscillates on a frictionless surface with period \(T\), as shown. The block is replaced with one of mass \(2m\), and the spring is replaced with one of spring constant \(\dfrac{k}{2}\). What is the new period?
* \(2T\)
- \(T\)
- \(\sqrt{2}\,T\)
- \(4T\)
= The period is \(2\pi\sqrt{\dfrac{m}{k}}\). Doubling the mass and halving the spring constant multiplies \(\dfrac{m}{k}\) by 4, so the period doubles.

@ 7 | c | Energy in simple harmonic motion | springBlock
A block on a spring oscillates between \(x=-A\) and \(x=+A\) on a frictionless surface, as shown. The block is then set oscillating with amplitude \(2A\). How do the period, the maximum speed, and the total mechanical energy change?
* The period is unchanged, the maximum speed doubles, and the energy quadruples.
- The period doubles, the maximum speed is unchanged, and the energy doubles.
- The period is unchanged, the maximum speed doubles, and the energy doubles.
- The period doubles, the maximum speed doubles, and the energy quadruples.
= The period of a spring–block oscillator depends only on mass and spring constant, not on amplitude. The total energy is \(\tfrac{1}{2}kA^2\), so it quadruples, and since that equals \(\tfrac{1}{2}mv_{\max}^2\), the maximum speed doubles.

@ 7 | q | Energy in simple harmonic motion | springBlock
A block on a spring oscillates between \(x=-A\) and \(x=+A\) on a frictionless surface, as shown, and its maximum speed is \(v_{\max}\). What is the speed of the block when it is at \(x=\dfrac{A}{2}\)?
* \(\dfrac{\sqrt{3}}{2}v_{\max}\)
- \(\dfrac{1}{2}v_{\max}\)
- \(\dfrac{3}{4}v_{\max}\)
- \(\dfrac{1}{\sqrt{2}}v_{\max}\)
= At \(x=\dfrac{A}{2}\) the potential energy is \(\tfrac{1}{2}k\left(\tfrac{A}{2}\right)^2\), one fourth of the total, so the kinetic energy is three fourths of its maximum. Speed depends on the square root of kinetic energy, giving \(\dfrac{\sqrt{3}}{2}v_{\max}\).

@ 7 | q | Period of a pendulum | pendulum
A simple pendulum of length \(L\) has period \(T\) on Earth, as shown. A second pendulum of length \(4L\) is taken to a planet where the gravitational field strength is \(4g\). What is the period of the second pendulum for small oscillations?
* \(T\)
- \(2T\)
- \(4T\)
- \(\dfrac{T}{2}\)
= The period is \(2\pi\sqrt{\dfrac{L}{g}}\). Multiplying both the length and the field strength by 4 leaves \(\dfrac{L}{g}\) unchanged, so the period is the same.

@ 7 | c | Period of a pendulum | pendulum
A simple pendulum swings with a small amplitude, as shown. The bob is replaced with one of twice the mass, and the pendulum is released from twice the original angle, still a small angle. How does the period compare with the original period?
* It is the same.
- It is twice as long.
- It is longer by a factor of \(\sqrt{2}\).
- It is half as long.
= For small angles the period of a simple pendulum depends only on its length and the gravitational field strength. A greater mass increases the restoring force and the inertia in the same proportion, and a larger small amplitude means a greater distance covered at a proportionally greater speed.

@ 7 | q | Vertical spring oscillators
When a block is hung from a vertical spring, the spring stretches a distance \(d\) before the block hangs at rest. The block is then pulled down slightly and released. What is the period of its oscillation?
* \(2\pi\sqrt{\dfrac{d}{g}}\)
- \(2\pi\sqrt{\dfrac{g}{d}}\)
- \(2\pi\sqrt{\dfrac{2d}{g}}\)
- It cannot be determined without the mass of the block.
= At equilibrium \(kd=mg\), so \(\dfrac{m}{k}=\dfrac{d}{g}\). Substituting into \(T=2\pi\sqrt{\dfrac{m}{k}}\) gives \(2\pi\sqrt{\dfrac{d}{g}}\); the mass and spring constant are not needed separately.

@ 7 | q | Collisions and simple harmonic motion
A block of mass \(m\) on a spring oscillates with amplitude \(A\) on a frictionless horizontal surface. At the instant the block passes through its equilibrium position, a lump of clay of mass \(m\) is dropped vertically onto the block and sticks. What is the amplitude of the oscillation afterward?
* \(\dfrac{A}{\sqrt{2}}\)
- \(\dfrac{A}{2}\)
- \(A\)
- \(\sqrt{2}\,A\)
= Horizontal momentum is conserved as the clay lands, so the speed at equilibrium is halved while the mass doubles. The kinetic energy \(\tfrac{1}{2}(2m)\left(\tfrac{v}{2}\right)^2\) is half its previous value. Since the total energy is \(\tfrac{1}{2}kA^2\), halving the energy reduces the amplitude by a factor of \(\sqrt{2}\).

@ 7 | q | Energy in simple harmonic motion
A \(0.50\text{ kg}\) block on a spring with spring constant \(200\text{ N/m}\) oscillates on a frictionless horizontal surface with amplitude \(0.10\text{ m}\). What is the speed of the block when it is \(0.060\text{ m}\) from equilibrium?
* \(1.6\text{ m/s}\)
- \(2.0\text{ m/s}\)
- \(1.2\text{ m/s}\)
- \(0.80\text{ m/s}\)
= The total energy is \(\tfrac{1}{2}(200)(0.10)^2=1.0\text{ J}\). At \(0.060\text{ m}\) the potential energy is \(\tfrac{1}{2}(200)(0.060)^2=0.36\text{ J}\), leaving \(0.64\text{ J}\) of kinetic energy, so \(v=\sqrt{\dfrac{2(0.64)}{0.50}}=1.6\text{ m/s}\). The maximum speed is \(2.0\text{ m/s}\).

@ 7 | c | Period in an accelerating frame
A simple pendulum and a block on a vertical spring both oscillate inside an elevator. The elevator begins to accelerate upward at a constant rate. How do the periods of the two oscillators change?
* The pendulum's period decreases and the spring–block period is unchanged.
- Both periods decrease.
- The pendulum's period is unchanged and the spring–block period decreases.
- Both periods are unchanged.
= In the upward-accelerating elevator, objects behave as if the gravitational field strength were \(g+a\). The pendulum's period \(2\pi\sqrt{\dfrac{L}{g+a}}\) decreases. The spring–block period \(2\pi\sqrt{\dfrac{m}{k}}\) does not depend on \(g\); only the equilibrium position shifts.

@ 7 | q | Combinations of springs
A block is attached to two identical springs. When the springs are connected side by side (in parallel), the block oscillates with period \(T_p\). When the springs are connected end to end (in series), it oscillates with period \(T_s\). What is \(\dfrac{T_s}{T_p}\)?
* \(2\)
- \(\sqrt{2}\)
- \(4\)
- \(\dfrac{1}{2}\)
= In parallel the effective spring constant is \(2k\); in series it is \(\dfrac{k}{2}\). The period is proportional to \(\dfrac{1}{\sqrt{k_{\text{eff}}}}\), so \(\dfrac{T_s}{T_p}=\sqrt{\dfrac{2k}{k/2}}=2\).

@ 8 | q | Bernoulli's equation | pipe
Water of density \(\rho\) flows through the horizontal pipe shown. The cross-sectional area at section 1 is four times the area at section 2, and the speed of the water at section 1 is \(v\). What is the pressure at section 1 minus the pressure at section 2?
* \(\dfrac{15}{2}\rho v^2\)
- \(\dfrac{3}{2}\rho v^2\)
- \(8\rho v^2\)
- \(-\dfrac{15}{2}\rho v^2\)
= Continuity gives a speed of \(4v\) at section 2. Bernoulli's equation for a horizontal pipe gives \(P_1-P_2=\tfrac{1}{2}\rho\left[(4v)^2-v^2\right]=\dfrac{15}{2}\rho v^2\). The pressure is higher where the water moves more slowly.

@ 8 | c | Bernoulli's equation | pipe
Water flows steadily from section 1 to section 2 of the horizontal pipe shown. Which of the following correctly explains how the pressure in the water changes?
* The pressure is lower at section 2, because a net force toward section 2 is needed to speed the water up as it enters the narrow section.
- The pressure is higher at section 2, because the water is squeezed into a smaller space.
- The pressure is the same at both sections, because the pipe is horizontal.
- The pressure is higher at section 2, because the water there is moving faster and pushes harder on the walls.
= The water must speed up to pass through the narrow section at the same volume flow rate. An element of water entering the constriction accelerates forward, so the pressure behind it must be greater than the pressure ahead of it.

@ 8 | c | Torricelli's theorem | tank
Water streams from a small hole in the side of a large open tank filled to height \(H\), as shown. At what depth \(h\) below the water surface should the hole be made so that the stream lands as far from the tank as possible?
* \(h=\dfrac{H}{2}\)
- As close to the bottom of the tank as possible
- As close to the water surface as possible
- \(h=\dfrac{H}{4}\)
= The water leaves with speed \(\sqrt{2gh}\) and falls for a time \(\sqrt{\dfrac{2(H-h)}{g}}\), so it lands a distance \(2\sqrt{h(H-h)}\) away. That product is greatest when \(h=\dfrac{H}{2}\). A lower hole gives a faster stream but too little time to fall.

@ 8 | q | Torricelli's theorem | tank
Water streams from a small hole in the side of a large open tank, as shown. The hole is \(0.80\text{ m}\) below the water surface. Using \(g=10\text{ m/s}^2\), what is the speed of the water as it leaves the hole?
* \(4.0\text{ m/s}\)
- \(8.0\text{ m/s}\)
- \(2.8\text{ m/s}\)
- \(16\text{ m/s}\)
= Applying Bernoulli's equation between the surface, where the water is nearly at rest, and the hole, both at atmospheric pressure, gives \(v=\sqrt{2gh}=\sqrt{2(10)(0.80)}=4.0\text{ m/s}\).

@ 8 | q | Buoyancy | float
A block floats in water of density \(1000\text{ kg/m}^3\) with three fourths of its volume submerged, as shown. The block is then placed in oil of density \(900\text{ kg/m}^3\). What fraction of the block's volume is submerged in the oil?
* \(\dfrac{5}{6}\)
- \(\dfrac{3}{4}\)
- \(\dfrac{27}{40}\)
- \(\dfrac{9}{10}\)
= A floating object displaces its own weight of fluid, so the submerged fraction equals the ratio of the object's density to the fluid's density. The block's density is \(750\text{ kg/m}^3\), so in oil the fraction is \(\dfrac{750}{900}=\dfrac{5}{6}\).

@ 8 | c | Buoyancy
A boat carrying a heavy steel anchor floats in a small pond. The anchor is thrown overboard and sinks to the bottom. What happens to the water level of the pond?
* It falls, because the sunken anchor displaces less water than it did while it was in the boat.
- It rises, because the anchor now displaces water directly.
- It stays the same, because the total mass in the pond has not changed.
- It rises, because the boat floats higher after the anchor is removed.
= While in the boat, the anchor causes the boat to displace a volume of water equal in weight to the anchor, which is much larger than the anchor's own volume because steel is denser than water. On the bottom it displaces only its own volume, so the total displaced volume decreases.

@ 8 | q | Buoyancy
An object weighs \(30\text{ N}\) in air. When it is completely submerged in water of density \(1000\text{ kg/m}^3\) and suspended from a spring scale, the scale reads \(20\text{ N}\). What is the density of the object?
* \(3000\text{ kg/m}^3\)
- \(1500\text{ kg/m}^3\)
- \(2000\text{ kg/m}^3\)
- \(667\text{ kg/m}^3\)
= The buoyant force is \(30-20=10\text{ N}\), which is the weight of a volume of water equal to the object's volume. The object weighs three times as much as that water, so it is three times as dense.

@ 8 | c | Fluid pressure
Three open containers with different shapes have bases of equal area and are filled with water to the same height. One has vertical sides, one widens toward the top, and one narrows toward the top. How do the forces exerted by the water on the bases of the containers compare?
* They are equal, because the pressure at the base depends only on the depth of the water.
- The force is greatest in the container that widens, because it holds the most water.
- The force is greatest in the container that narrows, because the water is compressed.
- The force equals the weight of the water in each container, so all three are different.
= The gauge pressure at depth \(h\) is \(\rho gh\) whatever the shape of the container, and the bases have equal areas, so the forces are equal. In the containers with slanted sides, the walls exert vertical forces on the water that account for the difference between that force and the water's weight.

@ 8 | q | Pascal's principle
In a hydraulic lift, the area of the large piston is 20 times the area of the small piston. The fluid is incompressible. How far must the small piston be pushed down to raise a car on the large piston by \(0.10\text{ m}\)?
* \(2.0\text{ m}\)
- \(0.0050\text{ m}\)
- \(0.10\text{ m}\)
- \(0.45\text{ m}\)
= The volume of fluid pushed out of the small cylinder equals the volume that enters the large one, so \(A_sd_s=A_Ld_L\) and \(d_s=20(0.10)=2.0\text{ m}\). The force is multiplied by 20, but the work done is the same on both sides.

@ 8 | q | Fluid pressure
A diver is \(20\text{ m}\) below the surface of a lake. The density of the water is \(1000\text{ kg/m}^3\), atmospheric pressure is \(1.0\times 10^5\text{ Pa}\), and \(g=10\text{ m/s}^2\). What is the absolute pressure at the diver's depth?
* \(3.0\times 10^5\text{ Pa}\)
- \(2.0\times 10^5\text{ Pa}\)
- \(1.0\times 10^5\text{ Pa}\)
- \(2.0\times 10^6\text{ Pa}\)
= The gauge pressure is \(\rho gh=1000(10)(20)=2.0\times 10^5\text{ Pa}\). The absolute pressure adds atmospheric pressure, for \(3.0\times 10^5\text{ Pa}\).

@ 8 | q | Buoyancy and dynamics
A block of wood with density \(500\text{ kg/m}^3\) is held at rest by a string attached to the bottom of a tank of water, with the block completely submerged. The density of water is \(1000\text{ kg/m}^3\). The string is cut. Neglecting drag, what is the acceleration of the block immediately afterward?
* \(g\), upward
- \(\dfrac{g}{2}\), upward
- \(2g\), upward
- Zero, because the block was in equilibrium
= The buoyant force is \(\rho_{\text{water}}Vg\), twice the block's weight \(\rho_{\text{wood}}Vg\). The net force is therefore equal to the weight and directed upward, giving an acceleration of \(g\) upward. Before the cut, the string supplied a downward force equal to the block's weight.

@ 8 | q | Continuity
Water flows at \(2.0\text{ m/s}\) through a hose of radius \(1.0\text{ cm}\) and leaves through a nozzle of radius \(0.25\text{ cm}\). What is the speed of the water as it leaves the nozzle?
* \(32\text{ m/s}\)
- \(8.0\text{ m/s}\)
- \(16\text{ m/s}\)
- \(0.13\text{ m/s}\)
= The volume flow rate \(Av\) is constant. The radius decreases by a factor of 4, so the area decreases by a factor of 16 and the speed increases by a factor of 16, to \(32\text{ m/s}\).
`;

module.exports = { source, figures };
