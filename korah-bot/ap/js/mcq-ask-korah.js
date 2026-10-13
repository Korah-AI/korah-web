// Ask Korah for the AP MCQ player. Ported from the SAT player's panel
// (sat/questions.html): a chat tab that knows the current question and an
// Explanation tab with a step-by-step breakdown. Uses the same /api/r streaming
// proxy. The question comes from window.KorahAPPlayer, set by mcq-player.js.
const API_ENDPOINT = '/api/r';
const MODEL = 'gemini-2.5-flash';
const KEYS = ['A', 'B', 'C', 'D'];

const $ = id => document.getElementById(id);
const panel = $('askKorahPanel'), openBtn = $('askKorahBtn'), closeBtn = $('askKorahCloseBtn');
const msgsEl = $('askKorahMessages'), loadEl = $('askKorahLoading'), sendBtn = $('askKorahSendBtn'), inputEl = $('askKorahInput');
const welcome = $('askKorahWelcome'), bodyEl = $('askKorahBody'), tabChat = $('askKorahTabChat'), tabExpl = $('askKorahTabExplain');
const footer = document.querySelector('.ask-korah-footer'), disclaim = document.querySelector('.ask-korah-disclaimer');
const newChatBtn = document.querySelector('.ask-korah-subbtn[data-action="new"]'), historyBtn = document.querySelector('.ask-korah-subbtn[data-action="history"]');

const escapeHtml = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function cheapHash(s) { let h = 0; for (let i = 0; i < (s || '').length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0; return Math.abs(h).toString(36); }

// ── Question context ──
// Figures are sent as their text description plus the SVG source, so the model
// can read coordinates and labels. Tables are sent as rows of cells.
function describeFigure(figure) {
  if (!figure) return '';
  if (figure.table) return `Table (${figure.alt}):\n${[figure.table.headers, ...figure.table.rows].map(r => r.join(' | ')).join('\n')}`;
  return `Figure description: ${figure.alt}\nFigure SVG (coordinates and labels are accurate):\n${figure.svg}`;
}
export function readCurrentQuestion() {
  const current = window.KorahAPPlayer?.getCurrentQuestion?.();
  if (!current) return null;
  const { course, unit, question: q } = current;
  // The id changes when a bank is rebuilt and renumbered, so the stem hash keeps
  // saved chats and explanations tied to the question they were written for.
  return { id: `${q.id}:${cheapHash(q.stem)}`, course, unit, q };
}
export function buildQuestionContextBlock({ course, unit, q }) {
  const lines = [`Course: ${course.name}`, `Unit: ${unit}`, `Skill: ${q.skill}`];
  if (q.calculator) lines.push(`Calculator: ${q.calculator === 'calculator' ? 'allowed' : 'not allowed'}`);
  if (q.kind) lines.push(`Question type: ${q.kind}`);
  if (q.stimulus) {
    lines.push(`Stimulus: ${q.stimulus.title}`);
    lines.push(q.stimulus.text ? `"${q.stimulus.text}"` : describeFigure(q.stimulus.figure));
    lines.push(`Source: ${q.stimulus.attribution}`);
  }
  if (q.figure) lines.push(describeFigure(q.figure));
  lines.push(`Question:\n${q.stem}`, 'Choices:');
  q.choices.forEach((c, i) => lines.push(`  ${KEYS[i]}) ${c}`));
  lines.push(`Correct answer: ${KEYS[q.answer]}`, `Answer key explanation: ${q.explanation}`);
  return lines.join('\n');
}

// ── Streaming API call ──
async function callAPI(userContent, onChunk, { systemPrompt, temperature = 0.2, messages: history = [] } = {}) {
  const res = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Korah-Phase': 'ap-ask-korah' },
    body: JSON.stringify({ model: MODEL, temperature, stream: true, messages: [{ role: 'system', content: systemPrompt }, ...history, { role: 'user', content: userContent }] }),
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  if (!res.body) throw new Error('No response body');
  const reader = res.body.getReader(), decoder = new TextDecoder();
  let full = '', buf = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;
      try {
        const delta = JSON.parse(trimmed.slice(6))?.choices?.[0]?.delta?.content;
        if (delta) { full += delta; onChunk?.(delta, full); }
      } catch { /* partial chunk */ }
    }
  }
  if (!full) throw new Error('Empty response from model');
  return full;
}

