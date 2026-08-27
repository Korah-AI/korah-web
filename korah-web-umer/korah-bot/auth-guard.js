let guardStarted = false;

// Polls auth.currentUser every 10 seconds and redirects unauthenticated users.
// Call once after onAuthStateChanged confirms a valid user.
export function startAuthGuard(auth, redirectTo) {
  if (guardStarted) return;
  guardStarted = true;
  setInterval(() => {
    if (!auth.currentUser) window.KorahTransitions.go(redirectTo);
  }, 10000);
}
