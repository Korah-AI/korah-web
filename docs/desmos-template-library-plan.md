# Desmos Template Library — Implementation Plan

## Goal

Replace the AI-generated Desmos expression system with a library-driven architecture. Instead of asking the model to write Desmos syntax from scratch (which is error-prone), the model reads a list of available templates, selects the best one for the problem, and returns the template id plus the input values it extracted from the problem. The client does the substitution and loads the result directly into the calculator via `setState()`.

The model never writes a LaTeX expression. Every graph that appears is from a hand-verified template file.

---

## Two Template Types

### Type 1 — Concept Visualizers (`type: "visualizer"`)

Interactive Desmos states that show *what* a concept looks like — sliders, animated tangent lines, labeled points, folder-organized steps. Loaded as-is with no substitution. Shown when a student asks about a concept visually.

Existing files (already authored):
- `symmetry_types` — x-axis, y-axis, origin symmetry
- `concavity_discovery` — animated tangent line on a parabola
- `concavity_rate_of_change` — concave up/down on a polynomial
- `nonrigid_transformations` — vertical/horizontal dilations on √x
- `quadratic_vertex_point` — vertex form quadratic with sliders for h, k, and a point
- `sinusoids` — sine and cosine comparative graphs
- `unit_circle` — interactive angle on the unit circle

### Type 2 — Problem-Solving Templates (`type: "problem-solver"`)

Parameterized Desmos states for specific SAT problem classes. The AI extracts input values from the problem and substitutes them into `{{PARAM}}` slots. Step-by-step instructions and SAT strategy tips are embedded as Desmos text nodes so they appear in the calculator panel alongside the graph. Added by the user one file at a time as SAT topic coverage grows.

---

## Architecture

```
System prompt includes the full template index
(id + type + name + description + keywords for every entry)
        │
        ▼
User sends a problem
        │
        ▼
Model reads index, picks best-matching template, responds with:
  {
    "stateId": "linear_regression",
    "params": { "X_VALUES": "-1,0,1,2", "Y_VALUES": "12,15,18,21" },
    "response": "Step-by-step explanation..."
  }
        │
        ▼
Client looks up stateId in desmos-library.json
        │
        ├─ type === "visualizer"
        │       └─ setState(entry.state)  ← load as-is, no substitution
        │
        └─ type === "problem-solver"
                └─ substitute {{PARAM}} slots with params values
                   └─ setState(substitutedState)

Graph updates. Model never wrote a single LaTeX expression.
```

**If no template fits** the problem (stateId is null or missing), the graph is not updated. The model responds with text only.

**Params are always problem-side inputs** — values the model can read directly from the problem text (data point values, equation coefficients, function arguments). They are never intermediate computed results. Desmos handles step-to-step dependencies internally: once a regression runs and fits `m` and `b`, those variables are live in the calculator and any subsequent expression in the same template state automatically references them. The model does not need to know `m` or `b` in advance.

---

## File Structure

```
korah-bot/sat/
  desmos-library.json        ← full library: all entries with complete state objects
  template-index.json        ← lightweight index: id + type + name + description + keywords only
                                (this is what gets injected into the system prompt)
  Desmos json/               ← source files for visualizers (reference; library is canonical)
  Desmos problem-solving/    ← source files for problem-solving templates (added per topic)
math-chat.js                 ← changes described below
```

---

## Library Entry Schemas

### Visualizer entry

```json
{
  "id": "unit_circle",
  "type": "visualizer",
  "name": "Unit Circle",
  "category": "Geometry / Trigonometry",
  "keywords": ["unit circle", "sine", "cosine", "angle", "radian", "trig"],
  "description": "Interactive unit circle with a moveable angle showing the (cos θ, sin θ) point — show when a student asks about trig values or the relationship between angles and coordinates",
  "state": {
    "version": 11,
    "randomSeed": "...",
    "graph": { "viewport": { ... } },
    "expressions": { "list": [ ... ] }
  }
}
```

The `state` field is the complete Desmos calculator state export. Nothing is stripped. `viewport`, `randomSeed`, `includeFunctionParametersInRandomSeed` — all preserved. `setState()` expects the full object.

### Problem-solver entry

