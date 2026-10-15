import io
import json

p = r'C:\devbushi\korah-internship\korah-bot\ap\data\ap-calculus-ab\frqs.json'
text = io.open(p, encoding='utf-8').read()
needle = '"calc-ab-2026-q1"'
idx = text.index(needle)
open_brace = text.rfind('{', 0, idx)
assert text[:open_brace].rstrip().endswith(','), 'expected comma separator before 2026 block'
first_brace = text.index('{')
head = text[:first_brace + 1]
new_text = head + text[open_brace + 1:]
data = json.loads(new_text)
assert isinstance(data, list) and len(data) == 6, len(data)
years = [d['year'] for d in data]
assert all(y == 2026 for y in years), years
io.open(p, 'w', encoding='utf-8', newline='').write(new_text)
print('kept', len(data), 'FRQs:', [d['id'] for d in data])