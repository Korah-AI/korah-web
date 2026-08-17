# Korah application architecture

This document is a high-level map of the Korah web application. It explains the
user-facing pages, serverless API routes, persistence layer, and the main data
flows between them. Use it as an entry point when locating a feature or tracing
a request through the system.

> **Implementation note:** Route names in this document reflect the current
> repository. The Gemini chat proxy is `api/r.js` (not `api/gem-proxy.js`), and
> the SAT endpoints are the compact routes `api/sat/q.js`, `api/sat/qi.js`, and
> `api/sat/s.js`.

---

## 1. System overview

Korah is a student productivity and study platform built primarily with static
HTML, CSS, and browser JavaScript. Vercel-style serverless functions provide AI
and SAT question APIs. Firebase Authentication manages identity, while
Cloud Firestore stores user-owned data such as conversations, study materials,
and SAT analytics.

The primary user journey is:

```text
Landing page
  -> Login or account creation
  -> Authenticated dashboard
  -> Chat, study, productivity, or SAT tools
  -> Serverless APIs and/or Firestore
  -> Results rendered in the browser
```

Most authenticated pages initialize Firebase in the browser and expose the
shared Firestore adapter as `window.KorahDB`. Shared navigation is provided by
`sidebar.html` and `sidebar-loader.js`.

---

## 2. Frontend pages

### Public and account pages

| Page | Path | Responsibility |
|------|------|----------------|
| Landing page | `landing/index.html` | Public introduction to Korah, its features, and calls to action. It also contains the waitlist integration. |
| Login | `login.html` | Email sign-in, account creation, and Google authentication through Firebase Authentication. |
| Release page | `release/release.html` | Product release announcement and countdown experience, supported by `release/release.js` and `release/release.css`. |
| Support | `support/index.html` | Frequently asked questions, support information, and the contact experience. |

### Authenticated application pages

| Page | Path | Responsibility |
|------|------|----------------|
| Dashboard | `index.html` | Main page after login. Displays study activity and provides navigation into Korah's tools. |
| Chat | `chat.html` | AI chat workspace with conversation history and actions for generating study material. The UI logic lives primarily in `app/korah-chat.js`. |
| Productivity | `productivity.html` | Focus timer and task-management workspace. Timer behavior is supported by `app/timer-manager.js`. |
| Opportunities | `opportunities/opportunities.html` | Browser for internships, scholarships, competitions, and STEM programs. Opportunity data is supported by `app/data/stem-opportunities.js`. |

Authentication state is checked on protected pages with Firebase's
`onAuthStateChanged`. `auth-guard.js` provides shared route-protection behavior,
while individual pages also initialize the services they need.

---

## 3. Study tools

The study area supports three generated content types: flashcard sets, study
guides, and practice tests. Creation pages gather source material and generation
options; viewer pages render and persist the generated result.

| Feature | Path | Responsibility |
|---------|------|----------------|
| Study library | `study/feed.html` | Lists the signed-in user's saved study materials and provides entry points for creating new items. |
| New study item | `study/new.html` | Chooses the study format and starts the creation flow. |
| Flashcard creation | `study/flashcards.html` | Collects content and settings for an AI-generated flashcard set. |
| Flashcard viewer | `study/item.html` | Displays and reviews a saved flashcard set. |
| Study guide creation | `study/guide-create.html` | Collects source material and options for generating a study guide. |
| Study guide viewer | `study/guide.html` | Displays a generated or saved study guide. |
| Practice test creation | `study/test-create.html` | Configures and generates a practice test. |
| Practice test viewer | `study/test.html` | Runs and displays a generated practice test. |

### Shared study modules

- `study/js/study-firebase-init.js` initializes Firebase, observes the current
  user, and makes the shared database adapter available to study pages.
- `study/js/study-api.js` connects creation pages to
  `/api/generate-study-item`. It also uses `/api/r` as the shared chat/AI proxy
  where appropriate.
- `study/js/sidebar.js` loads study items from `window.KorahDB` for navigation.
- `app/data/firestore-store.js` supplies the common conversation and study-item
  persistence methods.

### Study generation flow

```text
Creation page
  -> study/js/study-api.js
  -> POST /api/generate-study-item
  -> Gemini generates structured content
  -> response is validated and normalized
  -> item is saved through window.KorahDB
  -> the matching viewer page renders it
```

