// AP Physics 2 free-response practice: eight original questions, two of each released
// question type, each modeled on a 2025 or 2026 released question with the same point
// total and skills (MR 10, TBR 12, LAB 10, QQT 8).
const { draw, spring } = require('../ap-mcq-build/diagram.cjs');
const { pt, part, tableFigure, text, fig } = require('./frq-helpers.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const SG = year => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-physics-2.pdf`;
const modeled = (year, n, type) => ({ year, question: n, type, label: `${year} AP Physics 2 Question ${n} (${type})`, url: SG(year) });

// A battery in a vertical wire: long plate (+) at height y, short plate at y + 8, centred on x.
const battery = (x, y) => [['line', x - 14, y, x + 14, y, { width: 2 }], ['line', x - 7, y + 8, x + 7, y + 8, { width: 3.5 }]];
// A resistor zigzag from (x1, y) to (x2, y).
const resistor = (x1, x2, y) => spring(x1, x2, y, 4, 6);

const frqs = [];

// ── 1. Mathematical Routines (modeled on 2025 Q1: fields of long straight wires and Lenz's law) ──
frqs.push({
  id: 'phys2-mr-parallel-wires', questionNumber: 1, title: 'Two Current-Carrying Wires', topic: 'Mathematical Routines · Magnetic fields of wires and induced current',
  modeledOn: modeled(2025, 1, 'Mathematical Routines'), timeAllottedMin: 25,
  prompt: String.raw`Two long, straight, parallel wires lie in the plane of the page along the \(x\)-direction, as shown in Figure 1. Wire P lies along \(y = 0\) and carries current \(I\) in the \(+x\)-direction. Wire Q lies along \(y = 3d\) and carries current \(3I\), also in the \(+x\)-direction. A small square conducting loop lies in the plane of the page below Wire P.`,
  figures: [fig('Figure 1', draw(420, 220, 'Two horizontal wires in the plane of the page. Wire P at y = 0 carries current I to the right. Wire Q at y = 3d carries current 3I to the right. A small square loop lies below Wire P and moves upward toward the wires', [
    ['line', 20, 60, 400, 60, { width: 2.4 }], ['arrow', 330, 48, 380, 48], text(355, 40, '3I', { italic: true }), text(14, 64, 'Q', { bold: true, anchor: 'end' }),
    ['line', 20, 150, 400, 150, { width: 2.4 }], ['arrow', 330, 138, 380, 138], text(355, 130, 'I', { italic: true }), text(14, 154, 'P', { bold: true, anchor: 'end' }),
    ['line', 60, 60, 60, 150, { dash: true, width: 1 }], text(70, 110, '3d', { italic: true, anchor: 'start' }),
    ['rect', 180, 172, 34, 34], ['arrow', 230, 200, 230, 172, { color: PINK }], text(240, 190, 'v', { italic: true, anchor: 'start' }), text(197, 218, 'loop', { size: 10 }),
  ]))],
  parts: [
    part('A (i)', String.raw`Indicate the direction of the magnetic field produced by Wire P at a point midway between the wires, and the direction of the magnetic force exerted on Wire Q by Wire P.`, [
      pt('phys2-mr-parallel-wires-a1', 'representation', 'Indicates that the field from Wire P at a point above Wire P is directed out of the page.', ['indicates into the page', 'indicates a direction parallel to the wire'], 'Out of the page.', 'Into the page.'),
      pt('phys2-mr-parallel-wires-a2', 'representation', String.raw`Indicates that the force on Wire Q is in the \(-y\)-direction (toward Wire P), or a direction consistent with the field indicated.`, ['indicates repulsion for parallel currents'], String.raw`Toward Wire P, in the \(-y\)-direction.`, String.raw`Away from Wire P, in the \(+y\)-direction.`),
    ]),
    part('A (ii)', String.raw`Derive an expression for the \(y\)-coordinate of the point between the wires at which the net magnetic field due to the two wires is zero. Express your answer in terms of \(d\). Begin your derivation by writing a fundamental physics principle or an equation from the reference information.`, [
      pt('phys2-mr-parallel-wires-a3', 'derivation', String.raw`Begins a multistep derivation with \(B = \dfrac{\mu_0 I}{2\pi r}\) (or an equivalent relevant equation).`, ['uses the field of a solenoid or loop'], String.raw`\(B = \dfrac{\mu_0 I}{2\pi r}\).`, String.raw`\(B = \mu_0 n I\).`),
      pt('phys2-mr-parallel-wires-a4', 'derivation', String.raw`Writes the field of Wire P at the point as \(\dfrac{\mu_0 I}{2\pi y}\).`, ['uses the distance from Wire Q'], String.raw`\(B_P = \dfrac{\mu_0 I}{2\pi y}\).`, String.raw`\(B_P = \dfrac{\mu_0 I}{2\pi (3d)}\).`),
      pt('phys2-mr-parallel-wires-a5', 'derivation', String.raw`Writes the field of Wire Q at the point with current \(3I\) and distance \(3d - y\).`, ['uses I instead of 3I', 'uses distance y for both wires'], String.raw`\(B_Q = \dfrac{\mu_0 (3I)}{2\pi (3d - y)}\).`, String.raw`\(B_Q = \dfrac{\mu_0 I}{2\pi (3d - y)}\).`),
      pt('phys2-mr-parallel-wires-a6', 'derivation', 'Sets the magnitudes of the two fields equal, consistent with the expressions written.', ['adds the fields and sets the sum to zero with both positive'], String.raw`\(\dfrac{\mu_0 I}{2\pi y} = \dfrac{3\mu_0 I}{2\pi (3d - y)}\).`, String.raw`\(B_P + B_Q = 0\) with both written as positive.`),
      pt('phys2-mr-parallel-wires-a7', 'calculation', String.raw`Arrives at \(y = \tfrac{3}{4}d\).`, ['solves to 3d/2 (the midpoint)', 'algebra error giving 9d/4'], String.raw`\(3d - y = 3y \Rightarrow y = \tfrac{3}{4}d\).`, String.raw`\(y = \tfrac{3}{2}d\).`),
    ]),
    part('B', 'The loop now moves at constant speed toward Wire P while staying below it. Indicate whether the induced current in the loop is clockwise or counterclockwise. Justify your answer.', [
      pt('phys2-mr-parallel-wires-b1', 'justification', 'Indicates counterclockwise.', ['indicates clockwise'], 'Counterclockwise.', 'Clockwise.'),
      pt('phys2-mr-parallel-wires-b2', 'justification', 'States that the field from both wires is directed into the page at the loop (below Wire P).', ['states the field is out of the page below the wires'], 'Below Wire P, both wires produce a field into the page.', 'The field is out of the page.'),
      pt('phys2-mr-parallel-wires-b3', 'justification', 'Applies Lenz’s law: the flux into the page increases as the loop approaches, so the induced current makes a field out of the page inside the loop.', ['says the induced field matches the change instead of opposing it'], 'The flux into the page grows, so the induced current produces a field out of the page, which requires a counterclockwise current.', 'The current opposes the motion.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) Out of the page; the force on Wire Q is toward Wire P (\(-y\)). (ii) \(B = \dfrac{\mu_0 I}{2\pi r}\). At \(y\), \(B_P = \dfrac{\mu_0 I}{2\pi y}\) and \(B_Q = \dfrac{\mu_0 (3I)}{2\pi (3d - y)}\), in opposite directions. Setting them equal: \(3d - y = 3y\), so \(y = \tfrac{3}{4}d\). B Counterclockwise. Below Wire P both fields point into the page, and the flux into the page increases as the loop approaches. By Lenz's law the induced current creates a field out of the page inside the loop, which is counterclockwise.`,
});

// ── 2. Translation Between Representations (modeled on 2025 Q2: gas under a piston) ──
frqs.push({
  id: 'phys2-tbr-spring-piston', questionNumber: 2, title: 'Gas Held by a Spring-Loaded Piston', topic: 'Translation Between Representations · Ideal gases, forces, and PV diagrams',
  modeledOn: modeled(2025, 2, 'Translation Between Representations'), timeAllottedMin: 30,
  prompt: String.raw`A horizontal cylinder contains \(n\) moles of an ideal monatomic gas sealed by a frictionless piston of cross-sectional area \(A\). The right side of the piston is open to the atmosphere, which has pressure \(P_{\text{atm}}\). A spring of spring constant \(k\) connects the piston to a fixed wall and is compressed a distance \(x_0\) from its relaxed length, as shown in Figure 1. The piston is in equilibrium and the gas occupies volume \(V_0\).`,
  figures: [fig('Figure 1', draw(420, 140, 'A horizontal cylinder holding gas on the left is sealed by a piston. To the right of the piston, a compressed spring connects the piston to a fixed wall; the right side of the piston is open to the atmosphere', [
    ['line', 20, 30, 260, 30, { width: 2.4 }], ['line', 20, 110, 260, 110, { width: 2.4 }], ['line', 20, 30, 20, 110, { width: 2.4 }], text(90, 75, 'gas', { size: 12 }),
    ...[45, 60, 85, 100].map(y => ['circle', 60 + (y % 30), y, 2, { fill: 'currentColor' }]),
    ['rect', 160, 30, 14, 80, { fill: true }], spring(174, 380, 70, 9), ['hatch', 380, 120, 380, 20], text(270, 130, 'atmosphere', { size: 10 }),
  ]))],
  parts: [
    part('A', 'The dot below represents the piston. Draw and label arrows representing the horizontal forces exerted on the piston. Each force must be represented by a distinct arrow starting on the dot and pointing in the direction of the force.', [
      pt('phys2-tbr-spring-piston-a1', 'representation', 'Draws an arrow to the right labeled as the force exerted by the gas.', ['draws the gas force to the left'], 'F_gas pointing right.', 'F_gas pointing left.'),
      pt('phys2-tbr-spring-piston-a2', 'representation', 'Draws an arrow to the left labeled as the force exerted by the atmosphere.', ['omits the atmosphere'], 'F_atm pointing left.', 'No atmospheric force.'),
      pt('phys2-tbr-spring-piston-a3', 'representation', 'Draws an arrow to the left labeled as the force exerted by the spring (the compressed spring pushes the piston toward the gas).', ['draws the spring force to the right'], 'F_spring pointing left.', 'F_spring pointing right.'),
    ]),
    part('B', String.raw`Derive an expression for the temperature \(T_0\) of the gas in terms of \(P_{\text{atm}}\), \(k\), \(x_0\), \(A\), \(V_0\), \(n\), and physical constants, as appropriate.`, [
      pt('phys2-tbr-spring-piston-b1', 'derivation', String.raw`Begins a multistep derivation with \(\Sigma F = 0\), \(P = F/A\), \(PV = nRT\), or an equivalent relevant equation.`, ['starts with the first law of thermodynamics only'], String.raw`\(\Sigma F = 0\) and \(PV = nRT\).`, String.raw`\(\Delta U = Q - W\).`),
      pt('phys2-tbr-spring-piston-b2', 'derivation', String.raw`Writes the force balance on the piston: \(PA = P_{\text{atm}}A + kx_0\).`, ['omits the spring force', 'puts the spring force on the gas side'], String.raw`\(PA - P_{\text{atm}}A - kx_0 = 0\).`, String.raw`\(PA = P_{\text{atm}}A\).`),
      pt('phys2-tbr-spring-piston-b3', 'derivation', String.raw`Writes the gas pressure as \(P = P_{\text{atm}} + \dfrac{kx_0}{A}\) (or one consistent with the diagram in part A).`, ['multiplies kx0 by A'], String.raw`\(P = P_{\text{atm}} + \dfrac{kx_0}{A}\).`, String.raw`\(P = P_{\text{atm}} + kx_0 A\).`),
      pt('phys2-tbr-spring-piston-b4', 'derivation', String.raw`Arrives at \(T_0 = \dfrac{\left(P_{\text{atm}} + \frac{kx_0}{A}\right)V_0}{nR}\), consistent with the pressure found.`, ['uses Boltzmann’s constant with moles'], String.raw`\(T_0 = \dfrac{(P_{\text{atm}}A + kx_0)V_0}{nRA}\).`, String.raw`\(T_0 = \dfrac{P_{\text{atm}}V_0}{nR}\).`),
    ]),
    part('C', 'The gas is now heated slowly, so the piston moves to the right and compresses the spring further. On axes of pressure P versus volume V, sketch a graph of the process. Include an arrow showing the direction of the process.', [
      pt('phys2-tbr-spring-piston-c1', 'representation', 'Draws a graph in which both pressure and volume increase (from lower left toward upper right).', ['draws an isobar', 'draws pressure decreasing'], 'A line rising to the right.', 'A horizontal line.'),
      pt('phys2-tbr-spring-piston-c2', 'representation', 'Draws the graph as a straight line, because the spring force (and so the pressure) increases linearly with displacement and therefore with volume.', ['draws a curve'], 'A straight sloped line.', 'A concave-up curve.'),
      pt('phys2-tbr-spring-piston-c3', 'representation', 'Draws an arrow pointing toward greater volume.', ['arrow toward smaller volume'], 'Arrow pointing up and to the right.', 'Arrow pointing down and to the left.'),
    ]),
    part('D', 'Indicate whether the internal energy of the gas at the end of the heating process is greater than, less than, or equal to its initial internal energy. Justify your answer using your graph from part C or your derivation in part B.', [
      pt('phys2-tbr-spring-piston-d1', 'justification', 'Indicates that the internal energy is greater (or an answer consistent with an incorrect graph or derivation).', ['indicates equal because the process is slow'], 'Greater.', 'Equal.'),
      pt('phys2-tbr-spring-piston-d2', 'justification', 'Justifies that both P and V increase, so the product PV, and therefore the temperature and internal energy of an ideal gas, increase.', ['refers only to heat being added'], 'Both P and V increase, so PV = nRT increases; T rises, and U = (3/2)nRT increases.', 'Heat was added, so it has more energy.'),
    ]),
  ],
  sampleResponse: String.raw`A Gas force to the right; atmospheric force and spring force to the left. B \(\Sigma F = 0\): \(PA - P_{\text{atm}}A - kx_0 = 0\), so \(P = P_{\text{atm}} + \dfrac{kx_0}{A}\). With \(PV_0 = nRT_0\), \(T_0 = \dfrac{\left(P_{\text{atm}} + \frac{kx_0}{A}\right)V_0}{nR}\). C A straight line rising up and to the right with an arrow toward greater volume, since \(P = P_{\text{atm}} + k(x_0 + \Delta V/A)/A\) increases linearly with \(V\). D Greater: both \(P\) and \(V\) increase, so \(PV = nRT\) increases, the temperature rises, and \(U = \tfrac{3}{2}nRT\) increases.`,
});

// ── 3. Experimental Design and Analysis (modeled on 2025 Q3: determining a circuit quantity from a linear graph) ──
const batRows = [['0.20', '8.62'], ['0.40', '8.21'], ['0.60', '7.83'], ['0.80', '7.38'], ['1.00', '7.02']];
frqs.push({
  id: 'phys2-lab-internal-resistance', questionNumber: 3, title: 'Internal Resistance of a Battery', topic: 'Experimental Design and Analysis · Terminal voltage and linear graphs',
  modeledOn: modeled(2025, 3, 'Experimental Design and Analysis'), timeAllottedMin: 25,
  prompt: String.raw`A battery has an unknown emf \(\mathcal{E}\) and an unknown internal resistance \(r\). Students have the battery, a variable resistor, an ammeter, a voltmeter, a switch, and connecting wires. They want to determine \(r\).`,
  parts: [
    part('A', 'Describe a procedure the students could use to collect data that would allow them to determine r using a linear graph. Include how each meter is connected and a method to reduce experimental uncertainty.', [
      pt('phys2-lab-internal-resistance-a1', 'experimental-design', 'Describes connecting the variable resistor across the battery with the ammeter in series and the voltmeter across the battery terminals, then measuring current and terminal voltage for several resistor settings.', ['connects the ammeter in parallel', 'measures only one setting'], 'Set the variable resistor to five values; for each, record the ammeter current and the voltmeter reading across the battery terminals.', 'Measure the battery voltage with nothing connected.'),
      pt('phys2-lab-internal-resistance-a2', 'experimental-design', 'Describes a valid way to reduce uncertainty, such as repeating readings, using many resistor settings, or closing the switch only briefly so the battery does not heat up.', ['vague statement only'], 'Repeat each reading three times and average, opening the switch between readings.', 'Be careful.'),
    ]),
    part('B', String.raw`Using \(\Delta V_{\text{terminal}} = \mathcal{E} - Ir\), indicate quantities that could be graphed to produce a linear graph and describe how \(r\) could be found from the graph.`, [
      pt('phys2-lab-internal-resistance-b1', 'data-analysis', 'Indicates terminal voltage versus current (or an equivalent linear pair).', ['graphs voltage versus resistance'], 'Terminal voltage on the vertical axis, current on the horizontal axis.', 'Voltage versus resistor setting.'),
      pt('phys2-lab-internal-resistance-b2', 'data-analysis', String.raw`States that the slope of terminal voltage versus current is \(-r\) (so \(r\) is the magnitude of the slope).`, ['states the slope equals the emf'], String.raw`Slope \(= -r\); the vertical intercept is \(\mathcal{E}\).`, 'The slope is the emf.'),
    ]),
    part('C', String.raw`The students' data are shown in Table 1. (i) Label the axes of a graph with the quantities and units from part B. (ii) Plot the data using a linear scale. (iii) Draw a best-fit line.`, [
      pt('phys2-lab-internal-resistance-c1', 'data-analysis', 'Labels the axes with terminal voltage (V) and current (A).', ['omits units'], 'Vertical: ΔV (V); horizontal: I (A).', 'Unlabeled axes.'),
      pt('phys2-lab-internal-resistance-c2', 'data-analysis', 'Uses linear scales on both axes.', ['uneven scale'], 'Ticks every 0.5 V and every 0.2 A.', 'Ticks at each data value.'),
      pt('phys2-lab-internal-resistance-c3', 'data-analysis', 'Plots all five points correctly.', ['misplots two or more points'], 'Five points falling along a line from (0.20, 8.62) to (1.00, 7.02).', 'Points plotted with axes swapped and unlabeled.'),
      pt('phys2-lab-internal-resistance-c4', 'data-analysis', 'Draws a straight best-fit line with negative slope.', ['connects the dots'], 'One straight line sloping downward.', 'A zigzag.'),
    ], [tableFigure('Table 1', ['Current I (A)', 'Terminal voltage ΔV (V)'], batRows)]),
    part('D', String.raw`Using the best-fit line, calculate an experimental value for \(r\).`, [
      pt('phys2-lab-internal-resistance-d1', 'data-analysis', 'Relates the slope of the best-fit line to r, consistent with the graph.', ['uses ΔV/I for a single point'], String.raw`\(r = -\text{slope}\).`, String.raw`\(r = 7.02/1.00\).`),
      pt('phys2-lab-internal-resistance-d2', 'calculation', String.raw`Reports \(r\) between about \(1.8\) and \(2.2\ \Omega\).`, ['reports about 7 Ω from a single point'], String.raw`Slope \(\approx \dfrac{7.02 - 8.62}{1.00 - 0.20} = -2.0\ \text{V/A}\), so \(r \approx 2.0\ \Omega\).`, String.raw`\(r \approx 7.0\ \Omega\).`),
    ]),
  ],
  sampleResponse: String.raw`A Connect the battery, switch, ammeter, and variable resistor in series, with the voltmeter across the battery terminals. For five resistor settings, close the switch briefly and record \(I\) and \(\Delta V\); repeat each reading three times and average. B Graph \(\Delta V\) versus \(I\). Because \(\Delta V = \mathcal{E} - Ir\), the slope is \(-r\) and the intercept is \(\mathcal{E}\). C \(\Delta V\) (V) versus \(I\) (A) on linear scales, five points, and a straight best-fit line sloping down. D Slope \(\approx (7.02 - 8.62)/(1.00 - 0.20) = -2.0\ \text{V/A}\), so \(r \approx 2.0\ \Omega\).`,
});

// ── 4. Qualitative/Quantitative Translation (modeled on 2025 Q4: interference pattern spacing) ──
frqs.push({
  id: 'phys2-qqt-grating', questionNumber: 4, title: 'Diffraction Grating Line Density', topic: 'Qualitative/Quantitative Translation · Interference from a grating',
  modeledOn: modeled(2025, 4, 'Qualitative/Quantitative Translation'), timeAllottedMin: 20,
  prompt: String.raw`Laser light of wavelength \(\lambda\) passes through a diffraction grating that has \(N\) lines per meter and falls on a screen a distance \(L\) away, producing bright spots. The angles to the first-order spots are small. A student replaces the grating with one that has more lines per meter, keeping the laser and screen the same.`,
  figures: [fig('Figure 1', draw(420, 150, 'A laser beam passes through a diffraction grating and produces a central bright spot and first-order spots on a screen a distance L away', [
    ['rect', 20, 65, 50, 20, { fill: true }], text(45, 100, 'laser', { size: 10 }), ['line', 70, 75, 150, 75, { color: PINK, width: 2 }], ['line', 150, 20, 150, 130, { width: 2.4, dash: true }], text(150, 145, 'grating', { size: 10 }),
    ['line', 150, 75, 380, 75, { color: PINK, width: 1 }], ['line', 150, 75, 380, 35, { color: PINK, width: 1 }], ['line', 150, 75, 380, 115, { color: PINK, width: 1 }], ['line', 380, 15, 380, 135, { width: 3 }],
    ...[35, 75, 115].map(y => ['circle', 380, y, 4, { fill: PINK, color: PINK }]), ['line', 150, 140, 380, 140], text(265, 136, 'L', { italic: true }),
  ]))],
  parts: [
    part('A', 'A student claims that the first-order spots will be farther from the central spot with the new grating. Indicate whether the claim is correct. Justify your answer using qualitative reasoning beyond referencing equations.', [
      pt('phys2-qqt-grating-a1', 'justification', 'Indicates that the claim is correct (or an indication consistent with the justification).', ['indicates the spots move closer'], 'Correct.', 'Incorrect; the spots move closer.'),
      pt('phys2-qqt-grating-a2', 'justification', 'States that more lines per meter means the slits are closer together (smaller slit spacing).', ['says more lines means wider slits'], 'More lines per meter puts the slits closer together.', 'More lines block more light.'),
      pt('phys2-qqt-grating-a3', 'justification', 'Explains that with closer slits, a larger angle is needed for the path difference between neighboring slits to equal one wavelength, so the first-order spot is farther from the center.', ['does not connect spacing to path difference or angle'], 'With closer slits, the path difference grows more slowly with angle, so constructive interference needs a larger angle.', 'The pattern spreads out.'),
    ]),
    part('B', String.raw`Derive an expression for the distance \(\Delta y\) between the two first-order bright spots (one on each side of the center) in terms of \(\lambda\), \(L\), \(N\), and physical constants, as appropriate.`, [
      pt('phys2-qqt-grating-b1', 'derivation', String.raw`Begins with \(d\sin\theta = m\lambda\) and the small-angle relation \(\sin\theta \approx y/L\) (or equivalent).`, ['uses the single-slit minimum condition'], String.raw`\(d\sin\theta = m\lambda\), \(\sin\theta \approx \dfrac{y}{L}\).`, String.raw`\(a\sin\theta = m\lambda\) for a dark band.`),
      pt('phys2-qqt-grating-b2', 'derivation', String.raw`Substitutes \(d = \dfrac{1}{N}\).`, ['uses d = N'], String.raw`\(d = \dfrac{1}{N}\).`, String.raw`\(d = N\).`),
      pt('phys2-qqt-grating-b3', 'derivation', String.raw`Arrives at \(\Delta y = 2\lambda L N\) (twice the first-order distance).`, ['forgets the factor of 2 for both sides'], String.raw`\(y_1 = \lambda L N\), so \(\Delta y = 2\lambda L N\).`, String.raw`\(\Delta y = \lambda L N\).`),
    ]),
    part('C', 'Indicate whether your expression in part B is or is not consistent with your answer in part A. Justify by referencing the expression.', [
      pt('phys2-qqt-grating-c1', 'justification', 'Correctly indicates consistency (or inconsistency with an incorrect part A).', ['claims consistency when the expression contradicts part A'], 'Consistent.', 'Not consistent.'),
      pt('phys2-qqt-grating-c2', 'justification', String.raw`Uses the functional dependence \(\Delta y \propto N\): more lines per meter gives a larger spacing.`, ['restates part A without the expression'], String.raw`Since \(\Delta y = 2\lambda L N\), increasing \(N\) increases \(\Delta y\).`, 'They agree.'),
    ]),
  ],
  sampleResponse: String.raw`A Correct. More lines per meter means the slits are closer together. For first-order constructive interference, the path difference between neighboring slits must equal one wavelength; with closer slits this requires a larger angle, so the first-order spots land farther from the center. B \(d\sin\theta = m\lambda\) with \(m = 1\) and \(\sin\theta \approx y/L\): \(y_1 = \dfrac{\lambda L}{d} = \lambda L N\). The spots on both sides are separated by \(\Delta y = 2\lambda L N\). C Consistent: \(\Delta y \propto N\), so a grating with more lines per meter spreads the spots farther apart.`,
});

// ── 5. Mathematical Routines (modeled on 2026 Q1: ideal gas and energy transfer) ──
frqs.push({
  id: 'phys2-mr-rigid-tank', questionNumber: 1, title: 'Heating Gas in a Rigid Tank', topic: 'Mathematical Routines · Ideal gas law and the first law of thermodynamics',
  modeledOn: modeled(2026, 1, 'Mathematical Routines'), timeAllottedMin: 25,
  prompt: String.raw`A rigid, sealed tank of volume \(V\) contains \(n\) moles of an ideal monatomic gas at pressure \(P_0\). An electric heater inside the tank delivers energy to the gas at a constant rate \(\mathcal{P}\) (in watts). Energy losses to the surroundings are negligible.`,
  parts: [
    part('A (i)', 'On axes of gas pressure P versus absolute temperature T, sketch the graph as the gas is heated, extended back toward T = 0.', [
      pt('phys2-mr-rigid-tank-a1', 'representation', 'Sketches a straight line with positive slope.', ['draws a curve', 'draws pressure decreasing'], 'A straight increasing line.', 'A concave-up curve.'),
      pt('phys2-mr-rigid-tank-a2', 'representation', 'Shows the line (or its extension) passing through the origin.', ['draws a nonzero intercept'], 'The extended line passes through (0, 0).', 'The line meets the P axis above zero.'),
    ]),
    part('A (ii)', String.raw`Derive an expression for the energy \(Q\) that must be delivered to raise the pressure from \(P_0\) to \(2P_0\), in terms of \(P_0\), \(V\), and physical constants, as appropriate.`, [
      pt('phys2-mr-rigid-tank-a3', 'derivation', String.raw`Begins with the first law, \(\Delta U = Q + W\) (or \(Q - W\) by convention), and \(U = \tfrac{3}{2}nRT\).`, ['uses Q = mcΔT with no specific heat given'], String.raw`\(\Delta U = Q + W\) and \(U = \tfrac{3}{2}nRT\).`, String.raw`\(Q = mc\Delta T\).`),
      pt('phys2-mr-rigid-tank-a4', 'derivation', String.raw`States that \(W = 0\) because the volume is constant, so \(Q = \Delta U\).`, ['includes work done by the gas'], String.raw`Rigid tank: \(W = 0\), so \(Q = \Delta U\).`, String.raw`\(W = P\Delta V = P_0 V\).`),
      pt('phys2-mr-rigid-tank-a5', 'derivation', String.raw`Uses \(nR\Delta T = V\Delta P\) to reach \(Q = \tfrac{3}{2}P_0 V\).`, ['uses ΔU = (3/2)PV with P = 2P0'], String.raw`\(Q = \tfrac{3}{2}nR\Delta T = \tfrac{3}{2}V(2P_0 - P_0) = \tfrac{3}{2}P_0 V\).`, String.raw`\(Q = 3P_0V\).`),
    ]),
    part('A (iii)', String.raw`Derive an expression for the time \(t\) the heater must run to cause this change, in terms of \(P_0\), \(V\), \(\mathcal{P}\), and physical constants, as appropriate.`, [
      pt('phys2-mr-rigid-tank-a6', 'derivation', String.raw`Uses power as energy per time, \(\mathcal{P} = \dfrac{Q}{t}\).`, ['multiplies power by energy'], String.raw`\(\mathcal{P} = \dfrac{Q}{t}\).`, String.raw`\(t = \mathcal{P}Q\).`),
      pt('phys2-mr-rigid-tank-a7', 'derivation', String.raw`Arrives at \(t = \dfrac{3P_0V}{2\mathcal{P}}\), consistent with part A (ii).`, ['inverts the ratio'], String.raw`\(t = \dfrac{3P_0V}{2\mathcal{P}}\).`, String.raw`\(t = \dfrac{2\mathcal{P}}{3P_0V}\).`),
    ]),
    part('B', 'A second identical tank holds twice as many moles of the same gas at the same initial temperature. The same amount of energy is delivered to each tank. Indicate which tank has the greater temperature increase, or whether they are equal. Justify your answer.', [
      pt('phys2-mr-rigid-tank-b1', 'justification', 'Indicates that the first tank (fewer moles) has the greater temperature increase.', ['indicates equal increases'], 'The first tank.', 'They are equal.'),
      pt('phys2-mr-rigid-tank-b2', 'justification', 'States that both tanks receive the same energy and do no work, so each has the same change in internal energy.', ['ignores that the energy is the same'], 'Both gain the same internal energy because Q is the same and W = 0.', 'The second tank gets more energy.'),
      pt('phys2-mr-rigid-tank-b3', 'justification', String.raw`Uses the functional dependence \(\Delta T = \dfrac{2\Delta U}{3nR}\): with twice the moles, the same energy produces half the temperature change.`, ['says more gas heats faster'], 'The same energy is shared among twice as many atoms, so the average kinetic energy, and the temperature, rises half as much.', 'More gas means more heat.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) A straight line through the origin with positive slope, since \(P = \dfrac{nR}{V}T\). (ii) \(\Delta U = Q + W\) with \(W = 0\) for a rigid tank, so \(Q = \Delta U = \tfrac{3}{2}nR\Delta T = \tfrac{3}{2}V\Delta P = \tfrac{3}{2}V(2P_0 - P_0) = \tfrac{3}{2}P_0V\). (iii) \(t = \dfrac{Q}{\mathcal{P}} = \dfrac{3P_0V}{2\mathcal{P}}\). B The first tank. Both tanks receive the same energy and do no work, so \(\Delta U\) is the same. Since \(\Delta T = \dfrac{2\Delta U}{3nR}\), twice the moles gives half the temperature change.`,
});

// ── 6. Translation Between Representations (modeled on 2026 Q2: photon energy representations) ──
frqs.push({
  id: 'phys2-tbr-photoelectric', questionNumber: 2, title: 'Photoelectric Effect Graphs', topic: 'Translation Between Representations · Photons and the photoelectric effect',
  modeledOn: modeled(2026, 2, 'Translation Between Representations'), timeAllottedMin: 30,
  prompt: String.raw`Light of adjustable frequency \(f\) shines on a clean metal plate X in a vacuum tube. Metal X has work function \(\phi\). Electrons emitted from the plate are collected, and their maximum kinetic energy \(K_{\max}\) is determined from the stopping potential \(V_s\).`,
  parts: [
    part('A', String.raw`On axes of \(K_{\max}\) versus \(f\), sketch a graph for metal X. Label the threshold frequency \(f_0\).`, [
      pt('phys2-tbr-photoelectric-a1', 'representation', String.raw`Shows no emitted electrons (\(K_{\max} = 0\) or no line) for frequencies below \(f_0\).`, ['extends the line below the axis as measured data'], 'Zero below f0.', 'A line through the origin.'),
      pt('phys2-tbr-photoelectric-a2', 'representation', String.raw`Draws a straight line with positive slope starting at \(f_0\).`, ['draws a curve'], 'A straight rising line starting at f0.', 'A curve that levels off.'),
      pt('phys2-tbr-photoelectric-a3', 'representation', String.raw`Labels \(f_0\) on the horizontal axis and identifies the slope as \(h\) (or \(f_0 = \phi/h\)).`, ['labels f0 at the origin'], String.raw`Marks \(f_0 = \phi/h\); slope \(h\).`, 'No labels.'),
    ]),
    part('B', String.raw`Derive an expression for the stopping potential \(V_s\) when light of wavelength \(\lambda\) shines on metal X, in terms of \(\lambda\), \(\phi\), and physical constants, as appropriate.`, [
      pt('phys2-tbr-photoelectric-b1', 'derivation', String.raw`Begins with \(E = hf\) and \(K_{\max} = hf - \phi\).`, ['adds the work function'], String.raw`\(K_{\max} = hf - \phi\).`, String.raw`\(K_{\max} = hf + \phi\).`),
      pt('phys2-tbr-photoelectric-b2', 'derivation', String.raw`Substitutes \(f = \dfrac{c}{\lambda}\).`, ['uses f = λ/c'], String.raw`\(K_{\max} = \dfrac{hc}{\lambda} - \phi\).`, String.raw`\(K_{\max} = \dfrac{h\lambda}{c} - \phi\).`),
      pt('phys2-tbr-photoelectric-b3', 'derivation', String.raw`Relates the stopping potential to the kinetic energy, \(eV_s = K_{\max}\).`, ['sets V_s = K_max'], String.raw`\(eV_s = K_{\max}\).`, String.raw`\(V_s = K_{\max}\).`),
      pt('phys2-tbr-photoelectric-b4', 'derivation', String.raw`Arrives at \(V_s = \dfrac{1}{e}\left(\dfrac{hc}{\lambda} - \phi\right)\).`, ['drops e'], String.raw`\(V_s = \dfrac{hc/\lambda - \phi}{e}\).`, String.raw`\(V_s = \dfrac{hc}{\lambda} - \phi\).`),
    ]),
    part('C', String.raw`Metal Y has a work function of \(2\phi\). On the same axes as part A, sketch and label a graph for metal Y.`, [
      pt('phys2-tbr-photoelectric-c1', 'representation', 'Draws metal Y’s line parallel to metal X’s (same slope h).', ['draws a steeper line'], 'A parallel line.', 'A line twice as steep.'),
      pt('phys2-tbr-photoelectric-c2', 'representation', String.raw`Places metal Y's threshold at \(2f_0\).`, ['places the threshold at f0/2'], String.raw`Threshold at \(2f_0\).`, String.raw`Threshold at \(f_0/2\).`),
      pt('phys2-tbr-photoelectric-c3', 'representation', 'Shows metal Y’s line below metal X’s at every frequency where both emit.', ['crosses the lines'], 'Y’s line lies below X’s by φ everywhere.', 'The lines cross.'),
    ]),
    part('D', String.raw`A student claims that light with frequency \(0.8f_0\) will eject electrons from metal X if its intensity is made large enough. Indicate whether the claim is correct and justify your answer using a representation from part A or B.`, [
      pt('phys2-tbr-photoelectric-d1', 'justification', 'Indicates that the claim is incorrect.', ['agrees with the claim'], 'Incorrect.', 'Correct.'),
      pt('phys2-tbr-photoelectric-d2', 'justification', 'Justifies that each photon’s energy hf depends only on frequency and is less than φ below f0, so no electrons are emitted regardless of intensity (consistent with the graph’s zero region).', ['says more photons combine their energy'], 'Each photon carries h(0.8f0) < φ; intensity adds photons but not energy per photon, so the graph stays at zero below f0.', 'Brighter light has more energy.'),
    ]),
  ],
  sampleResponse: String.raw`A Zero below \(f_0\), then a straight line of slope \(h\) starting at \(f_0 = \phi/h\). B \(K_{\max} = hf - \phi = \dfrac{hc}{\lambda} - \phi\), and \(eV_s = K_{\max}\), so \(V_s = \dfrac{1}{e}\left(\dfrac{hc}{\lambda} - \phi\right)\). C A line parallel to X's, starting at \(2f_0\) and lying below X's line. D Incorrect: each photon has energy \(h(0.8f_0) < \phi\), and intensity changes only the number of photons, so no electrons are emitted.`,
});

// ── 7. Experimental Design and Analysis (modeled on 2026 Q3: determining a constant from a linearized graph) ──
const snellRows = [['10', '6.5'], ['20', '13.4'], ['30', '19.3'], ['40', '25.6'], ['50', '30.5']];
frqs.push({
  id: 'phys2-lab-refraction', questionNumber: 3, title: 'Index of Refraction of a Block', topic: 'Experimental Design and Analysis · Refraction and Snell’s law',
  modeledOn: modeled(2026, 3, 'Experimental Design and Analysis'), timeAllottedMin: 25,
  prompt: String.raw`Students want to determine the index of refraction \(n\) of a rectangular plastic block. They have a ray box that produces a narrow beam of light, a protractor, a sheet of paper, and a pencil. The index of refraction of air is 1.00.`,
  figures: [fig('Figure 1', draw(320, 200, 'A narrow light ray in air strikes the top surface of a plastic block at an incident angle measured from the normal, and bends toward the normal inside the block', [
    ['rect', 60, 100, 200, 80, { fill: true }], ['line', 160, 30, 160, 190, { dash: true, width: 1 }], ['line', 90, 30, 160, 100, { color: PINK, width: 2 }], ['line', 160, 100, 200, 180, { color: PINK, width: 2 }],
    text(140, 60, 'θ₁', { italic: true }), text(175, 140, 'θ₂', { italic: true }), text(70, 120, 'block', { size: 10, anchor: 'start' }), text(40, 70, 'air', { size: 10 }),
  ]))],
  parts: [
    part('A', '(i) Indicate the quantities the students should measure. (ii) Describe a method to reduce experimental uncertainty.', [
      pt('phys2-lab-refraction-a1', 'experimental-design', 'Indicates measuring the angle of incidence and the angle of refraction, both from the normal, for several incident angles.', ['measures angles from the surface without converting', 'measures one angle only'], 'Measure θ₁ in air and θ₂ in the block, from the normal, for several beams.', 'Measure the speed of light.'),
      pt('phys2-lab-refraction-a2', 'experimental-design', 'Describes a valid method to reduce uncertainty, such as using many incident angles, marking the rays with several dots before measuring, or repeating each angle.', ['vague statement only'], 'Trace each ray with several dots, use five angles, and repeat each twice.', 'Be careful.'),
    ]),
    part('B', '(i) Indicate quantities that could be graphed to produce a linear graph. (ii) Describe how n can be found from the graph.', [
      pt('phys2-lab-refraction-b1', 'data-analysis', String.raw`Indicates \(\sin\theta_1\) versus \(\sin\theta_2\) (or the reverse).`, ['graphs the angles themselves'], String.raw`\(\sin\theta_1\) vertical, \(\sin\theta_2\) horizontal.`, String.raw`\(\theta_1\) versus \(\theta_2\).`),
      pt('phys2-lab-refraction-b2', 'data-analysis', String.raw`States that the slope of \(\sin\theta_1\) versus \(\sin\theta_2\) equals \(n\) (or \(1/n\) for the reverse).`, ['says the slope is 1/n for sin θ1 versus sin θ2'], String.raw`From \(1.00\sin\theta_1 = n\sin\theta_2\), the slope is \(n\).`, String.raw`The slope is \(1/n\).`),
    ]),
    part('C', String.raw`The data are shown in Table 1. (i) Label the axes with the quantities from part B. (ii) Plot the calculated values on linear scales. (iii) Draw a best-fit line.`, [
      pt('phys2-lab-refraction-c1', 'data-analysis', String.raw`Labels the axes with \(\sin\theta_1\) and \(\sin\theta_2\) (unitless).`, ['labels the axes with degrees'], String.raw`Vertical: \(\sin\theta_1\); horizontal: \(\sin\theta_2\).`, String.raw`Vertical: \(\theta_1\) (°).`),
      pt('phys2-lab-refraction-c2', 'data-analysis', 'Uses linear scales on both axes.', ['uneven scale'], 'Ticks every 0.1 on both axes.', 'Uneven ticks.'),
      pt('phys2-lab-refraction-c3', 'data-analysis', String.raw`Plots correctly calculated points (about (0.113, 0.174), (0.232, 0.342), (0.330, 0.500), (0.432, 0.643), (0.508, 0.766)).`, ['plots degrees', 'calculator in radian mode'], 'Five correctly calculated points.', 'Points from radian-mode sines.'),
      pt('phys2-lab-refraction-c4', 'data-analysis', 'Draws a straight best-fit line.', ['connects the dots'], 'A straight line close to all points.', 'A zigzag.'),
    ], [tableFigure('Table 1', ['Angle of incidence θ₁ (°)', 'Angle of refraction θ₂ (°)'], snellRows)]),
    part('D', String.raw`Using the best-fit line, calculate an experimental value for \(n\).`, [
      pt('phys2-lab-refraction-d1', 'data-analysis', 'Relates the slope to n, consistent with the graph.', ['uses a single data point'], String.raw`\(n = \text{slope}\).`, String.raw`\(n = \sin 30^\circ / \sin 19.3^\circ\) only.`),
      pt('phys2-lab-refraction-d2', 'calculation', String.raw`Reports \(n\) between about 1.4 and 1.6.`, ['reports about 0.67 by inverting the slope'], String.raw`Slope \(\approx \dfrac{0.766 - 0.174}{0.508 - 0.113} \approx 1.50\), so \(n \approx 1.50\).`, String.raw`\(n \approx 0.67\).`),
    ]),
  ],
  sampleResponse: String.raw`A (i) The angle of incidence \(\theta_1\) and angle of refraction \(\theta_2\), both from the normal, for several incident angles. (ii) Mark each ray with several dots, use five angles, and repeat each. B (i) \(\sin\theta_1\) versus \(\sin\theta_2\). (ii) Since \(\sin\theta_1 = n\sin\theta_2\), the slope is \(n\). C Points (0.113, 0.174), (0.232, 0.342), (0.330, 0.500), (0.432, 0.643), (0.508, 0.766) with a straight best-fit line. D Slope \(\approx (0.766 - 0.174)/(0.508 - 0.113) \approx 1.50\), so \(n \approx 1.50\).`,
});

// ── 8. Qualitative/Quantitative Translation (modeled on 2026 Q4: energy in an electric circuit or field) ──
frqs.push({
  id: 'phys2-qqt-parallel-bulb', questionNumber: 4, title: 'Adding a Bulb in Parallel', topic: 'Qualitative/Quantitative Translation · DC circuits and power',
  modeledOn: modeled(2026, 4, 'Qualitative/Quantitative Translation'), timeAllottedMin: 20,
  prompt: String.raw`An ideal battery of emf \(\mathcal{E}\) is connected in series with a resistor of resistance \(R\) and lightbulb A, which has resistance \(R\), as shown in Figure 1. A switch then connects an identical bulb B in parallel with bulb A. Treat the bulb resistances as constant.`,
  figures: [fig('Figure 1', draw(380, 200, 'A battery in series with a resistor R and bulb A. Bulb B, behind an open switch, is connected in parallel with bulb A', [
    ...battery(40, 96), text(62, 92, '+', { size: 12 }), ['line', 40, 96, 40, 30], ['line', 40, 30, 120, 30], resistor(120, 200, 30), text(160, 18, 'R', { italic: true }), ['line', 200, 30, 260, 30], ['line', 40, 104, 40, 170], ['line', 40, 170, 260, 170],
    ['line', 260, 30, 260, 80], ['circle', 260, 100, 18], text(260, 105, 'A', { bold: true }), ['line', 260, 118, 260, 170],
    ['line', 260, 30, 340, 30], ['line', 340, 30, 340, 55], ['line', 340, 55, 352, 70], ['line', 340, 72, 340, 80], ['circle', 340, 100, 18], text(340, 105, 'B', { bold: true }), ['line', 340, 118, 340, 170], ['line', 260, 170, 340, 170], text(330, 62, 'switch', { size: 10, anchor: 'end' }),
  ]))],
  parts: [
    part('A', 'Indicate whether bulb A becomes brighter, dimmer, or stays the same when the switch is closed. Justify your answer using qualitative reasoning beyond referencing equations.', [
      pt('phys2-qqt-parallel-bulb-a1', 'justification', 'Indicates that bulb A becomes dimmer.', ['indicates the same brightness because the battery is ideal'], 'Dimmer.', 'Same.'),
      pt('phys2-qqt-parallel-bulb-a2', 'justification', 'States that adding a parallel path lowers the equivalent resistance, so the current through the battery and the resistor R increases.', ['says total resistance increases'], 'The parallel bulbs have less resistance together, so more current flows through R.', 'More bulbs add resistance.'),
      pt('phys2-qqt-parallel-bulb-a3', 'justification', 'Explains that the larger current makes the potential difference across R larger, leaving less potential difference (and power) for bulb A.', ['does not connect R’s voltage to bulb A'], 'R now takes a larger share of the emf, so bulb A gets less voltage and dims.', 'The current splits so A dims.'),
    ]),
    part('B', String.raw`Derive expressions for the power dissipated by bulb A before and after the switch is closed, in terms of \(\mathcal{E}\) and \(R\).`, [
      pt('phys2-qqt-parallel-bulb-b1', 'derivation', String.raw`Begins with Ohm's law, \(P = I^2R\) or \(P = \dfrac{(\Delta V)^2}{R}\), and the rules for series and parallel resistance.`, ['adds parallel resistances directly'], String.raw`\(R_{\text{eq}}\), \(I = \dfrac{\mathcal{E}}{R_{\text{eq}}}\), \(P = \dfrac{(\Delta V)^2}{R}\).`, String.raw`\(R_{\text{eq}} = 3R\) after closing.`),
      pt('phys2-qqt-parallel-bulb-b2', 'derivation', String.raw`Finds the power before closing, \(P_{\text{before}} = \dfrac{\mathcal{E}^2}{4R}\).`, ['uses the full emf across bulb A'], String.raw`\(I = \dfrac{\mathcal{E}}{2R}\), \(P = I^2R = \dfrac{\mathcal{E}^2}{4R}\).`, String.raw`\(P = \dfrac{\mathcal{E}^2}{R}\).`),
      pt('phys2-qqt-parallel-bulb-b3', 'derivation', String.raw`Finds the power after closing, \(P_{\text{after}} = \dfrac{\mathcal{E}^2}{9R}\) (from \(R_{\text{eq}} = \tfrac{3}{2}R\) and \(\Delta V_A = \tfrac{\mathcal{E}}{3}\)).`, ['uses R/2 as the total resistance'], String.raw`\(I = \dfrac{2\mathcal{E}}{3R}\), \(\Delta V_A = I\cdot\dfrac{R}{2} = \dfrac{\mathcal{E}}{3}\), \(P_A = \dfrac{\mathcal{E}^2}{9R}\).`, String.raw`\(P_A = \dfrac{\mathcal{E}^2}{4R}\).`),
    ]),
    part('C', 'Indicate whether your expressions in part B are or are not consistent with your answer in part A. Justify by referencing the expressions.', [
      pt('phys2-qqt-parallel-bulb-c1', 'justification', 'Correctly indicates consistency (or inconsistency with an incorrect part A).', ['claims consistency when the expressions contradict part A'], 'Consistent.', 'Not consistent.'),
      pt('phys2-qqt-parallel-bulb-c2', 'justification', String.raw`Compares the expressions: \(\dfrac{\mathcal{E}^2}{9R} < \dfrac{\mathcal{E}^2}{4R}\), so bulb A dims.`, ['restates part A without the expressions'], String.raw`\(\tfrac{1}{9} < \tfrac{1}{4}\), so bulb A dissipates less power after the switch closes.`, 'They agree.'),
    ]),
  ],
  sampleResponse: String.raw`A Dimmer. Adding bulb B in parallel lowers the equivalent resistance, so the current through the battery and R increases. R then takes a larger share of the emf, leaving less potential difference across bulb A, so A dims. B Before: \(I = \dfrac{\mathcal{E}}{2R}\), \(P_A = I^2R = \dfrac{\mathcal{E}^2}{4R}\). After: \(R_{\text{eq}} = R + \tfrac{R}{2} = \tfrac{3}{2}R\), \(I = \dfrac{2\mathcal{E}}{3R}\), \(\Delta V_A = I\cdot\tfrac{R}{2} = \tfrac{\mathcal{E}}{3}\), so \(P_A = \dfrac{\mathcal{E}^2}{9R}\). C Consistent: \(\dfrac{\mathcal{E}^2}{9R} < \dfrac{\mathcal{E}^2}{4R}\).`,
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'phys2-mr-parallel-wires',
  transcript: String.raw`A (i) Above Wire P the field is out of the page. The force on Wire Q is toward Wire P.

A (ii) \(B = \dfrac{\mu_0 I}{2\pi r}\). \(B_P = \dfrac{\mu_0 I}{2\pi y}\) and \(B_Q = \dfrac{\mu_0 (3I)}{2\pi (3d - y)}\). Setting them equal, \(3d - y = 3y\), so \(y = \tfrac{3}{4}d\).

B Clockwise. Below the wires the field is into the page and the flux increases as the loop gets closer.`,
  evidence: {
    'phys2-mr-parallel-wires-a1': 'Above Wire P the field is out of the page.', 'phys2-mr-parallel-wires-a2': 'The force on Wire Q is toward Wire P.',
    'phys2-mr-parallel-wires-a3': String.raw`\(B = \dfrac{\mu_0 I}{2\pi r}\)`, 'phys2-mr-parallel-wires-a4': String.raw`\(B_P = \dfrac{\mu_0 I}{2\pi y}\)`, 'phys2-mr-parallel-wires-a5': String.raw`\(B_Q = \dfrac{\mu_0 (3I)}{2\pi (3d - y)}\)`,
    'phys2-mr-parallel-wires-a6': 'Setting them equal', 'phys2-mr-parallel-wires-a7': String.raw`\(y = \tfrac{3}{4}d\)`,
    'phys2-mr-parallel-wires-b2': 'Below the wires the field is into the page',
  },
  missed: {
    'phys2-mr-parallel-wires-b1': 'The induced current is counterclockwise, not clockwise. See the next point for why.',
    'phys2-mr-parallel-wires-b3': 'Lenz’s law was not applied. The flux into the page is increasing, so the induced current must make a field out of the page inside the loop, which takes a counterclockwise current.',
  },
  priorityFix: 'After you find that the flux into the page is increasing, finish with Lenz’s law: the induced field opposes the change, so it points out of the page, and the right-hand rule then gives a counterclockwise current.',
  sampleResponseComparison: 'Part A matches the sample response. In part B you identified the field direction and the increasing flux but did not apply Lenz’s law, so the direction came out reversed.',
};

module.exports = { course: 'ap-physics-2', frqs, canned };
