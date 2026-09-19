#!/usr/bin/env node
/**
 * sync-scorecard.js — build api/college/data/colleges.js from the U.S.
 * Department of Education College Scorecard (spec §8, Phase 2).
 *
 * Run it by hand when a new Scorecard release lands; the route serves the
 * committed module, so nothing fetches anything at request time. It is written
 * as a .js module rather than .json so Vercel traces it into the function
 * bundle without relying on JSON import attributes.
 *
 * Two sources, same output:
 *
 *   # Bulk file — no key, no rate limit.
 *   curl -LO https://ed-public-download.scorecard.network/downloads/Most-Recent-Cohorts-Institution_<date>.zip
 *   unzip Most-Recent-Cohorts-Institution_<date>.zip
 *   node scripts/sync-scorecard.js --csv Most-Recent-Cohorts-Institution.csv
 *
 *   # API — needs a key from https://api.data.gov/signup/
 *   node scripts/sync-scorecard.js --key <key>
 *
 * The two were checked against each other: the bulk file and the API's 2024
 * fields return identical values for the same institutions. The API's anonymous
 * DEMO_KEY caps at roughly 30 requests an hour and 50 a day, which is not
 * enough for a full pull, so the bulk file is the path that works without
 * signing up.
 *
 * Selection: operating, bachelor's-predominant schools with a published admit
 * rate and at least 500 undergrads. Schools that report SAT percentiles get a
 * `sat` block; the rest get `sat: null` and land in the page's "not enough
 * data" section, which is the honest state for schools that stopped publishing
 * scores after test-optional admissions took hold.
 */

import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const API = "https://api.data.gov/ed/collegescorecard/v1/schools";
const PER_PAGE = 100;
const MIN_SIZE = 500;        // below this the admit rate is too noisy to show
const MAX_PAGES = 40;        // hard stop so a bad filter can't page forever
const MAX_ATTEMPTS = 6;      // per page, waiting out the DEMO_KEY quota between tries

// Same two rules as CollegeMatch.schoolTips in sat/college-match/js/college-match.js.
// School tips are stored on the record, not computed in the browser (spec §6).
const MATH_HEAVY_MARGIN = 20;
const TIGHT_CLUSTER_SPAN = 40;

function arg(name, fallback) {
  const i = process.argv.indexOf("--" + name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const YEAR = Number(arg("year", 2024));
const KEY = arg("key", process.env.SCORECARD_API_KEY || "DEMO_KEY");
const CSV = arg("csv", null);
const OUT = path.resolve(HERE, "..", arg("out", "api/college/data/colleges.js"));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const num = (v) => {
  const n = typeof v === "string" ? (v.trim() === "" ? NaN : Number(v)) : v;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
};

// ── Source A: the bulk institution CSV ──────────────────────────────────────

// Minimal quoted-CSV line splitter. The columns this script reads carry no
// embedded newlines in the published file, so a line at a time is enough;
// commas inside quoted institution names are the only thing to handle.
function splitCsvLine(line) {
  const out = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(field); field = ""; }
    else field += ch;
  }
  out.push(field);
  return out;
}

const CSV_COLUMNS = {
  unitid: "UNITID", name: "INSTNM", city: "CITY", state: "STABBR",
  ownership: "CONTROL", size: "UGDS", admitRate: "ADM_RATE", satAvg: "SAT_AVG",
  m25: "SATMT25", m50: "SATMTMID", m75: "SATMT75",
  e25: "SATVR25", e50: "SATVRMID", e75: "SATVR75",
  preddeg: "PREDDEG", operating: "CURROPER",
};

