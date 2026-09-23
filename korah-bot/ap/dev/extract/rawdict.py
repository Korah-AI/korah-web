# -*- coding: utf-8 -*-
import io
import pymupdf
try:
    import fontTools
    print("fontTools present")
except Exception as e:
    print("no fontTools:", e)
doc = pymupdf.open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf")
page = doc[5]
rd = page.get_text("rawdict")
out = io.open(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\rawdict6.txt", "w", encoding="utf-8")
target = None
for b in rd["blocks"]:
    for l in b.get("lines", []):
        chars = l.get("chars", [])
        text = "".join(ch.get("c", "") for ch in chars)
        if "0.57" in text:
            target = chars
            line = l
            out.write("LINESEG: '%s'\n" % text)
            out.write("font_idx=%r\n" % [c.get("font") for c in chars])
            for k, ch in enumerate(chars):
                out.write("  %d c=%r gid=%r font=%r bbox=%r\n" % (k, ch.get("c"), ch.get("gid"), ch.get("font"), tuple(round(v,1) for v in ch["bbox"])))
out.close()
print("written")
