/* ═══════════════════════════════════════════════════
   VOCAB DATA — shared word DB loader + index (window.VocabData)
   Fetches cleaned_sat_vocabulary.json once.
   No backend, no auth — pure static JSON.
   Shared by: vocab learn/practice (sat/vocab/*.html) and the
   home page "Word of the Day" card (index.html) — both read the
   same JSON through this one loader, never their own fetch.
   ═══════════════════════════════════════════════════ */
(function () {
  const script = document.currentScript;
  const scriptDir = script && script.src
    ? script.src.slice(0, script.src.lastIndexOf('/') + 1)
    : '';
  const DATA_URL = scriptDir + '../../../vocab/cleaned_sat_vocabulary.json';

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
    /* daily "word of the day". index = whole EST days since epoch (EST = UTC-5,
       fixed, no DST), minus the offset (0 = today, -1 = yesterday, …) →
       deterministic, same word for everyone, stable across refreshes,
       changes at EST midnight (5:00 AM UTC). */
    dailyWord(offset = 0) {
      if (!all.length) return null;
      const estMs = Date.now() - 5 * 3600000;
      const day = Math.floor(estMs / 86400000) - offset;
      return all[((day % all.length) + all.length) % all.length];
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