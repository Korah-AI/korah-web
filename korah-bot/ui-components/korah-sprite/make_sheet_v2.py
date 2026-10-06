"""Build korah_idle_sheet_v2.png: base, breath, blink, and a 5-frame page turn.

Frames: 0 base | 1 breath | 2 blink | 3-7 page turn (right -> edge-on -> left).
The turn is drawn over the base pose as a quad rotating about the spine, filled
with the book's own palette tones and edged in the page cream.
"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
OLD = f"{HERE}/korah_idle_sheet.png"
OUT = f"{HERE}/korah_idle_sheet_v2.png"

CREAM = (231, 221, 215, 255)
LIT = (95, 60, 163, 255)      # page still facing right, catching light
MID = (128, 70, 219, 255)
EDGEON = (151, 84, 237, 255)  # nearly vertical, brightest
SHADE = (63, 44, 120, 255)    # landed on the left, in shadow

# quad: spine top, free top corner, free bottom corner, spine bottom
TURN = [
    ([(31, 43), (44, 40), (44, 55), (31, 56)], LIT),
    ([(31, 43), (38, 38), (38, 55), (31, 56)], MID),
    ([(30, 43), (33, 35), (33, 55), (30, 56)], EDGEON),
    ([(29, 43), (23, 38), (23, 55), (29, 56)], SHADE),
    ([(29, 43), (18, 40), (18, 55), (29, 56)], SHADE),
]

old = Image.open(OLD).convert("RGBA")
base = old.crop((0, 0, 64, 64))
breath = old.crop((64, 0, 128, 64))
blink = old.crop((256, 0, 320, 64))

frames = [base, breath, blink]
for pts, fill in TURN:
    f = base.copy()
    d = ImageDraw.Draw(f)
    d.polygon(pts, fill=fill)
    d.line([pts[1], pts[2]], fill=CREAM)  # free edge
    d.line([pts[0], pts[1]], fill=CREAM)  # top edge
    frames.append(f)

out = Image.new("RGBA", (64 * len(frames), 64), (0, 0, 0, 0))
for i, f in enumerate(frames):
    out.paste(f, (i * 64, 0))
out.save(OUT)
print("wrote", OUT, out.size, len(frames), "frames")
