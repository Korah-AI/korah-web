(() => {
  const { OPENSAT_CATALOG, buildOpenSatV1QuestionUrl } = window.KorahSAT;

  const state = {
    sections: [],
    domains: [],
    skills: [],
    difficulties: [],
    assessment: "SAT",
    limit: null,
    random: false,
    globalStats: null,
    skillProgress: null, // skillCd -> { attempts, correct, byDifficulty }
    // Selections for filters not yet wired to data — see docs/sat-bank-filters.md.
    placeholders: { timespent: "any", saved: "all", completed: "all", result: "all" },
  };

  let hasRevealed = false; // animate progress/accuracy once on first data load

  const sectionColumns = document.getElementById("sectionColumns");
  const limitInput = document.getElementById("limitInput");
  const limitDropdown = document.getElementById("limitDropdown");
  const limitToggle = document.getElementById("limitToggle");
  const limitToggleLabel = document.getElementById("limitToggleLabel");
  const filtersToggle = document.getElementById("filtersToggle");
  const filtersBadge = document.getElementById("filtersBadge");
  const filterRow = document.getElementById("filterRow");
  const selectionPill = document.getElementById("selectionPill");
  const pillCountLabel = document.getElementById("pillCountLabel");
  const pillRandomize = document.getElementById("pillRandomize");
  const pillStart = document.getElementById("pillStart");

  // ── SVG icons for the filter buttons (Feather-style stroke icons) ──
  const SVG = (body, extra = "") =>
    `<svg class="sat-ico ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
  const ICONS = {
    questionset: SVG('<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'),
    difficulty: SVG('<line x1="6" y1="20" x2="6" y2="14"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="18" y1="20" x2="18" y2="10"/>'),
    timespent: SVG('<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/>'),
    saved: SVG('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
    completed: SVG('<circle cx="12" cy="12" r="9"/><polyline points="8 12 11 15 16 9"/>'),
    result: SVG('<circle cx="12" cy="12" r="9"/><path d="M12 3 a9 9 0 0 1 0 18 z" fill="currentColor" stroke="none"/>'),
    caret: SVG('<polyline points="6 9 12 15 18 9"/>', "sat-caret"),
    check: SVG('<polyline points="20 6 9 17 4 12"/>', "sat-filter-check"),
    reset: SVG('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  };

  // ── Filter config. `functional: true` filters drive the query; the rest are
  // UI placeholders — see docs/sat-bank-filters.md for how to wire them up.
  // For single-select filters, the FIRST option is treated as the default. ──
  const FILTERS = [
    {
      key: "questionset", label: "Question set", type: "single", functional: true,
      options: [
        { value: "SAT", label: "SAT" },
        { value: "PSAT/NMSQT", label: "PSAT/NMSQT" },
        { value: "PSAT", label: "PSAT" },
      ],
    },
    {
      key: "difficulty", label: "Difficulty", type: "multi", functional: true,
      options: [
        { value: "E", label: "Easy" },
        { value: "M", label: "Medium" },
        { value: "H", label: "Hard" },
      ],
    },
    {
      key: "timespent", label: "Time Spent", type: "single", functional: true,
      options: [
        { value: "any", label: "Any time" },
        { value: "lt30", label: "Under 30s" },
        { value: "30to60", label: "30–60s" },
        { value: "gt60", label: "Over 60s" },
      ],
    },
    {
      key: "saved", label: "Saved", type: "single", functional: true,
      options: [
        { value: "all", label: "All questions" },
        { value: "saved", label: "Saved only" },
        { value: "unsaved", label: "Not saved" },
      ],
    },
    {
      key: "completed", label: "Completed", type: "single", functional: true,
      options: [
        { value: "all", label: "All questions" },
        { value: "completed", label: "Completed" },
        { value: "incomplete", label: "Not completed" },
      ],
    },
    {
      key: "result", label: "Result", type: "single", functional: true,
      options: [
        { value: "all", label: "All questions" },
        { value: "correct", label: "Correct" },
        { value: "incorrect", label: "Incorrect" },
      ],
    },
  ];

  function selectedValues(key) {
    switch (key) {
      case "questionset": return [state.assessment];
      case "difficulty": return state.difficulties;
      default: return [state.placeholders[key]];
    }
  }

  function renderFilters() {
    const buttons = FILTERS.map((f) => `
      <div class="sat-filter-dd" data-filter="${f.key}">
        <button class="sat-filter-btn" type="button" data-filter-btn="${f.key}" aria-haspopup="true" aria-expanded="false"${f.functional ? "" : ' data-placeholder="true"'}>
          ${ICONS[f.key] || ""}
          <span class="sat-filter-btn-label">${f.label}</span>
          <span class="sat-filter-btn-count" data-count-for="${f.key}"></span>
          ${ICONS.caret}
        </button>
        <div class="sat-filter-menu" role="menu" aria-label="${f.label}">
          ${f.options.map((o) => `
            <button class="sat-filter-option" type="button" role="menuitem${f.type === "multi" ? "checkbox" : "radio"}" data-filter="${f.key}" data-value="${o.value}">
              <span class="sat-filter-option-label">${o.label}</span>
              ${ICONS.check}
            </button>`).join("")}
          ${f.functional ? "" : '<div class="sat-filter-note">Not wired up yet</div>'}
        </div>
      </div>`).join("");
    filterRow.innerHTML = buttons +
      `<button id="resetFiltersBtn" class="sat-reset-filters t-btn" type="button">${ICONS.reset}<span>Reset filters</span></button>`;
    updateFilterUI();
  }

  function updateFilterUI() {
    let activeCount = 0;
    FILTERS.forEach((f) => {
      const sel = selectedValues(f.key) || [];
      filterRow.querySelectorAll(`.sat-filter-option[data-filter="${f.key}"]`).forEach((opt) => {
        opt.classList.toggle("is-selected", sel.includes(opt.dataset.value));
      });
      const isDefault = f.type === "multi" ? sel.length === 0 : sel[0] === f.options[0].value;
      const btn = filterRow.querySelector(`[data-filter-btn="${f.key}"]`);
      const countEl = filterRow.querySelector(`[data-count-for="${f.key}"]`);
      if (countEl) {
        if (f.type === "multi") {
          countEl.textContent = sel.length ? `(${sel.length})` : "";
        } else {
          const opt = f.options.find((o) => o.value === sel[0]);
          countEl.textContent = !isDefault && opt ? opt.label : "";
        }
      }
      if (btn) btn.classList.toggle("is-active", !isDefault);
      if (!isDefault) activeCount++;
    });
    if (filtersBadge) {
      filtersBadge.textContent = String(activeCount);
      filtersBadge.hidden = activeCount === 0;
    }
  }

  function renderPill() {
    const n = state.skills.length;
    if (n > 0) {
      selectionPill.removeAttribute("hidden");
      pillCountLabel.textContent = `${n} topic${n === 1 ? "" : "s"} selected`;
    } else {
      selectionPill.setAttribute("hidden", "");
    }
    pillRandomize.classList.toggle("is-active", state.random);
    pillRandomize.setAttribute("aria-pressed", state.random ? "true" : "false");
  }

  // ── Filter dropdown open/close ──
  function closeMenus() {
    filterRow.querySelectorAll(".sat-filter-dd.is-open").forEach((dd) => dd.classList.remove("is-open"));
    filterRow.querySelectorAll("[data-filter-btn]").forEach((b) => b.setAttribute("aria-expanded", "false"));
  }

  function closeLimitMenu() {
    limitDropdown.classList.remove("is-open");
    limitToggle.classList.remove("is-open");
    limitToggle.setAttribute("aria-expanded", "false");
  }

  function toggleMenu(key) {
    const dd = filterRow.querySelector(`.sat-filter-dd[data-filter="${key}"]`);
    if (!dd) return;
    const willOpen = !dd.classList.contains("is-open");
    closeMenus();
    if (willOpen) {
      closeLimitMenu();
      dd.classList.add("is-open");
      dd.querySelector("[data-filter-btn]").setAttribute("aria-expanded", "true");
    }
  }

  function selectFilterOption(key, value) {
    if (key === "difficulty") {
      state.difficulties = state.difficulties.includes(value)
        ? state.difficulties.filter((d) => d !== value)
        : [...state.difficulties, value];
      renderAll(); // multi-select: leave the menu open
      return;
    }
    if (key === "questionset") {
      if (state.assessment !== value) {
        state.assessment = value;
        fetchGlobalStats();
      }
    } else {
      state.placeholders[key] = value; // not yet wired to the query
    }
    closeMenus();
    renderAll();
  }

  function renderSections() {
    const sections = OPENSAT_CATALOG.sections;
    const stats = state.globalStats?.data?.stats || {};
    const domainStats = stats.domainBreakdown || {};
    const skillStats = stats.skillBreakdown || {};
    const domainByDiff = stats.domainBreakdownByDifficulty || {};
    const skillByDiff = stats.skillBreakdownByDifficulty || {};
    const difficultyFilter = state.difficulties; // [] | array of "E"/"M"/"H"

    function countDomain(code) {
      if (difficultyFilter.length === 0) return domainStats[code] || 0;
      const bucket = domainByDiff[code];
      if (!bucket) return 0;
      return difficultyFilter.reduce((sum, d) => sum + (bucket[d] || 0), 0);
    }
    function countSkill(code) {
      if (difficultyFilter.length === 0) return skillStats[code] || 0;
      const bucket = skillByDiff[code];
      if (!bucket) return 0;
      return difficultyFilter.reduce((sum, d) => sum + (bucket[d] || 0), 0);
    }

    // User's practice progress per skill, difficulty-filtered to match counts.
    const progress = state.skillProgress || {};
    function skillProg(code) {
      const p = progress[code];
      if (!p) return { attempts: 0, correct: 0 };
      if (difficultyFilter.length === 0) {
        return { attempts: p.attempts || 0, correct: p.correct || 0 };
      }
      let attempts = 0, correct = 0;
      for (const d of difficultyFilter) {
        const b = p.byDifficulty && p.byDifficulty[d];
        if (b) { attempts += b.attempts || 0; correct += b.correct || 0; }
      }
      return { attempts, correct };
    }
    const accClass = (pct) => (pct >= 60 ? "is-good" : pct >= 35 ? "is-mid" : "is-low");

    sectionColumns.innerHTML = sections
      .map((section) => {
        const isActiveSection = state.sections.includes(section.key);
        const allSelected = section.domains.every(d => state.domains.includes(d.key));

        // Calculate section total count (respecting difficulty filter)
        const sectionTotal = section.domains.reduce((sum, d) => sum + countDomain(d.code), 0);
        const sectionCountLabel = sectionTotal > 0 ? ` — ${sectionTotal} Questions` : "";

        return `
          <article class="sat-section-card is-${section.key}">
            <header class="sat-section-header">
              <button class="sat-section-check ${allSelected ? "is-active" : ""}" type="button" data-select-section="${section.key}" aria-label="Select all ${section.label} domains"></button>
              <button class="sat-section-heading" type="button" data-select-section="${section.key}">
                <div>
                  <h2 class="sat-section-title">${section.label}${sectionCountLabel}</h2>
                  <p class="sat-section-count">${section.description || ""}</p>
                </div>
              </button>
            </header>
            <div class="sat-topic-columns">
              <span class="sat-col-topic">Topic</span>
              <span class="sat-col-progress">Progress</span>
              <span class="sat-col-accuracy">Accuracy</span>
            </div>
            <div class="sat-domain-grid">
              ${section.domains
                .map((domain) => {
                  const selected = isActiveSection && state.domains.includes(domain.key);

                  const skillHtml = (domain.skills || [])
                    .map((skill) => {
                      const skillSelected = state.skills.includes(skill.code);
                      const totalQ = countSkill(skill.code);
                      const { attempts, correct } = skillProg(skill.code);
                      const pct = totalQ > 0 ? Math.min(100, Math.round((attempts / totalQ) * 100)) : 0;
                      const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : null;

                      const progressCol = totalQ > 0
                        ? `<div class="sat-progress-track"><span class="sat-progress-fill" data-pct="${pct}"></span></div>
                           <span class="sat-progress-frac"><b data-count="${attempts}">${attempts}</b>/${totalQ}</span>`
                        : `<span class="sat-progress-frac sat-acc-empty">—</span>`;

                      const accuracyCol = accuracy !== null
                        ? `<span class="sat-acc-dot ${accClass(accuracy)}"></span><span class="sat-acc-val" data-count="${accuracy}" data-suffix="%">${accuracy}%</span>`
                        : `<span class="sat-acc-val sat-acc-empty">–</span>`;

                      return `
                        <div class="sat-topic-row">
                          <button class="sat-check ${skillSelected ? "is-active" : ""}" type="button" data-select-skill="${section.key}::${domain.key}::${skill.code}" aria-label="Select ${skill.key}"></button>
                          <span class="sat-topic-heading">${skill.key}</span>
                          <div class="sat-topic-progress">${progressCol}</div>
                          <div class="sat-topic-accuracy">${accuracyCol}</div>
                        </div>
                      `;
                    })
                    .join("");

                  return `
                    <section class="sat-domain-group">
                      <div class="sat-domain-row">
                        <button class="sat-check ${selected ? "is-active" : ""}" type="button" data-select-domain="${section.key}::${domain.key}" aria-label="Select ${domain.key}"></button>
                        <button class="sat-domain-heading" type="button" data-select-domain="${section.key}::${domain.key}">
                          <strong class="sat-domain-name">${domain.key}</strong>
                        </button>
                      </div>
                      ${skillHtml ? `<div class="sat-topic-list">${skillHtml}</div>` : (domain.description ? `<div class="sat-topic-list"><div class="sat-topic-row"><span class="sat-topic-heading">${domain.description}</span></div></div>` : "")}
                    </section>
                  `;
                })
                .join("")}
            </div>
          </article>
        `;
      })
      .join("");

    // Re-render wipes the DOM, so re-apply bar widths. Only animate on the
    // first paint that has real data (the page-open reveal).
    paintProgress(false);
  }

  // Set progress-bar widths (and optionally count numbers up) after a render.
  function paintProgress(animate) {
    const fills = sectionColumns.querySelectorAll(".sat-progress-fill");
    fills.forEach((el) => {
      const pct = Math.max(0, Math.min(100, parseFloat(el.dataset.pct) || 0));
      if (animate) {
        el.style.transition = "none";
        el.style.width = "0%";
        void el.offsetWidth; // force reflow so the transition runs from 0
        el.style.transition = "";
        requestAnimationFrame(() => { el.style.width = pct + "%"; });
      } else {
        el.style.transition = "none";
        el.style.width = pct + "%";
      }
    });
    if (animate) {
      sectionColumns.querySelectorAll("[data-count]").forEach(countUp);
    }
  }

  function countUp(el) {
    const target = parseInt(el.dataset.count, 10) || 0;
    const suffix = el.dataset.suffix || "";
    if (target <= 0) { el.textContent = "0" + suffix; return; }
    const duration = 900;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Fire the page-open reveal once, after question counts and user progress
  // are both available.
  function maybeReveal() {
    if (hasRevealed) return;
    if (!state.globalStats || state.skillProgress === null) return;
    hasRevealed = true;
    paintProgress(true);
  }

  function loadUserProgress() {
    const analytics = window.KorahSATAnalytics;
    if (!analytics) {
      window.addEventListener("korahSATAnalyticsReady", loadUserProgress, { once: true });
      return;
    }
    analytics.getAllSkillStats()
      .then((list) => {
        const map = {};
        (list || []).forEach((s) => { if (s && s.skillCd) map[s.skillCd] = s; });
        state.skillProgress = map;
      })
      .catch(() => { state.skillProgress = {}; })
      .finally(() => { renderSections(); maybeReveal(); });
  }

  function navigate() {
    const nextState = {
      sections: state.sections.length > 0 ? state.sections : ["any"],
      domains: state.domains.length > 0 ? state.domains : ["any"],
      skills: state.skills.length > 0 ? state.skills : ["any"],
      difficulties: state.difficulties.length > 0 ? state.difficulties : ["any"],
      assessment: state.assessment || "SAT",
      limit: state.limit,
      random: state.random,
      // Per-question filters applied client-side by the player (see docs/sat-bank-filters.md).
      timespent: state.placeholders.timespent,
      saved: state.placeholders.saved,
      completed: state.placeholders.completed,
      result: state.placeholders.result,
    };
    window.KorahTransitions.go(buildOpenSatV1QuestionUrl(nextState));
  }

  function selectSection(sectionKey) {
    const section = OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey);
    if (!section) return;

    const allSelected = section.domains.every(d => state.domains.includes(d.key));

    if (allSelected) {
      state.sections = state.sections.filter((s) => s !== sectionKey);
      state.domains = state.domains.filter(
        (d) => !section.domains.some((domain) => domain.key === d)
      );
      // Clear skills for this section
      const domainKeys = section.domains.map(d => d.key);
      section.domains.forEach(d => {
        if (d.skills) {
          d.skills.forEach(sk => {
            state.skills = state.skills.filter(s => s !== sk.code);
          });
        }
      });
    } else {
      state.sections = [...state.sections, sectionKey];
      section.domains.forEach((domain) => {
        if (!state.domains.includes(domain.key)) {
          state.domains.push(domain.key);
        }
        // Also select all skills if any
        if (domain.skills) {
          domain.skills.forEach(sk => {
            if (!state.skills.includes(sk.code)) {
              state.skills.push(sk.code);
            }
          });
        }
      });
    }
    renderAll();
  }

  function toggleDomain(sectionKey, domainKey) {
    const section = OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey);
    if (!section) return;
    const domain = section.domains.find((d) => d.key === domainKey);
    if (!domain) return;
    if (!state.sections.includes(sectionKey)) {
      state.sections = [...state.sections, sectionKey];
    }
    
    if (state.domains.includes(domainKey)) {
      state.domains = state.domains.filter((d) => d !== domainKey);
      // Also deselect its skills
      if (domain.skills) {
        domain.skills.forEach(sk => {
          state.skills = state.skills.filter(s => s !== sk.code);
        });
      }
    } else {
      state.domains = [...state.domains, domainKey];
      // Also select its skills
      if (domain.skills) {
        domain.skills.forEach(sk => {
          if (!state.skills.includes(sk.code)) {
            state.skills.push(sk.code);
          }
        });
      }
    }
    renderAll();
  }

  function toggleSkill(sectionKey, domainKey, skillCode) {
    const section = OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey);
    if (!section) return;
    const domain = section.domains.find((d) => d.key === domainKey);
    if (!domain) return;

    if (!state.sections.includes(sectionKey)) {
      state.sections = [...state.sections, sectionKey];
    }
    // Note: domain might not be fully "selected" if only some skills are selected,
    // but for the upstream API, selecting specific skills is usually more precise.
    // We'll keep the domain selected if any skill is selected.
    if (!state.domains.includes(domainKey)) {
      state.domains.push(domainKey);
    }

    if (state.skills.includes(skillCode)) {
      state.skills = state.skills.filter((s) => s !== skillCode);
    } else {
      state.skills = [...state.skills, skillCode];
    }
    renderAll();
  }

  function resetFilters() {
    const hadAssessment = state.assessment !== "SAT";
    state.sections = [];
    state.domains = [];
    state.skills = [];
    state.difficulties = [];
    state.assessment = "SAT";
    state.limit = null;
    state.random = false;
    state.placeholders = { timespent: "any", saved: "all", completed: "all", result: "all" };
    limitInput.value = "";
    limitToggleLabel.textContent = "Question Limit";
    closeMenus();
    closeLimitMenu();
    if (hadAssessment) fetchGlobalStats(); // reload counts for the SAT set
    renderAll();
  }

  function renderAll() {
    renderSections();
    updateFilterUI();
    renderPill();
  }

  async function fetchGlobalStats() {
    try {
      const assessmentParam = state.assessment && state.assessment !== "SAT"
        ? `?assessment=${encodeURIComponent(state.assessment)}`
        : "";
      const response = await fetch(`/api/sat/s${assessmentParam}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        state.globalStats = await response.json();
        renderSections();
        maybeReveal();
      }
    } catch (err) {
      console.error("Failed to fetch global stats:", err);
    }
  }

  sectionColumns.addEventListener("click", (event) => {
    const sectionTrigger = event.target.closest("[data-select-section]");
    const domainTrigger = event.target.closest("[data-select-domain]");
    const skillTrigger = event.target.closest("[data-select-skill]");

    if (sectionTrigger) {
      const sectionKey = sectionTrigger.dataset.selectSection;
      selectSection(sectionKey);
      return;
    }

    if (skillTrigger) {
      const [sectionKey, domainKey, skillCode] = skillTrigger.dataset.selectSkill.split("::");
      toggleSkill(sectionKey, domainKey, skillCode);
      return;
    }

    if (domainTrigger) {
      const [sectionKey, domainKey] = domainTrigger.dataset.selectDomain.split("::");
      toggleDomain(sectionKey, domainKey);
      return;
    }
  });

  limitInput.addEventListener("input", () => {
    const val = limitInput.value.trim();
    if (val === "" || val.toLowerCase() === "none") {
      state.limit = null;
    } else {
      const parsed = Number(val);
      state.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    limitToggleLabel.textContent = state.limit !== null ? `Limit: ${state.limit}` : "Question Limit";
  });

  limitToggle.addEventListener("click", () => {
    const willOpen = !limitDropdown.classList.contains("is-open");
    limitDropdown.classList.toggle("is-open", willOpen);
    limitToggle.classList.toggle("is-open", willOpen);
    limitToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
    if (willOpen) {
      closeMenus();
      setTimeout(() => limitInput.focus(), 50);
    }
  });

  // ── Filters toggle (show/hide the filter row) ──
  filtersToggle.addEventListener("click", () => {
    const willOpen = filterRow.hasAttribute("hidden");
    closeLimitMenu();
    if (willOpen) {
      filterRow.removeAttribute("hidden");
      filterRow.classList.add("is-entering");
      filterRow.addEventListener("animationend", () => filterRow.classList.remove("is-entering"), { once: true });
    } else {
      filterRow.setAttribute("hidden", "");
      closeMenus();
    }
    filtersToggle.setAttribute("aria-expanded", willOpen ? "true" : "false");
    filtersToggle.classList.toggle("is-open", willOpen);
  });

  // ── Filter row: dropdown toggles, option selection, reset ──
  filterRow.addEventListener("click", (event) => {
    if (event.target.closest("#resetFiltersBtn")) { resetFilters(); return; }
    const option = event.target.closest(".sat-filter-option");
    if (option) { selectFilterOption(option.dataset.filter, option.dataset.value); return; }
    const btn = event.target.closest("[data-filter-btn]");
    if (btn) { toggleMenu(btn.dataset.filterBtn); return; }
  });

  // Close any open filter menu when clicking elsewhere.
  document.addEventListener("click", (event) => {
    if (!filterRow.contains(event.target) && !filtersToggle.contains(event.target)) {
      closeMenus();
    }
    if (!limitDropdown.contains(event.target)) {
      closeLimitMenu();
    }
  });

  // ── Bottom selection pill ──
  pillRandomize.addEventListener("click", () => {
    state.random = !state.random;
    renderPill();
  });
  pillStart.addEventListener("click", () => navigate());

  renderFilters();
  loadUserProgress();
  resetFilters();
  fetchGlobalStats();

  // Fallback: if analytics never becomes available (e.g. no attempts yet),
  // still reveal the bars once question counts have loaded.
  setTimeout(() => {
    if (!hasRevealed) {
      if (state.skillProgress === null) state.skillProgress = {};
      maybeReveal();
    }
  }, 3500);
})();
