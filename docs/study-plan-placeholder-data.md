# Study Plan: add placeholder data for local development

Everything past step 2 in `korah-bot/sat/study-plan.html` needs internet to work
because it calls the Gemini AI API or Firebase. To fix this, just add some
placeholder data for everything.

## Tips

- Gate it on `window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"`
  so nothing changes on the deployed site. `js/sat-player.js:1288` already does
  this with `DEMO_QUESTIONS`, copy that pattern.

- Two places call the API, both in `js/study-plan.js`: `extractScoresFromImage`
  (line 31) and `generatePlan` (line 53). Wrap each fetch in try/catch and
  return placeholder data in the catch.

- Also check `!res.ok`. A 404 does not throw, so right now the failure silently
  becomes `{}` and the "Scores extracted" card renders with blank numbers.

- For scores, anything realistic works, e.g. `{ mathScore: 680, rwScore: 720 }`.

- For the plan, generate the sessions in a loop from `intake.studyDays` and
  `intake.hoursPerWeek` rather than hardcoding a list. You need about 10 weeks of
  sessions starting from this week's Monday, otherwise the week and month views
  come out mostly empty.

- Match the shape the UI expects exactly: `id`, `date` as `YYYY-MM-DD`,
  `dayOfWeek`, `startTime`, `durationMinutes`, `domain`, `section`, `taskType`,
  plus a `feedback` string. Use the real domain names and vary them, and throw in
  a couple of long ones like "Problem Solving & Data Analysis" so you can see how
  the month grid handles overflow.

- Firebase writes also fail locally, so `createPlan` and `updateSession` need a
  fallback too. Simplest is a plain in-memory object holding the plan with the
  same listen/get/set behavior. Do not use localStorage, because there is no
  reset button on this page and you would be stuck on the calendar view forever.
  In memory means a refresh puts you back at the wizard.

## Note

The signed-out redirect in `study-plan.html` has been removed for now, so the
page stays reachable on Live Server. With no user, `initStudyPlan` never runs, so
the page sits on the loading spinner until the 25 second forced timeout kicks it
to the wizard.
