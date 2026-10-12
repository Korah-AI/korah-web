# AP MCQ practice

Entry: `/ap/mcqs.html`; linked from the AP sidebar and FRQ course picker.

The picker uses the existing FRQ card styles. Selecting a course opens only its
own JSON bank. Calculus supports intersecting unit/calculator filters; history
supports unit filters. Filters are reflected in the URL. Twelve questions appear
per bank page. Practice checks one answer, shows a worked explanation and source
links, and keeps checked answers in memory until the page is closed or reloaded.
These answers do not update FRQ progress or mock-exam scores.

## Content and provenance

Research date: October 12, 2026. Sources are listed in each bank and linked from
explanations and the expandable source list. Questions, choices, and explanations
are written for Korah; none are released College Board questions, and no
question-bank or textbook exercise text is reproduced.

**AP U.S. History** uses 36 stimulus sets of three questions, four sets per period.
Every stimulus is a verbatim excerpt from a public-domain primary source (pre-1929
publications and translations, or U.S. government works such as statutes, court
opinions, executive orders, and presidential addresses), quoted from the
transcriptions in The American Yawp Reader with original spelling kept. Each
question's first source link opens the full document. Do not add excerpts from
copyrighted texts (modern translations, post-1929 private speeches or books).

**AP Calculus AB** items are independently written; the OpenStax Calculus Volume 1
review pages and the College Board framework are topic references only.

| Bank | Total | Unit counts | Calculator |
| --- | ---: | --- | --- |
| AP Calculus AB | 120 | 16, 16, 16, 16, 16, 16, 10, 14 | 36 calculator; 84 non-calculator |
| AP U.S. History | 108 | 12 per unit, across 9 units | Not applicable |

Every calculus unit has at least four calculator and six non-calculator questions,
so no unit/calculator filter combination is empty. Correct answers are spread
evenly across A–D in both banks. Distribution is designed for unit practice, not a
weighted full-length exam. These items have not been psychometrically calibrated
or externally teacher-reviewed.

## Schema and maintenance

Each `data/<course>/mcqs.json` contains `schemaVersion`, `course`, `sources`, and
`questions`. IDs are globally unique, prefixed with the course slug. Questions
carry the same course slug, a 1-based unit, four plain-text choices, a zero-based
answer index, an explanation, a skill, and source IDs. History also has a stimulus
object. Calculator metadata is `calculator`, `non-calculator`, or `null` for history.
Keep answer IDs stable; add genuinely distinct questions rather than numeric
clones. Verify the answer and all distractors before adding an item. Do not use
the mock-exam bank as an implicit fallback.

`js/mcq-bank.js` validates course ownership and question structure before display.
It rejects invalid course paths, mixed banks, duplicate IDs, malformed answers,
and missing references. `js/mcq.js` escapes question content before rendering.
Load failures show a retry action; empty intersections show a clear-filters action.

## Validation

Run from the repository root:

```text
node --test scripts/ap-mcq.test.cjs
node --check korah-bot/ap/js/mcq.js
node --check korah-bot/ap/js/mcq-bank.js
```

Tests cover minimum counts, unit coverage, source references, unique IDs and stems,
even answer distribution, non-empty unit/calculator combinations, mixed-course rejection, intersecting filters, empty results,
selected-course loading, and failure handling. All 36 calculator keys are checked
independently with midpoint quadrature, Newton iteration, finite differences, or
closed-form calculations; wrong numeric options must remain distinguishable.

Browser checks cover course navigation, combined and cleared filters, calculator
control absence for history, correct/incorrect feedback, checked-answer retention,
pagination, shareable filter URLs, and narrow-screen layout. Answer checking is
client-side practice, not a secure assessment.
