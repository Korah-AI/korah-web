/**
 * Client for generating study item content via AI.
 * 1. Tries same-origin /api/generate-study-item (Vercel serverless with OPENAI_API_KEY).
 * 2. Falls back to chat proxy (non-streaming) if the proxy supports it.
 */

(function (global) {
  var CHAT_PROXY = "https://korah-beta.vercel.app/api/proxy";
  var MODEL = "gpt-4o-mini";

  function clampInt(value, fallback, min, max) {
    var parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function getTestConfig(config) {
    var total = clampInt(config && config.totalQuestions, 10, 1, 50);
    var mcq = clampInt(config && config.mcqCount, Math.round(total * 0.6), 0, total);
    var open = clampInt(config && config.openEndedCount, total - mcq, 0, total - mcq);
    if (mcq + open !== total) open = total - mcq;
    return { totalQuestions: total, mcqCount: mcq, openEndedCount: open };
  }

  function getSystemPrompt(type, opts) {
    var practiceConfig = getTestConfig(opts && opts.testConfig);
    var prompts = {
      flashcards: 'You are a study assistant. Generate comprehensive flashcard content and a descriptive title (just the topic). Respond with ONLY a single valid JSON object, no markdown or explanation. Use this exact shape: { "title": "Overall Topic", "cards": [ { "front": "question or term", "back": "answer or definition" }, ... ] }. Create 15-20 cards.',
      studyGuide: 'You are a study assistant. Generate a lengthy, comprehensive study guide using Markdown and LaTeX, and a descriptive title (just the topic). Respond with ONLY a single valid JSON object, no markdown or explanation. Use this exact shape: { "title": "Overall Topic", "markdown": "Full markdown content here..." }.',
      practiceTest:
        'You are a study assistant. Generate a comprehensive practice test and a descriptive title (just the topic). ' +
        'Respond with ONLY a single valid JSON object, no markdown or explanation. ' +
        'Use this exact shape: { "title": "Overall Topic", "questions": [ { "type": "mcq" | "openEnded", "text": "Question text", "options": ["A", "B", "C", "D"], "answer": "Correct answer", "explanation": "Brief rationale" } ] }. ' +
        'Requirements: generate exactly ' + practiceConfig.totalQuestions + " questions, with exactly " + practiceConfig.mcqCount + " mcq and exactly " + practiceConfig.openEndedCount + " openEnded questions. " +
        "For openEnded questions, options must be an empty array. For mcq questions, include exactly 4 options and make one correct."
    };
    return prompts[type] || prompts.flashcards;
  }

  function stripCodeFences(text) {
    var trimmed = (text || "").trim();
    if (!trimmed) return "";
    if (trimmed.indexOf("```") !== -1) {
      trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }
    return trimmed.trim();
  }

  function parseJsonFromResponse(text) {
    var trimmed = stripCodeFences(text);
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch (_) {}
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
    var result = { title: typeof parsed.title === "string" ? parsed.title : "" };

    if (type === "flashcards" && Array.isArray(parsed.cards)) {
      result.cards = parsed.cards.slice(0, 50).map(function (c) {
        return {
          front: typeof c.front === "string" ? c.front : String(c.question || c.q || c.front || ""),
          back: typeof c.back === "string" ? c.back : String(c.answer || c.a || c.back || "")
        };
      });
      return result;
    }
    if (type === "studyGuide") {
      var md = typeof parsed.markdown === "string" ? parsed.markdown : (typeof parsed.sections === "object" ? JSON.stringify(parsed.sections) : String(parsed.content || parsed.text || parsed.body || ""));
      result.markdown = md;
      return result;
    }
    if (type === "practiceTest" && Array.isArray(parsed.questions)) {
      result.questions = parsed.questions.slice(0, 50).map(function (q) {
        var rawType = String((q && (q.type || q.questionType)) || "").toLowerCase();
        var inferredMcq = Array.isArray(q && q.options) && q.options.filter(Boolean).length > 1;
        var qType = rawType === "mcq" || rawType === "multiple_choice" || rawType === "multiplechoice"
          ? "mcq"
          : rawType === "openended" || rawType === "open_ended" || rawType === "short_answer" || rawType === "open-ended"
            ? "openEnded"
            : inferredMcq ? "mcq" : "openEnded";
        var options = Array.isArray(q && q.options) ? q.options.map(function (opt) {
          return typeof opt === "string" ? opt.trim() : String(opt || "").trim();
        }).filter(Boolean) : [];
        if (qType === "mcq") options = options.slice(0, 4);
        return {
          type: qType,
          text: typeof q.text === "string" ? q.text : String(q.question || q.q || q.text || ""),
          options: qType === "mcq" ? options : [],
          answer: typeof q.answer === "string" ? q.answer : String((q && (q.answer || q.a || q.correctOption || q.correct_answer)) || ""),
          explanation: typeof q.explanation === "string" ? q.explanation : String((q && (q.rationale || q.reasoning)) || "")
        };
      });
      var meta = getTestConfig(parsed.testConfig || parsed.config || {});
      result.testConfig = {
        totalQuestions: result.questions.length || meta.totalQuestions,
        mcqCount: result.questions.filter(function (q) { return q.type === "mcq"; }).length,
        openEndedCount: result.questions.filter(function (q) { return q.type !== "mcq"; }).length
      };
      return result;
    }
    return null;
  }

  /**
   * Generate study item content via AI.
   * @param {Object} opts - { type: string, prompt: string, title?: string, subject?: string, testConfig?: Object }
   * @returns {Promise<{ content: Object }>} - content is { cards } | { sections } | { questions }
   */
  function generateStudyContent(opts) {
    var type = opts.type;
    var prompt = (opts.prompt || "").trim() || "Generate relevant study material.";
    var title = opts.title || "";
    var subject = opts.subject || "";
    var testConfig = getTestConfig(opts.testConfig || {});
    var userMessage = [prompt];
    if (title) userMessage.push("Title: " + title);
    if (subject) userMessage.push("Subject: " + subject);
    if (type === "practiceTest") {
      userMessage.push("Practice test settings: " + testConfig.totalQuestions + " total questions, " + testConfig.mcqCount + " MCQ, " + testConfig.openEndedCount + " open-ended.");
    }

    function tryBackendApi() {
      var apiBase = typeof window !== "undefined" && window.location && window.location.origin
        ? window.location.origin
        : "";
      var url = apiBase + "/api/generate-study-item";
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: type, prompt: prompt, title: title, subject: subject, testConfig: testConfig })
      }).then(function (res) {
        if (!res.ok) throw new Error("API " + res.status);
        return res.json();
      }).then(function (data) {
        if (data && data.content) return data;
        throw new Error("Oops! There was an error. Please try again.");
      });
    }

    function tryChatProxy() {
      var systemPrompt = getSystemPrompt(type, { testConfig: testConfig });
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
        if (!raw) throw new Error("Oops! There was an error. Please try again.");
        var parsed = parseJsonFromResponse(raw);
        var content = normalizeContent(type, parsed);
        if (!content) throw new Error("Oops! There was an error. Please try again.");
        return { content: content };
      });
    }

    return tryBackendApi().catch(function () {
      return tryChatProxy();
    });
  }

  global.KorahStudyAPI = { generateStudyContent: generateStudyContent };
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this);
