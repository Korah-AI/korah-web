# Korah Web — Architecture & Structure Guide

## Overview
Korah Web is a single-page-application-style static site (no React, no build step) built with **plain HTML/CSS/JS + Alpine.js** for reactivity. It uses **Firebase Auth + Firestore** for backend, and a **Vercel serverless proxy (`/api/r`)** for AI calls. All pages share a common layout: sidebar navigation, top bar, and a main content area.

---

## 1. Project Structure

```
korah-bot/
├── index.html                 # Landing page (post-login home)
├── login.html                 # Authentication page
├── chat.html                  # Ask Korah (general chat)
├── sidebar.html               # Shared sidebar (loaded via sidebar-loader.js)
├── sidebar-loader.js          # Fetches & injects sidebar.html
├── auth-guard.js              # Polls auth, redirects if logged out
├── korah.js                   # Global utilities (transitions, theme, etc.)
├── korah.css                  # Global design system (CSS variables, components)
├── transitions/               # Page transition animations
├── app/
│   ├── korah-chat.js          # Chat engine (sessions, streaming, Desmos)
│   ├── timer-manager.js       # Practice timers
│   └── data/
│       └── firestore-store.js # Firestore CRUD + realtime listeners
├── sat/
│   ├── index.html             # SAT Question Bank
│   ├── dashboard.html         # SAT Dashboard (analytics)
│   ├── math-chat.html         # Desmos Math Chat
│   ├── rush.html              # Practice Rush (timed drills)
│   ├── questions.html         # Question player
│   ├── sat.css                # SAT-specific styles
│   ├── sat-rush.css
│   ├── sat-math.css
│   ├── sat-player-theme.css
│   ├── js/
│   │   ├── sat-shared.js      # SAT catalog, constants
│   │   ├── sat-bank.js        # Question bank UI
│   │   ├── sat-player.js      # Question player logic
│   │   ├── sat-rush.js        # Rush mode logic
│   │   └── sat-analytics.js   # Dashboard analytics (Firestore)
│   └── desmos-json/           # Desmos templates
├── study/
│   ├── new.html               # Create study items (flashcards, guides, tests)
│   ├── item.html              # Study item detail
│   ├── guide.html             # Study guide viewer
│   ├── test.html              # Practice test player
│   ├── feed.html              # Study home feed
│   └── js/
│       ├── sidebar.js         # Study sidebar (history, items)
│       └── study-api.js       # AI content generation proxy
└── landing/
    └── index.html             # Public landing page
```

---

## 2. Core Architecture

### 2.1 Entry Point & Auth Flow
Every authenticated page follows this pattern (see `dashboard.html:587-634`):

```html
<script type="module">
  import { initializeApp } from "firebase-app.js";
  import { getAuth, onAuthStateChanged, signOut } from "firebase-auth.js";
  import { setupKorahDB } from "../app/data/firestore-store.js";
  import { initSatAnalytics } from "./js/sat-analytics.js";  // page-specific
  import { startAuthGuard } from '../auth-guard.js';

  const firebaseConfig = { ... };  // Same config everywhere
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);

  onAuthStateChanged(auth, async (user) => {
    if (!user) { window.KorahTransitions.go('../landing/index.html'); return; }
    await setupKorahDB(app, user.uid);           // Init Firestore
    await initSatAnalytics(app, user.uid);       // Page-specific init
    window.dispatchEvent(new CustomEvent('korahReady', { detail: { uid: user.uid } }));
    startAuthGuard(auth, '../landing/index.html'); // 10s poll guard
  });
</script>
```

**Key points:**
- `setupKorahDB` initializes Firestore with **IndexedDB offline persistence** (`persistentLocalCache()`)
- Each page imports its own feature module (`initSatAnalytics`, `initStudyPlan`, etc.)
- `korahReady` event signals "data layer ready" — UI components listen for this
- `startAuthGuard` polls `auth.currentUser` every 10s, redirects on logout

### 2.2 Sidebar & Navigation
- `sidebar-loader.js` fetches `sidebar.html` and injects into `#sidebar-root`
- Rewrites root-relative links (`/sat/...`) to work from any subdirectory
- Highlights active link by comparing `pathname`
- Alpine.js manages collapse/mobile state (shared via `x-data` on `<html>`)

### 2.3 Page Transitions
- `transitions/page-transitions.js` + CSS: fade/slide between pages
- `window.KorahTransitions.go(url)` used instead of `location.href`
- Prevents flash of unstyled content (`korah-page-ready` class)

---

## 3. Firebase & Firestore

