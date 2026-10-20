// AP Chemistry units 1–5: atomic structure, compound structure, properties of substances and
// mixtures, chemical reactions, and kinetics. Block format with "c" (conceptual) or "q"
// (quantitative) in the second field. Formulas use the ce{…}/mce{…} notation in chemtext.cjs.
const { graph, chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');
const { chem } = require('./chemtext.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6', AMBER = '#f59e0b';
const r2 = n => Math.round(n * 100) / 100;
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const m = v => String.raw`\(${v}\)`;
const morse = (D, re, a) => r => D * ((1 - Math.exp(-a * (r - re))) ** 2 - 1);
// Vapor pressure (kPa) from the Clausius–Clapeyron equation, given the normal boiling point (°C) and ΔHvap (J/mol).
const vp = (tb, dh) => t => 101.3 * Math.exp(-dh / 8.314 * (1 / (t + 273.15) - 1 / (tb + 273.15)));
const mbCurve = (peak, height) => v => height * (v / peak) ** 2 * Math.exp(1 - (v / peak) ** 2);
const G = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));
const profile = x => -40 / (1 + Math.exp(-(x - 6) * 2)) + 90 * G(x, 3, 0.6) + 25 * G(x, 5, 1.2) + 80 * G(x, 7, 0.6);

function pes() {
  const peaks = [[70, '104', 2], [165, '6.84', 2], [260, '3.67', 6], [355, '0.50', 1]];
  return draw(420, 230, 'Photoelectron spectrum of an element, not drawn to scale. Binding energy decreases from left to right. There are four peaks: at 104 MJ/mol with relative height 2, at 6.84 MJ/mol with relative height 2, at 3.67 MJ/mol with relative height 6, and at 0.50 MJ/mol with relative height 1', [
    ['line', 30, 186, 405, 186], ['line', 30, 186, 30, 40], text(34, 30, 'Relative number of electrons', { anchor: 'start', size: 11 }),
    ...peaks.flatMap(([x, l, hgt]) => [['rect', x - 9, 186 - 22 * hgt, 18, 22 * hgt, { fill: BLUE, color: BLUE, width: 0.1 }], text(x, 202, l, { size: 11 })]),
    text(218, 222, 'Binding energy (MJ/mol), decreasing →  (not to scale)', { size: 11 }),
  ]);
}

function alloys() {
  const items = [];
  for (const [ox, label, kind] of [[20, 'X', 'inter'], [220, 'Y', 'sub']]) {
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const sub = kind === 'sub' && (i + j * 3) % 5 === 1;
      items.push(['circle', ox + 30 + i * 36, 40 + j * 36, 17, { fill: sub ? PINK : true, color: sub ? PINK : 'currentColor', width: 1.4 }]);
    }
    if (kind === 'inter') for (const [i, j] of [[0, 0], [1, 1], [2, 0], [0, 2], [2, 2], [1, 2]]) items.push(['circle', ox + 48 + i * 36, 58 + j * 36, 6, { fill: PINK, color: PINK }]);
    items.push(text(ox + 84, 196, label, { bold: true, size: 14 }));
  }
  return draw(400, 206, 'Two particle diagrams of alloys, each with a 4 by 4 array of large metal atoms. In diagram X, small atoms of a second element sit in the spaces between the large atoms. In diagram Y, some of the large atoms are replaced by atoms of a second element of nearly the same size', items);
}

function chromatogram() {
  return draw(300, 280, 'Paper chromatogram. The solvent traveled 10.0 cm from the starting line. Spot A traveled 2.0 cm, and spot B traveled 6.5 cm', [
    ['rect', 90, 20, 120, 250, { fill: true }], ['line', 90, 230, 210, 230, { dash: true }], ['line', 90, 30, 210, 30, { dash: true, color: BLUE }],
    ['circle', 130, 190, 7, { fill: 'currentColor' }], ['circle', 170, 100, 7, { fill: PINK, color: PINK }], text(130, 214, 'A', { bold: true }), text(170, 124, 'B', { bold: true }),
    text(220, 34, 'solvent front', { anchor: 'start', size: 11 }), text(220, 234, 'starting line', { anchor: 'start', size: 11 }),
    ['line', 60, 30, 60, 230], ['line', 55, 30, 65, 30], ['line', 55, 230, 65, 230], text(52, 134, '10.0 cm', { anchor: 'end', size: 11 }),
  ]);
}

function gasMix() {
  const xs = [[60, 50], [130, 80], [90, 130], [190, 45], [230, 120], [170, 150]], ys = [[110, 40], [210, 80], [60, 100], [150, 110]];
  return draw(300, 190, 'A rigid container holding a mixture of two gases: six particles of gas X, drawn as blue circles, and four particles of gas Y, drawn as pink circles', [
    ['rect', 30, 20, 240, 150, { width: 2.4 }], ...xs.map(([x, y]) => ['circle', x, y, 9, { fill: BLUE, color: BLUE }]), ...ys.map(([x, y]) => ['circle', x, y, 12, { fill: PINK, color: PINK }]),
    text(130, 186, '● X', { size: 11, color: BLUE }), text(170, 186, '● Y', { size: 11, color: PINK }),
  ]);
}

function beforeRxn() {
  const h2 = [[60, 50], [140, 40], [220, 60], [80, 130], [170, 120], [240, 150]], o2 = [[110, 90], [200, 95], [50, 160], [140, 165]];
  return draw(300, 200, 'A container before a reaction, holding six H2 molecules, each drawn as two small joined circles, and four O2 molecules, each drawn as two larger joined pink circles', [
    ['rect', 20, 15, 260, 175, { width: 2.4 }],
    ...h2.flatMap(([x, y]) => [['circle', x - 5, y, 6, { fill: 'currentColor' }], ['circle', x + 5, y, 6, { fill: 'currentColor' }]]),
    ...o2.flatMap(([x, y]) => [['circle', x - 8, y, 10, { fill: PINK, color: PINK }], ['circle', x + 8, y, 10, { fill: PINK, color: PINK }]]),
  ]);
}

function precipitate() {
  const ions = [[70, 50, 'Na⁺'], [180, 70, 'NO₃⁻'], [250, 45, 'Na⁺'], [110, 110, 'NO₃⁻'], [220, 120, 'Na⁺'], [60, 150, 'NO₃⁻']];
  return draw(300, 240, 'Particle diagram of the mixture after silver nitrate and sodium chloride solutions are combined. Sodium ions and nitrate ions are scattered through the solution, while silver and chloride ions are packed together in a solid at the bottom of the beaker', [
    ['path', 'M20 20 V220 H280 V20', { width: 2.4 }], ['line', 20, 30, 280, 30, { color: BLUE, width: 1.2 }],
    ...ions.map(([x, y, l]) => text(x, y, l, { size: 12, color: l.startsWith('Na') ? BLUE : PINK })),
    ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap(i => [0, 1].map(j => ['circle', 90 + i * 16, 208 - j * 14, 7, { fill: (i + j) % 2 ? 'currentColor' : true }])),
    text(150, 176, 'AgCl(s)', { size: 11 }),
  ]);
}

