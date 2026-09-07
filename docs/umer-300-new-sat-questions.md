# 300 New SAT Questions — Implementation Plan

## Overview

Add a new page to the SAT Question Bank that hosts ~300 recently released College Board questions. The page mirrors the existing question bank UI/UX, letting students select English Reading & Writing or Math sections, choose specific subsections/skills, and launch a practice session.

## Data Source

270 unique College Board question IDs extracted from PDF files:

- **150 English** (Reading & Writing) — 4 domains, 11 skills
- **120 Math** — 4 domains, 16 skills

Questions are organized by:
- **Section**: `english` | `math`
- **Domain**: Information and Ideas, Craft and Structure, Expression of Ideas, Standard English Conventions (English) / Algebra, Advanced Math, Problem-Solving and Data Analysis, Geometry and Trigonometry (Math)
- **Skill**: Mapped to existing `OPENSAT_CATALOG` skill codes (CID, INF, COE, WIC, TSP, CTC, SYN, TRA, BOU, FSS, H.A., H.B., H.C., H.D., H.E., P.A., P.B., P.C., Q.A., Q.B., Q.C., Q.D., Q.E., Q.F., S.A., S.B., S.C., S.D.)
- **Difficulty**: Easy (E), Medium (M), Hard (H)

The existing player (`questions.html` + `sat-player.js`) already supports loading questions by ID via the `questionIds` URL parameter, which fetches each from the College Board API via `/api/sat/q?questionIds=...`.

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `korah-bot/sat/300-new-questions.html` | **Create** | New page (clone of `index.html`) |
| `korah-bot/sat/js/sat-new-questions.js` | **Create** | Selection logic + hardcoded question data |
| `korah-bot/sat/index.html` | **Modify** | Add CTA button linking to new page |
| `korah-bot/sat/sat.css` | **Modify** | Add button styles |

## Step-by-Step Plan

### Step 1: Create `sat/300-new-questions.html`

Clone the structure from `index.html` with these changes:

- **Title**: "Korah AI — 300 New SAT Questions"
- **Header**: Updated headline and description explaining these are 300+ new questions recently released by College Board
- **Remove**: Question limit dropdown, assessment filter (all questions are SAT)
- **Keep**: Section cards (English/Math), domain groups, skill rows, selection pill, theme system, sidebar, Firebase auth, analytics

HTML structure:
```html
<!DOCTYPE html>
<html lang="en" x-data="{ theme: localStorage.getItem('korah_theme') || 'dark', ... }">
<head>
  <!-- Same as index.html: fonts, CSS, Alpine.js, Tailwind, KaTeX -->
  <title>Korah AI — 300 New SAT Questions</title>
</head>
<body>
  <!-- Same auth, sidebar, canvas setup -->
  
  <main id="main-content" class="main-content">
    <header class="chat-topbar">...</header>
    
    <div class="sat-page sat-bank-page" style="padding: 1.25rem;">
      <section class="sat-bank-shell">
        <!-- Header with new title/description -->
        <section class="sat-bank-header">
          <div class="sat-bank-header-text">
            <div class="sat-eyebrow-row">
              <img src="../logo-images/newlogo12.png" class="sat-eyebrow-logo"/>
              <p class="sat-eyebrow">Korah SAT Prep</p>
            </div>
            <h1 class="sat-bank-title">300 New Questions</h1>
            <p class="sat-bank-desc">
              College Board recently released 270+ new SAT questions. Pick a section
              and the skills you want to practice, then dive in.
            </p>
          </div>
          <img src="../logo-images/newlogo3.png" class="sat-bank-header-deco"/>
        </section>
        
        <!-- Section cards rendered by sat-new-questions.js -->
        <section class="sat-bank-layout">
          <div class="sat-section-column" id="sectionColumns"></div>
        </section>
      </section>
    </div>
  </main>
  
  <!-- Selection pill (same as index.html) -->
  <div id="selectionPill" class="sat-selection-pill" hidden>
    <span class="sat-pill-count" id="pillCountLabel">0 topics selected</span>
    <button id="pillRandomize" class="sat-pill-btn sat-pill-randomize t-btn">Randomize</button>
    <button id="pillStart" class="sat-pill-btn sat-pill-start t-btn">Start</button>
  </div>
  
  <!-- Same scripts: Firebase, analytics, sidebar, KaTeX, marked -->
  <script src="./js/sat-shared.js"></script>
  <script src="./js/sat-new-questions.js"></script>
</body>
</html>
```

