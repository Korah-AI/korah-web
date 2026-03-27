(() => {
  const { SAT_DATA, getAllDomains, buildQuestionUrl } = window.KorahSAT;

  const state = {
    section: "",
    selectedDomains: [],
    selectedTopics: [],
    shuffle: true,
    limit: 10,
    multiSelect: false,
    filtersOpen: true,
    showPreviousAttempts: false,
    filters: {
      active: "all",
      difficulty: "all",
      scoreBand: "all",
      timeSpent: "all",
      marked: "all",
      solved: "all",
      incorrect: "all"
    }
  };

  const sectionColumns = document.getElementById("sectionColumns");
  const selectionSummary = document.getElementById("selectionSummary");
  const sectionCount = document.getElementById("sectionCount");
  const domainCount = document.getElementById("domainCount");
  const limitInput = document.getElementById("limitInput");
  const startSelectedBtn = document.getElementById("startSelectedBtn");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
  const multiSelectBtn = document.getElementById("multiSelectBtn");
  const shuffleQuestionsBtn = document.getElementById("shuffleQuestionsBtn");
  const showAttemptsToggle = document.getElementById("showAttemptsToggle");
  const filtersPanel = document.getElementById("filtersPanel");
  const filterInputs = {
    active: document.getElementById("activeFilter"),
    difficulty: document.getElementById("difficultyFilter"),
    scoreBand: document.getElementById("scoreBandFilter"),
    timeSpent: document.getElementById("timeSpentFilter"),
    marked: document.getElementById("markedFilter"),
    solved: document.getElementById("solvedFilter"),
    incorrect: document.getElementById("incorrectFilter")
  };

  sectionCount.textContent = String(SAT_DATA.sections.length);
  domainCount.textContent = String(getAllDomains().length);

  function topicId(sectionKey, domainKey, topicKey) {
    return `${sectionKey}::${domainKey}::${topicKey}`;
  }

  function domainId(sectionKey, domainKey) {
    return `${sectionKey}::${domainKey}`;
  }

  function ensureSection(sectionKey) {
    if (state.section && state.section !== sectionKey) {
      state.selectedDomains = [];
      state.selectedTopics = [];
    }
    state.section = sectionKey;
  }

  function clearSelection() {
    state.section = "";
    state.selectedDomains = [];
    state.selectedTopics = [];
  }

  function getVisibleSections() {
    return SAT_DATA.sections
      .map((section) => {
        const domains = section.domains
          .map((domain) => {
            const topics = (domain.topics || []).filter((topic) => topicMatchesFilters(topic));
            if (!topics.length) {
              return null;
            }
            return {
              ...domain,
              topics,
              visibleCount: topics.reduce((sum, topic) => sum + topic.count, 0)
            };
          })
          .filter(Boolean);

        if (!domains.length) {
          return null;
        }

        return {
          ...section,
          domains,
          visibleCount: domains.reduce((sum, domain) => sum + domain.visibleCount, 0)
        };
      })
      .filter(Boolean);
  }

  function topicMatchesFilters(topic) {
    if (state.filters.active === "active" && !topic.active) {
      return false;
    }
    if (state.filters.difficulty !== "all" && topic.difficulty !== state.filters.difficulty) {
      return false;
    }
    if (state.filters.scoreBand !== "all" && topic.scoreBand !== state.filters.scoreBand) {
      return false;
    }
    if (state.filters.timeSpent !== "all" && topic.timeSpent !== state.filters.timeSpent) {
      return false;
    }
    if (state.filters.marked === "marked" && !topic.marked) {
      return false;
    }
    if (state.filters.solved === "solved" && !topic.solved) {
      return false;
    }
    if (state.filters.solved === "unsolved" && topic.solved) {
      return false;
    }
    if (state.filters.incorrect === "incorrect" && !topic.incorrect) {
      return false;
    }
    if (state.filters.incorrect === "clean" && topic.incorrect) {
      return false;
    }
    return true;
  }

  function isDomainSelected(sectionKey, domainKey) {
    return state.section === sectionKey && state.selectedDomains.includes(domainId(sectionKey, domainKey));
  }

  function isTopicSelected(sectionKey, domainKey, topicKey) {
    return state.section === sectionKey && state.selectedTopics.includes(topicId(sectionKey, domainKey, topicKey));
  }

  function getSelectionDomainKeys() {
    const selected = new Set();
    state.selectedDomains.forEach((id) => selected.add(id.split("::")[1]));
    state.selectedTopics.forEach((id) => selected.add(id.split("::")[1]));
    return [...selected];
  }

  function getSelectionCount() {
    return state.selectedDomains.length + state.selectedTopics.length;
  }

  function getSelectedSectionLabel() {
    return SAT_DATA.sections.find((section) => section.key === state.section)?.label || "";
  }

  function renderSummary() {
    const selectionCount = getSelectionCount();
    const domainKeys = getSelectionDomainKeys();
    const sectionLabel = getSelectedSectionLabel();

    if (!selectionCount) {
      selectionSummary.textContent = "Nothing selected yet";
      startSelectedBtn.textContent = "Start practice";
      startSelectedBtn.disabled = false;
      return;
    }

    selectionSummary.textContent = `${sectionLabel} · ${selectionCount} selection${selectionCount === 1 ? "" : "s"} · ${domainKeys.length} domain${domainKeys.length === 1 ? "" : "s"} · ${state.limit} questions`;
    startSelectedBtn.textContent = state.multiSelect ? `Start ${selectionCount} selected` : "Start practice";
    startSelectedBtn.disabled = false;
  }

  function renderToolbarState() {
    toggleFiltersBtn.classList.toggle("is-active", state.filtersOpen);
    toggleFiltersBtn.setAttribute("aria-pressed", String(state.filtersOpen));
    multiSelectBtn.classList.toggle("is-active", state.multiSelect);
    multiSelectBtn.setAttribute("aria-pressed", String(state.multiSelect));
    shuffleQuestionsBtn.classList.toggle("is-active", state.shuffle);
    shuffleQuestionsBtn.setAttribute("aria-pressed", String(state.shuffle));
    filtersPanel.classList.toggle("is-hidden", !state.filtersOpen);
    showAttemptsToggle.checked = state.showPreviousAttempts;
  }

  function renderAttemptBadges(badges) {
    if (!state.showPreviousAttempts || !badges || !badges.length) {
      return "";
    }

    return `
      <div class="sat-attempt-badges">
        ${badges
          .map((badge) => `<span class="sat-attempt-badge is-${badge.tone}">${badge.label}</span>`)
          .join("")}
      </div>
    `;
  }

  function renderSections() {
    const sections = getVisibleSections();

    sectionColumns.innerHTML = sections
      .map(
        (section) => `
          <article class="sat-section-card is-${section.key}">
            <header class="sat-section-header">
              <button class="sat-check sat-check-lg ${state.section === section.key && (getSelectionCount() > 0 || !state.multiSelect) ? "is-active" : ""}" type="button" data-select-section="${section.key}" aria-label="Select ${section.label}"></button>
              <button class="sat-section-heading" type="button" data-open-section="${section.key}">
                <div>
                  <h2 class="sat-section-title">${section.label}</h2>
                  <p class="sat-section-count">${section.visibleCount} questions</p>
                </div>
              </button>
            </header>
            <div class="sat-domain-grid">
              ${section.domains
                .map(
                  (domain) => `
                    <section class="sat-domain-group">
                      <div class="sat-domain-row">
                        <button class="sat-check ${isDomainSelected(section.key, domain.key) ? "is-active" : ""}" type="button" data-select-domain="${section.key}::${domain.key}" aria-label="Select ${domain.key}"></button>
                        <button class="sat-domain-heading" type="button" data-open-domain="${section.key}::${domain.key}">
                          <strong class="sat-domain-name">${domain.key}</strong>
                          ${renderAttemptBadges(domain.attempts)}
                        </button>
                        <span class="sat-domain-count">${domain.visibleCount} questions</span>
                      </div>
                      <div class="sat-topic-list">
                        ${domain.topics
                          .map(
                            (topic) => `
                              <div class="sat-topic-row ${isTopicSelected(section.key, domain.key, topic.key) ? "is-selected" : ""}">
                                <button class="sat-check ${isTopicSelected(section.key, domain.key, topic.key) ? "is-active" : ""}" type="button" data-select-topic="${section.key}::${domain.key}::${topic.key}" aria-label="Select ${topic.key}"></button>
                                <button class="sat-topic-heading" type="button" data-open-topic="${section.key}::${domain.key}::${topic.key}">
                                  <span>${topic.key}</span>
                                  ${renderAttemptBadges(topic.attempts)}
                                </button>
                                <span class="sat-topic-count">${topic.count} questions</span>
                              </div>
                            `
                          )
                          .join("")}
                      </div>
                    </section>
                  `
                )
                .join("")}
            </div>
          </article>
        `
      )
      .join("");
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

  function selectSection(sectionKey) {
    const visibleSection = getVisibleSections().find((section) => section.key === sectionKey);
    if (!visibleSection) {
      return;
    }

    if (!state.multiSelect) {
      navigate(sectionKey, visibleSection.domains.map((domain) => domain.key));
      return;
    }

    if (state.section === sectionKey && getSelectionCount()) {
      clearSelection();
    } else {
      ensureSection(sectionKey);
      state.selectedDomains = visibleSection.domains.map((domain) => domainId(sectionKey, domain.key));
      state.selectedTopics = [];
    }

    renderAll();
  }

  function selectDomain(sectionKey, domainKey) {
    if (!state.multiSelect) {
      navigate(sectionKey, [domainKey]);
      return;
    }

    ensureSection(sectionKey);
    const id = domainId(sectionKey, domainKey);
    if (state.selectedDomains.includes(id)) {
      state.selectedDomains = state.selectedDomains.filter((item) => item !== id);
    } else {
      state.selectedDomains = [...state.selectedDomains, id];
      state.selectedTopics = state.selectedTopics.filter((item) => item.split("::")[1] !== domainKey);
    }
    renderAll();
  }

  function selectTopic(sectionKey, domainKey, topicKey) {
    if (!state.multiSelect) {
      navigate(sectionKey, [domainKey]);
      return;
    }

    ensureSection(sectionKey);
    state.selectedDomains = state.selectedDomains.filter((item) => item !== domainId(sectionKey, domainKey));

    const id = topicId(sectionKey, domainKey, topicKey);
    if (state.selectedTopics.includes(id)) {
      state.selectedTopics = state.selectedTopics.filter((item) => item !== id);
    } else {
      state.selectedTopics = [...state.selectedTopics, id];
    }
    renderAll();
  }

  function resetFilters() {
    clearSelection();
    state.limit = 10;
    state.shuffle = true;
    state.multiSelect = false;
    state.filtersOpen = true;
    state.showPreviousAttempts = false;
    state.filters = {
      active: "all",
      difficulty: "all",
      scoreBand: "all",
      timeSpent: "all",
      marked: "all",
      solved: "all",
      incorrect: "all"
    };

    limitInput.value = "10";
    Object.entries(filterInputs).forEach(([key, input]) => {
      input.value = state.filters[key];
    });
    renderAll();
  }

  function renderAll() {
    renderToolbarState();
    renderSections();
    renderSummary();
  }

  sectionColumns.addEventListener("click", (event) => {
    const sectionTrigger = event.target.closest("[data-select-section], [data-open-section]");
    const domainTrigger = event.target.closest("[data-select-domain], [data-open-domain]");
    const topicTrigger = event.target.closest("[data-select-topic], [data-open-topic]");

    if (sectionTrigger) {
      const sectionKey = sectionTrigger.dataset.selectSection || sectionTrigger.dataset.openSection;
      selectSection(sectionKey);
      return;
    }

    if (domainTrigger) {
      const [sectionKey, domainKey] = (domainTrigger.dataset.selectDomain || domainTrigger.dataset.openDomain).split("::");
      selectDomain(sectionKey, domainKey);
      return;
    }

    if (topicTrigger) {
      const [sectionKey, domainKey, topicKey] = (topicTrigger.dataset.selectTopic || topicTrigger.dataset.openTopic).split("::");
      selectTopic(sectionKey, domainKey, topicKey);
    }
  });

  limitInput.addEventListener("input", () => {
    const parsed = Number(limitInput.value);
    state.limit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
    renderSummary();
  });

  Object.entries(filterInputs).forEach(([key, input]) => {
    input.addEventListener("change", () => {
      state.filters[key] = input.value;
      clearSelection();
      renderAll();
    });
  });

  toggleFiltersBtn.addEventListener("click", () => {
    state.filtersOpen = !state.filtersOpen;
    renderToolbarState();
  });

  multiSelectBtn.addEventListener("click", () => {
    state.multiSelect = !state.multiSelect;
    if (!state.multiSelect) {
      clearSelection();
    }
    renderAll();
  });

  shuffleQuestionsBtn.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    renderToolbarState();
    renderSummary();
  });

  showAttemptsToggle.addEventListener("change", () => {
    state.showPreviousAttempts = showAttemptsToggle.checked;
    renderSections();
  });

  startSelectedBtn.addEventListener("click", () => {
    const selectedDomains = getSelectionDomainKeys();

    if (selectedDomains.length && state.section) {
      navigate(state.section, selectedDomains);
      return;
    }

    const visibleSections = getVisibleSections();
    const fallbackSection = visibleSections[0];
    if (!fallbackSection) {
      return;
    }
    navigate(fallbackSection.key, []);
  });

  clearFiltersBtn.addEventListener("click", resetFilters);

  resetFilters();
})();
