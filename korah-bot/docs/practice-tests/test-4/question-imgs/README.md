# Images for Practice Test #4

Math module images are split into two folders relative to this one:

- `mod-1/` — Math Module 1 question images (`math-m1-qN.png`)
- `mod-2/` — Math Module 2 question images (`math-m2-qN.png`)

Every math question (all 54) has a `stemImg` field pointing at its crop. The player
renders `q.stemImg` in place of the text stem (options stay selectable text), from:

    ../docs/practice-tests/test-4/question-imgs/<stemImg>

These images replaced the previous hand-drawn figure SVGs (now removed) and the old
flat-named stem crops.

## Wiring (for reference)

- `PTWindowScript.js` -> `renderStem(q)` renders `q.stemImg` when present, else the
  text `q.stem`.
- Image base path: `../docs/practice-tests/test-4/question-imgs/`.
