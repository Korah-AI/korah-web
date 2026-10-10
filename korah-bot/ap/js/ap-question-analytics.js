/**
 * AP question-bank analytics, Firestore-backed.
 *
 * Layout (all under users/{uid}/ so existing security rules apply):
 *   users/{uid}/apQuestionAttempts/{auto}      one doc per checked answer
 *   users/{uid}/apQuestionBookmarks/{questionId}  one doc per saved question
 *
 * Separate from apAttempts (FRQ and mock-exam attempts). The method names
 * match KorahSATAnalytics, so practice.html can hand this object to the SAT
 * player unchanged. Also attached to window.KorahAPQuestions for the hub.
 */

import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const ERROR_LIMIT = 50;
const ID_FORMAT = /^[\w-]{1,64}$/;

export async function initApQuestionAnalytics(app, uid) {
  let db;
  try {
    db = initializeFirestore(app, {});
  } catch (_) {
    db = getFirestore(app);
  }

  const attemptsCol = collection(db, `users/${uid}/apQuestionAttempts`);
  const bookmarksCol = collection(db, `users/${uid}/apQuestionBookmarks`);

  async function recordAttempt(a) {
    if (!a || !ID_FORMAT.test(a.questionId || "")) return;
    await addDoc(attemptsCol, {
      questionId: a.questionId,
      unit: a.skillCd || "",
      unitLabel: a.domain || "",
      difficulty: a.difficulty || "",
      correct: Boolean(a.correct),
      timeSpent: Number(a.timeSpent) || 0,
      ts: new Date().toISOString(),
    });
  }

  async function saveBookmark(questionId, bookmarked, meta = {}) {
    if (!ID_FORMAT.test(questionId)) throw new Error("Invalid questionId format");
    const ref = doc(bookmarksCol, questionId);
    if (bookmarked) {
      await setDoc(ref, { questionId, unit: meta.skillCd || "", unitLabel: meta.domain || "", ts: new Date().toISOString() });
    } else {
      await deleteDoc(ref);
    }
  }

  async function getBookmarks() {
    const snap = await getDocs(bookmarksCol);
    const out = [];
    snap.forEach((d) => out.push(d.data()));
    return out;
  }

  async function readAttempts() {
    const snap = await getDocs(query(attemptsCol, orderBy("ts", "desc")));
    const out = [];
    snap.forEach((d) => out.push(d.data()));
    return out;
  }

  // Latest result per question, most recently attempted first.
  function latestOutcomes(attempts) {
    const map = new Map();
    attempts.forEach((a) => {
      if (!map.has(a.questionId)) map.set(a.questionId, { correct: Boolean(a.correct), timeSpent: a.timeSpent || 0 });
    });
    return map;
  }

  async function getLatestOutcomes() {
    return latestOutcomes(await readAttempts());
  }

  // Questions whose latest attempt was wrong, most recent first.
  async function getErrorIds() {
    return [...(await getLatestOutcomes())].filter(([, o]) => !o.correct).map(([id]) => id).slice(0, ERROR_LIMIT);
  }

  async function getSummary() {
    const [attempts, bookmarks] = await Promise.all([readAttempts(), getBookmarks()]);
    const errors = [...latestOutcomes(attempts)].filter(([, o]) => !o.correct).length;
    return {
      attempted: attempts.length,
      correct: attempts.filter((a) => a.correct).length,
      saved: bookmarks.length,
      errors: Math.min(errors, ERROR_LIMIT),
    };
  }

  const api = { recordAttempt, saveBookmark, getBookmarks, getLatestOutcomes, getErrorIds, getSummary };
  window.KorahAPQuestions = api;
  return api;
}
