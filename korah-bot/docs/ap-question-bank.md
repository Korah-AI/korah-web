# AP Question Bank

How the AP question bank works and how to add a class to it. This replaces the
original sourcing spec (still in git history at commit `e7ec34f`). The sourcing
and licensing rules from that spec are not repeated here; see "Content rules".

The flow has three stages, all under `korah-bot/ap/`:

```text
home.html (hub)  ->  home.html#{course-slug} (selector)  ->  practice.html (player)
```

## Files

| File | Role |
| --- | --- |
| `ap/home.html`, `ap/js/ap-home.js` | Hub and selector. One page, two views. |
| `ap/js/ap-bank.js` | Course list (`COURSES`) and `loadQuestionBank(slug)`. |
| `ap/data/{slug}/questions.json` | Units, subtopics, and questions for one course. |
| `ap/practice.html` | Player. A copy of `sat/questions.html` with AP wiring. |
| `ap/js/ap-player-source.js` | Feeds the SAT player from the AP JSON. |
| `ap/js/ap-question-analytics.js` | Saves attempts and bookmarks to Firestore. |
| `ap/ap.css` | Hub styles (`.ap-hub-*`). Player styles come from the `sat/` CSS. |
| `scripts/validate-ap-question-bank.js` | Validates every `questions.json`. |

## 1. Hub (`home.html`)

Shown when the URL has no hash. The sidebar Home button (AP tab) and the AP pill
both link here.

- Greeting, countdown to the exam date (`EXAM_START` in `ap-home.js`), shortcut
  pills, four stat cards, and one card per course.
- Course cards are generated from `KorahAP.getCourses()`, so they follow
  `COURSES` in `ap-bank.js`.
- Stats come from `KorahAPQuestions.getSummary()` after sign-in: attempts,
  accuracy, saved questions, and recent errors. The Saved and Errors cards show
  a Practice button when their count is above 0. Guests see zeros.
- Both course JSON files are prefetched when the page loads.

## 2. Selector (`home.html#{course-slug}`)

Same page, switched by `hashchange`. There is no separate file. A card or pill
links to `#ap-calculus-ab` and `route()` swaps the views immediately. The unit
list shows skeleton rows until `questions.json` arrives (usually already
prefetched, so the skeleton is rarely seen).

The view is built from the course's JSON:

- Breadcrumb and title come from `COURSES`.
- Unit rows come from `units[]`. Each row shows `subtopics.length` subtopics and
  the number of questions whose `unit` matches. A unit with no subtopics shows
  "Subtopics coming soon".
- Subtopic rows come from `units[].subtopics[]`. Their counts come from
  questions whose optional `subtopic` field matches the subtopic id.
- Question Limit and Difficulty filters, a "Practice all units" row, and a
  selection pill (Randomize and Start) once something is selected.

Selection rules: checking a unit selects all its subtopics. Unchecking one
subtopic of a selected unit turns the unit into its remaining subtopics.
Selecting every subtopic collapses back to the unit.

Start builds a URL for the player:

```text
practice.html?course={slug}&units=unit-1,unit-3&subtopics=2.4,5.1
              &difficulties=easy,hard&limit=20&random=1
```

`units` and `subtopics` are a union (a question matches either). No `units` or
`subtopics` means the whole course.

## 3. Player (`practice.html`)

`practice.html` is a copy of `sat/questions.html`, so the UI is the same. It
loads the shared `sat/sat.css`, `sat-player-theme.css`, `question-content.js`,
`sat-shared.js`, and `sat-player.js`. Differences from the SAT page:

- `ap-player-source.js` replaces `window.fetch` for `/api/sat/q?...`. It reads
  the URL params above, filters the course JSON, converts each question to the
  SAT player's shape, and returns it. Math written as `\( \)` is converted to
  MathML, because the player never runs KaTeX on stems. Every question has
  `section: 'english'` so the player does not open Desmos or the reference sheet.
- `?mode=saved` and `?mode=errors` ignore `course` and search every course for
  the user's bookmarked questions, or questions whose latest attempt was wrong
  (the 50 most recent).
- The SAT analytics init is removed. `ap-question-analytics.js` is assigned to
  `window.KorahSATAnalytics`, which is the name the player saves through, so
  Save and answer logging work without changes to the player.
- "Back to Bank" goes to `home.html` (`window.KORAH_PLAYER_HOME`), and the
  header shows the course name (`window.KORAH_PLAYER_TITLE`). Both are small
  hooks in `sat/js/sat-player.js` that SAT pages never set.

Firestore paths, under `users/{uid}/`:

- `apQuestionAttempts/{auto}`: `questionId`, `unit`, `unitLabel`, `difficulty`,
  `correct`, `timeSpent`, `ts`.
- `apQuestionBookmarks/{questionId}`: `questionId`, `unit`, `unitLabel`, `ts`.

These are separate from `apAttempts`, which the FRQ and mock-exam pages use.

`practice.html` does not follow later changes to `sat/questions.html`. The
shared CSS and `sat-player.js` do, but markup and inline styles in the copy need
the same edit by hand.

