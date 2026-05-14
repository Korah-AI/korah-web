# SAT Section Upgrade — Implementation Plan

A phased blueprint for evolving Korah's SAT section into a top-tier study product, drawing on patterns from the open-source [MySATPrep](https://github.com/) project while leveraging Korah's unique strengths: Firebase Auth, Firestore cross-device sync, and integrated AI tutoring via korah-bot.

---

## Overview

**Goal:** Bring the depth of MySATPrep's SAT prep experience (taxonomy-driven practice, full session lifecycle, analytics, bookmarks, vocab, AI validation) into the existing Korah SAT section, layered on top of the AI tutoring features Korah already has.

**Non-goals (this round):**
- Migrating to the `korah-bot/next/` Next.js app — that stub stays as-is for now.
- Replacing the `/api/sat/questions` proxy or its PracticeSAT upstream.
- Adding a new auth or DB system — Firebase + Firestore are the source of truth.

**Constraints:**
- Vanilla JS modules in `korah-bot/sat/` (existing pattern: `window.KorahSAT`, `window.KorahDB`).
- Firestore for all persistent user state (cross-device beats localStorage).
- Reuse existing scaffolding: KaTeX, Desmos API, Lucide icons, theme CSS variables, shared sidebar.
- All upstream HTML/MathML must be sanitized before injection.

---

## Current State

| Area | Status | File |
|------|--------|------|
| Question fetch proxy | ✅ working | `korah-bot/api/sat/questions.js` |
| Domain/skill taxonomy | ✅ complete | `korah-bot/sat/js/sat-shared.js` |
| Bank selection UI | ⚠️ section+domain only — no skill/difficulty filter | `korah-bot/sat/js/sat-bank.js` |
| Question player | ⚠️ MCQ-only, demo fallback present | `korah-bot/sat/js/sat-player.js` |
| Firestore CRUD primitives | ✅ working | `korah-bot/app/data/firestore-store.js` |
| KaTeX + Desmos | ✅ loaded | global |
| SAT Math chat (Desmos) | 📋 designed, not built | `docs/sat-math-mode-implementation-plan.md` |
| Session model | ❌ none | — |
| Stats / analytics | ❌ none | — |
| Bookmarks | ❌ none | — |
| Review mode | ❌ none | — |
| Vocab | ❌ none | — |
| HTML sanitization | ❌ raw injection | — |

---

## Firestore Data Model — New Collections

```
users/{uid}/
  satSessions/{sessionId}        # one doc per practice attempt (active or completed)
  satStats/aggregated            # singleton rollup of all-time performance
  satBookmarks/{questionId}      # one doc per saved question
  satVocab/{word}                # one doc per vocab word's SR state
```

### `satSessions/{sessionId}`

```jsonc
{
  "status": "IN_PROGRESS",        // NOT_STARTED | IN_PROGRESS | PAUSED | COMPLETED | ABANDONED
  "selections": {
    "section": "english",         // english | math
    "domains": ["INI","CAS"],
    "skills":  ["CID","WIC"],
    "difficulties": ["E","M","H"],
    "limit": 20,
    "randomize": true,
    "excludeAnswered": false
  },
  "questionIds": ["q1","q2","..."],
  "answers": {
    "q1": { "userAnswer": "B", "isCorrect": true,  "timeSpent": 42, "timestamp": 1731600000000, "marked": false }
  },
  "currentIndex": 5,
  "startedAt":  1731600000000,
  "updatedAt":  1731600600000,
  "completedAt": null
}
```

State machine + factory mirror `open-source/MySATPrep/src/types/session.ts` — adapt the TypeScript types into a JSDoc + plain-JS helper module.

### `satStats/aggregated` (singleton)

```jsonc
{
  "byDomain":     { "INI": { "correct": 12, "total": 18, "totalTimeMs": 540000 }, "...": {} },
  "bySkill":      { "CID": { "correct": 7,  "total": 10, "totalTimeMs": 320000 }, "...": {} },
  "byDifficulty": { "E": {...}, "M": {...}, "H": {...} },
  "answeredQuestionIds": ["q1","q2"],
  "recent": [
    { "sessionId":"s1","completedAt":1731600000000,"correct":8,"total":10,"section":"english" }
  ],
  "updatedAt": 1731600600000
}
```

