/**
 * Guest mode — lets signed-out visitors browse without letting them write.
 *
 * Call initGuestGate(basePath) from a page's onAuthStateChanged handler when
 * `user` is null, instead of redirecting. It disables every control tagged
 * with [data-requires-auth] and shows a signup toast when one is clicked.
 *
 * Guests are NOT signed in to Firebase at all (no anonymous auth), so there is
 * no guest data to migrate — signing up creates a fresh, empty account.
 *
 * Pages that render nothing but users/{uid} data (study/*) should keep
 * redirecting; there is no content to show a guest there.
 */

let toastEl = null;
let basePath = '';

/**
 * Read-only stand-in for window.KorahDB, matching the surface built by
 * setupKorahDB(). Reads return the same empty shapes Firestore would return for
 * a brand-new account; writes are dropped. Lets korah-chat.js and sidebar.js run
 * unmodified against an empty store instead of hanging on a korahReady that
 * never fires.
 */
function guestDBStub() {
  const noop = async () => {};
  const emptyMap = async () => ({});
  const emptyListener = (cb) => { cb({}); return () => {}; };

  return {
    uid: null,
    isGuest: true,

    getConversation: async () => null,
    setConversation: noop,
    deleteConversation: noop,
    deleteConversations: noop,
    onConversationsChange: emptyListener,
    fetchConversations: emptyMap,

    getStudyItem: async () => null,
    setStudyItem: noop,
    deleteStudyItem: noop,
    deleteStudyItems: noop,
    onStudyItemsChange: emptyListener,
    fetchStudyItems: emptyMap,

    getSatExplanation: async () => null,
    setSatExplanation: noop,

    migrateFromLocalStorage: noop,
    clearAllData: noop,
  };
}

/**
 * Boots a page's app code in guest mode: installs the stub DB and fires
 * korahReady so anything waiting on it initialises. Call INSTEAD of
 * setupKorahDB() when there is no user, then initGuestGate().
 */
export function startGuestSession() {
  // Idempotent: study pages have both their own guard and study-firebase-init.js,
  // and re-firing korahReady would double-initialise the sidebar and chat.
  if (window._korahReadyFired) return;

  window.KorahDB = guestDBStub();
  const detail = { uid: null, guest: true };
  window._korahReadyFired = detail;
  window.dispatchEvent(new CustomEvent('korahReady', { detail }));
}

/** Marks the page as guest mode and neutralises write actions. */
export function initGuestGate(base = '') {
  basePath = base;
  document.documentElement.setAttribute('data-guest', 'true');
  window.KorahGuest = { isGuest: true, showToast: showGuestToast, gate: gateElements };

  buildToast();
  gateElements();

  // Controls injected later (SAT player, chat, sidebar) get gated as they appear.
  new MutationObserver(gateElements).observe(document.body, { childList: true, subtree: true });
}

/** Neutralises any [data-requires-auth] control that isn't already gated. */
function gateElements() {
  document.querySelectorAll('[data-requires-auth]:not([data-guest-gated])').forEach((el) => {
    el.setAttribute('data-guest-gated', 'true');
    el.setAttribute('aria-disabled', 'true');
    el.classList.add('guest-locked');

    // Deliberately NOT setting el.disabled: browsers don't dispatch click on a
    // disabled control, so the signup toast would never fire when a guest taps
    // the thing they're being asked to sign up for. Text fields get readOnly
    // (blocks typing, still clickable); everything else is stopped in capture.
    const tag = el.tagName;
    if (tag === 'TEXTAREA' || (tag === 'INPUT' && /^(text|search|email|password)$/i.test(el.type))) {
      el.readOnly = true;
    }

    // Capture phase so this runs before the element's own click handlers.
    el.addEventListener('click', blockAndPrompt, true);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) blockAndPrompt(e);
    }, true);
  });
}

function blockAndPrompt(e) {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  showGuestToast();
}

