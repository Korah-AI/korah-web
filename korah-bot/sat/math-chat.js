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

  const SAT_MATH_SYSTEM_PROMPT = `You are Korah, a specialized SAT Math tutor. You teach students how to solve SAT Math problems using three core strategies — choosing the fastest one for each problem:

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
RESPONSE FORMAT (STRICT)
═══════════════════════════════════════════

IMPORTANT: You MUST respond in JSON format with two fields: "graph" and "response".
DO NOT include any markdown formatting like \`\`\`json outside the JSON itself.
The response must be a single raw JSON object.

{
  "graph": {
    "expressions": [
      {"latex": "y=x^2", "color": "#4285F4"}
    ],
    "viewport": {"xmin": -10, "xmax": 10, "ymin": -10, "ymax": 10}
  },
  "response": "Your explanation here using Markdown and KaTeX . . ."
}

═══════════════════════════════════════════
DESMOS API SYNTAX REFERENCE
═══════════════════════════════════════════

EXPRESSION TYPES:
- Function/equation: {"latex": "y=mx+b", "color": "#2d70b3"}
- Point: {"latex": "(1,2)", "label": "Vertex", "showLabel": true, "color": "#c74440"}
- Variable/constant: {"latex": "a=5"}
- Inequality: {"latex": "y < 2x + 1", "color": "#388c46"}
- Hidden (for helper expressions): {"latex": "f(x)=x^2", "color": "#2d70b3", "hidden": true}
- Text note: {"type": "text", "text": "This is a note"} — do NOT include a latex or color field on text notes.

TABLES:
{
  "type": "table",
  "columns": [
    {"latex": "x_1", "values": ["1", "2", "3", "4", "5"]},
    {"latex": "y_1", "values": ["2.1", "3.9", "6.2", "8.1", "10.2"]}
  ]
}
CRITICAL: Column headers MUST use underscores: $x_1$, $y_1$ (NOT $x$, $y$).
CRITICAL: The table MUST appear BEFORE any regression expression that references its columns.

REGRESSIONS:
A regression uses the tilde (~) to fit parameters. It MUST reference the table columns ($x_1$, $y_1$).
- Linear: {"latex": "y_1 ~ m x_1 + b"}
- Quadratic: {"latex": "y_1 ~ a x_1^2 + b x_1 + c"}
- Exponential: {"latex": "y_1 ~ a b^{x_1}"}
- Power: {"latex": "y_1 ~ a x_1^b"}
- Logarithmic: {"latex": "y_1 ~ a \\\\ln(x_1) + b"}

REGRESSION TRICK (solving for unknowns without a table):
When two expressions are equal and you need to find unknown parameters, replace the variable with $x_1$ (a subscript constant) and use tilde instead of equals:
- Single parameter: {"latex": "\\\\frac{1}{3}x_1^2 - 2 \\\\sim \\\\frac{1}{3}(x_1 - k)(x_1 + k)"}
- Multiple parameters: Always add $x_1 = [1, 2, 3]$ or an appropriate range FIRST, then the regression expression.

For multiple unknowns, the x_1 data points anchor the fitting. Without them, Desmos cannot uniquely solve for 2+ parameters.

COMPLETE EXAMPLES:

Example 1 — Regression trick (no table):
{
  "expressions": [
    {"latex": "\\\\frac{1}{3}x^{2}-2", "color": "#388c46", "hidden": true},
    {"latex": "\\\\frac{1}{3}(x-k)(x+k)", "color": "#2d70b3", "hidden": true},
    {"latex": "\\\\frac{1}{3}x_{1}^{2}-2\\\\sim\\\\frac{1}{3}\\\\left(x_{1}-k\\\\right)\\\\left(x_{1}+k\\\\right)", "color": "#388c46"}
  ],
  "viewport": {"xmin": -5, "xmax": 5, "ymin": -5, "ymax": 5}
}

Example 2 — Data table + linear regression + answer choices:
{
  "expressions": [
    {
      "type": "table",
      "columns": [
        {"latex": "x_1", "values": ["-1", "0", "1", "2"]},
        {"latex": "y_1", "values": ["12", "15", "18", "21"]}
      ]
    },
    {"latex": "y_1 ~ m x_1 + b", "color": "#388c46"},
    {"latex": "3x+15", "color": "#c74440", "lineStyle": "DASHED"}
  ],
  "viewport": {"xmin": -3, "xmax": 4, "ymin": 5, "ymax": 25}
}

Example 3 — Regression trick with multiple parameters:
{
  "expressions": [
    {"latex": "x_1 = [1, 2, 3, 4, 5]"},
    {"latex": "2x_{1}^{2}-12x_{1}+10", "color": "#388c46", "hidden": true},
    {"latex": "2(x_{1}-h)^{2}+k", "color": "#2d70b3", "hidden": true},
    {"latex": "2x_{1}^{2}-12x_{1}+10\\\\sim 2(x_{1}-h)^{2}+k", "color": "#388c46"}
  ],
  "viewport": {"xmin": 0, "xmax": 6, "ymin": -15, "ymax": 15}
}

STYLING:
- Colors: #c74440 (red), #2d70b3 (blue), #388c46 (green), #6042a6 (purple), #fa7e19 (orange), #000000 (black)
- Line Styles: "SOLID", "DASHED", "DOTTED"
- Use different colors for: original expression, answer choices, regression line, verification

GRAPH FIELD RULES:
- "expressions": array of expression objects. For tables, include "type": "table" and "columns".
- "viewport": optional bounds {xmin, xmax, ymin, ymax}. ALWAYS set a viewport that frames the interesting region of the problem (don't leave everything at -10 to 10 if the data is clustered around 0-5).
- To clear the graph: provide an empty expressions array.
- If no graph update needed: set "graph": null.

═══════════════════════════════════════════
TEXT RESPONSE RULES
═══════════════════════════════════════════

The "response" field contains your explanation using:
- Markdown headings (## Step 1, ## Step 2, etc.), bold, italic
- KaTeX for math: $inline$ or $$display$$
- NEVER use \\\\(...\\\\), \\\\[...\\\\], or bare math outside dollar signs.
- NEVER embed raw JSON objects, graph updates, or code blocks inside the response text. ALL Desmos graph updates go ONLY in the top-level "graph" field. The "response" field is text only.
- Reference the graph directly: "Look at the graph — the green regression line passes through all four data points."
- Always number your steps and label them with the strategy name.

OPTIONALLY include a "suggestions" field with 0-2 follow-up questions the user might ask next.
Only include suggestions if genuinely useful. Max 2 items.
Example: "suggestions": ["What if the data were exponential instead?", "How do I verify this on test day?"]`;

