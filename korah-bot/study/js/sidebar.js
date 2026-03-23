/**
 * Shared sidebar logic for study pages: Recent Chats + Recent Study Items
 * Reads from Firestore via window.KorahDB (set up by study-firebase-init.js);
 * falls back to empty caches if KorahDB is unavailable.
 */

// Use custom modals if available, otherwise fallback to browser dialogs
function showSidebarRenameModal(currentName, desc, onConfirm) {
  if (window.showRenameModal) {
    window.showRenameModal(currentName, desc, onConfirm);
  } else {
    const n = prompt(desc || "New name:", currentName);
    if (n && n.trim() && onConfirm) onConfirm(n.trim());
  }
}

function showSidebarDeleteModal(name, onConfirm) {
  if (window.showDeleteModal) {
    window.showDeleteModal(name, onConfirm);
  } else {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      if (onConfirm) onConfirm();
    }
  }
}

(function () {
  // ─── In-memory caches (populated by Firestore listeners once korahReady fires) ─
  let _sessionsCache   = {};
  let _studyItemsCache = {};

  function getSessions()   { return _sessionsCache; }
  function getStudyItems() { return _studyItemsCache; }

  const MODE_EMOJI = {
    general: "✨", math: "🧮", physics: "⚛️",
    chemistry: "⚗️", biology: "🧬", history: "📜", literature: "📚",
  };
  function getModeEmoji(mode) { return MODE_EMOJI[mode] || "📚"; }

  const TYPE_EMOJI = { flashcards: "🃏", studyGuide: "📖", practiceTest: "🎯" };
  function getTypeEmoji(type) { return TYPE_EMOJI[type] || "📄"; }

  // ── Render Chat History ──
  function renderChatHistory(container, baseUrl) {
    if (!container) return;
    const sessions = getSessions();
    const ids = Object.keys(sessions).sort(
      (a, b) => new Date(sessions[b].updatedAt) - new Date(sessions[a].updatedAt)
    );
    container.innerHTML = "";
    ids.slice(0, 8).forEach((id) => {
      const s = sessions[id];
      const a = document.createElement("a");
      a.href = baseUrl + "#" + id;
      a.className = "history-item t-btn";
      a.setAttribute("data-session", id);
      a.setAttribute("title", s.title || "New Chat");
      a.style.textDecoration = "none";
      a.style.color = "inherit";

      const checkbox = document.createElement("span");
      checkbox.className = "item-checkbox";

      const icon = document.createElement("span");
      icon.className = "history-icon";
      icon.textContent = getModeEmoji(s.mode);

      const text = document.createElement("span");
      text.className = "history-text";
      text.textContent = (s.title || "New Chat").slice(0, 28) + ((s.title || "").length > 28 ? "…" : "");

      const actions = document.createElement("div");
      actions.className = "history-actions";
      actions.innerHTML = `
        <button class="history-action-btn rename-btn" title="Rename" data-id="${id}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="history-action-btn delete-btn" title="Delete" data-id="${id}">
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

      actions.querySelector(".rename-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const all = getSessions();
        const session = all[id];
        if (!session) return;
        showSidebarRenameModal(session.title || "", "Enter a new name for this chat:", (newTitle) => {
          session.title = newTitle;
          session.updatedAt = new Date().toISOString();
          _sessionsCache[id] = session;
          if (window.KorahDB) window.KorahDB.setConversation(id, session);
          renderChatHistory(container, baseUrl);
        });
      });

      actions.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showSidebarDeleteModal(s.title || "this chat", () => {
          delete _sessionsCache[id];
          if (window.KorahDB) window.KorahDB.deleteConversation(id);
          renderChatHistory(container, baseUrl);
        });
      });
    });
  }

  // ── Render Study Items History ──
  function renderStudyItemsHistory(container, itemPageUrl) {
    const items = getStudyItems();
    const itemIds = Object.keys(items);

    const navLinks = document.querySelectorAll(".sidebar-nav-link");
    navLinks.forEach(link => {
      if (link.getAttribute("href").indexOf("feed.html") !== -1) {
        link.innerHTML = "<span class='nav-icon'>📚</span> <span class='nav-text'>Study</span>";
        if (itemIds.length === 0) link.classList.add("nav-empty");
        else link.classList.remove("nav-empty");
      } else if (link.getAttribute("href").indexOf("index.html") !== -1) {
        link.innerHTML = "<span class='nav-icon'>💬</span> <span class='nav-text'>Chat</span>";
      }
    });

    if (!container) return;
    const emptyEl = document.getElementById("study-items-empty");
    const list = itemIds
      .map((id) => ({ id, ...items[id] }))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 8);
    container.innerHTML = "";
    if (list.length === 0) {
      if (emptyEl) {
        emptyEl.classList.remove("hidden");
        container.classList.add("is-empty");
        container.appendChild(emptyEl);
      }
    } else {
      if (emptyEl) emptyEl.classList.add("hidden");
      container.classList.remove("is-empty");
    }
    list.forEach((item) => {
      const a = document.createElement("a");
      const baseUrl = item.type === "studyGuide" ? "guide.html" : (itemPageUrl || "item.html");
      a.href = baseUrl + "?id=" + encodeURIComponent(item.id);
      a.className = "history-item t-btn";
      a.setAttribute("data-study-id", item.id);
      a.setAttribute("title", item.title || "Untitled");
      a.style.textDecoration = "none";
      a.style.color = "inherit";

      const checkbox = document.createElement("span");
      checkbox.className = "item-checkbox";

      const icon = document.createElement("span");
      icon.className = "history-icon";
      icon.textContent = getTypeEmoji(item.type);

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

      actions.querySelector(".rename-study-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const all = getStudyItems();
        const si = all[item.id];
        if (!si) return;
        showSidebarRenameModal(si.title || "", "Enter a new name for this study item:", (newTitle) => {
          si.title = newTitle;
          si.updatedAt = new Date().toISOString();
          _studyItemsCache[item.id] = si;
          if (window.KorahDB) window.KorahDB.setStudyItem(item.id, si);
          renderStudyItemsHistory(container, itemPageUrl);
        });
      });

      actions.querySelector(".delete-study-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showSidebarDeleteModal(item.title || "this item", () => {
          delete _studyItemsCache[item.id];
          if (window.KorahDB) window.KorahDB.deleteStudyItem(item.id);
          renderStudyItemsHistory(container, itemPageUrl);
        });
      });
    });
    if (emptyEl) emptyEl.classList.toggle("hidden", Object.keys(items).length > 0);
  }

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
      constructor() { this.reset(); }
      reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.5;
        this.opacity = Math.random() * 0.7 + 0.1;
        this.twinkleSpeed = Math.random() * 0.015 + 0.005;
        this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
        const colors = ["#ffffff", "#eef2ff", "#fffdf2"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
      }
      update() {
        this.opacity += this.twinkleSpeed * this.twinkleDir;
        if (this.opacity > 0.9 || this.opacity < 0.1) this.twinkleDir *= -1;
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
        } else ctx.shadowBlur = 0;
      }
    }

    class ShootingStar {
      constructor() { this.reset(); }
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
        if (this.opacity <= 0 || this.y > h || this.x < 0) this.reset();
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
      const starCount = Math.floor((w * h) / 3000);
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

  function updateActiveItem(id) {
    const container = document.getElementById("chat-history");
    if (!container) return;
    container.querySelectorAll(".history-item").forEach(item => {
      if (item.getAttribute("data-session") === id) item.classList.add("active");
      else item.classList.remove("active");
    });
  }



  // ── Multi-select Logic ──
  function initChatMultiSelect(container, baseUrl, onItemClick) {
    const bar = document.getElementById("chat-select-bar");
    const countEl = document.getElementById("chat-select-count");
    const deleteBtn = document.getElementById("chat-delete-selected");
    const selectAllBtn = document.getElementById("chat-select-all");
    if (!container || !bar) return;

    const selected = new Set();
    const updateBar = () => {
      if (selected.size > 0) {
        bar.classList.add("show");
        countEl.textContent = `${selected.size} selected`;
        deleteBtn.textContent = `Delete (${selected.size})`;
      } else bar.classList.remove("show");
    };

    container.addEventListener("click", (e) => {
      const item = e.target.closest(".history-item");
      if (!item || e.target.closest(".history-action-btn")) return;
      const id = item.getAttribute("data-session");
      if (!id) return;
      const clickedCheckbox = e.target.closest(".item-checkbox");
      if (selected.size === 0 && !clickedCheckbox) {
        if (onItemClick) {
          e.preventDefault();
          onItemClick(id);
          updateActiveItem(id);
        }
        return;
      }
      e.preventDefault();
      if (selected.has(id)) {
        selected.delete(id);
        item.classList.remove("selected");
      } else {
        selected.add(id);
        item.classList.add("selected");
      }
      updateBar();
    });

    selectAllBtn?.addEventListener("click", () => {
      const items = container.querySelectorAll(".history-item");
      const all = selected.size === items.length;
      selected.clear();
      items.forEach(el => el.classList.remove("selected"));
      if (!all) {
        items.forEach(item => {
          const id = item.getAttribute("data-session");
          if (id) { selected.add(id); item.classList.add("selected"); }
        });
      }
      updateBar();
    });

    deleteBtn?.addEventListener("click", () => {
      if (selected.size === 0) return;
      showSidebarDeleteModal(`${selected.size} chat${selected.size > 1 ? "s" : ""}`, () => {
        const ids = [...selected];
        ids.forEach(id => delete _sessionsCache[id]);
        if (window.KorahDB) window.KorahDB.deleteConversations(ids);
        selected.clear();
        container.querySelectorAll(".history-item.selected").forEach(el => el.classList.remove("selected"));
        updateBar();
        renderChatHistory(container, baseUrl);
      });
    });
  }

  function initStudyMultiSelect(container, itemPageUrl) {
    const bar = document.getElementById("study-select-bar");
    const countEl = document.getElementById("study-select-count");
    const deleteBtn = document.getElementById("study-delete-selected");
    const selectAllBtn = document.getElementById("study-select-all");
    if (!container || !bar) return;

    const selected = new Set();
    const updateBar = () => {
      if (selected.size > 0) {
        bar.classList.add("show");
        countEl.textContent = `${selected.size} selected`;
        deleteBtn.textContent = `Delete (${selected.size})`;
      } else bar.classList.remove("show");
    };

    const attachListeners = () => {
      container.querySelectorAll(".history-item").forEach(item => {
        if (item._multiSelectBound) return;
        item._multiSelectBound = true;
        item.addEventListener("click", (e) => {
          if (e.target.closest(".history-action-btn")) return;
          const id = item.getAttribute("data-study-id");
          if (!id) return;
          const clickedCheckbox = e.target.closest(".item-checkbox");
          if (selected.size === 0 && !clickedCheckbox) return;
          e.preventDefault();
          if (selected.has(id)) {
            selected.delete(id);
            item.classList.remove("selected");
          } else {
            selected.add(id);
            item.classList.add("selected");
          }
          updateBar();
        });
      });
    };

    new MutationObserver(attachListeners).observe(container, { childList: true });
    attachListeners();

    selectAllBtn?.addEventListener("click", () => {
      const items = container.querySelectorAll(".history-item");
      const all = selected.size === items.length;
      selected.clear();
      items.forEach(el => el.classList.remove("selected"));
      if (!all) {
        items.forEach(item => {
          const id = item.getAttribute("data-study-id");
          if (id) { selected.add(id); item.classList.add("selected"); }
        });
      }
      updateBar();
    });

    deleteBtn?.addEventListener("click", () => {
      if (selected.size === 0) return;
      showSidebarDeleteModal(`${selected.size} study item${selected.size > 1 ? "s" : ""}`, () => {
        const ids = [...selected];
        ids.forEach(id => delete _studyItemsCache[id]);
        if (window.KorahDB) window.KorahDB.deleteStudyItems(ids);
        selected.clear();
        container.querySelectorAll(".history-item.selected").forEach(el => el.classList.remove("selected"));
        updateBar();
        renderStudyItemsHistory(container, itemPageUrl);
      });
    });
  }

  // ── Timer Widget ──
  let _timerWidgetInitialized = false;
  let _timerUnsubscribe = null;

  function initTimerWidget() {
    if (_timerWidgetInitialized) return;
    _timerWidgetInitialized = true;

    // Wait for KorahTimer to be available
    const initCheck = setInterval(() => {
      if (window.KorahTimer) {
        clearInterval(initCheck);
        setupTimerWidget();
      }
    }, 100);
  }

  function setupTimerWidget() {
    const productivityLink = document.querySelector('.productivity-link');
    if (!productivityLink) return;

    // Create wrapper for productivity link + timer widget
    const wrapper = document.createElement('div');
    wrapper.className = 'productivity-wrapper';
    wrapper.style.position = 'relative';

    // Move the productivity link into wrapper
    productivityLink.parentNode.insertBefore(wrapper, productivityLink);
    wrapper.appendChild(productivityLink);

    // Create timer widget container (always visible)
    const widgetContainer = document.createElement('div');
    widgetContainer.className = 'timer-widget-container';
    widgetContainer.id = 'timer-widget-container';
    wrapper.appendChild(widgetContainer);

    // Listen to timer updates
    _timerUnsubscribe = window.KorahTimer.addListener((eventType, state) => {
      updateTimerWidget(state);
    });

    // Initial render
    updateTimerWidget(window.KorahTimer.getState());
  }



  function updateTimerWidget(state) {
    const container = document.getElementById('timer-widget-container');
    if (!container) return;

    // Show celebration when timer just completed
    if (state.completedAt && (Date.now() - state.completedAt < 30000)) {
      container.innerHTML = `
        <div class="timer-celebration" style="color: white;">
          <div class="timer-celebration-icon">🎉</div>
          <div class="timer-celebration-text">Timer Complete!</div>
          <button class="timer-celebration-btn" onclick="window.KorahTimer.dismissCompletion()">
            Start New Timer
          </button>
        </div>
      `;
      return;
    }

    const remaining = window.KorahTimer.getRemainingSeconds();
    const progress = window.KorahTimer.getProgress();
    const isIdle = !state.isRunning && state.totalSeconds === state.preset * 60;
    const isPaused = !state.isRunning && state.totalSeconds < state.preset * 60 && state.totalSeconds > 0;

    if (state.isRunning) {
      // Timer is running - show countdown
      container.innerHTML = `
        <div class="timer-widget running" style="color: white;">
          <div class="timer-widget-display">
            <span class="timer-widget-icon pulse">🔴</span>
            <span class="timer-widget-time">${window.KorahTimer.formatTime(remaining)}</span>
          </div>
          <div class="timer-widget-progress">
            <div class="timer-widget-progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="timer-widget-controls">
            <button class="timer-widget-btn" onclick="window.KorahTimer.pause()" title="Pause">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            </button>
            <button class="timer-widget-btn" onclick="window.KorahTimer.reset(${state.preset})" title="Reset">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>
        </div>
      `;
    } else if (isPaused) {
      // Timer is paused - show resume option
      container.innerHTML = `
        <div class="timer-widget paused" style="color: white;">
          <div class="timer-widget-display">
            <span class="timer-widget-icon">⏸️</span>
            <span class="timer-widget-time">${window.KorahTimer.formatTime(remaining)}</span>
          </div>
          <div class="timer-widget-progress">
            <div class="timer-widget-progress-bar" style="width: ${progress}%"></div>
          </div>
          <div class="timer-widget-controls">
            <button class="timer-widget-btn resume" onclick="window.KorahTimer.resume()" title="Resume">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </button>
            <button class="timer-widget-btn" onclick="window.KorahTimer.reset(${state.preset})" title="Reset">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>
        </div>
      `;
    } else {
      // Timer is idle - show presets
      container.innerHTML = `
        <div class="timer-widget idle" style="color: white;">
          <div class="timer-dropdown-header">
            <span class="timer-dropdown-title">Pomodoro Timer</span>
          </div>
          <div class="timer-dropdown-presets">
            <button class="timer-preset-btn ${state.preset === 5 ? 'active' : ''}" onclick="window.KorahTimer.start(5);">
              <span class="preset-time">5:00</span>
            </button>
            <button class="timer-preset-btn ${state.preset === 10 ? 'active' : ''}" onclick="window.KorahTimer.start(10);">
              <span class="preset-time">10:00</span>
            </button>
            <button class="timer-preset-btn ${state.preset === 25 ? 'active' : ''}" onclick="window.KorahTimer.start(25);">
              <span class="preset-time">25:00</span>
            </button>
          </div>
        </div>
      `;
    }
  }

  // Initialize timer widget when sidebar is ready
  function initSidebar(options) {
    const { chatHistoryId, studyItemsId, chatBaseUrl, itemPageUrl, onItemClick, activeId } = options || {};
    const chatEl = document.getElementById(chatHistoryId || "chat-history");
    const studyEl = document.getElementById(studyItemsId || "study-items-history");
    const resolvedBaseUrl = chatBaseUrl || "../index.html";
    const resolvedItemUrl = itemPageUrl || "item.html";

    // 1. Immediate UI: Background, Toggle, and State
    initBackground();

    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebar-toggle");
    let overlay = document.querySelector(".sidebar-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.className = "sidebar-overlay";
      document.body.appendChild(overlay);
    }

    function isMobile() { return window.innerWidth <= 768; }

    function updateSidebarState(collapsed) {
      if (collapsed) sidebar?.classList.add("collapsed");
      else sidebar?.classList.remove("collapsed");
      localStorage.setItem("korah_sidebar_collapsed", collapsed);
    }

    const isCollapsed = localStorage.getItem("korah_sidebar_collapsed") === "true";
    if (sidebar && !isMobile()) updateSidebarState(isCollapsed);

    if (toggle && sidebar) {
      toggle.addEventListener("click", () => {
        if (isMobile()) {
          sidebar.classList.toggle("mobile-open");
          overlay.classList.toggle("show");
        } else {
          updateSidebarState(!sidebar.classList.contains("collapsed"));
        }
      });
    }

    overlay.addEventListener("click", () => {
      sidebar?.classList.remove("mobile-open");
      overlay.classList.remove("show");
    });

    window.addEventListener("resize", () => {
      if (!isMobile()) {
        sidebar?.classList.remove("mobile-open");
        overlay.classList.remove("show");
      }
    });

    // 2. Data Logic: Sync with Firestore/Cache
    function startWithDB() {
      const cachedSessions = localStorage.getItem("korah_sessions_cache");
      const cachedStudyItems = localStorage.getItem("korah_study_items_cache");
      
      if (cachedSessions) {
        try {
          const parsed = JSON.parse(cachedSessions);
          if (Object.keys(parsed).length > 0) {
            _sessionsCache = parsed;
            renderChatHistory(chatEl, resolvedBaseUrl);
            if (activeId) updateActiveItem(activeId);
          }
        } catch (e) {}
      }
      if (cachedStudyItems) {
        try {
          const parsed = JSON.parse(cachedStudyItems);
          if (Object.keys(parsed).length > 0) {
            _studyItemsCache = parsed;
            renderStudyItemsHistory(studyEl, resolvedItemUrl);
          }
        } catch (e) {}
      }

      if (window.KorahDB) {
        window.KorahDB.onConversationsChange((snapshot) => {
          _sessionsCache = snapshot;
          localStorage.setItem("korah_sessions_cache", JSON.stringify(snapshot));
          renderChatHistory(chatEl, resolvedBaseUrl);
          if (activeId) updateActiveItem(activeId);
        });
        window.KorahDB.onStudyItemsChange((snapshot) => {
          _studyItemsCache = snapshot;
          localStorage.setItem("korah_study_items_cache", JSON.stringify(snapshot));
          renderStudyItemsHistory(studyEl, resolvedItemUrl);
        });
      } else {
        renderChatHistory(chatEl, resolvedBaseUrl);
        renderStudyItemsHistory(studyEl, resolvedItemUrl);
        if (activeId) updateActiveItem(activeId);
      }
      initChatMultiSelect(chatEl, resolvedBaseUrl, onItemClick);
      initStudyMultiSelect(studyEl, resolvedItemUrl);
      
      // Initialize timer widget
      initTimerWidget();
    }

    if (window._korahReadyFired) startWithDB();
    else window.addEventListener("korahReady", startWithDB, { once: true });
  }

  window.KorahSidebar = {
    getSessions, getStudyItems, getTypeEmoji, renderChatHistory,
    renderStudyItemsHistory, updateActiveItem, initSidebar,
    initTimerWidget, updateTimerWidget,
  };
})();
