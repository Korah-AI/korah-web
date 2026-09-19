/**
 * editor.js - Tiptap editor + static highlighted render
 *
 * After analysis, the Tiptap editor is destroyed and replaced with a plain
 * <div> containing the essay text with <mark> highlights baked in as HTML.
 * This avoids ProseMirror re-rendering wiping out DOM modifications.
 */
let editor = null;
let rawContent = '';

const DIM_COLORS = {
  writing:      '#8b5cf6',
  detail:       '#3b82f6',
  voice:        '#ec4899',
  reflection:   '#f59e0b',
  curiosity:    '#22c55e',
  contribution: '#ef4444',
};

/* ---- editor init ---- */

async function initEditor(content) {
  const { Editor } = await import('tiptap-core');
  const { StarterKit } = await import('tiptap-starter-kit');
  const { Placeholder } = await import('tiptap-placeholder');

  const container = document.getElementById('editor-container');
  if (!container) return editor;
  if (editor) return editor;

  rawContent = content || '';
  const html = rawContent
    ? `<p>${rawContent.split('\n\n').map(p => p.trim()).filter(Boolean).join('</p><p>')}</p>`
    : '';

  editor = new Editor({
    element: container,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: 'Start writing your essay...' }),
    ],
    content: html,
    editorProps: {
      attributes: { class: 'essay-editor-content' },
    },
    onUpdate: ({ editor }) => updateWordCount(editor),
  });

  updateWordCount(editor);
  return editor;
}

function updateWordCount(ed) {
  const text = ed.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const el = document.getElementById('editor-word-count');
  if (el) el.textContent = words;
}

function getEditor() { return editor; }

/* ---- Static highlighted render ---- */

function destroyEditor() {
  if (editor) {
    editor.destroy();
    editor = null;
  }
}

/* The highlighted view replaces the Tiptap editor, so it has to stay writable
   or the essay becomes read-only after an analysis. Edits flow back into
   rawContent and #essay-input, which is what a re-highlight and a save read. */
function onStaticEdit(e) {
  const view = e.currentTarget;
  rawContent = Array.from(view.querySelectorAll('p'))
    .map(p => p.textContent.replace(/\u00a0/g, ' ').trim())
    .filter(Boolean)
    .join('\n\n');
  const input = document.getElementById('essay-input');
  if (input) input.value = rawContent;
  updateStaticWordCount(rawContent);
  window.dispatchEvent(new CustomEvent('essay-edited', { detail: rawContent }));
}

function updateStaticWordCount(text) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const wcEl = document.getElementById('editor-word-count');
  if (wcEl) wcEl.textContent = words;
}

function mountStaticView(container, html) {
  container.innerHTML = `<div class="essay-editor-content essay-static-view" contenteditable="true" spellcheck="true">${html}</div>`;
  const view = container.firstElementChild;
  view.addEventListener('input', onStaticEdit);
  view.addEventListener('click', onHighlightClick);
}

/* A highlight and its card are two views of one selection. Both handlers move
   window._activeCards and then repaint with classes only. */
function syncHighlightState() {
  const selected = window._activeCards || new Set();
  document.querySelectorAll('.essay-dim-highlight').forEach(mark => {
    mark.classList.toggle('is-on', selected.has(mark.dataset.cardId));
  });
}

