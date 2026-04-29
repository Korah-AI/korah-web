# Desmos Template Library — Implementation Plan

## Goal

Give the math-chat bot two complementary Desmos superpowers:

1. **Concept visualizers** — interactive graphs that show *what* a concept looks like (symmetry, concavity, transformations, etc.). Already authored; shown on demand.
2. **Problem-solving templates** — step-by-step Desmos strategies for specific SAT problem types, demonstrating *how* to use regressions and graph tools to solve problems faster than by hand. The AI selects the right template, extracts values from the problem, and the client injects those values into the verified graph state.

The core insight for problem-solving templates: many SAT algebra and data problems that students grind through analytically can be solved in seconds by setting up the right Desmos regression and reading off the result. The bot teaches that strategy, not just the answer.

---

## Two Template Types

### Type 1 — Concept Visualizers (`Desmos json/`)

The existing files. Loaded as-is (no parameterization). The AI references them when a student needs to understand a concept visually. No substitution required.

```
korah-bot/sat/Desmos json/
  3-types-of-symmetry.json
  concavity-discovery.json
  concavity-rate-of-change.json
  nonrigid-transformations-dilations.json
  quadratic-from-vertex-point.json
  sine-cosine-sinuoids-graphs.json
  unit-circle.json
```

### Type 2 — Problem-Solving Templates (`Desmos problem-solving/`)

New files, one per SAT problem class. Each one:
- Embeds step-by-step instructions and tips as Desmos **text nodes** (visible in the calculator panel alongside the graph)
- Uses `{{PARAM}}` placeholders in LaTeX strings for values the AI extracts from the problem
- Carries a `parameters` schema so the AI knows exactly what to extract and in what format

```
korah-bot/sat/Desmos problem-solving/
  linear-regression.json
  quadratic-regression.json
  exponential-regression.json
  system-of-equations.json
  vertex-form-completion.json
  ... (one file per problem type, added as needed)
```

---

## Architecture

```
User sends a problem
        │
        ▼
Client sends AI:
  - template index (id + name + description + keywords, no full state)
  - user message
        │
        ▼
AI response includes TWO things:
  1. Natural language explanation (shown to student)
  2. Structured JSON: { "templateId": "linear_regression", "params": { "X_VALUES": "-1,0,1,2", ... } }
        │
        ▼
Client matches templateId → fetches full state from library file
        │
        ▼
Client substitutes params into {{PLACEHOLDER}} slots in the state JSON
        │
        ▼
Desmos.loadState(substitutedState)   ← no AI-generated Desmos syntax
```

**Key property:** The AI never writes Desmos expressions. It only identifies which template to use and extracts scalar values from the problem. All Desmos syntax comes from the hand-verified template files.

If no template matches (or the problem is conceptual), the AI falls back to referencing a concept visualizer or responding without a graph update.

---

## File Structure

```
korah-bot/sat/
  Desmos json/              ← concept visualizers (existing, unchanged)
  Desmos problem-solving/   ← problem-solving templates (new)
  template-index.json       ← lightweight index: id + name + description + keywords for both types
  template-loader.js        ← classification, substitution, state loading
math-chat.js                ← minimal additions
```

---

## Problem-Solving Template Schema

Each file in `Desmos problem-solving/`:

