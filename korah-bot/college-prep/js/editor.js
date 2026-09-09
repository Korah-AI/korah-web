/**
 * editor.js - Tiptap setup + ProseMirror Decoration-based highlighting
 */
let editor = null;
let decorationPlugin = null;
let PMDecoration = null;
let PMDecorationSet = null;

const DIM_COLORS = {
  writing:    '#8b5cf6',
  detail:     '#3b82f6',
  voice:      '#f0abfc',
  reflection: '#fbbf24',
  curiosity:  '#34d399',
  contribution: '#f87171',
};

async function initEditor(content) {
  const { Editor } = await import('tiptap-core');
  const { StarterKit } = await import('tiptap-starter-kit');
  const { Placeholder } = await import('tiptap-placeholder');
  const { Plugin, PluginKey } = await import('prosemirror-state');
  const pmv = await import('prosemirror-view');
  PMDecoration = pmv.Decoration;
  PMDecorationSet = pmv.DecorationSet;

  const pk = new PluginKey('essayHighlights');
  decorationPlugin = new Plugin({
    key: pk,
    state: {
      init() { return PMDecorationSet.empty; },
      apply(tr, old) {
        const meta = tr.getMeta(pk);
        if (meta && meta.set !== undefined) return meta.set;
        return old.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) { return this.getState(state); },
    },
  });

  const container = document.getElementById('editor-container');
  if (!container || editor) {
    applyPendingHighlights();
    return editor;
  }

  const html = content
    ? `<p>${content.split('\n\n').map(p => p.trim()).filter(Boolean).join('</p><p>')}</p>`
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
    plugins: [decorationPlugin],
    onUpdate: ({ editor }) => updateWordCount(editor),
  });

  updateWordCount(editor);
  applyPendingHighlights();
  return editor;
}

function applyPendingHighlights() {
  if (!editor || !window._pendingHighlights) return;
  const scores = window._pendingHighlights;
  window._pendingHighlights = null;
  applyHighlights(scores);
}

function updateWordCount(ed) {
  const text = ed.getText();
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const el = document.getElementById('editor-word-count');
  if (el) el.textContent = words;
}

function getEditor() { return editor; }

function setDecorations(decoSet) {
  if (!editor || !decorationPlugin) return;
  const pk = decorationPlugin.key;
  editor.chain().command(({ tr, dispatch }) => {
    tr.setMeta(pk, { set: decoSet });
    if (dispatch) dispatch(tr);
    return true;
  }).run();
}

function clearDecorations() {
  if (PMDecorationSet) setDecorations(PMDecorationSet.empty);
}

function findTextInDoc(doc, searchText) {
  const textNodes = [];
  doc.descendants((node, pos) => {
    if (node.isText) {
      textNodes.push({ text: node.text, pos });
    }
  });

  const fullText = textNodes.map(n => n.text).join('');
  const idx = fullText.indexOf(searchText);
  if (idx === -1) return null;

  let charIdx = 0;
  for (const tn of textNodes) {
    const nodeStart = charIdx;
    const nodeEnd = charIdx + tn.text.length;
    if (idx >= nodeStart && idx < nodeEnd) {
      const localFrom = idx - nodeStart;
      const localTo = Math.min(localFrom + searchText.length, tn.text.length);
      return { from: tn.pos + localFrom, to: tn.pos + localTo };
    }
    charIdx = nodeEnd;
  }
  return null;
}

function buildHighlightDecos(scores, dimKeys) {
  if (!editor || !PMDecoration) return PMDecorationSet.empty;

  const doc = editor.state.doc;
  const decos = [];

  for (const key of dimKeys) {
    const data = scores[key];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);

    for (const item of items) {
      let evidence = (item.evidence || '').replace(/\s+/g, ' ').trim();
      if (!evidence) continue;

      const variants = [evidence];
      if (evidence.length > 50) variants.push(evidence.slice(0, 50));
      const words = evidence.split(/\s+/).slice(0, 8).join(' ');
      if (words.length > 3) variants.push(words);

      for (const variant of variants) {
        const found = findTextInDoc(doc, variant);
        if (found) {
          decos.push(PMDecoration.inline(found.from, found.to, {
            class: `essay-dim-highlight dim-${key}`,
          }));
          break;
        }
      }
    }
  }

  return PMDecorationSet.create(doc, decos);
}

function applyHighlights(scores) {
  if (!editor || !scores) return;
  const dimKeys = Object.keys(DIM_COLORS);
  const decoSet = buildHighlightDecos(scores, dimKeys);
  setDecorations(decoSet);
}

function syncHighlights() {
  const scores = window._lastScores;
  if (!scores || !editor) return;
  const activeDims = window._activeDims || new Set(Object.keys(DIM_COLORS));
  const dimKeys = [...activeDims];
  const decoSet = buildHighlightDecos(scores, dimKeys);
  setDecorations(decoSet);
}

function highlightAllDimensions() {
  const scores = window._lastScores;
  if (!scores) return;
  if (!editor) {
    window._pendingHighlights = scores;
    return;
  }
  applyHighlights(scores);
}

function highlightDimension(key) {
  const scores = window._lastScores;
  if (!scores || !editor) return;
  clearDecorations();
  applyHighlights(scores);
}

function clearHighlights() { clearDecorations(); }

window.initEditor = initEditor;
window.getEditor = getEditor;
window.clearHighlights = clearHighlights;
window.highlightAllDimensions = highlightAllDimensions;
window.syncHighlights = syncHighlights;
window.highlightDimension = highlightDimension;

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('essay-loaded', (e) => {
    const data = e.detail;
    if (data.content) initEditor(data.content);
  });

  window.addEventListener('analysis-ready', () => {
    if (!editor) {
      const input = document.getElementById('essay-input');
      if (input) initEditor(input.value);
    }
  });
});
