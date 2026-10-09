import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const script = fs.readFileSync(new URL('../sat/js/sat-remix.js', import.meta.url), 'utf8');
const fixture = () => ({ paragraph: '', stem: 'What is 2 + 3?',
  options: ['4', '5', '6', '7'].map((text, i) => ({key: 'ABCD'[i], text})),
  correctAnswer: 'B', explanation: '2 + 3 = 5.' });
function harness(db) {
  let click;
  const button = { addEventListener: (_, fn) => { click = fn; } };
  const status = {};
  const added = [];
  const source = { id: 'source-1', stem: 'Original', passage: '', correct: 'A', options: fixture().options };
  const context = { window: { KorahDB: db,
    KorahQuestionContent: { html: text => text },
    KorahSATPlayer: { getCurrentQuestion: () => ({ loaded: true }), addRemix: (...args) => added.push(args) },
    KorahSATContext: { readCurrentQuestion: () => source, buildQuestionContextBlock: () => 'Complete source question', parseJSON: JSON.parse } },
    document: { getElementById: id => id === 'remixBtn' ? button : status, querySelectorAll: () => [] },
    crypto: webcrypto, TextEncoder, Blob, AbortSignal,
    fetch: () => { throw new Error('Unexpected model call'); } };
  vm.runInNewContext(script, context);
  return { validate: context.window.KorahSATRemix.validate, click, added, status, button, source, context };
}
test('remix validates MCQ keys, answer membership and required fields', () => {
  const { validate, source } = harness();
  assert.equal(validate(fixture(), source).correctAnswer, 'B');
  for (const bad of [{ ...fixture(), correctAnswer: 'E' }, { ...fixture(), explanation: '' },
    { ...fixture(), options: [{ key: 'A', text: 'Only choice' }] },
    { ...fixture(), options: fixture().options.map(o => ({ ...o, key: 'A' })) }]) {
    assert.throws(() => validate(bad, source));
  }
});
test('numeric remixes reject invalid and zero-denominator answers', () => {
  const { validate, source } = harness(); source.options = [];
  const q = { ...fixture(), options: [], correctAnswer: '3/4' };
  assert.equal(validate(q, source).correctAnswer, '3/4');
  for (const answer of ['B', '1/0', '2/-0', '', 'NaN']) assert.throws(() => validate({ ...q, correctAnswer: answer }, source));
});
test('cache hits display the saved remix without model or reservation calls', async () => {
  const remix = { ...fixture(), id: 'remix-1', status: 'ready' };
  const h = harness({ uid: 'student', getSatRemix: async () => remix });
  await h.click();
  assert.equal(h.added[0][0].id, remix.id);
  assert.equal(h.added[0][0].correctAnswer, remix.correctAnswer);
  assert.equal(h.added[0][1], 'source-1');
  assert.equal(h.button.disabled, false);
});
test('reservation contention and cache errors never call the model', async () => {
  const h = harness({ uid: 'student', getSatRemix: async () => ({ status: 'pending' }), claimSatRemix: async () => false });
  await h.click();
  assert.match(h.status.textContent, /Another student/);
  assert.equal(h.added.length, 0);
  const failed = harness({ uid: 'student', getSatRemix: async () => { throw new Error('Cache unavailable'); } });
  await failed.click();
  assert.equal(failed.status.textContent, 'Cache unavailable');
  assert.equal(failed.added.length, 0);
});
test('guest access does not generate', async () => {
  const h = harness(); await h.click();
  assert.match(h.status.textContent, /Sign in/);
});
test('a generated remix preserves metadata and is saved before being displayed', async () => {
  const cache = new Map();
  const order = [];
  const h = harness({ uid: 'student', getSatRemix: async id => cache.get(id),
    claimSatRemix: async () => { order.push('claim'); return true; },
    setSatRemix: async (id, value) => { order.push('save'); cache.set(id, { ...value, status: 'ready' }); return cache.get(id); }
  });
  Object.assign(h.source, { section: 'math', domain: 'Algebra', skillCd: 'H.A.', difficulty: 'M', type: 'mc' });
  let calls = 0;
  h.context.fetch = async (url, request) => {
    calls++; order.push('generate');
    assert.equal(url, '/api/gem-proxy');
    const payload = JSON.parse(request.body);
    assert.match(payload.messages[1].content[0].text, /Complete source question/);
    assert.equal(payload.response_format.type, 'json_object');
    return { ok: true, json: async () => ({ choices: [{message:{content:JSON.stringify(fixture())}}] }) };
  };
  await h.click();
  assert.deepEqual(order, ['claim', 'generate', 'save']);
  assert.equal(h.added.length, 1);
  const remix = h.added[0][0];
  assert.match(remix.id, /^remix-[a-f0-9]{64}$/);
  assert.equal(remix.skillCd, 'H.A.');
  assert.equal(remix.difficulty, 'M');
  await h.click();
  assert.equal(calls, 1);
  assert.equal(h.added[1][0].id, remix.id);
});
test('image elements are sent as PNG image parts and image errors stop capture', async () => {
  const h = harness();
  h.context.setTimeout = setTimeout; h.context.clearTimeout = clearTimeout;
  h.context.document.createElement = () => ({
    getContext: () => ({fillRect() {}, drawImage() {}}),
    toDataURL: () => 'data:image/png;base64,cGljdHVyZQ=='
  });
  h.context.Image = class { naturalWidth = 300; naturalHeight = 200; set src(value) { this.onload(); } };
  const node = {tagName:'IMG', currentSrc:'https://example.test/diagram.png'};
  const part = await h.context.window.KorahSATRemix.imagePart(node);
  assert.equal(part.type, 'image_url');
  assert.match(part.image_url.url, /^data:image\/png;base64,/);
  h.context.Image = class { set src(value) { this.onerror(); } };
  await assert.rejects(() => h.context.window.KorahSATRemix.imagePart(node), /could not be read/);
});