const figures = {
  pes: pes(),
  massSpec: chart({ title: 'Mass spectrum of element X (relative abundance, %, by mass number)', categories: ['24', '25', '26'], series: [{ name: 'Abundance', values: [79, 10, 11] }], ymax: 100, ystep: 20, w: 400,
    alt: 'Mass spectrum of element X with three peaks: mass 24 at 79 percent relative abundance, mass 25 at 10 percent, and mass 26 at 11 percent' }),
  ionization: table(['Ionization', 'First', 'Second', 'Third', 'Fourth'], [['Energy (kJ/mol)', '578', '1,817', '2,745', '11,577']], 'Table of the successive ionization energies of element Z: first 578, second 1,817, third 2,745, and fourth 11,577 kilojoules per mole'),
  peCurve: graph({ x: [0, 300], y: [-500, 300], xstep: 50, ystep: 100, xlabel: '', ylabel: '', xtitle: 'Internuclear distance (pm)', ytitle: 'Potential energy (kJ/mol)', w: 380,
    curves: [{ fn: morse(436, 74, 0.019), from: 31, to: 300 }, { fn: morse(242, 199, 0.02), from: 154, to: 300, color: PINK }],
    notes: [{ x: 80, y: -470, text: 'A' }, { x: 205, y: -290, text: 'B' }],
    alt: 'Potential energy versus internuclear distance for two diatomic molecules. Curve A has a deep minimum of −436 kJ/mol at 74 pm. Curve B has a shallower minimum of −242 kJ/mol at 199 pm. Both curves rise steeply at short distances and level off toward zero at long distances' }),
  alloys: alloys(),
  vapor: graph({ x: [0, 100], y: [0, 120], xstep: 20, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Temperature (°C)', ytitle: 'Vapor pressure (kPa)', w: 380,
    curves: [{ fn: vp(34.6, 27000), from: 0, to: 39 }, { fn: vp(78.4, 38600), from: 0, to: 84, color: PINK }, { fn: vp(100, 40700), from: 0, to: 100, color: AMBER }, { pts: [[0, 101.3], [100, 101.3]], dash: true, color: 'currentColor' }],
    notes: [{ x: 22, y: 82, text: 'A' }, { x: 68, y: 82, text: 'B' }, { x: 90, y: 82, text: 'C' }],
    alt: 'Vapor pressure versus temperature for three liquids, A, B, and C. A dashed line marks 101.3 kPa. Liquid A reaches 101.3 kPa at about 35 °C, liquid B at about 78 °C, and liquid C at 100 °C. At every temperature, A has the highest vapor pressure and C the lowest' }),
  mb: graph({ x: [0, 2400], y: [0, 1.1], xstep: 400, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Molecular speed (m/s)', ytitle: 'Fraction of molecules', w: 380,
    curves: [{ fn: mbCurve(420, 1), from: 0, to: 2400 }, { fn: mbCurve(1110, 0.38), from: 0, to: 2400, color: PINK }],
    notes: [{ x: 470, y: 1.02, text: 'X' }, { x: 1180, y: 0.44, text: 'Y' }],
    alt: 'Distributions of molecular speeds for two different gases, X and Y, at the same temperature. Gas X has a tall, narrow peak near 420 m/s. Gas Y has a low, broad peak near 1110 m/s and extends to much higher speeds' }),
  beer: graph({ x: [0, 0.5], y: [0, 1], xstep: 0.1, ystep: 0.2, xlabel: '', ylabel: '', xtitle: 'Concentration of dye (M)', ytitle: 'Absorbance', w: 370,
    curves: [{ pts: [[0, 0], [0.5, 0.9]] }], dots: [0.1, 0.2, 0.3, 0.4].map(c => ({ x: c, y: 1.8 * c })),
    alt: 'Beer’s law calibration graph. Absorbance increases linearly with dye concentration, through the origin: 0.18 at 0.10 M, 0.36 at 0.20 M, 0.54 at 0.30 M, and 0.72 at 0.40 M' }),
  chrom: chromatogram(),
  gasMix: gasMix(),
  beforeRxn: beforeRxn(),
  precipitate: precipitate(),
  rates: table(['Experiment', m('[\\mathrm{A}]_0') + ' (M)', m('[\\mathrm{B}]_0') + ' (M)', 'Initial rate (M/s)'], [
    ['1', '0.10', '0.10', m('2.0\\times 10^{-3}')], ['2', '0.20', '0.10', m('8.0\\times 10^{-3}')], ['3', '0.10', '0.30', m('6.0\\times 10^{-3}')],
  ], 'Initial-rate data for the reaction of A and B. Experiment 1: [A] 0.10 M, [B] 0.10 M, rate 2.0 × 10⁻³ M/s. Experiment 2: [A] 0.20 M, [B] 0.10 M, rate 8.0 × 10⁻³ M/s. Experiment 3: [A] 0.10 M, [B] 0.30 M, rate 6.0 × 10⁻³ M/s'),
  lnPlot: graph({ x: [0, 400], y: [-3.5, 0], xstep: 100, ystep: 0.5, xlabel: 't (s)', ylabel: 'ln[X]', w: 370, curves: [{ pts: [[0, -1], [400, -3]] }], dots: [0, 100, 200, 300, 400].map(t => ({ x: t, y: -1 - 0.005 * t })),
    alt: 'Graph of the natural logarithm of the concentration of reactant X versus time. The points lie on a straight line from ln[X] = −1.0 at t = 0 to ln[X] = −3.0 at t = 400 s' }),
  profile: graph({ x: [0, 10], y: [-60, 110], xstep: 20, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Reaction progress', ytitle: 'Potential energy (kJ/mol)', w: 380,
    curves: [{ fn: profile, from: 0, to: 10 }], notes: [{ x: 0.2, y: 8, text: 'reactants' }, { x: 4.4, y: 28, text: 'I' }, { x: 8.3, y: -32, text: 'products' }, { x: 2.75, y: 98, text: '1' }, { x: 6.8, y: 54, text: '2' }],
    alt: 'Potential energy diagram for a two-step reaction. Reactants start at 0 kJ/mol. The first transition state, labeled 1, is at about 91 kJ/mol. An intermediate, I, sits in a valley at about 20 kJ/mol. The second transition state, labeled 2, is at about 46 kJ/mol. Products end at about −40 kJ/mol' }),
  mbEa: graph({ x: [0, 10], y: [0, 1.1], xstep: 20, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Kinetic energy of collisions', ytitle: 'Fraction of collisions', w: 380,
    curves: [{ fn: mbCurve(2.2, 1), from: 0, to: 10 }, { fn: mbCurve(3.4, 0.65), from: 0, to: 10, color: PINK }, { pts: [[7, 0], [7, 1.05]], dash: true, color: 'currentColor' }],
    notes: [{ x: 2.3, y: 1.03, text: 'T₁' }, { x: 3.6, y: 0.7, text: 'T₂' }, { x: 7.15, y: 0.95, text: 'Eₐ' }],
    alt: 'Distributions of collision energies for one reaction mixture at two temperatures, T1 and T2. The T1 curve is taller with a peak at lower energy. The T2 curve is lower, broader, and shifted to higher energies. A dashed vertical line marks the activation energy, far to the right; the area under the T2 curve beyond this line is much larger than under the T1 curve' }),
};

