# "Stop doomscrolling" reel

A 20 second vertical reel (1080x1920, 30fps, H.264 + AAC) for Instagram. A pixel-art
student doomscrolls in a dark bedroom, spots the SAT date on the wall calendar, bolts
out of bed, turns on the desk lamp and opens Korah instead. Everything is drawn and
synthesized in code. No music, no narration.

## Rendering

```
cd animations
npm install                  # first time: @napi-rs/canvas + ffmpeg-static
npm run render:doomscroll    # writes doomscroll/out/doomscroll.mp4
node doomscroll/render.js --stills 0.8,6.6,13.4,17.2   # review PNGs, about 0.5s each
```

Stills go to `doomscroll/frames/`. Pass a folder after the times to write them
somewhere else. A full render takes about two and a half minutes.

## Files

| File | What it does |
| --- | --- |
| `render.js` | Room layout, camera, lighting, pop-up cards, end cards, export |
| `student.js` | Pixel student rig with IK arms and legs, rasterized on a 7px grid |
| `phone.js` | The Korah SAT screen, drawn into the app view panel |
| `paper.js` | Paper helpers: hand-cut edges, grain texture, shadows, easing |
| `timeline.js` | Beat sheet shared by picture and sound |
| `audio.js` | Synthesized sound effects and a small reverb, written to WAV |
| `assets/` | Fonts and the Korah idle sprite sheet |

`paper.js` is a copy of the one in `korah-not-cooked`. The end card logo is read from
`korah-bot/logo-images/newlogo2.png`. The sprite sheet is a copy of
`korah-bot/ui-components/korah-sprite/korah_idle_sheet_v2.png`.

## The original brief

> Charming paper-cut style animation, textured paper layers, smooth movement. A dark
> bedroom at night, almost no ambient light except the cold blue glow of a phone screen
> illuminating the student's face. Ambient nighttime sounds (soft house creaks, distant
> crickets, the faint buzz/tap of a phone screen) — no music, no narrator.
>
> An 8-bit pixel-art student lies in bed in near-total darkness, blanket rumpled, face lit
> only by their phone. Paper-cut social media icons and short video clips flicker past
> above the phone in a lazy scroll, one after another. Their eyes are half-lidded, thumb
> moving on autopilot, the rest of the room barely visible in shadow.
>
> A paper-cut wall calendar is faintly visible in the dark, one date circled in red: "SAT
> — THIS WEEK." The student glances at it mid-scroll. Pause. Their eyes go wide.
>
> They bolt upright, blanket flying off in a paper-cut flutter. Phone still in hand, they
> swing out of bed and cross the dark room to their desk, flicking on the desk lamp, warm
> golden light spilling out and cutting through the darkness for the first time. They open
> the Korah app on their phone, screen now glowing warm gold instead of cold blue.
> Practice questions unfold onto the screen like little paper cards. The student sits up
> straight, focused, determined.
>
> Second-to-last frame: cream paper background, hand-lettered text folds in:
> "Stop doomscrolling..."
>
> Final frame:
> "Scroll problems on Korah instead"
> "Now available on App Store"

Extra constraint given with it: export vertical 9:16 for Reels.

## Choices made against the brief

- The calendar says "SAT" over "THIS WEEK" on two lines instead of "SAT — THIS WEEK".
  Hand-lettered on two lines it stays readable at the size a calendar can be in frame.
- The tag reads "Now available on the App Store", Apple's required wording, rather than
  "Now available on App Store".
- The notifications drifting up out of the phone use the short-video notification format
  (app tile, app name, body line, "now") but the app is called "For You" and the tile is a
  teal-to-magenta play triangle. No real platform's name, wordmark or logo is drawn.
- What turns the student around is a reminder notification, "Your SAT is this Saturday",
  rather than only the glance at the calendar. The calendar is still there and the camera
  still drifts to it, but the notification is the interruption that breaks the scroll.

## The phone

The phone is never shown face-on. We see its back, the way it would look from across the
room: body, camera module, and a bright strip along the edge where the screen is, throwing
a soft cone of light. In bed the phone lies flat above their face with the screen pointing
down at them, which is why the cone falls on the face and nothing else in the room.

Because the screen is turned away, the last scene needs somewhere to actually show Korah.
`drawAppView` pops a paper window up out of the phone, framed like the rest of the
paper-cut world, with the live app screen inside it and a soft beam of screen light
spreading up into it. The practice cards fold in inside that panel, so the payoff is
readable at reel size without ever cheating the phone flat to camera.

## Style notes

**Palette**

| Use | Colors |
| --- | --- |
| Night wall and floor | `#3d4468`, `#434a70`, `#3a3252`, `#403858` |
| Window and moon | sky `#0e1730` to `#222d54`, moon `#e8eeff`, shaft `rgba(150,180,255)` |
| Bed and desk wood | `#6b4f39`, `#5a4230`, `#8a6444`, `#4a3626` |
| Blanket | `#6d4a63`, `#7b5570`, `#5f4057` |
| Darkness sheet | `#141a38` multiplied, alpha 0.93 at night, 0.72 once the lamp is on |
| Phone glow | cold `#6f93ff`, warm `#ffb347` |
| Lamp | shade `#5b638f` to `#f0b35e`, spill `rgba(255,206,132)` |
| Calendar | paper `#f2e6cf`, band `#c0603f`, red circle `#ce3a2e` |
| Pyjamas | grey tee `#969aa0`, red `#a63034` with black `#2a242c` stripes |
| Notifications | dark card `#1b2036`, reminder card `#fdf4e2` with a `#ce3a2e` tile |
| Korah accent | `#7c3aed`, `#8b5cf6`, gold `#ffdc95` to `#f6a049` |
| End cards | cream `#f8ecd6`, hills `#f3c48d`, `#e8934f`, `#a8714a` |

