# Study Plan — Review

## Issue 1 — SAT score image upload is buggy

Location: the Step 2 "Upload your score report" panel (`study-plan.html` lines ~207–246) and `js/study-plan.js`.

Root causes:

- **Only one photo is allowed.** The file input at `study-plan.html:225` has no `multiple` attribute, and the handlers only ever grab the first file:
  - `handleFileSelect` → `this.processFile(e.target.files[0])` — `study-plan.html:528`
  - `handleDrop` → `this.processFile(e.dataTransfer.files[0])` — `study-plan.html:529`
  - `processFile` (`study-plan.html:530–534`) and `extractScores` (`study-plan.html:535–544`) operate on a single `scoreImage`.

- **No manual-entry option.** Scores can only come from OCR via the `/api/r` endpoint (`study-plan.js:31–51`). Step 2 cannot proceed unless both `extractedScores?.mathScore` and `extractedScores?.rwScore` are truthy (`study-plan.html:512`). There are no text inputs to type the Math / Reading & Writing scores manually, and no way to upload multiple photos. The "Upload different image" button (`study-plan.html:243`) only clears and re-uploads a single image.

Suggested fix direction (not applied): add `multiple` to the input and loop over `files`, and/or add manual score entry fields with a fallback bypass of OCR.

## Issue 2 — "Haven't tested yet" → plan not creating

Location: `submitWizard()` (`study-plan.html:545–560`) → `createPlan()` (`study-plan.js:72–83`).

Plan creation depends on two things that are not present when running on Live Server:

- **Firebase sign-in.** `onAuthStateChanged` (`study-plan.html:70–80`) returns early if there is no signed-in user, so `initStudyPlan` never runs and `window.KorahStudyPlan` is never set. `submitWizard` then calls `window.KorahStudyPlan?.createPlan(payload)` (`study-plan.html:557`) using **optional chaining**, which silently no-ops and throws no error — the plan is never created and the UI gives no indication anything went wrong.
- **The `/api/r` Vercel serverless backend.** `generatePlan` (`study-plan.js:53–70`) and `extractScoresFromImage` (`study-plan.js:31–51`) both `POST /api/r`, which requires the deployed backend and `GEMINI_API_KEY`. It does not exist on fiveserver, so it fails locally (this limitation is documented in `docs/umer-web-structure.md:485`).

Even when the backend works, `createPlan` is fragile: it blindly calls `sessions.map(...)` on the parsed model output (`study-plan.js:73–76`). If the model returns JSON without a `sessions` array (or `JSON.parse` at `study-plan.js:69` fails), it throws and the generic `alert("Failed to create plan")` at `study-plan.html:558` shows — with no plan written to Firestore.


## Issue 3 - `maxOutputTokens` + `maxDuration: 300` → streaming can truncate

Frontend has no response_format fallback when JSON parse fails
This ties to the earlier "plan not creating" report: generatePlan (study-plan.js) does JSON.parse(content). The proxy returns content as text even for json_object requests (r.js:174, 180), and Gemini can wrap JSON in code fences or return an error string. JSON.parse then throws on the client (study-plan.js:69), and since createPlan does sessions.map(...) on the result (study-plan.js:73-76), the whole plan write aborts with the generic alert. The backend never validates that the response is actually parseable JSON.

`config.maxDuration` is 300s (`api/r.js:4`) but the proxy never sets `generationConfig.maxOutputTokens` (`api/r.js:86-92`). A long non-streaming plan generation can exceed the timeout and return a truncated stream without a terminal `[DONE]`, leaving the client waiting forever on an incomplete response.

