/**
 * ask.js - "Ask for feedback on this" over a highlighted passage.
 *
 * Select text in the essay and a pill follows the selection. Clicking it drops
 * down an input; the question and the passage go to the model and the answer
 * lands in the review column as its own card.
 */
import EssayAPI from './api.js';
import EssayScoring from './scoring.js';

const pop = document.getElementById('ask-pop');
const trigger = document.getElementById('ask-pop-trigger');
const form = document.getElementById('ask-pop-form');
const input = document.getElementById('ask-pop-input');

// The passage the open popup is about, captured before the selection is lost.
let target = null;

function getAlpineData() {
  const el = document.querySelector('[x-data]');
  if (!el || !el._x_dataStack) return null;
  return el._x_dataStack[0];
}

function hide() {
  pop.setAttribute('hidden', '');
  form.setAttribute('hidden', '');
  input.value = '';
  target = null;
}

/* The pill is centred under the selection, or above it when the selection sits
   at the bottom of the window. */
function showAt(rect) {
  pop.removeAttribute('hidden');
  form.setAttribute('hidden', '');
  const half = pop.offsetWidth / 2;
  const cx = Math.min(Math.max(rect.left + rect.width / 2, half + 8), window.innerWidth - half - 8);
  const below = rect.bottom + 8;
  const fits = below + pop.offsetHeight < window.innerHeight - 8;
  pop.style.left = `${cx}px`;
  pop.style.top = `${fits ? below : rect.top - pop.offsetHeight - 8}px`;
}

function onSelect() {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return;

  const text = sel.toString().replace(/\s+/g, ' ').trim();
  if (text.length < 3) return;

  const node = sel.anchorNode;
  const el = node && (node.nodeType === 1 ? node : node.parentElement);
  const view = el && el.closest('.essay-editor-content');
  if (!view) return;

  const para = el.closest('p');
  target = { text, context: para ? para.textContent.replace(/\s+/g, ' ').trim() : text };
  showAt(sel.getRangeAt(0).getBoundingClientRect());
}

async function ask(question) {
  const passage = target;
  hide();

  const cardId = EssayScoring.renderAskCard(question, passage.text);
  if (window.syncHighlights) window.syncHighlights();

  const d = getAlpineData();
  const prompt = d ? (d.essayType === 'supplemental' ? d.schoolPrompt : d.applicationPrompt) : '';
  const feedback = await EssayAPI.feedbackOnSelection(
    passage.text, passage.context, question,
    d ? d.essayType : 'personal_statement', d ? d.school : '', prompt
  );
  EssayScoring.fillAskCard(cardId, feedback);
}

/* Deferred so the selection is settled by the time it is read. Clicks inside
   the popup are skipped: the essay text is still selected under them, and
   re-showing would collapse the input the click just opened. */
document.addEventListener('mouseup', (e) => {
  if (pop.contains(e.target)) return;
  setTimeout(onSelect, 0);
});

trigger.addEventListener('click', () => {
  form.removeAttribute('hidden');
  input.focus();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const question = input.value.trim();
  if (!question || !target) return;
  ask(question);
});

// Clicking away drops the popup, but clicking inside it must not.
document.addEventListener('mousedown', (e) => {
  if (!pop.hasAttribute('hidden') && !pop.contains(e.target)) hide();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !pop.hasAttribute('hidden')) hide();
});

// A pill pinned to a passage that has scrolled away is just litter.
document.addEventListener('scroll', () => {
  if (form.hasAttribute('hidden')) hide();
}, true);
