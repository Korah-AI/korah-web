// AP MCQ player. Same layout, markup and classes as the SAT player
// (sat/js/sat-player.js): a stimulus pane beside the question when there is one,
// lettered answer rows with eliminate buttons, Check, an explanation panel, and
// the footer question navigator. Questions come from this course's own JSON bank.
import { getCourse, unitLabel as courseUnitLabel, loadBank, parseSession, buildSession, loadProgress, saveProgress } from './mcq-bank.js';

const $ = id => document.getElementById(id);
const playerSplit = $('playerSplit'), passagePanel = $('passagePanel'), questionParagraph = $('questionParagraph');
const questionNumber = $('questionNumber'), questionDomain = $('questionDomain'), sessionFilterChips = $('sessionFilterChips');
const questionStemTitle = $('questionStemTitle'), questionStem = $('questionStem'), answerChoices = $('answerChoices');
const checkAnswerBtn = $('checkAnswerBtn'), feedbackPanel = $('feedbackPanel'), inlineReviewBtn = $('inlineReviewBtn'), inlineReviewIcon = $('inlineReviewIcon');
const prevQuestionBtn = $('prevQuestionBtn'), nextQuestionBtn = $('nextQuestionBtn'), showExplanationBtn = $('showExplanationBtn');
const calculatorChip = $('calculatorChip'), calculatorChipLabel = $('calculatorChipLabel'), counterText = $('qNavCounterText');

const KEYS = ['A', 'B', 'C', 'D'];
const session = parseSession(location.search), course = session && getCourse(session.course);
const state = { index: 0, answers: {}, checked: {}, flagged: {}, eliminated: {}, explain: false };
let bank = null, questions = [], progress = {}, loadState = 'loading';

