Korah UI/UX Agent Guide

Read this entire file before touching a single line of code.
This is your operating manual, design system, and component library in one document.
When this file and what you see in the codebase conflict — the codebase wins. This doc describes intent; the CSS files describe reality.

**Talk like a caveman**, minimum words, you get to the point (Or use tables). Little words, only main points when finished planning but when finished adding something to the code, use a normal amount of words to explain what you did. 

0 · Agent Operating Procedure
Follow this sequence for every task, without exception.
1. READ this file fully (you are doing this now)
2. GREP before you write any class name
3. ASK if you cannot find something or the task is ambiguous — pause mid-task, do not guess
4. IMPLEMENT using existing classes wherever possible
5. FLAG what you built and why at the end of your response

### 0.1 · The Core Commandments (Strict Rules)
These rules are absolute. Violation results in immediate task failure.

1.  **Surgical Code Rule (Strict):** Never rewrite entire HTML bodies. Only perform surgical edits to specific lines. Always `grep` for existing helpers, listeners, and scripts (`addEventListener`, `x-data`, `x-on`, `KorahDB`, `KorahTransitions`, `onclick`) in both the current file AND all related JS files before adding code to avoid duplication.
2.  **Surgical Reversions & Git Safety (Double Confirmation):** Blanket `git revert` or file checkouts are forbidden unless explicitly ordered. If ordered, you must ask twice ("Are you sure?" → "Are you absolutely sure?"). "Your own lines" = code you added this session only. For reverting others' code, ask the user.
3.  **The !important Approval Rule:** Exhaust all radical CSS approaches before using `!important`. Try in order: (a) `html[data-theme="dark"]` prefix for specificity, (b) chain 3+ parent selectors, (c) nest inside higher-specificity block, (d) duplicate variable with higher-specificity fallback. If all fail, explain why and obtain per-task approval. Approval does not carry to other tasks.
4.  **No-Dependency Rule:** No `npm install` or new CDN scripts without permission. This covers: Google Fonts, icon libraries, utility libs, chart libs, animation libs, and any external `<script>` beyond the existing Firebase, Alpine, Tailwind, and DOMPurify CDNs. Propose the exact URL and explain why existing tools can't do the job.
5.  **No Backend Access:** Do NOT touch: `study-firebase-init.js`, `firestore-store.js`, Firebase config in any page, `onAuthStateChanged`, `setupKorahDB()`, `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, or `KorahDB.*` CRUD — unless explicitly permitted. If permitted, use `try-catch` + optional chaining on every Firebase call to prevent page crashes.
6.  **Mandatory Responsiveness Checklist:** All additions must scale at Desktop (1200px+), Tablet (768px), and Mobile (375px) without layout breaks. Run the §11 QA checklist before declaring done. List pass/fail per breakpoint in your report.
7.  **"Caveman" Code Comments:** Minimum words. Describe *what* not *how*. No line-by-line commentary. Good: `// Fade in sidebar`. Bad: 3+ sentences explaining mechanics.
8.  **Coworker Collaboration Guide:** Deep-dive pages for UI/UX improvements. Present in a compact table: | Element | Current Function | Proposed Change | Function If Change Happens | Why |. See §0.2 and Collaborative Reflection Questions (end of doc) for full guidelines.

The Grep Rule
Before writing any CSS class or HTML class attribute, run a search:
bashgrep -r "class-name-you-are-about-to-write" ./
If the class exists → use it, do not recreate it.
If it does not exist → you may create it, but name it consistently with the existing system (kebab-case, descriptive, no abbreviations unless already established like tx, bd, sf).
The Ask Rule
If you are mid-task and hit any of the following — stop, send a message, wait for a reply:

You cannot find an existing class for something that probably exists
The layout you are building has no analog in the codebase
You are about to add a new animation and are unsure if it fits the Korah vibe
You would need to override an existing class with !important more than once
The design spec is ambiguous and two interpretations lead to meaningfully different UIs

Do not finish the task and flag at the end. Pause mid-task.
The Flag Rule
At the end of every response, include a short ## What I did section listing:

New classes created (and why they were needed)
Existing classes reused
Any judgment calls made without asking

### 0.2 · Developer-to-Developer Collaboration & Tone

**UX Recommendations Table Format**
When deep-diving into pages to suggest improvements, present findings in this exact table — no preamble:

| Element | Current Function | Proposed Change | Function If Change Happens | Why |

Use short phrases, not full sentences. After the table, ask which items to implement.

**Rules for Design Partners**
- Always explain the *why* behind each recommendation (performance, consistency, UX, brand alignment)
- When disagreeing with a direction, propose 1–2 alternatives with tradeoffs — not just "I don't think that works"
- Push back on: accessibility violations, layout breakage, brand drift. Defer on: subjective visual preference
- If a change would break existing functionality, flag it immediately with the specific risk
- Use the Collaborative Reflection Questions (end of document) when evaluating decisions together

**Communication Tone**
- During planning / exploration: few words, bullet points or tables
- After executing changes: normal sentences explaining what you did, why, and tradeoffs
- Flag ambiguity mid-task — do not guess and plow forward

1 · What Korah Is
Korah is a premium AI study platform. Every UI decision should serve one north star:

Make studying feel effortless, focused, and worth coming back to.

The Korah Vibe
Think Linear — not Raycast, not Notion, not a generic SaaS dashboard.

Transitions are smooth and slightly cinematic, not snappy
Every interaction has a payoff — hover states, micro-animations, focus rings all feel intentional
Nothing is excessive or decorative for decoration's sake
The interface recedes; the content leads
Premium without being cold — warm purple palette, soft glows, readable type
Accessibility is non-negotiable — contrast, focus states, and readable sizes always

What "Off-Brand" Looks Like

Bouncy, elastic, attention-grabbing animations
Neon or saturated accent colors outside the purple/green/gold system
Dense layouts with no breathing room
Generic SaaS components that look AI-generated
Hiding important controls instead of scaling them
Any interaction that would feel at home in a 2015 Bootstrap site


2 · CSS Architecture
Source of Truth File Order
korah-chat.css   ← primary source of truth for all shared patterns
sat.css          ← SAT-specific extensions; imports korah-chat.css patterns
                   if sat.css conflicts with korah-chat.css, korah-chat.css wins
Theme System
Themes are set on the <html> element via data-theme="dark" or data-theme="light".
Never hardcode colors. Always use CSS variables.
css/* Selectors to use */
[data-theme="dark"]  { }
[data-theme="light"] { }
html[data-theme="dark"]  { }   /* use this form for specificity when overriding */
html[data-theme="light"] { }
CSS Variable Reference
All variables are defined in korah-chat.css. Look them up there for actual values.
The table below is a semantic map so you understand what each variable is for.
VariableDark ValueLight ValuePurpose--bg#06040f#faf8ffPage background--bg2#0d0920#f3efffSecondary background--bg3#120c28#ebe5ffTertiary background / input fill--sfrgba(18,12,40,.7)rgba(255,255,255,.85)Surface (glass panels)--sf2rgba(30,18,60,.6)rgba(243,239,255,.9)Secondary surface--bdrgba(139,92,246,.2)rgba(109,40,217,.18)Primary border--bd2rgba(139,92,246,.1)rgba(109,40,217,.1)Subtle border--tx#f0eaff#1a0a3cPrimary text--tx2#a89dc0#5a4a7aSecondary text--tx3#6b5f88#9080aaMuted / label text--p4#8b5cf6#8b5cf6Primary purple--p5#a78bfa#7c3aedSecondary purple--ac#f0abfc#a21cafAccent / highlight--curgba(91,33,182,.25)rgba(109,40,217,.12)Active/selected tint--glowrgba(139,92,246,.35)rgba(109,40,217,.15)Shadow glow--grn#34d399#059669Success / green--gold#fbbf24#d97706Warning / gold--red#f87171#dc2626Error / danger--mg#22c55e#16a34aMood green--my#eab308#ca8a04Mood yellow--mr#ef4444#dc2626Mood red--nbrgba(6,4,15,.85)rgba(250,248,255,.9)Navbar background--cbrgba(15,9,35,.82)rgba(255,255,255,.92)Card/modal background--cargba(18,12,40,.9)rgba(243,239,255,.95)AI message background--sidebar-w18.125rem18.125remSidebar full width
Player-specific variables (sat.css only):
css--player-topbar-h: 3.5rem
--player-footer-h: 4rem
Units

