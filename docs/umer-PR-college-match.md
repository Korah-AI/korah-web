# Umer's Peer Review — College Match

> **Reviewer:** Umer  
> **Feature:** College Match (`korah-bot/sat/college-match/`)  
> **Date:** 2026-09-15  
> **Scope:** UI polish, data fidelity, WIZARD-UI alignment

---

## Overview

The reviewer's overall impression is positive — the design is well-liked and most
critiques target UI implementation details rather than core logic. This document
breaks each comment into actionable analysis with file/line references.

---

## 1. Dropdown Styling (State Filter)

**Reviewer comment:**  
> "The gray-ish purple is odd and the rectangular structure is not that appealing. I
> would also add the states full names just because the acronyms can be slightly
> confusing for some users."

### Current state

- **Dropdown select:** `index.html:211` — a native `<select>` with class `cm-select`
- **Styling:** `college.css:221-234` — `cm-select` uses `appearance: auto`, so the
  browser renders a native OS dropdown. The purple tint comes from the inherited
  `--sf2` / `--bd` variables which sit in the purple-tinted app token space.

### Analysis

The reviewer is right on two fronts:

1. **Color:** `--sf2` and `--bd` are purple-tinted and translucent (see
   `WIZARD-UI-PATTERNS.md` §1). The wizard pattern says resting surfaces should use
   neutral greys scoped to the wizard scope. The dropdown currently inherits the app
   tokens directly, which gives it that grey-purple cast.

2. **State acronyms:** The state dropdown at `index.html:213-215` iterates over
   `states` (derived from school data). The school records in `college-page.js:19-61`
   store two-letter abbreviations (`"MA"`, `"CT"`, etc.). There is no mapping to
   full names anywhere in the codebase.

### Recommended fix

- **Color:** Scope `cm-select` under a local neutral-grey override (or add a
  `.cm-controls` grey scope matching the pattern in `WIZARD-UI-PATTERNS.md` §1).
  Replace the purple-tinted `--sf2`/`--bd` with `--cm-sf: #26262e` / `--cm-bd: #454553`.

- **Full names:** Add a `STATE_NAMES` map in `college-page.js` (or inline in the
  template) that maps `"MA"` → `"Massachusetts"`, etc. Display full names in the
  option text while keeping the two-letter value for filtering:

  ```html
  <option :value="s" x-text="STATE_NAMES[s] || s"></option>
  ```

- **Native select note:** `WIZARD-UI-PATTERNS.md` §Popups says "no native `<select>`"
  — but that rule targets wizard step pickers. For a filter sidebar, a native select is
  acceptable. If consistency with the wizard pattern is desired, replace with a custom
  tile-set toggle (like the Type filter already does).

---

## 2. Filter Tab Spacing

**Reviewer comment:**  
> "The small selector box on the bottom right also does not have all the tabs equally
> spaced out so I would also fix that later."

### Current state

The Type toggle at `index.html:229-236` uses `cm-type-toggle` (`college.css:235-247`):

```css
.cm-type-toggle { display: inline-flex; gap: 0.25rem; padding: 0.25rem; border-radius: 0.75rem; background: var(--cu); }
```

Each `.t-btn` inside it has `padding: 0.4375rem 0.75rem` — equal horizontal padding.
The buttons are inline-flex children, so they grow with their text content.

### Analysis

The three buttons ("All", "Public", "Private") have different text widths. Because
the container is `inline-flex` and buttons are not equal-width, they appear unevenly
spaced. The visual weight shifts because "All" is narrower than "Public" or "Private".

### Recommended fix

Force equal width on `.cm-type-toggle .t-btn`:

```css
.cm-type-toggle .t-btn { flex: 1; text-align: center; }
```

Or set a fixed `min-width` on the toggle container to keep the three buttons visually
even.

---

## 3. SAT Score Slider / 75th Percentile Marker Overflow

**Reviewer comment:**  
> "When the slider for the SAT score is above the 75th percentile for the school the
> dot slider for the school jumps off the slider. There might be a better solution for
> this since it cuts into the 75th percentile number. If the SAT score the user puts
> on the main slider is higher than the 75th percentile score for the school, then I
> would highlight or make the entire slider glow for that school and I would remove
> the dot. This shows that the target score is beyond reached."

### Current state

- **Band marker positioning:** `college-page.js:203-208` — `markPct()` returns
  `{ pct: 100, pos: "above" }` when `score > p75`.
