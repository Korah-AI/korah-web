/**
 * Vocab sync — Firestore-backed wordbank and practice performance.
 *
 * Layout (all under users/{uid}/ so existing security rules apply):
 *   users/{uid}/vocabBank/main        — { learntVocabs, userSentences, createdAt, updatedAt }
 *   users/{uid}/vocabWords/{word}     — per-word performance aggregate
 *   users/{uid}/vocabAttempts/{auto}  — append-only attempt log
 *
 * Mirrors sat-analytics.js: profile-ish doc, per-key aggregates, attempt log.
 *
 * Call initVocabSync(app, uid) once after auth. localStorage stays the
 * synchronous read path the Alpine components use, so nothing in learn.html or
 * practice.html has to become async. This module reconciles it with Firestore
 * on sign-in and mirrors every write afterwards.
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
  serverTimestamp,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/** Keep the bank document well under the 1MB Firestore limit. */
const MAX_SENTENCE_CHARS = 500;

export async function initVocabSync(app, uid) {
  let db;
  try {
    db = initializeFirestore(app, {});
  } catch (_) {
    db = getFirestore(app);
  }

  const bankRef = doc(db, `users/${uid}/vocabBank`, "main");
  const wordsCol = collection(db, `users/${uid}/vocabWords`);
  const wordRef = (word) => doc(db, `users/${uid}/vocabWords`, word);
  const attemptsCol = collection(db, `users/${uid}/vocabAttempts`);

  // ─── Reads ────────────────────────────────────────────────────────────────

  async function pullBank() {
    const snap = await getDoc(bankRef);
    return snap.exists() ? snap.data() : null;
  }

  async function pullWords() {
    const snap = await getDocs(wordsCol);
    const out = {};
    snap.docs.forEach((d) => { out[d.id] = d.data(); });
    return out;
  }

  // ─── Writes (fire-and-forget; the local copy is already committed) ────────

  function trimSentences(map) {
    const out = {};
    for (const [word, sentence] of Object.entries(map || {})) {
      out[word] = String(sentence == null ? "" : sentence).slice(0, MAX_SENTENCE_CHARS);
    }
    return out;
  }

  async function pushBank(data) {
    try {
      // merge:true replaces the learntVocabs array wholesale, so removals do
      // propagate. userSentences is a map and merges key by key, which is what
      // we want since sentences are overwritten but never deleted.
      await setDoc(bankRef, {
        learntVocabs: data.learntVocabs || [],
        userSentences: trimSentences(data.userSentences),
        studySets: data.studySets || [],
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("[VocabSync] bank write:", err);
    }
  }

  async function pushWord(word, perf) {
    if (!word) return;
    try {
      await setDoc(wordRef(word), {
        ...perf,
        word,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.error("[VocabSync] word write:", err);
    }
  }

  async function pushAttempt(attempt) {
    try {
      await addDoc(attemptsCol, { ...attempt, createdAt: serverTimestamp() });
    } catch (err) {
      console.error("[VocabSync] attempt write:", err);
    }
  }

  // ─── Reconciliation ───────────────────────────────────────────────────────

  /**
   * Union the wordbanks. A user can add words signed out, then sign in; losing
   * either side would be worse than the cost of this being non-destructive.
   * Only the sign-in reconciliation unions — every write after that replaces
   * the array, so a later removal still propagates.
   */
  function mergeBank(local, remote) {
    const words = new Set([
      ...(Array.isArray(local?.learntVocabs) ? local.learntVocabs : []),
      ...(Array.isArray(remote?.learntVocabs) ? remote.learntVocabs : []),
    ]);
    // Study sets are keyed by id, so the union is unambiguous; local wins on a
    // shared id since it is the copy that was just edited.
    const sets = new Map();
    for (const set of (Array.isArray(remote?.studySets) ? remote.studySets : [])) sets.set(set.id, set);
    for (const set of (Array.isArray(local?.studySets) ? local.studySets : [])) sets.set(set.id, set);
    return {
      learntVocabs: [...words],
      // Local wins: it is the copy the user most recently typed into.
      userSentences: {
        ...(remote?.userSentences || {}),
        ...(local?.userSentences || {}),
      },
      studySets: [...sets.values()],
    };
  }

  /** Per word, keep whichever side has seen more attempts. */
  function mergeWords(localPerf, remoteWords) {
    const merged = {};
    const localOnly = [];
    const names = new Set([
      ...Object.keys(localPerf?.wordPerformance || {}),
      ...Object.keys(remoteWords || {}),
    ]);
    for (const name of names) {
      const l = localPerf?.wordPerformance?.[name];
      const r = remoteWords?.[name];
      if (l && r) {
        const winner = (l.totalAttempts || 0) >= (r.totalAttempts || 0) ? l : r;
        merged[name] = winner;
        if (winner === l) localOnly.push(name);
      } else if (l) {
        merged[name] = l;
        localOnly.push(name);
      } else {
        merged[name] = r;
      }
    }
    return { merged, localOnly };
  }

  async function reconcile() {
    const localData = VocabStore.data();
    const localPerf = VocabStore.performance();

    const [remoteBank, remoteWords] = await Promise.all([pullBank(), pullWords()]);

    const bank = mergeBank(localData, remoteBank);
    const { merged, localOnly } = mergeWords(localPerf, remoteWords);

    // Land the merged state locally first so the page is correct even if the
    // upload below fails.
    VocabStore.hydrate({
      data: bank,
      perf: { ...localPerf, wordPerformance: merged },
    });

    const now = new Date().toISOString();
    await setDoc(bankRef, {
      learntVocabs: bank.learntVocabs,
      userSentences: trimSentences(bank.userSentences),
      studySets: bank.studySets,
      createdAt: remoteBank?.createdAt || now,
      updatedAt: now,
    }, { merge: true });

    // Push only the words where the local copy won; the rest already match.
    if (localOnly.length) {
      const batch = writeBatch(db);
      for (const name of localOnly) {
        batch.set(wordRef(name), { ...merged[name], word: name, updatedAt: now }, { merge: true });
      }
      await batch.commit();
    }
  }

  await reconcile();

  // Mirror every later write. Set after reconcile so the hydrate above does not
  // bounce straight back up.
  VocabStore.setRemote({ pushBank, pushWord, pushAttempt });

  const api = { uid, resync: reconcile };
  window.KorahVocabSync = api;
  window._korahVocabReadyFired = { uid };
  window.dispatchEvent(new CustomEvent("korahVocabReady", { detail: { uid } }));
  return api;
}
