# Shipped on `umer`

Work on this branch since it was cut from `development`. Each entry lists the issue it
closes and the files it lives in.

## SAT study plan creator (#27)
`korah-bot/sat/study-plan.html`, `korah-bot/sat/js/study-plan.js`

Four step setup wizard (starting point, level, test date, availability), an AI generated
schedule, and a month calendar with per day sessions, a progress line and a countdown to
test day. Writes `users/{uid}/studyPlans/current` using the same JSON primitives the iOS
app decodes, so a plan made on the web opens on the phone. Score reports can be entered by
screenshot (multiple allowed) or by hand. Sessions carry stable `crypto.randomUUID()` ids
so marking one complete does not break the iOS match.

## Vocabulary practice section (#26)
`korah-bot/sat/vocab/learn.html`, `korah-bot/sat/vocab/practice.html`,
`korah-bot/sat/vocab/js/`, `korah-bot/sat/vocab/css/vocab.css`

Learn view over the 988 word list in `korah-bot/vocab/cleaned_sat_vocabulary.json` with a
wordbank, a browse filter with bulk add, word origins, and daily rotating discover picks.
Practice runs through a setup wizard into Definition Quiz, Vocab Quiz, sentence practice
and flashcards graded with "still learning" and "I know this". Progress is kept in
`localStorage` as `vocabsData` and `practicePerformanceData` with the mastery math from
`SETUP.md`, and `vocab-sync.js` reconciles it with Firestore on sign in. Study sets group
words into named collections.

## Tailored practice (#28)
`korah-bot/sat/tailored.html`, `korah-bot/sat/js/sat-tailored.js`, `korah-bot/sat/tailored.css`

Reads the existing `satSkills/{skillCd}` documents, ranks skills worst first by accuracy,
and builds a question set weighted toward the difficulty the student is actually failing.
Skills with too few attempts are shown separately as limited evidence rather than being
ranked as weak. The page states the real question count and the difficulty mix before the
set starts, then hands off to `sat/questions.html` with `mode=tailored`, so the existing
player and `recordAttempt()` close the loop. Spec is in
`korah-bot/docs/tailored-practice-spec.md`.

## Full length practice tests (#29)
`korah-bot/sat/practice-test/index.html`, `player.html`, `player.js`, `practice-test.css`
Data in `korah-bot/docs/practice-tests/test-4/` and `test-11/`

Two official tests extracted from the College Board PDFs into JSON, with question images,
answer keys and conversion tables. The player is a one way state machine: RW Module 1, RW
Module 2, a ten minute break, Math Module 1, Math Module 2, then results. Per module
countdowns, no navigating back into a submitted module, a reference sheet and Desmos.
Scoring looks the raw count up in that test's conversion table and reports a range, never a
single number. Results live on the hub page. The section is behind the auth wall and the
source PDFs are not shipped.

## Grey color blocking on the study pages (#47)
`korah-bot/study/study-grey.css`, `korah-bot/study/custom-select.css`,
`korah-bot/study/js/custom-select.js`, all 8 pages in `korah-bot/study/`

No `linear-gradient` and no native `<select>` left in `korah-bot/study/`. The feed hero,
toolbar, cards and empty state use `--kg-sf`, `--kg-sf2` and `--kg-bd`. The four remaining
native selects were replaced with the shared custom dropdown, which was pulled out of
`feed.html` into its own stylesheet and script. Feed cards are toned by item type. The
pattern is written up in `docs/WIZARD-UI-PATTERNS.md`.

## Other changes on this branch

* Latest Questions page at `korah-bot/sat/latest-questions.html`, linked from the bank page
  and the sidebar. See #37, which is not closed yet.
* Grey color blocking applied to the sidebar, home, chat, SAT dashboard, SAT math chat and
  the SAT practice player. This is part of #30, which is still open.
* SAT player question layout, topbar, footer and navigator reworked.
* Commit message conventions added to `CLAUDE.md`.

# Temporarily Removed
* **Productivity page** (`korah-bot/productivity.html`) — sidebar links commented out in all 13 pages with `<!-- PRODUCTIVITY PAGE TEMPORARILY REMOVED - restore when ready to re-enable -->`. The page file itself is intact. To restore: uncomment those lines and add back the nav link: `<a href="[../]productivity.html" class="sidebar-nav-link productivity-link t-btn"><span class="material-icons-round" style="font-size: 1.25rem;">timer</span> <span class="nav-text">Productivity</span></a>`

# Next Updates
* Need to add Google Drive API for document creation
* Need to add "Import from Quizlet" option for study items
* Focus-based learning integration
  * Daily focus check-in
  * Study-tip of the day
  * Suggest practices for boosting focus or calmness
  * Suggest certain study techniques
  * Send user-mood in AI prompt
* PR for `main` onto `deployment`
* web_fetch tool for the most up-to-date indo
* sat_question fetch tool (chatbot to output SAT problems, JSON formatted)

# Potential Updates
* Find API's for AP classes and make a page regarding AP prep.
* Remake korah landing page to be a 3d scroll interative website that explains the app and introduces it (Maybe using figma or something else). When the users enter, everything like dark (but still a bit visible) with "Korah A.I" lightened up and as they keep scrolling, everything listens up and there are 3d very well animated iphone with korah explaining features.
* Add sat question prep on korah app.
* Add user settings in korah app for user experience.
* Add mood based option like "full focus mode" to match how it is in korah and depending on the mood tips and advice or positive things show up for the user.


# API Route Map (korah-bot)

Endpoint names are intentionally short to avoid leaking provider/source info in DevTools.

| Route | File | Purpose |
|-------|------|---------|
| `POST /api/r` | `api/r.js` | Gemini AI proxy (translates OpenAI-format → Gemini) |
| `GET /api/sat/q` | `api/sat/q.js` | SAT question list (filtered stubs + first batch detailed) |
| `GET /api/sat/qi` | `api/sat/qi.js` | Single SAT question detail (lazy-loaded on navigation) |
| `GET /api/sat/s` | `api/sat/s.js` | Question bank stats (counts by domain/difficulty) |

Client files that call these routes: `app/korah-chat.js`, `sat/math-chat.js`, `study/js/study-api.js`, `sat/questions.html`, `sat/js/sat-player.js`, `sat/js/sat-bank.js`.

> Do NOT rename these back to descriptive names (e.g. `gem-proxy`, `sat/questions`). The short names are intentional.

TIPS FOR DEVELOPMENT SOURCE CONTROL
* You can't use LiveServer to preview your changes. As you go, you're gonna have to make a commit, wait a bit, then check Korah.app. 
* If you make a mistake just use `git reset --hard HEAD~1  \n  git push --force-with-lease origin BRANCH-NAME` and it'll revert the branch to what it was before your last commit. The next time you commit, it'll update the website.

You can do any other UI updates you think are fit, but make sure these are done first for release. 
