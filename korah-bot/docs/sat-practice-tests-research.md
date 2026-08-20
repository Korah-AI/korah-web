# Practice Tests and Tailored Practice: Research

> **Status:** research only. No implementation decisions are final. This doc
> exists so that a follow-up implementation spec can be written against real
> facts instead of guesses.

## Abstract

We want two new SAT sections in `korah-bot/sat/`: **full-length practice tests**
(a timed, adaptive, Bluebook-shaped exam that produces a 400-1600 score) and
**tailored practice** (an auto-generated question set that targets the skills a
student is weakest at).

The core finding is that these two features have very different data costs.
**Tailored practice needs no new data at all.** College Board's own "Get
Tailored Practice" button pulls from the public Student Question Bank, which is
the exact API we already proxy in `api/_lib/collegeboard.js`, with the exact
tags we already normalize (domain, skill, difficulty). The feature is pure
logic over data we can already fetch, plus the per-skill stats
`sat/js/sat-analytics.js` already writes to Firestore.

**Full-length practice tests need two things we do not have:** fixed test forms
(a defined 98-question set split into modules) and a raw-to-scaled score
conversion table. College Board's real scoring is IRT-based with unpublished
per-item parameters, so it cannot be reproduced. It has to be approximated. The
one place authentic conversion tables exist in public is the official paper
practice test scoring PDFs, which cover roughly ten linear (non-adaptive)
forms.

Recommended sequencing, in effort order: tailored practice first, then
full-length tests.

---

## 1. Full-length practice test

### 1.1 Form structure

The digital SAT, as administered in Bluebook since 2024:

| Order | Section | Questions | Time | Adaptive? |
| ----- | ------------- | ------------------------ | ------ | --------- |
| 1 | R&W Module 1 | 27 (25 scored, 2 pretest) | 32 min | no |
| 2 | R&W Module 2 | 27 (25 scored, 2 pretest) | 32 min | **yes** |
| break | | | 10 min | |
| 3 | Math Module 1 | 22 (20 scored, 2 pretest) | 35 min | no |
| 4 | Math Module 2 | 22 (20 scored, 2 pretest) | 35 min | **yes** |

Totals: 98 questions, 2h14m of testing time.

Content ordering conventions worth copying:

* **R&W** groups questions by domain, in this order: Craft and Structure,
  Information and Ideas, Standard English Conventions, Expression of Ideas.
  Within each domain, difficulty roughly increases.
* **Math** runs roughly easy to hard across the whole module. About 75% is
  multiple choice and about 25% is student-produced response (grid-in).

**Hard UX constraint:** once a module is submitted the student cannot go back
to it. There is no "review all 98 questions at the end" screen. Review and
flagging are per-module only. This is not a stylistic choice, it is what makes
the adaptive design work, and any test player we build has to enforce it.

### 1.2 Adaptive routing

The digital SAT is **multistage adaptive (MST)**, not per-question adaptive.
Module 1 is the same difficulty mix for everyone. Performance on Module 1
selects one of two prebuilt Module 2 panels, commonly called the **lower** and
**upper** modules. R&W and Math route independently, so a student can get the
hard math module and the easy R&W module in the same sitting.

College Board has never published the routing cut. Three ways to pick one:

1. **Raw threshold.** Simplest. For example, 17 or more correct out of 27 in
   R&W and 14 or more out of 22 in Math routes to the upper module. Public
   estimates cluster around 60-70% correct.
2. **Difficulty-weighted score.** Score each correct answer by its difficulty
   tag (E=1, M=2, H=3), sum, then threshold. Only marginally more code than
   option 1, and it behaves sensibly when a student's Module 1 draw happens to
   skew easy or hard. **This is the recommended option**, because
   `api/_lib/collegeboard.js` already normalizes `difficulty` onto every
   question, so the input is free.
3. **Theta estimate.** A 2PL or 3PL IRT model with assumed per-band item
   parameters. Only worth it if we also do IRT scoring, which we should not.

### 1.3 Scoring, and why it cannot be exact

Real Bluebook scoring uses Item Response Theory. Every item carries calibrated
difficulty, discrimination, and guessing parameters. A student's ability
estimate is derived from the full response pattern across both modules, then
mapped to the 200-800 section scale. Those item parameters are not published
for any item, in any bank. **Reproducing official scoring is not possible for
us or for anyone else.** Every third-party SAT product is approximating, and we
should be upfront about that in the UI.

