#!/usr/bin/env node

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const REPO_ROOT = path.resolve(__dirname, "..");
const CATALOG_PATH = path.join(REPO_ROOT, "korah-bot", "ap", "data", "course-catalog.json");
const TOP_LEVEL_KEYS = new Set([
  "schemaVersion",
  "status",
  "id",
  "course",
  "title",
  "sources",
  "durationSec",
  "calculator",
  "questions",
  "curve",
]);
const QUESTION_KEYS = new Set(["id", "unit", "stem", "assets", "choices", "answer", "explanation"]);
const SOURCE_KEYS = new Set(["name", "url"]);
const ASSET_KEYS = new Set(["path", "alt"]);
const CHOICE_KEYS = new Set(["key", "text"]);
const CURVE_KEYS = new Set(["rawMin", "apScore"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlaceholder(value) {
  return value === null || (typeof value === "string" && /^(?:TO_BE_|AUTHOR_|PENDING)/i.test(value.trim()));
}

function addUnknownKeyErrors(value, allowed, jsonPath, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) errors.push(`${jsonPath}.${key}: unknown field`);
  }
}

function loadJson(filePath, label, errors) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    errors.push(`${label}: ${error.code === "ENOENT" ? "file not found" : error.message}`);
    return null;
  }
}

function countRange(total, unit) {
  return {
    min: Math.ceil((total * unit.mcqWeightMin) / 100),
    max: Math.floor((total * unit.mcqWeightMax) / 100),
  };
}

function validateSources(sources, ready, errors) {
  if (!Array.isArray(sources)) {
    errors.push("$.sources: expected an array");
    return;
  }
  if (ready && sources.length !== 2) errors.push("$.sources: ready exams must credit exactly two sources");
  sources.forEach((source, index) => {
    const jsonPath = `$.sources[${index}]`;
    if (!isObject(source)) {
      errors.push(`${jsonPath}: expected an object`);
      return;
    }
    addUnknownKeyErrors(source, SOURCE_KEYS, jsonPath, errors);
    if (!isNonEmptyString(source.name)) errors.push(`${jsonPath}.name: expected a non-empty string`);
    if (!isNonEmptyString(source.url)) errors.push(`${jsonPath}.url: expected a non-empty string`);
    else {
      try {
        const url = new URL(source.url);
        if (!/^https?:$/.test(url.protocol)) throw new Error("unsupported protocol");
      } catch {
        errors.push(`${jsonPath}.url: expected an absolute HTTP(S) URL`);
      }
    }
    if (ready && (isPlaceholder(source.name) || isPlaceholder(source.url))) {
      errors.push(`${jsonPath}: ready exams cannot contain source placeholders`);
    }
  });
}

function validateAssets(assets, questionPath, examDir, errors) {
  if (assets === undefined) return;
  if (!Array.isArray(assets)) {
    errors.push(`${questionPath}.assets: expected an array`);
    return;
  }
  assets.forEach((asset, index) => {
    const assetPath = `${questionPath}.assets[${index}]`;
    if (!isObject(asset)) {
      errors.push(`${assetPath}: expected an object`);
      return;
    }
    addUnknownKeyErrors(asset, ASSET_KEYS, assetPath, errors);
    if (!isNonEmptyString(asset.path)) {
      errors.push(`${assetPath}.path: expected a non-empty string`);
    } else if (path.isAbsolute(asset.path)) {
      errors.push(`${assetPath}.path: absolute paths are not allowed`);
    } else {
      const resolved = path.resolve(examDir, asset.path);
      const relative = path.relative(REPO_ROOT, resolved);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        errors.push(`${assetPath}.path: path escapes the repository`);
      } else if (!fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        errors.push(`${assetPath}.path: asset file not found (${asset.path})`);
      }
    }
    if (!isNonEmptyString(asset.alt)) errors.push(`${assetPath}.alt: expected meaningful alternative text`);
  });
}

