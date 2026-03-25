(() => {
  const { parseQuery, getMockQuestions } = window.KorahSAT;
  const query = parseQuery();
  const questions = getMockQuestions(query);

  const state = {
    currentIndex: Math.min(query.start || 0, Math.max(questions.length - 1, 0)),
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

  function getCurrentQuestion() {
    return questions[state.currentIndex];
  }

  function renderHeader() {
    const sectionLabel = query.section === "math" ? "Math Session" : "English Reading & Writing";
    playerTitle.textContent = questions.length ? sectionLabel : "No matching questions";
    playerCounter.textContent = questions.length
      ? `Question ${state.currentIndex + 1} of ${questions.length}`
      : "Question 0 of 0";
    playerFilters.innerHTML = `
      <span class="sat-pill">${query.section || "all sections"}</span>
      ${(query.domains.length ? query.domains : ["all domains"]).map((domain) => `<span class="sat-pill">${domain}</span>`).join("")}
      <span class="sat-pill">${query.shuffle ? "shuffled" : "ordered"}</span>
    `;
  }

  function renderNav() {
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

    if (!current) {
      questionDomain.textContent = "No data";
      questionStemTitle.textContent = "The UI is ready, but no questions matched these filters.";
      questionParagraph.textContent = "Connect this page to the future OpenSAT proxy to populate the session.";
      questionStem.textContent = "";
      answerChoices.innerHTML = "";
      feedbackPanel.className = "sat-feedback-panel";
      feedbackPanel.textContent = "Expected contract: { section, count, questions: [] }";
      prevQuestionBtn.disabled = true;
      nextQuestionBtn.disabled = true;
      checkAnswerBtn.disabled = true;
      return;
    }

    const selectedAnswer = state.answers[current.id];
    const checked = Boolean(state.checked[current.id]);
    const showExplanation = checked || explanationForcedOpen;

    questionDomain.textContent = current.domain;
    questionStemTitle.textContent = current.section === "math" ? "Math practice" : "Reading and Writing practice";
    questionParagraph.textContent = current.paragraph || "No passage text for this item.";
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
  }

  function goTo(index) {
    state.currentIndex = index;
    explanationForcedOpen = false;
    renderHeader();
    renderNav();
    renderQuestion();
  }

  answerChoices.addEventListener("click", (event) => {
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

  renderHeader();
  renderNav();
  renderQuestion();
})();
