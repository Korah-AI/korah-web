# -*- coding: utf-8 -*-
import pymupdf
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
pix = doc[5].get_pixmap(dpi=220)
pix.save(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\q2_page6.png")
print(pix.width, pix.height)