## Data format

`ap/data/{slug}/questions.json`:

```json
{
  "schemaVersion": 1,
  "course": "ap-calculus-ab",
  "title": "AP Calculus AB Question Bank",
  "alignmentSources": [
    { "name": "College Board AP Calculus AB Course", "url": "https://apcentral.collegeboard.org/courses/ap-calculus-ab", "use": "Unit names, skills, and exam weighting only" }
  ],
  "units": [
    {
      "id": "unit-1",
      "title": "Unit 1: Limits and Continuity",
      "subtopics": [{ "id": "1.1", "title": "Introducing Calculus: Can Change Occur at an Instant?" }]
    }
  ],
  "questions": [
    {
      "id": "calc-ab-bank-u1-001",
      "status": "draft",
      "unit": "unit-1",
      "unitLabel": "Limits and Continuity",
      "subtopic": "1.2",
      "topic": "Evaluating limits",
      "skills": ["procedural"],
      "difficulty": "easy",
      "calculator": "prohibited",
      "stem": "What is \\(\\lim_{x \\to 2} (x^2 + 1)\\)?",
      "choices": [
        { "key": "A", "text": "3" },
        { "key": "B", "text": "4" },
        { "key": "C", "text": "5" },
        { "key": "D", "text": "6" }
      ],
      "answer": "C",
      "explanation": "Substitute x = 2.",
      "source": {
        "origin": "original",
        "name": "Korah original practice",
        "url": "",
        "license": "Korah original content",
        "licenseUrl": "",
        "attribution": "Written for Korah; not an official AP question.",
        "adaptationNotes": ""
      },
      "review": { "status": "draft", "reviewedBy": "", "reviewedAt": "" }
    }
  ]
}
```

- `units[].id` must match each question's `unit`. `subtopic` is optional and
  must be a subtopic id from that unit. Without it the question counts toward
  its unit only.
- Counts in the selector are computed from `questions`, so nothing is stored
  for them.
- `stimulus` (optional string) is shown as the passage. Images and other assets
  are not supported yet.
- Exactly four choices, keys A to D.

## Adding a class

Example: AP Biology, slug `ap-biology`.

1. **Data.** Create `ap/data/ap-biology/questions.json` in the format above. List
   every unit and its subtopics in `units`, even with no questions yet. Use an id
   prefix for the course (for example `bio-bank-u1-001`).
2. **Course list.** Add an entry to `COURSES` in `ap/js/ap-bank.js`:
   `slug`, `name`, `shortName`, `description`, `tagline`, `format`, `icon`
   (a Material Icons Round name, shown as the card's corner icon), `frqLabel`,
   `frqUnit`. This also puts the course in the FRQ picker (`ap/index.html`), and
   that page falls back to a placeholder when there is no `frqs.json`.
3. **Card color.** Add a `.ap-hub-course.tone-bio { --acc-fill: #...; }` rule in
   `ap/ap.css` and map the slug in `TONES` at the top of `ap/js/ap-home.js`.
4. **Validator.** In `scripts/validate-ap-question-bank.js`, add the file to
   `DEFAULT_FILES`, add the slug to the supported-course check in
   `validateQuestionBank`, and add the id prefix to `expectedPrefix` in
   `validateQuestion`. These are hard-coded for the first two courses. Update
   the "checked-in MVP banks" test in `validate-ap-question-bank.test.js` too.
5. **Check.** Run `node scripts/validate-ap-question-bank.js` and
   `node --test scripts/validate-ap-question-bank.test.js`, then open
   `ap/home.html#ap-biology`.

No HTML changes are needed. The hub, selector, and player are all driven by
`COURSES` and the JSON.

## Adding questions to an existing class

1. Append to `questions` in that course's JSON with the next id.
2. Set `unit` (and `subtopic` if known) to ids that exist in `units`.
3. Fill in `source` and `review`. New questions start as `status: "draft"` and
   `review.status: "draft"`.
4. Run the validator.
5. After a subject reviewer checks the answer and explanation, set both statuses
   to `ready` and fill `reviewedBy` and `reviewedAt` (`YYYY-MM-DD`). The
   validator requires these for `ready`.

## Content rules

The validator enforces the structure: unique ids, four choices, a valid answer,
balanced `\( \)` math, provenance for anything that is not `origin: "original"`
(absolute source URL, license, license URL, attribution), and a named reviewer
and date for `ready` questions.

The licensing policy from the original spec still applies to what goes into the
JSON: no AP Classroom or leaked exam questions, nothing with unclear licensing,
and no unreviewed AI output. The course tab states that the questions are original
practice aligned to AP topics and that Korah is not affiliated with College Board.
The full source list is in `e7ec34f`.

## Known gaps

- Each course has 4 sample draft questions. Draft status is not shown in the UI.
- No question has a `subtopic`, so every subtopic count is 0.
- APUSH units have no subtopics yet.
- The exam date is hard-coded in `ap-home.js`.
- `loadQuestions` in `ap-bank.js` and the `.ap-qb-*` rules in `ap.css` are
  unused leftovers from the old question page.
