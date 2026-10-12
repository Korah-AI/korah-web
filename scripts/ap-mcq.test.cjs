const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = ['ap-calculus-ab', 'ap-us-history'].map(slug => JSON.parse(fs.readFileSync(path.join(__dirname, '../korah-bot/ap/data', slug, 'mcqs.json'), 'utf8')));
const api = import('../korah-bot/ap/js/mcq-bank.js');

test('each separate bank has at least 100 unique, complete questions covering every course unit', async () => {
  const { validateBank, COURSES } = await api;
  const allIds = new Set();
  for (const bank of banks) {
    validateBank(bank, bank.course);
    assert.ok(bank.questions.length >= 100);
    assert.equal(new Set(bank.questions.map(q => q.stem)).size, bank.questions.length);
    const course = COURSES.find(c => c.slug === bank.course);
    for (let unit = 1; unit <= course.units.length; unit++) assert.ok(bank.questions.filter(q => q.unit === unit).length >= 10);
    for (const q of bank.questions) {
      assert.ok(!allIds.has(q.id)); allIds.add(q.id);
      assert.ok(q.explanation.length > 40);
      if (bank.course === 'ap-us-history') { assert.ok(q.stimulus?.text.length > 100); assert.match(q.stimulus.attribution, /\d{4}/); }
      for (const id of q.sourceIds) assert.equal(new URL(bank.sources[id].url).protocol, 'https:');
    }
    for (let answer = 0; answer < 4; answer++) assert.equal(bank.questions.filter(q => q.answer === answer).length, bank.questions.length / 4);
  }
});

test('unit and calculator filters intersect; empty filters restore the entire course', async () => {
  const { filterQuestions } = await api;
  const calc = banks[0];
  const subset = filterQuestions(calc, { unit: '6', calculator: 'calculator' });
  assert.equal(subset.length, 6);
  assert.ok(subset.every(q => q.unit === 6 && q.calculator === 'calculator'));
  for (let unit = 1; unit <= 8; unit++) for (const calculator of ['calculator', 'non-calculator']) assert.ok(filterQuestions(calc, { unit: String(unit), calculator }).length >= 4);
  assert.equal(filterQuestions(calc, { unit: '9' }).length, 0);
  assert.equal(filterQuestions(calc).length, calc.questions.length);
  assert.equal(filterQuestions(banks[1], { unit: '9', calculator: 'calculator' }).length, 12);
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

// Independently recalculate every calculator answer: midpoint quadrature,
// Newton iteration, and centered finite differences (rather than the
// Simpson quadrature / bisection used when authoring the answer key).
const integral = (f, a, b) => { const n = 200000, h = (b-a)/n; let s=0; for(let i=0;i<n;i++) s+=f(a+(i+.5)*h); return s*h; };
const derivative = (f,x) => (f(x+1e-5)-f(x-1e-5))/2e-5;
const root = (f,x) => { for(let i=0;i<20;i++) x-=f(x)/derivative(f,x); return x; };
test('all 36 calculator answer keys agree with independent numerical calculations', () => {
  const expectations = [
    4*Math.log(2),
    root(x=>Math.cos(x)-x/2,1),
    Math.exp(.3),
    2-Math.log(3),
    derivative(x=>x*x*Math.sin(x),1.7),
    (Math.log(10)-Math.log(2))/2,
    (x=>Math.sqrt(x)+Math.cos(x)-x*derivative(t=>Math.sqrt(t)+Math.cos(t),x))(2),
    root(x=>derivative(t=>t**3-Math.exp(t),x)-2,1.5),
    derivative(x=>Math.log(3+Math.sin(x*x)),1.2),
    1/derivative(y=>Math.cbrt(y+Math.cos(y)),1),
    1/derivative(x=>x**3+2*x+Math.exp(x),root(x=>x**3+2*x+Math.exp(x)-4,.7)),
    derivative(x=>Math.atan(Math.exp(x)),.5),
    derivative(t=>20+30*Math.exp(-.24*t),5),
    root(t=>Math.sin(t)-.2*t,2.5),
    derivative(t=>40+4*Math.sin(t)+t**3/3,1.3),
    Math.log(1.7)**2,
    root(x=>Math.cos(x)-x/3,1),
    Math.sqrt(6),
    Math.log(3),
    ((x)=>x*x+Math.exp(-x))(root(x=>2*x-Math.exp(-x),.35)),
    integral(x=>Math.exp(-x*x),0,2),
    12+integral(t=>4+Math.sin(t*t),0,3),
    7*Math.log(7)-2*Math.log(2)-5,
    derivative(x=>integral(t=>Math.sin(t*t),0,x*x),1.4),
    .5*[.25,.75,1.25,1.75].reduce((s,x)=>s+Math.exp(-x*x),0),
    50+80*(1-Math.exp(-.6))-18,
    100*Math.exp(-.17*8),
    root(t=>20+60*Math.exp(-.12*t)-45,7),
    Math.sqrt(4+2*Math.sin(1.2)),
    40*Math.exp(.035*18),
    integral(x=>Math.exp(-x)-x*x,0,root(x=>Math.exp(-x)-x*x,.7)),
    integral(t=>Math.abs(Math.sin(t)-.3),0,Math.PI),
    integral(x=>Math.sqrt(1+x**3),0,2)/2,
    Math.PI*integral(x=>Math.exp(-2*x*x),0,1),
    9*Math.PI/2+8,
    integral(x=>Math.abs(Math.cos(x)-.2*x),0,3),
  ];
  const questions=banks[0].questions.filter(q=>q.calculator==='calculator');
  assert.equal(questions.length,expectations.length);
  questions.forEach((q,i)=>{
    assert.ok(Math.abs(Number(q.choices[q.answer].replace('−','-'))-expectations[i])<=.00051, `${q.id}: expected ${expectations[i]}, got ${q.choices[q.answer]}`);
    q.choices.forEach((c,j)=>{if(j!==q.answer) assert.ok(Math.abs(Number(c.replace('−','-'))-expectations[i])>.001, `${q.id}: ambiguous distractor`);});
  });
});
