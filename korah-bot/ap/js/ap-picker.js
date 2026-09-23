(function () {
  "use strict";
  const list = document.getElementById("exam-list");

  async function init() {
    try {
      const response = await fetch("./data/manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`manifest returned ${response.status}`);
      const manifest = await response.json();
      list.innerHTML = manifest.exams.map((exam) => `
        <article class="ap-exam-card tone-blue">
          <div class="ap-card-top"><span class="ap-course-badge">${exam.courseTitle}</span><span class="ap-ready-badge"><i class="material-icons-round">check_circle</i> Ready</span></div>
          <div class="ap-exam-icon"><i class="material-icons-round">functions</i></div>
          <h3>${exam.title}</h3>
          <div class="ap-exam-meta">
            <span><i class="material-icons-round">quiz</i>${exam.questionCount} questions</span>
            <span><i class="material-icons-round">schedule</i>${window.KorahAP.formatDuration(exam.durationSec)}</span>
          </div>
          <p>Two timed multiple-choice parts with a calculator break between them.</p>
          <a class="ap-primary-button" href="${window.KorahAP.examUrl(exam.id)}">Review exam setup <i class="material-icons-round">arrow_forward</i></a>
        </article>`).join("");
      initCardEffects();
    } catch (error) {
      console.error("[AP picker]", error);
      list.innerHTML = `<div class="ap-error"><strong>Exams could not be loaded.</strong><span>Open this page through Live Server instead of a file:// URL.</span></div>`;
    }
  }
  function initCardEffects() {
    document.addEventListener("pointermove", (event) => {
      const card = event.target.closest?.(".ap-exam-card");
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--spotlight-x", `${event.clientX - rect.left}px`);
      card.style.setProperty("--spotlight-y", `${event.clientY - rect.top}px`);
      card.style.setProperty("--spotlight-opacity", ".65");
    }, { passive: true });
    document.addEventListener("pointerout", (event) => {
      const card = event.target.closest?.(".ap-exam-card");
      if (card && !(event.relatedTarget && card.contains(event.relatedTarget))) card.style.setProperty("--spotlight-opacity", "0");
    }, { passive: true });
  }
  init();
})();
