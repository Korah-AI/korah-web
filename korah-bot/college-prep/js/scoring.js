/**
 * scoring.js - 6-dimension rubric, score rendering, deltas
 */

const DIMENSIONS = [
  { key: 'writing', label: 'Writing', color: '#8b5cf6' },
  { key: 'detail', label: 'Detail', color: '#3b82f6' },
  { key: 'voice', label: 'Voice', color: '#f0abfc' },
  { key: 'reflection', label: 'Reflection', color: '#fbbf24' },
  { key: 'curiosity', label: 'Curiosity', color: '#34d399' },
  { key: 'contribution', label: 'Contribution', color: '#f87171' },
];

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

function filterByDimension(key) {
  document.querySelectorAll('.essay-score-dim').forEach(el => {
    el.classList.toggle('active', el.dataset.dim === key);
  });

  const cards = document.querySelectorAll('.essay-annotation-card');
  cards.forEach(card => {
    if (!key) {
      card.style.display = '';
      return;
    }
    const badge = card.querySelector('.ann-type-badge');
    card.style.display = '';
  });
}

const EssayScoring = { render, filterByDimension };
export default EssayScoring;

window.filterByDimension = filterByDimension;
