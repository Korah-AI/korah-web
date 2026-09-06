// ─────────────────────────────────────────────────────────────
// Korah Full-Length Practice Test — Player logic
// One-way state machine: RW M1 → RW M2 → break → Math M1 → Math M2 → results.
// LocalStorage for in-progress state; Firestore (KorahSATAnalytics) for final results.
// ─────────────────────────────────────────────────────────────

const testId = new URLSearchParams(location.search).get("test") || "4";
// Namespaced per test so Test 4 and Test 11 keep independent progress.
const LS_KEY = `korahPTState:${testId}`;
const RESULT_KEY = "korahLastPTResult";
const testSlug = `test-${testId}`;
const DATA_URL = `../docs/practice-tests/${testSlug}/${testSlug}.json`;

// Inferred display name — resolved from account data (same heuristic the rest of
// the app uses) and used to personalize the confirmation screen.
function resolveDisplayName(user) {
  const first =
    localStorage.getItem("korah_first_name") ||
    localStorage.getItem("korah_name") ||
    (user && (user.displayName || user.email?.split("@")[0])) ||
    "";
  return String(first).trim();
}
let currentUserName = resolveDisplayName(null);

// ── Firebase bootstrap (mirrors the sat pages) ----
let K = null; // window.KorahSATAnalytics (set after auth)
{
  const firebaseConfig = {
    apiKey: "AIzaSyDvabVNkVMfjKl1m3dQSlW06h-iomgcNJM",
    authDomain: "korah-app.firebaseapp.com",
    projectId: "korah-app",
    storageBucket: "korah-app.firebasestorage.app",
    messagingSenderId: "226169460321",
    appId: "1:226169460321:web:b166fc8260107c55dafc20",
  };
  import("https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js").then(async ({ initializeApp }) => {
    const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js");
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    onAuthStateChanged(auth, async (user) => {
      if (!user) return; // play locally; Firestore save skipped
      try {
        const { initSatAnalytics } = await import("../sat/js/sat-analytics.js");
        K = await initSatAnalytics(app, user.uid);
      } catch (e) { console.warn("[PT] analytics init failed", e); }
      // Resolve the user's first name for the confirmation screen.
      const firstName = resolveDisplayName(user);
      if (firstName) {
        currentUserName = firstName;
        if (state) { state.name = firstName; updateBottomBar(); }
      }
      renderConfirmScreen();
      if (state && state.step === "results") saveResultsOnce();
      console.log("[PT] auth ready; name =", JSON.stringify(firstName));
    });
  }).catch((e) => console.warn("[PT] firebase load failed", e));
}

// Desmos' publicly documented demo API key. Not a Korah credential and not a
// secret: it ships in Desmos' own embed docs and is safe in client-side code.
const DESMOS_DEMO_API_KEY = "dcb31709b452b1cf9dc26972add0fda6";

const MODULES = [
  { key: "rwModule1", section: "english", label: "Reading & Writing", module: "Module 1", minutes: 39 },
  { key: "rwModule2", section: "english", label: "Reading & Writing", module: "Module 2", minutes: 39 },
  { key: "mathModule1", section: "math", label: "Math", module: "Module 1", minutes: 43 },
  { key: "mathModule2", section: "math", label: "Math", module: "Module 2", minutes: 43 },
];
const RW_MODULES = MODULES.filter((m) => m.section === "english");
const MATH_MODULES = MODULES.filter((m) => m.section === "math");

let test = null;         // parsed test-4.json
let state = null;        // runtime session state
let qIdx = 0;            // question index within current module
let timerHandle = null;  // module countdown
let moduleDeadline = 0;  // epoch ms
let breakHandle = null;

const $ = (id) => document.getElementById(id);
const shown = (id, on) => { const el = $(id); if (el) el.classList.toggle("is-hidden", !on); };
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
// Encodes each path segment separately so the "/" in relative image paths survives.
const encPath = (p) => String(p).split("/").map((seg) => encodeURIComponent(seg)).join("/");

// ── UI dialogs (replace native confirm/alert) ─────────────
let _fork = null; // the not-yet-invoked action when a confirm is pending
function openModal(overlayId, modalId) {
  $(overlayId).classList.add("open");
  $(modalId).classList.add("open");
}
function closeModal(overlayId, modalId) {
  $(overlayId).classList.remove("open");
  $(modalId).classList.remove("open");
}
function uiAlert(title, message) {
  $("alertTitle").textContent = title || "Notice";
  $("alertMsg").textContent = message || "";
  openModal("alertOverlay", "alertModal");
}
function uiConfirm({ title, message, confirmLabel, onConfirm, onCancel }) {
  $("confirmTitle").textContent = title || "Are you sure?";
  $("confirmMsg").textContent = message || "";
  $("confirmOkBtn").textContent = confirmLabel || "Confirm";
  openModal("confirmOverlay", "confirmModal");
  $("confirmOkBtn").onclick = () => { closeModal("confirmOverlay", "confirmModal"); if (onConfirm) onConfirm(); };
  $("confirmCancelBtn").onclick = () => { closeModal("confirmOverlay", "confirmModal"); if (onCancel) onCancel(); };
  $("confirmClose").onclick = () => { closeModal("confirmOverlay", "confirmModal"); if (onCancel) onCancel(); };
  $("confirmOverlay").onclick = () => { closeModal("confirmOverlay", "confirmModal"); if (onCancel) onCancel(); };
}