async function loadFromCsv(file) {
  console.log(`  reading ${file}`);
  const rl = readline.createInterface({
    input: createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let index = null;
  const rows = [];
  for await (const line of rl) {
    if (!line) continue;
    const cells = splitCsvLine(line);
    if (!index) {
      const header = cells.map((h) => h.replace(/^﻿/, ""));
      index = {};
      for (const [key, column] of Object.entries(CSV_COLUMNS)) {
        const at = header.indexOf(column);
        if (at === -1) throw new Error(`column ${column} missing from ${file}`);
        index[key] = at;
      }
      continue;
    }
    const get = (key) => cells[index[key]];
    if (get("operating") !== "1" || get("preddeg") !== "3") continue;
    rows.push({
      unitid: get("unitid"),
      name: get("name"),
      city: get("city"),
      state: get("state"),
      // CONTROL: 1 public, 2 private nonprofit, 3 private for-profit.
      ownership: num(get("ownership")),
      size: num(get("size")),
      admitRate: num(get("admitRate")),
      satAvg: num(get("satAvg")),
      m25: num(get("m25")), m50: num(get("m50")), m75: num(get("m75")),
      e25: num(get("e25")), e50: num(get("e50")), e75: num(get("e75")),
    });
  }
  return rows;
}

// ── Source B: the paged API ─────────────────────────────────────────────────

const API_FIELDS = [
  "id", "school.name", "school.city", "school.state", "school.ownership",
  `${YEAR}.student.size`,
  `${YEAR}.admissions.admission_rate.overall`,
  `${YEAR}.admissions.sat_scores.average.overall`,
  `${YEAR}.admissions.sat_scores.25th_percentile.math`,
  `${YEAR}.admissions.sat_scores.midpoint.math`,
  `${YEAR}.admissions.sat_scores.75th_percentile.math`,
  `${YEAR}.admissions.sat_scores.25th_percentile.critical_reading`,
  `${YEAR}.admissions.sat_scores.midpoint.critical_reading`,
  `${YEAR}.admissions.sat_scores.75th_percentile.critical_reading`,
];

function pageUrl(page) {
  const q = new URLSearchParams({
    api_key: KEY,
    fields: API_FIELDS.join(","),
    per_page: String(PER_PAGE),
    page: String(page),
    sort: `${YEAR}.admissions.admission_rate.overall:asc`,
    "school.operating": "1",
    "school.degrees_awarded.predominant": "3",
    [`${YEAR}.admissions.admission_rate.overall__range`]: "0..1",
    [`${YEAR}.student.size__range`]: `${MIN_SIZE}..`,
  });
  return `${API}?${q}`;
}

// The quota refills on the hour, so when it runs out mid-pull the cheapest wait
// is to the next hour boundary. Keep the page and retry rather than lose the run.
function msToNextHour() {
  const now = new Date();
  return (60 - now.getMinutes()) * 60_000 - now.getSeconds() * 1000 + 30_000;
}

async function getPage(page) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const res = await fetch(pageUrl(page));
    const json = await res.json().catch(() => null);
    if (res.ok && json && json.results) return json;

    if (json?.error?.code !== "OVER_RATE_LIMIT") {
      throw new Error(`page ${page}: HTTP ${res.status} ${JSON.stringify(json)?.slice(0, 200)}`);
    }
    const wait = msToNextHour();
    console.log(
      `  rate limited on page ${page}, waiting ${Math.round(wait / 60000)}m for the quota ` +
        `(attempt ${attempt}/${MAX_ATTEMPTS}). A key from https://api.data.gov/signup/ avoids this.`
    );
    await sleep(wait);
  }
  throw new Error(`page ${page}: still rate limited after ${MAX_ATTEMPTS} attempts`);
}

async function loadFromApi() {
  console.log(`  key: ${KEY === "DEMO_KEY" ? "DEMO_KEY (rate limited)" : "custom"}`);
  const first = await getPage(0);
  const pages = Math.min(Math.ceil(first.metadata.total / PER_PAGE), MAX_PAGES);
  console.log(`  ${first.metadata.total} schools match, ${pages} pages`);

  const results = [...first.results];
  for (let p = 1; p < pages; p++) {
    const json = await getPage(p);
    results.push(...json.results);
    console.log(`  page ${p + 1}/${pages} (${results.length} rows)`);
    await sleep(250);
  }

  return results.map((r) => ({
    unitid: String(r.id),
    name: r["school.name"],
    city: r["school.city"],
    state: r["school.state"],
    ownership: num(r["school.ownership"]),
    size: num(r[`${YEAR}.student.size`]),
    admitRate: num(r[`${YEAR}.admissions.admission_rate.overall`]),
    satAvg: num(r[`${YEAR}.admissions.sat_scores.average.overall`]),
    m25: num(r[`${YEAR}.admissions.sat_scores.25th_percentile.math`]),
    m50: num(r[`${YEAR}.admissions.sat_scores.midpoint.math`]),
    m75: num(r[`${YEAR}.admissions.sat_scores.75th_percentile.math`]),
    e25: num(r[`${YEAR}.admissions.sat_scores.25th_percentile.critical_reading`]),
    e50: num(r[`${YEAR}.admissions.sat_scores.midpoint.critical_reading`]),
    e75: num(r[`${YEAR}.admissions.sat_scores.75th_percentile.critical_reading`]),
  }));
}

