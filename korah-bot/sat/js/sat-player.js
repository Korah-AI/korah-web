(() => {
  const { parseOpenSatV1Query, buildOpenSatV1QuestionUrl, OPENSAT_CATALOG } = window.KorahSAT;
  const query = parseOpenSatV1Query();

  let questions = [];
  let loadState = "loading"; // loading | success | empty | error
  let loadError = "";

  const state = {
    currentIndex: 0,
    answers: {},
    checked: {},
    reviewed: {}
  };

  const playerTitle = document.getElementById("playerTitle");
  const playerCounter = document.getElementById("playerCounter");
  const playerFilters = document.getElementById("playerFilters");
  const playerTimer = document.getElementById("playerTimer");
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
  const showExplanationBtn = document.getElementById("showExplanationBtn");
  const markReviewBtn = document.getElementById("markReviewBtn");
  const toggleCalcBtn = document.getElementById("toggleCalcBtn");
  const calculatorPanel = document.getElementById("calculatorPanel");

  let explanationForcedOpen = false;
  let remainingSeconds = 32 * 60;

  function getSectionLabel(sectionKey) {
    const section = OPENSAT_CATALOG?.sections?.find((s) => s.key === sectionKey);
    return section?.label || sectionKey || "SAT";
  }

  function getCurrentQuestion() {
    return questions[state.currentIndex];
  }

  function getSectionsLabel(sectionKeys) {
    if (!Array.isArray(sectionKeys) return sectionKeys || "SAT";
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
    const domains = query.domains;
    const domainLabel = Array.isArray(domains) && domains.length > 0 && !domains.includes("any")
      ? (domains.length === 1 ? domains[0] : `${domains.length} domains`)
      : "Any domain";

    if (loadState === "loading") {
      playerTitle.textContent = "Loading questions…";
      playerCounter.textContent = "Question 0 of 0";
    } else if (loadState === "error") {
      playerTitle.textContent = "Could not load questions";
      playerCounter.textContent = "Question 0 of 0";
    } else if (loadState === "empty") {
      playerTitle.textContent = "No matching questions";
      playerCounter.textContent = "Question 0 of 0";
    } else {
      playerTitle.textContent = sectionLabel;
      playerCounter.textContent = `Question ${state.currentIndex + 1} of ${questions.length}`;
    }

    const limitLabel = query.limit === null || query.limit === undefined ? "No limit" : `${query.limit} questions`;
    const sectionsPill = Array.isArray(sections) && sections.length > 0
      ? sections.join(",")
      : "section not set";
    playerFilters.innerHTML = `
      <span class="sat-pill">${sectionsPill}</span>
      <span class="sat-pill">${domainLabel}</span>
      <span class="sat-pill">${limitLabel}</span>
    `;
  }

  function renderNav() {
    if (loadState !== "success") {
      questionNav.innerHTML = "";
      return;
    }
    questionNav.innerHTML = questions
      .map((question, index) => {
        const classes = [
          "sat-mini-pill",
          index === state.currentIndex ? "is-current" : "",
          state.reviewed[question.id] ? "is-reviewed" : ""
        ]
          .filter(Boolean)
          .join(" ");
        return `<button class="${classes}" type="button" data-index="${index}">${index + 1}</button>`;
      })
      .join("");
  }

  function renderQuestion() {
    const current = getCurrentQuestion();

    if (loadState === "loading") {
      questionDomain.textContent = "";
      questionStemTitle.textContent = "Loading questions…";
      questionParagraph.textContent = "Fetching your OpenSAT session from Korah.";
      questionStem.textContent = "";
      answerChoices.innerHTML = "";
      feedbackPanel.className = "sat-feedback-panel is-hidden";
      feedbackPanel.innerHTML = "";
      reviewBadge.classList.add("is-hidden");
      prevQuestionBtn.disabled = true;
      nextQuestionBtn.disabled = true;
      checkAnswerBtn.disabled = true;
      toggleCalcBtn.disabled = true;
      showExplanationBtn.disabled = true;
      markReviewBtn.disabled = true;
      return;
    }

    if (loadState === "error") {
      questionDomain.textContent = "";
      questionStemTitle.textContent = "OpenSAT connection issue";
      questionParagraph.textContent = loadError || "Something went wrong while loading questions.";
      questionStem.textContent = "";
      answerChoices.innerHTML = `
        <button class="sat-button sat-button-primary" type="button" id="retryLoadBtn">Retry</button>
        <a class="sat-button sat-button-ghost" href="./index.html">Back to bank</a>
      `;
      feedbackPanel.className = "sat-feedback-panel is-hidden";
      feedbackPanel.innerHTML = "";
      reviewBadge.classList.add("is-hidden");
      prevQuestionBtn.disabled = true;
      nextQuestionBtn.disabled = true;
      checkAnswerBtn.disabled = true;
      toggleCalcBtn.disabled = true;
      showExplanationBtn.disabled = true;
      markReviewBtn.disabled = true;
      return;
    }

    if (loadState === "empty") {
      questionDomain.textContent = "";
      questionStemTitle.textContent = "No questions matched this selection";
      questionParagraph.textContent = "Try another domain or lower the question limit.";
      questionStem.textContent = "";
      answerChoices.innerHTML = `<a class="sat-button sat-button-primary" href="./index.html">Back to bank</a>`;
      feedbackPanel.className = "sat-feedback-panel is-hidden";
      feedbackPanel.innerHTML = "";
      reviewBadge.classList.add("is-hidden");
      prevQuestionBtn.disabled = true;
      nextQuestionBtn.disabled = true;
      checkAnswerBtn.disabled = true;
      toggleCalcBtn.disabled = true;
      showExplanationBtn.disabled = true;
      markReviewBtn.disabled = true;
      return;
    }

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

    questionDomain.textContent = current.domain;
    questionStemTitle.textContent = current.section === "math" ? "Math practice" : "Reading and Writing practice";
    if (current.paragraph) {
      questionParagraph.textContent = current.paragraph;
      questionParagraph.classList.remove("is-hidden");
    } else {
      questionParagraph.textContent = "";
      questionParagraph.classList.add("is-hidden");
    }
    questionStem.textContent = current.stem;
    reviewBadge.classList.toggle("is-hidden", !state.reviewed[current.id]);

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

    prevQuestionBtn.disabled = state.currentIndex === 0;
    nextQuestionBtn.disabled = state.currentIndex === questions.length - 1;
    toggleCalcBtn.textContent = current.section === "math" ? "Toggle calculator" : "Calculator hidden";
    if (current.section !== "math") {
      calculatorPanel.classList.add("is-hidden");
    }

    toggleCalcBtn.disabled = current.section !== "math";
    showExplanationBtn.disabled = false;
    markReviewBtn.disabled = false;
    checkAnswerBtn.disabled = !selectedAnswer;
  }

  function goTo(index) {
    state.currentIndex = index;
    explanationForcedOpen = false;
    renderHeader();
    renderNav();
    renderQuestion();
  }

  answerChoices.addEventListener("click", (event) => {
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

  questionNav.addEventListener("click", (event) => {
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
    showExplanationBtn.textContent = explanationForcedOpen ? "Hide explanation" : "Show explanation";
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

  toggleCalcBtn.addEventListener("click", () => {
    const current = getCurrentQuestion();
    if (!current || current.section !== "math") {
      return;
    }
    calculatorPanel.classList.toggle("is-hidden");
  });

  window.setInterval(() => {
    remainingSeconds = Math.max(0, remainingSeconds - 1);
    const minutes = String(Math.floor(remainingSeconds / 60)).padStart(2, "0");
    const seconds = String(remainingSeconds % 60).padStart(2, "0");
    playerTimer.textContent = `${minutes}:${seconds}`;
  }, 1000);

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
      loadState = "error";
      loadError = "Could not reach the Korah SAT adapter.";
      console.error(err);
      renderHeader();
      renderNav();
      renderQuestion();
      return;
    }

    if (!response.ok) {
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
    renderHeader();
    renderNav();
    renderQuestion();
  }

  renderHeader();
  renderNav();
  renderQuestion();

  void loadQuestions();
})();
