import {
  ASSESSMENTS,
  ALL_DOMAIN_CODES,
  fetchQuestionList,
} from "../_lib/collegeboard.js";

export const config = {
  maxDuration: 60,
};

// In-memory cache for cold starts; the Vercel CDN does the heavy lifting via
// the response headers below.
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache = null;

function makeBucket() {
  return { total: 0, E: 0, M: 0, H: 0 };
}

async function computeStats(assessmentKey) {
  const asmtEventId = ASSESSMENTS[assessmentKey] ?? ASSESSMENTS.SAT;

  // Per-domain and per-skill counts are nested by difficulty so the client can
  // narrow them to the user's difficulty selection without an extra API hit.
  // Top-level `domainBreakdown[code]` and `skillBreakdown[code]` remain flat
  // numeric totals for backwards compatibility with any older callers.
  const stats = {
    totalQuestions: 0,
    domainBreakdown: {},
    domainBreakdownByDifficulty: {},
    difficultyBreakdown: { E: 0, M: 0, H: 0 },
    skillBreakdown: {},
    skillBreakdownByDifficulty: {},
    assessmentInfo: { assessment: assessmentKey, asmtEventId },
  };
  for (const code of ALL_DOMAIN_CODES) {
    stats.domainBreakdown[code] = 0;
    stats.domainBreakdownByDifficulty[code] = makeBucket();
  }

  // Single combined POST for all 8 domain codes (matches MySATPrep's call shape).
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  let items = [];
  try {
    items = await fetchQuestionList({
      asmtEventId,
      domainCodes: ALL_DOMAIN_CODES,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  for (const q of items) {
    const code = q.primary_class_cd;
    const diff = q.difficulty;
    if (code && stats.domainBreakdown[code] != null) {
      stats.domainBreakdown[code]++;
      const bucket = stats.domainBreakdownByDifficulty[code];
      bucket.total++;
      if (diff && bucket[diff] != null) bucket[diff]++;
    }
    if (diff && stats.difficultyBreakdown[diff] != null) {
      stats.difficultyBreakdown[diff]++;
    }
    if (q.skill_cd) {
      stats.skillBreakdown[q.skill_cd] =
        (stats.skillBreakdown[q.skill_cd] || 0) + 1;
      if (!stats.skillBreakdownByDifficulty[q.skill_cd]) {
        stats.skillBreakdownByDifficulty[q.skill_cd] = makeBucket();
      }
      const sb = stats.skillBreakdownByDifficulty[q.skill_cd];
      sb.total++;
      if (diff && sb[diff] != null) sb[diff]++;
    }
  }
  stats.totalQuestions = items.length;

  return stats;
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

  const assessmentKey = String(req.query?.assessment || "SAT").toUpperCase();
  const cacheKey = assessmentKey;
  const now = Date.now();

  if (
    cache &&
    cache.key === cacheKey &&
    now - cache.builtAt < CACHE_TTL_MS
  ) {
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=60");
    res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=3600");
    return res.status(200).json(cache.payload);
  }

  try {
    const stats = await computeStats(assessmentKey);
    const payload = {
      success: true,
      data: {
        stats,
        totalQuestions: stats.totalQuestions,
        domainBreakdown: stats.domainBreakdown,
        domainBreakdownByDifficulty: stats.domainBreakdownByDifficulty,
        difficultyBreakdown: stats.difficultyBreakdown,
        skillBreakdown: stats.skillBreakdown,
        skillBreakdownByDifficulty: stats.skillBreakdownByDifficulty,
        assessmentInfo: stats.assessmentInfo,
      },
      message: "Question bank stats fetched successfully",
    };
    cache = { key: cacheKey, builtAt: now, payload };
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=60");
    res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=3600");
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Stats fetch error:", err);
    const body = {
      success: false,
      error: "Failed to fetch question bank stats",
    };
    if (process.env.VERCEL_ENV !== "production") {
      body.details = err instanceof Error ? err.message : String(err);
    }
    return res.status(502).json(body);
  }
}
