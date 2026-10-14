// US Letter flyer: Korah CODE internship, korah.app and the Instagram.
import { qrSvg } from './qr.mjs';

const INK = '#21134d';
const short = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

function qrBox(url, cls = '') {
  return `<div class="qr-box notch ${cls}"><div class="qr-in notch">${qrSvg(url, { level: 'M', dark: INK, quiet: 2 })}</div></div>`;
}

export function flyerPage(links) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Korah flyer</title><style>
@font-face{font-family:Jakarta;font-weight:500;src:url(assets/fonts/PlusJakartaSans-Medium.ttf)}
@font-face{font-family:Jakarta;font-weight:700;src:url(assets/fonts/PlusJakartaSans-Bold.ttf)}
@font-face{font-family:Jakarta;font-weight:800;src:url(assets/fonts/PlusJakartaSans-ExtraBold.ttf)}
@page{size:8.5in 11in;margin:0}
:root{--ink:${INK};--paper:#faf8ff;--purple:#7c3aed;--soft:#8b5cf6;--lilac:#e9e2ff;--mid:#55477c;--s:6px}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:816px;height:1056px}
body{font-family:Jakarta,system-ui,sans-serif;font-weight:500;color:var(--ink);background:var(--paper);padding:38px 44px 0;-webkit-print-color-adjust:exact;print-color-adjust:exact;overflow:hidden}
.notch{clip-path:polygon(0 calc(2*var(--s)),var(--s) calc(2*var(--s)),var(--s) var(--s),calc(2*var(--s)) var(--s),calc(2*var(--s)) 0,calc(100% - 2*var(--s)) 0,calc(100% - 2*var(--s)) var(--s),calc(100% - var(--s)) var(--s),calc(100% - var(--s)) calc(2*var(--s)),100% calc(2*var(--s)),100% calc(100% - 2*var(--s)),calc(100% - var(--s)) calc(100% - 2*var(--s)),calc(100% - var(--s)) calc(100% - var(--s)),calc(100% - 2*var(--s)) calc(100% - var(--s)),calc(100% - 2*var(--s)) 100%,calc(2*var(--s)) 100%,calc(2*var(--s)) calc(100% - var(--s)),var(--s) calc(100% - var(--s)),var(--s) calc(100% - 2*var(--s)),0 calc(100% - 2*var(--s)))}
ul{list-style:none}

.top{display:flex;align-items:center;justify-content:space-between;height:52px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:30px;letter-spacing:-.02em}
.brand img{height:50px}
.top p{font-size:13.5px;font-weight:700;color:var(--mid)}

.hero{position:relative;margin-top:14px;height:488px;background:var(--ink);color:#fff;--s:9px;padding:34px 36px;display:grid;grid-template-columns:1fr 226px;gap:26px}
.chip{display:inline-block;background:var(--soft);color:#fff;font-weight:700;font-size:13px;padding:6px 12px;--s:3px}
h1{font-weight:800;font-size:56px;line-height:1;letter-spacing:-.035em;margin-top:16px}
h1 em{font-style:normal;color:#c4b0ff}
.lede{margin-top:14px;font-size:15.5px;line-height:1.45;color:#ddd4ff;max-width:420px}
.lede b{color:#fff;font-weight:700}
.facts{display:grid;grid-template-columns:repeat(4,auto);justify-content:start;gap:8px;margin-top:18px}
.facts li{border:2px solid #4a3a8a;padding:7px 11px}
.facts b{display:block;font-weight:800;font-size:17px;line-height:1.1}
.facts span{font-size:11px;color:#b9abea;font-weight:700}
.points{margin-top:18px;display:grid;gap:8px;max-width:440px}
.points li{position:relative;padding-left:20px;font-size:14px;line-height:1.38;color:#efeaff}
.points li::before{content:"";position:absolute;left:0;top:5px;width:9px;height:9px;background:var(--soft)}
.side{display:flex;flex-direction:column;align-items:center;justify-content:space-between}
.side>img{width:186px;margin-top:-10px}
.scan{width:100%;background:#fff;color:var(--ink);--s:5px;padding:12px 12px 11px;text-align:center}
.qr-box{background:var(--ink);padding:var(--s);--s:4px}
.qr-in{background:#fff;padding:3px}
.qr-in svg{display:block;width:100%;height:auto}
.scan .qr-box{width:142px;margin:0 auto}
.scan b{display:block;margin-top:8px;font-weight:800;font-size:15px;line-height:1.15}
.url{font-size:11px;font-weight:700;color:var(--purple);margin-top:3px;word-break:break-all}

.duo{margin-top:16px;display:grid;grid-template-columns:1.42fr 1fr;gap:16px;height:388px}
.panel{position:relative;--s:7px;padding:26px 26px 22px;display:flex;flex-direction:column}
.site{background:var(--lilac)}
.insta{background:var(--purple);color:#fff;align-items:center;text-align:center}
.insta .kicker,.panel.insta>p{color:#e6dcff}
.insta .kicker{margin-top:8px}
.kicker{font-size:12.5px;font-weight:700;color:var(--purple)}
h2{font-weight:800;font-size:29px;line-height:1.05;letter-spacing:-.03em;margin-top:5px}
.panel>p{font-size:14px;line-height:1.42;color:var(--mid);margin-top:9px}
.site>p{max-width:265px}
.site .mascot{position:absolute;right:24px;top:16px;width:112px}
.site .points{margin-top:20px;gap:9px}
.site .points li{color:var(--ink);font-size:13.5px}
.site .points li::before{background:var(--purple)}
.go{margin-top:auto;display:flex;align-items:center;gap:16px}
.go .qr-box{width:116px;flex:none}
.go b{display:block;font-weight:800;font-size:17px;line-height:1.15}
.go small{display:block;font-size:12.5px;color:var(--mid);margin-top:5px;line-height:1.35;font-weight:700}
.insta .mascot{width:80px;margin-top:-8px}
.insta h2{font-size:26px;margin-top:6px}
.insta h2 span{display:block}
.insta .qr-box{width:128px;margin-top:auto}
.insta b{font-weight:800;font-size:15px;margin-top:9px}

footer{margin-top:14px;display:flex;justify-content:space-between;font-size:12.5px;font-weight:700;color:var(--mid)}
footer span:last-child{color:var(--ink)}
</style></head><body>

<header class="top">
  <div class="brand"><img src="assets/wave.png" alt="">Korah</div>
  <p>Free study tools, built by students</p>
</header>

<section class="hero notch">
  <div>
    <span class="chip notch">Korah CODE internship · Fall 2026 cohort</span>
    <h1>Ship real code<br><em>this fall.</em></h1>
    <p class="lede">Six weeks of learning <b>agentic programming</b>: using AI to write code you actually understand, not slop. Then you put it to work on a site students use every day.</p>
    <ul class="facts">
      <li><b>6 weeks</b><span>Lessons and projects</span></li>
      <li><b>4–8 interns</b><span>Small cohort</span></li>
      <li><b>All grades</b><span>Any high schooler</span></li>
    </ul>
    <ul class="points">
      <li>Build features that ship to the live Korah site.</li>
      <li>Design and launch a capstone project of your own.</li>
      <li>Get mentored directly, in HTML, CSS and JavaScript.</li>
    </ul>
  </div>
  <div class="side">
    <img src="assets/laptop.png" alt="">
    <div class="scan notch">
      ${qrBox(links.internship)}
      <b>Scan to apply</b>
      <div class="url">${short(links.internship)}</div>
    </div>
  </div>
</section>

<section class="duo">
  <article class="panel site notch">
    <img class="mascot" src="assets/check.png" alt="">
    <span class="kicker">The website</span>
    <h2>Free SAT and<br>AP prep</h2>
    <ul class="points">
      <li>3,500+ SAT practice questions, all tracked</li>
      <li>An AI tutor that teaches you Desmos shortcuts</li>
      <li>A college essay editor with line-by-line feedback</li>
      <li>Free 1-on-1 tutoring from 1500+ scorers</li>
    </ul>
    <div class="go">
      ${qrBox(links.website)}
      <div><b>Scan to start studying</b><div class="url" style="font-size:13px">${short(links.website)}</div><small>$0. No fees, ever.</small></div>
    </div>
  </article>
  <article class="panel insta notch">
    <img class="mascot" src="assets/wave.png" alt="">
    <span class="kicker">Instagram</span>
    <h2>Follow <span>@korah.app</span></h2>
    <p>See what the team is building next.</p>
    ${qrBox(links.instagram)}
    <b>Scan to follow</b>
  </article>
</section>

<footer><span>Made for students, by students.</span><span>korah.app</span></footer>
</body></html>`;
}
