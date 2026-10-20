// AP Environmental Science free-response practice: six original questions, one full set of
// three for each of the 2025 (Set 1) and 2026 released exams, each modeled on the released
// question with the same type and point total (10). One point per rubric row, as released.
const { chart, graph } = require('../ap-mcq-build/figures.cjs');
const { pt, part, tableFigure, fig } = require('./frq-helpers.cjs');

const BLUE = '#3b82f6', PINK = '#ec4899';
const URL = (year, set) => `https://apcentral.collegeboard.org/media/pdf/ap${String(year).slice(2)}-frq-environmental-science${set ? `-set-${set}` : ''}.pdf`;
const modeled = (year, n, type, set) => ({ year, ...(set ? { set } : {}), question: n, type, label: `${year} AP Environmental Science${set ? ` Set ${set}` : ''} Question ${n} (${type})`, url: URL(year, set) });
const DESIGN = 'Design an Investigation', PROBLEM = 'Analyze an Environmental Problem and Propose a Solution', CALC = 'Analyze an Environmental Problem and Propose a Solution (Doing Calculations)';

const frqs = [];

// ════════════════ Set modeled on the 2025 exam (Set 1) ════════════════

// ── 1. Design an investigation (2025 Q1) ──
frqs.push({
  id: 'apes-design-stream-nitrate', questionNumber: 1, title: 'Farm Runoff and Stream Insects', topic: 'Aquatic ecosystems · Nutrient pollution and indicator species',
  modeledOn: modeled(2025, 1, DESIGN, 1), timeAllottedMin: 23,
  prompt: 'A stream flows past a large corn farm. Mayflies, stoneflies, and caddisflies (EPT insects) are aquatic larvae that are sensitive to pollution. Students sampled five sites at increasing distances downstream from where the farm’s drainage ditch enters the stream. At each site they measured the nitrate concentration and counted the number of different EPT taxa in a standard kick-net sample (Figure 1). They also measured dissolved oxygen at dawn at the same sites (Figure 2).',
  figures: [
    fig('Figure 1', chart({ title: 'Nitrate and EPT taxa at five sites', categories: ['Site 1', 'Site 2', 'Site 3', 'Site 4', 'Site 5'], series: [{ name: 'Nitrate (mg/L)', values: [1, 3, 6, 9, 12], color: PINK }, { name: 'EPT taxa (number)', values: [14, 11, 7, 4, 2], color: BLUE }], ymax: 16, ystep: 2, alt: 'Grouped bar graph for Sites 1 to 5. Nitrate in mg per liter: 1, 3, 6, 9, 12. Number of EPT taxa: 14, 11, 7, 4, 2' })),
    tableFigure('Figure 2', ['Site', 'Dissolved oxygen at dawn (mg/L)'], [['1', '9.1'], ['2', '8.0'], ['3', '6.2'], ['4', '4.1'], ['5', '2.9']]),
  ],
  parts: [
    part('A', 'Describe one ecosystem service that a healthy stream provides to people.', [
      pt('apes-design-stream-nitrate-a1', 'concept', 'Describes a provisioning, regulating, cultural, or supporting service of a stream (for example, water purification, fish for food, flood control, or recreation).', ['names a service without describing it', 'describes a farm benefit unrelated to the stream'], 'Wetland plants and microbes along the stream filter pollutants, providing cleaner drinking water.', 'Water.'),
    ]),
    part('B', 'Explain how excess nitrate entering the stream could lead to lower dissolved oxygen.', [
      pt('apes-design-stream-nitrate-b1', 'concept', 'Explains eutrophication: nitrate fuels algal blooms; when the algae die, bacteria decompose them and use up dissolved oxygen.', ['says nitrate directly consumes oxygen', 'stops at algae growing'], 'Nitrate causes an algal bloom; decomposers breaking down the dead algae consume dissolved oxygen.', 'Nitrate makes the water warmer.'),
    ]),
    part('C', 'Based on Figure 1, identify the number of EPT taxa at Site 3.', [
      pt('apes-design-stream-nitrate-c1', 'data-analysis', 'Identifies 7 taxa.', ['reports the nitrate value (6)'], '7 taxa.', '6 taxa.'),
    ]),
    part('D', 'Based on Figure 1, describe the relationship between nitrate concentration and the number of EPT taxa.', [
      pt('apes-design-stream-nitrate-d1', 'data-analysis', 'Describes a negative (inverse) relationship: as nitrate increases, the number of EPT taxa decreases.', ['describes only one variable'], 'As nitrate increases from 1 to 12 mg/L, EPT taxa fall from 14 to 2.', 'Nitrate increases downstream.'),
    ]),
    part('E', 'EPT larvae generally need at least 5 mg/L of dissolved oxygen. Describe one way the data in Figure 2 support the hypothesis that low oxygen helps explain the loss of EPT taxa.', [
      pt('apes-design-stream-nitrate-e1', 'data-analysis', 'Describes that the sites with the fewest taxa (Sites 4 and 5) have dissolved oxygen below 5 mg/L, while sites with more taxa are above 5 mg/L.', ['restates the hypothesis without data'], 'Sites 4 and 5 have DO of 4.1 and 2.9 mg/L, below 5 mg/L, and the fewest taxa.', 'Oxygen goes down.'),
    ]),
    part('F', 'The students plan a follow-up investigation that compares the stream above and below the drainage ditch. (i) Identify a testable scientific question for the investigation. (ii) Identify the dependent variable.', [
      pt('apes-design-stream-nitrate-f1', 'experimental-design', 'Identifies a testable question comparing the two locations, such as whether EPT diversity differs above and below the ditch.', ['asks a non-testable question'], 'Does the number of EPT taxa differ between sites upstream and downstream of the drainage ditch?', 'Are farms bad for streams?'),
      pt('apes-design-stream-nitrate-f2', 'experimental-design', 'Identifies the number of EPT taxa (or another measured biotic or water-quality response) as the dependent variable.', ['identifies location (the independent variable)'], 'The number of EPT taxa per sample.', 'Location of the site.'),
    ]),
    part('G', '(i) Explain why a stream with many EPT taxa would be more likely to recover from a pollution spill than a stream with few. (ii) Explain how the results could have been different if the students had sampled only during a period of heavy rain.', [
      pt('apes-design-stream-nitrate-g1', 'concept', 'Explains that higher species diversity makes it more likely that some species tolerate or survive the disturbance and repopulate (greater resilience).', ['says more insects eat the pollution'], 'With more species, some are likely to survive the spill and help the community recover.', 'Big streams recover faster.'),
      pt('apes-design-stream-nitrate-g2', 'experimental-design', 'Explains a plausible change, such as heavy rain increasing runoff and nitrate levels, or diluting nitrate and raising oxygen, so measurements would differ from typical conditions.', ['gives a change without a reason'], 'Heavy rain washes more fertilizer into the stream, so nitrate readings would be higher than usual.', 'The results would change.'),
    ]),
    part('H', 'Describe one agricultural practice that could reduce nitrate runoff from the farm.', [
      pt('apes-design-stream-nitrate-h1', 'solution', 'Describes a practice such as vegetated buffer strips, cover crops, precision or reduced fertilizer application, or no-till farming, with how it reduces runoff.', ['names a practice that increases runoff'], 'Plant a buffer strip of grasses along the stream to absorb nitrate before it reaches the water.', 'Use more fertilizer.'),
    ]),
  ],
  sampleResponse: 'A Stream wetlands and microbes filter pollutants, providing cleaner water for people downstream. B Nitrate fertilizes algae, causing a bloom; when the algae die, bacteria decompose them and consume dissolved oxygen. C 7 taxa. D As nitrate increases, the number of EPT taxa decreases (a negative relationship). E Sites 4 and 5 have dissolved oxygen of 4.1 and 2.9 mg/L, below the 5 mg/L EPT larvae need, and they have the fewest taxa. F (i) Does the number of EPT taxa differ upstream and downstream of the drainage ditch? (ii) The number of EPT taxa. G (i) A more diverse community is more likely to contain species that survive a spill and recolonize. (ii) Heavy rain would wash more fertilizer into the stream, raising nitrate above normal levels. H Plant vegetated buffer strips along the stream to absorb nitrate in runoff.',
});

