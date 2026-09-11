# Word of the Day Flashcard — Build Spec (Issue #25)

Spec for wiring the home page "Word of the Day" flashcard 


## 1 · Scope

### In scope (this issue)

| Piece | Description |
|---|---|
| **Real data source** | Load words from `cleaned_sat_vocabulary.json` via the existing shared loader `sat/vocab/js/vocab-data.js` — never a new fetch in `index.html` |
| **Rotation** | Deterministic, date-derived rotation so the card changes over time and is stable across refreshes |
| **Field mapping** | JSON `{ word, part_of_speech, definition, example }` → existing `#fc-word`, `#fc-pos`, `#fc-def`, `#fc-ex` |
| **Display hygiene** | Capitalize the word; clean stray spaces before punctuation in `example` |
| **Existing behavior kept** | Card markup, flip animation, Prev/Next stepping, counter — no redesign |

### Out of scope (deferred)

- Interactive "tap the word you've seen" tracking, mastery, or reward logic.
- Any Firestore/KorahDB writes or per-user sync (this is a shared, same-for-everyone card).
- Redesigning the flashcard styling or adding new controls beyond the existing Prev/Next.
- Touching vocab learn/practice pages (#26). Only the loader internals are shared, and only to the extent needed for correctness.

---

## 2 · Current state (baseline, confirm before coding)

Repo is at HEAD (uncommitted experiment reverted).

**`korah-bot/index.html`:**
- Lines 812–833: flashcard markup — `#fc-word`, `#fc-pos`, `#fc-def`, `#fc-ex`, nav row with `← Prev` / counter / `Next →`.
- Lines 1249–1284: hardcoded `const FLASHCARDS = [...]` (6 words) + `fcIdx`, `renderCard()`, `flipCard()`, `nextCard()`, `prevCard()`, and an init `renderCard()` call.
- No `vocab-data.js` script tag is present in `<head>` → must be added.

**`korah-bot/sat/vocab/js/vocab-data.js` (committed version):**
- Fetches `'../../vocab/cleaned_sat_vocabulary.json'` — a **document-relative** path. Correct for pages under `sat/vocab/` (e.g. `practice.html` → `/vocab/...`) but resolved against the page URL, so it silently breaks if the homepage isn't served from exactly the site root. Also has **no** date/rotation method yet (`dailyWord()`/`weeklyWords()` do not exist).
- Exposes `window.VocabData` with `ready()`, `retry()`, `all`, `byWord`, `byPos`, `search()`, `suggestions()`, `samplesOf()`.

**Word shape (from JSON):**
```js
{ word: "abase", part_of_speech: "verb", definition: "to humiliate, degrade",
  example: "After being overthrown and abased, ...", difficulty: "medium",
  categories: ["general"] }
```
`word` is lowercase; `part_of_speech`, `example` may be missing on some entries; `example` may contain `" ...,he"`-style whitespace before punctuation.

---

## 3 · Design decision — rotation approach

 weekly set of 7 (deterministic by ISO-week index).**

### Chosen: weekly set of 7

```
Week N → take 7 consecutive records starting at ((N * 7) mod 988)
```

- **Stable per week, same for everyone.** Derived purely from the week number, so refreshing a page never shuffles the card, and every user sees the identical set (matches the issue's "same for everyone" property for the daily option).
- **Fits the existing UI.** The component already ships Prev/Next and a counter (`1 / 6`). A 7-word set maps those 1:1 (`X / 7`, step forward/back); a single daily word would orphan the Prev/Next buttons the issue explicitly says to keep.
- **Naturally covers the DB.** Consecutive weeks are disjoint and wrap at 988 with stride 7 (gcd(7, 988) = 1), so the whole database cycles through in ~141 weeks (~2.7 years) before repeating.
- **No state.** Unlike "progressive," nothing is written to `localStorage`; the card is a pure function of the calendar. Simpler, and it can't forget/pin a word.

### Rejected alternatives & why

| Approach | Why rejected for this iteration |
|---|---|
| **Daily word** (one word, midnight flip) | Simplest, but the issue calls the weekly set "closest to the current UI" and explicitly asks to keep Prev/Next + counter. Collapsing to one word removes the only interactive loop the card has. Revisit if product wants a tighter daily habit loop. |
| **Progressive** (localStorage, never repeat until exhausted) | Per-user state contradicts "same card for everyone," adds storage/edge-case surface (`localStorage` cleared, quota, multiple tabs), and reshuffles meaningfully on refresh. Better fit for a logged-in, per-user placement later (#26 territory). |

### Two small "gotchas" the issue calls out — handle explicitly

1. **Word changes on refresh = forbidden.** Index must be `Math.floor(Date.now() / 86400000)` (day) → week-derived, never `Math.random()`.
2. **Don't redesign the card.** Keep `flashcard-container`/`flashcard`/`.flipped` structure, the flip transition, the nav row, and the inline `onclick` handlers. Only the data source and two render-time formatting tweaks change.

---

## 4 · Implementation

### 4.1 `sat/vocab/js/vocab-data.js` — shared loader

**a) Make the data URL script-relative** (required for the homepage; harmless for the existing vocab pages).

Replace:
```js
const DATA_URL = '../../vocab/cleaned_sat_vocabulary.json';
```
with:
```js
const script = document.currentScript;
const scriptDir = script && script.src
  ? script.src.slice(0, script.src.lastIndexOf('/') + 1)
  : '';
const DATA_URL = scriptDir + '../../vocab/cleaned_sat_vocabulary.json';
```
This resolves the JSON against the script's own location, so it points at `korah-bot/vocab/...` regardless of which page loaded the script. Regression check: `sat/vocab/learn.html` and `sat/vocab/practice.html` must still load words after this.

**b) Add the rotation method.** One shared method, mirrors the existing `dailyWord()` style:

```js
const WORDS_PER_WEEK = 7;
...
/* weekly set of 7 — same set for everyone, derived from the week number.
   Stable across refreshes; consecutive weeks are disjoint and cycle the
   whole DB (~141 weeks) before wrapping. */
weeklyWords() {
  if (!all.length) return [];
  const day = Math.floor(Date.now() / 86400000);
  const week = Math.floor(day / WORDS_PER_WEEK);
  const start = ((week * WORDS_PER_WEEK) % all.length + all.length) % all.length;
  const set = [];
  for (let i = 0; i < WORDS_PER_WEEK; i++) {
    set.push(all[(start + i) % all.length]);
  }
  return set;
},
```

Do **not** add a `dailyWord()` method unless the daily approach is chosen; avoid shipping dead API.

### 4.2 `korah-bot/index.html` — homepage

**a) Load the shared loader** in `<head>` (with the other scripts, ~line 39). Must be **non-defer**: the inline body script calls `VocabData` synchronously (only `ready()` is async), and deferred scripts run after body inline scripts:
```html
<script src="sat/vocab/js/vocab-data.js"></script>
```