function validateQuestions(questions, unitsById, examId, examDir, errors) {
  const counts = new Map([...unitsById.keys()].map((unitId) => [unitId, 0]));
  if (!Array.isArray(questions) || questions.length === 0) {
    errors.push("$.questions: expected a non-empty array");
    return { counts, total: 0 };
  }

  const questionIds = new Set();
  questions.forEach((question, index) => {
    const questionPath = `$.questions[${index}]`;
    if (!isObject(question)) {
      errors.push(`${questionPath}: expected an object`);
      return;
    }
    addUnknownKeyErrors(question, QUESTION_KEYS, questionPath, errors);
    if (!isNonEmptyString(question.id)) errors.push(`${questionPath}.id: expected a non-empty string`);
    else {
      if (questionIds.has(question.id)) errors.push(`${questionPath}.id: duplicate question id ${JSON.stringify(question.id)}`);
      questionIds.add(question.id);
      const expectedId = `${examId}-q${index + 1}`;
      if (question.id !== expectedId) errors.push(`${questionPath}.id: expected ${JSON.stringify(expectedId)} for this stable position`);
    }

    if (!isNonEmptyString(question.unit) || !unitsById.has(question.unit)) {
      errors.push(`${questionPath}.unit: unsupported unit id ${JSON.stringify(question.unit)}`);
    } else {
      counts.set(question.unit, counts.get(question.unit) + 1);
    }
    if (!isNonEmptyString(question.stem)) errors.push(`${questionPath}.stem: expected a non-empty string`);
    if (!isNonEmptyString(question.explanation)) errors.push(`${questionPath}.explanation: expected a non-empty string`);
    validateAssets(question.assets, questionPath, examDir, errors);

    if (!Array.isArray(question.choices) || question.choices.length < 2) {
      errors.push(`${questionPath}.choices: expected at least two choices`);
    } else {
      const choiceIds = new Set();
      question.choices.forEach((choice, choiceIndex) => {
        const choicePath = `${questionPath}.choices[${choiceIndex}]`;
        if (!isObject(choice)) {
          errors.push(`${choicePath}: expected an object`);
          return;
        }
        addUnknownKeyErrors(choice, CHOICE_KEYS, choicePath, errors);
        if (!isNonEmptyString(choice.key)) errors.push(`${choicePath}.key: expected a non-empty string`);
        else if (choiceIds.has(choice.key)) errors.push(`${choicePath}.key: duplicate choice key ${JSON.stringify(choice.key)}`);
        else choiceIds.add(choice.key);
        if (!isNonEmptyString(choice.text)) errors.push(`${choicePath}.text: expected a non-empty string`);
      });
      if (!isNonEmptyString(question.answer) || !choiceIds.has(question.answer)) {
        errors.push(`${questionPath}.answer: must exactly match one declared choice key`);
      }
    }
  });
  return { counts, total: questions.length };
}

function validateCurve(curve, totalQuestions, errors) {
  if (!Array.isArray(curve) || curve.length === 0) {
    errors.push("$.curve: expected a non-empty array");
    return;
  }
  const seenRaw = new Set();
  const seenScores = new Set();
  let priorRaw = -1;
  curve.forEach((entry, index) => {
    const curvePath = `$.curve[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${curvePath}: expected an object`);
      return;
    }
    addUnknownKeyErrors(entry, CURVE_KEYS, curvePath, errors);
    if (!Number.isInteger(entry.rawMin) || entry.rawMin < 0 || entry.rawMin > totalQuestions) {
      errors.push(`${curvePath}.rawMin: expected an integer from 0 through ${totalQuestions}`);
    } else {
      if (seenRaw.has(entry.rawMin)) errors.push(`${curvePath}.rawMin: duplicate threshold ${entry.rawMin}`);
      if (entry.rawMin <= priorRaw) errors.push(`${curvePath}.rawMin: thresholds must be strictly ascending`);
      seenRaw.add(entry.rawMin);
      priorRaw = entry.rawMin;
    }
    if (!Number.isInteger(entry.apScore) || entry.apScore < 1 || entry.apScore > 5) {
      errors.push(`${curvePath}.apScore: expected an integer from 1 through 5`);
    } else {
      if (seenScores.has(entry.apScore)) errors.push(`${curvePath}.apScore: duplicate AP score ${entry.apScore}`);
      seenScores.add(entry.apScore);
    }
  });
  if (curve[0]?.rawMin !== 0) errors.push("$.curve[0].rawMin: curve must begin at raw score 0");
  for (let score = 1; score <= 5; score += 1) {
    if (!seenScores.has(score)) errors.push(`$.curve: missing threshold for AP score ${score}`);
  }
}

