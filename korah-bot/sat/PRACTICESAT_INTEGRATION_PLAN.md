# PracticeSAT Integration Plan for `korah-bot/sat`

## Summary

Replace the current mock-backed SAT bank/player flow in `korah-bot/sat/` with a Korah-owned proxy integration to the PracticeSAT API documented at:

- `https://3nyn1x0835.apidog.io/practicesat-open-api-1370968m0`
- `https://3nyn1x0835.apidog.io/get-questions-as-list-20236752e0`
- `https://3nyn1x0835.apidog.io/get-question-details-by-questionid-20309220e0`
- `https://3nyn1x0835.apidog.io/data-lookup-20236893e0`

This plan is aligned to the current codebase:

- The SAT bank currently depends on synthetic topic/filter metadata and multi-select state.
- The SAT player currently reads local mock questions from `window.KorahSAT.getMockQuestions()`.
- PracticeSAT does not expose the same frontend contract the current mocks imply.
- PracticeSAT question details include rich HTML/MathML content and at least two relevant question types for v1: `mcq` and `spr`.

The v1 goal is a working live SAT practice flow with:

- section selection
- single-domain selection or all-domains selection
- question limit
- live PracticeSAT-backed sessions through a Korah proxy
- player support for `mcq` and `spr`

## Current Repo Reality

### SAT frontend today

The current SAT experience is still mock-backed:

- `sat-shared.js` owns static section/domain/topic config, mock questions, URL parsing, and mock filtering.
- `sat-bank.js` is tightly coupled to:
  - multi-select
  - topic rows
  - synthetic filters
  - shuffle
  - prior-attempt badges
- `sat-player.js` expects a fully normalized local question shape with:
  - `paragraph`
  - `stem`
  - `options[]`
  - `correctAnswer`
  - `explanation`

### PracticeSAT API reality

The upstream contract differs materially from the current frontend:

- Question list endpoint:
  - `GET https://mysatprep.fun/api/get-questions`
  - documented query params include `domains`, `assessment`, `excludeIds`, `difficulties`, `skillCds`
- Question detail endpoint:
  - `GET https://mysatprep.fun/api/question-by-id/{questionID}`
- Lookup endpoint:
  - `GET https://mysatprep.fun/api/lookup`

The list endpoint returns summary rows with fields such as:

- `questionId`
- `external_id`
- `primary_class_cd`
- `primary_class_cd_desc`
- `skill_cd`
- `skill_desc`
- `difficulty`
- `program`

The detail endpoint returns nested data with:

- `data.question` for metadata
- `data.problem` for renderable content

The detail payload supports at least:

- `mcq`
- `spr`

The detail content is rich HTML/MathML, not plain text, so it must not be rendered with `textContent`.

## Target Architecture

```text
sat/index.html
  -> user selects section/domain/limit
  -> navigates to questions.html?section=<...>&domain=<...>&limit=<...>

sat/questions.html
  -> sat-player.js parses URL
  -> fetches /api/sat/questions
  -> renders live normalized questions

korah-bot/api/sat/questions.js
  -> validates Korah URL params
  -> maps section/domain to PracticeSAT request params
  -> calls /api/get-questions
  -> fetches /api/question-by-id/{questionId} for selected rows
  -> normalizes upstream data into Korah player shape
  -> returns stable JSON payload to the frontend
```

The browser must only call Korah endpoints, not `mysatprep.fun` directly.

## Korah Public Contract

### Frontend URL contract

Bank to player navigation:

```text
./questions.html?section=english&domain=Craft%20and%20Structure&limit=10
```

Supported query params in v1:

- `section`
- `domain`
- `limit`
- `start` optional, only if preserving deep-linking into a loaded session

Removed from active behavior:

- `domains`
- `shuffle`
- `difficulty`
- `scoreBand`
- `timeSpent`
- `marked`
- `solved`
- `incorrect`
- `showPreviousAttempts`

