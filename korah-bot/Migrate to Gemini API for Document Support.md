# Gemini API Migration for PDF Support

This project has been migrated to use **Gemini 2.0 Flash** for all AI capabilities, specifically enabling native PDF comprehension and multimodal support.

## Changes Made

1.  **New Proxy Layer (`api/gem-proxy.js`):**
    - Translates OpenAI-format requests to Gemini 2.0 Flash.
    - Handles native PDF processing via `inlineData`.
    - Maps system instructions and roles (`assistant` -> `model`).
    - Provides a streaming SSE translator to maintain compatibility with existing frontend logic.

2.  **Frontend Updates (`app/korah-chat.js`):**
    - Updated constants to use the Gemini proxy and model.
    - Enhanced document processing to handle PDF files as multimodal data.
    - Correctly maps PDFs to the Gemini proxy using Data URLs.

3.  **Study API Enhancements (`study/js/study-api.js`):**
    - Updated to utilize Gemini for generating study guides, flashcards, and practice tests.
    - Added support for including PDF content directly in the generation prompt.

4.  **Serverless Generation Update (`api/generate-study-item.js`):**
    - Migrated to call Gemini API directly.
    - Implemented native document support for high-quality study material generation from PDFs and images.

## Environment Requirements

Ensure the following environment variable is set in Vercel:
- `GEMINI_API_KEY`: Your Google AI Studio API key.

The project no longer requires `OPENAI_API_KEY` for core chat or study generation functionality.
