# SAT Question Bank Implementation Plan

## Goal

Build a standalone SAT experience inside `korah-web/korah-bot` that uses OpenSAT as the question source and does not depend on the Study Feed model.

Primary user flow:

1. User opens `sat/index.html`.
2. User filters SAT questions by section and topic/domain.
3. User is sent to `sat/questions.html` with URL params describing the selected bank view.
4. `sat/questions.html` loads matching question data dynamically and renders a OnePrep-style player.

## Scope

In scope:

- New `sat/` folder with dedicated pages and scripts.
- Filterable SAT question bank landing page.
- Question player page for browsing and answering SAT questions.
- Optional serverless proxy for OpenSAT requests and normalization.
- URL-driven state between SAT pages.

Out of scope for the first version:

- Study Feed integration.
- Firestore persistence.
- Chat-triggered creation.
- Full attempt analytics backend.
- Adaptive recommendations.

## Proposed File Structure

```text
korah-web/korah-bot/
  sat/
    index.html
    questions.html
    sat.css
    js/
      sat-bank.js
      sat-player.js
      sat-shared.js
  api/
    opensat-questions.js
  sat-implementation-plan.md
```

## Architecture

### Data Source

Use OpenSAT as the upstream SAT bank.

Preferred integration:

- `api/opensat-questions.js` receives Korah-side query params.
- The API route fetches from OpenSAT, normalizes the payload, and returns a client-friendly JSON shape.

Reason to use a proxy instead of browser-direct fetch:

- Avoid CORS uncertainty.
- Keep the client logic simple.
- Support multi-domain selection even if upstream filtering is limited.
- Create one normalization layer for both SAT pages.

### Page 1: `sat/index.html`

Responsibilities:

- Render a standalone SAT bank landing page.
- Fetch available question metadata and counts.
- Show high-level sections:
  - English Reading & Writing
  - Math
- Show domain/topic groupings inside each section.
- Let the user choose:
  - section
  - one or more domains
  - shuffle on/off
  - optional question limit
- Build a query string and navigate to `sat/questions.html`.

Expected URL examples:

```text
/sat/questions.html?section=math&domain=Algebra&shuffle=true
/sat/questions.html?section=english&domains=Craft%20and%20Structure,Expression%20of%20Ideas&limit=20
```

### Page 2: `sat/questions.html`

Responsibilities:

- Parse URL params from the SAT bank page.
- Fetch matching normalized questions through `api/opensat-questions.js`.
- Render a question-player interface.
- Support:
  - next/back navigation
  - answer selection
  - mark for review
  - show explanation
  - question counter
  - optional timer
  - optional calculator panel for math

The player state should stay client-side for v1.

## Query Model

Use URL params as the source of truth for the session.

Recommended params:

- `section=english|math`
- `domain=<single-domain>`
- `domains=<comma-separated-domain-list>`
- `limit=<number>`
- `shuffle=true|false`
- `start=<index>` optional

Rules:

- `domains` takes precedence over `domain` when present.
- `shuffle=true` should randomize client-side after fetch unless the proxy handles it.
- `limit` should be applied after filtering.

## Normalized Question Shape

The SAT player should not render the raw OpenSAT object directly. Normalize server-side or in a shared client utility into:

```json
{
  "id": "70ced8dc",
  "section": "english",
  "domain": "Standard English Conventions",
  "paragraph": "Passage text if present",
  "stem": "Question prompt",
  "options": [
    { "key": "A", "text": "..." },
    { "key": "B", "text": "..." },
    { "key": "C", "text": "..." },
    { "key": "D", "text": "..." }
  ],
  "correctAnswer": "A",
  "explanation": "Choice A is the best answer..."
}
```

Benefits:

- The player gets a stable schema.
- UI code is not coupled to upstream nesting.
- Math and English questions can share one renderer.

## API Route Plan

Create `api/opensat-questions.js`.

Responsibilities:

- Accept query params:
  - `section`
  - `domain`
  - `domains`
  - `limit`
  - `shuffle`
- Fetch upstream OpenSAT questions.
- Normalize them into Korah SAT player format.
- Filter by one or many domains.
- Optionally shuffle.
- Return:

```json
{
  "section": "math",
  "count": 20,
  "questions": []
}
```

Suggested implementation details:

- Use one upstream fetch per section where possible.
- Filter locally for multi-domain support.
- Keep the API stateless.
- Add defensive validation for invalid params.

## UI Plan

### `sat/index.html`

Layout targets:

- Standalone SAT-branded page, not the chat shell.
- Top heading: `Question Bank`.
- Filter controls row.
- Section cards with domain lists and counts.
- Quick CTA for:
  - all topics
  - single domain
  - multi-select topics