function onHighlightClick(e) {
  const mark = e.target.closest('.essay-dim-highlight');
  if (!mark) return;
  const cardId = mark.dataset.cardId;
  if (!cardId) return;

  const selected = window._activeCards || new Set();
  const nowOn = !selected.has(cardId);
  if (window.selectRecommendation) window.selectRecommendation(nowOn ? cardId : null);

  if (!nowOn) return;
  const card = document.querySelector(`.essay-rec-card[data-card-id="${cardId}"]`);
  if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderHighlightedEssay(content, scores, activeCardsSet) {
  destroyEditor();

  const container = document.getElementById('editor-container');
  if (!container) return;

  const paragraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);
  const plainParagraphs = paragraphs.map(p => escapeHtml(p));
  const fullText = plainParagraphs.join('\n');

  // A resolved card has been dealt with, so its mark comes off the page.
  const resolved = window._resolvedCards || new Set();

  const ranges = [];
  for (const d of Object.keys(DIM_COLORS)) {
    const data = scores[d];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);
    for (let i = 0; i < items.length; i++) {
      const cardId = `rec-${d}-${i}`;
      if (resolved.has(cardId)) continue;
      let evidence = (items[i].evidence || '').replace(/\s+/g, ' ').trim();
      if (!evidence) continue;
      const escaped = escapeHtml(evidence);
      const idx = fullText.indexOf(escaped);
      if (idx !== -1) {
        ranges.push({ start: idx, end: idx + escaped.length, key: d, len: escaped.length, cardId });
      }
    }
  }

  // Focus-pass and ask-a-question cards carry their own quote rather than a
  // rubric dimension, so they borrow a dimension colour for the highlight.
  for (const annCard of document.querySelectorAll('.essay-rec-card.focus-card, .essay-rec-card.ask-card')) {
    const cardId = annCard.dataset.cardId;
    if (resolved.has(cardId)) continue;
    let evidence = (annCard.dataset.evidence || '').replace(/\s+/g, ' ').trim();
    if (!evidence) continue;
    const escaped = escapeHtml(evidence);
    const idx = fullText.indexOf(escaped);
    const key = annCard.classList.contains('ask-card') ? 'detail' : 'reflection';
    if (idx !== -1) {
      ranges.push({ start: idx, end: idx + escaped.length, key, len: escaped.length, cardId });
    }
  }

  ranges.sort((a, b) => a.start - b.start || b.len - a.len);

  const filtered = [];
  for (const r of ranges) {
    const insideAnother = filtered.some(f => r.start >= f.start && r.end <= f.end);
    if (!insideAnother) filtered.push(r);
  }

  filtered.sort((a, b) => b.start - a.start);

  let result = fullText;
  for (const r of filtered) {
    const before = result.slice(0, r.start);
    const match = result.slice(r.start, r.end);
    const after = result.slice(r.end);
    const on = activeCardsSet.has(r.cardId) ? ' is-on' : '';
    result = before + `<mark class="essay-dim-highlight dim-${r.key}${on}" data-card-id="${r.cardId}">${match}</mark>` + after;
  }

  const html = result.split('\n').map(p => `<p>${p || '&nbsp;'}</p>`).join('');

  mountStaticView(container, html);
  updateStaticWordCount(content);
}

function reapplyHighlights() {
  const scores = window._lastScores;
  if (!scores || !rawContent) return;
  const ac = window._activeCards || new Set();
  renderHighlightedEssay(rawContent, scores, ac);
}

function syncHighlights() {
  reapplyHighlights();
}

function highlightAllDimensions() {
  const scores = window._lastScores;
  if (!scores) return Promise.resolve();
  if (!rawContent) {
    window._pendingHighlights = scores;
    return Promise.resolve();
  }
  return new Promise(resolve => {
    requestAnimationFrame(() => {
      const ac = window._activeCards || new Set();
      renderHighlightedEssay(rawContent, scores, ac);
      resolve();
    });
  });
}

function highlightDimension(key) {
  reapplyHighlights();
}

function clearHighlights() {
  const container = document.getElementById('editor-container');
  if (container && !editor) {
    const plain = rawContent.split('\n\n').map(p => `<p>${escapeHtml(p) || '&nbsp;'}</p>`).join('');
    mountStaticView(container, plain);
  }
}

/* ---- globals ---- */
window.initEditor = initEditor;
window.getEditor = getEditor;
window.clearHighlights = clearHighlights;
window.highlightAllDimensions = highlightAllDimensions;
window.syncHighlights = syncHighlights;
window.syncHighlightState = syncHighlightState;
window.highlightDimension = highlightDimension;

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('essay-loaded', (e) => {
    const data = e.detail;
    if (data.content) {
      rawContent = data.content;
      initEditor(data.content);
    }
  });

  window.addEventListener('analysis-ready', () => {
    if (!editor) {
      const input = document.getElementById('essay-input');
      if (input) {
        rawContent = input.value.trim();
        initEditor(rawContent);
      }
    }
  });
});
