# Responsive Design Update Plan
## px → rem migration + layout fixes

---

## 0 · Context

Base font-size: `16px` (browser default, not overridden).  
Conversion: `rem = px / 16`  
Do **not** set `html { font-size: 62.5% }` — it breaks Tailwind and existing rem values.

---

## 1 · Priority Tiers

| Tier | What | Why |
|------|------|-----|
| P1 | Breakpoints — standardize all `px` media queries to `rem` | Inconsistent breakpoints cause jumps at wrong sizes on high-DPI displays |
| P2 | `font-size` px values → rem | Text doesn't scale with user browser preferences |
| P3 | Layout px (padding, margin, gap, width, height) → rem | Spacing breaks at non-16px base |
| P4 | Fixed-width blocks (release.css, korah.css) → `min()` / `clamp()` | Hard wraps on small screens |
| P5 | Inline styles in HTML files | Harder to maintain; overrides responsive styles |

---

## 2 · File-by-File Changes

### 2a · `korah-bot/korah.css` (324 lines)

| Line | Current | Replace with |
|------|---------|--------------|
| 79 | `width: min(680px, 90vw)` | `width: min(42.5rem, 90vw)` |
| 103 | `min-height: 110px` | `min-height: 6.875rem` |
| 107 | `min-height: 80px` | `min-height: 5rem` |
| 141 | `@media (max-width: 1023px)` | `@media (max-width: 63.9375rem)` |

---

### 2b · `korah-bot/app/korah-chat.css` (5,762 lines)

**Font sizes:**

| Line | Current | Replace with |
|------|---------|--------------|
| 4696 | `font-size: 14px` | `font-size: 0.875rem` |
| 4720 | `font-size: 10px !important` | `font-size: 0.625rem !important` |
| 4862 | `font-size: 12px` | `font-size: 0.75rem` |
| 4866 | `font-size: 16px` | `font-size: 1rem` |
| 4882 | `font-size: 14px` | `font-size: 0.875rem` |
| 4887 | `font-size: 12px` | `font-size: 0.75rem` |
| 4899 | `font-size: 24px` | `font-size: 1.5rem` |
| 4903 | `font-size: 12px` | `font-size: 0.75rem` |
| 4908 | `font-size: 11px` | `font-size: 0.6875rem` |

**Layout / sizing:**

| Line | Current | Replace with |
|------|---------|--------------|
| 4220 | `max-height: 200px` | `max-height: 12.5rem` |
| 4708–4709 | `width/height: 14px` | `width/height: 0.875rem` |
| 4726 | `min-width: 140px` | `min-width: 8.75rem` |
| 4780–4781 | `width/height: 10px` | `width/height: 0.625rem` |
| 4860 | `padding: 12px` | `padding: 0.75rem` |
| 4859 | `gap: 8px` | `gap: 0.5rem` |

**Media query breakpoints:**

| Line | Current | Replace with |
|------|---------|--------------|
| 4875 | `@media (max-width: 768px)` | `@media (max-width: 48rem)` |
| 4877 | `margin: 4px 8px 8px` | `margin: 0.25rem 0.5rem 0.5rem` |
| 4878 | `padding: 8px 10px` | `padding: 0.5rem 0.625rem` |
| 4886 | `padding: 8px 10px` | `padding: 0.5rem 0.625rem` |
| 4895 | `padding: 12px` | `padding: 0.75rem` |
| 4907 | `padding: 6px 12px` | `padding: 0.375rem 0.75rem` |

---

### 2c · `korah-bot/sat/sat.css` (3,912 lines)

**Media query breakpoints — convert all px breakpoints to rem:**

| Current | Replace with |
|---------|--------------|
| `@media (max-width: 480px)` | `@media (max-width: 30rem)` |
| `@media (max-width: 768px)` | `@media (max-width: 48rem)` |
| `@media (max-height: 480px)` | `@media (max-height: 30rem)` |
| `@media (min-width: 481px) and (max-width: 768px)` | `@media (min-width: 30.0625rem) and (max-width: 48rem)` |
| `@media (min-width: 769px) and (max-width: 1024px)` | `@media (min-width: 48.0625rem) and (max-width: 64rem)` |
| `@media (min-width: 769px)` | `@media (min-width: 48.0625rem)` |
| `@media (min-width: 1025px) and (max-width: 1279px)` | `@media (min-width: 64.0625rem) and (max-width: 79.9375rem)` |
| `@media (min-width: 1280px)` | `@media (min-width: 80rem)` |
| `@media (max-width: 360px)` | `@media (max-width: 22.5rem)` |

**`min()` width constraints — keep pattern but convert px:**

