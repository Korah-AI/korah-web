import { showAuthWall } from './guest-gate.js';

let guardStarted = false;

// Polls auth.currentUser every 10 seconds. If the session drops mid-visit the
// user is not redirected away — the same non-dismissible auth wall used by
// signed-out visitors is raised over the page instead.
//
// `pathHint` is the old redirect target (e.g. 'index.html' or '../index.html').
// It is kept only to derive how deep the current page sits, so the wall's own
// links and logo resolve. Callers don't need to change.
export function startAuthGuard(auth, pathHint = '') {
  if (guardStarted) return;
  guardStarted = true;

  const base = pathHint.startsWith('../') ? '../' : '';

  const timer = setInterval(() => {
    if (!auth.currentUser) {
      clearInterval(timer);
      showAuthWall(base);
    }
  }, 10000);
}
