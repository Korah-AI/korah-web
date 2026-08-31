/* ═══════════════════════════════════════════════════
   VOCAB STORE — localStorage CRUD + mastery math (window.VocabStore)
   Keys mirror SETUP.md §3:
     korah_vocab_data        → { learntVocabs: string[], userSentences: {} }
     korah_vocab_performance → PracticePerformanceData
   Swap these two read/write helpers to migrate to KorahDB later.
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

  function normalize(word) {
    return String(word == null ? '' : word).trim().toLowerCase();
  }

  function defaultData() {
    return { learntVocabs: [], userSentences: {} };
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
      };
    } catch (e) {
      localStorage.removeItem(DATA_KEY);
      return defaultData();
    }
  }

  function writeData(data) {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
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
      // Normalize any stored word keys to lowercase.
      for (const key of Object.keys(perf.wordPerformance)) {
        const n = normalize(key);
        if (n !== key) {
          perf.wordPerformance[n] = perf.wordPerformance[key];
          delete perf.wordPerformance[key];
        }
      }
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

    perf.attempts.push({
      word: n,
      questionType,
      isCorrect: !!isCorrect,
      userAnswer,
      correctAnswer,
      timeSpent: timeSpent || 0,
      timestamp: new Date().toISOString(),
    });

    recomputeRollups(perf);
    writePerf(perf);
    return p;
  }

  /* store the number of words with data (progress gauge) */
  function totalAttempts() {
    return readPerf().attempts.length;
  }

  function performance() {
    return readPerf();
  }

  window.VocabStore = {
    addWord,
    removeWord,
    hasWord,
    learnt,
    learntCount,
    recordAttempt,
    wordPerformance,
    performance,
    totalAttempts,
    deriveMastery,
    normalize,
  };
})();