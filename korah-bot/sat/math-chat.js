console.log('math-chat.js loading...');
(() => {
  try {
  console.log('math-chat.js try block entered');
  const API_ENDPOINT = "/api/gem-proxy";
  const MODEL = "gemini-2.5-flash";

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

  // ─── Phase 1 (classifier) ──────────────────────────────────────────────
  // Pure template selection. Tiny output. Streams but feels instant.
  const PHASE1_CLASSIFIER_PROMPT_BASE = `You are the classifier stage of Korah, an SAT Math tutor. Your ONLY job is to pick the best matching Desmos template id for the student's problem.

Output a single raw JSON object — NO code fences, NO commentary, NO extra fields:

{
  "stateId": "id_from_template_list_or_null",
  "strategy": "one short sentence (max 20 words) on which template fits and why"
}

═══════════════════════════════════════════
BIAS STRONGLY TOWARD PICKING A TEMPLATE
═══════════════════════════════════════════

Korah's whole value is teaching SAT math through Desmos. ALMOST EVERY SAT MATH PROBLEM maps to one of the templates below. Default to picking a template. Only return null as an absolute last resort.

Concretely, you SHOULD pick a template whenever ANY of these apply:
- The problem involves a linear function, line, slope, y-intercept → linear-functions / linear-equations-in-two-variables
- The problem involves an equation in one variable with unknown constants and asks about "infinitely many solutions" or "no solutions" → linear-equations-in-one-variable
- The problem gives an inequality and asks which (x,y) pairs satisfy it → linear-equalities-in-one-or-two-variables
- The problem gives a system of two equations and asks for a value at the intersection → system-of-two-linear-equations
- The problem is a polynomial identity like (ax+...)(...) = ... where the equation holds "for all x" → equivalent-expressions
- The problem is a quadratic in vertex form, or asks about vertex/parabola shape → quadratic-from-vertex-point
- The problem involves symmetry, even/odd functions, reflection → 3-types-of-symmetry
- The problem involves the unit circle, sin θ, cos θ, angles, radians → unit-circle
- The problem involves sine/cosine waves, period, amplitude, phase → sine-cosine-sinuoids-graphs
- The problem involves dilations, vertical/horizontal stretches → nonrigid-transformations-dilations
- The problem mentions concavity, concave up/down, rate of change → concavity-discovery / concavity-rate-of-change

Only return stateId: null if the problem is COMPLETELY non-mathematical (e.g., "hi" or "what is Korah?") or if it's a math problem in a category clearly outside the template list (e.g., a 3D geometry problem about volumes, or a probability/statistics question with no graph utility). When in doubt — PICK A TEMPLATE.

═══════════════════════════════════════════
RULES
═══════════════════════════════════════════

- stateId must be EXACTLY an "id" from the AVAILABLE TEMPLATES list below, or null.
- "visualizer" templates are for conceptual questions (e.g., "what is concavity?", "show me the unit circle"). Pick these when the student asks to UNDERSTAND a concept rather than solve a specific problem.
- "problem-solver" templates are for actual SAT problems with concrete numbers/equations to solve. Prefer these when the student pastes or describes an SAT-style problem.
- Do NOT explain the math. Do NOT write a tutoring response. Just classify.
- Output ONLY the JSON object. Nothing else.`;

  async function buildPhase1SystemPrompt() {
    const index = await loadTemplateIndex();
    const block = buildTemplateIndexBlock(index);
    return PHASE1_CLASSIFIER_PROMPT_BASE + '\n\n' + block;
  }

function buildPhase2SystemPrompt() {
  return `You are adapting a Desmos calculator state to fit a SPECIFIC STUDENT PROBLEM.

═══════════════════════════════════════════
CRITICAL: YOU MUST ADAPT, NOT COPY
═══════════════════════════════════════════

You are NOT allowed to output the example verbatim. The example uses ITS OWN numbers and ITS OWN problem text — none of that is the student's problem. You MUST:

1. Read the student's actual problem (numbers, equations, coefficients, constraints).
2. Use the TEMPLATE as your structural guide — same expression types in the same order.
3. Fill EVERY {{PLACEHOLDER}} with values from the STUDENT'S problem (not from the example).
4. Rewrite EVERY text node so it describes the STUDENT'S problem (not the example's). Use the student's numbers, the student's variable names, the student's question.
5. Replace the example's numeric values in tables/expressions with the student's numeric values.

If your output is byte-for-byte the same as the example, you have FAILED THIS TASK.

═══════════════════════════════════════════
INPUTS YOU WILL RECEIVE
═══════════════════════════════════════════

- PROBLEM: the student's actual SAT problem
- FULL WORKING EXAMPLE: real Desmos JSON for a DIFFERENT problem of the same type — use ONLY for syntax/structure reference
- TEMPLATE: the structural skeleton with {{PLACEHOLDER}} slots showing where to put the student's values

The example exists so you can see what valid Desmos JSON looks like — NOT for you to copy. The template tells you the shape; the STUDENT'S PROBLEM provides the content.

═══════════════════════════════════════════
HOW TO ADAPT, STEP BY STEP
═══════════════════════════════════════════

For each expression in the template:
- If it's a text node: rewrite the text to describe the student's specific problem using PLAIN TEXT ONLY (use their numbers, their setup, their question). Do NOT carry over the example's text. Do NOT include any LaTeX, backslashes, or math syntax — plain English sentences only. If the template text node contains LaTeX or math, convert it to a readable English sentence instead.
- If it's a table: replace ALL values with the student's data. Keep the same column structure (x_{1}, y_{1}) and order.
- If it's a regression/equation: substitute the student's coefficients, constants, and unknowns. Use the example's syntax (tilde, subscripts) but the student's numbers.
- If it has regressionParameters: keep the parameter list but use the student's unknown letters.

═══════════════════════════════════════════
CRITICAL DESMOS RULES (violations will break the graph)
═══════════════════════════════════════════

- Table data columns must use SUBSCRIPT notation: x_{1}, y_{1} (NOT bare x or y)
- A table must appear BEFORE any expression that uses its columns
- Regressions use TILDE (\\sim) not equals
- Text nodes use ONLY {type, id, text}. NO color field on text nodes.
- Every id must be unique within the expressions.list
- LaTeX backslashes must be properly JSON-escaped (\\\\frac, \\\\sim, \\\\left, etc.)
- Do NOT include "graph", "viewport", or other top-level fields beyond version/randomSeed/expressions

TEXT NODES VS EXPRESSION NODES — THIS IS CRITICAL:
- A { "type": "text" } node MUST contain ONLY plain human-readable text in the "text" field.
  - NO LaTeX, NO backslashes, NO $...$, NO \\frac, NO \\sim, NO subscripts like x_{1}.
  - Plain English sentences only. Example: "The slope is -4 and the y-intercept is 30."
- If you need to display a mathematical formula or equation, use a { "type": "expression" } node with a "latex" key instead.
  - Example: { "type": "expression", "id": "5", "color": "#000000", "latex": "y=-4x+30" }
- NEVER put LaTeX syntax inside a "text" node. The Desmos text widget renders plain text only — LaTeX in a text node will display as raw garbled characters, not formatted math.

WHAT YOU CAN DO:
- Add new expressions or text nodes if the student's problem needs them
- Omit template slots if they're not needed
- Use the example's id values or generate new unique ones
- Choose appropriate colors from the example's palette

═══════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════

Output a single raw JSON object — the full Desmos state — with NO surrounding text, no code fences, no commentary.

Shape:
{
  "version": 11,
  "randomSeed": "32-char hex",
  "expressions": {
    "list": [ ...your adapted expressions for THE STUDENT'S problem... ]
  }
}

REMINDER: every text node, every numeric value, every coefficient must reflect the STUDENT'S problem — not the example's. If unsure, prefer the student's data over the example's.

If the template genuinely cannot represent the student's problem (very rare — only if the classifier picked wrong), output exactly: null`;
}

  // ─── Phase 3 (tutoring response) ────────────────────────────────────────
  // Streams a chat-facing markdown explanation. Grounded in the loaded Desmos
  // state when one was loaded, so the model can reference exact values.
  function buildPhase3SystemPrompt(adaptedState, classifierStrategy) {
    const base = `You are Korah, an SAT Math tutor created by Oscar Euceda. The system has already loaded a Desmos graph for the student (or determined no graph was needed). Your job: explain the solution, referencing what is visible on the graph.

OUTPUT FORMAT:
Output ONLY the explanation text — pure Markdown + KaTeX. NO JSON, NO code fences, NO field names.

STYLE:
- Confident, finished walkthrough. Do NOT think out loud. Do NOT show "let me re-check" moments.
- If you need to verify, do it silently. Only the final clean explanation appears in your output.
- Do NOT type Desmos commands or instruct the student to "type $x_1 = [1,2,3]$". The graph is already on screen — reference what it shows.
- Be concise. Clarity over length.

STRUCTURE:
**Step 1 — Understand the problem.** Restate what is given and what is being asked.
**Step 2 — Strategy.** One sentence on the approach (e.g., "Read m and b from the regression on the graph").
**Step 3 — Solve.** Walk through the math, referencing what the graph shows ("The regression line fits m = -4 and b = 30…"). Use the EXACT values that appear in the loaded state below.
**Step 4 — Answer.** State the final answer clearly.
**Step 5 — SAT Tip.** One short test-day tip.

TEXT FORMATTING:
- Markdown headings, **bold**, *italic*
- KaTeX for math: $inline$ or $$display$$. Every variable, coefficient, equation goes in dollar signs.
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

  // Phase 1 caller: non-streaming feel (small JSON output, parsed at the end).
  async function runPhase1Classification(problem) {
    console.log('🔵 [Phase 1] classifier starting…');
    const t0 = performance.now();
    let fullText = '';
    try {
      await callAPI(problem, (_chunk, full) => { fullText = full; }, {
        systemPrompt: (await buildPhase1SystemPrompt()),
        temperature: 0.1,
        _phaseTag: 'Phase 1 (classify)',
      });
    } catch (e) {
      console.error('🔵 [Phase 1] API call failed:', e);
      return null;
    }
    const dt = Math.round(performance.now() - t0);
    console.log(`🔵 [Phase 1] raw response (${dt}ms, ${fullText.length} chars):`, fullText.slice(0, 300));

    let s = fullText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const braceIdx = s.indexOf('{');
    if (braceIdx === -1) {
      console.warn('🔵 [Phase 1] no JSON object found in response');
      return null;
    }
    s = s.substring(braceIdx);

    let parsed = null;
    try { parsed = JSON.parse(s); } catch (e) { console.warn('🔵 [Phase 1] direct JSON.parse failed:', e.message); }
    if (!parsed) {
      // Last-resort: find balanced braces.
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
        try { parsed = JSON.parse(s.substring(0, end + 1)); } catch (e) { console.warn('🔵 [Phase 1] balanced-brace parse failed:', e.message); }
      }
    }
    if (!parsed) {
      console.warn('🔵 [Phase 1] could not parse JSON, returning null');
      return null;
    }
    const out = {
      stateId: typeof parsed.stateId === 'string' ? parsed.stateId : null,
      strategy: typeof parsed.strategy === 'string' ? parsed.strategy : '',
    };
    console.log('🔵 [Phase 1] parsed:', out);
    return out;
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

  // Run Phase 2: hand the model the example + template + problem, ask it to adapt.
  // Returns a parsed Desmos state (or null on failure).
  async function runPhase2Adaptation(problem, stateId) {
    console.log(`🟡 [Phase 2] adapting template "${stateId}"…`);
    const t0 = performance.now();
    let example, template;
    try {
      [example, template] = await Promise.all([loadExample(stateId), loadTemplate(stateId)]);
    } catch (e) {
      console.error(`🟡 [Phase 2] failed to load example/template for ${stateId}:`, e);
      return null;
    }

    const userContent =
`═══════════════════════════════════════════
STUDENT'S PROBLEM — this is what you must solve
═══════════════════════════════════════════
${problem}

═══════════════════════════════════════════
TEMPLATE — YOUR WORKING FILE. Adapt this.
═══════════════════════════════════════════
This is the file you must fill in. Replace EVERY {{PLACEHOLDER}} with a value from the STUDENT'S PROBLEM above. Rewrite EVERY text node so it describes the student's problem (using their numbers, their variables, their question).

${JSON.stringify(template, null, 2)}

═══════════════════════════════════════════
REFERENCE EXAMPLE — for syntax only. DO NOT copy.
═══════════════════════════════════════════
This is a FULLY-FILLED-IN version of the template, but for a DIFFERENT problem (not the student's). Use it ONLY to see what valid Desmos JSON looks like — what fields exist, how subscripts are written, how regressions are formatted. The numbers, variables, and text in the example belong to a DIFFERENT problem and must NOT appear in your output.

${JSON.stringify(example, null, 2)}

═══════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════
1. Start with the TEMPLATE.
2. For each {{PLACEHOLDER}}, look at the STUDENT'S PROBLEM and write the correct value there.
3. For each text node in the template, write text that explains the STUDENT'S PROBLEM (not the example's).
4. Keep the same expression types, ordering, and structure as the template.
5. Use the REFERENCE EXAMPLE only to confirm Desmos syntax — never copy its content.
6. Output the completed JSON. Nothing else.

If your output looks anything like the REFERENCE EXAMPLE's content, you have failed. Your output should reflect the STUDENT'S PROBLEM.`;

    let fullText = '';
    try {
      await callAPI(userContent, (_chunk, full) => { fullText = full; }, {
        systemPrompt: buildPhase2SystemPrompt(),
        temperature: 0.2,
        _phaseTag: 'Phase 2 (adapt)',
      });
    } catch (e) {
      console.error('🟡 [Phase 2] API call failed:', e);
      return null;
    }
    const dt = Math.round(performance.now() - t0);
    console.log(`🟡 [Phase 2] raw response (${dt}ms, ${fullText.length} chars):`, fullText.slice(0, 200) + '…');

    // Strip code fences if present, then locate the JSON.
    let s = fullText.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    if (s === 'null') return null;
    const braceIdx = s.indexOf('{');
    if (braceIdx === -1) {
      console.warn('Phase 2: no JSON object found in response:', s.slice(0, 200));
      return null;
    }
    s = s.substring(braceIdx);

    // Try direct JSON.parse first (model usually outputs proper escapes for Desmos LaTeX).
    let parsed = null;
    try { parsed = JSON.parse(s); } catch (_) {}

    if (!parsed) {
      // Fallback: balanced brace extraction in case there's trailing junk.
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
        try { parsed = JSON.parse(s.substring(0, end + 1)); } catch (e) {
          console.warn('Phase 2: JSON.parse failed even after brace extraction:', e.message);
        }
      }
    }

    if (!parsed) return null;

    const leftoverSlots = stripPlaceholders(parsed);
    if (leftoverSlots.length > 0) {
      console.warn('🟡 [Phase 2] model left unfilled placeholders:', leftoverSlots);
    }

    // Detect the failure mode where the model just copied the example verbatim
    // (a common shortcut). Compare expressions.list as JSON.
    try {
      const adaptedExprs = JSON.stringify(parsed?.expressions?.list ?? []);
      const exampleExprs = JSON.stringify(example?.expressions?.list ?? []);
      if (adaptedExprs === exampleExprs) {
        console.warn('🟡 [Phase 2] ⚠️ model returned the example VERBATIM — no adaptation happened. Treating as failure so the fallback uses the example anyway (same outcome, but flagged).');
        return null;
      }
    } catch (_) {}

    console.log('🟡 [Phase 2] parsed adapted state with', parsed?.expressions?.list?.length ?? 0, 'expressions ✓');
    return parsed;
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

  function renderInputFilesBar() {
    const bar = document.getElementById('input-files-bar');
    if (!bar) return;
    if (attachedFiles.length === 0) { bar.classList.remove('show'); bar.innerHTML = ''; return; }
    bar.classList.add('show');
    bar.innerHTML = '';
    attachedFiles.forEach((f, i) => {
      const chip = document.createElement('div');
      chip.className = 'input-file-chip';
      chip.innerHTML = `<span>${getFileIcon(f.type, f.name)}</span><span class="input-file-chip-name">${f.name}</span><button class="input-file-chip-remove" title="Remove">×</button>`;
      chip.querySelector('.input-file-chip-remove').addEventListener('click', () => {
        attachedFiles.splice(i, 1); renderInputFilesBar(); renderWelcomeAttachments();
      });
      bar.appendChild(chip);
    });
  }

  function renderWelcomeAttachments() {
    const container = document.getElementById('welcome-attachments');
    if (!container) return;
    container.innerHTML = '';
    attachedFiles.forEach((f, i) => {
      const chip = document.createElement('div');
      chip.className = 'input-file-chip';
      chip.innerHTML = `<span>${getFileIcon(f.type, f.name)}</span><span class="input-file-chip-name">${f.name}</span><button class="input-file-chip-remove" title="Remove">×</button>`;
      chip.querySelector('.input-file-chip-remove').addEventListener('click', () => {
        attachedFiles.splice(i, 1); renderInputFilesBar(); renderWelcomeAttachments();
      });
      container.appendChild(chip);
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
      title: 'SAT Math Chat',
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
    if (chatTitleEl) chatTitleEl.textContent = 'SAT Math';
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

  window.SatMathChat = { initSession, switchToSession, newChat, createNewSession };

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
    if (contentElement) {
      thinkingIndicator = document.createElement("div");
      thinkingIndicator.className = "thinking-indicator";
      thinkingIndicator.innerHTML = `
        <span style="font-size: 0.8125rem; font-weight: 600; margin-right: 0.5rem;">Korah is thinking...</span>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      `;
      contentElement.appendChild(thinkingIndicator);
    }

    let currentTypedText = "";
    let charBuffer = [];
    let typewriterActive = false;
    let lastBufferedLength = 0;

    const typeNextChar = () => {
      if (charBuffer.length === 0) {
        typewriterActive = false;
        return;
      }

      typewriterActive = true;
      const charsToType = charBuffer.length > 20 ? 2 : 1;
      for (let i = 0; i < charsToType; i++) {
        if (charBuffer.length > 0) {
          currentTypedText += charBuffer.shift();
        }
      }

      if (contentElement) {
        renderMarkdownAndMath(contentElement, currentTypedText);
      }

      let delay = 5;
      if (charBuffer.length > 50) delay = 0;

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
    ind.innerHTML = `
      <span style="font-size: 0.8125rem; font-weight: 600; margin-right: 0.5rem;">Drawing graph…</span>
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
      <div class="thinking-dot"></div>
    `;
    contentElement.appendChild(ind);
    thinkingIndicator = ind;
  };

  try {
    const userContent = buildUserContent(fullMessage, pendingFiles);

    // ── PHASE 1: silent classification ──
    const classification = await runPhase1Classification(userContent);
    const stateId = classification?.stateId || null;
    const classifierStrategy = classification?.strategy || '';

    // ── PHASE 2: graph loading (silent, shows "Drawing graph…" indicator) ──
    let loadedState = null;
    if (stateId) {
      showDrawingIndicator();
      try {
        const index = await loadTemplateIndex();
        const entry = index.find(e => e.id === stateId);
        if (!entry) {
          console.warn(`🔵 [Phase 1] stateId "${stateId}" not found in template index — skipping graph`);
        } else if (entry.type === 'visualizer') {
          console.log(`🟡 [Phase 2] visualizer "${stateId}" — loading example as-is (no adaptation API call)`);
          const example = await loadExample(stateId);
          const result = loadDesmosState(example);
          if (result.ok) { loadedState = example; console.log('🟡 [Phase 2] visualizer loaded ✓'); }
          else console.warn('🟡 [Phase 2] visualizer load failed:', result.errors);
        } else if (entry.type === 'problem-solver') {
          const adapted = await runPhase2Adaptation(userMessage, stateId);
          if (adapted) {
            const result = loadDesmosState(adapted);
            if (result.ok) {
              loadedState = adapted;
              console.log('🟡 [Phase 2] adapted state loaded ✓');
            } else {
              console.warn('🟡 [Phase 2] adapted state failed validation, falling back to verified example:', result.errors);
              const example = await loadExample(stateId);
              if (loadDesmosState(example).ok) { loadedState = example; console.log('🟡 [Phase 2] fallback example loaded ✓'); }
            }
          } else {
            console.warn('🟡 [Phase 2] returned null; falling back to verified example.');
            const example = await loadExample(stateId);
            if (loadDesmosState(example).ok) { loadedState = example; console.log('🟡 [Phase 2] fallback example loaded ✓'); }
          }
        }
      } catch (e) {
        console.error('🟡 [Phase 2] failed to resolve/load template:', e);
      }
    } else {
      console.log('⚪ [Phase 2] skipped (stateId is null — no template selected)');
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
      temperature: 0.2,
      _phaseTag: 'Phase 3 (respond)',
    });
    console.log(`🟢 [Phase 3] done in ${Math.round(performance.now() - phase3T0)}ms (${phase3FullText.length} chars)`);

    typingIndicator?.classList.add('hidden');

    // Wait for the typewriter to drain so the final render reflects the full text.
    // (Cheap busy-wait alternative would be ugly; instead, force one final render.)
    if (contentElement && phase3FullText) {
      renderMarkdownAndMath(contentElement, phase3FullText);
      charBuffer = [];
      typewriterActive = false;
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
    const systemPrompt = options.systemPrompt
      ?? (await buildPhase1SystemPrompt());
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

  function addMessage(role, text, isError = false, contentId = null, suggestions = [], fileAttachments = []) {
    const row = document.createElement('div');
    row.className = `msg-row ${role === 'user' ? 'user' : 'assistant'}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${role === 'user' ? 'user-av' : 'korah-av'}`;
    if (role === 'user') {
      avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    } else {
      avatar.innerHTML = `<img src="../logo-images/newlogo0.png" alt="K" class="w-10 h-10 object-contain" />`;
    }

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${role === 'user' ? 'user' : 'korah'}${isError ? ' error' : ''}`;

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

    row.appendChild(avatar);
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
    console.log('SAT Math chat initializing...', {
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
    console.error('SAT Math Chat Error:', e);
  }

  function initResizeHandle() {
    const handle = document.getElementById('resize-handle');
    const graphPanel = document.getElementById('sat-graph-panel');
    const chatPanel = document.getElementById('main-content');
    if (!handle || !graphPanel || !chatPanel) return;

    let isDragging = false;
    let startY;
    let startGraphHeight;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
      startGraphHeight = graphPanel.offsetHeight;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const newGraphHeight = startGraphHeight + deltaY;
      const minHeight = 5 * 16;
      const maxHeight = window.innerHeight * 0.7;
      if (newGraphHeight >= minHeight && newGraphHeight <= maxHeight) {
        graphPanel.style.flex = 'none';
        graphPanel.style.height = newGraphHeight + 'px';
        chatPanel.style.flex = '1';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
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
