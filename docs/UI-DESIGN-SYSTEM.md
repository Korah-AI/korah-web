# UI design system (flat neutral style)

The house look for every app page, set on the `ui-redesign` branch. Read this before
building a page, a card, a modal or a toast. When this doc and the code disagree, the
code wins: check the files named in each section and fix the doc line.

Reference pages, in order of how cleanly they show the style:

| File | Use it for |
| --- | --- |
| `korah-bot/index.html` | The landing page. The `--ln-*` tokens at the top are the source of the whole palette. |
| `korah-bot/home.html` | The app version: shell, filled tone cards, watermark icons, buttons, onboarding modal. |
| `korah-bot/ap/home.html` and `ap/ap.css` | The page shell and spacing the other pages copy. |
| `korah-bot/app/chat-ui.css` | The chat surface shared by `chat.html` and `sat/math-chat.html`. |
| `korah-bot/app/toast.css` | Toasts. |

## 1. Principles

- **Flat and neutral.** Surfaces are `--bg`, `--sf`, `--sf2` with a hairline `--bd` border.
  No gradients, glows, glass blur, spotlight or tilt scripts, pulsing or shimmer loops,
  gradient text, purple halos, 3D bottom-edge shadows or emoji labels.
- **Colour lives in text, icons and button fills.** Keep it vibrant. A card is neutral
  unless it is a headline stat card, which may be a flat solid tone fill with white text.
- **Sentence case.** No uppercase, no letter-spaced labels. Tight tracking (`-0.02em` to
  `-0.035em`) on headings only.
- **Plain copy.** Direct, no marketing tone, no filler, no em dashes, no exclamation marks
  on routine messages.
- **Scale, never translate.** Hover and press change `transform: scale()`. Sliding lifts
  drag neighbouring alignment and read as a jump.

## 2. Tokens

Defined at the top of `korah-bot/app/korah-chat.css` under `[data-theme="dark"]` and
`[data-theme="light"]`. Every app page loads that file.

| Token | Dark | Light | Use |
| --- | --- | --- | --- |
| `--bg` | `#000` | `#fff` | Page, sidebar and topbar |
| `--bg2`, `--bg3` | `#0a0a0a`, `#121212` | `#fafafa`, `#f4f4f5` | Secondary backgrounds |
| `--sf` | `#121212` | `#fff` | Cards, panels, modals |
| `--sf2` | `#1a1a1a` | `#f4f4f5` | Inputs, chips, meters, tracks |
| `--bd`, `--bd2` | `#242424`, `#1a1a1a` | `#e4e4e7`, `#efeff1` | Borders, subtle borders |
| `--tx`, `--tx2`, `--tx3` | `#fff`, `#8b8b8b`, `#6b6b6b` | `#09090b`, `#6c6c76`, `#9b9ba3` | Text, secondary, muted |
| `--cu` | `rgba(255,255,255,.06)` | `rgba(0,0,0,.05)` | Hover and selected tint |
| `--glow` | `transparent` | `transparent` | Off. Never add halos. |
| `--p4`, `--p5`, `--ac` | purple set | purple set | Legacy brand accent. Do not use in new UI; use blue. |
| `--scroll`, `--scroll-w` | `#fff`, `0.125rem` | `#8b8b94`, `0.125rem` | Scrollbar thumb |

### Tones

A tone is a pair: a bright colour for text and icons, and a fill for buttons and
stat cards. `home.html` defines them under `.korah-grey`:

| Tone | Text (dark) | Text (light) | Fill |
| --- | --- | --- | --- |
| blue | `#60a5fa` | `#1d4ed8` | `#3b82f6` |
| green | `#4ade80` | `#15803d` | `#22c55e` |
| amber | `#fbbf24` | `#92400e` | `#f59e0b` |
| pink | `#f472b6` | `#be185d` | `#ec4899` |
| orange | `#fb923c` | `#c2410c` | `#f97316` |
| teal | `#2dd4bf` | `#0f766e` | `#14b8a6` |
| red | `#f87171` | `#b91c1c` | `#ef4444` |

