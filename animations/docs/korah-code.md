# "Korah CODE" recruiting reel

A 28 second vertical reel (1080x1920, 30fps, H.264 + AAC) for Instagram. 8-bit pixels
assemble, glitch and resolve into a clean paper-cut world: the logo mark, the headline,
a world map, and finally the Korah interface being typed into existence. Everything is
drawn and synthesised in code. No music, no narration.

## Rendering

```
cd animations
npm install                   # first time: @napi-rs/canvas + ffmpeg-static
npm run render:korah-code     # writes korah-code/out/korah-code.mp4
node korah-code/render.js --stills 1.8,6.9,14.0,20.9,27.0   # review PNGs
```

Stills go to `korah-code/frames/`. Pass a folder after the times to write them
somewhere else. A full render takes about fifteen minutes; writing a still is slower than
drawing one, because encoding a grainy 1080x1920 PNG costs several seconds.

## Files

| File | What it does |
| --- | --- |
| `render.js` | Staging, camera, all five beats, export |
| `pixels.js` | Rasterising anything to a pixel grid, and flying those cells into place |
| `typo.js` | Die-cut kinetic type: one baked paper canvas per letter |
| `world.js` | Low-poly continent outlines and the dots plotted on them |
| `paper.js` | Paper helpers: hand-cut edges, grain texture, shadows, easing |
| `timeline.js` | Beat sheet shared by picture and sound |
| `audio.js` | Synthesised sound effects and a small room, written to WAV |
| `assets/fonts` | Plus Jakarta Sans, Medium / Bold / ExtraBold |

`paper.js` is a copy of the one in `doomscroll`. The logo is read from
`korah-bot/logo-images/newlogo12.png`, the Korah CODE mark.

## The original brief

> Clean, minimal paper-cut style with Apple keynote sensibility — crisp die-cut shapes,
> subtle drop shadows, generous negative space, restrained palette (Korah brand colors on
> white/cream). Woven throughout: 8-bit pixel elements that build, glitch, and resolve into
> the smooth paper-cut world, representing code becoming product. Constant smooth movement,
> slow push-ins, parallax layers. No narrator, bold kinetic typography drives pacing. Sound
> design: soft whooshes, mechanical clicks, an 8-bit "blip" sound each time pixels resolve
> into paper-cut shapes. No music.
>
> Beat 1: Pixels settle, logo mark resolves cleanly.
> Text: "Korah CODE: a software engineering internship for high schoolers."
>
> Beat 2: Black/cream screen. Scattered 8-bit pixels flicker and assemble into clean
> die-cut letters: "Join an AI startup."
>
> Beat 3: An 8-bit pixel figure (student silhouette) sits at a desk, pixelated code
> scrolling on a tiny screen. The pixels lift off the screen and swirl outward, resolving
> into a clean paper-cut world map. Glowing dots ripple across it, a cluster pulsing with
> subtle activity animations (typing indicators, live cursors).
> Text: "100,000+ reached online. Hundreds of active users. Growing daily."
>
> Beat 4: The pixel student's tiny 8-bit hands type; each keystroke launches a pixel upward,
> unfolding mid-air into a paper-cut UI element (a button, a card, a chart line), stacking
> into the real Korah interface. Camera pulls back to reveal the pixel student standing
> beside their fully-formed creation, glowing and scaled large.
> Text: "Become part of the team."
>
> Final frame: Cream background, bold clean logo lockup: "Korah Code",
> "Apply now at Korah.app/code"

Extra constraint given with it: export vertical 9:16 for Reels, and do not lean on the
look of the animations already in `animations/`.

## Choices made against the brief

- The title is set "Korah CODE", matching `korah-bot/code/code.html`, not "Korah Code".
- Beat 1's line is split: "Korah CODE" as the headline, "A software engineering internship
  for high schoolers" as the subtitle under it. One sentence at that length cannot be
  kinetic type at reel size.
- Beat 2 is ink, not cream. The brief offers "black/cream"; putting the one dark beat
  between two cream ones is what makes the cut land.
- The three numbers in beat 3 arrive one at a time rather than as one sentence, each
  holding for about 1.3s. Three lines stacked under the map would have to be small.
- The student is seen from behind, over the shoulder, rather than side on at a desk. A
  desk photographed side on leaves half a 9:16 frame empty; stacking monitor, keyboard and
  head up the frame fills it.
- The monitor is not in frame during beat 4. The interface builds in the air where the
  monitor was, so the shot has one subject.

## How the pixel half works

Everything pixelated goes through one function. `rasterize(w, h, cell, draw)` runs a normal
canvas draw at full size, downsamples it to one sample per cell, and keeps the samples that
are solid enough. That gives a list of cells with a colour and a resting position, and the
same list drives three different things:

- `seedField` hands each cell a scatter start, a deterministic seed and an `order` in the
  wave. `drawField` then draws the field at `u` from 0 (scattered) to 1 (landed).
- While a cell is travelling its position is snapped back onto the grid, so the movement
  reads as 8-bit rather than as smooth motion graphics.
- `opt.from` overrides where cells start. The world map's cells start scattered over the
  monitor screen, which is what makes them look like code that lifted off it.
