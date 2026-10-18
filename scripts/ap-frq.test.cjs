// Checks the FRQ banks: schema, point structure per released question type, rubric
// categories, figures, math delimiters, provenance links, and that the build script
// reproduces the committed data. Run: node --test scripts/ap-frq.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const DATA = path.join(__dirname, '../korah-bot/ap/data');
const read = (slug, file = 'frqs.json') => JSON.parse(fs.readFileSync(path.join(DATA, slug, file), 'utf8'));
const ALL = ['ap-calculus-ab', 'ap-us-history', 'ap-physics-1', 'ap-physics-2', 'ap-physics-c-mechanics', 'ap-biology', 'ap-precalculus', 'ap-chemistry'];
const BUILT = ALL.slice(2);
const points = frq => frq.parts.reduce((n, p) => n + p.rubricPoints.length, 0);
const CATEGORIES = {
  physics: ['representation', 'derivation', 'calculation', 'justification', 'experimental-design', 'data-analysis'],
  biology: ['concept', 'experimental-design', 'data-analysis', 'graphing', 'calculation', 'argumentation'],
  precalc: ['setup', 'computation', 'notation', 'reasoning', 'transformations', 'manipulation'],
  chemistry: ['calculation', 'explanation', 'representation', 'equations', 'justification'],
};
const categoryKey = slug => ({ 'ap-biology': 'biology', 'ap-precalculus': 'precalc', 'ap-chemistry': 'chemistry' })[slug] || 'physics';

test('every FRQ has the fields the pages and grader read, with unique ids', () => {
  const ids = new Set();
  for (const slug of ALL) for (const frq of read(slug)) {
    for (const k of ['id', 'course', 'year', 'questionNumber', 'title', 'topic', 'timeAllottedMin', 'prompt', 'parts', 'sampleResponse']) assert.ok(frq[k] != null && frq[k] !== '', `${frq.id}: missing ${k}`);
    assert.equal(frq.course, slug);
    assert.ok(!ids.has(frq.id), 'duplicate id ' + frq.id); ids.add(frq.id);
    for (const part of frq.parts) for (const p of part.rubricPoints) {
      assert.ok(!ids.has(p.id), 'duplicate rubric id ' + p.id); ids.add(p.id);
      for (const k of ['criterion', 'category', 'exampleEarning', 'exampleFailing']) assert.ok(p[k], `${p.id}: missing ${k}`);
      assert.ok(Array.isArray(p.commonErrors) && p.commonErrors.length, `${p.id}: no common errors`);
    }
  }
});

test('point totals and timing match the released question types', () => {
  for (const slug of ['ap-physics-1', 'ap-physics-2', 'ap-physics-c-mechanics']) {
    const frqs = read(slug);
    assert.equal(frqs.length, 8);
    for (const year of [2025, 2026]) {
      const set = frqs.filter(f => f.year === year).sort((a, b) => a.questionNumber - b.questionNumber);
      assert.deepEqual(set.map(points), [10, 12, 10, 8], `${slug} ${year} point totals`);
      assert.deepEqual(set.map(f => f.timeAllottedMin), [25, 30, 25, 20]);
    }
  }
  const bio = read('ap-biology');
  assert.equal(bio.length, 12);
  for (const year of [2025, 2026]) {
    const set = bio.filter(f => f.year === year).sort((a, b) => a.questionNumber - b.questionNumber);
    assert.deepEqual(set.map(points), [9, 9, 4, 4, 4, 4], `biology ${year} point totals`);
    assert.deepEqual(set.map(f => f.timeAllottedMin), [25, 25, 10, 10, 10, 10]);
  }
  const precalc = read('ap-precalculus');
  assert.equal(precalc.length, 8);
  for (const year of [2025, 2026]) {
    const set = precalc.filter(f => f.year === year).sort((a, b) => a.questionNumber - b.questionNumber);
    assert.deepEqual(set.map(points), [6, 6, 6, 6], `precalculus ${year} point totals`);
    assert.deepEqual(set.map(f => f.calculatorAllowed), [true, true, false, false], 'part A uses a calculator, part B does not');
    assert.deepEqual(set.map(f => f.timeAllottedMin), [15, 15, 15, 15]);
  }
  const chemistry = read('ap-chemistry');
  assert.equal(chemistry.length, 14);
  for (const year of [2025, 2026]) {
    const set = chemistry.filter(f => f.year === year).sort((a, b) => a.questionNumber - b.questionNumber);
    assert.deepEqual(set.map(points), [10, 10, 10, 4, 4, 4, 4], `chemistry ${year} point totals`);
    assert.deepEqual(set.map(f => f.timeAllottedMin), [23, 23, 23, 9, 9, 9, 9]);
  }
});

