# AP Calculus AB mock-exam data milestone

> Status: implementation spec for the first milestone of the AP mock-exam
> issue. PR #46 review requires the current 45-question format, source-derived
> questions from two credited practice sources, representative visual assets,
> and a documented AP score curve. `mock-1.json` is not release-ready yet.

## 1. Goal

Create one complete, predetermined AP Calculus AB multiple-choice mock exam as
static JSON, plus a standalone validator for authors to run before committing.
There is no question pool or runtime assembler: all students receive the same
questions in the same order.

This milestone is deliberately data-only. The exam picker, player, results,
AP US History exam, and Firestore persistence belong to later milestones.

## 2. Constraints

- Work on a feature branch based on the latest `development` branch and open
  the eventual PR against `development`.
- Do not modify `korah-bot/sat/js/sat-player.js` or
  `korah-bot/sat/questions.html`.
- Scope the format to AP Calculus AB and AP US History, but build only the first
  Calculus AB exam now. Do not generalize for other AP courses yet.
- Include multiple-choice questions only. FRQs and AI grading are out of scope.
- One JSON file is one complete exam with fixed question order and its answer
  key embedded.
- Question IDs and unit IDs are stable persistence keys. Never renumber them
  after release; correct bad content in place.
- Select questions from High School Test Prep plus one approved practice-exam
  source, preserving their provenance and crediting both actual question
  sources. Do not credit the CED as though it supplied questions.
- Match the authored question mix to the AP Calculus AB CED unit weightings.
  The distribution is decided while building the file, not dynamically.
- PNG assets are acceptable; SVG is preferred for figures and equations.

## 3. Deliverables

```text
korah-bot/ap/
  data/
    calc-ab/
      mock-1.json
  assets/
    calc-ab/
      mock-1/
        ...
scripts/
  validate-ap-exam.js
```

Also update relevant repository documentation with the validator command and
the stable Calculus AB unit vocabulary. A separate schema document or automated
test fixtures may be added if they reduce authoring mistakes, but neither may
replace the standalone validator required by the issue.

The required command is:

```text
node scripts/validate-ap-exam.js korah-bot/ap/data/calc-ab/mock-1.json
```

## 4. Exam JSON contract

The issue's draft shape is the starting point. The milestone should converge on
the smallest format that also supports the later AP US History exam without
course-specific player branches.

```json
{
  "schemaVersion": 1,
  "status": "draft",
  "id": "calc-ab-mock-1",
  "course": "ap-calculus-ab",
  "title": "AP Calculus AB Mock Exam 1",
  "sources": [
    { "name": "High School Test Prep", "url": "https://highschooltestprep.com/ap/calculus-ab/" },
    { "name": "AUTHOR_APPROVED_SECOND_SOURCE", "url": "TO_BE_RECORDED" }
  ],
  "parts": [
    { "id": "part-a", "title": "Part A", "durationSec": 3720, "calculator": "prohibited", "questions": [] },
    { "id": "part-b", "title": "Part B", "durationSec": 2280, "calculator": "required", "questions": [] }
  ],
  "curve": []
}
```

Top-level requirements:

- `schemaVersion` is an integer understood by the validator.
- `status` is `draft` or `ready`; unresolved placeholders are allowed only in a
  draft.
- `id`, `course`, and `title` are non-empty; `course` is
  `ap-calculus-ab` for this file.
- `sources` identifies and links both source families used in the exam.
- `parts` contains the issue-author-reviewed format: Part A has 30 questions in
  3,600 seconds with calculators prohibited; Part B has 15 questions in 2,700
  seconds with a graphing calculator required. Questions remain globally
  ordered and numbered across both parts.
- `curve` covers every possible raw score from zero through the question count.

Each question contains:

```json
{
  "id": "calc-ab-mock-1-q1",
  "unit": "unit-2",
  "stem": "Question text",
  "assets": [
    { "path": "../../assets/calc-ab/mock-1/q1.svg", "alt": "Description" }
  ],
  "choices": [
    { "key": "A", "text": "Choice A" },
    { "key": "B", "text": "Choice B" },
    { "key": "C", "text": "Choice C" },
    { "key": "D", "text": "Choice D" }
  ],
  "answer": "B",
  "explanation": "Post-submission explanation"
}
```

Question requirements:

- Array position is exam order; IDs stay stable even if content is corrected.
- `unit` uses a documented stable CED unit ID and drives results grouping.
- `stem` and `explanation` are non-empty strings.
- `assets` is optional; each entry uses a JSON-file-relative repository path
  plus meaningful alternative text.
- `choices` contains unique keys and non-empty content.
- `answer` exactly matches one declared choice key. Grading later uses strict
  string comparison only after the exam is submitted.

Curve entries use ascending raw-score thresholds:

