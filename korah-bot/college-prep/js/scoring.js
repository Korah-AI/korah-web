/**
 * scoring.js - 6-dimension rubric, score rendering, recommendation cards
 */

const DIMENSIONS = [
  { key: 'writing', label: 'Writing', color: '#8b5cf6' },
  { key: 'detail', label: 'Detail', color: '#3b82f6' },
  { key: 'voice', label: 'Voice', color: '#f0abfc' },
  { key: 'reflection', label: 'Reflection', color: '#fbbf24' },
  { key: 'curiosity', label: 'Curiosity', color: '#34d399' },
  { key: 'contribution', label: 'Contribution', color: '#f87171' },
];

const activeDims = new Set(DIMENSIONS.map(d => d.key));
window._activeDims = activeDims;

const activeCards = new Set();
window._activeCards = activeCards;

/* Resolved cards drop out of the Open column and their highlight leaves the
   essay, so the page empties as the student works through the list. editor.js
   reads this when it rebuilds the highlights. */
const resolved = new Set();
window._resolvedCards = resolved;

function resolveButton(cardId) {
  return `<button class="rec-resolve" type="button" title="Resolve" aria-label="Resolve"
             onclick="event.stopPropagation(); window.toggleResolved('${cardId}')">
            <span class="material-icons-round">check</span>
          </button>`;
}

function getDimColor(key) {
  const dim = DIMENSIONS.find(d => d.key === key);
  return dim ? dim.color : '#8b5cf6';
}

function render(scores, previousScores) {
  if (!scores) return;

  const panel = document.getElementById('score-panel');
  const dimsEl = document.getElementById('score-dims');
  const avgEl = document.getElementById('score-average');
  if (!panel || !dimsEl) return;

  panel.style.display = 'block';

  const values = DIMENSIONS.map(d => scores[d.key]?.score || 0);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  if (avgEl) avgEl.textContent = avg.toFixed(1);

  dimsEl.innerHTML = DIMENSIONS.map(d => {
    const score = scores[d.key]?.score || 0;
    const pct = (score / 10) * 100;
    let deltaHtml = '';
    if (previousScores && previousScores[d.key]) {
      const prev = previousScores[d.key].score;
      const diff = score - prev;
      if (diff > 0) deltaHtml = `<span class="essay-dim-delta up">+${diff}</span>`;
      else if (diff < 0) deltaHtml = `<span class="essay-dim-delta down">${diff}</span>`;
    }
    return `
      <div class="essay-score-dim" data-dim="${d.key}" onclick="filterByDimension('${d.key}')">
        <span class="essay-dim-name">${d.label}</span>
        <div class="essay-dim-bar-track">
          <div class="essay-dim-bar-fill" style="width: ${pct}%; background: ${d.color};"></div>
        </div>
        <span class="essay-dim-score">${score}</span>
        ${deltaHtml}
      </div>`;
  }).join('');
}

/* Cards are ordered by where their quote sits in the essay, so reading the
   column top to bottom follows the page. Quotes that no longer match any text
   fall to the end. */
function evidencePosition(evidence, essay) {
  if (!essay || !evidence) return Number.MAX_SAFE_INTEGER;
  const idx = essay.indexOf(evidence.replace(/\s+/g, ' ').trim());
  return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
}

/* The school the essay is aimed at, for the badge on items the model marked as
   weighing the passage against that school's values. Empty for personal
   statements, which carry no school context. */
function targetSchoolName() {
  const el = document.querySelector('[x-data]');
  const d = el && el._x_dataStack && el._x_dataStack[0];
  if (!d || d.essayType !== 'supplemental' || !d.school) return '';
  const data = window.getSchoolData ? window.getSchoolData(d.school) : null;
  return data ? data.name : '';
}

function renderRecommendations(scores) {
  const list = document.getElementById('annotation-list');
  if (!list || !scores) return;

  list.innerHTML = '';
  activeCards.clear();
  resolved.clear();

  const input = document.getElementById('essay-input');
  const essay = (input ? input.value : '').replace(/\s+/g, ' ').trim();
  const school = targetSchoolName();

  const cards = [];

  for (const d of DIMENSIONS) {
    const data = scores[d.key];
    if (!data) continue;

    const items = data.items || (data.evidence ? [{ evidence: data.evidence, feedback: data.feedback }] : []);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const evidence = item.evidence || '';
      const feedback = item.feedback || '';
      const evidenceShort = evidence.length > 120 ? evidence.slice(0, 120) + '...' : evidence;
      const cardId = `rec-${d.key}-${i}`;
      const schoolBadge = item.schoolFit && school
        ? `<span class="rec-badge rec-badge-school">${escapeHtml(school)}</span>`
        : '';

      cards.push({
        pos: evidencePosition(evidence, essay),
        html: `
        <div class="essay-rec-card" data-dim="${d.key}" data-card-id="${cardId}" data-evidence="${evidence.replace(/"/g, '&quot;')}"
             onclick="window.toggleRecommendation(this)"
             style="--rec-color: ${d.color};">
          <div class="rec-header">
            <span class="rec-label">${d.label}</span>
            ${schoolBadge}
            ${resolveButton(cardId)}
          </div>
          <div class="rec-evidence" style="border-color: ${d.color};">
            "${evidenceShort}"
          </div>
          <div class="rec-feedback">${feedback}</div>
        </div>`,
      });
    }
  }

  cards.sort((a, b) => a.pos - b.pos);
  list.innerHTML = cards.map(c => c.html).join('');
  updateRecCounts();
}