// Bind the always-present alert modal dismiss buttons once (it can open before wireUI runs).
document.addEventListener("DOMContentLoaded", () => {
  const closeAlert = () => closeModal("alertOverlay", "alertModal");
  $("alertOkBtn")?.addEventListener("click", closeAlert);
  $("alertClose")?.addEventListener("click", closeAlert);
  $("alertOverlay")?.addEventListener("click", closeAlert);
});

function persist() { try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) {} }
function loadPersisted() { try { return JSON.parse(localStorage.getItem(LS_KEY)); } catch (e) { return null; } }

init();

async function init() {
  let loadOk = true;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error("HTTP " + res.status);
    test = await res.json();
  } catch (e) {
    console.warn("[PT] test load failed; UI stays usable", e);
    loadOk = false;
  }

  // Wire the UI regardless of whether the test data loaded, so the page is
  // never left with dead buttons (e.g. fetch blocked under file:// / CORS).
  wireUI();
  renderConfirmScreen();

  // Resume an in-progress session if present.
  const saved = loadPersisted();
  const inProgress = saved && saved.step && saved.step !== "start"
    && saved.currentMod !== undefined && saved.currentMod <= MODULES.length
    && (saved.name || saved.currentMod > 0
      || (saved.answers && Object.keys(saved.answers).length > 0));
  if (inProgress) {
    state = saved;
    onResume();
  } else {
    // No usable in-progress session (missing, stale "start", or completed):
    // clear any leftover so it can never be mistaken for real progress, and
    // don't persist a bare "start" state — progress only counts once a test begins.
    try { localStorage.removeItem(LS_KEY); } catch (e) {}
    freshState(); // step: "start"
  }
  if (!loadOk) {
    uiAlert("Couldn't load the test", "Could not load the practice test data. If you're opening this file directly (file://), please serve it over http:// — the browser blocks local data fetches.");
  }
}

function freshState() {
  state = {
    step: "start",   // start | module | break | review | results
    name: "",
    currentMod: 0,   // index into MODULES
    qIdx: 0,         // last-viewed question index within the current module
    finished: [],    // module indexes completed (one-way)
    answers: {},     // `${modKey}:${n}` -> selected (mcq letter) or text (spr)
    reviewed: {},    // `${modKey}:${n}` -> true
    moduleStartedAt: {},
    moduleRemaining: {},  // seconds left when last paused/left
    breakRemaining: 600,  // 10 min break
    finishedAt: null,
  };
}

function setStep(s) { state.step = s; persist(); }

// ── Screen router ────────────────────────────────
function showScreen(which) {
  ["start", "break", "module", "review", "results"].forEach((id) => shown("screen-" + id, id === which));
  updateTopBar();
  updateBottomBar();
  const inQuestion = which === "module";
  // hide reference/accessibility/break during non-question screens gracefully
  if (!inQuestion) { closeMenus(); }
}

function updateTopBar() {
  const m = MODULES[state.currentMod];
  let label = "—";
  if (state.step === "module") label = `${m.label} · ${m.module}`;
  else if (state.step === "break") label = "Break";
  else if (state.step === "results") label = "Complete";
  $("moduleIndicator").innerHTML = `<strong>${label}</strong>`;
  const calcBtn = $("calcBtn");
  if (calcBtn) calcBtn.style.display = (state.step === "module" && m && m.section === "math") ? "" : "none";
}

function updateBottomBar() {
  $("nameDisplay").textContent = state.name || "Student";
}

// ── Confirmation screen ────────────────────────────
// Fills the test-format summary (organization, per-module timing/question
// counts, pacing) and personalizes the greeting with the inferred name.
function renderConfirmScreen() {
  const rwMods = RW_MODULES;
  const mathMods = MATH_MODULES;
  const count = (mods) => mods.reduce((sum, m) => sum + ((test?.[m.key] || []).length || 0), 0);
  const minutes = (mods) => mods.reduce((sum, m) => sum + m.minutes, 0);

  const rwQ = count(rwMods), mathQ = count(mathMods);
  const rwMin = minutes(rwMods), mathMin = minutes(mathMods);
  const totalQ = rwQ + mathQ;

  const rwEl = $("confirmRWInfo");
  if (rwEl) rwEl.textContent = `${rwMods.length} modules \u00b7 ${rwQ} questions \u00b7 ${rwMin} min`;
  const mathEl = $("confirmMathInfo");
  if (mathEl) mathEl.textContent = `${mathMods.length} modules \u00b7 ${mathQ} questions \u00b7 ${mathMin} min`;
  const paceEl = $("confirmPacing");
  if (paceEl && totalQ) paceEl.textContent = `\u2248 ${Math.round((rwMin + mathMin + 10) * 60 / totalQ)} seconds per question`;

  const nameEl = $("confirmName");
  if (nameEl) nameEl.textContent = currentUserName || "there";
}

