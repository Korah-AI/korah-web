// SAT Practice Player - Questions.html
// Handles the practice player functionality for SAT questions
// NEW FEATURES: stopwatch, progress bar, reference panel, session modal, desmos calculator, question number
// OLD FUNCTIONALITY: all original question loading/display/error handling preserved
(() => {
  const { parseOpenSatV1Query, buildOpenSatV1QuestionUrl, OPENSAT_CATALOG } = window.KorahSAT;
  const query = parseOpenSatV1Query();

  const DEMO_QUESTIONS = [
    {
      id: "demo-math-1",
      section: "math",
      domain: "Algebra",
      stem: "If 3x + 7 = 22, what is x?",
      options: [
        { key: "A", text: " 3" },
        { key: "B", text: " 5" },
        { key: "C", text: " 7" },
        { key: "D", text: " 15" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "3x + 7 = 22 → 3x = 15 → x = 5"
    },
    {
      id: "demo-math-2",
      section: "math",
      domain: "Problem Solving and Data Analysis",
      stem: "A store offers 25% off. What is the sale price of an $80 item?",
      options: [
        { key: "A", text: " $55" },
        { key: "B", text: " $60" },
        { key: "C", text: " $65" },
        { key: "D", text: " $20" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "25% off $80 = $80 × 0.25 = $20 discount. Sale price = $80 - $20 = $60"
    },
    {
      id: "demo-english-1",
      section: "english",
      domain: "Craft and Structure",
      stem: "Which word is closest in meaning to 'ephemeral'?",
      options: [
        { key: "A", text: " Permanent" },
        { key: "B", text: " Temporary" },
        { key: "C", text: " Ancient" },
        { key: "D", text: " Modern" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "Ephemeral means lasting for a very short time, similar to temporary"
    },
    {
      id: "demo-english-2",
      section: "english",
      domain: "Command of Evidence",
      stem: "The author's main purpose in this passage is to:",
      options: [
        { key: "A", text: " Entertain" },
        { key: "B", text: " Persuade" },
        { key: "C", text: " Inform" },
        { key: "D", text: " Criticize" }
      ],
      correctAnswer: "C",
      type: "mc",
      explanation: "The passage provides information about the topic without attempting to persuade or criticize"
    },
    {
      id: "demo-math-3",
      section: "math",
      domain: "Geometry",
      stem: "What is the area of a circle with radius 4?",
      options: [
        { key: "A", text: " 8π" },
        { key: "B", text: " 16π" },
        { key: "C", text: " 4π" },
        { key: "D", text: " 32π" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "Area = πr² = π(4)² = 16π"
    },
    {
      id: "demo-math-4",
      section: "math",
      domain: "Statistics",
      stem: "The average of 5 numbers is 20. What is their sum?",
      options: [
        { key: "A", text: " 25" },
        { key: "B", text: " 100" },
        { key: "C", text: " 4" },
        { key: "D", text: " 50" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "Sum = Average × Count = 20 × 5 = 100"
    },
    {
      id: "demo-math-5",
      section: "math",
      domain: "Advanced Algebra",
      stem: "If f(x) = 2x² - 3x + 1, what is f(3)?",
      options: [
        { key: "A", text: " 10" },
        { key: "B", text: " 7" },
        { key: "C", text: " 13" },
        { key: "D", text: " 4" }
      ],
      correctAnswer: "A",
      type: "mc",
      explanation: "f(3) = 2(3)² - 3(3) + 1 = 18 - 9 + 1 = 10"
    },
    {
      id: "demo-english-3",
      section: "english",
      domain: "Information and Ideas",
      stem: "This passage is mainly concerned with:",
      options: [
        { key: "A", text: " Historical events" },
        { key: "B", text: " Scientific findings" },
        { key: "C", text: " Cultural traditions" },
        { key: "D", text: " Economic theories" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "The passage focuses on scientific findings and research methodology"
    },
    {
      id: "demo-english-4",
      section: "english",
      domain: "Standard English Conventions",
      stem: "Choose the correct sentence:",
      options: [
        { key: "A", text: " Their going to the store." },
        { key: "B", text: " They're going to the store." },
        { key: "C", text: " There going to the store." },
        { key: "D", text: " Theyre going to the store." }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "They're = They are is the correct contraction"
    },
    {
      id: "demo-english-5",
      section: "english",
      domain: "Expression of Ideas",
      stem: "Which version best combines these sentences? 'The cat slept. It dreamed.'",
      options: [
        { key: "A", text: " The cat slept and it dreamed." },
        { key: "B", text: " The cat, who was sleeping, dreamed." },
        { key: "C", text: " While sleeping, the cat dreamed." },
        { key: "D", text: " The cat slept because it dreamed." }
      ],
      correctAnswer: "C",
      type: "mc",
      explanation: "Option C uses a participial phrase for concise combination"
    },
    {
      id: "demo-math-6",
      section: "math",
      domain: "Problem Solving and Data Analysis",
      stem: "A car travels 240 miles in 4 hours. What is its average speed?",
      options: [
        { key: "A", text: " 60 mph" },
        { key: "B", text: " 50 mph" },
        { key: "C", text: " 55 mph" },
        { key: "D", text: " 65 mph" }
      ],
      correctAnswer: "A",
      type: "mc",
      explanation: "Speed = Distance ÷ Time = 240 ÷ 4 = 60 mph"
    },
    {
      id: "demo-english-6",
      section: "english",
      domain: "Craft and Structure",
      stem: "The author's tone could best be described as:",
      options: [
        { key: "A", text: " Angry and confrontational" },
        { key: "B", text: " Curious and exploratory" },
        { key: "C", text: " Bitter and resentful" },
        { key: "D", text: " Indifferent and neutral" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "The author asks questions and shows interest in discovering new perspectives"
    },
    {
      id: "demo-math-7",
      section: "math",
      domain: "Geometry",
      stem: "A triangle has sides 3, 4, and 5. What type of triangle is it?",
      options: [
        { key: "A", text: " Equilateral" },
        { key: "B", text: " Isosceles" },
        { key: "C", text: " Right" },
        { key: "D", text: " Obtuse" }
      ],
      correctAnswer: "C",
      type: "mc",
      explanation: "3² + 4² = 9², so it satisfies the Pythagorean theorem - it's a right triangle"
    },
    {
      id: "demo-english-7",
      section: "english",
      domain: "Command of Evidence",
      stem: "Which detail best supports the main idea?",
      options: [
        { key: "A", text: " The author's birth year" },
        { key: "B", text: " Statistical evidence from studies" },
        { key: "C", text: " A friend's personal story" },
        { key: "D", text: " The weather that day" }
      ],
      correctAnswer: "B",
      type: "mc",
      explanation: "Statistical evidence provides concrete support for the main argument"
    }
  ];

  let questions = [];
  let loadState = "loading"; // loading | success | empty | error
  let loadError = "";

  const state = {
    currentIndex: 0,
    answers: {},
    checked: {},
    reviewed: {},
    // Stopwatch state
    stopwatchElapsed: 0,
    isPaused: false,
    isHidden: false,
    // Calculator state
    calcActive: false, // hidden by default until Math question
    userToggledCalc: false,
    lastDesmosWidth: '50%' // for desktop  persistence
  };

  // DOM Elements
  const playerTitle = document.getElementById("playerTitle");
  const playerCounter = document.getElementById("playerCounter");
  const playerTimer = document.getElementById("playerTimer");
  const clockIcon = document.getElementById("clockIcon");
  const questionNumberEl = document.getElementById("questionNumber");
  
  const playerSplit = document.getElementById("playerSplit");
  const desmosWrapper = document.getElementById("desmosWrapper");
  const desmosContainer = document.getElementById("desmosContainer");
  const contentWrapper = document.getElementById("contentWrapper");
  const resizeHandle = document.getElementById("resize-handle");

  const questionDomain = document.getElementById("questionDomain");
  const questionStemTitle = document.getElementById("questionStemTitle");
  const questionParagraph = document.getElementById("questionParagraph");
  const questionStem = document.getElementById("questionStem");
  const answerChoices = document.getElementById("answerChoices");
  const feedbackPanel = document.getElementById("feedbackPanel");
  const reviewBadge = document.getElementById("reviewBadge");
  
  const prevQuestionBtn = document.getElementById("prevQuestionBtn");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const checkAnswerBtn = document.getElementById("checkAnswerBtn");
  const referenceBtn = document.getElementById("referenceBtn");
  const markReviewBtn = document.getElementById("markReviewBtn");
  const toggleCalcBtn = document.getElementById("toggleCalcBtn");
  const showExplanationBtn = document.getElementById("showExplanationBtn");

  // Stopwatch elements
  const pauseStopwatchBtn = document.getElementById("pauseStopwatchBtn");
  const pauseIcon = document.getElementById("pauseIcon");
  const playIcon = document.getElementById("playIcon");
  const hideStopwatchBtn = document.getElementById("hideStopwatchBtn");

  // Modal elements
  const sessionInfoBtn = document.getElementById("sessionInfoBtn");
  const sessionInfoModal = document.getElementById("sessionInfoModal");
  const modalSection = document.getElementById("modalSection");
  const modalDomains = document.getElementById("modalDomains");

  // Reference panel
  const referencePanel = document.getElementById("referencePanel");

  let explanationForcedOpen = false;
  let stopwatchInterval = null;
  let desmosInstance = null;
  let resizeHandleInitialized = false;

  // Normalize SPR answers for comparison: trim, lowercase, fix leading decimal (e.g. ".75" → "0.75")
  function normalizeSprAnswer(val) {
    if (!val) return "";
    return String(val).trim().toLowerCase().replace(/^(-?)\./, "$10.");
  }

  // Helper — always call this instead of setting playerCounter.textContent directly
  function setCounterText(text) {
    const el = document.getElementById('qNavCounterText');
    if (el) el.textContent = text;
  }

  function getSectionLabel(sectionKey) {
    const section = OPENSAT_CATALOG?.sections?.find((s) => s.key === sectionKey);
    return section?.label || sectionKey || "SAT";
  }

  function getCurrentQuestion() {
    return questions[state.currentIndex];
  }

  // RESTORED: Helper function from old version
  function getSectionsLabel(sectionKeys) {
    if (!Array.isArray(sectionKeys)) return sectionKeys || "SAT";
    if (sectionKeys.length === 0) return "SAT";
    if (sectionKeys.length === 1) {
      return getSectionLabel(sectionKeys[0]);
    }
    if (sectionKeys.length === 2 && sectionKeys.includes("english") && sectionKeys.includes("math")) {
      return "All sections";
    }
    return `${sectionKeys.length} sections`;
  }

  function renderHeader() {
    const sections = query.sections;
    const sectionLabel = getSectionsLabel(sections);

    if (loadState === "loading") {
      if (playerTitle) playerTitle.textContent = "Loading questions…";
      setCounterText('Question 0 of 0');
    } else if (loadState === "error") {
      if (playerTitle) playerTitle.textContent = "Could not load questions";
      setCounterText('Question 0 of 0');
    } else if (loadState === "empty") {
      if (playerTitle) playerTitle.textContent = "No matching questions";
      setCounterText('Question 0 of 0');
    } else {
      if (playerTitle) playerTitle.textContent = sectionLabel;
      setCounterText(`Question ${state.currentIndex + 1} of ${questions.length}`);
    }
  }

  // DESMOS MANAGEMENT
  function initDesmos() {
    if (!desmosContainer) return;
    if (!desmosInstance) {
      // Mirror math-chat.js options exactly
      desmosInstance = Desmos.GraphingCalculator(desmosContainer, {
        keypad: true,
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
        expressionsTopbar: true,
        pointsOfInterest: true,
        trace: true,
        border: false,
        lockViewport: false
      });
      console.log("SAT Player: Desmos Initialized");
    } else {
      desmosInstance.resize();
    }
  }

  function destroyDesmos() {
    if (desmosInstance) {
      desmosInstance.destroy();
      desmosInstance = null;
      if (desmosContainer) desmosContainer.innerHTML = '';
      console.log("SAT Player: Desmos Destroyed");
    }
  }

  /**
   * Toggles the split layout (Panel A + Handle + Panel B).
   * @param {boolean} show - whether to show Desmos
   */
  function applyCalcLayout(show) {
    if (!playerSplit || !desmosWrapper || !resizeHandle) return;

    if (show) {
      playerSplit.classList.add("has-desmos");
      desmosWrapper.style.display = "flex";
      // Resize handle visibility is controlled by CSS media query only — no inline style here
      if (window.innerWidth > 900) {
        // Clear any stale mobile inline height overrides
        desmosWrapper.style.flex = '';
        desmosWrapper.style.height = '';
        desmosWrapper.style.maxHeight = '';
        playerSplit.style.gridTemplateColumns = `${state.lastDesmosWidth} 0.5rem 1fr`;
      }
      initDesmos();
    } else {
      playerSplit.classList.remove("has-desmos");
      desmosWrapper.style.display = "none";
      // Resize handle visibility is controlled by CSS media query only — no inline style here
      playerSplit.style.gridTemplateColumns = ""; // reset grid
      destroyDesmos();
    }
  }

  function renderQuestion() {
    const current = getCurrentQuestion();

    // RESTORED: Loading state with all button disabled
    if (loadState === "loading") {
      if (questionNumberEl) questionNumberEl.textContent = "—";
      questionDomain.textContent = "";
      if (questionStemTitle) {
        questionStemTitle.textContent = "Loading questions…";
        questionStemTitle.classList.remove("is-hidden");
      }
      questionParagraph.textContent = "Fetching your OpenSAT session from Korah.";
      questionParagraph.classList.remove("is-hidden");
      questionStem.textContent = "";
      answerChoices.innerHTML = "";
      feedbackPanel.className = "sat-feedback-panel is-hidden";
      feedbackPanel.innerHTML = "";
      reviewBadge.classList.add("is-hidden");
      // RESTORED: Button disabled states
      if (prevQuestionBtn) prevQuestionBtn.disabled = true;
      if (nextQuestionBtn) nextQuestionBtn.disabled = true;
      if (checkAnswerBtn) checkAnswerBtn.disabled = true;
      if (toggleCalcBtn) toggleCalcBtn.disabled = true;
      if (showExplanationBtn) showExplanationBtn.disabled = true;
      if (markReviewBtn) markReviewBtn.disabled = true;
      return;
    }

    // RESTORED: Error state with retry button
    if (loadState === "error") {
      if (questionNumberEl) questionNumberEl.textContent = "!";
      questionDomain.textContent = "";
      if (questionStemTitle) {
        questionStemTitle.textContent = "OpenSAT connection issue";
        questionStemTitle.classList.remove("is-hidden");
      }
      questionParagraph.textContent = loadError || "Something went wrong while loading questions.";
      questionParagraph.classList.remove("is-hidden");
      questionStem.textContent = "";
      answerChoices.innerHTML = `
        <button class="sat-button sat-button-primary" type="button" id="retryLoadBtn">Retry</button>
        <a class="sat-button sat-button-ghost" href="./index.html">Back to bank</a>
      `;
      feedbackPanel.className = "sat-feedback-panel is-hidden";
      feedbackPanel.innerHTML = "";
      reviewBadge.classList.add("is-hidden");
      // RESTORED: Button disabled states
      if (prevQuestionBtn) prevQuestionBtn.disabled = true;
      if (nextQuestionBtn) nextQuestionBtn.disabled = true;
      if (checkAnswerBtn) checkAnswerBtn.disabled = true;
      if (toggleCalcBtn) toggleCalcBtn.disabled = true;
      if (showExplanationBtn) showExplanationBtn.disabled = true;
      if (markReviewBtn) markReviewBtn.disabled = true;
      return;
    }

    // RESTORED: Empty state
    if (loadState === "empty") {
      if (questionNumberEl) questionNumberEl.textContent = "—";
      questionDomain.textContent = "";
      if (questionStemTitle) {
        questionStemTitle.textContent = "No questions matched this selection";
        questionStemTitle.classList.remove("is-hidden");
      }
      questionParagraph.textContent = "Try another domain or lower the question limit.";
      questionParagraph.classList.remove("is-hidden");
      questionStem.textContent = "";
      answerChoices.innerHTML = `<a class="sat-button sat-button-primary" href="./index.html">Back to bank</a>`;
      feedbackPanel.className = "sat-feedback-panel is-hidden";
      feedbackPanel.innerHTML = "";
      reviewBadge.classList.add("is-hidden");
      // RESTORED: Button disabled states
      if (prevQuestionBtn) prevQuestionBtn.disabled = true;
      if (nextQuestionBtn) nextQuestionBtn.disabled = true;
      if (checkAnswerBtn) checkAnswerBtn.disabled = true;
      if (toggleCalcBtn) toggleCalcBtn.disabled = true;
      if (showExplanationBtn) showExplanationBtn.disabled = true;
      if (markReviewBtn) markReviewBtn.disabled = true;
      return;
    }

    // RESTORED: Fallback if current is undefined but we have questions
    if (!current) {
      loadState = questions.length ? "success" : "empty";
      renderHeader();
      renderQuestion();
      return;
    }

    const selectedAnswer = state.answers[current.id];
    const checked = Boolean(state.checked[current.id]);
    const showExplanation = checked || explanationForcedOpen;

    // MATH SPLIT LAYOUT
    const isMath = current.section === "math";

    // Auto-enable calc if Math question and not manually toggled off
    if (isMath && !state.userToggledCalc) {
      state.calcActive = true;
    } else if (!isMath) {
      state.calcActive = false;
    }

    applyCalcLayout(state.calcActive);

    // Question number display
    if (questionNumberEl) questionNumberEl.textContent = state.currentIndex + 1;
    questionDomain.textContent = current.domain;
    if (questionStemTitle) {
      questionStemTitle.textContent = "";
      questionStemTitle.classList.add("is-hidden");
    }
    if (current.paragraph) {
      questionParagraph.innerHTML = current.paragraph;
      questionParagraph.classList.remove("is-hidden");
    } else {
      questionParagraph.innerHTML = "";
      questionParagraph.classList.add("is-hidden");
    }
    questionStem.innerHTML = current.stem;
    reviewBadge.classList.toggle("is-hidden", !state.reviewed[current.id]);

    // Toggle calc button text + visibility
    if (toggleCalcBtn) {
      toggleCalcBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>
      </svg>`;
      toggleCalcBtn.disabled = current.section !== "math";
      toggleCalcBtn.classList.toggle("is-hidden", current.section !== "math");
      toggleCalcBtn.classList.toggle("is-active", state.calcActive);
    }

    // Show reference button only for math
    if (referenceBtn) {
      referenceBtn.classList.toggle("is-hidden", !isMath);
    }

    // Update More dropdown for section
    if (typeof updateDropdownForSection === "function") {
      updateDropdownForSection();
    }

    const isSpr = current.type === "spr";
    const isCorrect = isSpr
      ? normalizeSprAnswer(selectedAnswer) === normalizeSprAnswer(current.correctAnswer)
      : selectedAnswer === current.correctAnswer;

    if (isSpr) {
      const safeVal = selectedAnswer ? String(selectedAnswer).replace(/&/g, "&amp;").replace(/"/g, "&quot;") : "";
      const inputClass = checked ? (isCorrect ? " is-correct" : " is-incorrect") : "";
      answerChoices.innerHTML = `
        <div class="sat-spr-wrap">
          <label class="sat-spr-label" for="sprInput">Enter your answer</label>
          <input
            id="sprInput"
            class="sat-spr-input${inputClass}"
            type="text"
            placeholder="Type a number or expression"
            value="${safeVal}"
            ${checked ? "readonly" : ""}
            autocomplete="off"
            autocorrect="off"
            spellcheck="false"
          />
        </div>
      `;
    } else {
      answerChoices.innerHTML = current.options
        .map((option) => {
          const classNames = ["sat-answer-choice"];
          if (selectedAnswer === option.key) {
            classNames.push("is-selected");
          }
          if (checked && option.key === current.correctAnswer) {
            classNames.push("is-correct");
          } else if (checked && selectedAnswer === option.key && option.key !== current.correctAnswer) {
            classNames.push("is-incorrect");
          }
          return `
            <button class="${classNames.join(" ")}" type="button" data-answer="${option.key}">
              <span class="sat-answer-key">${option.key}</span>${option.text}
            </button>
          `;
        })
        .join("");
    }

    if (showExplanation) {
      feedbackPanel.className = `sat-feedback-panel ${isCorrect ? "is-correct" : "is-incorrect"}`;
      feedbackPanel.innerHTML = `
        <strong>${checked ? (isCorrect ? "Correct." : `Correct answer: ${current.correctAnswer}.`) : "Explanation preview."}</strong>
        <p>${current.explanation}</p>
      `;
      feedbackPanel.classList.remove("is-hidden");
    } else {
      feedbackPanel.className = "sat-feedback-panel is-hidden";
      feedbackPanel.innerHTML = "";
    }

    // Button states - hide/show and text
    if (prevQuestionBtn) {
      prevQuestionBtn.style.display = state.currentIndex === 0 ? 'none' : '';
      prevQuestionBtn.disabled = false;
    }
    if (nextQuestionBtn) {
      const isLastQuestion = state.currentIndex === questions.length - 1;
      nextQuestionBtn.disabled = false;
      if (isLastQuestion) {
        nextQuestionBtn.innerHTML = `Back to Bank`;
      } else {
        nextQuestionBtn.innerHTML = `Next<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-left: 6px;"><polyline points="9 18 15 12 9 6"/></svg>`;
      }
    }
    if (checkAnswerBtn) checkAnswerBtn.disabled = isSpr ? (!selectedAnswer || !String(selectedAnswer).trim()) : !selectedAnswer;
    if (showExplanationBtn) showExplanationBtn.disabled = false;
    if (markReviewBtn) markReviewBtn.disabled = false;
    
    // Button text and active states
    if (showExplanationBtn) {
      showExplanationBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`;
      showExplanationBtn.classList.toggle("is-active", explanationForcedOpen);
    }
    if (markReviewBtn) markReviewBtn.classList.toggle("is-active", !!state.reviewed[current.id]);

    if (window.qNav) window.qNav.refresh();
  }

  // NEW: Stopwatch functions (replaces old 32min timer)
  function startStopwatch() {
    state.stopwatchElapsed = 0;
    updateStopwatchDisplay();
    if (stopwatchInterval) clearInterval(stopwatchInterval);
    
    stopwatchInterval = setInterval(() => {
      if (!state.isPaused) {
        state.stopwatchElapsed++;
        updateStopwatchDisplay();
      }
    }, 1000);
  }

  function updateStopwatchDisplay() {
    if (!playerTimer || !clockIcon) return;
    if (state.isHidden) {
      playerTimer.classList.add("is-hidden");
      clockIcon.classList.remove("is-hidden");
    } else {
      playerTimer.classList.remove("is-hidden");
      clockIcon.classList.add("is-hidden");
      const m = String(Math.floor(state.stopwatchElapsed / 60)).padStart(2, "0");
      const s = String(state.stopwatchElapsed % 60).padStart(2, "0");
      playerTimer.textContent = `${m}:${s}`;
    }
  }

  function goTo(index) {
    state.currentIndex = index;
    explanationForcedOpen = false;
    // NEW: Reset stopwatch on navigation
    startStopwatch();
    
    // Clean up Desmos before moving
    destroyDesmos();

    renderHeader();
    renderQuestion();
    if (window.qNav) window.qNav.refresh();
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // NEW: Session modal population
  function populateSessionModal() {
    const sections = query.sections;
    if (modalSection) modalSection.textContent = getSectionsLabel(sections);
    
    const domains = query.domains;
    if (modalDomains) {
      if (Array.isArray(domains) && domains.length > 0 && !domains.includes("any")) {
        modalDomains.innerHTML = domains.map(d => `<span class="domain-tag">${d}</span>`).join("");
      } else {
        modalDomains.innerHTML = `<span style="opacity: 0.6; font-style: italic;">All domains selected</span>`;
      }
    }
  }

  /**
   * Universal resize logic for desktop (columns) and mobile (rows).
   * Mirrors math-chat.js exactly.
   */
  function initResizeHandle() {
    if (resizeHandleInitialized) return;
    const handle = document.getElementById("resize-handle");
    const layout = document.getElementById("playerSplit");
    const desmosWrap = document.getElementById("desmosWrapper");
    const contentPanel = document.getElementById("contentWrapper");

    if (!handle || !layout || !desmosWrap) return;

    let isResizing = false;
    let currentBreakpoint = window.innerWidth <= 900 ? "mobile" : "desktop";

    handle.addEventListener("mousedown", (e) => {
      isResizing = true;
      currentBreakpoint = window.innerWidth <= 900 ? "mobile" : "desktop";
      document.body.style.cursor = currentBreakpoint === "mobile" ? "row-resize" : "col-resize";
      document.body.classList.add("is-resizing");
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isResizing) return;

      const rect = layout.getBoundingClientRect();
      const breakpoint = window.innerWidth <= 900 ? "mobile" : "desktop";

      if (breakpoint === "mobile") {
        // MOBILE: vertical resize (Panel A height)
        const relativeY = e.clientY - rect.top;
        const totalHeight = rect.height;
        // Clamp: Panel A cannot be smaller than 130px OR larger than (Total - 130px)
        const minContentHeight = 130; 
        if (relativeY > minContentHeight && relativeY < totalHeight - minContentHeight) {
          const heightPx = relativeY;
          desmosWrap.style.flex = `0 0 ${heightPx}px`;
          desmosWrap.style.height = `${heightPx}px`;
          desmosWrap.style.maxHeight = `${heightPx}px`;
          // Set content panel to remaining height
          const handleHeight = 12; // px for the resize handle
          const contentHeight = totalHeight - heightPx - handleHeight;
          if (contentPanel) {
            contentPanel.style.height = `${contentHeight}px`;
            contentPanel.style.flex = 'none';
          }
        }
      } else {
        // DESKTOP: horizontal resize (Panel A width)
        const relativeX = e.clientX - rect.left;
        const totalWidth = rect.width;
        if (relativeX > 200 && relativeX < totalWidth - 200) {
          const percentage = (relativeX / totalWidth) * 100;
          state.lastDesmosWidth = `${percentage}%`;
          layout.style.gridTemplateColumns = `${state.lastDesmosWidth} 0.5rem 1fr`;
        }
      }

      if (desmosInstance) {
        requestAnimationFrame(() => desmosInstance.resize());
      }
    });

    document.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = "default";
        document.body.classList.remove("is-resizing");
      }
    });

    // Reset mobile drag-set heights when window returns to desktop
    window.addEventListener('resize', () => {
      const newBreakpoint = window.innerWidth <= 900 ? "mobile" : "desktop";
      if (currentBreakpoint === "mobile" && newBreakpoint === "desktop") {
        // Clear any mobile inline height overrides on the Desmos wrapper
        desmosWrap.style.flex = '';
        desmosWrap.style.height = '';
        desmosWrap.style.maxHeight = '';
        // Clear content panel height override
        if (contentPanel) {
          contentPanel.style.height = '';
          contentPanel.style.flex = '';
        }
        // Restore desktop grid if Desmos is active
        if (layout.classList.contains('has-desmos')) {
          layout.style.gridTemplateColumns = `${state.lastDesmosWidth} 0.5rem 1fr`;
        }
        // Tell Desmos to reflow
        if (desmosInstance) desmosInstance.resize();
      }
      currentBreakpoint = newBreakpoint;
    });

    resizeHandleInitialized = true;
    console.log("SAT Player: Resize handle initialized");
  }

  // Event Listeners
  answerChoices.addEventListener("click", (event) => {
    // Retry button logic
    const retry = event.target.closest("#retryLoadBtn");
    if (retry) {
      void loadQuestions();
      return;
    }

    const choice = event.target.closest("[data-answer]");
    if (!choice) {
      return;
    }
    const current = getCurrentQuestion();
    state.answers[current.id] = choice.dataset.answer;
    renderQuestion();
  });

  // SPR: capture keystrokes without destroying the input on every keystroke
  answerChoices.addEventListener("input", (event) => {
    const input = event.target.closest("#sprInput");
    if (!input) return;
    const current = getCurrentQuestion();
    if (!current || current.type !== "spr") return;
    state.answers[current.id] = input.value;
    if (checkAnswerBtn) checkAnswerBtn.disabled = !input.value || !input.value.trim();
  });

  prevQuestionBtn.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      goTo(state.currentIndex - 1);
    }
  });

  nextQuestionBtn.addEventListener("click", () => {
    if (state.currentIndex === questions.length - 1) {
      window.location.href = "./index.html";
    } else if (state.currentIndex < questions.length - 1) {
      goTo(state.currentIndex + 1);
    }
  });

  checkAnswerBtn.addEventListener("click", () => {
    const current = getCurrentQuestion();
    if (!current) {
      return;
    }
    if (!state.answers[current.id]) {
      return;
    }
    state.checked[current.id] = true;
    renderQuestion();
    if (window.qNav) window.qNav.refresh();
  });

  showExplanationBtn.addEventListener("click", () => {
    explanationForcedOpen = !explanationForcedOpen;
    renderQuestion();
  });

  markReviewBtn.addEventListener("click", () => {
    const current = getCurrentQuestion();
    if (!current) {
      return;
    }
    state.reviewed[current.id] = !state.reviewed[current.id];
    renderQuestion();
    if (window.qNav) window.qNav.refresh();
  });

  // Reference panel toggle
  referenceBtn.addEventListener("click", () => {
    const isHidden = referencePanel.classList.toggle("is-hidden");
    referenceBtn.classList.toggle("is-active", !isHidden);
  });

  toggleCalcBtn.addEventListener("click", () => {
    const current = getCurrentQuestion();
    if (!current || current.section !== "math") {
      return;
    }
    state.userToggledCalc = true;
    state.calcActive = !state.calcActive;
    renderQuestion();
  });

  // Stopwatch event listeners
  pauseStopwatchBtn.addEventListener("click", () => {
    state.isPaused = !state.isPaused;
    pauseStopwatchBtn.classList.toggle("is-active", state.isPaused);
    pauseIcon.classList.toggle("is-hidden", state.isPaused);
    playIcon.classList.toggle("is-hidden", !state.isPaused);
  });

  hideStopwatchBtn.addEventListener("click", () => {
    state.isHidden = !state.isHidden;
    hideStopwatchBtn.classList.toggle("is-active", state.isHidden);
    updateStopwatchDisplay();
  });

  // Session modal event listeners
  sessionInfoBtn.addEventListener("click", () => {
    populateSessionModal();
    if (sessionInfoModal) sessionInfoModal.style.display = "flex";
  });

  sessionInfoModal.addEventListener("click", (e) => {
    if (e.target === sessionInfoModal && sessionInfoModal) {
      sessionInfoModal.style.display = "none";
    }
  });

  // RESTORED: loadQuestions with full validation
  async function loadQuestions() {
    const sections = query.sections;
    const isValidSection = Array.isArray(sections) && sections.length > 0;
    if (!isValidSection) {
      loadState = "error";
      loadError = "This practice link is missing a valid section. Go back to the bank and start a new session.";
      questions = [];
      state.currentIndex = 0;
      explanationForcedOpen = false;
      renderHeader();
      renderQuestion();
      return;
    }

    loadState = "loading";
    loadError = "";
    questions = [];
    state.currentIndex = 0;
    explanationForcedOpen = false;
    renderHeader();
    renderQuestion();

    // LIVE API MODE
    const params = new URLSearchParams();
    const sectionValue = sections.length === 2 && sections.includes("english") && sections.includes("math")
      ? "any"
      : sections.join(",");
    params.set("sections", sectionValue);
    const domainValue = Array.isArray(query.domains) && query.domains.length > 0 && !query.domains.includes("any")
      ? query.domains.join(",")
      : "any";
    params.set("domains", domainValue);
    if (query.limit !== null && query.limit !== undefined) {
      params.set("limit", String(query.limit));
    }

    let response;
    try {
      response = await fetch(`/api/sat/questions?${params.toString()}`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
    } catch (err) {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal) {
        questions = DEMO_QUESTIONS;
        loadState = questions.length ? "success" : "empty";
        state.currentIndex = 0;
        startStopwatch();
        renderHeader();
        renderQuestion();
        initResizeHandle();
        return;
      }
      loadState = "error";
      loadError = "Could not reach the Korah SAT adapter.";
      console.error(err);
      renderHeader();
      renderQuestion();
      return;
    }

    if (!response.ok) {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      if (isLocal) {
        questions = DEMO_QUESTIONS;
        loadState = questions.length ? "success" : "empty";
        state.currentIndex = 0;
        startStopwatch();
        renderHeader();
        renderQuestion();
        initResizeHandle();
        return;
      }
      loadState = "error";
      loadError = `Adapter error (${response.status}).`;
      renderHeader();
      renderQuestion();
      return;
    }

    let payload;
    try {
      payload = await response.json();
    } catch (err) {
      loadState = "error";
      loadError = "Adapter returned invalid JSON.";
      console.error(err);
      renderHeader();
      renderQuestion();
      return;
    }

    questions = Array.isArray(payload?.questions) ? payload.questions : [];
    loadState = questions.length ? "success" : "empty";
    state.currentIndex = 0;
    startStopwatch();
    renderHeader();
    renderQuestion();
    
    // Initialize resize handle
    initResizeHandle();

    if (window.qNav) window.qNav.refresh();
  }

/**
    * Makes an element resizable from all edges (edge detection, no visible handles).
    * Also makes the entire element draggable from anywhere.
    * @param {HTMLElement} el
    */
  function makeResizable(el) {
    if (!el) return;
    el.style.position = 'fixed';
    el.style.overflow = 'hidden';
    
    const dragThreshold = 24;
    let isDragging = false;
    let isResizing = false;
    let resizeFrom = null;
    let startX = 0, startY = 0;
    let startWidth = 0, startHeight = 0, startLeft = 0, startTop = 0;
    // No mobile check - resize works at all screen sizes

    // Reset position when transitioning to small screens
    window.addEventListener('resize', () => {
      // Reset position when window gets very small
      if (window.innerWidth < 400) {
        el.style.bottom = '';
        el.style.top = '0';
        el.style.left = '0';
        el.style.right = '';
      }
    });

    // Cursor based on position
    const getCursor = (x, y) => {
      if (!el) return 'default';
      const rect = el.getBoundingClientRect();
      const fromBottom = rect.bottom - y < dragThreshold;
      const fromLeft = x - rect.left < dragThreshold;
      const fromRight = rect.right - x < dragThreshold;
      const midX = rect.left + rect.width / 2;

      // Corners
      if (fromBottom && fromLeft) return 'sw-resize';
      if (fromBottom && fromRight) return 'se-resize';
      // Bottom edge - 50/50 split
      if (fromBottom) {
        return x < midX ? 's-left' : 's-right';
      }
      // Left/Right edges
      if (fromLeft) return 'w-resize';
      if (fromRight) return 'e-resize';
      return 'grab';
    };

    // Check if collapsed
    const isCollapsed = () => el.classList.contains('collapsed');

    el.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      
      startX = e.clientX;
      startY = e.clientY;
      startWidth = el.offsetWidth;
      startHeight = el.offsetHeight;
      startLeft = parseFloat(el.style.left) || el.offsetLeft;
      startTop = parseFloat(el.style.top) || el.offsetTop;

      // Allow dragging and resizing at all screen sizes
      const cursor = getCursor(e.clientX, e.clientY);
      if (cursor === 'grab' || isCollapsed()) {
        isDragging = true;
      } else {
        isResizing = true;
        resizeFrom = cursor;
      }
      
      const finalCursor = cursor === 'grab' ? 'grabbing' : cursor;
      document.body.style.userSelect = 'none';
      document.body.style.cursor = finalCursor;
    });

    document.addEventListener('mousemove', (e) => {
      el.style.cursor = getCursor(e.clientX, e.clientY);
      if (!isDragging && !isResizing) return;

      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const maxLeft = window.innerWidth - el.offsetWidth;
        const maxTop = window.innerHeight - el.offsetHeight;
        el.style.left = Math.max(0, Math.min(maxLeft, startLeft + dx)) + 'px';
        el.style.top = Math.max(0, Math.min(maxTop, startTop + dy)) + 'px';
        el.style.bottom = '';
      } else if (isResizing) {
        const dx = e.clientX - startX;
        const minW = 320;
        // Scale with window: Desktop (>1000px) cap at 850px (53rem), Mobile (≤1000px): window - 10rem (160px)
        const maxW = window.innerWidth > 1000 ? 850 : window.innerWidth - 160;

        // Right edge - pull left shrinks, pull right grows
        if (resizeFrom === 'e-resize') {
          const newW = Math.min(maxW, Math.max(minW, startWidth + dx));
          el.style.width = newW + 'px';
          el.style.height = 'auto';
        }
        // Left edge - pull right shrinks, pull left grows
        if (resizeFrom === 'w-resize') {
          const newW = Math.min(maxW, Math.max(minW, startWidth - dx));
          el.style.left = startLeft + (startWidth - newW);
          el.style.width = newW + 'px';
          el.style.height = 'auto';
        }
        // Bottom edge right half - grows like right edge
        if (resizeFrom === 's-right') {
          const newW = Math.min(maxW, Math.max(minW, startWidth + dx));
          el.style.width = newW + 'px';
          el.style.height = 'auto';
        }
        // Bottom edge left half - grows like left edge
        if (resizeFrom === 's-left') {
          const newW = Math.min(maxW, Math.max(minW, startWidth - dx));
          el.style.left = startLeft + (startWidth - newW);
          el.style.width = newW + 'px';
          el.style.height = 'auto';
        }
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      isResizing = false;
      resizeFrom = null;
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    });
  }

  // Initialize reference panel (draggable + resizable combined)
  if (referencePanel) {
    makeResizable(referencePanel);
  }

  // ─────────────────────────────────────────────────
  // QUESTION NAVIGATOR
  // ─────────────────────────────────────────────────
  (function initQNav() {
    const panel   = document.getElementById('qNavPanel');
    const trigger = document.getElementById('playerCounter');
    const grid    = document.getElementById('qNavGrid');
    const stats   = document.getElementById('qNavStats');

    if (!panel || !trigger || !grid || !stats) return;

    let isOpen = false;

    // ── viewport mode detection ───────────────────────────────
    // Returns true when the panel should render as a bottom sheet
    // (mobile portrait). Must match the CSS @media (max-width: 480px) breakpoint.
    function isMobileViewport() {
      return window.innerWidth <= 480;
    }

    // ── position the panel above the trigger button ───────────────────────
    // MODIFIED FROM ORIGINAL + MODIFICATION 3:
    //
    // On mobile (≤ 480px): skip all JS positioning entirely. The CSS
    // @media (max-width: 480px) block overrides position/width/transform
    // with !important, turning the panel into a full-width bottom sheet.
    //
    // On tablet/desktop (> 480px): read the trigger's bounding rect and
    // float the panel as a compact popover centered above it. Horizontal
    // clamping ensures the card never overflows either viewport edge regardless
    // of where the trigger button sits (important on smaller tablets where the
    // footer layout may push the counter near an edge).
    function positionPanel() {
      if (isMobileViewport()) {
        // Clear any stale inline custom properties from a previous popover
        // positioning so they don't interfere with the CSS !important overrides.
        panel.style.removeProperty('--q-nav-bottom');
        panel.style.removeProperty('--q-nav-left');
        return;
      }

      const rect       = trigger.getBoundingClientRect();
      const GAP        = 10;   // px gap between panel bottom edge and trigger top
      const EDGE_MARGIN = 12;  // minimum px from either viewport edge

      // Vertical: distance from viewport bottom to trigger top, plus gap
      const panelBottom = window.innerHeight - rect.top + GAP;

      // Horizontal: derive actual rendered panel width from CSS
      // (falls back to 420 if panel not yet painted, matches base CSS min())
      const panelWidth = panel.offsetWidth || Math.min(420, window.innerWidth - 32);
      const halfW      = panelWidth / 2;

      // Center on the trigger midpoint, then clamp so neither edge clips
      let centerX = rect.left + rect.width / 2;
      centerX = Math.max(
        halfW + EDGE_MARGIN,
        Math.min(centerX, window.innerWidth - halfW - EDGE_MARGIN)
      );

      panel.style.setProperty('--q-nav-bottom', `${panelBottom}px`);
      panel.style.setProperty('--q-nav-left',   `${centerX}px`);
    }

    // ── open / close ──────────────────────────────
    function openNav() {
      isOpen = true;
      refresh();           // always refresh before showing so state is current
      positionPanel();     // compute position relative to trigger
      panel.classList.add('is-open');
      panel.setAttribute('aria-hidden', 'false');
      trigger.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      setPillTabIndex(true);
      // Focus the current-question pill after the slide animation settles
      setTimeout(() => {
        const current = grid.querySelector('.q-pill.is-current') || grid.querySelector('.q-pill');
        if (current) current.focus();
      }, 280);
    }

    function closeNav(returnFocus = true) {
      isOpen = false;
      panel.classList.remove('is-open');
      panel.setAttribute('aria-hidden', 'true');
      trigger.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
      setPillTabIndex(false);
      if (returnFocus) trigger.focus();
    }

    function toggleNav() {
      isOpen ? closeNav() : openNav();
    }

    function setPillTabIndex(enabled) {
      grid.querySelectorAll('.q-pill').forEach(p =>
        p.setAttribute('tabindex', enabled ? '0' : '-1')
      );
    }

    // ── derive per-question state ─────────────────
    // Returns one of: 'unanswered' | 'attempted' | 'correct' | 'incorrect'
    // Plus a separate boolean `flagged`.
    function getPillState(q, i) {
      const answered  = state.answers[q.id];
      const checked   = Boolean(state.checked[q.id]);
      const flagged   = Boolean(state.reviewed[q.id]);
      const isCurrent = i === state.currentIndex;

      let status;
      if (!answered) {
        status = 'unanswered';
      } else if (!checked) {
        status = 'attempted';
      } else {
        const isCorrect = q.type === 'spr'
          ? normalizeSprAnswer(answered) === normalizeSprAnswer(q.correctAnswer)
          : answered === q.correctAnswer;
        status = isCorrect ? 'correct' : 'incorrect';
      }

      return { status, flagged, isCurrent };
    }

    // NOTE: pillIcon() from the original plan has been removed entirely.
    // Pills always show their question number. State is colour-only (plus bookmark icon).

    const bookmarkIcon = `
      <span class="q-pill-flag">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
        </svg>
      </span>
    `;

    // ── rebuild or update the grid ────────────────
    function refresh() {
      if (!questions || !questions.length) return;

      // Build compact legend HTML for top row
      stats.innerHTML = `
        <div class="q-stat-item">
          <div class="q-legend-icon-correct"><span class="material-icons-round">check</span></div>Correct
        </div>
        <div class="q-stat-item">
          <div class="q-legend-icon-incorrect"><span class="material-icons-round">close</span></div>Incorrect
        </div>
        <div class="q-stat-item">
          <div class="q-legend-icon-flag">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
            </svg>
          </div>Flagged
        </div>
        <div class="q-stat-item">
          <div class="q-legend-icon-attempted"></div>Attempted
        </div>
        <span class="q-stat-total">${questions.length} total</span>
      `;

      // Build pills — create DOM nodes on first render, update classes on subsequent calls
      const existingPills = grid.querySelectorAll('.q-pill');
      const needsRebuild  = existingPills.length !== questions.length;

      if (needsRebuild) {
        grid.innerHTML = '';
        questions.forEach((q, i) => {
          const btn = document.createElement('button');
          btn.setAttribute('role', 'listitem');
          btn.setAttribute('tabindex', '-1');
          btn.className = 'q-pill';
          btn.addEventListener('click', () => {
            goTo(i);
            closeNav(false);
          });
          grid.appendChild(btn);
        });
      }

      // Update every pill's classes, ARIA label, and inner content
      grid.querySelectorAll('.q-pill').forEach((pill, i) => {
        const q = questions[i];
        if (!q) return;
        const { status, flagged, isCurrent } = getPillState(q, i);

        pill.className = [
          'q-pill',
          `is-${status}`,
          isCurrent ? 'is-current' : '',
        ].filter(Boolean).join(' ');

        pill.setAttribute('aria-label',
          `Question ${i + 1}` +
          (isCurrent ? ', current' : '') +
          (status !== 'unanswered' ? `, ${status}` : ', unanswered') +
          (flagged ? ', flagged for review' : '')
        );

        // Render question number and bookmark icon if flagged
        pill.innerHTML = String(i + 1) + (flagged ? bookmarkIcon : '');
      });
    }

    // ── keyboard handling ─────────────────────────
    document.addEventListener('keydown', e => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        closeNav();
        return;
      }

      if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(e.key)) {
        e.preventDefault();
        const pills = [...grid.querySelectorAll('.q-pill')];
        const cols  = Math.max(1, Math.round(grid.offsetWidth / ((pills[0]?.offsetWidth || 44) + 8)));
        const idx   = pills.indexOf(document.activeElement);

        let next = idx;
        if (e.key === 'ArrowRight') next = Math.min(idx + 1, pills.length - 1);
        if (e.key === 'ArrowLeft')  next = Math.max(idx - 1, 0);
        if (e.key === 'ArrowDown')  next = Math.min(idx + cols, pills.length - 1);
        if (e.key === 'ArrowUp')    next = Math.max(idx - cols, 0);
        if (e.key === 'Home')       next = 0;
        if (e.key === 'End')        next = pills.length - 1;

        pills[next]?.focus();
        return;
      }

      if (e.key === 'Tab') {
        const pills  = [...grid.querySelectorAll('.q-pill')];
        const first  = pills[0];
        const last   = pills[pills.length - 1];
        const active = document.activeElement;

        if (e.shiftKey && active === first) {
          e.preventDefault(); trigger.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault(); trigger.focus();
        } else if (!e.shiftKey && active === trigger) {
          e.preventDefault(); first?.focus();
        }
      }
    });

    // Reposition panel if window is resized while open
    window.addEventListener('resize', () => {
      if (isOpen) positionPanel();
    }, { passive: true });

    // Click outside to close
    document.addEventListener('pointerdown', e => {
      if (isOpen && !panel.contains(e.target) && !trigger.contains(e.target)) {
        closeNav(false);
      }
    });

    // Wire up the trigger
    trigger.addEventListener('click', toggleNav);

    // Expose API so sat-player.js can call qNav.refresh() anywhere
    window.qNav = { refresh, open: openNav, close: closeNav };
  })();
  // ─────────────────────────────────────────────────
  // END QUESTION NAVIGATOR
  // ─────────────────────────────────────────────────

  renderHeader();
  renderQuestion();

  void loadQuestions();
})();

// Defined outside the IIFE so inline onclick can reach it
window.toggleReferenceCollapse = function() {
  const panel = document.getElementById('referencePanel');
  const btn = document.getElementById('referenceCollapseBtn');
  if (!panel || !btn) return;

  const isCollapsed = panel.classList.toggle('collapsed');
  btn.classList.toggle('collapsed', isCollapsed);
  btn.setAttribute('aria-label', isCollapsed ? 'Expand reference sheet' : 'Collapse reference sheet');
};