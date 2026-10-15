import base64, os

HERE = os.path.dirname(os.path.abspath(__file__))
OLD = HERE
OUT = f"{HERE}/korah-sprites.html"

def uri(p):
    with open(p, "rb") as f:
        return "data:image/png;base64," + base64.b64encode(f.read()).decode()

sheet_v1 = uri(f"{OLD}/korah_idle_sheet.png")
sheet_v2 = uri(f"{HERE}/korah_idle_sheet_v2.png")

sizes = (16, 24, 32, 48, 64)
palettes = (8, 16)
rows = []
for c in palettes:
    cells = []
    for s in sizes:
        native = uri(f"{OLD}/sprites/korah_{s}px_{c}c.png")
        cells.append(f"""
      <figure class="cell">
        <div class="big"><img src="{native}" alt="korah {s}px {c} colors"></div>
        <div class="native"><img src="{native}" alt=""></div>
        <figcaption>{s}&times;{s} &middot; {c} colors</figcaption>
      </figure>""")
    rows.append(f"""
    <h3>{c}-color palette</h3>
    <div class="grid">{''.join(cells)}</div>""")

V2_LABELS = ["base", "breath", "blink", "turn 1", "turn 2", "turn 3", "turn 4", "turn 5"]
v2_strip = ''.join(
    f'<figure class="f"><div class="cel v2" style="background-position:-{i*96}px 0"></div>'
    f'<figcaption>{i} &middot; {lab}</figcaption></figure>'
    for i, lab in enumerate(V2_LABELS))
v1_strip = ''.join(
    f'<figure class="f"><div class="cel v1" style="background-position:-{i*96}px 0"></div>'
    f'<figcaption>{i}</figcaption></figure>' for i in range(6))