Aggregation logic shape borrowed from `open-source/MySATPrep/src/lib/practiceStatistics.ts`.

### `satBookmarks/{questionId}`

```jsonc
{ "questionId":"q1", "section":"english", "domain":"INI", "skill":"CID",
  "dateAdded": 1731600000000, "tags": ["tricky"], "note": "watch for negation" }
```

### `satVocab/{word}` (Phase 7)

```jsonc
{ "word":"laconic", "mastery": 0.6, "attempts": 4, "correct": 3,
  "lastReviewed": 1731600000000, "nextReview": 1731686400000,
  "userSentences": ["..."] }
```

---

## Architectural Decisions

1. **Stay vanilla JS in `korah-bot/sat/`.** The existing module pattern is small, fast, and consistent with the rest of the app. A Next.js migration is a separate, later effort.
2. **Proxy is the only upstream contact.** All College Board / PracticeSAT calls go through `/api/sat/questions`. Frontend never talks to either directly.
3. **Firestore > localStorage for stats.** Korah has auth — cross-device sync is the differentiator vs. MySATPrep (localStorage-only by necessity).
4. **korah-bot integration is the wedge.** AI explanations for missed questions, vocab validation, and SAT Math chat are features MySATPrep cannot match. Design every phase so these hooks fall out naturally.
5. **Sanitize all upstream HTML.** Add DOMPurify (CDN) and pipe every `stem`, `option.text`, `explanation`, and `paragraph` through it before injection.

---

## Reuse Map — What NOT to Rewrite

| Need | Reuse |
|---|---|
| Question fetching | `korah-bot/api/sat/questions.js` (extend with `difficulties` param) |
| Taxonomy data | `korah-bot/sat/js/sat-shared.js` |
| Firestore CRUD | `window.KorahDB` in `korah-bot/app/data/firestore-store.js` |
| AI calls | `korah-bot/api/gem-proxy.js` |
| Sidebar & layout | `korah-bot/study/js/sidebar.js` |
| Theming | CSS variables in `korah-bot/app/korah-chat.css` |
| Math rendering | KaTeX (already loaded) |
| Graphing | Desmos API (already loaded) |

**Port-the-logic references** — read these as design inputs, don't copy as-is:
- Fraction canonicalization → `open-source/MySATPrep/src/lib/questionFetcher.ts`
- Stats aggregation shape → `open-source/MySATPrep/src/lib/practiceStatistics.ts`
- Session state machine → `open-source/MySATPrep/src/types/session.ts`
- Vocab data file → `open-source/MySATPrep/src/static-data/cleaned_sat_vocabulary.json`

---

## Phase 1 — Session Model + Onboarding Upgrade

**Goal:** Every practice attempt becomes a first-class Firestore session; users can pick skills + difficulty, resume mid-flight sessions, and never lose progress.

### Files

| File | Change |
|------|--------|
| `korah-bot/app/data/firestore-store.js` | Add `createSatSession`, `getActiveSatSession`, `saveSatSession`, `completeSatSession`, `listSatSessions` |
| `korah-bot/sat/js/sat-bank.js` | Add skill multi-select per chosen domain, difficulty toggles (E/M/H), randomize toggle, exclude-answered toggle |
| `korah-bot/sat/js/sat-shared.js` | Extend `parseSearch`/`buildQuery` for `skills`, `difficulties`, `randomize`, `excludeAnswered` |
| `korah-bot/api/sat/questions.js` | Thread `difficulties` query param into upstream metadata fetch |
| `korah-bot/sat/index.html` | Resume-session banner ("Continue practice from 4 min ago?") |
| `korah-bot/sat/js/sat-player.js` | On every answer: patch session doc; on tab visibility change: save; auto-save interval (30s) |

