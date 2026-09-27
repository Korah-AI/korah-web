# "You're Not Cooked" reel

A 24 second vertical reel (1080x1920, 30fps, H.264 + AAC) for Instagram. A pixel-art
student bombs a practice test, opens Korah SAT, the score climbs, the room warms up, and
it ends on "You're Not Cooked. Visit Korah.app". Everything is drawn and synthesized in
code. There is no narration and no opening title.

## Rendering

```
cd animations
npm install                  # first time: @napi-rs/canvas + ffmpeg-static
npm run render:not-cooked    # writes korah-not-cooked/out/korah-not-cooked.mp4 (about 4 min)
node korah-not-cooked/render.js --stills 2,10,13.3,17,23   # review PNGs, a few seconds each
```

Stills go to `korah-not-cooked/frames/`. Pass a folder after the times to write them
somewhere else. The whole `animations/` folder is in the root `.gitignore`.

## Files

| File | What it does |
| --- | --- |
| `render.js` | Scene layout, camera, lighting, Korah pop-ups, end card, export |
| `student.js` | Pixel student rig, rasterized on an 8px grid each frame |
| `screen.js` | Laptop display: test app, score report, dock, Korah SAT app |
| `paper.js` | Paper helpers: hand-cut edges, grain texture, shadows, easing |
| `timeline.js` | Beat sheet shared by picture and sound |
| `audio.js` | Synthesized sound effects and a small reverb, written to WAV |
| `assets/` | Fonts and the Korah idle sprite sheet |

The end card logo is read from `korah-bot/logo-images/newlogo2.png`. The sprite sheet is
a copy of `korah-bot/ui-components/korah-sprite/korah_idle_sheet_v2.png`.

## The original brief

> Paper-cut style animation with warm, textured paper layers and soft directional
> lighting. A 16-bit pixel-art student sits at a cluttered desk, hunched over a MacBook,
> surrounded by crumpled practice tests and a coffee cup. Their SAT score glows dimly on
> screen: a discouraging number. Gentle mechanical sound effects (paper rustling, soft
> keyboard clicks, a faint sigh) underscore their frustration.
>
> They open Korah SAT on their laptop. The screen warms from cold blue to golden orange.
> Paper-cut elements animate in: practice questions lift and fold into place, a progress
> bar unfurls like a paper ribbon, the student's posture straightens. Their score ticks
> upward with a soft chime. The room brightens, clutter fades, and the student leans
> back, relieved, coffee now steaming pleasantly beside them.
>
> Final frame: the screen fades to a warm cream background. Bold, hand-lettered-style
> text folds in like paper: "You're Not Cooked." Below it, smaller: "Visit Korah.app"
>
> Smooth, slightly bouncy movement throughout (think stop-motion charm, not stiff
> transitions). Color palette: warm creams, soft oranges, muted browns, with the Korah UI
> as a bright accent.

Extra constraints given with it: separate `animations` folder at the repo root, built
entirely with code, vertical 1080x1920 MP4 for Reels, main action centered, review the
animation and fix visible problems before exporting.

## Revisions requested after the first cut

1. The test screen should look like the Bluebook app (reference screenshot): section
   title, timer with a Hide pill, Annotate and More, the dashed divider with yellow and
   blue flecks, passage on the left, numbered question with Mark for Review and A to D
   answer boxes on the right, black "Question X of 27" pill and a blue Next button. A
   minimal version is fine. Korah UI stays as it was.
2. "Remove any monospace font": nothing was actually monospace. The serif used for the
   passage and choices read as typewriter text at that size, so everything on the test
   screen moved to Plus Jakarta Sans.
3. The dashed divider only goes along the top. The short one under Mark for Review stays.
4. End card: Korah logo to the right of "Korah.app", first `newlogo0.png`, then swapped
   to `newlogo2.png` (the mascot reading a book).
5. The study plan ribbon is yellow instead of purple. Its text went dark brown so it
   stays readable.
6. The score screen should look like a desktop version of the College Board score report
   (reference screenshot), with the score emphasized in the middle: white "Your Score
   Reports" bar, blue "Your Latest Test" banner, centered white card with TOTAL SCORE,
   a large 1040, "400 - 1600", section scores, and the two buttons.

## Prompting notes

- Reference screenshots got the closest results. "Make it look like this, minimal
  version" was enough to match a real product UI without copying its content.
- Name the feeling as well as the thing. "Emphasizing the score in the middle of the
  screen" changed the layout more than the screenshot alone would have.
- Words like "monospace" or "loader" can mean something different from what is on
  screen. Pointing at the element ("the passage text", "the study plan bar") avoids a
  guess.
- The brief's split into beats (struggle, open Korah, payoff, end card) mapped directly
  onto the timeline, which made later edits easy to place.
- Stating the delivery target up front (Reels, vertical, centered action) shaped the
  whole composition: the Korah pieces pop up above the laptop to fill the tall frame.

