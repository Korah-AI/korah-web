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
    // NEW: Stopwatch state (replaces fixed 32min timer)
    stopwatchElapsed: 0,
    isPaused: false,
    isHidden: false,
    // NEW: Calculator state
    calcActive: true,
    userToggledCalc: false
  };

  // DOM Elements - Original + New Elements
  const playerTitle = document.getElementById("playerTitle");
  const playerCounter = document.getElementById("playerCounter");
  const playerTimer = document.getElementById("playerTimer");
  const clockIcon = document.getElementById("clockIcon");
  const questionNumberEl = document.getElementById("questionNumber");
  
  const questionLayout = document.getElementById("questionLayout");
  const desmosWrapper = document.getElementById("desmosWrapper");
  const desmosContainer = document.getElementById("desmosContainer");

  const questionDomain = document.getElementById("questionDomain");
  const questionStemTitle = document.getElementById("questionStemTitle");
  const questionParagraph = document.getElementById("questionParagraph");
  const questionStem = document.getElementById("questionStem");
  const answerChoices = document.getElementById("answerChoices");
  const feedbackPanel = document.getElementById("feedbackPanel");
  const questionNav = document.getElementById("questionNav");
  const reviewBadge = document.getElementById("reviewBadge");
  
  const prevQuestionBtn = document.getElementById("prevQuestionBtn");
  const nextQuestionBtn = document.getElementById("nextQuestionBtn");
  const checkAnswerBtn = document.getElementById("checkAnswerBtn");
  const referenceBtn = document.getElementById("referenceBtn");
  const markReviewBtn = document.getElementById("markReviewBtn");
  const toggleCalcBtn = document.getElementById("toggleCalcBtn");
  const showExplanationBtn = document.getElementById("showExplanationBtn");

  // NEW: Stopwatch elements
  const pauseStopwatchBtn = document.getElementById("pauseStopwatchBtn");
  const pauseIcon = document.getElementById("pauseIcon");
  const playIcon = document.getElementById("playIcon");
  const hideStopwatchBtn = document.getElementById("hideStopwatchBtn");

  // NEW: Modal elements
  const sessionInfoBtn = document.getElementById("sessionInfoBtn");
  const sessionInfoModal = document.getElementById("sessionInfoModal");
  const modalSection = document.getElementById("modalSection");
  const modalDomains = document.getElementById("modalDomains");

  // NEW: Reference panel
  const referencePanel = document.getElementById("referencePanel");

  let explanationForcedOpen = false;
  let stopwatchInterval = null;
  let desmosInstance = null;

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
      playerCounter.textContent = "Question 0 out of 0";
    } else if (loadState === "error") {
      if (playerTitle) playerTitle.textContent = "Could not load questions";
      playerCounter.textContent = "Question 0 out of 0";
    } else if (loadState === "empty") {
      if (playerTitle) playerTitle.textContent = "No matching questions";
      playerCounter.textContent = "Question 0 out of 0";
    } else {
      if (playerTitle) playerTitle.textContent = sectionLabel;
      playerCounter.textContent = `Question ${state.currentIndex + 1} out of ${questions.length}`;
    }
  }

  function renderNav() {
    if (!questionNav || !questions.length) return;
    if (loadState !== "success") {
      questionNav.innerHTML = "";
      return;
    }
    questionNav.innerHTML = questions
      .map((question, index) => {
        const isAnswered = !!state.answers[question.id];
        const classes = [
          "sat-mini-pill",
          index === state.currentIndex ? "is-current" : "",
          state.reviewed[question.id] ? "is-reviewed" : "",
          isAnswered && index !== state.currentIndex ? "is-answered" : ""
        ]
          .filter(Boolean)
          .join(" ");
        return `<button class="${classes}" type="button" data-index="${index}">${index + 1}</button>`;
      })
      .join("");
  }

  // NEW: Desmos calculator initialization
  function initDesmos() {
    if (!desmosContainer) return;
    if (!desmosInstance) {
      desmosInstance = Desmos.GraphingCalculator(desmosContainer, {
        keypad: true,
        expressions: true,
        settingsMenu: false,
        zoomButtons: true,
        expressionsTopbar: true
      });
    }
  }

  // NEW: Reset/desmos calculator
  function resetDesmos() {
    if (desmosInstance) {
      try {
        desmosInstance.destroy();
        desmosInstance = null;
        desmosContainer.innerHTML = '';
      } catch (e) {
        console.log('Desmos destroy error:', e);
      }
    }
  }

  // NEW: Resize desmos to match question container height
  function resizeDesmos() {
    if (desmosWrapper && desmosWrapper.style.display !== "none" && questionLayout) {
      const current = getCurrentQuestion();
      if (current && current.section === "math" && state.calcActive) {
        resetDesmos();
        initDesmos();
        const containerHeight = questionLayout.offsetHeight - 32;
        if (containerHeight > 0) {
          desmosContainer.style.height = containerHeight + "px";
          desmosWrapper.style.height = containerHeight + "px";
          desmosInstance.resize();
        }
      }
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
      renderNav();
      renderQuestion();
      return;
    }

    const selectedAnswer = state.answers[current.id];
    const checked = Boolean(state.checked[current.id]);
    const showExplanation = checked || explanationForcedOpen;

    // NEW: Math split layout handling
    const isMath = current.section === "math";
    // Only auto-show calculator on initial load if not manually toggled off
    if (isMath && state.calcActive === true) {
      // keep enabled
    } else if (isMath && !state.userToggledCalc) {
      state.calcActive = true;
    }
    if (isMath && state.calcActive && questionLayout && desmosWrapper) {
      questionLayout.classList.add("sat-math-layout");
      desmosWrapper.style.display = "flex";
      initDesmos();
      resizeDesmos();
    } else if (questionLayout && desmosWrapper) {
      questionLayout.classList.remove("sat-math-layout");
      desmosWrapper.style.display = "none";
    }

    // NEW: Question number display
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

    // RESTORED: Toggle calc button text + visibility
    if (toggleCalcBtn) {
      toggleCalcBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/>
      </svg>`;
      toggleCalcBtn.disabled = current.section !== "math";
      toggleCalcBtn.classList.toggle("is-hidden", current.section !== "math");
    }

    // Show reference button only for math, calc is always visible for math
    if (referenceBtn) {
      referenceBtn.classList.toggle("is-hidden", !isMath);
    }

    // Update More dropdown for section
    if (typeof updateDropdownForSection === "function") {
      updateDropdownForSection();
    }

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

    if (showExplanation) {
      const isCorrect = selectedAnswer === current.correctAnswer;
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

    // RESTORED: Button states
    if (prevQuestionBtn) prevQuestionBtn.disabled = state.currentIndex === 0;
    if (nextQuestionBtn) nextQuestionBtn.disabled = state.currentIndex === questions.length - 1;
    if (checkAnswerBtn) checkAnswerBtn.disabled = !selectedAnswer;
    if (showExplanationBtn) showExplanationBtn.disabled = false;
    if (markReviewBtn) markReviewBtn.disabled = false;
    
    // RESTORED: Button text and active states
    if (showExplanationBtn) {
      showExplanationBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`;
      showExplanationBtn.classList.toggle("is-active", explanationForcedOpen);
    }
    if (markReviewBtn) markReviewBtn.classList.toggle("is-active", !!state.reviewed[current.id]);
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
    // Reset desmos calculator when switching questions
    const current = getCurrentQuestion();
    if (current && current.section === "math" && state.calcActive) {
      resetDesmos();
    }
    renderHeader();
    renderNav();
    renderQuestion();
    // Resize desmos after render
    setTimeout(resizeDesmos, 100);
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

  // NEW: Draggable reference panel
  function makeDraggable(el, handleSelector) {
    const handle = el.querySelector(handleSelector) || el;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      el.style.top = (el.offsetTop - pos2) + "px";
      el.style.left = (el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // NEW: Toggle reference panel collapse
  window.toggleReferenceCollapse = function() {
    const panel = document.getElementById('referencePanel');
    const btn = document.getElementById('referenceCollapseBtn');
    if (!panel || !btn) return;
    
    panel.classList.toggle('collapsed');
    btn.classList.toggle('collapsed');
  };

  // NEW: Resizable reference panel
  function makeResizable(el) {
    const resizer = document.createElement('div');
    resizer.className = 'reference-resize-handle';
    el.appendChild(resizer);

    let startX, startY, startWidth, startHeight;

    resizer.addEventListener('mousedown', function(e) {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(document.defaultView.getComputedStyle(el).width, 10);
      startHeight = parseInt(document.defaultView.getComputedStyle(el).height, 10);
      document.documentElement.addEventListener('mousemove', resizing);
      document.documentElement.addEventListener('mouseup', stopResizing);
    });

    function resizing(e) {
      const width = startWidth + (e.clientX - startX);
      const height = startHeight + (e.clientY - startY);
      el.style.width = width + 'px';
      el.style.height = height + 'px';
    }

    function stopResizing() {
      document.documentElement.removeEventListener('mousemove', resizing);
      document.documentElement.removeEventListener('mouseup', stopResizing);
    }
  }

  // Event Listeners
  answerChoices.addEventListener("click", (event) => {
    // RESTORED: Retry button logic
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
    renderNav();
  });

  questionNav?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-index]");
    if (!button) {
      return;
    }
    goTo(Number(button.dataset.index));
  });

  prevQuestionBtn.addEventListener("click", () => {
    if (state.currentIndex > 0) {
      goTo(state.currentIndex - 1);
    }
  });

  nextQuestionBtn.addEventListener("click", () => {
    if (state.currentIndex < questions.length - 1) {
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
    renderNav();
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
    renderNav();
    renderQuestion();
  });

  // NEW: Reference panel toggle
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

  // NEW: Stopwatch event listeners
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

  // NEW: Session modal event listeners
  sessionInfoBtn.addEventListener("click", () => {
    populateSessionModal();
    if (sessionInfoModal) sessionInfoModal.style.display = "flex";
  });

  sessionInfoModal.addEventListener("click", (e) => {
    if (e.target === sessionInfoModal && sessionInfoModal) {
      sessionInfoModal.style.display = "none";
    }
  });

  // RESTORED: loadQuestions with full validation (keeps new stopwatch and reference panel)
  async function loadQuestions() {
    const sections = query.sections;
    // RESTORED: Section validation
    const isValidSection = Array.isArray(sections) && sections.length > 0;
    if (!isValidSection) {
      loadState = "error";
      loadError = "This practice link is missing a valid section. Go back to the bank and start a new session.";
      questions = [];
      state.currentIndex = 0;
      explanationForcedOpen = false;
      renderHeader();
      renderNav();
      renderQuestion();
      return;
    }

    loadState = "loading";
    loadError = "";
    questions = [];
    state.currentIndex = 0;
    explanationForcedOpen = false;
    renderHeader();
    renderNav();
    renderQuestion();

    // LIVE API MODE (original code)
    const params = new URLSearchParams();
    // RESTORED: Section value handling
    const sectionValue = sections.length === 2 && sections.includes("english") && sections.includes("math")
      ? "any"
      : sections.join(",");
    params.set("sections", sectionValue);
    // RESTORED: Domain value handling  
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
        renderNav();
        renderQuestion();
        return;
      }
      loadState = "error";
      loadError = "Could not reach the Korah SAT adapter.";
      console.error(err);
      renderHeader();
      renderNav();
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
        renderNav();
        renderQuestion();
        return;
      }
      loadState = "error";
      loadError = `Adapter error (${response.status}).`;
      renderHeader();
      renderNav();
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
      renderNav();
      renderQuestion();
      return;
    }

    questions = Array.isArray(payload?.questions) ? payload.questions : [];
    loadState = questions.length ? "success" : "empty";
    state.currentIndex = 0;
    // NEW: Start stopwatch
    startStopwatch();
    renderHeader();
    renderNav();
    renderQuestion();
    
    // NEW: Initialize reference panel draggable
    if (referencePanel) {
      makeDraggable(referencePanel, ".reference-drag-handle");
      makeResizable(referencePanel);
    }
  }

  renderHeader();
  renderNav();
  renderQuestion();

  void loadQuestions();
})();