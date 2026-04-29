# Desmos Template Library — Implementation Plan

## Problem Statement

`math-chat.js` currently asks Gemini to generate Desmos expressions from scratch on every turn. The Desmos API (v1.12) syntax is niche and under-represented in training data, so the model reliably makes the following classes of mistakes:

| Error class | Example |
|---|---|
| Table column headers without subscripts | `x` instead of `x_1` |
| Regression uses `=` instead of `~` | `y_1 = mx_1 + b` |
| Multi-param regression missing `x_1` anchor array | Desmos can't fit h and k |
| Text note gets `color` field injected | Desmos ignores the note entirely |
| Viewport leaves data off-screen | Regression line visible but data isn't |

The fix is a **curated JSON library** of verified Desmos expression templates mapped to SAT problem categories. Before each API call, the user's message is classified client-side and the matching template is injected into the prompt as a concrete, already-correct example. The model imitates rather than invents.

No server changes, no MCP, no new dependencies — this is purely a prompt-engineering + data layer.

---

## Architecture

```
User message
     │
     ▼
classifyProblem(message)          ← keyword match against template index
     │
     ▼
getTemplate(templateId)           ← load from desmos-templates.json
     │
     ▼
buildPromptWithTemplate(template) ← inject as "VERIFIED EXAMPLE" block
     │
     ▼
callAPI(prompt)                   ← existing Gemini SSE call
     │
     ▼
parseAIResponse → updateSATGraph  ← existing graph layer (unchanged)
```

The template layer sits entirely between `sendMessage` and `callAPI` in `math-chat.js`. Everything downstream is unchanged.

---

## File Structure

```
korah-bot/sat/
  templates/
    desmos-templates.json      ← full template library (source of truth)
    template-loader.js         ← classification + prompt injection
  math-chat.js                 ← add 3 lines: import, classify, inject
```

---

## Template JSON Schema

Each entry in `desmos-templates.json`:

```json
{
  "id": "linear_regression_data_table",
  "category": "Data Analysis",
  "subcategory": "Regression",
  "keywords": ["table", "data", "linear", "best fit", "scatterplot", "points", "predict"],
  "description": "Linear regression from a data table",
  "desmosExpressions": [
    {
      "type": "table",
      "columns": [
        { "latex": "x_1", "values": ["-1", "0", "1", "2"] },
        { "latex": "y_1", "values": ["12", "15", "18", "21"] }
      ]
    },
    { "latex": "y_1 \\sim m x_1 + b", "color": "#388c46" },
    { "latex": "m x + b", "color": "#c74440", "lineStyle": "DASHED" }
  ],
  "viewport": { "xmin": -3, "xmax": 4, "ymin": 5, "ymax": 25 },
  "exampleProblem": "A linear function contains (-1,12), (0,15), (1,18), (2,21). Find the equation.",
  "keyNotes": [
    "Table MUST appear before the regression expression",
    "Column headers MUST use subscripts: x_1 and y_1 (not x and y)",
    "Regression uses tilde ~ not equals =",
    "After fitting, plot m*x+b as a separate expression to visualize the line"
  ]
}
```

### Critical schema rules (derived from the Desmos v1.12 API)

These rules must be applied correctly in every template. They are the exact failure modes the model hits:

1. **Table columns must use subscript notation** — `x_1`, `y_1`. Plain `x` and `y` are treated as free variables, not data columns.
2. **Table must precede its regression** — Desmos processes expressions in order. A regression referencing `x_1` before the table defining `x_1` silently fails.
3. **Regression uses `~` not `=`** — `y_1 ~ mx_1 + b` tells Desmos to fit parameters; `y_1 = mx_1 + b` would just plot a function.
4. **Multi-parameter regression requires an `x_1` anchor array** — When fitting 2+ unknowns (e.g., `h` and `k` in vertex form), Desmos needs concrete `x_1` values to anchor the system. Add `{"latex": "x_1 = [1,2,3,4,5]"}` as the first expression.
5. **Text notes must not have a `color` field** — `{"type": "text", "text": "Note here"}` only. Adding `color` causes Desmos to render the note as a malformed expression entry.
6. **Single-parameter regression trick needs no table** — `LHS ~ RHS` where both sides reference `x_1` directly works without a data table (Desmos uses the variable as a symbolic anchor).
7. **Viewport must frame the data** — Always compute `xmin/xmax` from the actual data range ± 20%.

