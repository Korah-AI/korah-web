// AP MCQ bank page. Mirrors the SAT question bank (sat/js/sat-bank.js) and reuses
// its markup and classes: course tiles open a unit picker with filters, and the
// selection starts a session in mcq-player.html.
import { COURSES, getCourse, unitLabel, loadBank, filterQuestions, unitStats, loadProgress, playerUrl } from './mcq-bank.js';

const $ = id => document.getElementById(id);
const entryCards = $('entryCards'), sectionModal = $('sectionModal'), sectionModalTitle = $('sectionModalTitle');
const practiceAllBtn = $('practiceAllBtn'), practiceAllDesc = $('practiceAllDesc'), sectionColumns = $('sectionColumns');
const limitInput = $('limitInput'), limitDropdown = $('limitDropdown'), limitToggle = $('limitToggle'), limitToggleLabel = $('limitToggleLabel');
const filtersToggle = $('filtersToggle'), filtersBadge = $('filtersBadge'), filterRow = $('filterRow');
const selectionPill = $('selectionPill'), pillCountLabel = $('pillCountLabel'), pillRandomize = $('pillRandomize'), pillStart = $('pillStart');

const banks = {};      // slug -> validated bank, or null when it failed to load
const progress = {};   // slug -> { questionId: chosenIndex }
const state = { course: null, units: [], calculator: '', kind: '', completed: 'all', result: 'all', limit: null, random: false };

