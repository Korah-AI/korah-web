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

  const SAT_DATA = {
    sections: [
      {
        key: "english",
        label: "English Reading & Writing",
        description: "Reading, rhetoric, revision, and language conventions from the SAT verbal section.",
        count: 1587,
        domains: [
          {
            key: "Information and Ideas",
            count: 475,
            description: "Interpret details, make inferences, and synthesize claims across passages.",
            topics: [
              {
                key: "Central Ideas and Details",
                count: 116,
                difficulty: "medium",
                scoreBand: "680-790",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false
              },
              {
                key: "Command of Evidence",
                count: 242,
                difficulty: "hard",
                scoreBand: "700-800",
                timeSpent: "90 sec+",
                active: true,
                marked: true,
                solved: false,
                incorrect: true,
                attempts: [
                  { tone: "gold", label: "2" }
                ]
              },
              {
                key: "Inferences",
                count: 117,
                difficulty: "medium",
                scoreBand: "650-740",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: false,
                incorrect: false
              }
            ]
          },
          {
            key: "Craft and Structure",
            count: 412,
            description: "Analyze word choice, text structure, rhetoric, and point of view.",
            topics: [
              {
                key: "Cross-Text Connections",
                count: 56,
                difficulty: "medium",
                scoreBand: "640-730",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false
              },
              {
                key: "Text Structure and Purpose",
                count: 130,
                difficulty: "medium",
                scoreBand: "660-760",
                timeSpent: "45-90 sec",
                active: true,
                marked: true,
                solved: false,
                incorrect: true
              },
              {
                key: "Words in Context",
                count: 226,
                difficulty: "easy",
                scoreBand: "610-700",
                timeSpent: "Under 45 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false
              }
            ]
          },
          {
            key: "Expression of Ideas",
            count: 343,
            description: "Revise for clarity, organization, transitions, and rhetorical effectiveness.",
            topics: [
              {
                key: "Rhetorical Synthesis",
                count: 182,
                difficulty: "hard",
                scoreBand: "700-800",
                timeSpent: "90 sec+",
                active: true,
                marked: false,
                solved: false,
                incorrect: true
              },
              {
                key: "Transitions",
                count: 161,
                difficulty: "easy",
                scoreBand: "610-690",
                timeSpent: "Under 45 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false
              }
            ]
          },
          {
            key: "Standard English Conventions",
            count: 357,
            description: "Sentence boundaries, punctuation, agreement, and usage rules.",
            topics: [
              {
                key: "Boundaries",
                count: 180,
                difficulty: "medium",
                scoreBand: "660-740",
                timeSpent: "Under 45 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "1" }
                ]
              },
              {
                key: "Form, Structure, and Sense",
                count: 177,
                difficulty: "medium",
                scoreBand: "650-730",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "1" }
                ]
              }
            ]
          }
        ]
      },
      {
        key: "math",
        label: "Math",
        description: "Algebra, advanced math, data analysis, geometry, and trigonometry.",
        count: 1700,
        domains: [
          {
            key: "Algebra",
            count: 569,
            description: "Linear equations, systems, inequalities, and algebraic fluency.",
            attempts: [
              { tone: "gold", label: "2" }
            ],
            topics: [
              {
                key: "Linear equations in one variable",
                count: 106,
                difficulty: "easy",
                scoreBand: "600-680",
                timeSpent: "Under 45 sec",
                active: true,
                marked: true,
                solved: false,
                incorrect: true,
                attempts: [
                  { tone: "gold", label: "1" }
                ]
              },
              {
                key: "Linear functions",
                count: 152,
                difficulty: "medium",
                scoreBand: "640-730",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false
              },
              {
                key: "Linear equations in two variables",
                count: 126,
                difficulty: "medium",
                scoreBand: "640-740",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false
              },
              {
                key: "Systems of two linear equations in two variables",
                count: 112,
                difficulty: "medium",
                scoreBand: "660-750",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: false,
                incorrect: false
              },
              {
                key: "Linear inequalities in one or two variables",
                count: 73,
                difficulty: "hard",
                scoreBand: "700-800",
                timeSpent: "90 sec+",
                active: true,
                marked: true,
                solved: false,
                incorrect: true,
                attempts: [
                  { tone: "gold", label: "1" }
                ]
              }
            ]
          },
          {
            key: "Advanced Math",
            count: 479,
            description: "Nonlinear functions, equivalent expressions, and higher-order structure.",
            topics: [
              {
                key: "Equivalent expressions",
                count: 102,
                difficulty: "medium",
                scoreBand: "650-730",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: false,
                incorrect: false
              },
              {
                key: "Nonlinear equations in one variable and systems of equations in two variables",
                count: 148,
                difficulty: "hard",
                scoreBand: "700-800",
                timeSpent: "90 sec+",
                active: true,
                marked: false,
                solved: false,
                incorrect: true
              },
              {
                key: "Nonlinear functions",
                count: 229,
                difficulty: "hard",
                scoreBand: "700-800",
                timeSpent: "90 sec+",
                active: true,
                marked: false,
                solved: false,
                incorrect: false
              }
            ]
          },
          {
            key: "Problem-Solving and Data Analysis",
            count: 383,
            description: "Ratios, rates, percentages, probability, and data interpretation.",
            attempts: [
              { tone: "gold", label: "9" },
              { tone: "green", label: "49" }
            ],
            topics: [
              {
                key: "Ratios, rates, proportional relationships, and units",
                count: 86,
                difficulty: "medium",
                scoreBand: "640-720",
                timeSpent: "45-90 sec",
                active: true,
                marked: true,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "gold", label: "7" },
                  { tone: "green", label: "8" }
                ]
              },
              {
                key: "Percentages",
                count: 78,
                difficulty: "easy",
                scoreBand: "600-680",
                timeSpent: "Under 45 sec",
                active: true,
                marked: true,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "gold", label: "1" },
                  { tone: "green", label: "10" }
                ]
              },
              {
                key: "One-variable data: Distributions and measures of center and spread",
                count: 74,
                difficulty: "medium",
                scoreBand: "650-730",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "9" }
                ]
              },
              {
                key: "Two-variable data: Models and scatterplots",
                count: 63,
                difficulty: "medium",
                scoreBand: "660-740",
                timeSpent: "45-90 sec",
                active: true,
                marked: false,
                solved: false,
                incorrect: false,
                attempts: [
                  { tone: "gold", label: "1" },
                  { tone: "green", label: "8" }
                ]
              },
              {
                key: "Probability and conditional probability",
                count: 46,
                difficulty: "hard",
                scoreBand: "700-800",
                timeSpent: "90 sec+",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "7" },
                  { tone: "green", label: "46" }
                ]
              },
              {
                key: "Inference from sample statistics and margin of error",
                count: 25,
                difficulty: "hard",
                scoreBand: "710-800",
                timeSpent: "90 sec+",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "4" }
                ]
              },
              {
                key: "Evaluating statistical claims: observational studies and experiments",
                count: 11,
                difficulty: "hard",
                scoreBand: "710-800",
                timeSpent: "90 sec+",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "3" }
                ]
              }
            ]
          },
          {
            key: "Geometry and Trigonometry",
            count: 269,
            description: "Angles, circles, area, volume, right triangles, and trig relationships.",
            attempts: [
              { tone: "gold", label: "2" },
              { tone: "green", label: "42" }
            ],
            topics: [
              {
                key: "Area and volume",
                count: 86,
                difficulty: "medium",
                scoreBand: "650-730",
                timeSpent: "45-90 sec",
                active: true,
                marked: true,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "gold", label: "1" },
                  { tone: "green", label: "17" }
                ]
              },
              {
                key: "Lines, angles, and triangles",
                count: 79,
                difficulty: "medium",
                scoreBand: "650-740",
                timeSpent: "45-90 sec",
                active: true,
                marked: true,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "gold", label: "1" },
                  { tone: "green", label: "13" }
                ]
              },
              {
                key: "Right triangles and trigonometry",
                count: 54,
                difficulty: "hard",
                scoreBand: "700-800",
                timeSpent: "90 sec+",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "7" }
                ]
              },
              {
                key: "Circles",
                count: 50,
                difficulty: "easy",
                scoreBand: "600-680",
                timeSpent: "Under 45 sec",
                active: true,
                marked: false,
                solved: true,
                incorrect: false,
                attempts: [
                  { tone: "green", label: "5" }
                ]
              }
            ]
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

  function parseOpenSatV1Query(search) {
    const params = new URLSearchParams(search || window.location.search);
    return {
      section: params.get("section") || "",
      domain: params.get("domain") || "any",
      limit: Number(params.get("limit")) || 10,
    };
  }

  function buildOpenSatV1QuestionUrl(state) {
    const params = new URLSearchParams();
    if (state.section) params.set("section", state.section);
    params.set("domain", state.domain || "any");
    params.set("limit", String(state.limit || 10));
    return `./questions.html?${params.toString()}`;
  }

  function getOpenSatDomainsBySection(sectionKey) {
    const section = OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey);
    return section ? section.domains : [];
  }

  function getOpenSatSection(sectionKey) {
    return OPENSAT_CATALOG.sections.find((s) => s.key === sectionKey) || null;
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
    OPENSAT_CATALOG,
    SAT_DATA,
    getSection,
    getAllDomains,
    parseQuery,
    buildQuestionUrl,
    parseOpenSatV1Query,
    buildOpenSatV1QuestionUrl,
    getOpenSatSection,
    getOpenSatDomainsBySection,
    shuffleArray,
    getMockQuestions
  };
})();
