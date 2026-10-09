"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { validateQuestionBank } = require("./validate-ap-question-bank.js");

function question() {
  return {
    id: "calc-ab-bank-u1-001",
    status: "draft",
    unit: "unit-1",
    unitLabel: "Limits and Continuity",
    topic: "Limits",
    skills: ["procedural"],
    difficulty: "easy",
    calculator: "prohibited",
    stem: "What is \\(1+1\\)?",
    choices: [
      { key: "A", text: "\\(1\\)" },
      { key: "B", text: "\\(2\\)" },
      { key: "C", text: "\\(3\\)" },
      { key: "D", text: "\\(4\\)" },
    ],
    answer: "B",
    explanation: "Adding gives \\(2\\).",
    source: {
      origin: "original",
      name: "Korah original practice",
      url: "",
      license: "Korah original content",
      licenseUrl: "",
      attribution: "Written for Korah.",
      adaptationNotes: "",
    },
    review: { status: "draft", reviewedBy: "", reviewedAt: "" },
  };
}

function bank() {
  return {
    schemaVersion: 1,
    course: "ap-calculus-ab",
    title: "Question Bank",
    alignmentSources: [
      { name: "Course framework", url: "https://example.com/framework", use: "Alignment only" },
    ],
    questions: [question()],
  };
}

function validateFixture(value) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ap-bank-validator-"));
  const filePath = path.join(directory, "questions.json");
  fs.writeFileSync(filePath, JSON.stringify(value));
  try {
    return validateQuestionBank(filePath).errors;
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

test("accepts a valid original draft question", () => {
  assert.deepEqual(validateFixture(bank()), []);
});

test("reports duplicate ids, invalid choices, and a bad answer", () => {
  const value = bank();
  const second = question();
  second.choices[3].key = "C";
  second.answer = "Z";
  value.questions.push(second);
  const messages = validateFixture(value).join("\n");
  assert.match(messages, /duplicate question id/);
  assert.match(messages, /ordered A, B, C, D/);
  assert.match(messages, /must match one declared choice key/);
});

test("requires review metadata before a question is ready", () => {
  const value = bank();
  value.questions[0].status = "ready";
  const messages = validateFixture(value).join("\n");
  assert.match(messages, /ready questions must be reviewed/);
  assert.match(messages, /ready questions require a reviewer/);
  assert.match(messages, /YYYY-MM-DD/);
});

test("requires provenance for adapted content", () => {
  const value = bank();
  value.questions[0].source.origin = "adapted-open";
  const messages = validateFixture(value).join("\n");
  assert.match(messages, /absolute HTTP\(S\) URL/);
  assert.match(messages, /absolute license URL/);
  assert.match(messages, /explain how the source was used/);
});

test("accepts both checked-in MVP banks", () => {
  const root = path.resolve(__dirname, "..", "korah-bot", "ap", "data");
  for (const course of ["ap-calculus-ab", "ap-us-history"]) {
    const result = validateQuestionBank(path.join(root, course, "questions.json"));
    assert.deepEqual(result.errors, [], `${course}: ${result.errors.join("\n")}`);
  }
});