Two viable approximations:

**Option A: dual lookup table (recommended for adaptive tests).**
Build two raw-to-scaled curves per section: one for students routed to the
lower Module 2, one for the upper. Score becomes
`table[section][routedModule][rawCorrectAcrossBothModules]`. The lower path
caps out around 560-600. The upper path spans the full 200-800. This is the
standard third-party approach and lands within roughly 30 points of real scores
in practice.

**Option B: official linear tables (recommended for non-adaptive tests).**
College Board publishes real conversion tables inside the paper practice test
scoring PDFs (`scoring-sat-practice-test-N-digital.pdf`). Important caveats:

* They apply to the **linear, non-adaptive paper forms**: 54 R&W questions and
  44 Math questions taken straight through, with no modules and no routing.
* They give a **lower bound and an upper bound** per raw score, producing a
  score range rather than a point estimate.

So Option B is authentic but only valid for a linear test. It is still useful
for Option A: the upper-bound curve of a linear table is a reasonable proxy for
the shape of the upper-module curve, so it can be used to calibrate.

**Pretest questions.** On the real exam, 2 questions per module are unscored
and the student is not told which. For our own tests there is no reason to
model this. Score every question and size the conversion table to the full
raw counts.

### 1.4 Results and review

The test is the easy half. Retention comes from what happens after submission.
Minimum useful results screen:

* Section scores (200-800 each) and a total, presented **as a range** so we are
  not claiming precision we do not have.
* Which Module 2 the student was routed to, stated plainly. Students care about
  this a great deal and hiding it reads as evasive.
* Per-domain accuracy across the eight content domains (four R&W, four Math).
  This is the exact axis College Board reports on, and it is the axis tailored
  practice keys off, so it is also the handoff point between the two features.
* Per-question review: student answer, correct answer, official rationale, time
  spent, difficulty tag.
* Time distribution, so we can surface things like "you spent 4 minutes on
  question 19".

---

## 2. Tailored practice

### 2.1 What Bluebook actually does

Worth knowing before we over-engineer: Bluebook's version is simple. After a
practice test, My Practice shows a per-domain breakdown and offers a **"Get
Tailored Practice"** button. Clicking it assembles a question set from the
**Student Question Bank**, targeting weak domains at a difficulty appropriate
to the student's level.

That is the whole feature. It is not an LLM. It is not per-item IRT selection.
It is a filtered query against a tagged bank, seeded by domain-level results.
And the bank it queries is the same one `api/sat/q` already serves.

### 2.2 Generalized algorithm

```
1. Maintain a mastery estimate per skill (skill, not just domain).
2. Rank skills by a "needs work" priority score.
3. For the top N skills, sample K questions each at the difficulty
   one step above current mastery.
4. Exclude recently seen items. Reinject previously missed items on a
   spaced schedule.
5. Update mastery after every answer, so the next set differs.
```

**Mastery estimate.** Do not start with Bayesian Knowledge Tracing or Elo.
Start with a smoothed accuracy, so that a single wrong answer does not report
0% mastery:

```
mastery(skill) = (correct + alpha * p0) / (attempts + alpha)
```

with `alpha` around 5 and `p0` around 0.6 (the prior: what an average student
gets right). Optionally weight by difficulty, for example a correct H counts
1.5 and a missed E counts 1.5 against.

**Priority score.** Decides which skills enter the set:

```
priority = (1 - mastery) * domainWeight * recencyDecay * confidence
```

* `domainWeight`: how many questions of that skill actually appear on a real
  test. Weakness in Information and Ideas matters far more than weakness in
  Circles, because the first is around a quarter of the R&W section and the
  second is a couple of questions. These weights can be derived directly from
  the skill breakdown counts `/api/sat/s` already computes.
* `recencyDecay`: pushes down skills drilled recently so sets do not repeat.
* `confidence`: low when `attempts` is small, so untested skills get **probed**
  rather than hammered.

