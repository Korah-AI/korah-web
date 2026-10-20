// AP Biology free-response practice: twelve original questions, one full set of six for each of
// the 2025 and 2026 released exams, each modeled on the released question with the same
// number, type, point total, and science practices. Long questions are 9 points; short
// questions are 4.
const { draw } = require('../ap-mcq-build/diagram.cjs');
const { chart } = require('../ap-mcq-build/figures.cjs');
const { pt, part, tableFigure, text, fig } = require('./frq-helpers.cjs');

const BLUE = '#3b82f6', PINK = '#ec4899', AMBER = '#f59e0b';
const SG = year => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-biology.pdf`;
const modeled = (year, n, type) => ({ year, question: n, type, label: `${year} AP Biology Question ${n} (${type})`, url: SG(year) });
const LONG = 'Interpreting and Evaluating Experimental Results', GRAPH = 'Interpreting and Evaluating Experimental Results with Graphing';

// Bar chart of means with ±2 SE error bars. groups: [{ label, mean, err, color }]
function errorBars(alt, ylabel, groups, ymax, ystep, fmt = v => v) {
  const L = 54, B = 186, T = 24, ph = B - T, band = 300 / groups.length, sy = v => B - v / ymax * ph;
  const items = [text(8, 14, ylabel, { anchor: 'start', size: 11 })];
  for (let v = 0; v <= ymax + 1e-9; v += ystep) items.push(['line', L, sy(v), L + 300, sy(v), { width: v ? 0.4 : 1.4, dash: !!v }], text(L - 6, sy(v) + 4, String(fmt(Math.round(v * 100) / 100)), { anchor: 'end', size: 10 }));
  groups.forEach((g, i) => {
    const cx = L + band * (i + 0.5), bw = Math.min(46, band * 0.6);
    items.push(['rect', cx - bw / 2, sy(g.mean), bw, sy(0) - sy(g.mean), { fill: g.color || BLUE, color: g.color || BLUE }]);
    items.push(['line', cx, sy(g.mean + g.err), cx, sy(g.mean - g.err), { width: 1.6 }], ['line', cx - 7, sy(g.mean + g.err), cx + 7, sy(g.mean + g.err), { width: 1.6 }], ['line', cx - 7, sy(g.mean - g.err), cx + 7, sy(g.mean - g.err), { width: 1.6 }]);
    String(g.label).split('\n').forEach((l, k) => items.push(text(cx, B + 15 + k * 13, l, { size: 10.5 })));
  });
  return draw(L + 316, 224, alt, items);
}

const frqs = [];

// ════════════════ Set modeled on the 2025 exam ════════════════

// ── 1. Long: interpreting and evaluating experimental results (2025 Q1) ──
const aqpRows = [['No siRNA', '1.00', '40 ± 4'], ['Scrambled (control) siRNA', '0.98', '39 ± 5'], ['AQP2 siRNA', '0.12', '10 ± 3']];
frqs.push({
  id: 'bio-long-aquaporin', questionNumber: 1, title: 'Silencing an Aquaporin Gene', topic: 'Cell structure and function · Membrane transport and gene expression',
  modeledOn: modeled(2025, 1, LONG), timeAllottedMin: 25,
  prompt: String.raw`Aquaporin-2 (AQP2) is a channel protein in the plasma membrane of kidney collecting-duct cells. Researchers grew cultured collecting-duct cells and treated them in one of three ways: no treatment, a scrambled siRNA with no matching sequence in the cell, or an siRNA complementary to AQP2 mRNA. siRNA molecules bind complementary mRNA and cause it to be degraded. After 48 hours, the researchers measured the amount of AQP2 protein relative to untreated cells and the water permeability of the plasma membrane (Table 1). Values for permeability are mean ± 2 SE.`,
  parts: [
    part('A', 'Describe how water moves across the plasma membrane through aquaporins.', [
      pt('bio-long-aquaporin-a1', 'concept', 'Describes water moving passively (without ATP) through the aquaporin channel, down its water potential (or concentration) gradient, as facilitated diffusion.', ['says aquaporins actively pump water', 'says water moves from low to high water potential'], 'Water diffuses through the aquaporin channel from higher to lower water potential without using ATP.', 'Aquaporins use ATP to pump water into the cell.'),
    ]),
    part('B', '(i) Identify the independent variable in the experiment. (ii) Justify the use of the scrambled siRNA treatment. (iii) State the null hypothesis for the comparison between the scrambled siRNA and AQP2 siRNA treatments.', [
      pt('bio-long-aquaporin-b1', 'experimental-design', 'Identifies the independent variable as the type of siRNA treatment.', ['identifies water permeability, the dependent variable'], 'The siRNA treatment the cells received.', 'Water permeability.'),
      pt('bio-long-aquaporin-b2', 'experimental-design', 'Justifies the scrambled siRNA as a control showing that any effect comes from silencing AQP2, not from the process of introducing an siRNA into the cells.', ['says it is a control without saying what it controls for'], 'It shows that adding an siRNA by itself does not lower permeability, so any decrease must be due to silencing AQP2.', 'It is the control group.'),
      pt('bio-long-aquaporin-b3', 'experimental-design', 'States a null hypothesis of no difference: AQP2 siRNA does not change water permeability compared with scrambled siRNA.', ['states a directional prediction', 'states the alternative hypothesis'], 'There is no difference in water permeability between cells treated with AQP2 siRNA and cells treated with scrambled siRNA.', 'AQP2 siRNA will decrease water permeability.'),
    ], [tableFigure('Table 1', ['Treatment', 'Relative AQP2 protein', 'Water permeability (µm/s)'], aqpRows)]),
    part('C', '(i) Describe the effect of the AQP2 siRNA on water permeability compared with the scrambled siRNA, using data. (ii) Based on the data, determine whether the difference is statistically significant. (iii) The coding region of AQP2 mRNA, from the start codon through the stop codon, is 816 nucleotides long. Calculate the number of amino acids in the AQP2 polypeptide.', [
      pt('bio-long-aquaporin-c1', 'data-analysis', 'Describes a decrease in permeability, from about 39 µm/s with scrambled siRNA to about 10 µm/s with AQP2 siRNA.', ['describes the protein data instead of permeability', 'no numbers'], 'Permeability fell from 39 to 10 µm/s, about a 75% decrease.', 'AQP2 siRNA had an effect.'),
      pt('bio-long-aquaporin-c2', 'data-analysis', 'Concludes the difference is significant because the ±2 SE intervals (34–44 and 7–13 µm/s) do not overlap.', ['claims significance without referencing the intervals'], 'The intervals 34–44 and 7–13 do not overlap, so the difference is statistically significant.', 'It is significant because 10 is much smaller than 39.'),
      pt('bio-long-aquaporin-c3', 'calculation', 'Calculates 271 amino acids (816 ÷ 3 = 272 codons, minus the stop codon).', ['counts the stop codon as an amino acid (272)', 'divides by 2 or 4'], '816 / 3 = 272 codons; the stop codon codes for no amino acid, so 271.', '272 amino acids.'),
    ]),
    part('D', 'A hormone causes collecting-duct cells to insert additional AQP2 proteins into their plasma membranes. (i) Predict how untreated cells exposed to the hormone would swell, compared with untreated cells without the hormone, after being moved to a hypotonic solution. (ii) Justify your prediction.', [
      pt('bio-long-aquaporin-d1', 'argumentation', 'Predicts that the hormone-treated cells swell faster.', ['predicts no change', 'predicts the cells shrink'], 'They swell faster.', 'They swell at the same rate because the solution is the same.'),
      pt('bio-long-aquaporin-d2', 'argumentation', 'Justifies that more aquaporin channels in the membrane allow more water to enter per unit time down the water potential gradient.', ['says the hormone pumps water in'], 'More channels give water more paths into the cell, so more water enters each second.', 'Hormones make cells bigger.'),
    ]),
  ],
  sampleResponse: 'A Water diffuses passively through the aquaporin channel, from higher to lower water potential, without ATP (facilitated diffusion). B (i) The siRNA treatment. (ii) It shows that introducing an siRNA by itself does not lower permeability, so a decrease with AQP2 siRNA is due to silencing AQP2. (iii) There is no difference in water permeability between cells treated with scrambled siRNA and with AQP2 siRNA. C (i) Permeability fell from 39 µm/s to 10 µm/s. (ii) Significant: the ±2 SE ranges 34–44 and 7–13 do not overlap. (iii) 816 / 3 = 272 codons, minus the stop codon = 271 amino acids. D (i) They swell faster. (ii) More AQP2 channels let more water enter per second down its water potential gradient.',
});

// ── 2. Long with graphing (2025 Q2) ──
const alarmRows = [['Wild type', 'Water', '20 ± 6'], ['Wild type', 'Skin extract', '150 ± 18'], ['Receptor knockdown', 'Water', '22 ± 7'], ['Receptor knockdown', 'Skin extract', '35 ± 10']];
frqs.push({
  id: 'bio-graph-alarm-cue', questionNumber: 2, title: 'Fish Alarm Substance and Its Receptor', topic: 'Cell communication · Signal transduction and behavior',
  modeledOn: modeled(2025, 2, GRAPH), timeAllottedMin: 25,
  prompt: 'When the skin of a small fish is damaged, it releases chemicals that cause nearby fish of the same species to stop moving (freeze). Researchers hypothesized that a receptor protein on olfactory neurons, receptor R, detects these chemicals. They used a morpholino to knock down receptor R in one group of fish. Fish were placed individually in tanks, either water or skin extract was added, and the time each fish spent motionless during a 300-second trial was recorded (Table 1). Values are mean ± 2 SE; n = 20 fish per group.',
  parts: [
    part('A', '(i) Describe how binding of a chemical signal to a receptor on the plasma membrane of an olfactory neuron can lead to a response in the cell. (ii) Explain how the freezing response increases the fitness of fish that detect the alarm signal.', [
      pt('bio-graph-alarm-cue-a1', 'concept', 'Describes ligand binding causing a change in the receptor’s shape that activates a signal transduction pathway (such as second messengers or opening ion channels) leading to a cellular response.', ['says the ligand enters the nucleus', 'no mention of a pathway or shape change'], 'Binding changes the receptor’s shape, which starts a cascade of second messengers that opens ion channels and triggers an action potential.', 'The chemical goes into the neuron.'),
      pt('bio-graph-alarm-cue-a2', 'concept', 'Explains that freezing makes a fish less likely to be detected by a nearby predator, increasing its survival and chance of reproducing.', ['says freezing helps the injured fish'], 'Motionless fish are harder for predators to spot, so they are more likely to survive and reproduce.', 'Freezing saves energy.'),
    ]),
    part('B', 'Using the data in Table 1, construct an appropriately labeled graph that represents the mean time motionless for each group, including the error bars.', [
      pt('bio-graph-alarm-cue-b1', 'graphing', 'Constructs a bar graph (discrete groups) with correctly labeled axes, including units for time motionless, and a legend or labels distinguishing the four groups.', ['draws a line graph across categories', 'omits units'], 'A bar graph with “Time motionless (s)” on the y-axis and the four genotype-treatment groups on the x-axis.', 'A line connecting the four means.'),
      pt('bio-graph-alarm-cue-b2', 'graphing', 'Uses an appropriate linear scale and plots all four means correctly.', ['uneven scale', 'misplots a mean'], 'Bars at 20, 150, 22, and 35 s on a 0–200 s scale.', 'A scale that jumps from 50 to 150.'),
      pt('bio-graph-alarm-cue-b3', 'graphing', 'Draws error bars of ±2 SE correctly on all four bars.', ['draws error bars of only +2 SE', 'uses the wrong values'], 'Wild type with extract shows a bar from 132 to 168 s.', 'No error bars.'),
    ], [tableFigure('Table 1', ['Fish', 'Added to tank', 'Time motionless (s)'], alarmRows)]),
    part('C', '(i) Calculate the percent change in mean time motionless for wild-type fish exposed to skin extract compared with wild-type fish exposed to water. (ii) Based on the data, evaluate the researchers’ hypothesis that receptor R detects the alarm chemicals.', [
      pt('bio-graph-alarm-cue-c1', 'calculation', 'Calculates a 650% increase ((150 − 20) / 20 × 100).', ['divides by 150 (87%)', 'reports 130%'], '(150 − 20) / 20 × 100 = 650%.', '(150 − 20) / 150 = 87%.'),
      pt('bio-graph-alarm-cue-c2', 'argumentation', 'Supports the hypothesis, citing that knockdown fish barely respond to skin extract (35 s compared with 150 s for wild type) while responding normally to water (22 vs 20 s).', ['ignores the water controls', 'claims the hypothesis is proven'], 'Supported: without receptor R, skin extract raises freezing only from 22 to 35 s, compared with 20 to 150 s in wild type.', 'Supported because the knockdown fish froze less.'),
    ]),
    part('D', '(i) The researchers repeat the experiment with wild-type fish of a second species that lacks a gene for receptor R. Predict the time motionless when these fish are exposed to skin extract from the first species. (ii) Justify your prediction.', [
      pt('bio-graph-alarm-cue-d1', 'argumentation', 'Predicts little or no freezing, similar to the water control.', ['predicts strong freezing'], 'Close to the water control, about 20 s.', 'About 150 s.'),
      pt('bio-graph-alarm-cue-d2', 'argumentation', 'Justifies that without receptor R the fish cannot detect the alarm chemicals, so the signal transduction pathway leading to freezing is not activated.', ['says the chemicals are toxic to the second species'], 'Without receptor R the chemical cannot bind, so the pathway that triggers freezing never starts.', 'Different species do not care.'),
    ]),
  ],
  sampleResponse: 'A (i) The chemical binds the receptor and changes its shape, which activates a signal transduction cascade (for example, a G protein and second messengers) that opens ion channels and produces an action potential. (ii) Freezing makes fish harder for nearby predators to detect, so they are more likely to survive and reproduce. B A bar graph with four bars (20, 150, 22, and 35 s), y-axis “Time motionless (s)” from 0 to 200, and ±2 SE error bars. C (i) (150 − 20) / 20 × 100 = 650% increase. (ii) Supported: knockdown fish respond to extract only slightly (35 s vs 22 s for water), while wild type increase from 20 to 150 s. D (i) About 20 s, like the water control. (ii) Without receptor R the alarm chemicals cannot bind, so the pathway that causes freezing is never activated.',
});

// ── 3. Short: scientific investigation (2025 Q3) ──
frqs.push({
  id: 'bio-short-zebra-mussels', questionNumber: 3, title: 'Invasive Zebra Mussels and Native Mussels', topic: 'Ecology · Competition and invasive species',
  modeledOn: modeled(2025, 3, 'Scientific Investigation'), timeAllottedMin: 10,
  prompt: 'Zebra mussels are invasive filter feeders that attach in large numbers to the shells of native mussels. Researchers placed native mussels in 12 identical tanks of lake water. In 6 tanks, the native mussels had zebra mussels attached; in the other 6 tanks they did not. After 8 weeks, the researchers measured the change in the native mussels’ tissue mass.',
  parts: [
    part('A', 'Describe one way that zebra mussels could reduce the growth of native mussels.', [
      pt('bio-short-zebra-mussels-a1', 'concept', 'Describes competition for the same food (filtering phytoplankton from the water) or interference by covering the native mussel’s shell and openings.', ['says zebra mussels prey on native mussels'], 'Zebra mussels filter out the phytoplankton that native mussels also eat, leaving less food.', 'Zebra mussels eat the native mussels.'),
    ]),
    part('B', 'Identify the control group in this experiment.', [
      pt('bio-short-zebra-mussels-b1', 'experimental-design', 'Identifies the tanks with native mussels and no zebra mussels attached.', ['identifies the tanks with zebra mussels'], 'The six tanks in which native mussels had no zebra mussels.', 'The tanks with zebra mussels.'),
    ]),
    part('C', 'State the null hypothesis for this experiment.', [
      pt('bio-short-zebra-mussels-c1', 'experimental-design', 'States that attached zebra mussels have no effect on the change in native mussel tissue mass.', ['states a directional prediction'], 'There is no difference in tissue mass change between native mussels with and without zebra mussels.', 'Zebra mussels will reduce native mussel growth.'),
    ]),
    part('D', 'The researchers repeat the experiment with twice as much phytoplankton added to every tank. Predict how the difference in growth between the two groups would change, and justify your prediction.', [
      pt('bio-short-zebra-mussels-d1', 'argumentation', 'Predicts the difference decreases, justified by reduced competition for food when food is more plentiful.', ['predicts a larger difference without reasoning'], 'The difference shrinks, because with more food the zebra mussels take less of what the native mussels need.', 'Both grow more.'),
    ]),
  ],
  sampleResponse: 'A Zebra mussels filter the same phytoplankton native mussels eat, reducing their food. B The six tanks with native mussels and no attached zebra mussels. C There is no difference in tissue mass change between native mussels with and without attached zebra mussels. D The difference decreases; with abundant phytoplankton, competition for food is reduced, so the zebra mussels limit native growth less.',
});

// ── 4. Short: conceptual analysis (2025 Q4) ──
frqs.push({
  id: 'bio-short-pupfish', questionNumber: 4, title: 'Pupfish in Isolated Springs', topic: 'Evolution · Speciation and genetic drift',
  modeledOn: modeled(2025, 4, 'Conceptual Analysis'), timeAllottedMin: 10,
  prompt: 'About 10,000 years ago, a large lake in a desert region dried up, leaving several small, separate springs. Each spring now holds a small population of pupfish descended from the original lake population. The springs differ in temperature and salinity, and fish from different springs now differ in body shape and coloration.',
  parts: [
    part('A', 'Identify the type of reproductive isolation that first separated the pupfish populations.', [
      pt('bio-short-pupfish-a1', 'concept', 'Identifies geographic isolation (allopatric separation).', ['identifies behavioral or temporal isolation'], 'Geographic isolation: the springs are physically separated.', 'Behavioral isolation.'),
    ]),
    part('B', 'Explain why genetic drift is likely to have had a larger effect on allele frequencies in the spring populations than in the original lake population.', [
      pt('bio-short-pupfish-b1', 'concept', 'Explains that the spring populations are small, so random chance events change allele frequencies more (and can fix or eliminate alleles).', ['confuses drift with natural selection'], 'In small populations, chance differences in which fish reproduce shift allele frequencies a lot.', 'The fish adapted to the springs.'),
    ]),
    part('C', 'Explain how natural selection could produce differences in body shape between populations in springs of different temperature.', [
      pt('bio-short-pupfish-c1', 'concept', 'Explains that heritable variations in body shape that improve survival and reproduction in a given spring’s conditions become more common there over generations.', ['says fish change shape because they need to'], 'Fish with a body shape suited to their spring’s temperature survive and reproduce more, so that heritable shape increases in frequency.', 'The fish changed shape to survive the heat.'),
    ]),
    part('D', 'Fish from two springs are brought together in a lab, and their hybrid offspring are much less likely to survive than either parent type. Predict how selection would affect mate preference if the two populations continued to live together, and justify your prediction.', [
      pt('bio-short-pupfish-d1', 'argumentation', 'Predicts that selection favors fish that mate only with their own population (prezygotic barriers strengthen, reinforcement), because those fish do not waste reproduction on low-fitness hybrids.', ['predicts the populations will merge'], 'Fish that prefer mates from their own spring will leave more surviving offspring, so the preference spreads.', 'They will interbreed and become one species.'),
    ]),
  ],
  sampleResponse: 'A Geographic isolation. B The spring populations are small, so random variation in which individuals reproduce shifts allele frequencies much more than in a large population. C In each spring, heritable body shapes that improve survival and reproduction under that spring’s temperature become more common over generations. D Selection favors fish that mate only with their own population, because they avoid producing hybrids that rarely survive; prezygotic isolation strengthens (reinforcement).',
});

// ── 5. Short: analysis of a model or visual representation (2025 Q5) ──
frqs.push({
  id: 'bio-short-feedback-pathway', questionNumber: 5, title: 'Feedback Inhibition in an Energy Pathway', topic: 'Cellular energetics · Enzyme regulation',
  modeledOn: modeled(2025, 5, 'Analysis of a Model or Visual Representation'), timeAllottedMin: 10,
  prompt: 'Figure 1 is a model of a metabolic pathway in which three enzymes convert a sugar, S, into intermediates and eventually produce ATP. ATP binds to an allosteric site on enzyme 1 and reduces its activity.',
  figures: [fig('Figure 1', draw(440, 150, 'A pathway: sugar S is converted by enzyme 1 to intermediate I1, by enzyme 2 to I2, and by enzyme 3 to products including ATP. A dashed arrow from ATP returns to enzyme 1 with a minus sign, showing inhibition', [
    ...[[40, 'S'], [160, 'I₁'], [280, 'I₂'], [400, 'ATP']].map(([x, l]) => text(x, 64, l, { bold: true, size: 14 })),
    ...[[55, 140, 'Enzyme 1'], [175, 260, 'Enzyme 2'], [295, 380, 'Enzyme 3']].flatMap(([a, b, l]) => [['arrow', a, 60, b, 60, { color: 'currentColor', width: 1.8 }], text((a + b) / 2, 48, l, { size: 11 })]),
    ['path', 'M400 74 Q400 120 220 120 Q98 120 98 70', { dash: true, color: PINK, width: 1.8 }], ['arrow', 98, 82, 98, 68, { color: PINK, width: 1.8 }], text(90, 104, '− inhibits', { anchor: 'end', size: 11, color: PINK }), text(250, 140, 'ATP binds an allosteric site on enzyme 1', { size: 11 }),
  ]))],
  parts: [
    part('A', 'Describe how binding of ATP to the allosteric site reduces the activity of enzyme 1.', [
      pt('bio-short-feedback-pathway-a1', 'concept', 'Describes ATP binding at a site other than the active site and changing the enzyme’s shape so the active site binds substrate less effectively.', ['says ATP binds the active site (competitive inhibition)'], 'ATP binds away from the active site and changes enzyme 1’s shape, so S fits the active site less well.', 'ATP blocks the active site.'),
    ]),
    part('B', 'Explain how this regulation helps the cell maintain a stable ATP supply.', [
      pt('bio-short-feedback-pathway-b1', 'concept', 'Explains negative feedback: when ATP is high the pathway slows, conserving S; when ATP falls, inhibition is released and the pathway speeds up.', ['describes positive feedback'], 'High ATP shuts the pathway down; as ATP is used up, enzyme 1 becomes active again and ATP production resumes.', 'It makes more ATP.'),
    ]),
    part('C', 'A mutation changes the allosteric site of enzyme 1 so that ATP can no longer bind. Predict the effect of the mutation on the amount of S used by the cell when its energy demand is low.', [
      pt('bio-short-feedback-pathway-c1', 'argumentation', 'Predicts that the cell uses more S (the pathway keeps running) when energy demand is low.', ['predicts less S is used'], 'More S is used, because the pathway no longer slows down when ATP is plentiful.', 'Less S is used.'),
    ]),
    part('D', 'Justify why enzyme 1, rather than enzyme 3, is the regulated step in this pathway.', [
      pt('bio-short-feedback-pathway-d1', 'argumentation', 'Justifies that regulating the first step prevents the cell from spending S and producing intermediates (I₁, I₂) that it does not need.', ['says enzyme 1 is the fastest'], 'Stopping the first step avoids wasting S and building up unused intermediates.', 'Enzyme 1 is the most important enzyme.'),
    ]),
  ],
  sampleResponse: 'A ATP binds a site away from the active site and changes enzyme 1’s shape, so the active site binds S less effectively. B This is negative feedback: when ATP is plentiful the pathway slows, and when ATP is used up the inhibition is released and ATP production speeds up again. C The cell uses more S, because the pathway keeps running even when ATP is high. D Regulating the first step keeps the cell from spending S and accumulating intermediates it does not need.',
});

// ── 6. Short: analysis of data (2025 Q6) ──
frqs.push({
  id: 'bio-short-hemoglobin', questionNumber: 6, title: 'A Hemoglobin Variant in a Malaria Region', topic: 'Natural selection · Hardy-Weinberg and heterozygote advantage',
  modeledOn: modeled(2025, 6, 'Analysis of Data'), timeAllottedMin: 10,
  prompt: 'The HbS allele of the β-globin gene causes sickle cell disease in homozygous individuals. Heterozygous individuals (HbA/HbS) are more resistant to malaria than either homozygote. Researchers determined the genotypes of 500 adults in a region where malaria is common (Figure 1).',
  figures: [fig('Figure 1', chart({ title: 'Genotypes of 500 adults', categories: ['HbA/HbA', 'HbA/HbS', 'HbS/HbS'], series: [{ name: 'Percent', values: [60, 38, 2] }], ymax: 70, ystep: 10, ylabel: 'Percent of adults', w: 380, h: 260, alt: 'Bar graph of genotype percentages among 500 adults: HbA/HbA 60 percent, HbA/HbS 38 percent, HbS/HbS 2 percent' }))],
  parts: [
    part('A', 'Calculate the frequency of the HbS allele in the population.', [
      pt('bio-short-hemoglobin-a1', 'calculation', 'Calculates q = 0.21 (0.02 + ½ × 0.38).', ['uses only the homozygote frequency (q = √0.02 ≈ 0.14)'], 'q = 0.02 + 0.19 = 0.21.', 'q = √0.02 = 0.14.'),
    ]),
    part('B', 'Calculate the expected frequency of heterozygotes if the population were in Hardy-Weinberg equilibrium.', [
      pt('bio-short-hemoglobin-b1', 'calculation', 'Calculates 2pq ≈ 0.33 (2 × 0.79 × 0.21), or a value consistent with part A.', ['uses pq without the factor of 2'], '2(0.79)(0.21) = 0.33.', '0.79 × 0.21 = 0.17.'),
    ]),
    part('C', 'The observed frequency of heterozygotes differs from the expected frequency. Explain the difference.', [
      pt('bio-short-hemoglobin-c1', 'argumentation', 'Explains that there are more heterozygotes than expected because heterozygotes survive malaria better (and HbS homozygotes have reduced survival), so the genotypes are not equally fit.', ['attributes the difference only to random mating'], 'Observed 0.38 exceeds the expected 0.33 because heterozygotes are more likely to survive malaria to adulthood.', 'The population is too small.'),
    ]),
    part('D', 'Predict how the frequency of the HbS allele would change over many generations if malaria were eliminated from the region. Justify your prediction.', [
      pt('bio-short-hemoglobin-d1', 'argumentation', 'Predicts the HbS frequency decreases, because heterozygotes no longer have an advantage while HbS homozygotes still have lower fitness.', ['predicts the allele disappears immediately'], 'It decreases: without malaria, carrying HbS no longer helps, but HbS/HbS individuals still have sickle cell disease.', 'It stays the same.'),
    ]),
  ],
  sampleResponse: 'A q = 0.02 + ½(0.38) = 0.21. B 2pq = 2(0.79)(0.21) ≈ 0.33. C There are more heterozygotes than expected (0.38 vs 0.33) because heterozygotes are more resistant to malaria and more of them survive to adulthood, while HbS/HbS individuals have reduced survival. D It decreases over generations; without malaria, heterozygotes have no advantage, but selection against HbS/HbS individuals continues.',
});

// ════════════════ Set modeled on the 2026 exam ════════════════

// ── 7. Long: interpreting and evaluating experimental results (2026 Q1) ──
frqs.push({
  id: 'bio-long-root-hair', questionNumber: 1, title: 'A Peptide Signal for Root Hair Growth', topic: 'Cell communication · Receptor signaling in plants',
  modeledOn: modeled(2026, 1, LONG), timeAllottedMin: 25,
  prompt: 'Root hairs are long extensions of root epidermal cells. Researchers studying a small flowering plant identified a peptide, RHP, that is secreted when soil phosphate is low, and a membrane receptor kinase, RK, in root epidermal cells. They grew wild-type plants and rk mutant plants (lacking functional RK) on low-phosphate medium with or without added RHP and measured the mean root hair length after 7 days (Figure 1). Error bars represent ±2 SE; n = 40 roots per group.',
  figures: [fig('Figure 1', errorBars('Bar graph of mean root hair length with ±2 SE error bars: wild type without RHP 0.40 ± 0.04 mm; wild type with RHP 0.85 ± 0.06 mm; rk mutant without RHP 0.38 ± 0.05 mm; rk mutant with RHP 0.41 ± 0.05 mm', 'Mean root hair length (mm)', [
    { label: 'Wild type\n− RHP', mean: 0.40, err: 0.04, color: BLUE }, { label: 'Wild type\n+ RHP', mean: 0.85, err: 0.06, color: BLUE }, { label: 'rk mutant\n− RHP', mean: 0.38, err: 0.05, color: PINK }, { label: 'rk mutant\n+ RHP', mean: 0.41, err: 0.05, color: PINK },
  ], 1.0, 0.2))],
  parts: [
    part('A', 'Describe how increasing root hair length could help a plant growing in low-phosphate soil.', [
      pt('bio-long-root-hair-a1', 'concept', 'Describes that longer root hairs increase the root’s surface area (and soil volume reached), increasing the rate of phosphate absorption.', ['says root hairs make phosphate'], 'Longer root hairs give more surface area in contact with soil, so the plant can absorb more phosphate.', 'Root hairs make the plant taller.'),
    ]),
    part('B', '(i) Identify the dependent variable. (ii) Identify the group that serves as the control for the effect of RHP on wild-type plants. (iii) Justify the researchers’ decision to include rk mutant plants.', [
      pt('bio-long-root-hair-b1', 'experimental-design', 'Identifies mean root hair length as the dependent variable.', ['identifies RHP treatment'], 'Mean root hair length.', 'Whether RHP was added.'),
      pt('bio-long-root-hair-b2', 'experimental-design', 'Identifies wild-type plants grown without RHP.', ['identifies rk mutants without RHP'], 'Wild-type plants with no added RHP.', 'The rk mutant plants.'),
      pt('bio-long-root-hair-b3', 'experimental-design', 'Justifies that comparing mutants with wild type tests whether the RHP effect requires the RK receptor.', ['says mutants show natural variation'], 'If RHP has no effect on plants that lack RK, then RK is needed for the RHP response.', 'To have more data.'),
    ]),
    part('C', '(i) Calculate the percent increase in mean root hair length when RHP is added to wild-type plants. (ii) Using the error bars, determine whether RHP had a statistically significant effect on rk mutant plants. (iii) Based on the data, make a claim about the role of RK in the response to RHP.', [
      pt('bio-long-root-hair-c1', 'calculation', 'Calculates about a 113% increase ((0.85 − 0.40) / 0.40 × 100).', ['divides by 0.85 (53%)'], '(0.85 − 0.40) / 0.40 × 100 ≈ 113%.', '(0.85 − 0.40) / 0.85 ≈ 53%.'),
      pt('bio-long-root-hair-c2', 'data-analysis', 'Determines the effect on rk mutants is not significant because the error bars overlap (0.33–0.43 and 0.36–0.46 mm).', ['claims significance because 0.41 > 0.38'], 'Not significant: the ±2 SE ranges overlap.', 'Significant, because the mean increased.'),
      pt('bio-long-root-hair-c3', 'argumentation', 'Claims RK is required for (is the receptor for) the RHP response, because RHP lengthens root hairs only in plants with functional RK.', ['claims RK inhibits root hair growth'], 'RK is required for the response to RHP: RHP doubles root hair length in wild type but has no effect without RK.', 'RK makes root hairs.'),
    ]),
    part('D', 'A different mutation produces an RK protein that is always active, even without RHP. (i) Predict the root hair length of these mutants grown without RHP, compared with wild-type plants without RHP. (ii) Justify your prediction.', [
      pt('bio-long-root-hair-d1', 'argumentation', 'Predicts longer root hairs than wild type without RHP (similar to wild type with RHP).', ['predicts the same as wild type'], 'Longer, about the length of wild type with RHP.', 'The same as wild type.'),
      pt('bio-long-root-hair-d2', 'argumentation', 'Justifies that the always-active receptor triggers the signaling pathway for root hair elongation without needing the peptide signal.', ['says the plant makes more RHP'], 'An always-active RK starts the elongation pathway on its own, so RHP binding is not needed.', 'Because mutations increase growth.'),
    ]),
  ],
  sampleResponse: 'A Longer root hairs increase the surface area in contact with soil, so the plant absorbs more of the scarce phosphate. B (i) Mean root hair length. (ii) Wild-type plants without RHP. (iii) Mutants test whether the RHP effect requires RK; if RHP does not work without RK, RK is needed for the response. C (i) (0.85 − 0.40) / 0.40 × 100 ≈ 113%. (ii) Not significant: the ±2 SE ranges (0.33–0.43 and 0.36–0.46) overlap. (iii) RK is required for the RHP response, because RHP more than doubles root hair length only in plants with RK. D (i) Longer than wild type without RHP, close to wild type with RHP. (ii) An always-active RK triggers the elongation pathway without the peptide.',
});

// ── 8. Long with graphing (2026 Q2) ──
const tfRows = [['Wild type', '1.0 ± 0.1', '1.0 ± 0.1'], ['tf knockout', '0.2 ± 0.05', '2.4 ± 0.3'], ['TF overexpression', '3.1 ± 0.3', '0.4 ± 0.08']];
frqs.push({
  id: 'bio-graph-transcription-factor', questionNumber: 2, title: 'One Transcription Factor, Two Target Genes', topic: 'Gene expression and regulation · Transcription factors',
  modeledOn: modeled(2026, 2, GRAPH), timeAllottedMin: 25,
  prompt: 'Researchers studied a transcription factor, TF, in a species of yeast. They measured the amount of mRNA from two genes, J and K, in wild-type cells, cells with the TF gene knocked out (tf knockout), and cells that overexpress TF. mRNA amounts are given relative to wild type (Table 1) as mean ± 2 SE.',
  parts: [
    part('A', '(i) Describe how a transcription factor can regulate the expression of a gene. (ii) Explain why the researchers measured mRNA rather than protein to study the effect of TF on transcription.', [
      pt('bio-graph-transcription-factor-a1', 'concept', 'Describes a transcription factor binding a regulatory DNA sequence (promoter or enhancer) and increasing or decreasing RNA polymerase binding or transcription initiation.', ['says transcription factors bind mRNA', 'says they act during translation'], 'TF binds a regulatory sequence near the gene and helps or blocks RNA polymerase from starting transcription.', 'TF binds the mRNA and destroys it.'),
      pt('bio-graph-transcription-factor-a2', 'concept', 'Explains that mRNA is the direct product of transcription, while protein levels also depend on translation and protein degradation.', ['says mRNA is easier to see'], 'mRNA directly reflects transcription; protein amounts can also change through translation or degradation.', 'Protein is too small to measure.'),
    ]),
    part('B', 'Using the data in Table 1, construct an appropriately labeled graph that represents the relative mRNA of genes J and K for each genotype, including error bars.', [
      pt('bio-graph-transcription-factor-b1', 'graphing', 'Constructs a grouped bar graph with labeled axes (relative mRNA amount; genotype) and a key distinguishing genes J and K.', ['draws a line graph', 'omits the key'], 'Paired bars for J and K above each genotype, with a key.', 'A line through the three genotypes.'),
      pt('bio-graph-transcription-factor-b2', 'graphing', 'Uses an appropriate linear scale and plots all six means correctly.', ['misplots a mean', 'uneven scale'], 'Bars at 1.0, 0.2, 3.1 for J and 1.0, 2.4, 0.4 for K on a 0–3.5 scale.', 'Only J is plotted.'),
      pt('bio-graph-transcription-factor-b3', 'graphing', 'Draws ±2 SE error bars correctly on all six bars.', ['error bars drawn only upward'], 'TF overexpression J bar has an error bar from 2.8 to 3.4.', 'No error bars.'),
    ], [tableFigure('Table 1', ['Genotype', 'Relative J mRNA', 'Relative K mRNA'], tfRows)]),
    part('C', '(i) Calculate the percent change in K mRNA in tf knockout cells compared with wild type. (ii) Based on the data, make a claim about how TF affects the transcription of genes J and K.', [
      pt('bio-graph-transcription-factor-c1', 'calculation', 'Calculates a 140% increase ((2.4 − 1.0) / 1.0 × 100).', ['reports 240%'], '(2.4 − 1.0) / 1.0 × 100 = 140%.', '240%.'),
      pt('bio-graph-transcription-factor-c2', 'argumentation', 'Claims TF activates J and represses K, supported by J falling and K rising without TF, and the opposite with extra TF.', ['claims TF affects both genes the same way'], 'TF activates J and represses K: removing TF lowers J and raises K, and overexpressing TF does the reverse.', 'TF controls genes J and K.'),
    ]),
    part('D', '(i) Predict the amount of K mRNA in otherwise wild-type cells with a mutation that prevents TF from binding the regulatory sequence of gene K. (ii) Justify your prediction.', [
      pt('bio-graph-transcription-factor-d1', 'argumentation', 'Predicts K mRNA increases above wild type (similar to the knockout, about 2.4).', ['predicts a decrease'], 'K mRNA rises to about the knockout level.', 'K mRNA drops.'),
      pt('bio-graph-transcription-factor-d2', 'argumentation', 'Justifies that TF can no longer repress K, while J is still regulated normally because its binding site is intact.', ['says TF is no longer made'], 'TF is still made and still activates J, but it cannot bind K’s regulatory sequence, so K is no longer repressed.', 'The mutation stops all transcription.'),
    ]),
  ],
  sampleResponse: 'A (i) A transcription factor binds a regulatory DNA sequence such as a promoter or enhancer and increases or decreases RNA polymerase binding, changing how often the gene is transcribed. (ii) mRNA is the direct product of transcription; protein levels also depend on translation and degradation. B A grouped bar graph: for each genotype a J bar and a K bar (1.0/1.0, 0.2/2.4, 3.1/0.4) with ±2 SE error bars, a y-axis “Relative mRNA amount,” and a key. C (i) (2.4 − 1.0) / 1.0 × 100 = 140% increase. (ii) TF activates J and represses K. D (i) K mRNA increases to about the knockout level. (ii) TF can no longer bind K’s regulatory sequence, so it cannot repress K.',
});

// ── 9. Short: scientific investigation (2026 Q3) ──
frqs.push({
  id: 'bio-short-rotenone', questionNumber: 3, title: 'Rotenone and Yeast Respiration', topic: 'Cellular energetics · Electron transport chain',
  modeledOn: modeled(2026, 3, 'Scientific Investigation'), timeAllottedMin: 10,
  prompt: 'Rotenone is a compound that blocks the transfer of electrons from NADH to the first protein complex of the electron transport chain. Rotenone is dissolved in ethanol before use. Researchers grew yeast in a glucose solution and added either rotenone dissolved in ethanol or no treatment, then measured the rate of oxygen consumption by the yeast.',
  parts: [
    part('A', 'Identify the independent variable in the experiment.', [
      pt('bio-short-rotenone-a1', 'experimental-design', 'Identifies the presence or absence of rotenone.', ['identifies oxygen consumption'], 'Whether rotenone was added.', 'The oxygen consumption rate.'),
    ]),
    part('B', 'Identify an additional control group the researchers should include, and justify its use.', [
      pt('bio-short-rotenone-b1', 'experimental-design', 'Identifies yeast given ethanol alone (the solvent without rotenone), justified as showing that any effect is caused by rotenone and not the ethanol.', ['suggests a group with no yeast without justification'], 'Yeast given the same amount of ethanol without rotenone, to show the ethanol itself does not change oxygen use.', 'A group with more rotenone.'),
    ]),
    part('C', 'Predict how rotenone will affect the rate of oxygen consumption by the yeast.', [
      pt('bio-short-rotenone-c1', 'argumentation', 'Predicts that oxygen consumption decreases.', ['predicts an increase'], 'It decreases.', 'It increases because the yeast need more energy.'),
    ]),
    part('D', 'Justify your prediction in part C.', [
      pt('bio-short-rotenone-d1', 'argumentation', 'Justifies that with electrons blocked from entering the chain, fewer electrons reach oxygen, the final electron acceptor, so less oxygen is reduced to water.', ['says rotenone destroys oxygen'], 'Electrons from NADH cannot enter the chain, so fewer electrons reach O₂ at the end and less O₂ is used to form water.', 'Rotenone is poisonous.'),
    ]),
  ],
  sampleResponse: 'A The presence or absence of rotenone. B Yeast given the same volume of ethanol without rotenone; this shows that any change is caused by rotenone and not by the ethanol solvent. C Oxygen consumption decreases. D Rotenone stops electrons from NADH entering the electron transport chain, so fewer electrons are passed to oxygen, the final electron acceptor, and less oxygen is reduced to water.',
});

// ── 10. Short: conceptual analysis (2026 Q4) ──
frqs.push({
  id: 'bio-short-nondisjunction', questionNumber: 4, title: 'Nondisjunction in Meiosis II', topic: 'Heredity · Meiosis and chromosome number',
  modeledOn: modeled(2026, 4, 'Conceptual Analysis'), timeAllottedMin: 10,
  prompt: 'In a species with a diploid number of 2n = 4, a germ cell undergoes meiosis. Meiosis I proceeds normally. In meiosis II, the sister chromatids of one chromosome fail to separate in one of the two cells; the other cell divides normally.',
  parts: [
    part('A', 'Describe what normally happens to sister chromatids during anaphase II.', [
      pt('bio-short-nondisjunction-a1', 'concept', 'Describes the sister chromatids separating and moving to opposite poles of the cell.', ['describes homologous chromosomes separating (anaphase I)'], 'The sister chromatids of each chromosome separate and are pulled to opposite poles.', 'Homologous chromosomes separate.'),
    ]),
    part('B', 'Identify the number of chromosomes in each of the four gametes produced.', [
      pt('bio-short-nondisjunction-b1', 'concept', 'Identifies 3, 1, 2, and 2 chromosomes.', ['reports 3, 3, 1, 1 (the meiosis I pattern)'], 'One gamete has 3, one has 1, and two have 2.', 'Two have 3 and two have 1.'),
    ]),
    part('C', 'Explain the result if the gamete with the extra chromosome is fertilized by a normal gamete.', [
      pt('bio-short-nondisjunction-c1', 'concept', 'Explains that the zygote has 5 chromosomes (2n + 1), three copies of one chromosome (trisomy), which can disrupt development through altered gene dosage.', ['says the zygote is triploid'], 'The zygote has 5 chromosomes, with three copies of one chromosome (trisomy).', 'The zygote has 6 chromosomes.'),
    ]),
    part('D', 'Explain why nondisjunction during meiosis I would produce a different set of gametes than nondisjunction during meiosis II.', [
      pt('bio-short-nondisjunction-d1', 'argumentation', 'Explains that in meiosis I a homologous pair fails to separate, so both daughter cells and all four gametes are abnormal (two n + 1 and two n − 1), whereas in meiosis II only the gametes from one cell are affected.', ['states the outcomes are the same'], 'If homologs fail to separate in meiosis I, both cells are abnormal and all four gametes have the wrong number; in meiosis II only two gametes are affected.', 'Meiosis I nondisjunction is worse.'),
    ]),
  ],
  sampleResponse: 'A The sister chromatids of each chromosome separate and move to opposite poles. B 3, 1, 2, and 2 chromosomes. C The zygote has 5 chromosomes (2n + 1), with three copies of one chromosome (trisomy). D In meiosis I a homologous pair fails to separate, so both daughter cells are abnormal and all four gametes have the wrong number (3, 3, 1, 1); in meiosis II only the two gametes from the affected cell are abnormal.',
});

// ── 11. Short: analysis of a model or visual representation (2026 Q5) ──
frqs.push({
  id: 'bio-short-finch-beaks', questionNumber: 5, title: 'Finch Beaks After a Drought', topic: 'Natural selection · Directional selection',
  modeledOn: modeled(2026, 5, 'Analysis of a Model or Visual Representation'), timeAllottedMin: 10,
  prompt: 'A severe drought on an island reduced the supply of small, soft seeds, leaving mostly large, hard seeds. Figure 1 shows the distribution of beak depth in a ground finch population before the drought and in the surviving birds after the drought. Beak depth is highly heritable.',
  figures: [fig('Figure 1', chart({ title: 'Beak depth before and after the drought', categories: ['7 mm', '8 mm', '9 mm', '10 mm', '11 mm'], series: [{ name: 'Before drought', values: [10, 25, 35, 20, 10], color: BLUE }, { name: 'After drought (survivors)', values: [3, 12, 30, 33, 22], color: AMBER }], ymax: 40, ystep: 10, ylabel: 'Percent of birds', alt: 'Grouped bar graph of the percent of birds at each beak depth. Before the drought: 7 mm 10 percent, 8 mm 25, 9 mm 35, 10 mm 20, 11 mm 10. After the drought: 7 mm 3 percent, 8 mm 12, 9 mm 30, 10 mm 33, 11 mm 22' }))],
  parts: [
    part('A', 'Identify the type of selection shown in Figure 1.', [
      pt('bio-short-finch-beaks-a1', 'concept', 'Identifies directional selection.', ['identifies stabilizing or disruptive selection'], 'Directional selection toward deeper beaks.', 'Stabilizing selection.'),
    ]),
    part('B', 'Calculate the change in mean beak depth from before the drought to after the drought.', [
      pt('bio-short-finch-beaks-b1', 'calculation', 'Calculates an increase of about 0.64 mm (before ≈ 8.95 mm, after ≈ 9.59 mm).', ['averages the five categories without weighting'], 'Before: 0.10(7) + 0.25(8) + 0.35(9) + 0.20(10) + 0.10(11) = 8.95 mm. After: 9.59 mm. Change ≈ +0.64 mm.', 'Both means are 9 mm.'),
    ]),
    part('C', 'Explain how the drought caused the shift shown in the figure.', [
      pt('bio-short-finch-beaks-c1', 'argumentation', 'Explains that birds with deeper beaks could crack the remaining large, hard seeds, so they were more likely to survive, shifting the distribution.', ['says birds grew deeper beaks during the drought'], 'Deeper-beaked birds could eat the hard seeds and survived more often.', 'The birds developed bigger beaks to eat hard seeds.'),
    ]),
    part('D', 'Predict how the mean beak depth of the offspring of the survivors will compare with the mean before the drought, and justify your prediction.', [
      pt('bio-short-finch-beaks-d1', 'argumentation', 'Predicts the offspring’s mean beak depth is greater than before the drought, because beak depth is heritable and the survivors who reproduce had deeper beaks.', ['predicts it returns to the original mean immediately'], 'Greater than before, since the parents had deeper beaks and beak depth is inherited.', 'The same as before the drought.'),
    ]),
  ],
  sampleResponse: 'A Directional selection. B Before: 0.10(7) + 0.25(8) + 0.35(9) + 0.20(10) + 0.10(11) = 8.95 mm. After: 0.03(7) + 0.12(8) + 0.30(9) + 0.33(10) + 0.22(11) = 9.59 mm. The mean increased by about 0.64 mm. C With mostly large, hard seeds left, birds with deeper beaks could crack them and were more likely to survive. D Greater than before the drought, because beak depth is highly heritable and the surviving parents had deeper beaks on average.',
});

// ── 12. Short: analysis of data (2026 Q6) ──
const sheds = [{ name: 'Watershed 1\n(low pesticide)', min: 28, q1: 35, med: 42, q3: 48, max: 55 }, { name: 'Watershed 2\n(medium)', min: 18, q1: 24, med: 30, q3: 36, max: 44 }, { name: 'Watershed 3\n(high)', min: 6, q1: 10, med: 15, q3: 21, max: 30 }];
function boxPlot(alt) {
  const L = 54, B = 200, sy = v => B - v / 60 * 176, items = [text(8, 14, 'Tadpoles per sample', { anchor: 'start', size: 11 })];
  for (let v = 0; v <= 60; v += 10) items.push(['line', L, sy(v), 380, sy(v), { width: v ? 0.4 : 1.4, dash: !!v }], text(L - 6, sy(v) + 4, String(v), { anchor: 'end', size: 10 }));
  sheds.forEach((s, i) => {
    const cx = 110 + i * 110;
    items.push(['line', cx, sy(s.min), cx, sy(s.q1), { width: 1.4 }], ['line', cx, sy(s.q3), cx, sy(s.max), { width: 1.4 }], ['line', cx - 10, sy(s.min), cx + 10, sy(s.min)], ['line', cx - 10, sy(s.max), cx + 10, sy(s.max)]);
    items.push(['rect', cx - 26, sy(s.q3), 52, sy(s.q1) - sy(s.q3), { fill: BLUE, color: BLUE }], ['line', cx - 26, sy(s.med), cx + 26, sy(s.med), { width: 2.6 }]);
    s.name.split('\n').forEach((l, k) => items.push(text(cx, B + 15 + k * 13, l, { size: 10.5 })));
  });
  return draw(400, 240, alt, items);
}
frqs.push({
  id: 'bio-short-frog-watersheds', questionNumber: 6, title: 'Tadpoles in Three Watersheds', topic: 'Ecology · Interpreting field data',
  modeledOn: modeled(2026, 6, 'Analysis of Data'), timeAllottedMin: 10,
  prompt: 'Ecologists counted tadpoles of one frog species in 30 standardized net samples from ponds in each of three watersheds. The watersheds differ in the amount of agricultural pesticide measured in their water. Figure 1 summarizes the counts as box plots.',
  figures: [fig('Figure 1', boxPlot('Box plots of tadpoles per sample. Watershed 1, low pesticide: minimum 28, first quartile 35, median 42, third quartile 48, maximum 55. Watershed 2, medium pesticide: minimum 18, first quartile 24, median 30, third quartile 36, maximum 44. Watershed 3, high pesticide: minimum 6, first quartile 10, median 15, third quartile 21, maximum 30'))],
  parts: [
    part('A', 'Identify the median number of tadpoles per sample in Watershed 2.', [
      pt('bio-short-frog-watersheds-a1', 'data-analysis', 'Identifies a median of 30 tadpoles per sample.', ['reports the mean or a quartile'], '30 tadpoles per sample.', '36 tadpoles per sample.'),
    ]),
    part('B', 'Describe the relationship between pesticide level and the number of tadpoles per sample.', [
      pt('bio-short-frog-watersheds-b1', 'data-analysis', 'Describes a negative relationship: as pesticide level increases, the number of tadpoles per sample decreases.', ['describes a positive relationship'], 'Higher pesticide levels go with fewer tadpoles per sample.', 'Watershed 3 has the most pesticide.'),
    ]),
    part('C', 'Calculate the percent decrease in the median number of tadpoles per sample from Watershed 1 to Watershed 3.', [
      pt('bio-short-frog-watersheds-c1', 'calculation', 'Calculates about a 64% decrease ((42 − 15) / 42 × 100).', ['divides by 15 (180%)'], '(42 − 15) / 42 × 100 ≈ 64%.', '(42 − 15) / 15 = 180%.'),
    ]),
    part('D', 'A student claims these data show that the pesticide causes the decline in tadpoles. Evaluate the claim.', [
      pt('bio-short-frog-watersheds-d1', 'argumentation', 'Explains that the data are observational (a correlation), so other differences between watersheds could cause the decline; a controlled experiment that varies only pesticide would be needed to show causation.', ['accepts the claim because the trend is clear'], 'The claim is not fully supported: the watersheds may differ in other ways, such as habitat or predators, so a controlled experiment is needed.', 'The claim is correct because Watershed 3 has the fewest tadpoles.'),
    ]),
  ],
  sampleResponse: 'A 30 tadpoles per sample. B As pesticide level increases, the number of tadpoles per sample decreases. C (42 − 15) / 42 × 100 ≈ 64% decrease. D Not fully supported: the study is observational, so other differences between watersheds (habitat, predators, temperature) could explain the decline. A controlled experiment that varies only pesticide concentration would be needed to show causation.',
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'bio-long-aquaporin',
  transcript: `A Water moves through the aquaporin channel by facilitated diffusion, from high water potential to low water potential, and no ATP is needed.

