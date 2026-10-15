#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const DEFAULT_FILES = [
  path.join(REPO_ROOT, "korah-bot", "ap", "data", "ap-calculus-ab", "questions.json"),
  path.join(REPO_ROOT, "korah-bot", "ap", "data", "ap-us-history", "questions.json"),
];
const STATUS_VALUES = new Set(["draft", "ready", "retired"]);
const DIFFICULTY_VALUES = new Set(["easy", "medium", "hard"]);
const CALCULATOR_VALUES = new Set(["prohibited", "allowed", "required", "not-applicable"]);
const ORIGIN_VALUES = new Set(["original", "adapted-open", "public-domain", "contributor"]);
const REVIEW_VALUES = new Set(["draft", "reviewed"]);
const CHOICE_KEYS = ["A", "B", "C", "D"];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    return /^https?:$/.test(new URL(value).protocol);
  } catch {
    return false;
  }
}

function hasBalancedMath(value) {
  if (typeof value !== "string") return true;
  return (value.match(/\\\(/g) || []).length === (value.match(/\\\)/g) || []).length;
}

function validateQuestion(question, index, course, ids, errors) {
  const at = `$.questions[${index}]`;
  if (!isObject(question)) {
    errors.push(`${at}: expected an object`);
    return;
  }

  if (!isNonEmptyString(question.id)) errors.push(`${at}.id: expected a non-empty string`);
  else if (ids.has(question.id)) errors.push(`${at}.id: duplicate question id ${question.id}`);
  else ids.add(question.id);

  if (!STATUS_VALUES.has(question.status)) errors.push(`${at}.status: expected draft, ready, or retired`);
  for (const field of ["unit", "unitLabel", "topic", "stem", "explanation"]) {
    if (!isNonEmptyString(question[field])) errors.push(`${at}.${field}: expected a non-empty string`);
  }
  if (!Array.isArray(question.skills) || question.skills.length === 0 || question.skills.some((skill) => !isNonEmptyString(skill))) {
    errors.push(`${at}.skills: expected at least one non-empty skill`);
  }
  if (!DIFFICULTY_VALUES.has(question.difficulty)) errors.push(`${at}.difficulty: expected easy, medium, or hard`);
  if (!CALCULATOR_VALUES.has(question.calculator)) errors.push(`${at}.calculator: unsupported calculator policy`);

  if (!Array.isArray(question.choices) || question.choices.length !== 4) {
    errors.push(`${at}.choices: expected exactly four choices`);
  } else {
    const seenKeys = [];
    question.choices.forEach((choice, choiceIndex) => {
      const choiceAt = `${at}.choices[${choiceIndex}]`;
      if (!isObject(choice)) {
        errors.push(`${choiceAt}: expected an object`);
        return;
      }
      if (!isNonEmptyString(choice.key)) errors.push(`${choiceAt}.key: expected a non-empty string`);
      else seenKeys.push(choice.key);
      if (!isNonEmptyString(choice.text)) errors.push(`${choiceAt}.text: expected a non-empty string`);
      if (!hasBalancedMath(choice.text)) errors.push(`${choiceAt}.text: unbalanced inline math delimiters`);
    });
    if (seenKeys.join(",") !== CHOICE_KEYS.join(",")) {
      errors.push(`${at}.choices: keys must be unique and ordered A, B, C, D`);
    }
  }

  if (!CHOICE_KEYS.includes(question.answer)) errors.push(`${at}.answer: must match one declared choice key`);
  if (!hasBalancedMath(question.stem)) errors.push(`${at}.stem: unbalanced inline math delimiters`);
  if (!hasBalancedMath(question.explanation)) errors.push(`${at}.explanation: unbalanced inline math delimiters`);

  const source = question.source;
  if (!isObject(source)) {
    errors.push(`${at}.source: expected an object`);
  } else {
    if (!ORIGIN_VALUES.has(source.origin)) errors.push(`${at}.source.origin: unsupported source origin`);
    for (const field of ["name", "license", "attribution"]) {
      if (!isNonEmptyString(source[field])) errors.push(`${at}.source.${field}: expected a non-empty string`);
    }
    if (source.origin !== "original") {
      if (!isHttpUrl(source.url)) errors.push(`${at}.source.url: non-original questions require an absolute HTTP(S) URL`);
      if (!isHttpUrl(source.licenseUrl)) errors.push(`${at}.source.licenseUrl: non-original questions require an absolute license URL`);
      if (!isNonEmptyString(source.adaptationNotes)) errors.push(`${at}.source.adaptationNotes: explain how the source was used`);
    }
  }

  const review = question.review;
  if (!isObject(review) || !REVIEW_VALUES.has(review.status)) {
    errors.push(`${at}.review.status: expected draft or reviewed`);
  }
  if (question.status === "ready") {
    if (!isObject(review) || review.status !== "reviewed") errors.push(`${at}.review.status: ready questions must be reviewed`);
    if (!isObject(review) || !isNonEmptyString(review.reviewedBy)) errors.push(`${at}.review.reviewedBy: ready questions require a reviewer`);
    if (!isObject(review) || !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewedAt || "")) {
      errors.push(`${at}.review.reviewedAt: ready questions require a YYYY-MM-DD review date`);
    }
  }

  const expectedPrefix = course === "ap-calculus-ab" ? "calc-ab-bank-" : "apush-bank-";
  if (!question.id?.startsWith(expectedPrefix)) errors.push(`${at}.id: id does not match the ${course} prefix`);
}

function validateQuestionBank(filePath) {
  const errors = [];
  let bank;
  try {
    bank = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    return { errors: [`$: ${error.code === "ENOENT" ? "file not found" : error.message}`], bank: null };
  }

  if (!isObject(bank)) return { errors: ["$: expected an object"], bank: null };
  if (bank.schemaVersion !== 1) errors.push("$.schemaVersion: expected 1");
  if (!["ap-calculus-ab", "ap-us-history"].includes(bank.course)) errors.push("$.course: unsupported MVP course");
  if (!isNonEmptyString(bank.title)) errors.push("$.title: expected a non-empty string");
  if (!Array.isArray(bank.alignmentSources) || bank.alignmentSources.length === 0) {
    errors.push("$.alignmentSources: expected at least one alignment source");
  } else {
    bank.alignmentSources.forEach((source, index) => {
      const at = `$.alignmentSources[${index}]`;
      if (!isObject(source) || !isNonEmptyString(source.name) || !isHttpUrl(source.url) || !isNonEmptyString(source.use)) {
        errors.push(`${at}: expected name, absolute URL, and use`);
      }
    });
  }

  if (!Array.isArray(bank.questions) || bank.questions.length === 0) {
    errors.push("$.questions: expected at least one question");
  } else {
    const ids = new Set();
    bank.questions.forEach((question, index) => validateQuestion(question, index, bank.course, ids, errors));
  }
  return { errors, bank };
}

function main() {
  const files = process.argv.slice(2);
  const targets = files.length ? files.map((file) => path.resolve(file)) : DEFAULT_FILES;
  let failed = false;
  targets.forEach((file) => {
    const result = validateQuestionBank(file);
    if (result.errors.length) {
      failed = true;
      console.error(`\n${path.relative(REPO_ROOT, file)}`);
      result.errors.forEach((error) => console.error(`  - ${error}`));
    } else {
      console.log(`validated ${path.relative(REPO_ROOT, file)} (${result.bank.questions.length} questions)`);
    }
  });
  if (failed) process.exitCode = 1;
}

if (require.main === module) main();

module.exports = { validateQuestionBank };
