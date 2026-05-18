(() => {
  const { OPENSAT_CATALOG, buildOpenSatV1QuestionUrl } = window.KorahSAT;

  const state = {
    sections: [],
    domains: [],
    skills: [],
    difficulties: [],
    assessment: "SAT",
    limit: null,
    globalStats: null,
  };

  const sectionColumns = document.getElementById("sectionColumns");
  const selectionSummary = document.getElementById("selectionSummary");
  const limitInput = document.getElementById("limitInput");
  const startSelectedBtn = document.getElementById("startSelectedBtn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const assessmentTrigger = document.getElementById("assessmentTrigger");
  const assessmentDropdown = document.getElementById("assessmentDropdown");
  const assessmentLabel = document.getElementById("assessmentLabel");
  const assessmentArrow = document.getElementById("assessmentArrow");
  const difficultyChips = document.getElementById("difficultyChips");

  const totalSections = OPENSAT_CATALOG.sections.length;
  const totalDomains = OPENSAT_CATALOG.sections.reduce((sum, s) => sum + (s.domains?.length || 0), 0);

  function renderSummary() {
    const sectionsLabel = state.sections.length === 0 || state.sections.includes("any")
      ? "All sections"
      : state.sections.length === 1
        ? OPENSAT_CATALOG.sections.find((s) => s.key === state.sections[0])?.label || state.sections[0]
        : `${state.sections.length} sections`;
    
    let domainLabel = "Any domain";
    if (state.skills.length > 0 && !state.skills.includes("any")) {
      domainLabel = `${state.skills.length} skills`;
    } else if (state.domains.length > 0 && !state.domains.includes("any")) {
      domainLabel = state.domains.length === 1 ? state.domains[0] : `${state.domains.length} domains`;
    }

    const limitLabel = state.limit === null || state.limit === "" ? "No limit" : `${state.limit} questions`;
    const difficultyLabel = state.difficulties.length === 0
      ? "Any difficulty"
      : state.difficulties.map((d) => ({ E: "Easy", M: "Medium", H: "Hard" }[d] || d)).join("/");
    const assessmentLabel = state.assessment && state.assessment !== "SAT" ? ` · ${state.assessment}` : "";
    selectionSummary.textContent = `${sectionsLabel} · ${domainLabel} · ${difficultyLabel} · ${limitLabel}${assessmentLabel}`;
    startSelectedBtn.textContent = "Start practice";
    startSelectedBtn.disabled = false;
  }

  function renderDifficulty() {
    if (!difficultyChips) return;
    difficultyChips.querySelectorAll("[data-difficulty]").forEach((btn) => {
      const code = btn.dataset.difficulty;
      const active = state.difficulties.includes(code);
      btn.classList.toggle("is-active", active);
      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });
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
            <div class="sat-domain-grid">
              ${section.domains
                .map((domain) => {
                  const selected = isActiveSection && state.domains.includes(domain.key);
                  const domainCount = countDomain(domain.code);
                  const domainCountLabel = domainCount > 0 ? `${domainCount} Questions` : "";

                  const skillHtml = (domain.skills || [])
                    .map((skill) => {
                      const skillSelected = state.skills.includes(skill.code);
                      const skillCount = countSkill(skill.code);
                      const skillCountLabel = skillCount > 0 ? `${skillCount} Questions` : "";
                      return `
                        <div class="sat-topic-row">
                          <button class="sat-check ${skillSelected ? "is-active" : ""}" type="button" data-select-skill="${section.key}::${domain.key}::${skill.code}" aria-label="Select ${skill.key}"></button>
                          <span class="sat-topic-heading">${skill.key}</span>
                          <span class="sat-topic-count">${skillCountLabel}</span>
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
                        <span class="sat-domain-count">${domainCountLabel}</span>
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
  }

  function navigate() {
    const nextState = {
      sections: state.sections.length > 0 ? state.sections : ["any"],
      domains: state.domains.length > 0 ? state.domains : ["any"],
      skills: state.skills.length > 0 ? state.skills : ["any"],
      difficulties: state.difficulties.length > 0 ? state.difficulties : ["any"],
      assessment: state.assessment || "SAT",
      limit: state.limit,
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
    state.sections = [];
    state.domains = [];
    state.skills = [];
    state.difficulties = [];
    state.assessment = "SAT";
    state.limit = null;
    limitInput.value = "";
    if (assessmentLabel) {
      assessmentLabel.textContent = "SAT";
      assessmentDropdown.querySelectorAll(".more-dropdown-item").forEach((item) => {
        const check = item.querySelector(".more-dropdown-check");
        if (check) check.style.opacity = item.dataset.value === "SAT" ? "1" : "0";
      });
    }
    renderAll();
  }

  function renderAll() {
    renderSections();
    renderDifficulty();
    renderSummary();
  }

  async function fetchGlobalStats() {
    try {
      const assessmentParam = state.assessment && state.assessment !== "SAT"
        ? `?assessment=${encodeURIComponent(state.assessment)}`
        : "";
      const response = await fetch(`/api/sat/stats${assessmentParam}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        state.globalStats = await response.json();
        renderSections();
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
    renderSummary();
  });

  startSelectedBtn.addEventListener("click", () => {
    if (state.sections.length === 0) {
      return;
    }
    navigate();
  });

  clearFiltersBtn.addEventListener("click", resetFilters);

  if (difficultyChips) {
    difficultyChips.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-difficulty]");
      if (!btn) return;
      const code = btn.dataset.difficulty;
      if (state.difficulties.includes(code)) {
        state.difficulties = state.difficulties.filter((d) => d !== code);
      } else {
        state.difficulties = [...state.difficulties, code];
      }
      renderAll();
    });
  }

  function selectAssessment(value) {
    state.assessment = value;
    assessmentLabel.textContent = value;
    assessmentDropdown.querySelectorAll(".more-dropdown-item").forEach((item) => {
      const check = item.querySelector(".more-dropdown-check");
      if (check) check.style.opacity = item.dataset.value === value ? "1" : "0";
    });
    closeAssessment();
    fetchGlobalStats();
    renderAll();
  }

  function toggleAssessment() {
    const isOpen = assessmentDropdown.classList.contains("more-dropdown-open");
    assessmentDropdown.classList.toggle("more-dropdown-open");
    if (assessmentArrow) assessmentArrow.style.transform = isOpen ? "" : "rotate(180deg)";
  }

  function closeAssessment() {
    assessmentDropdown.classList.remove("more-dropdown-open");
    if (assessmentArrow) assessmentArrow.style.transform = "";
  }

  if (assessmentTrigger) {
    assessmentTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleAssessment();
    });

    assessmentDropdown.addEventListener("click", (e) => {
      const item = e.target.closest(".more-dropdown-item");
      if (!item) return;
      const value = item.dataset.value;
      if (value) selectAssessment(value);
    });

    document.addEventListener("click", (e) => {
      const wrapper = assessmentTrigger.closest(".sat-dropdown-wrapper");
      if (wrapper && !wrapper.contains(e.target)) closeAssessment();
    });
  }

  fetchGlobalStats();
  resetFilters();
})();
