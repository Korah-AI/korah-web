# generate_rubric.py - AI-drafts the frqs.json FRQ + rubric blocks for one year
# of AP Calculus AB from scoring-guidelines text, validates them with the same
# checks build_2025.py runs, and splices them into frqs.json (idempotent per
# year: any existing entries for the year are replaced).
#
# Drafts are still AI-generated: review the printed IDs/points and the git
# diff against the official scoring guidelines before committing.
#
# Usage:
#   set GEMINI_API_KEY        (same env var api/r.js reads on Vercel)
#   python generate_rubric.py <year> <scoreguide-text.txt>
#   python generate_rubric.py 2024 ap24-scoreguide-text.txt --dry-run
#   python generate_rubric.py 2024 ap24-scoreguide-text.txt --parts 4 --points 9
#
# Optional flags:
#   --frqs-json PATH   target data file (defaults to ap/data/ap-calculus-ab/frqs.json)
#   --model NAME       default gemini-2.5-flash
#   --parts N / --points N   expected structure (default 4 parts, 9 rubric points)
#   --relax            downgrade part/point-count mismatches to warnings
#   --dry-run          validate and print, write nothing
import argparse
import io
import json
import os
import re
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
FRQS_JSON = os.path.join(HERE, '..', '..', 'data', 'ap-calculus-ab', 'frqs.json')
MODEL = 'gemini-2.5-flash'
CATEGORIES = ["integral-setup", "evaluation", "interpretation", "justification", "units", "notation"]


def parse_json(text):
    t = (text or '').strip()
    if t.startswith('```'):
        t = re.sub(r'^```[a-zA-Z]*\s*', '', t)
        t = re.sub(r'\s*```$', '', t)
    try:
        return json.loads(t)
    except Exception:
        pass
    start, end = t.find('{'), t.rfind('}')
    if start != -1 and end > start:
        try:
            return json.loads(t[start:end + 1])
        except Exception:
            return None
    return None


def call_gemini(api_key, system, user, model):
    url = 'https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s' % (model, api_key)
    payload = {
        'systemInstruction': {'parts': [{'text': system}]},
        'contents': [{'role': 'user', 'parts': [{'text': user}]}],
        'generationConfig': {'temperature': 0.2, 'responseMimeType': 'application/json'},
    }
    body = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', 'replace')
        raise RuntimeError('Gemini API error %s: %s' % (e.code, detail[:500]))
    try:
        return data['candidates'][0]['content']['parts'][0]['text']
    except (KeyError, IndexError, TypeError):
        raise RuntimeError('Unexpected Gemini response: %s' % json.dumps(data)[:500])


TEMPLATE_PROMPT = '''You are an AP Calculus AB content engineer preparing the free-response data file consumed by the grading app.

From the attached scoring-guidelines text, produce the entries for frqs.json for year %(year)d. The app grades against this data, so reflect the official scoring guidelines exactly: one rubric point per distinct thing the guideline scores, no invented bonus points.

SCHEMA - each FRQ object:
{
  "id": "calc-ab-%(year)d-q<questionNumber>",
  "course": "ap-calculus-ab",
  "year": %(year)d,
  "questionNumber": <int>,
  "title": "<short descriptive title>",
  "topic": "<one phrase, e.g. Applications of Integration>",
  "timeAllottedMin": 15,
  "calculatorAllowed": <true if the official exam allowed a calculator on this question, else false>,
  "sample": false,
  "stimulus": {"type": "text", "content": "<official context/statement given to the student, including any data table as prose or LaTeX>"},
  "prompt": "<full question text given to the student>",
  "parts": [
    {
      "label": "(a)",
      "text": "<part (a) as given to the student>",
      "rubricPoints": [
        {
          "id": "calc-ab-%(year)d-q<questionNumber>a-<n>",
          "criterion": "<what earns this point>",
          "category": "<one of the categories listed below>",
          "commonErrors": ["<common way students lose it>", "... more ..."],
          "exampleEarning": "<concrete example of full credit>",
          "exampleFailing": "<concrete example that misses the point>"
        }
      ]
    }
  ],
  "sampleResponse": "<a complete, concise full-credit response to every part>"
}

RULES:
- Emit ONE object per question present in the source text, numbered 1, 2, ... in the official order.
- %(parts)d parts per FRQ, labeled (a) through (d) (extend to (e) only if the official question really has one).
- Exactly %(points)d rubric points in total across all parts of each FRQ.
- Rubric point id for point number n of part label L is "calc-ab-%(year)d-q<questionNumber><L with parentheses/periods/spaces stripped>-<n>" - e.g. calc-ab-%(year)d-q1a-1, calc-ab-%(year)d-q2d-3.
- A part that earns several independent things (e.g. setup + evaluation + units) gets separate rubric points, each matching how the official guideline scores it.
- category must be one of: %(cats)s.
- Math in student-facing fields (stimulus.content, prompt, part text, criterion, sampleResponse) MUST be wrapped in inline KaTeX delimiters \\( ... \\). Fields that only feed the grading model (commonErrors, exampleEarning, exampleFailing) stay bare LaTeX with no delimiters.
- If a question shows a figure, do NOT embed an image tag. Put a prose description of the figure in the stimulus or prompt; if the source text does not fully describe it, append "(The figure is not embedded in this data file.)".
- sample must be false.
- Do not include math outer delimiters inside commonErrors/exampleEarning/exampleFailing; there is no rendering there.

RESPOND with ONLY this JSON object, no markdown, no commentary:
{"frqs": [ <FRQ objects> ]}

EXAMPLE of the exact shape (already-live data, same course):
%(example)s
'''


