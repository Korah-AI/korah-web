import json
data = json.load(open(r"C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\frqs.json", encoding="utf-8"))
for d in data:
    keys = sorted(d.keys())
    print(d["id"], "| year", d.get("year"), "| q", d.get("questionNumber"), "| cal", d.get("calculatorAllowed"), "| sample?", d.get("sample"), "| keys:", keys)
