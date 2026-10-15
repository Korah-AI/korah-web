import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const script = fs.readFileSync(new URL('../sat/js/sat-remix.js', import.meta.url), 'utf8');
const fixture = () => ({ paragraph: '', stem: 'What is 2 + 3?',
  options: ['4', '5', '6', '7'].map((text, i) => ({key: 'ABCD'[i], text})),
  correctAnswer: 'B', explanation: '2 + 3 = 5.' });
// Firestore stand-in: a Map keyed like satRemixes/{sourceId}.
function firestore(store = new Map()) {
  return { uid: 'student', store,
    getSatRemix: async id => store.get(id) ?? null,
    setSatRemix: async (id, value) => { store.set(id, value); } };
}
function harness(db = firestore()) {
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
    crypto: webcrypto, TextEncoder, Blob, AbortSignal, console: { error() {}, warn() {} },
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

function model(h, counter = { calls: 0 }) {
  h.context.fetch = async (url, request) => {
    counter.calls++;
    assert.equal(url, '/api/r');
    const body = JSON.parse(request.body);
    assert.equal(body.response_format.type, 'json_object');
    assert.match(body.messages[1].content[0].text, /Complete source question/);
    return { ok: true, json: async () => ({ choices: [{message:{content:JSON.stringify(fixture())}}] }) };
  };
  return counter;
}
test('generation saves to Firestore and later remixes reuse it without a model call', async () => {
  const db = firestore();
  const h = harness(db); const counter = model(h);
  Object.assign(h.source, { section:'math', domain:'Algebra', skillCd:'H.A.', difficulty:'M', type:'mc' });
  await h.click();
  assert.equal(h.added.length, 1);
  const remix = db.store.get('source-1');
  assert.match(remix.id, /^remix-[a-f0-9]{64}$/);
  assert.equal(remix.skillCd, 'H.A.');
  assert.equal(remix.difficulty, 'M');
  assert.equal(remix.sourceQuestionId, 'source-1');
  await h.click(); assert.equal(counter.calls, 1);
  const otherStudent = harness(firestore(db.store));
  await otherStudent.click();
  assert.equal(otherStudent.added[0][0].id, remix.id);
  assert.equal(otherStudent.button.disabled, false);
});
test('remix chains use the child as the next cache key', async () => {
  const db = firestore(); const h = harness(db); const counter = model(h);
  await h.click(); const child = h.added[0][0];
  h.source.id = child.id;
  await h.click(); const grandchild = h.added[1][0];
  assert.notEqual(grandchild.id, child.id);
  assert.equal(grandchild.sourceQuestionId, child.id);
  assert.ok(db.store.has(child.id));
  await h.click(); assert.equal(counter.calls, 2);
});
test('Firestore read or write failures still produce a usable remix', async () => {
  const db = firestore();
  db.getSatRemix = async () => { throw Error('unavailable'); };
  db.setSatRemix = async () => { throw Error('permission-denied'); };
  const h = harness(db); const counter = model(h);
  await h.click();
  assert.equal(counter.calls, 1);
  assert.equal(h.added.length, 1);
});
test('invalid saved remixes are replaced by a valid generation', async () => {
  const db = firestore(new Map([['source-1', { id: 'bad', sourceQuestionId: 'source-1' }]]));
  const h = harness(db); const counter = model(h);
  await h.click(); assert.equal(counter.calls, 1);
  assert.equal(db.store.get('source-1').correctAnswer, 'B');
});
test('guest access does not generate', async () => {
  const h = harness(null); await h.click(); assert.match(h.status.textContent, /Sign in/);
});
test('failed requests are retryable and never cached', async () => {
  const db = firestore(); const h = harness(db);
  h.context.fetch = async () => ({ok:false,status:503});
  await h.click(); assert.equal(db.store.size, 0); assert.equal(h.added.length, 0);
  assert.equal(h.button.disabled, false);
  model(h); await h.click(); assert.equal(h.added.length, 1);
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
