# Korah Login - Master Technical Roadmap

# Before implementing any task, check in with the user to see if they want to continue. If you finish a task and then are about to go to the next one, ask the user first if they want to continue and are satisfied with the end result of that task (If they want to continue then do your best to assist them to get the end-result they want)

This document provides complete context and implementation logic for UI/UX and physics improvements to `login.html`.

## 0. Implementation Context (For Agents)
`login.html` uses a three-canvas architecture layered inside `.kl-hero-inner`.
1.  `staticStarField`: Background twinkles and gravitational lensing.
2.  `shootingStarCanvas`: Physics-based trajectories and "Spaghetti" effects.
3.  `constellationCanvas`: (Light Mode Only) Dot-roaming and brand formation.

**State Machine (JS):**
The `constellationCanvas` logic follows these phases:
`idle` → `roaming` → `gathering` (target selection) → `forming` (connecting lines) → `glowing` (logo reveal/payoff) → `dispersing` → `roaming`.

---

## 1. Dark Mode: Atmospheric Physics & Depth

### 1.1 Space Aesthetics (Subtle Depth)
*   **Nebula Glow:** Add 2-3 semi-transparent radial gradients to `staticStarField`. Use `var(--p4)` at 5-8% opacity. **Must be subtle.**
*   **Panel Blending:** Replace the 1px divider in `.kl-shell::after` with a wide, soft gradient bleed (`background: linear-gradient(...)`) to fuse the hero and auth panels.
*   **Loading Fix:** Set `background: var(--bg)` directly on `.kl-hero-inner` via CSS to prevent the white/black flash during canvas setup.
*   **Logo Implementation:** Add a "space korah logo" in the black hole hero, somewhere in the surrounding space like possibly in the background on a rocket flying by or another way. The korah logo needs to be like a "astronaut" korah with a helmet. This is just a potential idea to add for logo placement, since the logo NEEDS to be in there.
---

## 2. Light Mode: Premium Brand Constellations

### 2.1 Logo Mapping & Reveal
*   **Precision:** Replace zodiac signs with coordinates for **Korah Logo** variations (K-icon, Wordmark). (This is for all related korah logos that match the "study" flow of korah and possibly just some other funny korah logos or just him looking cool.)
*   **Logo Reveal:** When `formDone` is true, fade in a `.logo-overlay` image behind the dots at `opacity: 0.12`. It should feel like a ghost image, not a solid block.
*   **Text Removal:** Remove the `labelAlpha` and `fillText` logic that displays names under the constellation.

### 2.2 "Stage Clearing" (The Focus Logic)
To prevent roaming dots from cluttering the brand formation, do NOT use blur. Use **Selective Dimming**.
*   **JS Logic:** Introduce a `globalFocusFactor` (0.0 to 1.0).
*   **Behavior:** When `phase` is `forming` or `glowing`, ease `globalFocusFactor` down to `0.2`.
*   **Drawing Loop:** If a dot is NOT part of the constellation (`!d.isC`), multiply its opacity and radius by `globalFocusFactor`.
*   **Result:** Roaming dots fade and shrink into the background, leaving the stage exclusively for the Korah logo.

### 2.3 "Jewel" Dot Aesthetics
Dots must match the "Premium" vibe of §1 in `UI-UX.md`.
*   **Core + Aura:** Render each dot in two passes:
    1.  **Aura:** Large, soft glow (`rgba(139,92,246, 0.25)`) using `shadowBlur`.
    2.  **Core:** Small, sharp point (`rgba(139,92,246, 0.9)`) for "twinkle" effect.
*   **Shimmer:** Constellation dots should have a high-frequency, low-amplitude radius pulse.

### 2.4 Performance & Tab Management
*   **Tab Stacking Fix:** Add a `document.visibilityState` check. If the tab is hidden, pause the `constellationCanvas` requestAnimationFrame and reset `phaseT` on return to prevent massive physics "catch-up" or constellation stacking.

### 2.5 Auth UI Tweaks
*   **Tab Contrast:** In Light Mode, when a `.tab` is `.active`, the text color MUST be set to black (`#000`) for maximum readability against the purple tint.

---

## 3. Potential Implements (Post-Main Tasks)
*These tasks depend on user approval after the core plan is implemented.*

### 3.1 Reduced Motion Mode (Accessibility)
If `(prefers-reduced-motion: reduce)` is detected:
*   **Dark Mode:** `shootingStarCanvas` is disabled. `staticStarField` and Black Hole are static.
*   **Light Mode:** Roaming is disabled. The canvas shows a pre-formed, static Korah Logo constellation.
*   **Auth Card:** Starfield background in the login card becomes a static high-quality image/pattern.

### 3.2 Cinematic Entrance Transitions
When the user successfully logs in and transitions to the main app:
*   **Dark Mode Concept:** The Black Hole (`.kl-bh-wrap`) scales up exponentially, creating a "suction" effect that appears to pull the user into the interface.
*   **Light Mode Concept 1 (White Hole):** A sudden burst of white light from the logo center "pushes" the user into the web app.
*   **Light Mode Concept 2 (Mascot Interaction):** A Korah mascot motion picture where the mascot appears to grab the camera/user and pull them forward into the next page.

---

## 4. Reference Table for Implementation

| Feature | Target Element | Logic/Class |
| :--- | :--- | :--- |
| **Stage Clearing** | `constellationCanvas` | `globalFocusFactor` ease-in/out |
| **Jewel Dots** | `constellationCanvas` | 2-pass rendering (Core/Aura) |
| **Logo Overlay** | `.logo-overlay` | CSS Transition (0.8s) + Opacity 0.12 |
| **Active Tab Text** | `.tab.active` | `color: #000 !important` (Light Mode) |
| **Nebula** | `staticStarField` | `ctx.createRadialGradient` (Low Alpha) |
| **Physics** | `shootingStarCanvas` | `spawn()` trajectory randomization |

---

## 5. Finalization & Cleanup (Mandatory)
*Only execute this when the user explicitly confirms the page is "completely finished and smooth."*

### 5.1 Theme Toggle Removal
The `#themeToggle` button and its associated logic are for development/debug purposes. 
- **Action:** Surgically remove the `#themeToggle` button from the HTML.
- **Action:** Remove the corresponding CSS `.theme-toggle-btn` and hover rules.
- **Action:** Remove the theme toggle JS event listener block at the bottom of the script.
- **Constraint:** Do NOT touch the inline theme-initialization script in the `<head>` that sets the `data-theme` attribute from `localStorage`.

