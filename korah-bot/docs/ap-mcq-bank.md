# AP MCQ practice

Entry: `/ap/mcqs.html`; linked from the AP sidebar and the FRQ course picker.

The feature follows the SAT question bank and reuses its styles (`sat/sat.css`):

- **Bank page** (`ap/mcqs.html`, `ap/js/mcq.js`): one tile per course. A tile opens
  the unit picker modal with a question limit, filters, "Practice all topics", a
  Progress and Accuracy column per unit, and the bottom selection pill with
  Randomize and Start. Filters are Calculator (Calculus only), Completed, and Result.
- **Player** (`ap/mcq-player.html`, `ap/js/mcq-player.js`): the SAT player layout.
  History stimuli (excerpts, charts, tables) open in the left pane, as SAT Reading
  passages do; Calculus figures sit above the stem, as in SAT Math. Answer rows have
  eliminate buttons, Check moves into the selected row, and the footer has the
  question navigator. The top bar shows whether a calculator is allowed.
- **Data layer** (`ap/js/mcq-bank.js`): course list, bank loading and validation,
  filtering, session URLs, and progress. Each course loads only its own
  `data/<course>/mcqs.json`; a bank containing another course's questions is rejected.

`mcq-player.html` was derived from `sat/questions.html` and keeps a copy of its
inline player styles. If the SAT player's inline styles change, copy the change over.

Checked answers are stored per course in `localStorage`
(`korah_ap_mcq_progress_<course>`), so progress stays in the browser it was made in
and is not synced to the account, FRQ progress, or mock-exam scores. Answer checking
is client-side practice, not a secure assessment.

## Content and provenance

Questions, choices, and explanations are written for Korah; none are released
College Board questions, and no question-bank or textbook exercise text is reproduced.

| Bank | Total | Per unit | With figures | Calculator |
| --- | ---: | --- | ---: | --- |
| AP Calculus AB | 137 | 18, 18, 18, 18, 18, 19, 12, 16 | 17 | 36 calculator; 101 non-calculator |
| AP U.S. History | 135 | 15 per period | 27 | Not applicable |

**AP U.S. History** has 45 stimulus sets of three questions, five per period. Four
sets per period use a verbatim excerpt from a public-domain primary source
(pre-1929 publications and translations, or U.S. government works), quoted from The
American Yawp Reader with original spelling. One set per period uses a chart or
table drawn from public data, mostly the Census Bureau's *Historical Statistics of
the United States*; chart values are rounded. Do not add excerpts from copyrighted
texts (modern translations, post-1929 private speeches or books).

**AP Calculus AB** math is written in LaTeX between `\(` and `\)` and rendered with
KaTeX. Every unit has at least two questions built on a graph, slope field, or table
of values, and at least four calculator and six non-calculator questions, so no
unit and calculator combination is empty. The OpenStax and College Board links are
topic references only.

Correct answers are spread evenly across A–D. Distribution is designed for unit
practice, not a weighted full-length exam. Items have not been psychometrically
calibrated or reviewed by an AP teacher.

## Editing questions

The JSON banks are generated. Edit the sources in `scripts/ap-mcq-build/` and run:

```text
node scripts/ap-mcq-build/build.cjs
```

- `calculus.cjs`: question blocks (`@ unit | n or c | skill | optional figure key`,
  stem, `*` correct choice, three `-` distractors, `=` explanation) and the figures.
- `history-documents.cjs`: primary-source sets. `history-charts.cjs`: chart and
  table sets with their data.
- `figures.cjs`: SVG helpers (`graph`, `chart`) and `table`. Figures use
  `currentColor` for axes and text so they follow the light and dark themes, and
  every figure needs an `alt` description.

List the correct choice first; the build reorders choices and assigns ids. Ids are
positional, so inserting a question in the middle renumbers later ones and detaches
their saved progress; append within a unit when possible. For a calculator question,
add its independently computed value to the list in `scripts/ap-mcq.test.cjs`.

## Schema

`schemaVersion` 2. Each question has `id`, `course`, `unit` (1-based), `calculator`
(`calculator`, `non-calculator`, or `null` for history), `skill`, `stem`, four
`choices`, zero-based `answer`, `explanation`, and `sourceIds`. Optional `figure` is
`{ svg, alt }` or `{ table: { headers, rows }, alt }`. History questions have
`stimulus` with `title`, `attribution`, and either `text` or `figure`.

Question text is escaped before rendering; SVG figures are validated on load (no
scripts or event handlers) and sanitized with DOMPurify in the player.

## Validation

```text
node --test scripts/ap-mcq.test.cjs
```

Tests cover counts and unit coverage, unique ids and stems, even answer
distribution, LaTeX delimiters and the absence of plain-text math, figure coverage
and safety, intersecting unit, calculator, and progress filters, session URLs,
storage failures, mixed-course rejection, selected-course loading, and that the
build script reproduces the committed banks. All 36 calculator keys are recomputed
independently with midpoint quadrature, Newton iteration, finite differences, or
closed forms.