**b) Replace the hardcoded block** (lines 1249–1257) and the state/render code (lines 1264–1284):

```js
// Word of the Day (data + rotation via sat/vocab/js/vocab-data.js)
let fcSet = [];       // this week's 7 words
let fcIdx = 0;
let fcFlipped = false;

function displayWord(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function cleanExample(s) {
  // trim whitespace before ASCII punctuation (JSON has "abased , the deposed" style)
  return s.replace(/\s+([,.;:!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

function renderCard() {
  const c = fcSet[fcIdx];
  const card = document.getElementById('flashcard');
  card.classList.remove('flipped');
  fcFlipped = false;
  if (!c) {
    document.getElementById('fc-word').textContent = '—';
    document.getElementById('fc-counter').textContent = 'New words next week';
    return;
  }
  document.getElementById('fc-word').textContent = displayWord(c.word);
  document.getElementById('fc-pos').textContent = c.part_of_speech || '';
  document.getElementById('fc-def').textContent = c.definition || '';
  document.getElementById('fc-ex').textContent =
    c.example ? '"' + cleanExample(c.example) + '"' : '';
  document.getElementById('fc-counter').textContent = `${fcIdx + 1} / ${fcSet.length}`;
}

function flipCard() {
  fcFlipped = !fcFlipped;
  document.getElementById('flashcard').classList.toggle('flipped', fcFlipped);
}

function nextCard() { fcIdx = (fcIdx + 1) % fcSet.length; renderCard(); }
function prevCard() { fcIdx = (fcIdx - 1 + fcSet.length) % fcSet.length; renderCard(); }

VocabData.ready().then(() => {
  fcSet = VocabData.weeklyWords();
  if (!fcSet.length || VocabData.status === 'error') {
    document.getElementById('fc-word').textContent = 'Word unavailable';
    document.getElementById('fc-counter').textContent = '';
    return;
  }
  fcIdx = 0;
  renderCard();
});
```

Key points:
- `fcIdx`/`renderCard()`/`flipCard()`/`nextCard()`/`prevCard()` keep the same names and signatures as today — the inline `onclick` handlers and counter markup stay untouched.
- The **nav row markup is unchanged** (Prev/counter/Next); only the counter content becomes `X / 7`.
- Everything that touches data runs after `VocabData.ready()` resolves; first paint keeps the current placeholder until the JSON arrives.
- **Empty/short examples** render as empty string (no bare quotes). **Missing `part_of_speech`** renders empty, same tolerance as the vocab practice pages.

---

## 5 · Error handling & degradation

| Case | Behavior |
|---|---|
| JSON fetch fails / non-200 / bad JSON | `status === 'error'`; card shows "Word unavailable", counter cleared; no console crash. `withCredentials`/CORS are non-issues (same-origin static file). |
| Slow load | Placeholder markup (unchanged) until `ready()` resolves. |
| `words` missing/empty | Same "Word unavailable" fallback (loader already throws on empty → `status === 'error'`). |
| Word has no `example` / `part_of_speech` | Render empty; never render `undefined`/bare quotes. |

Simplest-first note: the homepage gets a static fallback message, **not** a retry button — the vocab practice pages own the full error-card-with-retry experience. Do not port it in.

---

## 6 · Verification plan (manual — repo has no test runner)

Run through both themes × 375 / 768 / 1200px breakpoints.

1. Homepage loads → card shows a capitalized word + POS chip, not "Pragmatic".
2. Tap / Reveal → flips to definition + example; `fc-ex` contains no space-before-punctuation (`"abased , the"` → `"abased, the"`).
3. Prev/Next cycles exactly 7 words, wrapping at both ends; counter reads `X / 7`.
4. **Refresh** → same word at the same index position. Verify the set is identical after a hard reload (only 7 unique words visible).
5. **Deterministic**: temporarily `fcIdx = 7` in console and call `nextCard()` → wraps to index 0 (word 1 of the set), no error.
6. **Regression — loader path:** open `sat/vocab/practice.html` and `sat/vocab/learn.html` → word DB still loads (proves script-relative URL didn't break the `sat/vocab` pages).
7. **Failure mode:** temporarily rename `cleaned_sat_vocabulary.json` → homepage shows "Word unavailable", no console errors; restore file.
8. Flip animation unchanged; card area not enlarged/moved; nav row looks identical to before.
9. Counter formatting `1 / 7` … `7 / 7` uses the existing `tabular-nums` `fc-counter` style.
10. If there is a cached/pinned browser tab: reopening after the week boundary advances shows the next set (hard to time; can fake-check by overriding `Date.now` in DevTools before load).

---