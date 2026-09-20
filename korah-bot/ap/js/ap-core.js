(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.KorahAPCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function gradeExam(exam, answers) {
    const questions = exam.parts.flatMap((part) => part.questions);
    const read = answers instanceof Map ? (id) => answers.get(id) : (id) => answers[id];
    return {
      rawScore: questions.reduce((score, question) => score + (read(question.id) === question.answer ? 1 : 0), 0),
      total: questions.length,
      answered: questions.reduce((count, question) => count + (read(question.id) === undefined ? 0 : 1), 0),
    };
  }

  function remainingSeconds(deadlineMs, nowMs) {
    return Math.max(0, Math.ceil((deadlineMs - nowMs) / 1000));
  }

  return { gradeExam, remainingSeconds };
});
