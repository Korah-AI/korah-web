// AP Physics 1 free-response practice: eight original questions, two of each released
// question type (Mathematical Routines, Translation Between Representations, Experimental
// Design and Analysis, Qualitative/Quantitative Translation), each modeled on a 2025 or 2026
// released question with the same point total and skills.
const { draw, spring } = require('../ap-mcq-build/diagram.cjs');
const { pt, part, tableFigure, text, fig, axes } = require('./frq-helpers.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const SG = year => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-physics-1.pdf`;
const modeled = (year, n, type) => ({ year, question: n, type, label: `${year} AP Physics 1 Question ${n} (${type})`, url: SG(year) });

// An energy bar chart with three columns; `bars` are heights in units of E0 (null = blank).
function barChart(title, labels, bars, maxE = 12) {
  const unit = 12, items = [['line', 50, 170, 50, 170 - maxE * unit - 8], ['line', 50, 170, 230, 170, { dash: true }], text(140, 18, title, { size: 12 })];
  for (let e = 2; e <= maxE; e += 2) items.push(['line', 50, 170 - e * unit, 230, 170 - e * unit, { dash: true, width: 0.6 }], text(44, 174 - e * unit, `${e}E₀`, { anchor: 'end', size: 10 }));
  labels.forEach((l, i) => {
    const x = 80 + i * 55;
    items.push(text(x, 188, l, { italic: true, size: 12 }));
    if (bars[i] != null) items.push(bars[i] === 0 ? ['line', x - 14, 170, x + 14, 170, { width: 4 }] : ['rect', x - 14, 170 - bars[i] * unit, 28, bars[i] * unit, { fill: true }]);
  });
  return draw(250, 200, `${title}: energy bar chart with columns ${labels.join(', ')}` + (bars.some(b => b != null) ? `, showing ${labels.map((l, i) => `${l} = ${bars[i]}E0`).join(', ')}` : ', all blank for the student to complete'), items);
}

const frqs = [];

// ── 1. Mathematical Routines (modeled on 2025 Q1: momentum in a perfectly inelastic collision) ──
frqs.push({
  id: 'phys1-mr-carts', questionNumber: 1, title: 'Carts That Stick Together', topic: 'Mathematical Routines · Momentum and energy in collisions',
  modeledOn: modeled(2025, 1, 'Mathematical Routines'), timeAllottedMin: 25,
  prompt: String.raw`Cart A of mass \(2m\) moves to the right along a level, frictionless track with speed \(v_0\). Cart B of mass \(m\) is at rest. At time \(t_1\) the carts collide and stick together, and at \(t_2\) the combined carts move to the right with constant speed \(v_f\).`,
  figures: [fig('Figure 1', draw(400, 120, 'Cart A of mass 2m moves right with speed v0 toward cart B of mass m, which is at rest on a level track', [
    ['line', 10, 95, 390, 95, { width: 2 }], ['rect', 60, 55, 90, 34, { fill: true }], text(105, 77, '2m', { italic: true }), ['circle', 80, 92, 6], ['circle', 130, 92, 6], ['arrow', 155, 62, 205, 62], text(180, 54, 'v₀', { italic: true }),
    ['rect', 260, 61, 64, 28, { fill: true }], text(292, 80, 'm', { italic: true }), ['circle', 276, 92, 6], ['circle', 308, 92, 6], text(105, 115, 'Cart A', { size: 11 }), text(292, 115, 'Cart B (at rest)', { size: 11 }),
  ]))],
  parts: [
    part('A (i)', String.raw`On axes like those in Figure 2, sketch the \(x\)-component of the total momentum \(p_x\) of the two-cart system as a function of time from \(t = 0\) until after \(t_2\).`, [
      pt('phys1-mr-carts-a1', 'representation', String.raw`Sketches \(p_x\) as constant before the collision \((t < t_1)\) or after it \((t > t_1)\).`, ['draws momentum increasing or decreasing linearly', 'draws a spike or dip at the collision'], 'Draws a horizontal line before t1.', 'Draws a line that drops at t1 because cart A slows down.'),
      pt('phys1-mr-carts-a2', 'representation', String.raw`Sketches a single continuous, nonzero horizontal line from \(t = 0\) through and beyond \(t_2\), showing that the system's momentum never changes.`, ['draws two different horizontal levels', 'draws a gap at the collision', 'draws the line at zero'], 'One unbroken horizontal line at a positive value across the whole graph.', 'A step down at t1 to a lower horizontal line.'),
    ], [fig('Figure 2', axes('Blank axes of momentum p_x versus time t with dashed vertical lines at t1 and t2', 'pₓ', [[150, 't₁'], [250, 't₂']]))]),
    part('A (ii)', String.raw`Derive an expression for \(v_f\) in terms of \(v_0\). Begin your derivation by writing a fundamental physics principle or an equation from the reference information.`, [
      pt('phys1-mr-carts-a3', 'derivation', String.raw`Writes conservation of momentum, \(p_i = p_f\) (or \(\Sigma p_i = \Sigma p_f\)), as the starting principle.`, ['starts with conservation of kinetic energy', 'starts with v = d/t'], String.raw`Writes \(p_i = p_f\) and then \(2m v_0 = (2m + m)v_f\).`, 'Begins with ½(2m)v0² = ½(3m)vf², treating the collision as elastic.'),
      pt('phys1-mr-carts-a4', 'derivation', String.raw`Sets \(2m v_0\) equal to the combined momentum \(3m\,v_f\) and solves \(v_f = \tfrac{2}{3}v_0\). A correct isolated final answer earns this point and the previous one.`, ['uses 2m for the final mass', 'loses the factor of 2 on the initial momentum, getting v0/3'], String.raw`\(2mv_0 = 3mv_f \Rightarrow v_f = \tfrac{2}{3}v_0\).`, String.raw`\(v_f = \tfrac{1}{3}v_0\).`),
    ]),
    part('A (iii)', String.raw`Derive an expression for the change in kinetic energy \(\Delta K\) of the two-cart system from \(t = 0\) to \(t_2\) in terms of \(m\), \(v_0\), and physical constants, as appropriate.`, [
      pt('phys1-mr-carts-a5', 'derivation', String.raw`Shows a multistep derivation that uses \(K = \tfrac{1}{2}mv^2\) beyond restating it, such as writing \(\Delta K = \tfrac{1}{2}m_fv_f^2 - \tfrac{1}{2}m_iv_i^2\) with quantities substituted.`, ['writes only K = ½mv² with nothing substituted', 'uses momentum in place of kinetic energy'], String.raw`\(\Delta K = \tfrac{1}{2}(3m)v_f^2 - \tfrac{1}{2}(2m)v_0^2\).`, 'Writes K = ½mv² and stops.'),
      pt('phys1-mr-carts-a6', 'derivation', String.raw`Uses \(2m\) as the moving mass before the collision and \(3m\) after it.`, ['uses m or 2m for the final mass', 'includes cart B in the initial kinetic energy with a nonzero speed'], String.raw`Initial \(K = \tfrac{1}{2}(2m)v_0^2\), final \(K = \tfrac{1}{2}(3m)v_f^2\).`, 'Uses ½(3m)v0² for the initial kinetic energy.'),
      pt('phys1-mr-carts-a7', 'calculation', String.raw`Substitutes a \(v_f\) consistent with part A (ii) and reaches \(\Delta K = -\tfrac{1}{3}mv_0^2\) (or an answer consistent with an incorrect \(v_f\)).`, ['reports a positive change in kinetic energy', 'arithmetic error with the fraction 4/9'], String.raw`\(\tfrac{1}{2}(3m)\left(\tfrac{4}{9}v_0^2\right) - mv_0^2 = \tfrac{2}{3}mv_0^2 - mv_0^2 = -\tfrac{1}{3}mv_0^2\).`, 'Reports ΔK = 0 because the collision conserves energy.'),
    ]),
    part('B', String.raw`The experiment is repeated, but now cart B carries a light spring bumper, so the carts push on each other through the spring for a short time interval \(\Delta t\) before separating. Indicate whether the \(x\)-component of the total momentum of the two-cart system increases, decreases, or remains constant during \(\Delta t\). Justify your answer.`, [
      pt('phys1-mr-carts-b1', 'justification', 'Indicates that the total momentum remains constant.', ['says the momentum decreases because cart A slows', 'says momentum is stored in the spring'], 'Remains constant.', 'Decreases, because the spring absorbs momentum.'),
      pt('phys1-mr-carts-b2', 'justification', 'States that the spring force is internal to the two-cart system, or that the net external force on the system is zero.', ['mentions only that the track is frictionless without addressing the spring force', 'claims the spring force is external'], 'The spring forces are internal, and no net external force acts horizontally.', 'The spring pushes cart A backward, so momentum is lost.'),
      pt('phys1-mr-carts-b3', 'justification', 'States that the impulses (or changes in momentum) of the two carts are equal in magnitude and opposite in direction, or relates the system’s change in momentum to the net external force.', ['states Newton’s third law without connecting it to momentum or impulse'], 'The spring exerts equal and opposite forces on the carts for the same time, so their impulses cancel.', 'The forces are equal and opposite.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) A horizontal line at \(p_x = 2mv_0\) from \(t = 0\) through and past \(t_2\). (ii) \(p_i = p_f\): \(2mv_0 = 3mv_f\), so \(v_f = \tfrac{2}{3}v_0\). (iii) \(\Delta K = \tfrac{1}{2}(3m)\left(\tfrac{2}{3}v_0\right)^2 - \tfrac{1}{2}(2m)v_0^2 = \tfrac{2}{3}mv_0^2 - mv_0^2 = -\tfrac{1}{3}mv_0^2\). B Remains constant. The spring forces on the two carts are internal to the system and equal and opposite, so their impulses are equal and opposite and the net external horizontal force is zero; the system's momentum cannot change.`,
});

// ── 2. Translation Between Representations (modeled on 2025 Q2: energy bar charts, spring and ramp) ──
frqs.push({
  id: 'phys1-tbr-spring-ramp', questionNumber: 2, title: 'Spring Launcher and Curved Ramp', topic: 'Translation Between Representations · Energy bar charts and conservation of energy',
  modeledOn: modeled(2025, 2, 'Translation Between Representations'), timeAllottedMin: 30,
  prompt: String.raw`A block of mass \(M\) is pushed against a horizontal spring of spring constant \(k\), compressing it a distance \(d\) from its relaxed length, and is released from rest at position 1. The block leaves the spring at position 2, slides along the level surface, and then up a curved ramp, momentarily stopping at height \(H\) at position 3. All surfaces are frictionless. The gravitational potential energy \(U_g\) of the block-spring-Earth system is zero when the block is on the level surface.`,
  figures: [fig('Figure 1', draw(420, 160, 'A spring attached to a wall on the left is compressed by a block at position 1. Position 2 is where the block leaves the relaxed spring. The level surface curves up into a ramp on the right; position 3 is at height H on the ramp', [
    ['line', 20, 30, 20, 140, { width: 3 }], spring(20, 110, 128, 9), ['rect', 110, 112, 30, 26, { fill: true }], text(125, 105, '1', { bold: true }), ['line', 20, 140, 260, 140, { width: 2 }], ['path', 'M260 140 Q340 140 380 40', { width: 2 }],
    text(170, 132, '2', { bold: true }), ['line', 170, 140, 170, 146], ['rect', 352, 54, 22, 18, { fill: true, rotate: [-60, 363, 63] }], text(388, 62, '3', { bold: true }), ['line', 395, 68, 395, 140, { dash: true }], text(405, 108, 'H', { italic: true, anchor: 'start' }),
    ['line', 110, 150, 170, 150], text(140, 160, 'd', { italic: true }),
  ]))],
  parts: [
    part('A', String.raw`The bar chart in Figure 2 represents the energy of the block-spring-Earth system at position 2. On charts like those in Figure 3, draw bars to represent \(K\), \(U_g\), and \(U_s\) at position 1 and at position 3. Represent any energy that is zero with a distinct line on the zero line, and keep the heights consistent with the scale of Figure 2.`, [
      pt('phys1-tbr-spring-ramp-a1', 'representation', String.raw`At position 1, draws only a \(U_s\) bar (with \(K\) and \(U_g\) shown as zero).`, ['draws a kinetic energy bar at position 1', 'includes U_g at position 1'], 'Position 1: U_s bar only; K and U_g drawn as lines on zero.', 'Position 1: equal K and U_s bars.'),
      pt('phys1-tbr-spring-ramp-a2', 'representation', String.raw`At position 3, draws only a \(U_g\) bar (with \(K\) and \(U_s\) shown as zero).`, ['draws a nonzero K at position 3', 'draws a U_s bar at position 3'], 'Position 3: U_g bar only.', 'Position 3: U_g and K bars, as if the block is still moving.'),
      pt('phys1-tbr-spring-ramp-a3', 'representation', String.raw`Draws the single bar at each position with a height of \(8E_0\), equal to the total energy shown in Figure 2.`, ['changes the total energy between positions', 'draws heights that do not match the 8E0 total'], 'Both the U_s bar at position 1 and the U_g bar at position 3 reach 8E0.', 'Draws U_g = 4E0 at position 3.'),
    ], [fig('Figure 2', barChart('Position 2', ['K', 'Ug', 'Us'], [8, 0, 0])), fig('Figure 3', barChart('Positions 1 and 3 (blank)', ['K', 'Ug', 'Us'], [null, null, null]))]),
    part('B', String.raw`Starting with conservation of energy, derive an expression for \(H\) in terms of \(M\), \(k\), \(d\), and physical constants, as appropriate.`, [
      pt('phys1-tbr-spring-ramp-b1', 'derivation', 'Writes a multistep derivation beginning with conservation of energy for the block-spring-Earth system.', ['starts with kinematics equations', 'starts with Newton’s second law without energy'], String.raw`\(E_1 = E_3\).`, 'Starts with v² = v0² + 2aΔx.'),
      pt('phys1-tbr-spring-ramp-b2', 'derivation', 'Equates the spring potential energy at position 1 to the gravitational potential energy at position 3.', ['equates spring energy to kinetic energy and stops', 'adds the two energies instead of equating them'], String.raw`\(U_{s,1} = U_{g,3}\).`, 'Writes U_s + U_g = 0.'),
      pt('phys1-tbr-spring-ramp-b3', 'derivation', String.raw`Substitutes \(\tfrac{1}{2}kd^2\) for the spring energy or \(MgH\) for the gravitational energy.`, ['uses kd without the square', 'uses ½kd for the spring energy'], String.raw`\(\tfrac{1}{2}kd^2 = MgH\).`, 'Writes kd = MgH.'),
      pt('phys1-tbr-spring-ramp-b4', 'derivation', String.raw`Arrives at \(H = \dfrac{kd^2}{2Mg}\) or an algebraic equivalent.`, ['drops the factor of 2', 'leaves H in terms of the speed at position 2'], String.raw`\(H = \dfrac{kd^2}{2Mg}\).`, String.raw`\(H = \dfrac{kd^2}{Mg}\).`),
    ]),
    part('C', String.raw`On axes of energy versus the block's position \(x\), from \(x = -d\) (position 1) to \(x = 0\) (position 2), sketch and label (i) the spring potential energy \(U_s\) and (ii) the kinetic energy \(K\) of the block.`, [
      pt('phys1-tbr-spring-ramp-c1', 'representation', String.raw`Sketches \(U_s\) as a concave-up curve that is maximum at \(x = -d\) and zero at \(x = 0\).`, ['draws U_s as a straight line', 'draws U_s increasing toward x = 0'], 'U_s is a decreasing parabola reaching zero at x = 0.', 'U_s is a straight line from 8E0 to 0.'),
      pt('phys1-tbr-spring-ramp-c2', 'representation', String.raw`Sketches \(K\) starting at zero at \(x = -d\) and increasing to its maximum at \(x = 0\), concave down.`, ['draws K as constant', 'draws K decreasing'], 'K starts at zero and rises to 8E0 at x = 0, curving downward.', 'K is constant at 8E0.'),
      pt('phys1-tbr-spring-ramp-c3', 'representation', String.raw`Draws \(K\) and \(U_s\) so that their sum is constant at every position (the curves are mirror images).`, ['curves cross at a value other than half the total', 'K reaches a maximum other than the total energy'], 'The curves cross at 4E0, halfway between.', 'K reaches only 4E0 at x = 0.'),
    ]),
    part('D', String.raw`The spring is now compressed a distance \(2d\). Indicate whether the new maximum height is greater than \(2H\), equal to \(2H\), or less than \(2H\). Justify your answer by referencing your derivation in part B.`, [
      pt('phys1-tbr-spring-ramp-d1', 'justification', String.raw`Indicates that the new height is greater than \(2H\) (it is \(4H\)).`, ['claims the height doubles', 'claims the height is unchanged'], 'Greater than 2H; it is 4H.', 'Equal to 2H.'),
      pt('phys1-tbr-spring-ramp-d2', 'justification', String.raw`Justifies using the functional dependence \(H \propto d^2\) from part B, so doubling \(d\) quadruples \(H\).`, ['states that more compression gives more height without the squared dependence'], 'Because H is proportional to d², doubling d multiplies H by 4.', 'More compression stores more energy, so the block goes higher.'),
    ]),
  ],
  sampleResponse: String.raw`A Position 1: \(U_s = 8E_0\), \(K = U_g = 0\). Position 3: \(U_g = 8E_0\), \(K = U_s = 0\). B \(E_1 = E_3\): \(\tfrac{1}{2}kd^2 = MgH\), so \(H = \dfrac{kd^2}{2Mg}\). C \(U_s\) decreases along a concave-up parabola from \(8E_0\) at \(x = -d\) to 0 at \(x = 0\); \(K\) rises from 0 to \(8E_0\), and the two always add to \(8E_0\). D Greater than \(2H\): since \(H \propto d^2\), compressing the spring twice as far stores four times the energy, so the block rises to \(4H\).`,
});

// ── 3. Experimental Design and Analysis (modeled on 2025 Q3: designing a linearized measurement) ──
const oscRows = [['0.20', '0.63'], ['0.40', '0.88'], ['0.60', '1.10'], ['0.80', '1.25'], ['1.00', '1.41']];
frqs.push({
  id: 'phys1-lab-oscillating-cart', questionNumber: 3, title: 'Finding a Spring Constant from Oscillations', topic: 'Experimental Design and Analysis · Simple harmonic motion and linearization',
  modeledOn: modeled(2025, 3, 'Experimental Design and Analysis'), timeAllottedMin: 25,
  prompt: String.raw`Students have a cart attached to a horizontal spring of unknown spring constant \(k\) on a level track with negligible friction, as shown in Figure 1. They have a set of masses that can be placed on the cart, a stopwatch, and a balance.`,
  figures: [fig('Figure 1', draw(380, 110, 'A cart on a level track is attached to a horizontal spring fixed to a wall on the left. Masses can be stacked on the cart', [
    ['line', 20, 20, 20, 90, { width: 3 }], spring(20, 170, 62, 10), ['rect', 170, 44, 90, 36, { fill: true }], ['rect', 195, 28, 40, 16, { fill: true }], text(215, 66, 'cart', { size: 11 }), ['circle', 190, 84, 6], ['circle', 240, 84, 6], ['line', 20, 90, 360, 90, { width: 2 }],
  ]))],
  parts: [
    part('A', 'Describe an experimental procedure the students could use to collect data that would allow them to determine k using a linear graph. Include any steps needed to reduce experimental uncertainty.', [
      pt('phys1-lab-oscillating-cart-a1', 'experimental-design', 'Describes varying the total oscillating mass (cart plus added masses, measured with the balance) and measuring the period of oscillation for each mass.', ['varies the amplitude instead of the mass', 'measures only one mass', 'measures a distance with a stopwatch'], 'Add masses to the cart, measure the total mass, displace the cart, and time its oscillations for each mass.', 'Pull the cart back different distances and time how long it takes to return.'),
      pt('phys1-lab-oscillating-cart-a2', 'experimental-design', 'Describes a reasonable way to reduce uncertainty, such as timing several oscillations and dividing, or repeating trials for each mass and averaging.', ['says "be careful" without a specific method', 'repeats only the mass measurement'], 'Time 10 oscillations and divide by 10, and repeat three times for each mass.', 'Measure carefully to reduce error.'),
    ]),
    part('B', 'Describe how the data could be graphed to produce a linear graph and how the graph would be analyzed to determine k.', [
      pt('phys1-lab-oscillating-cart-b1', 'data-analysis', String.raw`Identifies quantities that produce a linear graph, such as \(T^2\) versus \(m\) (or \(T\) versus \(\sqrt{m}\)).`, ['graphs T versus m and calls it linear', 'graphs T versus k'], String.raw`Graph \(T^2\) on the vertical axis and the total mass \(m\) on the horizontal axis.`, 'Graph period versus mass.'),
      pt('phys1-lab-oscillating-cart-b2', 'data-analysis', String.raw`Relates the slope to \(k\), for example: slope \(= \dfrac{4\pi^2}{k}\), so \(k = \dfrac{4\pi^2}{\text{slope}}\).`, ['says the slope equals k', 'inverts the relationship'], String.raw`Since \(T^2 = \dfrac{4\pi^2}{k}m\), \(k = \dfrac{4\pi^2}{\text{slope}}\).`, 'The slope is the spring constant.'),
    ]),
    part('C', String.raw`The students' data are shown in Table 1. (i) Indicate a quantity that could be graphed on the vertical axis, with total mass on the horizontal axis, to produce a linear graph. (ii) Plot the data on a labeled graph with a linear scale and units. (iii) Draw a best-fit line.`, [
      pt('phys1-lab-oscillating-cart-c1', 'data-analysis', String.raw`Indicates \(T^2\) (or an equivalent such as \(T^2/4\pi^2\)) for the vertical axis.`, ['chooses T', 'chooses 1/T'], String.raw`Vertical axis: \(T^2\) (s²).`, 'Vertical axis: T (s).'),
      pt('phys1-lab-oscillating-cart-c2', 'data-analysis', 'Labels the vertical axis with the quantity and correct units and uses a linear scale.', ['omits units', 'uses an uneven scale'], 'Labels the axis "T² (s²)" with evenly spaced ticks.', 'No label on the vertical axis.'),
      pt('phys1-lab-oscillating-cart-c3', 'data-analysis', String.raw`Plots points consistent with the indicated quantities (about 0.40, 0.77, 1.21, 1.56, 1.99 s² for \(T^2\)).`, ['plots T instead of the squared values', 'misplots two or more points'], 'Plots (0.20, 0.40), (0.40, 0.77), (0.60, 1.21), (0.80, 1.56), (1.00, 1.99).', 'Plots T values against mass.'),
      pt('phys1-lab-oscillating-cart-c4', 'data-analysis', 'Draws a single straight best-fit line that follows the trend of the data rather than connecting the dots.', ['connects the points dot to dot', 'forces the line through the first and last points only'], 'A straight line with points scattered on both sides.', 'A zigzag through every point.'),
    ], [tableFigure('Table 1', ['Total mass m (kg)', 'Period T (s)'], oscRows)]),
    part('D', 'Using your best-fit line, calculate an experimental value for k.', [
      pt('phys1-lab-oscillating-cart-d1', 'data-analysis', String.raw`Correctly relates the slope of the best-fit line to \(k\), consistent with the graph in part C.`, ['uses a single data point instead of the slope', 'uses the slope directly as k'], String.raw`\(k = \dfrac{4\pi^2}{\text{slope}}\).`, 'k = T²/m from the first row.'),
      pt('phys1-lab-oscillating-cart-d2', 'calculation', String.raw`Reports a value of \(k\) between about \(18\) and \(22\text{ N/m}\).`, ['reports k in the wrong units', 'reports about 2 N/m by inverting the slope'], String.raw`Slope \(\approx \dfrac{1.99 - 0.40}{0.80} \approx 1.99\text{ s}^2\text{/kg}\), so \(k \approx \dfrac{39.5}{1.99} \approx 20\text{ N/m}\).`, String.raw`\(k \approx 2.0\text{ N/m}\).`),
    ]),
  ],
  sampleResponse: String.raw`A For several total masses (measured with the balance), pull the cart a small distance, release it, and time 10 complete oscillations; divide by 10 to find \(T\). Repeat three times per mass and average. B Graph \(T^2\) versus \(m\); because \(T^2 = \dfrac{4\pi^2}{k}m\), the slope is \(\dfrac{4\pi^2}{k}\), so \(k = \dfrac{4\pi^2}{\text{slope}}\). C Vertical axis \(T^2\) (s²); points (0.20, 0.40), (0.40, 0.77), (0.60, 1.21), (0.80, 1.56), (1.00, 1.99) with a straight best-fit line. D Slope \(\approx 1.99\text{ s}^2\text{/kg}\), so \(k \approx 4\pi^2/1.99 \approx 20\text{ N/m}\).`,
});

// ── 4. Qualitative/Quantitative Translation (modeled on 2025 Q4: buoyancy in two fluids) ──
frqs.push({
  id: 'phys1-qqt-spring-scale', questionNumber: 4, title: 'Weighing a Block Under Water and Oil', topic: 'Qualitative/Quantitative Translation · Buoyant force and Newton’s second law',
  modeledOn: modeled(2025, 4, 'Qualitative/Quantitative Translation'), timeAllottedMin: 20,
  prompt: String.raw`A block of mass \(m\) and volume \(V\) hangs at rest from a spring scale. In Scenario 1, the block is fully submerged in water of density \(\rho_w\), and the scale reads \(F_1\). In Scenario 2, the same block is fully submerged in oil of density \(\rho_o\), where \(\rho_o < \rho_w\), and the scale reads \(F_2\). The block does not touch the bottom of either container.`,
  figures: [fig('Figure 1', draw(380, 190, 'Two containers. In each, a block hangs fully submerged from a spring scale above. The left container holds water; the right container holds oil', [
    ...[[90, 'Water, ρw'], [290, 'Oil, ρo']].flatMap(([x, l]) => [['rect', x - 55, 70, 110, 105, { width: 2 }], ['rect', x - 54, 85, 108, 89, { fill: '#60a5fa', color: '#60a5fa', width: 0.1 }], ['rect', x - 8, 8, 16, 40, { fill: true }], ['line', x, 48, x, 112], ['rect', x - 16, 112, 32, 28, { fill: true }], text(x, 188, l, { size: 11 })]),
  ]))],
  parts: [
    part('A', String.raw`Indicate whether \(F_1\) is greater than, less than, or equal to \(F_2\). Justify your answer in terms of all the forces exerted on the block, using qualitative reasoning beyond referencing equations.`, [
      pt('phys1-qqt-spring-scale-a1', 'justification', String.raw`Indicates \(F_1 < F_2\).`, ['indicates F1 > F2', 'indicates the readings are equal'], String.raw`\(F_1 < F_2\).`, String.raw`\(F_1 > F_2\) because water is heavier.`),
      pt('phys1-qqt-spring-scale-a2', 'justification', 'States that the gravitational force on the block (its weight) is the same in both scenarios.', ['ignores the weight', 'says the block weighs less in water'], 'The block’s weight mg is the same in both liquids.', 'The block is lighter in water.'),
      pt('phys1-qqt-spring-scale-a3', 'justification', 'States that the buoyant force is greater in the denser water, so the spring scale must supply less upward force to keep the block in equilibrium.', ['states the buoyant force depends on the block’s density', 'does not connect the buoyant force to the scale reading'], 'Water exerts a larger buoyant force because it is denser, so the scale supports less of the weight.', 'Water pushes harder.'),
    ]),
    part('B', String.raw`Starting with Newton's second law, derive an expression for the spring scale reading \(F\) when the block is fully submerged in a fluid of density \(\rho\). Express your answer in terms of \(m\), \(V\), \(\rho\), and physical constants, as appropriate.`, [
      pt('phys1-qqt-spring-scale-b1', 'derivation', String.raw`Writes Newton's second law for the block in equilibrium, \(\Sigma F = 0\), including the scale force, the buoyant force, and the weight.`, ['omits the buoyant force', 'sets the net force equal to ma with a nonzero a'], String.raw`\(F + F_B - mg = 0\).`, String.raw`\(F = mg\).`),
      pt('phys1-qqt-spring-scale-b2', 'derivation', String.raw`Uses \(F_B = \rho V g\) for the buoyant force.`, ['uses the block’s density in the buoyant force', 'omits g'], String.raw`\(F_B = \rho V g\).`, String.raw`\(F_B = \rho m g\).`),
      pt('phys1-qqt-spring-scale-b3', 'derivation', String.raw`Arrives at \(F = mg - \rho V g\) (or an algebraic equivalent).`, ['sign error, getting mg + ρVg'], String.raw`\(F = mg - \rho V g\).`, String.raw`\(F = mg + \rho V g\).`),
    ]),
    part('C', 'Indicate whether your expression from part B is or is not consistent with your claim in part A. Briefly justify your answer by referencing the expression.', [
      pt('phys1-qqt-spring-scale-c1', 'justification', String.raw`Uses functional dependence language to relate \(F\) and \(\rho\) in the derived expression.`, ['restates part A without referencing the expression'], String.raw`The reading decreases as \(\rho\) increases because \(\rho\) appears in a subtracted term.`, 'My answer agrees with part A.'),
      pt('phys1-qqt-spring-scale-c2', 'justification', String.raw`Correctly concludes that a larger fluid density gives a smaller reading, consistent with part A (or correctly identifies an inconsistency with an incorrect part A).`, ['claims consistency when the expression contradicts part A'], String.raw`Since \(\rho_w > \rho_o\), \(F_1 = mg - \rho_w V g < F_2\), which is consistent.`, 'It is consistent because both depend on mass.'),
    ]),
  ],
  sampleResponse: String.raw`A \(F_1 < F_2\). Gravity pulls down on the block with the same force \(mg\) in both liquids, and each liquid pushes up with a buoyant force. Water is denser, so it pushes up harder; the scale then has to supply less upward force to hold the block at rest. B \(\Sigma F = 0\): \(F + \rho V g - mg = 0\), so \(F = mg - \rho V g\). C Consistent: \(\rho\) appears in a subtracted term, so a denser fluid gives a smaller reading, matching \(F_1 < F_2\).`,
});

// ── 5. Mathematical Routines (modeled on 2026 Q1: projectile motion and fluid flow rate) ──
frqs.push({
  id: 'phys1-mr-garden-hose', questionNumber: 1, title: 'Garden Hose Stream', topic: 'Mathematical Routines · Projectile motion and the continuity equation',
  modeledOn: modeled(2026, 1, 'Mathematical Routines'), timeAllottedMin: 25,
  prompt: String.raw`Water leaves the nozzle of a garden hose horizontally at height \(h\) above level ground and lands a horizontal distance \(D\) from the nozzle, as shown in Figure 1. Air resistance is negligible. At \(t = 0\) a small parcel of water leaves the nozzle, and at \(t = t_f\) it reaches the ground.`,
  figures: [fig('Figure 1', draw(400, 170, 'A nozzle at height h above the ground sprays water horizontally. The stream curves downward and lands a horizontal distance D away', [
    ['line', 10, 150, 390, 150, { width: 2 }], ['rect', 30, 40, 40, 14, { fill: true }], ['path', 'M70 47 Q200 50 330 150', { color: BLUE, width: 3 }], ['line', 50, 54, 50, 150, { dash: true }], text(40, 105, 'h', { italic: true, anchor: 'end' }),
    ['line', 70, 162, 330, 162], text(200, 158, 'D', { italic: true }), text(50, 32, 'nozzle', { size: 11 }),
  ]))],
  parts: [
    part('A (i)', String.raw`On separate axes, sketch graphs of the horizontal and vertical components of the velocity of the water parcel as functions of \(t\) from \(t = 0\) to \(t = t_f\). Take upward as positive.`, [
      pt('phys1-mr-garden-hose-a1', 'representation', 'Sketches the horizontal velocity component as a nonzero horizontal line (constant) from 0 to t_f.', ['draws the horizontal velocity decreasing', 'starts it at zero'], 'A horizontal line at v0.', 'A line sloping down to zero at t_f.'),
      pt('phys1-mr-garden-hose-a2', 'representation', 'Sketches the vertical velocity component as a straight line starting at zero and becoming increasingly negative (slope −g).', ['starts at a nonzero value', 'draws it curving', 'draws it positive'], 'A straight line from 0 sloping downward.', 'A line from 0 rising upward.'),
    ]),
    part('A (ii)', String.raw`Derive an expression for the speed \(v_0\) of the water as it leaves the nozzle. Express your answer in terms of \(h\), \(D\), and physical constants, as appropriate.`, [
      pt('phys1-mr-garden-hose-a3', 'derivation', String.raw`Uses vertical kinematics with zero initial vertical velocity, such as \(h = \tfrac{1}{2}gt_f^2\), to find the time of flight.`, ['uses the horizontal speed in the vertical equation', 'assumes an upward launch'], String.raw`\(h = \tfrac{1}{2}gt_f^2 \Rightarrow t_f = \sqrt{2h/g}\).`, String.raw`\(h = v_0 t_f\).`),
      pt('phys1-mr-garden-hose-a4', 'derivation', String.raw`Uses constant horizontal velocity, \(D = v_0 t_f\).`, ['includes an acceleration in the horizontal direction'], String.raw`\(D = v_0 t_f\).`, String.raw`\(D = \tfrac{1}{2}gt_f^2\).`),
      pt('phys1-mr-garden-hose-a5', 'derivation', String.raw`Combines the equations to get \(v_0 = D\sqrt{\dfrac{g}{2h}}\) or an equivalent.`, ['inverts the fraction under the root', 'drops the factor of 2'], String.raw`\(v_0 = \dfrac{D}{\sqrt{2h/g}} = D\sqrt{\dfrac{g}{2h}}\).`, String.raw`\(v_0 = D\sqrt{\dfrac{2h}{g}}\).`),
    ]),
    part('A (iii)', String.raw`The nozzle has a circular opening of radius \(r\). Derive an expression for the volume flow rate of water leaving the nozzle in terms of \(h\), \(D\), \(r\), and physical constants, as appropriate.`, [
      pt('phys1-mr-garden-hose-a6', 'derivation', String.raw`Uses volume flow rate \(= Av\) with \(A = \pi r^2\).`, ['uses the circumference 2πr', 'uses r² without π'], String.raw`\(\dfrac{\Delta V}{\Delta t} = Av_0 = \pi r^2 v_0\).`, String.raw`\(\dfrac{\Delta V}{\Delta t} = 2\pi r v_0\).`),
      pt('phys1-mr-garden-hose-a7', 'derivation', String.raw`Substitutes the speed from part A (ii) to obtain \(\pi r^2 D\sqrt{\dfrac{g}{2h}}\) (or an expression consistent with an earlier answer).`, ['leaves v0 in the final answer'], String.raw`\(\dfrac{\Delta V}{\Delta t} = \pi r^2 D\sqrt{\dfrac{g}{2h}}\).`, String.raw`\(\pi r^2 v_0\) with v0 not expressed in terms of the given quantities.`),
    ]),
    part('B', String.raw`A thumb is placed over part of the nozzle, reducing the area of the opening, while the volume flow rate stays the same. The water still leaves horizontally from height \(h\). Indicate whether the new landing distance is greater than, less than, or equal to \(D\). Justify your answer, including qualitative reasoning beyond mathematical expressions.`, [
      pt('phys1-mr-garden-hose-b1', 'justification', 'Indicates that the new landing distance is greater than D.', ['indicates less than D', 'indicates equal because the flow rate is unchanged'], 'Greater than D.', 'Equal to D.'),
      pt('phys1-mr-garden-hose-b2', 'justification', 'Explains that with the same volume of water per second passing through a smaller opening, the water must leave faster (continuity).', ['says the water has more pressure without relating it to speed'], 'The same volume per second must squeeze through a smaller area, so it leaves at a greater speed.', 'Covering the hose increases pressure.'),
      pt('phys1-mr-garden-hose-b3', 'justification', 'Explains that the time in the air is unchanged because it depends only on the height, so a greater horizontal speed covers a greater distance.', ['claims the faster water also falls more slowly or quickly'], 'It still falls the same height in the same time, but travels faster horizontally during that time.', 'It goes farther because it is faster.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) Horizontal component: constant line at \(v_0\). Vertical component: straight line from 0 decreasing with slope \(-g\). (ii) \(h = \tfrac{1}{2}gt_f^2\), so \(t_f = \sqrt{2h/g}\); \(D = v_0t_f\), so \(v_0 = D\sqrt{\dfrac{g}{2h}}\). (iii) Flow rate \(= Av_0 = \pi r^2 D\sqrt{\dfrac{g}{2h}}\). B Greater than \(D\). The same volume of water per second must pass through a smaller opening, so it moves faster. The fall time depends only on \(h\), which is unchanged, so the faster water travels farther horizontally before landing.`,
});

// ── 6. Translation Between Representations (modeled on 2026 Q2: momentum vectors and center of mass) ──
frqs.push({
  id: 'phys1-tbr-gliders', questionNumber: 2, title: 'Air-Track Glider Collision', topic: 'Translation Between Representations · Momentum vectors and center of mass motion',
  modeledOn: modeled(2026, 2, 'Translation Between Representations'), timeAllottedMin: 30,
  prompt: String.raw`Glider X of mass \(2m_0\) moves to the right on a level air track with speed \(v_0\) toward glider Y of mass \(m_0\), which is at rest. Friction is negligible. At \(t = t_1\) they collide, and immediately afterward glider X moves to the right with speed \(\tfrac{1}{3}v_0\).`,
  figures: [fig('Figure 1', draw(380, 110, 'Glider X of mass 2m0 moves right with speed v0 toward glider Y of mass m0 at rest on an air track', [
    ['line', 10, 80, 370, 80, { width: 3 }], ['rect', 60, 50, 90, 28, { fill: true }], text(105, 69, '2m₀', { italic: true }), ['arrow', 155, 58, 200, 58], text(178, 50, 'v₀', { italic: true }), ['rect', 250, 54, 60, 24, { fill: true }], text(280, 71, 'm₀', { italic: true }), text(105, 100, 'Glider X', { size: 11 }), text(280, 100, 'Glider Y (at rest)', { size: 11 }),
  ]))],
  parts: [
    part('A', String.raw`Before the collision, glider X's momentum is represented by an arrow 6 grid units long pointing right, and glider Y's momentum is zero. Draw arrows, on the same scale, to represent the momentum of each glider immediately after the collision. Label any zero momentum "\(p = 0\)".`, [
      pt('phys1-tbr-gliders-a1', 'representation', 'Draws glider X’s momentum after the collision as a rightward arrow 2 units long.', ['draws X’s arrow pointing left', 'draws it 6 units long'], 'X: rightward arrow of 2 units.', 'X: leftward arrow.'),
      pt('phys1-tbr-gliders-a2', 'representation', 'Draws glider Y’s momentum after the collision as a rightward arrow 4 units long.', ['draws Y’s arrow 6 units long', 'draws Y’s arrow pointing left'], 'Y: rightward arrow of 4 units.', 'Y: rightward arrow of 2 units.'),
      pt('phys1-tbr-gliders-a3', 'representation', 'Draws arrows whose lengths sum to 6 units, the same total momentum as before the collision.', ['changes the total momentum'], 'X = 2 units and Y = 4 units, total 6.', 'X = 3 units and Y = 6 units.'),
    ]),
    part('B', String.raw`Starting with conservation of linear momentum, derive an expression for the kinetic energy of glider Y immediately after the collision in terms of \(m_0\), \(v_0\), and physical constants, as appropriate.`, [
      pt('phys1-tbr-gliders-b1', 'derivation', String.raw`Writes conservation of momentum with the correct masses: \(2m_0v_0 = 2m_0\left(\tfrac{1}{3}v_0\right) + m_0v_Y\).`, ['omits glider X’s final momentum', 'uses m0 for glider X'], String.raw`\(2m_0v_0 = \tfrac{2}{3}m_0v_0 + m_0v_Y\).`, String.raw`\(2m_0v_0 = m_0v_Y\).`),
      pt('phys1-tbr-gliders-b2', 'calculation', String.raw`Solves for \(v_Y = \tfrac{4}{3}v_0\).`, ['gets 2v0 by ignoring X’s final momentum'], String.raw`\(v_Y = \tfrac{4}{3}v_0\).`, String.raw`\(v_Y = 2v_0\).`),
      pt('phys1-tbr-gliders-b3', 'derivation', String.raw`Uses \(K = \tfrac{1}{2}m_0v_Y^2\) to obtain \(K_Y = \tfrac{8}{9}m_0v_0^2\) (or a value consistent with the earlier speed).`, ['uses glider X’s mass', 'forgets to square the speed'], String.raw`\(K_Y = \tfrac{1}{2}m_0\left(\tfrac{4}{3}v_0\right)^2 = \tfrac{8}{9}m_0v_0^2\).`, String.raw`\(K_Y = \tfrac{2}{3}m_0v_0^2\).`),
    ]),
    part('C', String.raw`A graph shows the positions of glider X, glider Y, and the center of mass of the two-glider system from \(t = 0\) to \(t_1\): X's line rises with slope \(v_0\), Y's line is horizontal, and the center of mass line rises with a constant slope. Describe or sketch the three lines from \(t_1\) to \(2t_1\), clearly labeling each.`, [
      pt('phys1-tbr-gliders-c1', 'representation', String.raw`Draws glider Y's line after \(t_1\) as a straight line with the greatest positive slope (speed \(\tfrac{4}{3}v_0\)).`, ['keeps Y horizontal after the collision'], 'Y rises steeply after t1.', 'Y stays horizontal.'),
      pt('phys1-tbr-gliders-c2', 'representation', String.raw`Draws glider X's line after \(t_1\) as a straight line with a smaller positive slope (speed \(\tfrac{1}{3}v_0\)), continuous at \(t_1\).`, ['draws X moving backward', 'draws a gap at t1'], 'X continues rising, but less steeply.', 'X’s line drops after t1.'),
      pt('phys1-tbr-gliders-c3', 'representation', String.raw`Draws the center of mass line continuing with the same slope \(\left(\tfrac{2}{3}v_0\right)\) before and after \(t_1\).`, ['changes the center of mass slope at t1', 'draws the center of mass at rest'], 'The center of mass line is one unbroken straight line.', 'The center of mass line bends at t1.'),
      pt('phys1-tbr-gliders-c4', 'representation', String.raw`Labels all three lines so they can be distinguished, with the center-of-mass line lying between the lines for X and Y after \(t_1\).`, ['leaves lines unlabeled', 'places the center of mass outside the gliders'], 'All three lines labeled; the center of mass lies between X and Y.', 'Three unlabeled lines.'),
    ]),
    part('D', String.raw`Indicate whether the magnitude of the change in momentum of glider X during the collision is greater than, less than, or equal to that of glider Y. Briefly justify your answer by referencing a fundamental physics principle.`, [
      pt('phys1-tbr-gliders-d1', 'justification', 'Indicates that the magnitudes are equal.', ['indicates X’s change is greater because it is more massive'], 'Equal.', 'Greater for X.'),
      pt('phys1-tbr-gliders-d2', 'justification', 'Justifies with Newton’s third law (equal and opposite forces for the same time, so equal and opposite impulses) or with conservation of momentum.', ['states the answer without a principle'], 'The gliders exert equal and opposite forces on each other for the same time, so their impulses are equal in magnitude.', 'Because the collision is fast.'),
    ]),
  ],
  sampleResponse: String.raw`A X: rightward arrow 2 units; Y: rightward arrow 4 units (total 6, as before). B \(2m_0v_0 = 2m_0\left(\tfrac{1}{3}v_0\right) + m_0v_Y\), so \(v_Y = \tfrac{4}{3}v_0\) and \(K_Y = \tfrac{1}{2}m_0\left(\tfrac{4}{3}v_0\right)^2 = \tfrac{8}{9}m_0v_0^2\). C After \(t_1\): Y rises with the steepest slope \(\left(\tfrac{4}{3}v_0\right)\); X rises with slope \(\tfrac{1}{3}v_0\); the center of mass continues with the same slope \(\tfrac{2}{3}v_0\), between the two gliders. D Equal: by Newton's third law the gliders exert equal and opposite forces on each other for the same time, so their changes in momentum are equal in magnitude and opposite in direction.`,
});

// ── 7. Experimental Design and Analysis (modeled on 2026 Q3: coefficient of kinetic friction from a linear graph) ──
const frictionRows = [['0.50', '1.5'], ['0.75', '2.2'], ['1.00', '3.0'], ['1.25', '3.6'], ['1.50', '4.4']];
frqs.push({
  id: 'phys1-lab-friction', questionNumber: 3, title: 'Measuring Kinetic Friction with a Spring Scale', topic: 'Experimental Design and Analysis · Friction and linear graphs',
  modeledOn: modeled(2026, 3, 'Experimental Design and Analysis'), timeAllottedMin: 25,
  prompt: String.raw`Students want to determine the coefficient of kinetic friction \(\mu_k\) between a wooden block and a tabletop. They have the block, a set of masses that can be stacked on it, a balance, and a spring scale that can pull the block horizontally, as shown in Figure 1.`,
  figures: [fig('Figure 1', draw(380, 110, 'A student pulls a block horizontally across a table with a spring scale; masses can be stacked on the block', [
    ['line', 10, 80, 370, 80, { width: 2 }], ['rect', 70, 46, 80, 34, { fill: true }], ['rect', 90, 30, 40, 16, { fill: true }], ['line', 150, 63, 210, 63], ['rect', 210, 55, 70, 16, { fill: true }], text(245, 50, 'spring scale', { size: 11 }), ['arrow', 280, 63, 330, 63], text(110, 100, 'block + masses', { size: 11 }),
  ]))],
  parts: [
    part('A', String.raw`(i) Indicate quantities that the students could measure that would allow them to determine \(\mu_k\) using a linear graph. (ii) Briefly describe a method to reduce experimental uncertainty in the measured quantities.`, [
      pt('phys1-lab-friction-a1', 'experimental-design', 'Indicates measuring the total mass of the block and added masses (with the balance) and the spring scale force while the block moves at constant speed.', ['measures the force while the block is accelerating or at rest', 'omits the mass measurement'], 'Measure the total mass and the scale reading while pulling the block at constant speed.', 'Measure the force needed to start the block moving.'),
      pt('phys1-lab-friction-a2', 'experimental-design', 'Describes a valid method of reducing uncertainty, such as repeating each pull several times and averaging, or using many different masses.', ['vague statement such as "be precise"'], 'Repeat each pull three times and average the readings.', 'Be accurate.'),
    ]),
    part('B', String.raw`(i) Indicate what quantities could be graphed on each axis to create a linear graph. (ii) Describe the relationship between \(\mu_k\) and a feature of the graph.`, [
      pt('phys1-lab-friction-b1', 'data-analysis', 'Indicates a graph of friction (scale) force versus total mass, or versus normal force (mg).', ['graphs force versus time'], 'Spring scale force on the vertical axis and total mass on the horizontal axis.', 'Force on the vertical axis and speed on the horizontal axis.'),
      pt('phys1-lab-friction-b2', 'data-analysis', String.raw`Relates the slope to \(\mu_k\): slope \(= \mu_k g\) for force versus mass, or slope \(= \mu_k\) for force versus normal force.`, ['says the slope equals μk for force versus mass'], String.raw`\(F = \mu_k g\,m\), so \(\mu_k = \dfrac{\text{slope}}{g}\).`, String.raw`The slope is \(\mu_k\).`),
    ]),
    part('C', String.raw`The students pull the block at constant speed for five total masses and record the data in Table 1. (i) Label the vertical axis with a measured or calculated quantity and units so that the graph is linear with total mass on the horizontal axis. (ii) Plot the data with a numerical scale. (iii) Draw a best-fit line.`, [
      pt('phys1-lab-friction-c1', 'data-analysis', 'Labels the vertical axis with the scale (friction) force and units of newtons (or a quantity proportional to it).', ['omits units'], 'Vertical axis: F (N).', 'Vertical axis: force, no units.'),
      pt('phys1-lab-friction-c2', 'data-analysis', 'Uses a linear numerical scale that spreads the data over most of the grid.', ['uneven scale'], 'Ticks every 0.5 N from 0 to 5 N.', 'Ticks at 1.5, 2.2, 3.0, 3.6, 4.4 N.'),
      pt('phys1-lab-friction-c3', 'data-analysis', 'Plots all five points correctly.', ['misplots two or more points'], 'Plots (0.50, 1.5), (0.75, 2.2), (1.00, 3.0), (1.25, 3.6), (1.50, 4.4).', 'Plots mass on the vertical axis without relabeling.'),
      pt('phys1-lab-friction-c4', 'data-analysis', 'Draws a straight best-fit line that approximates the trend of the data.', ['connects the points dot to dot'], 'A single straight line close to the points.', 'A jagged line through each point.'),
    ], [tableFigure('Table 1', ['Total mass m (kg)', 'Scale force F (N)'], frictionRows)]),
    part('D', String.raw`Using your best-fit line, calculate an experimental value for \(\mu_k\).`, [
      pt('phys1-lab-friction-d1', 'data-analysis', String.raw`Correctly relates the slope to \(\mu_k\), consistent with the graph in part C.`, ['uses one data point instead of the slope'], String.raw`\(\mu_k = \dfrac{\text{slope}}{g}\).`, 'μk = F/m from the third row.'),
      pt('phys1-lab-friction-d2', 'calculation', String.raw`Reports \(\mu_k\) between about 0.27 and 0.33.`, ['forgets to divide by g, reporting about 2.9'], String.raw`Slope \(\approx \dfrac{4.4 - 1.5}{1.50 - 0.50} = 2.9\text{ N/kg}\), so \(\mu_k \approx \dfrac{2.9}{9.8} \approx 0.30\).`, String.raw`\(\mu_k \approx 2.9\).`),
    ]),
  ],
  sampleResponse: String.raw`A (i) The total mass \(m\) of the block and added masses (balance) and the spring scale reading \(F\) while the block slides at constant speed. (ii) Repeat each pull three times and average, and use five different masses. B (i) \(F\) on the vertical axis, \(m\) on the horizontal axis. (ii) At constant speed \(F = \mu_k mg\), so slope \(= \mu_k g\). C Vertical axis \(F\) (N), linear scale, five plotted points, straight best-fit line. D Slope \(\approx 2.9\text{ N/kg}\), so \(\mu_k = 2.9/9.8 \approx 0.30\).`,
});

// ── 8. Qualitative/Quantitative Translation (modeled on 2026 Q4: torque, work, and angular speed) ──
frqs.push({
  id: 'phys1-qqt-merry-go-round', questionNumber: 4, title: 'Pushing a Merry-Go-Round', topic: 'Qualitative/Quantitative Translation · Torque, rotational work, and angular speed',
  modeledOn: modeled(2026, 4, 'Qualitative/Quantitative Translation'), timeAllottedMin: 20,
  prompt: String.raw`A playground merry-go-round has rotational inertia \(I\) about its frictionless central axle and is initially at rest. In Case 1, a student pushes on the outer edge, a distance \(R\) from the axle, with a constant force of magnitude \(F\) that is always tangent to the circular path, while the merry-go-round turns through an angle \(\theta\). In Case 2, the student pushes with the same force at a distance \(\tfrac{R}{2}\) from the axle through the same angle \(\theta\). The final angular speeds are \(\omega_1\) and \(\omega_2\).`,
  figures: [fig('Figure 1 (overhead view)', draw(300, 220, 'Overhead view of a circular merry-go-round with an axle at its center. A tangential force F is applied at the outer edge, a distance R from the axle; a dashed inner circle marks the distance R/2', [
    ['circle', 150, 110, 90, { fill: true }], ['circle', 150, 110, 45, { dash: true }], ['circle', 150, 110, 5, { fill: 'currentColor' }], ['line', 150, 110, 240, 110], text(195, 102, 'R', { italic: true }), ['arrow', 240, 110, 240, 40, { color: PINK }], text(250, 60, 'F', { italic: true, anchor: 'start' }), text(150, 214, 'axle at center; dashed circle at R/2', { size: 10 }),
  ]))],
  parts: [
    part('A', String.raw`Indicate whether \(\omega_2\) is greater than, less than, or equal to \(\omega_1\). Justify your answer using qualitative reasoning beyond referencing equations.`, [
      pt('phys1-qqt-merry-go-round-a1', 'justification', String.raw`Indicates \(\omega_2 < \omega_1\).`, ['indicates equal because the force is the same'], String.raw`\(\omega_2 < \omega_1\).`, String.raw`\(\omega_2 = \omega_1\).`),
      pt('phys1-qqt-merry-go-round-a2', 'justification', 'Explains that pushing closer to the axle produces a smaller torque (or that the push acts over a shorter arc length, doing less work).', ['says the force is smaller closer to the center'], 'At R/2 the same force has half the lever arm, so it exerts half the torque.', 'The force is weaker near the center.'),
      pt('phys1-qqt-merry-go-round-a3', 'justification', 'Connects the smaller torque or work over the same angle to less rotational kinetic energy (or smaller angular acceleration), and so a smaller final angular speed.', ['states the conclusion without connecting torque or work to speed'], 'Less work is done over the same angle, so the merry-go-round gains less rotational kinetic energy and spins more slowly.', 'So it is slower.'),
    ]),
    part('B', String.raw`Starting with the work-energy theorem or Newton's second law in rotational form, derive an expression for \(\omega_1\) in terms of \(I\), \(F\), \(R\), \(\theta\), and physical constants, as appropriate.`, [
      pt('phys1-qqt-merry-go-round-b1', 'derivation', String.raw`Begins with the work-energy theorem \(W = \Delta K\) (or \(\tau = I\alpha\) with rotational kinematics).`, ['uses linear kinetic energy ½mv²'], String.raw`\(W = \Delta K_{\text{rot}}\).`, String.raw`\(F = ma\).`),
      pt('phys1-qqt-merry-go-round-b2', 'derivation', String.raw`Expresses the work as \(\tau\theta = FR\theta\) (or the torque as \(FR\)) and the kinetic energy as \(\tfrac{1}{2}I\omega^2\).`, ['uses Fθ without the lever arm', 'uses a lever arm of R/2 in Case 1'], String.raw`\(FR\theta = \tfrac{1}{2}I\omega_1^2\).`, String.raw`\(F\theta = \tfrac{1}{2}I\omega^2\).`),
      pt('phys1-qqt-merry-go-round-b3', 'derivation', String.raw`Arrives at \(\omega_1 = \sqrt{\dfrac{2FR\theta}{I}}\).`, ['drops the square root', 'drops the factor of 2'], String.raw`\(\omega_1 = \sqrt{\dfrac{2FR\theta}{I}}\).`, String.raw`\(\omega_1 = \dfrac{2FR\theta}{I}\).`),
    ]),
    part('C', 'Indicate whether your expression from part B is or is not consistent with your reasoning in part A. Justify by referencing the expression.', [
      pt('phys1-qqt-merry-go-round-c1', 'justification', String.raw`Uses functional dependence language relating \(\omega\) to the distance from the axle (\(\omega \propto \sqrt{R}\)).`, ['restates part A without referencing the expression'], String.raw`\(\omega\) is proportional to \(\sqrt{R}\).`, 'They agree.'),
      pt('phys1-qqt-merry-go-round-c2', 'justification', String.raw`Correctly concludes that halving the distance reduces \(\omega\) (by a factor of \(\sqrt{2}\)), consistent with part A.`, ['concludes ω is halved'], String.raw`Replacing \(R\) with \(R/2\) multiplies \(\omega\) by \(1/\sqrt{2}\), so \(\omega_2 < \omega_1\), consistent with part A.`, String.raw`\(\omega_2 = \omega_1/2\).`),
    ]),
  ],
  sampleResponse: String.raw`A \(\omega_2 < \omega_1\). Pushing at half the distance with the same force gives half the torque, and through the same angle the push acts over half the arc length, so it does half as much work. The merry-go-round gains less rotational kinetic energy, so it turns more slowly. B \(W = \Delta K\): \(FR\theta = \tfrac{1}{2}I\omega_1^2\), so \(\omega_1 = \sqrt{\dfrac{2FR\theta}{I}}\). C Consistent: \(\omega \propto \sqrt{R}\), so pushing at \(R/2\) gives \(\omega_2 = \omega_1/\sqrt{2} < \omega_1\).`,
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'phys1-mr-carts',
  transcript: String.raw`A (i) The graph is a horizontal line at \(p_x = 2mv_0\) the whole time, through \(t_1\) and \(t_2\).

A (ii) \(p_i = p_f\), so \(2mv_0 = (2m + m)v_f\) and \(v_f = \tfrac{2}{3}v_0\).

A (iii) \(\Delta K = \tfrac{1}{2}(3m)v_f^2 - \tfrac{1}{2}(2m)v_0^2 = \tfrac{1}{2}(3m)\tfrac{4}{9}v_0^2 - mv_0^2 = -\tfrac{1}{3}mv_0^2\).

B It remains constant. The spring is part of the system, so its force is internal and there is no net external force. The forces are equal and opposite.`,
  evidence: {
    'phys1-mr-carts-a1': String.raw`a horizontal line at \(p_x = 2mv_0\)`, 'phys1-mr-carts-a2': String.raw`the whole time, through \(t_1\) and \(t_2\)`,
    'phys1-mr-carts-a3': String.raw`\(p_i = p_f\)`, 'phys1-mr-carts-a4': String.raw`\(v_f = \tfrac{2}{3}v_0\)`,
    'phys1-mr-carts-a5': String.raw`\(\Delta K = \tfrac{1}{2}(3m)v_f^2 - \tfrac{1}{2}(2m)v_0^2\)`, 'phys1-mr-carts-a6': String.raw`\(\tfrac{1}{2}(3m)\) after and \(\tfrac{1}{2}(2m)\) before`, 'phys1-mr-carts-a7': String.raw`\(-\tfrac{1}{3}mv_0^2\)`,
    'phys1-mr-carts-b1': 'It remains constant.', 'phys1-mr-carts-b2': 'its force is internal and there is no net external force',
  },
  missed: { 'phys1-mr-carts-b3': 'Saying the forces are equal and opposite is not enough on its own. Connect it to momentum: the forces act on the two carts for the same time, so the impulses are equal and opposite and cancel.' },
  priorityFix: 'In part B, finish the reasoning from Newton’s third law to momentum: equal and opposite forces over the same time interval give equal and opposite impulses, so the total momentum cannot change.',
  sampleResponseComparison: 'Part A matches the sample response. In part B the sample response goes one step further, from equal and opposite forces to equal and opposite impulses on the two carts.',
};

module.exports = { course: 'ap-physics-1', frqs, canned };
