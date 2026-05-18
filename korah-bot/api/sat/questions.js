import {
  ASSESSMENTS,
  ALL_DOMAIN_CODES,
  SECTION_DOMAIN_CODES,
  fetchQuestionList,
  fetchQuestionDetail,
  findCachedQuestionMeta,
  normalizeQuestion,
  resolveDomainCodes,
  shuffleArray,
} from "../_lib/collegeboard.js";

export const config = {
  maxDuration: 60,
};

const VALID_DIFFICULTIES = ["E", "M", "H"];

// How many questions to fully detail in the initial response. The rest are
// returned as stubs (loaded: false) and the frontend hydrates them on demand
// via /api/sat/question?id=… as the user navigates.
const INITIAL_BATCH = 20;

// Bound on simultaneous open detail fetches to CB during the initial batch.
const DETAIL_CONCURRENCY = 5;

async function buildQuestionMetaLookup(asmtEventId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  try {
    const items = await fetchQuestionList({
      asmtEventId,
      domainCodes: ALL_DOMAIN_CODES,
      signal: controller.signal,
    });
    const byId = new Map();
    for (const item of items) {
      if (item?.external_id) byId.set(String(item.external_id), item);
      if (item?.ibn) byId.set(String(item.ibn), item);
      if (item?.questionId) byId.set(String(item.questionId), item);
    }
    return byId;
  } finally {
    clearTimeout(timeout);
  }
}

function parseLimit(value) {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value).trim().toLowerCase();
  if (str === "none" || str === "unlimited" || str === "max") return null;
  const parsed = parseInt(str, 10);
  if (Number.isNaN(parsed)) return null;
  return Math.max(1, parsed);
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
  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    next
  );
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
  const limit = parseLimit(req.query?.limit); // null = all matching
  const assessmentKey = String(req.query?.assessment || "SAT").toUpperCase();
  const asmtEventId = ASSESSMENTS[assessmentKey] ?? ASSESSMENTS.SAT;

  // Handle explicit question IDs (review errors, saved questions, etc.)
  const questionIdsParam = req.query?.questionIds || req.query?.ids;
  if (questionIdsParam) {
    const ids = [...new Set(String(questionIdsParam).split(",").map(id => id.trim()).filter(Boolean))];
    let metaLookup = null;
    try {
      metaLookup = await buildQuestionMetaLookup(asmtEventId);
    } catch (e) {
      console.warn("Failed to preload question metadata lookup", e);
    }
    const details = await pooledMap(ids, DETAIL_CONCURRENCY, async (id) => {
      try {
        const cachedMeta = findCachedQuestionMeta(id);
        const resolvedMeta = cachedMeta || metaLookup?.get(id) || null;
        const fetchId = resolvedMeta?.external_id || resolvedMeta?.ibn || id;
        const dc = new AbortController();
        const dt = setTimeout(() => dc.abort(), 10_000);
        const detail = await fetchQuestionDetail(fetchId, dc.signal);
        clearTimeout(dt);
        if (!detail) return null;
        const meta = resolvedMeta || {
          external_id: fetchId,
          difficulty: "M",
        };
        return normalizeQuestion(meta, detail);
      } catch (e) {
        console.warn(`Failed to fetch detail for ${id}`, e);
        return null;
      }
    });
    const questions = details.filter(Boolean);
    return res.status(200).json({
      count: questions.length,
      questions,
      batchSize: INITIAL_BATCH,
    });
  }

  // Resolve target domain codes across ALL requested sections
  const targetCodes = resolveDomainCodes({ sections, domains });

  if (targetCodes.length === 0) {
    return res.status(200).json({
      sections, domains, skills, difficulties, count: 0, questions: [],
      batchSize: INITIAL_BATCH,
    });
  }

  const isAnySkill =
    skills === "any" ||
    (Array.isArray(skills) && (skills.length === 0 || skills.includes("any")));
  const skillFilter = isAnySkill ? null : new Set(skills);

  let allQuestions = [];

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

    // Partition by section and apply filters
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

    // Per-section sampling so a 2-section request stays balanced. When no
    // explicit limit is given, keep everything.
    const perSectionCap = limit
      ? Math.max(1, Math.ceil(limit / sections.length))
      : null;

    const sampledMetas = [];
    for (const sec of sections) {
      let pool = applyFilters(bySection[sec] || []);
      pool = shuffleArray(pool);
      if (perSectionCap !== null) pool = pool.slice(0, perSectionCap);
      sampledMetas.push(...pool);
    }

    // If the caller asked for a hard total limit, trim now (per-section sampling
    // may have rounded up slightly when sections divided unevenly).
    let finalMetas = sampledMetas;
    if (limit !== null && finalMetas.length > limit) {
      finalMetas = shuffleArray(finalMetas).slice(0, limit);
    }

    // Build a stub for every sampled question — these ship immediately so the
    // frontend can render navigation/progress/total counts.
    allQuestions = finalMetas.map((meta) => normalizeQuestion(meta, null));

    // Fully detail the first batch only.
    const batchSize = Math.min(INITIAL_BATCH, allQuestions.length);
    const headMetas = finalMetas.slice(0, batchSize);
    const headDetails = await pooledMap(headMetas, DETAIL_CONCURRENCY, async (meta) => {
      const id = meta?.external_id || meta?.ibn;
      if (!id) return null;
      const dc = new AbortController();
      const dt = setTimeout(() => dc.abort(), 30_000);
      try {
        return await fetchQuestionDetail(id, dc.signal);
      } finally {
        clearTimeout(dt);
      }
    });

    for (let i = 0; i < batchSize; i++) {
      const detail = headDetails[i];
      if (!detail) continue;
      allQuestions[i] = normalizeQuestion(finalMetas[i], detail);
    }
  } catch (err) {
    console.error("College Board fetch error:", err);
    const body = {
      error: "College Board unavailable",
      message: "Could not reach the College Board question bank.",
    };
    if (process.env.VERCEL_ENV !== "production") {
      body.detail = err instanceof Error ? err.message : String(err);
    }
    return res.status(502).json(body);
  }

  // CDN headers — the list response is deterministic per query string.
  res.setHeader("Cache-Control", "public, s-maxage=300");
  res.setHeader("CDN-Cache-Control", "public, s-maxage=60");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=300");
  return res.status(200).json({
    sections,
    domains,
    skills,
    difficulties,
    batchSize: INITIAL_BATCH,
    count: allQuestions.length,
    questions: allQuestions,
  });
}
