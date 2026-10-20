// AP Psychology units 1–3: Biological Bases of Behavior, Cognition, and Development and
// Learning. Block format as in biology.cjs ("@ unit | - | skill | optional figure key").
// Questions are scenario- and data-based in the style of the 2024 course framework; all
// study results shown in figures are hypothetical unless a stem says otherwise.
const { graph, chart, table } = require('./figures.cjs');
const { draw } = require('./diagram.cjs');

const PINK = '#ec4899', AMBER = '#f59e0b', BLUE = '#3b82f6';
const r2 = n => Math.round(n * 100) / 100;
const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const pathOf = pts => 'M' + pts.map(([x, y]) => `${r2(x)} ${r2(y)}`).join(' L');

// Action potential: time 0–5 ms maps to x 60–360, and membrane potential to y.
const apY = mV => r2(30 + (50 - mV) * 1.2), apX = t => r2(60 + 60 * t);
const apPts = [[0, -70], [1, -70], [1.15, -58], [1.35, 0], [1.5, 40], [1.7, 10], [2.0, -40], [2.3, -80], [2.8, -78], [3.4, -71], [5, -70]];

// Hypnogram: hours 0–8 map to x 80–360; stages are rows.
const STAGE_Y = { W: 34, R: 58, N1: 82, N2: 106, N3: 130 };
const night = [[0, 'W'], [0.15, 'N1'], [0.3, 'N2'], [0.6, 'N3'], [1.2, 'N2'], [1.4, 'R'], [1.55, 'N2'], [1.9, 'N3'], [2.5, 'N2'], [2.9, 'R'], [3.2, 'N2'], [4.2, 'R'], [4.65, 'N2'], [5.6, 'R'], [6.2, 'N2'], [6.8, 'R'], [7.7, 'W'], [8, 'W']];
const hx = h => r2(80 + 35 * h);
function hypnogramItems() {
  const items = [];
  night.slice(0, -1).forEach(([h, st], i) => {
    const [h2, st2] = night[i + 1];
    items.push(['line', hx(h), STAGE_Y[st], hx(h2), STAGE_Y[st], { width: st === 'R' ? 5 : 2, color: st === 'R' ? PINK : BLUE }]);
    items.push(['line', hx(h2), STAGE_Y[st], hx(h2), STAGE_Y[st2], { width: 1.2, color: BLUE }]);
  });
  return items;
}

// IQ distribution: 55–145 maps to x 40–380.
const iqX = v => r2(40 + (v - 55) * 340 / 90), iqY = v => r2(160 - 130 * Math.exp(-(((v - 100) / 15) ** 2) / 2));
const iqCurve = Array.from({ length: 91 }, (_, i) => [iqX(55 + i), iqY(55 + i)]);
const iqShade = [[iqX(85), 160], ...Array.from({ length: 31 }, (_, i) => [iqX(85 + i), iqY(85 + i)]), [iqX(115), 160]];

// Fixed-interval responding rises in scallops.
const fiPts = Array.from({ length: 81 }, (_, i) => { const t = i / 8, k = Math.floor(t / 2.5), u = (t - 2.5 * k) / 2.5; return [t, Math.min(k, 3) * 10 + 10 * (t >= 10 ? 1 : u ** 3)]; });