- `opt.swirl` rotates the remaining offset as it shrinks, turning the straight approach
  into a spiral.
- `blit` draws a field at rest. The two student figures are painted as plain ellipses and
  rounded rectangles and then rasterised, so they land on the same grid as everything else
  instead of being hand-authored pixel by pixel.

A resolve is always the same three things on the same frame: the field's `fade` drops to 0,
the clean paper version's alpha comes up, and a soft radial bloom fires over both. The blip
in `audio.js` sits on that frame.

## Type

`typo.js` bakes each letter once into its own small canvas: fill, grain multiplied on top,
then the two offset strokes clipped inside the glyph that `paper.js` uses for its cut edge.
Drawing a line then means drawing a row of little paper cards, so each letter can flick up
on its own beat with its own rotation. `fit()` walks the point size down until a line fits
its column, so no headline has a hand-tuned size in it.

## Style notes

**Palette**

| Use | Colors |
| --- | --- |
| Cream ground | `#f6eddd`, `#efe3ce`, paper `#fdf8ef`, sand `#e6d3ae` |
| Ink (beat 2) | `#0f0b1e`, `#171130` |
| Brand purple | `#8b5cf6`, deep `#6d28d9`, light `#a78bfa`, pale `#e7dcfd` |
| Accent | magenta `#c026d3`, glow `#f0abfc` |
| Text | `#241a3d`, secondary `#6a5a8c` |
| Desk | top `#ead6b6`, far edge `#f6e6cb`, front `#d9bd95` |
| Student | hair `#2b2040`, skin `#f0c49b`, shirt `#8b5cf6`, sleeve `#a78bfa` |
| Code on screen | `#8b5cf6`, `#2dd4bf`, `#8f86a8`, `#e0b0ff` on `#1b1430` |

**Movement**

Every beat is on a slow push-in or pull-back, and the big soft background shapes lag the
camera by 16-36%, so nothing in frame is ever completely still. Beat 4 is the only real
camera move: it pulls from 1.06 to 0.76 while the interface lifts off the desk and scales
up, which is what turns a phone-sized mockup into something the student stands next to.

**Paper-cut look**

Inherited from `paper.js`: every shape is a polygon with its edge points nudged sideways,
each piece gets a tiling grain multiplied over it, and the drop shadows scale with the
camera zoom. Pop-ins use a damped spring with a small overshoot. A UI piece unfolds by
scaling from 0.04 on Y about its own centre, which reads as a flat sheet rotating into view.

**Composition for Reels**

Main action stays between roughly y 380 and y 1450. The bottom fifth and the right edge are
covered by Instagram's caption and buttons, so every text baseline lands above 1450.

**Sound**

All synthesised: band-passed noise whooshes with a swept centre, key-switch clicks (a hard
tick plus a small plastic body), 8-bit blips (a square wave stepping up in pitch), paper
folds, card thunks, and a low sub under each cut. A very quiet room tone runs under the
whole thing so the cuts are not into dead air. Small comb-and-allpass reverb on a send, and
the mix is normalised to about -1 dBFS peak.

## Timeline (seconds)

| Time | Beat |
| --- | --- |
| 0.2 to 1.55 | Pixels sweep in and snap into the logo mark |
| 1.75 | Resolve: pixel mark becomes the clean mark on a paper card |
| 2.05 | "Korah CODE" folds in letter by letter |
| 3.05 | "A software engineering internship for high schoolers" |
| 5.15 to 5.7 | Pixel curtain wipes across to ink |
| 5.95 to 7.15 | Pixels flicker and assemble over the ink |
| 7.15 | Resolve: "JOIN AN / AI STARTUP." in die-cut letters |
| 9.5 to 10.05 | The letters break back into pixels, cream floods in |
| 10.05 | The desk, over the shoulder, code scrolling on the monitor |
| 11.75 | The code pixels lift off the screen and spiral outward |
| 12.95 | Resolve: the paper-cut world map |
| 13.25 | Dots ripple out from the home cluster; typing bubbles and cursors |
| 13.55 / 14.85 / 16.15 | "100,000+" / "HUNDREDS" / "GROWING DAILY" |
| 17.95 to 20.2 | Thirteen keystrokes; seven of them throw a pixel that unfolds into the UI |
| 21.2 | The finished interface lights up |
| 21.45 | Camera pulls back, the student stands up beside it |
| 22.5 | "BECOME PART / OF THE TEAM." |
| 24.5 | Cream paper layers fold in |
| 25.05 to 26.15 | Logo mark, "Korah CODE", "Apply now at korah.app/code" |
| 26.85 | Pixel sparkle, hold to 28 |

## Render gotchas

- `render.js` renders 90-frame chunks in short-lived child processes and pipes them all
  into one ffmpeg, so memory never builds up in one process.
- All three weights of Plus Jakarta Sans register under one family name, so the weight has
  to go in the font shorthand (`800 136px "Plus Jakarta Sans"`), not in the family.
- Canvas shadow sizes are in device pixels, so `paper.js` scales them by the camera zoom
  (`light.k`); `cam()` sets it on every frame.
- `typo.js` caches a canvas per (glyph, font, colour). Changing a headline's colour
  mid-shot doubles that cache, so colour changes are done with `globalAlpha` instead.
