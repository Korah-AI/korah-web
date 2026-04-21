console.log('math-chat.js loading...');
(() => {
  try {
  console.log('math-chat.js try block entered');
  const API_ENDPOINT = "/api/gem-proxy";
  const MODEL = "gemini-2.5-flash";

  const input = document.getElementById("chat-input");
  const welcomeInput = document.getElementById("welcome-chat-input");
  const sendBtn = document.getElementById("send-btn");
  const welcomeSendBtn = document.getElementById("welcome-send-btn");
  const messagesList = document.getElementById("messages-list");
  const welcomeScreen = document.getElementById("welcome-screen");
  const typingIndicator = document.getElementById("typing-indicator");
  const chatBody = document.getElementById("chat-body");
  const suggestionBar = document.getElementById("suggestion-bar");
  const clearChatBtn = document.getElementById("clear-chat-btn");

  let satMathCalculator = null;
  let graphExpressions = [];
  let isGraphInitialized = false;

  const SAT_MATH_SYSTEM_PROMPT = `You are Korah, a specialized SAT Math tutor with expertise in:
- Algebra (linear equations, systems, inequalities)
- Advanced Math (quadratics, polynomials, exponential functions)
- Problem-Solving and Data Analysis (ratios, percentages, statistics)
- Geometry and Trigonometry (area, volume, right triangles, trigonometry)

Your teaching approach:
- Break down problems into clear, manageable steps
- Explain the "why" behind each step, not just the "how"
- Connect mathematical concepts to real-world SAT-style problems
- Use the provided Desmos graph to visualize functions, equations, and relationships
- Reference the graph in your explanations ("Notice on the graph...", "As we can see...")

IMPORTANT: You MUST respond in JSON format with two fields: "graph" and "response".
DO NOT include any markdown formatting like \`\`\`json outside the JSON itself.
The response must be a single raw JSON object.

RESPONSE FORMAT:
{
  "graph": {
    "expressions": [
      {"latex": "y=x^2", "color": "#4285F4"}
    ],
    "viewport": {"xmin": -10, "xmax": 10, "ymin": -10, "ymax": 10}
  },
  "response": "Your explanation here using Markdown and KaTeX . . ."
}

The "graph" field contains Desmos API expressions to update the graph:
- "expressions": array of expression objects with latex, color, hidden, lineStyle, lineWidth
- "viewport": optional bounds (xmin, xmax, ymin, ymax)
- Use "viewport" to adjust the view when showing different scales
- To clear the graph, provide an empty expressions array or set expressions to null.

The "response" field contains your text explanation using:
- Markdown headings, bold, italic
- KaTeX for math: $inline$ or $$display$$
- NEVER use \\(...\\), \\[...\\], or bare math.

If no graph update needed, set "graph": null.`;

function getFormatInstructions() {
  return `STRICT RESPONSE FORMAT: Output ONLY raw JSON. No code blocks.
Fields: { "graph": {...}, "response": "..." }
KATEX: $...$ for inline, $$...$$ for display.`;
}

  function initializeSATGraph() {
    const container = document.getElementById('sat-graph-container');
    if (!container || !window.Desmos || isGraphInitialized) return;

    container.innerHTML = '<div class="desmos-graph-wrapper" id="sat-desmos-graph"></div>';
    const graphEl = document.getElementById('sat-desmos-graph');

    satMathCalculator = Desmos.GraphingCalculator(graphEl, {
      keypad: false,
      graphpaper: true,
      autosize: true,
      expressions: true,
      settingsMenu: false,
      zoomButtons: true,
      border: false,
      keyboard: false,
      showGrid: true,
      showAxisLabels: true,
      showClearButton: false,
      authorMode: false,
    });

    satMathCalculator.setMathBounds({
      left: -10,
      right: 10,
      bottom: -10,
      top: 10,
    });

    isGraphInitialized = true;

    
  }

  let graphStateDebounceTimer = null;

  function captureGraphState() {
    if (!satMathCalculator) return;
    
    clearTimeout(graphStateDebounceTimer);
    graphStateDebounceTimer = setTimeout(() => {
      try {
        const state = satMathCalculator.getState();
        graphExpressions = [];
        
        if (state.expressions && state.expressions.list) {
          state.expressions.list.forEach(expr => {
            if (expr.type === 'expression' && !expr.hidden) {
              graphExpressions.push({
                id: expr.id,
                latex: expr.latex || '',
                color: expr.color,
                label: expr.label || ''
              });
            }
          });
        }
        
        updateGraphContextIndicator();
      } catch (e) {
        console.warn('Failed to capture graph state:', e);
      }
    }, 500);
  }

  function updateGraphContextIndicator() {
    let indicator = document.getElementById('graph-context-indicator');
    
    if (graphExpressions.length === 0) {
      indicator?.remove();
      return;
    }

    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'graph-context-indicator';
      indicator.className = 'graph-context-indicator';
      indicator.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
        <span>Graph has ${graphExpressions.length} expression(s)</span>
      `;
      
      const inputArea = document.getElementById('chat-input-area');
      inputArea?.parentNode?.insertBefore(indicator, inputArea);
    } else {
      indicator.querySelector('span').textContent = 
        `Graph has ${graphExpressions.length} expression(s)`;
    }
  }

  function getGraphContext() {
    if (graphExpressions.length === 0) return '';
    
    const exprList = graphExpressions
      .map(e => e.latex ? `y = ${e.latex}` : null)
      .filter(Boolean)
      .join(', ');
    
    return exprList ? `\n\n[Current Graph State: ${exprList}]` : '';
  }

  function updateSATGraph(data) {
    if (!satMathCalculator) return;
    if (!data || typeof data !== 'object') return;

    const graphContainer = document.getElementById('sat-graph-container');

    // To properly "update" we either clear and rebuild or surgically update.
    // Given the prompt asks to "update existing", we'll clear first to ensure a clean state
    // but using setBlank() is the standard way to clear everything.
    satMathCalculator.setBlank();

    if (data.viewport) {
      satMathCalculator.setMathBounds({
        left: data.viewport.xmin ?? -10,
        right: data.viewport.xmax ?? 10,
        bottom: data.viewport.ymin ?? -10,
        top: data.viewport.ymax ?? 10,
      });
    }

    if (data.expressions && Array.isArray(data.expressions)) {
      data.expressions.forEach((expr, idx) => {
        if (expr.latex) {
          satMathCalculator.setExpression({
            id: expr.id || 'expr_' + idx,
            latex: expr.latex,
            color: expr.color || '#4285F4',
            hidden: expr.hidden || false,
            lineStyle: expr.lineStyle || 'SOLID',
            lineWidth: expr.lineWidth || 2,
          });
        }
      });
    }

    if (graphContainer) {
      graphContainer.classList.add('graph-updated');
      setTimeout(() => graphContainer.classList.remove('graph-updated'), 500);
    }

    captureGraphState();
  }

  function renderGraphUpdates(container) {
    // Structured JSON responses now carry graph updates directly.
    // Keep this stub so older call sites remain safe.
    return container;
  }

  function bindGraphControls() {
    document.getElementById('sat-graph-clear')?.addEventListener('click', () => {
      if (satMathCalculator) {
        satMathCalculator.setBlank();
        graphExpressions = [];
        updateGraphContextIndicator();
      }
    });
  }

  async function sendMessage(text) {
    console.log('sendMessage called', { text, inputValue: input?.value, welcomeInputValue: welcomeInput?.value });
    const userMessage = text || input?.value?.trim() || welcomeInput?.value?.trim();
    console.log('userMessage:', userMessage);
    if (!userMessage) {
      console.log('No user message, returning early');
      return;
    }

    welcomeScreen?.classList.add('hidden');
    document.getElementById('chat-input-area')?.classList.remove('hidden');

    const graphContext = getGraphContext();
    const fullMessage = userMessage + graphContext;

    console.log('Adding user message to chat');
    addMessage('user', userMessage);
    
    input && (input.value = '');
    welcomeInput && (welcomeInput.value = '');

    typingIndicator?.classList.remove('hidden');
    chatBody.scrollTop = chatBody.scrollHeight;

    const streamingContentId = `streaming-content-${Date.now()}`;
    const streamingRow = addMessage('assistant', '', false, streamingContentId);
    const contentElement = document.getElementById(streamingContentId);
    typingIndicator?.classList.add('hidden');

    // Show pulsing "Thinking" indicator while waiting for first content
    let thinkingIndicator = null;
    if (contentElement) {
      thinkingIndicator = document.createElement("div");
      thinkingIndicator.className = "thinking-indicator";
      thinkingIndicator.innerHTML = `
        <span style="font-size: 0.8125rem; font-weight: 600; margin-right: 0.5rem;">Korah is thinking...</span>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
        <div class="thinking-dot"></div>
      `;
      contentElement.appendChild(thinkingIndicator);
    }

    let currentTypedText = "";
    let charBuffer = [];
    let typewriterActive = false;
    let lastBufferedLength = 0;

    const typeNextChar = () => {
      if (charBuffer.length === 0) {
        typewriterActive = false;
        return;
      }
      typewriterActive = true;
      const charsToType = charBuffer.length > 20 ? 2 : 1;
      for (let i = 0; i < charsToType; i++) {
        if (charBuffer.length > 0) {
          currentTypedText += charBuffer.shift();
        }
      }
      if (contentElement) {
        renderMarkdownAndMath(contentElement, currentTypedText);
    }
    let delay = 5;
    if (charBuffer.length > 50) delay = 0;
    setTimeout(typeNextChar, delay);
  };

  console.log('Calling API with message:', fullMessage.substring(0, 50));
  let parsedResponse = null;
  let isJSONMode = false;
  let fullReplyFromAPI = "";

  try {
    await callAPI(fullMessage, (chunk, fullText) => {
      // Remove thinking indicator when first chunk arrives
      if (thinkingIndicator && fullText.length > 0) {
        thinkingIndicator.remove();
        thinkingIndicator = null;
      }
      
      fullReplyFromAPI = fullText;
      if (contentElement && fullText) {
        const delta = fullText.slice(lastBufferedLength);
        lastBufferedLength = fullText.length;
        
        if (!isJSONMode && (fullText.trim().startsWith('{') || fullText.trim().startsWith('```json'))) {
          isJSONMode = true;
          charBuffer = []; 
        }
        
        if (!isJSONMode) {
          charBuffer.push(...delta.split(''));
          if (!typewriterActive) {
            typeNextChar();
          }
        } else {
          // While streaming JSON, try to extract and show the response field
          const responseMatch = fullText.match(/"response":\s*"((?:[^"\\]|\\.)*)/);
          if (responseMatch && responseMatch[1]) {
            const partialResponse = responseMatch[1]
              .replace(/\\n/g, '\n')
              .replace(/\\"/g, '"')
              .replace(/\\t/g, '\t');
            renderMarkdownAndMath(contentElement, partialResponse + "▊");
          } else if (!contentElement.textContent || contentElement.textContent === "Korah is thinking...") {
            contentElement.textContent = "Korah is thinking...";
          }
        }
      }
    });
      
      charBuffer = [];
      typewriterActive = false;
      
      if (contentElement) {
        const finalRawText = fullReplyFromAPI.trim();
        
        // Robust JSON parsing
        const robustParse = (text) => {
          try { return JSON.parse(text); } catch (e) {}
          const codeBlockMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
          if (codeBlockMatch) {
            try { return JSON.parse(codeBlockMatch[1].trim()); } catch (e) {}
          }
          const firstBrace = text.indexOf('{');
          const lastBrace = text.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1) {
            try { return JSON.parse(text.substring(firstBrace, lastBrace + 1)); } catch (e) {}
          }
          return null;
        };

        parsedResponse = robustParse(finalRawText);
        
        if (parsedResponse && typeof parsedResponse === 'object' && (parsedResponse.graph || parsedResponse.response)) {
          const graphData = parsedResponse.graph;
          const chatResponse = parsedResponse.response || '';
          
          if (graphData) {
            console.log('Updating graph with data:', graphData);
            updateSATGraph(graphData);
          }
          
          contentElement.textContent = '';
          if (chatResponse) {
            renderMarkdownAndMath(contentElement, chatResponse);
          } else if (graphData) {
            renderMarkdownAndMath(contentElement, "_Graph updated._");
          }
        } else {
          // If not valid JSON or missing fields, fall back to rendering the whole text
          contentElement.textContent = '';
          renderMarkdownAndMath(contentElement, finalRawText);
        }
        
        chatBody.scrollTop = chatBody.scrollHeight;
      }
      
      const textForSuggestions = parsedResponse?.response || fullReplyFromAPI;
      showSuggestions(textForSuggestions);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      typingIndicator?.classList.add('hidden');
      addMessage('assistant', 'Sorry, I encountered an error. Please try again. ' + error.message, true);
    }
  }

  async function callAPI(userMessage, onChunk = null) {
    const messagesWithSystem = [
      { role: 'system', content: SAT_MATH_SYSTEM_PROMPT + getFormatInstructions() },
      { role: 'user', content: userMessage }
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
      let errorMessage = `Error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch (_error) {}
      throw new Error(errorMessage);
    }

    if (!response.body) {
      throw new Error("No response body received");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = "";
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) continue;
          
          if (trimmedLine.startsWith("data: ")) {
            const data = trimmedLine.slice(6);
            if (data === "[DONE]") {
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed?.choices?.[0]?.delta?.content;
              if (content) {
                fullReply += content;
                if (onChunk) onChunk(content, fullReply);
              }
              
              const finishReason = parsed?.choices?.[0]?.finish_reason;
              if (finishReason) {
                console.log("Stream finish reason:", finishReason);
              }
            } catch (parseError) {
              console.error("Parse error:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Stream reading error:", error);
      throw error;
    }

    if (!fullReply) {
      throw new Error("API returned an empty response");
    }

    return fullReply;
  }

  function addMessage(role, text, isError = false, contentId = null) {
    const row = document.createElement('div');
    row.className = `msg-row ${role === 'user' ? 'user' : 'assistant'}`;
    
    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${role === 'user' ? 'user-av' : 'korah-av'}`;

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${role === 'user' ? 'user' : 'korah'}${isError ? ' error' : ''}`;
    
    const content = document.createElement('div');
    if (contentId) {
      content.id = contentId;
    }
    content.className = 'assistant-content';
    if (text) {
      renderMarkdownAndMath(content, text);
    }
    
    bubble.appendChild(content);
    row.appendChild(avatar);
    row.appendChild(bubble);
    
    messagesList?.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    return row;
  }

  function normalizeMathDelimiters(markdownText) {
    if (!markdownText) return markdownText;

    return markdownText
      .split(/(```[\s\S]*?```)/g)
      .map(function (segment) {
        if (segment.startsWith("```")) return segment;

        return segment
          .replace(/`([^`]+)`/g, function (_, expr) {
            const trimmed = expr.trim();
            if (/[_^\\{}]/.test(trimmed)) {
              return "$" + trimmed + "$";
            }
            return "`" + expr + "`";
          })
          .replace(/\\\((.*?)\\\)/gs, function (_, expr) {
            return "$" + expr.trim() + "$";
          })
          .replace(/\\[(.*?)]/gs, function (_, expr) {
            return "$$" + expr.trim() + "$$";
          })
          .replace(/([a-zA-Z])_([a-zA-Z0-9]+|\{[^}]+\})/g, "$1_{$2}");
      })
      .join("");
  }

  function renderMarkdownAndMath(container, text) {
    if (!text) return;
    
    const normalizedMarkdown = normalizeMathDelimiters(text);
    let html = normalizedMarkdown;
    
    try {
      if (window.marked && typeof window.marked.parse === "function") {
        html = window.marked.parse(normalizedMarkdown);
      } else {
        html = normalizedMarkdown
          .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
          .replace(/\n/g, "<br/>");
      }
    } catch (e) {
      console.error("Markdown render error:", e);
      html = normalizedMarkdown.replace(/\n/g, "<br/>");
    }
    
    container.innerHTML = html;
    
    container.querySelectorAll('pre code').forEach(block => {
      if (block.classList.contains('language-graph-update') || block.classList.contains('lang-graph-update')) {
        return;
      }
      
      const pre = block.parentElement;
      if (pre && pre.tagName === 'PRE') {
        pre.style.background = 'var(--sf2)';
        pre.style.padding = '12px';
        pre.style.borderRadius = '8px';
        pre.style.overflow = 'auto';
      }
    });
    
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(container, {
        delimiters: [
          {left: '$$', right: '$$', display: true},
          {left: '$', right: '$', display: false},
          {left: '\\(', right: '\\)', display: false}
        ],
        throwOnError: false
      });
    }
  }

  function showSuggestions(response) {
    if (!suggestionBar) return;
    
    const text = response.toLowerCase();
    let suggestions = [];

    if (text.includes('quadratic') || text.includes('x²')) {
      suggestions = ["What's the vertex form?", "How do I find the roots?"];
    } else if (text.includes('linear') || text.includes('y =') || text.includes('slope')) {
      suggestions = ["Show me another example", "What's the y-intercept?"];
    } else if (text.includes('inequality')) {
      suggestions = ["How do I graph inequalities?", "What's the test point method?"];
    } else if (text.includes('system') || text.includes('system of equations')) {
      suggestions = ["Show me substitution", "Show me elimination"];
    } else if (text.includes('function') || text.includes('f(x)')) {
      suggestions = ["What transformations apply?", "How do I find the domain?"];
    } else if (text.includes('triangle') || text.includes('SOHCAHTOA') || text.includes('trigonometry')) {
      suggestions = ["Show me a practice problem", "When do I use sine vs cosine?"];
    } else if (text.includes('circle') || text.includes('radius')) {
      suggestions = ["How do I write the equation?", "Show me completing the square"];
    } else {
      suggestions = ["Show me a practice problem", "Explain the next step"];
    }

    if (suggestions.length === 0) {
      suggestionBar.innerHTML = '';
      return;
    }

    suggestionBar.innerHTML = suggestions.map(s => 
      `<button class="suggestion-btn">${s}</button>`
    ).join('');

    suggestionBar.querySelectorAll('.suggestion-btn').forEach(btn => {
      btn.addEventListener('click', () => sendMessage(btn.textContent));
    });
  }

  function bindEventListeners() {
    console.log('Binding event listeners', { sendBtn, welcomeSendBtn, input, welcomeInput });
    sendBtn?.addEventListener('click', () => { console.log('Send button clicked'); sendMessage(input?.value?.trim() || ''); });
    welcomeSendBtn?.addEventListener('click', () => { console.log('Welcome send button clicked'); sendMessage(welcomeInput?.value?.trim() || ''); });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input.value.trim());
      }
    });
    welcomeInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(welcomeInput.value.trim());
      }
    });

    document.querySelectorAll('.quick-prompt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const prompt = btn.dataset.prompt;
        sendMessage(prompt);
      });
    });

    clearChatBtn?.addEventListener('click', () => {
      messagesList && (messagesList.innerHTML = '');
      welcomeScreen?.classList.remove('hidden');
      document.getElementById('chat-input-area')?.classList.add('hidden');
      suggestionBar && (suggestionBar.innerHTML = '');
    });

  }

  function init() {
    console.log('SAT Math chat initializing...', {
      input: !!input,
      welcomeInput: !!welcomeInput,
      sendBtn: !!sendBtn,
      welcomeSendBtn: !!welcomeSendBtn,
      messagesList: !!messagesList,
      documentReadyState: document.readyState
    });
    try {
      initializeSATGraph();
      bindGraphControls();
      bindEventListeners();
      console.log('Init completed successfully');
    } catch (e) {
      console.error('Init error:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  } catch (e) {
    console.error('SAT Math Chat Error:', e);
  }

  function initResizeHandle() {
    const handle = document.getElementById('resize-handle');
    const graphPanel = document.getElementById('sat-graph-panel');
    const chatPanel = document.getElementById('main-content');
    if (!handle || !graphPanel || !chatPanel) return;

    let isDragging = false;
    let startY;
    let startGraphHeight;

    handle.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.clientY;
      startGraphHeight = graphPanel.offsetHeight;
      document.body.style.cursor = 'row-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const deltaY = e.clientY - startY;
      const newGraphHeight = startGraphHeight + deltaY;
      const minHeight = 5 * 16;
      const maxHeight = window.innerHeight * 0.7;
      if (newGraphHeight >= minHeight && newGraphHeight <= maxHeight) {
        graphPanel.style.flex = 'none';
        graphPanel.style.height = newGraphHeight + 'px';
        chatPanel.style.flex = '1';
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  function handleResize() {
    const handle = document.getElementById('resize-handle');
    const graphPanel = document.getElementById('sat-graph-panel');
    const chatPanel = document.getElementById('main-content');
    const isMinimized = window.innerWidth <= 56.25 * 16;
    if (handle) {
      handle.style.display = isMinimized ? 'block' : 'none';
    }
    if (!isMinimized && graphPanel && chatPanel) {
      graphPanel.style.flex = '';
      graphPanel.style.height = '';
      chatPanel.style.flex = '';
      graphPanel.style.minHeight = '';
      chatPanel.style.minHeight = '';
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  const checkAndInitResize = setInterval(() => {
    if (document.getElementById('resize-handle')) {
      initResizeHandle();
      clearInterval(checkAndInitResize);
    }
  }, 100);
})();