### Step 2: Create `sat/js/sat-new-questions.js`

New JavaScript file containing:

1. **Hardcoded question data** — 270 question IDs with section, domain, skill, difficulty
2. **Section card rendering** — same visual structure as `sat-bank.js` but reading from local data
3. **Selection logic** — toggle sections, domains, skills
4. **Navigation** — build URL with `questionIds` param and navigate to `questions.html`

Structure:
```javascript
(() => {
  // ── Question data (270 IDs) ──
  const NEW_QUESTIONS = [
    { id: "58817765", section: "english", domain: "Information and Ideas", skill: "Inferences", skillCode: "INF", difficulty: "H" },
    { id: "8e6a96f5", section: "english", domain: "Information and Ideas", skill: "Inferences", skillCode: "INF", difficulty: "H" },
    // ... 268 more
  ];

  // ── Catalog (subset of OPENSAT_CATALOG for display) ──
  const SECTIONS = [
    {
      key: "english",
      label: "English Reading & Writing",
      description: "150 new questions from College Board",
      domains: [
        { key: "Information and Ideas", code: "INI", skills: [
          { key: "Inferences", code: "INF", count: 16 },
          { key: "Command of Evidence", code: "COE", count: 18 },
          { key: "Central Ideas and Details", code: "CID", count: 13 },
        ]},
        { key: "Craft and Structure", code: "CAS", skills: [
          { key: "Words in Context", code: "WIC", count: 18 },
          { key: "Text Structure and Purpose", code: "TSP", count: 11 },
          { key: "Cross-Text Connections", code: "CTC", count: 3 },
        ]},
        // ... Expression of Ideas, Standard English Conventions
      ]
    },
    {
      key: "math",
      label: "Math",
      description: "120 new questions from College Board",
      domains: [
        { key: "Algebra", code: "H", skills: [...] },
        { key: "Advanced Math", code: "P", skills: [...] },
        { key: "Problem-Solving and Data Analysis", code: "Q", skills: [...] },
        { key: "Geometry and Trigonometry", code: "S", skills: [...] },
      ]
    }
  ];

  // ── State ──
  const state = {
    selectedSection: null,   // "english" | "math" | null
    selectedSkills: [],      // skillCode array
    random: false,
  };

  // ── DOM refs ──
  const sectionColumns = document.getElementById("sectionColumns");
  const selectionPill = document.getElementById("selectionPill");
  const pillCountLabel = document.getElementById("pillCountLabel");
  const pillRandomize = document.getElementById("pillRandomize");
  const pillStart = document.getElementById("pillStart");

  // ── Rendering ──
  function renderSections() {
    // Render section cards with domain groups and skill rows
    // Uses same CSS classes as sat-bank.js: sat-section-card, sat-domain-group, sat-topic-row
    // Shows question count per skill
  }

  function renderPill() {
    // Show/hide pill, update count
  }

  // ── Selection logic ──
  function selectSection(sectionKey) {
    // Toggle section selection, update selectedSkills
  }

  function toggleSkill(sectionKey, domainKey, skillCode) {
    // Toggle individual skill
  }

  // ── Navigation ──
  function navigate() {
    const ids = NEW_QUESTIONS
      .filter(q => state.selectedSkills.includes(q.skillCode))
      .map(q => q.id);
    
    if (ids.length === 0) return;
    
    let url = "./questions.html?questionIds=" + ids.join(",");
    if (state.random) url += "&random=1";
    
    window.KorahTransitions.go(url);
  }

  // ── Event listeners ──
  sectionColumns.addEventListener("click", handleSelection);
  pillRandomize.addEventListener("click", () => { state.random = !state.random; renderPill(); });
  pillStart.addEventListener("click", navigate);

  // ── Init ──
  renderSections();
})();
```

### Step 3: Add CTA Button to `sat/index.html`

Insert after the `sat-bank-header-text` div (around line 155):

```html
<a href="./300-new-questions.html" class="sat-new-questions-btn" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1.125rem; border-radius: 62.4375rem; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #fff; font-weight: 700; font-size: 0.875rem; text-decoration: none; border: 1px solid rgba(139,92,246,0.3); margin-top: 1rem; transition: transform 0.2s, box-shadow 0.2s;">
  <span style="background: rgba(255,255,255,0.2); padding: 0.125rem 0.5rem; border-radius: 62.4375rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">NEW</span>
  300+ New College Board Questions
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
</a>
```

