# Wizard UI/UX patterns

The pattern for multi-step wizards on the Alpine/HTML pages: a step shell, flat option
cards, and per-option tone colours. It sits on the flat neutral system in
`docs/UI-DESIGN-SYSTEM.md`; read that first for tokens, tones, buttons, modals and motion.
This doc only covers what is specific to wizards.

The older grey colour-blocking version of this pattern (`--sp-sf`, `--rush-sf`, 3D
bottom-edge shadows, spotlight and tilt, filled-not-outlined grey cards) is gone.

Reference implementations:

| File | What it holds |
| --- | --- |
| `korah-bot/sat/rush.html` | The 3-step Practice Rush wizard, then a player view and a celebration view. |
| `korah-bot/sat/sat-rush.css` | The shell (`.rush-step`, `.rush-card`, `.rush-diff`, `.rush-btn`). Also loaded by `study-plan.html` and `tests/question-content.html`, so shared selectors affect those pages. |
| `korah-bot/sat/js/sat-rush.js` | How tones are attached to rendered options (`SUBJECTS`, `DIFFICULTIES`, `TONES`). |
| `korah-bot/sat/study-plan.html` | The 4-step Alpine wizard, memory-lights flash, popups and calendar. Scoped under `.sp-wizard`, which overrides the shared `sat-rush.css` rules. |

---

## 1. Resting and selected states

- Resting option cards are flat: `background: var(--sf)`, `1px solid var(--bd)`, `1rem` radius.
  Never use the purple legacy tokens (`--p4`, `--p5`) or translucent washes.
- Each option carries a tone class that sets `--acc` (text and icon colour) and
  `--acc-fill` (fill). The tone colours the icon and title at rest, so a group of options
  is never one flat colour.
- **Selected = a solid `--acc-fill` with white text.** Not an outline, not a tint. The
  exception is answer choices that contain figures or images (Rush player): use a tone
  ring and a faint tint plus a filled key circle, because images blend badly on a solid
  colour.
- Hover scales (`1.01` to `1.03`) and press scales down. Never translate.
- Text stays at full contrast: use `--tx` for body copy on cards and `--tx2` only for real
  secondary text.

## 2. Buttons

Solid tone fills with white text, `0.5rem` radius. Continue is blue, Start is green, Back is
a ghost button with a `--bd` border, destructive is red. Disabled buttons drop to a
`--sf2` fill with `--tx3` text.

## Step shell

- `.rush-hero` (title and one-line subtitle) and `.rush-steps-indicator` dots. The active dot
  is blue, completed dots are muted.
- One `.rush-step` per step, toggled with `x-show` (or the `hidden` attribute in vanilla),
  with a direction-aware slide: `anim-out-left/right` for 240ms, then swap and
  `anim-in-right/left`. The slide travels about 1.5rem. Alpine version in `study-plan.html`
  (`goToStep`), vanilla version in `sat-rush.js` (same name).
- `.rush-card-grid.cols-N` for the option grid. The entrance is a short fade;
  `.rush-stagger` uses `animation-fill-mode: backwards` so the final `transform: none` does
  not block the hover scale.
- Validation shows as a `.rush-hint` banner above the buttons, not grey helper text.
- Center the first step (`justify-content: center` with a `min-height` while on step 1 only);
  later steps are taller and would jump around.
- Page gutter and width: the same scroller padding as every page, with a centered 46rem
  column.

## Memory-lights flash

While a group is unanswered, its tiles light up on independent timers, so several are lit
at once and the pattern never repeats. A lit tile uses the same solid tone fill as a
selected tile, with no glow. See `startFlashing` / `scheduleFlash` / `stopFlashing` in
`study-plan.html` (grouped by key, timers keyed `group:index`, all cleared on stop).

Tuning that felt right: stagger 0 to 900ms, lit 400 to 750ms, gap 550 to 1650ms, 200ms
fade-in.

## Popups and dropdowns

No `alert()` or `confirm()`, and no native `<select>` (its menu is OS-styled). Reuse the
app's `.delete-modal` / `.delete-modal-content` markup from `korah-chat.css`, restyled by
the page: `rgba(0,0,0,.6)` backdrop, no blur, scale-in from .97. See the `showPlanAlert` /
`showPlanConfirm` helpers at the bottom of `study-plan.html`. If a step needs a picker,
prefer a fixed set of tiles over a dropdown.

## Other gotchas

- `[x-cloak] { display: none !important; }` is not global. Declare it per page or
  `x-show` elements flash before Alpine boots.
- The starfield and shooting-star background is drawn by `initBackground()` inside
  `initSidebar()` (`korah-bot/study/js/sidebar.js`). A page that loads only
  `sidebar-loader.js` gets an empty `#bg-canvas`. Signed-out pages never fire
  `korahReady`, so start it on `korahReady` or `load`, whichever comes first.
- Cards rendered with `innerHTML` (Rush) need the class and inline-style changes made in
  the JS template as well as the CSS.
- Spotlight glow and cursor tilt were removed from the wizards; do not add them back (see
  `docs/SPOTLIGHT-TILT-CARDS.md`).