const figures = {
  neuron: draw(400, 160, 'A neuron with five labeled parts. A: the branching fibers on the left that extend from the cell body. B: the cell body. C: the long fiber extending to the right, visible in a gap between coverings. D: one of the segmented coverings wrapped around that fiber. E: the branched endings at the far right', [
    ...[[34, 40], [22, 82], [34, 126], [62, 28], [60, 138]].map(([x, y]) => ['line', 80, 82, x, y, { width: 1.6 }]), ['line', 34, 40, 18, 34, { width: 1.2 }], ['line', 34, 126, 18, 136, { width: 1.2 }],
    ['circle', 80, 82, 22, { fill: true }], ['circle', 80, 82, 7, { fill: 'currentColor' }],
    ['line', 102, 82, 330, 82, { width: 2 }], ...[118, 170, 222, 274].map(x => ['rect', x, 74, 42, 16, { fill: true }]),
    ...[[364, 52], [372, 82], [364, 112]].flatMap(([x, y]) => [['line', 330, 82, x, y], ['circle', x, y, 5, { fill: 'currentColor' }]]),
    text(64, 18, 'A', { bold: true }), ['line', 80, 104, 80, 122, { width: 1 }], text(80, 136, 'B', { bold: true }),
    ['line', 166, 85, 166, 116, { width: 1 }], text(166, 130, 'C', { bold: true }), ['line', 243, 74, 243, 52, { width: 1 }], text(243, 46, 'D', { bold: true }), text(386, 40, 'E', { bold: true }),
  ]),
  actionPotential: draw(400, 230, 'Graph of a neuron\'s membrane potential over five milliseconds. The potential rests at −70 mV (segment A), rises sharply to about +40 mV (segment B), falls quickly (segment C), dips below −70 mV to about −80 mV (segment D), and then returns to −70 mV. A dashed line marks the threshold at −55 mV', [
    ['line', 60, 26, 60, 204], ['line', 60, 204, 370, 204], text(215, 224, 'Time (ms)', { size: 11 }), text(8, 16, 'Membrane potential (mV)', { size: 11, anchor: 'start' }),
    ...[[40, '+40'], [0, '0'], [-55, '−55'], [-70, '−70']].flatMap(([v, l]) => [text(54, apY(v) + 4, l, { anchor: 'end', size: 10 }), ['line', 60, apY(v), 370, apY(v), { width: 0.8, dash: true, color: v === -55 ? AMBER : 'currentColor' }]]),
    ['path', pathOf(apPts.map(([t, v]) => [apX(t), apY(v)])), { color: BLUE, width: 2.4 }],
    text(100, apY(-70) - 8, 'A', { bold: true }), text(apX(1.2) - 8, apY(10), 'B', { bold: true, anchor: 'end' }), text(apX(1.9) + 10, apY(10), 'C', { bold: true, anchor: 'start' }), text(apX(2.5), apY(-80) + 22, 'D', { bold: true }),
    text(372, apY(-55) - 4, 'threshold', { size: 10, anchor: 'end' }),
  ]),
  lobes: draw(360, 250, 'Side view of a human brain, with the front of the head on the left. Region A is the front portion of the cerebral cortex. Region B is the top rear portion, behind a groove running down from the top. Region C is at the back of the cortex. Region D lies along the side, below a deep horizontal fissure. Region E is the small, folded structure tucked beneath the back of the cortex', [
    ['path', 'M50 120 C40 60 110 25 190 28 C270 30 330 70 322 128 C318 160 296 176 262 176 C240 188 200 190 160 184 C110 190 60 170 50 120 Z', { fill: true, width: 2.2 }],
    ['path', 'M204 30 C196 60 188 90 180 122', { width: 1.6 }], ['path', 'M104 134 C140 126 190 122 236 128', { width: 1.6 }], ['path', 'M292 62 C284 96 286 124 296 150', { width: 1.6, dash: true }],
    ['path', 'M232 182 C236 204 262 214 290 206 C310 198 304 176 284 172', { fill: true, width: 1.6 }], ['path', 'M226 186 C226 206 222 224 220 244 M246 182 C244 206 240 224 238 244', { width: 1.6 }],
    text(116, 90, 'A', { bold: true, size: 15 }), text(242, 82, 'B', { bold: true, size: 15 }), text(306, 112, 'C', { bold: true, size: 15 }), text(170, 162, 'D', { bold: true, size: 15 }), text(272, 196, 'E', { bold: true, size: 13 }),
  ]),
  hypnogram: draw(380, 180, 'A hypnogram showing one night of sleep. Over eight hours, the sleeper cycles through stages roughly every 90 minutes. Deep N3 sleep appears only in the first three hours. REM periods, drawn as thick pink bars, occur about five times and grow longer as the night goes on. The sleeper wakes at the end', [
    ...Object.entries({ Awake: 'W', REM: 'R', N1: 'N1', N2: 'N2', N3: 'N3' }).map(([l, k]) => text(70, STAGE_Y[k] + 4, l, { anchor: 'end', size: 11 })),
    ['line', 80, 146, 360, 146], ...[0, 1, 2, 3, 4, 5, 6, 7, 8].flatMap(h => [['line', hx(h), 146, hx(h), 151], text(hx(h), 164, String(h), { size: 10 })]), text(220, 178, 'Hours of sleep', { size: 11 }),
    ...hypnogramItems(),
  ]),
  twins: table(['Relationship', 'Approximate genes shared', 'Concordance for disorder X'], [
    ['Identical twins raised together', '100%', '48%'], ['Identical twins raised apart', '100%', '44%'], ['Fraternal twins raised together', '50%', '17%'], ['Non-twin siblings', '50%', '9%'], ['Unrelated children raised together', 'about 0%', '2%'],
  ], 'Table of concordance rates for a hypothetical disorder X. Identical twins raised together: 100 percent of genes shared, 48 percent concordance. Identical twins raised apart: 100 percent, 44 percent. Fraternal twins raised together: 50 percent, 17 percent. Non-twin siblings: 50 percent, 9 percent. Unrelated children raised together: about 0 percent, 2 percent'),
  threshold: graph({ x: [0, 10], y: [0, 100], xstep: 2, ystep: 25, xlabel: '', ylabel: '', xtitle: 'Stimulus intensity (arbitrary units)', ytitle: 'Trials on which stimulus was detected (%)', w: 380,
    curves: [{ fn: x => 100 / (1 + Math.exp(-(x - 5) * 1.4)), from: 0, to: 10 }, { pts: [[0, 50], [5, 50]], dash: true, color: PINK }, { pts: [[5, 0], [5, 50]], dash: true, color: PINK }],
    alt: 'Graph of the percentage of trials on which a participant detected a faint light at different intensities. Detection rises in an S-shaped curve from near 0 percent at intensity 1 to near 100 percent at intensity 9, crossing 50 percent at intensity 5, marked with dashed lines' }),
  sdt: table(['Radiologist', 'Hits', 'Misses', 'False alarms', 'Correct rejections'], [['P', '47', '3', '28', '22'], ['Q', '31', '19', '4', '46']],
    'Table of results for two radiologists who each examined 100 scans, 50 with a tumor and 50 without. Radiologist P: 47 hits, 3 misses, 28 false alarms, and 22 correct rejections. Radiologist Q: 31 hits, 19 misses, 4 false alarms, and 46 correct rejections'),

  gestalt: draw(380, 160, 'A grid of dots arranged in six rows. The dots in each row are evenly spaced vertically, but horizontally they are grouped into four pairs of closely spaced columns separated by wider gaps', [
    ...[60, 78, 140, 158, 220, 238, 300, 318].flatMap(x => [0, 1, 2, 3, 4, 5].map(i => ['circle', x, 26 + i * 22, 5, { fill: 'currentColor' }])),
  ]),
  mullerLyer: draw(380, 170, 'Two horizontal line segments of exactly the same length. Line A, on top, has arrowheads at its ends pointing outward. Line B, below, has fins at its ends pointing away from the line, like the tail of an arrow', [
    ['line', 110, 50, 270, 50, { width: 2.4 }], ['path', 'M130 34 L110 50 L130 66 M250 34 L270 50 L250 66', { width: 2.4 }],
    ['line', 110, 125, 270, 125, { width: 2.4 }], ['path', 'M90 109 L110 125 L90 141 M290 109 L270 125 L290 141', { width: 2.4 }],
    text(40, 55, 'A', { bold: true }), text(40, 130, 'B', { bold: true }),
  ]),
  serial: chart({ type: 'line', title: 'Recall by position in a 15-word list', categories: Array.from({ length: 15 }, (_, i) => String(i + 1)), series: [{ name: 'Immediate recall', values: [86, 74, 62, 51, 44, 39, 36, 35, 37, 40, 46, 56, 68, 80, 91] }], ymax: 100, ystep: 20, ylabel: '% recalled',
    alt: 'Line graph of the percentage of participants recalling each word of a 15-word list, by its position in the list. Recall is high for the first word, 86 percent, falls to about 35 percent for words in the middle, and rises again to 91 percent for the last word' }),
  levels: chart({ title: 'Words recalled after each kind of question', categories: ['Font (“Is it in capitals?”)', 'Sound (“Does it rhyme?”)', 'Meaning (“Is it a fruit?”)'], series: [{ name: 'Recall', values: [18, 36, 68] }], ymax: 80, ystep: 20, ylabel: '% recalled', w: 460,
    alt: 'Bar graph from a study in which participants answered one of three kinds of questions about each word before a surprise recall test. Words judged by font were recalled 18 percent of the time, words judged by sound 36 percent, and words judged by meaning 68 percent' }),
  context: chart({ title: 'Recall by place of learning and of testing', categories: ['Tested on land', 'Tested underwater'], series: [{ name: 'Learned on land', values: [14, 9] }, { name: 'Learned underwater', values: [9, 12] }], ymax: 16, ystep: 4, ylabel: 'Words recalled',
    alt: 'Bar graph of a study of divers who learned word lists either on land or underwater and were tested in one of the two places. Divers who learned on land recalled 14 words on land and 9 underwater. Divers who learned underwater recalled 9 words on land and 12 underwater' }),
  forgetting: graph({ x: [0, 6], y: [0, 100], ystep: 20, xlabel: '', ylabel: '', xtitle: 'Days since learning', ytitle: 'Material retained (%)', w: 370, curves: [{ fn: t => 22 + 78 * Math.exp(-2 * t), from: 0, to: 6 }],
    alt: 'Graph of the percentage of learned nonsense syllables retained over six days. Retention drops steeply within the first day, from 100 percent to about 33 percent, and then levels off near 22 percent for the remaining days' }),
  iq: draw(420, 200, 'A normal distribution of IQ scores with a mean of 100 and a standard deviation of 15. The axis is marked at 55, 70, 85, 100, 115, 130, and 145. The region between 85 and 115 is shaded', [
    ['path', pathOf(iqShade) + ' Z', { fill: true, width: 0.1 }], ['path', pathOf(iqCurve), { width: 2.2 }], ['line', 30, 160, 390, 160],
    ...[55, 70, 85, 100, 115, 130, 145].flatMap(v => [['line', iqX(v), 160, iqX(v), 166], text(iqX(v), 180, String(v), { size: 11 })]), text(210, 197, 'IQ score', { size: 11 }),
  ]),
  reliability: graph({ x: [60, 100], y: [60, 100], xstep: 10, ystep: 10, xlabel: '', ylabel: '', xtitle: 'Score on first testing', ytitle: 'Score on retest two weeks later', w: 360,
    dots: [[64, 66], [67, 65], [70, 72], [72, 70], [75, 77], [77, 74], [80, 82], [82, 79], [84, 86], [87, 85], [89, 91], [92, 90], [95, 96], [97, 94]].map(([x, y]) => ({ x, y })),
    alt: 'Scatterplot of 14 people\'s scores on a new test and on the same test two weeks later. The points lie close to a straight line rising from about 65 to about 95, showing that people scored nearly the same both times' }),

  habituation: chart({ type: 'line', title: 'Mean looking time on each trial (seconds)', categories: ['1', '2', '3', '4', '5', '6', '7', '8'], series: [{ name: 'Looking time', values: [12, 10, 7.5, 5.5, 4.2, 3.4, 9.6, 7.2] }], ymax: 14, ystep: 2,
    alt: 'Line graph of infants\' mean looking time across eight trials. Looking time falls steadily from 12 seconds on trial 1 to 3.4 seconds on trial 6, jumps to 9.6 seconds on trial 7, and falls to 7.2 seconds on trial 8' }),
  conservation: draw(360, 170, 'Two glasses holding the same amount of juice. Glass A is short and wide. Glass B is tall and narrow, so its juice level is much higher', [
    ['path', 'M60 70 V150 H160 V70', { width: 2.2 }], ['rect', 61, 110, 98, 39, { fill: BLUE, color: BLUE, width: 0.1 }], text(110, 166, 'A', { bold: true }),
    ['path', 'M240 20 V150 H290 V20', { width: 2.2 }], ['rect', 241, 70, 48, 79, { fill: BLUE, color: BLUE, width: 0.1 }], text(265, 166, 'B', { bold: true }),
  ]),
  strange: table(['Infant', 'When the caregiver leaves', 'When the caregiver returns'], [
    ['1', 'Becomes mildly upset and explores less', 'Greets the caregiver, is quickly comforted, and resumes play'],
    ['2', 'Shows little visible distress and keeps playing', 'Looks away and avoids contact with the caregiver'],
    ['3', 'Becomes intensely distressed', 'Seeks contact but then pushes the caregiver away and stays upset'],
    ['4', 'Freezes, then rocks in place', 'Approaches, then backs away and appears confused'],
  ], 'Table describing four infants\' behavior in the Strange Situation. Infant 1 becomes mildly upset when the caregiver leaves and is quickly comforted on return. Infant 2 shows little distress and avoids the caregiver on return. Infant 3 is intensely distressed and, on return, seeks contact but pushes the caregiver away. Infant 4 freezes and rocks, then approaches and backs away in confusion'),
  conditioning: graph({ x: [0, 30], y: [0, 10], xstep: 5, ystep: 2, xlabel: '', ylabel: '', xtitle: 'Trials', ytitle: 'Strength of conditioned response', w: 380,
    curves: [{ fn: t => 9 * (1 - Math.exp(-t / 3)), from: 0, to: 10 }, { fn: t => 9 * Math.exp(-(t - 10) / 3), from: 10, to: 20 }, { fn: t => 5 * Math.exp(-(t - 22) / 2.5), from: 22, to: 30 }, { pts: [[21, 0], [21, 10]], dash: true, color: PINK }],
    notes: [{ x: 4, y: 9.3, text: 'A' }, { x: 14, y: 5.4, text: 'B' }, { x: 22.6, y: 5.4, text: 'C' }, { x: 21.4, y: 8.6, text: 'one-day rest' }],
    alt: 'Graph of the strength of a dog\'s conditioned salivation response over 30 trials. In segment A, trials 0 to 10, the response rises to about 9. In segment B, trials 10 to 20, it falls to near 0. After a one-day rest, marked by a dashed line, segment C begins at about 5 and falls again' }),
  gradient: chart({ title: 'Responses to test tones after conditioning', categories: ['600 Hz', '800 Hz', '1000 Hz', '1200 Hz', '1400 Hz'], series: [{ name: 'Responses', values: [12, 48, 90, 50, 14] }], ymax: 100, ystep: 20, ylabel: 'Responses',
    alt: 'Bar graph of the number of conditioned responses an animal made to five test tones. The response is greatest, 90, to the 1000 Hz tone and decreases for tones farther from it: 48 at 800 Hz, 50 at 1200 Hz, 12 at 600 Hz, and 14 at 1400 Hz' }),
  schedules: graph({ x: [0, 10], y: [0, 100], xstep: 2, ystep: 20, xlabel: '', ylabel: '', xtitle: 'Time (minutes)', ytitle: 'Cumulative responses', w: 380,
    curves: [
      { pts: [[0, 0], [2, 19], [4, 38], [6, 58], [8, 77], [10, 96]] },
      { pts: [[0, 0], [1.8, 16], [2.2, 16], [4, 32], [4.4, 32], [6.2, 48], [6.6, 48], [8.4, 64], [8.8, 64], [10, 75]], color: PINK },
      { pts: fiPts, color: AMBER },
      { pts: [[0, 0], [2.5, 11], [5, 22], [7.5, 34], [10, 45]], color: 'currentColor' },
    ],
    notes: [{ x: 9.4, y: 94, text: 'W', anchor: 'end' }, { x: 9.8, y: 78, text: 'X', anchor: 'end' }, { x: 9.8, y: 32, text: 'Y', anchor: 'end' }, { x: 9.2, y: 47, text: 'Z', anchor: 'end' }],
    alt: 'Cumulative records for four reinforcement schedules over ten minutes. Line W rises steeply and steadily to 96 responses. Line X rises steeply in runs separated by brief flat pauses, reaching 75. Line Y forms scallops: flat after each reinforcement and then curving upward, reaching 40. Line Z rises slowly and steadily to 45' }),
  bobo: chart({ title: 'Aggressive acts imitated by children', categories: ['Model rewarded', 'Model punished', 'No consequences'], series: [{ name: 'No incentive', values: [3.4, 1.4, 3.2] }, { name: 'Offered a reward to imitate', values: [4.0, 3.8, 3.9] }], ymax: 5, ystep: 1, ylabel: 'Mean acts',
    alt: 'Bar graph of the mean number of a model\'s aggressive acts that children imitated. With no incentive, children who saw the model rewarded imitated 3.4 acts, model punished 1.4, and no consequences 3.2. When offered a reward to imitate, all groups imitated about 4 acts: 4.0, 3.8, and 3.9' }),
};

