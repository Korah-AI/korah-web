# SAT Math Mode Implementation Plan

## Overview

Implement a SAT Math mode in the existing Korah chat interface that features:
- Automatically collapsed sidebar
- Split-view layout with live Desmos graph (left) and chat interface (right)
- Bidirectional graph interaction: AI can update the graph, and user interactions can inform the AI

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Sidebar     │  ┌──────────────────┬────────────────────┐ │
│  (Collapsed) │  │                  │                    │ │
│              │  │     Desmos       │      Chat          │ │
│  [SAT Link]  │  │     Graph        │    Interface       │ │
│              │  │    (Live)        │                    │ │
│              │  │                  │   [Messages]       │ │
│              │  │                  │   [Input Area]      │ │
│              │  │                  │                    │ │
│              │  └──────────────────┴────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Purpose |
|------|---------|
| `app/korah-chat.js` | Mode config, system prompts, split-view logic, Desmos integration |
| `app/korah-chat.css` | Split-view layout styles |
| `index.html` | Add SAT Math mode option to dropdown |

---

## Phase 1: Mode Configuration

### 1.1 Add to `getModeConfig()` (korah-chat.js)

```javascript
const modes = {
  general: { name: "General", emoji: "✨" },
  math: { name: "Math", emoji: "🧮" },
  physics: { name: "Physics", emoji: "⚛️" },
  chemistry: { name: "Chemistry", emoji: "⚗️" },
  biology: { name: "Biology", emoji: "🧬" },
  history: { name: "History", emoji: "📜" },
  literature: { name: "Literature", emoji: "📚" },
  satMath: { name: "SAT Math", emoji: "📊" },  // NEW
};
```

### 1.2 Add SAT Math System Prompt

```javascript
const MODE_SYSTEM_PROMPTS = {
  // ... existing prompts ...
  
  satMath: `You are Korah, a specialized SAT Math tutor with expertise in:
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
- Practice problems with worked solutions when appropriate`,
};
```

### 1.3 Add SAT Math Theme Colors

```javascript
const themeVars = {
  general: { "--p4": "var(--p-gen)", "--p5": "var(--p-gen)", "--ac": "#c084fc", "--glow": "var(--p-gen-glow)" },
  math: { "--p4": "#3b82f6", "--p5": "#60a5fa", "--ac": "#0ea5e9", "--glow": "rgba(59, 130, 246, 0.35)" },
  physics: { "--p4": "#8b5cf6", "--p5": "#a78bfa", "--ac": "#c084fc", "--glow": "rgba(139, 92, 246, 0.35)" },
  // ... etc ...
  satMath: { "--p4": "#059669", "--p5": "#34d399", "--ac": "#10b981", "--glow": "rgba(5, 150, 105, 0.35)" },  // NEW
};
```

### 1.4 Add SAT Math Contextual Suggestions

```javascript
function getContextualSuggestions(mode, response) {
  let suggestions = [];
  
  if (mode === "satMath") {
    if (response.includes("quadratic") || response.includes("x²")) {
      suggestions.push("What's the vertex form?", "How do I find the roots?");
    } else if (response.includes("linear") || response.includes("y =") || response.includes("slope")) {
      suggestions.push("Show me another example", "What's the y-intercept?");
    } else if (response.includes("inequality")) {
      suggestions.push("How do I graph inequalities?", "What's the test point method?");
    } else if (response.includes("system") || response.includes("system of equations")) {
      suggestions.push("Show me substitution", "Show me elimination");
    } else if (response.includes("function") || response.includes("f(x)")) {
      suggestions.push("What transformations apply?", "How do I find the domain?");
    } else if (response.includes("triangle") || response.includes("SOHCAHTOA") || response.includes("trigonometry")) {
      suggestions.push("Show me a practice problem", "When do I use sine vs cosine?");
    } else if (response.includes("circle") || response.includes("radius")) {
      suggestions.push("How do I write the equation?", "Show me completing the square");
    } else {
      suggestions.push("Show me a practice problem", "Explain the next step");
    }
  }
  
  // ... rest of existing logic ...
  return suggestions;
}
```

---

## Phase 2: CSS Styles

### 2.1 Add Split View Styles (korah-chat.css)

```css
/* SAT Math Split View */
.sat-split-view {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: 100%;
}

.sat-graph-panel {
  flex: 0 0 50%;
  min-width: 400px;
  max-width: 60%;
  border-right: 1px solid var(--bd);
  display: flex;
  flex-direction: column;
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
  font-size: 13px;
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
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--bd);
  background: transparent;
  color: var(--tx2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.sat-graph-btn:hover {
  background: var(--bg2);
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

.sat-graph-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--tx3);
  text-align: center;
  padding: 20px;
}

.sat-graph-empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.sat-graph-empty-text {
  font-size: 14px;
  font-weight: 500;
}

.sat-graph-empty-hint {
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.7;
}

.sat-chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
}

/* Adjust chat body for split view */
.sat-chat-panel .chat-body {
  flex: 1;
  overflow-y: auto;
}

.sat-chat-panel .chat-input-area {
  position: relative;
}

/* Graph update animation */
.graph-updated .sat-graph-container {
  animation: graphFlash 0.5s ease;
}

@keyframes graphFlash {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### 2.2 Update Main Content Layout

```css
/* Ensure main content can transition to split view */
#main-content.sat-mode-active {
  display: flex;
  flex-direction: column;
}