// ── Markdown and math rendering ──
function normalizeMathDelimiters(text) {
  return text.split(/(```[\s\S]*?```)/g).map(seg => seg.startsWith('```') ? seg : seg
    .replace(/`([^`]+)`/g, (_, expr) => /[_^\\{}]/.test(expr.trim()) ? '$' + expr.trim() + '$' : '`' + expr + '`')
    .replace(/\\\((.*?)\\\)/gs, (_, e) => '$' + e.trim() + '$')
    .replace(/\\\[(.*?)\\\]/gs, (_, e) => '$$' + e.trim() + '$$')).join('');
}
function renderMarkdownAndMath(container, text) {
  if (!container || !text) return;
  const md = normalizeMathDelimiters(text);
  let html;
  try { html = window.marked?.parse ? window.marked.parse(md) : escapeHtml(md).replace(/\n/g, '<br/>'); }
  catch { html = escapeHtml(md).replace(/\n/g, '<br/>'); }
  // Model output is untrusted: without DOMPurify, fall back to plain text.
  if (window.DOMPurify) container.innerHTML = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true }, FORBID_TAGS: ['img', 'picture', 'video', 'audio', 'iframe', 'form'] });
  else container.textContent = text;
  if (typeof window.renderMathInElement === 'function') window.renderMathInElement(container, {
    delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }, { left: '\\(', right: '\\)', display: false }],
    throwOnError: false,
  });
}

// ── Saved chats and explanations (this browser only) ──
const chatKey = id => `korahApChat_${id}`, explainKey = id => `korahApExplain_${id}`;
const readStore = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const writeStore = (key, value) => { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage full or blocked */ } };
function saveCurrentChat() {
  if (!chatDirty || !chatHistory.length || !currentQ) return;
  chatDirty = false;
  writeStore(chatKey(currentQ.id), [{ ts: Date.now(), messages: chatHistory.slice() }, ...readStore(chatKey(currentQ.id), [])].slice(0, 8));
}

// ── Panel state ──
let currentQ = null, activeTab = 'chat', explainSource = 'korah', chatHistory = [], lastQuestionId = null;
let explanationLoading = false, showingHistory = false, busy = false;
let chatDirty = false; // true while the open conversation has messages not yet saved

function syncQuestion() {
  const next = readCurrentQuestion();
  if (next && next.id !== lastQuestionId) {
    saveCurrentChat();
    chatHistory = [];
    msgsEl.innerHTML = '';
    lastQuestionId = next.id;
    showingHistory = false;
  }
  currentQ = next;
  return !!next;
}
function openPanel() {
  if (!syncQuestion()) return;
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('ask-korah-open');
  showTab(activeTab);
}
function closePanel() {
  if (!panel.classList.contains('open')) return;
  saveCurrentChat();
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('ask-korah-open');
  openBtn.focus();
}
// Moving to another question while the panel is open retargets it.
export function onQuestionChange() { if (panel.classList.contains('open') && !busy && syncQuestion()) showTab(activeTab); }

function showTab(tab) {
  bodyEl.classList.remove('is-switching');
  void bodyEl.offsetWidth;
  bodyEl.classList.add('is-switching');
  activeTab = tab;
  const isChat = tab === 'chat';
  tabChat.classList.toggle('active', isChat);
  tabExpl.classList.toggle('active', !isChat);
  tabChat.setAttribute('aria-selected', isChat); tabExpl.setAttribute('aria-selected', !isChat);
  footer.style.display = isChat ? 'flex' : 'none';
  disclaim.style.display = isChat ? 'block' : 'none';
  msgsEl.innerHTML = '';
  if (isChat) {
    welcome.classList.toggle('is-hidden', chatHistory.length > 0);
    chatHistory.forEach(m => appendChatMessage(m.role, m.content, false));
  } else {
    welcome.classList.add('is-hidden');
    renderExplanation();
  }
}

function renderHistoryPanel() {
  msgsEl.innerHTML = '';
  welcome.classList.add('is-hidden');
  footer.style.display = 'none';
  disclaim.style.display = 'none';
  const sessions = readStore(chatKey(currentQ.id), []);
  const wrap = document.createElement('div');
  wrap.className = 'ask-korah-history';
  wrap.innerHTML = `<div class="ask-korah-history-head">${sessions.length ? `Saved conversations (${sessions.length})` : 'No saved conversations for this question yet'}</div>`;
  sessions.forEach(session => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'ask-korah-history-item';
    const preview = session.messages.find(m => m.role === 'user')?.content || '';
    const date = new Date(session.ts).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    item.innerHTML = `<span class="ask-korah-history-date">${escapeHtml(date)}</span><span class="ask-korah-history-preview">${escapeHtml(preview.slice(0, 90))}</span>`;
    item.addEventListener('click', () => { saveCurrentChat(); chatHistory = session.messages.slice(); showingHistory = false; showTab('chat'); });
    wrap.appendChild(item);
  });
  msgsEl.appendChild(wrap);
}

// ── Chat tab ──
function appendChatMessage(role, content, persist = true) {
  const el = document.createElement('div');
  el.className = 'ask-korah-msg ' + (role === 'user' ? 'user' : 'korah');
  if (role === 'user') el.textContent = content;
  else { const md = document.createElement('div'); md.className = 'ask-korah-md'; renderMarkdownAndMath(md, content); el.appendChild(md); }
  msgsEl.appendChild(el);
  msgsEl.scrollTop = msgsEl.scrollHeight;
  if (persist) { chatHistory.push({ role, content }); chatDirty = true; }
  return el;
}
function chatSystemPrompt(q) {
  return `You are Korah, an AP tutor helping a student with one ${q.course.name} multiple-choice practice question. Be concise and encouraging, and reason step by step.

When the student asks for an explanation or a breakdown, give an AP-style breakdown: (1) the unit, topic, and skill the question tests, (2) the reasoning that leads to the correct answer, citing the stimulus, figure, or data where there is one, (3) why each incorrect choice is tempting and why it is wrong, and (4) one tip for similar questions on the AP Exam.

Use Markdown for structure and KaTeX ($inline$ or $$display$$) for any math. Do not state which choice is correct unless the student asks for the answer or for a full explanation; otherwise guide them toward it. Stay on this question and the course content behind it. The answer key is provided so that your guidance is accurate; if you believe it is wrong, say so and explain why.

=== CURRENT QUESTION ===
${buildQuestionContextBlock(q)}`;
}
async function sendFollowUp() {
  const text = inputEl.value.trim();
  if (!text || busy || !currentQ) return;
  if (showingHistory) { showingHistory = false; showTab('chat'); }
  inputEl.value = '';
  welcome.classList.add('is-hidden');
  const history = chatHistory.filter(m => m.role === 'user' || m.role === 'assistant').map(m => ({ role: m.role, content: m.content }));
  appendChatMessage('user', text);
  const assistantEl = document.createElement('div');
  assistantEl.className = 'ask-korah-msg korah';
  const md = document.createElement('div');
  md.className = 'ask-korah-md';
  md.textContent = '…';
  assistantEl.appendChild(md);
  msgsEl.appendChild(assistantEl);
  msgsEl.scrollTop = msgsEl.scrollHeight;
  busy = true; sendBtn.disabled = true;
  loadEl.classList.remove('is-hidden');
  try {
    const reply = await callAPI(text, (_d, full) => { renderMarkdownAndMath(md, full); msgsEl.scrollTop = msgsEl.scrollHeight; }, { systemPrompt: chatSystemPrompt(currentQ), temperature: 0.3, messages: history });
    renderMarkdownAndMath(md, reply);
    chatHistory.push({ role: 'assistant', content: reply });
    chatDirty = true;
  } catch (err) {
    console.error('[AP Ask Korah chat]', err);
    md.textContent = 'Sorry, something went wrong. Please try again.';
    chatHistory.pop(); // drop the unanswered question so a retry does not send it twice
  } finally {
    busy = false; sendBtn.disabled = false;
    loadEl.classList.add('is-hidden');
  }
}

// ── Explanation tab ──
const EXPLANATION_PROMPT = `You are Korah, an AP tutor writing a step-by-step breakdown of one AP multiple-choice practice question.

OUTPUT FORMAT: output ONLY a raw JSON object, with no code fences and no commentary:

{
  "answer": "A, B, C, or D",
  "summary": "one sentence naming the unit, topic, and skill being tested",
  "steps": [
    { "title": "short label", "body": "markdown + KaTeX explanation of this step" }
  ]
}

RULES:
- 4 to 6 steps, each 1 to 4 sentences. Use KaTeX ($inline$ or $$display$$) for every variable and equation.
- Step 1 says what the question is asking and which AP topic and skill it tests. The middle steps work through the reasoning, using the stimulus, figure, or data when there is one. One step explains why the most tempting incorrect choices are wrong. The final step states the answer and gives one tip for similar AP Exam questions.
- Agree with the answer key provided unless it is clearly wrong; if it is, say so in the final step.
- Do NOT wrap the JSON in code fences. Do NOT add prose before or after the JSON.`;

export function parseExplanationJSON(raw) {
  if (!raw) return null;
  let s = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  const brace = s.indexOf('{');
  if (brace === -1) return null;
  s = s.slice(brace);
  // LaTeX backslashes inside JSON strings are often left single (\frac); double them and retry.
  const repair = str => str.replace(/"((?:[^"\\]|\\[\s\S])*?)"/g, (_, inner) => `"${inner.replace(/\\(?!["\\/bfnrtu])/g, '\\\\')}"`);
  for (const candidate of [s, repair(s)]) { try { const r = JSON.parse(candidate); if (Array.isArray(r?.steps)) return r; } catch { /* try next */ } }
  // Trailing text after the object: keep only the outermost braces.
  let depth = 0, inStr = false, esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    else if (ch === '}' && --depth === 0) {
      const chunk = s.slice(0, i + 1);
      for (const candidate of [chunk, repair(chunk)]) { try { const r = JSON.parse(candidate); if (Array.isArray(r?.steps)) return r; } catch { /* try next */ } }
      break;
    }
  }
  return null;
}

