# Technical Spec — "Correct My Transcription": inline math rendering + no-LaTeX correction

**Status:** Draft for review
**Owner:** AP practice app (attempt flow)
**Course covered by this doc:** `ap-calculus-ab` (pattern applies to every FRQ course)
**Related code:** `ap/attempt.html`, `ap/js/ap-attempt.js`, `ap/js/ap-grader.js`, `ap/ap.css`, `docs/ap-frq-spec.md`

---

## 1. Context (current behavior)

The AP FRQ attempt flow already has a **Transcription review** step (State 4 in
`docs/ap-frq-spec.md`):

1. Student photographs handwritten work; `KorahAPGrader.transcribe()` sends the
   images to `/api/r` (Gemini) with `TRANSCRIBE_SYSTEM` (`ap/js/ap-grader.js:119`),
   which returns a plain-text transcription with "LaTeX notation where possible".
2. The result is dumped into a plain `<textarea id="transcript-box">`
   (`ap/attempt.html:194`, styled `.ap-transcript-box` in `ap/ap.css:295`).
3. The student is expected to read it, fix errors with keyboard typing, and hit
   **Confirm and grade** (`ap/js/ap-attempt.js:529`). The confirmed string is
   stored as `confirmedTranscript` and fed verbatim into the grading call.

### Gaps this spec closes

- **Math is not rendered.** The model emits LaTeX (e.g. `\frac{1}{2}\int_0^8 v(t)\,dt`)
  as raw text. A student who wrote the math by hand must torture-test their own
  LaTeX literacy to verify the transcription. There is no rendered preview.
- **Correction requires knowing LaTeX.** Fixing an OCR'd `\frac{x}{y}` garbled
  into `\frac{x}{v}` means editing raw backslash commands blind.
- **Inconsistent delimiters.** `TRANSCRIBE_SYSTEM` doesn't mandate `\(...\)`
  wrapping, so output mixes bare LaTeX, `$...$`, and plain text — fine for a
  textarea, but not renderable predictably.
- **Rendering gap after confirm.** The feedback screen's *Your response* column
  (`ap/js/ap-attempt.js:344`) uses `textContent`, so even valid `\(...\)` in the
  finalized transcript shows as raw source there too.

### House convention this aligns with

All student-facing display fields in `frqs.json` already wrap math in `\(...\)`
(see `docs/ap-frq-spec.md` delimiter rules). The transcript is student-facing
content — it should follow the same convention. Model-only fields elsewhere are
bare LaTeX; the transcript is *not* such a field.

---

## 2. Goals

1. Render every `\(...\)` math segment **inline inside the editor** so the
   student can read what the model thought, side by side with their photo.
2. Let a student **correct the transcription without knowing LaTeX**, through a
   **mini math keyboard (palette)** that inserts correctly-formed snippets at the
   caret, plus a way to edit a single mis-read math token while seeing it render.
3. Keep the **stored/transmitted value a plain text string** (the raw LaTeX):
   no schema, storage (`confirmedTranscript`), Firestore, or grading-pipeline
   changes. The grader still receives exactly what the student confirmed.
4. Make the model's transcription output predictable by mandating `\(...\)`
   delimiters in `TRANSCRIBE_SYSTEM`.

## 3. Non-goals (this phase)

- Full WYSIWYG math authoring for the *typed* answer box (`#answer-box`). The
  palette/editor component is built generically so it can be reused there later
  (Phase 3), but this phase only touches the transcription review step.
- Hand-drawn symbol recognition, ink, or stroke input.
- Dictation.

---

## 4. Design

### 4.1 The editor becomes a "math-chip" contenteditable

Replace the `<textarea id="transcript-box">` with a `contenteditable` host div
(`<div id="transcript-editor" class="ap-transcript-box" role="textbox">`).

The editor maintains a single underlying source string — the raw LaTeX text —
and renders it to the DOM as:

| Source | Rendered as |
|---|---|
| Plain text (escaped, e.g. `x =`) | normal editable text node |
| `\( ... \)` with balanced delimiters | **math chip**: KaTeX-rendered `<span class="katex-chip" contenteditable="false" data-latex="...">` |
| `$$ ... $$` (display math — **block chips**, decision recorded) | math chip styled as a block-level KaTeX chip on its own line |
| `\(` with no matching `\)` (user mid-edit) | **raw text**, shown as source until the pair completes |
| LaTeX that fails KaTeX parse (`throwOnError:false`) | inline grey source-style ramp: show the raw string, not a blank/dead chip |