**Difficulty ladder.** Per skill: mastery below 0.5 selects E, 0.5 to 0.75
selects M, above 0.75 selects H, with one band of spillover so a set is never
uniformly one difficulty (uniform sets feel robotic). This is the same idea as
the OnePrep-style "Domain 1, then Domain 2 easy or Domain 2 hard" ladder, just
expressed per skill instead of per module.

**Set shape.** Around 20 questions:

* 60% weakest skills at ladder difficulty
* 20% spaced re-ask of previously missed items
* 20% exploration and probing of untested skills

The middle 20% is the highest-yield component and the one most competing
products skip.

### 2.3 What we already have

`sat/js/sat-analytics.js` writes `satSkills/{skillCd}` docs and `recordAttempt`
already receives `correct`, `attempts`, and `timeSpent`. That covers the
mastery formula completely. The two missing pieces are:

* a per-item "last seen at" record, for `recencyDecay` and exclusion
* a missed-item queue, for the spaced re-ask slice

### 2.4 One thing we can do that Bluebook cannot

Bluebook can only seed tailored practice from a completed full-length practice
test, because that is the only data it has. We also have Question Bank and
Practice Rush history. Tailored practice should therefore be seedable from
either source. This is a real differentiator, and practically it means the
feature does not have to sit behind a 2h14m gate to be useful.

---

## 3. Data sources

Ranked by effort to value.

### Tier 1: already wired up

**College Board Question Bank.** `qbank-api.collegeboard.org` for listings,
plus `saic.collegeboard.org/disclosed` for full item detail. Both already
proxied in `api/_lib/collegeboard.js`. Roughly 3,500+ real items, each tagged
with section, domain (`primary_class_cd`), skill (`skill_cd`), difficulty
(E/M/H), the correct answer, and an official rationale.

This is the same source Bluebook's own tailored practice draws from, so
**tailored practice requires zero new data collection.** Build it first.

### Tier 2: needed for full-length tests

The bank gives us items, not **forms**. A form is a fixed 98-question set with
a defined module split. Options:

**2a. Official paper practice tests #1 through #11.**
Free PDFs on `satsuite.collegeboard.org`, each with a companion scoring PDF
containing the answer key and the official raw-to-scaled conversion table. This
is the only public source of authentic conversion tables. Roughly ten usable
tests.

Extraction is genuine manual work. R&W passages are plain text and extract
cleanly. Math is the problem: figures, tables, and equations all need handling,
which means text extraction plus figure export to SVG or PNG plus item-by-item
verification. Budget close to a full day per test to do it properly, or run a
vision-model pass followed by human review.

Note these are **linear** forms (54 R&W, 44 Math, straight through). Splitting
one into adaptive modules changes the form and invalidates its official
conversion table. The clean use is to ship them as a **"Linear Practice Test"**
mode with authentic official scoring, and to build adaptive tests separately.

**2b. Assemble adaptive forms from the Question Bank.**
Draw items from the bank against a blueprint that reproduces the domain
proportions and difficulty mix of a real form: R&W Module 1 at roughly
13 easy / 7 medium / 7 hard spread across the four domains in test order, the
upper Module 2 skewed toward M and H, the lower Module 2 skewed toward E and M.

Upside: unlimited tests, genuinely adaptive, no PDF extraction, and it reuses
the existing fetch pipeline end to end. Downside: the conversion table is ours,
not College Board's, so scoring is Option A from section 1.3.

**2c. Educator Question Bank.**
`satsuiteeducatorquestionbank.collegeboard.org` serves the same items but has a
real **export** function and full rationales, which beats scraping. Requires an
educator account.

### Tier 3: community datasets, for cross-checking

