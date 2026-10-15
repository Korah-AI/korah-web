# -*- coding: utf-8 -*-
import pymupdf
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
page = doc[5]
# Full formula line spans pt x 150..285. Render a wide strip at 600 dpi.
clip = pymupdf.Rect(150, 212, 300, 255)
pix = page.get_pixmap(dpi=600, clip=clip)
pix.save(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\q2_radical_zoom.png")
print("zoom saved", pix.width, pix.height)
