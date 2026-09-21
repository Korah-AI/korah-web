// Shared, source-preserving renderer for College Board and verified local content.
(() => {
  'use strict';
  let serial = 0;
  const MATH_NS = 'http://www.w3.org/1998/Math/MathML';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  // Exact descriptions checked against the equation PNGs in the recorded
  // disclosed fixtures. These are explicit transcriptions, not an OCR guess.
  const half = '<mfrac><mn>1</mn><mn>2</mn></mfrac>';
  const reviewedMath = new Map([
    ['negative x plus y, equals negative 3 point 5, and, x plus 3 y, equals 9 point 5', '<mtable><mtr><mtd><mo>−</mo><mi>x</mi><mo>+</mo><mi>y</mi><mo>=</mo><mo>−</mo><mn>3.5</mn></mtd></mtr><mtr><mtd><mi>x</mi><mo>+</mo><mn>3</mn><mi>y</mi><mo>=</mo><mn>9.5</mn></mtd></mtr></mtable>'],
    ['y equals six fourths', '<mi>y</mi><mo>=</mo><mfrac><mn>6</mn><mn>4</mn></mfrac>'],
    ['one half y equals 4', half+'<mi>y</mi><mo>=</mo><mn>4</mn>'],
    ['x minus, one half y, equals 2', '<mi>x</mi><mo>−</mo>'+half+'<mi>y</mi><mo>=</mo><mn>2</mn>'],
    ['The equation one half y equals 4, added to the equation x minus one half y, equals 2, gives the equation x plus 0, equals 6', '<mtable><mtr><mtd>'+half+'<mi>y</mi><mo>=</mo><mn>4</mn></mtd></mtr><mtr><mtd><mo>+</mo><mrow><mi>x</mi><mo>−</mo>'+half+'<mi>y</mi><mo>=</mo><mn>2</mn></mrow></mtd></mtr><mtr><mtd><menclose notation="top"><mrow><mi>x</mi><mo>+</mo><mn>0</mn><mo>=</mo><mn>6</mn></mrow></menclose></mtd></mtr></mtable>'],
    ['y equals, the negative of the fraction a, x, over k, end fraction, plus, the fraction 6 over k', '<mi>y</mi><mo>=</mo><mo>−</mo><mfrac><mrow><mi>a</mi><mi>x</mi></mrow><mi>k</mi></mfrac><mo>+</mo><mfrac><mn>6</mn><mi>k</mi></mfrac>'],
    ['the fraction 4,650 over 5, equals 930', '<mfrac><mn>4,650</mn><mn>5</mn></mfrac><mo>=</mo><mn>930</mn>'],
    ['m equals, the fraction with numerator Q sub 2, minus Q sub 1, and denominator P sub 2, minus P sub 1, end fraction', '<mi>m</mi><mo>=</mo><mfrac><mrow><msub><mi>Q</mi><mn>2</mn></msub><mo>−</mo><msub><mi>Q</mi><mn>1</mn></msub></mrow><mrow><msub><mi>P</mi><mn>2</mn></msub><mo>−</mo><msub><mi>P</mi><mn>1</mn></msub></mrow></mfrac>'],
    ['m equals, the fraction with numerator 15,000 minus 20,000, and denominator 60 minus 40, end fraction', '<mi>m</mi><mo>=</mo><mfrac><mrow><mn>15,000</mn><mo>−</mo><mn>20,000</mn></mrow><mrow><mn>60</mn><mo>−</mo><mn>40</mn></mrow></mfrac>'],
  ]);

  // Deliberately small grammar: an unrecognized description remains an image.
  // Never guess precedence or turn arbitrary spoken prose into an equation.
  function mathFromDescription(description) {
    const source = String(description || '').trim();
    if (reviewedMath.has(source)) return `<math xmlns="${MATH_NS}" aria-label="${escape(source)}"><mrow>${reviewedMath.get(source)}</mrow></math>`;
    const wrap = body => `<math xmlns="${MATH_NS}" aria-label="${escape(source)}"><mrow>${body}</mrow></math>`;
    const inner = value => {
      const result = mathFromDescription(value);
      return result?.replace(/^<math[^>]*><mrow>/, '').replace(/<\/mrow><\/math>$/, '');
    };
    const equality = /^(.+?)\s*(?:equals|=)\s*,?\s*((?:the\s+)?fraction\b.+)$/i.exec(source);
    if (equality) {
      const left = inner(equality[1].replace(/,\s*$/, ''));
      const right = inner(equality[2]);
      if (left && right) return wrap(left + '<mo>=</mo>' + right);
    }
    // Explicit boundaries allow compound fractions and radicals without
    // guessing where the numerator, denominator, or radicand ends.
    const compoundFraction = /^(?:the\s+)?fraction (?:with )?numerator\s+(.+?),?\s+(?:and )?denominator\s+(.+?),?\s+end fraction$/i.exec(source);
    if (compoundFraction) {
      const numerator = inner(compoundFraction[1].replace(/,\s*$/, ''));
      const denominator = inner(compoundFraction[2].replace(/,\s*$/, ''));
      if (numerator && denominator && !/^<mn>0(?:\.0+)?<\/mn>$/.test(denominator)) return wrap(`<mfrac><mrow>${numerator}</mrow><mrow>${denominator}</mrow></mfrac>`);
      return null;
    }
    const radical = /^(?:the\s+)?square root (?:of\s+)?(.+?),?\s+end (?:square )?root$/i.exec(source);
    if (radical) {
      const radicand = inner(radical[1].replace(/,\s*$/, ''));
      return radicand ? wrap(`<msqrt>${radicand}</msqrt>`) : null;
    }
    // Geometry labels are commonly exported as tiny PNGs too. Only accept
    // explicit segment/overbar descriptions; a bare AB is a length or label.
    const segment = /^(?:(?:the\s+)?(?:line\s+)?segment\s+([A-Z])\s*([A-Z])|(?:the\s+)?(?:line\s+)?([A-Z])\s*([A-Z])\s+(?:with\s+(?:a\s+)?(?:bar|overbar)\s+(?:above|over\s+it)|bar|overbar))\.?$/.exec(source);
    if (segment) {
      const letters = (segment[1] || segment[3]) + (segment[2] || segment[4]);
      return `<math xmlns="${MATH_NS}" aria-label="${escape(source)}"><mrow><mover accent="true"><mrow><mi>${letters[0]}</mi><mi>${letters[1]}</mi></mrow><mo>¯</mo></mover></mrow></math>`;
    }
    // A complete equality with an atomic fraction is unambiguous. Render it
    // as native math instead of retaining the low-resolution equation PNG.
    const fractionEquation = /^([a-z])\s*(?:equals|=)\s*,?\s*(?:(?:the\s+)?fraction\s+)?(-?\d+(?:\.\d+)?|[a-z])\s*(?:over|\/)\s*(-?\d+(?:\.\d+)?|[a-z])(?:\s*,?\s*end fraction)?\s*$/i.exec(source);
    if (fractionEquation && Number(fractionEquation[3]) !== 0) {
      const atom = value => /^[a-z]$/i.test(value) ? `<mi>${value}</mi>` : `<mn>${value}</mn>`;
      return `<math xmlns="${MATH_NS}" aria-label="${escape(source)}"><mrow><mi>${fractionEquation[1]}</mi><mo>=</mo><mfrac>${atom(fractionEquation[2])}${atom(fractionEquation[3])}</mfrac></mrow></math>`;
    }
    const pair = source.replace(/^(?:the ordered pair|with coordinates)\s+/i, '').split(/\s+comma\s+/i);
    if (pair.length === 2) {
      const parts = pair.map(part => mathFromDescription(part));
      if (parts.every(Boolean)) {
        const unwrap = value => value.replace(/^<math[^>]*><mrow>/, '').replace(/<\/mrow><\/math>$/, '');
        return `<math xmlns="${MATH_NS}" aria-label="${escape(source)}"><mrow><mo>(</mo>${unwrap(parts[0])}<mo>,</mo>${unwrap(parts[1])}<mo>)</mo></mrow></math>`;
      }
      return null;
    }
    const words = { one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 };
    const denominators = { half:2, halves:2, third:3, thirds:3, fourth:4, fourths:4, quarter:4, quarters:4, fifth:5, fifths:5, sixth:6, sixths:6, seventh:7, sevenths:7, eighth:8, eighths:8, ninth:9, ninths:9, tenth:10, tenths:10, eleventh:11, elevenths:11, twelfth:12, twelfths:12 };
    let text = source.replace(/[−–]/g, '-')
      .replace(/\b([A-Za-z]) of (negative )?(\d+(?:\.\d+)?|[A-Za-z])\b/g, (_, fn, sign, arg) => `${fn}(${sign ? '−' : ''}${arg})`);
    const spokenFraction = /^([a-z]+) ([a-z]+)$/i.exec(text);
    if (spokenFraction && words[spokenFraction[1].toLowerCase()] && denominators[spokenFraction[2].toLowerCase()]) {
      text = `${words[spokenFraction[1].toLowerCase()]}/${denominators[spokenFraction[2].toLowerCase()]}`;
    }
    text = text.replace(/^(?:the )?fraction (-?\d+|[a-z]) over (-?\d+|[a-z])$/i, '$1/$2');
    const fraction = /^(-?\d+|[a-z])\s*\/\s*(-?\d+|[a-z])$/i.exec(text);
    let body;
    if (fraction && Number(fraction[2]) !== 0) {
      const atom = value => /^[a-z]$/i.test(value) ? `<mi>${value}</mi>` : `<mn>${value}</mn>`;
      body = `<mfrac>${atom(fraction[1])}${atom(fraction[2])}</mfrac>`;
    } else if (/^-?\d+(?:\.\d+)?$/.test(text)) {
      body = `<mn>${text}</mn>`;
    } else if (/^[a-zA-Z]$/.test(text)) {
      body = `<mi>${text}</mi>`;
    } else if (/^[A-Z]\s*[A-Z]$/.test(text)) {
      body = text.replace(/\s/g, '').split('').map(c => `<mi>${c}</mi>`).join('');
    } else if (/^[A-Z]\s*(?:equals\s*,?\s*|=\s*)[A-Z]{2}$/.test(text)) {
      body = text.replace(/equals\s*,?/, '=').replace(/\s/g, '').split('').map(c => c === '=' ? '<mo>=</mo>' : `<mi>${c}</mi>`).join('');
    } else if (/^[A-Z]{2}\s*=\s*[A-Z]{2}$/.test(text)) {
      body = text.replace(/\s/g, '').split('').map(c => c === '=' ? '<mo>=</mo>' : `<mi>${c}</mi>`).join('');
    } else if (/^(?:angle\s+|∠)[A-Z]{1,3}$/i.test(text)) {
      const letters = text.replace(/^(?:angle\s+|∠)/i, '');
      body = '<mo>∠</mo>' + [...letters].map(c => `<mi>${c}</mi>`).join('');
    } else if (/^\d+(?:\.\d+)?\s*(?:degrees?|°)$/i.test(text)) {
      body = `<mn>${parseFloat(text)}</mn><mo>°</mo>`;
    } else {
      // Fully consume a restricted spoken arithmetic grammar. Phrases with
      // unspecified fraction boundaries, systems, or prose remain untouched.
      text = text.replace(/-/g, '−').replace(/(\d),(?=\d{3}(?:\D|$))/g, '$1')
        .replace(/\b(\d+) point (\d+)\b/gi, '$1.$2')
        .replace(/\bis less than or equal to\b/gi, '≤')
        .replace(/\bis greater than or equal to\b/gi, '≥')
        .replace(/\b(?:is not equal to|does not equal|not equal to)\b/gi, '≠')
        .replace(/\bis less than\b/gi, '<').replace(/\bis greater than\b/gi, '>')
        .replace(/\bsquared\b/gi, '^2').replace(/\bcubed\b/gi, '^3')
        .replace(/\bto the (second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth)(?: power)?\b/gi, (_, ordinal) => '^' + ({second:2,third:3,fourth:4,fifth:5,sixth:6,seventh:7,eighth:8,ninth:9,tenth:10}[ordinal.toLowerCase()]))
        .replace(/\b(?:to the power of|to the)\s+(negative\s+)?(\d+)(?:st|nd|rd|th)?(?:\s+power)?\b/gi, (_, sign, power) => '^' + (sign ? '−' : '') + power)
        .replace(/\b(?:is equal to|equals)\b/gi, '=')
        .replace(/\b(?:to the power of|to the)\s+([A-Za-z])(?:\s+power)?\b/g, '^$1')
        .replace(/\b(?:negative|minus)\b/gi, '−')
        .replace(/\bplus\b/gi, '+').replace(/\btimes\b/gi, '×')
        .replace(/\bopen parenthesis\b/gi, '(').replace(/\bclose parenthesis\b/gi, ')')
        .replace(/,/g, ' ').trim();
      // Uppercase pairs denote geometric lengths (AB = 9, BC = 18.5).
      // Split only those pairs, leaving other words to fail validation.
      text = text.replace(/\b([A-Z])([A-Z])\b/g, '$1 $2');
      const tokens = text.match(/\d+(?:\.\d+)?|[A-Za-z]+|[+−=≠<>≤≥×()^]/g) || [];
      if (!tokens.length || text.replace(/\s/g, '') !== tokens.join('') || tokens.some(t => /^[A-Za-z]{2,}$/.test(t))) return null;
      let depth = 0;
      for (const token of tokens) {
        if (token === '(') depth++;
        if (token === ')' && --depth < 0) return null;
      }
      if (depth) return null;
      // A dangling operator is evidence of an incomplete description.
      if (/[+−=≠<>≤≥×(^]$/.test(text) || /^[+=≠<>≤≥×)^]/.test(text)) return null;
      let cursor = 0;
      function sequence(nested = false) {
        const nodes = [];
        while (cursor < tokens.length && tokens[cursor] !== ')') {
          const token = tokens[cursor++];
          if (token === '^') return null;
          let node;
          let atom = /^(?:[A-Za-z]|\d+(?:\.\d+)?)$/.test(token);
          if (token === '(') {
            const children = sequence(true);
            if (!children || tokens[cursor++] !== ')') return null;
            node = `<mrow><mo>(</mo>${children}<mo>)</mo></mrow>`;
            atom = true;
          } else {
            node = /^\d/.test(token) ? `<mn>${token}</mn>` : /^[A-Za-z]$/.test(token) ? `<mi>${token}</mi>` : `<mo>${escape(token)}</mo>`;
          }
          if (tokens[cursor] === '^') {
            if (!atom) return null;
            cursor++;
            const negative = tokens[cursor] === '−';
            if (negative) cursor++;
            const exponent = tokens[cursor++];
            if (!/^(?:\d+|[A-Za-z])$/.test(exponent || '')) return null;
            const power = /^\d/.test(exponent) ? `<mn>${exponent}</mn>` : `<mi>${exponent}</mi>`;
            node = `<msup>${node}<mrow>${negative ? '<mo>−</mo>' : ''}${power}</mrow></msup>`;
          }
          nodes.push(node);
        }
        if (!nodes.length || (nested && /[+−=≠<>≤≥×]/.test(tokens[cursor - 1]) && tokens[cursor - 1].length === 1)) return null;
        return nodes.join('');
      }
      body = sequence();
      if (!body || cursor !== tokens.length) return null;
    }
    return `<math xmlns="${MATH_NS}" aria-label="${escape(source)}"><mrow>${body}</mrow></math>`;
  }

  function normalizeMath(root) {
    // Work inside-out, including nested fences and all separators.
    [...root.querySelectorAll('mfenced')].reverse().forEach(node => {
      const row = document.createElementNS(MATH_NS, 'mrow');
      const operator = value => { const op = document.createElementNS(MATH_NS, 'mo'); op.textContent = value; return op; };
      const open = node.getAttribute('open') ?? '(';
      const close = node.getAttribute('close') ?? ')';
      const separators = [...(node.getAttribute('separators') ?? ',').replace(/\s/g, '')];
      if (open) row.append(operator(open));
      [...node.children].forEach((child, i) => {
        if (i && separators.length) row.append(operator(separators[Math.min(i - 1, separators.length - 1)]));
        row.append(child);
      });
      if (close) row.append(operator(close));
      node.replaceWith(row);
    });
    function expandOverbars() { [...root.querySelectorAll('menclose[notation="top"]')].reverse().forEach(node => {
      const mover = document.createElementNS(MATH_NS, 'mover');
      mover.setAttribute('accent', 'true');
      const row = document.createElementNS(MATH_NS, 'mrow');
      row.append(...node.childNodes);
      const bar = document.createElementNS(MATH_NS, 'mo');
      bar.textContent = '¯';
      mover.append(row, bar);
      node.replaceWith(mover);
    }); }
    expandOverbars();
    root.querySelectorAll('img.math-img, img[role="math"], .math-container img').forEach(img => {
      const math = mathFromDescription(img.getAttribute('alt'));
      if (math) {
        const template = document.createElement('template');
        template.innerHTML = math; // generated only by the bounded grammar above
        img.replaceWith(template.content);
      } else {
        img.classList.add('question-inline-math');
        img.dataset.mathConversion = 'needs-review';
      }
    });
    root.querySelectorAll('math[alttext]').forEach(math => {
      if (!math.hasAttribute('aria-label')) math.setAttribute('aria-label', math.getAttribute('alttext'));
    });
    expandOverbars(); // verified legacy transcriptions can introduce an overbar
  }

  function normalizeSvg(svg) {
    const ids = new Map();
    const prefix = `qsvg-${++serial}-`;
    svg.querySelectorAll('[id]').forEach(node => {
      const old = node.id;
      const next = `${prefix}${ids.size}`;
      ids.set(old, next);
      node.id = next;
    });
    [svg, ...svg.querySelectorAll('*')].forEach(node => {
      for (const attr of [...node.attributes]) {
        if (['href', 'xlink:href'].includes(attr.name)) {
          // A figure may reference only its own definitions.
          node.removeAttribute(attr.name);
          if (attr.value.startsWith('#') && ids.has(attr.value.slice(1))) node.setAttribute('href', '#' + ids.get(attr.value.slice(1)));
          else if (node.localName === 'image' && /^(?:https:\/\/|data:image\/(?:png|jpeg|gif|webp);base64,)/i.test(attr.value)) node.setAttribute('href', attr.value);
        } else if (attr.name === 'aria-labelledby' || attr.name === 'aria-describedby') {
          node.setAttribute(attr.name, attr.value.split(/\s+/).map(id => ids.get(id)).filter(Boolean).join(' '));
        } else if (/url\s*\(/i.test(attr.value)) {
          node.setAttribute(attr.name, attr.value.replace(/url\(\s*(['"]?)(.*?)\1\s*\)/gi, (_, quote, target) => target.startsWith('#') && ids.has(target.slice(1)) ? `url(#${ids.get(target.slice(1))})` : 'none'));
        }
      }
    });
    // Match only conventional matplotlib canvas/plot background groups.
    // Other filled rectangles and paths may carry mathematical information.
    for (const [old, next] of ids) {
      if (!/^patch_[12]$/.test(old)) continue;
      const group = svg.querySelector(`[id="${next}"]`);
      group?.querySelectorAll('path, rect').forEach(node => {
        const fill = node.style.fill || node.getAttribute('fill');
        if (/^(?:#fff(?:fff)?|white|rgb\(255,\s*255,\s*255\))$/i.test(fill || '')) {
          node.classList.add('question-plot-background');
        }
      });
    }
    const view = (svg.getAttribute('viewBox') || '').trim().split(/[ ,]+/).map(Number);
    for (const [old, next] of ids) {
      if (!/^PolyCollection_\d+$/.test(old) || view.length !== 4) continue;
      const group = svg.querySelector(`[id="${next}"]`);
      // In this export family, one or more masks immediately precede text_N.
      let sibling = group.nextElementSibling;
      while (sibling && [...ids].some(([name, id]) => /^PolyCollection_\d+$/.test(name) && id === sibling.id)) sibling = sibling.nextElementSibling;
      if (!sibling || ![...ids].some(([name, id]) => /^text_\d+$/.test(name) && id === sibling.id)) continue;
      group.querySelectorAll('path').forEach(path => {
        if (!/^(?:white|#fff(?:fff)?|rgb\(255,\s*255,\s*255\))$/i.test(path.style.fill || path.getAttribute('fill') || '')) return;
        const d = path.getAttribute('d') || '';
        if (!/^\s*M\s*[-\d.]+[ ,]+[-\d.]+(?:\s*L\s*[-\d.]+[ ,]+[-\d.]+){3}\s*z\s*$/i.test(d)) return;
        const numbers = d.match(/-?\d+(?:\.\d+)?/g).map(Number);
        const xs = [...new Set(numbers.filter((_, i) => i % 2 === 0))];
        const ys = [...new Set(numbers.filter((_, i) => i % 2 === 1))];
        if (xs.length === 2 && ys.length === 2 && Math.abs((xs[1]-xs[0])*(ys[1]-ys[0])) < view[2]*view[3]*.01) path.classList.add('question-label-background');
      });
    }
    // Theme only monochrome assets; colored plots retain their source palette.
    const paints = [...svg.querySelectorAll('*'), svg].flatMap(node => [node.style.fill, node.style.stroke, node.getAttribute('fill'), node.getAttribute('stroke')]).filter(Boolean);
    const grayscale = /^(?:none|currentcolor|transparent|black|white|gray|grey|#[0-9a-f]{3,8}|rgb\([^)]*\))$/i;
    const isGray = paint => {
      if (!grayscale.test(paint)) return false;
      if (paint.startsWith('#')) {
        const hex = paint.slice(1);
        return hex.length === 3 ? hex[0] === hex[1] && hex[1] === hex[2] : hex.length === 6 && hex.slice(0,2) === hex.slice(2,4) && hex.slice(2,4) === hex.slice(4,6);
      }
      if (/^rgb/i.test(paint)) { const n = paint.match(/[\d.]+/g); return n?.length === 3 && n[0] === n[1] && n[1] === n[2]; }
      return true;
    };
    if (paints.every(isGray)) svg.classList.add('question-monochrome');
    svg.classList.add('question-figure');
    // Preserve coordinate space when upstream supplies only width/height.
    const w = Number(svg.getAttribute('width')), h = Number(svg.getAttribute('height'));
    if (!svg.hasAttribute('viewBox') && w > 0 && h > 0) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  }

  function html(source) {
    if (!window.DOMPurify) return `<div class="question-content" role="alert">Question content could not be displayed safely. Please reload.</div>`;
    const root = document.createElement('div');
    root.className = 'question-content';
    root.innerHTML = DOMPurify.sanitize(String(source ?? ''), {
      ADD_TAGS: ['use', 'mfenced', 'menclose'],
      ADD_ATTR: ['href', 'xlink:href', 'separators', 'open', 'close', 'notation'],
      FORBID_TAGS: ['style', 'foreignObject', 'iframe'],
    });
    // Remove resource-bearing CSS and positioning, but preserve SVG geometry,
    // alignment and legitimate text emphasis. Scope the remaining styles.
    root.querySelectorAll('[style]').forEach(node => {
      for (const property of [...node.style]) {
        const value = node.style.getPropertyValue(property);
        if ((/url\s*\(/i.test(value) && !/^url\(\s*['"]?#[\w:.-]+['"]?\s*\)$/i.test(value)) || /^(?:position|inset|z-index|behavior|-moz-binding)$/i.test(property)) node.style.removeProperty(property);
        if (property === 'color' && !node.closest('svg') && /^(?:black|white|rgb\(0,\s*0,\s*0\)|rgb\(255,\s*255,\s*255\))$/i.test(value)) node.style.removeProperty(property);
      }
    });
    normalizeMath(root);
    root.querySelectorAll('svg').forEach(normalizeSvg);
    root.querySelectorAll('img:not(.question-inline-math)').forEach(img => img.classList.add('question-figure'));
    root.querySelectorAll('table').forEach(table => {
      const scroll = document.createElement('div');
      scroll.className = 'question-table-scroll';
      scroll.setAttribute('tabindex', '0');
      scroll.setAttribute('role', 'region');
      scroll.setAttribute('aria-label', table.caption?.textContent || 'Question data table');
      table.before(scroll); scroll.append(table);
    });
    return root.outerHTML;
  }
  function render(container, source) {
    container.innerHTML = html(source);
    // CB MathML is already mathematical markup. Do not run dollar-delimited
    // TeX processing over prose: two currency amounts are not an equation.
  }
  window.KorahQuestionContent = Object.freeze({ html, render, mathFromDescription, escape });
})();
