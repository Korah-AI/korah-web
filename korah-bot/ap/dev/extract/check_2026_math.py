import json
import re
import sys

PATH = r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\frqs.json"
KEYS = ("prompt", "text", "criterion", "sampleResponse")
YEARS = ("calc-ab-2026-q1", "calc-ab-2026-q2", "calc-ab-2026-q3",
         "calc-ab-2026-q4", "calc-ab-2026-q5", "calc-ab-2026-q6")

data = json.load(open(PATH, encoding="utf-8"))
by_id = {d["id"]: d for d in data}

problems = []

def check_field(where, s):
    opens = s.count("\\(")
    closes = s.count("\\)")
    if opens != closes:
        problems.append("%s: unbalanced delimiters (open=%d close=%d)" % (where, opens, closes))
    depth = 0
    i = 0
    n = len(s)
    while i < n:
        if s.startswith("\\(", i):
            depth += 1
            i += 2
            continue
        if s.startswith("\\)", i):
            depth -= 1
            if depth < 0:
                problems.append("%s: closing delimiter before any open" % where)
            i += 2
            continue
        if s[i] == "\\" and depth == 0:
            j = i + 1
            if j < n and s[j].isalpha():
                cmd = re.match(r"[A-Za-z]+", s[j:]).group(0)
                problems.append("%s: bare command \\%s outside delimiters: ...%s..." % (where, cmd, s[max(0, i-25):i+25]))
            elif j < n and s[j] == ",":
                problems.append("%s: bare thin space \\, outside delimiters" % where)
            else:
                problems.append("%s: bare backslash outside delimiters at byte %d" % (where, i))
            i += 1
            continue
        if s[i] in "^_$\u00a0" and depth == 0:
            problems.append("%s: bare '%s' outside delimiters: ...%s..." % (where, s[i], s[max(0, i-25):i+35]))
        i += 1
    if depth != 0:
        problems.append("%s: unclosed delimiter at end" % where)

for qid in YEARS:
    frq = by_id.get(qid)
    if not frq:
        problems.append(qid + " missing"); continue
    for where, s in [("prompt", frq.get("prompt") or ""), ("sampleResponse", frq.get("sampleResponse") or "")]:
        check_field(qid + " " + where, s)
    for part in (frq.get("parts") or []):
        check_field(qid + " " + part.get("label") + " text", part.get("text") or "")
        for rp in (part.get("rubricPoints") or []):
            check_field(qid + " " + rp.get("id") + " criterion", rp.get("criterion") or "")

if problems:
    print("FAIL: %d problem(s)" % len(problems))
    for p in problems[:60]:
        print(" -", p)
    sys.exit(1)

print("OK: all 2026 display fields have balanced \\(\\) delimiters and no bare math outside them")