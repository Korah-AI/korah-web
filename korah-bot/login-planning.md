> **Purpose:** Step-by-step guide for implementing the constellation canvas light mode into `login.html`. Written so any agent can implement it without ambiguity. Also includes targeted UI/UX improvements.

---

## Table of Contents

1. [Current File Architecture](#1-current-file-architecture)
2. [How Dark / Light Mode Currently Works](#2-how-dark--light-mode-currently-works)
3. [What the Constellation System Does](#3-what-the-constellation-system-does)
4. [Implementation Steps](#4-implementation-steps)
5. [Full Code Blocks](#5-full-code-blocks)

---

## 1. Current File Architecture

The file is a single-file HTML page (~1100 lines). Here is the complete layout:

```
<head>
  ├── External CSS links (page-transitions, fonts, tailwind)
  ├── <style> block — ALL CSS lives here
  │     ├── [x-cloak], FOUC prevention
  │     ├── :root CSS variables (dark mode defaults)
  │     ├── [data-theme="light"] CSS variables
  │     ├── Base reset, scrollbar, html/body
  │     ├── .kl-shell (flex row wrapper)
  │     ├── .kl-auth-panel (left 46%, always dark #0a0618)
  │     ├── .kl-hero-panel (right 54%, always dark #0a0618)
  │     ├── .kl-hero-inner (rounded black box inside hero panel)
  │     ├── #staticStarField, #shootingStarCanvas (canvas styles)
  │     ├── .kl-bh-stage, .kl-bh-wrap (black hole gif stage)
  │     ├── .kl-hero-title (breathing purple text)
  │     ├── .login-card, .login-star-canvas, .login-card-inner
  │     ├── .tabs, .tab (sign in / create account toggle)
  │     ├── .form-group, .form-label, .form-input, .input-error
  │     ├── .form-fade-enter, .form-fade-leave (tab crossfade)
  │     ├── .btn, .btn-primary, .btn-google
  │     ├── .divider
  │     ├── @media breakpoints (64rem, 48rem)
  │     └── .spinner, @keyframes spin
  └── <script> — theme detection (runs before first paint)

<body>
  ├── .kl-shell
  │     ├── .kl-auth-panel (LEFT)
  │     │     └── .login-card [x-data="loginApp"]
  │     │           ├── <canvas id="loginStarField">
  │     │           └── .login-card-inner
  │     │                 ├── .login-title "Korah A.I"
  │     │                 ├── .tabs (Sign In / Create Account)
  │     │                 ├── .form-container
  │     │                 │     ├── <form> login (x-show="tab==='login'")
  │     │                 │     └── <form> register (x-show="tab==='register'")
  │     │                 ├── .divider "or"
  │     │                 └── .btn-google
  │     └── .kl-hero-panel (RIGHT)
  │           └── .kl-hero-inner
  │                 ├── .kl-hero-title "KORAH A.I"
  │                 ├── <canvas id="staticStarField">
  │                 ├── <canvas id="shootingStarCanvas">
  │                 └── .kl-bh-stage
  │                       └── .kl-bh-wrap
  │                             ├── .kl-bh-singularity (black circle)
  │                             ├── <img .kl-bh-canvas> (gif A)
  │                             └── <img .kl-bh-canvas-b> (gif B)

<script type="module">
  ├── Firebase init + auth
  ├── setupCanvas(), getBhCenter(), getBhSize() helpers
  ├── initGargantua() — gif crossfade loop
  ├── renderStaticStarfield() — gravitational lensing stars
  ├── Shooting star / spaghetti system (canvas id="shootingStarCanvas")
  ├── renderLoginStarfield() — stars inside login card
  └── Alpine.data('loginApp') — form logic

<script defer> Alpine CDN
```

---

## 2. How Dark / Light Mode Currently Works

### Theme Detection (runs in `<head>` before first paint)
```javascript
(function() {
  const t = localStorage.getItem('korah_theme') || 'dark';
  if (t === 'light' || (t === 'system' && window.matchMedia(...).matches)) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
```
- Sets `data-theme="light"` on `<html>` if needed
- Runs synchronously — no flash
- Dark mode is the default (no attribute set)

### CSS Variables
- `:root` = dark mode defaults
- `[data-theme="light"]` = light mode overrides

### IMPORTANT — Panel backgrounds are HARDCODED
```
.kl-auth-panel  { background: #0a0618; }  ← always dark
.kl-hero-panel  { background: #0a0618; }  ← always dark
.kl-hero-inner  { background: #000; }     ← always black (currently)
```
These do NOT use CSS variables. This means:
- Both panels are always dark regardless of theme
- The "light mode" currently only changes CSS variable values
- `--tx: #1a0a3c` in light mode would cause dark text on dark panels = invisible text
- **This is a bug that needs fixing** (see Step 2 below)

### Current Light Mode Behavior
- Auth panel: unchanged (dark)
- Login card: unchanged (transparent glass over dark panel)  
- Hero inner: unchanged (black)
- Text: changes to dark colors (currently broken — see above)
- Scrollbar: uses `var(--p4)` (works)

### What Light Mode SHOULD Do
- Auth panel: still dark (intentional — card contrast)
- Login card: still glass over dark panel (intentional)
- Hero inner: **changes to white** (#fff) → shows constellation canvas
- Text in auth/card: stays readable on dark backgrounds
- Hero: shows constellation canvas INSTEAD of black hole

---

## 3. What the Constellation System Does

A canvas-based animation that runs **only in light mode** inside `.kl-hero-inner`.

### State Machine
```
idle (3–5s random delay on load)
  → roaming (55 dots float freely, proximity lines draw)
    → gathering (N dots spring toward constellation positions)
      → forming (lines draw in one by one with bow curve)
        → glowing (dots breathe, lines breathe, ambient glow, label appears)
          → dispersing (label fades, lines fade, dots scatter staggered)
            → roaming (7s rest)
              → gathering (next constellation)
```

### Cycle Order
- **Session load:** Korah constellation always forms first
- **After Korah:** 12 zodiac constellations in random shuffled order
- **After all 12:** reshuffle and repeat (Korah included in subsequent shuffles)

### Key Behaviors
- **55 dots** roam the canvas (scale down at smaller box sizes)
- Dots match the existing `initConstellation()` style: purple, proximity lines, bouncing
- During formation: roaming dots get **soft repulsion** (~80px) from constellation stars
- Roaming dots' proximity lines **do NOT connect** to constellation stars
- When formed: dots **breathe** (slight opacity oscillation, off-sync per dot)
- Lines draw with a **bow curve** (slight arc that straightens on completion)
- Label appears **0.8s into glowing phase**, fades before dispersal
- **Cursor proximity:** dots within 60px of cursor brighten + grow slightly
- **Reduced motion:** shows static Korah constellation, no animation

### Korah Mascot
The Korah mascot is a round fluffy purple creature with:
- Big round body
- Two large eyes (these get **1.6x magnitude** in the constellation)
- Small nose + smile
- Two small feet at the bottom

The constellation traces this shape with 14 star points.

---

## 4. Implementation Steps

> **Critical:** Follow steps in order. Each step builds on the previous.

---

### STEP 1 — Fix FOUC Prevention for Light Mode

**Location:** Inside the first `<style>` block in `<head>`, immediately after:
```css
html:not(.korah-page-ready) { background: #06040f !important; }
html:not(.korah-page-ready) body { opacity: 0 !important; }
```

**Add this line between the two existing lines:**
```css
html[data-theme="light"]:not(.korah-page-ready) { background: #fff !important; }
```

**Result:** Light mode users no longer see a dark flash on page load.

---

### STEP 2 — Fix Light Mode CSS Variables

**Location:** Find the `[data-theme="light"]` block in the `<style>` section.

**Current (BROKEN):**
```css
[data-theme="light"] {
  --bg: #faf8ff;
  --bd: rgba(109, 40, 217, 0.18);
  --bd-focus: rgba(109, 40, 217, 0.55);
  --tx: #1a0a3c;     ← PROBLEM: dark text on dark panels = invisible
  --tx2: #5a4a7a;    ← PROBLEM: too dark for #0a0618 background
  --tx3: #9080aa;    ← PROBLEM: barely readable on dark
  --p4: #8b5cf6;
  --p5: #7c3aed;
  --glow: rgba(109, 40, 217, 0.15);
  --cb: rgba(255, 255, 255, 0.92);
  --cu: rgba(109, 40, 217, 0.12);
}
```

**Replace entire `[data-theme="light"]` block with:**
```css
[data-theme="light"] {
  /* panels are hardcoded dark (#0a0618), so text stays light for readability */
  --bg:       #faf8ff;
  --bd:       rgba(139, 92, 246, 0.30);    /* slightly stronger border */
  --bd-focus: rgba(109, 40, 217, 0.60);
  --tx:       #f0eaff;    /* KEEP LIGHT — auth panel bg is always dark */
  --tx2:      #b8aad4;
  --tx3:      #8878aa;
  --p4:       #8b5cf6;
  --p5:       #a78bfa;
  --glow:     rgba(139, 92, 246, 0.35);
  --cb:       rgba(255, 255, 255, 0.92);   /* kept but currently unused */
  --cu:       rgba(91, 33, 182, 0.32);
}
```

**Why:** Auth panel and login card backgrounds are hardcoded dark colors (`#0a0618`, `rgba(6,2,15,0.35)`). If text becomes dark (`#1a0a3c`) in light mode, it becomes invisible on these dark backgrounds. Keeping text colors light maintains readability on the dark auth side in both modes.

---

### STEP 3 — Fix kl-shell (Remove Unnecessary z-index + Add overflow-x)

**Location:** Find `.kl-shell` rule.

**Current:**
```css
.kl-shell {
  display: flex;
  flex-direction: row;
  width: 100vw;
  min-height: 100vh;
  position: relative;
  z-index: 10;           ← remove this
  background: var(--grad);
}
```

**Replace with:**
```css
.kl-shell {
  display: flex;
  flex-direction: row;
  width: 100vw;
  min-height: 100vh;
  position: relative;
  background: var(--grad);
  overflow-x: hidden;    /* prevent horizontal bleed */
}
```

**Why:** `z-index: 10` on a flex container is unnecessary and can cause stacking context issues. `overflow-x: hidden` prevents any content from causing a horizontal scrollbar.

---

### STEP 4 — Add Firefox Scrollbar Support

**Location:** Find the scrollbar CSS block:
```css
::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { ... }
::-webkit-scrollbar-thumb { ... }
```

**ADD BEFORE the webkit scrollbar block:**
```css
/* Firefox scrollbar — same purple theme */
* {
  scrollbar-width: thin;
  scrollbar-color: #8b5cf6 rgba(10, 5, 32, 0.5);
}
```

**Why:** WebKit scrollbar styling only works in Chrome/Safari/Edge. Firefox uses `scrollbar-width` and `scrollbar-color`. Both needed for cross-browser consistency.

---

### STEP 5 — Add Light Mode Hero Inner (White Background)

**Location:** Find `.kl-hero-inner` CSS rule.

**Current:**
```css
.kl-hero-inner {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 2rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
}
```

**Replace with:**
```css
.kl-hero-inner {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  border-radius: 2rem;
  border: 1px solid rgba(139, 92, 246, 0.15);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 50px rgba(0,0,0,0.8);
  transition: background 0.5s ease, border-color 0.4s ease;
}

/* light mode: white canvas for constellation */
[data-theme="light"] .kl-hero-inner {
  background: #ffffff;
  border-color: rgba(139, 92, 246, 0.20);
}
```

---

### STEP 6 — Add Constellation Canvas CSS

**Location:** After the `#shootingStarCanvas { z-index: 3; }` line, add a new section.

**ADD this entire block:**
```css
/* ── CONSTELLATION CANVAS (light mode only) ─────────────────────
   Hidden in dark mode via display:none.
   pointer-events:auto needed for cursor proximity detection.
   z-index 1 = above white bg, below hero title (z-index 10).
──────────────────────────────────────────────────────────────── */
#constellationCanvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  z-index: 1;
  display: none;              /* hidden in dark mode */
}

[data-theme="light"] #constellationCanvas {
  display: block;
}

/* dark mode canvas elements: hidden in light mode */
[data-theme="light"] #staticStarField,
[data-theme="light"] #shootingStarCanvas {
  display: none;
}

/* black hole stage: hidden entirely in light mode */
[data-theme="light"] .kl-bh-stage {
  display: none;
}
```

---

### STEP 7 — UI/UX Improvements to Existing CSS

**7A: Add placeholder color to form-input (currently missing)**

Find `.form-input::placeholder { transition: opacity 0.2s; }` and replace with:
```css
.form-input::placeholder {
  transition: opacity 0.2s;
  color: var(--tx3);   /* explicit placeholder color — inherits theme */
}
```

**7B: Add font-family to .btn and .form-input (prevents browser default font)**

Find `.btn {` rule and add `font-family: inherit;`:
```css
.btn {
  width: 100%;
  padding: 0.8rem;
  border-radius: 0.7rem;
  font-weight: 700;
  font-family: inherit;    /* ADD THIS */
  cursor: pointer;
  border: none;
  transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), filter 0.2s, box-shadow 0.2s;
}
```

Find `.form-input {` rule and add `font-family: inherit;`:
```css
.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.7rem;
  border: 1px solid var(--bd);
  background: rgba(255,255,255,0.04);
  color: var(--tx);
  font-size: 0.9rem;
  font-family: inherit;    /* ADD THIS */
  transition: background 0.2s, box-shadow 0.2s;
}
```

**7C: Add btn-google hover (currently only has :active)**

Find `.btn-google:active { transform: scale(0.97); }` and ADD before it:
```css
.btn-google:hover:not(:disabled) {
  background: rgba(255,255,255,0.09);
  border-color: rgba(139,92,246,0.38);
}
```

**7D: Add btn-primary :active state**

Find `.btn-primary:hover:not(:disabled)` and ADD after it:
```css
.btn-primary:active:not(:disabled) {
  transform: translateY(0);
  filter: brightness(0.98);
}
```

**7E: Replace `transition: all 0.2s ease` on .tab with specific properties**

Find `.tab { ... transition: all 0.2s ease; }` and replace transition with:
```css
transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
```
(Avoids unnecessary property animations)

**7F: Fix mobile card layout — card should be full-screen feeling**

Find the `@media (max-width: 48rem)` block. Replace the `.login-card` rule inside it:

**Current:**
```css
.login-card { 
  max-width: 100%; padding: 2.5rem 1.5rem; border-radius: 1.5rem; min-height: auto;
  border: 1px solid var(--bd); display: block;
  background: transparent;
}
```

**Replace with:**
```css
.login-card {
  max-width: 100%;
  width: 100%;
  min-height: 100vh;           /* fill full screen height */
  padding: 3rem 1.5rem;
  border-radius: 0;            /* card edges = screen edges */
  border-left: none;           /* no side borders on full-width */
  border-right: none;
  border-top: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: transparent;
}
```

Also add inside the same `@media (max-width: 48rem)` block:
```css
.login-card-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

And fix `.kl-auth-panel` in that same block — remove padding since card fills it:
```css
.kl-auth-panel {
  width: 100%;
  padding: 0;                  /* card handles its own padding */
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
```

**7G: Add short viewport support (scroll instead of clip)**

Add at the end of the `<style>` block, before `</style>`:
```css
@media (max-height: 680px) {
  .kl-auth-panel  { align-items: flex-start; }
  .login-card     { padding: 1.5rem; min-height: auto; }
  .form-group     { margin-bottom: 0.75rem; }
  .divider        { margin: 1rem 0; }
}
```

---

### STEP 8 — Add Constellation Canvas to HTML

**Location:** Inside `.kl-hero-inner` div in the HTML body. Find:
```html
<div class="kl-hero-inner">
  <div class="kl-hero-title">KORAH A.I</div>
  
  <!-- 🪨 Isolated Starfield -->
  <canvas id="staticStarField"></canvas>
  <canvas id="shootingStarCanvas"></canvas>
  
  <div class="kl-bh-stage">
```

**Replace with:**
```html
<div class="kl-hero-inner">
  <div class="kl-hero-title">KORAH A.I</div>
  
  <!-- dark mode: isolated star field + shooting stars -->
  <canvas id="staticStarField"></canvas>
  <canvas id="shootingStarCanvas"></canvas>

  <!-- light mode: constellation canvas (shown/hidden via CSS theme toggle) -->
  <canvas id="constellationCanvas"></canvas>
  
  <div class="kl-bh-stage">
```

**That is the only HTML change needed.** One `<canvas>` element added.

---

### STEP 9 — Add Light Mode Skip to Dark Mode JS Functions

The static starfield and shooting star canvas are expensive RAF loops. They should skip rendering in light mode.

**9A: renderStaticStarfield() — add light mode skip**

Find the `draw` function inside `renderStaticStarfield()`. It currently starts with:
```javascript
function draw(t) {
  sctx.clearRect(0,0,S_W,S_H);
```

**Replace the start with:**
```javascript
function draw(t) {
  requestAnimationFrame(draw);
  if (document.documentElement.getAttribute('data-theme') === 'light') return;
  sctx.clearRect(0,0,S_W,S_H);
```

> **CRITICAL:** Move `requestAnimationFrame(draw)` to be the FIRST line inside `draw()`. This ensures the loop never dies regardless of early returns.

Also find the final line of `renderStaticStarfield()`:
```javascript
window.addEventListener('resize', resize); resize(); requestAnimationFrame(draw);
```
This is fine — leave as-is since `requestAnimationFrame` is now inside the function.

**9B: Shooting star draw loop — add light mode skip + fix loop**

Find the shooting star `draw` function. It currently ends with:
```javascript
requestAnimationFrame(draw);
```
at the very bottom of the function.

The issue is there are multiple `return` statements inside that skip the final `requestAnimationFrame`. **The loop can die.** Fix this by restructuring:

Find this pattern inside the shooting star draw function:
```javascript
if (s.smearing && s.smearFrames >= 30) { activeStar = null; schedule(2500 + Math.random()*2500); }
```
Currently followed by:
```javascript
    }
    requestAnimationFrame(draw);
  }
```

**The entire shooting star `draw` function should be restructured so `requestAnimationFrame(draw)` is ALWAYS the first thing called:**

Find the shooting star draw function. It starts with:
```javascript
function draw(t) {
  ctx.clearRect(0, 0, C_W, C_H);
```

**Replace the start with:**
```javascript
function draw() {
  requestAnimationFrame(draw); // always reschedule first — loop never dies
  if (document.documentElement.getAttribute('data-theme') === 'light') return;
  ctx.clearRect(0, 0, C_W, C_H);
```

Also remove the `requestAnimationFrame(draw);` from the final line of the function (it will now be a duplicate). Find:
```javascript
    }
    requestAnimationFrame(draw);
  }
```
And replace with:
```javascript
    }
  }
```

---

### STEP 10 — Add the Constellation System JS

**Location:** In the `<script type="module">` block. Find:
```javascript
document.addEventListener('alpine:init', () => setTimeout(renderLoginStarfield, 50));
```

**INSERT the entire constellation system BEFORE that line.** Copy the complete `initConstellationSystem` function from Section 5 below and paste it here. Then add the call:
```javascript
initConstellationSystem();
```
immediately after the closing `}` of the function, and before the `document.addEventListener('alpine:init', ...)` line.

---

## 5. Full Code Blocks

### Full `initConstellationSystem()` Function

Copy this entire function and paste it into the `<script type="module">` block as described in Step 10:

```javascript
/* ════════════════════════════════════════════════════════════════
   🌟 CONSTELLATION SYSTEM — light mode hero canvas
   
   Architecture:
   - 55 dots (scaled by box size) roam the canvas freely
   - Every ~7s a constellation forms from a subset of those dots
   - Korah mascot is always first each page load
   - Then 12 zodiac constellations in random shuffled order
   - Dots use spring physics to gather, then scatter on dispersal
   - Canvas is display:none in dark mode (CSS handles toggle)
   - RAF loop runs but returns early in dark mode (efficient)
   
   Phase flow:
   idle (3–5s) → roaming (7s) → gathering (2.5s) → forming (1.5s)
   → glowing (1.5s) → dispersing (2.2s) → roaming → repeat
════════════════════════════════════════════════════════════════ */
function initConstellationSystem() {
  const canvas = document.getElementById('constellationCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const isLight  = () => document.documentElement.getAttribute('data-theme') === 'light';
  const REDUCED  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let W = 0, H = 0, running = false;
  let dots = [];
  let mouse = { x: -9999, y: -9999 };

  /* ── phase state machine ── */
  let phase  = 'idle'; // idle | roaming | gathering | forming | glowing | dispersing
  let phaseT = 0;      // timestamp when current phase started

  /* ── constellation cycle state ── */
  let sessionN  = 0;              // how many constellations shown this session
  let zodiacQ   = makeZodiacQueue(); // shuffled [1..12]
  let zodiacPtr = 0;              // position in zodiacQ
  let currentC  = null;           // active constellation definition object

  /* ── per-formation state ── */
  let chosenDots   = [];  // dot objects selected to form the current constellation
  let lineProgress = [];  // float 0–1 per line (tracks draw completion)
  let lineStartTs  = [];  // timestamp when each line starts drawing
  let labelAlpha   = 0;   // label fade value 0–1
  let ambientAlpha = 0;   // ambient glow fade value 0–1
  let cx = 0, cy = 0;    // constellation center position on canvas
  let formDone = false;   // true when all lines have reached progress=1

  /* ════════════════════════════════════════════════════════════
     CONSTELLATION DATA
     
     stars: array of {x, y} in normalized coords (-1 to 1)
            x: horizontal (negative=left, positive=right)
            y: vertical (negative=up, positive=down in canvas space)
     lines: array of [starIndexA, starIndexB] pairs
     eyeStars: array of star indices that get 1.6x magnitude (Korah only)
     label: string shown below constellation when glowing
  ════════════════════════════════════════════════════════════ */
  const CONSTS = [

    /* ── 0: KORAH — the mascot (always first each session) ──────────
       Round fluffy creature: top tuft, head sides, body sides,
       two big eyes (★ = 1.6x magnitude), nose, smile, body, feet.
    ────────────────────────────────────────────────────────────── */
    { name: 'korah', label: "Hi, I'm Korah",
      stars: [
        { x:  0,     y: -0.82 }, // 0  top head tuft
        { x: -0.48,  y: -0.52 }, // 1  upper left head
        { x:  0.48,  y: -0.52 }, // 2  upper right head
        { x: -0.68,  y: -0.12 }, // 3  left body side
        { x:  0.68,  y: -0.12 }, // 4  right body side
        { x: -0.26,  y: -0.35 }, // 5  left eye  ★ (1.6x)
        { x:  0.26,  y: -0.35 }, // 6  right eye ★ (1.6x)
        { x:  0,     y: -0.02 }, // 7  nose
        { x: -0.16,  y:  0.14 }, // 8  smile left
        { x:  0.16,  y:  0.14 }, // 9  smile right
        { x: -0.52,  y:  0.40 }, // 10 lower left body
        { x:  0.52,  y:  0.40 }, // 11 lower right body
        { x: -0.20,  y:  0.76 }, // 12 left foot
        { x:  0.20,  y:  0.76 }, // 13 right foot
      ],
      lines: [
        [0, 1], [0, 2],          // top tuft to upper head sides
        [1, 3], [2, 4],          // upper head to body sides
        [1, 5], [2, 6],          // head to eyes
        [5, 6],                  // between eyes
        [5, 7], [6, 7],          // eyes to nose
        [8, 9],                  // smile arc
        [3, 10], [4, 11],        // body sides to lower body
        [10, 12], [11, 13],      // lower body to feet
        [12, 13],                // between feet
      ],
      eyeStars: [5, 6]           // the two eyes get 1.6x magnitude
    },

    /* ── 1: ARIES — curved arc, 4 stars ── */
    { name: 'aries', label: 'Aries',
      stars: [
        { x: -0.65, y:  0.12 }, // 0 Hamal (brightest)
        { x: -0.18, y:  0.02 }, // 1 Sheratan
        { x:  0.08, y: -0.06 }, // 2 Mesarthim
        { x:  0.55, y:  0.18 }, // 3 41 Arietis
      ],
      lines: [[0, 1], [1, 2], [2, 3]],
      eyeStars: []
    },

    /* ── 2: TAURUS — V-shape Hyades + horn + Pleiades cluster ── */
    { name: 'taurus', label: 'Taurus',
      stars: [
        { x:  0.12, y:  0.18 }, // 0 Aldebaran (brightest, orange giant)
        { x: -0.08, y: -0.05 }, // 1 Ain (center of V)
        { x:  0.35, y: -0.28 }, // 2 right V arm tip
        { x: -0.32, y: -0.22 }, // 3 left V arm (Hyades)
        { x:  0.50, y:  0.08 }, // 4 right horn
        { x: -0.60, y: -0.60 }, // 5 Pleiades cluster area
      ],
      lines: [[0, 1], [1, 2], [1, 3], [0, 4], [1, 5]],
      eyeStars: []
    },

    /* ── 3: GEMINI — twin parallel stick figures ── */
    { name: 'gemini', label: 'Gemini',
      stars: [
        { x: -0.30, y: -0.72 }, // 0 Castor head
        { x:  0.30, y: -0.78 }, // 1 Pollux head
        { x: -0.34, y: -0.38 }, // 2 Castor shoulder
        { x:  0.33, y: -0.42 }, // 3 Pollux shoulder
        { x: -0.38, y:  0.08 }, // 4 Castor waist
        { x:  0.36, y:  0.04 }, // 5 Pollux waist
        { x: -0.40, y:  0.55 }, // 6 Castor feet
        { x:  0.38, y:  0.52 }, // 7 Pollux feet
      ],
      lines: [[0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [4, 5]],
      eyeStars: []
    },

    /* ── 4: CANCER — faint Y-shape ── */
    { name: 'cancer', label: 'Cancer',
      stars: [
        { x:  0,     y: -0.55 }, // 0 top
        { x: -0.42,  y: -0.05 }, // 1 left
        { x:  0.42,  y:  0.00 }, // 2 right
        { x: -0.26,  y:  0.52 }, // 3 lower left
        { x:  0.26,  y:  0.52 }, // 4 lower right
      ],
      lines: [[0, 1], [0, 2], [1, 3], [2, 4]],
      eyeStars: []
    },

    /* ── 5: LEO — sickle/backward question mark + body triangle ── */
    { name: 'leo', label: 'Leo',
      stars: [
        { x: -0.12, y: -0.65 }, // 0 Regulus (brightest, base of sickle)
        { x: -0.38, y: -0.32 }, // 1 Eta Leonis
        { x: -0.58, y:  0.02 }, // 2 Gamma Leonis
        { x: -0.42, y:  0.32 }, // 3 Zeta Leonis
        { x: -0.06, y:  0.48 }, // 4 Mu Leonis
        { x:  0.62, y:  0.32 }, // 5 Denebola (tail, brightest)
        { x:  0.12, y: -0.02 }, // 6 Delta Leonis
      ],
      lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 0]],
      eyeStars: []
    },

    /* ── 6: VIRGO — large Y spread, Spica at top ── */
    { name: 'virgo', label: 'Virgo',
      stars: [
        { x:  0,     y: -0.72 }, // 0 Spica (brightest)
        { x: -0.28,  y: -0.22 }, // 1 center left
        { x:  0.28,  y: -0.18 }, // 2 center right
        { x: -0.62,  y:  0.22 }, // 3 left arm
        { x:  0.58,  y:  0.18 }, // 4 right arm
        { x: -0.02,  y:  0.42 }, // 5 lower
        { x: -0.38,  y:  0.78 }, // 6 foot
      ],
      lines: [[0, 1], [0, 2], [1, 3], [2, 4], [1, 5], [5, 6]],
      eyeStars: []
    },

    /* ── 7: LIBRA — balance scale shape ── */
    { name: 'libra', label: 'Libra',
      stars: [
        { x:  0,     y: -0.58 }, // 0 top center beam
        { x: -0.52,  y: -0.08 }, // 1 left pan
        { x:  0.52,  y: -0.02 }, // 2 right pan
        { x: -0.28,  y:  0.38 }, // 3 lower left
        { x:  0.28,  y:  0.42 }, // 4 lower right
      ],
      lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4], [1, 2]],
      eyeStars: []
    },

    /* ── 8: SCORPIUS — distinctive J-hook/S-curve ── */
    { name: 'scorpius', label: 'Scorpius',
      stars: [
        { x: -0.12, y: -0.76 }, // 0 Antares (head, red supergiant)
        { x: -0.28, y: -0.52 }, // 1
        { x: -0.32, y: -0.26 }, // 2
        { x: -0.22, y:  0.02 }, // 3
        { x:  0.02, y:  0.24 }, // 4
        { x:  0.22, y:  0.44 }, // 5
        { x:  0.42, y:  0.56 }, // 6 tail start
        { x:  0.58, y:  0.36 }, // 7 stinger
        { x:  0.68, y:  0.12 }, // 8 stinger tip
      ],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8]],
      eyeStars: []
    },

    /* ── 9: SAGITTARIUS — teapot asterism (iconic) ── */
    { name: 'sagittarius', label: 'Sagittarius',
      stars: [
        { x: -0.58, y:  0.22 }, // 0 spout base
        { x: -0.32, y: -0.08 }, // 1 spout top
        { x: -0.08, y:  0.12 }, // 2 body left
        { x:  0.22, y:  0.36 }, // 3 base right
        { x:  0.52, y:  0.26 }, // 4 handle base
        { x:  0.58, y: -0.04 }, // 5 handle top
        { x:  0.12, y: -0.28 }, // 6 lid
        { x: -0.18, y: -0.55 }, // 7 top of spout
      ],
      lines: [[0,1],[1,7],[7,6],[6,5],[5,4],[4,3],[3,2],[2,0],[2,6],[1,2]],
      eyeStars: []
    },

    /* ── 10: CAPRICORN — triangular arrowhead ── */
    { name: 'capricorn', label: 'Capricorn',
      stars: [
        { x: -0.65, y: -0.42 }, // 0 top left
        { x: -0.18, y: -0.52 }, // 1 top mid
        { x:  0.42, y: -0.30 }, // 2 top right
        { x:  0.68, y:  0.10 }, // 3 right
        { x:  0.32, y:  0.55 }, // 4 bottom right
        { x: -0.32, y:  0.55 }, // 5 bottom left
        { x: -0.62, y:  0.12 }, // 6 left
      ],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]],
      eyeStars: []
    },

    /* ── 11: AQUARIUS — Y with flowing waves ── */
    { name: 'aquarius', label: 'Aquarius',
      stars: [
        { x: -0.10, y: -0.68 }, // 0 top
        { x: -0.38, y: -0.30 }, // 1 left shoulder
        { x:  0.32, y: -0.26 }, // 2 right shoulder
        { x: -0.52, y:  0.08 }, // 3 left arm
        { x:  0.12, y:  0.04 }, // 4 center
        { x:  0.52, y:  0.08 }, // 5 right arm
        { x: -0.32, y:  0.50 }, // 6 water wave left
        { x:  0.02, y:  0.56 }, // 7 water wave center
        { x:  0.32, y:  0.50 }, // 8 water wave right
      ],
      lines: [[0,1],[0,2],[1,3],[2,5],[1,4],[4,2],[3,6],[6,7],[7,8],[8,5]],
      eyeStars: []
    },

    /* ── 12: PISCES — two fish connected by a cord ── */
    { name: 'pisces', label: 'Pisces',
      stars: [
        { x: -0.62, y: -0.52 }, // 0 fish 1 top
        { x: -0.58, y: -0.18 }, // 1 fish 1 middle
        { x: -0.72, y:  0.12 }, // 2 fish 1 left
        { x: -0.52, y:  0.30 }, // 3 fish 1 tail
        { x: -0.20, y:  0.14 }, // 4 cord left
        { x:  0.22, y:  0.10 }, // 5 cord right
        { x:  0.52, y: -0.10 }, // 6 fish 2 left
        { x:  0.68, y: -0.42 }, // 7 fish 2 top
        { x:  0.78, y: -0.10 }, // 8 fish 2 right
        { x:  0.62, y:  0.22 }, // 9 fish 2 tail
      ],
      lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,6]],
      eyeStars: []
    }

  ]; // end CONSTS

  /* ════════════════════════
     HELPER FUNCTIONS
  ════════════════════════ */

  function makeZodiacQueue() {
    // fisher-yates shuffle of [1..12]
    const a = [1,2,3,4,5,6,7,8,9,10,11,12];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function nextConst() {
    if (sessionN === 0) { sessionN++; return CONSTS[0]; } // Korah always first
    const idx = zodiacQ[zodiacPtr++];
    if (zodiacPtr >= 12) { zodiacQ = makeZodiacQueue(); zodiacPtr = 0; }
    sessionN++;
    return CONSTS[idx];
  }

  /* ════════════════════════
     DOT POOL
  ════════════════════════ */

  function makeDot() {
    return {
      x:   Math.random() * W,     // current x position
      y:   Math.random() * H,     // current y position
      vx:  (Math.random() - 0.5) * 0.4, // velocity x
      vy:  (Math.random() - 0.5) * 0.4, // velocity y
      r:   2 + Math.random() * 2,        // radius
      base: 0.35 + Math.random() * 0.22, // base alpha (twinkle oscillates around this)
      twPh: Math.random() * Math.PI * 2, // twinkle phase
      twSp: 0.008 + Math.random() * 0.013, // twinkle speed
      mag:  1.0 + Math.random() * 0.3,   // size multiplier (1.6 for Korah eyes)
      // constellation role
      isC:  false,                // true when this dot is part of current constellation
      ci:   -1,                  // index in chosenDots (= star index in constellation)
      tx:   0,  ty:  0,          // spring target position
      svx:  0,  svy: 0,          // spring velocity
      stMs: 0,                   // stagger delay in ms before gathering starts
      glow: 0,                   // glow level 0–1 (increases during formation)
      bOff: Math.random() * Math.PI * 2, // breath phase offset (unique per dot)
      cg:   0,                   // cursor proximity glow 0–1
      // scatter
      scMs:      0,              // scatter delay ms
      scattered: false,
      stX:  0,  stY: 0,          // scatter target position
    };
  }

  function buildDots() {
    // scale dot count with canvas area (min 30, max 55)
    const ref = 600 * 500;
    const N   = Math.max(30, Math.min(55, Math.round(55 * Math.sqrt((W * H) / ref))));
    dots = Array.from({ length: N }, makeDot);
  }

  /* ════════════════════════
     CANVAS RESIZE
  ════════════════════════ */

  function resize() {
    const hero = document.querySelector('.kl-hero-inner');
    if (!hero) return;
    const r  = hero.getBoundingClientRect();
    W = canvas.width  = r.width;
    H = canvas.height = r.height;
    // rebuild dots only if not mid-formation
    if (phase === 'idle' || phase === 'roaming') buildDots();
  }

  /* ════════════════════════
     PHASE HANDLERS
  ════════════════════════ */

  function startGather() {
    currentC = nextConst();
    const N  = currentC.stars.length;

    // pick N random dots from the pool
    chosenDots = dots.slice().sort(() => Math.random() - 0.5).slice(0, N);

    // constellation center: slightly above canvas mid + random drift
    cx = W / 2 + (Math.random() - 0.5) * 50;
    cy = H * 0.44 + (Math.random() - 0.5) * 40;
    const scale = Math.min(W, H) * 0.34;

    // assign constellation roles to chosen dots
    chosenDots.forEach((d, i) => {
      d.isC  = true;
      d.ci   = i;
      d.tx   = cx + currentC.stars[i].x * scale;
      d.ty   = cy + currentC.stars[i].y * scale;
      d.svx  = 0;  d.svy  = 0;
      d.stMs = Math.random() * 200; // stagger 0–200ms
      d.glow = 0;
      // eye stars get bigger magnitude (only Korah constellation has eyeStars)
      d.mag  = currentC.eyeStars.includes(i) ? 1.6 : 1.0 + Math.random() * 0.4;
    });

    lineProgress = currentC.lines.map(() => 0);
    lineStartTs  = [];
    labelAlpha   = 0;
    ambientAlpha = 0;
    formDone     = false;

    phase = 'gathering';
    phaseT = Date.now();
  }

  function startForm() {
    const now   = Date.now();
    // randomise which line draws first for organic feel
    const order = currentC.lines.map((_, i) => i).sort(() => Math.random() - 0.5);
    lineStartTs = new Array(currentC.lines.length).fill(0);
    order.forEach((li, pos) => {
      // 138–180ms between each line starting
      lineStartTs[li] = now + pos * (138 + Math.random() * 42);
    });
    phase  = 'forming';
    phaseT = now;
  }

  function startDispersal() {
    // sort by magnitude ascending → dot with largest magnitude leaves LAST (dramatic)
    const sorted = chosenDots.slice().sort((a, b) => a.mag - b.mag);
    sorted.forEach((d, i) => {
      d.scMs      = i * 115 + Math.random() * 38;
      if (i === sorted.length - 1) d.scMs = sorted.length * 115 + 160; // biggest last
      d.scattered = false;
      d.stX       = Math.random() * W;
      d.stY       = Math.random() * H;
    });
    phase  = 'dispersing';
    phaseT = Date.now();
  }

  /* ════════════════════════
     BOW CURVE LINE DRAW
     
     Lines draw with a slight perpendicular arc that straightens
     as the line completes — like drawing by hand.
     
     bow peaks at progress=0.5 (3.5px), zero at 0 and 1.
  ════════════════════════ */
  function bowLine(x1, y1, x2, y2, prog, alpha) {
    const ex  = x1 + (x2 - x1) * prog;
    const ey  = y1 + (y2 - y1) * prog;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const px  = -(y2 - y1) / len; // perpendicular unit vector x
    const py  =  (x2 - x1) / len; // perpendicular unit vector y
    const bow = 3.5 * Math.sin(prog * Math.PI); // arc peaks at midpoint
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(
      (x1 + ex) / 2 + px * bow,
      (y1 + ey) / 2 + py * bow,
      ex, ey
    );
    ctx.strokeStyle = `rgba(139,92,246,${alpha})`;
    ctx.lineWidth   = 1;
    ctx.stroke();
  }

  /* ════════════════════════
     REDUCED MOTION
     Shows static Korah only — no animation
  ════════════════════════ */
  function drawStaticKorah() {
    const k     = CONSTS[0];
    const scale = Math.min(W, H) * 0.32;
    const px = W / 2, py = H * 0.44;
    const pos = k.stars.map(s => ({ x: px + s.x * scale, y: py + s.y * scale }));
    ctx.clearRect(0, 0, W, H);
    // lines
    k.lines.forEach(([a, b]) => {
      ctx.beginPath();
      ctx.moveTo(pos[a].x, pos[a].y);
      ctx.lineTo(pos[b].x, pos[b].y);
      ctx.strokeStyle = 'rgba(139,92,246,0.45)';
      ctx.lineWidth   = 1;
      ctx.stroke();
    });
    // dots
    pos.forEach((p, i) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, k.eyeStars.includes(i) ? 3.2 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(139,92,246,0.7)';
      ctx.fill();
    });
  }

  /* ════════════════════════════════════════════════
     MAIN ANIMATION LOOP
     
     requestAnimationFrame is always first line —
     loop never dies even with early returns.
  ════════════════════════════════════════════════ */
  function draw() {
    requestAnimationFrame(draw);

    // skip rendering in dark mode (canvas is display:none anyway, but this saves GPU)
    if (!isLight()) return;

    // reduced motion: static Korah only
    if (REDUCED) {
      ctx.clearRect(0, 0, W, H);
      drawStaticKorah();
      return;
    }

    ctx.clearRect(0, 0, W, H);
    const now    = Date.now();
    const dt     = now - phaseT;
    const active = phase === 'gathering' || phase === 'forming' || phase === 'glowing';
    const constSet = new Set(chosenDots); // for fast O(1) membership check

    /* ── phase transitions ── */
    if (phase === 'gathering') {
      // check if all constellation stars have reached their targets
      const close = chosenDots.every(d => Math.hypot(d.tx - d.x, d.ty - d.y) < 8);
      if (close || dt > 3000) startForm(); // timeout fallback at 3s
    }
    if (phase === 'forming' && !formDone && lineProgress.every(p => p >= 1)) {
      formDone = true;
      // brief pause before glow phase
      setTimeout(() => { if (phase === 'forming') { phase = 'glowing'; phaseT = Date.now(); } }, 200);
    }
    if (phase === 'glowing'    && dt > 1500) startDispersal();
    if (phase === 'dispersing' && dt > 2200) {
      // clean up: all chosen dots return to normal roaming
      chosenDots.forEach(d => {
        d.isC = false; d.ci = -1; d.glow = 0;
        d.mag  = 1.0 + Math.random() * 0.3;
        d.svx  = 0; d.svy = 0;
        // give gentle velocity toward scatter target
        const len = Math.hypot(d.stX - d.x, d.stY - d.y) || 1;
        d.vx = ((d.stX - d.x) / len) * (0.3 + Math.random() * 0.15);
        d.vy = ((d.stY - d.y) / len) * (0.3 + Math.random() * 0.15);
      });
      chosenDots = [];
      labelAlpha = 0; ambientAlpha = 0;
      phase = 'roaming'; phaseT = now;
    }
    if (phase === 'roaming' && dt > 7000) startGather();

    /* ── update all dots ── */
    dots.forEach(d => {
      if (d.isC) {
        /* constellation star — spring physics toward target */
        if (phase === 'gathering' && now - phaseT > d.stMs) {
          // spring: F = k * displacement, damped
          const dx = d.tx - d.x, dy = d.ty - d.y;
          d.svx += dx * 0.018; d.svy += dy * 0.018;
          d.svx *= 0.88;       d.svy *= 0.88; // damping
          d.x   += d.svx;      d.y   += d.svy;
          d.glow = Math.min(0.55, d.glow + 0.003); // slowly brighten
        }
        if (phase === 'forming') {
          // micro-wobble: tiny irregular oscillation even when settled
          d.x   += (Math.random() - 0.5) * 0.22;
          d.y   += (Math.random() - 0.5) * 0.22;
          d.glow = Math.min(0.85, d.glow + 0.007); // continue brightening
        }
        if (phase === 'glowing') {
          d.x   += (Math.random() - 0.5) * 0.18;
          d.y   += (Math.random() - 0.5) * 0.18;
          // breathe: each star oscillates at unique phase offset
          d.glow = 0.85 + Math.sin(now * 0.002 + d.bOff) * 0.07;
        }
        if (phase === 'dispersing') {
          d.glow = Math.max(0, d.glow - 0.02); // dim down
          // staggered scatter: each dot breaks free at different time
          if (!d.scattered && now - phaseT > d.scMs + 600) {
            d.scattered = true;
            d.isC = false; d.ci = -1;
            const len = Math.hypot(d.stX - d.x, d.stY - d.y) || 1;
            d.vx = ((d.stX - d.x) / len) * (0.35 + Math.random() * 0.18);
            d.vy = ((d.stY - d.y) / len) * (0.35 + Math.random() * 0.18);
          }
          if (d.scattered) {
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > W) { d.vx *= -1; d.x = Math.max(0, Math.min(W, d.x)); }
            if (d.y < 0 || d.y > H) { d.vy *= -1; d.y = Math.max(0, Math.min(H, d.y)); }
          }
        }
      } else {
        /* roaming dot — standard canvas constellation behavior */
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > W) { d.vx *= -1; d.x = Math.max(0, Math.min(W, d.x)); }
        if (d.y < 0 || d.y > H) { d.vy *= -1; d.y = Math.max(0, Math.min(H, d.y)); }

        // soft repulsion from constellation stars during active phases
        // prevents roaming dots from overlapping with forming constellation
        if (active) {
          chosenDots.forEach(cs => {
            const dx = d.x - cs.x, dy = d.y - cs.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 6400 && d2 > 0) { // 80px radius
              const dist = Math.sqrt(d2);
              const f    = ((80 - dist) / 80) * 0.35;
              d.vx += (dx / dist) * f;
              d.vy += (dy / dist) * f;
            }
          });
          // clamp velocity to prevent runaway
          const spd = Math.hypot(d.vx, d.vy);
          if (spd > 0.75) { d.vx = (d.vx / spd) * 0.75; d.vy = (d.vy / spd) * 0.75; }
        }
      }

      // cursor proximity glow: dots near mouse get brighter
      const md = Math.hypot(d.x - mouse.x, d.y - mouse.y);
      d.cg = md < 60
        ? Math.min(1, d.cg + 0.08)    // approach cursor: brighten fast
        : Math.max(0, d.cg - 0.06);   // leave cursor: fade slowly

      // twinkle: advance individual phase
      d.twPh += d.twSp;
    });

    /* ── proximity lines ──
       Same as existing initConstellation() behavior.
       Lines draw between nearby roaming dots.
       DOES NOT connect to constellation stars during active phases.
    ── */
    const PROX = 155; // max distance to draw a line
    for (let i = 0; i < dots.length; i++) {
      for (let j = i + 1; j < dots.length; j++) {
        // suppress connections involving constellation stars
        if (active && (constSet.has(dots[i]) || constSet.has(dots[j]))) continue;
        const dx = dots[i].x - dots[j].x;
        const dy = dots[i].y - dots[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < PROX) {
          ctx.beginPath();
          ctx.moveTo(dots[i].x, dots[i].y);
          ctx.lineTo(dots[j].x, dots[j].y);
          ctx.strokeStyle = `rgba(139,92,246,${(1 - d / PROX) * 0.3})`;
          ctx.lineWidth   = 1;
          ctx.stroke();
        }
      }
    }

    /* ── constellation lines ── */
    if ((phase === 'forming' || phase === 'glowing') && currentC) {
      const LINE_DUR = 580; // ms for each line to draw in
      currentC.lines.forEach(([a, b], li) => {
        const st = lineStartTs[li];
        if (!st || now < st) return; // not started yet
        const prog = Math.min(1, (now - st) / LINE_DUR);
        lineProgress[li] = prog;
        const dA = chosenDots[a], dB = chosenDots[b];
        if (!dA || !dB) return;
        // glowing phase: lines breathe (slight alpha oscillation, off-sync per line)
        const alpha = phase === 'glowing'
          ? 0.5 + Math.sin(now * 0.0014 + li * 0.6) * 0.12
          : 0.5;
        bowLine(dA.x, dA.y, dB.x, dB.y, prog, alpha);
      });
    }

    // fade constellation lines at dispersal start (before dots scatter)
    if (phase === 'dispersing' && currentC) {
      const lfa = Math.max(0, 1 - dt / 380) * 0.5; // fades out in 380ms
      if (lfa > 0) {
        currentC.lines.forEach(([a, b]) => {
          const dA = chosenDots[a], dB = chosenDots[b];
          if (!dA || !dB) return;
          bowLine(dA.x, dA.y, dB.x, dB.y, 1, lfa);
        });
      }
    }

    /* ── ambient glow ──
       Soft radial gradient behind constellation during glow phase.
       Uses light korah purple as requested.
    ── */
    const ambTarget = phase === 'glowing' ? 0.055
      : (phase === 'dispersing' && dt < 500) ? 0.055 * Math.max(0, 1 - dt / 500) : 0;
    ambientAlpha += (ambTarget - ambientAlpha) * 0.04;
    if (ambientAlpha > 0.004) {
      const r  = Math.min(W, H) * 0.44;
      const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      gr.addColorStop(0, `rgba(139,92,246,${ambientAlpha})`);
      gr.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = gr;
      ctx.fill();
    }

    /* ── draw all dots ── */
    ctx.shadowBlur = 0;
    dots.forEach(d => {
      const gl  = d.glow || 0;
      const cg  = d.cg   || 0;
      const tw  = 0.1 * Math.sin(d.twPh); // twinkle oscillation
      const r   = d.r * d.mag * (1 + gl * 0.22 + cg * 0.18); // size with glow boost
      const a   = Math.min(0.95, d.base + tw + gl * 0.42 + cg * 0.22); // alpha with glow

      // glow shadow only when significant (performance)
      if (gl > 0.25 || cg > 0.15) {
        ctx.shadowBlur  = (gl + cg * 0.5) * 12;
        ctx.shadowColor = `rgba(167,139,250,${(gl + cg * 0.4) * 0.65})`;
      }

      ctx.beginPath();
      ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(139,92,246,${a})`;
      ctx.fill();

      if (gl > 0.25 || cg > 0.15) ctx.shadowBlur = 0;
    });
    ctx.shadowBlur = 0; // always reset

    /* ── constellation label ──
       Appears 0.8s into glow phase, fades before dispersal.
       Positioned below constellation center.
    ── */
    const showLabel  = phase === 'glowing' && dt > 800;
    const dispFade   = phase === 'dispersing' ? Math.max(0, 1 - dt / 300) : 1;
    labelAlpha      += ((showLabel ? 1 : 0) * dispFade - labelAlpha) * 0.05;

    if (labelAlpha > 0.01 && currentC) {
      ctx.save();
      ctx.globalAlpha = labelAlpha;
      ctx.font        = '500 11px Plus Jakarta Sans';
      ctx.fillStyle   = 'rgba(109,40,217,0.8)';
      ctx.textAlign   = 'center';
      ctx.fillText(currentC.label, cx, cy + Math.min(W, H) * 0.38);
      ctx.restore();
    }

  } // end draw()

  /* ════════════════════════
     EVENT LISTENERS
  ════════════════════════ */
  canvas.addEventListener('mousemove', e => {
    const r  = canvas.getBoundingClientRect();
    mouse.x  = e.clientX - r.left;
    mouse.y  = e.clientY - r.top;
  });
  canvas.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
  window.addEventListener('resize', resize);

  /* ════════════════════════
     INIT
  ════════════════════════ */
  function start() {
    if (!isLight()) return;
    resize();

    if (REDUCED) {
      // reduced motion: just show static Korah, no RAF needed
      if (!running) { running = true; requestAnimationFrame(draw); }
      return;
    }

    buildDots();
    phase  = 'idle';
    phaseT = Date.now();

    // 3–5 second random delay before Korah starts forming
    const initDelay = 3000 + Math.random() * 2000;
    setTimeout(() => {
      if (!isLight()) return; // user may have switched back to dark
      phase  = 'roaming';
      phaseT = Date.now();
      setTimeout(() => { if (isLight()) startGather(); }, 500);
    }, initDelay);

    if (!running) { running = true; requestAnimationFrame(draw); }
  }

  // watch for theme changes (no-op in dark mode)
  new MutationObserver(() => {
    if (isLight() && !running) start();
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  start();
} // end initConstellationSystem()
```

---

## Final Checklist

After implementing all steps, verify:

- [ ] **Step 1:** `html[data-theme="light"]:not(.korah-page-ready)` exists in FOUC block
- [ ] **Step 2:** `[data-theme="light"]` has `--tx: #f0eaff` (light, not dark)
- [ ] **Step 3:** `z-index: 10` removed from `.kl-shell`, `overflow-x: hidden` added
- [ ] **Step 4:** Firefox scrollbar `scrollbar-width: thin` added to `*`
- [ ] **Step 5:** `[data-theme="light"] .kl-hero-inner { background: #ffffff }` added
- [ ] **Step 6:** `#constellationCanvas` CSS block added with light/dark mode toggling
- [ ] **Step 7A:** `.form-input::placeholder { color: var(--tx3) }` added
- [ ] **Step 7B:** `font-family: inherit` added to `.btn` and `.form-input`
- [ ] **Step 7C:** `.btn-google:hover:not(:disabled)` rule added
- [ ] **Step 7D:** `.btn-primary:active:not(:disabled)` rule added
- [ ] **Step 7E:** `.tab` transition changed from `all` to specific properties
- [ ] **Step 7F:** Mobile card uses `min-height: 100vh`, `border-radius: 0`, flex layout
- [ ] **Step 7G:** `@media (max-height: 680px)` block added
- [ ] **Step 8:** `<canvas id="constellationCanvas"></canvas>` added in HTML inside `.kl-hero-inner`
- [ ] **Step 9A:** `renderStaticStarfield.draw()` has `requestAnimationFrame(draw)` as FIRST line + light mode early return
- [ ] **Step 9B:** Shooting star `draw()` has `requestAnimationFrame(draw)` as FIRST line + light mode early return
- [ ] **Step 10:** `initConstellationSystem()` function added and called in JS module
- [ ] **Verify dark mode:** Black hole, star field, shooting stars all work normally
- [ ] **Verify light mode:** White inner box, constellation canvas visible, dots roaming, constellation forms after 3-5s
- [ ] **Verify reduced motion:** Static Korah shown, no animation
- [ ] **Verify mobile:** Card fills full screen, no horizontal scroll