# AP MCQ practice

Entry: the AP hub, `/ap/home.html` (sidebar AP tab and Home). Pick a course tile, or open `home.html#<course-slug>`.

The feature follows the SAT question bank and reuses its styles (`sat/sat.css`):

- **Hub** (`ap/home.html`, `ap/js/ap-home.js`): one tile per course in "My AP
  subjects". A tile opens `home.html#<course-slug>`, the unit picker with a question limit, filters, "Practice all units", a
  Progress and Accuracy column per unit, and the bottom selection pill with
  Randomize and Start. Filters are Calculator (Calculus and Precalculus), Question type
  (Physics only), Completed, and Result. `ap/mcqs.html` and `ap/js/mcq.js` are the
  earlier standalone version of this page; nothing links to them anymore.
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
(`korah_ap_mcq_progress_<course>`). For signed-in users the player also writes each
checked answer to `users/{uid}/apQuestionAttempts` (with `course` and `choice`) and
Mark for Review to `users/{uid}/apQuestionBookmarks`, through
`ap/js/ap-question-analytics.js`. The hub reads both for its stat cards, and copies
the latest choice per question back into local progress so the unit columns match
across devices. Practice Saved and Practice Errors open
`mcq-player.html?mode=saved|errors`, which pulls those ids from every course's bank.
MCQ progress is separate from FRQ progress and mock-exam scores. Answer checking
is client-side practice, not a secure assessment.

## Content and provenance

Questions, choices, and explanations are written for Korah; none are released
College Board questions, and no question-bank or textbook exercise text is reproduced.

| Bank | Total | Per unit | With figures | Calculator |
| --- | ---: | --- | ---: | --- |
| AP Calculus AB | 200 | 25 per unit | 26 | 50 calculator; 150 non-calculator |
| AP U.S. History | 200 | 22 per period (23 in Periods 5 and 7) | 27 | Not applicable |
| AP Physics 1 | 200 | 25 per unit | 85 | Allowed on every question |
| AP Biology | 200 | 25 per unit | 115 | Allowed on every question |
| AP Physics C: Mechanics | 200 | 29 in units 1–4, 28 in units 5–7 | 51 | Allowed on every question |
| AP Physics 2 | 200 | 29 in units 9–12, 28 in units 13–15 | 94 | Allowed on every question |
| AP Psychology | 200 | 40 per unit | 72 | Not applicable |
| AP Precalculus | 200 | 67 in units 1–2, 66 in unit 3 | 47 | 60 calculator; 140 non-calculator |
| AP Chemistry | 200 | 23 in units 1–2, 22 in units 3–9 | 54 | Allowed on every question |
| AP Environmental Science | 200 | 23 in units 1–2, 22 in units 3–9 | 52 | Allowed on every question |
| AP U.S. Government and Politics | 200 | 40 per unit | 31 | Not applicable |

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
through fluids). Each question is tagged `conceptual` (100) or `quantitative` (100), matching the even
split the tests enforce, and
the bank page offers a Question type filter in place of the Calculator filter, because a
calculator is allowed throughout that exam. Sixty-five questions use a diagram or graph
(inclines, pulleys, collisions, torque setups, oscillators, fluid apparatus), and several
figures are shared by two or three questions, as on the exam. Numerical questions state
the value of g to use. The OpenStax link is a topic reference only.

**AP Biology** follows the eight units of the course framework. Most questions are built
on a graph, data table, or diagram (enzyme kinetics, water potential, signaling pathways,
a pedigree, chi-square and linkage data, a gel, an operon, a phylogenetic tree, food web,
and population curves). The data are invented for these questions and modeled on standard
classroom investigations; they are not measurements from a published study.

**AP Physics C: Mechanics** follows the seven units of the course framework and is
calculus-based: derivatives and integrals of motion, drag as a differential equation,
work and impulse by integration, potential energy curves, rotational inertia by
integration, orbits, and physical pendulums. Questions are tagged `conceptual` (61) or
`quantitative` (139), which reflects that exam's emphasis. Some figures are shared with
AP Physics 1.