### 3.1 Configuration
```js
const firebaseConfig = {
  apiKey: "AIzaSyDvabVNkVMfjKl1m3dQSlW06h-iomgcNJM",
  authDomain: "korah-app.firebaseapp.com",
  projectId: "korah-app",
  storageBucket: "korah-app.firebasestorage.app",
  messagingSenderId: "226169460321",
  appId: "1:226169460321:web:b166fc8260107c55dafc20"
};
```
Same config used across all pages.

### 3.2 Firestore Data Layer (`app/data/firestore-store.js`)
**Single source of truth** for all Firestore operations. Exposes `window.KorahDB`:

```js
window.KorahDB = {
  uid,
  // Conversations
  getConversation(id),
  setConversation(id, data),
  deleteConversation(id),
  onConversationsChange(callback),  // realtime
  fetchConversations(),
  // Study Items (flashcards, guides, tests)
  getStudyItem(id),
  setStudyItem(id, data),
  deleteStudyItem(id),
  onStudyItemsChange(callback),     // realtime (merges 3 collections)
  fetchStudyItems(),
  // SAT Explanations (global cache)
  getSatExplanation(questionId),
  setSatExplanation(questionId, data),
  // Migration & cleanup
  migrateFromLocalStorage(),
  clearAllData()
};
```

**Collections Structure:**
```
users/{uid}/
├── conversations/{conversationId}      // Chat sessions
├── flashcardSets/{setId}
├── studyGuides/{guideId}
├── practiceTests/{testId}
├── satProfile/main                     // Current/goal scores
├── satTotals/summary                   // XP, level, totals
├── satSkills/{skillCd}                 // Per-skill aggregates
├── satAttempts/{autoId}                // Append-only attempt log
├── satBookmarks/{questionId}
└── studyPlans/main                     # NEW: Study Planner
```

**Realtime Pattern (used everywhere):**
```js
function onConversationsChange(callback) {
  const q = query(convCol(), orderBy("updatedAt", "desc"));
  return onSnapshot(q, (snap) => {
    const result = {};
    snap.docs.forEach(d => { result[d.id] = d.data(); });
    callback(result);
  });
}
```

### 3.3 Data Conventions
- **All timestamps = ISO-8601 strings** (`new Date().toISOString()`) — never `serverTimestamp()`
- **Document IDs = UUID strings** (`crypto.randomUUID()`)
- **Merge writes** (`{ merge: true }`) to avoid overwriting
- **Batch writes** for atomic multi-document operations

---

## 4. AI System (`/api/r` Proxy)

### 4.1 Proxy Endpoint
- **URL**: `POST /api/r` (Vercel serverless function)
- **Model**: `gemini-2.5-flash` (default)
- **Format**: OpenAI-compatible `messages[]` array
- **Features**: `response_format: {type: "json_object"}`, image content parts, streaming (optional)

### 4.2 Client Wrappers

#### `sat/math-chat.js` — Desmos Math Chat
- **Three-phase pipeline**: classify → adapt → tutor
- Loads Desmos template skeletons, sends all in one prompt
- Streams response with typewriter effect
- Handles file attachments (images, PDFs) with downscaling

#### `study/js/study-api.js` — Study Content Generation
- Tries `/api/generate-study-item` first (dedicated backend)
- Falls back to `/api/r` (chat proxy)
- Supports: flashcards, study guides, practice tests
- Handles multimodal input (images, PDFs, text, URLs)

#### `sat/js/sat-analytics.js` — No direct AI calls
- Pure analytics: aggregates from `satAttempts`, `satSkills`

### 4.3 AI Call Pattern
```js
const res = await fetch("/api/r", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gemini-2.5-flash",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_CONTENT }  // string or multimodal array
    ],
    response_format: { type: "json_object" },  // for JSON mode
    temperature: 0.3
  })
});
const data = await res.json();
const content = data.choices?.[0]?.message?.content;
```

### 4.4 Image Handling
- Downscale to ≤1024px, JPEG quality 0.7 (stays under 4.5 MB limit)
- Convert to base64 data URL
- Send as `image_url` content part

---

## 5. Major Features

### 5.1 SAT Question Bank (`sat/index.html` + `sat/js/sat-bank.js`)
- Loads College Board questions from `sat-shared.js` catalog
- Filter by section (Math/English), domain, difficulty
- Question limit, randomized or sequential
- Launches `questions.html` player

### 5.2 Question Player (`sat/questions.html` + `sat/js/sat-player.js`)
- Renders MCQ (4 options) or SPR (text input)
- Desmos graph integration for math
- Timer, mark-for-review, elimination
- Records attempt → `sat-analytics.recordAttempt()`

