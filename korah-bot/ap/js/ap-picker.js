(function () {
  "use strict";
  const list = document.getElementById("exam-list");

  async function init() {
    try {
      const response = await fetch("./data/manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`manifest returned ${response.status}`);
      const manifest = await response.json();
      list.innerHTML = manifest.exams.map((exam) => `
        <article class="ap-exam-card">
          <span class="ap-course-badge">${exam.courseTitle}</span>
          <h3>${exam.title}</h3>
          <div class="ap-exam-meta">
            <span><i class="material-icons-round">quiz</i>${exam.questionCount} questions</span>
            <span><i class="material-icons-round">schedule</i>${window.KorahAP.formatDuration(exam.durationSec)}</span>
          </div>
          <p>Two timed multiple-choice parts with a calculator break between them.</p>
          <a class="ap-primary-button" href="${window.KorahAP.examUrl(exam.id)}">View exam <i class="material-icons-round">arrow_forward</i></a>
        </article>`).join("");
    } catch (error) {
      console.error("[AP picker]", error);
      list.innerHTML = `<div class="ap-error"><strong>Exams could not be loaded.</strong><span>Open this page through Live Server instead of a file:// URL.</span></div>`;
    }
  }
  init();
})();
