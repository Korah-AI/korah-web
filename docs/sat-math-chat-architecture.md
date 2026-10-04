# SAT Math Chat — Architecture & Backend Design

`korah-bot/sat/math-chat.js` is the client-side orchestration layer for the SAT Math tutoring feature. It coordinates four subsystems: a two-call AI pipeline, the Desmos Template Library, the Desmos graphing calculator, and the KorahDB session store. No separate server is required — the browser talks directly to `/api/r` (a Vercel serverless proxy) and persists everything locally.

---

## High-Level Architecture

```
Browser (math-chat.js)
│
├── UI Layer            — DOM manipulation, Markdown/KaTeX rendering, typewriter animation
├── Session Layer       — KorahDB (Firestore-backed), conversation history
├── AI Pipeline         — Two calls, both through callAPI → /api/r → Gemini 2.5 Flash
│     ├── Merged call   — Silent classify + adapt: picks a template, fills it, or keeps the current graph
│     └── Phase 3       — Streamed tutoring response grounded in the graph state
└── Graph Layer         — Desmos GraphingCalculator, setState / validateDesmosState
         ↕
    /api/r (Vercel serverless)
         ↕
    Google Gemini 2.5 Flash (SSE stream)
```

---

## AI Pipeline

Every user message triggers two sequential AI calls. The first (classify + adapt) is silent. Phase 3 streams the tutoring explanation to the chat. There are no separate Phase 1 / Phase 2 calls; they were merged into one.

### Merged call — Classify + Adapt (`runMergedClassifyAdapt`)

**System prompt:** `buildMergedSystemPrompt()` — the classification rules, the adaptation rules, the full `template-index.json`, and every problem-solver skeleton from `desmos-json/templates/`. The static template material comes first and the student's message last, so Gemini's implicit caching can discount the stable prefix.

**History:** `conversationHistory` is sent between the system prompt and the student's message, so the model sees the earlier turns.

**Output (JSON, not streamed to UI):**
```json
{ "stateId": "linear-functions", "strategy": "one-sentence rationale", "adaptedState": { }, "keepGraph": false }
```