```json
{
  "id": "linear_regression",
  "type": "problem-solver",
  "category": "Data Analysis",
  "name": "Linear Regression from a Data Table",
  "description": "Find the best-fit linear equation from a set of (x, y) data points using a Desmos regression",
  "keywords": ["table", "data", "linear", "best fit", "scatterplot", "points", "predict", "equation", "slope"],
  "exampleProblem": "The table shows values of a linear function. Find the equation of the line.",
  "parameters": [
    {
      "name": "X_VALUES",
      "description": "x-values from the table, comma-separated",
      "example": "-1, 0, 1, 2"
    },
    {
      "name": "Y_VALUES",
      "description": "y-values from the table, comma-separated",
      "example": "12, 15, 18, 21"
    },
    {
      "name": "XMIN", "description": "viewport left edge (data xmin minus ~20%)", "example": "-3"
    },
    {
      "name": "XMAX", "description": "viewport right edge (data xmax plus ~20%)", "example": "4"
    },
    {
      "name": "YMIN", "description": "viewport bottom edge (data ymin minus ~20%)", "example": "5"
    },
    {
      "name": "YMAX", "description": "viewport top edge (data ymax plus ~20%)", "example": "25"
    }
  ],
  "state": {
    "version": 11,
    "graph": {
      "viewport": {
        "xmin": "{{XMIN}}",
        "xmax": "{{XMAX}}",
        "ymin": "{{YMIN}}",
        "ymax": "{{YMAX}}"
      }
    },
    "expressions": {
      "list": [
        {
          "type": "text",
          "id": "step1",
          "text": "Step 1 — Enter your data. The table below holds your (x, y) pairs. x₁ are the inputs, y₁ are the outputs."
        },
        {
          "type": "table",
          "id": "data_table",
          "columns": [
            { "latex": "x_1", "values": ["{{X_VALUES}}"] },
            { "latex": "y_1", "values": ["{{Y_VALUES}}"] }
          ]
        },
        {
          "type": "text",
          "id": "step2",
          "text": "Step 2 — Run the regression. The expression below uses ~ (tilde, not =) to tell Desmos to fit m and b to your data. Watch the stats panel — it shows the exact values."
        },
        {
          "type": "expression",
          "id": "regression",
          "latex": "y_1 \\sim mx_1 + b",
          "color": "#388c46"
        },
        {
          "type": "text",
          "id": "step3",
          "text": "Step 3 — Read the answer. m is the slope, b is the y-intercept. The dashed line below is the fitted equation y = mx + b plotted over your data."
        },
        {
          "type": "expression",
          "id": "fitted_line",
          "latex": "mx+b",
          "color": "#c74440",
          "lineStyle": "DASHED"
        },
        {
          "type": "text",
          "id": "tip",
          "text": "SAT tip: For any problem that gives you a table and asks for an equation or a predicted value, this setup finds the answer in under 30 seconds — no algebra required."
        }
      ]
    }
  }
}
```

### Notes on the schema

- **Steps are text nodes** embedded in the Desmos state, so they appear in the calculator panel alongside the graph. The student sees the instructions and the graph at the same time.
- **`{{PARAM}}` placeholders** are substituted client-side before `loadState`. Viewport values are numbers; table values are comma-separated strings that the loader splits into arrays.
- **The `parameters` array** is the contract between the template and the AI — it lists exactly what the AI needs to extract from the problem and in what format.
- All Desmos API rules (subscript columns, `~` not `=`, table-before-regression order, no `color` on text nodes) are enforced at authoring time, not at runtime.

---

## Critical Desmos v1.12 API Rules

These must be correct in every problem-solving template. They are the exact failure modes the model hits when generating expressions freehand:

1. **Table columns must use subscript notation** — `x_1`, `y_1`. Plain `x` and `y` are free variables, not data columns.
2. **Table must precede its regression** — expressions are processed in order. A regression referencing `x_1` before the table defining it silently fails.
3. **Regression uses `~` not `=`** — `y_1 ~ mx_1 + b` fits parameters; `y_1 = mx_1 + b` just plots a function.
4. **Multi-parameter regression requires an `x_1` anchor array** — when fitting 2+ unknowns (e.g., `h` and `k` in vertex form), add `{"latex": "x_1 = [1,2,3,4,5]"}` as the first expression.
5. **Text nodes must not have a `color` field** — `{"type": "text", "text": "..."}` only. Adding `color` causes Desmos to silently drop the note.
6. **Viewport must frame the data** — compute `xmin/xmax` from the actual data range ±20%.

---

## Template Loader (`template-loader.js`)

Responsibilities:
1. Load `template-index.json` (lightweight, loaded once)
2. Provide the index to the AI prompt as context
3. Parse the AI's `{ templateId, params }` response
4. Fetch the full template state from the appropriate file
5. Substitute `{{PARAM}}` placeholders and split comma-separated array values
6. Return the final state object ready for `Desmos.loadState()`

