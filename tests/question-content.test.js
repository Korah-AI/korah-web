const test = require('node:test');
const assert = require('node:assert/strict');

global.window = {};
require('../korah-bot/sat/js/question-content.js');

const { mathFromDescription } = window.KorahQuestionContent;

test('renders verified SAT answer choices as selectable inline MathML', () => {
  for (const description of ['four-thirds w', 'w plus 5', 'three-fourths w', 'w minus 5']) {
    const markup = mathFromDescription(description);
    assert.match(markup, /^<math\b/);
    assert.match(markup, /aria-label=/);
  }
  assert.match(mathFromDescription('four-thirds w'), /<mfrac><mn>4<\/mn><mn>3<\/mn><\/mfrac><mi>w<\/mi>/);
});

test('renders verified geometry expressions while leaving the diagram alone', () => {
  assert.match(mathFromDescription('the length of side A, B equals the length of side A, C'), /<mi>A<\/mi><mi>B<\/mi><mo>=<\/mo><mi>A<\/mi><mi>C<\/mi>/);
  assert.match(mathFromDescription('angle A, B C'), /<mo>∠<\/mo><mi>A<\/mi><mi>B<\/mi><mi>C<\/mi>/);
  assert.equal(mathFromDescription('The figure presents triangle B A, C'), null);
});
