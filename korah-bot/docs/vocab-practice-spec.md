# Vocab Practice Feature — Build Spec (v1)

Spec for Korah's vocabulary wordbank + practice feature, adapted from the MySATPrep reference outline in `vocab/SETUP.md` to korah-web's vanilla HTML/JS stack.

## 1 · Scope

### In scope (v1)

| Piece | Description |
|---|---|
| **Learn view** | Browse/search the SAT word DB, add/remove words to a personal wordbank |
| **Practice hub** | Mode selector page with gating |
| **Definition Quiz** | Show word → pick correct definition from 4 options |
| **Vocab Quiz** | Show definition → pick correct word from 4 options |

Both quiz modes are pure client-side logic. No AI, no new API routes, no backend writes.

### Out of scope (deferred, not designed here)

Vocabs Match, Fill in the Blank, Define (AI), Form a Sentence (AI) — the other four modes from SETUP.md. Sound effects (no audio assets exist in korah-web; adding them needs asset sourcing first). Firestore sync of wordbank/progress (see §3).

---

## 2 · Prerequisites

1. ✅ **Word source file confirmed.** `cleaned_sat_vocabulary.json` (455 KB, ~988 words) is present at `korah-bot/vocab/cleaned_sat_vocabulary.json`. Shape is `{ "words": [{ word, part_of_speech, definition, example, page, categories, difficulty, syllable_count, word_length }] }`. The build must still fail soft (error state) if fetch returns non-200/bad JSON at runtime — see §6.
2. Read `UI-UX.md` before implementation. Reuse existing classes; grep before creating new ones.

---

## 3 · Data model

`localStorage` is the synchronous read path the Alpine components use, so the getters stay sync. Firestore is the source of truth once the user is signed in: `vocab-sync.js` reconciles the two on sign-in and mirrors every later write. Signed out, the pages still work entirely from `localStorage`.

Firestore layout, all under `users/{uid}/` so the existing security rules apply, mirroring `sat-analytics.js`:

| Path | Shape |
|---|---|
| `users/{uid}/vocabBank/main` | `{ learntVocabs, userSentences, createdAt, updatedAt }` |
| `users/{uid}/vocabWords/{word}` | one `wordPerformance` entry |
| `users/{uid}/vocabAttempts/{auto}` | append-only attempt log |

`attempts[]` cannot live in one document because it grows without bound, which is why the log is its own collection and the per-word aggregates are separate docs.

Sign-in reconciliation is non-destructive: wordbanks are unioned and per word the side with more `totalAttempts` wins. Every write after that replaces the array, so a later removal still propagates. Local sentences win over remote.

Two keys, mirroring SETUP.md §3:

| Key | Shape | Written by |
|---|---|---|
| `korah_vocab_data` | `{ learntVocabs: string[], userSentences: {} }` | Learn view (add/remove); sentence practice on `practice.html` |
| `korah_vocab_performance` | `PracticePerformanceData` (below) | Quiz submissions |

```js
// korah_vocab_performance
{
  attempts: [{
    word, questionType,          // "definition-quiz" | "vocab-quiz"
    isCorrect, userAnswer, correctAnswer,
    timeSpent,                   // ms, Date.now() delta
    timestamp                    // ISO string
  }],
  wordPerformance: {
    [word]: {
      totalAttempts, correctAttempts, incorrectAttempts,
      averageTimeSpent,
      consecutiveCorrect, consecutiveIncorrect,
      strugglingAreas: [],       // e.g. ["definition-quiz"]
      masteryLevel               // derived: "struggling"|"learning"|"proficient"|"mastered"
    }
  },
  overallAccuracy,               // 0..1 roll-up
  strongWords: [], weakWords: []
}
```

Rules:
- Words stored lowercase + trimmed in `learntVocabs`. All lookups normalize the same way (DB words are compared case-insensitively).
- All reads/writes go through `vocab-store.js` helpers with try/catch on `JSON.parse`/`setItem` (quota/private-mode safe). Corrupt JSON → reset that key to its default shape.
- `improvingWords` from the reference is dropped for v1 (unused by these two modes).

Mastery derivation (copied verbatim from SETUP.md §4):

```
accuracy >= 0.9 && consecutiveCorrect >= 3 → mastered
accuracy >= 0.7 && consecutiveCorrect >= 2 → proficient
accuracy >= 0.5                            → learning
else                                       → struggling
```

Recompute `strongWords` (mastery ∈ proficient/mastered) and `weakWords` (struggling) after every write.

---

## 4 · File layout

New folder `korah-bot/vocab/` (SETUP.md already lives there):

