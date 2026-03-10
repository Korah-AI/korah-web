/**
 * Vercel serverless API: generate study item content using OpenAI.
 * POST body: { type, prompt, title?, subject? }
 * Returns: { content } where content matches study item content shape (cards | sections | questions).
 *
 * Requires OPENAI_API_KEY in Vercel env (or uses proxy from same host if configured).
 */

const OPENAI_URL = "https://korah-beta.vercel.app/api/proxy";
const MODEL = "gpt-4o-mini";

function clampInt(value, fallback, min, max) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function getTestConfig(config) {
  const total = clampInt(config?.totalQuestions, 10, 1, 50);
  const mcq = clampInt(config?.mcqCount, Math.round(total * 0.6), 0, total);
  let open = clampInt(config?.openEndedCount, total - mcq, 0, total - mcq);
  if (mcq + open !== total) open = total - mcq;
  return { totalQuestions: total, mcqCount: mcq, openEndedCount: open };
}

function getSystemPrompt(type, testConfig) {
  const cfg = getTestConfig(testConfig);
  const prompts = {
    flashcards: `You are a study assistant. Generate comprehensive flashcard content. Respond with ONLY a single valid JSON object, no markdown or explanation:
{ "cards": [ { "front": "question or term", "back": "answer or definition" }, ... ] }
Create 15-20 cards based on the user's prompt. Use clear, concise language. Include key terms, concepts, and important details.`,

    studyGuide: `You are a study assistant. Generate a lengthy, comprehensive study guide. 
Use Markdown for structure (headings, bullet points, bold text). 
Use LaTeX for any mathematical formulas (inline $...$ and display $$...$$).
The guide should be detailed, covering all aspects of the topic provided.
Respond with ONLY a single valid JSON object:
{ "markdown": "Full markdown content here..." }`,

    practiceTest: `You are a study assistant. Generate a comprehensive practice test. Respond with ONLY a single valid JSON object, no markdown or explanation:
{ "questions": [ { "type": "mcq" | "openEnded", "text": "Question text", "options": ["A", "B", "C", "D"], "answer": "Correct answer", "explanation": "Brief rationale" } ] }
Generate exactly ${cfg.totalQuestions} questions with exactly ${cfg.mcqCount} mcq and exactly ${cfg.openEndedCount} openEnded questions.
For openEnded questions, options must be an empty array.
For mcq questions, include exactly 4 options and make one correct.`,
  };
  return prompts[type] || prompts.flashcards;
}

function stripCodeFences(text) {
  let trimmed = (text || "").trim();
  if (!trimmed) return "";
  if (trimmed.includes("```")) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return trimmed.trim();
}

function parseJsonFromResponse(text) {
  const trimmed = stripCodeFences(text);
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_) {}
  const jsonStart = trimmed.indexOf("{");
  const jsonEnd = trimmed.lastIndexOf("}") + 1;
  if (jsonStart === -1 || jsonEnd <= jsonStart) return null;
  try {
    return JSON.parse(trimmed.slice(jsonStart, jsonEnd));
  } catch (_) {
    return null;
  }
}

function normalizeContent(type, parsed) {
  if (!parsed || typeof parsed !== "object") return null;
  if (type === "flashcards" && Array.isArray(parsed.cards)) {
    return {
      cards: parsed.cards.slice(0, 50).map((c) => ({
        front: typeof c.front === "string" ? c.front : String(c.question || c.q || ""),
        back: typeof c.back === "string" ? c.back : String(c.answer || c.a || ""),
      })),
    };
  }
  if (type === "studyGuide") {
    const md = typeof parsed.markdown === "string" ? parsed.markdown : (typeof parsed.sections === "object" ? JSON.stringify(parsed.sections) : String(parsed.content || parsed.text || ""));
    return { markdown: md };
  }
  if (type === "practiceTest" && Array.isArray(parsed.questions)) {
    const questions = parsed.questions.slice(0, 50).map((q) => {
      const rawType = String((q?.type || q?.questionType || "")).toLowerCase();
      const inferredMcq = Array.isArray(q?.options) && q.options.filter(Boolean).length > 1;
      const type = rawType === "mcq" || rawType === "multiple_choice" || rawType === "multiplechoice"
        ? "mcq"
        : rawType === "openended" || rawType === "open-ended" || rawType === "open_ended" || rawType === "short_answer"
          ? "openEnded"
          : inferredMcq ? "mcq" : "openEnded";
      let options = Array.isArray(q?.options)
        ? q.options.map((opt) => (typeof opt === "string" ? opt.trim() : String(opt || "").trim())).filter(Boolean)
        : [];
      if (type === "mcq") options = options.slice(0, 4);
      return {
        type,
        text: typeof q?.text === "string" ? q.text : String(q?.question || q?.q || ""),
        options: type === "mcq" ? options : [],
        answer: typeof q?.answer === "string" ? q.answer : String(q?.answer || q?.a || q?.correctOption || q?.correct_answer || ""),
        explanation: typeof q?.explanation === "string" ? q.explanation : String(q?.rationale || q?.reasoning || ""),
      };
    });
    return {
      questions,
      testConfig: {
        totalQuestions: questions.length,
        mcqCount: questions.filter((q) => q.type === "mcq").length,
        openEndedCount: questions.filter((q) => q.type !== "mcq").length,
      },
    };
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY not configured",
      message: "Set OPENAI_API_KEY in Vercel environment variables.",
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { type, prompt, title, subject, testConfig } = body;
  const allowedTypes = ["flashcards", "studyGuide", "practiceTest"];
  if (!type || !allowedTypes.includes(type)) {
    return res.status(400).json({ error: "Missing or invalid type (use: flashcards, studyGuide, practiceTest)" });
  }
  const userPrompt = typeof prompt === "string" && prompt.trim() ? prompt.trim() : "Generate relevant study material.";
  const context = [userPrompt];
  if (title) context.push(`Title: ${title}`);
  if (subject) context.push(`Subject: ${subject}`);
  if (type === "practiceTest") {
    const cfg = getTestConfig(testConfig || {});
    context.push(`Practice test settings: ${cfg.totalQuestions} total questions, ${cfg.mcqCount} MCQ, ${cfg.openEndedCount} open-ended.`);
  }

  const systemPrompt = getSystemPrompt(type, testConfig);
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: context.join("\n") },
  ];

  try {
    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.6,
        messages,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errJson;
      try {
        errJson = JSON.parse(errText);
      } catch (_) {
        errJson = { error: errText || response.statusText };
      }
      return res.status(response.status).json({
        error: errJson.error?.message || errJson.error || "OpenAI request failed",
      });
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (!rawContent) {
      return res.status(502).json({ error: "Empty response from model" });
    }

    const parsed = parseJsonFromResponse(rawContent);
    const content = normalizeContent(type, parsed);
    if (!content) {
      return res.status(502).json({
        error: "Could not parse valid study content from model response",
        raw: rawContent.slice(0, 500),
      });
    }

    return res.status(200).json({ content });
  } catch (err) {
    console.error("generate-study-item error:", err);
    return res.status(500).json({
      error: "Generation failed",
      message: err.message || String(err),
    });
  }
}
