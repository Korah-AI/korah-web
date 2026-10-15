# Parabola-b Desmos reel: source analysis and what is specific to it

A 42 second vertical reel (1080x1920, 30fps, H.264 + AAC) made from a @korah.ai video where
a hard SAT problem is solved in Desmos with a slider. Same format as the y-intercept reel:
the source's narration and Desmos footage, restaged on a paper page with a virtual camera.

Read `y-intercept.md` first. It holds the shared style, the palette, the camera rules, the
sound levels and the process. This doc only covers what is different here.

## Rendering

```
cd animations
npm run render:parabola-b     # writes parabola-b/out/parabola-b.mp4 (about 2.5 min)
node parabola-b/render.js --stills 1,9.1,23,27,35,38.2,41.9 [dir]
```

## The problem

> In the xy-plane, a line with equation 2y = 4.5 intersects a parabola at exactly one point.
> If the parabola has equation y = −4x² + bx, where b is a positive constant, what is the
> value of b?

Answer: b = 6. It is a free-response question, so there are no answer choices and no table.
The problem text came from the image the user supplied, which matches the source frame
exactly.

## The source video

`assets/source.mp4`: recorded 1280x720 with a `rotation=-90` display matrix, so ffmpeg
serves it as 720x1280. 30fps, 42.0746s, AAC 44.1 kHz stereo. 1262 video frames.

- Layout: black above y 254, problem panel y 254 to 626, burned-in captions centred around
  y 496, Desmos window y 627 to 1030 (full width), black below y 1031.
