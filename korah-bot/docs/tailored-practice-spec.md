# Tailored Practice specification

> **Status:** Proposed. This specification must be reviewed before implementation.
>
> **Issue:** #28, Tailored practice: spec it out, then build it
>
> **Research:** `korah-bot/docs/tailored-practice-research.md`

## 1. Diagnosis

### What is actually needed

Korah needs a Tailored Practice page that uses a student's existing SAT
performance data to identify their weakest skills. The page will rank those
skills by how urgently the student should prioritize them, explain why each
skill received its ranking, and let the student generate around 20 targeted
questions in the existing SAT question player.

The ranking is not just a list sorted by raw accuracy. It represents Korah's
recommended practice order. It must account for both how often the student
misses a skill and how much evidence Korah has for that conclusion.

### Where it fits

The feature will use `getAllSkillStats()` from `sat/js/sat-analytics.js` as its
main input. The SAT catalog in `sat/js/sat-shared.js` will convert stored skill
codes into student-friendly skill and domain names. The page will follow the
Firebase and authentication setup in `sat/dashboard.html` and the standalone
SAT mode structure in `sat/rush.html`.

After selecting skills, difficulties, and exact questions, the page will build
a URL for `sat/questions.html`. The existing player will render the questions
and call `recordAttempt()` when the student checks an answer. This automatically
updates `satSkills`, `satAttempts`, and `satTotals`, so the next Tailored
Practice ranking can change as the student improves.

### Expected scope

The work should add one Tailored Practice page, its controller, its styles, and
entry points from the existing SAT navigation. It may make small changes to the
shared URL contract and player so attempts can be recorded with
`mode: "tailored"`.

It will not add a new question player, Firestore collection, analytics system,
AI model, or backend question source.

### How we will know it is done

The feature is complete when:

1. A signed-in student with SAT history can open Tailored Practice.
2. Their weakest skills appear in order of practice priority.
3. Each recommendation shows attempts, accuracy, priority, and why Korah thinks
   the student should focus on that skill.
4. The ranking communicates what the student should practice first, not just
   which skill has the lowest raw accuracy.
5. The student can generate around 20 questions targeting the highest-priority
   skills.
6. Those questions open in the existing SAT player.
7. Answers update the existing SAT analytics records.
8. Returning to Tailored Practice recalculates priorities from the new results.
9. A student with little or no history sees a useful next step instead of an
   empty or misleading ranking.

---

## 2. Product goals

### Primary goal

Help a student decide what to practice next and immediately begin a focused
question set based on their own performance.

### Supporting goals

- Make every recommendation explainable.
- Avoid treating a very small sample as a confident diagnosis.
- Give the student a useful mix of question difficulties.
- Reuse Korah's existing question player and analytics loop.
- Keep the first version understandable enough to present and maintain.

### Non-goals

- Predicting an official SAT score.
- Recreating College Board's private selection algorithm.
- Using an LLM to choose questions.
- Creating new Firestore documents for recommendations or sessions.
- Rebuilding the question player, explanations, XP, or progress tracking.
- Claiming that an unattempted skill is a weak skill.
- Using question bank inventory as a substitute for official SAT test frequency.

The last point is intentional. The number of questions available in the bank is
not proof of how important a skill is on the real test. A future version can add
official blueprint weights after the team validates and stores a reliable
source. Version one will define priority as the student's evidence-backed need
for practice.

---

## 3. User experience

### Entry points

Tailored Practice will be linked from:

- The SAT dashboard as a main practice action.
- The shared SAT navigation or sidebar near Question Bank and Practice Rush.

The route will be `sat/tailored.html`.

### Main flow

1. The student opens Tailored Practice.
2. The page authenticates the user and loads their skill statistics.
3. Korah calculates and displays the ranked practice priorities.
4. The student reviews why the skills were selected.
5. The student clicks **Build my practice set**.
6. Korah selects around 20 questions from the chosen skills and difficulty mix.
7. The browser opens `questions.html` with the exact question IDs and
   `mode=tailored` in the URL.
