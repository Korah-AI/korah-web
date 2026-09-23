(function () {
  const OPENSAT_CATALOG = {
    sections: [
      {
        key: "english",
        label: "English Reading & Writing",
        description: "Practice questions sourced from the Official College Board Question Bank.",
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
        description: "Practice questions sourced from the Official College Board Question Bank.",
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

  const VALID_DIFFICULTIES = ["E", "M", "H"];
  const VALID_ASSESSMENTS = ["SAT", "PSAT/NMSQT", "PSAT"];
  // Per-question filters applied client-side by the player. First value is the
  // default ("no filter"). See docs/sat-bank-filters.md.
  const SESSION_FILTERS = {
    timespent: ["any", "lt30", "30to60", "gt60"],
    saved: ["all", "saved", "unsaved"],
    completed: ["all", "completed", "incomplete"],
    result: ["all", "correct", "incorrect"],
  };

  function parseSessionFilter(params, key) {
    const allowed = SESSION_FILTERS[key];
    const raw = (params.get(key) || "").trim().toLowerCase();
    return allowed.includes(raw) ? raw : allowed[0];
  }

  function parseOpenSatV1Query(search) {
    const params = new URLSearchParams(search || window.location.search);
    const sectionParam = (params.get("sections") || "").trim();
    const sections = sectionParam ? sectionParam.split(",").map((s) => s.trim()).filter((s) => s === "english" || s === "math") : [];
    const domainParam = (params.get("domains") || "").trim();
    const domains = domainParam ? domainParam.split(",").map((d) => d.trim()).filter(Boolean) : [];
    const skillParam = (params.get("skills") || "").trim();
    const skills = skillParam ? skillParam.split(",").map((s) => s.trim()).filter(Boolean) : [];
    const difficultyParam = (params.get("difficulties") || "").trim().toUpperCase();
    const difficulties = difficultyParam
      ? difficultyParam.split(",").map((d) => d.trim()).filter((d) => VALID_DIFFICULTIES.includes(d))
      : [];
    const assessmentRaw = (params.get("assessment") || "").trim().toUpperCase();
    const assessment = VALID_ASSESSMENTS.find((a) => a.toUpperCase() === assessmentRaw) || "SAT";
    const limitRaw = params.get("limit");
    const limit = limitRaw === null || limitRaw === "" ? null : (limitRaw.toLowerCase() === "none" ? null : Number(limitRaw));
    const effectiveLimit = (limit === null || (Number.isFinite(limit) && limit > 0)) ? limit : null;

    // Handle explicit question IDs
    const questionIdsRaw = params.get("questionIds") || params.get("ids");
    const questionIds = questionIdsRaw ? questionIdsRaw.split(",").map(id => id.trim()).filter(Boolean) : [];

    const randomRaw = (params.get("random") || "").trim().toLowerCase();
    const random = randomRaw === "1" || randomRaw === "true";
    const mode = (params.get("mode") || "").trim().toLowerCase() === "tailored"
      ? "tailored"
      : "player";

    return {
      sections: sections.length > 0 ? sections : ["english", "math"],
      domains: domains.length > 0 ? domains : ["any"],
      skills: skills.length > 0 ? skills : ["any"],
      difficulties: difficulties.length > 0 ? difficulties : ["any"],
      assessment,
      limit: effectiveLimit,
      questionIds,
      random,
      mode,
      timespent: parseSessionFilter(params, "timespent"),
      saved: parseSessionFilter(params, "saved"),
      completed: parseSessionFilter(params, "completed"),
      result: parseSessionFilter(params, "result"),
    };
  }

  function buildOpenSatV1QuestionUrl(state) {
    const params = new URLSearchParams();

    if (state.questionIds && state.questionIds.length > 0) {
      params.set("questionIds", state.questionIds.join(","));
    } else {
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
      const difficultyValue = state.difficulties && state.difficulties.length > 0 && !state.difficulties.includes("any")
        ? state.difficulties.join(",")
        : "any";
      params.set("difficulties", difficultyValue);
    }

    if (state.assessment && state.assessment !== "SAT") {
      params.set("assessment", state.assessment);
    }
    if (state.limit !== null && state.limit !== undefined) {
      params.set("limit", String(state.limit));
    }
    if (state.random) {
      params.set("random", "1");
    }
    if (state.mode === "tailored") {
      params.set("mode", "tailored");
    }
    // Per-question filters — only emit when non-default (first allowed value).
    Object.keys(SESSION_FILTERS).forEach((key) => {
      const value = state[key];
      if (value && value !== SESSION_FILTERS[key][0]) {
        params.set(key, value);
      }
    });
    return `./questions.html?${params.toString()}`;
  }


  // ── SPR grading ───────────────────────────────────────────────────────────
  // Normalize SPR answers for comparison: trim, lowercase, fix leading decimal (e.g. ".75" → "0.75")
  function normalizeSprAnswer(val) {
    if (!val) return "";
    return String(val).trim().toLowerCase().replace(/^(-?)\./, "$10.");
  }

  // SPR answers are graded by value, not by spelling: College Board accepts any
  // form that evaluates to the right number, so 1/4, 0.25 and .25 all count.
  // Returns null for anything that isn't a plain number or a simple fraction.
  function parseSprNumber(val) {
    const cleaned = String(val ?? "")
      .trim()
      .replace(/[\u2212\u2013\u2014]/g, "-") // unicode minus / en / em dash
      .replace(/[\s,$]/g, "");
    if (!cleaned) return null;
    const frac = /^(-?\d*\.?\d+)\/(-?\d*\.?\d+)$/.exec(cleaned);
    if (frac) {
      const n = Number(frac[1]);
      const d = Number(frac[2]);
      return Number.isFinite(n) && Number.isFinite(d) && d !== 0 ? n / d : null;
    }
    if (!/^-?\d*\.?\d+$/.test(cleaned)) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  // Digits the student actually typed after the decimal point, or null if they
  // did not enter a plain decimal (fractions are exact, so precision is moot).
  function typedDecimals(val) {
    const m = /^-?\d*\.(\d+)$/.exec(String(val ?? "").trim().replace(/[\s,$]/g, ""));
    return m ? m[1].length : null;
  }

  // Leading zeros carry no precision, so ".0714" is three significant digits.
  function significantDigits(val) {
    const digits = String(val ?? "").replace(/[^0-9]/g, "").replace(/^0+/, "");
    return digits.length;
  }

  function sprAnswerMatches(input, expected) {
    if (!input) return false;
    if (normalizeSprAnswer(input) === normalizeSprAnswer(expected)) return true;
    const typed = parseSprNumber(input);
    const target = parseSprNumber(expected);
    if (typed === null || target === null) return false;
    if (Math.abs(typed - target) < 1e-9) return true;
    // A non-terminating value may be truncated or rounded, as long as the entry
    // fills the grid — CB's bar is three significant digits, which is what makes
    // .0714 a correct entry for 1/14. Either side may be the rounded one, since
    // CB sometimes publishes the rounded decimal as the accepted answer.
    return roundsTo(input, typed, target) || roundsTo(expected, target, typed);
  }

  function roundsTo(text, value, exact) {
    const places = typedDecimals(text);
    if (places === null || significantDigits(text) < 3) return false;
    const scale = Math.pow(10, places);
    return (
      Math.abs(value - Math.trunc(exact * scale) / scale) < 1e-9 ||
      Math.abs(value - Math.round(exact * scale) / scale) < 1e-9
    );
  }

  // CB ships every accepted form (e.g. ["25/4", "6.25"]); older cached payloads
  // only carry the single correctAnswer field.
  function acceptedAnswersFor(question) {
    const list = Array.isArray(question?.correctAnswers) ? question.correctAnswers : [];
    return list.length ? list : [question?.correctAnswer ?? ""];
  }

  function isAnswerCorrect(question, answer) {
    if (!question) return false;
    if (question.type !== "spr") return answer === question.correctAnswer;
    return acceptedAnswersFor(question).some((a) => sprAnswerMatches(answer, a));
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
    acceptedAnswersFor,
    isAnswerCorrect,
  };
})();