/* Hide normal chat elements when in split view */
body.sat-mode-active .welcome-screen {
  /* Adjust welcome screen positioning */
}

body.sat-mode-active .chat-input-area {
  border-top: 1px solid var(--bd);
}
```

---

## Phase 3: Split View Logic (korah-chat.js)

### 3.1 Add State Variables

```javascript
// Add near top of file with other state variables
let isSATMathMode = false;
let satMathCalculator = null;
let satMathGraphExpressions = [];
```

### 3.2 Create SAT Math Mode Functions

```javascript
function enterSATMathMode() {
  isSATMathMode = true;
  
  // 1. Collapse sidebar
  if (typeof updateSidebarState === 'function') {
    updateSidebarState(true);
  }
  
  // 2. Restructure main content
  const mainContent = document.getElementById('main-content');
  mainContent.classList.add('sat-mode-active');
  
  // 3. Create split view HTML
  mainContent.innerHTML = `
    <div class="sat-split-view">
      <!-- Graph Panel -->
      <div class="sat-graph-panel">
        <div class="sat-graph-header">
          <div class="sat-graph-title">
            <span>📈</span>
            <span>Interactive Graph</span>
          </div>
          <div class="sat-graph-actions">
            <button class="sat-graph-btn" id="sat-graph-reset" title="Reset graph">
              ↺ Reset
            </button>
            <button class="sat-graph-btn" id="sat-graph-clear" title="Clear all expressions">
              Clear
            </button>
          </div>
        </div>
        <div class="sat-graph-container" id="sat-graph-container">
          <div class="sat-graph-empty">
            <div class="sat-graph-empty-icon">📊</div>
            <div class="sat-graph-empty-text">Graph will appear here</div>
            <div class="sat-graph-empty-hint">Ask Korah to graph an equation</div>
          </div>
        </div>
      </div>
      
      <!-- Chat Panel -->
      <div class="sat-chat-panel">
        <div class="chat-topbar bg-sf glass-sm t-theme bd">
          ${mainContent.querySelector('.chat-topbar')?.outerHTML || ''}
        </div>
        <div class="chat-body" id="chat-body">
          <div id="messages-container">
            <div id="welcome-screen" class="welcome-screen">
              <!-- Welcome screen content -->
            </div>
            <div id="messages-list"></div>
          </div>
        </div>
        <div id="typing-indicator" class="typing-bar hidden">
          <!-- Typing indicator -->
        </div>
        <div id="suggestion-bar" class="suggestion-bar"></div>
        <div class="chat-input-area t-theme" id="chat-input-area">
          <!-- Input area content -->
        </div>
      </div>
    </div>
  `;
  
  // 4. Initialize Desmos calculator
  initializeSATMathGraph();
  
  // 5. Rebind event listeners
  bindSATMathEventListeners();
}

function exitSATMathMode() {
  isSATMathMode = false;
  
  // Remove split view and restore original structure
  // This requires storing the original main-content HTML or rebuilding it
  
  // Reset calculator
  if (satMathCalculator) {
    satMathCalculator.destroy();
    satMathCalculator = null;
  }
  
  // Restore sidebar (if it was manually expanded)
  // Optionally restore sidebar to previous state
}

function initializeSATMathGraph() {
  const container = document.getElementById('sat-graph-container');
  if (!container || !window.Desmos) return;
  
  // Clear empty state
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
  
  // Set initial viewport (standard coordinate plane)
  satMathCalculator.setMathBounds({
    left: -10,
    right: 10,
    bottom: -10,
    top: 10,
  });
  
  // Listen for expression changes (optional: could send back to AI)
  satMathCalculator.on('change', () => {
    // Optionally capture expression state
    const state = satMathCalculator.getState();
    // Could store this for context or send to AI
  });
}

function bindSATMathEventListeners() {
  // Reset button
  document.getElementById('sat-graph-reset')?.addEventListener('click', () => {
    if (satMathCalculator) {
      satMathCalculator.setMathBounds({
        left: -10,
        right: 10,
        bottom: -10,
        top: 10,
      });
      satMathCalculator.removeExpressions({});
    }
  });
  
  // Clear button
  document.getElementById('sat-graph-clear')?.addEventListener('click', () => {
    if (satMathCalculator) {
      satMathCalculator.removeExpressions({});
    }
  });
}
```

### 3.3 Update Graph Rendering for SAT Mode

```javascript
function renderDesmosGraphs(container) {
  const codeBlocks = container.querySelectorAll(
    'pre code.language-desmos, pre code.lang-desmos, pre code.language-graph-update, pre code.lang-graph-update'
  );
  
  for (const block of codeBlocks) {
    const code = block.textContent.trim();
    try {
      const data = JSON.parse(code);
      
      // If in SAT Math mode, update the persistent graph
      if (isSATMathMode && satMathCalculator) {
        updateSATMathGraph(data);
      } else {
        // Fallback: create embedded graph (existing behavior)
        renderEmbeddedDesmosGraph(block, data);
      }
    } catch (e) {
      console.warn('Failed to parse Desmos graph data:', e);
    }
  }
}

