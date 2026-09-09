/**
 * editor.js - Tiptap setup + DOM-based highlighting
 */
let editor = null;

const DIM_COLORS = {
  writing: '#8b5cf6',
  detail: '#3b82f6',
  voice: '#f0abfc',
  reflection: '#fbbf24',
  curiosity: '#34d399',
  contribution: '#f87171',
  focus: '#fbbf24',
};

async function initEditor(content) {
  const { Editor } = await import('tiptap-core');
  const { StarterKit } = await import('tiptap-starter-kit');
  const { Placeholder } = await import('tiptap-placeholder');

  const container = document.getElementById('editor-container');
  if (!container || editor) {
    applyPendingHighlights();
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
    onUpdate: ({ editor }) => {
      updateWordCount(editor);
    },
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

function getEditor() {
  return editor;
}

function getProseMirrorEl() {
  if (!editor) return null;
  return editor.view.dom.querySelector('.ProseMirror');
}

function removeHighlights() {
  const pm = getProseMirrorEl();
  if (!pm) return;
  pm.querySelectorAll('mark.essay-dim-highlight').forEach(el => {
    const parent = el.parentNode;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });
  pm.normalize();
}

function applyHighlights(scores) {
  if (!editor || !scores) return;

  removeHighlights();

  const dimKeys = ['writing', 'detail', 'voice', 'reflection', 'curiosity', 'contribution'];

  for (const key of dimKeys) {
    const data = scores[key];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);

    for (const item of items) {
      let evidence = item.evidence || '';
      if (!evidence) continue;

      const variants = [evidence];
      if (evidence.length > 50) variants.push(evidence.slice(0, 50));
      const words = evidence.split(/\s+/).slice(0, 8).join(' ');
      if (words.length > 3) variants.push(words);

      for (const variant of variants) {
        if (highlightTextInDOM(variant, key)) break;
      }
    }
  }
}

function highlightTextInDOM(searchText, dimKey) {
  const pm = getProseMirrorEl();
  if (!pm) return false;

  const walker = document.createTreeWalker(pm, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  const fullText = textNodes.map(n => n.textContent).join('');
  const idx = fullText.indexOf(searchText);
  if (idx === -1) return false;

  let charIdx = 0;
  for (const textNode of textNodes) {
    const nodeStart = charIdx;
    const nodeEnd = charIdx + textNode.textContent.length;

    if (idx >= nodeStart && idx < nodeEnd) {
      const localFrom = idx - nodeStart;
      const localTo = Math.min(localFrom + searchText.length, textNode.textContent.length);
      const text = textNode.textContent;
      const before = text.slice(0, localFrom);
      const match = text.slice(localFrom, localTo);
      const after = text.slice(localTo);

      const parent = textNode.parentNode;
      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      const mark = document.createElement('mark');
      mark.className = `essay-dim-highlight dim-${dimKey}`;
      mark.textContent = match;
      frag.appendChild(mark);
      if (after) frag.appendChild(document.createTextNode(after));
      parent.replaceChild(frag, textNode);
      return true;
    }
    charIdx = nodeEnd;
  }
  return false;
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

function syncHighlights() {
  const scores = window._lastScores;
  if (!scores || !editor) return;

  const activeDims = window._activeDims || new Set(Object.keys(DIM_COLORS));
  removeHighlights();

  const dimKeys = [...activeDims];

  for (const key of dimKeys) {
    const data = scores[key];
    if (!data) continue;
    const items = data.items || (data.evidence ? [{ evidence: data.evidence }] : []);

    for (const item of items) {
      let evidence = item.evidence || '';
      if (!evidence) continue;

      const variants = [evidence];
      if (evidence.length > 50) variants.push(evidence.slice(0, 50));
      const words = evidence.split(/\s+/).slice(0, 8).join(' ');
      if (words.length > 3) variants.push(words);

      for (const variant of variants) {
        if (highlightTextInDOM(variant, key)) break;
      }
    }
  }
}

function highlightDimension(key) {
  const scores = window._lastScores;
  if (!scores || !editor) return;
  removeHighlights();
  applyHighlights(scores);
}

function clearHighlights() {
  removeHighlights();
}

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
    } else {
      applyPendingHighlights();
    }
  });
});