- **CSS for above:** `college.css:337` — `.cm-band-marker.is-above { transform: translate(70%, -50%); }`
  This shifts the dot 70% of its own width to the right, making it sit partially off
  the track end and into the `p75` label area.
- **Hint text:** `index.html:286-288` shows "Above their 75th — the marker sits off
  the track." as plain text.

### Analysis

The overflow is intentional (the marker "sits off the track" to show above-range),
but the reviewer is right that it's visually messy — the dot collides with the p75
number and the visual metaphor is confusing.

The reviewer's suggestion is elegant: when the score exceeds the 75th percentile,
**hide the dot and glow the entire track instead**. This communicates "beyond
threshold" more clearly than a floating dot.

### Recommended fix

1. **Hide the dot** when `pos === "above"`:

   ```html
   <span class="cm-band-marker"
     x-show="markPct(score, item.school.sat.combined).pos !== 'above'"
     :class="'is-' + markPct(score, item.school.sat.combined).pos"
     :style="'left:' + markPct(score, item.school.sat.combined).pct + '%'"
   ></span>
   ```

2. **Glow the track** when above:

   ```css
   .cm-band-track.is-above {
     background: linear-gradient(90deg, var(--grn), color-mix(in srgb, var(--grn) 40%, transparent));
     box-shadow: 0 0 0.75rem color-mix(in srgb, var(--grn) 50%, transparent);
   }
   ```

3. **Update the hint text** to match: "Above their 75th — you're beyond their range."

4. The same fix applies to `pos === "below"` — hide the dot below the 25th and
   optionally grey out the track, though the reviewer didn't flag this case.

---

## 4. AI-Generated Text

**Reviewer comment:**  
> "The text in some places is obviously AI generated and looks slightly artificial."

### Current state

The most visible AI-sounding copy lives in:

- **Hero subtitle:** `index.html:159-162` — "See how your SAT score lines up with
  what each school's admitted class actually shows up with — and try other scores
  without touching your saved one."
- **Disclaimer:** `index.html:163-166` — "These buckets are based on test scores and
  admission rate only. They ignore GPA, course rigor, essays, and what a school
  happens to be looking for that year — treat them as a starting point, not a prediction."
- **Column descriptions:** `index.html:250` "You're comfortably above their range.",
  `index.html:369` "Right in their lane.", `index.html:487` "Worth a shot — know the odds."
- **Classifier reason strings:** `college-match.js:136-137` — "Your {score} is {band}
  for {school}. {admit info}. That makes it a {label} for you."

### Analysis

The column descriptions ("Right in their lane", "Worth a shot — know the odds") are
conversational and read naturally. The hero subtitle and disclaimer are slightly
wordy. The classifier reason strings in `college-match.js` follow a formulaic
`Your X is Y for Z. That makes it a W for you.` pattern that reads as template-
generated copy (because it is).

### Recommended fix

- **Hero:** Tighten to: "Line your SAT score up against each school's admitted
  class — and preview other scores without changing your saved one."
- **Disclaimer:** Fine as-is; the casual tone fits.
- **Classifier reasons:** Add more variety — rotate between 2-3 sentence patterns
  per label tier. Or accept the formulaic nature and reframe it as "data-driven
  reasoning" in the UI (e.g., prefix with a small "Why?" label so it reads as an
  explanation, not prose).

---

## 5. Korah Logo Source

**Reviewer comment:**  
> "The korah logo was also generated from the AI bot not taken from the existing
> files."

### Current state

- `index.html:155` — `<img src="../../logo-images/newlogo12.png" class="cm-eyebrow-logo"/>`

### Analysis

The logo path `newlogo12.png` is referenced from `logo-images/`. The reviewer says
this was AI-generated rather than pulled from the existing brand assets. Without
verifying the file itself, the fix is straightforward: replace with the canonical
logo file that other pages use.

### Recommended fix

Check which logo other pages reference (e.g., `sat.css` or the sidebar) and use
that file. Run:

```bash
grep -r "logo" korah-bot/sat/*.html --include="*.html" | grep "img src"
```

Then swap `newlogo12.png` for the established brand asset.

---

## 6. WIZARD-UI.md Alignment

**Reviewer comment:**  
> "Last thing I would change is that you should reference WIZARD-UI.md next time so
> that the cards and side bar are consistent with the most recent UI update."

### Current state

