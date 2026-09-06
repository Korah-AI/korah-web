# Images for Practice Test #11

Math module images are split into two folders relative to this one:

- `mod-1/` — Math Module 1 question images (`math-m1-qN.png`)
- `mod-2/` — Math Module 2 question images (`math-m2-qN.png`)

Every math question (all 54) has a `stemImg` field pointing at its crop. The player
renders `q.stemImg` in place of the text stem (options stay selectable text), from:

    ../docs/practice-tests/test-11/question-imgs/<stemImg>

## Q18 (Math Module 1) — graph options

Q18 asks "Which of the following graphs represents this situation?" and its four
answer options are graphs, so it is wired differently:

- `q.stemImg` = `mod-1/math-m1-q18(question).png` (the question wording).
- `q.optionImgs` = the four per-option crops:
  `math-m1-q18(optionA).png`, `(optionB).png`, `(optionC).png`, `(optionD).png`.

When `q.optionImgs` is present, the player renders each option card with its graph
image while keeping the A/B/C/D letter clickable (selection/grading unchanged). The
image is the option's content; the letter key is the selectable element.

## Wiring (for reference)

- `PTWindowScript.js` -> `renderStem(q)` renders `q.stemImg` when present, else the
  text `q.stem`. `renderMcq(...)` renders `q.optionImgs[i]` for option `i` when the
  array is present, else the text option.
- Image base path: `../docs/practice-tests/test-11/question-imgs/`.
