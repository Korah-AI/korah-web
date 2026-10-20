// Shared helpers for the FRQ sources in this folder. Each FRQ is original Korah practice
// modeled part for part on a College Board released free-response question, which
// `modeledOn` names and links. Nothing here reproduces College Board question text.

// A rubric point: one earnable point, scored independently, as in the official guidelines.
const pt = (id, category, criterion, commonErrors, exampleEarning, exampleFailing) => ({ id, category, criterion, commonErrors, exampleEarning, exampleFailing });

// A part of a question. `figures` (optional) render under the part's text on the page only.
const part = (label, text, rubricPoints, figures) => (figures ? { label, text, rubricPoints, figures } : { label, text, rubricPoints });

const { draw } = require('../ap-mcq-build/diagram.cjs');

const text = (x, y, s, o = {}) => ['text', x, y, s, { italic: false, ...o }];
const fig = (caption, f) => ({ ...f, caption });

// Blank axes for a student sketch, with optional dashed time markers.
function axes(alt, ylabel, marks = [], w = 340, h = 200) {
  const items = [['arrow', 40, 170, 320, 170, { color: 'currentColor', width: 1.6 }], ['arrow', 40, 180, 40, 20, { color: 'currentColor', width: 1.6 }], text(30, 26, ylabel, { anchor: 'end', italic: true }), text(325, 186, 't', { italic: true }), text(32, 184, 'O', { italic: true, anchor: 'end' })];
  for (const [x, l] of marks) items.push(['line', x, 30, x, 170, { dash: true, width: 1 }], text(x, 186, l, { italic: true }));
  return draw(w, h, alt, items);
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// A data table as a page figure (also described in the stimulus text for the grader).
const tableFigure = (caption, headers, rows) => ({ caption, alt: caption + ': ' + rows.map(r => headers.map((h, i) => `${h} ${r[i]}`).join(', ')).join('; '), table: { headers, rows } });

// The text of a table, for the grader-facing stimulus.
const tableText = (caption, headers, rows) => caption + '\n' + headers.join(' | ') + '\n' + rows.map(r => r.join(' | ')).join('\n');

module.exports = { pt, part, esc, tableFigure, tableText, text, fig, axes };
