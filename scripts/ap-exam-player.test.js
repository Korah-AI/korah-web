"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
require("../korah-bot/ap/js/ap-core.js");
const { gradeExam, remainingSeconds, predictedScore, unitBreakdown } = global.KorahAPCore;

const exam = {
  parts: [
    { questions: [{ id: "q1", answer: "A" }, { id: "q2", answer: "C" }] },
    { questions: [{ id: "q3", answer: "B" }] },
  ],
};

test("grades all parts once using strict answer-key comparison", () => {
  assert.deepEqual(gradeExam(exam, new Map([["q1", "A"], ["q2", "C"], ["q3", "B"]])), { rawScore: 3, total: 3, answered: 3 });
  assert.deepEqual(gradeExam(exam, { q1: "A", q2: "B" }), { rawScore: 1, total: 3, answered: 2 });
});

test("treats unanswered questions as incorrect", () => {
  assert.deepEqual(gradeExam(exam, {}), { rawScore: 0, total: 3, answered: 0 });
});

test("countdown tracks the deadline and never goes negative", () => {
  assert.equal(remainingSeconds(10000, 8000), 2);
  assert.equal(remainingSeconds(10000, 9500), 1);
  assert.equal(remainingSeconds(10000, 10000), 0);
  assert.equal(remainingSeconds(10000, 45000), 0);
});

test("countdown survives a gap larger than one tick", () => {
  // A backgrounded tab stops firing setInterval; the next tick must land on
  // the true remaining time, not one second less than before.
  assert.equal(remainingSeconds(600000, 90000), 510);
});

const curve = [
  { rawMin: 0, apScore: 1 },
  { rawMin: 15, apScore: 2 },
  { rawMin: 20, apScore: 3 },
  { rawMin: 27, apScore: 4 },
  { rawMin: 33, apScore: 5 },
];

test("predicted score picks the highest band the raw score reaches", () => {
  assert.equal(predictedScore(curve, 0), 1);
  assert.equal(predictedScore(curve, 14), 1);
  assert.equal(predictedScore(curve, 15), 2);
  assert.equal(predictedScore(curve, 26), 3);
  assert.equal(predictedScore(curve, 33), 5);
  assert.equal(predictedScore(curve, 45), 5);
});

test("predicted score is null when an exam ships no curve", () => {
  assert.equal(predictedScore(undefined, 30), null);
  assert.equal(predictedScore([], 30), null);
});

const unitExam = {
  parts: [
    { questions: [
      { id: "q1", unit: "unit-1", answer: "A" },
      { id: "q2", unit: "unit-2", answer: "B" },
    ] },
    { questions: [
      { id: "q3", unit: "unit-1", answer: "C" },
    ] },
  ],
};

test("unit breakdown spans every part and keeps first-appearance order", () => {
  assert.deepEqual(unitBreakdown(unitExam, { q1: "A", q2: "X", q3: "C" }), [
    { unit: "unit-1", correct: 2, total: 2 },
    { unit: "unit-2", correct: 0, total: 1 },
  ]);
});

test("unit breakdown counts unanswered questions as incorrect", () => {
  assert.deepEqual(unitBreakdown(unitExam, new Map()), [
    { unit: "unit-1", correct: 0, total: 2 },
    { unit: "unit-2", correct: 0, total: 1 },
  ]);
});
