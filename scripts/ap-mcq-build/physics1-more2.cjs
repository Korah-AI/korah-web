// Third batch for the AP Physics 1 bank (66 questions, half conceptual and half
// quantitative), bringing every unit to 25 questions. Same block format as physics1.cjs;
// figure keys may refer to figures defined there or below.
const { graph } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', TILT = -25.71;
const figures = {
  vt2: graph({ x: [0, 10], y: [0, 25], xstep: 2, ystep: 5, xlabel: 't (s)', ylabel: 'v (m/s)', curves: [{ pts: [[0, 10], [10, 10]], color: PINK }, { pts: [[0, 0], [10, 25]] }],
    notes: [{ x: 0.6, y: 11.6, text: 'car P' }, { x: 7.2, y: 15, text: 'car Q' }],
    alt: 'Velocity versus time graph for two cars that are side by side at t = 0. Car P moves at a constant 10 m/s. Car Q starts from rest and its velocity increases linearly, reaching 25 m/s at t = 10 s' }),
  pt: graph({ x: [0, 4], y: [0, 7], xstep: 1, ystep: 1, xlabel: 't (s)', ylabel: 'p (kg·m/s)', curves: [{ pts: [[0, 6], [1, 6], [2, 2], [4, 2]] }, { pts: [[0, 0], [1, 0], [2, 4], [4, 4]], color: PINK }],
    notes: [{ x: 0.2, y: 6.3, text: 'cart A' }, { x: 2.6, y: 4.3, text: 'cart B' }],
    alt: 'Momentum versus time graph for two carts that collide on a level track. Cart A has 6 kg·m/s until t = 1 s, then its momentum decreases linearly to 2 kg·m/s at t = 2 s. Cart B has zero momentum until t = 1 s, then its momentum increases linearly to 4 kg·m/s at t = 2 s. Both are constant afterward' }),
  incPulley: draw(340, 210, 'Block m1 rests on a ramp inclined at angle theta and is connected by a string, parallel to the ramp, over a pulley at the top of the ramp to a hanging block m2', [
    ['poly', [[30, 190], [300, 190], [300, 60]], { fill: true }], ['text', 96, 184, 'θ'],
    ['rect', 168, 85, 44, 28, { fill: true, rotate: [TILT, 190, 113] }], ['text', 186, 104, 'm₁'],
    ['line', 204, 90, 290, 49], ['line', 300, 60, 298, 42], ['circle', 298, 40, 10], ['line', 308, 40, 308, 140],
    ['rect', 292, 140, 32, 30, { fill: true }], ['text', 308, 160, 'm₂'],
  ]),
  meterStick: draw(360, 170, 'A uniform meter stick of mass M rests on a pivot at the 40 cm mark. A block of mass m hangs from the 10 cm mark, and the stick is balanced horizontally', [
    ['rect', 30, 80, 300, 10, { fill: true }], ['poly', [[150, 90], [138, 116], [162, 116]], { fill: true }], ['hatch', 100, 116, 200, 116],
    ['text', 30, 72, '0', { italic: false, size: 11 }], ['text', 60, 72, '10', { italic: false, size: 11 }], ['text', 150, 72, '40', { italic: false, size: 11 }], ['text', 330, 72, '100 cm', { italic: false, size: 11 }],
    ['line', 60, 90, 60, 122], ['rect', 46, 122, 28, 26, { fill: true }], ['text', 60, 140, 'm'], ['text', 246, 112, 'mass M', { italic: false, size: 11 }],
  ]),
  submerged: draw(340, 225, 'A block hangs from a spring scale by a string and is completely submerged in a beaker of water, without touching the beaker. The beaker rests on a second scale below', [
    ['hatch', 220, 14, 120, 14], ['line', 170, 14, 170, 22], ['rect', 155, 22, 30, 40, { fill: true }], ['text', 222, 46, 'scale 1', { italic: false, size: 11 }],
    ['poly', [[100, 92], [240, 92], [240, 190], [100, 190]], { fill: true, color: 'none' }], ['path', 'M100 74 V190 H240 V74'], ['line', 100, 92, 240, 92],
    ['line', 170, 62, 170, 120], ['rect', 152, 120, 36, 30, { fill: true }],
    ['rect', 80, 190, 180, 14, { fill: true }], ['text', 296, 202, 'scale 2', { italic: false, size: 11 }],
  ]),
};

