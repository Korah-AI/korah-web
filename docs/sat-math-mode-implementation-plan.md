# SAT Math Chat Implementation Plan

## Overview

Create a dedicated SAT Math chat page with a persistent Desmos graphing calculator. The page integrates with the main chat system but provides a specialized SAT Math tutoring experience with bidirectional graph interaction.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Sidebar (Collapsed)                                    [Toggle ↔]     │
├────────────────────────────────────┬────────────────────────────────────┤
│                                    │  Top Bar                           │
│   Desmos Graph Panel               │  [Korah - SAT Math] [Reset]      │
│   (Persistent, Full Expressions)   ├────────────────────────────────────┤
│                                    │                                    │
│   ┌────────────────────────────┐  │   Messages                        │
│   │  Expression List (Visible)  │  │                                    │
│   │  ─────────────────────────  │  │                                    │
│   │  y = x^2                    │  │                                    │
│   │  y = 2x + 1                 │  │                                    │
│   └────────────────────────────┘  │                                    │
│                                    │                                    │
│   [Reset] [Clear] [Presets ▼]     │                                    │
│                                    ├────────────────────────────────────┤
│                                    │   Input + Graph Context            │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `sat/math-chat.html` | New SAT Math chat page |
| `sat/math-chat.js` | Chat logic, Desmos integration, graph context |
| `sat/math-chat.css` | Split-view styles (or extend sat.css) |

## Files to Modify

| File | Purpose |
|------|---------|
| `index.html` | Add SAT Math mode option that redirects to sat/math-chat.html |
| `app/korah-chat.js` | Add satMath mode config (redirect behavior) |

---

## Phase 1: HTML Structure (sat/math-chat.html)

### 1.1 Base Template

Copy structure from `index.html` with modifications:

```html
<!DOCTYPE html>
<html lang="en" x-data="{
  theme: localStorage.getItem('korah_theme') || 'dark',
  getEffectiveTheme() {
    if (this.theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.theme;
  }
}" :data-theme="getEffectiveTheme()" x-cloak>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Korah AI — SAT Math</title>
  <!-- Same CSS as index.html -->
  <link rel="stylesheet" href="app/korah-chat.css"/>
  <link rel="stylesheet" href="sat/sat-math.css"/> <!-- NEW -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.css"/>
</head>

<body class="bg-base tx sat-math-shell">
  <!-- Firebase auth same as index.html -->
  <!-- ... -->

  <!-- SIDEBAR - Same as index.html but collapsed by default via CSS -->
  <aside id="sidebar" class="sidebar bg-sf glass t-theme collapsed">
    <!-- Same sidebar content as index.html -->
  </aside>

  <!-- Split View Layout -->
  <div id="main-area-wrapper" class="main-area-wrapper sat-math-layout">
    
    <!-- Graph Panel (Left) -->
    <div class="sat-graph-panel" id="sat-graph-panel">
      <div class="sat-graph-header">
        <div class="sat-graph-title">
          <span>📈</span>
          <span>Interactive Graph</span>
        </div>
        <div class="sat-graph-actions">
          <button class="sat-graph-btn" id="sat-graph-reset" title="Reset viewport">
            ↺ Reset
          </button>
          <button class="sat-graph-btn" id="sat-graph-clear" title="Clear all">
            Clear
          </button>
        </div>
      </div>
      <div class="sat-graph-container" id="sat-graph-container">
        <!-- Desmos calculator renders here -->
      </div>
    </div>

    <!-- Chat Panel (Right) -->
    <main id="main-content" class="main-content sat-chat-panel">
      <!-- Top bar -->
      <header class="chat-topbar bg-sf glass-sm t-theme bd">
        <button id="sidebar-toggle" class="sidebar-toggle-btn t-btn tx2">
          <svg><!-- hamburger --></svg>
        </button>
        
        <div class="logo-container">
          <img src="app/logo.png" alt="Korah" style="height: 32px;">
        </div>

        <div class="chat-title-area">
          <span class="korah-status-dot"></span>
          <span class="font-semibold tx text-sm">SAT Math</span>
        </div>

        <div class="mode-indicator">
          <span class="sat-math-badge">📊 SAT Math</span>
        </div>

        <div class="topbar-actions">
          <button class="topbar-btn t-btn tx2" id="clear-chat-btn" title="Clear chat">
            <!-- clear icon -->
          </button>
        </div>
      </header>

      <!-- Chat Body -->
      <div id="chat-body" class="chat-body">
        <div id="messages-container">
          <div id="welcome-screen" class="welcome-screen">
            <h1 class="welcome-title font-display text-4xl font-black tx">
              SAT Math Helper
            </h1>
            <p class="welcome-subtitle tx2">
              Interactive graphing + AI tutoring for SAT Math
            </p>
            
            <div class="welcome-input-container bg-sf2 glass-sm bd">
              <textarea id="welcome-chat-input" class="welcome-textarea tx" 
                placeholder="Ask me about any SAT Math topic..." rows="1"></textarea>
              <button id="welcome-send-btn" class="welcome-send-btn grad-bg t-btn">
                <svg><!-- send icon --></svg>
              </button>
            </div>

            <!-- Quick prompts specific to SAT Math -->
            <div class="sat-quick-prompts">
              <button class="quick-prompt-btn" data-prompt="Explain linear equations">
                Linear Equations
              </button>
              <button class="quick-prompt-btn" data-prompt="Explain quadratic functions">
                Quadratics
              </button>
              <button class="quick-prompt-btn" data-prompt="Explain systems of equations">
                Systems
              </button>
              <button class="quick-prompt-btn" data-prompt="Explain trigonometry for SAT">
                Trigonometry
              </button>
            </div>
          </div>
          
          <div id="messages-list"></div>
        </div>
      </div>

      <!-- Typing indicator -->
      <div id="typing-indicator" class="typing-bar hidden">
        <!-- Same as index.html -->
      </div>

      <!-- Suggestion bar -->
      <div id="suggestion-bar" class="suggestion-bar"></div>

      <!-- Input area -->
      <div class="chat-input-area t-theme hidden" id="chat-input-area">
        <!-- Same structure as index.html -->
        <div class="input-wrapper">
          <div id="input-files-bar" class="input-files-bar"></div>
          <textarea id="chat-input" class="chat-textarea tx" placeholder="Ask a question..." rows="1"></textarea>
          <div class="input-actions-row">
            <button id="send-btn" class="send-btn-circle grad-bg t-btn">
              <svg><!-- send --></svg>
            </button>
          </div>
        </div>
      </div>
    </main>

  </div>

  <!-- Modals (same as index.html) -->
  <!-- ... -->

  <!-- Scripts -->
  <script src="https://www.desmos.com/api/v1.12/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js"></script>
  
  <!-- New SAT Math chat script -->
  <script src="sat/math-chat.js"></script>
  
  <!-- Shared sidebar script -->
  <script src="study/js/sidebar.js"></script>
  <script src="study/js/study-api.js"></script>

  <script>
    // Initialize sidebar - collapsed by default
    window.addEventListener('korahReady', () => {
      if (window.KorahSidebar) {
        window.KorahSidebar.initSidebar({
          chatBaseUrl: "sat/math-chat.html",  <!-- Point to this page -->
          itemPageUrl: "study/item.html",
          onItemClick: (id) => { /* handle item click */ }
        });
      }
    }, { once: true });
  </script>
</body>
</html>
```

### 1.2 CSS Variables for Green Theme

Add to sat-math.css:
```css
.sat-math-shell {
  --p4: #059669;
  --p5: #34d399;
  --ac: #10b981;
  --glow: rgba(5, 150, 105, 0.35);
  --p-gen: #059669;
  --p-gen-glow: rgba(5, 150, 105, 0.3);
}
```

---

## Phase 2: CSS Styles (sat-math.css or extend sat.css)

### 2.1 Split View Layout

