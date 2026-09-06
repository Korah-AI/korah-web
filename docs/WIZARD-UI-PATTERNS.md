# Wizard UI/UX patterns (grey color blocking + Practice Rush shell)

The house pattern for multi-step wizards on the Alpine/HTML pages: a Duolingo-style
step shell, **neutral grey resting surfaces**, and **per-option accent colors**, so a
group of buttons is never one flat color and nothing blends into the background.

Reference implementations:

| File | What it holds |
| --- | --- |
| `korah-bot/sat/study-plan.html` | The full pattern: 4-step wizard, memory-lights flash, custom popups. Scoped under `.sp-wizard`. |
| `korah-bot/sat/sat-rush.css` | The shell (`.rush-step`, `.rush-card`, `.rush-diff`, `.rush-btn`) + the shared "Grey color blocking" section at the end of the file. |
| `korah-bot/sat/js/sat-rush.js` | How tones are attached to rendered options (`SUBJECTS`, `DIFFICULTIES`, `TONES`). |
| `korah-bot/sat/rush.html` | The original 3-step wizard the shell came from. |
| `korah-bot/sat/sat.css` | Same system applied to a non-wizard page, scoped under `.sat-grey`. |

---

## 1. Never use the app surface tokens for resting states

`--sf`, `--sf2` and `--bd` are **purple-tinted and translucent**. On the dark
background an unselected card painted with them reads as "the same color as the
background" — it doesn't look like a button at all.

Define a neutral grey set instead, scoped to the wizard, with a light-theme pair:

```css
.sp-wizard {
  --sp-sf:  #26262e;   /* card / input fill      */
  --sp-sf2: #31313c;   /* ghost buttons, chips   */
  --sp-bd:  #454553;   /* borders + 3D shadow    */
}
html[data-theme="light"] .sp-wizard {
  --sp-sf: #eceef2; --sp-sf2: #e0e3ea; --sp-bd: #c3c8d2;
}
```

Point every resting surface at them: cards, tiles, inputs, drop zones, toggle rows,
ghost buttons, dropdown panels, inactive step dots.

## 2. Color marks identity or state — nothing else

Each option in a group carries a `.tone-*` class that sets `--acc`. Every accent —
border, selected fill, hover glow, icon, spotlight color — reads from `--acc`, so one
class colors the whole element.

```css
.tone-red { --acc: #ef4444; }  .tone-orange { --acc: #f97316; }
.tone-amber { --acc: #f59e0b; } .tone-green { --acc: #22c55e; }
.tone-teal { --acc: #14b8a6; }  .tone-blue  { --acc: #3b82f6; }
.tone-pink { --acc: #ec4899; }

.rush-card:hover, .rush-diff:hover:not(.is-selected) {
  border-color: color-mix(in srgb, var(--acc) 70%, var(--sp-bd));
  box-shadow: 0 0.6rem 1.6rem color-mix(in srgb, var(--acc) 30%, transparent),
              0 0.3rem 0 0 color-mix(in srgb, var(--acc) 45%, var(--sp-bd));
}
.rush-card.is-selected, .rush-diff.is-selected {
  color: #fff;
  border-color: var(--acc);
  background: linear-gradient(180deg, var(--acc), color-mix(in srgb, var(--acc) 78%, #000));
  box-shadow: 0 0.25rem 0 0 color-mix(in srgb, var(--acc) 55%, #000);
}
```

Assign tones so they carry meaning where one exists, and just differ where it doesn't:

- **Meaningful** — difficulty Easy/Medium/Hard → green/amber/red; confidence 1/2/3 →
  red/amber/green; Math → blue, Reading and Writing → pink.
- **Just distinct** — weekdays get seven different tones; SAT dates cycle a tone list
  by index (`toneAt(i)` / `TONES[i % TONES.length]`).

**Selected means filled.** A colored border alone is too weak — fill with the tone's
gradient and flip the text (and any icon/description) to white. Same for pure data
tiles like score readouts: they're always filled, never grey.

Avoid indigo/violet next to blue — it reads as the purple you're trying to get away
from. The year dropdown was moved off indigo for exactly this reason.

## 3. No dimmed text

`--tx2`/`--tx3` vanish against grey surfaces. Collapse them in one move rather than
hunting down each label:

```css
.rush-page, .rush-overlay, .rush-modal { --tx2: var(--tx); --tx3: var(--tx); }
```

`sat.css` does the same under `.sat-grey`. Where a page uses the `tx2`/`tx3` *classes*
instead of the vars, override those too.

## 4. Buttons are filled, or grey — never translucent purple

- Advance → blue `.rush-btn`
- Finish/save → green `.rush-btn.is-green`
- Back / secondary → grey-filled `.rush-btn.is-ghost`
- Tertiary (e.g. "Start over") → small `.rush-mini-btn`, in its own centered row, **not**
  a third full-width button in the `.rush-btn-row` grid

`.rush-btn-row` is a grid, so every child goes full width — put small buttons outside it.
For modal confirms that inherit a washed-out tint (`.goal-modal .delete-modal-btn.confirm`),
override by id with a solid fill (see `#sat-onboarding-save` in `sat.css`).

---

## Step shell

Copy from `study-plan.html` / `rush.html`:

- `.rush-hero` (title + one-line subtitle), `.rush-steps-indicator` dots (color each
  active dot differently; add an nth-child rule per extra step beyond three).
- One `.rush-step` per step, toggled with `x-show`, with a direction-aware slide:
  `anim-out-left/right` for 240ms, then swap and `anim-in-right/left`. Alpine version in
  `study-plan.html` (`goToStep`), vanilla version in `sat-rush.js` (same name).
- `.rush-card-grid.cols-N` + `.rush-stagger` for the option grid.
- Validation shows as a `.rush-hint` banner above the buttons, not grey helper text.
- **Center the first step** — `justify-content: center` + `min-height: calc(100vh - 9.5rem)`
  while on step 1 only; later steps are taller and would jump around.

## Memory-lights flash

While a group is unanswered, its tiles light up on **independent** timers, so several
are lit at once and the pattern never repeats. Lit tiles use the same solid fill as a
selected tile. See `startFlashing`/`scheduleFlash`/`stopFlashing` in `study-plan.html`
(grouped by key, timers keyed `group:index`, all cleared on stop).

Tuning that felt right: stagger 0–900ms, lit 400–750ms, gap 550–1650ms, 200ms fade-in.

## Popups and dropdowns

No `alert()` / `confirm()`, and no native `<select>` (its menu is OS-styled). Reuse the
app's `.delete-modal` / `.delete-modal-content` markup from `korah-chat.css` — see the
`showPlanAlert` / `showPlanConfirm` helpers at the bottom of `study-plan.html`. If a
step needs a picker, prefer a fixed set of tiles over a dropdown.

## Other gotchas

- `[x-cloak] { display: none !important; }` is **not** global — declare it per page or
  `x-show` elements flash before Alpine boots.
- The starfield/shooting-star background is drawn by `initBackground()` inside
  `initSidebar()` (`korah-bot/study/js/sidebar.js`). A page that loads only
  `sidebar-loader.js` gets an empty `#bg-canvas`. Signed-out pages never fire
  `korahReady`, so start it on `korahReady` **or** `load`, whichever comes first.
- Spotlight glow + cursor tilt on these cards: see `docs/SPOTLIGHT-TILT-CARDS.md`.
