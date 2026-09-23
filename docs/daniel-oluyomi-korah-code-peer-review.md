# Daniel Oluyomi: Korah CODE Peer Review

## Review target

- Pull request: #56, Peer Review #2 - Bushi's Work
- Branch reviewed: `ap-bushi`
- Commit reviewed: `2d0cea5`
- Related issue: #42, AP FRQ tutor
- Review decision: Changes requested before merge

## What I tested

I reviewed the new AP course picker, FRQ and SAQ banks, attempt flow, grading code, progress page, sidebar links, JSON question data, and the written spec. I opened all four AP pages on a local server at desktop and narrow window sizes. I also checked all new JavaScript files with `node --check`, parsed every new JSON file, and compared the UI behavior with the data and code behind it.

The four pages loaded, the JavaScript syntax checks passed, and every JSON file parsed successfully. The overall page structure is easy to follow. The course picker, question list, attempt state machine, canned local mode, rubric ledger, and progress breakdown give the feature a solid foundation.

The feature is not ready to merge yet because several issues can make a student see or save an incorrect grade. Those problems should be fixed before visual polish.

## High-level feedback

### 1. The grading data needs an accuracy and source review

This is the most important issue. The product tells students that it uses real College Board style questions and an official rubric, so the questions, answers, and rubric points have to be trustworthy.

The first Calculus question contains contradictions:

- `korah-bot/ap/data/ap-calculus-ab/frqs.json:73` says the average value is about `5.640`, but the correct value of the expression in that question is about `4.962`.
- `frqs.json:91` says the greatest rate occurs at `t = 30`.
- `frqs.json:126` says the greatest rate occurs at `t = 0`, which is the correct endpoint, but the explanation also incorrectly says there are no other critical points in the interval. There is another critical point at approximately `t = 19.635`.

The data objects also do not include source URLs or another clear provenance field. I would not ship grading against these rubrics until every question, expected answer, rubric point, and sample response has been checked against an approved source.

Recommended fix:

1. Add fields such as `sourceTitle`, `sourceUrl`, and `rubricSourceUrl` to every question.
2. Verify every calculation and historical scoring rule against the source.
3. Add a validation checklist or test fixture for each question.
4. Change the UI wording from "official rubric" to "Korah practice rubric" unless the rubric is actually copied or adapted from an approved official source.

### 2. Production failures can turn into fake grades and get saved

`KorahAPGrader.grade()` falls back to canned grading for almost every live API failure. The attempt flow then saves that canned result to Firestore like a real attempt.

This means a network error or server error could give a student a score that belongs to the demo response, add that score to Progress, and affect the weakness report. The small "Demo mode" message does not prevent the incorrect data from being stored.

Recommended fix:

- Only use canned grading when `?canned=1`, on an explicit demo route, or in a clearly marked local development mode.
- In normal production mode, show a retryable error and do not save an attempt if grading fails.
- Add a field such as `gradingMode: "live" | "demo"` to saved attempts, and reject demo attempts from real analytics.

### 3. Missed points are automatically recorded as disputed

After grading, every point the student missed is placed into `state.disputed`. As a result, the UI immediately labels all missed points as "Disputed" even though the student never clicked the disagreement button. Those point IDs are also included when the attempt is first saved.

This breaks the meaning of the dispute feature and makes the stored analytics unreliable.

Recommended fix: initialize `state.disputed` as an empty `Set` after grading. Only add or remove an ID inside the click handler for the "I disagree" button.

### 4. The Progress page can open the wrong attempt

The score trend sorts attempts from oldest to newest. The attempt list sorts them from newest to oldest. Both sections store only a positional array index. When a student clicks a chart point, that index is used against the oppositely sorted list, so the page can open a different attempt.

Recommended fix: give each chart point and attempt row a stable shared key, preferably the Firestore attempt ID. Find the matching row by that key instead of by its array position.

### 5. Timer recovery does not recover the attempt screen

The code reads a running timer from local storage after a reload, but it always returns the student to the pre-attempt screen. Clicking "Start attempt" starts the clock again and overwrites the restored start time.

Recommended fix: persist the active question and attempt state together with the timer. If the stored timer belongs to the same FRQ and is still active, restore the active view and answer draft. If it belongs to another FRQ, ask whether the student wants to resume or reset it.

## Low-level code feedback

### A. Preserve the real rubric criterion in normalized verdicts

Files:

- `korah-bot/ap/js/ap-grader.js:228-253`
- `korah-bot/ap/js/ap-attempt.js:325`

`flattenRubric()` includes `criterion`, but `normalizeGrade()` drops it when building each verdict. The feedback UI asks for `v.criterion`, so it falls back to displaying the internal rubric point ID instead of a student-friendly criterion.

Current pattern:

```js
verdicts.push({
  rubricPointId: p.id,
  category: p.category,
  partLabel: p.partLabel,
  earned,
  evidence: ...,
  feedback: ...,
});
```

