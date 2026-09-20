"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
require("../korah-bot/ap/js/ap-core.js");
const { gradeExam, remainingSeconds } = global.KorahAPCore;

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
