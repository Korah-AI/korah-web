# Vocabulary Wordbank Practice — Reference Outline

Reference notes on how the vocabulary practice section of the MySATPrep open-source project works. Source: `open-source/MySATPrep` (Next.js 15 App Router).

The accompanying `cleaned_sat_vocabulary.json` is the static word database used by every practice mode (~800 SAT words). It is a tracked copy of the upstream repo's `src/static-data/cleaned_sat_vocabulary.json`.

---

## 1. Entry point & routing

- `src/app/dashboard/vocabs/practice/page.tsx` — Next.js App Router page. Heavy SEO metadata + JSON-LD, renders:
  - `<PracticeBanner />` — one-time dismissible banner reminding the user that progress is stored locally (`practice-banner` flag in `localStorage`).
  - `<VocabsPracticePage_Main />` — the actual practice surface.
- Sibling route `src/app/dashboard/vocabs/learn` is where users first add words to `learntVocabs`.

## 2. Mode selector — `components/dashboard/vocabs/practice/practice.tsx`

- Reads `vocabsData` from `localStorage` via `useLocalStorage("vocabsData", { learntVocabs: [], userSentences: {} })`.
- Gating:
  - `learntVocabs.length === 0` → "No Vocabularies to Practice" empty state, CTA → `/dashboard/vocabs/learn`.
  - `learntVocabs.length < 5` → "Learn at least 5 words" gate.
- Otherwise renders a `RadioGroup` of 6 practice modes (icon + label + description; two flagged `aiPowered`):
  1. **Definition Quiz** → `quiz.tsx`
  2. **Vocab Quiz** → `vocab-quiz.tsx`
  3. **Vocabs Match** → `vocabs-match.tsx`
  4. **Fill in the Blank** → `fill-in-the-blank.tsx`
  5. **Define** (AI) → `define.tsx`
  6. **Form a Sentence** (AI) → `form-a-sentence.tsx`
- "Start Practice" sets `isStarted=true`; `renderPracticeComponent()` switches on `selectedMethod` and passes `onBackToPracticeSelection`. Sound effects via `playSound` on hover/click/tap-radio.

## 3. Shared data model — `src/types/vocabulary.ts`

- `vocabs_database` is built at module load from `src/static-data/cleaned_sat_vocabulary.json` (~800 SAT words, each with `definition`, `example`, `part_of_speech`, `difficulty`, `categories`, etc.).
- Two localStorage stores power the whole feature:
  - **`vocabsData`** — `{ learntVocabs: string[], userSentences: { [word]: string[] } }` (the wordbank).
  - **`practicePerformanceData`** — `PracticePerformanceData`:
    - `attempts: QuizAttempt[]` — every answer recorded with `questionType`, `isCorrect`, `userAnswer`, `correctAnswer`, `timeSpent`, `timestamp`, `difficulty`.
    - `wordPerformance: { [word]: WordPerformance }` — per-word `totalAttempts`, `correctAttempts`, `incorrectAttempts`, `averageTimeSpent`, `consecutiveCorrect/Incorrect`, `strugglingAreas[]`, and a derived `masteryLevel: "struggling" | "learning" | "proficient" | "mastered"`.
    - Roll-ups: `overallAccuracy`, `strongWords[]`, `weakWords[]`, `improvingWords[]`.
- `useLocalStorage` (in `src/lib/useLocalStorage.ts`) wraps `useState` + `JSON.stringify` writes with quota-exceeded handling.

## 4. Practice mode anatomy (shared pattern)

Every mode component follows the same blueprint:

1. **State** — a `useReducer` with mode-specific state (current index, selected answer / typed input, score, `answeredQuestions[]`, `userAnswers[]`, `isComplete`, `questionStartTime`, `restartKey`).
2. **Data sources** — `useLocalStorage` for both `vocabsData` and `practicePerformanceData`.
3. **Question generation** (`useMemo`):
   - Filter `vocabs_database` down to `learnedWords` (words the user has added).
   - **Adaptive ordering** — bucket each learned word by its `masteryLevel` (from `wordPerformance`) into `notPracticed → struggling → learning → proficient → mastered`, shuffle within each bucket, concatenate (low-mastery first = spaced-repetition-ish prioritization).
   - **Distractors** — pull 3 wrong options preferring the same `part_of_speech`, falling back to other words; shuffle in the correct answer.
4. **Submission flow**:
   - Compute `timeSpent` from `questionStartTime`.
   - `dispatch SUBMIT_ANSWER`, play `correct-answer.wav` / `incorrect-answer.wav`.
   - Call `updateWordPerformance(word, isCorrect, timeSpent)` — guarded so revisited questions don't double-count.