Suggested change:

```js
verdicts.push({
  rubricPointId: p.id,
  criterion: p.criterion,
  category: p.category,
  partLabel: p.partLabel,
  earned,
  evidence: ...,
  feedback: ...,
});
```

Add `criterion` to the defaulted verdict path and to the saved Firestore verdict as well.

### B. Do not coerce arbitrary values into earned points

File: `korah-bot/ap/js/ap-grader.js:241`

The code uses:

```js
const earned = Boolean(v.earned);
```

This turns the string `"false"` into `true`. I reproduced this by calling `normalizeGrade()` with an `earned: "false"` verdict, and it returned a score of 1 out of 1.

Suggested change:

```js
if (typeof v.earned !== 'boolean') {
  issues.push('Invalid earned value for ' + p.id);
}
const earned = v.earned === true;
```

For grading integrity, consider rejecting the entire response and retrying once when any rubric verdict has an invalid type, duplicate ID, or missing ID.

### C. Stop saving canned fallback results as live attempts

Files:

- `korah-bot/ap/js/ap-grader.js:286-298`
- `korah-bot/ap/js/ap-attempt.js:424-432`

The grader catches live errors, loads `canned-grading.json`, and returns `canned: true`. `runGrade()` then calls `submitAttempt()` without checking that flag.

Suggested change:

```js
if (result.canned && !KorahAPGrader.canned()) {
  throw new Error('Live grading failed. Your attempt was not saved.');
}
```

A cleaner design would keep demo grading and production grading as separate paths so a production request never silently enters demo mode.

### D. Initialize disputes correctly

File: `korah-bot/ap/js/ap-attempt.js:430`

Current code:

```js
state.disputed = new Set(
  result.verdicts.filter((v) => !v.earned).map((v) => v.rubricPointId)
);
```

Suggested change:

```js
state.disputed = new Set();
```

The existing click handler at `ap-attempt.js:369-381` can remain responsible for adding and removing disputed point IDs.

### E. Use one stable attempt key across the chart and list

File: `korah-bot/ap/progress.html:273-285, 337-368, 430-439`

The chart uses indexes after ascending date sort. The list uses indexes after descending date sort. Replace `data-attempt="${i}"` with a stable value such as `data-attempt-id="${esc(a.id)}"`. Use the same attribute on the matching list row, then query that exact ID on click.

If placeholder attempts do not have IDs, create a stable local key from `frqId` and `createdAt` before rendering.

### F. Calculate the latest score by date

File: `korah-bot/ap/js/ap-progress.js:104-114`

`latestPerFrq()` treats the first item for an FRQ as the latest item and never compares dates. This works only when the caller has already sorted the array newest first. The placeholder file is not in that order, so the question bank shows `3/7 last` for Calc 2023 Q1 even though later attempts on the Progress page have higher and newer scores.

Suggested fix: compare `createdAt` for each matching FRQ and replace `lastScore` when the new attempt is newer. Keep `count` independent from the selected latest attempt.

### G. Restore the view and draft with the timer

File: `korah-bot/ap/js/ap-attempt.js:467-480`

The restored `startedAt` value is immediately followed by `showView('pre')`. Persist a small object keyed by course and FRQ containing `startedAt`, view, typed draft, and image metadata where practical. On load, restore `view-active` for a matching active attempt. Do not call `KorahTimer.start()` again when resuming.

## Product and UI suggestions

These are not merge blockers, but they would make the feature clearer:

- Mark placeholder attempts as demo data on the course and question-bank pages, not only on Progress. A logged-out user currently sees "Attempted" badges that look like personal history.
- Show the approved source beside each question so students understand where the prompt and rubric came from.
- Keep the course card count consistent with the question list. The course picker excludes entries marked `sample`, but the next screen still lists those entries.
- Replace internal IDs such as `calc-ab-2023-q1` in the Best Score card with the question title.
- Reduce some explanatory copy on the landing and pre-attempt screens. The main action and trust information should be visible first.

## Suggested verification before merge

1. Verify every question and rubric against its approved source.
2. Add unit tests for `normalizeGrade()`, including missing IDs, duplicate IDs, `earned: "false"`, and invalid JSON.
3. Simulate a 500 response from `/api/r` and confirm no score is saved.
4. Confirm missed points begin as not disputed and change only after a click.
5. Click every score-trend point and confirm it opens the matching attempt.
6. Reload during an active attempt and confirm the timer and draft resume without resetting.
7. Test guest, signed-in, desktop, and mobile flows for both AP Calculus AB and AP US History.

## Final assessment

This is a strong first complete build with a clear flow and a useful rubric-first feedback concept. The remaining work is mainly about trust and state correctness. Once the question data is verified, canned results are prevented from entering real analytics, and the dispute, progress, and timer bugs are fixed, I would be comfortable reviewing it again for merge.
