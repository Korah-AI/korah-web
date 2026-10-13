const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = ['ap-calculus-ab', 'ap-us-history'].map(slug => JSON.parse(fs.readFileSync(path.join(__dirname, '../korah-bot/ap/data', slug, 'mcqs.json'), 'utf8')));
const physics = JSON.parse(fs.readFileSync(path.join(__dirname, '../korah-bot/ap/data/ap-physics-1/mcqs.json'), 'utf8'));
const api = import('../korah-bot/ap/js/mcq-bank.js');

test('each separate bank has 200 unique, complete questions divided evenly among its units', async () => {
  const { validateBank, COURSES } = await api;
  const allIds = new Set();
  for (const bank of banks) {
    validateBank(bank, bank.course);
    assert.equal(bank.questions.length, 200);
    assert.equal(new Set(bank.questions.map(q => q.stem)).size, bank.questions.length);
    const course = COURSES.find(c => c.slug === bank.course);
    const perUnit = course.units.map((_, i) => bank.questions.filter(q => q.unit === i + 1).length);
    assert.ok(Math.max(...perUnit) - Math.min(...perUnit) <= 1, 'questions are divided evenly among units: ' + perUnit);
    for (const q of bank.questions) {
      assert.ok(!allIds.has(q.id)); allIds.add(q.id);
      assert.ok(q.explanation.length > 40);
      if (bank.course === 'ap-us-history') { assert.ok(q.stimulus.text?.length > 100 || q.stimulus.figure); assert.ok(q.stimulus.attribution.length > 10); }
      for (const id of q.sourceIds) assert.equal(new URL(bank.sources[id].url).protocol, 'https:');
    }
    const counts = [0, 1, 2, 3].map(answer => bank.questions.filter(q => q.answer === answer).length);
    assert.ok(Math.max(...counts) - Math.min(...counts) <= 2, 'answers are spread evenly across A–D');
  }
});

test('math is typeset as LaTeX and every unit has figure-based questions', () => {
  const [calc, history] = banks;
  for (const q of calc.questions) for (const text of [q.stem, q.explanation, ...q.choices]) {
    assert.equal(text.split('\\(').length, text.split('\\)').length, q.id + ': unbalanced math delimiters');
    assert.doesNotMatch(text, /[²³√∫→≤≥≠≈ˣ′∞π]|\^\(/, q.id + ': plain-text math');
  }
  assert.ok(calc.questions.every(q => (q.stem + q.choices.join('')).includes('\\(')));
  for (let unit = 1; unit <= 8; unit++) assert.ok(calc.questions.filter(q => q.unit === unit && q.figure).length >= 2);
  for (let unit = 1; unit <= 9; unit++) assert.equal(history.questions.filter(q => q.unit === unit && q.stimulus.figure).length, 3);
  for (const q of [...calc.questions, ...history.questions]) {
    const figure = q.figure || q.stimulus?.figure;
    if (!figure) continue;
    assert.ok(figure.alt.length > 20);
    if (figure.svg) { assert.match(figure.svg, /^<svg[^>]+role="img"/); assert.doesNotMatch(figure.svg, /<script|\son\w+=|href=/i); }
    else assert.ok(figure.table.rows.every(row => row.length === figure.table.headers.length));
  }
});

test('unit, calculator and progress filters intersect; empty filters restore the entire course', async () => {
  const { filterQuestions, unitStats } = await api;
  const [calc, history] = banks;
  const subset = filterQuestions(calc, { units: [6], calculator: 'calculator' });
  assert.equal(subset.length, 7);
  assert.ok(subset.every(q => q.unit === 6 && q.calculator === 'calculator'));
  for (let unit = 1; unit <= 8; unit++) for (const calculator of ['calculator', 'non-calculator']) assert.ok(filterQuestions(calc, { units: [unit], calculator }).length >= 4);
  assert.equal(filterQuestions(calc, { units: [2, 6] }).length, calc.questions.filter(q => q.unit === 2 || q.unit === 6).length);
  assert.equal(filterQuestions(calc).length, calc.questions.length);
  assert.equal(filterQuestions(history, { units: [9], calculator: 'calculator' }).length, 22);
  const [right, wrong] = calc.questions, progress = { [right.id]: right.answer, [wrong.id]: (wrong.answer + 1) % 4 };
  assert.deepEqual(filterQuestions(calc, { completed: 'completed' }, progress).map(q => q.id), [right.id, wrong.id]);
  assert.equal(filterQuestions(calc, { completed: 'incomplete' }, progress).length, calc.questions.length - 2);
  assert.deepEqual(filterQuestions(calc, { result: 'correct' }, progress).map(q => q.id), [right.id]);
  assert.deepEqual(filterQuestions(calc, { result: 'incorrect' }, progress).map(q => q.id), [wrong.id]);
  assert.deepEqual(unitStats(calc, calc.questions, progress)[0], { total: 25, attempts: 2, correct: 1 });
});

test('session URLs round-trip, ignore invalid values, and honor limit and shuffle', async () => {
  const { playerUrl, parseSession, buildSession } = await api;
  const url = playerUrl({ course: 'ap-calculus-ab', units: [6, 2], calculator: 'calculator', limit: 5, random: true });
  assert.equal(url, './mcq-player.html?course=ap-calculus-ab&units=2%2C6&calculator=calculator&limit=5&random=1');
  const session = parseSession(url.split('?')[1]);
  assert.deepEqual(session, { course: 'ap-calculus-ab', units: [2, 6], calculator: 'calculator', kind: '', completed: 'all', result: 'all', limit: 5, random: true });
  const picked = buildSession(banks[0], session, {}, () => 0.5);
  assert.equal(picked.length, 5);
  assert.ok(picked.every(q => [2, 6].includes(q.unit) && q.calculator === 'calculator'));
  assert.equal(parseSession('course=../secrets'), null);
  assert.deepEqual(parseSession('course=ap-us-history&units=0,3,99,x&calculator=calculator&limit=-4&result=maybe'), { course: 'ap-us-history', units: [3], calculator: '', kind: '', completed: 'all', result: 'all', limit: null, random: false });
  assert.equal(buildSession(banks[1], parseSession('course=ap-us-history'), {}).length, banks[1].questions.length);
});

test('progress survives unavailable or corrupt storage', async () => {
  const { loadProgress, saveProgress } = await api;
  const data = new Map(), storage = { getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v) };
  saveProgress('ap-calculus-ab', { a: 1 }, storage);
  assert.deepEqual(loadProgress('ap-calculus-ab', storage), { a: 1 });
  assert.deepEqual(loadProgress('ap-us-history', storage), {});
  data.set('korah_ap_mcq_progress_ap-us-history', '{not json');
  assert.deepEqual(loadProgress('ap-us-history', storage), {});
  assert.doesNotThrow(() => saveProgress('ap-us-history', {}, { setItem() { throw new Error('quota'); } }));
  assert.deepEqual(loadProgress('ap-us-history', { getItem() { throw new Error('blocked'); } }), {});
});

