// Second batch for the AP Biology bank (100 questions), bringing every unit to 25.
// Same block format as biology.cjs. Unless a figure says otherwise, the data are
// invented for these questions and modeled on standard classroom investigations.
const { graph, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', AMBER = '#f59e0b', BLUE = '#3b82f6';
const bell = (mu, sd, peak) => x => peak * Math.exp(-((x - mu) ** 2) / (2 * sd * sd));
const sig = (mid, k) => x => 1 / (1 + Math.exp(-k * (x - mid)));
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const box = (x, y, w, h, label, o = {}) => [['rect', x, y, w, h, { fill: true, ...o }], text(x + w / 2, y + h / 2 + 4, label, { size: 11 })];
const male = (x, y, affected) => ['rect', x - 11, y - 11, 22, 22, affected ? { fill: 'currentColor' } : {}];
const female = (x, y, affected) => ['circle', x, y, 11, affected ? { fill: 'currentColor' } : {}];
const range = (a, b, step) => Array.from({ length: Math.round((b - a) / step) + 1 }, (_, i) => a + i * step);
const Y = '✓', N = '—';

const figures = {
  elements: table(['Molecule', 'C', 'H', 'O', 'N', 'P', 'S', 'Dissolves in water'], [['W', Y, Y, Y, N, N, N, 'Yes'], ['X', Y, Y, Y, Y, N, Y, 'Yes'], ['Y', Y, Y, Y, Y, Y, N, 'Yes'], ['Z', Y, Y, Y, N, N, N, 'No']],
    'Table of four molecules. W contains carbon, hydrogen, and oxygen and dissolves in water. X contains carbon, hydrogen, oxygen, nitrogen, and sulfur and dissolves in water. Y contains carbon, hydrogen, oxygen, nitrogen, and phosphorus and dissolves in water. Z contains carbon, hydrogen, and oxygen and does not dissolve in water'),
  fattyAcids: table(['Fatty acid', 'Carbon atoms', 'C=C double bonds', 'Melting point (°C)'], [['Palmitic acid', '16', '0', '63'], ['Stearic acid', '18', '0', '69'], ['Oleic acid', '18', '1', '13'], ['Linoleic acid', '18', '2', '−5']],
    'Table of four fatty acids: palmitic acid, 16 carbons, no double bonds, melts at 63 degrees Celsius; stearic acid, 18 carbons, no double bonds, 69 degrees; oleic acid, 18 carbons, one double bond, 13 degrees; linoleic acid, 18 carbons, two double bonds, minus 5 degrees'),
  waterHeat: graph({ x: [0, 36], y: [-20, 120], xstep: 4, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Time of constant heating (min)', ytitle: 'Temperature (°C)', w: 370,
    curves: [{ pts: [[0, -20], [1, 0], [4, 0], [14, 100], [34, 100], [35, 112]] }], notes: [{ x: 1.4, y: -13, text: 'A' }, { x: 2.2, y: 6, text: 'B' }, { x: 8.2, y: 58, text: 'C' }, { x: 23, y: 106, text: 'D' }],
    alt: 'Heating curve for water heated at a constant rate. Segment A: ice warms from minus 20 to 0 degrees in 1 minute. Segment B: temperature stays at 0 degrees from minute 1 to minute 4. Segment C: liquid water warms from 0 to 100 degrees between minutes 4 and 14. Segment D: temperature stays at 100 degrees from minute 14 to minute 34' }),
  cellFeatures: table(['Cell', 'Nucleus', 'Cell wall', 'Chloroplasts', 'Mitochondria', 'Ribosomes'], [['W', 'Absent', 'Present', 'Absent', 'Absent', 'Present'], ['X', 'Present', 'Present', 'Present', 'Present', 'Present'], ['Y', 'Present', 'Absent', 'Absent', 'Present', 'Present'], ['Z', 'Present', 'Present', 'Absent', 'Present', 'Present']],
    'Table of structures observed in four cells. W: no nucleus, cell wall, no chloroplasts, no mitochondria, ribosomes. X: all five structures. Y: nucleus, no cell wall, no chloroplasts, mitochondria, ribosomes. Z: nucleus, cell wall, no chloroplasts, mitochondria, ribosomes'),
  transport: graph({ x: [0, 10], y: [0, 100], xstep: 2, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Solute concentration outside the cell (mM)', ytitle: 'Rate of uptake (relative units)', w: 370,
    curves: [{ fn: c => 9 * c, from: 0, to: 10 }, { fn: c => 80 * c / (1.5 + c), from: 0, to: 10, color: PINK }], notes: [{ x: 8.4, y: 86, text: 'solute A' }, { x: 7.8, y: 62, text: 'solute B' }],
    alt: 'Graph of rate of uptake versus external solute concentration. Uptake of solute A increases in a straight line, reaching 90 at 10 millimolar. Uptake of solute B rises steeply at low concentration and levels off near 70' }),
  fractions: table(['Fraction from liver cells', 'DNA', 'Enzymes of the citric acid cycle', 'Ribosomal RNA'], [['Pellet 1 (spun at 600 × g)', 'High', 'Low', 'Low'], ['Pellet 2 (spun at 15,000 × g)', 'Trace', 'High', 'Low'], ['Pellet 3 (spun at 100,000 × g)', 'None', 'None', 'High'], ['Final supernatant', 'None', 'None', 'Low']],
    'Table of fractions from differential centrifugation of liver cells. Pellet 1, spun at 600 times g: high DNA, low citric acid cycle enzymes, low ribosomal RNA. Pellet 2, 15,000 times g: trace DNA, high citric acid cycle enzymes, low ribosomal RNA. Pellet 3, 100,000 times g: no DNA, no citric acid cycle enzymes, high ribosomal RNA. Final supernatant: none, none, low'),
  energyProfile: graph({ x: [0, 10], y: [0, 16], xstep: 2, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Progress of the reaction', ytitle: 'Free energy (relative units)', w: 370,
    curves: [{ fn: x => 6 - 4 * sig(5, 2)(x) + 10 * Math.exp(-((x - 5) ** 2) / 1.2), from: 0, to: 10 }, { fn: x => 6 - 4 * sig(5, 2)(x) + 5 * Math.exp(-((x - 5) ** 2) / 1.2), from: 0, to: 10, color: PINK }],
    notes: [{ x: 0.2, y: 7, text: 'reactants' }, { x: 7.6, y: 3, text: 'products' }, { x: 5.6, y: 14, text: 'without enzyme' }, { x: 5.9, y: 8.6, text: 'with enzyme' }],
    alt: 'Free energy diagram. Reactants start at 6 units and products end at 2 units. Without an enzyme the curve peaks at 14 units; with an enzyme it peaks at 9 units' }),
  dpip: graph({ x: [0, 30], y: [0, 1], xstep: 5, ystep: 0.2, xlabel: '', ylabel: '', xtitle: 'Time (min)', ytitle: 'Absorbance of DPIP at 600 nm', w: 370,
    curves: [{ fn: t => 0.85 * Math.exp(-t / 9) + 0.05, from: 0, to: 30 }, { fn: t => 0.9 - 0.002 * t, from: 0, to: 30, color: PINK }, { fn: t => 0.86 - 0.001 * t, from: 0, to: 30, color: AMBER }],
    notes: [{ x: 6.5, y: 0.35, text: 'chloroplasts, light' }, { x: 18, y: 0.95, text: 'chloroplasts, dark' }, { x: 15, y: 0.78, text: 'boiled chloroplasts, light' }],
    alt: 'Graph of absorbance of the blue dye DPIP over 30 minutes. With chloroplasts in the light, absorbance falls from 0.9 to about 0.1. With chloroplasts in the dark, absorbance stays near 0.9. With boiled chloroplasts in the light, absorbance stays near 0.85' }),
  etc: draw(380, 220, 'The inner mitochondrial membrane, with the intermembrane space above and the matrix below. Complexes I, III, and IV of the electron transport chain each pump protons from the matrix into the intermembrane space as electrons pass from NADH toward oxygen, which is reduced to water at complex IV. Protons flow back into the matrix through ATP synthase, which makes ATP from ADP and phosphate', [
    ['line', 10, 90, 370, 90], ['line', 10, 130, 370, 130], text(12, 26, 'Intermembrane space', { anchor: 'start', size: 11 }), text(12, 208, 'Matrix', { anchor: 'start', size: 11 }),
    ...box(40, 80, 44, 60, 'I'), ...box(140, 80, 44, 60, 'III'), ...box(220, 80, 44, 60, 'IV'), ...box(288, 80, 82, 60, 'ATP synthase'),
    ['line', 84, 110, 140, 110, { dash: true }], ['line', 184, 110, 220, 110, { dash: true }], text(112, 104, 'e⁻', { size: 11 }),
    ...[47, 147, 227].flatMap(x => [['arrow', x, 168, x, 44, { color: PINK }], text(x + 14, 46, 'H⁺', { size: 11 })]), ['arrow', 294, 44, 294, 168, { color: PINK }], text(308, 46, 'H⁺', { size: 11 }),
    text(62, 186, 'NADH', { size: 11 }), text(242, 186, 'O₂ → H₂O', { size: 11 }), text(329, 200, 'ADP + Pᵢ → ATP', { size: 11 }),
  ]),
  yeast: graph({ x: [0, 60], y: [0, 10], xstep: 10, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Time (min)', ytitle: 'CO₂ released by yeast (mL)', w: 370,
    curves: [{ fn: t => 0.16 * t, from: 0, to: 60 }, { fn: t => Math.max(0, 0.16 * (t - 12)), from: 0, to: 60, color: PINK }, { fn: () => 0.15, from: 0, to: 60, color: AMBER }],
    notes: [{ x: 33, y: 7.2, text: 'glucose' }, { x: 44, y: 4.3, text: 'sucrose' }, { x: 44, y: 0.6, text: 'lactose' }],
    alt: 'Graph of carbon dioxide released by yeast suspended in sugar solutions. With glucose, CO2 rises steadily from the start to about 9.6 milliliters at 60 minutes. With sucrose, nothing is released for 12 minutes and then CO2 rises at the same rate, reaching about 7.7 milliliters. With lactose, almost no CO2 is released' }),
  cAMP: graph({ x: [0, 10], y: [0, 100], xstep: 2, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Time (min); hormone added at 1 min', ytitle: 'cAMP in the cell (relative units)', w: 370,
    curves: [{ fn: t => (t < 1 ? 5 : 5 + 85 * ((t - 1) / 1.5) * Math.exp(1 - (t - 1) / 1.5)), from: 0, to: 10 }, { fn: t => (t < 1 ? 5 : 5 + 85 * (1 - Math.exp(-(t - 1) / 1.2))), from: 0, to: 10, color: PINK }],
    notes: [{ x: 6.2, y: 22, text: 'control' }, { x: 5, y: 96, text: 'with drug Q' }],
    alt: 'Graph of cAMP concentration after a hormone is added at 1 minute. In control cells, cAMP rises to a peak of 90 about 1.5 minutes later and then falls back toward 10 by 10 minutes. In cells treated with drug Q, cAMP rises to about 90 and stays there' }),
  thyroid: draw(380, 230, 'A hormone pathway. The hypothalamus releases TRH, which stimulates the anterior pituitary to release TSH, which stimulates the thyroid gland to release thyroxine. Thyroxine raises the metabolic rate of body cells, and dashed arrows marked with a minus sign show that thyroxine inhibits both the hypothalamus and the anterior pituitary', [
    ...box(40, 12, 140, 32, 'Hypothalamus'), ['arrow', 110, 44, 110, 84], text(132, 68, 'TRH', { anchor: 'start', size: 11 }),
    ...box(40, 86, 140, 32, 'Anterior pituitary'), ['arrow', 110, 118, 110, 158], text(132, 142, 'TSH', { anchor: 'start', size: 11 }),
    ...box(40, 160, 140, 32, 'Thyroid gland'), ['arrow', 180, 176, 250, 176], text(214, 168, 'thyroxine', { size: 11 }), ...box(252, 160, 116, 32, 'Body cells'),
    ['path', 'M215 176 V102 H182', { dash: true, color: PINK }], ['path', 'M215 102 V28 H182', { dash: true, color: PINK }], ['arrow', 190, 102, 182, 102, { color: PINK }], ['arrow', 190, 28, 182, 28, { color: PINK }],
    text(230, 66, '−', { size: 18 }), text(230, 140, '−', { size: 18 }), text(310, 214, '↑ metabolic rate', { size: 11 }),
  ]),
  checkpoint: table(['Treatment of cultured cells', 'G₁', 'S', 'G₂ and M'], [['Control', '60%', '25%', '15%'], ['Drug X', '85%', '8%', '7%'], ['Drug Y', '20%', '15%', '65%']],
    'Table of the percentage of cultured cells in each phase of the cell cycle after 24 hours. Control: 60 percent G1, 25 percent S, 15 percent G2 and M. Drug X: 85, 8, and 7 percent. Drug Y: 20, 15, and 65 percent'),
  pedigreeX: draw(340, 230, 'Pedigree. Generation I: affected male 1 and unaffected female 2. Generation II: their daughter, unaffected female 1, married to unaffected male 2, and their son, unaffected male 3. Generation III, children of II-1 and II-2: affected male 1, unaffected female 2, and unaffected male 3', [
    text(6, 40, 'I', { anchor: 'start' }), text(6, 120, 'II', { anchor: 'start' }), text(6, 200, 'III', { anchor: 'start' }),
    male(200, 36, true), female(280, 36), ['line', 211, 36, 269, 36], ['line', 240, 36, 240, 76], ['line', 120, 76, 300, 76], ['line', 120, 76, 120, 105], ['line', 300, 76, 300, 105],
    female(120, 116), male(300, 116), male(50, 116), ['line', 61, 116, 109, 116], ['line', 85, 116, 85, 156], ['line', 40, 156, 160, 156],
    ['line', 40, 156, 40, 185], ['line', 100, 156, 100, 185], ['line', 160, 156, 160, 185], male(40, 196, true), female(100, 196), male(160, 196),
    ...[[200, 1], [280, 2]].map(([x, n]) => text(x, 62, String(n), { size: 10 })), ...[[120, 1], [50, 2], [300, 3]].map(([x, n]) => text(x, 142, String(n), { size: 10 })), ...[[40, 1], [100, 2], [160, 3]].map(([x, n]) => text(x, 222, String(n), { size: 10 })),
  ]),
  meiosisDNA: graph({ x: [0, 20], y: [0, 5], xstep: 2, xlabel: '', ylabel: '', xtitle: 'Time', ytitle: 'DNA per cell (relative units)', w: 370,
    curves: [{ pts: [[0, 2], [3, 2], [6, 4], [10, 4], [11, 2], [15, 2], [16, 1], [20, 1]] }], notes: [{ x: 1, y: 2.3, text: 'W' }, { x: 4.2, y: 3.4, text: 'X' }, { x: 11, y: 3.3, text: 'Y' }, { x: 16, y: 1.7, text: 'Z' }],
    alt: 'Graph of DNA per cell during meiosis. W: constant at 2 units. X: rises from 2 to 4 units. The level stays at 4, then at Y drops from 4 to 2 units, stays at 2, and at Z drops from 2 to 1 unit' }),
  monohybrid: table(['Phenotype of offspring', 'Observed', 'Expected for 3 : 1'], [['Purple flowers', '70', '75'], ['White flowers', '30', '25']], 'Table of 100 offspring: 70 purple-flowered observed, 75 expected; 30 white-flowered observed, 25 expected'),
  recombination: table(['Gene pair', 'Recombination frequency'], [['A and B', '12%'], ['B and C', '5%'], ['A and C', '16%']], 'Table of recombination frequencies: genes A and B, 12 percent; genes B and C, 5 percent; genes A and C, 16 percent'),
  geneMap: draw(390, 150, 'A eukaryotic gene: a promoter followed by exon 1 of 120 base pairs, intron 1 of 400 base pairs, exon 2 of 90 base pairs, intron 2 of 600 base pairs, and exon 3 of 150 base pairs', [
    ['line', 10, 80, 380, 80, { width: 2 }], ...box(14, 66, 46, 28, 'promoter'),
    ['rect', 66, 64, 40, 32, { fill: BLUE, color: BLUE }], ['rect', 190, 64, 32, 32, { fill: BLUE, color: BLUE }], ['rect', 324, 64, 52, 32, { fill: BLUE, color: BLUE }],
    text(86, 56, 'exon 1', { size: 11 }), text(86, 116, '120 bp', { size: 10 }), text(148, 56, 'intron 1', { size: 11 }), text(148, 116, '400 bp', { size: 10 }),
    text(206, 56, 'exon 2', { size: 11 }), text(206, 116, '90 bp', { size: 10 }), text(273, 56, 'intron 2', { size: 11 }), text(273, 116, '600 bp', { size: 10 }), text(350, 56, 'exon 3', { size: 11 }), text(350, 116, '150 bp', { size: 10 }),
  ]),
  trp: draw(390, 160, 'The trp operon of E. coli: a promoter, an operator, and five genes for enzymes that synthesize tryptophan, trpE through trpA. A repressor protein with tryptophan molecules bound to it is attached to the operator', [
    ['line', 10, 110, 380, 110, { width: 3 }], ...box(20, 96, 60, 28, 'promoter'), ...box(80, 96, 58, 28, 'operator'),
    ...['trpE', 'trpD', 'trpC', 'trpB', 'trpA'].flatMap((g, i) => box(146 + i * 46, 96, 46, 28, g)),
    ['path', 'M88 96 Q109 50 130 96 Z', { fill: PINK, color: PINK }], text(109, 40, 'repressor', { size: 11 }), ['circle', 98, 80, 4, { fill: 'currentColor' }], ['circle', 119, 80, 4, { fill: 'currentColor' }], text(178, 72, '● = tryptophan', { size: 11, anchor: 'start' }),
  ]),
  restriction: draw(380, 130, 'A linear DNA molecule 10 kilobases long. EcoRI cuts at 3 kb and 7 kb from the left end. HindIII cuts at 5 kb', [
    ['line', 40, 70, 340, 70, { width: 4 }], ...range(0, 10, 1).map(k => ['line', 40 + k * 30, 76, 40 + k * 30, 82]), text(40, 98, '0', { size: 11 }), text(340, 98, '10 kb', { size: 11 }), text(190, 98, '5', { size: 11 }),
    ['arrow', 130, 30, 130, 62, { color: PINK }], ['arrow', 250, 30, 250, 62, { color: PINK }], text(130, 24, 'EcoRI (3 kb)', { size: 11 }), text(250, 24, 'EcoRI (7 kb)', { size: 11 }),
    ['arrow', 190, 122, 190, 80, { color: AMBER }], text(232, 120, 'HindIII (5 kb)', { size: 11 }),
  ]),
  lacData: table(['Glucose in medium', 'Lactose in medium', 'β-galactosidase activity (units)'], [['Present', 'Absent', '2'], ['Present', 'Present', '120'], ['Absent', 'Absent', '3'], ['Absent', 'Present', '1,500']],
    'Table of beta-galactosidase activity in E. coli grown in four media. Glucose present, lactose absent: 2 units. Glucose present, lactose present: 120. Glucose absent, lactose absent: 3. Glucose absent, lactose present: 1,500'),
  moths: graph({ x: [1850, 2000], y: [0, 1], xstep: 25, ystep: 0.2, xlabel: '', ylabel: '', xtitle: 'Year', ytitle: 'Frequency of the dark-wing allele', w: 370,
    curves: [{ fn: t => (0.02 + 0.93 * sig(1875, 0.15)(t)) * (1 - 0.88 * sig(1980, 0.12)(t)), from: 1850, to: 2000 }, { pts: [[1956, 0], [1956, 1]], dash: true, color: PINK }],
    notes: [{ x: 1886, y: 0.12, text: 'dashed line: 1956 law' }],
    alt: 'Graph of the frequency of the allele for dark wings in a moth population near an industrial city. It rises from about 0.02 in 1850 to about 0.95 by 1900, stays high until the 1950s, and declines after an air-pollution law was passed in 1956, falling to about 0.2 by 2000' }),
  traits: table(['Organism', 'Vertebral column', 'Jaws', 'Lungs', 'Amniotic egg', 'Hair'], [['Lancelet', N, N, N, N, N], ['Lamprey', Y, N, N, N, N], ['Shark', Y, Y, N, N, N], ['Frog', Y, Y, Y, N, N], ['Lizard', Y, Y, Y, Y, N], ['Mouse', Y, Y, Y, Y, Y]],
    'Table of five traits in six organisms. Lancelet: none. Lamprey: vertebral column only. Shark: vertebral column and jaws. Frog: vertebral column, jaws, and lungs. Lizard: those plus an amniotic egg. Mouse: all five, including hair'),
  clock: graph({ x: [0, 100], y: [0, 50], xstep: 20, ystep: 10, xlabel: '', ylabel: '', xtitle: 'Time since lineages diverged (millions of years)', ytitle: 'Amino acid differences in protein P', w: 370,
    curves: [{ fn: t => 0.4 * t, from: 0, to: 100 }], dots: [[10, 4.5], [25, 9.5], [40, 16.5], [65, 26], [90, 35.5]].map(([x, y]) => ({ x, y })),
    alt: 'Graph of the number of amino acid differences in protein P between pairs of species versus the time since their lineages diverged, as dated by fossils. Five data points fall along a straight line through the origin with a slope of 0.4 differences per million years' }),
  competition: graph({ x: [0, 20], y: [0, 250], xstep: 4, ystep: 50, xlabel: '', ylabel: '', xtitle: 'Time (days)', ytitle: 'Population density (cells per mL)', w: 370,
    curves: [{ fn: t => 195 / (1 + 40 * Math.exp(-0.75 * t)), from: 0, to: 20 }, { fn: t => 150 / (1 + 40 * Math.exp(-0.75 * t)), from: 0, to: 20, color: PINK, dash: true }, { fn: t => (70 / (1 + 40 * Math.exp(-0.75 * t))) * Math.exp(-Math.max(0, t - 7) / 3.5), from: 0, to: 20, color: PINK }],
    notes: [{ x: 11, y: 212, text: 'species A, grown with B' }, { x: 11, y: 158, text: 'species B, grown alone' }, { x: 9.5, y: 60, text: 'species B, grown with A' }],
    alt: 'Graph of two protist species. Species A grown together with species B increases to about 195 cells per milliliter. Species B grown alone (dashed) increases to about 150. Species B grown together with A increases briefly to about 60 by day 7 and then declines to nearly zero by day 20' }),
  nitrogen: draw(390, 240, 'The nitrogen cycle. Arrow 1 goes from N2 in the atmosphere to ammonium in the soil. Arrow 2 goes from ammonium to nitrate. Arrow 3 goes from nitrate back to N2 in the atmosphere. Plants take up ammonium and nitrate. Arrow 4 goes from dead organisms and wastes back to ammonium', [
    ...box(130, 10, 130, 32, 'N₂ in atmosphere'), ...box(20, 150, 110, 32, 'NH₄⁺ in soil'), ...box(260, 150, 110, 32, 'NO₃⁻ in soil'), ...box(150, 92, 90, 32, 'Plants'), ...box(130, 200, 130, 32, 'Dead organisms, wastes'),
    ['arrow', 150, 42, 80, 148], text(96, 90, '1', { bold: true }), ['arrow', 130, 166, 258, 166], text(194, 158, '2', { bold: true }), ['arrow', 310, 148, 240, 44], text(292, 90, '3', { bold: true }),
    ['arrow', 100, 148, 162, 124, { dash: true }], ['arrow', 290, 148, 230, 124, { dash: true }], ['arrow', 140, 214, 80, 184], text(98, 214, '4', { bold: true }), ['arrow', 195, 124, 195, 198, { dash: true }],
  ]),
  bloom: graph({ x: [0, 30], y: [0, 12], xstep: 5, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Days after fertilizer entered the lake', ytitle: 'Relative amount', w: 370,
    curves: [{ fn: d => 9 + 1.2 * Math.exp(-((d - 8) ** 2) / 18) - 7 * Math.exp(-((d - 17) ** 2) / 18), from: 0, to: 30 }, { fn: d => bell(10, 3.5, 10)(d) + 0.5, from: 0, to: 30, color: PINK }],
    notes: [{ x: 14, y: 11.4, text: 'dissolved O₂ (mg/L)' }, { x: 3.2, y: 6.6, text: 'algae' }],
    alt: 'Graph of a lake after fertilizer runoff. Algal biomass rises to a peak of about 10 around day 10 and then falls. Dissolved oxygen stays near 9 to 10 milligrams per liter until about day 12, drops to a minimum of about 2 near day 17, and recovers to 9 by day 30' }),
  keeling: graph({ x: [2010, 2020], y: [380, 420], xstep: 2, ystep: 10, xlabel: '', ylabel: '', xtitle: 'Year', ytitle: 'Atmospheric CO₂ at a Hawaii observatory (ppm)', w: 370,
    curves: [{ pts: range(2010, 2020, 0.05).map(t => [t, 389 + 2.3 * (t - 2010) + 3.5 * Math.cos(2 * Math.PI * (t - 2010 - 0.37))]) }],
    alt: 'Graph of atmospheric carbon dioxide from 2010 to 2020. The concentration rises from about 389 to about 412 parts per million, with a regular yearly oscillation of about 7 parts per million: each year it peaks in May and reaches a minimum around September and October' }),
  bottles: table(['Sample of pond water', 'Dissolved O₂ (mg/L)'], [['Initial, before incubation', '8.0'], ['Light bottle after 24 h', '11.0'], ['Dark bottle after 24 h', '5.0']], 'Table of dissolved oxygen in pond water: 8.0 milligrams per liter initially, 11.0 in a light bottle after 24 hours, and 5.0 in a dark bottle after 24 hours'),
};

const source = String.raw`
@ 1 | - | Biological macromolecules | elements
The table shows the elements present in four biological molecules and whether each dissolves in water. Which identification is most consistent with the data?
* W is a carbohydrate, X is a protein, Y is a nucleic acid, and Z is a triglyceride.
- W is a triglyceride, X is a nucleic acid, Y is a protein, and Z is a carbohydrate.
- W is a protein, X is a carbohydrate, Y is a triglyceride, and Z is a nucleic acid.
- W is a carbohydrate, X is a nucleic acid, Y is a protein, and Z is a phospholipid.
= Sulfur occurs in the amino acids cysteine and methionine, so X is a protein. Phosphorus and nitrogen together point to nucleotides, so Y is a nucleic acid. W and Z both contain only C, H, and O, but Z does not dissolve in water, as expected of a nonpolar fat; a phospholipid would contain phosphorus.

@ 1 | - | Biological macromolecules | elements
Cells are grown with the only source of sulfur labeled with the radioactive isotope ³⁵S. Based on the table, which molecules are expected to become radioactive?
* Molecule X only
- Molecules X and Y
- Molecule Y only
- All four molecules
= Of the four molecules, only X contains sulfur. This logic was used in the Hershey–Chase experiment: ³⁵S labels protein but not DNA, while ³²P labels DNA but not most protein.

@ 1 | - | Lipid structure | fattyAcids
The table shows the melting points of four fatty acids. Which statement best explains the effect of double bonds on melting point?
* Each cis double bond puts a kink in the hydrocarbon chain, so the molecules pack less tightly and fewer intermolecular attractions must be overcome to melt them.
- Double bonds are weaker than single bonds, so they break when the fatty acid melts.
- Double bonds add hydrogen atoms, which make the molecules more polar.
- Double bonds make the chains longer, which lowers the melting point.
= Melting separates whole molecules; it does not break covalent bonds. Kinked unsaturated chains cannot line up closely, so the van der Waals attractions between them are weaker, and the melting point falls with each additional double bond.

@ 1 | - | Lipid structure | fattyAcids
Which two fatty acids in the table should be compared to isolate the effect of chain length on melting point?
* Palmitic acid and stearic acid
- Stearic acid and oleic acid
- Oleic acid and linoleic acid
- Palmitic acid and linoleic acid
= A fair comparison changes one variable while holding the other constant. Palmitic and stearic acids both have no double bonds and differ only in chain length; the longer chain melts at a higher temperature because it has more surface for intermolecular attraction.

@ 1 | - | Properties of water | waterHeat
Water was heated at a constant rate, as shown. Which statement best explains why segment D lasts much longer than segment B?
* Converting liquid water to vapor requires breaking the hydrogen bonds that remain in the liquid, which takes far more energy than melting ice.
- The thermometer stops working above 100°C, so the temperature appears constant.
- Liquid water absorbs heat more slowly than ice because it is less dense.
- Vapor molecules form new hydrogen bonds as they leave the liquid, which absorbs energy.
= During a phase change, added energy breaks intermolecular attractions instead of raising the temperature. Melting breaks only some of the hydrogen bonds in ice, but vaporization separates molecules completely. Water's high heat of vaporization is why evaporation of sweat cools the body.

@ 1 | - | Properties of water | waterHeat
In the heating curve shown, which comparison provides evidence that liquid water has a higher specific heat than ice?
* Segment C rises more slowly than segment A, so liquid water needs more energy per degree of temperature change.
- Segment B is shorter than segment D, so ice has a higher specific heat than water.
- Segment D is horizontal, so liquid water cannot change temperature.
- Segment A starts below 0°C, so ice absorbs more heat.
= With heat added at a constant rate, the slope of a segment is inversely related to specific heat. Ice warms 20 degrees per minute and liquid water only 10, so water needs about twice as much energy per degree. The horizontal segments show heats of fusion and vaporization, not specific heats.

@ 1 | - | Protein structure
An enzyme's active site depends on an ionic bond between the positively charged side chain of lysine and the negatively charged side chain of aspartate. The enzyme is moved to a solution at pH 12. Which outcome is most likely?
* Lysine's side chain loses a proton and its positive charge, the ionic bond breaks, and the active site changes shape.
- Aspartate's side chain gains a proton, strengthening the ionic bond.
- The peptide bond between the two amino acids is hydrolyzed.
- The enzyme gains activity, because a high pH adds charges to both side chains.
= At high pH, basic groups such as lysine's amino group give up protons and become neutral. A neutral side chain cannot form an ionic bond, so the tertiary structure that holds the active site in shape is disrupted.

@ 1 | - | Hydrolysis
A protein is made of two polypeptide chains, one of 60 amino acids and one of 90 amino acids, joined by a disulfide bond. How many water molecules are consumed when all of its peptide bonds are hydrolyzed?
* 148
- 149
- 150
- 147
= A chain of \(n\) amino acids has \(n-1\) peptide bonds, so the chains contain 59 and 89 peptide bonds. Each hydrolysis consumes one water molecule. The disulfide bond is not a peptide bond and is not counted.

@ 1 | - | Nucleic acid structure
Which bond links adjacent nucleotides within one strand of DNA?
* A phosphodiester bond between the phosphate on the 5′ carbon of one nucleotide and the 3′ carbon of the sugar of the previous nucleotide
- A hydrogen bond between complementary bases
- A peptide bond between the bases of adjacent nucleotides
- A glycosidic bond between the phosphate groups of adjacent nucleotides
= The sugar-phosphate backbone is held together by covalent phosphodiester bonds, which give each strand its 5′-to-3′ direction. Hydrogen bonds between bases hold the two strands together, not the nucleotides of one strand.

@ 1 | - | Antiparallel strands
One strand of a DNA segment has the sequence 5′-ATGCCA-3′. What is the sequence of the complementary strand, written 5′ to 3′?
* 5′-TGGCAT-3′
- 5′-TACGGT-3′
- 5′-ATGCCA-3′
- 5′-UGGCAU-3′
= The complement pairs base by base as 3′-TACGGT-5′, because the strands are antiparallel. Reading that strand from its 5′ end gives 5′-TGGCAT-3′. DNA contains thymine, not uracil.

@ 1 | - | Properties of water
Which property of water most directly explains why the evaporation of sweat cools the body?
* Water has a high heat of vaporization, so each gram that evaporates removes a large amount of heat.
- Water has a high specific heat, so it does not change temperature.
- Water is cohesive, so sweat forms droplets on the skin.
- Ice is less dense than liquid water, so sweat floats away from the skin.
= The molecules that escape as vapor are the most energetic ones, and breaking their hydrogen bonds absorbs a large amount of heat from the remaining water and the skin beneath it. Specific heat describes temperature change without a phase change.

@ 1 | - | Isomers and functional groups
Glucose and fructose both have the formula C₆H₁₂O₆, yet they differ in their chemical properties and in how cells metabolize them. Which statement best explains this?
* They are isomers whose atoms are arranged differently, so glucose has an aldehyde group where fructose has a ketone group.
- Fructose contains more carbon atoms in its ring than glucose.
- Glucose is a polymer, while fructose is a monomer.
- They contain different elements, so they react differently.
= Molecules with the same formula but different structures are isomers. A molecule's functional groups and shape determine its reactivity and which enzymes recognize it, so the same atoms can form molecules that behave differently.

@ 2 | - | Prokaryotic and eukaryotic cells | cellFeatures
The table shows the structures observed in four cells. Which cell is prokaryotic?
* Cell W
- Cell X
- Cell Y
- Cell Z
= Cell W lacks a nucleus and membrane-bound organelles such as mitochondria but has ribosomes and a cell wall, which is characteristic of bacteria and archaea. All cells have ribosomes, so their presence does not distinguish the domains.

@ 2 | - | Cell types | cellFeatures
Based on the table, which could cell Z be?
* A cell from a plant root or from a fungus
- A cell from a plant leaf
- A cell from an animal
- A bacterial cell
= Cell Z has a nucleus and mitochondria, so it is eukaryotic, and it has a cell wall, which rules out an animal cell. It lacks chloroplasts, which fits a nonphotosynthetic plant cell such as one in a root, or a fungal cell, whose wall is made of chitin.

@ 2 | - | Membrane transport | transport
The rates at which a cell takes up two solutes are shown. Which conclusion is best supported by the data?
* Solute B crosses the membrane through a limited number of transport proteins, which become saturated at high concentration.
- Solute A crosses the membrane by active transport, because its rate keeps increasing.
- Solute B crosses by simple diffusion, because its rate is high at low concentration.
- Both solutes cross the membrane by the same mechanism.
= When every carrier or channel is in use, adding more solute cannot increase the rate, so the curve levels off. The straight line for solute A shows no saturation, as expected for simple diffusion through the bilayer, in which the rate is proportional to the concentration gradient.

@ 2 | - | Membrane transport | transport
The cell in the graph is engineered to produce twice as many of the membrane proteins that transport solute B. How is the curve for solute B expected to change?
* It levels off at about twice the maximum rate.
- It becomes a straight line like the curve for solute A.
- It levels off at the same maximum rate but reaches it at a lower concentration.
- It is unchanged, because the concentration gradient is the same.
= The maximum rate of carrier-mediated transport is set by the number of transporters multiplied by how fast each one works. Doubling the transporters doubles the maximum rate. Transport still saturates; it does not become simple diffusion.

@ 2 | - | Cell fractionation | fractions
Liver cells were broken open and their contents separated by centrifugation at increasing speeds, as shown. Which fraction contains most of the mitochondria?
* Pellet 2
- Pellet 1
- Pellet 3
- The final supernatant
= Enzymes of the citric acid cycle are located in the mitochondrial matrix, and they are concentrated in pellet 2. The trace of DNA there is consistent with the small circular chromosome that mitochondria carry. Pellet 1 holds the large, dense nuclei.

@ 2 | - | Cell fractionation | fractions
Based on the table, which statement about pellet 3 is best supported?
* It contains ribosomes, which are small and sediment only at very high speed.
- It contains nuclei, which are the densest organelles.
- It contains chloroplasts, which make ribosomal RNA.
- It contains mitochondria, because mitochondria also have ribosomes.
= Ribosomes are made of ribosomal RNA and protein, and their small size means they settle only at the highest speed. The absence of DNA and citric acid cycle enzymes shows that nuclei and mitochondria were removed in earlier pellets.

@ 2 | - | Compartmentalization
Lysosomal enzymes work best at pH 5, and the cytosol is at about pH 7.2. When a single lysosome ruptures inside a cell, the cell is usually not seriously damaged. Which statement best explains this?
* The released enzymes have little activity at the pH of the cytosol.
- The released enzymes are immediately pumped back into another lysosome.
- Lysosomal enzymes digest only material outside the cell.
- The cytosol lacks any molecules that the enzymes could digest.
= Keeping the hydrolytic enzymes inside an acidic compartment both concentrates their activity and protects the rest of the cell. Because the enzymes' optimum is acidic, they are nearly inactive if they leak into the neutral cytosol.

@ 2 | - | Water potential
A plant cell has a solute potential of −0.8 MPa and a pressure potential of +0.3 MPa. It is placed in a solution with a water potential of −0.6 MPa. Which prediction is correct?
* Water moves out of the cell, because the cell's water potential of −0.5 MPa is higher than that of the solution.
- Water moves into the cell, because the cell's solute potential is lower than the solution's water potential.
- There is no net movement of water, because the pressure potential balances the difference.
- Water moves into the cell, because water always moves toward the higher pressure.
= The cell's water potential is \(-0.8+0.3=-0.5\) MPa. Water moves from higher to lower water potential, so it leaves the cell until the potentials are equal. Comparing only the solute potential ignores the pressure exerted by the cell wall.

@ 2 | - | Plasmolysis
A red onion epidermal cell is placed in a concentrated salt solution. Viewed under a microscope a few minutes later, the colored region of the cell has shrunk away from the cell wall. Which statement best explains the observation?
* Water left the central vacuole by osmosis, so the cytoplasm and plasma membrane pulled away from the wall.
- Salt entered the vacuole and destroyed its pigment.
- The cell wall shrank, squeezing water out of the cell.
- The cell actively pumped water out to balance the salt concentration.
= In a hypertonic solution, water moves out of the cell down its water potential gradient, and the protoplast shrinks. The rigid wall keeps its shape, so the membrane separates from it, which is called plasmolysis.

@ 2 | - | Endocytosis
Cells take up cholesterol by binding low-density lipoprotein (LDL) particles to LDL receptors and bringing them in by receptor-mediated endocytosis. In familial hypercholesterolemia, the LDL receptors are defective. Which outcome is expected?
* Cholesterol accumulates in the blood, because cells cannot remove LDL particles from it.
- Cholesterol accumulates inside cells, because it cannot be exported.
- Cells make no cholesterol, because they lack receptors.
- LDL particles enter cells by simple diffusion instead.
= LDL particles are too large to cross the membrane except by endocytosis. Without functional receptors, LDL stays in the blood, raising blood cholesterol and the risk of atherosclerosis.

@ 2 | - | Active transport
The Na⁺/K⁺ pump moves three Na⁺ ions out of a cell and two K⁺ ions into it for each ATP hydrolyzed. How does this ratio affect the cell?
* It moves a net positive charge out of the cell, contributing to the negative charge inside the cell.
- It moves a net positive charge into the cell, making the inside positive.
- It moves no net charge, because both ions are positive.
- It equalizes the concentrations of Na⁺ and K⁺ on the two sides of the membrane.
= Each cycle exports one more positive charge than it imports, so the pump is electrogenic. It also builds concentration gradients of both ions, opposite in direction, which store energy used in cotransport and in nerve impulses.

@ 2 | - | Protein targeting
Lysosomal enzymes are proteins that end up inside lysosomes. Where are they synthesized?
* By ribosomes bound to the rough ER, after which they are modified and sorted in the Golgi apparatus
- By free ribosomes in the cytosol, after which they diffuse into lysosomes
- By ribosomes inside the lysosome
- In the nucleus, from which they are carried to the lysosome by vesicles
= Proteins destined for the endomembrane system, the plasma membrane, or secretion begin their synthesis on ribosomes that attach to the rough ER. In the Golgi, lysosomal enzymes receive a chemical tag that directs them into vesicles bound for lysosomes.

@ 3 | - | Enzymes and activation energy | energyProfile
The energy diagram shows a reaction with and without an enzyme. Which statement is supported by the diagram?
* The enzyme lowers the activation energy, and the overall change in free energy is the same with or without it.
- The enzyme makes the reaction more exergonic.
- The enzyme supplies the energy needed to reach the peak.
- The reaction is endergonic, because the curve rises before it falls.
= An enzyme provides a different pathway with a lower energy barrier, from 8 units above the reactants to 3. The reactants and products are unchanged, so \(\Delta G\) is the same, here negative, which makes the reaction exergonic.

@ 3 | - | Energy coupling
A cell must carry out a reaction with \(\Delta G=+20\) kJ/mol. Hydrolysis of ATP has \(\Delta G\) of about −30 kJ/mol under cellular conditions. Which statement is correct when the two reactions are coupled through a shared phosphorylated intermediate?
* The overall \(\Delta G\) is about −10 kJ/mol, so the coupled process is spontaneous.
- The overall \(\Delta G\) is about +50 kJ/mol, so the process cannot occur.
- The overall \(\Delta G\) is about +10 kJ/mol, so an enzyme is still needed to make it spontaneous.
- Coupling lowers the activation energy, which changes \(\Delta G\) to zero.
= Free energy changes of coupled reactions add: \(+20+(-30)=-10\) kJ/mol. Cells couple endergonic reactions to ATP hydrolysis, often by transferring a phosphate group to a reactant. An enzyme alone cannot make an endergonic reaction spontaneous.

@ 3 | - | Light reactions | dpip
Chloroplasts were mixed with DPIP, a blue dye that becomes colorless when it accepts electrons, and the absorbance was measured, as shown. Which conclusion is best supported by the data?
* Electron transport in the light reactions requires both light and functional chloroplast proteins.
- Chloroplasts reduce DPIP in the dark but not in the light.
- Boiling increases the rate of electron transport.
- DPIP is reduced by the Calvin cycle, which requires no light.
= Absorbance falls only when chloroplasts are in the light, showing that electrons are being passed to DPIP. Keeping the chloroplasts in the dark or denaturing their proteins by boiling stops the reaction. Each of those samples is a control for one variable.

@ 3 | - | Light reactions | dpip
In the experiment shown, which molecule does DPIP most directly replace?
* NADP⁺, the normal final electron acceptor of the light reactions
- Water, the normal electron donor
- CO₂, the substrate of the Calvin cycle
- ATP, the product of chemiosmosis
= In linear electron flow, electrons from water travel through photosystem II, the electron transport chain, and photosystem I to NADP⁺. DPIP intercepts those electrons, so its color change measures the rate of electron transport.

@ 3 | - | Oxidative phosphorylation | etc
Cyanide binds tightly to complex IV, shown in the diagram. Which set of effects is expected in a cell exposed to cyanide?
* Electron flow and oxygen consumption stop, the proton gradient dissipates, and ATP synthesis by ATP synthase stops.
- Electron flow continues, but ATP synthase stops because it binds cyanide.
- Oxygen consumption increases, because electrons accumulate at complex IV.
- Glycolysis stops immediately, because cyanide binds NADH.
= Complex IV passes electrons to oxygen, the final acceptor. If it is blocked, the whole chain backs up, no protons are pumped, and the gradient that drives ATP synthase runs down. Cells then rely on glycolysis and fermentation, which yield far less ATP.

@ 3 | - | Chemiosmosis | etc
In the system shown, where is the pH lowest while the electron transport chain is operating?
* In the intermembrane space
- In the matrix
- Inside complex IV
- It is the same everywhere, because protons diffuse freely
= The complexes pump protons from the matrix into the intermembrane space, so the proton concentration is highest there and the pH is lowest. The inner membrane is impermeable to protons except through channels such as ATP synthase.

@ 3 | - | Fermentation | yeast
Yeast were suspended in solutions of three sugars, and the CO₂ they released was measured, as shown. Which statement best explains the result with lactose?
* The yeast lack the enzyme needed to break down lactose, so they cannot use it as an energy source.
- Lactose is broken down so quickly that no CO₂ is released.
- Lactose is a polysaccharide that cannot enter cells.
- The yeast use lactose for aerobic respiration, which releases no CO₂.
= Cells can use a sugar only if they have the enzymes to transport and break it down. Most strains of baker's yeast do not make lactase, so lactose cannot feed into glycolysis. Respiration of any sugar releases CO₂.

@ 3 | - | Fermentation | yeast
In the graph, CO₂ release with sucrose begins about 12 minutes later than with glucose and then proceeds at the same rate. Which hypothesis best explains the delay?
* Sucrose must first be hydrolyzed to glucose and fructose, and the yeast take time to increase production of the enzyme that does this.
- Sucrose is used by a slower pathway than glucose for its whole length.
- Sucrose molecules are larger, so the yeast respire more slowly once they begin.
- Sucrose inhibits fermentation, so the yeast must wait until it is used up.
= Sucrose is a disaccharide that must be split before its sugars can enter glycolysis. Once that step is underway, the rate matches glucose, showing that the same downstream pathway is being used.

@ 3 | - | ATP yield
Why does aerobic respiration yield many more ATP per glucose than fermentation?
* With oxygen as the final electron acceptor, the energy in NADH and FADH₂ drives oxidative phosphorylation.
- Fermentation produces no ATP at all.
- Aerobic respiration uses a different form of glycolysis that produces more ATP.
- Oxygen is a source of energy that the cell converts into ATP.
= Fermentation regenerates NAD⁺ without capturing the energy in NADH and yields only the 2 ATP of glycolysis. Aerobic respiration completely oxidizes pyruvate, and the electron transport chain uses the energy of the electron carriers to make most of the cell's ATP.

@ 3 | - | Photosynthetic adaptations
Pineapple and many cacti open their stomata at night and close them during the day, fixing CO₂ into organic acids in the dark. What is the main advantage of this pattern?
* It reduces water loss, because the stomata are closed during the hot, dry daytime.
- It allows the light reactions to occur at night.
- It allows rubisco to work without ATP.
- It increases the amount of oxygen the plant releases.
= In CAM plants, CO₂ is stored at night in organic acids and released inside the leaf during the day, where the Calvin cycle uses it with ATP and NADPH from the light reactions. Separating the steps in time lets the plant keep its stomata closed when evaporation would be greatest.

@ 3 | - | Photorespiration
On a hot, dry day, a plant closes its stomata. The concentration of CO₂ in its leaves falls and the concentration of O₂ rises. Why does photosynthetic efficiency decrease?
* Rubisco increasingly binds O₂ instead of CO₂, a process that consumes energy and releases previously fixed carbon.
- The light reactions stop when the concentration of O₂ rises.
- Rubisco is denatured whenever the stomata close.
- The Calvin cycle begins producing O₂ instead of sugar.
= Rubisco can fix either CO₂ or O₂. When O₂ is relatively abundant, photorespiration uses ATP and releases CO₂ without making sugar. C₄ and CAM plants concentrate CO₂ around rubisco to reduce it.

@ 3 | - | Cyclic electron flow
The Calvin cycle uses about 3 ATP for every 2 NADPH. In cyclic electron flow, electrons from photosystem I return to the electron transport chain instead of reducing NADP⁺. Which statement best explains why cyclic flow is useful?
* It produces additional ATP without producing NADPH, helping supply the extra ATP the Calvin cycle requires.
- It produces additional NADPH without producing ATP.
- It splits water to release more oxygen.
- It fixes CO₂ directly, bypassing the Calvin cycle.
= Linear electron flow produces ATP and NADPH in roughly equal proportions, but the Calvin cycle consumes more ATP than NADPH. Cyclic flow pumps protons and so drives ATP synthase, without the electrons ending up in NADPH.

@ 4 | - | Second messengers | cAMP
Cells were treated with a hormone at 1 minute, and their cAMP was measured, as shown. Drug Q inhibits phosphodiesterase, an enzyme that breaks down cAMP. Which conclusion is best supported?
* The decline in cAMP in control cells results from its breakdown by phosphodiesterase, which ends the signal.
- Drug Q activates adenylyl cyclase, which makes more cAMP.
- The hormone is broken down by phosphodiesterase in control cells.
- cAMP is not involved in this hormone's pathway.
= cAMP levels reflect a balance between synthesis by adenylyl cyclase and breakdown by phosphodiesterase. When the breakdown is blocked, cAMP stays high, so the fall in control cells must come from phosphodiesterase activity. Turning signals off is as important as turning them on.

@ 4 | - | Second messengers | cAMP
In the pathway studied in the graph, the hormone binds a G protein–coupled receptor on the cell surface. Which statement correctly describes the role of cAMP?
* It is a small intracellular messenger that relays and amplifies the signal by activating protein kinase A.
- It is the hormone's receptor on the cell surface.
- It carries the hormone across the plasma membrane.
- It is the final cellular response to the hormone.
= The hormone cannot enter the cell; its binding activates a G protein, which activates adenylyl cyclase. Each enzyme molecule makes many cAMP molecules, which activate protein kinase A, amplifying the signal inside the cell.

@ 4 | - | Negative feedback | thyroid
The diagram shows how thyroxine production is regulated. Iodine is required to make thyroxine. In a person whose diet lacks iodine, which outcome is expected?
* Thyroxine levels fall, TSH levels rise, and the thyroid gland enlarges.
- Thyroxine levels rise, TSH levels fall, and the thyroid gland shrinks.
- Both thyroxine and TSH levels fall.
- TRH and TSH are not released, because the thyroid stops responding.
= With little thyroxine, the negative feedback on the hypothalamus and pituitary is removed, so they release more TRH and TSH. Constant stimulation by TSH makes the thyroid grow, forming a goiter, even though it cannot make enough hormone.

@ 4 | - | Negative feedback | thyroid
A patient takes thyroxine pills in a dose higher than the body needs. Based on the diagram, which change is expected?
* The release of TSH decreases, and the patient's own thyroid gland becomes less active.
- The release of TSH increases, stimulating the thyroid further.
- TRH increases, because the hypothalamus detects more thyroxine.
- The thyroid gland enlarges, because thyroxine stimulates it.
= High thyroxine inhibits the hypothalamus and the anterior pituitary, so TRH and TSH fall. Without TSH, the thyroid gland reduces its own output. Negative feedback opposes a change in the regulated variable.

@ 4 | - | Cell cycle checkpoints | checkpoint
Cultured cells were treated with two drugs, and the percentage of cells in each phase was measured after 24 hours, as shown. Which conclusion about drug X is best supported?
* It prevents cells from passing the G₁ checkpoint into S phase.
- It prevents cells from completing mitosis.
- It speeds up DNA replication.
- It has no effect on the cell cycle.
= When a phase is blocked, cells accumulate just before the block. Drug X raises the share of cells in G₁ from 60 to 85 percent while S and G₂/M fall, which is consistent with arrest before DNA replication.

@ 4 | - | Cell cycle checkpoints | checkpoint
Based on the table, which drug action is most consistent with the effect of drug Y?
* It prevents the mitotic spindle from forming, so cells cannot complete mitosis.
- It prevents DNA replication from starting.
- It triggers cytokinesis before DNA is replicated.
- It keeps cells permanently in G₀.
= Drug Y increases the share of cells in G₂ and M from 15 to 65 percent. Cells that have replicated their DNA but cannot divide, as when spindle formation is blocked, pile up at that point.

@ 4 | - | Receptor tyrosine kinases
A growth factor binds to receptor tyrosine kinases, which pair up and phosphorylate each other, activating a pathway that stimulates cell division. A mutant receptor pairs up and becomes phosphorylated even without the growth factor. Which outcome is most likely?
* The cell divides even in the absence of the growth factor, which can contribute to cancer.
- The cell cannot divide, because the receptor no longer binds the growth factor.
- The cell divides only when the growth factor is present.
- The cell undergoes apoptosis, because the receptor is always phosphorylated.
= Dimerization and phosphorylation are the receptor's on switch. A receptor that switches on without its signal keeps the division pathway active continuously; many cancers carry such gain-of-function mutations in growth factor receptors.

@ 4 | - | Oncogenes and tumor suppressors
Why does cancer typically require a mutation in only one copy of a proto-oncogene but in both copies of a tumor suppressor gene?
* A proto-oncogene mutation that increases activity has an effect even when the other copy is normal, but one normal copy of a tumor suppressor gene is usually enough to restrain division.
- Proto-oncogenes are found on only one chromosome, while tumor suppressor genes are on two.
- Tumor suppressor genes mutate more often than proto-oncogenes.
- Mutations in proto-oncogenes are recessive, and those in tumor suppressor genes are dominant.
= An overactive oncogene product is like a stuck accelerator: one mutant copy drives division. A tumor suppressor is a brake, and as long as one copy works, the brake still functions. Losing both copies is often called the two-hit hypothesis.

@ 4 | - | Specificity of responses
Epinephrine causes liver cells to break down glycogen but causes smooth muscle in some blood vessels to relax. Which statement best explains how one signal produces different responses?
* The cells have different receptors or different intracellular pathway components, so the same signal triggers different responses.
- Epinephrine changes its structure before reaching each type of cell.
- Only liver cells have receptors for epinephrine.
- Smooth muscle cells break down epinephrine before it can act.
= The response to a signal depends on the receiving cell's receptors, relay molecules, and target proteins. Differences in any of these allow one hormone to coordinate several different responses throughout the body.

@ 4 | - | Mitosis and cytokinesis
Some cells in a developing tissue contain several nuclei within a single plasma membrane. Which process most likely produced these cells?
* Repeated mitosis without cytokinesis
- Repeated cytokinesis without mitosis
- Meiosis followed by fertilization
- DNA replication without mitosis
= Mitosis divides the nucleus and cytokinesis divides the cytoplasm. If nuclear division repeats without cytoplasmic division, one cell accumulates several nuclei, as in some muscle cells and in the early fruit fly embryo.

@ 4 | - | Regulation of cell division
Normal cells grown in a dish stop dividing when they form a single layer that covers the surface, and they do not divide unless attached to a surface. Cancer cells grown the same way keep dividing and pile up. Which statement best explains the difference?
* Cancer cells have lost density-dependent inhibition and anchorage dependence, two external controls on the cell cycle.
- Cancer cells have no cell cycle checkpoints of any kind.
- Normal cells stop dividing because they have used up all of their DNA.
- Cancer cells divide only when they are attached to a surface.
= Contact with neighboring cells and attachment to a surface send signals that normally regulate division. Cancer cells ignore these signals, which allows them to form tumors and, in some cases, to spread through the body.

@ 4 | - | Types of signaling
Insulin, released by the pancreas, reaches its target cells throughout the body, while acetylcholine released by a neuron reaches a muscle cell only nanometers away. How are these two forms of signaling classified?
* Insulin acts in endocrine signaling and acetylcholine in synaptic signaling.
- Both act in paracrine signaling.
- Insulin acts in synaptic signaling and acetylcholine in endocrine signaling.
- Both act in endocrine signaling, because both are chemical signals.
= Endocrine signals are hormones carried by the blood to distant targets. Synaptic signals are neurotransmitters released across the narrow gap between a neuron and its target. Paracrine signals act on nearby cells by diffusion.

@ 5 | - | Pedigree analysis | pedigreeX
The pedigree shows a rare disorder; filled symbols represent affected individuals. Which mode of inheritance is most consistent with the pedigree?
* X-linked recessive
- Autosomal dominant
- X-linked dominant
- Y-linked
= The trait skips a generation: an affected grandfather has an unaffected daughter whose son is affected, and only males are affected. An affected man passes his X chromosome to all of his daughters, who are carriers. X-linked dominant inheritance would make the daughter affected, and a Y-linked trait could not pass through her.

@ 5 | - | Pedigree analysis | pedigreeX
In the pedigree shown, the disorder is X-linked recessive. If individuals II-1 and II-2 have another son, what is the probability that he will be affected?
* \(\dfrac{1}{2}\)
- \(\dfrac{1}{4}\)
- \(0\)
- \(1\)
= II-1 received her father's X chromosome and must be a carrier. A son receives his Y chromosome from his father and one of his mother's two X chromosomes, so he has a one-half chance of receiving the X with the recessive allele. One fourth is the chance that the next child, of either sex, is an affected son.

@ 5 | - | Meiosis | meiosisDNA
The graph shows the amount of DNA per cell during meiosis. During which labeled interval do homologous chromosomes separate into different cells?
* Interval Y
- Interval W
- Interval X
- Interval Z
= DNA is replicated during interval X. In meiosis I, homologous chromosomes separate and the DNA per cell halves, from 4 to 2 units, at Y. In meiosis II, sister chromatids separate and the DNA halves again, at Z.

@ 5 | - | Meiosis | meiosisDNA
Based on the graph, how does the DNA content of a gamete compare with that of a body cell of the same organism in G₁?
* It is half as much.
- It is the same.
- It is one quarter as much.
- It is twice as much.
= A G₁ cell has 2 units of DNA in the graph and a gamete has 1. Replication doubles the DNA and two divisions halve it twice, so gametes are haploid and fertilization restores the diploid amount.

@ 5 | - | Chi-square analysis | monohybrid
Students crossed two heterozygous plants and counted the offspring, as shown. Using \(\chi^2=\sum\dfrac{(O-E)^2}{E}\) and a critical value of 3.84 (1 degree of freedom, \(p=0.05\)), which conclusion is correct?
* \(\chi^2\approx 1.33\); the data are consistent with a 3 : 1 ratio.
- \(\chi^2\approx 1.33\); the data are inconsistent with a 3 : 1 ratio.
- \(\chi^2\approx 0.33\); the data are consistent with a 3 : 1 ratio.
- \(\chi^2\approx 10\); the data are inconsistent with a 3 : 1 ratio.
= \(\chi^2=\dfrac{(70-75)^2}{75}+\dfrac{(30-25)^2}{25}=0.33+1.00=1.33\). This is below 3.84, so the deviation from 3 : 1 can be attributed to chance and the null hypothesis is not rejected. The value 0.33 comes from omitting the white class.

@ 5 | - | Chi-square analysis | monohybrid
Suppose the students had counted 700 purple-flowered and 300 white-flowered offspring, the same proportions as in the table. What would the chi-square test show?
* \(\chi^2\approx 13.3\); the deviation from 3 : 1 would be statistically significant.
- \(\chi^2\approx 1.33\), the same as before, because the proportions are the same.
- \(\chi^2\approx 0.13\); the fit would be better because the sample is larger.
- The test cannot be applied to samples larger than 100.
= With expected values of 750 and 250, \(\chi^2=\dfrac{50^2}{750}+\dfrac{50^2}{250}=3.33+10=13.3\). A larger sample makes the same proportional deviation less likely to arise by chance, so it would justify rejecting the 3 : 1 hypothesis.

@ 5 | - | Gene mapping | recombination
The table shows recombination frequencies between three linked genes. What is the order of the genes on the chromosome?
* A, B, C
- A, C, B
- B, A, C
- The order cannot be determined from recombination frequencies.
= Recombination frequency increases with distance, so the two genes farthest apart, A and C at 16 percent, are at the ends. Gene B lies between them, 12 map units from A and 5 from C.

@ 5 | - | Gene mapping | recombination
In the table, the recombination frequency between A and C is 16 percent, slightly less than the sum of the A–B and B–C frequencies. Which statement best explains the difference?
* Some chromosomes undergo two crossovers between A and C, which restore the parental combination of those two genes and go undetected.
- Gene B interferes with crossing over between A and C.
- Recombination frequencies cannot be added, because the genes are on different chromosomes.
- Crossing over between A and C occurs only in males.
= A double crossover, one on each side of B, swaps the alleles twice and leaves A and C in their parental arrangement. Measuring A and C alone misses those events, so distant genes appear slightly closer than the sum of intervening distances.

@ 5 | - | Codominance and multiple alleles
A man with blood type AB and a woman with blood type O have a child. What is the probability that the child has blood type A?
* \(\dfrac{1}{2}\)
- \(\dfrac{1}{4}\)
- \(0\)
- \(1\)
= The man is \(I^AI^B\) and the woman is \(ii\). Every child receives \(i\) from the mother and \(I^A\) or \(I^B\) from the father with equal probability, so the children are type A (\(I^Ai\)) or type B (\(I^Bi\)), each with probability one half. No child can be AB or O.

@ 5 | - | Polygenic inheritance
Human height shows a continuous range of values that forms a bell-shaped distribution in a population. Which explanation best accounts for this pattern?
* Height is influenced by many genes, each with a small additive effect, along with environmental factors such as nutrition.
- Height is controlled by a single gene with two alleles showing incomplete dominance.
- Height is determined entirely by the environment.
- Height is controlled by one gene with many codominant alleles.
= When many genes each contribute a little, the number of possible genotypes is large and most people fall near the middle. Environmental effects blur the boundaries further, giving continuous variation rather than distinct classes.

@ 5 | - | Independent assortment
How many genetically different kinds of gametes can be produced by an individual with the genotype AaBbCcDd, if the four genes assort independently?
* 16
- 8
- 4
- 81
= Each gene contributes one of two alleles to a gamete, and independent assortment makes every combination possible: \(2^4=16\). The number 81 is the number of genotypes possible among the offspring of two such individuals.

@ 5 | - | Nondisjunction
How do the gametes produced when a pair of homologous chromosomes fails to separate in meiosis I compare with those produced when sister chromatids fail to separate in meiosis II?
* Nondisjunction in meiosis I makes all four gametes abnormal; nondisjunction in meiosis II makes two of the four abnormal.
- Nondisjunction in meiosis I makes two of the four gametes abnormal; nondisjunction in meiosis II makes all four abnormal.
- Both produce two normal and two abnormal gametes.
- Both make all four gametes abnormal.
= If homologs fail to separate in meiosis I, one daughter cell gets both and the other gets neither, so all four gametes are n + 1 or n − 1. In meiosis II, the failure occurs in only one of the two dividing cells, so the other cell's two gametes are normal.

@ 5 | - | Sources of genetic variation
Which process produces a chromosome carrying a combination of alleles that was not present on either chromosome of the parent?
* Crossing over between homologous chromosomes in prophase I
- Independent assortment of homologous chromosomes in metaphase I
- Separation of sister chromatids in meiosis II
- Random fertilization of an egg by a sperm
= Crossing over exchanges segments between homologs, creating recombinant chromosomes. Independent assortment and random fertilization produce new combinations of whole chromosomes, but each chromosome itself is unchanged.

@ 6 | - | RNA processing | geneMap
The diagram shows a eukaryotic gene. Ignoring the 5′ cap, the poly-A tail, and any untranslated regions, how many nucleotides long is the mature mRNA?
* 360
- 1,360
- 1,000
- 760
= Introns are removed by splicing, so the mature mRNA contains only the exons: \(120+90+150=360\) nucleotides. The primary transcript would include all 1,360 nucleotides.

@ 6 | - | RNA processing | geneMap
A mutation in intron 1 of the gene shown destroys a splice site, causing exon 2 to be skipped: exon 1 is joined directly to exon 3. Which effect on the protein is most likely?
* It lacks 30 amino acids, and the amino acids encoded by exon 3 are unchanged, because 90 is a multiple of 3.
- Every amino acid encoded by exon 3 is changed, because the reading frame shifts.
- It is longer, because intron 1 is now translated.
- It is unchanged, because exon 2 is not part of the coding sequence.
= Removing 90 nucleotides removes 30 codons without shifting the reading frame. Skipping an exon whose length is not a multiple of three would shift the frame and alter everything downstream. Alternative splicing uses the same principle to make related proteins from one gene.

@ 6 | - | Repressible operons | trp
The diagram shows the trp operon when tryptophan is abundant. Which statement describes how the operon is regulated?
* Tryptophan binds the repressor and activates it, so the repressor binds the operator and blocks transcription.
- Tryptophan binds the operator directly and blocks RNA polymerase.
- Tryptophan removes the repressor from the operator, turning the genes on.
- The repressor binds tryptophan and destroys it.
= The trp operon is repressible: its repressor is inactive alone and becomes active when tryptophan, the end product of the pathway, binds it as a corepressor. The cell stops making the enzymes when it has enough of their product.

@ 6 | - | Repressible operons | trp
A mutation changes the trp repressor so that it can no longer bind tryptophan. Which outcome is expected?
* The trp genes are transcribed whether or not tryptophan is present.
- The trp genes are never transcribed.
- The trp genes are transcribed only when tryptophan is present.
- The repressor binds the operator permanently.
= Without tryptophan bound, the repressor stays in its inactive shape and cannot bind the operator. RNA polymerase transcribes the genes continuously, wasting energy on enzymes even when tryptophan is plentiful.

@ 6 | - | Restriction mapping | restriction
The linear DNA molecule shown is cut with both EcoRI and HindIII, and the fragments are separated by gel electrophoresis. How many distinct bands appear?
* Two bands: one of 3 kb and one of 2 kb, each containing two fragments
- Four bands, one for each fragment
- Three bands, of 3, 4, and 3 kb
- One band, because all of the fragments are the same length
= The cuts at 3, 5, and 7 kb produce fragments of 3, 2, 2, and 3 kb. Fragments of the same length travel together, so the four fragments form two bands, each of which would appear about twice as bright as a band containing one fragment.

@ 6 | - | Restriction mapping | restriction
Which digest of the DNA molecule shown produces a single band on a gel?
* HindIII alone
- EcoRI alone
- EcoRI and HindIII together
- Neither enzyme, because the molecule is linear
= HindIII cuts once at 5 kb, producing two fragments of 5 kb that run together. EcoRI alone produces fragments of 3, 4, and 3 kb, which give two bands.

@ 6 | - | Regulation of the lac operon | lacData
The table shows β-galactosidase activity in E. coli grown in four media. Which statement best explains why activity is highest when lactose is present and glucose is absent?
* Lactose inactivates the repressor, and low glucose raises cAMP, which binds CAP and helps RNA polymerase bind the promoter.
- Glucose activates the repressor, which binds lactose.
- Lactose increases the amount of glucose in the cell, which activates transcription.
- Without glucose, the cell makes more repressor, which activates transcription.
= The lac operon has two controls. Removing the repressor allows transcription, and the CAP–cAMP complex strongly increases it. Both conditions are met only when lactose is present and glucose is scarce, so the cell uses lactose only when its preferred sugar runs out.

@ 6 | - | Regulation of the lac operon | lacData
A mutant strain of E. coli cannot make cAMP. In a medium with lactose and no glucose, what level of β-galactosidase activity is expected, based on the table?
* Low, similar to the 120 units seen with both sugars present
- About 1,500 units, the same as the normal strain
- About 2 units, because the repressor stays bound
- Higher than 1,500 units, because the cell cannot sense glucose
= Lactose still removes the repressor, so some transcription occurs, but without cAMP, CAP cannot boost RNA polymerase binding. The result resembles the induced but CAP-free condition in which glucose keeps cAMP low.

@ 6 | - | Translation
A tRNA has the anticodon 3′-UAC-5′. Which mRNA codon does it pair with, and which amino acid does it carry?
* 5′-AUG-3′, methionine
- 5′-UAC-3′, tyrosine
- 5′-CAU-3′, histidine
- 5′-ATG-3′, methionine
= Codon and anticodon pair antiparallel: U pairs with A, A with U, and C with G, giving 5′-AUG-3′. AUG codes for methionine and is the start codon. mRNA contains uracil, not thymine.

@ 6 | - | DNA replication
A bacterial strain has a temperature-sensitive DNA ligase that stops working at high temperature. When the bacteria are shifted to high temperature during DNA replication, what accumulates?
* Short DNA fragments from the lagging strand that are not joined together
- Unwound, single-stranded DNA with no new strands made
- RNA primers that are never synthesized
- Leading strands that are not extended
= The lagging strand is made discontinuously as Okazaki fragments, whose RNA primers are replaced with DNA. Ligase seals the remaining gaps in the backbone; without it the fragments stay separate.

@ 6 | - | Telomeres
In most human somatic cells, chromosomes become slightly shorter with each round of DNA replication, but in germ cells and many cancer cells they do not. Which statement best explains this?
* Germ cells and many cancer cells make telomerase, which extends the repetitive sequences at chromosome ends.
- Somatic cells lose a gene each time they divide.
- DNA polymerase in germ cells can add nucleotides without a primer.
- Cancer cells do not replicate their DNA before dividing.
= On the lagging strand, removing the final primer leaves a gap at the very end that DNA polymerase cannot fill, so the ends shorten. Telomerase carries its own RNA template and extends the telomeres, allowing unlimited divisions.

@ 6 | - | Biotechnology
A scientist inserts a human gene, copied directly from genomic DNA, into a plasmid and expresses it in bacteria, but the protein produced is not functional. The same gene expressed in yeast works. Which change would most likely allow the bacteria to make a functional protein?
* Insert DNA made from the gene's mature mRNA by reverse transcriptase (cDNA) instead of the genomic DNA.
- Insert the gene into a second plasmid in the same bacteria.
- Grow the bacteria at a higher temperature.
- Add the human promoter to the gene.
= Human genes contain introns, and bacteria lack the machinery to splice them out, so the transcript is translated with the introns included. cDNA made from processed mRNA already lacks introns. Yeast, as eukaryotes, can splice.

@ 6 | - | Chromatin and gene expression
A drug inhibits the enzymes that remove acetyl groups from histone proteins. Which effect on gene expression is most likely in treated cells?
* Chromatin becomes less tightly packed, and transcription of many genes increases.
- Chromatin becomes more tightly packed, and transcription decreases.
- The DNA sequence of many genes changes.
- Translation of all mRNAs stops.
= Acetylation neutralizes positive charges on histones, loosening their grip on DNA and making it accessible to transcription machinery. Blocking deacetylation keeps chromatin open, an epigenetic change that does not alter the DNA sequence.

@ 7 | - | Natural selection | moths
The graph shows the frequency of an allele for dark wings in a moth population near an industrial city, where soot darkened tree trunks until air-pollution laws were passed in 1956. Which statement best explains the pattern?
* Birds more easily found moths that contrasted with the trunks, so selection favored dark moths while trunks were sooty and light moths after the air was cleaned.
- Soot caused mutations for dark wings, and clean air reversed them.
- Moths darkened their wings to match the trunks, and passed the change to their offspring.
- The pattern resulted from genetic drift, because the allele frequency changed.
= Predators removed the more visible moths, so the better-camouflaged form left more offspring. When the environment changed back, the direction of selection reversed. Drift would not produce a change that tracks pollution in both directions.

@ 7 | - | Natural selection | moths
A student claims that the rapid rise in the dark-wing allele after 1850 shows that pollution creates the variation that natural selection acts on. Which observation would most directly contradict this claim?
* Dark moths were found at low frequency in collections made before industrial pollution began.
- The allele frequency fell after the air-pollution laws were passed.
- Light moths were more often eaten by birds on sooty trunks.
- Dark moths had more offspring than light moths in polluted areas.
= If dark moths existed before pollution, the allele arose by random mutation independent of the environment, and pollution only changed which existing form was favored. The other observations describe selection, not the origin of the variation.

@ 7 | - | Phylogenetics | traits
The table shows the presence of five traits in six organisms. The lancelet is the outgroup. Which organism is most closely related to the lizard?
* The mouse
- The frog
- The shark
- The lamprey
= Close relatives share the most derived traits. The lizard and mouse share four derived traits, including the amniotic egg, which no other organism in the table has. That makes them the most recent branch on a tree built from these traits.

@ 7 | - | Phylogenetics | traits
On a phylogenetic tree built from the table, which trait would appear on the branch leading to the frog, lizard, and mouse but not the shark?
* Lungs
- Jaws
- The amniotic egg
- Hair
= A shared derived trait marks the branch where it evolved. Lungs are present in the frog, lizard, and mouse but absent in the shark, so they evolved after the shark's lineage diverged. Jaws are shared with the shark, and the amniotic egg excludes the frog.

@ 7 | - | Molecular clocks | clock
The graph relates differences in protein P to divergence times known from fossils. Two living species differ by 30 amino acids in protein P. When did their lineages most likely diverge?
* About 75 million years ago
- About 30 million years ago
- About 12 million years ago
- About 120 million years ago
= The line has a slope of 0.4 differences per million years. Dividing 30 differences by 0.4 gives 75 million years. Reading the number of differences as a number of millions of years gives 30.

@ 7 | - | Molecular clocks | clock
The method in the graph depends on an assumption. Which assumption is required to use protein P as a molecular clock?
* Amino acid changes in protein P accumulate at a roughly constant rate over time.
- Protein P is absent from the species being compared.
- Protein P is under strong directional selection in every lineage.
- Each species has a different version of the genetic code.
= A molecular clock converts the amount of change into time only if change accumulates at a steady average rate. Proteins whose changes are largely neutral are preferred; strong or variable selection would make the rate inconsistent.

@ 7 | - | Hardy-Weinberg equilibrium
In a population in Hardy-Weinberg equilibrium, 9 percent of individuals show a recessive phenotype. What percentage of the population carries one copy of the recessive allele?
* 42%
- 21%
- 49%
- 9%
= \(q^2=0.09\), so \(q=0.3\) and \(p=0.7\). Heterozygotes occur at \(2pq=2(0.7)(0.3)=0.42\). The homozygous dominant class is 49 percent.

@ 7 | - | Hardy-Weinberg equilibrium
Which population is most likely to remain close to Hardy-Weinberg equilibrium for a particular gene?
* A very large population with random mating, no migration, and no selection on the gene, in which mutation is rare
- A small, isolated population that mates randomly
- A large population in which individuals choose mates with the same genotype
- A large population that receives many immigrants from a population with different allele frequencies
= Hardy-Weinberg equilibrium requires the absence of each evolutionary force: drift (minimized in large populations), gene flow, selection, nonrandom mating, and mutation. Each of the other populations violates one of these conditions.

@ 7 | - | Founder effect
An unusual form of dwarfism with extra fingers is far more common in one Amish community than in the general population. The community descends from about 200 people who settled together in the 1700s. Which mechanism most likely explains the high frequency?
* The founder effect: by chance, one of the original settlers carried the allele, and the small group was isolated afterward.
- Natural selection favored the allele in this community.
- The allele arises by new mutation in each generation of the community.
- Gene flow from neighboring populations introduced the allele.
= When a few individuals start a new population, their alleles may not represent the source population. An allele that is rare elsewhere can become common through this sampling effect and later drift, without any advantage.

@ 7 | - | Population bottlenecks
Cheetahs have unusually low genetic diversity, so that skin grafts between unrelated cheetahs are often accepted. Which explanation is most consistent with this?
* The population was reduced to very few individuals in the past, and the survivors carried only a small part of the original diversity.
- Cheetahs reproduce asexually.
- Natural selection has favored identical genotypes in all cheetahs.
- Cheetahs have an unusually low mutation rate compared with other mammals.
= A bottleneck is a severe reduction in population size that removes many alleles by chance. Even if the population later grows, diversity recovers slowly, which can leave the species vulnerable to disease and environmental change.

@ 7 | - | Sexual selection
Male peacocks have large, conspicuous tails that make them more visible to predators. Which explanation best accounts for the evolution of such a trait?
* Females prefer to mate with males that have larger tails, so the trait increases reproductive success more than it reduces survival.
- The tail helps males escape predators by distracting them.
- The trait arose because males use their tails more than females do.
- Large tails evolved because they help regulate body temperature.
= Fitness is measured by reproductive success, not survival alone. Sexual selection can favor traits that are costly for survival when they increase mating success, especially when one sex chooses mates.

@ 7 | - | Reproductive isolation
A horse and a donkey can mate and produce a mule, which is healthy but sterile. Which type of reproductive barrier keeps horses and donkeys separate species?
* A postzygotic barrier: hybrid sterility
- A prezygotic barrier: behavioral isolation
- A prezygotic barrier: gametic isolation
- A postzygotic barrier: reduced hybrid viability
= The barrier acts after fertilization, because a zygote forms and develops into a healthy adult. Because mules cannot reproduce, no genes flow between the two species. Reduced hybrid viability would mean hybrids fail to survive.

@ 7 | - | Origin of life
Scientists have found that some RNA molecules, called ribozymes, catalyze chemical reactions, including joining nucleotides together. Why is this discovery important to hypotheses about the origin of life?
* RNA can both store genetic information and act as a catalyst, so early life could have relied on RNA alone before DNA and proteins.
- It shows that the first living cells contained DNA, RNA, and proteins.
- It shows that proteins evolved before nucleic acids.
- It proves that life arrived on Earth from outer space.
= In modern cells, DNA stores information and proteins catalyze reactions, so each seems to require the other. An RNA world, in which RNA did both jobs, resolves that problem. Ribozymes still form the catalytic core of the ribosome.

@ 8 | - | Competition | competition
Two protist species were grown alone and together in the same medium, as shown. Which conclusion is best supported?
* When the species share the same limited resources, species A outcompetes species B and drives it nearly to extinction.
- Species B preys on species A.
- The two species can coexist indefinitely in the same container.
- Species A depends on species B to survive.
= Species B grows well alone, so the decline is caused by species A. When two species compete for exactly the same resources in the same place, the more efficient competitor eliminates the other, as described by the competitive exclusion principle.

@ 8 | - | Competition | competition
In a separate experiment, the two species shown are grown in a container whose medium is layered so that the top is rich in oxygen and the bottom is rich in bacteria at low oxygen. Both species persist. Which explanation is most consistent?
* The species divide the habitat, using different parts of it, so they compete less directly.
- Species A stops reproducing when species B is present.
- The species become a single species when they share a container.
- Competition increases when the habitat is more varied.
= When a habitat offers different resources in different places, competitors can specialize and partition resources. Their realized niches overlap less, so neither excludes the other.

@ 8 | - | Nitrogen cycle | nitrogen
Which numbered process in the diagram is carried out by bacteria living in nodules on the roots of legumes?
* Process 1
- Process 2
- Process 3
- Process 4
= Process 1 converts atmospheric N₂ into ammonium, which is nitrogen fixation. Rhizobium bacteria in root nodules fix nitrogen in exchange for sugars from the plant. Process 2 is nitrification and process 3 is denitrification.

@ 8 | - | Nitrogen cycle | nitrogen
Waterlogged soils have very little oxygen, and nitrogen is lost from them to the atmosphere. Which numbered process in the diagram is most responsible?
* Process 3
- Process 1
- Process 2
- Process 4
= Denitrifying bacteria use nitrate instead of oxygen as an electron acceptor in anaerobic conditions, releasing N₂ gas. Nitrification, process 2, requires oxygen and would be slowed in waterlogged soil.

@ 8 | - | Eutrophication | bloom
The graph shows a lake after fertilizer runoff. Which explanation best accounts for the drop in dissolved oxygen around day 17?
* Decomposers respiring as they break down the large amount of dead algae consume the oxygen.
- The algae consume oxygen as they photosynthesize.
- The fertilizer reacts chemically with oxygen in the water.
- Fish increase their activity and consume the oxygen.
= Nutrients from the fertilizer cause an algal bloom. When the algae die, bacteria decompose them by aerobic respiration, using oxygen faster than it is replaced. The low point follows the algal peak because decomposition lags the bloom.

@ 8 | - | Eutrophication | bloom
Based on the graph, during which period would fish in the lake be most likely to die?
* Around days 15 to 20, when dissolved oxygen is lowest
- Around day 10, when algal biomass is highest
- During the first 5 days, before the bloom begins
- After day 25, when dissolved oxygen has recovered
= Fish need dissolved oxygen for aerobic respiration, and the risk is greatest when oxygen is lowest. During the bloom itself, photosynthesis by the algae keeps oxygen high in daylight.

@ 8 | - | Carbon cycle | keeling
The graph shows atmospheric CO₂ measured at a Hawaii observatory. What causes the yearly oscillation?
* Photosynthesis by land plants in the Northern Hemisphere removes CO₂ during its summer growing season, and respiration and decomposition release CO₂ in winter.
- The oceans release CO₂ every spring and absorb it every fall.
- Burning of fossil fuels stops every summer.
- Volcanic eruptions in Hawaii occur every spring.
= Most of the land, and therefore most plant biomass, is in the Northern Hemisphere. CO₂ falls from May to about October as plants grow and rises through winter, when respiration exceeds photosynthesis.

@ 8 | - | Carbon cycle | keeling
Which human activity is most responsible for the long-term upward trend shown in the graph?
* Burning fossil fuels, which releases carbon that had been stored underground for millions of years
- Increased photosynthesis by crops
- Releasing chlorofluorocarbons into the atmosphere
- The spread of aerobic respiration among organisms
= Fossil fuels contain carbon removed from the active carbon cycle long ago. Burning them adds CO₂ faster than photosynthesis and the oceans remove it. Chlorofluorocarbons damage the ozone layer but do not raise CO₂.

@ 8 | - | Primary productivity | bottles
Pond water was sealed in clear and dark bottles and incubated for 24 hours, as shown. What was the gross primary productivity, in milligrams of O₂ per liter per day?
* 6.0
- 3.0
- 11.0
- 8.0
= The dark bottle shows respiration alone: \(8.0-5.0=3.0\) mg/L. The light bottle shows net productivity, photosynthesis minus respiration: \(11.0-8.0=3.0\) mg/L. Gross productivity is the sum, \(3.0+3.0=6.0\), equivalently light minus dark.

@ 8 | - | Primary productivity | bottles
Based on the table, which statement about the organisms in the pond water is correct?
* Their net primary productivity was positive, so photosynthesis produced more oxygen than all of the organisms consumed in respiration.
- They carried out no respiration in the light bottle.
- Their net primary productivity was negative, because oxygen fell in the dark bottle.
- The data cannot distinguish photosynthesis from respiration.
= Oxygen rose by 3.0 mg/L in the light bottle, where photosynthesis and respiration both occurred, so the community as a whole gained organic matter. Respiration happens in the light as well as in the dark.

@ 8 | - | Energy flow
An ecosystem's producers store 50,000 kcal per square meter per year in new biomass. If about 10 percent of the energy at each trophic level is transferred to the next, how much energy reaches tertiary consumers?
* 50 kcal per square meter per year
- 500 kcal per square meter per year
- 5,000 kcal per square meter per year
- 5 kcal per square meter per year
= Primary consumers receive 5,000, secondary consumers 500, and tertiary consumers 50 kcal per square meter per year. Three transfers separate producers from tertiary consumers.

@ 8 | - | Invasive species
A plant species introduced to a new continent spreads rapidly and displaces many native plants, although it is uncommon in its native range. Which explanation is most likely?
* In its new range it lacks the herbivores, pathogens, and competitors that limited it in its native range.
- The plant mutates rapidly after being introduced.
- Native plants stop reproducing when a new species arrives.
- The new continent has fewer resources than the native range.
= Populations are often held below their potential by natural enemies. An introduced species may escape them, so density-dependent limits are weaker and it can outcompete native species that are still held in check.

@ 8 | - | Density-dependent factors
Which factor most likely has a greater effect on a population of deer as the population becomes more dense?
* An infectious disease that spreads by contact between individuals
- A severe winter storm
- A forest fire caused by lightning
- An unusually long drought
= An infectious disease spreads faster when individuals meet more often, so its effect increases with density, making it a density-dependent factor. Weather events and fires affect a population regardless of its size, so they are density-independent.
`;

module.exports = { source, figures };
