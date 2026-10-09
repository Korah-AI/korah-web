"""Turn a soft faux-pixel logo into a true low-res sprite with a fixed palette."""
import os
import sys
from PIL import Image

SRC = "/Users/oscareuceda/Documents/korah-repos/korah-web/korah-bot/logo-images/newlogo2.png"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sprites")


def sprite(src, size, colors, alpha_cut=128):
    im = Image.open(src).convert("RGBA")
    im = im.crop(im.getchannel("A").getbbox())

    # pad to square so the grid stays uniform
    w, h = im.size
    s = max(w, h)
    sq = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    sq.paste(im, ((s - w) // 2, (s - h) // 2))

    small = sq.resize((size, size), Image.BOX)

    # hard alpha, no half-transparent fringe
    a = small.getchannel("A").point(lambda v: 255 if v >= alpha_cut else 0)

    rgb = small.convert("RGB")
    pal = rgb.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.Dither.NONE)
    out = pal.convert("RGBA")
    out.putalpha(a)
    return out


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for size in (16, 24, 32, 48, 64):
        for colors in (8, 16):
            sp = sprite(SRC, size, colors)
            sp.save(f"{OUT}/korah_{size}px_{colors}c.png")
            big = sp.resize((512, 512), Image.NEAREST)
            big.save(f"{OUT}/preview_{size}px_{colors}c.png")
    print("wrote", len(os.listdir(OUT)), "files to", OUT)
