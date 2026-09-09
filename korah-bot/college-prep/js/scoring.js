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

function renderRecommendations(scores) {
  const list = document.getElementById('annotation-list');
  if (!list || !scores) return;

  list.innerHTML = '';

  const allCards = [];

  for (const d of DIMENSIONS) {
    const data = scores[d.key];
    if (!data) continue;

    const score = data.score || 0;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence, feedback: data.feedback }] : []);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const evidence = item.evidence || '';
      const feedback = item.feedback || '';
      const evidenceShort = evidence.length > 120 ? evidence.slice(0, 120) + '...' : evidence;
      const cardId = `rec-${d.key}-${i}`;

      allCards.push(`
        <div class="essay-rec-card active" data-dim="${d.key}" data-card-id="${cardId}"
             onclick="window.toggleRecommendation(this, '${d.key}')"
             style="--rec-color: ${d.color};">
          <div class="rec-header">
            <span class="rec-dot" style="background: ${d.color};"></span>
            <span class="rec-label">${d.label}</span>
            <span class="rec-score" style="color: ${d.color};">${score}/10</span>
          </div>
          <div class="rec-evidence" style="border-color: ${d.color};">
            "${evidenceShort}"
          </div>
          <div class="rec-feedback">${feedback}</div>
        </div>`);
    }
  }

  list.innerHTML = allCards.join('');
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
      <div class="essay-rec-card focus-card" data-dim="focus" data-card-id="${cardId}"
           onclick="window.toggleRecommendation(this, 'focus')"
           style="--rec-color: #fbbf24;">
        <div class="rec-header">
          <span class="rec-dot" style="background: #fbbf24;"></span>
          <span class="rec-label">Focus</span>
          <span class="rec-badge">${ann.commentType || 'socratic'}</span>
        </div>
        <div class="rec-evidence" style="border-color: #fbbf24;">
          "${evidenceShort}"
        </div>
        <div class="rec-feedback">${feedback}</div>
      </div>`;
  }).join('');

  list.insertAdjacentHTML('beforeend', focusHtml);
}

function filterByDimension(key) {
  document.querySelectorAll('.essay-score-dim').forEach(el => {
    el.classList.toggle('active', el.dataset.dim === key);
  });
}

window.toggleRecommendation = function(el, key) {
  el.classList.toggle('active');

  if (activeDims.has(key)) {
    activeDims.delete(key);
  } else {
    activeDims.add(key);
  }

  if (window.syncHighlights) window.syncHighlights();
};

function getActiveDims() {
  return activeDims;
}

const EssayScoring = { render, renderRecommendations, renderFocusCards, filterByDimension, getDimColor, getActiveDims, DIMENSIONS };
export default EssayScoring;

window.filterByDimension = filterByDimension;