// ── 2. Analyze a problem and propose a solution (2025 Q2) ──
frqs.push({
  id: 'apes-problem-coral-bleaching', questionNumber: 2, title: 'Coral Bleaching', topic: 'Ocean warming, acidification, and reef protection',
  modeledOn: modeled(2025, 2, PROBLEM, 1), timeAllottedMin: 23,
  prompt: 'Coral reefs are built by coral animals that host photosynthetic algae called zooxanthellae. Figure 1 gives the average summer sea surface temperature at a reef and the percent of coral colonies that were bleached in each survey year.',
  figures: [tableFigure('Figure 1', ['Survey year', 'Average summer sea temperature (°C)', 'Bleached colonies (%)'], [['2010', '28.6', '5'], ['2013', '28.9', '8'], ['2016', '30.1', '30'], ['2019', '29.7', '22'], ['2022', '30.6', '45']])],
  parts: [
    part('A', 'Identify the type of relationship between corals and zooxanthellae.', [
      pt('apes-problem-coral-bleaching-a1', 'concept', 'Identifies mutualism.', ['identifies parasitism or commensalism'], 'Mutualism.', 'Parasitism.'),
    ]),
    part('B', 'Describe what happens during coral bleaching.', [
      pt('apes-problem-coral-bleaching-b1', 'concept', 'Describes stressed corals expelling their zooxanthellae, losing color and their main food source.', ['says the coral is painted white by sediment'], 'Under heat stress, corals expel their algae, turn white, and lose most of their food supply.', 'The coral dies instantly.'),
    ]),
    part('C', 'Based on Figure 1, identify the year with the highest percent of bleached colonies and describe the relationship between temperature and bleaching.', [
      pt('apes-problem-coral-bleaching-c1', 'data-analysis', 'Identifies 2022 and describes that years with higher temperatures had more bleaching (positive relationship).', ['identifies 2016'], '2022; bleaching rises as sea temperature rises.', '2016.'),
    ]),
    part('D', 'Explain how increased atmospheric carbon dioxide can harm coral reefs other than by warming the water.', [
      pt('apes-problem-coral-bleaching-d1', 'concept', 'Explains ocean acidification: CO₂ dissolves to form carbonic acid, lowering pH and carbonate availability, which makes it harder for corals to build calcium carbonate skeletons.', ['says CO₂ poisons fish'], 'CO₂ forms carbonic acid in seawater, lowering pH and reducing the carbonate corals need to build skeletons.', 'CO₂ blocks sunlight.'),
    ]),
    part('E', 'Propose a realistic solution a coastal community could implement to reduce a local stress on coral reefs.', [
      pt('apes-problem-coral-bleaching-e1', 'solution', 'Proposes a realistic local action, such as establishing a marine protected area, reducing sewage or fertilizer runoff, limiting destructive fishing, or regulating anchoring and tourism.', ['proposes an unrealistic action such as cooling the ocean'], 'Create a marine protected area that bans fishing and anchoring on the reef.', 'Put ice in the ocean.'),
    ]),
    part('F', 'Justify the solution in part E by describing an additional benefit other than protecting corals.', [
      pt('apes-problem-coral-bleaching-f1', 'solution', 'Describes an additional benefit consistent with part E (for example, fish populations rebound and support nearby fisheries, ecotourism income, or cleaner water for swimming).', ['repeats that it protects corals'], 'Fish populations grow inside the reserve and spill over into fished areas, supporting local fishers.', 'It protects the coral.'),
    ]),
    part('G', 'Describe one ecosystem service provided by coral reefs.', [
      pt('apes-problem-coral-bleaching-g1', 'concept', 'Describes a service such as protecting shorelines from wave erosion, providing fish habitat, supporting tourism, or supplying compounds for medicine.', ['names a service without describing it'], 'Reefs break waves and protect coastlines from erosion during storms.', 'Beauty.'),
    ]),
    part('H', 'Identify one human activity, other than burning fossil fuels, that damages coral reefs.', [
      pt('apes-problem-coral-bleaching-h1', 'concept', 'Identifies a valid activity such as blast or cyanide fishing, sedimentation from coastal development, nutrient runoff, or anchor damage.', ['identifies a global stress already excluded'], 'Sediment from coastal construction smothering the reef.', 'Burning coal.'),
    ]),
    part('I', 'Describe how the loss of a coral reef could affect a nearby fishing community.', [
      pt('apes-problem-coral-bleaching-i1', 'concept', 'Describes that losing reef habitat reduces fish populations, lowering catches, income, or food supply for the community.', ['says fishing would improve'], 'Fewer reef fish would mean smaller catches and less income for fishers.', 'The water gets clearer.'),
    ]),
    part('J', 'Describe one international or national approach to reducing the global cause of rising sea temperatures.', [
      pt('apes-problem-coral-bleaching-j1', 'solution', 'Describes an approach to reducing greenhouse gas emissions, such as an international agreement with emissions targets, a carbon tax, or cap-and-trade.', ['describes a local reef action'], 'A carbon tax that makes fossil fuels more expensive and lowers CO₂ emissions.', 'Ban fishing.'),
    ]),
  ],
  sampleResponse: 'A Mutualism. B Heat-stressed corals expel their zooxanthellae, turning white and losing their main food source. C 2022; bleaching is higher in years with higher sea temperatures. D CO₂ dissolves in seawater to form carbonic acid, lowering pH and reducing the carbonate ions corals need to build calcium carbonate skeletons. E Establish a marine protected area that bans fishing and anchoring on the reef. F Fish populations recover inside the reserve and spill over into nearby waters, supporting local fishers. G Reefs absorb wave energy and protect coastlines from erosion. H Sediment runoff from coastal construction. I Losing the reef would reduce fish habitat and catches, lowering fishers’ income and food supply. J A carbon tax that raises the price of fossil fuels and reduces CO₂ emissions.',
});