function updateSATMathGraph(data) {
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
    for (const expr of data.expressions) {
      if (expr.latex) {
        satMathCalculator.setExpression({
          latex: expr.latex,
          color: expr.color || Desmos.Colors.BLUE,
          hidden: expr.hidden || false,
          secret: expr.secret || false,
          lineStyle: expr.lineStyle || 'SOLID',
          lineWidth: expr.lineWidth || 2,
          points: expr.points !== false,
          pointStyle: expr.pointStyle || 'CROSS',
          fill: expr.fill || false,
          fillOpacity: expr.fillOpacity || 0.1,
        });
      }
    }
  }
  
  // Visual feedback
  graphContainer.classList.add('graph-updated');
  setTimeout(() => graphContainer.classList.remove('graph-updated'), 500);
}
```

### 3.4 Integrate with Mode Change

```javascript
// In the changeMode or setMode function
function setMode(newMode) {
  const previousMode = currentSession?.mode;
  
  // Exit SAT Math mode if leaving
  if (previousMode === 'satMath' && newMode !== 'satMath') {
    exitSATMathMode();
  }
  
  // Enter SAT Math mode if switching to it
  if (newMode === 'satMath' && previousMode !== 'satMath') {
    enterSATMathMode();
  }
  
  // ... rest of existing mode change logic ...
  
  // Apply theme
  applyModeTheme(newMode);
  
  // Update UI
  updateModeUI(newMode);
}
```

---

## Phase 4: HTML Updates

### 4.1 Add SAT Math Mode Option (index.html)

Add to the mode dropdown:

```html
<div class="mode-option" data-mode="satMath">
  <span class="mode-option-icon">📊</span>
  <div class="mode-option-info">
    <div class="mode-option-name">SAT Math</div>
    <div class="mode-option-desc">Interactive graph & problem solving</div>
  </div>
</div>
```

---

## Phase 5: AI Instructions

### 5.1 Update System Prompt

The system prompt (Phase 1.2) already includes graph interaction instructions. Ensure the AI understands:

1. **Graph Update Format**: Use `graph-update` code blocks to update the persistent graph
2. **Graph Visualization**: Include graphs for:
   - Linear equations and inequalities
   - Quadratic functions (parabolas)
   - Systems of equations
   - Circles and ellipses
   - Exponential and logarithmic functions
   - Trigonometric functions
3. **Graph References**: Verbally reference the graph in explanations
4. **SAT Context**: Focus on SAT-relevant problem types and strategies

### 5.2 Example AI Response

```
Sure! Let's solve the system of equations:

$$2x + y = 7$$
$$x - y = 2$$

**Step 1: Solve for y in the first equation**
$$y = 7 - 2x$$

**Step 2: Substitute into the second equation**
$$x - (7 - 2x) = 2$$
$$x - 7 + 2x = 2$$
$$3x = 9$$
$$x = 3$$

**Step 3: Find y**
$$y = 7 - 2(3) = 1$$

**Solution: (3, 1)**

Here's what this looks like graphically:

```graph-update
{
  "expressions": [
    {"latex": "2x + y = 7", "color": "#4285F4"},
    {"latex": "x - y = 2", "color": "#DB4437"}
  ],
  "viewport": {"xmin": -5, "xmax": 10, "ymin": -5, "ymax": 10}
}
```

Notice how both lines intersect at (3, 1) - that's our solution!
```

---

## Implementation Order

1. **CSS** - Add split view styles
2. **Mode Config** - Add SAT Math to modes, themes, suggestions
3. **System Prompt** - Add SAT Math-specific instructions
4. **Split View Functions** - Create enter/exit functions
5. **Desmos Integration** - Initialize persistent calculator, update function
6. **HTML** - Add mode option
7. **Mode Change Logic** - Integrate with existing mode switching
8. **Testing** - Verify full flow works

---

## Testing Checklist

- [ ] Sidebar auto-collapses when entering SAT Math mode
- [ ] Split view displays correctly with graph on left, chat on right
- [ ] Desmos calculator initializes with blank grid
- [ ] AI responses with `graph-update` blocks update the left panel
- [ ] Reset button clears graph and viewport
- [ ] Clear button removes all expressions
- [ ] Switching away from SAT Math mode restores normal layout
- [ ] Theme colors apply correctly (green accent)
- [ ] Mode dropdown shows SAT Math option
- [ ] Contextual suggestions work appropriately

---

## Future Enhancements

- **Graph state to AI**: Send user's graph modifications back to AI for context
- **Preset graphs**: Quick buttons for common SAT graphs (unit circle, parent functions)
- **Multiple graph layers**: Allow AI to show multiple related graphs
- **Zoom presets**: Buttons for common zoom levels (standard view, zoom in, zoom out)
