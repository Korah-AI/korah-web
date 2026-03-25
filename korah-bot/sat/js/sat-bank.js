(() => {
  const { SAT_DATA, getAllDomains, buildQuestionUrl } = window.KorahSAT;

  const state = {
    section: "",
    domains: [],
    shuffle: true,
    limit: 10
  };

  const sectionColumns = document.getElementById("sectionColumns");
  const selectionSummary = document.getElementById("selectionSummary");
  const sectionCount = document.getElementById("sectionCount");
  const domainCount = document.getElementById("domainCount");
  const limitInput = document.getElementById("limitInput");
  const shuffleToggle = document.getElementById("shuffleToggle");
  const startSelectedBtn = document.getElementById("startSelectedBtn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const openEnglishBtn = document.getElementById("openEnglishBtn");
  const openMathBtn = document.getElementById("openMathBtn");

  sectionCount.textContent = String(SAT_DATA.sections.length);
  domainCount.textContent = String(getAllDomains().length);

  function renderSections() {
    sectionColumns.innerHTML = SAT_DATA.sections
      .map(
        (section) => `
          <article class="sat-section-card">
            <header class="sat-section-header">
              <div>
                <p class="sat-eyebrow">${section.key}</p>
                <h2 class="sat-section-title">${section.label}</h2>
                <p class="sat-section-subtitle">${section.description}</p>
              </div>
              <button class="sat-button sat-button-ghost" type="button" data-open-section="${section.key}">Open all</button>
            </header>
            <div class="sat-domain-grid">
              ${section.domains
                .map(
                  (domain) => `
                    <div class="sat-domain-card">
                      <div class="sat-domain-top">
                        <h3 class="sat-domain-name">${domain.key}</h3>
                        <span class="sat-domain-count">${domain.count} questions</span>
                      </div>
                      <p class="sat-domain-description">${domain.description}</p>
                      <div class="sat-domain-actions">
                        <button class="sat-chip" type="button" data-open-domain="${section.key}::${domain.key}">Practice now</button>
                        <button class="sat-chip ${isSelected(section.key, domain.key) ? "is-active" : ""}" type="button" data-select-domain="${section.key}::${domain.key}">
                          ${isSelected(section.key, domain.key) ? "Selected" : "Multi-select"}
                        </button>
                      </div>
                    </div>
                  `
                )
                .join("")}
            </div>
          </article>
        `
      )
      .join("");
  }

  function isSelected(sectionKey, domainKey) {
    return state.section === sectionKey && state.domains.includes(domainKey);
  }

  function renderSummary() {
    const selectedLabel = state.section ? SAT_DATA.sections.find((item) => item.key === state.section)?.label || state.section : "None";
    selectionSummary.innerHTML = `
      <div class="sat-summary-card">
        <span class="sat-summary-label">Section</span>
        <div class="sat-summary-value">${selectedLabel}</div>
      </div>
      <div class="sat-summary-card">
        <span class="sat-summary-label">Domains</span>
        <div class="sat-summary-value">${state.domains.length ? state.domains.join(", ") : "No domains selected"}</div>
      </div>
      <div class="sat-summary-card">
        <span class="sat-summary-label">Session options</span>
        <div class="sat-summary-value">${state.limit} questions · ${state.shuffle ? "Shuffle on" : "Shuffle off"}</div>
      </div>
    `;
  }

  function setSection(sectionKey) {
    if (state.section && state.section !== sectionKey) {
      state.domains = [];
    }
    state.section = sectionKey;
  }

  function toggleDomain(sectionKey, domainKey) {
    setSection(sectionKey);
    if (state.domains.includes(domainKey)) {
      state.domains = state.domains.filter((item) => item !== domainKey);
    } else {
      state.domains = [...state.domains, domainKey];
    }
    renderSections();
    renderSummary();
  }

  function navigate(sectionKey, domains) {
    const nextState = {
      section: sectionKey,
      domains,
      shuffle: state.shuffle,
      limit: state.limit
    };
    window.location.href = buildQuestionUrl(nextState);
  }

  sectionColumns.addEventListener("click", (event) => {
    const openDomain = event.target.closest("[data-open-domain]");
    const selectDomain = event.target.closest("[data-select-domain]");
    const openSection = event.target.closest("[data-open-section]");

    if (openDomain) {
      const [sectionKey, domainKey] = openDomain.dataset.openDomain.split("::");
      navigate(sectionKey, [domainKey]);
      return;
    }

    if (selectDomain) {
      const [sectionKey, domainKey] = selectDomain.dataset.selectDomain.split("::");
      toggleDomain(sectionKey, domainKey);
      return;
    }

    if (openSection) {
      const sectionKey = openSection.dataset.openSection;
      const section = SAT_DATA.sections.find((item) => item.key === sectionKey);
      navigate(sectionKey, section ? section.domains.map((domain) => domain.key) : []);
    }
  });

  limitInput.addEventListener("input", () => {
    const parsed = Number(limitInput.value);
    state.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
    renderSummary();
  });

  shuffleToggle.addEventListener("change", () => {
    state.shuffle = shuffleToggle.checked;
    renderSummary();
  });

  startSelectedBtn.addEventListener("click", () => {
    navigate(state.section || "english", state.domains);
  });

  clearFiltersBtn.addEventListener("click", () => {
    state.section = "";
    state.domains = [];
    state.limit = 10;
    state.shuffle = true;
    limitInput.value = "10";
    shuffleToggle.checked = true;
    renderSections();
    renderSummary();
  });

  openEnglishBtn.addEventListener("click", () => {
    navigate("english", []);
  });

  openMathBtn.addEventListener("click", () => {
    navigate("math", []);
  });

  renderSections();
  renderSummary();
})();