8. The student answers questions in the existing player.
9. The player records each result through the existing analytics system.
10. When the student later returns, the page builds a new ranking from the
    updated statistics.

### Page content

The page will contain:

1. A short introduction explaining that the recommendations come from the
   student's Korah SAT activity.
2. A summary such as "Based on 48 answered questions across 9 skills."
3. A compact ranked list of practice priorities.
4. A short explanation on every priority row.
5. A difficulty preview for the generated set.
6. A summary of which skills and how many questions will be included.
7. A primary **Start tailored practice** button.
8. A link back to the Question Bank for students who want manual control.

### Priority row content

Each ranked row will show:

- Numeric rank and practice order.
- Skill name and domain.
- Section, either Math or Reading and Writing.
- Attempts and correct answers.
- Accuracy percentage.
- Missed-question count.
- Planned question count and target difficulty.
- A sentence explaining the recommendation.

Example explanation:

> You missed 6 of 9 Linear Functions questions, so this is the first skill to
> practice.

The numeric priority score and confidence level remain internal implementation
details. The student-facing interface shows the recommended order and a direct
explanation without exposing evidence labels or confidence terminology.

---

## 4. Product design artifacts

### Design direction

Tailored Practice should look like part of Korah's SAT tools, not a separate
template copied from another product. It will reuse the current app shell,
sidebar, typography, surface tokens, purple accent, light and dark themes, and
visible focus styles.

The SAT dashboard is the main visual reference because this feature presents
performance evidence. Practice Rush is a secondary reference for the main
practice action and friendly motivational language.

21st.dev may be used to study status-list, progress-card, and responsive layout
ideas. Components must not be copied directly because many 21st.dev examples use
React, Shadcn, and animation dependencies that Korah does not use on these
pages. Any useful idea should be rebuilt with the existing HTML, CSS, and
JavaScript patterns.

### Visual references reviewed

The product direction is based on screenshots of the current Korah home
dashboard, Korah Question Bank, Korah Practice Rush setup and player, College
Board's My Practice score cards, and College Board's Tailored Practice builder.

| Reference | What to reuse | What not to copy |
|-----------|---------------|------------------|
| Korah home dashboard | Star background, persistent sidebar, typography, and readable number hierarchy | The metric-card grid and large collection of dashboard panels |
| Korah Question Bank | Two-column SAT content layout, mascot illustration, purple surfaces, and clear topic hierarchy | The oversized hero and full manual filter table |
| Korah Practice Rush setup | Full-width blue primary action and clear secondary action | The step-by-step wizard and repeated rounded selection cards |
| Korah Practice Rush player | Existing player scale, difficulty chips, progress treatment, and focused question area | Any new question-playing UI, because Tailored Practice hands off to `questions.html` |
| College Board score cards | A clear Tailored Practice entry point beside the performance evidence that produced it | Tying Korah's recommendation to one practice test, because Korah uses all stored activity |
| College Board Tailored Practice | Clear explanation of what data produced the set, visible question total, section and domain breakdown, performance bars, selection control, and one Start Practice action | White visual styling, dense instructions, 80-question default, and domain-only personalization |

### Final visual stance

The page should feel like Korah interpreted the student's data, not like Korah
embedded a College Board page.

- Keep Korah's dark star background and shared sidebar.
- Use a standard page header with a short description instead of a hero panel.
- Keep a small Korah mascot on desktop and hide it on narrow mobile screens.
- Use one compact source line, such as **20 questions across 4 priorities, based
  on 48 SAT answers**.
- Present priorities as rows inside one bordered list instead of separate
  floating cards.
- Use solid surfaces, subtle borders, restrained corner radii, and no decorative
  gradients, glass effects, glows, or hover movement.
- Use a solid blue primary action labeled **Start tailored practice**.
- Keep manual control available through the set summary and a link to Question
  Bank, but do not make the student rebuild the recommendation manually.
- Avoid adding charts that do not help the student decide what to practice.

### Desktop wireframe