// ── Timer ────────────────────────────────────────
function fmt(s) {
  s = Math.max(0, Math.ceil(s));
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function startModuleTimer() {
  stopTimer();
  const m = MODULES[state.currentMod];
  const remaining = (state.moduleRemaining[state.currentMod] != null)
    ? state.moduleRemaining[state.currentMod]
    : m.minutes * 60;
  state.moduleRemaining[state.currentMod] = remaining;
  moduleDeadline = Date.now() + remaining * 1000;
  $("timer").classList.remove("is-warn");
  timerHandle = setInterval(tick, 250);
  tick();
}

function tick() {
  const left = Math.max(0, (moduleDeadline - Date.now()) / 1000);
  state.moduleRemaining[state.currentMod] = left;
  $("timer").textContent = fmt(left);
  $("timer").classList.toggle("is-warn", left <= 60);
  if (left <= 0) { stopTimer(); finishModule(true); }
  persist();
}

function stopTimer() {
  if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
}

function pauseModule() {
  if (timerHandle) {
    state.moduleRemaining[state.currentMod] = Math.max(0, (moduleDeadline - Date.now()) / 1000);
    stopTimer();
    persist();
  }
}

// ── UI wiring ────────────────────────────────────
function wireUI() {
  $("startBtn").addEventListener("click", () => {
    // Name is inferred from the account; no manual entry needed.
    state.name = currentUserName || "Student";
    $("nameDisplay").textContent = state.name;
    persist();
    beginModule();
  });

  $("prevQBtn").addEventListener("click", () => { if (qIdx > 0) { qIdx--; state.qIdx = qIdx; persist(); renderQuestion(); } });
  $("nextQBtn").addEventListener("click", () => {
    const qs = currentQuestions();
    if (qIdx < qs.length - 1) { qIdx++; state.qIdx = qIdx; persist(); renderQuestion(); }
  });
  $("finishModuleBtn").addEventListener("click", () => finishModule(false));

  $("reviewToggleBtn").addEventListener("click", () => {
    const key = qKey();
    state.reviewed[key] = !state.reviewed[key];
    persist();
    renderQuestion();
  });

  $("resumeBtn").addEventListener("click", () => stopBreak());

  // Top menu
  $("menuBtn").addEventListener("click", () => $("menuItems").classList.toggle("open"));
  document.querySelectorAll("#menuItems button").forEach((b) => {
    b.addEventListener("click", () => {
      $("menuItems").classList.remove("open");
      const act = b.dataset.action;
      if (act === "reference") openRef();
      else if (act === "accessibility") openAcc();
      else if (act === "exit") exitTest();
    });
  });
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#topDropdown")) $("menuItems").classList.remove("open");
  });

  // Question menu popup
  $("qMenuBtn").addEventListener("click", openQMenu);
  $("qMenuClose").addEventListener("click", closeQMenu);
  $("qMenuOverlay").addEventListener("click", closeQMenu);
  $("qMenuReviewBtn").addEventListener("click", () => { closeQMenu(); openReview(); });
  $("reviewBackBtn").addEventListener("click", () => {
    if (state.step === "review") { setStep("module"); showScreen("module"); startModuleTimer(); renderQuestion(); }
  });

  // Results
  $("resultsReviewBtn").addEventListener("click", () => openReview(true));
  $("resultsExitBtn").addEventListener("click", () => {
    resetAll(); shown("screen-results", false); setStep("start"); showScreen("start");
  });

  // Reference / accessibility
  $("refClose").addEventListener("click", closeRef);
  $("refOverlay").addEventListener("click", closeRef);
  $("accClose").addEventListener("click", closeAcc);
  $("accOverlay").addEventListener("click", closeAcc);
  // Calculator (Desmos)
  $("calcBtn").addEventListener("click", openCalc);
  $("calcClose").addEventListener("click", closeCalc);
  $("calcOverlay").addEventListener("click", closeCalc);
  makeDraggable($("refPopup"));
  makeDraggable($("calcPopup"));
  makeResizable($("refPopup"));
  makeResizable($("calcPopup"), () => { if (calcInstance) calcInstance.resize(); });
  $("fontSmall").addEventListener("click", () => document.body.style.fontSize = "14px");
  $("fontReset").addEventListener("click", () => document.body.style.fontSize = "16px");
  $("fontLarge").addEventListener("click", () => document.body.style.fontSize = "19px");
  $("contrastToggle").addEventListener("click", () => {
    const hl = document.documentElement.style.filter === "invert(1)";
    document.documentElement.style.filter = hl ? "" : "invert(1)";
  });
}

