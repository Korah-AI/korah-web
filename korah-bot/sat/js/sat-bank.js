(() => {
  const { OPENSAT_CATALOG, buildOpenSatV1QuestionUrl } = window.KorahSAT;

  const state = {
    section: "",
    domains: [],
    limit: null,
  };

  const sectionColumns = document.getElementById("sectionColumns");
  const selectionSummary = document.getElementById("selectionSummary");
  const sectionCount = document.getElementById("sectionCount");
  const domainCount = document.getElementById("domainCount");
  const limitInput = document.getElementById("limitInput");
  const startSelectedBtn = document.getElementById("startSelectedBtn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");

  sectionCount.textContent = String(OPENSAT_CATALOG.sections.length);
  domainCount.textContent = String(OPENSAT_CATALOG.sections.reduce((sum, s) => sum + (s.domains?.length || 0), 0));

  function renderSummary() {
    if (!state.section) {
      selectionSummary.textContent = "Choose a section";
      startSelectedBtn.textContent = "Start practice";
      startSelectedBtn.disabled = false;
      return;
    }
    const sectionLabel = OPENSAT_CATALOG.sections.find((s) => s.key === state.section)?.label || state.section;
    const domainLabel = state.domains.length === 0 || state.domains.includes("any") 
      ? "Any domain" 
      : state.domains.length === 1 
        ? state.domains[0] 
        : `${state.domains.length} domains`;
    const limitLabel = state.limit === null || state.limit === "" ? "No limit" : `${state.limit} questions`;
    selectionSummary.textContent = `${sectionLabel} · ${domainLabel} · ${limitLabel}`;
    startSelectedBtn.textContent = "Start practice";
    startSelectedBtn.disabled = false;
  }

  function renderSections() {
    const sections = OPENSAT_CATALOG.sections;
    sectionColumns.innerHTML = sections
      .map((section) => {
        const isActiveSection = state.section === section.key;
        return `
          <article class="sat-section-card is-${section.key}">
            <header class="sat-section-header">
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
                  return `
                    <section class="sat-domain-group">
                      <div class="sat-domain-row">
                        <button class="sat-check ${selected ? "is-active" : ""}" type="button" data-select-domain="${section.key}::${domain.key}" aria-label="Select ${domain.key}"></button>
                        <button class="sat-domain-heading" type="button" data-select-domain="${section.key}::${domain.key}">
                          <strong class="sat-domain-name">${domain.key}</strong>
                        </button>
                        <span class="sat-domain-count"></span>
                      </div>
                      ${domain.description ? `<div class="sat-topic-list"><div class="sat-topic-row"><span class="sat-topic-heading">${domain.description}</span></div></div>` : ""}
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
      section: state.section,
      domains: state.domains.length > 0 ? state.domains : ["any"],
      limit: state.limit,
    };
    window.location.href = buildOpenSatV1QuestionUrl(nextState);
  }

  function selectSection(sectionKey) {
    const section = OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey);
    if (!section) return;
    if (state.section !== sectionKey) {
      state.section = sectionKey;
      state.domains = [];
    }
    renderAll();
  }

  function toggleDomain(sectionKey, domainKey) {
    const section = OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey);
    if (!section) return;
    const domain = section.domains.find((d) => d.key === domainKey);
    if (!domain) return;
    state.section = sectionKey;
    if (state.domains.includes(domainKey)) {
      state.domains = state.domains.filter((d) => d !== domainKey);
    } else {
      state.domains = [...state.domains, domainKey];
    }
    renderAll();
  }

  function resetFilters() {
    state.section = "";
    state.domains = [];
    state.limit = null;
    limitInput.value = "";
    renderAll();
  }

  function renderAll() {
    renderSections();
    renderSummary();
  }

  sectionColumns.addEventListener("click", (event) => {
    const sectionTrigger = event.target.closest("[data-select-section]");
    const domainTrigger = event.target.closest("[data-select-domain]");

    if (sectionTrigger) {
      const sectionKey = sectionTrigger.dataset.selectSection;
      selectSection(sectionKey);
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
    if (!state.section) {
      return;
    }
    navigate();
  });

  clearFiltersBtn.addEventListener("click", resetFilters);

  resetFilters();
})();
