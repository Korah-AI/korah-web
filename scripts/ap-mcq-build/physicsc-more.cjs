// Second batch for the AP Physics C: Mechanics bank (100 questions), bringing the bank
// to 200 split evenly across the seven units. Same block format as physicsc.cjs.
const { graph } = require('./figures.cjs');
const { draw, spring } = require('./diagram.cjs');
const p1 = require('./physics1.cjs').figures, p1more = require('./physics1-more2.cjs').figures, pc = require('./physicsc.cjs').figures;

const PINK = '#ec4899';
const figures = {
  incPulley: p1more.incPulley, conical: pc.conical, rodPivot: pc.rodPivot, inclineBall: p1.inclineBall,
  vtc: graph({ x: [0, 3], y: [-10, 4], ystep: 2, xlabel: 't (s)', ylabel: 'v (m/s)', curves: [{ fn: t => 6 * t - 3 * t * t, from: 0, to: 3 }],
    alt: 'Velocity versus time graph of v = 6t − 3t² for 0 ≤ t ≤ 3 s: a downward parabola that starts at 0, peaks at 3 m/s at t = 1 s, crosses zero at t = 2 s, and reaches −9 m/s at t = 3 s' }),
  Fxc: graph({ x: [0, 4.5], y: [0, 5], xlabel: 'x (m)', ylabel: 'F (N)', curves: [{ fn: x => 4 * x - x * x, from: 0, to: 4 }],
    alt: 'Net force versus position graph of F = 4x − x², in newtons: a downward parabola that is zero at x = 0, peaks at 4 N at x = 2 m, and returns to zero at x = 4 m' }),
  Ur: graph({ x: [0.5, 3], y: [-5, 4], xstep: 0.5, xlabel: '', ylabel: '', xtitle: 'Separation r (×10⁻¹⁰ m)', ytitle: 'U (eV)', w: 360,
    curves: [{ fn: r => 4 * (Math.pow(1 / r, 12) - 2 * Math.pow(1 / r, 6)), from: 0.87, to: 3 }, { pts: [[0.5, -2], [3, -2]], dash: true, color: PINK }], notes: [{ x: 2.55, y: -1.6, text: 'E' }],
    alt: 'Potential energy of two atoms versus their separation r. The energy is large and positive at small r, falls to a minimum of −4 eV at r = 1.0 × 10⁻¹⁰ m, and rises toward zero at large r. A dashed line marks a total energy E of −2 eV, which meets the curve near r = 0.92 and r = 1.23 × 10⁻¹⁰ m' }),
  chain: draw(340, 200, 'A uniform chain of length L lies on a frictionless horizontal table with one third of its length hanging over the edge', [
    ['rect', 30, 64, 220, 14, { fill: true }], ['line', 50, 78, 50, 190], ['line', 230, 78, 230, 190], ['hatch', 20, 190, 320, 190],
    ['path', 'M90 60 H250 V132', { width: 4, color: PINK }], ['line', 275, 60, 275, 132, { dash: true }], ['text', 292, 100, 'L/3'], ['text', 170, 50, '2L/3'],
  ]),
  ballistic: draw(340, 200, 'A bullet of mass m moves horizontally toward a block of mass M hanging at rest from two long strings. After the bullet embeds, the block swings up to a height h', [
    ['hatch', 270, 16, 110, 16], ['line', 170, 16, 150, 130], ['line', 210, 16, 230, 130], ['rect', 150, 130, 80, 40, { fill: true }], ['text', 190, 155, 'M'],
    ['rect', 50, 146, 20, 8, { fill: 'currentColor' }], ['arrow', 74, 150, 120, 150], ['text', 60, 138, 'm'], ['text', 97, 140, 'v'],
    ['path', 'M232 150 Q262 140 288 110', { dash: true }], ['line', 300, 110, 300, 150, { dash: true }], ['text', 312, 134, 'h'],
  ]),
  wedgeFree: draw(340, 190, 'A block of mass m rests at the top of a wedge of mass M. The wedge sits on a frictionless floor, and the wedge surface is also frictionless', [
    ['hatch', 20, 170, 320, 170], ['poly', [[60, 170], [280, 170], [280, 70]], { fill: true }], ['text', 220, 152, 'M'],
    ['rect', 248, 62, 30, 20, { fill: true, rotate: [-24.4, 263, 84] }], ['text', 258, 72, 'm'], ['text', 170, 186, 'frictionless floor', { italic: false, size: 11 }],
  ]),
  yoyo: draw(340, 200, 'A spool with outer radius R and inner hub radius r rests on a horizontal surface. A string wrapped around the hub leaves from the bottom of the hub and is pulled horizontally to the right with force F', [
    ['hatch', 20, 180, 320, 180], ['circle', 140, 100, 80, { fill: true }], ['circle', 140, 100, 32], ['circle', 140, 100, 2.5, { fill: 'currentColor' }],
    ['line', 140, 132, 270, 132], ['arrow', 270, 132, 312, 132], ['text', 298, 124, 'F'], ['line', 140, 100, 196, 44, { dash: true }], ['text', 176, 64, 'R'], ['line', 140, 100, 112, 84, { dash: true }], ['text', 118, 80, 'r'],
  ]),
  ladder: draw(340, 210, 'A uniform ladder of length L leans against a frictionless vertical wall, making an angle theta with a rough floor. A person stands three quarters of the way up the ladder', [
    ['hatch', 260, 190, 260, 20], ['hatch', 30, 190, 260, 190], ['line', 110, 190, 260, 50, { width: 5 }], ['text', 150, 182, 'θ'],
    ['circle', 222, 85, 7, { fill: 'currentColor' }], ['text', 196, 76, 'person'], ['text', 174, 110, 'L'],
  ]),
  doubleSpring: draw(340, 140, 'A block of mass m on a frictionless surface is attached to two springs, with spring constants k1 and k2, whose other ends are fixed to walls on either side', [
    ['hatch', 30, 40, 30, 110], ['hatch', 310, 110, 310, 40], ['hatch', 30, 110, 310, 110], spring(30, 145, 88), ['rect', 145, 66, 50, 44, { fill: true }], ['text', 170, 93, 'm'], spring(195, 310, 88),
    ['text', 88, 70, 'k₁'], ['text', 252, 70, 'k₂'],
  ]),
  stackTop: draw(340, 180, 'A small block of mass m rests on a larger block of mass M on a frictionless floor. A horizontal force F pulls the small block to the right', [
    ['hatch', 20, 150, 320, 150], ['rect', 80, 110, 160, 40, { fill: true }], ['text', 160, 135, 'M'], ['rect', 130, 78, 56, 32, { fill: true }], ['text', 158, 99, 'm'],
    ['arrow', 186, 94, 246, 94], ['text', 220, 84, 'F'],
  ]),
};

