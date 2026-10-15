# -*- coding: utf-8 -*-
import pymupdf
for n in (23, 24):
    p = r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\q6_page%d.png" % n
    pix = pymupdf.Pixmap(p)
    px = pix.samples
    import statistics
    print(n, "size", pix.width, pix.height, "nbytes", len(px))
    # sample luminance
    stride = pix.n
    lows = []
    for y in range(0, pix.height, 40):
        for x in range(0, pix.width, 40):
            i = (y * pix.width + x) * stride
            lows.append(px[i])
    print("  meanR", round(sum(lows)/len(lows),1), "min", min(lows), "max", max(lows))
