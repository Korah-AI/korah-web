import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { expandMfenced, expandMenclose, normalizeQuestion, normalizeQuestionContent, fetchQuestionDetail } from '../api/_lib/collegeboard.js';
import detailRoute from '../api/sat/qi.js';

test('nested fences retain explicit separators and single-quoted delimiters', () => {
  assert.equal(expandMfenced("<math><mfenced open='[' close=']' separators=';'><mi>x</mi><mfenced><mi>y</mi><mi>z</mi></mfenced></mfenced></math>"), '<math><mrow><mo>[</mo><mi>x</mi><mo>;</mo><mrow><mo>(</mo><mi>y</mi><mo>,</mo><mi>z</mi><mo>)</mo></mrow><mo>]</mo></mrow></math>');
  assert.equal(expandMfenced('<mfenced open="" close="" separators=""><mi>x</mi><mi>y</mi></mfenced>'), '<mrow><mi>x</mi><mi>y</mi></mrow>');
  assert.equal(expandMfenced('<mfenced open="&#124;" close="&#124;"><mi>x</mi></mfenced>'), '<mrow><mo>&#124;</mo><mi>x</mi><mo>&#124;</mo></mrow>');
});
test('overbars are preserved', () => assert.equal(expandMenclose('<menclose notation="top"><mi>A</mi><mi>B</mi></menclose>'), '<mover accent="true"><mrow><mi>A</mi><mi>B</mi></mrow><mo>&#175;</mo></mover>'));
test('nested and single-quoted overbars remain balanced', () => {
  const expanded=expandMenclose("<menclose notation='top'><menclose notation='top'><mi>x</mi></menclose></menclose>");
  assert.equal((expanded.match(/<mover/g)||[]).length,2);
  assert.equal((expanded.match(/<\/mover>/g)||[]).length,2);
  assert.ok(!expanded.includes('menclose'));
});
test('stubs remain unloaded and contain no phantom answers', () => {
  const q=normalizeQuestion({external_id:'stub', primary_class_cd:'H'},null);
  assert.equal(q.loaded,false); assert.equal(q.stem,''); assert.deepEqual(q.correctAnswers,[]);
});
test('initial and lazy-loaded content agree for real upstream fixtures', async () => {
  const fixtures=JSON.parse(fs.readFileSync(new URL('./fixtures/collegeboard-content.json',import.meta.url),'utf8').replace(/^\uFEFF/,''));
  const originalFetch=globalThis.fetch;
  try {
    for(const fixture of fixtures) {
      const id=fixture.meta.external_id || fixture.meta.ibn;
      globalThis.fetch=async()=>({ok:true,json:async()=> fixture.meta.ibn ? (Array.isArray(fixture.detail)?fixture.detail:[fixture.detail]) : fixture.detail});
      const detail=await fetchQuestionDetail(id);
      assert.ok(detail, id);
      const normalized=normalizeQuestion(fixture.meta,detail);
      const res={setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};
      await detailRoute({method:'GET',query:{id}},res);
      assert.equal(res.code,200);
      for(const field of Object.keys(normalizeQuestionContent(detail))) assert.deepEqual(res.body[field],normalized[field],`${id}: ${field}`);
      assert.equal(normalized.id,id);
      assert.equal(normalized.loaded,true);
      assert.deepEqual(normalized.correctAnswers,detail.correct_answer);
    }
  } finally {globalThis.fetch=originalFetch;}
});
