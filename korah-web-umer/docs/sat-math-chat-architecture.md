# SAT Math Chat — Architecture & Backend Design

`korah-bot/sat/math-chat.js` is the client-side orchestration layer for the SAT Math tutoring feature. It coordinates four subsystems: a three-phase AI pipeline, the Desmos Template Library, the Desmos graphing calculator, and the KorahDB session store. No separate server is required — the browser talks directly to `/api/gem-proxy` (a Vercel serverless proxy) and persists everything locally.

---

## High-Level Architecture

```
Browser (math-chat.js)
│
├── UI Layer            — DOM manipulation, Markdown/KaTeX rendering, typewriter animation
├── Session Layer       — KorahDB (Firestore-backed), conversation history
├── AI Pipeline         — Three phases, all calling callAPI → /api/gem-proxy → Gemini 2.5 Flash
│     ├── Phase 1       — Silent classifier: picks a Desmos template id
│     ├── Phase 2       — Silent adapter: loads + adapts template state JSON
│     └── Phase 3       — Streamed tutoring response grounded in loaded state
└── Graph Layer         — Desmos GraphingCalculator, setState / validateDesmosState
         ↕
    /api/gem-proxy (Vercel serverless)
         ↕
    Google Gemini 2.5 Flash (SSE stream)
```

---

## Three-Phase AI Pipeline

Every user message triggers three sequential AI calls. Phase 1 and 2 are silent (no visible output). Phase 3 streams the tutoring explanation to the chat.

### Phase 1 — Template Classification (`runPhase1Classification`)

**System prompt:** `PHASE1_CLASSIFIER_PROMPT_BASE` + the full `template-index.json` appended at build time via `buildPhase1SystemPrompt()`.

**Goal:** Pick the best matching template id for the student's problem, or return `null` if no template fits.

**Output (tiny JSON, not streamed to UI):**
```json
{ "stateId": "linear-functions", "strategy": "one-sentence rationale" }
```

The classifier is biased strongly toward picking a template — almost every SAT math problem maps to one. It returns `null` only for non-mathematical inputs or categories clearly outside the library (pure 3D geometry, probability, etc.).

**Parsing:** Code fences and leading junk are stripped, then `JSON.parse`. Falls back to balanced-brace extraction if parsing fails.

---

### Phase 2 — Graph Loading (`runPhase2Adaptation` / `loadDesmosState`)

Runs only when Phase 1 returned a non-null `stateId`. Shows a "Drawing graph…" indicator in the chat bubble while it runs.

Two code paths based on template type (looked up in the index):

| Template type | Behavior |
|---|---|
| `visualizer` | Load verified example `desmos-json/<id>.json` as-is via `loadDesmosState`. No API call. |
| `problem-solver` | Call `runPhase2Adaptation`: fetch example + template skeleton, ask the model to adapt the template to the student's specific numbers/equations. |

**`runPhase2Adaptation` API call:**

- **System prompt:** `buildPhase2SystemPrompt()` — instructs the model to fill `{{PLACEHOLDER}}` slots in the template using the student's problem, using the example only for syntax reference.
- **User content:** the student's problem + the template JSON + the verified example JSON.
- **Output:** a complete Desmos state object (raw JSON, no code fences).
- **Verbatim-copy detection:** if the adapted expressions list is byte-for-byte identical to the example's, the result is treated as a failure.

**Fallback chain:**
```
Phase 2 API returns adapted state
  → validateDesmosState passes → loadDesmosState (setState) ✓
  → validateDesmosState fails  → load verified example as fallback
Phase 2 API returns null        → load verified example as fallback
Phase 2 API throws              → skip graph (no state loaded)
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
- The classifier's `strategy` sentence (one line from Phase 1).
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
| `desmos-json/templates/<id>.json` | Skeleton with `{{PLACEHOLDER}}` slots — the structural guide for Phase 2 |

Templates are cached in memory after first fetch (`_exampleCache`, `_templateCache`, `_templateIndex`).

**Template types:**

| Type | Phase 2 behavior |
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

> **Text node rule:** `validateDesmosState` rejects any text node that has a `color` field. The Phase 2 system prompt enforces plain English in text nodes — no backslashes, no `$...$` — because Desmos renders text nodes as raw strings, not math.

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

All three phases (and auto-title) go through a single `callAPI(userContent, onChunk, options)`:

```js
options = {
  systemPrompt,   // required — each phase injects its own
  temperature,    // default 0.2; Phase 1 uses 0.1
  _phaseTag,      // label for console logs and X-Korah-Phase header
}
```

**Payload size guard:** The serialized request body is checked against Vercel's ~4.4 MB limit before sending. Oversized payloads throw a user-visible error.

The request sends the system prompt as a `role: "system"` message followed by the user content. SSE frames (`data: {...}`, `[DONE]` sentinel) are parsed line-by-line; each token delta is passed to `onChunk(chunk, fullReply)`.

---

## Data Flow — Full Request Lifecycle

```
User types → sendMessage(text)
  1. Append graph context ([Current Desmos State: ...]) to message
  2. Add user bubble to DOM (with any file attachment cards)
  3. Create empty assistant bubble with streaming content ID
  4. Show "Korah is thinking…" pulsing indicator

  ── PHASE 1 (silent) ──
  5. runPhase1Classification(userContent)
       callAPI → /api/gem-proxy → Gemini (non-streaming feel)
     → { stateId, strategy } or null

  ── PHASE 2 (silent) ──
  6. If stateId: show "Drawing graph…" indicator
     Visualizer  → fetch example → loadDesmosState (setState)
     Problem-solver → fetch example + template → runPhase2Adaptation
                    → callAPI → Gemini → adapted state JSON
                    → validateDesmosState → loadDesmosState (setState)
                    → fallback to example if adaptation fails

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
