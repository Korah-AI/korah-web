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

async function computeStats(assessmentKey) {
  const asmtEventId = ASSESSMENTS[assessmentKey] ?? ASSESSMENTS.SAT;

  const stats = {
    totalQuestions: 0,
    domainBreakdown: {},
    difficultyBreakdown: { E: 0, M: 0, H: 0 },
    skillBreakdown: {},
    assessmentInfo: { assessment: assessmentKey, asmtEventId },
  };
  for (const code of ALL_DOMAIN_CODES) stats.domainBreakdown[code] = 0;

  // Single combined POST for all 8 domain codes (matches MySATPrep's call shape).
  // We then group counts client-side by primary_class_cd / skill_cd / difficulty.
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
    if (code && stats.domainBreakdown[code] != null) {
      stats.domainBreakdown[code]++;
    }
    if (q.difficulty && stats.difficultyBreakdown[q.difficulty] != null) {
      stats.difficultyBreakdown[q.difficulty]++;
    }
    if (q.skill_cd) {
      stats.skillBreakdown[q.skill_cd] =
        (stats.skillBreakdown[q.skill_cd] || 0) + 1;
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
        difficultyBreakdown: stats.difficultyBreakdown,
        skillBreakdown: stats.skillBreakdown,
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