Always rem. Never px for sizing. 1px borders are the only exception.
Reference: 1rem = 16px in most browsers
Use clamp() for fluid type/sizing where the existing code already does so

Glass Effect Pattern
Used on sidebars, modals, topbars, dropdowns.
cssbackdrop-filter: blur(1.5625rem);
-webkit-backdrop-filter: blur(1.5625rem);
background: var(--sf);
Utility classes: .glass (strong blur) · .glass-sm (lighter blur)

### 2.1 · Code Comments & Styling Rules

**"Caveman" Code Comments** (see §0.1 Rule 7)
Minimum words. Describe what major functions do only. No line-by-line commentary.

**TailwindCDN Boundaries**
Tailwind config lives in `korah.js` (inline `tailwind.config`). You may use utility classes in HTML. Do NOT:
- Modify the CDN script URL (`https://cdn.tailwindcss.com`)
- Use `@apply` directives — rely on CSS variables and the existing class system
- Override `theme.extend` values in `korah.js` without asking

**AlpineJS Guidelines**
Alpine drives all interactivity (sidebar, theme, modals, dropdowns). You may add small `x-data`, `x-show`, `x-on:click` attributes inline for component-local state.
You must NOT:
- Create large Alpine components inline — put them in `korah.js` or a page-specific JS file
- Duplicate listeners or helpers that already exist — grep before adding
- Remove or modify `x-cloak` or `data-theme` attributes on `<html>`

3 · Typography Scale
Use this named scale. Rem values are the standard — deviate only when the component's visual context demands it, and flag the deviation.
NameRemUse2xs0.5625remSection labels, badges, uppercase capsxs0.625remTimestamps, tiny metadata, scrollbar labelssm0.6875remSub-labels, helper text, nav textbase-sm0.75remSecondary body, card descriptionsbase0.8125remPrimary body text in UI elementsbase-lg0.875remSettings labels, readable prosemd0.9375remChat input, message bodylg1remNav icons, standard interactive labelsxl1.125remSub-headings, modal titles2xl1.25remSection headings, timers3xl1.5remPage titlesdisplayclamp(2rem, 5vw, 3.5rem)Welcome screen hero, SAT bank h1
Font: 'Plus Jakarta Sans', sans-serif for all UI. 'Playfair Display', serif for display/hero headings (available via `font-display` utility in Tailwind config). 'JetBrains Mono', monospace for code previews only.

If you believe an outside font would look better, propose the font family and a CDN link — do not add it without explicit approval.
Weight conventions:

500 — body, list items
600 — labels, secondary headings
700 — buttons, nav links, card titles
800 — timers, counters, display numbers
900 — hero numbers (SAT question number, score displays)

Letter spacing conventions:

Uppercase labels: 0.1em to 0.16em
Normal UI text: default or -0.02em for large headings
Tabular numbers (timers, counters): font-variant-numeric: tabular-nums


4 · Animation System
Philosophy
Linear-style: smooth, slightly cinematic, purposeful. Every animation should make the interface feel more alive, not call attention to itself.
Standard Timing Functions
css/* Default transitions — smooth deceleration */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Spring — for things that "pop in" (modals, chips, toasts) */
transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

/* Sidebar / panel slides */
transition: width 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);

/* Hover micro-interactions */
transition: transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.3s;
Duration Guidelines
Interaction typeDurationHover color/border change0.15s – 0.2sButton press / scale0.15sDropdown open/close0.2sModal appear0.3sPanel slide (sidebar, doc panel)0.4s – 0.5sPage-level fade in0.5s – 0.6sAmbient loops (pulse, float, breathe)2s – 6s
Keyframe Library
These are already defined in korah-chat.css. Reference them before creating new ones.
KeyframeEffectUsed onfadeInopacity 0→1Modals, overlaysfadeUpopacity + translateYWelcome screen, page loadmsgInopacity + translateY(0.75rem)Chat messagesdropInopacity + translateY(-0.5rem)DropdownsslideUpopacity + translateY(1.875rem) + scale(.95)Settings modalpulse-glowdrop-shadow pulseLogo, active indicatorsfloattranslateY + rotate(2deg) loopMascot avatarsoft-pulsescale(1.025) loopLogo buttonbreatheopacity + scale loopStatus dotsring-pulsescale + opacity loopMascot ringthinking-bouncescale 0.6→1 staggerAI thinking dotstbouncetranslateY loop staggerTyping indicator dotscontentFadeInopacity 0.85→1Streaming contentcheckPoprotate(45deg) scale 0→1Checkbox checktoolsMenuInopacity + scale(0.96)Menusconfetti-falltranslateY + rotateTimer celebrationbounce-inscale 0→1.2→1Celebration cardfloat-uptranslateY(1.25rem)→0Celebration textrefPanelFadeInopacity + scale(0.95)Reference panel [SAT]
Creating New Animations
If you need a new keyframe:

Grep for something similar first
If nothing fits, create it — but keep timing in the ranges above
Ask if it's a complex or page-defining animation

What Not To Do

No animation-duration over 6s for interactive elements
No bounce or elastic on structural layout elements
No animations that block interaction (pointer-events must remain)
No full-page transitions that make the user wait


5 · Layout System
Body Structure
<body>
  <aside class="sidebar">         ← collapsible, fixed on mobile
  <div class="main-area-wrapper"> ← flex row: chat + doc panel
    <div class="main-content">    ← flex column: topbar + body + input
    <aside class="doc-panel">     ← collapsible right panel
Sidebar States
StateClassWidthExpanded.sidebarvar(--sidebar-w) = 18.125remCollapsed (desktop).sidebar.collapsed5.125remMobile open.sidebar.mobile-open80vwMobile closed.sidebar (default mobile)off-screen via transform: translateX(-100%)
Collapsed sidebar hides text, history, and middle section — only icons remain. The .collapsed-more-wrapper appears at bottom for overflow actions.
SAT Player Structure [SAT]
<div class="sat-shell">             ← padding-top/bottom for fixed bars
  <nav class="sat-player-topbar">   ← fixed top, height: --player-topbar-h
  <div class="sat-player-split">    ← fixed between topbar and footer
    [.sat-player-graph-panel]       ← only present when .has-desmos
    [.sat-player-resize-handle]     ← drag handle, only with .has-desmos
    <div class="sat-player-content-panel">
      <div class="sat-player-scroll">  ← the only scroll container
  <footer class="sat-player-footer"> ← fixed bottom, height: --player-footer-h
Responsive Strategy
BreakpointBehaviormax-width: 40remMobile chat: sidebar off-canvas, compact paddingmax-width: 48remSidebar goes fixed/overlay, mobile navmax-width: 64remDoc panel goes fixed overlaymax-width: 56.25rem [SAT]Split layout stacks verticallymax-width: 52.5rem [SAT]SAT page compact paddingmax-width: 48rem [SAT]Mobile: topbar collapses icons to more-menumax-width: 30rem [SAT]Ultra-compact SAT topbar

### 5.1 · Codebase Architecture & File Map

**Directory Hierarchy (under `korah-bot/`)**
```
korah-bot/
├── index.html              App home
├── chat.html               Main chat page
├── login.html              Auth page
├── productivity.html       Productivity dashboard
├── app/                    Core app modules (chat engine, timer, Firestore)
├── sat/                    SAT prep (player, bank, analytics)
├── study/                  Study tools (feed, guides, tests, flashcards)
├── transitions/            Page-transition engine + FOUC prevention CSS
├── sidebar.html            Sidebar HTML template
├── sidebar-loader.js       Dynamic sidebar injector
├── korah.js                Tailwind config + Alpine root components
├── korah.css               CSS variables + semantic color classes
├── support/                Support / FAQ
├── opportunities/          STEM opportunities
├── landing/                Marketing pages
└── release/                Release notes
```

