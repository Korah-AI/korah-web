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

  // Per-section limit for balanced results across English/Math when both selected.
  const perSectionLimit =
    limit !== null ? Math.ceil(limit / sections.length) : null;

  const isAnySkill =
    skills === "any" ||
    (Array.isArray(skills) && (skills.length === 0 || skills.includes("any")));
  const skillFilter = isAnySkill ? null : new Set(skills);

  let combined = [];

  try {
    const perSectionLists = await Promise.all(
      sections.map(async (sec) => {
        const codes = resolveDomainCodes({ sections: [sec], domains });
        // Restrict to codes that belong to this section so per-section limits stay balanced.
        const sectionCodes = codes.filter((c) =>
          (SECTION_DOMAIN_CODES[sec] || []).includes(c)
        );
        if (sectionCodes.length === 0) return [];

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);
        try {
          const list = await fetchQuestionList({
            asmtEventId,
            domainCodes: sectionCodes,
            signal: controller.signal,
          });
          return list;
        } finally {
          clearTimeout(timeout);
        }
      })
    );

    for (let i = 0; i < perSectionLists.length; i++) {
      let items = perSectionLists[i] || [];

      if (skillFilter) {
        items = items.filter((q) => skillFilter.has(q.skill_cd));
      }
      if (difficulties) {
        items = items.filter((q) => difficulties.includes(q.difficulty));
      }

      items = shuffleArray(items);
      if (perSectionLimit !== null) items = items.slice(0, perSectionLimit);

      // Fetch details in parallel for the selected metas.
      const detailed = await Promise.all(
        items.map(async (meta) => {
          const id = meta.external_id || meta.ibn;
          if (!id) return null;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10_000);
          try {
            const detail = await fetchQuestionDetail(id, controller.signal);
            if (!detail) return null;
            return normalizeQuestion(meta, detail);
          } finally {
            clearTimeout(timeout);
          }
        })
      );

      combined.push(...detailed.filter(Boolean));
    }
  } catch (err) {
    console.error("College Board fetch error:", err);
    return res.status(502).json({
      error: "College Board unavailable",
      message: "Could not reach the College Board question bank.",
    });
  }

  if (limit !== null && combined.length > limit) {
    combined = combined.slice(0, limit);
  }

  return res.status(200).json({
    sections,
    domains,
    skills,
    difficulties,
    count: combined.length,
    questions: combined,
  });
}