```json
{
  "id": "linear_regression",
  "type": "problem-solver",
  "name": "Linear Regression from a Data Table",
  "category": "Data Analysis",
  "keywords": ["table", "data", "linear", "best fit", "scatterplot", "predict", "slope"],
  "description": "Runs a linear regression on (x, y) data to find the best-fit equation — use when the problem gives a table of values and asks for a line equation or prediction",
  "parameters": [
    { "name": "X_VALUES", "description": "x-values from the table, comma-separated", "example": "-1, 0, 1, 2" },
    { "name": "Y_VALUES", "description": "y-values from the table, comma-separated", "example": "12, 15, 18, 21" }
  ],
  "state": {
    "version": 11,
    "graph": { "viewport": { "xmin": -10, "xmax": 10, "ymin": -10, "ymax": 10 } },
    "expressions": {
      "list": [
        { "type": "text", "id": "s1", "text": "Step 1 — Enter your data. x₁ = inputs, y₁ = outputs." },
        { "type": "table", "id": "tbl", "columns": [
          { "latex": "x_1", "values": ["{{X_VALUES}}"] },
          { "latex": "y_1", "values": ["{{Y_VALUES}}"] }
        ]},
        { "type": "text", "id": "s2", "text": "Step 2 — The regression below uses ~ to fit m and b. Read the values from the stats panel." },
        { "type": "expression", "id": "reg", "latex": "y_1 \\sim mx_1+b", "color": "#388c46" },
        { "type": "text", "id": "s3", "text": "Step 3 — This dashed line is the fitted equation y = mx + b." },
        { "type": "expression", "id": "line", "latex": "mx+b", "color": "#c74440", "lineStyle": "DASHED" },
        { "type": "text", "id": "tip", "text": "SAT tip: For any table problem asking for an equation or prediction, this finds the answer in under 30 seconds — no algebra needed." }
      ]
    }
  }
}
```

Key points:
- **Text nodes carry the step-by-step walkthrough** — they appear directly in the Desmos expression panel alongside the graph
- **`{{PARAM}}` placeholders** appear in latex strings and table value slots
- **No viewport params** — a fixed default viewport is set in the state; the student can pan/zoom
- **The `parameters` array** tells the model exactly what values to extract from the problem

---

## `template-index.json` (what the model sees)

```json
[
  {
    "id": "unit_circle",
    "type": "visualizer",
    "name": "Unit Circle",
    "description": "Interactive unit circle with a moveable angle showing the (cos θ, sin θ) point — show when a student asks about trig values or the relationship between angles and coordinates",
    "keywords": ["unit circle", "sine", "cosine", "angle", "radian", "trig"]
  },
  {
    "id": "linear_regression",
    "type": "problem-solver",
    "name": "Linear Regression from a Data Table",
    "description": "Runs a linear regression on (x, y) data to find the best-fit equation — use when the problem gives a table of values and asks for a line equation or prediction",
    "keywords": ["table", "data", "linear", "best fit", "scatterplot", "predict", "slope"]
  }
]
```

No state, no category — just enough for the model to pick the right template.

---

## Changes to `math-chat.js`

### 1. Load template index at startup

```javascript
let _templateIndex = null;

async function loadTemplateIndex() {
  if (_templateIndex) return _templateIndex;
  const res = await fetch('./sat/template-index.json');
  _templateIndex = await res.json();
  return _templateIndex;
}

function buildTemplateIndexBlock(index) {
  const lines = index.map(t =>
    `  { "id": "${t.id}", "type": "${t.type}", "name": "${t.name}", "description": "${t.description}", "keywords": [${t.keywords.map(k => `"${k}"`).join(', ')}] }`
  );
  return `AVAILABLE DESMOS TEMPLATES (pick the best match or return null):\n[\n${lines.join(',\n')}\n]`;
}
```

### 2. Inject index into the per-turn system prompt

```javascript
// In sendMessage(), before callAPI():
const index = await loadTemplateIndex();
const templateBlock = buildTemplateIndexBlock(index);
// Append templateBlock to the system prompt for this turn only (not persisted in history)
```

### 3. Load and apply the chosen state

```javascript
async function resolveAndLoadState(stateId, params) {
  const res = await fetch('./sat/desmos-library.json');
  const library = await res.json();
  const entry = library.find(e => e.id === stateId);
  if (!entry) return;

  let state = entry.state;

  if (entry.type === 'problem-solver' && params) {
    // Substitute {{PARAM}} placeholders via string replacement
    let str = JSON.stringify(state);
    for (const [key, val] of Object.entries(params)) {
      str = str.replaceAll(`"{{${key}}}"`, JSON.stringify(val));
      str = str.replaceAll(`{{${key}}}`, val);
    }
    state = JSON.parse(str);

    // Split comma-separated table values into arrays
    for (const expr of state.expressions?.list ?? []) {
      if (expr.type === 'table') {
        for (const col of expr.columns) {
          if (col.values?.length === 1 && typeof col.values[0] === 'string' && col.values[0].includes(',')) {
            col.values = col.values[0].split(',').map(v => v.trim());
          }
        }
      }
    }
  }

  satMathCalculator.setState(state);
  captureGraphState();
}
```

### 4. Parse `stateId` from AI response and remove the old `graph` field

