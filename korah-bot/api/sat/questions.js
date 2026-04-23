export const config = {
  maxDuration: 60,
};

const UPSTREAM_BASE = "https://mysatprep.fun";

// Maps our internal domain key (name) to the upstream API domain code
const DOMAIN_CODE_MAP = {
  // English (R&W)
  "Information and Ideas": "INI",
  "Craft and Structure": "CAS",
  "Expression of Ideas": "EOI",
  "Standard English Conventions": "SEC",
  // Math
  "Algebra": "H",
  "Advanced Math": "P",
  "Problem-Solving and Data Analysis": "Q",
  "Geometry and Trigonometry": "S",
};

// All domain codes for each section (used when domain is "any")
const SECTION_DOMAIN_CODES = {
  english: ["INI", "CAS", "EOI", "SEC"],
  math: ["H", "P", "Q", "S"],
};

// Reverse lookup: domain code → human-readable name
const DOMAIN_CODE_TO_NAME = Object.fromEntries(
  Object.entries(DOMAIN_CODE_MAP).map(([name, code]) => [code, name])
);

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
  if (!sectionStr) return ["english", "math"];
  const sections = sectionStr.split(",").map((s) => s.trim()).filter((s) => s === "english" || s === "math");
  return sections.length > 0 ? sections : ["english", "math"];
}

function normalizeDomain(value) {
  const domainStr = String(value || "").trim();
  if (!domainStr || domainStr.toLowerCase() === "any") return "any";
  const domains = domainStr.split(",").map((d) => d.trim()).filter(Boolean);
  return domains.length > 0 ? domains : "any";
}

function normalizeSkill(value) {
  const skillStr = String(value || "").trim();
  if (!skillStr || skillStr.toLowerCase() === "any") return "any";
  const skills = skillStr.split(",").map((s) => s.trim()).filter(Boolean);
  return skills.length > 0 ? skills : "any";
}

// Rewrites relative image/asset src and href paths to absolute upstream URLs
function fixImageUrls(html) {
  if (typeof html !== "string") return html;
  return html
    .replace(/src="(\/[^"]*)"/g, `src="${UPSTREAM_BASE}$1"`)
    .replace(/src='(\/[^']*)'/g, `src='${UPSTREAM_BASE}$1'`)
    .replace(/href="(\/[^"]*)"/g, `href="${UPSTREAM_BASE}$1"`)
    .replace(/href='(\/[^']*)'/g, `href='${UPSTREAM_BASE}$1'`);
}

