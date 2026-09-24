/**
 * KorahMathEditor — math-chip contenteditable editor + no-LaTeX math palette.
 *
 * Backs the "Correct my transcription" step and, since Phase 3, the typed
 * answer box (spec: ap/data/ap-calculus-ab/transcription-correct-spec.md). The
 * editor keeps a single underlying source string — raw LaTeX with \( ... \)
 * (and optional $$ ... $$) math — and renders each balanced math segment as an
 * atomic, KaTeX-rendered "chip". Plain text stays editable; chips are
 * read-only; a chip expands to raw-LaTeX editing on double-click / Enter, and
 * the palette inserts correctly-formed tokens at the caret so transcription
 * (or answer) math can be written without knowing LaTeX.
 *
 * Serialization is exact: setValue(raw) -> DOM -> getValue() === raw.
 *
 * Usage:
 *   const ed = KorahMathEditor.attach(document.getElementById('transcript-editor'), {
 *     value: state.transcript,        // optional initial source
 *     onInput: (source) => { ... },   // optional, fires on change
 *     wrapMath: false,                // optional: wrap palette inserts in \(...\)
 *                                     // when the caret is in plain text so they
 *                                     // become math chips (Phase 3, typed box)
 *     noun: 'transcription',          // optional label used in the length message
 *   });
 *   KorahMathEditor.attachPalette(document.getElementById('math-palette-host'), ed);
 */
