(function () {
  const docEl = document.documentElement;
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
  const supportsNativeViewTransitions = "startViewTransition" in document;
  const fallbackEnabled = !supportsNativeViewTransitions && !prefersReducedMotion;
  const EXIT_MS = 180;

  if (fallbackEnabled) {
    docEl.classList.add("korah-transition-fallback");
  }

  function markReady() {
      if (docEl.classList.contains("korah-page-ready")) return;
      window.requestAnimationFrame(() => {
        setTimeout(() => { // The 50ms Settlement Delay
          docEl.classList.remove("korah-page-exiting");
          docEl.classList.add("korah-page-ready");
        }, 50);
      });
    }

  // Signal readiness on load or safety timeout
  if (document.readyState === "complete") {
    markReady();
  } else {
    window.addEventListener("load", markReady);
    document.addEventListener("DOMContentLoaded", () => {
        setTimeout(markReady, 500); // Give heavy JS a bit of breathing room
    });
  }
  
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) markReady();
  });
  
  setTimeout(markReady, 1500); // Fail-safe

  // URL Handling & Click Interception
  function toUrl(value) { try { return new URL(value, window.location.href); } catch (_) { return null; } }
  function isSamePageHash(target) {
    return target.origin === window.location.origin && target.pathname === window.location.pathname &&
           target.search === window.location.search && target.hash && target.hash !== window.location.hash;
  }
  function isCurrentPage(target) {
    return target.origin === window.location.origin && target.pathname === window.location.pathname &&
           target.search === window.location.search && target.hash === window.location.hash;
  }
  function isHtmlLikeNavigation(target) {
    const path = target.pathname || "";
    const lastSegment = path.split("/").pop() || "";
    return path.endsWith("/") || !lastSegment.includes(".") || lastSegment.endsWith(".html");
  }
  function shouldTransition(value) {
    const target = toUrl(value);
    if (!target || target.origin !== window.location.origin) return false;
    if (!["http:", "https:", "file:"].includes(target.protocol)) return false;
    if (isSamePageHash(target) || isCurrentPage(target)) return false;
    return isHtmlLikeNavigation(target);
  }

  function commitNavigation(value, mode) {
    if (mode === "replace") window.location.replace(value);
    else window.location.href = value;
  }

  function navigate(value, mode) {
    if (!shouldTransition(value) || !fallbackEnabled) {
      commitNavigation(value, mode);
      return true;
    }
    docEl.classList.add("korah-page-exiting");
    window.setTimeout(() => commitNavigation(value, mode), EXIT_MS);
    return true;
  }

  document.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest?.("a[href]");
    if (!anchor || (anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
    if (!shouldTransition(anchor.href)) return;
    
    if (fallbackEnabled) {
        event.preventDefault();
        navigate(anchor.href, "assign");
    }
  });

  window.KorahTransitions = {
    go(v) { return navigate(v, "assign"); },
    replace(v) { return navigate(v, "replace"); },
    goInstant(v) { commitNavigation(v, "assign"); return true; },
    replaceInstant(v) { commitNavigation(v, "replace"); return true; },
    shouldTransition,
    markReady
  };
})();
