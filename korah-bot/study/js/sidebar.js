/**
 * Shared sidebar logic for study pages: Recent Chats + Recent Study Items
 * Reads from Firestore via window.KorahDB (set up by study-firebase-init.js);
 * falls back to empty caches if KorahDB is unavailable.
 */

// ── Rename & Delete Modal Handlers ──
function initRenameDeleteModals() {
  const renameModal = document.getElementById("rename-modal");
  const deleteModal = document.getElementById("delete-modal");

  if (!renameModal || !deleteModal) return;

  const renameInput = document.getElementById("rename-modal-input");
  const renameDesc = document.getElementById("rename-modal-desc");
  const renameCancel = document.getElementById("rename-modal-cancel");
  const renameConfirm = document.getElementById("rename-modal-confirm");
  const deleteName = document.getElementById("delete-modal-name");
  const deleteCancel = document.getElementById("delete-modal-cancel");
  const deleteConfirm = document.getElementById("delete-modal-confirm");

  let renameCallback = null;
  let deleteCallback = null;

  function showRenameModal(currentName, desc, onConfirm) {
    renameInput.value = currentName || "";
    if (renameDesc) renameDesc.textContent = desc || "Enter a new name";
    renameCallback = onConfirm;
    renameModal.classList.add("show");
    setTimeout(() => { renameInput.focus(); renameInput.select(); }, 50);
  }

  function showDeleteModal(name, onConfirm) {
    if (deleteName) deleteName.textContent = name || "this item";
    deleteCallback = onConfirm;
    deleteModal.classList.add("show");
  }

  function hideRenameModal() {
    renameModal.classList.remove("show");
    renameCallback = null;
  }

  function hideDeleteModal() {
    deleteModal.classList.remove("show");
    deleteCallback = null;
  }

  renameCancel?.addEventListener("click", hideRenameModal);
  renameConfirm?.addEventListener("click", () => {
    const v = renameInput.value.trim();
    if (v && renameCallback) renameCallback(v);
    hideRenameModal();
  });
  renameInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); renameConfirm?.click(); }
    if (e.key === "Escape") hideRenameModal();
  });

  deleteCancel?.addEventListener("click", hideDeleteModal);
  deleteConfirm?.addEventListener("click", () => {
    if (deleteCallback) deleteCallback();
    hideDeleteModal();
  });

  [renameModal, deleteModal].forEach(modal => {
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.remove("show");
    });
  });

  window.showRenameModal = showRenameModal;
  window.showDeleteModal = showDeleteModal;
}

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
    ids.forEach((id) => {
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
    // Wait for data to be loaded from cache/storage first
    const cachedStudyItems = localStorage.getItem("korah_study_items_cache");
    if (cachedStudyItems) {
      try {
        const parsed = JSON.parse(cachedStudyItems);
        if (Object.keys(parsed).length > 0) {
          _studyItemsCache = parsed;
        }
      } catch (e) {}
    }
    
    const items = getStudyItems();
    const itemIds = Object.keys(items);

    const navLinks = document.querySelectorAll(".sidebar-nav-link");
    navLinks.forEach(link => {
      if (link.hasAttribute('data-sat-link')) return; // Skip SAT links
      const href = link.getAttribute("href");
      if (href.includes("feed.html")) {
        link.innerHTML = "<span class='nav-icon'>📚</span> <span class='nav-text'>Study</span>";
        if (itemIds.length === 0) link.classList.add("nav-empty");
        else link.classList.remove("nav-empty");
      } else if (href.includes("index.html")) {
        link.innerHTML = "<span class='nav-icon'>💬</span> <span class='nav-text'>Chat</span>";
      }
      // All other links (productivity) remain unchanged
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
    let w, h, stars = [], shootingStars = [], dots = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initStars();
      initDots();
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

    class Dot {
      constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = 2 + Math.random() * 2;
      }
      update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139,92,246,0.5)';
        ctx.fill();
      }
    }

    function initStars() {
      stars = [];
      const starCount = Math.floor((w * h) / 3000);
      for (let i = 0; i < starCount; i++) stars.push(new Star());
    }

    function initDots() {
      dots = [];
      const dotCount = Math.floor((w * h) / 15000); // Fewer dots for constellation
      const count = Math.min(Math.max(dotCount, 40), 100);
      for (let i = 0; i < count; i++) dots.push(new Dot());
    }

    shootingStars = [];
    for (let i = 0; i < 2; i++) shootingStars.push(new ShootingStar());

    function animate() {
      ctx.clearRect(0, 0, w, h);
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      if (isLight) {
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        for (let i = 0; i < dots.length; i++) {
          for (let j = i + 1; j < dots.length; j++) {
            const dx = dots[i].x - dots[j].x;
            const dy = dots[i].y - dots[j].y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 160) {
              ctx.beginPath();
              ctx.moveTo(dots[i].x, dots[i].y);
              ctx.lineTo(dots[j].x, dots[j].y);
              ctx.strokeStyle = `rgba(139,92,246,${(1 - dist/160) * 0.3})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        }
        dots.forEach(d => { d.update(); d.draw(); });
      } else {
        stars.forEach(s => { s.update(); s.draw(); });
        shootingStars.forEach(s => { s.update(); s.draw(); });
      }
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
    const deselectAllBtn = document.getElementById("chat-deselect-all");
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

    deselectAllBtn?.addEventListener("click", () => {
      selected.clear();
      container.querySelectorAll(".history-item.selected").forEach(el => el.classList.remove("selected"));
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

    // Ensure KorahTimer is available
    if (!window.KorahTimer) {
      container.innerHTML = `
        <div class="timer-widget-error">
          <span class="timer-widget-error-icon">⏱️</span>
          <span class="timer-widget-error-text">Timer loading...</span>
        </div>
      `;
      return;
    }

    // Show celebration when timer just completed
    if (state.completedAt && (Date.now() - state.completedAt < 30000)) {
      container.innerHTML = `
        <div class="timer-celebration">
          <div class="timer-celebration-icon">🎉</div>
          <div class="timer-celebration-text">Timer Complete!</div>
          <button class="timer-celebration-btn" onclick="window.KorahTimer.dismissCompletion()" aria-label="Dismiss timer completion and start new timer">
            Start New Timer
          </button>
        </div>
      `;
      return;
    }

    const remaining = window.KorahTimer.getRemainingSeconds();
    // const totalSeconds = window.KorahTimer.getState().totalSeconds;
    const preset = window.KorahTimer.getState().preset;
    const progress = preset > 0 ? ((preset * 60 - remaining) / (preset * 60)) * 100 : 0;
    // const remaining = window.KorahTimer.getRemainingSeconds();
    // const progress = window.KorahTimer.getProgress();
    const isIdle = !state.isRunning && state.totalSeconds === state.preset * 60;
    const isPaused = !state.isRunning && state.totalSeconds < state.preset * 60 && state.totalSeconds > 0;

    // Escape HTML to prevent XSS
    const formatTimeSafe = (seconds) => {
      const formatted = window.KorahTimer.formatTime(seconds);
      return formatted.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    };

    if (state.isRunning) {
      // Timer is running - show countdown with circular progress
      const circumference = 2 * Math.PI * 45; // radius 45
      const dashoffset = circumference * (1 - progress / 100);
      container.innerHTML = `
        <div class="timer-widget running circular" role="timer" aria-live="polite" aria-label="Timer running, ${formatTimeSafe(remaining)} remaining">
          <div class="timer-widget-circular-layout">
            <div class="timer-widget-left">
              <div class="timer-widget-time-large">${window.KorahTimer.formatTime(remaining)}</div>
              <div class="timer-widget-controls-circular">
                <button class="timer-widget-btn" onclick="window.KorahTimer.pause()" title="Pause timer" aria-label="Pause timer">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                </button>
                <button class="timer-widget-btn" onclick="window.KorahTimer.reset(${state.preset})" title="Reset timer" aria-label="Reset timer">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
              </div>
            </div>
            <div class="timer-widget-right">
              <svg class="timer-widget-svg" viewBox="0 0 100 100">
                <circle class="timer-widget-circle-bg" cx="50" cy="50" r="45" />
                <circle class="timer-widget-circle-progress" cx="50" cy="50" r="45" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${dashoffset}" />
              </svg>
            </div>
          </div>
        </div>
      `;
    } else if (isPaused) {
      // Timer is paused - show resume option with circular progress
      const circumference = 2 * Math.PI * 45; // radius 45
      const dashoffset = circumference * (1 - progress / 100);
      container.innerHTML = `
        <div class="timer-widget paused circular" role="timer" aria-live="polite" aria-label="Timer paused, ${formatTimeSafe(remaining)} remaining">
          <div class="timer-widget-circular-layout">
            <div class="timer-widget-left">
              <div class="timer-widget-time-large">${window.KorahTimer.formatTime(remaining)}</div>
              <div class="timer-widget-controls-circular">
                <button class="timer-widget-btn resume" onclick="window.KorahTimer.resume()" title="Resume timer" aria-label="Resume timer">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </button>
                <button class="timer-widget-btn" onclick="window.KorahTimer.reset(${state.preset})" title="Reset timer" aria-label="Reset timer">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                </button>
              </div>
            </div>
            <div class="timer-widget-right">
              <svg class="timer-widget-svg" viewBox="0 0 100 100">
                <circle class="timer-widget-circle-bg" cx="50" cy="50" r="45" />
                <circle class="timer-widget-circle-progress" cx="50" cy="50" r="45" 
                  stroke-dasharray="${circumference}" 
                  stroke-dashoffset="${dashoffset}" />
              </svg>
            </div>
          </div>
        </div>
      `;
    } else {
      // Timer is idle - collapsed trigger pill
      const isOpen = container.getAttribute('data-open') === 'true';
      container.innerHTML = `
        <div class="timer-widget idle">
          <button class="timer-idle-trigger" id="timer-idle-trigger">
            <span style="font-size:13px;">Pomodoro Timer</span>
            <svg class="timer-idle-chevron" id="timer-idle-chevron" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <div class="timer-idle-panel" id="timer-idle-panel">
            <div class="timer-idle-panel-inner">
              <div class="timer-idle-input-row">
                <div class="timer-split-input">
                  <input
                    id="timer-custom-min"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="3"
                    placeholder="25"
                    value=""
                    class="timer-custom-input"
                  />
                  <span class="timer-input-label">min</span>
                </div>
                <div class="timer-split-divider">:</div>
                <div class="timer-split-input">
                  <input
                    id="timer-custom-sec"
                    type="text"
                    inputmode="numeric"
                    pattern="[0-9]*"
                    maxlength="2"
                    placeholder="00"
                    class="timer-custom-input"
                  />
                  <span class="timer-input-label">sec</span>
                </div>
              </div>
              <button class="timer-start-btn" id="timer-start-btn">▶ Start</button>
            </div>
          </div>
        </div>
      `;

      // Restore open state after re-render
      const panel = container.querySelector('#timer-idle-panel');
      const chevron = container.querySelector('#timer-idle-chevron');
      if (isOpen) {
        panel.classList.add('open');
        chevron.classList.add('open');
      }

      // Toggle dropdown
      container.querySelector('#timer-idle-trigger').addEventListener('click', () => {
        const nowOpen = container.getAttribute('data-open') !== 'true';
        container.setAttribute('data-open', nowOpen);
        panel.classList.toggle('open', nowOpen);
        chevron.classList.toggle('open', nowOpen);
      });

      // Custom start button
      // Strip non-numeric characters as user types
      const minInput = container.querySelector('#timer-custom-min');
      const secInput = container.querySelector('#timer-custom-sec');

      minInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (e.target.value === '0') e.target.value = '';
      });

      secInput.addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
        if (parseInt(e.target.value) > 59) e.target.value = '59';
      });

      [minInput, secInput].forEach(input => {
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') e.target.blur();
        });
      });

      // Custom start button
      container.querySelector('#timer-start-btn').addEventListener('click', () => {
        const mins = parseInt(minInput.value) || 0;
        const secs = parseInt(secInput.value) || 0;
        const totalMins = mins + secs / 60;
        if (totalMins > 0) window.KorahTimer.start(totalMins);
      });
    }
  }

  // Global function to toggle timer sound
  window.toggleTimerSound = function() {
    if (window.KorahTimer) {
      const currentEnabled = window.KorahTimer.isSoundEnabled();
      window.KorahTimer.setSoundEnabled(!currentEnabled);
      // Update the widget to reflect the new state
      updateTimerWidget(window.KorahTimer.getState());
    }
  };

  // ── Settings Modal ──
  function initSettingsModal() {
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsClose = document.getElementById('settings-close');
    const settingsThemeSelect = document.getElementById('settings-theme-select');
    const settingsNameInput = document.getElementById('settings-name-input');
    const settingsSaveBtn = document.getElementById('settings-save');
    const settingsClearDataBtn = document.getElementById('settings-clear-data');

    if (!settingsModal || !settingsBtn) return;

    settingsBtn.addEventListener('click', () => {
      settingsModal.classList.add('show');
      const savedTheme = localStorage.getItem('korah_theme') || 'dark';
      const savedName = localStorage.getItem('korah_name') || '';
      if (settingsThemeSelect) settingsThemeSelect.value = savedTheme;
      if (settingsNameInput) settingsNameInput.value = savedName;
    });

    settingsClose?.addEventListener('click', () => {
      settingsModal.classList.remove('show');
    });

    settingsModal?.addEventListener('click', (e) => {
      if (e.target === settingsModal) {
        settingsModal.classList.remove('show');
      }
    });

    settingsSaveBtn?.addEventListener('click', () => {
      const theme = settingsThemeSelect.value;
      const name = settingsNameInput.value;
      localStorage.setItem('korah_theme', theme);
      localStorage.setItem('korah_name', name);
      document.documentElement.setAttribute('data-theme', theme);
      settingsModal.classList.remove('show');
    });

    settingsClearDataBtn?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
        localStorage.clear();
        settingsModal.classList.remove('show');
      }
    });
  }

  // Initialize timer widget when sidebar is ready
  function initSidebar(options) {
    const { chatHistoryId, studyItemsId, chatBaseUrl, itemPageUrl, onItemClick, activeId } = options || {};
    const chatEl = document.getElementById(chatHistoryId || "chat-history");
    const studyEl = document.getElementById(studyItemsId || "study-items-history");
    const resolvedBaseUrl = chatBaseUrl || "../index.html";
    const resolvedItemUrl = itemPageUrl || "item.html";

    const newChatBtn = document.getElementById("new-chat-btn");
    if (newChatBtn) {
      newChatBtn.addEventListener("click", () => {
        // Only redirect if we are NOT on the chat page (index.html)
        // This ensures the button on the chat page itself remains "smooth"
        const isChatPage = !!document.getElementById("chat-input");
        if (!isChatPage) {
          localStorage.setItem("korah_new_chat_trigger", "true");
          window.location.href = resolvedBaseUrl;
        }
      });
    }

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

    function getDocPanel() {
      return document.getElementById('doc-panel');
    }

    function collapseDocPanelIfNeeded() {
      const docPanel = getDocPanel();
      if (docPanel && docPanel.classList.contains('expanded')) {
        docPanel.classList.remove('expanded');
        docPanel.classList.add('collapsed');
        const tab = document.getElementById('doc-panel-tab');
        if (tab) tab.classList.remove('panel-open');
        const isDocPanelExpanded = false;
      }
    }

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
          const willExpand = sidebar.classList.contains("collapsed");
          if (willExpand) {
            collapseDocPanelIfNeeded();
          }
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

      // Initialize settings modal
      initSettingsModal();

      // Initialize rename/delete modals
      initRenameDeleteModals();
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
