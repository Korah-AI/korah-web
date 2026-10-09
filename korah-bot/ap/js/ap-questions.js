(function () {
  'use strict';

  const state = {
    course: new URLSearchParams(window.location.search).get('course') || 'ap-calculus-ab',
    questions: [],
    filtered: [],
    index: 0,
    selected: '',
    results: new Map(),
  };

  const $ = (id) => document.getElementById(id);

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMath(root) {
    if (!root || typeof window.renderMathInElement !== 'function') return;
    window.renderMathInElement(root, {
      delimiters: [
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  }

  function renderSession() {
    const results = Array.from(state.results.values());
    const correct = results.filter(Boolean).length;
    $('qb-attempted').textContent = results.length;
    $('qb-accuracy').textContent = results.length ? `${Math.round((correct / results.length) * 100)}%` : '0%';
  }

  function renderCourseOptions() {
    const courses = window.KorahAP.getCourses();
    if (!courses.some((course) => course.slug === state.course)) state.course = courses[0].slug;
    $('qb-course').innerHTML = courses
      .map((course) => `<option value="${esc(course.slug)}"${course.slug === state.course ? ' selected' : ''}>${esc(course.name)}</option>`)
      .join('');
  }

  function renderUnitOptions() {
    const select = $('qb-unit');
    const previous = select.value || 'all';
    const units = [];
    const seen = new Set();
    state.questions.forEach((question) => {
      if (seen.has(question.unit)) return;
      seen.add(question.unit);
      units.push({ id: question.unit, label: question.unitLabel });
    });
    select.innerHTML = '<option value="all">All units</option>' + units
      .map((unit) => `<option value="${esc(unit.id)}">${esc(unit.label)}</option>`)
      .join('');
    select.value = units.some((unit) => unit.id === previous) ? previous : 'all';
  }

  function applyFilters() {
    const unit = $('qb-unit').value;
    const difficulty = $('qb-difficulty').value;
    state.filtered = state.questions.filter((question) => {
      return (unit === 'all' || question.unit === unit)
        && (difficulty === 'all' || question.difficulty === difficulty)
        && question.status !== 'retired';
    });
    state.index = Math.min(state.index, Math.max(0, state.filtered.length - 1));
    state.selected = '';
    renderQuestion();
  }

  function calculatorLabel(value) {
    if (value === 'not-applicable') return 'No calculator policy';
    if (value === 'prohibited') return 'No calculator';
    if (value === 'required') return 'Calculator required';
    return 'Calculator allowed';
  }

  function renderQuestion() {
    const stage = $('qb-stage');
    $('qb-count').textContent = `${state.filtered.length} question${state.filtered.length === 1 ? '' : 's'} match`;
    $('qb-position').textContent = state.filtered.length ? `${state.index + 1} of ${state.filtered.length}` : '';

    if (!state.filtered.length) {
      stage.innerHTML = `
        <div class="ap-qb-empty">
          <span class="material-icons-round">search_off</span>
          <h2>No questions match these filters.</h2>
          <p>Try another unit or difficulty.</p>
        </div>`;
      return;
    }

    const question = state.filtered[state.index];
    const savedResult = state.results.has(question.id);
    const savedCorrect = state.results.get(question.id);
    const source = question.source || {};

    stage.innerHTML = `
      <article class="ap-qb-card" data-question-id="${esc(question.id)}">
        <div class="ap-qb-meta">
          <span>${esc(question.unitLabel)}</span>
          <span>${esc(question.topic)}</span>
          <span class="is-${esc(question.difficulty)}">${esc(question.difficulty)}</span>
          <span>${esc(calculatorLabel(question.calculator))}</span>
          ${question.status === 'draft' ? '<span class="is-draft">MVP sample</span>' : ''}
        </div>
        <h2 class="ap-qb-stem">${esc(question.stem)}</h2>
        <div class="ap-qb-choices" role="group" aria-label="Answer choices">
          ${question.choices.map((choice) => `
            <button type="button" class="ap-qb-choice" data-choice="${esc(choice.key)}" aria-pressed="false">
              <span class="ap-qb-choice-key">${esc(choice.key)}</span>
              <span>${esc(choice.text)}</span>
            </button>`).join('')}
        </div>
        <div class="ap-qb-feedback${savedResult ? ' is-visible ' + (savedCorrect ? 'is-correct' : 'is-incorrect') : ''}" id="qb-feedback">
          ${savedResult ? `
            <strong>${savedCorrect ? 'Correct.' : `Not quite. The answer is ${esc(question.answer)}.`}</strong>
            <p>${esc(question.explanation)}</p>` : ''}
        </div>
        <div class="ap-qb-source">
          <span class="material-icons-round">verified</span>
          <span>${esc(source.attribution || source.name || 'Source details unavailable')}</span>
        </div>
        <div class="ap-qb-actions">
          <button type="button" class="ap-qb-check" id="qb-check"${savedResult ? ' disabled' : ''}>Check answer</button>
          <button type="button" class="ap-qb-next" id="qb-next">Next question <span class="material-icons-round">arrow_forward</span></button>
        </div>
      </article>`;

    renderMath(stage);
    stage.querySelectorAll('[data-choice]').forEach((button) => {
      button.addEventListener('click', () => choose(button.dataset.choice));
    });
    $('qb-check')?.addEventListener('click', checkAnswer);
    $('qb-next')?.addEventListener('click', nextQuestion);
  }

  function choose(key) {
    const question = state.filtered[state.index];
    if (!question || state.results.has(question.id)) return;
    state.selected = key;
    document.querySelectorAll('.ap-qb-choice').forEach((button) => {
      const active = button.dataset.choice === key;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', String(active));
    });
    $('qb-check').classList.add('is-ready');
  }

  function checkAnswer() {
    const question = state.filtered[state.index];
    if (!question || !state.selected || state.results.has(question.id)) return;
    state.results.set(question.id, state.selected === question.answer);
    renderSession();
    renderQuestion();
  }

  function nextQuestion() {
    if (!state.filtered.length) return;
    state.index = (state.index + 1) % state.filtered.length;
    state.selected = '';
    renderQuestion();
  }

  function shuffleQuestions() {
    for (let i = state.filtered.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [state.filtered[i], state.filtered[j]] = [state.filtered[j], state.filtered[i]];
    }
    state.index = 0;
    state.selected = '';
    renderQuestion();
  }

  async function loadCourse() {
    const stage = $('qb-stage');
    stage.innerHTML = '<div class="ap-loading"><div class="ap-spinner"></div><div class="ap-loading-text">Loading questions...</div></div>';
    state.course = $('qb-course').value;
    history.replaceState(null, '', `?course=${encodeURIComponent(state.course)}`);
    state.questions = await window.KorahAP.loadQuestions(state.course);
    state.index = 0;
    state.selected = '';
    renderUnitOptions();
    applyFilters();
  }

  function bindEvents() {
    $('qb-course').addEventListener('change', loadCourse);
    $('qb-unit').addEventListener('change', () => {
      state.index = 0;
      applyFilters();
    });
    $('qb-difficulty').addEventListener('change', () => {
      state.index = 0;
      applyFilters();
    });
    $('qb-random').addEventListener('click', shuffleQuestions);
  }

  async function init() {
    if (!window.KorahAP) return;
    renderCourseOptions();
    bindEvents();
    await loadCourse();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