// ── Resume ───────────────────────────────────────
function onResume() {
  if (state.step === "break") { showScreen("break"); startBreak(); }
  else if (state.step === "results") { renderResults(); showScreen("results"); }
  else if (state.step === "review") {
    // showScreen() alone reveals an empty #reviewList — the markup is built by
    // openReview(). Rebuild it, in whichever of the two review modes we left in.
    const answersMode = state.reviewMode === "answers" || state.currentMod >= MODULES.length;
    if (answersMode) openReview(true);
    else { openReview(); startModuleTimer(); }
  }
  else beginModule(true);
}

// ── Module flow ──────────────────────────────────
function beginModule(resuming) {
  if (state.currentMod >= MODULES.length) { finishTest(); return; }
  setStep("module");
  if (!resuming) {
    state.moduleRemaining[state.currentMod] = null; // fresh timer
    state.qIdx = 0;
  }
  qIdx = state.qIdx || 0;
  if (qIdx >= (test[MODULES[state.currentMod].key] || []).length) qIdx = 0;
  showScreen("module");
  $("finishModuleBtn").style.display = "none";
  startModuleTimer();
  renderQuestion();
}

function finishModule(auto) {
  // Unanswered questions are simply omitted — they award no points. Always
  // let the player continue to the next module without being blocked.
  doFinishModule();
}

function doFinishModule() {
  stopTimer();
  delete state.moduleRemaining[state.currentMod]; // reset for next time
  state.finished.push(state.currentMod);
  if (state.currentMod === 1) {
    // After RW M1 & M2 → break
    setStep("break");
    showScreen("break");
    startBreak();
    return;
  }
  advanceModule();
}

function advanceModule() {
  state.currentMod++;
  state.moduleRemaining[state.currentMod] = null;
  if (state.currentMod >= MODULES.length) { finishTest(); return; }
  beginModule();
}

function currentQuestions() { return test[MODULES[state.currentMod].key] || []; }
function qKey(q) {
  const n = q && q.n ? q.n : currentQuestions()[qIdx].n;
  return `${MODULES[state.currentMod].key}:${n}`;
}

// ── Break ────────────────────────────────────────
function startBreak() {
  stopTimer();
  let left = state.breakRemaining != null ? state.breakRemaining : 600;
  state.breakRemaining = left;
  const end = Date.now() + left * 1000;
  let lastWhole = null;
  const draw = () => {
    left = Math.max(0, (end - Date.now()) / 1000);
    state.breakRemaining = left;
    $("breakTimer").textContent = fmt(left);
    // The text redraws 4x/second, but re-stringifying the whole state that
    // often is wasteful — only save when the displayed second actually changes.
    const whole = Math.ceil(left);
    if (whole !== lastWhole) { lastWhole = whole; persist(); }
    // Informational only — never auto-start the next subject. The student must
    // click "Resume Testing Now" (spec requirement).
  };
  draw();
  breakHandle = setInterval(draw, 250);
}
function stopBreak() {
  if (breakHandle) { clearInterval(breakHandle); breakHandle = null; }
  state.breakRemaining = null;
  $("breakTimer").textContent = "10:00";
  advanceModule();
}

// ── Question rendering ───────────────────────────
function renderQuestion() {
  if (!currentQuestions().length) return;
  const q = currentQuestions()[qIdx];
  const m = MODULES[state.currentMod];
  const key = `${m.key}:${q.n}`;
  const selected = state.answers[key];
  const reviewed = !!state.reviewed[key];
  const isSpr = q.type === "spr";

  const total = currentQuestions().length;
  $("qCard").innerHTML = `
    <div class="q-card">
      <div class="q-top">
        <span class="q-num">Question ${q.n} / ${total}</span>
        ${q.domain ? `<span class="domain-chip">${esc(q.domain)}</span>` : ""}
      </div>
      ${q.passage ? `<div class="passage">${esc(q.passage)}</div>` : ""}
      ${renderStem(q)}
      ${isSpr ? renderSpr(selected, key) : renderMcq(selected, key, q)}
    </div>
  `;
  $("reviewToggleBtn").classList.toggle("is-active", reviewed);
  $("reviewToggleBtn").textContent = reviewed ? "Reviewed ✓" : "Mark for Review";
  $("prevQBtn").disabled = qIdx === 0;
  const isLast = qIdx === total - 1;
  $("nextQBtn").disabled = false;
  // Hide "Next" on the last question — "Finish Module & Continue" replaces it.
  $("nextQBtn").style.display = isLast ? "none" : "";
  $("finishModuleBtn").style.display = isLast ? "inline-block" : "none";

  if (isSpr) {
    const inp = $("qSprInput");
    if (inp) {
      inp.addEventListener("input", () => {
        state.answers[key] = inp.value;
        persist();
      });
    }
  }
  updateQMenuCounts();
}

function renderStem(q) {
  if (q.stemImg) {
    return `<div class="stem stem-img-only"><img src="../docs/practice-tests/${testSlug}/question-imgs/${encPath(q.stemImg)}" alt="question ${q.n} stem"/></div>`;
  }
  return `<div class="stem">${esc(q.stem)}</div>`;
}

