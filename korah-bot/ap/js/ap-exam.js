(function () {
  "use strict";

  const state = { exam: null, partIndex: 0, questionIndex: 0, answers: new Map(), reviewed: new Set(), remaining: 0, timerId: null, submitted: false };
  const $ = (id) => document.getElementById(id);

  function show(id) {
    ["loading-view", "preexam-view", "player-view", "complete-view"].forEach((view) => { $(view).hidden = view !== id; });
  }

  async function loadExam() {
    const id = new URLSearchParams(location.search).get("exam") || "calc-ab-mock-1";
    const manifestResponse = await fetch("./data/manifest.json", { cache: "no-store" });
    if (!manifestResponse.ok) throw new Error(`manifest returned ${manifestResponse.status}`);
    const manifest = await manifestResponse.json();
    const entry = manifest.exams.find((candidate) => candidate.id === id);
    if (!entry) throw new Error(`unknown exam ${id}`);
    const examResponse = await fetch(entry.path, { cache: "no-store" });
    if (!examResponse.ok) throw new Error(`exam returned ${examResponse.status}`);
    state.exam = await examResponse.json();
    renderPreExam(entry);
  }

  function renderPreExam(entry) {
    document.title = `${state.exam.title} | Korah`;
    $("pre-course").textContent = entry.courseTitle;
    $("pre-title").textContent = state.exam.title;
    $("pre-parts").innerHTML = state.exam.parts.map((part, index) => `
      <div class="ap-part-row"><span class="ap-part-number">${index + 1}</span><span><strong>${part.title}</strong><br><small>${part.questions.length} questions</small></span><span>${window.KorahAP.formatDuration(part.durationSec)}<br><small>Calculator ${part.calculator}</small></span></div>`).join("");
    show("preexam-view");
  }

  function currentPart() { return state.exam.parts[state.partIndex]; }
  function currentQuestion() { return currentPart().questions[state.questionIndex]; }

  function startPart(index) {
    state.partIndex = index;
    state.questionIndex = 0;
    state.remaining = currentPart().durationSec;
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 1000);
    renderNavigator();
    renderQuestion();
    renderTimer();
    show("player-view");
  }

  function tick() {
    state.remaining = window.KorahAPCore.nextRemaining(state.remaining);
    renderTimer();
    if (state.remaining === 300) announceFiveMinutes();
    if (state.remaining <= 0) finishPart(true);
  }

  function renderTimer() {
    const minutes = Math.floor(Math.max(0, state.remaining) / 60);
    const seconds = Math.max(0, state.remaining) % 60;
    $("timer").querySelector("span").textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    $("timer").classList.toggle("warning", state.remaining <= 300);
  }

  function announceFiveMinutes() {
    $("timer").setAttribute("aria-live", "assertive");
    setTimeout(() => $("timer").setAttribute("aria-live", "off"), 1500);
  }

  function renderNavigator() {
    $("question-nav").innerHTML = currentPart().questions.map((question, index) => `<button class="ap-nav-button" data-index="${index}" aria-label="Question ${index + 1}">${index + 1}</button>`).join("");
    $("question-nav").querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { state.questionIndex = Number(button.dataset.index); renderQuestion(); }));
  }

  function renderQuestion() {
    const part = currentPart();
    const question = currentQuestion();
    $("part-label").textContent = `${part.title} · Calculator ${part.calculator}`;
    $("question-position").textContent = `Question ${state.questionIndex + 1} of ${part.questions.length}`;
    $("question-stem").innerHTML = window.KorahAP.renderInlineMath(question.stem);
    $("question-assets").innerHTML = (question.assets || []).map((asset) => `<img src="${new URL(asset.path, new URL(`./data/calc-ab/mock-1.json`, location.href)).href}" alt="${asset.alt}">`).join("");
    $("answer-list").innerHTML = `<legend class="sr-only">Answer choices</legend>` + question.choices.map((choice) => `
      <label class="ap-choice"><input type="radio" name="answer" value="${choice.key}" ${state.answers.get(question.id) === choice.key ? "checked" : ""}><span class="ap-choice-key">${choice.key}</span><span>${window.KorahAP.renderInlineMath(choice.text)}</span></label>`).join("");
    $("answer-list").querySelectorAll("input").forEach((input) => input.addEventListener("change", () => { state.answers.set(question.id, input.value); updateNavigator(); }));
    $("previous-question").disabled = state.questionIndex === 0;
    $("next-question").innerHTML = state.questionIndex === part.questions.length - 1 ? `Review part <i class="material-icons-round">fact_check</i>` : `Next <i class="material-icons-round">arrow_forward</i>`;
    const marked = state.reviewed.has(question.id);
    $("mark-review").classList.toggle("is-marked", marked);
    $("mark-review").innerHTML = `<i class="material-icons-round">${marked ? "bookmark" : "bookmark_border"}</i><span>${marked ? "Marked for review" : "Mark for review"}</span>`;
    $("part-progress").style.width = `${((state.questionIndex + 1) / part.questions.length) * 100}%`;
    const card = $("question-card");
    card.classList.remove("is-entering");
    void card.offsetWidth;
    card.classList.add("is-entering");
    updateNavigator();
  }

  function updateNavigator() {
    [...$("question-nav").children].forEach((button, index) => {
      const id = currentPart().questions[index].id;
      button.classList.toggle("current", index === state.questionIndex);
      button.classList.toggle("answered", state.answers.has(id));
      button.classList.toggle("marked", state.reviewed.has(id));
    });
  }

  function requestSubmit() {
    const unanswered = currentPart().questions.filter((question) => !state.answers.has(question.id)).length;
    $("dialog-copy").textContent = unanswered ? `${unanswered} question${unanswered === 1 ? " is" : "s are"} unanswered. Submitted answers cannot be changed.` : "Every question is answered. Submitted answers cannot be changed.";
    $("submit-dialog").showModal();
  }

  function finishPart(timedOut) {
    clearInterval(state.timerId);
    state.timerId = null;
    if (state.partIndex === 0) {
      $("transition-dialog").querySelector("h2").textContent = timedOut ? "Time expired. Calculator section next" : "Calculator section next";
      $("transition-dialog").showModal();
      return;
    }
    submitExam(timedOut);
  }

  function submitExam(timedOut) {
    if (state.submitted) return;
    state.submitted = true;
    clearInterval(state.timerId);
    const grade = window.KorahAPCore.gradeExam(state.exam, state.answers);
    console.log("[AP exam submitted]", { examId: state.exam.id, ...grade, timedOut, answers: Object.fromEntries(state.answers) });
    show("complete-view");
  }

  $("start-exam").addEventListener("click", () => startPart(0));
  $("previous-question").addEventListener("click", () => { if (state.questionIndex > 0) { state.questionIndex -= 1; renderQuestion(); } });
  $("next-question").addEventListener("click", () => { if (state.questionIndex < currentPart().questions.length - 1) { state.questionIndex += 1; renderQuestion(); } else requestSubmit(); });
  $("mark-review").addEventListener("click", () => { const id = currentQuestion().id; state.reviewed.has(id) ? state.reviewed.delete(id) : state.reviewed.add(id); renderQuestion(); });
  $("submit-part").addEventListener("click", requestSubmit);
  $("confirm-submit").addEventListener("click", (event) => { event.preventDefault(); $("submit-dialog").close(); finishPart(false); });
  $("start-next-part").addEventListener("click", () => startPart(1));
  window.addEventListener("beforeunload", (event) => { if (state.timerId && !state.submitted) { event.preventDefault(); event.returnValue = ""; } });

  loadExam().catch((error) => { console.error("[AP exam]", error); $("loading-view").innerHTML = `<div class="ap-error"><strong>The exam could not be loaded.</strong><span>Use Live Server and try again.</span></div>`; });
})();
