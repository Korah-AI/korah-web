# -*- coding: utf-8 -*-
import pymupdf
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
for idx in (22, 23):
    page = doc[idx]
    pix = page.get_pixmap(dpi=300)
    out = r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\q6_page%d.png" % (idx + 1)
    pix.save(out)
    print(out)
