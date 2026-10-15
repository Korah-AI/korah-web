# Implementation Plan: Sidebar Selector + Essay Annotator

## Part 1: Sidebar Tab Selector

### What
Add a horizontal tabbed selector in the sidebar, directly under the "Korah AI" logo header and above the HOME nav section. Four tabs: **SAT**, **ACT**, **AP**, **College Prep**.

### Where it goes
Current sidebar structure (`sidebar.html`):
```
[Korah AI logo]     <-- .sidebar-header
HOME                <-- .sidebar-section-label
  Home
  Ask Korah
  Study
SAT Practice
  Dashboard
  ...
```

After change:
```
[Korah AI logo]     <-- .sidebar-header
[SAT | ACT | AP | College Prep]  <-- NEW selector
HOME                <-- .sidebar-section-label
  Home
  Ask Korah
  Study
SAT Practice         <-- hidden when not SAT tab
  Dashboard
  ...
```

### How it works
- Alpine.js `x-data` on `<html>` manages state. Add `activeTab: 'sat'` to the existing `x-data` block.
- The selector is a 2x2 grid of pill buttons inside the sidebar, after `.sidebar-header` and before `.sidebar-nav`.
- Active tab gets `background: var(--cu)`, border `var(--p4)`, matching existing `.sat-chip.is-active` pattern.
- Clicking a tab sets `activeTab`. The sidebar nav sections show/hide based on the tab:
  - SAT: shows existing SAT Practice nav section (current behavior)
  - ACT/AP: shows "Coming Soon" state in sidebar nav, main content shows placeholder
  - College Prep: shows "Essays" nav link, main content shows Essay Annotator card
- The HOME section (Home, Ask Korah, Study) stays visible for all tabs.
- The selector persists across pages because it lives in `sidebar.html` (loaded on every page).

### Files to change
- `korah-bot/sidebar.html` -- add selector HTML after `.sidebar-header`, add `x-show` on SAT Practice nav section, add College Prep nav link
- `korah-bot/home.html` -- add `activeTab: 'sat'` to Alpine x-data, wrap existing content in `x-show="activeTab === 'sat'"`, add College Prep content section, add ACT/AP placeholders

### Selector HTML pattern (2x2 grid, matches existing `.sat-chip` / `.mode-pill` patterns)
```html
<div class="sidebar-tab-selector">
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'sat' }" @click="activeTab = 'sat'">SAT</button>
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'act' }" @click="activeTab = 'act'">ACT</button>
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'ap' }" @click="activeTab = 'ap'">AP</button>
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'college-prep' }" @click="activeTab = 'college-prep'">College Prep</button>
</div>
```

---

## Part 2: Feature Modules -- File Structure

### New directories under `korah-bot/`

```
korah-bot/
├── college-prep/           Essay Annotator feature
│   ├── index.html          Essay list + New Essay button
│   ├── editor.html         Setup screen + two-column editor/review
│   ├── college-prep.css    Highlights, margin cards, score panel
│   ├── js/
│   │   ├── editor.js       Tiptap setup, decoration plugin, selection handling
│   │   ├── annotations.js  Quote anchoring, card positioning, click-to-focus
│   │   ├── api.js          Prompts, /api/r calls, JSON parsing
│   │   ├── scoring.js      6-dimension rubric, score rendering, deltas
│   │   └── store.js        Firestore reads/writes under users/{uid}/essays
│   └── data/
│       ├── schools.json         School values with weights and sources
│       ├── prompt-archetypes.json  Archetype definitions + value reweighting
│       ├── sample-essay.json    Placeholder essay for local dev
│       └── canned-feedback.json Saved response blob for local dev
│
├── act/                    ACT Practice (coming soon)
│   └── index.html          Coming soon page
│
└── ap/                     AP Practice (coming soon)
    └── index.html          Coming soon page
```

### Coming soon pages (`act/index.html`, `ap/index.html`)
- Full page shell with sidebar, topbar, and Korah layout
- Centered content: Korah logo, "ACT Practice" / "AP Practice" heading, "Coming soon" subtext
- Same pattern as other pages -- renders full UI with sidebar working, just no data

---

## Part 3: Essay Index Page (`college-prep/index.html`)

### What
List of the student's saved essays + "New Essay" button. Modeled on `study/feed.html`.

