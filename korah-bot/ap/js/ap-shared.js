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

  function renderInlineMath(value) {
    return String(value || "")
      .replaceAll("≤", "&le;")
      .replaceAll("≥", "&ge;")
      .replaceAll("−", "&minus;");
  }

  window.KorahAP = { formatDuration, examUrl, renderInlineMath };
})();