### Step 4: Add Button Styles to `sat/sat.css`

```css
/* New Questions CTA button */
.sat-new-questions-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.125rem;
  border-radius: 62.4375rem;
  background: linear-gradient(135deg, #8b5cf6, #6d28d9);
  color: #fff;
  font-weight: 700;
  font-size: 0.875rem;
  text-decoration: none;
  border: 1px solid rgba(139, 92, 246, 0.3);
  margin-top: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}
.sat-new-questions-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
}
.sat-new-questions-btn:active {
  transform: translateY(0);
}

html[data-theme="light"] .sat-new-questions-btn {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
}
```

## User Flow

1. User visits SAT Question Bank (`sat/index.html`)
2. Sees "300+ New College Board Questions" button in header area
3. Clicks → navigates to `sat/300-new-questions.html`
4. Sees two section cards:
   - **English Reading & Writing** — 150 questions across 4 domains
   - **Math** — 120 questions across 4 domains
5. Selects section(s) and specific skills
6. Selection pill appears at bottom showing count
7. Can toggle "Randomize" to shuffle question order
8. Clicks "Start" → navigates to `questions.html?questionIds=id1,id2,...`
9. Existing player loads questions by ID from College Board API
10. Full player experience: stopwatch, check answer, previous/next, calculator, reference sheet, Ask Korah, explanation, save, question navigator

## Question ID Distribution

### English (150 questions)
| Domain | Skill | Code | Count |
|--------|-------|------|-------|
| Information and Ideas | Inferences | INF | 16 |
| Information and Ideas | Command of Evidence | COE | 18 |
| Information and Ideas | Central Ideas and Details | CID | 13 |
| Craft and Structure | Words in Context | WIC | 18 |
| Craft and Structure | Text Structure and Purpose | TSP | 11 |
| Craft and Structure | Cross-Text Connections | CTC | 3 |
| Expression of Ideas | Rhetorical Synthesis | SYN | 12 |
| Expression of Ideas | Transitions | TRA | 21 |
| Standard English Conventions | Boundaries | BOU | 21 |
| Standard English Conventions | Form, Structure, and Sense | FSS | 17 |

### Math (120 questions)
| Domain | Skill | Code | Count |
|--------|-------|------|-------|
| Algebra | Linear equations in one variable | H.A. | 5 |
| Algebra | Linear functions | H.B. | 6 |
| Algebra | Linear equations in two variables | H.C. | 2 |
| Algebra | Systems of two linear equations | H.D. | 7 |
| Algebra | Linear inequalities | H.E. | 3 |
| Advanced Math | Equivalent expressions | P.A. | 7 |
| Advanced Math | Nonlinear equations and systems | P.B. | 9 |
| Advanced Math | Nonlinear functions | P.C. | 11 |
| Problem-Solving and Data Analysis | Ratios, rates, proportional relationships | Q.A. | 4 |
| Problem-Solving and Data Analysis | Percentages | Q.B. | 4 |
| Problem-Solving and Data Analysis | One-variable data | Q.C. | 4 |
| Problem-Solving and Data Analysis | Two-variable data | Q.D. | 3 |
| Problem-Solving and Data Analysis | Probability | Q.E. | 2 |
| Problem-Solving and Data Analysis | Inference from sample statistics | Q.F. | 3 |
| Geometry and Trigonometry | Area and volume | S.A. | 16 |
| Geometry and Trigonometry | Lines, angles, and triangles | S.B. | 14 |
| Geometry and Trigonometry | Right triangles and trigonometry | S.C. | 9 |
| Geometry and Trigonometry | Circles | S.D. | 12 |

## Verification

1. [ ] Button appears on question bank page and links to new page
2. [ ] New page renders English (150) and Math (120) section cards
3. [ ] Domain groups and skill rows display with correct question counts
4. [ ] Selecting English skills → Start loads English questions in player
5. [ ] Selecting Math skills → Start loads Math questions in player
6. [ ] Selecting both sections works correctly
7. [ ] Randomize toggle shuffles question order
8. [ ] Theme switching works (dark/light)
9. [ ] Responsive layout works on mobile
10. [ ] Player loads questions by ID from College Board API
11. [ ] Full player features work (stopwatch, check answer, calculator, etc.)