```css
/* SAT Math Layout */
.sat-math-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
}

/* Graph Panel - Left Side */
.sat-graph-panel {
  flex: 0 0 50%;
  min-width: 400px;
  max-width: 60%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--bd);
  background: var(--bg);
}

.sat-graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--bd);
  background: var(--bg2);
}

.sat-graph-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--tx);
  display: flex;
  align-items: center;
  gap: 8px;
}

.sat-graph-actions {
  display: flex;
  gap: 8px;
}

.sat-graph-btn {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid var(--bd);
  background: transparent;
  color: var(--tx2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sat-graph-btn:hover {
  background: var(--bg3);
  color: var(--tx);
}

.sat-graph-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.sat-graph-container .desmos-graph-wrapper {
  position: absolute;
  inset: 0;
}

/* Chat Panel - Right Side */
.sat-chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.sat-chat-panel .chat-body {
  flex: 1;
  overflow-y: auto;
}

.sat-chat-panel .chat-input-area {
  border-top: 1px solid var(--bd);
}

/* Mode Badge */
.sat-math-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: rgba(5, 150, 105, 0.15);
  border: 1px solid rgba(5, 150, 105, 0.3);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: var(--p5);
}

/* Quick Prompts */
.sat-quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.quick-prompt-btn {
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid var(--bd);
  background: var(--bg2);
  color: var(--tx2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-prompt-btn:hover {
  border-color: var(--p4);
  color: var(--p4);
}

/* Graph Update Animation */
.graph-updated .sat-graph-container {
  animation: graphFlash 0.5s ease;
}

@keyframes graphFlash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* Graph Context Indicator */
.graph-context-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(5, 150, 105, 0.1);
  border: 1px solid rgba(5, 150, 105, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: var(--p5);
  margin-bottom: 8px;
}

.graph-context-indicator svg {
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 900px) {
  .sat-graph-panel {
    flex: 0 0 40%;
    min-width: 300px;
  }
}

@media (max-width: 600px) {
  .sat-math-layout {
    flex-direction: column;
  }
  .sat-graph-panel {
    flex: 0 0 40vh;
    min-width: 100%;
    max-width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--bd);
  }
}
```

---

## Phase 3: JavaScript Logic (sat/math-chat.js)

### 3.1 Core State Variables

```javascript
(() => {
  const API_ENDPOINT = "/api/gem-proxy";
  const MODEL = "gemini-2.5-flash";

  // DOM Elements
  const input = document.getElementById("chat-input");
  const welcomeInput = document.getElementById("welcome-chat-input");
  const sendBtn = document.getElementById("send-btn");
  const welcomeSendBtn = document.getElementById("welcome-send-btn");
  const messagesList = document.getElementById("messages-list");
  const welcomeScreen = document.getElementById("welcome-screen");
  const typingIndicator = document.getElementById("typing-indicator");
  const chatBody = document.getElementById("chat-body");
  const suggestionBar = document.getElementById("suggestion-bar");

  // SAT Math State
  let satMathCalculator = null;
  let graphExpressions = [];
  let isGraphInitialized = false;
```

### 3.2 System Prompt

```javascript
  const SAT_MATH_SYSTEM_PROMPT = `You are Korah, a specialized SAT Math tutor with expertise in:
- Algebra (linear equations, systems, inequalities)
- Advanced Math (quadratics, polynomials, exponential functions)
- Problem-Solving and Data Analysis (ratios, percentages, statistics)
- Geometry and Trigonometry (area, volume, right triangles, trigonometry)

Your teaching approach:
- Break down problems into clear, manageable steps
- Explain the "why" behind each step, not just the "how"
- Connect mathematical concepts to real-world SAT-style problems
- Use the provided Desmos graph to visualize functions, equations, and relationships
- Reference the graph in your explanations ("Notice on the graph...", "As we can see...")