### Layout
- Topbar: title "Essays", "+ New Essay" button in `.topbar-actions`
- Body: card grid of saved essays (title, type badge, school, last score, date)
- Empty state: illustration + "Write your first essay" CTA
- Each card links to `editor.html?id={essayId}`

### Firestore shape
```
users/{uid}/essays/{essayId} = {
  id, title, type: "personal_statement" | "supplemental",
  school: null | "harvard",  // supplemental only
  prompt: "",                 // supplemental only
  wordLimit: 650,
  content: "",                // ProseMirror JSON or plain text
  focusNote: "",
  scores: { writing, detail, voice, reflection, curiosity, contribution, average },
  previousScores: null,       // for delta display
  annotations: [...],         // saved annotation objects
  createdAt, updatedAt
}
```

### Files
- `college-prep/index.html` -- page shell, sidebar integration, card grid
- `college-prep/js/store.js` -- Firestore CRUD for essays collection

---

## Part 4: Essay Editor Page (`college-prep/editor.html`)

### What
Two-column layout: editor on the left, annotations/scores on the right. Setup screen first, then editor.

### Setup screen (shown first)
Modeled on `study/new.html` wizard:
1. Essay type: Personal Statement or Supplemental
2. If Supplemental: school dropdown (from `schools.json`), paste prompt, set word limit
3. Write/paste essay (large textarea or Tiptap editor)
4. Optional focus note: "Anything specific you want feedback on?"
5. "Analyze" button

### Editor screen (shown after Analyze)
Two-column layout (Google Docs suggestions mode):
- **Left column (flex: 1)**: ProseMirror/Tiptap editor with the essay. Highlights rendered as ProseMirror decorations (colored spans that sit outside the document text).
- **Right column (22rem fixed)**: Score panel at top + annotation cards below. Each card sits at the vertical position matching its highlight.

### Tiptap/ProseMirror setup
- Load from CDN via import map (esm.sh):
  ```html
  <script type="importmap">
  { "imports": { "prosemirror-view": "https://esm.sh/prosemirror-view", ... } }
  </script>
  ```
- Editor created in `college-prep/js/editor.js`
- Annotations are ProseMirror `Decoration`s -- they don't modify document content
- Highlights survive typing because ProseMirror maps decoration positions forward automatically

### Score panel
- Six dimensions: Writing, Detail, Voice, Reflection, Curiosity, Contribution
- Each out of 10, displayed as a number + mini bar
- Average displayed prominently
- Click a dimension -> filter annotations to that dimension only
- Delta display when previous scores exist ("Reflection: 4 -> 6")

### Annotation cards (right margin)
- Each card has: highlighted text quote, comment type badge (Socratic/Diagnostic/Structural), comment text
- Click card -> highlight pulses/focuses
- Click highlight -> card scrolls into view and pulses
- Cards that would overlap get pushed down (not stacked)

### Interaction: feedback on selection
- User selects text in the editor
- "Get feedback on this" button appears near the selection
- Sends just that span (+ surrounding context) to `/api/r`
- Returns 1-2 annotations for that span
- New card appears in the right margin, new highlight appears on the text

---

## Part 5: AI Pipeline (`college-prep/js/api.js`)

### Three calls to `/api/r` (sequential, not parallel)

**1. Annotation pass**
- System prompt: explains the three comment types (Socratic, Diagnostic, Structural)
- Never generates replacement prose
- Response schema: `{ annotations: [{ quotedText, paragraphIndex, commentType, comment }] }`
- The model returns exact quoted text + paragraph index (not character offsets)
- JS-side anchoring: find the quoted string in the paragraph, create highlight

**2. Scoring pass**
- System prompt: scoring rubric with explicit descriptors for 1, 3, 5, 7, 9 on each dimension
- Temperature: 0 (consistent scores)
- Each score must quote the text that justifies it
- Response schema: `{ scores: { writing: {score, evidence}, detail: {score, evidence}, ... } }`
- Word limit factored in (100-word supplemental != 650-word personal statement)

**3. Focus pass** (only if user wrote a focus note)
- Separate call, separate prompt
- Surfaces findings related to the student's specific concern
- Pinned at top of annotation list

### JSON parsing
Reuse `stripCodeFences` + `parseJsonFromResponse` pattern from `study/js/study-api.js` (lines 61-84).

