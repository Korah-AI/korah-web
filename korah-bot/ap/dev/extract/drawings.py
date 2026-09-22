# -*- coding: utf-8 -*-
import io
import pymupdf
out = io.open(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\drawings6.txt", "w", encoding="utf-8")
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
page = doc[5]
draws = page.get_drawings()
out.write("total drawings: %d\n" % len(draws))
for i, d in enumerate(draws):
    r = d["rect"]
    # formula line area around pt x 150..320, y 200..270
    if r.x0 < 340 and r.y0 < 280 and r.x1 > 140 and r.y1 > 195:
        items = []
        for it in d["items"]:
            items.append((it[0], round(it[1],2) if isinstance(it[1], float) else it[1]))
        out.write("%d %s bbox=(%.1f, %.1f, %.1f, %.1f) items=%s\n" % (i, d["type"], r.x0, r.y0, r.x1, r.y1, items))
out.close()
print("done")