// ── 3. Analyze a problem with calculations (2025 Q3) ──
frqs.push({
  id: 'apes-calc-rooftop-solar', questionNumber: 3, title: 'Rooftop Solar for a Household', topic: 'Energy resources, air pollution, and calculations',
  modeledOn: modeled(2025, 3, CALC, 1), timeAllottedMin: 23,
  prompt: 'A household uses 10,800 kWh of electricity per year, all supplied by a coal-fired power plant. The plant releases 1.0 kg of CO₂ for each kWh generated. The household installs rooftop solar panels that cost $18,900 and generate 7,560 kWh per year. Electricity from the utility costs $0.14 per kWh.',
  parts: [
    part('A', 'Identify one air pollutant, other than carbon dioxide, released by burning coal.', [
      pt('apes-calc-rooftop-solar-a1', 'concept', 'Identifies sulfur dioxide, nitrogen oxides, particulate matter, or mercury.', ['identifies ozone (a secondary pollutant) as directly emitted', 'identifies CO₂'], 'Sulfur dioxide.', 'Carbon dioxide.'),
    ]),
    part('B', 'Describe how a scrubber reduces pollution from a coal-fired power plant.', [
      pt('apes-calc-rooftop-solar-b1', 'concept', 'Describes a scrubber spraying exhaust with a substance such as lime slurry that reacts with and removes sulfur dioxide before it leaves the smokestack.', ['says scrubbers remove CO₂'], 'Exhaust passes through a spray of lime slurry that reacts with SO₂ and removes it.', 'It cleans the chimney.'),
    ]),
    part('C', 'Explain how reducing the household’s electricity purchases could reduce acid deposition.', [
      pt('apes-calc-rooftop-solar-c1', 'concept', 'Explains that less coal is burned, so less SO₂ and NOₓ are emitted to form sulfuric and nitric acid in the atmosphere.', ['says less CO₂ causes less acid rain'], 'Less coal burned means less SO₂ and NOₓ, the gases that form sulfuric and nitric acid.', 'There is less pollution.'),
    ]),
    part('D', 'Calculate the percent change in the electricity the household buys from the utility after installing the panels. Show your work.', [
      pt('apes-calc-rooftop-solar-d1', 'calculation', 'Sets up the calculation with the new purchase of 3,240 kWh: (3,240 − 10,800) / 10,800 × 100.', ['divides by the new value'], '(3,240 − 10,800) / 10,800 × 100', '(10,800 − 3,240) / 3,240 × 100'),
      pt('apes-calc-rooftop-solar-d2', 'calculation', 'Calculates a 70% decrease (−70%).', ['reports 233%'], '−70% (a 70% decrease).', '233%.'),
    ]),
    part('E', 'Calculate the mass of CO₂, in kilograms, the household avoids each year. Show your work.', [
      pt('apes-calc-rooftop-solar-e1', 'calculation', 'Sets up 7,560 kWh × 1.0 kg CO₂/kWh.', ['uses 10,800 kWh'], '7,560 kWh × 1.0 kg/kWh', '10,800 × 1.0'),
      pt('apes-calc-rooftop-solar-e2', 'calculation', 'Calculates 7,560 kg of CO₂ per year.', ['reports 3,240 kg'], '7,560 kg CO₂ per year.', '3,240 kg.'),
    ]),
    part('F', 'Propose a realistic action, other than installing solar panels, the household could take to reduce its electricity use.', [
      pt('apes-calc-rooftop-solar-f1', 'solution', 'Proposes a realistic conservation action such as switching to LED bulbs, buying energy-efficient appliances, adding insulation, or adjusting the thermostat.', ['proposes buying more electricity'], 'Replace old appliances with ENERGY STAR models.', 'Use the lights more.'),
    ]),
    part('G', 'Calculate the number of years it will take for the electricity savings to pay for the panels. Show your work.', [
      pt('apes-calc-rooftop-solar-g1', 'calculation', 'Sets up annual savings (7,560 kWh × $0.14 = $1,058.40) and divides the cost by the savings.', ['uses 10,800 kWh for the savings'], '$18,900 ÷ (7,560 × $0.14)', '$18,900 ÷ (10,800 × 0.14)'),
      pt('apes-calc-rooftop-solar-g2', 'calculation', 'Calculates about 17.9 years (accept 18).', ['reports 12.5 years'], '$18,900 ÷ $1,058.40 ≈ 17.9 years.', '12.5 years.'),
    ]),
  ],
  sampleResponse: 'A Sulfur dioxide. B A scrubber sprays the exhaust with lime slurry, which reacts with sulfur dioxide and removes it before the gas leaves the stack. C Buying less electricity means less coal is burned, so less SO₂ and NOₓ are released to form sulfuric and nitric acid. D The household now buys 10,800 − 7,560 = 3,240 kWh; (3,240 − 10,800) / 10,800 × 100 = −70%. E 7,560 kWh × 1.0 kg/kWh = 7,560 kg CO₂ per year. F Replace incandescent bulbs with LEDs. G Savings = 7,560 × $0.14 = $1,058.40 per year; $18,900 ÷ $1,058.40 ≈ 17.9 years.',
});

