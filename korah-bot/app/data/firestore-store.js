/**
 * Firestore data layer for Korah.
 * Call setupKorahDB(app, uid) once after Firebase Auth resolves.
 * Sets window.KorahDB with CRUD + realtime listeners for conversations and study items.
 */

import {
  initializeFirestore,
  persistentLocalCache,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

/** Maximum number of non-system messages stored per conversation document. */
const MAX_MESSAGES = 150;

/**
 * Initialises Firestore (with IndexedDB offline persistence) and exposes
 * window.KorahDB. Safe to call multiple times; only the first call to
 * initializeFirestore is effective.
 *
 * @param {import("firebase/app").FirebaseApp} app  - Initialised Firebase app
 * @param {string} uid                              - Authenticated user UID
 */
export async function setupKorahDB(app, uid) {
  // initializeFirestore throws if called a second time on the same app.
  // We catch that and fall back to the cached instance.
  let db;
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache() });
  } catch (_) {
    const { getFirestore } = await import(
      "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js"
    );
    db = getFirestore(app);
  }

  // ─── Path helpers ────────────────────────────────────────────────────────
  const convCol  = () => collection(db, `users/${uid}/conversations`);
  const convRef  = (id) => doc(db, `users/${uid}/conversations`, id);

  /** Maps item.type → Firestore sub-collection name. */
  const TYPE_TO_COL = {
    flashcards:   "flashcardSets",
    studyGuide:   "studyGuides",
    practiceTest: "practiceTests",
  };
  const ALL_STUDY_COLS = ["flashcardSets", "studyGuides", "practiceTests"];

  const studyRefFor  = (type, id) => doc(db, `users/${uid}/${TYPE_TO_COL[type] || "flashcardSets"}`, id);
  const studyRefAny  = (col, id)  => doc(db, `users/${uid}/${col}`, id);

  // ─── Conversations ────────────────────────────────────────────────────────

  async function getConversation(id) {
    const snap = await getDoc(convRef(id));
    return snap.exists() ? snap.data() : null;
  }

  async function setConversation(id, data) {
    const now = new Date().toISOString();
    let payload = { ...data, updatedAt: now };

    // Guard: cap message array to avoid exceeding Firestore document size limit.
    if (Array.isArray(payload.messages) && payload.messages.length > MAX_MESSAGES) {
      const sys   = payload.messages.filter((m) => m.role === "system");
      const other = payload.messages.filter((m) => m.role !== "system");
      payload.messages = [...sys, ...other.slice(-MAX_MESSAGES)];
    }

    await setDoc(convRef(id), payload, { merge: true });
  }

  async function deleteConversation(id) {
    await deleteDoc(convRef(id));
  }

  async function deleteConversations(ids) {
    if (!ids || ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach((id) => batch.delete(convRef(id)));
    await batch.commit();
  }

  /**
   * Attaches a realtime listener to the user's conversations collection.
   * @param {(docs: Record<string, object>) => void} callback  - Receives id-keyed map of docs
   * @returns {() => void} Unsubscribe function
   */
  function onConversationsChange(callback) {
    const q = query(convCol(), orderBy("updatedAt", "desc"));
    return onSnapshot(
      q,
      (snap) => {
        const result = {};
        snap.docs.forEach((d) => { result[d.id] = d.data(); });
        callback(result);
      },
      (err) => {
        console.error("[KorahDB] conversations listener:", err);
      }
    );
  }

  // ─── Study Items ──────────────────────────────────────────────────────────

  async function getStudyItem(id) {
    // Search all three collections in parallel; return first match.
    const snaps = await Promise.all(
      ALL_STUDY_COLS.map((col) => getDoc(studyRefAny(col, id)))
    );
    const found = snaps.find((s) => s.exists());
    return found ? found.data() : null;
  }

  async function setStudyItem(id, data) {
    const now = new Date().toISOString();
    await setDoc(studyRefFor(data.type, id), { ...data, updatedAt: now }, { merge: true });
  }

  async function deleteStudyItem(id) {
    // Delete from all three collections; Firestore silently ignores missing docs.
    await Promise.all(
      ALL_STUDY_COLS.map((col) => deleteDoc(studyRefAny(col, id)))
    );
  }

  async function deleteStudyItems(ids) {
    if (!ids || ids.length === 0) return;
    const batch = writeBatch(db);
    ids.forEach((id) => {
      ALL_STUDY_COLS.forEach((col) => batch.delete(studyRefAny(col, id)));
    });
    await batch.commit();
  }

  /**
   * Attaches realtime listeners to all three study collections.
   * Merges results into a single id-keyed map and calls callback on any change.
   * @param {(docs: Record<string, object>) => void} callback
   * @returns {() => void} Unsubscribe function
   */
  function onStudyItemsChange(callback) {
    const snapshots = { flashcardSets: {}, studyGuides: {}, practiceTests: {} };
    let readyCount = 0;

    function merge() {
      const result = {
        ...snapshots.flashcardSets,
        ...snapshots.studyGuides,
        ...snapshots.practiceTests,
      };
      callback(result);
    }

    const unsubscribers = ALL_STUDY_COLS.map((col) => {
      const q = query(collection(db, `users/${uid}/${col}`), orderBy("updatedAt", "desc"));
      return onSnapshot(
        q,
        (snap) => {
          snapshots[col] = {};
          snap.docs.forEach((d) => { snapshots[col][d.id] = d.data(); });
          readyCount++;
          // Fire callback once all three have reported at least once,
          // then on every subsequent change.
          if (readyCount >= ALL_STUDY_COLS.length || readyCount % ALL_STUDY_COLS.length === 0) {
            merge();
          }
        },
        (err) => {
          console.error(`[KorahDB] ${col} listener:`, err);
        }
      );
    });

    return () => unsubscribers.forEach((u) => u());
  }

  // ─── One-time localStorage migration ─────────────────────────────────────

  /**
   * Imports legacy localStorage data into Firestore on first authenticated load.
   * Records a per-user flag to prevent re-runs. Idempotent (uses setDoc merge).
   */
  async function migrateFromLocalStorage() {
    const MIGRATION_KEY = `korah_migrated_${uid}`;
    if (localStorage.getItem(MIGRATION_KEY)) return;

    const rawSessions   = localStorage.getItem("korah_sessions");
    const rawStudyItems = localStorage.getItem("korah_study_items");

    if (!rawSessions && !rawStudyItems) {
      localStorage.setItem(MIGRATION_KEY, "1");
      return;
    }

    const batch = writeBatch(db);
    let count = 0;

    if (rawSessions) {
      try {
        const sessions = JSON.parse(rawSessions);
        Object.entries(sessions).forEach(([id, session]) => {
          const payload = { ...session, id };
          // Cap messages during migration too
          if (Array.isArray(payload.messages) && payload.messages.length > MAX_MESSAGES) {
            const sys   = payload.messages.filter((m) => m.role === "system");
            const other = payload.messages.filter((m) => m.role !== "system");
            payload.messages = [...sys, ...other.slice(-MAX_MESSAGES)];
          }
          batch.set(convRef(id), payload, { merge: true });
          count++;
        });
      } catch (e) {
        console.warn("[KorahDB] Migration: failed to parse sessions", e);
      }
    }

    if (rawStudyItems) {
      try {
        const items = JSON.parse(rawStudyItems);
        Object.entries(items).forEach(([id, item]) => {
          // Route each item to its type-specific collection.
          batch.set(studyRefFor(item.type, id), { ...item, id }, { merge: true });
          count++;
        });
      } catch (e) {
        console.warn("[KorahDB] Migration: failed to parse study items", e);
      }
    }

    if (count > 0) {
      await batch.commit();
      console.info(`[KorahDB] Migrated ${count} item(s) from localStorage → Firestore`);
    }

    // Record migration flag. Legacy keys are left in place as a read-only
    // fallback for this release window, then can be cleared later.
    localStorage.setItem(MIGRATION_KEY, "1");
  }

  // ─── Expose ───────────────────────────────────────────────────────────────

  window.KorahDB = {
    uid,
    // conversations
    getConversation,
    setConversation,
    deleteConversation,
    deleteConversations,
    onConversationsChange,
    // study items
    getStudyItem,
    setStudyItem,
    deleteStudyItem,
    deleteStudyItems,
    onStudyItemsChange,
    // migration
    migrateFromLocalStorage,
  };
}