### Proxy endpoint

```text
GET /api/sat/questions?section=english&domain=Craft%20and%20Structure&limit=10
```

Supported request params:

- `section`: required, `english | math`
- `domain`: optional, human-readable domain name or omitted/all
- `limit`: optional integer, default `10`, max `20` in v1

### Proxy response shape

```json
{
  "section": "english",
  "domain": "Craft and Structure",
  "count": 2,
  "questions": [
    {
      "id": "abc123",
      "externalId": "uuid-value",
      "section": "english",
      "domain": "Craft and Structure",
      "skill": "Words in Context",
      "skillCode": "WIC",
      "difficulty": "M",
      "type": "mcq",
      "content": {
        "stemHtml": "<p>...</p>",
        "passageHtml": "<p>...</p>",
        "explanationHtml": "<p>...</p>"
      },
      "options": [
        { "key": "A", "html": "<p>...</p>" },
        { "key": "B", "html": "<p>...</p>" },
        { "key": "C", "html": "<p>...</p>" },
        { "key": "D", "html": "<p>...</p>" }
      ],
      "correctAnswer": "B"
    },
    {
      "id": "def456",
      "externalId": "uuid-value",
      "section": "math",
      "domain": "Algebra",
      "skill": "Linear equations in two variables",
      "skillCode": "H.C.",
      "difficulty": "M",
      "type": "spr",
      "content": {
        "stemHtml": "<p>...</p>",
        "passageHtml": "",
        "explanationHtml": "<p>...</p>"
      },
      "acceptedAnswers": [".1764", ".1765", "3/17"]
    }
  ]
}
```

Notes:

- `content.*Html` is intentionally HTML, not plain text.
- `mcq` and `spr` use different answer payloads.
- `passageHtml` is empty string when no passage/stimulus exists.
- `domain` and `skill` should come from upstream metadata, not be recomputed in the browser.

## Upstream Mapping Rules

### Section to PracticeSAT mapping

PracticeSAT does not accept `section=english|math` directly. Korah must map section to domain codes:

- `english` domains:
  - `Information and Ideas` -> `INI`
  - `Craft and Structure` -> `CAS`
  - `Expression of Ideas` -> `EOI`
  - `Standard English Conventions` -> `SEC`
- `math` domains:
  - `Algebra` -> `H`
  - `Advanced Math` -> `P`
  - `Problem-Solving and Data Analysis` -> `Q`
  - `Geometry and Trigonometry` -> `S`

### Proxy request rules

The proxy must call PracticeSAT list endpoint with:

- `assessment=SAT` always for this SAT product flow
- `domains=<mapped code>` when a single domain is requested
- omit `domains` entirely when the Korah request means all domains in the selected section

“All domains” behavior:

- If `section=english` and no domain is selected, the proxy should fetch all English domain codes: `INI,CAS,EOI,SEC`
- If `section=math` and no domain is selected, the proxy should fetch all Math domain codes: `H,P,Q,S`

Implementation detail:

- The upstream docs show `domains` as the primary filter input, so Korah should pass a comma-separated list for all-domains requests.
- Korah must not forward `domain=any` upstream.

### Question selection

The list endpoint returns summary rows only. The proxy should:

1. fetch the matching list
2. keep only rows that match the requested section/domain scope
3. slice to `limit`
4. fetch question details by `questionId`
5. normalize successful detail responses

If some detail fetches fail:

- do not fail the whole request if at least one question succeeds
- return only successfully normalized questions
- set `count` to the actual returned count

If zero detail fetches succeed:

- return `502` when the upstream clearly failed
- return `200` with `questions: []` when the upstream returned no usable matches

## Normalization Rules

### Shared fields

Map upstream metadata as follows:

- `data.question.questionId` -> `id`
- `data.question.external_id` or `data.problem.externalid` -> `externalId`
- proxy request section -> `section`
- `data.question.primary_class_cd_desc` -> `domain`
- `data.question.primary_class_cd` -> internal domain code, not required in response unless useful for debugging
- `data.question.skill_desc` -> `skill`
- `data.question.skill_cd` -> `skillCode`
- `data.question.difficulty` -> `difficulty`
- `data.problem.type` -> `type`

### Rich content fields

Normalize renderable problem content as HTML strings:

- `data.problem.stem` -> `content.stemHtml`
- any passage/stimulus field when present -> `content.passageHtml`
- `data.problem.rationale` -> `content.explanationHtml`

Do not strip markup in the proxy. The browser needs it for math/content rendering.

### MCQ normalization

For `type === "mcq"`:

- map upstream choice object/array into ordered `options[]`
- preserve answer label keys as `A/B/C/D`
- store option body as `html`
- normalize the correct answer into a single letter key in `correctAnswer`

If a question claims `mcq` but choices cannot be normalized cleanly:

- skip that question in v1

### SPR normalization

For `type === "spr"`:

- omit `options`
- normalize `data.problem.correct_answer` into `acceptedAnswers[]`
- trim values and store them as strings
- player answer checking should be exact string match after light normalization:
  - trim whitespace
  - lowercase not required
  - do not evaluate mathematical equivalence in v1

If `acceptedAnswers[]` is empty:

- skip that question in v1

## Frontend Changes

### 1. `sat/js/sat-shared.js`

Refactor shared state to reflect the real integration:

- remove `mockQuestions`
- remove `getMockQuestions()`
- remove `shuffleArray()` if no longer used anywhere
- keep only:
  - section/domain config
  - domain code map
  - section helpers
  - URL parse/build helpers

Update `parseQuery()`:

- return `section`
- return singular `domain`
- return `limit`
- optionally return `start`
- stop returning `domains[]`
- stop returning `shuffle`

Update `buildQuestionUrl()`:

- only serialize `section`
- only serialize singular `domain` when present
- serialize `limit`
- do not include `shuffle`
- do not include plural `domains`

Recommended exported shape:

```js
window.KorahSAT = {
  SAT_DATA,
  DOMAIN_CODE_MAP,
  getSection,
  getAllDomains,
  parseQuery,
  buildQuestionUrl
};
```

### 2. `sat/js/sat-bank.js`

Reduce the bank UI to match the real backend contract.

Required removals:

- multi-select state
- topic-level selection state
- synthetic filters
- shuffle
- prior-attempt badges
- topic rows

Required kept behavior:

- section selection
- single domain selection
- question limit
- start practice CTA

Required new behavior:

- show only section-level domain cards
- offer an explicit “All domains” action per section
- navigate with only `section`, `domain`, and `limit`

State should become:

```js
const state = {
  section: "",
  domain: "",
  limit: 10
};
```

HTML/copy cleanup is required in `sat/index.html` if removing controls in JS alone would leave dead buttons, misleading labels, or empty filter containers.

### 3. `sat/js/sat-player.js`

Replace mock loading with async API loading.

Required new player states:

- loading
- success
- empty
- error

Required data handling:

- fetch `/api/sat/questions`
- store returned `questions`
- initialize `currentIndex` only after data is loaded

Required render changes:

- render `content.passageHtml`, `content.stemHtml`, and `content.explanationHtml` as HTML
- after injecting HTML, run KaTeX auto-render on the containing element
- keep math rendering delimiter config consistent with the study pages already in this repo

Security/rendering rule:

- sanitize injected HTML before assigning to `innerHTML`
- use a small browser-side sanitizer dependency such as `dompurify`
- do not trust upstream HTML directly

Question-type rendering requirements:

- `mcq`:
  - keep current answer-choice UX
  - render four choices if present
  - compare against `correctAnswer`
- `spr`:
  - render a text input instead of choices
  - store free-form response per question id
  - check answer against `acceptedAnswers[]`
  - explanation panel should show accepted answer text after check

