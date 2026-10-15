(function () {
  "use strict";
  const list = document.getElementById("exam-list");

  // One accent per course, matching the FRQ picker on ./index.html.
  const COURSE_TONES = { "ap-calculus-ab": "tone-blue", "ap-us-history": "tone-pink" };

  async function init() {
    try {
      const response = await fetch("./data/manifest.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`manifest returned ${response.status}`);
      const manifest = await response.json();
      list.innerHTML = manifest.exams.map((exam) => `
        <a class="ap-course-card ${COURSE_TONES[exam.course] || "tone-blue"}" href="${window.KorahAP.examUrl(exam.id)}">
          <div class="ap-course-card-top">
            <div class="ap-exam-icon"><span class="material-icons-round">functions</span></div>
            <span class="ap-badge ap-badge-timer">${window.KorahAP.formatDuration(exam.durationSec)}</span>
          </div>
          <div>
            <div class="ap-course-name">${exam.title}</div>
            <p class="ap-course-tagline">${exam.blurb}</p>
          </div>
          <div class="ap-course-stats">
            <span><b>${exam.questionCount}</b> questions</span>
            <span>${exam.courseTitle}</span>
          </div>
          <span class="ap-course-cta">Review exam setup <span class="material-icons-round" style="font-size:1.125rem;">arrow_forward</span></span>
        </a>`).join("");
    } catch (error) {
      console.error("[AP picker]", error);
      list.innerHTML = `<div class="ap-error"><strong>Exams could not be loaded.</strong><span>Open this page through Live Server instead of a file:// URL.</span></div>`;
    }
  }
  init();
})();
