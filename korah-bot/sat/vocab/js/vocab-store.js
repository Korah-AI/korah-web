/* ═══════════════════════════════════════════════════
   VOCAB STORE — localStorage CRUD + mastery math (window.VocabStore)
   Keys mirror SETUP.md §3:
     korah_vocab_data        → { learntVocabs: string[], userSentences: {} }
     korah_vocab_performance → PracticePerformanceData
   localStorage is the synchronous source the Alpine components read from.
   vocab-sync.js registers a remote via setRemote() after auth and every write
   below is then mirrored to Firestore.
   ═══════════════════════════════════════════════════ */
(function () {
  const DATA_KEY = 'korah_vocab_data';
  const PERF_KEY = 'korah_vocab_performance';

  const MASTERY_DEFAULT = {
    totalAttempts: 0,
    correctAttempts: 0,
    incorrectAttempts: 0,
    averageTimeSpent: 0,
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    strugglingAreas: [],
    masteryLevel: 'not-practiced',
  };

  /* Set by vocab-sync.js once Firebase auth resolves. Null when signed out,
     which is the whole local-only path. */
  let remote = null;

  function normalize(word) {
    return String(word == null ? '' : word).trim().toLowerCase();
  }

  function defaultData() {
    return { learntVocabs: [], userSentences: {}, studySets: [] };
  }

  function defaultPerf() {
    return {
      attempts: [],
      wordPerformance: {},
      overallAccuracy: 0,
      strongWords: [],
      weakWords: [],
    };
  }

  function readData() {
    try {
      const raw = localStorage.getItem(DATA_KEY);
      if (!raw) return defaultData();
      const parsed = JSON.parse(raw);
      return {
        learntVocabs: Array.isArray(parsed.learntVocabs) ? parsed.learntVocabs : [],
        userSentences: parsed.userSentences && typeof parsed.userSentences === 'object' ? parsed.userSentences : {},
        studySets: Array.isArray(parsed.studySets) ? parsed.studySets : [],
      };
    } catch (e) {
      localStorage.removeItem(DATA_KEY);
      return defaultData();
    }
  }

  function writeData(data, mirror) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
    } catch (e) {
      return false;
    }
    if (remote && mirror !== false) remote.pushBank(data);
    return true;
  }

  function readPerf() {
    try {
      const raw = localStorage.getItem(PERF_KEY);
      if (!raw) return defaultPerf();
      const parsed = JSON.parse(raw);
      const perf = {
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
        wordPerformance: parsed.wordPerformance && typeof parsed.wordPerformance === 'object' ? parsed.wordPerformance : {},
        overallAccuracy: typeof parsed.overallAccuracy === 'number' ? parsed.overallAccuracy : 0,
        strongWords: Array.isArray(parsed.strongWords) ? parsed.strongWords : [],
        weakWords: Array.isArray(parsed.weakWords) ? parsed.weakWords : [],
      };
      // Normalize any stored word keys to lowercase, into a fresh object so we
      // are not deleting from the map we are walking.
      const normalized = {};
      for (const [key, value] of Object.entries(perf.wordPerformance)) {
        normalized[normalize(key)] = value;
      }
      perf.wordPerformance = normalized;
      return perf;
    } catch (e) {
      localStorage.removeItem(PERF_KEY);
      return defaultPerf();
    }
  }

  function writePerf(perf) {
    try {
      localStorage.setItem(PERF_KEY, JSON.stringify(perf));
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ── wordbank ─────────────────────────────────────── */

  function addWord(word) {
    const data = readData();
    const n = normalize(word);
    if (!n || data.learntVocabs.includes(n)) return false;
    data.learntVocabs.push(n);
    return writeData(data);
  }

  /* Bulk add in one read/write. addWord() re-reads and re-writes the whole key
     per call, which is O(n^2) parses when adding a filtered list of hundreds.
     Returns the words actually added. */
  function addWords(words) {
    const data = readData();
    const seen = new Set(data.learntVocabs);
    const added = [];
    for (const word of words || []) {
      const n = normalize(word);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      data.learntVocabs.push(n);
      added.push(n);
    }
    if (!added.length) return [];
    return writeData(data) ? added : [];
  }

  function removeWord(word) {
    const data = readData();
    const n = normalize(word);
    const i = data.learntVocabs.indexOf(n);
    if (i === -1) return false;
    data.learntVocabs.splice(i, 1);
    return writeData(data);
  }

  function hasWord(word) {
    return readData().learntVocabs.includes(normalize(word));
  }

  function learnt() {
    return readData().learntVocabs;
  }

  function learntCount() {
    return learnt().length;
  }

  /* ── study sets ───────────────────────────────────── */

  /* A study set is a named snapshot of words — saving one never changes the
     wordbank, and loading one adds back to it. Kept in the bank document so
     vocab-sync mirrors it with everything else. */
  function studySets() {
    return readData().studySets;
  }

  function saveStudySet(name, words) {
    const label = String(name == null ? '' : name).trim();
    const list = [...new Set((words || []).map(normalize).filter(Boolean))];
    if (!label || !list.length) return null;
    const data = readData();
    const set = {
      id: 'set_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: label,
      words: list,
      createdAt: new Date().toISOString(),
    };
    data.studySets.push(set);
    return writeData(data) ? set : null;
  }

  /* Adding the same word twice is a no-op, so the kebab menu can stay a plain
     toggle-free "Add to set". */
  function addWordToSet(id, word) {
    const n = normalize(word);
    const data = readData();
    const set = data.studySets.find(s => s.id === id);
    if (!set || !n) return false;
    if (!Array.isArray(set.words)) set.words = [];
    if (set.words.includes(n)) return false;
    set.words.push(n);
    return writeData(data);
  }

  function deleteStudySet(id) {
    const data = readData();
    const i = data.studySets.findIndex(s => s.id === id);
    if (i === -1) return false;
    data.studySets.splice(i, 1);
    return writeData(data);
  }

  /* ── user sentences (Form-a-Sentence practice) ────── */

  function saveSentence(word, sentence) {
    const data = readData();
    const n = normalize(word);
    if (!n) return false;
    data.userSentences[n] = String(sentence == null ? '' : sentence);
    return writeData(data);
  }

  function getSentence(word) {
    return readData().userSentences[normalize(word)] || '';
  }

  /* ── mastery math (verbatim from SETUP.md §4) ─────── */

  function deriveMastery(p) {
    const acc = p.totalAttempts ? p.correctAttempts / p.totalAttempts : 0;
    if (acc >= 0.9 && p.consecutiveCorrect >= 3) return 'mastered';
    if (acc >= 0.7 && p.consecutiveCorrect >= 2) return 'proficient';
    if (acc >= 0.5) return 'learning';
    return 'struggling';
  }

  function recomputeRollups(perf) {
    const strong = [];
    const weak = [];
    for (const word of Object.keys(perf.wordPerformance)) {
      const p = perf.wordPerformance[word];
      p.masteryLevel = deriveMastery(p);
      if (p.masteryLevel === 'proficient' || p.masteryLevel === 'mastered') strong.push(word);
      else if (p.masteryLevel === 'struggling') weak.push(word);
    }
    const attempts = perf.attempts;
    const total = attempts.length;
    perf.overallAccuracy = total ? attempts.filter(a => a.isCorrect).length / total : 0;
    perf.strongWords = strong;
    perf.weakWords = weak;
  }

  /* ── submissions ──────────────────────────────────── */

  function wordPerformance(word) {
    return readPerf().wordPerformance[normalize(word)] || null;
  }

  /**
   * Record one answered attempt. Revisits are guarded upstream (attemptedWords
   * Set per session), but here we also de-dupe same-word-same-timestamp bursts
   * as a safety net.
   */
  function recordAttempt({ word, questionType, isCorrect, userAnswer, correctAnswer, timeSpent }) {
    const n = normalize(word);
    if (!n) return;
    const perf = readPerf();
    const p = perf.wordPerformance[n] || Object.assign({}, MASTERY_DEFAULT);

    p.totalAttempts += 1;
    if (isCorrect) {
      p.correctAttempts += 1;
      p.consecutiveCorrect += 1;
      p.consecutiveIncorrect = 0;
    } else {
      p.incorrectAttempts += 1;
      p.consecutiveIncorrect += 1;
      p.consecutiveCorrect = 0;
    }
    p.averageTimeSpent = Math.round(
      (p.averageTimeSpent * (p.totalAttempts - 1) + (timeSpent || 0)) / p.totalAttempts
    );
    if (!isCorrect && !p.strugglingAreas.includes(questionType)) {
      p.strugglingAreas.push(questionType);
    }
    p.masteryLevel = deriveMastery(p);
    perf.wordPerformance[n] = p;

    const attempt = {
      word: n,
      questionType,
      isCorrect: !!isCorrect,
      userAnswer,
      correctAnswer,
      timeSpent: timeSpent || 0,
      timestamp: new Date().toISOString(),
    };
    perf.attempts.push(attempt);

    recomputeRollups(perf);
    writePerf(perf);
    if (remote) {
      // The whole perf object cannot be mirrored as one doc because attempts[]
      // grows without bound. Word aggregate and attempt log go up separately.
      remote.pushWord(n, p);
      remote.pushAttempt(attempt);
    }
    return p;
  }

  /* store the number of words with data (progress gauge) */
  function totalAttempts() {
    return readPerf().attempts.length;
  }

  function performance() {
    return readPerf();
  }

  function data() {
    return readData();
  }

  /* ── sync plumbing (vocab-sync.js) ────────────────── */

  function setRemote(r) {
    remote = r;
  }

  /* Replace the local copy with the reconciled one. Does not mirror back.
     attempts[] stays a local log; the merged per-word aggregates are the
     authoritative part, so rollups are recomputed from them. */
  function hydrate(next) {
    if (next && next.data) writeData(next.data, false);
    if (next && next.perf) {
      recomputeRollups(next.perf);
      writePerf(next.perf);
    }
  }

  window.VocabStore = {
    addWord,
    addWords,
    removeWord,
    hasWord,
    studySets,
    saveStudySet,
    addWordToSet,
    deleteStudySet,
    saveSentence,
    getSentence,
    learnt,
    learntCount,
    recordAttempt,
    wordPerformance,
    performance,
    totalAttempts,
    deriveMastery,
    normalize,
    // sync
    data,
    setRemote,
    hydrate,
  };
})();