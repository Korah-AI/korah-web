export const config = {
  maxDuration: 60,
};

// Maps our internal domain key (name) to the upstream API domain code
const DOMAIN_CODE_MAP = {
  // English
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

function parseLimit(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const str = String(value).trim().toLowerCase();
  if (str === "none" || str === "unlimited" || str === "max") {
    return null;
  }
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

function choicesToOptions(choices) {
  if (!choices || typeof choices !== "object") return [];
  const preferredOrder = ["A", "B", "C", "D"];
  const keys = Object.keys(choices);
  const ordered = [
    ...preferredOrder.filter((k) => keys.includes(k)),
    ...keys.filter((k) => !preferredOrder.includes(k)).sort(),
  ];
  return ordered
    .map((key) => ({
      key,
      text: typeof choices[key] === "string" ? choices[key] : String(choices[key] ?? ""),
    }))
    .filter((opt) => opt.key && opt.text);
}

function normalizeQuestion(item, sectionFromRequest, domainsFromRequest) {
  const nested = item?.question || {};
  const id = typeof item?.id === "string" ? item.id : String(item?.id ?? "");
  const domainFromPayload = typeof item?.domain === "string" ? item.domain : "";
  let domain;
  if (Array.isArray(domainsFromRequest)) {
    domain = domainFromPayload || (domainsFromRequest.includes("any") ? "any" : domainsFromRequest[0]);
  } else {
    domain = domainFromPayload || (domainsFromRequest === "any" ? "any" : domainsFromRequest);
  }

  const rawParagraph = nested?.paragraph;
  const paragraph = (typeof rawParagraph === "string" && rawParagraph !== "null" && rawParagraph.trim() !== "") ? rawParagraph : "";

  return {
    id,
    section: sectionFromRequest,
    domain,
    paragraph,
    stem: typeof nested?.question === "string" ? nested.question : "",
    options: choicesToOptions(nested?.choices),
    correctAnswer: typeof nested?.correct_answer === "string" ? nested.correct_answer : String(nested?.correct_answer ?? ""),
    explanation: typeof nested?.explanation === "string" ? nested.explanation : "",
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Support both 'section' and 'sections' query parameters
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

  // Calculate limit per section to fetch a balanced set if multiple sections are requested
  const questionLimitPerSection = limit !== null ? Math.ceil(limit / sections.length) : null;

  async function fetchQuestionsForSection(sec, dom, skl) {
    const upstream = new URL("https://pinesat.com/api/questions");

    // Upstream API has no "section" param — section is expressed via domain codes.
    // If a specific domain (or list) was requested, map names → codes; otherwise
    // fall back to all domain codes for this section so we never leak cross-section results.
    const isAnyDomain = dom === "any" || (Array.isArray(dom) && (dom.length === 0 || dom.includes("any")));
    let domainCodes;
    if (isAnyDomain) {
      domainCodes = SECTION_DOMAIN_CODES[sec] || [];
    } else {
      const doms = Array.isArray(dom) ? dom : [dom];
      domainCodes = doms.map((d) => DOMAIN_CODE_MAP[d] || d).filter(Boolean);
      // Ensure codes actually belong to the requested section; fall back to full section if none matched
      if (domainCodes.length === 0) {
        domainCodes = SECTION_DOMAIN_CODES[sec] || [];
      }
    }
    if (domainCodes.length > 0) {
      upstream.searchParams.set("domains", domainCodes.join(","));
    }

    // Upstream uses "skillCds" not "skill"
    const isAnySkill = skl === "any" || (Array.isArray(skl) && (skl.length === 0 || skl.includes("any")));
    if (!isAnySkill) {
      upstream.searchParams.set("skillCds", Array.isArray(skl) ? skl.join(",") : skl);
    }
    // Use the per-section limit if available
    const effectiveLimit = questionLimitPerSection || limit;
    if (effectiveLimit !== null) {
      upstream.searchParams.set("limit", String(effectiveLimit));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    const response = await fetch(upstream.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return response;
  }

  let normalizedQuestions = [];

  try {
    const requests = sections.map((sec) => fetchQuestionsForSection(sec, domains, skills));
    const responses = await Promise.all(requests);

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const section = sections[i];

      if (!resp.ok) {
        return res.status(502).json({
          error: "OpenSAT upstream error",
          status: resp.status,
        });
      }
      const data = await resp.json();
      const rawQuestions = Array.isArray(data?.questions) ? data.questions : Array.isArray(data) ? data : [];
      
      // Normalize each question with its actual section identity
      const mapped = rawQuestions.map((q) => normalizeQuestion(q, section, domains));
      normalizedQuestions.push(...mapped);
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
