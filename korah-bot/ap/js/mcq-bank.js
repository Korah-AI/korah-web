export const COURSES = [
  { slug: 'ap-calculus-ab', name: 'AP Calculus AB', icon: 'calculate', tone: 'blue', description: 'Limits, derivatives, and integrals. Practice with or without a calculator.', units: ['Limits and Continuity', 'Differentiation: Definition and Fundamental Properties', 'Differentiation: Composite, Implicit, and Inverse Functions', 'Contextual Applications of Differentiation', 'Analytical Applications of Differentiation', 'Integration and Accumulation of Change', 'Differential Equations', 'Applications of Integration'] },
  { slug: 'ap-us-history', name: 'AP U.S. History', icon: 'history_edu', tone: 'pink', description: 'Read historical evidence, make connections, and reason across nine periods.', units: ['1491–1607', '1607–1754', '1754–1800', '1800–1848', '1844–1877', '1865–1898', '1890–1945', '1945–1980', '1980–Present'] },
];

export function validateBank(bank, slug) {
  const course = COURSES.find(c => c.slug === slug);
  if (!course || bank.course !== slug || bank.schemaVersion !== 1 || !Array.isArray(bank.questions) || !bank.questions.length) throw new Error('Invalid course bank');
  const ids = new Set();
  bank.questions.forEach(q => {
    if (q.course !== slug || !q.id?.startsWith(slug + '-mcq-') || ids.has(q.id) || !Number.isInteger(q.unit) || q.unit < 1 || q.unit > course.units.length || !q.stem || !q.explanation || !Array.isArray(q.choices) || q.choices.length !== 4 || new Set(q.choices).size !== 4 || q.choices.some(c => typeof c !== 'string' || !c.trim()) || !Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3 || !q.sourceIds?.length || q.sourceIds.some(id => !bank.sources?.[id]) || (slug === 'ap-calculus-ab' ? !['calculator', 'non-calculator'].includes(q.calculator) : q.calculator !== null)) throw new Error('Invalid question: ' + q.id);
    ids.add(q.id);
  });
  return bank;
}

export async function loadBank(slug, fetcher = fetch) {
  if (!COURSES.some(c => c.slug === slug)) throw new Error('Unknown course');
  const response = await fetcher(`./data/${slug}/mcqs.json`);
  if (!response.ok) throw new Error('Question bank unavailable');
  return validateBank(await response.json(), slug);
}

export function filterQuestions(bank, { unit = '', calculator = '' } = {}) {
  return bank.questions.filter(q => q.course === bank.course && (!unit || q.unit === Number(unit)) && (bank.course !== 'ap-calculus-ab' || !calculator || q.calculator === calculator));
}
