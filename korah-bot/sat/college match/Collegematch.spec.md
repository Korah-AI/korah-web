# College Match — Build Spec (Issue #44)

Spec for the College Match section: safety / match / reach buckets for schools based on a student's SAT score compared against a school's 25th/50th/75th SAT percentiles crossed with its admit rate. 

---

## 1 · Scope

### In scope (this issue)

| Piece | Description |
|---|---|
| **Classification function** | `classify(score, school)` — one pure function, thresholds in a config object, no DOM/fetch/Firestore. Outputs label + reason |
| **API route** | `GET /api/college/c` serving ~25 hand-entered schools in the final response shape (real numbers, not random) |
| **Page** | `index.html` — slider, tick mark, live-refilling Safety/Match/Reach columns, band bars on cards, expandable details, filters |
| **Profile wiring** | Load the student's real score from `KorahSATAnalytics.getProfile()` — no new storage |
| **Tips** | Student-level tips computed live in the browser (section scores vs the school's section bands) |
| **Sidebar + route map** | Nav link on the shared sidebar; `README.md` route table row |

### Out of scope (deferred, designed for but not built now)

- **Phase 2:** the `sync-scorecard.js` script, `data/colleges.json`, the real College Scorecard dataset. The route must serve Phase 1 data such that Phase 2 is a **one-line source swap with zero frontend changes** — this is the load-bearing design requirement (§8).
- GPA, essays, activities, major-based matching. Issue body is explicit: *score based matching only.*
- Caching the slider value or anything else to Firestore. Slider value is **never written** (§10).
- Any `/api/r` (AI) call. Tips are generated from data, not by an AI. No AI anywhere in this feature.

---

## 2 · Prerequisites & design decisions (read before coding)

1. **Read `sat/dashboard.html`** — it is the closest layout/styling reference in the repo. Match its visual language (glass cards, stat tiles, spotlights, grey-block coloring) without copying its markup wholesale.
2. **Read `api/sat/s.js` before writing `api/college/c.js`** — it is the pattern to copy: CORS headers, in-memory cache for cold starts, CDN/`s-maxage` cache headers on the response.
3. **Read `sat/js/sat-analytics.js`** before building the page. `getProfile()` returns `{ currentScore, goalScore, mathScore, englishScore, mathGoal, englishGoal, createdAt, updatedAt }`. All score plumbing already exists — do not add a new place to store scores.
4. **Read `UI-UX.md`.** Reuse existing classes (`glass`, `stat-card`, `sat-*`, modal `delete-modal*`, `create-input`, `t-btn`); grep before creating new ones. Colors only via CSS vars; `rem` units; existing keyframes only; no new CDN libraries.
5. **No saved score is fine.** `getProfile()` can return `null`. The page must come up complete regardless (see §11 — same bar as `sat/index.html`, which renders fully on localhost while "the question data simply doesn't fill in").

### Design decision 1 — scoring the combined band

College Scorecard reports section percentiles (`SATVR25/50/75`, `SATMT25/50/75`) and a combined average (`SAT_AVG`), but **no combined 25/50/75 percentile**. The app stores a combined `currentScore` plus optional `mathScore`/`englishScore`. To classify a combined score against a school's band we sum section percentile pairs into a derived combined band:

```
combined.p25 = SATVR25 + SATMT25
combined.p50 = SATVR50 + SATMT50
combined.p75 = SATVR75 + SATMT75
```

This is an approximation (the same one every "chance me" tool ships) and it skews the outer edges slightly because the two section distributions aren't independent. It's tolerable because:
- classification only compares `score >= threshold` for four coarse buckets (directional, never a prediction), and
- the persistent disclaimer + data-year stamp (§12) own the honesty requirement.

The derived combined band is **computed once by the data producer** (the sync script in Phase 2, hand-entered in Phase 1) and stored on the record — not derived on the client.

### Design decision 2 — this page succeeds silently without data

The whole UI must be testable locally, like the rest of the site. Firebase isn't reachable and `/api/college/c` 404s on localhost (serverless, deployed only). Expected, not a problem to solve. `college-page.js` therefore embeds the same ~25-school payload the route serves as a `FALLBACK_SCHOOLS` constant, used only when the fetch fails. Develop against that; fetch the route when it's available (§11).

---

## 3 · The classification model (verbatim from the issue — this is the contract)

Percentiles alone are not enough: a 1580 clears Harvard's 75th and Harvard is still not a safety (admit rate ≈ 3%). Classify on **two axes: score band crossed with admit rate tier.**

|  | admit > 50% | 20% to 50% | admit < 20% |
|---|---|---|---|
| **at or above 75th** | Safety | Match | Reach |
| **50th to 75th** | Safety | Match | Reach |
| **25th to 50th** | Match | Reach | Reach |
| **below 25th** | Reach | Reach | Reach |

Produces the issue's intuitions exactly:
- **1490 → Penn State:** above their 75th, ~55% admit → **Safety**.
- **1490 → Georgetown:** near their 50th, ~12% admit → **Match leaning Reach** (medium tier × 50th–75th band → Reach per the strict table; call it what the table says — see reason text for the leaning).
- **1490 → Harvard:** below their 25th, ~3% admit → **hard Reach**.

Two hard rules that cannot be coded as exceptions, only as the matrix above:
- **Nothing under ~20% admit rate is ever labeled Safety, no matter the score.** The `low` tier row is all `reach` — don't add a carve-out.
- Every label is **directional, not a prediction**; the page carries a persistent line saying labels are based on test scores and admit rate only (§12).

**Missing SAT data is its own label.** Test-optional admissions since 2021 broke a lot of this data. A school with no reported percentiles is `no-data`, never faked, never guessed at (§7).

---

## 4 · Data model & API response shape

### Response shape (`GET /api/college/c`)

```js
{
  success: true,
  message: "Colleges fetched successfully",
  data: {
    dataYear: 2024,                       // Scorecard data vintage; Scorecard lags ~2 years. Stamped visibly on the page.
    schools: [
      {
        id: "harvard-university",
        name: "Harvard University",
        city: "Cambridge",
        state: "MA",
        public: false,                    // true = public
        size: 23000,                      // undergraduate enrollment, raw int
        admitRate: 0.033,                 // ADM_RATE, 0.0–1.0
        sat: {                            // null when school reports no SAT percentiles → no-data card state
          avg: 1520,                      // SAT_AVG
          combined: { p25: 1480, p50: 1520, p75: 1580 },     // derived: careful, NOT from Scorecard directly — see §2
          math: { p25: 750, p50: 790, p75: 800 },            // SATMT25 / SATMT50 / SATMT75
          erw:  { p25: 730, p50: 750, p75: 780 }             // SATVR25 / SATVR50 / SATVR75
        },
        tips: [                           // school-level tips, computed at sync time (hand-derived in Phase 1)
          { kind: "math-heavy", text: "Harvard's admitted students skew math heavy..." }
        ]
      }
    ]
  }
}
```

Key shape rules:
- `sat: null` is the *only* sanctioned representation of "no SAT data." Do not emit zeros, `null` section objects, or strings.
- `combined` is always present when `sat` is present (producer-derived).
- `tips` is a **store-and-display field** — computed by the sync script (Phase 2) / author (Phase 1), never computed or edited client-side.
- The client reads only: `schools[]` fields above, `dataYear`, `success`. **The client must not know or care whether the route is backed by 25 hardcoded schools or 2,000 synced ones.**

### Phase 1 placeholder set (the ~25 schools)

Hardcoded in `api/college/c.js`, hand-entered with **real, looked-up numbers** (from College Scorecard / Common Data Sets), deliberately spanning range and edge cases:

- A few Ivies / ultra-selective (Harvard, MIT, Yale, Princeton, Stanford, Columbia).
- A few mid-selectivity privates (Georgetown, NYU, Boston University, Northeastern, Tufts, USC).
- A few large state schools (Penn State, Ohio State, UT Austin, Michigan State, Rutgers, UConn, SUNY Stony Brook).
- **At least 2–3 with `sat: null`** (e.g. a test-optional school that reports no SAT percentiles) so the no-data card state is exercised from day one.
- Real admit rates + real percentile bands; sanity-check the columns against the matrix while entering.

---

## 5 · File layout

Folder lives under `sat/` (repo convention for SAT content). New folder `sat/college match/`:

```
sat/college match/
├── Collegematch.spec.md            # this spec
├── index.html                      # the page
├── college.css                     # page-specific styles; core patterns come from sat.css / korah-chat.css
├── js/
│   ├── college-match.js            # PURE classification + tip generators (window.CollegeMatch). Reviewed hardest.
│   └── college-page.js             # rendering, slider, filters, profile + route wiring (window.collegePage / Alpine)
├── data/colleges.json              # Phase 2 — synced dataset. Does not exist yet ($8)
└── scripts/sync-scorecard.js       # Phase 2 — run by hand, not scheduled ($8)
```

Route (under `korah-bot/api/`, same level as `api/sat/`):

```
api/college/c.js                    # GET route; Phase 1 hardcoded, Phase 2 reads colleges.json
```

Touched files:
- `sidebar.html` — one nav link (§13).
- `README.md` — add a row to the API Route Map table (§14).

Page boilerplate copies `sat/rush.html`'s head exactly: page-transitions pair, theme bootstrap, fonts, Material Icons, Alpine defer, `sidebar-loader.js` defer, Tailwind CDN, `../app/korah-chat.css` (results in `../app/korah-chat.css` since the page is one level deeper than `rush.html`), then `../sat.css`, then `./college.css`. Body uses `sidebar-root` injection + `<main id="main-content" class="main-content">` + `chat-topbar` header. Navigation between pages only via `KorahTransitions.go()`. Firebase bootstrap mirrors `rush.html`'s module block, with `initSatAnalytics(app, uid)` initialized so `KorahSATAnalytics.getProfile()` is available.

> **Naming note:** the folder currently contains a space (`college match`). Any URL that references it (sidebar `href`, anchor paths) must be percent-encoded (`/sat/college%20match/index.html`). This is awkward and error-prone; see §16 (Open Questions #1) for the recommendation to drop the space.

---

## 6 · `college-match.js` — the pure function (reviewed hardest)

Plain script (not a module), attaches `window.CollegeMatch`. **No DOM, no fetch, no Firestore, no Alpine.** Must be callable with fake numbers to check every cell of the matrix table.

### Config object at the top

```js
const MATCH_CONFIG = {
  ADMIT_TIERS: [
    { tier: "high",    minRate: 0.5 },   // > 50%
    { tier: "medium",  minRate: 0.2 },   // > 20%, ≤ 50%
    { tier: "low",     minRate: 0    },  // ≤ 20%
  ],
  SCORE_BANDS: [
    { band: "above75",  atOrAbove: 75 },
    { band: "50to75",   atOrAbove: 50 },
    { band: "25to50",   atOrAbove: 25 },
    { band: "below25",  atOrAbove: 0  },
  ],
  LABEL_MATRIX: {
    high:   { above75: "safety", "50to75": "safety", "25to50": "match", below25: "reach" },
    medium: { above75: "match",  "50to75": "match",  "25to50": "reach", below25: "reach" },
    low:    { above75: "reach",  "50to75": "reach",  "25to50": "reach", below25: "reach" },
  },
  NO_DATA_LABEL: "no-data",
};
```

### `classify(score, school)` → `{ label, tier, band, reason }`

```js
function classify(score, school) {
  // 1. sat: null (or missing any of the 6 section percentiles) → no-data, no guess.
  // 2. band: score relative to school.sat.combined {p25,p50,p75}
  //      score >= p75 → above75; score >= p50 → 50to75; score >= p25 → 25to50; else below25.
  // 3. tier: admitRate > 0.5 → high; > 0.2 → medium; else low.
  // 4. label = LABEL_MATRIX[tier][band]
  // 5. reason: 2 short sentences — score position vs the school's band + admit rate tier.
  //    e.g. "Your 1490 is above Penn State's 75th percentile (1370) and their admit rate is 55% — a safety."
}
```

Boundary behavior to lock in with a test: band thresholds are inclusive (`score >= p75` is `above75`); tier thresholds exclusive with `low` at `<= 0.2` (`admitRate` exactly `0.2` → `low` → Reach, which is the conservative read of "nothing under roughly 20%"). `score` is clamped to 400–1600 before comparison; a school record with a malformed/partial `sat` object short-circuits to `no-data`. Never throws.

The `reason` string is the answer to "explain why a given school landed in a given column" — it exists so the reviewer can hold the AI (or the developer) accountable for the label.

### Tip generators

**School-level** — read from `school.tips` (stored, not computed here). This file only defines the two rule clauses for the sync script (Phase 2) and for hand-deriving Phase 1 tips:

- `math.p50 - erw.p50 >= 20` → `math-heavy`: "{School's} admitted students skew math heavy. Their math 50th is {MT50} against {VR50} for reading and writing."
- `combined.p75 - combined.p25 <= 40` → `tight-cluster`: "Scores cluster tightly here, so there's not much room below the median."

**Student-level** — computed live in the browser, this is the useful one:

```
studentTip({ mathScore, englishScore }, school) → string[]
```

One string per section the student has a score for, comparing it to that school's same-section band:
- "Your math (720) is below Georgetown's 25th (740), but your reading and writing (770) is above their 75th (760)."
- Below / within / above phrasing drawn from the same `atOrAbove` band thresholds against the *section* bands (not `combined`).
- Returns `[]` when the school is `no-data` or the student has no section scores.

---

## 7 · API route — `api/college/c.js`

Copy the skeleton of `api/sat/s.js` verbatim: `export const config = { maxDuration: 60 }`, CORS headers (GET, OPTIONS), `405` for non-GET, in-memory `cache` with `CACHE_TTL_MS = 6h`, and the three CDN cache headers (`Cache-Control public s-maxage=3600`, `CDN-Cache-Control s-maxage=60`, `Vercel-CDN-Cache-Control s-maxage=3600`).

**Phase 1 payload source** — the hardcoded `COLLEGES` array from §4, wrapped in the response shape. The load-bearing seam is exactly one line, the *only* line that changes when real data lands:

```js
// THE ONLY LINE TO CHANGE IN PHASE 2: point source at the synced JSON instead of the hardcoded list.
const source = COLLEGES;   // → becomes: readCollegeData() (reads ./data/colleges.json, caches in memory)
```

Everything downstream — response shape, cache, headers, error handling — is identical. `readCollegeData()` doesn't exist yet in Phase 1 and must **not** be stubbed as dead code; the swap is a future edit at a marked location, not a knob.

Failure behavior: any internal error → `502` with `{ success: false, error }`, `details` only when `process.env.VERCEL_ENV !== "production"` (same as `s.js`). The route has no async external dependency, so it's effectively never slow — but keep the cache code for when Phase 2 adds a file read.

**The frontend only ever calls this route.** If you find yourself editing `college-page.js` to switch data sources, the boundary was drawn in the wrong place.

---

## 8 · Phase 2 (designed now, not built) — sync + dataset

- `scripts/sync-scorecard.js` — run by hand, not on a schedule. Pulls the ~2,000 four-year colleges from the College Scorecard API once, trims every record to the fields in §4, computes `combined`, computes school-level `tips`, stamps `dataYear` (Scorecard lags ~2 years), writes `data/colleges.json`.
- `data/colleges.json` — the synced dataset; doesn't exist yet, `.gitignore`d as a generated artifact.
- The Scorecard API key is a secret — never in frontend code, never committed.

Phase 2 is **explicitly not required for this issue to close.** Closing criteria in §15 refer only to Phase 1.

---

## 9 · Page layout (`index.html`)

Single Alpine-driven scroll page. Matches the dashboard's glass/grey-blocking visual language. Sections top to bottom:

1. **Topbar** — standard `chat-topbar` boilerplate.
2. **Header** — eyebrow (`sat-eyebrow` style), title "College Match", one-line description in counselor tone ("Estimate how your test score lines up with what each school's admitted class actually shows up with."). Persistent disclaimer line directly under the description (§12). Data year stamp in the header corner ("Based on 2024 College Scorecard data — scores lag about two years.").
3. **Controls row**
   - **Slider** (range input, 400–1600, step 10) + live value badge.
   - **Fixed tick mark** at the student's saved score, on the track the whole time (§10).
   - **"Back to my score"** button — appears only when the slider is modified; one click snaps back.
   - **Filters** — state (dropdown), size (dropdown: small/medium/large), public/private (segmented toggle, quiet states on both). Filters re-render the columns.
4. **Three columns** — Safety, Match, Reach (order left→right, colors `--grn` / `--gold` / `--red`-family tints). Grid that stacks to one column below the standard breakpoint. Column header = label + live count (e.g. "Reach · 4").
5. **Not enough data list** — a collapsed-by-default bottom section for `no-data` schools so they stay visible, filterable, and honest (§9.2).
6. **No-saved-score prompt** — modal reusing the `sat/index.html` onboarding pattern (§9.1), not a blocking overlay: Skip dismisses it.

### 9.1 Score prompt (no saved profile)

If `getProfile()` returns `null` (or lacks a usable `currentScore`/sections), show the score modal — same flow `sat/index.html` uses to call `saveProfile`, extended with section inputs per the dashboard (line 1844 saves `{ englishScore, mathScore }`). Fields: current combined score (400–1600, optional), math score (optional), reading & writing score (optional). Save → `KorahSATAnalytics.saveProfile({ currentScore, mathScore, englishScore })` (this already derives + persists everything — no new storage, no new Firestore writes). Skip → page continues: slider rides on a pleasant default, no tick mark, "back to my score" hidden.

### 9.2 Card anatomy

Each classified school renders as a glass card with:

- **Name** (700 weight), `city, ST` + size chip (e.g. "23,000 students") on a muted line.
- **Label pill** reading the label ("Safety", "Match", "Reach").
- **Admit rate** line ("~3% admit").
- **Band bar — the main visual, not raw numbers.** A horizontal track spanning the school's `combined.p25 → combined.p75` on the 400–1600 scale. Marker sits at the current slider score. When the score is below p25 or above p75 the marker renders **outside the track** (`.is-below` / `.is-above` states) — that absence of a marker *on* the bar is the point. Raw p25/p50/p75 numerals are secondary text, shown on expand.
- expand-on-click (chevron, not a modal) reveals: `math` / `erw` mini band bars with the student's section marker, admit rate, and the `tips` list (school-level) followed by the student-level tip(s).

**`no-data` cards** show name + city/state + admit rate + size, a muted "Not enough data" pill, and *no band bar*. Expand reveals: "This school doesn't report SAT percentiles — test-optional admissions took most schools' score data offline after 2021, so we can't line you up against them yet." Honest, not fake. No marker, no guess.

---

## 10 · The two interactions that carry the feature

### 10.1 Non-destructive slider

The student's recorded score stays visible as a fixed tick mark on the track the entire time the slider is modified, and there's a one-click "back to my score" that snaps to it. The failure mode to design against: student drags to 1550, walks away, comes back, thinks 1550 is their saved score.

- **Never written to Firestore.** `saveProfile` is only called by the score prompt (§9.1), never by the slider.
- **Modified state is visually distinct from resting state.** While `sliderValue !== savedScore` the slider + value badge wear the gold/grey "previewing" treatment (a badge like "Previewing 1550 · back to my 1490"), so a user glancing at the page can't confuse a preview with the record.
- On reload, the slider re-initializes from `getProfile()` — so even the "walked away" case self-heals.

### 10.2 Columns refill live while dragging

Bind the slider to `input`, **not** `change`. On every move, recompute `classify()` for every visible school and re-render the three columns with cards animating between them (existing keyframes, ≤ 0.5s — a short FLIP-style transition or a re-append + `animate` class; keep it simple). Watching Georgetown slide from Reach into Match while dragging 1490 up to 1530 is the entire payoff. If it only updates on mouse release, it's wrong.

Performance: ~25 schools in Phase 1 (2,000 max in Phase 2) is trivially fast for re-classifying the visible set every `input` — no throttling needed beyond a `requestAnimationFrame` guard to avoid redundant renders in one frame.

---

## 11 · Local development behavior (the bar)

Everything must render on localhost, like the rest of the site. `Firebase isn't reachable → getProfile()` returns nothing; `/api/college/c` 404s. That is expected, not a problem to solve. Consequences the page must satisfy:

- **No score, no school list → the page comes up complete:** slider still renders and still drags, columns show an honest empty/demo state, and nothing throws.
- `college-page.js` uses `FALLBACK_SCHOOLS` (the same ~25-school payload as the route) whenever the fetch rejects, so the whole page is developable with the route permanently unavailable. The fallback is a constant in the page script, clearly labeled, used only on fetch failure.

You are **not** expected to make Firebase or the route work locally, and you must **not** try.

---

## 12 · Tone and honesty requirements (non-negotiable)

1. **Persistent line on the page**, above the columns, always visible: labels are based on test scores and admit rate only — they ignore GPA, course rigor, essays, and what a school happens to be looking for that year.
2. **Nothing under ~20% admit rate is ever labeled Safety** — enforced by the matrix (§3), with no exception added elsewhere.
3. **Data year visible** — Scorecard lags about two years; stamp the vintage on the page.
4. **Copy reads like a good counselor, not a rejection letter.** Column headers and empty states stay warm: "Safety — you're comfortably above their range", "Match — you're right in their lane", "Reach — worth a shot, know the odds", "Not enough data — we're not going to guess."
5. **No fake data.** A school with missing SAT data gets the `no-data` state, never a fallback guess.

---

## 13 · Navigation & route map

**Sidebar.** One new link in the shared `sidebar.html`, under the SAT group (next to Dashboard):
```html
<a href="/sat/college%20match/index.html" class="sidebar-nav-link t-btn"><span class="material-icons-round" style="font-size: 1.25rem;">school</span> <span class="nav-text">College Match</span></a>
```
Because every page injects the sidebar via `sidebar-loader.js`, this single edit covers every page automatically. (Note the percent-encoding for the space — see §16 #1.) Active-state highlight comes free from `sidebar-loader.js` path comparison.

**README route map.** Add a row:
`| GET /api/college/c | api/college/c.js | College list (Phase 1 hardcoded → Phase 2 colleges.json) |`
and add `sat/college match/js/college-page.js` to the client-files line.

---

## 14 · Verification plan (manual — repo has no test runner)

Run through both themes × 375 / 768 / 1200px breakpoints. Build the classification function against fake records before wiring the UI.

1. **Truth table:** 12 fake schools (4 score bands × 3 admit tiers, using invented p25/p50/p75) → `classify()` returns exactly the labels in the §3 matrix, every cell.
2. **The three canon examples:** 1490 → Penn State = Safety; 1490 → Georgetown = the table's label (Reach) with reason text showing it's right at the Match lean; 1490 → Harvard = hard Reach. Use the real numbers in the Phase 1 set.
3. **Boundaries:** `score === p75` is `above75`; `admitRate === 0.2` is `low`/Reach; `admitRate === 0.5` is `medium`; `score === p25` is `25to50`. `no-data` school short-circuits, never throws.
4. **No-data honest state:** a `sat: null` school renders a Not-enough-data card with no band bar and no markers; no guess in the DOM.
5. **Slider live refill:** drag Georgetown past 1530 and watch it relocate to Match mid-drag (`input`, not `change`) with the animation; drag back down and it returns to Reach.
6. **Non-destructive:** tick mark pinned at saved score while dragging; "Previewing" treatment visible; "back to my score" snaps the slider; `KorahSATAnalytics.getProfile()` returns the unmodified saved score after all of it.
7. **Walk-away:** reload the page → slider initialized from the saved score, not the last dragged value.
8. **No-profile flow:** cleared profile / first visit → score prompt appears; Save writes via `saveProfile` only; Skip continues with no tick mark and no errors.
9. **Filters:** state / size / public-private slice the column population correctly; columns re-classify on filter change; `no-data` list filters too.
10. **Localhost:** stop the dev server route (or leave it off) → page renders fully from `FALLBACK_SCHOOLS`, columns and slider work, sidebar + transitions fire, no console crash.
11. **Route swap line:** identify the one marked line in `api/college/c.js`; temporarily point it at a file with 2 schools → confirm no frontend change is needed to see 2 schools. (Simulated Phase 2, proves the boundary.)
12. **Bootstrap/regression:** `sat/index.html` and `sat/dashboard.html` still load (no shared-file breakage); sidebar shows College Match active on the new page; page transitions fire (no hard reloads).
13. **Honesty UI:** persistent disclaimer line visible at all three breakpoints; data-year stamp visible; both themes.

---

## 15 · "Done when" (close criteria, from the issue)

- `college/js/college-match.js` (here: `sat/college match/js/college-match.js`) exports a pure function, demonstrable returning the right label for **every cell** of the matrix using made-up school records.
- `api/college/c.js` exists, serves the ~25-school placeholder set in the final response shape, and is listed in the `README.md` route map. Sync script and real dataset are **not** required to close.
- You can point at the one line in the route that changes when real data lands, and nothing in `college/js/` is on that list.
- The page loads the student's real score from `getProfile()` with **no new storage added**.
- Dragging the slider moves cards between columns live; the recorded score is never overwritten.
- Schools with missing SAT data show an honest `no-data` state rather than a guess.
- The page is reachable from the sidebar on every page.
- Checked against the three examples: 1490 → Penn State / Georgetown / Harvard.

---

## 16 · Open questions (answer before/during build)

| # | Question | Default if unanswered |
|---|---|---|
| 1 | Folder name contains a space (`college match/`) → ugly percent-encoded URLs (`/sat/college%20match/index.html`, sidebar href). Rename to `sat/collegematch/` or `sat/college/` **before** first deploy? | **Recommend renaming** to `sat/collegematch/` before the page ships; a space in an app URL is a permanent source of broken links. Update the sidebar href + this spec's paths. |
| 2 | Combined band = `VR + MT` summed per percentile (§2, Design decision 1). Acceptable approximation for directional buckets? | Yes — standard practice, disclaimered on-page. |
| 3 | Strict-table boundary: Georgetown at 1490 is technically "Reach" (medium × 50th–75th). OK that reason text carries the "right at the line" nuance rather than overriding the label? | Yes — labels speak the matrix; reason adds nuance. |
| 4 | No-score default slider value when the prompt is skipped? | 1200 with no tick mark, "Back to my score" hidden. |
| 5 | School-level tips in Phase 1: hand-compute from the real numbers during data entry (matching the output of the Phase 2 rules)? | Yes — keep `tips` populated in the Phase 1 set. |