// ════════════════ Set modeled on the 2026 exam ════════════════

// ── 4. Design an investigation (2026 Q1) ──
frqs.push({
  id: 'apes-design-earthworms', questionNumber: 1, title: 'Invasive Earthworms and Leaf Litter', topic: 'Soil ecosystems · Invasive species and experimental design',
  modeledOn: modeled(2026, 1, DESIGN), timeAllottedMin: 23,
  prompt: 'Northern hardwood forests developed without earthworms after the last ice age, and their soils are covered by a thick layer of leaf litter. Nonnative earthworms, spread by anglers who discard bait, are now invading these forests. Researchers placed mesh bags containing 20.0 g of dry maple leaves on plots with and without invasive earthworms and measured the mass remaining after 12 months (Figure 1). They also counted native tree seedlings per square meter (Figure 2).',
  figures: [
    fig('Figure 1', chart({ title: 'Leaf mass remaining after 12 months', categories: ['No earthworms', 'Earthworms'], series: [{ name: 'Mass remaining (g)', values: [14.2, 5.6], color: BLUE }], ymax: 20, ystep: 4, ylabel: 'Mass (g)', w: 340, h: 250, alt: 'Bar graph of leaf mass remaining after 12 months: 14.2 grams in plots without earthworms and 5.6 grams in plots with earthworms, from 20.0 grams at the start' })),
    tableFigure('Figure 2', ['Plot type', 'Native tree seedlings per m²'], [['No earthworms', '18'], ['Earthworms', '6']]),
  ],
  parts: [
    part('A', 'Describe one characteristic that makes a species likely to become invasive.', [
      pt('apes-design-earthworms-a1', 'concept', 'Describes a trait such as rapid reproduction, generalist diet, tolerance of many conditions, or lack of natural predators in the new range.', ['names a trait of specialists'], 'They reproduce quickly and have no natural predators in the new forest.', 'They are large.'),
    ]),
    part('B', 'Explain how earthworms speed the cycling of nutrients in the forest.', [
      pt('apes-design-earthworms-b1', 'concept', 'Explains that earthworms consume and break down leaf litter, releasing its nutrients into the soil faster.', ['says earthworms add nutrients from outside the ecosystem'], 'They eat the litter and break it into smaller pieces, releasing nitrogen and other nutrients into the soil sooner.', 'They make the soil wet.'),
    ]),
    part('C', 'Based on Figure 1, calculate the mass of leaves lost in the earthworm plots.', [
      pt('apes-design-earthworms-c1', 'data-analysis', 'Calculates 14.4 g lost (20.0 − 5.6).', ['reports 5.6 g'], '20.0 − 5.6 = 14.4 g.', '5.6 g.'),
    ]),
    part('D', 'Based on Figure 2, describe the difference in seedling density between the plot types.', [
      pt('apes-design-earthworms-d1', 'data-analysis', 'Describes that plots with earthworms have fewer seedlings (6 versus 18 per m², one-third as many).', ['reverses the comparison'], 'Earthworm plots have 6 seedlings per m², a third of the 18 in plots without earthworms.', 'There are seedlings in both.'),
    ]),
    part('E', 'Researchers hypothesized that earthworms reduce seedling survival by removing the leaf litter layer. Describe one way the data support this hypothesis.', [
      pt('apes-design-earthworms-e1', 'data-analysis', 'Connects the two figures: the plots where more litter disappeared (earthworm plots) also had far fewer seedlings.', ['uses only one figure'], 'Where earthworms removed most of the litter, seedling density was much lower.', 'Earthworms eat seedlings.'),
    ]),
    part('F', '(i) Identify the independent variable in the leaf-bag experiment. (ii) Identify one variable that should be held constant.', [
      pt('apes-design-earthworms-f1', 'experimental-design', 'Identifies the presence or absence of earthworms.', ['identifies leaf mass'], 'Whether earthworms were present.', 'The mass remaining.'),
      pt('apes-design-earthworms-f2', 'experimental-design', 'Identifies a valid controlled variable, such as starting leaf mass, leaf species, bag mesh size, length of time, or soil type.', ['identifies the dependent variable'], 'The starting mass of leaves in each bag (20.0 g).', 'The number of seedlings.'),
    ]),
    part('G', '(i) Explain why the researchers used several plots of each type rather than one. (ii) Explain how the results might differ if the bags had mesh too small for earthworms to enter.', [
      pt('apes-design-earthworms-g1', 'experimental-design', 'Explains that replication reduces the effect of chance differences between plots and makes results more reliable.', ['says it saves time'], 'Using several plots reduces the chance that one unusual plot skews the results.', 'To make it bigger.'),
      pt('apes-design-earthworms-g2', 'experimental-design', 'Explains that if earthworms could not reach the leaves, mass loss in earthworm plots would be closer to the no-earthworm plots, hiding the effect.', ['says the results would not change'], 'Without earthworm access, both plot types would lose similar mass, so the earthworm effect would not show.', 'The bags would break.'),
    ]),
    part('H', 'Describe one realistic action that could slow the spread of invasive earthworms into new forests.', [
      pt('apes-design-earthworms-h1', 'solution', 'Describes an action such as educating anglers not to dump bait, banning sales of certain bait worms, or cleaning soil from vehicles and equipment.', ['proposes an action that spreads worms'], 'Require bait shops to post signs telling anglers to throw unused worms in the trash.', 'Add more worms.'),
    ]),
  ],
  sampleResponse: 'A Invasive species often reproduce quickly and have no natural predators in their new range. B Earthworms eat and fragment leaf litter, releasing its nutrients into the soil much faster. C 20.0 − 5.6 = 14.4 g. D Plots with earthworms had 6 seedlings per m², one-third of the 18 per m² without earthworms. E The plots where earthworms removed most of the litter also had far fewer seedlings, consistent with litter loss reducing seedling survival. F (i) Presence or absence of earthworms. (ii) The starting mass of leaves (20.0 g). G (i) Several plots reduce the effect of chance differences between individual plots. (ii) If earthworms could not enter the bags, both plot types would lose similar mass, hiding the earthworm effect. H Educate anglers to discard unused bait worms in the trash instead of on the ground.',
});