| Line | Current | Replace with |
|------|---------|--------------|
| 2396 | `width: min(420px, calc(100vw - 2rem))` | `width: min(26.25rem, calc(100vw - 2rem))` |
| 2867 | `width: min(300px, calc(100vw - 2rem))` | `width: min(18.75rem, calc(100vw - 2rem))` |
| 2909 | `width: min(300px, calc(100vw - 2rem))` | `width: min(18.75rem, calc(100vw - 2rem))` |
| 2923 | `width: min(350px, calc(100vw - 2rem))` | `width: min(21.875rem, calc(100vw - 2rem))` |
| 2938 | `width: min(350px, calc(100vw - 2rem))` | `width: min(21.875rem, calc(100vw - 2rem))` |
| 2950 | `width: min(300px, calc(100vw - 2rem))` | `width: min(18.75rem, calc(100vw - 2rem))` |

**max-height constraints — same conversion:**

| Line | Current | Replace with |
|------|---------|--------------|
| 2397 | `min(720px, ...)` | `min(45rem, ...)` |
| 2910 | `min(400px, ...)` | `min(25rem, ...)` |
| 2924 | `min(440px, ...)` | `min(27.5rem, ...)` |
| 2939 | `min(460px, ...)` | `min(28.75rem, ...)` |
| 2951 | `min(500px, ...)` | `min(31.25rem, ...)` |

**Skeleton screen components (lines 3893–3909) — convert all px:**

```css
/* Before */
.skel-stat      { height: 38px; width: 80px; border-radius: 8px; }
.skel-stat-sub  { height: 13px; width: 140px; margin-top: 8px; border-radius: 4px; }
.skel-bar       { height: 7px; margin-top: 16px; border-radius: 8px; }
.skel-skill-row { gap: 10px; padding: 10px 0; }
.skel-skill-name  { height: 13px; }
.skel-skill-sub   { height: 11px; margin-top: 5px; }
.skel-skill-badge { height: 13px; width: 52px; border-radius: 10px; }
.skel-domain-label { height: 12px; margin-bottom: 8px; }

/* After */
.skel-stat      { height: 2.375rem; width: 5rem; border-radius: 0.5rem; }
.skel-stat-sub  { height: 0.8125rem; width: 8.75rem; margin-top: 0.5rem; border-radius: 0.25rem; }
.skel-bar       { height: 0.4375rem; margin-top: 1rem; border-radius: 0.5rem; }
.skel-skill-row { gap: 0.625rem; padding: 0.625rem 0; }
.skel-skill-name  { height: 0.8125rem; }
.skel-skill-sub   { height: 0.6875rem; margin-top: 0.3125rem; }
.skel-skill-badge { height: 0.8125rem; width: 3.25rem; border-radius: 0.625rem; }
.skel-domain-label { height: 0.75rem; margin-bottom: 0.5rem; }
```

**Small icon sizes (px → rem):**

| Line | Current | Replace with |
|------|---------|--------------|
| 2487–2488 | `width/height: 16px` | `width/height: 1rem` |
| 2646 | `width: 12px` | `width: 0.75rem` |
| 2696–2697 | `width/height: 10px` | `width/height: 0.625rem` |

---

### 2d · `korah-bot/release/release.css` (205 lines)

**Fixed-dimension hero block (lines 47–48) — most broken on small screens:**

```css
/* Before */
width: 600px;
height: 600px;

/* After */
width: clamp(18.75rem, 50vw, 37.5rem);
height: clamp(18.75rem, 50vw, 37.5rem);
```

**Icon/avatar sizes:**

| Lines | Current | Replace with |
|-------|---------|--------------|
| 86–87 | `width/height: 140px` | `width/height: clamp(5.5rem, 12vw, 8.75rem)` |
| 97 | `width: 130px` | `width: clamp(5rem, 11vw, 8.125rem)` |
| 128 | `max-width: 440px` | `max-width: 27.5rem` |

**Media query:**

| Line | Current | Replace with |
|------|---------|--------------|
| 205 | `@media (max-width: 640px)` | `@media (max-width: 40rem)` |

---

### 2e · `korah-bot/next/src/components/LogoLoop.css` (∼160 lines)

The `clamp()` values are fine structurally but should use rem internally for consistency:

| Line | Current | Replace with |
|------|---------|--------------|
| 4 | `--logoloop-gap: 32px` | `--logoloop-gap: 2rem` |
| 123 | `clamp(24px, 8%, 120px)` | `clamp(1.5rem, 8%, 7.5rem)` |
| 151 | `clamp(24px, 8%, 120px)` | `clamp(1.5rem, 8%, 7.5rem)` |

---

### 2f-bis · `korah-bot/sat/questions.html` — Ask Korah chat sidebar

The Ask Korah panel is defined inline in `questions.html` (lines ~487–616). It's a fixed-width slide-in panel that pushes the topbar, footer, and main content. Apply the same px → rem rules.

**CSS variable (line 488):**

| Current | Replace with |
|---------|--------------|
| `--ask-korah-w: 420px` | `--ask-korah-w: 26.25rem` |

**Panel chrome — keep `1px` borders, convert other px:**