5. **Mastery calculation** (duplicated in every mode):
   ```
   accuracy >= 0.9 && consecutiveCorrect >= 3 → mastered
   accuracy >= 0.7 && consecutiveCorrect >= 2 → proficient
   accuracy >= 0.5                            → learning
   else                                       → struggling
   ```
   Re-derives `strongWords`/`weakWords`/`improvingWords` after every attempt.
6. **Navigation** — Previous/Next, `LOAD_QUESTION_STATE` repopulates the input/selection on revisit, `RESTART_QUIZ` bumps `restartKey` to force the `useMemo` to regenerate questions.

## 5. Per-mode specifics

- **`quiz.tsx` (Definition Quiz)** — show the word, pick the correct definition from 4 options. Pure local logic. `strugglingAreas` tag: `"definition-quiz"`.

- **`vocab-quiz.tsx` (Vocab Quiz)** — inverse of above: show a definition, pick the correct word. Same reducer pattern.

- **`vocabs-match.tsx` (Vocabs Match)** — drag-and-drop word↔definition pairs in rounds (`WORDS_PER_ROUND` per round). Different from the others:
  - Question pool **mixes learned + unlearned** (~60/40, capped at 40 total) so the user *discovers* new words.
  - When a previously-unlearned word is matched correctly, it's added to `vocabsData.learntVocabs` via `addToLearnedVocabs`, and tracked in `matchState.newlyLearnedWords` for the results screen.

- **`fill-in-the-blank.tsx`** — uses the word's `example` sentence (or one of the user's saved sentences) with the target word replaced by a blank. Choose the missing word from 4 options.
  - Pre-filters words whose `example` actually contains the word (regex `\bword\b`).
  - When both a DB example and saved user sentences exist for a word, picks user-sentence ~50% of the time → personalizes drill content over time.

- **`define.tsx`** (AI) — free-text: user types a definition for the shown word.
  - `POST /api/chat` with `task: "validate-user-definition"`, body `{ word, userDefinition, correctDefinition, exampleSentence }`.
  - Response `{ correct, aiResponse, hint, exampleSentence }` drives correctness + the displayed feedback.
  - Fallback: local `evaluateDefinition` heuristic if the AI request fails / returns non-JSON.

- **`form-a-sentence.tsx`** (AI) — user writes a sentence using the word.
  - `POST /api/chat` with `task: "validate-user-sentence"`, body adds `partOfSpeech`.
  - On a correct sentence, calls `saveUserSentence(word, sentence)` which appends to `vocabsData.userSentences[word]` — these later feed Fill-in-the-Blank.
  - Fallback: local `evaluateSentence` heuristic.

## 6. AI backend — `src/app/api/chat/route.ts`

- Single POST endpoint. Accepts only `task ∈ {"validate-user-definition", "validate-user-sentence"}` (else 400).
- Uses `@openrouter/ai-sdk-provider` + `generateText` from the `ai` SDK against `z-ai/glm-4.5-air:free` with `OPENROUTER_KEY`.
- `getSystem(task, data)` builds a task-specific system prompt that instructs the model to return strict JSON `{ correct, exampleSentence, aiResponse, hint }`.
- Server `JSON.parse`s the model text and wraps it as `{ result, success: true }`; on parse failure returns `{ success: false }` which clients handle as fallback.
- `maxDuration = 30`.

## 7. Data flow summary

```
learn page  ──writes──►  localStorage:vocabsData.learntVocabs
                                 │
                                 ▼
                       practice mode selector (gates by count)
                                 │
                                 ▼
                  per-mode component
                    ├── reads vocabs_database (static JSON)
                    ├── reads vocabsData (+ userSentences for fill-blank)
                    ├── reads practicePerformanceData
                    ├── generates adaptive questions (mastery-prioritized)
                    ├── submit ──► (AI modes) POST /api/chat ──► OpenRouter
                    └── writes  ──► practicePerformanceData (attempts, masteryLevel)
                                ──► vocabsData.userSentences  (sentence mode)
                                ──► vocabsData.learntVocabs   (match mode discovery)
```

Everything is client-side / `localStorage`-backed except the two AI validation calls. No DB, no auth — practice progress lives entirely in the browser, which is why the `PracticeBanner` exists.

---

## JSON shape (`cleaned_sat_vocabulary.json`)

```jsonc
{
  "words": [
    {
      "word": "...",
      "part_of_speech": "noun" | "verb" | "adjective" | ...,
      "definition": "...",
      "example": "...",        // sentence containing the word; used by fill-in-the-blank
      "page": 0,
      "categories": ["..."],
      "difficulty": "easy" | "medium" | "hard",
      "syllable_count": 0,
      "word_length": 0
    }
  ]
}
```
