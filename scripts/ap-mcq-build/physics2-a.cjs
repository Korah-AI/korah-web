// AP Physics 2, units 9–12 (stored as units 1–4): thermodynamics, electric force, field,
// and potential, circuits, and magnetism. Same block format as physics1.cjs:
// "@ unit | c (conceptual) or q (quantitative) | skill | optional figure key".
// Thermodynamics questions use the AP Physics 2 sign convention, in which W is the work
// done ON the gas, so that the first law reads \(\Delta U=Q+W\).
const { graph } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', AMBER = '#f59e0b', BLUE = '#3b82f6';
const r2 = n => Math.round(n * 100) / 100;
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];

// Circuit symbols. Resistors are zigzags; for a battery the long plate is the positive terminal.
function resH(x1, x2, y, label) {
  const m = (x1 + x2) / 2, zig = [-15, -9, -3, 3, 9, 15].map((d, i) => `L${m + d} ${y + (i % 2 ? 6 : -6)}`).join(' ');
  return [['path', `M${x1} ${y} H${m - 18} ${zig} L${m + 18} ${y} H${x2}`], text(m, y - 12, label, { size: 11 })];
}
function resV(x, y1, y2, label) {
  const m = (y1 + y2) / 2, zig = [-15, -9, -3, 3, 9, 15].map((d, i) => `L${x + (i % 2 ? 6 : -6)} ${m + d}`).join(' ');
  return [['path', `M${x} ${y1} V${m - 18} ${zig} L${x} ${m + 18} V${y2}`], text(x + 12, m + 4, label, { anchor: 'start', size: 11 })];
}
function battV(x, y1, y2, label) {
  const m = (y1 + y2) / 2;
  return [['line', x, y1, x, m - 5], ['line', x - 14, m - 5, x + 14, m - 5, { width: 2.4 }], ['line', x - 7, m + 5, x + 7, m + 5, { width: 4 }], ['line', x, m + 5, x, y2], text(x - 18, m + 4, label, { anchor: 'end', size: 11 }), text(x + 20, m - 6, '+', { size: 12 })];
}
function capV(x, y1, y2, label) {
  const m = (y1 + y2) / 2;
  return [['line', x, y1, x, m - 5], ['line', x - 14, m - 5, x + 14, m - 5, { width: 2.4 }], ['line', x - 14, m + 5, x + 14, m + 5, { width: 2.4 }], ['line', x, m + 5, x, y2], text(x + 20, m + 4, label, { anchor: 'start', size: 11 })];
}
// The label sits above a bulb in a horizontal wire, or to its right (side) in a vertical one.
function bulbAt(x, y, label, side) {
  return [['circle', x, y, 11, { fill: true }], ['path', `M${x - 5} ${y + 4} Q${x} ${y - 10} ${x + 5} ${y + 4}`], side ? text(x + 17, y + 5, label, { bold: true, size: 12, anchor: 'start' }) : text(x, y - 16, label, { bold: true, size: 12 })];
}
const xMark = (x, y) => [['line', x - 4, y - 4, x + 4, y + 4, { width: 1.4 }], ['line', x - 4, y + 4, x + 4, y - 4, { width: 1.4 }]];
const field = (x0, y0, cols, rows, step) => Array.from({ length: cols * rows }, (_, i) => xMark(x0 + (i % cols) * step, y0 + Math.floor(i / cols) * step)).flat();

const figures = {
  pvCycle: graph({ x: [0, 5], y: [0, 5], xlabel: 'V', ylabel: 'P', xtitle: 'Volume (×10⁻³ m³)', ytitle: 'Pressure (×10⁵ Pa)', w: 360, h: 300,
    curves: [{ pts: [[1, 4], [4, 4], [4, 1], [1, 1], [1, 4]] }], dots: [{ x: 1, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 1 }, { x: 1, y: 1 }],
    notes: [{ x: 0.7, y: 4.25, text: 'A' }, { x: 4.12, y: 4.25, text: 'B' }, { x: 4.12, y: 0.65, text: 'C' }, { x: 0.7, y: 0.65, text: 'D' }],
    alt: 'Pressure versus volume graph of a cycle for an ideal gas. A is at 1 × 10⁻³ m³ and 4 × 10⁵ Pa; B is at 4 × 10⁻³ m³ and 4 × 10⁵ Pa; C is at 4 × 10⁻³ m³ and 1 × 10⁵ Pa; D is at 1 × 10⁻³ m³ and 1 × 10⁵ Pa. The gas goes from A to B to C to D and back to A' }),
  pvTwo: graph({ x: [0, 4], y: [0, 5], xlabel: 'V', ylabel: 'P', curves: [{ fn: v => 4 / v, from: 1, to: 3 }, { fn: v => 4 / Math.pow(v, 5 / 3), from: 1, to: 3, color: PINK }],
    notes: [{ x: 1.05, y: 4.3, text: 'start' }, { x: 3.05, y: 1.45, text: '1' }, { x: 3.05, y: 0.55, text: '2' }],
    alt: 'Pressure versus volume graph showing two expansions of an ideal gas from the same starting state to three times the starting volume. Curve 1 falls less steeply and ends at a higher pressure; curve 2 falls more steeply and ends at a lower pressure' }),
  speeds: graph({ x: [0, 2000], y: [0, 1], xstep: 400, ystep: 0.2, xlabel: '', ylabel: '', xtitle: 'Molecular speed (m/s)', ytitle: 'Fraction of molecules (relative)', w: 370,
    curves: [{ fn: v => 1.0 * (v / 400) ** 2 * Math.exp(1 - (v / 400) ** 2), from: 0, to: 2000 }, { fn: v => 0.62 * (v / 700) ** 2 * Math.exp(1 - (v / 700) ** 2), from: 0, to: 2000, color: PINK }],
    notes: [{ x: 430, y: 0.95, text: 'gas X' }, { x: 900, y: 0.6, text: 'gas Y' }],
    alt: 'Distributions of molecular speeds for two samples of the same gas. Gas X peaks at about 400 m/s with a tall, narrow curve. Gas Y peaks at about 700 m/s with a shorter, broader curve that extends to higher speeds' }),
  engine: draw(340, 210, 'A heat engine. Energy Q_H flows from a hot reservoir at temperature T_H into the engine. The engine does work W and releases energy Q_C to a cold reservoir at temperature T_C', [
    ['rect', 90, 10, 160, 36, { fill: true }], text(170, 33, 'Hot reservoir, T_H', { size: 12 }), ['circle', 170, 105, 30, { fill: true }], text(170, 110, 'engine', { size: 12 }),
    ['rect', 90, 164, 160, 36, { fill: true }], text(170, 187, 'Cold reservoir, T_C', { size: 12 }), ['arrow', 170, 46, 170, 74], text(186, 64, 'Q_H', { anchor: 'start', size: 12 }),
    ['arrow', 170, 135, 170, 163], text(186, 154, 'Q_C', { anchor: 'start', size: 12 }), ['arrow', 200, 105, 270, 105], text(282, 109, 'W', { anchor: 'start', size: 12 }),
  ]),
  twoCharges: draw(360, 120, 'A charge of +4Q at x = 0 and a charge of −Q at x = d on the x-axis', [
    ['line', 10, 70, 350, 70], ...[0, 1, 2, 3].map(i => ['line', 60 + i * 90, 66, 60 + i * 90, 74]), text(60, 96, '0', { size: 11 }), text(150, 96, 'd', { italic: true }), text(240, 96, '2d', { italic: true }), text(330, 96, '3d', { italic: true }),
    ['circle', 60, 70, 14, { fill: PINK, color: PINK }], text(60, 75, '+4Q', { size: 10, color: '#fff' }), ['circle', 150, 70, 11, { fill: BLUE, color: BLUE }], text(150, 75, '−Q', { size: 10, color: '#fff' }), text(346, 62, 'x', { italic: true }),
  ]),
  equip: draw(360, 200, 'Four parallel, evenly spaced equipotential lines 2.0 cm apart, labeled 40 V, 30 V, 20 V, and 10 V from left to right. Point A is on the 40 V line and point B is on the 10 V line', [
    ...[[70, '40 V'], [150, '30 V'], [230, '20 V'], [310, '10 V']].flatMap(([x, l]) => [['line', x, 30, x, 180, { dash: true }], text(x, 22, l, { size: 11 })]),
    ['circle', 70, 105, 4, { fill: 'currentColor' }], text(56, 109, 'A', { italic: true, anchor: 'end' }), ['circle', 310, 105, 4, { fill: 'currentColor' }], text(324, 109, 'B', { italic: true, anchor: 'start' }),
    ['line', 150, 192, 230, 192], ['line', 150, 187, 150, 197], ['line', 230, 187, 230, 197], text(190, 188, '2.0 cm', { size: 10 }),
  ]),
  chargesLine: draw(360, 110, 'Three charges on a line, equally spaced a distance d apart: +q on the left, −q in the middle, and +q on the right', [
    ['line', 30, 60, 330, 60], ['circle', 80, 60, 12, { fill: PINK, color: PINK }], text(80, 65, '+q', { size: 11, color: '#fff' }), ['circle', 180, 60, 12, { fill: BLUE, color: BLUE }], text(180, 65, '−q', { size: 11, color: '#fff' }),
    ['circle', 280, 60, 12, { fill: PINK, color: PINK }], text(280, 65, '+q', { size: 11, color: '#fff' }), text(130, 90, 'd', { italic: true }), text(230, 90, 'd', { italic: true }),
  ]),
  plates: draw(340, 200, 'A parallel-plate capacitor with plates of area A separated by a distance d, connected to a battery of voltage V', [
    ['line', 110, 40, 230, 40, { width: 4 }], ['line', 110, 120, 230, 120, { width: 4 }], text(250, 84, 'd', { italic: true, anchor: 'start' }), ['line', 244, 40, 244, 120, { dash: true }],
    ['path', 'M170 40 V20 H40 V70'], ...battV(40, 70, 150, 'V'), ['path', 'M40 150 V180 H170 V120'], text(200, 32, 'area A', { size: 11, anchor: 'start' }),
  ]),
  sphereE: graph({ x: [0, 4], y: [0, 5], xlabel: 'r', ylabel: 'E', curves: [{ pts: [[0, 0], [1, 0]] }, { fn: r => 4 / (r * r), from: 1, to: 4 }, { pts: [[1, 0], [1, 4]], dash: true, color: PINK }],
    notes: [{ x: 1.05, y: 4.4, text: 'r = R' }], alt: 'Graph of electric field magnitude versus distance r from the center of a charged conducting sphere of radius R. The field is zero for r < R, jumps to its largest value at r = R, and decreases as 1/r² outside' }),
  circ1: draw(400, 210, 'A 12 V battery in series with a 2 ohm resistor R1. R1 is followed by two resistors in parallel: R2, 6 ohms, and R3, 3 ohms', [
    ['path', 'M40 40 H100'], ...resH(100, 180, 40, 'R₁ = 2 Ω'), ['path', 'M180 40 H320 M40 180 H320'], ...battV(40, 40, 180, '12 V'), ...resV(240, 40, 180, 'R₂ = 6 Ω'), ...resV(320, 40, 180, 'R₃ = 3 Ω'),
    ['circle', 240, 40, 3, { fill: 'currentColor' }], ['circle', 240, 180, 3, { fill: 'currentColor' }],
  ]),
  bulbs: draw(360, 210, 'Three identical light bulbs and a battery. Bulb A is in series with the battery. Bulbs B and C are in parallel with each other, and that combination is in series with bulb A', [
    ['path', 'M40 40 H130 M152 40 H320 M40 180 H320 M240 40 V99 M240 121 V180 M320 40 V99 M320 121 V180'], ...battV(40, 40, 180, 'ε'), ...bulbAt(141, 40, 'A'), ...bulbAt(240, 110, 'B', true), ...bulbAt(320, 110, 'C', true),
    ['circle', 240, 40, 3, { fill: 'currentColor' }], ['circle', 240, 180, 3, { fill: 'currentColor' }],
  ]),
  rc: draw(360, 210, 'A battery, an open switch S, a resistor R, and an uncharged capacitor C connected in series', [
    ['path', 'M40 40 H90 M128 40 H170'], ['line', 90, 40, 124, 24, { width: 2 }], ['circle', 90, 40, 3, { fill: 'currentColor' }], ['circle', 128, 40, 3, { fill: 'currentColor' }], text(108, 18, 'S', { italic: true }),
    ...resH(170, 260, 40, 'R'), ['path', 'M260 40 H320 M40 180 H320'], ...battV(40, 40, 180, 'ε'), ...capV(320, 40, 180, 'C'),
  ]),
  // The battery's labels go on its right, inside the dashed box, so nothing is clipped at the left edge.
  internal: draw(380, 210, 'A battery with emf 12 V and internal resistance 1 ohm, shown together inside a dashed box, connected to an external 5 ohm resistor. A voltmeter is connected across the battery terminals', [
    ['rect', 30, 50, 120, 124, { dash: true }], ...battV(60, 56, 110, '').filter(i => i[0] !== 'text'), text(80, 77, '+', { size: 12 }), text(88, 92, 'ε = 12 V', { anchor: 'start', size: 11 }),
    ...resV(60, 110, 168, '').filter(i => i[0] !== 'text'), text(78, 144, 'r = 1 Ω', { anchor: 'start', size: 11 }),
    ['path', 'M60 56 V30 H320 V60 M60 168 V190 H320 V164'], ...resV(320, 60, 164, '5 Ω'), ['path', 'M220 30 V82 M220 126 V190'], ['circle', 220, 104, 16, { fill: true }], text(220, 109, 'V', { bold: true, size: 13 }),
  ]),
  chargeB: draw(360, 200, 'A positively charged particle moves to the right with speed v into a region of uniform magnetic field directed into the page, shown by a grid of x symbols', [
    ['rect', 140, 20, 200, 170, { dash: true }], ...field(160, 40, 7, 6, 28), ['circle', 60, 105, 9, { fill: PINK, color: PINK }], text(60, 109, '+', { color: '#fff', size: 12 }), ['arrow', 74, 105, 128, 105], text(100, 96, 'v', { italic: true }), text(240, 14, 'B into the page', { size: 11 }),
  ]),
  wires: draw(340, 180, 'Two long, straight, parallel wires 0.10 m apart, each carrying a current of 5.0 A in the same direction, toward the top of the page', [
    ['line', 120, 20, 120, 160, { width: 3 }], ['line', 220, 20, 220, 160, { width: 3 }], ['arrow', 120, 110, 120, 50], ['arrow', 220, 110, 220, 50], text(104, 90, 'I', { italic: true, anchor: 'end' }), text(236, 90, 'I', { italic: true, anchor: 'start' }),
    ['line', 120, 170, 220, 170], text(170, 166, '0.10 m', { size: 11 }),
  ]),
  loopB: draw(360, 200, 'A square wire loop of side 0.10 m moves to the right at constant speed toward a region of uniform magnetic field directed into the page', [
    ['rect', 190, 20, 160, 170, { dash: true }], ...field(206, 40, 6, 6, 28), ['rect', 60, 70, 70, 70, { width: 2.4 }], ['arrow', 140, 105, 176, 105], text(158, 96, 'v', { italic: true }), text(95, 156, '0.10 m', { size: 11 }), text(270, 14, 'B into the page', { size: 11 }),
  ]),
  rail: draw(360, 200, 'A metal rod of length 0.50 m slides to the right at speed v along two horizontal conducting rails connected by a resistor R, in a uniform magnetic field directed into the page', [
    ['path', 'M60 40 H330 M60 160 H330'], ...resV(60, 40, 160, 'R'), ['line', 220, 30, 220, 170, { width: 5 }], ['arrow', 230, 18, 286, 18], text(300, 22, 'v', { italic: true }), text(206, 186, '0.50 m', { size: 11 }), ...field(110, 62, 3, 4, 26), ...field(260, 62, 2, 4, 26),
  ]),
  magnetCoil: draw(360, 160, 'A bar magnet with its north pole facing a coil of wire is pushed toward the coil. The coil is connected to a galvanometer', [
    ['rect', 30, 62, 110, 36, { fill: true }], text(57, 85, 'S', { bold: true }), text(113, 85, 'N', { bold: true }), ['line', 85, 62, 85, 98], ['arrow', 150, 80, 190, 80],
    ...[0, 1, 2, 3, 4, 5].map(i => ['path', `M${212 + i * 14} 50 Q${226 + i * 14} 80 ${212 + i * 14} 110`]), ['path', 'M212 110 V140 H330 V110 M296 50 V30 H330 V60'], ['circle', 330, 85, 16, { fill: true }], text(330, 90, 'G', { bold: true }),
  ]),
};