```text
+--------------------+---------------------------------------------------------+
| Korah sidebar      | Tailored Practice                     [small mascot]    |
|                    | Practice the SAT skills that need attention first.     |
| Question Bank      | ------------------------------------------------------ |
| Desmos Chat        | 20 questions across 4 priorities, based on 48 answers. |
| Practice Rush      |                                                         |
| Tailored Practice  | Practice priorities                   Practice set      |
| Dashboard          | +----------------------------------+  +----------------+ |
|                    | | 1  Linear Functions             |  | 20 questions   | |
|                    | | Algebra | Math                  |  |                | |
|                    | | 33% accuracy | 3 of 9 correct   |  | Linear Func. 5 | |
|                    | | You missed 6 of 9 questions... |  | Boundaries   5 | |
|                    | +----------------------------------+  | Inferences   5 | |
|                    | | 2  Boundaries                   |  | Systems      5 | |
|                    | | 43% accuracy | 3 of 7 correct   |  |                | |
|                    | | You missed 4 of 7 questions... |  | Easy 6         | |
|                    | +----------------------------------+  | Medium 10      | |
|                    | | 3  Inferences                   |  | Hard 4         | |
|                    | | ...                            |  |                | |
|                    | +----------------------------------+  | [Start tailored| |
|                    | | 4  Systems                      |  |  practice]     | |
|                    | | ...                            |  |                | |
|                    | +----------------------------------+  | Choose manually| |
|                    |                                      +----------------+ |
+--------------------+---------------------------------------------------------+
```

Desktop behavior:

- Keep the ranked list as the main content because the explanation is the most
  important part of the feature.
- Use a standard header and small mascot so the priorities begin near the top.
- Keep the set summary visible beside the list on wide screens.
- Use one ordered list surface with separated rows instead of a stack of cards.
- Keep the main action inside the set summary instead of repeating it on every
  skill row.

### Mobile wireframe

```text
+--------------------------------+
| < Back       Tailored Practice |
+--------------------------------+
| Tailored Practice              |
| Practice skills needing        |
| attention first.               |
| Based on 48 SAT answers.       |
|                                |
| Practice priorities            |
| +----------------------------+ |
| | 1  Linear Functions       5| |
| |    Algebra | Math          | |
| |    33% | 3 of 9 correct    | |
| |    You missed 6 of 9...    | |
| |----------------------------| |
| | 2  Boundaries             5| |
| |    43% | 3 of 7 correct    | |
| |----------------------------| |
| | 3  Inferences             5| |
| |----------------------------| |
| | 4  Systems                5| |
| +----------------------------+ |
| Your set                      |
| +----------------------------+ |
| | 20 questions               | |
| | 4 skills                   | |
| | 6 Easy, 10 Medium, 4 Hard  | |
| |                            | |
| | [Start tailored practice]  | |
| +----------------------------+ |
+--------------------------------+
```

Mobile behavior:

- Collapse the desktop sidebar using Korah's existing responsive navigation.
- Hide the mascot when it would push priorities below the first screen.
- Stack priorities and set details in reading order.
- Keep row explanations readable instead of hiding them behind hover states.
- Make the main button full width with at least the existing Korah minimum
  touch-target size.
- Do not use a wide table for skill statistics.

### Product states to design before wiring data

The first product-design pass must include static versions of:

1. Normal ranked results.
2. Loading skeletons with the same final row height.
3. No SAT history.
4. Limited history with only one or two attempts.
5. One rankable skill and a ten-question set.
6. Question API error with retry.
7. A set with fewer than 20 available questions.

These states will be reviewed before the ranking and API logic are connected.

---

## 5. Input data

The page will call:

```js
window.KorahSATAnalytics.getAllSkillStats()
```

Each record may provide:

```js
{
  skillCd,
  domain,
  section,
  attempts,
  correct,
  byDifficulty: {
    E: { attempts, correct },
    M: { attempts, correct },
    H: { attempts, correct }
  },
  lastSeen
}
```

