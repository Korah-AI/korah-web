// AP hub: subject cards at "#", and a per-course question bank section at
// "#<course-slug>". Units, subtopics, and counts come from the course's
// questions.json (see docs/ap-question-bank.md); the Start buttons hand
// the selection to practice.html.
(function () {
  'use strict';

  const AP = window.KorahAP;
  if (!AP) return;

  const EXAM_START = new Date(2027, 4, 3);
  const TONES = { 'ap-calculus-ab': 'tone-calc', 'ap-us-history': 'tone-apush' };
  const SKELETON = Array.from({ length: 8 }, () => `
    <div class="ap-hub-unit-row">
      <span class="skel ap-hub-skel-check"></span>
      <div style="flex:1;"><span class="skel skel-skill-name"></span><span class="skel skel-skill-sub"></span></div>
    </div>`).join('');
  const CARET = '<svg class="sat-ico ap-hub-unit-caret" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

  const $ = (id) => document.getElementById(id);
  const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const state = { slug: '', bank: null, units: new Set(), subs: new Set(), open: new Set(), difficulties: new Set(), random: false, counts: { u: {}, s: {} } };

  function renderHub() {
    const hour = new Date().getHours();
    $('hubGreeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    $('hubName').textContent = localStorage.getItem('korah_first_name') || 'there';
    $('hubExamDate').textContent = EXAM_START.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    $('hubJump').innerHTML = AP.getCourses().map((c) => `<a href="#${esc(c.slug)}"><span class="material-icons-round">${esc(c.icon)}</span>${esc(c.name)}</a>`).join('');
    $('hubCourses').innerHTML = AP.getCourses().map((c) => `
      <a class="ap-hub-course ${TONES[c.slug] || 'tone-calc'}" href="#${esc(c.slug)}">
        <span class="material-icons-round ap-hub-course-icon">${esc(c.icon)}</span>
        <div class="ap-hub-course-top">
          <div class="ap-hub-course-name">${esc(c.name)}</div>
          <!-- <div class="ap-hub-course-sub">Question bank by unit and subtopic</div> -->
        </div>
        <span class="ap-hub-course-open">Open <span class="material-icons-round">chevron_right</span></span>
      </a>`).join('');
  }

  async function renderStats() {
    const api = window.KorahAPQuestions;
    if (!api) return;
    try {
      const s = await api.getSummary();
      $('hubAttempted').textContent = s.attempted;
      $('hubAccuracy').textContent = s.attempted ? `${Math.round((s.correct / s.attempted) * 100)}%` : '\u2014';
      $('hubSaved').textContent = s.saved;
      $('hubErrors').textContent = s.errors;
      $('hubSavedBtn').hidden = !s.saved;
      $('hubErrorsBtn').hidden = !s.errors;
    } catch (e) {
      console.warn('[AP] stats unavailable', e);
    }
  }

  function tickCountdown() {
    const ms = Math.max(0, EXAM_START - Date.now());
    const pad = (n) => String(n).padStart(2, '0');
    $('hubCdDays').textContent = Math.floor(ms / 864e5);
    $('hubCdHours').textContent = pad(Math.floor(ms / 36e5) % 24);
    $('hubCdMins').textContent = pad(Math.floor(ms / 6e4) % 60);
    $('hubCdSecs').textContent = pad(Math.floor(ms / 1e3) % 60);
  }

  function tally() {
    const u = {}, s = {};
    state.bank.questions.forEach((q) => {
      if (q.status === 'retired') return;
      u[q.unit] = (u[q.unit] || 0) + 1;
      if (q.subtopic) s[q.subtopic] = (s[q.subtopic] || 0) + 1;
    });
    state.counts = { u, s };
  }

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function renderUnits() {
    const { u, s } = state.counts;
    $('unitList').innerHTML = (state.bank.units || []).map((unit) => {
      const subs = unit.subtopics || [];
      const unitOn = state.units.has(unit.id);
      const total = u[unit.id] || 0;
      const meta = (subs.length ? `<span>${plural(subs.length, 'subtopic')}</span>` : '') + `<span>${plural(total, 'question')}</span>`;
      const rows = subs.length
        ? subs.map((sub) => {
          const on = unitOn || state.subs.has(sub.id);
          return `<div class="ap-hub-sub" data-sub="${esc(sub.id)}" data-unit="${esc(unit.id)}">
            <span class="sat-check${on ? ' is-active' : ''}"></span>
            <span class="ap-hub-sub-name">${esc(sub.title)}</span>
            <span class="ap-hub-sub-count">${plural(s[sub.id] || 0, 'question')}</span>
          </div>`;
        }).join('')
        : '<p class="ap-hub-empty">Subtopics coming soon.</p>';
      return `<div class="ap-hub-unit${state.open.has(unit.id) ? ' is-open' : ''}" data-unit="${esc(unit.id)}">
        <div class="ap-hub-unit-row">
          <button class="sat-check${unitOn ? ' is-active' : ''}" type="button" data-action="unit" aria-label="Select ${esc(unit.title)}"></button>
          <button class="ap-hub-unit-main" type="button" data-action="expand">
            <span class="ap-hub-unit-title">${esc(unit.title)}</span>
            <span class="ap-hub-unit-meta">${meta}</span>
          </button>
          ${CARET}
        </div>
        <div class="ap-hub-unit-subs">${rows}</div>
      </div>`;
    }).join('');
  }

  function renderPill() {
    const n = state.units.size + state.subs.size;
    const parts = [];
    if (state.units.size) parts.push(plural(state.units.size, 'unit'));
    if (state.subs.size) parts.push(plural(state.subs.size, 'subtopic'));
    $('hubPillCount').textContent = n ? `${parts.join(', ')} selected` : '';
    $('hubPill').hidden = !n;
    $('hubPillRandomize').classList.toggle('is-active', state.random);
    $('hubPillRandomize').setAttribute('aria-pressed', String(state.random));
    const d = state.difficulties.size;
    $('difficultyCount').textContent = d ? d : '';
    $('difficultyToggle').classList.toggle('is-active', d > 0);
    document.querySelectorAll('[data-difficulty]').forEach((o) => o.classList.toggle('is-selected', state.difficulties.has(o.dataset.difficulty)));
  }

  function toggleUnit(id) {
    const unit = state.bank.units.find((x) => x.id === id);
    if (state.units.has(id)) {
      state.units.delete(id);
    } else {
      state.units.add(id);
      (unit.subtopics || []).forEach((sub) => state.subs.delete(sub.id));
    }
  }

  // A subtopic of a selected unit narrows the unit to its other subtopics.
  function toggleSub(unitId, subId) {
    const unit = state.bank.units.find((x) => x.id === unitId);
    const all = (unit.subtopics || []).map((sub) => sub.id);
    if (state.units.has(unitId)) {
      state.units.delete(unitId);
      all.forEach((id) => { if (id !== subId) state.subs.add(id); });
    } else {
      state.subs.has(subId) ? state.subs.delete(subId) : state.subs.add(subId);
      if (all.every((id) => state.subs.has(id))) {
        all.forEach((id) => state.subs.delete(id));
        state.units.add(unitId);
      }
    }
  }

  function startUrl(all) {
    const p = new URLSearchParams({ course: state.slug });
    if (!all && state.units.size) p.set('units', [...state.units].join(','));
    if (!all && state.subs.size) p.set('subtopics', [...state.subs].join(','));
    if (state.difficulties.size) p.set('difficulties', [...state.difficulties].join(','));
    const limit = parseInt($('limitInput').value, 10);
    if (limit > 0) p.set('limit', String(limit));
    if (state.random) p.set('random', '1');
    return `./practice.html?${p}`;
  }

  function go(url) {
    if (window.KorahTransitions) window.KorahTransitions.go(url);
    else window.location.href = url;
  }

  async function openCourse(slug) {
    const course = AP.getCourse(slug);
    state.slug = slug;
    state.units.clear(); state.subs.clear(); state.open.clear(); state.difficulties.clear();
    state.random = false;
    $('limitInput').value = '';
    $('limitToggleLabel').textContent = 'Question Limit';
    $('crumbCourse').textContent = course.name;
    $('courseTitle').textContent = course.name;
    $('practiceAllDesc').textContent = `Start practicing every unit in ${course.name}.`;
    state.bank = null;
    renderPill();
    // Skeleton rows stand in until the JSON arrives. A prefetched bank resolves
    // in a microtask, so in that case the skeleton never reaches the screen.
    $('unitList').innerHTML = SKELETON;
    const bank = await AP.loadQuestionBank(slug).catch(() => null);
    if (state.slug !== slug) return;
    if (!bank) {
      $('unitList').innerHTML = '<p class="ap-hub-empty">Could not load this question bank.</p>';
      return;
    }
    state.bank = bank;
    tally();
    renderUnits();
  }

  // Swap views immediately and let the incoming one rise in. The course data
  // loads behind it (see the skeleton in openCourse), so nothing waits.
  function route() {
    const slug = window.location.hash.slice(1);
    const isCourse = !!AP.getCourse(slug);
    const show = $(isCourse ? 'courseView' : 'hubView');
    const hide = $(isCourse ? 'hubView' : 'courseView');
    if (isCourse) openCourse(slug);
    else $('hubPill').hidden = true;
    hide.hidden = true;
    show.hidden = false;
    show.classList.remove('is-entering');
    void show.offsetWidth;
    show.classList.add('is-entering');
  }

  function closeMenus(except) {
    document.querySelectorAll('.sat-filter-dd.is-open, .sat-limit-dd.is-open').forEach((dd) => {
      if (dd === except) return;
      dd.classList.remove('is-open');
      dd.querySelector('button').setAttribute('aria-expanded', 'false');
    });
    $('limitToggle').classList.toggle('is-open', except === $('limitDropdown'));
  }

  function toggleMenu(dd) {
    const willOpen = !dd.classList.contains('is-open');
    closeMenus(willOpen ? dd : null);
    dd.classList.toggle('is-open', willOpen);
    dd.querySelector('button').setAttribute('aria-expanded', String(willOpen));
    if (dd === $('limitDropdown')) $('limitToggle').classList.toggle('is-open', willOpen);
  }

  $('unitList').addEventListener('click', (e) => {
    const unitEl = e.target.closest('.ap-hub-unit');
    if (!unitEl) return;
    const sub = e.target.closest('.ap-hub-sub');
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (sub) toggleSub(sub.dataset.unit, sub.dataset.sub);
    else if (action === 'unit') toggleUnit(unitEl.dataset.unit);
    else if (action === 'expand' || e.target.closest('.ap-hub-unit-caret')) {
      state.open.has(unitEl.dataset.unit) ? state.open.delete(unitEl.dataset.unit) : state.open.add(unitEl.dataset.unit);
    } else return;
    renderUnits();
    renderPill();
  });

  $('limitToggle').addEventListener('click', () => toggleMenu($('limitDropdown')));
  $('difficultyToggle').addEventListener('click', () => toggleMenu($('difficultyDropdown')));
  $('limitInput').addEventListener('input', () => {
    const n = parseInt($('limitInput').value, 10);
    $('limitToggleLabel').textContent = n > 0 ? `${n} questions` : 'Question Limit';
  });
  document.querySelectorAll('[data-difficulty]').forEach((o) => o.addEventListener('click', () => {
    const d = o.dataset.difficulty;
    state.difficulties.has(d) ? state.difficulties.delete(d) : state.difficulties.add(d);
    renderPill();
  }));
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.sat-filter-dd, .sat-limit-dd')) closeMenus(null);
  });

  $('hubPillRandomize').addEventListener('click', () => { state.random = !state.random; renderPill(); });
  $('hubPillStart').addEventListener('click', () => go(startUrl(false)));
  $('practiceAllBtn').addEventListener('click', () => go(startUrl(true)));

  // A bare "#" link would be treated as a new page by page-transitions.js, so
  // the breadcrumb clears the hash in place instead.
  document.querySelector('.ap-hub-crumb a').addEventListener('click', (e) => {
    e.preventDefault();
    history.pushState(null, '', window.location.pathname + window.location.search);
    route();
  });

  window.addEventListener('hashchange', route);
  AP.getCourses().forEach((c) => AP.loadQuestionBank(c.slug).catch(() => {}));
  window.addEventListener('korahAPQuestionsReady', renderStats);
  renderStats();
  renderHub();
  tickCountdown();
  setInterval(tickCountdown, 1000);
  route();
})();