// ── 5. Analyze a problem and propose a solution (2026 Q2) ──
frqs.push({
  id: 'apes-problem-aquifer', questionNumber: 2, title: 'A Shrinking Aquifer', topic: 'Groundwater depletion and irrigation',
  modeledOn: modeled(2026, 2, PROBLEM), timeAllottedMin: 23,
  prompt: 'A large aquifer beneath a farming region supplies most of the water used for crop irrigation. Figure 1 shows the average depth to the water table measured in wells across the region.',
  figures: [fig('Figure 1', graph({ x: [1980, 2020], y: [0, 70], xstep: 10, ystep: 10, xlabel: '', ylabel: '', xtitle: 'Year', ytitle: 'Depth to water table (m)', curves: [{ pts: [[1980, 18], [1990, 26], [2000, 37], [2010, 49], [2020, 62]] }], dots: [[1980, 18], [1990, 26], [2000, 37], [2010, 49], [2020, 62]].map(([x, y]) => ({ x, y })), w: 380, h: 280, alt: 'Line graph of average depth to the water table: 18 meters in 1980, 26 in 1990, 37 in 2000, 49 in 2010, and 62 in 2020' }))],
  parts: [
    part('A', 'Based on Figure 1, describe the trend in the depth to the water table from 1980 to 2020.', [
      pt('apes-problem-aquifer-a1', 'data-analysis', 'Describes the depth increasing (the water table falling) from about 18 m to 62 m.', ['says the water table rises'], 'The depth increased from 18 m to 62 m, so the water table dropped.', 'It changed.'),
    ]),
    part('B', 'Identify the term for withdrawing groundwater faster than it is recharged.', [
      pt('apes-problem-aquifer-b1', 'concept', 'Identifies aquifer depletion (overdraft or groundwater mining).', ['identifies salinization'], 'Aquifer depletion.', 'Runoff.'),
    ]),
    part('C', 'Explain one reason this aquifer recharges very slowly.', [
      pt('apes-problem-aquifer-c1', 'concept', 'Explains a reason such as low rainfall in the region, impermeable layers above the aquifer, or water taking a long time to percolate through deep soil and rock.', ['says the aquifer is too large'], 'The region gets little rain, and water must percolate slowly through thick layers of soil and rock.', 'The aquifer is old.'),
    ]),
    part('D', 'Describe one environmental consequence of a falling water table, other than reduced water for farms.', [
      pt('apes-problem-aquifer-d1', 'concept', 'Describes a consequence such as land subsidence, streams and wetlands drying up, saltwater intrusion near coasts, or wells going dry.', ['describes a consequence of surface flooding'], 'Springs and streams fed by groundwater dry up, harming aquatic habitat.', 'Less water.'),
    ]),
    part('E', 'Propose a realistic solution farmers could implement to reduce groundwater withdrawals.', [
      pt('apes-problem-aquifer-e1', 'solution', 'Proposes a realistic solution such as drip irrigation, switching to less water-intensive crops, irrigation scheduling with soil-moisture sensors, or xeriscaping.', ['proposes flood irrigation'], 'Switch from center-pivot sprinklers to drip irrigation.', 'Pump more water.'),
    ]),
    part('F', 'Justify the solution in part E by describing an additional benefit other than conserving water.', [
      pt('apes-problem-aquifer-f1', 'solution', 'Describes an additional benefit consistent with part E, such as reduced salinization, lower pumping energy costs, less fertilizer runoff, or higher crop yields.', ['repeats water savings'], 'Drip irrigation applies less water to the surface, reducing salt buildup in the soil.', 'It saves water.'),
    ]),
    part('G', 'Explain how irrigation in a dry climate can lead to soil salinization.', [
      pt('apes-problem-aquifer-g1', 'concept', 'Explains that irrigation water contains dissolved salts; as water evaporates in the hot, dry climate, the salts are left behind and accumulate in the soil.', ['says salt is added as fertilizer'], 'Irrigation water carries small amounts of salt; evaporation leaves the salt in the soil, where it builds up over time.', 'The ocean floods the field.'),
    ]),
    part('H', 'Identify one crop or diet change that would reduce water use in agriculture.', [
      pt('apes-problem-aquifer-h1', 'solution', 'Identifies growing drought-tolerant crops (such as sorghum instead of corn) or eating less meat, especially beef.', ['identifies a water-intensive crop'], 'Grow sorghum instead of corn.', 'Grow rice.'),
    ]),
    part('I', 'Describe one way that pumping groundwater uses energy and contributes to air pollution.', [
      pt('apes-problem-aquifer-i1', 'concept', 'Describes that pumps run on electricity or diesel, and a deeper water table requires more energy, often from fossil fuels that release CO₂ and other pollutants.', ['says water releases CO₂'], 'Pumps powered by diesel or coal electricity must lift water farther as the table drops, burning more fuel.', 'Pumps are noisy.'),
    ]),
    part('J', 'Describe one policy approach a state government could use to manage the aquifer sustainably.', [
      pt('apes-problem-aquifer-j1', 'solution', 'Describes a policy such as pumping limits or permits, metering and pricing groundwater, or subsidies for efficient irrigation.', ['describes an action individuals take with no policy'], 'Require meters on wells and set annual pumping limits for each farm.', 'Tell farmers to be careful.'),
    ]),
  ],
  sampleResponse: 'A The depth to the water table increased from about 18 m in 1980 to 62 m in 2020, so the water table has been dropping steadily. B Aquifer depletion. C The region receives little rainfall, and recharge water must percolate slowly through thick soil and rock layers. D Groundwater-fed streams and wetlands dry up, harming aquatic habitats. E Switch to drip irrigation. F Drip irrigation reduces soil salinization because less water evaporates from the surface. G Irrigation water contains dissolved salts; in a dry climate the water evaporates and the salts accumulate in the soil. H Grow drought-tolerant sorghum instead of corn. I Pumps run on diesel or fossil-fuel electricity, and as the water table drops they need more energy, releasing more CO₂. J Require meters on wells and set pumping limits for each farm.',
});

