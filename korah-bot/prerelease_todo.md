# Korah Bot Prerelease TODO

This checklist is grounded in the current `korah-bot/` codebase, not just the requested feature list. It separates immediate release blockers from larger feature work that will need product and implementation decisions.

## 1. Release blockers and high-priority fixes

### 1.1 Exit create form once Generate is clicked
- Status: bug / UX break
- Current code:
  - `study/new.html` opens the creation modal and keeps it visible during AI generation.
  - On generate, the loading overlay appears, but the creation modal is not closed first.
- Why this matters:
  - The current flow feels stacked and unfinished. The user is still inside the form while generation is already underway.
- Likely implementation:
  - Close or transition the creation modal immediately after a valid AI submission starts.
  - Decide whether the loading overlay should take over the full screen or whether the user should land back on `feed.html` with a pending-generation state.
- Files:
  - `study/new.html`

### 1.2 Fix prompting and rendering for study guides
- Status: likely release blocker
- Current code:
  - `study/js/study-api.js` and `api/generate-study-item.js` ask Gemini for markdown study guides.
  - `study/guide.html` renders markdown with `marked`, then runs KaTeX auto-render.
  - The generation prompt says "never use `$...$` or `\\[...\\]`", but the renderer still accepts both, which creates inconsistency.
  - `parseGuideSections()` only splits on `##` headings, so many valid markdown outputs will not map cleanly into the guide UI metadata.
- Why this matters:
  - Study guides are one of the main outputs and this path is currently fragile both in prompt contract and rendering assumptions.
- Likely implementation:
  - Tighten the prompt/output contract for guide generation.
  - Normalize study-guide storage to one clear shape: markdown-first or structured sections-first.
  - Sanitize or preprocess markdown before rendering.
  - Align KaTeX delimiter policy between prompting and rendering.
  - Test with math-heavy guides, non-math guides, and guides whose first heading is `#` only.
- Files:
  - `study/js/study-api.js`
  - `api/generate-study-item.js`
  - `study/guide.html`

### 1.3 Fix suggestions bar UI
- Status: high-priority polish / likely bug
- Current code:
  - `index.html` includes `#suggestion-bar`.
  - `app/korah-chat.js` shows and hides it based on scroll direction and assistant responses.
  - `app/korah-chat.css` defines both inline assistant suggestions and the bottom suggestion bar.
- Why this matters:
  - The logic is brittle. The bar only shows in certain scroll states and is cleared/hidden in a way that can feel inconsistent.
  - The styling is serviceable but not strong enough for a core chat action surface.
- Likely implementation:
  - Rework the show/hide behavior around chat state instead of scroll-direction heuristics alone.
  - Confirm mobile behavior and collision with the input area.
  - Make sure the bar is mode-aware and visually distinct from inline suggestion buttons.
- Files:
  - `index.html`
  - `app/korah-chat.js`
  - `app/korah-chat.css`

### 1.4 Improve collapsed sidebar UI
- Status: high-priority polish
- Current code:
  - Sidebar collapse exists in chat and study pages.
  - Logic is duplicated across `app/korah-chat.js`, `study/new.html`, `study/feed.html`, `study/guide.html`, `study/item.html`, and `study/test.html`.
  - Styling lives in `app/korah-chat.css`.
- Why this matters:
  - The feature exists, but it is not centralized and will be hard to improve consistently.
  - Collapse behavior differs by page, and practice-test pages force the sidebar collapsed by default.
- Likely implementation:
  - Unify collapse state and behavior across all pages.
  - Improve collapsed affordances for active nav, recent items, and footer actions.
  - Persist collapsed state per device.
  - Reduce duplicated toggle logic into shared JS.
- Files:
  - `app/korah-chat.css`
  - `app/korah-chat.js`
  - `study/js/sidebar.js`
  - `study/new.html`
  - `study/feed.html`
  - `study/guide.html`
  - `study/item.html`
  - `study/test.html`

### 1.5 Add rate limiting
- Status: release blocker for abuse protection
- Current code:
  - `api/gem-proxy.js` and `api/generate-study-item.js` accept requests without visible per-user or per-IP throttling.
- Why this matters:
  - Public AI endpoints without rate limits are a release risk for cost, abuse, and degraded availability.
- Likely implementation:
  - Add request throttling on both chat and study-generation endpoints.
  - Decide whether the limiter keys off auth UID, IP, or both.
  - Return user-friendly retry messages.
- Files:
  - `api/gem-proxy.js`
  - `api/generate-study-item.js`

## 2. UX and visual upgrade work

### 2.1 Use React Bits and make the UI much more impressive
- Status: product/design upgrade, not a single task
- Current code:
  - `korah-bot/` is mostly static HTML plus Alpine/vanilla JS, not React.
  - There is also a separate Next app in `/app`, but it does not appear to power `korah-bot/`.
- Important constraint:
  - "Use React Bits" is not directly compatible with the current `korah-bot` architecture unless the UI is partially rewritten or migrated.
- Recommended decision before implementation:
  - Either:
    - Keep `korah-bot` in vanilla/Alpine and borrow visual concepts only.
    - Or migrate the relevant product surfaces into the Next app and then use React-based UI patterns there.
- Scope candidates:
  - Chat hero/header polish
  - Input dock
  - Study feed cards
  - Create-item modal flow
  - Item detail player surfaces
- Files impacted if kept in current architecture:
  - `index.html`
  - `study/*.html`
  - `app/korah-chat.css`
  - `app/korah-chat.js`

## 3. Medium-scope product features that fit the current product

### 3.1 Add timer
- Status: useful release-adjacent feature, currently absent in `korah-bot`
- Current evidence:
  - The repo contains timer ideas in `frontendupdates.md`, but no actual timer implementation in the bot app.