### Canned data for local dev
- `college-prep/data/sample-essay.json`: a real personal statement (~500 words)
- `college-prep/data/canned-feedback.json`: saved response blob shaped exactly like the real API response
- Flag in `college-prep/js/api.js`: when `/api/r` is unavailable (local dev), return canned data

---

## Part 6: Anchoring System (`college-prep/js/annotations.js`)

### Rules
1. Model returns `quotedText` (exact string) + `paragraphIndex`
2. JS finds that string in the paragraph at that index
3. If same phrase appears twice, use occurrence number to disambiguate
4. If match fails, **drop the annotation** (missing is fine, misplaced is not)
5. Dedupe overlapping annotations

### Implementation
- Essay split into paragraphs (by `\n\n` or ProseMirror block nodes)
- For each annotation: `paragraphs[paragraphIndex].indexOf(quotedText)`
- Create ProseMirror `Decoration.inline()` at the found range
- Position a margin card at the same vertical offset

---

## Part 7: Scoring (`college-prep/js/scoring.js`)

### Dimensions
| Dimension | What it measures |
|-----------|-----------------|
| Writing | Clarity, sentence variety, word choice |
| Detail | Specificity, concrete examples, sensory language |
| Voice | Personality, authenticity, distinctive style |
| Reflection | Depth of self-analysis, growth awareness |
| Curiosity | Intellectual engagement, wonder, exploration |
| Contribution | What the student brings to a community |

### Rubric descriptors
Explicit descriptors for scores 1, 3, 5, 7, 9 on each dimension. Stored in the system prompt, not in a data file (the model needs them to score consistently).

### Score display
- Panel at top of right column
- Each dimension: name, score/10, mini progress bar
- Average: large number, color-coded (green >7, yellow 5-7, red <5)
- Click dimension -> filter annotations

### Delta tracking
- On each analysis, save current scores as `previousScores`
- Next analysis: compare and show delta ("Reflection: 4 -> 6" with arrow icon)

---

## Part 8: Supplemental Support

### `college-prep/data/schools.json`
Start with 5 schools: Harvard, MIT, Stanford, Yale, Princeton.
Each has:
```json
{
  "harvard": {
    "name": "Harvard University",
    "values": [
      { "id": "leadership", "weight": 0.9, "source": "Common Data Set, character/personal qualities" },
      { "id": "intellectual-curiosity", "weight": 0.8, "source": "..." }
    ]
  }
}
```

### `college-prep/data/prompt-archetypes.json`
Archetypes: why-us, community, challenge, curiosity, identity, activity.
Each archetype has damping factors for each value dimension.

### Active rubric
school.values filtered and reweighted by archetype. The model gets the active rubric as part of its system prompt for supplemental analysis.

---

## Part 9: Firestore (`college-prep/js/store.js`)

### Pattern
Follow `sat/js/sat-analytics.js` pattern:
```js
export async function initEssayStore(app, uid) {
  const db = getFirestore(app);
  const essaysCol = collection(db, `users/${uid}/essays`);
  // CRUD methods...
  window.KorahEssayStore = api;
}
```

### Methods
- `listEssays()` -- query orderBy updatedAt desc
- `getEssay(id)` -- getDoc
- `saveEssay(id, data)` -- setDoc merge
- `deleteEssay(id)` -- deleteDoc
- `onEssaysChange(cb)` -- onSnapshot realtime

---

## Part 10: Sidebar Integration

### Changes to `korah-bot/sidebar.html`

**1. Add tab selector** after `.sidebar-header`, before `.sidebar-nav`:
```html
<div class="sidebar-tab-selector">
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'sat' }" @click="activeTab = 'sat'">SAT</button>
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'act' }" @click="activeTab = 'act'">ACT</button>
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'ap' }" @click="activeTab = 'ap'">AP</button>
  <button class="sidebar-tab-pill" :class="{ active: activeTab === 'college-prep' }" @click="activeTab = 'college-prep'">College Prep</button>
</div>
```

**2. Wrap SAT Practice nav section** in `x-show`:
```html
<template x-if="activeTab === 'sat'">
  <div>
    <span class="sidebar-section-label">SAT Practice</span>
    <!-- existing SAT nav links -->
  </div>
</template>
```