const source = String.raw`
@ 1 | q | Work on a pressure–volume diagram | pvCycle
An ideal gas goes through the cycle shown, from A to B to C to D and back to A. What is the net work done by the gas during one cycle?
* \(900\text{ J}\)
- \(1200\text{ J}\)
- \(300\text{ J}\)
- \(0\)
= The net work done by the gas is the area enclosed by the cycle: \((3\times 10^{-3}\text{ m}^3)(3\times 10^5\text{ Pa})=900\text{ J}\). It is positive because the cycle runs clockwise. The area under A to B alone is \(1200\text{ J}\).

@ 1 | q | Work on a pressure–volume diagram | pvCycle
For the process from A to B in the cycle shown, what is the work \(W\) done on the gas?
* \(-1200\text{ J}\)
- \(+1200\text{ J}\)
- \(-900\text{ J}\)
- \(0\)
= At constant pressure, the work done on the gas is \(W=-P\Delta V=-(4\times 10^5)(3\times 10^{-3})=-1200\text{ J}\). The gas expands, so it does positive work on its surroundings and the work done on it is negative.

@ 1 | c | First law of thermodynamics | pvCycle
During the process from B to C in the cycle shown, which statement about the gas is correct?
* No work is done, and the gas transfers energy to its surroundings as heat as its temperature falls.
- The gas does work, and heat is added to the gas.
- No work is done, and heat is added to the gas.
- The temperature stays constant, because the volume is constant.
= The volume does not change, so \(W=0\). The pressure falls at constant volume, so \(PV\) and the temperature fall, and \(\Delta U<0\). By \(\Delta U=Q+W\), \(Q\) must be negative.

@ 1 | q | Ideal gas law | pvCycle
For the cycle shown, the temperature of the gas at state D is \(300\text{ K}\). What is the temperature at state B?
* \(4800\text{ K}\)
- \(1200\text{ K}\)
- \(2400\text{ K}\)
- \(300\text{ K}\)
= For a fixed amount of gas, \(T\) is proportional to \(PV\). At D, \(PV=1\times 1\) in the graph's units; at B it is \(4\times 4=16\). So \(T_B=16(300)=4800\text{ K}\). States A and C are each at \(1200\text{ K}\).

@ 1 | c | Cyclic processes | pvCycle
For one complete cycle shown, how does the net energy added to the gas as heat compare with the net work done by the gas?
* They are equal, because the gas returns to its initial state and its internal energy does not change.
- The heat added is greater, because some energy is stored as internal energy each cycle.
- The work done is greater, because the gas does work in every process.
- The heat added is zero, because the cycle is closed.
= Internal energy depends only on the state of the gas, so \(\Delta U=0\) over a cycle. Then \(Q=-W\): the net heat added equals the net work done by the gas, the enclosed area.

@ 1 | c | Isothermal and adiabatic processes | pvTwo
An ideal gas expands from the same starting state to the same final volume in two ways, shown by curves 1 and 2. One process is isothermal and the other is adiabatic. Which curve represents the adiabatic process, and why?
* Curve 2, because with no heat entering, the gas uses internal energy to do work, so its temperature and pressure fall further.
- Curve 1, because an adiabatic process keeps the temperature constant.
- Curve 2, because more heat enters the gas during that process.
- Curve 1, because the pressure falls more slowly when no heat is exchanged.
= In an isothermal expansion, heat enters to keep the temperature constant, so \(PV\) stays fixed. In an adiabatic expansion, \(Q=0\) and the work done by the gas lowers its internal energy and temperature, so it ends at a lower pressure.

@ 1 | c | Work in thermodynamic processes | pvTwo
For the two expansions shown, how does the work done by the gas compare?
* More work is done by the gas in process 1, because the area under its curve is greater.
- More work is done in process 2, because its pressure changes more.
- The work is the same, because the change in volume is the same.
- No work is done in process 1, because the temperature is constant.
= The work done by a gas is the area under the curve on a pressure–volume diagram. Curve 1 lies above curve 2 at every volume, so it encloses more area.

@ 1 | q | Ideal gas law
What is the pressure of \(2.0\text{ mol}\) of an ideal gas at \(300\text{ K}\) in a \(0.050\text{ m}^3\) container? Use \(R=8.31\text{ J/(mol}\cdot\text{K)}\).
* About \(1.0\times 10^5\text{ Pa}\)
- About \(5.0\times 10^3\text{ Pa}\)
- About \(2.5\times 10^5\text{ Pa}\)
- About \(1.0\times 10^3\text{ Pa}\)
= \(P=\dfrac{nRT}{V}=\dfrac{2.0(8.31)(300)}{0.050}\approx 1.0\times 10^5\text{ Pa}\), about atmospheric pressure. Omitting the division by volume gives about \(5.0\times 10^3\).

@ 1 | q | Kinetic theory
Hydrogen molecules (molar mass \(2\text{ g/mol}\)) and oxygen molecules (molar mass \(32\text{ g/mol}\)) are in the same container at the same temperature. What is the ratio of the root-mean-square speed of the hydrogen molecules to that of the oxygen molecules?
* \(4\)
- \(16\)
- \(\dfrac{1}{4}\)
- \(1\)
= The molecules have the same average kinetic energy, \(\tfrac{3}{2}k_BT\), so \(v_{\text{rms}}\) is proportional to \(\dfrac{1}{\sqrt{m}}\). The mass ratio is 16, so the speed ratio is 4.

@ 1 | q | Kinetic theory
The absolute temperature of an ideal gas is increased from \(300\text{ K}\) to \(1200\text{ K}\). By what factor does the root-mean-square speed of its molecules change?
* It doubles.
- It quadruples.
- It increases by a factor of 16.
- It does not change.
= The root-mean-square speed is proportional to \(\sqrt{T}\). Multiplying the absolute temperature by 4 multiplies the speed by 2, while the average kinetic energy quadruples.

@ 1 | c | Distribution of molecular speeds | speeds
The graph shows the distributions of molecular speeds in two samples of the same gas. Which sample is at the higher temperature?
* Gas Y, because its distribution is shifted toward higher speeds
- Gas X, because its peak is taller
- Gas X, because more of its molecules move at the most probable speed
- They are at the same temperature, because they are the same gas
= Higher temperature means greater average kinetic energy, which shifts the distribution toward higher speeds and spreads it out. The peak must then be lower so that the total number of molecules is unchanged.

@ 1 | c | Distribution of molecular speeds | speeds
In the graph, the areas under the two curves are equal. What does this indicate about the samples?
* They contain the same number of molecules.
- They are at the same temperature.
- They have the same average speed.
- They have the same internal energy.
= The area under a distribution counts all of the molecules in the sample. The shapes differ because of temperature; equal areas mean equal numbers of molecules.

@ 1 | q | Kinetic theory
What is the average translational kinetic energy of a molecule of an ideal gas at \(300\text{ K}\)? Use \(k_B=1.38\times 10^{-23}\text{ J/K}\).
* About \(6.2\times 10^{-21}\text{ J}\)
- About \(4.1\times 10^{-21}\text{ J}\)
- About \(1.2\times 10^{-20}\text{ J}\)
- About \(3.7\times 10^{3}\text{ J}\)
= \(\overline{K}=\tfrac{3}{2}k_BT=1.5(1.38\times 10^{-23})(300)\approx 6.2\times 10^{-21}\text{ J}\). It depends only on temperature, not on the kind of molecule. Using \(k_BT\) alone gives \(4.1\times 10^{-21}\).

@ 1 | q | First law of thermodynamics
A gas absorbs \(500\text{ J}\) of heat while it does \(200\text{ J}\) of work on its surroundings. What is the change in its internal energy?
* \(+300\text{ J}\)
- \(+700\text{ J}\)
- \(-300\text{ J}\)
- \(+200\text{ J}\)
= Work done by the gas is \(200\text{ J}\), so the work done on the gas is \(W=-200\text{ J}\). Then \(\Delta U=Q+W=500-200=300\text{ J}\).

@ 1 | c | Adiabatic compression
A gas in an insulated cylinder is quickly compressed by a piston, so that no heat is exchanged. What happens to its temperature?
* It increases, because the work done on the gas increases its internal energy.
- It stays the same, because no heat enters the gas.
- It decreases, because the gas loses energy to the piston.
- It stays the same, because the pressure increases to compensate.
= With \(Q=0\), the first law gives \(\Delta U=W\), and \(W>0\) when the gas is compressed. The internal energy of an ideal gas is proportional to its temperature, so the temperature rises, as in a diesel engine.

@ 1 | q | Thermal conduction
Heat flows by conduction through a flat wall. The wall's thickness and its area are both doubled, and the temperatures on the two sides are unchanged. How does the rate of heat flow change?
* It is unchanged.
- It doubles.
- It is halved.
- It quadruples.
= The rate of conduction is \(\dfrac{kA\Delta T}{L}\). Doubling the area doubles it and doubling the thickness halves it, so the two changes cancel.

@ 1 | q | Thermal conduction
A glass window has an area of \(2.0\text{ m}^2\), a thickness of \(4.0\text{ mm}\), and a thermal conductivity of \(0.80\text{ W/(m}\cdot\text{K)}\). The temperature difference across it is \(20\text{ K}\). At what rate does heat flow through it?
* \(8.0\times 10^3\text{ W}\)
- \(32\text{ W}\)
- \(8.0\text{ W}\)
- \(4.0\times 10^3\text{ W}\)
= \(P=\dfrac{kA\Delta T}{L}=\dfrac{0.80(2.0)(20)}{0.0040}=8.0\times 10^3\text{ W}\). Forgetting to convert millimeters to meters gives \(8.0\text{ W}\).

@ 1 | c | Thermal equilibrium
A copper block at \(80^\circ\text{C}\) is placed in contact with an aluminum block at \(20^\circ\text{C}\) in an insulated container. Which statement describes the final state?
* Both blocks reach the same temperature, though they need not have the same internal energy.
- Both blocks reach the same internal energy.
- Heat continues to flow until both blocks reach \(50^\circ\text{C}\), regardless of their masses.
- Heat flows from the block with more internal energy to the block with less.
= Heat flows from higher to lower temperature until the temperatures are equal. The final temperature and each block's internal energy depend on the masses and specific heats.

@ 1 | c | Second law of thermodynamics
Which process would violate the second law of thermodynamics?
* Heat flowing on its own from a cold object to a hot object, with no other change
- A gas expanding freely into a vacuum
- Ice melting in a warm room
- A refrigerator using electrical work to move heat from its cold interior to a warm kitchen
= The second law requires that the total entropy of an isolated system never decrease. Heat cannot flow spontaneously from cold to hot; a refrigerator does so only because work is done on it, which increases entropy elsewhere.

@ 1 | q | Heat engines | engine
The heat engine shown takes in \(1000\text{ J}\) from the hot reservoir and releases \(700\text{ J}\) to the cold reservoir in each cycle. What is its efficiency?
* \(30\%\)
- \(70\%\)
- \(43\%\)
- \(100\%\)
= The work done is \(Q_H-Q_C=300\text{ J}\), and the efficiency is \(\dfrac{W}{Q_H}=\dfrac{300}{1000}=30\%\). The ratio \(\dfrac{300}{700}\) compares work with the waste heat, not with the input.

@ 1 | q | Heat engines | engine
The reservoirs of the engine shown are at \(600\text{ K}\) and \(300\text{ K}\). What is the greatest efficiency the engine could possibly have?
* \(50\%\)
- \(100\%\)
- \(67\%\)
- \(33\%\)
= The maximum, or Carnot, efficiency is \(1-\dfrac{T_C}{T_H}=1-\dfrac{300}{600}=50\%\). Real engines are less efficient because of friction and other irreversible processes.

@ 1 | c | Heat engines | engine
An inventor claims that an engine like the one shown can convert all of the heat it takes in into work, with \(Q_C=0\). Which statement correctly evaluates the claim?
* It is impossible, because it violates the second law of thermodynamics.
- It is possible, because it conserves energy.
- It is impossible, because it violates the first law of thermodynamics.
- It is possible if the cold reservoir is at \(0^\circ\text{C}\).
= Such an engine would conserve energy, so it does not violate the first law. The second law, however, requires that some heat be released to a colder reservoir; the Carnot efficiency is less than 100 percent for any \(T_C>0\text{ K}\).

@ 1 | q | Work at constant pressure
A gas at a constant pressure of \(2.0\times 10^5\text{ Pa}\) expands from \(1.0\text{ L}\) to \(3.0\text{ L}\). How much work does the gas do on its surroundings? \((1\text{ L}=1.0\times 10^{-3}\text{ m}^3)\)
* \(400\text{ J}\)
- \(600\text{ J}\)
- \(4.0\times 10^5\text{ J}\)
- \(200\text{ J}\)
= The work done by the gas is \(P\Delta V=(2.0\times 10^5)(2.0\times 10^{-3})=400\text{ J}\). Multiplying by the final volume gives \(600\text{ J}\), and omitting the conversion from liters gives the large value.

@ 1 | q | Ideal gas law
A sealed, rigid container of gas is at \(27^\circ\text{C}\) and pressure \(P\). It is heated to \(327^\circ\text{C}\). What is the new pressure?
* \(2P\)
- \(12P\)
- \(P\)
- \(1.1P\)
= At constant volume, pressure is proportional to absolute temperature. The temperature goes from \(300\text{ K}\) to \(600\text{ K}\), so the pressure doubles. Using Celsius temperatures gives the incorrect factor of 12.

@ 1 | c | Adiabatic expansion
When a gas expands adiabatically, its temperature decreases. Which statement best explains why?
* The gas does work on its surroundings using its own internal energy, because no heat enters to replace it.
- The molecules spread out, and spreading out lowers the temperature directly.
- Heat flows out of the gas as it expands.
- The pressure stays constant, so the temperature must fall.
= With \(Q=0\), \(\Delta U=W\), and \(W<0\) when the gas expands. The lost internal energy means lower average molecular kinetic energy and a lower temperature.

@ 1 | c | Kinetic theory
Helium and nitrogen gases are in the same container at the same temperature. Which statement is correct?
* Their molecules have the same average kinetic energy, and the helium atoms move faster on average.
- Their molecules have the same average speed.
- The nitrogen molecules have more average kinetic energy, because they are more massive.
- The helium atoms have more average kinetic energy, because they move faster.
= Temperature sets the average translational kinetic energy, \(\tfrac{3}{2}k_BT\), for every ideal gas. Lighter molecules must therefore move faster to have the same kinetic energy.

@ 1 | q | Isothermal processes
An ideal gas does \(800\text{ J}\) of work on its surroundings while its temperature stays constant. What is the heat transferred to the gas?
* \(+800\text{ J}\)
- \(-800\text{ J}\)
- \(0\)
- \(+1600\text{ J}\)
= The internal energy of an ideal gas depends only on its temperature, so \(\Delta U=0\). With \(W=-800\text{ J}\) of work done on the gas, \(Q=\Delta U-W=+800\text{ J}\): heat enters the gas.

@ 1 | c | Microscopic view of heat transfer
A hot gas and a cold gas are separated by a thin metal wall. Which statement best describes how energy is transferred between them at the molecular level?
* Faster molecules of the hot gas collide with the wall and transfer kinetic energy that the wall passes on to the slower molecules of the cold gas.
- Heat particles travel through the wall from the hot gas to the cold gas.
- Molecules of the hot gas pass through the wall into the cold gas.
- The cold gas transfers its coldness to the hot gas through the wall.
= Conduction is energy passed by collisions. On average, collisions transfer kinetic energy from faster to slower particles, so energy moves from the hot side to the cold side until the average kinetic energies are equal.

@ 1 | q | Thermal equilibrium
\(0.20\text{ kg}\) of water at \(80^\circ\text{C}\) is mixed in an insulated container with \(0.60\text{ kg}\) of water at \(20^\circ\text{C}\). What is the final temperature?
* \(35^\circ\text{C}\)
- \(50^\circ\text{C}\)
- \(65^\circ\text{C}\)
- \(40^\circ\text{C}\)
= The heat lost by the hot water equals the heat gained by the cold water: \(0.20(80-T)=0.60(T-20)\), which gives \(T=35^\circ\text{C}\). The result is closer to the temperature of the larger mass.

@ 2 | q | Superposition of electric fields | twoCharges
Charges \(+4Q\) and \(-Q\) are fixed on the \(x\)-axis as shown. At what position, other than at infinity, is the electric field zero?
* \(x=2d\)
- \(x=\dfrac{2d}{3}\)
- \(x=-d\)
- \(x=3d\)
= The field can vanish only where the two fields point in opposite directions and the weaker charge is closer, which is to the right of \(-Q\). At a distance \(s\) beyond \(-Q\), \(\dfrac{4}{(d+s)^2}=\dfrac{1}{s^2}\), so \(2s=d+s\) and \(s=d\).

@ 2 | c | Superposition of electric fields | twoCharges
Why can the electric field not be zero at any point between the two charges shown?
* Between them the fields of both charges point in the same direction, toward the negative charge.
- The fields there are too strong to cancel.
- The field is always zero only at the midpoint between two charges.
- Electric fields cannot be added between charges.
= The field of \(+4Q\) points away from it, to the right, and the field of \(-Q\) points toward it, also to the right. Fields in the same direction add, so they cannot cancel there.

@ 2 | q | Coulomb's law
Two point charges exert an electric force of magnitude \(F\) on each other. Both charges are doubled and the distance between them is tripled. What is the new magnitude of the force?
* \(\dfrac{4F}{9}\)
- \(\dfrac{2F}{3}\)
- \(\dfrac{4F}{3}\)
- \(\dfrac{F}{9}\)
= Coulomb's law gives \(F\propto\dfrac{q_1q_2}{r^2}\). Doubling both charges multiplies the force by 4, and tripling the distance divides it by 9.

@ 2 | q | Electric potential energy
An electron starts from rest and is accelerated through a potential difference of \(100\text{ V}\). What kinetic energy does it gain? Use \(e=1.6\times 10^{-19}\text{ C}\).
* \(1.6\times 10^{-17}\text{ J}\)
- \(1.6\times 10^{-19}\text{ J}\)
- \(100\text{ J}\)
- \(6.3\times 10^{20}\text{ J}\)
= The work done by the field is \(|q|\Delta V=(1.6\times 10^{-19})(100)=1.6\times 10^{-17}\text{ J}\), or \(100\text{ eV}\). The electron gains this energy by moving toward higher potential.

@ 2 | q | Equipotentials and fields | equip
The diagram shows equipotential lines in a region of uniform electric field. What are the magnitude and direction of the field?
* \(500\text{ V/m}\), directed toward the \(10\text{ V}\) line
- \(500\text{ V/m}\), directed toward the \(40\text{ V}\) line
- \(5.0\text{ V/m}\), directed toward the \(10\text{ V}\) line
- \(1500\text{ V/m}\), directed toward the \(10\text{ V}\) line
= The potential drops \(10\text{ V}\) over each \(0.020\text{ m}\), so \(E=\dfrac{\Delta V}{\Delta x}=500\text{ V/m}\). The field points from higher to lower potential. Using centimeters without converting gives \(5.0\).

@ 2 | q | Work done by an electric field | equip
How much work does the electric field do on a \(+2.0\text{ }\mu\text{C}\) charge that moves from point A to point B in the diagram?
* \(+6.0\times 10^{-5}\text{ J}\)
- \(-6.0\times 10^{-5}\text{ J}\)
- \(+2.0\times 10^{-5}\text{ J}\)
- \(+8.0\times 10^{-5}\text{ J}\)
= The field does work \(q(V_A-V_B)=(2.0\times 10^{-6})(40-10)=6.0\times 10^{-5}\text{ J}\). It is positive because a positive charge moves toward lower potential, in the direction of the field.

@ 2 | c | Motion in an electric field | equip
An electron is released from rest midway between points A and B in the diagram. Which way does it move?
* Toward A, the region of higher potential
- Toward B, the region of lower potential
- Along an equipotential line
- It remains at rest, because the potential there is not zero
= The field points toward lower potential, and the force on a negative charge is opposite the field. Electrons accelerate toward higher potential, losing electric potential energy as they gain kinetic energy.

@ 2 | c | Equipotentials | equip
A charge is moved at constant speed along one of the dashed lines in the diagram. How much work does the electric field do on it?
* None, because the potential is the same everywhere on the line.
- A positive amount, because the charge moves.
- A negative amount, because work is needed to move it.
- It depends on the sign of the charge.
= The work done by the field is \(-q\Delta V\), and \(\Delta V=0\) along an equipotential. The field is perpendicular to the equipotential line, so it has no component along the displacement.

@ 2 | q | Superposition of electric forces | chargesLine
Three charges are placed on a line as shown. What are the magnitude and direction of the net electric force on the charge on the right?
* \(\dfrac{3kq^2}{4d^2}\), toward the middle charge
- \(\dfrac{5kq^2}{4d^2}\), away from the middle charge
- \(\dfrac{kq^2}{d^2}\), toward the middle charge
- Zero
= The middle charge attracts it with \(\dfrac{kq^2}{d^2}\) to the left, and the left charge repels it with \(\dfrac{kq^2}{4d^2}\) to the right. The net force is \(\dfrac{3kq^2}{4d^2}\) to the left.

@ 2 | c | Equilibrium of charges | chargesLine
For the arrangement shown, which statement about the middle charge is correct?
* The net force on it is zero, but if it is displaced slightly along the line, it is pulled farther from its starting point.
- The net force on it is zero, and it returns to its position if displaced along the line.
- The net force on it points toward the right charge.
- It is pulled toward the left charge, because that charge is listed first.
= The two attractive forces are equal and opposite. If the middle charge moves toward one neighbor, that attraction grows and the other weakens, so the equilibrium is unstable along the line.

@ 2 | q | Capacitors | plates
The capacitor shown stays connected to the battery while the distance between its plates is doubled. What happens to the charge on the plates?
* It is halved.
- It doubles.
- It stays the same.
- It is quartered.
= The capacitance \(C=\dfrac{\varepsilon_0A}{d}\) is halved, and the battery keeps the voltage fixed, so \(Q=CV\) is halved. Charge flows back to the battery.

@ 2 | c | Capacitors | plates
The capacitor shown is charged and then disconnected from the battery. The plates are then pulled farther apart. What happens to the charge, the potential difference, and the field between the plates?
* The charge stays the same, the potential difference increases, and the field stays the same.
- The charge decreases, the potential difference stays the same, and the field decreases.
- All three stay the same.
- The charge stays the same, and the potential difference and the field both decrease.
= An isolated capacitor keeps its charge. The field between the plates depends on the charge per unit area, which is unchanged, and the potential difference is \(Ed\), which increases with the separation.

@ 2 | q | Energy stored in a capacitor
How much energy is stored in a \(2.0\text{ }\mu\text{F}\) capacitor charged to \(10\text{ V}\)?
* \(1.0\times 10^{-4}\text{ J}\)
- \(2.0\times 10^{-4}\text{ J}\)
- \(2.0\times 10^{-5}\text{ J}\)
- \(1.0\times 10^{-5}\text{ J}\)
= \(U=\tfrac{1}{2}CV^2=\tfrac{1}{2}(2.0\times 10^{-6})(10)^2=1.0\times 10^{-4}\text{ J}\). Leaving out the factor of one half gives \(2.0\times 10^{-4}\).

@ 2 | q | Field in a capacitor | plates
The plates of the capacitor shown are \(3.0\text{ mm}\) apart and connected to a \(12\text{ V}\) battery. What is the magnitude of the electric field between the plates?
* \(4.0\times 10^3\text{ V/m}\)
- \(4.0\text{ V/m}\)
- \(36\text{ V/m}\)
- \(4.0\times 10^{-3}\text{ V/m}\)
= Between parallel plates the field is uniform with \(E=\dfrac{\Delta V}{d}=\dfrac{12}{0.0030}=4.0\times 10^3\text{ V/m}\).

@ 2 | q | Dielectrics | plates
A dielectric with dielectric constant 3 is slid between the plates of the capacitor shown while it remains connected to the battery. What happens to the charge on the plates?
* It triples.
- It is reduced to one third.
- It stays the same.
- It increases by a factor of 9.
= The dielectric multiplies the capacitance by 3. With the battery holding the voltage fixed, \(Q=CV\) also triples.

@ 2 | c | Conductors in electrostatic equilibrium | sphereE
The graph shows the electric field around a charged, solid conducting sphere of radius \(R\). Which statement explains why the field is zero inside the sphere?
* The excess charge resides on the surface, and charges inside a conductor rearrange until the internal field is zero.
- The sphere contains no charge at all.
- The charges inside the sphere cancel only at the center.
- The metal blocks electric field lines from entering.
= Free charges in a conductor move until no force acts on them, which requires zero field inside. The excess charge spreads over the surface, and outside the field is that of a point charge at the center.

@ 2 | c | Potential of a conductor | sphereE
For the charged conducting sphere whose field is graphed, how does the electric potential inside the sphere compare with the potential at its surface?
* It is the same everywhere inside and equal to the surface potential.
- It is zero everywhere inside.
- It increases toward the center.
- It decreases toward the center.
= Because the field inside is zero, no work is done moving a charge within the conductor, so the potential cannot change from point to point. A zero field means a constant potential, not a zero potential.

@ 2 | q | Electric potential of a point charge
What is the electric potential \(0.30\text{ m}\) from a point charge of \(+2.0\text{ nC}\)? Use \(k=9.0\times 10^9\text{ N}\cdot\text{m}^2\text{/C}^2\).
* \(60\text{ V}\)
- \(200\text{ V}\)
- \(20\text{ V}\)
- \(6.0\text{ V}\)
= \(V=\dfrac{kq}{r}=\dfrac{(9.0\times 10^9)(2.0\times 10^{-9})}{0.30}=60\text{ V}\). Dividing by \(r^2\) gives the field, \(200\text{ N/C}\), not the potential.

@ 2 | q | Electric potential energy
How much work must be done to bring a \(+1.0\text{ }\mu\text{C}\) charge from very far away to a point \(0.20\text{ m}\) from a fixed \(+4.0\text{ }\mu\text{C}\) charge? Use \(k=9.0\times 10^9\text{ N}\cdot\text{m}^2\text{/C}^2\).
* \(0.18\text{ J}\)
- \(0.90\text{ J}\)
- \(0.045\text{ J}\)
- \(1.8\text{ J}\)
= The work equals the increase in electric potential energy, \(\dfrac{kq_1q_2}{r}=\dfrac{(9.0\times 10^9)(4.0\times 10^{-6})(1.0\times 10^{-6})}{0.20}=0.18\text{ J}\). Dividing by \(r^2\) gives \(0.90\).

@ 2 | c | Field and potential
At the midpoint between a \(+q\) charge and a \(-q\) charge, which statement is correct?
* The potential is zero, but the electric field is not zero.
- The electric field is zero, but the potential is not zero.
- Both the potential and the field are zero.
- Neither the potential nor the field is zero.
= Potential is a scalar, and the contributions \(\dfrac{kq}{r}\) and \(\dfrac{-kq}{r}\) cancel. Field is a vector, and both fields point toward the negative charge, so they add.

@ 2 | c | Charging by induction
A negatively charged rod is held near a neutral metal sphere, without touching it. The sphere is briefly connected to the ground, the ground connection is removed, and then the rod is taken away. What is the final charge on the sphere?
* Positive
- Negative
- Neutral
- Positive on the side nearer the rod and negative on the far side, with zero net charge
= The rod repels electrons, some of which flow to the ground. Breaking the ground connection before removing the rod traps the deficit of electrons, leaving the sphere with a net positive charge.

@ 2 | c | Polarization
A balloon rubbed on hair becomes negatively charged and sticks to a neutral wall. Which statement best explains this?
* The balloon polarizes molecules in the wall, so the positive ends are slightly closer to the balloon than the negative ends and the attraction outweighs the repulsion.
- The wall becomes positively charged by gaining protons from the air.
- Gravity holds the balloon against the wall.
- The negative charge on the balloon is attracted by the neutral wall's net positive charge.
= The wall's net charge stays zero. Its charges shift slightly, and because the electric force weakens with distance, the attraction to the nearer positive ends is stronger than the repulsion from the farther negative ends.

@ 2 | q | Motion of charges in a uniform field
What is the magnitude of the acceleration of an electron in a uniform electric field of \(1000\text{ N/C}\)? Use \(e=1.6\times 10^{-19}\text{ C}\) and \(m_e=9.11\times 10^{-31}\text{ kg}\).
* About \(1.8\times 10^{14}\text{ m/s}^2\)
- About \(1.6\times 10^{-16}\text{ m/s}^2\)
- About \(5.7\times 10^{-15}\text{ m/s}^2\)
- About \(9.8\text{ m/s}^2\)
= \(a=\dfrac{eE}{m_e}=\dfrac{(1.6\times 10^{-19})(1000)}{9.11\times 10^{-31}}\approx 1.8\times 10^{14}\text{ m/s}^2\). The electron's tiny mass makes gravity negligible by comparison.

@ 2 | q | Energy of charged particles
A proton starts from rest and is accelerated through a potential difference of \(500\text{ V}\). What is its final speed? Use \(e=1.6\times 10^{-19}\text{ C}\) and \(m_p=1.67\times 10^{-27}\text{ kg}\).
* About \(3.1\times 10^5\text{ m/s}\)
- About \(9.6\times 10^{10}\text{ m/s}\)
- About \(2.2\times 10^5\text{ m/s}\)
- About \(1.3\times 10^7\text{ m/s}\)
= Energy conservation gives \(qV=\tfrac{1}{2}mv^2\), so \(v=\sqrt{\dfrac{2(1.6\times 10^{-19})(500)}{1.67\times 10^{-27}}}\approx 3.1\times 10^5\text{ m/s}\). The value \(9.6\times 10^{10}\) is \(v^2\).

@ 2 | q | Quantization of charge
An oil drop of mass \(1.6\times 10^{-15}\text{ kg}\) is held motionless between horizontal plates by an upward electric force in a field of \(1.0\times 10^5\text{ N/C}\). Using \(g=10\text{ m/s}^2\), how many excess elementary charges does the drop carry? Use \(e=1.6\times 10^{-19}\text{ C}\).
* One
- Two
- Ten
- 100
= Balancing forces gives \(q=\dfrac{mg}{E}=\dfrac{(1.6\times 10^{-15})(10)}{1.0\times 10^5}=1.6\times 10^{-19}\text{ C}\), exactly one elementary charge. Millikan found that every drop's charge was a whole-number multiple of this value.

@ 2 | c | Electric field lines
Why can two electric field lines never cross?
* At any point the electric field has a single direction, and crossing lines would indicate two directions at the same point.
- Field lines repel each other because they carry charge.
- Field lines always run parallel to each other.
- Field lines cross only at the location of a charge.
= A field line is drawn tangent to the net field at every point. Because the net field at a point is a single vector, only one line can pass through it.

@ 2 | q | Capacitors in series
A \(3.0\text{ }\mu\text{F}\) capacitor and a \(6.0\text{ }\mu\text{F}\) capacitor are connected in series. What is their equivalent capacitance?
* \(2.0\text{ }\mu\text{F}\)
- \(9.0\text{ }\mu\text{F}\)
- \(4.5\text{ }\mu\text{F}\)
- \(18\text{ }\mu\text{F}\)
= For capacitors in series, \(\dfrac{1}{C}=\dfrac{1}{3.0}+\dfrac{1}{6.0}=\dfrac{1}{2.0}\). Series capacitance is less than either capacitor, the reverse of resistors in series.

@ 2 | q | Capacitors in parallel
A \(3.0\text{ }\mu\text{F}\) capacitor and a \(6.0\text{ }\mu\text{F}\) capacitor are connected in parallel across a \(12\text{ V}\) battery. What is the charge on the \(6.0\text{ }\mu\text{F}\) capacitor?
* \(72\text{ }\mu\text{C}\)
- \(36\text{ }\mu\text{C}\)
- \(108\text{ }\mu\text{C}\)
- \(24\text{ }\mu\text{C}\)
= In parallel, each capacitor has the full \(12\text{ V}\) across it, so \(Q=CV=(6.0\times 10^{-6})(12)=72\text{ }\mu\text{C}\). The total charge on both is \(108\text{ }\mu\text{C}\).

@ 2 | c | Field and equipotentials
Which statement correctly relates electric field lines to equipotential surfaces?
* Field lines are perpendicular to equipotential surfaces and point toward lower potential.
- Field lines are parallel to equipotential surfaces.
- Field lines point toward higher potential.
- Field lines and equipotential surfaces are unrelated.
= Moving along an equipotential surface requires no work, so the field has no component along it. The field points in the direction in which the potential decreases most rapidly.

@ 3 | q | Series and parallel resistors | circ1
In the circuit shown, the battery has no internal resistance. What is the current through the battery?
* \(3.0\text{ A}\)
- \(1.1\text{ A}\)
- \(6.0\text{ A}\)
- \(2.0\text{ A}\)
= The parallel pair has resistance \(\dfrac{6.0(3.0)}{6.0+3.0}=2.0\text{ }\Omega\), so the total is \(4.0\text{ }\Omega\) and the current is \(\dfrac{12}{4.0}=3.0\text{ A}\). Adding all three resistors as if in series gives \(1.1\text{ A}\).

@ 3 | q | Series and parallel resistors | circ1
In the circuit shown, what is the current through \(R_3\)?
* \(2.0\text{ A}\)
- \(1.0\text{ A}\)
- \(3.0\text{ A}\)
- \(4.0\text{ A}\)
= The \(3.0\text{ A}\) battery current produces \(6.0\text{ V}\) across \(R_1\), leaving \(6.0\text{ V}\) across the parallel pair. The current through \(R_3\) is \(\dfrac{6.0}{3.0}=2.0\text{ A}\), and through \(R_2\) it is \(1.0\text{ A}\).

@ 3 | q | Electric power | circ1
In the circuit shown, at what rate is energy dissipated in \(R_1\)?
* \(18\text{ W}\)
- \(36\text{ W}\)
- \(6.0\text{ W}\)
- \(72\text{ W}\)
= \(P=I^2R=(3.0)^2(2.0)=18\text{ W}\). The battery supplies \(36\text{ W}\) in all.

@ 3 | c | Changes in circuits | circ1
In the circuit shown, \(R_2\) is removed, leaving an open gap where it was. How do the current through the battery and the potential difference across \(R_3\) change?
* The battery current decreases, and the potential difference across \(R_3\) increases.
- Both decrease.
- Both increase.
- The battery current increases, and the potential difference across \(R_3\) decreases.
= Removing a parallel branch raises the total resistance to \(5.0\text{ }\Omega\), so the battery current falls to \(2.4\text{ A}\). Less current means less voltage across \(R_1\) (\(4.8\text{ V}\)), leaving \(7.2\text{ V}\) across \(R_3\).

@ 3 | c | Bulb brightness | bulbs
The three bulbs shown are identical. How do their brightnesses compare?
* Bulb A is brightest, and bulbs B and C are equally bright.
- All three are equally bright.
- Bulbs B and C are brightest, and bulb A is dimmest.
- Bulb A is dimmest, because current is used up by the time it returns.
= All of the battery's current passes through A and then divides equally between B and C. Each of B and C carries half of A's current and dissipates one quarter of A's power.

@ 3 | c | Changes in circuits | bulbs
In the circuit shown, bulb C is unscrewed from its socket. How do the brightnesses of bulbs A and B change?
* A becomes dimmer, and B becomes brighter.
- Both become brighter.
- Both become dimmer.
- A becomes brighter, and B stays the same.
= With C removed, A and B are in series, so the total resistance rises from \(1.5R\) to \(2R\) and the current through A falls. B now carries the whole current, which is more than the half share it had before, and its voltage rises from one third to one half of the battery's.

@ 3 | q | Electric power | bulbs
Each bulb shown has resistance \(R\), and the battery has emf \(\varepsilon\) and no internal resistance. What is the power dissipated by bulb A?
* \(\dfrac{4\varepsilon^2}{9R}\)
- \(\dfrac{\varepsilon^2}{R}\)
- \(\dfrac{\varepsilon^2}{9R}\)
- \(\dfrac{2\varepsilon^2}{3R}\)
= The total resistance is \(R+\dfrac{R}{2}=\dfrac{3R}{2}\), so the current through A is \(\dfrac{2\varepsilon}{3R}\). Then \(P=I^2R=\dfrac{4\varepsilon^2}{9R}\).

@ 3 | c | RC circuits | rc
The switch in the circuit shown is closed. Which statement describes the circuit immediately after the switch closes?
* The current is \(\dfrac{\varepsilon}{R}\), and the potential difference across the capacitor is zero.
- The current is zero, and the potential difference across the capacitor is \(\varepsilon\).
- The current is \(\dfrac{\varepsilon}{R}\), and the potential difference across the capacitor is \(\varepsilon\).
- The current is zero, because no charge can cross the gap between the capacitor plates.
= An uncharged capacitor has no voltage across it, so at first the full emf appears across the resistor. Charge does not cross the gap, but it flows onto one plate and off the other, so current flows in the circuit.

@ 3 | c | RC circuits | rc
A long time after the switch in the circuit shown is closed, which statement describes the circuit?
* The current is zero, and the potential difference across the capacitor equals \(\varepsilon\).
- The current is \(\dfrac{\varepsilon}{R}\), and the capacitor is fully charged.
- The current is zero, and the capacitor is uncharged.
- The current is \(\dfrac{\varepsilon}{2R}\), and the capacitor has half its final charge.
= As the capacitor charges, its voltage rises and opposes the battery. Current stops when the capacitor's voltage equals the emf, leaving no voltage across the resistor.

@ 3 | q | RC circuits | rc
In the circuit shown, \(\varepsilon=9.0\text{ V}\), \(R=3.0\text{ k}\Omega\), and \(C=10\text{ }\mu\text{F}\). What is the charge on the capacitor a long time after the switch is closed?
* \(90\text{ }\mu\text{C}\)
- \(30\text{ }\mu\text{C}\)
- \(0.90\text{ }\mu\text{C}\)
- \(270\text{ }\mu\text{C}\)
= The capacitor charges until its voltage is \(9.0\text{ V}\), so \(Q=CV=(10\times 10^{-6})(9.0)=90\text{ }\mu\text{C}\). The resistance affects how long charging takes, not the final charge.

@ 3 | q | RC circuits | rc
In the circuit shown, \(\varepsilon=9.0\text{ V}\), \(R=3.0\text{ k}\Omega\), and \(C=10\text{ }\mu\text{F}\). What is the current immediately after the switch is closed?
* \(3.0\text{ mA}\)
- \(0\)
- \(3.0\text{ A}\)
- \(0.30\text{ mA}\)
= With the uncharged capacitor acting like a wire, \(I=\dfrac{\varepsilon}{R}=\dfrac{9.0}{3000}=3.0\times 10^{-3}\text{ A}\). Forgetting the kilo prefix gives \(3.0\text{ A}\).

@ 3 | q | Internal resistance | internal
The battery shown has an emf of \(12\text{ V}\) and an internal resistance of \(1.0\text{ }\Omega\), and it is connected to a \(5.0\text{ }\Omega\) resistor. What does the ideal voltmeter read?
* \(10\text{ V}\)
- \(12\text{ V}\)
- \(2.0\text{ V}\)
- \(11\text{ V}\)
= The current is \(\dfrac{12}{1.0+5.0}=2.0\text{ A}\), and the terminal voltage is \(\varepsilon-Ir=12-2.0=10\text{ V}\). The battery's own resistance uses up \(2.0\text{ V}\).

@ 3 | c | Internal resistance | internal
The external resistor in the circuit shown is replaced by one with a smaller resistance. How does the voltmeter reading change?
* It decreases, because the larger current causes a larger voltage drop across the internal resistance.
- It increases, because more current flows.
- It stays at \(12\text{ V}\), because the emf does not change.
- It stays the same, because the voltmeter measures the emf.
= The terminal voltage is \(\varepsilon-Ir\). A smaller external resistance draws more current, so more of the emf is lost inside the battery.

@ 3 | q | Resistivity
A wire of resistance \(R\) is replaced by a wire of the same material that is twice as long and has twice the diameter. What is the resistance of the new wire?
* \(\dfrac{R}{2}\)
- \(R\)
- \(2R\)
- \(\dfrac{R}{4}\)
= \(R=\dfrac{\rho L}{A}\). Doubling the length doubles the resistance, and doubling the diameter quadruples the cross-sectional area, which divides the resistance by 4.

@ 3 | q | Combining resistors
A wire of resistance \(R\) is cut into two equal pieces, which are then connected side by side in parallel. What is the resistance of the combination?
* \(\dfrac{R}{4}\)
- \(\dfrac{R}{2}\)
- \(R\)
- \(2R\)
= Each half has resistance \(\dfrac{R}{2}\). Two equal resistances in parallel have half the resistance of one, so the combination is \(\dfrac{R}{4}\).

@ 3 | q | Kirchhoff's loop rule
A \(12\text{ V}\) battery and a \(4.0\text{ V}\) battery are connected in a single loop with a \(2.0\text{ }\Omega\) resistor, with their positive terminals facing each other so that they push current in opposite directions. Neglecting internal resistance, what is the current?
* \(4.0\text{ A}\)
- \(8.0\text{ A}\)
- \(6.0\text{ A}\)
- \(2.0\text{ A}\)
= Around the loop the emfs oppose, so the net emf is \(12-4.0=8.0\text{ V}\) and \(I=\dfrac{8.0}{2.0}=4.0\text{ A}\). The smaller battery is being charged.

@ 3 | c | Meters
A student connects an ammeter in parallel with a light bulb instead of in series. What is the likely result?
* The bulb goes out, because the ammeter's very small resistance carries nearly all of the current around it.
- The ammeter correctly reads the bulb's current.
- The bulb becomes brighter, because the ammeter adds current.
- Nothing changes, because ammeters have very large resistance.
= An ammeter is designed with a very small resistance so that it barely affects the current when placed in series. In parallel it acts almost like a wire, shorting out the bulb and possibly drawing a dangerously large current.

@ 3 | c | Parallel circuits
Why are household outlets wired in parallel rather than in series?
* Each device receives the full supply voltage and can be switched on or off independently.
- Parallel wiring uses less total current.
- Parallel wiring makes the total resistance of the house larger.
- In series, each device would receive more voltage than it needs.
= Every branch of a parallel circuit has the same voltage across it. In series, turning one device off would break the circuit for all, and the voltage would be shared among the devices.

@ 3 | q | Electric power
A light bulb is rated at \(60\text{ W}\) when connected to \(120\text{ V}\). What is its resistance while operating?
* \(240\text{ }\Omega\)
- \(2.0\text{ }\Omega\)
- \(0.50\text{ }\Omega\)
- \(7200\text{ }\Omega\)
= \(P=\dfrac{V^2}{R}\), so \(R=\dfrac{(120)^2}{60}=240\text{ }\Omega\). The value \(2.0\) is \(\dfrac{V}{P}\), which has no physical meaning here.

@ 3 | c | Power in series
A \(60\text{ W}\) bulb and a \(100\text{ W}\) bulb, both rated for \(120\text{ V}\), are connected in series to a \(120\text{ V}\) supply. Which bulb glows brighter?
* The \(60\text{ W}\) bulb, because it has the greater resistance and the bulbs carry the same current
- The \(100\text{ W}\) bulb, because it has the higher power rating
- They are equally bright, because they carry the same current
- Neither glows, because the voltage is split between them
= From \(R=\dfrac{V^2}{P}\), the \(60\text{ W}\) bulb has the larger resistance. In series both carry the same current, so the power \(I^2R\) is greater in the bulb with more resistance.

@ 3 | q | Electrical energy
A \(1.5\text{ kW}\) heater runs for \(4.0\text{ h}\). How much electrical energy does it use, in joules?
* About \(2.2\times 10^7\text{ J}\)
- \(6.0\text{ J}\)
- \(6.0\times 10^3\text{ J}\)
- About \(3.6\times 10^5\text{ J}\)
= The energy is \(Pt=(1500\text{ W})(4.0\times 3600\text{ s})\approx 2.2\times 10^7\text{ J}\), or \(6.0\text{ kWh}\).

@ 3 | q | Equivalent resistance
Two \(6.0\text{ }\Omega\) resistors are connected in parallel, and the combination is connected in series with a third \(6.0\text{ }\Omega\) resistor. What is the equivalent resistance?
* \(9.0\text{ }\Omega\)
- \(18\text{ }\Omega\)
- \(2.0\text{ }\Omega\)
- \(4.0\text{ }\Omega\)
= The parallel pair is \(3.0\text{ }\Omega\), and adding the series resistor gives \(9.0\text{ }\Omega\). All three in series would be \(18\) and all three in parallel \(2.0\).

@ 3 | c | Conservation of charge
A student says that current is smaller after it passes through a resistor because the resistor uses some of it up. Which statement correctly evaluates the claim?
* It is incorrect: the current is the same at every point in a series loop, and the resistor converts electrical potential energy, not charge.
- It is correct: each resistor absorbs some of the charge.
- It is correct only for large resistances.
- It is incorrect: the current becomes larger after a resistor.
= Charge is conserved and does not accumulate in a resistor, so the same current enters and leaves it. What decreases across a resistor is the electric potential, as energy is transferred to thermal energy.

@ 3 | q | Electric current
A current of \(2.0\text{ A}\) flows through a wire for \(30\text{ s}\). How many electrons pass a point in the wire? Use \(e=1.6\times 10^{-19}\text{ C}\).
* About \(3.8\times 10^{20}\)
- \(60\)
- About \(9.6\times 10^{-18}\)
- About \(1.3\times 10^{19}\)
= The charge is \(It=60\text{ C}\), and dividing by the charge of one electron gives about \(3.8\times 10^{20}\) electrons.

@ 3 | q | Voltage dividers
A \(2.0\text{ k}\Omega\) resistor and an \(8.0\text{ k}\Omega\) resistor are connected in series across a \(10\text{ V}\) battery. What is the potential difference across the \(8.0\text{ k}\Omega\) resistor?
* \(8.0\text{ V}\)
- \(2.0\text{ V}\)
- \(5.0\text{ V}\)
- \(10\text{ V}\)
= The current is \(\dfrac{10}{10\times 10^3}=1.0\text{ mA}\), so the voltage across the larger resistor is \((1.0\times 10^{-3})(8.0\times 10^3)=8.0\text{ V}\). In series, voltage divides in proportion to resistance.

@ 3 | c | Adding parallel branches
A resistor is added in parallel to one already connected across an ideal battery. How do the equivalent resistance and the current from the battery change?
* The equivalent resistance decreases and the battery current increases.
- Both increase.
- The equivalent resistance increases and the battery current decreases.
- Neither changes, because the original resistor is unchanged.
= Each parallel branch provides another path for charge, so the combined resistance is less than any branch alone. With the same voltage, the battery supplies more current, while the current in the original resistor is unchanged.

@ 3 | q | RC circuits
A \(6.0\text{ V}\) battery charges a capacitor through a \(2.0\text{ k}\Omega\) resistor. What is the current at the instant the potential difference across the capacitor is \(4.0\text{ V}\)?
* \(1.0\text{ mA}\)
- \(3.0\text{ mA}\)
- \(2.0\text{ mA}\)
- \(5.0\text{ mA}\)
= The loop rule gives a resistor voltage of \(6.0-4.0=2.0\text{ V}\), so \(I=\dfrac{2.0}{2000}=1.0\text{ mA}\). The current decreases as the capacitor charges.

@ 3 | c | RC circuits
In a charging RC circuit, the resistor is replaced with one of greater resistance, and the battery and capacitor are unchanged. How does the process change?
* The capacitor charges more slowly but reaches the same final charge.
- The capacitor charges faster and reaches a greater final charge.
- The capacitor reaches a smaller final charge in the same time.
- Nothing changes, because the capacitor determines the charging rate.
= The time constant \(RC\) grows with resistance, so the current is smaller and charging takes longer. The final charge, \(C\varepsilon\), depends only on the capacitance and the emf.

@ 3 | q | Parallel resistors
A \(4.0\text{ }\Omega\) resistor and a \(12\text{ }\Omega\) resistor are connected in parallel across a \(6.0\text{ V}\) battery. What is the total current from the battery?
* \(2.0\text{ A}\)
- \(0.38\text{ A}\)
- \(1.5\text{ A}\)
- \(0.50\text{ A}\)
= The branches carry \(\dfrac{6.0}{4.0}=1.5\text{ A}\) and \(\dfrac{6.0}{12}=0.50\text{ A}\), for a total of \(2.0\text{ A}\). Equivalently, the parallel resistance is \(3.0\text{ }\Omega\).

@ 4 | q | Charged particles in a magnetic field | chargeB
A proton enters the field region shown at \(2.0\times 10^6\text{ m/s}\), perpendicular to a uniform magnetic field of \(0.10\text{ T}\). What is the radius of its circular path? Use \(m_p=1.67\times 10^{-27}\text{ kg}\) and \(e=1.6\times 10^{-19}\text{ C}\).
* About \(0.21\text{ m}\)
- About \(2.1\text{ m}\)
- About \(0.021\text{ m}\)
- About \(4.8\text{ m}\)
= The magnetic force provides the centripetal force, \(qvB=\dfrac{mv^2}{r}\), so \(r=\dfrac{mv}{qB}=\dfrac{(1.67\times 10^{-27})(2.0\times 10^6)}{(1.6\times 10^{-19})(0.10)}\approx 0.21\text{ m}\).

@ 4 | c | Magnetic force direction | chargeB
In what direction is the magnetic force on the positive particle shown at the instant it enters the field?
* Toward the top of the page
- Toward the bottom of the page
- Into the page
- To the right, in the direction of its velocity
= The force is \(q\vec v\times\vec B\). With \(\vec v\) to the right and \(\vec B\) into the page, the right-hand rule gives a force toward the top of the page. A negative charge would be pushed toward the bottom.

@ 4 | c | Work done by magnetic forces | chargeB
As the particle shown moves through the uniform magnetic field, how does its speed change?
* It stays constant, because the magnetic force is always perpendicular to the velocity and does no work.
- It increases, because the field accelerates the particle.
- It decreases, because the field slows the particle.
- It increases at first and then decreases.
= A force perpendicular to the velocity changes only the direction of motion. The magnetic force does no work, so the particle's kinetic energy and speed stay constant as it follows a circular arc.

@ 4 | q | Charged particles in a magnetic field | chargeB
An electron enters the field shown with the same velocity as a proton. How does the radius of the electron's path compare with the proton's? \((m_p\approx 1836\,m_e)\)
* It is about \(\dfrac{1}{1836}\) as large, and the electron curves in the opposite direction.
- It is the same, because the charges have the same magnitude.
- It is 1836 times larger, and the electron curves in the same direction.
- It is about \(\dfrac{1}{1836}\) as large, and the electron curves in the same direction.
= From \(r=\dfrac{mv}{qB}\), with equal speeds and charge magnitudes the radius is proportional to mass. The electron's negative charge reverses the direction of the force.

@ 4 | q | Force on a current-carrying wire
A \(2.0\text{ m}\) length of wire carrying \(3.0\text{ A}\) lies perpendicular to a uniform magnetic field of \(0.50\text{ T}\). What is the magnitude of the magnetic force on the wire?
* \(3.0\text{ N}\)
- \(0.75\text{ N}\)
- \(1.5\text{ N}\)
- \(12\text{ N}\)
= \(F=ILB\sin 90^\circ=(3.0)(2.0)(0.50)=3.0\text{ N}\). The force is largest when the wire is perpendicular to the field and zero when it is parallel; dropping the factor of the length gives \(1.5\text{ N}\).

@ 4 | q | Magnetic field of a wire | wires
What is the magnitude of the magnetic field produced by one of the wires shown at the location of the other? Use \(\mu_0=4\pi\times 10^{-7}\text{ T}\cdot\text{m/A}\).
* \(1.0\times 10^{-5}\text{ T}\)
- \(1.0\times 10^{-4}\text{ T}\)
- \(6.3\times 10^{-5}\text{ T}\)
- \(5.0\times 10^{-7}\text{ T}\)
= \(B=\dfrac{\mu_0I}{2\pi r}=\dfrac{(4\pi\times 10^{-7})(5.0)}{2\pi(0.10)}=1.0\times 10^{-5}\text{ T}\).

@ 4 | c | Forces between currents | wires
The two wires shown carry currents in the same direction. Which statement describes the magnetic forces between them?
* They attract each other with forces of equal magnitude.
- They repel each other with forces of equal magnitude.
- They attract each other, and the force on each depends on its own current only.
- They exert no forces on each other, because the currents are parallel.
= Each wire sits in the magnetic field of the other, and the right-hand rules give a force on each directed toward the other. By Newton's third law, the forces are equal and opposite. Antiparallel currents repel.

@ 4 | q | Forces between currents | wires
What is the magnitude of the magnetic force per meter of length that each wire shown exerts on the other? Use \(\mu_0=4\pi\times 10^{-7}\text{ T}\cdot\text{m/A}\).
* \(5.0\times 10^{-5}\text{ N/m}\)
- \(1.0\times 10^{-5}\text{ N/m}\)
- \(2.5\times 10^{-4}\text{ N/m}\)
- \(5.0\times 10^{-6}\text{ N/m}\)
= The field from one wire at the other is \(1.0\times 10^{-5}\text{ T}\), so the force per length is \(IB=(5.0)(1.0\times 10^{-5})=5.0\times 10^{-5}\text{ N/m}\).

@ 4 | c | Magnetic field around a wire
A long, straight wire carries current directly out of the page. Viewed from above the page, what is the direction of the magnetic field around it?
* Counterclockwise circles centered on the wire
- Clockwise circles centered on the wire
- Straight lines pointing away from the wire
- Straight lines parallel to the wire
= By the right-hand rule, with the thumb along the current, out of the page, the fingers curl counterclockwise. The field lines form closed circles around the wire.

@ 4 | q | Magnetic flux
A loop of area \(0.020\text{ m}^2\) is in a uniform magnetic field of \(0.50\text{ T}\) that makes an angle of \(60^\circ\) with the line perpendicular to the plane of the loop. What is the magnetic flux through the loop?
* \(5.0\times 10^{-3}\text{ Wb}\)
- \(1.0\times 10^{-2}\text{ Wb}\)
- \(8.7\times 10^{-3}\text{ Wb}\)
- \(2.5\times 10^{-2}\text{ Wb}\)
= \(\Phi=BA\cos 60^\circ=(0.50)(0.020)(0.50)=5.0\times 10^{-3}\text{ Wb}\). Only the component of the field perpendicular to the loop contributes; using \(\sin 60^\circ\) gives \(8.7\times 10^{-3}\).

@ 4 | q | Motional emf | loopB
The square loop shown moves at \(2.0\text{ m/s}\) and is entering a field of \(0.40\text{ T}\). What emf is induced in the loop while it is partly inside the field?
* \(0.080\text{ V}\)
- \(0.80\text{ V}\)
- \(0.0080\text{ V}\)
- \(0.040\text{ V}\)
= The flux increases at the rate \(BLv\), so the emf is \((0.40)(0.10)(2.0)=0.080\text{ V}\). Only the leading edge, which is inside the field, cuts field lines.

@ 4 | c | Lenz's law | loopB
As the loop shown enters the field, what is the direction of the induced current in the loop?
* Counterclockwise
- Clockwise
- There is no current until the loop is fully inside the field.
- It alternates direction as the loop enters.
= The flux into the page is increasing. The induced current opposes that change by producing a field out of the page inside the loop, which requires a counterclockwise current.

@ 4 | c | Faraday's law | loopB
Once the loop shown is completely inside the uniform field and still moving to the right, what is the induced current?
* Zero, because the flux through the loop is no longer changing
- The same as while it was entering
- Clockwise, because the loop is leaving its starting position
- Larger, because more of the loop is in the field
= An emf is induced only when the magnetic flux changes. Inside a uniform field, the flux stays constant even though the loop moves, so there is no current until the loop begins to leave.

@ 4 | q | Magnetic force on an induced current | loopB
The loop shown has a resistance of \(0.40\text{ }\Omega\), so a current of \(0.20\text{ A}\) is induced as it enters the \(0.40\text{ T}\) field. What external force is needed to keep it moving at constant speed?
* \(8.0\times 10^{-3}\text{ N}\), to the right
- \(8.0\times 10^{-3}\text{ N}\), to the left
- \(0.080\text{ N}\), to the right
- None, because the loop moves at constant speed
= The magnetic force on the leading edge is \(ILB=(0.20)(0.10)(0.40)=8.0\times 10^{-3}\text{ N}\), directed to the left, opposing the motion. An equal force to the right keeps the velocity constant.

@ 4 | q | Motional emf | rail
The rod shown moves at \(3.0\text{ m/s}\) through a \(0.80\text{ T}\) field, and \(R=2.0\text{ }\Omega\). Neglecting the resistance of the rod and rails, what is the current in the circuit?
* \(0.60\text{ A}\)
- \(1.2\text{ A}\)
- \(2.4\text{ A}\)
- \(0.30\text{ A}\)
= The emf is \(BLv=(0.80)(0.50)(3.0)=1.2\text{ V}\), and the current is \(\dfrac{1.2}{2.0}=0.60\text{ A}\).

@ 4 | c | Lenz's law | rail
As the rod shown slides to the right, what is the direction of the magnetic force on it due to the induced current?
* To the left, opposing its motion
- To the right, in the direction of motion
- Into the page, along the field
- There is no force, because the field does no work
= By Lenz's law, the induced current opposes the change that causes it, which here is the rod's motion. If the force pushed the rod forward, it would speed up and create energy from nothing.

@ 4 | q | Energy in electromagnetic induction | rail
The rod shown moves at \(3.0\text{ m/s}\) through a \(0.80\text{ T}\) field with \(R=2.0\text{ }\Omega\), and the current is \(0.60\text{ A}\). At what rate is energy dissipated in the resistor?
* \(0.72\text{ W}\)
- \(1.2\text{ W}\)
- \(0.36\text{ W}\)
- \(2.4\text{ W}\)
= \(P=I^2R=(0.60)^2(2.0)=0.72\text{ W}\). This equals the mechanical power \(Fv=(ILB)v=(0.24)(3.0)\) that must be supplied to keep the rod moving.

@ 4 | q | Faraday's law
The magnetic flux through each turn of a 50-turn coil changes by \(0.020\text{ Wb}\) in \(0.10\text{ s}\). What is the magnitude of the average induced emf?
* \(10\text{ V}\)
- \(0.20\text{ V}\)
- \(1.0\text{ V}\)
- \(100\text{ V}\)
= \(|\varepsilon|=N\dfrac{\Delta\Phi}{\Delta t}=50\left(\dfrac{0.020}{0.10}\right)=10\text{ V}\). Each turn contributes the same emf, so the turns multiply the result.

@ 4 | c | Lenz's law | magnetCoil
As the north pole of the magnet shown is pushed toward the coil, what is the magnetic polarity of the end of the coil facing the magnet?
* North, so that the coil repels the approaching magnet
- South, so that the coil attracts the magnet
- It has no polarity, because the current is too small
- It alternates rapidly between north and south
= The induced current creates a field that opposes the increase in flux toward the coil, which makes the near end a north pole. The coil therefore pushes back on the magnet, and work must be done to move it closer.

@ 4 | c | Faraday's law | magnetCoil
The magnet shown is pushed into the coil and then held at rest inside it. What does the galvanometer show while the magnet is at rest?
* No current
- A steady current in the same direction as before
- A current that increases with time
- A steady current in the opposite direction
= A current is induced only while the flux through the coil is changing. A stationary magnet produces a constant flux, so the current stops; it reverses direction when the magnet is pulled out.

@ 4 | c | Earth's magnetic field
The north pole of a compass needle points approximately toward Earth's geographic North Pole. Which statement is correct?
* A magnetic south pole lies near Earth's geographic North Pole.
- A magnetic north pole lies near Earth's geographic North Pole.
- Earth has no magnetic poles; the needle follows electric currents in the air.
- The needle points north because north poles attract each other.
= Opposite magnetic poles attract, so the needle's north pole is drawn toward a magnetic south pole. Earth's magnetic field lines point roughly northward at the surface and enter the planet near the geographic North Pole.

@ 4 | c | Magnetic poles
A bar magnet is cut in half between its north and south poles. Which describes the two pieces?
* Each piece is a complete magnet with its own north and south poles.
- One piece is a north pole and the other is a south pole.
- Neither piece is magnetic.
- One piece keeps both poles and the other loses its magnetism.
= Magnetic poles always occur in pairs; no isolated magnetic pole has ever been observed. The magnetism comes from aligned atomic magnetic moments throughout the material, so each piece is itself a dipole.

@ 4 | q | Velocity selectors
In a region with an electric field of \(2000\text{ V/m}\) and a perpendicular magnetic field of \(0.010\text{ T}\), charged particles with one particular speed pass straight through. What is that speed?
* \(2.0\times 10^5\text{ m/s}\)
- \(20\text{ m/s}\)
- \(5.0\times 10^{-6}\text{ m/s}\)
- \(2.0\times 10^3\text{ m/s}\)
= The particle goes straight when the electric and magnetic forces balance, \(qE=qvB\), so \(v=\dfrac{E}{B}=2.0\times 10^5\text{ m/s}\), independent of the charge and mass.

@ 4 | c | Magnetic force on moving charges
A charged particle moves parallel to a uniform magnetic field. What is the magnetic force on it?
* Zero
- Its greatest possible value, \(qvB\)
- Directed along the field
- Directed opposite the velocity
= The magnetic force has magnitude \(qvB\sin\theta\), where \(\theta\) is the angle between the velocity and the field. For parallel motion \(\sin\theta=0\), so the particle continues in a straight line.

@ 4 | q | Circular motion in a magnetic field
What is the period of the circular motion of a proton in a uniform magnetic field of \(0.50\text{ T}\)? Use \(m_p=1.67\times 10^{-27}\text{ kg}\) and \(e=1.6\times 10^{-19}\text{ C}\).
* About \(1.3\times 10^{-7}\text{ s}\)
- About \(2.1\times 10^{-8}\text{ s}\)
- About \(7.6\times 10^{6}\text{ s}\)
- It cannot be determined without the proton's speed.
= The period is \(T=\dfrac{2\pi r}{v}=\dfrac{2\pi m}{qB}=\dfrac{2\pi(1.67\times 10^{-27})}{(1.6\times 10^{-19})(0.50)}\approx 1.3\times 10^{-7}\text{ s}\). The speed cancels: faster protons move in larger circles in the same time.

@ 4 | c | Circular motion in a magnetic field
Two protons with different speeds move in circles in the same uniform magnetic field. How do their periods compare?
* They are equal, because the faster proton moves in a proportionally larger circle.
- The faster proton has the shorter period.
- The faster proton has the longer period.
- The periods depend on the direction of motion.
= The radius \(\dfrac{mv}{qB}\) is proportional to speed, so the circumference and the speed grow together and the time per revolution is the same. Cyclotrons rely on this.

@ 4 | q | Magnetic force on a moving charge
A \(2.0\text{ }\mu\text{C}\) charge moves at \(300\text{ m/s}\) through a \(0.50\text{ T}\) magnetic field, at an angle of \(30^\circ\) to the field. What is the magnitude of the magnetic force on it?
* \(1.5\times 10^{-4}\text{ N}\)
- \(3.0\times 10^{-4}\text{ N}\)
- \(2.6\times 10^{-4}\text{ N}\)
- \(150\text{ N}\)
= \(F=qvB\sin 30^\circ=(2.0\times 10^{-6})(300)(0.50)(0.50)=1.5\times 10^{-4}\text{ N}\). Using \(\cos 30^\circ\) gives \(2.6\times 10^{-4}\).

@ 4 | c | Eddy currents
A copper plate swinging as a pendulum passes between the poles of a strong magnet and slows down quickly, though copper is not attracted to a magnet. Which statement best explains this?
* The changing flux through the plate induces swirling currents, and the magnetic forces on them oppose the plate's motion.
- The magnet attracts the copper, pulling it to a stop.
- Air resistance is much greater near a magnet.
- The magnet removes electrons from the plate, making it lighter.
= As the plate enters and leaves the field, the flux through parts of it changes and induces eddy currents. By Lenz's law these currents experience forces that oppose the motion, converting kinetic energy into thermal energy. Magnetic braking on trains works this way.

@ 4 | c | Magnetic field of a current loop
A circular loop of wire carries a steady current. Which statement describes its magnetic field?
* It resembles the field of a bar magnet, with one face of the loop acting as a north pole and the other as a south pole.
- It is zero everywhere, because the field from each side of the loop cancels.
- It forms circles in the plane of the loop.
- It points radially outward from the center of the loop.
= Inside the loop the fields from every part of the wire point the same way, through the loop. Field lines emerge from one face and return around the outside to the other, the pattern of a magnetic dipole.
`;

module.exports = { source, figures };
