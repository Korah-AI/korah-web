# Migrate to Gemini API for Document Support

## Problem

The current stack proxies AI calls through OpenAI (`gpt-4o-mini`). PDFs and other non-image documents are treated as generic attachments and not parsed as model-readable content, which limits document support. Gemini natively supports PDF inline data (`inlineData` with `mimeType: "application/pdf"`), enabling real document comprehension.

## Current State

- `app/korah-chat.js:3-4` — `API_ENDPOINT = "https://korah-beta.vercel.app/api/proxy"` and `MODEL = "gpt-4o-mini"`. Uses OpenAI chat completions request shape with streaming SSE (`choices[0].delta.content`).
- `app/korah-chat.js:49-63` — `processFile()` handles images and text; PDFs fall through to `type: "other"` and are only passed as `[Attached file: name]` with no content extraction.
- `app/korah-chat.js:157-177` — `buildApiMessages()` enriches messages with file attachments. Images use `image_url` parts; text is inlined; PDFs are not sent as readable content.
- `study/js/study-api.js:8-9` — `CHAT_PROXY = "https://korah-beta.vercel.app/api/proxy"` and `MODEL = "gpt-4o-mini"`. Used as fallback when the backend API fails.
- `api/generate-study-item.js:9-10` — `OPENAI_URL = "https://korah-beta.vercel.app/api/proxy"` and `MODEL = "gpt-4o-mini"`. Reads `process.env.OPENAI_API_KEY` (line 160).
- The existing proxy at `../korah-beta- 2/api/proxy.js` is a simple OpenAI passthrough. It forwards `req.body` directly to `https://api.openai.com/v1/chat/completions` and pipes the response (streaming or JSON) back.

## Proposed Changes

### 1) Create `api/gem-proxy.js` — Gemini translation proxy

New Vercel serverless function in this repo at `api/gem-proxy.js`. It accepts OpenAI-shaped payloads from all three clients and translates them to Gemini REST API calls, then normalizes the response back to OpenAI shape so no client-side parsing logic changes.

**Environment:** Add `GEMINI_API_KEY` to this project's Vercel environment variables.

**Request translation (OpenAI → Gemini):**

- Extract `system` messages from `messages[]` → Gemini `systemInstruction: { parts: [{ text }] }`.
- Map remaining messages: OpenAI `assistant` role → Gemini `model` role; `user` stays `user`.
- For each message, convert `content` to Gemini `parts[]`:
  - String content → `{ text: content }`
  - Array content (multimodal): iterate parts:
    - `{ type: "text", text }` → `{ text }`
    - `{ type: "image_url", image_url: { url: "data:image/...;base64,..." } }` → `{ inlineData: { mimeType, data } }` (strip data-URL prefix)
    - `{ type: "image_url", image_url: { url: "data:application/pdf;base64,..." } }` → `{ inlineData: { mimeType: "application/pdf", data } }`
- Map `temperature` → `generationConfig.temperature`.
- Map `response_format: { type: "json_object" }` → `generationConfig.responseMimeType: "application/json"`.
- Ignore `model` from body; use the model constant in the proxy (e.g. `gemini-2.0-flash`).

**Gemini REST endpoints:**

