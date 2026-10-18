// Builds the FRQ banks for AP Physics 1, AP Physics C: Mechanics, and AP Biology from the
// sources in this folder. Usage: node scripts/ap-frq-build/build.cjs
// Writes korah-bot/ap/data/<course>/frqs.json plus the canned demo transcript and grading.
const fs = require('fs');
const path = require('path');
const { tableText } = require('./frq-helpers.cjs');

const DATA = path.join(__dirname, '../../korah-bot/ap/data');
const SOURCES = ['./physics1.cjs', './physicsc.cjs', './biology.cjs'];

// Figures render on the page only, so the grader reads them through this text stimulus.
const describe = f => (f.table ? tableText(f.caption, f.table.headers, f.table.rows) : `${f.caption}: ${f.alt}`);
function stimulusText(q) {
  const lines = (q.figures || []).map(describe);
  for (const p of q.parts) for (const f of p.figures || []) lines.push(`Part ${p.label}, ${describe(f)}`);
  return lines.join('\n\n');
}

function record(course, q) {
  const content = stimulusText(q);
  return {
    id: q.id, course, year: q.modeledOn.year, questionNumber: q.questionNumber, title: q.title, topic: q.topic,
    timeAllottedMin: q.timeAllottedMin, calculatorAllowed: true, sample: false, modeledOn: q.modeledOn,
    stimulus: { type: 'text', display: false, content }, prompt: q.prompt,
    ...(q.figures ? { figures: q.figures } : {}), parts: q.parts, sampleResponse: q.sampleResponse,
  };
}

function cannedGrading(frq, c) {
  const verdicts = frq.parts.flatMap(p => p.rubricPoints).map(p => (c.missed[p.id]
    ? { rubricPointId: p.id, earned: false, evidence: null, feedback: c.missed[p.id] }
    : { rubricPointId: p.id, earned: true, evidence: c.evidence[p.id] || null, feedback: null }));
  const score = verdicts.filter(v => v.earned).length;
  return { frqId: frq.id, canned: true, verdicts, score, totalPoints: verdicts.length, priorityFix: c.priorityFix, sampleResponseComparison: c.sampleResponseComparison };
}

const write = (file, data) => fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');

for (const src of SOURCES) {
  const { course, frqs, canned } = require(src);
  const ids = new Set();
  for (const q of frqs) { if (ids.has(q.id)) throw new Error('duplicate id ' + q.id); ids.add(q.id); }
  const out = frqs.map(q => record(course, q));
  const first = out.find(q => q.id === canned.frqId);
  if (!first) throw new Error(course + ': canned frqId not found');
  const dir = path.join(DATA, course);
  write(path.join(dir, 'frqs.json'), out);
  write(path.join(dir, 'canned-transcript.json'), { frqId: canned.frqId, transcript: canned.transcript });
  write(path.join(dir, 'canned-grading.json'), cannedGrading(first, canned));
  console.log(`${course}: ${out.length} FRQs`);
}