The content type determines both the viewer and Firestore collection. The
shared store maps generated items into user-scoped collections such as
flashcard sets, study guides, and practice tests.

---

## 4. SAT tools

The SAT area combines a filterable question bank, a question player, an AI math
assistant, Practice Rush, and a progress dashboard.

| Feature | Path | Responsibility |
|---------|------|----------------|
| Practice setup / question bank | `sat/index.html` | Selects assessment, section, domain, skill, difficulty, and session filters before launching a question set. |
| Question player | `sat/questions.html` | Presents questions one at a time, checks answers, shows explanations, and provides tools such as Desmos and the SAT reference sheet. |
| SAT math chat | `sat/math-chat.html` | Math-focused AI chat using the shared Gemini proxy. |
| SAT dashboard | `sat/dashboard.html` | Displays progress, accuracy, XP, levels, bookmarks, skill performance, and practice activity. |
| Practice Rush | `sat/rush.html` | Gamified practice loop with onboarding, streaks, feedback, and session results. |

### Shared SAT modules

| File | Role |
|------|------|
| `sat/js/sat-shared.js` | Shared section/domain/skill catalog and query-string parsing/building. |
| `sat/js/sat-bank.js` | Question-bank filters, counts, selection state, and navigation into a practice session. |
| `sat/js/sat-player.js` | Question fetching, lazy detail loading, rendering, answer state, timing, explanations, and session filters. |
| `sat/js/sat-rush.js` | Practice Rush onboarding and gamified question loop. |
| `sat/js/sat-analytics.js` | Firestore-backed SAT profile, totals, attempts, bookmarks, skill statistics, XP, and practice time. |

For detailed notes about the question-bank filters and Practice Rush, see
`docs/sat-bank-filters.md` and `docs/practice-rush.md`.

### SAT question flow

```text
sat/index.html
  -> sat-bank.js builds a questions URL
  -> sat/questions.html parses the selection
  -> GET /api/sat/q returns the filtered question list
  -> GET /api/sat/qi?id=... lazily loads full question details
  -> sat-player.js renders and checks the answer
  -> sat-analytics.js records the attempt in Firestore
  -> dashboard and filters read the updated analytics
```

The list endpoint returns lightweight records for the complete filtered pool
and includes full detail for an initial batch. The player hydrates later
questions on demand, which keeps the initial response smaller without limiting
the session.

---

## 5. Serverless API routes

### AI routes

| Route file | HTTP endpoint | Responsibility |
|------------|---------------|----------------|
| `api/r.js` | `/api/r` | Proxies AI chat requests to Gemini. Used by the main chat, SAT math chat, SAT explanations, and parts of the study workflow. |
| `api/generate-study-item.js` | `/api/generate-study-item` | Generates structured flashcards, study guides, and practice tests with Gemini. Includes request validation, rate limiting, and output normalization. |

Both routes keep provider credentials on the server. Browser code sends the
prompt and generation settings to Korah's endpoint rather than calling Gemini
with a private API key.

### SAT routes

| Route file | HTTP endpoint | Responsibility |
|------------|---------------|----------------|
| `api/sat/q.js` | `/api/sat/q` | Returns question lists filtered by assessment, section, domain, skill, difficulty, IDs, limits, and randomization options. |
| `api/sat/qi.js` | `/api/sat/qi?id=...` | Returns full detail for an individual SAT question during lazy hydration. |
| `api/sat/s.js` | `/api/sat/s` | Returns aggregate question-bank statistics used to populate setup counts. |

`api/_lib/collegeboard.js` contains shared College Board data access and
normalization logic. `api/_lib/rate-limit.js` provides reusable request-rate
protection for serverless handlers.

---

## 6. Authentication and persistence

### Firebase Authentication

`login.html` supports email-based account access and Google sign-in through
`GoogleAuthProvider`. Authenticated pages observe the session with
`onAuthStateChanged`; pages can redirect unauthenticated visitors to login and
provide sign-out actions for active users.

### Cloud Firestore

User data is stored below the authenticated user's document namespace. The
central adapter in `app/data/firestore-store.js` handles the main application
records, while `sat/js/sat-analytics.js` owns SAT-specific analytics.

