export const config = {
  maxDuration: 300,
};

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const {
    messages = [],
    model: requestedModel,
    temperature,
    stream = false,
    response_format,
  } = req.body;

  // 1. Translate Request (OpenAI -> Gemini)
  // Mapping roles and content to Gemini format
  const model = requestedModel || "gemini-2.5-flash";
  const systemMessage = messages.find(m => m.role === 'system');
  const chatMessages = messages.filter(m => m.role !== 'system');

  const contents = chatMessages.map(m => {
    const role = m.role === 'assistant' ? 'model' : 'user';
    let parts = [];

    if (typeof m.content === 'string') {
      parts.push({ text: m.content });
    } else if (Array.isArray(m.content)) {
      parts = m.content.map(part => {
        if (part.type === 'text') {
          return { text: part.text };
        } else if (part.type === 'image_url') {
          const url = part.image_url.url;
          if (url.startsWith('data:')) {
            const [header, data] = url.split(',');
            const mimeType = header.match(/:(.*?);/)[1];
            return {
              inlineData: {
                mimeType,
                data
              }
            };
          }
        }
        return null;
      }).filter(Boolean);
    }

    return { role, parts };
  });

  const body = {
    contents,
    generationConfig: {
      temperature: temperature ?? 0.7,
      responseMimeType: response_format?.type === 'json_object' ? 'application/json' : 'text/plain',
    }
  };

  if (systemMessage) {
    body.systemInstruction = {
      parts: [{ text: systemMessage.content }]
    };
  }

  const endpoint = stream 
    ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`
    : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json({ error: 'Gemini API Error', details: errorData });
    }

    if (stream) {
      // 2. Translate Streaming Response (Gemini SSE -> OpenAI SSE)
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr === '[DONE]') continue;
              
              const data = JSON.parse(jsonStr);
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              
              if (content) {
                const openAiChunk = {
                  choices: [{
                    delta: { content },
                    index: 0,
                    finish_reason: null
                  }]
                };
                res.write(`data: ${JSON.stringify(openAiChunk)}\n\n`);
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    } else {
      // 3. Translate Non-Streaming Response (Gemini -> OpenAI)
      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      const openAiResponse = {
        choices: [{
          message: {
            role: 'assistant',
            content: content
          },
          finish_reason: 'stop',
          index: 0
        }]
      };
      return res.status(200).json(openAiResponse);
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
