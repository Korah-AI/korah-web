// Stats strip, activity trend and breakdown panels on the Question Bank
// landing pages. Reads the same Firestore analytics sat/dashboard.html does;
// guests see a signed-out state because analytics never initialises for them.
(() => {
  const $ = (id) => document.getElementById(id);
  const grid = $("bankStatsGrid");
  if (!grid) return;

  const values = {
    answered: $("bankStatAnswered"),
    accuracy: $("bankStatAccuracy"),
    saved: $("bankStatSaved"),
    xp: $("bankStatXp"),
    time: $("bankStatTime"),
    week: $("bankStatWeek"),
    pace: $("bankStatPace"),
    topics: $("bankStatTopics"),
  };
  const subs = {
    answered: $("bankStatAnsweredSub"),
    accuracy: $("bankStatAccuracySub"),
    saved: $("bankStatSavedSub"),
    xp: $("bankStatXpSub"),
    time: $("bankStatTimeSub"),
    week: $("bankStatWeekSub"),
    pace: $("bankStatPaceSub"),
    topics: $("bankStatTopicsSub"),
  };
  const note = $("bankStatsNote");
  const panel = $("bankTrendPanel");
  const legend = $("bankTrendLegend");
  const chart = $("bankTrendChart");
  const yAxis = $("bankTrendYAxis");
  const axis = $("bankTrendAxis");
  const panels = $("bankPanels");
  const sectionSplit = $("bankSectionSplit");
  const difficultySplit = $("bankDifficultySplit");
  const focusAreas = $("bankFocusAreas");

  const since = window.KorahSATBankConfig?.since ?? null;

  function countUp(el, target, suffix = "") {
    if (!el) return;
    if (target <= 0) { el.textContent = "0" + suffix; return; }
    const duration = 700;
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased).toLocaleString() + suffix;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function setSignedOut() {
    Object.values(values).forEach((el) => { if (el) el.textContent = "—"; });
    Object.values(subs).forEach((el) => { if (el) el.textContent = ""; });
    if (note) note.hidden = false;
  }

  function fmtDuration(seconds) {
    const mins = Math.round((seconds || 0) / 60);
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  const weekStart = (date) => {
    const w = new Date(date);
    w.setHours(0, 0, 0, 0);
    w.setDate(w.getDate() - w.getDay());
    return w.getTime();
  };

  // Round the axis top up to something divisible by 4, so all five ticks are
  // whole numbers.
  function niceMax(value) {
    const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];
    for (const step of steps) {
      if (step * 4 >= value) return step * 4;
    }
    return Math.ceil(value / 4000) * 4000;
  }

  // Stack, bottom to top: wrong H/M/E then correct H/M/E. Harder is darker.
  const SEGMENTS = [
    ["correct", "E", "rgba(34,197,94,.45)"],
    ["correct", "M", "rgba(34,197,94,.72)"],
    ["correct", "H", "rgba(34,197,94,1)"],
    ["wrong", "E", "rgba(239,68,68,.45)"],
    ["wrong", "M", "rgba(239,68,68,.72)"],
    ["wrong", "H", "rgba(239,68,68,1)"],
  ];
  const WEEKS = 12;

  function renderTrend(rows) {
    const buckets = [];
    const cursor = new Date(weekStart(new Date()));
    cursor.setDate(cursor.getDate() - (WEEKS - 1) * 7);
    for (let i = 0; i < WEEKS; i++) {
      buckets.push({ t: cursor.getTime(), correct: { E: 0, M: 0, H: 0 }, wrong: { E: 0, M: 0, H: 0 } });
      cursor.setDate(cursor.getDate() + 7);
    }
    const index = new Map(buckets.map((b, i) => [b.t, i]));

    let correctCount = 0;
    let wrongCount = 0;
    for (const r of rows) {
      const i = index.get(weekStart(r.d));
      if (i === undefined) continue;
      const difficulty = ["E", "M", "H"].includes(r.difficulty) ? r.difficulty : "E";
      (r.correct ? buckets[i].correct : buckets[i].wrong)[difficulty]++;
      if (r.correct) correctCount++; else wrongCount++;
    }
    if (correctCount + wrongCount === 0) return;

    panel.hidden = false;
    legend.innerHTML = `
      <span class="sat-trend-chip is-good"><span class="material-icons-round">check_circle</span>${correctCount} Correct</span>
      <span class="sat-trend-chip is-bad"><span class="material-icons-round">cancel</span>${wrongCount} Wrong</span>`;

    const totalOf = (b) => ["E", "M", "H"].reduce((sum, d) => sum + b.correct[d] + b.wrong[d], 0);
    const top = niceMax(Math.max(1, ...buckets.map(totalOf)));

    yAxis.innerHTML = [4, 3, 2, 1, 0]
      .map((step) => `<span style="bottom:${step * 25}%;">${(top / 4) * step}</span>`)
      .join("");

    chart.innerHTML = buckets
      .map((b, i) => {
        const segs = SEGMENTS.map(([kind, d, color]) => {
          const n = b[kind][d];
          if (!n) return "";
          return `<div class="sat-trend-seg" style="height:${(n / top * 100).toFixed(1)}%; background:${color};"></div>`;
        }).join("");
        return `<div class="sat-trend-col" style="animation-delay:${i * 25}ms;">${segs}</div>`;
      })
      .join("");

    // One cell per bar; a date every other week keeps them from colliding.
    const fmt = (t) => new Date(t).toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const step = Math.max(1, Math.ceil(buckets.length / 6));
    axis.innerHTML = buckets
      .map((b, i) => `<span>${i % step === 0 || i === buckets.length - 1 ? fmt(b.t) : ""}</span>`)
      .join("");
  }

  function meter(label, sub, pct, color) {
    return `
      <div class="sat-meter">
        <div class="sat-meter-head"><span>${label}</span><span class="sat-meter-sub">${sub}</span></div>
        <div class="sat-meter-track"><span class="sat-meter-fill" data-pct="${pct}" style="background:${color};"></span></div>
      </div>`;
  }

  function paintMeters(root) {
    root.querySelectorAll(".sat-meter-fill").forEach((el) => {
      const pct = Math.max(0, Math.min(100, parseFloat(el.dataset.pct) || 0));
      requestAnimationFrame(() => { el.style.width = pct + "%"; });
    });
  }

  function renderSectionSplit(skillStats) {
    const catalog = window.KorahSAT?.OPENSAT_CATALOG;
    const labels = new Map((catalog?.sections || []).map((s) => [s.key, s.label]));
    const tones = { english: "#d03f87", math: "#3472d9" };
    const rows = ["english", "math"].map((key) => {
      const stats = skillStats.filter((s) => s.section === key);
      const attempts = stats.reduce((sum, s) => sum + (s.attempts || 0), 0);
      const correct = stats.reduce((sum, s) => sum + (s.correct || 0), 0);
      const pct = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const sub = attempts > 0
        ? `${pct}% of ${attempts.toLocaleString()}`
        : "Not practiced yet";
      return meter(labels.get(key) || key, sub, pct, tones[key]);
    });
    sectionSplit.innerHTML = rows.join("");
    paintMeters(sectionSplit);
  }

  function renderDifficultySplit(skillStats) {
    const labels = { E: "Easy", M: "Medium", H: "Hard" };
    const tones = { E: "#22c55e", M: "#f59e0b", H: "#ef4444" };
    difficultySplit.innerHTML = ["E", "M", "H"].map((d) => {
      let attempts = 0;
      let correct = 0;
      for (const s of skillStats) {
        const bucket = s.byDifficulty && s.byDifficulty[d];
        if (!bucket) continue;
        attempts += bucket.attempts || 0;
        correct += bucket.correct || 0;
      }
      const pct = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
      const sub = attempts > 0 ? `${pct}% of ${attempts.toLocaleString()}` : "Not practiced yet";
      return meter(labels[d], sub, pct, tones[d]);
    }).join("");
    paintMeters(difficultySplit);
  }

  function renderFocusAreas(suggestions) {
    const build = window.KorahSAT?.buildOpenSatV1QuestionUrl;
    if (!suggestions.length || !build) {
      focusAreas.innerHTML = `<p class="sat-panel-empty">Practice a few questions and the weakest skills show up here.</p>`;
      return;
    }
    focusAreas.innerHTML = suggestions.map((sk) => {
      const href = build({
        since,
        sections: [sk.section],
        domains: [sk.domain],
        skills: [sk.skillCd],
        difficulties: ["any"],
        assessment: "SAT",
        limit: null,
        random: false,
        timespent: "any",
        saved: "all",
        completed: "all",
        result: "all",
      });
      const acc = sk.attempts > 0 ? `${Math.round(sk.accuracy * 100)}%` : "New";
      return `
        <a class="sat-focus-row" href="${href}">
          <span class="sat-focus-name">${sk.skillName}<br><span class="sat-focus-sub">${sk.domain}</span></span>
          <span class="sat-focus-acc">${acc}</span>
          <span class="sat-focus-cta">Practice
            <svg class="sat-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </span>
        </a>`;
    }).join("");
  }

  async function load() {
    const analytics = window.KorahSATAnalytics;
    if (!analytics) return;
    try {
      const [totals, bookmarks, attempts, skillStats, suggestions] = await Promise.all([
        analytics.getTotals(),
        analytics.getBookmarks(),
        analytics.getAllAttempts(),
        analytics.getAllSkillStats(),
        analytics.suggestSkills(4),
      ]);

      const answered = totals.answered || 0;
      const correct = totals.correct || 0;
      countUp(values.answered, answered);
      subs.answered.textContent = answered > 0 ? `${correct.toLocaleString()} correct` : "Start practicing";

      if (answered > 0) {
        countUp(values.accuracy, Math.round((correct / answered) * 100), "%");
        subs.accuracy.textContent = "All-time";
      } else {
        values.accuracy.textContent = "—";
        subs.accuracy.textContent = "No data yet";
      }

      countUp(values.saved, bookmarks.length);
      subs.saved.textContent = "Bookmarked questions";

      countUp(values.xp, totals.totalXP || 0);
      subs.xp.textContent = `Level ${totals.level || 0}`;

      values.time.textContent = fmtDuration(totals.practiceTime);
      subs.time.textContent = "All-time";

      const rows = attempts
        .map((r) => ({ ...r, d: new Date(r.ts) }))
        .filter((r) => !isNaN(r.d.getTime()));

      const now = Date.now();
      const thisWeek = rows.filter((r) => r.d.getTime() >= now - 7 * 86400000);
      const lastWeek = rows.filter((r) => r.d.getTime() >= now - 14 * 86400000 && r.d.getTime() < now - 7 * 86400000);
      countUp(values.week, thisWeek.length);
      const delta = thisWeek.length - lastWeek.length;
      subs.week.textContent = lastWeek.length > 0
        ? `${delta >= 0 ? "+" : ""}${delta} vs last week`
        : "Last 7 days";

      const timed = rows.filter((r) => Number(r.timeSpent) > 0);
      if (timed.length > 0) {
        const avg = timed.reduce((sum, r) => sum + Number(r.timeSpent), 0) / timed.length;
        values.pace.textContent = `${Math.round(avg)}s`;
        subs.pace.textContent = "Average per question";
      } else {
        values.pace.textContent = "—";
        subs.pace.textContent = "No timed attempts yet";
      }

      const catalog = window.KorahSAT?.OPENSAT_CATALOG;
      const totalSkills = (catalog?.sections || [])
        .reduce((sum, s) => sum + s.domains.reduce((n, d) => n + (d.skills || []).length, 0), 0);
      const covered = skillStats.filter((s) => (s.attempts || 0) > 0).length;
      values.topics.textContent = totalSkills > 0 ? `${covered}/${totalSkills}` : String(covered);
      subs.topics.textContent = "Topics with practice";

      if (rows.length > 0) {
        panels.hidden = false;
        renderSectionSplit(skillStats);
        renderDifficultySplit(skillStats);
        renderFocusAreas(suggestions);
        renderTrend(rows);
      }
    } catch (err) {
      console.warn("[SAT] bank stats failed", err);
    }
  }

  function onReady(detail) {
    if (detail && detail.guest) { setSignedOut(); return; }
    if (window.KorahSATAnalytics) load();
    else window.addEventListener("korahSATAnalyticsReady", load, { once: true });
  }

  if (window._korahReadyFired) onReady(window._korahReadyFired);
  else window.addEventListener("korahReady", (e) => onReady(e.detail), { once: true });
})();