test('rubric categories belong to the course', () => {
  for (const slug of BUILT) {
    const allowed = CATEGORIES[categoryKey(slug)];
    for (const frq of read(slug)) for (const part of frq.parts) for (const p of part.rubricPoints) assert.ok(allowed.includes(p.category), `${p.id}: ${p.category}`);
  }
});

test('figures have alt text, safe SVG, and a grader-facing description', () => {
  for (const slug of BUILT) for (const frq of read(slug)) {
    const figs = [...(frq.figures || []), ...frq.parts.flatMap(p => p.figures || [])];
    for (const f of figs) {
      assert.ok(f.caption && f.alt && f.alt.length > 20, `${frq.id}: figure needs a caption and alt text`);
      assert.ok(f.svg || f.table, `${frq.id}: figure has no content`);
      if (f.svg) assert.doesNotMatch(f.svg, /<script|on\w+=|javascript:/i, `${frq.id}: unsafe svg`);
      assert.ok(frq.stimulus.content.includes(f.caption), `${frq.id}: ${f.caption} is not described for the grader`);
    }
    assert.equal(frq.stimulus.display, false);
  }
});

test('math delimiters balance in every displayed and graded string', () => {
  for (const slug of ALL) for (const frq of read(slug)) {
    const strings = [frq.prompt, frq.sampleResponse, ...frq.parts.flatMap(p => [p.text, ...p.rubricPoints.flatMap(r => [r.criterion, r.exampleEarning, r.exampleFailing])])];
    for (const s of strings) assert.equal(s.split('\\(').length, s.split('\\)').length, `${frq.id}: unbalanced \\( \\) in ${s.slice(0, 60)}`);
  }
});

test('practice FRQs link the released question they are modeled on', () => {
  for (const slug of BUILT) for (const frq of read(slug)) {
    const m = frq.modeledOn;
    assert.ok(m && m.label && m.year === frq.year && m.question === frq.questionNumber, `${frq.id}: modeledOn`);
    const url = new URL(m.url);
    assert.equal(url.protocol, 'https:');
    assert.equal(url.hostname, 'apcentral.collegeboard.org');
    assert.match(url.pathname, new RegExp(`/ap${String(frq.year).slice(2)}-frq-`));
  }
});

test('canned demo grading covers the canned FRQ’s rubric', () => {
  for (const slug of BUILT) {
    const grading = read(slug, 'canned-grading.json'), transcript = read(slug, 'canned-transcript.json');
    const frq = read(slug).find(f => f.id === grading.frqId);
    assert.ok(frq && transcript.frqId === frq.id && transcript.transcript.length > 100);
    assert.deepEqual(grading.verdicts.map(v => v.rubricPointId), frq.parts.flatMap(p => p.rubricPoints.map(r => r.id)));
    assert.equal(grading.score, grading.verdicts.filter(v => v.earned).length);
    for (const v of grading.verdicts) assert.ok(v.earned ? v.evidence : v.feedback, `${v.rubricPointId}: verdict needs evidence or feedback`);
  }
});

test('the build script reproduces the committed data', () => {
  const files = BUILT.flatMap(slug => ['frqs.json', 'canned-transcript.json', 'canned-grading.json'].map(f => path.join(DATA, slug, f)));
  const before = files.map(f => fs.readFileSync(f, 'utf8'));
  execFileSync(process.execPath, [path.join(__dirname, 'ap-frq-build/build.cjs')]);
  files.forEach((f, i) => assert.equal(fs.readFileSync(f, 'utf8'), before[i], path.relative(DATA, f) + ' is stale; run the build'));
});