function renderFocusCards(focusAnnotations) {
  const list = document.getElementById('annotation-list');
  if (!list || !focusAnnotations.length) return;

  const focusHtml = focusAnnotations.map((ann, i) => {
    const evidence = ann.quotedText || '';
    const feedback = ann.comment || '';
    const evidenceShort = evidence.length > 120 ? evidence.slice(0, 120) + '...' : evidence;
    const cardId = `focus-${i}`;

    return `
      <div class="essay-rec-card focus-card" data-dim="focus" data-card-id="${cardId}" data-evidence="${evidence.replace(/"/g, '&quot;')}"
           onclick="window.toggleRecommendation(this)"
           style="--rec-color: #fbbf24;">
        <div class="rec-header">
          <span class="rec-label">Focus</span>
          <span class="rec-badge">${ann.commentType || 'socratic'}</span>
          ${resolveButton(cardId)}
        </div>
        <div class="rec-evidence" style="border-color: #fbbf24;">
          "${evidenceShort}"
        </div>
        <div class="rec-feedback">${feedback}</div>
      </div>`;
  }).join('');

  list.insertAdjacentHTML('beforeend', focusHtml);
  updateRecCounts();
}

/* Answers to "ask for feedback on this" go to the top of the column, newest
   first, and highlight their passage the way a focus card does. The card is
   rendered empty and filled when the model answers. */
let askSeq = 0;

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderAskCard(question, evidence) {
  const list = document.getElementById('annotation-list');
  if (!list) return null;

  const empty = list.querySelector('.essay-annotation-empty');
  if (empty) empty.remove();

  const cardId = `ask-${askSeq++}`;
  const evidenceShort = evidence.length > 120 ? evidence.slice(0, 120) + '...' : evidence;

  list.insertAdjacentHTML('afterbegin', `
    <div class="essay-rec-card ask-card" data-dim="ask" data-card-id="${cardId}" data-evidence="${evidence.replace(/"/g, '&quot;')}"
         onclick="window.toggleRecommendation(this)"
         style="--rec-color: #3b82f6;">
      <div class="rec-header">
        <span class="rec-label">Your question</span>
        ${resolveButton(cardId)}
      </div>
      <div class="rec-evidence" style="border-color: #3b82f6;">
        "${escapeHtml(evidenceShort)}"
      </div>
      <div class="rec-question">${escapeHtml(question)}</div>
      <div class="rec-feedback is-pending">Thinking...</div>
    </div>`);

  updateRecCounts();
  return cardId;
}

function fillAskCard(cardId, feedback) {
  const el = document.querySelector(`.essay-rec-card[data-card-id="${cardId}"] .rec-feedback`);
  if (!el) return;
  el.classList.remove('is-pending');
  el.textContent = feedback || 'No feedback came back. Try asking again.';
}

/* Resolving moves the card to the other view, so it leaves on an animation
   instead of blinking out: its height and padding collapse while it fades, and
   the filter rule takes over once it has gone. Height has to be pinned in
   pixels first, since a transition from auto does not run. Keep in step with
   the .is-leaving transition in college-prep.css. */
const LEAVE_MS = 260;

function animateOut(card, done) {
  card.style.height = `${card.offsetHeight}px`;
  card.classList.add('is-leaving');
  requestAnimationFrame(() => { card.style.height = '0px'; });
  setTimeout(() => {
    card.classList.remove('is-leaving');
    card.style.height = '';
    done();
  }, LEAVE_MS);
}

/* Resolving is a class swap, not a re-render: re-rendering the column would
   drop the card the student is reading. The essay is repainted though, because
   a resolved card's highlight leaves the page. */
