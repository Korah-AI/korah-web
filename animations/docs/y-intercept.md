# Y-intercept Desmos reel: style and process

An 85 second vertical reel (1080x1920, 30fps, H.264 + AAC) for Instagram and TikTok. It
restages an existing @korah.ai video, where a hard SAT math problem is solved in Desmos,
in the visual style of a @brainblastsat video. The narration and the Desmos screen
recording come from the original. Everything else is drawn in code.

This doc covers the brief, what was learned from both videos, the style that came out of
it, and the process, so the next video in this format can start from here.

## Rendering

```
cd animations
npm run render:y-intercept    # writes y-intercept/out/y-intercept.mp4 (about 3.5 min)
node y-intercept/render.js --stills 3,13,46,62,79.5 [dir]   # review PNGs, default y-intercept/frames/
```

The first run cuts `assets/desmos.mp4` and `assets/narration.wav` out of
`assets/source.mp4`. Frames render in 120-frame segments across three worker processes,
each encoding its own MP4 into `out/segments/`, then the segments are joined and muxed
with the audio mix (`out/y-intercept.wav`).

## Files

| File | What it does |
| --- | --- |
| `render.js` | Page layout, problem card, camera shots, blur, Desmos window, captions, frame, export |
| `timeline.js` | Beat times, camera shot list and captions, all on the narration's clock |
| `audio.js` | Narration plus synthesized mechanical effects, written to WAV |
| `assets/source.mp4` | The original @korah.ai video (content, pacing, narration, Desmos footage) |
| `assets/reference.mp4` | The @brainblastsat video used as the style reference |
| `assets/desmos.mp4` | Desmos window cropped from the source (720x404 at y 620), lossless |
| `assets/narration.wav` | Source audio as 48 kHz stereo PCM |
| `assets/fonts/` | Plus Jakarta Sans Bold for captions |

Easing and the hand-cut edge helper come from `../korah-not-cooked/paper.js`. Times New
Roman is loaded from `/System/Library/Fonts/Supplemental/`.

## The brief

> Restyle the Korah video to match the BrainBlastSAT style. Recreate the source video's
> content as a new animation in the reference's paper-cut visual style, using a virtual
> camera (pan/zoom + selective blur) to direct attention, matching how the reference
> handles focus.
>
> - Extract the audio track from the source. It is the only audio: no re-recording, no TTS.
> - Analyze the reference: paper-cut look, palette, easing, mechanical SFX placement, and
>   how it pans/zooms and blurs non-focused elements (question in focus, choices blurred).
> - Analyze the source layout and extract the Desmos footage (bottom of the frame).
> - Problem card appears, paper-cut style, simple colors. Camera focuses on the question
>   while it is read, choices blurred. Camera shifts to the choices when relevant.
> - The Desmos footage moves smoothly onto screen with no separate transition scene.
> - Inside Desmos, the camera focuses the equation input while it is typed (graph
>   blurred) and shifts to the graph when the graph matters.
> - Timing and beat order follow the source. Mechanical SFX at focus shifts and the
>   Desmos entrance, under the voice.
> - Desmos footage used as-is: only camera moves and blur, never redrawn.

Extra constraints given with it: 9:16 vertical for Instagram/TikTok, build everything in
code, gentle mechanical sound effects, keep the main action centered, review and fix
visible problems before exporting.

Revision after the first cut: the rainbow frame from the reference was swapped for a
solid pastel yellow frame (`FRAME = '#f4d56a'`, not too light). The rainbow code is kept
in a comment in `render.js` in case a future video wants it back.

## The reference video (@brainblastsat)