### Notes
- Session IDs are `ULIDs` or `crypto.randomUUID()` — generate client-side.
- Auto-save throttled to once per 30s OR on every answered question, whichever comes first.
- `getActiveSatSession()` returns the most-recent `IN_PROGRESS` doc; resume banner conditionally renders.

### Verification
1. Start practice with `domains=INI,CAS`, `skills=CID`, `difficulties=M,H`.
2. Answer 3 questions, refresh the browser.
3. Confirm `sat/index.html` shows a resume banner and clicking it restores state at question 4.
4. Inspect `satSessions/{id}` in Firestore — `answers` contains 3 entries, `currentIndex=3`, `status=IN_PROGRESS`.

---

## Phase 2 — Player Completeness

**Goal:** Player handles every question type cleanly, renders all math, sanitizes all HTML, and feels responsive.

### Files

| File | Change |
|------|--------|
| `korah-bot/sat/js/sat-player.js` | Sanitize HTML on inject (DOMPurify), KaTeX `renderMathInElement` after inject, keyboard shortcuts, green/red answer feedback, optional sound |
| `korah-bot/sat/js/sat-spr.js` *(new)* | SPR input + answer canonicalization |
| `korah-bot/sat/sat.css` | Answer-state colors, focus rings, draggable popup styles |
| `korah-bot/sat/index.html` + `questions.html` | Add `<script src="https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js">` |

### SPR canonicalization rules
Port the logic in `open-source/MySATPrep/src/lib/questionFetcher.ts`:
- Accept `3/2`, `1.5`, `1.50`, `three halves` as equivalent.
- Translate written fractions to numeric form before compare.
- Normalize whitespace and trailing zeros.

### Keyboard shortcuts
- `A` / `B` / `C` / `D` — select MCQ option
- `Enter` — submit
- `→` / `Space` — next question after submit
- `B` — toggle bookmark (when not in option-select context)
- `Esc` — close popups

### Draggable utility popups
Reference sheet + Desmos calculator + scratch notes as floating, draggable, resizable panels. Simple hand-rolled drag handler (mirrors MySATPrep — no library needed).

### Verification
- SPR question accepts `3/2`, `1.5`, `three halves` — all marked correct.
- Question stem with `<math>` MathML renders via KaTeX.
- Pressing `A` selects option A; pressing `Enter` submits; pressing `→` advances.
- Injecting a `<script>` payload through a mocked upstream response does NOT execute (DOMPurify strips it).

---

## Phase 3 — Stats + Tracker Dashboard

**Goal:** Visualize performance so users know what to study next.

### Files

| File | Change |
|------|--------|
| `korah-bot/app/data/firestore-store.js` | `recordSatAnswer(sessionId, qMeta, answer)` updates `satStats/aggregated` in a transaction |
| `korah-bot/sat/tracker.html` *(new)* | Page shell, sidebar, Chart.js CDN |
| `korah-bot/sat/js/sat-tracker.js` *(new)* | Load aggregated stats, render charts |
| `korah-bot/sat/sat.css` | Chart container, heatmap cells |

### Visualizations
- **Accuracy by domain** — horizontal bar (Chart.js)
- **Avg time by domain** — companion bar
- **Skill heatmap** — color-coded grid by `bySkill` mastery
- **Difficulty breakdown** — stacked bar (E/M/H correct vs total)
- **Recent sessions** — list, click-through to review page (Phase 4)

### Aggregation strategy
Client-side transaction on each answer: read `satStats/aggregated`, mutate locally, write back. Acceptable for single-tab use; document the race in the "Open Questions" section for a future Vercel-function rollup.

### Verification
1. Complete a 10-question session mixing domains.
2. Open `sat/tracker.html`.
3. Confirm domain bars sum to the answered counts, skill heatmap lights up correct cells, recent sessions list shows the new entry.

---

## Phase 4 — Bookmarks + Review Mode

**Goal:** Save questions worth revisiting; review every completed session in depth.

### Files

