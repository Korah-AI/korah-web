# Softball reel: source analysis and what is specific to it

A 76 second vertical reel (1080x1920, 30fps, H.264 + AAC) made from a @korah.ai video where
a hard SAT word problem is solved with a Desmos quadratic regression. Same format as the
y-intercept and parabola-b reels: the source's narration and Desmos footage, restaged on a
paper page with a virtual camera.

Read `y-intercept.md` first for the shared style, palette, camera rules, sound levels and
process, and `parabola-b.md` for the hand-made marks. This doc only covers what is different
here.

## Rendering

```
cd animations
npm run render:softball     # writes softball/out/softball.mp4 (about 4 min)
node softball/render.js --stills 3,9.5,14,21,28,32,38,45,49.5,58,61.3,64,68,75 [dir]
```

## The problem

> A machine launches a softball from ground level. The softball reaches a maximum height of
> 51.84 meters above the ground at 1.8 seconds and hits the ground at 3.6 seconds. Which
> equation represents the height above ground *h*, in meters, of the softball *t* seconds
> after it is launched?
>
> A. h = −t² + 3.6  B. h = −t² + 51.84
> C. h = −16(t − 1.8)² − 3.6  D. h = −16(t − 1.8)² + 51.84

Answer: D. The problem text and the four choices came from the image the user supplied.
Unlike the y-intercept reel there is no table and no inline fraction to pull out, so the card
is three prose blocks and a choice list.

## The source video