function renderMcq(selected, key, q) {
  return `<div class="options">
    ${(q.options || []).map((opt, i) => {
      const letter = String.fromCharCode(65 + i); // A, B, C, D
      const text = opt.replace(/^[A-D]\)\s*/, ""); // strip leading letter if present
      const sel = selected === letter;
      const optImg = q.optionImgs && q.optionImgs[i]
        ? `<div class="opt-img-wrap"><img class="opt-img" src="../docs/practice-tests/${testSlug}/question-imgs/${encPath(q.optionImgs[i])}" alt="option ${letter}"/></div>`
        : `<span>${esc(text)}</span>`;
      return `<div class="option${sel ? " is-selected" : ""}" data-letter="${letter}" role="button" tabindex="0">
        <span class="opt-key">${letter}</span>${optImg}
      </div>`;
    }).join("")}
  </div>`;
}

function renderSpr(selected, key) {
  return `<div class="spr-wrap">
    <label style="color:var(--tx2); font-size:.85rem; display:block; margin-bottom:8px">Enter your answer</label>
    <input class="spr-input" id="qSprInput" type="text" placeholder="Type a number or expression"
      autocomplete="off" spellcheck="false" value="${esc(selected || "")}"/>
  </div>`;
}

// delegate clicks on dynamically-rendered options
document.addEventListener("click", (e) => {
  const opt = e.target.closest(".option");
  if (!opt || state.step !== "module") return;
  const key = qKey();
  state.answers[key] = opt.dataset.letter;
  persist();
  // Move the "is-selected" class in place — that class is the only thing a full
  // renderQuestion() would change here, and rebuilding #qCard reloads the images.
  opt.parentElement.querySelectorAll(".option").forEach((el) => el.classList.toggle("is-selected", el === opt));
  updateQMenuCounts();
});

// ── Question menu ────────────────────────────────
function openQMenu() {
  renderQGrid();
  updateQMenuCounts();
  $("qMenuPopup").classList.add("open");
  $("qMenuOverlay").classList.add("open");
}
function closeQMenu() {
  $("qMenuPopup").classList.remove("open");
  $("qMenuOverlay").classList.remove("open");
}
function qStatus(q) {
  const key = `${MODULES[state.currentMod].key}:${q.n}`;
  let cls = "";
  if (state.answers[key] != null && state.answers[key] !== "") cls += " is-answered";
  if (state.reviewed[key]) cls += " is-review";
  if (q.n === currentQuestions()[qIdx].n) cls += " is-current";
  return cls;
}
function renderQGrid() {
  const qs = currentQuestions();
  $("qGrid").innerHTML = qs.map((q) =>
    `<div class="q-dot${qStatus(q)}" data-n="${q.n}" title="Question ${q.n}">${q.n}</div>`
  ).join("");
  document.querySelectorAll("#qGrid .q-dot").forEach((d) => {
    d.addEventListener("click", () => {
      qIdx = currentQuestions().findIndex((q) => q.n === Number(d.dataset.n));
      closeQMenu();
      renderQuestion();
    });
  });
}
function updateQMenuCounts() {
  const qs = currentQuestions();
  let answered = 0, review = 0;
  qs.forEach((q) => {
    const key = `${MODULES[state.currentMod].key}:${q.n}`;
    if (state.answers[key] != null) answered++;
    if (state.reviewed[key]) review++;
  });
  $("cAnswered").textContent = answered;
  $("cUnanswered").textContent = qs.length - answered;
  $("cReview").textContent = review;
}

// ── Review page ──────────────────────────────────
function openReview(showAnswers) {
  const prevStep = state.step;

  if (showAnswers) {
    // Post-test review: full breakdown of every question. Shows what the
    // student answered and, only when they got it wrong, the correct answer.
    buildAnswerReview();
    state.step = "review";
    state.reviewMode = "answers";
    persist();
    $("reviewBackBtn").onclick = () => {
      setStep("results");
      renderResults();
      showScreen("results");
    };
    showScreen("review");
    return;
  }

  const m = MODULES[state.currentMod];
  const qs = currentQuestions();
  $("reviewTitle").textContent = `${m.label} · ${m.module} · Review`;
  // Compact clickable grid: one square per question. Filled = answered,
  // corner ribbon = marked for review. No answers or feedback shown here.
  let answered = 0, reviewed = 0;
  const grid = qs.map((q) => {
    const key = `${m.key}:${q.n}`;
    if (state.answers[key] != null && state.answers[key] !== "") answered++;
    if (state.reviewed[key]) reviewed++;
    return `<div class="q-dot${qStatus(q)}" data-n="${q.n}" title="Question ${q.n}">${q.n}</div>`;
  }).join("");
  $("reviewList").innerHTML =
    `<div style="display:flex; gap:16px; font-size:.82rem; color:var(--tx2); margin-bottom:12px; flex-wrap:wrap">` +
      `<span>${answered}/${qs.length} answered</span>` +
      `<span>${reviewed} marked for review</span>` +
    `</div>` +
    `<div class="review-grid">${grid}</div>`;
  document.querySelectorAll("#reviewList .q-dot").forEach((d) => {
    d.addEventListener("click", () => {
      qIdx = qs.findIndex((q) => q.n === Number(d.dataset.n));
      if (qIdx < 0) qIdx = 0;
      state.qIdx = qIdx;
      persist();
      setStep("module");
      showScreen("module");
      startModuleTimer();
      renderQuestion();
    });
  });
  // Keep the module timer running while on the review page (matches the real
  // test — the clock keeps counting down as you review).
  state.step = "review";
  state.reviewMode = "module";
  persist();
  $("reviewBackBtn").onclick = () => {
    setStep(prevStep === "results" ? "results" : "module");
    if (prevStep === "results") { renderResults(); showScreen("results"); }
    else { showScreen("module"); startModuleTimer(); renderQuestion(); }
  };
  showScreen("review");
}

