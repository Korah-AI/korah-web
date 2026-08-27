# BUGS FOUND BY AUSTIN

# CHANGES FROM A CONSUMER THOUGHT
# Index.html

* get rid of the middle "topic" fully 

* (DOES NOT HAVE TO CHANGE) have the logout button be last button on the side bar

(DOES NOT NEED TO CHANGE) under the text box (under the chat box), move the SAT  subject either under the other subjects ("general, math, science, history, literature" then under them "SAT") or be the last, (("general, math, science, history, literature, SAT")), same with the drop down on the topbar

* (DOES NOT NEED TO BE ADDED) have a "how this works" pop up or button for the new users

# sat/Index.html

* have another box ontop of the (question bank) and under the (question limit, clear, and start practice) for the missed / incorrected answers (posibly make a button so it makes the problems they have issues with into the study flashcards or something)

* (DOES NOT NEED TO BE ADDED) shows the percent for correct to incorrect ratio

* (IF THIS IS POSIBLE) on top of the possible box (for incorrect answers (the first COMSUMER THOUGHT on the sat/Index.html)) have a selection for saved questions (toggle button), completed (toggle button), and answer questions (toggle button) (just like one prep)

*  (DOES NOT NEED TO BE ADDED) sense this is a school ai tool, would it be a good idea to ad different laguages?

---

# MASTER BUG TABLE — Full Repo Audit (2026-07-13)

**Productivity.html excluded** — not currently in use.

## Re-Verification Status of Original 30 Bugs

| # | Severity | Status | File | Issue |
|---|----------|--------|------|-------|
| 1 | CRIT | Still Open | `korah-chat.css:3` | `body { overflow: hidden; height: 100dvh; }` clips content, blocks pull-to-refresh |
| 2 | CRIT | Excluded | `productivity.html:626` | (not in use) |
| 3 | CRIT | Excluded | `productivity.html:852` | (not in use) |
| 4 | CRIT | Still Open | `korah.css:290` | `@keyframes shoot` missing — landing/opps shooting stars broken |
| 5 | HIGH | **FIXED** | `sat/js/sat-player.js:669-674` | Now wrapped in `sanitizeHtml()` |
| 6 | HIGH | Still Open | `korah-chat.js:905,942,973` | AI study content via `innerHTML` no DOMPurify |
| 7 | HIGH | Still Open | `sat/sat.css:2135` | `box-shadow: 0 0.75rem var(--glow)` — missing blur radius |
| 8 | HIGH | Still Open | `sat/sat.css:2038` | `rgb(255,255,255,0.15)` — invalid 4-arg `rgb()` |
| 9 | HIGH | Still Open | `korah-chat.css:4073` | `var(--t1)` never defined in any CSS file |
| 10 | HIGH | Still Open | `korah-chat.css:3704,4111` | `var(--mood-color)` in keyframes — no CSS fallback |
| 11 | HIGH | Still Open | `page-transitions.css:14-15` | Light mode flashes grey `#d2d2d2` during transitions |
| 12 | HIGH | Still Open | `korah-chat.js:114,119` | `JSON.parse()` on cached sessions — no try/catch |
| 13 | HIGH | Excluded | `productivity.html:898` | (not in use) |
| 14 | MED | Excluded | `productivity.html:890,930` | (not in use) |
| 15 | MED | Still Open | `korah-chat.css:236` | Sidebar transitions width/min-width/padding — layout reflow |
| 16 | MED | Still Open | `sat/sat.css:3343` | `.more-dropdown-menu` at `z-index: 10001` — overlaps everything |
| 17 | MED | **FIXED** | — | Breakpoint now uses `48rem` |
| 18 | MED | Still Open | Multiple files (14 locations) | `outline: none` without `:focus-visible` — no keyboard focus |
| 19 | MED | Still Open | `korah-chat.css:832-833` | `.history-action-btn` at 22×22px — below 44px mobile target |
| 20 | MED | Still Open | `sat/sat-math.css:461` | Hardcoded purple in green-themed math chat |
| 21 | MED | Still Open | `korah.css:119` vs `korah-chat.css:206` | `.glass`/`.glass-sm` mismatched (20px vs 25px blur, no bg vs with bg) |
| 22 | MED | Still Open | `sat/sat.css:291,2753` | Footer z-index 1000 > q-nav-panel 999 — popup behind footer |
| 23 | MED | Still Open | `sat/sat.css:4189` | `.sidebar.collapsed { overflow: visible !important }` — breaks isolation |
| 24 | LOW | Still Open | `korah-chat.js:1768` | Relative path `sat/math-chat.html` — fragile |
| 25 | LOW | Still Open | `korah-chat.js:12-21` | DOM queries for elements that don't exist on chat.html |
| 26 | LOW | Still Open | `korah.js:173` | Scroll handler lacks `requestAnimationFrame` |
| 27 | LOW | **FIXED** | `korah.css:310` | `@keyframes shootOnce` now used by `korah.js:480` |
| 28 | LOW | Still Open | `korah-chat.css:204` | `.grad-bg-purple` still uses `!important` |
| 29 | LOW | Still Open | `index.html:727`, `landing/index.html:134,733` | Images missing `alt` attributes |
| 30 | LOW | Still Open | `sat/math-chat.js:25` | Dead variable `suggestionBar` — unused |

