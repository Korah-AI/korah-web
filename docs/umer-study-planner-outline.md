# SAT Study Planner — Implementation Outline

## Overview
Build a study planner on the Korah web app that syncs with the iOS app via Firebase. The planner includes a 4-step setup wizard, AI-generated 10-week schedule, and an interactive calendar with checkboxes. All data must match the iOS Firestore document shape exactly for seamless cross-platform sync.

---

## 1. Firestore Data Model

### Collection Path
```
users/{uid}/studyPlans/main
```
Single document per user (like `satProfile/main`).

### Document Schema (JSON Primitives Only)
```json
{
  "id": "main",
  "startPoint": "real_sat" | "practice_test" | "none",
  "mathScore": 680,
  "rwScore": 720,
  "confidenceRatings": {
    "heartOfAlgebra": 2,
    "problemSolvingData": 1,
    "passportAdvancedMath": 3,
    "additionalTopicsMath": 2,
    "informationIdeas": 2,
    "craftStructure": 3,
    "expressionIdeas": 1,
    "standardEnglish": 2
  },
  "freeTextGoals": "Focus on algebra and reading speed",
  "testDate": "2025-11-08",
  "studyDays": ["mon", "wed", "fri", "sat", "sun"],
  "hoursPerWeek": 6,
  "sessions": [
    {
      "id": "stable-uuid-v4",
      "date": "2025-08-28",
      "dayOfWeek": "thu",
      "startTime": "19:00",
      "durationMinutes": 60,
      "domain": "Heart of Algebra",
      "section": "math",
      "taskType": "practice",
      "completed": false,
      "completedAt": null
    }
  ],
  "feedback": "AI-generated plan feedback...",
  "createdAt": "2025-08-26T10:30:00.000Z",
  "updatedAt": "2025-08-26T10:30:00.000Z"
}
```

### Critical Compatibility Rules (Do Not Break)
| Rule | Reason |
|------|--------|
| All dates = ISO-8601 strings (`new Date().toISOString()`) | iOS `Codable` fails on Firestore `Timestamp` objects |
| `sessions` = flat array on document (not subcollection) | iOS expects flat array; grouping done in UI |
| `session.id` = stable UUID v4 | iOS matches sessions by ID on rewrite; never change |
| Weekday keys = exactly `mon tue wed thu fri sat sun` | iOS uses these exact strings |
| No extra/renamed fields without coordination | iOS decodes strictly; unknown fields cause decode failures |

---

## 2. Files to Create

| File | Purpose |
|------|---------|
| `korah-bot/sat/js/study-plan.js` | Data module: realtime listener, CRUD, AI calls |
| `korah-bot/sat/study-plan.html` | Main page: wizard + calendar views |
| Update `korah-bot/sidebar.html` | Add navigation link |

---

## 3. Study Plan Module (`korah-bot/sat/js/study-plan.js`)

### Exports
```js
initStudyPlan(app, uid) → attaches window.KorahStudyPlan
```

### API Surface
```js
{
  listen(onChange),           // onSnapshot listener
  getPlan(),                  // one-time read
  createPlan(intake),         // wizard → AI → write
  updateSession(id, {completed}),  // checkbox toggle
  deletePlan(),               // reset to wizard
  downscaleImage(file),       // reuse from math-chat.js
  extractScoresFromImage(base64)   // AI call 1
}
```

### Realtime Listener Pattern
```js
onSnapshot(planRef, (snap) => {
  if (snap.exists()) onChange({ state: "hasPlan", data: snap.data() });
  else onChange({ state: "empty" });
});
```
Three states: `loading` → `empty` (wizard) → `hasPlan` (calendar).

### AI Calls (via `/api/r`)

**Call 1: Score Extraction**
- Input: base64 data URL (downscaled to ≤1024px, quality 0.7)
- Prompt: Extract Math + Reading & Writing scores
- Output: `{ "mathScore": number|null, "rwScore": number|null }`