- Likely implementation:
  - Start with a lightweight focus timer in chat or sidebar.
  - Persist session logs locally or in Firestore.
  - Use timer completions to generate follow-up actions in chat.
- Best touchpoints:
  - `index.html`
  - `app/korah-chat.js`
  - `app/korah-chat.css`
  - `app/data/firestore-store.js`

### 3.2 Add todo list
- Status: medium scope
- Current evidence:
  - No todo/task model appears to exist in `korah-bot`.
- Likely implementation:
  - Add a per-user task list with simple CRUD first.
  - Decide whether tasks live in sidebar, a planner panel, or chat-generated cards.
  - Make sure this does not conflict with the later planner/calendar work.
- Best touchpoints:
  - `index.html`
  - `app/korah-chat.js`
  - `app/korah-chat.css`
  - `app/data/firestore-store.js`

### 3.3 Add mood integration
- Status: medium scope, partial UI already exists
- Current code:
  - Sidebar shows a mood indicator on multiple pages.
  - `frontendupdates.md` already suggests integrating mood with chat prompts.
- Gap:
  - The mood surface looks mostly decorative right now. There is no clear end-to-end mood selection and behavior pipeline.
- Likely implementation:
  - Add an actual mood picker and persist the current mood.
  - Feed mood into chat prompts, planner suggestions, and timer recommendations.
- Files:
  - `index.html`
  - `study/*.html`
  - `app/korah-chat.js`
  - `app/korah-chat.css`

## 4. Larger feature work that needs clearer product decisions

### 4.1 Quizlet imports
- Status: larger integration feature
- Current evidence:
  - No import pipeline or external content sync currently exists.
- Questions to resolve:
  - Manual paste/import only, or full OAuth/API integration?
  - One-time deck import, or recurring sync?
  - Flashcards only, or also practice tests/study guides derived from imported decks?
- Likely initial release slice:
  - Support paste/import of exported Quizlet-style term/definition text or CSV first.
- Likely files:
  - `study/new.html`
  - `study/item.html`
  - `study/js/study-api.js`
  - `app/data/firestore-store.js`

### 4.2 Add basic SAT question bank
- Status: content + product feature
- Current evidence:
  - SAT appears in repo notes, but there is no visible SAT content bank or content model.
- Questions to resolve:
  - Curated static bank, AI-generated bank, or hybrid?
  - Reading/writing only, math only, or both?
  - Do SAT questions live as study items, practice tests, or a separate collection?
- Likely initial release slice:
  - Add a small static seed bank and allow practice-test generation from it.
- Likely files:
  - `study/new.html`
  - `study/test.html`
  - `app/data/firestore-store.js`
  - new seeded data files under `korah-bot/`

### 4.3 Add more NotebookLM-type features
- Status: large scope
- Requested direction:
  - Extend import options and support Google Docs, Slides, and similar sources.
- Current code:
  - Document support is local-file oriented.
  - `study/js/study-api.js` and `app/korah-chat.js` support images, PDFs, and simple text-like files.
- Questions to resolve:
  - Local uploads only or cloud source connectors?
  - Read-only ingest or persistent source libraries?
  - Need source citations, quotes, and multi-document synthesis?
- Likely initial release slice:
  - Expand supported local import formats first.
  - Add source metadata and better file parsing before attempting Google integrations.
- Likely files:
  - `app/korah-chat.js`
  - `study/js/study-api.js`
  - `api/gem-proxy.js`
  - `api/generate-study-item.js`

### 4.4 Study planner and calendar
- Status: large feature
- Current evidence:
  - No planner/calendar model exists yet.
- Questions to resolve:
  - Calendar-first scheduling, task-first planning, or AI-generated weekly plans?
  - Need drag/drop calendar UI or just simple dated tasks for v1?
  - Should this integrate directly with timer, mood, and study items?
- Recommended initial release slice:
  - AI-assisted study plan generator plus dated tasks before a full calendar UI.
- Likely files:
  - `index.html`
  - `app/korah-chat.js`
  - `app/korah-chat.css`
  - `app/data/firestore-store.js`

## 5. Suggested release sequencing

### Phase 1: stabilize current product
1. Fix study-guide prompting/rendering.
2. Fix generate-flow modal exit in `study/new.html`.
3. Fix suggestions bar behavior and styling.
4. Tighten collapsed sidebar UX and centralize the logic.
5. Add rate limiting on both AI endpoints.

### Phase 2: ship meaningful user-facing upgrades
1. Choose whether `korah-bot` stays vanilla or moves toward the React/Next app.
2. Upgrade the visual system for chat, study feed, and create flow.
3. Add mood integration.
4. Add a simple timer.
5. Add a simple todo list.

### Phase 3: expand product surface
1. Quizlet import v1.
2. SAT question bank v1.
3. Better multi-source document import flows.
4. Planner/calendar v1.

## 6. Open product decisions still needed

- Should `korah-bot` remain the primary shipped app, or is the `/app` Next project the intended long-term frontend?
- Is "use React Bits" a design inspiration request or a literal dependency/implementation request?
- For planner/todo/timer, do you want local-only persistence, Firestore sync, or both?
- For Quizlet and Google Docs/Slides support, is a lightweight import enough for prerelease, or do you want true third-party integrations before launch?
- Is the SAT bank supposed to be hand-authored content, AI-generated drills, or a mix?

## 7. Existing repo references worth reusing

- `frontendupdates.md`
  - already contains concepts for timer, mood integration, follow-up chips, and planner-oriented chat behavior
- `study-feed-spec.md`
  - already defines the study-item model and the intended create/generate/feed workflow
- `app/data/firestore-store.js`
  - already provides a usable persistence layer for adding synced user features