function renderExplanation() {
  msgsEl.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'ask-korah-explanation';
  const toggle = document.createElement('div');
  toggle.className = 'explain-source-toggle';
  for (const [source, label] of [['korah', 'Korah Breakdown'], ['key', 'Answer Key']]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = explainSource === source ? 'active' : '';
    btn.addEventListener('click', () => { if (explainSource !== source && !explanationLoading) { explainSource = source; renderExplanation(); } });
    toggle.appendChild(btn);
  }
  const body = document.createElement('div');
  body.className = 'explain-body';
  root.append(toggle, body);
  msgsEl.appendChild(root);
  if (explainSource === 'key') {
    const q = currentQ.q;
    body.innerHTML = `<div class="explain-answer"><span class="material-icons-round" style="font-size:1rem;">check_circle</span> Answer: ${KEYS[q.answer]}</div>`;
    const card = document.createElement('div');
    card.className = 'explain-cb-body';
    renderMarkdownAndMath(card, q.explanation);
    body.appendChild(card);
  } else renderKorahExplanation(body);
}
async function renderKorahExplanation(body) {
  const target = currentQ, cached = readStore(explainKey(target.id), null);
  if (cached?.steps?.length) return drawExplanation(body, cached, true);
  if (explanationLoading) return;
  explanationLoading = true; busy = true;
  body.innerHTML = '<div class="ask-korah-loading">Writing a step-by-step breakdown…</div>';
  try {
    const raw = await callAPI(`Write the step-by-step breakdown for this ${target.course.name} question.\n\n${buildQuestionContextBlock(target)}`, null, { systemPrompt: EXPLANATION_PROMPT, temperature: 0.2 });
    let parsed = parseExplanationJSON(raw);
    if (!parsed?.steps?.length) {
      if (raw.trim().length <= 20) throw new Error('Model returned no parseable steps');
      parsed = { answer: KEYS[target.q.answer], steps: [{ title: 'Explanation', body: raw.trim() }] };
    } else writeStore(explainKey(target.id), { answer: parsed.answer, summary: parsed.summary, steps: parsed.steps });
    if (currentQ === target && activeTab === 'explanation' && explainSource === 'korah') { body.innerHTML = ''; drawExplanation(body, parsed, false); }
  } catch (err) {
    console.error('[AP Ask Korah explanation]', err);
    if (currentQ === target) body.innerHTML = '<div class="ask-korah-msg korah">Sorry, a breakdown could not be loaded right now. The Answer Key tab has the written explanation.</div>';
  } finally {
    explanationLoading = false; busy = false;
  }
}
function drawExplanation(root, data, fromCache) {
  if (data.answer) root.insertAdjacentHTML('beforeend', `<div class="explain-answer"><span class="material-icons-round" style="font-size:1rem;">check_circle</span> Answer: ${escapeHtml(String(data.answer))}</div>`);
  if (data.summary) { const s = document.createElement('div'); s.className = 'ask-korah-md'; renderMarkdownAndMath(s, String(data.summary)); root.appendChild(s); }
  data.steps.forEach((step, i) => {
    const card = document.createElement('div');
    card.className = 'explain-step';
    card.innerHTML = `<div class="explain-step-head"><span class="explain-step-num">${i + 1}</span><span>${escapeHtml(step.title || `Step ${i + 1}`)}</span></div>`;
    const stepBody = document.createElement('div');
    stepBody.className = 'explain-step-body';
    renderMarkdownAndMath(stepBody, String(step.body || ''));
    card.appendChild(stepBody);
    root.appendChild(card);
  });
  if (fromCache) root.insertAdjacentHTML('beforeend', '<div class="explain-cached">saved</div>');
}

// ── Wiring ──
if (panel && openBtn) {
  openBtn.addEventListener('click', () => (panel.classList.contains('open') ? closePanel() : openPanel()));
  closeBtn.addEventListener('click', closePanel);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePanel(); });
  tabChat.addEventListener('click', () => { showingHistory = false; showTab('chat'); });
  tabExpl.addEventListener('click', () => { showingHistory = false; showTab('explanation'); });
  newChatBtn.addEventListener('click', () => { saveCurrentChat(); chatHistory = []; showingHistory = false; showTab('chat'); });
  historyBtn.addEventListener('click', () => {
    showingHistory = !showingHistory;
    if (showingHistory) { if (activeTab !== 'chat') showTab('chat'); renderHistoryPanel(); } else showTab('chat');
  });
  document.querySelectorAll('.ask-korah-suggestion').forEach(btn => btn.addEventListener('click', () => { inputEl.value = btn.dataset.prompt || btn.textContent.trim(); sendFollowUp(); }));
  sendBtn.addEventListener('click', sendFollowUp);
  inputEl.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowUp(); } });
  window.addEventListener('korahAPQuestionChange', onQuestionChange);
  window.addEventListener('pagehide', saveCurrentChat);
}