---

## Full Categorized Audit — All Still-Open Issues

---

### 1. CRITICAL — Layout & Animation

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| C1 | `korah-chat.css:3` | `body { overflow: hidden; height: 100dvh }` clips all page content. Blocks pull-to-refresh and elastic overscroll on mobile. | Change to `overflow-x: hidden; overflow-y: auto` or use a scroll container |
| C2 | `korah.css:84,201` | `animation: floatanim` on hero mascot and float cards, but `@keyframes floatanim` is never defined anywhere. Elements are static. | Add `@keyframes floatanim { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }` |
| C3 | `korah.css:290` | `.shooting-star` references `animation: shoot` but only `@keyframes shootOnce` exists in korah.css. Landing and opportunities pages load only korah.css, so shooting stars are silently broken. | Copy `@keyframes shoot` from korah-chat.css into korah.css, or reference `shootOnce` instead |

---

### 2. SECURITY — XSS (innerHTML Without Sanitization)

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| S1 | `korah-chat.js:905,942,973` | `renderFlashcards()`, `renderStudyGuide()`, `renderPracticeTest()` set `innerHTML` with AI-generated content (`${question}`, `${answer}`, `${title}`, `${body}`). No DOMPurify. | Wrap each in `DOMPurify.sanitize()` |
| S2 | `korah-chat.js:428-431` | `renderMarkdownAndMath()` only sanitizes if `window.DOMPurify` exists. If DoMPurify CDN fails, raw HTML is injected unsanitized. | Fail-safe: don't render if DOMPurify missing, or fall back to `textContent` |
| S3 | `study/feed.html:1436` | `card.innerHTML` injects `item.title`, `item.description` from KorahDB data — no sanitization. An attacker who controls a study item can execute arbitrary HTML/JS. | `DOMPurify.sanitize()` |
| S4 | `study/guide.html:1079` | `window.marked.parse(markdown)` injected via innerHTML. `marked` does not sanitize HTML by default. | `DOMPurify.sanitize(marked.parse(...))` |
| S5 | `sat/js/sat-bank.js:129,256` | innerHTML built from template strings. Currently uses hardcoded constants (low risk), but the pattern is fragile. | Use `document.createElement()` or `DOMPurify.sanitize()` |
| S6 | All HTML files | No Content Security Policy meta/header on any page. Any XSS can exfiltrate data or execute arbitrary scripts with no defense-in-depth. | Add CSP meta tag: `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://www.desmos.com; img-src 'self' data: https:; connect-src 'self' https://korah-web-api.vercel.app;` |

---