### 5.3 Practice Rush (`sat/rush.html` + `sat/js/sat-rush.js`)
- Timed drill mode (configurable questions, time)
- Adaptive difficulty
- Streak tracking, XP rewards

### 5.4 Desmos Math Chat (`sat/math-chat.html` + `sat/math-chat.js`)
- Natural language math tutor
- Loads Desmos graphs from template library
- Three-phase: classify template → adapt to problem → explain
- Session persistence in Firestore (`conversations`)

### 5.5 SAT Dashboard (`sat/dashboard.html` + `sat/js/sat-analytics.js`)
- Real-time analytics from Firestore
- Score progress (current → goal)
- Domain breakdown, skill suggestions
- Activity trends, pacing, consistency heatmap
- Time breakdowns (section, activity, difficulty)

### 5.6 Study Module (`study/`)
- **Flashcards**: spaced repetition, Leitner-style
- **Study Guides**: markdown + KaTeX rendering
- **Practice Tests**: MCQ + open-ended, scoring
- **AI Generation**: prompt → content (flashcards/guides/tests)
- **Scanners**: OCR from images (client-side + AI)

### 5.7 General Chat (`chat.html` + `app/korah-chat.js`)
- Persistent conversations in Firestore
- Streaming responses with markdown/KaTeX
- File attachments, code blocks
- Session management (rename, delete, search)

---

## 6. Styling System

### 6.1 CSS Variables (`korah.css`)
```css
:root {
  --bg: #06040f;      /* background */
  --sf: #0d0818;      /* surface */
  --sf2: #141020;     /* surface elevated */
  --bd: rgba(139,92,246,0.18);  /* border */
  --p4: #a78bfa;      /* purple primary */
  --p5: #c4b5fd;      /* purple light */
  --tx: #f8fafc;      /* text primary */
  --tx2: #94a3b8;     /* text secondary */
  --grn: #22c55e;     /* success */
  --red: #ef4444;     /* danger */
  --cu: rgba(139,92,246,0.12);  /* accent surface */
  --glow: rgba(139,92,246,0.4); /* glow shadow */
}
```
- Dark mode default, light mode via `[data-theme="light"]`
- No Tailwind utilities in custom CSS — uses variables

### 6.2 Component Patterns (Reused Across Pages)
| Pattern | Example Classes |
|---------|----------------|
| Card | `.panel-card`, `.section-card`, `.stat-card` |
| Button | `.sat-button`, `.sat-button-primary`, `.cta-primary`, `.cta-ghost` |
| Input | `.sat-field input`, `.create-input`, `.sat-filter-btn` |
| Badge | `.sat-chip`, `.sat-attempt-badge`, `.home-pill` |
| Progress | `.score-bar`, `.sat-progress-fill`, `.activity-ring` |
| Modal | `.delete-modal`, `.goal-modal`, `.settings-modal` |

### 6.3 SAT-Specific Styles (`sat/sat.css`)
- Section cards (English = purple gradient, Math = blue gradient)
- Domain/topic trees with checkboxes
- Question panel, answer choices, feedback
- Desmos container, calculator panel
- Reference panel (draggable overlay)

---

## 7. Shared Utilities

| File | Purpose |
|------|---------|
| `korah.js` | Theme init, transitions, global helpers |
| `sidebar-loader.js` | Dynamic sidebar injection |
| `auth-guard.js` | Auth polling guard |
| `app/timer-manager.js` | Practice timers (stopwatch, countdown) |
| `study/js/sidebar.js` | Study item history sidebar |
| `transitions/page-transitions.js` | Page fade/slide animations |

---

## 8. Data Flow Summary

```
User Action
    │
    ▼
UI (Alpine.js / vanilla JS)
    │
    ├──→ Firestore (via KorahDB) ───→ Real-time listeners ──→ UI updates
    │
    └──→ AI Proxy (/api/r) ───→ Gemini 2.5 Flash ───→ JSON response ──→ UI / Firestore
```

**Example: Creating a Study Plan**
1. Wizard collects intake → `KorahStudyPlan.createPlan(intake)`
2. Module calls `/api/r` with plan generation prompt
3. AI returns `{ feedback, sessions[] }`
4. Module writes to `users/{uid}/studyPlans/main`
5. `onSnapshot` fires → calendar view updates
6. iOS app receives same realtime update → sync complete

---

## 9. Adding a New Feature (Template)

