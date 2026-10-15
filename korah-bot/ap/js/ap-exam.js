(function () {
  "use strict";

  const state = { exam: null, examPath: "", partIndex: 0, questionIndex: 0, answers: new Map(), reviewed: new Set(), remaining: 0, deadline: 0, fiveMinuteWarned: false, startedAt: 0, timerId: null, submitted: false };
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
    state.examPath = entry.path;
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
    if (!state.startedAt) state.startedAt = Date.now();
    state.partIndex = index;
    state.questionIndex = 0;
    state.remaining = currentPart().durationSec;
    state.deadline = Date.now() + state.remaining * 1000;
    state.fiveMinuteWarned = false;
    clearInterval(state.timerId);
    state.timerId = setInterval(tick, 1000);
    renderNavigator();
    renderQuestion();
    renderTimer();
    show("player-view");
  }

  function tick() {
    state.remaining = window.KorahAPCore.remainingSeconds(state.deadline, Date.now());
    renderTimer();
    // Latched, not an equality check: a throttled background tab can skip
    // straight past the 300 second mark.
    if (state.remaining <= 300 && !state.fiveMinuteWarned) {
      state.fiveMinuteWarned = true;
      announceFiveMinutes();
    }
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
    $("question-stem").innerHTML = window.KorahAP.escapeHtml(question.stem);
    const examUrl = new URL(state.examPath, location.href);
    $("question-assets").innerHTML = (question.assets || []).map((asset) => `<img src="${new URL(asset.path, examUrl).href}" alt="${window.KorahAP.escapeHtml(asset.alt)}">`).join("");
    $("answer-list").innerHTML = `<legend class="sr-only">Answer choices</legend>` + question.choices.map((choice) => `
      <label class="ap-choice"><input type="radio" name="answer" value="${choice.key}" ${state.answers.get(question.id) === choice.key ? "checked" : ""}><span class="ap-choice-key">${choice.key}</span><span>${window.KorahAP.escapeHtml(choice.text)}</span></label>`).join("");
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
    const next = state.exam.parts[state.partIndex + 1];
    if (!next) {
      submitExam(timedOut);
      return;
    }
    const done = currentPart();
    const count = next.questions.length;
    $("transition-eyebrow").textContent = `${done.title} complete`;
    $("transition-title").textContent = timedOut ? `Time expired. ${next.title} next` : `${next.title} next`;
    $("transition-copy").textContent = `Your ${done.title} answers are locked. ${next.title} has ${count} question${count === 1 ? "" : "s"} and calculator use is ${next.calculator}.`;
    $("start-next-part").textContent = `Start ${next.title}`;
    $("transition-dialog").showModal();
  }

  function submitExam(timedOut) {
    if (state.submitted) return;
    state.submitted = true;
    clearInterval(state.timerId);
    const core = window.KorahAPCore;
    const grade = core.gradeExam(state.exam, state.answers);
    const predicted = core.predictedScore(state.exam.curve, grade.rawScore);
    const units = core.unitBreakdown(state.exam, state.answers);
    show("complete-view");
    renderResults(grade, predicted, units, timedOut);
    persistAttempt(grade, predicted, units, timedOut);
  }

  // Unit labels are only needed once the exam is over, so they are not part of
  // the exam payload. Fall back to the raw unit id if the catalog is missing.
  async function unitLabels() {
    try {
      const response = await fetch("./data/course-catalog.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`catalog returned ${response.status}`);
      const catalog = await response.json();
      const units = catalog.courses?.[state.exam.course]?.units || [];
      return Object.fromEntries(units.map((unit) => [unit.id, unit.label]));
    } catch (error) {
      console.warn("[AP exam] unit labels unavailable", error);
      return {};
    }
  }

  async function renderResults(grade, predicted, units, timedOut) {
    const esc = window.KorahAP.escapeHtml;
    const labels = await unitLabels();

    $("results-title").textContent = timedOut ? "Time expired. Exam submitted." : "Exam submitted.";
    $("results-lead").textContent = `You answered ${grade.answered} of ${grade.total} questions and got ${grade.rawScore} right.`;
    $("results-ap-score").textContent = predicted ?? "\u2013";
    $("results-raw").textContent = `${grade.rawScore} / ${grade.total} raw`;
    $("results-retake").href = window.KorahAP.examUrl(state.exam.id);

    $("results-units").innerHTML = units.map((row) => {
      const percent = Math.round((row.correct / row.total) * 100);
      return `<div class="ap-unit-row${percent < 60 ? " is-weak" : ""}">
        <strong>${esc(labels[row.unit] || row.unit)}</strong>
        <span>${row.correct}/${row.total}</span>
        <div class="ap-unit-bar"><i style="width:${percent}%"></i></div>
      </div>`;
    }).join("");

    let number = 0;
    $("results-review").innerHTML = state.exam.parts.flatMap((part) => part.questions.map((question) => {
      number += 1;
      const given = state.answers.get(question.id);
      const correct = given === question.answer;
      const text = (key) => question.choices.find((choice) => choice.key === key)?.text || "";
      const yours = given
        ? `<span class="ap-answer-chip is-missed">Your answer: ${esc(given)}. ${esc(text(given))}</span>`
        : `<span class="ap-answer-chip is-missed">Not answered</span>`;
      return `<li class="ap-review-row ${correct ? "is-correct" : "is-missed"}">
        <span class="ap-review-mark"><i class="material-icons-round">${correct ? "check" : "close"}</i></span>
        <div class="ap-review-body">
          <div class="ap-review-meta"><span>Question ${number}</span><span>${esc(part.title)}</span><span>${esc(labels[question.unit] || question.unit)}</span></div>
          <p class="ap-review-stem">${esc(question.stem)}</p>
          <div class="ap-review-answers">
            ${correct ? "" : yours}
            <span class="ap-answer-chip is-correct">Correct: ${esc(question.answer)}. ${esc(text(question.answer))}</span>
          </div>
          <p class="ap-review-why">${esc(question.explanation)}</p>
        </div>
      </li>`;
    })).join("");
  }

  function renderAttempts(attempts, currentId) {
    if (!attempts.length) {
      $("results-attempts").innerHTML = `<p class="ap-muted">This is your first attempt at this exam.</p>`;
      return;
    }
    $("results-attempts").innerHTML = attempts.map((attempt) => {
      const when = new Date(attempt.ts).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
      return `<div class="ap-attempt-row${attempt.id === currentId ? " is-current" : ""}">
        <span>${attempt.id === currentId ? "This attempt" : when}</span>
        <b>${attempt.rawScore}/${attempt.total}${attempt.predictedScore ? ` \u00b7 AP ${attempt.predictedScore}` : ""}</b>
      </div>`;
    }).join("");
  }

  async function persistAttempt(grade, predicted, units, timedOut) {
    const note = $("results-save-note");
    try {
      const analytics = await (window.KorahAPAnalyticsReady || Promise.resolve(null));
      if (!analytics) {
        note.innerHTML = `<i class="material-icons-round">info</i>Sign in to save this attempt to your account.`;
        $("results-attempts").innerHTML = `<p class="ap-muted">Sign in to keep a history of your attempts.</p>`;
        return;
      }
      const attemptId = await analytics.recordAttempt({
        examId: state.exam.id,
        course: state.exam.course,
        title: state.exam.title,
        rawScore: grade.rawScore,
        total: grade.total,
        answered: grade.answered,
        predictedScore: predicted,
        units: Object.fromEntries(units.map((row) => [row.unit, { correct: row.correct, total: row.total }])),
        answers: Object.fromEntries(state.answers),
        timedOut,
        elapsedSec: state.startedAt ? Math.round((Date.now() - state.startedAt) / 1000) : 0,
      });
      note.innerHTML = `<i class="material-icons-round">cloud_done</i>Saved to your account.`;
      renderAttempts(await analytics.getAttempts(state.exam.id), attemptId);
    } catch (error) {
      console.error("[AP exam] could not save attempt", error);
      note.classList.add("is-error");
      note.innerHTML = `<i class="material-icons-round">cloud_off</i>Your score could not be saved. The results below are still complete.`;
      $("results-attempts").innerHTML = `<p class="ap-muted">Attempt history is unavailable.</p>`;
    }
  }

  $("start-exam").addEventListener("click", () => startPart(0));
  $("previous-question").addEventListener("click", () => { if (state.questionIndex > 0) { state.questionIndex -= 1; renderQuestion(); } });
  $("next-question").addEventListener("click", () => { if (state.questionIndex < currentPart().questions.length - 1) { state.questionIndex += 1; renderQuestion(); } else requestSubmit(); });
  $("mark-review").addEventListener("click", () => { const id = currentQuestion().id; state.reviewed.has(id) ? state.reviewed.delete(id) : state.reviewed.add(id); renderQuestion(); });
  $("submit-part").addEventListener("click", requestSubmit);
  $("confirm-submit").addEventListener("click", (event) => { event.preventDefault(); $("submit-dialog").close(); finishPart(false); });
  $("start-next-part").addEventListener("click", () => startPart(state.partIndex + 1));
  window.addEventListener("beforeunload", (event) => { if (state.timerId && !state.submitted) { event.preventDefault(); event.returnValue = ""; } });

  loadExam().catch((error) => { console.error("[AP exam]", error); $("loading-view").innerHTML = `<div class="ap-error"><strong>The exam could not be loaded.</strong><span>Use Live Server and try again.</span></div>`; });
})();