The AI response format changes from:
```json
{ "graph": { "expressions": [...], "viewport": {...} }, "response": "..." }
```

To:
```json
{ "stateId": "linear_regression", "params": { "X_VALUES": "-1,0,1,2", "Y_VALUES": "12,15,18,21" }, "response": "..." }
```

Or for a visualizer (no params):
```json
{ "stateId": "unit_circle", "response": "..." }
```

Or when no graph is needed:
```json
{ "stateId": null, "response": "..." }
```

`parseAIResponse` is extended to extract `stateId` and `params`. The existing `graph` field handling is removed.

### 5. Remove `updateSATGraph`

`updateSATGraph` (which used `setBlank()` + `setExpression()`) is replaced by `resolveAndLoadState()`. No AI-generated expressions reach the calculator.

---

## Authoring Problem-Solving Templates

Each template is hand-authored and verified in a live Desmos session before being added to the library. The user adds them one file at a time as SAT topic coverage grows.

### Workflow

1. Open `https://www.desmos.com/calculator`
2. Enter expressions with representative placeholder values (e.g., use `[1, 2, 3]` where `{{X_VALUES}}` will go)
3. Write step-by-step text nodes — plain language, focus on the *why* and the SAT tip
4. Confirm graph looks correct and interactive features work
5. Export state via browser console: `JSON.stringify(Desmos.Calculator.getState(), null, 2)`
6. Replace concrete input values with `{{PARAM}}` placeholders
7. Add the entry to `desmos-library.json` and a lightweight entry to `template-index.json`

### Validation checklist

```
✓ Table columns use x_1 and y_1 (not x and y)
✓ Table appears before any regression expression that references it
✓ Regression uses ~ (tilde), not =
✓ Multi-param regression has x_1 = [...] anchor as first expression
✓ Text nodes have no color field
✓ Every {{PARAM}} has a matching entry in the parameters array
✓ Entry added to both desmos-library.json and template-index.json
✓ JSON.parse validates the full library file after adding
```

### Critical Desmos v1.12 API rules

These must be correct in every problem-solver template (these are the exact failure modes the old AI-generation approach hit):

1. **Table columns must use subscript notation** — `x_1`, `y_1`. Plain `x`/`y` are free variables, not data columns.
2. **Table must precede its regression** — expressions are processed in order.
3. **Regression uses `~` not `=`** — `y_1 ~ mx_1 + b` fits parameters; `y_1 = mx_1 + b` just plots a function.
4. **Multi-parameter regression requires an `x_1` anchor array** — add `{"latex": "x_1 = [1,2,3,4,5]"}` as the first expression when fitting 2+ unknowns.
5. **Text nodes must not have a `color` field** — `{"type": "text", "text": "..."}` only.

---

## System Prompt Changes

The existing `SAT_MATH_SYSTEM_PROMPT` is updated to:

1. **Remove** the `DESMOS API SYNTAX REFERENCE` section and all `COMPLETE EXAMPLES` — the model no longer writes expressions
2. **Replace** the graph field documentation with the new response format
3. **Add** the template index block (injected per-turn, not hardcoded in the prompt)
4. **Update** strategy descriptions to reference template selection instead of expression generation

New response format section in the prompt:

```
RESPONSE FORMAT:
Output a single raw JSON object with these fields:
{
  "stateId": "template_id_from_index",   ← id from the template list, or null
  "params": { "PARAM_NAME": "value" },   ← only for problem-solver templates; omit for visualizers
  "response": "Your explanation here",
  "suggestions": ["Follow-up 1", "Follow-up 2"]  ← optional, max 2
}

To select a template: match the problem to the best entry in the template index above.
params values are the input values you read from the problem (data points, coefficients, etc.).
If no template fits, set stateId to null — the graph will not update.
```

---

## Implementation Order

1. **`desmos-library.json`** — merge all 7 visualizer source files into the library (done by subagent)
2. **`template-index.json`** — companion lightweight index (done by subagent)
3. **Update `SAT_MATH_SYSTEM_PROMPT`** — remove Desmos syntax reference, add new response format and template index injection
4. **Update `parseAIResponse`** — extract `stateId` and `params` instead of `graph`
5. **Add `resolveAndLoadState`** — fetch library, substitute params, call `setState()`
6. **Remove `updateSATGraph`** — no longer needed
7. **Test** with each visualizer and one problem-solver template
8. **Add problem-solver templates** one by one as SAT topics are covered

---

## What Is No Longer Part of This System

- AI-generated Desmos expressions (`graph` field in AI response)
- `updateSATGraph` / `setBlank()` + `setExpression()` approach
- Prompt-injection of "verified example" blocks for the model to imitate
- Viewport parameters (the state's own viewport is used as-is)
- Any Desmos syntax documentation in the system prompt