`assets/reference.mp4`: 720x1280, 25fps, 75s. An SAT triangle problem ("tan(x) = 12/35,
what's the perimeter?") explained over a single printed page.

**Look**

- One flat light grey page (`#e9e9e9` to `#ececec`) with fine grain, dust specks and a
  few faint creases. No cards or panels; everything is printed on the page.
- Math and question text in a Times-style serif, black, italic variables, large stacked
  fractions.
- A Bluebook-style question header at the top: navy number box and a grey bar. It is
  always out of focus, even in wide shots, like shallow depth of field. (Copying this
  literally was a mistake: see the note under "Learned on later videos".)
- Emphasis is color, not boxes: labels and the key equation turn red (roughly `#d7141a`)
  while they are talked about.
- Blue handwritten notes (around `#0a3e7a`) for working ("soh cah toa", "tan =
  opposite/adjacent").
- A thin yellow underline (around `rgb(238,186,52)`) under the line being read.
- Captions: white bold sans on a blue pill `#019ce1`, about 47px tall at 720 wide
  (70 at 1080), centered about 77% down the frame. Short spoken phrases of 3 to 6 words,
  hard cuts between them, no word highlighting. They stay fixed while the camera moves.
- An 8px (12px at 1080) rainbow frame around the whole video, static. Colors sampled
  around the perimeter are kept in the commented `HUES` table in `render.js`.

**Camera**

- Pushes in quickly (about 0.4 to 0.6s, eased) to 1.2 to 1.6x when attention moves,
  and holds still between moves.
- A harder punch-in (about 1.6x) on the key equation, which turns red at the same time.
  Content at the edges is simply cropped.
- Whatever is not being discussed is blurred: the answer choices while the question is
  worked, the question while the choices matter. The blur reads as depth of field, about
  4 to 6px at 720.

## The source video (@korah.ai)

`assets/source.mp4`: 720x1280, 30fps, 84.87s, AAC 44.1 kHz stereo.

- Layout: black bar on top, the problem panel at y 242 to 440 (question and table on the
  left, answers on the right), burned-in captions at y 440 to 615, the Desmos window at
  y 620 to 1024 (full width), black below.
- Desmos regions inside the 720x404 crop: top bar y 0 to 35, expression panel x 0 to 270,
  graph x 270 to 720.
- The burned-in captions say "on track to get a 1500"; the narration says "750 plus on
  the math section". Captions follow the audio. The transcript hears "Korah.ai" as
  "Core AI".

**Desmos events (seconds)**, found by counting colored pixels in the graph region and
diffing the panel between frames:

| Time | Event |
| --- | --- |
| 21.5 | "+" menu opens |
| 22.5 | table created, values typed from about 26 to 38 |
| 44.8 | linear regression row appears (black line) |
| 47 to 50 | regression dropdown, then the three-dots menu and "Export as custom regression" |
| 53.0 | custom regression row appears (red line) |
| 57.6 to 59.9 | expression edited to (mx1 + b)/(x1 + 3); graph empty while it is invalid |
| 59.95 | rational curve appears |
| 68.0 | panel scrolls; m = 4 and b = 36 visible |
| 73.6 to 76.2 | f(x) = 4x + 36 typed, blue line appears |
| 79 to 84.5 | table toggled off, graph zoomed out until the line crosses the y-axis at 36 |

## Style used in this video

**Page and card**

- Page `#e9e9e9` with two scales of value noise, per-pixel grain, 7 faint creases and
  about 1400 dust specks, generated once as a world-space texture.
- The problem sits on one paper card (`#f6f6f4`) with a hand-cut edge, a light grain
  multiply and a soft drop shadow that grows while the card is lifted. This is the
  "paper-cut" layer on top of the reference's flat page.
- The Desmos window is a second cut-out: the footage inside an 11px off-white border with
  the same shadow, like a printout laid on the page.

**Type**

- Times New Roman 42px for the question, italic for variables, 44px for the table and
  choices, 56px for the display equation. The inline fraction in the source question is
  pulled out into a centered display equation, like the reference's big tan(x) line.
- Plus Jakarta Sans Bold 42px for captions. Later videos also set the header's two labels
  in it (see "Learned on later videos") instead of the Times used here.

**Color**

| Use | Color |
| --- | --- |
| Page | `#e9e9e9` |
| Card | `#f6f6f4` |
| Ink | `#151515` |
| Emphasis red | `#d7141a` |
| Read-along underline | `rgb(238,186,52)` |
| Caption pill | `#019ce1`, white text |
| Header | navy `#26407e`, grey `#c8cccd` |
| Frame | pastel yellow `#f4d56a`, 12px |

**Emphasis beats**

- Yellow underline sweeps across each block of the question as it is read, then fades.
- The display equation turns red for "where g(x) equals f(x) divided by x plus 3".
- Choice A turns red on "(0, 36)" and gets a hand-drawn red ring on "making option A".

## Camera

Shots are listed in `timeline.js` (`SHOTS`) and framed in `render.js` (`SHOT`), using
`frame(x, y, zoom, screenY)`: the world point (x, y) lands at screen (540, screenY).
Each move is 0.7s with an in-out cubic ease, 0.8s for the Desmos entrance. Zoom is
interpolated in log space so push-ins feel even.

| Time | Shot | Zoom | In focus |
| --- | --- | --- | --- |
| 0 | wide | 0.9 | whole card (card rises in) |
| 6.0 | question | 1.15 | table and first sentence, choices blurred |
| 11.4 | equation | 1.55 | g(x) = f(x)/(x+3) in red, the rest blurred |
| 15.0 | ask | 1.15 | "and f is a linear function", the question |
| 21.0 | desmos | 1.0 | window slides up and lands, card blurred |
| 22.6 | table | 2.2 | expression panel while the table is typed |
| 44.5 | regression | 2.0 | panel: linear regression, dropdown, export |
| 52.9 | custom | 2.1 | panel: typing y1 ~ (mx1 + b)/(x1 + 3) |
| 59.95 | graph | 1.65 | graph, when the rational curve appears |
| 68.0 | params | 2.05 | panel: m = 4, b = 36, typing f(x) = 4x + 36 |
| 76.1 | choices | 1.4 | answer choices, question and Desmos blurred |
| 80.46 | end | 1.0 | choice A and the graph showing the intercept at 36 |

**Blur**

- Card content is split into groups (table, text, equation, choices, header). Each group
  has a 0 to 1 blur weight per shot, interpolated with the camera move.
- Blur is 7 world px, so it grows on screen as the camera pushes in (about 6px wide,
  15px at 2.2x). The header is always blurred (`HEADER_BLUR`), which later videos dropped.
- The Desmos footage is blurred per region (top bar, panel, graph) at source resolution,
  then scaled up. In-focus regions are the untouched footage pixels.

**Composition for Reels**

- Captions are centered at y 1470. Framings keep the active content above about y 1420
  so the caption never covers it; the end shot is placed so the graph's y-intercept sits
  above the caption.
- Main action is horizontally centered: the choices shot pans left so the choices sit
  in the middle instead of keeping the card centered.
- The bottom fifth and right edge are covered by Instagram and TikTok UI, so nothing
  important lives there.

## Sound

- Narration is the source track, unchanged in content and timing (resampled to 48 kHz for
  the mix, then AAC 192k).
- Effects are synthesized in `audio.js`: a soft detent click, a geared lens-motor whirr
  and a second click on every camera move; a paper slide and a low soft thock when the
  card and the Desmos window land; small wooden ticks when choice A turns red and when its
  ring closes.
- Levels were measured against the voice: effects sit about 16 to 20 dB below the
  narration's RMS, peaks around -20 to -26 dBFS against voice peaks of -5.5 dBFS. The mix
  is not normalized, so the narration keeps its original level.

## Process

1. **Tools.** `brew install ffmpeg` for probing and contact sheets (this build has no
   `drawtext`, so sheets have no timestamps: cell N is second N). Rendering uses
   `@napi-rs/canvas` and `ffmpeg-static` from `animations/package.json`. For word
   timings, a Python venv with `mlx-whisper` (Apple Silicon), outside the repo.
2. **Study both videos.** 1fps contact sheets of each (`fps=1,scale=240:-1,tile=6x3`),
   10fps strips around camera moves to read the easing and blur, and full-res frames
   sampled with PIL for exact colors, border thickness, caption pill size and position.
3. **Transcribe.** `mlx_whisper.transcribe(..., word_timestamps=True)` with
   `whisper-small.en`. A second model (`base.en`) was used to double check the hook,
   since the burned-in captions disagreed with the audio. Words are grouped into phrases
   by start index; a caption ends at the next phrase if the gap is under 0.7s, otherwise
   0.35s after its last word.
4. **Extract the Desmos footage.** Find the window by scanning row and column brightness
   in a few frames, then crop losslessly (`-qp 0`) so the pixels are the source's. Seeking
   into the crop with `-ss` before `-i` was checked frame-exact at several points.
5. **Map the Desmos events** by counting red, blue and black pixels in the graph region
   per frame and diffing the panel, then place camera shots on those events and on the
   narration.
6. **Lay out the page** in world units at 1:1 with the frame at zoom 1, then define shots
   and blur groups.
7. **Review stills** at every shot and mid-move, fix, repeat. Then render, and review the
   final file as a 1fps contact sheet plus 10fps strips around every move.
8. **Check the audio**: effect levels against the voice, and the final file's audio
   against the narration by cross-correlation (offset was 0 samples).

## Render gotchas

- In `@napi-rs/canvas`, `ctx.filter = 'blur(r)'` is in user space and scales with the
  transform. Blurred card groups are drawn into an offscreen canvas with the camera
  transform, then composited with a screen-space blur, only over the group's bounding box.
- Canvas shadow sizes are in device pixels, so they are multiplied by the zoom.
- Desmos regions are drawn over a full frame (the graph's version) rather than side by
  side, otherwise antialiased edges leave hairline seams.
- The 8GB Mac cannot hold many raw 1080x1920 frames. Each worker encodes its own segment
  and the segments are joined with the concat demuxer (`-c copy`), which also allows
  three workers in parallel.
- `--stills` clamps the Desmos frame index to the last frame (2544).

Learned on later videos in this format (see `parabola-b.md`):

- A source recorded in landscape can still be a 9:16 video: check for a `rotation` display
  matrix in `ffprobe -show_entries stream_side_data=rotation`. ffmpeg applies it before the
  crop filter, so the crop is written against the rotated frame.
- Check the narration's peak before mixing. A source mastered to 0 dBFS leaves no room for
  the effects, and the clip guard in `audio.js` will throw; trim the voice by about 1.5 dB
  instead of turning the effects down into inaudibility.
- Frame the Desmos entrance shot by the window's *bottom* edge, placed just above the
  caption, rather than by its centre. A 720x404 window centred in a 1080x1920 frame leaves
  a few hundred px of bare page under the caption.
- For hand-drawn marks (highlighter, pen), make the wobble a function of the stroke's own
  parameter and reveal it with a rectangular clip. A jittered polyline whose segment count
  follows the revealed length redraws differently every frame and shimmers.
- Set the header's labels ("Math", "Difficulty: Hard") in the caption face, not in Times.
  The header is chrome around the problem, not part of it, and Times makes it read as more
  question text. 29px and 26px Plus Jakarta Sans Bold sit correctly in the 64px bar.
- Do not keep the header permanently blurred. `HEADER_BLUR` was taken from the reference,
  where the header is soft in every shot, but on a wide shot where the rest of the card is
  sharp it reads as a rendering fault rather than as depth of field. Make `header` an
  ordinary blur group: sharp on the wide shot, blurred in every pushed-in shot.

## Checklist for the next video in this format

1. Copy the source video to `assets/source.mp4`, find its Desmos (or screen) region and
   update the crop in `prepareAssets()` and `REG`.
2. Transcribe with word timestamps, fix names and math terms, and write `CAPTIONS`.
3. Rebuild the problem card: `TEXT1`/`TEXT2`/`TEXT3`, the display equation, `ROWS`,
   `CHOICES` and the vertical positions in the layout block.
4. Find the screen events, then write `SHOTS` and frame each shot in `SHOT`. Keep the
   active area above the caption.
5. Set the emphasis beats in `T` (underlines, red equation, red answer and ring).
6. Render stills at every shot and mid-move, then render and review the file.

## Prompting notes

- Giving both a content source and a style reference worked well: the analysis could
  separate "what happens" (source) from "how it looks and moves" (reference).
- The brief listed the camera behavior per beat (question in focus, choices blurred,
  Desmos panel vs graph), which mapped directly onto the shot list.
- The pasted brief was cut off mid-sentence ("No standalone tra..."); it was read as "no
  standalone transition scene". Check pasted briefs for truncation.
- The problem image referenced in the brief did not come through; the problem text was
  taken from a source frame instead.
- Naming the delivery target (9:16, Instagram/TikTok, centered action) set the output
  size and the caption-safe framing.