### 9.1 Create Data Module
```
korah-bot/sat/js/my-feature.js
```
```js
export async function initMyFeature(app, uid) {
  const db = getFirestore(app);
  const ref = doc(db, `users/${uid}/myFeature`, "main");
  
  function listen(cb) { return onSnapshot(ref, snap => cb(snap.data())); }
  async function save(data) { await setDoc(ref, { ...data, updatedAt: new Date().toISOString() }, { merge: true }); }
  
  const api = { listen, save };
  window.KorahMyFeature = api;
  window.dispatchEvent(new CustomEvent("korahMyFeatureReady"));
  return api;
}
```

### 9.2 Create Page
```
korah-bot/sat/my-feature.html
```
- Copy module script from `dashboard.html`
- Import `initMyFeature` and call in `onAuthStateChanged`
- Use Alpine.js for UI state
- Listen for `korahMyFeatureReady` → attach listener

### 9.3 Add Sidebar Link
Edit `sidebar.html`:
```html
<a href="/sat/my-feature.html" class="sidebar-nav-link t-btn">
  <span class="material-icons-round">icon_name</span>
  <span class="nav-text">My Feature</span>
</a>
```

---

## 10. Deployment & Vercel

### 10.1 `vercel.json`
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/korah-bot/$1" }
  ],
  "functions": {
    "api/**/*.js": { "maxDuration": 30 }
  }
}
```
- Serves `korah-bot/` at root
- API routes in `korah-bot/api/` (not shown in file tree but exist)

### 10.2 API Routes (Inferred)
| Route | Purpose |
|-------|---------|
| `/api/r` | AI chat proxy (Gemini) |
| `/api/generate-study-item` | Study content generation |
| `/api/proxy.js` | Generic proxy |
| `/api/rate-limit.js` | Rate limiting middleware |
| `/api/feedback.js` | User feedback |
| `/api/speak.js` | TTS |
| `/api/transcribe.js` | STT |

---

## 11. Key Design Principles

1. **No build step** — plain ES modules, CDN deps, runs anywhere
2. **Firebase-first** — all persistence in Firestore, offline-enabled
3. **Realtime by default** — `onSnapshot` everywhere, no manual refresh
4. **iOS parity** — document shapes match exactly for cross-platform sync
5. **Alpine.js for reactivity** — lightweight, no virtual DOM
6. **CSS variables + component patterns** — consistent design, no Tailwind in custom CSS
7. **AI via proxy** — keys never in client, payloads validated server-side

---

## 12. Study Planner Integration Points

The new Study Planner (`study-plan.js` + `study-plan.html`) follows all conventions:

| Aspect | Implementation |
|--------|----------------|
| Auth | Same module script pattern as `dashboard.html` |
| Firestore | `users/{uid}/studyPlans/main` (single doc) |
| Realtime | `onSnapshot` listener → three states |
| AI | Two `/api/r` calls (score extraction + plan generation) |
| Styling | Reuses `sat.css` / `korah.css` variables and patterns |
| Navigation | Added to `sidebar.html` under SAT Practice |
| Data types | ISO strings, UUIDs, flat sessions array, exact weekday keys |

---

## 13. File Reference Quick Links

| Feature | Main Files |
|---------|------------|
| Auth & DB Init | `dashboard.html:587-634`, `app/data/firestore-store.js` |
| Sidebar | `sidebar.html`, `sidebar-loader.js` |
| SAT Analytics | `sat/js/sat-analytics.js`, `sat/dashboard.html` |
| Question Bank | `sat/index.html`, `sat/js/sat-bank.js`, `sat/js/sat-shared.js` |
| Question Player | `sat/questions.html`, `sat/js/sat-player.js` |
| Practice Rush | `sat/rush.html`, `sat/js/sat-rush.js` |
| Desmos Chat | `sat/math-chat.html`, `sat/math-chat.js` |
| Study Module | `study/new.html`, `study/item.html`, `study/js/study-api.js`, `study/js/sidebar.js` |
| General Chat | `chat.html`, `app/korah-chat.js` |
| AI Proxy Client | `study/js/study-api.js`, `sat/math-chat.js` |
| Styling | `korah.css`, `sat/sat.css` |
| Transitions | `transitions/page-transitions.js`, `transitions/page-transitions.css` |

---

## 14. Environment Notes

- **Local dev**: `npx serve korah-bot` or any static server
- **Firebase**: Uses project `korah-app` (production)
- **API**: Vercel functions at `/api/*` (deployed with frontend)
- **No environment variables in client** — all config in HTML
- **Offline**: Firestore `persistentLocalCache()` enables full offline read/write