* [`Anas099X/OpenSAT`](https://github.com/Anas099X/OpenSAT): public JSON
  question DB. Useful as a schema reference even if we do not use the content.
* [`mdn522/sat-question-bank`](https://github.com/mdn522/sat-question-bank):
  bulk scrape of the CB bank.
* [`VG-Fish/College-Board`](https://github.com/VG-Fish/College-Board): Python
  scraper for the bank. Selenium based, Firefox only.

Quality varies and none carry official conversion tables. Treat as gap-fill.

### 3.1 Copyright

College Board question content is copyrighted. The practice PDFs are free to
use for studying, but redistributing extracted items inside a product is a
different legal question, and the Question Bank terms do not grant
redistribution either.

Our current architecture is the defensible one: we **proxy** College Board's
API at request time rather than hosting a copy. Keep it that way for the
Question Bank and for tailored practice.

For full-length tests, the lower-risk shape is to store a form as a **list of
College Board question IDs** plus a blueprint, with content still fetched live
at play time. A form then becomes a 98-element ID array rather than a JSON file
full of copyrighted question text. This is also a far smaller artifact to build
and maintain.

---

## 4. Candidate data shapes

Illustrative only. The implementation spec should finalize these.

**Test form** (references only, per section 3.1):

```json
{
  "id": "korah-adaptive-01",
  "label": "Korah Practice Test 1",
  "kind": "adaptive",
  "modules": {
    "rw1":        { "questionIds": ["...27 ids..."], "timeLimitSec": 1920 },
    "rw2_lower":  { "questionIds": ["...27 ids..."], "timeLimitSec": 1920 },
    "rw2_upper":  { "questionIds": ["...27 ids..."], "timeLimitSec": 1920 },
    "math1":       { "questionIds": ["...22 ids..."], "timeLimitSec": 2100 },
    "math2_lower": { "questionIds": ["...22 ids..."], "timeLimitSec": 2100 },
    "math2_upper": { "questionIds": ["...22 ids..."], "timeLimitSec": 2100 }
  },
  "routing": {
    "method": "weighted",
    "weights": { "E": 1, "M": 2, "H": 3 },
    "rwCut": 34,
    "mathCut": 28
  },
  "scoring": { "table": "korah-v1" }
}
```

**Scoring table.** Index is raw correct across both modules. Two curves per
section, selected by which Module 2 the student was routed to.

```json
{
  "id": "korah-v1",
  "rw":   { "lower": [200, 210, "...", 600], "upper": [280, 300, "...", 800] },
  "math": { "lower": [200, "...", 600],      "upper": [280, "...", 800] }
}
```

**Per-skill mastery.** Extends what `satSkills/{skillCd}` already holds:

```json
{
  "skillCd": "H.C.",
  "attempts": 14,
  "correct": 9,
  "byDifficulty": { "E": [5, 5], "M": [6, 4], "H": [3, 0] },
  "mastery": 0.61,
  "lastPracticedAt": "2026-08-18T22:10:00Z",
  "missedQueue": [
    { "questionId": "abc123", "missedAt": "...", "dueAt": "...", "reps": 1 }
  ]
}
```

---

## 5. Proposed sequencing

1. **Tailored practice.** No new data. Reuses `/api/sat/q` and the existing
   analytics. Immediately useful to every current user. Ship the mastery
   formula, priority ranking, and difficulty ladder. Add the spaced
   missed-item queue in a second pass.
2. **Full-length tests, adaptive, assembled from the bank.** Build the
   blueprint sampler, the module runner (enforcing no cross-module navigation,
   per-module timers, and the section break), difficulty-weighted routing, and
   a v1 conversion table calibrated against the official linear tables.
3. **Manually scrape 2 to 3 official paper practice tests** and ship them as a
   gold-standard linear mode with authentic conversion tables. Use the real
   scores this produces to recalibrate the table from step 2.
4. **Close the loop.** Results screen offers "Get Tailored Practice", seeded by
   the test's per-domain breakdown. That is the Bluebook flow, and it is what
   makes the two features one product instead of two.

---

## Sources

* [Full-Length Digital Practice Tests on Bluebook](https://satsuite.collegeboard.org/practice/practice-tests/bluebook)
* [My Practice 101](https://satsuite.collegeboard.org/practice/my-practice-101)
* [Practice, Bluebook for Students](https://bluebook.collegeboard.org/students/practice)
* [Scoring Your Paper SAT Practice Test #4 (digital)](https://satsuite.collegeboard.org/media/pdf/scoring-sat-practice-test-4-digital.pdf)
* [SAT Suite Educator Question Bank](https://satsuiteeducatorquestionbank.collegeboard.org/)
* [How the Digital SAT is Scored: Adaptive Routing and IRT](https://satcalculator.co/how-digital-sat-is-scored/)
* [Digital SAT Scoring Algorithm](https://www.edisonos.com/digital-sat/scoring-algorithm)
* [OnePrep Predicted Papers](https://www.oneprep.com/predicted-papers)
