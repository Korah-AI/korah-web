// Scrollbars fade out after 2s without scrolling. Adds .is-scrolling to the element that
// scrolled; app/korah-chat.css turns that into a visible thumb colour.
(function () {
  var HIDE_AFTER_MS = 2000;
  var timers = new WeakMap();
  document.addEventListener('scroll', function (e) {
    var el = e.target === document ? document.documentElement : e.target;
    if (!el || !el.classList) return;
    el.classList.add('is-scrolling');
    clearTimeout(timers.get(el));
    timers.set(el, setTimeout(function () { el.classList.remove('is-scrolling'); }, HIDE_AFTER_MS));
  }, true);
})();