Serialization back to source is exact and order-preserving: walk the DOM in
document order; emit `textContent` of text nodes, `data-latex` of chips, and raw
text of unfinished-math nodes, concatenated.

```
source ⇄ DOM
 "x = \( \int_0^8 v(t)\,dt \) + 2"
        └── text ──┘ └───── chip ────┘ └ text ┘
```

### 4.2 Editing interactions (behavioral contract)

- **Caret** may cross text and sit on chip boundaries but never *inside* a chip
  (chips are atomic, `contenteditable="false"`).
- **Backspace / Delete** at a chip boundary removes the whole chip (i.e. the
  entire `\(...\)` block) in one step.
- **Edit a chip** (this is the "fix one token" path):
  - Double-click a chip, or focus it (Tab) and press Enter.
  - The chip expands in place to a highlighted raw-source segment
    (`<span class="latex-edit">`) containing only the inner LaTeX. The caret
    goes inside; the user types raw tokens.
  - **Escape** or blur-off commits: the segment re-renders as a chip. If the
    inner LaTeX is now unbalanced (user removed `\)`) or fails to parse, it
    stays as visible raw source plus a subtle warning border until fixed. The
    original value is not lost — see `Reset to transcribed text` below.
- **Math palette inserts at the caret/selection.** If the user has a selection
  spanning chips, insertion replaces it; chips removed by that selection
  contribute their raw LaTeX into the replaced range so no math silently
  vanishes.
- **Rendering throttle:** re-render (re-chip) only on a ~400 ms pause after the
  last input event, plus immediate render when a `\)` or `$$` closing pair is
  typed. This keeps a half-typed `\(` from flickering.
- **Paste:** intercepted and normalized to plain text (strip HTML/control
  chars). Pasting `\(...\)` text re-renders as chips on next pass.
- **Undo/redo:** rely on native `execCommand('undo')/('redo')` behaviour where
  available (works for text inserts and palette `insertText`). Documented
  limitation: cross-chip edits may coalesce undo steps. The existing
  **Reset to transcribed text** button (`ap/attempt.html:196`, label renamed
  from "Reset to read text" as part of this work) remains the guaranteed
  safety net and is re-bound to `editor.setValue(lastTranscript)`.

### 4.3 Mini math keyboard (palette)

A **fixed toolbar** rendered between the thumbnails and the transcript box
(decision: anchored above the box, never a caret-floating popover; collapses
to a horizontally scrollable strip under 480 px viewport width). Each button
maps to a snippet + caret placement. Clicking inserts the snippet at the caret
and moves the caret to the intended "next thing to fill" position.

**Token catalog (initial set; data-driven, easy to extend):**

| Group | Buttons (label → insert) |
|---|---|
| Operators | `+` `−` `=` `<` `≤ (\leq)` `≥ (\geq)` `≠ (\neq)` `≈ (\approx)` `± (\pm)` `× (\times)` |
| Fractions & roots | Fraction `\frac{}{}` · bigger frac `\dfrac{}{}` · sqrt `\sqrt{}` · nth root `\sqrt[]{}` |
| Powers & subs | Power `^{}` · subscript `_{}` · e^x `e^{}` · prime `'` |
| Integrals & limits | `\int` · definite `\int_{}^{}` · `\lim` · `\lim_{x\to}` · `\sum_{}^{}` · `\prod_{}^{}` |
| Greek | `\pi` `\theta` `\alpha` `\beta` `\gamma` `\Delta` `\mu` `\lambda` |
| Trig & funcs | `\sin` `\cos` `\tan` `\ln` `\log` `\frac{d}{dx}` |

**Insertion semantics:**

```
{
  "label": "Fraction", "glyph": "⅟",  // what the button shows
  "insert": "\\frac{}{}",             // raw LaTeX to insert
  "caret": 6,                         // offset in `insert` where caret lands (= inside numerator braces)
  "select": [6, 7]                    // optional: highlight chars [6,7) inside the numerator
}
```

- Groups render as labeled sections; the palette collapses to a single
  horizontally scrollable strip under 480 px viewport width (mobile).
- All buttons are real `<button>`s (keyboard accessible); Esc closes the
  palette if open.

### 4.4 Prompt change (make the model emit renderable output)

Update `TRANSCRIBE_SYSTEM` (`ap/js/ap-grader.js:119`) to add, verbatim:

```
Wrap every equation or math expression in \( and \) inline delimiters.
Use standard LaTeX inside them: \frac{}{}, ^{} for superscripts, _{} for
subscripts, \sqrt{}, \int_{}^{}, \lim_{x\to}, \sum_{}^{}, and Greek
letters \pi \theta \alpha \beta \gamma where written. Do not use LaTeX
outside of \( ... \) — ordinary words and numbers stay as plain text.
If a section cannot be read, write [illegible] as plain text. No markdown
code fences, no $...$ or $$ delimiters.
```

This is a **non-breaking** change: the same plain-text string is confirmed and
graded as today; delimiters only add renderability.

### 4.5 Render the confirmed transcript everywhere it's shown

- **Feedback *Your response* column** (`ap/js/ap-attempt.js:344`): change
  `el('compare-student').textContent = ...` to
  `el('compare-student').innerHTML = safeHtml(transcript)` + `renderMath(...)`.
  KaTeX + DOMPurify are already loaded on this page.
- **Progress detail** (`ap/progress.html:365`, `ap/js/ap-progress.js:138`):
  Phase 2 — the progress page already ships `katex.min.js` +
  `auto-render.min.js` (and the KaTeX CSS); add DOMPurify there, then run the
  same renderMath pass over the freshly injected transcript and verdict HTML
  (see §10).

---

## 5. Data & component contracts

### 5.1 Value contract (unchanged)

`confirmedTranscript` (and `state.transcript`, `attempt.transcript`) remain
`string`, now carrying `\(...\)`-delimited math. No schema, Firestore, or
grader change.

### 5.2 New component — `ap/js/transcript-editor.js`

One plain-JS IIFE exposing `window.KorahMathEditor` (matches repo style of
`ap-grader.js` / `ap-attempt.js`):

```js
KorahMathEditor.mount(host /* Element */, {
  value: string,          // initial raw LaTeX
  onInput: (source) => {},// fired (throttled) on every change
})
  → instance

instance.getValue()   // string — exact raw LaTeX source
instance.setValue(s)  // string — re-renders from scratch, safe for reset
instance.validate()   // → { ok: boolean, problems: [{ message, offset }] }
instance.reset(last)  // convenience wrap of setValue for "Reset to transcribed text"

KorahMathEditor.attachPalette(host, instance) // renders the mini keyboard
KorahMathEditor.TOKENS                     // the data-driven token catalog
```

`validate()` checks:
- every `\(` has a matching `\)` (and `$$` pairs) — with the byte offset of the
  first offender for an inline error message;
