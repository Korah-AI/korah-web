# Practice Rush — implementation plan for `korah-bot/sat/`

> **Status: implemented** as a self-contained section (not by extending the
> existing player). Files added: `sat/rush.html`, `sat/js/sat-rush.js`,
> `sat/sat-rush.css`, plus a **Practice Rush** link in `sidebar.html`. It reuses
> the existing `/api/sat/q?limit=none` + `/api/sat/qi` routes and
> `window.KorahSATAnalytics.recordAttempt` for XP/skill stats, and renders a
> MySATPrep-style onboarding wizard → Duolingo answer loop (streak, success
> overlay, confetti) → celebration screen. A standalone page was chosen over
> modifying the 1,800-line player to keep the existing Question Bank flow
> untouched. The plan below is the original design rationale.

How to bring MySATPrep's **Practice Rush** feature into the Korah SAT player.

This doc (1) explains what Practice Rush is and how MySATPrep builds it, (2) maps
it onto the architecture we already have in `sat/`, and (3) gives a phased,
concrete plan. The headline conclusion: **most of Practice Rush already exists in
our player.** What's missing is a thin "rush mode" layer — an endless flow, a
Duolingo-style feedback/streak loop, resumable sessions, and an end-of-run
celebration screen. We should extend `sat-player.js`, not port React.

---

## 1. What Practice Rush is (from MySATPrep)

Reference source: `open-source/MySATPrep/src/`

Practice Rush is an "endless practice" mode. The user picks what to study, then
answers College Board questions one at a time in a gamified, Duolingo-styled
loop that never runs out — new batches load as they approach the end.

**UX flow:**

1. **Onboarding wizard** (`components/practice-onboarding.tsx`) — 4 steps:
   method (Rush vs Full-length) → assessment (SAT/PSAT) → subject (Math / R&W) →
   domains + skills + difficulty, plus two toggles: *Randomize* and *Exclude
   Bluebook*. Emits a `PracticeSelections` object.
2. **Multistep engine** (`components/practice-rush-multistep.tsx`, ~4,300 lines) —
   the whole runtime: fetch, render, answer, feedback, timing, XP, persistence.
3. **Celebration** (`components/celebrating-section/practice-rush-celebration.tsx`)
   — results screen: trophy, total time, accuracy, XP, per-domain chart.

**The runtime loop (the interesting part):**

- Loads questions in **batches of 22**. `/api/get-questions` returns lightweight
  question stubs; each stub is then hydrated individually
  (`fetchQuestionsbyIBN_ExternalId`). Difficulty selection is balanced — it
  distributes the 22 across the chosen difficulties (`fetchAndProcessQuestions`).
- **Endless:** as the user nears the end of a batch, `START_LOADING_NEXT_BATCH` /
  `FINISH_LOADING_NEXT_BATCH` append another 22 (`benchmarkQuestionsLength % 22`
  logic). Practice never "ends" unless the user hits Finish.
- One question at a time: per-question **timer**, answer choices with
  **strikethrough elimination**, **Check Answer**, then a **success feedback
  popup** ("Nicely done!" — 15 rotating congratulatory messages), **confetti**,
  **sounds**, and a running **streak**.
- **XP** per answer (`addXPForCorrectAnswer` / `reduceXPForIncorrectAnswer`),
  accumulated into `sessionXPReceived`.
- **Exit** and **Finish** confirmation modals; **Share** modal (encodes the whole
  selection into a URL); **Notes** and **Reference** popups.
- **Session persistence** to `localStorage` (`types/session.ts`):
  - `currentPracticeSession` — autosaved every 30s, on each answer, on nav, and on
    `beforeunload`.
  - `practiceHistory` — last 20 sessions.
  - Resume via `?session=continue`; **review** a past session read-only via
    `?session=<sessionId>`.
- On Finish → `completeSession()` writes a `COMPLETED` session and renders the
  celebration screen.

**Data model** (`types/session.ts`): `PracticeSelections`, `PracticeSession`
(answers, times, `answeredQuestionDetails`, analytics), `SessionStatus`.

---

## 2. What we already have in `sat/`

Reference: `korah-bot/sat/` — plain IIFE JavaScript, no framework.

| File | Role | MySATPrep equivalent |
|------|------|----------------------|
| `js/sat-shared.js` (`window.KorahSAT`) | Catalog of sections/domains/skills; `parseOpenSatV1Query` / `buildOpenSatV1QuestionUrl` (URL ⇄ selection) | `static-data/domains.ts` + `PracticeSelections` |
| `js/sat-bank.js` | Selection/onboarding page → builds `./questions.html?...` | `practice-onboarding.tsx` |
| `js/sat-player.js` (~1,800 lines) | The player: fetch, render, answer, timer, Desmos, filters | `practice-rush-multistep.tsx` |
| `js/sat-analytics.js` (`window.KorahSATAnalytics`) | XP/level, `recordAttempt`, bookmarks, skill stats, practice time (async/persistent) | `lib/userProfile.ts` + `lib/practiceStatistics.ts` |
| `questions.html` | Player DOM shell | the JSX in the multistep component |