### 3. CSS — Invalid Syntax & Broken Values

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| V1 | `sat/sat.css:2038` | `rgb(255, 255, 255, 0.15)` — 4th argument in `rgb()` is invalid CSS. `rgb()` only takes 3 args. Browsers silently discard this declaration, making the background transparent instead of white-15%. | `rgba(255, 255, 255, 0.15)` |
| V2 | `sat/sat.css:2135` | `box-shadow: 0 0.75rem var(--glow)` — no blur-radius specified. Renders as a hard-edge shadow line, not a soft glow. | `box-shadow: 0 0.75rem 2rem var(--glow)` |
| V3 | `korah-chat.css:4073` | `color: var(--t1)` — `--t1` is never defined anywhere in any CSS file. Falls back to inherited color (likely wrong). | Define `--t1` in theme blocks, or replace with `var(--tx)` |
| V4 | `korah-chat.css:3704,4111` | `var(--mood-color)` used inside `@keyframes pulse-dot` and `mood-dot-pulse` with no CSS fallback. Only set by JS — if JS is slow or fails, animations produce no visual effect. | `var(--mood-color, var(--p4))` |

---

### 4. CSS — Duplicate & Conflicting Definitions

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| D1 | `korah.css:119` vs `korah-chat.css:206` | `.glass` defined differently: korah.css = `blur(20px)` no background; korah-chat.css = `blur(1.5625rem)` with `background: var(--sf)`. Pages loading korah.css get different visuals. | Consolidate to one definition with same blur + bg |
| D2 | `korah-chat.css:62` vs `3526` | Duplicate `@keyframes pulse-glow`. Line 62 animates drop-shadow (mascot glow). Line 3526 animates opacity (skeleton shimmer). The second definition wins per CSS spec, so the mascot glow is dead. | Rename line 3526 to `pulse-glow-opacity` |
| D3 | `release/release.css:103,193,198` | `@keyframes float/fadeUp/soft-pulse` have different values from korah-chat.css. If both files load, the last one wins and the other page's animation breaks. | Namespace: rename to `release-float`, `release-fadeUp`, etc. |
| D4 | `support/support.css:15` | `@keyframes shoot` has different trajectory from korah-chat.css (one shoots right, one shoots diagonal-down-left). Same collision risk. | Rename to `shoot-support` |
| D5 | `korah.css`, `korah-chat.css`, `release.css`, `sat-player-theme.css` | CSS variables `--bg`, `--sf`, `--bd`, `--tx`, `--p4`, `--glow` etc. redefined in 4 files with different values. Load order determines which theme wins — unpredictable. | Define all variables once in a single shared scope; use page-specific files for overrides only |

---

### 5. CSS — `!important` Overuse

| # | File | Count | Problem | Fix |
|---|------|-------|---------|-----|
| I1 | `korah-chat.css` | 74 | `!important` on scrollbar colors, sidebar mobile states, light theme overrides, and misc cleanup. Makes overrides impossible without fighting `!important`. | Use `[data-theme]` selector specificity instead of `!important` |
| I2 | `sat-player-theme.css` | 38 | 38 `!important` to override base sat.css styles. Indicates a structural specificity war between base and theme files. | Restructure selectors for natural higher specificity |
| I3 | `korah-chat.css:204` | — | `.grad-bg-purple` uses `!important` with CSS variables now (improved), but still blocks clean overrides. | Remove `!important`, use higher-specificity selector |

---

### 6. CSS — `transition: all` (Performance)

| # | File | Count | Problem | Fix |
|---|------|-------|---------|-----|
| T1 | `korah-chat.css` | 30 | Every `transition: all` forces the browser to composite every property change on every frame, including layout properties. | Replace each with specific properties, e.g. `transition: background 0.2s, color 0.2s` |
| T2 | `sat/sat.css` | 24 | Same issue across SAT player, dropdowns, nav elements. | Same fix |
| T3 | `sat/sat-math.css` | 8 | Resize handles, graph buttons, close buttons. | Same fix |
| T4 | `sat/sat-player-theme.css` | 4 | Answer items, letters, choice rows. | Same fix |
| T5 | `sat/sat-rush.css` | 2 | Rush UI interactive elements. | Same fix |

---

### 7. CSS — `px` vs `rem` Consistency

