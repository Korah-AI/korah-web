/**
 * desmos-sat-walkthrough.js
 *
 * Faithful reproduction of the Desmos calculator graph at:
 *   https://www.desmos.com/calculator/rqsoqwbqpd
 *
 * The source graph is a step-by-step regressions walkthrough that quickly
 * solves two SAT problems. It contains:
 *   - Two folders ("problem 1", "problem 2")
 *   - Notes (text items) that narrate each step
 *   - Hidden helper expressions for the candidate equations
 *   - A regression statement (Problem 1) using `~` with a residual
 *     variable and a fitted parameter k
 *   - A data table (Problem 2) with a built-in linear regression on the
 *     two columns x_1, y_1
 *
 * USAGE — drop into a page with this scaffolding:
 *
 *   <!doctype html>
 *   <html>
 *     <head>
 *       <script src="https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script>
 *     </head>
 *     <body>
 *       <div id="calculator" style="width: 100%; height: 100vh;"></div>
 *       <script src="desmos-sat-walkthrough.js"></script>
 *     </body>
 *   </html>
 *
 * Why setState() instead of setExpressions()?
 * -------------------------------------------
 * The source graph relies on three features that round-trip most cleanly
 * through Desmos' own state format:
 *   1. The Problem-2 item is a single `table` whose `regression` sub-object
 *      drives the green best-fit line. Wiring a regression to a table via
 *      individual setExpression() calls is awkward; the state-shaped
 *      object handles it natively.
 *   2. The Problem-1 regression carries pre-computed `regressionParameters`
 *      ({ k: 2.449… }) and a `residualVariable` (`e_{1}`). setState
 *      preserves both verbatim.
 *   3. Random seed, viewport, and graph-level migration flags are part of
 *      the state envelope. Reproducing them keeps colors, ordering, and
 *      layout pixel-identical to the original.
 *
 * For users who prefer the granular API, an equivalent setExpressions()
 * implementation is included at the bottom of this file (commented out)
 * for reference.
 */

