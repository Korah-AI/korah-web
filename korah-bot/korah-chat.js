(() => {
  const MAX_CHARS = 2000;
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

  if (!input || !sendBtn || !messagesList) return;

  const history = [];
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

  function buildMessageRow(role, text, isError = false) {
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
    content.style.whiteSpace = "pre-wrap";
    content.textContent = text;

    bubble.appendChild(label);
    bubble.appendChild(content);
    row.appendChild(avatar);
    row.appendChild(bubble);
    return row;
  }

  function appendMessage(role, text, isError = false) {
    const row = buildMessageRow(role, text, isError);
    messagesList.appendChild(row);
    setWelcomeVisibility(false);
    scrollToBottom();
  }

  async function callChatApi(messages) {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        messages
      })
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch (_error) {}

    if (!response.ok) {
      const errText =
        payload?.message ||
        payload?.error ||
        `Request failed with status ${response.status}`;
      throw new Error(errText);
    }

    const reply =
      payload?.choices?.[0]?.message?.content ||
      payload?.output_text ||
      "";

    if (!reply) throw new Error("API returned an empty response.");
    return reply;
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

    input.value = "";
    resizeInput();
    updateCharCount();
    setSendingState(true);
    setTyping(true);

    try {
      const reply = await callChatApi(history);
      history.push({ role: "assistant", content: reply });
      appendMessage("assistant", reply);
    } catch (error) {
      console.error("Chat request failed:", error);
      appendMessage(
        "assistant",
        `I couldn't reach the chat API. ${error.message}`,
        true
      );
    } finally {
      setTyping(false);
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
  if (newChatBtn) newChatBtn.addEventListener("click", resetChat);

  resizeInput();
  updateCharCount();
})();