test('mixed-course and malformed banks are rejected, and foreign questions never pass filtering', async () => {
  const { validateBank, filterQuestions } = await api;
  const bad = structuredClone(banks[0]);
  bad.questions.push(banks[1].questions[0]);
  assert.throws(() => validateBank(bad, bad.course));
  assert.equal(filterQuestions(bad).length, banks[0].questions.length);
  assert.throws(() => validateBank(banks[0], 'ap-us-history'));
  const duplicate = structuredClone(banks[0]); duplicate.questions.push(duplicate.questions[0]);
  assert.throws(() => validateBank(duplicate, duplicate.course));
  const broken = structuredClone(banks[0]); broken.questions[0].answer = 4;
  assert.throws(() => validateBank(broken, broken.course));
  const scripted = structuredClone(banks[0]); scripted.questions.find(q => q.figure?.svg).figure.svg = '<svg onload="alert(1)"></svg>';
  assert.throws(() => validateBank(scripted, scripted.course));
  const bare = structuredClone(banks[1]); delete bare.questions[0].stimulus.text;
  assert.throws(() => validateBank(bare, bare.course));
});

test('loader only requests the selected course and rejects missing data or invalid slugs', async () => {
  const { loadBank } = await api;
  const calls = [];
  const result = await loadBank('ap-us-history', async url => { calls.push(url); return { ok: true, json: async () => banks[1] }; });
  assert.deepEqual(calls, ['./data/ap-us-history/mcqs.json']);
  assert.equal(result.course, 'ap-us-history');
  await assert.rejects(loadBank('../other', () => { throw new Error('must not fetch'); }), /Unknown course/);
  await assert.rejects(loadBank('ap-calculus-ab', async () => ({ ok: false })), /unavailable/);
  await assert.rejects(loadBank('ap-us-history', async () => ({ ok: true, json: async () => banks[0] })), /Invalid course/);
});

