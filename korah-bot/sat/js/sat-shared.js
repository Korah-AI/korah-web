(function () {
  const SAT_DATA = {
    sections: [
      {
        key: "english",
        label: "English Reading & Writing",
        description: "Reading, rhetoric, revision, and language conventions from the SAT verbal section.",
        domains: [
          {
            key: "Information and Ideas",
            count: 134,
            description: "Interpret details, make inferences, and synthesize claims across passages."
          },
          {
            key: "Craft and Structure",
            count: 121,
            description: "Analyze word choice, text structure, rhetoric, and point of view."
          },
          {
            key: "Expression of Ideas",
            count: 116,
            description: "Revise for clarity, organization, transitions, and rhetorical effectiveness."
          },
          {
            key: "Standard English Conventions",
            count: 142,
            description: "Sentence boundaries, punctuation, agreement, and usage rules."
          }
        ]
      },
      {
        key: "math",
        label: "Math",
        description: "Algebra, advanced math, data analysis, geometry, and trigonometry.",
        domains: [
          {
            key: "Algebra",
            count: 148,
            description: "Linear equations, systems, inequalities, and algebraic fluency."
          },
          {
            key: "Advanced Math",
            count: 126,
            description: "Nonlinear functions, equivalent expressions, and higher-order structure."
          },
          {
            key: "Problem-Solving and Data Analysis",
            count: 118,
            description: "Ratios, rates, percentages, probability, and data interpretation."
          },
          {
            key: "Geometry and Trigonometry",
            count: 108,
            description: "Angles, circles, area, volume, right triangles, and trig relationships."
          }
        ]
      }
    ],
    mockQuestions: [
      {
        id: "eng-sec-1",
        section: "english",
        domain: "Standard English Conventions",
        paragraph: "The museum's new exhibit features sketches from the architect's early career, along with annotated blueprints that reveal how the final design changed over time.",
        stem: "Which choice completes the text so that it conforms to the conventions of Standard English?",
        options: [
          { key: "A", text: "career, along with" },
          { key: "B", text: "career along with" },
          { key: "C", text: "career; along with" },
          { key: "D", text: "career: along with" }
        ],
        correctAnswer: "A",
        explanation: "A comma correctly sets off the nonessential phrase and preserves the sentence structure."
      },
      {
        id: "eng-craft-1",
        section: "english",
        domain: "Craft and Structure",
        paragraph: "In the final paragraph, the author describes the wetlands as a 'living archive,' emphasizing that each layer of soil preserves traces of past climate conditions.",
        stem: "Which choice best states the function of the quoted phrase in the text?",
        options: [
          { key: "A", text: "It introduces a claim the author later rejects." },
          { key: "B", text: "It highlights the wetlands as a source of historical evidence." },
          { key: "C", text: "It signals that the wetlands are difficult to preserve." },
          { key: "D", text: "It compares the wetlands to a museum collection." }
        ],
        correctAnswer: "B",
        explanation: "The phrase shows that the wetlands preserve information from the past, functioning as evidence."
      },
      {
        id: "math-alg-1",
        section: "math",
        domain: "Algebra",
        paragraph: "",
        stem: "If 3x - 7 = 20, what is the value of x?",
        options: [
          { key: "A", text: "7" },
          { key: "B", text: "8" },
          { key: "C", text: "9" },
          { key: "D", text: "11" }
        ],
        correctAnswer: "C",
        explanation: "Add 7 to both sides to get 3x = 27, then divide by 3."
      },
      {
        id: "math-psda-1",
        section: "math",
        domain: "Problem-Solving and Data Analysis",
        paragraph: "A survey found that 36 of 120 students preferred studying in the morning.",
        stem: "Based on the survey, what percent of students preferred studying in the morning?",
        options: [
          { key: "A", text: "24%" },
          { key: "B", text: "30%" },
          { key: "C", text: "32%" },
          { key: "D", text: "36%" }
        ],
        correctAnswer: "B",
        explanation: "36 divided by 120 equals 0.30, or 30%."
      }
    ]
  };

  function getSection(key) {
    return SAT_DATA.sections.find((section) => section.key === key) || null;
  }

  function getAllDomains() {
    return SAT_DATA.sections.flatMap((section) => section.domains);
  }

  function parseQuery(search) {
    const params = new URLSearchParams(search || window.location.search);
    const domainsValue = params.get("domains");
    const domains = domainsValue
      ? domainsValue.split(",").map((value) => value.trim()).filter(Boolean)
      : params.get("domain")
        ? [params.get("domain")]
        : [];

    return {
      section: params.get("section") || "",
      domains,
      shuffle: params.get("shuffle") === "true",
      limit: Number(params.get("limit")) || 10,
      start: Number(params.get("start")) || 0
    };
  }

  function buildQuestionUrl(state) {
    const params = new URLSearchParams();
    if (state.section) {
      params.set("section", state.section);
    }
    if (state.domains && state.domains.length) {
      params.set(state.domains.length > 1 ? "domains" : "domain", state.domains.join(","));
    }
    params.set("shuffle", String(Boolean(state.shuffle)));
    params.set("limit", String(state.limit || 10));
    return `./questions.html?${params.toString()}`;
  }

  function shuffleArray(items) {
    const array = [...items];
    for (let index = array.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [array[index], array[swapIndex]] = [array[swapIndex], array[index]];
    }
    return array;
  }

  function getMockQuestions(query) {
    let items = SAT_DATA.mockQuestions.filter((question) => !query.section || question.section === query.section);

    if (query.domains.length) {
      const set = new Set(query.domains);
      items = items.filter((question) => set.has(question.domain));
    }

    if (query.shuffle) {
      items = shuffleArray(items);
    }

    return items.slice(0, query.limit || 10);
  }

  window.KorahSAT = {
    SAT_DATA,
    getSection,
    getAllDomains,
    parseQuery,
    buildQuestionUrl,
    shuffleArray,
    getMockQuestions
  };
})();
