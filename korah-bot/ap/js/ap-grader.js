/**
 * AP FRQ grader — turns a confirmed transcript (or a set of page photos) into
 * point-by-point verdicts against the structured rubric.
 *
 * Two pipelines:
 *  - transcribe(frq, imageDataUrls): vision read of handwritten pages.
 *  - grade(frq, transcript): rubric-point evaluation of the confirmed text.
 *
 * Both call the shared /api/r Gemini proxy. When running locally (/api/r
 * 404s), or when the URL is forced with ?canned=1, the canned data files
 * under ../data/<slug>/ are used instead:
 *  - canned-transcript.json   feeds the transcription review step
 *  - canned-grading.json      feeds the entire feedback screen
 * This is how the UI is built and styled without burning a single API call.
 *
 * The one rule that defines the product (never generate a score directly):
 * grade() validates every rubric point id is present, forces earned to a
 * boolean, and recomputes score = count of earned verdicts. Whatever the model
 * returned for "score" is ignored.
 */

(function (global) {
  'use strict';

  const MODEL = 'gemini-2.5-flash';
  const MAX_PAYLOAD = 4.4 * 1024 * 1024; // just under /api/r's 4.5MB cap

  function canned() {
    const p = new URLSearchParams(location.search);
    return p.get('canned') === '1' ||
      /^localhost$|^(127\.|0\.0\.0\.0|\[::1\])/.test(location.hostname) ||
      location.protocol === 'file:';
  }

  /** Every rubric point in a course's FRQ, flattened in order. */
  function flattenRubric(frq) {
    const out = [];
    (frq.parts || []).forEach((part) => {
      (part.rubricPoints || []).forEach((rp) => {
        out.push({
          partLabel: part.label || '',
          id: rp.id,
          criterion: rp.criterion || '',
          category: rp.category || 'completeness',
          commonErrors: rp.commonErrors || [],
          exampleEarning: rp.exampleEarning || '',
          exampleFailing: rp.exampleFailing || '',
          standards: rp.standards || [],
        });
      });
    });
    return out;
  }

  function stripCodeFences(text) {
    let t = (text || '').trim();
    if (t.indexOf('```') !== -1) {
      t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    }
    return t.trim();
  }

  function parseJson(text) {
    const t = stripCodeFences(text);
    if (!t) return null;
    try { return JSON.parse(t); } catch (_) {}
    const start = t.indexOf('{');
    const end = t.lastIndexOf('}') + 1;
    if (start === -1 || end <= start) return null;
    try { return JSON.parse(t.slice(start, end)); } catch (_) { return null; }
  }

  function createHttpError(message, status, payload) {
    const e = new Error(message);
    e.status = status;
    e.payload = payload;
    return e;
  }

  /** POST one exchange to the Korah AI proxy, return the raw string. */
  async function callR(systemText, userContent, opts) {
    opts = opts || {};
    const messages = [{ role: 'system', content: systemText }];
    const uc = Array.isArray(userContent) ? userContent : [{ type: 'text', text: userContent }];
    messages.push({ role: 'user', content: uc });

    const body = {
      model: opts.model || MODEL,
      temperature: opts.temperature != null ? opts.temperature : 0,
      messages,
      stream: false,
    };
    if (opts.json) body.response_format = { type: 'json_object' };

    const bodyStr = JSON.stringify(body);
    if (bodyStr.length > MAX_PAYLOAD) {
      throw createHttpError('The photos are too large to grade. Try fewer or smaller photos.', 413);
    }

    const res = await fetch('/api/r', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyStr,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw createHttpError(payload.error || 'The grading service could not be reached.', res.status, payload);
    }
    const data = await res.json().catch(() => ({}));
    const raw = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (typeof raw !== 'string' || !raw) {
      throw createHttpError('The grader returned nothing usable.', 0, data);
    }
    return raw;
  }

  /* ── Transcription ─────────────────────────────────────────────────────── */

  const TRANSCRIBE_SYSTEM =
    'You are reading a student\'s handwritten or typed response to an AP Free Response Question. ' +
    'Produce a faithful text transcription of their work. Preserve paragraph breaks, part labels ' +
    '(a), (b), (c), and any equations using LaTeX notation where possible. If you cannot read a ' +
    'section clearly, mark it with [illegible] rather than guessing. Do not interpret, correct, or ' +
    'improve the student\'s work. Transcribe exactly what is written. Respond with plain text only, ' +
    'no JSON, no markdown code fences.';

  async function loadCannedTranscript(courseSlug) {
    const res = await fetch(`./data/${courseSlug}/canned-transcript.json`);
    if (!res.ok) throw new Error('canned transcript missing');
    const data = await res.json();
    return typeof data.transcript === 'string' ? data.transcript : '';
  }

  /**
   * Transcribe one or more page photos (data URLs) into plain text.
   * In canned mode returns the saved demo transcript instantly.
   * @returns {Promise<{ transcript: string, canned: boolean }>}
   */
  async function transcribe(frq, imageDataUrls, courseSlug) {
    const useCanned = canned();
    if (useCanned) {
      const transcript = await loadCannedTranscript(courseSlug);
      return { transcript, canned: true };
    }
    if (!imageDataUrls || !imageDataUrls.length) {
      throw new Error('No photos provided for transcription.');
    }
    try {
      const textPart = { type: 'text', text: 'Transcribe the student work in these images, in order.' };
      const parts = [textPart];
      imageDataUrls.forEach((url) => parts.push({ type: 'image_url', image_url: { url } }));
      const raw = await callR(TRANSCRIBE_SYSTEM, parts, { temperature: 0.1 });
      return { transcript: stripCodeFences(raw), canned: false };
    } catch (e) {
      const transcript = await loadCannedTranscript(courseSlug);
      return { transcript, canned: true, fallbackError: e };
    }
  }

  /* ── Grading ───────────────────────────────────────────────────────────── */

  function gradingSystemPrompt(frq) {
    const courseName = (window.KorahAP && window.KorahAP.getCourse && window.KorahAP.getCourse(frq.course) || {}).name || frq.course;
    const rubric = flattenRubric(frq);
    const partsBlock = (frq.parts || []).map((p) => (
      p.label + ' — ' + p.text +
      '\n  rubric points:\n  ' +
      (p.rubricPoints || []).map((rp) => (
        '- id: ' + rp.id + ' | criterion: ' + rp.criterion +
        (rp.commonErrors && rp.commonErrors.length ? '\n    common errors: ' + rp.commonErrors.join('; ') : '') +
        (rp.exampleEarning ? '\n    earns when: ' + rp.exampleEarning : '') +
        (rp.exampleFailing ? '\n    fails when: ' + rp.exampleFailing : '')
      )).join('\n  ')
    )).join('\n\n');

    return [
      'You are grading an AP Free Response Question response against an official-style scoring rubric, point by point.',
      'Course: ' + courseName + '. Question: ' + frq.title + ' (' + frq.year + ').',
      'Stimulus/context: ' + (((frq.stimulus || {}).content) || 'none'),
      '',
      'The full question:',
      frq.prompt || '',
      '',
      'The official rubric, as structured data. Rubric point ids are stable identifiers; use them exactly.',
      '',
      partsBlock,
      '',
      'RULE: You never generate a final score. For EVERY rubric point you must decide earned or not earned, quote the exact piece of the student\'s work that earned it, and if it was not earned, say specifically what was missing.',
      'When the student\'s work is ambiguous, do not award the point; explain the ambiguity in feedback.',
      '',
      'Respond with ONLY a single valid JSON object, no markdown, matching exactly this shape:',
      '{',
      '  "verdicts": [',
      '    { "rubricPointId": "<exact id>", "earned": true, "evidence": "exact quote from the student work justifying the verdict", "feedback": null }',
      '  ],',
      '  "score": <number, the count of verdicts where earned is true>',
      '  "totalPoints": <number, the count of rubric points>',
      '  "priorityFix": "one sentence, the single most impactful thing to fix",',
      '  "sampleResponseComparison": "a short note on how the student\'s response compares to an official full-credit sample response"',
      '}',
      'Constraints: verdicts must contain every rubric point id and nothing else. earned must be exactly true or false. evidence quotes the student\'s own words or notation verbatim, or null. feedback is null when earned, otherwise a specific description of what was missing. score must equal the number of verdicts with earned === true, computed from your verdicts after you make them.'

    ].join('\n');
  }

  async function loadCannedGrading(courseSlug) {
    const res = await fetch(`./data/${courseSlug}/canned-grading.json`);
    if (!res.ok) throw new Error('canned grading missing');
    return res.json();
  }

  /**
   * Validate and normalize a raw model response against the FRQ's rubric.
   * Guarantees: every rubric point has a verdict, earned is boolean, and
   * score === count of earned verdicts (model "score" is ignored).
   */
  function normalizeGrade(frq, raw, extra) {
    const points = flattenRubric(frq);
    const byId = new Map(points.map((p) => [p.id, p]));
    const issues = [];
    const verdicts = [];

    const rawVerdicts = Array.isArray(raw && raw.verdicts) ? raw.verdicts : [];

    // Force one verdict per rubric point in rubric order.
    points.forEach((p) => {
      const v = rawVerdicts.find((x) => x && x.rubricPointId === p.id);
      if (!v) {
        issues.push('Missing verdict for ' + p.id);
        verdicts.push({
          rubricPointId: p.id,
          category: p.category,
          partLabel: p.partLabel,
          earned: false,
          evidence: null,
          feedback: 'No verdict returned for this point.',
          defaulted: true,
        });
        return;
      }
      const earned = Boolean(v.earned);
      verdicts.push({
        rubricPointId: p.id,
        category: p.category,
        partLabel: p.partLabel,
        earned,
        evidence: typeof v.evidence === 'string' && v.evidence.trim() ? v.evidence.trim() : null,
        feedback: typeof v.feedback === 'string' && v.feedback.trim() ? v.feedback.trim() : null,
      });
    });

    const score = verdicts.filter((v) => v.earned).length;
    const totalPoints = points.length;

    return {
      verdicts,
      score,
      totalPoints,
      priorityFix: typeof raw.priorityFix === 'string' && raw.priorityFix.trim()
        ? raw.priorityFix.trim()
        : 'Review the missed rubric points above and re-attempt the question.',
      sampleResponseComparison: typeof raw.sampleResponseComparison === 'string' && raw.sampleResponseComparison.trim()
        ? raw.sampleResponseComparison.trim()
        : '',
      canned: !!(extra && extra.canned),
      log: !!(extra && extra.log),
      validationIssues: issues,
    };
  }

  /**
   * Grade a confirmed transcript against an FRQ's rubric.
   * @returns {Promise<{verdicts, score, totalPoints, priorityFix, sampleResponseComparison, canned, validationIssues}>}
   */
  async function grade(frq, transcript, courseSlug) {
    if (!frq || !Array.isArray(frq.parts)) {
      throw new Error('This FRQ has no rubric to grade against.');
    }

    // Canned path: feeds the whole feedback screen without any API call.
    if (canned()) {
      const raw = await loadCannedGrading(courseSlug);
      return normalizeGrade(frq, raw, { canned: true });
    }

    const messages = gradingSystemPrompt(frq);
    const userText = 'Student response to grade:\n\n' + (transcript || '');

    try {
      const rawJson = await callR(messages, [{ type: 'text', text: userText }], { json: true, temperature: 0 });
      const raw = parseJson(rawJson);
      if (!raw) throw createHttpError('The grader returned invalid JSON.', 0, { text: rawJson });
      return normalizeGrade(frq, raw, { log: true });
    } catch (e) {
      if (e && e.status === 429) throw e; // rate-limit: surface, don't recycle canned
      console.warn('[KorahAPGrader] live grading failed, falling back to canned data:', e);
      const raw = await loadCannedGrading(courseSlug);
      return normalizeGrade(frq, raw, { canned: true });
    }
  }

  global.KorahAPGrader = {
    canned,
    flattenRubric,
    transcribe,
    grade,
    buildGradingPrompt: gradingSystemPrompt,
    normalizeGrade,
  };
})(typeof window !== 'undefined' ? window : this);