| Approx. line | Current | Replace with |
|--------------|---------|--------------|
| 509 | `box-shadow: -8px 0 32px rgba(0,0,0,0.18)` | Leave as-is (shadow offsets are visual, not layout) |
| 566 | `width: 88px; height: 88px` (welcome logo) | `width: 5.5rem; height: 5.5rem` |
| 567 | `filter: drop-shadow(0 8px 24px ...)` | Leave (visual shadow) |

**Trigger button (`.ask-korah-trigger`, lines 491–499):** already uses rem for height/padding/radius — leave the `1px` border, no change needed.

**Welcome logo & misc px values:** convert any remaining bare px (88px logo above is the main one). All other dimensions in `.ask-korah-*` rules are already rem.

**Media query (line 610):**

| Current | Replace with |
|---------|--------------|
| `@media (max-width: 768px)` | `@media (max-width: 48rem)` |

**New guidelines for the chat sidebar going forward:**

1. **Use the `--ask-korah-w` variable** for any related layout math (don't hardcode `420px` / `26.25rem` elsewhere). The mobile override already collapses it to `100vw`.
2. **Push, don't overlay** on desktop (≥48rem): the panel offsets `.sat-player-topbar`, `.sat-player-footer`, and `#main-area-wrapper` via the `body.ask-korah-open` class. Any new fixed-position chrome must be added to that selector list or it will sit under the panel.
3. **Full-viewport on mobile** (<48rem): topbar/footer/main are hidden via `display:none` when the panel is open. Don't add elements that need to stay visible behind the open panel on mobile — promote them inside the panel instead.
4. **Suggestion chips** (`.ask-korah-suggestion`) use a pill border (`999px` radius is intentional — keep). Font-size/padding stay in rem so they scale with browser zoom.
5. **Don't reintroduce inline `style="font-size: 14px"` etc. on buttons/spans** inside the panel — use a class or extend the existing `.ask-korah-*` rules. The plan's P5 tier applies here too.
6. **z-index**: panel is `1100`; keep new modals/dropdowns above (`>1100`) or below this if they should be obscured by the panel.
7. **Transitions**: existing `transform .25s ease` on the panel and `right/width .25s ease` on the pushed chrome must stay synchronized. New pushed elements should use the same timing.
8. **Extraction TODO**: this block is large enough that it should eventually move to `korah-bot/app/ask-korah.css` (matches the rest of the SAT player stack). Defer to a follow-up — converting in place first reduces diff risk.

---

### 2f · `korah-bot/index.html` (inline styles)

Inline styles in HTML are the hardest to maintain. Plan: extract them to `korah.css` or a dedicated `index.css` during this pass.

**Key inline font-size violations (move to CSS class, convert unit):**

| Approx. line | Current inline | Action |
|--------------|----------------|--------|
| 109 | `font-size: 10px` | Move to class, use `0.625rem` |
| 113 | `font-size: 13px` | Move to class, use `0.8125rem` |
| 132 | `font-size: 18px` | Move to class, use `1.125rem` |
| 134 | `font-size: 14px; min-width: 140px` | Move to class, use `0.875rem; 8.75rem` |
| 139 | `font-size: 13px` | Move to class, use `0.8125rem` |
| 1106 | `font-size: 18px` (dynamic string) | Switch to CSS class on the `<span>` |

---

## 3 · Breakpoint Standard (apply everywhere)

Adopt one canonical set going forward. Use **only** these:

| Name | rem value | px equiv | Purpose |
|------|-----------|----------|---------|
| `--bp-xs` | `22.5rem` | 360px | Very small phones |
| `--bp-sm` | `30rem` | 480px | Small phones |
| `--bp-md` | `48rem` | 768px | Tablets |
| `--bp-lg` | `64rem` | 1024px | Small laptops |
| `--bp-xl` | `80rem` | 1280px | Desktops |

No more `1023px`, `769px`, etc. — round to nearest standard.

---

## 4 · Execution Order

1. `korah.css` — small file, quick win, sets the pattern
2. `korah-chat.css` — highest user impact
3. `sat.css` — breakpoint standardization pass first, then sizes
4. `release.css` — clamp() conversions
5. `LogoLoop.css` — cosmetic, low risk
6. `index.html` inline styles — extract to CSS last (needs testing)

---

## 5 · What NOT to change

- `border: 1px solid` — 1px borders are intentional (subpixel rendering)
- `box-shadow` pixel values — shadows in rem look identical; leave unless there's a visible issue
- `0px`, `1px`, `2px`, `3px` offsets on transforms/outlines — these are fine as px
- Tailwind utility classes — do not override Tailwind's internal px scale
- CSS variables already in rem (`--sidebar-w`, spacing tokens) — already correct

---

## 6 · Testing Checklist

After each file:
- [ ] Chrome DevTools → viewport set to 360px, 480px, 768px, 1024px, 1280px
- [ ] Browser zoom to 150% and 200% — layout should not break
- [ ] Check sidebar collapse/expand at mobile breakpoint
- [ ] SAT player: verify modal and question panel at each breakpoint
- [ ] Release page: hero block scales without overflow
