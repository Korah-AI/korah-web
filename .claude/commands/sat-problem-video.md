---
description: Restage a Korah SAT problem video in the BrainBlastSAT paper style with a virtual camera, reusing its narration and Desmos footage
argument-hint: <source video path> [problem image path] [notes]
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

Make a new SAT problem reel from this source: `$ARGUMENTS`

If no source video path was given, ask for one and stop. The first path is the source
video. A second image path, if present, is the problem image. Anything else is extra notes
from the user and overrides the defaults below.

This repeats the process used for the y-intercept reel. The finished example, its code and
its write-up are the template:

- Docs: `/Users/oscareuceda/Documents/korah-repos/korah-web/animations/docs/y-intercept.md`
- Code: `/Users/oscareuceda/Documents/korah-repos/korah-web/animations/y-intercept/`
  (`render.js`, `timeline.js`, `audio.js`)
- Style reference video (@brainblastsat): `animations/y-intercept/assets/reference.mp4`

Work in phases, in order.

## Phase 0: Read

1. Read `docs/y-intercept.md` in full. It has the reference analysis, the style spec, the
   camera rules, the sound levels, the process and the render gotchas. Follow it.
2. Read `y-intercept/render.js`, `timeline.js` and `audio.js` in full.
3. Do not re-study the reference video unless the user gives a new one. Its analysis is in
   the doc.

## The brief (standing, from the original prompts)

- Recreate the source video's content as a new animation in the reference's paper style,
  using a virtual camera (pan/zoom + selective blur) to direct attention the way the
  reference does.
- Audio is the source video's narration only. No re-recording, no TTS. Mechanical SFX are
  layered under it at focus shifts and the Desmos entrance, without drowning it out.
- The problem card appears in the paper-cut style with simple colors. The camera focuses on
  the question while it is read, with the answer choices blurred. It shifts to the choices
  when they become relevant, with the blur reversed.
- The Desmos footage from the source moves smoothly onto the page. No separate transition
  scene.
- Inside Desmos, the camera focuses the expression panel while things are typed (graph
  blurred) and the graph when the graph result matters (panel blurred).
- Content, timing and beat order follow the source. Visual style follows the reference.
- Desmos pixels are used as-is: only scaled, panned and blurred, never redrawn.
- 9:16 vertical for Instagram and TikTok, everything built in code, gentle mechanical sound
  effects, main action centered, fix any visible problems before exporting.

Standing decisions from the first video (do not re-ask):

- Output 1080x1920, 30fps, H.264 + AAC. Only ask if the source is not 9:16.
- Solid pastel yellow frame `#f4d56a`, 12px. No rainbow frame.
- Captions follow the audio, not the source's burned-in captions. Spell the brand
  "Korah.ai" (transcripts hear "Core AI").
- If no problem image is given, take the problem text from a zoomed source frame.

## Phase 1: Set up

1. Tools: check `ffmpeg`/`ffprobe` (install with `brew install ffmpeg` if missing) and
   `animations/node_modules` (`npm install` in `animations/` if missing). Create a Python
   venv in the scratchpad with `mlx-whisper` for word timestamps.
2. Probe the source (resolution, fps, duration, audio). Make 1fps contact sheets and look
   at every one.
3. Pick a short slug from the problem topic. Create `animations/<slug>/`, copy the three JS
   files and `assets/fonts/` from `y-intercept/`, and copy the source to
   `animations/<slug>/assets/source.mp4`. Rename output paths in `render.js` to the slug.
4. If the source layout is clearly different from the y-intercept source (problem panel on
   top, Desmos window at the bottom), describe what you see to the user and ask how to
   handle it before building.

## Phase 2: Analyze the source

Use the Process section of the doc. In short:

1. Find the problem panel, burned-in captions and Desmos window bounds by scanning row and
   column brightness on a few frames. Confirm the window does not move. Update the crop in
   `prepareAssets()`, `REG`, the frame size constants and `DES.s` if the size changed.
2. Transcribe with word timestamps (`whisper-small.en`). If a number, name or math term is
   doubtful, or the burned-in captions disagree with the audio, cross-check with a second
   model and note it for the user.
3. Map the Desmos events: count colored curve pixels in the graph region per frame, diff the
   panel between frames, and look at native-resolution key frames. Write down the times of
   menus, typed rows, scrolls and each new curve, and where the active row sits in the crop.
4. Read the problem text, table, equations and answer choices from a zoomed frame or the
   given image.

## Phase 3: Build

1. Problem card: rewrite the text blocks, display equation, table and choices in
   `render.js`, and adjust the layout positions so the card fits.
2. `timeline.js`: `CAPTIONS` from the transcript (phrases of 3 to 6 words, grouped by start
   word, end at the next phrase if the gap is under 0.7s, otherwise 0.35s after the last
   word), `SHOTS` placed on the narration and the Desmos events, and the emphasis beats in `T`
   (read-along underlines, red equation, red answer and ring, Desmos entrance and landing).
3. Frame each shot in `SHOT` with `frame()`. Rules from the doc: active content stays above
   about y 1420 (captions sit at y 1470), the action is horizontally centered, blur weights
   per group, end on the correct answer next to the Desmos proof.
4. Adjust the SFX cues in `audio.js` only where the beats differ. Camera moves pick up their
   clicks and whirr from `SHOTS` automatically.

## Phase 4: Review and fix

1. Render stills at every shot and mid-move into the scratchpad
   (`node <slug>/render.js --stills ... <scratchpad dir>`), tile them into a contact sheet,
   and look. Check for text cut by the frame edges, captions covering the active content,
   blur that is too weak to read as out of focus, seams in the Desmos window, and empty or
   off-center compositions. Fix and repeat until clean.
2. Measure the SFX against the voice: effects should sit about 16 to 20 dB below the
   narration RMS, with the mix never clipping.
3. Run the full render. Review the final file as a 1fps contact sheet and as 10fps strips
   around every camera move. Check the frame count equals round(duration x 30) and that the
   final audio lines up with the narration by cross-correlation (offset 0).
4. If anything visible is wrong, fix it and render again before reporting.

## Phase 5: Deliver

1. Add `"render:<slug>": "node <slug>/render.js"` to `animations/package.json`.
2. Write `animations/docs/<slug>.md` in the same structure as `y-intercept.md`, focused on
   what is specific to this video: source analysis, Desmos events table, shot table, content
   choices and any new gotchas. Point to `y-intercept.md` for the shared style and process.
   If you learned something that applies to every future video, update `y-intercept.md` too.
3. Report to the user: the output path, what was verified, choices made, and anything
   doubtful in the transcript or content. They can't hear the mix through you, so ask them
   to check the SFX levels by ear.

Notes: `animations/` is tracked in git. Commit new slug work (code, assets, renders) along
with the rest of the change. Write review stills to the scratchpad rather than deleting
files in the project.