(function (global) {
  'use strict';

  var doc = global.document;
  var MAX_LEN = 20000;

  var MATH_TOKEN_RE = /\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$/g;

  /* ── Token catalog for the mini math keyboard ────────────────────────────── */
  /* insert     : raw LaTeX snippet placed at the caret
   * caret      : offset in `insert` where the caret lands after insertion
   *              (defaults to end of `insert`)
   * select     : optional [from, to] offsets in `insert` to highlight
   *              (used when the snippet ships with default content)            */
  var TOKENS = [
    {
      group: 'Symbols',
      keys: [
        { glyph: '+', insert: '+', aria: 'plus' },
        { glyph: '−', insert: '-', aria: 'minus' },
        { glyph: '=', insert: '=', aria: 'equals' },
        { glyph: '<', insert: '<', aria: 'less than' },
        { glyph: '≤', insert: '\\leq', aria: 'less than or equal' },
        { glyph: '≥', insert: '\\geq', aria: 'greater than or equal' },
        { glyph: '≠', insert: '\\neq', aria: 'not equal' },
        { glyph: '≈', insert: '\\approx', aria: 'approximately equal' },
        { glyph: '±', insert: '\\pm', aria: 'plus or minus' },
        { glyph: '×', insert: '\\times', aria: 'times' },
        { glyph: '·', insert: '\\cdot', aria: 'middle dot' },
      ],
    },
    {
      group: 'Fractions & roots',
      keys: [
        { glyph: '⅟', insert: '\\frac{}{}', caret: 6, aria: 'fraction — numerator first' },
        { glyph: '⅟ᵈ', insert: '\\dfrac{}{}', caret: 7, aria: 'large fraction — numerator first' },
        { glyph: '√', insert: '\\sqrt{}', caret: 6, aria: 'square root' },
        { glyph: '∛', insert: '\\sqrt[]{}', caret: 6, aria: 'nth root — type the root index first' },
      ],
    },
    {
      group: 'Powers & subscripts',
      keys: [
        { glyph: 'x²', insert: '^{}', caret: 2, aria: 'superscript' },
        { glyph: 'xₙ', insert: '_{}', caret: 2, aria: 'subscript' },
        { glyph: 'eˣ', insert: 'e^{}', caret: 4, aria: 'e to a power' },
        { glyph: '′', insert: "'", aria: 'prime (derivative)' },
      ],
    },
    {
      group: 'Integrals & limits',
      keys: [
        { glyph: '∫', insert: '\\int', aria: 'integral' },
        { glyph: '∫ₐᵇ', insert: '\\int_{}^{}', caret: 6, aria: 'definite integral — lower bound first' },
        { glyph: 'lim', insert: '\\lim', aria: 'limit' },
        { glyph: 'lim→', insert: '\\lim_{x\\to x_0}', caret: 6, select: [6, 15], aria: 'limit as x approaches a value' },
        { glyph: 'Σ', insert: '\\sum_{}^{}', caret: 6, aria: 'summation — start index first' },
        { glyph: '∏', insert: '\\prod_{}^{}', caret: 7, aria: 'product — start index first' },
        { glyph: 'd/dx', insert: '\\frac{d}{dx}', caret: 6, select: [6, 7], aria: 'derivative operator' },
        { glyph: '∞', insert: '\\infty', aria: 'infinity' },
      ],
    },
    {
      group: 'Greek',
      keys: [
        { glyph: 'π', insert: '\\pi', aria: 'pi' },
        { glyph: 'θ', insert: '\\theta', aria: 'theta' },
        { glyph: 'α', insert: '\\alpha', aria: 'alpha' },
        { glyph: 'β', insert: '\\beta', aria: 'beta' },
        { glyph: 'γ', insert: '\\gamma', aria: 'gamma' },
        { glyph: 'Δ', insert: '\\Delta', aria: 'capital delta' },
        { glyph: 'μ', insert: '\\mu', aria: 'mu' },
        { glyph: 'λ', insert: '\\lambda', aria: 'lambda' },
      ],
    },
    {
      group: 'Trig & functions',
      keys: [
        { glyph: 'sin', insert: '\\sin', aria: 'sine' },
        { glyph: 'cos', insert: '\\cos', aria: 'cosine' },
        { glyph: 'tan', insert: '\\tan', aria: 'tangent' },
        { glyph: 'ln', insert: '\\ln', aria: 'natural log' },
        { glyph: 'log', insert: '\\log', aria: 'logarithm' },
        { glyph: 'f(x)', insert: 'f(x)', caret: 4, aria: 'function of x' },
      ],
    },
  ];

  /* ── Source ⇄ DOM ────────────────────────────────────────────────────────── */

  function tokenize(source) {
    var tokens = [];
    var last = 0;
    var m;
    MATH_TOKEN_RE.lastIndex = 0;
    while ((m = MATH_TOKEN_RE.exec(source)) !== null) {
      if (m.index > last) tokens.push({ type: 'text', text: source.slice(last, m.index) });
      var display = m[1] === undefined;
      var inner = display ? m[2] : m[1];
      tokens.push({
        type: 'math',
        inner: inner,
        display: display,
        raw: display ? '$$' + inner + '$$' : '\\(' + inner + '\\)',
      });
      last = m.index + m[0].length;
    }
    if (last < source.length) tokens.push({ type: 'text', text: source.slice(last) });
    return tokens;
  }

  function makeChip(inner, display) {
    var raw = display ? '$$' + inner + '$$' : '\\(' + inner + '\\)';
    var span = doc.createElement('span');
    span.className = 'katex-chip' + (display ? ' is-display' : '');
    span.setAttribute('contenteditable', 'false');
    span.dataset.latex = raw;
    span.setAttribute('role', 'math');
    span.setAttribute('aria-label', inner || raw);
    span.title = raw;
    span.tabIndex = 0;
    try {
      if (global.katex && typeof global.katex.render === 'function') {
        global.katex.render(inner, span, { throwOnError: false, displayMode: !!display });
        if (span.querySelector('.katex-error')) {
          throw new Error('katex parse error');
        }
      } else {
        throw new Error('katex not loaded');
      }
    } catch (e) {
      // Unrenderable math: show the raw LaTeX as source instead of a dead chip.
      span.classList.add('no-katex');
      span.textContent = raw;
    }
    return span;
  }

  function renderSource(root, source) {
    while (root.firstChild) root.removeChild(root.firstChild);
    var tokens = tokenize(source);
    var frag = doc.createDocumentFragment();
    for (var i = 0; i < tokens.length; i++) {
      if (tokens[i].type === 'text') frag.appendChild(doc.createTextNode(tokens[i].text));
      else frag.appendChild(makeChip(tokens[i].inner, tokens[i].display));
    }
    root.appendChild(frag);
  }

  function serialize(root) {
    var parts = [];
    function visit(el) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var n = el.childNodes[i];
        if (n.nodeType === 3) {
          parts.push(n.data);
        } else if (n.nodeType === 1) {
          if (n.classList.contains('katex-chip')) {
            parts.push(n.dataset.latex || '');
          } else if (n.classList.contains('latex-edit')) {
            parts.push((n.dataset.open || '\\(') + n.textContent + (n.dataset.close || '\\)'));
          } else {
            visit(n);
          }
        }
      }
    }
    visit(root);
    return parts.join('');
  }

  function indexOfChild(parent, node) {
    for (var i = 0; i < parent.childNodes.length; i++) {
      if (parent.childNodes[i] === node) return i;
    }
    return -1;
  }

  /** Source text contributed by a single DOM child (text / chips / raw edit). */
  function nodeContribution(node) {
    if (!node) return '';
    if (node.nodeType === 3) return node.data;
    if (node.nodeType === 1) {
      if (node.classList.contains('katex-chip')) return node.dataset.latex || '';
      if (node.classList.contains('latex-edit')) {
        return (node.dataset.open || '\\(') + node.textContent + (node.dataset.close || '\\)');
      }
      var out = '';
      for (var i = 0; i < node.childNodes.length; i++) out += nodeContribution(node.childNodes[i]);
      return out;
    }
    return '';
  }

  /** Source prefix preceding the position (node, offset) inside root, as a string. */
  function prefixSource(root, node, offset) {
    var acc = '';
    if (node === root) {
      for (var i = 0; i < Math.max(0, offset); i++) {
        acc += nodeContribution(root.childNodes[i]);
      }
      return acc;
    }
    var found = false;
    function visit(el) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var child = el.childNodes[i];
        if (child === node) {
          if (child.nodeType === 3) acc += child.data.slice(0, offset);
          found = true;
          return;
        }
        if (child.nodeType === 3) {
          acc += child.data;
        } else if (child.nodeType === 1 && child.classList && child.classList.length && (
          child.classList.contains('katex-chip') || child.classList.contains('latex-edit')
        )) {
          acc += nodeContribution(child);
        } else if (child.nodeType === 1) {
          visit(child);
        }
        if (found) return;
      }
    }
    visit(root);
    return acc;
  }

  function rangeAtEnd(root) {
    var r = doc.createRange();
    var last = root.lastChild;
    if (!last) { r.setStart(root, 0); r.collapse(true); return r; }
    if (last.nodeType === 3) { r.setStart(last, last.data.length); r.collapse(true); return r; }
    r.setStart(root, indexOfChild(root, last) + 1);
    r.collapse(true);
    return r;
  }

  /** Collapsed range at source position `pos`. Snaps to chip boundaries. */
  function placeRange(root, pos) {
    if (typeof pos !== 'number' || isNaN(pos)) pos = 0;
    if (pos <= 0) {
      var r0 = doc.createRange();
      r0.setStart(root, 0);
      r0.collapse(true);
      return r0;
    }
    var acc = 0;
    var hit = null;
    function visit(el) {
      for (var i = 0; i < el.childNodes.length; i++) {
        var child = el.childNodes[i];
        if (child.nodeType === 3) {
          var len = child.data.length;
          if (pos >= acc && pos <= acc + len) {
            hit = { node: child, off: pos - acc };
            return true;
          }
          acc += len;
        } else if (child.nodeType === 1 && child.classList && child.classList.contains('katex-chip')) {
          var l = (child.dataset.latex || '').length;
          if (pos >= acc && pos <= acc + l) {
            hit = { node: child, boundary: pos === acc ? 0 : 1 };
            return true;
          }
          acc += l;
        } else if (child.nodeType === 1 && child.classList && child.classList.contains('latex-edit')) {
          var ll = nodeContribution(child).length;
          if (pos >= acc && pos <= acc + ll) {
            hit = { node: child, boundary: pos === acc ? 0 : 1 };
            return true;
          }
          acc += ll;
        } else if (child.nodeType === 1) {
          if (visit(child)) return true;
        }
      }
      return false;
    }
    visit(root);
    var range = doc.createRange();
    if (!hit) return rangeAtEnd(root);
    if (hit.node.nodeType === 3) {
      range.setStart(hit.node, hit.off);
      range.collapse(true);
      return range;
    }
    var parent = hit.node.parentNode;
    var idx = indexOfChild(parent, hit.node);
    var boundary = hit.boundary === 0 ? idx : idx + 1;
    range.setStart(parent, boundary);
    range.collapse(true);
    return range;
  }

  function sourceOffsetAtRange(root, range) {
    if (!range) return 0;
    return prefixSource(root, range.startContainer, range.startOffset).length;
  }

  function placeCaret(root, pos) {
    var range = placeRange(root, pos);
    var sel = global.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function currentRange(root) {
    var sel = global.getSelection();
    if (!sel || !sel.rangeCount) return null;
    var r = sel.getRangeAt(0);
    return root.contains(r.commonAncestorContainer) ? r : null;
  }

  function insertTextAtSelection(text) {
    try {
      return doc.execCommand('insertText', false, text);
    } catch (e) {
      return false;
    }
  }

  /* ── Validation ──────────────────────────────────────────────────────────── */

  function validateSource(source, noun) {
    var problems = [];
    var label = noun || 'transcription';
    if (source.length > MAX_LEN) {
      problems.push({
        message: 'The ' + label + ' is longer than ' + MAX_LEN.toLocaleString() + ' characters. Shorten it before confirming.',
        offset: MAX_LEN,
      });
    }
    var removed = source.replace(MATH_TOKEN_RE, '');
    var m = removed.match(/\\\(|\\\)|\$\$/);
    if (m) {
      var idx = removed.indexOf(m[0]);
      problems.push({
        message: 'Found an unbalanced math delimiter (' + m[0] + ') around character ' + idx + '. Fix or remove it before confirming.',
        offset: idx,
      });
    }
    return { ok: problems.length === 0, problems: problems };
  }

  /* ── Editor instance ─────────────────────────────────────────────────────── */

  function attach(root, opts) {
    opts = opts || {};
    root.setAttribute('contenteditable', 'true');
    root.setAttribute('spellcheck', 'false');
    root.setAttribute('aria-multiline', 'true');
    root.setAttribute('role', 'textbox');

    var state = { editingRaw: null, timer: null, lastRange: null, lastSource: '' };

    function fireInput() {
      if (typeof opts.onInput === 'function') opts.onInput(serialize(root));
    }

    function snapshot() {
      var r = currentRange(root);
      state.lastRange = r ? r.cloneRange() : null;
    }

    var instance = {
      root: root,
      _wrapMath: opts.wrapMath === true,
      getValue: function () { return serialize(root); },
      setValue: function (s) {
        state.editingRaw = null;
        state.lastSource = String(s == null ? '' : s);
        renderSource(root, state.lastSource);
        fireInput();
      },
      reset: function (s) { instance.setValue(s); },
      validate: function () { return validateSource(instance.getValue(), opts.noun || 'transcription'); },
      focus: function () { root.focus(); },
      get lastSource() { return state.lastSource; },
      get _lastRange() { return state.lastRange; },
      set _lastRange(v) { state.lastRange = v; },
      _notify: fireInput,
    };

    function expandChip(chip) {
      if (state.editingRaw) commitRawEdit(state.editingRaw);
      var raw = chip.dataset.latex || '';
      var open = '\\(';
      var close = '\\)';
      if (raw.slice(0, 2) === '$$' && raw.slice(-2) === '$$') {
        open = '$$';
        close = '$$';
      }
      var inner = raw.slice(open.length, raw.length - close.length);
      var span = doc.createElement('span');
      span.className = 'latex-edit';
      span.setAttribute('contenteditable', 'true');
      span.spellcheck = false;
      span.dataset.open = open;
      span.dataset.close = close;
      span.textContent = inner;
      chip.parentNode.replaceChild(span, chip);
      state.editingRaw = span;
      var sel = global.getSelection();
      var range = doc.createRange();
      range.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(range);
      span.focus();
    }

    function commitRawEdit(span) {
      var open = span.dataset.open || '\\(';
      var close = span.dataset.close || '\\)';
      var preLen = prefixSource(root, span, 0).length;
      var rawContribution = open + span.textContent + close;
      var caretPos = preLen + rawContribution.length;
      var source = serialize(root);
      if (!span.textContent.trim()) {
        // Empty raw edit: drop the whole math segment.
        source = source.slice(0, preLen) + source.slice(preLen + rawContribution.length);
      }
      state.editingRaw = null;
      state.lastSource = source;
      renderSource(root, source);
      placeCaret(root, caretPos);
      root.focus();
      state.lastRange = currentRange(root) ? currentRange(root).cloneRange() : null;
      fireInput();
    }

    /* ── Events ────────────────────────────────────────────────────────────── */

    root.addEventListener('input', function () {
      if (state.editingRaw) {
        fireInput();
        return;
      }
      snapshot();
      clearTimeout(state.timer);
      state.timer = setTimeout(function () {
        state.timer = null;
        if (state.editingRaw) return;
        var source = serialize(root);
        var tokens = tokenize(source);
        var tokenMath = [];
        for (var i = 0; i < tokens.length; i++) {
          if (tokens[i].type === 'math') tokenMath.push(tokens[i].raw);
        }
        var chips = [];
        for (var c = 0; c < root.childNodes.length; c++) {
          var n = root.childNodes[c];
          if (n.nodeType === 1 && n.classList && n.classList.contains('katex-chip')) {
            chips.push(n.dataset.latex || '');
          }
        }
        var same = chips.length === tokenMath.length;
        for (var j = 0; same && j < chips.length; j++) {
          if (chips[j] !== tokenMath[j]) same = false;
        }
        if (!same) {
          var pos = sourceOffsetAtRange(root, currentRange(root));
          state.lastSource = source;
          renderSource(root, source);
          placeCaret(root, pos);
          snapshot();
        }
        fireInput();
      }, 400);
    });

    root.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertTextAtSelection('\n');
        return;
      }
      if (e.key === 'Escape' && state.editingRaw) {
        e.preventDefault();
        commitRawEdit(state.editingRaw);
        return;
      }
    });

    root.addEventListener('paste', function (e) {
      e.preventDefault();
      var text = '';
      if (e.clipboardData) text = e.clipboardData.getData('text/plain');
      else if (global.clipboardData) text = global.clipboardData.getData('Text');
      // Strip control characters; keep newlines and tabs.
      text = String(text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
      insertTextAtSelection(text);
    });

    root.addEventListener('drop', function (e) { e.preventDefault(); });

    root.addEventListener('dblclick', function (e) {
      var t = e.target;
      var chip = t && t.closest ? t.closest('.katex-chip') : null;
      if (chip) expandChip(chip);
    });

    root.addEventListener('blur', function () {
      if (state.editingRaw) commitRawEdit(state.editingRaw);
    });

    root.addEventListener('keyup', snapshot);
    root.addEventListener('mouseup', snapshot);

    instance.setValue(opts.value || '');
    return instance;
  }

  /* ── Palette ─────────────────────────────────────────────────────────────── */

  /** True when the caret range sits inside a raw-LaTeX chip edit (already delimited). */
  function rangeInsideLatexEdit(range) {
    if (!range) return false;
    var n = range.startContainer;
    if (n.nodeType === 1) {
      return !!(n.classList && n.classList.contains('latex-edit'));
    }
    return !!(n.parentNode && n.parentNode.classList && n.parentNode.classList.contains('latex-edit'));
  }

  function insertToken(instance, token) {
    var root = instance.root;
    var sel = global.getSelection();
    var range = null;
    if (instance._lastRange && root.contains(instance._lastRange.commonAncestorContainer)) {
      range = instance._lastRange.cloneRange();
    }
    var basePos = range ? sourceOffsetAtRange(root, range) : serialize(root).length;

    // Phase 3 (typed answer box): with wrapMath on, palette inserts land in plain
    // text wrapped in \(...\) so they render as math chips — the student never
    // types delimiters. Inserts inside an open raw chip edit are left bare.
    var wrap = instance._wrapMath && !rangeInsideLatexEdit(range) ? ['\\(', '\\)'] : null;
    var shift = wrap ? wrap[0].length : 0;
    var insert = wrap ? wrap[0] + token.insert + wrap[1] : token.insert;

    if (range) {
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      placeCaret(root, serialize(root).length);
    }

    var done = insertTextAtSelection(insert);
    if (!done) {
      var r = sel.rangeCount ? sel.getRangeAt(0) : null;
      if (r) {
        r.deleteContents();
        var tn = doc.createTextNode(insert);
        r.insertNode(tn);
        var r2 = doc.createRange();
        r2.setStartAfter(tn);
        r2.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r2);
      }
    }

    var caretPos = basePos + shift + (token.caret != null ? token.caret : token.insert.length);
    var endPos = token.select ? basePos + shift + token.select[1] : caretPos;
    var cRange = placeRange(root, caretPos);
    var eRange = placeRange(root, endPos);
    if (cRange && eRange) {
      sel.removeAllRanges();
      if (endPos !== caretPos) {
        var sr = doc.createRange();
        sr.setStart(cRange.startContainer, cRange.startOffset);
        sr.setEnd(eRange.startContainer, eRange.startOffset);
        sel.addRange(sr);
      } else {
        sel.addRange(cRange);
      }
      root.focus();
    }
    instance._lastRange = null;
    if (sel.rangeCount) {
      try { instance._lastRange = sel.getRangeAt(0).cloneRange(); } catch (e) { instance._lastRange = null; }
    }
    if (instance._notify) instance._notify();
  }

  function attachPalette(host, instance) {
    if (!host) return null;
    host.innerHTML = '';
    var frag = doc.createDocumentFragment();
    for (var g = 0; g < TOKENS.length; g++) {
      var group = TOKENS[g];
      var wrap = doc.createElement('div');
      wrap.className = 'ap-math-group';
      var label = doc.createElement('span');
      label.className = 'ap-math-group-label';
      label.textContent = group.group;
      wrap.appendChild(label);
      for (var k = 0; k < group.keys.length; k++) {
        var key = group.keys[k];
        var btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'ap-math-key';
        btn.textContent = key.glyph;
        btn.setAttribute('aria-label', key.aria || key.insert);
        btn.title = key.aria || key.insert;
        btn.addEventListener('click', (function (tok) {
          return function () { insertToken(instance, tok); };
        })(key));
        wrap.appendChild(btn);
      }
      frag.appendChild(wrap);
    }
    host.appendChild(frag);
    return host;
  }

  global.KorahMathEditor = {
    attach: attach,
    attachPalette: attachPalette,
    TOKENS: TOKENS,
    MAX_LEN: MAX_LEN,
  };
})(typeof window !== 'undefined' ? window : this);