| File | Change |
|------|--------|
| `korah-bot/sat/js/sat-player.js` | Star icon, toggles `satBookmarks/{qId}` |
| `korah-bot/sat/bookmarks.html` *(new)* | List + filters (section/domain/skill/tags) |
| `korah-bot/sat/js/sat-bookmarks.js` *(new)* | Load + render bookmarks |
| `korah-bot/sat/review.html` *(new)* | Per-session review (reads `?session={id}`) |
| `korah-bot/sat/js/sat-review.js` *(new)* | Render answers, time per question, explanations |
| `korah-bot/sat/index.html` | Link "Continue from review" CTA after session completion |

### Review page contents
- Header: score, time, accuracy
- Per-question card: user's answer vs. correct, correct/wrong indicator, time spent vs. session avg, expandable explanation
- Confetti on entry if `correct/total ≥ 0.8` (via `canvas-confetti` CDN)
- "Ask Korah why I got this wrong" button → opens chat with question context pre-loaded (Phase 6 integration)

### Verification
- Star a question in the player; confirm `satBookmarks/{qId}` is created.
- Visit `sat/bookmarks.html`; filter by skill `CID`; click into a single-question practice.
- Complete a session; tap "Review" CTA; confirm review page shows correct counts.

---

## Phase 5 — Question Bank Browser + Shareable URLs

**Goal:** A browseable index of every available question, and a way to share/curate sets.

### Files

| File | Change |
|------|--------|
| `korah-bot/sat/bank.html` *(new)* | Filter UI (section/domain/skill/difficulty), inline preview, "Practice these" button |
| `korah-bot/sat/js/sat-bank-browser.js` *(new)* | Pagination + filter state |
| `korah-bot/sat/js/sat-player.js` | Support `?questionIds=id1,id2,id3` — bypass `/api/sat/questions` filter and fetch each by ID |
| `korah-bot/api/sat/questions.js` | Accept `questionIds` param, fetch only those |

### Shareable URLs
- `sat/questions.html?questionIds=q1,q2,q3` → curated set practice
- Enables korah-bot to generate "here are 5 questions on linear functions" → click-through into the player.

### Verification
- Open `sat/bank.html`, filter to `skill=H.A.`, click 3 questions, hit "Practice these"; player loads exactly those 3.
- Manually navigate to `sat/questions.html?questionIds=<3 IDs>`; same result.

---

## Phase 6 — SAT Math Chat with Desmos

**Goal:** Build the AI math tutor with persistent graphing canvas. The existing design docs cover most of this; this phase wires it into the new session/stats model.

### Existing design (don't duplicate here)
- [`docs/sat-math-mode-implementation-plan.md`](./sat-math-mode-implementation-plan.md)
- [`docs/sat-math-chat-architecture.md`](./sat-math-chat-architecture.md)
- [`docs/desmos-template-library-plan.md`](./desmos-template-library-plan.md)

### Additions for this round

| File | Change |
|------|--------|
| `korah-bot/sat/math-chat.html` *(new — per existing plan)* | Build it |
| `korah-bot/sat/math-chat.js` *(new — per existing plan)* | Build it |
| `korah-bot/sat/js/sat-review.js` | "Ask Korah" button → open math-chat with question stem injected as opening message |
| `korah-bot/api/gem-proxy.js` | Accept optional `questionContext` payload to seed system prompt |

### Verification
- Get a math question wrong on review page.
- Click "Ask Korah why I got this wrong".
- Confirm math-chat opens with the question loaded, an opening AI turn explains the misstep, and graphing it on Desmos works.

---

## Phase 7 — Vocabulary System

**Goal:** Replicate (and improve on) MySATPrep's 988-word vocab system with AI-validated practice modes and Firestore-backed spaced repetition.

### Files

