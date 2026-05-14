import { fetchQuestionDetail } from "../_lib/collegeboard.js";

export const config = {
  maxDuration: 30,
};

// On-demand detail fetch for a single question. Used by the frontend's lazy
// loader as the user navigates into questions that weren't part of the initial
// "first batch" returned by /api/sat/questions.
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = String(req.query?.id || "").trim();
  if (!id) {
    return res.status(400).json({ error: "Missing id parameter" });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let detail;
    try {
      detail = await fetchQuestionDetail(id, controller.signal);
    } finally {
      clearTimeout(timeout);
    }

    if (!detail) {
      return res.status(404).json({ error: "Question not found", id });
    }

    res.setHeader("Cache-Control", "public, s-maxage=86400");
    res.setHeader("CDN-Cache-Control", "public, s-maxage=3600");
    res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=86400");
    return res.status(200).json({
      id,
      type: detail.type || "mcq",
      paragraph: typeof detail.stimulus === "string" ? detail.stimulus : "",
      stem: typeof detail.stem === "string" ? detail.stem : "",
      options: detail.answerOptions
        ? ["A", "B", "C", "D"]
            .filter((k) => detail.answerOptions[k] != null && detail.answerOptions[k] !== "")
            .map((k) => ({ key: k, text: detail.answerOptions[k] }))
        : [],
      correctAnswer: Array.isArray(detail.correct_answer)
        ? detail.correct_answer[0] ?? ""
        : typeof detail.correct_answer === "string"
          ? detail.correct_answer
          : "",
      explanation: typeof detail.rationale === "string" ? detail.rationale : "",
    });
  } catch (err) {
    console.error("question detail error:", err);
    return res.status(502).json({
      error: "College Board unavailable",
      detail: err instanceof Error ? err.message : String(err),
    });
  }
}