GRAPH INTERACTION: When you want to display or update the graph, include a JSON code block with the "graph-update" language tag:
\`\`\`graph-update
{
  "expressions": [
    {"latex": "y = x^2", "color": "#4285F4", "secret": false}
  ],
  "viewport": {"xmin": -10, "xmax": 10, "ymin": -10, "ymax": 10}
}
\`\`\`

KaTeX delimiter policy (REQUIRED for all math):
- Inline math: $...$ (single dollar signs)
- Display math: $$...$$ (double dollar signs)
- NEVER use \\(...\\), \\[...\\], or bare math without delimiters

Format your responses with:
- Clear headings for major steps
- KaTeX for all mathematical expressions
- Graph updates when visualizing functions, equations, or data
- Practice problems with worked solutions when appropriate`;

  const FORMAT_INSTRUCTIONS = `
- KATEX DELIMITER POLICY (REQUIRED):
  - Inline math: $...$ (single dollar signs)
  - Display math: $$...$$ (double dollar signs)
- NEVER use \\(...\\), \\[...\\], [ ... ], or bare math without delimiters
- Ensure all math delimiters are balanced

GRAPH UPDATES: Use graph-update code blocks to update the persistent Desmos graph.

Always format responses using GitHub-flavored Markdown.`;
```

### 3.3 Initialize Desmos Calculator

```javascript
  function initializeSATGraph() {
    const container = document.getElementById('sat-graph-container');
    if (!container || !window.Desmos || isGraphInitialized) return;

    container.innerHTML = '<div class="desmos-graph-wrapper" id="sat-desmos-graph"></div>';
    const graphEl = document.getElementById('sat-desmos-graph');

    satMathCalculator = Desmos.GraphingCalculator(graphEl, {
      keypad: false,
      graphpaper: true,
      autosize: true,
      expressions: true,        // Show expression list
      settingsMenu: false,
      zoomButtons: true,
      border: false,
      keyboard: false,
      showGrid: true,
      showAxisLabels: true,
      showClearButton: false,
      authorMode: false,
    });

    // Set initial viewport
    satMathCalculator.setMathBounds({
      left: -10,
      right: 10,
      bottom: -10,
      top: 10,
    });

    isGraphInitialized = true;

    // Listen for expression changes - send to AI as context
    satMathCalculator.on('change', () => {
      captureGraphState();
    });
  }
```

### 3.4 Capture Graph State (Graph → AI Context)

```javascript
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
            if (expr.type === 'expression' && !expr.hidden) {
              graphExpressions.push({
                id: expr.id,
                latex: expr.latex || '',
                color: expr.color,
                label: expr.label || ''
              });
            }
          });
        }
        
        updateGraphContextIndicator();
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
        <span>Graph has ${graphExpressions.length} expression(s)</span>
      `;
      
      // Insert before input area
      const inputArea = document.getElementById('chat-input-area');
      inputArea?.parentNode?.insertBefore(indicator, inputArea);
    } else {
      indicator.querySelector('span').textContent = 
        `Graph has ${graphExpressions.length} expression(s)`;
    }
  }

  function getGraphContext() {
    if (graphExpressions.length === 0) return '';
    
    const exprList = graphExpressions
      .map(e => e.latex ? `y = ${e.latex}` : null)
      .filter(Boolean)
      .join(', ');
    
    return exprList ? `\n\n[Current Graph State: ${exprList}]` : '';
  }
```

### 3.5 Update Graph from AI Response

```javascript
  function updateSATGraph(data) {
    if (!satMathCalculator) return;

    const graphContainer = document.getElementById('sat-graph-container');

    // Clear existing expressions
    satMathCalculator.removeExpressions({});

    // Set viewport if provided
    if (data.viewport) {
      satMathCalculator.setMathBounds({
        left: data.viewport.xmin ?? -10,
        right: data.viewport.xmax ?? 10,
        bottom: data.viewport.ymin ?? -10,
        top: data.viewport.ymax ?? 10,
      });
    }

    // Add expressions
    if (data.expressions && Array.isArray(data.expressions)) {
      data.expressions.forEach((expr, idx) => {
        if (expr.latex) {
          satMathCalculator.setExpression({
            id: expr.id || 'expr_' + idx,
            latex: expr.latex,
            color: expr.color || Desmos.Colors.BLUE,
            hidden: expr.hidden || false,
            lineStyle: expr.lineStyle || 'SOLID',
            lineWidth: expr.lineWidth || 2,
          });
        }
      });
    }

    // Visual feedback
    graphContainer.classList.add('graph-updated');
    setTimeout(() => graphContainer.classList.remove('graph-updated'), 500);

    // Update captured state
    captureGraphState();
  }

  function renderGraphUpdates(container) {
    const codeBlocks = container.querySelectorAll(
      'pre code.language-graph-update, pre code.lang-graph-update'
    );

    for (const block of codeBlocks) {
      const code = block.textContent.trim();
      try {
        const data = JSON.parse(code);
        updateSATGraph(data);
        // Remove the code block after processing
        block.parentElement.remove();
      } catch (e) {
        console.warn('Failed to parse graph-update:', e);
      }
    }
  }
```