- `stateId` is the chosen template id, or `null` for non-mathematical input. Any math problem that matches no specific template gets the generic `free-graph` template.
- `adaptedState` is the filled-in Desmos state for a `problem-solver` template, and `null` for a `visualizer`, a `null` stateId, or `keepGraph`.
- `keepGraph` is `true` when a graph is already on screen (the message ends with `[Current Desmos State: ...]`) and the message is a follow-up it already serves (a question about a step, a re-explanation, a hint, a check of the student's work). The graph is then left untouched and Phase 3 is grounded in `satMathCalculator.getState()`. It is ignored if no graph is on screen.

**Parsing:** Code fences and leading junk are stripped, then `JSON.parse`. Falls back to balanced-brace extraction if parsing fails.

**Graph loading** (in `sendMessage`, after the call returns). Shows a "Drawing graph…" indicator in the chat bubble while it runs.

| Template type | Behavior |
|---|---|
| `visualizer` | Load verified example `desmos-json/<id>.json` as-is via `loadDesmosState`. No adaptation. |
| `problem-solver` | Use `adaptedState` from the merged call. Reject it if its expressions are identical to the verified example's, if any `{{PLACEHOLDER}}` is left unfilled, or if `loadDesmosState` validation fails. |

**Fallback chain:**
```
keepGraph (with a graph on screen)                         → leave graph as is ✓
Visualizer template                                        → load verified example as-is ✓
Problem-solver, adapted state passes validateDesmosState   → loadDesmosState (setState) ✓
Problem-solver, adapted state missing / verbatim / invalid → skip graph
Merged call fails or template lookup throws                → skip graph (no state loaded)

The verified example is never the fallback for a problem-solver (it solves a
different problem). With no graph, Phase 3 solves algebraically and ends with
"Want me to visualize it on Desmos?". If the student says yes, the classifier
is given the previous problem plus the follow-up.
```

**`loadDesmosState(state)`** is the single entry point for applying any state to the calculator:
1. Runs `validateDesmosState` — checks for missing `expressions.list`, duplicate ids, `color` on text nodes, regression-before-table ordering, bare `x`/`y` column headers.
2. Deep-clones the state.
3. Injects a default `graph.viewport` if missing (`xmin/xmax/ymin/ymax: ±10`).
4. Calls `satMathCalculator.setState(stateCopy)`.
5. Flashes a `graph-updated` CSS class on the container.
6. Calls `captureGraphState()` to sync the internal summary.

---

### Phase 3 — Streamed Tutoring Response

**System prompt:** `buildPhase3SystemPrompt(loadedState, classifierStrategy)`

The prompt includes:
- A fixed tutoring style guide (5-step structure: understand → strategy → solve → answer → SAT tip).
- The `strategy` sentence (one line from the merged call).
- The full loaded Desmos state JSON (or a "no graph loaded" notice), so the model can reference exact values that are visible on screen.

**Output:** Pure Markdown + KaTeX — no JSON wrapping, no `graph` field, no `suggestions` field.

**Streaming:** Chunks arrive via SSE and are fed into a `charBuffer`. A `typeNextChar` loop drains the buffer character-by-character (or 2 at a time when buffering > 20 chars) with a 5 ms delay, dropping to 0 ms when the buffer exceeds 50 chars. When the stream ends, `renderMarkdownAndMath` does a final clean render of the full text.

**Persistence:** `conversationHistory` stores the raw Phase 3 text (not JSON). On session restore, `extractSavedResponseField` is used to pull the `response` field from any legacy JSON-formatted entries.

---

## Desmos Template Library

Templates live in `korah-bot/sat/`:

| File | Purpose |
|---|---|
| `template-index.json` | Master index: `id`, `type`, `name`, `description`, `keywords` for each template |
| `desmos-json/<id>.json` | Verified working example for the template (real problem, real values) |
| `desmos-json/templates/<id>.json` | Skeleton with `{{PLACEHOLDER}}` slots — the structural guide for the merged call |

Templates are cached in memory after first fetch (`_exampleCache`, `_templateCache`, `_templateIndex`).

**Template types:**

| Type | Graph loading behavior |
|---|---|
| `visualizer` | Load example as-is. For conceptual questions ("show me the unit circle"). |
| `problem-solver` | Adapt template to the student's specific problem via API call. |

---

## Graph Layer — Desmos GraphingCalculator

**Initialization** (`initializeSATGraph`): The calculator is created once per page load with `keypad: false`, `settingsMenu: false`, `expressions: true`, `zoomButtons: true`. An `expressionsChanged` observer fires `captureGraphState` on every expression change with a 500 ms debounce.

**State capture** (`captureGraphState`): Reads `calculator.getState()`, walks the expressions list, and builds a lightweight `graphExpressions` summary array:
- `expression` entries → `{ type, latex }`
- `table` entries → `{ type, summary: "Table(x_1:[1,2,3], y_1:[2,4,6])" }`
- Hidden expressions are skipped.

This summary is used by `getGraphContext()`, which appends `[Current Desmos State: ...]` to each outgoing user message so the model knows what's on screen.

**Graph context indicator:** When `graphExpressions.length > 0`, a small UI badge ("Graph has N item(s)") appears above the input bar.

**Expression type reference** (Desmos API v1.11):

| Type | Required fields | Notes |
|---|---|---|
| Function / equation | `latex` | e.g. `"y=x^2"` |
| Point | `latex` | e.g. `"(1,2)"` |
| Slider / constant | `latex` | e.g. `"a=5"` |
| Inequality | `latex` | e.g. `"y < 2x+1"` |
| Table | `type: "table"`, `columns` | Column headers must use subscripts: `x_1`, `y_1` |
| Regression | `latex` with `~` | Must reference table columns; table must appear first |
| Hidden helper | `latex`, `hidden: true` | Drawn but not visible |
| Text note | `type: "text"`, `text` | Plain text only — no LaTeX, no `color` field |

> **Text node rule:** `validateDesmosState` rejects any text node that has a `color` field. The merged-call system prompt enforces plain English in text nodes — no backslashes, no `$...$` — because Desmos renders text nodes as raw strings, not math.

**State persistence** (`captureGraphState` / `saveCurrentSession`): Full Desmos state (via `calculator.getState()`) is stored in the session object in KorahDB alongside the conversation history. On session restore, `calculator.setState(savedState)` rebuilds the graph exactly.

---

## Session Management — `KorahDB`

Sessions are stored via `window.KorahDB.setConversation` / `getConversation` (Firestore-backed). Each session record contains:

```js
{
  id: "sat_<timestamp>",
  mode: "sat-math",
  title: "<auto-generated or user-set>",
  messages: [{ role, content }],  // raw Phase 3 text strings (not parsed JSON)
  graphState: <Desmos state object>,
  createdAt, updatedAt,
  autoTitleGenerated, userRenamed
}
```

Empty sessions are never persisted — `saveCurrentSession` only runs after the first user message.

**Auto-title generation** (`generateAutoTitle`): After the first exchange, a separate `callAPI` call (non-streaming) generates a 3–6 word title from the first user message and last AI reply. Runs at temperature 0.3. Updates the session title, topbar, and sidebar.

`window.SatMathChat` exports `{ initSession, switchToSession, newChat, createNewSession }` for the sidebar and page shell.

---

## File Attachments

Supports up to 5 files per message. Processing pipeline per file type:

| Type | Processing |
|---|---|
| Image | Resized to ≤ 1024 px (JPEG 0.7 quality) via `<canvas>`, sent as `data:` URL in multimodal content |
| PDF | Read as `data:` URL (max 4 MB); sent as `image_url` part |
| Text / CSV / Markdown | Read as plain text, appended inline to the user message string |

The multimodal parts array is passed directly to Gemini through the proxy, which handles vision natively.

---

## Rendering Pipeline

```
AI response text (Markdown + KaTeX)
  → normalizeMathDelimiters()    // convert \(...\), \[...\], backtick-math to $...$
  → marked.parse()               // Markdown → HTML
  → DOMPurify.sanitize()         // HTML sanitization before DOM injection
  → container.innerHTML = html   // inject into DOM
  → renderMathInElement()        // KaTeX auto-render $...$ and $$...$$
```

Streaming partial renders feed characters from `charBuffer` into `renderMarkdownAndMath` on every typewriter tick. The final stream-end render replaces the partial with the fully-parsed result.

---

## `callAPI` — Shared API Caller

The merged call, Phase 3, and auto-title all go through a single `callAPI(userContent, onChunk, options)`:

```js
options = {
  systemPrompt,   // required — each call injects its own
  history,        // optional [{role, content}] inserted between system and user; merged call and Phase 3 pass conversationHistory
  temperature,    // default 0.2
  _phaseTag,      // label for console logs and X-Korah-Phase header
}
```

**Payload size guard:** The serialized request body is checked against Vercel's ~4.4 MB limit before sending. Oversized payloads throw a user-visible error.

The request sends the system prompt as a `role: "system"` message followed by any `history` and then the user content. SSE frames (`data: {...}`, `[DONE]` sentinel) are parsed line-by-line; each token delta is passed to `onChunk(chunk, fullReply)`.

---

## Data Flow — Full Request Lifecycle

```
User types → sendMessage(text)
  1. Append graph context ([Current Desmos State: ...]) to message
  2. Add user bubble to DOM (with any file attachment cards)
  3. Create empty assistant bubble with streaming content ID
  4. Show "Korah is thinking…" pulsing indicator

  ── MERGED CLASSIFY + ADAPT (silent) ──
  5. runMergedClassifyAdapt(userContent, conversationHistory)
       callAPI → /api/r → Gemini (non-streaming feel)
     → { stateId, strategy, adaptedState, keepGraph } or null

  6. keepGraph → leave the graph, ground Phase 3 in calculator.getState()
     Else if stateId: show "Drawing graph…" indicator
     Visualizer     → fetch example → loadDesmosState (setState)
     Problem-solver → verbatim / placeholder / validateDesmosState checks
                    → loadDesmosState (setState), or skip graph if unusable

  ── PHASE 3 (streamed) ──
  7. callAPI with buildPhase3SystemPrompt(loadedState, classifierStrategy)
       ↓ SSE stream
     onChunk: feed chars into charBuffer → typewriter → renderMarkdownAndMath
  8. Stream ends → final renderMarkdownAndMath(fullText)

  9. conversationHistory.push(user, assistant)
 10. saveCurrentSession() → KorahDB
 11. generateAutoTitle() on first exchange
```

---

## Resize Handle (Mobile)

On viewports ≤ 900 px (56.25 rem), the layout switches from side-by-side to a vertical stack. `initResizeHandle` wires a drag handle (`#resize-handle`) between `#sat-graph-panel` and `#main-content`, clamping the graph height between 80 px (5 rem) and 70% of the viewport height. `handleResize` resets inline heights when the viewport returns to desktop width.