Representative paths include:

```text
users/{uid}/conversations/{conversationId}
users/{uid}/flashcardSets/{itemId}
users/{uid}/studyGuides/{itemId}
users/{uid}/practiceTests/{itemId}
users/{uid}/satProfile/main
users/{uid}/satTotals/summary
users/{uid}/satSkills/{skillCode}
users/{uid}/satAttempts/{attemptId}
users/{uid}/satBookmarks/{questionId}
satExplanations/{questionId}
```

The user-scoped paths isolate personal data. `satExplanations` is a shared
cache for generated question explanations and therefore has different access
requirements from user-owned collections.

### Data ownership

| Data | Writer | Primary reader |
|------|--------|----------------|
| Account/session state | Firebase Authentication | Protected frontend pages |
| Conversations | `app/data/firestore-store.js` | Dashboard and chat |
| Study materials | Study pages through `window.KorahDB` | Study library and viewers |
| SAT attempts and totals | `sat/js/sat-analytics.js` | Question player, filters, and SAT dashboard |
| SAT bookmarks | `sat/js/sat-analytics.js` | Question player and saved-question filters |
| Shared SAT explanations | Chat/explanation workflow through the store | SAT question player |

---

## 7. End-to-end feature flows

### AI conversation

1. The authenticated user opens `chat.html`.
2. `app/korah-chat.js` restores conversation history through `window.KorahDB`.
3. A message is sent to `/api/r`.
4. The serverless route calls Gemini and returns the model response.
5. The browser renders the response and persists the updated conversation.
6. Study-generation actions can hand content into the study creation workflow.

### Generated study material

1. The user selects flashcards, a guide, or a practice test.
2. The creation page collects the source text and generation options.
3. `study-api.js` posts the request to `/api/generate-study-item`.
4. The API validates the request, calls Gemini, and returns structured data.
5. The page saves the item to the appropriate user collection.
6. The corresponding viewer displays the saved result.

### SAT practice and analytics

1. The user selects filters in `sat/index.html`.
2. `sat-bank.js` launches `sat/questions.html` with the selection encoded in the
   query string.
3. The player fetches a filtered pool from `/api/sat/q` and details from
   `/api/sat/qi` as needed.
4. When the answer is checked, `sat-analytics.js` records correctness, time,
   skill, difficulty, and XP-related updates.
5. The SAT dashboard and user-specific bank filters read those stored results.

---

## 8. File map

```text
korah-bot/
|-- landing/                 Public marketing page
|-- login.html               Account access and Google sign-in
|-- index.html               Authenticated dashboard
|-- chat.html                Main AI chat shell
|-- productivity.html        Timer and task tools
|-- opportunities/           STEM opportunity browser
|-- release/                 Release announcement page
|-- support/                 Help and support page
|-- study/                   Study creation, library, and viewers
|   `-- js/                  Shared study API, Firebase, and sidebar modules
|-- sat/                     Question bank, player, Rush, math chat, dashboard
|   `-- js/                  SAT selection, player, analytics, and shared logic
|-- app/
|   |-- korah-chat.js        Main chat controller
|   |-- timer-manager.js     Productivity timer behavior
|   `-- data/                Firestore adapter and opportunity data
|-- api/
|   |-- r.js                 Gemini chat proxy
|   |-- generate-study-item.js
|   |-- sat/                 SAT list, detail, and statistics functions
|   `-- _lib/                Shared backend helpers
|-- sidebar.html             Shared application navigation
|-- sidebar-loader.js        Sidebar loading behavior
`-- auth-guard.js            Shared authentication guard
```

---

## 9. Development notes

- Keep private AI provider keys in server-side environment variables; do not
  embed them in frontend files.
- Preserve the separation between general user data
  (`app/data/firestore-store.js`) and SAT analytics
  (`sat/js/sat-analytics.js`).
- When adding a study content type, update the creation flow, viewer routing,
  and the collection mapping in the shared Firestore store together.
- When adding an SAT filter, update the bank state, URL query contract, shared
  parser/builder, and player or API filtering logic as appropriate.
- New authenticated pages should initialize Firebase consistently, enforce the
  signed-in state, and load shared navigation where applicable.
- Update this document when page paths, endpoint names, or ownership boundaries
  change.
