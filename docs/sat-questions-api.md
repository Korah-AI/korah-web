# SAT Questions API — `/api/sat/questions`

Vercel serverless proxy that fetches SAT questions from the [mysatprep.fun](https://mysatprep.fun) upstream API and returns them in a normalized shape for the Korah SAT player frontend.

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
| `domains` (or `domain`) | string | `"any"` | Comma-separated domain names (e.g. `Algebra,Advanced Math`) or `"any"` |
| `skills` (or `skill`) | string | `"any"` | Comma-separated skill codes (e.g. `H.A.,H.B.`) or `"any"` |
| `limit` | string/number | `null` (no limit) | Max total questions to return. Accepts integers, `"none"`, `"unlimited"`, `"max"` |

## Response Shape

```json
{
  "sections": ["math"],
  "domains": "any",
  "count": 10,
  "questions": [
    {
      "id": "ac472881",
      "section": "math",
      "domain": "Algebra",
      "paragraph": "",
      "stem": "<p>...HTML/MathML question text...</p>",
      "options": [
        { "key": "A", "text": "<p class=\"choice_paragraph\">...</p>" },
        { "key": "B", "text": "..." }
      ],
      "correctAnswer": "B",
      "explanation": "<p>...HTML rationale...</p>",
      "type": "mcq"
    }
  ]
}
```

**Notes:**
- `stem`, `options[].text`, and `explanation` contain HTML (including MathML for math questions).
- `type` is `"mcq"` (multiple choice) or `"spr"` (student-produced response). SPR questions have no `options`.
- `paragraph` is always empty — the upstream API embeds passage text within `stem`.

---

## How It Works

The proxy performs a **two-step fetch** against the upstream API:

### Step 1 — Get question metadata list

```
GET https://mysatprep.fun/api/get-questions?domains=H,P,Q,S&assessment=SAT
```

Returns an array of metadata objects (questionId, external_id/ibn, skill_cd, difficulty, etc.) but **no question content**.

### Step 2 — Fetch full content per question

```
GET https://mysatprep.fun/api/question/{external_id | ibn}
```

Returns the actual question: `stem`, `answerOptions`, `correct_answer`, `rationale`, `type`.

The proxy shuffles the metadata list, slices to the requested limit (default cap: 50 per section), then fetches all details in parallel.

---

## Domain Code Mapping

The upstream API uses short domain codes, not names. The proxy translates between them:

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

When a section is requested with `domains=any`, the proxy sends **all domain codes for that section** to the upstream (e.g. `domains=H,P,Q,S` for math). This is how section filtering works — the upstream API has no `section` parameter.

## Skill Codes

The upstream uses `skillCds` (not `skill`). Valid codes follow the pattern `{domain_code}.{letter}` for math (e.g. `H.A.`, `P.C.`) and short abbreviations for English (e.g. `CID`, `WIC`, `BOU`).

Full reference: [API docs](https://3nyn1x0835.apidog.io/domains-skills-unique-keys-1375128m0)

---

## Upstream API Reference

| Endpoint | Docs |
|---|---|
| `GET /api/get-questions` | [apidog](https://3nyn1x0835.apidog.io/get-questions-as-list-20236752e0) |
| `GET /api/question/{external-ibn}` | [apidog](https://3nyn1x0835.apidog.io/get-question-details-by-externalid-ibn-20236743e0) |
| `GET /api/lookup` | [apidog](https://3nyn1x0835.apidog.io/data-lookup-20236893e0) |

Base URL: `https://mysatprep.fun`
