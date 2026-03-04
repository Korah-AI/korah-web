/**
 * Shared sidebar logic for study pages: Recent Chats + Recent Study Items
 * Uses same localStorage keys as korah-chat.js (korah_sessions, korah_study_items).
 */

function showSidebarRenameModal(currentName, desc, onConfirm) {
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

function showSidebarDeleteModal(name, onConfirm) {
  const modal = document.getElementById("delete-modal");
  const nameEl = document.getElementById("delete-modal-name");
  const confirmBtn = document.getElementById("delete-modal-confirm");
  const cancelBtn = document.getElementById("delete-modal-cancel");
  if (!modal) { if (onConfirm) onConfirm(); return; }
  nameEl.textContent = name;
  modal.classList.add("show");
  function cleanup() {
    modal.classList.remove("show");
    confirmBtn.removeEventListener("click", onYes);
    cancelBtn.removeEventListener("click", onNo);
    modal.removeEventListener("click", onOutside);
  }
  function onYes() { cleanup(); if (onConfirm) onConfirm(); }
  function onNo() { cleanup(); }
  function onOutside(e) { if (e.target === modal) cleanup(); }
  confirmBtn.addEventListener("click", onYes);
  cancelBtn.addEventListener("click", onNo);
  modal.addEventListener("click", onOutside);
}

(function () {
  const SESSIONS_KEY = "korah_sessions";
  const STUDY_ITEMS_KEY = "korah_study_items";

  function getSessions() {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) { return {}; }
  }

  function getStudyItems() {
    try {
      const data = localStorage.getItem(STUDY_ITEMS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) { return {}; }
  }

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
          localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
          renderChatHistory(container, baseUrl);
        });
      });


      actions.querySelector(".delete-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showSidebarDeleteModal(s.title || "this chat", () => {
          const all = getSessions();
          delete all[id];
          localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
          renderChatHistory(container, baseUrl);
        });
      });
    });
  }

  // ── Render Study Items History ──
  function renderStudyItemsHistory(container, itemPageUrl) {
    if (!container) return;
    const items = getStudyItems();
    const list = Object.keys(items)
      .map((id) => ({ id, ...items[id] }))
      .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
      .slice(0, 8);
    container.innerHTML = "";
    list.forEach((item) => {
      const a = document.createElement("a");
      a.href = itemPageUrl + "?id=" + encodeURIComponent(item.id);
      a.className = "history-item t-btn";
      a.setAttribute("data-study-id", item.id);
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
          localStorage.setItem(STUDY_ITEMS_KEY, JSON.stringify(all));
          renderStudyItemsHistory(container, itemPageUrl);
        });
      });

      actions.querySelector(".delete-study-btn").addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        showSidebarDeleteModal(item.title || "this item", () => {
          const all = getStudyItems();
          delete all[item.id];
          localStorage.setItem(STUDY_ITEMS_KEY, JSON.stringify(all));
          renderStudyItemsHistory(container, itemPageUrl);
        });
      });
    });
  }

  function initSidebar(options) {
    const { chatHistoryId, studyItemsId, chatBaseUrl, itemPageUrl } = options || {};
    const chatEl = document.getElementById(chatHistoryId || "chat-history");
    const studyEl = document.getElementById(studyItemsId || "study-items-history");
    const resolvedBaseUrl = chatBaseUrl || "../index.html";
    const resolvedItemUrl = itemPageUrl || "item.html";
    renderChatHistory(chatEl, resolvedBaseUrl);
    renderStudyItemsHistory(studyEl, resolvedItemUrl);
    initChatMultiSelect(chatEl, resolvedBaseUrl);
    initStudyMultiSelect(studyEl, resolvedItemUrl);
  }

  // ── Multi-select: Chats ──
  function initChatMultiSelect(container, baseUrl) {
    const bar = document.getElementById("chat-select-bar");
    const countEl = document.getElementById("chat-select-count");
    const deleteBtn = document.getElementById("chat-delete-selected");
    const selectAllBtn = document.getElementById("chat-select-all");
    if (!container || !bar) return;

    const selected = new Set();

    function updateBar() {
      if (selected.size > 0) {
        bar.classList.add("show");
        countEl.textContent = `${selected.size} selected`;
        deleteBtn.textContent = `Delete (${selected.size})`;
      } else {
        bar.classList.remove("show");
      }
    }

    function clearSelection() {
      selected.clear();
      container.querySelectorAll(".history-item.selected").forEach(el => el.classList.remove("selected"));
      updateBar();
    }

    container.addEventListener("click", (e) => {
      const item = e.target.closest(".history-item");
      if (!item) return;
      if (e.target.closest(".history-action-btn")) return;
      const id = item.getAttribute("data-session");
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

    selectAllBtn?.addEventListener("click", () => {
      const items = container.querySelectorAll(".history-item");
      const allSelected = selected.size === items.length;
      clearSelection();
      if (!allSelected) {
        items.forEach(item => {
          const id = item.getAttribute("data-session");
          if (id) { selected.add(id); item.classList.add("selected"); }
        });
        updateBar();
      }
    });

    deleteBtn?.addEventListener("click", () => {
      if (selected.size === 0) return;
      showSidebarDeleteModal(`${selected.size} chat${selected.size > 1 ? "s" : ""}`, () => {
        const all = getSessions();
        selected.forEach(id => delete all[id]);
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(all));
        clearSelection();
        renderChatHistory(container, baseUrl);
      });
    });
  }

  // ── Multi-select: Study Items ──
  function initStudyMultiSelect(container, itemPageUrl) {
    const bar = document.getElementById("study-select-bar");
    const countEl = document.getElementById("study-select-count");
    const deleteBtn = document.getElementById("study-delete-selected");
    const selectAllBtn = document.getElementById("study-select-all");
    if (!container || !bar) return;

    const selected = new Set();

    function updateBar() {
      if (selected.size > 0) {
        bar.classList.add("show");
        countEl.textContent = `${selected.size} selected`;
        deleteBtn.textContent = `Delete (${selected.size})`;
      } else {
        bar.classList.remove("show");
      }
    }

    function clearSelection() {
      selected.clear();
      container.querySelectorAll(".history-item.selected").forEach(el => el.classList.remove("selected"));
      updateBar();
    }

    const observer = new MutationObserver(() => attachListeners());
    observer.observe(container, { childList: true });

    function attachListeners() {
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
    }
    attachListeners();

    selectAllBtn?.addEventListener("click", () => {
      const items = container.querySelectorAll(".history-item");
      const allSelected = selected.size === items.length;
      clearSelection();
      if (!allSelected) {
        items.forEach(item => {
          const id = item.getAttribute("data-study-id");
          if (id) { selected.add(id); item.classList.add("selected"); }
        });
        updateBar();
      }
    });

    deleteBtn?.addEventListener("click", () => {
      if (selected.size === 0) return;
      showSidebarDeleteModal(`${selected.size} study item${selected.size > 1 ? "s" : ""}`, () => {
        const all = getStudyItems();
        selected.forEach(id => delete all[id]);
        localStorage.setItem(STUDY_ITEMS_KEY, JSON.stringify(all));
        clearSelection();
        renderStudyItemsHistory(container, itemPageUrl);
      });
    });
  }

  window.KorahSidebar = {
    getSessions,
    getStudyItems,
    getTypeEmoji,
    renderChatHistory,
    renderStudyItemsHistory,
    initSidebar,
  };

})();