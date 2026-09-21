import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read = name => JSON.parse(fs.readFileSync(new URL(name,import.meta.url),'utf8'));
test('verified assessment content agrees between aggregate and module data', () => {
  const aggregate=read('../docs/practice-tests/test-11/test-11.json');
  const module=read('../docs/practice-tests/test-11/math-module-1.json');
  assert.equal(aggregate.mathModule1.length,27);
  assert.equal(aggregate.mathModule1.filter(q=>q.stemHtml).length,13);
  for (const q of aggregate.mathModule1.filter(q=>q.stemHtml)) {
    assert.deepEqual(q,module.find(item=>item.n===q.n));
    assert.ok(q.contentVerification.pdfPage>=34);
    if(q.type==='mcq') assert.equal(q.optionHtml.length,4);
    const key=aggregate.meta.answerKey.mathModule1.find(item=>item.q===q.n);
    assert.equal(q.correct,key.answer,`answer key for ${q.n}`);
  }
  assert.deepEqual(aggregate.mathModule1[1].options,['A) 4x=32','B) 4x=5','C) 4x=1','D) 4x=-32']);
  assert.ok(aggregate.mathModule1[4].stemHtml.includes('<table>'));
  assert.ok(aggregate.mathModule1[8].stemHtml.includes('<msqrt>'));
});
test('legacy math conversion is bounded and preserves expressions', () => {
  const context={window:{}};
  vm.runInNewContext(fs.readFileSync(new URL('../sat/js/question-content.js',import.meta.url),'utf8'),context);
  const convert=context.window.KorahQuestionContent.mathFromDescription;
  assert.ok(convert('three halves').includes('<mfrac><mn>3</mn><mn>2</mn></mfrac>'));
  assert.ok(convert('the fraction x over 3').includes('<mfrac><mi>x</mi><mn>3</mn></mfrac>'));
  assert.ok(convert('120 a, plus 100 b, is less than or equal to 1,100').includes('<mo>≤</mo><mn>1100</mn>'));
  assert.ok(convert('negative 3 point 5').includes('<mo>−</mo><mn>3.5</mn>'));
  assert.ok(convert('AB = AC').includes('<mi>A</mi><mi>B</mi><mo>=</mo><mi>A</mi><mi>C</mi>'));
  for(const text of ['x over y plus z','the equation shown','1/0','x plus','x minus','<script>alert(1)</script>','(x+y']) assert.equal(convert(text),null,text);
});
