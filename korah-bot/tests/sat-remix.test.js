import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';

const script = fs.readFileSync(new URL('../sat/js/sat-remix.js', import.meta.url), 'utf8');
const fixture = () => ({ paragraph: '', stem: 'What is 2 + 3?',
  options: ['4', '5', '6', '7'].map((text, i) => ({key: 'ABCD'[i], text})),
  correctAnswer: 'B', explanation: '2 + 3 = 5.' });
function harness(db = { uid: 'student' }, storage = new Map()) {
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
    navigator: {}, localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, value)
    }, crypto: webcrypto, TextEncoder, Blob, AbortSignal, console: { error() {} },
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

const key = id => 'korah:sat-remix:v1:' + id;
function model(h, counter = { calls: 0 }) {
  h.context.fetch = async (url, request) => {
    counter.calls++;
    assert.equal(url, '/api/gem-proxy');
    const body = JSON.parse(request.body);
    assert.equal(body.response_format.type, 'json_object');
    assert.match(body.messages[1].content[0].text, /Complete source question/);
    return { ok: true, json: async () => ({ choices: [{message:{content:JSON.stringify(fixture())}}] }) };
  };
  return counter;
}
test('generation persists locally and reload reuses cache without any Firestore methods', async () => {
  const storage = new Map();
  const deniedDB = new Proxy({ uid: 'student' }, { get(target, prop) {
    if (prop !== 'uid') assert.fail('Unexpected Firestore dependency');
    return target[prop];
  } });
  const h = harness(deniedDB, storage); const counter = model(h);
  Object.assign(h.source, { section:'math', domain:'Algebra', skillCd:'H.A.', difficulty:'M', type:'mc' });
  await h.click();
  assert.equal(h.added.length, 1);
  const remix = JSON.parse(storage.get(key('source-1')));
  assert.match(remix.id, /^remix-[a-f0-9]{64}$/);
  assert.equal(remix.skillCd, 'H.A.');
  assert.equal(remix.difficulty, 'M');
  assert.equal(remix.sourceQuestionId, 'source-1');
  await h.click(); assert.equal(counter.calls, 1);
  const reloaded = harness(deniedDB, storage);
  await reloaded.click();
  assert.equal(reloaded.added[0][0].id, remix.id);
  assert.equal(reloaded.button.disabled, false);
});
test('remix chains use the child as the next cache key', async () => {
  const storage = new Map(); const h = harness(undefined, storage); const counter = model(h);
  await h.click(); const child = h.added[0][0];
  h.source.id = child.id;
  await h.click(); const grandchild = h.added[1][0];
  assert.notEqual(grandchild.id, child.id);
  assert.equal(grandchild.sourceQuestionId, child.id);
  assert.ok(storage.has(key(child.id)));
  await h.click(); assert.equal(counter.calls, 2);
});
test('blocked or full storage retains usable questions in memory', async () => {
  for (const denyRead of [true, false]) {
    const h = harness(); const counter = model(h);
    h.context.localStorage = {
      getItem() { if (denyRead) throw Error('SecurityError'); return null; },
      setItem() { throw Error('QuotaExceededError'); }
    };
    await h.click();
    assert.equal(h.added.length, 1);
    assert.match(h.status.textContent, /this page only/);
    await h.click(); assert.equal(counter.calls, 1);
  }
});
test('corrupt cached data is replaced by a valid generation', async () => {
  for (const value of ['{broken', JSON.stringify({id:'bad',sourceQuestionId:'source-1'})]) {
    const storage = new Map([[key('source-1'), value]]);
    const h = harness(undefined, storage); const counter = model(h);
    await h.click(); assert.equal(counter.calls, 1);
    assert.equal(h.added.length, 1);
    assert.equal(JSON.parse(storage.get(key('source-1'))).correctAnswer, 'B');
  }
});
test('another tab holding the lock prevents duplicate model requests', async () => {
  const h = harness();
  h.context.navigator.locks = {request: async (_, options, fn) => {
    assert.equal(options.ifAvailable, true); return fn(null);
  }};
  await h.click();
  assert.match(h.status.textContent, /another tab/);
  assert.equal(h.added.length, 0);
  assert.equal(h.button.disabled, false);
});
test('guest access does not generate', async () => {
  const h = harness(null); await h.click(); assert.match(h.status.textContent, /Sign in/);
});
test('auth-ready state works without a Firestore data layer', async () => {
  const h = harness(null); h.context.window._korahReadyFired = {uid:'student'}; model(h);
  await h.click(); assert.equal(h.added.length, 1);
});
test('failed requests are retryable and never cached', async () => {
  const storage = new Map(); const h = harness(undefined, storage);
  h.context.fetch = async () => ({ok:false,status:503});
  await h.click(); assert.equal(storage.size, 0); assert.equal(h.added.length, 0);
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