function buildToast() {
  if (toastEl) return;

  const style = document.createElement('style');
  style.textContent = `
    /* Anchored bottom-right, not bottom-centre: this banner is permanent, and
       centred it would sit on top of the chat composer on chat/math-chat. */
    #guest-toast {
      position: fixed; right: 1.5rem; bottom: 1.5rem; transform: translateY(1rem);
      display: none; align-items: center; gap: 0.875rem; z-index: 9999;
      max-width: 26rem; padding: 0.875rem 1rem; border-radius: 1rem;
      background: var(--bg-card, #16151c); border: 1px solid var(--bd2, rgba(139,92,246,0.25));
      box-shadow: 0 1.25rem 2.5rem rgba(0,0,0,0.35);
      opacity: 0; transition: opacity .3s ease, transform .3s ease;
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    }
    #guest-toast.is-visible { opacity: 1; transform: translateY(0); }
    @keyframes gt-nudge {
      0%,100% { transform: translateY(0); }
      30%     { transform: translateY(-0.375rem); }
      60%     { transform: translateY(-0.125rem); }
    }
    #guest-toast.is-nudging { animation: gt-nudge .5s ease; }
    #guest-toast img { height: 2.25rem; width: auto; flex-shrink: 0; }
    #guest-toast .gt-body { display: flex; flex-direction: column; gap: 0.125rem; }
    #guest-toast .gt-header { font-size: 0.875rem; font-weight: 700; color: var(--tx, #fff); }
    #guest-toast .gt-text { font-size: 0.8125rem; color: var(--tx2, #a1a1aa); }
    #guest-toast .gt-cta {
      flex-shrink: 0; padding: 0.5rem 0.9rem; border-radius: 999px; border: none;
      background: var(--p4, #8b5cf6); color: #fff; font-size: 0.8125rem; font-weight: 600;
      cursor: pointer; text-decoration: none; white-space: nowrap;
    }
    .guest-locked { opacity: 0.55; cursor: not-allowed !important; }
    /* On phones it sits at the top — bottom would cover the chat input. */
    @media (max-width: 30rem) {
      #guest-toast {
        left: 0.75rem; right: 0.75rem; bottom: auto; top: 0.75rem;
        transform: translateY(-1rem); max-width: none;
      }
      #guest-toast.is-visible { transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);

  toastEl = document.createElement('div');
  toastEl.id = 'guest-toast';
  toastEl.setAttribute('role', 'status');
  toastEl.innerHTML = `
    <img src="${basePath}logo-images/newlogo12.png" alt="Korah"/>
    <span class="gt-body">
      <span class="gt-header">You're not logged in</span>
      <span class="gt-text">Create an account to continue for free!</span>
    </span>
    <a class="gt-cta" href="${basePath}login.html">Sign up</a>
  `;
  document.body.appendChild(toastEl);
}

/**
 * Hard block for pages that render nothing but users/{uid} data. Non-dismissible
 * by design: no close button, no backdrop click, Escape suppressed, page scroll
 * locked. Shows on every load while signed out — nothing is remembered.
 *
 * The only ways past it are signing up or navigating away, both of which are
 * links inside the modal.
 */
export function showAuthWall(base = '') {
  if (document.getElementById('auth-wall')) return;
  basePath = base;

  const style = document.createElement('style');
  style.textContent = `
    #auth-wall {
      position: fixed; inset: 0; z-index: 2147483647;
      display: flex; align-items: center; justify-content: center; padding: 1.5rem;
      background: rgba(4, 2, 12, 0.82);
      backdrop-filter: blur(0.75rem); -webkit-backdrop-filter: blur(0.75rem);
      font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
      opacity: 0; transition: opacity .35s ease;
    }
    #auth-wall.is-visible { opacity: 1; }
    #auth-wall .aw-card {
      position: relative; text-align: center; max-width: 27rem; width: 100%;
      padding: 2.5rem 2rem 2rem; border-radius: 1.25rem;
      background: var(--sf, #16151c); border: 0.0625rem solid var(--bd2, rgba(139,92,246,0.3));
      box-shadow: 0 1.5rem 4rem rgba(0,0,0,0.5), 0 0 2rem rgba(139,92,246,0.2);
      transform: translateY(1rem) scale(0.97); transition: transform .4s cubic-bezier(0.34,1.56,0.64,1);
      display: flex; flex-direction: column; align-items: center;
    }
    #auth-wall.is-visible .aw-card { transform: translateY(0) scale(1); }
    #auth-wall .aw-logo {
      width: 5rem; height: 5rem; object-fit: contain; margin-bottom: 1rem;
      filter: drop-shadow(0 0.625rem 1.75rem rgba(139,92,246,0.45));
    }
    #auth-wall .aw-title {
      font-size: 1.375rem; font-weight: 800; line-height: 1.3; margin: 0 0 0.625rem;
      color: var(--tx, #fff);
    }
    #auth-wall .aw-desc {
      font-size: 0.9375rem; line-height: 1.6; margin: 0 0 1.75rem;
      color: #fff;
    }
    #auth-wall .aw-primary {
      position: relative; overflow: hidden; isolation: isolate;
      display: block; width: 100%; padding: 0.8125rem 1.25rem; border-radius: 0.75rem;
      background: var(--p4, #8b5cf6);
      color: #fff; font-size: 0.9375rem; font-weight: 700; text-decoration: none;
      border: none; cursor: pointer;
      transition: transform .3s cubic-bezier(0.34,1.56,0.64,1), box-shadow .3s ease;
    }
    #auth-wall .aw-primary::before {
      content: ''; position: absolute; inset: 0; z-index: 0;
      background: #a78bfa;
      transform: scaleX(0); transform-origin: left center;
      transition: transform .4s ease;
    }
    #auth-wall .aw-primary-label { position: relative; z-index: 1; }
    #auth-wall .aw-primary:hover {
      transform: scale(1.06);
      box-shadow: 0 0.75rem 2rem rgba(139,92,246,.45);
    }
    #auth-wall .aw-primary:hover::before { transform: scaleX(1); }
    #auth-wall .aw-secondary {
      display: inline-block; margin-top: 1rem; font-size: 0.8125rem; font-weight: 600;
      color: #fff; text-decoration: none;
    }
    #auth-wall .aw-secondary:hover { color: #fff; }
  `;
  document.head.appendChild(style);

  const wall = document.createElement('div');
  wall.id = 'auth-wall';
  wall.setAttribute('role', 'alertdialog');
  wall.setAttribute('aria-modal', 'true');
  wall.setAttribute('aria-labelledby', 'aw-title');
  wall.innerHTML = `
    <div class="aw-card">
      <img class="aw-logo" src="${basePath}logo-images/newlogo12.png" alt="Korah"/>
      <h2 class="aw-title" id="aw-title">This feature requires you to have an account.</h2>
      <p class="aw-desc">Make one for free now!</p>
      <a class="aw-primary" href="${basePath}login.html"><span class="aw-primary-label">Create a free account</span></a>
      <a class="aw-secondary" href="${basePath}home.html">Back to Korah</a>
    </div>
  `;
  document.body.appendChild(wall);
  requestAnimationFrame(() => wall.classList.add('is-visible'));

  document.body.style.overflow = 'hidden';

  // Swallow Escape so the page's own modal handlers can't be used to close this.
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); }
  }, true);

  // Keep focus inside the wall so the page behind stays unreachable by keyboard.
  const focusables = wall.querySelectorAll('a');
  focusables[0]?.focus();
  wall.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

/**
 * Raises the signup banner and leaves it up. There is no auto-hide and no
 * dismiss: while the visitor is signed out the banner stays on screen.
 * Safe to call repeatedly — after the first call it just nudges for attention.
 */
export function showGuestToast() {
  if (!toastEl) buildToast();

  if (toastEl.classList.contains('is-visible')) {
    // Already up (e.g. the visitor clicked a locked control). Bounce it so the
    // click still produces visible feedback instead of appearing to do nothing.
    toastEl.classList.remove('is-nudging');
    void toastEl.offsetWidth; // reflow, so the animation can restart
    toastEl.classList.add('is-nudging');
    return;
  }

  toastEl.style.display = 'flex';
  requestAnimationFrame(() => toastEl.classList.add('is-visible'));
}

/** Shows the banner on page load, on every load while signed out. */
export function showGuestToastOnce(base = '') {
  if (base) basePath = base;
  setTimeout(showGuestToast, 600);
}