html = f"""<!doctype html>
<meta charset="utf-8">
<title>Korah sprite work</title>
<style>
  :root {{ --bg:#14121c; --panel:#1d1a29; --line:#332c48; --ink:#e8e4f5; --dim:#9a92b8; --accent:#9b5cf6; }}
  * {{ box-sizing:border-box; }}
  body {{ margin:0; padding:40px 24px 80px; background:var(--bg); color:var(--ink);
         font:15px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace; }}
  main {{ max-width:1100px; margin:0 auto; }}
  h1 {{ font-size:22px; margin:0 0 4px; }}
  h2 {{ font-size:16px; margin:48px 0 8px; color:var(--accent); }}
  h3 {{ font-size:13px; margin:24px 0 10px; color:var(--dim); font-weight:400; }}
  p.sub {{ color:var(--dim); margin:0 0 8px; }}
  img {{ image-rendering:pixelated; display:block; }}
  section {{ background:var(--panel); border:1px solid var(--line); border-radius:10px; padding:20px; }}
  .idle {{ display:flex; gap:32px; align-items:flex-end; flex-wrap:wrap; }}
  .anim {{ background-repeat:no-repeat; image-rendering:pixelated; }}
  .anim.s4 {{ width:256px; height:256px; background-size:2048px 256px; }}
  .anim.s2 {{ width:128px; height:128px; background-size:1024px 128px; }}
  .anim.s1 {{ width:64px;  height:64px;  background-size:512px 64px; }}
  .v2sheet {{ background-image:url("{sheet_v2}"); }}
  .v1sheet {{ background-image:url("{sheet_v1}"); }}
  .old {{ width:128px; height:128px; background:url("{sheet_v1}") 0 0/768px 128px no-repeat;
          image-rendering:pixelated; animation:oldloop 1.2s steps(6) infinite; }}
  @keyframes oldloop {{ from{{background-position:0 0}} to{{background-position:-768px 0}} }}
  .frames {{ display:flex; gap:10px; margin-top:20px; flex-wrap:wrap; }}
  .frames .f {{ margin:0; text-align:center; }}
  .cel {{ width:96px; height:96px; background-repeat:no-repeat; border:1px solid var(--line);
          border-radius:6px; image-rendering:pixelated; }}
  .cel.v2 {{ background-image:url("{sheet_v2}"); background-size:768px 96px; }}
  .cel.v1 {{ background-image:url("{sheet_v1}"); background-size:576px 96px; }}
  .grid {{ display:flex; gap:18px; align-items:flex-end; flex-wrap:wrap; }}
  .cell {{ margin:0; text-align:center; }}
  .big {{ border:1px solid var(--line); border-radius:6px; padding:6px; background:#0f0d16; }}
  .big img {{ width:160px; height:160px; }}
  .native {{ margin-top:8px; display:flex; justify-content:center; }}
  figcaption {{ margin-top:6px; font-size:11px; color:var(--dim); }}
  code {{ color:var(--accent); }}
  .bar {{ display:flex; gap:10px; align-items:center; margin-top:18px; flex-wrap:wrap; }}
  button {{ font:inherit; font-size:12px; color:var(--ink); background:#2a2540; cursor:pointer;
            border:1px solid var(--line); border-radius:6px; padding:6px 12px; }}
  button:hover {{ border-color:var(--accent); }}
  #state {{ font-size:12px; color:var(--dim); }}
</style>
<main>
  <h1>Korah sprite work</h1>
  <p class="sub">Source: <code>korah-bot/logo-images/newlogo2.png</code>, pixelized by
  <code>pixelize.py</code> (PIL BOX downscale + median-cut quantize, hard alpha cut at 128).</p>

  <h2>Idle v2 &mdash; rare blink, occasional page turn</h2>
  <section>
    <p class="sub">512&times;64 sheet, 8 frames. Breathing loops at 0.55s. A blink fires every
    4&ndash;7.5s (140ms, doubled about a third of the time). A page turn fires every 9&ndash;15s
    (5 frames at 110ms). Events never overlap.</p>
    <div class="idle">
      <div><div class="anim s4 v2sheet"></div><figcaption>4&times;</figcaption></div>
      <div><div class="anim s2 v2sheet"></div><figcaption>2&times;</figcaption></div>
      <div><div class="anim s1 v2sheet"></div><figcaption>1&times; (64px)</figcaption></div>
    </div>
    <div class="bar">
      <button id="doBlink">blink now</button>
      <button id="doTurn">turn page now</button>
      <span id="state">idle</span>
    </div>
    <div class="frames">{v2_strip}</div>
  </section>

  <h2>Idle v1 &mdash; original 6-frame loop (kept)</h2>
  <section>
    <p class="sub">384&times;64, blinks once every 1.2s cycle. Left in place for comparison.</p>
    <div class="idle"><div><div class="old"></div><figcaption>2&times;</figcaption></div></div>
    <div class="frames">{v1_strip}</div>
  </section>

  <h2>Static sprites &mdash; size &times; palette matrix</h2>
  <section>
    <p class="sub">Each shown scaled to 160px (nearest-neighbour) with the true pixel size underneath.</p>
    {''.join(rows)}
  </section>
</main>
<script>
  const BASE = 0, BREATH = 1, BLINK = 2, TURN = [3, 4, 5, 6, 7];
  const els = [...document.querySelectorAll('.anim')];
  const state = document.getElementById('state');
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rand = (a, b) => a + Math.random() * (b - a);
  let busy = false, up = false;

  function show(i) {{
    for (const el of els) {{
      const scale = el.classList.contains('s4') ? 4 : el.classList.contains('s2') ? 2 : 1;
      el.style.backgroundPosition = `-${{i * 64 * scale}}px 0`;
    }}
  }}

  async function blink() {{
    busy = true; state.textContent = 'blink';
    const times = Math.random() < 0.35 ? 2 : 1;   // sometimes a double blink
    for (let n = 0; n < times; n++) {{
      if (n) await sleep(130);
      show(BLINK); await sleep(140); show(BASE);
    }}
    state.textContent = 'idle'; busy = false;
  }}

  async function turnPage() {{
    busy = true; state.textContent = 'page turn';
    for (const f of TURN) {{ show(f); await sleep(110); }}
    show(BASE); await sleep(120);
    state.textContent = 'idle'; busy = false;
  }}

  (async function breathe() {{
    while (true) {{
      if (!busy) {{ up = !up; show(up ? BREATH : BASE); }}
      await sleep(550);
    }}
  }})();

  async function every(min, max, fn) {{
    while (true) {{
      await sleep(rand(min, max));
      if (!busy) await fn();
    }}
  }}
  every(4000, 7500, blink);
  every(9000, 15000, turnPage);

  document.getElementById('doBlink').onclick = () => {{ if (!busy) blink(); }};
  document.getElementById('doTurn').onclick = () => {{ if (!busy) turnPage(); }};
  show(BASE);
</script>
"""

with open(OUT, "w") as f:
    f.write(html)
print(OUT, os.path.getsize(OUT), "bytes")
