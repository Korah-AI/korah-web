---
description: Cut a raw screen recording into a short zoomed product demo with a keyframed virtual camera
argument-hint: <screen recording path> [what to focus on]
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

Make a demo clip from this recording: `$ARGUMENTS`

The first path is the recording. Everything after it is the user's shot list (for example
"zoom on the typing, follow the drag, cut the thinking short, then go down the graph"). If
no path was given, ask for one and stop. If no shot list was given, look at the recording
first and propose one before rendering.

The tool is `korah-bot/scripts/demo-camera.py`. Read its docstring first. Background is in
issue #78 (`gh issue view 78`). Work in the scratchpad and only copy the finished clip into
the repo.

## Standing decisions (do not re-ask)

- **Aspect:** keep the capture's own shape. Pass `--aspect <src w>:<src h>`, not 16:9.
- **Width:** 1280 (the default). Zoom tops out around 2.2. Past that the camera window is
  narrower than 1280 source pixels and text softens. The `warn:` lines on stderr are
  expected around 2.0 to 2.2 and can be ignored there.
- **Crop:** the app panel only. Browser tabs, URL bar and bookmarks never show, since they
  carry personal tabs and bookmarks.
- **Pacing:** the first Desmos chat pass ran 1.5x to 3x and was too fast. The approved cut
  is that pass at half speed. Typing about 1.5x, cursor travel about 1.3x, drags and clicks
  0.85x to 0.9x, a result landing at 0.5x to 1x. Cut dead time with `--segs` rather than
  speeding anything past 1.5x. Hold each important frame for at least a second.
- **Waiting:** cut "thinking" or loading waits to two or three short jump cuts of the status
  text changing, about a second each.

## Steps

1. **Probe.** macOS names recordings with a narrow no-break space before AM/PM, so
   symlink it into the scratchpad through a glob
   (`ln -sf "$(ls <dir>/Screen\ Recording\ <date>*.mov)" src.mov`). Run `ffprobe` for
   size, fps and duration.
2. **Find the crop.** Run `demo-camera.py probe src.mov --at <t>` with no crop and read the
   app panel bounds off the grid: below the bookmarks bar, inside any black margin.
3. **Find the beats.** Run `demo-camera.py sheet src.mov --crop <crop> --every 1` and look at
   every sheet. Then run tighter sheets (`--at a --to b --every 0.4`) around each beat. Write
   down when the cursor arrives, typing starts and ends, popups open, send fires, each
   status change, the result lands, and any scroll or zoom.
4. **Read coordinates.** Run `demo-camera.py probe src.mov --crop <crop> --at <t>` on each
   beat. All camera coordinates are in the cropped frame.
5. **Author the edit.** `--segs "start,end,speed; ..."` lists the spans to keep, in order.
   `--keys "t,cx,cy,zoom; ..."` uses capture seconds, mapped through the cuts. Every key is
   a stop, because moves ease in and out of each one. A hold is two keys with the same
   framing. When the aspect is narrower than the crop, the window at zoom z is
   `crop_h / z` tall and `crop_h / z * aspect` wide. Size it so the target fits with
   margin, and keep slivers of neighbouring panels out of frame. Hard cuts should land
   while the camera holds on a region that looks the same on both sides of the cut.
6. **Render and review.** Render into the scratchpad. Review with
   `demo-camera.py sheet out.mp4 --every 0.7`, plus denser sheets around each move. Check
   that browser chrome never shows, text is not cut at the frame edge, cuts don't jump,
   and the end frame shows the payoff. Budget two or three passes.
7. **Deliver.** Copy the clip to `korah-bot/videos/<slug>.mp4`. Only swap it into a page if
   asked. When swapping, comment out the old markup (`<!-- Replaced by ... -->`) and add
   `<video class="ln-card-video" autoplay muted loop playsinline preload="auto">` with a
   `<source>` (bento cards). Step demos will need their own rule. Report the path,
   duration and file size, and ask the user to watch it at full speed. Put the final
   `keyed` command in the commit message so the clip can be re-rendered.

## Reference: the Desmos chat clip

`korah-bot/videos/desmos-chat.mp4` came from a 3164x2070 capture with this command:

```
python3 korah-bot/scripts/demo-camera.py keyed src.mov desmos-chat.mp4 \
  --crop 146,306,2864,1612 --aspect 3164:2070 \
  --segs "1,7.2,1.5; 7.2,8.5,1.3; 8.5,11.1,0.85; 11.1,12.6,0.9; 15.7,17.5,1.2; 21.3,22.5,1.2; 33.4,34.4,0.5; 34.4,39,1.5; 49.4,53.4,1.5; 53.4,55,1" \
  --keys "0,1500,806,1; 1.8,1500,806,1; 4.2,2216,1246,2; 7.25,2216,1246,2; 8.6,2050,504,1.6; 9.1,2050,504,1.6; 9.9,1700,1050,1.45; 10.8,1700,1050,1.45; 11.5,2216,1246,2; 12,2216,1246,2; 12.6,2180,980,1.8; 33.8,2180,980,1.8; 34.4,1000,806,1.3; 34.6,1000,806,1.3; 36,640,500,2.2; 36.4,640,500,2.2; 39,640,1246,2.2; 49.4,640,1246,2.2; 50.9,850,830,1.9; 52.6,850,830,1.9; 53.6,816,1098,1.8; 55,816,1098,1.8"
```

The shots, in order: a wide open, a push in on the chat input while the prompt types,
a pull back to follow the file from the downloads list to the drop zone, back in on the
attachment and send, holding on the status bubble through three jump cuts, the graph
landing in Desmos on a wide shot, a push into the explanation and pan down it, then across
to the graph while it is zoomed, ending on the expressions and the line crossing the
curve three times.
