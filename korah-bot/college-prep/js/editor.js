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
  if (!container || editor) {
    if (editor && window._pendingHighlights) {
      const scores = window._pendingHighlights;
      window._pendingHighlights = null;
      const decs = buildDecsForDims(
        ['writing', 'detail', 'voice', 'reflection', 'curiosity', 'contribution'],
        scores
      );
      setDecorations(decs);
    }
    return editor;
  }

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

  if (window._pendingHighlights) {
    const scores = window._pendingHighlights;
    window._pendingHighlights = null;
    const decs = buildDecsForDims(
      ['writing', 'detail', 'voice', 'reflection', 'curiosity', 'contribution'],
      scores
    );
    setDecorations(decs);
  }

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

/**
 * Build full plain text from the doc and map character offsets to
 * ProseMirror positions. Returns { fullText, posMap } where posMap[i]
 * is the ProseMirror position for character index i in fullText.
 */
function buildFullText() {
  if (!editor) return null;
  const doc = editor.state.doc;
  let fullText = '';
  const posMap = [];

  doc.descendants((node, pos) => {
    if (node.isText) {
      for (let i = 0; i < node.text.length; i++) {
        posMap.push(pos + i);
      }
      fullText += node.text;
    }
  });

  return { fullText, posMap };
}

function findTextInDoc(text) {
  if (!editor || !text) return null;
  const built = buildFullText();
  if (!built) return null;
  const { fullText, posMap } = built;

  const idx = fullText.indexOf(text);
  if (idx === -1) return null;

  return {
    from: posMap[idx],
    to: posMap[idx + text.length - 1] + 1,
  };
}

function findFuzzy(text) {
  if (!editor || !text) return null;

  let range = findTextInDoc(text);
  if (range) { console.log('[highlight] exact match:', text.slice(0, 40)); return range; }

  const trimmed = text.length > 50 ? text.slice(0, 50) : text;
  range = findTextInDoc(trimmed);
  if (range) { console.log('[highlight] 50-char match:', trimmed.slice(0, 40)); return range; }

  const words = text.split(/\s+/).slice(0, 6);
  const short = words.join(' ');
  range = findTextInDoc(short);
  if (range) { console.log('[highlight] 6-word match:', short); return range; }

  console.log('[highlight] NO match for:', text.slice(0, 60));
  return null;
}

function setDecorations(decorations) {
  if (!editor) return;
  const { state, dispatch } = editor.view;
  const decSet = DecorationSet.create(state.doc, decorations);
  console.log('[highlight] dispatching', decorations.length, 'decorations');
  dispatch(state.tr.setMeta(decoKey, decSet));
}

function clearHighlights() {
  setDecorations([]);
}

function buildDecsForDims(dimKeys, scores) {
  const decs = [];
  for (const key of dimKeys) {
    const data = scores[key];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);
    console.log(`[highlight] ${key}: ${items.length} items`);
    for (const item of items) {
      const range = findFuzzy(item.evidence);
      if (range) {
        decs.push(Decoration.inline(range.from, range.to, {
          class: `essay-dim-highlight dim-${key}`,
        }));
      }
    }
  }
  return decs;
}

function highlightAllDimensions() {
  const scores = window._lastScores;
  console.log('[highlight] scores:', scores);
  if (!scores) return;

  if (!editor) {
    console.log('[highlight] editor not ready, storing pending');
    window._pendingHighlights = scores;
    return;
  }

  const decs = buildDecsForDims(
    ['writing', 'detail', 'voice', 'reflection', 'curiosity', 'contribution'],
    scores
  );
  console.log('[highlight] decorations created:', decs.length);
  setDecorations(decs);
}

function syncHighlights() {
  const scores = window._lastScores;
  if (!scores || !editor) return;

  const activeDims = window._activeDims || new Set(Object.keys(DIM_COLORS));
  const decs = buildDecsForDims([...activeDims], scores);
  console.log('[highlight] sync:', decs.length, 'decorations for', [...activeDims].join(','));
  setDecorations(decs);
}

function highlightDimension(key) {
  const scores = window._lastScores;
  if (!scores || !scores[key] || !editor) return;
  const decs = buildDecsForDims([key], scores);
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