The implementation must treat missing counts as zero, clamp `correct` so it
cannot exceed `attempts`, and ignore `_unknown` skill records. It will join
`skillCd` to `window.KorahSAT.OPENSAT_CATALOG` for display names and validated
section and domain information.

The first version will also call `getRecentAttempts(50)` while building the set
so it can prefer unseen questions over questions the student just answered.

---

## 6. Practice-priority algorithm

### Why raw accuracy is not enough

A student who misses one question has 0% accuracy, but one result is not enough
to confidently call that skill their greatest weakness. The algorithm needs to
reduce the effect of tiny samples while still recognizing a serious early
pattern.

### Data groups

Skills are separated before ranking:

| Attempts | Group | Treatment |
|----------|-------|-----------|
| 0 | Unexplored | Not called weak and not included in the priority ranking |
| 1 to 2 | Limited evidence | Shown separately, but not used for the main tailored set when stronger evidence exists |
| 3 or more | Rankable | Included in the practice-priority calculation |

If no skill has at least three attempts, the page will show a low-data state and
send the student to Question Bank or Practice Rush to build enough history.

### Priority formula

For every rankable skill:

```text
incorrect = attempts - correct
smoothedMissRate = (incorrect + 2) / (attempts + 4)
confidence = min(attempts / 10, 1)
priorityScore = 100 * smoothedMissRate * (0.7 + 0.3 * confidence)
```

`smoothedMissRate` uses two imaginary correct and two imaginary incorrect
answers as a neutral starting point. This prevents three real attempts from
being treated with the same certainty as thirty attempts.

`confidence` reaches its maximum at ten attempts. It changes only 30% of the
final score, so a clear weakness with three or four attempts can still appear
high in the ranking, but a tiny sample does not completely control the result.

Skills are sorted by:

1. Higher `priorityScore`.
2. More attempts when scores are equal.
3. Skill code for a stable final tie-break.

`lastSeen` will be displayed as context but will not change the score. Recency
does not prove mastery, and an old weakness should not disappear only because
the student has avoided it.

### Worked ranking examples

| Results | Treatment | Approximate priority score |
|---------|-----------|----------------------------|
| 0 correct out of 1 | Limited evidence, not ranked | Not applicable |
| 0 correct out of 3 | Rankable, severe early pattern | 56.4 |
| 5 correct out of 10 | Rankable, established 50% accuracy | 50.0 |
| 9 correct out of 10 | Rankable, lower practice need | 21.4 |

These examples show the intended behavior. One missed question does not become
the student's first priority. Three misses out of three can outrank a moderate
weakness because the pattern is severe, but the score still reflects that the
sample is small.

### Confidence visibility

Attempt count and the numeric confidence factor remain available to the ranking
logic and diagnostics. The page must not translate them into student-facing
labels such as **Developing evidence**, **Solid evidence**, or **Strong
evidence**. Students only need the resulting priority order and the activity
numbers they already understand.

### Skills selected for a set

The generator will select up to the first four rankable skills.

| Rankable skills available | Skills used | Planned questions |
|---------------------------|-------------|-------------------|
| 4 or more | Top 4 | 5, 5, 5, 5 |
| 3 | Top 3 | 7, 7, 6 |
| 2 | Top 2 | 10, 10 |
| 1 | Top 1 | 10, with a limited-personalization notice |
| 0 | None | No generated set until more history exists |

If the question bank does not contain enough matching questions for a skill,
unused slots will move to the next selected skill. The page will state the real
question total before launch instead of promising 20 and silently returning
less.

---

## 7. Difficulty selection

Difficulty is selected separately for each chosen skill from its
`byDifficulty` statistics.

### Target difficulty

1. Consider only difficulty levels with at least three attempts.
2. Starting at Easy, choose the lowest level where accuracy is below 70%.
3. If Easy is at least 70% but Medium is below 70%, target Medium.
4. If Easy and Medium are at least 70% but Hard is below 70%, target Hard.
5. If Hard is weak but Medium has fewer than three attempts, target Medium
   first. Korah should not jump over an unproven foundation level.