**Routing Rules**
All navigation goes through the transition system:
```
window.KorahTransitions.go('path/to/page.html')
window.KorahTransitions.replace('path/to/page.html')
window.KorahTransitions.goInstant('path/to/page.html')   /* skip animation */
```
Do NOT use `window.location.href` or bare `<a href>` links — they cause a hard reload. The transition engine intercepts same-origin anchor clicks automatically. See `transitions/page-transitions.js` for implementation.

**FOUC Prevention Logic**
Four layers prevent flash-of-unstyled-content:
1. Inline `<script>` in every `<head>` sets `data-theme` from localStorage before CSS paints.
2. `page-transitions.css` hides `<body>` (`opacity: 0`) until `.korah-page-ready` is set.
3. `page-transitions.js` sets `.korah-page-ready` after `window.load` + 50ms settlement.
4. Alpine `x-cloak` hides uninitialized components.
Do not remove or modify any of these layers — breaking one causes visible flash.

**Asset Paths & Dynamic Loaders**
- Sidebar: `<div id="sidebar-root"></div>` → loaded by `sidebar-loader.js` (fetches `sidebar.html`, rewrites relative paths, calls `Alpine.initTree()`).
- Script load order (every page): `page-transitions.js` (sync) → Alpine CDN (defer) → `sidebar-loader.js` (defer) → Tailwind CDN → page-specific JS.
- Firebase init: `study/js/study-firebase-init.js` (type="module") — initializes Firebase app, sets up auth listener, calls `setupKorahDB()`, dispatches `korahReady` event.

**Layout note:** `main-content` and `main-area-wrapper` are the shared flex column/row containers — see §5 Layout System for structure.

6 · Component Library
Each component entry includes: class names, states, dark/light notes, and page scope where relevant. [ALL] = present in korah-chat.css. [SAT] = SAT pages only.

**File Reference Map** — quick overview of every component, what it does, and where it lives:
| § | Component | What It Is | CSS | JS / HTML |
|---|---|---|---|---|
| 6.1 | Glass Panels | Blurred backdrop surface for cards, sidebars, modals | korah-chat.css | — |
| 6.2 | Sidebar | Collapsible nav panel with chat history | korah-chat.css | sidebar.html, sidebar-loader.js, korah.js (app()), study/js/sidebar.js |
| 6.3 | New Chat | Primary CTA button in sidebar header | korah-chat.css | korah.js |
| 6.4 | Topbar | Fixed top bar with mode selector, tutoring toggle | korah-chat.css | korah.js (app()) |
| 6.5 | Messages | Chat bubble list with avatars, markdown content | korah-chat.css | app/korah-chat.js |
| 6.6 | Typing | Animated dots for AI thinking / typing state | korah-chat.css | app/korah-chat.js |
| 6.7 | Welcome | Centered hero on home screen with mode pills, mood picker | korah-chat.css | korah.js (chatWidget()) |
| 6.8 | Chat Input | Fixed bottom textarea with file upload, send button | korah-chat.css | app/korah-chat.js |
| 6.9 | Doc Panel | Right-side file panel with drag-drop upload | korah-chat.css | app/korah-chat.js |
| 6.10 | Modals | Settings panel and delete confirmation overlay | korah-chat.css | korah.js (app()) |
| 6.11 | Dropdowns | Positioned menu with items, separators, sub-panels | korah-chat.css | korah.js (app()) |
| 6.12 | Toast | Bottom-center "pro tip" notification | korah-chat.css | app/korah-chat.js |
| 6.13 | Feed | Card grid for study feed items | korah-chat.css | study/feed.html |
| 6.14 | Study | Flashcards, guides, practice tests, generation progress | korah-chat.css | app/korah-chat.js, study/js/study-api.js |
| 6.15 | Timer | Sidebar timer with presets, circular progress, celebration | korah-chat.css | app/timer-manager.js, korah.js (timer()) |
| 6.16 | Toggles | Settings toggle and SAT mode switch | korah-chat.css | korah.js |
| 6.17 | Buttons | Icon buttons, SAT primary/secondary/ghost, chips | korah-chat.css, sat.css | — |
| 6.18 | Checkboxes | Chat history multi-select and SAT answer checkboxes | korah-chat.css, sat.css | — |
| 6.19 | SAT Section Cards | Section selection grid with colored headers | sat.css, sat-math.css, sat-player-theme.css | sat/js/sat-player.js, sat/js/sat-bank.js, sat/js/sat-analytics.js |
| 6.20 | SAT Question Panel | Question stem, passage card, answer choices | sat.css, sat-math.css, sat-player-theme.css | sat/js/sat-player.js, sat/js/sat-bank.js, sat/js/sat-analytics.js |
| 6.21 | SAT Question Navigator | Grid of question pills with stats, legend | sat.css, sat-math.css, sat-player-theme.css | sat/js/sat-player.js, sat/js/sat-bank.js, sat/js/sat-analytics.js |
| 6.22 | SAT Reference Panel | Draggable overlay with formulas/reference | sat.css, sat-math.css, sat-player-theme.css | sat/js/sat-player.js, sat/js/sat-bank.js, sat/js/sat-analytics.js |
| 6.23 | SAT Player Split | Desmos + question side-by-side layout | sat.css, sat-math.css, sat-player-theme.css | sat/js/sat-player.js, sat/js/sat-bank.js, sat/js/sat-analytics.js |
| 6.24 | SAT Topbar + Footer | Progress bar, timer, nav buttons | sat.css, sat-math.css, sat-player-theme.css | sat/js/sat-player.js, sat/js/sat-bank.js, sat/js/sat-analytics.js |
| 6.25 | BG FX | Star field, ambient particles, glowing orbs | korah-chat.css, sat.css | app/korah-chat.js |
| 6.26 | Scrollbars | Custom purple scrollbar across chat, doc panel, SAT nav | korah-chat.css, sat.css | — |
| 6.27 | Skeleton | Loading placeholder rows for sidebar history | korah-chat.css | study/js/sidebar.js |
| 6.28 | Utilities | Color/text/bg helpers, transition shortcuts, visibility | korah.css, korah-chat.css | — |
| 6.29 | Login | Auth page with black hole hero, login/signup form | korah.css | login.html |
| 6.30 | Landing | Marketing page with nav, hero stats, feature sections | (inline) | landing/index.html |
| 6.31 | Productivity | Todo list, focus timer, mini stats, celebration overlay | korah-chat.css | productivity.html |
| 6.32 | FAQ | Accordion Q&A, category cards, email tooltip | support/support.css | support/index.html |
| 6.33 | Opportunities | Search/filter, card grid with badges, empty state | (inline) | opportunities/opportunities.html |
| 6.34 | Release | Version cards with countdown, mascot, changelog | release/release.css | release/release.js |
| 6.35 | Study Player | Item viewer with stages, progress bar, guide reader overlay | korah-chat.css | study/item.html, study/guide.html, study/js/sidebar.js |

6.1 · Glass Panels [ALL]
The base visual unit. Cards, sidebars, modals, topbars all build on this.
.glass          backdrop-filter: blur(25px), background: var(--sf)
.glass-sm       backdrop-filter: blur(15px), background: var(--sf)
.bg-sf          background: var(--sf)
.bg-sf2         background: var(--sf2)
.bg-card        background: var(--cb)
Border: always 0.0625rem solid var(--bd) or var(--bd2) for subtler.
Box shadow for glow: .shadow-glow · .shadow-glow-lg