**AP Physics 2** follows the seven units of the course framework, which the College
Board numbers 9–15 to continue from AP Physics 1. Questions store them as units 1–7,
and the course's `unitOffset: 8` in `COURSES` makes labels read "Unit 9" through
"Unit 15". Topics run from thermodynamics through electrostatics, circuits, magnetism and
induction, geometric optics, waves and physical optics, and modern physics. Questions are
tagged `conceptual` (93) or `quantitative` (107). Figures include P–V cycles, circuit
schematics, field and induction setups, ray diagrams, interference setups, a hydrogen
energy-level diagram, photoelectric and decay graphs. Thermodynamics questions use the
AP convention that `W` is work done on the gas (ΔU = Q + W), and numerical
questions state the constants to use.

**AP Psychology** follows the five units of the 2024 course framework. Questions are
scenario-based applications of course concepts, with research-methods and
data-interpretation items in every unit (experimental design, correlation, normal and
skewed distributions, reliability and validity). Figures include a neuron, an action
potential, a lobes diagram, a hypnogram, conditioning and reinforcement-schedule curves,
the Strange Situation, Asch lines, Maslow's hierarchy, the general adaptation syndrome,
and data charts and tables. Study data in figures are hypothetical, modeled on classic
studies. The course has no Question type filter.

**AP Precalculus** covers units 1–3, the units assessed on the AP exam. Unit 4
(Functions Involving Parameters, Vectors, and Matrices) is not on the exam and has no
questions. As on the exam's multiple-choice section, which has 29 no-calculator and 13
graphing-calculator questions, about 30 percent of questions (20 per unit) are tagged
`calculator`. They involve numerical solutions, extrema, regressions (linear, quadratic,
cubic, exponential, and logarithmic), and models, and they have purely numerical choices. The
tests recompute all 60 keys independently. No-calculator questions cover rates of change,
zeros and end behavior, asymptotes and holes, transformations, sequences, exponential and
logarithmic properties, equations and inequalities, semi-log plots and residuals, sinusoidal
modeling, inverse trigonometric functions, identities, and polar curves and their rates of
change. Trigonometric graphs are labeled in multiples of π.

**AP Chemistry** follows the nine units of the course framework and uses the Question
type filter: questions are tagged `conceptual` or `quantitative`, with calculations in
every unit. Figures include photoelectron and mass spectra, potential-energy curves,
particle diagrams, vapor-pressure, Maxwell–Boltzmann, and Beer's law graphs, a
chromatogram, rate data and integrated rate-law plots, reaction-energy profiles, a heating
curve, an equilibrium concentration graph, titration curves computed from the charge
balance, and a galvanic cell. Chemical formulas are written in the sources as `ce{H2SO4}`
(or `mce{…}` inside existing math) and converted to LaTeX by `chemtext.cjs`.

**AP Environmental Science** follows the nine units of the course framework, with
data-analysis and calculation questions (energy, percent change, the rule of 70, LD50,
productivity) throughout. Figures include a food web, an energy pyramid, survivorship,
logistic-growth, tolerance, island-biogeography, and demographic-transition graphs, age
structure diagrams, a soil profile, a rain shadow, smog and inversion graphs, a dissolved
oxygen sag curve, a dose–response curve, and a Keeling-style CO₂ record.

