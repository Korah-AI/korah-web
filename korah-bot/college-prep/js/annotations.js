/**
 * annotations.js - Quote anchoring, card positioning, click-to-focus
 */

function anchor(annotations, essayText) {
  const paragraphs = essayText.split(/\n\n+/).filter(p => p.trim());
  const anchored = [];

  for (const ann of annotations) {
    const pIdx = ann.paragraphIndex;
    if (pIdx < 0 || pIdx >= paragraphs.length) continue;

    const paragraph = paragraphs[pIdx];
    const quotedText = ann.quotedText;
    const matchIndex = paragraph.indexOf(quotedText);

    if (matchIndex === -1) continue;

    let globalOffset = 0;
    for (let i = 0; i < pIdx; i++) {
      globalOffset += paragraphs[i].length + 2;
    }

    const from = globalOffset + matchIndex;
    const to = from + quotedText.length;

    anchored.push({
      ...ann,
      id: `ann-${anchored.length}`,
      from,
      to,
      paragraphIndex: pIdx,
      matched: true,
    });
  }

  return dedupe(anchored);
}

function dedupe(annotations) {
  const seen = new Map();
  const result = [];
  for (const ann of annotations) {
    const key = `${ann.from}-${ann.to}`;
    if (!seen.has(key)) {
      seen.set(key, true);
      result.push(ann);
    }
  }
  return result;
}

function render(annotations) {
  const list = document.getElementById('annotation-list');
  if (!list) return;

  if (!annotations.length) {
    list.innerHTML = `
      <div class="essay-annotation-empty">
        <span class="material-icons-round" style="font-size: 1.5rem; color: var(--tx3);">check_circle_outline</span>
        <p style="color: var(--tx3); font-size: 0.8125rem; margin: 0;">No issues found. Great work!</p>
      </div>`;
    return;
  }

  list.innerHTML = annotations.map(ann => `
    <div class="essay-annotation-card" data-card-id="${ann.id}"
         onclick="window.highlightAnnotation('${ann.id}')">
      <span class="ann-type-badge ${ann.commentType}">${ann.commentType}</span>
      <div class="ann-quote">"${truncate(ann.quotedText, 80)}"</div>
      <div class="ann-comment">${ann.comment}</div>
    </div>
  `).join('');
}

function renderFocus(focusAnnotations) {
  const list = document.getElementById('annotation-list');
  if (!list || !focusAnnotations.length) return;

  const emptyState = list.querySelector('.essay-annotation-empty');
  if (emptyState) emptyState.remove();

  const focusHtml = focusAnnotations.map(ann => `
    <div class="essay-annotation-card focus-card" data-card-id="${ann.id}"
         onclick="window.highlightAnnotation('${ann.id}')">
      <span class="ann-type-badge ${ann.commentType}">${ann.commentType}</span>
      <div class="ann-quote focus-quote">"${truncate(ann.quotedText, 80)}"</div>
      <div class="ann-comment">${ann.comment}</div>
    </div>
  `).join('');

  list.insertAdjacentHTML('afterbegin', focusHtml);
}

function truncate(text, max) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max) + '...' : text;
}

const EssayAnnotations = { anchor, render, renderFocus };
export default EssayAnnotations;