A card owns one tone through two custom properties, `--acc` (text) and `--acc-fill`
(fill). Everything inside reads from them. Blue is the default and the replacement for
any purple. White text on amber and green fills has weak contrast (about 2:1); keep that
text large and bold, and do not put small body copy on those fills.

## 3. Page shell

```
body > #bg-canvas (stars)  + #sidebar-root
     > #main-area-wrapper > main#main-content
         > header.chat-topbar
         > scroller (flex:1; min-height:0; overflow-y:auto; overflow-x:hidden)
             padding: 1.75rem clamp(1.25rem, 7vw, 7rem) 3.75rem
             > inner wrapper (max-width: 74rem; margin: 0 auto)
```

- **Gutter on the scroller, cap on the inner wrapper.** The scroller (`.home-scroll`,
  `.ap-page`, `.cp-scroll`, `.tailored-scroll`, `.potd-page`, `.rush-page`) carries the
  padding, so the scrollbar stays at the window edge. The inner wrapper caps content at
  74rem. Wizard and reading pages (Rush, POTD, practice tests) keep a centered 46rem
  column with the same gutter. Chat uses a 48rem message column.
- **Rhythm.** Hero block margin-bottom 1.5rem. Section heading 0.875rem, weight 700,
  `margin: 0 0 .875rem`. Card grids gap 1rem, larger two-column panels 1.25rem. Sections
  end with margin-bottom 2.5rem.
- **Stars.** Pages with `<canvas id="bg-canvas">` use `class="fixed inset-0 -z-10
  pointer-events-none"` and `#bg-canvas { background: transparent; }`. The canvas sits
  behind the page like a body background. Never put it at `z-0` with an opaque background:
  it paints over every card and text that has no stacking context, so the page looks dark
  until you hover. The sidebar and topbar stay opaque `--bg`. The question and exam
  players hide the canvas on purpose.
- **Page load flash.** The inline `html:not(.korah-page-ready)` rule uses `#000` and `#fff`.
- **Alpine.** `[x-cloak] { display: none !important; }` is not global; declare it per page.

### Topbar

Defined once in `korah-chat.css` (`.chat-topbar`), so no markup change is needed on a new
page: 4rem tall, `--bg` surface, 1px `--bd` bottom border, a 2.5rem `.sidebar-toggle-btn`
with no border that paints the lucide PanelLeft icon with a CSS mask, a 1px x 1.25rem
divider (the old `.korah-status-dot` element), then the title at 0.875rem, weight 500. Use
`header.chat-topbar` with `#sidebar-toggle` and `#chat-title`. Page actions go in
`.topbar-actions`.

### Sidebar

A React island, not HTML. Source in `korah-bot/sidebar-react/` (start at
`src/KorahSidebar.tsx`), built to the committed `app/sidebar-react.js` and
`app/sidebar-react.css`. After a change run `npm run build:sidebar` from `korah-bot/` and
commit the output. Add a page by adding a `Destination` entry (label, path, icon, accent
pair for dark and light). Rules:

- Destination colour sits on the label and icon only. Rows are neutral with the
  component's quiet hover pill. No filled hover blocks.
- Sentence-case group labels, no tracking.
- It reads and writes the page's Alpine state (`sidebarCollapsed`, `mobileOpen`,
  `activeTab`, `theme`). Keep those names in the page's `<html x-data>`.
- `#chat-history`, `#chat-select-bar`, `#logout-btn` and `#settings-btn` are created once
  and moved into the tree; `study/js/sidebar.js` fills them. Do not rename them.
- The collapsed rail shows only the nav icons.
- `productivity.html` still has its own inline legacy sidebar and the old `.sidebar` CSS in
  `korah-chat.css`. Do not delete that CSS.

## 4. Components

### Cards

