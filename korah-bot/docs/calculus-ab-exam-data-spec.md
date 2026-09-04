# Calculus AB exam-data milestone

> Status: proposed implementation spec. The Calculus AB timing, calculator
> policy, and predicted-score curve remain approval gates; placeholder values
> must not ship as final exam metadata.

## 1. Goal

Add one complete Calculus AB exam as validated JSON, together with a repeatable
command-line validator.

The Calculus AB player is explicitly deferred to the next milestone. This
milestone defines and validates the data contract that player work will consume.

## 2. Repository and change constraints

- Work on a feature branch created from the latest `development` branch.
- Do not modify `korah-bot/sat/js/sat-player.js`.
- Do not modify `korah-bot/sat/questions.html`.
- Store Calculus AB material outside the SAT runtime so the new format does not
  accidentally become coupled to the existing SAT player.
- Do not commit copyrighted third-party exam content unless its license or the
  issue author explicitly permits repository redistribution. If the supplied
  questions are original or authorized, record their provenance in the exam
  metadata.

## 3. Milestone boundaries

### 3.1 Included

- One complete, internally consistent Calculus AB exam JSON file.
- Every exam section and every question required by the approved exam design.
- Answer keys, scoring metadata, topic tags, calculator policy, and timing
  metadata.
- A dependency-free validator runnable with the repository's existing runtime.
- Validator tests or invalid fixtures covering the principal failure modes.
- Brief usage documentation.

### 3.2 Deferred

- Exam picker, player, timer, calculator integration, persistence, review, and
  results UI.
- Importing additional exams.
- Any change to the SAT player or SAT question page.

## 4. Proposed file layout

```text
korah-bot/calculus-ab/
  data/
    exam-01.json
    exam.schema.json
  scripts/
    validate-exam.js
  tests/
    fixtures/                 # minimal intentionally-invalid JSON documents
    validate-exam.test.js
  README.md
```

`exam.schema.json` documents the contract and enables editor support. The
JavaScript validator remains the normative repository check because it can
enforce relationships that JSON Schema alone cannot express clearly.

## 5. Exam JSON contract

Top-level shape:

```json
{
  "schemaVersion": 1,
  "id": "calculus-ab-exam-01",
  "title": "Calculus AB Exam 1",
  "course": "calculus-ab",
  "provenance": {
    "kind": "original-or-authorized",
    "source": "TO_BE_RECORDED",
    "license": "TO_BE_RECORDED"
  },
  "examPolicy": {
    "timingStatus": "pending-author-confirmation",
    "calculatorStatus": "pending-author-confirmation"
  },
  "sections": [],
  "scoring": {
    "status": "pending-author-confirmation",
    "multipleChoiceWeight": null,
    "freeResponseWeight": null,
    "predictedScoreCurve": []
  }
}
```

The exact question count and section configuration are derived only after the
issue author confirms the policy values in section 7. Each section contains:

- stable `id`, unique within the exam;
- display `title` and integer `order`;
- `durationMinutes` as a positive integer;
- `calculator` as `required`, `allowed`, or `prohibited`;
- `questionType` as `multiple-choice` or `free-response`;
- ordered `questions` array.

Every question contains:

- stable `id`, globally unique within the exam;
- integer `order`, contiguous within its section;
- `prompt` as non-empty text;
- optional `stimulus` and ordered `parts` for multi-part free response;
- `topics`, using a documented controlled vocabulary;
- `answer` with a type appropriate to the question;
- `pointsPossible` as a positive integer;
- optional `choices` for multiple choice only;
- optional asset references as repository-relative paths with alternative text.

Multiple-choice answers reference exactly one declared choice ID. Free-response
answers include an explicit scoring rubric: each rubric row has a stable ID,
point value, and criterion. The sum of rubric points must equal
`pointsPossible`.

No field that affects timing, calculator access, or scoring may retain a
`pending-*`, `TO_BE_*`, or `null` placeholder when the exam is marked ready.

## 6. Validator behavior

Usage:

```text
node korah-bot/calculus-ab/scripts/validate-exam.js \
  korah-bot/calculus-ab/data/exam-01.json
```

The command exits `0` and prints a concise success summary for a valid exam. It
exits nonzero and prints every discovered error with a JSON-style path for an
invalid exam. It must detect at least:

- unreadable or malformed JSON;
- missing, unknown, or incorrectly typed required fields;
- unsupported schema version, course, section type, or calculator value;
- duplicate exam, section, question, choice, part, or rubric IDs as applicable;
- non-contiguous or duplicate ordering;
- empty prompts, topics, choices, answers, or rubric criteria;
- multiple-choice answers that do not map to exactly one choice;
- choices on free-response items or missing rubrics for scored free response;
- rubric totals that disagree with `pointsPossible`;
- missing assets, absolute asset paths, or asset paths escaping the repository;
- question, point, and section totals that disagree with declared totals;
- overlapping, unordered, incomplete, or non-integer score-curve ranges;
- predicted scores outside the approved score scale;
- any unresolved placeholder when release status is `ready`.

The validator must not mutate input. Tests should prove one complete valid exam
passes and targeted invalid fixtures fail for the cases above.

## 7. Required issue-author confirmation

Before the complete exam JSON is finalized, ask the issue author to approve the
following in writing:

1. **Timing:** section names/order, question counts, minutes per section, break
   policy if any, and whether timing applies per section or exam-wide.
2. **Calculator sections:** the calculator state for every section, including
   whether `allowed` means optional access throughout that entire section.
3. **Predicted-score curve:** the composite-score formula, rounding rules,
   score scale, and every inclusive raw/composite interval mapped to a predicted
   score.

Also confirm the question source and redistribution rights. Send the proposed
values as a compact table or JSON excerpt so the author can approve exact data,
not a prose approximation.

Until approval arrives, development may proceed with an explicitly labeled
fixture, but `exam-01.json` must not be described as complete, set to `ready`,
or accepted by the release validation command.

## 8. Acceptance criteria

- The issue author has confirmed timing, calculator policy, predicted-score
  curve, and content provenance.
- `exam-01.json` contains the complete approved exam and no placeholders.
- The schema and validator agree on the contract.
- The valid exam passes with exit code `0`.
- Invalid fixtures fail with actionable paths and nonzero exit codes.
- No player UI is added.
- `sat-player.js` and `questions.html` are byte-for-byte unchanged from the
  branch baseline.

## 9. Implementation sequence

1. Obtain issue-author confirmation for section 8.
2. Finalize schema and controlled topic vocabulary.
3. Author/import the complete authorized exam and any referenced assets.
4. Implement the validator and negative tests; validate the full exam.
5. Verify protected-file hashes, inspect the final diff, and document any
   environment limitations in the handoff.
