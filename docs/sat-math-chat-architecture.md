# SAT Math Chat — Architecture & Backend Design

`korah-bot/sat/math-chat.js` is the client-side orchestration layer for the SAT Math tutoring feature. It coordinates three subsystems: the AI conversation engine, the Desmos graphing calculator, and the IndexedDB session store. No separate server is required — the browser talks directly to `/api/gem-proxy` (a Vercel serverless proxy) and persists everything locally.

---

## High-Level Architecture

```
Browser (math-chat.js)
│
├── UI Layer            — DOM manipulation, Markdown/KaTeX rendering
├── Session Layer       — KorahDB (IndexedDB), conversation history
├── AI Layer            — callAPI → /api/gem-proxy → Gemini 2.5 Flash
└── Graph Layer         — Desmos GraphingCalculator API
         ↕
    /api/gem-proxy (Vercel serverless)
         ↕
    Google Gemini 2.5 Flash (SSE stream)
```

---

## Key Subsystems

### 1. AI Engine — `callAPI` / `sendMessage`

**Endpoint:** `POST /api/gem-proxy`  
**Model:** `gemini-2.5-flash`  
**Protocol:** Server-Sent Events (SSE streaming)

`callAPI(userContent, onChunk)` sends the full conversation to the proxy and streams back tokens. It handles SSE framing (`data: {...}`, `[DONE]` sentinel) and exposes each new chunk via the `onChunk(chunk, fullText)` callback.

`sendMessage(text)` is the top-level orchestrator:

1. Appends graph context (`[Current Desmos State: ...]`) to the user message.
2. Attaches any pending files (images, PDFs, text) as multimodal message parts.
3. Streams the response through a typewriter effect.
4. On completion, calls `parseAIResponse` to extract the structured JSON.
5. Updates the Desmos graph if `graph` is non-null.
6. Persists the exchange to session storage.

**Payload size guard:** The serialized request body is checked against Vercel's 4.5 MB limit before sending. Oversized payloads raise a user-visible error.

---

### 2. System Prompt — `SAT_MATH_SYSTEM_PROMPT`

The prompt enforces a **strict JSON response contract**:

```json
{
  "graph": { "expressions": [...], "viewport": {...} },
  "response": "Markdown + KaTeX explanation",
  "suggestions": ["follow-up 1", "follow-up 2"]
}
```

The model is instructed to teach using one of four strategies:

| Strategy | When to use |
|---|---|
| A — Regression Trick | Two expressions equal; solve for unknown parameter(s) using `~` (tilde) instead of `=` and subscript variables (`x_1`). |
| B — Data Table + Regression | Problem provides data points; enter as Desmos table, run regression. |
| C — Graph-and-Check | Multiple-choice with graphable expressions; graph each option and compare. |
| D — Algebraic | Pure symbolic manipulation; show step-by-step algebra, then verify on graph. |

**Desmos syntax rules** are embedded directly in the prompt so the model never emits invalid expressions (see §Graph Layer below for filtering).

---

### 3. Structured Response Parser — `parseAIResponse`

Standard `JSON.parse` breaks on unescaped LaTeX backslashes (e.g. `\frac` inside a JSON string becomes a form-feed character). `parseAIResponse` uses a two-pass strategy:

1. **Fast path:** attempt `JSON.parse` on the raw text. Succeeds ~90% of the time when the model is well-behaved.
2. **Slow path:** manually scan the raw string field-by-field:
   - `extractStringField` — walks char-by-char, preserves LaTeX sequences (`\frac`, `\sim`, `\left`) while converting true JSON escapes (`\n`, `\t`, `\"`) correctly.
   - `extractBraceBlock` — balanced `{ }` extraction for the `graph` object.
   - `fixEscapesForJSON` — repairs the extracted graph JSON so a second `JSON.parse` succeeds.

The streaming partial-render path (during the SSE stream) uses a simpler but equivalent char-walk implemented in the `onChunk` callback to show the `response` field in real time before the stream finishes.

---

### 4. Graph Layer — Desmos GraphingCalculator

