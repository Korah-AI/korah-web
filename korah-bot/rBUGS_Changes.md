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

# MASTER BUG TABLE — All Confirmed UI/UX Bugs (Auto-Audit 2026-05-18)

| # | Severity | Category | File | Line(s) | Issue |
|---|----------|----------|------|---------|-------|
| 1 | **CRIT** | Layout | `korah-chat.css` | 3 | `body { overflow: hidden; height: 100dvh; }` clips all content, disables pull-to-refresh on mobile, prevents elastic overscroll. Opportunities page already had to brute-force override it. |
| 2 | **CRIT** | JS Logic | `productivity.html` | 626 | `x-text` + `x-html="true"` on same element — contradictory directives. Focus time display always shows literal string or `"true"` instead of the intended value. **Feature broken.** |
| 3 | **CRIT** | JS Logic | `productivity.html` | 850 | `JSON.parse()` in Alpine `productivityApp()` data initializer without try/catch. If `korah_custom_presets` localStorage is corrupt, **the entire Alpine component fails to initialize**, breaking timer, tasks, and all productivity features. |
| 4 | **CRIT** | CSS | `korah.css` | 283-291 | `.shooting-star` uses `animation: shoot ...` but `@keyframes shoot` is **not defined in `korah.css`** (only in `korah-chat.css`). Pages that load only `korah.css` (landing, opportunities) have **silently broken shooting star animations**. |
| 5 | **HIGH** | XSS | `sat/js/sat-player.js` | 669-674 | `feedbackPanel.innerHTML` injects `current.explanation` and `current.correctAnswer` without `sanitizeHtml()`. **Stored XSS vector** in SAT question feedback. |
| 6 | **HIGH** | XSS | `app/korah-chat.js` | 1401, 1432 | Study guide and practice test renderers inject AI content via `innerHTML` without DOMPurify. |
| 7 | **HIGH** | CSS | `sat/sat.css` | 1785 | `box-shadow: 0 0.75rem var(--glow)` — **missing blur radius**. Renders as a hard-edge shadow line instead of a soft glow. |
| 8 | **HIGH** | CSS | `sat/sat-player-theme.css` | 1691 | `rgb(255,255,255,0.15)` — **invalid CSS syntax** (fourth value in `rgb()`). Only tolerated by forgiving browsers; will silently fail in strict mode. |
| 9 | **HIGH** | CSS | `app/korah-chat.css` | 4718 | `var(--t1)` used as color value but **never defined** in any CSS theme block. Falls back to inherited color — likely wrong. |
| 10 | **HIGH** | CSS | `app/korah-chat.css` | 4349-50 | `var(--mood-color)` used in `@keyframes pulse-dot` / `mood-dot-pulse` but **never defined** in CSS (may be set by JS — if JS is slow or fails, animations silently break). |
| 11 | **HIGH** | UX | `transitions/page-transitions.css` | 14-15 | Light mode page loads flash **grey (#d2d2d2)** for ~300ms before transitioning to the actual light background (#faf8ff). Visually jarring. |
| 12 | **HIGH** | JS Logic | `app/korah-chat.js` | 584, 589 | `JSON.parse()` on cached sessions/study items from localStorage without try/catch. If cache data is corrupt, **chat initialization silently fails**. |
| 13 | **HIGH** | Alpine | `productivity.html` | 896 | `setInterval(() => this.syncWithGlobalTimer(), 1000)` in Alpine `init()` — **never cleaned up**. If component is destroyed, interval continues running on destroyed Alpine proxy, causing errors and memory leak. |
| 14 | **MED** | Alpine | `productivity.html` | 888, 928 | `JSON.parse()` on `korah_prod_stats` localStorage without try/catch. Corrupt data will throw and halt `init()` or `recordSession()`. |
| 15 | **MED** | Layout | `app/korah-chat.css` | 226 | `.sidebar` transitions `width`, `min-width`, `padding`, `transform`, `opacity` simultaneously. `width`/`padding` trigger layout reflow on every frame — **jarring collapse/expand animation**. |
| 16 | **MED** | Layout | `sat/sat.css` | 2993 | `.more-dropdown-menu` at `z-index: 10001` — highest in the codebase. On mobile at 768px, dropdowns stack above everything including modals at 9999. |
| 17 | **MED** | Layout | `app/korah-chat.css` | 4843 vs 253/1066/1620 | Uses `48rem` (≈768px) as main breakpoint in most places, but line 4843 uses raw `768px`. If user changes browser font size, these **breakpoints drift apart**. |
| 18 | **MED** | Access | multiple files | ~15 elements | Interactive elements use `outline: none` without `:focus-visible` fallback. **Keyboard users cannot see focus state** across most pages outside SAT. |
| 19 | **MED** | Mobile | `app/korah-chat.css` | 832-833 | `.history-action-btn` at **1.375rem × 1.375rem (~22×22px)** — way below 44px minimum touch target. Hard to tap on mobile. |
| 20 | **MED** | Layout | `sat/sat-math.css` | 5-10 | `.sat-math-layout` overrides `--p4` to green, but child elements with hardcoded `rgba(139,92,246,...)` values stay purple — **inconsistent color theme** on math chat page. |
| 21 | **MED** | Layout | `korah.css` vs `korah-chat.css` | various | `.glass`, `.glass-sm`, `.shadow-glow`, `.grad-bg` have **different definitions** in each file. Pages that load `korah.css` get different visuals (20px blur, no background) than pages that load `korah-chat.css` (25px blur, with background). |
| 22 | **MED** | Mobile | `sat/sat.css` | 287, 2403 | `.sat-player-footer` at `z-index: 1000` overlaps `.q-nav-panel` at `z-index: 999`. Question navigator panel renders **behind the footer** on SAT pages. |
| 23 | **MED** | Layout | `sat/sat.css` | 3838 | `.sidebar.collapsed { overflow: visible !important }` — breaks sidebar encapsulation on SAT pages. |
| 24 | **LOW** | JS | `app/korah-chat.js` | 2219 | `KorahTransitions.go('sat/math-chat.html')` uses relative path that would break if `showSATSubModal()` were ever called from inside `sat/` subdirectory (currently unreachable, but latent bug). |
| 25 | **LOW** | JS | `app/korah-chat.js` | 12,15,18-21 | 6 DOM elements queried at top level that don't exist in `chat.html` (`#char-count`, `#tool-flashcard`, `#tool-guide`, `#tools-trigger`, etc.) — all guarded but ~50 lines of dead event binding code. |
| 26 | **LOW** | JS | `korah.js` | 173 | Scroll handler without `requestAnimationFrame` throttle. |
| 27 | **LOW** | CSS | `korah.css` | 310-315 | `@keyframes shootOnce` **defined but never used** by any element — dead code. |
| 28 | **LOW** | CSS | `app/korah-chat.css` | 194 | `.grad-bg-purple { background: ... !important }` prevents any contextual override without fighting `!important` back. |
| 29 | **LOW** | Access | `support/index.html`, `landing/index.html`, `index.html` | various | 4 images missing `alt` attributes. |
| 30 | **LOW** | JS | `sat/math-chat.js` | 16 | Dead variable `suggestionBar` — queried but never used. |

---

<!-- Bugs marked NEW-ENDED have been confirmed fixed in commit 2500381. -->

