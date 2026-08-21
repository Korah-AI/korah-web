# Spotlight + Tilt Cards (vanilla)

A cursor-following **spotlight glow** and a 3D **cursor tilt** for card surfaces, in
plain CSS + JS. This is a vanilla port of the React `spotlight-card/` component,
extended with a tilt effect, for use in the non-React pages (Alpine/HTML).

Reference implementation: `korah-bot/sat/rush.html` (JS) + `korah-bot/sat/sat-rush.css`
(CSS, search "Spotlight card effect").

Both effects are driven from **one delegated pointer handler** on `document`, so they
survive `innerHTML` re-renders and need no per-element wiring.

---

## How it works

- **Spotlight** — a `::before` overlay on each card paints a `radial-gradient` whose
  center + opacity come from CSS custom properties. JS updates those vars from the
  cursor position. The glow paints *on top* of the (translucent) content, matching the
  original component.
- **Tilt** — JS sets an inline `transform: perspective() rotateX() rotateY() scale()`
  computed from where the cursor sits inside the card. The card's existing
  `transition: transform ...` eases it smoothly and returns it flat on leave.

---

## CSS

Apply to whatever card classes you want glowing. The cards need `position: relative`
and `overflow: hidden` (so the glow clips to the rounded corners).

```css
/* Cards that get the spotlight */
.my-card {
  position: relative;
  overflow: hidden;
}
.my-card::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;          /* never eat clicks */
  z-index: 0;
  opacity: var(--spotlight-opacity, 0);
  transition: opacity 0.5s ease-in-out;
  background: radial-gradient(
    circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%),
    var(--spotlight-color, rgba(85, 167, 235, 0.25)),   /* glow color */
    transparent 80%
  );
}

/* Tilt needs a transform transition for the smooth follow + reset.
   (Most cards already have one for hover.) */
.my-card {
  transition: transform 0.18s cubic-bezier(0.22, 1, 0.36, 1);
}
```

## JS

Drop this once per page (e.g. at the end of `<body>`). Adjust the two selectors and
`MAX_TILT`.

```html
<script>
  (function () {
    // Cards that get the spotlight glow.
    var SPOTLIGHT_SELECTOR = ".my-card";
    // Subset that also tilt. Omit large/interactive surfaces you read or click into
    // (e.g. a question card), where tilt hurts usability.
    var TILT_SELECTOR = ".my-card";
    var MAX_TILT = 7; // degrees

    document.addEventListener("pointermove", function (e) {
      var card = e.target.closest && e.target.closest(SPOTLIGHT_SELECTOR);
      if (!card) return;
      var rect = card.getBoundingClientRect();
      var relX = e.clientX - rect.left;
      var relY = e.clientY - rect.top;

      // Spotlight follows the cursor.
      card.style.setProperty("--spotlight-x", relX + "px");
      card.style.setProperty("--spotlight-y", relY + "px");
      card.style.setProperty("--spotlight-opacity", "0.6");

      // Tilt toward the cursor. See the !important note below.
      if (card.matches(TILT_SELECTOR)) {
        var rotY = ((relX / rect.width) - 0.5) * 2 * MAX_TILT;
        var rotX = (0.5 - (relY / rect.height)) * 2 * MAX_TILT;
        card.style.setProperty("transform",
          "perspective(700px) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" +
          rotY.toFixed(2) + "deg) scale(1.02)", "important");
      }
    }, { passive: true });

    document.addEventListener("pointerout", function (e) {
      var card = e.target.closest && e.target.closest(SPOTLIGHT_SELECTOR);
      if (!card) return;
      // Only reset when the pointer truly leaves the card (not moving to a child).
      if (e.relatedTarget && card.contains(e.relatedTarget)) return;
      card.style.setProperty("--spotlight-opacity", "0");
      card.style.removeProperty("transform"); // eases back flat via the transition
    }, { passive: true });
  })();
</script>
```

