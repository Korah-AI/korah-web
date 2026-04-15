(function () {
  const OPENSAT_CATALOG = {
    sections: [
      {
        key: "english",
        label: "English Reading & Writing",
        description: "Section/domain-based SAT practice powered by OpenSAT.",
        domains: [
          { key: "Information and Ideas", description: "Interpret details, make inferences, and synthesize claims across passages." },
          { key: "Craft and Structure", description: "Analyze word choice, text structure, rhetoric, and point of view." },
          { key: "Expression of Ideas", description: "Revise for clarity, organization, transitions, and rhetorical effectiveness." },
          { key: "Standard English Conventions", description: "Sentence boundaries, punctuation, agreement, and usage rules." },
        ],
      },
      {
        key: "math",
        label: "Math",
        description: "Section/domain-based SAT practice powered by OpenSAT.",
        domains: [
          { key: "Algebra", description: "Linear equations, systems, inequalities, and algebraic fluency." },
          { key: "Advanced Math", description: "Nonlinear functions, equivalent expressions, and higher-order structure." },
          { key: "Problem-Solving and Data Analysis", description: "Ratios, rates, percentages, probability, and data interpretation." },
          { key: "Geometry and Trigonometry", description: "Angles, circles, area, volume, right triangles, and trig relationships." },
        ],
      },
    ],
  };

  function parseOpenSatV1Query(search) {
    const params = new URLSearchParams(search || window.location.search);
    const sectionParam = (params.get("sections") || "").trim();
    const sections = sectionParam ? sectionParam.split(",").map((s) => s.trim()).filter((s) => s === "english" || s === "math") : [];
    const domainParam = (params.get("domains") || "").trim();
    const domains = domainParam ? domainParam.split(",").map((d) => d.trim()).filter(Boolean) : [];
    const limitRaw = params.get("limit");
    const limit = limitRaw === null || limitRaw === "" ? null : (limitRaw.toLowerCase() === "none" ? null : Number(limitRaw));
    const effectiveLimit = (limit === null || (Number.isFinite(limit) && limit > 0)) ? limit : null;

    return {
      sections: sections.length > 0 ? sections : ["english", "math"],
      domains: domains.length > 0 ? domains : ["any"],
      limit: effectiveLimit,
    };
  }

  function buildOpenSatV1QuestionUrl(state) {
    const params = new URLSearchParams();
    const sectionValue = state.sections && state.sections.length > 0 && !(state.sections.length === 2 && state.sections.includes("english") && state.sections.includes("math"))
      ? state.sections.join(",")
      : "any";
    params.set("sections", sectionValue);
    const domainValue = state.domains && state.domains.length > 0 && !state.domains.includes("any")
      ? state.domains.join(",")
      : "any";
    params.set("domains", domainValue);
    if (state.limit !== null && state.limit !== undefined) {
      params.set("limit", String(state.limit));
    }
    return `./questions.html?${params.toString()}`;
  }

  function getOpenSatDomainsBySection(sectionKey) {
    const section = OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey);
    return section ? section.domains : [];
  }

  function getOpenSatSection(sectionKey) {
    return OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey) || null;
  }

  window.KorahSAT = {
    OPENSAT_CATALOG,
    parseOpenSatV1Query,
    buildOpenSatV1QuestionUrl,
    getOpenSatSection,
    getOpenSatDomainsBySection,
  };
})();