- Default: `background: var(--sf); border: 1px solid var(--bd); border-radius: 1rem`.
  Title and icon in the tone text colour. Hover: `scale(1.01)` with a lift shadow
  (`0 .75rem 2rem rgba(0,0,0,.45)` dark, `.12` light).
- **Filled tone card** (headline stats, countdown, focus, momentum, tip, result cards):
  `background: var(--acc-fill)`, border the same, all text `#fff`, buttons inside invert to
  white with fill-coloured text. Set `--acc: #fff; --tx: #fff; --tx2: #fff` on the card so
  child rules that read those variables turn white. A per-card tone rule that sets `--acc`
  at the same specificity will win, so raise the specificity of the filled rule
  (`.korah-grey.korah-grey .stat-card`).
- **Corner watermark:** a Material icon at 5.5rem, `rgba(255,255,255,.25)`, absolute at the
  bottom-right, behind the content (`.card-watermark`; siblings get `position: relative;
  z-index: 1`).
- Selected option cards (wizards, choices): a solid tone fill with white text.

### Buttons

Solid tone fill, white text, `border-radius: .5rem`, height 2.25 to 2.5rem, weight 600.
Hover `scale(1.03)` plus `brightness(1.12)`, press `scale(.98)`. On a filled card the
button is white with fill-coloured text. Ghost buttons use a `--bd` border and fill with
`--cu` on hover. Primary actions are blue unless the page has a stronger tone (green for
"Start", red for destructive).

### Inputs and chips

Inputs: `--sf2` background, `--bd` border, `.5rem` radius. Focus: tone border and a 3px ring
`color-mix(in srgb, <tone> 22%, transparent)`. Chips: `.5rem` radius, `--sf` with `--bd`,
tone-coloured text.

### Modals

Backdrop `rgba(0,0,0,.6)` with no blur. The card is `--sf` with a `--bd` border, `.875rem`
radius, shadow `0 .75rem 2rem rgba(0,0,0,.45)`. Open with a fade plus `scale(.97)` to 1
over .16 to .18s using `cubic-bezier(.23,1,.32,1)` (`@keyframes modalIn` in
`korah-chat.css`). No spring overshoot, no `translateY` slide. Use the existing
`.delete-modal` markup for confirm, rename and alert popups; never `alert()` or `confirm()`.
The settings and logout modals use the blue tone for accents and red for danger.

### Toasts

One component, `korah-bot/app/toast.css`. Link it on any page that shows a toast.

```html
<div class="k-toast k-toast--info" role="status">
  <span class="k-toast__icon material-icons-round" aria-hidden="true">info</span>
  <div class="k-toast__body">
    <div class="k-toast__title">Title</div>
    <div class="k-toast__desc">One or two lines of description.</div>
  </div>
  <button class="k-toast__close" aria-label="Dismiss"><span class="material-icons-round">close</span></button>
</div>
```

- Variants: `--success` (`check_circle`), `--info` (`info`), `--warning` (`warning`),
  `--error` (`error`). The icon takes the variant colour.
- A toast is hidden until JS adds `.is-visible` or `.show`. Position (fixed, offsets,
  z-index) belongs to the page; the component only styles the card.
- A toast that carries the Korah logo uses `<img class="k-toast__logo">` instead of the
  icon (drop toasts, guest signup, fix notices).
- A call to action inside a toast is `.k-toast__cta` (solid blue).
- `guest-gate.js` injects `toast.css` itself when it builds the signup toast.

### Dropdowns and toggles

Dropdowns follow the shell in `korah-bot/CLAUDE.md` (grows from the trigger, `.is-open`
class, accent bar on the option). Panel surface is `--sf`, no blur. Toggles: a solid grey
track (`color-mix(in srgb, var(--tx) 22%, var(--sf2))`) that turns the tone fill when on.

### Progress and charts

Tracks are `--sf2` with a solid tone fill, no gradient, glow or shimmer. Charts use the
tone palette with flat bars, neutral gridlines and flat tooltips. Stat colours stay
consistent across a page (for example Reading and Writing is blue, Math is green).