### 3.6 Graph Controls

```javascript
  function bindGraphControls() {
    // Reset button
    document.getElementById('sat-graph-reset')?.addEventListener('click', () => {
      if (satMathCalculator) {
        satMathCalculator.setMathBounds({
          left: -10,
          right: 10,
          bottom: -10,
          top: 10,
        });
      }
    });

    // Clear button
    document.getElementById('sat-graph-clear')?.addEventListener('click', () => {
      if (satMathCalculator) {
        satMathCalculator.removeExpressions({});
        graphExpressions = [];
        updateGraphContextIndicator();
      }
    });
  }
```

### 3.7 Message Handling

```javascript
  async function sendMessage(text) {
    const userMessage = text || input?.value?.trim() || welcomeInput?.value?.trim();
    if (!userMessage) return;

    // Show input area
    welcomeScreen?.classList.add('hidden');
    document.getElementById('chat-input-area')?.classList.remove('hidden');

    // Include graph context in the message
    const graphContext = getGraphContext();
    const fullMessage = userMessage + graphContext;

    // Add user message
    addMessage('user', userMessage);
    
    // Clear input
    input && (input.value = '');
    welcomeInput && (welcomeInput.value = '');

    // Show typing indicator
    typingIndicator?.classList.remove('hidden');
    chatBody.scrollTop = chatBody.scrollHeight;

    try {
      const response = await callAPI(fullMessage);
      
      typingIndicator?.classList.add('hidden');
      
      // Add assistant message
      const assistantRow = addMessage('assistant', response);
      
      // Process graph updates
      if (assistantRow) {
        renderGraphUpdates(assistantRow);
      }

      // Show suggestions
      showSuggestions(response);

    } catch (error) {
      typingIndicator?.classList.add('hidden');
      addMessage('assistant', 'Sorry, I encountered an error. Please try again.', true);
    }
  }

  async function callAPI(userMessage) {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SAT_MATH_SYSTEM_PROMPT },
          { role: 'user', content: userMessage }
        ]
      })
    });
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  function addMessage(role, text, isError = false) {
    const row = document.createElement('div');
    row.className = `msg-row ${role === 'user' ? 'user' : 'assistant'}`;
    
    // Avatar
    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${role === 'user' ? 'user-av' : 'korah-av'}`;
    // ... avatar content ...

    // Bubble
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${role === 'user' ? 'user' : 'korah'}${isError ? ' error' : ''}`;
    
    const content = document.createElement('div');
    content.className = 'assistant-content';
    renderMarkdownAndMath(content, text);
    
    bubble.appendChild(content);
    row.appendChild(avatar);
    row.appendChild(bubble);
    
    messagesList?.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    return row;
  }
```

### 3.8 Contextual Suggestions

```javascript
  function showSuggestions(response) {
    if (!suggestionBar) return;
    
    const text = response.toLowerCase();
    let suggestions = [];

    if (text.includes('quadratic') || text.includes('x²')) {
      suggestions = ["What's the vertex form?", "How do I find the roots?"];
    } else if (text.includes('linear') || text.includes('y =') || text.includes('slope')) {
      suggestions = ["Show me another example", "What's the y-intercept?"];
    } else if (text.includes('inequality')) {
      suggestions = ["How do I graph inequalities?", "What's the test point method?"];
    } else if (text.includes('system') || text.includes('system of equations')) {
      suggestions = ["Show me substitution", "Show me elimination"];
    } else if (text.includes('function') || text.includes('f(x)')) {
      suggestions = ["What transformations apply?", "How do I find the domain?"];
    } else if (text.includes('triangle') || text.includes('SOHCAHTOA') || text.includes('trigonometry')) {
      suggestions = ["Show me a practice problem", "When do I use sine vs cosine?"];
    } else if (text.includes('circle') || text.includes('radius')) {
      suggestions = ["How do I write the equation?", "Show me completing the square"];
    } else {
      suggestions = ["Show me a practice problem", "Explain the next step"];
    }

    if (suggestions.length === 0) {
      suggestionBar.innerHTML = '';
      return;
    }

    suggestionBar.innerHTML = suggestions.map(s => 
      `<button class="suggestion-btn">${s}</button>`
    ).join('');

    suggestionBar.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.textContent));
    });
  }
```