// Renders the full post-test answer breakdown across every module, grouped by
// section/module. For each question it shows the student's answer and, only if
// they got it wrong, the correct answer.
function buildAnswerReview() {
  let totalRight = 0, totalSeen = 0;
  const sections = MODULES.map((m, mi) => {
    const qs = test[m.key] || [];
    if (!qs.length) return "";
    let right = 0;
    const rows = qs.map((q) => {
      const sel = state.answers[`${m.key}:${q.n}`];
      const ok = isCorrect(q, sel);
      if (ok) right++;
      totalSeen++;
      if (ok) totalRight++;
      return reviewRow(q, sel, ok, m.key);
    }).join("");
    return (
      `<div class="review-sec">` +
        `<div class="review-sec-head">${m.label} · ${m.module} <span>${right}/${qs.length} correct</span></div>` +
        `<div class="review-rows">${rows}</div>` +
      `</div>`
    );
  }).join("");

  $("reviewTitle").textContent = "Answer Review";
  $("reviewList").innerHTML =
    `<div class="review-summary">You answered ${totalRight} of ${totalSeen} questions correctly.</div>` +
    sections;
}

// One row of the post-test answer review.
function reviewRow(q, sel, ok, modKey) {
  const answeredText = answerLabel(q, sel) || "Not answered";
  const correctText = answerLabel(q, q.correct);
  const mark = ok
    ? `<span class="rev-mark rev-ok">✓</span>`
    : `<span class="rev-mark rev-bad">✗</span>`;
  const correctLine = ok
    ? ""
    : `<div class="rev-correct">Correct answer: <b>${esc(correctText)}</b></div>`;
  return (
    `<div class="rev-row${ok ? " is-right" : " is-wrong"}">` +
      `<div class="rev-q">Q${q.n}${mark}</div>` +
      `<div class="rev-detail">` +
        `<div class="rev-answered">Your answer: <b>${esc(answeredText)}</b></div>` +
        correctLine +
      `</div>` +
    `</div>`
  );
}

// Human-readable answer label. For multiple-choice, resolves the letter to its
// option text; for student-produced response, returns the raw text.
function answerLabel(q, val) {
  if (val == null || val === "") return null;
  if (q.type === "mcq") {
    const opt = (q.options || []).find((o, i) => String.fromCharCode(65 + i) === String(val).trim().toUpperCase());
    if (opt) return opt.replace(/^[A-D]\)\s*/, "");
    return String(val).toUpperCase();
  }
  return String(val);
}

// ── Results & scoring ────────────────────────────
function isCorrect(q, sel) {
  if (sel == null) return false;
  if (q.type === "spr") return normalizeSpr(sel) === normalizeSpr(q.correct);
  return sel === q.correct;
}
function normalizeSpr(v) {
  if (v == null) return null;
  const s = String(v).trim().toLowerCase().replace(/\s+/g, "");
  if (s === "") return null;
  // Fractions and decimals are equivalent on the real SPR grid: 1/5 === 0.2.
  const frac = s.match(/^([-+]?(?:\d+\.?\d*|\.\d+))\/([-+]?(?:\d+\.?\d*|\.\d+))$/);
  let num = NaN;
  if (frac) {
    const den = parseFloat(frac[2]);
    if (den !== 0) num = parseFloat(frac[1]) / den;
  } else if (/^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(s)) {
    num = parseFloat(s);
  }
  return isNaN(num) ? s : String(Number(num.toPrecision(6)));
}

function finishTest() {
  stopTimer();
  setStep("results");
  saveResultsOnce();
  renderResults();
  showScreen("results");
}