**Initialization** (`initializeSATGraph`): The calculator is created once per page load with read-only controls (no keypad, no settings menu). An `expressionsChanged` observer fires `captureGraphState` on every expression change with a 500 ms debounce.

**Updating the graph** (`updateSATGraph`):

```
updateSATGraph(data)
  → satMathCalculator.setBlank()          // clear previous state
  → satMathCalculator.setMathBounds(...)  // apply viewport
  → for each expression:
      filter out text notes               // guard: type==="text" or no latex
      satMathCalculator.setExpression({
        id, color, ...expr
      })
  → captureGraphState()                   // sync back to session
```

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
| Text note | `type: "text"`, `text` | No `latex` or `color` field — Desmos rejects the expression if `color` is present |

> **Text note handling:** `updateSATGraph` detects `type === "text"` and omits the `color` fallback that is added to all other expression types. Spreading a `color` property onto a text note causes Desmos to render it as a raw unquoted entry in the expression list instead of a styled note.

**Graph context injection** (`getGraphContext`): Before each user message is sent, the current Desmos state is serialized to a short summary string (`[Current Desmos State: y=x^2; Table(x_1:[1,2,3], y_1:[2,4,6])]`) and appended to the prompt so the model can reason about what is already on screen.

**State persistence** (`captureGraphState` / `saveCurrentSession`): Full Desmos state (via `calculator.getState()`) is stored in the session object in IndexedDB alongside the conversation history. On session restore, `calculator.setState(savedState)` rebuilds the graph exactly.

---

### 5. Session Management — `KorahDB`

Sessions are stored in IndexedDB via the shared `window.KorahDB` helper (defined in `app/db.js`). Each session record contains:

```js
{
  id: "sat_<timestamp>",
  mode: "sat-math",
  title: "<first 50 chars of first message>",
  messages: [{ role, content }],   // raw API strings, not parsed
  graphState: <Desmos state object>,
  createdAt, updatedAt,
  autoTitleGenerated, userRenamed
}
```

`window.SatMathChat` exports `{ initSession, switchToSession, newChat, createNewSession }` for the sidebar and page shell to call.

---

### 6. File Attachments

Supports up to 5 files per message. Processing pipeline per file type:

| Type | Processing |
|---|---|
| Image | Resized to ≤ 1024 px (JPEG 0.7 quality) via `<canvas>`, sent as `data:` URL in multimodal content |
| PDF | Read as `data:` URL (max 4 MB); sent as `image_url` part |
| Text / CSV / Markdown | Read as plain text, appended inline to the user message string |

The multimodal parts array is passed directly to the Gemini API through the proxy, which handles vision natively.

---

### 7. Rendering Pipeline

```
AI response text (Markdown + KaTeX)
  → normalizeMathDelimiters()    // convert \(...\), \[...\], backtick-math to $...$
  → marked.parse()               // Markdown → HTML
  → container.innerHTML = html   // inject into DOM
  → renderMathInElement()        // KaTeX auto-render $...$ and $$...$$
```

Streaming partial renders bypass `marked` and write directly to `container.innerHTML` to avoid flushing the cursor glyph (`▊`) through the full pipeline on every token.

---

## Data Flow — Full Request Lifecycle

```
User types → sendMessage(text)
  1. Append graph context
  2. Add user bubble to DOM
  3. Create empty assistant bubble with streaming content ID
  4. Show "Korah is thinking..." pulsing indicator
  5. callAPI(userContent, onChunk)
       ↓ SSE stream
     onChunk: extract "response" field, render partial markdown
  6. Stream ends → parseAIResponse(fullText)
  7. If graph data → updateSATGraph(data.graph)
  8. Render final response with renderMarkdownAndMath()
  9. Append suggestions buttons if present
 10. conversationHistory.push(user, assistant)
 11. saveCurrentSession() → KorahDB
```

---

## Resize Handle (Mobile)

On viewports ≤ 900 px, the layout switches from a side-by-side panel to a vertical stack. `initResizeHandle` wires a drag handle (`#resize-handle`) between `#sat-graph-panel` and `#main-content`, clamping the graph height between 80 px and 70% of the viewport height. `handleResize` resets inline heights when the viewport returns to desktop width.
