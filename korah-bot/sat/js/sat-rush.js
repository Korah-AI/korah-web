// SAT Practice Rush — endless, gamified practice built on the existing
// /api/sat/q + /api/sat/qi routes and window.KorahSATAnalytics.
// UI: MySATPrep-inspired onboarding wizard → Duolingo answer loop → celebration.
(() => {
  const { OPENSAT_CATALOG } = window.KorahSAT;

  // ── HTML sanitize + KaTeX render (mirrors sat-player.js) ──────────────────
  function normalizeSvgUseHrefs(html) {
    return String(html || "").replace(/xlink:href=/g, "href=");
  }
  const SVG_PURIFY_CONFIG = { ADD_TAGS: ["use"], ADD_ATTR: ["href", "xlink:href"] };
  if (window.DOMPurify) {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName && node.tagName.toLowerCase() === "use") {
        for (const attr of ["href", "xlink:href"]) {
          const val = node.getAttribute(attr);
          if (val !== null && !val.startsWith("#")) node.removeAttribute(attr);
        }
      }
    });
  }
  function sanitize(html) {
    if (!window.DOMPurify) return String(html || "");
    return DOMPurify.sanitize(normalizeSvgUseHrefs(html), SVG_PURIFY_CONFIG);
  }
  function setHtml(el, html) {
    el.innerHTML = sanitize(html);
    if (typeof renderMathInElement === "function") {
      try {
        renderMathInElement(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      } catch (e) { /* non-fatal */ }
    }
  }

  // ── Static config ─────────────────────────────────────────────────────────
  const icon = (name, tint) => `<span class="material-icons-round${tint ? " rush-icon-tint-" + tint : ""}">${name}</span>`;

  const SUBJECTS = [
    { key: "math", section: "math", label: "Math", icon: "calculate", desc: "Algebra, advanced math, data analysis, geometry" },
    { key: "english", section: "english", label: "Reading & Writing", icon: "menu_book", desc: "Reading comprehension, grammar, and expression" },
  ];
  const DIFFICULTIES = [{ v: "E", label: "Easy" }, { v: "M", label: "Medium" }, { v: "H", label: "Hard" }];
  const DOMAIN_ICON = {
    H: "functions", P: "calculate", Q: "bar_chart", S: "straighten",
    INI: "lightbulb", CAS: "architecture", EOI: "edit_note", SEC: "spellcheck",
  };
  const CONGRATS = [
    "Nicely done!", "Excellent work!", "Outstanding!", "Great job!", "Well done!",
    "Fantastic!", "Awesome!", "Perfect!", "Brilliant!", "Amazing work!",
    "You nailed it!", "Superb!", "Impressive!", "You're on fire!", "Keep it up!",
  ];

  function normalizeSpr(v) {
    return String(v == null ? "" : v).trim().replace(/\s+/g, "").toLowerCase();
  }

  // ── Selection state (onboarding) ──────────────────────────────────────────
  const sel = {
    subject: null,          // "math" | "english"
    domains: new Set(),     // domain codes
    skills: new Set(),      // skill codes
    difficulties: new Set(),// E/M/H
    randomize: true,
  };

  // ── Session state (player) ────────────────────────────────────────────────
  const rush = {
    pool: [],               // question objects from /api/sat/q
    order: [],              // indices into pool, in play order
    pos: 0,                 // index into order
    selected: null,         // current selected answer / SPR value
    checked: false,         // current question checked?
    streak: 0,
    stats: { answered: 0, correct: 0, xp: 0, streakMax: 0, totalTime: 0 },
    perDomain: {},          // domainName -> { answered, correct }
    qElapsed: 0,
    timerInt: null,
  };

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const $ = (id) => document.getElementById(id);
  const views = { onboarding: $("rushOnboarding"), player: $("rushPlayer"), celebration: $("rushCelebration") };

  // ── Desmos ────────────────────────────────────────────────────────────────
  const rushCalcBtn = $("rushCalcBtn");
  const rushDesmosPanel = $("rushDesmosPanel");
  const rushDesmosContainer = $("rushDesmosContainer");
  let desmosInstance = null;
  let desmosActive = false;

  function initDesmos() {
    if (!rushDesmosContainer || !window.Desmos) return;
    if (!desmosInstance) {
      desmosInstance = Desmos.GraphingCalculator(rushDesmosContainer, {
        expressionsCollapsed: false, border: false, settingsMenu: true,
      });
    } else {
      desmosInstance.resize();
    }
  }

  function destroyDesmos() {
    desmosActive = false;
    if (desmosInstance) { desmosInstance.destroy(); desmosInstance = null; }
    if (rushDesmosContainer) rushDesmosContainer.innerHTML = "";
    if (rushDesmosPanel) rushDesmosPanel.style.display = "none";
    if (rushCalcBtn) rushCalcBtn.classList.remove("is-active");
  }

  function toggleDesmos() {
    desmosActive = !desmosActive;
    if (rushDesmosPanel) rushDesmosPanel.style.display = desmosActive ? "block" : "none";
    if (rushCalcBtn) rushCalcBtn.classList.toggle("is-active", desmosActive);
    if (desmosActive) initDesmos();
  }

  if (rushCalcBtn) rushCalcBtn.addEventListener("click", toggleDesmos);

  function showView(name) {
    Object.entries(views).forEach(([k, el]) => {
      const active = k === name;
      el.classList.toggle("is-active", active);
      el.classList.remove("rush-view-enter");
      if (active) {
        void el.offsetWidth; // restart the entrance animation
        el.classList.add("rush-view-enter");
      }
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ONBOARDING
  // ══════════════════════════════════════════════════════════════════════════
  function subjectSection() {
    return OPENSAT_CATALOG.sections.find((s) => s.key === (sel.subject === "math" ? "math" : "english"));
  }
  function currentDomains() {
    const s = subjectSection();
    return s ? s.domains : [];
  }

  function renderSubjects() {
    $("rushSubjectGrid").innerHTML = SUBJECTS.map((s) => `
      <button class="rush-card ${sel.subject === s.key ? "is-selected" : ""}" data-subject="${s.key}" type="button">
        ${icon(s.icon, "blue")}
        <span class="rush-card-title">${s.label}</span>
        <span class="rush-card-desc">${s.desc}</span>
      </button>`).join("");
    $("rushSubjectNext").disabled = !sel.subject;
  }

  function renderDomains() {
    const domains = currentDomains();
    $("rushDomainGrid").innerHTML = domains.map((d) => {
      const isSel = sel.domains.has(d.code);
      const skills = d.skills || [];
      const skillsHtml = isSel
        ? `<div class="rush-skills">${skills.map((sk) => `
            <div class="rush-skill ${sel.skills.has(sk.code) ? "is-selected" : ""}" data-skill="${sk.code}" data-domain="${d.code}">
              <span class="rush-skill-check material-icons-round">check</span><span>${sk.key}</span>
            </div>`).join("")}</div>`
        : `<div class="rush-skills-preview">${skills.slice(0, 3).map((sk) => `<span>${sk.key}</span>`).join("")}${skills.length > 3 ? `<span>+${skills.length - 3} more</span>` : ""}</div>`;
      return `
        <div class="rush-domain ${isSel ? "is-selected" : ""}" data-domain="${d.code}">
          <div class="rush-domain-head">
            <span class="rush-domain-emoji material-icons-round">${DOMAIN_ICON[d.code] || "menu_book"}</span>
            <span class="rush-domain-name">${d.key}</span>
            <span class="rush-domain-check material-icons-round">check</span>
          </div>
          ${skillsHtml}
        </div>`;
    }).join("");
  }

  function renderDiffs() {
    $("rushDiffGrid").innerHTML = DIFFICULTIES.map((d) => `
      <div class="rush-diff ${sel.difficulties.has(d.v) ? "is-selected" : ""}" data-diff="${d.v}">${d.label}</div>`).join("");
  }

  function refreshDomainNext() {
    const ready = sel.skills.size > 0;
    $("rushDomainNext").disabled = !ready;
    $("rushDomainHint").hidden = ready;
  }
  function refreshStartState() {
    const ready = sel.difficulties.size > 0;
    $("rushStart").disabled = !ready;
    $("rushDiffHint").hidden = ready;
  }

  // ── Animated wizard step navigation ─────────────────────────────────────────
  const STEP_IDS = ["rushStep1", "rushStep2", "rushStep3"];
  let currentStep = 1;

  function updateStepDots() {
    const dots = $("rushStepDots").children;
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle("is-active", i === currentStep - 1);
      dots[i].classList.toggle("is-done", i < currentStep - 1);
    }
  }

  function goToStep(target, dir) {
    if (target === currentStep) return;
    const fromEl = $(STEP_IDS[currentStep - 1]);
    const toEl = $(STEP_IDS[target - 1]);
    // Track current step on the section element for CSS centering.
    $("rushOnboarding").dataset.step = target;

    // Restore stagger animation for fresh step renders.
    if (target === 2) { $("rushDomainGrid").classList.add("rush-stagger"); renderDomains(); }
    if (target === 3) { $("rushDiffGrid").classList.add("rush-stagger"); renderDiffs(); }

    fromEl.classList.remove("anim-in-right", "anim-in-left");
    fromEl.classList.add(dir > 0 ? "anim-out-left" : "anim-out-right");
    setTimeout(() => {
      fromEl.hidden = true;
      fromEl.classList.remove("anim-out-left", "anim-out-right");
      toEl.hidden = false;
      void toEl.offsetWidth; // force reflow so the incoming animation restarts
      toEl.classList.remove("anim-in-right", "anim-in-left");
      toEl.classList.add(dir > 0 ? "anim-in-right" : "anim-in-left");
    }, 240);

    currentStep = target;
    updateStepDots();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Onboarding events ───────────────────────────────────────────────────────

  // Helper: update a single domain card's selected state + skills section in-place.
  function patchDomainCard(domEl, code) {
    const isSel = sel.domains.has(code);
    const domain = currentDomains().find((d) => d.code === code);
    const skills = domain?.skills || [];
    domEl.classList.toggle("is-selected", isSel);
    const existing = domEl.querySelector(".rush-skills, .rush-skills-preview");
    const previewHtml = `<div class="rush-skills-preview">${skills.slice(0, 3).map((sk) => `<span>${sk.key}</span>`).join("")}${skills.length > 3 ? `<span>+${skills.length - 3} more</span>` : ""}</div>`;
    const skillsHtml = `<div class="rush-skills">${skills.map((sk) => `
        <div class="rush-skill ${sel.skills.has(sk.code) ? "is-selected" : ""}" data-skill="${sk.code}" data-domain="${code}">
          <span class="rush-skill-check material-icons-round">check</span><span>${sk.key}</span>
        </div>`).join("")}</div>`;

    if (!isSel && existing?.classList.contains("rush-skills")) {
      // Closing: animate out, then swap to preview after the animation.
      existing.classList.add("is-closing");
      const ref = existing;
      setTimeout(() => { if (ref.parentNode) ref.outerHTML = previewHtml; }, 210);
    } else {
      if (existing) existing.outerHTML = isSel ? skillsHtml : previewHtml;
      else domEl.insertAdjacentHTML("beforeend", isSel ? skillsHtml : previewHtml);
    }
  }

  $("rushSubjectGrid").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-subject]");
    if (!btn) return;
    sel.subject = btn.dataset.subject;
    sel.domains.clear(); sel.skills.clear();
    // In-place toggle — no full re-render so the stagger animation doesn't flash.
    $("rushSubjectGrid").querySelectorAll("[data-subject]").forEach((b) =>
      b.classList.toggle("is-selected", b.dataset.subject === sel.subject));
    $("rushSubjectNext").disabled = false;
  });
  $("rushSubjectNext").addEventListener("click", () => { if (sel.subject) goToStep(2, 1); });

  $("rushDomainGrid").addEventListener("click", (e) => {
    const skillEl = e.target.closest("[data-skill]");
    if (skillEl) {
      e.stopPropagation();
      const code = skillEl.dataset.skill;
      if (sel.skills.has(code)) sel.skills.delete(code); else sel.skills.add(code);
      // In-place toggle on the skill row only.
      skillEl.classList.toggle("is-selected", sel.skills.has(code));
      refreshDomainNext();
      return;
    }
    const domEl = e.target.closest(".rush-domain");
    if (!domEl) return;
    const code = domEl.dataset.domain;
    const domain = currentDomains().find((d) => d.code === code);
    const skillCodes = (domain?.skills || []).map((s) => s.code);
    if (sel.domains.has(code)) {
      sel.domains.delete(code);
      skillCodes.forEach((c) => sel.skills.delete(c));
    } else {
      sel.domains.add(code);
      skillCodes.forEach((c) => sel.skills.add(c));
    }
    // Patch only the clicked card — no grid re-render.
    patchDomainCard(domEl, code);
    refreshDomainNext();
  });
  $("rushDomainNext").addEventListener("click", () => { if (sel.skills.size > 0) goToStep(3, 1); });
  $("rushDomainBack").addEventListener("click", () => goToStep(1, -1));

  $("rushDiffGrid").addEventListener("click", (e) => {
    const el = e.target.closest("[data-diff]");
    if (!el) return;
    const v = el.dataset.diff;
    if (sel.difficulties.has(v)) sel.difficulties.delete(v); else sel.difficulties.add(v);
    // In-place toggle — no full re-render.
    el.classList.toggle("is-selected", sel.difficulties.has(v));
    refreshStartState();
  });
  $("rushDiffBack").addEventListener("click", () => goToStep(2, -1));

  $("rushSelectAll").addEventListener("click", () => {
    currentDomains().forEach((d) => {
      sel.domains.add(d.code);
      (d.skills || []).forEach((s) => sel.skills.add(s.code));
    });
    // Full re-render OK here (reset action), but strip stagger so cards don't flash.
    $("rushDomainGrid").classList.remove("rush-stagger");
    renderDomains(); refreshDomainNext();
  });
  $("rushClearAll").addEventListener("click", () => {
    sel.domains.clear(); sel.skills.clear();
    $("rushDomainGrid").classList.remove("rush-stagger");
    renderDomains(); refreshDomainNext();
  });
  $("rushRandomize").addEventListener("change", (e) => { sel.randomize = e.target.checked; });

  $("rushStart").addEventListener("click", () => { if (sel.difficulties.size > 0) startSession(); });

  // ══════════════════════════════════════════════════════════════════════════
  //  FETCH + SESSION
  // ══════════════════════════════════════════════════════════════════════════
  function buildQueryUrl() {
    const s = subjectSection();
    const domainCodes = [...sel.domains];
    const skillCodes = [...sel.skills];
    const diffs = [...sel.difficulties];
    const params = new URLSearchParams();
    params.set("sections", s.key);
    params.set("domains", domainCodes.length ? domainCodes.join(",") : "any");
    params.set("skills", skillCodes.length ? skillCodes.join(",") : "any");
    params.set("difficulties", diffs.length ? diffs.join(",") : "any");
    params.set("assessment", "SAT");
    params.set("limit", "none");
    if (sel.randomize) params.set("random", "1");
    return `/api/sat/q?${params.toString()}`;
  }

  async function startSession() {
    // reset session state
    rush.pool = []; rush.order = []; rush.pos = 0;
    rush.selected = null; rush.checked = false; rush.streak = 0;
    rush.stats = { answered: 0, correct: 0, xp: 0, streakMax: 0, totalTime: 0 };
    rush.perDomain = {};

    showView("player");
    destroyDesmos();
    if (rushCalcBtn) rushCalcBtn.style.display = sel.subject === "math" ? "flex" : "none";
    $("rushLoading").hidden = false;
    $("rushQuestionArea").hidden = true;
    $("rushErrorBox").hidden = true;
    updateStreak();

    let payload;
    try {
      const resp = await fetch(buildQueryUrl(), { headers: { Accept: "application/json" } });
      if (!resp.ok) throw new Error(`status ${resp.status}`);
      payload = await resp.json();
    } catch (err) {
      console.error("[Rush] fetch failed", err);
      return showFetchError();
    }

    const questions = Array.isArray(payload?.questions) ? payload.questions : [];
    if (questions.length === 0) return showEmpty();

    rush.pool = questions;
    rush.order = questions.map((_, i) => i);
    if (sel.randomize) shuffle(rush.order);

    $("rushLoading").hidden = true;
    $("rushQuestionArea").hidden = false;
    renderCurrent();
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  function showFetchError() {
    $("rushLoading").hidden = true;
    const box = $("rushErrorBox");
    box.hidden = false;
    box.innerHTML = `<p>Couldn't load questions. Check your connection and try again.</p>
      <button class="rush-btn" style="max-width:16rem;margin:1rem auto 0;" onclick="location.reload()">Retry</button>`;
  }
  function showEmpty() {
    $("rushLoading").hidden = true;
    const box = $("rushErrorBox");
    box.hidden = false;
    box.innerHTML = `<p>No questions matched those filters. Try adding more domains or difficulties.</p>
      <button id="rushEmptyBack" class="rush-btn is-ghost" style="max-width:16rem;margin:1rem auto 0;">Back to setup</button>`;
    $("rushEmptyBack").addEventListener("click", () => showView("onboarding"));
  }

  // ── Lazy detail hydration ──────────────────────────────────────────────────
  const detailPromises = new Map();
  async function ensureDetail(poolIdx) {
    const q = rush.pool[poolIdx];
    if (!q || q.loaded) return;
    if (detailPromises.has(poolIdx)) return detailPromises.get(poolIdx);
    const key = q.detailKey || q.id;
    if (!key) return;
    const p = (async () => {
      try {
        const resp = await fetch(`/api/sat/qi?id=${encodeURIComponent(key)}`, { headers: { Accept: "application/json" } });
        if (!resp.ok) throw new Error(`status ${resp.status}`);
        const body = await resp.json();
        Object.assign(q, {
          type: body.type || q.type,
          paragraph: body.paragraph || "",
          stem: body.stem || "",
          options: Array.isArray(body.options) ? body.options : [],
          correctAnswer: body.correctAnswer || "",
          explanation: body.explanation || "",
          loaded: true,
        });
        if (currentPoolIdx() === poolIdx) renderCurrent();
      } catch (err) {
        console.error("[Rush] detail failed", err);
        q._loadError = true;
        if (currentPoolIdx() === poolIdx) renderCurrent();
      } finally {
        detailPromises.delete(poolIdx);
      }
    })();
    detailPromises.set(poolIdx, p);
    return p;
  }
  function prefetchAhead(radius = 3) {
    for (let i = 1; i <= radius; i++) {
      const o = rush.pos + i;
      if (o < rush.order.length) ensureDetail(rush.order[o]);
    }
  }

  function currentPoolIdx() { return rush.order[rush.pos]; }
  function currentQ() { return rush.pool[currentPoolIdx()]; }

  // ── Timer (per question) ────────────────────────────────────────────────────
  function startTimer() {
    rush.qElapsed = 0;
    updateTimerDisplay();
    if (rush.timerInt) clearInterval(rush.timerInt);
    rush.timerInt = setInterval(() => { rush.qElapsed++; updateTimerDisplay(); }, 1000);
  }
  function stopTimer() { if (rush.timerInt) { clearInterval(rush.timerInt); rush.timerInt = null; } }
  function updateTimerDisplay() {
    const m = Math.floor(rush.qElapsed / 60);
    const s = String(rush.qElapsed % 60).padStart(2, "0");
    $("rushTimer").textContent = `${m}:${s}`;
  }

  function updateStreak() {
    $("rushStreakNum").textContent = rush.streak;
    $("rushStreakPill").style.opacity = rush.streak > 0 ? "1" : "0.45";
  }
  function updateProgress() {
    const total = rush.order.length || 1;
    $("rushProgressFill").style.width = `${Math.min(100, (rush.pos / total) * 100)}%`;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RENDER QUESTION
  // ══════════════════════════════════════════════════════════════════════════
  function renderCurrent() {
    const q = currentQ();
    if (!q) return finishSession();

    // Reset transient answer + button state up front so nothing from the
    // previous question flashes while the next one hydrates.
    rush.selected = null;
    rush.checked = false;
    const checkBtn = $("rushCheckBtn");
    checkBtn.textContent = "Check";
    checkBtn.classList.remove("is-green");
    checkBtn.disabled = true;
    $("rushExplanation").className = "rush-explanation is-hidden";
    $("rushExplanation").innerHTML = "";

    updateProgress();

    if (!q.loaded) {
      ensureDetail(currentPoolIdx());
      $("rushQMeta").innerHTML = "";
      $("rushParagraph").classList.add("is-hidden");
      $("rushStem").innerHTML = `<div class="rush-loading" style="padding:2rem;"><div class="rush-spinner"></div></div>`;
      $("rushChoices").innerHTML = "";
      return;
    }
    if (q._loadError) {
      $("rushStem").innerHTML = `<p style="color:var(--tx2)">This question failed to load. Skipping…</p>`;
      $("rushChoices").innerHTML = "";
      setTimeout(nextQuestion, 700);
      return;
    }

    // Meta chips
    const diff = q.difficulty || "";
    const diffLabel = { E: "Easy", M: "Medium", H: "Hard" }[diff] || "";
    $("rushQMeta").innerHTML = `
      ${q.domain ? `<span class="rush-chip">${q.domain}</span>` : ""}
      ${diffLabel ? `<span class="rush-chip is-diff-${diff}">${diffLabel}</span>` : ""}`;

    // Paragraph / stimulus
    if (q.paragraph) {
      setHtml($("rushParagraph"), q.paragraph);
      $("rushParagraph").classList.remove("is-hidden");
    } else {
      $("rushParagraph").innerHTML = "";
      $("rushParagraph").classList.add("is-hidden");
    }

    // Stem
    setHtml($("rushStem"), q.stem);

    // Choices
    const isSpr = q.type === "spr";
    if (isSpr) {
      $("rushChoices").innerHTML = `
        <input id="rushSprInput" class="rush-spr-input" type="text" placeholder="Type your answer" autocomplete="off" autocorrect="off" spellcheck="false"/>`;
      $("rushSprInput").addEventListener("input", (e) => {
        rush.selected = e.target.value;
        $("rushCheckBtn").disabled = !String(rush.selected || "").trim();
      });
      $("rushSprInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && String(rush.selected || "").trim()) checkAnswer();
      });
    } else {
      renderChoices(q);
    }

    startTimer();
    prefetchAhead();
  }

  function renderChoices(q) {
    $("rushChoices").innerHTML = (q.options || []).map((opt) => `
      <button class="rush-choice" data-key="${opt.key}" type="button">
        <span class="rush-choice-key">${opt.key}</span>
        <span class="rush-choice-text">${sanitize(opt.text)}</span>
      </button>`).join("");
    // render math inside choices
    $("rushChoices").querySelectorAll(".rush-choice-text").forEach((el) => {
      if (typeof renderMathInElement === "function") {
        try { renderMathInElement(el, { delimiters: [{ left: "\\(", right: "\\)", display: false }, { left: "$", right: "$", display: false }], throwOnError: false }); } catch (e) {}
      }
    });
  }

  // Choice selection (event delegation)
  $("rushChoices").addEventListener("click", (e) => {
    const btn = e.target.closest(".rush-choice");
    if (!btn || rush.checked) return;
    rush.selected = btn.dataset.key;
    $("rushChoices").querySelectorAll(".rush-choice").forEach((c) => c.classList.toggle("is-selected", c === btn));
    $("rushCheckBtn").disabled = false;
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  CHECK / ADVANCE
  // ══════════════════════════════════════════════════════════════════════════
  $("rushCheckBtn").addEventListener("click", () => {
    if (!rush.checked) checkAnswer();
    else nextQuestion();
  });

  function checkAnswer() {
    const q = currentQ();
    if (!q || rush.selected == null || rush.checked) return;
    rush.checked = true;
    stopTimer();

    const isSpr = q.type === "spr";
    const correct = isSpr
      ? normalizeSpr(rush.selected) === normalizeSpr(q.correctAnswer)
      : rush.selected === q.correctAnswer;

    // Visual feedback
    if (isSpr) {
      const inp = $("rushSprInput");
      if (inp) { inp.readOnly = true; inp.classList.add(correct ? "is-correct" : "is-wrong"); }
    } else {
      $("rushChoices").querySelectorAll(".rush-choice").forEach((c) => {
        c.disabled = true;
        if (c.dataset.key === q.correctAnswer) c.classList.add("is-correct");
        else if (c.dataset.key === rush.selected) c.classList.add("is-wrong");
      });
    }

    // Explanation
    const exp = $("rushExplanation");
    exp.className = `rush-explanation ${correct ? "is-correct" : "is-wrong"}`;
    setHtml(exp, `<strong>${correct ? "Correct." : `Correct answer: ${q.correctAnswer}`}</strong>${q.explanation || ""}`);

    // Stats
    rush.stats.answered++;
    rush.stats.totalTime += rush.qElapsed;
    const dName = q.domain || "Other";
    rush.perDomain[dName] = rush.perDomain[dName] || { answered: 0, correct: 0 };
    rush.perDomain[dName].answered++;
    if (correct) {
      rush.stats.correct++;
      rush.perDomain[dName].correct++;
      rush.streak++;
      rush.stats.streakMax = Math.max(rush.stats.streakMax, rush.streak);
    } else {
      rush.streak = 0;
    }
    updateStreak();

    // Analytics (XP, skill stats, missed-question tracking)
    if (window.KorahSATAnalytics) {
      window.KorahSATAnalytics.recordAttempt({
        questionId: q.detailKey || q.id,
        legacyQuestionId: q.id,
        detailKey: q.detailKey || q.id,
        type: q.type || "",
        skillCd: q.skillCd || "",
        domain: q.domain || "",
        section: q.section || "",
        difficulty: q.difficulty || "",
        assessment: "SAT",
        correct,
        timeSpent: rush.qElapsed,
      }).then((res) => {
        if (res && typeof res.xp === "number") rush.stats.xp += res.xp;
      }).catch((e) => console.warn("[Rush] recordAttempt failed", e));
    }

    // Continue button
    const btn = $("rushCheckBtn");
    btn.textContent = "Continue";
    btn.classList.add("is-green");
    btn.disabled = false;

    if (correct) showSuccessOverlay();
  }

  function nextQuestion() {
    hideOverlay();
    if (rush.pos >= rush.order.length - 1) return finishSession();
    rush.pos++;
    renderCurrent();
  }

  // ── Success overlay ─────────────────────────────────────────────────────────
  function showSuccessOverlay() {
    const card = $("rushOverlayCard");
    card.className = "rush-overlay-card is-success";
    const em = $("rushOverlayEmoji");
    em.textContent = rush.streak >= 5 ? "local_fire_department" : "celebration";
    em.className = `rush-overlay-emoji material-icons-round ${rush.streak >= 5 ? "rush-icon-tint-amber" : "rush-icon-tint-green"}`;
    $("rushOverlayTitle").className = "rush-overlay-title is-success";
    $("rushOverlayTitle").textContent = rush.streak >= 5
      ? `${rush.streak} in a row!`
      : CONGRATS[Math.floor(Math.random() * CONGRATS.length)];
    $("rushOverlay").classList.add("is-open");
    fireConfetti();
  }
  function hideOverlay() { $("rushOverlay").classList.remove("is-open"); }
  $("rushOverlayContinue").addEventListener("click", nextQuestion);

  // ── Confetti (lightweight, dependency-free) ─────────────────────────────────
  function fireConfetti() {
    const colors = ["#55a7eb", "#7c3aed", "#22c55e", "#f59e0b", "#ef4444"];
    const layer = document.createElement("div");
    layer.className = "rush-confetti";
    for (let i = 0; i < 40; i++) {
      const s = document.createElement("span");
      s.style.left = Math.random() * 100 + "vw";
      s.style.background = colors[Math.floor(Math.random() * colors.length)];
      s.style.animationDuration = 1.2 + Math.random() * 1.1 + "s";
      s.style.animationDelay = Math.random() * 0.2 + "s";
      s.style.transform = `rotate(${Math.random() * 360}deg)`;
      layer.appendChild(s);
    }
    document.body.appendChild(layer);
    setTimeout(() => layer.remove(), 2600);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  EXIT / FINISH
  // ══════════════════════════════════════════════════════════════════════════
  $("rushExitBtn").addEventListener("click", () => $("rushExitModal").classList.add("is-open"));
  $("rushExitStay").addEventListener("click", () => $("rushExitModal").classList.remove("is-open"));
  $("rushExitConfirm").addEventListener("click", () => {
    $("rushExitModal").classList.remove("is-open");
    stopTimer();
    if (rush.stats.answered > 0) finishSession();
    else { resetOnboarding(); showView("onboarding"); }
  });
  $("rushFinishBtn").addEventListener("click", finishSession);

  function finishSession() {
    stopTimer();
    destroyDesmos();
    hideOverlay();
    renderCelebration();
    showView("celebration");
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CELEBRATION
  // ══════════════════════════════════════════════════════════════════════════
  function renderCelebration() {
    const { answered, correct, xp, streakMax, totalTime } = rush.stats;
    const accuracy = answered > 0 ? Math.round((correct / answered) * 100) : 0;
    const mins = Math.floor(totalTime / 60);
    const secs = totalTime % 60;
    const timeStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

    $("rushCelebrateSub").textContent = answered > 0
      ? `You answered ${answered} question${answered === 1 ? "" : "s"}. Keep the streak going!`
      : "You didn't answer any questions this time.";

    const stats = [
      { icon: "track_changes", tint: "blue", value: `${accuracy}%`, label: "Accuracy" },
      { icon: "check_circle", tint: "green", value: `${correct}/${answered}`, label: "Correct" },
      { icon: "schedule", tint: "purple", value: timeStr, label: "Time" },
      { icon: "bolt", tint: "amber", value: (xp >= 0 ? "+" : "") + xp, label: "XP earned" },
      { icon: "local_fire_department", tint: "red", value: streakMax, label: "Best streak" },
      { icon: "library_books", tint: "blue", value: answered, label: "Answered" },
    ];
    $("rushStatGrid").innerHTML = stats.map((s) => `
      <div class="rush-stat">
        <span class="rush-stat-icon material-icons-round rush-icon-tint-${s.tint}">${s.icon}</span>
        <div class="rush-stat-value">${s.value}</div>
        <div class="rush-stat-label">${s.label}</div>
      </div>`).join("");

    // Per-domain breakdown
    const entries = Object.entries(rush.perDomain).filter(([, v]) => v.answered > 0);
    if (entries.length > 0) {
      $("rushBreakdown").innerHTML = `<h3>By domain</h3>` + entries.map(([name, v]) => {
        const pct = Math.round((v.correct / v.answered) * 100);
        return `
          <div class="rush-bd-row">
            <div class="rush-bd-head"><span>${name}</span><span>${v.correct}/${v.answered} · ${pct}%</span></div>
            <div class="rush-bd-bar"><div class="rush-bd-fill" style="width:${pct}%"></div></div>
          </div>`;
      }).join("");
      $("rushBreakdown").hidden = false;
    } else {
      $("rushBreakdown").innerHTML = "";
      $("rushBreakdown").hidden = true;
    }
  }

  $("rushAgainBtn").addEventListener("click", () => { resetOnboarding(); showView("onboarding"); });
  $("rushToBankBtn").addEventListener("click", () => {
    if (window.KorahTransitions) window.KorahTransitions.go("./index.html");
    else window.location.href = "./index.html";
  });

  function resetOnboarding() {
    destroyDesmos();
    STEP_IDS.forEach((id, i) => {
      const el = $(id);
      el.hidden = i !== 0;
      el.classList.remove("anim-in-right", "anim-in-left", "anim-out-left", "anim-out-right");
    });
    currentStep = 1;
    $("rushOnboarding").dataset.step = 1;
    updateStepDots();
    renderSubjects();
  }

  // ── Init ────────────────────────────────────────────────────────────────────
  $("rushOnboarding").dataset.step = 1;
  renderSubjects();
  updateStepDots();
  updateStreak();
})();
