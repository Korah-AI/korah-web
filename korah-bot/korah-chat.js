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
  const quickPromptButtons = document.querySelectorAll("#tool-flashcard, #tool-guide");
  const chatHistoryContainer = document.getElementById("chat-history");
  const chatTitleEl = document.getElementById("chat-title");
  const toolsTrigger = document.getElementById("tools-trigger");
  const toolsMenu = document.getElementById("tools-menu");
  const studyEmptyBanner = document.getElementById("study-empty-banner");
  const studyItemsEmpty = document.getElementById("study-items-empty");

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
    if (role === "user") {
      avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    } else {
      avatar.innerHTML = `<img src="logo.png" alt="K" class="w-10 h-10 object-contain" />`;
    }

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
      { icon: "🃏", label: "Generate Flashcards", prompt: "Create flashcards based on what you just explained" },
      { icon: "🎯", label: "Generate Practice Test", prompt: "Create a practice test based on what you just explained" },
      { icon: "📄", label: "Generate Study Guide", prompt: "Create a study guide based on what you just explained" },
    ];

    const modeSpecific = {
      math: [
        { icon: "✅", label: "Show examples", prompt: "Show me more step-by-step examples" },
      ],
      physics: [
        { icon: "🌍", label: "Real-world Example", prompt: "Give me a real-world example of this concept" },
      ],
      chemistry: [
        { icon: "🧪", label: "Related Reactions", prompt: "What are similar chemical reactions?" },
      ],
      biology: [
        { icon: "🧬", label: "Related concepts", prompt: "What other biological concepts relate to this?" },
      ],
      history: [
        { icon: "📅", label: "Create Timeline", prompt: "Create a timeline of these events" },
      ],
      literature: [
        { icon: "📖", label: "Find themes", prompt: "What are the main themes in this text?" },
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

  const selectedStudy = new Set();

  function updateStudySelectBar() {
    const bar = document.getElementById("study-select-bar");
    const count = document.getElementById("study-select-count");
    const deleteBtn = document.getElementById("study-delete-selected");
    if (!bar) return;
    if (selectedStudy.size > 0) {
      bar.classList.add("show");
      count.textContent = `${selectedStudy.size} selected`;
      deleteBtn.textContent = `Delete (${selectedStudy.size})`;
    } else {
      bar.classList.remove("show");
    }
  }

  function clearStudySelection() {
    selectedStudy.clear();
    const container = document.getElementById("study-items-history");
    if (container) container.querySelectorAll(".history-item.selected").forEach(el => el.classList.remove("selected"));
    updateStudySelectBar();
  }

  document.getElementById("study-select-all")?.addEventListener("click", () => {
    const container = document.getElementById("study-items-history");
    if (!container) return;
    const items = container.querySelectorAll(".history-item");
    const allSelected = selectedStudy.size === items.length;
    clearStudySelection();
    if (!allSelected) {
      items.forEach(item => {
        const id = item.getAttribute("data-study-id");
        if (id) { selectedStudy.add(id); item.classList.add("selected"); }
      });
      updateStudySelectBar();
    }
  });

  document.getElementById("study-delete-selected")?.addEventListener("click", () => {
    if (selectedStudy.size === 0) return;
    showDeleteModal(
      `${selectedStudy.size} study item${selectedStudy.size > 1 ? "s" : ""}`,
      () => {
        const allItems = Storage.getStudyItems();
        selectedStudy.forEach(id => delete allItems[id]);
        localStorage.setItem(Storage.STUDY_ITEMS_KEY, JSON.stringify(allItems));
        clearStudySelection();
        renderStudyItemsHistory();
      }
    );
  });

  function renderStudyItemsHistory() {
    const container = document.getElementById("study-items-history");
    const items = Storage.getStudyItems();
    const itemIds = Object.keys(items);

    // Update Nav Link text if empty
    const navLinks = document.querySelectorAll(".sidebar-nav-link");
    navLinks.forEach(link => {
      if (link.getAttribute("href").indexOf("feed.html") !== -1) {
        if (itemIds.length === 0) {
          link.innerHTML = "📚 Study";
          link.classList.add("nav-empty");
        } else {
          link.innerHTML = "📚 Study";
          link.classList.remove("nav-empty");
        }
      }
    });

    if (!container) return;
    const list = itemIds
      .map((id) => ({ id, ...items[id] }))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 8);
    container.innerHTML = "";
    if (list.length === 0) {
      if (studyItemsEmpty) {
        studyItemsEmpty.classList.remove("hidden");
        container.classList.add("is-empty");
        container.appendChild(studyItemsEmpty);
      }
    } else {
      if (studyItemsEmpty) studyItemsEmpty.classList.add("hidden");
      container.classList.remove("is-empty");
    }
    list.forEach((item) => {
      const a = document.createElement("a");
      a.href = `study/item.html?id=${encodeURIComponent(item.id)}`;
      a.className = "history-item t-btn";
      a.setAttribute("data-study-id", item.id);
      a.style.textDecoration = "none";
      a.style.color = "inherit";

      const checkbox = document.createElement("span");
      checkbox.className = "item-checkbox";

      const icon = document.createElement("span");
      icon.className = "history-icon";
      icon.textContent = getStudyItemIcon(item.type);

      const text = document.createElement("span");
      text.className = "history-text";
      text.textContent = (item.title || "Untitled").slice(0, 28) + ((item.title || "").length > 28 ? "…" : "");

      const actions = document.createElement("div");
      actions.className = "history-actions";
      actions.innerHTML = `
        <button class="history-action-btn rename-study-btn" title="Rename" data-id="${item.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="history-action-btn delete-study-btn" title="Delete" data-id="${item.id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      `;

      a.appendChild(checkbox);
      a.appendChild(icon);
      a.appendChild(text);
      a.appendChild(actions);
      container.appendChild(a);

      // Checkbox / select click
      a.addEventListener("click", (e) => {
        const clickedCheckbox = e.target.closest(".item-checkbox");
        const clickedAction = e.target.closest(".history-action-btn");
        if (clickedAction) return;

        if (selectedStudy.size === 0 && !clickedCheckbox) return; // let link navigate normally

        e.preventDefault();
        if (selectedStudy.has(item.id)) {
          selectedStudy.delete(item.id);
          a.classList.remove("selected");
        } else {
          selectedStudy.add(item.id);
          a.classList.add("selected");
        }
        updateStudySelectBar();
      });

      // Rename
      actions.querySelector(".rename-study-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const allItems = Storage.getStudyItems();
        const studyItem = allItems[item.id];
        if (!studyItem) return;
        showRenameModal(studyItem.title || "", "Enter a new name for this study item:", (newTitle) => {
          studyItem.title = newTitle;
          studyItem.updatedAt = new Date().toISOString();
          Storage.saveStudyItem(item.id, studyItem);
          renderStudyItemsHistory();
        });
      });

      // Delete
      actions.querySelector(".delete-study-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showDeleteModal(item.title || "this item", () => {
          const allItems = Storage.getStudyItems();
          delete allItems[item.id];
          localStorage.setItem(Storage.STUDY_ITEMS_KEY, JSON.stringify(allItems));
          renderStudyItemsHistory();
        });
      });
    });
    const hasItems = Object.keys(items).length > 0;
    if (studyEmptyBanner) {
      studyEmptyBanner.classList.toggle("hidden", hasItems);
    }
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
      let errorMessage = `Oops! There was an error. Please try again. ${response.status}`;
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
              console.error("Oops, there was an error. Please try again:", parseError, "Data:", data);
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
      console.error("Oops! There was an error. Please try again.:", error);
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
    renderWelcomeSuggestions();
  }

  const MODE_SUGGESTIONS = {
    general: [
      { emoji: "🃏", text: "Make flashcards for photosynthesis", prompt: "Generate flashcards for photosynthesis" },
      { emoji: "😰", text: "I have a test tomorrow, help me prioritize", prompt: "I have a test tomorrow and I'm stressed. What should I study first?" },
      { emoji: "📖", text: "Study guide for cellular respiration", prompt: "Create a study guide for Chapter 5 on cellular respiration" },
      { emoji: "🎯", text: "Practice test on World War II", prompt: "Give me a 10-question practice test on World War II" }
    ],
    math: [
      { emoji: "📐", text: "Explain the Quadratic Formula", prompt: "Explain the Quadratic Formula step-by-step and show examples" },
      { emoji: "🧮", text: "Practice Calculus derivatives", prompt: "Give me some practice problems for Calculus derivatives with solutions" },
      { emoji: "🔢", text: "Solve systems of linear equations", prompt: "How do I solve systems of linear equations using substitution?" },
      { emoji: "📝", text: "Trigonometry identities cheat sheet", prompt: "Create a cheat sheet for essential trigonometry identities" }
    ],
    physics: [
      { emoji: "🍎", text: "Newton's Third Law examples", prompt: "Explain Newton's Third Law with real-world examples" },
      { emoji: "⚡", text: "How to calculate kinetic energy?", prompt: "How do I calculate kinetic energy? Show the formula and an example." },
      { emoji: "🔌", text: "Series vs Parallel circuits", prompt: "Explain the difference between series and parallel circuits" },
      { emoji: "🔊", text: "Understand the Doppler effect", prompt: "Help me understand the Doppler effect with a simple analogy" }
    ],
    chemistry: [
      { emoji: "🧪", text: "Electronegativity periodic trends", prompt: "Explain the periodic trends in electronegativity" },
      { emoji: "⚖️", text: "Help me balance an equation", prompt: "Help me balance a chemical equation: show me the steps" },
      { emoji: "⚛️", text: "Ionic vs Covalent bonds", prompt: "What is the difference between ionic and covalent bonds?" },
      { emoji: "🧪", text: "Explain moles in chemistry", prompt: "Explain the concept of moles and Avogadro's number" }
    ],
    biology: [
      { emoji: "🧬", text: "How DNA replication works", prompt: "How does DNA replication work? Break it down into steps." },
      { emoji: "🔬", text: "Explain stages of Mitosis", prompt: "Explain the stages of Mitosis with key features of each" },
      { emoji: "🔋", text: "Role of mitochondria in cells", prompt: "What is the role of mitochondria in a cell? Why is it the powerhouse?" },
      { emoji: "🔄", text: "Summary of the Krebs cycle", prompt: "Create a clear summary of the Krebs cycle steps" }
    ],
    history: [
      { emoji: "🇫🇷", text: "Causes of French Revolution", prompt: "What were the main causes of the French Revolution?" },
      { emoji: "📅", text: "Timeline of the Cold War", prompt: "Give me a timeline of the major events in the Cold War" },
      { emoji: "📜", text: "Significance of Magna Carta", prompt: "Explain the historical significance of the Magna Carta" },
      { emoji: "🎨", text: "Key figures in the Renaissance", prompt: "Who were the most influential figures in the Renaissance and why?" }
    ],
    literature: [
      { emoji: "🍸", text: "Themes in 'The Great Gatsby'", prompt: "What are the main themes in 'The Great Gatsby'?" },
      { emoji: "👁️", text: "Irony in '1984'", prompt: "Explain the use of irony in George Orwell's '1984'" },
      { emoji: "🎭", text: "Analyze Hamlet's character", prompt: "Analyze the character of Hamlet and his internal conflict" },
      { emoji: "✍️", text: "What is a sonnet?", prompt: "What is a sonnet? Explain the structure and give examples." }
    ]
  };

  function renderWelcomeSuggestions() {
    const container = document.getElementById("welcome-suggestions");
    if (!container) return;
    
    const mode = currentSession.mode || "general";
    const suggestions = MODE_SUGGESTIONS[mode] || MODE_SUGGESTIONS.general;
    
    container.innerHTML = "";
    suggestions.forEach(s => {
      const btn = document.createElement("button");
      btn.className = "suggestion-chip t-btn";
      btn.setAttribute("data-prompt", s.prompt);
      btn.innerHTML = `${s.emoji} ${s.text}`;
      btn.addEventListener("click", () => {
        sendMessage(s.prompt);
      });
      container.appendChild(btn);
    });
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

  const selectedChats = new Set();

  function updateChatSelectBar() {
    const bar = document.getElementById("chat-select-bar");
    const count = document.getElementById("chat-select-count");
    const deleteBtn = document.getElementById("chat-delete-selected");
    if (!bar) return;
    if (selectedChats.size > 0) {
      bar.classList.add("show");
      count.textContent = `${selectedChats.size} selected`;
      deleteBtn.textContent = `Delete (${selectedChats.size})`;
    } else {
      bar.classList.remove("show");
    }
  }

  function clearChatSelection() {
    selectedChats.clear();
    chatHistoryContainer.querySelectorAll(".history-item.selected").forEach(el => el.classList.remove("selected"));
    updateChatSelectBar();
  }

  document.getElementById("chat-select-all")?.addEventListener("click", () => {
    const items = chatHistoryContainer.querySelectorAll(".history-item");
    const allSelected = selectedChats.size === items.length;
    clearChatSelection();
    if (!allSelected) {
      items.forEach(item => {
        const id = item.getAttribute("data-session");
        if (id) { selectedChats.add(id); item.classList.add("selected"); }
      });
      updateChatSelectBar();
    }
  });

  document.getElementById("chat-delete-selected")?.addEventListener("click", () => {
    if (selectedChats.size === 0) return;
    showDeleteModal(
      `${selectedChats.size} chat${selectedChats.size > 1 ? "s" : ""}`,
      () => {
        selectedChats.forEach(id => deleteSessionById(id));
        clearChatSelection();
      }
    );
  });

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
      
      const checkbox = document.createElement("span");
      checkbox.className = "item-checkbox";
      btn.appendChild(checkbox);
      btn.appendChild(icon);
      btn.appendChild(text);
      btn.appendChild(actions);
      chatHistoryContainer.appendChild(btn);

      btn.addEventListener("click", (e) => {
        if (e.target.closest(".history-action-btn")) return;
        const clickedCheckbox = e.target.closest(".item-checkbox");
        if (selectedChats.size === 0 && !clickedCheckbox) {
          switchToSession(sessionId);
          return;
        }
        if (selectedChats.has(sessionId)) {
          selectedChats.delete(sessionId);
          btn.classList.remove("selected");
        } else {
          selectedChats.add(sessionId);
          btn.classList.add("selected");
        }
        updateChatSelectBar();
      });
    });

    // Attach event listeners for rename and delete
    chatHistoryContainer.querySelectorAll(".rename-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sessionId = btn.getAttribute("data-id");
        const session = Storage.getSession(sessionId);
        if (!session) return;
        
        showRenameModal(session.title || "", "Enter a new name for this chat:", (newTitle) => {
          renameSession(sessionId, newTitle);
        });
      });
    });

    chatHistoryContainer.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const sessionId = btn.getAttribute("data-id");
        const session = Storage.getSession(sessionId);
        if (!session) return;
        
        showDeleteModal(session.title, () => deleteSessionById(sessionId));
      });
    });
  }

  function clampInt(value, fallback, min, max) {
    const parsed = parseInt(value, 10);
    if (Number.isNaN(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function inferPracticeConfigFromText(text) {
    const lower = (text || "").toLowerCase();
    const totalMatch = lower.match(/(\d+)\s*(?:question|questions|q)\b/);
    const mcqMatch = lower.match(/(\d+)\s*(?:mcq|multiple[-\s]?choice)\b/);
    const openMatch = lower.match(/(\d+)\s*(?:open[-\s]?ended|short\s*answer|free\s*response)\b/);

    let total = totalMatch ? clampInt(totalMatch[1], 10, 1, 50) : null;
    let mcq = mcqMatch ? clampInt(mcqMatch[1], 0, 0, 50) : null;
    let openEnded = openMatch ? clampInt(openMatch[1], 0, 0, 50) : null;

    if (total === null && mcq !== null && openEnded !== null) {
      total = mcq + openEnded;
    }
    if (total === null) total = 10;
    if (mcq === null && openEnded === null) {
      mcq = Math.round(total * 0.6);
      openEnded = total - mcq;
    } else if (mcq === null) {
      mcq = total - openEnded;
    } else if (openEnded === null) {
      openEnded = total - mcq;
    }

    mcq = clampInt(mcq, Math.round(total * 0.6), 0, total);
    openEnded = clampInt(openEnded, total - mcq, 0, total - mcq);
    if (mcq + openEnded !== total) openEnded = total - mcq;

    return { totalQuestions: total, mcqCount: mcq, openEndedCount: openEnded };
  }

  async function handleStudyItemGeneration(type, topic, practiceConfig) {
    const typeLabels = {
      flashcards: "Flashcards",
      studyGuide: "Study Guide",
      practiceTest: "Practice Test"
    };
    const typeEmojis = {
      flashcards: "🃏",
      studyGuide: "📖",
      practiceTest: "🎯"
    };
    const typeLabel = typeLabels[type] || "Study Item";
    const typeEmoji = typeEmojis[type] || "✨";

    // Create message with loading bar
    const msgId = `study-gen-${Date.now()}`;
    const row = appendMessage("assistant", "", false, [], msgId);
    const content = document.getElementById(msgId);
    if (!content) return;

    content.innerHTML = `
      <div class="study-gen-bubble">
        <div class="study-gen-status">
          <span class="animate-pulse">${typeEmoji}</span>
          <span>Generating ${typeLabel}...</span>
        </div>
        <div class="study-gen-progress-container">
          <div class="study-gen-progress-bar loading"></div>
        </div>
        <div class="study-gen-success" id="${msgId}-success">
          <p>Success! Your ${typeLabel.toLowerCase()} are ready.</p>
          <a href="#" class="study-gen-btn" id="${msgId}-link">
            <span>View ${typeLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </a>
        </div>
      </div>
    `;

    try {
      // Use existing context if topic is "this"
      let prompt = topic;
      if (topic.toLowerCase() === "this" || topic.toLowerCase() === "the above") {
        const lastMsgs = history.slice(-5).filter(m => m.role !== "system").map(m => m.content).join("\n\n");
        prompt = `Based on our conversation:\n\n${lastMsgs}`;
      }

      // Call the Study API
      const result = await KorahStudyAPI.generateStudyContent({
        type: type,
        prompt: prompt,
        title: topic === "this" ? currentSession.title : topic,
        subject: currentSession.mode,
        testConfig: type === "practiceTest" ? practiceConfig : undefined
      });

      // Save to localStorage
      const id = `si_${Date.now()}`;
      const rawContent = result && result.content ? result.content : {};
      let normalizedContent = rawContent;
      if (type === "studyGuide") {
        const markdown = (rawContent.markdown || "").trim();
        normalizedContent = { markdown: markdown };
      }
      if (type === "practiceTest") {
        const questions = (rawContent.questions || []).filter((q) => q && (q.text || "").trim()).map((q) => {
          const isMcq = String(q.type || "").toLowerCase() === "mcq" || (Array.isArray(q.options) && q.options.length > 1);
          return {
            type: isMcq ? "mcq" : "openEnded",
            text: (q.text || "").trim(),
            options: isMcq ? (q.options || []).map((opt) => String(opt || "").trim()).filter(Boolean).slice(0, 4) : [],
            answer: (q.answer || "").trim(),
            explanation: (q.explanation || "").trim()
          };
        });
        normalizedContent = {
          questions,
          testConfig: {
            totalQuestions: questions.length,
            mcqCount: questions.filter((q) => q.type === "mcq").length,
            openEndedCount: questions.filter((q) => q.type !== "mcq").length
          }
        };
      }

      const aiGeneratedTitle = rawContent.title;
      const finalTitle = aiGeneratedTitle || (topic === "this" ? currentSession.title : topic) || "Untitled";

      const newItem = {
        id: id,
        type: type,
        title: finalTitle,
        description: `Generated from chat on ${new Date().toLocaleDateString()}`,
        content: normalizedContent,
        source: "chatbot-request",
        subject: currentSession.mode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      Storage.saveStudyItem(id, newItem);
      renderStudyItemsHistory();

      // Update UI to success state
      const progressBar = content.querySelector(".study-gen-progress-bar");
      const statusText = content.querySelector(".study-gen-status span:last-child");
      
      if (statusText) statusText.textContent = `Generated ${typeLabel} on "${finalTitle}"`;
      if (progressBar) {
        progressBar.classList.remove("loading");
        progressBar.style.width = "100%";
      }
      
      setTimeout(() => {
        const successDiv = document.getElementById(`${msgId}-success`);
        const link = document.getElementById(`${msgId}-link`);
        if (successDiv) successDiv.classList.add("show");
        if (link) {
          link.href = `study/item.html?id=${id}`;
          link.innerHTML = `<span>View ${finalTitle} ${typeLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>`;
        }
        
        // Add to history
        history.push({ 
          role: "assistant", 
          content: `I've generated **${typeLabel}** on "**${finalTitle}**" for you. You can find them in your Study Library.` 
        });
        saveCurrentSession();
      }, 500);

    } catch (error) {
      console.error("Study generation failed:", error);
      content.innerHTML = `<div class="tx-mr">Oops! There was an error. Please try again: ${error.message}</div>`;
    }
  }

  function detectStudyRequest(text) {
    const t = text.toLowerCase();
    
    // Types
    let type = null;
    if (t.includes("flashcard")) type = "flashcards";
    else if (t.includes("study guide")) type = "studyGuide";
    else if (t.includes("practice test") || t.includes("quiz")) type = "practiceTest";

    if (!type) return null;

    // Intents
    const intents = ["make", "generate", "create", "give me", "build"];
    const hasIntent = intents.some(i => t.includes(i));
    
    if (!hasIntent && !t.includes("flashcard") && !t.includes("study guide") && !t.includes("practice test")) return null;

    // Extract topic
    let topic = "this";
    const markers = ["on ", "about ", "for ", "regarding "];
    for (const marker of markers) {
      const idx = t.indexOf(marker);
      if (idx !== -1) {
        topic = text.slice(idx + marker.length).trim();
        // Clean up punctuation at end
        topic = topic.replace(/[?\.!]+$/, "");
        break;
      }
    }

    const practiceConfig = type === "practiceTest" ? inferPracticeConfigFromText(text) : null;
    return { type, topic, practiceConfig };
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

    // NEW: Detect study item request
    const studyReq = detectStudyRequest(text);

    appendMessage("user", text);
    history.push({ role: "user", content: text });
    saveCurrentSession();
    hideSuggestionBar();

    input.value = "";
    resizeInput();
    updateCharCount();
    setSendingState(true);

    if (studyReq) {
      await handleStudyItemGeneration(studyReq.type, studyReq.topic, studyReq.practiceConfig);
      setSendingState(false);
      updateModeButtonState();
      showSuggestionBar();
      return;
    }

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

  if (toolsTrigger && toolsMenu) {
    toolsTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toolsMenu.classList.toggle("show");
    });
    document.addEventListener("click", () => {
      toolsMenu.classList.remove("show");
    });
    toolsMenu.addEventListener("click", (e) => e.stopPropagation());
  }

  quickPromptButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const prompt = btn.getAttribute("data-prompt");
      if (!prompt) return;
      if (toolsMenu) toolsMenu.classList.remove("show");
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
      applyModeTheme(currentSession.mode);
      loadSessionMessages();
      renderChatHistory();
    });
  }

  // Sidebar toggle functionality
  const sidebar = document.getElementById("sidebar");
  const sidebarToggle = document.getElementById("sidebar-toggle");

  // Create overlay for mobile
  const overlay = document.createElement("div");
  overlay.className = "sidebar-overlay";
  document.body.appendChild(overlay);

  function isMobile() { return window.innerWidth <= 768; }

  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      if (isMobile()) {
        sidebar.classList.toggle("mobile-open");
        overlay.classList.toggle("show");
      } else {
        sidebar.classList.toggle("collapsed");
      }
    });
  }

  overlay.addEventListener("click", () => {
    sidebar.classList.remove("mobile-open");
    overlay.classList.remove("show");
  });

  // Auto-collapse on resize
  window.addEventListener("resize", () => {
    if (!isMobile()) {
      sidebar.classList.remove("mobile-open");
      overlay.classList.remove("show");
    }
  });

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

  // Delete modal
  const deleteModal = document.getElementById("delete-modal");
  const deleteModalName = document.getElementById("delete-modal-name");
  const deleteModalCancel = document.getElementById("delete-modal-cancel");
  const deleteModalConfirm = document.getElementById("delete-modal-confirm");
  let deleteModalCallback = null;

  function showRenameModal(currentName, desc, onConfirm) {
    const modal = document.getElementById("rename-modal");
    const input = document.getElementById("rename-modal-input");
    const descEl = document.getElementById("rename-modal-desc");
    const confirmBtn = document.getElementById("rename-modal-confirm");
    const cancelBtn = document.getElementById("rename-modal-cancel");
    if (!modal) {
      const n = prompt(desc || "New name:", currentName);
      if (n && n.trim() && onConfirm) onConfirm(n.trim());
      return;
    }
    input.value = currentName || "";
    if (descEl) descEl.textContent = desc || "Enter a new name";
    modal.classList.add("show");
    setTimeout(() => { input.focus(); input.select(); }, 50);
    function cleanup() {
      modal.classList.remove("show");
      confirmBtn.removeEventListener("click", onYes);
      cancelBtn.removeEventListener("click", onNo);
      modal.removeEventListener("click", onOutside);
      input.removeEventListener("keydown", onEnter);
    }
    function onYes() { const v = input.value.trim(); if (v) { cleanup(); if (onConfirm) onConfirm(v); } }
    function onNo() { cleanup(); }
    function onOutside(e) { if (e.target === modal) cleanup(); }
    function onEnter(e) { if (e.key === "Enter") onYes(); if (e.key === "Escape") onNo(); }
    confirmBtn.addEventListener("click", onYes);
    cancelBtn.addEventListener("click", onNo);
    modal.addEventListener("click", onOutside);
    input.addEventListener("keydown", onEnter);
  }

  function showDeleteModal(name, onConfirm) {
    deleteModalName.textContent = name;
    deleteModalCallback = onConfirm;
    deleteModal.classList.add("show");
  }

  function hideDeleteModal() {
    deleteModal.classList.remove("show");
    deleteModalCallback = null;
  }

  deleteModalCancel.addEventListener("click", hideDeleteModal);
  deleteModalConfirm.addEventListener("click", () => {
    if (deleteModalCallback) deleteModalCallback();
    hideDeleteModal();
  });
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) hideDeleteModal();
  });

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

  // ── Starfield Animation ──
  function initBackground() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, stars = [], shootingStars = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initStars();
    }

    class Star {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.5;
        this.opacity = Math.random() * 0.7 + 0.1;
        this.twinkleSpeed = Math.random() * 0.015 + 0.005;
        this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
        
        // Random star colors: white, slight blue, slight yellow
        const colors = ["#ffffff", "#eef2ff", "#fffdf2"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.opacity += this.twinkleSpeed * this.twinkleDir;
        if (this.opacity > 0.9 || this.opacity < 0.1) {
          this.twinkleDir *= -1;
        }
      }
      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.size > 1.1) {
          ctx.shadowBlur = 5;
          ctx.shadowColor = this.color;
        } else {
          ctx.shadowBlur = 0;
        }
      }
    }

    class ShootingStar {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h * 0.4;
        this.len = Math.random() * 80 + 40;
        this.speedX = -(Math.random() * 15 + 10);
        this.speedY = Math.random() * 10 + 5;
        this.opacity = 1;
        this.active = false;
        this.waitTime = Math.random() * 600 + 300;
      }
      update() {
        if (!this.active) {
          this.waitTime--;
          if (this.waitTime <= 0) this.active = true;
          return;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.opacity -= 0.02;
        if (this.opacity <= 0 || this.y > h || this.x < 0) {
          this.reset();
        }
      }
      draw() {
        if (!this.active) return;
        ctx.globalAlpha = this.opacity;
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.speedX * 5, this.y - this.speedY * 5);
        ctx.stroke();
      }
    }

    function initStars() {
      stars = [];
      const starCount = Math.floor((w * h) / 3000); // Dynamic density
      for (let i = 0; i < starCount; i++) stars.push(new Star());
    }

    shootingStars = [];
    for (let i = 0; i < 2; i++) shootingStars.push(new ShootingStar());

    function animate() {
      ctx.clearRect(0, 0, w, h);
      
      stars.forEach(s => { s.update(); s.draw(); });
      shootingStars.forEach(s => { s.update(); s.draw(); });
      requestAnimationFrame(animate);
    }

    window.addEventListener("resize", resize);
    resize();
    animate();
  }

  // ── Typing Effect ──
  function initWelcomeTyping() {
    const title = document.querySelector("#welcome-screen h2");
    const desc = document.querySelector("#welcome-screen p");
    if (!title || !desc) return;

    const titleText = title.textContent;
    const descText = desc.textContent;
    
    title.textContent = "";
    desc.textContent = "";
    desc.style.opacity = "0";

    let i = 0;
    function typeTitle() {
      if (i < titleText.length) {
        title.textContent += titleText.charAt(i);
        i++;
        setTimeout(typeTitle, 50);
      } else {
        setTimeout(typeDesc, 500);
      }
    }

    let j = 0;
    function typeDesc() {
      desc.style.opacity = "1";
      if (j < descText.length) {
        desc.textContent += descText.charAt(j);
        j++;
        setTimeout(typeDesc, 30);
      }
    }

    // Start typing after a short delay
    setTimeout(typeTitle, 600);
  }

  initBackground();
  initWelcomeTyping();

  
})();

function initConstellationField() {
  const field = document.getElementById('constellation-field');
  if (!field) return;
  const DOT_COUNT = 60;
  for (let i = 0; i < DOT_COUNT; i++) {
    const dot = document.createElement('div');
    dot.className = 'c-dot';
    const size = 2 + Math.random() * 3;
    const x = Math.random() * 100;
    const y = Math.random() * 100;
    const dur = 8 + Math.random() * 16;
    const dx1 = (Math.random() - 0.5) * 80;
    const dy1 = (Math.random() - 0.5) * 80;
    const dx2 = (Math.random() - 0.5) * 80;
    const dy2 = (Math.random() - 0.5) * 80;
    dot.style.cssText = `
      width:${size}px; height:${size}px;
      left:${x}vw; top:${y}vh;
      animation-duration:${dur}s;
      animation-delay:-${Math.random()*dur}s;
      --dx1:${dx1}px; --dy1:${dy1}px;
      --dx2:${dx2}px; --dy2:${dy2}px;
      opacity:${0.3 + Math.random() * 0.5};
    `;
    field.appendChild(dot);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initConstellationField);
} else {
  initConstellationField();
}
