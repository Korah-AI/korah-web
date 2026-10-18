// AP Environmental Science units 1–5: ecosystems, biodiversity, populations, Earth systems
// and resources, and land and water use. Block format with "-" in the second field; formulas
// use the ce{…} notation in chemtext.cjs. Data in figures are hypothetical unless stated.
const { graph, chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');
const { chem } = require('./chemtext.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6', AMBER = '#f59e0b', GREEN = '#16a34a';
const r2 = n => Math.round(n * 100) / 100;
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];

function foodWeb() {
  const nodes = { Grass: [70, 210], Shrubs: [250, 210], Grasshopper: [40, 140], Rabbit: [150, 140], Deer: [280, 140], Mouse: [70, 75], Snake: [150, 20], Hawk: [60, 20], Wolf: [260, 50] };
  const links = [['Grass', 'Grasshopper'], ['Grass', 'Rabbit'], ['Shrubs', 'Rabbit'], ['Shrubs', 'Deer'], ['Grass', 'Mouse'], ['Grasshopper', 'Mouse'], ['Mouse', 'Snake'], ['Mouse', 'Hawk'], ['Snake', 'Hawk'], ['Rabbit', 'Hawk'], ['Rabbit', 'Wolf'], ['Deer', 'Wolf']];
  const items = [];
  for (const [a, b] of links) {
    const [x1, y1] = nodes[a], [x2, y2] = nodes[b], d = Math.hypot(x2 - x1, y2 - y1), k = 14 / d;
    items.push(['arrow', r2(x1 + (x2 - x1) * k), r2(y1 + (y2 - y1) * k), r2(x2 - (x2 - x1) * k), r2(y2 - (y2 - y1) * k), { width: 1.6 }]);
  }
  for (const [n, [x, y]] of Object.entries(nodes)) items.push(['rect', x - 38, y - 10, 76, 20, { fill: true, width: 1 }], text(x, y + 4, n, { size: 11 }));
  return draw(340, 230, 'A terrestrial food web. Arrows point in the direction energy flows. Grass is eaten by grasshoppers, rabbits, and mice. Shrubs are eaten by rabbits and deer. Grasshoppers are eaten by mice. Mice are eaten by snakes and hawks. Snakes and rabbits are eaten by hawks. Rabbits and deer are eaten by wolves', items);
}

function pyramid() {
  const levels = [['Tertiary consumers', '20'], ['Secondary consumers', '200'], ['Primary consumers', '2,000'], ['Producers', '20,000']];
  return draw(420, 200, 'Energy pyramid with four trophic levels. Producers: 20,000 kilocalories per square meter per year. Primary consumers: 2,000. Secondary consumers: 200. Tertiary consumers: 20', levels.flatMap(([l, v], i) => {
    const w = 160 + i * 80, y = 20 + i * 42;
    return [['rect', 210 - w / 2, y, w, 36, { fill: i === 3 ? GREEN : true, color: i === 3 ? GREEN : 'currentColor', width: 1.4 }], text(210, y + 23, `${l}: ${v}`, { size: 11, color: i === 3 ? '#fff' : 'currentColor' })];
  }).concat([text(210, 196, 'kcal/m²/yr', { size: 11 })]));
}

function survivorship() {
  const X = p => 50 + p * 3, Y = l => 190 - l * 55; // p: % of lifespan, l: log10(survivors)
  const curve = f => 'M' + Array.from({ length: 101 }, (_, i) => `${X(i)} ${r2(Y(f(i)))}`).join(' L');
  return draw(380, 230, 'Survivorship curves on a logarithmic scale, plotting survivors out of 1,000 against percentage of maximum lifespan. Curve I stays near 1,000 until late in life and then drops steeply. Curve II declines in a straight line on the log scale. Curve III drops steeply at the start of life and then levels off with few survivors', [
    ['line', 50, 190, 360, 190], ['line', 50, 190, 50, 20], ...[[0, '1'], [1, '10'], [2, '100'], [3, '1,000']].flatMap(([l, s]) => [text(44, Y(l) + 4, s, { anchor: 'end', size: 10 }), ['line', 50, Y(l), 350, Y(l), { width: 0.4, dash: true }]]),
    ['path', curve(p => 3 - 3 * (p / 100) ** 6), { color: BLUE, width: 2.2 }], ['path', curve(p => 3 - 3 * p / 100), { color: PINK, width: 2.2 }], ['path', curve(p => 3 - 2.6 * (1 - Math.exp(-p / 8)) - 0.4 * p / 100), { color: AMBER, width: 2.2 }],
    text(300, 34, 'I', { bold: true }), text(210, 96, 'II', { bold: true }), text(110, 150, 'III', { bold: true }),
    text(205, 214, 'Percentage of maximum lifespan', { size: 11 }), text(54, 14, 'Survivors per 1,000 (log scale)', { size: 11, anchor: 'start' }),
  ]);
}

function agePyramids() {
  const shapes = { X: [10, 9, 8, 6.5, 5, 3.5, 2.2, 1.2], Y: [6, 6, 6, 5.8, 5.6, 5, 4, 2.6], Z: [3.6, 4.2, 5, 5.8, 6.2, 6, 5, 3.6] };
  const items = [];
  Object.entries(shapes).forEach(([name, vals], k) => {
    const cx = 70 + k * 130;
    vals.forEach((v, i) => { const y = 170 - i * 18, w = v * 5; items.push(['rect', cx - w, y, w, 15, { fill: BLUE, color: BLUE, width: 0.1 }], ['rect', cx, y, w, 15, { fill: PINK, color: PINK, width: 0.1 }]); });
    items.push(['line', cx, 36, cx, 188, { width: 1 }], text(cx, 208, name, { bold: true, size: 14 }));
  });
  items.push(text(195, 24, 'Age groups from 0–9 (bottom) to 70–79 (top); males left, females right', { size: 10 }));
  return draw(390, 218, 'Age-structure diagrams for three countries. Country X has a very wide base that narrows steadily toward the top, like a pyramid. Country Y has nearly equal widths through middle age, like a column. Country Z is narrower at the base than in the middle age groups', items);
}

function soilProfile() {
  const layers = [['O', 20, '#6b4f2a'], ['A', 40, '#8a6a3f'], ['B', 50, '#b08a57'], ['C', 45, '#c9b08a'], ['R', 35, '#8f8f8f']];
  let y = 20;
  const items = [];
  for (const [l, h, c] of layers) { items.push(['rect', 120, y, 160, h, { fill: c, color: c, width: 0.1 }], text(110, y + h / 2 + 5, l, { anchor: 'end', bold: true, size: 13 })); y += h; }
  return draw(400, 220, 'A soil profile with five horizons from top to bottom: O, a thin dark layer of organic matter; A, topsoil; B, subsoil; C, weathered parent material; and R, bedrock', items.concat([text(290, 34, 'leaf litter, humus', { anchor: 'start', size: 10 }), text(290, 64, 'topsoil', { anchor: 'start', size: 10 }), text(290, 108, 'subsoil', { anchor: 'start', size: 10 }), text(290, 156, 'parent material', { anchor: 'start', size: 10 }), text(290, 196, 'bedrock', { anchor: 'start', size: 10 })]));
}

function rainShadow() {
  return draw(400, 200, 'Air moves from the ocean on the left over a mountain range toward the right. Side A of the mountain faces the incoming wind; side B is on the far side', [
    ['path', 'M20 180 H90 L200 50 L310 180 H380', { fill: true, width: 2 }], ['rect', 20, 180, 70, 10, { fill: BLUE, color: BLUE, width: 0.1 }], text(55, 176, 'ocean', { size: 10 }),
    ['arrow', 30, 150, 90, 130], ['arrow', 110, 120, 170, 60], ['arrow', 230, 60, 300, 120], ['path', 'M110 40 q10 -14 22 -4 q12 -10 22 2 q12 2 6 12 h-46 q-10 0 -4 -10z', { fill: true }],
    ...[0, 1, 2, 3].map(i => ['line', 118 + i * 9, 58, 114 + i * 9, 70, { color: BLUE, width: 1.4 }]),
    text(130, 150, 'A', { bold: true, size: 15 }), text(270, 150, 'B', { bold: true, size: 15 }), text(330, 100, 'wind →', { size: 11 }),
  ]);
}

const figures = {
  foodWeb: foodWeb(),
  pyramid: pyramid(),
  biomes: table(['Location', 'Mean annual temperature', 'Annual precipitation', 'Other observations'], [
    ['W', '27°C, little seasonal change', '250 cm', 'Nutrient-poor soils; many layers of vegetation'],
    ['X', '−12°C', '20 cm', 'Permafrost; low-growing mosses and shrubs'],
    ['Y', '22°C, hot days and cool nights', '15 cm', 'Plants with waxy leaves and deep roots'],
    ['Z', '3°C, long cold winters', '50 cm', 'Dense coniferous forest; acidic soils'],
  ], 'Table of four locations. W: mean annual temperature 27 °C with little seasonal change, 250 cm of precipitation, nutrient-poor soils and many layers of vegetation. X: −12 °C, 20 cm, permafrost with low-growing mosses and shrubs. Y: 22 °C with hot days and cool nights, 15 cm, plants with waxy leaves and deep roots. Z: 3 °C with long cold winters, 50 cm, dense coniferous forest and acidic soils'),
  npp: chart({ title: 'Net primary productivity (g/m²/yr)', categories: ['Tropical rainforest', 'Estuary', 'Temperate forest', 'Grassland', 'Open ocean', 'Desert'], series: [{ name: 'NPP', values: [2200, 1800, 1200, 600, 125, 90] }], ymax: 2400, ystep: 400, w: 470,
    alt: 'Bar graph of net primary productivity in grams per square meter per year: tropical rainforest 2,200; estuary 1,800; temperate forest 1,200; grassland 600; open ocean 125; desert 90' }),
  diversity: table(['Species', 'Community 1', 'Community 2'], [['A', '25', '85'], ['B', '25', '5'], ['C', '25', '5'], ['D', '25', '5']], 'Table of the number of individuals of four species, A through D, in two communities. Community 1 has 25 of each species. Community 2 has 85 of species A and 5 each of species B, C, and D'),
  islands: graph({ x: [0, 100], y: [0, 60], xstep: 20, ystep: 10, xlabel: '', ylabel: '', xtitle: 'Island area (km²)', ytitle: 'Number of species', w: 380,
    curves: [{ fn: a => 12 * Math.log(1 + a / 3), from: 0, to: 100 }, { fn: a => 7 * Math.log(1 + a / 3), from: 0, to: 100, color: PINK }],
    notes: [{ x: 70, y: 46, text: 'near the mainland' }, { x: 70, y: 18, text: 'far from the mainland' }],
    alt: 'Graph of number of species against island area for islands near the mainland and far from it. Both curves rise steeply for small islands and then more slowly. At every island size, islands near the mainland have more species: at 100 km², about 42 species near versus about 25 far away' }),
  tolerance: graph({ x: [0, 40], y: [0, 100], xstep: 5, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Water temperature (°C)', ytitle: 'Population size (relative)', w: 380,
    curves: [{ fn: t => 100 * Math.exp(-(((t - 20) / 6) ** 2)), from: 5, to: 35 }, ...[11, 29].map(x => ({ pts: [[x, 0], [x, 100]], dash: true, color: PINK })), ...[5, 35].map(x => ({ pts: [[x, 0], [x, 100]], dash: true, color: 'currentColor' }))],
    notes: [{ x: 15.2, y: 92, text: 'P' }, { x: 6.2, y: 92, text: 'Q' }, { x: 30.2, y: 92, text: 'Q' }, { x: 1, y: 92, text: 'R' }, { x: 36, y: 92, text: 'R' }],
    alt: 'Range-of-tolerance curve for a fish species. Population size is greatest near 20 °C. Region P, between 11 °C and 29 °C, is the optimal range. Regions Q, from 5 to 11 °C and from 29 to 35 °C, are zones of physiological stress with few individuals. Regions R, below 5 °C and above 35 °C, are zones of intolerance where none survive' }),
  survivorship: survivorship(),
  logistic: graph({ x: [0, 20], y: [0, 1200], xstep: 4, ystep: 200, xlabel: '', ylabel: '', xtitle: 'Time (years)', ytitle: 'Population size', w: 380,
    curves: [{ fn: t => 1000 / (1 + 49 * Math.exp(-0.5 * t)), from: 0, to: 20 }, { pts: [[0, 1000], [20, 1000]], dash: true, color: PINK }],
    dots: [{ x: 4, y: 1000 / (1 + 49 * Math.exp(-2)) }, { x: 7.78, y: 500 }, { x: 16, y: 1000 / (1 + 49 * Math.exp(-8)) }],
    notes: [{ x: 4.3, y: 190, text: 'A' }, { x: 8.1, y: 470, text: 'B' }, { x: 16, y: 1060, text: 'C' }, { x: 0.3, y: 1040, text: 'K = 1,000' }],
    alt: 'Logistic growth curve of a population over 20 years. The population starts near 20, grows slowly at first (point A at year 4), grows fastest at about 500 individuals (point B near year 8), and levels off near the carrying capacity of 1,000 (point C at year 16). A dashed line marks the carrying capacity' }),
  agePyramids: agePyramids(),
  transition: chart({ type: 'line', title: 'Birth and death rates (per 1,000 people per year)', categories: ['Stage 1', 'Stage 2', 'Stage 3', 'Stage 4'], series: [{ name: 'Birth rate', values: [40, 40, 25, 12] }, { name: 'Death rate', values: [38, 15, 10, 10] }], ymax: 50, ystep: 10,
    alt: 'Line graph of birth and death rates across four stages of the demographic transition. Birth rates: 40, 40, 25, and 12 per 1,000. Death rates: 38, 15, 10, and 10 per 1,000' }),
  atmosphere: graph({ x: [160, 320], y: [0, 100], xstep: 20, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Temperature (K)', ytitle: 'Altitude (km)', w: 380,
    curves: [{ pts: [[288, 0], [217, 12], [217, 20], [271, 50], [187, 85], [233, 100]] }, ...[12, 50, 85].map(a => ({ pts: [[160, a], [320, a]], dash: true, color: 'currentColor' }))],
    notes: [{ x: 290, y: 5, text: 'Layer 1' }, { x: 290, y: 30, text: 'Layer 2' }, { x: 290, y: 66, text: 'Layer 3' }, { x: 290, y: 92, text: 'Layer 4' }],
    alt: 'Graph of temperature against altitude through four atmospheric layers separated by dashed lines at 12, 50, and 85 km. In layer 1, temperature falls from 288 K (15 °C) at the surface to 217 K (−56 °C) at 12 km. In layer 2, it stays near 217 K and then rises to about 271 K (−2 °C) at 50 km. In layer 3, it falls to about 187 K (−86 °C) at 85 km. In layer 4, it rises again' }),
  soil: soilProfile(),
  texture: table(['Sample', 'Sand (%)', 'Silt (%)', 'Clay (%)'], [['1', '85', '10', '5'], ['2', '40', '40', '20'], ['3', '10', '30', '60']], 'Table of soil texture for three samples. Sample 1: 85 percent sand, 10 percent silt, 5 percent clay. Sample 2: 40 percent sand, 40 percent silt, 20 percent clay. Sample 3: 10 percent sand, 30 percent silt, 60 percent clay'),
  rainShadow: rainShadow(),
  irrigation: table(['Irrigation method', 'Approximate efficiency'], [['Flood', '80%'], ['Furrow', '65%'], ['Spray', '75%'], ['Drip', '95%']], 'Table of the approximate water efficiency of irrigation methods: flood 80 percent, furrow 65 percent, spray 75 percent, and drip 95 percent'),
  feed: chart({ title: 'Grain needed to produce 1 kg of meat (kg)', categories: ['Beef', 'Pork', 'Chicken', 'Farmed fish'], series: [{ name: 'Grain', values: [7, 4, 2, 1.5] }], ymax: 8, ystep: 2,
    alt: 'Bar graph of the approximate kilograms of grain needed to produce one kilogram of meat: beef 7, pork 4, chicken 2, and farmed fish 1.5' }),
};

const source = chem(String.raw`
@ 1 | - | Food webs | foodWeb
In the food web shown, which organism occupies more than one trophic level?
* The hawk
- The deer
- The grasshopper
- The rabbit
= The hawk eats mice and rabbits (making it a secondary consumer) and snakes, which eat mice (making it a tertiary consumer). The deer, grasshopper, and rabbit eat only producers.

@ 1 | - | Food webs | foodWeb
Wolves are removed from the ecosystem shown. Which change is most likely in the following years?
* The deer population increases, and the shrub population decreases.
- The deer population decreases, and the shrub population increases.
- The grass population increases because there are fewer rabbits.
- The snake population decreases because there are fewer wolves.
= Without wolves, predation on deer and rabbits falls, so those herbivores increase and consume more shrubs. A predator's removal can cascade down through several trophic levels.

@ 1 | - | Energy flow | pyramid
Approximately what percentage of the energy at each trophic level is transferred to the next level in the pyramid shown?
* \(10\%\)
- \(90\%\)
- \(1\%\)
- \(50\%\)
= Each level holds one tenth of the energy of the level below, for example \(\tfrac{2{,}000}{20{,}000}\). The rest is used for cellular respiration and lost as heat, or never eaten or digested.

@ 1 | - | Energy flow | pyramid
A person eats \(1\) kg of beef or \(1\) kg of grain. Based on the pyramid shown, which statement best explains why a diet based on grain can feed more people from the same farmland?
* Eating producers directly avoids the roughly \(90\%\) energy loss that occurs when crops are fed to livestock.
- Grain contains more energy per kilogram than beef.
- Cattle store all of the energy they eat in their muscles.
- Producers use less sunlight than consumers.
= Energy available to humans who eat grain-fed animals has passed through one more trophic level. Each transfer loses about 90 percent of the energy, mostly as heat from respiration.

@ 1 | - | Primary productivity
In a forest, gross primary productivity is \(3{,}200\text{ g/m}^2\text{/yr}\), and the producers use \(1{,}100\text{ g/m}^2\text{/yr}\) for cellular respiration. What is the net primary productivity?
* \(2{,}100\text{ g/m}^2\text{/yr}\)
- \(4{,}300\text{ g/m}^2\text{/yr}\)
- \(3{,}200\text{ g/m}^2\text{/yr}\)
- \(1{,}100\text{ g/m}^2\text{/yr}\)
= \(\text{NPP}=\text{GPP}-R_A=3{,}200-1{,}100=2{,}100\). NPP is the energy available to consumers as biomass.

@ 1 | - | Primary productivity | npp
Which statement best explains why the open ocean has such low net primary productivity per square meter, even though it receives abundant sunlight?
* Surface waters of the open ocean are poor in nutrients, especially nitrogen and phosphorus, which limits phytoplankton growth.
- Phytoplankton cannot photosynthesize in salt water.
- Light cannot penetrate the ocean surface.
- Ocean water is too warm for photosynthesis.
= Without upwelling or runoff, nutrients sink below the sunlit zone. Estuaries, by contrast, receive nutrients from rivers, which is why their productivity rivals that of rainforests.

@ 1 | - | Primary productivity | npp
Although the open ocean has a very low productivity per square meter, it accounts for a large share of Earth's total net primary productivity. Which statement explains this?
* The open ocean covers a much larger area than any land biome.
- The open ocean has the highest productivity per square meter.
- Ocean producers are larger than land plants.
- The graph shows total productivity, not productivity per area.
= Total productivity is productivity per area multiplied by area. The open ocean covers more than half of Earth's surface.

@ 1 | - | Biomes | biomes
Which location in the table is most likely a tropical rainforest?
* W
- X
- Y
- Z
= Tropical rainforests are warm year-round with very heavy rainfall. Rapid decomposition and uptake leave the soils nutrient-poor, while the vegetation forms many layers.

@ 1 | - | Biomes | biomes
Which pair correctly matches locations in the table with biomes?
* X is tundra, and Z is boreal forest (taiga).
- X is boreal forest, and Z is tundra.
- Y is temperate grassland, and Z is temperate deciduous forest.
- W is a savanna, and Y is a chaparral.
= Permafrost and low-growing plants indicate tundra. Long cold winters with dense coniferous trees and acidic soils indicate taiga. Location Y, with very little rain and drought-adapted plants, is a desert.

@ 1 | - | Nitrogen cycle
Which process converts atmospheric ce{N2} into a form that plants can use?
* Nitrogen fixation, carried out by bacteria such as those in the root nodules of legumes
- Denitrification, carried out by bacteria in wet soils
- Ammonification, carried out by decomposers
- Assimilation by plant leaves
= Nitrogen-fixing bacteria convert ce{N2} into ammonia or ammonium. Lightning and the industrial production of fertilizer also fix nitrogen.

@ 1 | - | Nitrogen cycle
Which process returns nitrogen from the soil to the atmosphere?
* Denitrification, in which bacteria convert nitrate to ce{N2} gas
- Nitrification, in which bacteria convert ammonium to nitrate
- Nitrogen fixation, in which bacteria convert ce{N2} to ammonia
- Assimilation, in which plants take up nitrate
= Denitrifying bacteria thrive in waterlogged, low-oxygen soils, where they use nitrate in place of oxygen and release nitrogen gas.

@ 1 | - | Phosphorus cycle
Which statement best explains why phosphorus is often the limiting nutrient in freshwater ecosystems?
* The phosphorus cycle has no significant atmospheric component, and phosphorus is released slowly by the weathering of rock.
- Phosphorus is rapidly lost to the atmosphere.
- Bacteria convert phosphorus into a gas.
- Organisms need more phosphorus than any other element.
= Because phosphorus is not stored in the air, it enters ecosystems mainly through weathering, which is slow. Adding phosphate from fertilizers or detergents can therefore cause algal blooms.

@ 1 | - | Carbon cycle
Which reservoir stores the most carbon for the longest time?
* Sedimentary rock, such as limestone
- The atmosphere
- Living plants
- Surface ocean water
= Carbon in sedimentary rock and fossil fuels can remain for millions of years. Burning fossil fuels moves this long-stored carbon quickly into the atmosphere.

@ 1 | - | Carbon cycle
Which pair of processes moves carbon in opposite directions between the atmosphere and living organisms?
* Photosynthesis removes ce{CO2} from the air, and cellular respiration returns it.
- Combustion and respiration both remove ce{CO2} from the air.
- Photosynthesis and decomposition both remove ce{CO2} from the air.
- Respiration and sedimentation both add ce{CO2} to the air.
= Photosynthesis fixes carbon into sugars, and organisms release it by breaking those sugars down. Decomposition and combustion also release carbon.

@ 1 | - | Hydrologic cycle
Which process transfers water from the leaves of plants to the atmosphere?
* Transpiration
- Infiltration
- Condensation
- Runoff
= Plants release water vapor through their stomata. Together with evaporation, it is called evapotranspiration, which is a major source of moisture in rainforests.

@ 1 | - | Species interactions
Remora fish attach to sharks and eat scraps of the sharks' meals, apparently without affecting the sharks. Which type of relationship is this?
* Commensalism
- Mutualism
- Parasitism
- Competition
= In commensalism, one species benefits while the other is unaffected. In mutualism, both benefit; in parasitism, one is harmed.

@ 1 | - | Species interactions
Two warbler species feed on insects in the same spruce trees, but one feeds near the tops of the trees and the other near the trunk. Which concept does this illustrate?
* Resource partitioning, which reduces competition
- Mutualism, which benefits both species
- Predation, which limits both populations
- Competitive exclusion, in which one species is eliminated
= Dividing a resource by location or timing allows similar species to coexist. Without partitioning, one species might outcompete the other.

@ 1 | - | Trophic levels
In a pond ecosystem, which organism is a primary consumer?
* Zooplankton that eat algae
- Algae that photosynthesize
- Bass that eat small fish
- Bacteria that decompose dead matter
= Primary consumers eat producers. Algae are producers, bass are higher-level consumers, and bacteria are decomposers.

@ 1 | - | Ecosystem productivity
Which change would most likely increase the gross primary productivity of a lake?
* Increased sunlight reaching the water because sediment has settled out
- Increased cloudiness
- A decrease in nitrogen and phosphorus inputs
- Colder water temperatures
= Photosynthesis is limited by light and nutrients. Clearer water allows more light to reach phytoplankton and submerged plants.

@ 1 | - | Energy flow
Which statement best explains why food chains rarely have more than four or five trophic levels?
* So little energy remains at the top levels that it cannot support another population.
- Top predators are always too large to be eaten.
- Matter cannot be recycled through more levels.
- Producers cannot support more than four consumers.
= With about 10 percent passing to each level, a fifth level receives roughly \(0.01\%\) of the energy fixed by producers.

@ 1 | - | Biogeochemical cycles
A farmer applies nitrogen fertilizer before a heavy rainstorm. Where is much of the nitrate most likely to end up?
* In nearby streams and groundwater, because nitrate is soluble and leaches easily
- In the atmosphere as ce{CO2}
- In the bedrock as minerals
- In the crops, because nitrate is not water soluble
= Nitrate ions dissolve in water and are not held well by soil particles. Runoff and leaching carry them into waterways, where they can cause eutrophication.

@ 1 | - | Biomes
Which factor most directly determines the distribution of terrestrial biomes around the world?
* Temperature and precipitation
- The number of species present
- The type of animals present
- The depth of the soil
= Climate determines which plants can grow, and the plants define the biome. Latitude, elevation, and ocean currents affect climate.

@ 1 | - | Aquatic biomes
Which aquatic ecosystem is characterized by a mix of fresh and salt water, high productivity, and its role as a nursery for many fish?
* Estuary
- Open ocean
- Coral reef
- Freshwater lake
= Where rivers meet the sea, estuaries receive nutrients from land and support salt marshes and mangroves. Many commercially important fish spend their early lives there.

@ 2 | - | Biodiversity | diversity
Which statement correctly compares the two communities in the table?
* They have the same species richness, but community 1 has greater species evenness and therefore greater diversity.
- Community 2 has greater species richness.
- They have the same diversity, because they contain the same species.
- Community 2 has greater diversity because it has more individuals of species A.
= Richness is the number of species, four in each. Evenness describes how equally individuals are distributed among species. Community 2 is dominated by species A.

@ 2 | - | Biodiversity | diversity
A disease that kills most individuals of species A spreads into both communities in the table. Which community is more likely to maintain its overall function?
* Community 1, because no single species dominates it
- Community 2, because it has more individuals of species A
- Both are equally affected, because both contain species A
- Neither, because all four species would die
= In community 1, losing species A removes only a quarter of the individuals. In community 2, it removes 85 percent, so the community is much less resilient.

@ 2 | - | Island biogeography | islands
Which conclusion is best supported by the graph?
* Larger islands and islands closer to the mainland support more species.
- Island size has no effect on the number of species.
- Islands far from the mainland have more species because there is less competition.
- The number of species increases at the same rate for all island sizes.
= Larger islands offer more habitats and support larger populations, which lowers extinction rates. Closer islands receive more immigrants. Habitat fragments act like islands in the same way.

@ 2 | - | Island biogeography | islands
A forest is cut into small, isolated patches by roads and farmland. Based on the graph, what is the most likely effect on the forest's species?
* Each patch will lose species over time, because small, isolated areas have higher extinction rates and fewer immigrants.
- Each patch will gain species because of increased edge habitat.
- The number of species will remain the same, because the forest still exists.
- Only the number of producers will change.
= Habitat fragmentation turns continuous habitat into "islands." Wildlife corridors connecting patches can reduce this loss by allowing movement between them.

@ 2 | - | Range of tolerance | tolerance
The fish population shown is exposed to water at \(32^\circ\text{C}\). Which response is expected?
* Individuals experience physiological stress, so growth and reproduction decline.
- The population grows at its maximum rate.
- All of the fish die immediately.
- The fish are unaffected because they are within their range of tolerance.
= \(32^\circ\text{C}\) lies in zone Q, a zone of physiological stress. Individuals can survive there but with reduced growth, reproduction, and resistance to disease.

@ 2 | - | Range of tolerance | tolerance
Climate change raises the average water temperature in the fish's habitat from \(20^\circ\text{C}\) to \(30^\circ\text{C}\). Which response by the species is most likely?
* Its population declines, or it shifts its range toward cooler water if it can.
- Its population increases, because its optimal range is extended.
- It adapts immediately, because individuals change their tolerance.
- It is unaffected, because \(30^\circ\text{C}\) is below its upper limit.
= The species' optimal range ends near \(29^\circ\text{C}\). Populations can move to new areas, but species with limited dispersal or long generations may not adapt fast enough.

@ 2 | - | Keystone species
Sea otters eat sea urchins, which eat kelp. When otters were hunted nearly to extinction, kelp forests disappeared from many coastlines. Which term best describes the otter?
* A keystone species
- An indicator species
- A pioneer species
- An invasive species
= A keystone species has an effect on its ecosystem much larger than its abundance would suggest. Without otters, urchin populations exploded and overgrazed the kelp.

@ 2 | - | Ecological succession
Which describes primary succession?
* Lichens and mosses colonize bare rock left after a glacier retreats, slowly building soil.
- Grasses regrow in a field after a farm is abandoned.
- A forest regrows after a wildfire burns the trees but leaves the soil.
- Shrubs replace grasses in a field after logging.
= Primary succession begins where there is no soil. Secondary succession occurs where soil remains after a disturbance, so it proceeds much faster.

@ 2 | - | Ecological succession
How does species diversity usually change during succession in a temperate forest?
* It generally increases over time, often peaking in intermediate stages.
- It decreases steadily from the pioneer stage.
- It remains constant throughout succession.
- It is highest immediately after a disturbance.
= Over time, soil depth and habitat complexity increase, supporting more species. Some studies find diversity peaks before the late-stage community, when a few dominant species take over.

@ 2 | - | Indicator species
Mayfly and stonefly larvae are found in a stream, while they are absent from a nearby stream. What is the most likely conclusion?
* The stream with the larvae has higher water quality, including high dissolved oxygen.
- The stream without the larvae has higher water quality.
- Both streams have the same water quality.
- The larvae increase water pollution.
= These insects are indicator species that are sensitive to pollution and low oxygen. Their presence suggests good water quality.

@ 2 | - | Ecosystem services
A wetland filters pollutants from water, reduces flooding by absorbing water, and provides habitat for fish. What are these benefits called?
* Ecosystem services
- Ecological footprints
- Limiting factors
- Biotic potential
= Ecosystem services are benefits that people receive from natural systems. Destroying wetlands removes these services, which can be expensive to replace with technology.

@ 2 | - | Ecosystem services
Which is an example of a regulating ecosystem service?
* Forests absorbing ce{CO2} and moderating climate
- Timber harvested for lumber
- Fish caught for food
- Recreational hiking
= Regulating services include climate regulation, pollination, and flood control. Timber and fish are provisioning services, and hiking is a cultural service.

@ 2 | - | Genetic diversity
A population of cheetahs has very low genetic diversity after a population bottleneck. What is the greatest risk?
* The population may be unable to adapt to new diseases or environmental changes.
- The population will immediately become extinct.
- The population will grow too quickly.
- The population will have greater fitness.
= Genetic diversity provides variation for natural selection to act on. Low diversity also increases inbreeding, which can lead to harmful traits.

@ 2 | - | Adaptations
Over many generations, the frequency of pesticide resistance increases in an insect population after repeated pesticide use. What explains this?
* Natural selection: resistant individuals survived and reproduced, passing on resistance.
- Individual insects developed resistance during their lifetimes.
- The pesticide caused mutations for resistance.
- The pesticide became less toxic over time.
= Resistance existed in a few individuals before spraying. The pesticide removed susceptible insects, so resistant ones made up more of each generation.

@ 2 | - | Natural disruptions
Which statement about natural disruptions to ecosystems is correct?
* They can be periodic, episodic, or random, and some species depend on them, such as plants whose seeds open after fire.
- They always lead to permanent ecosystem collapse.
- They occur only because of human activity.
- They never change the species present.
= Fires, floods, and storms reset succession and create new habitats. Fire suppression can lead to the buildup of fuel and more intense fires.

@ 2 | - | Ecosystem resilience
Which ecosystem is likely to be most resilient to a disturbance?
* One with high species diversity and many species filling similar roles
- One dominated by a single species
- One with low genetic diversity
- One with few trophic levels
= When several species perform similar functions, the loss of one can be offset by others. Monocultures, such as single-crop fields, are especially vulnerable.

@ 2 | - | Biodiversity
Which practice most directly preserves genetic diversity within a crop species?
* Seed banks that store many varieties of the crop
- Planting a single high-yield variety in every field
- Using more chemical fertilizer
- Increasing irrigation
= Storing many varieties preserves traits, such as resistance to drought or disease, that may become important. Monocultures of one variety reduce genetic diversity.

@ 2 | - | Mass extinctions
Which statement about the current rate of extinction is supported by scientific evidence?
* It is much higher than the natural background rate, mainly because of human activities such as habitat loss.
- It is lower than the background rate.
- It is caused mainly by asteroid impacts.
- Extinctions no longer occur.
= Scientists estimate current extinction rates are tens to hundreds of times the background rate, leading many to describe a sixth mass extinction.

@ 2 | - | Species interactions
A non-native plant spreads rapidly in a new region because none of its natural herbivores live there. Which concept best explains its success?
* Release from the predators and herbivores that limited it in its native range
- Mutualism with native herbivores
- Primary succession
- A low biotic potential
= Invasive species often succeed because the natural enemies that controlled them are absent. Without those limits, they outcompete native species.

@ 2 | - | Ecological niches
Which species is most likely to survive a major environmental change?
* A generalist with a broad niche, such as a raccoon
- A specialist that eats only one kind of plant
- A species that lives in a single isolated habitat
- A species with a long generation time and few offspring
= Generalists can use a variety of food and habitats, so they cope better when conditions change. Specialists are vulnerable if their resource or habitat disappears.

@ 3 | - | Survivorship curves | survivorship
Which type of organism is most likely to have survivorship curve III?
* Oysters, which release millions of eggs with no parental care
- Humans in developed countries
- Elephants, which raise few offspring with extensive care
- Songbirds, which have a constant chance of dying at any age
= Curve III shows very high mortality early in life. Producing huge numbers of offspring without parental care is characteristic of r-selected species.

@ 3 | - | Survivorship curves | survivorship
Curve I in the graph is most typical of which kind of species?
* K-selected species, which have few offspring and provide extensive parental care
- r-selected species, which have many offspring
- Species with a constant risk of death throughout life
- Species with no parental care
= Curve I shows high survival until old age. Investment in a small number of offspring makes each one likely to survive to adulthood.

@ 3 | - | Population growth | logistic
At which point in the graph is the population growing fastest, and why?
* B, because the population is large but resources are not yet limiting
- A, because the population is smallest
- C, because the population is largest
- Growth is the same at all points.
= In logistic growth, the growth rate is greatest at half the carrying capacity. Early on there are few individuals to reproduce; near K, limited resources slow growth.

@ 3 | - | Carrying capacity | logistic
What causes the population's growth rate to approach zero near point C?
* Density-dependent factors, such as competition for food and space, increase as the population nears carrying capacity.
- Density-independent factors, such as a sudden freeze.
- The population runs out of individuals capable of reproducing.
- Birth rates increase.
= As the population approaches K, resource scarcity and other density-dependent factors lower birth rates and raise death rates until they are about equal.

@ 3 | - | Carrying capacity
A deer population overshoots its carrying capacity after predators are removed. What is the most likely outcome?
* The population declines sharply as the deer overgraze vegetation, possibly lowering the carrying capacity.
- The population stays above the carrying capacity indefinitely.
- The carrying capacity increases to match the population.
- The population becomes extinct immediately.
= Overshoot damages the resources the population depends on. A die-off typically follows, and the degraded habitat may support fewer deer than before.

@ 3 | - | r- and K-selected species
Which set of traits describes an r-selected species?
* Many small offspring, early maturity, short life span, and little parental care
- Few large offspring, late maturity, and long life span
- Populations that stay near carrying capacity
- Slow reproduction and extensive parental care
= r-selected species reproduce quickly and are often good colonizers and invasive species. K-selected species, such as elephants, invest heavily in few offspring.

@ 3 | - | Age-structure diagrams | agePyramids
Which country in the figure is likely to have the fastest population growth in the coming decades?
* X, because a large proportion of its population is young and will soon reach reproductive age
- Y, because its population is evenly distributed
- Z, because it has the most older adults
- All three will grow at the same rate.
= A wide base indicates a high birth rate. Even if birth rates fall, the large group of young people entering their reproductive years produces population momentum.

@ 3 | - | Age-structure diagrams | agePyramids
Which challenge is country Z most likely to face?
* A shrinking workforce supporting a growing proportion of older adults
- A shortage of schools for a rapidly growing number of children
- Rapid population growth that strains food supplies
- A population that doubles within a decade
= Country Z has fewer young people than middle-aged and older people, so its population may decline. Fewer workers must support more retirees, as in Japan and parts of Europe.

@ 3 | - | Demographic transition | transition
In which stage of the demographic transition shown is the population growing most rapidly?
* Stage 2
- Stage 1
- Stage 3
- Stage 4
= The rate of natural increase is the birth rate minus the death rate. In stage 2, death rates fall because of improved food and medicine while birth rates stay high: \(40-15=25\) per 1,000.

@ 3 | - | Demographic transition | transition
What is the growth rate of the population in stage 3 of the figure, expressed as a percentage?
* \(1.5\%\)
- \(15\%\)
- \(3.5\%\)
- \(0.15\%\)
= \(25-10=15\) per 1,000 people per year, which is \(\tfrac{15}{1000}=1.5\%\). Using the rates directly as percentages gives the incorrect \(15\%\).

@ 3 | - | Doubling time
A country's population grows at \(2\%\) per year. Using the rule of 70, about how long will it take for the population to double?
* \(35\) years
- \(140\) years
- \(70\) years
- \(20\) years
= Doubling time \(\approx\dfrac{70}{\text{percent growth rate}}=\dfrac{70}{2}=35\) years. The rule applies to exponential growth at a constant rate.

@ 3 | - | Population growth
A city of \(500{,}000\) people has \(12{,}000\) births, \(4{,}000\) deaths, \(3{,}000\) immigrants, and \(1{,}000\) emigrants in a year. What is its percentage growth rate?
* \(2\%\)
- \(1.6\%\)
- \(4\%\)
- \(3.2\%\)
= The net change is \(12{,}000-4{,}000+3{,}000-1{,}000=10{,}000\), and \(\tfrac{10{,}000}{500{,}000}=2\%\). Ignoring migration gives \(1.6\%\).

@ 3 | - | Total fertility rate
Which factor is most strongly associated with a decline in a country's total fertility rate?
* Greater access to education and employment for women
- A lower average age of marriage
- Higher infant mortality
- Greater reliance on children for farm labor
= Educated women tend to marry later, have more economic options, and have greater access to family planning. Higher infant mortality tends to raise fertility.

@ 3 | - | Total fertility rate
Why is replacement-level fertility about \(2.1\) rather than exactly \(2.0\) children per woman in developed countries?
* Some children die before reaching reproductive age, and slightly more boys than girls are born.
- Each person must be replaced by more than one child.
- Immigration requires extra births.
- Women have, on average, two children.
= Two children replace the parents, and the extra 0.1 accounts for early deaths and the sex ratio. Where child mortality is higher, the replacement level is higher.

@ 3 | - | Population momentum
A country reaches replacement-level fertility, yet its population continues to grow for decades. Which best explains this?
* A large share of the population is still young and entering its childbearing years.
- The death rate is increasing.
- Immigration has stopped.
- The total fertility rate is below 1.
= Population momentum occurs because many people are born before fertility falls. They still have children, even at replacement level, until the age structure evens out.

@ 3 | - | Density-dependent factors
Which factor limiting a population is density-dependent?
* A disease that spreads more easily when individuals live close together
- A hurricane that destroys habitat
- A severe drought
- A volcanic eruption
= The effect of a density-dependent factor increases as the population becomes more crowded. Natural disasters affect populations regardless of their density.

@ 3 | - | Population cycles
Populations of snowshoe hares and lynx rise and fall in repeating cycles, with lynx peaks following hare peaks. Which best explains the timing?
* Lynx populations increase after hares become abundant, and then decline after hares become scarce.
- Hares eat lynx.
- Both populations respond only to weather.
- Lynx populations cause hare populations to increase.
= Predator populations lag behind prey populations because they depend on the prey for food. Hare populations are also affected by their own food supply.

@ 3 | - | Human population
Which statement about the history of human population growth is correct?
* Growth was slow for most of history and then became nearly exponential after the Industrial Revolution.
- Growth has been constant throughout history.
- The population declined during the Industrial Revolution.
- The population has already reached a stable carrying capacity.
= Improvements in agriculture, sanitation, and medicine sharply lowered death rates, especially since about 1800. Growth rates have declined since the 1960s, though the population is still increasing.

@ 3 | - | Population growth
A population of \(1{,}000\) grows at \(7\%\) per year. Using the rule of 70, about how large will it be after \(30\) years?
* \(8{,}000\)
- \(3{,}100\)
- \(2{,}000\)
- \(21{,}000\)
= The doubling time is \(\tfrac{70}{7}=10\) years, so 30 years is three doublings: \(1{,}000\times 2^3=8{,}000\). Linear growth would give only \(3{,}100\).

@ 3 | - | Human impacts on carrying capacity
How have humans increased Earth's carrying capacity for humans?
* Through technologies such as fertilizers, irrigation, and modern medicine
- By reducing their consumption of resources
- By lowering birth rates to zero
- By relying only on renewable resources
= The Green Revolution and medical advances increased food supplies and survival. Many scientists argue that this increase depends on unsustainable use of resources such as fossil fuels and groundwater.

@ 3 | - | Survivorship curves
Which organism best fits a Type II survivorship curve, with a roughly constant chance of dying at every age?
* Many songbirds
- Humans in a wealthy country
- Sea turtles
- Dandelions
= Type II species face a similar risk of death throughout life, often from predation. Humans in wealthy countries follow Type I, and sea turtles and dandelions follow Type III.

@ 4 | - | Atmosphere | atmosphere
In which layer shown does temperature increase with altitude because ozone absorbs ultraviolet radiation?
* Layer 2, the stratosphere
- Layer 1, the troposphere
- Layer 3, the mesosphere
- Layer 4, the thermosphere
= The ozone layer lies in the stratosphere. Absorbing UV radiation heats this layer, so temperature rises with altitude, which also makes the stratosphere stable.

@ 4 | - | Atmosphere | atmosphere
In which layer shown does almost all weather occur?
* Layer 1, the troposphere
- Layer 2, the stratosphere
- Layer 3, the mesosphere
- Layer 4, the thermosphere
= The troposphere is heated from below by Earth's surface, so warm air rises and cools, causing convection, clouds, and precipitation. It contains about 75 percent of the atmosphere's mass.

@ 4 | - | Soil | soil
Which horizon shown is most important for growing crops and is most vulnerable to erosion?
* A
- B
- C
- R
= The A horizon, or topsoil, contains humus mixed with minerals and most of the soil's organisms and nutrients. Its loss by erosion reduces fertility.

@ 4 | - | Soil | texture
Which soil sample in the table has the highest water-holding capacity and the lowest permeability?
* Sample 3
- Sample 1
- Sample 2
- All three are equal.
= Clay particles are tiny and pack closely, leaving small pores that hold water tightly and drain slowly. Sandy sample 1 drains fastest and holds the least water.

@ 4 | - | Soil | texture
Which sample in the table is closest to a loam, which is often considered ideal for agriculture?
* Sample 2
- Sample 1
- Sample 3
- None of them
= Loam combines sand, silt, and clay so that it drains well while holding enough water and nutrients. Sample 2 is the most balanced mixture.

@ 4 | - | Rain shadow | rainShadow
Which statement best describes the climates on sides A and B of the mountain?
* Side A is wet, because rising air cools and drops its moisture, and side B is dry, because the descending air warms.
- Side A is dry and side B is wet.
- Both sides receive equal rainfall.
- Side B is wetter because it is farther from the ocean.
= Moist air rising on the windward side cools and condenses, producing rain. Air descending on the leeward side warms and holds its remaining moisture, creating a rain shadow desert.

@ 4 | - | Plate tectonics
Along which type of plate boundary do the deepest ocean trenches and many explosive volcanoes form?
* Convergent boundaries where an oceanic plate is subducted
- Divergent boundaries
- Transform boundaries
- The middle of plates
= At subduction zones, the denser oceanic plate sinks into the mantle, forming trenches. Melting above the descending plate feeds volcanoes, as along the Pacific Ring of Fire.

@ 4 | - | Plate tectonics
The San Andreas Fault, where two plates slide past each other, is an example of which kind of boundary, and what hazard is most associated with it?
* A transform boundary, associated with earthquakes
- A divergent boundary, associated with volcanoes
- A convergent boundary, associated with mountain building
- A transform boundary, associated with tsunamis from subduction
= At transform boundaries, plates move horizontally past each other, building stress that is released suddenly as earthquakes.

@ 4 | - | Solar radiation
Which statement best explains why the equator receives more solar energy per square meter than the poles?
* Sunlight strikes the equator nearly directly, while it strikes the poles at a low angle and is spread over a larger area.
- The equator is closer to the sun.
- The poles have more clouds.
- The equator has a thinner atmosphere.
= At low angles, the same beam of sunlight covers more surface and passes through more atmosphere. Differences in distance from the sun are negligible.

@ 4 | - | Seasons
What causes Earth's seasons?
* The tilt of Earth's axis, which changes the angle and duration of sunlight through the year
- Changes in Earth's distance from the sun
- Changes in the sun's energy output
- Ocean currents
= Because Earth's axis is tilted about \(23.5^\circ\), each hemisphere receives more direct sunlight and longer days when tilted toward the sun.

@ 4 | - | Global wind patterns
Which statement explains why many of the world's large deserts lie near \(30^\circ\) north and south latitude?
* Air that rose at the equator descends near \(30^\circ\), warming and drying as it sinks.
- These latitudes receive the least sunlight.
- Ocean currents carry dry air to these latitudes.
- These latitudes have the highest mountains.
= In Hadley cells, warm, moist air rises at the equator and drops its rain. The dry air then sinks near \(30^\circ\), producing high pressure and little precipitation.

@ 4 | - | El Niño
Which describes typical conditions during an El Niño event?
* Trade winds weaken, warm water spreads to the eastern Pacific, and upwelling off South America decreases.
- Trade winds strengthen, and upwelling off South America increases.
- The western Pacific becomes warmer and wetter than usual.
- Ocean temperatures stay the same, but rainfall increases everywhere.
= With weaker upwelling, fewer nutrients reach the surface off Peru, reducing fish populations. Rainfall patterns shift, bringing floods to some regions and droughts to others.

@ 4 | - | Watersheds
A city draws its drinking water from a river. Which action would best protect the water's quality?
* Protecting forests and wetlands throughout the river's watershed
- Building more roads near the river
- Clearing vegetation along the riverbanks
- Increasing the use of fertilizer upstream
= A watershed is all the land that drains into a body of water. Vegetation filters pollutants and reduces erosion, so protecting the watershed protects the water supply.

@ 4 | - | Soil formation
Which factor most directly speeds the formation of soil from parent material?
* Weathering by water, temperature changes, and living organisms
- Erosion by wind
- Compaction by heavy machinery
- Removal of vegetation
= Physical, chemical, and biological weathering break rock into smaller particles, and organisms add organic matter. Soil forms very slowly, often centuries per centimeter.

@ 4 | - | Soil properties
Which soil property most directly affects the soil's ability to hold nutrients such as potassium and calcium ions?
* Clay and humus content, because their particles carry negative charges that attract positive ions
- The amount of sand
- The color of the soil
- The depth of the C horizon
= Clay and humus have large surface areas with negative charges that hold cations and keep them from leaching. Sandy soils lose nutrients quickly.

@ 4 | - | Earth's geologic resources
Which statement about the rock cycle is correct?
* Igneous rock forms from cooled magma, and any type of rock can become sedimentary, metamorphic, or igneous over time.
- Sedimentary rock forms only from magma.
- Metamorphic rock forms when rock melts completely.
- Rocks cannot change from one type to another.
= Weathering, heat, pressure, and melting continuously transform rocks. Metamorphic rock forms from heat and pressure without melting.

@ 4 | - | Ocean currents
Which statement about the global ocean conveyor belt (thermohaline circulation) is correct?
* It is driven by differences in water density caused by temperature and salinity, and it moves heat around the planet.
- It is driven only by wind.
- It moves only surface water.
- Fresh meltwater would strengthen it.
= Cold, salty water sinks in the North Atlantic and flows along the ocean floor. Large inputs of fresh water could reduce sinking and weaken the circulation.

@ 4 | - | Atmosphere composition
Which gas makes up the largest percentage of Earth's atmosphere?
* Nitrogen, about \(78\%\)
- Oxygen, about \(78\%\)
- Carbon dioxide, about \(21\%\)
- Argon, about \(21\%\)
= Dry air is about 78 percent nitrogen, 21 percent oxygen, and 0.9 percent argon. Carbon dioxide is about 0.04 percent, yet it has a large effect on climate.

@ 4 | - | Earthquakes and volcanoes
Which statement explains why Iceland has many volcanoes?
* It sits on the Mid-Atlantic Ridge, a divergent boundary, above a hot spot.
- It sits on a transform boundary.
- It is located on a subduction zone.
- It is in the middle of a stable plate.
= At divergent boundaries, plates pull apart and magma rises to fill the gap. A hot spot beneath Iceland adds even more volcanic activity.

@ 5 | - | Tragedy of the commons
Many fishing fleets harvest from the same ocean fishery, and the fish population collapses. Which concept best explains this outcome?
* The tragedy of the commons
- Integrated pest management
- Carrying capacity of humans
- Sustainable yield
= When a resource is shared and unregulated, each user gains by taking more, while the cost of overuse is spread among everyone. Quotas and catch shares can prevent this.

@ 5 | - | Forestry
Which is a likely effect of clear-cutting a forest on a steep slope?
* Increased soil erosion and sediment in nearby streams
- Decreased surface runoff
- Increased habitat for forest-interior species
- Cooler stream temperatures
= Removing all trees exposes soil and removes roots that hold it. Without shade, stream temperatures rise, and sediment can smother fish eggs.

@ 5 | - | Agriculture
Which is a negative consequence of the Green Revolution?
* Increased use of synthetic fertilizers and pesticides, along with loss of crop genetic diversity
- Decreased crop yields
- Reduced irrigation
- Increased reliance on traditional crop varieties
= High-yield varieties, irrigation, fertilizers, and mechanization greatly increased food production but also increased water use, pollution, and monocultures.

@ 5 | - | Irrigation | irrigation
A farm uses \(2{,}000{,}000\) liters of water per season with furrow irrigation. About how much water would be needed to deliver the same amount to the crops with drip irrigation?
* About \(1{,}370{,}000\) liters
- About \(1{,}900{,}000\) liters
- About \(700{,}000\) liters
- About \(2{,}900{,}000\) liters
= Furrow irrigation delivers \(0.65(2{,}000{,}000)=1{,}300{,}000\) liters to the crops. Drip irrigation must supply \(\tfrac{1{,}300{,}000}{0.95}\approx 1{,}370{,}000\) liters.

@ 5 | - | Irrigation
Over many years, an irrigated field in an arid region becomes less productive, and a white crust forms on the soil. What is the most likely cause?
* Salinization, as water evaporates and leaves salts behind
- Waterlogging, which drowns roots
- Erosion, which removes the topsoil
- Nitrogen fixation, which adds salts
= In dry climates, irrigation water evaporates quickly, concentrating its dissolved salts in the soil. Drip irrigation and good drainage reduce salinization.

@ 5 | - | Meat production | feed
Based on the figure, how much more grain is needed to produce \(10\) kg of beef than \(10\) kg of chicken?
* \(50\) kg
- \(5\) kg
- \(70\) kg
- \(3.5\) times as much, or \(35\) kg
= Beef requires \(10\times 7=70\) kg of grain and chicken requires \(10\times 2=20\) kg, a difference of \(50\) kg.

@ 5 | - | Meat production | feed
Which statement best explains the differences shown in the figure?
* Cattle use much of the energy they eat for metabolism and maintaining body heat over a long life, so less is stored as meat.
- Beef contains less protein than chicken.
- Chickens are producers.
- Grain fed to cattle contains less energy.
= Energy is lost at each trophic transfer, and larger, longer-lived, warm-blooded animals convert feed into body mass less efficiently.

@ 5 | - | Concentrated animal feeding operations
Which is a major environmental problem associated with concentrated animal feeding operations (CAFOs)?
* Manure runoff that adds nutrients and pathogens to waterways
- Increased biodiversity near the facilities
- Decreased use of antibiotics
- Reduced demand for grain
= Large amounts of manure in lagoons can leak or overflow, causing eutrophication and contamination. CAFOs also emit methane and often use antibiotics heavily.

@ 5 | - | Pest control
A farmer uses crop rotation, releases ladybugs to eat aphids, and applies a pesticide only when aphid numbers exceed a set threshold. What is this approach called?
* Integrated pest management
- Monoculture farming
- Slash-and-burn agriculture
- The Green Revolution
= Integrated pest management combines biological, physical, and chemical methods while minimizing pesticide use, which reduces costs, pesticide resistance, and harm to nontarget organisms.

@ 5 | - | Sustainable agriculture
On a hilly farm, plowing along the contours of the slope rather than up and down it mainly reduces which problem?
* Soil erosion by water
- Pest infestations
- Salinization
- Nitrogen loss to the atmosphere
= Contour plowing creates ridges that slow the flow of water down the slope, so less soil is carried away. Terracing and windbreaks reduce erosion in similar ways.

@ 5 | - | Sustainable agriculture
Which practice increases soil nitrogen without synthetic fertilizer?
* Rotating crops with legumes such as soybeans or clover
- Planting the same crop every year
- Removing all crop residues after harvest
- Tilling the soil deeply each season
= Legumes host nitrogen-fixing bacteria in their root nodules. Rotating crops also disrupts pest life cycles.

@ 5 | - | Fishing
Which fishing method causes the most damage to seafloor habitats?
* Bottom trawling
- Pole-and-line fishing
- Purse seining near the surface
- Fish farming in tanks
= Heavy nets dragged along the bottom destroy coral, sponges, and other habitat-forming organisms, and they catch large amounts of bycatch.

@ 5 | - | Mining
Which describes a significant environmental impact of surface mining for coal?
* Removal of vegetation and overburden, which destroys habitat and can produce acid mine drainage
- Increased soil fertility
- Reduced erosion
- Increased groundwater recharge
= Exposing sulfide minerals in rock to air and water forms sulfuric acid, which can leach metals into streams. Reclamation can restore some, but not all, of the land.

@ 5 | - | Urbanization
Replacing forest with pavement and buildings has which effect on a watershed?
* Increased surface runoff and flooding, and decreased groundwater recharge
- Decreased runoff and increased infiltration
- Lower urban temperatures
- No effect on water flow
= Impervious surfaces prevent water from soaking into the ground. Runoff is faster and carries pollutants into streams, and cities become warmer than surrounding areas.

@ 5 | - | Ecological footprint
Which statement about ecological footprints is correct?
* People in wealthy countries generally have much larger footprints, because they consume more resources and energy per person.
- All people have the same ecological footprint.
- Footprints measure only population size.
- Countries with the largest populations always have the largest footprints per person.
= An ecological footprint estimates the area of land and water needed to supply a person's resources and absorb their wastes. Consumption per person varies greatly between countries.

@ 5 | - | Sustainable forestry
Which forestry practice best maintains habitat and biodiversity while still harvesting timber?
* Selective cutting of individual trees, leaving the rest of the forest intact
- Clear-cutting large areas
- Replacing native forests with tree plantations of one species
- Removing all dead and fallen trees
= Selective cutting keeps the forest's structure and canopy. Tree plantations are monocultures with little biodiversity.

@ 5 | - | Aquaculture
Which is an environmental concern of open-net salmon farming in coastal waters?
* Escaped farmed fish, disease and parasites spreading to wild fish, and waste polluting the water
- It always reduces pressure on wild fish populations.
- It requires no feed.
- It increases dissolved oxygen in the water.
= Aquaculture can reduce pressure on wild stocks, but crowded pens concentrate wastes and pathogens. Carnivorous farmed fish are often fed fish meal from wild-caught fish.

@ 5 | - | Sustainable land use
A city adds green roofs, rain gardens, and permeable pavement. What is the main environmental benefit?
* Reduced storm water runoff and increased infiltration
- Increased runoff
- Higher urban temperatures
- Lower groundwater recharge
= These features let water soak in or be absorbed by plants, reducing flooding and pollution of streams. Green roofs also reduce the urban heat island effect.

@ 5 | - | Agriculture
Slash-and-burn agriculture in tropical rainforests is usually unsustainable because:
* the nutrient-poor soils lose their fertility within a few years, so farmers clear new forest
- tropical soils are too rich in nutrients
- burning adds nitrogen to the soil permanently
- crops cannot grow in warm climates
= Most rainforest nutrients are in the vegetation, not the soil. Ash briefly fertilizes the land, but heavy rain soon leaches the nutrients away.

@ 2 | - | Range of tolerance
Corals turn white and may die when ocean temperatures stay \(1\)–\(2^\circ\text{C}\) above their normal summer maximum for several weeks. Which best explains this?
* Heat stress causes corals to expel the symbiotic algae that supply most of their food through photosynthesis.
- Warm water dissolves the coral skeleton instantly.
- Algae grow so quickly that they smother the coral.
- Corals stop feeding because fish leave the reef.
= Corals and their zooxanthellae are mutualists. Outside the coral's range of tolerance the relationship breaks down, causing bleaching; prolonged bleaching leads to starvation.

@ 2 | - | Speciation
A population of squirrels is split by the formation of a canyon. Over many generations, the two groups can no longer interbreed. Which process occurred?
* Allopatric speciation, caused by geographic isolation
- Sympatric speciation, without geographic isolation
- Artificial selection by humans
- Convergent evolution of unrelated species
= Separated populations experience different mutations, selection pressures, and genetic drift. Over time they become reproductively isolated, forming separate species.

@ 2 | - | Biodiversity hotspots
Which characteristics define a biodiversity hotspot?
* A large number of endemic species and a high degree of habitat loss
- Very few species but large populations of each
- Only protected national parks
- Areas with the highest human population density
= Hotspots, such as Madagascar, contain many species found nowhere else and have lost much of their original habitat. Protecting them conserves a large share of global biodiversity in a small area.

@ 3 | - | Birth and death rates
A country of \(8\) million people has \(160{,}000\) births in a year. What is its crude birth rate?
* \(20\) per \(1{,}000\) people
- \(2\) per \(1{,}000\) people
- \(50\) per \(1{,}000\) people
- \(0.02\) per \(1{,}000\) people
= \(\dfrac{160{,}000}{8{,}000{,}000}=0.02\), which is \(20\) births per \(1{,}000\) people per year.

@ 4 | - | Global wind patterns
Which statement describes the Coriolis effect?
* Earth's rotation deflects moving air and water to the right in the Northern Hemisphere and to the left in the Southern Hemisphere.
- Earth's tilt causes winds to blow toward the poles.
- Warm air rises at the poles.
- The moon's gravity creates prevailing winds.
= The Coriolis effect turns winds from the Hadley cells into the trade winds and westerlies, and it shapes the rotation of ocean gyres.

@ 4 | - | Groundwater
Which statement about an unconfined aquifer is correct?
* It is recharged by water infiltrating directly from the surface above it, so it is vulnerable to contamination from the surface.
- It lies between two layers of impermeable rock.
- It cannot be depleted by pumping.
- It is never connected to surface water.
= Water from rain and streams percolates down to the water table of an unconfined aquifer. Pumping faster than recharge lowers the water table and can cause land subsidence.

@ 4 | - | Climate
Coastal cities usually have milder winters and cooler summers than inland cities at the same latitude. Which best explains this?
* Water has a high specific heat, so the ocean warms and cools slowly and moderates nearby air temperatures.
- Coastal cities receive less sunlight.
- Inland cities are at higher elevations.
- Ocean water has a low specific heat.
= Large bodies of water absorb heat in summer and release it in winter. Inland areas lack this buffering and have more extreme seasonal temperatures.

@ 5 | - | Rangelands
Which is the most likely long-term result of overgrazing a semiarid grassland?
* Loss of vegetation cover, soil erosion, and possibly desertification
- Increased soil organic matter
- Greater grass diversity
- Higher water infiltration
= Overgrazing removes plants faster than they regrow, exposing soil to wind and water erosion. Rotational grazing helps prevent this.

@ 5 | - | Mining
As the highest-grade ore deposits are used up, mining companies turn to lower-grade ore. What is a likely environmental consequence?
* More rock must be mined and processed per kilogram of metal, producing more waste and using more energy and water.
- Less waste is produced, because the ore is easier to process.
- Mining no longer requires removing overburden.
- The metal becomes more abundant in Earth's crust.
= Lower-grade ores contain less metal per ton. Producing the same amount of metal requires disturbing more land and generating more tailings.

@ 5 | - | Urban planning
Which policy most directly reduces the environmental effects of urban sprawl?
* Encouraging compact, mixed-use development served by public transportation
- Building more highways to outlying suburbs
- Requiring larger minimum lot sizes
- Locating housing far from jobs and shopping
= Compact development reduces the land converted to roads and buildings and lowers driving, cutting fuel use and air pollution.
`);

module.exports = { source, figures };
