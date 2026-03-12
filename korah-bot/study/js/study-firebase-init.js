/**
 * Shared Firebase initialisation for Korah study pages.
 *
 * Include as a module script in every study page:
 *   <script type="module" src="js/study-firebase-init.js"></script>
 *
 * After auth is confirmed and KorahDB is ready this module dispatches the
 * 'korahReady' CustomEvent on window and also sets window._korahReadyFired
 * so that scripts which may have already missed the event can pick it up.
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { setupKorahDB } from "../../app/data/firestore-store.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDvabVNkVMfjKl1m3dQSlW06h-iomgcNJM",
  authDomain: "korah-app.firebaseapp.com",
  projectId: "korah-app",
  storageBucket: "korah-app.firebasestorage.app",
  messagingSenderId: "226169460321",
  appId: "1:226169460321:web:b166fc8260107c55dafc20",
};

// Reuse an existing Firebase app instance if one was already initialised
// (avoids "Firebase App named '[DEFAULT]' already exists" errors).
const app = getApps().length > 0 ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // Redirect unauthenticated visitors to the login page.
    window.location.href = "../../login.html";
    return;
  }

  await setupKorahDB(app, user.uid);
  const detail = { uid: user.uid };
  window._korahReadyFired = detail;
  window.dispatchEvent(new CustomEvent("korahReady", { detail }));
});
