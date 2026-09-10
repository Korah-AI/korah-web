/**
 * api.js - Prompts, /api/r calls, JSON parsing for essay annotator
 */

const API_ENDPOINT = '/api/r';
const MODEL = 'gemini-2.5-flash';

const ANNOTATION_PROMPT = `You are a college essay annotator. You analyze essays and provide feedback through annotations.

You MUST return ONLY a valid JSON object with this exact structure:
{
  "annotations": [
    {
      "quotedText": "exact text from the essay",
      "paragraphIndex": 0,
      "commentType": "socratic" | "diagnostic" | "structural",
      "comment": "your feedback comment"
    }
  ]
}

RULES:
- NEVER write replacement prose. No suggested sentences, no "try something like this."
- Every annotation must be one of three types:
  1. Socratic: Asks a question to make the student think. "You say this changed you. What did you actually do differently the next week?"
  2. Diagnostic: Identifies what's weak without fixing it. "This is telling. The reader learns you're persistent but never watches you persist."
  3. Structural: Points out repetition or organization issues. "This paragraph and paragraph 4 make the same point."
- Return the EXACT text you are commenting on, not paraphrased.
- Include the paragraph index (0-based) where the text appears.
- Aim for 5-10 annotations total, focusing on the most impactful feedback.`;

const SCORING_PROMPT = `You are a college essay scoring rubric. Score the essay on six dimensions.

You MUST return ONLY a valid JSON object with this exact structure:
{
  "scores": {
    "writing": {
      "score": 7,
      "items": [
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" },
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" }
      ]
    },
    "detail": {
      "score": 6,
      "items": [
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" },
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" }
      ]
    },
    "voice": {
      "score": 8,
      "items": [
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" },
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" }
      ]
    },
    "reflection": {
      "score": 5,
      "items": [
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" },
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" }
      ]
    },
    "curiosity": {
      "score": 7,
      "items": [
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" },
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" }
      ]
    },
    "contribution": {
      "score": 6,
      "items": [
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" },
        { "evidence": "exact quote from the essay", "feedback": "one actionable suggestion, no replacement prose" }
      ]
    }
  }
}

SCORING RUBRIC (each dimension 1-10):
- Writing (1-10): Clarity, sentence variety, word choice. A 3 has awkward phrasing and run-ons. A 7 has clear prose with some variety. A 9 is polished and distinctive.
- Detail (1-10): Specificity, concrete examples, sensory language. A 3 is vague and generic. A 7 has specific moments. A 9 is vivid and particular.
- Voice (1-10): Personality, authenticity, distinctive style. A 3 sounds like anyone. A 7 has personality. A 9 is unmistakably the student's own.
- Reflection (1-10): Depth of self-analysis, growth awareness. A 3 describes events without insight. A 7 shows genuine self-examination. A 9 demonstrates profound growth.
- Curiosity (1-10): Intellectual engagement, wonder, exploration. A 3 is task-oriented. A 7 shows genuine interest. A 9 radiates intellectual passion.
- Contribution (1-10): What the student brings to a community. A 3 is abstract. A 7 shows specific impact. A 9 demonstrates transformative contribution.

RULES:
- Temperature must be 0 for consistent scoring.
- Each dimension MUST have at least 2 items in its items array, but include as many as needed to cover significant portions of the essay. Each item MUST include a different exact quote from the essay as evidence.
- Each feedback MUST be one specific, actionable suggestion tied to its evidence quote. Never write replacement prose. Never suggest specific rewording.
- Each item's evidence MUST be unique — do not reuse the same quote across items or dimensions.
- Aim to highlight as much of the essay as possible. Include items for strong passages, weak passages, and passages that could be improved. The goal is comprehensive coverage.
- Factor in the word limit: a 100-word supplemental should not be graded on reflection depth the same as a 650-word personal statement.`;