- no HTML-ish `<...>` leftovers (shouldn't occur post-sanitize);
- length ≤ 20,000 chars.

### 5.3 `ap-attempt.js` integration points

| Existing line | Change |
|---|---|
| `renderTranscription()` `:286` `el('transcript-box').value = state.transcript` | `editor.setValue(state.transcript)` |
| confirm handler `:529` `el('transcript-box').value.trim()` | `const edited = editor.getValue().trim()`; block on `!editor.validate().ok` with a located message |
| retranscribe `:539` `el('transcript-box').value = state.transcript` | `editor.reset(state.transcript)` |
| `attempt.html:194` `<textarea>` | `<div id="transcript-editor" ...>`, plus palette host + script tag for `transcript-editor.js` (next to the other scripts, after KaTeX) |

---

## 6. Edge cases & error handling

| # | Case | Behaviour |
|---|---|---|
| 1 | Unbalanced delimiters at confirm time (user deleted a `\)`) | **Block confirm**; show message with approximate byte offset; no grading call |
| 2 | KaTeX parse error inside a chip | Render raw LaTeX as grey inline source (never blank); warning styling; still serializes correctly |
| 3 | Caret lands on a chip boundary | Allowed; chips remain atomic; no way to type inside a chip except the expand-to-edit interaction |
| 4 | Backspace at a chip boundary | Whole `\(...\)` block removed in one step |
| 5 | Native undo across chip edits | Documented limitation; `Reset to transcribed text` is the safety net |
| 6 | User pastes HTML | Strip to plain text on paste (no formatting leaks into source) |
| 7 | Transcript ≥ 20,000 chars | `validate()` fails with message; counter shown under the box |
| 8 | Mobile | Palette becomes scrollable strip; contenteditable works with software keyboard; chips still atomic |
| 9 | `[illegible]` tokens | Plain text, never chipped; thumbs keep the student able to check the original page |
| 10 | Keyboard-only | Chip focus + Enter to edit; all palette buttons keyboard-reachable; Esc closes palette/raw editor |

---

## 7. Accessibility

- Math chips: `role="math"`, `aria-label="<raw LaTeX source>"`, focusable,
  Enter to expand to raw editor.
- Palette: semantic buttons, visible focus ring matching `--acc` accent,
  keyboard operable.
- The raw-LaTeX editor state is visually distinct (background + border) and
  announced as "editing LaTeX source".
- Palette collapse respects reduced-motion / standard focus order; no new
  color-only signals (errors also add text).

---

## 8. Testing & canned mode

- **Fixtures:** `ap/data/ap-calculus-ab/canned-transcript.json` now ships with
  several `\(...\)` math sections and one deliberate mis-transcription in part
  (d) (previously absent for this course). `canned-grading.json` ships alongside
  it (9 verdicts against `calc-ab-2025-q1`) so the `?canned=1` route feeds both
  the transcription review step and the full feedback screen with zero API
  calls.
- **Round-trip test:** `setValue(raw)` → DOM → `getValue()` must return `raw`
  byte-for-byte for a library of inputs (balanced/unbalanced, plain text with
  no math, math with `\\n` line breaks, multiline).
- **Correction walk-through:** photo → transcription renders chips → user edits
  one chip raw → commits → `getValue()` reflects only that change.
- **Validation tests:** unbalanced-at-confirm blocks; under-200px/mobile layout
  smoke test.
- **Regression:** typed-response flow (no photos) unchanged; grading output +
  Firestore write shape unchanged.

---

## 9. File impact list

| File | Action |
|---|---|
| `ap/js/transcript-editor.js` | **new** — editor, palette, token catalog |
| `ap/attempt.html` | replace textarea, add palette host + script tag, rename reset button to "Reset to transcribed text" |
| `ap/js/ap-attempt.js` | re-bind transcribe/confirm/reset to editor API; `compare-student` renders math |
| `ap/js/ap-grader.js` | `TRANSCRIBE_SYSTEM` delimiter mandate |
| `ap/ap.css` | `.katex-chip`, `.latex-edit`, `.ap-math-palette`, layout + mobile rules |
| `ap/data/ap-calculus-ab/canned-transcript.json` | **new fixture** for canned mode |
| `docs/ap-frq-spec.md` | update State 4 + transcription prompt sketch to match |
| `ap/progress.html` + `ap/js/ap-progress.js` | Phase 2 — render math in transcript detail |

---

## 10. Phases & acceptance criteria

**Phase 1 (this spec):**
- [ ] Transcription math renders inline as readable chips; photos stay on the
      left for comparison.
- [ ] A student with no LaTeX knowledge can fix a mis-read token via chip
      edit + palette (no raw-command typing required for palette-inserted
      content).
- [ ] `getValue()` round-trips source exactly; unbalanced input blocks confirm
      with a located message.
- [ ] Feedback *Your response* column renders math.

**Phase 2 (progress page + canned fixtures):**
- [x] `ap/progress.html` renders `\(...\)`/`$$...$$` in the attempt-detail
      transcript, verdict feedback, and verdict criterion labels via a
      `renderMath()` helper (same delimiters as `ap-attempt.js`); content is
      still `esc()`'d before injection, then KaTeX runs on the text nodes.
- [x] DOMPurify added to `progress.html` (KaTeX + auto-render were already
      loaded there, contrary to the §4.5 draft assumption).
- [x] `ap/data/ap-calculus-ab/canned-grading.json` added — 9 verdicts against
      `calc-ab-2025-q1` so the `?canned=1` route feeds the whole feedback
      screen offline (previously missing for this course).
- [x] `ap/data/ap-calculus-ab/canned-transcript.json` rewritten to be a
      coherent student response to `calc-ab-2025-q1` (was a generic tank
      problem matching no real FRQ), including a deliberate mis-transcription
      in part (d).
- [x] `ap/data/ap-calculus-ab/placeholder-attempts.json` added — six demo
      attempts (real `frqId`s + rubric point ids, math-laden transcripts, one
      disputed point) so the guest/offline Progress view has data to render
      (the demo for this course was previously empty).

**Phase 3:** Reuse the editor/palette for the typed answer box (`#answer-box`).

---

## 11. Recorded decisions

1. **Palette placement:** a fixed toolbar anchored above the transcript box
   (between the photo thumbnails and the editor), never a caret-floating
   popover. Collapses to a horizontally scrollable strip under 480 px
   viewport width.
2. **Display-mode math (`$$...$$`):** renders as block-level KaTeX chips on
   their own line, matching the `renderMath()` delimiters already configured
   on the attempt page.
3. **Reset button label:** `Reset to transcribed text` (renamed from
   `Reset to read text`).