- The Desmos crop is 720x404, the same size as the y-intercept source, but 7 px higher.
- Regions inside the crop: top bar y 0 to 37, expression panel x 0 to 274, graph x 274 to
  720. (The y-intercept's panel was 270 wide and its bar 35 tall.)
- The burned-in captions agree with the audio throughout. The only doubtful word is the
  brand: the transcript hears "Quora AI", and it is written "Korah.ai".

**Desmos events (seconds)**, from colour-pixel counts in the graph region and panel diffs:

| Time | Event |
| --- | --- |
| 20.9 | row 1: "2y = " being typed |
| 21.3 | "2y = 4." commits, the horizontal line appears |
| 22.0 | "2y = 4.5" finished, row 2 created |
| 23.9 | row 2: "y = −4" typed |
| 24.8 | "y = −4x²", red parabola on the graph |
| 26.0 | "+" typed, the parabola disappears while the expression is incomplete |
| 26.6 | "b" typed, the "add slider: b" chip appears |
| 27.0 | "bx" typed, warning triangle on row 2 |
| 29.17 | slider added at b = 1, the parabola comes back |
| 29.5 to 31.5 | slider dragged, b runs 1 to 6.2 |
| 32.7 to 33.7 | b eased back and settles on exactly 6 |
| 34.8, 35.2 | the intersection point is clicked; the (0.75, 2.25) label flickers, then stays |
| 35.2 to 42.07 | held |

Panel rows in crop coordinates: row 1 at y 99, row 2 at y 145 to 175 (taller when it is
selected and shows the slider chip), the slider row's value at y 196 and its track at y 222.
The tangency point sits at crop (456, 74) and its label spans x 465 to 580, y 82 to 108.

## Page layout

No table and no choice list, so the card is shorter (980 x 980) and the question is split
into five blocks, each its own blur group: three text blocks with the two inline equations
pulled out as centred display equations between them, then the answer.

| World y | Content |
| --- | --- |
| 150 | header bar (Math / Difficulty: Hard) |
| 322 | "In the xy-plane, a line with equation" |
| 436 | 2y = 4.5 |
| 556, 614 | "intersects a parabola at exactly one point. If the parabola has equation" |
| 728 | y = −4x² + bx |
| 846, 904 | "where b is a positive constant, what is the value of b?" |
| 1006 | b = 6, written in at the end |

The Desmos window sits at world y 1170, 1000 px wide (`DES.s = 1000 / 720`).

`drawRuns` gained a superscript style (`sup()`, roman at 0.62 size raised by 0.36 em) for
the exponent in −4x².

## Hand-made marks

The brief for this video asked for the emphasis to look drawn by hand, so the reference's
thin yellow underline and flat red became actual marks:

- **Highlighter** (`swipe`): three overlapping translucent passes of `rgb(253,222,86)` with
  round caps, 38, 16 and 14 px wide at three different heights, so the ink builds up
  unevenly and the edges stay ragged. It is drawn behind the type, so the words stay crisp.
  The marks stay on the page once made, like a real highlighter, and the end shot shows all
  three.
- **Ballpoint underline** (`penLine`): a firm 4.4 px pass and a lighter 2.2 px second stroke
  under each display equation, with a little overshoot at both ends. These also stay, while
  the red in the equation itself fades back to black.
- **Answer** (`drawAnswer`): "b = 6" in Marker Felt 76px (`/System/Library/Fonts/MarkerFelt.ttc`)
  in red, then a ring in two passes that goes a little past where it started.

Every stroke's wobble is a function of its own parameter (`Math.sin(u * 11 + dy)`), never of
a random draw, and the progressive reveal is a rectangular clip. Drawing a jittered polyline
whose segment count depends on how much of it is revealed makes the mark shimmer from frame
to frame; clipping a fixed path does not.

## Camera

The header bar (`Math` / `Difficulty: Hard`) is a normal blur group here, not a permanently
soft one. The y-intercept reel kept it out of focus in every shot, copying the reference's
shallow depth of field, which reads as a rendering fault on the opening wide shot where
everything else on the card is sharp. It is sharp at `wide` and blurred in every pushed-in
shot, like the other groups. Its two labels are set in the caption face (Plus Jakarta Sans
Bold, 29px and 26px) rather than the Times used for the question, so the Bluebook strip
reads as chrome instead of as more of the problem.

| Time | Shot | Zoom | In focus |
| --- | --- | --- | --- |
| 0 | wide | 1.02 | whole card, header included (card rises in) |
| 5.0 | intro | 1.2 | first line and the equation under it |
| 8.7 | eq1 | 1.6 | 2y = 4.5, red, pen underline drawn |
| 10.4 | body | 1.15 | second block and the equation under it |
| 14.5 | eq2 | 1.55 | y = −4x² + bx, red, pen underline drawn |
| 17.6 | ask | 1.2 | "where b is a positive constant, what is the value of b?" |
| 20.5 | desmos | 1.0 | window slides up and lands at 21.3, card blurred |
| 24.0 | panel | 2.25 | rows 1 and 2 while y = −4x² + bx is typed, then the slider chip |
| 29.2 | slider | 2.1 | the slider row at b = 1 |
| 30.5 | graph | 1.7 | the parabola narrowing onto the line |
| 34.6 | touch | 2.1 | the single intersection and its (0.75, 2.25) label |
| 37.0 | answer | 1.45 | b = 6 written in red marker, then ringed |
| 39.2 | end | 0.97 | the whole page and the graph, answer above the tangency point |

The `desmos` shot is framed by its bottom edge (`frame(540, DES.y + DES.h, 1.0, 1415)`) so
the window lands just above the caption. Framing that shot on the window's centre, as the
y-intercept did, leaves about 700 px of bare page under the caption.

`end` is framed on the tangency point at screen y 1230 and zoom 0.97, which fits the card
top, the answer and the whole Desmos window into one frame.

## Sound

Same synthesized effects as the y-intercept, plus a felt-tip drag under each highlighter
swipe, a shorter scratch under each pen underline, and a squeak plus a tick for the answer
and its ring. Effects sit 20 to 25 dB below the narration RMS in their own windows, with
peaks between −19 and −28 dBFS.

**New gotcha:** this source's audio is mastered right up to 0 dBFS (105 samples at or above
0.99), so adding anything to it clips. `audio.js` has a `HEADROOM = 0.85` (−1.4 dB) applied
to the narration before the effects are summed; the mix then peaks at −1.3 dBFS. The
y-intercept source peaked at −5.5 dBFS and needed none of this. Check the source's peak
before assuming the mix will fit.

## Checked

- 1262 frames = round(42.0746 x 30); 1080x1920, 30fps, H.264 high + AAC 192k 48 kHz.
- Final audio against the narration by cross-correlation: 0 samples offset.
- Stills at every shot and mid-move, a 1fps contact sheet of the finished file, and 10fps
  strips across all twelve camera moves.
- Mix peak −1.19 dBFS in the encoded file, no clipping.
