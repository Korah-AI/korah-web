// Source for korah-bot/ap/data/ap-physics-c-mechanics/mcqs.json. Run build.cjs to regenerate.
// Each block: "@ unit | c (conceptual) or q (quantitative) | skill | optional figure key",
// stem lines, "*" the correct choice, "-" three distractors, "=" the explanation.
// Math is LaTeX between \( and \). Figures shared with AP Physics 1 come from physics1.cjs.
const { graph } = require('./figures.cjs');
const { draw, spring } = require('./diagram.cjs');
const shared = require('./physics1.cjs').figures;

const figures = {
  xt: shared.xt, incline: shared.incline, tablePulley: shared.tablePulley, vertical: shared.vertical, loop: shared.loop, Ft: shared.Ft,
  sign: shared.sign, pulley: shared.pulley, putty: shared.putty, shm: shared.shm, inclineBall: shared.inclineBall,
  at: graph({ x: [0, 7], y: [-5, 5], xlabel: 't (s)', ylabel: 'a (m/s²)', curves: [{ pts: [[0, 4], [2, 4], [4, 0], [6, -4]] }], dots: [{ x: 0, y: 4 }, { x: 6, y: -4 }],
    alt: 'Acceleration versus time graph made of line segments joining (0 s, 4 m/s²), (2 s, 4 m/s²), (4 s, 0), and (6 s, −4 m/s²)' }),
  drag: graph({ x: [0, 10], y: [0, 25], xstep: 2, ystep: 5, xlabel: 't (s)', ylabel: 'v (m/s)', curves: [{ fn: t => 20 * (1 - Math.exp(-t / 2)), from: 0, to: 10 }, { pts: [[0, 20], [10, 20]], dash: true, color: '#ec4899' }],
    alt: 'Speed versus time graph for an object falling from rest with air resistance: the speed rises quickly at first and levels off, approaching a dashed horizontal line at 20 meters per second' }),
  Ucubic: graph({ x: [0, 4.5], y: [0, 6], xlabel: 'x (m)', ylabel: 'U (J)', curves: [{ fn: x => x ** 3 - 6 * x * x + 9 * x, from: 0, to: 4.19 }],
    alt: 'Potential energy versus position graph. The curve starts at 0 joules at x = 0, rises to a local maximum of 4 joules at x = 1 meter, falls to a local minimum of 0 joules at x = 3 meters, and rises again, reaching 4 joules at x = 4 meters' }),
  rodPivot: draw(340, 170, 'A uniform rod of length L held horizontally, attached to a fixed pivot at its left end', [
    ['hatch', 40, 30, 40, 140], ['rect', 40, 78, 240, 12, { fill: true }], ['circle', 46, 84, 4.5, { fill: 'currentColor' }], ['text', 44, 160, 'pivot', { italic: false, size: 11 }],
    ['line', 46, 112, 280, 112, { dash: true }], ['text', 163, 130, 'L'], ['text', 163, 68, 'M'],
  ]),
  dome: draw(340, 200, 'A small block at rest on top of a fixed, frictionless hemisphere of radius R that sits on the ground', [
    ['hatch', 30, 170, 310, 170], ['path', 'M70 170 A100 100 0 0 1 270 170 Z', { fill: true }], ['rect', 160, 54, 20, 16, { fill: true }],
    ['line', 170, 170, 240, 99, { dash: true }], ['text', 214, 146, 'R'],
  ]),
  orbit: draw(360, 210, 'A satellite in an elliptical orbit around a planet. The planet is at one focus. The closest point of the orbit is a distance r1 from the planet and the farthest point is a distance r2 from the planet', [
    ['path', 'M30 105 A150 85 0 1 0 330 105 A150 85 0 1 0 30 105', {}], ['circle', 96, 105, 13, { fill: true }], ['circle', 30, 105, 5, { fill: 'currentColor' }], ['circle', 330, 105, 5, { fill: 'currentColor' }],
    ['line', 43, 128, 83, 128, { dash: true }], ['text', 60, 146, 'r₁'], ['line', 109, 128, 322, 128, { dash: true }], ['text', 216, 146, 'r₂'], ['text', 96, 80, 'planet', { italic: false, size: 11 }],
  ]),
  conical: draw(340, 210, 'A conical pendulum: a ball on a string of length L moves in a horizontal circle while the string makes a constant angle theta with the vertical', [
    ['hatch', 230, 16, 110, 16], ['line', 170, 16, 170, 170, { dash: true }], ['line', 170, 16, 250, 150], ['circle', 250, 150, 11, { fill: true }],
    ['path', 'M90 150 A80 20 0 1 0 250 150 A80 20 0 1 0 90 150', { dash: true }], ['text', 186, 62, 'θ'], ['text', 224, 82, 'L'],
  ]),
  twoMass: draw(340, 140, 'Two blocks, each of mass m, connected by a spring of spring constant k and resting on a frictionless horizontal surface', [
    ['hatch', 20, 110, 320, 110], ['rect', 50, 70, 50, 40, { fill: true }], ['text', 75, 95, 'm'], spring(100, 240, 90), ['rect', 240, 70, 50, 40, { fill: true }], ['text', 265, 95, 'm'], ['text', 170, 66, 'k'],
  ]),
  hoop: draw(340, 210, 'A thin hoop of radius R hanging from a horizontal nail at its top edge, free to swing in its own plane', [
    ['hatch', 250, 14, 90, 14], ['line', 170, 14, 170, 38], ['circle', 170, 40, 4.5, { fill: 'currentColor' }], ['circle', 170, 115, 75, { width: 4 }],
    ['line', 170, 115, 235, 152, { dash: true }], ['text', 208, 122, 'R'], ['text', 200, 40, 'nail', { italic: false, size: 11 }],
  ]),
};