const SVG = (body, extra = '') => `<svg class="sat-ico ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const ICONS = {
  calculator: SVG('<rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="11" x2="8.01" y2="11"/><line x1="12" y1="11" x2="12.01" y2="11"/><line x1="16" y1="11" x2="16.01" y2="11"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="12" y1="16" x2="12.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/>'),
  completed: SVG('<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>'),
  result: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 3 a9 9 0 0 1 0 18 z" fill="currentColor" stroke="none"/>'),
  kind: SVG('<path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 7 7c0 2.4-1.2 4.5-3 5.7V17a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1v-2.3C6.2 13.5 5 11.4 5 9a7 7 0 0 1 7-7z"/>'),
  caret: SVG('<polyline points="6 9 12 15 18 9"/>', 'sat-caret'),
  check: SVG('<polyline points="20 6 9 17 4 12"/>', 'sat-filter-check'),
  reset: SVG('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  open: '<svg class="sat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
};
// Tile artwork, in the style of the SAT section tiles.
const ART = {
  math: `<svg class="sat-entry-art" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <path d="M14 100V16M14 100h94" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
    <path d="M14 92c22-2 34-14 44-34s22-36 46-40v74z" fill="#fff" fill-opacity=".18"/>
    <path d="M14 92c22-2 34-14 44-34s22-36 46-40" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
    <path d="M40 96 78 30" stroke="#fff" stroke-opacity=".4" stroke-width="3" stroke-linecap="round"/><circle cx="58" cy="60" r="4.5" fill="#fff" fill-opacity=".7"/>
  </svg>`,
  science: `<svg class="sat-entry-art" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <path d="M12 100h96" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>
    <path d="M20 100 96 44v56z" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/>
    <rect x="50" y="46" width="26" height="18" rx="2" transform="rotate(-36.4 63 64)" fill="#fff" fill-opacity=".3" stroke="#fff" stroke-opacity=".6" stroke-width="3"/>
    <path d="M62 50 84 20" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/><path d="m74 21 10-1-1 10" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
  english: `<svg class="sat-entry-art" viewBox="0 0 120 120" fill="none" aria-hidden="true">
    <path d="M24 20h58l14 14v66H24z" fill="#fff" fill-opacity=".16" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/>
    <path d="M82 20v14h14" stroke="#fff" stroke-opacity=".55" stroke-width="3" stroke-linejoin="round"/>
    <path d="M36 44h34M36 56h48M36 68h48M36 80h28" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>
    <circle cx="84" cy="88" r="13" fill="#fff" fill-opacity=".24" stroke="#fff" stroke-opacity=".55" stroke-width="3"/><path d="m78 88 4 4 8-9" stroke="#fff" stroke-opacity=".8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

const FILTERS = [
  { key: 'calculator', label: 'Calculator', calculatorOnly: true, options: [{ value: '', label: 'All questions' }, { value: 'non-calculator', label: 'No calculator' }, { value: 'calculator', label: 'Calculator' }] },
  { key: 'kind', label: 'Question type', kindsOnly: true, options: [{ value: '', label: 'All questions' }, { value: 'conceptual', label: 'Conceptual' }, { value: 'quantitative', label: 'Calculation' }] },
  { key: 'completed', label: 'Completed', options: [{ value: 'all', label: 'All questions' }, { value: 'completed', label: 'Completed' }, { value: 'incomplete', label: 'Not completed' }] },
  { key: 'result', label: 'Result', options: [{ value: 'all', label: 'All questions' }, { value: 'correct', label: 'Correct' }, { value: 'incorrect', label: 'Incorrect' }] },
];
const activeFilters = () => FILTERS.filter(f => (!f.calculatorOnly || getCourse(state.course)?.hasCalculator) && (!f.kindsOnly || getCourse(state.course)?.hasKinds));
const accClass = pct => (pct >= 60 ? 'is-good' : pct >= 35 ? 'is-mid' : 'is-low');
const matching = (slug, units = []) => banks[slug] ? filterQuestions(banks[slug], { ...state, units }, progress[slug]) : [];

// ── Landing tiles: one per course ──
function renderEntries() {
  entryCards.innerHTML = COURSES.map(course => {
    const bank = banks[course.slug];
    let meta = '<span>Loading question count…</span>', pct = 0;
    if (bank === null) meta = '<span>Question bank unavailable. Reload to try again.</span>';
    else if (bank) {
      const solved = bank.questions.filter(q => Number.isInteger(progress[course.slug][q.id])).length;
      pct = Math.round(solved / bank.questions.length * 100);
      meta = `<span>${solved} of ${bank.questions.length} solved</span><span>${pct}%</span>`;
    }
    return `<button class="sat-entry-card is-${course.tone}" type="button" data-open-course="${course.slug}"${bank ? '' : ' disabled'}>
      ${ART[course.tone]}
      <span class="sat-entry-name">${course.name}</span>
      <span class="sat-entry-meta">${meta}</span>
      <div class="sat-entry-track"><span class="sat-entry-fill" data-pct="${pct}"></span></div>
      <span class="sat-entry-open">Open ${ICONS.open}</span>
    </button>`;
  }).join('');
  entryCards.querySelectorAll('.sat-entry-fill').forEach(el => requestAnimationFrame(() => { el.style.width = el.dataset.pct + '%'; }));
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
  if (!course) { sectionColumns.innerHTML = ''; return; }
  const all = matching(course.slug), stats = unitStats(banks[course.slug], all, progress[course.slug]);
  const allSelected = state.units.length === course.units.length;
  const rows = course.units.map((_, i) => {
    const unit = i + 1, { total, attempts, correct } = stats[i];
    const pct = total ? Math.round(attempts / total * 100) : 0, accuracy = attempts ? Math.round(correct / attempts * 100) : null;
    const label = unitLabel(course, unit);
    return `<div class="sat-topic-row${total ? '' : ' mcq-row-empty'}">
      <button class="sat-check ${state.units.includes(unit) ? 'is-active' : ''}" type="button" data-select-unit="${unit}" aria-pressed="${state.units.includes(unit)}" aria-label="Select ${label}"${total ? '' : ' disabled'}></button>
      <span class="sat-topic-heading">${label}</span>
      <div class="sat-topic-progress">${total ? `<div class="sat-progress-track"><span class="sat-progress-fill" style="width:${pct}%"></span></div><span class="sat-progress-frac"><b>${attempts}</b>/${total}</span>` : '<span class="sat-progress-frac sat-acc-empty">0 match</span>'}</div>
      <div class="sat-topic-accuracy">${accuracy === null ? '<span class="sat-acc-val sat-acc-empty">–</span>' : `<span class="sat-acc-dot ${accClass(accuracy)}"></span><span class="sat-acc-val">${accuracy}%</span>`}</div>
    </div>`;
  }).join('');
  sectionColumns.innerHTML = `<article class="sat-section-card is-${course.tone}">
    <div class="sat-topic-columns"><span class="sat-col-topic">Unit</span><span class="sat-col-progress">Progress</span><span class="sat-col-accuracy">Accuracy</span></div>
    <div class="sat-domain-grid"><section class="sat-domain-group">
      <div class="sat-domain-row">
        <button class="sat-check ${allSelected ? 'is-active' : ''}" type="button" data-select-all aria-pressed="${allSelected}" aria-label="Select all units"></button>
        <button class="sat-domain-heading" type="button" data-select-all><strong class="sat-domain-name">All ${course.noun}s</strong></button>
      </div>
      <div class="sat-topic-list">${rows}</div>
    </section></div>
  </article>`;
  const noun = course.noun;
  practiceAllDesc.textContent = all.length
    ? `Start practicing all ${course.units.length} ${noun}s in ${course.name} (${all.length} question${all.length === 1 ? '' : 's'}).`
    : 'No questions match these filters. Reset the filters to see the full bank.';
  practiceAllBtn.disabled = !all.length;
}
function renderPill() {
  const course = getCourse(state.course), n = state.units.length;
  if (course && n > 0) {
    const count = matching(course.slug, state.units).length, noun = course.noun;
    selectionPill.removeAttribute('hidden');
    pillCountLabel.textContent = `${n} ${noun}${n === 1 ? '' : 's'} selected · ${count} question${count === 1 ? '' : 's'}`;
    pillStart.disabled = count === 0;
  } else selectionPill.setAttribute('hidden', '');
  pillRandomize.classList.toggle('is-active', state.random);
  pillRandomize.setAttribute('aria-pressed', state.random ? 'true' : 'false');
}
function renderAll() { updateFilterUI(); renderUnits(); renderPill(); }

function openCourse(slug) {
  const course = getCourse(slug);
  if (!course || !banks[slug]) return;
  Object.assign(state, { course: slug, units: [], calculator: '', kind: '', completed: 'all', result: 'all' });
  sectionModalTitle.textContent = course.name;
  renderFilters();
  sectionModal.removeAttribute('hidden');
  document.body.classList.add('sat-modal-open');
  renderAll();
}
function closeCourse() {
  if (sectionModal.hasAttribute('hidden') || sectionModal.classList.contains('is-closing')) return;
  const finish = () => {
    sectionModal.classList.remove('is-closing');
    sectionModal.setAttribute('hidden', '');
    document.body.classList.remove('sat-modal-open');
    state.course = null; state.units = [];
    renderPill();
  };
  sectionModal.classList.add('is-closing');
  if (getComputedStyle(sectionModal).animationName === 'none') return finish();
  sectionModal.addEventListener('animationend', function done(event) {
    if (event.target !== sectionModal) return;
    sectionModal.removeEventListener('animationend', done);
    finish();
  });
}
function start(units) {
  if (!state.course || !matching(state.course, units).length) return;
  const url = playerUrl({ ...state, units });
  if (window.KorahTransitions?.go) window.KorahTransitions.go(url); else location.href = url;
}

// ── Events ──
entryCards.addEventListener('click', e => { const card = e.target.closest('[data-open-course]'); if (card) openCourse(card.dataset.openCourse); });
sectionColumns.addEventListener('click', e => {
  const course = getCourse(state.course);
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
$('sectionModalBack').addEventListener('click', closeCourse);
$('sectionModalClose').addEventListener('click', closeCourse);
sectionModal.addEventListener('click', e => { if (e.target === sectionModal) closeCourse(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCourse(); });
practiceAllBtn.addEventListener('click', () => start([]));
pillRandomize.addEventListener('click', () => { state.random = !state.random; renderPill(); });
pillStart.addEventListener('click', () => start(state.units));

// ── Load each course's bank separately; one failing does not block the other ──
function renderSources() {
  const escape = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const html = COURSES.filter(c => banks[c.slug]).map(c => `<h3>${c.name}</h3>` + Object.values(banks[c.slug].sources)
    .filter(s => /^https:\/\//.test(s.url)).map(s => `<p><a href="${escape(s.url)}" target="_blank" rel="noopener noreferrer">${escape(s.title)}</a> — ${escape(s.note)}</p>`).join('')).join('');
  $('mcqSourceList').innerHTML = html;
  $('mcqSources').hidden = !html;
}
renderEntries();
COURSES.forEach(async course => {
  progress[course.slug] = loadProgress(course.slug);
  try { banks[course.slug] = await loadBank(course.slug); }
  catch (error) { console.error('[AP MCQ]', course.slug, error); banks[course.slug] = null; }
  renderEntries();
  renderSources();
});
// Returning from the player via the back button restores this page from the
// back/forward cache, so re-read progress to refresh the tiles.
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  COURSES.forEach(c => { progress[c.slug] = loadProgress(c.slug); });
  renderEntries();
  if (state.course) renderAll();
});