// Pure: recomputes the score from `state.answers`. Safe to call repeatedly.
function computeResults() {
  // raw scores
  let rwCorrect = 0, rwTotal = 0, mthCorrect = 0, mthTotal = 0;
  ["rwModule1", "rwModule2"].forEach((mk) => {
    (test[mk] || []).forEach((q) => {
      rwTotal++;
      if (isCorrect(q, state.answers[`${mk}:${q.n}`])) rwCorrect++;
    });
  });
  ["mathModule1", "mathModule2"].forEach((mk) => {
    (test[mk] || []).forEach((q) => {
      mthTotal++;
      if (isCorrect(q, state.answers[`${mk}:${q.n}`])) mthCorrect++;
    });
  });

  const rows = test.meta.conversionTable;
  // R&W raw -> row.rw range; Math raw -> row.math range
  const rwRow = rows[String(rwCorrect)] || { rw: [400, 400] };
  const mthRow = (rows[String(mthCorrect)] && rows[String(mthCorrect)].math)
    ? rows[String(mthCorrect)].math : [400, 400];
  const midpoint = (a) => a ? Math.round((a[0] + a[1]) / 2) : 400;

  const rwScale = midpoint(rwRow.rw);
  const mthScale = midpoint(mthRow);
  const total = rwScale + mthScale;

  return { total, rwScale, mthScale, rwCorrect, rwTotal, mthCorrect, mthTotal,
           rwRange: rwRow.rw, mathRange: mthRow };
}

// Display only — no writes. Called on every visit to the results screen.
function renderResults() {
  const r = computeResults();
  $("resTotal").textContent = r.total;
  $("resEnglish").textContent = r.rwScale;
  $("resMath").textContent = r.mthScale;
  $("resultsStudent").textContent = `Great work, ${state.name || "student"}!`;
  $("resSummary").innerHTML =
    `Reading &amp; Writing: ${r.rwCorrect}/${r.rwTotal} · Math: ${r.mthCorrect}/${r.mthTotal}<br/>` +
    `R&amp;W scaled 200–800: ${r.rwRange[0]}–${r.rwRange[1]} · Math scaled: ${r.mathRange[0]}–${r.mathRange[1]}`;
}

// Writes — runs exactly once per completed test, so a refresh or a trip back
// from "Review Answers" can never log a duplicate attempt to analytics.
function saveResultsOnce() {
  const { total, rwScale, mthScale, rwCorrect, rwTotal, mthCorrect, mthTotal } = computeResults();
  if (!state.resultsSaved) {
    state.resultsSaved = true;
    state.finishedAt = Date.now();
    state.final = { total, rwScale, mthScale, rwCorrect, rwTotal, mthCorrect, mthTotal };
    // Persist the most recent result so the home dashboard can surface it.
    try {
      localStorage.setItem(RESULT_KEY, JSON.stringify({
        total, rwScale, mthScale, rwCorrect, rwTotal, mthCorrect, mthTotal,
        finishedAt: state.finishedAt,
        testId,
        name: state.name || "Student",
      }));
    } catch (e) { console.warn("[PT] last-result persist failed", e); }
  }
  persist();
  // Tracked separately: auth may not have resolved when the test finished, so
  // this is retried once Firebase is ready. It flips its own flag on success.
  if (!state.firestoreSaved) saveResultsFirestore(rwScale, mthScale, rwCorrect, mthCorrect);
}

async function saveResultsFirestore(rwScale, mthScale, rwCorrect, mthCorrect) {
  if (!K || state.firestoreSaved) return;
  try {
    await K.saveProfile({ mathScore: mthScale, englishScore: rwScale, currentScore: rwScale + mthScale });
    // log each attempt
    const DIFF = "M";
    // Deliberately serial. K.recordAttempt() read-modify-writes totalXP/level on
    // a shared totals doc outside a transaction (sat-analytics.js:138-183), so
    // concurrent calls all read the same value and the last write wins — running
    // these in parallel silently drops nearly all the XP.
    for (const [mk, q] of allQuestionsWithModule()) {
      const sel = state.answers[`${mk}:${q.n}`];
      await K.recordAttempt({
        questionId: `pt${testId}-${mk}-${q.n}`,
        type: q.type || "mcq",
        skillCd: q.skill || q.domain || "_unknown",
        domain: q.domain || "",
        section: q.section || "math",
        difficulty: DIFF,
        assessment: "SAT",
        correct: isCorrect(q, sel),
        timeSpent: 0,
        mode: "fullpractice",
      });
    }
    state.firestoreSaved = true;
    persist();
    console.log("[PT] results saved to Firestore");
  } catch (e) { console.warn("[PT] Firestore save failed", e); }
}
function* allQuestionsWithModule() {
  for (const m of MODULES) for (const q of (test[m.key] || [])) yield [m.key, q];
}

