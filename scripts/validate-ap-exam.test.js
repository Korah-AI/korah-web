"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { validateExam } = require("./validate-ap-exam.js");

function question(index, unit) {
  return {
    id: `calc-ab-mock-1-q${index}`,
    unit,
    stem: `Original practice question ${index}`,
    choices: [
      { key: "A", text: "First answer" },
      { key: "B", text: "Second answer" },
    ],
    answer: "A",
    explanation: "Explanation shown after submission.",
  };
}

function validExam() {
  const units = [
    ...Array(5).fill("unit-1"),
    ...Array(5).fill("unit-2"),
    ...Array(4).fill("unit-3"),
    ...Array(5).fill("unit-4"),
    ...Array(8).fill("unit-5"),
    ...Array(8).fill("unit-6"),
    ...Array(4).fill("unit-7"),
    ...Array(6).fill("unit-8"),
  ];
  return {
    schemaVersion: 1,
    status: "ready",
    id: "calc-ab-mock-1",
    course: "ap-calculus-ab",
    title: "AP Calculus AB Mock Exam 1",
    sources: [
      { name: "Original Source One", url: "https://example.com/source-one" },
      { name: "Original Source Two", url: "https://example.org/source-two" },
    ],
    parts: [
      {
        id: "part-a",
        title: "Part A",
        durationSec: 3600,
        calculator: "prohibited",
        questions: units.slice(0, 30).map((unit, index) => question(index + 1, unit)),
      },
      {
        id: "part-b",
        title: "Part B",
        durationSec: 2700,
        calculator: "required",
        questions: units.slice(30).map((unit, index) => question(index + 31, unit)),
      },
    ],
    curve: [
      { rawMin: 0, apScore: 1 },
      { rawMin: 12, apScore: 2 },
      { rawMin: 21, apScore: 3 },
      { rawMin: 29, apScore: 4 },
      { rawMin: 36, apScore: 5 },
    ],
  };
}

function validateFixture(exam) {
  const fixtureRoot = path.resolve(__dirname, "..", "korah-bot", "ap", "data", "calc-ab");
  fs.mkdirSync(fixtureRoot, { recursive: true });
  const directory = fs.mkdtempSync(path.join(fixtureRoot, ".validator-test-"));
  const examPath = path.join(directory, "exam.json");
  fs.writeFileSync(examPath, JSON.stringify(exam));
  try {
    return validateExam(examPath);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts a complete structurally valid exam", () => {
  assert.deepEqual(validateFixture(validExam()).errors, []);
});

test("reports duplicate ids and an answer outside the choice keys", () => {
  const exam = validExam();
  exam.parts[0].questions[1].id = exam.parts[0].questions[0].id;
  exam.parts[0].questions[1].answer = "Z";
  const messages = validateFixture(exam).errors.join("\n");
  assert.match(messages, /duplicate question id/);
  assert.match(messages, /must exactly match one declared choice key/);
});

test("reports missing assets and incomplete curves", () => {
  const exam = validExam();
  exam.parts[0].questions[0].assets = [{ path: "../../../assets/calc-ab/mock-1/missing.svg", alt: "Graph" }];
  exam.curve = [{ rawMin: 1, apScore: 1 }];
  const messages = validateFixture(exam).errors.join("\n");
  assert.match(messages, /asset file not found/);
  assert.match(messages, /curve must begin at raw score 0/);
  assert.match(messages, /missing threshold for AP score 5/);
});

test("reports a unit distribution outside CED bounds", () => {
  const exam = validExam();
  exam.parts[0].questions[0].unit = "unit-3";
  exam.parts[0].questions[1].unit = "unit-3";
  const messages = validateFixture(exam).errors.join("\n");
  assert.match(messages, /unit-1 has 3 questions; expected 5-6/);
  assert.match(messages, /unit-3 has 6 questions; expected 3-4/);
});

test("accepts the checked-in Calculus AB mock exam", () => {
  const examPath = path.resolve(__dirname, "..", "korah-bot", "ap", "data", "calc-ab", "mock-1.json");
  assert.deepEqual(validateExam(examPath).errors, []);
});
