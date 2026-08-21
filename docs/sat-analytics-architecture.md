# SAT User Analytics Architecture

How `sat/dashboard.html` (and every other SAT surface) reads and writes per-user
practice data.

## High-level model

All analytics flow through a single client-side module, `sat/js/sat-analytics.js`.
After Firebase auth completes, the page calls `initSatAnalytics(app, uid)`,
which builds Firestore document references scoped to the signed-in user and
exposes a stable API on `window.KorahSATAnalytics`. Non-module scripts
(`sat-player.js`, the dashboard's inline render scripts, the home page) read
that global and never touch Firestore directly.

```
┌──────────────────┐   recordAttempt        ┌──────────────────────┐
│  sat-player.js   │ ─────────────────────▶ │ window.KorahSAT      │
│  (questions.html)│   recordPracticeTime   │ Analytics (singleton)│
│                  │   saveBookmark         │                      │
└──────────────────┘                        │   ↓ Firestore writes │
                                            │                      │
┌──────────────────┐   getProfile/Totals/   │   ↑ Firestore reads  │
│  dashboard.html  │   suggestSkills/...    │                      │
│  index.html      │ ◀───────────────────── │                      │
└──────────────────┘                        └──────────────────────┘
```

The dashboard is purely a **reader**: it pulls aggregates and renders them.
Writes happen on `questions.html` (via `sat-player.js`) and during onboarding
or goal edits.

## Firestore layout

All paths live under `users/{uid}/` so existing security rules cover them.

| Path                                  | Doc shape                                                                                                              | Purpose                                |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| `users/{uid}/satProfile/main`         | `{ currentScore, goalScore, mathScore, mathGoal, englishScore, englishGoal, createdAt, updatedAt }`                    | Onboarding scores and target           |
| `users/{uid}/satTotals/summary`       | `{ totalXP, level, answered, correct, incorrect, practiceTime, lastActivity }`                                         | All-time counters and XP/level         |
| `users/{uid}/satSkills/{skillCd}`     | `{ skillCd, domain, section, attempts, correct, byDifficulty.{E,M,H}.{attempts,correct}, lastSeen }`                   | Per-skill aggregate (one doc / skill)  |
| `users/{uid}/satAttempts/{auto}`      | `{ questionId, detailKey, type, skillCd, domain, section, difficulty, assessment, correct, xp, ts, timeSpent, ... }`   | Append-only attempt log                |
| `users/{uid}/satBookmarks/{questionId}` | `{ questionId, detailKey, section, domain, skillCd, ts, ... }`                                                       | Saved/“review later” questions         |

Skill aggregates are updated with `FieldValue.increment` and `merge: true`, so
the doc is created lazily on first attempt of a skill.

## Write path: how a single graded question updates everything

When the user clicks **Check Answer** in `sat/js/sat-player.js`, the player
calls `recordAttempt(...)`. The module performs **one Firestore batch with
three writes**:

1. **Attempts log** — `addDoc` style write to `satAttempts` with the full
   attempt record (auto-id).
2. **Skill aggregate** — `set(..., { merge: true })` on `satSkills/{skillCd}`,
   incrementing `attempts`, `correct`, and the difficulty buckets.
3. **Totals** — `set(..., { merge: true })` on `satTotals/summary`,
   incrementing `answered` / `correct` / `incorrect`, recomputing `totalXP`
   (clamped to ≥ 0) and `level = floor(totalXP / 1000)`.

XP rules (`sat-analytics.js`):

- Correct: 10 / 20 / 30 XP for Easy / Medium / Hard.
- Incorrect: half of the correct value, applied as a **negative** delta. Totals
  never drop below zero.

Double-counting is prevented in the player: it checks `state.checked[id]` and
only logs the first time the user clicks "Check Answer" for that question
in the session.

### Practice time (separate path)

Time on a question is tracked even if the user never grades it. `sat-player.js`
keeps a `stopwatchElapsed` counter and calls `recordPracticeTime(seconds)` when
the user navigates away, the stopwatch resets, or `pagehide` fires. That writes
to `satTotals/summary` with `practiceTime: increment(seconds)` only — no skill
or attempt rows.

### Bookmarks

`saveBookmark(questionId, true|false, meta)` either writes
`satBookmarks/{questionId}` with the metadata or deletes it. Toggled from the
"Mark for Review" button in the player.

### Profile / goals

Set in two places:

- **Onboarding modal** (first SAT visit, triggered from `sat/index.html`
  when `getProfile()` returns null).
- **Edit Goal modal** on `dashboard.html` (the pencil/“Edit Goal” button).

Both call `saveProfile({ englishScore, englishGoal, mathScore, mathGoal })`.
The module merges new values with whatever already exists and derives the
combined `currentScore` / `goalScore` totals when both section values are set.

## Read path: what the dashboard does on load

`dashboard.html` waits for `initSatAnalytics` to resolve, then calls
`renderSatDashboard()`. It fires **eight reads in parallel** through
`Promise.all`:

```js
const [profile, totals, suggestions, domains, recent,
       allMissedIds, bookmarks, missedBySection] = await Promise.all([
  a.getProfile(),
  a.getTotals(),
  a.suggestSkills(6),
  a.getDomainBreakdown(),
  a.getRecentAttempts(8),
  a.getMissedQuestionIds(100),
  a.getBookmarks(),
  a.getMissedBySection(50),
]);
```

Each result drives a specific section of the page:

| Dashboard section                | Source method(s)                                                                          |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| Score Progress (R&W + Math bars) | `getProfile()`                                                                            |
| "My SAT Stats" tiles (Answered / Accuracy / XP / Time) | `getTotals()`                                                       |
| Reading / Math summary cards     | `getDomainBreakdown()` filtered by `section`                                              |
| "Practice / Review Missed" CTAs  | `getMissedBySection()` — links to `questions.html?questionIds=...`                        |
| Focus banner (top weakness)      | `suggestSkills(6)[0]`                                                                     |
| Suggestion list                  | `suggestSkills(6)` rendered with rank                                                     |
| Reading / Math skill insights    | `suggestSkills(6)` partitioned by `section`                                               |
| Domain breakdown bars            | `getDomainBreakdown()`                                                                    |
| Saved Questions                  | `getBookmarks()`                                                                          |
| Recent activity                  | `getRecentAttempts(8)`                                                                    |
| "Review N Errors" button         | `getMissedQuestionIds(100)`                                                               |

### How "missed" and "weakness" are derived

- **Missed questions** (`getMissedQuestionIds`, `getMissedBySection`): reads
  the whole `satAttempts` collection ordered by `ts desc` and keeps the
  **latest result per `questionId`**. A question that was wrong then later
  answered correctly is no longer "missed."
- **Weakness ranking** (`suggestSkills`): joins skill aggregates against the
  full catalog in `window.KorahSAT.OPENSAT_CATALOG` (loaded by
  `sat-shared.js`). It scores each skill with
  `weakness = (1 − accuracy) · confidence + 0.3 · (1 − confidence)` where
  `confidence = min(1, attempts / 10)`. Skills with no attempts get a baseline
  `0.4`, boosted by `0.25` when the user's `goalScore − currentScore` gap is
  more than 100 points. Sorted descending, top N returned.

### How "Review" links work

Anywhere the dashboard finds a list of missed question IDs, it builds a
`questions.html?questionIds=id1,id2,...` URL. The player on that page reads
those IDs from the query string and plays exactly that set instead of running
a normal filtered session.

## Which pages use the module

| Page                  | Init? | Role             | Calls used                                                                             |
| --------------------- | ----- | ---------------- | -------------------------------------------------------------------------------------- |
| `index.html` (home)   | yes   | reader           | `getProfile`, `getTotals`, `getMissedQuestionIds`, `getBookmarks`, `suggestSkills`, `getRecentAttempts` — populates "My Stats", "Today's Momentum", weakness card, Score Progress |
| `sat/index.html`      | yes   | reader + writer  | `getProfile` (gate onboarding modal); the modal saves via `saveProfile`                |
| `sat/dashboard.html`  | yes   | reader + writer  | All read methods listed above; `saveProfile` from "Edit Goal" modal                    |
| `sat/questions.html`  | yes   | writer (primary) | Through `sat-player.js`: `recordAttempt`, `recordPracticeTime`, `saveBookmark`         |
| `sat/math-chat.html`  | no    | —                | Does not currently consume the module                                                  |

Every page that calls `initSatAnalytics` does so inside the same
`onAuthStateChanged` handler, after `setupKorahDB(app, uid)`, and before
dispatching `korahReady`. The module fires a one-shot `korahSATAnalyticsReady`
event when it has installed the global; the home page waits on that event
before calling `hydrateStats()` if the global isn't yet present at
`korahReady` time.

## Update cadence

There is **no realtime listener and no client cache**. Every read is a fresh
Firestore `getDoc` / `getDocs` at the time the page renders. To see new data
on the dashboard after practicing, the user must reload the page (or trigger
the same render path some other way). The dashboard exposes `renderSatDashboard`
on `window` so it could be re-run, but nothing on the page currently calls it
on a timer or after a write.

Writes are fire-and-forget from the player's perspective — `recordAttempt` is
called inside the Check-Answer handler with a `.catch` for logging; the UI
does not block on the Firestore round-trip.

## ID conventions

A question carries two identifiers in this codebase:

- `id` (sometimes called `legacyQuestionId`) — the frontend bank's id.
- `detailKey` — the canonical College Board `external_id` used to fetch
  details from `/api/sat/question`.

Attempts and bookmarks store both, and reads normalize via
`resolveStoredQuestionId(entry) = entry.detailKey || entry.questionId`. This
lets older records keep working after the move to CB external IDs without a
backfill. The validator `/^[\w-]{1,64}$/` is applied on every write to keep
malformed IDs out of Firestore paths.

## Adding a new metric — checklist

1. Decide where it lives: aggregate (totals/skill) or row-level (attempt).
2. Add the write in `recordAttempt` (or a new method) — use `increment` for
   counters so concurrent attempts are safe.
3. Add a reader method on the `api` object returned by `initSatAnalytics`.
4. Pull it in `renderSatDashboard()`'s `Promise.all` and render.
5. Update Firestore security rules if the path is new.