// ── Shared shaping ──────────────────────────────────────────────────────────

// The 25th and 75th are the band; they are the only two values a school has to
// report for the card to mean anything.
//
// The midpoint is treated as softer. Scorecard's SATMTMID / SATVRMID is its own
// reported statistic rather than something derived from the quartiles, so it is
// sometimes absent (167 schools here report quartiles with no midpoint) and
// sometimes lands a few points outside them — Wesleyan reports math 710/705/780,
// a midpoint 5 below its own 25th. Dropping those schools loses real colleges
// over a rounding artifact, so fill a missing midpoint from the quartiles and
// clamp a stray one back inside them.
function section(p25, mid, p75) {
  if (p25 === null || p75 === null || p25 > p75) return null;
  const p50 = mid === null ? Math.round((p25 + p75) / 2) : Math.min(Math.max(mid, p25), p75);
  return { p25, p50, p75 };
}

function satBlock(r) {
  const math = section(r.m25, r.m50, r.m75);
  const erw = section(r.e25, r.e50, r.e75);
  if (!math || !erw) return null;

  return {
    avg: r.satAvg ?? math.p50 + erw.p50,
    // Combined percentiles are the summed sections, derived once here so the
    // browser never computes them (spec §2).
    combined: {
      p25: math.p25 + erw.p25,
      p50: math.p50 + erw.p50,
      p75: math.p75 + erw.p75,
    },
    math,
    erw,
  };
}

function schoolTips(name, sat) {
  const tips = [];
  if (!sat) return tips;
  if (sat.math.p50 - sat.erw.p50 >= MATH_HEAVY_MARGIN) {
    tips.push({
      kind: "math-heavy",
      text: `${name}'s admitted students skew math heavy. Their math 50th is ${sat.math.p50} against ${sat.erw.p50} for reading and writing.`,
    });
  }
  if (sat.combined.p75 - sat.combined.p25 <= TIGHT_CLUSTER_SPAN) {
    tips.push({
      kind: "tight-cluster",
      text: `Scores cluster tightly at ${name}, so there's not much room below the median.`,
    });
  }
  return tips;
}

function slug(name) {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function toRecord(r, seen) {
  if (!r.name) return null;
  if (r.size === null || r.size < MIN_SIZE) return null;
  if (r.admitRate === null || r.admitRate <= 0 || r.admitRate > 1) return null;

  // Slugs are the x-for key on the page, so they have to be unique. The IPEDS
  // unit id breaks the handful of ties (campuses sharing a name).
  let id = slug(r.name);
  if (seen.has(id)) id = `${id}-${r.unitid}`;
  seen.add(id);

  const sat = satBlock(r);
  return {
    id,
    name: r.name,
    city: r.city || "",
    state: r.state || "",
    public: r.ownership === 1,
    size: Math.round(r.size),
    admitRate: r.admitRate,
    sat,
    tips: schoolTips(r.name, sat),
  };
}

async function main() {
  console.log(`Scorecard sync: year ${YEAR}, source ${CSV ? "bulk CSV" : "API"}`);

  const raw = CSV ? await loadFromCsv(CSV) : await loadFromApi();

  const seen = new Set();
  const schools = raw.map((r) => toRecord(r, seen)).filter(Boolean);

  // Most selective first, so the columns read top-down as a real shortlist and
  // reruns are byte-identical.
  schools.sort((a, b) => a.admitRate - b.admitRate || a.name.localeCompare(b.name));

  const withSat = schools.filter((s) => s.sat).length;
  const payload = {
    dataYear: YEAR,
    source: "U.S. Department of Education College Scorecard",
    fetchedAt: new Date().toISOString().slice(0, 10),
    schools,
  };

  const banner =
    "// Generated by scripts/sync-scorecard.js from the U.S. Department of Education\n" +
    "// College Scorecard. Do not edit by hand; rerun the script instead.\n";

  await fs.mkdir(path.dirname(OUT), { recursive: true });
  await fs.writeFile(OUT, banner + "export default " + JSON.stringify(payload) + ";\n");
  console.log(
    `  wrote ${schools.length} schools (${withSat} with SAT percentiles, ` +
      `${schools.length - withSat} without) to ${path.relative(process.cwd(), OUT)}`
  );
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
