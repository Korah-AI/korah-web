/**
 * Client for generating study item content via AI.
 * 1. Tries same-origin /api/generate-study-item (Vercel serverless with OPENAI_API_KEY).
 * 2. Falls back to chat proxy (non-streaming) if the proxy supports it.
 */

(function (global) {
  var CHAT_PROXY = "/api/gem-proxy";
  var MODEL = "gemini-2.5-flash";

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

  var FORMAT_INSTRUCTIONS = '\n\n' +
    'KATEX DELIMITER POLICY (REQUIRED):\n' +
    '- Inline math: \\(...\\)\n' +
    '- Display math: $$...$$\n' +
    '- NEVER use $...$, \\[...\\], [ ... ], or bare math like "x^2" without delimiters\n' +
    '- Ensure all math delimiters are balanced, and put display math on its own line\n\n' +
    'INTERACTIVE GRAPHS: When showing mathematical functions or graphs, use the Desmos format:\n' +
    '```desmos\n' +
    '{\n' +
    '  "expressions": [\n' +
    '    {"latex": "y=x^2", "color": "#4285F4"},\n' +
    '    {"latex": "y=sin(x)", "color": "#EA4335"}\n' +
    '  ],\n' +
    '  "zoom": {"xmin": -5, "xmax": 5, "ymin": -5, "ymax": 5}\n' +
    '}\n' +
    '```\n\n' +
    'Always format your responses using GitHub-flavored Markdown. Use:\n' +
    '- Markdown headings (##, ###) to structure sections\n' +
    '- Bulleted and numbered lists for steps and key points\n' +
    '- `code` and fenced code blocks for formulas or code when helpful';

  function getSystemPrompt(type, opts) {
    var practiceConfig = getTestConfig(opts && opts.testConfig);
    var prompts = {
      flashcards: 'You are a study assistant. Generate comprehensive flashcard content and a descriptive title (just the topic). Respond with ONLY a single valid JSON object, no markdown or explanation. Use this exact shape: { "title": "Overall Topic", "cards": [ { "front": "question or term", "back": "answer or definition" }, ... ] }. Create 15-20 cards. If a card includes math, follow this policy exactly: inline \\(...\\), display $$...$$, and never use $...$, \\[...\\], [ ... ], or bare math without delimiters.',
      studyGuide: 'You are a study assistant. Generate a comprehensive study guide using Markdown and LaTeX. Respond with ONLY plain text - the study guide content in markdown format. Start directly with the content, no JSON or code fences. Include a title at the top as an H1 (e.g., # Topic Name), followed by the study guide sections.' + FORMAT_INSTRUCTIONS,
      practiceTest:
        'You are a study assistant. Generate a comprehensive practice test and a descriptive title (just the topic). ' +
        'Respond with ONLY a single valid JSON object, no markdown or explanation. ' +
        'Use this exact shape: { "title": "Overall Topic", "questions": [ { "type": "mcq" | "openEnded", "text": "Question text", "options": ["A", "B", "C", "D"], "answer": "Correct answer", "explanation": "Brief rationale" } ] }. ' +
        'Requirements: generate exactly ' + practiceConfig.totalQuestions + " questions, with exactly " + practiceConfig.mcqCount + " mcq and exactly " + practiceConfig.openEndedCount + " openEnded questions. " +
        "For openEnded questions, options must be an empty array. For mcq questions, include exactly 4 options and make one correct. If any question, option, answer, or explanation includes math, follow this policy exactly: inline \\(...\\), display $$...$$, and never use $...$, \\[...\\], [ ... ], or bare math without delimiters."
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

  function extractStudyGuideContent(text) {
    if (!text || typeof text !== "string") return null;
    var trimmed = text.trim();
    var title = "";
    var markdown = trimmed;
    var h1Match = trimmed.match(/^#\s+(.+)$/m);
    if (h1Match) {
      title = h1Match[1].trim();
      markdown = trimmed.replace(/^#\s+.+$/m, "").trim();
    }
    if (!title) {
      var lines = trimmed.split("\n");
      for (var i = 0; i < Math.min(3, lines.length); i++) {
        var line = lines[i].trim();
        if (line.length > 3 && line.length < 100 && !line.match(/^[-*#]/)) {
          title = line.replace(/^[=-]+/, "").trim();
          break;
        }
      }
    }
    if (!title) title = "Study Guide";
    return { title: title, markdown: markdown };
  }

  function createHttpError(defaultMessage, res, payload) {
    var message = defaultMessage;
    if (payload && typeof payload.message === "string" && payload.message.trim()) {
      message = payload.message.trim();
    } else if (payload && typeof payload.error === "string" && payload.error.trim()) {
      message = payload.error.trim();
    }
    var error = new Error(message);
    error.status = res && typeof res.status === "number" ? res.status : 0;
    if (payload && typeof payload.retryAfterSeconds === "number") {
      error.retryAfterSeconds = payload.retryAfterSeconds;
    }
    return error;
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
   * @param {Object} opts - { type: string, prompt: string, title?: string, subject?: string, testConfig?: Object, files?: Array }
   * @returns {Promise<{ content: Object }>} - content is { cards } | { sections } | { questions }
   */
  async function generateStudyContent(opts) {
    var type = opts.type;
    var prompt = (opts.prompt || "").trim() || "Generate relevant study material.";
    var title = opts.title || "";
    var subject = opts.subject || "";
    var testConfig = getTestConfig(opts.testConfig || {});
    var files = opts.files || [];
    var userMessage = [prompt];
    if (title) userMessage.push("Title: " + title);
    if (subject) userMessage.push("Subject: " + subject);
    if (type === "practiceTest") {
      userMessage.push("Practice test settings: " + testConfig.totalQuestions + " total questions, " + testConfig.mcqCount + " MCQ, " + testConfig.openEndedCount + " open-ended.");
    }

    // Process files into text or base64
    var fileContents = [];
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      if (file.type.startsWith("image/")) {
        var base64 = await toBase64(file);
        fileContents.push({ type: "image", name: file.name, data: base64 });
      } else if (file.type === "application/pdf") {
        var base64 = await toBase64(file);
        fileContents.push({ type: "pdf", name: file.name, data: base64 });
      } else if (file.type === "text/plain") {
        var text = await file.text();
        fileContents.push({ type: "text", name: file.name, data: text });
      } else {
        // Fallback: try reading as text for common extensions
        var ext = (file.name || "").split(".").pop().toLowerCase();
        if (["md", "txt", "csv", "json"].includes(ext)) {
          var text = await file.text();
          fileContents.push({ type: "text", name: file.name, data: text });
        } else {
          fileContents.push({ type: "other", name: file.name });
        }
      }
    }

    if (fileContents.length > 0) {
      userMessage.push("\nDocuments provided:");
      fileContents.forEach(f => {
        if (f.type === "text") {
          userMessage.push("--- Content of " + f.name + " ---\n" + f.data + "\n--- End of " + f.name + " ---");
        } else if (f.type === "image") {
          userMessage.push("[Image: " + f.name + " (sent as multimodal data)]");
        } else if (f.type === "pdf") {
          userMessage.push("[PDF: " + f.name + " (sent as multimodal data)]");
        } else {
          userMessage.push("[Attached file: " + f.name + " (parsing not supported in this environment)]");
        }
      });
    }

    function toBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }

    function tryBackendApi() {
      var url = "/api/generate-study-item";
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          type: type, 
          prompt: prompt, 
          title: title, 
          subject: subject, 
          testConfig: testConfig,
          fileContents: fileContents // Send processed contents
        })
      }).then(function (res) {
        return res.json().catch(function () {
          return {};
        }).then(function (data) {
          if (!res.ok) {
            throw createHttpError("Oops! There was an error. Please try again.", res, data);
          }
          return data;
        });
      }).then(function (data) {
        if (data && data.content) return data;
        throw new Error("Oops! There was an error. Please try again.");
      });
    }

    function tryChatProxy() {
      var systemPrompt = getSystemPrompt(type, { testConfig: testConfig });
      
      // Construct messages for Chat Proxy
      var messages = [
        { role: "system", content: systemPrompt }
      ];

      var userContent = [{ type: "text", text: userMessage.join("\n") }];
      
      // If we have images or PDFs, Gemini can handle them if the proxy supports it
      fileContents.forEach(f => {
        if (f.type === "image" || f.type === "pdf") {
          userContent.push({
            type: "image_url",
            image_url: { url: f.data }
          });
        }
      });

      messages.push({ role: "user", content: userContent });

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
        return res.json().catch(function () {
          return {};
        }).then(function (data) {
          if (!res.ok) {
            throw createHttpError("Oops! There was an error. Please try again.", res, data);
          }
          return data;
        });
      }).then(function (data) {
        var raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
        if (!raw) throw new Error("Oops! There was an error. Please try again.");
        
        if (type === "studyGuide") {
          var content = extractStudyGuideContent(raw);
          if (!content) throw new Error("Oops! There was an error. Please try again.");
          return { content: content };
        }
        
        var parsed = parseJsonFromResponse(raw);
        var content = normalizeContent(type, parsed);
        if (!content) throw new Error("Oops! There was an error. Please try again.");
        return { content: content };
      });
    }

    return tryBackendApi().catch(function (error) {
      if (error && error.status === 429) {
        throw error;
      }
      return tryChatProxy();
    });
  }

  global.KorahStudyAPI = { generateStudyContent: generateStudyContent };
})(typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : this);
