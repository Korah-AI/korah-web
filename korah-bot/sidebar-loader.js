(async function () {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  // Resolve base from this script's URL — works at any server root
  const scriptEl = document.querySelector('script[src*="sidebar-loader.js"]');
  const base = scriptEl ? scriptEl.src.replace(/\/sidebar-loader\.js.*$/, '') : '';

  const res = await fetch(`${base}/sidebar.html`);
  const html = await res.text();
  root.innerHTML = html;

  // Prefix root-relative hrefs/srcs with the detected base so links work universally
  root.querySelectorAll('[href^="/"]').forEach(el => {
    el.setAttribute('href', base + el.getAttribute('href'));
  });
  root.querySelectorAll('[src^="/"]').forEach(el => {
    el.setAttribute('src', base + el.getAttribute('src'));
  });
  root.querySelectorAll('[data-base-url^="/"]').forEach(el => {
    el.setAttribute('data-base-url', base + el.getAttribute('data-base-url'));
  });

  // Mark active nav link by comparing resolved pathnames
  root.querySelectorAll('.sidebar-nav-link').forEach(a => {
    try {
      a.classList.toggle('active', new URL(a.href).pathname === window.location.pathname);
    } catch {}
  });

  if (window.Alpine) {
    window.Alpine.initTree(root);
  } else {
    document.addEventListener('alpine:initialized', () => window.Alpine.initTree(root), { once: true });
  }

  initElectricBorder(root);
})();

function initElectricBorder(root) {
  const wrapper = root.querySelector('.electric-border-wrapper');
  if (!wrapper) return;
  const canvas = wrapper.querySelector('.electric-border-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const COLOR = '#3b82f6';
  const SPEED = 0.6;
  const CHAOS = 0.15;
  const BORDER_RADIUS = 10;
  const OFFSET = 15;
  const DISP = 15;

  let t = 0, lastFrame = 0;

  function rnd(x) { return (Math.sin(x * 12.9898) * 43758.5453) % 1; }

  function noise2D(x, y) {
    const i = Math.floor(x), j = Math.floor(y);
    const fx = x - i, fy = y - j;
    const a = rnd(i + j*57), b = rnd(i+1 + j*57);
    const c = rnd(i + (j+1)*57), d = rnd(i+1 + (j+1)*57);
    const ux = fx*fx*(3 - 2*fx), uy = fy*fy*(3 - 2*fy);
    return a*(1-ux)*(1-uy) + b*ux*(1-uy) + c*(1-ux)*uy + d*ux*uy;
  }

  function octNoise(x, time, seed) {
    let val = 0, amp = CHAOS, freq = 10;
    for (let i = 0; i < 10; i++) {
      if (i > 0) val += amp * noise2D(freq*x + seed*100, time*freq*0.3);
      freq *= 1.6; amp *= 0.7;
    }
    return val;
  }

  function corner(cx, cy, r, a0, arc, p) {
    const a = a0 + p*arc;
    return { x: cx + r*Math.cos(a), y: cy + r*Math.sin(a) };
  }

  function rrPoint(t, l, top, w, h, r) {
    const sw = w-2*r, sh = h-2*r, ca = Math.PI*r/2;
    const d = t * (2*sw + 2*sh + 4*ca);
    let acc = 0;
    if (d <= acc+sw) return { x: l+r+(d-acc), y: top };          acc += sw;
    if (d <= acc+ca) return corner(l+w-r, top+r,   r, -Math.PI/2, Math.PI/2, (d-acc)/ca); acc += ca;
    if (d <= acc+sh) return { x: l+w, y: top+r+(d-acc) };        acc += sh;
    if (d <= acc+ca) return corner(l+w-r, top+h-r, r, 0,         Math.PI/2, (d-acc)/ca); acc += ca;
    if (d <= acc+sw) return { x: l+w-r-(d-acc), y: top+h };      acc += sw;
    if (d <= acc+ca) return corner(l+r,   top+h-r, r, Math.PI/2, Math.PI/2, (d-acc)/ca); acc += ca;
    if (d <= acc+sh) return { x: l, y: top+h-r-(d-acc) };        acc += sh;
    return corner(l+r, top+r, r, Math.PI, Math.PI/2, (d-acc)/ca);
  }

  function updateSize() {
    const rect = wrapper.getBoundingClientRect();
    const w = rect.width + OFFSET*2, h = rect.height + OFFSET*2;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = w*dpr; canvas.height = h*dpr;
    canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    return { width: w, height: h };
  }

  let { width, height } = updateSize();

  function draw(now) {
    t += ((now - lastFrame) / 1000) * SPEED;
    lastFrame = now;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    const bw = width - 2*OFFSET, bh = height - 2*OFFSET;
    const r = Math.min(BORDER_RADIUS, Math.min(bw, bh)/2);
    const perim = 2*(bw+bh) + 2*Math.PI*r;
    const samples = Math.floor(perim / 2);

    ctx.strokeStyle = COLOR; ctx.lineWidth = 1;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    for (let i = 0; i <= samples; i++) {
      const p = i / samples;
      const pt = rrPoint(p, OFFSET, OFFSET, bw, bh, r);
      const dx = pt.x + octNoise(p*8, t, 0)*DISP;
      const dy = pt.y + octNoise(p*8, t, 1)*DISP;
      if (i === 0) ctx.moveTo(dx, dy); else ctx.lineTo(dx, dy);
    }
    ctx.closePath();
    ctx.stroke();
    requestAnimationFrame(draw);
  }

  requestAnimationFrame(draw);
  new ResizeObserver(() => { const s = updateSize(); width = s.width; height = s.height; }).observe(wrapper);
}