6.2 · Sidebar [ALL]
Core classes:
.sidebar                    full sidebar container
.sidebar.collapsed          icon-only mode (desktop)
.sidebar.mobile-open        slide-in overlay (mobile)
.sidebar-header             top logo + new chat row
.sidebar-middle             scrollable middle section (flex: 1, overflow-y: auto)
.sidebar-nav                nav link group
.sidebar-nav-row            horizontal pair of nav links
.sidebar-nav-link           individual nav pill
.sidebar-nav-link.active    current page state
.sidebar-section-label      sticky uppercase section divider
.sidebar-footer             bottom bar with theme toggle + actions
.sidebar-footer-actions     icon button row in footer
History items:
.chat-history               flex column container
.history-item               single chat row (button element)
.history-item.active        currently open chat
.history-item.selected      multi-select state (background: var(--cu))
.history-icon               material icon, flex-shrink: 0
.history-text               truncated title, flex: 1
.history-actions            edit/delete buttons, opacity: 0 → 1 on hover
.history-action-btn         base icon button
.history-action-btn.rename-btn
.history-action-btn.delete-btn
.item-checkbox              multi-select checkbox, shown on hover/selected
Select bar (multi-select mode):
.select-bar                 sticky action bar, display: none → flex when .show
.select-bar.show
.select-bar-count           "N selected" label
.select-bar-actions         flex row of action buttons
.select-bar-btn             small action button
.select-bar-btn.danger      delete action
Collapsed sidebar overflow menu:
.collapsed-more-wrapper     positioned wrapper at sidebar bottom
.collapsed-more-btn         ellipsis trigger button
.collapsed-more-dropdown    upward-opening dropdown
.collapsed-more-dropdown.more-dropdown-open
Sidebar toggle (in topbar):
.sidebar-toggle-btn         hamburger/arrow button
.sidebar-overlay            dark backdrop on mobile when open

6.3 · New Chat Button [ALL]
.new-chat-btn               primary CTA in sidebar header
.new-chat-text              label text (hidden when collapsed)
.new-chat-icon              + icon
Background: rgba(195, 105, 255, 0.717) — do not change this to var(--p4), this specific purple-pink tone is intentional.

6.4 · Topbar [ALL]
.chat-topbar                fixed top bar, height: 4rem
.chat-title-area            flex center, overflow: hidden
.korah-status-dot           green breathing dot (animation: breathe)
.topbar-actions             right-side icon row
.topbar-btn                 icon button, 2.125rem × 2.125rem
.topbar-btn:hover           border-color: var(--p4), background: var(--cu)
Mode selector:
.mode-selector-wrapper      relative position wrapper
.mode-selector-btn          trigger button
.mode-dropdown              absolute dropdown, display: none → .show
.mode-dropdown.show         animation: dropIn
.mode-option                single mode row
.mode-option-icon           emoji/icon
.mode-option-name           bold label
.mode-option-desc           muted description
Tutoring mode toggle (in topbar):
.tutoring-mode-btn          icon+label button
.tutoring-mode-btn.active   background: rgba(139,92,246,.15)
.tutoring-toggle-wrapper    pill container for toggle
.tutoring-switch            label > input + .tutoring-slider
.tutoring-slider            track element

6.5 · Messages [ALL]
List container:
#messages-list              flex column, gap: 1rem, padding-top: 0.5rem
.msg-row                    flex row, animation: msgIn
.msg-row.user               flex-direction: row-reverse
Avatars:
.msg-avatar                 2rem × 2rem, border-radius: 0.625rem
.msg-avatar.korah-av        background: var(--grn) [or var(--p4) in home chat]
.msg-avatar.user-av         background: var(--sf2), border: var(--bd)
Bubbles:
.msg-bubble                 base bubble, max-width: 90%
.msg-bubble.korah           AI bubble — background: var(--ca), left border: var(--p4)
                            border-radius: 1.25rem 1.25rem 1.25rem 0.25rem
.msg-bubble.user            user bubble — gradient background
                            border-radius: 1.25rem 1.25rem 0.25rem 1.25rem
.msg-bubble.error           red-tinted error state
Inside korah bubbles (markdown rendering):
.msg-bubble.korah strong    color: var(--p5)
.msg-bubble.korah em        color: var(--ac)
.msg-bubble.korah code      background: rgba(139,92,246,.15), color: var(--p5)
.msg-bubble.korah h3        font-weight: 700, color: var(--tx)
Message label (sender tag):
.msg-label                  uppercase label above bubble
.msg-label-dot              small pulsing dot, animation: pulse-dot
Inline suggestions (inside AI bubble):
.inline-suggestions         column container with top border
.inline-suggestion-btn      individual suggestion button
                            hover: translateX(0.1875rem)
Attachments in messages:
.msg-attachments            flex wrap container
.msg-attachment-card        file attachment chip
.msg-attachment-card.has-preview   image variant with thumbnail
.msg-attachment-card-thumb  image thumbnail
.msg-attachment-card-icon   file type icon
.msg-attachment-card-name   truncated filename
.msg-attachment-card-size   muted file size

6.6 · Typing / Thinking Indicators [ALL]
.typing-bar                 wrapper row (hidden with .hidden)
.typing-bar.hidden          display: none
.typing-bubble              bubble shell
.typing-dots                flex row of 3 dots
.typing-dot                 individual dot, animation: tbounce with stagger
                            nth-child delays: 0s, 0.16s, 0.32s

.thinking-indicator         AI thinking state row
.thinking-dot               dot, animation: thinking-bounce with stagger

6.7 · Welcome Screen [ALL]
.welcome-screen             centered flex column, animation: fadeUp
.welcome-title              display-size gradient text heading
.welcome-mascot             avatar + ring container
.mascot-avatar              logo square, animation: float
.mascot-ring                pulsing ring, animation: ring-pulse
.welcome-meta               mode badge row
.welcome-mode-badge         pill showing current mode
.welcome-mode-dot           small glow dot
.welcome-mode-text          uppercase mode label
.mode-pills                 mode switcher row
.mode-pill                  individual mode pill
.mode-pill.active           border: var(--p4), background: var(--cu)
Welcome input:
.welcome-input-container    textarea wrapper card
.welcome-textarea           auto-resize textarea
.welcome-textarea.rolling   animation: welcomePlaceholderRoll (placeholder cycle)
.welcome-attachments        file chip row (hidden when empty)
.welcome-input-actions      bottom action row
.welcome-right-actions      send + project buttons
.welcome-send-btn           circular some button, background: var(--mg) or var(--p4)
Suggestion chips:
.suggestion-grid            flex wrap, justify: center
.suggestion-chip            rounded pill, hover: translateY(-0.125rem)
Mood picker:
.mood-picker-mini
.mood-row                   flex row of mood buttons
.mood-mini                  individual mood button
.mood-mini.gm               green mood, border: var(--mg)
.mood-mini.ym               yellow mood, border: var(--my)
.mood-mini.rm               red mood, border: var(--mr)
.mood-mini.gm.active        background: rgba(34,197,94,.12)

6.8 · Chat Input Area [ALL]
.chat-input-area            fixed bottom padding area
.input-wrapper              floating card (bg: var(--bg2))
.input-wrapper:focus-within border: var(--p4), translateY(-0.125rem)
.chat-textarea              auto-resize, no scrollbar (scrollbar-width: none)
.input-files-bar            attached file chips, display: none → .show
.input-files-bar.show       animation: slideUp
.input-file-chip            file chip in input
.input-file-chip-remove     × button on chip
.input-actions-row          bottom row (left tools + right send)
.input-actions-left         tool buttons
.input-actions-right        model badge + send
.input-action-btn           tool icon button
.model-badge-mini           model label pill
.send-btn-circle            circular send button, background: var(--grn)
.input-footer               disclaimer text below input

6.9 · Document Panel [ALL]
.doc-panel                  right sidebar, default width: 3.5rem (collapsed)
.doc-panel.expanded         width: 20rem
.doc-panel.collapsed        width: 3.5rem
.doc-panel.drag-over        drag target highlight state

.doc-panel-tab              tongue tab for expand/collapse
.doc-panel-collapsed-content  icon-only collapsed view
.doc-panel-expanded-content   full panel view
.doc-panel-header           title + action row
.doc-panel-title            panel heading
.doc-panel-list             scrollable card list
.doc-panel-empty            centered empty state
.doc-panel-empty-icon
.doc-panel-empty-text
.doc-panel-empty-hint

.doc-card                   individual file card
.doc-card-inner:hover       translateY(-0.125rem), border: var(--p4)
.doc-card::before           spotlight radial gradient (--mouse-x, --mouse-y)
.doc-card-preview           thumbnail area, height: 8.75rem
.doc-card-preview img       covers, scale on hover
.doc-text-preview           text file preview (monospace, clamped)
.doc-icon-preview           non-image file icon
.doc-card-info              name + size row
.doc-card-name              truncated filename
.doc-card-size              muted size label
.doc-card-remove            × button, shows on card hover

