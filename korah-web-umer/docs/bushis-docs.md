# Korah App Overview

## Base Pages

- **index.html** - Home page for the Korah AI study companion app; Alpine.js-driven with theme/sidebar state
- **chat.html** - Main AI chat interface page
- **login.html** - Firebase-backed login page
- **productivity.html** - Productivity/focus tools page (timers, mood-based recommendations)
- **korah.js** - Shared Tailwind config (fonts, colors, animations) used across pages
- **auth-guard.js** - Polls Firebase auth state and redirects unauthenticated users
- **sidebar.html / sidebar-loader.js** - Shared sidebar markup and a loader script that fetches/injects it into any page

## API (Vercel serverless backend)

- **api/r.js** - Main chat proxy endpoint (CORS, size limits, forwards to Gemini)
- **api/generate-study-item.js** - Generates flashcards/guides/questions via Gemini
- **api/sat/q.js** - Fetches SAT question batches from College Board
- **api/sat/qi.js** - Fetches individual question details on demand
- **api/sat/s.js** - Fetches SAT bank stats (domain/skill breakdowns)
- **api/_lib/collegeboard.js** - Client wrapper for the College Board question-bank API
- **api/_lib/rate-limit.js** - In-memory IP-based rate limiter used by the API routes

## App Directory

- **app/korah-chat.js** - Frontend logic for the chat UI (sending messages, history, etc.)
- **app/timer-manager.js** - Persistent focus/study timer using localStorage
- **app/data/firestore-store.js** - Firestore CRUD/realtime layer exposed as `window.KorahDB`
- **app/data/stem-opportunities.js** - Static dataset of STEM programs/opportunities

## Internship Info

- **code/code.html** - Landing page for "Korah CODE," the dev internship

## Landing Page

- **landing/index.html** - Public marketing landing page for Korah
- **landing/google96f0cd18f1ed9592.html** and **landing/google96f0cd18f1ed9592 (1).html** - Google site-verification files (empty/verification tokens only)

## STEM Opportunities

- **opportunities/opportunities.html** - Browsable STEM opportunities listing page

## Hidden Release?

- **release/release.html** - "Coming soon" splash page
- **release/release.js** - Animated starfield/canvas background logic for that page

## SAT (SAT prep module)

- **sat/index.html** - SAT question bank landing page
- **sat/dashboard.html** - SAT progress dashboard
- **sat/math-chat.html** and **sat/math-chat.js** - AI math tutor chat UI and its single-call classify-and-solve logic
- **sat/questions.html** - Practice question player page
- **sat/rush.html** - Gamified endless practice mode page
- **sat/js/sat-shared.js** - Shared catalog data (sections/domains/skills) used across SAT pages
- **sat/js/sat-bank.js** - Question bank browsing/filtering logic
- **sat/js/sat-player.js** - Practice player logic (stopwatch, progress, calculator, question rendering)
- **sat/js/sat-rush.js** - Logic for the "Practice Rush" gamified mode
- **sat/js/sat-analytics.js** - Firestore-backed SAT performance tracking
- **sat/js/desmos-js-examples/desmos-sat-walkthrough.html** and **.js** - Standalone Desmos calculator demo replicating an SAT regression walkthrough

## Study Directory

- **study/feed.html** - Feed of study items/activity
- **study/new.html** - Create new study item chooser
- **study/flashcards.html** - Flashcard set creation page
- **study/guide.html** and **study/guide-create.html** - View/create study guides
- **study/item.html** - Single study item viewer
- **study/test.html** and **study/test-create.html** - View/create practice tests
- **study/js/sidebar.js** - Shared sidebar behavior (recent chats/items, modals) for study pages
- **study/js/study-api.js** - Client for generating study content via AI, with proxy fallback
- **study/js/study-firebase-init.js** - Shared Firebase init and auth/readiness signaling for study pages

## Support

- **support/index.html** - Support/help page
- **support/support.js** - Visual effects (starfield) plus FAQ search and nav tracking

## Transitions

- **transitions/page-transitions.js** - Handles page-to-page view transition animations
