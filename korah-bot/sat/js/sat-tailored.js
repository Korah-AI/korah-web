(function () {
  "use strict";

  const MIN_RANKABLE_ATTEMPTS = 3;
  const MAX_PRIORITIES = 4;
  const RECENT_ATTEMPT_LIMIT = 50;
  const DIFFICULTIES = ["E", "M", "H"];
  const DIFFICULTY_LABELS = { E: "Easy", M: "Medium", H: "Hard" };
  // Difficulty is meaningful state, so the chips carry the house tones.
  const DIFFICULTY_TONES = { E: "tone-green", M: "tone-amber", H: "tone-red" };

  const state = {
    uid: "",
    initialized: false,
    eventsBound: false,
    normalized: [],
    ranked: [],
    limited: [],
    selected: [],
    allocations: [],
    totalQuestions: 0,
    confirmedSelection: null,
    recentIds: new Set(),
  };

  const byId = (id) => document.getElementById(id);

  function safeNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  }

  function clampInteger(value, min, max) {
    return Math.min(max, Math.max(min, Math.floor(safeNumber(value))));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function catalogSkills() {
    const catalog = window.KorahSAT?.OPENSAT_CATALOG;
    const map = new Map();
    for (const section of catalog?.sections || []) {
      for (const domain of section.domains || []) {
        for (const skill of domain.skills || []) {
          map.set(skill.code, {
            skillCd: skill.code,
            skillName: skill.key,
            domain: domain.key,
            domainCode: domain.code,
            section: section.key,
          });
        }
      }
    }
    return map;
  }

  function normalizeDifficulty(raw) {
    const attempts = Math.max(0, Math.floor(safeNumber(raw?.attempts)));
    const correct = clampInteger(raw?.correct, 0, attempts);
    return { attempts, correct, accuracy: attempts ? correct / attempts : null };
  }

  function normalizeStats(records) {
    const catalog = catalogSkills();
    const normalized = [];
    for (const raw of Array.isArray(records) ? records : []) {
      const meta = catalog.get(raw?.skillCd);
      if (!meta || raw?.skillCd === "_unknown") continue;
      const attempts = Math.max(0, Math.floor(safeNumber(raw?.attempts)));
      if (!attempts) continue;
      const correct = clampInteger(raw?.correct, 0, attempts);
      const incorrect = attempts - correct;
      const accuracy = correct / attempts;
      const smoothedMissRate = (incorrect + 2) / (attempts + 4);
      const confidence = Math.min(attempts / 10, 1);
      const priorityScore = 100 * smoothedMissRate * (0.7 + 0.3 * confidence);
      normalized.push({
        ...meta,
        attempts,
        correct,
        incorrect,
        accuracy,
        smoothedMissRate,
        confidence,
        priorityScore,
        lastSeen: raw?.lastSeen || "",
        byDifficulty: {
          E: normalizeDifficulty(raw?.byDifficulty?.E),
          M: normalizeDifficulty(raw?.byDifficulty?.M),
          H: normalizeDifficulty(raw?.byDifficulty?.H),
        },
      });
    }
    return normalized;
  }

  function rankSkills(records) {
    return records
      .filter((skill) => skill.attempts >= MIN_RANKABLE_ATTEMPTS)
      .sort((a, b) =>
        b.priorityScore - a.priorityScore ||
        b.attempts - a.attempts ||
        a.skillCd.localeCompare(b.skillCd)
      );
  }

  function targetDifficulty(skill) {
    const easy = skill.byDifficulty.E;
    const medium = skill.byDifficulty.M;
    const hard = skill.byDifficulty.H;
    if (easy.attempts >= 3 && easy.accuracy < 0.7) return "E";
    if (medium.attempts >= 3 && medium.accuracy < 0.7) return "M";
    if (hard.attempts >= 3 && hard.accuracy < 0.7) {
      return medium.attempts >= 3 && medium.accuracy >= 0.7 ? "H" : "M";
    }

    const supported = DIFFICULTIES.filter((difficulty) => skill.byDifficulty[difficulty].attempts >= 3);
    if (supported.length) {
      const hardest = supported[supported.length - 1];
      const next = DIFFICULTIES[Math.min(DIFFICULTIES.indexOf(hardest) + 1, DIFFICULTIES.length - 1)];
      if (next === "H" && medium.attempts < 3) return "M";
      return next;
    }
    return skill.accuracy < 0.5 ? "E" : "M";
  }

  function distributeQuestionCounts(skillCount) {
    if (skillCount <= 0) return [];
    if (skillCount === 1) return [10];
    const total = 20;
    const base = Math.floor(total / skillCount);
    const remainder = total % skillCount;
    return Array.from({ length: skillCount }, (_, index) => base + (index < remainder ? 1 : 0));
  }

  function allocateByRatio(total, target) {
    const ratios = target === "E"
      ? { E: 0.6, M: 0.4, H: 0 }
      : target === "H"
        ? { E: 0, M: 0.4, H: 0.6 }
        : { E: 0.2, M: 0.6, H: 0.2 };
    const exact = DIFFICULTIES.map((difficulty) => ({
      difficulty,
      exact: total * ratios[difficulty],
      count: Math.floor(total * ratios[difficulty]),
    }));
    let used = exact.reduce((sum, item) => sum + item.count, 0);
    exact
      .slice()
      .sort((a, b) => (b.exact - b.count) - (a.exact - a.count) || DIFFICULTIES.indexOf(a.difficulty) - DIFFICULTIES.indexOf(b.difficulty))
      .forEach((item) => {
        if (used >= total) return;
        const original = exact.find((entry) => entry.difficulty === item.difficulty);
        original.count += 1;
        used += 1;
      });
    return Object.fromEntries(exact.map((item) => [item.difficulty, item.count]));
  }

  function buildAllocations(selected) {
    const counts = distributeQuestionCounts(selected.length);
    return selected.map((skill, index) => {
      const target = targetDifficulty(skill);
      return { skill, target, count: counts[index], mix: allocateByRatio(counts[index], target) };
    });
  }

  function difficultyTotals(allocations) {
    const totals = { E: 0, M: 0, H: 0 };
    for (const allocation of allocations) {
      for (const difficulty of DIFFICULTIES) totals[difficulty] += allocation.mix[difficulty] || 0;
    }
    return totals;
  }

  function sectionLabel(section) {
    return section === "math" ? "Math" : "Reading and Writing";
  }

  function formatLastSeen(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function recommendationText(skill, index) {
    return `You missed ${skill.incorrect} of ${skill.attempts} questions, so this is ${index === 0 ? "the first skill to practice" : `priority ${index + 1}`}.`;
  }

  function renderPriorityCards() {
    byId("tailoredPriorityList").innerHTML = state.selected.map((skill, index) => {
      const allocation = state.allocations.find((item) => item.skill.skillCd === skill.skillCd);
      const accuracy = Math.round(skill.accuracy * 100);
      const lastSeen = formatLastSeen(skill.lastSeen);
      return `
        <li class="tailored-priority-card is-${escapeHtml(skill.section)}">
          <div class="tailored-card-top">
            <span class="tailored-rank">${index + 1}</span>
            <div class="tailored-card-title">
              <h3>${escapeHtml(skill.skillName)}</h3>
              <div class="tailored-card-meta">${escapeHtml(skill.domain)} | ${sectionLabel(skill.section)}</div>
            </div>
            <div class="tailored-plan"><strong>${allocation.count}</strong><span>questions | ${DIFFICULTY_LABELS[allocation.target]}</span></div>
          </div>
          <div class="tailored-result-line">
            <span>${accuracy}% accuracy</span>
            <span>${skill.correct} of ${skill.attempts} correct</span>
            ${lastSeen ? `<span>Last practiced ${escapeHtml(lastSeen)}</span>` : ""}
          </div>
          <p class="tailored-explanation">${escapeHtml(recommendationText(skill, index))}</p>
        </li>`;
    }).join("");
  }

  function renderLimitedSkills() {
    const section = byId("tailoredLimited");
    const limited = state.limited
      .slice()
      .sort((a, b) => b.attempts - a.attempts || a.skillCd.localeCompare(b.skillCd));
    section.hidden = !limited.length;
    byId("tailoredLimitedList").innerHTML = limited.map((skill) => `
      <li class="tailored-limited-row is-${escapeHtml(skill.section)}">
        <div class="tailored-limited-name">${escapeHtml(skill.skillName)}</div>
        <div class="tailored-limited-meta">${escapeHtml(skill.domain)} | ${sectionLabel(skill.section)}</div>
        <div class="tailored-limited-numbers">${skill.correct} of ${skill.attempts} answered correctly</div>
      </li>`).join("");
  }

  function renderSetSummary() {
    byId("tailoredSetTotal").textContent = state.totalQuestions;
    byId("tailoredSetSkills").innerHTML = state.allocations.map((item) => `
      <div class="tailored-set-skill"><strong>${escapeHtml(item.skill.skillName)}</strong><span>${item.count}</span></div>
    `).join("");
    const totals = difficultyTotals(state.allocations);
    byId("tailoredSetDifficulty").innerHTML = DIFFICULTIES
      .filter((difficulty) => totals[difficulty] > 0)
      .map((difficulty) => `<span class="tailored-diff ${DIFFICULTY_TONES[difficulty]}"><strong>${DIFFICULTY_LABELS[difficulty]}</strong> ${totals[difficulty]}</span>`)
      .join("");
    byId("tailoredSetNote").textContent = state.selected.length === 1
      ? "This set has 10 questions. Keep practicing other skills to unlock a broader recommendation."
      : "Korah will prefer questions you have not answered recently and keep this set stable until your results change.";
  }

  function renderSourceLine() {
    const totalAttempts = state.normalized.reduce((sum, skill) => sum + skill.attempts, 0);
    byId("tailoredSource").textContent = `${state.totalQuestions} questions across ${state.selected.length} priorit${state.selected.length === 1 ? "y" : "ies"}, based on ${totalAttempts} SAT answer${totalAttempts === 1 ? "" : "s"}.`;
  }

  function showReady() {
    byId("tailoredLoading").hidden = true;
    byId("tailoredState").hidden = true;
    byId("tailoredReady").hidden = false;
    renderSourceLine();
    renderPriorityCards();
    renderSetSummary();
    renderLimitedSkills();
    announce("Your tailored SAT priorities are ready.");
  }

  function showState({ icon, title, text, retry = false }) {
    byId("tailoredLoading").hidden = true;
    byId("tailoredReady").hidden = true;
    byId("tailoredState").hidden = false;
    byId("tailoredStateIcon").textContent = icon;
    byId("tailoredStateTitle").textContent = title;
    byId("tailoredStateText").textContent = text;
    byId("tailoredRetry").hidden = !retry;
    announce(title);
  }

  function announce(message) {
    byId("tailoredLive").textContent = message;
  }

  async function loadData() {
    byId("tailoredLoading").hidden = false;
    byId("tailoredState").hidden = true;
    byId("tailoredReady").hidden = true;
    state.confirmedSelection = null;
    try {
      const analytics = window.KorahSATAnalytics;
      if (!analytics) throw new Error("SAT analytics is not ready");
      const [stats, recentAttempts] = await Promise.all([
        analytics.getAllSkillStats(),
        analytics.getRecentAttempts(RECENT_ATTEMPT_LIMIT),
      ]);
      state.normalized = normalizeStats(stats);
      state.ranked = rankSkills(state.normalized);
      state.limited = state.normalized.filter((skill) => skill.attempts < MIN_RANKABLE_ATTEMPTS);
      state.recentIds = new Set((recentAttempts || []).map((attempt) => attempt.questionId || attempt.detailKey).filter(Boolean));

      if (!state.normalized.length) {
        showState({
          icon: "insights",
          title: "We need a little practice history",
          text: "Answer at least three questions in a skill before Korah ranks it as a practice priority. Start in Question Bank or Practice Rush, then come back here.",
        });
        return;
      }
      if (!state.ranked.length) {
        showState({
          icon: "hourglass_top",
          title: "Korah is still learning about you",
          text: "Keep practicing in Question Bank or Practice Rush, then return here for a tailored recommendation.",
        });
        return;
      }

      state.selected = state.ranked.slice(0, MAX_PRIORITIES);
      state.allocations = buildAllocations(state.selected);
      state.totalQuestions = state.allocations.reduce((sum, allocation) => sum + allocation.count, 0);
      showReady();
    } catch (error) {
      console.error("[Tailored] failed to load analytics", error);
      showState({
        icon: "cloud_off",
        title: "We could not load your SAT activity",
        text: "Check your connection and try again. Korah will not invent recommendations when your real data is unavailable.",
        retry: true,
      });
    }
  }

  function statsFingerprint() {
    return state.selected.map((skill) => {
      const difficulty = DIFFICULTIES.map((key) => `${key}:${skill.byDifficulty[key].correct}/${skill.byDifficulty[key].attempts}`).join("|");
      return `${skill.skillCd}:${skill.correct}/${skill.attempts}:${difficulty}`;
    }).join(";");
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (let index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function candidateId(question) {
    return question?.detailKey || question?.id || "";
  }

  function sortedCandidates(candidates, seed) {
    return candidates.slice().sort((a, b) => {
      const aId = candidateId(a);
      const bId = candidateId(b);
      const aRecent = state.recentIds.has(aId) ? 1 : 0;
      const bRecent = state.recentIds.has(bId) ? 1 : 0;
      return aRecent - bRecent || stableHash(`${seed}|${aId}`) - stableHash(`${seed}|${bId}`) || aId.localeCompare(bId);
    });
  }

  function fallbackDifficulties(target) {
    if (target === "E") return ["E", "M", "H"];
    if (target === "H") return ["H", "M", "E"];
    return ["M", "E", "H"];
  }

  function selectQuestions(questions) {
    const seed = `${state.uid}|${statsFingerprint()}`;
    const selected = [];
    const selectedIds = new Set();
    const pools = new Map();

    for (const allocation of state.allocations) {
      for (const difficulty of DIFFICULTIES) {
        const key = `${allocation.skill.skillCd}|${difficulty}`;
        const matching = questions.filter((question) => question.skillCd === allocation.skill.skillCd && question.difficulty === difficulty && candidateId(question));
        pools.set(key, sortedCandidates(matching, seed));
      }
    }

    function take(skillCd, requestedDifficulty) {
      for (const difficulty of fallbackDifficulties(requestedDifficulty)) {
        const pool = pools.get(`${skillCd}|${difficulty}`) || [];
        while (pool.length) {
          const candidate = pool.shift();
          const id = candidateId(candidate);
          if (!selectedIds.has(id)) {
            selectedIds.add(id);
            selected.push(candidate);
            return true;
          }
        }
      }
      return false;
    }

    for (const allocation of state.allocations) {
      for (const difficulty of DIFFICULTIES) {
        for (let index = 0; index < allocation.mix[difficulty]; index += 1) take(allocation.skill.skillCd, difficulty);
      }
    }

    if (selected.length < state.totalQuestions) {
      const remaining = sortedCandidates(
        questions.filter((question) => state.selected.some((skill) => skill.skillCd === question.skillCd) && !selectedIds.has(candidateId(question))),
        seed
      );
      for (const question of remaining) {
        if (selected.length >= state.totalQuestions) break;
        const id = candidateId(question);
        if (!id || selectedIds.has(id)) continue;
        selectedIds.add(id);
        selected.push(question);
      }
    }
    return selected.slice(0, state.totalQuestions);
  }

  function candidateUrl() {
    const params = new URLSearchParams();
    params.set("sections", [...new Set(state.selected.map((skill) => skill.section))].join(","));
    params.set("domains", [...new Set(state.selected.map((skill) => skill.domainCode))].join(","));
    params.set("skills", state.selected.map((skill) => skill.skillCd).join(","));
    params.set("difficulties", DIFFICULTIES.join(","));
    params.set("assessment", "SAT");
    params.set("limit", "none");
    return `/api/sat/q?${params.toString()}`;
  }

  function launchSet(selected) {
    const questionIds = selected.map(candidateId);
    const url = window.KorahSAT.buildOpenSatV1QuestionUrl({
      questionIds,
      assessment: "SAT",
      limit: questionIds.length,
      random: false,
      mode: "tailored",
    });
    announce(`Opening ${questionIds.length} tailored questions.`);
    if (window.KorahTransitions) window.KorahTransitions.go(url);
    else window.location.href = url;
  }

  function applyActualCounts(selected) {
    for (const allocation of state.allocations) {
      const mix = { E: 0, M: 0, H: 0 };
      let count = 0;
      for (const question of selected) {
        if (question.skillCd !== allocation.skill.skillCd) continue;
        count += 1;
        if (DIFFICULTIES.includes(question.difficulty)) mix[question.difficulty] += 1;
      }
      allocation.count = count;
      allocation.mix = mix;
    }
    state.totalQuestions = selected.length;
  }

  function confirmShortSet(selected) {
    state.confirmedSelection = selected;
    applyActualCounts(selected);
    renderSourceLine();
    renderPriorityCards();
    renderSetSummary();
    const notice = byId("tailoredSetShortNotice");
    notice.textContent = `The question bank only has ${selected.length} matching question${selected.length === 1 ? "" : "s"} right now. Select the button again to practice this set.`;
    notice.hidden = false;
    const button = byId("tailoredBuild");
    button.disabled = false;
    button.innerHTML = `<span>Start ${selected.length} question${selected.length === 1 ? "" : "s"}</span>`;
    announce(`Only ${selected.length} matching questions are available right now. Select the button again to start them.`);
  }

  async function buildPracticeSet() {
    const button = byId("tailoredBuild");
    const errorBox = byId("tailoredBuildError");
    if (state.confirmedSelection) {
      launchSet(state.confirmedSelection);
      return;
    }
    errorBox.hidden = true;
    byId("tailoredSetShortNotice").hidden = true;
    button.disabled = true;
    button.innerHTML = '<span class="tailored-inline-spinner"></span><span>Choosing your questions...</span>';
    announce("Choosing your tailored questions.");
    try {
      const response = await fetch(candidateUrl(), { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Question request failed with status ${response.status}`);
      const payload = await response.json();
      const selected = selectQuestions(Array.isArray(payload?.questions) ? payload.questions : []);
      if (selected.length < 5) throw new Error("Not enough matching questions are available right now.");
      if (selected.length < state.totalQuestions) {
        confirmShortSet(selected);
        return;
      }
      launchSet(selected);
    } catch (error) {
      console.error("[Tailored] failed to build set", error);
      state.confirmedSelection = null;
      errorBox.textContent = error.message || "We could not build your set. Try again.";
      errorBox.hidden = false;
      button.disabled = false;
      button.innerHTML = '<span class="material-icons-round">refresh</span><span>Try building again</span>';
      announce("The practice set could not be built.");
    }
  }

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;
    byId("tailoredBuild").addEventListener("click", buildPracticeSet);
    byId("tailoredRetry").addEventListener("click", loadData);
  }

  function showInitializationError() {
    showState({
      icon: "cloud_off",
      title: "Korah could not start Tailored Practice",
      text: "Refresh the page to try again. Your existing SAT data has not been changed.",
      retry: true,
    });
  }

  function init(detail) {
    if (state.initialized) return;
    state.initialized = true;
    state.uid = detail?.uid || "student";
    loadData();
  }

  window.KorahTailored = {
    normalizeStats,
    rankSkills,
    targetDifficulty,
    distributeQuestionCounts,
    allocateByRatio,
  };

  bindEvents();
  window.addEventListener("korahReady", (event) => init(event.detail), { once: true });
  window.addEventListener("korahReadyError", showInitializationError, { once: true });
  if (window._korahReadyFired) init(window._korahReadyFired);
  else if (window._korahReadyError) showInitializationError();
})();
