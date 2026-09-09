/**
 * editor.js - Tiptap setup, decoration plugin, selection handling
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

function getParagraphs() {
  if (!editor) return [];
  const doc = editor.state.doc;
  const paragraphs = [];
  doc.forEach((node, offset) => {
    if (node.type.name === 'paragraph') {
      paragraphs.push({
        text: node.textContent,
        from: offset + 1,
        to: offset + node.nodeSize,
      });
    }
  });
  return paragraphs;
}

function findTextInDoc(text) {
  if (!editor) return null;
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

function setDecorations(decorations) {
  if (!editor) return;
  const { state, dispatch } = editor.view;
  const decSet = DecorationSet.create(state.doc, decorations);
  dispatch(state.tr.setMeta(decoKey, decSet));
}

function clearHighlights() {
  setDecorations([]);
  document.querySelectorAll('.essay-rec-card.active').forEach(c => c.classList.remove('active'));
}

function highlightDimension(key) {
  if (!editor) return;
  const scores = window._lastScores;
  if (!scores || !scores[key]) return;

  const data = scores[key];
  const evidence = data.evidence || '';
  if (!evidence) return;

  const range = findTextInDoc(evidence);
  if (!range) {
    const shorter = evidence.length > 40 ? evidence.slice(0, 40) : evidence;
    const range2 = findTextInDoc(shorter);
    if (range2) {
      applyDimensionHighlight(key, range2.from, range2.to);
    }
    return;
  }
  applyDimensionHighlight(key, range.from, range.to);
}

function applyDimensionHighlight(key, from, to) {
  const color = DIM_COLORS[key] || '#8b5cf6';
  const deco = Decoration.inline(from, to, {
    class: `essay-dim-highlight dim-${key}`,
    style: `background: ${color}22; border-bottom: 2px solid ${color};`,
  });
  setDecorations([deco]);
  editor.chain().focus('none').setNodeSelection(from - 1).run();
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
window.getParagraphs = getParagraphs;
window.clearHighlights = clearHighlights;
window.highlightAnnotation = highlightAnnotation;
window.highlightCard = highlightCard;
window.highlightDimension = highlightDimension;

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