- The WIZARD-UI document lives at `docs/WIZARD-UI-PATTERNS.md`.
- `college.css` does not reference it. The cards use `var(--sf)` and `var(--bd)`
  directly (purple-tinted tokens) instead of scoped neutral greys.

### WIZARD-UI pattern violations found

| Pattern | Violation | Location |
|---------|-----------|----------|
| §1 — Neutral grey resting surfaces | Cards, filters, hero use `--sf`/`--bd` (purple-tinted) | `college.css:53,88,211` |
| §3 — Hover scale (no translate) | Cards use `scale(1.015)` — correct ✓ | `college.css:285` |
| §4 — No dimmed text | `--tx2`/`--tx3` used un-collapsed on grey surfaces | `college.css:68,77,220,269` |
| §5 — Filled buttons | No buttons visible in the current layout (filter is native select) | N/A |
| Popups — No native `<select>` | State and Size filters use `<select>` | `index.html:211,221` |

### Recommended fix

1. Add a scoped grey token set to `.cm-page`:

   ```css
   .cm-page {
     --cm-sf: #26262e;
     --cm-sf2: #31313c;
     --cm-bd: #454553;
   }
   html[data-theme="light"] .cm-page {
     --cm-sf: #eceef2;
     --cm-sf2: #e0e3ea;
     --cm-bd: #c3c8d2;
   }
   ```

2. Point `.cm-hero`, `.cm-score-card`, `.cm-filters`, `.cm-card`, `.cm-nodata`
   backgrounds at `var(--cm-sf)` instead of `var(--sf)`.

3. Collapse `--tx2`/`--tx3` inside `.cm-page` per §4:

   ```css
   .cm-page { --tx2: var(--tx); --tx3: var(--tx); }
   ```

   Then selectively re-dim where contrast is actually needed (e.g., the
   `cm-card-meta` line).

---

## 7. Static vs. Dynamic Data

**Reviewer comment (directed at AI agent):**  
> "If the data pulled about the schools is not dynamic and does not change based on
> real time rankings, I would change it to be that way and not stay static."

### Current state

- **Route data:** `college-page.js:108-128` fetches from `/api/college/c` at runtime.
- **Fallback data:** `college-page.js:30-61` — `FALLBACK_SCHOOLS` is a hardcoded
  array of 25 schools with 2024 data, used only when the API route 404s (i.e.,
  local development).
- **Data year:** Displayed in the hero as `Based on <b x-text="dataYear"></b> data
  from the U.S. Department of Education College Scorecard (it lags about two years).`

### Analysis

The data **is** dynamic in production — it comes from a serverless API route that
pulls from College Scorecard. The fallback is only for local dev. However, College
Scorecard data inherently lags ~2 years (the 2024 cycle). This is not "real-time
rankings" — it's the most recent federal dataset, updated annually.

If the reviewer wants genuinely real-time data (e.g., incorporating new rankings as
they publish), that would require a separate data pipeline beyond College Scorecard
(faculty surveys, magazine rankings, etc.). The current architecture supports
swapping the data source in the API route without touching the frontend.

### Recommendation

- **For now:** Keep the College Scorecard source. The lag is clearly communicated
  in the UI. Consider adding a "Last updated" timestamp from the API response.
- **Future:** If real-time rankings are desired, add a `lastUpdated` field to the
  API response and surface it alongside `dataYear`. The frontend already handles
  this gracefully.

---

## Summary of Priority Fixes

| Priority | Issue | Files | Effort |
|----------|-------|-------|--------|
| High | Dropdown purple color + native select | `college.css:221-234`, `index.html:211-227` | Low |
| High | 75th percentile marker overflow → glow track | `college.css:337`, `college-page.js:203-208`, `index.html:270-292` | Medium |
| Medium | State filter full names | `college-page.js:145-147`, `index.html:213-215` | Low |
| Medium | Type toggle equal spacing | `college.css:235-247` | Low |
| Medium | WIZARD-UI neutral grey alignment | `college.css` (multiple) | Medium |
| Low | AI-generated text polish | `index.html:159-162`, `college-match.js:136-137` | Low |
| Low | Logo source verification | `index.html:155` | Low |
| Info | Dynamic data — already dynamic via API | `college-page.js:108-128` | None |

---

*Note: The reviewer's PDF screenshots could not be incorporated — this model does
not support PDF input. All analysis is based on the codebase and written review
comments.*
