// AP Physics C: Mechanics free-response practice: eight original questions, two of each
// released question type, each modeled on a 2025 or 2026 released question with the same
// point total and skills. Calculus-based derivations throughout.
const { draw, spring } = require('../ap-mcq-build/diagram.cjs');
const { pt, part, tableFigure, text, fig, axes } = require('./frq-helpers.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const SG = year => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-physics-c-mech.pdf`;
const modeled = (year, n, type) => ({ year, question: n, type, label: `${year} AP Physics C: Mechanics Question ${n} (${type})`, url: SG(year) });

const frqs = [];

// ── 1. Mathematical Routines (modeled on 2025 Q1: impulse from a time-varying force) ──
frqs.push({
  id: 'physc-mr-rebound', questionNumber: 1, title: 'Ball Rebounding from a Wall', topic: 'Mathematical Routines · Impulse from a time-dependent force',
  modeledOn: modeled(2025, 1, 'Mathematical Routines'), timeAllottedMin: 25,
  prompt: String.raw`A ball of mass \(m\) moves to the right with speed \(v_0\) on a horizontal frictionless surface and strikes a rigid wall. The ball is in contact with the wall from \(t = 0\) to \(t = t_c\) and rebounds to the left with speed \(\tfrac{1}{2}v_0\). During the contact, the magnitude of the force exerted by the wall on the ball is modeled as \(F(t) = F_{\max}\left[1 - \left(\dfrac{2t}{t_c} - 1\right)^2\right]\), where \(F_{\max}\) is a constant.`,
  figures: [fig('Figure 1', draw(360, 110, 'A ball of mass m moves right with speed v0 toward a rigid wall on the right side of a horizontal surface', [
    ['line', 10, 90, 300, 90, { width: 2 }], ['hatch', 300, 90, 300, 15], ['circle', 200, 70, 20, { fill: true }], text(200, 75, 'm', { italic: true }), ['arrow', 120, 70, 172, 70], text(140, 60, 'v₀', { italic: true }),
  ]))],
  parts: [
    part('A (i)', String.raw`On axes of force magnitude versus time, sketch \(F(t)\) from \(t = 0\) to \(t = t_c\).`, [
      pt('physc-mr-rebound-a1', 'representation', String.raw`Sketches a curve that is zero at \(t = 0\) and \(t = t_c\) and positive in between.`, ['starts the curve at Fmax', 'draws a nonzero force at the endpoints'], 'A curve starting and ending on the time axis.', 'A horizontal line at Fmax.'),
      pt('physc-mr-rebound-a2', 'representation', String.raw`Sketches a symmetric, concave-down curve with its maximum value \(F_{\max}\) at \(t = \tfrac{t_c}{2}\).`, ['places the maximum at an endpoint', 'draws a triangle with straight sides'], 'A downward parabola peaking at Fmax at tc/2.', 'A triangle peaking at tc/2.'),
    ], [fig('Figure 2', axes('Blank axes of force magnitude F versus time t, with dashed vertical lines at tc/2 and tc', 'F', [[150, 't꜀/2'], [260, 't꜀']]))]),
    part('A (ii)', String.raw`Derive an expression for \(F_{\max}\) in terms of \(m\), \(v_0\), \(t_c\), and physical constants, as appropriate. Begin your derivation by writing a fundamental physics principle or an equation from the reference information.`, [
      pt('physc-mr-rebound-a3', 'derivation', String.raw`Writes the impulse-momentum theorem as an integral, \(J = \int F\,dt = \Delta p\).`, ['uses J = FΔt with a constant force', 'starts with F = ma and a constant acceleration'], String.raw`\(\int_0^{t_c} F\,dt = \Delta p\).`, String.raw`\(F_{\max}t_c = \Delta p\).`),
      pt('physc-mr-rebound-a4', 'derivation', String.raw`Writes the magnitude of the change in momentum as \(m\left(v_0 + \tfrac{1}{2}v_0\right) = \tfrac{3}{2}mv_0\).`, ['subtracts the speeds, getting ½mv0', 'ignores the rebound'], String.raw`\(|\Delta p| = \tfrac{3}{2}mv_0\).`, String.raw`\(|\Delta p| = \tfrac{1}{2}mv_0\).`),
      pt('physc-mr-rebound-a5', 'calculation', String.raw`Correctly evaluates the integral, \(\int_0^{t_c}F_{\max}\left[1 - \left(\tfrac{2t}{t_c} - 1\right)^2\right]dt = \tfrac{2}{3}F_{\max}t_c\).`, ['integrates the square incorrectly', 'evaluates only the first term'], String.raw`Substituting \(u = \tfrac{2t}{t_c} - 1\): \(F_{\max}\tfrac{t_c}{2}\int_{-1}^{1}(1 - u^2)\,du = F_{\max}\tfrac{t_c}{2}\cdot\tfrac{4}{3} = \tfrac{2}{3}F_{\max}t_c\).`, String.raw`\(\tfrac{1}{3}F_{\max}t_c\).`),
      pt('physc-mr-rebound-a6', 'derivation', String.raw`Arrives at \(F_{\max} = \dfrac{9mv_0}{4t_c}\) (or an answer consistent with earlier work).`, ['inverts the fraction'], String.raw`\(\tfrac{2}{3}F_{\max}t_c = \tfrac{3}{2}mv_0 \Rightarrow F_{\max} = \dfrac{9mv_0}{4t_c}\).`, String.raw`\(F_{\max} = \dfrac{mv_0}{t_c}\).`),
    ]),
    part('B (i)', String.raw`Derive an expression for the work done by the wall on the ball during the collision in terms of \(m\), \(v_0\), and physical constants, as appropriate.`, [
      pt('physc-mr-rebound-b1', 'derivation', String.raw`Uses the work-energy theorem, \(W = \Delta K\).`, ['computes work as force times the contact time'], String.raw`\(W = K_f - K_i\).`, String.raw`\(W = F_{\max}t_c\).`),
      pt('physc-mr-rebound-b2', 'derivation', String.raw`Writes \(K_i = \tfrac{1}{2}mv_0^2\) and \(K_f = \tfrac{1}{2}m\left(\tfrac{v_0}{2}\right)^2\).`, ['uses v0/2 without squaring'], String.raw`\(W = \tfrac{1}{2}m\tfrac{v_0^2}{4} - \tfrac{1}{2}mv_0^2\).`, String.raw`\(W = \tfrac{1}{2}m\tfrac{v_0}{2}\).`),
      pt('physc-mr-rebound-b3', 'calculation', String.raw`Arrives at \(W = -\tfrac{3}{8}mv_0^2\), including the negative sign.`, ['drops the negative sign', 'reports −3/4 mv0²'], String.raw`\(W = -\tfrac{3}{8}mv_0^2\).`, String.raw`\(W = \tfrac{3}{8}mv_0^2\).`),
    ]),
    part('B (ii)', 'Indicate whether the collision is elastic or inelastic. Briefly justify your answer.', [
      pt('physc-mr-rebound-b4', 'justification', 'Indicates inelastic, justified by the loss of kinetic energy (the negative work in part B (i)) or the rebound speed being less than the incoming speed.', ['calls it elastic because the ball bounces back'], 'Inelastic, because the ball leaves with less kinetic energy than it arrived with.', 'Elastic, because it rebounds.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) A symmetric downward parabola from 0 at \(t = 0\) to \(F_{\max}\) at \(t_c/2\) and back to 0 at \(t_c\). (ii) \(\int_0^{t_c}F\,dt = \Delta p\). The momentum changes from \(mv_0\) to the right to \(\tfrac{1}{2}mv_0\) to the left, so \(|\Delta p| = \tfrac{3}{2}mv_0\). With \(u = \tfrac{2t}{t_c} - 1\), \(\int_0^{t_c}F\,dt = F_{\max}\tfrac{t_c}{2}\int_{-1}^{1}(1 - u^2)\,du = \tfrac{2}{3}F_{\max}t_c\). So \(F_{\max} = \dfrac{9mv_0}{4t_c}\). B (i) \(W = \Delta K = \tfrac{1}{2}m\left(\tfrac{v_0}{2}\right)^2 - \tfrac{1}{2}mv_0^2 = -\tfrac{3}{8}mv_0^2\). (ii) Inelastic: the ball loses kinetic energy.`,
});

// ── 2. Translation Between Representations (modeled on 2025 Q2: oscillation with a piecewise force) ──
frqs.push({
  id: 'physc-tbr-two-springs', questionNumber: 2, title: 'Oscillator with a Stiff Bumper', topic: 'Translation Between Representations · Piecewise simple harmonic motion',
  modeledOn: modeled(2025, 2, 'Translation Between Representations'), timeAllottedMin: 30,
  prompt: String.raw`A block of mass \(m\) on a horizontal frictionless surface is attached to a spring of spring constant \(k\) whose other end is fixed to a wall. The block's position is \(x\), with \(x = 0\) where the spring is relaxed. A second, massless spring of spring constant \(3k\) is fixed to the left wall so that its free end is exactly at \(x = 0\); the block pushes on it only when \(x < 0\) and does not stick to it. The block is released from rest at \(x = +A\).`,
  figures: [fig('Figure 1', draw(420, 156, 'A block on a frictionless surface is attached to a spring of constant k from the left wall. A shorter bumper spring of constant 3k, also fixed to the left wall, has its free end at x = 0, just touching the block when the main spring is relaxed', [
    ['hatch', 20, 125, 20, 20], ['line', 20, 125, 400, 125, { width: 2 }], spring(20, 220, 55, 10), text(120, 40, 'k', { italic: true }), spring(20, 180, 100, 6), text(100, 88, '3k', { italic: true }),
    ['line', 180, 92, 180, 108, { width: 2.4 }], ['rect', 220, 40, 50, 84, { fill: true }], text(245, 87, 'm', { italic: true }), ['line', 180, 125, 180, 136, { dash: true }], text(180, 150, 'x = 0', { size: 10 }), ['line', 330, 125, 330, 136, { dash: true }], text(330, 150, 'x = +A', { size: 10 }),
  ]))],
  parts: [
    part('A', String.raw`On axes of the \(x\)-component of the net force on the block versus \(x\), sketch \(F_x\) for \(-\tfrac{A}{2} \le x \le A\).`, [
      pt('physc-tbr-two-springs-a1', 'representation', String.raw`For \(x > 0\), draws a straight line through the origin with negative slope (magnitude \(k\)), reaching \(-kA\) at \(x = A\).`, ['draws a positive force for x > 0', 'draws a curve'], 'A straight line from the origin down to −kA at x = A.', 'A straight line rising to +kA at x = A.'),
      pt('physc-tbr-two-springs-a2', 'representation', String.raw`For \(x < 0\), draws a straight line through the origin with a negative slope four times as steep (magnitude \(4k\)), continuous at \(x = 0\).`, ['uses a slope of 3k', 'draws a jump at x = 0'], 'A steeper straight line rising to +2kA at x = −A/2.', 'The same slope on both sides.'),
    ]),
    part('B', String.raw`Derive an expression for the position of the block when it first momentarily comes to rest on the left side of \(x = 0\), in terms of \(A\). Begin with a fundamental physics principle.`, [
      pt('physc-tbr-two-springs-b1', 'derivation', 'Begins with conservation of mechanical energy for the block-spring system.', ['uses kinematics with constant acceleration'], String.raw`\(E_i = E_f\).`, String.raw`\(v^2 = v_0^2 + 2a\Delta x\).`),
      pt('physc-tbr-two-springs-b2', 'derivation', String.raw`Writes the initial energy as \(\tfrac{1}{2}kA^2\).`, ['includes the 3k spring in the initial energy'], String.raw`\(E_i = \tfrac{1}{2}kA^2\).`, String.raw`\(E_i = \tfrac{1}{2}(4k)A^2\).`),
      pt('physc-tbr-two-springs-b3', 'derivation', String.raw`Writes the final energy as the sum of both springs' energies, \(\tfrac{1}{2}kx^2 + \tfrac{1}{2}(3k)x^2 = 2kx^2\).`, ['includes only the 3k spring', 'includes only the k spring'], String.raw`\(\tfrac{1}{2}kx^2 + \tfrac{3}{2}kx^2\).`, String.raw`\(\tfrac{3}{2}kx^2\).`),
      pt('physc-tbr-two-springs-b4', 'derivation', String.raw`Arrives at \(x = -\tfrac{A}{2}\) (a distance \(\tfrac{A}{2}\) left of \(x = 0\)).`, ['reports −A', 'reports −A/√3'], String.raw`\(\tfrac{1}{2}kA^2 = 2kx^2 \Rightarrow x = -\tfrac{A}{2}\).`, String.raw`\(x = -\tfrac{A}{\sqrt{3}}\).`),
    ]),
    part('C', String.raw`On axes of \(x\) versus \(t\), sketch the block's position for one full cycle starting at \(t = 0\), when the block is released.`, [
      pt('physc-tbr-two-springs-c1', 'representation', String.raw`Starts at \(x = +A\) with zero slope and draws smooth sinusoidal segments.`, ['starts at x = 0', 'draws straight-line segments'], 'Starts at the top with a horizontal tangent.', 'Starts at the origin.'),
      pt('physc-tbr-two-springs-c2', 'representation', String.raw`Shows the minimum position as \(-\tfrac{A}{2}\), smaller in magnitude than the maximum.`, ['draws a symmetric oscillation between +A and −A'], 'The dips reach only −A/2.', 'The graph is symmetric about the t-axis.'),
      pt('physc-tbr-two-springs-c3', 'representation', String.raw`Shows the block spending less time on the negative side than on the positive side of each cycle (half as long).`, ['draws equal times on both sides'], 'The negative lobe is narrower than the positive lobe.', 'Both lobes are equally wide.'),
    ]),
    part('D', String.raw`Derive an expression for the period of the motion in terms of \(m\), \(k\), and physical constants, as appropriate.`, [
      pt('physc-tbr-two-springs-d1', 'derivation', String.raw`Identifies the time for \(x > 0\) as half a period of an oscillator with spring constant \(k\): \(\pi\sqrt{m/k}\).`, ['uses the full period for one side'], String.raw`\(t_+ = \tfrac{1}{2}\cdot 2\pi\sqrt{\tfrac{m}{k}} = \pi\sqrt{\tfrac{m}{k}}\).`, String.raw`\(t_+ = 2\pi\sqrt{\tfrac{m}{k}}\).`),
      pt('physc-tbr-two-springs-d2', 'derivation', String.raw`Identifies the time for \(x < 0\) as half a period with effective spring constant \(4k\): \(\tfrac{\pi}{2}\sqrt{m/k}\).`, ['uses 3k as the effective spring constant'], String.raw`\(t_- = \pi\sqrt{\tfrac{m}{4k}} = \tfrac{\pi}{2}\sqrt{\tfrac{m}{k}}\).`, String.raw`\(t_- = \pi\sqrt{\tfrac{m}{3k}}\).`),
      pt('physc-tbr-two-springs-d3', 'derivation', String.raw`Adds the two times to get \(T = \tfrac{3\pi}{2}\sqrt{\tfrac{m}{k}}\).`, ['averages the two periods'], String.raw`\(T = \tfrac{3\pi}{2}\sqrt{\tfrac{m}{k}}\).`, String.raw`\(T = 2\pi\sqrt{\tfrac{m}{2.5k}}\).`),
    ]),
  ],
  sampleResponse: String.raw`A For \(x > 0\), \(F_x = -kx\): a line from the origin to \(-kA\) at \(x = A\). For \(x < 0\), \(F_x = -4kx\): a line four times as steep, reaching \(+2kA\) at \(x = -A/2\). B \(\tfrac{1}{2}kA^2 = \tfrac{1}{2}kx^2 + \tfrac{1}{2}(3k)x^2 = 2kx^2\), so \(x = -\tfrac{A}{2}\). C A cosine-like curve from \(+A\), down through 0 into a narrower dip to \(-A/2\), and back to \(+A\). D The positive side takes half a period with \(k\): \(\pi\sqrt{m/k}\). The negative side takes half a period with \(4k\): \(\tfrac{\pi}{2}\sqrt{m/k}\). So \(T = \tfrac{3\pi}{2}\sqrt{\tfrac{m}{k}}\).`,
});

// ── 3. Experimental Design and Analysis (modeled on 2025 Q3: rotational inertia from linearized data) ──
const flyRows = [['0.050', '1.95'], ['0.100', '3.30'], ['0.150', '4.15'], ['0.200', '4.90'], ['0.250', '5.50']];
frqs.push({
  id: 'physc-lab-flywheel', questionNumber: 3, title: 'Rotational Inertia of a Flywheel', topic: 'Experimental Design and Analysis · Rotational dynamics and linearization',
  modeledOn: modeled(2025, 3, 'Experimental Design and Analysis'), timeAllottedMin: 25,
  prompt: String.raw`A flywheel is mounted on a frictionless horizontal axle. A light string is wrapped around the axle, which has radius \(r = 0.050\text{ m}\), passes over a light frictionless pulley, and is attached to a hanging object of mass \(m\), as shown in Figure 1. Students want to determine the rotational inertia \(I\) of the flywheel and axle. They have a set of hanging masses, a meterstick, a stopwatch, and a motion sensor.`,
  figures: [fig('Figure 1', draw(360, 200, 'A large flywheel on an axle of radius r. A string wraps around the axle, runs horizontally over a pulley at the table edge, and holds a hanging mass m', [
    ['circle', 90, 80, 60, { fill: true }], ['circle', 90, 80, 12], ['circle', 90, 80, 3, { fill: 'currentColor' }], ['line', 90, 68, 290, 68], ['circle', 290, 80, 12], ['line', 302, 80, 302, 150], ['rect', 287, 150, 30, 26, { fill: true }], text(302, 168, 'm', { italic: true }),
    ['line', 90, 80, 102, 80, { width: 1 }], text(100, 100, 'r', { italic: true }), text(90, 160, 'flywheel', { size: 11 }), text(255, 60, 'pulley', { size: 11 }),
  ]))],
  parts: [
    part('A', String.raw`Describe an experimental procedure for collecting data that could be graphed to determine \(I\). Include enough detail that another student could replicate it, and a method to reduce experimental uncertainty.`, [
      pt('physc-lab-flywheel-a1', 'experimental-design', 'Describes measuring the acceleration of the hanging object (with the motion sensor, or by timing a fall from rest over a measured distance, a = 2h/t²) for several different hanging masses.', ['varies the radius instead of the mass', 'measures only one mass'], 'For five masses, release from rest and use the motion sensor to find the acceleration from the slope of the v–t graph.', 'Drop the mass and time it.'),
      pt('physc-lab-flywheel-a2', 'experimental-design', 'Describes a valid way to reduce uncertainty, such as repeating trials for each mass and averaging, or using a large fall distance.', ['vague statement such as “measure carefully”'], 'Repeat each mass three times and average the accelerations.', 'Be careful when timing.'),
    ]),
    part('B', String.raw`Starting with Newton's second law for the hanging object and for the flywheel, show that \(\dfrac{1}{a} = \dfrac{1}{g} + \dfrac{I}{gr^2}\cdot\dfrac{1}{m}\), where \(a\) is the magnitude of the hanging object's acceleration.`, [
      pt('physc-lab-flywheel-b1', 'derivation', String.raw`Writes \(mg - F_T = ma\) for the hanging object and \(F_Tr = I\alpha\) with \(\alpha = a/r\) for the flywheel.`, ['sets the tension equal to mg', 'omits the rolling constraint a = αr'], String.raw`\(mg - F_T = ma\) and \(F_Tr = I\dfrac{a}{r}\).`, String.raw`\(F_T = mg\).`),
      pt('physc-lab-flywheel-b2', 'derivation', String.raw`Combines them to \(mg = a\left(m + \dfrac{I}{r^2}\right)\) and divides by \(mga\) to reach the given expression.`, ['algebra error dividing through'], String.raw`\(mg = a\left(m + \tfrac{I}{r^2}\right) \Rightarrow \dfrac{1}{a} = \dfrac{1}{g} + \dfrac{I}{gr^2}\cdot\dfrac{1}{m}\).`, 'States the expression without combining the equations.'),
    ]),
    part('C', String.raw`The students' data are shown in Table 1. (i) Indicate quantities to graph on the vertical and horizontal axes to produce a linear graph. (ii) Plot the data, including any calculated values, on a graph with labeled axes, units, and a linear scale. (iii) Draw a best-fit line.`, [
      pt('physc-lab-flywheel-c1', 'data-analysis', String.raw`Indicates \(1/a\) versus \(1/m\) (or an equivalent linearization such as \(m/a\) versus \(m\)).`, ['graphs a versus m'], String.raw`Vertical: \(1/a\) (s²/m); horizontal: \(1/m\) (kg⁻¹).`, 'Vertical: a; horizontal: m.'),
      pt('physc-lab-flywheel-c2', 'data-analysis', 'Labels both axes with quantities and correct units, using linear scales.', ['omits units', 'uneven scale'], 'Axes labeled “1/a (s²/m)” and “1/m (kg⁻¹)”.', 'Axes labeled “x” and “y”.'),
      pt('physc-lab-flywheel-c3', 'data-analysis', String.raw`Plots the calculated points correctly (about (20, 0.513), (10, 0.303), (6.67, 0.241), (5.0, 0.204), (4.0, 0.182)).`, ['plots uncalculated raw data', 'misplots two or more points'], 'Five correctly calculated and plotted points.', 'Plots a versus m.'),
      pt('physc-lab-flywheel-c4', 'data-analysis', 'Draws a straight best-fit line consistent with the trend of the data.', ['connects dot to dot'], 'One straight line near all points.', 'A curve through every point.'),
    ], [tableFigure('Table 1', ['Hanging mass m (kg)', 'Acceleration a (m/s²)'], flyRows)]),
    part('D', String.raw`Using your best-fit line, calculate an experimental value for \(I\).`, [
      pt('physc-lab-flywheel-d1', 'data-analysis', String.raw`Uses the slope of the best-fit line and relates it to \(I\): slope \(= \dfrac{I}{gr^2}\).`, ['uses the intercept to find I', 'uses a single data point'], String.raw`\(I = (\text{slope})\,g\,r^2\).`, 'I = m r² from one row of the table.'),
      pt('physc-lab-flywheel-d2', 'calculation', String.raw`Reports \(I\) between about \(4.5\times10^{-4}\) and \(5.5\times10^{-4}\text{ kg}\cdot\text{m}^2\).`, ['forgets to square r', 'omits g'], String.raw`Slope \(\approx \dfrac{0.513 - 0.182}{20 - 4} \approx 0.0207\text{ kg}\cdot\text{s}^2\text{/m}\), so \(I \approx 0.0207(9.8)(0.050)^2 \approx 5.1\times10^{-4}\text{ kg}\cdot\text{m}^2\).`, String.raw`\(I \approx 0.010\text{ kg}\cdot\text{m}^2\).`),
    ]),
  ],
  sampleResponse: String.raw`A Hang a mass, measure it with a balance, release it from rest, and use the motion sensor to record its velocity; the slope of the velocity-time graph is \(a\). Repeat three times for each of five masses and average. B For the hanging object, \(mg - F_T = ma\). For the flywheel, \(F_Tr = I\alpha = Ia/r\), so \(F_T = Ia/r^2\). Then \(mg = a(m + I/r^2)\), and dividing by \(mga\) gives \(\dfrac{1}{a} = \dfrac{1}{g} + \dfrac{I}{gr^2}\cdot\dfrac{1}{m}\). C Graph \(1/a\) versus \(1/m\): points (20, 0.513), (10, 0.303), (6.67, 0.241), (5.0, 0.204), (4.0, 0.182) with a straight best-fit line. D Slope \(\approx 0.0207\), so \(I = (\text{slope})gr^2 \approx 0.0207 \times 9.8 \times 0.0025 \approx 5.1\times10^{-4}\text{ kg}\cdot\text{m}^2\).`,
});

// ── 4. Qualitative/Quantitative Translation (modeled on 2025 Q4: rolling without slipping) ──
frqs.push({
  id: 'physc-qqt-rolling', questionNumber: 4, title: 'Hoop and Cylinder Race', topic: 'Qualitative/Quantitative Translation · Rolling without slipping',
  modeledOn: modeled(2025, 4, 'Qualitative/Quantitative Translation'), timeAllottedMin: 20,
  prompt: String.raw`A thin hoop and a uniform solid cylinder have the same mass \(M\) and radius \(R\). The rotational inertia of the hoop about its center is \(MR^2\), and that of the cylinder is \(\tfrac{1}{2}MR^2\). Both are released from rest at the same time from the top of an incline that makes an angle \(\theta\) with the horizontal, and both roll without slipping.`,
  figures: [fig('Figure 1', draw(360, 170, 'A hoop and a solid cylinder side by side at the top of an incline of angle theta', [
    ['poly', [[20, 150], [340, 150], [20, 30]], { fill: true }], ['circle', 70, 23, 16, { width: 2.4 }], ['circle', 110, 38, 16, { fill: 'currentColor' }], text(285, 142, 'θ', { italic: true }), text(70, 6, 'hoop', { size: 11 }), text(150, 30, 'cylinder', { size: 11, anchor: 'start' }),
  ]))],
  parts: [
    part('A', 'Indicate which object reaches the bottom of the incline first, or whether they arrive at the same time. Justify your answer using qualitative reasoning beyond referencing equations.', [
      pt('physc-qqt-rolling-a1', 'justification', 'Indicates that the solid cylinder reaches the bottom first.', ['indicates the same time because the masses are equal'], 'The cylinder.', 'They tie.'),
      pt('physc-qqt-rolling-a2', 'justification', 'States that both objects convert the same amount of gravitational potential energy into kinetic energy (or experience the same gravitational force along the incline).', ['claims the hoop has more potential energy'], 'Both lose the same gravitational potential energy over the same height.', 'The hoop is heavier.'),
      pt('physc-qqt-rolling-a3', 'justification', 'Explains that the hoop has more mass far from its axis (greater rotational inertia), so a larger share of its kinetic energy goes into rotation, leaving less translational speed at each point.', ['says the hoop has more friction', 'mentions rotational inertia without linking it to speed'], 'More of the hoop’s energy goes into spinning, so it moves down the incline more slowly.', 'The hoop has a larger rotational inertia.'),
    ]),
    part('B', String.raw`Starting with Newton's second law in translational and rotational form, derive an expression for the acceleration of the center of an object of mass \(M\), radius \(R\), and rotational inertia \(\beta MR^2\) rolling without slipping down the incline. Express your answer in terms of \(\beta\), \(\theta\), and physical constants, as appropriate.`, [
      pt('physc-qqt-rolling-b1', 'derivation', String.raw`Writes \(Mg\sin\theta - f = Ma\) and \(fR = I\alpha\).`, ['omits static friction', 'uses kinetic friction μN'], String.raw`\(Mg\sin\theta - f = Ma\), \(fR = \beta MR^2\alpha\).`, String.raw`\(Mg\sin\theta = Ma\).`),
      pt('physc-qqt-rolling-b2', 'derivation', String.raw`Uses the rolling condition \(a = \alpha R\) to get \(f = \beta Ma\).`, ['omits the rolling condition'], String.raw`\(f = \beta Ma\).`, String.raw`\(f = \beta MR\).`),
      pt('physc-qqt-rolling-b3', 'derivation', String.raw`Arrives at \(a = \dfrac{g\sin\theta}{1 + \beta}\).`, ['reports g sinθ(1 − β)'], String.raw`\(a = \dfrac{g\sin\theta}{1 + \beta}\).`, String.raw`\(a = g\sin\theta\).`),
    ]),
    part('C', 'Indicate whether your expression from part B is or is not consistent with your answer in part A. Justify by referencing the expression.', [
      pt('physc-qqt-rolling-c1', 'justification', String.raw`Uses functional dependence language: the acceleration decreases as \(\beta\) increases.`, ['restates part A without referencing the expression'], String.raw`\(a\) is inversely related to \(1 + \beta\).`, 'They agree.'),
      pt('physc-qqt-rolling-c2', 'justification', String.raw`Applies \(\beta = 1\) for the hoop and \(\beta = \tfrac{1}{2}\) for the cylinder to conclude the cylinder accelerates faster, consistent with part A.`, ['swaps the β values'], String.raw`Hoop: \(a = \tfrac{1}{2}g\sin\theta\); cylinder: \(a = \tfrac{2}{3}g\sin\theta\); the cylinder wins, consistent with part A.`, 'The hoop accelerates faster.'),
    ]),
  ],
  sampleResponse: String.raw`A The cylinder arrives first. Both lose the same gravitational potential energy as they descend. The hoop's mass is all at the rim, so it has the larger rotational inertia and more of its kinetic energy goes into rotation, leaving it with a smaller translational speed at every point. B \(Mg\sin\theta - f = Ma\) and \(fR = \beta MR^2\alpha\) with \(\alpha = a/R\), so \(f = \beta Ma\) and \(a = \dfrac{g\sin\theta}{1 + \beta}\). C Consistent: a larger \(\beta\) gives a smaller acceleration. The hoop (\(\beta = 1\)) has \(a = \tfrac{1}{2}g\sin\theta\) and the cylinder (\(\beta = \tfrac{1}{2}\)) has \(a = \tfrac{2}{3}g\sin\theta\).`,
});

// ── 5. Mathematical Routines (modeled on 2026 Q1: velocity-dependent resistive force) ──
frqs.push({
  id: 'physc-mr-drag-boat', questionNumber: 1, title: 'Coasting Boat with Water Drag', topic: 'Mathematical Routines · Resistive force proportional to velocity',
  modeledOn: modeled(2026, 1, 'Mathematical Routines'), timeAllottedMin: 25,
  prompt: String.raw`A boat of mass \(M\) is moving in a straight line with speed \(v_0\) at time \(t = 0\), when its engine is shut off. The only horizontal force on the boat afterward is a resistive force from the water, \(\vec{F} = -b\vec{v}\), where \(b\) is a positive constant.`,
  figures: [fig('Figure 1', draw(360, 100, 'A boat of mass M moves to the right with speed v0 on water; the drag force on it points left', [
    ['path', 'M60 50 L240 50 L215 80 L85 80 Z', { fill: true }], ['rect', 120, 28, 50, 22, { fill: true }], ['path', 'M10 82 Q30 76 50 82 T90 82 T130 82 T170 82 T210 82 T250 82 T290 82 T330 82 T350 82', { color: BLUE }], ['arrow', 250, 50, 310, 50], text(285, 42, 'v₀', { italic: true }), ['arrow', 60, 65, 18, 65, { color: PINK }], text(30, 58, 'F', { italic: true }),
  ]))],
  parts: [
    part('A (i)', String.raw`On axes of speed versus time, sketch the speed of the boat for \(t \ge 0\).`, [
      pt('physc-mr-drag-boat-a1', 'representation', String.raw`Sketches a curve starting at \(v_0\) that decreases and is concave up.`, ['draws a straight line', 'draws it concave down'], 'A decaying curve starting at v0, steep at first then flattening.', 'A straight line from v0 to zero.'),
      pt('physc-mr-drag-boat-a2', 'representation', 'Sketches the curve approaching zero asymptotically, never crossing or touching the time axis.', ['shows the speed reaching zero at a finite time'], 'The curve levels toward the axis without reaching it.', 'The curve hits zero.'),
    ]),
    part('A (ii)', String.raw`Derive an expression for the speed \(v(t)\) of the boat as a function of time in terms of \(M\), \(b\), \(v_0\), \(t\), and physical constants, as appropriate.`, [
      pt('physc-mr-drag-boat-a3', 'derivation', String.raw`Writes Newton's second law as a differential equation, \(M\dfrac{dv}{dt} = -bv\).`, ['uses a constant acceleration', 'drops the negative sign'], String.raw`\(M\dfrac{dv}{dt} = -bv\).`, String.raw`\(Ma = -bv_0\).`),
      pt('physc-mr-drag-boat-a4', 'derivation', String.raw`Separates variables, \(\dfrac{dv}{v} = -\dfrac{b}{M}dt\).`, ['separates incorrectly, leaving v on both sides'], String.raw`\(\dfrac{dv}{v} = -\dfrac{b}{M}dt\).`, String.raw`\(dv = -\dfrac{b}{M}v\,dt\) integrated as if v were constant.`),
      pt('physc-mr-drag-boat-a5', 'derivation', String.raw`Integrates with correct limits, \(\int_{v_0}^{v}\dfrac{dv'}{v'} = -\dfrac{b}{M}\int_0^t dt'\), giving \(\ln\dfrac{v}{v_0} = -\dfrac{bt}{M}\).`, ['omits the limits or constant of integration'], String.raw`\(\ln\dfrac{v}{v_0} = -\dfrac{bt}{M}\).`, String.raw`\(\ln v = -\dfrac{bt}{M}\).`),
      pt('physc-mr-drag-boat-a6', 'derivation', String.raw`Arrives at \(v(t) = v_0e^{-bt/M}\).`, ['writes e^(−Mt/b)'], String.raw`\(v = v_0e^{-bt/M}\).`, String.raw`\(v = v_0e^{-Mt/b}\).`),
    ]),
    part('B', String.raw`Derive an expression for the total distance the boat travels after the engine is shut off, in terms of \(M\), \(b\), \(v_0\), and physical constants, as appropriate.`, [
      pt('physc-mr-drag-boat-b1', 'derivation', String.raw`Integrates the velocity from \(t = 0\) to \(t \to \infty\), \(x = \int_0^\infty v_0e^{-bt/M}\,dt\) (or uses \(M\,v\,\dfrac{dv}{dx} = -bv\)).`, ['multiplies v0 by a stopping time'], String.raw`\(x = \int_0^\infty v_0e^{-bt/M}\,dt\).`, String.raw`\(x = v_0t\).`),
      pt('physc-mr-drag-boat-b2', 'calculation', String.raw`Arrives at \(x = \dfrac{Mv_0}{b}\).`, ['reports an infinite distance'], String.raw`\(x = \dfrac{Mv_0}{b}\).`, 'The boat travels forever.'),
    ]),
    part('C', String.raw`A second boat of mass \(2M\) with the same \(b\) and the same initial speed \(v_0\) shuts off its engine. Indicate whether the second boat's total coasting distance is greater than, less than, or equal to twice the first boat's distance. Justify your answer.`, [
      pt('physc-mr-drag-boat-c1', 'justification', 'Indicates that it is equal to twice the first boat’s distance.', ['indicates greater than twice', 'indicates the same distance'], 'Equal to twice.', 'Four times as far.'),
      pt('physc-mr-drag-boat-c2', 'justification', String.raw`Justifies with the linear dependence \(x \propto M\) from part B, or by reasoning that the same force at each speed produces half the deceleration of the heavier boat.`, ['claims that more mass means more drag'], String.raw`Since \(x = Mv_0/b\), doubling \(M\) doubles \(x\).`, 'Heavier boats go farther.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) A concave-up curve decreasing from \(v_0\) and approaching zero asymptotically. (ii) \(M\dfrac{dv}{dt} = -bv\), so \(\dfrac{dv}{v} = -\dfrac{b}{M}dt\). Integrating from \(v_0\) at \(t = 0\): \(\ln\dfrac{v}{v_0} = -\dfrac{bt}{M}\), so \(v = v_0e^{-bt/M}\). B \(x = \int_0^\infty v_0e^{-bt/M}dt = \dfrac{Mv_0}{b}\). C Equal to twice: \(x \propto M\), so doubling the mass doubles the coasting distance.`,
});

// ── 6. Translation Between Representations (modeled on 2026 Q2: momentum of a system that launches a projectile) ──
frqs.push({
  id: 'physc-tbr-launcher-cart', questionNumber: 2, title: 'Ball Launched from a Moving Cart', topic: 'Translation Between Representations · Momentum conservation and projectile motion',
  modeledOn: modeled(2026, 2, 'Translation Between Representations'), timeAllottedMin: 30,
  prompt: String.raw`A cart of mass \(3M\) carries a spring launcher loaded with a ball of mass \(M\). The cart and ball move together to the right with speed \(v_0\) on a level frictionless track. At \(t = 0\) the launcher fires the ball straight up relative to the cart with speed \(u\). Air resistance is negligible.`,
  figures: [fig('Figure 1', draw(380, 140, 'A cart of mass 3M with a vertical launcher tube holding a ball of mass M moves right with speed v0 on a level track', [
    ['line', 10, 118, 370, 118, { width: 2 }], ['rect', 110, 75, 120, 34, { fill: true }], text(170, 98, '3M', { italic: true }), ['circle', 135, 113, 6], ['circle', 205, 113, 6], ['rect', 160, 35, 20, 40, { fill: true }], ['circle', 170, 28, 8, { fill: 'currentColor' }], text(186, 24, 'M', { italic: true, anchor: 'start' }), ['arrow', 240, 92, 300, 92], text(270, 84, 'v₀', { italic: true }),
  ]))],
  parts: [
    part('A', String.raw`Before launch, the horizontal momentum of the cart-ball system is represented by an arrow 4 grid units long pointing to the right. Draw arrows on the same scale to represent the horizontal component of the momentum of the cart and of the ball immediately after the launch.`, [
      pt('physc-tbr-launcher-cart-a1', 'representation', 'Draws the cart’s horizontal momentum as a rightward arrow 3 units long.', ['shrinks the cart’s arrow because the ball was pushed', 'draws the cart arrow 4 units'], 'Cart: 3 units right.', 'Cart: 2 units right.'),
      pt('physc-tbr-launcher-cart-a2', 'representation', 'Draws the ball’s horizontal momentum as a rightward arrow 1 unit long.', ['draws zero horizontal momentum for the ball'], 'Ball: 1 unit right.', 'Ball: no horizontal arrow.'),
      pt('physc-tbr-launcher-cart-a3', 'representation', 'Draws arrows whose total is 4 units, showing the system’s horizontal momentum is unchanged because the launch force is vertical.', ['changes the total'], 'Total of 4 units right.', 'Total of 3 units right.'),
    ]),
    part('B', String.raw`Derive an expression for the horizontal distance the ball travels from launch until it returns to its launch height, in terms of \(u\), \(v_0\), and physical constants, as appropriate. Then indicate where the ball lands relative to the launcher.`, [
      pt('physc-tbr-launcher-cart-b1', 'derivation', String.raw`Finds the time of flight from vertical motion, \(t = \dfrac{2u}{g}\).`, ['uses u/g, the time to the top'], String.raw`\(0 = ut - \tfrac{1}{2}gt^2 \Rightarrow t = \dfrac{2u}{g}\).`, String.raw`\(t = \dfrac{u}{g}\).`),
      pt('physc-tbr-launcher-cart-b2', 'derivation', String.raw`Uses the ball's constant horizontal velocity \(v_0\) to get \(x = \dfrac{2uv_0}{g}\).`, ['uses a horizontal velocity other than v0'], String.raw`\(x = v_0t = \dfrac{2uv_0}{g}\).`, String.raw`\(x = \dfrac{2u^2}{g}\).`),
      pt('physc-tbr-launcher-cart-b3', 'justification', 'States that the ball lands back in the launcher because the cart keeps the same horizontal velocity v0 and so travels the same horizontal distance.', ['says the ball lands behind the cart'], 'The cart also moves at v0, so it travels the same distance and catches the ball.', 'The ball lands behind the cart because the cart moves forward.'),
    ]),
    part('C', String.raw`On separate axes, sketch (i) the vertical velocity component of the ball and (ii) the horizontal velocity component of the cart, each from just after launch until the ball returns to launch height at \(t_f\). Take up and right as positive.`, [
      pt('physc-tbr-launcher-cart-c1', 'representation', String.raw`Sketches the ball's vertical velocity as a straight line starting at \(+u\) with slope \(-g\).`, ['draws a curve', 'starts at zero'], 'A straight line falling from +u.', 'A parabola.'),
      pt('physc-tbr-launcher-cart-c2', 'representation', String.raw`Shows the vertical velocity crossing zero at \(t_f/2\) and ending at \(-u\) at \(t_f\).`, ['ends at zero'], 'Crosses zero halfway and ends at −u.', 'Ends at zero at t_f.'),
      pt('physc-tbr-launcher-cart-c3', 'representation', String.raw`Sketches the cart's horizontal velocity as a horizontal line at \(v_0\).`, ['shows the cart speeding up or slowing down'], 'A flat line at v0.', 'A line that rises after launch.'),
    ]),
    part('D', String.raw`The experiment is repeated, but this time the launcher is turned so that it fires the ball horizontally backward (to the left) with speed \(u\) relative to the cart after the launch. Derive an expression for the cart's speed after launch in terms of \(v_0\) and \(u\), and indicate whether the cart speeds up or slows down.`, [
      pt('physc-tbr-launcher-cart-d1', 'derivation', String.raw`Writes horizontal momentum conservation using the ball's velocity relative to the ground, \(4Mv_0 = 3Mv_c + M(v_c - u)\).`, ['uses −u as the ball’s ground velocity', 'uses the velocity relative to the cart before launch'], String.raw`\(4Mv_0 = 3Mv_c + M(v_c - u)\).`, String.raw`\(4Mv_0 = 3Mv_c - Mu\).`),
      pt('physc-tbr-launcher-cart-d2', 'calculation', String.raw`Arrives at \(v_c = v_0 + \tfrac{u}{4}\).`, ['reports v0 + u/3'], String.raw`\(4Mv_c = 4Mv_0 + Mu \Rightarrow v_c = v_0 + \tfrac{u}{4}\).`, String.raw`\(v_c = v_0 + \tfrac{u}{3}\).`),
      pt('physc-tbr-launcher-cart-d3', 'justification', 'Indicates that the cart speeds up, consistent with the launcher pushing the cart forward as it pushes the ball backward.', ['says the cart slows down'], 'It speeds up: the ball pushes back on the launcher in the forward direction.', 'It slows down.'),
    ]),
  ],
  sampleResponse: String.raw`A Cart: 3 units to the right; ball: 1 unit to the right. The launch force is vertical, so the total stays 4 units. B Vertically, \(0 = ut - \tfrac{1}{2}gt^2\), so \(t = 2u/g\). Horizontally the ball keeps \(v_0\), so \(x = \dfrac{2uv_0}{g}\). The cart also moves at \(v_0\), so the ball lands back in the launcher. C (i) A straight line from \(+u\) with slope \(-g\), crossing zero at \(t_f/2\) and ending at \(-u\). (ii) A horizontal line at \(v_0\). D \(4Mv_0 = 3Mv_c + M(v_c - u)\), so \(v_c = v_0 + \tfrac{u}{4}\): the cart speeds up.`,
});

// ── 7. Experimental Design and Analysis (modeled on 2026 Q3: physical pendulum and the parallel-axis theorem) ──
const pendRows = [['0.05', '0.92'], ['0.10', '0.85'], ['0.15', '0.91'], ['0.20', '0.98'], ['0.25', '1.07']];
frqs.push({
  id: 'physc-lab-physical-pendulum', questionNumber: 3, title: 'Physical Pendulum and the Parallel-Axis Theorem', topic: 'Experimental Design and Analysis · Physical pendulum and linearization',
  modeledOn: modeled(2026, 3, 'Experimental Design and Analysis'), timeAllottedMin: 25,
  prompt: String.raw`A rigid bar of mass \(m = 0.50\text{ kg}\) has holes drilled along its length so it can hang from a frictionless pivot at several distances \(d\) from its center of mass. For small oscillations, the period of a physical pendulum is \(T = 2\pi\sqrt{\dfrac{I}{mgd}}\), where \(I\) is the rotational inertia about the pivot. Students want to determine the rotational inertia \(I_{cm}\) of the bar about its center of mass.`,
  figures: [fig('Figure 1', draw(240, 220, 'A vertical bar hangs from a pivot through one of a row of holes; the pivot is a distance d above the bar’s center of mass', [
    ['rect', 105, 20, 30, 190, { fill: true }], ...[40, 60, 80, 100, 120].map(y => ['circle', 120, y, 3]), ['circle', 120, 40, 5, { fill: 'currentColor' }], ['circle', 120, 115, 4, { color: PINK, fill: PINK }], text(150, 119, 'center of mass', { anchor: 'start', size: 11 }), ['line', 90, 40, 90, 115, { dash: true }], text(80, 82, 'd', { italic: true, anchor: 'end' }), text(150, 44, 'pivot', { anchor: 'start', size: 11 }),
  ]))],
  parts: [
    part('A', 'Describe a procedure the students could use to collect data that would allow them to determine I_cm, including a method to reduce experimental uncertainty.', [
      pt('physc-lab-physical-pendulum-a1', 'experimental-design', String.raw`Describes hanging the bar from several pivot holes, measuring each distance \(d\) with a meterstick, and measuring the period for small-angle oscillations.`, ['uses large amplitudes', 'varies the mass instead of d'], 'For five holes, measure d, displace the bar a few degrees, and time the oscillations.', 'Swing the bar from one hole and time it.'),
      pt('physc-lab-physical-pendulum-a2', 'experimental-design', 'Describes timing many oscillations and dividing, or repeating trials and averaging, to reduce uncertainty.', ['vague statement only'], 'Time 20 oscillations and divide by 20, three times per hole.', 'Use a good stopwatch.'),
    ]),
    part('B', String.raw`Using the parallel-axis theorem, \(I = I_{cm} + md^2\), show that \(T^2d = \dfrac{4\pi^2}{g}d^2 + \dfrac{4\pi^2I_{cm}}{mg}\), and describe how \(I_{cm}\) can be found from a graph of \(T^2d\) versus \(d^2\).`, [
      pt('physc-lab-physical-pendulum-b1', 'derivation', String.raw`Substitutes the parallel-axis theorem into the period, squares, and multiplies by \(d\) to reach the given expression.`, ['forgets to square the period'], String.raw`\(T^2 = \dfrac{4\pi^2(I_{cm} + md^2)}{mgd} \Rightarrow T^2d = \dfrac{4\pi^2}{g}d^2 + \dfrac{4\pi^2I_{cm}}{mg}\).`, 'States the expression without a derivation.'),
      pt('physc-lab-physical-pendulum-b2', 'data-analysis', String.raw`Identifies the vertical intercept as \(\dfrac{4\pi^2I_{cm}}{mg}\), so \(I_{cm} = \dfrac{(\text{intercept})mg}{4\pi^2}\).`, ['uses the slope to find I_cm'], String.raw`\(I_{cm} = \dfrac{b\,mg}{4\pi^2}\), where \(b\) is the intercept.`, 'I_cm is the slope.'),
    ]),
    part('C', String.raw`The students' data are shown in Table 1. (i) Calculate \(d^2\) and \(T^2d\) for each trial. (ii) Plot \(T^2d\) versus \(d^2\) with labeled axes, units, and linear scales. (iii) Draw a best-fit line.`, [
      pt('physc-lab-physical-pendulum-c1', 'calculation', String.raw`Correctly calculates the values (about \(d^2\): 0.0025, 0.010, 0.0225, 0.040, 0.0625 m²; \(T^2d\): 0.042, 0.072, 0.124, 0.192, 0.286 s²·m).`, ['computes T·d instead of T²d'], 'Calculated columns that match the data.', 'Uses T·d.'),
      pt('physc-lab-physical-pendulum-c2', 'data-analysis', 'Labels both axes with quantities and correct units and uses linear scales.', ['omits units'], 'Axes labeled “T²d (s²·m)” and “d² (m²)”.', 'Unlabeled axes.'),
      pt('physc-lab-physical-pendulum-c3', 'data-analysis', 'Plots the five calculated points correctly.', ['misplots two or more points'], 'Five correct points.', 'Plots T versus d.'),
      pt('physc-lab-physical-pendulum-c4', 'data-analysis', 'Draws a straight best-fit line that does not pass through the origin.', ['forces the line through the origin', 'connects dot to dot'], 'A straight line with a positive intercept near 0.03 s²·m.', 'A line through the origin.'),
    ], [tableFigure('Table 1', ['Pivot distance d (m)', 'Period T (s)'], pendRows)]),
    part('D', String.raw`Using your best-fit line, calculate an experimental value for \(I_{cm}\).`, [
      pt('physc-lab-physical-pendulum-d1', 'data-analysis', String.raw`Uses the vertical intercept of the best-fit line, consistent with part B.`, ['uses a single data point'], String.raw`Intercept \(\approx 0.032\text{ s}^2\cdot\text{m}\).`, String.raw`Uses \(T^2d\) of the first row as the intercept.`),
      pt('physc-lab-physical-pendulum-d2', 'calculation', String.raw`Reports \(I_{cm}\) between about \(0.0030\) and \(0.0050\text{ kg}\cdot\text{m}^2\).`, ['omits m or g'], String.raw`\(I_{cm} = \dfrac{(0.032)(0.50)(9.8)}{4\pi^2} \approx 0.0040\text{ kg}\cdot\text{m}^2\).`, String.raw`\(I_{cm} \approx 0.032\text{ kg}\cdot\text{m}^2\).`),
    ]),
  ],
  sampleResponse: String.raw`A Hang the bar from five different holes, measure each \(d\) from the pivot to the center of mass, displace it about 5°, and time 20 oscillations; divide by 20 and repeat three times per hole. B \(T^2 = \dfrac{4\pi^2(I_{cm} + md^2)}{mgd}\), so \(T^2d = \dfrac{4\pi^2}{g}d^2 + \dfrac{4\pi^2I_{cm}}{mg}\). The intercept is \(\dfrac{4\pi^2I_{cm}}{mg}\). C \(d^2\): 0.0025, 0.010, 0.0225, 0.040, 0.0625 m²; \(T^2d\): 0.042, 0.072, 0.124, 0.192, 0.286 s²·m; a straight best-fit line with slope near 4.0 and intercept near 0.032. D \(I_{cm} = \dfrac{0.032 \times 0.50 \times 9.8}{4\pi^2} \approx 0.0040\text{ kg}\cdot\text{m}^2\).`,
});

// ── 8. Qualitative/Quantitative Translation (modeled on 2026 Q4: angular momentum and rotational energy) ──
frqs.push({
  id: 'physc-qqt-spinning-stool', questionNumber: 4, title: 'Pulling In the Dumbbells', topic: 'Qualitative/Quantitative Translation · Conservation of angular momentum',
  modeledOn: modeled(2026, 4, 'Qualitative/Quantitative Translation'), timeAllottedMin: 20,
  prompt: String.raw`A student sits on a stool that rotates on a frictionless vertical axle, holding a dumbbell in each outstretched hand. The rotational inertia of the student-stool-dumbbell system about the axle is \(I_i\), and the system rotates with angular speed \(\omega_i\). The student then pulls the dumbbells in close to the body, so the rotational inertia becomes \(I_f\), where \(I_f < I_i\).`,
  figures: [fig('Figure 1 (overhead view)', draw(360, 160, 'Overhead view of a student on a rotating stool, first with arms outstretched holding dumbbells, then with the dumbbells pulled in', [
    ['circle', 90, 80, 18, { fill: true }], ['line', 20, 80, 160, 80, { width: 3 }], ['circle', 20, 80, 8, { fill: 'currentColor' }], ['circle', 160, 80, 8, { fill: 'currentColor' }], text(90, 140, 'Initial: Iᵢ, ωᵢ', { size: 11 }),
    ['circle', 270, 80, 18, { fill: true }], ['line', 238, 80, 302, 80, { width: 3 }], ['circle', 238, 80, 8, { fill: 'currentColor' }], ['circle', 302, 80, 8, { fill: 'currentColor' }], text(270, 140, 'Final: I_f, ω_f', { size: 11 }),
    ['path', 'M60 40 A40 40 0 0 1 120 40', { color: PINK }], ['path', 'M245 50 A30 30 0 0 1 295 50', { color: PINK }],
  ]))],
  parts: [
    part('A', 'Indicate whether the rotational kinetic energy of the system increases, decreases, or remains the same as the student pulls in the dumbbells. Justify your answer using qualitative reasoning beyond referencing equations.', [
      pt('physc-qqt-spinning-stool-a1', 'justification', 'Indicates that the rotational kinetic energy increases.', ['indicates it stays the same because angular momentum is conserved'], 'It increases.', 'It stays the same.'),
      pt('physc-qqt-spinning-stool-a2', 'justification', 'States that angular momentum is conserved because there is no net external torque about the axle, so the smaller rotational inertia requires a larger angular speed.', ['says angular momentum increases'], 'No external torque acts, so as the mass moves inward the system must spin faster to keep the same angular momentum.', 'The student spins faster.'),
      pt('physc-qqt-spinning-stool-a3', 'justification', 'Identifies the source of the added energy: the student does positive work pulling the dumbbells inward (converting internal chemical energy).', ['claims energy is conserved for the system'], 'The student’s arms do work pulling the dumbbells inward against their tendency to move outward.', 'Energy comes from the stool.'),
    ]),
    part('B', String.raw`Derive an expression for the ratio \(\dfrac{K_f}{K_i}\) of the final to initial rotational kinetic energy in terms of \(I_i\) and \(I_f\).`, [
      pt('physc-qqt-spinning-stool-b1', 'derivation', String.raw`Writes conservation of angular momentum, \(I_i\omega_i = I_f\omega_f\).`, ['equates the energies instead'], String.raw`\(I_i\omega_i = I_f\omega_f\).`, String.raw`\(\tfrac{1}{2}I_i\omega_i^2 = \tfrac{1}{2}I_f\omega_f^2\).`),
      pt('physc-qqt-spinning-stool-b2', 'derivation', String.raw`Uses \(K = \tfrac{1}{2}I\omega^2\) (or \(K = \dfrac{L^2}{2I}\)) for both states.`, ['uses linear kinetic energy'], String.raw`\(K = \dfrac{L^2}{2I}\).`, String.raw`\(K = \tfrac{1}{2}mv^2\).`),
      pt('physc-qqt-spinning-stool-b3', 'derivation', String.raw`Arrives at \(\dfrac{K_f}{K_i} = \dfrac{I_i}{I_f}\).`, ['inverts the ratio', 'squares the ratio'], String.raw`\(\dfrac{K_f}{K_i} = \dfrac{I_i}{I_f}\).`, String.raw`\(\dfrac{K_f}{K_i} = \left(\dfrac{I_i}{I_f}\right)^2\).`),
    ]),
    part('C', 'Indicate whether your expression from part B is or is not consistent with your answer to part A. Justify by referencing the expression.', [
      pt('physc-qqt-spinning-stool-c1', 'justification', String.raw`References the expression: since \(I_f < I_i\), the ratio \(I_i/I_f\) is greater than 1.`, ['restates part A without the expression'], String.raw`\(I_i/I_f > 1\) because \(I_f < I_i\).`, 'They agree.'),
      pt('physc-qqt-spinning-stool-c2', 'justification', 'Correctly concludes the kinetic energy increases, consistent with part A (or identifies an inconsistency with an incorrect part A).', ['claims consistency with a contradicting part A'], 'So K_f > K_i, which is consistent with part A.', 'So K decreases.'),
    ]),
  ],
  sampleResponse: String.raw`A It increases. No external torque acts about the axle, so the system's angular momentum is constant; pulling the dumbbells inward lowers the rotational inertia, so the system spins faster. The extra kinetic energy comes from the work the student's arms do pulling the dumbbells inward. B \(I_i\omega_i = I_f\omega_f = L\), and \(K = \dfrac{L^2}{2I}\), so \(\dfrac{K_f}{K_i} = \dfrac{I_i}{I_f}\). C Consistent: \(I_f < I_i\), so the ratio exceeds 1 and \(K_f > K_i\).`,
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'physc-mr-rebound',
  transcript: String.raw`A (i) The force starts at zero, rises to \(F_{\max}\) at \(t_c/2\) in a parabola, and falls back to zero at \(t_c\).

A (ii) \(\int_0^{t_c}F\,dt = \Delta p\). The change in momentum is \(mv_0 - \tfrac{1}{2}mv_0 = \tfrac{1}{2}mv_0\). The integral is \(\tfrac{2}{3}F_{\max}t_c\), so \(\tfrac{2}{3}F_{\max}t_c = \tfrac{1}{2}mv_0\) and \(F_{\max} = \dfrac{3mv_0}{4t_c}\).

B (i) \(W = \Delta K = \tfrac{1}{2}m\left(\tfrac{v_0}{2}\right)^2 - \tfrac{1}{2}mv_0^2 = -\tfrac{3}{8}mv_0^2\).

B (ii) Inelastic, because kinetic energy is lost.`,
  evidence: {
    'physc-mr-rebound-a1': String.raw`starts at zero ... falls back to zero at \(t_c\)`, 'physc-mr-rebound-a2': String.raw`rises to \(F_{\max}\) at \(t_c/2\) in a parabola`,
    'physc-mr-rebound-a3': String.raw`\(\int_0^{t_c}F\,dt = \Delta p\)`, 'physc-mr-rebound-a5': String.raw`\(\tfrac{2}{3}F_{\max}t_c\)`, 'physc-mr-rebound-a6': String.raw`\(F_{\max} = \dfrac{3mv_0}{4t_c}\), consistent with the momentum change used`,
    'physc-mr-rebound-b1': String.raw`\(W = \Delta K\)`, 'physc-mr-rebound-b2': String.raw`\(\tfrac{1}{2}m\left(\tfrac{v_0}{2}\right)^2 - \tfrac{1}{2}mv_0^2\)`, 'physc-mr-rebound-b3': String.raw`\(-\tfrac{3}{8}mv_0^2\)`,
    'physc-mr-rebound-b4': 'Inelastic, because kinetic energy is lost.',
  },
  missed: { 'physc-mr-rebound-a4': String.raw`The ball reverses direction, so the momentum change is \(mv_0 - \left(-\tfrac{1}{2}mv_0\right) = \tfrac{3}{2}mv_0\), not \(\tfrac{1}{2}mv_0\). Subtracting the speeds treats the rebound as if the ball kept moving toward the wall.` },
  priorityFix: String.raw`Treat momentum as a vector: the ball goes from \(+mv_0\) to \(-\tfrac{1}{2}mv_0\), so \(|\Delta p| = \tfrac{3}{2}mv_0\) and \(F_{\max} = \dfrac{9mv_0}{4t_c}\).`,
  sampleResponseComparison: 'Your integral, part A (i) sketch, and all of part B match the sample response. The difference is the sign of the rebound velocity in part A (ii), which makes the change in momentum three times larger in the sample.',
};

module.exports = { course: 'ap-physics-c-mechanics', frqs, canned };
