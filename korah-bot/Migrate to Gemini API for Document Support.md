# Migrate to Gemini API for Document Support
## Problem
The current stack proxies AI calls through OpenAI \(`gpt-4o-mini`\)\. PDFs and other non\-image documents are treated as generic attachments and not parsed as model\-readable content, which limits document support\.
## Current State
* `../korah-beta- 2/api/proxy.js` provides `POST /api/proxy` as an OpenAI passthrough with optional streaming\.
* `app/korah-chat.js` uses `API_ENDPOINT = "https://korah-beta.vercel.app/api/proxy"` and `MODEL = "gpt-4o-mini"`\.
* `app/korah-chat.js` file handling supports image and text content; PDFs are currently treated as `type: "other"` and only passed as filename context\.
* `study/js/study-api.js` uses `CHAT_PROXY = "https://korah-beta.vercel.app/api/proxy"` and `MODEL = "gpt-4o-mini"`\.
* `api/generate-study-item.js` routes generation through the same proxy with OpenAI request shape and `response_format` for JSON objects\.
## Proposed Changes
### 1\) Add a Gemini proxy endpoint in shared backend
Create `../korah-beta- 2/api/proxy-gemini.js` that accepts OpenAI\-style payloads and translates them to Gemini requests so current clients remain stable\.
* Input compatibility: `messages`, `model`, `temperature`, `stream`, `response_format`\.
* Message mapping:
    * OpenAI `system` message \-> Gemini `systemInstruction`\.
    * OpenAI `assistant` role \-> Gemini `model` role\.
    * Text parts remain text parts\.
    * `image_url` data URLs map to Gemini `inlineData` with detected MIME\.
    * `data:application/pdf;base64,...` maps to Gemini PDF inline content\.
* Output compatibility:
    * Non\-streaming: return OpenAI\-style `choices[0].message.content` envelope\.
    * Streaming: emit SSE chunks shaped like OpenAI deltas \(`choices[0].delta.content`\) plus `[DONE]`\.
* Environment/config:
    * Add `GEMINI_API_KEY` in Vercel env\.
    * Keep existing CORS handling and method guard parity with current proxy\.
### 2\) Switch chat client to Gemini proxy
Update `app/korah-chat.js`:
* `API_ENDPOINT` \-> `https://korah-beta.vercel.app/api/proxy-gemini`\.
* `MODEL` \-> a Gemini model identifier \(for example `gemini-2.0-flash`\)\.
* Extend attachment processing:
    * Add explicit PDF handling \(`FileReader.readAsDataURL`\) with `type: "pdf"`\.
    * Preserve existing image/text behavior\.
* Update API message builder:
    * For PDF attachments, include an `image_url` style part containing a PDF data URL so the proxy can convert it to Gemini inline PDF\.
### 3\) Switch study generation clients
* `study/js/study-api.js`: update `CHAT_PROXY` and `MODEL` to Gemini equivalents\.
* `api/generate-study-item.js`: update proxy URL constant and model constant to Gemini equivalents while preserving existing normalize/parse logic\.
* Keep request/response shapes unchanged so study rendering code does not require downstream schema changes\.
### 4\) Deployment and fallback strategy
* Keep `/api/proxy` \(OpenAI\) active during migration\.
* Roll out `/api/proxy-gemini` first, then point web clients to it\.
* If Gemini request translation errors appear, revert client constants to `/api/proxy` quickly without structural rollback\.
## Validation Plan
* Proxy contract tests:
    * non\-streaming text\-only request;
    * streaming text request;
    * mixed text \+ image request;
    * text \+ PDF data URL request\.
* App verification:
    * Chat reply streaming still renders correctly;
    * study generation still parses JSON and markdown content;
    * PDF attachment contributes actual document context to replies\.
* Regression check:
    * flashcards/study guide/practice test flows still save and render in study library\.
## Risks and Mitigations
* Risk: mismatch between Gemini stream format and OpenAI SSE parser expectations\.
    * Mitigation: normalize server\-side to exact OpenAI delta format\.
* Risk: large PDFs exceed payload limits\.
    * Mitigation: enforce file\-size caps in client before upload and return user\-friendly validation errors\.
* Risk: response JSON strictness differences\.
    * Mitigation: retain current robust parsing \(`stripCodeFences`, bracket extraction, normalization\) in study APIs\.