const source = chem(String.raw`
@ 1 | c | Photoelectron spectroscopy | pes
Which element produced the photoelectron spectrum shown?
* Sodium
- Neon
- Magnesium
- Aluminum
= The peaks correspond to ce{1s^2 2s^2 2p^6 3s^1}: two, two, six, and one electrons. That is 11 electrons, so the element is sodium. Neon lacks the 3s peak, and magnesium would have a 3s peak of height 2.

@ 1 | q | Photoelectron spectroscopy | pes
Based on the spectrum, approximately what is the first ionization energy of the element, in kJ/mol?
* \(500\text{ kJ/mol}\)
- \(3670\text{ kJ/mol}\)
- \(104{,}000\text{ kJ/mol}\)
- \(6840\text{ kJ/mol}\)
= The first electron removed is the least tightly held, the 3s electron, with a binding energy of \(0.50\text{ MJ/mol}=500\text{ kJ/mol}\).

@ 1 | c | Photoelectron spectroscopy | pes
Why is the peak at \(3.67\text{ MJ/mol}\) three times as tall as the peak at \(6.84\text{ MJ/mol}\)?
* It represents six 2p electrons, while the other peak represents two 2s electrons.
- The 2p electrons are three times as far from the nucleus.
- The 2p electrons experience three times the nuclear charge.
- The 2p subshell is filled before the 2s subshell.
= Peak height is proportional to the number of electrons with that binding energy. The 2p subshell holds six electrons and the 2s subshell two.

@ 1 | c | Photoelectron spectroscopy | pes
The spectrum of magnesium is compared with the spectrum shown. Which describes how it differs?
* Every peak is at a higher binding energy, and the lowest-energy peak is twice as tall.
- Every peak is at a lower binding energy, and the lowest-energy peak is twice as tall.
- The peaks are at the same binding energies, but there is an additional peak.
- Only the lowest-energy peak changes, shifting to a lower binding energy.
= Magnesium has one more proton, so every electron feels a greater attraction to the nucleus and has a higher binding energy. Its 3s subshell holds two electrons instead of one.

@ 1 | q | Mass spectrometry | massSpec
What is the average atomic mass of element X?
* \(24.32\text{ amu}\)
- \(25.00\text{ amu}\)
- \(24.00\text{ amu}\)
- \(24.79\text{ amu}\)
= The weighted average is \(24(0.79)+25(0.10)+26(0.11)=18.96+2.50+2.86=24.32\). The unweighted mean of the three masses is \(25.00\).

@ 1 | c | Mass spectrometry | massSpec
Which statement best explains why the average atomic mass of element X is not a whole number?
* The element exists as a mixture of isotopes with different numbers of neutrons, and the average is weighted by abundance.
- Protons and neutrons have masses that are not whole numbers.
- Some atoms of X have lost electrons in the mass spectrometer.
- Atoms of X have different numbers of protons.
= All atoms of an element have the same number of protons. Isotopes differ in neutrons, so a sample's average mass falls between the isotope masses, closest to the most abundant one.

@ 1 | c | Ionization energy | ionization
Based on the successive ionization energies in the table, element Z is most likely in which group of the periodic table?
* Group 13
- Group 2
- Group 14
- Group 1
= The large jump occurs between the third and fourth ionization energies. Z has three valence electrons, and the fourth electron must come from a filled inner shell, much closer to the nucleus. Element Z is aluminum.

@ 1 | c | Ionization energy | ionization
Based on the table, what is the most likely formula of the compound formed between element Z and oxygen?
* ce{Z2O3}
- ce{ZO}
- ce{Z3O2}
- ce{ZO2}
= Z loses three electrons to form ce{Z^3+}, and oxygen gains two to form ce{O^2-}. Two ce{Z^3+} ions balance three ce{O^2-} ions.

@ 1 | c | Periodic trends
The first ionization energy of oxygen is lower than that of nitrogen, even though oxygen has a greater nuclear charge. Which best explains this?
* In oxygen, the electron removed is paired in a 2p orbital, and repulsion between the paired electrons makes it easier to remove.
- Oxygen's valence electrons are in a higher energy level than nitrogen's.
- Oxygen has a larger atomic radius than nitrogen.
- Nitrogen's electron is removed from a 2s orbital.
= Nitrogen's three 2p electrons are each alone in an orbital. Oxygen's fourth 2p electron shares an orbital, and the added electron–electron repulsion slightly outweighs the increased nuclear charge.

@ 1 | c | Periodic trends
Which of the following species has the largest radius: ce{S^2-}, ce{Cl^-}, ce{K^+}, or ce{Ca^2+}?
* ce{S^2-}
- ce{Cl^-}
- ce{K^+}
- ce{Ca^2+}
= All four are isoelectronic, with 18 electrons. ce{S^2-} has the fewest protons, 16, so its electrons are held least tightly and it is largest.

@ 1 | c | Electron configuration
What is the ground-state electron configuration of ce{Fe^3+}?
* ce{[Ar] 3d^5}
- ce{[Ar] 4s^2 3d^3}
- ce{[Ar] 4s^1 3d^4}
- ce{[Ar] 3d^6}
= Iron is ce{[Ar] 4s^2 3d^6}. Transition metals lose their 4s electrons before their 3d electrons, so removing three electrons leaves ce{3d^5}.

@ 1 | q | Mass percent
What is the mass percent of nitrogen in ammonium sulfate, ce{(NH4)2SO4} (molar mass \(132.14\text{ g/mol}\))?
* \(21.2\%\)
- \(10.6\%\)
- \(30.3\%\)
- \(24.2\%\)
= Each formula unit contains two nitrogen atoms: \(\dfrac{2(14.01)}{132.14}\approx 21.2\%\). Counting only one nitrogen gives \(10.6\%\).

@ 1 | q | Empirical and molecular formulas
A compound is \(40.0\%\) carbon, \(6.7\%\) hydrogen, and \(53.3\%\) oxygen by mass, and its molar mass is \(180\text{ g/mol}\). What is its molecular formula?
* ce{C6H12O6}
- ce{CH2O}
- ce{C3H6O3}
- ce{C6H6O6}
= In \(100\text{ g}\): \(3.33\text{ mol C}\), \(6.6\text{ mol H}\), and \(3.33\text{ mol O}\), a ratio of 1:2:1, so the empirical formula is ce{CH2O} (\(30\text{ g/mol}\)). Since \(\tfrac{180}{30}=6\), the molecular formula is ce{C6H12O6}.

@ 1 | q | Moles and particles
How many oxygen atoms are in \(4.40\text{ g}\) of ce{CO2}?
* \(1.20\times 10^{23}\)
- \(6.02\times 10^{22}\)
- \(2.65\times 10^{24}\)
- \(1.20\times 10^{24}\)
= \(4.40\text{ g}\) is \(0.100\text{ mol}\) of ce{CO2}, which contains \(0.200\text{ mol}\) of O atoms, or \(0.200(6.02\times 10^{23})=1.20\times 10^{23}\) atoms.

@ 1 | q | Empirical formulas
Complete combustion of a hydrocarbon produces \(0.880\text{ g}\) of ce{CO2} and \(0.360\text{ g}\) of ce{H2O}. What is the empirical formula of the hydrocarbon?
* ce{CH2}
- ce{CH4}
- ce{CH}
- ce{C2H3}
= Moles of C equal moles of ce{CO2}: \(\tfrac{0.880}{44.01}=0.0200\). Moles of H are twice the moles of water: \(2\left(\tfrac{0.360}{18.02}\right)=0.0400\). The ratio is 1:2.

@ 1 | q | Composition of mixtures
A \(1.00\text{ g}\) sample of impure calcium carbonate is heated, and all of the ce{CaCO3} decomposes: ce{CaCO3(s) -> CaO(s) + CO2(g)}. The sample loses \(0.396\text{ g}\) as ce{CO2}, and the impurities do not react. What is the mass percent of ce{CaCO3} in the sample?
* \(90.0\%\)
- \(39.6\%\)
- \(60.4\%\)
- \(100\%\)
= \(\tfrac{0.396}{44.01}=0.00900\text{ mol}\) ce{CO2}, which came from \(0.00900\text{ mol}\) of ce{CaCO3}, or \(0.00900(100.09)=0.900\text{ g}\).

@ 1 | c | Ionization energy
Which atom has the greatest second ionization energy: Na, Mg, Al, or Si?
* Na
- Mg
- Al
- Si
= The second electron removed from sodium comes from the filled \(n=2\) shell, much closer to the nucleus and poorly shielded. The others lose a second valence electron.

@ 1 | c | Periodic trends and bonding
Selenium is in the same group as sulfur. What is the formula of the compound formed between aluminum and selenium?
* ce{Al2Se3}
- ce{AlSe}
- ce{Al3Se2}
- ce{AlSe2}
= Elements in the same group have the same number of valence electrons, so selenium forms ce{Se^2-} like ce{S^2-}. With ce{Al^3+}, charge balance requires ce{Al2Se3}, matching ce{Al2S3}.

@ 1 | q | Electron configuration
How many unpaired electrons are in a ground-state ce{Mn^2+} ion?
* \(5\)
- \(3\)
- \(7\)
- \(1\)
= Manganese is ce{[Ar] 4s^2 3d^5}; losing the two 4s electrons leaves ce{3d^5}. By Hund's rule, each of the five d orbitals holds one electron.

@ 1 | q | Atomic structure
How many neutrons and electrons are in \(^{56}_{26}\mathrm{Fe}^{3+}\)?
* 30 neutrons and 23 electrons
- 26 neutrons and 23 electrons
- 30 neutrons and 29 electrons
- 56 neutrons and 26 electrons
= Neutrons equal the mass number minus the atomic number, \(56-26=30\). The 3+ charge means three fewer electrons than protons.

@ 1 | q | Moles
Which sample contains the greatest number of atoms?
* \(18.0\text{ g}\) of ce{H2O}
- \(1.0\text{ g}\) of ce{H2}
- \(32.0\text{ g}\) of ce{O2}
- \(4.0\text{ g}\) of He
= \(18.0\text{ g}\) of water is \(1.00\text{ mol}\) of molecules and \(3.00\text{ mol}\) of atoms. The others contain \(1.0\), \(2.00\), and \(1.0\text{ mol}\) of atoms.

@ 1 | c | Coulomb's law
In a photoelectron spectrum, the 1s peak of oxygen appears at a higher binding energy than the 1s peak of nitrogen. Which best explains this?
* Oxygen has more protons, so its 1s electrons are attracted more strongly to the nucleus.
- Oxygen's 1s electrons are farther from the nucleus.
- Oxygen has more 1s electrons than nitrogen.
- Oxygen's valence electrons shield the 1s electrons from the nucleus.
= Both 1s subshells hold two electrons at nearly the same distance, with essentially no shielding. The greater nuclear charge of oxygen increases the Coulombic attraction.

@ 2 | c | Potential energy and bonding | peCurve
Which statement about the molecules represented by curves A and B is correct?
* A has the stronger and shorter bond.
- B has the stronger and shorter bond.
- A has the stronger but longer bond.
- B has the stronger but shorter bond.
= The depth of each minimum is the bond energy, and its position is the bond length. Curve A's minimum is deeper, \(-436\text{ kJ/mol}\), and occurs at a shorter distance, 74 pm.

@ 2 | c | Potential energy and bonding | peCurve
Why does the potential energy rise steeply at very short internuclear distances on both curves?
* The positively charged nuclei repel each other strongly when they are forced close together.
- The electrons are no longer attracted to either nucleus.
- The bond breaks and the atoms separate.
- The atoms gain kinetic energy.
= At distances shorter than the bond length, nucleus–nucleus and electron–electron repulsions dominate the attractions, so energy rises sharply.

@ 2 | q | Potential energy and bonding | peCurve
How much energy is needed to break one mole of the bonds represented by curve B, separating the atoms completely?
* \(242\text{ kJ}\)
- \(199\text{ kJ}\)
- \(436\text{ kJ}\)
- \(678\text{ kJ}\)
= Separating the atoms raises the energy from the minimum, \(-242\text{ kJ/mol}\), to \(0\) at large distances. The value 199 is the bond length in picometers.

@ 2 | c | Lattice energy
Which compound has the greatest lattice energy: NaF, NaCl, KBr, or MgO?
* MgO
- NaF
- NaCl
- KBr
= Coulombic attraction is proportional to the product of the charges and inversely related to the distance between ions. MgO has charges of \(2+\) and \(2-\), quadrupling the product, and its ions are small.

@ 2 | c | Ionic solids
Sodium chloride melts at \(801^\circ\text{C}\), and cesium iodide melts at \(632^\circ\text{C}\). Which best explains the difference?
* ce{Na^+} and ce{Cl^-} are smaller than ce{Cs^+} and ce{I^-}, so they are closer together and attract each other more strongly.
- NaCl has a greater difference in electronegativity.
- CsI contains covalent bonds that break more easily.
- ce{Cs^+} and ce{I^-} have greater charges.
= The charges are the same in both compounds, so the difference comes from ionic radius. Smaller ions sit closer together, giving stronger Coulombic attraction and a higher melting point.

@ 2 | c | Alloys | alloys
Steel is made by adding small amounts of carbon to iron. Which diagram better represents steel, and how does the carbon change the metal?
* X; the carbon atoms fill spaces in the lattice, making the alloy harder and less malleable than iron.
- Y; the carbon atoms replace iron atoms, making the alloy softer.
- X; the carbon atoms make the alloy more malleable by spreading the iron atoms apart.
- Y; carbon atoms are similar in size to iron atoms.
= Carbon atoms are much smaller than iron atoms and occupy interstitial spaces. They interfere with layers of iron atoms sliding past one another, which makes steel harder and less malleable.

@ 2 | c | Alloys | alloys
Brass is an alloy of copper and zinc. Which diagram better represents brass, and why?
* Y, because copper and zinc atoms have similar radii, so zinc atoms can replace copper atoms in the lattice.
- X, because zinc atoms are much smaller than copper atoms.
- Y, because zinc forms ionic bonds with copper.
- X, because zinc atoms fill the spaces between copper atoms.
= Substitutional alloys form when the atoms of the two metals are close in size, as copper and zinc are. Atoms of one element take the places of atoms of the other.

@ 2 | c | Metallic bonding
Which statement best explains why metals conduct electricity in the solid state?
* Their valence electrons are delocalized and free to move throughout the lattice of metal cations.
- Their ions are free to move through the solid.
- They contain no electrons in their outer shells.
- Their atoms are held together by strong covalent bonds.
= In the electron-sea model, valence electrons are shared among all of the cations and move freely, carrying current. Ionic solids conduct only when melted or dissolved, when their ions can move.

@ 2 | c | Ionic solids
A solid has a high melting point, is brittle, and does not conduct electricity, but it conducts when melted. Which type of solid is it most likely to be?
* Ionic
- Metallic
- Network covalent
- Molecular
= Ionic solids have strong Coulombic attractions, so they melt at high temperatures and shatter when layers shift and like charges meet. Their ions conduct only when free to move.

@ 2 | c | VSEPR
What is the molecular geometry of ce{SF4}?
* Seesaw
- Tetrahedral
- Square planar
- Trigonal pyramidal
= Sulfur has four bonding pairs and one lone pair, five electron domains in a trigonal bipyramidal arrangement. The lone pair occupies an equatorial position, giving a seesaw shape.

@ 2 | c | VSEPR and polarity
What are the molecular geometry and polarity of ce{XeF4}?
* Square planar and nonpolar
- Tetrahedral and nonpolar
- Seesaw and polar
- Square pyramidal and polar
= Xenon has four bonding pairs and two lone pairs. The lone pairs sit opposite each other in an octahedral arrangement, leaving a square planar shape in which the bond dipoles cancel.

@ 2 | c | Molecular polarity
Which molecule is polar?
* ce{NF3}
- ce{BF3}
- ce{CO2}
- ce{CCl4}
= ce{NF3} is trigonal pyramidal because of the lone pair on nitrogen, so its bond dipoles do not cancel. The other molecules are symmetric, and their bond dipoles cancel.

@ 2 | c | VSEPR
Which lists ce{CH4}, ce{NH3}, and ce{H2O} in order of decreasing H–X–H bond angle?
* ce{CH4} > ce{NH3} > ce{H2O}
- ce{H2O} > ce{NH3} > ce{CH4}
- ce{NH3} > ce{CH4} > ce{H2O}
- All three angles are equal.
= All three have four electron domains. Lone pairs repel more strongly than bonding pairs, compressing the bond angles: about \(109.5^\circ\), \(107^\circ\), and \(104.5^\circ\).

@ 2 | c | Hybridization
What is the hybridization of the carbon atom in HCN and of the carbon atom in formaldehyde, ce{H2CO}?
* sp in HCN and sp2 in ce{H2CO}
- sp2 in HCN and sp3 in ce{H2CO}
- sp3 in both
- sp in both
= Carbon in HCN has two electron domains, a single bond and a triple bond, so it is sp. Carbon in formaldehyde has three domains, two single bonds and a double bond, so it is sp2.

@ 2 | q | Sigma and pi bonds
How many sigma bonds and pi bonds are in acrylonitrile, \(\mathrm{CH_2{=}CH{-}C{\equiv}N}\)?
* 6 sigma and 3 pi
- 6 sigma and 2 pi
- 9 sigma and 0 pi
- 7 sigma and 3 pi
= There are three C–H bonds, the C=C double bond, the C–C single bond, and the triple bond. Each bond contains one sigma bond, for a total of 6. The double bond adds one pi bond and the triple bond two.

@ 2 | q | Formal charge
In the Lewis structure of the nitrate ion, ce{NO3^-}, what is the formal charge on the nitrogen atom?
* \(+1\)
- \(0\)
- \(-1\)
- \(+2\)
= Nitrogen has four bonds, from one double and two single bonds, and no lone pairs: \(5-0-\tfrac{8}{2}=+1\). The single-bonded oxygen atoms each carry \(-1\), giving the ion's overall \(-1\) charge.

@ 2 | c | Resonance
In the carbonate ion, ce{CO3^2-}, how do the three carbon–oxygen bonds compare?
* All three have the same length, between that of a single and a double bond.
- One is shorter than the other two.
- All three are double bonds.
- They alternate between single and double bonds over time.
= Carbonate has three resonance structures. The actual ion is a single hybrid in which each bond has a bond order of \(\tfrac{4}{3}\), so all three bonds are identical.

@ 2 | c | Bond length
Which lists the carbon–oxygen bond length in CO, ce{CO2}, and ce{CO3^2-} from shortest to longest?
* CO < ce{CO2} < ce{CO3^2-}
- ce{CO3^2-} < ce{CO2} < CO
- ce{CO2} < CO < ce{CO3^2-}
- All are equal.
= Bond orders are 3 in CO, 2 in ce{CO2}, and \(\tfrac{4}{3}\) in carbonate. Higher bond order means more shared electrons and a shorter bond.

@ 2 | c | Expanded octets
ce{PCl5} exists, but ce{NCl5} does not. Which statement best explains this?
* Nitrogen is in the second period and is too small to accommodate more than four electron domains around it.
- Nitrogen has fewer valence electrons than phosphorus.
- Nitrogen is more electronegative than chlorine.
- Phosphorus has a smaller atomic radius than nitrogen.
= Atoms from the third period and beyond, such as phosphorus, can be surrounded by more than eight electrons. Second-period atoms are limited to an octet.

@ 2 | c | Network covalent solids
Silicon dioxide melts above \(1600^\circ\text{C}\), while carbon dioxide sublimes at \(-78^\circ\text{C}\). Which best explains the difference?
* ce{SiO2} is a network covalent solid held together by covalent bonds throughout, while ce{CO2} molecules are held together only by weak London dispersion forces.
- ce{SiO2} is ionic, and ce{CO2} is metallic.
- ce{CO2} contains double bonds, which are weaker than single bonds.
- Silicon is less electronegative than carbon.
= Melting ce{SiO2} requires breaking strong covalent bonds, while subliming ce{CO2} only overcomes intermolecular forces between nonpolar molecules.

@ 2 | c | Molecular polarity
Which statement about ce{CH2Cl2} and ce{CCl4} is correct?
* ce{CH2Cl2} is polar and ce{CCl4} is nonpolar, although both are tetrahedral.
- Both are nonpolar because both are tetrahedral.
- Both are polar because C–Cl bonds are polar.
- ce{CCl4} is polar and ce{CH2Cl2} is nonpolar.
= In ce{CCl4}, four identical bond dipoles cancel. In ce{CH2Cl2}, the C–Cl and C–H dipoles differ, so the molecule has a net dipole.

@ 2 | c | Lewis structures
Which species has an odd number of valence electrons and therefore cannot have every atom with a complete octet?
* ce{NO2}
- ce{CO2}
- ce{SO2}
- ce{O3}
= ce{NO2} has \(5+2(6)=17\) valence electrons. With an odd number, at least one atom must have an unpaired electron.

@ 3 | c | Intermolecular forces | vapor
Which liquid shown has the strongest intermolecular forces?
* C
- A
- B
- All three are equal at their boiling points.
= Stronger intermolecular forces lower the vapor pressure at any temperature and raise the boiling point. Liquid C has the lowest vapor pressure and the highest normal boiling point, \(100^\circ\text{C}\).

@ 3 | q | Vapor pressure | vapor
According to the graph, at about what temperature does liquid B boil when the external pressure is \(50\text{ kPa}\)?
* About \(60^\circ\text{C}\)
- About \(78^\circ\text{C}\)
- About \(40^\circ\text{C}\)
- About \(85^\circ\text{C}\)
= A liquid boils when its vapor pressure equals the external pressure. Curve B reaches \(50\text{ kPa}\) near \(60^\circ\text{C}\); at lower external pressure, the boiling point is lower.

@ 3 | c | Vapor pressure | vapor
At \(25^\circ\text{C}\), which liquid shown evaporates most readily, and why?
* A, because its molecules are held by the weakest intermolecular forces, so more of them can escape the liquid
- C, because its molecules have the most kinetic energy
- B, because it has an intermediate boiling point
- All evaporate equally, because they are at the same temperature
= At the same temperature, molecules of all three liquids have the same average kinetic energy. The fraction with enough energy to overcome the attractions is largest for the liquid with the weakest attractions.

@ 3 | c | Kinetic molecular theory | mb
The graph shows speed distributions for helium and nitrogen at the same temperature. Which gas is represented by curve Y, and why?
* Helium, because at the same temperature lighter molecules have higher speeds
- Nitrogen, because heavier molecules move faster
- Helium, because helium has a higher average kinetic energy
- Nitrogen, because its curve is broader
= At the same temperature, both gases have the same average kinetic energy, \(\tfrac{1}{2}mv^2\). Helium's much smaller mass gives it higher speeds and a broader distribution.

@ 3 | q | Ideal gas law
A gas has a density of \(1.25\text{ g/L}\) at \(273\text{ K}\) and \(1.00\text{ atm}\). Which gas could it be? Use \(R=0.08206\text{ L}\cdot\text{atm/(mol}\cdot\text{K)}\).
* ce{N2}
- ce{O2}
- ce{CO2}
- ce{CH4}
= \(M=\dfrac{dRT}{P}=\dfrac{(1.25)(0.08206)(273)}{1.00}\approx 28.0\text{ g/mol}\), the molar mass of ce{N2}.

@ 3 | q | Partial pressure | gasMix
The total pressure of the gas mixture shown is \(2.0\text{ atm}\). What is the partial pressure of gas X?
* \(1.2\text{ atm}\)
- \(0.80\text{ atm}\)
- \(1.0\text{ atm}\)
- \(6.0\text{ atm}\)
= The mole fraction of X is \(\tfrac{6}{10}=0.60\), so \(P_X=0.60(2.0)=1.2\text{ atm}\). The larger size of the Y particles does not affect partial pressure in an ideal gas.

@ 3 | c | Real gases
Under which conditions does a sample of ammonia deviate most from ideal gas behavior?
* High pressure and low temperature
- Low pressure and high temperature
- Low pressure and low temperature
- High pressure and high temperature
= At high pressure the volume of the molecules themselves becomes significant, and at low temperature the attractions between molecules, including hydrogen bonds in ammonia, have a larger effect.

@ 3 | q | Kinetic molecular theory
At the same temperature, how does the average speed of ce{H2} molecules compare with the average speed of ce{O2} molecules?
* It is 4 times as great.
- It is 16 times as great.
- It is 2 times as great.
- It is the same.
= Average speed is proportional to \(\dfrac{1}{\sqrt{M}}\). The ratio is \(\sqrt{\tfrac{32}{2}}=4\).

@ 3 | q | Solutions
What is the molarity of a solution made by dissolving \(5.85\text{ g}\) of NaCl in enough water to make \(250.0\text{ mL}\) of solution?
* \(0.400\text{ M}\)
- \(0.100\text{ M}\)
- \(0.0234\text{ M}\)
- \(23.4\text{ M}\)
= \(\tfrac{5.85}{58.44}=0.100\text{ mol}\), and \(\tfrac{0.100\text{ mol}}{0.2500\text{ L}}=0.400\text{ M}\).

@ 3 | q | Dilution
A student dilutes \(25.0\text{ mL}\) of \(6.0\text{ M}\) HCl to a total volume of \(150.0\text{ mL}\). What is the concentration of the diluted solution?
* \(1.0\text{ M}\)
- \(36\text{ M}\)
- \(0.17\text{ M}\)
- \(1.2\text{ M}\)
= Moles are conserved: \(M_2=\dfrac{(6.0)(25.0)}{150.0}=1.0\text{ M}\). Adding \(150\text{ mL}\) of water, rather than diluting to \(150\text{ mL}\) total, would give about \(0.86\text{ M}\).

@ 3 | q | Beer–Lambert law | beer
A solution of the same dye has an absorbance of \(0.63\) under the same conditions. What is its concentration?
* \(0.35\text{ M}\)
- \(0.63\text{ M}\)
- \(1.13\text{ M}\)
- \(0.28\text{ M}\)
= The calibration line gives \(A=1.8c\), so \(c=\dfrac{0.63}{1.8}=0.35\text{ M}\).

@ 3 | c | Beer–Lambert law | beer
A student's cuvette has fingerprints on it when the unknown solution is measured, but not when the calibration standards were measured. How does this affect the calculated concentration?
* It is too high, because the fingerprints absorb or scatter light and increase the measured absorbance.
- It is too low, because fingerprints reduce absorbance.
- It is unaffected, because concentration does not depend on the cuvette.
- It is unaffected, because the calibration line passes through the origin.
= The spectrophotometer attributes all lost light to the solution. A falsely high absorbance, read on the calibration line, gives a falsely high concentration.

@ 3 | q | Chromatography | chrom
What is the retention factor, \(R_f\), of component B?
* \(0.65\)
- \(0.20\)
- \(1.5\)
- \(6.5\)
= \(R_f=\dfrac{\text{distance traveled by the spot}}{\text{distance traveled by the solvent}}=\dfrac{6.5}{10.0}=0.65\).

@ 3 | c | Chromatography | chrom
The paper is polar, and the solvent is nonpolar. Which conclusion about components A and B is supported by the chromatogram?
* A is more polar than B, because it is attracted more strongly to the polar paper and moves less.
- B is more polar than A, because it travels farther.
- A has a greater molar mass than B.
- A and B have the same polarity, because they started together.
= Components that interact strongly with the stationary phase move slowly. Polar A is held by the polar paper, while less polar B dissolves well in the nonpolar solvent and travels farther.

@ 3 | c | Intermolecular forces
Pentane and 2,2-dimethylpropane both have the formula ce{C5H12}. Pentane boils at \(36^\circ\text{C}\), and 2,2-dimethylpropane boils at \(10^\circ\text{C}\). Which best explains this?
* The straight-chain shape of pentane allows greater surface contact, producing stronger London dispersion forces.
- Pentane forms hydrogen bonds, and 2,2-dimethylpropane does not.
- Pentane has more electrons than 2,2-dimethylpropane.
- 2,2-dimethylpropane is more polar.
= The molecules have the same number of electrons and are both nonpolar. Compact, branched molecules have less surface area for dispersion attractions than long chains.

@ 3 | c | Intermolecular forces
Acetone, ce{(CH3)2CO}, mixes completely with water. Which statement best explains this?
* The oxygen atom of acetone can accept hydrogen bonds from water molecules.
- Acetone molecules form hydrogen bonds with each other.
- Acetone is ionic and dissociates in water.
- Acetone is nonpolar, like water.
= Acetone has no H bonded to N, O, or F, so it cannot hydrogen-bond with itself. Its polar carbonyl oxygen, however, can accept hydrogen bonds from water.

@ 3 | c | Solubility
Iodine, ce{I2}, dissolves much more readily in carbon tetrachloride than in water. Which best explains this?
* Both ce{I2} and ce{CCl4} are nonpolar, so the dispersion forces between them are similar to those within each pure substance.
- ce{I2} forms hydrogen bonds with ce{CCl4}.
- Water is nonpolar, and ce{I2} is polar.
- ce{I2} reacts with ce{CCl4}.
= Dissolving iodine in water would require breaking water's strong hydrogen bonds and replacing them with weaker attractions. Iodine and ce{CCl4} have comparable attractions, so mixing is favorable.

@ 3 | q | Photon energy
What is the energy of a photon of light with a wavelength of \(500\text{ nm}\)? Use \(h=6.626\times 10^{-34}\text{ J}\cdot\text{s}\) and \(c=3.00\times 10^8\text{ m/s}\).
* \(3.98\times 10^{-19}\text{ J}\)
- \(3.98\times 10^{-28}\text{ J}\)
- \(1.10\times 10^{-48}\text{ J}\)
- \(9.94\times 10^{-26}\text{ J}\)
= \(E=\dfrac{hc}{\lambda}=\dfrac{(6.626\times 10^{-34})(3.00\times 10^8)}{500\times 10^{-9}}=3.98\times 10^{-19}\text{ J}\). Forgetting to convert nanometers to meters gives \(3.98\times 10^{-28}\).

@ 3 | c | Spectroscopy
Which type of electromagnetic radiation is most likely to cause electronic transitions in molecules?
* Ultraviolet and visible light
- Infrared radiation
- Microwave radiation
- Radio waves
= UV and visible photons have energies matching electronic transitions. Infrared radiation excites molecular vibrations, and microwaves excite rotations.

@ 3 | c | Intermolecular forces
Water, ce{H2O}, boils at \(100^\circ\text{C}\), while hydrogen sulfide, ce{H2S}, boils at \(-60^\circ\text{C}\), although ce{H2S} has more electrons. Which best explains this?
* Water molecules form hydrogen bonds, which are much stronger than the dipole–dipole and dispersion forces in ce{H2S}.
- Water has stronger covalent O–H bonds that must break when it boils.
- ce{H2S} is nonpolar.
- Water has stronger London dispersion forces.
= Boiling separates molecules without breaking covalent bonds. Hydrogen bonding, possible because oxygen is small and highly electronegative, outweighs the larger dispersion forces of ce{H2S}.

@ 4 | c | Net ionic equations | precipitate
Aqueous solutions of silver nitrate and sodium chloride are mixed, and the particle diagram shows the result. Which is the net ionic equation?
* ce{Ag^+(aq) + Cl^-(aq) -> AgCl(s)}
- ce{AgNO3(aq) + NaCl(aq) -> AgCl(s) + NaNO3(aq)}
- ce{Na^+(aq) + NO3^-(aq) -> NaNO3(s)}
- ce{Ag^+(aq) + NO3^-(aq) -> AgNO3(s)}
= Only silver and chloride ions combine to form the insoluble product. Sodium and nitrate ions are spectator ions, and sodium nitrate is soluble.

@ 4 | c | Net ionic equations
Which is the net ionic equation for the reaction of acetic acid with sodium hydroxide?
* ce{HC2H3O2(aq) + OH^-(aq) -> C2H3O2^-(aq) + H2O(l)}
- ce{H^+(aq) + OH^-(aq) -> H2O(l)}
- ce{HC2H3O2(aq) + NaOH(aq) -> NaC2H3O2(aq) + H2O(l)}
- ce{C2H3O2^-(aq) + Na^+(aq) -> NaC2H3O2(s)}
= Acetic acid is a weak acid, so it is mostly un-ionized and is written as a molecule. Only strong acids are written as ce{H^+}.

@ 4 | c | Limiting reactant | beforeRxn
The reaction ce{2H2(g) + O2(g) -> 2H2O(g)} goes to completion in the container shown. Which describes the contents afterward?
* Six ce{H2O} molecules and one ce{O2} molecule
- Six ce{H2O} molecules and no reactants
- Four ce{H2O} molecules and two ce{H2} molecules
- Eight ce{H2O} molecules
= Six ce{H2} molecules need only three ce{O2} molecules, so ce{H2} is limiting. Six molecules of water form, and one of the four ce{O2} molecules remains.

@ 4 | q | Stoichiometry
Aluminum reacts with oxygen: ce{4Al(s) + 3O2(g) -> 2Al2O3(s)}. What mass of ce{Al2O3} (molar mass \(101.96\text{ g/mol}\)) forms from \(10.0\text{ g}\) of Al with excess oxygen?
* \(18.9\text{ g}\)
- \(37.8\text{ g}\)
- \(9.45\text{ g}\)
- \(10.0\text{ g}\)
= \(\tfrac{10.0}{26.98}=0.371\text{ mol Al}\), which forms \(\tfrac{2}{4}(0.371)=0.185\text{ mol}\) ce{Al2O3}, or \(18.9\text{ g}\). Ignoring the 2:4 ratio gives \(37.8\text{ g}\).

@ 4 | q | Limiting reactant
What mass of water can form when \(4.0\text{ g}\) of ce{H2} reacts with \(16.0\text{ g}\) of ce{O2}?
* \(18\text{ g}\)
- \(36\text{ g}\)
- \(20\text{ g}\)
- \(9.0\text{ g}\)
= There are \(2.0\text{ mol}\) of ce{H2} and \(0.50\text{ mol}\) of ce{O2}. The hydrogen would need \(1.0\text{ mol}\) of ce{O2}, so ce{O2} is limiting and forms \(1.0\text{ mol}\), or \(18\text{ g}\), of water. Mass is conserved, but \(20\text{ g}\) includes unreacted hydrogen.

@ 4 | q | Percent yield
The theoretical yield of a reaction is \(18.0\text{ g}\), and \(15.3\text{ g}\) of product is recovered. What is the percent yield?
* \(85.0\%\)
- \(118\%\)
- \(15.0\%\)
- \(2.70\%\)
= \(\dfrac{15.3}{18.0}\times 100=85.0\%\). A percent yield above \(100\%\) would suggest a wet or impure product.

@ 4 | q | Acid–base titration
A \(25.00\text{ mL}\) sample of HCl is titrated to the equivalence point with \(18.40\text{ mL}\) of \(0.100\text{ M}\) NaOH. What is the concentration of the HCl?
* \(0.0736\text{ M}\)
- \(0.136\text{ M}\)
- \(0.184\text{ M}\)
- \(0.100\text{ M}\)
= \(\text{mol NaOH}=0.01840(0.100)=1.84\times 10^{-3}\), which equals the moles of HCl. Dividing by \(0.02500\text{ L}\) gives \(0.0736\text{ M}\).

@ 4 | q | Acid–base titration
A \(20.0\text{ mL}\) sample of ce{H2SO4} is completely neutralized by \(30.0\text{ mL}\) of \(0.200\text{ M}\) NaOH. What is the concentration of the ce{H2SO4}?
* \(0.150\text{ M}\)
- \(0.300\text{ M}\)
- \(0.0750\text{ M}\)
- \(0.133\text{ M}\)
= \(6.00\times 10^{-3}\text{ mol}\) of ce{OH^-} neutralizes \(3.00\times 10^{-3}\text{ mol}\) of ce{H2SO4}, which supplies two ce{H^+} per formula unit. Dividing by \(0.0200\text{ L}\) gives \(0.150\text{ M}\).

@ 4 | q | Oxidation numbers
What is the oxidation number of chromium in the dichromate ion, ce{Cr2O7^2-}?
* \(+6\)
- \(+7\)
- \(+3\)
- \(+12\)
= Seven oxygen atoms contribute \(-14\). For a total of \(-2\), the two chromium atoms total \(+12\), so each is \(+6\).

@ 4 | c | Redox reactions
In the reaction ce{Zn(s) + Cu^2+(aq) -> Zn^2+(aq) + Cu(s)}, which species is the oxidizing agent?
* ce{Cu^2+}
- ce{Zn}
- ce{Zn^2+}
- ce{Cu}
= ce{Cu^2+} gains electrons and is reduced, so it oxidizes zinc. The oxidizing agent is the species that is itself reduced.

@ 4 | q | Balancing redox reactions
When ce{MnO4^-(aq) + Fe^2+(aq) -> Mn^2+(aq) + Fe^3+(aq)} is balanced in acidic solution, what is the ratio of ce{MnO4^-} to ce{Fe^2+}?
* \(1:5\)
- \(1:1\)
- \(5:1\)
- \(1:3\)
= Manganese changes from \(+7\) to \(+2\), gaining five electrons, while each iron loses one. Five ce{Fe^2+} ions supply the electrons for one ce{MnO4^-}.

@ 4 | q | Redox titration
In acidic solution, \(15.0\text{ mL}\) of \(0.0200\text{ M}\) ce{KMnO4} is needed to oxidize all of the ce{Fe^2+} in a sample. How many moles of ce{Fe^2+} were in the sample?
* \(1.50\times 10^{-3}\text{ mol}\)
- \(3.00\times 10^{-4}\text{ mol}\)
- \(6.00\times 10^{-5}\text{ mol}\)
- \(7.50\times 10^{-3}\text{ mol}\)
= \(0.0150(0.0200)=3.00\times 10^{-4}\text{ mol}\) of ce{MnO4^-}, and each reacts with five ce{Fe^2+}, giving \(1.50\times 10^{-3}\text{ mol}\).

@ 4 | c | Physical and chemical changes
Which process is a chemical change?
* Iron rusting in moist air
- Water boiling
- Sugar dissolving in tea
- Dry ice subliming
= Rusting forms a new substance, iron oxide, by breaking and forming chemical bonds. The others change only the state or the arrangement of particles, overcoming intermolecular forces.

@ 4 | q | Gas stoichiometry
Calcium carbonate decomposes: ce{CaCO3(s) -> CaO(s) + CO2(g)}. What volume of ce{CO2} forms from \(10.0\text{ g}\) of ce{CaCO3} at \(273\text{ K}\) and \(1.00\text{ atm}\)?
* \(2.24\text{ L}\)
- \(22.4\text{ L}\)
- \(4.48\text{ L}\)
- \(0.224\text{ L}\)
= \(\tfrac{10.0}{100.09}=0.100\text{ mol}\) of ce{CO2}. Then \(V=\dfrac{nRT}{P}=0.100(0.08206)(273)\approx 2.24\text{ L}\).

@ 4 | c | Precipitation reactions
Which pair of aqueous solutions produces a precipitate when mixed?
* ce{Pb(NO3)2} and KI
- NaCl and ce{KNO3}
- ce{NH4Cl} and ce{NaNO3}
- ce{K2SO4} and NaCl
= Lead(II) iodide, ce{PbI2}, is insoluble. All sodium, potassium, ammonium, and nitrate salts are soluble, so the other mixtures contain only dissolved ions.

@ 4 | c | Brønsted–Lowry acids
In the reaction ce{HCO3^-(aq) + H2O(l) <=> CO3^2-(aq) + H3O^+(aq)}, which species are the Brønsted–Lowry acids?
* ce{HCO3^-} and ce{H3O^+}
- ce{H2O} and ce{CO3^2-}
- ce{HCO3^-} and ce{H2O}
- ce{CO3^2-} and ce{H3O^+}
= A Brønsted–Lowry acid donates a proton. ce{HCO3^-} donates one in the forward direction, and ce{H3O^+} donates one in the reverse direction.

@ 4 | q | Gravimetric analysis
All of the chloride in a sample is precipitated as AgCl (molar mass \(143.32\text{ g/mol}\)), giving \(0.287\text{ g}\) of precipitate. What mass of chloride was in the sample?
* \(0.0710\text{ g}\)
- \(0.287\text{ g}\)
- \(0.216\text{ g}\)
- \(0.00200\text{ g}\)
= \(\tfrac{0.287}{143.32}=0.00200\text{ mol}\) of AgCl, containing \(0.00200\text{ mol}\) of Cl, or \(0.00200(35.45)=0.0709\text{ g}\). The value \(0.216\text{ g}\) is the mass of silver.

@ 4 | c | Energy in reactions
Which statement about the energy changes in a chemical reaction is correct?
* Breaking bonds absorbs energy, and forming bonds releases energy.
- Breaking bonds releases energy, and forming bonds absorbs energy.
- Both breaking and forming bonds release energy.
- Only exothermic reactions involve breaking bonds.
= Separating bonded atoms requires energy to overcome their attraction. A reaction is exothermic when more energy is released by forming bonds than is absorbed in breaking them.

@ 4 | c | Representations of reactions
A student writes the reaction of solid magnesium with hydrochloric acid as ce{Mg(s) + 2H^+(aq) -> Mg^2+(aq) + H2(g)}. Which statement about this equation is true?
* It is a balanced net ionic equation for a redox reaction, with charge and atoms conserved.
- It is unbalanced, because the charges differ on the two sides.
- It omits chloride ions, which take part in the reaction.
- It is an acid–base reaction, not a redox reaction.
= Both sides have a charge of \(2+\) and the same atoms. Magnesium is oxidized from 0 to \(+2\), and hydrogen is reduced from \(+1\) to 0; chloride ions are spectators.

@ 5 | q | Rate laws | rates
Based on the data in the table, what is the rate law for the reaction?
* \(\text{rate}=k[\mathrm{A}]^2[\mathrm{B}]\)
- \(\text{rate}=k[\mathrm{A}][\mathrm{B}]\)
- \(\text{rate}=k[\mathrm{A}][\mathrm{B}]^2\)
- \(\text{rate}=k[\mathrm{A}]^2[\mathrm{B}]^3\)
= Doubling [A] (experiments 1 and 2) quadruples the rate, so the reaction is second order in A. Tripling [B] (experiments 1 and 3) triples the rate, so it is first order in B.

@ 5 | q | Rate constants | rates
Based on the data in the table, what is the rate constant, including units?
* \(2.0\ \text{M}^{-2}\text{s}^{-1}\)
- \(0.20\ \text{M}^{-1}\text{s}^{-1}\)
- \(2.0\ \text{M}^{-1}\text{s}^{-1}\)
- \(2.0\times 10^{-3}\ \text{s}^{-1}\)
= From experiment 1: \(k=\dfrac{2.0\times 10^{-3}}{(0.10)^2(0.10)}=2.0\). For a third-order rate law, the units of \(k\) are \(\text{M}^{-2}\text{s}^{-1}\), so that the rate has units of \(\text{M/s}\).

@ 5 | q | Rate laws | rates
Using the rate law from the table, what is the initial rate when \([\mathrm{A}]_0=0.30\text{ M}\) and \([\mathrm{B}]_0=0.20\text{ M}\)?
* \(3.6\times 10^{-2}\text{ M/s}\)
- \(1.2\times 10^{-2}\text{ M/s}\)
- \(1.8\times 10^{-2}\text{ M/s}\)
- \(7.2\times 10^{-2}\text{ M/s}\)
= \(\text{rate}=2.0(0.30)^2(0.20)=0.036\text{ M/s}\). Tripling [A] multiplies the rate by 9 and doubling [B] multiplies it by 2, so the rate is 18 times the rate in experiment 1.

@ 5 | c | Integrated rate laws | lnPlot
What is the order of the reaction with respect to X, based on the graph?
* First order, because ln[X] decreases linearly with time
- Zero order, because the graph is a straight line
- Second order, because the slope is negative
- It cannot be determined from one graph.
= A plot of ln[X] versus time is linear only for a first-order reaction. Zero-order reactions give linear plots of [X] versus time, and second-order reactions give linear plots of \(\tfrac{1}{[X]}\) versus time.

@ 5 | q | Half-life | lnPlot
What is the half-life of the reaction graphed?
* About \(139\text{ s}\)
- About \(200\text{ s}\)
- About \(100\text{ s}\)
- About \(0.0050\text{ s}\)
= The slope is \(\dfrac{-3.0-(-1.0)}{400}=-0.0050\text{ s}^{-1}\), so \(k=0.0050\text{ s}^{-1}\). For a first-order reaction, \(t_{1/2}=\dfrac{\ln 2}{k}=\dfrac{0.693}{0.0050}\approx 139\text{ s}\).

@ 5 | c | Integrated rate laws
For a second-order reaction with rate law \(\text{rate}=k[\mathrm{A}]^2\), which plot gives a straight line?
* \(\dfrac{1}{[\mathrm{A}]}\) versus time, with a slope of \(k\)
- \(\ln[\mathrm{A}]\) versus time, with a slope of \(-k\)
- \([\mathrm{A}]\) versus time, with a slope of \(-k\)
- \([\mathrm{A}]^2\) versus time, with a slope of \(k\)
= The integrated rate law for second order is \(\dfrac{1}{[\mathrm{A}]}=kt+\dfrac{1}{[\mathrm{A}]_0}\), a line with slope \(k\).

@ 5 | q | Half-life
A first-order reaction has a half-life of \(20\text{ min}\). What percentage of the reactant remains after \(1.0\text{ hour}\)?
* \(12.5\%\)
- \(25\%\)
- \(33\%\)
- \(0\%\)
= One hour is three half-lives, so \(\left(\tfrac{1}{2}\right)^3=12.5\%\) remains. A first-order half-life does not depend on concentration.

@ 5 | c | Reaction mechanisms | profile
Which step of the mechanism represented in the diagram is rate-determining, and what is I?
* Step 1, because it has the higher activation energy; I is a reaction intermediate.
- Step 2, because it comes last; I is a catalyst.
- Step 1, because it is exothermic; I is a transition state.
- Step 2, because it has the higher activation energy; I is a product.
= The slow step has the largest energy barrier from its starting point: about \(91\text{ kJ/mol}\) for step 1 compared with about \(26\text{ kJ/mol}\) for step 2. I is formed in step 1 and used up in step 2.

@ 5 | q | Energy profiles | profile
According to the diagram, what are the activation energy of the forward reaction's first step and the overall enthalpy change of the reaction?
* About \(91\text{ kJ/mol}\) and about \(-40\text{ kJ/mol}\)
- About \(46\text{ kJ/mol}\) and about \(+40\text{ kJ/mol}\)
- About \(131\text{ kJ/mol}\) and about \(-40\text{ kJ/mol}\)
- About \(91\text{ kJ/mol}\) and about \(+20\text{ kJ/mol}\)
= Step 1 rises from the reactants at \(0\) to the first peak at about \(91\text{ kJ/mol}\). The products are about \(40\text{ kJ/mol}\) below the reactants, so the reaction is exothermic.

@ 5 | c | Catalysis
Which effect does a catalyst have on a reaction?
* It provides an alternative pathway with a lower activation energy, speeding up both the forward and reverse reactions without changing \(\Delta H\).
- It lowers \(\Delta H\), making the reaction more exothermic.
- It shifts the equilibrium toward products.
- It increases the kinetic energy of the reactant molecules.
= A catalyst changes the mechanism, not the starting or ending energies. Because both directions are sped up equally, the equilibrium constant is unchanged.

@ 5 | c | Reaction mechanisms
The reaction ce{2NO(g) + O2(g) -> 2NO2(g)} has the rate law \(\text{rate}=k[\mathrm{NO}]^2[\mathrm{O_2}]\). Which mechanism is consistent with this rate law?
* Step 1, fast equilibrium: ce{2NO <=> N2O2}; step 2, slow: ce{N2O2 + O2 -> 2NO2}
- Step 1, slow: ce{NO + O2 -> NO3}; step 2, fast: ce{NO3 + NO -> 2NO2}
- Step 1, slow: ce{2NO -> N2O2}; step 2, fast: ce{N2O2 + O2 -> 2NO2}
- A single step: ce{NO + O2 -> NO2 + O}
= The slow step gives \(\text{rate}=k_2[\mathrm{N_2O_2}][\mathrm{O_2}]\). From the fast equilibrium, \([\mathrm{N_2O_2}]\) is proportional to \([\mathrm{NO}]^2\), so the rate law becomes \(k[\mathrm{NO}]^2[\mathrm{O_2}]\). The third mechanism's slow step would give \(k[\mathrm{NO}]^2\).

@ 5 | c | Collision model | mbEa
Which statement best explains, using the diagram, why the reaction is much faster at \(T_2\) than at \(T_1\)?
* A much larger fraction of collisions at \(T_2\) has energy equal to or greater than the activation energy.
- The activation energy is lower at \(T_2\).
- The number of molecules is greater at \(T_2\).
- Collisions at \(T_2\) are always correctly oriented.
= Raising the temperature shifts the distribution to higher energies. Because the activation energy lies far out in the tail, a modest shift greatly increases the area beyond \(E_a\).

@ 5 | c | Collision model
Two molecules collide with more than enough energy to react, but no reaction occurs. Which best explains this?
* The molecules were not oriented correctly when they collided.
- The temperature was too low.
- The activation energy was too high.
- A catalyst was absent.
= An effective collision requires both sufficient energy and the proper orientation, so that the atoms that form new bonds come into contact.

@ 5 | q | Rates of reaction
For ce{2N2O5(g) -> 4NO2(g) + O2(g)}, ce{N2O5} is consumed at \(0.020\text{ M/s}\). At what rate is ce{NO2} produced?
* \(0.040\text{ M/s}\)
- \(0.020\text{ M/s}\)
- \(0.010\text{ M/s}\)
- \(0.080\text{ M/s}\)
= The coefficients show that four ce{NO2} form for every two ce{N2O5} consumed, so ce{NO2} forms twice as fast.

@ 5 | c | Elementary reactions
The elementary step ce{NO2 + CO -> NO + CO2} occurs in a single collision. What is its rate law?
* \(\text{rate}=k[\mathrm{NO_2}][\mathrm{CO}]\)
- \(\text{rate}=k[\mathrm{NO}][\mathrm{CO_2}]\)
- \(\text{rate}=k[\mathrm{NO_2}]^2\)
- It cannot be determined without experimental data.
= For an elementary step only, the rate law follows from the molecularity. A bimolecular collision between ce{NO2} and CO is first order in each.

@ 5 | c | Pseudo-first-order reactions
The rate law for a reaction is \(\text{rate}=k[\mathrm{A}][\mathrm{B}]\). In an experiment, B is present at \(1000\) times the concentration of A. How will a plot of ln[A] versus time appear?
* Linear, because [B] stays nearly constant and the reaction behaves as first order in A
- Curved, because the reaction is second order overall
- Linear, because the reaction is zero order in B
- Horizontal, because A reacts too slowly to measure
= With B in large excess, its concentration barely changes, so \(k[\mathrm{B}]\) is effectively a constant. The reaction is pseudo-first order in A.

@ 5 | q | Rate constants
What are the units of the rate constant for a zero-order reaction?
* \(\text{M/s}\)
- \(\text{s}^{-1}\)
- \(\text{M}^{-1}\text{s}^{-1}\)
- No units
= For zero order, \(\text{rate}=k\), so \(k\) has the units of rate, \(\text{M/s}\). First-order constants have units of \(\text{s}^{-1}\).

@ 5 | c | Reaction rates
Powdered zinc reacts with hydrochloric acid much faster than a single lump of zinc of the same mass. Which best explains this?
* The powder has more surface area, so more zinc atoms can collide with ce{H^+} ions per second.
- The powder has a lower activation energy.
- The powder is at a higher temperature.
- The powder contains more moles of zinc.
= Reactions of solids occur at the surface. Increasing surface area increases the frequency of collisions without changing the activation energy.

@ 5 | c | Temperature and rate
How does an increase in temperature affect the rate constant \(k\) of a reaction?
* \(k\) increases, because more collisions have enough energy to overcome the activation energy.
- \(k\) decreases for exothermic reactions.
- \(k\) is unaffected, because it is a constant.
- \(k\) increases only if a catalyst is present.
= The rate constant depends on temperature through the fraction of energetic collisions. It is constant only at a given temperature.

@ 5 | q | Half-life
For a first-order reaction with \(k=0.0231\text{ min}^{-1}\), what is the half-life?
* \(30.0\text{ min}\)
- \(43.3\text{ min}\)
- \(0.0160\text{ min}\)
- \(21.6\text{ min}\)
= \(t_{1/2}=\dfrac{\ln 2}{k}=\dfrac{0.693}{0.0231}=30.0\text{ min}\). The value \(43.3\) is \(\tfrac{1}{k}\).

@ 1 | q | Moles
What mass of magnesium contains the same number of atoms as \(12.0\text{ g}\) of carbon?
* \(24.3\text{ g}\)
- \(12.0\text{ g}\)
- \(6.0\text{ g}\)
- \(48.6\text{ g}\)
= \(12.0\text{ g}\) of carbon is \(1.00\text{ mol}\). The same number of magnesium atoms, \(1.00\text{ mol}\), has a mass equal to the molar mass of Mg, \(24.3\text{ g}\).

@ 2 | q | Lewis structures
How many lone pairs of electrons are on the central xenon atom in the Lewis structure of ce{XeF2}?
* \(3\)
- \(2\)
- \(1\)
- \(4\)
= Xenon contributes 8 valence electrons. Two are used in the bonds to fluorine, leaving 6 as three lone pairs. The five domains form a trigonal bipyramid with the lone pairs equatorial, so the molecule is linear.

@ 3 | q | Gas mixtures
A \(2.00\text{ L}\) flask at \(300\text{ K}\) contains \(0.100\text{ mol}\) of He and \(0.200\text{ mol}\) of Ne. What is the total pressure? Use \(R=0.08206\text{ L}\cdot\text{atm/(mol}\cdot\text{K)}\).
* \(3.69\text{ atm}\)
- \(1.23\text{ atm}\)
- \(2.46\text{ atm}\)
- \(7.39\text{ atm}\)
= Total pressure depends only on the total moles of gas: \(P=\dfrac{(0.300)(0.08206)(300)}{2.00}=3.69\text{ atm}\). The value \(2.46\text{ atm}\) is the partial pressure of Ne.

@ 3 | c | Intermolecular forces
Which compound has the highest boiling point: ce{CH3OH}, ce{CH3CH3}, ce{CH3F}, or ce{CH3Cl}?
* ce{CH3OH}
- ce{CH3CH3}
- ce{CH3F}
- ce{CH3Cl}
= Methanol has an H atom bonded to O, so its molecules form hydrogen bonds with one another. In ce{CH3F}, fluorine is bonded to carbon, not hydrogen, so it cannot hydrogen-bond with itself.

@ 4 | q | Solution preparation
What mass of NaOH (molar mass \(40.00\text{ g/mol}\)) is needed to prepare \(250.0\text{ mL}\) of \(0.150\text{ M}\) solution?
* \(1.50\text{ g}\)
- \(6.00\text{ g}\)
- \(0.0375\text{ g}\)
- \(37.5\text{ g}\)
= The solution requires \(0.2500(0.150)=0.0375\text{ mol}\), which is \(0.0375(40.00)=1.50\text{ g}\). Using \(1\text{ L}\) instead of \(0.250\text{ L}\) gives \(6.00\text{ g}\).

@ 4 | c | Titration error analysis
In a titration, a student fails to rinse the buret with the NaOH titrant, so the titrant is diluted by water left in the buret. How does this affect the calculated concentration of the acid?
* It is too high, because more titrant volume is needed to reach the equivalence point.
- It is too low, because the titrant reacts with water.
- It is unaffected, because the moles of acid do not change.
- It is too low, because less titrant volume is needed.
= The diluted base delivers fewer moles per milliliter, so a larger volume is needed. The calculation multiplies that volume by the original, higher molarity, overestimating the moles of base and thus of acid.

@ 4 | q | Limiting reactant
What mass of ammonia can form from \(28.0\text{ g}\) of ce{N2} and \(9.0\text{ g}\) of ce{H2}, by ce{N2(g) + 3H2(g) -> 2NH3(g)}?
* \(34.1\text{ g}\)
- \(37.0\text{ g}\)
- \(51.1\text{ g}\)
- \(17.0\text{ g}\)
= There are \(1.00\text{ mol}\) of ce{N2} and \(4.46\text{ mol}\) of ce{H2}. The nitrogen needs only \(3.00\text{ mol}\) of ce{H2}, so ce{N2} is limiting and forms \(2.00\text{ mol}\), or \(34.1\text{ g}\), of ce{NH3}.

@ 5 | q | Zero-order reactions
A zero-order reaction has a rate constant of \(0.010\text{ M/s}\). If the initial concentration of reactant is \(0.50\text{ M}\), how long does it take for the reactant to be used up?
* \(50\text{ s}\)
- \(25\text{ s}\)
- \(69\text{ s}\)
- \(0.020\text{ s}\)
= For zero order, \([\mathrm{A}]=[\mathrm{A}]_0-kt\). Setting \([\mathrm{A}]=0\) gives \(t=\dfrac{0.50}{0.010}=50\text{ s}\). Its half-life, \(25\text{ s}\), is not constant.

@ 5 | c | Integrated rate laws
For a reaction, a graph of [A] versus time is a straight line. How does the half-life change as the reaction proceeds?
* It decreases, because a zero-order half-life is proportional to the remaining concentration.
- It stays constant, as for every reaction.
- It increases, because the rate slows down.
- It is undefined for this reaction.
= A linear [A]-versus-time graph indicates zero order, with \(t_{1/2}=\dfrac{[\mathrm{A}]_0}{2k}\). Each successive half-life is half as long as the one before.
`);

module.exports = { source, figures };