---

## Gotchas (read before debugging)

### Tilt lags / feels "blocky" following the cursor
If the tilt trails behind fast mouse movement (worst case: it only snaps into place
~a second *after* you stop moving), the transform is being **transitioned**. With a
`transition` on `transform`, every `pointermove` sets a new target the card only eases
*toward* — while you keep moving it never arrives, so it perpetually chases the cursor.
A slow-start timing function (`ease`, the CSS default) makes this dramatic; heavy
`backdrop-filter: blur()` on the card compounds it by dropping frames (the "blocky"
feel). Note `transition: all` includes `transform`, so it hits this too.

Fix — set the tilt **instantly** each frame and ease **only the reset**:

```js
// on pointermove (tilt): no transform transition => tracks the cursor 1:1
card.style.setProperty("transition", "transform 0s, border-color .2s, box-shadow .2s", "important");
card.style.setProperty("transform", tiltValue, "important");

// on pointerout: ease the return to flat
card.style.setProperty("transition", "transform .3s cubic-bezier(0.22, 1, 0.36, 1), border-color .2s, box-shadow .2s", "important");
card.style.removeProperty("transform");
```

Also add `will-change: transform` to the tilted cards so the compositor keeps them on
their own layer. (rush.html gets away with a steady `transition: transform 0.18s`
because its cards are light; on the blurred dashboard/home cards, go transition-less.)

### The tilt won't apply if the card has a `forwards` entrance animation
This is the big one. If a card (or its container) runs a CSS `animation` with
`animation-fill-mode: forwards` that touches `transform` — e.g. a staggered
`from { transform: translateY(1rem) } to { transform: none }` reveal — then the
filled animation **keeps applying `transform: none` at a higher cascade priority than
a plain inline style**. A normal `card.style.transform = "..."` is silently ignored
(and so is any `:hover` transform on that card).

Cascade priority, low → high: normal author → **CSS animations** → **author `!important`**
→ CSS transitions. So the fix is to set the tilt with `!important`:

```js
card.style.setProperty("transform", value, "important"); // beats the animation
card.style.removeProperty("transform");                  // note: `= ""` can't clear !important
```

The reference JS above already does this. If your cards have **no** such animation, a
plain `card.style.transform = value` works too — but using `!important` is harmless and
future-proof.

### Reset must use `removeProperty`
Setting `card.style.transform = ""` does **not** clear a value that was set with
`!important`. Use `card.style.removeProperty("transform")`.

### Content sits under the glow
The `::before` paints over the card content (faithful to the original component). The
gradient is translucent and fades to `transparent 80%`, so text stays readable. If you
need content strictly above the glow, give the content a wrapper with
`position: relative; z-index: 1` (a bare text node can't be raised — it needs an
element). Note: with a `forwards` transform animation on the card, wrapping is often
the cleaner route than fighting the cascade.

### `overflow: hidden` and drop shadows
`overflow: hidden` clips the glow to the border radius but does **not** clip the card's
own `box-shadow` (shadows render outside the box), so 3D/offset shadows are unaffected.
It *will* clip children that animate outside the box (e.g. a row that slides on hover) —
usually fine within card padding.

---

## Tuning

| Knob | Where | Effect |
|------|-------|--------|
| `--spotlight-color` | CSS `::before` (or set inline per card) | Glow color/intensity. e.g. `rgba(0, 229, 255, 0.2)` for cyan |
| `0.6` opacity | JS `--spotlight-opacity` on move | Glow strength on hover |
| `transparent 80%` | CSS gradient | Glow radius/falloff |
| `0.5s` | CSS `::before` transition | Fade in/out speed |
| `MAX_TILT` | JS | Max tilt angle (deg). ~4–10 is a good range |
| `perspective(700px)` | JS transform | Lower = more dramatic perspective |
| `scale(1.02)` | JS transform | Hover lift/pop |
```