| # | File | Count | Problem | Fix |
|---|------|-------|---------|-----|
| R1 | `sat/sat.css` | 100+ | `gap: 8px`, `font-size: 11px`, `border-radius: 6px`, `blur(24px)`, `height: 2px`, `width: 8px` — inconsistent with project's rem convention. At different font sizes, these break. | Convert to rem equivalents: 8px→0.5rem, 11px→0.6875rem, 6px→0.375rem, 24px→1.5rem |
| R2 | `release/release.css` | 18 | `translateY(-8px)`, `box-shadow: 0 20px 50px`, `letter-spacing: -1px`, `border: 1px solid` | Convert to rem |
| R3 | `korah-chat.css:3705,4057` | 2 | `box-shadow: 0 0 0 6px`, `box-shadow: 0 -4px 16px rgba(0,0,0,0.18)` | Convert 6px→0.375rem, 4px→0.25rem, 16px→1rem |
| R4 | `korah.css:119-120` | 2 | `.glass { backdrop-filter: blur(20px) }` — should be `blur(1.25rem)` to match rem convention | Convert |

---

### 8. CSS — z-index Chaos

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| Z1 | `sat/sat.css:3343` | `.more-dropdown-menu` at `z-index: 10001` — highest value in the entire codebase. On mobile, dropdowns appear above every modal (which are at 9999). | Reduce to below modal z-index (e.g. 1010) |
| Z2 | `sat/sat.css:291,2753` | `.sat-player-footer` at `z-index: 1000` and `.q-nav-panel` at `z-index: 999`. Question navigator popover renders behind the footer on short viewports. | Raise `.q-nav-panel` to 1001, or position it above the footer using `bottom: var(--player-footer-h)` |
| Z3 | All CSS files (~70 values) | No z-index management system. Values range 1→10001 with no logical scale. Adding new UI elements risks accidental overlaps. | Define z-index as CSS variables: `--z-dropdown: 100; --z-sticky: 200; --z-modal: 1000; --z-overlay: 2000; --z-toast: 3000` |

---

### 9. ACCESSIBILITY — `:focus-visible` Missing

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| A1 | `korah-chat.css:1328,1839,2223,2301,2828,2878,2896,3084,4539` | 9 instances of `outline: none` on `:focus` (textarea, input, select). Zero `:focus-visible` replacements anywhere in the file. Keyboard users cannot see which element is focused. | Replace each with `:focus-visible { outline: 2px solid var(--p4); outline-offset: 2px; }` |
| A2 | `sat/sat.css:515,536,819,1627` | 4 `outline: none` on input fields. These get border-color changes on focus but no visible ring — harder to see for keyboard users. | Same fix |
| A3 | `sat/sat-rush.css:435` | `.rush-spr-input:focus { outline: none; border-color: var(--rush-blue) }` — color alone conveys state, which fails WCAG. | Add `:focus-visible` ring |

---

### 10. ACCESSIBILITY — Touch Targets

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| T1 | `korah-chat.css:832-833` | `.history-action-btn` at `1.375rem × 1.375rem` (22×22px). WCAG minimum is 44×44px (2.75rem). Hard to tap on mobile. | Increase to `2.75rem × 2.75rem` or increase padding to meet 44px hit area |
| T2 | `index.html:313` | `.tip-dot` at `6px × 6px` for carousel navigation dots. Far below tappable size. | Increase hit area with padding/container to minimum 44×44px |

---

### 11. ACCESSIBILITY — Missing `alt` Attributes

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| M1 | `index.html:727` | `<img src="logo-images/newlogo2.png">` with no `alt` attribute at all. Screen readers read the filename. | `alt="Korah logo"` |
| M2 | `landing/index.html:134` | Nav logo image missing `alt`. | `alt="Korah"` |
| M3 | `landing/index.html:733` | Footer logo image missing `alt`. | `alt="Korah footer logo"` |
| M4 | `login.html:638,640,755,756` | Logo and background images have `alt=""` — valid for decorative images, but the main brand logo could use descriptive text. | `alt="Korah AI"` on main logo |

---

