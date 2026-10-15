# -*- coding: utf-8 -*-
import io, sys
import pymupdf
out = io.open(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\spans6.txt", "w", encoding="utf-8")
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
page = doc[5]
dd = page.get_text("dict")
for b in dd["blocks"]:
    for l in b.get("lines", []):
        for s in l.get("spans", []):
            t = s["text"]
            if t.strip():
                out.write("%s | %s\n" % (s["font"], t.encode("unicode_escape").decode("ascii")))
out.close()
print("done")
