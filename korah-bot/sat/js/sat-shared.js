(function () {
  const OPENSAT_CATALOG = {
    sections: [
      {
        key: "english",
        label: "English Reading & Writing",
        description: "Section/domain-based SAT practice powered by OpenSAT.",
        domains: [
          {
            key: "Information and Ideas",
            code: "INI",
            description: "Interpret details, make inferences, and synthesize claims across passages.",
            skills: [
              { key: "Central Ideas and Details", code: "CID" },
              { key: "Inferences", code: "INF" },
              { key: "Command of Evidence", code: "COE" },
            ],
          },
          {
            key: "Craft and Structure",
            code: "CAS",
            description: "Analyze word choice, text structure, rhetoric, and point of view.",
            skills: [
              { key: "Words in Context", code: "WIC" },
              { key: "Text Structure and Purpose", code: "TSP" },
              { key: "Cross-Text Connections", code: "CTC" },
            ],
          },
          {
            key: "Expression of Ideas",
            code: "EOI",
            description: "Revise for clarity, organization, transitions, and rhetorical effectiveness.",
            skills: [
              { key: "Rhetorical Synthesis", code: "SYN" },
              { key: "Transitions", code: "TRA" },
            ],
          },
          {
            key: "Standard English Conventions",
            code: "SEC",
            description: "Sentence boundaries, punctuation, agreement, and usage rules.",
            skills: [
              { key: "Boundaries", code: "BOU" },
              { key: "Form, Structure, and Sense", code: "FSS" },
            ],
          },
        ],
      },
      {
        key: "math",
        label: "Math",
        description: "Section/domain-based SAT practice powered by OpenSAT.",
        domains: [
          {
            key: "Algebra",
            code: "H",
            description: "Linear equations, systems, inequalities, and algebraic fluency.",
            skills: [
              { key: "Linear equations in one variable", code: "H.A." },
              { key: "Linear functions", code: "H.B." },
              { key: "Linear equations in two variables", code: "H.C." },
              { key: "Systems of two linear equations in two variables", code: "H.D." },
              { key: "Linear inequalities in one or two variables", code: "H.E." },
            ],
          },
          {
            key: "Advanced Math",
            code: "P",
            description: "Nonlinear functions, equivalent expressions, and higher-order structure.",
            skills: [
              { key: "Equivalent expressions", code: "P.A." },
              { key: "Nonlinear equations in one variable and systems of equations", code: "P.B." },
              { key: "Nonlinear functions", code: "P.C." },
            ],
          },
          {
            key: "Problem-Solving and Data Analysis",
            code: "Q",
            description: "Ratios, rates, percentages, probability, and data interpretation.",
            skills: [
              { key: "Ratios, rates, proportional relationships, and units", code: "Q.A." },
              { key: "Percentages", code: "Q.B." },
              { key: "One-variable data: Distributions and measures of center", code: "Q.C." },
              { key: "Two-variable data: Models and scatterplots", code: "Q.D." },
              { key: "Probability and conditional probability", code: "Q.E." },
              { key: "Inference from sample statistics and margin of error", code: "Q.F." },
              { key: "Evaluating statistical claims: Observational studies", code: "Q.G." },
            ],
          },
          {
            key: "Geometry and Trigonometry",
            code: "S",
            description: "Angles, circles, area, volume, right triangles, and trig relationships.",
            skills: [
              { key: "Area and volume", code: "S.A." },
              { key: "Lines, angles, and triangles", code: "S.B." },
              { key: "Right triangles and trigonometry", code: "S.C." },
              { key: "Circles", code: "S.D." },
            ],
          },
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
    const skillParam = (params.get("skills") || "").trim();
    const skills = skillParam ? skillParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const limitRaw = params.get("limit");
    const limit = limitRaw === null || limitRaw === "" ? null : (limitRaw.toLowerCase() === "none" ? null : Number(limitRaw));
    const effectiveLimit = (limit === null || (Number.isFinite(limit) && limit > 0)) ? limit : null;

    return {
      sections: sections.length > 0 ? sections : ["english", "math"],
      domains: domains.length > 0 ? domains : ["any"],
      skills: skills.length > 0 ? skills : ["any"],
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
    const skillValue = state.skills && state.skills.length > 0 && !state.skills.includes("any")
      ? state.skills.join(",")
      : "any";
    params.set("skills", skillValue);
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