// ── 6. Analyze a problem with calculations (2026 Q3) ──
frqs.push({
  id: 'apes-calc-landfill', questionNumber: 3, title: 'A City’s Landfill', topic: 'Solid waste, recycling, and calculations',
  modeledOn: modeled(2026, 3, CALC), timeAllottedMin: 23,
  prompt: 'A city of 120,000 people generates 2.1 kg of municipal solid waste per person per day. All of it currently goes to a landfill with 1,200,000 metric tons of remaining capacity (1 metric ton = 1,000 kg). The city is considering a recycling and composting program that would divert 35% of its waste from the landfill.',
  parts: [
    part('A', 'Identify the gas produced by anaerobic decomposition in landfills that is a potent greenhouse gas.', [
      pt('apes-calc-landfill-a1', 'concept', 'Identifies methane (CH₄).', ['identifies ozone'], 'Methane.', 'Oxygen.'),
    ]),
    part('B', 'Describe one feature of a modern sanitary landfill that protects groundwater.', [
      pt('apes-calc-landfill-b1', 'concept', 'Describes a feature such as a clay or plastic liner, or a leachate collection system that prevents leachate from reaching groundwater.', ['describes a feature unrelated to groundwater'], 'A clay and plastic liner with pipes that collect leachate for treatment.', 'A fence.'),
    ]),
    part('C', 'Explain why composting food waste reduces methane emissions compared with landfilling it.', [
      pt('apes-calc-landfill-c1', 'concept', 'Explains that composting is aerobic decomposition, which produces CO₂ rather than methane, while buried landfill waste decomposes anaerobically.', ['says composting stops decomposition'], 'Compost piles are aerated, so microbes break down food aerobically and produce CO₂ instead of methane.', 'Compost smells better.'),
    ]),
    part('D', 'Calculate the mass of waste, in metric tons, the city sends to the landfill each year without the program. Show your work.', [
      pt('apes-calc-landfill-d1', 'calculation', 'Sets up 120,000 people × 2.1 kg/person/day × 365 days ÷ 1,000 kg/t.', ['forgets to convert kg to t'], '120,000 × 2.1 × 365 ÷ 1,000', '120,000 × 2.1 × 365'),
      pt('apes-calc-landfill-d2', 'calculation', 'Calculates 91,980 metric tons per year (accept about 92,000).', ['reports 91,980,000 t'], '91,980 t per year.', '91,980,000 t.'),
    ]),
    part('E', 'Calculate the mass of waste, in metric tons per year, that the program would divert. Show your work.', [
      pt('apes-calc-landfill-e1', 'calculation', 'Sets up 0.35 × (the annual total from part D).', ['uses 35 instead of 0.35'], '0.35 × 91,980 t', '35 × 91,980'),
      pt('apes-calc-landfill-e2', 'calculation', 'Calculates about 32,193 t per year (accept 32,000), consistent with part D.', ['reports the remaining 65%'], '32,193 t per year.', '59,787 t.'),
    ]),
    part('F', 'Propose a realistic action, other than recycling and composting, that would reduce the amount of waste the city generates.', [
      pt('apes-calc-landfill-f1', 'solution', 'Proposes source reduction, such as a pay-as-you-throw fee, a ban or fee on single-use bags, or encouraging reusable containers.', ['proposes incineration (does not reduce generation)'], 'Charge households per bag of trash (pay-as-you-throw).', 'Build a bigger landfill.'),
    ]),
    part('G', 'Calculate how many more years the landfill will last with the program than without it. Show your work.', [
      pt('apes-calc-landfill-g1', 'calculation', 'Sets up the lifetimes: 1,200,000 ÷ 91,980 and 1,200,000 ÷ (91,980 − 32,193), then subtracts.', ['divides by the diverted amount'], '(1,200,000 ÷ 59,787) − (1,200,000 ÷ 91,980)', '1,200,000 ÷ 32,193'),
      pt('apes-calc-landfill-g2', 'calculation', 'Calculates about 7.0 more years (20.1 − 13.0).', ['reports 37 years'], '20.1 − 13.0 ≈ 7.0 more years.', '37.3 years.'),
    ]),
  ],
  sampleResponse: 'A Methane. B A clay and plastic liner with a leachate collection system keeps leachate out of groundwater. C Composting is aerobic, so microbes produce CO₂ rather than the methane formed when buried waste decomposes anaerobically. D 120,000 × 2.1 kg × 365 = 91,980,000 kg = 91,980 t per year. E 0.35 × 91,980 = 32,193 t per year. F Charge households per bag of trash (pay-as-you-throw). G Without the program: 1,200,000 ÷ 91,980 ≈ 13.0 years. With it: 1,200,000 ÷ 59,787 ≈ 20.1 years. The landfill lasts about 7.0 more years.',
});