function toggleResolved(cardId) {
  const card = document.querySelector(`.essay-rec-card[data-card-id="${cardId}"]`);
  if (!card || card.classList.contains('is-leaving')) return;

  const nowResolved = !resolved.has(cardId);
  if (nowResolved) {
    resolved.add(cardId);
    if (activeCards.has(cardId)) selectRecommendation(null);
  } else {
    resolved.delete(cardId);
  }

  animateOut(card, () => card.classList.toggle('is-resolved', nowResolved));

  updateRecCounts();
  if (window.syncHighlights) window.syncHighlights();
  if (window.persistResolved) window.persistResolved(Array.from(resolved));
}

function setRecFilter(mode) {
  const list = document.getElementById('annotation-list');
  if (!list) return;
  list.classList.toggle('show-resolved', mode === 'resolved');
  document.querySelectorAll('.rec-filter-pill').forEach(el => {
    el.classList.toggle('active', el.dataset.filter === mode);
  });
  updateRecCounts();
}

function updateRecCounts() {
  const total = document.querySelectorAll('.essay-rec-card').length;
  // The set, not the DOM: the .is-resolved class only lands once the card has
  // finished animating out, and the counts should move the moment it is ticked.
  const done = resolved.size;
  const openEl = document.getElementById('rec-count-open');
  const doneEl = document.getElementById('rec-count-resolved');
  if (openEl) openEl.textContent = total - done;
  if (doneEl) doneEl.textContent = done;

  const list = document.getElementById('annotation-list');
  const note = document.getElementById('rec-empty-note');
  if (!list || !note) return;
  const showingResolved = list.classList.contains('show-resolved');
  const visible = showingResolved ? done : total - done;
  note.textContent = showingResolved ? 'Nothing resolved yet.' : 'Everything is resolved.';
  note.toggleAttribute('hidden', total === 0 || visible > 0);
}

/* Restores the marks saved with the essay. Card ids come from the scores, so
   they line up with whatever was saved next to them; a fresh analysis writes a
   new set of cards and starts them all open. */
function applyResolved(ids) {
  resolved.clear();
  (ids || []).forEach(id => {
    const card = document.querySelector(`.essay-rec-card[data-card-id="${id}"]`);
    if (!card) return;
    resolved.add(id);
    card.classList.add('is-resolved');
  });
  updateRecCounts();
}

/* The overall read: the threads running through the essay and the person they
   add up to. Sits above the per-quote cards because it is about the whole. */
function renderThemes(data) {
  const panel = document.getElementById('themes-panel');
  const body = document.getElementById('themes-body');
  if (!panel || !body) return;

  if (!data || !Array.isArray(data.themes) || !data.themes.length) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = 'block';
  body.innerHTML = `
    ${data.portrait ? `<p class="themes-portrait">${escapeHtml(data.portrait)}</p>` : ''}
    ${data.themes.map(t => `
      <div class="theme-row">
        <div class="theme-head">
          <span class="theme-name">${escapeHtml(t.name || '')}</span>
          ${t.quality ? `<span class="theme-quality">${escapeHtml(t.quality)}</span>` : ''}
        </div>
        <p class="theme-note">${escapeHtml(t.note || '')}</p>
      </div>`).join('')}`;
}

function filterByDimension(key) {
  document.querySelectorAll('.essay-score-dim').forEach(el => {
    el.classList.toggle('active', el.dataset.dim === key);
  });
}

/* One piece of feedback at a time: selecting a card clears whatever was
   selected before. Pass null to clear. Class-only repaint, because
   re-rendering the essay would drop the caret mid-edit. */
function selectRecommendation(cardId) {
  activeCards.clear();
  if (cardId) activeCards.add(cardId);
  document.querySelectorAll('.essay-rec-card').forEach(el => {
    el.classList.toggle('active', el.dataset.cardId === cardId);
  });
  if (window.syncHighlightState) window.syncHighlightState();
}

window.selectRecommendation = selectRecommendation;

window.toggleRecommendation = function(el) {
  const cardId = el.dataset.cardId;
  if (!cardId) return;
  selectRecommendation(activeCards.has(cardId) ? null : cardId);
};

function getActiveDims() {
  return activeDims;
}

const EssayScoring = { render, renderRecommendations, renderFocusCards, renderAskCard, fillAskCard, renderThemes, applyResolved, filterByDimension, getDimColor, getActiveDims, DIMENSIONS };
export default EssayScoring;

window.filterByDimension = filterByDimension;
window.toggleResolved = toggleResolved;
window.setRecFilter = setRecFilter;

function toggleThemesCollapse() {
  const panel = document.getElementById('themes-panel');
  if (panel) panel.classList.toggle('collapsed');
}
window.toggleThemesCollapse = toggleThemesCollapse;

function toggleScoreCollapse() {
  const panel = document.getElementById('score-panel');
  if (panel) panel.classList.toggle('collapsed');
}
window.toggleScoreCollapse = toggleScoreCollapse;