---

## The 20 Core Templates

### Category 1 — Data Analysis / Regression (5)

| ID | Description |
|---|---|
| `linear_regression_data_table` | Table + `y_1 ~ mx_1 + b` |
| `quadratic_regression_data_table` | Table + `y_1 ~ ax_1^2 + bx_1 + c` |
| `exponential_regression_data_table` | Table + `y_1 ~ a \cdot b^{x_1}` |
| `power_regression_data_table` | Table + `y_1 ~ a x_1^b` |
| `logarithmic_regression_data_table` | Table + `y_1 ~ a\ln(x_1) + b` |

Each includes: the table with realistic SAT data values, the regression expression, a dashed line for the fitted function, and a viewport that frames the data.

### Category 2 — Regression Trick (parameter solving without a data table) (4)

| ID | Description |
|---|---|
| `vertex_form_single_param` | `\frac{1}{3}x_1^2 - 2 \sim \frac{1}{3}(x_1-k)(x_1+k)` — solve for one unknown |
| `vertex_form_h_and_k` | `x_1 = [1,2,3,4,5]` anchor + `2x_1^2-12x_1+10 \sim 2(x_1-h)^2+k` |
| `exponential_parameter` | `y_1 \sim a \cdot b^{x_1}` with two data points to find `a` and `b` |
| `linear_standard_form_rewrite` | `ax_1 + by_1 = c \sim y_1 \sim mx_1 + b` form conversion |

### Category 3 — Graph-and-Check (multiple choice) (3)

| ID | Description |
|---|---|
| `system_intersection` | Two functions graphed in different colors; intersection point labeled |
| `quadratic_roots_check` | Parabola + 4 answer-choice roots graphed as vertical lines |
| `answer_choice_comparison` | 4 functions graphed in 4 colors against a reference curve |

### Category 4 — Algebra Visualization (5)

| ID | Description |
|---|---|
| `quadratic_standard_to_vertex` | `y = ax^2 + bx + c` + vertex point labeled |
| `linear_system_two_equations` | Two lines + intersection point labeled |
| `absolute_value_function` | `y = a|x - h| + k` with transformations |
| `inequality_region` | `y < mx + b` or `y \geq ax^2 + bx + c` shaded region |
| `polynomial_factored_form` | `y = a(x-r_1)(x-r_2)(x-r_3)` with roots labeled |

### Category 5 — Geometry & Trig (3)

| ID | Description |
|---|---|
| `circle_standard_form` | `(x-h)^2 + (y-k)^2 = r^2` + center/radius labeled |
| `right_triangle_trig` | Unit circle with angle, opposite/adjacent/hypotenuse labeled |
| `exponential_growth_decay` | `y = a \cdot b^x` with initial value and growth/decay rate shown |

---

## Template Loader (`template-loader.js`)

```javascript
// template-loader.js
// Loads desmos-templates.json, classifies a user message, and returns
// a "VERIFIED TEMPLATE EXAMPLE" block to inject into the system prompt.

let _templates = null;

async function loadTemplates() {
  if (_templates) return _templates;
  const res = await fetch('./templates/desmos-templates.json');
  _templates = await res.json();
  return _templates;
}

// Score a template against a user message.
// Returns a numeric score — higher = better match.
function scoreTemplate(template, message) {
  const lower = message.toLowerCase();
  let score = 0;
  for (const kw of template.keywords) {
    if (lower.includes(kw.toLowerCase())) score++;
  }
  return score;
}

// Returns the best-matching template, or null if no template scores > 0.
export async function classifyAndGetTemplate(userMessage) {
  const templates = await loadTemplates();
  let best = null;
  let bestScore = 0;
  for (const t of templates) {
    const s = scoreTemplate(t, userMessage);
    if (s > bestScore) { bestScore = s; best = t; }
  }
  return bestScore > 0 ? best : null;
}

// Build the injection block to append to the system prompt for this turn.
export function buildTemplateInjection(template) {
  if (!template) return '';

  const expressionsJson = JSON.stringify(
    { expressions: template.desmosExpressions, viewport: template.viewport },
    null, 2
  );

  const notes = template.keyNotes.map(n => `- ${n}`).join('\n');

  return `
