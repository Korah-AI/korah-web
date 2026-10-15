/* First-visit intro carousel. Wires every .kintro on the page: the slides,
   dots, Back/Next buttons, close button and backdrop. A carousel opens once
   per browser, tracked by the localStorage key in data-intro-key, and the
   last slide's button label comes from data-intro-done.

   Pages that already carry their own intro script (home.html, math-chat.html,
   college-prep, college-match) are untouched; this is for the rest. */
(function () {
  function setup(modal) {
    var key = modal.dataset.introKey;
    if (!key || localStorage.getItem(key)) return;

    var slides = modal.querySelectorAll('.kintro-slide');
    var dots = modal.querySelectorAll('.kintro-dot');
    var prevBtn = modal.querySelector('.kintro-btn:not(.is-primary)');
    var nextBtn = modal.querySelector('.kintro-btn.is-primary');
    var doneLabel = modal.dataset.introDone || 'Get started';
    var current = 0;

    function goToSlide(idx) {
      current = Math.max(0, Math.min(idx, slides.length - 1));
      slides.forEach(function (s, i) { s.classList.toggle('is-active', i === current); });
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === current); });
      prevBtn.style.visibility = current === 0 ? 'hidden' : 'visible';
      nextBtn.textContent = current === slides.length - 1 ? doneLabel : 'Next';
    }

    function close() {
      modal.classList.remove('is-open');
      localStorage.setItem(key, 'true');
    }

    nextBtn.addEventListener('click', function () {
      if (current === slides.length - 1) close();
      else goToSlide(current + 1);
    });
    prevBtn.addEventListener('click', function () { goToSlide(current - 1); });
    modal.querySelector('.kintro-close').addEventListener('click', close);
    modal.querySelector('.kintro-backdrop').addEventListener('click', close);
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { goToSlide(i); });
    });

    goToSlide(0);
    setTimeout(function () { modal.classList.add('is-open'); }, 600);
  }

  function init() { document.querySelectorAll('.kintro').forEach(setup); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
