# -*- coding: utf-8 -*-
import io
import pymupdf
out = io.open(r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\frq26-text.txt", "w", encoding="utf-8")
path = r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\ap26-frq-calculus-ab.pdf"
doc = None
for pw in ("", " ", "abc", "1234", "password"):
    try:
        doc = pymupdf.open(path)
        if doc.needs_pass:
            ok = doc.authenticate(pw)
            print("password", repr(pw), "->", ok)
            if not ok:
                doc.close(); doc = None; continue
        break
    except Exception as e:
        print("open failed with", repr(pw), e); doc = None; break
if doc is None:
    sys.exit(1)
print("pages:", doc.page_count)
for i, page in enumerate(doc):
    out.write("===== PAGE %d =====\n%s\n" % (i + 1, page.get_text("text")))
out.close()
print("done")
