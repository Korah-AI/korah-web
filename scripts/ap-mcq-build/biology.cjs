// Source for korah-bot/ap/data/ap-biology/mcqs.json. Run build.cjs to regenerate.
// Each block: "@ unit | - | skill | optional figure key", stem lines, "*" the correct
// choice, "-" three distractors, "=" the explanation. The data in the figures and tables
// are invented for these questions and are modeled on standard classroom investigations.
const { graph, chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', AMBER = '#f59e0b', BLUE = '#3b82f6';
const bell = (mu, sd, peak) => x => peak * Math.exp(-((x - mu) ** 2) / (2 * sd * sd));
const sigmoid = (mid, k, top = 1) => x => top / (1 + Math.exp(-k * (x - mid)));
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const box = (x, y, w, h, label, o = {}) => [['rect', x, y, w, h, { fill: true, ...o }], text(x + w / 2, y + h / 2 + 4, label, { size: 11 })];

// Pedigree symbols: squares are males, circles are females, filled symbols are affected.
const male = (x, y, affected) => ['rect', x - 11, y - 11, 22, 22, affected ? { fill: 'currentColor' } : {}];
const female = (x, y, affected) => ['circle', x, y, 11, affected ? { fill: 'currentColor' } : {}];

const figures = {
  melt: graph({ x: [50, 100], y: [0, 100], xstep: 10, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Temperature (°C)', ytitle: 'DNA denatured (%)', w: 360,
    curves: [{ fn: x => 100 * sigmoid(70, 0.6)(x), from: 50, to: 100 }, { fn: x => 100 * sigmoid(85, 0.6)(x), from: 50, to: 100, color: PINK }], notes: [{ x: 60, y: 60, text: 'Sample 1' }, { x: 87.5, y: 30, text: 'Sample 2' }],
    alt: 'Graph of percent of DNA denatured versus temperature. Sample 1 rises steeply around 70 degrees Celsius; sample 2 rises steeply around 85 degrees Celsius' }),
  lipids: table(['Fish population', 'Water temperature', 'Unsaturated fatty acids in membrane phospholipids'], [['Population 1', '5°C', '62%'], ['Population 2', '25°C', '38%']], 'Table: fish from 5 degree water have 62 percent unsaturated fatty acids in membrane phospholipids; fish from 25 degree water have 38 percent'),
  bases: table(['Genome', 'A', 'T', 'G', 'C', 'U'], [['Virus 1', '28%', '28%', '22%', '22%', '0%'], ['Virus 2', '28%', '22%', '30%', '20%', '0%'], ['Virus 3', '25%', '0%', '25%', '25%', '25%']], 'Table of nucleotide composition of three viral genomes. Virus 1: A 28, T 28, G 22, C 22. Virus 2: A 28, T 22, G 30, C 20. Virus 3: A 25, G 25, C 25, U 25, no T'),
  saRatio: table(['Cube-shaped cell', 'Side length (µm)', 'Surface area (µm²)', 'Volume (µm³)', 'Surface area : volume'], [['X', '1', '6', '1', '6 : 1'], ['Y', '2', '24', '8', '3 : 1'], ['Z', '4', '96', '64', '1.5 : 1']], 'Table of three model cells with side lengths 1, 2, and 4 micrometers, surface areas 6, 24, and 96, volumes 1, 8, and 64, and surface area to volume ratios 6, 3, and 1.5'),
  potato: table(['Sucrose concentration (M)', '0.0', '0.2', '0.4', '0.6', '0.8'], [['Change in mass of potato cores (%)', '+18', '+8', '−1', '−12', '−20']], 'Table of percent change in mass of potato cores after 24 hours in sucrose solutions: 0.0 molar, plus 18; 0.2, plus 8; 0.4, minus 1; 0.6, minus 12; 0.8, minus 20'),
  membrane: draw(360, 210, 'Cross section of a plasma membrane with a channel protein spanning the bilayer. Many solute particles are outside the cell and few are inside; one particle is passing through the channel', [
    ...Array.from({ length: 13 }, (_, i) => 22 + i * 26).filter(x => x < 150 || x > 215).flatMap(x => [['circle', x, 84, 7, { fill: true }], ['line', x - 3, 91, x - 3, 106], ['line', x + 3, 91, x + 3, 106], ['circle', x, 136, 7, { fill: true }], ['line', x - 3, 129, x - 3, 114], ['line', x + 3, 129, x + 3, 114]]),
    ['rect', 158, 72, 18, 76, { fill: true }], ['rect', 190, 72, 18, 76, { fill: true }],
    ...[[40, 30], [70, 48], [104, 26], [136, 46], [166, 28], [214, 44], [246, 26], [280, 46], [318, 30], [300, 20], [183, 52], [183, 104]].map(([x, y]) => ['circle', x, y, 4.5, { fill: PINK, color: PINK }]),
    ...[[90, 180], [270, 176]].map(([x, y]) => ['circle', x, y, 4.5, { fill: PINK, color: PINK }]),
    text(26, 14, 'Outside the cell', { anchor: 'start', size: 11 }), text(26, 202, 'Cytoplasm', { anchor: 'start', size: 11 }), text(183, 172, 'channel protein', { size: 11 }),
  ]),
  utube: draw(340, 200, 'A container divided by a membrane that is permeable to water but not to sucrose. Side A holds 0.2 molar sucrose and side B holds 0.6 molar sucrose, with the liquid at the same level on both sides', [
    ['poly', [[60, 70], [280, 70], [280, 170], [60, 170]], { fill: true, color: 'none' }], ['path', 'M60 30 V170 H280 V30'], ['line', 60, 70, 280, 70], ['line', 170, 40, 170, 170, { dash: true }],
    text(115, 115, 'Side A'), text(115, 133, '0.2 M sucrose', { size: 11 }), text(225, 115, 'Side B'), text(225, 133, '0.6 M sucrose', { size: 11 }), text(170, 190, 'membrane permeable to water only', { size: 11 }),
  ]),
  pulse: table(['Time after labeled amino acids were supplied', 'Location of most of the radioactive label'], [['3 minutes', 'Rough endoplasmic reticulum'], ['20 minutes', 'Golgi apparatus'], ['90 minutes', 'Vesicles near the plasma membrane'], ['120 minutes', 'Outside the cell']], 'Table tracking radioactive label over time: rough endoplasmic reticulum at 3 minutes, Golgi apparatus at 20 minutes, vesicles near the plasma membrane at 90 minutes, outside the cell at 120 minutes'),
  aquaporin: graph({ x: [0, 5], y: [1, 1.6], ystep: 0.1, xlabel: '', ylabel: '', xtitle: 'Time in hypotonic solution (min)', ytitle: 'Relative cell volume', w: 360,
    curves: [{ fn: t => 1 + 0.5 * (1 - Math.exp(-t)), from: 0, to: 5 }, { fn: t => 1 + 0.02 * t, from: 0, to: 5, color: PINK }], notes: [{ x: 1.6, y: 1.5, text: 'with protein X' }, { x: 2.4, y: 1.12, text: 'without protein X' }],
    alt: 'Graph of relative cell volume over 5 minutes in a hypotonic solution. Cells with protein X swell quickly to about 1.5 times their starting volume; cells without protein X swell only slightly' }),
  enzymePH: graph({ x: [0, 12], y: [0, 100], xstep: 2, ystep: 20, xlabel: '', ylabel: '', xtitle: 'pH', ytitle: 'Reaction rate (% of maximum)', w: 360,
    curves: [{ fn: bell(2, 1.1, 100), from: 0, to: 12 }, { fn: bell(8, 1.3, 100), from: 0, to: 12, color: PINK }], notes: [{ x: 2.9, y: 92, text: 'Enzyme A' }, { x: 9.1, y: 92, text: 'Enzyme B' }],
    alt: 'Graph of reaction rate versus pH for two enzymes. Enzyme A peaks at pH 2 and has almost no activity above pH 5. Enzyme B peaks at pH 8 and has almost no activity below pH 5 or above pH 11' }),
  enzymeTemp: graph({ x: [0, 70], y: [0, 100], xstep: 10, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Temperature (°C)', ytitle: 'Reaction rate (% of maximum)', w: 360,
    curves: [{ fn: t => (t <= 40 ? 100 * Math.pow(2, (t - 40) / 12) : 100 * Math.exp(-((t - 40) ** 2) / 40)), from: 0, to: 70 }],
    alt: 'Graph of enzyme reaction rate versus temperature. The rate rises gradually from 0 to a peak at 40 degrees Celsius and then falls steeply to nearly zero by 55 degrees' }),
  inhibitors: graph({ x: [0, 10], y: [0, 100], xstep: 2, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Substrate concentration (mM)', ytitle: 'Initial reaction rate (µmol/min)', w: 370,
    curves: [{ fn: s => 100 * s / (0.6 + s), from: 0, to: 10 }, { fn: s => 100 * s / (3 + s), from: 0, to: 10, color: PINK }, { fn: s => 50 * s / (0.6 + s), from: 0, to: 10, color: AMBER }],
    notes: [{ x: 1.3, y: 92, text: 'no inhibitor' }, { x: 4.2, y: 50, text: 'inhibitor X' }, { x: 6.2, y: 37, text: 'inhibitor Y' }],
    alt: 'Graph of initial reaction rate versus substrate concentration. With no inhibitor the rate rises quickly toward 100. With inhibitor X the rate rises more slowly but approaches the same maximum at high substrate concentration. With inhibitor Y the rate levels off at about half the maximum' }),
  light: graph({ x: [0, 10], y: [0, 50], xstep: 2, ystep: 10, xlabel: '', ylabel: '', xtitle: 'Light intensity (arbitrary units)', ytitle: 'Rate of O₂ production (µmol/min)', w: 370,
    curves: [{ fn: i => 44 * (1 - Math.exp(-i / 2.2)), from: 0, to: 10 }, { fn: i => 20 * (1 - Math.exp(-i / 1.1)), from: 0, to: 10, color: PINK }], notes: [{ x: 6, y: 46, text: '0.10% CO₂' }, { x: 6, y: 23, text: '0.03% CO₂' }],
    alt: 'Graph of rate of oxygen production versus light intensity for a plant at two carbon dioxide concentrations. Both curves rise and level off; the curve at 0.10 percent carbon dioxide levels off near 44 and the curve at 0.03 percent levels off near 20' }),
  absorb: graph({ x: [400, 700], y: [0, 100], xstep: 50, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Wavelength of light (nm)', ytitle: 'Light absorbed by chlorophyll a (%)', w: 370,
    curves: [{ fn: x => bell(430, 22, 92)(x) + bell(662, 16, 78)(x) + 4, from: 400, to: 700 }],
    alt: 'Absorption spectrum of chlorophyll a: strong absorption near 430 nanometers (violet-blue) and near 660 nanometers (red), with very little absorption between 500 and 600 nanometers (green)' }),
  peas: chart({ title: 'O₂ consumed in 20 minutes (mL)', categories: ['10°C', '25°C'], series: [{ name: 'Germinating peas', values: [0.8, 1.6] }, { name: 'Dry, nongerminating peas', values: [0.1, 0.1] }], ymax: 2, ystep: 0.5, w: 400, h: 270,
    alt: 'Bar chart of oxygen consumed in 20 minutes. Germinating peas: 0.8 milliliters at 10 degrees Celsius and 1.6 at 25 degrees. Dry, nongerminating peas: 0.1 milliliters at both temperatures' }),
  pathway: draw(380, 230, 'A signaling pathway. A ligand binds a receptor in the plasma membrane. The receptor activates kinase 1, which activates kinase 2, which activates a transcription factor that enters the nucleus and turns on a target gene', [
    ['line', 20, 62, 360, 62], ['line', 20, 70, 360, 70], text(350, 54, 'plasma membrane', { anchor: 'end', size: 10 }),
    ['circle', 70, 22, 9, { fill: PINK, color: PINK }], text(86, 26, 'ligand', { anchor: 'start', size: 11 }), ['arrow', 70, 32, 70, 44],
    ...box(48, 46, 44, 40, 'receptor'), ['arrow', 92, 96, 122, 110], ...box(124, 98, 62, 26, 'kinase 1'), ['arrow', 186, 124, 206, 138], ...box(208, 128, 62, 26, 'kinase 2'), ['arrow', 262, 154, 276, 168],
    ['path', 'M196 222 Q196 166 286 166 Q372 166 372 222', { dash: true }], text(354, 216, 'nucleus', { anchor: 'end', size: 10 }), ...box(238, 172, 110, 24, 'transcription factor'), ['arrow', 292, 196, 292, 210], text(292, 224, 'target gene on', { size: 10 }),
  ]),
  glucose: graph({ x: [0, 5], y: [0, 300], ystep: 50, xlabel: '', ylabel: '', xtitle: 'Time after drinking a glucose solution (h)', ytitle: 'Blood glucose (mg/dL)', w: 370,
    curves: [{ fn: t => 90 + 80 * t * Math.exp(1 - t / 0.7), from: 0, to: 5 }, { fn: t => 130 + 150 * (1 - Math.exp(-t / 0.6)) - 12 * t, from: 0, to: 5, color: PINK }], notes: [{ x: 2.6, y: 118, text: 'Individual 1' }, { x: 2.6, y: 262, text: 'Individual 2' }],
    alt: 'Graph of blood glucose for five hours after drinking a glucose solution. Individual 1 starts at 90, peaks near 145 within an hour, and returns to about 95 by three hours. Individual 2 starts at 130, rises to about 250, and remains above 200 for the full five hours' }),
  dna: graph({ x: [0, 24], y: [0, 5], xstep: 4, xlabel: '', ylabel: '', xtitle: 'Time (h)', ytitle: 'DNA per cell (relative units)', w: 370,
    curves: [{ pts: [[0, 2], [8, 2], [14, 4], [20, 4], [21, 2], [24, 2]] }], notes: [{ x: 3, y: 2.3, text: 'W' }, { x: 10, y: 3.4, text: 'X' }, { x: 16.5, y: 4.3, text: 'Y' }, { x: 21.6, y: 3.1, text: 'Z' }],
    alt: 'Graph of DNA content per cell over 24 hours. Interval W: constant at 2 units from 0 to 8 hours. Interval X: rises from 2 to 4 units between 8 and 14 hours. Interval Y: constant at 4 units from 14 to 20 hours. Interval Z: drops from 4 to 2 units between 20 and 21 hours' }),
  rootTips: table(['Onion root tips', 'Cells in interphase', 'Cells in mitosis', 'Total cells counted'], [['Control (water)', '180', '20', '200'], ['Treated with chemical Q', '140', '60', '200']], 'Table of cell counts in onion root tips. Control: 180 cells in interphase and 20 in mitosis. Treated with chemical Q: 140 in interphase and 60 in mitosis'),
  cyclin: graph({ x: [0, 4], y: [0, 100], ystep: 20, xlabel: '', ylabel: '', xtitle: 'Time (cell cycles)', ytitle: 'Relative amount', w: 370,
    curves: [{ fn: t => 100 * (t % 1 < 0.9 ? (t % 1) / 0.9 : 1 - ((t % 1) - 0.9) / 0.1), from: 0, to: 3.999 }, { fn: t => bell(0.86, 0.045, 90)(t % 1), from: 0, to: 3.999, color: PINK }], notes: [{ x: 0.05, y: 62, text: 'cyclin' }, { x: 1.05, y: 96, text: 'MPF activity' }],
    alt: 'Graph over four cell cycles. Cyclin concentration rises steadily through each cycle and falls abruptly at the end of mitosis. MPF activity is near zero for most of each cycle and peaks sharply when cyclin is highest, just before cyclin falls' }),
  pedigree: draw(360, 230, 'Pedigree of three generations. Generation I: unaffected male 1 and unaffected female 2. Their children in generation II: affected female 1, unaffected male 2, and unaffected female 3. Female II-3 and unaffected male II-4 have two children in generation III: unaffected female 1 and affected male 2', [
    text(16, 40, 'I', { anchor: 'start' }), text(16, 120, 'II', { anchor: 'start' }), text(16, 200, 'III', { anchor: 'start' }),
    male(130, 36), female(210, 36), ['line', 141, 36, 199, 36], ['line', 170, 36, 170, 76], ['line', 90, 76, 250, 76],
    ['line', 90, 76, 90, 105], ['line', 170, 76, 170, 105], ['line', 250, 76, 250, 105], female(90, 116, true), male(170, 116), female(250, 116), male(320, 116), ['line', 261, 116, 309, 116],
    ['line', 285, 116, 285, 156], ['line', 250, 156, 320, 156], ['line', 250, 156, 250, 185], ['line', 320, 156, 320, 185], female(250, 196), male(320, 196, true),
    ...[[130, 1], [210, 2]].map(([x, n]) => text(x, 62, String(n), { size: 10 })), ...[[90, 1], [170, 2], [250, 3], [320, 4]].map(([x, n]) => text(x, 142, String(n), { size: 10 })), ...[[250, 1], [320, 2]].map(([x, n]) => text(x, 222, String(n), { size: 10 })),
  ]),
  dihybrid: table(['Phenotype of F₂ offspring', 'Observed', 'Expected for 9 : 3 : 3 : 1'], [['Purple flowers, tall', '88', '90'], ['Purple flowers, short', '33', '30'], ['White flowers, tall', '27', '30'], ['White flowers, short', '12', '10']], 'Table of 160 F2 offspring. Purple tall: 88 observed, 90 expected. Purple short: 33 observed, 30 expected. White tall: 27 observed, 30 expected. White short: 12 observed, 10 expected'),
  testcross: table(['Phenotype of testcross offspring', 'Number'], [['Gray body, normal wings', '410'], ['Black body, vestigial wings', '395'], ['Gray body, vestigial wings', '98'], ['Black body, normal wings', '97']], 'Table of 1,000 testcross offspring: 410 gray body with normal wings, 395 black body with vestigial wings, 98 gray body with vestigial wings, 97 black body with normal wings'),
  operon: draw(380, 150, 'The lac operon of E. coli: a promoter, then an operator with a repressor protein bound to it, followed by the genes lacZ, lacY, and lacA. RNA polymerase sits at the promoter', [
    ['line', 10, 100, 370, 100, { width: 3 }], ...box(30, 86, 62, 28, 'promoter'), ...box(92, 86, 58, 28, 'operator'), ...box(160, 86, 62, 28, 'lacZ'), ...box(222, 86, 62, 28, 'lacY'), ...box(284, 86, 62, 28, 'lacA'),
    ['path', 'M100 86 Q121 40 142 86 Z', { fill: PINK, color: PINK }], text(121, 34, 'repressor', { size: 11 }), ['path', 'M36 86 Q61 52 86 86 Z', { fill: true }], text(52, 46, 'RNA polymerase', { size: 11 }),
  ]),
  codons: table(['mRNA codon', 'AUG', 'UUU', 'UGG', 'UGA', 'CAU', 'GGU', 'GGC'], [['Amino acid', 'Met (start)', 'Phe', 'Trp', 'Stop', 'His', 'Gly', 'Gly']], 'Table of selected mRNA codons: AUG is methionine and the start codon, UUU is phenylalanine, UGG is tryptophan, UGA is a stop codon, CAU is histidine, GGU and GGC are both glycine'),
  gel: draw(360, 240, 'Gel electrophoresis result with wells at the top and the positive electrode at the bottom. Five lanes: a size marker, DNA from a crime scene, and DNA from suspects 1, 2, and 3. The crime scene lane has bands at three positions; only suspect 2 has bands at the same three positions', [
    ['rect', 30, 34, 300, 190, {}], text(180, 14, '−  (wells)', { size: 11 }), text(180, 238, '+', { size: 13 }),
    ...['Marker', 'Crime scene', 'Suspect 1', 'Suspect 2', 'Suspect 3'].flatMap((name, i) => [text(60 + i * 60, 30, name, { size: 9 }), ['rect', 44 + i * 60, 40, 32, 6, {}]]),
    ...[[0, [70, 95, 120, 145, 170, 195]], [1, [82, 132, 184]], [2, [82, 150, 200]], [3, [82, 132, 184]], [4, [104, 132, 172]]].flatMap(([lane, ys]) => ys.map(y => ['rect', 46 + lane * 60, y, 28, 5, { fill: 'currentColor' }])),
  ]),
  plasmid: draw(340, 230, 'A circular plasmid carrying a gene for ampicillin resistance, labeled ampR, an origin of replication, and a gene of interest inserted at a restriction site', [
    ['circle', 170, 118, 78, { width: 3 }], ['path', 'M112 66 A78 78 0 0 1 208 50', { color: PINK, width: 9 }], ['path', 'M243 146 A78 78 0 0 1 196 191', { color: AMBER, width: 9 }], ['path', 'M96 142 A78 78 0 0 1 92 112', { color: BLUE, width: 9 }],
    text(150, 30, 'ampR', { size: 12 }), text(262, 190, 'gene of interest', { anchor: 'start', size: 11 }), text(84, 130, 'ori', { anchor: 'end', size: 12 }), text(170, 122, 'plasmid', { size: 11 }),
  ]),
  density: draw(380, 220, 'Results of density-gradient centrifugation of bacterial DNA. Generation 0, grown in heavy nitrogen: one band low in the tube. Generation 1, after one round of replication in light nitrogen: one band at an intermediate position. Generation 2: one band at the intermediate position and one band higher in the tube at the light position', [
    ...[0, 1, 2].flatMap(i => [['path', `M${70 + i * 110} 30 V170 Q${70 + i * 110} 190 ${90 + i * 110} 190 Q${110 + i * 110} 190 ${110 + i * 110} 170 V30`], text(90 + i * 110, 212, `Generation ${i}`, { size: 11 })]),
    ['rect', 72, 150, 36, 7, { fill: 'currentColor' }], ['rect', 182, 115, 36, 7, { fill: 'currentColor' }], ['rect', 292, 115, 36, 7, { fill: 'currentColor' }], ['rect', 292, 80, 36, 7, { fill: 'currentColor' }],
    ...[[84, 'light'], [119, 'hybrid'], [154, 'heavy']].flatMap(([y, s]) => [['line', 18, y, 58, y, { dash: true }], text(16, y - 5, s, { anchor: 'start', size: 10 })]),
  ]),
  beaks: graph({ x: [6, 14], y: [0, 40], xstep: 1, ystep: 10, xlabel: '', ylabel: '', xtitle: 'Beak depth (mm)', ytitle: 'Number of birds', w: 370,
    curves: [{ fn: bell(9, 0.9, 36), from: 6, to: 14 }, { fn: bell(10.2, 0.85, 14), from: 6, to: 14, color: PINK }], notes: [{ x: 6.3, y: 30, text: 'before drought' }, { x: 11.4, y: 12, text: 'survivors' }],
    alt: 'Graph of number of birds versus beak depth. Before the drought the distribution is centered near 9 millimeters with a peak of 36 birds. The survivors of the drought form a smaller distribution centered near 10.2 millimeters' }),
  genotypes: table(['Genotype', 'AA', 'Aa', 'aa', 'Total'], [['Number of individuals observed', '280', '240', '480', '1,000']], 'Table of observed genotypes in a population of 1,000: 280 AA, 240 Aa, and 480 aa'),
  tree: draw(360, 230, 'Phylogenetic tree with a root at the left and five species, A through E, at the right. Species A branches off first. Next, the lineage splits into a branch leading to species B and a branch that later splits again: one side leads to species C, and the other splits into species D and E. A mark labeled trait 1 lies on the branch shared by B, C, D, and E; a mark labeled trait 2 lies on the branch shared by only D and E', [
    ['line', 20, 120, 60, 120], ['line', 60, 30, 60, 152], ['line', 60, 30, 320, 30], ['line', 60, 152, 130, 152], ['line', 130, 80, 130, 184], ['line', 130, 80, 320, 80], ['line', 130, 184, 200, 184],
    ['line', 200, 130, 200, 205], ['line', 200, 130, 320, 130], ['line', 200, 205, 260, 205], ['line', 260, 180, 260, 222], ['line', 260, 180, 320, 180], ['line', 260, 222, 320, 222],
    ...['A', 'B', 'C', 'D', 'E'].map((s, i) => text(334, [34, 84, 134, 184, 226][i], s, { bold: true })),
    ['line', 95, 144, 95, 160, { color: PINK, width: 3 }], text(95, 174, 'trait 1', { size: 10 }), ['line', 230, 197, 230, 213, { color: PINK, width: 3 }], text(230, 196 - 6, 'trait 2', { size: 10 }),
  ]),
  drift: graph({ x: [0, 50], y: [0, 1], xstep: 10, ystep: 0.2, xlabel: '', ylabel: '', xtitle: 'Generation', ytitle: 'Frequency of allele B', w: 370,
    curves: [{ pts: [[0, .5], [5, .58], [10, .47], [15, .62], [20, .71], [25, .66], [30, .82], [35, .9], [40, 1], [50, 1]], color: PINK }, { pts: [[0, .5], [5, .41], [10, .36], [15, .22], [20, .27], [25, .12], [30, .05], [35, 0], [50, 0]], color: AMBER },
      { pts: [[0, .5], [5, .51], [10, .49], [15, .5], [20, .52], [25, .5], [30, .49], [35, .51], [40, .5], [45, .49], [50, .5]] }],
    notes: [{ x: 41, y: 0.9, text: 'N = 20' }, { x: 38, y: 0.08, text: 'N = 20' }, { x: 36, y: 0.58, text: 'N = 2,000' }],
    alt: 'Graph of the frequency of allele B over 50 generations in three populations that all start at 0.5. In one population of 20 the allele reaches a frequency of 1 by generation 40. In another population of 20 it reaches 0 by generation 35. In a population of 2,000 it stays close to 0.5' }),
  resistance: graph({ x: [0, 10], y: [0, 100], xstep: 2, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Days of growth with antibiotic', ytitle: 'Resistant bacteria (% of population)', w: 370,
    curves: [{ fn: d => 100 * sigmoid(4, 1.3)(d), from: 0, to: 10 }],
    alt: 'Graph of the percent of bacteria that are resistant over 10 days of growth with an antibiotic: near 1 percent at day 0, about 50 percent at day 4, and close to 100 percent by day 8' }),
  cytochrome: table(['Organism compared with humans', 'Chimpanzee', 'Rhesus monkey', 'Dog', 'Chicken', 'Yeast'], [['Amino acid differences in cytochrome c', '0', '1', '11', '13', '45']], 'Table of amino acid differences in cytochrome c compared with humans: chimpanzee 0, rhesus monkey 1, dog 11, chicken 13, yeast 45'),
  logistic: graph({ x: [0, 20], y: [0, 600], xstep: 4, ystep: 100, xlabel: '', ylabel: '', xtitle: 'Time (weeks)', ytitle: 'Number of individuals', w: 370,
    curves: [{ fn: t => 500 / (1 + 49 * Math.exp(-0.7 * t)), from: 0, to: 20 }],
    alt: 'Population growth curve: the population starts near 10, increases slowly, then rapidly, passing 250 at about week 5.5, and levels off at about 500 individuals after week 12' }),
  survivorship: graph({ x: [0, 100], y: [0, 3], xstep: 20, xlabel: '', ylabel: '', xtitle: 'Percent of maximum life span', ytitle: 'Survivors per 1,000 born (log₁₀ scale)', w: 370,
    curves: [{ fn: x => 3 - 3 * Math.pow(x / 100, 6), from: 0, to: 100 }, { fn: x => 3 - 0.03 * x, from: 0, to: 100, color: PINK }, { fn: x => 2.75 * Math.exp(-x / 9) + 0.25 * (1 - x / 100), from: 0, to: 100, color: AMBER }],
    notes: [{ x: 62, y: 2.85, text: 'Species 1' }, { x: 52, y: 1.75, text: 'Species 2' }, { x: 22, y: 0.5, text: 'Species 3' }],
    alt: 'Survivorship curves on a logarithmic scale. Species 1 has high survival until late in life, then drops steeply. Species 2 declines at a constant rate. Species 3 drops steeply early in life, and the few survivors then decline slowly' }),
  foodweb: draw(380, 230, 'Food web with arrows pointing from the organism eaten to the organism that eats it. Grass is eaten by grasshoppers and rabbits. Grasshoppers are eaten by frogs. Frogs are eaten by snakes. Rabbits are eaten by snakes and hawks. Snakes are eaten by hawks', [
    text(190, 216, 'Grass', { bold: true }), text(90, 160, 'Grasshopper', { bold: true }), text(290, 160, 'Rabbit', { bold: true }), text(70, 100, 'Frog', { bold: true }), text(190, 70, 'Snake', { bold: true }), text(300, 26, 'Hawk', { bold: true }),
    ['arrow', 170, 204, 110, 168], ['arrow', 210, 204, 276, 168], ['arrow', 86, 146, 74, 110], ['arrow', 88, 92, 164, 72], ['arrow', 274, 148, 212, 78], ['arrow', 294, 146, 300, 36], ['arrow', 212, 60, 280, 30],
  ]),
  energy: table(['Trophic level', 'Energy stored in biomass (kJ/m² per year)'], [['Producers', '20,000'], ['Primary consumers', '2,000'], ['Secondary consumers', '240'], ['Tertiary consumers', '24']], 'Table of energy stored in biomass per square meter per year: producers 20,000 kilojoules, primary consumers 2,000, secondary consumers 240, tertiary consumers 24'),
  cycles: graph({ x: [0, 40], y: [0, 100], xstep: 10, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Time (years)', ytitle: 'Population size (thousands)', w: 370,
    curves: [{ fn: t => 50 + 40 * Math.sin(2 * Math.PI * t / 10), from: 0, to: 40 }, { fn: t => 22 + 16 * Math.sin(2 * Math.PI * (t - 2) / 10), from: 0, to: 40, color: PINK }], notes: [{ x: 13.5, y: 94, text: 'hares' }, { x: 15.5, y: 42, text: 'lynx' }],
    alt: 'Graph of two populations over 40 years. The hare population cycles between about 10 and 90 thousand with a 10-year period. The lynx population cycles between about 6 and 38 thousand with the same period, and each lynx peak comes about two years after a hare peak' }),
  communities: table(['Tree species', 'Community 1', 'Community 2'], [['Oak', '25', '85'], ['Maple', '25', '5'], ['Birch', '25', '5'], ['Pine', '25', '5']], 'Table of the number of trees of four species in two communities. Community 1: 25 oak, 25 maple, 25 birch, 25 pine. Community 2: 85 oak, 5 maple, 5 birch, 5 pine'),
  errorBars: draw(380, 250, 'Bar chart of mean plant height with error bars of plus or minus two standard errors of the mean. Control: 12 centimeters, error bar from 11 to 13. Low nitrogen: 13 centimeters, error bar from 11.5 to 14.5. High nitrogen: 19 centimeters, error bar from 17.8 to 20.2', (() => {
    const y = v => 210 - v * 8, items = [text(8, 16, 'Mean plant height (cm); error bars are ±2 SEM', { anchor: 'start', size: 11 })];
    for (let v = 0; v <= 20; v += 5) items.push(['line', 50, y(v), 360, y(v), { width: v ? 0.6 : 1.8 }], text(42, y(v) + 4, String(v), { anchor: 'end', size: 11 }));
    [['Control', 12, 1], ['Low nitrogen', 13, 1.5], ['High nitrogen', 19, 1.2]].forEach(([name, mean, err], i) => {
      const x = 90 + i * 95;
      items.push(['rect', x, y(mean), 54, mean * 8, { fill: BLUE, color: BLUE }], ['line', x + 27, y(mean + err), x + 27, y(mean - err), { width: 2 }], ['line', x + 19, y(mean + err), x + 35, y(mean + err), { width: 2 }], ['line', x + 19, y(mean - err), x + 35, y(mean - err), { width: 2 }], text(x + 27, 228, name, { size: 11 }));
    });
    return items;
  })()),
};

const source = String.raw`
@ 1 | - | Properties of water
In a narrow glass tube, water rises several centimeters above the level of the surrounding water. A student adds a compound that disrupts hydrogen bonds between water molecules and repeats the procedure. Which prediction is best supported?
* The water rises less, because cohesion between water molecules is reduced.
- The water rises higher, because the water molecules are freer to move.
- The water rises to the same height, because adhesion to glass does not involve water.
- The water does not enter the tube, because water is no longer polar.
= Capillary rise depends on adhesion of water to the glass and on cohesion, which pulls neighboring water molecules along. Both result from hydrogen bonding, so disrupting hydrogen bonds reduces the height of the column. The same forces move water through the xylem of plants.

@ 1 | - | Dehydration synthesis
A plant cell builds an unbranched polysaccharide from 100 glucose monomers. Which statement about the process is correct?
* 99 molecules of water are released as 99 glycosidic bonds form.
- 100 molecules of water are consumed as 100 glycosidic bonds form.
- 99 molecules of water are consumed as 99 glycosidic bonds form.
- 100 molecules of water are released as 100 glycosidic bonds form.
= Monomers are joined by dehydration synthesis, which releases one water molecule for each bond formed. Linking 100 monomers end to end requires 99 bonds. Hydrolysis, the reverse process, consumes water.

@ 1 | - | Protein structure
A mutation replaces a valine, which has a nonpolar side chain, with glutamate, which has a negatively charged side chain. The amino acid lies in the interior of a soluble, globular enzyme. The enzyme loses its activity. Which explanation is most likely?
* The charged side chain disrupts the hydrophobic interactions that stabilize the folded interior, altering the tertiary structure.
- The substitution breaks the peptide bonds on either side of the amino acid, shortening the polypeptide.
- The substitution prevents hydrogen bonds between backbone atoms, eliminating all secondary structure.
- The charged side chain changes the sequence of every amino acid that follows it.
= Nonpolar side chains cluster in the interior of a soluble protein, away from water. A charged group there is energetically unfavorable and distorts the three-dimensional fold, which can reshape the active site. A substitution changes one amino acid; it does not break peptide bonds or shift the rest of the sequence.

@ 1 | - | Nucleic acid structure | bases
The table shows the nucleotide composition of the genomes of three viruses. Which claim about the genomes is best supported by the data?
* Virus 1 may be double-stranded DNA, virus 2 is single-stranded DNA, and virus 3 is RNA.
- Viruses 1 and 2 are both double-stranded DNA, and virus 3 is RNA.
- Virus 1 is single-stranded DNA, virus 2 is double-stranded DNA, and virus 3 is RNA.
- All three are double-stranded, because each contains four different bases.
= In double-stranded DNA, base pairing makes the amounts of A and T equal and the amounts of G and C equal, as in virus 1. In virus 2 they are unequal, so its DNA cannot be fully base-paired. Virus 3 contains uracil and no thymine, which identifies RNA.

@ 1 | - | Lipids and membranes | lipids
Researchers measured the fatty acids in membrane phospholipids from two populations of the same fish species, as shown. Which statement best explains the difference?
* Unsaturated fatty acids have kinks that prevent tight packing, which keeps membranes fluid at low temperatures.
- Unsaturated fatty acids pack tightly, which keeps membranes from freezing at low temperatures.
- Saturated fatty acids contain more energy, which fish in cold water need to stay warm.
- Unsaturated fatty acids are polar, which makes membranes more permeable to water in cold conditions.
= Double bonds introduce bends in fatty acid tails, so the phospholipids cannot pack closely and the membrane stays fluid when it is cold. Fish in warm water have more saturated tails, which pack tightly and keep the membrane from becoming too fluid.

@ 1 | - | Carbohydrates
Starch and cellulose are both polymers of glucose, yet humans can digest starch and cannot digest cellulose. Which statement best explains this?
* The glucose monomers are joined by differently oriented glycosidic linkages, and human enzymes fit only the linkage found in starch.
- Cellulose contains a different monosaccharide that human cells cannot use.
- Cellulose molecules are too large to enter the active site of any enzyme.
- Starch is held together by hydrogen bonds, which are easier to break than the covalent bonds of cellulose.
= Starch has α-glycosidic linkages and cellulose has β-glycosidic linkages, which give the polymers different shapes. Enzyme active sites are specific to the shape of their substrate, and humans produce no enzyme that hydrolyzes the β linkage.

@ 1 | - | Elements of life
Scientists grow bacteria in a medium in which the only source of phosphorus is radioactive. After several generations, in which molecules of the bacteria will most of the radioactivity be found?
* Nucleic acids and phospholipids
- Proteins and nucleic acids
- Proteins and polysaccharides
- Polysaccharides and phospholipids
= Phosphorus is part of the sugar-phosphate backbone of DNA and RNA and of the phosphate head of phospholipids. Amino acids contain nitrogen and sometimes sulfur but no phosphorus, and polysaccharides contain only carbon, hydrogen, and oxygen.

@ 1 | - | Nucleic acid directionality
A modified nucleotide that lacks the hydroxyl group on its 3′ carbon is added to a DNA synthesis reaction along with normal nucleotides. Whenever DNA polymerase adds the modified nucleotide to a growing strand, synthesis of that strand stops. Why?
* The next nucleotide is attached to the 3′ hydroxyl of the strand, so without it no further phosphodiester bond can form.
- The modified nucleotide cannot form hydrogen bonds with the template strand.
- DNA polymerase adds nucleotides to the 5′ end of the strand, which the modified nucleotide blocks.
- The modified nucleotide unwinds the double helix ahead of the polymerase.
= DNA polymerase extends a strand only at its 3′ end, linking the 3′ hydroxyl of the last nucleotide to the phosphate of the incoming one. A nucleotide with no 3′ hydroxyl can be added but cannot be built upon. This is the basis of chain-termination DNA sequencing.

@ 1 | - | Protein structure
A transport protein spans the plasma membrane. Which prediction about the amino acids in the region of the protein that contacts the fatty acid tails of the membrane is best supported?
* Most have nonpolar side chains, which interact favorably with the hydrophobic interior of the bilayer.
- Most have charged side chains, which form ionic bonds with the fatty acid tails.
- Most have polar side chains, which form hydrogen bonds with the fatty acid tails.
- They are the same amino acids found in the parts of the protein exposed to water.
= The interior of a phospholipid bilayer is nonpolar, so the membrane-spanning region of a protein is rich in hydrophobic amino acids. Polar and charged amino acids are concentrated in the regions exposed to the cytosol or the extracellular fluid, or lining a water-filled channel.

@ 1 | - | DNA structure | melt
The graph shows how two samples of double-stranded DNA of equal length separate into single strands as they are heated. Which claim is best supported by the data?
* Sample 2 has a higher proportion of G–C base pairs, which are held together by three hydrogen bonds instead of two.
- Sample 1 has a higher proportion of G–C base pairs, which separate more easily than A–T base pairs.
- Sample 2 has more covalent bonds between its two strands.
- Sample 1 is single-stranded at all temperatures.
= The two strands of DNA are held together by hydrogen bonds between bases. A G–C pair has three hydrogen bonds and an A–T pair has two, so DNA rich in G–C pairs needs more thermal energy to separate. Sample 2 denatures at a higher temperature.

@ 1 | - | Properties of water
In winter, a layer of ice forms on the surface of a pond while fish survive in the liquid water beneath it. Which property of water makes this possible?
* Hydrogen bonds hold the molecules of ice in an open lattice, so ice is less dense than liquid water.
- Ice has a higher specific heat than liquid water, so it absorbs heat from the fish.
- Water molecules in ice are packed more closely than in liquid water, so ice seals the surface.
- Hydrogen bonds break when water freezes, so ice floats on the denser water below.
= As water freezes, each molecule forms stable hydrogen bonds with four neighbors, holding the molecules farther apart than in the liquid. The less dense ice floats and insulates the water below. Freezing forms hydrogen bonds; it does not break them.

@ 1 | - | Protein folding
A purified enzyme is treated with a chemical that disrupts hydrogen bonds and other weak interactions, and it loses its activity. When the chemical is removed, the enzyme regains its original shape and activity without any other molecules being added. Which conclusion is best supported?
* The amino acid sequence of the polypeptide contains the information needed to determine its three-dimensional shape.
- The chemical broke the peptide bonds, which re-formed when it was removed.
- The enzyme's shape is determined by the ribosome that synthesized it.
- Denaturation changes the primary structure of a protein, and the change is always reversible.
= Denaturation disrupts the weak interactions that maintain secondary and tertiary structure but leaves the covalent peptide bonds, and so the sequence, intact. Because the protein refolds on its own, the sequence must be sufficient to specify the fold. Many proteins do not refold so readily.

@ 1 | - | Protein structure
Which interactions are most directly responsible for maintaining an α helix in a polypeptide?
* Hydrogen bonds between the carbonyl oxygen and the amino hydrogen of different amino acids in the backbone
- Hydrophobic interactions between nonpolar side chains
- Covalent disulfide bonds between cysteine side chains
- Ionic bonds between positively and negatively charged side chains
= Secondary structures such as the α helix and the β pleated sheet are held together by hydrogen bonds between atoms of the polypeptide backbone. Interactions between side chains produce tertiary structure.

@ 2 | - | Cell size | saRatio
The table describes three model cells. Which statement best explains why cell Z would exchange materials with its environment less efficiently than cell X?
* Cell Z has less membrane surface for each unit of volume that must be supplied.
- Cell Z has a smaller total surface area than cell X.
- Cell Z has a greater surface area to volume ratio than cell X.
- Cell Z has less volume for each unit of membrane surface.
= As a cell grows, its volume increases faster than its surface area, so the ratio of surface area to volume falls. The volume sets the demand for nutrients and the production of wastes, while the surface area limits the rate of exchange, so a large cell is supplied less efficiently.

@ 2 | - | Osmosis and water potential | potato
Potato cores were weighed, placed in sucrose solutions for 24 hours, and weighed again. Based on the data in the table, which is the best estimate of the solute concentration of the potato cells?
* About 0.4 M
- About 0.0 M
- About 0.2 M
- About 0.8 M
= The cores neither gain nor lose water when the water potential of the solution equals that of the cells. The change in mass crosses zero just below 0.4 M sucrose, so the cells have a solute concentration close to that value. In more dilute solutions the cores gain water, and in more concentrated ones they lose it.

@ 2 | - | Osmosis and water potential | potato
The data in the table were collected at 22°C (295 K) in open beakers. The solute potential of a solution is \(\Psi_s=-iCRT\), where \(i=1\) for sucrose and \(R=0.0831\) liter·bar/(mole·K). Which is the best estimate of the water potential of the potato cells?
* \(-9.8\) bars
- \(-4.9\) bars
- \(0\) bars
- \(+9.8\) bars
= The cores are in equilibrium with a solution of about 0.4 M. For that solution in an open beaker the pressure potential is zero, so its water potential equals its solute potential: \(-(1)(0.4)(0.0831)(295)\approx -9.8\) bars. At equilibrium the cells have the same water potential.

@ 2 | - | Membrane transport | membrane
The diagram shows a solute crossing a plasma membrane. The cell is then treated with a poison that stops ATP production, and the solute continues to enter the cell at the same rate. Which conclusion is best supported?
* The solute enters by facilitated diffusion, moving down its concentration gradient through a protein.
- The solute enters by active transport, because a membrane protein is required.
- The solute enters by simple diffusion through the phospholipid bilayer.
- The solute enters by endocytosis, because it is too large to cross the membrane.
= The solute moves from higher to lower concentration through a channel protein, and its movement does not depend on ATP, which defines facilitated diffusion. Needing a protein does not make transport active; active transport moves a substance against its gradient and requires an energy source.

@ 2 | - | Osmosis | utube
A membrane permeable to water but not to sucrose separates two solutions, as shown. Which prediction about the system is correct?
* Water moves from side A to side B, and the liquid level rises on side B.
- Water moves from side B to side A, and the liquid level rises on side A.
- Sucrose moves from side B to side A until the concentrations are equal.
- There is no net movement, because the liquid levels start out equal.
= Water moves by osmosis from the region of higher water potential (the more dilute solution, side A) to the region of lower water potential (side B). Sucrose cannot cross this membrane. The level on side B rises until the pressure it creates balances the difference in solute potential.

@ 2 | - | Endomembrane system | pulse
Pancreatic cells were briefly supplied with radioactively labeled amino acids, and the location of the label was then tracked, as shown. Which claim is best supported by the data?
* Proteins destined for secretion are made at the rough ER, modified and sorted in the Golgi, and carried to the membrane in vesicles.
- Proteins destined for secretion are made in the Golgi and stored in the rough ER.
- Amino acids move through the cell by diffusion and leave through channel proteins.
- Proteins are made in vesicles at the plasma membrane and move inward to the rough ER.
= The label appears first where the polypeptides are synthesized, on ribosomes bound to the rough ER, then in the Golgi apparatus, then in vesicles that fuse with the plasma membrane and release their contents by exocytosis. The order of appearance gives the direction of the pathway.

@ 2 | - | Origin of organelles
Certain antibiotics kill bacteria by binding to bacterial ribosomes. At high doses, some of these antibiotics also interfere with protein synthesis inside the mitochondria of human cells, but not with protein synthesis in the cytosol. Which statement best explains this observation?
* Mitochondria descended from free-living prokaryotes and retain ribosomes similar to those of bacteria.
- Mitochondria import all of their ribosomes from the cytosol.
- The antibiotics cannot cross the plasma membrane of human cells.
- Mitochondrial ribosomes are larger than cytosolic ribosomes, so they bind more antibiotic.
= The endosymbiotic theory holds that mitochondria and chloroplasts originated as engulfed prokaryotes. They still have their own circular DNA, a double membrane, and prokaryote-like ribosomes, which is why drugs aimed at bacterial ribosomes can affect them.

@ 2 | - | Lysosomes
In an inherited disorder, a particular lipid accumulates inside the cells of the nervous system until the cells stop functioning. The cells make the lipid at a normal rate. A defect in which structure is the most likely cause?
* Lysosomes, which lack a functional enzyme needed to break down the lipid
- The smooth ER, which is making too much of the lipid
- Ribosomes, which cannot translate any mRNA
- The Golgi apparatus, which cannot package any proteins
= Lysosomes contain hydrolytic enzymes that digest macromolecules and worn-out cell parts. If one of those enzymes is missing or defective, its substrate accumulates. Because synthesis is normal, the problem lies in breakdown; a general failure of ribosomes or the Golgi would be lethal to the cell much earlier.

@ 2 | - | Cell size
The cells of an elephant are about the same size as the cells of a mouse; the elephant simply has many more of them. Which statement best explains why animals do not grow by making their cells larger?
* A larger cell would have too little surface area relative to its volume to exchange materials fast enough.
- A larger cell would contain too many chromosomes to divide.
- Larger cells cannot make enough membrane phospholipids.
- Cells stop growing when they come into contact with other cells.
= The rate at which a cell can take in nutrients and remove wastes depends on its surface area, but its needs depend on its volume. Because the ratio of surface area to volume decreases as a cell enlarges, there is an upper limit on the size of an efficient cell.

@ 2 | - | Active transport
Cells lining the small intestine take up glucose against its concentration gradient using a protein that moves glucose and Na⁺ into the cell together. The Na⁺ gradient is maintained by the Na⁺/K⁺ pump. Which prediction about cells treated with a poison that blocks ATP production is best supported?
* Glucose uptake gradually stops, because the Na⁺ gradient that drives it is no longer maintained.
- Glucose uptake continues indefinitely, because the cotransport protein does not use ATP.
- Glucose uptake stops instantly, because the cotransport protein hydrolyzes ATP directly.
- Glucose uptake increases, because Na⁺ accumulates outside the cell.
= The cotransporter uses the energy of the Na⁺ gradient, not ATP, but that gradient exists only because the Na⁺/K⁺ pump uses ATP to move Na⁺ out. Without ATP the gradient runs down and cotransport stops. This is secondary active transport.

@ 2 | - | Organelle structure and function
Mitochondria in heart muscle cells have a much more extensively folded inner membrane than mitochondria in skin cells. Which statement best explains the advantage of this difference?
* More inner membrane holds more electron transport chains and ATP synthase, increasing the capacity to produce ATP.
- More folds increase the volume of the matrix, allowing more glycolysis.
- More inner membrane makes the mitochondrion more permeable to protons.
- More folds allow the mitochondrion to store more glucose.
= The proteins of the electron transport chain and ATP synthase are embedded in the inner mitochondrial membrane. Folding the membrane into cristae increases its area, so cells with high energy demands can make more ATP. Glycolysis occurs in the cytosol, and a leaky membrane would reduce ATP production.

@ 2 | - | Osmosis and cell walls
A red blood cell and a plant cell are each placed in distilled water. The red blood cell swells and bursts; the plant cell swells but does not burst. Which statement best explains the difference?
* The plant cell wall exerts pressure on the cell contents, raising the cell's water potential until net water movement stops.
- The plant cell membrane is impermeable to water.
- The plant cell has a lower solute concentration than distilled water.
- The plant cell actively pumps water out as fast as it enters.
= Water enters both cells because their contents have a lower water potential than pure water. In the plant cell the rigid wall resists expansion, and the resulting pressure potential increases until the cell's water potential equals that of the surroundings. An animal cell has no wall to generate that pressure.

@ 2 | - | Membrane proteins | aquaporin
Frog egg cells normally have very few water channels. Researchers injected some egg cells with mRNA for protein X, placed all the cells in a hypotonic solution, and measured cell volume, as shown. Which claim is best supported by the data?
* Protein X increases the permeability of the membrane to water.
- Protein X pumps water into the cell using ATP.
- Protein X increases the solute concentration of the cytoplasm.
- Protein X prevents water from leaving the cell.
= Both groups of cells have the same water potential gradient, so the difference in swelling reflects how easily water crosses the membrane. Cells that made protein X swelled far faster, as expected if protein X forms a channel for water. This is how aquaporins were identified.

@ 3 | - | Enzyme activity | enzymePH
The graph shows the activity of two digestive enzymes. Enzyme A is secreted in the stomach, where the pH is about 2, and then moves with food into the small intestine, where the pH is about 8. What happens to enzyme A in the small intestine?
* Its activity falls to nearly zero, because the change in pH alters the charges on amino acid side chains and the shape of the active site.
- Its activity increases, because enzymes work faster at higher pH.
- Its activity is unchanged, because the pH does not affect the amino acid sequence.
- It begins to catalyze the reaction of enzyme B, because both are digestive enzymes.
= Each enzyme has an optimum pH. Away from the optimum, the charges on acidic and basic side chains change, which disrupts the interactions that maintain the active site. The primary structure is unchanged, but the three-dimensional shape is not.

@ 3 | - | Enzyme activity | enzymePH
Based on the graph, a solution containing both enzymes and both of their substrates is adjusted to pH 5. Which prediction is best supported?
* Both reactions proceed very slowly.
- Both reactions proceed at about half their maximum rates.
- Only the reaction catalyzed by enzyme A proceeds.
- Both reactions proceed at their maximum rates, because pH 5 is between the two optima.
= At pH 5 both curves are close to zero: enzyme A has lost nearly all activity by pH 5, and enzyme B has not yet gained activity. A pH midway between two optima is not a compromise that suits both enzymes.

@ 3 | - | Enzyme activity | enzymeTemp
The graph shows the rate of an enzyme-catalyzed reaction at different temperatures. Which statement best explains the shape of the curve?
* From 0°C to 40°C more frequent collisions increase the rate; above 40°C the enzyme denatures.
- From 0°C to 40°C the enzyme is denatured; above 40°C it regains its shape.
- From 0°C to 40°C the substrate is used up; above 40°C more substrate forms.
- Above 40°C the reaction no longer needs a catalyst, so the enzyme stops working.
= Raising the temperature increases molecular motion, so enzyme and substrate collide more often and with more energy. Beyond the optimum, the added thermal energy disrupts the weak bonds that hold the enzyme in its functional shape, and the rate falls sharply.

@ 3 | - | Enzyme inhibition | inhibitors
The graph shows the rate of an enzyme-catalyzed reaction with no inhibitor and with each of two inhibitors. Which claim about inhibitor X is best supported by the data?
* It is a competitive inhibitor, because a high substrate concentration overcomes its effect.
- It is a noncompetitive inhibitor, because it lowers the rate at every substrate concentration.
- It permanently denatures the enzyme.
- It binds to the substrate and removes it from solution.
= A competitive inhibitor binds reversibly to the active site, so it and the substrate compete. At a high enough substrate concentration the substrate almost always wins, and the rate approaches the same maximum as without inhibitor.

@ 3 | - | Enzyme inhibition | inhibitors
Based on the graph, which statement best describes how inhibitor Y acts?
* It binds the enzyme at a site other than the active site and changes the enzyme's shape, so adding substrate cannot restore the maximum rate.
- It binds the active site reversibly, so adding substrate restores the maximum rate.
- It increases the activation energy of the uncatalyzed reaction.
- It raises the substrate concentration needed to saturate the enzyme without changing the maximum rate.
= With inhibitor Y the reaction levels off at about half the normal maximum no matter how much substrate is present. That is expected when an inhibitor binds an allosteric site: a fraction of the enzyme molecules are less active, and substrate cannot displace the inhibitor.

@ 3 | - | Photosynthesis | light
The graph shows the rate of photosynthesis of a plant at two concentrations of carbon dioxide. Which statement best explains the data at light intensities above 6 units?
* The rate is limited by the supply of CO₂, not by light.
- The rate is limited by light, not by the supply of CO₂.
- The light is damaging the chlorophyll at both CO₂ concentrations.
- The plant has stopped carrying out the light reactions.
= At high light intensity both curves are flat, so more light does not increase the rate. Raising the CO₂ concentration does increase it, which shows that the availability of CO₂ for the Calvin cycle is the limiting factor. At low light intensities, the two curves rise together because light is limiting.

@ 3 | - | Photosynthetic pigments | absorb
The graph shows the absorption spectrum of chlorophyll a. Plants of one species are grown under lamps that emit only one color of light at equal intensity. Under which light is the rate of photosynthesis expected to be lowest?
* Green light (550 nm)
- Violet-blue light (430 nm)
- Red light (660 nm)
- The rates are equal, because the intensity is the same.
= Only absorbed light can drive the light reactions. Chlorophyll a absorbs violet-blue and red light strongly and absorbs very little green light, most of which is reflected or transmitted. That is also why leaves look green.

@ 3 | - | Light reactions
Scientists supplied algae with water containing the heavy isotope of oxygen, ¹⁸O, and with carbon dioxide containing only ordinary oxygen. The oxygen gas released by the algae contained ¹⁸O. Which conclusion does this result support?
* The oxygen released in photosynthesis comes from the splitting of water in the light reactions.
- The oxygen released in photosynthesis comes from carbon dioxide in the Calvin cycle.
- Water is produced, not consumed, during the light reactions.
- The oxygen in the sugar produced comes from water.
= Photosystem II splits water to replace the electrons it passes to the electron transport chain, releasing O₂ as a by-product. The oxygen atoms of CO₂ end up in sugar and in water, not in the O₂ that is released.

@ 3 | - | Chemiosmosis
The compound DNP makes the inner mitochondrial membrane permeable to protons. Which change is expected in cells treated with DNP?
* ATP production by oxidative phosphorylation decreases, while oxygen consumption continues and more energy is released as heat.
- ATP production increases, because protons reach ATP synthase more quickly.
- Oxygen consumption stops, because the electron transport chain can no longer pump protons.
- Glycolysis stops, because pyruvate can no longer enter the mitochondria.
= ATP synthase is driven by the flow of protons down the gradient built by the electron transport chain. If protons can leak across the membrane, the gradient is dissipated without making ATP. Electron transport and oxygen consumption continue, and the energy of the gradient is released as heat.

@ 3 | - | Cellular respiration | peas
Students measured oxygen consumption by peas in sealed respirometers that contained KOH to absorb carbon dioxide, as shown. Which statement best explains the results?
* Germinating peas carry out cellular respiration at a higher rate than dormant peas, and the rate increases with temperature.
- Dry peas carry out photosynthesis, which replaces the oxygen they consume.
- Germinating peas consume oxygen only because they are absorbing water.
- Temperature affects the volume of the gas but not the rate of respiration.
= Germinating seeds are metabolically active and use oxygen as the final electron acceptor in respiration; dormant seeds respire very slowly. The enzyme-catalyzed reactions of respiration run faster at the higher temperature. The KOH removes CO₂ so that the change in gas volume reflects oxygen use alone.

@ 3 | - | Fermentation
Muscle cells that run short of oxygen convert pyruvate to lactate. What is the benefit of this reaction to the cell?
* It oxidizes NADH to NAD⁺, which allows glycolysis to continue producing ATP.
- It produces additional ATP directly from pyruvate.
- It removes excess oxygen from the cell.
- It allows pyruvate to enter the citric acid cycle without oxygen.
= Glycolysis requires NAD⁺ to accept electrons. Without oxygen the electron transport chain cannot reoxidize NADH, so fermentation transfers the electrons from NADH to pyruvate instead. Fermentation itself yields no ATP; it keeps glycolysis, which yields two ATP per glucose, running.

@ 3 | - | Chemiosmosis
Isolated thylakoids were kept in the dark in a solution at pH 4 until the pH inside them also reached 4. They were then moved, still in the dark, to a solution at pH 8 containing ADP and inorganic phosphate, and they produced ATP. Which conclusion is best supported?
* A proton gradient across the thylakoid membrane is sufficient to drive ATP synthesis.
- Light is required for ATP synthase to function.
- ATP is produced by the Calvin cycle in the dark.
- Electrons from water are required to make ATP.
= The treatment created a higher proton concentration inside the thylakoids than outside without any light or electron flow. Protons moving down that gradient through ATP synthase drove ATP production, which is direct evidence for chemiosmosis.

@ 3 | - | Calvin cycle
A plant carrying out photosynthesis in bright light is suddenly placed in the dark. Which change in the Calvin cycle is expected in the first few seconds?
* 3-phosphoglycerate (PGA) accumulates and RuBP decreases.
- RuBP accumulates and 3-phosphoglycerate (PGA) decreases.
- Both RuBP and 3-phosphoglycerate (PGA) accumulate.
- Neither changes, because the Calvin cycle does not use light.
= The Calvin cycle needs ATP and NADPH from the light reactions to reduce PGA to G3P and to regenerate RuBP. In the dark those supplies stop, but rubisco can keep fixing CO₂ onto the remaining RuBP for a short time, so PGA builds up while RuBP is used and not replaced.

@ 4 | - | Signal transduction | pathway
The diagram shows a signaling pathway. In a mutant cell, kinase 2 cannot be phosphorylated. Which prediction about the mutant cell is best supported?
* The target gene is not turned on even when the ligand is present.
- The target gene is turned on even when the ligand is absent.
- The ligand can no longer bind to the receptor.
- Kinase 1 can no longer be activated by the receptor.
= Each step in the pathway depends on the one before it. Kinase 2 is activated by phosphorylation, so a version that cannot be phosphorylated cannot pass the signal on to the transcription factor. Steps upstream of the block, such as ligand binding and the activation of kinase 1, still occur.

@ 4 | - | Signal transduction | pathway
In the pathway shown, a single ligand molecule binding to its receptor can lead to the production of many molecules of the target gene's product. Which feature of the pathway accounts for this?
* Each activated enzyme in the cascade can activate many molecules of the next component.
- The ligand enters the cell and binds directly to the target gene.
- The receptor is destroyed after it binds one ligand molecule.
- Each kinase can act only once before it is degraded.
= Kinases are enzymes, so one active molecule can phosphorylate many substrate molecules. With several such steps in sequence, the number of activated molecules grows at each one, amplifying the original signal.

@ 4 | - | Signal reception | pathway
The ligand in the pathway shown is a hydrophilic protein. A steroid hormone such as testosterone signals differently. Which statement correctly describes the difference?
* The steroid crosses the plasma membrane and binds a receptor inside the cell, and the hormone–receptor complex acts as a transcription factor.
- The steroid binds a receptor on the cell surface, because it cannot dissolve in the membrane.
- The steroid enters the cell through the same receptor used by the protein ligand.
- The steroid cannot affect gene expression, because it does not use a kinase cascade.
= Steroid hormones are nonpolar lipids, so they diffuse through the phospholipid bilayer and bind intracellular receptors. The complex binds DNA and regulates transcription directly. Hydrophilic ligands cannot cross the membrane and must act through receptors on the cell surface.

@ 4 | - | G protein signaling
A G protein is active while it is bound to GTP and inactivates itself by hydrolyzing the GTP to GDP. A bacterial toxin chemically modifies a G protein in intestinal cells so that it can no longer hydrolyze GTP. Which outcome is expected in the affected cells?
* The pathway remains switched on, so the cellular response continues even after the signal is gone.
- The pathway can never be switched on, so the cells cannot respond to the signal.
- The receptor can no longer bind its ligand.
- The G protein is unable to bind GTP.
= Hydrolysis of GTP is the built-in off switch of a G protein. If the protein cannot hydrolyze GTP, it stays in its active form and keeps stimulating the next component of the pathway. The cholera toxin acts this way, causing intestinal cells to secrete ions and water continuously.

@ 4 | - | Regulation of signaling
Protein phosphatases remove phosphate groups from proteins. A cell is treated with a drug that inhibits the phosphatases acting on a kinase cascade. Which effect is expected?
* The response lasts longer after the signal is removed, because the kinases remain active.
- The response cannot occur, because the kinases can no longer be phosphorylated.
- The response is unchanged, because phosphatases are not part of signaling pathways.
- The receptor is permanently inactivated.
= Kinases in a cascade are switched on by phosphorylation and switched off when phosphatases remove the phosphate groups. Blocking the phosphatases leaves the kinases active after the signal disappears, so the response is prolonged.

@ 4 | - | Feedback and homeostasis | glucose
Two individuals drank the same glucose solution after fasting, and their blood glucose was measured, as shown. Which statement best explains the results for individual 2?
* The negative feedback that normally lowers blood glucose is impaired, for example because too little insulin is made or cells do not respond to it.
- A positive feedback loop is raising blood glucose to a new set point.
- Individual 2 absorbed more glucose from the same drink.
- Individual 2 is releasing too much insulin in response to the glucose.
= Normally a rise in blood glucose triggers the release of insulin, which causes cells to take up glucose and returns the level to its set point, as in individual 1. A level that stays high indicates that this negative feedback loop is not working, as in diabetes.

@ 4 | - | Feedback mechanisms
During childbirth, contractions of the uterus push the baby against the cervix. Stretching of the cervix triggers the release of the hormone oxytocin, which strengthens the contractions. Which term describes this regulation, and why?
* Positive feedback, because the response intensifies the stimulus that caused it
- Negative feedback, because the response opposes the stimulus that caused it
- Negative feedback, because the process ends when the baby is born
- Positive feedback, because the response returns the body to a set point
= In positive feedback the output of a process increases the stimulus, driving the system further from its starting state until an outside event ends the cycle. Negative feedback does the opposite and maintains a variable near a set point.

@ 4 | - | Cell cycle | dna
The graph shows the amount of DNA in a cell over time. During which labeled interval is the cell in the S phase of the cell cycle?
* Interval X
- Interval W
- Interval Y
- Interval Z
= DNA is replicated during the S phase, so the DNA content rises from its original amount to twice that amount. Interval W is G₁, interval Y is G₂ and the early part of mitosis, and the drop in interval Z occurs when the cell divides.

@ 4 | - | Cell cycle | dna
A cell at the start of interval Y in the graph is treated with a drug that prevents spindle microtubules from forming. Which outcome is expected?
* The cell arrests in mitosis with 4 units of DNA, because the chromosomes cannot be separated.
- The cell divides normally, producing two cells with 2 units of DNA each.
- The cell returns to 2 units of DNA without dividing.
- The cell replicates its DNA again, reaching 8 units before dividing.
= Spindle microtubules attach to the kinetochores and pull sister chromatids apart. Without a spindle the chromosomes cannot attach properly, the spindle checkpoint is not satisfied, and the cell stays in mitosis with its replicated DNA.

@ 4 | - | Mitosis | rootTips
Students counted cells in onion root tips grown in water or in chemical Q, as shown. Which statement is best supported by the data?
* The percentage of cells in mitosis is three times as high with chemical Q, which is consistent with cells entering mitosis but being slow to complete it.
- Chemical Q prevents cells from entering mitosis.
- Chemical Q has no effect on the cell cycle, because the same number of cells was counted.
- Chemical Q shortens mitosis, so fewer cells are observed in it.
= The mitotic index is 20 of 200 (10%) in the control and 60 of 200 (30%) in the treated tips. The fraction of cells seen in a phase reflects the fraction of the cycle spent in it, so more cells in mitosis means mitosis is taking longer or is blocked, or cells are entering it more often.

@ 4 | - | Cell cycle checkpoints
The protein p53 halts the cell cycle when DNA is damaged and can trigger apoptosis if the damage cannot be repaired. Many human tumors contain cells in which both copies of the gene for p53 are nonfunctional. Which statement best explains the connection?
* Cells without p53 continue to divide with damaged DNA, so mutations accumulate.
- Cells without p53 cannot replicate their DNA.
- Cells without p53 undergo apoptosis more often.
- p53 normally stimulates cell division, so its loss slows the cell cycle.
= p53 is a tumor suppressor: it enforces a checkpoint that prevents cells from copying damaged DNA. When it is missing, cells that should stop or die keep dividing and pass on additional mutations, some of which promote uncontrolled growth.

@ 4 | - | Regulation of the cell cycle | cyclin
The graph shows the concentration of a cyclin and the activity of MPF, a complex of the cyclin with a cyclin-dependent kinase (Cdk). Cells are engineered to make a form of the cyclin that cannot be degraded. Which outcome is expected?
* The cells enter mitosis but cannot exit it, because MPF remains active.
- The cells never enter mitosis, because MPF cannot form.
- The cells complete mitosis faster than normal.
- The cells stop making the Cdk.
= MPF activity rises as cyclin accumulates and triggers entry into mitosis. Leaving mitosis requires that the cyclin be destroyed so that MPF switches off. A cyclin that cannot be degraded keeps MPF active and holds the cell in mitosis.

@ 4 | - | Cell communication
A species of marine bacteria emits light only when the cells are at high density. Each cell continuously releases a small signaling molecule and has a receptor for it. Which statement best explains how the cells coordinate light production?
* The concentration of the signaling molecule increases with cell density, and above a threshold it activates the genes for light production in all of the cells.
- Each cell produces light only when it touches another cell.
- Cells at low density lack the genes for light production.
- The signaling molecule is used as the energy source for light production.
= In quorum sensing, the concentration of a secreted signal reflects the number of cells present. When enough signal binds the receptors, it changes gene expression across the whole population, so the cells act together only when their numbers are large enough to be effective.

@ 5 | - | Pedigree analysis | pedigree
The pedigree shows the inheritance of a rare disorder; filled symbols represent affected individuals. Which mode of inheritance is most consistent with the pedigree?
* Autosomal recessive
- Autosomal dominant
- X-linked recessive
- X-linked dominant
= Two unaffected parents (I-1 and I-2) have an affected child, so the trait is recessive. The affected child is a daughter of an unaffected father. An X-linked recessive trait in a daughter would require her father to carry the allele on his only X chromosome and be affected, so the gene must be autosomal.

@ 5 | - | Pedigree analysis | pedigree
In the pedigree shown, the disorder is caused by a recessive allele of an autosomal gene. What is the probability that individual II-2 is a carrier of the allele?
* \(\dfrac{2}{3}\)
- \(\dfrac{1}{2}\)
- \(\dfrac{1}{4}\)
- \(\dfrac{3}{4}\)
= Both parents must be heterozygous, so their children are expected in the ratio 1 AA : 2 Aa : 1 aa. Individual II-2 is unaffected, so aa is ruled out. Of the three remaining equally likely outcomes, two are carriers.

@ 5 | - | Chi-square analysis | dihybrid
Students crossed two plants heterozygous for flower color and height and classified the offspring, as shown. They used a chi-square test, \(\chi^2=\sum\dfrac{(O-E)^2}{E}\), to compare the data with a 9 : 3 : 3 : 1 ratio. The critical value for 3 degrees of freedom at \(p=0.05\) is 7.81. Which conclusion is correct?
* \(\chi^2\approx 1.04\); the students fail to reject the hypothesis that the genes assort independently.
- \(\chi^2\approx 1.04\); the students reject the hypothesis that the genes assort independently.
- \(\chi^2\approx 9.5\); the students reject the hypothesis that the genes assort independently.
- \(\chi^2\approx 9.5\); the students fail to reject the hypothesis that the genes assort independently.
= \(\chi^2=\dfrac{4}{90}+\dfrac{9}{30}+\dfrac{9}{30}+\dfrac{4}{10}\approx 1.04\). Because this is less than the critical value of 7.81, the differences between observed and expected numbers can reasonably be attributed to chance, and the null hypothesis is not rejected.

@ 5 | - | Chi-square analysis | dihybrid
For the chi-square test of the data in the table, why are there 3 degrees of freedom?
* There are four phenotype classes, and the number of degrees of freedom is one less than the number of classes.
- There are three phenotypes that differ from the parents.
- Three of the four observed values differ from the expected values.
- There are two genes with two alleles each, minus one.
= Once the total number of offspring is fixed, the counts in three of the four classes determine the count in the fourth, so only three values are free to vary. For a test of goodness of fit, the degrees of freedom equal the number of categories minus one.

@ 5 | - | Linked genes | testcross
A fruit fly heterozygous for body color and wing shape was crossed with a fly homozygous recessive for both traits, with the results shown. Which is the best estimate of the distance between the two genes?
* 19.5 map units
- 9.75 map units
- 39 map units
- 50 map units
= The two rare classes, 98 and 97 flies, are recombinants produced by crossing over between the genes. The recombination frequency is \(\dfrac{195}{1000}=19.5\%\), and one map unit corresponds to a recombination frequency of 1%.

@ 5 | - | Linked genes | testcross
Why do the data in the table differ from the 1 : 1 : 1 : 1 ratio expected for a testcross involving two genes?
* The genes are on the same chromosome, so the parental combinations of alleles are inherited together unless crossing over occurs between them.
- The genes are on different chromosomes and assort independently.
- One of the alleles is lethal when homozygous.
- The two genes interact so that one masks the expression of the other.
= Independent assortment would give four equally frequent classes. Here the two parental combinations make up about 80% of the offspring, which shows the genes are linked. The less frequent classes arise from crossing over between homologous chromosomes during prophase I of meiosis.

@ 5 | - | Nondisjunction
Red-green color blindness is caused by a recessive allele on the X chromosome. A woman who is a carrier and a man with normal color vision have a son who is color-blind and has the sex chromosomes XXY. Assuming no new mutation, in which parent and in which division did nondisjunction occur?
* In the mother, during meiosis II
- In the mother, during meiosis I
- In the father, during meiosis I
- In the father, during meiosis II
= The son must have two X chromosomes carrying the recessive allele, and only the mother has that allele, so both came from her. They are copies of the same chromosome, which fail to separate when sister chromatids do not separate in meiosis II. Nondisjunction in her meiosis I would give the son one X with each allele and normal vision.

@ 5 | - | Probability in genetics
Two individuals with the genotype AaBbCc are crossed. The three genes assort independently, and at each gene the allele written in upper case is completely dominant. What is the probability that an offspring shows the dominant phenotype for gene A, the recessive phenotype for gene B, and is heterozygous for gene C?
* \(\dfrac{3}{32}\)
- \(\dfrac{3}{64}\)
- \(\dfrac{1}{32}\)
- \(\dfrac{9}{64}\)
= Because the genes assort independently, the probabilities multiply: \(\dfrac{3}{4}\) for the dominant phenotype of A, \(\dfrac{1}{4}\) for bb, and \(\dfrac{1}{2}\) for Cc. The product is \(\dfrac{3}{32}\).

@ 5 | - | Sex-linked inheritance
Hemophilia A is caused by a recessive allele on the X chromosome. A woman who is a carrier and a man who does not have hemophilia plan to have a child. What is the probability that the child will be a son with hemophilia?
* \(\dfrac{1}{4}\)
- \(\dfrac{1}{2}\)
- \(\dfrac{1}{8}\)
- \(0\)
= The probability that the child is a son is \(\dfrac{1}{2}\), and the probability that a son inherits the mother's X chromosome with the recessive allele is \(\dfrac{1}{2}\), giving \(\dfrac{1}{4}\). One half is the probability that a son, once it is known the child is a son, is affected.

@ 5 | - | Non-nuclear inheritance
A disorder that affects cells with high energy demands is caused by a mutation in mitochondrial DNA. Which pattern of inheritance is expected?
* All children of an affected mother can inherit the mutation, and no children of an affected father inherit it.
- Half of the children of an affected parent of either sex inherit the mutation.
- Only sons of an affected mother inherit the mutation.
- Only daughters of an affected father inherit the mutation.
= Mitochondria in a zygote come almost entirely from the cytoplasm of the egg, so mitochondrial genes are inherited from the mother by sons and daughters alike. Sperm contribute essentially no mitochondria, so an affected father does not pass on the mutation.

@ 5 | - | Gene interactions
Two Labrador retrievers that are heterozygous at two genes are crossed many times. Their puppies appear in a ratio of 9 black : 3 brown : 4 yellow. Which explanation best accounts for this ratio?
* One gene is epistatic: a homozygous recessive genotype at one gene prevents the pigment specified by the other gene from being deposited.
- The two genes are closely linked on the same chromosome.
- Coat color is controlled by a single gene with incomplete dominance.
- Yellow puppies result from a new mutation in each generation.
= A 9 : 3 : 4 ratio is a modified 9 : 3 : 3 : 1 ratio, which shows two independently assorting genes. The last two classes are combined because dogs homozygous recessive at the gene controlling pigment deposition are yellow regardless of their genotype at the pigment-color gene.

@ 5 | - | Environment and phenotype
Himalayan rabbits have white fur on the body and black fur on the ears, nose, feet, and tail. When a patch of white fur on a rabbit's back is shaved and an ice pack is kept on the area, the fur that grows back is black. Which statement best explains the result?
* The enzyme that makes the pigment is active only at lower temperatures, so the phenotype depends on the environment as well as the genotype.
- The cold causes a mutation in the pigment gene in the skin cells.
- The cells on the rabbit's back have different alleles from the cells of the ears.
- The cold kills the white-fur cells, and black-fur cells migrate into the area.
= Every cell of the rabbit has the same alleles, but the enzyme they encode is temperature sensitive and works only in cooler regions of the body. Cooling the back allows the enzyme to function there. The same genotype can produce different phenotypes in different environments.

@ 6 | - | Regulation of the lac operon | operon
The diagram shows the lac operon of E. coli in the absence of lactose. What happens when lactose becomes available and glucose is absent?
* A molecule derived from lactose binds the repressor, which changes shape and releases the operator, allowing transcription of the genes.
- Lactose binds the operator and blocks RNA polymerase.
- Lactose binds RNA polymerase, allowing it to transcribe through the repressor.
- The repressor binds lactose and then binds the operator more tightly.
= The lac operon is inducible. Allolactose, an isomer of lactose, acts as the inducer by binding the repressor and changing its shape so that it can no longer bind the operator. RNA polymerase can then transcribe the genes for the enzymes that take up and digest lactose.

@ 6 | - | Regulation of the lac operon | operon
A mutation changes the operator of the lac operon shown so that the repressor can no longer bind to it. Which outcome is expected?
* The lac genes are transcribed whether or not lactose is present.
- The lac genes are never transcribed.
- The lac genes are transcribed only when lactose is present.
- The repressor is no longer produced.
= The repressor turns the operon off by binding the operator. If it cannot bind, nothing blocks RNA polymerase, and the genes are expressed continuously, which is called constitutive expression. The cell wastes resources making enzymes when there is no lactose to digest.

@ 6 | - | Mutations | codons
An mRNA has the sequence 5′-AUG UUU UGG CAU GGU-3′. A mutation in the gene changes the third codon from UGG to UGA. Based on the table, what is the effect on the polypeptide?
* Translation stops after the second amino acid, producing a shortened polypeptide.
- Tryptophan is replaced by a different amino acid, and the rest of the polypeptide is unchanged.
- The reading frame shifts, changing every amino acid after the second.
- There is no effect, because the genetic code is redundant.
= UGA is a stop codon, so the ribosome releases the polypeptide after phenylalanine. A substitution that creates a stop codon is a nonsense mutation and usually yields a nonfunctional protein. A substitution does not shift the reading frame; that requires an insertion or deletion.

@ 6 | - | Mutations | codons
An mRNA has the sequence 5′-AUG UUU UGG CAU GGU-3′. A different mutation changes the last codon from GGU to GGC. Based on the table, what is the effect on the polypeptide?
* There is no change in the amino acid sequence.
- Glycine is replaced by another amino acid.
- Translation ends one codon early.
- The polypeptide is one amino acid longer.
= GGU and GGC both code for glycine, so the mutation is silent. Because most amino acids are specified by more than one codon, many changes in the third position of a codon do not alter the protein.

@ 6 | - | Gel electrophoresis | gel
DNA from a crime scene and from three suspects was cut with the same restriction enzymes and separated by gel electrophoresis, as shown. Which conclusion is best supported?
* The DNA from the crime scene is consistent with suspect 2 and excludes suspects 1 and 3.
- The DNA from the crime scene is consistent with suspect 1 only.
- The DNA from the crime scene is consistent with all three suspects, because every lane has three bands.
- No conclusion is possible, because the bands do not match the size marker.
= Fragments of the same length travel the same distance. Only suspect 2 has bands at all three positions found in the crime scene sample. Suspects 1 and 3 each share one band with it, which is expected by chance, but the other bands differ, which excludes them.

@ 6 | - | Gel electrophoresis | gel
In the gel shown, why are the bands farthest from the wells made up of the shortest DNA fragments?
* DNA is negatively charged and moves toward the positive electrode, and shorter fragments pass through the pores of the gel more easily.
- Shorter fragments carry more negative charge per fragment than longer ones.
- DNA is positively charged, and shorter fragments are repelled more strongly by the wells.
- Longer fragments are broken down by the electric current.
= The phosphate groups of DNA give every fragment a negative charge in proportion to its length, so all fragments are pulled toward the positive electrode. The gel acts as a sieve that slows long fragments more than short ones, separating them by size.

@ 6 | - | Bacterial transformation | plasmid
Bacteria that are sensitive to ampicillin are mixed with the plasmid shown and then spread on plates containing nutrient medium with ampicillin. A few colonies grow. Which statement best explains the result?
* Only the cells that took up the plasmid express the resistance gene and survive.
- The ampicillin caused some cells to mutate and become resistant.
- All of the cells took up the plasmid, but only some of them divided.
- The cells that grew broke down the plasmid and used it as a nutrient.
= Transformation is inefficient, so only a small fraction of the cells take up a plasmid. Those cells make the product of the ampR gene, which inactivates ampicillin. The antibiotic selects for the transformed cells; it does not cause them to become resistant.

@ 6 | - | DNA replication | density
Bacteria were grown for many generations in a medium containing heavy nitrogen (¹⁵N) and then moved to a medium containing light nitrogen (¹⁴N). DNA was extracted after each generation and centrifuged, with the results shown. Which model of DNA replication do the results support?
* Semiconservative: each new double helix has one original strand and one new strand.
- Conservative: the original double helix stays intact and an entirely new double helix is made.
- Dispersive: every strand is a mixture of original and new segments.
- Semiconservative, but only for the first generation.
= After one generation all of the DNA is of intermediate density, which rules out the conservative model. After two generations there are two bands, hybrid and light, which rules out the dispersive model, because that model predicts a single band that becomes lighter each generation.

@ 6 | - | Cell differentiation
Nerve cells and liver cells of the same person contain the same genes but produce many different proteins. Which statement best explains how this is possible?
* The two cell types contain different sets of transcription factors, so different genes are transcribed.
- Each cell type loses the genes it does not need during development.
- The two cell types use different genetic codes to translate the same mRNAs.
- Liver cells have more chromosomes than nerve cells.
= With rare exceptions, all somatic cells of an organism have the same genome. Differences among cell types arise from differential gene expression: the particular combination of activators and repressors in a cell determines which genes are transcribed.

@ 6 | - | Epigenetic regulation
In a tumor, the promoter of a gene that normally restrains cell division is found to be heavily methylated, although the DNA sequence of the gene is normal. Which effect of the methylation is most likely?
* Transcription of the gene is reduced, so less of the protein is made.
- The gene is transcribed at a higher rate than normal.
- The amino acid sequence of the protein is altered.
- The gene is deleted from the chromosome.
= Methyl groups added to cytosines in a promoter are associated with tightly packed chromatin and reduced transcription. The gene is silenced even though its sequence is unchanged, which is an epigenetic change. Acetylation of histones has the opposite effect, loosening chromatin.

@ 6 | - | Post-transcriptional regulation
Researchers find that a small RNA molecule, a microRNA, is complementary to part of the mRNA of gene G. In cells that make the microRNA, transcription of gene G is normal, but very little of protein G is present. Which statement best explains the observation?
* The microRNA binds the mRNA of gene G, blocking its translation or marking it for degradation.
- The microRNA binds the promoter of gene G and blocks RNA polymerase.
- The microRNA changes the DNA sequence of gene G.
- The microRNA is translated into a protein that competes with protein G.
= MicroRNAs base-pair with target mRNAs as part of a protein complex that prevents translation or degrades the mRNA. This regulates gene expression after transcription, which fits the observation that the gene is transcribed normally but little protein accumulates.

@ 6 | - | Mutations
Which of the following mutations within the coding region of a gene is most likely to eliminate the function of the protein?
* Deletion of a single nucleotide near the beginning of the coding region
- Deletion of three consecutive nucleotides near the end of the coding region
- Substitution of one nucleotide in the third position of a codon
- Substitution that replaces one nonpolar amino acid with another near the end of the protein
= Deleting one nucleotide shifts the reading frame, so every codon downstream is misread, and a stop codon usually appears early. When this happens near the start of the gene, almost the entire protein is wrong. Deleting three nucleotides removes one amino acid and leaves the rest of the sequence intact.

@ 7 | - | Natural selection | beaks
During a drought on an island, small soft seeds became scarce and mostly large, hard seeds remained. The graph shows the beak depths of a finch population before the drought and of the birds that survived it. Beak depth is heritable. Which statement best describes what happened?
* Directional selection: birds with deeper beaks were more likely to survive, so the average beak depth of the population increased.
- Stabilizing selection: birds with average beaks were more likely to survive.
- Disruptive selection: birds with the shallowest and the deepest beaks were more likely to survive.
- Genetic drift: the survivors were a random sample of the original population.
= The survivors are not a random sample: their distribution is shifted toward deeper beaks, which can crack the large, hard seeds that remained. Selection that favors one extreme of a heritable trait shifts the population mean in that direction in later generations.

@ 7 | - | Natural selection | beaks
A student summarizes the data in the graph by saying, "The finches grew deeper beaks because they needed them to crack the hard seeds." Which statement best corrects the student's claim?
* Individual birds did not change; birds that already had deeper beaks survived and reproduced at a higher rate, changing the makeup of the population.
- The birds changed their beaks through use, and the offspring inherited the change.
- The drought caused mutations for deeper beaks in the birds that needed them.
- All of the birds had the same beak depth before the drought.
= Natural selection acts on heritable variation that already exists. The environment does not produce the traits that are needed; it determines which existing variants leave more offspring. Populations evolve, while the traits of an individual bird stay the same.

@ 7 | - | Hardy-Weinberg equilibrium
In a population that is in Hardy-Weinberg equilibrium, 16% of the individuals show a recessive phenotype. What percentage of the population is heterozygous?
* 48%
- 24%
- 36%
- 84%
= The recessive phenotype has frequency \(q^2=0.16\), so \(q=0.4\) and \(p=0.6\). The frequency of heterozygotes is \(2pq=2(0.6)(0.4)=0.48\). The remaining 36% are homozygous dominant.

@ 7 | - | Hardy-Weinberg equilibrium | genotypes
The table shows the genotypes observed in a population. Which conclusion is best supported?
* The population is not in Hardy-Weinberg equilibrium: there are half as many heterozygotes as expected, which is consistent with nonrandom mating.
- The population is in Hardy-Weinberg equilibrium, because both alleles are still present.
- The population is not in Hardy-Weinberg equilibrium, because the two alleles do not have equal frequencies.
- The population is in Hardy-Weinberg equilibrium, because the genotype frequencies add up to 1.
= The frequency of allele A is \(\dfrac{2(280)+240}{2000}=0.4\), so \(q=0.6\). The expected number of heterozygotes is \(2pq(1000)=480\), but only 240 were observed. A deficit of heterozygotes is typical when individuals mate preferentially with others of the same genotype, as in inbreeding.

@ 7 | - | Phylogenetic trees | tree
Based on the phylogenetic tree shown, which pair of species shares the most recent common ancestor?
* Species D and E
- Species A and B
- Species B and C
- Species C and D
= Relatedness on a tree is read from how recently two lineages diverged. The branch point connecting D and E is the one closest to the tips, so those species share a common ancestor more recently than either does with any other species shown.

@ 7 | - | Phylogenetic trees | tree
The marks on the tree shown indicate where two derived traits evolved. Which species are expected to have trait 1 but not trait 2?
* Species B and C
- Species A and B
- Species D and E
- Species A only
= Trait 1 arose on the branch leading to the common ancestor of B, C, D, and E, so all four inherit it unless it is later lost. Trait 2 arose later, on the branch leading only to D and E. Species A diverged before either trait evolved.

@ 7 | - | Genetic drift | drift
The graph shows the frequency of allele B in three populations in which the allele has no effect on survival or reproduction. Which statement best explains the results?
* Random changes in allele frequency are larger in small populations and can lead to the loss or fixation of an allele.
- Natural selection favors allele B in one small population and acts against it in the other.
- Mutation rates are higher in small populations than in large ones.
- Gene flow among the populations keeps the allele frequency constant in the large population.
= Because the allele is neutral, the changes are due to chance, which is genetic drift. In a small population each generation is a small sample of the previous one, so frequencies fluctuate widely and an allele can be lost or fixed. In a large population sampling error is small.

@ 7 | - | Evolution of resistance | resistance
A culture of bacteria was grown in the presence of an antibiotic, and the percentage of resistant cells was measured, as shown. Which statement best explains the trend?
* A few cells were already resistant, and they survived and reproduced while the susceptible cells died.
- The antibiotic caused the bacteria to mutate in a way that made them resistant.
- Individual bacteria gradually adapted to the antibiotic through repeated exposure.
- The bacteria used the antibiotic as a nutrient, which let them grow faster.
= Resistance alleles arise by random mutation, independent of the antibiotic. The antibiotic acts as a selective agent: susceptible cells die, and the resistant cells make up a growing share of each generation. The antibiotic does not create the variation it selects.

@ 7 | - | Speciation
A river changes course and divides a population of flightless beetles into two groups that can no longer meet. Many generations later the river dries up and the groups come back into contact, but they do not interbreed, because the females of each group respond only to the mating signals of their own males. Which statement best describes what has occurred?
* Allopatric speciation, with a prezygotic barrier that evolved while the populations were separated
- Sympatric speciation, with a postzygotic barrier caused by hybrid sterility
- Gene flow between the groups, which made them more similar
- Convergent evolution of mating signals in the two groups
= Geographic isolation stopped gene flow, so the two populations diverged through mutation, selection, and drift. The difference in mating signals is a behavioral barrier that acts before fertilization. Because the groups no longer exchange genes when in contact, they are separate biological species.

@ 7 | - | Molecular evidence for evolution | cytochrome
Cytochrome c is a protein of the electron transport chain. The table shows the number of amino acid differences between human cytochrome c and that of other organisms. Which claim is best supported by the data?
* Humans share a more recent common ancestor with rhesus monkeys than with dogs.
- Humans evolved from chimpanzees, because the two proteins are identical.
- Yeast do not share a common ancestor with humans.
- Chickens are more closely related to yeast than to humans.
= Differences in a protein's sequence accumulate over time after lineages diverge, so fewer differences indicate more recent common ancestry. All of the organisms have cytochrome c, which is evidence of common ancestry for all of them. Identical proteins show close relationship, not that one living species descended from the other.

@ 7 | - | Convergent evolution
Sharks, which are fish, and dolphins, which are mammals, both have streamlined bodies and fins, although their most recent common ancestor had neither feature. Which statement best explains the similarity?
* Similar selective pressures in similar environments produced similar adaptations independently.
- The two groups inherited the features from their most recent common ancestor.
- Dolphins are more closely related to sharks than to other mammals.
- The features arose through gene flow between sharks and dolphins.
= Structures that perform the same function but evolved independently are analogous, and the process that produces them is convergent evolution. They do not indicate close relationship. Homologous structures, by contrast, are similar because they were inherited from a common ancestor.

@ 7 | - | Maintenance of variation
The allele that causes sickle-cell disease in homozygous individuals is found at a high frequency in regions where malaria is common. Which statement best explains this pattern?
* Heterozygous individuals are more likely to survive malaria than individuals homozygous for the normal allele, which keeps both alleles in the population.
- The allele is dominant, so it spreads quickly through populations.
- Malaria causes the mutation that produces the allele.
- Individuals homozygous for the allele have the highest fitness in regions with malaria.
= Where malaria is common, heterozygotes have the highest fitness: they are protected against severe malaria and do not have sickle-cell disease. This heterozygote advantage is a form of balancing selection that maintains an allele that is harmful in homozygotes.

@ 8 | - | Population growth | logistic
The graph shows the growth of a population of insects in a laboratory container with a fixed supply of food added each week. At approximately what population size is the population growing fastest?
* 250 individuals
- 50 individuals
- 500 individuals
- 600 individuals
= The rate of population growth is the slope of the curve, which is steepest at the midpoint of the rise, about half the carrying capacity. In logistic growth, \(\dfrac{dN}{dt}=r_{\max}N\dfrac{K-N}{K}\) is greatest when \(N=\dfrac{K}{2}\).

@ 8 | - | Population growth | logistic
Which statement best explains why the population shown in the graph levels off at about 500 individuals?
* Density-dependent factors, such as competition for food, lower the birth rate or raise the death rate as the population grows.
- Density-independent factors, such as temperature, increase as the population grows.
- The individuals in the population stop reproducing once they reach maturity.
- The maximum per capita growth rate of the species increases as the population grows.
= The container supports a limited number of individuals, its carrying capacity. As density rises, each individual gets a smaller share of the resources, so births decline or deaths increase until the two balance. Density-independent factors affect a population regardless of its size.

@ 8 | - | Population growth
A population of 100 fish lives in a pond with a carrying capacity of 500 fish. The maximum per capita growth rate is 0.20 per year. According to the logistic growth model, \(\dfrac{dN}{dt}=r_{\max}N\left(\dfrac{K-N}{K}\right)\), what is the current growth rate of the population?
* 16 fish per year
- 20 fish per year
- 80 fish per year
- 4 fish per year
= \(\dfrac{dN}{dt}=(0.20)(100)\left(\dfrac{500-100}{500}\right)=20(0.8)=16\) fish per year. Twenty per year would be the exponential rate, without the term for the carrying capacity.

@ 8 | - | Life history strategies | survivorship
The graph shows survivorship curves for three species. Which description best fits species 3?
* It produces very large numbers of offspring and provides little or no parental care.
- It produces few offspring and invests heavily in the care of each one.
- Individuals have the same chance of dying at every age.
- Most individuals survive to old age and then die within a short period.
= The curve for species 3 drops steeply at first, so most individuals die very young, which is typical of organisms such as oysters and many fish and plants that release huge numbers of offspring with no care. Species 1 shows the opposite pattern, and species 2 has a constant death rate.

@ 8 | - | Food webs | foodweb
In the food web shown, which organism feeds at more than one trophic level?
* The hawk
- The rabbit
- The frog
- The grasshopper
= The hawk is a secondary consumer when it eats rabbits, which eat grass, and a higher-level consumer when it eats snakes. The snake also feeds at two levels. The rabbit and the grasshopper are only primary consumers, and the frog is only a secondary consumer.

@ 8 | - | Food webs | foodweb
A persistent, fat-soluble pollutant is absorbed by the grass in the food web shown. In which organism is the concentration of the pollutant expected to be highest?
* The hawk
- The grass
- The grasshopper
- The frog
= Substances that are stored in fat and not excreted accumulate in an organism's tissues. Each consumer eats many organisms from the level below, so the concentration increases at each step of a food chain, a process called biological magnification. Top predators carry the highest concentrations.

@ 8 | - | Energy flow | energy
Based on the table, what percentage of the energy stored in the biomass of primary consumers is transferred to the biomass of secondary consumers?
* 12%
- 10%
- 1.2%
- 88%
= The efficiency is \(\dfrac{240}{2000}=0.12\), or 12%. The transfer from producers to primary consumers in this ecosystem is 10%.

@ 8 | - | Energy flow | energy
Which statement best explains the pattern in the table?
* At each trophic level, most of the energy organisms take in is used in cellular respiration and lost as heat, or is not consumed or assimilated by the next level.
- Organisms at higher trophic levels are larger and therefore store less energy.
- Energy is recycled from the tertiary consumers back to the producers.
- Producers capture less energy than consumers can use.
= Energy flows through an ecosystem in one direction. Only the energy stored as new biomass at one level is available to the next; the rest is lost as heat from metabolism or passes to decomposers in wastes and uneaten material. This is why food chains rarely have more than four or five levels.

@ 8 | - | Population interactions | cycles
The graph shows the sizes of a hare population and a lynx population over time. Lynx prey on hares. Which statement best explains why each peak in the lynx population follows a peak in the hare population?
* When hares are abundant, more lynx survive and reproduce, and it takes time for those births to raise the lynx population.
- Lynx reproduce only when hares are scarce.
- Hares reproduce more slowly than lynx.
- The lynx population controls the amount of vegetation available to the hares.
= A larger food supply raises the survival and reproduction of the predator, but the predator population responds over a generation, not instantly. As lynx become numerous, predation, along with food shortage for the hares, reduces the hare population, and the lynx then decline in turn.

@ 8 | - | Species diversity | communities
The table shows the trees in two forest communities. Simpson's diversity index is \(1-\sum\left(\dfrac{n}{N}\right)^2\), where \(n\) is the number of individuals of a species and \(N\) is the total. Which statement is correct?
* Community 1 is more diverse: its index is 0.75, compared with about 0.27 for community 2.
- The communities are equally diverse, because each has four species and 100 trees.
- Community 2 is more diverse, because it has more oak trees.
- Community 2 is more diverse: its index is 0.73, compared with 0.25 for community 1.
= For community 1, \(1-4(0.25)^2=0.75\). For community 2, \(1-\left[(0.85)^2+3(0.05)^2\right]=1-0.73=0.27\). The communities have the same species richness, but community 1 has much greater evenness, and diversity depends on both.

@ 8 | - | Keystone species
On a rocky shore, researchers removed all of the sea stars from one area. The sea stars prey mainly on mussels. Over several years the number of species in the area fell from fifteen to eight, and mussels came to cover most of the rock. Which statement best explains the result?
* The sea star is a keystone species whose predation prevents a strong competitor from excluding other species.
- The sea star is the most abundant species in the community.
- Mussels are prey for all of the other species in the community.
- Removing any single species from a community reduces its diversity by half.
= A keystone species has an effect on community structure that is large relative to its abundance. By eating mussels, which are superior competitors for space, the sea star keeps room available for other species. Without it the mussels crowd the others out.

@ 8 | - | Interpreting data | errorBars
Researchers grew plants with no added nitrogen (control), a low dose, or a high dose, and measured their heights, as shown. Which conclusion is best supported by the data?
* The high dose increased growth relative to the control, and the data do not show a significant effect of the low dose.
- Both doses significantly increased growth relative to the control.
- Neither dose had a significant effect, because all three means are different.
- The low dose significantly increased growth, because its mean is higher than the control's.
= Error bars of ±2 SEM approximate 95% confidence intervals for the means. The bars for the control (11 to 13 cm) and the low dose (11.5 to 14.5 cm) overlap, so that difference may be due to chance. The bar for the high dose (17.8 to 20.2 cm) does not overlap the control's, which indicates a significant difference.
`;

module.exports = { source, figures };
