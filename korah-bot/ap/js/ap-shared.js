(function () {
  "use strict";

  function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    return hours ? `${hours} hr${remainder ? ` ${remainder} min` : ""}` : `${minutes} min`;
  }

  function examUrl(id) {
    return `./exam.html?exam=${encodeURIComponent(id)}`;
  }

  const HTML_ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };

  // Question text is written into innerHTML next to markup the player builds,
  // so the HTML-significant characters have to be escaped. A stem like
  // "f(x)<g(x)" is otherwise parsed as a tag and swallows the rest of the
  // line. Maths symbols such as ≤ and − are valid UTF-8 and pass through.
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"]/g, (char) => HTML_ESCAPES[char]);
  }

  window.KorahAP = { formatDuration, examUrl, escapeHtml };
})();
