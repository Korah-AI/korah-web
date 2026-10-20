// Chemical notation for question sources. In a source string:
//   ce{Fe2(SO4)3}           → \(\mathrm{Fe_{2}(SO_{4})_{3}}\)   (inline formula)
//   mce{SO4^2-}             → \mathrm{SO_{4}^{2-}}               (inside an existing \( … \))
// Digits after a letter or a closing bracket become subscripts; "^2+" becomes a charge;
// "->" and "<=>" become reaction arrows; "·" joins a hydrate. Leading coefficients stay as written.
function formula(s) {
  return s
    .replace(/([A-Za-z)\]])(\d+)/g, '$1_{$2}')
    .replace(/\^(\d*[+-])/g, '^{$1}')
    .replace(/<=>/g, '\\rightleftharpoons ')
    .replace(/->/g, '\\longrightarrow ')
    .replace(/·/g, '\\cdot ')
    .replace(/ +/g, '\\,');
}

const chem = source => source.replace(/(?<![A-Za-z\\])(m?)ce\{([^{}]*)\}/g, (_, inMath, s) => (inMath ? `\\mathrm{${formula(s)}}` : `\\(\\mathrm{${formula(s)}}\\)`));

module.exports = { chem, formula };
