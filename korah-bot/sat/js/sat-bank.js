(() => {
  const { OPENSAT_CATALOG, buildOpenSatV1QuestionUrl } = window.KorahSAT;

  const state = {
    sections: [],
    domains: [],
    skills: [],
    limit: null,
  };

  const sectionColumns = document.getElementById("sectionColumns");
  const selectionSummary = document.getElementById("selectionSummary");
  const sectionCount = document.getElementById("sectionCount");
  const domainCountEl = document.getElementById("domainCount");
  const limitInput = document.getElementById("limitInput");
  const startSelectedBtn = document.getElementById("startSelectedBtn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");

  const totalSections = OPENSAT_CATALOG.sections.length;
  const totalDomains = OPENSAT_CATALOG.sections.reduce((sum, s) => sum + (s.domains?.length || 0), 0);
  const totalSkills = OPENSAT_CATALOG.sections.reduce((sum, s) => {
    return sum + (s.domains?.reduce((dSum, d) => dSum + (d.skills?.length || 0), 0) || 0);
  }, 0);
  sectionCount.textContent = String(totalSections);
  domainCountEl.textContent = String(totalDomains);

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
    selectionSummary.textContent = `${sectionsLabel} · ${domainLabel} · ${limitLabel}`;
    startSelectedBtn.textContent = "Start practice";
    startSelectedBtn.disabled = false;
  }

  function renderSections() {
    const sections = OPENSAT_CATALOG.sections;
    sectionColumns.innerHTML = sections
      .map((section) => {
        const isActiveSection = state.sections.includes(section.key);
        const allSelected = section.domains.every(d => state.domains.includes(d.key));
        return `
          <article class="sat-section-card is-${section.key}">
            <header class="sat-section-header">
              <button class="sat-section-check ${allSelected ? "is-active" : ""}" type="button" data-select-section="${section.key}" aria-label="Select all ${section.label} domains"></button>
              <button class="sat-section-heading" type="button" data-select-section="${section.key}">
                <div>
                  <h2 class="sat-section-title">${section.label}</h2>
                  <p class="sat-section-count">${section.description || ""}</p>
                </div>
              </button>
            </header>
            <div class="sat-domain-grid">
              ${section.domains
                .map((domain) => {
                  const selected = isActiveSection && state.domains.includes(domain.key);
                  const skillHtml = (domain.skills || [])
                    .map((skill) => {
                      const skillSelected = state.skills.includes(skill.code);
                      return `
                        <div class="sat-topic-row">
                          <button class="sat-check ${skillSelected ? "is-active" : ""}" type="button" data-select-skill="${section.key}::${domain.key}::${skill.code}" aria-label="Select ${skill.key}"></button>
                          <span class="sat-topic-heading">${skill.key}</span>
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
                        <span class="sat-domain-count"></span>
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
      limit: state.limit,
    };
    window.location.href = buildOpenSatV1QuestionUrl(nextState);
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
    state.limit = null;
    limitInput.value = "";
    renderAll();
  }

  function renderAll() {
    renderSections();
    renderSummary();
    fetchQuestionCounts();
  }

  async function fetchQuestionCounts() {
    const questionCountEl = document.getElementById("questionCount");
    if (!questionCountEl) return;
    
    const params = new URLSearchParams();
    const sectionValue = state.sections.length > 0 && !(state.sections.length === 2 && state.sections.includes("english") && state.sections.includes("math"))
      ? state.sections.join(",")
      : "any";
    params.set("sections", sectionValue);
    const domainValue = state.domains.length > 0 && !state.domains.includes("any")
      ? state.domains.join(",")
      : "any";
    params.set("domains", domainValue);
    const skillValue = state.skills.length > 0 && !state.skills.includes("any")
      ? state.skills.join(",")
      : "any";
    params.set("skills", skillValue);
    params.set("limit", "1");

    try {
      const response = await fetch(`/api/sat/questions?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (response.ok) {
        const data = await response.json();
        const count = data.count ?? 0;
        questionCountEl.textContent = count >= 1000 ? `${Math.floor(count / 1000)}k+` : String(count);
      } else {
        questionCountEl.textContent = "—";
      }
    } catch (err) {
      questionCountEl.textContent = "—";
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

  resetFilters();
})();