**Call 2: Plan Generation**
- Input: full intake object
- Prompt: See [Prompt 2](#prompt-2-plan-generation) below
- Output: `{ "feedback": "string", "sessions": [...] }`

### Image Downscaling (Reused from `math-chat.js:562-595`)
```js
function downscaleImage(file, maxDim = 1024, quality = 0.7) {
  // Returns base64 data URL ≤ 4.5 MB for /api/r
}
```

---

## 4. Study Plan Page (`korah-bot/sat/study-plan.html`)

### Structure
- Module script init (copied from `dashboard.html:587-634`)
- Alpine.js for wizard state + calendar view
- Reuses `sat.css` / `korah.css` variables and patterns

### Wizard (4 Steps)

#### Step 1: Start Point
Radio group with three options:
- **Took the real SAT** — upload score report screenshot
- **Took a practice test** — upload Bluebook/Khan Academy screenshot
- **Haven't tested yet** — rate confidence on 8 domains

#### Step 2: Level
**If tested (real_sat / practice_test):**
- Drag-and-drop image upload
- "Extract Scores" button → calls AI
- Shows extracted scores with "Retake" option

**If not tested (none):**
- 8 domain sliders (1–3) for Math + Reading & Writing domains (all 8 required before Next is enabled)
- Free-text textarea for goals

**Math Domains:**
1. Algebra
2. Problem-Solving and Data Analysis
3. Advanced Math
4. Geometry and Trigonometry

**Reading & Writing Domains:**
1. Information & Ideas
2. Craft & Structure
3. Expression of Ideas
4. Standard English Conventions

> **Note:** The Reading & Writing Domains title uses purple (`var(--p5)`) instead of blue (`#38bdf8`).

#### Step 3: Test Date
- Three `<select>` dropdowns (Month / Day / Year) — classes `.sat-date-select` — styled as dark pill buttons (`border-radius:999px`) with purple highlight on `option:checked`
- State: `dateMonth`, `dateDay`, `dateYear` — method `selectOfficialDate(d)` auto-fills all three selects when a shortcut is clicked
- Shortcut buttons (class `.sat-date-btn`) for official College Board SAT dates (2026–2027):
  - 2026-09-12, 2026-10-03, 2026-11-07, 2026-12-05
  - 2027-03-06, 2027-05-01, 2027-06-05
- Shortcut buttons have hover glow (`box-shadow` purple) and persistent `.selected` glow
- No spinner arrows on number inputs (CSS rule `input[type="number"]::-webkit-inner-spin-button`)

#### Step 4: Schedule
- Weekday checkboxes (Mon–Sun, min 2 selected)
- Hours per week text input (`type="text" inputmode="numeric" maxlength="2"`) clamped to 2–30
- "Create My Plan" button is placed **inside** Step 4's card content (not in the bottom nav bar)
- "Next" button is hidden on Step 4 via `.wizard-hide` CSS class (`display:none !important`)

### Calendar View (After Wizard)
- **Toggle**: Weekly list (default) ↔ Monthly grid — button in top-right header area
- **Weekly**: Sessions grouped by week, checkbox per session
- **Monthly**: 7-column grid, sessions as colored chips
- **Realtime**: Updates via `onSnapshot` when phone writes
- **Feedback banner**: Shows AI-generated plan feedback

### Additional Styling
| Element | Class / Notes |
|---------|---------------|
| `.sat-date-select` | Dark pill button select, `border-radius:999px`, purple highlight |
| `.sat-date-btn` | Date shortcut pill button, hover glow, `.selected` persistent glow |
| `.wizard-hide` | `display:none !important` — hides elements (used for Next button on Step 4) |

### Styling (Reuse Existing)
| Element | Class / Variable |
|---------|-----------------|
| Cards | `.panel-card`, `.section-card` |
| Buttons | `.sat-button`, `.sat-button-primary`, `.sat-button-secondary` |
| Inputs | `.sat-field-input`, `.sat-filter-btn` |
| Colors | `var(--p4)`, `var(--p5)`, `var(--sf)`, `var(--bd)`, `var(--tx)`, `var(--tx2)` |
| Spinner | `.sat-spinner` |

---

## 5. Navigation Entry

Add to `korah-bot/sidebar.html` under "SAT Practice":
```html
<a href="/sat/study-plan.html" class="sidebar-nav-link t-btn">
  <span class="material-icons-round" style="font-size: 1.25rem;">event</span>
  <span class="nav-text">Study Plan</span>
</a>
```

---

## 6. AI Prompts (Exact)

### Prompt 1: Score Extraction
```
You are an SAT score report reader. Extract the Math section score and the Reading & Writing section score from this screenshot.
Return ONLY valid JSON: { "mathScore": number|null, "rwScore": number|null }
If a score is not visible or unclear, use null. Do not guess.
```

### Prompt 2: Plan Generation
```
You are Korah's SAT Study Planner. Create a 10-week study plan.

Input:
{
  "startPoint": "real_sat" | "practice_test" | "none",
  "mathScore": 680,
  "rwScore": 720,
  "confidenceRatings": {
    "heartOfAlgebra": 2,
    "problemSolvingData": 1,
    "passportAdvancedMath": 3,
    "additionalTopicsMath": 2,
    "informationIdeas": 2,
    "craftStructure": 3,
    "expressionIdeas": 1,
    "standardEnglish": 2
  },
  "freeTextGoals": "Focus on algebra and reading speed",
  "testDate": "2025-11-08",
  "studyDays": ["mon","wed","fri","sat","sun"],
  "hoursPerWeek": 6
}

HARD RULES (follow exactly):
1. Sessions ONLY on chosen studyDays.
2. Each session 30-90 minutes.
3. Total weekly minutes ≈ hoursPerWeek × 60 (distribute evenly across chosen days).
4. Plan ONLY the first 10 weeks from today.
5. Use REAL SAT skill/domain names:
   Math: "Heart of Algebra", "Problem Solving & Data Analysis", "Passport to Advanced Math", "Additional Topics in Math"
   Reading & Writing: "Information & Ideas", "Craft & Structure", "Expression of Ideas", "Standard English Conventions"
6. Include a FULL PRACTICE TEST every ~3 weeks (weeks 3, 6, 9) — 135-180 min, on a chosen day.
7. Mix domains each week; don't cluster same domain.
8. session.id = stable UUID v4 (generate client-side, send in prompt context).
9. Output ONLY valid JSON: { "feedback": "string", "sessions": [ { "id": "uuid", "date": "2025-08-28", "dayOfWeek": "thu", "startTime": "19:00", "durationMinutes": 60, "domain": "Heart of Algebra", "section": "math", "taskType": "practice" } ] }
```

---

## 7. Implementation Sequence

1. **Create `korah-bot/sat/js/study-plan.js`** — data module with listener + AI helpers
2. **Create `korah-bot/sat/study-plan.html`** — wizard UI + calendar UI
3. **Update `korah-bot/sidebar.html`** — add navigation link
4. **UI refinements** — moved "Create My Plan" into Step 4 card, hidden Next on Step 4, replaced date `<input>` with three `<select>` dropdowns, updated math domain labels, centered upload icon, limited hours/week to 2 digits, hidden number spinners
5. **Test locally** — verify wizard flow (AI calls require Vercel deployment), calendar rendering, realtime sync
6. **Cross-platform test** — create plan on web, open iOS app, verify sessions appear and checkboxes sync

---

## 8. Backend / Firebase Integration

### Firebase Config (from `dashboard.html`)
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

### Auth Flow
1. `initializeApp(firebaseConfig)`
2. `onAuthStateChanged(auth, async (user) => { ... })`
3. `setupKorahDB(app, user.uid)` — initializes Firestore with offline persistence
4. `initStudyPlan(app, user.uid)` — attaches listener
5. `startAuthGuard(auth, '../index.html')` — polls auth every 10s

### Firestore Access Pattern
```js
// From firestore-store.js pattern
const planRef = doc(db, `users/${userId}/studyPlans`, "main");
await setDoc(planRef, payload);           // write
const snap = await getDoc(planRef);       // read once
onSnapshot(planRef, callback);            // realtime
```

---

## 9. AI Proxy (`/api/r`)

### Endpoint
- `POST /api/r` — OpenAI-compatible chat proxy
- Supports: `model`, `messages[]`, `response_format: {type: "json_object"}`, `temperature`, image content parts

### Usage Pattern (from `math-chat.js`, `study-api.js`)
```js
fetch("/api/r", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gemini-2.5-flash",
    messages: [{ role: "system", content: PROMPT }, { role: "user", content: ... }],
    response_format: { type: "json_object" },
    temperature: 0.3
  })
})
```

### Payload Limit
- Max ~4.5 MB → downscale images before sending

---

## 10. Testing Checklist

| Test | Expected |
|------|----------|
| Wizard Step 1 → 2 → 3 → 4 | Smooth progression, validation at each step |
| Image upload + score extraction | AI returns valid JSON, scores populate |
| Confidence ratings (1–3) | All 8 domains required before proceed |
| Test date picker + shortcuts | Three selects (Month/Day/Year) fill via shortcut buttons |
| Schedule: min 2 weekdays, hours 2–30 | Validation prevents submit |
| Hours/week input | Limited to 2 digits, spinner arrows hidden |
| Plan generation | AI returns valid JSON with 10 weeks of sessions |
| Calendar weekly view | Sessions grouped by week, checkboxes work |
| Calendar monthly view | Grid renders, chips clickable |
| Checkbox toggle | `updateSession` writes to Firestore, realtime updates |
| Realtime sync | iOS app changes appear on web without refresh |
| Delete plan | Returns to wizard, Firestore doc cleared |
| iOS compatibility | Document shape matches exactly, no decode errors |

---

## 11. Dependencies

| Dependency | Source |
|------------|--------|
| Firebase JS SDK 12.10.0 | CDN (ES modules) |
| Alpine.js 3.x | CDN |
| Tailwind CSS | CDN |
| Marked.js | CDN (for AI feedback rendering) |
| KaTeX | CDN (math rendering) |
| Desmos API | CDN (if needed for future) |
| `korah.css`, `sat.css` | Local |
| `sidebar-loader.js`, `auth-guard.js` | Local |
| `firestore-store.js` | Local |

---

## 12. Future Enhancements (Not in Scope)

- Edit existing plan (modify wizard inputs → regenerate)
- Push notifications for upcoming sessions
- Progress analytics (completion rate, streak)
- Export to calendar (ICS/Google Calendar)
- AI chat about the plan ("What should I focus on this week?")