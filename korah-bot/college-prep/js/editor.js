/**
 * editor.js - Tiptap setup, decoration plugin, multi-dim highlighting
 */
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin, PluginKey } from 'prosemirror-state';

let editor = null;
const decoKey = new PluginKey('essayHighlights');

const DIM_COLORS = {
  writing: '#8b5cf6',
  detail: '#3b82f6',
  voice: '#f0abfc',
  reflection: '#fbbf24',
  curiosity: '#34d399',
  contribution: '#f87171',
  focus: '#fbbf24',
};

function highlightPlugin() {
  return new Plugin({
    key: decoKey,
    state: {
      init() { return DecorationSet.empty; },
      apply(tr, old) {
        const meta = tr.getMeta(decoKey);
        if (meta) return meta;
        return old.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) { return this.getState(state); },
    },
  });
}

async function initEditor(content) {
  const { Editor } = await import('tiptap-core');
  const { StarterKit } = await import('tiptap-starter-kit');
  const { Placeholder } = await import('tiptap-placeholder');

  const container = document.getElementById('editor-container');
  if (!container || editor) return;

  editor = new Editor({
    element: container,
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your essay...',
      }),
    ],
    content: content ? `<p>${content.split('\n\n').map(p => p.trim()).filter(Boolean).join('</p><p>')}</p>` : '',
    editorProps: {
      attributes: {
        class: 'essay-editor-content',
      },
    },
    plugins: [highlightPlugin()],
    onUpdate: ({ editor }) => {
      updateWordCount(editor);
    },
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

function getEditor() {
  return editor;
}

function findTextInDoc(text) {
  if (!editor || !text) return null;
  const doc = editor.state.doc;
  let found = null;
  doc.descendants((node, pos) => {
    if (found) return false;
    if (node.isText) {
      const idx = node.text.indexOf(text);
      if (idx !== -1) {
        found = { from: pos + idx, to: pos + idx + text.length };
        return false;
      }
    }
  });
  return found;
}

function findFuzzy(text) {
  if (!editor || !text) return null;
  const range = findTextInDoc(text);
  if (range) return range;

  const trimmed = text.length > 40 ? text.slice(0, 40) : text;
  return findTextInDoc(trimmed);
}

function setDecorations(decorations) {
  if (!editor) return;
  const { state, dispatch } = editor.view;
  const decSet = DecorationSet.create(state.doc, decorations);
  dispatch(state.tr.setMeta(decoKey, decSet));
}

function clearHighlights() {
  setDecorations([]);
}

function highlightAllDimensions() {
  const scores = window._lastScores;
  if (!scores) return;

  if (!editor) {
    let attempts = 0;
    const wait = setInterval(() => {
      attempts++;
      if (editor || attempts > 30) {
        clearInterval(wait);
        if (editor) applyAllHighlights(scores);
      }
    }, 100);
    return;
  }
  applyAllHighlights(scores);
}

function applyAllHighlights(scores) {
  const decs = [];
  const dimKeys = ['writing', 'detail', 'voice', 'reflection', 'curiosity', 'contribution'];

  for (const key of dimKeys) {
    const data = scores[key];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);
    for (const item of items) {
      const range = findFuzzy(item.evidence);
      if (range) {
        const color = DIM_COLORS[key] || '#8b5cf6';
        decs.push(Decoration.inline(range.from, range.to, {
          class: `essay-dim-highlight dim-${key}`,
          style: `background: ${color}22; border-bottom: 2px solid ${color};`,
        }));
      }
    }
  }

  setDecorations(decs);
}

function syncHighlights() {
  const scores = window._lastScores;
  if (!scores || !editor) return;

  const activeDims = window._activeDims || new Set(Object.keys(DIM_COLORS));

  const decs = [];

  for (const key of activeDims) {
    const data = scores[key];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);
    for (const item of items) {
      const range = findFuzzy(item.evidence);
      if (range) {
        const color = DIM_COLORS[key] || '#8b5cf6';
        decs.push(Decoration.inline(range.from, range.to, {
          class: `essay-dim-highlight dim-${key}`,
          style: `background: ${color}22; border-bottom: 2px solid ${color};`,
        }));
      }
    }
  }

  setDecorations(decs);
}

function highlightDimension(key) {
  const scores = window._lastScores;
  if (!scores || !scores[key] || !editor) return;

  const data = scores[key];
  const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);
  const decs = [];
  const color = DIM_COLORS[key] || '#8b5cf6';

  for (const item of items) {
    const range = findFuzzy(item.evidence);
    if (range) {
      decs.push(Decoration.inline(range.from, range.to, {
        class: `essay-dim-highlight dim-${key}`,
        style: `background: ${color}22; border-bottom: 2px solid ${color};`,
      }));
    }
  }

  setDecorations(decs);
}

function highlightAnnotation(id) {
  document.querySelectorAll('.essay-highlight.active').forEach(el => el.classList.remove('active'));
  const el = document.querySelector(`[data-annotation-id="${id}"]`);
  if (el) {
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function highlightCard(id) {
  document.querySelectorAll('.essay-annotation-card.active').forEach(el => el.classList.remove('active'));
  const card = document.querySelector(`[data-card-id="${id}"]`);
  if (card) {
    card.classList.add('active');
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

window.initEditor = initEditor;
window.getEditor = getEditor;
window.clearHighlights = clearHighlights;
window.highlightAllDimensions = highlightAllDimensions;
window.syncHighlights = syncHighlights;
window.highlightDimension = highlightDimension;
window.highlightAnnotation = highlightAnnotation;
window.highlightCard = highlightCard;

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('essay-loaded', (e) => {
    const data = e.detail;
    if (data.content) {
      initEditor(data.content);
    }
  });

  window.addEventListener('analysis-ready', () => {
    if (!editor) {
      const input = document.getElementById('essay-input');
      if (input) initEditor(input.value);
    }
  });
});