6. If no difficulty has three attempts, use overall skill accuracy:
   - Below 50% targets Easy.
   - 50% or higher targets Medium.
7. If every attempted difficulty is at least 70%, target the next harder level
   when one exists. This keeps the practice useful without immediately jumping
   from weak fundamentals to mostly Hard questions.

### Question mix per five slots

| Target | Mix |
|--------|-----|
| Easy | 3 Easy, 2 Medium |
| Medium | 1 Easy, 3 Medium, 1 Hard |
| Hard | 2 Medium, 3 Hard |

For allocations larger than five, the same proportions will be rounded while
preserving the largest share for the target difficulty. Missing inventory will
be filled from an adjacent difficulty, preferring the easier adjacent level
before the harder one.

This design avoids giving a student only Hard questions in their weakest skill.
It includes challenge, but it also gives them a reasonable path to rebuild the
skill.

---

## 8. Question selection and player handoff

### System flow

```text
Firebase Authentication
        |
        v
sat/tailored.html
        |
        +--> getAllSkillStats() and getRecentAttempts(50)
        |            |
        |            v
        |    Normalize and join SAT catalog labels
        |            |
        |            v
        |    Rank practice priorities
        |            |
        |            v
        |    Select skills and difficulty allocations
        |            |
        +--> /api/sat/q for candidate question stubs
                     |
                     v
            Stable exact question selection
                     |
                     v
        questions.html?questionIds=...&mode=tailored
                     |
                     v
             Existing SAT question player
                     |
                     v
                recordAttempt()
                     |
                     v
       Existing satAttempts, satSkills, and satTotals
                     |
                     v
       Next visit produces an updated priority ranking
```

### Candidate loading

The page will make one combined request to `/api/sat/q` using the selected
skills, sections, domains, and all required difficulty levels. One request is
more efficient than making a separate request per skill and still returns the
metadata needed to balance the exact set. The existing player remains
responsible for the final question experience.

The client will:

1. Group returned candidates by difficulty.
2. Prefer questions not found in the student's 50 most recent attempts.
3. Fill the planned difficulty allocation.
4. Use recently attempted questions only when there are not enough unseen
   candidates.
5. Remove duplicates across selected skills.
6. Redistribute empty slots to the next highest-priority skill.

No API route changes are expected.

### Stable selection

Clicking the button twice with unchanged analytics should return the same set.
Changing sets without changing the evidence would make the recommendation feel
arbitrary.

Candidate order will be determined by a small seeded hash based on:

```text
user ID + selected skill statistics + question ID
```

The same statistics produce the same ordered candidates. After the student
answers questions, attempts and correct counts change, which changes the seed
and allows the next set to change. This requires no new persisted session data.

### URL contract

After selecting exact IDs, the page will use
`KorahSAT.buildOpenSatV1QuestionUrl()` to produce a URL similar to:

```text
./questions.html?questionIds=id1,id2,id3&limit=20&mode=tailored
```

Because the IDs have already been selected in a stable order, `random=1` should
not be used in the final implementation unless testing confirms it only changes
presentation order without changing membership. Stability is more important
than unnecessary randomness.

The shared URL parser and builder will add a restricted `mode` value. The player
will record:

```js
mode: query.mode === "tailored" ? "tailored" : "player"
```

No arbitrary mode value from the URL will be written. Only `tailored` will be
accepted as the alternative to the normal `player` mode.

---

## 9. Page states

### Loading

- Show skeleton cards while authentication and Firestore data load.
- Keep the primary action disabled until ranking finishes.
- Show progress text while candidate questions are selected.

### Ready

- Show ranked priorities and the planned set.
- Show the total SAT answers used without exposing confidence labels.
- Enable the build button.

### No history

If the student has no attempted skills:

- Do not display fake weakness rankings.
- Explain that Korah needs a small amount of practice history.
- Link to Question Bank and Practice Rush.
- Tell the student that three attempts in a skill are needed before Korah ranks
  it as a priority.

### Limited history

If all skills have only one or two attempts:

- Show a simple **Still learning about you** state.
- Do not expose per-skill confidence or call the skills weaknesses.
- Provide the same Question Bank and Practice Rush actions.

If exactly one skill is rankable, allow a smaller ten-question set and state
that personalization will improve as more skills receive attempts.

### Error

- Authentication failures use the existing auth wall or login flow.
- Firestore failures show a retry action without inventing recommendations.
- Question API failures keep the ranking visible and let the student retry set
  generation.
- If fewer questions exist than planned, show the actual count and allow launch
  when at least five questions are available.

---

## 10. Accessibility and responsive design

- Use semantic headings and ordered-list markup for the ranking.
- Do not communicate priority, confidence, or difficulty with color alone.
- Provide visible keyboard focus for every interactive control.
- Make loading and error updates available through an appropriate live region.
- Keep text and controls readable at narrow mobile widths.
- Respect reduced-motion preferences.
- Use existing Korah color, spacing, card, sidebar, and button patterns.
- Maintain sufficient contrast for secondary text and status labels.

---

## 11. File plan

| File | Planned change |
|------|----------------|
| `sat/tailored.html` | New authenticated page shell, ranked-priority UI, loading states, and actions |
| `sat/js/sat-tailored.js` | Normalize statistics, rank skills, select difficulties and questions, explain recommendations, and build the player URL |
| `sat/tailored.css` | Responsive Tailored Practice styles matching current Korah SAT patterns |
| `sat/js/sat-shared.js` | Parse and emit the restricted `mode=tailored` query parameter |
| `sat/js/sat-player.js` | Pass `tailored` to `recordAttempt()` when launched from Tailored Practice |
| `sat/dashboard.html` | Add the main Tailored Practice entry point |
| `sidebar.html` | Add Tailored Practice to shared SAT navigation if approved |
| `docs/tailored-practice-spec.md` | This diagnosis and implementation specification |

No changes are planned for `/api/sat/q`, `/api/sat/qi`, Firestore structure, or
the question rendering system.

---

## 12. Implementation order

Implementation will begin only after this specification is approved.

### Phase 0: Product design first

1. Review the desktop and mobile wireframes in this specification.
2. Build a static Tailored Practice page with believable fixture data.
3. Add static loading, no-history, limited-history, and error states.
4. Check the design at desktop and mobile widths.
5. Compare it with the SAT dashboard, Question Bank, and Practice Rush.
6. Get feedback on the product design before connecting Firestore or the API.

### Phase 1: Prove the data flow

1. Add the authenticated page shell.
2. Load `getAllSkillStats()`.
3. Normalize and join records to the SAT catalog.
4. Display all attempted skills with attempts and accuracy.
5. Verify displayed values against the SAT dashboard or Firestore data.

No question generation will be added until this phase is verified.

### Phase 2: Rank priorities

1. Add the minimum-attempt grouping.
2. Add the smoothed priority formula.
3. Add stable sorting while keeping confidence labels internal.
4. Display the ordered recommendations and explanations.
5. Verify the formula with fixed sample records.

### Phase 3: Build the set

1. Select up to four priority skills.
2. Calculate target difficulties and slot allocations.
3. Fetch candidate stubs from `/api/sat/q`.
4. Prefer unseen questions and perform stable selection.
5. Display the final set summary and actual question count.

### Phase 4: Hand off and close the loop

1. Add the restricted `mode=tailored` URL parameter.
2. Build the `questionIds` URL.
3. Launch the existing player.
4. Answer test questions.
5. Confirm new attempts contain `mode: "tailored"` and update `satSkills`.
6. Return to Tailored Practice and verify the ranking recalculates.

### Phase 5: Product polish

1. Add dashboard and navigation entry points.
2. Complete loading, low-data, empty, and error states.
3. Test keyboard, mobile, and reduced-motion behavior.
4. Review all copy so students understand why each priority was selected.

---

## 13. Verification plan

### Algorithm cases