═══════════════════════════════════════════
VERIFIED DESMOS TEMPLATE FOR THIS PROBLEM
═══════════════════════════════════════════
Problem type detected: ${template.description}
Example problem: ${template.exampleProblem}

Use this EXACT expression structure (syntax already verified against Desmos v1.12):
${expressionsJson}

Key rules for this template:
${notes}

Adapt the values to match the student's specific problem, but preserve the
expression types, column naming (x_1/y_1), and ordering shown above.
═══════════════════════════════════════════`;
}
```

---

## Changes to `math-chat.js`

Three additions, all in `sendMessage`:

```javascript
// 1. At top of file (after existing imports/consts):
import { classifyAndGetTemplate, buildTemplateInjection } from './templates/template-loader.js';

// 2. In sendMessage(), before callAPI():
const template = await classifyAndGetTemplate(userMessage);
const templateInjection = buildTemplateInjection(template);

// 3. In callAPI(), append templateInjection to the system prompt for this turn:
{ role: 'system', content: SAT_MATH_SYSTEM_PROMPT + getFormatInstructions() + templateInjection }
```

The injection is per-turn only — it does not persist in `conversationHistory`. This keeps the conversation history clean and avoids redundant template blocks inflating the token count on follow-up messages.

---

## Building the JSON Templates — Workflow

The template JSON is hand-authored, not generated. Each template must be verified in a live Desmos session before being committed.

### Verification steps for each template

1. Open `https://www.desmos.com/calculator`
2. Enter each expression in the array in order
3. Confirm the regression fits / graph looks correct
4. Export the full calculator state JSON via the browser console:
   ```javascript
   JSON.stringify(Desmos.Calculator.getState(), null, 2)
   ```
5. Cross-reference the `expressions.list` in the exported state with the template — confirm `latex` fields match exactly
6. Set the viewport and confirm all interesting regions are in frame
7. Paste the verified expressions into `desmos-templates.json`

### Common validation checks

```
✓ Table columns use x_1 and y_1 (not x and y)
✓ Table appears before regression in the expressions array
✓ Regression uses ~ (tilde), not =
✓ Multi-param regression has x_1 = [...] anchor as first expression
✓ Text notes have no color field
✓ Viewport xmin/xmax/ymin/ymax are set and frame the data
✓ Hidden expressions (helpers) have "hidden": true
✓ Regression line plotted separately from regression expression
```

---

## Implementation Order

1. **Create `templates/` directory** and stub `desmos-templates.json` as an empty array
2. **Author and verify the 5 regression templates** (highest impact — these are the most common SAT data-analysis questions and the most error-prone for the model)
3. **Author and verify the 4 regression trick templates** (second highest: completing the square / vertex form is on nearly every SAT)
4. **Write `template-loader.js`** with `classifyAndGetTemplate` and `buildTemplateInjection`
5. **Wire into `math-chat.js`** (3-line change described above)
6. **Test end-to-end** with the 9 problem types above before adding remaining templates
7. **Author remaining 11 templates** (graph-and-check, algebra visualization, geometry/trig)

---

## Testing Protocol

For each template category, send the example problem from the template's `exampleProblem` field and verify:

- [ ] Graph panel updates with the correct expression types
- [ ] Regression expressions use `~` and subscript columns
- [ ] Multi-param templates include the `x_1 = [...]` anchor
- [ ] Viewport frames the data correctly
- [ ] Text notes (if any) render as styled notes, not raw expressions
- [ ] The AI's explanation references the graph correctly
- [ ] `parseAIResponse` extracts the graph object without errors (check console)

---

## What This Does NOT Change

- `callAPI` — unchanged
- `parseAIResponse` / `updateSATGraph` — unchanged
- Session storage / IndexedDB schema — unchanged
- The system prompt (`SAT_MATH_SYSTEM_PROMPT`) — the injection is additive per-turn, not a replacement
- The SSE streaming render path — unchanged

The template layer is purely additive and opt-in per message. If no template matches (score = 0), the system behaves exactly as it does today.
