/**
 * SAT analytics — Firestore-backed.
 *
 * Layout (all under users/{uid}/ so existing security rules apply):
 *   users/{uid}/satProfile/main          — { currentScore, goalScore, createdAt, updatedAt }
 *   users/{uid}/satTotals/summary        — { totalXP, level, answered, correct, incorrect, lastActivity }
 *   users/{uid}/satSkills/{skillCd}      — per-skill aggregate
 *   users/{uid}/satAttempts/{auto}       — append-only attempt log
 *
 * Call initSatAnalytics(app, uid) once after auth. The module attaches itself
 * to window.KorahSATAnalytics for non-module scripts (sat-player.js, etc).
 */

import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit as fsLimit,
  serverTimestamp,
  writeBatch,
  increment,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const LEVEL_THRESHOLD = 1000; // XP per level

function calculateLevel(xp) {
  return Math.floor((xp || 0) / LEVEL_THRESHOLD);
}

function xpForCorrect(difficulty) {
  if (difficulty === "H") return 30;
  if (difficulty === "M") return 20;
  return 10;
}
function xpForIncorrect(difficulty) {
  return Math.floor(xpForCorrect(difficulty) / 2);
}

function resolveStoredQuestionId(entry) {
  return entry?.detailKey || entry?.questionId || "";
}