- Zero attempts does not create a weakness recommendation.
- One wrong answer out of one remains limited evidence.
- Two attempts remain limited evidence.
- Three attempts become rankable.
- A severe three-attempt weakness can rank above a mild ten-attempt weakness.
- A well-supported high miss rate ranks above a well-supported low miss rate.
- Equal scores resolve in a stable order.
- Missing or malformed counters do not produce `NaN` or negative values.

### Difficulty cases

- Weak Easy performance produces an Easy-heavy mix.
- Strong Easy and weak Medium performance targets Medium.
- Strong Easy and Medium with weak Hard performance targets Hard.
- Sparse difficulty data falls back to overall accuracy.
- Missing difficulty inventory falls back to an adjacent level.

### Integration cases

- An authenticated student can load their actual `satSkills` records.
- The displayed attempts and correct counts match existing dashboard data.
- The generated IDs match the selected skills and difficulty plan.
- The URL opens the existing question player with the expected count.
- Checking an answer creates one attempt, not duplicate attempts.
- Tailored attempts are stored with `mode: "tailored"`.
- `satSkills` and `satTotals` update without new Firestore document types.
- Returning to the page recalculates the ranking.

### Product cases

- No-history and limited-history students receive clear next actions.
- The recommendation explanation is understandable without seeing the formula.
- The page works on mobile and desktop widths.
- The full flow is usable with a keyboard.
- API and Firestore errors can be retried.

---

## 14. Efficiency and performance review

### Efficiency review

The planned design is intentionally small and reuses the expensive parts Korah
already has:

| Decision | Efficiency reason |
|----------|-------------------|
| Read `satSkills` once | The collection already contains the required aggregates, so attempt history does not need to be recomputed |
| Read only 50 recent attempts | This is enough to avoid immediate repeats without loading the full attempt log |
| Rank in the browser | A user's skill list is small, so a new recommendation API would add latency and maintenance without useful scale benefits |
| Make one combined candidate request | Selected skills, sections, domains, and difficulties can share one request, then be balanced locally |
| Fetch question stubs only | Full stems, options, and explanations remain the existing player's responsibility |
| Pass exact IDs to `questions.html` | This guarantees the planned skill balance without creating another player |
| Reuse `recordAttempt()` | One existing analytics path prevents duplicate writes and inconsistent statistics |
| Use a deterministic local hash | Stable sets require no new Firestore session document or recommendation cache |

The following alternatives are rejected for version one:

- A new Firestore recommendation collection, because recommendations can be
  calculated from current aggregates.
- A new backend recommendation route, because the input is already available
  to the authenticated client and the calculation is small.
- An AI-generated ranking, because the data supports a transparent formula and
  students should receive consistent results.
- A new question player, because the current player already handles rendering,
  timing, explanations, analytics, and lazy detail loading.
- Separate API calls for every difficulty, because one skill request can return
  all needed difficulty buckets.

### Performance standards

- Load skill rankings with one `getAllSkillStats()` read operation.
- Do not download full question details on the Tailored Practice page.
- Request candidate lists only for selected skills.
- Run ranking and selection in the browser without blocking interaction.
- Show a loading state immediately for network-dependent work.
- Avoid duplicate Firestore reads during a single page load.
- Reuse the player's existing lazy hydration for full question content.
- Calculate ranking and selection without visible main-thread delay for the
  current SAT skill catalog.
- Keep the loading skeleton dimensions stable so content does not jump when
  network responses arrive.

---

## 15. Decisions requiring review

The following choices should be confirmed before implementation:

1. Is three attempts the correct minimum before a skill can be called a
   practice priority?
2. Should the first version rank Math and Reading and Writing together, or show
   separate ranked lists by section?
3. Is a ten-question set acceptable when only one skill has enough data?
4. Should recent attempted questions be avoided for the last 50 attempts, or
   should the feature allow immediate repeats?
5. Should Tailored Practice appear in both the SAT dashboard and shared sidebar?
6. Is `mode=tailored` the preferred analytics label and URL parameter?
7. Should a future version add official SAT blueprint weights after a reliable
   data source is approved?
