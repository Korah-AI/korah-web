// AP Chemistry units 6–9: thermochemistry, equilibrium, acids and bases, and thermodynamics
// and electrochemistry. Same block format and chemical notation as chem-a.cjs.
const { graph, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');
const { chem } = require('./chemtext.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6';
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const m = v => String.raw`\(${v}\)`;
const Kw = 1e-14;

// pH of a titration of an acid (fractions of each deprotonated form given by Ka values)
// with 0.100 M NaOH, found from the charge balance by bisection on pH.
function titrationPH(vAcid, cAcid, kas, vBase, cBase = 0.1) {
  const vt = (vAcid + vBase) / 1000, ca = cAcid * vAcid / 1000 / vt, na = cBase * vBase / 1000 / vt;
  const negative = h => { // total negative charge from the acid's conjugate bases
    const terms = [1]; kas.forEach((k, i) => terms.push(terms[i] * k / h));
    const sum = terms.reduce((a, b) => a + b, 0);
    return ca * terms.reduce((a, t, i) => a + i * t, 0) / sum;
  };
  let lo = 0, hi = 14;
  for (let i = 0; i < 80; i++) { const ph = (lo + hi) / 2, h = 10 ** -ph; (h + na - negative(h) - Kw / h > 0) ? lo = ph : hi = ph; }
  return (lo + hi) / 2;
}

function cell() {
  return draw(420, 250, 'A galvanic cell. On the left, a zinc electrode dips into a solution of 1.0 M zinc nitrate; on the right, a copper electrode dips into a solution of 1.0 M copper(II) nitrate. A salt bridge containing KNO3 connects the two solutions, and a wire through a voltmeter connects the electrodes', [
    ['path', 'M40 110 V230 H170 V110', { width: 2.2 }], ['path', 'M250 110 V230 H380 V110', { width: 2.2 }], ['rect', 41, 140, 128, 89, { fill: true, width: 0.1 }], ['rect', 251, 140, 128, 89, { fill: BLUE, color: BLUE, width: 0.1 }],
    ['rect', 92, 70, 16, 130, { fill: 'currentColor' }], ['rect', 312, 70, 16, 130, { fill: '#b87333', color: '#b87333' }],
    ['path', 'M140 190 V100 Q210 70 280 100 V190', { width: 14, color: 'currentColor' }], ['path', 'M140 190 V100 Q210 70 280 100 V190', { width: 10, color: '#f8f8f8' }],
    ['path', 'M100 70 V30 H180 M240 30 H320 V70'], ['circle', 210, 30, 26, { fill: true }], text(210, 35, 'V', { bold: true, size: 14 }),
    text(100, 245, 'Zn | 1.0 M Zn²⁺', { size: 11 }), text(320, 245, 'Cu | 1.0 M Cu²⁺', { size: 11 }), text(210, 105, 'salt bridge (KNO₃)', { size: 10 }),
  ]);
}

const weakTitration = Array.from({ length: 161 }, (_, i) => { const v = i * 0.25; return [v, titrationPH(20, 0.1, [1.8e-5], v)]; });
const diproticTitration = Array.from({ length: 201 }, (_, i) => { const v = i * 0.25; return [v, titrationPH(20, 0.1, [1e-3, 1e-7], v)]; });

const figures = {
  heating: graph({ x: [0, 36], y: [-40, 140], xstep: 4, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Time (minutes), heat added at a constant rate', ytitle: 'Temperature (°C)', w: 390,
    curves: [{ pts: [[0, -20], [1, 0], [4, 0], [14, 100], [34, 100], [35, 120]] }], notes: [{ x: 1.4, y: 8, text: 'P' }, { x: 8.2, y: 58, text: 'Q' }, { x: 23, y: 108, text: 'R' }],
    alt: 'Heating curve for 18.0 grams of ice heated at a constant rate. The temperature rises from −20 °C to 0 °C in 1 minute, stays at 0 °C from minute 1 to minute 4 (segment P), rises to 100 °C at minute 14 (segment Q), stays at 100 °C from minute 14 to minute 34 (segment R), and then rises to 120 °C' }),
  equilibrium: graph({ x: [0, 10], y: [0, 0.14], xstep: 1, ystep: 0.02, xlabel: '', ylabel: '', xtitle: 'Time (minutes)', ytitle: 'Concentration (M)', w: 390,
    curves: [
      { fn: t => (t < 5 ? 0.1 - 0.04 * (1 - Math.exp(-t / 0.8)) : 0.06 + 0.0152 * (1 - Math.exp(-(t - 5) / 0.8))), from: 0, to: 10 },
      { fn: t => 0.08 * (1 - Math.exp(-t / 0.8)), from: 0, to: 4.999, color: PINK }, { pts: [[5, 0.08], [5, 0.12]], color: PINK }, { fn: t => 0.12 - 0.0304 * (1 - Math.exp(-(t - 5) / 0.8)), from: 5, to: 10, color: PINK },
    ],
    notes: [{ x: 0.3, y: 0.104, text: 'N₂O₄' }, { x: 2.8, y: 0.085, text: 'NO₂' }],
    alt: 'Concentrations over time for the reaction N2O4 ⇌ 2 NO2 in a sealed container. N2O4 starts at 0.100 M and falls to a constant 0.060 M; NO2 starts at 0 and rises to a constant 0.080 M by about 3 minutes. At 5 minutes, NO2 suddenly increases to 0.120 M. Afterward NO2 decreases to about 0.090 M while N2O4 increases to about 0.075 M, and both become constant again' }),
  ksp: table(['Compound', m('K_{sp}') + ' at 25°C'], [[m('\\mathrm{AgCl}'), m('1.8\\times 10^{-10}')], [m('\\mathrm{Ag_2CrO_4}'), m('1.1\\times 10^{-12}')], [m('\\mathrm{CaF_2}'), m('3.9\\times 10^{-11}')], [m('\\mathrm{Mg(OH)_2}'), m('5.6\\times 10^{-12}')]],
    'Table of solubility-product constants at 25 °C: AgCl, 1.8 × 10⁻¹⁰; Ag2CrO4, 1.1 × 10⁻¹²; CaF2, 3.9 × 10⁻¹¹; Mg(OH)2, 5.6 × 10⁻¹²'),
  titration: graph({ x: [0, 40], y: [0, 14], xstep: 5, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Volume of 0.100 M NaOH added (mL)', ytitle: 'pH', w: 390, curves: [{ pts: weakTitration }],
    dots: [{ x: 10, y: titrationPH(20, 0.1, [1.8e-5], 10), color: PINK }, { x: 20, y: titrationPH(20, 0.1, [1.8e-5], 20), color: PINK }], notes: [{ x: 10.6, y: 3.6, text: 'J' }, { x: 20.8, y: 7.9, text: 'K' }],
    alt: 'Titration curve for 20.0 mL of a 0.100 M weak monoprotic acid titrated with 0.100 M NaOH. The pH starts near 2.9, rises gradually through a buffer region, and passes point J at 10.0 mL, where the pH is about 4.7. It rises steeply near point K at 20.0 mL, the equivalence point, where the pH is about 8.7, and levels off near 12.5' }),
  diprotic: graph({ x: [0, 50], y: [0, 14], xstep: 10, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Volume of 0.100 M NaOH added (mL)', ytitle: 'pH', w: 390, curves: [{ pts: diproticTitration }],
    dots: [10, 20, 30].map(v => ({ x: v, y: titrationPH(20, 0.1, [1e-3, 1e-7], v), color: PINK })),
    notes: [{ x: 10.8, y: 2.0, text: 'W' }, { x: 20.8, y: 4.4, text: 'X' }, { x: 30.8, y: 6.2, text: 'Y' }],
    alt: 'Titration curve for 20.0 mL of a 0.100 M diprotic acid H2A titrated with 0.100 M NaOH. Two rises appear: the first equivalence point at 20.0 mL (point X, pH about 5) and the second at 40.0 mL (pH about 10). Point W at 10.0 mL has a pH of about 3.0, and point Y at 30.0 mL has a pH of about 7.0' }),
  pka: table(['Acid', m('K_a'), m('pK_a')], [['Formic acid, HCOOH', m('1.8\\times 10^{-4}'), m('3.74')], ['Acetic acid, CH₃COOH', m('1.8\\times 10^{-5}'), m('4.74')], ['Dihydrogen phosphate, H₂PO₄⁻', m('6.2\\times 10^{-8}'), m('7.21')], ['Ammonium, NH₄⁺', m('5.6\\times 10^{-10}'), m('9.25')]],
    'Table of acids with Ka and pKa: formic acid, 1.8 × 10⁻⁴, 3.74; acetic acid, 1.8 × 10⁻⁵, 4.74; dihydrogen phosphate, 6.2 × 10⁻⁸, 7.21; ammonium, 5.6 × 10⁻¹⁰, 9.25'),
  cell: cell(),
  potentials: table(['Half-reaction', m('E^\\circ') + ' (V)'], [
    [m('\\mathrm{Ag^{+} + e^{-} \\longrightarrow Ag}'), m('+0.80')], [m('\\mathrm{Cu^{2+} + 2e^{-} \\longrightarrow Cu}'), m('+0.34')], [m('\\mathrm{Fe^{2+} + 2e^{-} \\longrightarrow Fe}'), m('-0.44')],
    [m('\\mathrm{Zn^{2+} + 2e^{-} \\longrightarrow Zn}'), m('-0.76')], [m('\\mathrm{Al^{3+} + 3e^{-} \\longrightarrow Al}'), m('-1.66')],
  ], 'Table of standard reduction potentials: silver ion to silver, +0.80 V; copper(II) to copper, +0.34 V; iron(II) to iron, −0.44 V; zinc ion to zinc, −0.76 V; aluminum ion to aluminum, −1.66 V'),
};

const source = chem(String.raw`
@ 6 | c | Phase changes | heating
During segment R of the heating curve, energy is added but the temperature does not change. What happens to that energy?
* It increases the potential energy of the molecules as intermolecular attractions are overcome.
- It increases the average kinetic energy of the molecules.
- It breaks the covalent O–H bonds in the water molecules.
- It is lost to the surroundings.
= At the boiling point, added energy separates molecules into the gas phase by overcoming hydrogen bonds. The average kinetic energy, and so the temperature, stays constant until the phase change is complete.

@ 6 | q | Phase changes | heating
Melting the \(18.0\text{ g}\) sample (segment P) requires \(6.01\text{ kJ}\). Heat is added at a constant rate. Based on the graph, what is the approximate molar enthalpy of vaporization of water?
* About \(40\text{ kJ/mol}\)
- About \(6\text{ kJ/mol}\)
- About \(20\text{ kJ/mol}\)
- About \(120\text{ kJ/mol}\)
= Segment P lasts 3 minutes, so heat is added at about \(2.0\text{ kJ/min}\). Segment R lasts 20 minutes, about \(40\text{ kJ}\) for \(18.0\text{ g}\), or \(1.00\text{ mol}\), of water.

@ 6 | c | Heat capacity | heating
Segment Q rises more slowly than the segment before P, although heat is added at the same rate. What does this indicate?
* Liquid water has a greater specific heat capacity than ice.
- Liquid water has a smaller specific heat capacity than ice.
- Ice has stronger intermolecular forces than liquid water.
- Energy is lost to evaporation during segment Q.
= The slope of a heating curve is inversely proportional to the heat capacity. More energy is needed to raise the temperature of liquid water by each degree.

@ 6 | q | Calorimetry
When \(50.0\text{ mL}\) of \(1.00\text{ M}\) HCl and \(50.0\text{ mL}\) of \(1.00\text{ M}\) NaOH are mixed in a coffee-cup calorimeter, the temperature rises by \(6.8^\circ\text{C}\). Assuming the solution has a mass of \(100.0\text{ g}\) and a specific heat of \(4.18\text{ J/(g}\cdot{}^\circ\text{C)}\), what is \(\Delta H\) of neutralization?
* About \(-57\text{ kJ/mol}\)
- About \(-28\text{ kJ/mol}\)
- About \(+57\text{ kJ/mol}\)
- About \(-2.8\text{ kJ/mol}\)
= \(q=(100.0)(4.18)(6.8)=2842\text{ J}\) is absorbed by the solution, so the reaction releases it. Dividing by \(0.0500\text{ mol}\) of water formed gives \(\Delta H\approx -57\text{ kJ/mol}\).

@ 6 | q | Calorimetry
A \(50.0\text{ g}\) metal sample at \(100.0^\circ\text{C}\) is placed in \(100.0\text{ g}\) of water at \(20.0^\circ\text{C}\). The final temperature is \(23.0^\circ\text{C}\). What is the specific heat of the metal? (Water: \(4.18\text{ J/(g}\cdot{}^\circ\text{C)}\))
* About \(0.33\text{ J/(g}\cdot{}^\circ\text{C)}\)
- About \(0.16\text{ J/(g}\cdot{}^\circ\text{C)}\)
- About \(4.18\text{ J/(g}\cdot{}^\circ\text{C)}\)
- About \(1.09\text{ J/(g}\cdot{}^\circ\text{C)}\)
= The water gains \(100.0(4.18)(3.0)=1254\text{ J}\), which the metal loses as it cools by \(77.0^\circ\text{C}\): \(c=\dfrac{1254}{(50.0)(77.0)}\approx 0.33\).

@ 6 | q | Bond enthalpies
Using average bond enthalpies of \(436\) (H–H), \(242\) (Cl–Cl), and \(431\text{ kJ/mol}\) (H–Cl), what is \(\Delta H\) for ce{H2(g) + Cl2(g) -> 2HCl(g)}?
* \(-184\text{ kJ}\)
- \(+184\text{ kJ}\)
- \(+247\text{ kJ}\)
- \(-431\text{ kJ}\)
= \(\Delta H=\sum(\text{bonds broken})-\sum(\text{bonds formed})=(436+242)-2(431)=-184\text{ kJ}\). Two H–Cl bonds form.

@ 6 | q | Enthalpy of formation
Given \(\Delta H_f^\circ\) values of \(-74.8\) for ce{CH4(g)}, \(-393.5\) for ce{CO2(g)}, and \(-285.8\text{ kJ/mol}\) for ce{H2O(l)}, what is \(\Delta H^\circ\) for ce{CH4(g) + 2O2(g) -> CO2(g) + 2H2O(l)}?
* \(-890.3\text{ kJ}\)
- \(-604.5\text{ kJ}\)
- \(-1040\text{ kJ}\)
- \(+890.3\text{ kJ}\)
= \(\Delta H^\circ=[-393.5+2(-285.8)]-[-74.8+0]=-890.3\text{ kJ}\). Elements in their standard states, such as ce{O2(g)}, have \(\Delta H_f^\circ=0\).

@ 6 | c | Enthalpy of dissolution
When ce{NH4NO3} dissolves in water in a cold pack, the solution becomes cold. Which statement is correct?
* The process is endothermic: energy is absorbed from the water, and more energy is needed to separate the ions than is released when they are hydrated.
- The process is exothermic, because the solution's temperature changes.
- Energy flows from the cold pack into the person's skin.
- No bonds or attractions are broken when an ionic solid dissolves.
= Dissolving involves breaking ion–ion attractions and water–water attractions, which absorbs energy, and forming ion–water attractions, which releases energy. Here the net process absorbs energy, lowering the temperature.

@ 6 | c | Thermal equilibrium
A hot iron block is placed in cool water in an insulated container. Which statement describes the system when it reaches thermal equilibrium?
* The iron and the water have the same temperature, and the energy lost by the iron equals the energy gained by the water.
- The iron and the water have the same thermal energy.
- The iron and the water changed temperature by the same amount.
- Heat continues to flow from the iron to the water.
= Thermal energy is transferred by collisions until the average kinetic energies, and therefore the temperatures, are equal. Their temperature changes differ because their masses and heat capacities differ.

@ 6 | q | Phase changes
How much energy is required to melt \(36.0\text{ g}\) of ice at \(0^\circ\text{C}\)? (\(\Delta H_{fus}=6.01\text{ kJ/mol}\))
* \(12.0\text{ kJ}\)
- \(6.01\text{ kJ}\)
- \(216\text{ kJ}\)
- \(3.00\text{ kJ}\)
= \(36.0\text{ g}\) is \(2.00\text{ mol}\) of water, and \(2.00(6.01)=12.0\text{ kJ}\).

@ 6 | c | Calorimetry
A student's coffee-cup calorimeter loses some heat to the surroundings during an exothermic reaction. How does this affect the calculated magnitude of \(\Delta H\)?
* It is too small, because the measured temperature increase is smaller than it should be.
- It is too large, because the reaction releases more heat.
- It is unaffected, because \(\Delta H\) depends only on the reaction.
- It is too large, because the calorimeter absorbs heat.
= The calculation assumes all of the heat released stays in the solution. Heat that escapes is not measured, so the calculated magnitude is too small.

@ 6 | c | Enthalpy of formation
Which reaction has a \(\Delta H^\circ\) equal to the standard enthalpy of formation of liquid water?
* ce{H2(g) + 1/2O2(g) -> H2O(l)}
- ce{2H2(g) + O2(g) -> 2H2O(l)}
- ce{H2O(g) -> H2O(l)}
- ce{2H(g) + O(g) -> H2O(l)}
= A formation reaction makes exactly one mole of the compound from its elements in their standard states. Hydrogen and oxygen are diatomic gases in their standard states.

@ 6 | q | Hess's law
Given ce{C(s) + O2(g) -> CO2(g)}, \(\Delta H=-393.5\text{ kJ}\), and ce{CO(g) + 1/2O2(g) -> CO2(g)}, \(\Delta H=-283.0\text{ kJ}\), what is \(\Delta H\) for ce{C(s) + 1/2O2(g) -> CO(g)}?
* \(-110.5\text{ kJ}\)
- \(-676.5\text{ kJ}\)
- \(+110.5\text{ kJ}\)
- \(-393.5\text{ kJ}\)
= Keep the first equation and reverse the second: \(-393.5+283.0=-110.5\text{ kJ}\). The ce{CO2} cancels, along with half a mole of ce{O2}.

@ 6 | q | Hess's law
For ce{N2(g) + 3H2(g) -> 2NH3(g)}, \(\Delta H=-92\text{ kJ}\). What is \(\Delta H\) for ce{4NH3(g) -> 2N2(g) + 6H2(g)}?
* \(+184\text{ kJ}\)
- \(-184\text{ kJ}\)
- \(+92\text{ kJ}\)
- \(+46\text{ kJ}\)
= Reversing the reaction changes the sign, and doubling it doubles \(\Delta H\): \(2(+92)=+184\text{ kJ}\).

@ 6 | q | Thermochemical stoichiometry
For ce{2H2(g) + O2(g) -> 2H2O(l)}, \(\Delta H=-572\text{ kJ}\). How much heat is released when \(8.0\text{ g}\) of ce{H2} burns? Use \(2.0\text{ g/mol}\) for ce{H2}.
* \(1144\text{ kJ}\)
- \(572\text{ kJ}\)
- \(2288\text{ kJ}\)
- \(286\text{ kJ}\)
= \(8.0\text{ g}\) is \(4.0\text{ mol}\) of ce{H2}. The \(\Delta H\) given is for \(2\text{ mol}\), so the heat released is \(2(572)=1144\text{ kJ}\).

@ 6 | c | Energy of bonds
Which statement best explains why the combustion of methane is exothermic?
* The bonds formed in ce{CO2} and ce{H2O} are, in total, stronger than the bonds broken in ce{CH4} and ce{O2}.
- Breaking the C–H bonds in methane releases energy.
- The products have more potential energy than the reactants.
- Oxygen gas stores energy in its double bond, which is released when it breaks.
= Breaking any bond requires energy. More energy is released in forming the strong C=O and O–H bonds than is absorbed in breaking the reactant bonds, so the products are lower in potential energy.

@ 6 | c | Heat capacity
Equal masses of aluminum (\(0.90\text{ J/(g}\cdot{}^\circ\text{C)}\)) and iron (\(0.45\text{ J/(g}\cdot{}^\circ\text{C)}\)) absorb the same amount of heat. Which statement is correct?
* The iron's temperature increases twice as much as the aluminum's.
- The aluminum's temperature increases twice as much as the iron's.
- Both temperatures increase by the same amount.
- The aluminum's temperature increases four times as much.
= \(\Delta T=\dfrac{q}{mc}\). With equal \(q\) and \(m\), halving the specific heat doubles the temperature change.

@ 6 | c | Sign conventions
Which statement about an exothermic process at constant pressure is correct?
* \(q\) for the system is negative, \(\Delta H\) is negative, and the surroundings warm up.
- \(q\) for the system is positive, and the surroundings cool down.
- \(\Delta H\) is positive, because energy is released.
- The system gains energy from the surroundings.
= In an exothermic process the system transfers energy to the surroundings, so the system's \(q\) and \(\Delta H\) are negative.

@ 6 | c | Enthalpy of vaporization
Why is the enthalpy of vaporization of a substance much greater than its enthalpy of fusion?
* Vaporization separates molecules almost completely, overcoming nearly all intermolecular attractions, while melting overcomes only some of them.
- Vaporization breaks covalent bonds, while melting does not.
- Vaporization occurs at a higher temperature, which requires more energy.
- Melting releases energy, while vaporization absorbs it.
= In a liquid, molecules are still close together and attract one another. Converting the liquid to a gas pulls them far apart, which requires much more energy.

@ 6 | q | Calorimetry
How much heat is needed to warm \(250\text{ g}\) of water from \(20.0^\circ\text{C}\) to \(80.0^\circ\text{C}\)? (\(c=4.18\text{ J/(g}\cdot{}^\circ\text{C)}\))
* \(62.7\text{ kJ}\)
- \(20.9\text{ kJ}\)
- \(83.6\text{ kJ}\)
- \(15.0\text{ kJ}\)
= \(q=mc\Delta T=250(4.18)(60.0)=62{,}700\text{ J}=62.7\text{ kJ}\). Using the final temperature instead of the change gives \(83.6\text{ kJ}\).

@ 6 | c | Enthalpy diagrams
On an energy diagram for an endothermic reaction, how are the reactants and products positioned?
* The products are higher in energy than the reactants, and \(\Delta H\) is positive.
- The products are lower in energy than the reactants, and \(\Delta H\) is positive.
- The products and reactants are at the same energy.
- The transition state is lower than the products.
= An endothermic reaction absorbs energy, so the products store more potential energy. The transition state is always at the top of the energy barrier.

@ 6 | q | Hess's law
Given ce{S(s) + O2(g) -> SO2(g)}, \(\Delta H=-297\text{ kJ}\), and ce{2SO3(g) -> 2SO2(g) + O2(g)}, \(\Delta H=+198\text{ kJ}\), what is \(\Delta H\) for ce{S(s) + 3/2O2(g) -> SO3(g)}?
* \(-396\text{ kJ}\)
- \(-99\text{ kJ}\)
- \(-495\text{ kJ}\)
- \(+396\text{ kJ}\)
= Keep the first equation, and reverse and halve the second: \(-297+\tfrac{1}{2}(-198)=-297-99=-396\text{ kJ}\).

@ 7 | c | Equilibrium constants
What is the equilibrium constant expression \(K_p\) for ce{CaCO3(s) <=> CaO(s) + CO2(g)}?
* \(K_p=P_{\mathrm{CO_2}}\)
- \(K_p=\dfrac{P_{\mathrm{CO_2}}[\mathrm{CaO}]}{[\mathrm{CaCO_3}]}\)
- \(K_p=\dfrac{1}{P_{\mathrm{CO_2}}}\)
- \(K_p=[\mathrm{CaO}]P_{\mathrm{CO_2}}\)
= Pure solids are omitted from equilibrium expressions because their concentrations do not change. Only the partial pressure of the gas appears.

@ 7 | c | Reaction quotient
For a reaction, \(K=4.0\times 10^{-3}\). In a mixture, \(Q=2.0\times 10^{-2}\). Which statement is correct?
* The reaction proceeds toward reactants until \(Q=K\).
- The reaction proceeds toward products until \(Q=K\).
- The mixture is at equilibrium.
- The reaction stops.
= Since \(Q>K\), the ratio of products to reactants is too large. The reverse reaction is faster until the ratio decreases to \(K\).

@ 7 | q | Equilibrium calculations
For ce{H2(g) + I2(g) <=> 2HI(g)}, \(K_c=49\). If \(1.0\text{ mol}\) each of ce{H2} and ce{I2} are placed in a \(1.0\text{ L}\) container, what is [HI] at equilibrium?
* \(1.56\text{ M}\)
- \(0.78\text{ M}\)
- \(7.0\text{ M}\)
- \(1.75\text{ M}\)
= With \(x\) mol/L reacting, \(\dfrac{(2x)^2}{(1.0-x)^2}=49\), so \(\dfrac{2x}{1.0-x}=7\) and \(x=\tfrac{7}{9}\approx 0.78\). Then \([\mathrm{HI}]=2x\approx 1.56\text{ M}\).

@ 7 | q | Manipulating K
For ce{N2(g) + 3H2(g) <=> 2NH3(g)}, the equilibrium constant is \(K\). What is the equilibrium constant for ce{4NH3(g) <=> 2N2(g) + 6H2(g)}?
* \(\dfrac{1}{K^2}\)
- \(-2K\)
- \(\dfrac{1}{2K}\)
- \(K^2\)
= Reversing a reaction inverts \(K\), and multiplying the coefficients by 2 squares it.

@ 7 | q | Kp and Kc
For ce{N2O4(g) <=> 2NO2(g)} at \(400\text{ K}\), \(K_c=1.0\). What is \(K_p\)? Use \(R=0.0821\text{ L}\cdot\text{atm/(mol}\cdot\text{K)}\).
* About \(33\)
- \(1.0\)
- About \(0.030\)
- About \(1100\)
= \(K_p=K_c(RT)^{\Delta n}\), with \(\Delta n=2-1=1\): \(K_p=1.0(0.0821)(400)\approx 33\).

@ 7 | c | Le Chatelier's principle
Argon gas is added to an equilibrium mixture of ce{N2}, ce{H2}, and ce{NH3} in a rigid container. How does the equilibrium respond?
* It does not shift, because the partial pressures of the reacting gases do not change.
- It shifts toward ce{NH3}, because the total pressure increases.
- It shifts toward ce{N2} and ce{H2}.
- The equilibrium constant increases.
= In a fixed volume, adding an inert gas leaves the concentrations of the reacting species unchanged, so \(Q\) still equals \(K\).

@ 7 | c | Le Chatelier's principle
The volume of a container holding ce{2SO2(g) + O2(g) <=> 2SO3(g)} at equilibrium is halved at constant temperature. What happens?
* The equilibrium shifts toward ce{SO3}, the side with fewer moles of gas.
- The equilibrium shifts toward ce{SO2} and ce{O2}.
- The value of \(K\) increases.
- Nothing, because the temperature is constant.
= Halving the volume doubles all partial pressures, making \(Q<K\) because the product side has fewer moles of gas. The system shifts forward to restore \(Q=K\); \(K\) itself does not change.

@ 7 | c | Temperature and K
For an exothermic reaction at equilibrium, the temperature is raised. How do \(K\) and the amounts of products change?
* \(K\) decreases, and the amounts of products decrease.
- \(K\) increases, and the amounts of products increase.
- \(K\) stays the same, but the amounts of products decrease.
- \(K\) decreases, but the amounts of products increase.
= Heat behaves like a product of an exothermic reaction. Raising the temperature favors the reverse, endothermic direction, which lowers \(K\). Temperature is the only change that alters \(K\).

@ 7 | c | Equilibrium graphs | equilibrium
What change was made to the system at 5 minutes, and how did the system respond?
* ce{NO2} was added, and the system shifted toward ce{N2O4}.
- ce{N2O4} was added, and the system shifted toward ce{NO2}.
- The temperature was raised, and the system shifted toward ce{N2O4}.
- A catalyst was added, and the system shifted toward ce{N2O4}.
= Only ce{NO2} jumps suddenly at 5 minutes. Afterward ce{NO2} decreases and ce{N2O4} increases as the reverse reaction consumes the added ce{NO2}. A catalyst would not shift the equilibrium.

@ 7 | q | Equilibrium graphs | equilibrium
Based on the graph, what is \(K_c\) for ce{N2O4 <=> 2NO2} under these conditions?
* About \(0.11\)
- About \(1.3\)
- About \(0.75\)
- About \(9.4\)
= Before 5 minutes, \(K_c=\dfrac{[\mathrm{NO_2}]^2}{[\mathrm{N_2O_4}]}=\dfrac{(0.080)^2}{0.060}\approx 0.11\). The new equilibrium after 5 minutes gives the same value, \(\tfrac{(0.090)^2}{0.075}\).

@ 7 | q | Solubility equilibria
The molar solubility of ce{PbI2} is \(1.5\times 10^{-3}\text{ M}\). What is its \(K_{sp}\)?
* \(1.4\times 10^{-8}\)
- \(2.3\times 10^{-6}\)
- \(3.4\times 10^{-9}\)
- \(4.5\times 10^{-6}\)
= Dissolving \(s\) mol/L gives \([\mathrm{Pb^{2+}}]=s\) and \([\mathrm{I^-}]=2s\), so \(K_{sp}=s(2s)^2=4s^3=4(1.5\times 10^{-3})^3\approx 1.4\times 10^{-8}\).

@ 7 | c | Solubility equilibria | ksp
Which compound in the table has the greatest molar solubility in pure water?
* ce{CaF2}
- AgCl
- ce{Ag2CrO4}
- ce{Mg(OH)2}
= \(K_{sp}\) values can be compared directly only for salts with the same ion ratio. For ce{CaF2}, \(s=\sqrt[3]{K_{sp}/4}\approx 2.1\times 10^{-4}\text{ M}\), greater than for the others; AgCl, despite the largest \(K_{sp}\), has \(s\approx 1.3\times 10^{-5}\text{ M}\).

@ 7 | q | Common-ion effect | ksp
What is the molar solubility of AgCl in \(0.10\text{ M}\) NaCl?
* \(1.8\times 10^{-9}\text{ M}\)
- \(1.3\times 10^{-5}\text{ M}\)
- \(1.8\times 10^{-10}\text{ M}\)
- \(4.2\times 10^{-5}\text{ M}\)
= With \([\mathrm{Cl^-}]\approx 0.10\text{ M}\), \(s=\dfrac{1.8\times 10^{-10}}{0.10}=1.8\times 10^{-9}\text{ M}\), far less than in pure water.

@ 7 | c | pH and solubility | ksp
Which compound in the table becomes much more soluble when the solution is acidified?
* ce{Mg(OH)2}
- AgCl
- All four equally
- None, because pH does not affect solubility
= Added ce{H^+} reacts with ce{OH^-}, removing a product of the dissolution and shifting the equilibrium toward dissolving. Chloride is the conjugate base of a strong acid, so AgCl is unaffected.

@ 7 | q | Precipitation
Equal volumes of \(2.0\times 10^{-4}\text{ M}\) ce{AgNO3} and \(2.0\times 10^{-4}\text{ M}\) NaCl are mixed. Does a precipitate form? (\(K_{sp}\) of AgCl \(=1.8\times 10^{-10}\))
* Yes, because \(Q=1.0\times 10^{-8}\), which is greater than \(K_{sp}\)
- No, because \(Q<K_{sp}\)
- Yes, because \(Q=4.0\times 10^{-8}\), which is greater than \(K_{sp}\)
- It cannot be determined without the actual volumes
= Mixing equal volumes halves each concentration to \(1.0\times 10^{-4}\text{ M}\), so \(Q=(1.0\times 10^{-4})^2=1.0\times 10^{-8}\), which exceeds \(K_{sp}\). Using the undiluted concentrations gives the incorrect \(4.0\times 10^{-8}\).

@ 7 | c | Magnitude of K
For a reaction at \(25^\circ\text{C}\), \(K=3\times 10^{-15}\). Which statement is correct?
* At equilibrium, the mixture consists mostly of reactants.
- At equilibrium, the mixture consists mostly of products.
- The reaction is very slow.
- The reaction cannot reach equilibrium.
= A very small \(K\) means the ratio of products to reactants at equilibrium is tiny. \(K\) says nothing about how fast equilibrium is reached.

@ 7 | c | Dynamic equilibrium
A small amount of radioactive ce{I2} is added to a saturated solution in contact with solid ce{I2}. Later, radioactivity is found in the solid. What does this show?
* Dissolving and crystallizing continue at equal rates at equilibrium.
- The solution was not saturated.
- Radioactive iodine is less soluble than ordinary iodine.
- Equilibrium stops all molecular motion.
= Equilibrium is dynamic: molecules continuously leave and rejoin the solid, so labeled molecules end up in the solid even though the amounts do not change.

@ 7 | q | Equilibrium calculations
For ce{A(g) <=> 2B(g)}, \(K_c=4.0\times 10^{-4}\). If \(0.10\text{ M}\) A is placed in a container, what is [B] at equilibrium?
* About \(6.3\times 10^{-3}\text{ M}\)
- About \(3.2\times 10^{-3}\text{ M}\)
- About \(2.0\times 10^{-2}\text{ M}\)
- About \(4.0\times 10^{-5}\text{ M}\)
= With \(x\) reacting, \(\dfrac{(2x)^2}{0.10-x}\approx\dfrac{4x^2}{0.10}=4.0\times 10^{-4}\), so \(x\approx 3.2\times 10^{-3}\). Then \([\mathrm{B}]=2x\approx 6.3\times 10^{-3}\text{ M}\).

@ 7 | c | Le Chatelier's principle
More solid ce{CaCO3} is added to the equilibrium ce{CaCO3(s) <=> CaO(s) + CO2(g)} in a closed container. What happens to the pressure of ce{CO2}?
* It does not change.
- It increases.
- It decreases.
- It doubles.
= Pure solids do not appear in the equilibrium expression, so adding solid does not change \(Q\). The ce{CO2} pressure remains equal to \(K_p\).

@ 7 | c | Catalysts and equilibrium
A catalyst is added to a reaction mixture at equilibrium. What happens?
* Nothing changes, because the catalyst speeds up the forward and reverse reactions equally.
- More products form.
- More reactants form.
- \(K\) increases.
= A catalyst lowers the activation energy for both directions by the same amount, so it does not change the equilibrium position or \(K\). It only helps a system reach equilibrium faster.

@ 7 | q | Equilibrium particle diagrams
A closed container at equilibrium for ce{X2(g) <=> 2X(g)} holds 4 ce{X2} molecules and 4 X atoms in a volume where each particle represents \(0.10\text{ M}\). What is \(K_c\)?
* \(0.40\)
- \(1.0\)
- \(0.20\)
- \(4.0\)
= \([\mathrm{X}]=0.40\text{ M}\) and \([\mathrm{X_2}]=0.40\text{ M}\), so \(K_c=\dfrac{(0.40)^2}{0.40}=0.40\). The particle counts alone, without concentration, would give \(\tfrac{16}{4}=4\).

@ 8 | q | pH of strong acids
What is the pH of \(0.0050\text{ M}\) HCl?
* \(2.30\)
- \(5.00\)
- \(2.00\)
- \(11.70\)
= HCl ionizes completely, so \([\mathrm{H_3O^+}]=0.0050\text{ M}\) and \(\text{pH}=-\log(0.0050)=2.30\).

@ 8 | q | pH of strong bases
What is the pH of \(0.020\text{ M}\) ce{Ba(OH)2}?
* \(12.60\)
- \(12.30\)
- \(1.40\)
- \(13.00\)
= Each formula unit releases two ce{OH^-}, so \([\mathrm{OH^-}]=0.040\text{ M}\), \(\text{pOH}=1.40\), and \(\text{pH}=12.60\). Forgetting the 2 gives \(12.30\).

@ 8 | q | Weak acids
What is the pH of \(0.10\text{ M}\) acetic acid (\(K_a=1.8\times 10^{-5}\))?
* \(2.87\)
- \(1.00\)
- \(4.74\)
- \(5.74\)
= \([\mathrm{H_3O^+}]\approx\sqrt{K_aC}=\sqrt{1.8\times 10^{-6}}=1.34\times 10^{-3}\text{ M}\), so \(\text{pH}=2.87\). A pH of \(1.00\) would apply to a strong acid.

@ 8 | c | Percent ionization
How does the percent ionization of a weak acid change when its solution is diluted?
* It increases, because the equilibrium shifts toward the side with more dissolved particles.
- It decreases, because there is less acid.
- It does not change, because \(K_a\) is constant.
- It drops to zero.
= Diluting lowers every concentration, making \(Q<K_a\). The acid ionizes further, so a larger fraction is ionized even though \([\mathrm{H_3O^+}]\) decreases.

@ 8 | q | Ka and Kb
The \(K_a\) of acetic acid is \(1.8\times 10^{-5}\). What is \(K_b\) for the acetate ion?
* \(5.6\times 10^{-10}\)
- \(1.8\times 10^{-5}\)
- \(5.6\times 10^{4}\)
- \(1.8\times 10^{-19}\)
= For a conjugate acid–base pair, \(K_aK_b=K_w=1.0\times 10^{-14}\), so \(K_b=\dfrac{1.0\times 10^{-14}}{1.8\times 10^{-5}}=5.6\times 10^{-10}\).

@ 8 | q | Titration curves | titration
Based on the titration curve, what is \(K_a\) of the acid?
* About \(2\times 10^{-5}\)
- About \(2\times 10^{-9}\)
- About \(1\times 10^{-3}\)
- About \(5\times 10^{-5}\)
= At point J, the half-equivalence point, half of the acid has been converted to its conjugate base, so \([\mathrm{HA}]=[\mathrm{A^-}]\) and \(\text{pH}=\text{p}K_a\approx 4.7\). Then \(K_a=10^{-4.7}\approx 2\times 10^{-5}\).

@ 8 | c | Titration curves | titration
Why is the pH at point K greater than 7?
* At the equivalence point the solution contains the conjugate base of a weak acid, which reacts with water to produce ce{OH^-}.
- Excess NaOH has been added.
- Some of the weak acid remains un-ionized.
- ce{Na^+} ions make the solution basic.
= All of the HA has become ce{A^-}, which is a weak base: ce{A^- + H2O <=> HA + OH^-}. ce{Na^+} has no effect on pH.

@ 8 | c | Indicators | titration
Which indicator is most suitable for the titration shown?
* Phenolphthalein, which changes color between pH 8.2 and 10
- Methyl orange, which changes color between pH 3.1 and 4.4
- Methyl red, which changes color between pH 4.4 and 6.2
- Any indicator, because all change color at pH 7
= An indicator should change color within the steep rise around the equivalence point, which is centered near pH 8.7. Methyl orange would change color early, in the buffer region.

@ 8 | c | Titration curves | titration
After \(30.0\text{ mL}\) of NaOH have been added in the titration shown, which species is present in the greatest amount, other than water and ce{Na^+}?
* ce{A^-}
- HA
- ce{OH^-}
- ce{H3O^+}
= Of the \(3.0\text{ mmol}\) of ce{OH^-} added, \(2.0\text{ mmol}\) converted all of the HA to \(2.0\text{ mmol}\) of ce{A^-}, leaving \(1.0\text{ mmol}\) of excess ce{OH^-}.

@ 8 | q | Buffers
What is the pH of a buffer that is \(0.20\text{ M}\) acetic acid and \(0.10\text{ M}\) sodium acetate (\(\text{p}K_a=4.74\))?
* \(4.44\)
- \(5.04\)
- \(4.74\)
- \(2.87\)
= \(\text{pH}=\text{p}K_a+\log\dfrac{[\mathrm{A^-}]}{[\mathrm{HA}]}=4.74+\log 0.5=4.44\). With more acid than base, the pH is below the \(\text{p}K_a\).

@ 8 | c | Buffer capacity
Buffer 1 is \(0.50\text{ M}\) HA and \(0.50\text{ M}\) ce{A^-}; buffer 2 is \(0.050\text{ M}\) HA and \(0.050\text{ M}\) ce{A^-}. Which statement is correct?
* They have the same pH, but buffer 1 can neutralize more added acid or base.
- Buffer 1 has a lower pH.
- Buffer 2 has a greater capacity because it is more dilute.
- They have the same capacity because the ratios are equal.
= pH depends on the ratio \(\tfrac{[\mathrm{A^-}]}{[\mathrm{HA}]}\), which is 1 for both. Capacity depends on the amounts of HA and ce{A^-} available to react, which is ten times greater in buffer 1.

@ 8 | c | Buffers
A small amount of HCl is added to an acetic acid–acetate buffer. Which reaction occurs?
* ce{H3O^+ + C2H3O2^- -> HC2H3O2 + H2O}
- ce{H3O^+ + OH^- -> 2H2O}
- ce{HC2H3O2 + H3O^+ -> H2C2H3O2^+ + H2O}
- ce{Cl^- + HC2H3O2 -> HCl + C2H3O2^-}
= The base component of the buffer consumes the added strong acid, converting it to the weak acid. The ratio of base to acid changes only slightly, so the pH barely changes.

@ 8 | c | Buffer selection | pka
A student needs a buffer with a pH of about \(9.2\). Which acid–conjugate base pair from the table is the best choice?
* ce{NH4^+} and ce{NH3}
- Acetic acid and acetate
- Formic acid and formate
- ce{H2PO4^-} and ce{HPO4^2-}
= A buffer works best when \(\text{pH}\approx\text{p}K_a\), so that both components are present in similar amounts. The \(\text{p}K_a\) of ammonium is \(9.25\).

@ 8 | c | pH and pKa | pka
A solution of formic acid is adjusted to pH \(7.0\). Which form predominates?
* The formate ion, ce{HCOO^-}
- Formic acid, HCOOH
- Equal amounts of both
- It cannot be determined.
= When the pH is above the \(\text{p}K_a\), here \(3.74\), the deprotonated form predominates. At pH 7, the ratio of formate to formic acid is \(10^{3.26}\), about 1800 to 1.

@ 8 | q | pH and pKa | pka
In a solution of acetic acid at pH \(5.74\), what is the ratio \(\dfrac{[\mathrm{CH_3COO^-}]}{[\mathrm{CH_3COOH}]}\)?
* \(10\)
- \(0.10\)
- \(1.0\)
- \(100\)
= \(\text{pH}-\text{p}K_a=5.74-4.74=1.00\), so \(\log\dfrac{[\mathrm{A^-}]}{[\mathrm{HA}]}=1.00\) and the ratio is \(10\).

@ 8 | c | Polyprotic acids | diprotic
In the titration of the diprotic acid shown, what is the main form of the acid at point X?
* ce{HA^-}
- ce{H2A}
- ce{A^2-}
- Equal amounts of ce{H2A} and ce{A^2-}
= Point X, at \(20.0\text{ mL}\), is the first equivalence point: exactly one proton has been removed from each ce{H2A}.

@ 8 | q | Polyprotic acids | diprotic
Based on the titration curve, what are the two \(\text{p}K_a\) values of the acid?
* About \(3.0\) and \(7.0\)
- About \(5.0\) and \(10.0\)
- About \(2.0\) and \(4.4\)
- About \(3.0\) and \(10.0\)
= Point W is halfway to the first equivalence point, where \([\mathrm{H_2A}]=[\mathrm{HA^-}]\) and \(\text{pH}=\text{p}K_{a1}\). Point Y is halfway between the two equivalence points, where \([\mathrm{HA^-}]=[\mathrm{A^{2-}}]\) and \(\text{pH}=\text{p}K_{a2}\).

@ 8 | c | Acid strength
Which statement best explains why HF is a weak acid while HCl is a strong acid?
* The H–F bond is much stronger than the H–Cl bond, so HF ionizes less in water.
- Fluorine is less electronegative than chlorine.
- HF molecules are larger than HCl molecules.
- HF does not dissolve in water.
= Bond strength matters more than electronegativity in this case. The small fluorine atom forms a short, strong bond with hydrogen, so HF only partly ionizes.

@ 8 | c | Salt solutions
Which salt forms an acidic solution when dissolved in water?
* ce{NH4Cl}
- NaCl
- ce{NaC2H3O2}
- ce{KNO3}
= ce{NH4^+} is a weak acid that donates protons to water, while ce{Cl^-} is a negligible base. Sodium acetate is basic, and NaCl and ce{KNO3} are neutral.

@ 8 | c | Autoionization of water
At \(50^\circ\text{C}\), \(K_w=5.5\times 10^{-14}\). What is true of pure water at this temperature?
* Its pH is less than 7, but it is still neutral because \([\mathrm{H_3O^+}]=[\mathrm{OH^-}]\).
- Its pH is 7.
- It is acidic, because its pH is less than 7.
- It is basic, because \(K_w\) increased.
= \([\mathrm{H_3O^+}]=\sqrt{5.5\times 10^{-14}}\approx 2.3\times 10^{-7}\), so the pH is about \(6.6\). Neutrality means equal concentrations of hydronium and hydroxide, not a pH of 7.

@ 8 | q | Acid–base reactions
\(50.0\text{ mL}\) of \(0.10\text{ M}\) HCl is mixed with \(50.0\text{ mL}\) of \(0.10\text{ M}\) ce{NH3}. What is the pH of the resulting solution? (\(K_a\) of ce{NH4^+} \(=5.6\times 10^{-10}\))
* About \(5.3\)
- \(7.0\)
- About \(9.3\)
- About \(1.3\)
= The acid and base neutralize exactly, forming \(0.050\text{ M}\) ce{NH4^+}. Then \([\mathrm{H_3O^+}]=\sqrt{(5.6\times 10^{-10})(0.050)}\approx 5.3\times 10^{-6}\), so the pH is about \(5.3\).

@ 9 | c | Entropy
Which reaction has a negative \(\Delta S^\circ\)?
* ce{2SO2(g) + O2(g) -> 2SO3(g)}
- ce{CaCO3(s) -> CaO(s) + CO2(g)}
- ce{H2O(l) -> H2O(g)}
- ce{2H2O2(l) -> 2H2O(l) + O2(g)}
= Three moles of gas become two, decreasing the number of ways energy and matter can be dispersed. The other reactions produce gas.

@ 9 | c | Gibbs free energy
A reaction has \(\Delta H>0\) and \(\Delta S>0\). Under which conditions is it thermodynamically favored?
* Only at high temperatures
- Only at low temperatures
- At all temperatures
- At no temperature
= \(\Delta G=\Delta H-T\Delta S\). The positive \(\Delta H\) works against the reaction, so it is favored only when \(T\Delta S\) is large enough to make \(\Delta G\) negative.

@ 9 | q | Gibbs free energy
For ce{CaCO3(s) -> CaO(s) + CO2(g)}, \(\Delta H^\circ=+178\text{ kJ/mol}\) and \(\Delta S^\circ=+161\text{ J/(mol}\cdot\text{K)}\). Above about what temperature is the reaction thermodynamically favored?
* \(1100\text{ K}\)
- \(1.1\text{ K}\)
- \(298\text{ K}\)
- \(0.90\text{ K}\)
= \(\Delta G=0\) when \(T=\dfrac{\Delta H}{\Delta S}=\dfrac{178{,}000}{161}\approx 1100\text{ K}\). Forgetting to convert kJ to J gives \(1.1\text{ K}\).

@ 9 | q | Gibbs free energy
For ce{N2(g) + 3H2(g) -> 2NH3(g)}, \(\Delta H^\circ=-92.2\text{ kJ}\) and \(\Delta S^\circ=-198.7\text{ J/K}\). What is \(\Delta G^\circ\) at \(298\text{ K}\)?
* \(-33.0\text{ kJ}\)
- \(-151.4\text{ kJ}\)
- \(+59{,}100\text{ kJ}\)
- \(-92.0\text{ kJ}\)
= \(\Delta G^\circ=-92.2-298(-0.1987)=-92.2+59.2=-33.0\text{ kJ}\). Adding \(T\Delta S\) instead of subtracting gives \(-151.4\).

@ 9 | q | Free energy and equilibrium
For a reaction at \(298\text{ K}\), \(\Delta G^\circ=-33.0\text{ kJ/mol}\). Approximately what is \(K\)?
* \(6\times 10^{5}\)
- \(1.6\times 10^{-6}\)
- \(13\)
- \(1.0\)
= \(K=e^{-\Delta G^\circ/RT}=e^{33{,}000/(8.314\times 298)}=e^{13.3}\approx 6\times 10^{5}\). A negative \(\Delta G^\circ\) always corresponds to \(K>1\).

@ 9 | c | Kinetic control
The conversion of diamond to graphite has \(\Delta G^\circ<0\), yet diamonds last for millions of years. Which best explains this?
* The reaction has a very large activation energy, so it is extremely slow at room temperature.
- \(\Delta G^\circ\) is positive at room temperature.
- Diamond is in equilibrium with graphite.
- The reaction requires a catalyst to be thermodynamically favored.
= A negative \(\Delta G\) shows only that products are favored, not how fast they form. The process is under kinetic control.

@ 9 | c | Coupled reactions
A reaction with \(\Delta G^\circ=+20\text{ kJ}\) is coupled with the hydrolysis of ATP, \(\Delta G^\circ=-30\text{ kJ}\). Which statement is correct?
* The combined process has \(\Delta G^\circ=-10\text{ kJ}\) and is thermodynamically favored.
- The combined process has \(\Delta G^\circ=+50\text{ kJ}\).
- Coupling makes the first reaction faster but not favored.
- Coupling is impossible because the reactions have opposite signs.
= Free energies of reactions that share an intermediate add. Living cells drive unfavorable reactions by coupling them to favorable ones such as ATP hydrolysis.

@ 9 | c | Galvanic cells | cell
In the cell shown, which electrode is the anode, and in which direction do electrons flow through the wire?
* The zinc electrode; from zinc to copper
- The copper electrode; from copper to zinc
- The zinc electrode; from copper to zinc
- The copper electrode; from zinc to copper
= Zinc has the more negative reduction potential, so it is oxidized at the anode: ce{Zn -> Zn^2+ + 2e^-}. Electrons travel through the wire to the copper cathode, where ce{Cu^2+} is reduced.

@ 9 | c | Galvanic cells | cell
As the cell shown operates, which ions move through the salt bridge, and in which directions?
* ce{NO3^-} toward the zinc compartment and ce{K^+} toward the copper compartment
- ce{NO3^-} toward the copper compartment and ce{K^+} toward the zinc compartment
- ce{Zn^2+} through the salt bridge to the copper compartment
- Electrons through the salt bridge to the zinc compartment
= The anode compartment gains ce{Zn^2+}, so anions flow in to keep it neutral; the cathode compartment loses ce{Cu^2+}, so cations flow in. Electrons never travel through the solution.

@ 9 | q | Cell potential | cell
Using the table of reduction potentials, what is \(E^\circ_{\text{cell}}\) for the cell shown?
* \(1.10\text{ V}\)
- \(0.42\text{ V}\)
- \(-1.10\text{ V}\)
- \(1.86\text{ V}\)
= \(E^\circ_{\text{cell}}=E^\circ_{\text{cathode}}-E^\circ_{\text{anode}}=0.34-(-0.76)=1.10\text{ V}\). A positive cell potential means the reaction is thermodynamically favored.

@ 9 | q | Free energy and cell potential
What is \(\Delta G^\circ\) for the reaction in the cell shown, ce{Zn(s) + Cu^2+(aq) -> Zn^2+(aq) + Cu(s)}, with \(E^\circ=1.10\text{ V}\)? (\(F=96{,}485\text{ C/mol}\))
* About \(-212\text{ kJ}\)
- About \(-106\text{ kJ}\)
- About \(+212\text{ kJ}\)
- About \(-212{,}000\text{ kJ}\)
= \(\Delta G^\circ=-nFE^\circ=-(2)(96{,}485)(1.10)=-212{,}000\text{ J}\). Two moles of electrons transfer per mole of reaction.

@ 9 | c | Reduction potentials | potentials
Which species in the table is the strongest reducing agent?
* Al
- ce{Ag^+}
- ce{Al^3+}
- Ag
= The metal whose ion has the most negative reduction potential is most easily oxidized, so it most readily gives electrons to other species. ce{Ag^+} is the strongest oxidizing agent.

@ 9 | q | Cell potential | potentials
What is the standard cell potential of a galvanic cell made from aluminum and silver half-cells?
* \(2.46\text{ V}\)
- \(0.86\text{ V}\)
- \(4.06\text{ V}\)
- \(5.18\text{ V}\)
= \(E^\circ=0.80-(-1.66)=2.46\text{ V}\). The reduction potential is an intensive property, so it is not multiplied by the coefficients needed to balance electrons.

@ 9 | c | Nonstandard conditions
In the zinc–copper cell, the concentration of ce{Cu^2+} is increased while ce{Zn^2+} stays at \(1.0\text{ M}\). How does the cell potential change?
* It increases, because \(Q\) decreases and the reaction is driven further toward products.
- It decreases, because more copper ions must be reduced.
- It stays at \(1.10\text{ V}\).
- It becomes zero.
= \(Q=\dfrac{[\mathrm{Zn^{2+}}]}{[\mathrm{Cu^{2+}}]}\) decreases. As \(Q\) falls below 1, the cell potential rises above \(E^\circ\).

@ 9 | c | Equilibrium in cells
A galvanic cell has run until its voltage is zero. Which statement is true?
* The cell reaction has reached equilibrium, so \(Q=K\) and \(\Delta G=0\).
- All of the reactants have been used up.
- \(E^\circ\) has become zero.
- The electrodes have dissolved.
= A dead battery has no remaining driving force: \(\Delta G=-nFE=0\). The standard potential \(E^\circ\) is a fixed property of the reaction.

@ 9 | q | Electrolysis
How long must a current of \(2.00\text{ A}\) flow to deposit \(1.00\text{ g}\) of copper from a ce{Cu^2+} solution? (\(F=96{,}485\text{ C/mol}\))
* About \(1520\text{ s}\)
- About \(760\text{ s}\)
- About \(3040\text{ s}\)
- About \(48{,}200\text{ s}\)
= \(\tfrac{1.00}{63.55}=0.0157\text{ mol}\) Cu requires \(0.0315\text{ mol}\) of electrons, or \(3040\text{ C}\). At \(2.00\text{ C/s}\), this takes about \(1520\text{ s}\).

@ 9 | c | Electrolysis
In the electrolysis of molten NaCl, what forms at the cathode?
* Sodium metal
- Chlorine gas
- Hydrogen gas
- Oxygen gas
= Reduction occurs at the cathode: ce{Na^+ + e^- -> Na}. Chloride is oxidized to ce{Cl2} at the anode. In molten salt there is no water to be reduced.

@ 9 | c | Entropy
Which sample has the greatest standard molar entropy?
* ce{Br2(g)}
- ce{Br2(l)}
- ce{I2(s)}
- ce{Br2(s)}
= Gases have far more freedom of motion and positional possibilities than liquids and solids. Among phases of the same substance, \(S_{\text{gas}}>S_{\text{liquid}}>S_{\text{solid}}\).

@ 9 | c | Free energy and K
A reaction has a positive \(E^\circ_{\text{cell}}\). Which statement is correct?
* \(\Delta G^\circ<0\) and \(K>1\).
- \(\Delta G^\circ>0\) and \(K<1\).
- \(\Delta G^\circ<0\) and \(K<1\).
- \(\Delta G^\circ=0\) and \(K=1\).
= \(\Delta G^\circ=-nFE^\circ\) and \(\Delta G^\circ=-RT\ln K\). A positive \(E^\circ\) gives a negative \(\Delta G^\circ\), which corresponds to \(K>1\).

@ 9 | c | Electrolytic cells
Which statement correctly contrasts galvanic and electrolytic cells?
* A galvanic cell uses a thermodynamically favored reaction to produce electricity, while an electrolytic cell uses electrical energy to drive an unfavored reaction.
- Both use favored reactions to produce electricity.
- In an electrolytic cell, oxidation occurs at the cathode.
- A galvanic cell has a negative cell potential.
= In both kinds of cells, oxidation occurs at the anode. An electrolytic cell needs an external power source because \(\Delta G>0\) for its reaction.

@ 9 | c | Entropy of dissolution
When a gas dissolves in water, \(\Delta S\) for the process is typically negative. Which best explains this?
* Gas molecules lose much of their freedom of motion when they become surrounded by water molecules.
- The water molecules gain freedom of motion.
- Dissolving always increases entropy.
- The gas reacts to form a solid.
= Dispersing gas molecules into a much smaller volume within the liquid restricts their motion. That is why gases are less soluble at higher temperatures, where the \(-T\Delta S\) term matters more.

@ 9 | q | Free energy
For a reaction at \(400\text{ K}\), \(\Delta H^\circ=-50\text{ kJ}\) and \(\Delta S^\circ=-100\text{ J/K}\). What is \(\Delta G^\circ\), and is the reaction favored?
* \(-10\text{ kJ}\); favored
- \(-90\text{ kJ}\); favored
- \(+10\text{ kJ}\); not favored
- \(+39{,}950\text{ kJ}\); not favored
= \(\Delta G^\circ=-50-400(-0.100)=-50+40=-10\text{ kJ}\). Above \(500\text{ K}\), the entropy term would make \(\Delta G^\circ\) positive.

@ 7 | q | Equilibrium constants
At equilibrium for ce{PCl5(g) <=> PCl3(g) + Cl2(g)}, the partial pressures are \(0.50\text{ atm}\) for ce{PCl5} and \(0.20\text{ atm}\) each for ce{PCl3} and ce{Cl2}. What is \(K_p\)?
* \(0.080\)
- \(0.80\)
- \(12.5\)
- \(0.40\)
= \(K_p=\dfrac{P_{\mathrm{PCl_3}}P_{\mathrm{Cl_2}}}{P_{\mathrm{PCl_5}}}=\dfrac{(0.20)(0.20)}{0.50}=0.080\). Adding the product pressures instead of multiplying them gives \(0.80\).

@ 8 | q | Weak acids
A \(0.050\text{ M}\) solution of a weak acid HA has a pH of \(3.00\). What is \(K_a\) of HA?
* About \(2.0\times 10^{-5}\)
- About \(1.0\times 10^{-3}\)
- About \(2.0\times 10^{-2}\)
- About \(1.0\times 10^{-6}\)
= \([\mathrm{H_3O^+}]=[\mathrm{A^-}]=1.0\times 10^{-3}\text{ M}\), and \([\mathrm{HA}]=0.050-0.001=0.049\text{ M}\). Then \(K_a=\dfrac{(1.0\times 10^{-3})^2}{0.049}\approx 2.0\times 10^{-5}\).
`);

module.exports = { source, figures };
