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

GRAPH INTERACTION: When you want to display or update the graph, include a JSON code block with the "graph-update" language tag:
\`\`\`graph-update
{
  "expressions": [
    {"latex": "y = x^2", "color": "#4285F4", "secret": false}
  ],
  "viewport": {"xmin": -10, "xmax": 10, "ymin": -10, "ymax": 10}
}
\`\`\`

KaTeX delimiter policy (REQUIRED for all math):
- Inline math: $...$ (single dollar signs)
- Display math: $$...$$ (double dollar signs)
- NEVER use \\(...\\), \\[...\\], or bare math without delimiters

Format your responses with:
- Clear headings for major steps
- KaTeX for all mathematical expressions
- Graph updates when visualizing functions, equations, or data
- Practice problems with worked solutions when appropriate`;

  const FORMAT_INSTRUCTIONS = `
- KATEX DELIMITER POLICY (REQUIRED):
  - Inline math: $...$ (single dollar signs)
  - Display math: $$...$$ (double dollar signs)
- NEVER use \\(...\\), \\[...\\], [ ... ], or bare math without delimiters
- Ensure all math delimiters are balanced

GRAPH UPDATES: Use graph-update code blocks to update the persistent Desmos graph.

Always format responses using GitHub-flavored Markdown.`;

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

    const graphContainer = document.getElementById('sat-graph-container');

    satMathCalculator.removeExpressions({});

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
            color: expr.color || Desmos.Colors.BLUE,
            hidden: expr.hidden || false,
            lineStyle: expr.lineStyle || 'SOLID',
            lineWidth: expr.lineWidth || 2,
          });
        }
      });
    }

    graphContainer.classList.add('graph-updated');
    setTimeout(() => graphContainer.classList.remove('graph-updated'), 500);

    captureGraphState();
  }

  function renderGraphUpdates(container) {
    const codeBlocks = container.querySelectorAll(
      'pre code.language-graph-update, pre code.lang-graph-update'
    );

    for (const block of codeBlocks) {
      const code = block.textContent.trim();
      try {
        const data = JSON.parse(code);
        updateSATGraph(data);
        block.parentElement.remove();
      } catch (e) {
        console.warn('Failed to parse graph-update:', e);
      }
    }
  }

  function bindGraphControls() {
    document.getElementById('sat-graph-reset')?.addEventListener('click', () => {
      if (satMathCalculator) {
        satMathCalculator.setMathBounds({
          left: -10,
          right: 10,
          bottom: -10,
          top: 10,
        });
      }
    });

    document.getElementById('sat-graph-clear')?.addEventListener('click', () => {
      if (satMathCalculator) {
        satMathCalculator.removeExpressions({});
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

    console.log('Calling API with message:', fullMessage.substring(0, 50));
    try {
      const response = await callAPI(fullMessage);
      console.log('API response received:', response.substring(0, 50));
      
      typingIndicator?.classList.add('hidden');
      
      const assistantRow = addMessage('assistant', response);
      
      if (assistantRow) {
        renderGraphUpdates(assistantRow);
      }

      showSuggestions(response);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      typingIndicator?.classList.add('hidden');
      addMessage('assistant', 'Sorry, I encountered an error. Please try again. ' + error.message, true);
    }
  }

  async function callAPI(userMessage) {
    const messagesWithSystem = [
      { role: 'system', content: SAT_MATH_SYSTEM_PROMPT + FORMAT_INSTRUCTIONS },
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

  function addMessage(role, text, isError = false) {
    const row = document.createElement('div');
    row.className = `msg-row ${role === 'user' ? 'user' : 'assistant'}`;
    
    const avatar = document.createElement('div');
    avatar.className = `msg-avatar ${role === 'user' ? 'user-av' : 'korah-av'}`;
    if (role === 'assistant') {
      avatar.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    } else {
      avatar.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
    }

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${role === 'user' ? 'user' : 'korah'}${isError ? ' error' : ''}`;
    
    const content = document.createElement('div');
    content.className = 'assistant-content';
    renderMarkdownAndMath(content, text);
    
    bubble.appendChild(content);
    row.appendChild(avatar);
    row.appendChild(bubble);
    
    messagesList?.appendChild(row);
    chatBody.scrollTop = chatBody.scrollHeight;
    
    return row;
  }

  function renderMarkdownAndMath(container, text) {
    if (!text) return;
    
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    let html = marked.parse(escapedText);
    
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
          {left: '$', right: '$', display: false}
        ],
        throwOnError: false
      });
    } else if (typeof katex === 'object') {
      container.querySelectorAll('script[type="math/tex"]').forEach(script => {
        const displayMode = script.tagName === 'DIV';
        try {
          katex.render(script.textContent, script, { displayMode });
        } catch (e) {}
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

    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    sidebarToggle?.addEventListener('click', () => {
      sidebar?.classList.toggle('collapsed');
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
})();