## Style notes

**Palette**

| Use | Colors |
| --- | --- |
| Wall and paper | `#ecd6b2`, `#e6cda6`, `#f8eddb`, `#fbf4e6` |
| Soft oranges | `#ea9a5b`, `#e8893f`, `#e39459`, `#ec8a3c` |
| Browns | `#c8905f` desk top, `#9a6743` desk front, `#8a5a3b`, `#6f4a3a` chair |
| Korah accent | `#7c3aed`, `#8b5cf6`, `#a78bfa`, `#f0abfc` |
| Study plan ribbon | `#f2b705` to `#ffd84d` |
| Night tint and screen glow | `#56629a` multiply, cold glow `#7f9ee6`, warm glow `#ffb347` |
| Test app | ink `#1b1b1b`, blue `#2f4fd1`, score report banner `#3a4ec0` |

**Paper-cut look**

- Every shape is a polygon with its edge points nudged a little, so edges look cut by hand.
- Each piece gets a tiling grain texture multiplied on top (noise plus fibers).
- Light comes from the upper left. Shadows fall down and to the right and grow with the
  piece's height off the page. A thin light line on the top-left edge and a dark line on
  the bottom-right edge sell the paper thickness.
- The wall sits on a slower parallax layer than the desk, so camera moves feel like a
  diorama.

**Pixel student**

- Built from a small bone rig (torso curve, head, two-bone arms with IK) and rasterized
  to a 76x84 grid at 8px per pixel, with a 1px dark outline, a shade band on the
  bottom-right and a highlight on the top-left.
- Animates on twos (15fps) for sprite feel while the rest of the scene moves at 30fps.
- Wrapped in a cream paper "sticker" border with a drop shadow so it sits in the paper
  world.
- The side of the face toward the laptop picks up the screen color, blue then golden.
- Poses: hunched typing, head in hand during the sigh, clicking the trackpad, upright
  typing, leaning back with a hand on the chest.

**Motion**

- Pop-ins use a damped spring with a small overshoot. Folds hinge on one edge and darken
  while they are tilted away from the light.
- The Korah score badge and study plan track rise from behind the laptop lid like a
  pop-up book, on paper struts.
- End card letters fold up from their baseline one at a time, then jitter slightly at
  8fps for a stop-motion feel.

**Type**

- Luckiest Guy for the end card and the handwritten notes on the corkboard.
- Plus Jakarta Sans (Korah's site font) for all UI text and "Visit Korah.app".

**Composition for Reels**

- Main action stays between roughly y 550 and y 1500. The bottom fifth and the right
  edge are covered by Instagram's caption and buttons, so nothing important lives there.
- Camera: close on the student at the start, pushes in and tilts up when Korah opens,
  pulls back to the full room for the morning reveal.

**Sound**

- All synthesized: key clicks (filtered noise and a low thock), paper crackle and
  "fwip" folds, a breathy sigh through moving formant filters, ticks as the score counts,
  and a two-note bell chime when it lands.
- A very quiet room tone runs under the scene. A small comb and allpass reverb sits on a
  send. The mix is normalized to about -1 dBFS peak.

## Timeline (seconds)

| Time | Beat |
| --- | --- |
| 0 to 1.6 | Student flips between answers on the last question, presses Next |
| 1.85 | Score report shows 1040 |
| 2.95 | Sigh, head drops into hand, a test sheet slips |
| 4.6 | A crumpled test rolls off the stack and bounces on the floor |
| 6.0 to 6.65 | Cursor goes to the bottom, dock slides up, Korah icon clicked |
| 7.15 | Korah window grows out of the icon, screen warms |
| 8.2 to 9.3 | Question cards fold in and get checkmarks |
| 8.55 | Score badge pops up above the laptop |
| 9.2 to 10.8 | Study plan ribbon unrolls |
| 10.3 to 13.0 | Score ticks from 1040 to 1450, chime and confetti at 13.0 |
| 13.6 to 15.3 | Camera pulls back to the whole room |
| 14.0 to 16.4 | Night turns to morning, clutter folds away |
| 14.9 | Student leans back relieved, coffee starts steaming |
| 18.2 to 19.2 | Fade to cream |
| 19.35 | "YOU'RE NOT COOKED." folds in letter by letter |
| 21.1 | "Visit Korah.app" tag with the logo folds down, soft chime |

## Render gotchas

- A single long render process on this 8GB Mac was force-killed about 9 seconds into
  the video. `render.js` now renders 90-frame chunks in short-lived child processes and
  pipes them all into one ffmpeg.
- ffmpeg sometimes prints "Truncating packet of size 8294400 to 65536" at the start.
  Checked frames from the output were fine.
- Canvas shadow sizes are in device pixels, so `paper.js` scales them by the camera
  zoom (`light.k`).