**3. Add College Prep nav link** (visible when tab is college-prep):
```html
<template x-if="activeTab === 'college-prep'">
  <div>
    <span class="sidebar-section-label">College Prep</span>
    <a href="/college-prep/index.html" class="sidebar-nav-link t-btn">
      <span class="material-icons-round" style="font-size: 1.25rem;">article</span>
      <span class="nav-text">Essays</span>
    </a>
  </div>
</template>
```

**4. ACT/AP nav links** (visible when those tabs are active, link to their own coming soon pages):
```html
<template x-if="activeTab === 'act'">
  <div>
    <span class="sidebar-section-label">ACT Practice</span>
    <a href="/act/index.html" class="sidebar-nav-link t-btn">
      <span class="material-icons-round" style="font-size: 1.25rem;">school</span>
      <span class="nav-text">ACT Practice</span>
    </a>
  </div>
</template>
<template x-if="activeTab === 'ap'">
  <div>
    <span class="sidebar-section-label">AP Practice</span>
    <a href="/ap/index.html" class="sidebar-nav-link t-btn">
      <span class="material-icons-round" style="font-size: 1.25rem;">school</span>
      <span class="nav-text">AP Practice</span>
    </a>
  </div>
</template>
```

---

## Part 11: CSS (`college-prep/college-prep.css`)

### Key patterns (all using existing CSS variables)
- `.essay-shell` -- page container
- `.essay-editor-panel` -- left column (Tiptap)
- `.essay-review-panel` -- right column (scores + cards)
- `.essay-annotation-card` -- individual card in right margin
- `.essay-score-panel` -- score panel at top of right column
- `.essay-score-dim` -- individual score dimension
- `.essay-highlight` -- ProseMirror decoration styling (background color per comment type)
- `.essay-setup-screen` -- initial setup wizard

### Colors per comment type
- Socratic: `var(--p4)` (purple) -- matches existing accent
- Diagnostic: `var(--gold)` (yellow/gold)
- Structural: `var(--grn)` (green)

---

## Execution Order

### Phase 1: Sidebar selector + home content switching
1. Add `activeTab: 'sat'` to Alpine x-data on `home.html` `<html>` tag
2. Add `.sidebar-tab-selector` HTML in `sidebar.html` after `.sidebar-header`
3. Wrap SAT Practice nav section in `x-if="activeTab === 'sat'"`
4. Add College Prep nav link with `x-if="activeTab === 'college-prep'"`
5. Add ACT/AP nav links with `x-if` pointing to their own pages
6. Wrap existing home page content in `x-show="activeTab === 'sat'"`
7. Add College Prep content section on home page (Essay Annotator card)
8. Add ACT/AP coming soon placeholders on home page
9. Style the sidebar tab selector (2x2 grid pill row)
10. Create `act/index.html` coming soon page
11. Create `ap/index.html` coming soon page

### Phase 2: College prep index page
1. Create `college-prep/index.html` with page shell
2. Create `college-prep/js/store.js` with Firestore CRUD
3. Card grid, empty state, New Essay flow

### Phase 3: Editor + Tiptap (no AI yet)
1. Create `college-prep/editor.html` with two-column layout
2. Create `college-prep/js/editor.js` with Tiptap setup from CDN
3. Hardcoded decoration to prove highlighting works
4. Basic margin card positioning

### Phase 4: Annotation pipeline
1. Create `college-prep/js/api.js` with prompts and /api/r calls
2. Create `college-prep/js/annotations.js` with anchoring system
3. Wire annotation pass to editor decorations + margin cards
4. Click-to-focus both ways

### Phase 5: Scoring
1. Create `college-prep/js/scoring.js` with rubric
2. Score panel UI
3. Click-to-filter interaction
4. Delta tracking

### Phase 6: Setup screen + focus pass + selection feedback
1. Setup wizard (essay type, school, prompt, word limit)
2. Focus note pass
3. "Get feedback on this" selection interaction

### Phase 7: Supplementals
1. Create `data/schools.json` (5 schools)
2. Create `data/prompt-archetypes.json`
3. Archetype classification + reweighting
4. Supplemental-specific UI in setup

### Phase 8: Polish
1. Update `docs/umer-web-structure.md` to reflect current app state
2. Responsive breakpoints for sidebar selector
3. Canned data for local dev (sample-essay.json, canned-feedback.json)
4. Test all tabs render correctly on mobile