const source = String.raw`
@ 1 | q | Motion graphs | vt2
Cars P and Q are side by side at \(t=0\) and move in the same direction along a straight road, as shown. At what time does car Q catch up with car P?
* \(8\text{ s}\)
- \(4\text{ s}\)
- \(16\text{ s}\)
- \(6\text{ s}\)
= Car Q accelerates at \(2.5\text{ m/s}^2\). The cars are side by side again when \(10t=\tfrac{1}{2}(2.5)t^2\), so \(t=8\text{ s}\). At \(t=4\text{ s}\) the cars only have equal velocities; car Q is still behind.

@ 1 | q | Motion graphs | vt2
Cars P and Q are side by side at \(t=0\) and move in the same direction along a straight road, as shown. What is the greatest distance between the cars before car Q catches up?
* \(20\text{ m}\)
- \(40\text{ m}\)
- \(10\text{ m}\)
- \(80\text{ m}\)
= The gap grows while car P is faster and is largest when the velocities are equal, at \(t=4\text{ s}\). Car P has gone \(40\text{ m}\) and car Q has gone \(\tfrac{1}{2}(4)(10)=20\text{ m}\), so the gap is \(20\text{ m}\), the area between the two graphs up to that time.

@ 1 | c | Motion graphs | vt2
Cars P and Q are side by side at \(t=0\) and move in the same direction along a straight road, as shown. Which statement is true at \(t=4\text{ s}\)?
* The cars have the same velocity, and car P is ahead by its greatest distance.
- Car Q passes car P.
- The cars are at the same position, because their graphs cross.
- Car Q is ahead, because it is accelerating.
= Where two velocity graphs cross, the velocities are equal, not the positions. Before \(4\text{ s}\) car P is faster and pulls ahead; afterward car Q is faster and closes the gap, so the separation is greatest at \(4\text{ s}\).

@ 1 | q | Projectile motion
A ball is thrown horizontally at \(15\text{ m/s}\) from the top of a building \(20\text{ m}\) tall. Using \(g=10\text{ m/s}^2\) and neglecting air resistance, what is the ball's speed just before it hits the ground?
* \(25\text{ m/s}\)
- \(35\text{ m/s}\)
- \(20\text{ m/s}\)
- \(15\text{ m/s}\)
= The vertical velocity at the ground is \(\sqrt{2(10)(20)}=20\text{ m/s}\), and the horizontal velocity stays \(15\text{ m/s}\). The speed is \(\sqrt{15^2+20^2}=25\text{ m/s}\). Adding the components as numbers gives \(35\text{ m/s}\).

@ 1 | q | Free fall
A ball is thrown straight up from the ground and passes a window ledge \(15\text{ m}\) above the ground \(1.0\text{ s}\) after it is thrown. Using \(g=10\text{ m/s}^2\), how long after it is thrown does it pass the ledge again on the way down?
* \(3.0\text{ s}\)
- \(2.0\text{ s}\)
- \(4.0\text{ s}\)
- \(1.5\text{ s}\)
= From \(15=v_0(1)-5(1)^2\), the launch speed is \(20\text{ m/s}\). Solving \(15=20t-5t^2\) gives \(t=1\text{ s}\) and \(t=3\text{ s}\). The ball is at its highest point at \(2\text{ s}\) and returns to the ground at \(4\text{ s}\).

@ 1 | c | Interpreting a position graph
A graph of a cart's position as a function of time has a positive slope that becomes less steep over time (the curve is concave down). Which statement describes the cart's motion?
* It moves in the \(+x\) direction while slowing down.
- It moves in the \(-x\) direction while speeding up.
- It moves in the \(+x\) direction while speeding up.
- It moves in the \(+x\) direction with constant acceleration of zero.
= The slope of a position graph is the velocity, which is positive here, so the cart moves in the \(+x\) direction. The slope is decreasing, so the velocity is decreasing: the acceleration is negative and opposite the velocity, and the cart slows.

@ 1 | c | Reference frames
A passenger on a train moving at constant velocity along a straight, level track drops a ball. Air resistance is negligible. How do the passenger and a person standing beside the track describe the ball's path?
* The passenger sees it fall straight down; the person on the ground sees a parabola.
- Both see it fall straight down.
- The passenger sees it curve toward the back of the train; the person on the ground sees it fall straight down.
- Both see a parabola, because the ball accelerates.
= Before it is released, the ball shares the train's horizontal velocity, and nothing changes that velocity afterward. Relative to the train the ball has no horizontal motion, so it falls straight down. Relative to the ground it moves horizontally while falling, which traces a parabola.

@ 1 | c | Velocity and acceleration
A car's velocity and acceleration are both negative. Which statement describes the car's motion?
* It moves in the \(-x\) direction and its speed increases.
- It moves in the \(-x\) direction and its speed decreases.
- It moves in the \(+x\) direction and its speed decreases.
- It cannot be moving, because both quantities are negative.
= The sign of the velocity gives the direction of motion. An object speeds up when its acceleration has the same sign as its velocity and slows down when the signs are opposite. A negative acceleration does not by itself mean slowing down.

@ 2 | q | Connected objects on an incline | incPulley
Block \(m_1\) on a frictionless ramp is connected over a light, frictionless pulley to hanging block \(m_2\), as shown. The blocks are released, and \(m_2\) moves downward. What is the magnitude of the acceleration of the blocks?
* \(\dfrac{\left(m_2-m_1\sin\theta\right)g}{m_1+m_2}\)
- \(\dfrac{\left(m_2-m_1\cos\theta\right)g}{m_1+m_2}\)
- \(\dfrac{m_2g}{m_1+m_2}\)
- \(\dfrac{\left(m_2+m_1\sin\theta\right)g}{m_1+m_2}\)
= Along the direction of motion, the forces on the system are \(m_2g\) driving it and the component of \(m_1\)'s weight along the ramp, \(m_1g\sin\theta\), opposing it. The tension is internal to the system. The total mass to be accelerated is \(m_1+m_2\).

@ 2 | q | Connected objects on an incline | incPulley
In the system shown, \(m_1=4.0\text{ kg}\), \(m_2=3.0\text{ kg}\), \(\theta=30^\circ\), and the ramp and pulley are frictionless. Using \(g=10\text{ m/s}^2\), what is the tension in the string while the blocks move?
* About \(26\text{ N}\)
- \(30\text{ N}\)
- \(20\text{ N}\)
- About \(34\text{ N}\)
= The acceleration is \(\dfrac{30-40\sin 30^\circ}{7}=\dfrac{10}{7}\text{ m/s}^2\). For the hanging block, \(T=m_2(g-a)=3.0\left(10-\tfrac{10}{7}\right)=\dfrac{180}{7}\approx 26\text{ N}\). The tension is less than \(m_2g\) because \(m_2\) accelerates downward.

@ 2 | c | Static friction on an incline | incPulley
In the system shown, the ramp is rough and the blocks remain at rest. The weight of \(m_2\) is greater than \(m_1g\sin\theta\). What is the direction of the static friction force on \(m_1\)?
* Down the ramp, because the string pulls \(m_1\) up the ramp harder than gravity pulls it down the ramp
- Up the ramp, because friction always acts up an incline
- There is no friction, because the blocks are at rest
- Perpendicular to the ramp, balancing the normal force
= With the blocks at rest, the tension equals \(m_2g\), which exceeds \(m_1g\sin\theta\). The block would slide up the ramp without friction, so static friction acts down the ramp to supply the difference. Its direction depends on the other forces, not on the slope alone.

@ 2 | q | Apparent weight
A \(60\text{ kg}\) person stands on a scale in an elevator that is moving downward and speeding up at \(2.0\text{ m/s}^2\). Using \(g=10\text{ m/s}^2\), what does the scale read?
* \(480\text{ N}\)
- \(600\text{ N}\)
- \(720\text{ N}\)
- \(120\text{ N}\)
= The acceleration is downward, so the net force is downward: \(mg-N=ma\) gives \(N=60(10-2.0)=480\text{ N}\). The scale reads the normal force, not the weight.

@ 2 | q | Systems of objects
A \(3.0\text{ kg}\) block hangs by a light string below a \(2.0\text{ kg}\) block, and a student lifts the upper block with an upward force of \(75\text{ N}\). Using \(g=10\text{ m/s}^2\), what is the tension in the string between the blocks?
* \(45\text{ N}\)
- \(30\text{ N}\)
- \(75\text{ N}\)
- \(50\text{ N}\)
= For both blocks together, \(75-50=5.0a\), so \(a=5.0\text{ m/s}^2\) upward. For the lower block alone, \(T-30=3.0(5.0)\), so \(T=45\text{ N}\). The tension exceeds the lower block's weight because that block accelerates upward.

@ 2 | c | Friction and the normal force
A box is pulled across a level floor at constant speed by a rope with a fixed tension. The rope is raised from horizontal to a larger angle above the horizontal, and the box keeps sliding. How does the kinetic friction force on the box change?
* It decreases, because the rope's upward component reduces the normal force.
- It increases, because the rope pulls harder against the floor.
- It stays the same, because the coefficient of friction is unchanged.
- It stays the same, because the box still moves.
= Kinetic friction equals \(\mu_kN\). With an upward component of tension, the floor supports less of the box's weight, so \(N=mg-T\sin\theta\) decreases and friction decreases with it.

@ 2 | c | Static friction
A block is held at rest against a vertical wall by a horizontal push. The push is doubled, and the block remains at rest. How does the static friction force on the block change?
* It does not change, because it still balances the block's weight.
- It doubles, because the normal force doubles.
- It is halved, because the block is pressed more firmly.
- It becomes zero, because the push holds the block up.
= The block is in equilibrium, so the upward static friction must equal its weight whatever the push. Doubling the normal force doubles only the maximum possible static friction, \(\mu_sN\), not the friction actually exerted.

@ 2 | c | Orbital motion
Two satellites, one with twice the mass of the other, travel in the same circular orbit around Earth. How do their speeds and the gravitational forces on them compare?
* Their speeds are equal, and the more massive satellite experiences twice the gravitational force.
- The more massive satellite moves faster, and the forces are equal.
- The less massive satellite moves faster, and the more massive one experiences twice the force.
- Their speeds and the forces on them are both equal.
= From \(\dfrac{GMm}{r^2}=\dfrac{mv^2}{r}\), the satellite's mass cancels, so \(v=\sqrt{\dfrac{GM}{r}}\) for any satellite at radius \(r\). The force itself is proportional to the satellite's mass.

@ 3 | q | Elastic potential energy
A \(0.20\text{ kg}\) ball rests on a vertical spring of spring constant \(400\text{ N/m}\) that is compressed \(0.10\text{ m}\). The spring is released and launches the ball straight up. Using \(g=10\text{ m/s}^2\) and neglecting air resistance, how high does the ball rise above its position when the spring was compressed?
* \(1.0\text{ m}\)
- \(2.0\text{ m}\)
- \(0.50\text{ m}\)
- \(0.10\text{ m}\)
= The spring stores \(\tfrac{1}{2}(400)(0.10)^2=2.0\text{ J}\), which becomes gravitational potential energy: \(0.20(10)h=2.0\), so \(h=1.0\text{ m}\). Using \(kx^2\) without the factor of one half gives \(2.0\text{ m}\).

@ 3 | q | Energy dissipated by friction
A \(2.0\text{ kg}\) block is released from rest at the top of a rough curved track \(5.0\text{ m}\) high and reaches the bottom moving at \(8.0\text{ m/s}\). Using \(g=10\text{ m/s}^2\), how much energy was dissipated by friction?
* \(36\text{ J}\)
- \(64\text{ J}\)
- \(100\text{ J}\)
- \(164\text{ J}\)
= The block–Earth system began with \(mgh=100\text{ J}\) of potential energy and ended with \(\tfrac{1}{2}(2.0)(8.0)^2=64\text{ J}\) of kinetic energy. The missing \(36\text{ J}\) was converted to internal energy by friction. The shape of the track does not matter.

@ 3 | q | Power
A crane lifts a \(500\text{ kg}\) load straight up at a constant speed of \(2.0\text{ m/s}\). Using \(g=10\text{ m/s}^2\), what power does the crane deliver to the load?
* \(1.0\times 10^4\text{ W}\)
- \(5.0\times 10^3\text{ W}\)
- \(1.0\times 10^3\text{ W}\)
- \(2.0\times 10^4\text{ W}\)
= At constant speed the lifting force equals the weight, \(5000\text{ N}\), and the power is \(Fv=5000(2.0)=1.0\times 10^4\text{ W}\).

@ 3 | q | Potential energy graphs | Ux
The graph shows the potential energy \(U=2(x-2)^2\) of a system, in joules, as a function of the position \(x\), in meters, of a \(3.0\text{ kg}\) object. The total mechanical energy is \(6\text{ J}\). What is the object's speed at \(x=2\text{ m}\)?
* \(2.0\text{ m/s}\)
- \(4.0\text{ m/s}\)
- \(1.4\text{ m/s}\)
- \(0\)
= At \(x=2\text{ m}\) the potential energy is zero, so all \(6\text{ J}\) is kinetic: \(\tfrac{1}{2}(3.0)v^2=6\), giving \(v=2.0\text{ m/s}\). Speed is zero only at the turning points, where \(U=E\).

@ 3 | c | Work done by gravity
Two identical balls are released from the same height. Ball 1 is dropped from rest and ball 2 is thrown horizontally. Air resistance is negligible. How does the work done by gravity on each ball before it reaches the ground compare?
* It is the same, because both balls move the same vertical distance.
- It is greater for ball 2, because ball 2 travels a longer path.
- It is greater for ball 1, because its path is parallel to the gravitational force.
- It is greater for ball 2, because ball 2 is in the air longer.
= Work by a constant force depends on the displacement component along the force, here the vertical drop. Both balls fall the same height, so gravity does \(mgh\) on each. The horizontal motion is perpendicular to gravity, and both balls are in the air for the same time.

@ 3 | c | Work
A person carries a box across a level room at constant height and constant speed. How much work does the person's upward force do on the box during the walk?
* None, because the upward force is perpendicular to the box's displacement.
- A positive amount, because the person is exerting a force.
- A positive amount equal to the box's weight times the distance walked.
- A negative amount, because the box's kinetic energy does not change.
= Work is \(Fd\cos\phi\). The supporting force is vertical and the displacement is horizontal, so \(\phi=90^\circ\) and no work is done on the box. The person's muscles still use energy internally.

@ 3 | c | Energy in projectile motion
A ball is launched at an angle above the horizontal and air resistance is negligible. Which statement about the ball–Earth system is correct when the ball is at its highest point?
* The kinetic energy is at its minimum but is not zero.
- The kinetic energy is zero, because the ball momentarily stops.
- The potential energy equals the initial kinetic energy.
- The total mechanical energy is greatest at that point.
= At the top only the vertical velocity is zero; the horizontal velocity remains, so some kinetic energy remains. Only the vertical part of the launch kinetic energy has been converted to potential energy, and the total stays constant.

@ 3 | c | Power and work
Two identical motors each lift the same load at constant speed through the same height. Motor A takes half as long as motor B. How do the work done and the power delivered compare?
* They do the same work, and motor A delivers twice the power.
- Motor A does twice the work and delivers twice the power.
- They deliver the same power, and motor A does half the work.
- Motor A does half the work and delivers the same power.
= The work equals the increase in gravitational potential energy, \(mgh\), which is the same. Power is work divided by time, so doing it in half the time takes twice the power.

@ 4 | q | Impulse from a momentum graph | pt
The graph shows the momenta of carts A and B as they collide on a level track. What is the magnitude of the average force that cart B exerts on cart A during the collision?
* \(4\text{ N}\)
- \(2\text{ N}\)
- \(6\text{ N}\)
- \(8\text{ N}\)
= The force on a cart equals the rate of change of its momentum. Cart A's momentum drops by \(4\text{ kg}\cdot\text{m/s}\) during the \(1\text{ s}\) collision, so the force on it has magnitude \(4\text{ N}\). Cart B gains the same momentum, as Newton's third law requires.

@ 4 | c | Momentum conservation | pt
The graph shows the momenta of carts A and B as they collide on a level track. Which conclusion is best supported by the graph alone?
* The total momentum of the two carts is constant, so the net external horizontal force on them is negligible.
- The collision is elastic, because the total momentum is conserved.
- Cart A exerts a larger force on cart B than cart B exerts on cart A.
- The carts stick together after the collision.
= At every instant the two momenta add to \(6\text{ kg}\cdot\text{m/s}\), so the system's momentum is constant. Momentum is conserved in all collisions without a net external force; deciding whether kinetic energy is conserved also requires the masses.

@ 4 | q | Classifying collisions | pt
The graph shows the momenta of carts A and B as they collide. Cart A has a mass of \(2.0\text{ kg}\) and cart B has a mass of \(1.0\text{ kg}\). Which describes the collision?
* It is elastic: the total kinetic energy is \(9\text{ J}\) before and after.
- It is perfectly inelastic: the carts move together afterward.
- It is inelastic: \(3\text{ J}\) of kinetic energy is dissipated.
- It is impossible: the carts gain kinetic energy.
= Cart A's speed goes from \(3\) to \(1\text{ m/s}\), and cart B's from \(0\) to \(4\text{ m/s}\). The kinetic energy is \(\tfrac{1}{2}(2)(3)^2=9\text{ J}\) before and \(\tfrac{1}{2}(2)(1)^2+\tfrac{1}{2}(1)(4)^2=1+8=9\text{ J}\) after. The carts have different velocities afterward, so they did not stick.

@ 4 | q | Impulse in two dimensions
A \(0.20\text{ kg}\) ball strikes a wall at \(10\text{ m/s}\) at an angle of \(60^\circ\) from the line perpendicular to the wall and rebounds at the same speed and angle. What is the magnitude of the impulse the wall exerts on the ball?
* \(2.0\text{ N}\cdot\text{s}\)
- \(4.0\text{ N}\cdot\text{s}\)
- \(3.5\text{ N}\cdot\text{s}\)
- \(0\)
= Only the velocity component perpendicular to the wall reverses. That component is \(10\cos 60^\circ=5.0\text{ m/s}\), so the change in momentum is \(2(0.20)(5.0)=2.0\text{ N}\cdot\text{s}\). Using the full speed gives \(4.0\), and using \(\sin 60^\circ\) gives \(3.5\).

@ 4 | q | Recoil
A \(60\text{ kg}\) skater at rest on frictionless ice throws a \(2.0\text{ kg}\) ball horizontally at \(15\text{ m/s}\) relative to the ice. What is the skater's speed afterward?
* \(0.50\text{ m/s}\)
- \(0.48\text{ m/s}\)
- \(7.5\text{ m/s}\)
- \(0.25\text{ m/s}\)
= The total momentum stays zero, so \(60v=2.0(15)\) and \(v=0.50\text{ m/s}\) opposite the ball. Dividing by the combined mass of \(62\text{ kg}\) gives \(0.48\text{ m/s}\), which treats the skater and ball as moving together.

@ 4 | c | Impulse and safety
Why does an air bag reduce injuries to a passenger in a collision, compared with striking the dashboard?
* It increases the time over which the passenger's momentum changes, which reduces the average force.
- It reduces the passenger's change in momentum.
- It reduces the impulse delivered to the passenger.
- It absorbs the passenger's momentum so that momentum is not conserved.
= The passenger must go from the car's speed to rest either way, so the change in momentum and the impulse are fixed. Spreading that impulse over a longer time means a smaller average force, \(F=\dfrac{\Delta p}{\Delta t}\).

@ 4 | c | Momentum and kinetic energy
Object X has twice the mass of object Y, and the two objects have equal kinetic energies. How do their momenta compare?
* Object X has more momentum, by a factor of \(\sqrt{2}\).
- Object Y has more momentum, by a factor of \(\sqrt{2}\).
- They have equal momenta.
- Object X has twice as much momentum.
= Momentum and kinetic energy are related by \(p=\sqrt{2mK}\). With equal kinetic energies, momentum is proportional to \(\sqrt{m}\), so the object with twice the mass has \(\sqrt{2}\) times the momentum.

@ 4 | c | Center of mass
Two skaters, one heavier than the other, stand at rest on frictionless ice and push off from each other. Which statement about the motion afterward is correct?
* The center of mass of the two skaters remains at rest, and the lighter skater moves away faster.
- The center of mass moves toward the heavier skater.
- Both skaters move with equal speeds, because they exert equal forces.
- The heavier skater moves faster, because it pushes harder.
= The push involves only internal forces, so the total momentum stays zero and the center of mass stays put. The skaters receive equal and opposite momenta, so the one with less mass has the greater speed.

@ 5 | q | Static equilibrium | meterStick
A uniform meter stick of mass \(M\) balances on a pivot at the \(40\text{ cm}\) mark when a block of mass \(m\) hangs from the \(10\text{ cm}\) mark, as shown. What is \(m\) in terms of \(M\)?
* \(\dfrac{M}{3}\)
- \(3M\)
- \(\dfrac{M}{4}\)
- \(\dfrac{4M}{3}\)
= The stick's weight acts at its center, \(10\text{ cm}\) right of the pivot. The block is \(30\text{ cm}\) left of the pivot. Balancing torques, \(m(30)=M(10)\), so \(m=\dfrac{M}{3}\).

@ 5 | q | Static equilibrium | meterStick
For the balanced meter stick shown, with the block's mass equal to \(\dfrac{M}{3}\), what is the magnitude of the force the pivot exerts on the stick?
* \(\dfrac{4}{3}Mg\)
- \(Mg\)
- \(\dfrac{1}{3}Mg\)
- \(\dfrac{2}{3}Mg\)
= The stick is in translational equilibrium, so the pivot supports the weights of both the stick and the hanging block: \(Mg+\dfrac{M}{3}g\). The string transmits the block's weight to the stick.

@ 5 | c | Static equilibrium | meterStick
The block hanging on the balanced meter stick shown is moved from the \(10\text{ cm}\) mark to the \(0\text{ cm}\) mark. Where must the pivot be placed to balance the stick again?
* To the left of the \(40\text{ cm}\) mark, closer to the block
- To the right of the \(40\text{ cm}\) mark, closer to the stick's center
- At the \(40\text{ cm}\) mark, because neither mass has changed
- At the \(50\text{ cm}\) mark, the center of the stick
= Moving the block outward increases its lever arm and its torque. Shifting the pivot toward the block shortens the block's lever arm and lengthens the lever arm of the stick's weight until the torques balance again; the balance point is \(37.5\text{ cm}\).

@ 5 | q | Newton's second law for rotation
A uniform disk of mass \(2.0\text{ kg}\) and radius \(0.50\text{ m}\), with rotational inertia \(\tfrac{1}{2}MR^2\), turns on a frictionless axle through its center. A force of \(3.0\text{ N}\) is applied tangent to its rim. What is the disk's angular acceleration?
* \(6.0\text{ rad/s}^2\)
- \(3.0\text{ rad/s}^2\)
- \(12\text{ rad/s}^2\)
- \(1.5\text{ rad/s}^2\)
= The torque is \(3.0(0.50)=1.5\text{ N}\cdot\text{m}\) and the rotational inertia is \(\tfrac{1}{2}(2.0)(0.50)^2=0.25\text{ kg}\cdot\text{m}^2\), so \(\alpha=\dfrac{1.5}{0.25}=6.0\text{ rad/s}^2\). Using \(MR^2\) gives \(3.0\).

@ 5 | q | Static equilibrium
A uniform beam \(4.0\text{ m}\) long with a weight of \(200\text{ N}\) rests horizontally on two supports, one at its left end and one \(1.0\text{ m}\) from its right end. What force does the left support exert on the beam?
* About \(67\text{ N}\)
- \(100\text{ N}\)
- About \(133\text{ N}\)
- \(50\text{ N}\)
= The beam's weight acts at its center, \(2.0\text{ m}\) from the left end and \(1.0\text{ m}\) from the right support. Torques about the right support give \(F_{\text{left}}(3.0)=200(1.0)\), so \(F_{\text{left}}\approx 67\text{ N}\). The right support carries the other \(133\text{ N}\).

@ 5 | c | Torque and angular velocity
A wheel rotates counterclockwise, and its angular speed is decreasing. What is the direction of the net torque on the wheel?
* Clockwise, because the torque opposes the rotation when the wheel slows
- Counterclockwise, because the wheel is turning counterclockwise
- There is no net torque, because the wheel is still turning
- It cannot be determined without the rotational inertia
= Net torque determines angular acceleration, not angular velocity. Slowing a counterclockwise rotation requires a clockwise angular acceleration, so the net torque is clockwise.

@ 5 | c | Rotational inertia
A thin ring and a solid disk have the same mass and radius, and each starts from rest on a frictionless axle through its center. The same tangential force is applied to the rim of each. Which reaches a given angular speed first?
* The disk, because it has the smaller rotational inertia
- The ring, because its mass is concentrated at the rim where the force acts
- They reach it together, because they have the same mass and receive the same torque
- The ring, because it has the larger rotational inertia
= The torques are equal, so the angular accelerations are inversely proportional to the rotational inertias. The disk, \(\tfrac{1}{2}MR^2\), has half the rotational inertia of the ring, \(MR^2\), so it speeds up twice as fast.

@ 5 | c | Choosing an axis for torques
A student finds that the net torque on an object about its center is zero and concludes that the net torque about every other point is also zero. Under what condition is the conclusion valid?
* When the net force on the object is also zero
- Always, because torque does not depend on the choice of axis
- Only when the object is not rotating
- Only when all of the forces act at the center
= Moving the reference point by \(\vec d\) changes the net torque by an amount proportional to the net force. If the net force is zero, the net torque is the same about every point, which is why either condition can be checked about any convenient axis for an object in equilibrium.

@ 6 | q | Rolling and energy
A uniform solid cylinder, with rotational inertia \(\tfrac{1}{2}MR^2\), rolls without slipping at \(4.0\text{ m/s}\) along level ground and then rolls up a ramp. Using \(g=10\text{ m/s}^2\), how high does its center rise?
* \(1.2\text{ m}\)
- \(0.80\text{ m}\)
- \(1.6\text{ m}\)
- \(1.12\text{ m}\)
= Rolling without slipping, the cylinder's kinetic energy is \(\tfrac{1}{2}Mv^2+\tfrac{1}{4}Mv^2=\tfrac{3}{4}Mv^2=12M\). Setting this equal to \(Mgh\) gives \(h=1.2\text{ m}\). A sliding block would rise \(0.80\text{ m}\), a hoop \(1.6\text{ m}\), and a sphere \(1.12\text{ m}\).

@ 6 | q | Angular momentum and energy
A disk with rotational inertia \(2.0\text{ kg}\cdot\text{m}^2\) spins at \(3.0\text{ rad/s}\) on a frictionless axle. A second disk with rotational inertia \(1.0\text{ kg}\cdot\text{m}^2\), not spinning, is dropped onto it along the same axle, and they reach a common angular speed. How much kinetic energy is dissipated?
* \(3.0\text{ J}\)
- \(0\)
- \(6.0\text{ J}\)
- \(4.5\text{ J}\)
= Angular momentum is conserved: \(2.0(3.0)=3.0\omega\), so \(\omega=2.0\text{ rad/s}\). The kinetic energy falls from \(\tfrac{1}{2}(2.0)(3.0)^2=9.0\text{ J}\) to \(\tfrac{1}{2}(3.0)(2.0)^2=6.0\text{ J}\). Friction between the disks dissipates the difference.

@ 6 | q | Rotational energy | pulley
The string wrapped around the uniform disk shown supports a block of mass \(m\). The disk has mass \(M\), radius \(R\), and rotational inertia \(\tfrac{1}{2}MR^2\), and turns on a frictionless axle. The block is released from rest. What is its speed after it has fallen a distance \(h\)?
* \(\sqrt{\dfrac{2mgh}{m+\tfrac{1}{2}M}}\)
- \(\sqrt{2gh}\)
- \(\sqrt{\dfrac{2mgh}{m+M}}\)
- \(\sqrt{\dfrac{mgh}{m+\tfrac{1}{2}M}}\)
= The lost potential energy \(mgh\) becomes the block's kinetic energy and the disk's: \(\tfrac{1}{2}mv^2+\tfrac{1}{2}\left(\tfrac{1}{2}MR^2\right)\dfrac{v^2}{R^2}=\tfrac{1}{2}\left(m+\tfrac{1}{2}M\right)v^2\). Solving for \(v\) gives the result. The disk behaves like an extra mass of \(\tfrac{1}{2}M\).

@ 6 | q | Angular momentum of a particle
A \(2.0\text{ kg}\) puck slides at \(3.0\text{ m/s}\) in a straight line that passes \(4.0\text{ m}\) from point P. What is the magnitude of the puck's angular momentum about P?
* \(24\text{ kg}\cdot\text{m}^2\text{/s}\)
- \(0\)
- \(6.0\text{ kg}\cdot\text{m}^2\text{/s}\)
- \(12\text{ kg}\cdot\text{m}^2\text{/s}\)
= Angular momentum about a point is \(mvd\), where \(d\) is the perpendicular distance from the point to the line of motion: \(2.0(3.0)(4.0)=24\). An object moving in a straight line has angular momentum about any point not on that line.

@ 6 | c | Angular momentum and kinetic energy
Two identical disks spin on frictionless axles, and disk 1 spins twice as fast as disk 2. How do their angular momenta and rotational kinetic energies compare?
* Disk 1 has twice the angular momentum and four times the kinetic energy.
- Disk 1 has twice the angular momentum and twice the kinetic energy.
- Disk 1 has four times the angular momentum and four times the kinetic energy.
- They have the same angular momentum, and disk 1 has twice the kinetic energy.
= With the same rotational inertia, angular momentum \(I\omega\) is proportional to \(\omega\), while kinetic energy \(\tfrac{1}{2}I\omega^2\) is proportional to \(\omega^2\).

@ 6 | c | Rolling without slipping
A wheel rolls without slipping along level ground, and its center moves at speed \(v\). What are the speeds, relative to the ground, of the point at the top of the wheel and the point touching the ground?
* \(2v\) at the top and \(0\) at the bottom
- \(v\) at both points
- \(v\) at the top and \(v\) at the bottom, in opposite directions
- \(0\) at the top and \(2v\) at the bottom
= Each point's velocity is the center's velocity \(v\) plus its velocity due to rotation, \(R\omega=v\). At the top the two add; at the contact point they cancel, which is what "without slipping" means.

@ 6 | c | Rolling and energy
A solid cylinder rolls without slipping down a ramp, and a block slides down an identical, frictionless ramp. Both start from rest at the same height. Which reaches the bottom first?
* The block, because none of its energy goes into rotation
- The cylinder, because rolling involves less friction
- They arrive together, because they descend the same height
- The cylinder, because it gains rotational kinetic energy as well
= Both convert the same fraction of their mass's potential energy per unit mass into kinetic energy, but the cylinder must share it between translation and rotation. At every height the block moves faster, so it arrives first.

@ 6 | c | Angular impulse
A constant net torque acts on a wheel that starts from rest. Which describes a graph of the wheel's angular momentum as a function of time?
* A straight line through the origin with a slope equal to the torque
- A parabola, because the wheel's angle increases quadratically
- A horizontal line, because the torque is constant
- A curve that levels off at a maximum value
= Net torque is the rate of change of angular momentum, \(\tau=\dfrac{\Delta L}{\Delta t}\). A constant torque changes the angular momentum at a constant rate.

@ 7 | q | Period of a spring–block oscillator
A \(0.50\text{ kg}\) block on a spring of spring constant \(200\text{ N/m}\) oscillates on a frictionless surface. What is its period?
* About \(0.31\text{ s}\)
- About \(0.050\text{ s}\)
- About \(0.63\text{ s}\)
- About \(3.1\text{ s}\)
= \(T=2\pi\sqrt{\dfrac{m}{k}}=2\pi\sqrt{\dfrac{0.50}{200}}=2\pi(0.050)\approx 0.31\text{ s}\). Forgetting the factor \(2\pi\) gives \(0.050\text{ s}\).

@ 7 | q | Period of a pendulum
Using \(g=10\text{ m/s}^2\), what length must a simple pendulum have so that its period is \(2.0\text{ s}\)?
* About \(1.0\text{ m}\)
- About \(2.0\text{ m}\)
- About \(0.50\text{ m}\)
- About \(4.0\text{ m}\)
= Solving \(T=2\pi\sqrt{\dfrac{L}{g}}\) for \(L\) gives \(L=\dfrac{gT^2}{4\pi^2}=\dfrac{10(4.0)}{39.5}\approx 1.0\text{ m}\). Period grows as the square root of length, so doubling the period would take four times the length.

@ 7 | q | Simple harmonic motion graphs | shm
The graph shows the position of a \(0.50\text{ kg}\) block oscillating on a spring. What is the spring constant?
* About \(4.9\text{ N/m}\)
- About \(9.9\text{ N/m}\)
- About \(1.6\text{ N/m}\)
- About \(2.5\text{ N/m}\)
= The period is \(2.0\text{ s}\), so \(\omega=\pi\text{ rad/s}\). From \(\omega^2=\dfrac{k}{m}\), \(k=0.50\pi^2\approx 4.9\text{ N/m}\).

@ 7 | q | Energy in simple harmonic motion | shm
The graph shows the position of a block on a spring with spring constant \(5.0\text{ N/m}\). What is the total mechanical energy of the oscillator?
* \(0.10\text{ J}\)
- \(0.20\text{ J}\)
- \(0.50\text{ J}\)
- \(1.0\text{ J}\)
= The amplitude is \(0.20\text{ m}\), and the total energy equals the spring energy at maximum displacement: \(\tfrac{1}{2}(5.0)(0.20)^2=0.10\text{ J}\).

@ 7 | c | Period of a spring–block oscillator
A block on a horizontal spring oscillates on Earth with period \(T\). The same apparatus is taken to the Moon, where the gravitational field is about one sixth as strong. What is the period there?
* \(T\)
- \(\sqrt{6}\,T\)
- \(\dfrac{T}{\sqrt{6}}\)
- \(6T\)
= The period of a spring–block oscillator, \(2\pi\sqrt{\dfrac{m}{k}}\), depends only on the mass and the spring constant. Gravity does not provide the restoring force on a horizontal spring, unlike a pendulum.

@ 7 | c | Period of a pendulum
A pendulum clock keeps correct time at room temperature. On a hot day its metal pendulum rod expands slightly. How does the clock behave?
* It runs slow, because a longer pendulum has a longer period.
- It runs fast, because a longer pendulum swings through a larger arc.
- It keeps correct time, because the period does not depend on length.
- It runs fast, because the pendulum gains mass.
= The period of a pendulum is proportional to \(\sqrt{L}\). A longer rod takes longer for each swing, so the clock completes fewer ticks per hour and falls behind.

@ 7 | c | Velocity and acceleration in simple harmonic motion
A block on a spring oscillates between \(x=-A\) and \(x=+A\). At an instant when it is at \(x=+\tfrac{A}{2}\) and moving toward equilibrium, which describes its velocity and acceleration?
* Both point in the \(-x\) direction, so the block is speeding up.
- The velocity points in the \(-x\) direction and the acceleration in the \(+x\) direction, so the block is slowing down.
- Both point in the \(+x\) direction, so the block is speeding up.
- The velocity points in the \(-x\) direction and the acceleration is zero.
= The block moves toward equilibrium, in the \(-x\) direction. The restoring force always points toward equilibrium, also \(-x\) here. With velocity and acceleration in the same direction, the block speeds up until it reaches \(x=0\).

@ 7 | c | Simple harmonic motion graphs
For a block oscillating on a spring, which describes a graph of the block's acceleration as a function of its position?
* A straight line through the origin with a negative slope
- A straight line through the origin with a positive slope
- A cosine curve
- A horizontal line, because the spring constant is constant
= Newton's second law with Hooke's law gives \(a=-\dfrac{k}{m}x\): the acceleration is proportional to the displacement and opposite to it. This defining relationship of simple harmonic motion is linear in \(x\).

@ 7 | c | Simple harmonic motion graphs | shm
The graph shows the position of a block oscillating on a spring. Which statement describes the block at \(t=1.0\text{ s}\)?
* Its velocity is zero, and its acceleration has its maximum value in the \(+x\) direction.
- Its velocity is maximum, and its acceleration is zero.
- Its velocity and its acceleration are both zero.
- Its velocity is zero, and its acceleration has its maximum value in the \(-x\) direction.
= At \(t=1.0\text{ s}\) the block is at \(x=-0.20\text{ m}\), a turning point, so it is momentarily at rest. The stretched spring pulls it back toward equilibrium, in the \(+x\) direction, with the greatest force.

@ 8 | q | Buoyancy | submerged
A block with a volume of \(1.0\times 10^{-3}\text{ m}^3\) and a density of \(3000\text{ kg/m}^3\) hangs from scale 1 and is completely submerged in water of density \(1000\text{ kg/m}^3\), as shown. Using \(g=10\text{ m/s}^2\), what does scale 1 read?
* \(20\text{ N}\)
- \(30\text{ N}\)
- \(10\text{ N}\)
- \(40\text{ N}\)
= The block weighs \(3000(1.0\times 10^{-3})(10)=30\text{ N}\). The buoyant force is the weight of the displaced water, \(1000(1.0\times 10^{-3})(10)=10\text{ N}\). The scale supplies the rest: \(30-10=20\text{ N}\).

@ 8 | q | Buoyancy and Newton's third law | submerged
Before the block shown is lowered into the water, scale 2 reads \(50\text{ N}\). The block weighs \(30\text{ N}\), and the water exerts a buoyant force of \(10\text{ N}\) on it. What does scale 2 read once the block is submerged without touching the beaker?
* \(60\text{ N}\)
- \(50\text{ N}\)
- \(80\text{ N}\)
- \(70\text{ N}\)
= The water pushes up on the block with \(10\text{ N}\), so the block pushes down on the water with \(10\text{ N}\), and that force reaches scale 2. The other \(20\text{ N}\) of the block's weight is held by scale 1, not the beaker.

@ 8 | c | Buoyancy | submerged
The submerged block shown is lowered slowly to a greater depth, still without touching the beaker. Treating water as incompressible, how do the readings of the two scales change?
* Neither reading changes.
- Scale 1 decreases and scale 2 increases.
- Scale 1 increases and scale 2 decreases.
- Both readings increase.
= The buoyant force depends on the volume of water displaced, not on depth, so the force on the block and its reaction on the water are unchanged. The pressure on every face rises with depth, but the difference between top and bottom does not.

@ 8 | q | Bernoulli's equation
Water flows through a horizontal pipe that narrows from a cross-sectional area of \(0.020\text{ m}^2\) to \(0.010\text{ m}^2\). The speed in the wide section is \(2.0\text{ m/s}\), and the density of water is \(1000\text{ kg/m}^3\). How much greater is the pressure in the wide section than in the narrow section?
* \(6000\text{ Pa}\)
- \(2000\text{ Pa}\)
- \(8000\text{ Pa}\)
- \(12000\text{ Pa}\)
= Continuity gives \(4.0\text{ m/s}\) in the narrow section. Bernoulli's equation for a horizontal pipe gives \(\Delta P=\tfrac{1}{2}(1000)\left(4.0^2-2.0^2\right)=6000\text{ Pa}\).

@ 8 | q | Fluid pressure
Atmospheric pressure is \(1.0\times 10^5\text{ Pa}\) and water has a density of \(1000\text{ kg/m}^3\). Using \(g=10\text{ m/s}^2\), at what depth in a lake is the absolute pressure twice atmospheric pressure?
* \(10\text{ m}\)
- \(20\text{ m}\)
- \(5\text{ m}\)
- \(100\text{ m}\)
= The absolute pressure is \(P_{\text{atm}}+\rho gh\). It doubles when the gauge pressure equals atmospheric pressure: \(1000(10)h=1.0\times 10^5\), so \(h=10\text{ m}\).

@ 8 | q | Volume flow rate
A hose with a cross-sectional area of \(2.0\text{ cm}^2\) fills a \(20\text{ L}\) bucket in \(40\text{ s}\). What is the speed of the water in the hose? \((1\text{ L}=1.0\times 10^{-3}\text{ m}^3)\)
* \(2.5\text{ m/s}\)
- \(0.25\text{ m/s}\)
- \(25\text{ m/s}\)
- \(0.50\text{ m/s}\)
= The flow rate is \(\dfrac{0.020\text{ m}^3}{40\text{ s}}=5.0\times 10^{-4}\text{ m}^3\text{/s}\). The area is \(2.0\times 10^{-4}\text{ m}^2\), so \(v=\dfrac{Q}{A}=2.5\text{ m/s}\). Converting square centimeters as if they were \(10^{-2}\text{ m}^2\) gives the wrong powers of ten.

@ 8 | c | Pressure in an accelerating fluid
A helium balloon is tied to the floor of a closed car and floats upright. The car accelerates forward. Which way does the balloon tilt, and why?
* Forward, because the accelerating air is at higher pressure toward the back of the car, which pushes the balloon forward
- Backward, because objects tend to stay at rest
- Backward, because the string pulls it toward the back of the car
- It stays upright, because the air moves with the car
= To accelerate the air forward, the back of the car must push it, so pressure increases from front to back. The less-dense balloon is pushed toward lower pressure, forward, just as it rises against the vertical pressure gradient caused by gravity.

@ 8 | c | Buoyancy
A glass is filled to the brim with water, and an ice cube floats in it. What happens as the ice melts?
* The water level stays the same, and no water overflows.
- Water overflows, because the ice adds water to the glass.
- The water level drops, because ice is less dense than water.
- Water overflows, because melting ice expands.
= The floating ice displaces a mass of water equal to its own mass. When it melts, it becomes exactly that mass of water, which fills the volume it had been displacing.

@ 8 | c | Continuity
Water flows steadily from a wide pipe into a narrower pipe. How do the volume flow rate and the flow speed in the narrow pipe compare with those in the wide pipe?
* The volume flow rate is the same, and the speed is greater.
- The volume flow rate and the speed are both greater.
- The volume flow rate is smaller, and the speed is the same.
- The volume flow rate is smaller, and the speed is greater.
= An incompressible fluid cannot accumulate, so the volume passing each section per second, \(Av\), is the same everywhere. A smaller area therefore requires a larger speed.
`;

module.exports = { source, figures };
