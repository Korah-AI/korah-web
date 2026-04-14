export const config = {
  maxDuration: 60,
};

function clampInt(value, fallback, min, max) {
  const parsed = parseInt(String(value ?? ""), 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeSection(value) {
  const section = String(value || "").trim().toLowerCase();
  if (section === "english" || section === "math") return section;
  return null;
}

function normalizeDomain(value) {
  const domain = String(value || "").trim();
  if (!domain) return "any";
  if (domain.toLowerCase() === "any") return "any";
  return domain;
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

function normalizeQuestion(item, sectionFromRequest, domainFromRequest) {
  const id = typeof item?.id === "string" ? item.id : String(item?.id ?? "");
  const domainFromPayload = typeof item?.domain === "string" ? item.domain : "";
  const domain = domainFromPayload || (domainFromRequest === "any" ? "any" : domainFromRequest);
  return {
    id,
    section: sectionFromRequest,
    domain,
    paragraph: typeof item?.paragraph === "string" ? item.paragraph : "",
    stem: typeof item?.question === "string" ? item.question : String(item?.question ?? ""),
    options: choicesToOptions(item?.choices),
    correctAnswer: typeof item?.correct_answer === "string" ? item.correct_answer : String(item?.correct_answer ?? ""),
    explanation: typeof item?.explanation === "string" ? item.explanation : String(item?.explanation ?? ""),
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

  const domain = normalizeDomain(req.query?.domain);
  const limit = clampInt(req.query?.limit, 10, 1, 60);

  const upstream = new URL("https://pinesat.com/api/questions");
  upstream.searchParams.set("section", section);
  upstream.searchParams.set("domain", domain);
  upstream.searchParams.set("limit", String(limit));

  let upstreamResponse;
  try {
    upstreamResponse = await fetch(upstream.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
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