B (i) The type of siRNA the cells were given. (ii) The scrambled siRNA is a control. (iii) There is no difference in water permeability between cells given AQP2 siRNA and cells given scrambled siRNA.

C (i) With AQP2 siRNA the permeability dropped from 39 to 10 µm/s. (ii) The difference is significant because the error bars, 34–44 and 7–13, do not overlap. (iii) 816 / 3 = 272 amino acids.

D (i) They would swell faster. (ii) There are more aquaporins, so more water can come into the cell each second.`,
  evidence: {
    'bio-long-aquaporin-a1': 'by facilitated diffusion, from high water potential to low water potential, and no ATP is needed',
    'bio-long-aquaporin-b1': 'The type of siRNA the cells were given.', 'bio-long-aquaporin-b3': 'There is no difference in water permeability between cells given AQP2 siRNA and cells given scrambled siRNA.',
    'bio-long-aquaporin-c1': 'the permeability dropped from 39 to 10 µm/s', 'bio-long-aquaporin-c2': 'the error bars, 34–44 and 7–13, do not overlap',
    'bio-long-aquaporin-d1': 'They would swell faster.', 'bio-long-aquaporin-d2': 'more aquaporins, so more water can come into the cell each second',
  },
  missed: {
    'bio-long-aquaporin-b2': 'Saying it is a control is not a justification. Say what it controls for: it shows that putting any siRNA into the cells does not lower permeability, so the drop must come from silencing AQP2.',
    'bio-long-aquaporin-c3': 'The stop codon does not code for an amino acid. 816 / 3 = 272 codons, and one of them is the stop codon, so the polypeptide has 271 amino acids.',
  },
  priorityFix: 'When you justify a control, name what it rules out. Here the scrambled siRNA rules out the possibility that the act of adding siRNA, rather than silencing AQP2, lowered permeability.',
  sampleResponseComparison: 'Parts A, C (i)–(ii), and D match the sample response. The sample explains what the scrambled siRNA controls for in B (ii) and subtracts the stop codon in C (iii).',
};

module.exports = { course: 'ap-biology', frqs, canned };