(function initSatWalkthrough() {
  var elt = document.getElementById('calculator');
  if (!elt) {
    console.error('desmos-sat-walkthrough: missing <div id="calculator">');
    return;
  }
  if (typeof Desmos === 'undefined' || !Desmos.GraphingCalculator) {
    console.error(
      'desmos-sat-walkthrough: Desmos API not loaded. Include ' +
      '<script src="https://www.desmos.com/api/v1.11/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"></script> ' +
      'before this file.'
    );
    return;
  }

  // Sensible defaults; tweak to taste.
  var calculator = Desmos.GraphingCalculator(elt, {
    expressions: true,
    expressionsCollapsed: false,
    keypad: true,
    settingsMenu: true,
    zoomButtons: true,
    showResetButtonOnGraphpaper: false,
    border: true,
    lockViewport: false,
    invertedColors: false,
    language: 'en'
  });

  // Expose for debugging / further scripting.
  window.calculator = calculator;

  // --- Faithful state, mirrored from Calc.getState() of the source graph ---
  var state = {
    version: 11,
    randomSeed: 'b7705e259382792c021045b39970261a',
    graph: {
      viewport: {
        xmin: -3.4595030063153605,
        ymin: 9.922911996681346,
        xmax: 13.21462685324096,
        ymax: 22.428509391348587
      },
      __v12ViewportLatexStash: {
        xmin: '-3.4595030063153605',
        xmax: '13.21462685324096',
        ymin: '9.922911996681346',
        ymax: '22.428509391348587'
      }
    },
    expressions: {
      list: [
        // ============================================================
        // PROBLEM 1 — SAT regression walkthrough
        // ============================================================
        // Problem statement: (1/3)x^2 - 2 can be rewritten as
        // (1/3)(x - k)(x + k). Find k.
        // Strategy: replace x with x_1 (a constant), swap "=" for "~",
        // and let Desmos solve the regression for k.
        // ============================================================
        { type: 'folder', id: '42', title: 'problem 1', collapsed: true },

        // Step 1 — show the original expression
        { type: 'text', id: '15', folderId: '42', text: 'The expression below:' },
        {
          type: 'expression',
          id: '17',
          folderId: '42',
          color: '#388c46',
          latex: '\\frac{1}{3}x^{2}-2',
          hidden: true
        },

        // Step 2 — show the rewritten form
        {
          type: 'expression',
          id: '20',
          folderId: '42',
          color: '#000000',
          latex: '\\frac{1}{3}\\left(x-k\\right)\\left(x+k\\right)',
          hidden: true
        },
        { type: 'text', id: '19', folderId: '42', text: 'Can be rewritten as:' },
        {
          type: 'text',
          id: '26',
          folderId: '42',
          text: 'Where k is a positive constant. What is the value of k?'
        },

        // Step 3 — explain the algebraic equivalence
        {
          type: 'text',
          id: '28',
          folderId: '42',
          text:
            'The problem states the first expression can be rewritten as ' +
            'the second. Thus, they are equal to eachother and can be ' +
            'solved algebraically.'
        },

        // Step 4 — set up the regression trick
        {
          type: 'text',
          id: '36',
          folderId: '42',
          text:
            'Instead of solving by hand, quickly use regressions. Set the ' +
            'two expressions equal to each other then replace variables ' +
            'with constants and the equals sign with a tilde.'
        },

        // Step 5 — the regression itself: x -> x_1 (treated as a list of
        // constants), "=" -> "~". Desmos fits k. The fitted value is
        // preserved here so the panel matches the source graph on first paint.
        {
          type: 'expression',
          id: '31',
          folderId: '42',
          color: '#388c46',
          latex:
            '\\frac{1}{3}x_{1}^{2}-2\\sim' +
            '\\frac{1}{3}\\left(x_{1}-k\\right)\\left(x_{1}+k\\right)',
          residualVariable: 'e_{1}',
          regressionParameters: { k: 2.4494897427831783 }
        },

        // Step 6 — interpret the result
        {
          type: 'text',
          id: '40',
          folderId: '42',
          text:
            '2.45 is roughly your answer. To double check, plug K back into ' +
            'to its original expression. If the graphs are identical, then ' +
            'the regression is correct.'
        },

        // ============================================================
        // PROBLEM 2 — linear regression from a data table
        // ============================================================
        // Problem statement: a linear function passes through the points
        // in the table. Which expression matches?
        // Strategy A: run a linear regression directly on the table.
        // Strategy B: graph each candidate and see which one hits
        // every point.
        //
        // NOTE — items 53/54/55/56/57/59 below are intentionally NOT
        // inside folder "44". This mirrors the source graph exactly:
        // those items live at the root list, even though they describe
        // problem 2 visually. Adding folderId here would diverge from
        // the source.
        // ============================================================
        { type: 'folder', id: '44', title: 'problem 2' },

        // Step 1 — the data table, with an embedded linear regression
        // that draws the green best-fit line (id "60"). The x column
        // (id "48") is hidden so only the y values are visible in-panel.
        {
          id: '50',
          type: 'table',
          folderId: '44',
          columns: [
            {
              values: ['-1', '0', '1', '2'],
              hidden: true,
              id: '48',
              color: '#6042a6',
              latex: 'x_{1}'
            },
            {
              values: ['12', '15', '18', '21'],
              id: '49',
              color: '#000000',
              latex: 'y_{1}'
            }
          ],
          regression: {
            type: 'linear',
            columnIds: { x: '48', y: '49' },
            id: '60',
            color: '#388c46',
            lineStyle: 'SOLID',
            hidden: false,
            isLogMode: false,
            residualVariable: 'e_{2}'
          }
        },

        // Step 2 — restate the question
        {
          type: 'text',
          id: '53',
          text:
            'When the linear function is graphed in the xy-plane, the ' +
            'graph contains the corresponding values shown in the table ' +
            'above. Which of the following could represent the function?'
        },

        // Step 3 — the four candidate answer choices, each hidden by
        // default so the user can toggle them on one at a time.
        { type: 'expression', id: '54', color: '#388c46', latex: '3x+12',  hidden: true },
        { type: 'expression', id: '55', color: '#6042a6', latex: '15x+12', hidden: true },
        { type: 'expression', id: '56', color: '#000000', latex: '15x+15', hidden: true },
        { type: 'expression', id: '57', color: '#c74440', latex: '3x+15',  hidden: true },

        // Step 4 — the punchline
        {
          type: 'text',
          id: '59',
          text:
            "There's two ways to solve this. Either export a linear " +
            'regression from the table (already done above) or simply ' +
            'graph each answer choice and see which expression contains ' +
            'each of the given points. It\'s that easy!'
        }
      ]
    },
    includeFunctionParametersInRandomSeed: true,
    doNotMigrateMovablePointStyle: true
  };

  // setState is the cleanest way to load a snapshot produced by getState.
  // allowUndefined keeps the regression usable even before the table
  // values fully resolve on first paint.
  calculator.setState(state, { allowUndefined: true });
})();


