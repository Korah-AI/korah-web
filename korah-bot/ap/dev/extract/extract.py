#!/usr/bin/env python
"""Verify the reconstructed 2026 AB numbers against the official decimals in
ap26-scoreguide-text.txt. Run:  python extract.py verify
Also re-extracts PDF text:  python extract.py  (arg1 = path to the scoreguide PDF)
"""
import math
import sys

def simpson(f, a, b, n=1000):
    h = (b - a) / n
    s = f(a) + f(b)
    for i in range(1, n):
        coef = 4 if i % 2 else 2
        s += coef * f(a + i * h)
    return s * h / 3

def verify():
    g = lambda x: (14 * x + 12) / (x + 12)
    print('Q2A int_0^1 g =', simpson(g, 0, 1), '(official 1.513338)')

    a = 3.255817
    f = lambda x: 1.43 ** x + 0.57
    print('Q2 f(x)=1.43^x+0.57: f(a)=', f(a), ' g(a)=', g(a))
    print('Q2C int_0^a |f-g| =', simpson(lambda x: abs(f(x) - g(x)), 0, a), '(official 0.631784)')
    print('Q2C int_0^1 (f-g)   =', simpson(lambda x: f(x) - g(x), 0, 1))
    print('Q2C int_1^a (g-f)   =', simpson(lambda x: g(x) - f(x), 1, a))

    print('Q1C sine-form int_15^45 =', simpson(lambda t: 18 + 16 * math.sin(math.pi * (t + 15) / 20), 15, 45), '(official 641.859)')
    print('exact 320/pi + 540 =', 320 / math.pi + 540)
    print('Q1C sine-form F(15)=', 18 + 16 * math.sin(math.pi * 30 / 20), ' F(20)=', 18 + 16 * math.sin(math.pi * 35 / 20))
    print('Q1D sine-form D(15)=', 6 - (18 + 16 * math.sin(math.pi * 30 / 20)), '  D(20)=', 5 - (18 + 16 * math.sin(math.pi * 35 / 20)), '(official +4, -1.686292)')

    v = lambda t: t ** 4 - 8 * t ** 3 + 16 * t ** 2
    print('Q5C distance =', simpson(v, 0, 4), '(official 512/15 =', 512 / 15, ')')
    print('Q5A a(1) =', 4 - 24 + 32, '  Q5B v(1) =', 1 - 8 + 16)
    avgv = simpson(lambda t: 10 * math.cos(math.pi * t / 3) - 10, 6, 12) / 6
    print('Q5D avg velocity =', avgv, '(official -10)')

def extract(path, out):
    import pymupdf
    doc = pymupdf.open(path)
    pages = []
    for i, page in enumerate(doc):
        pages.append('===== PAGE %d =====\n%s' % (i + 1, page.get_text('text')))
    data = '\n\n'.join(pages)
    with open(out, 'w', encoding='utf-8') as f:
        f.write(data)
    print('wrote', out, doc.page_count, 'pages,', len(data), 'chars')

if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'verify':
        verify()
    else:
        pdf = sys.argv[1] if len(sys.argv) > 1 else r'..\..\data\ap-calculus-ab\calc-data\ap26-scoreguide-calculus-ab.pdf'
        out = sys.argv[2] if len(sys.argv) > 2 else 'ap26-scoreguide-text.txt'
        extract(pdf, out)