- Non-streaming: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent` with `x-goog-api-key` header.
- Streaming: `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse` with `x-goog-api-key` header.

**Response translation (Gemini → OpenAI):**

- **Non-streaming:** Gemini returns `{ candidates: [{ content: { parts: [{ text }] } }] }`. Wrap as `{ choices: [{ message: { role: "assistant", content: text } }] }`.
- **Streaming:** Gemini SSE emits `data: { "candidates": [{ "content": { "parts": [{ "text": "..." }] } }] }` chunks. For each chunk, re-emit as `data: { "choices": [{ "delta": { "content": text } }] }\n\n`. After stream ends, emit `data: [DONE]\n\n`.

**CORS / method guards:** Mirror the existing proxy pattern — `Access-Control-Allow-Origin: *`, allow `POST, OPTIONS`, return 200 on OPTIONS, 405 on other methods.

**Vercel config:** Add `export const config = { maxDuration: 300 };` to match the existing proxy timeout.

### 2) Update `app/korah-chat.js` — chat client

**Line 3:** Change `API_ENDPOINT` to the gem-proxy URL on this project's Vercel deployment (e.g. `"https://<this-project>.vercel.app/api/gem-proxy"` or same-origin `"/api/gem-proxy"` if the chat app is served from the same Vercel project).

**Line 4:** Change `MODEL` to `"gemini-2.0-flash"` (the proxy ignores this but it's useful for documentation/logging).

**Lines 49-63 (`processFile`):** Add a PDF branch:
```
const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
```
For PDFs, use `FileReader.readAsDataURL(file)` and resolve with `{ file, name, size, type: 'pdf', dataUrl: reader.result, content: null }`.

**Lines 157-177 (`buildApiMessages`):** Add PDF handling alongside the existing image branch:
```
} else if (f.type === 'pdf' && f.dataUrl) {
  imageParts.push({ type: 'image_url', image_url: { url: f.dataUrl } });
}
```
This sends the PDF data URL as an `image_url` part, which the proxy will detect (by MIME prefix `data:application/pdf`) and convert to Gemini `inlineData`.

**File size validation:** Add a client-side check (e.g. 15MB cap) in `handleNewFiles()` before processing PDFs, since Gemini inline data has a 20MB total request limit.

### 3) Update `study/js/study-api.js` — study content generation (client fallback)

**Line 8:** Change `CHAT_PROXY` to the gem-proxy URL.

**Line 9:** Change `MODEL` to `"gemini-2.0-flash"`.

No other changes needed — the `tryChatProxy()` function already sends OpenAI-shaped requests and parses `choices[0].message.content`, which the gem-proxy will return.

The `processFile` and `toBase64` logic in `generateStudyContent` (lines 186-221) should also add PDF handling to match the chat client changes, so PDFs attached in the study flow are sent as data URLs.

### 4) Update `api/generate-study-item.js` — study content generation (serverless)

**Line 9:** Change `OPENAI_URL` to the gem-proxy URL (same-origin: `"/api/gem-proxy"` or absolute URL if cross-origin).

**Line 10:** Change `MODEL` to `"gemini-2.0-flash"`.

**Line 160:** Change `process.env.OPENAI_API_KEY` to `process.env.GEMINI_API_KEY`. Update the error message on line 163 accordingly.

**Lines 213-225:** The `fetch` call already sends OpenAI-shaped JSON. Since the gem-proxy handles translation, the request shape stays the same. However, since `generate-study-item.js` and `gem-proxy.js` both run as Vercel functions in the same project, it may be more efficient to call the Gemini API directly from `generate-study-item.js` instead of going through the proxy. This is optional but would reduce latency by avoiding an extra network hop.

### 5) Deployment and rollback strategy

- Add `GEMINI_API_KEY` to this project's Vercel env vars.
- Deploy `api/gem-proxy.js` first and verify it independently with curl.
- Update client constants in a single commit.
- Keep the old OpenAI proxy at `../korah-beta- 2/api/proxy.js` alive. If issues arise, revert the three constant changes (one commit) to fall back to OpenAI.

## Validation Plan

**Proxy contract tests (manual curl or script):**
- Non-streaming text-only request → valid `choices[0].message.content` response.
- Streaming text request → SSE chunks with `choices[0].delta.content` shape, ending with `[DONE]`.
- Mixed text + base64 image request → model describes the image.
- Text + base64 PDF request → model summarizes PDF content (proves native PDF support works).
- Request with `response_format: { type: "json_object" }` → valid JSON in response content.

**App verification:**
- Chat reply streaming renders correctly in `korah-chat.js` (markdown, KaTeX, mermaid, desmos).
- Study generation (flashcards, study guide, practice test) still parses JSON and markdown.
- PDF attachment contributes actual document context to replies (not just filename).
- Image attachment still works as before.
- Auto-title generation still works.

**Regression check:**
- Flashcards/study guide/practice test flows save and render in the study library.
- Tutoring mode still appends instructions correctly.
- File size validation rejects files over the limit with a user-friendly message.

## Risks and Mitigations

- **Gemini SSE format mismatch:** Gemini streams `data: {"candidates":[...]}` not `data: {"choices":[...]}`. Mitigation: the proxy normalizes every chunk server-side to exact OpenAI delta shape, so the existing client SSE parser (`korah-chat.js:1061-1088`) works unchanged.
- **Large PDFs exceed 20MB inline limit:** Mitigation: enforce a 15MB file-size cap in the client (`handleNewFiles`) and show a validation toast. For files over 15MB, consider using the Gemini Files API in a future iteration.
- **Response JSON differences:** Gemini may format JSON slightly differently (extra whitespace, different key ordering). Mitigation: the existing robust parsing (`stripCodeFences`, bracket extraction, `normalizeContent`) in both `study-api.js` and `generate-study-item.js` already handles these variations.
- **`response_format` not producing strict JSON:** Gemini's `responseMimeType: "application/json"` is equivalent but may behave slightly differently. Mitigation: the existing `parseJsonFromResponse` fallback (bracket extraction) will catch edge cases.