## 5. Motion

| Interaction | Value |
| --- | --- |
| Hover, press | `transform: scale()`: cards 1.01, buttons 1.03, small icons 1.05 to 1.08; press .97 to .98 |
| Duration and curve | .16 to .2s, `cubic-bezier(.23, 1, .32, 1)` |
| Modals, popovers | fade plus `scale(.97)` to 1 |
| Entrances | a short fade, with `animation-fill-mode: backwards` so the final `transform: none` does not block the hover scale |
| Reduced motion | respect `prefers-reduced-motion` for anything that loops or slides |

`translate` is fine for positioning (centering) and for step slides in wizards. It is not
a hover effect. Do not add pulse, shimmer, breathing or glow loops. The one loop in the app
is the chat thinking indicator.

## 6. Scrollbars

Global thin scrollbar in `korah-chat.css`: a 2px thumb in `--scroll`, transparent track,
hidden until the container scrolls. `korah-bot/app/scroll-fade.js` (loaded by
`sidebar-loader.js`) adds `.is-scrolling` to the element that scrolled and removes it after
2 seconds; the CSS reads it through `--scroll-cur`. Chrome ignores `::-webkit-scrollbar`
sizing when `scrollbar-width` or `scrollbar-color` is set, so those properties are only set
inside `@supports not selector(::-webkit-scrollbar)` for Firefox. Do not set them anywhere
else. A page that adds its own scrollbar rule opts out of the fade.

## 7. Chat surface

`chat.html` and `sat/math-chat.html` both load `app/chat-ui.css` last. It styles messages,
markdown, the composer, the welcome screen, the mode dropdown, topbar buttons, toasts and
modals, and makes the wrappers transparent so the stars show. The send button is a solid
blue circle. The welcome screen uses `.sat-prompt-list` / `.sat-prompt-row` quick prompts
(`.quick-prompt-btn`, `data-prompt`, `data-requires-auth`); both controllers send the
prompt on click. The thinking indicator is `.thinking-indicator` with
`.thinking-shimmer-text` ("Cooking up."), built in `app/korah-chat.js` and
`sat/math-chat.js`; the timers must be cleared on the first chunk, on error and in a
`finally`. `sat-math.css` keeps only the split layout, graph panel and resize handle.

## 8. Copy

Sentence case buttons, labels and headings. Direct wording ("Pick a subject to start
practicing"). No exclamation marks on routine UI text. No em dashes.

## 9. New page checklist

1. Copy the shell from `ap/home.html` or `home.html`: topbar, scroller gutter, inner
   wrapper, `#sidebar-root`, `-z-10` canvas, pre-ready flash colours `#000` and `#fff`.
2. Use only the tokens and tones above. Search your CSS for `gradient`, `box-shadow` with
   a colour, `blur(`, `translateY`, `uppercase`, `letter-spacing`, `--p4`, `--p5` and
   `#8b5cf6` before you finish.
3. Cards flat, buttons solid tone fills, modals and toasts from the components above.
4. Check dark and light, a 768px width, and the collapsed sidebar. There is no local
   preview, so commit and check the deployed site.
5. Wizards: `docs/WIZARD-UI-PATTERNS.md`.

## 10. Known leftovers

- Pages scoped to the old system (`.sat-grey`, `.sp-wizard`, `.korah-grey`) were restyled
  in place; some of those class names remain even though the grey colour blocking is gone.
- `app/korah-chat-grey.css` and the dead `.ap-qb-*` rules in `ap/ap.css` are unused and
  still hold old styles.
- The question players (`sat/questions.html`, `ap/practice.html`, `ap/mcq-player.html`,
  `sat/practice-test/player.html`) keep their own player chrome with the new tokens but no
  stars.
- `ap/ask-korah.css` (the Ask Korah panel on `mcq-player.html`) still has a purple
  gradient and 3D shadows.
- `korah-bot/UI-UX.md` still describes the old glass and purple look in its component
  catalogue.