```
vocab/
├── cleaned_sat_vocabulary.json     # prerequisite, gitignored
├── learn.html                      # Learn view
├── practice.html                   # Practice hub (mode select → quiz shell)
├── css/
│   └── vocab.css                   # Page-specific styles only; core patterns come from korah-chat.css
└── js/
    ├── vocab-data.js               # Loads + indexes the word JSON (window.VocabData)
    ├── vocab-store.js              # localStorage CRUD + mastery math (window.VocabStore)
    ├── vocab-quiz.js               # Shared quiz engine + Alpine component (window.VocabQuiz)
    └── vocab-sync.js               # Firestore reconcile + write mirror (initVocabSync)
```

Touched files:
- `sidebar.html` — add one nav link: `/vocab/practice.html`, label "Vocab", material icon `menu_book` (place near Study / Question Bank group).

Both pages carry `sat/rush.html`'s Firebase bootstrap verbatim (initializeApp, onAuthStateChanged, `setupKorahDB`, `startAuthGuard`, logout wiring), with `initVocabSync` in the slot `initSatAnalytics` occupies there. Unauthenticated visitors are redirected to `../../landing/index.html`, same as every other signed-in page.

Page boilerplate copies `sat/rush.html`'s head exactly (page-transitions pair, fonts, Alpine defer, sidebar-loader defer, Tailwind CDN, `../app/korah-chat.css`, then `./css/vocab.css`). Body uses `sidebar-root` injection. Navigation between pages only via `KorahTransitions.go()`.

---

## 5 · Routing

| URL | Purpose |
|---|---|
| `/vocab/learn.html` | Add/remove words to wordbank |
| `/vocab/practice.html` | Hub → mode selector → active quiz → results |

Quiz mode is chosen in-page (radio list + Start button, like the reference), not via URL params — one HTML file serves selector and both quizzes, switched by Alpine state.

---

## 6 · `vocab-data.js` — word DB

On init: `fetch('./cleaned_sat_vocabulary.json')` → build module-level structures once, expose as `window.VocabData`:

- `all` — array of raw word objects, deduped by normalized `word` (first occurrence wins)
- `byWord` — Map, normalized word → record
- `byPos` — Map, `part_of_speech` → array of records (for distractor selection)
- `search(query)` — case-insensitive match on word prefix first, then substring, capped at ~50 results

Loading states: pages render skeleton/disabled UI until `ready` resolves; fetch/parse failure → full-page error card with retry button ("Word database unavailable"). No quiz or learn functionality without it.

---

## 7 · Learn view (`learn.html`)

Single scroll page, glass-card layout consistent with study creation pages.

**Sections:**
1. Header: title + live wordbank count pill ("12 saved").
2. Search bar (debounced input, 250ms) wired to `VocabData.search()`.
3. Results list: each row shows `word` (700 weight), `part_of_speech` chip, difficulty dot (green/gold/red ← `--grn/--gold/--red`), truncated definition (`--tx2`), and an Add/Remove toggle button.
4. Empty query → show suggestions: 20 random easy/medium words as discovery cards. Zero search hits → empty state row.

**Behavior:**
- Add → push normalized word to `learntVocabs` (dedupe guard), button flips to "Added ✓" state (`--grn` tint), count pill animates.
- Remove → confirm-free removal from `learntVocabs`. Note: removing a word keeps its `wordPerformance` entry (harmless orphan; re-adding resumes stats).
- Row click (outside button) → expands inline detail: full definition + example sentence. No modal for v1.
- CTA in header when count ≥ 5: "Practice these words →" → `practice.html`.
- If count === 0, practice link renders muted with hint "Add at least 5 words to unlock practice".

**Out:** bulk import/export, tagging, sorting options.

---

## 8 · Practice hub (`practice.html`)

Three Alpine-driven stages on one page: `select` → `quiz` → `results`.

**Gating (before selector renders):**
- `learntVocabs.length === 0` → empty state card, CTA → `learn.html`
- `0 < length < 5` → "Learn at least 5 words to start practicing" gate card with current count
- Else → mode selector

**Mode selector:** two radio-style option cards (glass card, icon + label + description):
1. **Definition Quiz** — "See a word, choose its meaning"
2. **Vocab Quiz** — "See a meaning, choose the word"

Selected card gets `.is-active` treatment (existing selected-tint pattern, `var(--cu)` + `--p4` border). Primary button "Start Practice" → builds session, swaps to quiz stage. Back button in quiz stage topbar returns to selector (with confirm if mid-session answers exist — reuse delete-modal pattern, cancel/confirm).

---

## 9 · Shared quiz engine (`vocab-quiz.js`)

One Alpine component powering both modes; mode is a config flag. Mirrors SETUP.md §4 anatomy.