def build_prompt(year, parts, points, existing):
    example = ''
    for frq in existing:
        if frq.get('course') == 'ap-calculus-ab':
            example = json.dumps(frq, ensure_ascii=False, indent=2)
            break
    return TEMPLATE_PROMPT % {
        'year': year,
        'parts': parts,
        'points': points,
        'cats': ', '.join(CATEGORIES),
        'example': example,
    }


def display_fields(frq):
    out = []
    for key in ('prompt', 'sampleResponse'):
        v = frq.get(key)
        if isinstance(v, str) and v:
            out.append(v)
    stim = frq.get('stimulus') or {}
    if isinstance(stim, dict) and isinstance(stim.get('content'), str) and stim['content']:
        out.append(stim['content'])
    for p in frq.get('parts') or []:
        if isinstance(p.get('text'), str) and p['text']:
            out.append(p['text'])
        for rp in p.get('rubricPoints') or []:
            if isinstance(rp.get('criterion'), str) and rp['criterion']:
                out.append(rp['criterion'])
    return out


def check_balanced(fields):
    issues = []
    for f in fields:
        if f.count(r'\(') != f.count(r'\)'):
            issues.append('unbalanced delimiters (%d open, %d close) in: %r' % (f.count(r'\('), f.count(r'\)'), f[:80]))
        outside = re.sub(r'\\\(.*?\\\)', '', f, flags=re.S)
        outside = re.sub(r'\\n', '', outside)
        if '\\' in outside:
            issues.append('bare LaTeX outside delimiters in: %r' % outside[:100])
    return issues


def validate(frq, year, parts, points):
    core = []
    counts = []
    fid = frq.get('id') or ''
    if not fid.startswith('calc-ab-%d-q' % year):
        core.append('%s: id must start with calc-ab-%d-q' % (fid, year))
    parts_list = frq.get('parts')
    if not isinstance(parts_list, list):
        core.append('%s: parts must be a list' % fid)
        return core, counts
    if len(parts_list) != parts:
        counts.append('%s: expected %d parts, got %d' % (fid, parts, len(parts_list)))
    rp_total = 0
    seen = []
    for p in parts_list:
        if not isinstance(p.get('label'), str) or not p.get('label'):
            core.append('%s: part missing label' % fid)
        for rp in p.get('rubricPoints') or []:
            rp_total += 1
            rid = rp.get('id')
            if not isinstance(rid, str) or not rid.startswith('calc-ab-%d-q' % year):
                core.append('%s: rubric id %r must start with calc-ab-%d-q' % (fid, rid, year))
            if rid in seen:
                core.append('%s: duplicate rubric id %r' % (fid, rid))
            seen.append(rid)
            for field in ('criterion', 'category', 'exampleEarning', 'exampleFailing'):
                if not isinstance(rp.get(field), str) or not rp.get(field):
                    core.append('%s: rubric point %r missing %s' % (fid, rid, field))
            if not isinstance(rp.get('commonErrors'), list) or not rp.get('commonErrors'):
                core.append('%s: rubric point %r needs a non-empty commonErrors list' % (fid, rid))
    if rp_total != points:
        counts.append('%s: expected %d rubric points, got %d' % (fid, points, rp_total))
    core += check_balanced(display_fields(frq))
    return core, counts