**API routes** (`api/sat/`, see `korah-bot/README.md`):

- `GET /api/sat/q` — question list. Returns **every matching question as a stub**
  (`loaded: false`) with only the first `INITIAL_BATCH` fully detailed. Supports
  `sections, domains, skills, difficulties, assessment, limit` (`limit=none` =
  all), `questionIds`, `random`.
- `GET /api/sat/qi?id=` — single question detail (lazy hydration).
- `GET /api/sat/s` — bank stats.

**What the player already does** (so we don't rebuild it):

- Parses the query, fetches the list, renders stem/choices/feedback/explanation,
  supports SPR + MCQ, Desmos calculator, reference sheet, resize handle.
- Per-question state: `state.answers`, `state.checked`, `state.reviewed`,
  `state.eliminated`, `state.currentIndex` (choice elimination ≈ strikethrough).
- **Stopwatch** with pause/hide; flushes time to analytics (`recordPracticeTime`).
- **Lazy detail loading**: `ensureDetail(index)` + `prefetchAround(index)` — warms
  the next few questions. This already solves "batching" better than MySATPrep's
  22-at-a-time approach.
- Records each answer to persistent analytics (`recordAttempt` → XP, skill stats,
  missed-question tracking, bookmarks).
- Per-question session filters (saved / completed / result / time-spent).

**Key architectural insight:** because `/api/sat/q` ships stubs for *all* matches
up front and the player hydrates lazily, **we get "endless" almost for free** with
`limit=none`. We do **not** need to port MySATPrep's batch-append machinery.

---

## 3. Gap analysis — Practice Rush vs. what we have

| Practice Rush capability | Status in `sat/` | Work needed |
|--------------------------|------------------|-------------|
| Selection wizard | ✅ `sat-bank.js` | Add a "Practice Rush" entry point / mode flag |
| Fetch large/endless question set | ✅ `/api/sat/q?limit=none` + lazy hydrate | None (use `limit=none`) |
| Difficulty-balanced sampling | ⚠️ server samples per section | Optional; acceptable as-is |
| One-at-a-time answer + check + explanation | ✅ `renderQuestion` | None |
| Per-question timer | ✅ stopwatch | Expose per-question elapsed for the session record |
| Choice elimination (strikethrough) | ✅ `state.eliminated` | None |
| XP per answer | ✅ `recordAttempt` (`xpForCorrect/Incorrect`) | None — reuse |
| **Success feedback popup + congratulatory msgs** | ❌ | **Build** (rush mode) |
| **Streak counter** | ❌ | **Build** (rush mode) |
| **Confetti / sounds** | ❌ | **Build** (optional polish) |
| **Endless auto-advance (no "Back to Bank")** | ❌ (last Q → "Back to Bank") | **Build** (rush mode) |
| **Exit / Finish confirmation modals** | ❌ | **Build** |
| **Resumable session (continue)** | ❌ (analytics stores attempts, not a resumable run) | **Build** (localStorage layer) |
| **Review a past session read-only** | ⚠️ partial via `completed`/`result` filters | Optional |
| **Celebration / results screen** | ❌ | **Build** |
| Share session URL | ✅ `buildOpenSatV1QuestionUrl` | None (already URL-encoded) |

So the real deliverables are five: **rush mode flag**, **feedback/streak loop**,
**exit/finish modals**, **session persistence**, **celebration screen**.

---

## 4. Recommended approach

**Extend `sat-player.js` with a "rush mode", gated behind a query flag.** Do not
create a parallel player. The existing render/answer/timer/analytics pipeline is
the hard part and it already works; rush mode is a UX + session-lifecycle layer on
top.

Entry point: `sat-bank.js` adds a Practice Rush button that builds the normal
questions URL plus `&rush=1&limit=none&random=1`. `parseOpenSatV1Query` in
`sat-shared.js` gains a `rush` boolean. `sat-player.js` reads `query.rush` and, when
true, activates the additional behaviors below.

### Query contract

```
./questions.html?sections=math&domains=H,P&skills=any&difficulties=E,M&assessment=SAT&limit=none&random=1&rush=1
```

- `rush=1` — turn on rush mode (feedback popup, streak, endless, celebration).
- `limit=none` — pull the full matching pool (endless feel via lazy hydration).
- Everything else reuses the existing selection params.

---

## 5. Phased plan

### Phase 0 — Plumbing
- `sat-shared.js`: parse `rush` in `parseOpenSatV1Query`; emit it in
  `buildOpenSatV1QuestionUrl`.
  → verify: URL round-trips `rush=1`.
- `sat-bank.js`: add a **Practice Rush** CTA next to the existing Start pill that
  appends `rush=1&limit=none&random=1`.
  → verify: clicking it lands on `questions.html` in rush mode.

### Phase 1 — Feedback + streak loop  *(core UX)*
In `sat-player.js`, in the check-answer path (where `state.checked[current.id]` is
set and `recordAttempt` is called):
- Track `state.streak` (increment on correct, reset to 0 on incorrect).
- When `query.rush` and the answer is correct, show a **success feedback overlay**
  with a rotating message (port the `CONGRATULATORY_MESSAGES` array + the
  "don't show again" localStorage flag `hideSuccessFeedback`). "Continue" advances
  to the next question.
- Optional polish: confetti + sound on correct (a small canvas-confetti helper +
  the `.wav` assets from MySATPrep `public/`).
  → verify: answering correctly in rush mode shows the popup and bumps the streak;
  incorrect resets it; non-rush mode is unchanged.

### Phase 2 — Endless auto-advance
- In `renderQuestion`, when `query.rush` is true, suppress the "Back to Bank"
  relabel on the last question. Instead, keep advancing; since `/api/sat/q?limit=none`
  already returned the full stub list, `goTo(currentIndex+1)` + `ensureDetail`
  covers it.
- If the pool is genuinely exhausted, route to the celebration screen (Phase 4)
  rather than dead-ending.
  → verify: with `limit=none`, Next never turns into "Back to Bank"; prefetch keeps
  the next questions warm.

### Phase 3 — Session lifecycle (exit / finish / resume)
- Add a `sat-session.js` module (or a section of the player) that mirrors
  MySATPrep's `types/session.ts`, adapted to our field names:
  ```js
  // localStorage "korahSATRushCurrent"
  {
    sessionId, timestamp, status,           // "in_progress" | "completed"
    query,                                  // the parsed selection
    currentIndex,
    answers, checked, times,                // times: questionId -> seconds
    answeredIds,
    stats: { answered, correct, xp, streakMax }
  }
  // localStorage "korahSATRushHistory" — last N sessions
  ```
- Autosave on answer, on nav, and on `pagehide` (we already listen for `pagehide`
  to flush practice time — hook in here).
- Add **Exit** and **Finish** confirmation modals (reuse `questions.html`'s modal
  pattern used by `sessionInfoModal`). Exit saves + returns to bank; Finish → mark
  `completed` → celebration.
- Resume: `?rush=1&session=continue` rehydrates `currentIndex`, `answers`,
  `checked`, `times` before first render.
  → verify: reload mid-run and continue where you left off; Finish writes a history
  entry.

### Phase 4 — Celebration screen
- New end state in `questions.html` (a hidden `<section id="rushCelebration">`),
  populated from the completed session's `stats`: questions answered, accuracy,
  total time, XP earned, max streak, and a per-domain breakdown (we already have
  `getDomainBreakdown()` / `getAllSkillStats()` in `sat-analytics.js`).
- Buttons: **Practice again** (new rush URL) and **Back to bank**.
  → verify: Finish shows correct totals matching the session record.

### Phase 5 — Polish (optional)
- Sounds + confetti assets, "Randomize / Exclude Bluebook" parity, review mode for
  history entries, share-link toast.

---

## 6. Reuse map (don't reinvent)

- **XP / levels / skill stats** → `window.KorahSATAnalytics.recordAttempt` already
  returns `{ xp, newXP }`. Accumulate `xp` into the session's `stats.xp`.
- **Timing** → the stopwatch already tracks per-question elapsed
  (`state.stopwatchElapsed`, flushed in `flushPracticeTime`). Capture it into
  `times[questionId]` on nav instead of discarding.
- **Domain breakdown for celebration** → `getDomainBreakdown()`.
- **Selection ⇄ URL** → `KorahSAT.parseOpenSatV1Query` / `buildOpenSatV1QuestionUrl`.
- **Elimination = strikethrough** → `state.eliminated` is already the same concept.

---

## 7. Decisions to confirm before building

1. **Endless strategy** — confirm `limit=none` + lazy hydration is acceptable vs.
   porting MySATPrep's explicit 22-at-a-time append. (Recommendation: use
   `limit=none`; it's simpler and already supported.)
2. **Session store** — a dedicated `korahSATRush*` localStorage layer (proposed)
   vs. extending the analytics store. (Recommendation: separate localStorage; the
   analytics DB is for durable per-question stats, not resumable runs.)
3. **Feedback popup default** — always-on with "don't show again", or off by
   default for speed? MySATPrep ships it on.
4. **Scope of first cut** — minimum shippable is Phases 0–2 + a basic celebration
   (Phase 4). Phase 3 resume can follow.

---

## 8. File-by-file change summary

| File | Change |
|------|--------|
| `sat/js/sat-shared.js` | Parse/emit `rush` in query helpers |
| `sat/js/sat-bank.js` | Practice Rush CTA → `rush=1&limit=none&random=1` |
| `sat/js/sat-player.js` | Rush gate; streak; success popup; endless auto-advance; capture per-question time; exit/finish modals; celebration trigger |
| `sat/js/sat-session.js` *(new)* | localStorage session model, save/load/resume |
| `sat/questions.html` | Success overlay, exit/finish modals, `#rushCelebration` section |
| `sat/sat-player-theme.css` | Styles for overlay/modals/celebration |
| `korah-bot/docs/practice-rush.md` | This doc |

No API changes required — `/api/sat/q` (`limit=none`), `/api/sat/qi`, and
`/api/sat/s` already cover the data needs.
