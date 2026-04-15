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
  const section = String(value || "").trim().toLowerCase();
  if (section === "english" || section === "math") return section;
  return null;
}

function normalizeDomain(value) {
  const domainStr = String(value || "").trim();
  if (!domainStr || domainStr.toLowerCase() === "any") return "any";
  const domains = domainStr.split(",").map((d) => d.trim()).filter(Boolean);
  return domains.length > 0 ? domains : "any";
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

  const section = normalizeSection(req.query?.section);
  if (!section) {
    return res.status(400).json({
      error: "Invalid section",
      message: "section must be one of: english, math",
    });
  }

  const domain = normalizeDomain(req.query?.domains);
  const limit = parseLimit(req.query?.limit);

  const upstream = new URL("https://pinesat.com/api/questions");
  upstream.searchParams.set("section", section);
  upstream.searchParams.set("domain", domain);
  if (limit !== null) {
    upstream.searchParams.set("limit", String(limit));
  }

  let upstreamResponse;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    upstreamResponse = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.error("OpenSAT fetch error:", err);
    return res.status(502).json({
      error: "OpenSAT unavailable",
      message: "Could not reach OpenSAT upstream.",
    });
  }

  if (!upstreamResponse.ok) {
    let details = null;
    try {
      details = await upstreamResponse.text();
    } catch (_) {}
    return res.status(502).json({
      error: "OpenSAT upstream error",
      status: upstreamResponse.status,
      details: details ? details.slice(0, 500) : undefined,
    });
  }

  let data;
  try {
    data = await upstreamResponse.json();
  } catch (err) {
    console.error("OpenSAT JSON parse error:", err);
    return res.status(502).json({
      error: "Malformed OpenSAT response",
      message: "Upstream returned invalid JSON.",
    });
  }

  const rawQuestions = Array.isArray(data?.questions) ? data.questions : Array.isArray(data) ? data : [];
  const normalized = rawQuestions.map((q) => normalizeQuestion(q, section, domain));

  return res.status(200).json({
    section,
    domain,
    count: normalized.length,
    questions: normalized,
  });
}
