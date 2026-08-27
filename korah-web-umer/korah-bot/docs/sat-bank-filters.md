# SAT Question Bank — Filters

The bank page (`sat/index.html`) has a **Filters** toggle that reveals a row of
filter dropdowns. The filters are defined by a single config, `FILTERS`, in
`sat/js/sat-bank.js`. Each entry looks like:

```js
{
  key: "difficulty",        // stable id, used in data-attributes and state
  label: "Difficulty",      // button text
  type: "multi",            // "single" (radio) or "multi" (checkbox)
  functional: true,         // false → rendered but not wired to the query
  options: [ { value, label }, … ],
}
```

For `single` filters, the **first option is the default** (treated as "no
filter applied"). The badge on the Filters button counts how many filters are
non-default.

## What's wired today

| Filter        | Backed by                          | Status |
| ------------- | ---------------------------------- | ------ |
| Question set  | `state.assessment` → `/api/sat/s`, `/api/sat/q` `assessment=` param | ✅ functional |
| Difficulty    | `state.difficulties` → `difficulties=` param | ✅ functional |
| Time Spent    | `timespent=` param → client-side filter in `sat-player.js` | ✅ functional |
| Saved         | `saved=` param → client-side filter in `sat-player.js` | ✅ functional |
| Completed     | `completed=` param → client-side filter in `sat-player.js` | ✅ functional |
| Result        | `result=` param → client-side filter in `sat-player.js` | ✅ functional |

The last four are **per-user, per-question** attributes the stateless
`/api/sat/q` adapter can't see, so they're applied by the **launched session**:
the bank threads the selection into the questions URL (`saved`, `completed`,
`result`, `timespent`), and `sat-player.js` filters the fetched pool against
Firestore analytics (`getBookmarks()` for Saved; `getLatestOutcomes()` — latest
attempt per question — for Completed / Result / Time Spent). When any of these
is active the player asks the adapter for the full pool (no `limit`) and applies
the limit locally after filtering, so the returned count stays correct.

## How to make a placeholder functional

1. **Flip the flag.** Set `functional: true` on the filter in `FILTERS` (removes
   the "Not wired up yet" note).

2. **Read the selection.** It already lives in `state.placeholders[<key>]` (e.g.
   `state.placeholders.saved`). If you prefer a dedicated state field, add one and
   update `selectedValues(key)` so the UI reflects it.

3. **Decide where the filter applies.** These four filters describe *per-question*
   attributes (was it saved / completed, how it was answered, time spent), which
   the bank screen does not enumerate — it only picks sections/domains/skills and
   launches a session. So wiring them means one of:

   - **Filter the launched session.** Add the value to `navigate()`'s `nextState`,
     extend `buildOpenSatV1QuestionUrl`/`parseOpenSatV1Query` in
     `sat/js/sat-shared.js` with a new query param, and honor it in
     `sat/js/sat-player.js` (client-side filter of the fetched `questions`) **or**
     in the `/api/sat/q` adapter (server-side, preferred for `limit` correctness).

   - **Filter the bank view itself.** If you want the topic list to reflect these
     (e.g. "show only topics with saved questions"), compute per-skill counts the
     same way `renderSections()` already does for progress, using the analytics
     data:
     - **Saved** → `window.KorahSATAnalytics.getBookmarks()`
     - **Completed** → per-skill `attempts` (already loaded into `state.skillProgress`)
     - **Result** → per-skill `correct` vs `attempts` (already in `state.skillProgress`)
     - **Time Spent** → not aggregated per skill today; you'd add a
       `timeSpent` rollup to the `satSkills/{skillCd}` doc in
       `sat/js/sat-analytics.js` (`recordAttempt` already receives `timeSpent`).

4. **Reset.** Add any new state fields to `resetFilters()` so "Reset filters"
   clears them.

## The bottom "Randomize" pill

Selecting topics shows a pill with **Randomize** and **Start**. Randomize toggles
`state.random`; `navigate()` passes `random=1`, which `parseOpenSatV1Query` reads
and `sat-player.js` uses to Fisher–Yates shuffle the fetched `questions` before
play. Note this shuffles the **order** of the returned list; if a `limit` is set,
the server applies the limit first, so randomization reorders within that set.
For a random *sample* from the full pool, add sampling to the `/api/sat/q` adapter.
