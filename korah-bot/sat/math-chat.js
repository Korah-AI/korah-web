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
        // A regression with x_1 / y_1 that comes before any table is broken.
        const hasTilde = lx.includes('\\sim') || /(?:^|[^\\])~/.test(lx);
        const refsTableVar = /x_\{?1\}?|y_\{?1\}?/.test(lx);
        if (hasTilde && refsTableVar && !seenTable) {
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

  const SAT_MATH_SYSTEM_PROMPT_BASE = `ABOUT KORAH: Created by Oscar Euceda, a high school programmer, Korah is a free academic resource designed to help students and communities receive quality education at the click of a button. Your mission is to make learning accessible, engaging, and effective for everyone.

You are Korah, a specialized SAT Math tutor. You teach students how to solve SAT Math problems using three core strategies — choosing the fastest one for each problem:

1. **Strategic (Desmos-first)** — Graph both sides or plug in answer choices visually. Fastest when the problem gives you expressions to compare.
2. **Regression** — Use Desmos regression to solve for unknowns or fit data. Fastest when the problem gives you data points or asks you to find a parameter.
3. **Algebraic** — Solve by hand with clear steps. Use when the problem is purely symbolic or when you want to verify a Desmos answer.

You cover all SAT Math domains:
- Algebra (linear equations, systems, inequalities)
- Advanced Math (quadratics, polynomials, exponential/rational functions)
- Problem-Solving & Data Analysis (ratios, percentages, statistics, scatterplots)
- Geometry & Trigonometry (area, volume, circles, right triangles, unit circle)

═══════════════════════════════════════════
TEACHING APPROACH — STEP-BY-STEP ALWAYS
═══════════════════════════════════════════

Every explanation MUST follow this structure:

**Step 1 — Understand the problem.** Restate what is given and what is being asked. Identify the problem type (linear, quadratic, system, data/regression, geometry, etc.).

**Step 2 — Choose a strategy.** Explicitly tell the student which approach you are using and WHY it is the fastest:
- "This is a parameter-solving problem → **Regression trick** is fastest."
- "We have answer choices with graphable expressions → **Graph-and-check** is fastest."
- "This is a pure algebra manipulation → **Algebraic approach** is cleanest."

**Step 3 — Execute step-by-step.** Show each substep clearly. When using Desmos, narrate what appears on the graph: "Notice on the graph that the two curves intersect at $x = 3$..."

**Step 4 — Verify.** Always verify the answer using a second method or by plugging back in. Reference the graph: "As you can see on the graph, plugging $k = 2.45$ back in makes both expressions identical."

**Step 5 — SAT Tip.** End with a brief, actionable test-day tip related to this problem type.

═══════════════════════════════════════════
SAT PROBLEM-SOLVING STRATEGIES (DETAILED)
═══════════════════════════════════════════

STRATEGY A — REGRESSION TRICK (for solving unknowns)
When a problem says "Expression A can be rewritten as Expression B, find k" or "find h and k":
1. Set the two expressions equal to each other.
2. Replace every variable (like $x$) with a subscript constant ($x_1$). This tells Desmos to treat it as data, not a variable.
3. Replace the equals sign ($=$) with a tilde ($\\sim$). This tells Desmos to run a regression.
4. **If solving for ONE parameter:** Desmos will compute it automatically from context.
5. **If solving for MULTIPLE parameters (h, k, etc.):** First add $x_1 = [1, 2, 3]$ (or an appropriate range like [0, 5]) to define data points for fitting. This gives Desmos concrete values to regress against.
6. Read the fitted values from the graph panel.

EXAMPLE (single parameter) — "$(1/3)x^2 - 2$ can be rewritten as $(1/3)(x-k)(x+k)$. Find $k$."
→ Type: $\\frac{1}{3}x_{1}^{2}-2 \\sim \\frac{1}{3}(x_{1}-k)(x_{1}+k)$
→ Desmos outputs $k \\approx 2.449$, which is $\\sqrt{6}$.
→ Verify: plug $k = \\sqrt{6}$ back in and graph both — they overlap perfectly.

EXAMPLE (multiple parameters) — "$2x^2 - 12x + 10$ can be rewritten as $2(x-h)^2 + k$. Find $h$ and $k$."
→ First set $x_1 = [1, 2, 3, 4, 5]$ to define test points.
→ Then type the regression: $2x_{1}^{2}-12x_{1}+10 \\sim 2(x_{1}-h)^{2}+k$
→ Desmos fits both $h$ and $k$ simultaneously using the $x_1$ values as anchors.
→ Read: $h \\approx 3$, $k \\approx -8$. Verify by substituting back.

STRATEGY B — DATA TABLE + REGRESSION (for data/scatterplot problems)
When a problem gives you a table of values or data points:
1. Enter the data as a table with columns $x_1$ and $y_1$.
2. Run the appropriate regression (linear, quadratic, exponential, etc.).
3. Read the equation from the regression output.
4. If the problem gives answer choices, also graph each choice and see which one passes through all the points.

EXAMPLE — "A linear function contains the points (-1,12), (0,15), (1,18), (2,21). Which expression represents it?"
→ Enter the table, run linear regression $y_1 \\sim mx_1 + b$.
→ Desmos outputs $m=3$, $b=15$, so the function is $3x+15$.
→ Alternatively: graph each answer choice ($3x+12$, $15x+12$, $15x+15$, $3x+15$) and see which line hits every data point. Only $3x+15$ passes through all four.

STRATEGY C — GRAPH-AND-CHECK (for multiple choice with graphable expressions)
When the problem gives you answer choices that are equations/functions:
1. Graph the constraint or original equation.
2. Graph each answer choice in a different color.
3. The correct answer is the one that matches, intersects at the right point, or passes through the data.

STRATEGY D — ALGEBRAIC (traditional solving)
Use standard algebra when the problem is purely symbolic:
- Show each manipulation step clearly.
- Use KaTeX display math ($$...$$) for important equations.
- Always state what operation you are performing: "Subtract 3 from both sides..."
- After solving, graph the result on Desmos so the student can see it visually.

═══════════════════════════════════════════
RESPONSE FORMAT (STRICT) — PHASE 1 CLASSIFICATION
═══════════════════════════════════════════

You will NOT generate raw Desmos JSON yourself. The system has a library of human-verified Desmos templates.
Your job in Phase 1 is to:
1. Read the student's problem
2. Pick the best matching template from the AVAILABLE TEMPLATES list (or null if none fit)
3. Explain the solving strategy and walk the student through it in text

You MUST respond with a single raw JSON object (no markdown code fences) with these fields:

{
  "stateId": "id_from_the_template_list_or_null",
  "strategy": "Brief reason for selecting this template — what about the problem matches",
  "response": "Your full Markdown + KaTeX explanation for the student",
  "suggestions": ["optional follow-up 1", "optional follow-up 2"]
}

TEMPLATE SELECTION RULES:
- "stateId" must exactly match an "id" from the AVAILABLE TEMPLATES list, or be null.
- Set stateId to null when no template fits — the graph will not update, and you should explain in "response" why no graph is being shown.
- "visualizer" templates load as-is for conceptual demonstrations (symmetry, unit circle, etc.).
- "problem-solver" templates trigger a Phase 2 adaptation — the system will give you the example + template and ask you to fill in problem-specific values.
- Pick the template whose description and keywords best match the problem at hand.

═══════════════════════════════════════════
TEXT RESPONSE RULES
═══════════════════════════════════════════

The "response" field contains your explanation using:
- Markdown headings (## Step 1, ## Step 2, etc.), bold, italic
- KaTeX for math: $inline$ or $$display$$
- NEVER use \\\\(...\\\\), \\\\[...\\\\], or bare math outside dollar signs.
- NEVER embed raw JSON objects or code blocks inside the response text.
- Reference the graph directly: "Look at the graph — the green regression line passes through all four data points."
- Always number your steps and label them with the strategy name.

OPTIONALLY include a "suggestions" field with 0-2 follow-up questions the user might ask next.
Only include suggestions if genuinely useful. Max 2 items.`;

function getFormatInstructions() {
  return `STRICT RESPONSE FORMAT: Output ONLY raw JSON. No code blocks.
Fields: { "stateId": "id_or_null", "strategy": "...", "response": "...", "suggestions": [...] }
KATEX in "response": $...$ for inline, $$...$$ for display.
OPTIONAL: Include 0-2 "suggestions" for follow-up questions.`;
}

async function buildPhase1SystemPrompt() {
  const index = await loadTemplateIndex();
  const block = buildTemplateIndexBlock(index);
  return SAT_MATH_SYSTEM_PROMPT_BASE + '\n\n' + block;
}

function buildPhase2SystemPrompt() {
  return `You are adapting a Desmos calculator state to fit a specific SAT problem.

You will receive:
- The student's problem
- A FULL WORKING EXAMPLE: real Desmos JSON that solves a similar problem of this type
- A TEMPLATE: the same JSON structure with {{PLACEHOLDER}} slots indicating what to fill in

YOUR JOB:
1. Read the example to understand the syntax, structure, and reasoning style
2. Use the template as your guide for what each slot should contain
3. Output a complete Desmos state JSON that solves THE STUDENT'S problem
4. Every {{PLACEHOLDER}} must be replaced with a real problem-specific value
5. Rewrite text nodes to explain THIS specific problem (don't copy the example's text verbatim)

CRITICAL DESMOS RULES (violations will break the graph):
- Table data columns must use SUBSCRIPT notation: x_{1}, y_{1} (NOT bare x or y)
- A table must appear BEFORE any expression that uses its columns
- Regressions use TILDE (\\sim) not equals
- Text nodes use ONLY {type, id, text}. NO color field on text nodes.
- Every id must be unique within the expressions.list
- LaTeX backslashes must be properly JSON-escaped (\\\\frac, \\\\sim, \\\\left, etc.)
- Do NOT include "graph", "viewport", or other top-level fields beyond version/randomSeed/expressions

WHAT YOU CAN DO:
- Add new expressions or text nodes if the problem needs them
- Omit template slots if they're not needed for this problem
- Use the example's id values or generate new unique ones
- Choose appropriate colors from the example's palette

OUTPUT FORMAT:
Output a single raw JSON object — the full Desmos state — with NO surrounding text, no code fences, no commentary.

The object must have this shape:
{
  "version": 11,
  "randomSeed": "32-char hex",
  "expressions": {
    "list": [ ...your adapted expressions... ]
  }
}

If you cannot adapt the template (problem doesn't actually match), output exactly: null`;
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
    let example, template;
    try {
      [example, template] = await Promise.all([loadExample(stateId), loadTemplate(stateId)]);
    } catch (e) {
      console.error(`Phase 2: failed to load example/template for ${stateId}:`, e);
      return null;
    }

    const userContent =
`PROBLEM:
${problem}

=== FULL WORKING EXAMPLE (real Desmos JSON for a similar problem of this type) ===
${JSON.stringify(example, null, 2)}

=== TEMPLATE (same structure with {{PLACEHOLDER}} slots to fill in) ===
${JSON.stringify(template, null, 2)}

Output the adapted Desmos state JSON ONLY (no commentary, no code fences).`;

    let fullText = '';
    try {
      await callAPI(userContent, (_chunk, full) => { fullText = full; }, {
        systemPrompt: buildPhase2SystemPrompt(),
        temperature: 0.2,
      });
    } catch (e) {
      console.error('Phase 2 API call failed:', e);
      return null;
    }

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
      console.warn('Phase 2: model left unfilled placeholders:', leftoverSlots);
      // Still attempt to load — leftover {{...}} in latex will visibly fail in Desmos,
      // which is better than silently dropping the graph.
    }

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
    const mainContent = document.getElementById('main-content');

    attachBtn?.addEventListener('click', () => fileInput?.click());
    welcomeAttachBtn?.addEventListener('click', () => fileInput?.click());

    fileInput?.addEventListener('change', (e) => {
      if (e.target.files?.length) { handleNewFiles(e.target.files); e.target.value = ''; }
    });

    if (mainContent) {
      mainContent.addEventListener('dragover', (e) => { e.preventDefault(); dragOverlay?.classList.add('show'); });
      mainContent.addEventListener('dragleave', (e) => { if (!mainContent.contains(e.relatedTarget)) dragOverlay?.classList.remove('show'); });
      mainContent.addEventListener('drop', (e) => { e.preventDefault(); dragOverlay?.classList.remove('show'); if (e.dataTransfer.files?.length) handleNewFiles(e.dataTransfer.files); });
    }
    dragOverlay?.addEventListener('dragleave', () => dragOverlay.classList.remove('show'));
    dragOverlay?.addEventListener('drop', (e) => { e.preventDefault(); dragOverlay.classList.remove('show'); if (e.dataTransfer.files?.length) handleNewFiles(e.dataTransfer.files); });
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
    if (window.KorahDB) {
      window.KorahDB.setConversation(id, currentSession).catch(console.error);
    }
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

  function autoTitleFromMessage(text) {
    if (!currentSession || currentSession.autoTitleGenerated || currentSession.userRenamed) return;
    currentSession.title = text.slice(0, 50) + (text.length > 50 ? '…' : '');
    currentSession.autoTitleGenerated = true;
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

    // Restore graph state from session (persisted separately from messages)
    if (currentSession?.graphState && satMathCalculator) {
      try {
        satMathCalculator.setState(currentSession.graphState);
        captureGraphState();
      } catch (e) {
        console.warn('Failed to restore graph state:', e);
      }
    }

    welcomeScreen?.classList.add('hidden');
    document.getElementById('chat-input-area')?.classList.remove('hidden');
    chatBody.scrollTop = chatBody.scrollHeight;
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
    createNewSession();
  }

  async function initSession() {
    const hash = window.location.hash.slice(1);
    if (hash && window.KorahDB) {
      const session = await window.KorahDB.getConversation(hash);
      if (session && session.mode === 'sat-math') {
        currentSessionId = hash;
        currentSession = session;
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

    // Auto-title from first message
    if (conversationHistory.length === 0) autoTitleFromMessage(userMessage);

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

  console.log('Calling API with message:', fullMessage.substring(0, 50));
  let parsedResponse = null;
  let isJSONMode = false;
  let fullReplyFromAPI = "";

  try {
    const userContent = buildUserContent(fullMessage, pendingFiles);
    await callAPI(userContent, (chunk, fullText) => {
      // Remove thinking indicator when first chunk arrives
      if (thinkingIndicator && fullText.length > 0) {
        thinkingIndicator.remove();
        thinkingIndicator = null;
      }
      
      fullReplyFromAPI = fullText;
      if (contentElement && fullText) {
        const delta = fullText.slice(lastBufferedLength);
        lastBufferedLength = fullText.length;
        
        if (!isJSONMode && (fullText.trim().startsWith('{') || fullText.trim().startsWith('```json'))) {
          isJSONMode = true;
          charBuffer = []; 
        }
        
        if (!isJSONMode) {
          charBuffer.push(...delta.split(''));
          if (!typewriterActive) {
            typeNextChar();
          }
        } else {
          // While streaming JSON, try to extract and show the response field
          // Use more robust parsing - try to find the response value by counting braces
          const responseKey = '"response":';
          const responseStart = fullText.indexOf(responseKey);
          if (responseStart !== -1) {
            let inString = false;
            let escapeNext = false;
            let quoteStart = -1;
            // Start scanning right after `"response":` (skip optional whitespace to find opening quote)
            for (let i = responseStart + responseKey.length; i < fullText.length; i++) {
              const char = fullText[i];
              if (escapeNext) {
                escapeNext = false;
                continue;
              }
              if (char === '\\') {
                escapeNext = true;
                continue;
              }
              if (char === '"') {
                if (!inString) {
                  inString = true;
                  quoteStart = i;
                } else {
                  // End of string - we have the full response value so far
                  const responseValue = unescapeJSONString(fullText.substring(quoteStart + 1, i));
                  renderMarkdownAndMath(contentElement, responseValue + "▊");
                  break;
                }
              }
            }
            // If we found the opening quote but not the closing one yet (still streaming), render partial
            if (quoteStart !== -1 && inString === true) {
              const partial = unescapeJSONString(fullText.substring(quoteStart + 1));
              if (partial.length > 0) {
                renderMarkdownAndMath(contentElement, partial + "▊");
              }
            }
          } else if (!contentElement.textContent || contentElement.textContent === "Korah is thinking...") {
            contentElement.textContent = "Korah is thinking...";
          }
        }
      }
    });

      typingIndicator?.classList.add('hidden');
      
      charBuffer = [];
      typewriterActive = false;
      
      if (contentElement) {
        const finalRawText = fullReplyFromAPI.trim();
        
        // ── Manual field extraction ──────────────────────────────
        // Instead of JSON.parse (which breaks on unescaped LaTeX
        // backslashes like \frac, \sim, \text), we extract each
        // field directly from the raw text.

        const parseAIResponse = (raw) => {
          let s = raw.trim();
          // Strip ```json ... ``` wrappers
          s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
          const braceIdx = s.indexOf('{');
          if (braceIdx === -1) return null;
          s = s.substring(braceIdx);

          // Fast path: try JSON.parse first (handles well-formed JSON)
          try {
            const p = JSON.parse(s);
            if (p && (p.response || 'stateId' in p)) return p;
          } catch (_) {}

          // Slow path: extract fields manually
          const result = { stateId: null, strategy: '', response: '', suggestions: [] };

          result.response = extractStringField(s, 'response') || '';
          result.strategy = extractStringField(s, 'strategy') || '';

          // ── Extract "stateId" (string or null) ──
          const idStart = findFieldValueStart(s, 'stateId');
          if (idStart !== -1) {
            const after = s.substring(idStart).trim();
            if (after.startsWith('null')) {
              result.stateId = null;
            } else if (after.startsWith('"')) {
              const closeQuote = after.indexOf('"', 1);
              if (closeQuote !== -1) result.stateId = after.substring(1, closeQuote);
            }
          }

          // ── Extract "suggestions" array ──
          const sugStart = findFieldValueStart(s, 'suggestions');
          if (sugStart !== -1) {
            const after = s.substring(sugStart).trim();
            if (after.startsWith('[')) {
              const end = after.indexOf(']');
              if (end !== -1) {
                try { result.suggestions = JSON.parse(after.substring(0, end + 1)); }
                catch (_) {}
              }
            }
          }

          return (result.response || result.stateId) ? result : null;
        };

        // Find the index right after `"fieldName":` in text
        const findFieldValueStart = (text, name) => {
          const key = '"' + name + '"';
          const idx = text.indexOf(key);
          if (idx === -1) return -1;
          let i = idx + key.length;
          while (i < text.length && text[i] !== ':') i++;
          return i < text.length ? i + 1 : -1;
        };

        // Extract a JSON string value, properly unescaping while
        // preserving LaTeX backslashes (\frac → \frac, not form-feed + rac)
        const extractStringField = (text, name) => {
          const start = findFieldValueStart(text, name);
          if (start === -1) return null;
          let i = start;
          while (i < text.length && /\s/.test(text[i])) i++;
          if (text[i] !== '"') return null;
          i++; // skip opening quote

          let value = '';
          let esc = false;
          while (i < text.length) {
            const ch = text[i];
            if (esc) {
              switch (ch) {
                case '"':  value += '"'; break;
                case '\\': value += '\\'; break;
                case '/':  value += '/'; break;
                case 'n': case 'r': case 't': case 'b': case 'f':
                  // If next char is also a letter → LaTeX (\frac, \nabla, \text …)
                  if (i + 1 < text.length && /[a-z]/.test(text[i + 1])) {
                    value += '\\' + ch;           // keep as literal backslash + letter
                  } else {
                    value += ({ n: '\n', r: '\r', t: '\t', b: '', f: '' })[ch];
                  }
                  break;
                case 'u':
                  if (i + 4 < text.length && /^[0-9a-fA-F]{4}$/.test(text.substring(i + 1, i + 5))) {
                    value += String.fromCharCode(parseInt(text.substring(i + 1, i + 5), 16));
                    i += 4;
                  } else {
                    value += '\\u';
                  }
                  break;
                default:
                  // Any other \X → keep as LaTeX (\sim, \left, \cdot …)
                  value += '\\' + ch;
              }
              esc = false; i++; continue;
            }
            if (ch === '\\') { esc = true; i++; continue; }
            if (ch === '"') break; // closing quote
            value += ch; i++;
          }
          return value;
        };

        // Extract a balanced { … } block from the start of text
        const extractBraceBlock = (text) => {
          if (text[0] !== '{') return null;
          let depth = 0, inStr = false, esc = false;
          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            if (esc) { esc = false; continue; }
            if (ch === '\\') { esc = true; continue; }
            if (ch === '"') { inStr = !inStr; continue; }
            if (inStr) continue;
            if (ch === '{') depth++;
            else if (ch === '}') { depth--; if (depth === 0) return text.substring(0, i + 1); }
          }
          return null;
        };

        // Fix LaTeX backslashes inside JSON strings so JSON.parse works
        // (used only for the graph/suggestions objects, not the response text)
        const fixEscapesForJSON = (jsonStr) => {
          let out = '', inStr = false, esc = false;
          for (let i = 0; i < jsonStr.length; i++) {
            const ch = jsonStr[i];
            if (esc) {
              if (inStr) {
                if (!'"\\/bfnrtu'.includes(ch)) {
                  out += '\\';
                } else if ('bfnrt'.includes(ch) && i + 1 < jsonStr.length && /[a-z]/.test(jsonStr[i + 1])) {
                  out += '\\';
                }
              }
              out += ch; esc = false; continue;
            }
            if (ch === '\\') { esc = true; out += ch; continue; }
            if (ch === '"') inStr = !inStr;
            if (inStr) {
              if (ch === '\n') { out += '\\n'; continue; }
              if (ch === '\r') { out += '\\r'; continue; }
              if (ch === '\t') { out += '\\t'; continue; }
            }
            out += ch;
          }
          return out;
        };

        parsedResponse = parseAIResponse(finalRawText);

        if (parsedResponse && typeof parsedResponse === 'object' && (parsedResponse.stateId || parsedResponse.response)) {
          const chatResponse = parsedResponse.response || '';
          const stateId = parsedResponse.stateId || null;

          contentElement.textContent = '';
          if (chatResponse) {
            renderMarkdownAndMath(contentElement, chatResponse);
          } else if (stateId) {
            renderMarkdownAndMath(contentElement, "_Loading graph..._");
          }
          chatBody.scrollTop = chatBody.scrollHeight;

          // Resolve and load the Desmos state for the chosen template.
          if (stateId) {
            try {
              const index = await loadTemplateIndex();
              const entry = index.find(e => e.id === stateId);
              if (!entry) {
                console.warn(`Phase 1: stateId "${stateId}" not in template index`);
              } else if (entry.type === 'visualizer') {
                const example = await loadExample(stateId);
                const result = loadDesmosState(example);
                if (!result.ok) console.warn('Visualizer load failed:', result.errors);
              } else if (entry.type === 'problem-solver') {
                // Phase 2: ask the model to adapt the template for this specific problem.
                const adapted = await runPhase2Adaptation(userMessage, stateId);
                if (adapted) {
                  const result = loadDesmosState(adapted);
                  if (!result.ok) {
                    console.warn('Adapted state validation failed:', result.errors, adapted);
                    // Fall back to the verified example so the student still sees something.
                    const example = await loadExample(stateId);
                    loadDesmosState(example);
                  }
                } else {
                  console.warn('Phase 2 returned null; falling back to verified example.');
                  const example = await loadExample(stateId);
                  loadDesmosState(example);
                }
              }
            } catch (e) {
              console.error('Failed to resolve/load template:', e);
            }
          }
        } else {
          // If not valid JSON or missing fields, fall back to rendering the whole text
          contentElement.textContent = '';
          renderMarkdownAndMath(contentElement, finalRawText);
        }

        chatBody.scrollTop = chatBody.scrollHeight;
      }

      // ── Persist conversation history ──
      conversationHistory.push({ role: 'user', content: userMessage });
      conversationHistory.push({ role: 'assistant', content: fullReplyFromAPI });
      saveCurrentSession();

      if (parsedResponse?.suggestions && Array.isArray(parsedResponse.suggestions)) {
        aiSuggestions = parsedResponse.suggestions.slice(0, 2);
      }

      if (aiSuggestions.length > 0 && streamingRow) {
        const bubble = streamingRow.querySelector('.msg-bubble');
        if (bubble) {
          const existingSuggestions = bubble.querySelector('.inline-suggestions');
          if (!existingSuggestions) {
            const suggestionsDiv = document.createElement('div');
            suggestionsDiv.className = 'inline-suggestions';
            aiSuggestions.forEach((suggestion) => {
              const btn = document.createElement('button');
              btn.className = 'inline-suggestion-btn t-btn';
              btn.textContent = suggestion;
              btn.addEventListener('click', () => sendMessage(suggestion));
              suggestionsDiv.appendChild(btn);
            });
            bubble.appendChild(suggestionsDiv);
          }
        }
      }

    } catch (error) {
      console.error('Error in sendMessage:', error);
      typingIndicator?.classList.add('hidden');
      addMessage('assistant', 'Sorry, I encountered an error. Please try again. ' + error.message, true);
    }
  }

  async function callAPI(userContent, onChunk = null, options = {}) {
    const systemPrompt = options.systemPrompt
      ?? ((await buildPhase1SystemPrompt()) + getFormatInstructions());
    const temperature = options.temperature ?? 0.4;

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
      headers: { "Content-Type": "application/json" },
      body: bodyStr
    });

    if (!response.ok) {
      let errorMessage = `Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch (_error) {}
      throw new Error(errorMessage);
    }

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
