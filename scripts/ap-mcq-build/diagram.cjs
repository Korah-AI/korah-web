// Free-form SVG diagrams (apparatus, free-body setups) for the AP MCQ banks.
// Like figures.cjs, outlines and labels use currentColor so they follow the theme;
// vectors use a fixed blue that reads on light and dark surfaces.
const BLUE = '#3b82f6';
const r = n => Math.round(n * 100) / 100;
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// items: ['line', x1, y1, x2, y2, opts] | ['arrow', x1, y1, x2, y2, opts] | ['rect', x, y, w, h, opts]
//      | ['circle', cx, cy, r, opts] | ['poly', [[x, y], ...], opts] | ['path', d, opts]
//      | ['text', x, y, string, opts] | ['hatch', x1, y1, x2, y2] (a fixed surface, hatched on its right-hand side)
// opts: { dash, color, width, fill (true = light tint, or a color), rotate: [deg, cx, cy], anchor, italic, size, bold }
function draw(w, h, alt, items) {
  let s = `<svg class="ap-fig" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(alt)}" font-family="inherit" font-size="13" fill="none" stroke-linecap="round" stroke-linejoin="round">`;
  const common = o => {
    const fill = o.fill === true ? ' fill="currentColor" fill-opacity=".14"' : o.fill ? ` fill="${o.fill}"` : '';
    return ` stroke="${o.color || 'currentColor'}" stroke-width="${o.width || 1.8}"${o.dash ? ' stroke-dasharray="5 4"' : ''}${fill}${o.rotate ? ` transform="rotate(${o.rotate.join(' ')})"` : ''}`;
  };
  for (const [kind, ...a] of items) {
    if (kind === 'line') { const [x1, y1, x2, y2, o = {}] = a; s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${common(o)}/>`; }
    else if (kind === 'arrow') {
      const [x1, y1, x2, y2, o = {}] = a, color = o.color || BLUE, ang = Math.atan2(y2 - y1, x2 - x1), L = 9, W = 4;
      const bx = x2 - L * Math.cos(ang), by = y2 - L * Math.sin(ang);
      s += `<line x1="${x1}" y1="${y1}" x2="${r(bx)}" y2="${r(by)}" stroke="${color}" stroke-width="${o.width || 2.4}"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>`;
      s += `<polygon points="${x2},${y2} ${r(bx - W * Math.sin(ang))},${r(by + W * Math.cos(ang))} ${r(bx + W * Math.sin(ang))},${r(by - W * Math.cos(ang))}" fill="${color}" stroke="${color}" stroke-width="1"/>`;
    }
    else if (kind === 'rect') { const [x, y, rw, rh, o = {}] = a; s += `<rect x="${x}" y="${y}" width="${rw}" height="${rh}"${common(o)}/>`; }
    else if (kind === 'circle') { const [cx, cy, cr, o = {}] = a; s += `<circle cx="${cx}" cy="${cy}" r="${cr}"${common(o)}/>`; }
    else if (kind === 'poly') { const [pts, o = {}] = a; s += `<polygon points="${pts.map(p => p.join(',')).join(' ')}"${common(o)}/>`; }
    else if (kind === 'path') { const [d, o = {}] = a; s += `<path d="${d}"${common(o)}/>`; }
    else if (kind === 'text') { const [x, y, str, o = {}] = a; s += `<text x="${x}" y="${y}" text-anchor="${o.anchor || 'middle'}" fill="${o.color || 'currentColor'}"${o.italic === false ? '' : ' font-style="italic"'}${o.bold ? ' font-weight="700"' : ''}${o.size ? ` font-size="${o.size}"` : ''}>${esc(str)}</text>`; }
    else if (kind === 'hatch') {
      const [x1, y1, x2, y2] = a, len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len, nx = -uy, ny = ux;
      s += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="2"/>`;
      for (let d = 4; d < len; d += 9) s += `<line x1="${r(x1 + ux * d)}" y1="${r(y1 + uy * d)}" x2="${r(x1 + ux * d + (nx - ux) * 7)}" y2="${r(y1 + uy * d + (ny - uy) * 7)}" stroke="currentColor" stroke-opacity=".55" stroke-width="1"/>`;
    }
    else throw new Error('Unknown diagram item: ' + kind);
  }
  return { svg: s + '</svg>', alt };
}

// A coil spring drawn as a zigzag from (x1, y) to (x2, y).
const spring = (x1, x2, y, coils = 8, amp = 7) => {
  const n = coils * 2, step = (x2 - x1 - 16) / n;
  let d = `M${x1} ${y}H${x1 + 8}`;
  for (let i = 0; i < n; i++) d += `L${r(x1 + 8 + step * (i + 0.5))} ${y + (i % 2 ? amp : -amp)}`;
  return ['path', d + `L${x2 - 8} ${y}H${x2}`];
};

module.exports = { draw, spring, BLUE };