Keep where compatible:

- prev/next navigation
- review marker
- timer
- calculator toggle for math

Remove or update copy that still refers to:

- “future OpenSAT proxy”
- “filters”
- “shuffled”
- unsupported backend behavior

### 4. `sat/questions.html`

Minimal markup changes required:

- add a container for loading/error/empty states if one does not exist cleanly today
- add SPR answer input container or reuse the answer area with conditional rendering
- ensure the player supports HTML content blocks instead of only `<p>` text nodes

### 5. `api/sat/questions.js`

Create a new Vercel serverless endpoint at:

- `korah-bot/api/sat/questions.js`

Implementation requirements:

- support `GET` and `OPTIONS`
- return JSON only
- validate input params
- call upstream with `fetch`
- use `AbortController` timeouts
- limit parallel detail fetches to avoid noisy fan-out

Use runtime assumptions already valid in this repo:

- `korah-bot/package.json` is ESM
- Node 24 is declared
- native `fetch` is available

No extra server dependency is needed for the proxy.

Optional but recommended:

- apply the local rate-limit helper from `api/_lib/rate-limit.js`

## Error Handling

### Proxy responses

- `400` for invalid `section`
- `400` for invalid `domain` for the chosen section
- `400` for invalid `limit`
- `405` for unsupported methods
- `502` for upstream request failure or malformed upstream payload
- `200` with empty list when the upstream returns no matches

Example error payload:

```json
{
  "error": "Invalid domain for section 'english'."
}
```

### Player behavior

- loading: show “Loading questions...”
- empty: show “No PracticeSAT questions matched this selection.”
- error: show retry CTA and concise upstream-safe message

If an error occurs after partial success:

- do not silently mix partial and failed sessions
- only render the final normalized payload returned by the proxy

## Testing Plan

### Proxy

- valid English domain returns normalized `mcq` and/or `spr` questions
- valid Math domain returns normalized questions
- omitted domain returns all domains for the selected section
- invalid section returns `400`
- invalid domain returns `400`
- invalid limit returns `400`
- upstream list failure returns `502`
- malformed detail payload is skipped or fails as designed

### Bank

- only English domains render for English
- only Math domains render for Math
- removed filters are not visible or interactive
- start URL includes only `section`, `domain`, and `limit`
- all-domains selection omits domain or uses the agreed empty-domain representation consistently

### Player

- loading state appears before fetch resolves
- MCQ question renders rich stem/passage/explanation content
- SPR question renders input field instead of choice buttons
- KaTeX auto-render runs after HTML insertion
- answer checking works for MCQ
- answer checking works for SPR exact-match accepted answers
- explanation panel shows safely rendered HTML
- next/previous navigation works across mixed `mcq` and `spr` sessions
- empty response shows no-questions state
- API failure shows error state

### Integration scenarios

- `section=english&domain=Craft and Structure`
- `section=english` with all domains
- `section=math&domain=Algebra`
- `section=math` with all domains
- session containing both `mcq` and `spr`

## Assumptions and Defaults

- v1 supports PracticeSAT-backed `mcq` and `spr` only
- v1 is SAT-only and always sends `assessment=SAT`
- v1 keeps a local section/domain catalog in Korah even though PracticeSAT has a lookup endpoint
- v1 does not implement skill-level filtering
- v1 does not implement mathematical equivalence checking for SPR answers beyond normalized string matching
- v1 sanitizes upstream HTML in the browser before rendering
- v1 uses the Korah proxy as the only browser-visible API boundary

## Out of Scope

- PSAT and PSAT/NMSQT support
- PracticeSAT stats integration
- dynamic domain/skill discovery from `/api/lookup`
- persistent session history or analytics
- previous-attempt metadata
- advanced SPR equivalence parsing
- image-based question rendering beyond what upstream HTML already provides