.drag-overlay               full-screen drop target (position: absolute on .main-content)
.drag-overlay.active        display: flex, animation: overlayIn
.drag-overlay-inner         centered content card
.drag-overlay-icon          large emoji
.drag-overlay-text          heading
.drag-overlay-hint          secondary hint pill
Mobile (max-width: 64rem): doc panel becomes position: fixed, slides from right.

6.10 · Modals [ALL]
Settings modal:
.settings-modal             fixed overlay, display: none → .show (flex)
.settings-modal.show        animation: fadeIn
.settings-modal-content     scrollable content card, max-width: 31.25rem
.settings-header            title + close button row
.settings-title
.settings-close             red × button
.settings-body              padded flex column
.settings-section           grouped settings card
.settings-section-title     purple uppercase label
.settings-item              label + control row
.settings-select            styled dropdown (with SVG arrow bg-image)
.settings-input             text input
.settings-btn               action button
.settings-btn.primary       gradient purple CTA
.settings-btn.danger        red bordered button
.settings-save-btn          footer save button
Custom select (inside settings items):
.settings-select-trigger, .settings-select-menu,
.settings-select-option, .settings-custom-select,
.settings-item-control, .settings-item-label
                      -- Custom styled select dropdown inside settings modal items (shared with study player)
Delete confirmation modal:
.delete-modal               fixed overlay, display: none → .show
.delete-modal.show          animation: fadeIn
.delete-modal-content       centered card, animation: toolsMenuIn
.delete-modal-icon          large emoji
.delete-modal-title
.delete-modal-desc          description with .span for item name
.delete-modal-actions       button row
.delete-modal-btn.cancel
.delete-modal-btn.confirm   red confirm button

6.11 · Dropdown Menus [ALL]
This is the shared pattern. korah-chat.css is the source of truth. sat.css reuses these same classes — if you see them defined in sat.css, treat those definitions as page-specific overrides only.
.more-dropdown-trigger      button that opens the menu
.more-dropdown-trigger.is-active  open state styling
.more-dropdown-menu         positioned dropdown card
.more-dropdown-menu.more-dropdown-open  opacity: 1, visible, scale(1)
.more-dropdown-list         ul, padding: 0.375rem 0
.more-dropdown-item         li link/button, hover: rgba(139,92,246,.15)
.more-dropdown-item::before left accent bar, scaleY(0→1) on hover
.more-dropdown-item.danger  red text/icon
.more-dropdown-separator    hr-style divider
.more-dropdown-arrow        chevron → icon (margin-left: auto)
.more-dropdown-check        ✓ icon for active state (opacity: 0 → 1)
.more-dropdown-badge        "coming soon" etc. pill
.more-dropdown-disabled     opacity: 0.5, cursor: not-allowed
.more-dropdown-collapsed-item  only visible ≤ 768px
Theme drill-down sub-panel:
.more-dropdown-page[data-page="main"]
.more-dropdown-page[data-page="theme"]
.more-dropdown-page[data-page="main"].theme-open  translateX(-100%), opacity: 0
.more-dropdown-theme-panel
.more-dropdown-theme-header
.more-dropdown-back-btn     ← Back button
.more-dropdown-theme-option
.more-dropdown-theme-option.active  shows .more-dropdown-check
SAT dropdown sub-trigger (index page):
.sat-dropdown-wrapper       relative wrapper
.sat-more-dropdown          same pattern as .more-dropdown-menu
.sat-more-dropdown.more-dropdown-open

6.12 · Toast Notification [ALL]
.pro-tip-toast              fixed bottom center, opacity: 0, pointer-events: none
.pro-tip-toast.show         opacity: 1, translateY(0), scale(1)
                            animation: spring cubic-bezier(0.34, 1.56, 0.64, 1)
.pro-tip-toast-icon         emoji/icon, animation: proTipPulse (scale loop)
.pro-tip-toast-content      flex column
.pro-tip-toast-label        purple uppercase "PRO TIP" label
.pro-tip-toast-text         body text
.pro-tip-toast-close        × button, hover: rotate(90deg)
Mobile: full-width, left/right 1rem inset.

6.13 · Feed Cards [ALL]
.feed-cards                 CSS grid, auto-fill minmax(18.75rem, 1fr)
.feed-card                  card with top accent bar (::before, opacity: 0 → 1 on hover)
.feed-card:hover            translateY(-0.25rem) scale(1.01)
.feed-card-header           type badge + source badge
.feed-card-type             uppercase colored label
.feed-card-source           muted badge
.feed-card-title            bold card heading
.feed-card-desc             body text, flex: 1
.feed-card-meta             small metadata
.feed-card-actions          flex button row
.feed-card-btn              action button
.feed-card-btn.primary      purple fill
.feed-card-delete-btn       small × button, top-right
.feed-empty                 centered empty state card

6.14 · Study Content Renderers [ALL]
Flashcards:
.flashcard-container        grid, auto-fit minmax(17.5rem, 1fr)
.flashcard                  perspective: 62.5rem, height: 11.25rem
.flashcard.flipped          .flashcard-inner rotateY(180deg)
.flashcard-inner            preserve-3d, transition: transform 0.6s
.flashcard-front            front face (backface-visibility: hidden)
.flashcard-back             back face (rotateY(180deg), background: var(--cu))
.flashcard-label            "Question" / "Answer" label
.flashcard-text             content
.card-delete-btn            absolute top-right × button
Study guide:
.study-guide                flex column
.study-guide-section        accordion item
.study-guide-section.collapsed  max-height: 0
.study-guide-title          clickable header row
.toggle-icon                ▼ chevron, rotates -90deg when collapsed
.study-guide-content        collapsible body, max-height: 31.25rem
Practice test:
.practice-test              flex column, gap: 1rem
.practice-question          card with number + text + textarea
.practice-q-number          purple uppercase "Q1" label
.practice-q-text            question text
.practice-answer            auto-resize textarea
.practice-submit-btn        gradient purple submit
Study generation progress:
.study-gen-bubble           status container
.study-gen-status           icon + text row
.study-gen-progress-container  progress bar track
.study-gen-progress-bar     fill bar, animation: study-progress (10s)
.study-gen-progress-bar.loading  triggers animation
.study-gen-success          revealed on completion (display: none → .show flex)
.study-gen-btn              "View in Study Hub" CTA
.study-modern               Modern study item wrapper
.create-input, .create-textarea  Shared create/edit inputs (also in productivity)

6.15 · Timer Widget [ALL]
The timer lives in the sidebar and has two display modes: idle (collapsed) and active (running/paused).
Idle state:
.timer-idle-trigger         full-width pill button to expand
.timer-idle-chevron         ▼ rotates when open (.open)
.timer-idle-panel           collapsible, max-height: 0 → 12.5rem on .open
.timer-idle-panel-inner     inputs + start button
.timer-split-input          hours/minutes split
.timer-custom-input         number input (no spin buttons)
.timer-input-label          "HRS" / "MIN" label
.timer-start-btn            purple gradient start button
Active states:
.timer-widget-container     wrapper, styles change per state
.timer-widget               base timer element
.timer-widget.idle          reduced opacity
.timer-widget.running       .timer-widget-time-large → color: var(--p4)
.timer-widget.paused        opacity: 0.8
.timer-widget.circular      layout variant with SVG progress ring
.timer-widget-circular-layout  flex row: time+controls on left, ring on right
.timer-widget-time-large    large number display
.timer-widget-svg           SVG circle track
.timer-widget-circle-bg     background circle stroke
.timer-widget-circle-progress  foreground stroke (transition: stroke-dashoffset)
.timer-widget-controls-circular  play/pause/stop buttons
.timer-widget-btn           icon button
.timer-widget-btn.start     labeled start button, background: var(--p4)
.timer-widget-btn.resume    icon button, background: var(--p4)
Dropdown (settings + presets):
.timer-dropdown             max-height: 0 → 28.125rem on .show
.timer-dropdown.show        opacity: 1, padding: 0.75rem
.timer-dropdown-header      title + sound toggle row
.timer-sound-toggle         mute/unmute button
.timer-dropdown-status      current timer display card
.timer-dropdown-time        large time display
.timer-dropdown-progress    track bar
.timer-dropdown-progress-bar  fill, gradient
.timer-dropdown-controls    pause/resume/stop buttons
.timer-dropdown-btn
.timer-dropdown-btn.resume-btn  purple fill
.timer-dropdown-presets     preset list
.timer-preset-btn           individual preset row
.timer-preset-btn.active    highlighted state
.preset-time                right-side time label (purple)
.preset-label               left description
Celebration:
.timer-celebration          gradient purple card, shown on completion
.timer-celebration-icon     big emoji, animation: bounce-in
.timer-celebration-text     congrats message
.timer-celebration-btn      restart button
Collapsed sidebar: .timer-dropdown and .timer-widget-container are both display: none !important.

