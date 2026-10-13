// SVG figure helpers for the AP MCQ banks. Text and axes use currentColor so
// figures follow the page theme; data marks use fixed mid-tone colors that read
// on both light and dark surfaces.
const BLUE = '#3b82f6', PINK = '#ec4899', AMBER = '#f59e0b';
const r = n => Math.round(n * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const open = (w, h, alt) => `<svg class="ap-fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(alt)}" font-family="inherit" font-size="12" fill="none" stroke-linecap="round" stroke-linejoin="round">`;

// Coordinate-plane graph. curves: [{ fn, from, to } | { pts: [[x, y], ...] }], each with optional color / dash.
// dots: [{ x, y, open }]. segments: short slope-field marks. shade: [{ top, bottom, from, to }].
function graph({ x: [xmin, xmax], y: [ymin, ymax], xstep = 1, ystep = 1, xlabel = 'x', ylabel = 'y', curves = [], dots = [], shade = [], field = null, notes = [], w = 340, h = 280, alt }) {
  const L = 28, R = 18, T = 16, B = 24;
  const sx = v => r(L + (v - xmin) / (xmax - xmin) * (w - L - R)), sy = v => r(h - B - (v - ymin) / (ymax - ymin) * (h - T - B));
  const x0 = sx(Math.min(Math.max(0, xmin), xmax)), y0 = sy(Math.min(Math.max(0, ymin), ymax));
  let s = open(w, h, alt);
  for (let v = Math.ceil(xmin / xstep) * xstep; v <= xmax + 1e-9; v += xstep) {
    s += `<line x1="${sx(v)}" y1="${sy(ymin)}" x2="${sx(v)}" y2="${sy(ymax)}" stroke="currentColor" stroke-opacity=".22"/>`;
    if (Math.abs(v) > 1e-9) s += `<text x="${sx(v)}" y="${y0 + 13}" text-anchor="middle" fill="currentColor">${esc(r(v))}</text>`;
  }
  for (let v = Math.ceil(ymin / ystep) * ystep; v <= ymax + 1e-9; v += ystep) {
    s += `<line x1="${sx(xmin)}" y1="${sy(v)}" x2="${sx(xmax)}" y2="${sy(v)}" stroke="currentColor" stroke-opacity=".22"/>`;
    if (Math.abs(v) > 1e-9) s += `<text x="${x0 - 5}" y="${sy(v) + 4}" text-anchor="end" fill="currentColor">${esc(r(v))}</text>`;
  }
  for (const a of shade) {
    const n = 60, top = [], bottom = [];
    for (let i = 0; i <= n; i++) { const v = a.from + (a.to - a.from) * i / n; top.push(`${sx(v)},${sy(a.top(v))}`); bottom.unshift(`${sx(v)},${sy(a.bottom ? a.bottom(v) : 0)}`); }
    s += `<polygon points="${top.concat(bottom).join(' ')}" fill="${BLUE}" fill-opacity=".22"/>`;
  }
  s += `<path d="M${sx(xmin)} ${y0}H${sx(xmax) + 8}M${x0} ${sy(ymin)}V${sy(ymax) - 8}" stroke="currentColor" stroke-width="1.5"/>`;
  s += `<text x="${sx(xmax) + 12}" y="${y0 + 4}" fill="currentColor" font-style="italic">${esc(xlabel)}</text><text x="${x0 + 7}" y="${sy(ymax) - 2}" fill="currentColor" font-style="italic">${esc(ylabel)}</text>`;
  if (field) for (let gx = Math.ceil(xmin); gx <= xmax; gx++) for (let gy = Math.ceil(ymin); gy <= ymax; gy++) {
    const m = field(gx, gy), ang = Math.atan(m * ((h - T - B) / (ymax - ymin)) / ((w - L - R) / (xmax - xmin))), d = 8;
    s += `<line x1="${r(sx(gx) - d * Math.cos(ang))}" y1="${r(sy(gy) + d * Math.sin(ang))}" x2="${r(sx(gx) + d * Math.cos(ang))}" y2="${r(sy(gy) - d * Math.sin(ang))}" stroke="${BLUE}" stroke-width="1.6"/>`;
  }
  for (const c of curves) {
    let pts = c.pts;
    if (!pts) { pts = []; for (let i = 0; i <= 120; i++) { const v = c.from + (c.to - c.from) * i / 120; pts.push([v, c.fn(v)]); } }
    s += `<polyline points="${pts.map(([a, b]) => `${sx(a)},${sy(b)}`).join(' ')}" stroke="${c.color || BLUE}" stroke-width="2.2"${c.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
  }
  for (const d of dots) s += `<circle cx="${sx(d.x)}" cy="${sy(d.y)}" r="3.6" stroke="${d.color || BLUE}" stroke-width="2" fill="${d.open ? 'var(--ap-fig-bg, #fff)' : (d.color || BLUE)}"/>`;
  for (const n of notes) s += `<text x="${sx(n.x)}" y="${sy(n.y)}" text-anchor="${n.anchor || 'start'}" fill="currentColor" font-style="italic" font-size="12">${esc(n.text)}</text>`;
  return { svg: s + '</svg>', alt };
}

// Bar or line chart over categories. series: [{ name, values, color }]
function chart({ type = 'bar', title, categories, series, ymax, ystep, ylabel = '', fmt = v => v, w = 440, h = 290, alt }) {
  const L = 46, R = 12, T = 34, B = series.length > 1 ? 52 : 34, pw = w - L - R, ph = h - T - B;
  const sy = v => r(h - B - v / ymax * ph), band = pw / categories.length, colors = [BLUE, PINK, AMBER];
  let s = open(w, h, alt || title);
  s += `<text x="${w / 2}" y="15" text-anchor="middle" fill="currentColor" font-size="12.5" font-weight="700">${esc(title)}</text>`;
  if (ylabel) s += `<text x="${L - 40}" y="28" fill="currentColor" font-size="10">${esc(ylabel)}</text>`;
  for (let v = 0; v <= ymax + 1e-9; v += ystep) s += `<line x1="${L}" y1="${sy(v)}" x2="${w - R}" y2="${sy(v)}" stroke="currentColor" stroke-opacity="${v ? '.22' : '.9'}"/><text x="${L - 6}" y="${sy(v) + 4}" text-anchor="end" fill="currentColor">${esc(fmt(r(v)))}</text>`;
  categories.forEach((c, i) => { s += `<text x="${r(L + band * (i + .5))}" y="${h - B + 14}" text-anchor="middle" fill="currentColor" font-size="${categories.length > 9 ? 9.5 : 11}">${esc(c)}</text>`; });
  series.forEach((sr, k) => {
    const color = sr.color || colors[k];
    if (type === 'bar') {
      const bw = band * .7 / series.length;
      sr.values.forEach((v, i) => { if (v != null) s += `<rect x="${r(L + band * i + band * .15 + bw * k)}" y="${sy(v)}" width="${r(bw - 1)}" height="${r(sy(0) - sy(v))}" fill="${color}"/>`; });
    } else {
      s += `<polyline points="${sr.values.map((v, i) => `${r(L + band * (i + .5))},${sy(v)}`).join(' ')}" stroke="${color}" stroke-width="2.4"/>`;
      sr.values.forEach((v, i) => { s += `<circle cx="${r(L + band * (i + .5))}" cy="${sy(v)}" r="3" fill="${color}"/>`; });
    }
    if (series.length > 1) s += `<rect x="${L + k * 190}" y="${h - 16}" width="11" height="11" fill="${color}"/><text x="${L + k * 190 + 16}" y="${h - 6.5}" fill="currentColor">${esc(sr.name)}</text>`;
  });
  return { svg: s + '</svg>', alt: alt || title };
}

const table = (headers, rows, alt) => ({ table: { headers, rows }, alt });

module.exports = { graph, chart, table };
