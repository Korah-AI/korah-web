// AP Environmental Science units 6–9: energy resources and consumption, atmospheric pollution,
// aquatic and terrestrial pollution, and global change. Same format as apes-a.cjs; data in
// figures are hypothetical or rounded illustrative values unless a stem says otherwise.
const { graph, chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');
const { chem } = require('./chemtext.cjs');

const PINK = '#ec4899', BLUE = '#3b82f6', AMBER = '#f59e0b';
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const G = (x, c, w) => Math.exp(-(((x - c) / w) ** 2));

function powerPlant() {
  const box = (x, l) => [['rect', x, 60, 78, 46, { fill: true }], text(x + 39, 87, l, { size: 11 })];
  return draw(440, 150, 'Flow diagram of a coal-fired power plant: coal is burned in a boiler, which heats water into steam; the steam turns a turbine; the turbine spins a generator, which produces electricity. Waste heat is released through a cooling system', [
    ...box(10, 'Boiler'), ...box(120, 'Turbine'), ...box(230, 'Generator'), ...box(340, 'Power lines'),
    ['arrow', 88, 83, 118, 83], ['arrow', 198, 83, 228, 83], ['arrow', 308, 83, 338, 83], ['arrow', 159, 106, 159, 136, { color: PINK }], text(170, 132, 'waste heat to cooling water', { anchor: 'start', size: 10 }),
    text(49, 50, 'coal burned', { size: 10 }), text(159, 50, 'steam', { size: 10 }), text(269, 50, 'motion', { size: 10 }),
  ]);
}

const figures = {
  energyMix: chart({ title: 'Share of a country’s energy consumption by source (%)', categories: ['Petroleum', 'Natural gas', 'Coal', 'Nuclear', 'Renewables'], series: [{ name: 'Share', values: [37, 33, 10, 8, 12] }], ymax: 40, ystep: 10, w: 440,
    alt: 'Bar graph of a country’s energy consumption by source: petroleum 37 percent, natural gas 33 percent, coal 10 percent, nuclear 8 percent, and renewables 12 percent' }),
  plant: powerPlant(),
  wind: table(['Wind speed (m/s)', '4', '8', '12'], [['Power output of turbine (kW)', '50', '400', '1,350']], 'Table of a wind turbine’s power output at three wind speeds: 50 kW at 4 meters per second, 400 kW at 8 meters per second, and 1,350 kW at 12 meters per second'),
  smog: graph({ x: [0, 24], y: [0, 1.1], xstep: 4, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Hour of the day', ytitle: 'Concentration (relative)', w: 390,
    curves: [{ fn: t => 0.1 + 0.85 * G(t, 8, 1.6) + 0.35 * G(t, 18, 1.8) }, { fn: t => 0.1 + 0.75 * G(t, 10.5, 2.2) + 0.3 * G(t, 19.5, 2) , color: AMBER }, { fn: t => 0.05 + 0.95 * G(t, 14.5, 2.6), color: PINK }].map(c => ({ ...c, from: 0, to: 24 })),
    notes: [{ x: 6.2, y: 0.98, text: 'X' }, { x: 10.6, y: 0.88, text: 'Y' }, { x: 15, y: 1.03, text: 'Z' }],
    alt: 'Concentrations of three air pollutants over a sunny day in a city. Pollutant X peaks sharply near 8 a.m. with a smaller peak near 6 p.m. Pollutant Y peaks near 10:30 a.m. Pollutant Z peaks in the afternoon near 2:30 p.m. and is low at night' }),
  inversion: graph({ x: [0, 25], y: [0, 2], xstep: 5, ystep: 0.5, xlabel: '', ylabel: '', xtitle: 'Air temperature (°C)', ytitle: 'Altitude (km)', w: 380,
    curves: [{ pts: [[20, 0], [7, 2]], dash: true, color: 'currentColor' }, { pts: [[10, 0], [8, 0.3], [16, 0.8], [8, 2]], color: PINK }],
    notes: [{ x: 17, y: 0.25, text: 'normal' }, { x: 15.4, y: 1.0, text: 'observed' }],
    alt: 'Temperature profiles of the lower atmosphere. The dashed normal profile cools steadily from 20 °C at the surface to 7 °C at 2 km. The observed profile starts at 10 °C at the surface, cools slightly to 8 °C at 0.3 km, warms to 16 °C at 0.8 km, and then cools again to 8 °C at 2 km' }),
  doSag: graph({ x: [0, 50], y: [0, 12], xstep: 10, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Distance downstream from sewage outfall (km)', ytitle: 'Dissolved oxygen (mg/L)', w: 390,
    curves: [{ fn: d => 9 - 6.2 * (d / 12) * Math.exp(1 - d / 12), from: 0, to: 50 }, { pts: [[0, 0], [0, 12]], dash: true, color: PINK }, { pts: [[0, 5], [50, 5]], dash: true, color: 'currentColor' }],
    notes: [{ x: 1, y: 11, text: 'outfall' }, { x: 40, y: 5.4, text: '5 mg/L' }],
    alt: 'Dissolved oxygen in a river downstream of a sewage outfall. Upstream the dissolved oxygen is 9 mg/L. It falls to a minimum of about 2.8 mg/L about 12 km downstream and gradually recovers to about 7.9 mg/L by 50 km. A dashed line marks 5 mg/L' }),
  biomag: table(['Sample', 'DDT concentration (ppm)'], [['Lake water', '0.000003'], ['Zooplankton', '0.04'], ['Small fish', '0.5'], ['Large fish', '2'], ['Fish-eating birds', '25']], 'Table of DDT concentrations in parts per million: lake water 0.000003, zooplankton 0.04, small fish 0.5, large fish 2, and fish-eating birds 25'),
  ld50: graph({ x: [0, 100], y: [0, 100], xstep: 20, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Dose (mg per kg of body mass)', ytitle: 'Mortality of test population (%)', w: 380,
    curves: [{ fn: d => 100 / (1 + Math.exp(-(d - 40) / 7)), from: 0, to: 100 }, { pts: [[0, 50], [40, 50]], dash: true, color: PINK }, { pts: [[40, 0], [40, 50]], dash: true, color: PINK }],
    alt: 'Dose–response curve for a toxin tested on rats. Mortality is near 0 percent at low doses, rises in an S shape, reaches 50 percent at 40 mg per kg, marked with dashed lines, and approaches 100 percent above about 75 mg per kg' }),
  keeling: graph({ x: [1960, 2020], y: [300, 420], xstep: 10, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Year', ytitle: 'Atmospheric CO₂ (ppm)', w: 400,
    curves: [{ pts: Array.from({ length: 721 }, (_, i) => { const y = 1960 + i / 12; return [y, 316 + 0.75 * (y - 1960) + 0.012 * (y - 1960) ** 2 + 3 * Math.sin(2 * Math.PI * (i / 12) + 1.2)]; }) }],
    alt: 'Graph of atmospheric carbon dioxide concentration at a remote observatory from 1960 to 2020. Concentration rises from about 316 ppm to about 404 ppm, rising faster in later decades, with a small up-and-down oscillation of a few ppm every year' }),
  gwp: table(['Gas', 'Approximate global warming potential (100 years)', 'Main sources'], [['Carbon dioxide', '1', 'Burning fossil fuels, deforestation'], ['Methane', '28', 'Livestock, landfills, natural gas leaks, rice paddies'], ['Nitrous oxide', '265', 'Fertilized soils, livestock manure'], ['CFC-12', '10,200', 'Older refrigerants and aerosol propellants']],
    'Table of greenhouse gases with approximate 100-year global warming potentials and main sources: carbon dioxide, 1, burning fossil fuels and deforestation; methane, 28, livestock, landfills, natural gas leaks, and rice paddies; nitrous oxide, 265, fertilized soils and livestock manure; CFC-12, 10,200, older refrigerants and aerosol propellants'),
};
// Ocean pH on an axis that starts near the data, so the decline is visible.
figures.oceanPh = graph({ x: [1850, 2020], y: [7.95, 8.25], xstep: 50, ystep: 0.05, xlabel: '', ylabel: '', xtitle: 'Year', ytitle: 'Average surface ocean pH', w: 400,
  curves: [{ pts: [[1850, 8.2], [1900, 8.19], [1950, 8.15], [2000, 8.1], [2020, 8.05]] }], dots: [[1850, 8.2], [1900, 8.19], [1950, 8.15], [2000, 8.1], [2020, 8.05]].map(([x, y]) => ({ x, y })),
  alt: 'Graph of estimated average surface ocean pH: 8.20 in 1850, 8.19 in 1900, 8.15 in 1950, 8.10 in 2000, and 8.05 in 2020, a decrease that accelerates over time' });

const source = chem(String.raw`
@ 6 | - | Energy consumption | energyMix
According to the graph, what percentage of the country's energy comes from fossil fuels?
* \(80\%\)
- \(70\%\)
- \(37\%\)
- \(88\%\)
= Petroleum, natural gas, and coal are fossil fuels: \(37+33+10=80\%\). Nuclear energy is nonrenewable but is not a fossil fuel.

@ 6 | - | Energy consumption | energyMix
The country replaces all of its coal use with natural gas while total energy use stays the same. Which is the most likely effect?
* Carbon dioxide and sulfur dioxide emissions from that energy decrease, because natural gas releases less ce{CO2} per unit of energy and little sulfur.
- Carbon dioxide emissions increase, because natural gas contains more carbon.
- Emissions do not change, because both are fossil fuels.
- The share of renewables increases to \(22\%\).
= Burning natural gas releases roughly half as much ce{CO2} per unit of energy as coal and almost no ce{SO2} or particulates. Methane leaks during extraction and transport offset some of this benefit.

@ 6 | - | Electricity generation | plant
A power plant burns \(2.0\times 10^6\) kg of coal per day. The coal contains \(24\text{ MJ/kg}\), and the plant is \(35\%\) efficient. About how much electrical energy does it produce per day, in kilowatt-hours? (\(1\text{ kWh}=3.6\text{ MJ}\))
* About \(4.7\times 10^6\text{ kWh}\)
- About \(1.3\times 10^7\text{ kWh}\)
- About \(1.7\times 10^{13}\text{ kWh}\)
- About \(4.7\times 10^3\text{ kWh}\)
= The coal contains \((2.0\times 10^6)(24)=4.8\times 10^7\text{ MJ}\), and \(35\%\) becomes electricity: \(1.68\times 10^7\text{ MJ}\). Dividing by \(3.6\text{ MJ/kWh}\) gives about \(4.7\times 10^6\text{ kWh}\).

@ 6 | - | Electricity generation | plant
In the power plant shown, where does most of the energy in the coal go that does not become electricity?
* Waste heat, released to the cooling water and the air
- Into the electricity, which is nearly \(100\%\) efficient
- Into the chemical bonds of ce{CO2}
- Into the turbine, where it is stored
= By the second law of thermodynamics, converting heat into work is never complete. Typical coal plants convert only about a third of the fuel's energy into electricity.

@ 6 | - | Energy conservation
A \(60\text{ W}\) incandescent bulb is replaced by a \(9\text{ W}\) LED bulb that gives the same light. The bulb is used \(5\) hours a day for \(30\) days, and electricity costs \(\$0.20\) per kWh. How much money is saved?
* \(\$1.53\)
- \(\$1.80\)
- \(\$0.27\)
- \(\$153\)
= The savings are \(51\text{ W}\times 150\text{ h}=7{,}650\text{ Wh}=7.65\text{ kWh}\), and \(7.65\times\$0.20=\$1.53\). The value \(\$1.80\) is the cost of running the incandescent bulb.

@ 6 | - | Wind energy | wind
Based on the table, how does the power output of the turbine depend on wind speed?
* It is proportional to the cube of the wind speed: doubling the speed multiplies the power by \(8\).
- It is proportional to the wind speed.
- It is proportional to the square of the wind speed.
- It does not depend on wind speed.
= From \(4\) to \(8\text{ m/s}\), power rises from \(50\) to \(400\text{ kW}\), a factor of \(8=2^3\). Tripling the speed gives \(27\times 50=1{,}350\text{ kW}\). Small increases in wind speed therefore matter greatly when siting turbines.

@ 6 | - | Wind energy
Which is a significant drawback of wind power?
* Its output is intermittent, varying with the wind, so it requires storage or backup sources.
- It releases large amounts of ce{CO2} while operating.
- It requires mining and burning fuel continuously.
- It produces radioactive waste.
= Wind turbines produce no emissions while operating, but output depends on weather. Turbines can also kill birds and bats and may face local opposition.

@ 6 | - | Solar energy
A solar panel array converts \(20\%\) of incoming sunlight to electricity. At peak sunlight of \(1{,}000\text{ W/m}^2\), what panel area is needed to produce \(5{,}000\text{ W}\)?
* \(25\text{ m}^2\)
- \(5\text{ m}^2\)
- \(1\text{ m}^2\)
- \(250\text{ m}^2\)
= Each square meter produces \(0.20(1{,}000)=200\text{ W}\), so \(\tfrac{5{,}000}{200}=25\text{ m}^2\) is needed.

@ 6 | - | Nuclear energy
Strontium-90 in nuclear waste has a half-life of about \(29\) years. How much of a \(100\text{ g}\) sample remains after \(87\) years?
* \(12.5\text{ g}\)
- \(25\text{ g}\)
- \(33\text{ g}\)
- \(0\text{ g}\)
= Eighty-seven years is three half-lives: \(100\to 50\to 25\to 12.5\text{ g}\). Long half-lives are why spent fuel must be stored safely for very long periods.

@ 6 | - | Nuclear energy
Which statement about nuclear power plants is correct?
* They release almost no ce{CO2} while operating, but they produce long-lived radioactive waste and thermal pollution.
- They burn uranium in combustion reactions.
- They produce large amounts of ce{SO2}.
- They generate electricity without using turbines.
= Fission of uranium-235 releases heat that boils water to drive turbines, like a fossil fuel plant. The major concerns are waste storage, accidents, and the cost of construction.

@ 6 | - | Hydroelectric power
Which is an environmental impact of building a large hydroelectric dam?
* Flooding of land upstream and blocking of fish migration, with sediment trapped behind the dam
- Release of large amounts of sulfur dioxide
- Increased sediment delivery to downstream deltas
- Faster-flowing rivers downstream that carry more nutrients
= Reservoirs flood habitats and can release methane from decaying vegetation. Trapped sediment deprives downstream areas of soil and causes deltas to erode.

@ 6 | - | Fossil fuels
Which is a major environmental concern of hydraulic fracturing (fracking) for natural gas?
* Contamination of groundwater and leaks of methane, a potent greenhouse gas
- Release of large amounts of ozone into the stratosphere
- Depletion of the ozone layer
- Production of radioactive spent fuel rods
= Fracking injects water, sand, and chemicals at high pressure to fracture rock. Wastewater disposal, methane leaks, large water use, and induced earthquakes are concerns.

@ 6 | - | Fossil fuels
A car that gets \(25\) miles per gallon is driven \(12{,}000\) miles a year. Burning one gallon of gasoline releases about \(8.9\text{ kg}\) of ce{CO2}. How much ce{CO2} does the car emit in a year?
* About \(4{,}300\text{ kg}\)
- About \(107{,}000\text{ kg}\)
- About \(480\text{ kg}\)
- About \(2{,}700\text{ kg}\)
= The car uses \(\tfrac{12{,}000}{25}=480\) gallons, emitting \(480(8.9)\approx 4{,}300\text{ kg}\) of ce{CO2}.

@ 6 | - | Fuel cells
Which statement about hydrogen fuel cells is correct?
* They combine hydrogen and oxygen to produce electricity, with water as the main product, but hydrogen is often made from natural gas.
- They burn hydrogen in a combustion engine, releasing ce{CO2}.
- Hydrogen gas is freely available in large natural deposits.
- They require uranium to operate.
= A fuel cell's only direct product is water. Its environmental benefit depends on how the hydrogen is produced; electrolysis using renewable electricity avoids carbon emissions.

@ 6 | - | Geothermal energy
Which statement about geothermal energy is correct?
* It uses heat from Earth's interior and is most practical near tectonic plate boundaries.
- It is available equally everywhere.
- It relies on burning underground coal.
- It produces energy only during daylight.
= Places such as Iceland have hot rock close to the surface. Ground-source heat pumps, however, can use the steady temperature of shallow ground almost anywhere.

@ 6 | - | Biomass
Which is a drawback of burning wood or crop residues for energy in homes?
* Indoor air pollution, including particulates and carbon monoxide, along with deforestation if harvesting is not sustainable
- It produces radioactive waste.
- It releases no carbon dioxide.
- It cannot be used in developing countries.
= In many developing countries, indoor smoke from cooking fires is a leading cause of respiratory disease. Biomass is renewable only if it is regrown as fast as it is used.

@ 6 | - | Energy efficiency
Which approach to heating a building uses energy most efficiently?
* Cogeneration, using the waste heat from electricity generation to heat buildings
- Electric resistance heaters powered by a coal plant
- Leaving windows open in winter
- Using incandescent bulbs for heat
= Using waste heat that would otherwise be lost can raise overall efficiency well above that of a power plant alone.

@ 6 | - | Nonrenewable resources
Which energy source is renewable?
* Solar power
- Coal
- Natural gas
- Uranium for nuclear fission
= Renewable sources are replenished on human time scales. Fossil fuels form over millions of years, and uranium ore is finite.

@ 6 | - | Energy and development
How does energy use per person generally compare between highly developed and less developed countries?
* It is much higher in highly developed countries.
- It is higher in less developed countries.
- It is the same everywhere.
- It is unrelated to economic development.
= Industrialized economies use far more energy per person for transportation, industry, and homes, although developing countries' energy use is growing quickly.

@ 6 | - | Hydroelectric and tidal power
Which statement correctly contrasts tidal power with solar power?
* Tidal power is highly predictable, but it is feasible at only a few coastal sites.
- Tidal power is available in every inland location.
- Solar power is more predictable than tidal power.
- Tidal power releases large amounts of ce{CO2}.
= Tides follow the moon's cycle, so tidal output can be forecast years ahead. Few coastlines have tidal ranges large enough to make it practical.

@ 6 | - | Energy conservation
Which change would most reduce the energy use of an average home in a cold climate?
* Adding insulation and sealing air leaks
- Using a slightly smaller refrigerator
- Unplugging phone chargers
- Switching to cold-water laundry only
= Heating is typically the largest share of home energy use in cold climates, and most heat escapes through poorly insulated walls, roofs, windows, and air leaks.

@ 6 | - | Oil extraction
Which describes a concern about extracting oil from tar sands?
* It requires large amounts of energy and water, and it disturbs large areas of land.
- It produces cleaner fuel than conventional oil.
- It has no impact on water supplies.
- It produces no greenhouse gases.
= Separating bitumen from sand takes heat and water and leaves tailings ponds. The extra energy used means higher emissions per barrel than conventional oil.

@ 7 | - | Photochemical smog | smog
Which pollutants are most likely represented by X, Y, and Z in the graph?
* X is nitrogen oxide (NO), Y is nitrogen dioxide (ce{NO2}), and Z is ground-level ozone (ce{O3}).
- X is ozone, Y is NO, and Z is ce{NO2}.
- X is ce{NO2}, Y is ozone, and Z is NO.
- X, Y, and Z are all primary pollutants emitted by cars.
= Vehicles emit NO during the morning commute. It oxidizes to ce{NO2}, and sunlight breaks ce{NO2} apart, producing ozone that peaks in the afternoon.

@ 7 | - | Photochemical smog | smog
Why does pollutant Z in the graph decrease after sunset?
* Without sunlight, no new ozone forms, and existing ozone reacts with NO and other substances.
- More vehicles are on the road in the evening.
- Ozone is a primary pollutant that stops being emitted at night.
- Ozone rises into the stratosphere at night.
= Photochemical smog depends on sunlight. At night, ozone is consumed by reactions with NO from evening traffic.

@ 7 | - | Primary and secondary pollutants
Which is a secondary pollutant?
* Ground-level ozone
- Carbon monoxide
- Sulfur dioxide
- Particulate matter from a diesel engine
= Secondary pollutants form in the atmosphere from reactions among primary pollutants. Ozone forms when ce{NO_x} and volatile organic compounds react in sunlight.

@ 7 | - | Thermal inversions | inversion
What is the effect of the temperature profile observed in the graph?
* Pollutants near the ground are trapped, because the warm layer above prevents cooler, polluted air from rising.
- Pollutants rise and disperse more quickly than usual.
- Strong winds blow pollutants away.
- Rain removes the pollutants.
= Normally, warm air near the surface rises and mixes. During an inversion, a warm layer acts like a lid, so pollutants concentrate near the ground, as in the 1952 London smog.

@ 7 | - | Thermal inversions | inversion
Which conditions often produce a thermal inversion like the one shown?
* Clear, calm nights, when the ground cools quickly, especially in valleys surrounded by mountains
- Hot, windy afternoons
- Heavy thunderstorms
- Strong ocean breezes
= Cold, dense air settles near the surface at night, beneath warmer air. Cities in basins, such as Los Angeles and Mexico City, are especially prone to inversions.

@ 7 | - | Acid deposition
Which pair of pollutants is the main cause of acid rain?
* Sulfur dioxide and nitrogen oxides
- Carbon monoxide and methane
- Ozone and lead
- Radon and CFCs
= ce{SO2} from burning coal and ce{NO_x} from vehicles and power plants react with water in the atmosphere to form sulfuric and nitric acids.

@ 7 | - | Acid deposition
Rain in one region has a pH of \(4.0\), and rain in another has a pH of \(6.0\). How many times greater is the hydrogen ion concentration of the first?
* \(100\)
- \(2\)
- \(1.5\)
- \(20\)
= The pH scale is logarithmic: each unit is a factor of 10, so two units represent a factor of \(10^2=100\).

@ 7 | - | Acid deposition
Lakes in some regions are much more harmed by acid rain than others receiving the same rainfall. Which best explains this?
* Lakes on limestone bedrock are buffered, because carbonate neutralizes the acid, while lakes on granite are not.
- Lakes with more fish are less affected.
- Deeper lakes always have more acid.
- Lakes near the ocean receive no acid rain.
= Calcium carbonate reacts with acid, keeping the pH stable. Watersheds on granite have little buffering capacity, so their lakes acidify.

@ 7 | - | Pollution control
Which device reduces sulfur dioxide emissions from coal-fired power plants?
* A wet scrubber, which uses a spray of limestone slurry to react with ce{SO2}
- A catalytic converter
- An electrostatic precipitator, which removes ce{SO2} gas
- A cooling tower
= In a scrubber, ce{SO2} reacts with calcium compounds to form solid calcium sulfite or gypsum. Electrostatic precipitators and baghouses remove particulate matter.

@ 7 | - | Pollution control
Which pollutants does a catalytic converter in a car's exhaust system reduce?
* Carbon monoxide, nitrogen oxides, and hydrocarbons
- Carbon dioxide only
- Sulfur dioxide and particulates only
- Ozone and CFCs
= Catalysts oxidize CO and unburned hydrocarbons to ce{CO2} and water and reduce ce{NO_x} to ce{N2}. They do not reduce ce{CO2} emissions.

@ 7 | - | Indoor air pollution
Which indoor air pollutant is a radioactive gas that seeps from soil and rock into basements and is a leading cause of lung cancer?
* Radon
- Carbon monoxide
- Formaldehyde
- Asbestos
= Radon forms from the decay of uranium in rock. It is colorless and odorless, so testing is needed. Sealing foundation cracks and venting reduce exposure.

@ 7 | - | Indoor air pollution
Which indoor pollutant comes from incomplete combustion in faulty furnaces and is deadly because it binds to hemoglobin?
* Carbon monoxide
- Radon
- Asbestos
- Ozone
= CO binds to hemoglobin much more strongly than oxygen does, reducing the blood's ability to carry oxygen. Detectors are needed because the gas has no color or odor.

@ 7 | - | Particulate matter
Why are fine particulates, \(\text{PM}_{2.5}\), considered especially harmful to human health?
* They are small enough to penetrate deep into the lungs and enter the bloodstream.
- They are too large to be inhaled.
- They react to form ozone in the stratosphere.
- They are filtered completely by the nose.
= Particles smaller than 2.5 micrometers bypass the body's defenses in the upper airways and are linked to heart and lung disease.

@ 7 | - | Clean Air Act
Which change most directly reduced lead in the air in the United States after the Clean Air Act?
* Phasing out leaded gasoline
- Installing scrubbers on coal plants
- Banning CFCs
- Requiring catalytic converters to remove lead from exhaust
= Lead was added to gasoline to improve engine performance. Removing it, which was also needed because lead damages catalytic converters, led to a dramatic drop in airborne lead and blood lead levels.

@ 7 | - | Smog formation
Which conditions favor the formation of photochemical smog?
* Sunny, warm weather in a city with heavy traffic
- Cold, cloudy weather in a rural area
- Rainy weather near the ocean
- Nighttime with no traffic
= Smog requires sunlight to drive the reactions and ce{NO_x} and VOCs, largely from vehicles, as raw materials.

@ 7 | - | Noise pollution
Which is an ecological effect of noise pollution from ships and shipping?
* It interferes with the communication and navigation of whales and other marine animals.
- It increases dissolved oxygen in the ocean.
- It causes acid rain.
- It depletes stratospheric ozone.
= Many marine mammals rely on sound to find food, mates, and their way. Chronic noise can mask their calls and cause stress.

@ 7 | - | Atmospheric pollutants
Which is the main source of nitrogen oxides in urban air?
* High-temperature combustion in vehicle engines and power plants, which causes atmospheric ce{N2} and ce{O2} to react
- Nitrogen in coal, released when burned
- Lightning only
- Fertilizers applied to city lawns
= At high temperatures, nitrogen and oxygen from the air combine. Even fuels without nitrogen produce ce{NO_x} when burned hot.

@ 7 | - | Ozone
Which statement correctly contrasts ozone in the stratosphere with ozone near the ground?
* Stratospheric ozone protects life by absorbing UV radiation, while ground-level ozone is a harmful pollutant.
- Both are harmful pollutants.
- Both protect life from UV radiation.
- Ground-level ozone repairs the ozone layer.
= The same molecule has opposite effects in different places. Near the ground, ozone irritates the lungs and damages plants.

@ 7 | - | Air quality
Which strategy most directly reduces urban ozone pollution?
* Reducing emissions of nitrogen oxides and volatile organic compounds
- Planting fewer trees
- Building taller smokestacks
- Burning more coal
= Ozone is a secondary pollutant, so it is controlled by reducing its precursors. Tall smokestacks only move pollution farther away.

@ 7 | - | Acid deposition
Which is an ecological effect of acid deposition on forests?
* Leaching of nutrients such as calcium from soils and release of toxic aluminum
- Increased soil fertility
- Faster tree growth from added sulfur
- Higher soil pH
= Acids displace nutrient cations from soil particles and mobilize aluminum, which damages roots. Weakened trees become vulnerable to cold, insects, and disease.

@ 8 | - | Dissolved oxygen | doSag
Which best explains the decrease in dissolved oxygen downstream of the outfall shown?
* Bacteria decomposing the organic matter in the sewage use oxygen through cellular respiration.
- Sewage contains chemicals that react with oxygen in the air.
- Plants downstream consume oxygen through photosynthesis.
- The water is colder downstream.
= Sewage has a high biochemical oxygen demand. As bacteria break down the organic matter, they consume dissolved oxygen faster than it can be replaced.

@ 8 | - | Dissolved oxygen | doSag
Many fish species need at least \(5\text{ mg/L}\) of dissolved oxygen. Based on the graph, over about what length of river are such fish likely to be absent?
* About \(23\) km, from about \(4\) km to \(27\) km downstream
- About \(50\) km
- About \(5\) km
- None, because oxygen never falls below \(5\text{ mg/L}\)
= The curve falls below the \(5\text{ mg/L}\) line a few kilometers downstream and recovers above it near \(27\) km. Oxygen returns as the organic matter is used up and water mixes with the air.

@ 8 | - | Point and nonpoint sources
Which is a nonpoint source of water pollution?
* Fertilizer runoff from many farms across a watershed
- A pipe discharging wastewater from a factory
- A sewage treatment plant outfall
- An oil spill from a single tanker
= Nonpoint sources are diffuse and hard to identify or regulate. Point sources come from a single, identifiable location.

@ 8 | - | Eutrophication
Which sequence describes eutrophication in a lake after excess phosphorus enters?
* Algal bloom, then death of algae, then decomposition by bacteria, then low dissolved oxygen and fish kills
- Fish kills, then algal bloom, then decomposition
- Decomposition, then algal bloom, then high dissolved oxygen
- Algal bloom, then increased dissolved oxygen at all depths, then more fish
= Nutrients fuel rapid algae growth. When the algae die, decomposers consume oxygen, creating hypoxic dead zones, as in the Gulf of Mexico.

@ 8 | - | Biomagnification | biomag
By what factor is the concentration of DDT in fish-eating birds greater than its concentration in small fish?
* \(50\)
- \(24.5\)
- \(12.5\)
- \(625\)
= \(\tfrac{25}{0.5}=50\). Over the whole food chain, the concentration increases by a factor of millions from the lake water to the birds.

@ 8 | - | Biomagnification | biomag
Which property of DDT explains the pattern in the table?
* It is fat-soluble and persistent, so it accumulates in organisms and is passed up the food chain.
- It is water-soluble and excreted quickly.
- It breaks down rapidly in sunlight.
- It is produced by the fish-eating birds.
= Because DDT is stored in fat rather than excreted, each predator accumulates the DDT from many prey. It caused eggshell thinning in birds such as eagles and pelicans.

@ 8 | - | Toxicology | ld50
What is the LD50 of the toxin shown?
* \(40\text{ mg/kg}\)
- \(50\text{ mg/kg}\)
- \(100\text{ mg/kg}\)
- \(20\text{ mg/kg}\)
= The LD50 is the dose that kills half of a test population. Reading across from \(50\%\) mortality to the curve gives \(40\text{ mg/kg}\).

@ 8 | - | Toxicology | ld50
If humans had the same sensitivity as the test animals, what total dose would be expected to be lethal to half of a group of \(70\text{ kg}\) adults?
* \(2{,}800\text{ mg}\)
- \(40\text{ mg}\)
- \(1.75\text{ mg}\)
- \(3{,}500\text{ mg}\)
= \(40\text{ mg/kg}\times 70\text{ kg}=2{,}800\text{ mg}\). In practice, results from other species are applied to humans with caution and safety factors.

@ 8 | - | Toxicology
Toxin A has an LD50 of \(5\text{ mg/kg}\), and toxin B has an LD50 of \(500\text{ mg/kg}\). Which statement is correct?
* Toxin A is more toxic, because a much smaller dose kills half of the test population.
- Toxin B is more toxic, because its LD50 is larger.
- They are equally toxic.
- The LD50 does not indicate toxicity.
= A lower LD50 means a smaller dose is lethal, so the substance is more toxic.

@ 8 | - | Thermal pollution
A power plant releases heated water into a river. Which effect is most likely?
* Dissolved oxygen decreases, because gases are less soluble in warmer water, while fish need more oxygen.
- Dissolved oxygen increases.
- Fish populations increase because of warmer water.
- The river's pH falls sharply.
= Warm water holds less oxygen, and higher temperatures raise organisms' metabolic rates. Sudden temperature changes can also cause thermal shock.

@ 8 | - | Wastewater treatment
In a sewage treatment plant, what happens during secondary treatment?
* Bacteria break down dissolved organic matter in aerated tanks.
- Large objects are screened out.
- Solids settle to form sludge.
- Nitrogen and phosphorus are removed by chemical processes.
= Primary treatment removes solids physically; secondary treatment uses biological decomposition to reduce biochemical oxygen demand; tertiary treatment removes nutrients and other pollutants.

@ 8 | - | Solid waste
Which is a major environmental concern about sanitary landfills?
* Leachate that can contaminate groundwater, and methane produced by anaerobic decomposition
- They produce no greenhouse gases.
- They decompose all waste completely within a year.
- They release ozone.
= Modern landfills use clay and plastic liners and leachate collection systems. Captured methane can be burned to generate electricity.

@ 8 | - | Waste reduction
Which ranks waste-management strategies from most to least environmentally preferable?
* Reduce, reuse, recycle
- Recycle, reuse, reduce
- Reuse, recycle, reduce
- Landfill, recycle, reduce
= Reducing consumption avoids using resources at all. Reuse keeps products in use, and recycling still requires energy to process materials.

@ 8 | - | Persistent pollutants
Mercury released by coal combustion can harm people who eat large predatory fish such as tuna. Which explains this?
* Bacteria convert mercury to methylmercury, which biomagnifies in aquatic food chains.
- Mercury is destroyed when it enters water.
- Small fish contain more mercury than large fish.
- Mercury evaporates from fish when cooked.
= Methylmercury is absorbed easily and stored in tissues. It is a neurotoxin, especially dangerous to developing fetuses and children.

@ 8 | - | Endocrine disruptors
Which describes an endocrine disruptor?
* A chemical that interferes with the body's hormone systems, such as some pesticides and plasticizers
- A pathogen that causes diarrhea
- A gas that depletes stratospheric ozone
- A nutrient that causes algal blooms
= Endocrine disruptors, such as atrazine and BPA, mimic or block hormones and can affect development and reproduction even at very low concentrations.

@ 8 | - | Oil spills
Which is an immediate effect of an oil spill on seabirds?
* Oil coats feathers, destroying their insulation and buoyancy, so birds may die of hypothermia or drown.
- Oil increases dissolved oxygen.
- Oil makes feathers more waterproof.
- Oil has no effect on seabirds.
= Oil also poisons animals that ingest it while preening. Cleanup methods include booms, skimmers, and dispersants, each with tradeoffs.

@ 8 | - | Infectious disease
Cholera outbreaks often follow floods in areas with poor sanitation. Which best explains this?
* Floodwater mixes sewage with drinking water, spreading the bacteria that cause cholera.
- Floods increase mosquito populations, which carry cholera.
- Cholera is caused by air pollution.
- Floods decrease water temperatures, which activates the virus.
= Cholera is a waterborne bacterial disease. Water treatment and sanitation are among the most effective public health measures.

@ 8 | - | Water quality testing
Why do water-quality tests often measure fecal coliform bacteria?
* Their presence indicates contamination by human or animal waste, which may contain dangerous pathogens.
- Fecal coliform bacteria are the main cause of acid rain.
- They are always harmful in themselves.
- They indicate that the water is high in dissolved oxygen.
= Testing for every possible pathogen is impractical. Coliforms are an indicator of fecal contamination and the likely presence of other pathogens.

@ 8 | - | Plastic pollution
Which statement about plastic debris in the ocean is correct?
* It breaks down into microplastics that can be ingested by organisms and can carry other pollutants.
- It biodegrades quickly into harmless substances.
- It sinks immediately and causes no harm.
- It increases dissolved oxygen.
= Plastics persist for decades or longer, entangle animals, and are mistaken for food. Ocean currents concentrate debris in gyres.

@ 8 | - | Incineration
Which is a drawback of incinerating municipal solid waste?
* It produces air pollutants and toxic ash that must be disposed of safely.
- It increases the volume of waste.
- It cannot generate any energy.
- It eliminates all toxic materials.
= Incineration greatly reduces waste volume and can generate electricity, but it emits pollutants such as dioxins and concentrates heavy metals in the ash.

@ 9 | - | Greenhouse gases | keeling
Which best explains the small yearly oscillations in the graph?
* Seasonal photosynthesis in the Northern Hemisphere, which has most of Earth's land plants, lowers ce{CO2} in summer.
- Volcanoes erupt every winter.
- The ocean releases all its ce{CO2} in summer.
- Burning of fossil fuels stops each summer.
= When northern plants grow in spring and summer, photosynthesis removes ce{CO2}. In fall and winter, respiration and decomposition exceed photosynthesis, and ce{CO2} rises.

@ 9 | - | Greenhouse gases | keeling
Which is the main cause of the long-term increase in the graph?
* Burning fossil fuels and clearing forests
- Increased volcanic activity
- Changes in the sun's energy output
- Ocean warming that releases oxygen
= Isotopic evidence shows that the added carbon comes mainly from fossil fuels. The rate of increase has grown as global fuel use has grown.

@ 9 | - | Global warming potential | gwp
A landfill releases \(1{,}000\) metric tons of methane in a year. Based on the table, what is the equivalent mass of ce{CO2} in its warming effect over 100 years?
* \(28{,}000\) metric tons
- \(1{,}000\) metric tons
- \(36\) metric tons
- \(265{,}000\) metric tons
= Multiplying by the global warming potential: \(1{,}000\times 28=28{,}000\) metric tons of ce{CO2}-equivalent. Capturing landfill methane is therefore an effective way to slow warming.

@ 9 | - | Global warming potential | gwp
Although methane and nitrous oxide have much higher global warming potentials than ce{CO2}, carbon dioxide is responsible for the largest share of human-caused warming. Which explains this?
* Far more ce{CO2} is emitted than any other greenhouse gas, and it remains in the atmosphere for a long time.
- ce{CO2} has the highest global warming potential.
- Methane does not absorb infrared radiation.
- Nitrous oxide is not a greenhouse gas.
= The total effect depends on both the potency per molecule and the amount emitted. Human ce{CO2} emissions are many times larger by mass.

@ 9 | - | Ocean acidification | oceanPh
Which explains the trend in the graph?
* The ocean absorbs ce{CO2} from the atmosphere, forming carbonic acid that releases hydrogen ions.
- Acid rain has increased ocean salinity.
- Warmer water contains more hydrogen ions from melting ice.
- Ocean plants release acids during photosynthesis.
= ce{CO2 + H2O -> H2CO3}, which ionizes to ce{H^+} and ce{HCO3^-}. A drop of about 0.15 pH units is roughly a \(40\%\) increase in hydrogen ion concentration.

@ 9 | - | Ocean acidification | oceanPh
Which organisms are most directly threatened by the trend in the graph?
* Corals, clams, and other organisms that build shells or skeletons from calcium carbonate
- Large fish such as tuna, whose bones are made of silica
- Seaweeds, which use carbonate for photosynthesis
- Organisms that live only in fresh water
= Added hydrogen ions react with carbonate ions, making carbonate less available. Calcifying organisms struggle to build and maintain their shells and skeletons.

@ 9 | - | Ozone depletion
How do chlorofluorocarbons (CFCs) deplete stratospheric ozone?
* UV radiation releases chlorine atoms from CFCs, and each chlorine atom can catalytically destroy thousands of ozone molecules.
- CFCs absorb all of the UV radiation.
- CFCs react with carbon dioxide to form ozone.
- CFCs cool the troposphere, preventing ozone formation.
= Chlorine is regenerated in the reaction cycle, so a little CFC destroys a great deal of ozone. The Montreal Protocol phased out CFCs, and the ozone layer is slowly recovering.

@ 9 | - | Ozone depletion
Which is a direct effect of thinning of the stratospheric ozone layer on human health?
* Increased rates of skin cancer and cataracts from more UV-B radiation
- Increased asthma from ground-level ozone
- Increased lung cancer from radon
- Increased global temperatures
= Stratospheric ozone absorbs UV-B, which damages DNA. Ozone depletion and global warming are separate problems, though CFCs are also greenhouse gases.

@ 9 | - | Greenhouse effect
Which describes how greenhouse gases warm Earth's surface?
* They absorb infrared radiation emitted by Earth's surface and re-emit some of it back toward the surface.
- They absorb incoming visible light from the sun.
- They create holes in the ozone layer.
- They reflect sunlight back to space.
= Earth absorbs sunlight and radiates heat as infrared radiation. Greenhouse gases absorb that infrared, warming the lower atmosphere.

@ 9 | - | Sea level rise
Which two factors are the main causes of rising sea level?
* Thermal expansion of seawater and melting of glaciers and ice sheets on land
- Melting of floating sea ice and increased rainfall
- Increased evaporation and river flow
- Volcanic eruptions and earthquakes
= Water expands as it warms, and meltwater from land ice adds volume to the ocean. Floating sea ice already displaces its own mass of water, so its melting adds little.

@ 9 | - | Climate feedbacks
Arctic sea ice melts, exposing dark ocean water. Why does this accelerate warming?
* Dark water has a lower albedo than ice, so it absorbs more sunlight, causing further warming and more melting.
- Ice absorbs more sunlight than water.
- Melting ice releases large amounts of ce{CO2}.
- Dark water reflects more sunlight.
= This positive feedback amplifies warming in the Arctic, which is warming several times faster than the global average.

@ 9 | - | Climate feedbacks
Which is a positive feedback that could accelerate climate change?
* Thawing permafrost releasing methane and ce{CO2} from decomposing organic matter
- Increased plant growth absorbing more ce{CO2}
- More clouds reflecting sunlight
- Increased weathering removing ce{CO2}
= Warming thaws soils that have stored carbon for thousands of years. Decomposition releases greenhouse gases, causing more warming.

@ 9 | - | Invasive species
Which set of traits makes a species most likely to become invasive?
* Rapid reproduction, generalist diet, and tolerance of a wide range of conditions
- Slow reproduction and a specialized diet
- Long generation times and few offspring
- Dependence on a single host species
= These r-selected traits let invaders spread quickly and outcompete natives. Zebra mussels, kudzu, and the Burmese python are examples.

@ 9 | - | Endangered species
Which factor is currently the leading cause of species endangerment worldwide?
* Habitat loss and fragmentation
- Pollution from radon
- Natural disasters
- Volcanic eruptions
= The HIPPCO acronym lists the major threats: habitat loss, invasive species, population growth, pollution, climate change, and overexploitation. Habitat loss affects the most species.

@ 9 | - | Endangered species
Which international agreement regulates trade in endangered species and their parts, such as ivory?
* CITES (the Convention on International Trade in Endangered Species)
- The Montreal Protocol
- The Kyoto Protocol
- The Clean Water Act
= CITES restricts commercial trade in species threatened by overexploitation. The Montreal Protocol addresses ozone depletion, and the Clean Water Act is a U.S. law.

@ 9 | - | Climate change effects
Which is an expected effect of climate change on the ranges of many species?
* Shifts toward the poles and to higher elevations as temperatures warm
- Shifts toward the equator
- No change in ranges
- Movement to lower elevations
= Species track suitable climates. Those that cannot move, such as alpine species already at mountaintops, are at high risk of extinction.

@ 9 | - | Climate policy
How does a cap-and-trade system reduce greenhouse gas emissions?
* It sets a limit on total emissions and lets companies buy and sell permits, so reductions happen where they are cheapest.
- It bans all fossil fuels immediately.
- It taxes every product equally.
- It requires every company to cut emissions by the same amount.
= The cap ensures total emissions fall over time, while trading creates a market incentive to cut emissions efficiently. A carbon tax instead sets a price on emissions.

@ 9 | - | Climate change and disease
Which is a likely effect of warming temperatures on vector-borne diseases such as malaria?
* The range of mosquitoes that carry the disease expands into higher latitudes and elevations.
- Mosquitoes disappear from tropical regions.
- Malaria becomes a waterborne disease.
- The disease becomes less common everywhere.
= Mosquitoes and the parasites they carry develop faster in warmer conditions, so areas that were too cold may become suitable.

@ 9 | - | Coral reefs
Which combination of stresses most threatens coral reefs worldwide?
* Warming water causing bleaching, ocean acidification, and pollution
- Increased dissolved oxygen and lower temperatures
- Too few nutrients and too much sunlight
- Freshwater inflow only
= Bleaching, acidification, sediment and nutrient pollution, and destructive fishing act together, reducing reefs' ability to recover.

@ 7 | - | Pollution control
How does an electrostatic precipitator remove particulate matter from a smokestack?
* It gives particles an electric charge so that they are attracted to oppositely charged plates and collected.
- It sprays the gas with limestone slurry to dissolve the particles.
- It converts particles into carbon dioxide.
- It cools the gas until the particles evaporate.
= Collected particles fall into hoppers for disposal. Precipitators remove most particulates but do not remove gases such as ce{SO2}, which require scrubbers.

@ 7 | - | Sources of air pollution
Which source produces the largest share of sulfur dioxide emissions in most industrialized countries?
* Coal-burning power plants
- Gasoline-powered cars
- Natural gas furnaces
- Wind turbines
= Coal contains sulfur that forms ce{SO2} when burned. Switching to low-sulfur coal or natural gas and installing scrubbers have greatly reduced these emissions in the United States.

@ 8 | - | Toxicology
Exposure to asbestos increases lung cancer risk, and so does smoking, but people exposed to both have a far greater risk than the two risks added together. Which term describes this?
* Synergism
- Biomagnification
- Bioaccumulation
- Antagonism
= In synergism, the combined effect of two substances is greater than the sum of their separate effects. Assessing chemicals one at a time can underestimate real risks.

@ 8 | - | Wastewater
In a household septic system, what happens to the liquid wastewater after solids settle in the tank?
* It flows into a drain field, where soil filters it and bacteria decompose remaining organic matter.
- It is piped directly into a river.
- It is boiled to kill pathogens.
- It is stored permanently in the tank.
= Septic systems rely on soil and microbes for treatment. Systems that fail, or are too close to wells and streams, can release nutrients and pathogens.

@ 9 | - | Ozone depletion
Hydrofluorocarbons (HFCs) replaced CFCs because they do not destroy stratospheric ozone. Why are HFCs now being phased down?
* Many HFCs are powerful greenhouse gases with high global warming potentials.
- They destroy even more ozone than CFCs.
- They cause acid rain.
- They are toxic to plants.
= Solving one problem created another. The Kigali Amendment to the Montreal Protocol schedules reductions in HFC use.

@ 9 | - | Overexploitation
The passenger pigeon, once among the most abundant birds in North America, became extinct in 1914. Which factor was most responsible?
* Overhunting, combined with loss of the forest habitat the birds depended on
- Climate change
- An invasive predator
- Ozone depletion
= Commercial hunting killed millions of birds, and the species' dependence on huge colonies meant that small remaining populations could not breed successfully.

@ 9 | - | Invasive species
Zebra mussels, introduced into the Great Lakes in ships' ballast water, have which effects?
* They filter out large amounts of plankton, outcompete native mussels, and clog water intake pipes.
- They decrease water clarity by releasing sediment.
- They are a keystone predator that increases biodiversity.
- They have no effect because they cannot survive in fresh water.
= By removing plankton, zebra mussels disrupt food webs and clear the water. They attach to hard surfaces, causing costly damage to infrastructure.
`);

module.exports = { source, figures };