**Lighting**

The room has one small light source at a time, so the night is a full-frame dark sheet
with a pool of light rubbed out of it (`destination-out` radial) wherever the phone, the
moon or the lamp is, then multiplied over the scene. The phone's pool sits 150 units along
the direction its screen faces, so it swings from under the phone in bed to beside it at
the desk without any extra bookkeeping. Two blurred shafts fall from the window onto the
bed and the floor. The phone, the floating icons and the
pop-up cards are drawn after that pass because they are self-lit. Screen-blend glows and
a vignette go on top. The pool follows the phone, so the student stays readable while
they walk across a dark room.

**Pixel student**

- Built from a bone rig: torso curve, head, two-bone IK arms (12 + 11) and two-bone IK
  legs (15 + 14), rasterized to a 112x112 grid at 7px per pixel.
- Animates on twos (15fps) while the rest of the scene moves at 30fps.
- The head is described in head-local pixels with the face pointing +x, then blitted
  through a quarter turn while they are lying on their back, so the face points at the
  ceiling in bed and swings to profile at the bolt-upright beat.
- Elbows bend toward the hip while lying so the forearm does not cross the face.
- The rim light takes a direction: from above in bed, from the right at the desk.
- `paint` takes an optional second palette and a test, which is how the pyjama pants get
  their black diagonal stripes over the red without needing a second mask.
- Knees bend backwards (`kneeNear`/`kneeFar` of -1). The other sign gives a bird's leg.
- The walk is a half-cycle stance and swing per foot with a hip bob; the stride matches
  how far the hips travel per step so the feet do not slide.

**Paper-cut look**

- Every shape is a polygon with its edge points nudged, so edges look cut by hand.
- Each piece gets a tiling grain texture multiplied on top.
- The blanket is three layered pieces with different weights, lags and spins, so it fans
  apart when it is thrown instead of reading as one board. It is drawn in front of the
  student while it covers them and behind once it is airborne.
- Pop-in uses a damped spring with a small overshoot. Cards hinge at one edge and darken
  while they are tilted away from the light.

**Type**

- Luckiest Guy for the end cards and the calendar lettering.
- Plus Jakarta Sans for all UI text and the App Store tag.

**Composition for Reels**

- Main action stays between roughly y 550 and y 1500. The bottom fifth and the right edge
  are covered by Instagram's caption and buttons.
- Camera: close on the face and phone in bed, drifts wide to take in the calendar, snaps
  back for the realisation, pans with the walk (lagging a little so they cross the frame),
  then pushes in on the desk for the pop-up cards.

**Sound**

- All synthesized: cricket chirps (pulsed narrow-band tone), house creaks (sweeping
  band-passed noise with a slow amplitude ripple), soft taps and swipes on glass, a faint
  screen whine, a sharp inhale, blanket rustle and fwips, footsteps, a rocker switch for
  the lamp, chair creak and paper folds.
- Very quiet room tone under the scene, a small comb and allpass reverb on a send. The mix
  is normalized to about -1 dBFS peak.

## Timeline (seconds)

| Time | Beat |
| --- | --- |
| 0 to 4.2 | Lazy scroll in the dark, notifications drift up out of the phone |
| 4.25 | The phone buzzes: "Reminder - Your SAT is this Saturday" |
| 4.6 | Eyes open and read it |
| 4.95 to 5.7 | Camera drifts across to the calendar, "SAT THIS WEEK" |
| 5.95 | Pause, eyes go wide, sharp inhale |
| 6.4 | Bolts upright, blanket flies off in three pieces |
| 6.54 | Head swings from facing the ceiling to facing the room |
| 7.0 to 7.55 | Hips slide to the edge of the bed, feet find the floor, stands |
| 7.95 to 9.6 | Walks to the desk, four footfalls |
| 9.78 | Desk lamp clicks on, warm light floods the room |
| 10.25 | Sits down |
| 10.95 | Korah opens, the screen wipes from cold blue to gold |
| 11.15 | The app view panel pops up out of the phone |
| 11.55 to 13.05 | Three practice cards fold in inside the panel |
| 13.5 | Posture straightens, mascot pops up on the panel |
| 14.9 to 15.65 | Fade to cream, paper layers fold in |
| 15.8 | "STOP DOOMSCROLLING..." folds in letter by letter |
| 17.35 | It folds away |
| 17.6 | "SCROLL PROBLEMS ON KORAH INSTEAD" folds in |
| 18.8 | "Now available on the App Store" tag with the logo |

## Render gotchas

- `render.js` renders 90-frame chunks in short-lived child processes and pipes them all
  into one ffmpeg, so memory never builds up in one process.
- Canvas shadow sizes are in device pixels, so `paper.js` scales them by the camera zoom
  (`light.k`).
- The darkness sheet is a second full-size canvas reused every frame; it is rebuilt from
  scratch each time because the light pools move with the camera.
