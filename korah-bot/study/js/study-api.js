/**
 * Client for generating study item content via AI.
 * 1. Tries same-origin /api/generate-study-item (Vercel serverless with OPENAI_API_KEY).
 * 2. Falls back to chat proxy (non-streaming) if the proxy supports it.
 */

(function (global) {
  var CHAT_PROXY = "https://korah-beta.vercel.app/api/proxy";
  var MODEL = "gpt-4o-mini";

  function getSystemPrompt(type) {
    var prompts = {
      flashcards: 'You are a study assistant. Generate comprehensive flashcard content. Respond with ONLY a single valid JSON object, no markdown or explanation. Use this exact shape: { "cards": [ { "front": "question or term", "back": "answer or definition" }, ... ] }. Create 15-20 cards.',
      studyGuide: 'You are a study assistant. Generate a lengthy, comprehensive study guide using Markdown and LaTeX. Respond with ONLY a single valid JSON object, no markdown or explanation. Use this exact shape: { "markdown": "Full markdown content here..." }.',
      practiceTest: 'You are a study assistant. Generate comprehensive practice test questions. Respond with ONLY a single valid JSON object, no markdown or explanation. Use this exact shape: { "questions": [ { "text": "Question text", "answer": "Correct answer with brief explanation" }, ... ] }. Create 10-15 questions.'
    };
    return prompts[type] || prompts.flashcards;
  }

  function parseJsonFromResponse(text) {
    var trimmed = (text || "").trim();
    var start = trimmed.indexOf("{");
    var end = trimmed.lastIndexOf("}") + 1;
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(trimmed.slice(start, end));
    } catch (_) {
      return null;
    }
  }

  function normalizeContent(type, parsed) {
    if (!parsed || typeof parsed !== "object") return null;
    if (type === "flashcards" && Array.isArray(parsed.cards)) {
      return {
        cards: parsed.cards.slice(0, 50).map(function (c) {
          return {
            front: typeof c.front === "string" ? c.front : String(c.question || c.q || c.front || ""),
            back: typeof c.back === "string" ? c.back : String(c.answer || c.a || c.back || "")
          };
        })
      };
    }
    if (type === "studyGuide") {
      var md = typeof parsed.markdown === "string" ? parsed.markdown : (typeof parsed.sections === "object" ? JSON.stringify(parsed.sections) : String(parsed.content || parsed.text || parsed.body || ""));
      return { markdown: md };
    }
    if (type === "practiceTest" && Array.isArray(parsed.questions)) {
      return {
        questions: parsed.questions.slice(0, 50).map(function (q) {
          return {
            text: typeof q.text === "string" ? q.text : String(q.question || q.q || q.text || ""),
            answer: typeof q.answer === "string" ? q.answer : String(q.answer || q.a || "")
          };
        })
      };
    }
    return null;
  }

  /**
   * Generate study item content via AI.
   * @param {Object} opts - { type: string, prompt: string, title?: string, subject?: string }
   * @returns {Promise<{ content: Object }>} - content is { cards } | { sections } | { questions }
   */
  function generateStudyContent(opts) {
    var type = opts.type;
    var prompt = (opts.prompt || "").trim() || "Generate relevant study material.";
    var title = opts.title || "";
    var subject = opts.subject || "";
    var userMessage = [prompt];
    if (title) userMessage.push("Title: " + title);
    if (subject) userMessage.push("Subject: " + subject);

    function tryBackendApi() {
      var apiBase = typeof window !== "undefined" && window.location && window.location.origin
        ? window.location.origin
        : "";
      var url = apiBase + "/api/generate-study-item";
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type, prompt: prompt, title: title, subject: subject })
      }).then(function (res) {
        if (!res.ok) throw new Error("API " + res.status);
        return res.json();
      }).then(function (data) {
        if (data && data.content) return data;
        throw new Error("Invalid API response");
      });
    }

    function tryChatProxy() {
      var systemPrompt = getSystemPrompt(type);
      var messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage.join("\n") }
      ];
      return fetch(CHAT_PROXY, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          temperature: 0.6,
          messages: messages,
          stream: false
        })
      }).then(function (res) {
        if (!res.ok) throw new Error("Proxy " + res.status);
        return res.json();
      }).then(function (data) {
        var raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!raw) throw new Error("Empty proxy response");
        var parsed = parseJsonFromResponse(raw);
        var content = normalizeContent(type, parsed);
        if (!content) throw new Error("Could not parse content");
        return { content: content };
      });
    }

    return tryBackendApi().catch(function () {
      return tryChatProxy();
    });
  }

  global.KorahStudyAPI = { generateStudyContent: generateStudyContent };
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this);
