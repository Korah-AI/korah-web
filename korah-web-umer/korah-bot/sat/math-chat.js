console.log('math-chat.js loading...');
(() => {
  try {
  console.log('math-chat.js try block entered');
  const API_ENDPOINT = "/api/r";
  const MODEL = "gemini-2.5-flash";

  // Classification + state adaptation happen in a SINGLE API call (see
  // runMergedClassifyAdapt): the model receives all problem-solver skeletons
  // inline and, in one shot, picks the template AND fills it for the student's
  // problem. This deletes the old Phase-1 classification round-trip. The ~17 KB
  // of skeletons rides along uncached — Gemini 2.5's implicit caching discounts
  // the stable prefix for free. The call carries both classification (wants to
  // stay strict) and adaptation (wants a little freedom), so keep temp low.
  const MERGED_TEMPERATURE = 0.2;

  const input = document.getElementById("chat-input");
  const welcomeInput = document.getElementById("welcome-chat-input");
  const sendBtn = document.getElementById("send-btn");
  const welcomeSendBtn = document.getElementById("welcome-send-btn");
  const messagesList = document.getElementById("messages-list");
  const welcomeScreen = document.getElementById("welcome-screen");
  const typingIndicator = document.getElementById("typing-indicator");
  const chatBody = document.getElementById("chat-body");
  const suggestionBar = document.getElementById("suggestion-bar");
  const clearChatBtn = document.getElementById("clear-chat-btn");

  let satMathCalculator = null;
  let graphExpressions = [];
  let isGraphInitialized = false;

  // ─── Session State ────────────────────────────────────────────────────────
  let currentSessionId = null;
  let currentSession   = null;
  let conversationHistory = []; // [{ role: 'user'|'assistant', content: string }]

  // ─── Desmos Template Library ──────────────────────────────────────────────
  let _templateIndex = null;
  const _exampleCache = {};
  const _templateCache = {};

  async function loadTemplateIndex() {
    if (_templateIndex) return _templateIndex;
    try {
      const res = await fetch('./template-index.json');
      _templateIndex = await res.json();
    } catch (e) {
      console.error('Failed to load template-index.json:', e);
      _templateIndex = [];
    }
    return _templateIndex;
  }

  async function loadExample(id) {
    if (_exampleCache[id]) return _exampleCache[id];
    const res = await fetch(`./desmos-json/${id}.json`);
    _exampleCache[id] = await res.json();
    return _exampleCache[id];
  }

  async function loadTemplate(id) {
    if (_templateCache[id]) return _templateCache[id];
    const res = await fetch(`./desmos-json/templates/${id}.json`);
    _templateCache[id] = await res.json();
    return _templateCache[id];
  }

  // Load every problem-solver skeleton (visualizers have no skeleton — they load
  // their verified example as-is). Used by the merged pipeline, which hands the
  // model all skeletons at once so it can classify AND fill one in a single call.
  let _allSkeletons = null;
  async function loadAllSkeletons() {
    if (_allSkeletons) return _allSkeletons;
    const index = await loadTemplateIndex();
    const solverIds = index.filter(t => t.type === 'problem-solver').map(t => t.id);
    const results = await Promise.all(solverIds.map(async id => {
      try { return { id, skeleton: await loadTemplate(id) }; }
      catch (e) { console.warn(`Failed to load skeleton "${id}":`, e); return null; }
    }));
    _allSkeletons = results.filter(Boolean);
    return _allSkeletons;
  }

  function buildTemplateIndexBlock(index) {
    const lines = index.map(t =>
      `  { "id": "${t.id}", "type": "${t.type}", "name": "${t.name}", "description": "${t.description.replace(/"/g, '\\"')}", "keywords": [${t.keywords.map(k => `"${k}"`).join(', ')}] }`
    );
    return `AVAILABLE TEMPLATES — pick the best match by id, or null if none fit:\n[\n${lines.join(',\n')}\n]`;
  }

  // Validate a Desmos state object before calling setState().
  // Catches the common failure modes described in docs/desmos-template-library-plan.md.
  function validateDesmosState(state) {
    const errors = [];
    if (!state || typeof state !== 'object') { errors.push('state is not an object'); return errors; }
    if (!state.expressions || !Array.isArray(state.expressions.list)) {
      errors.push('state.expressions.list is missing or not an array');
      return errors;
    }
    const list = state.expressions.list;
    const ids = new Set();
    let seenTable = false;
    let tableHasX1 = false;
    let tableHasY1 = false;

    list.forEach((expr, idx) => {
      if (!expr || typeof expr !== 'object') { errors.push(`expr[${idx}] is not an object`); return; }
      if (!expr.type) { errors.push(`expr[${idx}] missing "type"`); return; }
      if (expr.id) {
        if (ids.has(expr.id)) errors.push(`duplicate id "${expr.id}" at expr[${idx}]`);
        ids.add(expr.id);
      }
      if (expr.type === 'text' && 'color' in expr) {
        errors.push(`expr[${idx}] is a text node and must not have a "color" field`);
      }
      if (expr.type === 'table') {
        seenTable = true;
        const cols = expr.columns || [];
        cols.forEach((c, ci) => {
          const lx = (c.latex || '').replace(/\s/g, '');
          if (lx === 'x_{1}' || lx === 'x_1') tableHasX1 = true;
          if (lx === 'y_{1}' || lx === 'y_1') tableHasY1 = true;
          if (lx === 'x' || lx === 'y') {
            errors.push(`expr[${idx}] table column ${ci} uses bare "${lx}" — must use subscript (x_1 / y_1)`);
          }
        });
      }
      if (expr.type === 'expression' && typeof expr.latex === 'string') {
        const lx = expr.latex;
        // A regression with x_1 / y_1 that comes before any table is broken,
        // UNLESS the expression declares its own regressionParameters (in which case
        // x_{1} is a fitted parameter, not a table column reference).
        const hasTilde = lx.includes('\\sim') || /(?:^|[^\\])~/.test(lx);
        const refsTableVar = /x_\{?1\}?|y_\{?1\}?/.test(lx);
        const hasOwnRegParams = expr.regressionParameters && typeof expr.regressionParameters === 'object';
        if (hasTilde && refsTableVar && !seenTable && !hasOwnRegParams) {
          errors.push(`expr[${idx}] regression references x_1/y_1 but no preceding table found`);
        }
      }
    });

    if (seenTable && !(tableHasX1 && tableHasY1)) {
      // not fatal — a table can use different subscripts (e.g. x_2/y_2) — only flag the common error
    }
    return errors;
  }

  function stripPlaceholders(raw) {
    // Helper to detect any unfilled {{...}} placeholders in the model's adapted output.
    if (raw == null) return [];
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw);
    const matches = text.match(/\{\{[A-Z0-9_]+\}\}/g);
    return matches || [];
  }

  // ─── Phase 3 (tutoring response) ────────────────────────────────────────
  // Streams a chat-facing markdown explanation. Grounded in the loaded Desmos
  // state when one was loaded, so the model can reference exact values.
  function buildPhase3SystemPrompt(adaptedState, classifierStrategy) {
    const base = `You are Korah, an SAT Math tutor created by Oscar Euceda. The system has already loaded a Desmos graph for the student (or determined no graph was needed). Your job: explain the solution, referencing what is visible on the graph.

OUTPUT FORMAT:
Output ONLY the explanation text — pure Markdown + KaTeX. NO JSON, NO code fences, NO field names.

STYLE:
- Write like a sharp, warm tutor talking to one student — not a worksheet or a template.
- Confident, finished walkthrough. Do NOT think out loud. Do NOT show "let me re-check" moments.
- If you need to verify, do it silently. Only the final clean explanation appears in your output.
- Do NOT type Desmos commands or instruct the student to "type $x_1 = [1,2,3]$". The graph is already on screen — reference what it shows.
- Be concise. Default SHORT — most answers should be a few tight sentences or a handful of quick steps, not an essay. Clarity over length, always.
- Do NOT over-explain. Trust the student. Skip obvious algebra narration ("now we subtract 3 from both sides, giving…") unless the step is genuinely the hard part. Say the key move and the result.
- Prefer a couple of short paragraphs or a compact list over long walls of text. Cut throat-clearing, restatement, and filler.
- Vary your openings. Do NOT start every reply the same way. Jump into the actual idea.

STRUCTURE (a guide, NOT a rigid template):
A good explanation usually understands the problem, picks a strategy, works the math, states the answer, and ends with a quick SAT tip — but let the problem dictate the shape, and keep it lean. A one-step problem should NOT be forced into five headed sections — a sentence or two may be the whole answer; a hard multi-part one may need more. Do NOT mechanically emit the same bold headers every time ("Step 1 — Understand", "Step 2 — Strategy", …). Use headers only when they genuinely help the student follow along, and word them naturally.
- Always reference the EXACT values that appear in the loaded graph state below ("the regression fits $m = -4$ and $b = 30$…").
- Always land on a clear final answer.
- End with one short, genuinely useful test-day tip when it fits.

TEXT FORMATTING:
- Markdown headings, **bold**, *italic*
- KaTeX for math: $inline$ or $$display$$. EVERY variable, coefficient, number-in-context, and equation goes inside dollar signs — no bare $x$ or $m$ floating in prose.
- NEVER use \\\\(...\\\\) or \\\\[...\\\\]
- NEVER include raw JSON, code blocks, or Desmos input syntax`;

    let context = '';
    if (classifierStrategy) {
      context += `\n\n=== CLASSIFIER NOTE ===\n${classifierStrategy}`;
    }
    if (adaptedState) {
      // Trim the state to just the expressions so the model focuses on math content,
      // not the boilerplate randomSeed/version.
      const slim = { expressions: adaptedState.expressions };
      context += `\n\n=== LOADED GRAPH STATE (ground your explanation in these exact values) ===\n${JSON.stringify(slim, null, 2)}\n\nThe text nodes above already contain the algebraic reasoning written by the system. Rewrite that reasoning as a flowing student-facing explanation — do NOT just copy the text nodes verbatim, but use their numbers and steps as ground truth.`;
    } else {
      context += `\n\n=== NO GRAPH LOADED ===\nNo Desmos graph was loaded for this problem. Solve it algebraically with clear steps.`;
    }
    return base + context;
  }

  function initializeSATGraph() {
    const container = document.getElementById('sat-graph-container');
    if (!container || !window.Desmos || isGraphInitialized) return;

    container.innerHTML = '<div class="desmos-graph-wrapper" id="sat-desmos-graph"></div>';
    const graphEl = document.getElementById('sat-desmos-graph');

    satMathCalculator = Desmos.GraphingCalculator(graphEl, {
      keypad: false,
      graphpaper: true,
      autosize: true,
      expressions: true,
      settingsMenu: false,
      zoomButtons: true,
      border: false,
      keyboard: false,
      showGrid: true,
      showAxisLabels: true,
      showClearButton: false,
      authorMode: false,
    });

    satMathCalculator.setMathBounds({
      left: -10,
      right: 10,
      bottom: -10,
      top: 10,
    });

    // Listen for graph state changes and auto-persist
    satMathCalculator.observe('expressionsChanged', () => {
      captureGraphState();
    });

    isGraphInitialized = true;
  }

  let graphStateDebounceTimer = null;

  function captureGraphState() {
    if (!satMathCalculator) return;

    clearTimeout(graphStateDebounceTimer);
    graphStateDebounceTimer = setTimeout(() => {
      try {
        const state = satMathCalculator.getState();
        graphExpressions = [];

        if (state.expressions && state.expressions.list) {
          state.expressions.list.forEach(expr => {
            if (expr.hidden) return;

            if (expr.type === 'expression' && expr.latex) {
              graphExpressions.push({
                type: 'expression',
                latex: expr.latex
              });
            } else if (expr.type === 'table' && expr.columns) {
              const colSummaries = expr.columns.map(c => {
                const vals = (c.values || []).slice(0, 3);
                return `${c.latex || '?'}: [${vals.join(',')}${c.values?.length > 3 ? '...' : ''}]`;
              });
              graphExpressions.push({
                type: 'table',
                summary: `Table(${colSummaries.join(', ')})`
              });
            }
          });
        }

        updateGraphContextIndicator();

        // Persist graph state to session
        if (currentSession) {
          currentSession.graphState = state;
          saveCurrentSession();
        }
      } catch (e) {
        console.warn('Failed to capture graph state:', e);
      }
    }, 500);
  }

  function updateGraphContextIndicator() {
    let indicator = document.getElementById('graph-context-indicator');
    
    if (graphExpressions.length === 0) {
      indicator?.remove();
      return;
    }

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'graph-context-indicator';
      indicator.className = 'graph-context-indicator';
      indicator.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
        <span>Graph has ${graphExpressions.length} item(s)</span>
      `;
      
      const inputArea = document.getElementById('chat-input-area');
      inputArea?.parentNode?.insertBefore(indicator, inputArea);
    } else {
      indicator.querySelector('span').textContent = 
        `Graph has ${graphExpressions.length} item(s)`;
    }
  }

  function getGraphContext() {
    if (graphExpressions.length === 0) return '';
    
    const exprList = graphExpressions
      .map(e => e.type === 'expression' ? e.latex : e.summary)
      .join('; ');
    
    return exprList ? `\n\n[Current Desmos State: ${exprList}]` : '';
  }

  // Load a complete Desmos state (from a verified template or an adapted state)
  // and apply it via setState(). Returns { ok, errors } so callers can show diagnostics.
  function loadDesmosState(state) {
    if (!satMathCalculator) return { ok: false, errors: ['calculator not initialized'] };
    if (!state || typeof state !== 'object') return { ok: false, errors: ['no state provided'] };

    const errors = validateDesmosState(state);
    if (errors.length > 0) {
      console.warn('Desmos state validation failed:', errors, state);
      return { ok: false, errors };
    }

    const graphContainer = document.getElementById('sat-graph-container');

    try {
      // Defensive copy so we don't mutate the cached template/example.
      const stateCopy = JSON.parse(JSON.stringify(state));
      // Desmos setState requires state.graph.viewport. We strip viewport from
      // stored states (per the library plan), so inject a sensible default here.
      if (!stateCopy.graph || !stateCopy.graph.viewport) {
        stateCopy.graph = { viewport: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 } };
      }
      satMathCalculator.setState(stateCopy);
    } catch (e) {
      console.error('setState failed:', e);
      return { ok: false, errors: ['setState failed: ' + e.message] };
    }

    if (graphContainer) {
      graphContainer.classList.add('graph-updated');
      setTimeout(() => graphContainer.classList.remove('graph-updated'), 500);
    }

    captureGraphState();
    return { ok: true, errors: [] };
  }

  // ─── Merged classify + adapt pipeline ───────────────────────────────────
  // Locate and parse the first JSON object in a model response, tolerating code
  // fences, leading junk, and trailing text (the merged call nests a large
  // Desmos state, so the parse must survive messy output).
  function extractJSONObject(fullText) {
    let s = (fullText || '').trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/i, '')
      .trim();
    if (s === 'null') return null;
    const braceIdx = s.indexOf('{');
    if (braceIdx === -1) return null;
    s = s.substring(braceIdx);

    try { return JSON.parse(s); } catch (_) {}

    // Fallback: extract the first balanced-brace region in case of trailing junk.
    let depth = 0, end = -1, inStr = false, esc = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (esc) { esc = false; continue; }
      if (ch === '\\') { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === '{') depth++;
      else if (ch === '}') { depth--; if (depth === 0) { end = i; break; } }
    }
    if (end !== -1) {
      try { return JSON.parse(s.substring(0, end + 1)); }
      catch (e) { console.warn('extractJSONObject: brace-extraction parse failed:', e.message); }
    }
    return null;
  }

  function buildSkeletonsBlock(skeletons) {
    return skeletons.map(({ id, skeleton }) =>
      `─── SKELETON id="${id}" ───\n${JSON.stringify(skeleton, null, 2)}`
    ).join('\n\n');
  }

  async function buildMergedSystemPrompt() {
    const index = await loadTemplateIndex();
    const skeletons = await loadAllSkeletons();
    const indexBlock = buildTemplateIndexBlock(index);
    const skeletonsBlock = buildSkeletonsBlock(skeletons);

    // Static prefix FIRST (templates never change per-message), student problem
    // LAST — so Gemini 2.5 implicit caching can discount this stable prefix.
    return `You are Korah's SAT Math graph engine. In ONE step you must (1) pick the best Desmos template for the student's problem and (2) if it is a "problem-solver" template, fill its skeleton with the student's numbers to produce a ready-to-render Desmos state.

Output a SINGLE raw JSON object — NO code fences, NO commentary, NO extra fields:

{
  "stateId": "id_from_template_list_or_null",
  "strategy": "one short sentence (max 20 words) on which template fits and why",
  "adaptedState": <Desmos state object, OR null>
}

Rules for "adaptedState":
- If the chosen template's type is "problem-solver": adaptedState MUST be the fully-filled Desmos state (see ADAPTATION RULES). Never null in this case.
- If the chosen template's type is "visualizer": set adaptedState to null (the app loads that template's verified example as-is).
- If stateId is null: set adaptedState to null.

═══════════════════════════════════════════
STEP 1 — CLASSIFY (pick stateId)
═══════════════════════════════════════════

Korah's whole value is teaching SAT math through Desmos. ALMOST EVERY SAT MATH PROBLEM maps to one of the templates below. Default to picking a template. Only return null as an absolute last resort.

You SHOULD pick a template whenever any of these apply:
- Linear function, line, slope, y-intercept → linear-functions / linear-equations-in-two-variables
- Equation in one variable with unknown constants asking "infinitely many / no solutions" → linear-equations-in-one-variable
- Inequality asking which (x,y) pairs satisfy it → linear-equalities-in-one-or-two-variables
- System of two equations asking for a value at the intersection → system-of-two-linear-equations
- Polynomial identity (ax+...)(...) = ... that holds "for all x" → equivalent-expressions
- Quadratic in vertex form, or vertex/parabola shape → quadratic-from-vertex-point
- Symmetry, even/odd functions, reflection → 3-types-of-symmetry
- Unit circle, sin θ, cos θ, angles, radians → unit-circle
- Sine/cosine waves, period, amplitude, phase → sine-cosine-sinuoids-graphs
- Dilations, vertical/horizontal stretches → nonrigid-transformations-dilations
- Concavity, concave up/down, rate of change → concavity-discovery / concavity-rate-of-change

Draw a graph EVEN WHEN NOT EXPLICITLY ASKED: any request that would be clearer with a worked example on the graph should get one, including broad/how-to questions ("show me a strategy for linear systems"). Pick the template that best DEMONSTRATES the concept.

"visualizer" templates are for conceptual questions ("what is concavity?", "show me the unit circle"). "problem-solver" templates are for concrete SAT problems with numbers/equations to solve — prefer these when the student pastes a problem.

Only return stateId: null if the input is COMPLETELY non-mathematical ("hi", "what is Korah?") or clearly outside the template list (3D volume geometry, pure probability/statistics with no graph utility). When in doubt — PICK A TEMPLATE.

═══════════════════════════════════════════
STEP 2 — ADAPT (only for problem-solver templates)
═══════════════════════════════════════════

Take the matching SKELETON (below, keyed by id) and fill it in for the STUDENT'S problem. You are NOT allowed to invent a structure — use the chosen skeleton as your structural guide (same expression types, same order).

1. Fill EVERY {{PLACEHOLDER}} with a value from the STUDENT'S problem.
2. Rewrite EVERY text node to describe the STUDENT'S problem (their numbers, their variables, their question) in PLAIN ENGLISH ONLY.
3. Replace all example/skeleton numeric values with the student's numeric values.
4. Keep regressionParameters' letters aligned to the student's unknowns.

CRITICAL DESMOS RULES (violations break the graph):
- Table data columns MUST use subscript notation: x_{1}, y_{1} (never bare x or y).
- A table must appear BEFORE any expression that uses its columns.
- Regressions use TILDE (\\sim), not equals.
- Text nodes use ONLY {type, id, text} — NO color field, NO LaTeX, NO backslashes, NO $...$, NO subscripts. Plain English sentences only. To show a formula, use an {type:"expression", latex:"..."} node instead.
- Every id must be unique within expressions.list.
- LaTeX backslashes must be JSON-escaped (\\\\frac, \\\\sim, \\\\left, …).
- adaptedState top-level fields: version, randomSeed, expressions only. NO "graph"/"viewport".

adaptedState shape:
{ "version": 11, "randomSeed": "32-char hex", "expressions": { "list": [ ...adapted for THE STUDENT'S problem... ] } }

Every text node, numeric value, and coefficient must reflect the STUDENT'S problem — not the skeleton's placeholders and not any example.

${indexBlock}

═══════════════════════════════════════════
PROBLEM-SOLVER SKELETONS (fill the one matching your chosen stateId)
═══════════════════════════════════════════

${skeletonsBlock}`;
  }

  // Run the merged classify+adapt call. Returns { stateId, strategy, adaptedState }
  // (adaptedState may be null for visualizer / null classifications) or null on
  // total failure. Parsing mirrors the legacy phases; validation/fallback of the
  // adaptedState sub-field happens at the call site (in sendMessage).
  async function runMergedClassifyAdapt(problem) {
    console.log('[Merged] classify+adapt starting…');
    const t0 = performance.now();
    let systemPrompt;
    try {
      systemPrompt = await buildMergedSystemPrompt();
    } catch (e) {
      console.error('[Merged] failed to build system prompt:', e);
      return null;
    }

    let fullText = '';
    try {
      await callAPI(problem, (_chunk, full) => { fullText = full; }, {
        systemPrompt,
        temperature: MERGED_TEMPERATURE,
        _phaseTag: 'Merged (classify+adapt)',
      });
    } catch (e) {
      console.error('[Merged] API call failed:', e);
      return null;
    }
    const dt = Math.round(performance.now() - t0);
    console.log(`[Merged] raw response (${dt}ms, ${fullText.length} chars):`, fullText.slice(0, 200) + '…');

    const parsed = extractJSONObject(fullText);
    if (!parsed) {
      console.warn('[Merged] could not parse JSON, returning null');
      return null;
    }

    const out = {
      stateId: typeof parsed.stateId === 'string' ? parsed.stateId : null,
      strategy: typeof parsed.strategy === 'string' ? parsed.strategy : '',
      adaptedState: (parsed.adaptedState && typeof parsed.adaptedState === 'object') ? parsed.adaptedState : null,
    };
    console.log('[Merged] parsed:', { stateId: out.stateId, strategy: out.strategy, hasState: !!out.adaptedState });
    return out;
  }

  function renderGraphUpdates(container) {
    // Structured JSON responses now carry graph updates directly.
    // Keep this stub so older call sites remain safe.
    return container;
  }

  function bindGraphControls() {
    document.getElementById('sat-graph-clear')?.addEventListener('click', () => {
      if (satMathCalculator) {
        satMathCalculator.setBlank();
        graphExpressions = [];
        updateGraphContextIndicator();
      }
    });
  }

  // ─── File Attachments ─────────────────────────────────────────────────────

  let attachedFiles = [];

  function getFileIcon(type, name) {
    if (type === 'image') return '🖼️';
    const ext = (name || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    return '📄';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB per file
  const MAX_IMAGE_DIMENSION = 1024;

  function resizeImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width <= MAX_IMAGE_DIMENSION && height <= MAX_IMAGE_DIMENSION && file.size < 300000) {
          // Already small enough and reasonable size — read as-is
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
          return;
        }
        const scale = Math.min(MAX_IMAGE_DIMENSION / width, MAX_IMAGE_DIMENSION / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // Use 0.7 quality to stay well under Vercel's 4.5MB limit
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      };
      img.src = url;
    });
  }

  function processFile(file) {
    return new Promise(async (resolve) => {
      const isImage = file.type.startsWith('image/');
      const isText = file.type === 'text/plain' || ['txt','md','csv'].includes(file.name.split('.').pop().toLowerCase());
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

      if (isPDF && file.size > MAX_FILE_SIZE) {
        resolve({ file, name: file.name, size: file.size, type: 'error', dataUrl: null, content: null, error: 'File too large (max 4 MB)' });
        return;
      }

      if (isImage) {
        const dataUrl = await resizeImage(file);
        resolve({ file, name: file.name, size: file.size, type: 'image', dataUrl, content: null });
      } else if (isPDF) {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, name: file.name, size: file.size, type: 'pdf', dataUrl: reader.result, content: null });
        reader.readAsDataURL(file);
      } else if (isText) {
        const reader = new FileReader();
        reader.onload = () => resolve({ file, name: file.name, size: file.size, type: 'text', dataUrl: null, content: reader.result });
        reader.readAsText(file);
      } else {
        resolve({ file, name: file.name, size: file.size, type: 'other', dataUrl: null, content: null });
      }
    });
  }

  async function handleNewFiles(fileList) {
    const MAX_FILES = 5;
    const remaining = MAX_FILES - attachedFiles.length;
    const toProcess = Array.from(fileList).slice(0, Math.max(0, remaining));
    const errors = [];
    for (const file of toProcess) {
      const processed = await processFile(file);
      if (processed.type === 'error') {
        errors.push(`${processed.name}: ${processed.error}`);
      } else {
        attachedFiles.push(processed);
      }
    }
    if (errors.length > 0) {
      alert('Some files were skipped:\n' + errors.join('\n'));
    }
    renderInputFilesBar();
    renderWelcomeAttachments();
  }

  function clearAttachedFiles() {
    attachedFiles = [];
    renderInputFilesBar();
    renderWelcomeAttachments();
  }

  function makeFileCard(f, onRemove) {
    const card = document.createElement('div');
    card.className = 'input-file-card';
    if (f.type === 'image' && f.dataUrl) {
      const img = document.createElement('img');
      img.className = 'input-file-card-thumb';
      img.src = f.dataUrl;
      img.alt = f.name;
      card.appendChild(img);
    } else {
      const icon = document.createElement('div');
      icon.className = 'input-file-card-icon';
      const ext = (f.name || '').split('.').pop().toUpperCase();
      icon.innerHTML = `<span style="font-size:1.5rem;line-height:1">${getFileIcon(f.type, f.name)}</span><span class="input-file-card-label">${ext}</span>`;
      card.appendChild(icon);
    }
    const removeBtn = document.createElement('button');
    removeBtn.className = 'input-file-card-remove';
    removeBtn.title = 'Remove';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', onRemove);
    card.appendChild(removeBtn);
    return card;
  }

  function renderInputFilesBar() {
    const bar = document.getElementById('input-files-bar');
    if (!bar) return;
    if (attachedFiles.length === 0) { bar.classList.remove('show'); bar.innerHTML = ''; return; }
    bar.classList.add('show');
    bar.innerHTML = '';
    attachedFiles.forEach((f, i) => {
      bar.appendChild(makeFileCard(f, () => {
        attachedFiles.splice(i, 1); renderInputFilesBar(); renderWelcomeAttachments();
      }));
    });
  }

  function renderWelcomeAttachments() {
    const container = document.getElementById('welcome-attachments');
    if (!container) return;
    container.innerHTML = '';
    attachedFiles.forEach((f, i) => {
      container.appendChild(makeFileCard(f, () => {
        attachedFiles.splice(i, 1); renderInputFilesBar(); renderWelcomeAttachments();
      }));
    });
  }

  function buildUserContent(text, files) {
    if (!files || files.length === 0) return text;
    const textParts = [text];
    const multimodalParts = [];
    files.forEach(f => {
      if (f.type === 'text' && f.content) {
        textParts.push(`\n\n--- Content of ${f.name} ---\n${f.content}\n--- End of ${f.name} ---`);
      } else if ((f.type === 'image' || f.type === 'pdf') && f.dataUrl) {
        multimodalParts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
      } else {
        textParts.push(`\n[Attached: ${f.name}]`);
      }
    });
    const fullText = textParts.join('');
    return multimodalParts.length > 0
      ? [{ type: 'text', text: fullText }, ...multimodalParts]
      : fullText;
  }

  function setupFileAttachment() {
    const fileInput = document.getElementById('doc-file-input');
    const attachBtn = document.getElementById('attach-file-btn');
    const welcomeAttachBtn = document.getElementById('welcome-attach-btn');
    const dragOverlay = document.getElementById('drag-overlay');

    attachBtn?.addEventListener('click', () => fileInput?.click());
    welcomeAttachBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) { handleNewFiles(e.target.files); e.target.value = ''; }
    });

    document.addEventListener('dragover', (e) => { e.preventDefault(); dragOverlay?.classList.add('active'); }, true);
    document.addEventListener('dragleave', (e) => { if (e.clientX === 0 && e.clientY === 0) dragOverlay?.classList.remove('active'); }, true);
    document.addEventListener('drop', (e) => { e.preventDefault(); dragOverlay?.classList.remove('active'); if (e.dataTransfer.files?.length) handleNewFiles(e.dataTransfer.files); }, true);
  }

  // ─── Session Management ────────────────────────────────────────────────────

  function createNewSession() {
    const id = 'sat_' + Date.now();
    currentSessionId = id;
    currentSession = {
      id,
      title: 'Desmos Chat',
      mode: 'sat-math',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      autoTitleGenerated: false,
      userRenamed: false,
    };
    conversationHistory = [];
    // Don't persist to Firestore yet — saveCurrentSession() runs after the
    // first user message, so empty sessions never appear in the sidebar.
    window.location.hash = id;
  }

  function saveCurrentSession() {
    if (!currentSession || !window.KorahDB) return;
    currentSession.messages = conversationHistory;
    currentSession.updatedAt = new Date().toISOString();

    // Persist graph state
    if (satMathCalculator) {
      try {
        currentSession.graphState = satMathCalculator.getState();
      } catch (e) {
        console.warn('Failed to save graph state:', e);
      }
    }

    window.KorahDB.setConversation(currentSessionId, currentSession).catch(console.error);
  }

  async function generateAutoTitle() {
    if (!currentSession || currentSession.autoTitleGenerated || currentSession.userRenamed) return;
    const firstUser = conversationHistory.find(m => m.role === 'user');
    const lastAI = [...conversationHistory].reverse().find(m => m.role === 'assistant');
    if (!firstUser) return;
    const parts = [
      "You generate short, clear titles for SAT Math tutoring chats.",
      "Write a 3–6 word title a student would use to find this conversation later.",
      "No quotes or punctuation at the end. Respond with ONLY the title.",
      "",
      "Student message:",
      firstUser.content.slice(0, 400),
    ];
    if (lastAI) {
      parts.push("", "AI reply (context):", lastAI.content.slice(0, 300));
    }
    try {
      const reply = await callAPI(parts.join('\n'), null, {
        systemPrompt: "You generate concise, descriptive titles for SAT Math tutoring conversations.",
        temperature: 0.3,
        _phaseTag: 'auto-title',
      });
      if (!reply) return;
      let title = reply.split('\n')[0].trim().replace(/^["']+|["']+$/g, '');
      if (!title) return;
      currentSession.title = title;
      currentSession.autoTitleGenerated = true;
      saveCurrentSession();
      const chatTitleEl = document.getElementById('chat-title');
      if (chatTitleEl) chatTitleEl.textContent = title;
      if (window.KorahSidebar) {
        window.KorahSidebar.renderChatHistory(
          document.getElementById('chat-history'), 'math-chat.html'
        );
      }
    } catch (e) {
      console.warn('Auto-title generation failed:', e);
    }
  }

  // Extract the value of a JSON string field without using JSON.parse,
  // so LaTeX backslashes (\frac, \sim, etc.) are preserved correctly.
  function extractSavedResponseField(raw) {
    const key = '"response":';
    const keyIdx = raw.indexOf(key);
    if (keyIdx === -1) return null;
    let i = keyIdx + key.length;
    while (i < raw.length && /\s/.test(raw[i])) i++;
    if (raw[i] !== '"') return null;
    i++; // skip opening quote
    let value = '';
    let esc = false;
    while (i < raw.length) {
      const ch = raw[i];
      if (esc) {
        switch (ch) {
          case '"':  value += '"'; break;
          case '\\': value += '\\'; break;
          case '/':  value += '/'; break;
          case 'n': case 'r': case 't': case 'b': case 'f':
            // If next char is a letter → LaTeX command (\frac, \nabla …)
            if (i + 1 < raw.length && /[a-z]/.test(raw[i + 1])) {
              value += '\\' + ch;
            } else {
              value += ({ n: '\n', r: '\r', t: '\t', b: '', f: '' })[ch];
            }
            break;
          case 'u':
            if (i + 4 < raw.length && /^[0-9a-fA-F]{4}$/.test(raw.substring(i + 1, i + 5))) {
              value += String.fromCharCode(parseInt(raw.substring(i + 1, i + 5), 16));
              i += 4;
            } else {
              value += '\\u';
            }
            break;
          default:
            value += '\\' + ch; // LaTeX: \sim, \left, \cdot …
        }
        esc = false; i++; continue;
      }
      if (ch === '\\') { esc = true; i++; continue; }
      if (ch === '"') break; // closing quote
      value += ch; i++;
    }
    return value || null;
  }

  function renderSavedMessages() {
    if (!messagesList || conversationHistory.length === 0) return;
    messagesList.innerHTML = '';
    conversationHistory.forEach(msg => {
      if (msg.role === 'user') {
        addMessage('user', msg.content);
      } else if (msg.role === 'assistant') {
        const row = addMessage('assistant', '');
        const contentEl = row?.querySelector('.assistant-content');
        if (contentEl) {
          // Use LaTeX-aware extraction instead of JSON.parse, which breaks on
          // unescaped LaTeX backslashes stored in the raw API response.
          const extracted = extractSavedResponseField(msg.content);
          renderMarkdownAndMath(contentEl, extracted ?? msg.content);
        }
      }
    });

    // Restore graph state from session
    if (currentSession?.graphState && satMathCalculator) {
      try {
        const stateCopy = JSON.parse(JSON.stringify(currentSession.graphState));
        if (!stateCopy.graph || !stateCopy.graph.viewport) {
          stateCopy.graph = { viewport: { xmin: -10, xmax: 10, ymin: -10, ymax: 10 } };
        }
        satMathCalculator.setState(stateCopy);
        captureGraphState();
      } catch (e) {
        console.warn('Failed to restore graph state:', e);
      }
    }

    welcomeScreen?.classList.add('hidden');
    document.getElementById('chat-input-area')?.classList.remove('hidden');
    chatBody.scrollTop = chatBody.scrollHeight;

    // Update topbar title to reflect the session's title
    const chatTitleEl = document.getElementById('chat-title');
    if (chatTitleEl && currentSession?.title) {
      chatTitleEl.textContent = currentSession.title;
    }
  }

  async function switchToSession(id) {
    if (id === currentSessionId) return;
    if (!window.KorahDB) return;
    const session = await window.KorahDB.getConversation(id);
    if (!session) return;
    currentSessionId = id;
    currentSession = session;
    conversationHistory = session.messages || [];
    window.location.hash = id;
    // Reset UI and clear graph before loading new session
    if (messagesList) messagesList.innerHTML = '';
    if (satMathCalculator) satMathCalculator.setBlank();
    welcomeScreen?.classList.remove('hidden');
    document.getElementById('chat-input-area')?.classList.add('hidden');
    // Restore
    renderSavedMessages();
    if (window.KorahSidebar) window.KorahSidebar.updateActiveItem(id);
  }

  function newChat() {
    if (messagesList) messagesList.innerHTML = '';
    welcomeScreen?.classList.remove('hidden');
    document.getElementById('chat-input-area')?.classList.add('hidden');
    if (satMathCalculator) { satMathCalculator.setBlank(); graphExpressions = []; updateGraphContextIndicator(); }
    const chatTitleEl = document.getElementById('chat-title');
    if (chatTitleEl) chatTitleEl.textContent = 'Desmos Chat';
    createNewSession();
  }

  async function initSession() {
    const hash = window.location.hash.slice(1);
    if (hash && window.KorahDB) {
      const session = await window.KorahDB.getConversation(hash);
      if (session && (session.mode === 'sat-math' || (session.mode === 'sat' && session.satSubMode === 'math'))) {
        currentSessionId = hash;
        currentSession = session;
        if (currentSession.mode === 'sat') currentSession.mode = 'sat-math';
        conversationHistory = session.messages || [];
        renderSavedMessages();
        if (window.KorahSidebar) window.KorahSidebar.updateActiveItem(hash);
        return;
      }
    }
    createNewSession();
  }

  window.SatMathChat = { initSession, switchToSession, newChat, createNewSession, sendMessage };

  async function sendMessage(text) {
    console.log('sendMessage called', { text, inputValue: input?.value, welcomeInputValue: welcomeInput?.value });
    const userMessage = text || input?.value?.trim() || welcomeInput?.value?.trim();
    console.log('userMessage:', userMessage);
    if (!userMessage) {
      console.log('No user message, returning early');
      return;
    }

    welcomeScreen?.classList.add('hidden');
    document.getElementById('chat-input-area')?.classList.remove('hidden');

    const graphContext = getGraphContext();
    const fullMessage = userMessage + graphContext;

    // Capture and clear attached files before state changes
    const pendingFiles = [...attachedFiles];
    clearAttachedFiles();


    console.log('Adding user message to chat');
    addMessage('user', userMessage, false, null, [], pendingFiles);

    input && (input.value = '');
    welcomeInput && (welcomeInput.value = '');
    if (welcomeInput) welcomeInput.style.height = 'auto';

    typingIndicator?.classList.remove('hidden');
    chatBody.scrollTop = chatBody.scrollHeight;

    const streamingContentId = `streaming-content-${Date.now()}`;
    const streamingRow = addMessage('assistant', '', false, streamingContentId);
    const contentElement = document.getElementById(streamingContentId);
    let aiSuggestions = [];

    // Show pulsing "Thinking" indicator while waiting for first content
    let thinkingIndicator = null;
    let dotInterval = null;
    let phraseInterval = null;

    const THINKING_PHRASES = [
      'Cooking up',
      'Combobulating',
      'Thinking super duper hard',
      'Brainstorming',
      'Crunching numbers',
      'Connecting the dots',
      'On it',
      'Doing the math',
      'Figuring it out',
    ];

    const startDotCycle = (labelOrLabels, el) => {
      if (dotInterval) clearInterval(dotInterval);
      if (phraseInterval) clearInterval(phraseInterval);
      const labels = Array.isArray(labelOrLabels) ? labelOrLabels : [labelOrLabels];
      let dots = 0;
      let labelIdx = 0;
      let currentLabel = labels[labelIdx];
      const span = el.querySelector('.thinking-shimmer-text');

      dotInterval = setInterval(() => {
        dots = (dots % 3) + 1;
        if (span) span.textContent = currentLabel + '.'.repeat(dots);
      }, 700);

      if (labels.length > 1) {
        phraseInterval = setInterval(() => {
          const remaining = labels.filter((_, i) => i !== labelIdx);
          labelIdx = labels.indexOf(remaining[Math.floor(Math.random() * remaining.length)]);
          currentLabel = labels[labelIdx];
          dots = 0;
          if (span) span.textContent = currentLabel + '.';
        }, 5000);
      }
    };

    if (contentElement) {
      thinkingIndicator = document.createElement("div");
      thinkingIndicator.className = "thinking-indicator";
      thinkingIndicator.innerHTML = `<span class="thinking-shimmer-text">Cooking up.</span>`;
      contentElement.appendChild(thinkingIndicator);
      startDotCycle(THINKING_PHRASES, thinkingIndicator);
    }

    let currentTypedText = "";
    let charBuffer = [];
    let typewriterActive = false;
    let lastBufferedLength = 0;

    // ── Throttled mid-stream render ──
    // renderMarkdownAndMath (marked + DOMPurify + KaTeX) is O(n) over the whole
    // accumulated string, so calling it every typewriter tick is O(n²) and
    // re-typesets every equation each time. Instead we advance currentTypedText
    // cheaply every tick and repaint at most once per RENDER_THROTTLE_MS,
    // aligned to an animation frame. The final clean render still happens once
    // at stream end.
    const RENDER_THROTTLE_MS = 120;
    let lastRenderTime = 0;
    let renderPending = false;   // rAF/timeout is scheduled
    let renderStopped = false;   // finalize has taken over; suppress late paints
    let renderTimer = null;

    const flushRender = () => {
      renderPending = false;
      if (renderStopped) return;
      lastRenderTime = performance.now();
      if (contentElement) renderMarkdownAndMath(contentElement, currentTypedText);
    };

    const scheduleRender = () => {
      if (renderPending || renderStopped) return;
      renderPending = true;
      const elapsed = performance.now() - lastRenderTime;
      if (elapsed >= RENDER_THROTTLE_MS) {
        requestAnimationFrame(flushRender);
      } else {
        renderTimer = setTimeout(
          () => requestAnimationFrame(flushRender),
          RENDER_THROTTLE_MS - elapsed
        );
      }
    };

    const typeNextChar = () => {
      if (charBuffer.length === 0) {
        typewriterActive = false;
        return;
      }

      typewriterActive = true;
      // Scale characters-per-tick to how much text is waiting so the display
      // keeps pace with the stream instead of lagging a fixed 1–2 chars behind.
      // Gemini already streams at a natural pace; the typewriter should smooth
      // it, not throttle it.
      let charsToType;
      if (charBuffer.length > 200) charsToType = 12;
      else if (charBuffer.length > 100) charsToType = 6;
      else if (charBuffer.length > 40) charsToType = 3;
      else charsToType = 1;
      for (let i = 0; i < charsToType && charBuffer.length > 0; i++) {
        currentTypedText += charBuffer.shift();
      }

      // Cheap: just queue a throttled repaint instead of rendering every tick.
      scheduleRender();

      // Near-zero pacing: once chars are in the buffer, don't sit on them.
      const delay = charBuffer.length > 40 ? 0 : 3;

      setTimeout(typeNextChar, delay);
    };

    // Animate already-buffered text into the content element using the same
    // typewriter as live streaming. Used after the graph has loaded so the
    // chat narration flows in over the (already-visible) graph.
    const animateResponseText = (el, text) => {
      if (!el || !text) return;
      currentTypedText = '';
      charBuffer = text.split('');
      if (!typewriterActive) typeNextChar();
    };

  // Unescape a JSON string value, preserving LaTeX backslashes.
  // \frac stays as \frac (not form-feed + rac), \n becomes newline.
  const unescapeJSONString = (s) => {
    let out = '', esc = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (esc) {
        switch (ch) {
          case '"':  out += '"'; break;
          case '\\': out += '\\'; break;
          case '/':  out += '/'; break;
          case 'n': case 'r': case 't': case 'b': case 'f':
            if (i + 1 < s.length && /[a-z]/.test(s[i + 1])) {
              out += '\\' + ch;   // LaTeX: \frac, \nabla, \text …
            } else {
              out += ({ n: '\n', r: '\r', t: '\t', b: '', f: '' })[ch];
            }
            break;
          default: out += '\\' + ch; // LaTeX: \sim, \left, \cdot …
        }
        esc = false; continue;
      }
      if (ch === '\\') { esc = true; continue; }
      out += ch;
    }
    return out;
  };

  console.log('═══ Three-phase send ═══ problem:', fullMessage.substring(0, 80));
  let phase3FullText = "";

  // Helper: replace the current indicator with a "Drawing graph…" indicator.
  const showDrawingIndicator = () => {
    if (!contentElement) return;
    contentElement.innerHTML = '';
    const ind = document.createElement('div');
    ind.className = 'thinking-indicator graph-loading-indicator';
    ind.innerHTML = `<span class="thinking-shimmer-text">Drawing Graph.</span>`;
    contentElement.appendChild(ind);
    thinkingIndicator = ind;
    startDotCycle('Drawing Graph', ind);
  };

  try {
    const userContent = buildUserContent(fullMessage, pendingFiles);

    // ── CLASSIFY + LOAD GRAPH (single merged call) ──
    // One silent call returns { stateId, strategy, adaptedState }. It replaces
    // the old two round-trips (classify, then adapt). The verified example is
    // still the fallback whenever the adapted state is missing, verbatim, or
    // fails validation — so the graph stays robust even if the model slips.
    let loadedState = null;
    const merged = await runMergedClassifyAdapt(userContent);
    const stateId = merged?.stateId || null;
    const classifierStrategy = merged?.strategy || '';

    if (stateId) {
      showDrawingIndicator();
      try {
        const index = await loadTemplateIndex();
        const entry = index.find(e => e.id === stateId);
        if (!entry) {
          console.warn(`[Merged] stateId "${stateId}" not found in template index — skipping graph`);
        } else if (entry.type === 'visualizer') {
          console.log(`[Merged] visualizer "${stateId}" — loading example as-is`);
          const example = await loadExample(stateId);
          if (loadDesmosState(example).ok) { loadedState = example; console.log('[Merged] visualizer loaded'); }
          else console.warn('[Merged] visualizer load failed');
        } else if (entry.type === 'problem-solver') {
          const adapted = merged.adaptedState;
          // Verbatim guard: catch the model returning the verified example
          // unchanged (a known shortcut). Compare expressions.list.
          let verbatim = false;
          if (adapted) {
            try {
              const example0 = await loadExample(stateId);
              verbatim = JSON.stringify(adapted?.expressions?.list ?? []) === JSON.stringify(example0?.expressions?.list ?? []);
            } catch (_) {}
          }
          // Any unfilled {{PLACEHOLDER}} means the model didn't finish adapting —
          // it would render literally on the graph, so fall back instead.
          const leftoverSlots = adapted ? stripPlaceholders(adapted) : [];
          if (adapted && !verbatim && leftoverSlots.length === 0 && loadDesmosState(adapted).ok) {
            loadedState = adapted;
            console.log('[Merged] adapted state loaded');
          } else {
            const reason = !adapted ? 'no state'
              : verbatim ? 'verbatim copy'
              : leftoverSlots.length ? `unfilled placeholders: ${leftoverSlots.join(', ')}`
              : 'validation failed';
            console.warn(`[Merged] adapted state unusable (${reason}); falling back to verified example.`);
            const example = await loadExample(stateId);
            if (loadDesmosState(example).ok) { loadedState = example; console.log('[Merged] fallback example loaded'); }
          }
        }
      } catch (e) {
        console.error('[Merged] failed to resolve/load template:', e);
      }
    } else {
      console.log('[Merged] skipped graph (stateId is null — no template selected)');
    }

    // ── PHASE 3: streamed tutoring response, grounded in the loaded state ──
    // Keep the existing indicator visible until Phase 3 produces its first chunk.
    charBuffer = [];
    typewriterActive = false;
    lastBufferedLength = 0;
    currentTypedText = '';
    let firstChunkSeen = false;

    console.log(`🟢 [Phase 3] streaming tutoring response (grounded=${!!loadedState})…`);
    const phase3T0 = performance.now();
    await callAPI(userContent, (_chunk, fullText) => {
      phase3FullText = fullText;
      if (!firstChunkSeen && fullText.length > 0) {
        firstChunkSeen = true;
        if (contentElement) contentElement.innerHTML = '';
        if (dotInterval) { clearInterval(dotInterval); dotInterval = null; }
        if (phraseInterval) { clearInterval(phraseInterval); phraseInterval = null; }
        thinkingIndicator = null;
      }
      if (contentElement && fullText) {
        const delta = fullText.slice(lastBufferedLength);
        lastBufferedLength = fullText.length;
        charBuffer.push(...delta.split(''));
        if (!typewriterActive) typeNextChar();
      }
    }, {
      systemPrompt: buildPhase3SystemPrompt(loadedState, classifierStrategy),
      temperature: 0.65,
      _phaseTag: 'Phase 3 (respond)',
    });
    console.log(`🟢 [Phase 3] done in ${Math.round(performance.now() - phase3T0)}ms (${phase3FullText.length} chars)`);

    typingIndicator?.classList.add('hidden');

    // Wait for the typewriter to drain so the final render reflects the full text.
    // (Cheap busy-wait alternative would be ugly; instead, force one final render.)
    if (contentElement && phase3FullText) {
      // Take over from the throttled mid-stream renderer and do one clean pass.
      renderStopped = true;
      if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
      renderMarkdownAndMath(contentElement, phase3FullText);
      charBuffer = [];
      typewriterActive = false;
      // Append action buttons now that the message is complete
      const bubble = contentElement.closest('.msg-bubble');
      if (bubble && !bubble.querySelector('.msg-actions')) {
        bubble.appendChild(buildMessageActions(contentElement, streamingRow));
      }
    }

    chatBody.scrollTop = chatBody.scrollHeight;

    // ── Persist conversation history ──
    conversationHistory.push({ role: 'user', content: userMessage });
    conversationHistory.push({ role: 'assistant', content: phase3FullText });
    saveCurrentSession();
    // Generate AI title after first exchange
    if (conversationHistory.length <= 2) generateAutoTitle();
    console.log('═══ Three-phase send complete ═══');

    } catch (error) {
      console.error('Error in sendMessage:', error);
      typingIndicator?.classList.add('hidden');
      addMessage('assistant', 'Sorry, I encountered an error. Please try again. ' + error.message, true);
    }
  }

  async function callAPI(userContent, onChunk = null, options = {}) {
    const systemPrompt = options.systemPrompt ?? '';
    const temperature = options.temperature ?? 0.2;
    const phaseTag = options._phaseTag || 'callAPI';
    console.log(`📡 [${phaseTag}] → POST ${API_ENDPOINT} (model=${MODEL}, temp=${temperature}, sysPromptLen=${systemPrompt.length})`);

    const messagesWithSystem = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ];

    const bodyObj = {
      model: MODEL,
      temperature,
      messages: messagesWithSystem,
      stream: true
    };

    const bodyStr = JSON.stringify(bodyObj);
    // Vercel 4.5MB limit is approx 4.7 million characters in base64/json
    if (bodyStr.length > 4.4 * 1024 * 1024) {
      throw new Error("Payload too large. Please try removing some attachments or using smaller images.");
    }

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Korah-Phase": phaseTag,
      },
      body: bodyStr
    });

    if (!response.ok) {
      let errorMessage = `Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch (_error) {}
      console.error(`📡 [${phaseTag}] ← HTTP ${response.status}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    console.log(`📡 [${phaseTag}] ← HTTP ${response.status} (streaming…)`);

    if (!response.body) {
      throw new Error("No response body received");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content;
              if (content) {
                fullReply += content;
                if (onChunk) onChunk(content, fullReply);
              }
              
              const finishReason = parsed?.choices?.[0]?.finish_reason;
              if (finishReason) {
                console.log("Stream finish reason:", finishReason);
              }
            } catch (parseError) {
              console.error("Parse error:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream reading error:", error);
      throw error;
    }

    if (!fullReply) {
      throw new Error("API returned an empty response");
    }

    return fullReply;
  }

  // Action buttons (copy / feedback / regenerate) shown under assistant replies
  const MSG_ACTION_ICONS = {
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>',
    down: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>',
    regen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
  };

  function buildMessageActions(contentEl, row) {
    const bar = document.createElement('div');
    bar.className = 'msg-actions';

    const mkBtn = (icon, title) => {
      const b = document.createElement('button');
      b.className = 'msg-action-btn t-btn';
      b.type = 'button';
      b.title = title;
      b.setAttribute('aria-label', title);
      b.innerHTML = MSG_ACTION_ICONS[icon];
      return b;
    };

    const copyBtn = mkBtn('copy', 'Copy');
    copyBtn.addEventListener('click', () => {
      const txt = (contentEl.innerText || '').trim();
      if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
      copyBtn.classList.add('copied');
      copyBtn.innerHTML = MSG_ACTION_ICONS.check;
      setTimeout(() => {
        copyBtn.classList.remove('copied');
        copyBtn.innerHTML = MSG_ACTION_ICONS.copy;
      }, 1400);
    });

    const upBtn = mkBtn('up', 'Good response');
    const downBtn = mkBtn('down', 'Bad response');
    upBtn.addEventListener('click', () => {
      upBtn.classList.toggle('active');
      downBtn.classList.remove('active');
    });
    downBtn.addEventListener('click', () => {
      downBtn.classList.toggle('active');
      upBtn.classList.remove('active');
    });

    const regenBtn = mkBtn('regen', 'Regenerate');
    regenBtn.addEventListener('click', () => {
      let n = row.previousElementSibling;
      while (n && !(n.classList?.contains('msg-row') && n.classList?.contains('user'))) {
        n = n.previousElementSibling;
      }
      const txt = n ? (n.querySelector('.msg-bubble')?.innerText || '').trim() : '';
      if (txt && typeof sendMessage === 'function') sendMessage(txt);
    });

    bar.append(copyBtn, upBtn, downBtn, regenBtn);
    return bar;
  }

  function addMessage(role, text, isError = false, contentId = null, suggestions = [], fileAttachments = []) {
    const row = document.createElement('div');
    row.className = `msg-row ${role === 'user' ? 'user' : 'assistant'}`;

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${role === 'user' ? 'user' : 'korah'}${isError ? ' error' : ''}`;

    // Assistant replies get an inline logo + name header
    if (role === 'assistant') {
      const header = document.createElement('div');
      header.className = 'msg-header';
      header.innerHTML =
        '<span class="msg-header-avatar"><img src="../logo-images/newlogo0.png" alt="Korah" /></span>' +
        '<span class="msg-header-name">Korah AI</span>';
      bubble.appendChild(header);
    }

    // Show file attachment cards for user messages
    if (role === 'user' && fileAttachments && fileAttachments.length > 0) {
      const attachDiv = document.createElement('div');
      attachDiv.className = 'msg-attachments';
      fileAttachments.forEach(f => {
        const card = document.createElement('div');
        const isImage = f.type === 'image' && f.dataUrl;
        card.className = 'msg-attachment-card' + (isImage ? ' has-preview' : '');
        card.title = f.name;
        if (isImage) {
          card.innerHTML = `
            <img class="msg-attachment-card-thumb" src="${f.dataUrl}" alt="${f.name}" />
            <div class="msg-attachment-card-info">
              <span class="msg-attachment-card-name">${f.name}</span>
              <span class="msg-attachment-card-size">${formatFileSize(f.size)}</span>
            </div>
          `;
          card.addEventListener('click', () => {
            const win = window.open();
            win.document.write(`<img src="${f.dataUrl}" style="max-width:100%;max-height:100vh;display:block;margin:auto;" />`);
          });
        } else {
          card.innerHTML = `
            <div class="msg-attachment-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="msg-attachment-card-info">
              <span class="msg-attachment-card-name">${f.name}</span>
              <span class="msg-attachment-card-size">${formatFileSize(f.size)}</span>
            </div>
          `;
          if (f.dataUrl) {
            card.addEventListener('click', () => {
              const a = document.createElement('a');
              a.href = f.dataUrl;
              a.download = f.name;
              a.click();
            });
          }
        }
        attachDiv.appendChild(card);
      });
      bubble.appendChild(attachDiv);
    }

    const content = document.createElement('div');
    if (contentId) {
      content.id = contentId;
    }
    content.className = 'assistant-content';
    if (text) {
      renderMarkdownAndMath(content, text);
    }

    bubble.appendChild(content);

    if (role === 'assistant' && !isError && suggestions && suggestions.length > 0) {
      const suggestionsDiv = document.createElement('div');
      suggestionsDiv.className = 'inline-suggestions';

      suggestions.slice(0, 2).forEach((suggestion) => {
        const btn = document.createElement('button');
        btn.className = 'inline-suggestion-btn t-btn';
        btn.textContent = suggestion;
        btn.addEventListener('click', () => sendMessage(suggestion));
        suggestionsDiv.appendChild(btn);
      });

      bubble.appendChild(suggestionsDiv);
    }

    // Message action buttons for assistant replies — deferred for streaming rows
    if (role === 'assistant' && !isError && !contentId) {
      bubble.appendChild(buildMessageActions(content, row));
    }

    row.appendChild(bubble);

    messagesList?.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;

    return row;
  }

  function normalizeMathDelimiters(markdownText) {
    if (!markdownText) return markdownText;

    return markdownText
      .split(/(```[\s\S]*?```)/g)
      .map(function (segment) {
        if (segment.startsWith("```")) return segment;

        return segment
          .replace(/`([^`]+)`/g, function (_, expr) {
            const trimmed = expr.trim();
            if (/[_^\\{}]/.test(trimmed)) {
              return "$" + trimmed + "$";
            }
            return "`" + expr + "`";
          })
          .replace(/\\\((.*?)\\\)/gs, function (_, expr) {
            return "$" + expr.trim() + "$";
          })
          .replace(/\\[(.*?)]/gs, function (_, expr) {
            return "$$" + expr.trim() + "$$";
          })
          .replace(/([a-zA-Z])_([a-zA-Z0-9]+|\{[^}]+\})/g, "$1_{$2}");
      })
      .join("");
  }

  function renderMarkdownAndMath(container, text) {
    if (!text) return;
    
    const normalizedMarkdown = normalizeMathDelimiters(text);
    let html = normalizedMarkdown;
    
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        html = window.marked.parse(normalizedMarkdown);
      } else {
        html = normalizedMarkdown
          .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
          .replace(/\n/g, "<br/>");
      }
    } catch (e) {
      console.error("Markdown render error:", e);
      html = normalizedMarkdown.replace(/\n/g, "<br/>");
    }
    
    if (window.DOMPurify) {
      html = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
    }
    container.innerHTML = html;

    container.querySelectorAll('pre code').forEach(block => {
      if (block.classList.contains('language-graph-update') || block.classList.contains('lang-graph-update')) {
        return;
      }
      
      const pre = block.parentElement;
      if (pre && pre.tagName === 'PRE') {
        pre.style.background = 'var(--sf2)';
        pre.style.padding = '12px';
        pre.style.borderRadius = '8px';
        pre.style.overflow = 'auto';
      }
    });
    
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(container, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false
      });
    }
  }

  function bindEventListeners() {
    console.log('Binding event listeners', { sendBtn, welcomeSendBtn, input, welcomeInput });
    sendBtn?.addEventListener('click', () => { console.log('Send button clicked'); sendMessage(input?.value?.trim() || ''); });
    welcomeSendBtn?.addEventListener('click', () => { console.log('Welcome send button clicked'); sendMessage(welcomeInput?.value?.trim() || ''); });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value.trim());
      }
    });

    // Auto-resize welcome textarea as user types
    welcomeInput?.addEventListener('input', () => {
      welcomeInput.style.height = 'auto';
      welcomeInput.style.height = Math.min(welcomeInput.scrollHeight, 200) + 'px';
    });

    welcomeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(welcomeInput.value.trim());
      }
    });

    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        sendMessage(prompt);
      });
    });

    clearChatBtn?.addEventListener('click', () => {
      newChat();
    });
  }

  function init() {
    console.log('Desmos Chat initializing...', {
      input: !!input,
      welcomeInput: !!welcomeInput,
      sendBtn: !!sendBtn,
      welcomeSendBtn: !!welcomeSendBtn,
      messagesList: !!messagesList,
      documentReadyState: document.readyState
    });
    try {
      initializeSATGraph();
      bindGraphControls();
      bindEventListeners();
      setupFileAttachment();
      console.log('Init completed successfully');
    } catch (e) {
      console.error('Init error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  } catch (e) {
    console.error('Desmos Chat Error:', e);
  }

  function initResizeHandle() {
    const handle = document.getElementById('resize-handle');
    const graphPanel = document.getElementById('sat-graph-panel');
    const chatPanel = document.getElementById('main-content');
    if (!handle || !graphPanel || !chatPanel) return;

    let isDragging = false;
    let startY;
    let startGraphHeight;

    const onDragStart = (clientY) => {
      isDragging = true;
      startY = clientY;
      startGraphHeight = graphPanel.offsetHeight;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    };

    const onDragMove = (clientY) => {
      if (!isDragging) return;
      const deltaY = clientY - startY;
      const newGraphHeight = startGraphHeight + deltaY;
      const minHeight = 5 * 16;
      const maxHeight = window.innerHeight * 0.7;
      if (newGraphHeight >= minHeight && newGraphHeight <= maxHeight) {
        graphPanel.style.flex = 'none';
        graphPanel.style.height = newGraphHeight + 'px';
        chatPanel.style.flex = '1';
      }
    };

    const onDragEnd = () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    handle.addEventListener('mousedown', (e) => onDragStart(e.clientY));
    document.addEventListener('mousemove', (e) => onDragMove(e.clientY));
    document.addEventListener('mouseup', onDragEnd);

    handle.addEventListener('touchstart', (e) => { e.preventDefault(); onDragStart(e.touches[0].clientY); }, { passive: false });
    document.addEventListener('touchmove', (e) => { if (isDragging) { e.preventDefault(); onDragMove(e.touches[0].clientY); } }, { passive: false });
    document.addEventListener('touchend', onDragEnd);
  }

  function handleResize() {
    const handle = document.getElementById('resize-handle');
    const graphPanel = document.getElementById('sat-graph-panel');
    const chatPanel = document.getElementById('main-content');
    const isMinimized = window.innerWidth <= 56.25 * 16;
    if (handle) {
      handle.style.display = isMinimized ? 'block' : 'none';
    }
    if (!isMinimized && graphPanel && chatPanel) {
      graphPanel.style.flex = '';
      graphPanel.style.height = '';
      chatPanel.style.flex = '';
      graphPanel.style.minHeight = '';
      chatPanel.style.minHeight = '';
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  const checkAndInitResize = setInterval(() => {
    if (document.getElementById('resize-handle')) {
      initResizeHandle();
      clearInterval(checkAndInitResize);
    }
  }, 100);
})();
