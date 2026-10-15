/**
 * demo-data.js - localhost-only placeholder essay
 *
 * Builds one fake essay out of data/sample-essay.json and the scores in
 * data/canned-feedback.json so the essays list and the editor can be looked at
 * with real-looking content without running an analysis. Returns null off
 * localhost, and nothing here is ever written to Firestore.
 */
export const DEMO_ESSAY_ID = 'demo-essay';

export function isLocalhost() {
  return location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

let cached = null;

export async function getDemoEssay() {
  if (!isLocalhost()) return null;
  if (cached) return cached;
  try {
    const [essay, feedback] = await Promise.all([
      fetch('data/sample-essay.json').then(r => r.json()),
      fetch('data/canned-feedback.json').then(r => r.json()),
    ]);
    cached = {
      id: DEMO_ESSAY_ID,
      title: essay.title,
      type: essay.type || 'personal_statement',
      school: '',
      schoolPrompt: '',
      wordLimit: 650,
      applicationWebsite: 'common_app',
      applicationPrompt: 'The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure. How did it affect you, and what did you learn from the experience?',
      focusNote: '',
      content: essay.content,
      scores: feedback.scores,
      updatedAt: new Date().toISOString(),
    };
    return cached;
  } catch (e) {
    console.warn('Demo essay unavailable:', e);
    return null;
  }
}
