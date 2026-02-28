(() => {
  const MAX_CHARS = 10000;
  const API_ENDPOINT = "https://korah-beta.vercel.app/api/proxy";
  const MODEL = "gpt-4o-mini";

  const input = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const messagesList = document.getElementById("messages-list");
  const welcomeScreen = document.getElementById("welcome-screen");
  const typingIndicator = document.getElementById("typing-indicator");
  const chatBody = document.getElementById("chat-body");
  const charCount = document.getElementById("char-count");
  const clearChatBtn = document.getElementById("clear-chat-btn");
  const newChatBtn = document.getElementById("new-chat-btn");
  const suggestionChips = document.querySelectorAll(".suggestion-chip");
  const quickPromptButtons = document.querySelectorAll("#tool-flashcard, #tool-guide");
  const chatHistoryContainer = document.getElementById("chat-history");
  const chatTitleEl = document.getElementById("chat-title");

  if (!input || !sendBtn || !messagesList) return;

  // ═══ Storage Utilities ═══
  const Storage = {
    SESSIONS_KEY: "korah_sessions",
    CURRENT_SESSION_KEY: "korah_current_session",
    SETTINGS_KEY: "korah_settings",
    STUDY_ITEMS_KEY: "korah_study_items",

    getSessions() {
      const data = localStorage.getItem(this.SESSIONS_KEY);
      return data ? JSON.parse(data) : {};
    },

    saveSessions(sessions) {
      localStorage.setItem(this.SESSIONS_KEY, JSON.stringify(sessions));
    },

    getCurrentSessionId() {
      return localStorage.getItem(this.CURRENT_SESSION_KEY) || "default";
    },

    setCurrentSessionId(id) {
      localStorage.setItem(this.CURRENT_SESSION_KEY, id);
    },

    getSession(id) {
      const sessions = this.getSessions();
      return sessions[id] || null;
    },

    saveSession(id, session) {
      const sessions = this.getSessions();
      sessions[id] = session;
      this.saveSessions(sessions);
    },

    deleteSession(id) {
      const sessions = this.getSessions();
      delete sessions[id];
      this.saveSessions(sessions);
    },

    createSession(title = "New Chat", mode = "physics") {
      const id = `session_${Date.now()}`;
      const session = {
        id,
        title,
        mode,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        autoTitleGenerated: false,
        userRenamed: false,
      };
      this.saveSession(id, session);
      return id;
    },

    getSettings() {
      const data = localStorage.getItem(this.SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        defaultMode: "general",
        detailLevel: "detailed",
        autoFollowUp: true,
        focusTimerDefault: 25,
      };
    },

    saveSettings(settings) {
      localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    },

    getStudyItems() {
      const data = localStorage.getItem(this.STUDY_ITEMS_KEY);
      return data ? JSON.parse(data) : {};
    },

    saveStudyItem(id, item) {
      const items = this.getStudyItems();
      items[id] = item;
      localStorage.setItem(this.STUDY_ITEMS_KEY, JSON.stringify(items));
    },
  };

  // ═══ Session State ═══
  let currentSessionId = Storage.getCurrentSessionId();
  let currentSession = Storage.getSession(currentSessionId);
  if (!currentSession) {
    currentSessionId = Storage.createSession("New Chat", "general");
    currentSession = Storage.getSession(currentSessionId);
    Storage.setCurrentSessionId(currentSessionId);
  }

  const history = currentSession.messages || [];
  let isSending = false;

  function scrollToBottom() {
    if (!chatBody) return;
    chatBody.scrollTop = chatBody.scrollHeight;
  }

  function updateCharCount() {
    if (!charCount) return;
    const count = input.value.length;
    charCount.textContent = `${count} / ${MAX_CHARS}`;
  }

  function resizeInput() {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 160)}px`;
  }

  function setWelcomeVisibility(show) {
    if (!welcomeScreen) return;
    welcomeScreen.style.display = show ? "flex" : "none";
  }

  function setTyping(show) {
    if (!typingIndicator) return;
    typingIndicator.classList.toggle("hidden", !show);
    if (show) scrollToBottom();
  }

  function setSendingState(sending) {
    isSending = sending;
    sendBtn.disabled = sending;
    input.disabled = sending;
  }

  function renderMarkdownAndMath(targetEl, markdownText) {
    if (!targetEl) return;

    let html = markdownText || "";

    try {
      if (window.marked && typeof window.marked.parse === "function") {
        html = window.marked.parse(markdownText || "");
      } else {
        html = (markdownText || "")
          .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
          .replace(/^### (.*)$/gim, "<h3>$1</h3>")
          .replace(/^## (.*)$/gim, "<h2>$1</h2>")
          .replace(/^# (.*)$/gim, "<h1>$1</h1>")
          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
          .replace(/\*(.*?)\*/g, "<em>$1</em>")
          .replace(/`([^`]+)`/g, "<code>$1</code>")
          .replace(/\n/g, "<br/>");
      }
    } catch (e) {
      console.error("Markdown render error:", e);
      html = (markdownText || "").replace(/\n/g, "<br/>");
    }

    targetEl.innerHTML = html;

    if (window.renderMathInElement && typeof window.renderMathInElement === "function") {
      try {
        window.renderMathInElement(targetEl, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        });
      } catch (e) {
        console.error("KaTeX render error:", e);
      }
    }
  }

  function buildMessageRow(role, text, isError = false, suggestions = [], contentId = null) {
    const row = document.createElement("div");
    row.className = `msg-row ${role === "user" ? "user" : "assistant"}`;

    const avatar = document.createElement("div");
    avatar.className = `msg-avatar ${role === "user" ? "user-av" : "korah-av"}`;
    avatar.textContent = role === "user" ? "You" : "K";

    const bubble = document.createElement("div");
    bubble.className = `msg-bubble ${role === "user" ? "user" : "korah"}${isError ? " error" : ""}`;

    const label = document.createElement("div");
    label.className = "msg-label";
    label.innerHTML = '<span class="msg-label-dot"></span>' + (role === "user" ? "You" : "Korah AI");

    const content = document.createElement("div");
    if (contentId) content.id = contentId;

    if (role === "assistant" && !isError) {
      content.className = "assistant-content";
      renderMarkdownAndMath(content, text || "");
    } else {
      content.style.whiteSpace = "pre-wrap";
      content.textContent = text;
    }

    bubble.appendChild(label);
    bubble.appendChild(content);

    // Add AI-generated suggestions for assistant messages
    if (role === "assistant" && !isError && suggestions.length > 0) {
      const suggestionsDiv = document.createElement("div");
      suggestionsDiv.className = "inline-suggestions";
      
      suggestions.forEach((suggestion) => {
        const btn = document.createElement("button");
        btn.className = "inline-suggestion-btn t-btn";
        btn.textContent = suggestion;
        btn.addEventListener("click", () => {
          sendMessage(suggestion);
        });
        suggestionsDiv.appendChild(btn);
      });
      
      bubble.appendChild(suggestionsDiv);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    return row;
  }

  function getFollowUpActionsForMode(mode) {
    const commonActions = [
      { icon: "🃏", label: "Make flashcards", prompt: "Create flashcards based on what you just explained" },
      { icon: "🎯", label: "Quiz me", prompt: "Give me a quick quiz on this topic" },
      { icon: "🔄", label: "Explain simpler", prompt: "Can you explain that in simpler terms?" },
    ];

    const modeSpecific = {
      math: [
        { icon: "📝", label: "Practice problems", prompt: "Give me similar practice problems to solve" },
        { icon: "✅", label: "Show examples", prompt: "Show me more step-by-step examples" },
      ],
      physics: [
        { icon: "🌍", label: "Real-world example", prompt: "Give me a real-world example of this concept" },
        { icon: "🔬", label: "Show experiment", prompt: "Describe an experiment that demonstrates this" },
      ],
      chemistry: [
        { icon: "⚗️", label: "Show reaction", prompt: "Show me the balanced chemical equation" },
        { icon: "🧪", label: "Related reactions", prompt: "What are similar chemical reactions?" },
      ],
      biology: [
        { icon: "🔬", label: "Show diagram", prompt: "Describe a diagram of this process" },
        { icon: "🧬", label: "Related concepts", prompt: "What other biological concepts relate to this?" },
      ],
      history: [
        { icon: "📅", label: "Timeline", prompt: "Create a timeline of these events" },
        { icon: "🌍", label: "Broader context", prompt: "What was happening globally during this time?" },
      ],
      literature: [
        { icon: "📖", label: "Find themes", prompt: "What are the main themes in this text?" },
        { icon: "💭", label: "Analyze symbols", prompt: "What symbols or motifs appear in this work?" },
      ],
    };

    return [...commonActions, ...(modeSpecific[mode] || [])];
  }

  function appendMessage(role, text, isError = false, suggestions = [], contentId = null) {
    const row = buildMessageRow(role, text, isError, suggestions, contentId);
    messagesList.appendChild(row);
    setWelcomeVisibility(false);
    scrollToBottom();
    return row;
  }

  function getStudyItemIcon(type) {
    const icons = { flashcards: "🃏", studyGuide: "📖", practiceTest: "🎯" };
    return icons[type] || "📄";
  }

  function renderStudyItemsHistory() {
    const container = document.getElementById("study-items-history");
    if (!container) return;
    const items = Storage.getStudyItems();
    const list = Object.keys(items)
      .map((id) => ({ id, ...items[id] }))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 8);
    container.innerHTML = "";
    list.forEach((item) => {
      const a = document.createElement("a");
      a.href = `study/item.html?id=${encodeURIComponent(item.id)}`;
      a.className = "history-item t-btn";
      a.style.textDecoration = "none";
      a.style.color = "inherit";
      a.innerHTML = `<span class="history-icon">${getStudyItemIcon(item.type)}</span><span class="history-text">${(item.title || "Untitled").slice(0, 28)}${(item.title || "").length > 28 ? "…" : ""}</span>`;
      container.appendChild(a);
    });
  }

  function renderFlashcards(content) {
    // Parse flashcard content and render with flip animation
    const container = document.createElement("div");
    container.className = "flashcard-container";

    const cards = content.split(/\n\n+/).filter(card => card.trim());
    cards.forEach((card, idx) => {
      const [question, answer] = card.split(/\n/).filter(line => line.trim());
      if (!question || !answer) return;

      const cardEl = document.createElement("div");
      cardEl.className = "flashcard";
      cardEl.innerHTML = `
        <div class="flashcard-inner">
          <div class="flashcard-front">
            <div class="flashcard-label">Question ${idx + 1}</div>
            <div class="flashcard-text">${question.replace(/^Q:|^\d+\.\s*/, "").trim()}</div>
          </div>
          <div class="flashcard-back">
            <div class="flashcard-label">Answer</div>
            <div class="flashcard-text">${answer.replace(/^A:/, "").trim()}</div>
          </div>
        </div>
      `;

      cardEl.addEventListener("click", () => {
        cardEl.classList.toggle("flipped");
      });

      container.appendChild(cardEl);
    });

    return container;
  }

  function renderStudyGuide(content) {
    // Render study guide with collapsible sections
    const container = document.createElement("div");
    container.className = "study-guide";

    const sections = content.split(/\n(?=##|###|\*\*)/g);
    sections.forEach((section) => {
      const sectionEl = document.createElement("div");
      sectionEl.className = "study-guide-section";

      const lines = section.split("\n");
      const title = lines[0].replace(/^#+\s*|\*\*/g, "").trim();
      const body = lines.slice(1).join("\n").trim();

      sectionEl.innerHTML = `
        <div class="study-guide-title">
          <span>${title}</span>
          <span class="toggle-icon">▼</span>
        </div>
        <div class="study-guide-content">${body}</div>
      `;

      const titleEl = sectionEl.querySelector(".study-guide-title");
      const contentEl = sectionEl.querySelector(".study-guide-content");
      
      titleEl.addEventListener("click", () => {
        sectionEl.classList.toggle("collapsed");
      });

      container.appendChild(sectionEl);
    });

    return container;
  }

  function renderPracticeTest(content) {
    // Render interactive practice test
    const container = document.createElement("div");
    container.className = "practice-test";

    const questions = content.split(/\n(?=\d+\.\s)/g).filter(q => q.trim());
    questions.forEach((question, idx) => {
      const questionEl = document.createElement("div");
      questionEl.className = "practice-question";

      questionEl.innerHTML = `
        <div class="practice-q-number">Question ${idx + 1}</div>
        <div class="practice-q-text">${question.trim()}</div>
        <textarea class="practice-answer" placeholder="Type your answer here..."></textarea>
      `;

      container.appendChild(questionEl);
    });

    const submitBtn = document.createElement("button");
    submitBtn.className = "practice-submit-btn t-btn";
    submitBtn.textContent = "Check Answers";
    submitBtn.addEventListener("click", () => {
      alert("Answer checking would be implemented here! For now, scroll down to see the correct answers in the AI response.");
    });
    container.appendChild(submitBtn);

    return container;
  }

  function generateContextualSuggestions(aiResponse) {
    // Generate 2-3 contextual follow-up questions based on AI response content
    const suggestions = [];
    const response = aiResponse.toLowerCase();
    const mode = currentSession.mode || "physics";

    // Mode-specific keyword-based suggestions
    if (mode === "math") {
      if (response.includes("quadratic") || response.includes("x²")) {
        suggestions.push("What is the discriminant?", "How do I complete the square?");
      } else if (response.includes("derivative") || response.includes("calculus")) {
        suggestions.push("Show me the chain rule", "What about integration?");
      } else if (response.includes("equation") || response.includes("solve")) {
        suggestions.push("Show me another example", "What if the numbers were different?");
      } else {
        suggestions.push("Can you show me a practice problem?", "Explain the next step");
      }
    } else if (mode === "physics") {
      if (response.includes("force") || response.includes("newton")) {
        suggestions.push("What about friction?", "Show me an example calculation");
      } else if (response.includes("energy") || response.includes("kinetic")) {
        suggestions.push("What is potential energy?", "How is energy conserved?");
      } else if (response.includes("motion") || response.includes("velocity")) {
        suggestions.push("What about acceleration?", "Show me a real-world example");
      } else {
        suggestions.push("Can you explain the formula?", "What's a practical application?");
      }
    } else if (mode === "chemistry") {
      if (response.includes("reaction") || response.includes("chemical")) {
        suggestions.push("What are the products?", "Is this exothermic?");
      } else if (response.includes("atom") || response.includes("electron")) {
        suggestions.push("What about ionic bonds?", "Show me the Lewis structure");
      } else if (response.includes("acid") || response.includes("base")) {
        suggestions.push("What is pH?", "Show me a neutralization reaction");
      } else {
        suggestions.push("Can you show the balanced equation?", "What are similar reactions?");
      }
    } else if (mode === "biology") {
      if (response.includes("cell") || response.includes("mitochondria")) {
        suggestions.push("What about the nucleus?", "How does cellular respiration work?");
      } else if (response.includes("dna") || response.includes("gene")) {
        suggestions.push("What is transcription?", "How does mutation occur?");
      } else if (response.includes("evolution") || response.includes("natural selection")) {
        suggestions.push("What is adaptation?", "Can you give an example?");
      } else {
        suggestions.push("What's the biological significance?", "Are there related processes?");
      }
    } else if (mode === "history") {
      if (response.includes("war") || response.includes("battle")) {
        suggestions.push("What caused this conflict?", "What were the consequences?");
      } else if (response.includes("revolution") || response.includes("independence")) {
        suggestions.push("Who were the key figures?", "What happened afterwards?");
      } else if (response.includes("century") || response.includes("era")) {
        suggestions.push("What else was happening then?", "How did this shape history?");
      } else {
        suggestions.push("What's the historical context?", "What were the long-term effects?");
      }
    } else if (mode === "literature") {
      if (response.includes("character") || response.includes("protagonist")) {
        suggestions.push("What motivates this character?", "How do they develop?");
      } else if (response.includes("theme") || response.includes("symbol")) {
        suggestions.push("What other themes appear?", "Can you analyze the imagery?");
      } else if (response.includes("author") || response.includes("writer")) {
        suggestions.push("What influenced the author?", "What's their writing style?");
      } else {
        suggestions.push("What's the deeper meaning?", "How does this relate to the text?");
      }
    }

    // Limit to 2-3 suggestions
    return suggestions.slice(0, 3);
  }

  function showSuggestionBar() {
    const suggestionBar = document.getElementById("suggestion-bar");
    if (!suggestionBar) return;

    const mode = currentSession.mode || "physics";
    const suggestions = getFollowUpActionsForMode(mode);

    suggestionBar.innerHTML = "";
    suggestions.forEach((suggestion) => {
      const btn = document.createElement("button");
      btn.className = "suggestion-prompt-btn t-btn";
      btn.innerHTML = `<span>${suggestion.icon}</span><span>${suggestion.label}</span>`;
      btn.addEventListener("click", () => {
        sendMessage(suggestion.prompt);
      });
      suggestionBar.appendChild(btn);
    });

    suggestionBar.classList.add("show");
  }

  function hideSuggestionBar() {
    const suggestionBar = document.getElementById("suggestion-bar");
    if (suggestionBar) {
      suggestionBar.classList.remove("show");
    }
  }

  async function callChatApi(messages, onChunk = null, options = {}) {
    const { systemPromptOverride } = options || {};
    const systemPrompt = systemPromptOverride || getSystemPrompt(currentSession.mode || "physics");
    const messagesWithSystem = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages: messagesWithSystem,
        stream: true
      })
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch (_error) {}
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("No response body received");
    }

    // Handle streaming response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = "";
    let buffer = ""; // Buffer for incomplete chunks

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log("Stream completed. Total length:", fullReply.length);
          // Process any remaining data in buffer
          if (buffer.trim()) {
            console.warn("Remaining buffer at end:", buffer);
          }
          break;
        }

        // Append to buffer and decode
        buffer += decoder.decode(value, { stream: true });
        
        // Split by newlines but keep the last incomplete line in buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              console.log("Received [DONE] signal");
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content;
              if (content) {
                fullReply += content;
                if (onChunk) onChunk(content, fullReply);
              }
              
              // Check if stream finished
              const finishReason = parsed?.choices?.[0]?.finish_reason;
              if (finishReason) {
                console.log("Stream finish reason:", finishReason);
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError, "Data:", data);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream reading error:", error);
      throw error;
    }

    if (!fullReply) throw new Error("API returned an empty response.");
    return fullReply;
  }

  function saveCurrentSession() {
    currentSession.messages = history;
    currentSession.updatedAt = new Date().toISOString();
    Storage.saveSession(currentSessionId, currentSession);
  }

  function loadSessionMessages() {
    messagesList.innerHTML = "";
    hideSuggestionBar();
    if (history.length === 0) {
      setWelcomeVisibility(true);
    } else {
      setWelcomeVisibility(false);
      history.forEach((msg) => {
        // Skip system messages for display
        if (msg.role !== "system") {
          appendMessage(msg.role, msg.content);
        }
      });
      // Show suggestion bar if last message was from assistant
      if (history.length > 0 && history[history.length - 1].role === "assistant") {
        showSuggestionBar();
      }
    }
    if (chatTitleEl) chatTitleEl.textContent = currentSession.title;
    updateModeButtonState();
  }

  function switchToSession(sessionId) {
    if (sessionId === currentSessionId) return;
    
    const session = Storage.getSession(sessionId);
    if (!session) return;

    currentSessionId = sessionId;
    currentSession = session;
    Storage.setCurrentSessionId(sessionId);
    
    history.length = 0;
    history.push(...currentSession.messages);
    
    applyModeTheme(session.mode || "physics");
    loadSessionMessages();
    renderChatHistory();
  }

  function deleteSessionById(sessionId) {
    if (sessionId === currentSessionId) {
      // If deleting current session, switch to another or create new
      const sessions = Storage.getSessions();
      const sessionIds = Object.keys(sessions).filter(id => id !== sessionId);
      
      if (sessionIds.length > 0) {
        switchToSession(sessionIds[0]);
      } else {
        const newId = Storage.createSession("New Chat", "physics");
        switchToSession(newId);
      }
    }
    
    Storage.deleteSession(sessionId);
    renderChatHistory();
  }

  function renameSession(sessionId, newTitle) {
    const session = Storage.getSession(sessionId);
    if (!session) return;
    
    session.title = newTitle;
    session.userRenamed = true;
    session.updatedAt = new Date().toISOString();
    Storage.saveSession(sessionId, session);
    
    if (sessionId === currentSessionId) {
      currentSession.title = newTitle;
      if (chatTitleEl) chatTitleEl.textContent = newTitle;
    }
    renderChatHistory();
  }

  // Expose for study pages that may load this script
  window.KorahStorage = Storage;
  window.getStudyItemIcon = getStudyItemIcon;
  window.renderStudyItemsHistory = renderStudyItemsHistory;

  function isPlaceholderTitle(title) {
    if (!title) return true;
    const trimmed = title.trim();
    return trimmed === "New Chat" || trimmed === "Photosynthesis Study Guide";
  }

  async function generateAutoTitleIfNeeded() {
    try {
      const session = currentSession;
      if (!session) return;

      const hasMessages = Array.isArray(history) && history.length > 0;
      if (!hasMessages) return;

      if (session.autoTitleGenerated || session.userRenamed) return;
      if (!isPlaceholderTitle(session.title)) return;

      const firstUserMessage = history.find((m) => m.role === "user");
      const lastAssistantMessage = [...history].reverse().find((m) => m.role === "assistant");

      if (!firstUserMessage) return;

      const parts = [];
      parts.push("You are an assistant that generates short, clear titles for study chats.");
      parts.push("Write a 3–6 word title that a student would use to recognize this conversation later.");
      parts.push("Do not include quotation marks or punctuation at the end. Respond with the title only.");
      parts.push("");
      parts.push("First student message:");
      parts.push(firstUserMessage.content.slice(0, 600));

      if (lastAssistantMessage) {
        parts.push("");
        parts.push("Latest AI reply (optional context):");
        parts.push(lastAssistantMessage.content.slice(0, 600));
      }

      const promptText = parts.join("\n");

      const titleReply = await callChatApi(
        [{ role: "user", content: promptText }],
        null,
        {
          systemPromptOverride:
            "You generate concise, descriptive titles for study conversations in a student homework app.",
        }
      );

      if (!titleReply) return;

      let newTitle = titleReply.split("\n")[0].trim();
      newTitle = newTitle.replace(/^["']+|["']+$/g, "");
      if (!newTitle) return;

      session.title = newTitle;
      session.autoTitleGenerated = true;
      session.updatedAt = new Date().toISOString();
      Storage.saveSession(currentSessionId, session);

      currentSession = session;
      if (chatTitleEl) chatTitleEl.textContent = newTitle;
      renderChatHistory();
    } catch (error) {
      console.error("Failed to auto-generate chat title:", error);
    }
  }

  // ═══ Mode Functions ═══
  const MODE_SYSTEM_PROMPTS = {
    general: `You are Korah, an all-around AI study companion. Your teaching style:
- Provide clear, helpful, and concise explanations on any subject
- Use analogies and examples to simplify complex topics
- Encourage critical thinking and active learning
- Adapt your tone to be supportive and encouraging
- Help with study strategies, time management, and motivation`,

    math: `You are Korah, an expert math tutor. Your teaching style:
- Break down problems into clear, step-by-step solutions
- Show your work at each stage and explain why each step is necessary
- Use examples and visual representations when helpful
- Help students understand concepts, not just memorize formulas
- Encourage problem-solving strategies and mental math techniques
- When showing equations, explain each variable and operation clearly`,

    physics: `You are Korah, an engaging physics tutor. Your teaching style:
- Explain concepts through real-world applications and examples
- Connect abstract theories to tangible phenomena students can observe
- Show how formulas are derived and what each variable represents
- Use analogies to make complex ideas accessible
- Emphasize conceptual understanding before mathematical complexity
- Help visualize forces, motion, energy, and other physical concepts`,

    chemistry: `You are Korah, an enthusiastic chemistry tutor. Your teaching style:
- Explain chemical reactions with clear mechanisms and electron movement
- Help visualize molecular structures and bonding
- Connect microscopic (atomic) behavior to macroscopic observations
- Use everyday examples to illustrate chemical principles
- Emphasize patterns in the periodic table and chemical families
- Show balanced equations and explain stoichiometry clearly`,

    biology: `You are Korah, a knowledgeable biology tutor. Your teaching style:
- Explain life processes from molecular to organism level
- Use clear terminology while defining scientific terms as you go
- Connect structure to function in biological systems
- Help students understand relationships between different biological concepts
- Use diagrams and flow charts mentally when describing processes
- Emphasize the interconnectedness of living systems`,

    history: `You are Korah, a insightful history tutor. Your teaching style:
- Provide context and background for historical events
- Explain cause-and-effect relationships between events
- Present multiple perspectives when discussing historical topics
- Connect past events to present-day implications
- Help students analyze primary sources and evaluate evidence
- Create timelines and show how events relate chronologically`,

    literature: `You are Korah, a thoughtful literature tutor. Your teaching style:
- Guide analysis of themes, symbols, and literary devices
- Discuss character development and motivations
- Explore how context (historical, cultural, biographical) influences texts
- Help identify and interpret figurative language
- Encourage close reading and textual evidence
- Make connections between different literary works and ideas`,
  };

  const FORMAT_INSTRUCTIONS = `
Always format your responses using GitHub-flavored Markdown. Use:
- Markdown headings (##, ###) to structure sections
- Bulleted and numbered lists for steps and key points
- \`code\` and fenced code blocks for formulas or code when helpful
When you include math, write it using LaTeX syntax with inline $...$ and display $$...$$ blocks so it can be rendered with KaTeX.`;

  function getModeConfig(mode) {
    const modes = {
      general: { name: "General", emoji: "✨" },
      math: { name: "Math", emoji: "🧮" },
      physics: { name: "Physics", emoji: "⚛️" },
      chemistry: { name: "Chemistry", emoji: "⚗️" },
      biology: { name: "Biology", emoji: "🧬" },
      history: { name: "History", emoji: "📜" },
      literature: { name: "Literature", emoji: "📚" },
    };
    return modes[mode] || modes.general;
  }

  function getSystemPrompt(mode) {
    const base = MODE_SYSTEM_PROMPTS[mode] || MODE_SYSTEM_PROMPTS.general;
    return `${base}

${FORMAT_INSTRUCTIONS}`.trim();
  }

  function getModeEmoji(mode) {
    return getModeConfig(mode).emoji;
  }

  function applyModeTheme(mode) {
    const themeVars = {
      general: { "--p4": "var(--p-gen)", "--p5": "var(--p-gen)", "--ac": "#c084fc", "--glow": "var(--p-gen-glow)" },
      math: { "--p4": "#3b82f6", "--p5": "#60a5fa", "--ac": "#0ea5e9", "--glow": "rgba(59, 130, 246, 0.35)" },
      physics: { "--p4": "#8b5cf6", "--p5": "#a78bfa", "--ac": "#c084fc", "--glow": "rgba(139, 92, 246, 0.35)" },
      chemistry: { "--p4": "#10b981", "--p5": "#34d399", "--ac": "#14b8a6", "--glow": "rgba(16, 185, 129, 0.35)" },
      biology: { "--p4": "#22c55e", "--p5": "#4ade80", "--ac": "#84cc16", "--glow": "rgba(34, 197, 94, 0.35)" },
      history: { "--p4": "#f59e0b", "--p5": "#fbbf24", "--ac": "#fb923c", "--glow": "rgba(245, 158, 11, 0.35)" },
      literature: { "--p4": "#ec4899", "--p5": "#f472b6", "--ac": "#f9a8d4", "--glow": "rgba(236, 72, 153, 0.35)" },
    };

    const vars = themeVars[mode] || themeVars.general;
    const root = document.documentElement;
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    updateModeUI(mode);
    renderModePills();
  }

  function renderModePills() {
    const container = document.getElementById("mode-pills-container");
    if (!container) return;
    
    const modes = ["general", "math", "physics", "chemistry", "biology", "history", "literature"];
    container.innerHTML = "";
    
    modes.forEach(mode => {
      const config = getModeConfig(mode);
      const pill = document.createElement("button");
      pill.className = `mode-pill t-btn ${currentSession.mode === mode ? "active" : ""}`;
      pill.innerHTML = `<span>${config.emoji}</span><span>${config.name}</span>`;
      
      if (history.length > 0) {
        pill.classList.add("locked");
        pill.title = "Mode locked for this conversation";
      } else {
        pill.addEventListener("click", () => {
          changeMode(mode);
        });
      }
      
      container.appendChild(pill);
    });
    
    // Update the large mode text in welcome screen
    const modeNameLarge = document.getElementById("welcome-mode-name");
    if (modeNameLarge) {
      modeNameLarge.textContent = getModeConfig(currentSession.mode).name;
    }
  }

  function updateModeUI(mode) {
    const config = getModeConfig(mode);
    const modeIcon = document.getElementById("mode-icon");
    const modeName = document.getElementById("mode-name");
    if (modeIcon) modeIcon.textContent = config.emoji;
    if (modeName) modeName.textContent = config.name;
  }

  function changeMode(newMode) {
    // Don't allow mode change if conversation has started
    if (history.length > 0) {
      alert("Cannot change mode once conversation has started. Create a new chat to use a different mode.");
      return;
    }
    
    currentSession.mode = newMode;
    currentSession.updatedAt = new Date().toISOString();
    Storage.saveSession(currentSessionId, currentSession);
    applyModeTheme(newMode);
    renderChatHistory();
  }

  function updateModeButtonState() {
    const modeSelectorBtn = document.getElementById("mode-selector-btn");
    if (!modeSelectorBtn) return;
    
    if (history.length > 0) {
      modeSelectorBtn.style.opacity = "0.6";
      modeSelectorBtn.style.cursor = "not-allowed";
      modeSelectorBtn.title = "Mode locked for this conversation";
    } else {
      modeSelectorBtn.style.opacity = "1";
      modeSelectorBtn.style.cursor = "pointer";
      modeSelectorBtn.title = "Change subject mode";
    }
  }

  function renderChatHistory() {
    if (!chatHistoryContainer) return;
    
    const sessions = Storage.getSessions();
    const sessionIds = Object.keys(sessions).sort((a, b) => {
      return new Date(sessions[b].updatedAt) - new Date(sessions[a].updatedAt);
    });

    chatHistoryContainer.innerHTML = "";

    sessionIds.forEach((sessionId) => {
      const session = sessions[sessionId];
      const btn = document.createElement("button");
      btn.className = `history-item t-btn ${sessionId === currentSessionId ? "active" : ""}`;
      btn.setAttribute("data-session", sessionId);
      
      const icon = document.createElement("span");
      icon.className = "history-icon";
      icon.textContent = getModeEmoji(session.mode);
      
      const text = document.createElement("span");
      text.className = "history-text";
      text.textContent = session.title;
      
      const actions = document.createElement("div");
      actions.className = "history-actions";
      actions.innerHTML = `
        <button class="history-action-btn rename-btn" title="Rename" data-id="${sessionId}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="history-action-btn delete-btn" title="Delete" data-id="${sessionId}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      `;
      
      btn.appendChild(icon);
      btn.appendChild(text);
      btn.appendChild(actions);
      chatHistoryContainer.appendChild(btn);
      
      // Click on item to switch session
      btn.addEventListener("click", (e) => {
        if (e.target.closest(".history-action-btn")) return;
        switchToSession(sessionId);
      });
    });

    // Attach event listeners for rename and delete
    chatHistoryContainer.querySelectorAll(".rename-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sessionId = btn.getAttribute("data-id");
        const session = Storage.getSession(sessionId);
        if (!session) return;
        
        const newTitle = prompt("Rename chat:", session.title);
        if (newTitle && newTitle.trim()) {
          renameSession(sessionId, newTitle.trim());
        }
      });
    });

    chatHistoryContainer.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sessionId = btn.getAttribute("data-id");
        const session = Storage.getSession(sessionId);
        if (!session) return;
        
        if (confirm(`Delete "${session.title}"?`)) {
          deleteSessionById(sessionId);
        }
      });
    });
  }

  async function sendMessage(prefillText) {
    if (isSending) return;
    const raw = typeof prefillText === "string" ? prefillText : input.value;
    const text = raw.trim();
    if (!text) return;

    if (text.length > MAX_CHARS) {
      appendMessage("assistant", `Please keep messages under ${MAX_CHARS} characters.`, true);
      return;
    }

    appendMessage("user", text);
    history.push({ role: "user", content: text });
    saveCurrentSession();
    hideSuggestionBar();

    input.value = "";
    resizeInput();
    updateCharCount();
    setSendingState(true);
    setTyping(true);

    // Create streaming message container
    const streamingContentId = `streaming-content-${Date.now()}`;
    const streamingRow = appendMessage("assistant", "", false, [], streamingContentId);
    const contentElement = document.getElementById(streamingContentId);
    setTyping(false);

    try {
      const reply = await callChatApi(history, (chunk, fullText) => {
        if (contentElement) {
          renderMarkdownAndMath(contentElement, fullText);
          scrollToBottom();
        }
      });
      
      history.push({ role: "assistant", content: reply });
      
      // Generate contextual suggestions and add them to the existing message
      const contextualSuggestions = generateContextualSuggestions(reply);
      if (contextualSuggestions.length > 0 && streamingRow) {
        const bubble = streamingRow.querySelector(".msg-bubble");
        if (bubble) {
          const suggestionsDiv = document.createElement("div");
          suggestionsDiv.className = "inline-suggestions";
          
          contextualSuggestions.forEach((suggestion) => {
            const btn = document.createElement("button");
            btn.className = "inline-suggestion-btn t-btn";
            btn.textContent = suggestion;
            btn.addEventListener("click", () => {
              sendMessage(suggestion);
            });
            suggestionsDiv.appendChild(btn);
          });
          
          bubble.appendChild(suggestionsDiv);
        }
      }
      
      saveCurrentSession();
      await generateAutoTitleIfNeeded();
      updateModeButtonState();
      showSuggestionBar();
    } catch (error) {
      console.error("Chat request failed:", error);
      
      // Remove streaming message and show error
      if (streamingRow) {
        streamingRow.remove();
      }
      
      appendMessage(
        "assistant",
        `I couldn't reach the chat API. ${error.message}`,
        true
      );
    } finally {
      setSendingState(false);
      input.focus();
    }
  }

  function resetChat() {
    history.length = 0;
    messagesList.innerHTML = "";
    input.value = "";
    resizeInput();
    updateCharCount();
    setWelcomeVisibility(true);
    setTyping(false);
    hideSuggestionBar();
    saveCurrentSession();
  }

  sendBtn.addEventListener("click", () => sendMessage());

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  });

  input.addEventListener("input", () => {
    if (input.value.length > MAX_CHARS) {
      input.value = input.value.slice(0, MAX_CHARS);
    }
    resizeInput();
    updateCharCount();
  });

  suggestionChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt") || chip.textContent || "";
      sendMessage(prompt);
    });
  });

  quickPromptButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (!prompt) return;
      input.value = prompt;
      resizeInput();
      updateCharCount();
      input.focus();
    });
  });

  if (clearChatBtn) clearChatBtn.addEventListener("click", resetChat);
  if (newChatBtn) {
    newChatBtn.addEventListener("click", () => {
      const newId = Storage.createSession("New Chat", currentSession.mode);
      currentSessionId = newId;
      currentSession = Storage.getSession(newId);
      Storage.setCurrentSessionId(newId);
      history.length = 0;
      history.push(...currentSession.messages);
      loadSessionMessages();
      renderChatHistory();
    });
  }

  // Sidebar toggle functionality
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
    });
  }

  // Settings modal functionality
  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const settingsClose = document.getElementById("settings-close");
  const settingsSaveBtn = document.getElementById("settings-save-btn");
  const exportChatsBtn = document.getElementById("export-chats-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");

  function openSettings() {
    const settings = Storage.getSettings();
    document.getElementById("setting-default-mode").value = settings.defaultMode;
    document.getElementById("setting-detail-level").value = settings.detailLevel;
    document.getElementById("setting-auto-followup").checked = settings.autoFollowUp;
    document.getElementById("setting-timer-default").value = settings.focusTimerDefault;
    settingsModal.classList.add("show");
  }

  function closeSettings() {
    settingsModal.classList.remove("show");
  }

  function saveSettings() {
    const settings = {
      defaultMode: document.getElementById("setting-default-mode").value,
      detailLevel: document.getElementById("setting-detail-level").value,
      autoFollowUp: document.getElementById("setting-auto-followup").checked,
      focusTimerDefault: parseInt(document.getElementById("setting-timer-default").value),
    };
    Storage.saveSettings(settings);
    alert("Settings saved successfully!");
    closeSettings();
  }

  function exportChats() {
    const sessions = Storage.getSessions();
    const dataStr = JSON.stringify(sessions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `korah-chats-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    alert("Chats exported successfully!");
  }

  function clearAllData() {
    if (confirm("Are you sure you want to clear ALL data? This cannot be undone!")) {
      if (confirm("This will delete all your chat history and settings. Are you ABSOLUTELY sure?")) {
        localStorage.clear();
        alert("All data cleared. The page will now reload.");
        window.location.reload();
      }
    }
  }

  if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
  if (settingsClose) settingsClose.addEventListener("click", closeSettings);
  if (settingsSaveBtn) settingsSaveBtn.addEventListener("click", saveSettings);
  if (exportChatsBtn) exportChatsBtn.addEventListener("click", exportChats);
  if (clearAllBtn) clearAllBtn.addEventListener("click", clearAllData);

  // Close modal when clicking outside
  if (settingsModal) {
    settingsModal.addEventListener("click", (e) => {
      if (e.target === settingsModal) {
        closeSettings();
      }
    });
  }

  // Mode selector functionality
  const modeSelectorBtn = document.getElementById("mode-selector-btn");
  const modeDropdown = document.getElementById("mode-dropdown");
  
  if (modeSelectorBtn && modeDropdown) {
    modeSelectorBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      modeDropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      modeDropdown.classList.remove("show");
    });

    modeDropdown.querySelectorAll(".mode-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        e.stopPropagation();
        const mode = option.getAttribute("data-mode");
        if (mode) {
          changeMode(mode);
          modeDropdown.classList.remove("show");
        }
      });
    });
  }

  // Load saved messages, apply theme, and render history on startup
  applyModeTheme(currentSession.mode || "general");
  renderChatHistory();
  renderStudyItemsHistory();
  loadSessionMessages();
  resizeInput();
  updateCharCount();

  // Deep link: open specific session from hash (e.g. index.html#session_123)
  const hash = window.location.hash.slice(1);
  if (hash && hash.startsWith("session_")) {
    const session = Storage.getSession(hash);
    if (session) switchToSession(hash);
  }

  function stringifyStudyItem(item) {
    if (!item || !item.content) return "";
    let text = `STUDY ITEM CONTEXT:\nType: ${item.type}\nTitle: ${item.title || "Untitled"}\nDescription: ${item.description || ""}\n\nCONTENT:\n`;
    const content = item.content;

    if (item.type === "flashcards" && Array.isArray(content.cards)) {
      content.cards.forEach((c, i) => {
        text += `Card ${i + 1}:\nQ: ${c.front}\nA: ${c.back}\n\n`;
      });
    } else if (item.type === "studyGuide") {
      text += content.markdown || "";
      if (!content.markdown && Array.isArray(content.sections)) {
        content.sections.forEach(s => {
          text += `## ${s.title}\n${s.body}\n\n`;
        });
      }
    } else if (item.type === "practiceTest" && Array.isArray(content.questions)) {
      content.questions.forEach((q, i) => {
        text += `Question ${i + 1}: ${q.text}\nAnswer: ${q.answer}\n\n`;
      });
    }
    return text;
  }

  // Study Link: open from ?study=ID
  const params = new URLSearchParams(window.location.search);
  const studyId = params.get("study");
  if (studyId) {
    const items = Storage.getStudyItems();
    const item = items[studyId];
    if (item) {
      const sessions = Storage.getSessions();
      let existingSessionId = Object.keys(sessions).find(id => sessions[id].studyId === studyId);
      
      if (existingSessionId) {
        switchToSession(existingSessionId);
      } else {
        const title = (item.title || "Study Item") + " Discussion";
        const newSessionId = Storage.createSession(title, item.subject || "general");
        const newSession = Storage.getSession(newSessionId);
        newSession.studyId = studyId;
        
        // Add the study item content as context in the history
        // We use a "system" role message in history if the API supports it, 
        // or a formatted user message that we mark as 'context'.
        newSession.messages.push({
          role: "system",
          content: stringifyStudyItem(item)
        });

        let initialMessage = `I've loaded your **${item.type}** on "**${item.title}**" and have full context of the content. 

How would you like to continue? I can:
- **Quiz you** on specific sections
- **Explain complex concepts** in more detail
- **Summarize key points** for quick review
- **Add more content** to this topic

What's on your mind?`;
        
        newSession.messages.push({
          role: "assistant",
          content: initialMessage
        });
        
        Storage.saveSession(newSessionId, newSession);
        switchToSession(newSessionId);
      }
    }
  }
})();