### 12. ACCESSIBILITY — Tabindex

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| X1 | `login.html:663,704` | Password show/hide toggle buttons have `tabindex="-1"`. Keyboard-only users cannot tab to these buttons, making password visibility toggling inaccessible. | Remove `tabindex` attribute (buttons are focusable by default) or set `tabindex="0"` |

---

### 13. JS — Memory Leaks

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| L1 | `index.html:1057` | `setInterval(tick, 1000)` clock — never cleared. Runs forever even if user navigates away. | Store interval ID and `clearInterval()` on `beforeunload`/`pagehide` |
| L2 | `index.html:1247` | `setInterval(nextTip, 9000)` tips carousel — never cleared. | Same fix |
| L3 | `study/feed.html:1716` | `setInterval(tick, 50)` animation loop running at 20fps. Never cleared. Wastes CPU even when page is idle. | Use `requestAnimationFrame` instead of `setInterval` for animations |

---

### 14. JS — Dead Code & Fragile Patterns

| # | File:Line | Problem | Fix |
|---|-----------|---------|-----|
| J1 | `sat/math-chat.js:25` | Dead variable `const suggestionBar = document.getElementById("suggestion-bar")` — queried but never referenced anywhere else in the file. | Remove the declaration |
| J2 | `korah.js:173` | `window.addEventListener('scroll', ...)` runs `document.getElementById('navbar').classList.toggle(...)` on every scroll event with no throttle. | Wrap in `requestAnimationFrame` to limit to once per frame |
| J3 | `korah-chat.js:1768` | `KorahTransitions.go('sat/math-chat.html')` uses a relative path. If the calling page is ever inside a subdirectory, the path breaks. | Use root-relative: `/sat/math-chat.html` |
| J4 | `korah-chat.js:12-21` | 10 DOM queries at top-level scope for elements that don't exist on `chat.html` (`#char-count`, `#tool-flashcard`, `#tool-guide`, `#tools-trigger`, etc.). Wasteful and fragile. | Guard with optional chaining, or move into page-specific init functions |
| J5 | `chat.html:488` vs `sat/*.html` | Desmos API version mismatch: chat.html uses v1.11 with key `d75985faa7d940...`, SAT pages use v1.12 with key `dcb31709...`. Two different API keys active. | Standardize to v1.12 with single key |

---

### 15. SEO — Missing Meta Descriptions

| # | Missing Pages | Problem | Fix |
|---|---------------|---------|-----|
| E1 | `index.html`, `login.html`, `chat.html`, `sat/index.html`, `sat/dashboard.html`, `sat/rush.html`, `sat/questions.html`, `sat/math-chat.html`, `study/feed.html`, `study/item.html`, `study/guide.html`, `study/test.html`, `study/flashcards.html`, `study/new.html`, `study/guide-create.html`, `study/test-create.html`, `opportunities/opportunities.html`, `release/release.html` | 18 of ~21 pages have no `<meta name="description">`. Only landing, support, and code/code.html have them. Search engines auto-generate snippets which may be irrelevant. | Add `<meta name="description" content="...">` per page with custom copy |

---

### Summary

| Category | Count | Priority |
|----------|-------|----------|
| Critical — Layout & Animation | 3 | Tier 1 |
| Security — XSS | 6 | Tier 1 |
| CSS — Invalid Syntax | 4 | Tier 2 |
| CSS — Duplicates | 5 | Tier 3 |
| CSS — `!important` | 3 | Tier 3 |
| CSS — `transition: all` | 68 instances across 5 files | Tier 4 |
| CSS — `px` vs `rem` | 100+ px values | Tier 5 |
| CSS — z-index | 3 structural issues | Tier 3 |
| Accessibility — Focus | 14 `outline:none` sites | Tier 2 |
| Accessibility — Touch | 2 elements | Tier 3 |
| Accessibility — Alt text | 4 images | Tier 3 |
| Accessibility — Tabindex | 2 buttons | Tier 3 |
| JS — Memory leaks | 3 intervals | Tier 2 |
| JS — Dead code/fragile | 5 items | Tier 5 |
| SEO | 18 pages | Tier 6 |

**Total open issues: ~48**

