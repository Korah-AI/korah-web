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

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderHighlightedEssay(content, scores, activeDims) {
  destroyEditor();

  const container = document.getElementById('editor-container');
  if (!container) return;

  const paragraphs = content.split('\n\n').map(p => p.trim()).filter(Boolean);
  const plainParagraphs = paragraphs.map(p => escapeHtml(p));

  const dimKeys = [...activeDims];

  const ranges = [];
  for (const key of dimKeys) {
    const data = scores[key];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);
    for (const item of items) {
      let evidence = (item.evidence || '').replace(/\s+/g, ' ').trim();
      if (!evidence) continue;
      const escaped = escapeHtml(evidence);
      const idx = plainParagraphs.join('\n').indexOf(escaped);
      if (idx !== -1) {
        ranges.push({ start: idx, end: idx + escaped.length, key });
      }
    }
  }

  ranges.sort((a, b) => b.start - a.start);

  let fullText = plainParagraphs.join('\n');
  for (const r of ranges) {
    const before = fullText.slice(0, r.start);
    const match = fullText.slice(r.start, r.end);
    const after = fullText.slice(r.end);
    fullText = before + `<mark class="essay-dim-highlight dim-${r.key}">${match}</mark>` + after;
  }

  const html = fullText.split('\n').map(p => `<p>${p || '&nbsp;'}</p>`).join('');

  container.innerHTML = `<div class="essay-editor-content essay-static-view">${html}</div>`;

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const wcEl = document.getElementById('editor-word-count');
  if (wcEl) wcEl.textContent = words;
}

function reapplyHighlights() {
  const scores = window._lastScores;
  if (!scores || !rawContent) return;
  const activeDims = window._activeDims || new Set(Object.keys(DIM_COLORS));
  renderHighlightedEssay(rawContent, scores, activeDims);
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
      const activeDims = window._activeDims || new Set(Object.keys(DIM_COLORS));
      renderHighlightedEssay(rawContent, scores, activeDims);
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
    container.innerHTML = `<div class="essay-editor-content essay-static-view">${plain}</div>`;
  }
}

/* ---- globals ---- */
window.initEditor = initEditor;
window.getEditor = getEditor;
window.clearHighlights = clearHighlights;
window.highlightAllDimensions = highlightAllDimensions;
window.syncHighlights = syncHighlights;
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