def splice(existing, new_frqs, year, path):
    replaced = len([f for f in existing if (f.get('year') or 0) == year])
    kept = [f for f in existing if (f.get('year') or 0) != year]
    kept.extend(new_frqs)
    with io.open(path, 'w', encoding='utf-8', newline='') as fh:
        json.dump(kept, fh, ensure_ascii=False, indent=2)
    return replaced


def main():
    parser = argparse.ArgumentParser(description='AI-draft and splice one year of AP Calculus AB FRQ/rubric data.')
    parser.add_argument('year', type=int, help='exam year, e.g. 2024')
    parser.add_argument('text', help='path to the scoring-guidelines (or question) text file')
    parser.add_argument('--frqs-json', default=FRQS_JSON, help='target frqs.json (default: repo ap/data/ap-calculus-ab/frqs.json)')
    parser.add_argument('--model', default=MODEL)
    parser.add_argument('--parts', type=int, default=4)
    parser.add_argument('--points', type=int, default=9)
    parser.add_argument('--relax', action='store_true', help='downgrade part/point count mismatches to warnings')
    parser.add_argument('--dry-run', action='store_true', help='validate and print, write nothing')
    args = parser.parse_args()

    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        sys.stderr.write('GEMINI_API_KEY is not set. Run: set GEMINI_API_KEY=...  (same key api/r.js uses on Vercel)\n')
        sys.exit(2)

    with io.open(args.text, 'r', encoding='utf-8', errors='replace') as fh:
        source_text = fh.read()

    existing = []
    if os.path.exists(args.frqs_json):
        with io.open(args.frqs_json, 'r', encoding='utf-8') as fh:
            existing = json.load(fh)

    sys.stderr.write('calling %s for year %d...\n' % (args.model, args.year))
    system = build_prompt(args.year, args.parts, args.points, existing)
    raw = call_gemini(api_key, system, source_text, args.model)
    parsed = parse_json(raw)
    if parsed is None:
        sys.stderr.write('Gemini returned unparseable JSON. First 500 chars:\n%s\n' % raw[:500])
        sys.exit(1)
    new_frqs = parsed.get('frqs') if isinstance(parsed, dict) else parsed
    if not isinstance(new_frqs, list) or not new_frqs:
        sys.stderr.write('No FRQ objects found in the model output.\n')
        sys.exit(1)

    all_core, all_counts, all_warn = [], [], []
    for frq in new_frqs:
        core, counts = validate(frq, args.year, args.parts, args.points)
        all_core += core
        all_counts += counts

    for issue in all_core:
        print('ISSUE:', issue)
    for issue in all_counts:
        if args.relax:
            all_warn.append(issue)
        else:
            print('ISSUE:', issue)
    for issue in all_warn:
        print('WARN: ', issue)
    if all_core or (all_counts and not args.relax):
        print('validation failed; nothing written')
        sys.exit(1)

    print('validated %d FRQs for year %d (%d parts, %d points each)' % (len(new_frqs), args.year, args.parts, args.points))
    for frq in new_frqs:
        rp_total = sum(len(p.get('rubricPoints') or []) for p in (frq.get('parts') or []))
        print('  %s  %s  (%d parts, %d rubric points)' % (frq.get('id'), frq.get('title'), len(frq.get('parts') or []), rp_total))

    if args.dry_run:
        print('dry run: skipping write to %s' % args.frqs_json)
        return

    replaced = splice(existing, new_frqs, args.year, args.frqs_json)
    print('replaced %d existing %d FRQs, wrote %s' % (replaced, args.year, args.frqs_json))


if __name__ == '__main__':
    main()