const source = String.raw`
@ 1 | q | Kinematics with derivatives
The position of a particle moving along the \(x\)-axis is \(x(t)=2t^3-9t^2+12t\), where \(x\) is in meters and \(t\) is in seconds. At what times is the particle momentarily at rest?
* \(t=1\text{ s}\) and \(t=2\text{ s}\)
- \(t=1.5\text{ s}\) only
- \(t=0\) and \(t=1.5\text{ s}\)
- \(t=2\text{ s}\) and \(t=3\text{ s}\)
= The velocity is \(v=\dfrac{dx}{dt}=6t^2-18t+12=6(t-1)(t-2)\), which is zero at \(t=1\text{ s}\) and \(t=2\text{ s}\). The time \(t=1.5\text{ s}\) is when the acceleration is zero.

@ 1 | q | Distance and displacement
The position of a particle moving along the \(x\)-axis is \(x(t)=2t^3-9t^2+12t\), where \(x\) is in meters and \(t\) is in seconds. What total distance does the particle travel between \(t=0\) and \(t=3\text{ s}\)?
* \(11\text{ m}\)
- \(9\text{ m}\)
- \(10\text{ m}\)
- \(18\text{ m}\)
= The particle reverses at \(t=1\text{ s}\) and \(t=2\text{ s}\). With \(x(0)=0\), \(x(1)=5\), \(x(2)=4\), and \(x(3)=9\text{ m}\), the distance is \(5+1+5=11\text{ m}\). The displacement is only \(9\text{ m}\).

@ 1 | q | Kinematics with integrals
A particle moves along the \(x\)-axis with acceleration \(a(t)=6t-4\), in \(\text{m/s}^2\). At \(t=0\) its velocity is \(2\text{ m/s}\) and its position is \(x=0\). What is its position at \(t=2\text{ s}\)?
* \(4\text{ m}\)
- \(6\text{ m}\)
- \(8\text{ m}\)
- \(0\)
= Integrating, \(v(t)=3t^2-4t+2\) and \(x(t)=t^3-2t^2+2t\). At \(t=2\text{ s}\), \(x=8-8+4=4\text{ m}\). Omitting the initial velocity gives \(0\).

@ 1 | q | Velocity as a function of position
The velocity of a particle moving along the \(x\)-axis depends on its position according to \(v=kx\), where \(k\) is a positive constant. What is the particle's acceleration as a function of \(x\)?
* \(k^2x\)
- \(k\)
- \(kx\)
- \(\tfrac{1}{2}k^2x^2\)
= By the chain rule, \(a=\dfrac{dv}{dt}=\dfrac{dv}{dx}\dfrac{dx}{dt}=v\dfrac{dv}{dx}=(kx)(k)=k^2x\). The derivative \(\dfrac{dv}{dx}=k\) alone is not the acceleration.

@ 1 | c | Interpreting an acceleration graph | at
A particle starts from rest at \(t=0\) and moves along a line with the acceleration shown in the graph. At what time is its speed greatest during the interval \(0\le t\le 6\text{ s}\)?
* \(t=4\text{ s}\)
- \(t=2\text{ s}\)
- \(t=6\text{ s}\)
- At every time from \(t=0\) to \(t=2\text{ s}\)
= The velocity keeps increasing as long as the acceleration is positive, which is until the graph crosses zero at \(t=4\text{ s}\). After that the acceleration is negative and the velocity, still positive, decreases. The acceleration is greatest before \(2\text{ s}\), but the velocity is not.

@ 1 | q | Interpreting an acceleration graph | at
A particle starts from rest at \(t=0\) and moves along a line with the acceleration shown in the graph. What is its velocity at \(t=6\text{ s}\)?
* \(8\text{ m/s}\)
- \(12\text{ m/s}\)
- \(16\text{ m/s}\)
- \(4\text{ m/s}\)
= The change in velocity is the signed area under the graph: \(8+4=12\text{ m/s}\) from \(0\) to \(4\text{ s}\), then \(-4\text{ m/s}\) from \(4\) to \(6\text{ s}\), for a total of \(8\text{ m/s}\).

@ 1 | q | Motion in two dimensions
The position of a projectile is \(\vec r(t)=(3t)\,\hat\imath+(4t-5t^2)\,\hat\jmath\), in meters, with \(t\) in seconds. What is the speed of the projectile at \(t=0.8\text{ s}\)?
* \(5\text{ m/s}\)
- \(3\text{ m/s}\)
- \(4\text{ m/s}\)
- \(7\text{ m/s}\)
= The velocity is \(\vec v=3\,\hat\imath+(4-10t)\,\hat\jmath\). At \(t=0.8\text{ s}\) this is \(3\,\hat\imath-4\,\hat\jmath\), with magnitude \(5\text{ m/s}\). The projectile has returned to its launch height and has its launch speed.

@ 1 | q | Motion in two dimensions
A particle starts from rest and has acceleration \(\vec a(t)=2\,\hat\imath-4t\,\hat\jmath\), in \(\text{m/s}^2\). What is its speed at \(t=1\text{ s}\)?
* \(2\sqrt{2}\text{ m/s}\)
- \(2\sqrt{5}\text{ m/s}\)
- \(4\text{ m/s}\)
- \(6\text{ m/s}\)
= Integrating each component from rest gives \(\vec v=2t\,\hat\imath-2t^2\,\hat\jmath\). At \(t=1\text{ s}\), \(\vec v=2\,\hat\imath-2\,\hat\jmath\), with magnitude \(2\sqrt{2}\text{ m/s}\). The value \(2\sqrt{5}\) is the magnitude of the acceleration at that time.

@ 1 | c | Acceleration on a curved path
A car travels around a curve at constant speed. Which statement about its acceleration is correct?
* It is perpendicular to the velocity and directed toward the inside of the curve.
- It is zero, because the speed is constant.
- It is parallel to the velocity, because the car is moving forward.
- It is directed away from the center of the curve.
= Acceleration is the rate of change of the velocity vector. At constant speed only the direction of the velocity changes, so the acceleration has no component along the velocity; it points toward the center of curvature.

@ 1 | q | Projectile motion
Two projectiles are launched from level ground with the same speed, one at \(30^\circ\) and one at \(60^\circ\) above the horizontal. Air resistance is negligible. What is the ratio of the time of flight of the \(60^\circ\) projectile to that of the \(30^\circ\) projectile?
* \(\sqrt{3}\)
- \(1\)
- \(2\)
- \(3\)
= The time of flight is \(\dfrac{2v_0\sin\theta}{g}\), so the ratio is \(\dfrac{\sin 60^\circ}{\sin 30^\circ}=\sqrt{3}\). The two projectiles have the same range, but not the same time of flight.

@ 1 | q | Kinematics with integrals
A boat's engine is shut off when the boat is moving at speed \(v_0\). Afterward its velocity is \(v(t)=v_0e^{-kt}\), where \(k\) is a positive constant. How far does the boat travel after the engine is shut off?
* \(\dfrac{v_0}{k}\)
- \(v_0k\)
- \(\dfrac{v_0}{2k}\)
- It travels an unlimited distance, because it never stops.
= The distance is \(\displaystyle\int_0^\infty v_0e^{-kt}\,dt=\dfrac{v_0}{k}\). Although the velocity never reaches exactly zero, the total distance is finite because the integral converges.

@ 1 | q | Acceleration from a position graph | xt
The graph shows the positions of carts A and B as functions of time. The curve for cart B is a parabola. What is the acceleration of cart B?
* \(1\text{ m/s}^2\)
- \(0.5\text{ m/s}^2\)
- \(2\text{ m/s}^2\)
- \(4\text{ m/s}^2\)
= Cart B starts from rest at the origin and is at \(x=8\text{ m}\) at \(t=4\text{ s}\). With \(x=\tfrac{1}{2}at^2\), \(8=\tfrac{1}{2}a(16)\), so \(a=1\text{ m/s}^2\). The value \(2\text{ m/s}\) is the constant speed of cart A.

@ 1 | q | Circular motion
A particle's position is \(\vec r(t)=R\cos(\omega t)\,\hat\imath+R\sin(\omega t)\,\hat\jmath\), where \(R\) and \(\omega\) are constants. Which expression gives its acceleration?
* \(-\omega^2\vec r\)
- \(\omega^2\vec r\)
- \(-\omega\vec r\)
- \(\vec 0\), because the speed is constant
= Differentiating twice gives \(\vec a=-\omega^2R\cos(\omega t)\,\hat\imath-\omega^2R\sin(\omega t)\,\hat\jmath=-\omega^2\vec r\). The acceleration has magnitude \(\omega^2R\) and points toward the center of the circle.

@ 1 | q | Nonuniform circular motion
A car starts from rest and travels around a circular track of radius \(R\) with speed \(v=bt\), where \(b\) is a constant. What is the magnitude of the car's acceleration at time \(t\)?
* \(\sqrt{b^2+\dfrac{b^4t^4}{R^2}}\)
- \(b\)
- \(\dfrac{b^2t^2}{R}\)
- \(b+\dfrac{b^2t^2}{R}\)
= The tangential component is \(\dfrac{dv}{dt}=b\) and the centripetal component is \(\dfrac{v^2}{R}=\dfrac{b^2t^2}{R}\). They are perpendicular, so the magnitude is the square root of the sum of their squares, not their sum.

@ 1 | c | Average and instantaneous velocity
An object moves along a line with constant, nonzero acceleration from time \(t_1\) to time \(t_2\). At which instant does its instantaneous velocity equal its average velocity for the interval?
* At the midpoint of the interval in time, \(\dfrac{t_1+t_2}{2}\)
- At the instant it reaches the midpoint of the distance traveled
- At no instant, because the velocity is always changing
- At both \(t_1\) and \(t_2\)
= With constant acceleration the velocity changes linearly in time, so its average over the interval is \(\dfrac{v_1+v_2}{2}\), which is the value it has halfway through the interval in time. The object reaches the spatial midpoint at a different instant.

@ 2 | q | Linear drag
An object of mass \(m\) is released from rest and falls subject to gravity and a drag force of magnitude \(bv\). Which expression gives its speed as a function of time?
* \(\dfrac{mg}{b}\left(1-e^{-bt/m}\right)\)
- \(\dfrac{mg}{b}e^{-bt/m}\)
- \(gt-\dfrac{b}{m}t^2\)
- \(\dfrac{mg}{b}\left(1-e^{-mt/b}\right)\)
= Newton's second law gives \(m\dfrac{dv}{dt}=mg-bv\). Separating variables and integrating from rest gives \(v=\dfrac{mg}{b}\left(1-e^{-bt/m}\right)\), which starts at zero and approaches the terminal speed \(\dfrac{mg}{b}\). The exponent must be dimensionless, which rules out \(e^{-mt/b}\).

@ 2 | c | Linear drag | drag
The graph shows the speed of an object falling from rest subject to gravity and a drag force proportional to its speed. What is the magnitude of the object's acceleration at the instant its speed is \(10\text{ m/s}\)?
* \(\dfrac{g}{2}\)
- \(g\)
- \(\dfrac{g}{4}\)
- \(0\)
= The terminal speed is \(20\text{ m/s}\), where the drag force equals the weight. Because drag is proportional to speed, at \(10\text{ m/s}\) it is half the weight, so the net force is \(\tfrac{1}{2}mg\) and the acceleration is \(\tfrac{1}{2}g\).

@ 2 | q | Quadratic drag
A skydiver of mass \(m\) experiences a drag force of magnitude \(cv^2\) and reaches terminal speed \(v_T\). A second skydiver with the same shape and drag coefficient \(c\) has mass \(4m\). What is the second skydiver's terminal speed?
* \(2v_T\)
- \(4v_T\)
- \(v_T\)
- \(16v_T\)
= At terminal speed \(cv^2=mg\), so \(v_T=\sqrt{\dfrac{mg}{c}}\). Quadrupling the mass doubles the terminal speed.

@ 2 | q | Linear drag
An object of mass \(m\) falls from rest subject to gravity and a drag force of magnitude \(bv\). At time \(t=\dfrac{m}{b}\), what fraction of its terminal speed has it reached?
* \(1-\dfrac{1}{e}\), about 63%
- \(\dfrac{1}{e}\), about 37%
- \(\dfrac{1}{2}\)
- \(1\)
= The speed is \(v_T\left(1-e^{-bt/m}\right)\). At \(t=\dfrac{m}{b}\) the exponent is \(-1\), so \(v=v_T\left(1-e^{-1}\right)\approx 0.63\,v_T\). The quantity \(\dfrac{m}{b}\) is the time constant of the motion.

@ 2 | q | Time-dependent forces
A \(2\text{ kg}\) object at rest at the origin is acted on by a net force \(F(t)=6t\), in newtons, along the \(x\)-axis. What is its position at \(t=2\text{ s}\)?
* \(4\text{ m}\)
- \(6\text{ m}\)
- \(8\text{ m}\)
- \(12\text{ m}\)
= The acceleration is \(a=3t\), so \(v=\tfrac{3}{2}t^2\) and \(x=\tfrac{1}{2}t^3\). At \(t=2\text{ s}\), \(x=4\text{ m}\). The velocity at that time is \(6\text{ m/s}\).

@ 2 | q | Banked curves
A car rounds a banked curve of radius \(r\) at speed \(v\). At what banking angle \(\theta\), measured from the horizontal, can the car make the turn with no friction force from the road?
* \(\tan\theta=\dfrac{v^2}{rg}\)
- \(\sin\theta=\dfrac{v^2}{rg}\)
- \(\tan\theta=\dfrac{rg}{v^2}\)
- \(\cos\theta=\dfrac{v^2}{rg}\)
= With no friction, the vertical component of the normal force balances gravity, \(N\cos\theta=mg\), and its horizontal component supplies the centripetal force, \(N\sin\theta=\dfrac{mv^2}{r}\). Dividing gives \(\tan\theta=\dfrac{v^2}{rg}\).

@ 2 | q | Circular motion | conical
A ball on a string of length \(L\) moves in a horizontal circle, with the string making a constant angle \(\theta\) with the vertical, as shown. What is the period of the motion?
* \(2\pi\sqrt{\dfrac{L\cos\theta}{g}}\)
- \(2\pi\sqrt{\dfrac{L}{g}}\)
- \(2\pi\sqrt{\dfrac{L\sin\theta}{g}}\)
- \(2\pi\sqrt{\dfrac{L}{g\cos\theta}}\)
= Vertically, \(T\cos\theta=mg\). Horizontally, \(T\sin\theta=m\omega^2(L\sin\theta)\), so \(T=m\omega^2L\). Combining, \(\omega^2=\dfrac{g}{L\cos\theta}\), and the period is \(\dfrac{2\pi}{\omega}\).

@ 2 | q | Orbital motion
A moon orbits a planet in a circular orbit of radius \(r\) with period \(T\). A second moon orbits the same planet in a circular orbit with period \(8T\). What is the radius of the second moon's orbit?
* \(4r\)
- \(2r\)
- \(8r\)
- \(16r\)
= For circular orbits around the same body, \(T^2\propto r^3\). Multiplying the period by 8 multiplies \(T^2\) by 64, so \(r^3\) increases by a factor of 64 and \(r\) by a factor of 4.

@ 2 | q | Accelerating reference frames | incline
A block rests on a frictionless wedge inclined at angle \(\theta\), as shown. The wedge is pushed horizontally so that the block does not slide along the incline. What is the magnitude of the wedge's acceleration?
* \(g\tan\theta\)
- \(g\sin\theta\)
- \(g\cos\theta\)
- \(\dfrac{g}{\tan\theta}\)
= The only forces on the block are gravity and the normal force. Vertically, \(N\cos\theta=mg\); horizontally, \(N\sin\theta=ma\). Dividing gives \(a=g\tan\theta\). The value \(g\sin\theta\) is the acceleration down the incline when the wedge is at rest.

@ 2 | q | Tension in a massive rope
A uniform rope of mass \(M\) and length \(L\) hangs vertically from a ceiling. What is the tension in the rope at a point a distance \(y\) above its lower end?
* \(\dfrac{Mgy}{L}\)
- \(Mg\)
- \(\dfrac{Mg(L-y)}{L}\)
- \(\dfrac{Mg}{2}\)
= Each point of the rope supports the weight of the rope below it. The portion below has mass \(\dfrac{My}{L}\), so the tension is \(\dfrac{Mgy}{L}\), increasing from zero at the bottom to \(Mg\) at the ceiling.

@ 2 | q | Connected objects with friction | tablePulley
Block \(m_1\) slides on a table with coefficient of kinetic friction \(\mu_k\) and is connected by a light string over a light, frictionless pulley to hanging block \(m_2\), which is descending, as shown. What is the magnitude of the acceleration of the blocks?
* \(\dfrac{\left(m_2-\mu_km_1\right)g}{m_1+m_2}\)
- \(\dfrac{\left(m_2-\mu_km_1\right)g}{m_2}\)
- \(\dfrac{m_2g}{m_1+m_2}-\mu_kg\)
- \(\dfrac{\left(m_2-m_1\right)g}{m_1+m_2}\)
= Treating the two blocks as one system, the net force along the direction of motion is \(m_2g-\mu_km_1g\) and the total mass is \(m_1+m_2\). The friction force acts only on \(m_1\), but both blocks must be accelerated.

@ 2 | q | Circular motion in a vertical plane | vertical
A ball on a string of length \(R\) moves in a vertical circle, as shown. What is the minimum speed the ball must have at the bottom of the circle in order to complete the circle with the string taut?
* \(\sqrt{5gR}\)
- \(\sqrt{gR}\)
- \(2\sqrt{gR}\)
- \(\sqrt{3gR}\)
= At the top the string just stays taut when gravity alone provides the centripetal force, so \(v_{\text{top}}^2=gR\). Energy conservation gives \(v_{\text{bottom}}^2=v_{\text{top}}^2+4gR=5gR\). A speed of \(2\sqrt{gR}\) would bring the ball to the top with zero speed, which a string cannot support.

@ 2 | q | Linear drag
A puck of mass \(m\) slides on a horizontal surface with initial speed \(v_0\). The only horizontal force on it is a drag force of magnitude \(bv\). How far does the puck travel before coming to rest?
* \(\dfrac{mv_0}{b}\)
- \(\dfrac{mv_0^2}{2b}\)
- \(\dfrac{bv_0}{m}\)
- \(\dfrac{mv_0}{2b}\)
= From \(m\dfrac{dv}{dt}=-bv\) and \(\dfrac{dv}{dt}=v\dfrac{dv}{dx}\), \(m\,dv=-b\,dx\). Integrating from \(v_0\) to \(0\) gives \(x=\dfrac{mv_0}{b}\). Equivalently, \(v=v_0e^{-bt/m}\) integrates to the same distance.

@ 2 | c | Equations of motion
An object of mass \(m\) falls vertically subject to gravity and a drag force whose magnitude is proportional to the square of its speed, with constant of proportionality \(c\). Taking downward as positive, which differential equation describes its motion?
* \(m\dfrac{dv}{dt}=mg-cv^2\)
- \(m\dfrac{dv}{dt}=mg+cv^2\)
- \(m\dfrac{dv}{dt}=cv^2-mg\)
- \(m\dfrac{dv}{dt}=mg-cv\)
= With downward positive, gravity contributes \(+mg\) and drag, which opposes the downward motion, contributes \(-cv^2\). Setting \(\dfrac{dv}{dt}=0\) gives the terminal speed \(\sqrt{\dfrac{mg}{c}}\).

@ 2 | q | Gravitation inside a planet
A planet of radius \(R\) has uniform density, and the gravitational field strength at its surface is \(g_s\). What is the gravitational field strength at a distance \(\dfrac{R}{2}\) from the planet's center?
* \(\dfrac{g_s}{2}\)
- \(4g_s\)
- \(\dfrac{g_s}{4}\)
- \(2g_s\)
= Only the mass inside radius \(r\) contributes to the field there, and that mass is proportional to \(r^3\). The field is \(\dfrac{GM_{\text{enc}}}{r^2}\propto r\), so at half the radius it is half the surface value. The inverse-square result \(4g_s\) applies only outside the planet.

@ 3 | q | Work by a variable force
A particle moves along the \(x\)-axis from \(x=0\) to \(x=2\text{ m}\) under a force \(F(x)=3x^2-2x\), in newtons. How much work does the force do on the particle?
* \(4\text{ J}\)
- \(8\text{ J}\)
- \(10\text{ J}\)
- \(12\text{ J}\)
= \(W=\displaystyle\int_0^2\left(3x^2-2x\right)dx=\left[x^3-x^2\right]_0^2=8-4=4\text{ J}\). Multiplying the force at \(x=2\text{ m}\), which is \(8\text{ N}\), by a distance is not valid for a force that varies.

@ 3 | c | Potential energy and equilibrium | Ucubic
The graph shows the potential energy \(U(x)=x^3-6x^2+9x\), in joules, of a system as a function of the position \(x\), in meters, of a particle. At which position is the particle in stable equilibrium?
* \(x=3\text{ m}\)
- \(x=1\text{ m}\)
- \(x=0\)
- \(x=2\text{ m}\)
= Equilibrium occurs where \(F=-\dfrac{dU}{dx}=0\), at \(x=1\text{ m}\) and \(x=3\text{ m}\). At the minimum, \(x=3\text{ m}\), a small displacement produces a force back toward equilibrium, so it is stable. The maximum at \(x=1\text{ m}\) is an unstable equilibrium.

@ 3 | q | Force from potential energy | Ucubic
The graph shows the potential energy \(U(x)=x^3-6x^2+9x\), in joules, of a system as a function of the position \(x\), in meters, of a particle. What force acts on the particle at \(x=2\text{ m}\)?
* \(3\text{ N}\) in the \(+x\) direction
- \(3\text{ N}\) in the \(-x\) direction
- \(2\text{ N}\) in the \(+x\) direction
- \(0\)
= \(F=-\dfrac{dU}{dx}=-\left(3x^2-12x+9\right)\). At \(x=2\text{ m}\), \(F=-(12-24+9)=+3\text{ N}\). The potential energy decreases toward larger \(x\) there, so the force points in the \(+x\) direction.

@ 3 | q | Turning points | Ucubic
The graph shows the potential energy \(U(x)=x^3-6x^2+9x\), in joules, of a system as a function of the position \(x\), in meters, of a particle. The particle is released from rest at \(x=2\text{ m}\), and no other forces do work. Between which positions does it move?
* Between \(x=2\text{ m}\) and about \(x=3.7\text{ m}\)
- Between \(x=1\text{ m}\) and \(x=3\text{ m}\)
- Between \(x=2\text{ m}\) and \(x=4\text{ m}\)
- From \(x=2\text{ m}\) toward \(x=0\), where the potential energy is zero
= The total energy is \(U(2)=2\text{ J}\). The force at \(x=2\text{ m}\) is in the \(+x\) direction, so the particle moves through the minimum and stops where \(U\) again equals \(2\text{ J}\). Solving \(x^3-6x^2+9x=2\) gives \((x-2)(x^2-4x+1)=0\), so the far turning point is \(x=2+\sqrt{3}\approx 3.7\text{ m}\).

@ 3 | q | Power
A force \(\vec F=2\,\hat\imath+3\,\hat\jmath\), in newtons, acts on a particle moving with velocity \(\vec v=4\,\hat\imath-\hat\jmath\), in meters per second. What is the instantaneous power delivered by the force?
* \(5\text{ W}\)
- \(11\text{ W}\)
- \(14\text{ W}\)
- \(\sqrt{13}\sqrt{17}\text{ W}\)
= Power is the dot product \(\vec F\cdot\vec v=(2)(4)+(3)(-1)=5\text{ W}\). Multiplying the magnitudes ignores the angle between the vectors.

@ 3 | q | Motion at constant power
An engine delivers constant power \(P\) to a car of mass \(m\) that starts from rest on a level road. Resistive forces are negligible. Which expression gives the distance the car has traveled at time \(t\)?
* \(\dfrac{2}{3}\sqrt{\dfrac{2P}{m}}\,t^{3/2}\)
- \(\sqrt{\dfrac{2P}{m}}\,t^{1/2}\)
- \(\dfrac{P}{2m}t^2\)
- \(\dfrac{1}{2}\sqrt{\dfrac{2P}{m}}\,t^{2}\)
= The work done, \(Pt\), equals the kinetic energy, so \(v=\sqrt{\dfrac{2Pt}{m}}\). Integrating, \(x=\sqrt{\dfrac{2P}{m}}\cdot\dfrac{2}{3}t^{3/2}\). The acceleration is not constant, so \(x\) is not proportional to \(t^2\).

@ 3 | q | Potential energy of a nonlinear spring
A spring exerts a restoring force \(F(x)=-kx-\beta x^3\) when stretched a distance \(x\) from equilibrium, where \(k\) and \(\beta\) are positive constants. Taking \(U=0\) at \(x=0\), what is the potential energy stored in the spring?
* \(\tfrac{1}{2}kx^2+\tfrac{1}{4}\beta x^4\)
- \(\tfrac{1}{2}kx^2+\tfrac{1}{3}\beta x^3\)
- \(kx+3\beta x^2\)
- \(-\tfrac{1}{2}kx^2-\tfrac{1}{4}\beta x^4\)
= \(U(x)=-\displaystyle\int_0^xF\,dx'=\int_0^x\left(kx'+\beta x'^3\right)dx'=\tfrac{1}{2}kx^2+\tfrac{1}{4}\beta x^4\). The potential energy is positive because work must be done against the restoring force.

@ 3 | q | Gravitational potential energy
A projectile is launched straight up from the surface of a planet of radius \(R\) with half the planet's escape speed. The planet has no atmosphere and does not rotate. What maximum height above the surface does the projectile reach?
* \(\dfrac{R}{3}\)
- \(\dfrac{R}{4}\)
- \(\dfrac{R}{2}\)
- \(R\)
= The escape speed satisfies \(v_e^2=\dfrac{2GM}{R}\), so the launch speed has \(v^2=\dfrac{GM}{2R}\). Energy conservation, \(\tfrac{1}{2}v^2-\dfrac{GM}{R}=-\dfrac{GM}{r}\), gives \(\dfrac{GM}{r}=\dfrac{3GM}{4R}\), so \(r=\dfrac{4R}{3}\) and the height is \(\dfrac{R}{3}\). Using \(mgh\) with constant \(g\) gives \(\dfrac{R}{4}\).

@ 3 | q | Orbital energy
A satellite of mass \(m\) is in a circular orbit of radius \(r\) around a planet of mass \(M\). How much energy must be added to move it to a circular orbit of radius \(2r\)?
* \(\dfrac{GMm}{4r}\)
- \(\dfrac{GMm}{2r}\)
- \(\dfrac{GMm}{r}\)
- \(-\dfrac{GMm}{4r}\)
= In a circular orbit the total mechanical energy is \(E=-\dfrac{GMm}{2r}\). The change is \(-\dfrac{GMm}{4r}-\left(-\dfrac{GMm}{2r}\right)=\dfrac{GMm}{4r}\). The potential energy rises by \(\dfrac{GMm}{2r}\), but the kinetic energy falls by half that amount.

@ 3 | c | Conservative forces
Which of the following is a property of every conservative force?
* The work it does on an object that moves around any closed path is zero.
- It does no work on an object that moves along a straight line.
- It always acts opposite to the object's velocity.
- Its magnitude is the same at every position.
= The work done by a conservative force depends only on the starting and ending positions, so it is zero around any closed path and a potential energy function can be defined. Kinetic friction fails this test, because it does negative work over every part of a round trip.

@ 3 | q | Energy and circular motion | loop
A small block is released from rest at height \(h=\dfrac{5}{2}R\) on the frictionless track shown. What is the magnitude of the normal force exerted on the block by the track as the block first passes the bottom of the loop?
* \(6mg\)
- \(5mg\)
- \(mg\)
- \(4mg\)
= At the bottom, \(v^2=2gh=5gR\). The normal force must both support the block and supply the centripetal force: \(N=mg+\dfrac{mv^2}{R}=mg+5mg=6mg\).

@ 3 | q | Energy and circular motion | dome
A small block is given a slight push from rest at the top of the fixed, frictionless hemisphere shown. At what height above the ground does the block lose contact with the hemisphere?
* \(\dfrac{2}{3}R\)
- \(\dfrac{1}{2}R\)
- \(\dfrac{1}{3}R\)
- \(\dfrac{3}{4}R\)
= At angle \(\theta\) from the vertical, energy conservation gives \(v^2=2gR(1-\cos\theta)\). Contact is lost when the normal force is zero: \(mg\cos\theta=\dfrac{mv^2}{R}\). Then \(\cos\theta=2(1-\cos\theta)\), so \(\cos\theta=\dfrac{2}{3}\) and the height is \(R\cos\theta=\dfrac{2}{3}R\).

@ 3 | q | Work by a variable friction force
A block moving with speed \(v_0\) enters a rough horizontal region where the coefficient of kinetic friction increases with the distance \(x\) traveled into the region according to \(\mu_k=bx\), where \(b\) is a constant. How far into the region does the block slide before stopping?
* \(\dfrac{v_0}{\sqrt{bg}}\)
- \(\dfrac{v_0^2}{2bg}\)
- \(\dfrac{v_0^2}{bg}\)
- \(\dfrac{v_0}{\sqrt{2bg}}\)
= The friction force is \(bxmg\), so the work it does over a distance \(d\) is \(-\displaystyle\int_0^dbmgx\,dx=-\tfrac{1}{2}bmgd^2\). Setting its magnitude equal to \(\tfrac{1}{2}mv_0^2\) gives \(d=\dfrac{v_0}{\sqrt{bg}}\).

@ 3 | q | Power and drag
At its top speed on a level road, a car's engine power is used entirely to overcome a drag force proportional to the square of the car's speed. By what factor must the engine power increase to double the top speed?
* 8
- 2
- 4
- 16
= At constant speed the driving force equals the drag force, so \(P=Fv\propto v^2\cdot v=v^3\). Doubling the speed requires \(2^3=8\) times the power.

@ 4 | q | Impulse by integration
A \(4\text{ kg}\) object at rest is acted on by a net force \(F(t)=12t-3t^2\), in newtons, from \(t=0\) to \(t=4\text{ s}\). What is its speed at \(t=4\text{ s}\)?
* \(8\text{ m/s}\)
- \(32\text{ m/s}\)
- \(12\text{ m/s}\)
- \(0\)
= The impulse is \(\displaystyle\int_0^4\left(12t-3t^2\right)dt=\left[6t^2-t^3\right]_0^4=96-64=32\text{ N}\cdot\text{s}\). Dividing by the mass gives \(8\text{ m/s}\). The force is zero at \(t=4\text{ s}\), but the momentum it has delivered is not.

@ 4 | q | Center of mass by integration
A thin rod of length \(L\) lies along the \(x\)-axis from \(x=0\) to \(x=L\). Its linear mass density is \(\lambda(x)=cx\), where \(c\) is a constant. Where is the rod's center of mass?
* \(x=\dfrac{2L}{3}\)
- \(x=\dfrac{L}{2}\)
- \(x=\dfrac{3L}{4}\)
- \(x=\dfrac{L}{3}\)
= \(x_{\text{cm}}=\dfrac{\int_0^Lx\,(cx)\,dx}{\int_0^Lcx\,dx}=\dfrac{cL^3/3}{cL^2/2}=\dfrac{2L}{3}\). The rod is denser toward \(x=L\), so the center of mass lies beyond the midpoint.

@ 4 | q | Center of mass
Three particles are located in the \(xy\)-plane: mass \(m\) at the origin, mass \(2m\) at \((3\text{ m},0)\), and mass \(3m\) at \((0,4\text{ m})\). What are the coordinates of the center of mass?
* \((1\text{ m},2\text{ m})\)
- \((1\text{ m},\tfrac{4}{3}\text{ m})\)
- \((2\text{ m},1\text{ m})\)
- \((1.5\text{ m},2\text{ m})\)
= \(x_{\text{cm}}=\dfrac{(2m)(3)}{6m}=1\text{ m}\) and \(y_{\text{cm}}=\dfrac{(3m)(4)}{6m}=2\text{ m}\). Each coordinate is a mass-weighted average that includes the particle at the origin in the total mass.

@ 4 | q | Rocket propulsion
A rocket in deep space ejects exhaust at speed \(v_{\text{ex}}\) relative to the rocket. It starts from rest and burns fuel until its mass is \(\dfrac{1}{e^2}\) of its initial mass. What is its final speed?
* \(2v_{\text{ex}}\)
- \(v_{\text{ex}}\)
- \(e^2v_{\text{ex}}\)
- \(\left(1-\dfrac{1}{e^2}\right)v_{\text{ex}}\)
= Momentum conservation for the rocket and its exhaust gives \(\Delta v=v_{\text{ex}}\ln\dfrac{m_0}{m}\). With \(\dfrac{m_0}{m}=e^2\), \(\Delta v=2v_{\text{ex}}\). A rocket can exceed its exhaust speed.

@ 4 | c | Rocket propulsion
A rocket fires its engine in deep space, far from any other objects. Which statement about the system consisting of the rocket and all of the exhaust it has ejected is correct?
* The center of mass of the system continues to move with the velocity it had before the engine fired.
- The center of mass of the system accelerates in the direction the rocket moves.
- The total momentum of the system increases as the rocket speeds up.
- The total kinetic energy of the system stays constant.
= No external force acts on the system, so its total momentum and the velocity of its center of mass do not change. The rocket gains forward momentum and the exhaust gains equal backward momentum. Kinetic energy increases as chemical energy is released.

@ 4 | q | Elastic collisions
A block of mass \(m\) moving with speed \(v\) collides elastically and head-on with a block of mass \(3m\) that is at rest. What fraction of the first block's kinetic energy is transferred to the second block?
* \(\dfrac{3}{4}\)
- \(\dfrac{1}{4}\)
- \(\dfrac{1}{2}\)
- \(\dfrac{9}{16}\)
= The struck block leaves with speed \(\dfrac{2m}{m+3m}v=\dfrac{v}{2}\), so its kinetic energy is \(\tfrac{1}{2}(3m)\dfrac{v^2}{4}=\dfrac{3}{4}\left(\tfrac{1}{2}mv^2\right)\). In general the fraction transferred is \(\dfrac{4m_1m_2}{(m_1+m_2)^2}\), which is greatest when the masses are equal.

@ 4 | q | Variable mass
An open cart of mass \(M\) rolls without friction at speed \(v_0\). Sand is dropped vertically into the cart until a mass \(m\) of sand has collected. What is the speed of the cart afterward?
* \(\dfrac{M}{M+m}v_0\)
- \(v_0\)
- \(\sqrt{\dfrac{M}{M+m}}\,v_0\)
- \(\dfrac{M-m}{M}v_0\)
= The sand arrives with no horizontal momentum, and no horizontal external force acts, so \(Mv_0=(M+m)v\). Kinetic energy is not conserved, because the sand comes to rest relative to the cart through friction; assuming it is gives the square-root expression.

@ 4 | q | Force from a stream of matter
A horizontal jet of water with density \(\rho\), cross-sectional area \(A\), and speed \(v\) strikes a wall and runs straight down the wall without splashing back. What is the magnitude of the force the water exerts on the wall?
* \(\rho Av^2\)
- \(\rho Av\)
- \(\tfrac{1}{2}\rho Av^2\)
- \(2\rho Av^2\)
= Mass reaches the wall at the rate \(\dfrac{dm}{dt}=\rho Av\), and each bit of water loses horizontal momentum \(v\) per unit mass. The force is the rate of change of momentum, \(\rho Av\cdot v=\rho Av^2\). If the water rebounded at speed \(v\), the force would be twice as large.

@ 4 | q | Impulse and average force | Ft
The graph shows the net force exerted on an object as a function of time. What is the average net force on the object during the interval from \(t=0\) to \(t=6\text{ s}\)?
* About \(27\text{ N}\)
- \(40\text{ N}\)
- \(20\text{ N}\)
- About \(13\text{ N}\)
= The average force is the impulse divided by the time. The impulse is the area under the graph, \(40+80+40=160\text{ N}\cdot\text{s}\), so the average is \(\dfrac{160}{6}\approx 27\text{ N}\).

@ 4 | q | Center of mass and explosions
A projectile is launched over level ground and would land a horizontal distance \(R\) from the launch point. At the top of its path it explodes into two pieces of equal mass. One piece is brought to rest by the explosion and falls straight down. How far from the launch point does the other piece land?
* \(\dfrac{3R}{2}\)
- \(R\)
- \(2R\)
- \(\dfrac{5R}{4}\)
= The explosion is internal, so the center of mass still lands at \(R\). Both pieces land at the same time, because the explosion gives them no vertical velocity. One lands at \(\dfrac{R}{2}\), so the other must land at \(\dfrac{3R}{2}\) for the midpoint to be at \(R\).

@ 4 | q | Inelastic collisions with a surface
A ball is dropped from height \(h\) onto a floor. In each bounce it leaves the floor with half the speed it had just before impact. Air resistance is negligible. To what maximum height does it rise after its second bounce?
* \(\dfrac{h}{16}\)
- \(\dfrac{h}{4}\)
- \(\dfrac{h}{8}\)
- \(\dfrac{h}{2}\)
= The maximum height is proportional to the square of the speed leaving the floor. Each bounce halves the speed and so reduces the height to one fourth. After two bounces the height is \(\dfrac{h}{16}\).

@ 4 | c | Center-of-mass frame
Two objects collide elastically. In the reference frame of their center of mass, which statement describes the collision?
* The total momentum is zero, and each object leaves with the same speed it had before the collision.
- The total momentum is zero, and both objects are at rest after the collision.
- The total kinetic energy is zero before and after the collision.
- Each object's velocity is unchanged by the collision.
= In the center-of-mass frame the momenta are always equal and opposite. For the kinetic energy to be conserved as well, the magnitudes of the momenta cannot change, so each object keeps its speed and only its direction of motion changes. If both objects came to rest, the collision would be perfectly inelastic.

@ 4 | q | Momentum and energy | twoMass
Two blocks of mass \(m\) connected by a spring of spring constant \(k\) rest on a frictionless surface, as shown, with the spring at its natural length. One block is suddenly given a velocity \(v\) toward the other. What is the maximum compression of the spring?
* \(v\sqrt{\dfrac{m}{2k}}\)
- \(v\sqrt{\dfrac{m}{k}}\)
- \(v\sqrt{\dfrac{2m}{k}}\)
- \(\dfrac{v}{2}\sqrt{\dfrac{m}{k}}\)
= At maximum compression the blocks have the same velocity, \(\dfrac{v}{2}\), by momentum conservation. The kinetic energy is then \(\tfrac{1}{2}(2m)\left(\tfrac{v}{2}\right)^2=\tfrac{1}{4}mv^2\), so \(\tfrac{1}{2}kx^2=\tfrac{1}{2}mv^2-\tfrac{1}{4}mv^2\) and \(x=v\sqrt{\dfrac{m}{2k}}\). Assuming all of the kinetic energy is stored gives \(v\sqrt{\dfrac{m}{k}}\).

@ 4 | c | Collisions in two dimensions
A puck sliding on frictionless ice strikes an identical puck at rest in a glancing, elastic collision. What is the angle between the velocities of the two pucks after the collision?
* \(90^\circ\)
- \(45^\circ\)
- \(180^\circ\)
- It depends on the initial speed of the moving puck.
= With equal masses, momentum conservation gives \(\vec v=\vec v_1+\vec v_2\) and energy conservation gives \(v^2=v_1^2+v_2^2\). Squaring the first equation and comparing shows \(\vec v_1\cdot\vec v_2=0\), so the final velocities are perpendicular.

@ 5 | q | Rotational inertia by integration
A thin rod of mass \(M\) and length \(L\) lies along the \(x\)-axis from \(x=0\) to \(x=L\), with linear mass density \(\lambda(x)=cx\). What is its rotational inertia about an axis through \(x=0\) perpendicular to the rod?
* \(\dfrac{1}{2}ML^2\)
- \(\dfrac{1}{3}ML^2\)
- \(\dfrac{1}{4}ML^2\)
- \(\dfrac{2}{3}ML^2\)
= The mass is \(M=\displaystyle\int_0^Lcx\,dx=\dfrac{cL^2}{2}\), and \(I=\displaystyle\int_0^Lx^2(cx)\,dx=\dfrac{cL^4}{4}=\dfrac{1}{2}ML^2\). It exceeds the uniform-rod value \(\dfrac{1}{3}ML^2\) because more of the mass is far from the axis.

@ 5 | q | Parallel-axis theorem
A uniform disk of mass \(M\) and radius \(R\) has rotational inertia \(\tfrac{1}{2}MR^2\) about the axis through its center perpendicular to its face. What is its rotational inertia about a parallel axis through a point on its rim?
* \(\dfrac{3}{2}MR^2\)
- \(MR^2\)
- \(\dfrac{1}{2}MR^2\)
- \(2MR^2\)
= The parallel-axis theorem gives \(I=I_{\text{cm}}+Md^2=\tfrac{1}{2}MR^2+MR^2=\dfrac{3}{2}MR^2\), where \(d=R\) is the distance between the axes.

@ 5 | q | Rotational dynamics | pulley
The pulley shown is a uniform disk of mass \(M\) and radius \(R\), with rotational inertia \(\tfrac{1}{2}MR^2\), on a frictionless axle. Suppose the string passes over the pulley without slipping and supports a block of mass \(m_1\) on one side and a block of mass \(m_2>m_1\) on the other. What is the magnitude of the blocks' acceleration?
* \(\dfrac{\left(m_2-m_1\right)g}{m_1+m_2+\tfrac{1}{2}M}\)
- \(\dfrac{\left(m_2-m_1\right)g}{m_1+m_2}\)
- \(\dfrac{\left(m_2-m_1\right)g}{m_1+m_2+M}\)
- \(\dfrac{\left(m_2-m_1\right)g}{m_1+m_2+2M}\)
= For the blocks, \(m_2g-T_2=m_2a\) and \(T_1-m_1g=m_1a\). For the pulley, \((T_2-T_1)R=\tfrac{1}{2}MR^2\dfrac{a}{R}\). Adding the equations gives \((m_2-m_1)g=\left(m_1+m_2+\tfrac{1}{2}M\right)a\). The pulley adds an effective inertia of \(\dfrac{I}{R^2}\).

@ 5 | q | Torque as a vector
A force \(\vec F=3\,\hat\imath+4\,\hat\jmath\), in newtons, acts at the point \(\vec r=2\,\hat\imath\), in meters, relative to the origin. What is the torque about the origin?
* \(8\,\hat k\text{ N}\cdot\text{m}\)
- \(6\,\hat k\text{ N}\cdot\text{m}\)
- \(10\,\hat k\text{ N}\cdot\text{m}\)
- \(-8\,\hat k\text{ N}\cdot\text{m}\)
= \(\vec\tau=\vec r\times\vec F=(2\,\hat\imath)\times(3\,\hat\imath+4\,\hat\jmath)=8\,(\hat\imath\times\hat\jmath)=8\,\hat k\). The component of the force along \(\vec r\) contributes nothing.

@ 5 | q | Rotational kinematics
A wheel has angular acceleration \(\alpha(t)=6t\), in \(\text{rad/s}^2\), and an angular velocity of \(2\text{ rad/s}\) at \(t=0\). Through what angle does it turn between \(t=0\) and \(t=2\text{ s}\)?
* \(12\text{ rad}\)
- \(8\text{ rad}\)
- \(14\text{ rad}\)
- \(28\text{ rad}\)
= Integrating, \(\omega(t)=3t^2+2\) and \(\theta(t)=t^3+2t\). At \(t=2\text{ s}\), \(\theta=8+4=12\text{ rad}\). The angular velocity at that time is \(14\text{ rad/s}\).

@ 5 | q | Rotational dynamics | rodPivot
A uniform rod of mass \(M\) and length \(L\), with rotational inertia \(\tfrac{1}{3}ML^2\) about its end, is held horizontally and released, as shown. What is the magnitude of the linear acceleration of the free end of the rod immediately after release?
* \(\dfrac{3}{2}g\)
- \(g\)
- \(\dfrac{3}{4}g\)
- \(\dfrac{1}{2}g\)
= The torque about the pivot is \(Mg\dfrac{L}{2}\), so \(\alpha=\dfrac{MgL/2}{ML^2/3}=\dfrac{3g}{2L}\). The free end has acceleration \(\alpha L=\dfrac{3}{2}g\), which is greater than \(g\). The center of mass has acceleration \(\dfrac{3}{4}g\).

@ 5 | c | Rotational dynamics | rodPivot
A coin rests on the rod shown, at the free end, and the rod is released from rest in the horizontal position. Which statement describes what happens immediately after release?
* The coin loses contact with the rod, because the end of the rod accelerates downward faster than \(g\).
- The coin stays in contact with the rod, because both fall with acceleration \(g\).
- The coin stays in contact with the rod, because the rod accelerates more slowly than \(g\).
- The coin slides toward the pivot, because the rod tilts.
= Points on the rod at a distance \(r\) from the pivot have acceleration \(\alpha r=\dfrac{3g}{2L}r\). This exceeds \(g\) for \(r>\dfrac{2L}{3}\), so the end of the rod falls away from the coin, which can accelerate at no more than \(g\).

@ 5 | q | Rolling without slipping | inclineBall
A uniform solid sphere, with rotational inertia \(\tfrac{2}{5}MR^2\), rolls without slipping down a ramp inclined at angle \(\theta\), as shown. What is the minimum coefficient of static friction required?
* \(\dfrac{2}{7}\tan\theta\)
- \(\dfrac{5}{7}\tan\theta\)
- \(\dfrac{2}{5}\tan\theta\)
- \(\tan\theta\)
= The equations \(Mg\sin\theta-f=Ma\) and \(fR=\tfrac{2}{5}MR^2\dfrac{a}{R}\) give \(a=\dfrac{5}{7}g\sin\theta\) and \(f=\dfrac{2}{7}Mg\sin\theta\). Requiring \(f\le\mu_sMg\cos\theta\) gives \(\mu_s\ge\dfrac{2}{7}\tan\theta\).

@ 5 | q | Rotational dynamics with a resistive torque
A flywheel with rotational inertia \(I\) spins with angular velocity \(\omega_0\). At \(t=0\) the only torque on it becomes a resistive torque of magnitude \(b\omega\), where \(b\) is a constant. Which expression gives its angular velocity at later times?
* \(\omega_0e^{-bt/I}\)
- \(\omega_0-\dfrac{b}{I}t\)
- \(\omega_0e^{-It/b}\)
- \(\dfrac{\omega_0}{1+bt/I}\)
= \(I\dfrac{d\omega}{dt}=-b\omega\) separates to \(\dfrac{d\omega}{\omega}=-\dfrac{b}{I}dt\), which integrates to \(\omega=\omega_0e^{-bt/I}\). A linear decrease would require a constant torque.

@ 5 | q | Static equilibrium | sign
A uniform horizontal rod of mass \(M\) is attached to a wall by a hinge and supported by a cable at \(30^\circ\) to the rod, as shown. A sign of mass \(M\) hangs from the end where the cable is attached. What is the magnitude of the force the hinge exerts on the rod?
* \(\sqrt{7}\,Mg\)
- \(\tfrac{1}{2}Mg\)
- \(2Mg\)
- \(3Mg\)
= Torques about the hinge give \(T\sin 30^\circ L=Mg\dfrac{L}{2}+MgL\), so \(T=3Mg\). The hinge force has horizontal component \(T\cos 30^\circ=\dfrac{3\sqrt{3}}{2}Mg\) and vertical component \(2Mg-T\sin 30^\circ=\tfrac{1}{2}Mg\). The magnitude is \(Mg\sqrt{\tfrac{27}{4}+\tfrac{1}{4}}=\sqrt{7}\,Mg\).

@ 5 | q | Rotational inertia by integration
Which integral gives the rotational inertia of a uniform disk of mass \(M\) and radius \(R\) about the axis through its center perpendicular to its face?
* \(\displaystyle\int_0^R\dfrac{2M}{R^2}r^3\,dr\)
- \(\displaystyle\int_0^R\dfrac{M}{R}r^2\,dr\)
- \(\displaystyle\int_0^R\dfrac{2M}{R^2}r^2\,dr\)
- \(\displaystyle\int_0^R\dfrac{M}{\pi R^2}r^2\,dr\)
= Divide the disk into thin rings of radius \(r\) and width \(dr\). Each ring has mass \(dm=\dfrac{M}{\pi R^2}(2\pi r\,dr)=\dfrac{2M}{R^2}r\,dr\) and rotational inertia \(r^2\,dm\). Integrating gives \(\tfrac{1}{2}MR^2\).

@ 5 | q | Tipping and sliding
A uniform box of width \(w\) and height \(h\) rests on a rough floor. A horizontal force applied at the top edge of the box is slowly increased. Under what condition on the coefficient of static friction \(\mu_s\) does the box tip before it slides?
* \(\mu_s>\dfrac{w}{2h}\)
- \(\mu_s<\dfrac{w}{2h}\)
- \(\mu_s>\dfrac{h}{w}\)
- \(\mu_s>\dfrac{2h}{w}\)
= The box begins to tip about its lower far edge when \(Fh=mg\dfrac{w}{2}\), that is, at \(F=\dfrac{mgw}{2h}\). It begins to slide at \(F=\mu_smg\). Tipping comes first if \(\dfrac{mgw}{2h}<\mu_smg\). Tall, narrow boxes tip easily.

@ 5 | c | Rotational inertia
A hoop, a uniform disk, and a uniform solid sphere have the same mass and the same radius. Each rotates about an axis through its center (for the hoop and the disk, the axis perpendicular to its plane). Which lists the objects in order of increasing rotational inertia?
* Sphere, disk, hoop
- Hoop, disk, sphere
- Disk, sphere, hoop
- They are equal, because the masses and radii are equal.
= Rotational inertia depends on how far the mass is from the axis. All of the hoop's mass is at distance \(R\), giving \(MR^2\). The disk, \(\tfrac{1}{2}MR^2\), has mass distributed from the center outward, and the sphere, \(\tfrac{2}{5}MR^2\), has even more of its mass near the axis.

@ 5 | c | Torque and angular momentum
The axle of a rapidly spinning wheel is horizontal and is supported at only one end. Instead of falling, the wheel's axle slowly sweeps around in a horizontal circle. Which statement best explains this motion?
* The torque due to gravity is perpendicular to the wheel's angular momentum, so it changes the direction of the angular momentum without changing its magnitude.
- The spinning wheel is not acted on by gravity.
- The torque due to gravity is parallel to the angular momentum, so it increases the wheel's spin.
- The support exerts a torque that exactly cancels the torque due to gravity.
= Torque is the rate of change of angular momentum, \(\vec\tau=\dfrac{d\vec L}{dt}\). Gravity's torque about the support is horizontal and perpendicular to \(\vec L\), which lies along the axle, so \(\vec L\) changes direction continuously and the axle precesses.

@ 6 | q | Rotational energy | rodPivot
A uniform rod of mass \(M\) and length \(L\), with rotational inertia \(\tfrac{1}{3}ML^2\) about its end, is released from rest in the horizontal position shown. What is the speed of its free end as the rod passes through the vertical position?
* \(\sqrt{3gL}\)
- \(\sqrt{2gL}\)
- \(\sqrt{gL}\)
- \(\sqrt{6gL}\)
= The center of mass falls a distance \(\dfrac{L}{2}\), so \(Mg\dfrac{L}{2}=\tfrac{1}{2}\left(\tfrac{1}{3}ML^2\right)\omega^2\) and \(\omega=\sqrt{\dfrac{3g}{L}}\). The free end moves at \(\omega L=\sqrt{3gL}\). A point mass falling a distance \(L\) would reach \(\sqrt{2gL}\).

@ 6 | q | Rolling and energy
A thin hoop rolls without slipping along a level floor with speed \(v\) and then rolls without slipping up a ramp. What maximum height does its center rise?
* \(\dfrac{v^2}{g}\)
- \(\dfrac{v^2}{2g}\)
- \(\dfrac{3v^2}{4g}\)
- \(\dfrac{2v^2}{g}\)
= A hoop has \(I=MR^2\), so its rotational kinetic energy, \(\tfrac{1}{2}MR^2\dfrac{v^2}{R^2}\), equals its translational kinetic energy. The total is \(Mv^2=Mgh\), so \(h=\dfrac{v^2}{g}\), twice the height reached by a sliding block.

@ 6 | q | Angular momentum of a particle
A particle of mass \(m\) moves with constant velocity \(v\) along the line \(y=b\), parallel to the \(x\)-axis. What is the magnitude of its angular momentum about the origin?
* \(mvb\), constant in time
- \(mv\sqrt{x^2+b^2}\), increasing as the particle moves away
- Zero, because the particle moves in a straight line
- \(mvx\), where \(x\) is the particle's \(x\)-coordinate
= \(L=|\vec r\times\vec p|=mvr\sin\phi\), and \(r\sin\phi\) is the perpendicular distance from the origin to the line of motion, which is \(b\). No torque acts on the particle, so its angular momentum is constant even though it does not move in a circle.

@ 6 | q | Angular momentum in collisions | putty
A lump of clay of mass \(m\) moving with speed \(v\) strikes and sticks to the free end of a rod of mass \(3m\) and length \(L\) that is pivoted at its other end, as shown. The rod's rotational inertia about the pivot is \(\tfrac{1}{3}(3m)L^2\). What fraction of the clay's kinetic energy is dissipated in the collision?
* \(\dfrac{1}{2}\)
- \(\dfrac{1}{4}\)
- \(\dfrac{3}{4}\)
- \(\dfrac{2}{3}\)
= Angular momentum about the pivot gives \(mvL=\left(mL^2+mL^2\right)\omega\), so \(\omega=\dfrac{v}{2L}\). The final kinetic energy is \(\tfrac{1}{2}\left(2mL^2\right)\dfrac{v^2}{4L^2}=\tfrac{1}{4}mv^2\), half of the initial \(\tfrac{1}{2}mv^2\).

@ 6 | q | Conservation of angular momentum
A child of mass \(m\) runs with speed \(v\) along a line tangent to the rim of a stationary merry-go-round of radius \(R\) and rotational inertia \(I\), and jumps on at the rim. What is the angular speed of the merry-go-round afterward?
* \(\dfrac{mvR}{I+mR^2}\)
- \(\dfrac{mvR}{I}\)
- \(\dfrac{v}{R}\)
- \(\dfrac{mv}{I+mR^2}\)
= The child's angular momentum about the axle before landing is \(mvR\). Afterward the child and the merry-go-round rotate together with total rotational inertia \(I+mR^2\), so \(\omega=\dfrac{mvR}{I+mR^2}\).

@ 6 | c | Angular momentum in orbits
Kepler's second law states that a line from the Sun to a planet sweeps out equal areas in equal times. This law is a direct consequence of which fact?
* The gravitational force on the planet points along the line to the Sun, so it exerts no torque about the Sun.
- The gravitational force on the planet is inversely proportional to the square of the distance.
- The mechanical energy of the planet–Sun system is conserved.
- The orbit of the planet is an ellipse.
= The rate at which area is swept out is \(\dfrac{L}{2m}\), so it is constant whenever the planet's angular momentum about the Sun is constant. That requires only that the force be central. The law would hold for any central force, not only an inverse-square one.

@ 6 | q | Energy and angular momentum in orbits | orbit
A satellite moves in the elliptical orbit shown around a planet of mass \(M\). What is its speed at its closest point, a distance \(r_1\) from the planet's center?
* \(\sqrt{\dfrac{2GMr_2}{r_1\left(r_1+r_2\right)}}\)
- \(\sqrt{\dfrac{GM}{r_1}}\)
- \(\sqrt{\dfrac{2GM}{r_1}}\)
- \(\sqrt{\dfrac{2GMr_1}{r_2\left(r_1+r_2\right)}}\)
= Angular momentum conservation gives \(v_2=v_1\dfrac{r_1}{r_2}\). Substituting into energy conservation, \(\tfrac{1}{2}v_1^2-\dfrac{GM}{r_1}=\tfrac{1}{2}v_2^2-\dfrac{GM}{r_2}\), and solving gives \(v_1^2=\dfrac{2GMr_2}{r_1(r_1+r_2)}\). This lies between the circular-orbit speed and the escape speed at \(r_1\).

@ 6 | q | Sliding and rolling
A bowling ball, a uniform sphere with rotational inertia \(\tfrac{2}{5}MR^2\), is released onto a rough horizontal lane sliding at speed \(v\) without rotating. What is its speed once it is rolling without slipping?
* \(\dfrac{5}{7}v\)
- \(\dfrac{2}{7}v\)
- \(\dfrac{2}{5}v\)
- \(v\)
= Friction acts at the point of contact, so it exerts no torque about a point on the lane, and angular momentum about that point is conserved: \(MvR=Mv_fR+\tfrac{2}{5}MR^2\dfrac{v_f}{R}\). This gives \(v_f=\dfrac{5}{7}v\), independent of the coefficient of friction.

@ 6 | q | Work done by a torque
A wheel with rotational inertia \(4\text{ kg}\cdot\text{m}^2\) starts from rest and is acted on by a net torque \(\tau(\theta)=3\theta^2\), in newton-meters, as it turns from \(\theta=0\) to \(\theta=2\text{ rad}\). What is its angular speed at \(\theta=2\text{ rad}\)?
* \(2\text{ rad/s}\)
- \(4\text{ rad/s}\)
- \(\sqrt{6}\text{ rad/s}\)
- \(8\text{ rad/s}\)
= The work done is \(\displaystyle\int_0^23\theta^2\,d\theta=8\text{ J}\). Setting \(\tfrac{1}{2}I\omega^2=8\) gives \(\omega^2=4\), so \(\omega=2\text{ rad/s}\).

@ 6 | q | Rotational power
A constant net torque \(\tau\) acts on a flywheel of rotational inertia \(I\) that starts from rest. What is the instantaneous power delivered to the flywheel at time \(t\)?
* \(\dfrac{\tau^2t}{I}\)
- \(\dfrac{\tau^2t}{2I}\)
- \(\tau t\)
- \(\dfrac{\tau^2t^2}{2I}\)
= The angular velocity is \(\omega=\dfrac{\tau t}{I}\), and the power is \(P=\tau\omega=\dfrac{\tau^2t}{I}\). The expression \(\dfrac{\tau^2t^2}{2I}\) is the kinetic energy at time \(t\), and \(\dfrac{\tau^2t}{2I}\) is the average power up to time \(t\).

@ 6 | q | Conservation of angular momentum
A puck of mass \(m\) moves in a circle of radius \(r\) with speed \(v\) on a frictionless table, held by a string that passes through a small hole at the center of the circle. The string is slowly pulled down through the hole until the radius is \(\dfrac{r}{2}\). How much work is done on the puck by the string?
* \(\dfrac{3}{2}mv^2\)
- \(\dfrac{1}{2}mv^2\)
- \(mv^2\)
- Zero, because the tension is perpendicular to the velocity
= The tension points toward the hole and exerts no torque about it, so \(mvr\) is conserved and the speed doubles. The kinetic energy rises from \(\tfrac{1}{2}mv^2\) to \(2mv^2\), so the work done is \(\dfrac{3}{2}mv^2\). While the radius shrinks, the velocity has an inward component, so the tension does do work.

@ 6 | c | Choosing a reference point
A ball slides and spins along a rough horizontal floor before it begins rolling without slipping. About which point is the ball's angular momentum conserved during the sliding, and why?
* A fixed point on the floor along the ball's path, because the friction force acts along a line through that point.
- The ball's center of mass, because the weight and normal force act through it.
- Any point at all, because friction is an internal force.
- No point, because friction always changes angular momentum.
= The friction force acts at the floor and is directed along the floor, so its line of action passes through any point of the floor on the ball's path, and its torque about such a point is zero. The weight and normal force cancel. About the center of mass friction does exert a torque, which changes the ball's spin.

@ 6 | q | Kinetic energy of rolling
A uniform disk of mass \(M\), with rotational inertia \(\tfrac{1}{2}MR^2\), rolls without slipping with its center moving at speed \(v\). What is its total kinetic energy?
* \(\dfrac{3}{4}Mv^2\)
- \(\dfrac{1}{2}Mv^2\)
- \(Mv^2\)
- \(\dfrac{1}{4}Mv^2\)
= The kinetic energy is \(\tfrac{1}{2}Mv^2+\tfrac{1}{2}\left(\tfrac{1}{2}MR^2\right)\dfrac{v^2}{R^2}=\tfrac{1}{2}Mv^2+\tfrac{1}{4}Mv^2=\dfrac{3}{4}Mv^2\).

@ 6 | c | Momentum and angular momentum
A rod lies at rest on a frictionless horizontal surface and is not attached to anything. A lump of clay sliding on the surface strikes one end of the rod perpendicular to it and sticks. Which statement about the rod–clay system is correct?
* Its center of mass moves at constant velocity, and the system also rotates about its center of mass.
- Its center of mass remains at rest while the system rotates.
- It moves in a straight line without rotating.
- It rotates about the end of the rod opposite the clay.
= No external horizontal force acts, so the system's linear momentum is conserved and its center of mass moves at \(\dfrac{mv}{M+m}\). The clay's line of motion does not pass through the center of mass, so the system has angular momentum about it and must rotate as well.

@ 7 | q | Simple harmonic motion
The position of an oscillator is \(x(t)=0.20\cos(5t)\), with \(x\) in meters and \(t\) in seconds. What is the magnitude of its maximum acceleration?
* \(5.0\text{ m/s}^2\)
- \(1.0\text{ m/s}^2\)
- \(25\text{ m/s}^2\)
- \(0.20\text{ m/s}^2\)
= Differentiating twice gives \(a=-(0.20)(5)^2\cos(5t)\), with maximum magnitude \(A\omega^2=0.20(25)=5.0\text{ m/s}^2\). The maximum speed is \(A\omega=1.0\text{ m/s}\).

@ 7 | q | Differential equation of simple harmonic motion
The motion of an object is described by \(\dfrac{d^2x}{dt^2}=-16x\), with \(x\) in meters and \(t\) in seconds. What is the period of the motion?
* \(\dfrac{\pi}{2}\text{ s}\)
- \(\dfrac{\pi}{8}\text{ s}\)
- \(4\text{ s}\)
- \(8\pi\text{ s}\)
= Comparing with \(\dfrac{d^2x}{dt^2}=-\omega^2x\) gives \(\omega=4\text{ rad/s}\), so \(T=\dfrac{2\pi}{\omega}=\dfrac{\pi}{2}\text{ s}\).

@ 7 | q | Physical pendulum
A uniform rod of length \(L\), with rotational inertia \(\tfrac{1}{3}ML^2\) about its end, hangs from a pivot at one end and swings through small angles. What is its period?
* \(2\pi\sqrt{\dfrac{2L}{3g}}\)
- \(2\pi\sqrt{\dfrac{L}{g}}\)
- \(2\pi\sqrt{\dfrac{L}{2g}}\)
- \(2\pi\sqrt{\dfrac{L}{3g}}\)
= For a physical pendulum, \(T=2\pi\sqrt{\dfrac{I}{Mgd}}\), where \(d=\dfrac{L}{2}\) is the distance from the pivot to the center of mass. Then \(T=2\pi\sqrt{\dfrac{ML^2/3}{MgL/2}}=2\pi\sqrt{\dfrac{2L}{3g}}\).

@ 7 | q | Physical pendulum | hoop
A thin hoop of radius \(R\) hangs from a nail and swings through small angles in its own plane, as shown. The rotational inertia of a hoop about its center is \(MR^2\). What is the period of the oscillation?
* \(2\pi\sqrt{\dfrac{2R}{g}}\)
- \(2\pi\sqrt{\dfrac{R}{g}}\)
- \(2\pi\sqrt{\dfrac{R}{2g}}\)
- \(2\pi\sqrt{\dfrac{3R}{2g}}\)
= By the parallel-axis theorem the rotational inertia about the nail is \(MR^2+MR^2=2MR^2\), and the center of mass is a distance \(R\) from the pivot. \(T=2\pi\sqrt{\dfrac{2MR^2}{MgR}}=2\pi\sqrt{\dfrac{2R}{g}}\), the same as a simple pendulum of length \(2R\).

@ 7 | q | Small oscillations about equilibrium | Ucubic
The graph shows the potential energy \(U(x)=x^3-6x^2+9x\), in joules, as a function of position \(x\), in meters, for a particle of mass \(1.5\text{ kg}\). What is the angular frequency of small oscillations about the stable equilibrium position?
* \(2\text{ rad/s}\)
- \(4\text{ rad/s}\)
- \(\sqrt{6}\text{ rad/s}\)
- \(6\text{ rad/s}\)
= Near a minimum the potential energy is approximately \(\tfrac{1}{2}k_{\text{eff}}(x-x_0)^2\), with \(k_{\text{eff}}=\dfrac{d^2U}{dx^2}\). Here \(\dfrac{d^2U}{dx^2}=6x-12\), which is \(6\text{ N/m}\) at \(x_0=3\text{ m}\). Then \(\omega=\sqrt{\dfrac{6}{1.5}}=2\text{ rad/s}\).

@ 7 | q | Oscillation in a gravitational field
A straight, frictionless tunnel is drilled through the center of a uniform, nonrotating planet of radius \(R\) whose surface gravitational field strength is \(g\). An object dropped into the tunnel oscillates. What is the period of its motion?
* \(2\pi\sqrt{\dfrac{R}{g}}\)
- \(2\pi\sqrt{\dfrac{2R}{g}}\)
- \(\pi\sqrt{\dfrac{R}{g}}\)
- \(2\pi\sqrt{\dfrac{R}{2g}}\)
= Inside a uniform planet the gravitational force at distance \(r\) from the center is \(-\dfrac{mg}{R}r\), a linear restoring force with effective spring constant \(\dfrac{mg}{R}\). The period is \(2\pi\sqrt{\dfrac{m}{k}}=2\pi\sqrt{\dfrac{R}{g}}\), the same as the period of a satellite orbiting just above the surface.

@ 7 | q | Oscillation of two connected masses | twoMass
Two blocks of mass \(m\) connected by a spring of spring constant \(k\) rest on a frictionless surface, as shown. The blocks are pulled apart and released from rest. What is the angular frequency of the oscillation?
* \(\sqrt{\dfrac{2k}{m}}\)
- \(\sqrt{\dfrac{k}{m}}\)
- \(\sqrt{\dfrac{k}{2m}}\)
- \(2\sqrt{\dfrac{k}{m}}\)
= The center of the spring stays fixed, so each block oscillates on half of the spring, which has spring constant \(2k\). Then \(\omega=\sqrt{\dfrac{2k}{m}}\). Equivalently, the reduced mass of the pair is \(\dfrac{m}{2}\).

@ 7 | c | Phase relationships | shm
The graph shows the position of an oscillator as a function of time. Which statement correctly relates the oscillator's velocity to its position?
* The velocity reaches its maximum one quarter of a period before the position does.
- The velocity and the position reach their maxima at the same times.
- The velocity reaches its maximum half a period after the position does.
- The velocity is constant between the turning points.
= With \(x=A\cos\omega t\), the velocity is \(-A\omega\sin\omega t=A\omega\cos\!\left(\omega t+\tfrac{\pi}{2}\right)\), which leads the position by a quarter cycle. On the graph the position peaks at \(t=2\text{ s}\), and the slope is greatest at \(t=1.5\text{ s}\).

@ 7 | q | Energy in simple harmonic motion
A block on a spring oscillates with amplitude \(A\). At what displacement from equilibrium is its kinetic energy equal to the potential energy stored in the spring?
* \(\dfrac{A}{\sqrt{2}}\)
- \(\dfrac{A}{2}\)
- \(\dfrac{A}{4}\)
- \(\dfrac{\sqrt{3}}{2}A\)
= The energies are equal when the potential energy is half the total: \(\tfrac{1}{2}kx^2=\tfrac{1}{2}\left(\tfrac{1}{2}kA^2\right)\), so \(x=\dfrac{A}{\sqrt{2}}\). At \(x=\dfrac{A}{2}\) the potential energy is only one fourth of the total.

@ 7 | q | Period of a spring–block oscillator
A block hung from a spring oscillates with period \(T\). The spring is cut in half, and the same block is hung from one of the halves. What is the new period?
* \(\dfrac{T}{\sqrt{2}}\)
- \(\dfrac{T}{2}\)
- \(\sqrt{2}\,T\)
- \(T\)
= Half of a spring stretches half as far under the same force, so its spring constant is \(2k\). The period \(2\pi\sqrt{\dfrac{m}{k}}\) therefore decreases by a factor of \(\sqrt{2}\).

@ 7 | q | Pendulum in an accelerating frame
A simple pendulum of length \(L\) hangs from the ceiling of a car that has a constant horizontal acceleration \(a\). What is the period of small oscillations about its equilibrium position?
* \(2\pi\sqrt{\dfrac{L}{\sqrt{g^2+a^2}}}\)
- \(2\pi\sqrt{\dfrac{L}{g}}\)
- \(2\pi\sqrt{\dfrac{L}{g+a}}\)
- \(2\pi\sqrt{\dfrac{L}{g-a}}\)
= In the car's frame the bob behaves as though gravity had magnitude \(\sqrt{g^2+a^2}\), tilted from the vertical by an angle with \(\tan\theta=\dfrac{a}{g}\). The pendulum oscillates about that tilted direction with the effective field strength in place of \(g\).

@ 7 | q | Initial conditions
A block on a spring oscillates with angular frequency \(4\text{ rad/s}\). At \(t=0\) it is \(0.10\text{ m}\) from equilibrium and moving at \(0.40\text{ m/s}\). What is the amplitude of the oscillation?
* \(0.14\text{ m}\)
- \(0.10\text{ m}\)
- \(0.20\text{ m}\)
- \(0.50\text{ m}\)
= Energy conservation gives \(A^2=x_0^2+\dfrac{v_0^2}{\omega^2}=(0.10)^2+(0.10)^2\), so \(A=0.10\sqrt{2}\approx 0.14\text{ m}\). The block is not at its turning point at \(t=0\), because it is still moving.

@ 7 | c | Limits of the small-angle approximation
A simple pendulum is released from rest at \(5^\circ\) from the vertical and its period is measured. It is then released from rest at \(60^\circ\). How does the second period compare with the first?
* It is longer, because the restoring torque grows more slowly than the angular displacement at large angles.
- It is the same, because the period of a pendulum does not depend on amplitude.
- It is shorter, because the bob moves faster.
- It is shorter, because the restoring torque is larger.
= The restoring torque is proportional to \(\sin\theta\), which equals \(\theta\) only for small angles. At large angles \(\sin\theta<\theta\), so the restoring effect is weaker than simple harmonic motion requires and each swing takes longer. Independence of amplitude holds only in the small-angle limit.

@ 7 | c | Spring–block oscillator on an incline
A block on a spring oscillates on a frictionless horizontal surface with period \(T\). The same spring and block are then set oscillating on a frictionless incline, with the spring parallel to the incline. How do the period and the equilibrium position compare with the horizontal case?
* The period is the same, and the equilibrium position is shifted down the incline.
- The period is longer, and the equilibrium position is shifted down the incline.
- The period is shorter, and the equilibrium position is unchanged.
- The period and the equilibrium position are both unchanged.
= The component of gravity along the incline is a constant force. It stretches the spring to a new equilibrium position but does not change how the net force varies with displacement from that position, which is still \(-kx\). The period remains \(2\pi\sqrt{\dfrac{m}{k}}\).
`;

module.exports = { source, figures };
