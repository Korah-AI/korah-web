# -*- coding: utf-8 -*-
import pikepdf
src = r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\ap26-frq-calculus-ab.pdf"
dst = r"C:\devbushi\korah-internship\korah-bot\ap\dev\extract\dl\ap26-frq-decrypted.pdf"
try:
    pdf = pikepdf.open(src, password="")
    pdf.save(dst)
    print("decrypted ok, pages:", len(pdf.pages))
except Exception as e:
    print("FAIL", repr(e))