test('the build script reproduces the committed banks', () => {
  const slugs = ['ap-calculus-ab', 'ap-us-history', 'ap-physics-1'], before = [...banks, physics].map(b => JSON.stringify(b));
  require('node:child_process').execFileSync(process.execPath, [path.join(__dirname, 'ap-mcq-build/build.cjs')], { stdio: 'ignore' });
  const after = slugs.map(slug => JSON.stringify(JSON.parse(fs.readFileSync(path.join(__dirname, '../korah-bot/ap/data', slug, 'mcqs.json'), 'utf8'))));
  assert.deepEqual(after, before);
});

test('the AP Physics 1 bank has 134 questions, split evenly between conceptual and quantitative, with figures', async () => {
  const { validateBank, COURSES, filterQuestions, playerUrl, parseSession, buildSession } = await api;
  validateBank(physics, 'ap-physics-1');
  const course = COURSES.find(c => c.slug === 'ap-physics-1'), qs = physics.questions;
  assert.equal(qs.length, 134);
  assert.equal(new Set(qs.map(q => q.stem)).size, 134);
  assert.equal(qs.filter(q => q.kind === 'conceptual').length, qs.filter(q => q.kind === 'quantitative').length, 'conceptual and quantitative counts match');
  assert.ok(qs.every(q => !banks.some(b => b.questions.some(o => o.id === q.id))));
  const perUnit = course.units.map((_, i) => qs.filter(q => q.unit === i + 1).length);
  assert.ok(Math.max(...perUnit) - Math.min(...perUnit) <= 1, 'questions are divided evenly among units: ' + perUnit);
  const counts = [0, 1, 2, 3].map(answer => qs.filter(q => q.answer === answer).length);
  assert.ok(Math.max(...counts) - Math.min(...counts) <= 2);
  for (const kind of ['conceptual', 'quantitative']) {
    for (let unit = 1; unit <= 8; unit++) assert.ok(filterQuestions(physics, { units: [unit], kind }).length >= 6, 'unit ' + unit + ' has ' + kind + ' questions');
  }
  assert.ok(qs.filter(q => q.figure).length >= 60);
  for (let unit = 1; unit <= 8; unit++) assert.ok(qs.filter(q => q.unit === unit && q.figure).length >= 4, 'unit ' + unit + ' has figure questions');
  for (const q of qs) {
    assert.ok(q.explanation.length > 60);
    if (q.figure) { assert.ok(q.figure.alt.length > 20); assert.match(q.figure.svg, /^<svg[^>]+role="img"/); assert.doesNotMatch(q.figure.svg, /<script|\son\w+=|href=|NaN|undefined/i); }
    for (const text of [q.stem, q.explanation, ...q.choices]) {
      assert.equal(text.split('\\(').length, text.split('\\)').length, q.id + ': unbalanced math delimiters');
      assert.doesNotMatch(text, /[²³√→≤≥≈θμωρ]|\^\(/, q.id + ': plain-text math');
    }
  }
  // The type filter is physics-only, and it travels in the session URL.
  assert.equal(filterQuestions(physics, { kind: 'conceptual' }).length + filterQuestions(physics, { kind: 'quantitative' }).length, 134);
  assert.equal(filterQuestions(banks[0], { kind: 'conceptual' }).length, banks[0].questions.length);
  const session = parseSession(playerUrl({ course: 'ap-physics-1', units: [5], kind: 'conceptual' }).split('?')[1]);
  assert.equal(session.kind, 'conceptual');
  assert.ok(buildSession(physics, session).every(q => q.unit === 5 && q.kind === 'conceptual'));
  assert.equal(parseSession('course=ap-physics-1&kind=essay&calculator=calculator').kind, '');
  assert.equal(parseSession('course=ap-calculus-ab&kind=conceptual').kind, '');
  // Course separation: a bank is rejected under another course's slug or with a missing type.
  assert.throws(() => validateBank(physics, 'ap-calculus-ab'));
  const untyped = structuredClone(physics); delete untyped.questions[0].kind;
  assert.throws(() => validateBank(untyped, 'ap-physics-1'));
  const typed = structuredClone(banks[0]); typed.questions[0].kind = 'conceptual';
  assert.throws(() => validateBank(typed, 'ap-calculus-ab'));
});

// Independently recalculate every calculator answer: midpoint quadrature,
// Newton iteration, and centered finite differences (rather than the
// Simpson quadrature / bisection used when authoring the answer key).
const integral = (f, a, b) => { const n = 20000, h = (b-a)/n; let s=0; for(let i=0;i<n;i++) s+=f(a+(i+.5)*h); return s*h; };
const derivative = (f,x) => (f(x+1e-5)-f(x-1e-5))/2e-5;
const root = (f,x) => { for(let i=0;i<20;i++) x-=f(x)/derivative(f,x); return x; };
const num = text => Number(text.replace(/\\[()]/g, ''));
test('all 50 calculator answer keys agree with independent numerical calculations', () => {
  const expectations = [
    4*Math.log(2),
    root(x=>Math.cos(x)-x/2,1),
    Math.exp(.3),
    2-Math.log(3),
    Math.log(3)/Math.cos(1),
    derivative(x=>x*x*Math.sin(x),1.7),
    (Math.log(10)-Math.log(2))/2,
    (x=>Math.sqrt(x)+Math.cos(x)-x*derivative(t=>Math.sqrt(t)+Math.cos(t),x))(2),
    root(x=>derivative(t=>t**3-Math.exp(t),x)-2,1.5),
    Math.sqrt((Math.exp(2)-1)/6),
    derivative(x=>Math.log(3+Math.sin(x*x)),1.2),
    1/derivative(y=>Math.cbrt(y+Math.cos(y)),1),
    1/derivative(x=>x**3+2*x+Math.exp(x),root(x=>x**3+2*x+Math.exp(x)-4,.7)),
    derivative(x=>Math.atan(Math.exp(x)),.5),
    (f=>(f(1+1e-4)-2*f(1)+f(1-1e-4))/1e-8)(x=>Math.sin(Math.exp(x))),
    derivative(t=>20+30*Math.exp(-.24*t),5),
    root(t=>Math.sin(t)-.2*t,2.5),
    derivative(t=>40+4*Math.sin(t)+t**3/3,1.3),
    Math.log(1.7)**2,
    derivative(t=>t*Math.cos(t*t/3),2),
    derivative(t=>500/(1+4*Math.exp(-.3*t)),5),
    root(x=>Math.cos(x)-x/3,1),
    Math.sqrt(6),
    Math.log(3),
    ((x)=>x*x+Math.exp(-x))(root(x=>2*x-Math.exp(-x),.35)),
    root(x=>Math.exp(-x)-.2*x,1.3),
    root(x=>derivative(t=>t*Math.log(t+1),x)-Math.log(4),1.3),
    integral(x=>Math.exp(-x*x),0,2),
    12+integral(t=>4+Math.sin(t*t),0,3),
    7*Math.log(7)-2*Math.log(2)-5,
    derivative(x=>integral(t=>Math.sin(t*t),0,x*x),1.4),
    .5*[.25,.75,1.25,1.75].reduce((s,x)=>s+Math.exp(-x*x),0),
    50+80*(1-Math.exp(-.6))-18,
    root(k=>integral(x=>Math.exp(-x*x),0,k)-.5,.5),
    100*Math.exp(-.17*8),
    root(t=>20+60*Math.exp(-.12*t)-45,7),
    Math.sqrt(4+2*Math.sin(1.2)),
    40*Math.exp(.035*18),
    Math.log(.5)/(Math.log(.7)/6),
    20+70*(5/7)**(12/5),
    Math.sqrt(26/3),
    25000*Math.exp(.5)-20000,
    integral(x=>Math.exp(-x)-x*x,0,root(x=>Math.exp(-x)-x*x,.7)),
    integral(t=>Math.abs(Math.sin(t)-.3),0,Math.PI),
    integral(x=>Math.sqrt(1+x**3),0,2)/2,
    Math.PI*integral(x=>Math.exp(-2*x*x),0,1),
    9*Math.PI/2+8,
    integral(x=>Math.abs(Math.cos(x)-.2*x),0,3),
    integral(x=>Math.sin(x)-x*x,0,root(x=>Math.sin(x)-x*x,.9)),
    Math.PI*integral(x=>Math.log(x)**2,1,3),
  ];
  const questions=banks[0].questions.filter(q=>q.calculator==='calculator');
  assert.equal(questions.length,expectations.length);
  questions.forEach((q,i)=>{
    assert.ok(Math.abs(num(q.choices[q.answer])-expectations[i])<=.00051, `${q.id}: expected ${expectations[i]}, got ${q.choices[q.answer]}`);
    q.choices.forEach((c,j)=>{if(j!==q.answer) assert.ok(Math.abs(num(c)-expectations[i])>.001, `${q.id}: ambiguous distractor`);});
  });
});
