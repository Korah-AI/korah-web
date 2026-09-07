/**
 * AP FRQ bank — course + FRQ data loader.
 *
 * Courses are defined here as static config. FRQ content is plain JSON under
 * ../data/<course-slug>/frqs.json, matched to the schema in
 * docs/ap-frq-spec.md. Every FRQ object carries a stable `id` (e.g.
 * "calc-ab-2023-q1") because Firestore attempt docs and the progress weakness
 * view reference rubric point ids by that FRQ id.
 *
 * Data loading is defensive: the picker must render even if a fetch fails, so
 * loadFrqs() falls back to a tiny built-in sample FRQ instead of throwing.
 */

(function (global) {
  'use strict';

  const COURSES = [
    {
      slug: 'ap-calculus-ab',
      name: 'AP Calculus AB',
      shortName: 'Calc AB',
      description: 'Free response questions on limits, derivatives, and definite integrals.',
      tagline: 'Short, symbolic questions with unambiguous rubric points. Worst case for handwriting, best case for grading.',
      format: 'math',
      icon: 'calculate',
      frqLabel: 'FRQs',
    },
    {
      slug: 'ap-us-history',
      name: 'AP US History',
      shortName: 'US History',
      description: 'Short answer questions (SAQ) on American history, answered in prose.',
      tagline: 'Prose responses with fuzzier rubrics. No handwriting ambiguity when typed.',
      format: 'prose',
      icon: 'history_edu',
      frqLabel: 'SAQs',
    },
  ];

  // Tiny insurance sample so a page never renders empty even if the JSON fetch
  // fails (guest gate, interrupted request, odd server). Mirrors the schema.
  const FALLBACK_FRQ = {
    id: 'sample-fallback',
    course: 'ap-calculus-ab',
    year: new Date().getFullYear(),
    questionNumber: 1,
    title: 'Sample Fallback FRQ',
    topic: 'Data loaded?',
    timeAllottedMin: 15,
    calculatorAllowed: true,
    sample: true,
    prompt: 'Sample FRQ content could not be loaded. This is a placeholder route.',
    parts: [],
    sampleResponse: '',
  };

  const cache = new Map(); // courseSlug -> Promise<FRQ[]>

  function getCourses() {
    return COURSES.slice();
  }

  function getCourse(slug) {
    return COURSES.find((c) => c.slug === slug) || null;
  }

  function saneNumber(n, fallback) {
    const v = Number(n);
    return Number.isFinite(v) ? v : fallback;
  }

  /**
   * Load all FRQs for a course. Resolves to an array (possibly [] on hard
   * failure, with a single fallback row so the picker still has a row to show).
   */
  async function loadFrqs(courseSlug) {
    if (!getCourse(courseSlug)) return [];
    if (cache.has(courseSlug)) return cache.get(courseSlug);

    const p = (async () => {
      try {
        const res = await fetch(`./data/${courseSlug}/frqs.json`);
        if (!res.ok) throw new Error(`loadFrqs: HTTP ${res.status}`);
        const arr = await res.json();
        if (!Array.isArray(arr)) throw new Error('loadFrqs: not an array');
        return arr;
      } catch (e) {
        console.warn('[KorahAP] frqs.json unavailable for', courseSlug, e);
        return [Object.assign({}, FALLBACK_FRQ, { course: courseSlug })];
      }
    })();

    cache.set(courseSlug, p);
    return p;
  }

  async function getFrq(courseSlug, frqId) {
    const list = await loadFrqs(courseSlug);
    return list.find((f) => f.id === frqId) || null;
  }

  /** Stable list of rubric categories for a course, for the weakness view. */
  function categoriesFor(courseSlug) {
    if (courseSlug === 'ap-calculus-ab') {
      return [
        { key: 'integral-setup', label: 'Integral setup' },
        { key: 'evaluation', label: 'Evaluation' },
        { key: 'justification', label: 'Justification' },
        { key: 'interpretation', label: 'Interpretation' },
        { key: 'computation', label: 'Computation' },
        { key: 'notation', label: 'Notation' },
        { key: 'units', label: 'Units' },
      ];
    }
    return [
      { key: 'claim', label: 'Clear claim' },
      { key: 'evidence', label: 'Specific evidence' },
      { key: 'analysis', label: 'Analysis' },
      { key: 'contextualization', label: 'Contextualization' },
      { key: 'completeness', label: 'Completeness' },
    ];
  }

  /** Human label for a course's category key (for ledger chips). */
  function categoryLabel(courseSlug, key) {
    const found = categoriesFor(courseSlug).find((c) => c.key === key);
    return found ? found.label : key;
  }

  /** Human label for an FRQ's part + year, e.g. "2023 FRQ 1". */
  function frqLabel(frq) {
    const q = frq.questionNumber != null ? ` FRQ ${frq.questionNumber}` : '';
    return `${frq.year}${q}`;
  }

  global.KorahAP = {
    getCourses,
    getCourse,
    loadFrqs,
    getFrq,
    categoriesFor,
    categoryLabel,
    frqLabel,
  };
})(typeof window !== 'undefined' ? window : this);