/* ---------------------------------------------------------------------------
 * Reference: the same graph constructed via setExpressions().
 * Uncomment if you would rather build the graph imperatively. The visual
 * result is equivalent for everything except the per-graph randomSeed and
 * the v12 viewport latex stash, which only setState can populate.
 * ---------------------------------------------------------------------------

// calculator.setMathBounds({
//   left: -3.4595030063153605,
//   right: 13.21462685324096,
//   bottom: 9.922911996681346,
//   top: 22.428509391348587
// });
//
// calculator.setExpressions([
//   { type: 'folder', id: '42', title: 'problem 1', collapsed: true },
//   { type: 'text', id: '15', folderId: '42', text: 'The expression below:' },
//   { type: 'expression', id: '17', folderId: '42', color: '#388c46',
//     latex: '\\frac{1}{3}x^{2}-2', hidden: true },
//   { type: 'expression', id: '20', folderId: '42', color: '#000000',
//     latex: '\\frac{1}{3}\\left(x-k\\right)\\left(x+k\\right)', hidden: true },
//   { type: 'text', id: '19', folderId: '42', text: 'Can be rewritten as:' },
//   { type: 'text', id: '26', folderId: '42',
//     text: 'Where k is a positive constant. What is the value of k?' },
//   { type: 'text', id: '28', folderId: '42',
//     text: 'The problem states the first expression can be rewritten as the second. Thus, they are equal to eachother and can be solved algebraically.' },
//   { type: 'text', id: '36', folderId: '42',
//     text: 'Instead of solving by hand, quickly use regressions. Set the two expressions equal to each other then replace variables with constants and the equals sign with a tilde.' },
//   { type: 'expression', id: '31', folderId: '42', color: '#388c46',
//     latex: '\\frac{1}{3}x_{1}^{2}-2\\sim\\frac{1}{3}\\left(x_{1}-k\\right)\\left(x_{1}+k\\right)' },
//   { type: 'text', id: '40', folderId: '42',
//     text: '2.45 is roughly your answer. To double check, plug K back into to its original expression. If the graphs are identical, then the regression is correct.' },
//
//   { type: 'folder', id: '44', title: 'problem 2' },
//   {
//     id: '50', type: 'table', folderId: '44',
//     columns: [
//       { id: '48', latex: 'x_{1}', color: '#6042a6', hidden: true,
//         values: ['-1', '0', '1', '2'] },
//       { id: '49', latex: 'y_{1}', color: '#000000',
//         values: ['12', '15', '18', '21'] }
//     ]
//   },
//   // The table-bound regression has to be added separately when going
//   // through setExpressions; setState handles it as part of the table item.
//   { type: 'expression', id: '60', color: '#388c46',
//     latex: 'y_{1}\\sim mx_{1}+b', residualVariable: 'e_{2}' },
//   { type: 'text', id: '53',
//     text: 'When the linear function is graphed in the xy-plane, the graph contains the corresponding values shown in the table above. Which of the following could represent the function?' },
//   { type: 'expression', id: '54', color: '#388c46', latex: '3x+12',  hidden: true },
//   { type: 'expression', id: '55', color: '#6042a6', latex: '15x+12', hidden: true },
//   { type: 'expression', id: '56', color: '#000000', latex: '15x+15', hidden: true },
//   { type: 'expression', id: '57', color: '#c74440', latex: '3x+15',  hidden: true },
//   { type: 'text', id: '59',
//     text: "There's two ways to solve this. Either export a linear regression from the table (already done above) or simply graph each answer choice and see which expression contains each of the given points. It's that easy!" }
// ]);
 *
 * Caveats of the imperative path:
 *   - The Problem-2 regression line is wired through a separate expression
 *     using `y_1 ~ m x_1 + b` rather than the table's built-in `regression`
 *     sub-object. The visible curve is identical; only the underlying
 *     state shape differs.
 *   - residualVariable is supported per-expression; regressionParameters is
 *     accepted only as initial values — Desmos will refit on load either
 *     way, so the result converges to the same k ≈ 2.4495.
 * --------------------------------------------------------------------------- */