`assets/source.mp4`: recorded 1280x720 with a `rotation=-90` display matrix, so ffmpeg serves
it as 720x1280. 30fps, 76.1s, 2283 video frames, AAC 44.1 kHz stereo. Narration peaks at
−3.20 dBFS, RMS −19.65 dBFS, so no headroom trim is needed (parabola-b's `HEADROOM` is gone).

**The layout is different from the first two sources.** There is no problem panel and no
burned-in captions: the frame is black except for the Desmos window, which sits full width at
y 438 to 841 and never moves. So the whole picture above the Desmos crop is ours to build,
and there are no burned-in captions to cross-check the audio against.

- The Desmos crop is 720x404, the same size as both earlier sources, 182 px higher than the
  y-intercept's and 189 px higher than parabola-b's.
- Regions inside the crop: top bar y 0 to 32, expression panel x 0 to 257, graph x 257 to 720.
  (y-intercept: bar 35, panel 270. parabola-b: bar 37, panel 274.)

**Panel rows in crop coordinates** (final state): toolbar 43–54, table header y 88, table rows
y 117 and y 140, the `Quadratic Regression` dropdown y 194, `EQUATION` y 219 with
`y = −16x² + 57.6x + 0` at y 237, `R² = 1` at y 265, row 2 starts y 286 with
`y₁ ~ −16(x₁ − 1.8)² + b` at y 312, `REGRESSION PARAMETERS` y 336 and `b = 51.84` at y 350.
The keyboard toggle button covers the panel's bottom left from y 370 down.

**Desmos events (seconds)**, from panel diffs and colour/dark pixel counts in the graph region:

| Time | Event |
| --- | --- |
| 0 to 32.6 | empty graph, nothing typed |
| 32.6 to 33.4 | "+" menu opens (expression / note / table / inference / folder / image) |
| 34.0 to 34.5 | table created, x₁ and y₁ columns |
| 35.0 to 39.1 | 1.8, 51.84, 3.6 and 0 typed into the table |
| 41.55 to 41.7 | Linear Regression row appears (`y ~ −28.8x + 103.68`), points plotted |
| 42.7 to 44.2 | regression type dropdown open, Quadratic Regression picked |
| 44.17 | `y = −16x² + 57.6x + 0`, R² = 1, purple curve |
| 52.5 to 53.1 | a new empty row 2 is created |
| 53.9 to 58.9 | `y₁ ~ −16(x₁ − 1.8` typed; a black curve appears at 59.0 |
| 60.93 | the `²` commits: a clean downward parabola with its vertex on the x-axis at t = 1.8 |
| 62.30 | `+` typed, the expression is incomplete and the parabola disappears |
| 62.67 | `b` typed, `b = 51.84` appears under REGRESSION PARAMETERS |
| 62.67 to 76.1 | held |

Two things to know about the graph in this source. First, the viewport stays at the default
−10..10 in both axes, and the parabola's maximum is 51.84, so for most of the video the curve
shows only as two near-vertical branches; the payoff lives in the expression panel, not on the
graph. Second, at 62.67 the new black regression lands exactly on top of the purple quadratic
regression (they are the same parabola), which is why the coloured pixel count drops to zero
there rather than because anything was hidden. Only one graph shot is worth taking: the 1.4s
window from 60.93 to 62.30 where `−16(x₁ − 1.8)²` alone draws a readable parabola.

## Transcript

`whisper-small.en` and `whisper-medium.en` agree except on one word: small hears "making
option d the correct answer", medium hears "option b". The Desmos result and the choice list
both say D, so D it is. Two things worth flagging:

- The narrator reads "the height above **h**, in meters" and skips "ground", which the printed
  problem has. Both models hear it the same way. The captions follow the audio, so the caption
  says "the height above h, in meters," while the card keeps the printed "above ground h".
- The brand comes through as "Quora AI" in both models and is written "Korah.ai". The sign-off
  is "your dream SAT score" ("DreamSAT" in the small model's raw output).

## Page layout

Card 980 x 1140 at y 120. Three prose blocks, each its own blur group, then the choices.

| World y | Content |
| --- | --- |
| 150 | header bar (Math / Difficulty: Hard) |
| 300, 358 | "A machine launches a softball from ground level." |
| 440, 498, 556 | "The softball reaches a maximum height of 51.84 meters ... at 3.6 seconds." |
| 700, 758, 816 | "Which equation represents the height above ground h ... after it is launched?" |
| 920, 994, 1068, 1142 | choices A to D, 46px, `CHOICE_LH` 74 |

The Desmos window sits at world y 1330, 1000 px wide (`DES.s = 1000 / 720`).

`drawEq` and the `ans` group from parabola-b are gone; `drawChoices` replaces them and reuses
`penLine` and `ring` for the marks.

## Hand-made marks

Same felt highlighter (`swipe`) over each prose block as it is read. The red pen is used twice:

- **Strike-through**: `penLine` across the middle of choices A and B at 51.90 and 52.35, on the
  words "option a and b". They stay struck for the rest of the video.
- **The answer**: choice D fades to red at 71.05 and `ring` closes round it at 71.95.

There is no written-in answer, so parabola-b's `drawAnswer` and its Marker Felt registration
are gone.

## Camera

| Time | Shot | Zoom | In focus |
| --- | --- | --- | --- |
| 0 | wide | 1.04 | whole card, header included (card rises in) |
| 6.50 | t1 | 1.3 | "a machine launches a softball from ground level" |
| 10.30 | t2 | 1.16 | the sentence with 51.84, 1.8 and 3.6 in it |
| 18.40 | t3 | 1.2 | "which equation represents the height above ground h ..." |
| 24.40 | choices | 1.25 | all four choices, while the parabola idea is explained |
| 30.90 | desmos | 1.0 | window slides up and lands at 31.7, card blurred |
| 33.00 | table | 2.15 | panel: "+" menu, the table, 1.8 / 51.84 and 3.6 / 0 typed |
| 41.40 | reg | 1.95 | panel: the regression row and the type dropdown |
| 47.30 | eqn | 2.25 | panel: `y = −16x² + 57.6x + 0`, the −16 that rules A and B out |
| 50.80 | rule | 1.3 | back to the card: A and B struck out |
| 53.30 | custom | 2.15 | panel: `y₁ ~ −16(x₁ − 1.8)² + b` being typed |
| 60.55 | graph | 2.0 | the parabola, vertex sitting on the x-axis at t = 1.8 |
| 62.20 | param | 2.0 | panel: `b = 51.84` |
| 65.30 | row | 1.85 | panel: the whole custom regression row and its parameter |
| 70.90 | answer | 1.35 | choices: D turns red and is ringed |
| 73.20 | end | 1.05 | D ringed with the panel that proves it underneath |

**New framing rule.** The Desmos window is 561 world px tall, so at any usable zoom (2 to 2.3,
the limit before the source pixels smear) it cannot fill a 1920 frame; there will always be
bare page above or below. Frame each panel shot so the window covers the middle of the frame
and the caption lands on empty panel rather than on bare page: rows near the top of the panel
get a low `screenY` (table, crop y 112, sits at 760) and rows near its bottom get a high one
(param, crop y 348, sits at 1270). Framing every panel shot at the usual 880 to 960 leaves
700 px of empty page under the window whenever the focus is near the panel's bottom.

The three card shots that hold the choices (`choices`, `rule`, `answer`) pan to
`CHOICE_CX = 396`, not to the card's centre at 540. The choice block with its ring spans world
x 94 to 699, so keeping the card centred pushes the A/B/C/D labels off the left edge at zoom
1.3 and clips the ring.

`end` is framed on world y 1370 at zoom 1.05, which fits the question, the four choices with
D ringed, and the whole Desmos window with `b = 51.84` into one frame; the card's header and
first two blocks fall off the top.

## Sound

Same synthesized effects as before, plus two new ones for the Desmos section, which the brief
for this video asked for:

- `tap()`, a trackpad click, on each menu, new row and dropdown pick (`CLICKS` in
  `timeline.js`, taken from the panel-diff scan).
- `key()`, a dull laptop key, scattered at 7 to 13 per second through each typing run
  (`TYPE` in `timeline.js`), with the gain and pitch jittered per key.

Both are placed from the event times, not guessed, so they land on the frames where the panel
actually changes. Measured against the voice: every effect peaks between −19.6 and −26.9 dBFS
against voice peaks of −3.2 dBFS, and each cue's RMS sits 21 to 28 dB under the narration RMS
in its own window. The mix peaks at −3.09 dBFS.

The narration is not trimmed. `HEADROOM` from parabola-b was removed because this source peaks
at −3.2 dBFS, which leaves plenty of room.

## Checked

- 2283 frames = round(76.0918 x 30) = the source's own frame count; 1080x1920, 30fps,
  H.264 high + AAC 192k 48 kHz.
- Final audio against the narration by cross-correlation: 0 samples offset.
- Stills at every shot and mid-move, a 1fps contact sheet of the finished file, and 10fps
  strips across all sixteen camera moves.
- Mix peak −3.09 dBFS, no clipping.

## New gotcha

`-shortest` in the final mux will trim frames off the picture when the narration is shorter
than the rendered frame count. Here `round(76.0918 x 30) = 2283` frames is 76.100s against a
76.0918s narration, and the muxed file came out with 2281 frames. `writeMix` now pads the WAV
out to `round(DURATION * FPS) / FPS` seconds of silence so the two lengths agree; the earlier
reels never hit this because their durations happened to round down.
