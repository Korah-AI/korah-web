/**
 * Vercel serverless API: generate study item content using OpenAI.
 * POST body: { type, prompt, title?, subject? }
 * Returns: { content } where content matches study item content shape (cards | sections | questions).
 *
 * Requires OPENAI_API_KEY in Vercel env (or uses proxy from same host if configured).
 */

const OPENAI_URL = "https://korah-beta.vercel.app/api/proxy";
const MODEL = "gpt-4o-mini";

function getSystemPrompt(type) {
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
{ "questions": [ { "text": "Question text (multiple choice or short answer)", "answer": "Correct answer with brief explanation" }, ... ] }
Create 10-15 questions based on the user's prompt. Mix question types. Ensure high quality and relevant questions.`,
  };
  return prompts[type] || prompts.flashcards;
}

function parseJsonFromResponse(text) {
  const trimmed = text.trim();
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
    return {
      questions: parsed.questions.slice(0, 50).map((q) => ({
        text: typeof q.text === "string" ? q.text : String(q.question || q.q || ""),
        answer: typeof q.answer === "string" ? q.answer : String(q.answer || q.a || ""),
      })),
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

  const { type, prompt, title, subject } = body;
  const allowedTypes = ["flashcards", "studyGuide", "practiceTest"];
  if (!type || !allowedTypes.includes(type)) {
    return res.status(400).json({ error: "Missing or invalid type (use: flashcards, studyGuide, practiceTest)" });
  }
  const userPrompt = typeof prompt === "string" && prompt.trim() ? prompt.trim() : "Generate relevant study material.";
  const context = [userPrompt];
  if (title) context.push(`Title: ${title}`);
  if (subject) context.push(`Subject: ${subject}`);

  const systemPrompt = getSystemPrompt(type);
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