// Demo data for the grading flow on localhost (see ap-grader.js canned mode).
const canned = {
  frqId: 'apes-design-stream-nitrate',
  transcript: `A The stream gives people fish to eat.

B Nitrate makes algae grow a lot. When the algae die, bacteria decompose them and use up the oxygen.

C 7

D As nitrate goes up, the number of EPT taxa goes down.

E Oxygen is lower downstream.

F (i) Is the number of EPT taxa different above and below the ditch? (ii) The number of EPT taxa.

G (i) More species means some of them will probably survive the spill and help the stream recover. (ii) Heavy rain would wash more fertilizer into the stream, so nitrate would be higher.

H Plant grass buffer strips along the stream.`,
  evidence: {
    'apes-design-stream-nitrate-a1': 'The stream gives people fish to eat.', 'apes-design-stream-nitrate-b1': 'When the algae die, bacteria decompose them and use up the oxygen.',
    'apes-design-stream-nitrate-c1': '7', 'apes-design-stream-nitrate-d1': 'As nitrate goes up, the number of EPT taxa goes down.',
    'apes-design-stream-nitrate-f1': 'Is the number of EPT taxa different above and below the ditch?', 'apes-design-stream-nitrate-f2': 'The number of EPT taxa.',
    'apes-design-stream-nitrate-g1': 'some of them will probably survive the spill', 'apes-design-stream-nitrate-g2': 'Heavy rain would wash more fertilizer into the stream',
    'apes-design-stream-nitrate-h1': 'Plant grass buffer strips along the stream.',
  },
  missed: { 'apes-design-stream-nitrate-e1': 'Saying oxygen is lower downstream does not connect the data to EPT loss. Point out that Sites 4 and 5 fall below the 5 mg/L threshold and are also the sites with the fewest taxa.' },
  priorityFix: 'When a part asks how data support a hypothesis, cite the specific values and tie them to the claim: here, the sites below 5 mg/L dissolved oxygen are exactly the sites with the fewest EPT taxa.',
  sampleResponseComparison: 'Every part except E matches the sample response. The sample cites the dissolved oxygen values at Sites 4 and 5 and links them to the 5 mg/L threshold.',
};

module.exports = { course: 'ap-environmental-science', frqs, canned };