const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function typeset(...elements) {
  if (!window.renderMathInElement) return;
  for (const el of elements) window.renderMathInElement(el, { delimiters: [{ left: '\\(', right: '\\)', display: false }, { left: '\\[', right: '\\]', display: true }], throwOnError: false });
}
// Figures are SVG drawn by scripts/ap-mcq-build, or tables of text cells.
function figureHtml(figure) {
  if (!figure) return '';
  if (figure.table) {
    const row = (cells, tag) => `<tr>${cells.map(c => `<${tag}>${escape(c)}</${tag}>`).join('')}</tr>`;
    return `<figure class="ap-figure"><table class="ap-figure-table" aria-label="${escape(figure.alt)}"><thead>${row(figure.table.headers, 'th')}</thead><tbody>${figure.table.rows.map(r => row(r, 'td')).join('')}</tbody></table></figure>`;
  }
  const svg = window.DOMPurify ? window.DOMPurify.sanitize(figure.svg, { USE_PROFILES: { svg: true } }) : figure.svg;
  return `<figure class="ap-figure">${svg}</figure>`;
}
function setPassage(html) {
  questionParagraph.innerHTML = html;
  questionParagraph.classList.toggle('is-hidden', !html);
  passagePanel.style.display = html ? 'flex' : 'none';
  playerSplit.classList.toggle('has-passage', !!html);
}
function setDomainLabel(text) {
  questionDomain.textContent = text;
  questionDomain.dataset.domain = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
const unitLabel = q => courseUnitLabel(course, q.unit);

function showMessage(title, body, actions) {
  questionNumber.textContent = '—';
  setDomainLabel('');
  questionStemTitle.textContent = title;
  questionStemTitle.classList.remove('is-hidden');
  setPassage('');
  questionStem.textContent = body;
  answerChoices.innerHTML = actions;
  feedbackPanel.className = 'sat-feedback-panel is-hidden';
  calculatorChip.classList.add('is-hidden');
  for (const b of [inlineReviewBtn, prevQuestionBtn, nextQuestionBtn, checkAnswerBtn, showExplanationBtn]) b.disabled = true;
  counterText.textContent = 'Question — of —';
}

function render() {
  if (loadState === 'loading') return showMessage('Loading questions…', 'Opening the question bank for this course.', '');
  if (loadState === 'error') return showMessage('We couldn’t load this question bank', 'Check your connection and try again.', '<button class="sat-button sat-button-primary" type="button" id="retryLoadBtn">Retry</button><a class="sat-button sat-button-ghost" href="./mcqs.html">Back to bank</a>');
  if (loadState === 'unknown') return showMessage('Unknown course', 'Choose a course from the MCQ bank to start practicing.', '<a class="sat-button sat-button-primary" href="./mcqs.html">Back to bank</a>');
  if (!questions.length) return showMessage('No questions matched this selection', 'Try other units or reset the filters.', '<a class="sat-button sat-button-primary" href="./mcqs.html">Back to bank</a>');

  const q = questions[state.index], selected = state.answers[q.id], checked = !!state.checked[q.id];
  const correct = selected === q.answer, eliminated = state.eliminated[q.id] || {};
  questionNumber.textContent = state.index + 1;
  setDomainLabel(unitLabel(q));
  sessionFilterChips.innerHTML = `<span class="sat-filter-chip">${escape(q.skill)}</span>`;
  questionStemTitle.classList.add('is-hidden');

  // History stimuli open the passage pane, like SAT Reading. Math figures sit
  // inline above the stem, like SAT Math.
  const s = q.stimulus;
  setPassage(s ? `<h3 class="ap-stimulus-title">${escape(s.title)}</h3>${s.text ? `<blockquote class="ap-stimulus-text">“${escape(s.text)}”</blockquote>` : figureHtml(s.figure)}<p class="ap-stimulus-source">${s.text ? '— ' : 'Source: '}${escape(s.attribution)}</p>` : '');
  questionStem.innerHTML = figureHtml(q.figure) + `<p>${escape(q.stem)}</p>`;

  calculatorChip.classList.toggle('is-hidden', !q.calculator);
  if (q.calculator) {
    calculatorChipLabel.textContent = q.calculator === 'calculator' ? 'Calculator' : 'No calculator';
    calculatorChip.title = q.calculator === 'calculator' ? 'A graphing calculator is allowed on this question. Use radian mode.' : 'Answer this question without a calculator.';
  }

  answerChoices.innerHTML = q.choices.map((choice, i) => {
    const classes = ['sat-answer-choice'];
    if (eliminated[i]) classes.push('is-eliminated');
    if (selected === i) classes.push('is-selected');
    if (checked && i === q.answer) classes.push('is-correct');
    else if (checked && selected === i) classes.push('is-incorrect');
    return `<div class="sat-answer-row">
      <button class="${classes.join(' ')}" type="button" data-answer="${i}" aria-pressed="${selected === i}"${checked ? ' disabled' : ''}><span class="sat-answer-key">${KEYS[i]}</span><span class="ap-choice-text">${escape(choice)}</span></button>
      <button class="sat-elim-btn${eliminated[i] ? ' is-active' : ''}" type="button" data-elim="${i}" title="Eliminate this choice" aria-label="Eliminate choice ${KEYS[i]}"${checked ? ' disabled' : ''}><span class="sat-elim-letter">${KEYS[i]}</span></button>
    </div>`;
  }).join('');
  // Check sits inside the selected answer's row until the answer is graded.
  const selectedRow = !checked && Number.isInteger(selected) ? answerChoices.querySelector('.sat-answer-choice.is-selected')?.closest('.sat-answer-row') : null;
  (selectedRow || document.querySelector('.sat-check-row')).appendChild(checkAnswerBtn);
  checkAnswerBtn.classList.toggle('is-inline', !!selectedRow);
  checkAnswerBtn.classList.toggle('is-hidden', checked);
  checkAnswerBtn.disabled = !Number.isInteger(selected);

  if (checked || state.explain) {
    const links = q.sourceIds.map(id => bank.sources[id]).filter(src => /^https:\/\//.test(src.url))
      .map(src => `<a href="${escape(src.url)}" target="_blank" rel="noopener noreferrer">${escape(src.title)}</a>`).join(' · ');
    feedbackPanel.className = `sat-feedback-panel ${checked && !correct ? 'is-incorrect' : 'is-correct'}`;
    feedbackPanel.innerHTML = `<strong>${checked ? (correct ? 'Correct.' : `Correct answer: ${KEYS[q.answer]}.`) : 'Explanation preview.'}</strong>
      <div class="sat-feedback-body"><p>${escape(q.explanation)}</p><p class="ap-feedback-sources">${s ? 'Source' : 'Topic reference'}: ${links}</p></div>`;
  } else feedbackPanel.className = 'sat-feedback-panel is-hidden';

  inlineReviewBtn.disabled = false;
  inlineReviewBtn.classList.toggle('is-active', !!state.flagged[q.id]);
  inlineReviewBtn.setAttribute('aria-pressed', state.flagged[q.id] ? 'true' : 'false');
  inlineReviewIcon.setAttribute('fill', state.flagged[q.id] ? 'currentColor' : 'none');
  showExplanationBtn.disabled = false;
  showExplanationBtn.classList.toggle('is-active', state.explain);
  prevQuestionBtn.disabled = false;
  prevQuestionBtn.style.display = state.index === 0 ? 'none' : '';
  nextQuestionBtn.disabled = false;
  nextQuestionBtn.innerHTML = state.index === questions.length - 1 ? 'Back to Bank' : 'Next<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><polyline points="9 18 15 12 9 6"/></svg>';
  counterText.textContent = `Question ${state.index + 1} of ${questions.length}`;
  typeset(questionParagraph, questionStem, answerChoices, feedbackPanel);
  nav.refresh();
  if (q.id !== announcedId) { announcedId = q.id; window.dispatchEvent(new CustomEvent('korahAPQuestionChange')); }
}
// Read by mcq-ask-korah.js so Korah knows which question the student is on.
let announcedId = null;
window.KorahAPPlayer = { getCurrentQuestion: () => (loadState === 'ready' && questions[state.index] ? { course, unit: unitLabel(questions[state.index]), question: questions[state.index] } : null) };

function goTo(index) {
  if (index < 0 || index >= questions.length) return;
  state.index = index; state.explain = false;
  stopwatch.reset();
  render();
  $('playerScroll').scrollTop = 0;
}
const leave = () => { if (window.KorahTransitions?.go) window.KorahTransitions.go('./mcqs.html'); else location.href = './mcqs.html'; };

// ── Stopwatch: time on the current question ──
const stopwatch = (() => {
  const display = $('playerTimer'), pauseIcon = $('pauseIcon'), playIcon = $('playIcon');
  let seconds = 0, running = true;
  const paint = () => { display.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
  setInterval(() => { if (running && loadState === 'ready' && !document.hidden) { seconds++; paint(); } }, 1000);
  $('pauseStopwatchBtn').addEventListener('click', () => { running = !running; pauseIcon.classList.toggle('is-hidden', !running); playIcon.classList.toggle('is-hidden', running); });
  return { reset() { seconds = 0; paint(); } };
})();

// ── Footer question navigator ──
const nav = (() => {
  const panel = $('qNavPanel'), trigger = $('playerCounter'), grid = $('qNavGrid'), stats = $('qNavStats');
  let isOpen = false;
  const flag = '<span class="q-pill-flag"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></span>';
  function position() {
    if (window.innerWidth <= 480) { panel.style.removeProperty('--q-nav-bottom'); panel.style.removeProperty('--q-nav-left'); return; }
    const rect = trigger.getBoundingClientRect(), half = (panel.offsetWidth || Math.min(420, window.innerWidth - 32)) / 2;
    panel.style.setProperty('--q-nav-bottom', `${window.innerHeight - rect.top + 10}px`);
    panel.style.setProperty('--q-nav-left', `${Math.max(half + 12, Math.min(rect.left + rect.width / 2, window.innerWidth - half - 12))}px`);
  }
  function setOpen(open, returnFocus = false) {
    isOpen = open;
    if (open) { refresh(); position(); }
    panel.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    trigger.classList.toggle('is-open', open);
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    grid.querySelectorAll('.q-pill').forEach(p => p.setAttribute('tabindex', open ? '0' : '-1'));
    if (open) setTimeout(() => (grid.querySelector('.q-pill.is-current') || grid.querySelector('.q-pill'))?.focus(), 280);
    else if (returnFocus) trigger.focus();
  }
  function refresh() {
    if (!questions.length) return;
    if (!stats.childElementCount) stats.innerHTML = `
      <div class="q-stat-item"><div class="q-legend-icon-correct"><span class="material-icons-round">check</span></div>Correct</div>
      <div class="q-stat-item"><div class="q-legend-icon-incorrect"><span class="material-icons-round">close</span></div>Incorrect</div>
      <div class="q-stat-item"><div class="q-legend-icon-flag"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></div>Flagged</div>
      <div class="q-stat-item"><div class="q-legend-icon-attempted"></div>Attempted</div>
      <span class="q-stat-total">${questions.length} total</span>`;
    if (grid.childElementCount !== questions.length) {
      grid.innerHTML = '';
      questions.forEach((_, i) => {
        const pill = document.createElement('button');
        pill.type = 'button'; pill.className = 'q-pill'; pill.setAttribute('role', 'listitem'); pill.tabIndex = -1;
        pill.addEventListener('click', () => { goTo(i); setOpen(false); });
        grid.appendChild(pill);
      });
    }
    grid.querySelectorAll('.q-pill').forEach((pill, i) => {
      const q = questions[i], answered = Number.isInteger(state.answers[q.id]);
      const status = !answered ? 'unanswered' : !state.checked[q.id] ? 'attempted' : state.answers[q.id] === q.answer ? 'correct' : 'incorrect';
      pill.className = `q-pill is-${status}${i === state.index ? ' is-current' : ''}`;
      pill.setAttribute('aria-label', `Question ${i + 1}${i === state.index ? ', current' : ''}, ${status}${state.flagged[q.id] ? ', flagged for review' : ''}`);
      pill.innerHTML = String(i + 1) + (state.flagged[q.id] ? flag : '');
    });
  }
  trigger.addEventListener('click', () => setOpen(!isOpen));
  document.addEventListener('keydown', e => { if (isOpen && e.key === 'Escape') setOpen(false, true); });
  document.addEventListener('pointerdown', e => { if (isOpen && !panel.contains(e.target) && !trigger.contains(e.target)) setOpen(false); });
  window.addEventListener('resize', () => { if (isOpen) position(); }, { passive: true });
  return { refresh };
})();

// ── Events ──
answerChoices.addEventListener('click', e => {
  if (e.target.closest('#retryLoadBtn')) return load();
  const q = questions[state.index];
  if (!q || state.checked[q.id] || e.target.closest('#checkAnswerBtn')) return;
  const elim = e.target.closest('[data-elim]'), answer = e.target.closest('[data-answer]');
  if (elim) {
    const i = Number(elim.dataset.elim), map = state.eliminated[q.id] ||= {};
    map[i] = !map[i];
    if (map[i] && state.answers[q.id] === i) delete state.answers[q.id];
  } else if (answer) {
    const i = Number(answer.dataset.answer);
    state.answers[q.id] = i;
    if (state.eliminated[q.id]) state.eliminated[q.id][i] = false;
  } else return;
  render();
});
checkAnswerBtn.addEventListener('click', () => {
  const q = questions[state.index];
  if (!q || !Number.isInteger(state.answers[q.id]) || state.checked[q.id]) return;
  state.checked[q.id] = true;
  progress[q.id] = state.answers[q.id];
  saveProgress(course.slug, progress);
  render();
  feedbackPanel.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
});
inlineReviewBtn.addEventListener('click', () => { const q = questions[state.index]; if (q) { state.flagged[q.id] = !state.flagged[q.id]; render(); } });
showExplanationBtn.addEventListener('click', () => { if (questions[state.index]) { state.explain = !state.explain; render(); } });
prevQuestionBtn.addEventListener('click', () => goTo(state.index - 1));
nextQuestionBtn.addEventListener('click', () => (state.index === questions.length - 1 ? leave() : goTo(state.index + 1)));
document.addEventListener('keydown', e => {
  if (e.target.closest('input, textarea, [contenteditable]') || e.altKey || e.ctrlKey || e.metaKey || loadState !== 'ready') return;
  if (e.key === 'ArrowRight' && state.index < questions.length - 1) goTo(state.index + 1);
  if (e.key === 'ArrowLeft') goTo(state.index - 1);
});

async function load() {
  if (!course) { loadState = 'unknown'; return render(); }
  loadState = 'loading'; render();
  document.title = `Korah AI — ${course.name} MCQ Practice`;
  document.body.dataset.tone = course.tone; // colors the unit label to match the course tile
  try {
    bank = await loadBank(course.slug);
    progress = loadProgress(course.slug);
    questions = buildSession(bank, session, progress);
    loadState = 'ready';
  } catch (error) {
    console.error('[AP MCQ]', error);
    loadState = 'error';
  }
  state.index = 0;
  render();
}
load();
