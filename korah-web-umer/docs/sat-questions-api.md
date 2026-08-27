# SAT Questions API — `/api/sat/questions`

Vercel serverless handler that fetches SAT questions directly from the **College Board question bank API** and returns them in a normalized shape for the Korah SAT player frontend.

---

## Endpoint

```
GET /api/sat/questions
```

**Max duration:** 60 seconds

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `sections` (or `section`) | string | `"english,math"` | Comma-separated list: `english`, `math`, or both |
| `domains` (or `domain`) | string | `"any"` | Comma-separated domain names (e.g. `Algebra,Advanced Math`) or codes (e.g. `H,P`) or `"any"` |
| `skills` (or `skill`) | string | `"any"` | Comma-separated skill codes (e.g. `H.A.,H.B.`) or `"any"` |
| `difficulties` (or `difficulty`) | string | `"any"` | Comma-separated difficulty codes: `E`, `M`, `H` |
| `limit` | string/number | `null` (no limit) | Max total questions to return. Accepts integers, `"none"`, `"unlimited"`, `"max"` |
| `assessment` | string | `"SAT"` | Assessment type: `SAT`, `PSAT/NMSQT`, or `PSAT` |
| `questionIds` (or `ids`) | string | — | Comma-separated list of specific question IDs to fetch (bypasses all other filters) |

## Response Shape

```json
{
  "sections": ["math"],
  "domains": "any",
  "skills": "any",
  "difficulties": null,
  "batchSize": 20,
  "count": 45,
  "questions": [
    {
      "id": "ac472881",
      "detailKey": "ac472881",
      "section": "math",
      "domain": "Algebra",
      "skillCd": "H.A.",
      "difficulty": "M",
      "paragraph": "<p>...passage/stimulus HTML...</p>",
      "stem": "<p>...HTML/MathML question text...</p>",
      "options": [
        { "key": "A", "text": "<p>...</p>" },
        { "key": "B", "text": "..." }
      ],
      "correctAnswer": "B",
      "explanation": "<p>...HTML rationale...</p>",
      "type": "mcq",
      "loaded": true
    },
    {
      "id": "bd583992",
      "detailKey": "bd583992",
      "section": "math",
      "domain": "Advanced Math",
      "skillCd": "P.C.",
      "difficulty": "H",
      "paragraph": "",
      "stem": "",
      "options": [],
      "correctAnswer": "",
      "explanation": "",
      "type": "mcq",
      "loaded": false
    }
  ]
}
```

**Notes:**
- `stem`, `options[].text`, `paragraph`, and `explanation` contain HTML (including MathML for math questions).
- `type` is `"mcq"` (multiple choice) or `"spr"` (student-produced response). SPR questions have no `options`.
- `paragraph` contains the passage/stimulus HTML (used in reading questions). Empty string when there is no stimulus.
- `loaded: false` means the question is a **stub** — `stem`, `options`, `correctAnswer`, and `explanation` are empty. The frontend hydrates stubs on demand via `/api/sat/question?id=…` as the user navigates.
- `batchSize` tells the frontend how many questions at the start of the array are fully loaded.
- When `questionIds` is supplied the response only contains `count`, `questions`, and `batchSize` (no filter fields).

---

## How It Works

The handler performs a **two-step fetch** against the College Board API.

### Step 1 — Get question metadata list

```
POST https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-questions
Content-Type: application/json

{ "asmtEventId": 99, "test": 2, "domain": "H,P,Q,S" }
```

Returns an array of metadata objects (`external_id`, `ibn`, `questionId`, `skill_cd`, `primary_class_cd`, `difficulty`, etc.) but **no question content**. Results are memoized in-process for 1 hour per unique `(asmtEventId, domainCodes)` pair.

### Step 2 — Fetch full content per question

**Regular questions:**
```
POST https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank/digital/get-question
Content-Type: application/json

{ "external_id": "ac472881" }
```

**Disclosed questions** (IDs ending in `-DC`):
```
GET https://saic.collegeboard.org/disclosed/{questionId}.json
```

Returns the actual question content: `stem`, `stimulus`, `answerOptions`, `correct_answer`, `rationale`, `type`. Detail responses are cached in-process for 24 hours.

Only the first **20 questions** (`INITIAL_BATCH`) are fully detailed in the initial response (with concurrency capped at 5 simultaneous CB requests). The rest are returned as stubs.

---

## Domain Code Mapping

The College Board API uses short domain codes. The proxy translates between them:

### English (R&W)

| Domain Name | Code |
|---|---|
| Information and Ideas | `INI` |
| Craft and Structure | `CAS` |
| Expression of Ideas | `EOI` |
| Standard English Conventions | `SEC` |

### Math

| Domain Name | Code |
|---|---|
| Algebra | `H` |
| Advanced Math | `P` |
| Problem-Solving and Data Analysis | `Q` |
| Geometry and Trigonometry | `S` |

When `domains=any`, the proxy sends all domain codes for the requested sections as a single comma-separated `domain` string in the POST body (e.g. `"H,P,Q,S"` for math-only). This is how section filtering works — the CB API has no `section` parameter.

## Skill Codes

Skill codes follow the pattern `{domain_code}.{letter}` for math (e.g. `H.A.`, `P.C.`) and short abbreviations for English (e.g. `CID`, `WIC`, `BOU`).

## Assessment IDs

| Key | `asmtEventId` |
|---|---|
| `SAT` | `99` |
| `PSAT/NMSQT` | `100` |
| `PSAT` | `102` |

---

## Upstream API Reference

| Endpoint | Purpose |
|---|---|
| `POST /digital/get-questions` | Get question metadata list |
| `POST /digital/get-question` | Get full question detail by `external_id` |
| `GET https://saic.collegeboard.org/disclosed/{id}.json` | Get disclosed question detail |

Base URL (qbank): `https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank`
