// Feeds the SAT player (sat/js/sat-player.js) from an AP course's questions.json.
// The player asks /api/sat/q for its question list; this answers that call locally
// with the AP questions that match the hub's selection, mapped to the SAT shape.
// URL params: course, units, subtopics, difficulties (easy,medium,hard), limit,
// or mode=saved|errors for the user's saved and missed questions.
(function () {
  'use strict';

  const params = new URLSearchParams(window.location.search);
  const course = params.get('course') || 'ap-calculus-ab';
  const mode = params.get('mode');
  const list = (key) => (params.get(key) || '').split(',').map((s) => s.trim()).filter(Boolean);
  const units = list('units');
  const subtopics = list('subtopics');
  const difficulties = list('difficulties').map((d) => d.toLowerCase());

  const nativeFetch = window.fetch.bind(window);

  // SAT stems arrive as MathML, so the player never runs KaTeX. AP questions
  // write math as \( ... \), which is converted to MathML here to match.
  function texToMathml(text) {
    if (!text || !window.katex) return text || '';
    const render = (tex, displayMode) => window.katex.renderToString(tex, { output: 'mathml', displayMode, throwOnError: false });
    return String(text)
      .replace(/\\\[([\s\S]+?)\\\]/g, (_, tex) => render(tex, true))
      .replace(/\\\(([\s\S]+?)\\\)/g, (_, tex) => render(tex, false));
  }

  function toPlayerQuestion(q) {
    return {
      id: q.id,
      detailKey: q.id,
      loaded: true,
      section: 'english', // not 'math', so the player does not open Desmos or the SAT reference sheet
      domain: q.unitLabel,
      skillCd: q.subtopic || q.unit, // the player passes this through to the analytics store
      difficulty: q.difficulty,
      type: 'mc',
      paragraph: texToMathml(q.stimulus),
      stem: texToMathml(q.stem),
      options: q.choices.map((c) => ({ key: c.key, text: texToMathml(c.text) })),
      correctAnswer: q.answer,
      explanation: texToMathml(q.explanation),
    };
  }

  // The analytics store is created after sign-in; guests never get one.
  function whenAnalytics() {
    return new Promise((resolve) => {
      if (window.KorahSATAnalytics) return resolve(window.KorahSATAnalytics);
      const finish = () => resolve(window.KorahSATAnalytics || null);
      window.addEventListener('korahSATAnalyticsReady', finish, { once: true });
      setTimeout(finish, 4000);
    });
  }

  // ?mode=saved or ?mode=errors: the user's bookmarked or missed questions, across all courses.
  async function loadSavedOrErrors() {
    window.KORAH_PLAYER_TITLE = mode === 'saved' ? 'Saved Questions' : 'Recent Errors';
    const analytics = await whenAnalytics();
    if (!analytics) return [];
    const ids = mode === 'saved'
      ? (await analytics.getBookmarks()).map((b) => b.questionId)
      : await analytics.getErrorIds();
    const banks = await Promise.all(window.KorahAP.getCourses().map((c) => window.KorahAP.loadQuestionBank(c.slug).catch(() => null)));
    const byId = new Map();
    banks.forEach((bank) => bank && bank.questions.forEach((q) => byId.set(q.id, q)));
    return ids.map((id) => byId.get(id)).filter(Boolean).map(toPlayerQuestion);
  }

  async function loadQuestions(limit) {
    if (mode === 'saved' || mode === 'errors') return loadSavedOrErrors();
    const res = await nativeFetch(`./data/${encodeURIComponent(course)}/questions.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`questions.json: HTTP ${res.status}`);
    const bank = await res.json();
    window.KORAH_PLAYER_TITLE = window.KorahAP?.getCourse(course)?.name || bank.title || course;
    window.KorahAPPlayerCourse = window.KORAH_PLAYER_TITLE;
    let out = bank.questions.filter((q) => q.status !== 'retired'
      && (!(units.length || subtopics.length) || units.includes(q.unit) || subtopics.includes(q.subtopic))
      && (!difficulties.length || difficulties.includes(q.difficulty)));
    if (limit) out = out.slice(0, limit);
    return out.map(toPlayerQuestion);
  }

  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : input.url;
    if (!url.startsWith('/api/sat/q?')) return nativeFetch(input, init);
    const limit = Number(new URLSearchParams(url.split('?')[1]).get('limit')) || 0;
    return loadQuestions(limit).then((questions) => new Response(
      JSON.stringify({ questions }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    ));
  };
})();