```javascript
let _index = null;

async function loadIndex() {
  if (_index) return _index;
  const res = await fetch('./sat/template-index.json');
  _index = await res.json();
  return _index;
}

// Returns the index as a compact string for injection into the system prompt.
export async function getTemplateContextBlock() {
  const index = await loadIndex();
  const lines = index.map(t =>
    `- ${t.id} (${t.type}): ${t.description} [keywords: ${t.keywords.join(', ')}]`
  );
  return `AVAILABLE DESMOS TEMPLATES:\n${lines.join('\n')}`;
}

// Given the AI's structured response, load and substitute the template.
// Returns a Desmos-ready state object, or null if templateId is unrecognized.
export async function resolveTemplate(templateId, params) {
  const index = await loadIndex();
  const entry = index.find(t => t.id === templateId);
  if (!entry) return null;

  const dir = entry.type === 'problem-solver' ? 'problem-solving' : 'json';
  const res = await fetch(`./sat/Desmos ${dir}/${entry.filename}`);
  const template = await res.json();

  return substituteParams(template.state, params);
}

// Replace {{PARAM}} markers in the state JSON string, then re-parse.
// Comma-separated strings in table value slots are split into arrays.
function substituteParams(state, params) {
  let str = JSON.stringify(state);
  for (const [key, val] of Object.entries(params)) {
    str = str.replaceAll(`"{{${key}}}"`, JSON.stringify(val));
    str = str.replaceAll(`{{${key}}}`, val);
  }
  const result = JSON.parse(str);
  // Split comma-separated table values into arrays
  for (const expr of result.expressions?.list ?? []) {
    if (expr.type === 'table') {
      for (const col of expr.columns) {
        if (col.values?.length === 1 && typeof col.values[0] === 'string' && col.values[0].includes(',')) {
          col.values = col.values[0].split(',').map(v => v.trim());
        }
      }
    }
  }
  return result;
}
```

---

## Changes to `math-chat.js`

```javascript
// 1. Top of file:
import { getTemplateContextBlock, resolveTemplate } from './sat/template-loader.js';

// 2. In sendMessage(), before callAPI() — inject template index into system prompt for this turn:
const templateContext = await getTemplateContextBlock();
// append templateContext to the per-turn system prompt (not persisted in history)

// 3. After parseAIResponse() — if response contains templateId + params, load the state:
if (aiResponse.templateId) {
  const state = await resolveTemplate(aiResponse.templateId, aiResponse.params);
  if (state) updateSATGraph(state);
}
```

The AI response format must include a structured JSON block alongside the natural language explanation. The existing `parseAIResponse` function will need a minor extension to extract `templateId` and `params` from the response.

---

## Authoring Workflow for Problem-Solving Templates

Each template is hand-authored and verified in a live Desmos session before being committed.

1. Open `https://www.desmos.com/calculator`
2. Enter the expressions in order, using representative placeholder values
3. Confirm the regression fits and the graph looks correct
4. Write the step-by-step text nodes in plain language — focus on the *why* ("Desmos uses ~ to fit parameters") and the SAT strategy tip
5. Export the calculator state via the browser console:
   ```javascript
   JSON.stringify(Desmos.Calculator.getState(), null, 2)
   ```
6. Replace concrete values with `{{PARAM}}` placeholders
7. Add the `parameters` array describing each placeholder
8. Add `id`, `name`, `category`, `keywords`, `exampleProblem`, `type: "problem-solver"`
9. Add an entry to `template-index.json`

### Validation checklist

```
✓ Table columns use x_1 and y_1 (not x and y)
✓ Table appears before regression in the expressions list
✓ Regression uses ~ (tilde), not =
✓ Multi-param regression has x_1 = [...] anchor as first expression
✓ Text nodes have no color field
✓ Viewport placeholders are present and correct
✓ Every {{PARAM}} has a matching entry in the parameters array
✓ File is registered in template-index.json
```

---

## Implementation Order

1. **Create `Desmos problem-solving/` directory** and stub `template-index.json`
2. **Author the first problem-solving template** — `linear-regression.json` (most common SAT data question, clearest example of the strategy)
3. **Write `template-loader.js`** and test substitution with the linear regression template
4. **Extend `parseAIResponse`** in `math-chat.js` to extract `templateId` + `params` from AI responses
5. **Wire `getTemplateContextBlock`** into the per-turn system prompt
6. **Test end-to-end** with a linear regression problem before adding more templates
7. **Add remaining problem-solving templates** as new SAT problem types are covered (one file at a time, each verified before committing)

---

## Testing Protocol

For each problem-solving template:

- [ ] AI correctly identifies the template from a natural language problem
- [ ] AI extracts all parameter values from the problem text
- [ ] Substituted state loads in Desmos without errors
- [ ] Table column headers are `x_1` / `y_1` after substitution
- [ ] Regression expression uses `~`
- [ ] Text nodes appear in the calculator panel (no `color` field corruption)
- [ ] Viewport frames the data correctly
- [ ] `parseAIResponse` extracts `templateId` and `params` without errors (check console)
- [ ] Fallback: problem with no matching template → no graph update, bot responds normally

---

## What This Does NOT Change

- `callAPI` — unchanged
- Session storage / IndexedDB schema — unchanged
- The SSE streaming render path — unchanged
- Concept visualizer files — unchanged

The template layer is additive. If no template matches, the system behaves exactly as it does today.
