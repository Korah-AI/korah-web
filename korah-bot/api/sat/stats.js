import {
  ASSESSMENTS,
  ALL_DOMAIN_CODES,
  fetchQuestionList,
} from "../_lib/collegeboard.js";

export const config = {
  maxDuration: 60,
};

// In-memory cache so concurrent requests (and repeated visits) don't hammer the
// CB upstream. Stats refresh every 6 hours.
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

  // Fetch each domain individually so we can attribute counts per-domain (matches
  // MySATPrep's stats route behavior).
  const lists = await Promise.all(
    ALL_DOMAIN_CODES.map(async (code) => {
      try {
        const items = await fetchQuestionList({
          asmtEventId,
          domainCodes: [code],
        });
        return { code, items };
      } catch (err) {
        console.error(`Stats: domain ${code} failed`, err);
        return { code, items: [] };
      }
    })
  );

  for (const { code, items } of lists) {
    stats.domainBreakdown[code] = items.length;
    stats.totalQuestions += items.length;
    for (const q of items) {
      if (q.difficulty && stats.difficultyBreakdown[q.difficulty] != null) {
        stats.difficultyBreakdown[q.difficulty]++;
      }
      if (q.skill_cd) {
        stats.skillBreakdown[q.skill_cd] =
          (stats.skillBreakdown[q.skill_cd] || 0) + 1;
      }
    }
  }

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
    return res.status(200).json(payload);
  } catch (err) {
    console.error("Stats fetch error:", err);
    return res.status(502).json({
      success: false,
      error: "Failed to fetch question bank stats",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
