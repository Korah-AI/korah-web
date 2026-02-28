/**
 * Shared sidebar logic for study pages: Recent Chats + Recent Study Items
 * Uses same localStorage keys as korah-chat.js (korah_sessions, korah_study_items).
 */
(function () {
  const SESSIONS_KEY = "korah_sessions";
  const STUDY_ITEMS_KEY = "korah_study_items";

  function getSessions() {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  function getStudyItems() {
    try {
      const data = localStorage.getItem(STUDY_ITEMS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (_) {
      return {};
    }
  }

  const MODE_EMOJI = {
    general: "✨",
    math: "🧮",
    physics: "⚛️",
    chemistry: "⚗️",
    biology: "🧬",
    history: "📜",
    literature: "📚",
  };

  function getModeEmoji(mode) {
    return MODE_EMOJI[mode] || "📚";
  }

  const TYPE_EMOJI = { flashcards: "🃏", studyGuide: "📖", practiceTest: "🎯" };
  function getTypeEmoji(type) {
    return TYPE_EMOJI[type] || "📄";
  }

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
      a.style.textDecoration = "none";
      a.style.color = "inherit";
      a.innerHTML =
        '<span class="history-icon">' +
        getModeEmoji(s.mode) +
        "</span><span class=\"history-text\">" +
        (s.title || "New Chat").slice(0, 28) +
        ((s.title || "").length > 28 ? "…" : "") +
        "</span>";
      container.appendChild(a);
    });
  }

  function renderStudyItemsHistory(container, itemPageUrl) {
    if (!container) return;
    const items = getStudyItems();
    const list = Object.keys(items)
      .map((id) => ({ id, ...items[id] }))
      .sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt) -
          new Date(a.updatedAt || a.createdAt)
      )
      .slice(0, 8);
    container.innerHTML = "";
    list.forEach((item) => {
      const a = document.createElement("a");
      a.href = itemPageUrl + "?id=" + encodeURIComponent(item.id);
      a.className = "history-item t-btn";
      a.style.textDecoration = "none";
      a.style.color = "inherit";
      a.innerHTML =
        '<span class="history-icon">' +
        getTypeEmoji(item.type) +
        "</span><span class=\"history-text\">" +
        (item.title || "Untitled").slice(0, 28) +
        ((item.title || "").length > 28 ? "…" : "") +
        "</span>";
      container.appendChild(a);
    });
  }

  function initSidebar(options) {
    const { chatHistoryId, studyItemsId, chatBaseUrl, itemPageUrl } = options || {};
    const chatEl = document.getElementById(chatHistoryId || "chat-history");
    const studyEl = document.getElementById(studyItemsId || "study-items-history");
    renderChatHistory(chatEl, chatBaseUrl || "../index.html");
    renderStudyItemsHistory(studyEl, itemPageUrl || "item.html");
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
