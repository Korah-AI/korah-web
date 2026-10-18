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
      frqUnit: 'FRQ',
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
      frqUnit: 'SAQ',
    },
    {
      slug: 'ap-physics-1',
      name: 'AP Physics 1',
      shortName: 'Physics 1',
      description: 'Algebra-based free response: derivations, representations, lab design, and paragraph reasoning.',
      tagline: 'Original practice modeled on the 2025 and 2026 released FRQs, scored with the same point structure.',
      format: 'math',
      icon: 'speed',
      frqLabel: 'FRQs',
      frqUnit: 'FRQ',
    },
    {
      slug: 'ap-physics-2',
      name: 'AP Physics 2',
      shortName: 'Physics 2',
      description: 'Algebra-based free response on thermodynamics, electricity and magnetism, optics, and modern physics.',
      tagline: 'Original practice modeled on the 2025 and 2026 released FRQs, scored with the same point structure.',
      format: 'math',
      icon: 'electric_bolt',
      frqLabel: 'FRQs',
      frqUnit: 'FRQ',
    },
    {
      slug: 'ap-physics-c-mechanics',
      name: 'AP Physics C: Mechanics',
      shortName: 'Physics C: Mech',
      description: 'Calculus-based free response on mechanics: derivations, representations, and lab analysis.',
      tagline: 'Original practice modeled on the 2025 and 2026 released FRQs, scored with the same point structure.',
      format: 'math',
      icon: 'bolt',
      frqLabel: 'FRQs',
      frqUnit: 'FRQ',
    },
    {
      slug: 'ap-biology',
      name: 'AP Biology',
      shortName: 'Biology',
      description: 'Long and short free response on experiments, models, and data, answered in prose.',
      tagline: 'Original practice modeled on the 2025 and 2026 released FRQs, scored with the same point structure.',
      format: 'prose',
      icon: 'biotech',
      frqLabel: 'FRQs',
      frqUnit: 'FRQ',
    },
    {
      slug: 'ap-precalculus',
      name: 'AP Precalculus',
      shortName: 'Precalc',
      description: 'Free response on function concepts, modeling, periodic functions, and symbolic manipulation.',
      tagline: 'Original practice modeled on the 2025 and 2026 released FRQs, scored with the same point structure.',
      format: 'math',
      icon: 'functions',
      frqLabel: 'FRQs',
      frqUnit: 'FRQ',
    },
    {
      slug: 'ap-chemistry',
      name: 'AP Chemistry',
      shortName: 'Chemistry',
      description: 'Long and short free response with calculations, explanations, and representations.',
      tagline: 'Original practice modeled on the 2025 and 2026 released FRQs, scored with the same point structure.',
      format: 'math',
      icon: 'science',
      frqLabel: 'FRQs',
      frqUnit: 'FRQ',
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
  const questionCache = new Map(); // courseSlug -> Promise<QuestionBank>

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

  // Load the original-practice MCQ bank for a course. The complete object is
  // returned so callers can also show alignment and provenance information.
  async function loadQuestionBank(courseSlug) {
    if (!getCourse(courseSlug)) return null;
    if (questionCache.has(courseSlug)) return questionCache.get(courseSlug);

    const pending = (async () => {
      const res = await fetch(`./data/${courseSlug}/questions.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`loadQuestionBank: HTTP ${res.status}`);
      const bank = await res.json();
      if (!bank || !Array.isArray(bank.questions)) throw new Error('loadQuestionBank: invalid question bank');
      return bank;
    })();

    questionCache.set(courseSlug, pending);
    return pending;
  }

  async function loadQuestions(courseSlug) {
    try {
      const bank = await loadQuestionBank(courseSlug);
      return bank ? bank.questions.slice() : [];
    } catch (error) {
      console.warn('[KorahAP] questions.json unavailable for', courseSlug, error);
      return [];
    }
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
    if (courseSlug === 'ap-physics-1' || courseSlug === 'ap-physics-2' || courseSlug === 'ap-physics-c-mechanics') {
      return [
        { key: 'representation', label: 'Representations' },
        { key: 'derivation', label: 'Derivation' },
        { key: 'calculation', label: 'Calculation' },
        { key: 'justification', label: 'Justification' },
        { key: 'experimental-design', label: 'Experimental design' },
        { key: 'data-analysis', label: 'Data analysis' },
      ];
    }
    if (courseSlug === 'ap-biology') {
      return [
        { key: 'concept', label: 'Concept explanation' },
        { key: 'experimental-design', label: 'Experimental design' },
        { key: 'data-analysis', label: 'Data analysis' },
        { key: 'graphing', label: 'Graphing' },
        { key: 'calculation', label: 'Calculation' },
        { key: 'argumentation', label: 'Argumentation' },
      ];
    }
    if (courseSlug === 'ap-precalculus') {
      return [
        { key: 'setup', label: 'Setup' },
        { key: 'computation', label: 'Computation' },
        { key: 'notation', label: 'Notation' },
        { key: 'reasoning', label: 'Reasoning' },
        { key: 'transformations', label: 'Transformations' },
        { key: 'manipulation', label: 'Symbolic manipulation' },
      ];
    }
    if (courseSlug === 'ap-chemistry') {
      return [
        { key: 'calculation', label: 'Calculation' },
        { key: 'explanation', label: 'Explanation' },
        { key: 'representation', label: 'Representations' },
        { key: 'equations', label: 'Equations' },
        { key: 'justification', label: 'Justification' },
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

  /**
   * Human label for an FRQ's part + year, e.g. "2023 FRQ 1" / "2023 SAQ 2".
   * Original practice modeled on a released question reads "Modeled on 2025 FRQ 1".
   */
  function frqLabel(frq) {
    const unit = (getCourse(frq && frq.course) || {}).frqUnit || 'FRQ';
    const q = frq.questionNumber != null ? ` ${unit} ${frq.questionNumber}` : '';
    return `${frq.modeledOn ? 'Modeled on ' : ''}${frq.year}${q}`;
  }

  global.KorahAP = {
    getCourses,
    getCourse,
    loadFrqs,
    getFrq,
    loadQuestionBank,
    loadQuestions,
    categoriesFor,
    categoryLabel,
    frqLabel,
  };
})(typeof window !== 'undefined' ? window : this);
