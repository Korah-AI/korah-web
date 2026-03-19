(() => {
  const MAX_CHARS = 10000;
  const API_ENDPOINT = "/api/gem-proxy";
  const MODEL = "gemini-2.5-flash";

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
  const modeSelectorBtnMini = document.getElementById("mode-selector-btn-mini");
  const modeNameMini = document.getElementById("mode-name-mini");

  // Re-attach event listeners for the new structure
  if (toolsTrigger && toolsMenu) {
    toolsTrigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toolsMenu.classList.toggle("show");
    });
    
    document.addEventListener("click", (e) => {
      if (!toolsMenu.contains(e.target) && e.target !== toolsTrigger) {
        toolsMenu.classList.remove("show");
      }
    });
  }

  if (modeSelectorBtnMini) {
    modeSelectorBtnMini.addEventListener("click", () => {
      document.getElementById("mode-selector-btn")?.click();
    });
  }

  // ═══ In-Memory State ═══
  // These are kept in sync by Firestore realtime listeners set up in initApp().
  let sessionsCache   = {}; // { [id]: conversationDoc }
  let studyItemsCache = {}; // { [id]: studyItemDoc }

  // ═══ Document Attachment State ═══
  // Each entry: { file, name, size, type: 'image'|'text'|'other', dataUrl, content }
  let attachedFiles = [];

  function getFileIcon(fileType, fileName) {
    if (fileType === 'image') return '🖼️';
    const ext = (fileName || '').split('.').pop().toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc','docx'].includes(ext)) return '📝';
    if (['txt','md'].includes(ext)) return '📄';
    return '📎';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  }

  function processFile(file) {
    return new Promise((resolve) => {
      const isImage = file.type.startsWith('image/');
      const isText = file.type === 'text/plain' || ['txt','md','csv'].includes(file.name.split('.').pop().toLowerCase());
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const reader = new FileReader();
      if (isImage || isPDF) {
        reader.onload = () => resolve({ 
          file, 
          name: file.name, 
          size: file.size, 
          type: isImage ? 'image' : 'pdf', 
          dataUrl: reader.result, 
          content: null 
        });
        reader.readAsDataURL(file);
      } else if (isText) {
        reader.onload = () => resolve({ file, name: file.name, size: file.size, type: 'text', dataUrl: null, content: reader.result });
        reader.readAsText(file);
      } else {
        resolve({ file, name: file.name, size: file.size, type: 'other', dataUrl: null, content: null });
      }
    });
  }

  async function handleNewFiles(fileList) {
    const MAX_FILES = 5;
    const remaining = MAX_FILES - attachedFiles.length;
    const toProcess = Array.from(fileList).slice(0, Math.max(0, remaining));
    for (const file of toProcess) {
      const processed = await processFile(file);
      attachedFiles.push(processed);
    }
    renderDocPanel();
    renderInputFilesBar();
  }

  function removeAttachedFile(index) {
    attachedFiles.splice(index, 1);
    renderDocPanel();
    renderInputFilesBar();
    if (attachedFiles.length === 0) {
      const docPanel = document.getElementById('doc-panel');
      if (docPanel) docPanel.classList.remove('show');
    }
  }

  function clearAttachedFiles() {
    attachedFiles = [];
    const docPanel = document.getElementById('doc-panel');
    if (docPanel) docPanel.classList.remove('show');
    renderDocPanel();
    renderInputFilesBar();
  }

  function renderDocPanel() {
    const panel = document.getElementById('doc-panel');
    const list = document.getElementById('doc-panel-list');
    if (!panel || !list) return;
    if (attachedFiles.length === 0) {
      panel.classList.remove('show');
      return;
    }
    panel.classList.add('show');
    list.innerHTML = '';
    attachedFiles.forEach((f, i) => {
      const card = document.createElement('div');
      card.className = 'doc-card';
      let previewHtml = '';
      if (f.type === 'image' && f.dataUrl) {
        previewHtml = `<div class="doc-card-preview"><img src="${f.dataUrl}" alt="${f.name}"/></div>`;
      } else if (f.type === 'text' && f.content) {
        const escaped = f.content.slice(0, 400).replace(/</g,'&lt;').replace(/>/g,'&gt;');
        previewHtml = `<div class="doc-card-preview"><div class="doc-text-preview">${escaped}</div></div>`;
      } else {
        const icon = getFileIcon(f.type, f.name);
        const ext = f.name.split('.').pop().toUpperCase();
        previewHtml = `<div class="doc-card-preview"><div class="doc-icon-preview">${icon}<span>${ext}</span></div></div>`;
      }
      card.innerHTML = `
        ${previewHtml}
        <div class="doc-card-info">
          <span class="doc-card-name" title="${f.name}">${f.name}</span>
          <span class="doc-card-size">${formatFileSize(f.size)}</span>
          <button class="doc-card-remove t-btn" title="Remove">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      card.querySelector('.doc-card-remove').addEventListener('click', () => removeAttachedFile(i));
      list.appendChild(card);
    });
  }

  function renderInputFilesBar() {
    const bar = document.getElementById('input-files-bar');
    if (!bar) return;
    if (attachedFiles.length === 0) {
      bar.classList.remove('show');
      bar.innerHTML = '';
      return;
    }
    bar.classList.add('show');
    bar.innerHTML = '';
    attachedFiles.forEach((f, i) => {
      const chip = document.createElement('div');
      chip.className = 'input-file-chip';
      chip.innerHTML = `
        <span>${getFileIcon(f.type, f.name)}</span>
        <span class="input-file-chip-name">${f.name}</span>
        <button class="input-file-chip-remove" title="Remove">×</button>`;
      chip.querySelector('.input-file-chip-remove').addEventListener('click', () => removeAttachedFile(i));
      bar.appendChild(chip);
    });
  }

  // Build API messages array, enriching the last user message with file content
  function buildApiMessages(hist, files) {
    if (!files || files.length === 0) return hist;
    const lastMsg = hist[hist.length - 1];
    if (!lastMsg || lastMsg.role !== 'user') return hist;
    const textParts = [lastMsg.content];
    const multimodalParts = [];
    files.forEach(f => {
      if (f.type === 'text' && f.content) {
        textParts.push(`\n\n--- Content of ${f.name} ---\n${f.content}\n--- End of ${f.name} ---`);
      } else if ((f.type === 'image' || f.type === 'pdf') && f.dataUrl) {
        multimodalParts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
      } else {
        textParts.push(`\n[Attached file: ${f.name}]`);
      }
    });
    const fullText = textParts.join('');
    const content = multimodalParts.length > 0
      ? [{ type: 'text', text: fullText }, ...multimodalParts]
      : fullText;
    return [...hist.slice(0, -1), { role: 'user', content }];
  }

  function setupDocumentAttachment() {
    const attachBtn  = document.getElementById('attach-file-btn');
    const fileInput  = document.getElementById('doc-file-input');
    const panelClose = document.getElementById('doc-panel-close');
    const mainContent = document.getElementById('main-content');
    const dragOverlay = document.getElementById('drag-overlay');

    if (attachBtn && fileInput) {
      attachBtn.addEventListener('click', () => {
        if (toolsMenu) toolsMenu.classList.remove('show');
        fileInput.click();
      });
      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) handleNewFiles(e.target.files);
        e.target.value = '';
      });
    }

    if (panelClose) panelClose.addEventListener('click', clearAttachedFiles);

    // Drag & Drop on main chat area
    if (mainContent) {
      let dragCounter = 0;
      mainContent.addEventListener('dragenter', (e) => {
        if (!e.dataTransfer.types.includes('Files')) return;
        e.preventDefault();
        dragCounter++;
        if (dragOverlay) dragOverlay.classList.add('active');
      });
      mainContent.addEventListener('dragleave', () => {
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          if (dragOverlay) dragOverlay.classList.remove('active');
        }
      });
      mainContent.addEventListener('dragover', (e) => e.preventDefault());
      mainContent.addEventListener('drop', (e) => {
        e.preventDefault();
        dragCounter = 0;
        if (dragOverlay) dragOverlay.classList.remove('active');
        if (e.dataTransfer.files.length) handleNewFiles(e.dataTransfer.files);
      });
    }
  }

  // ═══ Storage Shim ═══
  // Synchronous reads from in-memory cache; async fire-and-forget writes via KorahDB.
  // Maintains the same interface as the old localStorage Storage object so
  // existing call-sites need minimal changes.
  const Storage = {
    SESSIONS_KEY: "korah_sessions",
    CURRENT_SESSION_KEY: "korah_current_session",
    STUDY_ITEMS_KEY: "korah_study_items",
    CACHE_SESSIONS_KEY: "korah_sessions_cache",
    CACHE_STUDY_ITEMS_KEY: "korah_study_items_cache",

    getSessions() { return sessionsCache; },

    getCurrentSessionId() {
      return localStorage.getItem(this.CURRENT_SESSION_KEY) || null;
    },

    setCurrentSessionId(id) {
      localStorage.setItem(this.CURRENT_SESSION_KEY, id);
    },

    getSession(id) { return sessionsCache[id] || null; },

    saveSession(id, session) {
      sessionsCache[id] = session;
      window.KorahDB.setConversation(id, session).catch((e) =>
        console.error("[Korah] setConversation failed:", e)
      );
    },

    deleteSession(id) {
      delete sessionsCache[id];
      window.KorahDB.deleteConversation(id).catch((e) =>
        console.error("[Korah] deleteConversation failed:", e)
      );
    },

    createSession(title = "New Chat", mode = "general") {
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

    getStudyItems() { return studyItemsCache; },

    saveStudyItem(id, item) {
      studyItemsCache[id] = item;
      return window.KorahDB.setStudyItem(id, item).catch((e) =>
        console.error("[Korah] setStudyItem failed:", e)
      );
    },

    getCachedSessions() {
      const data = localStorage.getItem(this.CACHE_SESSIONS_KEY);
      return data ? JSON.parse(data) : {};
    },

    getCachedStudyItems() {
      const data = localStorage.getItem(this.CACHE_STUDY_ITEMS_KEY);
      return data ? JSON.parse(data) : {};
    },
  };

  // ═══ Session State (populated asynchronously in initApp) ═══
  let currentSessionId = null;
  let currentSession   = null;
  let history          = [];
  let isSending        = false;
  let streamingContentId = null;
  let lastSaveTime = 0;
  const SAVE_DEBOUNCE_MS = 500;

  // ═══ Tutoring Mode State ═══
  const TUTORING_PROMPT = `\n\nTUTORING MODE ACTIVE: You are now in tutoring mode. Instead of giving direct answers:\n- Guide students through questions using Socratic questioning\n- Break concepts into smaller, manageable steps\n- Check understanding before proceeding to the next concept\n- Encourage critical thinking by asking follow-up questions\n- Provide hints and scaffolding rather than complete solutions\n- Celebrate progress and provide positive reinforcement\n- If a student asks for the answer, guide them to discover it themselves`;

  let tutoringMode = localStorage.getItem('korah_tutoring_mode') === 'true';

  // ═══ Welcome Screen Features ═══
  const GREETING_PHRASES = [
    "What can I help you study, {name}?",
    "What's on your mind today, {name}?",
    "Ready to dive in, {name}?",
    "Let's crush some studying today, {name}!"
  ];

  const PLACEHOLDER_PHRASES = [
    "Ask Korah a study question...",
    "Explain the quadratic formula step-by-step",
    "Create a study guide for cellular respiration",
    "Make flashcards for photosynthesis",
    "Help me prioritize my study for tomorrow's test",
    "Give me a 10-question practice test on WWII",
    "What are the main causes of the French Revolution?",
    "Analyze the themes in 'The Great Gatsby'",
    "How does DNA replication work?",
    "Explain Newton's Third Law with examples"
  ];

  let placeholderInterval = null;
  let typingTimer = null;

  function typeWelcomeTitle(text) {
    const titleEl = document.querySelector(".welcome-title");
    if (!titleEl) return;
    
    titleEl.textContent = "";
    let i = 0;
    if (typingTimer) clearInterval(typingTimer);
    
    typingTimer = setInterval(() => {
      if (i < text.length) {
        titleEl.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typingTimer);
        typingTimer = null;
      }
    }, 40);
  }

  function rotatePlaceholder() {
    const welcomeInput = document.getElementById("welcome-chat-input");
    if (!welcomeInput) return;

    let phraseIndex = 0;
    if (placeholderInterval) clearInterval(placeholderInterval);

    welcomeInput.placeholder = PLACEHOLDER_PHRASES[0];

    placeholderInterval = setInterval(() => {
      // Only trigger animation if the input is empty AND not focused
      const isVisible = welcomeInput.value === "" && document.activeElement !== welcomeInput;
      
      if (isVisible) {
        welcomeInput.classList.remove("rolling");
        void welcomeInput.offsetWidth; // Force reflow
        welcomeInput.classList.add("rolling");
      }

      // Change text halfway through the 1.2s roll animation (600ms)
      setTimeout(() => {
        phraseIndex = (phraseIndex + 1) % PLACEHOLDER_PHRASES.length;
        welcomeInput.placeholder = PLACEHOLDER_PHRASES[phraseIndex];
      }, 600);
    }, 5000);
  }

  function initWelcomeFeatures() {
    const name = localStorage.getItem('korah_first_name') || 'there';
    const randomGreeting = GREETING_PHRASES[Math.floor(Math.random() * GREETING_PHRASES.length)];
    const titleText = randomGreeting.replace("{name}", name);
    
    typeWelcomeTitle(titleText);
    rotatePlaceholder();
  }

  function updateTutoringModeUI() {
    const toggle = document.getElementById('tutoring-mode-toggle');
    if (toggle) {
      toggle.checked = tutoringMode;
    }
  }

  document.getElementById('tutoring-mode-toggle')?.addEventListener('change', (e) => {
    tutoringMode = e.target.checked;
    localStorage.setItem('korah_tutoring_mode', tutoringMode);
  });

  updateTutoringModeUI();

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
    
    // Toggle welcome screen visibility
    welcomeScreen.classList.toggle("hidden", !show);
    // Explicit display flex/none for existing flex-layout compatibility
    welcomeScreen.style.display = show ? "flex" : "none";
    
    // Toggle bottom input area - only show if NOT in welcome state
    const bottomInput = document.querySelector('.chat-input-area');
    if (bottomInput) {
      bottomInput.classList.toggle("hidden", show);
    }

    // If showing welcome, clear and focus welcome input
    if (show) {
      const welcomeInput = document.getElementById("welcome-chat-input");
      if (welcomeInput) {
        welcomeInput.value = "";
        welcomeInput.focus();
      }
      initWelcomeFeatures();
    } else {
      // Clear intervals when welcome screen is hidden
      if (placeholderInterval) {
        clearInterval(placeholderInterval);
        placeholderInterval = null;
      }
      if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
      }
    }
  }

  // Setup welcome screen input
  function setupWelcomeInput() {
    const welcomeInput = document.getElementById("welcome-chat-input");
    const welcomeSendBtn = document.getElementById("welcome-send-btn");
    const welcomeAttachBtn = document.getElementById("welcome-attach-btn");

    if (welcomeInput) {
      welcomeInput.addEventListener("input", () => {
        welcomeInput.style.height = "auto";
        welcomeInput.style.height = `${welcomeInput.scrollHeight}px`;
      });

      welcomeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          const text = welcomeInput.value.trim();
          if (text) sendMessage(text);
        }
      });
    }

    if (welcomeSendBtn) {
      welcomeSendBtn.addEventListener("click", () => {
        const text = welcomeInput.value.trim();
        if (text) sendMessage(text);
      });
    }

    if (welcomeAttachBtn) {
      welcomeAttachBtn.addEventListener("click", () => {
        document.getElementById("doc-file-input")?.click();
      });
    }
  }

  function setTyping(show) {
    if (!typingIndicator) return;
    typingIndicator.classList.toggle("hidden", !show);
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
            { left: "\\(", right: "\\)", display: false },
          ],
          throwOnError: false,
        });
      } catch (e) {
        console.error("KaTeX render error:", e);
      }
    }
  }



  function renderDesmosGraphs(container) {
    const codeBlocks = container.querySelectorAll('pre code.language-desmos, pre code.lang-desmos');
    for (const block of codeBlocks) {
      const code = block.textContent.trim();
      const pre = block.parentElement;
      try {
        const data = JSON.parse(code);
        const wrapper = document.createElement('div');
        wrapper.className = 'desmos-graph';
        const graphDiv = document.createElement('div');
        graphDiv.style.width = '100%';
        graphDiv.style.height = data.height || '400px';
        graphDiv.style.borderRadius = '8px';
        graphDiv.style.overflow = 'hidden';
        wrapper.appendChild(graphDiv);
        pre.replaceWith(wrapper);
        
        if (window.Desmos) {
          const calculator = Desmos.GraphingCalculator(graphDiv, {
            keypad: false,
            graphpaper: true,
            autosize: true,
            expressions: true,
            settingsMenu: false,
            zoomButtons: true,
            border: false,
            keyboard: false
          });
          
          if (data.expressions && Array.isArray(data.expressions)) {
            data.expressions.forEach((expr, idx) => {
              calculator.setExpression({
                id: expr.id || 'expr_' + idx,
                latex: expr.latex || '',
                color: expr.color,
                lineStyle: expr.lineStyle || 'SOLID',
                pointStyle: expr.pointStyle || 'POINT',
                showLabel: expr.showLabel || false,
                label: expr.label || ''
              });
            });
          }
          
          if (data.viewState) {
            calculator.setState(data.viewState);
          }
          
          if (data.zoom) {
            calculator.setViewport(data.zoom);
          }
        }
      } catch (e) {
        console.error("Desmos render error:", e);
        pre.classList.add('desmos-error');
      }
    }
  }

  function renderSpecialContent(container) {
    renderDesmosGraphs(container);
  }

  function buildMessageRow(role, text, isError = false, suggestions = [], contentId = null, studyItem = null, fileAttachments = null) {
    const row = document.createElement("div");
    row.className = `msg-row ${role === "user" ? "user" : "assistant"}`;

    const avatar = document.createElement("div");
    avatar.className = `msg-avatar ${role === "user" ? "user-av" : "korah-av"}`;
    if (role === "user") {
      avatar.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    } else {
      avatar.innerHTML = `<img src="app/logo.png" alt="K" class="w-10 h-10 object-contain" />`;
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

    // Show file attachment chips for user messages
    if (role === 'user' && fileAttachments && fileAttachments.length > 0) {
      const attachDiv = document.createElement('div');
      attachDiv.className = 'msg-attachments';
      fileAttachments.forEach(f => {
        const chip = document.createElement('span');
        chip.className = 'msg-attachment-chip';
        chip.textContent = `${getFileIcon(f.type, f.name)} ${f.name}`;
        attachDiv.appendChild(chip);
      });
      bubble.appendChild(attachDiv);
    }

    bubble.appendChild(content);

    // Add study item button if present
    if (role === "assistant" && studyItem && studyItem.id) {
      const typeLabels = {
        flashcards: "Flashcards",
        studyGuide: "Study Guide",
        practiceTest: "Practice Test"
      };
      const typeLabel = typeLabels[studyItem.type] || "Study Item";
      const studyPage = studyItem.type === "studyGuide" ? "guide.html" : "item.html";
      const studyBtn = document.createElement("div");
      studyBtn.className = "study-gen-success show";
      studyBtn.innerHTML = `
        <p>Success! Your ${typeLabel.toLowerCase()} are ready.</p>
        <a href="../study/${studyPage}?id=${encodeURIComponent(studyItem.id)}" class="study-gen-btn">
          <span>View ${studyItem.title} ${typeLabel}</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>
      `;
      bubble.appendChild(studyBtn);
    }

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
        { icon: "🌍", label: "Example", prompt: "Give me a real-world example of this concept" },
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

  function appendMessage(role, text, isError = false, suggestions = [], contentId = null, studyItem = null, fileAttachments = null) {
    const row = buildMessageRow(role, text, isError, suggestions, contentId, studyItem, fileAttachments);
    messagesList.appendChild(row);
    setWelcomeVisibility(false);
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
        const ids = [...selectedStudy];
        ids.forEach((id) => delete studyItemsCache[id]);
        clearStudySelection();
        renderStudyItemsHistory();
        window.KorahDB.deleteStudyItems(ids).catch((e) =>
          console.error("[Korah] bulk deleteStudyItems failed:", e)
        );
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
      const studyPage = item.type === "studyGuide" ? "guide.html" : "item.html";
      a.href = `../study/${studyPage}?id=${encodeURIComponent(item.id)}`;
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
          delete studyItemsCache[item.id];
          renderStudyItemsHistory();
          window.KorahDB.deleteStudyItem(item.id).catch((e) =>
            console.error("[Korah] deleteStudyItem failed:", e)
          );
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

  function saveCurrentSessionDebounced() {
    const now = Date.now();
    if (now - lastSaveTime >= SAVE_DEBOUNCE_MS) {
      saveCurrentSession();
      lastSaveTime = now;
    }
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
          const msgRow = appendMessage(msg.role, msg.content, false, [], null, msg.studyItem || null);
          const contentEl = msgRow.querySelector('.assistant-content');
          if (contentEl) {
            renderSpecialContent(contentEl);
          }
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

    math: `
- KaTeX delimiter policy (REQUIRED):
  - Use \\(...\\) for inline math
  - Use $$...$$ for display math on its own line
- Never use $...$, \\[...\\], [ ... ], or bare math like x^2 without delimiters
- Ensure every expression has balanced opening and closing delimiters
- Show your work at each step and explain why each step is necessary in an easy and intuitive way
- Encourage true understanding and bear with the student
- When showing equations, explain each variable and operation clearly
- When showing mathematical relationships, use LaTeX and consider including a Desmos graph for functions.`,

    physics: `You are Korah, an engaging physics tutor. Your teaching style:
- Explain concepts through real-world applications and examples
- Connect abstract theories to tangible phenomena students can observe
- Show how formulas are derived and what each variable represents
- Use analogies to make complex ideas accessible
- Emphasize conceptual understanding before mathematical complexity
- Help visualize forces, motion, energy, and other physical concepts

When showing mathematical relationships, use LaTeX and consider including a Desmos graph for functions.`,

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

    history: `You are Korah, an insightful history tutor. Your teaching style:
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
- KATEX DELIMITER POLICY (REQUIRED):
  - Inline math: \\(...\\)
  - Display math: $$...$$
- NEVER use $...$, \\[...\\], [ ... ], or bare math without delimiters
- Ensure all math delimiters are balanced, and put display math on its own line

INTERACTIVE GRAPHS: When showing mathematical functions or graphs, use the Desmos format:
\`\`\`desmos
{
  "expressions": [
    {"latex": "y=x^2", "color": "#4285F4"},
    {"latex": "y=sin(x)", "color": "#EA4335"}
  ],
  "zoom": {"xmin": -5, "xmax": 5, "ymin": -5, "ymax": 5}
}
\`\`\`

CONCISENESS GUIDELINES:
- Keep explanations focused and avoid unnecessary verbosity
- Use bullet points and short paragraphs to maintain readability
- Break complex concepts into smaller, digestible chunks
- If a concept needs detail, use collapsible sections or separate messages
- Prioritize clarity over length

Always format your responses using GitHub-flavored Markdown. Use:
- Markdown headings (##, ###) to structure sections
- Bulleted and numbered lists for steps and key points
- \`code\` and fenced code blocks for formulas or code when helpful`;

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
    const tutoringInstructions = tutoringMode ? TUTORING_PROMPT : '';
    const concisenessPrompt = `\n\nFOCUS MODE: Keep responses concise and focused. Avoid long, rambling explanations. Use bullet points and short paragraphs to maintain user attention. If a concept requires detailed explanation, break it into digestible chunks rather than a single massive response.`;
    return `${base}
${tutoringInstructions}
${concisenessPrompt}

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
    const modeNameMini = document.getElementById("mode-name-mini");
    if (modeIcon) modeIcon.textContent = config.emoji;
    if (modeName) modeName.textContent = config.name;
    if (modeNameMini) modeNameMini.textContent = config.name + " Mode";
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
      await Storage.saveStudyItem(id, newItem);
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
          const itemPage = type === "studyGuide" ? "guide.html" : "item.html";
          link.href = `../study/${itemPage}?id=${encodeURIComponent(id)}`;
          link.innerHTML = `<span>View ${finalTitle} ${typeLabel}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>`;
        }
        
        // Add to history with study item metadata
        history.push({ 
          role: "assistant", 
          content: `I've generated **${typeLabel}** on "**${finalTitle}**" for you. You can find them in your Study Library.`,
          studyItem: {
            id: id,
            type: type,
            title: finalTitle
          }
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

    // Capture and clear attached files before state changes
    const pendingFiles = [...attachedFiles];
    const hasFiles = pendingFiles.length > 0;
    clearAttachedFiles();

    // NEW: Detect study item request
    const studyReq = detectStudyRequest(text);

    // Display message with file chips; store with file names appended
    appendMessage("user", text, false, [], null, null, hasFiles ? pendingFiles : null);
    const historyContent = hasFiles
      ? `${text}\n\n[Attached files: ${pendingFiles.map(f => f.name).join(', ')}]`
      : text;
    history.push({ role: "user", content: historyContent });
    saveCurrentSession();
    hideSuggestionBar();

    input.value = "";
    const welcomeInput = document.getElementById("welcome-chat-input");
    if (welcomeInput) {
      welcomeInput.value = "";
      welcomeInput.style.height = "auto";
    }
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
    streamingContentId = `streaming-content-${Date.now()}`;
    const streamingRow = appendMessage("assistant", "", false, [], streamingContentId);
    const contentElement = document.getElementById(streamingContentId);
    setTyping(false);

    // Show pulsing "Thinking" indicator while waiting for first content
    let thinkingIndicator = null;
    if (contentElement) {
      thinkingIndicator = document.createElement("div");
      thinkingIndicator.className = "thinking-indicator";
      thinkingIndicator.innerHTML = `
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      `;
      contentElement.appendChild(thinkingIndicator);
    }

    // Add placeholder to history BEFORE streaming starts (for persistence)
    history.push({ role: "assistant", content: "" });
    const historyIndex = history.length - 1;
    saveCurrentSession();

    // Build API messages: strip the empty assistant placeholder, then enrich last user msg with files
    const apiMessages = buildApiMessages(history.slice(0, -1), pendingFiles);

    try {
      let previousLength = 0;
      let cursorElement = null;
      let charBuffer = [];
      let typewriterActive = false;
      let streamFinished = false;

      let currentTypedText = "";
      const typeNextChar = () => {
        if (charBuffer.length === 0) {
          if (streamFinished) {
            typewriterActive = false;
            finalizeMessage();
            return;
          }
          typewriterActive = false;
          return;
        }

        typewriterActive = true;
        // Process up to 2 characters at a time if buffer is large for even more speed
        const charsToType = charBuffer.length > 20 ? 2 : 1;
        for (let i = 0; i < charsToType; i++) {
          if (charBuffer.length > 0) {
            currentTypedText += charBuffer.shift();
          }
        }

        if (contentElement) {
          renderMarkdownAndMath(contentElement, currentTypedText);
          
          // Append cursor after the rendered content
          const cursor = document.createElement('span');
          cursor.className = 'streaming-cursor';
          contentElement.appendChild(cursor);
          
          scrollToBottom();
        }

        // adaptive speed: extremely fast catch-up
        let delay = 5; // Very fast base speed (ms)
        if (charBuffer.length > 50) delay = 0; 
        
        setTimeout(typeNextChar, delay);
      };

      const finalizeMessage = () => {
        if (cursorElement && cursorElement.parentNode) {
          cursorElement.remove();
        }
        if (contentElement) {
          contentElement.innerHTML = '';
          renderMarkdownAndMath(contentElement, reply);
          renderSpecialContent(contentElement);
        }
      };

      let reply = "";
      reply = await callChatApi(apiMessages, (chunk, fullText) => {
        if (thinkingIndicator && fullText.length > 0) {
          thinkingIndicator.remove();
          thinkingIndicator = null;
          if (contentElement) {
            cursorElement = document.createElement('span');
            cursorElement.className = 'streaming-cursor';
            contentElement.appendChild(cursorElement);
          }
        }

        if (contentElement) {
          const delta = fullText.slice(previousLength);
          previousLength = fullText.length;
          
          // Add new characters to the buffer
          charBuffer.push(...delta.split(''));
          
          // Start typewriter if not already running
          if (!typewriterActive) {
            typeNextChar();
          }
        }
      });
      
      streamFinished = true;
      // If typewriter finished before the stream result was returned, finalize now
      if (!typewriterActive && charBuffer.length === 0) {
        finalizeMessage();
      }
      
      // Update the placeholder entry instead of adding a new one
      history[historyIndex] = { role: "assistant", content: reply };
      
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

  // Save session on page unload to preserve any streaming content
  window.addEventListener("beforeunload", () => {
    if (isSending && currentSession) {
      saveCurrentSession();
    }
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

  // Settings modal functionality (placeholder - todo update settings)
  const settingsBtn = document.getElementById("settings-btn");
  const settingsModal = document.getElementById("settings-modal");
  const settingsClose = document.getElementById("settings-close");

  function openSettings() {
    settingsModal.classList.add("show");
  }

  function closeSettings() {
    settingsModal.classList.remove("show");
  }

  if (settingsBtn) settingsBtn.addEventListener("click", openSettings);
  if (settingsClose) settingsClose.addEventListener("click", closeSettings);

  // ═══ Document Attachment Setup ═══
  setupDocumentAttachment();

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

  // ── Helpers ──────────────────────────────────────────────────────────────

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
        content.sections.forEach((s) => {
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

  // ── Cache Sync Functions ────────────────────────────────────────────────────
  // Compare new data from Firestore with cached data, update cache + re-render only if different
  function compareAndUpdate(type, newData) {
    const oldData = type === 'sessions' ? sessionsCache : studyItemsCache;
    const isDifferent = JSON.stringify(oldData) !== JSON.stringify(newData);
    
    if (isDifferent) {
      if (type === 'sessions') {
        sessionsCache = newData;
        localStorage.setItem(Storage.CACHE_SESSIONS_KEY, JSON.stringify(newData));
        renderChatHistory();
      } else {
        studyItemsCache = newData;
        localStorage.setItem(Storage.CACHE_STUDY_ITEMS_KEY, JSON.stringify(newData));
        renderStudyItemsHistory();
      }
    }
  }

  // ── App Initialisation ────────────────────────────────────────────────────
  // Called once window.KorahDB is ready (after Firebase Auth resolves).

  async function initApp() {
    // 1. Load from cache immediately (synchronous, no await)
    const cachedSessions = Storage.getCachedSessions();
    const cachedStudyItems = Storage.getCachedStudyItems();
    
    sessionsCache = Object.keys(cachedSessions).length > 0 ? cachedSessions : {};
    studyItemsCache = Object.keys(cachedStudyItems).length > 0 ? cachedStudyItems : {};

    // 2. Resolve current session
    currentSessionId = Storage.getCurrentSessionId();
    currentSession   = currentSessionId ? sessionsCache[currentSessionId] : null;

    if (!currentSession) {
      currentSessionId = Storage.createSession("New Chat", "general");
      currentSession   = sessionsCache[currentSessionId];
      Storage.setCurrentSessionId(currentSessionId);
    }

    history.length = 0;
    history.push(...(currentSession.messages || []));

    // 3. Render UI immediately with cached data
    applyModeTheme(currentSession.mode || "general");
    renderChatHistory();
    renderStudyItemsHistory();
    loadSessionMessages();
    resizeInput();
    updateCharCount();
    setupWelcomeInput();

    // 4. Deep link: open specific session from hash (e.g. index.html#session_123)
    const hash = window.location.hash.slice(1);
    if (hash && hash.startsWith("session_") && sessionsCache[hash]) {
      switchToSession(hash);
    }

    // 5. Study Link: open from ?study=ID
    const params  = new URLSearchParams(window.location.search);
    const studyId = params.get("study");
    if (studyId) {
      const item = studyItemsCache[studyId];
      if (item) {
        const existingId = Object.keys(sessionsCache).find(
          (id) => sessionsCache[id].studyId === studyId
        );
        if (existingId) {
          switchToSession(existingId);
        } else {
          const title        = (item.title || "Study Item") + " Discussion";
          const newSessionId = Storage.createSession(title, item.subject || "general");
          const newSession   = sessionsCache[newSessionId];
          newSession.studyId = studyId;
          newSession.messages.push({ role: "system", content: stringifyStudyItem(item) });
          newSession.messages.push({
            role: "assistant",
            content: `I've loaded your **${item.type}** on "**${item.title}**" and have full context of the content. \n\nHow would you like to continue? I can:\n- **Quiz you** on specific sections\n- **Explain complex concepts** in more detail\n- **Summarize key points** for quick review\n- **Add more content** to this topic\n\nWhat's on your mind?`,
          });
          Storage.saveSession(newSessionId, newSession);
          switchToSession(newSessionId);
        }
      }
    }

    // 6. Attach Firestore listeners for background sync (errors won't affect UI)
    window.KorahDB.onConversationsChange((docsMap) => {
      compareAndUpdate('sessions', docsMap);
    });

    window.KorahDB.onStudyItemsChange((docsMap) => {
      compareAndUpdate('studyItems', docsMap);
    });
  }

  // Guard against edge-case where korahReady already fired before this script ran.
  if (window._korahReadyFired) {
    initApp();
  } else {
    window.addEventListener("korahReady", initApp, { once: true });
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

  initBackground();
  setupDocumentAttachment();

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
  document.addEventListener('DOMContentLoaded', () => {
    initConstellationField();
  });
} else {
  initConstellationField();
}
