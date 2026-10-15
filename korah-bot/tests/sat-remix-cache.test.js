import test from 'node:test';
import assert from 'node:assert/strict';
import { createSatRemixCache } from '../app/data/sat-remix-cache.js';

function sharedAdapter() {
  const docs = new Map();
  return {
    docs,
    async read(id) { return docs.get(id); },
    async reserve(id, token) {
      if (!docs.has(id)) docs.set(id, {status:'pending',token});
      return docs.get(id);
    },
    async publish(id, token, question) {
      assert.equal(docs.get(id).token, token);
      docs.set(id, {status:'ready',question}); return question;
    },
    async release(id, token) { if (docs.get(id)?.token === token) docs.delete(id); }
  };
}
test('shared cache generates once and a separate client retrieves the saved question', async () => {
  const adapter = sharedAdapter(); const first = createSatRemixCache(adapter);
  const second = createSatRemixCache(adapter); let calls = 0;
  const generate = async () => { calls++; return {id:'child'}; };
  assert.equal((await first.getOrCreate('original', generate)).id, 'child');
  assert.equal((await second.getOrCreate('original', generate)).id, 'child');
  assert.equal(calls, 1);
  await second.getOrCreate('child', async () => ({id:'grandchild'}));
  assert.equal(adapter.docs.get('child').question.id, 'grandchild');
});
test('concurrent clients cannot both generate the same source', async () => {
  const adapter = sharedAdapter(); let finish;
  const started = Promise.withResolvers();
  const pending = createSatRemixCache(adapter).getOrCreate('original', () => {
    started.resolve(); return new Promise(resolve => { finish = resolve; });
  });
  await started.promise;
  await assert.rejects(createSatRemixCache(adapter).getOrCreate('original', () => assert.fail()), /already being remixed/);
  finish({id:'child'}); await pending;
});
test('publication failure retries the save without regenerating', async () => {
  const adapter = sharedAdapter(); const publish = adapter.publish;
  let fails = true; let calls = 0;
  adapter.publish = async (...args) => { if (fails) throw Error('Write unavailable'); return publish(...args); };
  const cache = createSatRemixCache(adapter);
  const generate = async () => { calls++; return {id:'child'}; };
  await assert.rejects(cache.getOrCreate('original', generate), /Write unavailable/);
  fails = false;
  await cache.getOrCreate('original', generate); assert.equal(calls, 1);
});
test('permission failure does not call Gemini', async () => {
  const adapter = sharedAdapter(); adapter.read = async () => { throw Error('permission-denied'); };
  await assert.rejects(createSatRemixCache(adapter).getOrCreate('original', () => assert.fail()), /permission-denied/);
});