export async function initSatAnalytics(app, uid) {
  let db;
  try {
    db = initializeFirestore(app, {});
  } catch (_) {
    db = getFirestore(app);
  }

  const profileRef  = doc(db, `users/${uid}/satProfile`, "main");
  const totalsRef   = doc(db, `users/${uid}/satTotals`, "summary");
  const skillsCol   = collection(db, `users/${uid}/satSkills`);
  const skillRef    = (skillCd) => doc(db, `users/${uid}/satSkills`, skillCd);
  const attemptsCol = collection(db, `users/${uid}/satAttempts`);

  async function getProfile() {
    const snap = await getDoc(profileRef);
    return snap.exists() ? snap.data() : null;
  }

  async function saveProfile({ currentScore, goalScore, mathScore, englishScore, mathGoal, englishGoal }) {
    const now = new Date().toISOString();
    const existing = await getProfile();

    // Derive combined totals from section scores when available
    const resolvedMathScore    = mathScore    != null ? Number(mathScore)    : (existing?.mathScore    ?? null);
    const resolvedEnglishScore = englishScore != null ? Number(englishScore) : (existing?.englishScore ?? null);
    const resolvedMathGoal     = mathGoal     != null ? Number(mathGoal)     : (existing?.mathGoal     ?? null);
    const resolvedEnglishGoal  = englishGoal  != null ? Number(englishGoal)  : (existing?.englishGoal  ?? null);

    const combinedCurrent = (resolvedMathScore && resolvedEnglishScore)
      ? resolvedMathScore + resolvedEnglishScore
      : (currentScore ? Number(currentScore) : (existing?.currentScore ?? null));
    const combinedGoal = (resolvedMathGoal && resolvedEnglishGoal)
      ? resolvedMathGoal + resolvedEnglishGoal
      : (goalScore ? Number(goalScore) : (existing?.goalScore ?? null));

    const payload = {
      currentScore:  combinedCurrent,
      goalScore:     combinedGoal,
      mathScore:     resolvedMathScore,
      englishScore:  resolvedEnglishScore,
      mathGoal:      resolvedMathGoal,
      englishGoal:   resolvedEnglishGoal,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    };
    await setDoc(profileRef, payload, { merge: true });
    return payload;
  }

  async function getTotals() {
    const snap = await getDoc(totalsRef);
    if (snap.exists()) return snap.data();
    return {
      totalXP: 0, level: 0, answered: 0, correct: 0, incorrect: 0,
      lastActivity: null,
    };
  }

  /**
   * Record a graded attempt. Batched: 1 write to attempts log + 1 to skill
   * aggregate + 1 to totals.
   *
   * @param {object} a
   * @param {string} a.questionId
   * @param {string} a.type         — "mcq" | "spr"
   * @param {string} a.skillCd      — e.g. "H.A."
   * @param {string} a.domain       — e.g. "Algebra"
   * @param {string} a.section      — "english" | "math"
   * @param {string} a.difficulty   — "E" | "M" | "H"
   * @param {string} a.assessment   — "SAT" | "PSAT/NMSQT" | "PSAT"
   * @param {string} [a.detailKey]  — canonical fetchable CB external_id
   * @param {string} [a.legacyQuestionId] — prior frontend/question id for compatibility
   * @param {boolean} a.correct
   * @param {number} a.timeSpent    — in seconds
   */
  async function recordAttempt(a) {
    if (!a || !a.questionId) return;
    const diff = ["E", "M", "H"].includes(a.difficulty) ? a.difficulty : "E";
    const correct = Boolean(a.correct);
    const xp = correct ? xpForCorrect(diff) : -xpForIncorrect(diff);
    const nowIso = new Date().toISOString();
    const skillCd = a.skillCd || "_unknown";
    const timeSpent = Number(a.timeSpent) || 0;

    const totals = await getTotals();
    const newXP = Math.max(0, (totals.totalXP || 0) + xp);

    const batch = writeBatch(db);

    // Attempts log
    const attemptRef = doc(attemptsCol);
    batch.set(attemptRef, {
      questionId: a.questionId,
      detailKey: a.detailKey || a.questionId,
      legacyQuestionId: a.legacyQuestionId || "",
      type: a.type || "",
      skillCd,
      domain: a.domain || "",
      section: a.section || "",
      difficulty: diff,
      assessment: a.assessment || "SAT",
      correct,
      xp,
      ts: nowIso,
      timeSpent,
    });

    // Skill aggregate
    batch.set(skillRef(skillCd), {
      skillCd,
      domain: a.domain || "",
      section: a.section || "",
      attempts: increment(1),
      correct: increment(correct ? 1 : 0),
      [`byDifficulty.${diff}.attempts`]: increment(1),
      [`byDifficulty.${diff}.correct`]: increment(correct ? 1 : 0),
      lastSeen: nowIso,
    }, { merge: true });

    // Totals
    batch.set(totalsRef, {
      totalXP: newXP,
      level: calculateLevel(newXP),
      answered: increment(1),
      correct: increment(correct ? 1 : 0),
      incorrect: increment(correct ? 0 : 1),
      lastActivity: nowIso,
    }, { merge: true });

    await batch.commit();
    return { xp, newXP };
  }

  /**
   * Increment the user's all-time practice time. Use this for time the user
   * spent on a question regardless of whether they ever clicked "Check Answer"
   * (e.g. skipped, reviewed, or navigated away). Safe to call with 0; it no-ops.
   */
  async function recordPracticeTime(seconds) {
    const s = Math.max(0, Math.floor(Number(seconds) || 0));
    if (!s) return;
    await setDoc(totalsRef, {
      practiceTime: increment(s),
      lastActivity: new Date().toISOString(),
    }, { merge: true });
  }

  async function saveBookmark(questionId, bookmarked, meta = {}) {
    const ref = doc(db, `users/${uid}/satBookmarks`, questionId);
    if (bookmarked) {
      const resolvedQuestionId = meta?.detailKey || questionId;
      await setDoc(ref, {
        questionId: resolvedQuestionId,
        ...meta,
        ts: new Date().toISOString(),
      });
    } else {
      await deleteDoc(ref);
    }
  }

  async function getBookmarks() {
    const col = collection(db, `users/${uid}/satBookmarks`);
    const snap = await getDocs(col);
    const out = [];
    snap.forEach(d => {
      const data = d.data();
      out.push({
        ...data,
        questionId: resolveStoredQuestionId(data),
      });
    });
    return out;
  }

  async function getMissedQuestionIds(limitCount = 50) {
    const q = query(attemptsCol, orderBy("ts", "desc"));
    const snap = await getDocs(q);
    // Track latest-attempt result per question (descending order means first seen = most recent).
    const latestStatus = new Map(); // questionId → boolean (correct)
    snap.forEach(d => {
      const data = d.data();
      const questionId = resolveStoredQuestionId(data);
      if (questionId && !latestStatus.has(questionId)) {
        latestStatus.set(questionId, data.correct);
      }
    });
    const missed = [];
    for (const [qId, wasCorrect] of latestStatus) {
      if (!wasCorrect) missed.push(qId);
    }
    return missed.slice(0, limitCount);
  }

  async function getAllSkillStats() {
    const snap = await getDocs(skillsCol);
    const out = [];
    snap.forEach((d) => out.push(d.data()));
    return out;
  }

  async function getRecentAttempts(n = 20) {
    const q = query(attemptsCol, orderBy("ts", "desc"), fsLimit(n));
    const snap = await getDocs(q);
    const out = [];
    snap.forEach((d) => {
      const data = d.data();
      out.push({
        ...data,
        questionId: resolveStoredQuestionId(data),
      });
    });
    return out;
  }

  /**
   * Suggest skills to study. Strategy:
   *  - Rank skills by weakness * data-confidence.
   *  - Skills with <3 attempts go to "uncovered" — surfaced if user has a
   *    significant goal gap (>100 points) or has practiced very little overall.
   */
  async function suggestSkills(topN = 3) {
    const [skillStats, profile, totals] = await Promise.all([
      getAllSkillStats(), getProfile(), getTotals(),
    ]);

    const byCd = new Map(skillStats.map((s) => [s.skillCd, s]));

    // Build full catalog so uncovered skills can surface. Catalog lives on
    // window.KorahSAT (loaded via sat-shared.js).
    const catalog = window.KorahSAT?.OPENSAT_CATALOG;
    if (!catalog) return [];
    const allSkills = [];
    for (const section of catalog.sections) {
      for (const domain of section.domains) {
        for (const sk of domain.skills) {
          allSkills.push({
            skillCd: sk.code,
            skillName: sk.key,
            domain: domain.key,
            section: section.key,
          });
        }
      }
    }

    const scored = allSkills.map((sk) => {
      const agg = byCd.get(sk.skillCd);
      const attempts = agg?.attempts || 0;
      const correct = agg?.correct || 0;
      const accuracy = attempts > 0 ? correct / attempts : 0;
      const confidence = Math.min(1, attempts / 10); // saturates at 10 attempts
      // Weakness score: higher = more in need of practice.
      const weakness = attempts > 0
        ? (1 - accuracy) * confidence + 0.3 * (1 - confidence)
        : 0.4; // uncovered baseline
      return { ...sk, attempts, correct, accuracy, weakness };
    });

    const gap = profile && profile.currentScore && profile.goalScore
      ? Math.max(0, profile.goalScore - profile.currentScore)
      : 200;
    // Boost uncovered skills more when goal gap is large.
    const uncoveredBoost = gap > 100 ? 0.25 : 0;
    for (const s of scored) {
      if (s.attempts === 0) s.weakness += uncoveredBoost;
    }

    scored.sort((a, b) => b.weakness - a.weakness);
    return scored.slice(0, topN);
  }

  /** Accuracy grouped by domain for the dashboard breakdown. */
  async function getDomainBreakdown() {
    const skillStats = await getAllSkillStats();
    const map = new Map(); // domain -> { domain, section, attempts, correct }
    for (const s of skillStats) {
      const key = s.domain || "Unknown";
      const cur = map.get(key) || { domain: key, section: s.section, attempts: 0, correct: 0 };
      cur.attempts += s.attempts || 0;
      cur.correct += s.correct || 0;
      map.set(key, cur);
    }
    return Array.from(map.values()).map((d) => ({
      ...d,
      accuracy: d.attempts > 0 ? d.correct / d.attempts : 0,
    }));
  }

  const api = {
    getProfile,
    saveProfile,
    getTotals,
    recordAttempt,
    recordPracticeTime,
    saveBookmark,
    getBookmarks,
    getMissedQuestionIds,
    getAllSkillStats,
    getRecentAttempts,
    suggestSkills,
    getDomainBreakdown,
  };


  window.KorahSATAnalytics = api;
  window.dispatchEvent(new CustomEvent("korahSATAnalyticsReady"));
  return api;
}
