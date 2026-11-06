# Spotlight and tilt cards (removed)

The cursor-following spotlight glow and 3D cursor tilt for cards was removed from the app in
the flat redesign. Do not add it to new cards.

Why: it ran a `pointermove` handler over every card, set inline transforms that fought the
hover scale and the entrance animations, and the glow and tilt clash with the flat neutral
style in `docs/UI-DESIGN-SYSTEM.md`. Cards now get a `scale(1.01)` hover with a lift shadow.

Where it used to live, if you meet leftovers:

- `home.html`, `sat/rush.html`, `sat/study-plan.html`, `sat/dashboard.html` and
  `college-prep/index.html` had a delegated `pointermove` script and `::before` overlays
  driven by `--spotlight-x`, `--spotlight-y` and `--spotlight-opacity`. The scripts are
  commented out in place with "Replaced by" notes and the CSS is gone.
- `ap/ap.css` had a spotlight `::before` on `.ap-exam-card`; it is removed.
- The React `spotlight-card` component under `korah-bot/ui-components/` is untracked and
  unrelated to the live pages.

The earlier vanilla implementation is in git history (search for "Spotlight card effect" in
`sat/sat-rush.css`) if it is ever needed for something that is not an app card.
