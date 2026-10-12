import { COURSES, loadBank, filterQuestions } from './mcq-bank.js';

const root = document.getElementById('mcq-root');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const params = new URLSearchParams(location.search);
const slug = params.get('course');
const course = COURSES.find(c => c.slug === slug);
const letters = ['A', 'B', 'C', 'D'];
const state = { bank: null, filtered: [], page: 0, active: null, answers: new Map() };
const pageSize = 12;

function math() {
  if (window.renderMathInElement) window.renderMathInElement(root, { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }], throwOnError: false });
}
function sourceLinks(q) {
  return q.sourceIds.map(id => {
    const s = state.bank.sources[id];
    return /^https:\/\//.test(s.url) ? `<a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a>` : '';
  }).join(' · ');
}
function renderPicker() {
  root.innerHTML = `<p class="ap-page-desc">Choose your class to open its question bank. Check each answer and learn from the explanation.</p><div class="ap-course-grid">${COURSES.map(c => `<a class="ap-course-card tone-${c.tone}" href="./mcqs.html?course=${c.slug}"><div class="ap-course-card-top"><div class="ap-course-icon"><span class="material-icons-round">${c.icon}</span></div><span class="ap-badge">${c.units.length} units</span></div><div><h2 class="ap-course-name">${c.name}</h2><p class="ap-course-tagline">${c.description}</p></div><div class="ap-course-stats" id="count-${c.slug}">Loading question count…</div><span class="ap-course-cta">Open MCQ bank <span class="material-icons-round">arrow_forward</span></span></a>`).join('')}</div><p class="mcq-note">Independent AP-style practice written for Korah. History questions are built on public-domain primary sources; none of these are released College Board exam questions.</p>`;
  COURSES.forEach(async c => {
    const count = document.getElementById(`count-${c.slug}`);
    try { const bank = await loadBank(c.slug); count.textContent = `${bank.questions.length} questions · Answers & explanations`; }
    catch { count.textContent = 'Bank unavailable — open to retry'; }
  });
}
function tags(q) {
  return `<span class="ap-badge">Unit ${q.unit}</span>${q.calculator ? `<span class="ap-badge">${q.calculator === 'calculator' ? 'Calculator' : 'Non-calculator'}</span>` : ''}<span class="mcq-skill">${escape(q.skill)}</span>`;
}
function renderList() {
  const list = document.getElementById('mcq-list');
  const pages = Math.ceil(state.filtered.length / pageSize);
  const answered = state.filtered.filter(q => state.answers.has(q.id));
  const correct = answered.filter(q => state.answers.get(q.id) === q.answer).length;
  document.getElementById('mcq-count').textContent = `${state.filtered.length} questions · ${answered.length} checked · ${correct} correct`;
  if (!state.filtered.length) { list.innerHTML = '<div class="mcq-empty"><h3>No matching questions</h3><p>Try another unit or calculator setting.</p><button type="button" data-action="clear" class="mcq-button">Clear filters</button></div>'; return; }
  list.innerHTML = state.filtered.slice(state.page * pageSize, (state.page + 1) * pageSize).map(q => `<button type="button" class="ap-frq-row tone-${course.tone}" data-question="${q.id}"><span class="ap-frq-idx">${state.bank.questions.indexOf(q) + 1}</span><span class="ap-frq-body"><span class="mcq-tags">${tags(q)}</span><span class="mcq-preview">${escape(q.stem)}</span></span><span class="mcq-row-status">${state.answers.has(q.id) ? (state.answers.get(q.id) === q.answer ? '✓ Correct' : 'Review') : 'Practice →'}</span></button>`).join('') + `<nav class="mcq-pagination" aria-label="Question pages"><button type="button" class="mcq-button" data-action="prev-page" ${state.page === 0 ? 'disabled' : ''}>Previous</button><span>Page ${state.page + 1} of ${pages}</span><button type="button" class="mcq-button" data-action="next-page" ${state.page + 1 >= pages ? 'disabled' : ''}>Next</button></nav>`;
  math();
}
function filter() {
  const unit = document.getElementById('mcq-unit').value;
  const calculator = document.getElementById('mcq-calculator')?.value || '';
  state.filtered = filterQuestions(state.bank, { unit, calculator });
  state.page = 0; state.active = null;
  document.getElementById('mcq-player').hidden = true;
  document.getElementById('mcq-list').hidden = false;
  const url = new URL(location.href);
  for (const [key, value] of Object.entries({ unit, calculator })) value ? url.searchParams.set(key, value) : url.searchParams.delete(key);
  history.replaceState(null, '', url);
  renderList();
}
function renderQuestion(id, focus = true) {
  const q = state.filtered.find(q => q.id === id);
  if (!q) return;
  state.active = id;
  const index = state.filtered.indexOf(q);
  const checked = state.answers.has(id);
  const selected = state.answers.get(id);
  const player = document.getElementById('mcq-player');
  player.hidden = false;
  document.getElementById('mcq-list').hidden = true;
  player.innerHTML = `<div class="mcq-player-top"><button type="button" class="mcq-button" data-action="bank">← Question bank</button><span>${index + 1} of ${state.filtered.length} matching questions</span></div><article class="mcq-question"><div class="mcq-tags">${tags(q)}</div>${q.stimulus ? `<aside class="mcq-stimulus"><h3>${escape(q.stimulus.title)}</h3><blockquote>“${escape(q.stimulus.text)}”</blockquote><p class="mcq-note">— ${escape(q.stimulus.attribution)}</p></aside>` : ''}<h2 id="mcq-stem" tabindex="-1">${escape(q.stem)}</h2><form id="mcq-answer"><fieldset ${checked ? 'disabled' : ''}><legend class="sr-only">Choose one answer</legend>${q.choices.map((choice, i) => `<label class="mcq-choice ${checked && i === q.answer ? 'is-correct' : checked && selected === i ? 'is-incorrect' : ''}"><input type="radio" name="answer" value="${i}" ${selected === i ? 'checked' : ''} required><span class="mcq-letter">${letters[i]}</span><span>${escape(choice)}${checked && i === q.answer ? '<strong class="mcq-verdict">Correct answer</strong>' : checked && selected === i ? '<strong class="mcq-verdict">Your answer</strong>' : ''}</span></label>`).join('')}</fieldset>${!checked ? '<button type="submit" class="mcq-button is-primary">Check answer</button>' : ''}</form>${checked ? `<section class="mcq-feedback" role="status"><h3>${selected === q.answer ? 'Correct!' : `The correct answer is ${letters[q.answer]}.`}</h3><p>${escape(q.explanation)}</p><p class="mcq-note">${q.stimulus ? 'Source and framework' : 'Topic references'}: ${sourceLinks(q)}</p></section>` : ''}<div class="mcq-question-nav"><button type="button" class="mcq-button" data-action="prev-question" ${index === 0 ? 'disabled' : ''}>Previous question</button><button type="button" class="mcq-button" data-action="next-question" ${index === state.filtered.length - 1 ? 'disabled' : ''}>Next question</button></div></article>`;
  document.getElementById('mcq-answer').addEventListener('submit', e => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get('answer');
    if (value === null || state.answers.has(id)) return;
    state.answers.set(id, Number(value));
    renderList(); renderQuestion(id, false);
    player.querySelector('.mcq-feedback').scrollIntoView({ block: 'nearest' });
  });
  math();
  if (focus) {
    player.scrollIntoView({ block: 'start' });
    document.getElementById('mcq-stem').focus({ preventScroll: true });
  }
}
async function renderBank() {
  root.innerHTML = '<p role="status">Loading question bank…</p>';
  try {
    state.bank = await loadBank(slug);
    document.title = `Korah AI — ${course.name} MCQ Practice`;
    root.innerHTML = `<a class="ap-back-link" href="./mcqs.html">← All MCQ courses</a><h2 class="ap-page-title">${course.name}</h2><p class="ap-page-desc">${state.bank.questions.length} AP-style questions with worked explanations${slug === 'ap-us-history' ? ', each tied to a primary-source excerpt' : ''}.</p><div class="mcq-filters"><label>Unit<select id="mcq-unit" aria-label="Unit"><option value="">All units</option>${course.units.map((u, i) => `<option value="${i + 1}">Unit ${i + 1}: ${escape(u)}</option>`).join('')}</select></label>${slug === 'ap-calculus-ab' ? '<label>Calculator<select id="mcq-calculator" aria-label="Calculator"><option value="">All questions</option><option value="non-calculator">Non-calculator</option><option value="calculator">Calculator</option></select></label>' : ''}<button type="button" data-action="clear" class="mcq-button">Clear filters</button></div><p class="mcq-note">${slug === 'ap-calculus-ab' ? 'For calculator questions, use your graphing calculator; angles are in radians.' : 'Each set of three questions shares one primary-source excerpt, quoted with its original spelling.'} Checked answers stay available while this page is open.</p><p id="mcq-count" role="status" class="mcq-count"></p><section id="mcq-player" hidden aria-label="Question practice"></section><div id="mcq-list"></div><details class="mcq-sources"><summary>About these questions & sources</summary><p>Independent practice aligned to the AP course units. Not endorsed by College Board. Questions, choices, and explanations are written for Korah. History excerpts are quoted from public-domain documents; calculus links are topic references. The bank is for targeted practice, not a weighted full exam.</p>${Object.values(state.bank.sources).map(s => `<p><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a> — ${escape(s.note)}</p>`).join('')}</details>`;
    const unit = document.getElementById('mcq-unit');
    if (course.units[Number(params.get('unit')) - 1]) unit.value = params.get('unit');
    const calculator = document.getElementById('mcq-calculator');
    if (calculator && ['calculator', 'non-calculator'].includes(params.get('calculator'))) calculator.value = params.get('calculator');
    unit.addEventListener('change', filter); calculator?.addEventListener('change', filter);
    filter();
  } catch (error) {
    console.error('[AP MCQ]', error);
    root.innerHTML = '<div class="ap-error" role="alert"><strong>We couldn’t load this question bank.</strong><p>Please check your connection and try again.</p><button type="button" class="mcq-button" data-action="retry">Try again</button><a href="./mcqs.html">Back to courses</a></div>';
  }
}
root.addEventListener('click', e => {
  const question = e.target.closest('[data-question]');
  if (question) return renderQuestion(question.dataset.question);
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'retry') return renderBank();
  if (!state.bank) return;
  if (action === 'clear') { document.getElementById('mcq-unit').value = ''; const c = document.getElementById('mcq-calculator'); if (c) c.value = ''; filter(); }
  if (action === 'prev-page' || action === 'next-page') { state.page += action === 'prev-page' ? -1 : 1; renderList(); }
  if (action === 'bank') { state.active = null; document.getElementById('mcq-player').hidden = true; document.getElementById('mcq-list').hidden = false; renderList(); }
  if (action === 'prev-question' || action === 'next-question') { const i = state.filtered.findIndex(q => q.id === state.active); renderQuestion(state.filtered[i + (action === 'prev-question' ? -1 : 1)]?.id); }
});
if (!slug) renderPicker();
else if (course) renderBank();
else root.innerHTML = '<div class="ap-error"><h2>Unknown course</h2><a href="./mcqs.html">Choose an MCQ course</a></div>';
