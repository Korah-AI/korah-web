/* ═══════════════════════════════════════════════════
   VOCAB DATA — word DB loader + index (window.VocabData)
   Fetches ../../vocab/cleaned_sat_vocabulary.json once.
   No backend, no auth — pure static JSON.
   ═══════════════════════════════════════════════════ */
(function () {
  const DATA_URL = '../../vocab/cleaned_sat_vocabulary.json';

  let status = 'loading';        // loading | ready | error
  let errorObj = null;
  let all = [];
  let byWord = new Map();
  let byPos = new Map();
  let currentPromise = null;

  function normalize(word) {
    return String(word == null ? '' : word).trim().toLowerCase();
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  async function load() {
    status = 'loading';
    errorObj = null;
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const payload = await res.json();
      const words = (payload && Array.isArray(payload.words)) ? payload.words : [];
      if (!words.length) throw new Error('Empty word DB');

      const seen = new Set();
      all = [];
      byWord = new Map();
      byPos = new Map();

      for (const raw of words) {
        const word = normalize(raw.word);
        if (!word || seen.has(word)) continue;   // dedupe, first wins
        seen.add(word);
        const record = Object.assign({}, raw, { word });
        all.push(record);
        byWord.set(word, record);
        const pos = record.part_of_speech || 'other';
        if (!byPos.has(pos)) byPos.set(pos, []);
        byPos.get(pos).push(record);
      }
      status = 'ready';
    } catch (err) {
      status = 'error';
      errorObj = err;
      throw err;
    }
  }

  currentPromise = load().then(() => undefined, () => undefined);

  const api = {
    normalize,
    get status() { return status; },
    get error() { return errorObj; },
    get all() { return all; },
    get byWord() { return byWord; },
    get byPos() { return byPos; },
    /* resolves when the current load attempt settles */
    ready() {
      if (!currentPromise) {
        currentPromise = load().then(() => undefined, () => undefined);
      }
      return currentPromise;
    },
    /* re-fetch from scratch (error-card retry) */
    retry() {
      currentPromise = null;
      return api.ready();
    },
    search(query) {
      const q = normalize(query);
      if (!q) return [];
      const prefix = [];
      const substring = [];
      for (const r of all) {
        if (r.word.startsWith(q)) prefix.push(r);
        else if (r.word.includes(q)) substring.push(r);
        if (prefix.length >= 50) break;
      }
      return prefix.concat(substring).slice(0, 50);
    },
    /* 20 random easy/medium words for the "discover" row */
    suggestions() {
      const pool = all.filter(r => r.difficulty === 'easy' || r.difficulty === 'medium');
      return shuffle(pool).slice(0, 20);
    },
    /* pick N random records of a POS, excluding given words (quiz distractors) */
    samplesOf(pos, excludeWords, count) {
      const words = new Set((excludeWords || []).map(normalize));
      const posPool = (byPos.get(pos) || []).filter(r => !words.has(r.word) && r.word);
      const pool = posPool.length >= count ? posPool : all;
      return shuffle(pool).slice(0, count);
    },
  };

  window.VocabData = api;
})();