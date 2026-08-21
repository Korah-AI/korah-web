# Full-Length Practice Tests: Research

> **Status:** this file is only research. Your job is to use the "From GH Issue
> to Merged PR" workflow I gave you to implement it. Read this doc, then follow
> up with your own spec detailing how *you* would implement what this doc asks
> for. Nothing here is a final implementation decision.

## Abstract

**What you're being asked to build** is a section of the website where a
student can sit a full, timed SAT practice exam start to finish: two modules
per subject, a break in the middle, a countdown clock, no going back once a
module is submitted. At the end they get a score out of 1600 and a breakdown of
what they got wrong.

**Go look at the real thing first.** Access Bluebook or OnePrep's practice
exams for a refresher on the user experience. You'll use `questions.html` as
the player for it, but you might have to tweak it in order to work as intended.

**The task, in one sentence:** scrape the questions and answers out of College
Board's free paper practice tests and turn them into digital practice tests on
our site.

That's it. You are not generating questions, not selecting them, not deciding
which ones go where. The tests already exist, already have their questions in
order, already come with an answer key, and already come with an official
scoring table. Your job is to get them out of a PDF and into something a
student can sit at a screen and take.

There should be 11 of these tests. Do **at least 2** for your beta.

---

## 1. The test itself

### 1.1 Form structure

The paper practice tests are **already split into modules**, so you are
replicating a structure that exists rather than inventing one. From the
official scoring guide for Test #4, which is in this folder:

| Order | Section | Questions | Raw score range |
| ----- | ------------- | --------- | --------------- |
| 1 | R&W Module 1 | 33 | 0-33 |
| 2 | R&W Module 2 | 33 | 0-33 |
| break | | | |
| 3 | Math Module 1 | 27 | 0-27 |
| 4 | Math Module 2 | 27 | 0-27 |

R&W section raw score is 0-66. Math section raw score is 0-54. 120 questions
total.

**Note this is bigger than the Bluebook test**, which is 27/27 R&W and 22/22
Math for 98 questions. Don't trim these to match. The scoring table is built
for these counts, and changing the question count breaks it.

Timings on the paper version are not the Bluebook timings either. Use the
per-module time limits printed in the test PDF you scrape, and if a test
doesn't state them, use Bluebook's (32 min per R&W module, 35 min per Math
module) and note the assumption.

Keep the questions in the order they appear in the PDF. The order is part of
the test.

**Hard UX constraint:** once a module is submitted the student cannot go back
to it. There is no "review all questions at the end" screen. Review and
flagging are per-module only.

You shouldn't have to worry too much about this if you scrape the tests from
College Board. Once each module is its own fixed list of questions, "don't let
them go back" mostly falls out of how you structure the player.

### 1.2 Scoring

This is fully specified by College Board and you should follow it exactly. Do
not invent a scoring method.

Open `scoring-sat-practice-test-4-digital.pdf` in this folder and look at the
page titled "Conversion: Calculate Your Section and Total Scores." **You are
automating exactly that worksheet.** The procedure:

1. Count correct answers in Module 1 and in Module 2 for a section.
2. Add them together. That's the **section raw score** (0-66 R&W, 0-54 Math).
3. Find that raw score in the first column of the Raw Score Conversion Table.
   It gives you a **lower** and an **upper** value, not a single number.
4. That range is the section score, on the 200-800 scale.
5. Add the two lower values together and the two upper values together. That's
   the **total SAT score range**, on the 400-1600 scale.

So a student with 40 R&W correct and 33 Math correct gets R&W 530-550 and Math
510-540, for a total of **1040-1090**.

Every question counts the same. There is no per-question weighting to figure
out. Question difficulty is already baked into the shape of the conversion
curve, which is why the curve isn't a straight line: on Math, going from 44 to
45 correct is worth 20 points, while going from 20 to 21 is worth 10.

**Report the range, not a single number.** That's what College Board does here,
and it's honest about the precision we actually have.

**Each test has its own table.** Scraping test #7 means also transcribing test
#7's conversion table from its scoring PDF. Don't reuse test #4's.

---

## 2. Runtime rules the player has to enforce

Collected here because they are the requirements most likely to be missed:

* Per-module timers, not one test-wide timer.
* The break between R&W and Math.
* No navigation back into a submitted module, ever.
* Flag and review scoped to the current module only.
* Resume behavior after a refresh or a closed tab is an open question. Decide
  it deliberately in the spec rather than inheriting whatever the existing
  player does.

---

## 3. Getting the tests

`scoring-sat-practice-test-4-digital.pdf` is in this folder. It's the official
scoring guide for practice test #4 and it contains the answer key by module and
the raw score conversion table. Read it before you plan anything, since it
shows you exactly what a scraped test has to produce.

The rest are free on `satsuite.collegeboard.org`. There are about 11, each with
a test PDF and a companion scoring PDF.

For each test you scrape you need three things:

1. The questions, in order, split by module.
2. The answer key.
3. That test's raw score conversion table.

Store each test in this folder in whatever format you and I agree on in your
spec, and write the parsing code that turns it into something the player can
run.

**On the extraction itself:** this is manual work. R&W are mostly text so they
should be easy. Math is a different beast. It has figures, tables, and
equations, so you're gonna have to find a way to extract it and display it in
the player. I'm not opposed to PNGs (screenshots), but I highly prefer SVG
versions instead (like the rest of the math problems pulled via College Board
API).

A question needs at least: the prompt, any passage or figure, the answer
choices, the correct answer, and its domain and skill tags so the results
screen can break performance down by topic.

---

## 4. Results and review

The test is the easy half. Retention comes from what happens after submission.
Minimum useful results screen:

* Section score ranges and the total range.
* Per-domain accuracy across the eight content domains (four R&W, four Math).
  This is the exact axis College Board reports on, so it's the axis students
  already expect to see their results broken down along.
* Per-question review: student answer, correct answer, time spent.
* Time distribution, so we can surface things like "you spent 4 minutes on
  question 19".

---

## 5. Existing code to build against

**Use `korah-bot/sat/questions.html` as the player.** Nothing else.

Skim through these and attach them as context for your models so they
understand how the existing SAT code is built:

* `korah-bot/sat/js/sat-player.js`
* `korah-bot/sat/js/sat-shared.js`
* `korah-bot/sat/js/sat-rush.js` and `korah-bot/sat/rush.html`
* `korah-bot/sat/js/sat-analytics.js`

---

## Sources

* [Full-Length Digital Practice Tests on Bluebook](https://satsuite.collegeboard.org/practice/practice-tests/bluebook)
* [Practice, Bluebook for Students](https://bluebook.collegeboard.org/students/practice)
* [Scoring Your Paper SAT Practice Test #4 (digital)](https://satsuite.collegeboard.org/media/pdf/scoring-sat-practice-test-4-digital.pdf)
* [OnePrep Predicted Papers](https://www.oneprep.com/predicted-papers)
