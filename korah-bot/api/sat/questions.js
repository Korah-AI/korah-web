export const config = {
  maxDuration: 60,
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

  const sections = normalizeSection(req.query?.section);
  if (!sections || sections.length === 0) {
    return res.status(400).json({
      error: "Invalid section",
      message: "section must be one of: english, math, or a comma-separated combination",
    });
  }

  const domains = normalizeDomain(req.query?.domains);
  const skills = normalizeSkill(req.query?.skills);
  const limit = parseLimit(req.query?.limit);

  async function fetchQuestionsForSection(sec, dom, skl) {
    const upstream = new URL("https://pinesat.com/api/questions");
    upstream.searchParams.set("section", sec);
    if (dom !== "any") {
      upstream.searchParams.set("domain", Array.isArray(dom) ? dom.join(",") : dom);
    }
    if (skl !== "any") {
      upstream.searchParams.set("skill", Array.isArray(skl) ? skl.join(",") : skl);
    }
    if (limit !== null) {
      upstream.searchParams.set("limit", String(limit));
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

  let allData = { questions: [] };
  const questionLimitPerSection = limit !== null ? Math.ceil(limit / sections.length) : null;

  try {
    const requests = sections.map((sec) => fetchQuestionsForSection(sec, domains, skills));
    const responses = await Promise.all(requests);

    for (const resp of responses) {
      if (!resp.ok) {
        return res.status(502).json({
          error: "OpenSAT upstream error",
          status: resp.status,
        });
      }
      const data = await resp.json();
      const rawQuestions = Array.isArray(data?.questions) ? data.questions : Array.isArray(data) ? data : [];
      allData.questions.push(...rawQuestions);
    }
  } catch (err) {
    console.error("OpenSAT fetch error:", err);
    return res.status(502).json({
      error: "OpenSAT unavailable",
      message: "Could not reach OpenSAT upstream.",
    });
  }

  if (limit !== null && allData.questions.length > limit) {
    allData.questions = allData.questions.slice(0, limit);
  }

  const normalized = allData.questions.map((q) => normalizeQuestion(q, sections[0], domains));

  return res.status(200).json({
    sections,
    domains,
    count: normalized.length,
    questions: normalized,
  });
}