Key UI behaviors:

- Clicking a domain should navigate immediately.
- Multi-select mode should allow selecting several domains before continuing.
- Shuffle toggle should persist into the query string.
- Counts should be visible next to sections and domains.

### `sat/questions.html`

Layout targets:

- Split view similar to the screenshot:
  - left pane for tools or calculator
  - right pane for question content
- Top bar with:
  - back button
  - timer
  - utilities
  - current question indicator
- Bottom action row with:
  - explanation toggle
  - check answer
  - next question

Key UI behaviors:

- On math questions, optionally show Desmos calculator panel.
- On English questions, collapse or hide calculator by default.
- Explanation should stay hidden until explicitly opened.
- Correctness feedback should not require a page reload.

## Shared Script Plan

Create `sat/js/sat-shared.js` for reusable helpers:

- query param parsing
- array shuffle
- domain serialization
- question normalization
- text escaping or rendering helpers

Create `sat/js/sat-bank.js` for `sat/index.html`:

- fetch section data
- aggregate counts
- render domain cards
- manage selected filters
- navigate to `questions.html`

Create `sat/js/sat-player.js` for `sat/questions.html`:

- parse params
- fetch questions
- initialize session state
- render current question
- handle navigation and answer actions

## Math Rendering

Some OpenSAT questions may contain math formatting.

Plan:

- Use KaTeX or MathJax on `sat/questions.html`.
- Normalize text content before rendering if needed.
- Only initialize Desmos on math sessions or when the calculator is opened.

## Attempt State for v1

Keep attempt state in memory during the active page session.

Recommended state shape:

```js
{
  currentIndex: 0,
  questions: [],
  responses: {},
  marked: {},
  checked: {},
  startedAt: Date.now(),
  elapsedSeconds: 0
}
```

Optional enhancement after v1:

- Save transient attempt state to `sessionStorage` so refreshes do not reset progress.

## Routing and Navigation

No special Vercel routing changes should be required for static files under `sat/`.

Navigation sources to add later:

- link from main app nav
- link from home/dashboard
- deep links from chat if desired

For v1, it is enough that:

- `/sat/index.html` is directly reachable
- `/sat/questions.html` is directly reachable with params

## Implementation Phases

### Phase 1: Foundation

- Create `sat/` directory and JS subfolder.
- Add `sat/index.html`.
- Add `sat/questions.html`.
- Add `sat/sat.css`.
- Add shared utility file.

### Phase 2: Data Layer

- Create `api/opensat-questions.js`.
- Implement upstream fetch and normalization.
- Support single-domain and multi-domain filtering.
- Add limit and shuffle handling.

### Phase 3: SAT Bank Page

- Build heading and filter controls.
- Render section cards and domain lists with counts.
- Implement multi-select domains.
- Implement query-string navigation to question player.

### Phase 4: Question Player

- Parse query params.
- Load filtered questions.
- Render question stem, passage, and options.
- Implement answer selection.
- Implement correctness check.
- Implement explanation toggle.
- Implement next/back and question counter.

### Phase 5: Tools and Polish

- Add timer UI.
- Add mark-for-review state.
- Add optional Desmos calculator panel for math.
- Improve loading, empty, and error states.
- Tune layout for mobile and desktop.

## Risks and Open Decisions

### Upstream Filtering Limits

OpenSAT appears to support section and domain filtering, but multi-domain flows may require local filtering after a broader fetch.

Decision:

- implement local filtering in the proxy from the start

### CORS

If browser-direct fetch to OpenSAT fails, the proxy becomes mandatory.

Decision:

- prefer the proxy from the start

### Domain Naming

OpenSAT domain names must match the labels shown in the SAT bank UI.

Decision:

- derive labels from upstream data where possible instead of hardcoding everything

### Attempt Persistence

The first version does not need Firestore-backed attempt tracking.

Decision:

- keep attempts local for now

## Acceptance Criteria

The implementation is complete when:

- `/sat/index.html` displays SAT sections and domain/topic counts.
- The user can choose one or many topics and launch a question session.
- `/sat/questions.html` loads the right filtered questions dynamically.
- Questions render without hardcoded content.
- The user can answer, check, review explanation, and move between questions.
- Math sessions can optionally use a calculator panel.
- The flow works independently of the Study Feed.

## Nice-to-Have Follow-Ups

- Save attempt progress in `sessionStorage`.
- Add “resume previous attempt” support.
- Add domain chips on the question player page.
- Add keyboard shortcuts for answer choice and navigation.
- Add lightweight analytics for most-used SAT topics.
- Add a “Generate mixed set” CTA on the bank page.