const source = String.raw`
@ 1 | q | Displacement from a velocity function | vtc
A particle moves along a line with the velocity \(v(t)=6t-3t^2\), in meters per second, shown in the graph. What is its displacement from \(t=0\) to \(t=3\text{ s}\)?
* \(0\)
- \(8\text{ m}\)
- \(4\text{ m}\)
- \(-9\text{ m}\)
= The displacement is \(\displaystyle\int_0^3\left(6t-3t^2\right)dt=\left[3t^2-t^3\right]_0^3=27-27=0\). The particle travels forward and then returns to its starting point. The value \(-9\text{ m/s}\) is the velocity at \(t=3\text{ s}\), not a displacement.

@ 1 | q | Distance from a velocity function | vtc
A particle moves along a line with the velocity \(v(t)=6t-3t^2\), in meters per second, shown in the graph. What total distance does it travel from \(t=0\) to \(t=3\text{ s}\)?
* \(8\text{ m}\)
- \(0\)
- \(4\text{ m}\)
- \(9\text{ m}\)
= The velocity changes sign at \(t=2\text{ s}\). From \(0\) to \(2\text{ s}\) the particle moves \(\left[3t^2-t^3\right]_0^2=4\text{ m}\) forward, and from \(2\) to \(3\text{ s}\) it moves \(\left|0-4\right|=4\text{ m}\) back. The distance is the integral of the speed, \(8\text{ m}\).

@ 1 | q | Acceleration from a velocity function | vtc
A particle moves along a line with the velocity \(v(t)=6t-3t^2\), in meters per second, shown in the graph. What is its acceleration at \(t=2\text{ s}\), the instant its velocity is zero?
* \(-6\text{ m/s}^2\)
- \(0\)
- \(6\text{ m/s}^2\)
- \(-12\text{ m/s}^2\)
= \(a=\dfrac{dv}{dt}=6-6t\), which is \(-6\text{ m/s}^2\) at \(t=2\text{ s}\). A particle can be momentarily at rest while accelerating; that is how it reverses direction.

@ 1 | c | Speeding up and slowing down | vtc
A particle moves along a line with the velocity \(v(t)=6t-3t^2\) shown in the graph. During which time intervals is the particle's speed increasing?
* \(0<t<1\text{ s}\) and \(2\text{ s}<t<3\text{ s}\)
- \(0<t<1\text{ s}\) only
- \(1\text{ s}<t<2\text{ s}\) only
- \(0<t<2\text{ s}\)
= Speed increases when velocity and acceleration have the same sign. With \(a=6-6t\): both are positive for \(0<t<1\text{ s}\), the signs differ for \(1<t<2\text{ s}\), and both are negative for \(2<t<3\text{ s}\), when the particle speeds up moving backward.

@ 1 | q | Acceleration from velocity as a function of position
A particle's velocity depends on its position according to \(v=3\sqrt{x}\), with \(v\) in meters per second and \(x\) in meters. What is the particle's acceleration?
* \(4.5\text{ m/s}^2\), constant
- \(3\text{ m/s}^2\), constant
- \(\dfrac{1.5}{\sqrt{x}}\text{ m/s}^2\)
- \(9x\text{ m/s}^2\)
= \(a=v\dfrac{dv}{dx}=3\sqrt{x}\cdot\dfrac{3}{2\sqrt{x}}=4.5\text{ m/s}^2\). Equivalently, \(v^2=9x\) has the form \(v^2=2ax\) for constant acceleration from rest. The expression \(\dfrac{dv}{dx}\) alone is not the acceleration.

@ 1 | q | Projectile on an incline
A ball is thrown horizontally at \(10\text{ m/s}\) from the top of a long slope inclined at \(45^\circ\) below the horizontal. Using \(g=10\text{ m/s}^2\) and neglecting air resistance, how long after it is thrown does the ball land on the slope?
* \(2.0\text{ s}\)
- \(1.0\text{ s}\)
- \(1.4\text{ s}\)
- \(4.0\text{ s}\)
= The ball lands where its vertical drop equals its horizontal distance, because \(\tan 45^\circ=1\): \(\tfrac{1}{2}gt^2=v_0t\), so \(t=\dfrac{2v_0}{g}=2.0\text{ s}\).

@ 1 | q | Relative velocity
Rain falls vertically at \(8.0\text{ m/s}\) relative to the ground. A car drives horizontally at \(6.0\text{ m/s}\). What is the speed of the rain relative to the car?
* \(10\text{ m/s}\)
- \(14\text{ m/s}\)
- \(2.0\text{ m/s}\)
- \(8.0\text{ m/s}\)
= The rain's velocity relative to the car is \(\vec v_{\text{rain}}-\vec v_{\text{car}}\), which has components \(6.0\text{ m/s}\) backward and \(8.0\text{ m/s}\) downward. Its magnitude is \(\sqrt{6.0^2+8.0^2}=10\text{ m/s}\), so the rain appears to slant toward the car's windshield.

@ 1 | q | Average speed
A particle moves along a line with velocity \(v(t)=4-2t\), in meters per second. What is its average speed from \(t=0\) to \(t=4\text{ s}\)?
* \(2\text{ m/s}\)
- \(0\)
- \(4\text{ m/s}\)
- \(1\text{ m/s}\)
= The velocity changes sign at \(t=2\text{ s}\). The particle moves \(4\text{ m}\) forward and then \(4\text{ m}\) back, so the distance is \(8\text{ m}\) and the average speed is \(\dfrac{8}{4}=2\text{ m/s}\). The average velocity is zero because the displacement is zero.

@ 1 | q | Projectile motion
A projectile is launched from level ground at \(45^\circ\) above the horizontal. Air resistance is negligible. What is the ratio of its maximum height to its horizontal range?
* \(\dfrac{1}{4}\)
- \(\dfrac{1}{2}\)
- \(1\)
- \(\dfrac{1}{8}\)
= The maximum height is \(\dfrac{v_0^2\sin^2 45^\circ}{2g}=\dfrac{v_0^2}{4g}\) and the range is \(\dfrac{v_0^2\sin 90^\circ}{g}=\dfrac{v_0^2}{g}\). Their ratio is \(\dfrac{1}{4}\) for every launch speed.

@ 1 | c | Position and velocity graphs
The graph of a particle's position as a function of time is a parabola opening upward with its vertex at \(t=2\text{ s}\). Which describes the graph of its velocity as a function of time?
* A straight line with positive slope that crosses zero at \(t=2\text{ s}\)
- A straight line with negative slope that crosses zero at \(t=2\text{ s}\)
- A horizontal line, because the acceleration is constant
- A parabola with its vertex at \(t=2\text{ s}\)
= The derivative of a quadratic is linear. The position graph has zero slope at its vertex, so the velocity is zero at \(t=2\text{ s}\), and a parabola opening upward has an increasing slope, so the velocity line rises.

@ 1 | c | Velocity perpendicular to acceleration
A particle moves so that its velocity is perpendicular to its acceleration at every instant. Which of the following must be true?
* Its speed is constant.
- Its velocity is constant.
- It moves in a straight line.
- Its acceleration is zero.
= \(\dfrac{d}{dt}\left(\vec v\cdot\vec v\right)=2\,\vec v\cdot\vec a=0\), so the square of the speed does not change. The direction of motion can change, as in uniform circular motion, so the velocity need not be constant.

@ 1 | c | Average velocity
For which kind of motion along a line is the average velocity over any time interval always equal to the mean of the initial and final velocities?
* Motion with constant acceleration
- Any motion in which the velocity is always positive
- Motion with an acceleration that increases linearly with time
- Motion in which the object starts from rest
= With constant acceleration, velocity is a linear function of time, and the average of a linear function over an interval equals the average of its end values. For a curved velocity graph, the area under it generally differs from that of the trapezoid through its endpoints.

@ 1 | c | Projectile motion
Two projectiles are launched from level ground with the same speed, one at \(30^\circ\) and one at \(60^\circ\) above the horizontal. Air resistance is negligible. How do their ranges and maximum heights compare?
* Their ranges are equal, and the \(60^\circ\) projectile rises three times as high.
- Their ranges and maximum heights are both equal.
- The \(60^\circ\) projectile has the greater range and rises three times as high.
- The \(30^\circ\) projectile has the greater range, and their heights are equal.
= The range is proportional to \(\sin 2\theta\), which is the same for \(30^\circ\) and \(60^\circ\). The maximum height is proportional to \(\sin^2\theta\): \(\tfrac{3}{4}\) versus \(\tfrac{1}{4}\), a ratio of 3.

@ 1 | c | Acceleration with air resistance
A ball is thrown straight up and air resistance is not negligible. What is the magnitude of the ball's acceleration at the instant it reaches its highest point?
* Exactly \(g\), because the ball is momentarily at rest and experiences no drag
- Greater than \(g\), because drag still acts downward at the top
- Less than \(g\), because drag acts upward at the top
- Zero, because the ball is momentarily at rest
= Drag depends on the velocity relative to the air, and at the top the velocity is zero, so only gravity acts. On the way up the acceleration is greater than \(g\), and on the way down it is less.

@ 2 | q | Static friction between blocks | stackTop
A \(2.0\text{ kg}\) block rests on a \(4.0\text{ kg}\) block, which sits on a frictionless floor, as shown. The coefficient of static friction between the blocks is 0.50. What is the greatest horizontal force \(F\) that can be applied to the top block without it slipping on the bottom block? Use \(g=10\text{ m/s}^2\).
* \(15\text{ N}\)
- \(10\text{ N}\)
- \(30\text{ N}\)
- \(7.5\text{ N}\)
= Friction from the top block is the only horizontal force on the bottom block, and it can be at most \(0.50(2.0)(10)=10\text{ N}\), giving the bottom block at most \(2.5\text{ m/s}^2\). Both blocks share that acceleration, so \(F=(6.0)(2.5)=15\text{ N}\). The value \(10\text{ N}\) is the friction limit, not the applied force.

@ 2 | q | Linear drag
A puck of mass \(m\) slides on a horizontal surface, and the only horizontal force on it is a drag force of magnitude \(bv\). How long does its speed take to fall to half its initial value?
* \(\dfrac{m}{b}\ln 2\)
- \(\dfrac{m}{2b}\)
- \(\dfrac{m}{b}\)
- \(\dfrac{2m}{b}\)
= \(m\dfrac{dv}{dt}=-bv\) gives \(v=v_0e^{-bt/m}\). Setting \(e^{-bt/m}=\tfrac{1}{2}\) gives \(t=\dfrac{m}{b}\ln 2\). The speed never actually reaches zero.

@ 2 | q | Quadratic drag
An object falls with a drag force proportional to the square of its speed and has terminal speed \(v_T\). What is the magnitude of its acceleration when its speed is \(\tfrac{1}{2}v_T\)?
* \(\dfrac{3}{4}g\)
- \(\dfrac{1}{2}g\)
- \(\dfrac{1}{4}g\)
- \(g\)
= At terminal speed \(cv_T^2=mg\), so the acceleration is \(g-\dfrac{cv^2}{m}=g\left(1-\dfrac{v^2}{v_T^2}\right)\). At half the terminal speed the drag is one fourth of the weight, so \(a=\tfrac{3}{4}g\). Linear drag would give \(\tfrac{1}{2}g\).

@ 2 | q | Circular motion with friction
A coin rests on a horizontal turntable a distance \(r\) from the axis. The coefficient of static friction is \(\mu_s\). What is the greatest angular speed at which the turntable can rotate without the coin sliding?
* \(\sqrt{\dfrac{\mu_sg}{r}}\)
- \(\sqrt{\mu_sgr}\)
- \(\dfrac{\mu_sg}{r}\)
- \(\sqrt{\dfrac{g}{\mu_sr}}\)
= Static friction supplies the centripetal force, so \(m\omega^2r\le\mu_smg\), giving \(\omega\le\sqrt{\dfrac{\mu_sg}{r}}\). The expression \(\sqrt{\mu_sgr}\) is the maximum linear speed.

@ 2 | q | Tension in a rotating string
A small ball of mass \(m\) is whirled in a horizontal circle on a frictionless table at angular speed \(\omega\), attached to a uniform string of mass \(M\) and length \(L\) whose other end is fixed at the center. What is the tension in the string at the center?
* \(m\omega^2L+\tfrac{1}{2}M\omega^2L\)
- \(m\omega^2L\)
- \(\left(m+M\right)\omega^2L\)
- \(m\omega^2L+M\omega^2L\)
= The tension at the center must supply the centripetal force for everything outside it. The ball needs \(m\omega^2L\), and the string needs \(\displaystyle\int_0^L\dfrac{M}{L}\omega^2r\,dr=\tfrac{1}{2}M\omega^2L\), since its mass is spread out at an average radius of \(\dfrac{L}{2}\).

@ 2 | q | Banked curves with friction
A curve of radius \(r\) is banked at angle \(\theta\), and the coefficient of static friction between the tires and road is \(\mu\). What is the greatest speed at which a car can round the curve without sliding up the bank?
* \(\sqrt{rg\,\dfrac{\sin\theta+\mu\cos\theta}{\cos\theta-\mu\sin\theta}}\)
- \(\sqrt{rg\,\dfrac{\sin\theta-\mu\cos\theta}{\cos\theta+\mu\sin\theta}}\)
- \(\sqrt{rg\tan\theta}\)
- \(\sqrt{rg\left(\tan\theta+\mu\right)}\)
= At the greatest speed, static friction acts down the bank with magnitude \(\mu N\). Vertically, \(N\cos\theta-\mu N\sin\theta=mg\); horizontally, \(N\sin\theta+\mu N\cos\theta=\dfrac{mv^2}{r}\). Dividing eliminates \(N\). The second expression is the least speed, when friction acts up the bank.

@ 2 | q | Rotation of a planet
A planet of radius \(R\) has a gravitational field strength \(g\) at its surface. How short would its rotation period have to be for objects at its equator to have zero apparent weight?
* \(2\pi\sqrt{\dfrac{R}{g}}\)
- \(\pi\sqrt{\dfrac{R}{g}}\)
- \(2\pi\sqrt{\dfrac{g}{R}}\)
- \(2\pi\sqrt{\dfrac{2R}{g}}\)
= An object at the equator has zero apparent weight when gravity alone provides exactly the centripetal force, \(mg=m\omega^2R\). Then \(\omega=\sqrt{\dfrac{g}{R}}\), and the period is \(\dfrac{2\pi}{\omega}\). For Earth this is about 84 minutes.

@ 2 | q | Time-dependent applied force
A block of mass \(m\) rests on a floor with coefficients of static and kinetic friction \(\mu_s\) and \(\mu_k\). A horizontal force \(F=kt\), where \(k\) is a constant, is applied starting at \(t=0\). At what time does the block begin to move?
* \(\dfrac{\mu_smg}{k}\)
- \(\dfrac{\mu_kmg}{k}\)
- \(\dfrac{mg}{k}\)
- \(\dfrac{\mu_sg}{k}\)
= Static friction matches the applied force until the force reaches its maximum value \(\mu_smg\). Setting \(kt=\mu_smg\) gives the time. After the block starts moving, the smaller kinetic friction acts, so the block jumps to a nonzero acceleration.

@ 2 | c | Circular motion | conical
A ball on a string moves in a horizontal circle as a conical pendulum, as shown. How does the tension in the string compare with the ball's weight?
* It is always greater than the weight.
- It equals the weight, because the ball does not move vertically.
- It is less than the weight, because the string is tilted.
- It can be greater or less than the weight, depending on the speed.
= The vertical component of the tension balances gravity, \(T\cos\theta=mg\), so \(T=\dfrac{mg}{\cos\theta}>mg\) for any tilt. The horizontal component supplies the centripetal force.

@ 2 | c | Newton's third law
A horse pulls a cart forward and both speed up together. A student argues that the cart pulls back on the horse with an equal force, so the two cannot accelerate. Which statement correctly resolves the argument?
* The two equal forces act on different objects; the cart accelerates because the horse's pull exceeds the other forces on the cart.
- The horse's pull on the cart is actually larger than the cart's pull on the horse.
- Newton's third law applies only to objects at rest.
- The forces cancel, and the motion is caused by the cart's inertia.
= A third-law pair never acts on the same object, so the pair cannot cancel. Each object's acceleration depends on the net force on that object: the cart's on the horse's pull and friction, the horse's on the ground's push and the cart's pull.

@ 2 | c | Linear drag
Two balls with the same size and shape fall from rest through air with a drag force \(bv\), where \(b\) is the same for both. Ball 1 has twice the mass of ball 2. Which reaches the ground first?
* Ball 1, because its terminal speed is twice as great
- Ball 2, because it experiences less drag
- They arrive together, because gravity gives both the same acceleration
- Ball 2, because a smaller mass accelerates more easily
= The acceleration is \(g-\dfrac{b}{m}v\), so at any speed drag slows the heavier ball less. Its terminal speed \(\dfrac{mg}{b}\) is twice as large, so it is faster at every moment after release.

@ 2 | c | Apparent weight on a rotating planet
Ignoring Earth's slightly flattened shape, why does a person standing on a scale at the equator read slightly less than the same person standing at a pole?
* At the equator part of the gravitational force must provide the centripetal acceleration of Earth's rotation, so the normal force is smaller.
- The gravitational force is weaker at the equator because Earth is spinning.
- Air pressure pushes upward more strongly at the equator.
- The scale reads more at the poles because the person is closer to Earth's axis.
= At the equator the person moves in a circle, so \(mg-N=m\omega^2R\), and the scale reads \(N\). At a pole the person is on the axis and does not move in a circle, so \(N=mg\).

@ 2 | c | Gravitational field of a shell
A thin, uniform spherical shell of mass \(M\) is far from any other object. What is the gravitational field at a point inside the shell, away from its center?
* Zero everywhere inside the shell
- Directed toward the center, with magnitude \(\dfrac{GM}{r^2}\)
- Directed toward the nearest part of the shell
- Directed away from the center, with magnitude \(\dfrac{GM}{R^2}\)
= The pulls from opposite parts of the shell cancel exactly: a nearer patch is closer but contains proportionally less mass, by the inverse-square law. This result is why only the mass inside radius \(r\) matters inside a planet.

@ 2 | c | Linear drag
An object is dropped from rest and falls with a drag force proportional to its speed. Which describes a graph of its acceleration as a function of time?
* It decreases exponentially from \(g\) toward zero.
- It is constant at \(g\).
- It decreases linearly from \(g\) to zero and stays at zero.
- It increases from zero toward \(g\).
= The velocity is \(v_T\left(1-e^{-bt/m}\right)\), so its derivative is \(a=ge^{-bt/m}\). The acceleration starts at \(g\), when the speed and drag are zero, and approaches zero as the speed approaches the terminal speed.

@ 3 | q | Work by a variable force | Fxc
The graph shows the net force \(F=4x-x^2\), in newtons, on an object as a function of its position \(x\), in meters. How much work does the force do as the object moves from \(x=0\) to \(x=4\text{ m}\)?
* About \(10.7\text{ J}\)
- \(16\text{ J}\)
- About \(21.3\text{ J}\)
- \(32\text{ J}\)
= \(W=\displaystyle\int_0^4\left(4x-x^2\right)dx=\left[2x^2-\dfrac{x^3}{3}\right]_0^4=32-\dfrac{64}{3}=\dfrac{32}{3}\text{ J}\). Multiplying the peak force by the distance overestimates the work, because the force is less than \(4\text{ N}\) almost everywhere.

@ 3 | q | Work–energy theorem | Fxc
A \(2.0\text{ kg}\) object is at rest at \(x=0\) and is acted on by the net force shown in the graph, \(F=4x-x^2\) in newtons. What is its speed at \(x=4\text{ m}\)?
* About \(3.3\text{ m/s}\)
- About \(4.6\text{ m/s}\)
- \(4.0\text{ m/s}\)
- About \(2.3\text{ m/s}\)
= The net work is \(\dfrac{32}{3}\text{ J}\), which equals the kinetic energy: \(\tfrac{1}{2}(2.0)v^2=\dfrac{32}{3}\), so \(v\approx 3.3\text{ m/s}\). Forgetting the factor of one half gives \(2.3\text{ m/s}\).

@ 3 | q | Potential energy curves | Ur
The graph shows the potential energy of two atoms as a function of their separation. What is the least energy that must be added to separate the atoms completely, starting from rest at their equilibrium separation?
* \(4\text{ eV}\)
- \(2\text{ eV}\)
- \(1\text{ eV}\)
- \(8\text{ eV}\)
= At rest at equilibrium the system has \(U=-4\text{ eV}\). Completely separated atoms have \(U\to 0\), so at least \(4\text{ eV}\) must be added. This is the dissociation energy of the molecule.

@ 3 | c | Force from a potential energy curve | Ur
The graph shows the potential energy of two atoms as a function of their separation \(r\). What is the force between the atoms when \(r=0.9\times 10^{-10}\text{ m}\)?
* Repulsive, because \(U\) decreases as \(r\) increases there
- Attractive, because \(U\) is negative there
- Zero, because \(U\) is close to zero there
- Attractive, because the atoms are closer than their equilibrium separation
= The force is \(F=-\dfrac{dU}{dr}\). To the left of the minimum the slope is negative, so \(F\) is positive, pushing the atoms apart. The sign of \(U\) itself does not determine the direction of the force; its slope does.

@ 3 | c | Bound motion | Ur
The two atoms whose potential energy is graphed have a total energy of \(-2\text{ eV}\), shown by the dashed line. Which statement describes their motion?
* The separation oscillates between about \(0.92\) and \(1.23\times 10^{-10}\text{ m}\), and the atoms cannot separate.
- The atoms separate completely, because their kinetic energy is positive.
- The separation stays fixed at \(1.0\times 10^{-10}\text{ m}\).
- The separation can take any value greater than \(0.92\times 10^{-10}\text{ m}\).
= Kinetic energy is \(E-U\), which cannot be negative, so the atoms are confined to the region where the curve lies below \(E\). Because \(E\) is below zero, the curve rises above \(E\) at large separations, so the system is bound.

@ 3 | q | Energy of a chain | chain
A uniform chain of length \(L\) lies on a frictionless table with one third of its length hanging over the edge, as shown, and is released from rest. What is its speed when the last link leaves the table?
* \(\sqrt{\dfrac{8gL}{9}}\)
- \(\sqrt{gL}\)
- \(\sqrt{2gL}\)
- \(\sqrt{\dfrac{2gL}{3}}\)
= Take the tabletop as zero. Initially the hanging third has \(U=-\dfrac{M}{3}g\dfrac{L}{6}=-\dfrac{MgL}{18}\); finally the whole chain hangs with \(U=-\dfrac{MgL}{2}\). The kinetic energy gained is \(\dfrac{4}{9}MgL=\tfrac{1}{2}Mv^2\). Each part of the chain falls a different distance, so the center of mass must be tracked.

@ 3 | q | Power and drag
A car of mass \(m\) moves on a level road with its engine delivering constant power \(P\). The only resistive force is drag of magnitude \(bv\). What is the car's top speed?
* \(\sqrt{\dfrac{P}{b}}\)
- \(\dfrac{P}{b}\)
- \(\sqrt{\dfrac{2P}{m}}\)
- \(\dfrac{P}{mb}\)
= At top speed the driving force equals the drag, and the power delivered is \(Fv=bv\cdot v=bv^2\). Setting \(bv^2=P\) gives the result. The mass affects how quickly the car approaches top speed, not the speed itself.

@ 3 | q | Escape speed
A planet of radius \(R\) has uniform density \(\rho\). Which expression gives the escape speed from its surface?
* \(R\sqrt{\dfrac{8\pi G\rho}{3}}\)
- \(R\sqrt{\dfrac{4\pi G\rho}{3}}\)
- \(\sqrt{\dfrac{8\pi G\rho R}{3}}\)
- \(R^2\sqrt{\dfrac{8\pi G\rho}{3}}\)
= Escape speed is \(\sqrt{\dfrac{2GM}{R}}\) with \(M=\tfrac{4}{3}\pi R^3\rho\), which simplifies to \(R\sqrt{\dfrac{8\pi G\rho}{3}}\). For planets of the same density, escape speed is proportional to radius.

@ 3 | q | Spring with friction
A block attached to a horizontal spring of spring constant \(k\) is pulled a distance \(x_0\) from equilibrium on a floor with coefficient of kinetic friction \(\mu_k\), and released from rest. Where does the block reach its maximum speed during its first motion toward equilibrium?
* At a distance \(\dfrac{\mu_kmg}{k}\) from equilibrium, on the side from which it was released
- At the equilibrium position
- At a distance \(\dfrac{\mu_kmg}{k}\) past equilibrium
- At \(\dfrac{x_0}{2}\)
= The speed is greatest where the net force, and so the acceleration, is zero. While the block moves toward equilibrium, friction opposes the spring force, and they balance where \(kx=\mu_kmg\), before the block reaches equilibrium.

@ 3 | q | Work by a conservative force
A force \(\vec F=2xy\,\hat\imath+x^2\,\hat\jmath\), in newtons with \(x\) and \(y\) in meters, acts on a particle that moves from the origin to the point \((2\text{ m},3\text{ m})\). How much work does the force do?
* \(12\text{ J}\)
- \(6\text{ J}\)
- \(18\text{ J}\)
- It depends on the path taken.
= The force is conservative with \(U=-x^2y\), since \(-\dfrac{\partial U}{\partial x}=2xy\) and \(-\dfrac{\partial U}{\partial y}=x^2\). The work is \(U(0,0)-U(2,3)=0-(-12)=12\text{ J}\) for every path.

@ 3 | q | Energy and circular motion
A \(2.0\text{ kg}\) block slides from rest down a frictionless track shaped like a quarter of a circle of radius \(1.8\text{ m}\), starting level with the circle's center. Using \(g=10\text{ m/s}^2\), what normal force does the track exert on the block at the bottom?
* \(60\text{ N}\)
- \(20\text{ N}\)
- \(40\text{ N}\)
- \(80\text{ N}\)
= Falling a height \(R\) gives \(v^2=2gR\). At the bottom, \(N-mg=\dfrac{mv^2}{R}=2mg\), so \(N=3mg=60\text{ N}\), independent of the radius.

@ 3 | c | Work done by internal forces
A person crouches and then jumps straight up. While the person's feet are in contact with the floor, how much work does the floor's normal force do on the person, and where does the person's kinetic energy come from?
* The floor does no work, because the point where the force acts does not move; the energy comes from chemical energy in the person's muscles.
- The floor does positive work equal to the person's kinetic energy at takeoff.
- The floor does negative work, which is converted into kinetic energy.
- The floor does positive work equal to the person's weight times the crouch depth.
= Work requires a displacement of the point of application, and the soles of the feet stay at rest on the floor. The normal force supplies the impulse that changes the person's momentum, but the energy comes from inside the system.

@ 3 | c | Escape speed
Ignoring air resistance and the planet's rotation, how does the escape speed from a planet's surface depend on the direction in which an object is launched?
* It does not depend on the direction, because escape depends only on the total energy.
- It is least when the object is launched straight up.
- It is least when the object is launched horizontally.
- It is greatest when the object is launched straight up.
= An object escapes if its total mechanical energy is zero or positive, \(\tfrac{1}{2}mv^2-\dfrac{GMm}{R}\ge 0\). Kinetic energy depends only on speed, so direction does not matter, provided the path does not intersect the planet.

@ 3 | c | Orbital energy
A satellite in a circular orbit fires its engine briefly several times so that it ends in a higher circular orbit. How do its speed and total mechanical energy compare with their original values?
* Its speed is lower, and its total mechanical energy is greater.
- Its speed and total mechanical energy are both greater.
- Its speed is greater, and its total mechanical energy is lower.
- Its speed and total mechanical energy are both lower.
= For a circular orbit, \(v=\sqrt{\dfrac{GM}{r}}\) and \(E=-\dfrac{GMm}{2r}\). A larger radius gives a smaller speed but a less negative, larger total energy: the engine's work increases the potential energy by more than the kinetic energy decreases.

@ 3 | c | Path dependence of work
A box is pushed across a rough floor from point A to point B along two different paths, one straight and one curved. Which statement about the work done on the box is correct?
* The work done by gravity is the same for both paths, but friction does more negative work along the longer path.
- Friction does the same work on both paths, because the endpoints are the same.
- Gravity does more work on the curved path.
- The total work is the same on both paths, because the box starts and ends at rest.
= Gravity is conservative, so its work depends only on the endpoints, and on a level floor it is zero. Kinetic friction always opposes the motion, so its work is proportional to the path length. A potential energy can be defined only for forces whose work is path-independent.

@ 4 | q | Ballistic pendulum | ballistic
A \(0.010\text{ kg}\) bullet is fired into a \(1.99\text{ kg}\) block hanging from long strings, as shown, and embeds in it. The block swings up \(0.20\text{ m}\). Using \(g=10\text{ m/s}^2\), what was the speed of the bullet?
* \(400\text{ m/s}\)
- \(2.0\text{ m/s}\)
- \(200\text{ m/s}\)
- About \(28\text{ m/s}\)
= After the collision, energy conservation gives the combined speed \(\sqrt{2(10)(0.20)}=2.0\text{ m/s}\). Momentum conservation during the collision gives \(0.010v=2.00(2.0)\), so \(v=400\text{ m/s}\). Using energy conservation through the collision gives about \(28\text{ m/s}\).

@ 4 | q | Ballistic pendulum | ballistic
In the ballistic pendulum shown, the bullet's mass is \(m\) and the block's mass is \(M\). What fraction of the bullet's initial kinetic energy remains as kinetic energy immediately after it embeds in the block?
* \(\dfrac{m}{m+M}\)
- \(\dfrac{M}{m+M}\)
- \(\dfrac{m^2}{(m+M)^2}\)
- \(\dfrac{1}{2}\)
= With \(V=\dfrac{mv}{m+M}\), the final kinetic energy is \(\dfrac{(mv)^2}{2(m+M)}\), which divided by \(\tfrac{1}{2}mv^2\) is \(\dfrac{m}{m+M}\). For a light bullet nearly all of the energy is dissipated in the block.

@ 4 | q | Momentum of a sliding system | wedgeFree
The block in the figure slides from rest down the frictionless wedge, which is free to move on the frictionless floor. When the block reaches the floor it moves horizontally with speed \(v\) relative to the ground. What is the speed of the wedge then?
* \(\dfrac{mv}{M}\)
- \(0\)
- \(\dfrac{Mv}{m}\)
- \(\dfrac{mv}{m+M}\)
= No horizontal external force acts on the block and wedge together, so their total horizontal momentum stays zero: \(mv-MV=0\). The wedge moves opposite to the block with speed \(\dfrac{mv}{M}\).

@ 4 | c | Conservation laws | wedgeFree
The block in the figure slides down the frictionless wedge, which is free to move on the frictionless floor. For the system of the block, the wedge, and Earth, which quantities are conserved?
* The horizontal momentum of the block and wedge and the total mechanical energy
- The total momentum of the block and wedge in all directions
- The horizontal momentum of the block and wedge only; mechanical energy is lost as the wedge moves
- Mechanical energy only; momentum changes because the wedge pushes the block
= Gravity and the normal force from the floor are vertical, so the horizontal momentum of the block and wedge is conserved but their vertical momentum is not. No friction acts anywhere, so mechanical energy is conserved.

@ 4 | q | Rocket propulsion
A \(5000\text{ kg}\) rocket on a launch pad ejects exhaust at \(30\text{ kg/s}\) with a speed of \(2000\text{ m/s}\) relative to the rocket. Using \(g=10\text{ m/s}^2\), what is its upward acceleration just after liftoff?
* \(2.0\text{ m/s}^2\)
- \(12\text{ m/s}^2\)
- \(10\text{ m/s}^2\)
- \(0\)
= The thrust is the rate at which momentum is carried away by the exhaust, \(\left(30\right)\left(2000\right)=6.0\times 10^4\text{ N}\). Subtracting the weight of \(5.0\times 10^4\text{ N}\) gives a net force of \(1.0\times 10^4\text{ N}\) and an acceleration of \(2.0\text{ m/s}^2\).

@ 4 | q | Center of mass of an extended object
A circular hole of radius \(\dfrac{R}{2}\) is cut from a uniform disk of radius \(R\). The center of the hole is a distance \(\dfrac{R}{2}\) from the center of the disk. Where is the center of mass of the remaining piece?
* A distance \(\dfrac{R}{6}\) from the disk's center, on the side opposite the hole
- A distance \(\dfrac{R}{4}\) from the disk's center, on the side opposite the hole
- At the disk's center
- A distance \(\dfrac{R}{2}\) from the disk's center, on the side opposite the hole
= Treat the hole as negative mass. It has one fourth of the disk's area, so the remaining piece has three fourths: \(x_{\text{cm}}=\dfrac{0-\tfrac{1}{4}\left(\tfrac{R}{2}\right)}{\tfrac{3}{4}}=-\dfrac{R}{6}\).

@ 4 | q | Impulse from a time-varying force
A force \(F(t)=F_0\sin\!\left(\dfrac{\pi t}{T}\right)\) acts on an object from \(t=0\) to \(t=T\). What impulse does it deliver?
* \(\dfrac{2F_0T}{\pi}\)
- \(F_0T\)
- \(\dfrac{F_0T}{2}\)
- \(\dfrac{F_0T}{\pi}\)
= \(J=\displaystyle\int_0^TF_0\sin\!\left(\dfrac{\pi t}{T}\right)dt=\dfrac{F_0T}{\pi}\left[-\cos\!\left(\dfrac{\pi t}{T}\right)\right]_0^T=\dfrac{2F_0T}{\pi}\). The average force is \(\dfrac{2}{\pi}F_0\), about 64 percent of the peak.

@ 4 | q | Variable mass
Sand falls vertically onto a conveyor belt at a rate \(\lambda\), in kilograms per second, and the belt moves at a constant speed \(v\). What power must the motor supply to keep the belt moving at that speed?
* \(\lambda v^2\)
- \(\tfrac{1}{2}\lambda v^2\)
- \(\lambda v\)
- \(2\lambda v^2\)
= The belt must give horizontal momentum to the sand at the rate \(\lambda v\), which is the force required, and the power is that force times \(v\). Only half of this power becomes kinetic energy of the sand; the other half is dissipated as the sand slips before matching the belt's speed.

@ 4 | q | Elastic collisions
A small ball of mass \(m\) rests on top of a large ball of mass \(3m\), and the two are dropped together from height \(h\) onto a hard floor. Assume all collisions are elastic and the large ball rebounds from the floor before it strikes the small ball. How high does the small ball rise?
* \(4h\)
- \(9h\)
- \(2h\)
- \(h\)
= Both balls reach the floor at speed \(v\). The large ball rebounds upward at \(v\) and meets the small ball still moving down at \(v\). An elastic collision with a mass ratio of 3 stops the large ball and sends the small ball up at \(2v\), which carries it to \(4h\).

@ 4 | q | Explosions in two dimensions
An object at rest explodes into three pieces. A piece of mass \(m\) moves east at speed \(v\), a second piece of mass \(m\) moves north at speed \(v\), and the third piece has mass \(2m\). What is the speed of the third piece?
* \(\dfrac{\sqrt{2}}{2}v\)
- \(v\)
- \(\sqrt{2}\,v\)
- \(\dfrac{v}{2}\)
= The total momentum stays zero, so the third piece's momentum cancels the sum of the other two, which has magnitude \(\sqrt{2}\,mv\). Dividing by \(2m\) gives \(\dfrac{\sqrt{2}}{2}v\), directed southwest.

@ 4 | c | Collisions and force
In test 1, a car hits a rigid wall at speed \(v\) and stops. In test 2, an identical car traveling at speed \(v\) hits a second identical car traveling toward it at speed \(v\), and both stop. How does the force on the first car compare in the two tests?
* It is about the same, because in both tests the car stops from speed \(v\) in about the same time.
- It is twice as great in test 2, because the relative speed is \(2v\).
- It is half as great in test 2, because the other car absorbs half the impact.
- It is four times as great in test 2, because the kinetic energy is four times greater.
= In both tests the car's change in momentum is \(mv\). By symmetry, the head-on collision is equivalent to each car hitting a rigid wall at the point where they meet, so the stopping time and the force are about the same.

@ 4 | c | Momentum with internal friction
A block slides onto a cart that rolls on a frictionless track, and friction between the block and the cart slows the block until the two move together. For the block–cart system, what is conserved?
* Momentum is conserved, but kinetic energy is not.
- Kinetic energy is conserved, but momentum is not.
- Both momentum and kinetic energy are conserved.
- Neither momentum nor kinetic energy is conserved, because friction acts.
= The friction between block and cart is internal to the system, so it cannot change the total momentum. It does convert kinetic energy into internal energy, as in any perfectly inelastic collision.

@ 4 | c | Impulse
A batter keeps the bat in contact with the ball for a longer time while applying the same average force. What is the effect on the ball?
* Its change in momentum is greater, because the impulse is greater.
- Its change in momentum is unchanged, because the average force is unchanged.
- Its change in momentum is smaller, because the force is spread over more time.
- Its kinetic energy is unchanged, because the bat's speed is unchanged.
= Impulse is the average force multiplied by the contact time, and impulse equals the change in momentum. A longer contact at the same force delivers more momentum, which is the reason for following through.

@ 4 | c | Momentum and recoil
A person standing at rest in a boat on still water jumps off with the same speed relative to the water in two trials, once horizontally and once at \(45^\circ\) above the horizontal. Ignoring water resistance, in which trial does the boat move backward faster?
* When the person jumps horizontally, because more horizontal momentum is given to the person
- When the person jumps at \(45^\circ\), because the person pushes down on the boat
- The boat's speed is the same, because the person's speed is the same
- The boat does not move in either trial, because the water holds it in place
= Only horizontal momentum is conserved, since the water and gravity exert vertical forces. A horizontal jump gives the person all of the momentum horizontally; at \(45^\circ\) only \(\cos 45^\circ\) of it is horizontal, so the boat recoils less.

@ 4 | c | Momentum and kinetic energy
When a rifle is fired, the bullet and the rifle receive momenta of equal magnitude. How do their kinetic energies compare?
* The bullet has far more kinetic energy, because kinetic energy is \(\dfrac{p^2}{2m}\) and its mass is much smaller.
- They have equal kinetic energies, because their momenta are equal.
- The rifle has more kinetic energy, because it is more massive.
- The bullet has more kinetic energy, but only because it moves faster than sound.
= For equal momenta, kinetic energy is inversely proportional to mass. A bullet with a thousandth of the rifle's mass gets about a thousand times as much kinetic energy, which is why a rifle's recoil is survivable.

@ 5 | q | Static equilibrium | ladder
A uniform ladder of mass \(M\) and length \(L\) leans against a frictionless wall at angle \(\theta\) with the floor, as shown. A person of mass \(M\) stands three quarters of the way up. What force does the wall exert on the ladder?
* \(\dfrac{5Mg}{4\tan\theta}\)
- \(\dfrac{Mg}{2\tan\theta}\)
- \(\dfrac{5Mg\tan\theta}{4}\)
- \(\dfrac{3Mg}{4\tan\theta}\)
= Taking torques about the base: \(N_wL\sin\theta=Mg\dfrac{L}{2}\cos\theta+Mg\dfrac{3L}{4}\cos\theta=\dfrac{5}{4}MgL\cos\theta\). The floor's friction must equal this force, so a person climbing higher makes the ladder more likely to slip.

@ 5 | q | Rolling with an applied force | yoyo
The spool shown, of mass \(M\), outer radius \(R\), inner radius \(r\), and rotational inertia \(I\) about its center, is pulled by the horizontal force \(F\) and rolls without slipping. What is the acceleration of its center?
* \(\dfrac{FR\left(R-r\right)}{I+MR^2}\)
- \(\dfrac{FR\left(R+r\right)}{I+MR^2}\)
- \(\dfrac{F}{M}\)
- \(\dfrac{Fr}{I+MR^2}\)
= Taking torques about the contact point, where the unknown friction force exerts none, the string's line of action is a height \(R-r\) above the ground: \(F(R-r)=\left(I+MR^2\right)\alpha\), with \(a=R\alpha\). The rotational inertia about the contact point comes from the parallel-axis theorem.

@ 5 | c | Rolling with an applied force | yoyo
The spool shown rests on a rough surface and is pulled gently by the horizontal force \(F\) applied at the bottom of its hub. Which way does it roll?
* To the right, toward the pull, winding up the string
- To the left, away from the pull, unwinding the string
- It does not move, because the torque and force cancel
- To the right, but it slides without rotating
= About the contact point, the string's line of action lies above the ground by \(R-r\), so its torque turns the spool clockwise about that point, which rolls it to the right. The string winds onto the hub because the hub rotates the same way.

@ 5 | q | Rotational dynamics of a pivoted rod
A uniform rod of mass \(M\) and length \(L\) is pivoted at a point \(\dfrac{L}{4}\) from one end and held horizontally. Its rotational inertia about its center is \(\tfrac{1}{12}ML^2\). What is its angular acceleration immediately after release?
* \(\dfrac{12g}{7L}\)
- \(\dfrac{3g}{2L}\)
- \(\dfrac{3g}{L}\)
- \(\dfrac{6g}{7L}\)
= By the parallel-axis theorem, \(I=\tfrac{1}{12}ML^2+M\left(\tfrac{L}{4}\right)^2=\tfrac{7}{48}ML^2\). The torque of gravity is \(Mg\dfrac{L}{4}\), so \(\alpha=\dfrac{MgL/4}{7ML^2/48}=\dfrac{12g}{7L}\).

@ 5 | q | Connected objects with a massive pulley | incPulley
The pulley in the system shown has rotational inertia \(I\) and radius \(R\), and the string does not slip on it. The ramp and axle are frictionless, and \(m_2\) descends. What is the magnitude of the acceleration of the blocks?
* \(\dfrac{\left(m_2-m_1\sin\theta\right)g}{m_1+m_2+\dfrac{I}{R^2}}\)
- \(\dfrac{\left(m_2-m_1\sin\theta\right)g}{m_1+m_2}\)
- \(\dfrac{\left(m_2-m_1\sin\theta\right)g}{m_1+m_2+\dfrac{I}{2R^2}}\)
- \(\dfrac{m_2g}{m_1+m_2+\dfrac{I}{R^2}}\)
= For the blocks, \(m_2g-T_2=m_2a\) and \(T_1-m_1g\sin\theta=m_1a\); for the pulley, \((T_2-T_1)R=I\dfrac{a}{R}\). Adding the three equations eliminates the tensions. The pulley acts like an additional mass \(\dfrac{I}{R^2}\) to be accelerated.

@ 5 | q | Rotational kinematics
A flywheel turning at \(30\text{ rad/s}\) slows to a stop at a constant rate in \(10\text{ s}\). About how many revolutions does it make while stopping?
* About 24
- 150
- About 48
- About 12
= With constant angular acceleration, the angle turned is the average angular speed times the time: \(15(10)=150\text{ rad}\), which is \(\dfrac{150}{2\pi}\approx 24\) revolutions.

@ 5 | q | Rotational inertia of a composite object
A uniform rod of mass \(M\) and length \(L\) has a small ball of mass \(M\) attached to each end. What is the rotational inertia of the assembly about an axis through the rod's center, perpendicular to the rod?
* \(\dfrac{7}{12}ML^2\)
- \(\dfrac{1}{12}ML^2\)
- \(\dfrac{1}{2}ML^2\)
- \(\dfrac{13}{12}ML^2\)
= Rotational inertias about the same axis add: the rod contributes \(\tfrac{1}{12}ML^2\) and each ball \(M\left(\tfrac{L}{2}\right)^2=\tfrac{1}{4}ML^2\). The total is \(\left(\tfrac{1}{12}+\tfrac{1}{2}\right)ML^2\).

@ 5 | q | Rotational inertia by integration
A thin disk of mass \(M\) and radius \(R\) has a surface mass density that increases linearly with distance from its center, \(\sigma=cr\). What is its rotational inertia about the axis through its center perpendicular to its face?
* \(\dfrac{3}{5}MR^2\)
- \(\dfrac{1}{2}MR^2\)
- \(\dfrac{2}{3}MR^2\)
- \(\dfrac{2}{5}MR^2\)
= Using rings of area \(2\pi r\,dr\): \(M=\displaystyle\int_0^Rcr\,2\pi r\,dr=\dfrac{2\pi cR^3}{3}\) and \(I=\displaystyle\int_0^Rr^2\,cr\,2\pi r\,dr=\dfrac{2\pi cR^5}{5}\). The ratio gives \(\tfrac{3}{5}MR^2\), more than a uniform disk because the mass is concentrated toward the rim.

@ 5 | q | Precession
A gyroscope with rotational inertia \(I\) spins with angular speed \(\omega\). Its axle is horizontal and is supported at a point a distance \(r\) from its center of mass. Its total mass is \(m\). What is its rate of precession?
* \(\dfrac{mgr}{I\omega}\)
- \(\dfrac{I\omega}{mgr}\)
- \(\dfrac{mgr\omega}{I}\)
- \(\sqrt{\dfrac{mgr}{I}}\)
= Gravity's torque about the support, \(mgr\), is perpendicular to the angular momentum \(I\omega\), so it rotates that vector without changing its size. The angular momentum turns at the rate \(\Omega=\dfrac{\tau}{L}\). A faster spin gives a slower precession.

@ 5 | c | Equilibrium conditions
A rod on a frictionless horizontal surface is acted on by two forces of equal magnitude in opposite directions that do not act along the same line. Which statement is correct?
* The net force is zero but the net torque is not, so the rod is not in equilibrium.
- The rod is in equilibrium, because the forces cancel.
- The net force and net torque are both zero.
- The net torque is zero but the net force is not.
= Equal and opposite forces with different lines of action form a couple. Their torque is the same about every point and equals the force times the distance between the lines, so the rod's rotation speeds up while its center of mass stays put.

@ 5 | c | Dependence on the axis
How does the rotational inertia of a uniform rod about an axis through one end compare with its rotational inertia about a parallel axis through its center?
* It is four times as large.
- It is twice as large.
- It is the same, because the mass and length are the same.
- It is half as large.
= About the center, \(I=\tfrac{1}{12}ML^2\); about the end, \(\tfrac{1}{3}ML^2\). Rotational inertia depends on how far the mass lies from the chosen axis, and the center-of-mass axis always gives the smallest value among parallel axes.

@ 5 | c | Angular velocity as a vector
Earth rotates from west to east. In what direction does its angular velocity vector point?
* Toward the North Star, along the axis from the South Pole to the North Pole
- Toward the South Pole
- Eastward, in the direction of the rotation
- Toward the Sun
= By the right-hand rule, with the fingers curling west to east, the thumb points along the axis toward the north. The angular velocity vector lies along the axis of rotation, not in the plane of the motion.

@ 5 | c | Rolling and static friction
A ball rolls without slipping down an incline. Which statement about the static friction force on it is correct?
* Its magnitude is whatever is needed to keep the ball rolling, which can be less than \(\mu_sN\).
- Its magnitude is always \(\mu_sN\).
- It is zero, because the contact point does not slide.
- It points down the incline, because the ball speeds up.
= Static friction adjusts to prevent sliding, up to a maximum of \(\mu_sN\). For a sphere it is \(\tfrac{2}{7}mg\sin\theta\), directed up the incline; the ball slips only if that required value exceeds \(\mu_sN\).

@ 5 | c | Tension in a yo-yo string
A yo-yo is released from rest with its string held fixed, and it falls as the string unwinds. How does the tension in the string compare with the yo-yo's weight?
* It is less than the weight, because the yo-yo's center accelerates downward.
- It equals the weight, because the string supports the yo-yo.
- It is greater than the weight, because the string must also spin the yo-yo.
- It is zero, because the yo-yo falls freely.
= The net force on the yo-yo is downward, so the tension is less than \(mg\). Its torque about the center still spins the yo-yo, which is why the acceleration is less than \(g\).

@ 6 | q | Rolling up an incline | inclineBall
A uniform solid sphere, with rotational inertia \(\tfrac{2}{5}MR^2\), rolls without slipping at speed \(v\) onto an incline like the one shown, at angle \(\theta\), and rolls up it. How far along the incline does it travel before stopping?
* \(\dfrac{7v^2}{10g\sin\theta}\)
- \(\dfrac{v^2}{2g\sin\theta}\)
- \(\dfrac{5v^2}{7g\sin\theta}\)
- \(\dfrac{7v^2}{10g}\)
= The sphere's kinetic energy, \(\tfrac{1}{2}Mv^2+\tfrac{1}{5}Mv^2=\tfrac{7}{10}Mv^2\), becomes potential energy \(Mgd\sin\theta\). Because the rotational energy also converts, the sphere travels farther than a sliding block would.

@ 6 | q | Rotational energy | rodPivot
The uniform rod shown, pivoted at one end with rotational inertia \(\tfrac{1}{3}ML^2\), is released from rest in the horizontal position. What is its angular speed when it has rotated \(30^\circ\) below the horizontal?
* \(\sqrt{\dfrac{3g}{2L}}\)
- \(\sqrt{\dfrac{3g}{L}}\)
- \(\sqrt{\dfrac{g}{L}}\)
- \(\sqrt{\dfrac{3\sqrt{3}g}{2L}}\)
= The center of mass drops \(\dfrac{L}{2}\sin 30^\circ=\dfrac{L}{4}\), so \(\dfrac{MgL}{4}=\tfrac{1}{2}\left(\tfrac{1}{3}ML^2\right)\omega^2\), giving \(\omega^2=\dfrac{3g}{2L}\). Using \(\cos 30^\circ\) for the drop gives the last choice.

@ 6 | q | Conservation of angular momentum
A uniform rod of mass \(M\) and length \(L\) spins freely in a horizontal plane at angular speed \(\omega_0\) about a vertical axis through its center. Two beads, each of mass \(m\), start at the center and slide without friction to the ends of the rod. What is the final angular speed?
* \(\dfrac{M\omega_0}{M+6m}\)
- \(\dfrac{M\omega_0}{M+2m}\)
- \(\dfrac{M\omega_0}{M+3m}\)
- \(\omega_0\)
= Angular momentum is conserved: \(\tfrac{1}{12}ML^2\omega_0=\left(\tfrac{1}{12}ML^2+2m\tfrac{L^2}{4}\right)\omega\). Multiplying by \(\dfrac{12}{L^2}\) gives \(M\omega_0=(M+6m)\omega\).

@ 6 | q | Rotational dynamics with friction
A uniform disk of mass \(M\) and radius \(R\) spinning at \(\omega_0\) about its vertical axis is set down flat on a horizontal surface with coefficient of kinetic friction \(\mu\). Its weight is spread evenly over its face. How long does it take to stop?
* \(\dfrac{3R\omega_0}{4\mu g}\)
- \(\dfrac{R\omega_0}{2\mu g}\)
- \(\dfrac{R\omega_0}{\mu g}\)
- \(\dfrac{3R\omega_0}{2\mu g}\)
= A ring of radius \(r\) carries weight \(\dfrac{Mg}{\pi R^2}2\pi r\,dr\), so the friction torque is \(\displaystyle\int_0^R\mu\dfrac{2Mg}{R^2}r^2\,dr=\tfrac{2}{3}\mu MgR\). With \(I=\tfrac{1}{2}MR^2\), \(\alpha=\dfrac{4\mu g}{3R}\), and the time is \(\dfrac{\omega_0}{\alpha}\).

@ 6 | q | Angular impulse
A wheel with rotational inertia \(3.0\text{ kg}\cdot\text{m}^2\), initially at rest, is acted on by a net torque \(\tau(t)=6t^2\), in newton-meters, from \(t=0\) to \(t=2.0\text{ s}\). What is its final angular speed?
* About \(5.3\text{ rad/s}\)
- \(8.0\text{ rad/s}\)
- \(16\text{ rad/s}\)
- \(2.7\text{ rad/s}\)
= The angular impulse is \(\displaystyle\int_0^26t^2\,dt=16\text{ kg}\cdot\text{m}^2\text{/s}\), which equals the change in angular momentum. Dividing by \(I\) gives \(\dfrac{16}{3.0}\approx 5.3\text{ rad/s}\). Using the final torque, \(24\text{ N}\cdot\text{m}\), times the time gives too large a result.

@ 6 | q | Sliding and rolling
A uniform solid cylinder, with rotational inertia \(\tfrac{1}{2}MR^2\), is placed on a rough horizontal surface sliding at speed \(v_0\) without rotating. What is its speed once it rolls without slipping?
* \(\dfrac{2}{3}v_0\)
- \(\dfrac{5}{7}v_0\)
- \(\dfrac{1}{2}v_0\)
- \(v_0\)
= About a fixed point on the surface, friction exerts no torque, so \(Mv_0R=MvR+\tfrac{1}{2}MR^2\dfrac{v}{R}\), giving \(v=\tfrac{2}{3}v_0\). A solid sphere would keep \(\tfrac{5}{7}\) of its speed.

@ 6 | q | Kepler's third law
A satellite in a low circular orbit just above Earth's surface has a period of about 85 minutes. About what is the period of a satellite in a circular orbit of radius four times Earth's radius?
* About 11 hours
- About 5.7 hours
- About 23 hours
- About 1.4 hours
= For circular orbits around the same body, \(T\propto r^{3/2}\). Multiplying the radius by 4 multiplies the period by 8, to about 680 minutes. A geosynchronous orbit, with a 24-hour period, has a radius of about 6.6 Earth radii.

@ 6 | q | Conservation of angular momentum
A child of mass \(m\) stands at the rim of a merry-go-round of radius \(R\) and rotational inertia \(I\), which turns freely at angular speed \(\omega_0\). The child walks to the center. What is the final angular speed?
* \(\dfrac{\left(I+mR^2\right)\omega_0}{I}\)
- \(\dfrac{I\omega_0}{I+mR^2}\)
- \(\omega_0\)
- \(\dfrac{\left(I+mR^2\right)\omega_0}{mR^2}\)
= Angular momentum is conserved: \(\left(I+mR^2\right)\omega_0=I\omega\), since a child at the center contributes no rotational inertia. The child does work while walking inward, so the kinetic energy increases.

@ 6 | c | Work by static friction in rolling
A cylinder rolls without slipping down an incline. How much work does static friction do on it?
* None, because the point of contact is instantaneously at rest
- A negative amount, because friction opposes the motion
- A positive amount, because friction increases the cylinder's spin
- A negative amount equal to the rotational kinetic energy gained
= Power delivered by a force is the force times the velocity of the material point where it acts, and the contact point of a rolling object has zero velocity. Friction converts some translational kinetic energy to rotational kinetic energy while doing no net work, so mechanical energy is conserved.

@ 6 | c | Choosing a reference point
An object experiences an external force whose line of action passes through point P but not through point Q. About which point is the object's angular momentum conserved, if no other external forces act?
* About P only
- About Q only
- About both P and Q
- About neither point, because a net force acts
= A force exerts no torque about any point on its line of action, so the angular momentum about P is unchanged. About Q the force has a lever arm, so the angular momentum about Q changes. Whether angular momentum is conserved depends on the reference point.

@ 6 | c | Precession
Two identical tops are tilted at the same angle, and top 1 spins twice as fast as top 2. How do their precession rates compare?
* Top 1 precesses half as fast as top 2.
- Top 1 precesses twice as fast as top 2.
- They precess at the same rate, because the torque of gravity is the same.
- Top 1 precesses four times as fast as top 2.
= The precession rate is the torque divided by the spin angular momentum. The torque of gravity is the same for both, so the top with twice the angular momentum precesses at half the rate.

@ 6 | c | Conserved quantities in orbits
A planet moves in an elliptical orbit around a star. Which quantities are constant throughout the orbit?
* The planet's angular momentum about the star and the total mechanical energy of the planet–star system
- The planet's speed and its kinetic energy
- The planet's linear momentum and its distance from the star
- The planet's kinetic energy and its angular momentum
= Gravity is a central, conservative force, so it exerts no torque about the star and does not change the total mechanical energy. The planet's speed, kinetic energy, and distance all vary around the orbit, and its momentum changes direction continuously.

@ 6 | c | Rolling without friction
A ball rolls without slipping across a rough floor and then onto a perfectly frictionless floor. What happens on the frictionless floor?
* It keeps rolling with the same speed and the same rate of spin.
- It stops spinning and slides.
- It spins faster and slows down.
- It stops, because no friction pushes it forward.
= On a level surface, rolling without slipping requires no friction once the speed and spin already match. With no horizontal force and no torque, both the velocity and the angular velocity stay constant.

@ 6 | c | Momentum of a rotating body
A wheel rotates about a fixed axle through its center of mass. What is the wheel's total linear momentum?
* Zero, because its center of mass is at rest
- \(I\omega\), its angular momentum
- \(MR\omega\), the mass times the rim speed
- It cannot be determined without knowing the mass distribution
= The total momentum of any system equals its mass times the velocity of its center of mass. Each piece of the wheel is moving, but opposite pieces move in opposite directions, so their momenta cancel.

@ 7 | q | Combinations of springs | doubleSpring
The block shown, of mass \(m\), is attached between two springs with spring constants \(k_1\) and \(k_2\). What is the period of its oscillation on the frictionless surface?
* \(2\pi\sqrt{\dfrac{m}{k_1+k_2}}\)
- \(2\pi\sqrt{\dfrac{m\left(k_1+k_2\right)}{k_1k_2}}\)
- \(2\pi\sqrt{\dfrac{m}{k_1}}+2\pi\sqrt{\dfrac{m}{k_2}}\)
- \(2\pi\sqrt{\dfrac{2m}{k_1+k_2}}\)
= When the block moves a distance \(x\), one spring stretches and the other compresses by \(x\), and both push the block back toward equilibrium: \(F=-(k_1+k_2)x\). The springs act in parallel even though they are on opposite sides. The second choice is the period for springs connected end to end.

@ 7 | c | Combinations of springs | doubleSpring
The two springs attached to the block shown are both stretched slightly at equilibrium because the walls are farther apart than the springs' combined natural lengths. How does this affect the period of oscillation?
* It has no effect, because the change in net force for a given displacement is still \(-(k_1+k_2)x\).
- It shortens the period, because the springs are already under tension.
- It lengthens the period, because the springs pull in opposite directions.
- It prevents the block from oscillating.
= For ideal springs, the tension at equilibrium cancels and adds only a constant force to each side. The restoring force depends on how each spring's length changes from its equilibrium value, so the effective spring constant and the period are unchanged.

@ 7 | q | Physical pendulum
A uniform meter stick, with rotational inertia \(\tfrac{1}{12}ML^2\) about its center, is pivoted at its \(25\text{ cm}\) mark and swings through small angles. Using \(g=10\text{ m/s}^2\), what is its period?
* About \(1.5\text{ s}\)
- About \(2.0\text{ s}\)
- About \(1.0\text{ s}\)
- About \(1.2\text{ s}\)
= The pivot is \(0.25\text{ m}\) from the center of mass, so \(I=M\left(\tfrac{1}{12}+0.0625\right)\approx 0.146M\). Then \(T=2\pi\sqrt{\dfrac{I}{Mgd}}=2\pi\sqrt{\dfrac{0.146}{2.5}}\approx 1.5\text{ s}\). Treating the stick as a simple pendulum of length \(1\text{ m}\) gives \(2.0\text{ s}\).

@ 7 | q | Torsion pendulum
A disk with rotational inertia \(0.020\text{ kg}\cdot\text{m}^2\) hangs from a wire whose torsion constant is \(0.50\text{ N}\cdot\text{m/rad}\), so that twisting it through angle \(\theta\) produces a restoring torque \(-\kappa\theta\). What is the period of its twisting oscillation?
* About \(1.3\text{ s}\)
- About \(0.20\text{ s}\)
- About \(0.63\text{ s}\)
- About \(5.0\text{ s}\)
= Newton's second law for rotation gives \(I\ddot\theta=-\kappa\theta\), the equation of simple harmonic motion with \(\omega=\sqrt{\dfrac{\kappa}{I}}=5.0\text{ rad/s}\). The period is \(\dfrac{2\pi}{5.0}\approx 1.3\text{ s}\).

@ 7 | q | Vertical spring oscillator
A \(0.20\text{ kg}\) block hanging from a vertical spring oscillates with displacement \(y(t)=0.050\cos(10t)\), in meters, about its equilibrium position. Using \(g=10\text{ m/s}^2\), what is the greatest force the spring exerts on the block?
* \(3.0\text{ N}\)
- \(1.0\text{ N}\)
- \(2.0\text{ N}\)
- \(5.0\text{ N}\)
= From \(\omega^2=\dfrac{k}{m}\), \(k=20\text{ N/m}\). At equilibrium the spring is already stretched \(\dfrac{mg}{k}=0.10\text{ m}\), so its greatest stretch is \(0.15\text{ m}\) and its greatest force is \(20(0.15)=3.0\text{ N}\). The value \(1.0\text{ N}\) is only the additional force \(kA\).

@ 7 | q | Rolling in a curved bowl
A small uniform solid ball of radius \(r\), with rotational inertia \(\tfrac{2}{5}mr^2\), rolls without slipping back and forth near the bottom of a spherical bowl of radius \(R\). What is the period of small oscillations?
* \(2\pi\sqrt{\dfrac{7(R-r)}{5g}}\)
- \(2\pi\sqrt{\dfrac{R-r}{g}}\)
- \(2\pi\sqrt{\dfrac{5(R-r)}{7g}}\)
- \(2\pi\sqrt{\dfrac{7R}{5g}}\)
= The ball's center moves on a circle of radius \(R-r\). Because the ball's kinetic energy is \(\tfrac{7}{10}mv^2\) instead of \(\tfrac{1}{2}mv^2\), the effective inertia is \(\tfrac{7}{5}\) as large as for a sliding particle, so the period is longer by a factor of \(\sqrt{\tfrac{7}{5}}\).

@ 7 | q | Phase constant
An oscillator's position is \(x(t)=A\cos(\omega t+\phi)\). At \(t=0\) it is at \(x=0\) moving in the \(+x\) direction. What is \(\phi\)?
* \(-\dfrac{\pi}{2}\)
- \(0\)
- \(\dfrac{\pi}{2}\)
- \(\pi\)
= \(x(0)=A\cos\phi=0\) requires \(\phi=\pm\dfrac{\pi}{2}\). The velocity \(v(0)=-A\omega\sin\phi\) is positive only if \(\sin\phi<0\), so \(\phi=-\dfrac{\pi}{2}\) and \(x=A\sin\omega t\).

@ 7 | q | Timing in simple harmonic motion
A \(0.50\text{ kg}\) block on a spring of spring constant \(50\text{ N/m}\) is released from rest at \(x=A\). How long does it take to reach \(x=\dfrac{A}{2}\) for the first time?
* About \(0.10\text{ s}\)
- About \(0.16\text{ s}\)
- About \(0.05\text{ s}\)
- About \(0.31\text{ s}\)
= With \(\omega=\sqrt{\dfrac{50}{0.50}}=10\text{ rad/s}\), \(x=A\cos(10t)\) equals \(\dfrac{A}{2}\) when \(10t=\dfrac{\pi}{3}\), so \(t\approx 0.10\text{ s}\), one sixth of the period. Half the distance takes more than half the quarter-period, because the block starts from rest.

@ 7 | q | Energy in simple harmonic motion
A block on a spring oscillates with amplitude \(A\). What fraction of its total mechanical energy is kinetic when it is a distance \(\dfrac{A}{3}\) from equilibrium?
* \(\dfrac{8}{9}\)
- \(\dfrac{2}{3}\)
- \(\dfrac{1}{9}\)
- \(\dfrac{1}{3}\)
= The spring energy at \(\dfrac{A}{3}\) is \(\tfrac{1}{2}k\dfrac{A^2}{9}\), one ninth of the total \(\tfrac{1}{2}kA^2\). The rest, eight ninths, is kinetic.

@ 7 | c | Phase relationships
How does the acceleration of a simple harmonic oscillator compare with its position at every instant?
* It is exactly opposite in phase: proportional to the position and pointing the other way.
- It is in phase with the position.
- It leads the position by a quarter cycle.
- It is constant, because the force is conservative.
= Differentiating \(x=A\cos\omega t\) twice gives \(a=-\omega^2x\). The acceleration reaches its positive maximum when the position reaches its negative maximum.

@ 7 | c | Adding mass to an oscillator
A block oscillates on a horizontal spring. At the instant it is at maximum displacement, a lump of clay is set gently on top of it and sticks. How do the amplitude and period change?
* The amplitude is unchanged and the period increases.
- The amplitude decreases and the period increases.
- The amplitude and period are both unchanged.
- The amplitude increases and the period decreases.
= At maximum displacement the block is momentarily at rest, so adding the clay changes no momentum or energy, and the turning point stays the same. The greater mass lengthens the period, \(2\pi\sqrt{\dfrac{m}{k}}\).

@ 7 | c | Energy in simple harmonic motion
Over one complete cycle of a spring–block oscillator, how does the time-averaged kinetic energy compare with the time-averaged spring potential energy?
* They are equal, each half of the total mechanical energy.
- The average kinetic energy is greater.
- The average potential energy is greater.
- The average kinetic energy is zero, because the block returns to rest.
= Kinetic energy is proportional to \(\sin^2\omega t\) and potential energy to \(\cos^2\omega t\), and each averages to one half over a full cycle. Their sum is constant.

@ 7 | c | Nonlinear restoring forces
A particle moves under a restoring force \(F=-kx^3\) instead of \(F=-kx\). How does the period of its oscillation depend on its amplitude?
* The period decreases as the amplitude increases.
- The period is independent of the amplitude.
- The period increases as the amplitude increases.
- The motion is not periodic.
= The force grows faster than linearly, so at larger amplitudes the particle is pushed back much harder and completes each cycle sooner; in fact the period is inversely proportional to the amplitude. Only a linear restoring force gives a period independent of amplitude.

@ 7 | c | Independence of period and amplitude
Two identical spring–block oscillators are released from rest at the same instant, one displaced \(2\text{ cm}\) and the other \(6\text{ cm}\) from equilibrium. Which block reaches its equilibrium position first?
* They reach it at the same time.
- The block released from \(2\text{ cm}\), because it has less distance to travel.
- The block released from \(6\text{ cm}\), because it moves faster.
- The block released from \(6\text{ cm}\), because the spring force on it is larger.
= In simple harmonic motion the period does not depend on amplitude, so both reach equilibrium a quarter period after release. The block with three times the distance to travel experiences three times the force and reaches three times the speed.
`;

module.exports = { source, figures };
