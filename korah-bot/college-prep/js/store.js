/**
 * store.js - Firestore reads/writes under users/{uid}/essays
 */

let db = null;
let uid = null;

async function init(app, userId) {
  const { getFirestore } = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
  db = getFirestore(app);
  uid = userId;
}

async function listEssays() {
  if (!db || !uid) return [];
  try {
    const { collection, query, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
    const ref = collection(db, `users/${uid}/essays`);
    const q = query(ref, orderBy('updatedAt', 'desc'));
    const snap = await getDocs(q);
    const essays = [];
    snap.forEach(d => essays.push({ id: d.id, ...d.data() }));
    return essays;
  } catch (e) {
    console.warn('listEssays failed:', e);
    return [];
  }
}

async function getEssay(id) {
  if (!db || !uid) return null;
  try {
    const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
    const snap = await getDoc(doc(db, `users/${uid}/essays`, id));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.warn('getEssay failed:', e);
    return null;
  }
}

async function saveEssay(id, data) {
  if (!db || !uid) return;
  try {
    const { doc, setDoc } = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
    await setDoc(doc(db, `users/${uid}/essays`, id), {
      ...data,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (e) {
    console.warn('saveEssay failed:', e);
  }
}

async function deleteEssay(id) {
  if (!db || !uid) return;
  try {
    const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
    await deleteDoc(doc(db, `users/${uid}/essays`, id));
  } catch (e) {
    console.warn('deleteEssay failed:', e);
  }
}

function onEssaysChange(callback) {
  if (!db || !uid) return () => {};
  try {
    const { collection, query, orderBy, onSnapshot } = require('https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js');
    const ref = collection(db, `users/${uid}/essays`);
    const q = query(ref, orderBy('updatedAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const essays = [];
      snap.forEach(d => essays.push({ id: d.id, ...d.data() }));
      callback(essays);
    });
  } catch (e) {
    console.warn('onEssaysChange failed:', e);
    return () => {};
  }
}

const EssayStore = { init, listEssays, getEssay, saveEssay, deleteEssay, onEssaysChange };
export default EssayStore;