function choicesToOptions(answerOptions) {
  if (!answerOptions || typeof answerOptions !== "object") return [];
  const preferredOrder = ["A", "B", "C", "D"];
  const keys = Object.keys(answerOptions);
  const ordered = [
    ...preferredOrder.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !preferredOrder.includes(k)).sort(),
  ];
  return ordered
    .map((key) => {
      const raw = typeof answerOptions[key] === "string" ? answerOptions[key] : String(answerOptions[key] ?? "");
      return { key, text: fixImageUrls(raw) };
    })
    .filter((opt) => opt.key && opt.text);
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Combine list-metadata + detail into the normalized shape the frontend expects.
// The upstream returns:
//   stem      — the question text (may contain HTML/MathML/images)
//   stimulus  — passage or context material (English R&W questions)
//   answerOptions — { A, B, C, D } or null for SPR
//   correct_answer — array of strings
//   rationale  — explanation HTML
//   type       — "mcq" | "spr"
function buildQuestion(meta, detail, section) {
  const domainName = DOMAIN_CODE_TO_NAME[meta.primary_class_cd] || meta.primary_class_cd_desc || meta.primary_class_cd || "";

  const stimulus = typeof detail.stimulus === "string" ? detail.stimulus : "";
  const stem = typeof detail.stem === "string" ? detail.stem : "";
  const rationale = typeof detail.rationale === "string" ? detail.rationale : "";

  return {
    id: meta.questionId || meta.external_id || meta.ibn || "",
    section,
    domain: domainName,
    paragraph: fixImageUrls(stimulus),
    stem: fixImageUrls(stem),
    options: choicesToOptions(detail.answerOptions),
    correctAnswer: Array.isArray(detail.correct_answer)
      ? detail.correct_answer[0] ?? ""
      : typeof detail.correct_answer === "string" ? detail.correct_answer : "",
    explanation: fixImageUrls(rationale),
    type: detail.type || "mcq",
  };
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

  const sectionInput = req.query?.sections || req.query?.section;
  const sections = normalizeSection(sectionInput);

  if (!sections || sections.length === 0) {
    return res.status(400).json({
      error: "Invalid section",
      message: "section must be one of: english, math, or a comma-separated combination",
    });
  }

  const domains = normalizeDomain(req.query?.domains || req.query?.domain);
  const skills = normalizeSkill(req.query?.skills || req.query?.skill);
  const limit = parseLimit(req.query?.limit);

  // Per-section limit for balanced results. When no limit is set, fetch all available items.
  const perSectionLimit = limit !== null ? Math.ceil(limit / sections.length) : null;

  // ── Step 1: Fetch question metadata lists for each section ─────────────

  async function fetchListForSection(sec, dom, skl) {
    const url = new URL(`${UPSTREAM_BASE}/api/get-questions`);

    // Section is expressed through domain codes — the upstream has no "section" param
    const isAnyDomain = dom === "any" || (Array.isArray(dom) && (dom.length === 0 || dom.includes("any")));
    let domainCodes;
    if (isAnyDomain) {
      domainCodes = SECTION_DOMAIN_CODES[sec] || [];
    } else {
      const doms = Array.isArray(dom) ? dom : [dom];
      domainCodes = doms.map((d) => DOMAIN_CODE_MAP[d] || d).filter(Boolean);
      if (domainCodes.length === 0) domainCodes = SECTION_DOMAIN_CODES[sec] || [];
    }
    url.searchParams.set("domains", domainCodes.join(","));
    url.searchParams.set("assessment", "SAT");

    const isAnySkill = skl === "any" || (Array.isArray(skl) && (skl.length === 0 || skl.includes("any")));
    if (!isAnySkill) {
      url.searchParams.set("skillCds", Array.isArray(skl) ? skl.join(",") : skl);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const resp = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) return { ok: false, status: resp.status, items: [] };
      const body = await resp.json();
      const items = Array.isArray(body?.data) ? body.data : [];
      return { ok: true, items };
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // ── Step 2: Fetch individual question details ──────────────────────────

  async function fetchQuestionDetail(idParam) {
    const url = `${UPSTREAM_BASE}/api/question/${encodeURIComponent(idParam)}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const resp = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!resp.ok) return null;
      const body = await resp.json();
      return body?.success ? body.data : null;
    } catch {
      clearTimeout(timeout);
      return null;
    }
  }

  // ── Execute ────────────────────────────────────────────────────────────

  let normalizedQuestions = [];

  try {
    const listResults = await Promise.all(
      sections.map((sec) => fetchListForSection(sec, domains, skills))
    );

    for (let i = 0; i < listResults.length; i++) {
      const result = listResults[i];
      const section = sections[i];

      if (!result.ok) {
        return res.status(502).json({ error: "OpenSAT upstream error", status: result.status });
      }

      // Shuffle then optionally slice — no slice when perSectionLimit is null (fetch all)
      let items = shuffleArray(result.items);
      if (perSectionLimit !== null) {
        items = items.slice(0, perSectionLimit);
      }

      // Fetch all question details in parallel
      const detailResults = await Promise.all(
        items.map(async (meta) => {
          const idParam = meta.external_id || meta.ibn;
          if (!idParam) return null;
          const detail = await fetchQuestionDetail(idParam);
          if (!detail) return null;
          return buildQuestion(meta, detail, section);
        })
      );

      normalizedQuestions.push(...detailResults.filter(Boolean));
    }
  } catch (err) {
    console.error("OpenSAT fetch error:", err);
    return res.status(502).json({
      error: "OpenSAT unavailable",
      message: "Could not reach OpenSAT upstream.",
    });
  }

  // Apply global limit to the combined result
  if (limit !== null && normalizedQuestions.length > limit) {
    normalizedQuestions = normalizedQuestions.slice(0, limit);
  }

  return res.status(200).json({
    sections,
    domains,
    count: normalizedQuestions.length,
    questions: normalizedQuestions,
  });
}