| File | Change |
|------|--------|
| `korah-bot/sat/data/vocab.json` *(new)* | Copy from `open-source/MySATPrep/src/static-data/cleaned_sat_vocabulary.json` |
| `korah-bot/sat/vocab/index.html` *(new)* | Wordbank (browse, filter by difficulty/category) |
| `korah-bot/sat/vocab/flashcards.html` *(new)* | Spaced-repetition flashcards |
| `korah-bot/sat/vocab/practice.html` *(new)* | Quiz modes: definition quiz, vocab match, fill blank, sentence writing |
| `korah-bot/sat/js/sat-vocab.js` *(new)* | Shared vocab logic, SR scheduling, Firestore sync |
| `korah-bot/api/sat/vocab-validate.js` *(new)* | Proxy to `gem-proxy.js` with vocab-validation prompt |
| `korah-bot/app/data/firestore-store.js` | `getVocabState(word)`, `recordVocabAttempt(word, type, correct)` |

### SR schedule
Simple SM-2-lite:
- Correct: `nextReview = now + 2^attempts days`
- Wrong: `nextReview = now + 1 hour`, drop mastery
- Flashcards page surfaces words with `nextReview <= now`, oldest first.

### AI validation prompts (port from MySATPrep)
- **Definition quiz:** user supplies definition; AI checks semantic match against `definition` field, returns `{correct, feedback, hint}`.
- **Sentence writing:** user supplies a sentence; AI checks correct usage of the word's meaning, returns same shape.

### Verification
- Browse wordbank, filter to "hard"; correct count appears.
- Learn 5 words in flashcards, refresh — `nextReview` persists in Firestore.
- Write a valid sentence using a vocab word; AI marks correct. Write a misuse; AI marks incorrect with feedback.

---

## Phase 8 — Polish & A11y

**Goal:** Production-ready quality.

- Audit every HTML-injection site for DOMPurify coverage.
- ARIA on answer radio group; ensure screen readers announce correct/wrong after submit.
- Tab order through player matches visual order.
- Mobile layout pass: player, bank, tracker, vocab.
- Add Lucide spinner states + skeleton loaders on slow fetches.
- Lighthouse pass — aim for >90 accessibility on all SAT pages.

---

## Implementation Order & Estimates

| Phase | Estimated effort | Unlocks |
|------|------|----|
| 1. Sessions + onboarding | M | Everything else |
| 2. Player completeness | M | Trustworthy core experience |
| 3. Stats + tracker | M | Retention loop |
| 4. Bookmarks + review | S | Quick wins on session data |
| 5. Bank browser + shareable URLs | S | korah-bot integration surface |
| 6. SAT Math chat (Desmos) | L | Differentiator |
| 7. Vocab system | L | Parallel to 6 |
| 8. Polish | S | Quality bar |

S = ~1–2 days, M = ~3–5 days, L = ~1–2 weeks.

---

## Open Questions

1. **Vocab AI model:** Reuse Gemini via `gem-proxy.js`, or route vocab validation to a cheaper model (e.g. Gemini Flash)? Cost vs. quality trade-off.
2. **Stats roll-up atomicity:** Client-side Firestore transaction is fine for single-tab use. Should we move to a Vercel function trigger if multi-tab races appear in practice?
3. **Migration:** Is there any existing `localStorage` state from the current demo-questions player worth migrating into `satSessions`? (Likely no — current state is ephemeral.)
4. **Bluebook exclusion:** MySATPrep has an "exclude Bluebook" toggle. Does the PracticeSAT upstream expose Bluebook metadata, or skip this filter?

---

## Critical Files Reference

- `korah-bot/api/sat/questions.js` — proxy; extend, don't rewrite
- `korah-bot/sat/js/sat-shared.js` — taxonomy + URL helpers
- `korah-bot/sat/js/sat-bank.js` — practice setup UI
- `korah-bot/sat/js/sat-player.js` — question player
- `korah-bot/app/data/firestore-store.js` — DB primitives
- `korah-bot/api/gem-proxy.js` — AI proxy
- `korah-bot/study/js/sidebar.js` — shared sidebar
- `open-source/MySATPrep/src/lib/questionFetcher.ts` — fraction canonicalization (reference)
- `open-source/MySATPrep/src/lib/practiceStatistics.ts` — stats shape (reference)
- `open-source/MySATPrep/src/types/session.ts` — session state machine (reference)
- `open-source/MySATPrep/src/static-data/cleaned_sat_vocabulary.json` — vocab data (copy)