6.16 · Toggles & Switches [ALL]
Settings toggle:
.setting-toggle             label wrapper, 3rem × 1.625rem
input (hidden)
.toggle-label               track, ::after is the thumb
.setting-toggle input:checked + .toggle-label  background: var(--p4), thumb translateX(1.375rem)
Tutoring mode toggle (see 6.4)
SAT switch toggle [SAT]:
.sat-switch                 inline-flex wrapper
.sat-switch input           hidden
.sat-switch-track           3rem × 1.75rem track, background: rgba(148,163,184,.34)
.sat-switch-track::after    thumb
input:checked + .sat-switch-track  gradient: linear-gradient(135deg, #7c3aed, #60a5fa)

6.17 · Buttons [ALL]
Utility action button:
.input-action-btn           2rem icon button, hover: var(--cu) + scale(1.05)
.topbar-btn                 2.125rem icon button
.theme-toggle-small         2rem × 2rem theme icon button
SAT buttons [SAT]:
.sat-button                 base: height 2.875rem, border-radius: 0.875rem
.sat-button:hover           translateY(-0.125rem), border: var(--p4)
.sat-button-primary         gradient purple, box-shadow: var(--glow)
.sat-button-secondary       background: var(--sf2)
.sat-button-ghost           background: var(--sf), color: var(--tx2)
SAT chips [SAT]:
.sat-chip                   height 2.25rem, border-radius: 999px
.sat-chip.is-active         background: var(--cu), color: #fff, border: var(--p4)
.sat-toolbar-pill           height 2.875rem, border-radius: 0.875rem
.sat-toolbar-pill.is-active background: var(--cu), border: var(--p4), color: var(--p5)

6.18 · Checkboxes [ALL / SAT]
Chat history multi-select:
.item-checkbox              0.9375rem square, hidden by default
                            display: flex on parent hover or .selected state
.history-item.selected .item-checkbox  background: var(--p4), shows ✓ SVG
SAT checkboxes [SAT]:
.sat-check                  1.125rem square, border: rgba(139,92,246,.4)
.sat-check:hover            border: var(--p4), box-shadow: var(--glow)
.sat-check.is-active        background: var(--p4), border: var(--p4), shows ✓
.sat-check-lg               larger variant for section headers
.sat-section-check          white-themed check for colored section headers
.sat-section-check.is-active  background: white, check color: var(--p4)

6.19 · SAT Section Cards [SAT]
.sat-section-column         2-col grid (stacks at 70rem)
.sat-section-card           glass card with colored header
.sat-section-card.is-english .sat-section-header  gradient: #b12bd8 → #9d36d1
.sat-section-card.is-math   .sat-section-header  gradient: #55a7eb → #4b98de
.sat-section-header         flex row, color: white, cursor: pointer
.sat-section-header:hover   opacity: 0.75, brightness: 1.2
.sat-section-title          h-style heading
.sat-section-count          rgba(255,255,255,.8) sub-label
.sat-domain-group           interior padded section
.sat-domain-row             flex row with name + count
.sat-topic-row              indented topic row
.sat-topic-row.is-selected .sat-topic-heading  color: var(--tx), font-weight: 700

6.20 · SAT Question Panel [SAT]
.sat-question-panel         glass card, display: grid, gap: 1rem
.sat-question-number        1.75rem/900, color: var(--p5), text-shadow glow
.sat-domain-label           pill badge, background: rgba(139,92,246,.1)
.sat-passage-card           content card, background: var(--sf2)
.sat-passage-text           line-height: 1.8
.sat-question-stem          color: var(--tx2), font-weight: 600

.sat-answer-list            flex column, gap: 0.625rem
.sat-answer-item            answer row with left accent bar (::before)
.sat-answer-item:hover      border: var(--p4), translateX(0.25rem), bar scaleY(1)
.sat-answer-item.is-selected  border: var(--p5), rgba(139,92,246,.1)
.sat-answer-item.is-correct   border: #22c55e, green bg
.sat-answer-item.is-incorrect border: #f87171, red bg
.sat-answer-letter          circle showing A/B/C/D
                            hover: background + border → var(--p4), color: white

.sat-feedback-panel         explanation card below question
.sat-feedback-panel.is-correct  border: rgba(52,211,153,.34)
.sat-feedback-panel.is-incorrect  border: rgba(248,113,113,.34)

.sat-spr-input              open-answer input
.sat-spr-input.is-correct   green border + bg
.sat-spr-input.is-incorrect red border + bg
Dark mode: .sat-passage-card gets rgba purple tint; SVGs/images get filter: invert(1) hue-rotate(180deg).

6.21 · Question Navigator [SAT]
.q-nav-trigger              footer button to open navigator
.q-nav-trigger.is-open      chevron rotates 180deg
.q-nav-panel                fixed positioned popover (above footer)
.q-nav-panel.is-open        opacity: 1, translateX(-50%) translateY(0)
.q-nav-panel::before        2px gradient accent line at top
.q-nav-inner                scrollable interior (custom scrollbar)
.q-nav-stats                stats strip (answered, correct, flagged counts)
.q-stat-item                individual stat with legend icon
.q-stat-total               total count pill
.q-nav-section-label        divider label with extending line (::after)
.q-nav-grid                 auto-fill grid of pills
.q-pill                     question number pill
.q-pill:hover               scale(1.07), border: var(--p4)
.q-pill.is-current          purple ring, underline dot (::after)
.q-pill.is-attempted        rgba(139,92,246,.15), color: var(--p5)
.q-pill.is-correct          green tint, color: #22c55e
.q-pill.is-incorrect        red tint, color: #f87171
.q-pill-flag                orange bookmark badge (absolute top-right)
.q-nav-legend               legend row at bottom
.q-legend-item              dot + label
.q-legend-dot               small colored square/circle
Mobile (≤ 480px): panel becomes full-width bottom sheet, slides up with translateY.

6.22 · Reference Panel (Draggable) [SAT]
.reference-panel            fixed, draggable overlay card
                            width: 37.5rem, animation: refPanelFadeIn
.reference-panel:hover      deeper box-shadow
.reference-panel.collapsed  .reference-content is display: none
.reference-drag-handle      top bar, cursor: grab → grabbing
.reference-drag-handle:hover  background: rgba(139,92,246,.6)
.reference-drag-handle span uppercase panel title
.reference-collapse-btn     ▼ button, flips when .collapsed
.reference-close-btn        × button, hover: rgba(239,68,68,.85)
.reference-content          image/content area
Mobile: full-width, positioned at top, content max-height: 50vh.

6.23 · SAT Player Split Layout [SAT]
.sat-player-split           fills space between topbar and footer
.sat-player-split.has-desmos  grid: 1fr 0.5rem 1fr (desktop)
.sat-player-graph-panel     Desmos calculator panel (left)
.sat-player-resize-handle   drag handle (visible line on hover)
.sat-player-content-panel   question content (right / full when no Desmos)
.sat-player-scroll          the only scroll container inside content panel
Mobile (≤ 56.25rem with Desmos): stacks vertically. Graph panel flex: 0 0 42%, resize handle becomes horizontal bar.

6.24 · SAT Topbar + Footer [SAT]
.sat-player-topbar          fixed top, height: var(--player-topbar-h)
.sat-topbar-left            back button area
.sat-topbar-center          progress + question info
.sat-topbar-right           timer + action buttons
.sat-timer-display          tabular-nums, color: var(--p5)
.sat-player-header-center   progress bar + number display
.sat-progress-container     max-width: 15rem, height: 0.25rem
.sat-progress-bar           gradient fill, transition: width 0.3s

.sat-player-footer          fixed bottom, height: var(--player-footer-h)
                            background: linear-gradient(to top, var(--sf)...)
.sat-footer-group           flex row with counter + nav buttons

6.25 · Background Effects [ALL / SAT]
Chat background:
#bg-canvas                  radial-gradient base, filter: blur(0.0625rem)
.stars-container            star field, transition: opacity 0.4s
.shooting-star              animated diagonal streak
.moon-bg                    ::before pseudo moon (dark mode only)
.c-dot                      floating ambient particles, animation: c-float
SAT background orbs [SAT]:
.sat-bg-orb                 fixed, pointer-events: none, filter: blur(10px)
.sat-bg-orb-a               purple orb (top-left)
.sat-bg-orb-b               blue orb (bottom-right)
.sat-bg-orb-c               orange orb (top-right)

6.26 · Scrollbars [ALL]
Global pattern (defined in both files — korah-chat.css wins):
css::-webkit-scrollbar { width: 0.3125rem }
::-webkit-scrollbar-track { background: transparent }
::-webkit-scrollbar-thumb { background: var(--p4); border-radius: 0.1875rem }
::-webkit-scrollbar-thumb:hover { background: var(--p5) }
Chat body has slightly wider scrollbar (0.375rem).
Doc panel list has purple scrollbar explicitly set.
Custom thin scrollbar for .q-nav-inner (4px).

6.27 · Skeleton Loading [ALL]
.skeleton-item              placeholder row in sidebar history
.skeleton-icon              small circle, animation: pulse-glow
.skeleton-text              flex-1 bar, animation: pulse-glow
pulse-glow keyframe: opacity oscillates 0.4 → 0.2 → 0.4.

6.28 · Utility Classes [ALL]
Color helpers:
.grad-text          purple-to-accent gradient clipped text
.grad-bg            green gradient background
.grad-bg-purple     purple gradient background
.tx / .tx2 / .tx3   text color shortcuts
.tx-p4 / .tx-p5     purple text
.tx-grn / .tx-gold  semantic text colors
.bg-base / .bg-base2 / .bg-card / .bg-sf / .bg-sf2  background shortcuts
.bd / .bd2          border-color shortcuts
Transition helpers:
.t-theme            transition: background-color, border-color, color (0.4s)
.t-btn              transition: transform, box-shadow, filter, background, opacity (0.3s)
.t-btn:active       scale(0.95)
Visibility:
.is-hidden [SAT]    display: none !important
.anim-delay-100 through .anim-delay-800  Animation delay stagger helpers (100ms–800ms)
.tx-mg, .tx-mr, .tx-my  Mood text colors (green, red, yellow)
.bg-base3, .radial-glow-bg, .grad-bg-intro  Additional background variants
.shadow-card          Card box shadow utility
.chat-body            Chat scroll container
.theme-toggle         Small theme switch button
.step-num             Step number circle (used in SAT questions)

6.29 · Hero & Login Elements [NEW]

**Page shell:**
.kl-shell                   Full-height flex row: hero (left) + auth (right)
.kl-hero-panel              Left panel — black hole + "KORAH A.I" title
.kl-hero-inner              Centered hero content wrapper
.kl-auth-panel              Right panel — login/signup form
.kl-bh-wrap, .kl-bh-canvas, .kl-bh-canvas-b, .kl-bh-stage
                            Black hole background layers (hero panel)
.kl-bh-singularity          The black center of the black hole
#staticStarField            Gravitational lensing stars (Dark mode only)
#shootingStarCanvas         Spaghetti physics shooting stars
.kl-hero-title              "KORAH A.I" text with kl-breath animation

**Login card:**
.login-card                 Isolated starfield background inside the auth panel
.login-card-inner           Card interior (form content)
.login-star-canvas          Inline starfield canvas (inside card)
.login-title, .login-subtitle  Heading + subtitle

**Auth form:**
.tabs, .tab                 Login / Signup tab switcher
.form-container             Form wrapper
.form-group, .form-label, .form-input  Field group
.input-error                Red error text below field
.name-fields-row            First/last name side-by-side row
.btn, .btn-primary          Auth submit button (purple gradient)
.btn-google                 Google sign-in button
.password-toggle            Show/hide password icon
.spinner                    Loading spinner inside button

**Misc:**
.divider                    "or" divider between Google and email
.text-center                Centered text utility

6.30 · Landing Page Components [NEW]

**Shared nav (also used on support & opportunities):**
.nav-links, .nav-link, .nav-link-icon, .nav-link-text,
.nav-pill, .nav-indicator   Pill-style nav with hover indicator underline

**Hero stats:**
.hero-stat-label, .hero-stat-num  Hero stats row (label + number)
.reveal                     Scroll-reveal animation trigger
.stat-divider               Vertical divider between stats

**Browser mockup:**
.mock-browser, .mock-browser-bar  Browser chrome mockup with dot bar
.mock-dot, .mock-side       Window control dots + sidebar

**Feature content:**
.feature-section            Feature content section
.bullet-list, .bullet-dot   Bullet list with animated dot

6.31 · Productivity Dashboard [NEW]

**Page layout:**
.prod-page, .prod-scroll    Full-page scroll container
.prod-section-head          Section heading row
.prod-stats-col             Stats column layout
.prod-mini-stat             Compact stat card
.prod-timer-grid            Timer + todo side-by-side grid
.prod-todo-card             Todo list card container

**Todo list:**
.todo-list, .todo-item, .todo-text, .todo-chip,
.todo-checkbox, .todo-delete, .todo-due-badge
                            Todo item: checkbox, text, due badge, delete button
.todo-input-row, .todo-add-btn, .todo-text-input
                            Add-todo inline form row
.todo-tabs, .todo-tab       "All / Active / Completed" filter tabs
.todo-empty                 Empty state (hidden via .hidden)

**Timer (productivity-specific, distinct from §6.15):**
.timer-card                 Timer card container
.timer-circle-container, .timer-circle-bg, .timer-circle-progress,
.timer-svg                  Circular SVG progress ring
.timer-display              Large time display
.timer-status-label         "Focus" / "Break" status label
.timer-controls, .timer-btn-primary, .timer-btn-secondary
                            Play/pause/reset button row
.timer-presets              Preset duration pills row
.preset, .preset-pill       Individual preset pill

**Mini stats / mood:**
.mini-value, .mini-sub, .mini-label, .mini-stat-purple,
.mini-stat-green, .mini-stat-amber, .mini-wm
                            Compact stat card with colored left accent
.mood-dot, .mood-indicator  Current mood dot indicator

**Priority dropdown:**
.priority-dropdown, .priority-dropdown-menu, .priority-opt
                            Todo priority picker (low/med/high)

**Celebration overlay:**
.prod-celebration-overlay, .prod-celebration-card,
.prod-celebration-emoji, .prod-celebration-title,
.prod-celebration-msg, .prod-celebration-stats,
.prod-celebration-stat, .prod-celebration-stat-lbl,
.prod-celebration-stat-val, .prod-celebration-actions,
.prod-cta-primary, .prod-cta-secondary
                            Full-screen celebration on streak/timer completion,
                            with stats row + action buttons

6.32 · Support / FAQ Page [NEW]

.faq-card                   FAQ card container
.faq-scroll-container       Scrollable FAQ list
.accordion-header, .accordion-chevron, .accordion-content
                            Accordion: click header to toggle content, chevron rotates
.hero-glass                 Hero section glass backdrop
.explore-card               Category explore card
.t-hover                    Hover transition utility
.tapped                     Tap state utility
.email-tooltip-trigger      Shows email on click

6.33 · Opportunities Page [NEW]

**Hero:**
.opp-hero, .opp-hero-left, .opp-hero-right,
.opp-hero-title, .opp-hero-sub, .opp-hero-actions
                            Hero section: left text + right illustration

**Search & filters:**
.opp-search-wrap, .opp-search-icon, .opp-search
                            Search bar with icon
.opp-filters, .opp-filters-header, .opp-filter-row,
.opp-filter-label           Inline filter controls
.opp-chip-group, .opp-chip, .opp-clear-btn
                            Filter tag chips + clear all
.opp-results-bar            "Showing X of Y" results strip

**Card grid:**
.opp-grid                   Auto-fill card grid
.opp-card, .opp-card-top, .opp-card-name, .opp-card-org,
.opp-card-desc, .opp-card-meta, .opp-card-footer
                            Opportunity card: icon top, name, org, description, meta, footer
.opp-cat-badge, .opp-cost-pill, .opp-deadline,
.opp-meta-tag, .opp-badge-count
                            Card badges: category, cost (free/$), deadline, meta tags

**Controls:**
.opp-learn-btn, .opp-submit-link  Card CTA buttons
.opp-dropdown-wrap, .opp-dropdown-btn, .opp-dropdown-chevron,
.opp-dropdown-menu, .opp-dropdown-item
                            Sort/filter dropdown

**Empty state:**
.opp-empty, .opp-empty-icon, .opp-empty-title, .opp-empty-sub
                            No-results state

.opp-body                   Main content wrapper

6.34 · Release Notes [NEW]

.release-card               Version release card
.release-label, .release-date  Version label + date badge
.content-wrapper            Centered content constraint
.prerelease-body            Pre-release notice body
.countdown-timer            Countdown to next release
.mascot-container, .korah-mascot  Mascot illustration area
.text-content, .description  Body text containers
.footer-note                Footer note text
.title                      Page title

6.35 · Study Player / Item Viewer [NEW]

**Player shell:**
.study-player, .study-modern, .study-feed-body  Player container (study item / guide)

**Hero & stage:**
.player-hero, .player-hero-head, .player-body,
.player-stage, .player-stage-top, .player-sub,
.player-title, .player-modes
                            Hero area: title, mode badges, stage indicator
.player-content-eyebrow, .player-content-text,
.player-list-item-title, .player-list-item-body
                            Stage content renderer classes

**Controls & progress:**
.player-controls, .player-nav-btn, .player-util-btn
                            Prev/next nav + utility buttons
.player-progress-track, .player-progress-fill, .player-progress-text
                            Stage progress bar

**Item meta & edit:**
.item-body, .item-meta-bar, .item-actions  Item meta row + action buttons
.item-edit-field, .item-edit-form, .item-edit-grid,
.item-edit-label, .item-edit-modal-content,
.item-edit-remove, .item-edit-row-head
                            Inline edit modal for item fields

**Guide reader overlay:**
.guide-reader-body, .guide-reader-head, .guide-reader-modal,
.guide-reader-dialog, .guide-reader-close,
.assistant-content, .study-guide-markdown
                            Study guide reader overlay with AI assistant sidebar

7 · Dark / Light Mode Rules

Never hardcode a color in a new component. Always use a CSS variable.
Test in both modes before considering anything done.
Light mode often needs explicit overrides because dark mode is the design baseline. If a component looks wrong in light mode, add html[data-theme="light"] .your-class { } overrides.
Common light-mode corrections:

Replace rgba(255,255,255,X) text with var(--tx) or var(--tx2)
Replace dark rgba(0,0,0,X) backgrounds with var(--sf) or var(--cb)
Ensure shadows use rgba(109,40,217,X) instead of rgba(0,0,0,X) for purple glow
Gradient fills (topbar, footer) need explicit background override


SAT dark mode note: passage cards invert SVGs/images with filter: invert(1) hue-rotate(180deg). Account for this when adding new content types in passage cards.


8 · Focus & Accessibility

All interactive elements must have :focus-visible styles.
Use outline: 0.125rem solid var(--p4); outline-offset: 0.125rem; as the standard focus ring.
Never remove outlines with outline: none on focusable elements unless you provide a visible alternative.
Ensure color alone never conveys state — always pair color with shape, icon, or text.
Minimum touch target: 2.75rem × 2.75rem on mobile.
font-variant-numeric: tabular-nums on all timer/counter displays.


9 · What To Do When You Are Stuck
SituationActionCan't find a class for something that probably existsGrep more broadly. Still can't find it? Pause and ask.Need a new animation Check keyframe library (§4). Still nothing? Create it, flag it.Component looks wrong in light mode Add html[data-theme="light"] overrides. Do not add !important to fight existing rules.SAT and chat CSS seem to conflict korah-chat.css wins. Move the rule there if it's shared.Need a layout that doesn't exist Ask first. Do not invent a layout structure that conflicts with existing flex/grid containers.Task would require more than 2 !important overrides Stop. There is a structural problem. Ask.

### 9.1 · Task-Specific Validation Protocol
Before declaring a task "Done", you MUST generate a **Task-Specific Deep-Dive Checklist** based on the unique complexity of the task (e.g., "Verify contrast on light mode scrollbar", "Check animation overlap on mobile").

10 · Maintaining This Document
This file is a living document. When you:

Create a new component: add it to §6 with all states documented
Establish a new animation: add it to the keyframe table in §4
Add a new page with new CSS: note its scope with a page tag
Find something documented here that no longer matches the code: update this file and note the change in your ## What I did section

The goal is that any agent reading this file can orient themselves in the codebase in under 5 minutes.

Always make sure each new thing works completely and check for any bugs or Bed code formating.

11 · Quality Assurance Checklist

Before declaring any task DONE, run through this checklist:

**Responsiveness**
- [ ] Test at 1200px+ (desktop)
- [ ] Test at 768px (tablet)
- [ ] Test at 375px (mobile)
- [ ] No horizontal scrollbars or overflow at any breakpoint
- [ ] All controls visible and tappable

**Theme**
- [ ] Test in dark mode
- [ ] Test in light mode
- [ ] No hardcoded colors — only CSS variables used
- [ ] Light mode looks intentional (not broken dark-mode defaults)

**Accessibility**
- [ ] `:focus-visible` rings on all interactive elements
- [ ] Color is never the sole state indicator
- [ ] Mobile touch targets ≥ 2.75rem × 2.75rem

**Code Hygiene**
- [ ] No `!important` without explicit approval (per §0.1 Rule 3)
- [ ] No new npm packages or CDN scripts without permission (per §0.1 Rule 4)
- [ ] Grepped for existing classes before creating new ones (per §0.1 Rule 1)
- [ ] No duplicate listeners or helpers exist (per §0.1 Rule 1)

**Post-Execution Declaration**
After completing the task and verifying the checklist, include this exact block at the end of your response:
```
## QA Verification
- Responsiveness: [pass/fail at each breakpoint]
- Theme: [dark pass / light pass]
- Accessibility: [focus rings, color-independence, touch targets]
- Code hygiene: [no !important, no new deps, no duplicates]
```

Reflection Questions
Use these questions to guide design decisions:
Colors
- Did I test this color in both dark and light modes?
- Is the text readable against each background?
Layout
- Will this work at all screen sizes?
- Are all essential controls visible?
Code
- Am I using rem units?
- Is there a simpler way to achieve this?
User Experience
- Does this animation enhance or distract?
- Is the flow natural and intuitive?
- Would this feel polished and professional?
Questions
- Can I make this even more amazing? Not just decent but amazing? 
- Can I suggest anything to try to improve anything or make it way better?
- Is there anything that needs to be addressed to the one using me?
### Collaborative Reflection Questions
Use these to think critically and collaborate with the user:
- Is this the best approach, or is there a simpler way?
- What did we learn from this that we should apply going forward?
- Are there any improvements you'd like to discuss?
- Does this match the overall design philosophy?
- What tradeoffs did we make, and are they worth it?
- Is there anything that feels off or could be better?
- Did we test this in all use cases (dark/light, mobile, etc.)?
- What would make this excellent vs just adequate?