### 3.9 Initialization

```javascript
  // Initialize on page load
  function init() {
    initializeSATGraph();
    bindGraphControls();
    bindEventListeners();
  }

  function bindEventListeners() {
    // Send buttons
    sendBtn?.addEventListener('click', () => sendMessage());
    welcomeSendBtn?.addEventListener('click', () => sendMessage());

    // Enter key
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
    welcomeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Quick prompt buttons
    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        sendMessage(prompt);
      });
    });
  }

  // Start when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

---

## Phase 4: Modify Main Chat (index.html)

### 4.1 Add SAT Math Mode Option

In the mode dropdown, add:

```html
<div class="mode-option" data-mode="satMath" data-redirect="sat/math-chat.html">
  <span class="mode-option-icon">📊</span>
  <div class="mode-option-info">
    <div class="mode-option-name">SAT Math</div>
    <div class="mode-option-desc">Interactive graph & problem solving</div>
  </div>
</div>
```

### 4.2 Add Redirect Logic

In `app/korah-chat.js`, modify the mode change handler:

```javascript
// In the mode dropdown click handler
document.querySelectorAll('.mode-option').forEach(option => {
  option.addEventListener('click', () => {
    const mode = option.dataset.mode;
    const redirectUrl = option.dataset.redirect;
    
    if (redirectUrl) {
      window.location.href = redirectUrl;
      return;
    }
    
    // Existing mode change logic
    changeMode(mode);
  });
});
```

---

## Phase 5: Shared Components

### 5.1 Sidebar Behavior

The sidebar should:
1. Start collapsed (CSS class `.collapsed`)
2. Have toggle button to expand/collapse
3. Maintain state in localStorage
4. Work with existing `study/js/sidebar.js`

### 5.2 Theme Integration

Apply green theme via CSS variables:
```css
.sat-math-shell {
  --p4: #059669;
  --p5: #34d399;
  --ac: #10b981;
  --glow: rgba(5, 150, 105, 0.35);
}
```

---

## Implementation Order

1. **CSS** - Create sat-math.css with split-view styles
2. **HTML** - Create sat/math-chat.html with split-view structure
3. **JavaScript** - Create sat/math-chat.js with:
   - Desmos initialization
   - Graph state capture
   - Graph update from AI
   - Chat message handling
   - Contextual suggestions
4. **Integration** - Modify index.html to add SAT Math mode with redirect
5. **Testing** - Verify full flow

---

## Testing Checklist

- [ ] Page loads with sidebar collapsed by default
- [ ] Split view displays correctly (graph left, chat right)
- [ ] Desmos calculator initializes with full expression list
- [ ] Green theme applies correctly
- [ ] AI responses with `graph-update` blocks update the graph
- [ ] User graph modifications are captured and sent to AI as context
- [ ] Graph context indicator shows current expressions
- [ ] Reset button resets viewport
- [ ] Clear button removes all expressions
- [ ] Sidebar toggle works
- [ ] SAT Math mode in main chat redirects to this page
- [ ] Quick prompt buttons work
- [ ] Contextual suggestions appear after AI responses

---

## Future Enhancements

- **Preset buttons**: Unit circle, parent functions, common SAT graphs
- **Expression labels**: Allow user to label expressions
- **Multiple graphs**: Save/load different graph states
- **Graph sharing**: Export graph as image
- **Problem integration**: Link with SAT question bank