// AP hub: course tiles at "#", and the MCQ unit picker for a course at
// "#<course-slug>". Courses, banks, and progress come from mcq-bank.js (see
// docs/ap-mcq-bank.md); the Start buttons hand the selection to mcq-player.html.
import { COURSES, getCourse, unitLabel, loadBank, filterQuestions, unitStats, loadProgress, saveProgress, playerUrl } from './mcq-bank.js';

const EXAM_START = new Date(2027, 4, 3);
const COURSE_ICONS = { 'ap-calculus-ab': 'calculate', 'ap-us-history': 'history_edu', 'ap-physics-1': 'speed', 'ap-biology': 'biotech', 'ap-physics-c-mechanics': 'bolt', 'ap-physics-2': 'waves', 'ap-psychology': 'psychology', 'ap-precalculus': 'functions' };

const $ = (id) => document.getElementById(id);
const SVG = (body, extra = '') => `<svg class="sat-ico ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICONS = {
  calculator: SVG('<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/>'),
  completed: SVG('<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>'),
  result: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 3 a9 9 0 0 1 0 18 z" fill="currentColor" stroke="none"/>'),
  kind: SVG('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z"/>'),
  caret: SVG('<polyline points="6 9 12 15 18 9"/>', 'sat-caret'),
  check: SVG('<polyline points="20 6 9 17 4 12"/>', 'sat-filter-check'),
  reset: SVG('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
};
const FILTERS = [
  { key: 'calculator', label: 'Calculator', calculatorOnly: true, options: [{ value: '', label: 'All questions' }, { value: 'non-calculator', label: 'No calculator' }, { value: 'calculator', label: 'Calculator' }] },
  { key: 'kind', label: 'Question type', kindsOnly: true, options: [{ value: '', label: 'All questions' }, { value: 'conceptual', label: 'Conceptual' }, { value: 'quantitative', label: 'Calculation' }] },
  { key: 'completed', label: 'Completed', options: [{ value: 'all', label: 'All questions' }, { value: 'completed', label: 'Completed' }, { value: 'incomplete', label: 'Not completed' }] },
  { key: 'result', label: 'Result', options: [{ value: 'all', label: 'All questions' }, { value: 'correct', label: 'Correct' }, { value: 'incorrect', label: 'Incorrect' }] },
];

const banks = {};      // slug -> validated bank, or null when it failed to load
const progress = {};   // slug -> { questionId: chosenIndex }
const state = { course: null, units: [], calculator: '', kind: '', completed: 'all', result: 'all', limit: null, random: false };

const limitInput = $('limitInput'), limitDropdown = $('limitDropdown'), limitToggle = $('limitToggle'), limitToggleLabel = $('limitToggleLabel');
const filtersToggle = $('filtersToggle'), filtersBadge = $('filtersBadge'), filterRow = $('filterRow');
const hubPill = $('hubPill'), hubPillCount = $('hubPillCount'), hubPillRandomize = $('hubPillRandomize');

const activeFilters = () => FILTERS.filter(f => (!f.calculatorOnly || getCourse(state.course)?.hasCalculator) && (!f.kindsOnly || getCourse(state.course)?.hasKinds));
const accClass = pct => (pct >= 60 ? 'is-good' : pct >= 35 ? 'is-mid' : 'is-low');
const matching = (slug, units = []) => banks[slug] ? filterQuestions(banks[slug], { ...state, units }, progress[slug]) : [];

// ── Hub ──
function renderHub() {
  const hour = new Date().getHours();
  $('hubGreeting').textContent = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  $('hubName').textContent = localStorage.getItem('korah_first_name') || 'there';
  $('hubExamDate').textContent = EXAM_START.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  renderJump();
  $('hubCourses').innerHTML = COURSES.map(c => `
    <a class="ap-hub-course tone-${c.tone}" href="#${c.slug}">
      <span class="material-icons-round ap-hub-course-icon">${COURSE_ICONS[c.slug]}</span>
      <div class="ap-hub-course-top">
        <div class="ap-hub-course-name">${c.name}</div>
      </div>
      <span class="ap-hub-course-open">Open <span class="material-icons-round">chevron_right</span></span>
    </a>`).join('');
}

// Two shortcut pills at a time. Each fills with a tint over JUMP_MS (the CSS
// animation uses the same 5s), fades out, then two courses that are not on
// screen replace them. The last pair is remembered so a reload starts on others.
const JUMP_MS = 5000, JUMP_OUT_MS = 350;
let jumpPair = [];
try { jumpPair = JSON.parse(localStorage.getItem('korah_ap_jump') || '[]'); } catch { /* start fresh */ }
function renderJump() {
  const pool = COURSES.filter(c => !jumpPair.includes(c.slug));
  jumpPair = [...pool].sort(() => Math.random() - 0.5).slice(0, 2).map(c => c.slug);
  try { localStorage.setItem('korah_ap_jump', JSON.stringify(jumpPair)); } catch { /* storage blocked */ }
  $('hubJump').innerHTML = jumpPair.map(getCourse).map(c => `<a class="tone-${c.tone}" href="#${c.slug}"><span class="material-icons-round">${COURSE_ICONS[c.slug]}</span>${c.name}</a>`).join('');
  setTimeout(() => $('hubJump').classList.add('is-leaving'), JUMP_MS);
  setTimeout(() => { $('hubJump').classList.remove('is-leaving'); renderJump(); }, JUMP_MS + JUMP_OUT_MS);
}

async function renderStats() {
  const api = window.KorahAPQuestions;
  if (!api) return;
  try {
    const s = await api.getSummary();
    $('hubAttempted').textContent = s.attempted;
    $('hubAccuracy').textContent = s.attempted ? `${Math.round((s.correct / s.attempted) * 100)}%` : '—';
    $('hubSaved').textContent = s.saved;
    $('hubErrors').textContent = s.errors;
    $('hubSavedBtn').hidden = !s.saved;
    $('hubErrorsBtn').hidden = !s.errors;
    // Copy the account's latest MCQ answers into each course's local progress, so
    // the unit Progress and Accuracy columns match on every device.
    COURSES.forEach(c => {
      const local = loadProgress(c.slug);
      let changed = false;
      s.latest.forEach((o, id) => {
        if (id.startsWith(c.slug + '-mcq-') && Number.isInteger(o.choice) && local[id] !== o.choice) { local[id] = o.choice; changed = true; }
      });
      if (changed) { saveProgress(c.slug, local); progress[c.slug] = local; }
    });
    if (state.course && banks[state.course]) renderAll();
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

// ── Filters ──
function renderFilters() {
  filterRow.innerHTML = activeFilters().map(f => `
    <div class="sat-filter-dd" data-filter="${f.key}">
      <button class="sat-filter-btn" type="button" data-filter-btn="${f.key}" aria-haspopup="true" aria-expanded="false">
        ${ICONS[f.key]}<span class="sat-filter-btn-label">${f.label}</span><span class="sat-filter-btn-count" data-count-for="${f.key}"></span>${ICONS.caret}
      </button>
      <div class="sat-filter-menu" role="menu" aria-label="${f.label}">
        ${f.options.map(o => `<button class="sat-filter-option" type="button" role="menuitemradio" data-filter="${f.key}" data-value="${o.value}"><span class="sat-filter-option-label">${o.label}</span>${ICONS.check}</button>`).join('')}
      </div>
    </div>`).join('') + `<button id="resetFiltersBtn" class="sat-reset-filters t-btn" type="button">${ICONS.reset}<span>Reset filters</span></button>`;
}
function updateFilterUI() {
  let active = 0;
  activeFilters().forEach(f => {
    const value = state[f.key], isDefault = value === f.options[0].value;
    filterRow.querySelectorAll(`.sat-filter-option[data-filter="${f.key}"]`).forEach(opt => {
      opt.classList.toggle('is-selected', opt.dataset.value === value);
      opt.setAttribute('aria-checked', opt.dataset.value === value ? 'true' : 'false');
    });
    filterRow.querySelector(`[data-count-for="${f.key}"]`).textContent = isDefault ? '' : f.options.find(o => o.value === value).label;
    filterRow.querySelector(`[data-filter-btn="${f.key}"]`).classList.toggle('is-active', !isDefault);
    if (!isDefault) active++;
  });
  filtersBadge.textContent = String(active);
  filtersBadge.hidden = active === 0;
  filtersToggle.classList.toggle('is-set', active > 0);
}
function closeMenus() {
  filterRow.querySelectorAll('.sat-filter-dd.is-open').forEach(dd => dd.classList.remove('is-open'));
  filterRow.querySelectorAll('[data-filter-btn]').forEach(b => b.setAttribute('aria-expanded', 'false'));
}
function closeLimitMenu() {
  limitDropdown.classList.remove('is-open');
  limitToggle.classList.remove('is-open');
  limitToggle.setAttribute('aria-expanded', 'false');
}

// ── Unit picker ──
function renderUnits() {
  const course = getCourse(state.course);
  if (!course) { $('unitList').innerHTML = ''; return; }
  const all = matching(course.slug), stats = unitStats(banks[course.slug], all, progress[course.slug]);
  const allSelected = state.units.length === course.units.length;
  const rows = course.units.map((_, i) => {
    const unit = i + 1, { total, attempts, correct } = stats[i];
    const pct = total ? Math.round(attempts / total * 100) : 0, accuracy = attempts ? Math.round(correct / attempts * 100) : null;
    const label = unitLabel(course, unit), on = state.units.includes(unit);
    return `<div class="ap-mcq-row${total ? '' : ' is-empty'}">
      <button class="sat-check ${on ? 'is-active' : ''}" type="button" data-select-unit="${unit}" aria-pressed="${on}" aria-label="Select ${label}"${total ? '' : ' disabled'}></button>
      <button class="ap-mcq-name" type="button" data-select-unit="${unit}"${total ? '' : ' disabled'}>${label}</button>
      <div class="ap-mcq-progress">${total ? `<div class="sat-progress-track"><span class="sat-progress-fill" style="width:${pct}%"></span></div><span class="sat-progress-frac"><b>${attempts}</b>/${total}</span>` : '<span class="sat-progress-frac sat-acc-empty">0 match</span>'}</div>
      <div class="ap-mcq-acc">${accuracy === null ? '<span class="sat-acc-val sat-acc-empty">–</span>' : `<span class="sat-acc-dot ${accClass(accuracy)}"></span><span class="sat-acc-val">${accuracy}%</span>`}</div>
    </div>`;
  }).join('');
  $('unitList').innerHTML = `<div class="ap-mcq-units tone-${course.tone}">
    <div class="ap-mcq-head"><span>Unit</span><span>Progress</span><span>Accuracy</span></div>
    <div class="ap-mcq-row ap-mcq-all">
      <button class="sat-check ${allSelected ? 'is-active' : ''}" type="button" data-select-all aria-pressed="${allSelected}" aria-label="Select all units"></button>
      <button class="ap-mcq-name" type="button" data-select-all>All ${course.noun}s</button>
    </div>
    ${rows}
  </div>`;
  $('practiceAllDesc').textContent = all.length
    ? `Start practicing all ${course.units.length} ${course.noun}s in ${course.name} (${all.length} question${all.length === 1 ? '' : 's'}).`
    : 'No questions match these filters. Reset the filters to see the full bank.';
  $('practiceAllBtn').disabled = !all.length;
}
function renderPill() {
  const course = getCourse(state.course), n = state.units.length;
  if (course && n > 0) {
    const count = matching(course.slug, state.units).length;
    hubPill.removeAttribute('hidden');
    hubPillCount.textContent = `${n} ${course.noun}${n === 1 ? '' : 's'} selected · ${count} question${count === 1 ? '' : 's'}`;
    $('hubPillStart').disabled = count === 0;
  } else hubPill.setAttribute('hidden', '');
  hubPillRandomize.classList.toggle('is-active', state.random);
  hubPillRandomize.setAttribute('aria-pressed', state.random ? 'true' : 'false');
}
function renderSources(slug) {
  const bank = banks[slug];
  const escape = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const html = bank ? Object.values(bank.sources).filter(s => /^https:\/\//.test(s.url))
    .map(s => `<p><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a> — ${escape(s.note)}</p>`).join('') : '';
  $('mcqSourceList').innerHTML = html;
  $('mcqSources').hidden = !html;
}
function renderAll() { updateFilterUI(); renderUnits(); renderPill(); }

async function openCourse(slug) {
  const course = getCourse(slug);
  Object.assign(state, { course: slug, units: [], calculator: '', kind: '', completed: 'all', result: 'all', limit: null, random: false });
  limitInput.value = '';
  limitToggleLabel.textContent = 'Question Limit';
  limitToggle.classList.remove('is-set');
  $('crumbCourse').textContent = course.name;
  $('courseTitle').textContent = course.name;
  $('practiceAllBtn').disabled = true;
  $('practiceAllDesc').textContent = '';
  $('mcqSources').hidden = true;
  $('unitList').innerHTML = '<p class="ap-hub-empty">Loading questions…</p>';
  renderPill();
  await ensureBank(slug);
  if (state.course !== slug) return;
  if (!banks[slug]) {
    $('unitList').innerHTML = '<p class="ap-hub-empty">Could not load this question bank.</p>';
    return;
  }
  renderFilters();
  renderAll();
  renderSources(slug);
}
function start(units) {
  if (!state.course || !matching(state.course, units).length) return;
  const url = playerUrl({ ...state, units });
  if (window.KorahTransitions?.go) window.KorahTransitions.go(url); else location.href = url;
}

// Loads a course's bank once; a failure is remembered as null so a tile does not retry.
const loading = {};
function ensureBank(slug) {
  progress[slug] = loadProgress(slug);
  return loading[slug] ||= loadBank(slug).then(bank => { banks[slug] = bank; }).catch(error => { console.error('[AP MCQ]', slug, error); banks[slug] = null; });
}

// Swap views immediately and let the incoming one rise in. The bank loads
// behind it (see openCourse), so nothing waits.
function route() {
  const slug = window.location.hash.slice(1);
  const isCourse = !!getCourse(slug);
  const show = $(isCourse ? 'courseView' : 'hubView');
  const hide = $(isCourse ? 'hubView' : 'courseView');
  if (isCourse) openCourse(slug);
  else { state.course = null; state.units = []; renderPill(); }
  hide.hidden = true;
  show.hidden = false;
  show.classList.remove('is-entering');
  void show.offsetWidth;
  show.classList.add('is-entering');
}

// ── Events ──
$('unitList').addEventListener('click', e => {
  const course = getCourse(state.course);
  if (!course) return;
  if (e.target.closest('[data-select-all]')) state.units = state.units.length === course.units.length ? [] : course.units.map((_, i) => i + 1);
  else {
    const unit = Number(e.target.closest('[data-select-unit]')?.dataset.selectUnit);
    if (!unit) return;
    state.units = state.units.includes(unit) ? state.units.filter(u => u !== unit) : [...state.units, unit];
  }
  renderAll();
});
limitInput.addEventListener('input', () => {
  const parsed = Number(limitInput.value.trim());
  state.limit = Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  limitToggleLabel.textContent = state.limit !== null ? `Limit: ${state.limit}` : 'Question Limit';
  limitToggle.classList.toggle('is-set', state.limit !== null);
});
limitToggle.addEventListener('click', () => {
  const willOpen = !limitDropdown.classList.contains('is-open');
  limitDropdown.classList.toggle('is-open', willOpen);
  limitToggle.classList.toggle('is-open', willOpen);
  limitToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  if (willOpen) { closeMenus(); setTimeout(() => limitInput.focus(), 50); }
});
filtersToggle.addEventListener('click', () => {
  const willOpen = filterRow.hasAttribute('hidden');
  closeLimitMenu();
  if (willOpen) filterRow.removeAttribute('hidden'); else { filterRow.setAttribute('hidden', ''); closeMenus(); }
  filtersToggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
  filtersToggle.classList.toggle('is-open', willOpen);
});
filterRow.addEventListener('click', e => {
  if (e.target.closest('#resetFiltersBtn')) { Object.assign(state, { calculator: '', kind: '', completed: 'all', result: 'all' }); closeMenus(); renderAll(); return; }
  const option = e.target.closest('.sat-filter-option');
  if (option) {
    state[option.dataset.filter] = option.dataset.value;
    // A unit left with no matching questions cannot stay selected.
    state.units = state.units.filter(u => matching(state.course, [u]).length);
    closeMenus(); renderAll(); return;
  }
  const btn = e.target.closest('[data-filter-btn]');
  if (btn) {
    const dd = btn.closest('.sat-filter-dd'), willOpen = !dd.classList.contains('is-open');
    closeMenus();
    if (willOpen) { closeLimitMenu(); dd.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
  }
});
document.addEventListener('click', e => {
  if (!filterRow.contains(e.target) && !filtersToggle.contains(e.target)) closeMenus();
  if (!limitDropdown.contains(e.target)) closeLimitMenu();
});
$('practiceAllBtn').addEventListener('click', () => start([]));
hubPillRandomize.addEventListener('click', () => { state.random = !state.random; renderPill(); });
$('hubPillStart').addEventListener('click', () => start(state.units));

// A bare "#" link would be treated as a new page by page-transitions.js, so
// the breadcrumb clears the hash in place instead.
document.querySelector('.ap-hub-crumb a').addEventListener('click', e => {
  e.preventDefault();
  history.pushState(null, '', window.location.pathname + window.location.search);
  route();
});

// Returning from the player via the back button restores this page from the
// back/forward cache, so re-read progress to refresh the unit rows.
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  COURSES.forEach(c => { progress[c.slug] = loadProgress(c.slug); });
  if (state.course && banks[state.course]) renderAll();
  renderStats();
});
window.addEventListener('hashchange', route);
COURSES.forEach(c => ensureBank(c.slug));
window.addEventListener('korahAPQuestionsReady', renderStats);
renderStats();
renderHub();
tickCountdown();
setInterval(tickCountdown, 1000);
route();
