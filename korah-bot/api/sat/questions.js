import {
  ASSESSMENTS,
  SECTION_DOMAIN_CODES,
  fetchQuestionList,
  fetchQuestionDetail,
  normalizeQuestion,
  resolveDomainCodes,
  shuffleArray,
} from "../_lib/collegeboard.js";

export const config = {
  maxDuration: 60,
};

const VALID_DIFFICULTIES = ["E", "M", "H"];

// Cap on details fetched per request — protects the function from runaway
// concurrent fetches when a caller forgets to send `limit`.
const DEFAULT_LIMIT = 20;
const HARD_MAX_LIMIT = 50;

// Cap on simultaneous open detail fetches to CB. MySATPrep effectively gets
// this for free via Next's data cache; here we pool manually.
const DETAIL_CONCURRENCY = 5;

function parseLimit(value) {
  if (value === undefined || value === null || value === "") return DEFAULT_LIMIT;
  const str = String(value).trim().toLowerCase();
  if (str === "none" || str === "unlimited" || str === "max") return HARD_MAX_LIMIT;
  const parsed = parseInt(str, 10);
  if (Number.isNaN(parsed)) return DEFAULT_LIMIT;
  return Math.min(HARD_MAX_LIMIT, Math.max(1, parsed));
}

function normalizeSection(value) {
  const sectionStr = String(value || "").trim().toLowerCase();
  if (!sectionStr || sectionStr === "any") return ["english", "math"];
  const sections = sectionStr
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s === "english" || s === "math");
  return sections.length > 0 ? sections : ["english", "math"];
}

function normalizeListParam(value) {
  const str = String(value || "").trim();
  if (!str || str.toLowerCase() === "any") return "any";
  const items = str.split(",").map((s) => s.trim()).filter(Boolean);
  return items.length > 0 ? items : "any";
}

function normalizeDifficulties(value) {
  const str = String(value || "").trim().toUpperCase();
  if (!str || str === "ANY") return null;
  const items = str
    .split(",")
    .map((s) => s.trim())
    .filter((s) => VALID_DIFFICULTIES.includes(s));
  return items.length > 0 ? items : null;
}

// Run `worker(item)` over `items` with at most `concurrency` in flight at once.
async function pooledMap(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, next);
  await Promise.all(runners);
  return results;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sections = normalizeSection(req.query?.sections || req.query?.section);
  const domains = normalizeListParam(req.query?.domains || req.query?.domain);
  const skills = normalizeListParam(req.query?.skills || req.query?.skill);
  const difficulties = normalizeDifficulties(
    req.query?.difficulties || req.query?.difficulty
  );
  const limit = parseLimit(req.query?.limit);
  const assessmentKey = String(req.query?.assessment || "SAT").toUpperCase();
  const asmtEventId = ASSESSMENTS[assessmentKey] ?? ASSESSMENTS.SAT;

  // Resolve target domain codes across ALL requested sections, then issue ONE
  // combined POST against CB (this mirrors MySATPrep's actual request shape
  // and is the same call that already works for /api/sat/stats).
  const allCodes = new Set();
  for (const sec of sections) {
    const codes = resolveDomainCodes({ sections: [sec], domains });
    for (const c of codes) {
      if ((SECTION_DOMAIN_CODES[sec] || []).includes(c)) allCodes.add(c);
    }
  }
  const targetCodes = [...allCodes];
  if (targetCodes.length === 0) {
    return res.status(200).json({
      sections, domains, skills, difficulties, count: 0, questions: [],
    });
  }

  const isAnySkill =
    skills === "any" ||
    (Array.isArray(skills) && (skills.length === 0 || skills.includes("any")));
  const skillFilter = isAnySkill ? null : new Set(skills);

  let combined = [];

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let listItems;
    try {
      listItems = await fetchQuestionList({
        asmtEventId,
        domainCodes: targetCodes,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    // Partition items by section and apply filters before sampling.
    const bySection = { english: [], math: [] };
    for (const meta of listItems) {
      const code = meta?.primary_class_cd;
      if (SECTION_DOMAIN_CODES.english.includes(code)) bySection.english.push(meta);
      else if (SECTION_DOMAIN_CODES.math.includes(code)) bySection.math.push(meta);
    }

    function applyFilters(arr) {
      let out = arr;
      if (skillFilter) out = out.filter((q) => skillFilter.has(q.skill_cd));
      if (difficulties) out = out.filter((q) => difficulties.includes(q.difficulty));
      return out;
    }

    // Per-section sampling so a 2-section request stays balanced.
    const perSectionLimit = Math.max(1, Math.ceil(limit / sections.length));
    const sampledMetas = [];
    for (const sec of sections) {
      let pool = applyFilters(bySection[sec] || []);
      pool = shuffleArray(pool);
      sampledMetas.push(...pool.slice(0, perSectionLimit));
    }

    // Fetch details with bounded concurrency to avoid CB throttling.
    const detailed = await pooledMap(sampledMetas, DETAIL_CONCURRENCY, async (meta) => {
      const id = meta?.external_id || meta?.ibn;
      if (!id) return null;
      const dc = new AbortController();
      const dt = setTimeout(() => dc.abort(), 30_000);
      try {
        const detail = await fetchQuestionDetail(id, dc.signal);
        if (!detail) return null;
        return normalizeQuestion(meta, detail);
      } finally {
        clearTimeout(dt);
      }
    });

    combined = detailed.filter(Boolean);
  } catch (err) {
    console.error("College Board fetch error:", err);
    return res.status(502).json({
      error: "College Board unavailable",
      message: "Could not reach the College Board question bank.",
      detail: err instanceof Error ? err.message : String(err),
    });
  }

  if (combined.length > limit) combined = combined.slice(0, limit);

  res.setHeader("Cache-Control", "public, s-maxage=300");
  res.setHeader("CDN-Cache-Control", "public, s-maxage=60");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=300");
  return res.status(200).json({
    sections,
    domains,
    skills,
    difficulties,
    count: combined.length,
    questions: combined,
  });
}
