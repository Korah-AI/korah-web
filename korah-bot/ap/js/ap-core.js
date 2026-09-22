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

  // The curve lists ascending rawMin thresholds; the predicted AP score is the
  // last one the raw score reaches.
  function predictedScore(curve, rawScore) {
    return (curve || []).reduce((score, band) => (rawScore >= band.rawMin ? band.apScore : score), null);
  }

  // CED unit is what the results screen groups by, in first-appearance order.
  function unitBreakdown(exam, answers) {
    const read = answers instanceof Map ? (id) => answers.get(id) : (id) => answers[id];
    const byUnit = new Map();
    exam.parts.forEach((part) => part.questions.forEach((question) => {
      const row = byUnit.get(question.unit) || { unit: question.unit, correct: 0, total: 0 };
      row.total += 1;
      if (read(question.id) === question.answer) row.correct += 1;
      byUnit.set(question.unit, row);
    }));
    return [...byUnit.values()];
  }

  return { gradeExam, remainingSeconds, predictedScore, unitBreakdown };
});
