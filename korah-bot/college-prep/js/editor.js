/**
 * editor.js - Tiptap setup, decoration plugin, selection handling
 */

let editor = null;
let decorationPlugin = null;
let activeHighlights = new Map();

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

async function createHighlightDecoration(from, to, type, id) {
  if (!editor) return null;
  const { Decoration } = await import('prosemirror-view');
  const deco = Decoration.inline(from, to, {
    class: `essay-highlight ${type}`,
    'data-annotation-id': id,
  });
  return deco;
}

function clearHighlights() {
  activeHighlights.clear();
  if (editor) {
    editor.chain().focus().run();
  }
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

document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('essay-loaded', (e) => {
    const data = e.detail;
    if (data.content) {
      initEditor(data.content);
    }
  });

  window.addEventListener('analysis-ready', (e) => {
    if (!editor) {
      const input = document.getElementById('essay-input');
      if (input) initEditor(input.value);
    }
  });
});
