# Math stem screenshots (manual workflow)

The math modules were scraped from the official PDF, and many stems contain math
notation (radicals, fractions, exponents, system of equations) that came out garbled
or reconstructed best-effort. Each affected question now has a `stemImg` field in its
module JSON pointing at a PNG in this folder. The practice test renders that PNG in
place of the (error-prone) text stem. Options remain selectable text.

## Current status

Images are NOT yet supplied — this is the manual step. Until a PNG exists for a
question, the question falls back to its text stem; once the PNG is dropped in here
with the exact filename below, it takes over automatically (no code change needed).

## How to supply a crop

1. Open the official PDF:
   `korah-bot/docs/practice-tests/sat-practice-test-4-digital.pdf`
2. For a question below, crop the **question/stem region only** (the wording +
   any inline equation/notation). Do NOT include the answer options — those stay as
   text.
3. Save it to this folder with the exact filename in the File column, e.g. `m1-q3.png`.
   PNG preferred (white background, high DPI).
4. Refresh the practice test — the image appears automatically.

## Modules

### math-module-1 (`m1-*.png`)

| File      | Question | Why |
|-----------|----------|-----|
| m1-q3.png  | 3  | radical equation garbled (`2x = 3√625`) |
| m1-q5.png  | 5  | function `f(t) = 100 + 25t` in stem |
| m1-q11.png | 11 | equation `2.5b + 5r = 80` in stem |
| m1-q13.png | 13 | fraction `x/8 = 5`, `8/x` |
| m1-q14.png | 14 | system `24x + y = 48`, `6x + y = 72` |
| m1-q15.png | 15 | slope fraction `−1/3`, point `(9, 10)` |
| m1-q16.png | 16 | exponential `f(x) = 206(1.034)^x` |
| m1-q19.png | 19 | equation garbled (`14x = 2(19w + 7y)`) |
| m1-q21.png | 21 | radical expression garbled |
| m1-q22.png | 22 | radicals `2√2`, `6√2`, `√80` |
| m1-q23.png | 23 | factoring `4x² + bx − 45` garbled |
| m1-q24.png | 24 | system `y = 2x² − 21x + 64`, `y = 3x + a` |
| m1-q26.png | 26 | parabola `y = ax² + bx + c` |
| m1-q27.png | 27 | function `f(x) = −ax + b`, y-intercept garbled |

### math-module-2 (`m2-*.png`)

| File      | Question | Why |
|-----------|----------|-----|
| m2-q3.png  | 3  | expression `12x^3 − 5x^3` |
| m2-q4.png  | 4  | system `x + y = 18`, `x = 5y` |
| m2-q6.png  | 6  | absolute value `\|x − 5\| = 10` |
| m2-q7.png  | 7  | function `f(x) = 7x + 1` |
| m2-q8.png  | 8  | function `h(x) = x^2 − 3` |
| m2-q9.png  | 9  | exponential `f(x) = 270(0.1)^x` |
| m2-q12.png | 12 | equation `−4x^2 − 7x = −36` |
| m2-q14.png | 14 | function `f(x) = 2x + 3` |
| m2-q16.png | 16 | system `x = 6k + 13`, `y = 8k − 29` |
| m2-q17.png | 17 | equation `−3x + 21px = 84` |
| m2-q18.png | 18 | function `f(x) = (x − 10)(x + 13)` |
| m2-q19.png | 19 | function `f(x) = (1/9)(x − 7)^2 + 3` |
| m2-q20.png | 20 | trig `cos(K) = 24/51`, `cos(L)` |
| m2-q21.png | 21 | equation `−x^2 + bx − 676 = 0` |
| m2-q22.png | 22 | equation `x + 4y = −16` |
| m2-q23.png | 23 | exponential `f(x) = 5,470(0.64)^(x/12)` |
| m2-q25.png | 25 | circle `x^2 + (y − 1)^2 = 49` |
| m2-q26.png | 26 | ratio `(92/47)K` |

## Wiring (for reference)

- `PTWindowScript.js` → `renderStem(q)` renders `q.stemImg` when present, else falls
  back to `q.stem` text.
- Image path: `../docs/practice-tests/test-4/question-imgs/<filename>`.