**AP U.S. Government and Politics** follows the five units of the course framework. It
applies the required foundational documents, including the four added for 2026–27
(the Emancipation Proclamation, Federalist No. 39, the Gettysburg Address, and core
principles from Adam Smith's *The Wealth of Nations*), and the required Supreme Court
cases, with charts and tables for data analysis. Roe v. Wade is presented together with
its overruling in Dobbs v. Jackson Women's Health Organization (2022).

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
- `physics1.cjs`, `physics1-more.cjs`, and `physics1-more2.cjs` (later batches): AP Physics 1 question blocks (`c` conceptual or `q` quantitative in
  the second field) and their figures. `diagram.cjs`: free-form SVG diagrams built
  from lines, arrows, shapes, and labels.
- `biology.cjs` + `biology-more.cjs` and `physicsc.cjs` + `physicsc-more.cjs`: AP Biology and AP Physics C: Mechanics question
  blocks and figures. `physics2-a.cjs` + `physics2-b.cjs` and `psychology-a.cjs` + `psychology-b.cjs`:
  AP Physics 2 and AP Psychology. `precalc-a.cjs` + `precalc-b.cjs`: AP Precalculus (`c` calculator or `n` no calculator,
  as in Calculus). `chem-a.cjs` + `chem-b.cjs`, `apes-a.cjs` + `apes-b.cjs`, and `gov-a.cjs` + `gov-b.cjs`: AP Chemistry,
  AP Environmental Science, and AP U.S. Government. All are built by `buildBlockCourse` (pass `calculator: true` for the calculator field) in `build.cjs`, which is the
  quickest route for a new course.
- `figures.cjs`: SVG helpers (`graph`, `chart`) and `table`. Figures use
  `currentColor` for axes and text so they follow the light and dark themes, and
  every figure needs an `alt` description.

List the correct choice first; the build reorders choices and assigns ids. Ids are
positional, so inserting a question in the middle renumbers later ones and detaches
their saved progress; append within a unit when possible. Keep the units
balanced: the tests fail if one unit has two more questions than another. For a calculator question in Calculus or
Precalculus, add its independently computed value, in bank order, to that course's list in `scripts/ap-mcq.test.cjs`.

## Schema

To add a course, add it to `COURSES` in `ap/js/mcq-bank.js` (`tone` picks the tile
color, `numbered`, `noun`, and an optional `unitOffset` control unit labels, `hasCalculator` and `hasKinds` turn on
the matching filter), add a build function, and give the tile artwork in `ap/js/mcq.js`, a tile color in `ap/ap.css` and `ap/mcq.css`, and an icon in `COURSE_ICONS` in `ap/js/ap-home.js`.

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
build script reproduces the committed banks. All 60 AP Precalculus calculator keys are
recomputed as well. All 50 AP Calculus calculator keys are recomputed
independently with midpoint quadrature, Newton iteration, finite differences, or
closed forms.

In dark mode `sat/sat.css` inverts every inline SVG inside question content. `mcq.css`
turns that off for the AP player, because AP figures and KaTeX's radical signs already
use the text color and would otherwise render black.

The bank page shows three course tiles to a row (two on tablets, one on phones); further
courses wrap onto the next row. In the player, the unit label is filled with the course's
tile color, set from `data-tone` on `<body>`.

## Ask Korah

The player has the same Ask Korah panel as the SAT player (`ap/js/mcq-ask-korah.js`,
`ap/ask-korah.css`, markup in `ap/mcq-player.html`). It sends the current question to the
shared `/api/r` proxy with the header `X-Korah-Phase: ap-ask-korah`:

- **Ask Korah tab:** a chat about the current question. The system prompt names the course
  and includes the unit, skill, stimulus or figure (its description and SVG source, or
  table rows), choices, correct answer, and the written explanation, and asks for an
  AP-style breakdown: what is tested, the reasoning, why each wrong choice is tempting,
  and an exam tip. Korah is told not to reveal the answer unless asked.
- **Explanation tab:** "Korah Breakdown" requests a step-by-step breakdown as JSON and
  renders it as numbered steps; "Answer Key" shows the bank's own explanation with no
  request.

Chats and generated breakdowns are saved in `localStorage` (`korahApChat_*`,
`korahApExplain_*`), keyed by question id plus a hash of the stem so a rebuilt bank
does not show a breakdown written for a different question. Nothing is written to
Firestore. Model output is rendered through DOMPurify. The button is tagged
`data-requires-auth`, so signed-out visitors get the sign-up prompt, as on the SAT player.

`ask-korah.css` is a copy of the SAT player's inline panel styles; copy changes across by hand.