function getFormatInstructions() {
  return `STRICT RESPONSE FORMAT: Output ONLY raw JSON. No code blocks.
Fields: { "graph": {...}, "response": "...", "suggestions": [...] }
KATEX: $...$ for inline, $$...$$ for display.
OPTIONAL: Include 0-2 "suggestions" for follow-up questions.`;
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

  function updateSATGraph(data) {
    if (!satMathCalculator) return;
    if (!data || typeof data !== 'object') return;

    const graphContainer = document.getElementById('sat-graph-container');

    // To properly "update" we either clear and rebuild or surgically update.
    // Given the prompt asks to "update existing", we'll clear first to ensure a clean state.
    satMathCalculator.setBlank();

    if (data.viewport) {
      satMathCalculator.setMathBounds({
        left: data.viewport.xmin ?? -10,
        right: data.viewport.xmax ?? 10,
        bottom: data.viewport.ymin ?? -10,
        top: data.viewport.ymax ?? 10,
      });
    }

    if (data.expressions && Array.isArray(data.expressions)) {
      data.expressions.forEach((expr, idx) => {
        const isTextNote = expr.type === 'text';
        // Text notes don't accept a color property — spread everything except color.
        // All other expression types get the default color fallback.
        satMathCalculator.setExpression(isTextNote
          ? { id: expr.id || 'expr_' + idx, ...expr }
          : { id: expr.id || 'expr_' + idx, color: expr.color || '#4285F4', ...expr }
        );
      });
    }

    if (graphContainer) {
      graphContainer.classList.add('graph-updated');
      setTimeout(() => graphContainer.classList.remove('graph-updated'), 500);
    }

    captureGraphState();
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
          try {
            const parsed = JSON.parse(msg.content);
            if (parsed?.response) {
              renderMarkdownAndMath(contentEl, parsed.response);
            } else {
              renderMarkdownAndMath(contentEl, msg.content);
            }
          } catch (_) {
            renderMarkdownAndMath(contentEl, msg.content);
          }
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
    addMessage('user', userMessage);

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
            if (p && (p.response || p.graph)) return p;
          } catch (_) {}

          // Slow path: extract fields manually
          const result = { graph: null, response: '', suggestions: [] };

          // ── Extract "response" string ──
          result.response = extractStringField(s, 'response') || '';

          // ── Extract "graph" object or null ──
          const graphStart = findFieldValueStart(s, 'graph');
          if (graphStart !== -1) {
            const after = s.substring(graphStart).trim();
            if (after.startsWith('null')) {
              result.graph = null;
            } else if (after.startsWith('{')) {
              const obj = extractBraceBlock(after);
              if (obj) {
                try { result.graph = JSON.parse(fixEscapesForJSON(obj)); }
                catch (e) { console.warn('Graph parse failed:', e.message); }
              }
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

          return (result.response || result.graph) ? result : null;
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
        
        if (parsedResponse && typeof parsedResponse === 'object' && (parsedResponse.graph || parsedResponse.response)) {
          const graphData = parsedResponse.graph;
          const chatResponse = parsedResponse.response || '';
          
          if (graphData) {
            console.log('Updating graph with data:', graphData);
            updateSATGraph(graphData);
          }
          
          contentElement.textContent = '';
          if (chatResponse) {
            renderMarkdownAndMath(contentElement, chatResponse);
          } else if (graphData) {
            renderMarkdownAndMath(contentElement, "_Graph updated._");
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

  async function callAPI(userContent, onChunk = null) {
    const messagesWithSystem = [
      { role: 'system', content: SAT_MATH_SYSTEM_PROMPT + getFormatInstructions() },
      { role: 'user', content: userContent }
    ];

    const bodyObj = {
      model: MODEL,
      temperature: 0.4,
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

  function addMessage(role, text, isError = false, contentId = null, suggestions = []) {
    const row = document.createElement('div');
    row.className = `msg-row ${role === 'user' ? 'user' : 'assistant'}`;

    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${role === 'user' ? 'user-av' : 'korah-av'}`;
    if (role === 'user') {
      avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    } else {
      avatar.innerHTML = `<img src="../app/logo.png" alt="K" class="w-10 h-10 object-contain" />`;
    }

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${role === 'user' ? 'user' : 'korah'}${isError ? ' error' : ''}`;

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
