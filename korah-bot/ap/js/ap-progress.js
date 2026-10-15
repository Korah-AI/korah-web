/**
 * AP progress — Firestore-backed attempt storage and the weakness view math.
 *
 * Firestore layout: users/{uid}/apAttempts/{autoId}. One document per attempt,
 * matching the schema in docs/ap-frq-spec.md:
 *   { frqId, course, confirmedTranscript, rubricVerdicts, score, totalPoints,
 *     timeAllottedSec, timeSpentSec, disputedPoints, createdAt }
 * JSON primitives only. createdAt is an ISO string, never a Timestamp object.
 *
 * This module is an ES module because it imports Firebase. It exposes:
 *   - initAPProgress(app, uid)   — the Firestore-backed API (also installed as
 *                                  window.KorahAPProgress so plain-script pages
 *                                  like ap-attempt.js can call it)
 *   - loadPlaceholderAttempts()  — demo data for the offline/guest Progress view
 *   - computeWeakness()          — aggregates earned/available per rubric category
 */

import {
  initializeFirestore,
  getFirestore,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  orderBy,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

function placeholderPath(courseSlug) {
  return `./data/${courseSlug}/placeholder-attempts.json`;
}

/** Fake past attempts so Progress renders offline, marked for the UI. */
async function loadPlaceholderAttempts(courseSlug) {
  try {
    const res = await fetch(placeholderPath(courseSlug));
    if (!res.ok) return [];
    const arr = await res.json();
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

/**
 * Aggregate rubric verdicts into per-category earned/available numbers.
 * Categories resolve through the course rubric (point id -> category), so it
 * works for Firestore docs (which carry category) and placeholders (which may
 * not). Returns worst-first so the weakness view leads with the real problem.
 */
async function computeWeakness(attempts, courseSlug) {
  const cats = (window.KorahAP && window.KorahAP.categoriesFor)
    ? window.KorahAP.categoriesFor(courseSlug)
    : [];
  const catOrder = new Map(cats.map((c, i) => [c.key, i]));
  const totals = new Map(); // categoryKey -> { available, earned, label }

  const ensure = (key) => {
    if (!totals.has(key)) {
      totals.set(key, { available: 0, earned: 0, label: key });
    }
    return totals.get(key);
  };

  // Map rubric point id -> category for any attempts that don't carry one.
  const idToCat = new Map();
  if (window.KorahAP && window.KorahAP.loadFrqs) {
    try {
      const frqs = await window.KorahAP.loadFrqs(courseSlug);
      (frqs || []).forEach((frq) => {
        (frq.parts || []).forEach((part) => {
          (part.rubricPoints || []).forEach((rp) => {
            idToCat.set(rp.id, rp.category || 'completeness');
          });
        });
      });
    } catch (_) {}
  }

  (attempts || []).forEach((a) => {
    if (a.course && a.course !== courseSlug) return;
    (a.rubricVerdicts || []).forEach((v) => {
      const key = v.category || idToCat.get(v.rubricPointId) || 'completeness';
      const slot = ensure(key);
      slot.available += 1;
      if (v.earned) slot.earned += 1;
    });
  });

  const rows = Array.from(totals.values()).map((r) => ({
    key: r.label,
    label: (catOrder.has(r.label) && cats[catOrder.get(r.label)].label) || r.label,
    available: r.available,
    earned: r.earned,
    accuracy: r.available > 0 ? r.earned / r.available : 0,
  }));

  rows.sort((a, b) => (a.accuracy - b.accuracy) || (a.available - b.available));
  return rows;
}

/** Latest attempt per FRQ id for the picker's "attempted" badges. */
function latestPerFrq(attempts) {
  const map = new Map();
  (attempts || []).forEach((a) => {
    if (a.frqId && !map.has(a.frqId)) {
      map.set(a.frqId, { count: 1, lastScore: a.score, totalPoints: a.totalPoints, createdAt: a.createdAt });
    } else if (a.frqId) {
      const cur = map.get(a.frqId);
      cur.count += 1;
    }
  });
  return map;
}

/**
 * Initialise the Firestore-backed API for a signed-in user.
 * Mirrors initSatAnalytics(): creates the db, builds the collection ref under
 * users/{uid}/apAttempts, and installs the api on window.KorahAPProgress for
 * plain-script consumers (ap-attempt.js, the FRQ picker renderer).
 */
export async function initAPProgress(app, uid) {
  let db;
  try {
    db = initializeFirestore(app, {});
  } catch (_) {
    db = getFirestore(app);
  }

  const attemptsCol = collection(db, `users/${uid}/apAttempts`);

  async function saveAttempt(payload) {
    const createdAt = typeof payload.createdAt === 'string' ? payload.createdAt : new Date().toISOString();
    const clean = {
      frqId: String(payload.frqId || ''),
      course: String(payload.course || ''),
      confirmedTranscript: String(payload.confirmedTranscript || ''),
      rubricVerdicts: (payload.rubricVerdicts || []).map((v) => ({
        rubricPointId: String(v.rubricPointId || ''),
        category: String(v.category || ''),
        partLabel: String(v.partLabel || ''),
        earned: Boolean(v.earned),
        evidence: v.evidence != null ? String(v.evidence) : null,
        feedback: v.feedback != null ? String(v.feedback) : null,
      })),
      score: Number(payload.score) || 0,
      totalPoints: Number(payload.totalPoints) || 0,
      timeAllottedSec: Number(payload.timeAllottedSec) || 0,
      timeSpentSec: Number(payload.timeSpentSec) || 0,
      disputedPoints: Array.isArray(payload.disputedPoints) ? payload.disputedPoints.map(String) : [],
      createdAt,
    };
    return addDoc(attemptsCol, clean);
  }

  async function getAttempts(courseSlug) {
    const q = query(attemptsCol, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const out = [];
    snap.forEach((d) => {
      const data = d.data();
      if (!courseSlug || data.course === courseSlug) out.push({ id: d.id, ...data });
    });
    return out;
  }

  async function getFrqAttemptCounts(courseSlug) {
    const all = await getAttempts(courseSlug);
    return latestPerFrq(all);
  }

  /**
   * Set the disputed point ids on an already-saved attempt.
   * Called by the feedback screen's "I disagree" flow; merges only the
   * disputedPoints field so the rest of the attempt doc is untouched.
   */
  async function flagDisputed(attemptId, pointIds) {
    if (!attemptId) return;
    const ref = doc(attemptsCol, attemptId);
    const clean = Array.isArray(pointIds) ? pointIds.map(String) : [];
    await setDoc(ref, { disputedPoints: clean }, { merge: true });
  }

  const api = { saveAttempt, getAttempts, getFrqAttemptCounts, flagDisputed };

  window.KorahAPProgress = Object.assign(window.KorahAPProgress || {}, api);
  window.dispatchEvent(new CustomEvent('korahAPProgressReady'));
  return api;
}

window.KorahAPProgress = Object.assign(window.KorahAPProgress || {}, {
  loadPlaceholderAttempts,
  computeWeakness,
  latestPerFrq,
});