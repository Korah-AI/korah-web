/**
 * AP mock-exam analytics — Firestore-backed.
 *
 * Layout (all under users/{uid}/ so existing security rules apply):
 *   users/{uid}/apAttempts/{auto}   — append-only log, one doc per submitted exam
 *   users/{uid}/apTotals/summary    — { exams, answered, correct, lastActivity }
 *
 * Call initApAnalytics(app, uid) once after auth. The module attaches itself
 * to window.KorahAPAnalytics for ap-exam.js, which is a plain script.
 */

import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  orderBy,
  limit as fsLimit,
  writeBatch,
  increment,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

export async function initApAnalytics(app, uid) {
  let db;
  try {
    db = initializeFirestore(app, {});
  } catch (_) {
    db = getFirestore(app);
  }

  const attemptsCol = collection(db, `users/${uid}/apAttempts`);
  const totalsRef = doc(db, `users/${uid}/apTotals`, "summary");

  /**
   * Append one submitted exam and fold it into the running totals. Returns the
   * new attempt's id, or null if the payload was unusable.
   */
  async function recordAttempt(a) {
    if (!a || !a.examId) return null;
    const total = Number(a.total) || 0;
    const rawScore = Math.min(Math.max(Number(a.rawScore) || 0, 0), total);
    const answered = Math.min(Math.max(Number(a.answered) || 0, 0), total);
    const nowIso = new Date().toISOString();

    const batch = writeBatch(db);
    const attemptRef = doc(attemptsCol);
    batch.set(attemptRef, {
      examId: a.examId,
      course: a.course || "",
      title: a.title || "",
      rawScore,
      total,
      answered,
      predictedScore: a.predictedScore ?? null,
      units: a.units || {},
      answers: a.answers || {},
      timedOut: Boolean(a.timedOut),
      elapsedSec: Math.max(0, Math.floor(Number(a.elapsedSec) || 0)),
      ts: nowIso,
    });

    batch.set(totalsRef, {
      exams: increment(1),
      answered: increment(answered),
      correct: increment(rawScore),
      lastActivity: nowIso,
    }, { merge: true });

    await batch.commit();
    return attemptRef.id;
  }

  /**
   * Previous attempts, newest first. Filtering by examId happens here rather
   * than in the query so this needs no composite index; a user accumulates
   * only a handful of mock-exam submissions.
   */
  async function getAttempts(examId, limitCount = 5) {
    const snap = await getDocs(query(attemptsCol, orderBy("ts", "desc"), fsLimit(50)));
    const out = [];
    snap.forEach((d) => {
      const data = d.data();
      if (!examId || data.examId === examId) out.push({ id: d.id, ...data });
    });
    return out.slice(0, limitCount);
  }

  const api = { recordAttempt, getAttempts };
  window.KorahAPAnalytics = api;
  return api;
}
