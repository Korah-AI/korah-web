/* ═══════════════════════════════════════════════════
   VOCAB QUIZ — shared quiz engine + Alpine component (window.VocabQuiz)
   Powers Definition Quiz + Vocab Quiz from vocab-store's learnt words.
   Pure client-side; every submission flows through VocabStore.
   ═══════════════════════════════════════════════════ */
(function () {
  const QUESTIONS_PER_SESSION = 10;
  const MASTERY_ORDER = ['not-practiced', 'struggling', 'learning', 'proficient', 'mastered'];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* Resolve a word list against the DB; skip words missing from the file */
  function resolveWords(words) {
    const pool = [];
    const seen = new Set();
    for (const raw of words) {
      const word = VocabData.normalize(raw);
      if (seen.has(word)) continue;
      const rec = VocabData.byWord.get(word);
      if (!rec) continue;
      seen.add(word);
      pool.push(rec);
    }
    return pool;
  }

  function poolForSession() {
    return resolveWords(VocabStore.learnt());
  }

  /* Adaptive ordering: bucket by mastery, notPracticed → mastered, shuffle within */
  function adaptiveOrder(pool) {
    const buckets = {};
    for (const level of MASTERY_ORDER) buckets[level] = [];
    for (const rec of pool) {
      const perf = VocabStore.wordPerformance(rec.word);
      const level = perf ? (perf.masteryLevel || 'not-practiced') : 'not-practiced';
      (buckets[level] || buckets['not-practiced']).push(rec);
    }
    const ordered = [];
    for (const level of MASTERY_ORDER) ordered.push(...shuffle(buckets[level] || []));
    return ordered.slice(0, QUESTIONS_PER_SESSION);
  }

  /* 3 distractors, same POS preferred, definitions never identical */
  function pickOptions(rec, pool, mode) {
    const exclude = pool.map(r => r.word).filter(w => w !== rec.word);
    const excluded = new Set(exclude);
    let picks = VocabData.samplesOf(rec.part_of_speech, exclude, 3)
      .filter(s => s.definition !== rec.definition);
    if (picks.length < 3) {
      // Same-POS candidates ran short. Draw the remainder at random from the
      // whole DB. Taking them in array order served the same three
      // alphabetically-first words every time this branch was hit.
      const taken = new Set(picks.map(s => s.word));
      const candidates = VocabData.all.filter(s =>
        s.word !== rec.word &&
        !excluded.has(s.word) &&
        !taken.has(s.word) &&
        s.definition !== rec.definition
      );
      picks = picks.concat(shuffle(candidates)).slice(0, 3);
    }

    const correctText = mode === 'definition-quiz' ? rec.definition : rec.word;
    const correctKey = mode === 'definition-quiz' ? rec.word : rec.definition;

    const options = picks.map(p => ({
      text: mode === 'definition-quiz' ? p.definition : p.word,
      pos: p.part_of_speech,
      isCorrect: false,
      key: mode === 'definition-quiz' ? p.word : p.definition,
    }));
    options.push({ text: correctText, pos: rec.part_of_speech, isCorrect: true, key: correctKey });
    return shuffle(options);
  }

  /* One question object; `pool` supplies the distractor exclusion set */
  function makeQuestion(rec, pool, mode) {
    const options = pickOptions(rec, pool, mode);
    return {
      word: rec.word,
      pos: rec.part_of_speech,
      definition: rec.definition,
      example: rec.example || '',
      difficulty: rec.difficulty,
      options,
      selectedIndex: null,
      correctIndex: options.findIndex(o => o.isCorrect),
      answered: false,
    };
  }

  function buildSession(mode) {
    const pool = poolForSession();
    return adaptiveOrder(pool).map(rec => makeQuestion(rec, pool, mode));
  }

  function buildFromIncorrect(incorrectWords, mode) {
    const pool = resolveWords(incorrectWords);
    return pool.map(rec => makeQuestion(rec, pool, mode));
  }

  window.VocabQuiz = {
    QUESTIONS_PER_SESSION,
    buildSession,
    buildFromIncorrect,
    adaptOrder: adaptiveOrder,
  };
})();