```json
[
  { "rawMin": 0, "apScore": 1 },
  { "rawMin": 15, "apScore": 2 }
]
```

The first `rawMin` must be zero. Each threshold begins an inclusive band that
ends immediately before the next threshold; the final band ends at the total
question count. `apScore` must be an integer from 1 through 5.

## 5. Unit distribution

Maintain a controlled catalog for AP Calculus AB unit IDs, labels, and official
CED weight ranges. The exam author must calculate target counts for the
confirmed full question count, select questions from both approved sources, and
record every question's unit.

The validator output must show, for every unit:

- unit ID and label;
- actual question count;
- actual percentage of the exam;
- CED target weight or range; and
- whether the authored distribution is inside the accepted range.

Rounding and tolerance rules must be documented so a small exam is not rejected
merely because a percentage range cannot map cleanly to whole questions.

For the 45-question mock, the researched target counts are Units 1–8:
`5, 5, 4, 5, 8, 8, 4, 6`. Each count lies inside the whole-question bounds
derived from the College Board ranges using `ceil(total × minimum)` and
`floor(total × maximum)`.

## 6. Validator behavior

`scripts/validate-ap-exam.js` must be dependency-free and runnable with the
repository's available Node.js runtime. It validates one path supplied on the
command line, does not mutate input, and reports all detected errors with clear
JSON-style locations.

It exits `0` only for a release-valid exam and prints an exam summary plus the
unit-distribution comparison. It exits nonzero for at least:

- missing argument, unreadable file, or malformed JSON;
- missing, unknown, placeholder, or incorrectly typed required fields;
- a `ready` exam without exactly two credited source families;
- empty exam, stem, explanation, choice text, or unit;
- duplicate question IDs or duplicate choice keys within a question;
- a question answer that is not exactly one of its choice keys;
- unsupported or unstable unit IDs;
- absolute asset paths, paths escaping the repository, missing asset files, or
  assets without useful alternative text;
- a question distribution outside the documented CED count ranges;
- an empty, unordered, duplicate, non-integer, or out-of-range curve;
- a curve whose first threshold is not zero or which does not cover the complete
  raw-score range; and
- values left as `null`, `TO_BE_*`, or another unresolved placeholder when
  `status` is `ready`.

The validator may accept explicitly marked draft files while reporting their
unresolved release blockers, but its success message must distinguish draft
structural validity from a release-valid exam.

## 7. Required issue-author confirmation

PR #46 review confirms the 45-question, 105-minute format: 30 no-calculator
questions in 60 minutes and 15 calculator questions in 45 minutes.

Before the exam becomes `ready`, document and obtain review for:

1. **Question provenance:** the exact High School Test Prep and approved second
   practice source used for the selected questions.
2. **CED distribution:** the College Board CED version used, its unit weight
   bands, and the whole-question rounding used to select the unit counts.
3. **Assets:** representative graphs, figures, or tables stored as SVG or PNG
   under `korah-bot/ap/assets/calc-ab/mock-1/` and referenced by the questions.
4. **Predicted-score curve:** released scoring evidence and the precise method
   used to map an MCQ-only raw score to a predicted AP score. Score-distribution
   percentages alone do not provide raw-score cut points.

The curve proposed for review uses Mathaversity's estimated 2026 composite
thresholds of 28, 42, 54, and 69 out of 108. Because this mock has no FRQs, it
assumes equal performance rates on the MCQ and FRQ halves, projects each
composite percentage onto 45 questions, and rounds upward. The resulting
MCQ-only thresholds are 12, 18, 23, and 29. These are predicted-score cutoffs,
not an official College Board conversion. The official 2026 score-distribution
percentages are a reasonableness check only and cannot be inverted into raw
cutoffs.

## 8. Acceptance criteria

- Review has accepted every item in section 7.
- `korah-bot/ap/data/calc-ab/mock-1.json` contains the complete confirmed MCQ
  exam, fixed ordering, answer key, explanations, unit IDs, both source credits,
  and no unresolved placeholders.
- The authored unit mix satisfies the documented CED weight/count rule.
- `node scripts/validate-ap-exam.js korah-bot/ap/data/calc-ab/mock-1.json`
  prints the unit distribution and exits `0`.
- Targeted invalid inputs demonstrate that the required validation failures
  produce actionable messages and nonzero exits.
- No AP player or results UI is added in this milestone.
- `sat-player.js` and `questions.html` are byte-for-byte unchanged from the
  branch baseline.

## 9. Implementation sequence

1. Confirm the remaining decisions in section 7 with the issue author.
2. Document the stable Calculus AB unit catalog and count-rounding rule.
3. Finalize the JSON shape and implement the validator.
4. Build the complete authorized exam by hand, mixing both sources and matching
   the CED distribution; extract only necessary figures or equations.
5. Run the validator, exercise invalid cases, verify protected-file hashes, and
   inspect the final diff.
