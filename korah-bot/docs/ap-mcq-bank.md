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
| AP Calculus AB | 200 | 25 per unit | 26 | 50 calculator; 150 non-calculator |
| AP U.S. History | 200 | 22 per period (23 in Periods 5 and 7) | 27 | Not applicable |
| AP Physics 1 | 100 | 12 or 13 per unit | 48 | Allowed on every question |

**AP U.S. History** has 63 stimulus sets, seven per period, each with three or
four questions. Six sets per period use a verbatim excerpt from a public-domain primary source
(pre-1929 publications and translations, or U.S. government works), quoted from The
American Yawp Reader with original spelling. One set per period uses a chart or
table drawn from public data, mostly the Census Bureau's *Historical Statistics of
the United States*; chart values are rounded. Do not add excerpts from copyrighted
texts (modern translations, post-1929 private speeches or books).

**AP Calculus AB** math is written in LaTeX between `\(` and `\)` and rendered with
KaTeX. Every unit has at least two questions built on a graph, slope field, or table
of values, and at least five calculator and seventeen non-calculator questions, so no
unit and calculator combination is empty. The OpenStax and College Board links are
topic references only.

**AP Physics 1** follows the eight units of the current course framework (kinematics
through fluids). Each question is tagged `conceptual` (33) or `quantitative` (67), and
the bank page offers a Question type filter in place of the Calculator filter, because a
calculator is allowed throughout that exam. Forty-eight questions use a diagram or graph
(inclines, pulleys, collisions, torque setups, oscillators, fluid apparatus), and several
figures are shared by two or three questions, as on the exam. Numerical questions state
the value of g to use. The OpenStax link is a topic reference only.

Correct answers are spread evenly across A–D. Distribution is designed for unit
practice, not a weighted full-length exam. Items have not been psychometrically
calibrated or reviewed by an AP teacher.

## Editing questions

The JSON banks are generated. Edit the sources in `scripts/ap-mcq-build/` and run:

```text
node scripts/ap-mcq-build/build.cjs
```

- `calculus.cjs` and `calculus-more.cjs` (second batch): question blocks (`@ unit | n or c | skill | optional figure key`,
  stem, `*` correct choice, three `-` distractors, `=` explanation) and the figures.
- `history-documents.cjs` and `history-more.cjs` (second batch, plus single
  questions added to earlier sets): primary-source sets. `history-charts.cjs`:
  chart and table sets with their data.
- `physics1.cjs`: AP Physics 1 question blocks (`c` conceptual or `q` quantitative in
  the second field) and their figures. `diagram.cjs`: free-form SVG diagrams built
  from lines, arrows, shapes, and labels.
- `figures.cjs`: SVG helpers (`graph`, `chart`) and `table`. Figures use
  `currentColor` for axes and text so they follow the light and dark themes, and
  every figure needs an `alt` description.

List the correct choice first; the build reorders choices and assigns ids. Ids are
positional, so inserting a question in the middle renumbers later ones and detaches
their saved progress; append within a unit when possible. Keep the units
balanced: the tests fail if one unit has two more questions than another. For a calculator question,
add its independently computed value to the list in `scripts/ap-mcq.test.cjs`.

## Schema

To add a course, add it to `COURSES` in `ap/js/mcq-bank.js` (`tone` picks the tile
color, `numbered` and `noun` control unit labels, `hasCalculator` and `hasKinds` turn on
the matching filter), add a build function, and give the tile artwork in `ap/js/mcq.js`.

`schemaVersion` 2. Each question has `id`, `course`, `unit` (1-based), `calculator`
(`calculator`, `non-calculator`, or `null` for history and physics), `kind` (physics
only), `skill`, `stem`, four
`choices`, zero-based `answer`, `explanation`, and `sourceIds`. Optional `figure` is
`{ svg, alt }` or `{ table: { headers, rows }, alt }`. History questions have
`stimulus` with `title`, `attribution`, and either `text` or `figure`.

Question text is escaped before rendering; SVG figures are validated on load (no
scripts or event handlers) and sanitized with DOMPurify in the player.

## Validation

```text
node --test scripts/ap-mcq.test.cjs
```

Tests cover the 200-question totals and even division among units, unique ids and stems, even answer
distribution, LaTeX delimiters and the absence of plain-text math, figure coverage
and safety, intersecting unit, calculator, and progress filters, session URLs,
storage failures, mixed-course rejection, selected-course loading, and that the
build script reproduces the committed banks. All 50 calculator keys are recomputed
independently with midpoint quadrature, Newton iteration, finite differences, or
closed forms.

In dark mode `sat/sat.css` inverts every inline SVG inside question content. `mcq.css`
turns that off for the AP player, because AP figures and KaTeX's radical signs already
use the text color and would otherwise render black.