// ── Exit ─────────────────────────────────────────
function exitTest() {
  uiConfirm({
    title: "Exit the test?",
    message: "Your progress will be saved so you can pick up where you left off.",
    confirmLabel: "Exit Test",
    onConfirm: () => {
      stopTimer();
      persist();
      closeMenus();
      // The full-test view lives in an iframe on questions.html. Ask the parent
      // to navigate itself back to the Question Bank (sat/index.html). We post a
      // message first (works even across origins / file://), then, after a short
      // delay, fall back to a direct same-origin top-navigation write so exit
      // works even if the parent's message listener never fires.
      if (window.self !== window.top) {
        const parent = window.parent;
        parent.postMessage({ type: "korah-pt-exit" }, "*");
        setTimeout(() => {
          try {
            const base = parent.location.pathname.replace(/\/[^/]*$/, "");
            parent.location.href = base + "/index.html";
          } catch (e) { /* cross-origin write blocked; message path is the fallback */ }
        }, 250);
      } else {
        // Fallback if the player is ever opened as the top document.
        const base = window.location.pathname.replace(/\/[^/]*$/, "");
        window.location.href = base + "/index.html";
      }
    },
  });
}
function resetAll() {
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
  freshState();
}
function closeMenus() {
  $("menuItems")?.classList.remove("open");
  closeQMenu(); closeRef(); closeAcc(); closeCalc();
}
function openRef() { if (state.step !== "module") return; $("refPopup").classList.add("open"); $("refOverlay").classList.add("open"); }
function closeRef() { $("refPopup").classList.remove("open"); $("refOverlay").classList.remove("open"); }
function openAcc() { $("accPopup").classList.add("open"); $("accOverlay").classList.add("open"); }
function closeAcc() { $("accPopup").classList.remove("open"); $("accOverlay").classList.remove("open"); }

// ── Calculator (Desmos) ─────────────────────────────
// The built-in graphing calculator is only offered during Math modules
// (the button is hidden elsewhere via updateTopBar). The API is lazy-loaded
// from the Desmos CDN on first open so non-math modules never fetch it.
let calcReady = false;
let calcInstance = null;
function openCalc() {
  if (state.step !== "module") return;
  $("calcPopup").classList.add("open");
  $("calcOverlay").classList.add("open");
  if (calcReady) return;
  const s = document.createElement("script");
  s.src = `https://www.desmos.com/api/v1.12/calculator.js?apiKey=${DESMOS_DEMO_API_KEY}`;
  s.onload = () => {
    calcReady = true;
    calcInstance = Desmos.Calculator($("calcEl"), { expressions: true, lockViewport: false });
  };
  document.head.appendChild(s);
}
function closeCalc() { $("calcPopup").classList.remove("open"); $("calcOverlay").classList.remove("open"); }

// ── Draggable popups ─────────────────────────────────
// Lets the reference sheet / calculator popups be repositioned by dragging
// their header, so they don't cover the question. The first drag converts the
// centered transform into explicit left/top (clamped to the viewport).
function makeDraggable(popup) {
  const head = popup.querySelector(".drag-head");
  if (!head) return;
  let dragging = false, ox = 0, oy = 0, startX = 0, startY = 0;
  head.addEventListener("mousedown", (e) => {
    if (e.target.closest(".x-btn")) return;
    dragging = true;
    const r = popup.getBoundingClientRect();
    popup.style.transform = "none";
    popup.style.left = r.left + "px";
    popup.style.top = r.top + "px";
    ox = r.left - e.clientX;
    oy = r.top - e.clientY;
    startX = e.clientX; startY = e.clientY;
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    const pad = 8, vw = window.innerWidth, vh = window.innerHeight;
    const w = popup.offsetWidth, h = popup.offsetHeight;
    let l = e.clientX + ox, t = e.clientY + oy;
    l = Math.min(Math.max(l, pad), vw - w - pad);
    t = Math.min(Math.max(t, pad), vh - h - pad);
    popup.style.left = l + "px";
    popup.style.top = t + "px";
  });
  document.addEventListener("mouseup", () => { dragging = false; });
}

// ── Resizable popups ─────────────────────────────────
// Adds a bottom-right handle so the tool windows can be resized. On resize it
// anchors the top-left and grows/shrinks to the bottom-right, clamped to the
// viewport. `onResize` (e.g. calling Desmos's Calc.resize()) fires on release.
function makeResizable(popup, onResize) {
  const handle = document.createElement("div");
  handle.className = "resize-handle";
  handle.title = "Resize";
  popup.appendChild(handle);
  let resizing = false, sx = 0, sy = 0, sw = 0, sh = 0;
  const minW = 300, minH = 220, pad = 8;
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault(); e.stopPropagation();
    resizing = true; sx = e.clientX; sy = e.clientY;
    sw = popup.offsetWidth; sh = popup.offsetHeight;
    const r = popup.getBoundingClientRect();
    popup.style.transform = "none";
    popup.style.left = r.left + "px";
    popup.style.top = r.top + "px";
    handle.setPointerCapture?.(e.pointerId);
  });
  document.addEventListener("mousemove", (e) => {
    if (!resizing) return;
    const w = Math.min(Math.max(sw + (e.clientX - sx), minW), window.innerWidth - 2 * pad);
    const h = Math.min(Math.max(sh + (e.clientY - sy), minH), window.innerHeight - 2 * pad);
    popup.style.width = w + "px";
    popup.style.height = h + "px";
  });
  document.addEventListener("mouseup", () => {
    if (resizing) { resizing = false; onResize && onResize(); }
  });
}

window.addEventListener("beforeunload", () => { pauseModule(); persist(); });