const source = String.raw`
@ 1 | - | Neurons | neuron
In the neuron shown, what is the main function of the structure labeled D?
* It insulates the axon and speeds the transmission of the electrical signal.
- It receives chemical messages from other neurons.
- It releases neurotransmitters into the synapse.
- It contains the nucleus and maintains the cell's life.
= D is the myelin sheath. Its segments insulate the axon, so the impulse jumps between the gaps (nodes), which is much faster than conduction along an unmyelinated axon.

@ 1 | - | Neurons | neuron
Multiple sclerosis is an autoimmune disease that gradually destroys structure D in the diagram. Which symptom pattern would be expected?
* Slowed and disrupted communication between the brain and muscles, leading to weakness and loss of coordination
- Overproduction of neurotransmitters, leading to seizures
- An inability of the neuron to receive any messages from other neurons
- Faster neural transmission, leading to exaggerated reflexes
= Without myelin, signals travel slowly and can fail along the axon. Because motor commands are delayed or lost, multiple sclerosis typically produces weakness, numbness, and problems with coordination and vision.

@ 1 | - | Neurons | neuron
Which labeled part of the neuron is specialized to receive messages from other neurons?
* A
- C
- D
- E
= A marks the dendrites, branching fibers covered in receptor sites. Messages travel from the dendrites to the cell body (B), along the axon (C), and out through the terminal buttons (E).

@ 1 | - | Neural transmission | neuron
Neurotransmitter molecules are stored in vesicles and released into the synaptic gap from which labeled structure?
* E
- A
- B
- D
= E marks the axon terminals, or terminal buttons. When an action potential arrives, vesicles fuse with the terminal membrane and release neurotransmitters, which cross the synapse to the next neuron's dendrites.

@ 1 | - | Action potential | actionPotential
The rapid rise in the segment labeled B is caused mainly by which event?
* Positively charged sodium ions rush into the axon through opened channels.
- Positively charged potassium ions flow out of the axon.
- Neurotransmitters cross the synapse into the axon.
- The myelin sheath releases stored electrical charge.
= Once threshold is reached, voltage-gated sodium channels open and sodium ions flood in, so the inside of the axon briefly becomes positive (depolarization). The later fall, C, occurs as potassium flows out.

@ 1 | - | Action potential | actionPotential
During the segment labeled D, the neuron is harder to fire than it is at rest. Which statement best explains this?
* The membrane is more negative than its resting potential, so a stronger stimulus is needed to reach threshold.
- The neuron has run out of neurotransmitters.
- The neuron is still depolarized, so it cannot depolarize again.
- The myelin sheath is temporarily blocking the axon.
= After an action potential, potassium continues to leave briefly, so the membrane overshoots to about \(-80\) mV. This refractory period limits how quickly a neuron can fire again.

@ 1 | - | All-or-none principle | actionPotential
A researcher increases the strength of the stimulus delivered to the neuron graphed. How will the neuron's response change, assuming the stimulus was already above threshold?
* The neuron will fire more frequently, but each action potential will reach the same peak.
- Each action potential will reach a higher peak, such as \(+80\) mV.
- The resting potential will become more positive.
- The neuron will stop firing because it is overstimulated.
= Firing is all-or-none: once threshold is reached, every action potential has the same size. The nervous system signals a stronger stimulus by a higher firing rate and by recruiting more neurons.

@ 1 | - | Neurotransmitters and drugs
A medication for depression prevents the sending neuron from reabsorbing serotonin after it is released. What is the most direct effect?
* Serotonin remains in the synapse longer, increasing its effect on the receiving neuron.
- The receiving neuron's serotonin receptors are blocked.
- The sending neuron produces less serotonin.
- Serotonin is converted into dopamine in the synapse.
= Selective serotonin reuptake inhibitors (SSRIs) block reuptake, the process by which a sending neuron reabsorbs excess neurotransmitter. More serotonin stays available to bind with receptors.

@ 1 | - | Agonists and antagonists
Curare, a plant poison, binds to acetylcholine receptors at muscles without activating them, causing paralysis. How is curare classified?
* As an antagonist, because it blocks the neurotransmitter's action
- As an agonist, because it mimics the neurotransmitter
- As a reuptake inhibitor, because it keeps acetylcholine in the synapse
- As a hormone, because it acts on muscles
= An antagonist occupies receptor sites without triggering them, preventing the natural neurotransmitter from acting. Because acetylcholine triggers muscle contraction, blocking it causes paralysis.

@ 1 | - | Neurotransmitters and drugs
Benzodiazepines reduce anxiety by enhancing the effect of a neurotransmitter at its receptors. Which neurotransmitter is it, and what is its main role?
* GABA, the brain's main inhibitory neurotransmitter
- Glutamate, the brain's main excitatory neurotransmitter
- Dopamine, which is involved in reward and movement
- Endorphins, which relieve pain
= Benzodiazepines are GABA agonists. Increasing inhibition calms neural activity, which reduces anxiety and can cause drowsiness. Too little GABA activity is linked to anxiety and seizures.

@ 1 | - | Neurotransmitters and disorders
A patient develops tremors, muscle rigidity, and difficulty starting movements. Treatment with L-dopa, a precursor of a neurotransmitter, improves the symptoms. Which neurotransmitter is most likely deficient?
* Dopamine
- Serotonin
- Acetylcholine
- GABA
= These are symptoms of Parkinson's disease, in which dopamine-producing neurons in the substantia nigra die. L-dopa crosses into the brain and is converted to dopamine.

@ 1 | - | Psychoactive drugs
After months of drinking coffee daily, a student needs three cups to feel as alert as one cup once made them feel. Which concept does this describe?
* Tolerance
- Withdrawal
- Agonism
- Sensory adaptation
= Tolerance develops as the brain adapts to repeated drug use, so a larger dose is needed for the same effect. Withdrawal refers to the unpleasant symptoms, such as headaches, that occur when the drug is stopped.

@ 1 | - | Psychoactive drugs
A drug increases heart rate, alertness, and feelings of euphoria for several hours, after which the user feels fatigued and depressed. To which class of drugs does it most likely belong?
* Stimulants
- Depressants
- Hallucinogens
- Opioids
= Stimulants, such as cocaine and amphetamines, speed up nervous system activity, often by increasing dopamine and norepinephrine. The later crash reflects the brain's depleted neurotransmitter supply.

@ 1 | - | Cerebral cortex | lobes
After damage to the region labeled A, a once-careful accountant becomes impulsive, makes poor decisions, and struggles to plan ahead. Which lobe was most likely damaged?
* Frontal lobe
- Parietal lobe
- Occipital lobe
- Temporal lobe
= Region A is the frontal lobe, whose prefrontal cortex supports planning, judgment, and impulse control. Phineas Gage's personality changes after his injury are the classic example.

@ 1 | - | Cerebral cortex | lobes
A stroke damages the region labeled C, while the eyes remain healthy. Which difficulty is the patient most likely to have?
* Problems seeing or recognizing objects in part of the visual field
- Problems understanding spoken language
- Loss of the sense of touch on one side of the body
- Loss of balance and coordination
= Region C is the occipital lobe, which contains the primary visual cortex. Damage there can cause blindness in part of the visual field even though the eyes work normally.

@ 1 | - | Language areas | lobes
A patient speaks fluently, but the speech makes little sense, and the patient has great difficulty understanding what others say. Damage to the left side of which region is most likely?
* D, the temporal lobe
- A, the frontal lobe
- B, the parietal lobe
- E, the cerebellum
= These symptoms describe Wernicke's aphasia. Wernicke's area, which supports language comprehension, lies in the left temporal lobe near the auditory cortex.

@ 1 | - | Cerebral cortex | lobes
The somatosensory cortex, which processes touch and body position, forms a strip at the front edge of which labeled region?
* B
- A
- C
- D
= Region B is the parietal lobe. The somatosensory cortex lies just behind the central groove that separates it from the frontal lobe, where the motor cortex lies.

@ 1 | - | Brain structures | lobes
A police officer asks a driver to walk heel-to-toe in a straight line. This test checks for impaired functioning of which labeled structure?
* E, the cerebellum
- A, the frontal lobe
- C, the occipital lobe
- D, the temporal lobe
= The cerebellum coordinates balance and smooth, precise movements. Alcohol impairs its function, so a person who is intoxicated has difficulty with tasks requiring fine motor coordination.

@ 1 | - | Language areas
A patient understands questions well but speaks slowly in short, effortful phrases, such as "Walk… dog… park." Damage to which area is most likely?
* Broca's area in the left frontal lobe
- Wernicke's area in the left temporal lobe
- The corpus callosum
- The right occipital lobe
= Broca's area controls the muscle movements of speech. Damage produces nonfluent, effortful speech with relatively preserved comprehension, the opposite pattern from Wernicke's aphasia.

@ 1 | - | Hemispheric specialization
A split-brain patient stares at a central dot while the word "key" is flashed briefly to the left visual field. Which response is most likely?
* The patient says they saw nothing, but the left hand can pick out a key by touch.
- The patient says "key" aloud and picks a key with the right hand.
- The patient says "key" aloud but cannot pick it out with either hand.
- The patient cannot respond in any way.
= Information from the left visual field goes to the right hemisphere, which usually cannot produce speech. With the corpus callosum cut, the information cannot reach the left hemisphere's language areas, but the right hemisphere controls the left hand.

@ 1 | - | Brain structures
After surgery that removed parts of both temporal lobes, a patient could no longer form new memories of facts and events but remembered his childhood well. Which structure was most likely removed?
* The hippocampus
- The cerebellum
- The amygdala alone
- The thalamus
= The hippocampus is essential for forming new explicit (declarative) memories, as the case of patient H.M. showed. Older memories, already stored elsewhere in the cortex, remained.

@ 1 | - | Brain structures
Which brain structure regulates hunger, thirst, and body temperature and controls the pituitary gland?
* The hypothalamus
- The thalamus
- The medulla
- The reticular formation
= The hypothalamus maintains homeostasis through these drives and links the nervous system to the endocrine system by directing the pituitary, often called the master gland.

@ 1 | - | Brain structures
An injury to which structure is most likely to be immediately life-threatening because it controls breathing and heart rate?
* The medulla
- The occipital lobe
- The amygdala
- The corpus callosum
= The medulla, in the brainstem, controls automatic survival functions such as breathing and heartbeat. Damage there can stop these functions.

@ 1 | - | Neuroplasticity
A 5-year-old has the left hemisphere removed to stop severe seizures. Over several years, the child regains much of the ability to speak. Which concept does this best illustrate?
* Neuroplasticity, which is greatest in childhood
- Hemispheric lateralization, which prevents language from shifting
- Myelination of the corpus callosum
- The all-or-none principle
= The brain can reorganize by forming new connections, and this capacity is greatest early in life. Here the right hemisphere took over language functions usually handled by the left.

@ 1 | - | Research methods in neuroscience
A researcher wants to know exactly when, to the millisecond, brain activity changes as a participant recognizes a face. Which method is best suited?
* EEG, because it records electrical activity with very precise timing
- fMRI, because it shows which areas use the most oxygen
- A lesion study, because it shows which area is necessary
- A CT scan, because it shows brain structure
= An EEG measures electrical activity at the scalp with millisecond timing, though it localizes activity poorly. An fMRI shows where activity occurs more precisely but tracks blood flow, which changes over seconds.

@ 1 | - | Autonomic nervous system
After a near-collision while driving, a person's racing heart gradually slows and digestion resumes. Which division of the nervous system produces this calming?
* The parasympathetic nervous system
- The sympathetic nervous system
- The somatic nervous system
- The central nervous system
= The sympathetic division prepares the body for fight or flight, while the parasympathetic division restores calm and conserves energy. Both are branches of the autonomic nervous system.

@ 1 | - | Circadian rhythms
A traveler who flies across six time zones feels wide awake at 3 a.m. local time. Which statement best explains this?
* The traveler's circadian rhythm, regulated by the suprachiasmatic nucleus and the timing of melatonin release, is still set to the home time zone.
- The traveler is in REM sleep while awake.
- The pituitary gland has stopped releasing hormones.
- The traveler's sleep debt has been fully repaid.
= Jet lag occurs because the body's roughly 24-hour clock, set by light acting on the suprachiasmatic nucleus of the hypothalamus, takes days to shift to a new schedule. The pineal gland releases melatonin when that clock signals night.

@ 1 | - | Sleep stages | hypnogram
Based on the hypnogram, which stage of sleep is concentrated in the first third of the night?
* N3, deep slow-wave sleep
- REM sleep
- N1 sleep
- Wakefulness
= In the graph, N3 appears only in the first two cycles. The body's need for deep sleep is met early, and later cycles consist mostly of N2 and REM sleep.

@ 1 | - | Sleep stages | hypnogram
How do the REM periods in the hypnogram change over the course of the night?
* They become longer and more frequent toward morning.
- They become shorter as the night goes on.
- They occur only in the first cycle.
- They stay the same length all night.
= The first REM period lasts only minutes, while those near morning can last half an hour or more. This is why people often wake during or just after a dream.

@ 1 | - | Sleep disorders | hypnogram
A child often sleepwalks but has no memory of it the next morning. Based on the hypnogram, when during the night is sleepwalking most likely to occur?
* In the first few hours, during N3 sleep
- In the last few hours, during REM sleep
- Only just before waking
- At random times, because it is unrelated to sleep stages
= Sleepwalking and night terrors occur during deep N3 sleep, which is concentrated early in the night. In REM sleep, the body's major muscles are largely paralyzed, which normally prevents acting out dreams.

@ 1 | - | Sleep disorders
During the day, a person suddenly falls asleep while talking and briefly enters REM sleep, sometimes losing muscle tone after laughing. Which sleep disorder is most likely?
* Narcolepsy
- Insomnia
- Sleep apnea
- REM sleep behavior disorder
= Narcolepsy involves uncontrollable sleep attacks that can lead directly into REM sleep. Cataplexy, the sudden loss of muscle tone triggered by strong emotion, is a hallmark of the disorder.

@ 1 | - | Heredity and environment | twins
Which comparison in the table provides the strongest evidence that genes contribute to disorder X?
* Identical twins raised apart have a much higher concordance than fraternal twins raised together.
- Fraternal twins have a higher concordance than non-twin siblings.
- Unrelated children raised together have a low concordance.
- Non-twin siblings have a concordance of 9 percent.
= Identical twins raised apart share all of their genes but not their environment, yet their concordance is far higher than that of fraternal twins, who share an environment and half of their genes. This pattern points to a genetic influence.

@ 1 | - | Heredity and environment | twins
Which conclusion about disorder X is best supported by the fact that concordance for identical twins is well below 100 percent?
* Environmental factors also influence whether a person develops the disorder.
- The disorder is caused entirely by genes.
- Identical twins do not actually share all of their genes.
- The disorder cannot be studied with twin research.
= If genes alone determined the disorder, an identical twin of someone affected would always be affected as well. A concordance near 48 percent indicates that nongenetic factors, such as experiences, also play a role.

@ 1 | - | Absolute threshold | threshold
Based on the graph, what is the participant's absolute threshold for the light?
* An intensity of 5, detected on 50 percent of trials
- An intensity of 1, the lowest intensity ever detected
- An intensity of 9, detected on nearly all trials
- An intensity of 10, the strongest stimulus tested
= The absolute threshold is defined as the minimum stimulus intensity detected 50 percent of the time. Detection does not jump from 0 to 100 percent, so a single cutoff would not describe the data.

@ 1 | - | Weber's law
For a certain participant, the just noticeable difference for weight is 2 percent. If the participant holds a 400-gram object, how much weight must be added before they notice a difference?
* 8 grams
- 2 grams
- 20 grams
- 0.5 gram
= Weber's law states that the just noticeable difference is a constant proportion of the original stimulus. Two percent of 400 grams is 8 grams; for a 100-gram object, 2 grams would suffice.

@ 1 | - | Signal detection theory | sdt
Two radiologists each examined the same 100 scans. Which statement best describes radiologist P compared with radiologist Q?
* P uses a more liberal response criterion, saying "tumor present" more readily, which produces more hits but also more false alarms.
- P has better eyesight, so P detects more tumors without any cost.
- P uses a more conservative criterion, which reduces false alarms.
- P and Q differ only by chance, because both examined 100 scans.
= Signal detection theory separates sensitivity from response bias. P says "tumor" far more often, catching nearly every tumor but also flagging 28 healthy scans. Expectations and the costs of a miss can shift a person's criterion in this way.

@ 1 | - | Sensory adaptation
A person who enters a bakery notices the strong smell of bread, but after twenty minutes no longer notices it. Which concept explains this?
* Sensory adaptation, a decrease in sensitivity to an unchanging stimulus
- Transduction, the conversion of stimulus energy into neural signals
- Signal detection, the decision about whether a stimulus is present
- Selective attention, the choice to focus on a different stimulus
= Sensory receptors respond less to constant stimulation, which frees attention for changes in the environment. The smell is still present, but the person's sensory response to it has decreased.

@ 1 | - | Color vision
After staring at a solid green square for a minute, a person looks at a white wall and sees a red square. Which theory best explains this?
* Opponent-process theory
- Trichromatic theory
- Place theory
- Frequency theory
= Opponent-process theory proposes that color is processed in pairs, such as red–green. Prolonged green stimulation fatigues the green response, so the paired red response dominates when the eyes view white.

@ 1 | - | Vision
On a dark night, a star is easier to see by looking slightly to the side of it rather than directly at it. Which statement best explains this?
* Rods, which are concentrated in the periphery of the retina, are more sensitive to dim light than cones.
- Cones, which are concentrated in the periphery, detect dim light.
- The fovea contains only rods, which see color.
- Looking to the side reduces sensory adaptation in the optic nerve.
= The fovea, at the center of the retina, contains mostly cones, which need bright light and detect color and detail. Rods outside the fovea respond to very dim light.

@ 1 | - | Hearing
After years of exposure to loud music, a guitarist has permanent hearing loss caused by damage to the hair cells of the cochlea. What type of hearing loss is this?
* Sensorineural hearing loss
- Conduction hearing loss
- Sensory adaptation
- Hearing loss caused by damage to the eardrum
= Sensorineural hearing loss results from damage to the cochlea's receptor cells or the auditory nerve and is usually permanent. Conduction hearing loss involves the eardrum or middle-ear bones, which carry vibrations to the cochlea.

@ 2 | - | Gestalt principles | gestalt
Most people describe the pattern of dots shown as four vertical stripes, or pairs of columns, rather than six rows. Which Gestalt principle explains this?
* Proximity
- Similarity
- Closure
- Continuity
= The principle of proximity states that elements close together are grouped. All of the dots look alike, so the grouping comes only from the narrow and wide gaps between columns.

@ 2 | - | Perceptual illusions | mullerLyer
The two lines in the figure are the same length, but most viewers judge line B to be longer. Studies have found that the illusion is weaker among people raised in environments with few rectangular buildings. What does this finding suggest?
* Experience with corners and depth cues shapes how people interpret the figure.
- The illusion is caused by a defect in the retina.
- People from such environments have better eyesight.
- Perception is determined entirely by the physical stimulus.
= One explanation is that the fins resemble the corners of rooms and buildings, which serve as depth cues. People with more experience of such "carpentered" environments may interpret the figure in depth, showing that perception depends partly on learning.

@ 2 | - | Top-down processing
A person easily reads the sentence "Tihs snetence is esay to raed" even though the words are misspelled. Which concept best explains this?
* Top-down processing, in which knowledge and expectations guide perception
- Bottom-up processing, which builds perception from individual features
- Sensory adaptation to the misspellings
- Inattentional blindness
= The reader's knowledge of words and context fills in what the jumbled letters only partly provide. Bottom-up processing would analyze each letter as it appears.

@ 2 | - | Perceptual set
Participants who are first shown several pictures of animals are more likely to see an ambiguous sketch as a rat, while those first shown faces see it as a man's face. What does this demonstrate?
* Perceptual set, a mental predisposition to perceive one thing rather than another
- Perceptual constancy, which keeps perception stable as conditions change
- Binocular disparity
- Change blindness
= Recent experiences create expectations that influence how ambiguous stimuli are interpreted. This is a form of top-down processing.

@ 2 | - | Depth perception
A person who has lost the sight of one eye can still judge that a car far down the road is distant because it appears small and is partly hidden by a tree. Which kind of cues is the person using?
* Monocular cues, such as relative size and interposition
- Binocular cues, such as retinal disparity
- Binocular cues, such as convergence
- Vestibular cues
= Monocular cues require only one eye. Retinal disparity and convergence, which compare information from the two eyes, are binocular cues that this person can no longer use.

@ 2 | - | Perceptual constancy
As a door swings open, the image it casts on the retina changes from a rectangle to a narrow trapezoid, yet the observer still perceives a rectangular door. Which concept does this illustrate?
* Shape constancy
- Size constancy
- Retinal disparity
- Figure–ground perception
= Perceptual constancy allows people to perceive objects as unchanging even as their retinal images change. Shape constancy keeps the door looking rectangular as its angle changes.

@ 2 | - | Attention
Participants counting basketball passes in a video often fail to notice a person in a gorilla suit walking through the scene. Which concept does this demonstrate?
* Inattentional blindness
- Change blindness
- Sensory adaptation
- Perceptual constancy
= When attention is focused on one task, people can fail to see an unexpected but clearly visible object. Change blindness, by contrast, is failing to notice that something has changed between views.

@ 2 | - | Attention
During a conversation, a stranger asking for directions is replaced by a different person while a door is carried between them. Many participants do not notice the switch. Which concept does this illustrate?
* Change blindness
- Inattentional blindness
- The cocktail party effect
- Perceptual set
= Change blindness is the failure to detect changes in a scene, especially across a brief interruption. People store far less visual detail than they believe they do.

@ 2 | - | Concepts and prototypes
When asked to think of a bird, most people imagine a robin rather than a penguin, and they decide more quickly that a robin is a bird. Which concept explains this?
* A prototype, the best example of a category
- An algorithm, a step-by-step procedure
- A mental set
- Functional fixedness
= People categorize by comparing new items with a prototype. The closer an item is to the prototype, the more quickly it is identified as a member of the category.

@ 2 | - | Problem solving
To find a misplaced key, a person searches every room in the house systematically, one drawer at a time. Which problem-solving strategy is this?
* An algorithm, which guarantees a solution but can be slow
- A heuristic, a mental shortcut
- Insight, a sudden realization
- Trial and error guided by intuition
= An algorithm is a methodical procedure that guarantees a solution if one exists. A heuristic, such as checking the places the key is usually left, is faster but can fail.

@ 2 | - | Heuristics
After watching news coverage of a plane crash, a traveler decides to drive across the country instead of flying, though driving is statistically far more dangerous. Which concept best explains the decision?
* The availability heuristic
- The representativeness heuristic
- Confirmation bias
- The framing effect
= The availability heuristic judges likelihood by how easily examples come to mind. Vivid, recent images of a crash make flying seem riskier than it is.

@ 2 | - | Heuristics
Told that a person is quiet, loves poetry, and wears glasses, most people guess the person is a literature professor rather than a truck driver, though truck drivers are far more numerous. Which concept is illustrated?
* The representativeness heuristic
- The availability heuristic
- Belief perseverance
- Functional fixedness
= The representativeness heuristic judges by how well something matches a prototype, while ignoring base rates. Because many more people drive trucks, the odds favor a truck driver despite the description.

@ 2 | - | Problem solving
Given a candle, a box of tacks, and matches, and asked to attach the candle to a wall, many people fail to think of emptying the box and tacking it up as a shelf. Which barrier to problem solving does this demonstrate?
* Functional fixedness
- Confirmation bias
- The availability heuristic
- Overconfidence
= Functional fixedness is the tendency to see objects only in their usual roles. Seeing the box only as a container blocks the solution.

@ 2 | - | Biases in thinking
A student who believes a lucky shirt improves test scores remembers every good score earned while wearing it but overlooks the bad ones. Which concept does this illustrate?
* Confirmation bias
- Hindsight bias
- The framing effect
- Mental set
= Confirmation bias is the tendency to seek and remember evidence that supports existing beliefs while ignoring contradictory evidence.

@ 2 | - | Framing
Patients are more likely to choose a surgery described as having a "90 percent survival rate" than one described as having a "10 percent mortality rate." Which concept does this demonstrate?
* The framing effect
- The representativeness heuristic
- Belief perseverance
- Gambler's fallacy
= The two descriptions present identical information. The framing effect shows that the way a choice is worded can change decisions.

@ 2 | - | Biases in thinking
After a roulette wheel lands on red seven times in a row, a gambler bets heavily on black, believing it is "due." Which error is this?
* The gambler's fallacy
- The sunk-cost fallacy
- Hindsight bias
- Functional fixedness
= Each spin is independent, so the chance of black is the same as on every other spin. The gambler's fallacy is the belief that past random events change future probabilities.

@ 2 | - | Intelligence testing
A test designed to predict how well students will learn in a future course, rather than to measure what they have already learned, is best described as which kind of test?
* An aptitude test
- An achievement test
- A projective test
- A personality inventory
= Aptitude tests predict future performance or ability to learn, while achievement tests measure what a person has already learned, such as a final exam.

@ 2 | - | Serial position effect | serial
Which explanation best accounts for the high recall of the first few words in the graph?
* The early words were rehearsed more and transferred into long-term memory.
- The early words were still in short-term memory at the time of recall.
- The early words were more meaningful than the others.
- The participants guessed the early words.
= This is the primacy effect. Early items receive more rehearsal before new words compete for attention. The recency effect, for the last words, reflects items still held in short-term memory.

@ 2 | - | Serial position effect | serial
The researchers repeat the study but have participants count backward for 30 seconds before recalling the list. How would the graph most likely change?
* Recall of the last few words would drop, while recall of the first few would stay high.
- Recall of the first few words would drop, while recall of the last few would stay high.
- Recall of every word would increase.
- The curve would stay the same.
= Counting backward displaces items held in short-term memory, which eliminates the recency effect. Words already transferred to long-term memory, producing the primacy effect, are unaffected.

@ 2 | - | Working memory
A person can remember the letters "FBICIANASA" by grouping them as FBI, CIA, and NASA. Which strategy is this?
* Chunking, which increases the amount of information held in short-term memory
- Maintenance rehearsal, which transfers information into sensory memory
- The method of loci
- Retroactive interference
= Short-term memory holds roughly seven items. Chunking groups items into meaningful units, so ten letters become three chunks.

@ 2 | - | Working memory
Participants find it much harder to remember a list of words while repeating "the, the, the" aloud than while tapping a pattern with their fingers. Which part of working memory does repeating a word most interfere with?
* The phonological loop
- The visuospatial sketchpad
- Sensory memory
- Long-term implicit memory
= Baddeley's model includes a phonological loop for verbal and sound-based information and a visuospatial sketchpad for images. Repeating a word occupies the phonological loop, which is also needed to rehearse the list.

@ 2 | - | Levels of processing | levels
Which conclusion about encoding is best supported by the graph?
* Processing words for meaning produces better recall than processing them for their appearance or sound.
- Rhyming is the most effective way to remember words.
- The font of a word has no effect on whether it is recalled.
- Participants recalled the same number of words in each condition.
= Recall rose from 18 to 68 percent as processing became deeper. The levels-of-processing model proposes that deeper, semantic encoding produces more durable memories.

@ 2 | - | Research design | levels
In the study shown, what is the independent variable?
* The kind of question participants answered about each word
- The percentage of words recalled
- The number of words in the list
- The participants' ages
= The researchers manipulated the kind of question, which determined the depth of processing. The percentage recalled is the dependent variable, the outcome measured.

@ 2 | - | Encoding
Two students study for the same number of total hours. One studies in six short sessions over two weeks, and the other in one long session the night before. Which result is most likely?
* The first student remembers more, because of the spacing effect.
- The second student remembers more, because of the recency effect.
- Both remember the same amount, because study time is equal.
- The second student remembers more, because massed practice reduces interference.
= Distributed practice produces better long-term retention than massed practice, or cramming. Spaced sessions give repeated opportunities to retrieve and consolidate the material.

@ 2 | - | Mnemonics
To memorize a speech, a student imagines placing each main point in a different room of their house and then mentally walks through the house. Which strategy is this?
* The method of loci
- Chunking
- Shallow processing
- Maintenance rehearsal
= The method of loci links each item to a familiar location, using vivid imagery and a fixed order to aid retrieval.

@ 2 | - | Types of memory
A patient with amnesia cannot remember practicing a new skill, such as tracing a star while looking in a mirror, yet improves at the task each day. What does this show?
* Implicit procedural memory can form even when explicit memory is impaired.
- The patient's amnesia is faked.
- Explicit memory is needed to learn any skill.
- Semantic memory is stored in the hippocampus.
= Procedural memories, such as skills, are implicit and depend on structures such as the cerebellum and basal ganglia, not the hippocampus. Patients like H.M. showed this dissociation.

@ 2 | - | Types of memory
A student remembers that the capital of France is Paris and also remembers a family trip to Paris last summer. How are these memories classified?
* The first is semantic memory, and the second is episodic memory.
- The first is episodic memory, and the second is semantic memory.
- Both are procedural memories.
- Both are implicit memories.
= Both are explicit memories. Semantic memory holds general facts and knowledge, while episodic memory holds personally experienced events tied to a time and place.

@ 2 | - | Retrieval | context
Which conclusion about the divers' recall is best supported by the graph?
* Recall was better when the testing environment matched the learning environment.
- Learning on land always produces better recall.
- Learning underwater impairs memory.
- The testing location had no effect on recall.
= Divers recalled 14 and 12 words when the places matched, and only 9 when they did not. Context-dependent memory occurs because cues present during encoding help retrieval.

@ 2 | - | Data interpretation | context
Which statement correctly describes the pattern in the graph?
* The effect of the testing location depended on where the words were learned.
- Divers who learned on land recalled fewer words in both locations.
- Testing underwater lowered recall for both groups.
- The groups' recall differed by the same amount in both locations.
= The bars cross over: land testing helped the land group, while underwater testing helped the underwater group. When the effect of one variable depends on another, the variables interact.

@ 2 | - | Retrieval
A person who is sad finds it easier to recall other sad times in their life. Which concept does this illustrate?
* Mood-congruent memory
- Context-dependent memory
- Proactive interference
- The serial position effect
= Mood-congruent memory is the tendency to recall experiences consistent with one's current mood. A sad mood primes sad associations, which can reinforce depression.

@ 2 | - | Retrieval
Students often find multiple-choice questions easier than fill-in-the-blank questions on the same material. Which statement best explains this?
* Recognition requires identifying information that is presented, which is easier than recall.
- Recall depends on implicit memory.
- Recognition requires more retrieval cues to be generated by the learner.
- Fill-in-the-blank questions measure relearning.
= Recall requires retrieving information with few cues, while recognition provides the information to be identified. People can often recognize far more than they can recall.

@ 2 | - | Forgetting | forgetting
Which statement best describes the pattern of forgetting in the graph?
* Most forgetting occurs soon after learning, and the rate of forgetting then slows.
- Forgetting occurs at a steady rate over the six days.
- Little is forgotten during the first day.
- All of the material is forgotten within six days.
= Ebbinghaus found that retention drops steeply within hours and then levels off. The material still retained after several days is relatively stable.

@ 2 | - | Forgetting | forgetting
Ebbinghaus found that even when he could not recall a list, he relearned it faster than he had learned it the first time. What does this show?
* Some memory remained, as measured by relearning, even when recall failed.
- Relearning is a measure of short-term memory.
- The list had been completely forgotten.
- Recall is a more sensitive measure of memory than relearning.
= The time saved in relearning reveals retained memory that recall tests miss. Relearning is the most sensitive of the three measures: recall, recognition, and relearning.

@ 2 | - | Interference
After moving, a person keeps typing the old address when filling out forms. What explains the difficulty in remembering the new address?
* Proactive interference
- Retroactive interference
- The misinformation effect
- Source amnesia
= In proactive interference, older information disrupts the recall of newer information. In retroactive interference, new learning disrupts the recall of older information.

@ 2 | - | Memory distortion
Participants who watched a video of a car crash estimated higher speeds and were more likely to "remember" broken glass when asked how fast the cars were going when they "smashed" rather than "hit." Which concept does this demonstrate?
* The misinformation effect
- Proactive interference
- Mood-congruent memory
- The serial position effect
= Loftus and Palmer showed that misleading wording after an event can alter memories of it. Memory is reconstructive rather than an exact record.

@ 2 | - | Intelligence and statistics | iq
On an IQ test with the distribution shown, about what percentage of people score in the shaded region, between 85 and 115?
* About 68 percent
- About 34 percent
- About 95 percent
- About 50 percent
= In a normal distribution, about 68 percent of scores fall within one standard deviation of the mean, about 95 percent within two, and about 99.7 percent within three.

@ 2 | - | Intelligence and statistics | iq
About what percentage of test takers score above 130 on the test whose distribution is shown?
* About 2 percent
- About 16 percent
- About 30 percent
- About 0.1 percent
= A score of 130 is two standard deviations above the mean. About 95 percent of scores lie within two standard deviations, so about 2.5 percent lie above 130; a score of 130 is near the 98th percentile.

@ 2 | - | Reliability | reliability
Which property of the new test does the scatterplot best demonstrate?
* High test–retest reliability
- High predictive validity
- Standardization
- High content validity
= Reliability is the consistency of a measure. The points cluster tightly around a line, showing a strong positive correlation between scores on two occasions. The graph says nothing about whether the test measures what it claims to.

@ 2 | - | Validity
A new test gives each person nearly the same score every time it is taken, but scores do not correlate with students' grades or any other measure of the ability it claims to assess. How is the test best described?
* Reliable but not valid
- Valid but not reliable
- Both reliable and valid
- Standardized, and therefore valid
= Consistent scores show reliability. Validity is whether a test measures or predicts what it is supposed to. A test can be reliable without being valid, but a test with poor reliability cannot be valid.

@ 2 | - | Stereotype threat
Women who are told before a difficult math test that men usually outperform women score lower than women who are told the test shows no gender differences. Which concept does this demonstrate?
* Stereotype threat
- The Flynn effect
- Predictive validity
- A growth mindset
= Stereotype threat is a concern that one will confirm a negative stereotype about one's group. The anxiety and distraction it causes can reduce performance, which may contribute to group differences in test scores.

@ 3 | - | Research methods in development
To study how memory changes with age, a researcher tests 20-, 40-, 60-, and 80-year-olds at the same time. Which limitation is most important for this design?
* Differences may reflect the different experiences of each generation rather than aging itself.
- The study will take many decades to complete.
- Participants are likely to drop out over time.
- The same participants will become familiar with the test.
= This is a cross-sectional study. Its groups differ in birth cohort as well as age, so cohort effects, such as differences in education, can be mistaken for effects of aging. Longitudinal studies, which follow the same people, avoid this problem but take years.

@ 3 | - | Prenatal development
A child born to a mother who drank heavily during pregnancy has a small head, distinctive facial features, and intellectual disability. What best describes the cause?
* Alcohol acted as a teratogen, harming prenatal development.
- The child inherited a dominant gene for the condition.
- The child experienced too little stimulation after birth.
- The child's brain was overly pruned during adolescence.
= Teratogens are agents, such as alcohol, some drugs, and viruses, that harm the developing embryo or fetus. These symptoms describe fetal alcohol syndrome.

@ 3 | - | Critical periods
Ducklings follow the first moving object they see within a day or two of hatching, even a person, and they do not form this attachment if the window passes. Which concept does this illustrate?
* A critical period for imprinting
- Object permanence
- Habituation
- Assimilation
= A critical period is a limited window in which certain experiences must occur for normal development. Lorenz showed that geese and ducks imprint on a moving object during a brief window after hatching.

@ 3 | - | Newborn reflexes
When a newborn's cheek is stroked, the baby turns toward the touch and opens its mouth. What is this response called?
* The rooting reflex
- The grasping reflex
- The Moro reflex
- Object permanence
= The rooting reflex helps a newborn find a nipple to feed. Like other newborn reflexes, it is an inborn, automatic response that fades in the first months.

@ 3 | - | Infant perception | habituation
Infants were shown the same face on trials 1 through 6 and a new face on trials 7 and 8. What does the increase in looking time on trial 7 indicate?
* The infants could tell the new face from the old one.
- The infants could not distinguish the faces.
- The infants were tired by trial 7.
- The infants preferred familiar faces.
= Looking time falls as the infants habituate to the repeated face. Renewed interest when the new face appears, called dishabituation, shows that they perceived it as different.

@ 3 | - | Research methods | habituation
In the study shown, what is the dependent variable?
* The time the infants spent looking at the display
- Whether the face shown was new or familiar
- The number of trials
- The infants' ages
= The dependent variable is what the researchers measure: looking time. Whether the face was familiar or new is the variable the researchers manipulated.

@ 3 | - | Adolescent brain development
Which statement best explains why adolescents are, on average, more likely than adults to take risks, especially with peers present?
* The prefrontal cortex, which supports judgment and impulse control, matures later than reward-related areas of the brain.
- The adolescent brain has stopped forming new synapses.
- The cerebellum shrinks during adolescence.
- Adolescents have fewer dopamine receptors than adults.
= The limbic reward system matures earlier than the prefrontal cortex, which continues to develop into the mid-20s. This imbalance can make rewards, including peer approval, especially compelling.

@ 3 | - | Physical development
Which of the following is a primary sex characteristic that develops during puberty?
* Maturation of the reproductive organs
- Growth of facial hair
- Deepening of the voice
- Widening of the hips
= Primary sex characteristics are the reproductive organs and external genitalia. Secondary sex characteristics, such as facial hair, voice changes, and body shape, are other traits that develop during puberty.

@ 3 | - | Cognitive aging
Which change in cognitive abilities is most typical from middle adulthood to late adulthood?
* Crystallized intelligence remains stable or grows, while fluid intelligence declines.
- Fluid intelligence grows, while crystallized intelligence declines.
- Both decline sharply after age 40.
- Neither changes until age 80.
= Accumulated knowledge and vocabulary, crystallized intelligence, tend to hold steady or increase. Speed of processing and solving novel problems, fluid intelligence, gradually decline.

@ 3 | - | Gender development
A young child insists that only girls can be nurses and organizes toys into "boy toys" and "girl toys." Which concept best explains this behavior?
* Gender schemas, mental frameworks for organizing information about gender
- Gender identity, the sense of being male, female, or another gender
- Sexual orientation
- Object permanence
= Gender schema theory proposes that children learn their culture's concepts of gender and use them to organize perceptions and behavior. Gender identity, by contrast, is a person's own internal sense of their gender.

@ 3 | - | Piaget's stages
A 6-month-old stops looking for a toy as soon as it is covered by a blanket, while a 10-month-old lifts the blanket to find it. What has the older infant developed?
* Object permanence, in the sensorimotor stage
- Conservation, in the preoperational stage
- Abstract reasoning, in the formal operational stage
- Theory of mind, in the concrete operational stage
= Object permanence is the understanding that objects continue to exist when out of sight. Piaget believed it develops by about 8 months, though later research suggests it begins earlier.

@ 3 | - | Piaget's stages | conservation
A 4-year-old watches juice poured from glass A into glass B and then says glass B has more juice. Which statement best explains the child's answer?
* The child is in the preoperational stage and has not yet mastered conservation.
- The child is in the sensorimotor stage and lacks object permanence.
- The child is in the formal operational stage and is reasoning hypothetically.
- The child is showing egocentrism by refusing to agree.
= Preoperational children focus on one dimension, here the height of the juice, and do not yet understand that quantity stays the same when its shape changes.

@ 3 | - | Piaget's stages | conservation
An 8-year-old watches the same demonstration and says the glasses hold the same amount. Which explanation would the child most likely give?
* "If you poured it back, it would look the same as before."
- "Glass B is taller, so it has more."
- "Glass A is wider, so it has more."
- "I don't know, because I can't see the juice anymore."
= Concrete operational children understand reversibility: an action can be mentally undone. They also consider height and width together rather than one dimension at a time.

@ 3 | - | Piaget's stages
A teenager argues about what society might be like if money had never been invented, reasoning systematically about possibilities that do not exist. Which stage does this reflect?
* Formal operational
- Concrete operational
- Preoperational
- Sensorimotor
= Formal operational thinking, beginning around adolescence, allows abstract and hypothetical reasoning. Concrete operational thinkers reason logically mainly about concrete events.

@ 3 | - | Schemas
A toddler who knows the word "dog" calls a cat "doggy." Later, after being corrected, the child forms a new category for cats. Which processes are shown, in order?
* Assimilation, then accommodation
- Accommodation, then assimilation
- Conservation, then egocentrism
- Habituation, then dishabituation
= In assimilation, new experiences are fit into an existing schema. In accommodation, the schema is changed or a new one is created to fit the new information.

@ 3 | - | Sociocultural development
A parent helps a child complete a puzzle the child cannot do alone by giving hints and gradually withdrawing help as the child improves. Which concept does this describe?
* Scaffolding within the zone of proximal development
- Assimilation within a schema
- Conservation within the concrete operational stage
- Imprinting within a critical period
= Vygotsky described the zone of proximal development as the range of tasks a child can do with help but not alone. Scaffolding is temporary support that is reduced as competence grows.

@ 3 | - | Theory of mind
A 3-year-old watches a puppet hide a marble in a basket and leave. Another puppet moves the marble to a box. Asked where the first puppet will look, the child points to the box. What does this suggest?
* The child has not yet developed a theory of mind.
- The child lacks object permanence.
- The child has mastered conservation.
- The child is in the formal operational stage.
= Understanding that others can hold false beliefs is part of theory of mind, which usually develops around age 4 or 5. The child assumes the puppet knows what the child knows.

@ 3 | - | Language development
A 3-year-old says, "I goed to the store and saw two mouses." What do these errors show?
* The child is applying grammatical rules to words that are exceptions, called overgeneralization.
- The child is in the babbling stage.
- The child has not learned any grammar.
- The child is imitating adult speech exactly.
= Adults do not say "goed," so the errors show that children actively learn rules, here for past tenses and plurals, rather than only imitating. They later learn the irregular exceptions.

@ 3 | - | Language development
A 2-year-old says, "Want juice" and "Daddy go." Which stage of language development does this represent?
* Telegraphic speech
- Babbling
- The one-word stage
- Overgeneralization of grammar
= In telegraphic speech, children combine mainly nouns and verbs in short, sensible phrases while omitting small function words, like a telegram.

@ 3 | - | Language structure
How many morphemes are in the word "unhappiness"?
* Three
- One
- Two
- Nine
= A morpheme is the smallest unit of language that carries meaning. "Unhappiness" contains "un-" (not), "happy," and "-ness" (a state of). Phonemes, by contrast, are the smallest units of sound.

@ 3 | - | Attachment | strange
Which infant in the table shows the pattern of secure attachment?
* Infant 1
- Infant 2
- Infant 3
- Infant 4
= Securely attached infants use the caregiver as a safe base, are mildly distressed by separation, and are quickly comforted on reunion. In Ainsworth's research, this is the most common pattern.

@ 3 | - | Attachment | strange
Infant 2 in the table shows little distress during separation and avoids the caregiver on return. How is this infant's attachment best classified?
* Insecure-avoidant
- Secure
- Insecure-resistant, or anxious-ambivalent
- Disorganized
= Avoidant infants appear indifferent to the caregiver's departure and return. Ainsworth linked this pattern to caregivers who are consistently unresponsive to the infant's needs.

@ 3 | - | Attachment | strange
How is the attachment of infant 3 in the table best classified?
* Insecure-resistant, or anxious-ambivalent
- Secure
- Insecure-avoidant
- Disorganized
= Infant 3 is intensely upset by separation and both seeks and resists contact on reunion. This pattern has been linked to caregivers who respond inconsistently. Infant 4's confused, contradictory behavior is the disorganized pattern.

@ 3 | - | Attachment
In Harlow's studies, infant monkeys spent most of their time clinging to a soft cloth "mother" rather than a wire "mother" that provided milk. What did this show?
* Contact comfort is more important than feeding in forming attachment.
- Attachment depends mainly on which caregiver provides food.
- Monkeys do not form attachments to caregivers.
- Attachment forms only during a critical period of a few hours.
= The finding contradicted the view that infants become attached to the person who feeds them. Comforting physical contact proved central to attachment.

@ 3 | - | Parenting styles
A parent sets clear rules and high expectations but explains the reasons for them and listens to the child's views. Which parenting style is this, and what outcomes is it most associated with?
* Authoritative; higher self-esteem and social competence
- Authoritarian; independence and creativity
- Permissive; strong self-control
- Uninvolved; secure attachment
= Baumrind's research links the authoritative style, which combines warmth with firm limits, to positive outcomes. These are correlational findings, so other factors may also contribute.

@ 3 | - | Psychosocial development
A 75-year-old looks back on life with satisfaction, feeling it was meaningful despite some regrets. According to Erikson, which stage has this person resolved successfully?
* Integrity versus despair
- Generativity versus stagnation
- Intimacy versus isolation
- Identity versus role confusion
= Erikson's final stage, in late adulthood, involves reflecting on one's life. Success brings a sense of integrity, while failure brings despair and regret.

@ 3 | - | Classical conditioning
A child receives a painful shot from a nurse in a white coat. Afterward, the child cries whenever anyone in a white coat approaches. In this example, what is the white coat?
* The conditioned stimulus
- The unconditioned stimulus
- The unconditioned response
- The conditioned response
= The shot is the unconditioned stimulus, which naturally causes fear and crying. The white coat, once neutral, was paired with the shot and now triggers the conditioned response.

@ 3 | - | Classical conditioning | conditioning
Which phases of classical conditioning are labeled A, B, and C in the graph?
* Acquisition, extinction, and spontaneous recovery
- Extinction, acquisition, and generalization
- Acquisition, generalization, and discrimination
- Spontaneous recovery, extinction, and acquisition
= In A, pairing the conditioned and unconditioned stimuli builds the response. In B, the conditioned stimulus is presented alone and the response fades. In C, the response reappears after a rest.

@ 3 | - | Classical conditioning | conditioning
What does the segment labeled C suggest about extinction?
* Extinction suppresses the conditioned response but does not completely erase the learning.
- Extinction permanently erases the conditioned response.
- The unconditioned stimulus was presented again during the rest.
- The animal learned a completely new response during the rest.
= Spontaneous recovery is the reappearance of an extinguished response after a pause. Because the response returns without new pairings, the original learning must have persisted.

@ 3 | - | Generalization | gradient
An animal was conditioned to respond to a 1000 Hz tone and then tested with other tones. Which concept does the pattern in the graph illustrate?
* Stimulus generalization
- Spontaneous recovery
- Extinction
- Higher-order conditioning
= The animal responds to tones similar to the conditioned stimulus, and responding decreases as the tones become less similar. This pattern is called a generalization gradient.

@ 3 | - | Discrimination | gradient
The researcher next presents the 1000 Hz tone with food and the 800 Hz and 1200 Hz tones without food. If the graph is redrawn after this training, how would it most likely change?
* The bars for 800 Hz and 1200 Hz would shrink, while the bar for 1000 Hz would stay high.
- All of the bars would become equal.
- The bar for 1000 Hz would shrink.
- The bars for 600 Hz and 1400 Hz would grow.
= This is discrimination training. When only the 1000 Hz tone predicts food, the animal learns to distinguish it from similar tones, so its gradient becomes narrower.

@ 3 | - | Biological constraints on learning
After eating a new food and becoming sick hours later from an unrelated virus, a person develops a lasting dislike of that food after just one experience. Why is this finding significant?
* It shows that biological preparedness allows some associations to form after one pairing despite a long delay.
- It shows that classical conditioning requires many pairings.
- It shows that the conditioned and unconditioned stimuli must occur within seconds.
- It shows that taste aversions are learned through operant conditioning.
= Garcia's research on taste aversion challenged the view that any stimulus could be paired equally well with any response. Animals are biologically prepared to link tastes with illness.

@ 3 | - | Operant conditioning
A car makes an annoying beeping sound until the driver fastens the seat belt. Fastening the seat belt becomes more likely in the future. Which process is this?
* Negative reinforcement
- Positive reinforcement
- Positive punishment
- Negative punishment
= The behavior removes an unpleasant stimulus, so it is reinforced. "Negative" means something is taken away, and reinforcement always increases a behavior.

@ 3 | - | Operant conditioning
A teenager who breaks curfew has their phone taken away for a week, and breaking curfew becomes less frequent. Which process is this?
* Negative punishment
- Negative reinforcement
- Positive punishment
- Extinction
= Removing a desired stimulus to decrease a behavior is negative punishment. Positive punishment adds an unpleasant stimulus, such as extra chores.

@ 3 | - | Reinforcement schedules | schedules
Which line in the graph most likely represents a variable-ratio schedule, like the payoff of a slot machine?
* W
- X
- Y
- Z
= Variable-ratio schedules reinforce after an unpredictable number of responses, producing high, steady response rates with no pauses. Line X shows the brief pauses after reinforcement typical of a fixed-ratio schedule.

@ 3 | - | Reinforcement schedules | schedules
Line Y shows a scalloped pattern, with little responding just after reinforcement and rapid responding as the next one approaches. Which schedule produces this pattern?
* Fixed-interval
- Variable-interval
- Fixed-ratio
- Variable-ratio
= On a fixed-interval schedule, the first response after a set time is reinforced. Subjects learn that early responses do not pay off, so responding accelerates as the time nears, as when students study more just before scheduled exams.

@ 3 | - | Shaping
To teach a dog to ring a bell, a trainer first rewards the dog for approaching the bell, then for touching it, and finally only for ringing it. What technique is this?
* Shaping through successive approximations
- Stimulus generalization
- Higher-order conditioning
- Latent learning
= Shaping reinforces behaviors that come closer and closer to the desired behavior. It allows behaviors that would rarely occur on their own to be trained.

@ 3 | - | Observational learning | bobo
Which conclusion about observational learning is best supported by the graph?
* Children learned the aggressive acts by observation even when they did not perform them, because they imitated them once offered a reward.
- Children who saw the model punished never learned the aggressive acts.
- Rewards made the children more aggressive than the model.
- Observing a model has no effect on children's behavior.
= Children who saw the model punished imitated few acts, but when offered a reward they reproduced nearly as many as the others. Bandura concluded that learning had occurred; vicarious punishment suppressed only the performance.

@ 3 | - | Cognitive factors in learning
Rats that explored a maze for ten days without reward suddenly ran it as fast as consistently rewarded rats once food was placed at the end. What does this demonstrate?
* Latent learning, which is shown only when there is an incentive
- Shaping through successive approximations
- Instinctive drift
- Spontaneous recovery
= Tolman concluded that the unrewarded rats had formed a cognitive map of the maze. Their learning stayed hidden until a reason to use it appeared.

@ 3 | - | Learned helplessness
Dogs that received shocks they could not escape later failed to escape shocks even when they could simply jump over a low barrier. Which concept does this demonstrate?
* Learned helplessness
- Negative reinforcement
- Insight learning
- Stimulus discrimination
= Seligman found that experiencing uncontrollable bad events can lead an animal or a person to stop trying even when control becomes possible. Learned helplessness has been proposed as a model of some forms of depression.
`;

module.exports = { source, figures };
