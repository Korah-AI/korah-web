// Shared data layer for AP MCQ practice: course catalog, bank loading and
// validation, filtering, and per-browser progress. Used by the bank page
// (mcq.js), the player (mcq-player.js), and scripts/ap-mcq.test.cjs.

export const COURSES = [
  { slug: 'ap-calculus-ab', name: 'AP Calculus AB', tone: 'math', hasCalculator: true, units: ['Limits and Continuity', 'Differentiation: Definition and Fundamental Properties', 'Differentiation: Composite, Implicit, and Inverse Functions', 'Contextual Applications of Differentiation', 'Analytical Applications of Differentiation', 'Integration and Accumulation of Change', 'Differential Equations', 'Applications of Integration'] },
  { slug: 'ap-us-history', name: 'AP U.S. History', tone: 'english', hasCalculator: false, units: ['Period 1: 1491–1607', 'Period 2: 1607–1754', 'Period 3: 1754–1800', 'Period 4: 1800–1848', 'Period 5: 1844–1877', 'Period 6: 1865–1898', 'Period 7: 1890–1945', 'Period 8: 1945–1980', 'Period 9: 1980–Present'] },
];

export const getCourse = slug => COURSES.find(c => c.slug === slug) || null;

const isText = v => typeof v === 'string' && v.trim().length > 0;
// A figure is either inline SVG drawn by scripts/ap-mcq-build or a table of text cells.
function validFigure(f) {
  if (!f || !isText(f.alt)) return false;
  if (f.svg) return /^<svg[\s>]/.test(f.svg) && !/<script|\son\w+=|javascript:/i.test(f.svg);
  return Array.isArray(f.table?.headers) && Array.isArray(f.table?.rows) && f.table.rows.every(r => Array.isArray(r) && r.length === f.table.headers.length && r.every(isText));
}

export function validateBank(bank, slug) {
  const course = getCourse(slug);
  if (!course || bank.course !== slug || bank.schemaVersion !== 2 || !Array.isArray(bank.questions) || !bank.questions.length) throw new Error('Invalid course bank');
  const ids = new Set();
  bank.questions.forEach(q => {
    const ok = q.course === slug && q.id?.startsWith(slug + '-mcq-') && !ids.has(q.id)
      && Number.isInteger(q.unit) && q.unit >= 1 && q.unit <= course.units.length
      && isText(q.stem) && isText(q.explanation) && isText(q.skill)
      && Array.isArray(q.choices) && q.choices.length === 4 && new Set(q.choices).size === 4 && q.choices.every(isText)
      && Number.isInteger(q.answer) && q.answer >= 0 && q.answer <= 3
      && q.sourceIds?.length && q.sourceIds.every(id => bank.sources?.[id])
      && (course.hasCalculator ? ['calculator', 'non-calculator'].includes(q.calculator) : q.calculator === null)
      && (q.figure === undefined || validFigure(q.figure))
      && (q.stimulus === undefined || (isText(q.stimulus.title) && isText(q.stimulus.attribution) && (isText(q.stimulus.text) || validFigure(q.stimulus.figure))));
    if (!ok) throw new Error('Invalid question: ' + q.id);
    ids.add(q.id);
  });
  return bank;
}

export async function loadBank(slug, fetcher = fetch) {
  if (!getCourse(slug)) throw new Error('Unknown course');
  const response = await fetcher(`./data/${slug}/mcqs.json`);
  if (!response.ok) throw new Error('Question bank unavailable');
  return validateBank(await response.json(), slug);
}

// filters: { units: number[], calculator: '' | 'calculator' | 'non-calculator',
//            completed: 'all' | 'completed' | 'incomplete', result: 'all' | 'correct' | 'incorrect' }
// progress: { [questionId]: chosenIndex } for answers the student has checked.
export function filterQuestions(bank, filters = {}, progress = {}) {
  const { units = [], calculator = '', completed = 'all', result = 'all' } = filters;
  const hasCalculator = !!getCourse(bank.course)?.hasCalculator;
  return bank.questions.filter(q => {
    if (q.course !== bank.course) return false;
    if (units.length && !units.includes(q.unit)) return false;
    if (hasCalculator && calculator && q.calculator !== calculator) return false;
    const done = Number.isInteger(progress[q.id]);
    if (completed === 'completed' && !done) return false;
    if (completed === 'incomplete' && done) return false;
    if (result === 'correct' && !(done && progress[q.id] === q.answer)) return false;
    if (result === 'incorrect' && !(done && progress[q.id] !== q.answer)) return false;
    return true;
  });
}

// Attempts and correct answers per unit, for the Progress and Accuracy columns.
export function unitStats(bank, questions, progress = {}) {
  const stats = getCourse(bank.course).units.map(() => ({ total: 0, attempts: 0, correct: 0 }));
  for (const q of questions) {
    const s = stats[q.unit - 1];
    s.total++;
    if (Number.isInteger(progress[q.id])) { s.attempts++; if (progress[q.id] === q.answer) s.correct++; }
  }
  return stats;
}

// ── Progress: checked answers, kept in this browser only ──
const progressKey = slug => `korah_ap_mcq_progress_${slug}`;
export function loadProgress(slug, storage = globalThis.localStorage) {
  try { const data = JSON.parse(storage?.getItem(progressKey(slug)) || '{}'); return data && typeof data === 'object' ? data : {}; }
  catch { return {}; }
}
export function saveProgress(slug, progress, storage = globalThis.localStorage) {
  try { storage?.setItem(progressKey(slug), JSON.stringify(progress)); } catch { /* storage full or blocked: practice still works */ }
}

// ── Session URL shared by the bank page and the player ──
export function playerUrl({ course, units = [], calculator = '', completed = 'all', result = 'all', limit = null, random = false }) {
  const p = new URLSearchParams({ course });
  if (units.length) p.set('units', [...units].sort((a, b) => a - b).join(','));
  if (calculator) p.set('calculator', calculator);
  if (completed !== 'all') p.set('completed', completed);
  if (result !== 'all') p.set('result', result);
  if (limit) p.set('limit', String(limit));
  if (random) p.set('random', '1');
  return `./mcq-player.html?${p}`;
}
export function parseSession(search) {
  const p = new URLSearchParams(search), course = getCourse(p.get('course'));
  if (!course) return null;
  const pick = (key, allowed, fallback) => allowed.includes(p.get(key)) ? p.get(key) : fallback;
  const limit = Number(p.get('limit'));
  return {
    course: course.slug,
    units: (p.get('units') || '').split(',').map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= course.units.length),
    calculator: course.hasCalculator ? pick('calculator', ['calculator', 'non-calculator'], '') : '',
    completed: pick('completed', ['completed', 'incomplete'], 'all'),
    result: pick('result', ['correct', 'incorrect'], 'all'),
    limit: Number.isInteger(limit) && limit > 0 ? limit : null,
    random: p.get('random') === '1',
  };
}
export function buildSession(bank, session, progress = {}, rng = Math.random) {
  let list = filterQuestions(bank, session, progress);
  if (session.random) { list = [...list]; for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; } }
  return session.limit ? list.slice(0, session.limit) : list;
}