function distributionRows(course, counts, total) {
  return course.units.map((unit) => {
    const count = counts.get(unit.id) || 0;
    const range = countRange(total, unit);
    return {
      ...unit,
      count,
      percent: total ? (count / total) * 100 : 0,
      countMin: range.min,
      countMax: range.max,
      valid: total > 0 && count >= range.min && count <= range.max,
    };
  });
}

function printDistribution(rows) {
  console.log("\nUnit distribution (whole-question bounds use ceil(min) and floor(max)):");
  console.log("Unit    Questions  Actual   CED weight  Allowed  Status  Label");
  for (const row of rows) {
    console.log(
      `${row.id.padEnd(7)} ${String(row.count).padStart(9)}  ${row.percent.toFixed(1).padStart(6)}%  ` +
      `${`${row.mcqWeightMin}-${row.mcqWeightMax}%`.padStart(10)}  ` +
      `${`${row.countMin}-${row.countMax}`.padStart(7)}  ${row.valid ? "OK    " : "OUT   "}  ${row.label}`
    );
  }
}

function validateExam(examPath) {
  const errors = [];
  const catalog = loadJson(CATALOG_PATH, "$catalog", errors);
  const exam = loadJson(examPath, "$", errors);
  if (!catalog || !exam) return { errors, exam: null, rows: [] };
  if (!isObject(exam)) return { errors: ["$: expected an object"], exam: null, rows: [] };

  addUnknownKeyErrors(exam, TOP_LEVEL_KEYS, "$", errors);
  if (exam.schemaVersion !== 1) errors.push("$.schemaVersion: expected 1");
  if (!['draft', 'ready'].includes(exam.status)) errors.push('$.status: expected "draft" or "ready"');
  const ready = exam.status === "ready";
  for (const field of ["id", "course", "title"]) {
    if (!isNonEmptyString(exam[field])) errors.push(`$.${field}: expected a non-empty string`);
    else if (ready && isPlaceholder(exam[field])) errors.push(`$.${field}: ready exams cannot contain placeholders`);
  }
  const course = catalog.courses?.[exam.course];
  if (!course || !Array.isArray(course.units)) errors.push(`$.course: unsupported course ${JSON.stringify(exam.course)}`);
  validateSources(exam.sources, ready, errors);
  if (!Number.isInteger(exam.durationSec) || exam.durationSec <= 0) errors.push("$.durationSec: expected a positive integer");
  if (typeof exam.calculator !== "boolean") errors.push("$.calculator: expected a boolean");

  const unitsById = new Map((course?.units || []).map((unit) => [unit.id, unit]));
  const questionResult = validateQuestions(exam.questions, unitsById, exam.id, path.dirname(examPath), errors);
  validateCurve(exam.curve, questionResult.total, errors);
  const rows = distributionRows(course || { units: [] }, questionResult.counts, questionResult.total);
  for (const row of rows) {
    if (!row.valid) errors.push(`$.questions: ${row.id} has ${row.count} questions; expected ${row.countMin}-${row.countMax} for ${row.mcqWeightMin}-${row.mcqWeightMax}%`);
  }
  return { errors, exam, rows };
}

function main(argv) {
  if (argv.length !== 1) {
    console.error("Usage: node scripts/validate-ap-exam.js <exam.json>");
    return 2;
  }
  const examPath = path.resolve(process.cwd(), argv[0]);
  const result = validateExam(examPath);
  if (result.rows.length) printDistribution(result.rows);
  if (result.errors.length) {
    console.error(`\nValidation failed with ${result.errors.length} error${result.errors.length === 1 ? "" : "s"}:`);
    result.errors.forEach((error) => console.error(`- ${error}`));
    return 1;
  }
  console.log(`\nValid ${result.exam.status} exam: ${result.exam.title} (${result.exam.questions.length} questions)`);
  return 0;
}

if (require.main === module) process.exitCode = main(process.argv.slice(2));

module.exports = { countRange, distributionRows, validateExam };
