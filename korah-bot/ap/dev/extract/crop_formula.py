# -*- coding: utf-8 -*-
import pymupdf
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
page = doc[5]
clip = pymupdf.Rect(60, 195, 552, 520)
pix = page.get_pixmap(dpi=300, clip=clip)
pix.save(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\q2_formula_strip2.png")
print("saved", pix.width, pix.height)