### Session build (on Start)
- Pool = learned words resolved through `VocabData.byWord` (skip learnt words missing from current DB file).
- Cap session at **10 questions** (const `QUESTIONS_PER_SESSION`); if pool < 10 use whole pool.
- **Adaptive ordering:** bucket pool by current `masteryLevel` → order `notPracticed → struggling → learning → proficient → mastered`, shuffle within bucket (Fisher-Yates), take first N.
- Per question, generate 4 options:
  - Correct answer + 3 distractors drawn from `VocabData.byPos[same part_of_speech]` excluding learned-pool duplicates; fallback to global pool if fewer than 3 candidates; final fallback allows same-POS repeats exclusion relaxed. Distractor definitions are never identical to the correct definition.
  - Shuffle options; record `correctIndex`.
- Store `questionStartTime` per question.

### Question rendering
- **Definition Quiz:** prompt card shows WORD (+ POS chip); options show definitions (clamped to 3 lines, expandable on tap).
- **Vocab Quiz:** prompt card shows DEFINITION; options show words (+ POS chip).
- Options rendered as `sat-answer-item`-style rows (A/B/C/D letter circles, hover accent bar, `.is-selected/.is-correct/.is-incorrect` states — reuse existing classes where possible).

### Submission flow
1. Click option → lock options, mark selected.
2. Compute `timeSpent`; dispatch answer into local session state.
3. Immediate feedback: correct row `.is-correct`, (if wrong) picked row `.is-incorrect` AND correct row revealed `.is-correct`. Feedback panel slides in below with the full definition + example sentence either way (learning moment, matches reference intent).
4. `VocabStore.recordAttempt(word, questionType, isCorrect, timeSpent)` — guarded by an `attemptedWords` Set per session so revisits never double-count (SETUP.md §4 rule).
5. "Next" button advances; last question's button reads "Finish".

### Navigation & restart
- Prev/Next buttons; answered questions keep their selection/feedback when navigated back (state kept in session array).
- Progress bar in topbar (`sat-progress-container/bar` pattern): `(currentIndex+1)/total`.
- Results stage: score ring (X/N, accuracy %), per-question review list (word ↔ your answer vs correct, green/red dots), two CTAs: "Retry missed words" (rebuilds session from only incorrect words; disabled if none) and "Back to modes". Every finished session bumps a restart key forcing regeneration — never replay identical option order.

### Anti-pattern guards
- No double-submit: options locked after pick until Next.
- Timer resets on question change and on Prev-return only if unattempted.

---

## 10 · UI conventions checklist (from UI-UX.md)

- Colors only via CSS vars; themes tested dark + light.
- rem units everywhere (1px borders exempt); typography per named scale (options `base-lg`, prompt `xl/2xl`).
- Animations: existing keyframes only (`fadeUp`, `dropIn`, `checkPop`…), durations ≤ 0.5s for interactive.
- Responsive pass required at 1200px / 768px / 375px before done.
- No new CDN scripts, fonts, or libraries. Tailwind utility classes allowed alongside semantic classes.

---

## 11 · Verification plan (manual — repo has no test runner)

Run through on both themes × all three breakpoints:

1. Fresh profile: `practice.html` shows empty-state CTA → lands correctly on learn.
2. Add 3 words → practice still gated; add 2 more → selector unlocks.
3. Search: exact, partial, misspelled-ish substring, no-results, case-insensitivity ("Abate" finds "abate").
4. Duplicate-add attempt is a no-op (count unchanged).
5. Definition Quiz: 10 questions, adaptive order (new/unpracticed words first — verify via console log of session build), distractors mostly share POS.
6. Answer wrong → feedback panel shows correct definition; performance key updates (`totalAttempts`, `consecutiveIncorrect`, mastery eventually `struggling`).
7. Get 3 consecutive correct at ≥90% → mastery reaches `mastered`; verify weak/strong lists update.
8. Prev navigation preserves selection; revisit-after-attempt does NOT create a second `attempts[]` entry.
9. Restart → new option ordering; "Retry missed words" builds session from only-missed set.
10. Delete `cleaned_sat_vocabulary.json` temporarily → both pages show error card, no console crash; restore.
11. `localStorage.clear()` mid-flow → next page load re-initializes defaults cleanly.
12. Sidebar "Vocab" link highlights active on both pages; transitions fire (no hard reloads).

---

## 12 · Open questions (answer before/during build)

| # | Question | Default if unanswered |
|---|---|---|
| 1 | Session cap of 10 questions OK? | Yes (constant, trivially tunable) |
| 2 | Should removing a word from the wordbank also wipe its performance history? | Keep history (v1 default above) |
| 3 | Where should the sidebar link sit — own item or nested under Study? | Own top-level item |
