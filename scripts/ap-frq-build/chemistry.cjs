// AP Chemistry free-response practice: fourteen original questions, one full set of seven for
// each of the 2025 and 2026 released exams, each modeled on the released question with the same
// number, type, point total (long 10, short 4), and skills. Formulas are written as ce{…} (or
// mce{…} inside math) and converted by chemtext.cjs.
const { chem } = require('../ap-mcq-build/chemtext.cjs');
const { graph, chart } = require('../ap-mcq-build/figures.cjs');
const { pt, part, tableFigure, fig } = require('./frq-helpers.cjs');

const PINK = '#ec4899';
const SG = year => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-chemistry.pdf`;
const modeled = (year, n, type) => ({ year, question: n, type, label: `${year} AP Chemistry Question ${n} (${type})`, url: SG(year) });
const LONG = 'Long Answer', SHORT = 'Short Answer';

// pH during the titration of a weak acid HA (Ka, Va L of Ca M) with NaOH (Cb M), from the
// full charge balance [H+] + [Na+] = [A-] + [OH-], solved by bisection on log[H+].
function titrationPH(Ka, Ca, Va, Cb, vb) {
  const V = Va + vb, na = Cb * vb / V, ct = Ca * Va / V;
  const f = h => h + na - ct * Ka / (Ka + h) - 1e-14 / h;
  let lo = -14, hi = 0;
  for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; f(10 ** m) > 0 ? (hi = m) : (lo = m); }
  return -(lo + hi) / 2;
}
const titrationCurve = (Ka, Ca, VamL, Cb, maxmL) => Array.from({ length: 161 }, (_, i) => { const v = maxmL * i / 160; return [v, titrationPH(Ka, Ca, VamL / 1000, Cb, v / 1000)]; });

// Applies chemtext to every string in a question except SVG markup and URLs.
const chemAll = o => (typeof o === 'string' ? chem(o) : Array.isArray(o) ? o.map(chemAll) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, k === 'svg' || k === 'url' ? v : chemAll(v)])) : o);

const frqs = [];

// ════════════════ Set modeled on the 2025 exam ════════════════

// ── 1. Long answer (2025 Q1: isotopes, Coulombic attraction, pH, mixing, Ksp and Q) ──
frqs.push({
  id: 'chem-long-calcium-fluoride', questionNumber: 1, title: 'Copper Isotopes and Calcium Fluoride', topic: 'Atomic structure, Coulomb’s law, pH, and solubility equilibria',
  modeledOn: modeled(2025, 1, LONG), timeAllottedMin: 23,
  prompt: 'A student studies several metals and their ions. The mass spectrum of a sample of naturally occurring copper is shown in Figure 1.',
  figures: [fig('Figure 1', chart({ title: 'Relative abundance (%) versus mass (amu)', categories: ['62', '63', '64', '65', '66'], series: [{ name: 'Relative abundance (%)', values: [null, 69.2, null, 30.8, null], color: PINK }], ymax: 80, ystep: 20, w: 380, h: 250, alt: 'Mass spectrum of copper: a peak at mass 63 amu with relative abundance 69.2 percent and a peak at mass 65 amu with relative abundance 30.8 percent' }))],
  parts: [
    part('A', 'The masses of the isotopes are 62.93 amu and 64.93 amu. (i) Calculate the average atomic mass of copper. (ii) How many more neutrons does an atom of copper-65 have than an atom of copper-63?', [
      pt('chem-long-calcium-fluoride-a1', 'calculation', 'Calculates 63.55 amu as the abundance-weighted average.', ['takes a simple average (63.93)', 'uses percents without dividing by 100'], '0.692(62.93) + 0.308(64.93) = 63.55 amu.', '(62.93 + 64.93)/2 = 63.93 amu.'),
      pt('chem-long-calcium-fluoride-a2', 'explanation', 'States two more neutrons (same number of protons).', ['says two more protons'], 'Two more neutrons.', 'Two more protons.'),
    ]),
    part('B', 'Ion-dipole attractions hold water molecules around dissolved ions. The attraction between water and ce{Ca^2+} is stronger than that between water and ce{K^+}. Explain this difference in terms of (i) the charges of the ions and (ii) the sizes of the ions.', [
      pt('chem-long-calcium-fluoride-b1', 'explanation', 'Explains that ce{Ca^2+} has a greater charge than ce{K^+}, so the Coulombic attraction to the partial negative oxygen of water is stronger.', ['refers to electronegativity of the ions'], 'A 2+ charge attracts the oxygen end of water more strongly than a 1+ charge.', 'Calcium is heavier.'),
      pt('chem-long-calcium-fluoride-b2', 'explanation', 'Explains that ce{Ca^2+} is smaller than ce{K^+}, so water molecules can get closer to its nucleus, strengthening the Coulombic attraction.', ['says Ca²⁺ is larger'], 'Ca²⁺ has a smaller radius, so the distance to water’s oxygen is shorter and the attraction is stronger.', 'Ca²⁺ has more electrons.'),
    ]),
    part('C', 'Calculate the pH of a 0.0040 M solution of ce{Ca(OH)2}, which dissociates completely.', [
      pt('chem-long-calcium-fluoride-c1', 'calculation', String.raw`Calculates pH = 11.90 using \([\mathrm{OH^-}] = 0.0080\ M\).`, ['uses [OH⁻] = 0.0040 M (pH 11.60)', 'reports the pOH'], String.raw`\([\mathrm{OH^-}] = 0.0080\ M\), pOH = 2.10, pH = 14 − 2.10 = 11.90.`, 'pH = 11.60.'),
    ]),
    part('D', 'The student mixes 40.0 mL of 2.0 × 10⁻³ M ce{Ca(NO3)2} with 60.0 mL of 3.0 × 10⁻³ M ce{NaF}. Calculate the concentration of ce{Ca^2+} immediately after mixing, before any reaction.', [
      pt('chem-long-calcium-fluoride-d1', 'calculation', String.raw`Calculates \(8.0 \times 10^{-4}\ M\) using the total volume of 100.0 mL.`, ['uses 40.0 mL as the final volume'], String.raw`\(\dfrac{(2.0\times10^{-3})(40.0)}{100.0} = 8.0\times10^{-4}\ M\).`, String.raw`\(2.0\times10^{-3}\ M\).`),
    ]),
    part('E', String.raw`(i) Write the expression for \(K_{sp}\) of ce{CaF2}. (ii) Calculate the reaction quotient \(Q\) immediately after mixing. (iii) The value of \(K_{sp}\) for ce{CaF2} is \(3.9 \times 10^{-11}\). Predict whether a precipitate forms and justify your prediction.`, [
      pt('chem-long-calcium-fluoride-e1', 'equations', String.raw`Writes \(K_{sp} = [\mathrm{Ca^{2+}}][\mathrm{F^-}]^2\).`, ['omits the square', 'includes the solid'], String.raw`\(K_{sp} = [\mathrm{Ca^{2+}}][\mathrm{F^-}]^2\).`, String.raw`\(K_{sp} = [\mathrm{Ca^{2+}}][\mathrm{F^-}]\).`),
      pt('chem-long-calcium-fluoride-e2', 'calculation', String.raw`Calculates \(Q = (8.0\times10^{-4})(1.8\times10^{-3})^2 = 2.6\times10^{-9}\), consistent with part D.`, ['forgets to dilute [F⁻]', 'forgets to square [F⁻]'], String.raw`\([\mathrm{F^-}] = 1.8\times10^{-3}\ M\); \(Q = 2.6\times10^{-9}\).`, String.raw`\(Q = 2.4\times10^{-6}\).`),
      pt('chem-long-calcium-fluoride-e3', 'justification', String.raw`Predicts a precipitate forms because \(Q > K_{sp}\) (consistent with part E (ii)).`, ['reverses the inequality'], String.raw`\(Q > K_{sp}\), so ce{CaF2} precipitates.`, 'No precipitate because Q is small.'),
    ]),
    part('F', 'After the precipitate forms and the system reaches equilibrium, a few drops of concentrated ce{HNO3} are added. Predict whether the mass of solid ce{CaF2} increases, decreases, or stays the same. Justify your answer.', [
      pt('chem-long-calcium-fluoride-f1', 'justification', 'Predicts the mass decreases, because ce{H^+} reacts with ce{F^-} (forming the weak acid HF), lowering [F⁻] so Q < Ksp and more solid dissolves.', ['says nitrate forms a precipitate', 'predicts no change because HNO₃ is unrelated'], 'Decreases: H⁺ combines with F⁻ to form HF, so [F⁻] falls, Q < Ksp, and more CaF₂ dissolves.', 'Increases because more ions are added.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(0.692(62.93) + 0.308(64.93) = 63.55\) amu. (ii) Two more neutrons. B (i) ce{Ca^2+} has a 2+ charge, larger than the 1+ charge of ce{K^+}, so its Coulombic attraction to the partial negative oxygen in water is stronger. (ii) ce{Ca^2+} is smaller, so water's oxygen gets closer to it and the attraction is stronger. C \([\mathrm{OH^-}] = 0.0080\ M\), pOH = 2.10, pH = 11.90. D \((2.0\times10^{-3})(40.0/100.0) = 8.0\times10^{-4}\ M\). E (i) \(K_{sp} = [\mathrm{Ca^{2+}}][\mathrm{F^-}]^2\). (ii) \([\mathrm{F^-}] = 1.8\times10^{-3}\ M\), \(Q = (8.0\times10^{-4})(1.8\times10^{-3})^2 = 2.6\times10^{-9}\). (iii) \(Q > K_{sp}\), so a precipitate forms. F Decreases: ce{H^+} reacts with ce{F^-} to form HF, lowering [F⁻], so \(Q < K_{sp}\) and more ce{CaF2} dissolves.`,
});