const FOCUS_PROMPT = `You are a college essay coach. The student has a specific concern about their essay.

Return ONLY a valid JSON array of annotations:
[
  {
    "quotedText": "exact text from the essay",
    "paragraphIndex": 0,
    "commentType": "socratic" | "diagnostic" | "structural",
    "comment": "feedback addressing the student's specific concern"
  }
]

Focus ONLY on the student's stated concern. Be direct and specific.`;

function stripCodeFences(text) {
  var trimmed = (text || '').trim();
  if (!trimmed) return '';
  if (trimmed.indexOf('```') !== -1) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }
  return trimmed.trim();
}

function parseJsonFromResponse(text) {
  var trimmed = stripCodeFences(text);
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch (_) {}
  var start = trimmed.indexOf('{');
  var end = trimmed.lastIndexOf('}') + 1;
  if (start === -1 || end <= start) {
    var arrStart = trimmed.indexOf('[');
    var arrEnd = trimmed.lastIndexOf(']') + 1;
    if (arrStart === -1 || arrEnd <= arrStart) return null;
    try {
      return JSON.parse(trimmed.slice(arrStart, arrEnd));
    } catch (_) {
      return null;
    }
  }
  try {
    return JSON.parse(trimmed.slice(start, end));
  } catch (_) {
    return null;
  }
}

async function callApi(systemPrompt, userContent) {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent }
        ],
        response_format: { type: 'json_object' },
        temperature: 0
      })
    });
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content;
    return parseJsonFromResponse(content);
  } catch (e) {
    console.warn('API call failed:', e);
    return null;
  }
}

async function annotate(essayText, essayType, school, prompt, wordLimit) {
  const paragraphs = essayText.split(/\n\n+/).filter(p => p.trim());
  const numbered = paragraphs.map((p, i) => `[Paragraph ${i}]: ${p}`).join('\n\n');
  const userMsg = `Essay type: ${essayType === 'supplemental' ? 'Supplemental' : 'Personal Statement'}\nWord limit: ${wordLimit}\n${school ? `Target school: ${school}` : ''}\n${prompt ? `Prompt: ${prompt}` : ''}\n\nEssay:\n${numbered}`;
  const result = await callApi(ANNOTATION_PROMPT, userMsg);
  return result?.annotations || [];
}

async function score(essayText, essayType, school, prompt, wordLimit) {
  const userMsg = `Essay type: ${essayType === 'supplemental' ? 'Supplemental' : 'Personal Statement'}\nWord limit: ${wordLimit}\n${school ? `Target school: ${school}` : ''}\n${prompt ? `Prompt: ${prompt}` : ''}\n\nEssay:\n${essayText}`;
  const result = await callApi(SCORING_PROMPT, userMsg);
  return result?.scores || null;
}

async function focusNote(essayText, focusNote, essayType, school, prompt, wordLimit) {
  const userMsg = `Student's concern: "${focusNote}"\nEssay type: ${essayType === 'supplemental' ? 'Supplemental' : 'Personal Statement'}\nWord limit: ${wordLimit}\n\nEssay:\n${essayText}`;
  const result = await callApi(FOCUS_PROMPT, userMsg);
  return Array.isArray(result) ? result : [];
}

async function feedbackOnSelection(selectedText, surroundingContext, essayType) {
  const selectionPrompt = `You are a college essay annotator. The student selected a specific passage and wants feedback on it.

Return ONLY a valid JSON array:
[
  {
    "quotedText": "the selected text",
    "paragraphIndex": 0,
    "commentType": "socratic" | "diagnostic" | "structural",
    "comment": "feedback on this specific passage"
  }
]

Rules: Never write replacement prose. Be specific to the selected text.`;
  const userMsg = `Selected text: "${selectedText}"\n\nSurrounding context: ${surroundingContext}`;
  const result = await callApi(selectionPrompt, userMsg);
  return Array.isArray(result) ? result : [];
}

const EssayAPI = { annotate, score, focusNote, feedbackOnSelection };
export default EssayAPI;
