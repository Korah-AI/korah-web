/**
 * Vercel serverless API: generate study item content using Gemini.
 * POST body: { type, prompt, title?, subject?, testConfig?, fileContents? }
 * Returns: { content } where content matches study item content shape (cards | sections | questions).
 *
 * Requires GEMINI_API_KEY in Vercel env.
 */

const MODEL = "gemini-2.5-flash";
const KATEX_FORMAT_RULES = `KaTeX delimiter policy (REQUIRED):
- Use \\(...\\) for inline math
- Use $$...$$ for display math on its own line
- Never use $...$, \\[...\\], [ ... ], or bare math like x^2 without delimiters
- Ensure every expression has balanced opening and closing delimiters`;

export const config = {
  maxDuration: 300,
};

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
Create 15-20 cards based on the user's prompt. Use clear, concise language. Include key terms, concepts, and important details.
If a card includes math, follow this policy:
${KATEX_FORMAT_RULES}`,

    studyGuide: `You are a study assistant. Generate a comprehensive study guide. 
Use Markdown for structure (headings, bullet points, bold text). 
For all mathematical formulas, follow this policy:
${KATEX_FORMAT_RULES}
The guide should be detailed, covering all aspects of the topic provided.
Respond with ONLY plain text - the study guide content in markdown format. Start directly with the content, no JSON or code fences. Include a title at the top as an H1 (e.g., # Topic Name), followed by the study guide sections.`,

    practiceTest: `You are a study assistant. Generate a comprehensive practice test. Respond with ONLY a single valid JSON object, no markdown or explanation:
{ "questions": [ { "type": "mcq" | "openEnded", "text": "Question text", "options": ["A", "B", "C", "D"], "answer": "Correct answer", "explanation": "Brief rationale" } ] }
Generate exactly ${cfg.totalQuestions} questions with exactly ${cfg.mcqCount} mcq and exactly ${cfg.openEndedCount} openEnded questions.
For openEnded questions, options must be an empty array.
For mcq questions, include exactly 4 options and make one correct.
If any question, option, answer, or explanation includes math, follow this policy:
${KATEX_FORMAT_RULES}`,
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

function extractStudyGuideContent(text) {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  let title = "";
  let markdown = trimmed;
  const h1Match = trimmed.match(/^#\s+(.+)$/m);
  if (h1Match) {
    title = h1Match[1].trim();
    markdown = trimmed.replace(/^#\s+.+$/m, "").trim();
  }
  if (!title) {
    const lines = trimmed.split("\n");
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const line = lines[i].trim();
      if (line.length > 3 && line.length < 100 && !line.match(/^[-*#]/)) {
        title = line.replace(/^[=-]+/, "").trim();
        break;
      }
    }
  }
  if (!title) title = "Study Guide";
  return { title, markdown };
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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY not configured",
      message: "Set GEMINI_API_KEY in Vercel environment variables.",
    });
  }

  let body;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch (_) {
    return res.status(400).json({ error: "Invalid JSON body" });
  }

  const { type, prompt, title, subject, testConfig, fileContents } = body;
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
  
  // Gemini-specific mapping
  const contents = [
    {
      role: "user",
      parts: [{ text: context.join("\n") }]
    }
  ];

  if (Array.isArray(fileContents)) {
    fileContents.forEach(f => {
      if ((f.type === "image" || f.type === "pdf") && f.data) {
        if (f.data.startsWith('data:')) {
          const [header, data] = f.data.split(',');
          const mimeType = header.match(/:(.*?);/)[1];
          contents[0].parts.push({
            inlineData: {
              mimeType,
              data
            }
          });
        }
      } else if (f.type === "text" && f.data) {
        contents[0].parts[0].text += `\n\n--- Content of ${f.name} ---\n${f.data}\n--- End of ${f.name} ---`;
      } else {
        contents[0].parts[0].text += `\n\n[Attached file: ${f.name}]`;
      }
    });
  }

  const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    const response = await fetch(geminiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          temperature: 0.6,
          responseMimeType: type !== "studyGuide" ? "application/json" : "text/plain",
        }
      }),
    });

    if (!response.ok) {
      const errData = await response.json();
      return res.status(response.status).json({
        error: "Gemini API request failed",
        details: errData,
      });
    }

    const data = await response.json();
    const rawContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      return res.status(502).json({ error: "Empty response from model" });
    }

    if (type === "studyGuide") {
      const content = extractStudyGuideContent(rawContent);
      if (!content) {
        return res.status(502).json({
          error: "Could not parse valid study guide content from model response",
          raw: rawContent.slice(0, 500),
        });
      }
      return res.status(200).json({ content });
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
