// Second batch for the AP Physics 1 bank: conceptual questions that bring the bank to an
// even split between conceptual and quantitative items. Same block format as physics1.cjs,
// and the figure keys refer to the figures defined there.
const source = String.raw`
@ 1 | c | Interpreting a velocity graph | vt
The graph shows the velocity of a cart moving along a straight track. During which time interval is the speed of the cart decreasing?
* From \(t=5\text{ s}\) to \(t=6.5\text{ s}\) only
- From \(t=5\text{ s}\) to \(t=8\text{ s}\)
- From \(t=6.5\text{ s}\) to \(t=8\text{ s}\) only
- From \(t=2\text{ s}\) to \(t=5\text{ s}\)
= Speed is the magnitude of velocity. From \(5\text{ s}\) to \(6.5\text{ s}\) the velocity is positive and approaching zero, so the cart slows. After \(6.5\text{ s}\) the velocity is negative and growing in magnitude, so the cart speeds up even though the graph is still falling.

@ 1 | c | Comparing motion from position graphs | xt
The graph shows the positions of carts A and B as functions of time. How do the average velocities of the carts compare for the interval from \(t=0\) to \(t=4\text{ s}\)?
* They are equal, because the carts have the same displacement in the same time.
- Cart A's is greater, because cart B moves slowly for most of the interval.
- Cart B's is greater, because cart B is moving faster at the end of the interval.
- They cannot be compared, because cart B is accelerating.
= Average velocity is displacement divided by elapsed time. Both carts start at \(x=0\) and are at \(x=8\text{ m}\) at \(t=4\text{ s}\), so their average velocities are both \(2\text{ m/s}\), whatever happens in between.

@ 1 | c | Vectors in projectile motion
A ball is thrown at an angle above the horizontal and air resistance is negligible. Which of the following describes the angle between the ball's velocity vector and its acceleration vector during the flight?
* It is greater than \(90^\circ\) while the ball rises, \(90^\circ\) at the top, and less than \(90^\circ\) while the ball falls.
- It is \(90^\circ\) throughout the flight.
- It is \(180^\circ\) while the ball rises and \(0^\circ\) while the ball falls.
- It is less than \(90^\circ\) while the ball rises and greater than \(90^\circ\) while the ball falls.
= The acceleration always points straight down. While the ball rises its velocity has an upward component, so the angle between the vectors exceeds \(90^\circ\) and the ball slows. At the top the velocity is horizontal. While the ball falls the velocity has a downward component and the ball speeds up.

@ 1 | c | Projectile motion
A dart is aimed directly at a target hanging from a tree. At the instant the dart is fired, the target is released and falls from rest. Air resistance is negligible, and the dart is fast enough to reach the target's horizontal position before either hits the ground. Which of the following is true?
* The dart hits the target, because both fall the same distance below the straight line along which the dart was aimed.
- The dart passes above the target, because the target has been falling for the whole time.
- The dart passes below the target, because the dart's upward speed decreases while the target simply falls.
- Whether the dart hits depends on the dart's launch speed.
= Without gravity the dart would travel along its aiming line and strike the stationary target. With gravity, in any time \(t\) both the dart and the target are displaced downward by the same amount, \(\tfrac{1}{2}gt^2\), from where they would otherwise be, so they still meet.

@ 1 | c | Acceleration and velocity
An object moves along a straight line. At \(t=0\) its velocity is in the \(+x\) direction, and its acceleration is constant and in the \(-x\) direction for all later times. Which of the following describes the object's motion?
* It slows, stops for an instant, and then speeds up in the \(-x\) direction.
- It slows, stops, and then remains at rest.
- It slows but never stops, because the acceleration is constant.
- It continues in the \(+x\) direction at a decreasing speed for all later times.
= A constant acceleration changes the velocity at a steady rate, so the velocity decreases through zero and becomes negative. The object is at rest only for an instant; the acceleration does not vanish when the velocity does.

@ 2 | c | Contact forces | pushed
Blocks A and B are in contact on a frictionless horizontal surface, and block A has the greater mass. In trial 1 a force of magnitude \(F\) pushes on block A toward block B, as shown. In trial 2 a force of the same magnitude pushes on block B toward block A. How do the magnitudes of the force between the blocks compare in the two trials?
* It is greater in trial 2, because the contact force must then accelerate the more massive block.
- It is greater in trial 1, because the force is applied to the more massive block.
- It is the same, because the acceleration of the blocks is the same in both trials.
- It is the same, because the blocks exert equal and opposite forces on each other.
= The blocks have the same acceleration in both trials. In trial 1 the contact force is the net force on the lighter block B; in trial 2 it is the net force on the heavier block A, so it must be larger. Newton's third law relates the two forces within a single trial, not across trials.

@ 2 | c | Newton's third law
A truck pushes a stalled car along a level road, and both vehicles are speeding up. How does the magnitude of the force the truck exerts on the car compare with the magnitude of the force the car exerts on the truck?
* They are equal, even though the vehicles are accelerating.
- The truck's force is greater, because the vehicles are speeding up.
- The truck's force is greater, because the truck has more mass.
- The car's force is greater, because the car resists being moved.
= The two forces are a Newton's third law pair, so they are equal in magnitude under all conditions. The car speeds up because the truck's push exceeds the other forces on the car, not because it exceeds the car's push on the truck.

@ 2 | c | Atwood's machine | atwood
Blocks of mass \(m\) and \(3m\) hang from a light string over a light, frictionless pulley, as shown, and are released. The experiment is repeated with the \(3m\) block removed and a student pulling down on that end of the string with a constant force equal to \(3mg\). How does the acceleration of the block of mass \(m\) compare in the two cases?
* It is greater when the student pulls, because the tension is then \(3mg\) instead of less than \(3mg\).
- It is the same, because the same force acts on that end of the string.
- It is smaller when the student pulls, because a hand cannot fall freely.
- It is the same, because the block of mass \(m\) is unchanged.
= With the hanging block, the \(3m\) block must itself accelerate downward, so the tension is less than its weight (it is \(\tfrac{3}{2}mg\)), and the small block accelerates at \(\tfrac{g}{2}\). When the student pulls with \(3mg\), the tension is \(3mg\) and the small block accelerates at \(2g\).

@ 2 | c | Orbital motion
Astronauts in a space station orbiting Earth appear to float. Which of the following best explains why?
* The astronauts and the station are both in free fall, accelerating toward Earth at the same rate.
- The gravitational force on the astronauts is zero at the altitude of the station.
- The gravitational force on the astronauts is balanced by an outward centrifugal force.
- The station's walls shield the astronauts from Earth's gravitational field.
= At the altitude of a typical station the gravitational field is only slightly weaker than at the surface, and gravity is what keeps the station in orbit. Because the astronauts and the station share the same acceleration, the station exerts no normal force on them.

@ 3 | c | Energy with friction | inclineH
A block slides from rest down the rough ramp shown and reaches the bottom with speed \(v\). The ramp is replaced with a steeper one of the same height \(h\) and the same coefficient of kinetic friction. How does the block's speed at the bottom of the steeper ramp compare with \(v\)?
* It is greater, because both the friction force and the distance over which it acts are smaller.
- It is the same, because the block descends through the same height.
- It is smaller, because the block has less time to speed up.
- It is the same, because the coefficient of friction is the same.
= The energy dissipated by friction is \(\mu_kmg\cos\theta\) multiplied by the ramp length \(\dfrac{h}{\sin\theta}\), which equals \(\dfrac{\mu_kmgh}{\tan\theta}\). A steeper ramp makes this smaller, so more of the potential energy becomes kinetic energy. Only without friction would the speeds be equal.

@ 3 | c | Energy and circular motion | loop
A small block slides along the frictionless track shown and travels all the way around the loop. At which point in the loop is the normal force exerted on the block by the track greatest?
* At the bottom of the loop
- At the top of the loop
- At the points level with the center of the loop
- It is the same at every point, because the track is frictionless.
= At the bottom the block is moving fastest, so it needs the largest centripetal force, and the normal force must also overcome gravity: \(N=\dfrac{mv^2}{R}+mg\). At the top the speed is least and gravity helps supply the centripetal force, so the normal force is smallest there.

@ 3 | c | Work done by static friction
A crate rests on the bed of a truck. The truck speeds up along a level road, and the crate does not slide on the bed. In the reference frame of the road, which of the following is true of the static friction force exerted on the crate by the truck bed?
* It does positive work on the crate, because it acts in the direction of the crate's displacement.
- It does no work on the crate, because static friction never does work.
- It does negative work on the crate, because friction opposes motion.
- It does no work on the crate, because the crate does not move relative to the truck bed.
= The crate's kinetic energy increases, and static friction is the only horizontal force on it, so that force does positive work. Static friction opposes relative sliding between surfaces, not motion itself, and the crate is displaced relative to the road while the force acts.

@ 3 | c | Energy graphs
A ball is dropped from rest and air resistance is negligible. Which of the following describes a graph of the ball's kinetic energy as a function of the distance it has fallen?
* A straight line through the origin with slope \(mg\)
- A parabola that opens upward, because the ball's speed increases
- A horizontal line, because mechanical energy is conserved
- A curve that levels off as the ball approaches the ground
= The work done by gravity is \(mg\) multiplied by the distance fallen, and that work equals the kinetic energy gained, so the graph is linear. Plotted against time instead, the kinetic energy is \(\tfrac{1}{2}mg^2t^2\), which is a parabola.

@ 4 | c | Forces during a collision | cartsStick
A cart of mass \(2m\) collides with a cart of mass \(m\) that is at rest, as shown. Which of the following correctly compares the two carts during the collision?
* The forces on the carts have equal magnitudes, and the lighter cart has the greater acceleration.
- The heavier cart exerts the greater force, and the lighter cart has the greater acceleration.
- The forces on the carts have equal magnitudes, and the accelerations have equal magnitudes.
- The moving cart exerts the greater force, because the other cart is at rest.
= The forces the carts exert on each other are a Newton's third law pair and are equal at every instant. Because acceleration is force divided by mass, the cart with half the mass has twice the acceleration.

@ 4 | c | Impulse | Ft
The graph shows the net force exerted on a cart as a function of time. During which time interval is the cart's momentum changing at the greatest rate?
* From \(t=2\text{ s}\) to \(t=4\text{ s}\)
- From \(t=0\) to \(t=2\text{ s}\), because the force is increasing
- From \(t=4\text{ s}\) to \(t=6\text{ s}\), because the cart is moving fastest
- The rate is the same throughout, because the force acts in one direction
= The rate of change of momentum equals the net force, so it is greatest when the force is greatest, which is between \(2\text{ s}\) and \(4\text{ s}\). How quickly the force itself is changing does not determine how quickly the momentum changes.

@ 4 | c | Conservation of momentum
An open cart rolls along a level, frictionless track. In case 1, rain falling vertically collects in the cart. In case 2, there is no rain and water already in the cart drains straight down through a hole in its floor. How does the speed of the cart change in each case?
* It decreases in case 1 and stays the same in case 2.
- It decreases in case 1 and increases in case 2.
- It stays the same in both cases, because no horizontal force acts on the cart.
- It stays the same in case 1 and increases in case 2.
= Falling rain has no horizontal momentum, so the cart must share its momentum with the added water and slows down. Draining water leaves with the same horizontal velocity as the cart, carrying away its own share of the momentum, so nothing changes the speed of what remains.

@ 4 | c | Conservation and system choice
A rubber ball strikes a wall that is fixed to the ground and bounces straight back with the same speed. A student claims that momentum is not conserved because the ball's momentum changed. Which of the following correctly evaluates the claim?
* The momentum of the ball alone is not constant, but the momentum of the ball–wall–Earth system is conserved.
- The claim is incorrect, because the ball's momentum has the same magnitude before and after the collision.
- The claim is correct, because momentum is conserved only when kinetic energy is lost.
- The claim is correct, because the wall does not move.
= The wall exerts an external force on the ball, so the momentum of the ball alone changes by \(2mv\). The wall and Earth receive an equal and opposite change in momentum; because their mass is enormous, the resulting change in their velocity is far too small to notice.

@ 5 | c | Torque and equilibrium | seesaw
A block at the left end of a uniform plank keeps the plank balanced on the pivot, as shown. The block is then moved a short distance to the right, toward the pivot. What happens to the plank?
* It rotates so that its right end moves down, because the block's torque is now smaller than the torque due to the plank's weight.
- It rotates so that its left end moves down, because the block is closer to the pivot.
- It stays balanced, because the weights of the block and the plank have not changed.
- It stays balanced, because the pivot force increases to compensate.
= The plank's weight acts at its center, to the right of the pivot, and its torque is unchanged. Moving the block toward the pivot shortens its lever arm and reduces its torque, so the net torque rotates the right end downward. The pivot force acts at the pivot and exerts no torque about it.

@ 5 | c | Newton's second law for rotation
Two blocks of different mass hang from the ends of a string that passes over a pulley. The pulley has significant mass and turns on a frictionless axle, and the string does not slip on the pulley. While the blocks are accelerating, how do the tensions in the two sides of the string compare?
* The tension is greater on the side of the heavier block, because a net torque is needed to give the pulley angular acceleration.
- The tensions are equal, because it is a single string.
- The tension is greater on the side of the lighter block, because that block is accelerating upward.
- The tensions are equal, because the axle is frictionless.
= The pulley has rotational inertia and is speeding up, so the two tensions must exert unequal torques on it. The pulley turns toward the heavier block, so the tension on that side is larger. The tensions are equal only when the pulley's mass is negligible.

@ 5 | c | Force and torque
A rod lies at rest on a frictionless horizontal surface. Two forces of equal magnitude and opposite direction are then applied perpendicular to the rod, one at each end, and they remain perpendicular to the rod as it moves. Which of the following describes the motion of the rod?
* Its center of mass remains at rest and it rotates with increasing angular speed.
- Its center of mass accelerates and it does not rotate.
- It remains at rest, because the forces cancel.
- Its center of mass accelerates and it rotates with increasing angular speed.
= The net force is zero, so the center of mass does not accelerate. The two forces produce torques in the same rotational direction about the center, so the net torque is not zero and the rod's angular speed increases.

@ 5 | c | Rolling and friction | inclineBall
A ball rolls without slipping down the ramp shown. Which of the following describes the friction force exerted on the ball by the ramp?
* It is static friction directed up the ramp, and it provides the torque that increases the ball's rate of rotation.
- It is kinetic friction directed up the ramp, and it dissipates part of the ball's energy.
- It is static friction directed down the ramp, and it increases the ball's speed.
- It is zero, because the point of contact does not slide.
= As the ball speeds up it must also spin faster, which requires a torque about its center; gravity and the normal force exert none. Friction directed up the ramp supplies that torque. Because the point of contact does not slide, the friction is static and dissipates no energy.

@ 6 | c | Rolling and energy | inclineBall
A solid sphere and a hoop of equal mass are released from rest at the top of the ramp shown and roll without slipping. How do their kinetic energies compare at the bottom?
* Their total kinetic energies are equal, and the sphere has more translational kinetic energy.
- Their total kinetic energies are equal, and so are their translational kinetic energies.
- The sphere has more total kinetic energy, because it is moving faster.
- The hoop has more total kinetic energy, because it has more rotational inertia.
= Each object converts the same potential energy \(mgh\) into kinetic energy, so the totals are equal. The hoop puts half of its kinetic energy into rotation and the sphere only two sevenths, so the sphere has more translational kinetic energy and reaches the bottom moving faster.

@ 6 | c | Angular momentum in orbits
A comet moves around the Sun in a highly elongated elliptical orbit. Where in its orbit is the comet moving fastest, and why?
* At its closest point to the Sun, because its angular momentum about the Sun is constant and its distance is smallest there.
- At its farthest point from the Sun, because the gravitational force on it is weakest there.
- At its closest point to the Sun, because the Sun exerts a torque that speeds it up there.
- Its speed is the same everywhere, because the mechanical energy of the comet–Sun system is constant.
= The gravitational force points along the line to the Sun, so it exerts no torque about the Sun and the comet's angular momentum is conserved. A smaller distance therefore requires a greater speed. Equivalently, the system's potential energy is lowest at the closest point, so the kinetic energy is highest.

@ 6 | c | Conservation of angular momentum
A student sits at rest on a stool that can rotate freely about a vertical axis. The student holds a wheel with its axle vertical; the wheel is spinning counterclockwise as seen from above. The student turns the wheel over so that it spins clockwise as seen from above. What happens to the student and the stool?
* They rotate counterclockwise, with an angular momentum equal to twice the wheel's original angular momentum.
- They rotate clockwise, with an angular momentum equal to the wheel's original angular momentum.
- They rotate counterclockwise, with an angular momentum equal to the wheel's original angular momentum.
- They remain at rest, because the wheel's angular speed has not changed.
= No external torque acts about the vertical axis, so the total angular momentum stays equal to the wheel's original value \(L\), counterclockwise. After the flip the wheel has \(-L\), so the student and stool must have \(+2L\) for the total to remain \(L\).

@ 6 | c | Angular momentum in collisions | putty
A lump of clay strikes the free end of a pivoted rod and sticks, as shown, giving the rod an angular speed \(\omega\). The experiment is repeated with a rubber ball of the same mass and speed, which bounces straight back. How does the rod's angular speed just after the collision compare with \(\omega\)?
* It is greater, because the ball's angular momentum about the pivot changes by a larger amount.
- It is smaller, because the ball does not stay with the rod.
- It is the same, because the ball and the clay have the same angular momentum before the collision.
- It is smaller, because the ball keeps some kinetic energy.
= The total angular momentum about the pivot is conserved. The clay ends up with a small angular momentum in its original direction, while the ball's angular momentum reverses direction, so the ball's change is larger and the rod receives more angular momentum.

@ 6 | c | Sliding and rolling
A bowling ball is released onto a rough horizontal lane sliding at speed \(v\) without rotating. Which of the following describes its motion afterward?
* Its speed decreases and its rate of rotation increases until it rolls without slipping, and then both remain constant.
- Its speed and its rate of rotation both decrease until it stops.
- Its speed stays constant while its rate of rotation increases.
- Its speed decreases until it stops, and then it begins to roll.
= Kinetic friction acts backward at the point of contact, which slows the ball's center and also exerts a torque that spins the ball up. Once the speed of the center equals \(R\omega\), the contact point no longer slides, the kinetic friction disappears, and the ball rolls at constant speed.

@ 7 | c | Energy in simple harmonic motion | shm
The graph shows the position of a block oscillating on a spring as a function of time. At which of the following times is the kinetic energy of the block greatest?
* \(t=1.5\text{ s}\)
- \(t=1.0\text{ s}\)
- \(t=2.0\text{ s}\)
- \(t=0\)
= The block moves fastest as it passes through equilibrium, \(x=0\), where the graph is steepest; that happens at \(t=1.5\text{ s}\). At the other times listed the block is at maximum displacement, momentarily at rest, with all of the energy stored in the spring.

@ 7 | c | Forces in simple harmonic motion | springBlock
A block on a spring oscillates between \(x=-A\) and \(x=+A\) on a frictionless surface, as shown. Which of the following is true at the instant the block is at \(x=+A\)?
* Its velocity is zero, and its acceleration has its greatest magnitude and is directed toward \(x=0\).
- Its velocity and its acceleration are both zero.
- Its velocity is zero, and its acceleration has its greatest magnitude and is directed away from \(x=0\).
- Its velocity has its greatest magnitude and its acceleration is zero.
= At the turning point the block is momentarily at rest, but the spring is stretched the most, so the restoring force and the acceleration are greatest and point back toward equilibrium. If the acceleration were zero there, the block would stay at rest.

@ 7 | c | Timing in simple harmonic motion | springBlock
A block on a spring is released from rest at \(x=+A\), as shown. How does the time it takes to move from \(x=+A\) to \(x=\tfrac{A}{2}\) compare with the time it takes to move from \(x=\tfrac{A}{2}\) to \(x=0\)?
* The first interval is longer, because the block is moving more slowly near the turning point.
- The two intervals are equal, because the distances are equal.
- The first interval is shorter, because the acceleration is greatest near the turning point.
- The two intervals are equal, because the period does not depend on amplitude.
= The block starts from rest at \(x=+A\) and is still slow as it reaches \(\tfrac{A}{2}\), while it covers the second half of the distance near its maximum speed. With \(x=A\cos\omega t\), the first interval lasts one sixth of a period and the second lasts one twelfth.

@ 7 | c | Energy in simple harmonic motion
A block on a spring oscillates with period \(T\). Which of the following describes how the kinetic energy of the block varies with time?
* It oscillates between zero and a maximum with period \(\dfrac{T}{2}\).
- It oscillates between zero and a maximum with period \(T\).
- It oscillates between negative and positive values with period \(T\).
- It remains constant, because mechanical energy is conserved.
= The block passes through equilibrium, where its kinetic energy is greatest, twice in each cycle, once in each direction. Kinetic energy depends on the square of the velocity, so it is never negative and it repeats twice as often as the position does.

@ 8 | c | Buoyancy | float
A block floats in fresh water, as shown. The block is then placed in salt water, which is denser than fresh water. How do the buoyant force on the block and the volume of the block that is submerged compare with their values in fresh water?
* The buoyant force is the same and the submerged volume is smaller.
- The buoyant force is greater and the submerged volume is the same.
- The buoyant force is greater and the submerged volume is smaller.
- The buoyant force is the same and the submerged volume is the same.
= A floating block is in equilibrium, so the buoyant force equals the block's weight in either liquid. The buoyant force also equals the weight of the displaced liquid, and a smaller volume of the denser liquid has that weight.

@ 8 | c | Torricelli's theorem | tank
A large open tank is filled with water to height \(H\), as shown. One small hole is made at depth \(h\) below the surface, and a second small hole is made at height \(h\) above the ground. How do the horizontal distances at which the two streams land compare?
* They are equal.
- The stream from the lower hole lands farther away, because it leaves with a greater speed.
- The stream from the upper hole lands farther away, because it falls for a longer time.
- The answer depends on whether \(h\) is less than or greater than \(\dfrac{H}{2}\).
= A stream from depth \(d\) leaves with speed \(\sqrt{2gd}\) and falls for a time \(\sqrt{2(H-d)/g}\), so it lands \(2\sqrt{d(H-d)}\) away. Depths of \(h\) and \(H-h\) give the same product: the upper stream is slower but falls longer by exactly the compensating amount.

@ 8 | c | Buoyancy
A solid metal cube hangs from a string and is completely submerged in a tank of water. The cube is lowered until it is twice as deep, still without touching the bottom. Treating water as incompressible, how does the tension in the string change?
* It stays the same, because the buoyant force depends on the volume of water displaced, not on depth.
- It decreases, because the pressure on the cube is greater at the greater depth.
- It increases, because more water lies above the cube.
- It decreases, because the buoyant force is proportional to depth.
= The pressures on the top and bottom faces both increase with depth, but their difference, which produces the buoyant force, depends only on the height of the cube. The buoyant force and the cube's weight are unchanged, so the tension is unchanged.

@ 8 | c | Buoyancy and Newton's third law
A beaker of water sits on a scale. A student lowers a finger into the water without touching the beaker, and no water spills. What happens to the reading on the scale?
* It increases by an amount equal to the buoyant force on the finger.
- It stays the same, because the finger is supported by the student and does not touch the beaker.
- It increases by an amount equal to the weight of the finger.
- It decreases, because the water exerts an upward force on the finger.
= The water exerts an upward buoyant force on the finger, so by Newton's third law the finger exerts an equal downward force on the water, and that force is passed on to the scale. Equivalently, the water level rises, increasing the pressure on the bottom of the beaker.
`;

module.exports = { source };
