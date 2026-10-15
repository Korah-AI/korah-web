# -*- coding: utf-8 -*-
import io
import pymupdf
out = io.open(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\images6.txt", "w", encoding="utf-8")
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
page = doc[5]
info = page.get_image_info()
out.write("image_info entries: %d\n" % len(info))
for i, im in enumerate(info):
    out.write("%d %s\n" % (i, im))
out.close()
print("done")
