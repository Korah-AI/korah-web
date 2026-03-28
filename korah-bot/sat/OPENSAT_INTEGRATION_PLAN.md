# Connect Korah SAT UI to OpenSAT via Korah Proxy

## Summary
Replace the current mock-backed SAT bank/player integration with a contract-accurate OpenSAT flow and remove all UI/filter behavior that is not supported by the current OpenSAT backend.

The target v1 contract is limited to:
- `section`
- `domain`
- `limit`

The Korah SAT experience should therefore support only:
- section selection
- single-domain selection
- question limit
- launch into a live question session sourced from OpenSAT

Use a Korah-owned proxy/adapter endpoint as the integration boundary. Do not fetch `pinesat.com` directly from the browser in v1.

## Key Changes

### 1. Narrow the SAT bank UI to the OpenSAT contract
Update the SAT bank so it only exposes controls that map to OpenSAT today.

Required behavior:
- Keep section selection: `english` or `math`
- Keep single-domain selection only
- Keep question limit input
- Remove or hide:
  - multi-select topics
  - shuffle toggle
  - difficulty filter
  - score band filter
  - time spent filter
  - marked for review filter
  - solved filter
  - answered incorrectly filter
  - show previous attempts toggle
  - any attempt badges or synthetic performance metadata
- Remove any topic rows that are purely frontend-invented and not represented by the backend contract
- Show the domains that OpenSAT actually supports for each section
- Launch practice immediately from a section/domain choice or from a single `Start practice` CTA using the selected section/domain/limit

Data source for the bank in v1:
- Keep the section/domain catalog local in Korah as static config, but restrict it to OpenSAT’s known section/domain names
- Do not store synthetic topic-level metadata in the config

### 2. Introduce a Korah OpenSAT adapter endpoint
Add a Korah backend/proxy endpoint that the SAT frontend calls instead of `https://pinesat.com/api/questions`.

Recommended public interface:
- `GET /api/sat/questions?section=<english|math>&domain=<domain|any>&limit=<n>`

Proxy responsibilities:
- Validate and normalize query params
- Forward to OpenSAT `/api/questions`
- Normalize the OpenSAT response into a Korah player-friendly shape
- Return a stable JSON payload to the frontend

Recommended normalized response shape:

```json
{
  "section": "english",
  "domain": "Craft and Structure",
  "count": 10,
  "questions": [
    {
      "id": "70ced8dc",
      "section": "english",
      "domain": "Craft and Structure",
      "paragraph": "...",
      "stem": "...",
      "options": [
        { "key": "A", "text": "..." },
        { "key": "B", "text": "..." },
        { "key": "C", "text": "..." },
        { "key": "D", "text": "..." }
      ],
      "correctAnswer": "A",
      "explanation": "..."
    }
  ]
}
```

Normalization rules:
- Map OpenSAT `question.question` to `stem`
- Map OpenSAT `question.paragraph` to `paragraph`
- Convert `choices` object into ordered `options`
- Preserve `id`, `domain`, `correct_answer`, and `explanation`
- Inject `section` from the request param, since OpenSAT question objects do not include section inline
- Treat missing paragraph as empty string
- Preserve original domain casing from the OpenSAT payload when present

Error behavior:
- If OpenSAT returns non-200, proxy returns `502` with a small error payload
- If OpenSAT returns malformed JSON, proxy returns `502`
- If params are invalid, proxy returns `400`
- If zero questions are returned, proxy returns `count: 0` and `questions: []`

### 3. Switch the Korah player from mocks to live API data
Update the SAT player so it no longer uses `getMockQuestions`.

Required behavior:
- Parse only `section`, `domain`, and `limit` from the URL for v1
- Fetch the normalized Korah proxy endpoint on load
- Render loading, empty, success, and error states
- Keep existing answer selection, check answer, explanation, next/prev navigation, and calculator visibility behavior where compatible
- Remove any UI text that implies unsupported backend filters or backend session state
- If no questions match, show a clear empty state instead of mock fallback copy

Query/URL rules:
- Use singular `domain` only for v1
- Drop `domains`, `shuffle`, and any unsupported filter params from URL building/parsing
- Bank and player must use the same URL contract

### 4. Clean up the shared SAT client model
Refactor the shared SAT helper layer so it reflects the real integration.

Required changes:
- Remove mock question dependency from the bank/player path
- Keep only shared helpers needed for:
  - section/domain config
  - query parsing
  - question URL building
  - OpenSAT response normalization if done client-side after proxy fetch response
- Remove synthetic topic stats, attempt metadata, and unsupported filter metadata from the shared config

### 5. Acceptance-aligned UI copy and constraints
Update copy throughout the SAT bank/player so the product does not overpromise.

Required copy changes:
- Describe the bank as section/domain-based OpenSAT practice
- Do not mention `previous attempts`, `score bands`, `multi-select topics`, or `backend-ready filters`
- In player empty/error states, refer to OpenSAT connection issues or no matching questions
- Keep branding as Korah, but not Korah-specific analytics/performance features in this v1 flow

## Public Interfaces / Contracts

### Korah frontend URL contract
Bank to player navigation:
- `./questions.html?section=english&domain=Craft%20and%20Structure&limit=10`

Supported query params in v1:
- `section`
- `domain`
- `limit`

### Korah proxy contract
Request:
- `GET /api/sat/questions?section=english&domain=Craft%20and%20Structure&limit=10`

Response:
- normalized JSON payload with `section`, `domain`, `count`, `questions[]`

### Removed from v1 contract
Do not implement or preserve in active behavior:
- `domains`
- `shuffle`
- `difficulty`
- `scoreBand`
- `timeSpent`
- `marked`
- `solved`
- `incorrect`
- `showPreviousAttempts`
- topic-level selection state

## Test Plan

### Bank UI
- English section shows only English domains
- Math section shows only Math domains
- Only one domain can be selected at a time
- Removed controls are no longer visible or interactive
- Changing question limit updates the launch URL
- Start/practice navigation builds a URL with only `section`, `domain`, and `limit`

### Proxy endpoint
- Valid `section/domain/limit` returns normalized questions
- `domain=any` works and returns normalized payload
- Invalid `section` returns `400`
- Non-numeric or out-of-range `limit` returns `400` or clamped value, per implementation choice
- Upstream OpenSAT failure returns `502`
- Empty result returns `questions: []` without crashing

### Player
- Loading state appears before data resolves
- Successful fetch renders question content and options
- Missing paragraph renders safely
- Answer checking still highlights correct/incorrect choices
- Next/previous navigation works across fetched questions
- Empty API response shows a no-questions state
- Proxy/API error shows a recoverable error state

### Integration
- Bank selection -> player fetch -> rendered session works for:
  - `section=english&domain=Information and Ideas`
  - `section=math&domain=Algebra`
  - `domain=any`
- Network inspector confirms browser only calls Korah endpoints, not `pinesat.com` directly

## Assumptions and Defaults
- Use a Korah proxy as the required integration path for v1
- Scope is frontend + Korah adapter only; no OpenSAT upstream changes are required for this plan
- v1 honors only the documented OpenSAT backend contract from the README: `section`, `domain`, `limit`
- `domain=any` remains supported because it exists in the backend contract
- The Korah bank will keep a local section/domain catalog instead of dynamically discovering domains from OpenSAT
- Unsupported filters are removed, not disabled, to avoid implying capability that does not exist
- Existing player-side review/check/explanation interactions remain local-only and are not treated as backend state