// ── 2. Long answer (2025 Q2: combustion analysis, titration, pKa, buffer ratio, rate law, IMF) ──
const lacticCurve = titrationCurve(10 ** -3.86, 0.07360, 25.00, 0.1000, 30);
frqs.push({
  id: 'chem-long-lactic-acid', questionNumber: 2, title: 'Lactic Acid', topic: 'Empirical formulas, acid-base titration, buffers, and kinetics',
  modeledOn: modeled(2025, 2, LONG), timeAllottedMin: 23,
  prompt: 'Lactic acid, HLac, is a weak monoprotic acid made of carbon, hydrogen, and oxygen. A 0.4500 g sample of lactic acid is burned completely in excess oxygen, producing 0.6600 g of ce{CO2} and 0.2700 g of ce{H2O}.',
  parts: [
    part('A', 'Determine the empirical formula of lactic acid. (i) Calculate the number of moles of carbon in the sample. (ii) Calculate the number of moles of hydrogen in the sample. (iii) Determine the empirical formula, showing how the mass of oxygen is found.', [
      pt('chem-long-lactic-acid-a1', 'calculation', String.raw`Calculates \(0.01500\) mol C (\(0.6600 \div 44.01\)).`, ['divides by 12.01 instead of 44.01'], String.raw`\(0.6600\text{ g} \div 44.01\text{ g/mol} = 0.01500\) mol ce{CO2} = 0.01500 mol C.`, '0.0550 mol C.'),
      pt('chem-long-lactic-acid-a2', 'calculation', 'Calculates 0.02997 mol H (two H per ce{H2O}).', ['forgets the factor of 2'], String.raw`\(0.2700 \div 18.02 = 0.01498\) mol ce{H2O}, so 0.02997 mol H.`, '0.01498 mol H.'),
      pt('chem-long-lactic-acid-a3', 'calculation', 'Finds the mass of O by difference (0.2397 g, 0.01498 mol) and the empirical formula ce{CH2O}.', ['assumes all oxygen came from the sample', 'reports the molecular formula C₃H₆O₃'], 'Mass O = 0.4500 − 0.1801 − 0.0302 = 0.2397 g = 0.01498 mol; C : H : O = 1 : 2 : 1, so CH₂O.', 'C₃H₆O₃.'),
    ]),
    part('B', 'A 25.00 mL sample of HLac solution is titrated with 0.1000 M ce{NaOH}. The titration curve is shown in Figure 1; the equivalence point is reached after 18.40 mL of ce{NaOH}. (i) Calculate the initial concentration of HLac. (ii) Using the curve, estimate the pKa of lactic acid. (iii) Calculate the ratio [Lac⁻]/[HLac] in a buffer of lactic acid and sodium lactate with pH 4.50, consistent with part B (ii).', [
      pt('chem-long-lactic-acid-b1', 'calculation', String.raw`Calculates \(0.07360\ M\).`, ['divides by the base volume'], String.raw`\(0.01840\text{ L} \times 0.1000\ M = 1.840\times10^{-3}\) mol; \(\div 0.02500\text{ L} = 0.07360\ M\).`, String.raw`\(0.1000\ M\).`),
      pt('chem-long-lactic-acid-b2', 'calculation', 'Reads pKa ≈ 3.86 (accept 3.7–4.0) as the pH at the half-equivalence point (9.20 mL).', ['reads the pH at the equivalence point', 'reads the initial pH'], 'At 9.20 mL, pH ≈ 3.86, so pKa ≈ 3.86.', 'pKa ≈ 8.2.'),
      pt('chem-long-lactic-acid-b3', 'calculation', String.raw`Uses the Henderson–Hasselbalch equation to find a ratio of about 4.4 (\(10^{4.50 - 3.86}\)).`, ['inverts the ratio (0.23)'], String.raw`\(4.50 = 3.86 + \log\dfrac{[\mathrm{Lac^-}]}{[\mathrm{HLac}]} \Rightarrow \dfrac{[\mathrm{Lac^-}]}{[\mathrm{HLac}]} = 10^{0.64} \approx 4.4\).`, '0.23.'),
    ], [fig('Figure 1', graph({ x: [0, 30], y: [0, 14], xstep: 5, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Volume of 0.1000 M NaOH added (mL)', ytitle: 'pH', curves: [{ pts: lacticCurve }], w: 380, h: 300, alt: 'Titration curve of 25.00 mL lactic acid with 0.1000 M NaOH. The pH starts near 2.5, rises gradually through a buffer region (pH about 3.9 at 9.2 mL), jumps steeply near 18.4 mL, and levels off near pH 12' }))]),
    part('C', 'Lactic acid reacts with an oxidizing agent X. Initial-rate data at constant temperature are shown in Table 1. (i) Explain how the data show the reaction order with respect to HLac. (ii) The rate law is rate = k[HLac][X]². Calculate the value of k. (iii) Give the units of k.', [
      pt('chem-long-lactic-acid-c1', 'explanation', 'Explains first order in HLac: comparing trials 1 and 2, doubling [HLac] with [X] constant doubles the rate.', ['compares trials where both concentrations change'], 'Trials 1 and 2: [HLac] doubles, [X] is constant, and the rate doubles, so the reaction is first order in HLac.', 'The rate increases, so it is first order.'),
      pt('chem-long-lactic-acid-c2', 'calculation', String.raw`Calculates \(k = 1.6\) using one trial.`, ['forgets to square [X]'], String.raw`\(k = \dfrac{3.2\times10^{-5}}{(0.050)(0.020)^2} = 1.6\).`, String.raw`\(k = 0.032\).`),
      pt('chem-long-lactic-acid-c3', 'calculation', String.raw`Gives units \(M^{-2}\,\mathrm{s^{-1}}\).`, ['gives M⁻¹ s⁻¹'], String.raw`\(M^{-2}\,\mathrm{s^{-1}}\).`, String.raw`\(M^{-1}\,\mathrm{s^{-1}}\).`),
    ], [tableFigure('Table 1', ['Trial', '[HLac] (M)', '[X] (M)', 'Initial rate (M/s)'], [['1', '0.050', '0.020', '3.2 × 10⁻⁵'], ['2', '0.100', '0.020', '6.4 × 10⁻⁵'], ['3', '0.050', '0.040', '1.28 × 10⁻⁴']])]),
    part('D', 'Lactic acid, ce{CH3CH(OH)COOH}, is very soluble in water. Identify the intermolecular force mainly responsible and explain.', [
      pt('chem-long-lactic-acid-d1', 'explanation', 'Identifies hydrogen bonding between the −OH (and −COOH) groups of lactic acid and water molecules.', ['says London dispersion forces', 'says ionic bonding'], 'Its −OH and −COOH groups form hydrogen bonds with water molecules.', 'It is ionic.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(0.6600 \div 44.01 = 0.01500\) mol C. (ii) \(0.2700 \div 18.02 = 0.01498\) mol ce{H2O}, so 0.02997 mol H. (iii) Mass C = 0.1801 g, mass H = 0.0302 g, mass O = 0.4500 − 0.1801 − 0.0302 = 0.2397 g = 0.01498 mol. C : H : O = 1 : 2 : 1, so ce{CH2O}. B (i) \(1.840\times10^{-3}\) mol ce{NaOH} = mol HLac; \(\div 0.02500\) L = 0.07360 M. (ii) At half-equivalence (9.20 mL), pH ≈ 3.86, so pKa ≈ 3.86. (iii) \(\dfrac{[\mathrm{Lac^-}]}{[\mathrm{HLac}]} = 10^{4.50 - 3.86} \approx 4.4\). C (i) In trials 1 and 2, doubling [HLac] at constant [X] doubles the rate: first order. (ii) \(k = \dfrac{3.2\times10^{-5}}{(0.050)(0.020)^2} = 1.6\). (iii) \(M^{-2}\,\mathrm{s^{-1}}\). D Hydrogen bonding between the −OH and −COOH groups and water.`,
});

// ── 3. Long answer (2025 Q3: Lewis diagram, entropy, favorability, calorimetry, Hess's law, Kp) ──
frqs.push({
  id: 'chem-long-calcium-oxide', questionNumber: 3, title: 'Lime, Limestone, and Carbon Dioxide', topic: 'Bonding, thermodynamics, calorimetry, and gas equilibrium',
  modeledOn: modeled(2025, 3, LONG), timeAllottedMin: 23,
  prompt: 'Calcium oxide (lime) reacts with carbon dioxide to form calcium carbonate: ce{CaO(s) + CO2(g) -> CaCO3(s)}, with ΔH° = −178 kJ/mol_rxn.',
  parts: [
    part('A', 'Draw the complete Lewis electron-dot diagram for ce{CO2}.', [
      pt('chem-long-calcium-oxide-a1', 'representation', 'Draws O=C=O with two double bonds and two lone pairs on each oxygen (16 valence electrons, no lone pairs on C).', ['puts lone pairs on carbon', 'uses single bonds'], 'O=C=O with two lone pairs on each O.', 'O–C–O with lone pairs on every atom.'),
    ]),
    part('B', '(i) Explain why ΔS° for the reaction is negative. (ii) Is the reaction thermodynamically favorable at all temperatures? Justify your answer in terms of ΔH° and ΔS°.', [
      pt('chem-long-calcium-oxide-b1', 'explanation', 'Explains that a gas is consumed and only a solid is produced, so the products have fewer possible arrangements (microstates); entropy decreases.', ['says the reaction is exothermic so entropy decreases'], 'A gas becomes part of a solid, so the dispersal of matter decreases.', 'Energy is released.'),
      pt('chem-long-calcium-oxide-b2', 'justification', 'Answers no: ΔH° < 0 favors the reaction but ΔS° < 0 does not, so ΔG° = ΔH° − TΔS° is negative only at low temperatures.', ['says favorable at all temperatures because ΔH is negative'], 'No. With ΔH° < 0 and ΔS° < 0, ΔG° becomes positive when T is high enough that −TΔS° outweighs ΔH°.', 'Yes, it is exothermic.'),
    ]),
    part('C', 'A student adds 1.12 g of ce{CaO} to 150.0 g of water in a coffee-cup calorimeter. The reaction ce{CaO(s) + H2O(l) -> Ca(OH)2(aq)} raises the temperature from 21.40 °C to 23.20 °C. Assume the solution has the specific heat of water, 4.18 J/(g·°C), and a mass of 150.0 g. (i) Calculate the magnitude of q absorbed by the solution, reported with the correct number of significant figures. (ii) Calculate ΔH for the reaction in kJ/mol_rxn.', [
      pt('chem-long-calcium-oxide-c1', 'calculation', String.raw`Calculates \(q = 1.13\) kJ (1130 J) with three significant figures.`, ['reports 1128.6 J', 'uses the mass of CaO'], String.raw`\(q = (150.0)(4.18)(1.80) = 1.13\times10^{3}\ \mathrm{J}\).`, String.raw`\(q = 1128.6\ \mathrm{J}\).`),
      pt('chem-long-calcium-oxide-c2', 'calculation', 'Calculates the magnitude 56.5 kJ/mol_rxn using 0.01997 mol CaO.', ['divides by grams'], String.raw`\(1.13\text{ kJ} \div 0.01997\text{ mol} = 56.5\ \mathrm{kJ/mol}\).`, String.raw`\(1.13 \div 1.12 = 1.01\ \mathrm{kJ/mol}\).`),
      pt('chem-long-calcium-oxide-c3', 'calculation', 'Gives a negative sign (−56.5 kJ/mol_rxn) because the solution warmed (exothermic).', ['positive sign'], '−56.5 kJ/mol_rxn.', '+56.5 kJ/mol_rxn.'),
    ]),
    part('D', 'The experiment is repeated with 0.56 g of ce{CaO} and 150.0 g of water. Predict whether the temperature increase is greater than, less than, or equal to 1.80 °C. Justify your answer.', [
      pt('chem-long-calcium-oxide-d1', 'justification', 'Predicts less than: fewer moles react, releasing less thermal energy into the same mass of water.', ['predicts equal because ΔH is the same'], 'Less than; half the CaO releases about half the energy into the same water.', 'Equal; ΔH per mole is the same.'),
    ]),
    part('E', 'Given ce{CaCO3(s) -> CaO(s) + CO2(g)} ΔH° = +178 kJ/mol_rxn, ΔH°f of ce{CaO(s)} = −635 kJ/mol, and ΔH°f of ce{CO2(g)} = −394 kJ/mol, calculate ΔH°f of ce{CaCO3(s)}.', [
      pt('chem-long-calcium-oxide-e1', 'calculation', 'Calculates −1207 kJ/mol.', ['sign error on the 178 kJ'], String.raw`\(178 = (-635) + (-394) - \Delta H^\circ_f \Rightarrow \Delta H^\circ_f = -1207\ \mathrm{kJ/mol}\).`, String.raw`\(-851\ \mathrm{kJ/mol}\).`),
    ]),
    part('F', 'At a certain temperature, ce{CaCO3(s) <=> CaO(s) + CO2(g)} reaches equilibrium with a ce{CO2} partial pressure of 0.220 atm. (i) Calculate Kp. (ii) Predict whether Kp increases, decreases, or stays the same at a higher temperature. Justify your answer.', [
      pt('chem-long-calcium-oxide-f1', 'calculation', String.raw`Gives \(K_p = P_{\mathrm{CO_2}} = 0.220\) (solids omitted).`, ['includes the solids'], String.raw`\(K_p = P_{\mathrm{CO_2}} = 0.220\).`, String.raw`\(K_p = \dfrac{0.220}{1}\) times the masses of the solids.`),
      pt('chem-long-calcium-oxide-f2', 'justification', 'Predicts Kp increases because the decomposition is endothermic, and higher temperature favors the endothermic direction.', ['says K is unaffected by temperature'], 'Increases: the forward reaction is endothermic (ΔH° = +178 kJ), so raising T shifts it toward products.', 'Stays the same.'),
    ]),
  ],
  sampleResponse: String.raw`A O=C=O with two double bonds and two lone pairs on each oxygen. B (i) A gas is converted into a solid, so the products have fewer microstates and entropy decreases. (ii) No. ΔH° < 0 favors the reaction, but ΔS° < 0 does not; at high enough temperature, −TΔS° outweighs ΔH° and ΔG° > 0. C (i) \(q = (150.0)(4.18)(1.80) = 1.13\times10^3\ \mathrm{J}\). (ii) \(1.12 \div 56.08 = 0.01997\) mol; \(\Delta H = -1.13\text{ kJ} \div 0.01997\text{ mol} = -56.5\ \mathrm{kJ/mol_{rxn}}\). D Less than: fewer moles of ce{CaO} release less energy into the same mass of water. E \(\Delta H^\circ_f = -635 + (-394) - 178 = -1207\ \mathrm{kJ/mol}\). F (i) \(K_p = 0.220\). (ii) Increases, because the decomposition is endothermic.`,
});

// ── 4. Short answer (2025 Q4: hybridization, hydrogen-bond diagram, phases, energy of phase change) ──
frqs.push({
  id: 'chem-short-ammonia', questionNumber: 4, title: 'Ammonia: Bonding and Phase Changes', topic: 'Hybridization, hydrogen bonding, and phase changes',
  modeledOn: modeled(2025, 4, SHORT), timeAllottedMin: 9,
  prompt: 'Ammonia, ce{NH3}, melts at 195 K and boils at 240 K at 1 atm. Its molar enthalpy of vaporization is 23.3 kJ/mol.',
  parts: [
    part('A', 'Identify the hybridization of the nitrogen atom in ce{NH3}.', [
      pt('chem-short-ammonia-a1', 'explanation', String.raw`Identifies \(sp^3\).`, ['identifies sp² because of three bonds'], String.raw`\(sp^3\) (three bonds and one lone pair).`, String.raw`\(sp^2\).`),
    ]),
    part('B', 'Describe or draw a diagram showing one hydrogen bond between an ce{NH3} molecule and an ce{H2O} molecule. Identify the two atoms the hydrogen bond connects.', [
      pt('chem-short-ammonia-b1', 'representation', 'Shows a hydrogen bond (dashed line) between the N atom of ce{NH3} and an H atom of ce{H2O}, or between the O atom of ce{H2O} and an H atom of ce{NH3}.', ['draws the dashed line to the H on the same molecule', 'connects two H atoms'], 'A dashed line from the lone pair on N to an H atom of a water molecule.', 'A dashed line between N and the H it is bonded to.'),
    ]),
    part('C', '(i) Propose a temperature, in kelvins, at which ce{NH3} is a liquid at 1 atm. (ii) Calculate the energy, in kJ, released when 6.80 g of ce{NH3(g)} condenses at its boiling point.', [
      pt('chem-short-ammonia-c1', 'explanation', 'Proposes a temperature between 196 K and 239 K.', ['gives a temperature in °C', 'gives 300 K'], '220 K.', '−50 K.'),
      pt('chem-short-ammonia-c2', 'calculation', 'Calculates 9.30 kJ released (0.3993 mol × 23.3 kJ/mol).', ['uses 14.01 g/mol'], String.raw`\(6.80 \div 17.03 = 0.3993\) mol; \(\times 23.3 = 9.30\) kJ released.`, '11.3 kJ.'),
    ]),
  ],
  sampleResponse: String.raw`A \(sp^3\). B A dashed line from the nitrogen lone pair of ce{NH3} to a hydrogen atom of ce{H2O} (or from the oxygen of ce{H2O} to an H of ce{NH3}). C (i) 220 K. (ii) \(6.80 \div 17.03 = 0.3993\) mol; \(0.3993 \times 23.3 = 9.30\) kJ released.`,
});

// ── 5. Short answer (2025 Q5: molecular shape, London forces, vapor pressure, ideal gas) ──
frqs.push({
  id: 'chem-short-trichlorides', questionNumber: 5, title: 'Phosphorus and Arsenic Trichlorides', topic: 'Molecular geometry, intermolecular forces, and gases',
  modeledOn: modeled(2025, 5, SHORT), timeAllottedMin: 9,
  prompt: 'Phosphorus trichloride, ce{PCl3}, boils at 76 °C. Arsenic trichloride, ce{AsCl3}, boils at 130 °C.',
  parts: [
    part('A', 'Identify the molecular geometry of ce{PCl3}.', [
      pt('chem-short-trichlorides-a1', 'explanation', 'Identifies trigonal pyramidal.', ['identifies trigonal planar'], 'Trigonal pyramidal.', 'Trigonal planar.'),
    ]),
    part('B', 'A student claims that ce{AsCl3} has the higher boiling point because of stronger London dispersion forces. Do you agree? Justify your answer.', [
      pt('chem-short-trichlorides-b1', 'justification', 'Agrees: As has more electrons (more occupied shells) than P, so ce{AsCl3} has a larger, more polarizable electron cloud and stronger London dispersion forces.', ['attributes it to hydrogen bonding', 'says it has more bonds'], 'Agree. AsCl₃ has more electrons and a larger, more polarizable cloud, so its dispersion forces are stronger.', 'Agree, because As is heavier.'),
    ]),
    part('C', 'Which liquid has the higher vapor pressure at 50 °C? Justify your answer.', [
      pt('chem-short-trichlorides-c1', 'justification', 'Identifies ce{PCl3}: its weaker intermolecular forces let more molecules escape into the vapor at the same temperature.', ['picks AsCl₃'], 'PCl₃, because its weaker attractions let more molecules enter the gas phase.', 'AsCl₃, because it boils higher.'),
    ]),
    part('D', 'A 4.00 L flask contains ce{PCl3(g)} at 0.950 atm and 373 K. Calculate the number of moles of ce{PCl3} in the flask.', [
      pt('chem-short-trichlorides-d1', 'calculation', 'Calculates 0.124 mol using PV = nRT.', ['uses 100 °C instead of 373 K', 'uses R = 8.314 with atm'], String.raw`\(n = \dfrac{(0.950)(4.00)}{(0.08206)(373)} = 0.124\) mol.`, '0.463 mol.'),
    ]),
  ],
  sampleResponse: String.raw`A Trigonal pyramidal. B Agree. As has more electrons than P, so ce{AsCl3} has a larger, more polarizable electron cloud and stronger London dispersion forces. C ce{PCl3}: its weaker intermolecular forces let more molecules escape into the vapor. D \(n = \dfrac{PV}{RT} = \dfrac{(0.950)(4.00)}{(0.08206)(373)} = 0.124\) mol.`,
});

// ── 6. Short answer (2025 Q6: half-reaction, net ionic equation, mass change, cell potential) ──
frqs.push({
  id: 'chem-short-magnesium-cell', questionNumber: 6, title: 'A Magnesium–Silver Cell', topic: 'Electrochemistry',
  modeledOn: modeled(2025, 6, SHORT), timeAllottedMin: 9,
  prompt: 'A galvanic cell has a magnesium electrode in 1.0 M ce{Mg(NO3)2} and a silver electrode in 1.0 M ce{AgNO3}. Standard reduction potentials: ce{Ag^+ + e^- -> Ag}, E° = +0.80 V; ce{Mg^2+ + 2e^- -> Mg}, E° = −2.37 V.',
  parts: [
    part('A', 'Write the half-reaction that occurs at the anode.', [
      pt('chem-short-magnesium-cell-a1', 'equations', 'Writes ce{Mg(s) -> Mg^2+(aq) + 2e^-}.', ['writes a reduction', 'puts electrons on the wrong side'], 'Mg → Mg²⁺ + 2e⁻.', 'Ag⁺ + e⁻ → Ag.'),
    ]),
    part('B', 'Write the balanced net ionic equation for the overall cell reaction.', [
      pt('chem-short-magnesium-cell-b1', 'equations', 'Writes ce{Mg(s) + 2Ag^+(aq) -> Mg^2+(aq) + 2Ag(s)}.', ['does not balance charge (1 Ag⁺)'], 'Mg + 2Ag⁺ → Mg²⁺ + 2Ag.', 'Mg + Ag⁺ → Mg²⁺ + Ag.'),
    ]),
    part('C', 'As the cell operates, which electrode changes mass by the greater amount? Justify your answer using the stoichiometry of the reaction and molar masses.', [
      pt('chem-short-magnesium-cell-c1', 'justification', 'Identifies the silver electrode: per mole of reaction, 2 mol Ag (215.7 g) are deposited while 1 mol Mg (24.31 g) is consumed.', ['compares only molar masses without the 2:1 ratio'], 'Silver: 2 × 107.87 = 215.7 g Ag gained for every 24.31 g Mg lost.', 'Magnesium, because it is consumed.'),
    ]),
    part('D', 'Calculate E° for the cell.', [
      pt('chem-short-magnesium-cell-d1', 'calculation', 'Calculates +3.17 V.', ['doubles the silver potential', 'subtracts in the wrong order (−3.17 V)'], 'E° = 0.80 − (−2.37) = 3.17 V.', '3.97 V.'),
    ]),
  ],
  sampleResponse: 'A ce{Mg(s) -> Mg^2+(aq) + 2e^-}. B ce{Mg(s) + 2Ag^+(aq) -> Mg^2+(aq) + 2Ag(s)}. C The silver electrode: for each mole of reaction, 2 mol Ag (215.7 g) are deposited while only 1 mol Mg (24.31 g) is lost. D E° = 0.80 V − (−2.37 V) = 3.17 V.',
});

// ── 7. Short answer (2025 Q7: proton-accepting atom, Kb from data, Ka, catalyst in a mechanism) ──
frqs.push({
  id: 'chem-short-hypochlorite', questionNumber: 7, title: 'Hypochlorite and Peroxide', topic: 'Acid-base equilibria and reaction mechanisms',
  modeledOn: modeled(2025, 7, SHORT), timeAllottedMin: 9,
  prompt: 'Household bleach contains the hypochlorite ion, ce{OCl^-}, a weak base. A 0.20 M ce{NaOCl} solution has [OH⁻] = 2.6 × 10⁻⁴ M at 25 °C.',
  parts: [
    part('A', 'When ce{OCl^-} acts as a base, a proton bonds to one of its atoms. Identify that atom.', [
      pt('chem-short-hypochlorite-a1', 'representation', 'Identifies the oxygen atom (forming H–O–Cl).', ['identifies chlorine'], 'Oxygen.', 'Chlorine.'),
    ]),
    part('B', String.raw`(i) Calculate \(K_b\) for ce{OCl^-}. (ii) Calculate \(K_a\) for ce{HOCl}.`, [
      pt('chem-short-hypochlorite-b1', 'calculation', String.raw`Calculates \(K_b = \dfrac{(2.6\times10^{-4})^2}{0.20} = 3.4\times10^{-7}\).`, ['forgets to square', 'uses [OH⁻] for the base concentration'], String.raw`\(K_b = \dfrac{(2.6\times10^{-4})^2}{0.20} = 3.4\times10^{-7}\).`, String.raw`\(1.3\times10^{-3}\).`),
      pt('chem-short-hypochlorite-b2', 'calculation', String.raw`Calculates \(K_a = \dfrac{1.0\times10^{-14}}{3.4\times10^{-7}} = 2.9\times10^{-8}\), consistent with part B (i).`, ['multiplies by Kw'], String.raw`\(K_a = K_w / K_b = 2.9\times10^{-8}\).`, String.raw`\(3.4\times10^{-21}\).`),
    ]),
    part('C', 'Iodide ion speeds the decomposition of hydrogen peroxide by this mechanism. Step 1: ce{H2O2 + I^- -> H2O + IO^-}. Step 2: ce{H2O2 + IO^- -> H2O + O2 + I^-}. A student claims that ce{IO^-} is a catalyst. Do you agree? Justify your answer.', [
      pt('chem-short-hypochlorite-c1', 'justification', 'Disagrees: ce{IO^-} is produced in step 1 and consumed in step 2, so it is an intermediate; ce{I^-}, consumed then regenerated, is the catalyst.', ['agrees because IO⁻ is not in the overall equation'], 'Disagree. IO⁻ forms first and is used up later, so it is an intermediate; I⁻ is the catalyst.', 'Agree, it does not appear in the overall reaction.'),
    ]),
  ],
  sampleResponse: String.raw`A The oxygen atom. B (i) \(K_b = \dfrac{(2.6\times10^{-4})^2}{0.20} = 3.4\times10^{-7}\). (ii) \(K_a = \dfrac{1.0\times10^{-14}}{3.4\times10^{-7}} = 2.9\times10^{-8}\). C Disagree: ce{IO^-} is produced in step 1 and consumed in step 2, so it is an intermediate. ce{I^-} is consumed in step 1 and regenerated in step 2, so it is the catalyst.`,
});

// ════════════════ Set modeled on the 2026 exam ════════════════

// ── 8. Long answer (2026 Q1: electron configuration, size, solution calorimetry, Ksp, common ion) ──
frqs.push({
  id: 'chem-long-magnesium-sulfate', questionNumber: 1, title: 'Dissolving Magnesium Sulfate', topic: 'Atomic structure, calorimetry, and solubility',
  modeledOn: modeled(2026, 1, LONG), timeAllottedMin: 23,
  prompt: 'A student dissolves 3.00 g of anhydrous ce{MgSO4} (molar mass 120.37 g/mol) in 100.0 g of water in a coffee-cup calorimeter. The temperature rises from 22.0 °C to a maximum of 27.1 °C and then slowly falls.',
  parts: [
    part('A', '(i) Write the complete ground-state electron configuration of ce{Mg^2+}. (ii) Which is larger, a Mg atom or a ce{Mg^2+} ion? Justify your answer.', [
      pt('chem-long-magnesium-sulfate-a1', 'representation', String.raw`Writes \(1s^2 2s^2 2p^6\) (or [Ne]).`, ['writes the configuration of Mg'], String.raw`\(1s^2 2s^2 2p^6\).`, String.raw`\(1s^2 2s^2 2p^6 3s^2\).`),
      pt('chem-long-magnesium-sulfate-a2', 'justification', 'Identifies the Mg atom: its outermost electrons are in the n = 3 shell, farther from the nucleus than the n = 2 electrons of ce{Mg^2+}.', ['says Mg²⁺ is larger because it has a charge'], 'The Mg atom, because its valence electrons occupy n = 3 while Mg²⁺ has none beyond n = 2.', 'Mg²⁺, because it is charged.'),
    ]),
    part('B', 'How can the student tell from the temperature data when dissolution is complete?', [
      pt('chem-long-magnesium-sulfate-b1', 'explanation', 'States that dissolution is complete when the temperature stops rising (reaches its maximum) and begins to fall.', ['says when the solid is no longer visible only'], 'When the temperature reaches its maximum and starts to decrease.', 'When the temperature is 22.0 °C again.'),
    ]),
    part('C', '(i) Calculate the magnitude of q absorbed by the solution, reported with the correct number of significant figures. Use a solution mass of 103.0 g and a specific heat of 4.18 J/(g·°C). (ii) Calculate ΔH°soln for ce{MgSO4} in kJ/mol, with the correct sign.', [
      pt('chem-long-magnesium-sulfate-c1', 'calculation', String.raw`Calculates \(q = 2.2\times10^3\) J (two significant figures, from ΔT = 5.1 °C).`, ['reports 2196 J', 'uses 100.0 g'], String.raw`\(q = (103.0)(4.18)(5.1) = 2.2\times10^3\ \mathrm{J}\).`, String.raw`\(q = 2196\ \mathrm{J}\).`),
      pt('chem-long-magnesium-sulfate-c2', 'calculation', 'Calculates ΔH°soln = −88 kJ/mol (negative because the solution warmed).', ['positive sign', 'divides by grams'], String.raw`\(3.00 \div 120.37 = 0.02492\) mol; \(-2.2\text{ kJ} \div 0.02492 = -88\ \mathrm{kJ/mol}\).`, '+88 kJ/mol.'),
    ]),
    part('D', 'Some thermal energy escaped from the calorimeter during the experiment. Is the magnitude of the calculated ΔH°soln greater than, less than, or equal to the true magnitude? Justify your answer.', [
      pt('chem-long-magnesium-sulfate-d1', 'justification', 'States less than: escaping heat makes the measured temperature rise smaller, so q and the calculated |ΔH°soln| are too small.', ['says greater than'], 'Less than; the lost heat lowers ΔT and therefore q.', 'Greater than.'),
    ]),
    part('E', 'The experiment is repeated with 3.00 g of ce{MgSO4} and 200.0 g of water. Predict whether ΔT is greater than, less than, or equal to the original ΔT. Justify your answer.', [
      pt('chem-long-magnesium-sulfate-e1', 'justification', 'Predicts less than: the same amount of energy is released into about twice the mass of solution.', ['predicts equal because the moles are the same'], 'Less than; the same q warms twice the mass, so ΔT is about half.', 'Equal.'),
    ]),
    part('F', String.raw`Magnesium fluoride, ce{MgF2}, is only slightly soluble; \(K_{sp} = 5.2\times10^{-11}\). (i) Write the equation for the dissolution equilibrium of ce{MgF2}. (ii) Calculate the molar solubility of ce{MgF2} in pure water. (iii) Is the molar solubility of ce{MgF2} in 0.10 M ce{NaF} greater than, less than, or equal to that in pure water? Justify your answer.`, [
      pt('chem-long-magnesium-sulfate-f1', 'equations', 'Writes ce{MgF2(s) <=> Mg^2+(aq) + 2F^-(aq)}.', ['omits the coefficient 2', 'writes F₂⁻'], 'MgF₂(s) ⇌ Mg²⁺(aq) + 2F⁻(aq).', 'MgF₂ ⇌ Mg²⁺ + F₂²⁻.'),
      pt('chem-long-magnesium-sulfate-f2', 'calculation', String.raw`Calculates \(s = 2.4\times10^{-4}\ M\) from \(4s^3 = K_{sp}\).`, ['uses s² = Ksp', 'forgets the factor of 4'], String.raw`\(K_{sp} = s(2s)^2 = 4s^3 \Rightarrow s = 2.4\times10^{-4}\ M\).`, String.raw`\(s = 7.2\times10^{-6}\ M\).`),
      pt('chem-long-magnesium-sulfate-f3', 'justification', 'States less than, because the added ce{F^-} (common ion) shifts the equilibrium toward the solid.', ['says greater because more ions are present'], 'Less than; the common ion F⁻ shifts the equilibrium left.', 'Greater than.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) \(1s^2 2s^2 2p^6\). (ii) The Mg atom: its valence electrons are in n = 3, farther from the nucleus than any electrons in ce{Mg^2+}. B When the temperature reaches its maximum and begins to fall. C (i) \(q = (103.0)(4.18)(5.1) = 2.2\times10^3\) J. (ii) \(3.00 \div 120.37 = 0.02492\) mol; \(\Delta H^\circ_{soln} = -2.2\text{ kJ} \div 0.02492\text{ mol} = -88\ \mathrm{kJ/mol}\). D Less than: lost heat lowers the measured ΔT and q. E Less than: the same energy warms about twice the mass. F (i) ce{MgF2(s) <=> Mg^2+(aq) + 2F^-(aq)}. (ii) \(4s^3 = 5.2\times10^{-11}\), \(s = 2.4\times10^{-4}\ M\). (iii) Less than, because of the common ion ce{F^-}.`,
});

// ── 9. Long answer (2026 Q2: Lewis structure, redox, ΔG° from E°, electrolysis, first-order kinetics) ──
const n2o5Rows = [['0', '0.0800'], ['10', '0.0592'], ['20', '0.0438'], ['30', '0.0324'], ['40', '0.0240']];
frqs.push({
  id: 'chem-long-nitrate-kinetics', questionNumber: 2, title: 'Nitrate, Copper Plating, and N₂O₅', topic: 'Bonding, electrochemistry, and kinetics',
  modeledOn: modeled(2026, 2, LONG), timeAllottedMin: 23,
  prompt: 'This question concerns several reactions of nitrogen and copper compounds.',
  parts: [
    part('A', '(i) Identify the molecular geometry of the nitrate ion, ce{NO3^-}. (ii) Draw one complete Lewis electron-dot diagram for ce{NO3^-}.', [
      pt('chem-long-nitrate-kinetics-a1', 'explanation', 'Identifies trigonal planar.', ['identifies trigonal pyramidal'], 'Trigonal planar.', 'Trigonal pyramidal.'),
      pt('chem-long-nitrate-kinetics-a2', 'representation', 'Draws N bonded to three O atoms with one double bond and two single bonds, with correct lone pairs (24 valence electrons) and the 1− charge shown.', ['gives N a lone pair', 'uses three double bonds'], 'One N=O and two N–O, with 2 lone pairs on the double-bonded O and 3 on each single-bonded O; [ ]⁻.', 'Three N–O single bonds with no charge.'),
    ]),
    part('B', 'Solutions of ce{AgNO3} and ce{NaCl} are mixed and a white precipitate forms. (i) Write the balanced net ionic equation. (ii) Is this a redox reaction? Justify your answer.', [
      pt('chem-long-nitrate-kinetics-b1', 'equations', 'Writes ce{Ag^+(aq) + Cl^-(aq) -> AgCl(s)}.', ['includes spectator ions'], 'Ag⁺ + Cl⁻ → AgCl(s).', 'AgNO₃ + NaCl → AgCl + NaNO₃.'),
      pt('chem-long-nitrate-kinetics-b2', 'justification', 'Answers no: Ag stays +1 and Cl stays −1, so no oxidation numbers change.', ['says yes because a solid forms'], 'No; the oxidation numbers (+1 for Ag, −1 for Cl) do not change.', 'Yes, a precipitate forms.'),
    ]),
    part('C', 'For ce{Zn(s) + Cu^2+(aq) -> Zn^2+(aq) + Cu(s)}, E° = +1.10 V. Calculate ΔG° in kJ/mol_rxn and state whether the reaction is thermodynamically favorable under standard conditions.', [
      pt('chem-long-nitrate-kinetics-c1', 'calculation', String.raw`Calculates \(\Delta G^\circ = -nFE^\circ = -(2)(96{,}485)(1.10) = -212\ \mathrm{kJ/mol_{rxn}}\) and concludes favorable.`, ['uses n = 1', 'reports in J without converting'], String.raw`\(\Delta G^\circ = -212\ \mathrm{kJ/mol_{rxn}} < 0\), so favorable.`, String.raw`\(-106\ \mathrm{kJ/mol}\).`),
    ]),
    part('D', 'A current of 2.50 A passes through a ce{CuSO4} solution for 1800 s, depositing copper on the cathode. Calculate (i) the moles of electrons transferred and (ii) the mass of copper deposited.', [
      pt('chem-long-nitrate-kinetics-d1', 'calculation', 'Calculates 0.0466 mol of electrons.', ['divides by 2 at this step'], String.raw`\((2.50)(1800) = 4500\ \mathrm{C}\); \(4500 \div 96{,}485 = 0.0466\) mol e⁻.`, '4500 mol.'),
      pt('chem-long-nitrate-kinetics-d2', 'calculation', 'Calculates 1.48 g Cu using 2 mol e⁻ per mol Cu.', ['uses 1 mol e⁻ per Cu (2.96 g)'], String.raw`\(0.0466 \div 2 = 0.0233\) mol Cu \(\times 63.55 = 1.48\) g.`, '2.96 g.'),
    ]),
    part('E', 'The decomposition of ce{N2O5} was monitored at constant temperature (Table 1). Explain how the data show that the reaction is first order.', [
      pt('chem-long-nitrate-kinetics-e1', 'explanation', 'Explains first order: the half-life is constant (about 23 min), or ln[N₂O₅] versus time is linear (equal time intervals give equal concentration ratios, about 0.74).', ['says the concentration decreases linearly'], 'Each 10-minute interval multiplies the concentration by about 0.74, so ln[N₂O₅] versus t is a straight line.', 'The concentration goes down over time.'),
    ], [tableFigure('Table 1', ['Time (min)', '[N₂O₅] (M)'], n2o5Rows)]),
    part('F', 'Calculate the rate constant k, including units.', [
      pt('chem-long-nitrate-kinetics-f1', 'calculation', 'Calculates k ≈ 0.030 min⁻¹ (accept 0.029–0.031).', ['uses a zero-order slope', 'omits units'], String.raw`\(k = \dfrac{\ln(0.0800/0.0240)}{40\text{ min}} = 0.030\ \mathrm{min^{-1}}\).`, String.raw`\(k = 0.0014\ M/\mathrm{min}\).`),
    ]),
    part('G', 'The experiment is repeated at the same temperature with an initial [N₂O₅] of 0.0400 M. Describe the graph of ln[N₂O₅] versus time for the new experiment compared with the original.', [
      pt('chem-long-nitrate-kinetics-g1', 'representation', 'Describes a straight line starting at ln(0.0400) ≈ −3.22 and parallel to (same slope as) the original line, which starts at ln(0.0800) ≈ −2.53.', ['draws a steeper line', 'starts at the same point'], 'A parallel line shifted down by ln 2, starting at −3.22.', 'A line with half the slope.'),
    ]),
  ],
  sampleResponse: String.raw`A (i) Trigonal planar. (ii) N in the center with one N=O double bond and two N–O single bonds; the double-bonded O has two lone pairs, each single-bonded O has three; brackets with a 1− charge. B (i) ce{Ag^+(aq) + Cl^-(aq) -> AgCl(s)}. (ii) No; Ag remains +1 and Cl remains −1. C \(\Delta G^\circ = -(2)(96{,}485)(1.10) = -212\ \mathrm{kJ/mol_{rxn}}\): favorable. D (i) \((2.50)(1800) = 4500\) C; \(4500 \div 96{,}485 = 0.0466\) mol e⁻. (ii) \(0.0233\) mol Cu \(\times 63.55 = 1.48\) g. E The half-life is constant (about 23 min); equal time intervals give the same fractional decrease, so ln[N₂O₅] vs. t is linear. F \(k = \ln(0.0800/0.0240)/40 = 0.030\ \mathrm{min^{-1}}\). G A straight line parallel to the original, starting at ln(0.0400) = −3.22 instead of −2.53.`,
});

// ── 10. Long answer (2026 Q3: weak acid equilibrium, temperature and Ka, titration, indicator) ──
const formicCurve = titrationCurve(1.8e-4, 0.100, 20.00, 0.125, 30);
frqs.push({
  id: 'chem-long-formic-acid', questionNumber: 3, title: 'Formic Acid', topic: 'Weak acid equilibria and titration',
  modeledOn: modeled(2026, 3, LONG), timeAllottedMin: 23,
  prompt: String.raw`Formic acid, ce{HCOOH}, is a weak acid with \(K_a = 1.8\times10^{-4}\) at 25 °C: ce{HCOOH(aq) + H2O(l) <=> H3O^+(aq) + HCOO^-(aq)}.`,
  parts: [
    part('A', 'Identify one conjugate acid-base pair in the equation.', [
      pt('chem-long-formic-acid-a1', 'explanation', 'Identifies ce{HCOOH}/ce{HCOO^-} or ce{H3O^+}/ce{H2O}, with the acid and base labeled.', ['pairs HCOOH with H₃O⁺'], 'HCOOH (acid) and HCOO⁻ (base).', 'HCOOH and H₂O.'),
    ]),
    part('B', 'A 0.100 M solution of ce{HCOOH} has a pH of 2.38. (i) Calculate [H₃O⁺]. (ii) Calculate the equilibrium [HCOOH].', [
      pt('chem-long-formic-acid-b1', 'calculation', String.raw`Calculates \([\mathrm{H_3O^+}] = 10^{-2.38} = 4.2\times10^{-3}\ M\).`, ['computes 10^2.38'], String.raw`\(10^{-2.38} = 4.2\times10^{-3}\ M\).`, '240 M.'),
      pt('chem-long-formic-acid-b2', 'calculation', 'Calculates 0.096 M (0.100 − 0.0042).', ['reports 0.100 M without subtracting'], '0.100 − 0.0042 = 0.0958 M.', '0.104 M.'),
    ]),
    part('C', String.raw`At 50 °C, an equilibrium solution has \([\mathrm{H_3O^+}] = [\mathrm{HCOO^-}] = 4.4\times10^{-3}\ M\) and [HCOOH] = 0.0956 M. (i) Calculate \(K_a\) at 50 °C. (ii) Is the ionization of formic acid endothermic or exothermic? Justify your answer.`, [
      pt('chem-long-formic-acid-c1', 'calculation', String.raw`Calculates \(K_a = \dfrac{(4.4\times10^{-3})^2}{0.0956} = 2.0\times10^{-4}\).`, ['forgets to square'], String.raw`\(K_a = 2.0\times10^{-4}\).`, String.raw`\(4.6\times10^{-2}\).`),
      pt('chem-long-formic-acid-c2', 'justification', 'Concludes endothermic because Ka increases with temperature (consistent with part C (i)).', ['concludes exothermic'], 'Endothermic: K is larger at the higher temperature.', 'Exothermic.'),
    ]),
    part('D', 'A 20.00 mL sample of ce{HCOOH} is titrated with 0.125 M ce{NaOH} (Figure 1). Estimate the pH at the equivalence point.', [
      pt('chem-long-formic-acid-d1', 'calculation', 'Estimates about 8.2 (accept 7 < pH ≤ 10).', ['says 7 for a weak acid titration'], 'About 8.2.', '7.0.'),
    ], [fig('Figure 1', graph({ x: [0, 30], y: [0, 14], xstep: 5, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Volume of 0.125 M NaOH added (mL)', ytitle: 'pH', curves: [{ pts: formicCurve }], w: 380, h: 300, alt: 'Titration curve of 20.00 mL formic acid with 0.125 M NaOH. The pH starts near 2.4, rises through a buffer region, jumps steeply at 16.0 mL, and levels off near pH 12' }))]),
    part('E', 'The equivalence point occurs at 16.00 mL. Calculate the initial concentration of the ce{HCOOH} sample.', [
      pt('chem-long-formic-acid-e1', 'calculation', 'Calculates 0.100 M.', ['divides by 16.00 mL'], String.raw`\((0.01600)(0.125) = 2.00\times10^{-3}\) mol; \(\div 0.02000\ \mathrm{L} = 0.100\ M\).`, '0.125 M.'),
    ]),
    part('F', 'Identify the volume of ce{NaOH} at which pH = pKa, and give that pH.', [
      pt('chem-long-formic-acid-f1', 'calculation', 'Identifies 8.00 mL (half-equivalence) with pH ≈ 3.74.', ['identifies the equivalence point'], '8.00 mL, pH = 3.74.', '16.00 mL.'),
    ]),
    part('G', 'Calculate K for the reaction ce{HCOOH(aq) + OH^-(aq) -> HCOO^-(aq) + H2O(l)}.', [
      pt('chem-long-formic-acid-g1', 'calculation', String.raw`Calculates \(K = \dfrac{K_a}{K_w} = 1.8\times10^{10}\).`, ['multiplies Ka by Kw'], String.raw`\(K = \dfrac{1.8\times10^{-4}}{1.0\times10^{-14}} = 1.8\times10^{10}\).`, String.raw`\(1.8\times10^{-18}\).`),
    ]),
    part('H', 'A student suggests methyl red (color change pH 4.4–6.2) as the indicator for this titration. Do you agree? Justify your answer.', [
      pt('chem-long-formic-acid-h1', 'justification', 'Disagrees: methyl red changes color well before the equivalence point (pH about 8.2); an indicator such as phenolphthalein (8.2–10) is better.', ['agrees because it changes color during the titration'], 'Disagree; its range ends far below the equivalence pH of about 8.2, so phenolphthalein is better.', 'Agree.'),
    ]),
  ],
  sampleResponse: String.raw`A ce{HCOOH} (acid) and ce{HCOO^-} (conjugate base). B (i) \(10^{-2.38} = 4.2\times10^{-3}\ M\). (ii) 0.100 − 0.0042 = 0.096 M. C (i) \(K_a = (4.4\times10^{-3})^2/0.0956 = 2.0\times10^{-4}\). (ii) Endothermic, since \(K_a\) increases at higher temperature. D About 8.2. E \(2.00\times10^{-3}\) mol \(\div 0.02000\) L = 0.100 M. F At 8.00 mL, pH = pKa = 3.74. G \(K = K_a/K_w = 1.8\times10^{10}\). H Disagree: methyl red changes color well before the equivalence point near pH 8.2; phenolphthalein would be better.`,
});

// ── 11. Short answer (2026 Q4: bond strength, Kp from an ICE table, favorability and temperature) ──
frqs.push({
  id: 'chem-short-dinitrogen-tetroxide', questionNumber: 4, title: 'N₂O₄ and NO₂ Equilibrium', topic: 'Bonding and gas-phase equilibrium',
  modeledOn: modeled(2026, 4, SHORT), timeAllottedMin: 9,
  prompt: 'Dinitrogen tetroxide dissociates: ce{N2O4(g) <=> 2NO2(g)}. The reaction breaks the N–N single bond in ce{N2O4}.',
  parts: [
    part('A', 'Explain why less energy is needed to break the N–N bond in ce{N2O4} than the bond in ce{N2}.', [
      pt('chem-short-dinitrogen-tetroxide-a1', 'explanation', 'Explains that ce{N2} has a triple bond (bond order 3), which is shorter and stronger than the N–N single bond.', ['says N₂ is a smaller molecule'], 'N₂ has a triple bond, which is much stronger than a single bond.', 'N₂O₄ is heavier.'),
    ]),
    part('B', 'A rigid flask initially contains ce{N2O4} at 0.600 atm and no ce{NO2}. At equilibrium the partial pressure of ce{NO2} is 0.360 atm. (i) Calculate the equilibrium partial pressure of ce{N2O4}. (ii) Calculate Kp.', [
      pt('chem-short-dinitrogen-tetroxide-b1', 'calculation', 'Calculates 0.420 atm (0.600 − ½ × 0.360).', ['subtracts 0.360'], '0.600 − 0.180 = 0.420 atm.', '0.240 atm.'),
      pt('chem-short-dinitrogen-tetroxide-b2', 'calculation', 'Calculates Kp = 0.309, consistent with part B (i).', ['forgets to square'], String.raw`\(K_p = \dfrac{(0.360)^2}{0.420} = 0.309\).`, '0.857.'),
    ]),
    part('C', 'The dissociation is thermodynamically favorable only at high temperatures. A student claims the reaction is endothermic. Do you agree? Justify your answer.', [
      pt('chem-short-dinitrogen-tetroxide-c1', 'justification', 'Agrees: moles of gas increase, so ΔS° > 0; since ΔG° = ΔH° − TΔS° is negative only at high T, ΔH° must be positive.', ['disagrees because breaking bonds releases energy'], 'Agree. ΔS° > 0 (1 mol gas → 2 mol), and favorability only at high T means ΔH° > 0.', 'Disagree.'),
    ]),
  ],
  sampleResponse: String.raw`A ce{N2} has a triple bond, which is shorter and stronger than the N–N single bond in ce{N2O4}. B (i) \(0.600 - \tfrac{1}{2}(0.360) = 0.420\) atm. (ii) \(K_p = (0.360)^2/0.420 = 0.309\). C Agree: one mole of gas forms two, so ΔS° > 0. Because ΔG° = ΔH° − TΔS° is negative only at high temperature, ΔH° must be positive (endothermic).`,
});

// ── 12. Short answer (2026 Q5: bond polarity, bond angles, intermolecular forces and boiling points) ──
frqs.push({
  id: 'chem-short-halomethanes', questionNumber: 5, title: 'Halomethanes', topic: 'Bond polarity, VSEPR, and intermolecular forces',
  modeledOn: modeled(2026, 5, SHORT), timeAllottedMin: 9,
  prompt: 'Halomethanes are molecules in which halogen atoms replace hydrogen atoms in methane. Carbon tetrachloride, ce{CCl4}, boils at 77 °C; dichloromethane, ce{CH2Cl2}, boils at 40 °C.',
  parts: [
    part('A', 'In ce{CH2FCl}, which bond is the most polar? Justify your answer.', [
      pt('chem-short-halomethanes-a1', 'justification', 'Identifies the C–F bond, because F has the greatest electronegativity difference from C.', ['picks C–Cl because Cl is larger'], 'C–F: the electronegativity difference between C and F is the greatest.', 'C–Cl.'),
    ]),
    part('B', 'The H–O–H bond angle in water (104.5°) is smaller than the H–C–H angle in methane (109.5°). Explain.', [
      pt('chem-short-halomethanes-b1', 'explanation', 'Explains that the two lone pairs on oxygen repel the bonding pairs more strongly than bonding pairs do, compressing the angle.', ['says oxygen is more electronegative'], 'Lone pairs take up more space and push the O–H bonds closer together.', 'Water is smaller.'),
    ]),
    part('C', '(i) Identify all types of intermolecular forces in liquid ce{CCl4} and in liquid ce{CH2Cl2}. (ii) Explain why ce{CCl4} has the higher boiling point.', [
      pt('chem-short-halomethanes-c1', 'explanation', 'ce{CCl4}: London dispersion only. ce{CH2Cl2}: London dispersion and dipole-dipole.', ['assigns dipole-dipole to CCl₄', 'assigns hydrogen bonding'], 'CCl₄: LDF; CH₂Cl₂: LDF and dipole-dipole.', 'Both have dipole-dipole forces.'),
      pt('chem-short-halomethanes-c2', 'explanation', 'Explains that ce{CCl4} has more electrons and a larger, more polarizable electron cloud, so its London forces exceed the combined forces in ce{CH2Cl2}.', ['says CCl₄ has hydrogen bonding'], 'CCl₄’s much larger electron cloud gives stronger dispersion forces than CH₂Cl₂’s dispersion plus dipole forces.', 'CCl₄ is polar.'),
    ]),
  ],
  sampleResponse: 'A The C–F bond, since the electronegativity difference between C and F is the largest. B The two lone pairs on oxygen repel the bonding pairs more strongly than bonding pairs repel each other, so the H–O–H angle is compressed below 109.5°. C (i) ce{CCl4}: London dispersion forces only; ce{CH2Cl2}: London dispersion and dipole-dipole forces. (ii) ce{CCl4} has more electrons and a larger, more polarizable electron cloud, so its dispersion forces are stronger than the combined forces among ce{CH2Cl2} molecules.',
});

// ── 13. Short answer (2026 Q6: particle view, Beer's law, dilution, error analysis) ──
frqs.push({
  id: 'chem-short-copper-absorbance', questionNumber: 6, title: 'Copper(II) by Spectrophotometry', topic: 'Beer’s law and dilution',
  modeledOn: modeled(2026, 6, SHORT), timeAllottedMin: 9,
  prompt: 'A student uses a spectrophotometer (path length 1.00 cm) to find the concentration of ce{Cu^2+} in a solution. A calibration curve made from standard solutions is shown in Figure 1.',
  figures: [fig('Figure 1', graph({ x: [0, 0.06], y: [0, 0.7], xstep: 0.01, ystep: 0.1, xlabel: '', ylabel: '', xtitle: 'Concentration of Cu²⁺ (M)', ytitle: 'Absorbance', curves: [{ pts: [[0, 0], [0.055, 0.66]] }], dots: [[0.01, 0.12], [0.02, 0.24], [0.03, 0.36], [0.04, 0.48], [0.05, 0.60]].map(([x, y]) => ({ x, y })), w: 380, h: 280, alt: 'Calibration curve: absorbance versus Cu2+ concentration is a straight line through the origin with points (0.010, 0.12), (0.020, 0.24), (0.030, 0.36), (0.040, 0.48), and (0.050, 0.60)' }))],
  parts: [
    part('A', 'A particle view of a small volume of one standard solution shows 6 ce{Cu^2+} ions, and the solution has an absorbance of 0.30. How many ce{Cu^2+} ions would appear in the same volume of a solution with an absorbance of 0.15? Explain.', [
      pt('chem-short-copper-absorbance-a1', 'representation', 'States 3 ions, because absorbance is directly proportional to concentration.', ['states 12 ions'], '3 ions; half the absorbance means half the concentration.', '12 ions.'),
    ]),
    part('B', 'The diluted unknown has an absorbance of 0.42. (i) Determine its ce{Cu^2+} concentration. (ii) The diluted unknown was made by diluting 5.00 mL of the original solution to 50.00 mL. Calculate the concentration of the original solution.', [
      pt('chem-short-copper-absorbance-b1', 'calculation', 'Determines 0.035 M (accept 0.034–0.036) from the graph or A = εbc with ε = 12.0 M⁻¹ cm⁻¹.', ['divides by the wrong slope'], String.raw`\(c = \dfrac{0.42}{(12.0)(1.00)} = 0.035\ M\).`, '5.0 M.'),
      pt('chem-short-copper-absorbance-b2', 'calculation', 'Calculates 0.35 M using M₁V₁ = M₂V₂, consistent with part B (i).', ['dilutes instead of concentrating (0.0035 M)'], String.raw`\(M_1 = \dfrac{(0.035)(50.00)}{5.00} = 0.35\ M\).`, '0.0035 M.'),
    ]),
    part('C', 'The cuvette holding the unknown had fingerprints on its outer surface that absorbed some light. A student claims this made the calculated concentration of the original solution too low. Do you agree? Justify your answer.', [
      pt('chem-short-copper-absorbance-c1', 'justification', 'Disagrees: the fingerprints increase the measured absorbance, which gives a calculated concentration that is too high.', ['agrees'], 'Disagree; extra absorbed light raises A, so the calculated concentration is too high.', 'Agree.'),
    ]),
  ],
  sampleResponse: String.raw`A 3 ions: absorbance is proportional to concentration, so half the absorbance means half as many ions in the same volume. B (i) From the slope, ε = 12.0 M⁻¹ cm⁻¹, so \(c = 0.42/12.0 = 0.035\ M\). (ii) \(M_1 = (0.035)(50.00)/5.00 = 0.35\ M\). C Disagree: the fingerprints raise the measured absorbance, so the calculated concentration is too high.`,
});

// ── 14. Short answer (2026 Q7: ΔH°f from ΔH°rxn, limiting reactant, Coulombic attraction) ──
frqs.push({
  id: 'chem-short-magnesium-oxide', questionNumber: 7, title: 'Burning Magnesium', topic: 'Thermochemistry, stoichiometry, and ionic solids',
  modeledOn: modeled(2026, 7, SHORT), timeAllottedMin: 9,
  prompt: 'Magnesium burns in oxygen: ce{2Mg(s) + O2(g) -> 2MgO(s)}, ΔH° = −1203 kJ/mol_rxn.',
  parts: [
    part('A', 'Calculate ΔH°f for ce{MgO(s)}.', [
      pt('chem-short-magnesium-oxide-a1', 'calculation', 'Calculates −602 kJ/mol (half of −1203).', ['reports −1203 kJ/mol'], '−1203 ÷ 2 = −602 kJ/mol.', '−1203 kJ/mol.'),
    ]),
    part('B', 'A 4.86 g sample of Mg reacts with 4.00 g of ce{O2}. (i) Identify the limiting reactant, with supporting calculations. (ii) Calculate the energy released, in kJ.', [
      pt('chem-short-magnesium-oxide-b1', 'calculation', 'Identifies Mg as limiting: 0.200 mol Mg needs only 0.100 mol ce{O2}, but 0.125 mol is present.', ['picks O₂ because its mass is smaller'], '0.200 mol Mg and 0.125 mol O₂; Mg needs 0.100 mol O₂, so Mg is limiting.', 'O₂ is limiting.'),
      pt('chem-short-magnesium-oxide-b2', 'calculation', 'Calculates 120 kJ released, consistent with the limiting reactant.', ['uses 0.200 mol rxn instead of 0.100'], String.raw`\(0.200\text{ mol Mg} \times \dfrac{1203\text{ kJ}}{2\text{ mol Mg}} = 120\) kJ released.`, '241 kJ.'),
    ]),
    part('C', 'The melting point of ce{MgO} (2852 °C) is much higher than that of ce{NaCl} (801 °C). Explain in terms of Coulombic attractions.', [
      pt('chem-short-magnesium-oxide-c1', 'explanation', 'Explains that ce{Mg^2+} and ce{O^2-} have larger charges (and smaller radii) than ce{Na^+} and ce{Cl^-}, so the Coulombic attractions in the lattice are much stronger.', ['refers to covalent bonds in MgO'], 'MgO’s 2+ and 2− ions, which are also smaller, attract far more strongly than the 1+ and 1− ions in NaCl.', 'MgO has stronger covalent bonds.'),
    ]),
  ],
  sampleResponse: String.raw`A −1203 ÷ 2 = −602 kJ/mol. B (i) \(4.86 \div 24.31 = 0.200\) mol Mg needs 0.100 mol ce{O2}; there is \(4.00 \div 32.00 = 0.125\) mol ce{O2}, so Mg is limiting. (ii) \(0.200 \times 1203/2 = 120\) kJ released. C ce{Mg^2+} and ce{O^2-} carry twice the charge of ce{Na^+} and ce{Cl^-} and are smaller, so their Coulombic attractions are much stronger, giving MgO a far higher melting point.`,
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'chem-long-calcium-fluoride',
  transcript: String.raw`A (i) 0.692(62.93) + 0.308(64.93) = 63.55 amu. (ii) Two more neutrons.

B (i) ce{Ca^2+} has a bigger charge, so it pulls harder on the negative oxygen end of water. (ii) ce{Ca^2+} has more protons.

C [OH⁻] = 0.0080 M, pOH = 2.10, pH = 11.90.

D (2.0 × 10⁻³)(40.0/100.0) = 8.0 × 10⁻⁴ M.

E (i) \(K_{sp} = [\mathrm{Ca^{2+}}][\mathrm{F^-}]^2\). (ii) \(Q = (8.0\times10^{-4})(1.8\times10^{-3})^2 = 2.6\times10^{-9}\). (iii) Q > Ksp, so a precipitate forms.

F It decreases because H⁺ reacts with F⁻ to make HF, so more ce{CaF2} dissolves.`,
  evidence: {
    'chem-long-calcium-fluoride-a1': '0.692(62.93) + 0.308(64.93) = 63.55 amu', 'chem-long-calcium-fluoride-a2': 'Two more neutrons.',
    'chem-long-calcium-fluoride-b1': 'has a bigger charge, so it pulls harder on the negative oxygen end of water',
    'chem-long-calcium-fluoride-c1': 'pH = 11.90', 'chem-long-calcium-fluoride-d1': '8.0 × 10⁻⁴ M',
    'chem-long-calcium-fluoride-e1': String.raw`\(K_{sp} = [\mathrm{Ca^{2+}}][\mathrm{F^-}]^2\)`, 'chem-long-calcium-fluoride-e2': String.raw`\(Q = 2.6\times10^{-9}\)`, 'chem-long-calcium-fluoride-e3': 'Q > Ksp, so a precipitate forms.',
    'chem-long-calcium-fluoride-f1': 'H⁺ reacts with F⁻ to make HF, so more CaF₂ dissolves',
  },
  missed: { 'chem-long-calcium-fluoride-b2': 'Part B (ii) asks about size. More protons is not the reason; say that ce{Ca^2+} is smaller, so water’s oxygen can get closer and the Coulombic attraction is stronger.' },
  priorityFix: 'Answer the factor the part names. B (ii) asks about ion size: the smaller ce{Ca^2+} lets water approach more closely, and Coulombic attraction grows as distance shrinks.',
  sampleResponseComparison: 'Every part except B (ii) matches the sample response. The sample explains the size effect through the shorter distance between the ion and water.',
};

module.exports = { course: 'ap-chemistry', frqs: frqs.map(chemAll), canned: chemAll(canned) };
