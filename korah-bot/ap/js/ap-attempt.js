/**
 * AP attempt — the state machine behind ap/attempt.html.
 *
 * States (single page, sections toggled):
 *   pre        -> the FRQ and its meta, Start button
 *   active     -> timer running, prompt stays on screen, typed box + photo upload
 *   transcribe -> thumbnails + editable transcription, Confirm and grade
 *   grading    -> spinner while KorahAPGrader works
 *   feedback   -> score head, rubric ledger, priority fix, sample comparison
 *
 * Timer: reuses KorahTimer (app/timer-manager.js) for start + persistence.
 * KorahTimer clamps remaining at 0 and resets startedAt on completion, so we
 * keep our own attemptStartAt to compute a real timeSpentSec that can run past
 * the allotted time. The timer never hard-locks; it just turns the pill red.
 *
 * Photos: downscaled client-side (longest edge ~2000px, JPEG 0.8) to stay well
 * under the 4.5MB /api/r cap. Tiny images are rejected up front; blurry ones
 * put up a warning but can be confirmed, because the transcription review step
 * is the real safety net.
 */

(function (global) {
  'use strict';

  const MAX_EDGE = 2000;
  const JPEG_QUALITY = 0.8;
  const BLUR_WARN = 24;
  const BLUR_BLOCK = 8;
  const TINY_EDGE = 150;

  const params = new URLSearchParams(location.search);
  const courseSlug = params.get('course') || '';
  const frqId = params.get('frq') || '';

  const state = {
    view: 'pre',
    frq: null,
    course: (window.KorahAP && window.KorahAP.getCourse && window.KorahAP.getCourse(courseSlug)) || null,
    images: [],          // { dataUrl, width, height, tiny, blur, page }
    typed: '',
    transcript: '',
    attemptStartAt: null,
    gradeResult: null,
    disputed: new Set(),
    savedAttemptId: null,
    saving: false,
  };

  const $ = (id) => document.getElementById(id);
  const views = { pre: 'view-pre', active: 'view-active', transcribe: 'view-transcribe', grading: 'view-grading', feedback: 'view-feedback' };

  /* ── Render helpers ────────────────────────────────────────────────────── */

  function el(id) { return $(id); }
  function showView(name) {
    Object.keys(views).forEach((k) => { $(views[k]).hidden = k !== name; });
    state.view = name;
    if (name === 'active') window.scrollTo(0, 0);
  }

  function renderMath(container) {
    if (container && typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(container, {
          delimiters: [
            { left: '\\(', right: '\\)', display: false },
            { left: '$$', right: '$$', display: true },
          ],
          throwOnError: false,
        });
      } catch (e) {
        console.warn('[KorahAP] katex render failed', e);
      }
    }
  }

  function safeHtml(text) {
    let html = String(text || '');
    if (window.DOMPurify) {
      html = window.DOMPurify.sanitize(html, { USE_PROFILES: { html: true, mathMl: true, svg: true } });
    }
    return html;
  }

  function esc(text) {
    return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatTime(sec) {
    const m = Math.floor(Math.max(0, sec) / 60).toString().padStart(2, '0');
    const s = (Math.max(0, sec) % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  /* ── Prompt rendering ──────────────────────────────────────────────────── */

  function renderPrompt(frq) {
    const staticPrompt = el('frq-static-prompt');
    const activePrompt = el('frq-active-prompt');
    const title = `${frq.year} | ${frq.title}`;
    document.title = `Korah AI — ${title} · AP FRQ` ;

    $('ap-page-title').textContent = frq.title;
    $('ap-frq-breadcrumb').textContent = `${state.course.name} · ${frq.year} FRQ ${frq.questionNumber}`;

    const body = (p) => `
      ${safeHtml(p.prompt || '')}
      ${(p.parts || []).map((part) => `
        <div class="ap-part-block">
          <span class="ap-part-label">${esc(part.label)}</span>
          <p class="ap-part-text">${safeHtml(part.text || '')}</p>
        </div>`).join('')}
    `;

    staticPrompt.innerHTML = body(frq);
    activePrompt.innerHTML = body(frq);
    renderMath(staticPrompt);
    renderMath(activePrompt);

    const chips = el('frq-meta-chips');
    chips.innerHTML = [
      `<span class="ap-chip"><span class="material-icons-round" style="font-size:1rem">schedule</span> ${frq.timeAllottedMin} minutes</span>`,
      frq.calculatorAllowed
        ? '<span class="ap-chip"><span class="material-icons-round" style="font-size:1rem">calculate</span> Calculator allowed</span>'
        : '<span class="ap-chip"><span class="material-icons-round" style="font-size:1rem">block</span> No calculator</span>',
      `<span class="ap-chip"><span class="material-icons-round" style="font-size:1rem">auto_stories</span> ${esc(state.course.name)}</span>`,
    ].join('');
    const chips2 = el('frq-meta-chips-2');
    if (chips2) chips2.innerHTML = chips.innerHTML;

    const qType = state.course.format === 'math' ? 'work it out on paper, then photograph it, or type it below.' : 'type your answer below, or photograph a handwritten response.';
    el('answer-box-note').textContent = `You can ${qType} The timer keeps running past zero; use the time to finish your thoughts.`;

    el('pre-total-points').textContent = `${countPoints(frq)} points · official-style rubric`;
  }

  function countPoints(frq) {
    return (frq.parts || []).reduce((n, p) => n + (p.rubricPoints || []).length, 0);
  }

  /* ── Timer ─────────────────────────────────────────────────────────────── */

  function startAttemptClock() {
    if (!window.KorahTimer) return;
    state.attemptStartAt = Date.now();
    window.KorahTimer.start(state.frq.timeAllottedMin);
    window.KorahTimer.addListener((eventType) => {
      if (eventType === 'update' || eventType === 'complete') tickClock();
    });
    tickClock();
  }

  function tickClock() {
    const pill = el('timer-pill');
    const spare = el('timer-spare');
    if (!pill) return;
    const allottedSec = (state.frq.timeAllottedMin || 0) * 60;
    const spent = state.attemptStartAt ? Math.floor((Date.now() - state.attemptStartAt) / 1000) : 0;
    const remaining = allottedSec - spent;
    const overtime = remaining < 0;
    pill.innerHTML = `<span class="material-icons-round">${overtime ? 'alarm_on' : 'timer'}</span>${formatTime(remaining)}`;
    pill.classList.toggle('overtime', overtime);
    pill.classList.toggle('pulsing', overtime);
    if (spare) spare.innerHTML = overtime ? 'over time' : '';
  }

  function timeSpentSec() {
    if (!state.attemptStartAt) return 0;
    return Math.max(0, Math.floor((Date.now() - state.attemptStartAt) / 1000));
  }

  /* ── Image handling ────────────────────────────────────────────────────── */

  function processImage(file) {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const tiny = img.width < TINY_EDGE || img.height < TINY_EDGE;
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
        URL.revokeObjectURL(url);
        resolve({ dataUrl, width: w, height: h, tiny, blur: computeBlur(canvas) });
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  function computeBlur(canvas) {
    try {
      const W = 96;
      const g = document.createElement('canvas');
      g.width = W;
      g.height = Math.max(1, Math.round(W * canvas.height / canvas.width));
      const gctx = g.getContext('2d');
      gctx.drawImage(canvas, 0, 0, g.width, g.height);
      const d = gctx.getImageData(0, 0, g.width, g.height).data;
      const n = g.width * g.height;
      const grey = new Float32Array(n);
      for (let i = 0; i < n; i++) grey[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
      const violet = new Float32Array(n);
      let mean = 0;
      for (let y = 0; y < g.height; y++) {
        for (let x = 0; x < g.width; x++) {
          const i = y * g.width + x;
          if (x <= 0 || y <= 0 || x >= g.width - 1 || y >= g.height - 1) { violet[i] = 0; continue; }
          violet[i] = 4 * grey[i] - grey[i - 1] - grey[i + 1] - grey[i - g.width] - grey[i + g.width];
          mean += violet[i];
        }
      }
      mean /= n;
      let variance = 0;
      for (let i = 0; i < n; i++) variance += (violet[i] - mean) * (violet[i] - mean);
      return variance / n;
    } catch (e) {
      return 100; // couldn't measure; assume fine
    }
  }

  function renderPhotoGrid() {
    const grid = el('photo-grid');
    if (state.images.length === 0) {
      grid.innerHTML = '';
      el('photo-drop').hidden = false;
      el('photo-warning').hidden = true;
      return;
    }
    el('photo-drop').hidden = true;
    let warn = null;
    grid.innerHTML = state.images.map((im, i) => {
      const tiny = im.tiny ? '<span class="ap-badge ap-badge-todo">too small</span>' : '';
      return `
        <div class="ap-photo-thumb">
          <img src="${im.dataUrl}" alt="Page ${i + 1}"/>
          <button type="button" class="ap-photo-remove" data-remove="${i}" aria-label="Remove page ${i + 1}">&times;</button>
          <div class="ap-photo-page">page ${i + 1}${im.blur < BLUR_BLOCK ? ' · blurry' : ''}</div>
        </div>`;
    }).join('') + `
      <div class="ap-photo-drop" id="photo-drop-more" style="padding:1rem">
        <div class="ap-photo-drop-icon"><span class="material-icons-round">add_a_photo</span></div>
        <div class="ap-photo-drop-title">Add another page</div>
      </div>`;

    const tinyCount = state.images.filter((i) => i.tiny).length;
    const blurLow = state.images.filter((i) => i.blur < BLUR_WARN);
    if (tinyCount > 0) {
      warn = 'Some pages are too small to read accurately. Remove them and re-photograph closer to the page.';
    } else if (blurLow.length > 0) {
      warn = 'One or more pages look blurry. The model may misread the work. You can retake them or continue and correct the transcription next.';
    }
    const w = el('photo-warning');
    w.hidden = !warn;
    w.innerHTML = warn
      ? `<span class="material-icons-round">warning</span><span>${warn}</span>`
      : '';
  }

  async function addFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (!files.length) return;
    el('photo-feedback').textContent = 'Processing photos...';
    const results = await Promise.all(files.map(processImage));
    el('photo-feedback').textContent = '';
    let added = 0;
    results.forEach((r, i) => {
      if (!r) return;
      if (r.tiny) {
        el('photo-feedback').textContent = 'One photo was too small and was skipped. Bring the camera closer to the page.';
        return;
      }
      state.images.push(Object.assign(r, { page: state.images.length + 1 + i }));
      added++;
    });
    if (added) renderPhotoGrid();
  }

  function renderTranscription() {
    const strip = el('transcribe-thumbs');
    strip.innerHTML = state.images.map((im, i) =>
      `<img src="${im.dataUrl}" alt="Page ${i + 1}"/>`).join('');
    el('transcript-box').value = state.transcript;
    el('transcribe-note').textContent = state.images.length
      ? 'This is what the model read from your photos. Fix anything it got wrong, then confirm.'
      : 'This is your typed response. Review it before grading.';
  }

  /* ── Feedback rendering ────────────────────────────────────────────────── */

  function renderFeedback(result) {
    const frq = state.frq;

    // Score head
    const head = el('feedback-head');
    head.innerHTML = `
      <div class="ap-score-big">${result.score}<em> / ${result.totalPoints}</em></div>
      <div class="ap-score-meta">
        <b>${result.score} of ${result.totalPoints} points</b> on ${frq.title} (${frq.year}).<br/>
        ${esc(feedbackTimeLine())}
        ${result.canned ? '<br/><span style="color:var(--tx3)">Demo mode: canned feedback used because the grading API is unreachable.</span>' : ''}
      </div>`;

    // Rubric ledger
    const ledger = el('feedback-ledger');
    ledger.innerHTML = result.verdicts.map((v) => {
      const cls = v.earned ? 'earned' : 'missed';
      const icon = v.earned ? 'check_circle' : 'cancel';
      const cat = state.course ? window.KorahAP.categoryLabel(courseSlug, v.category) : v.category;
      const evidence = v.earned && v.evidence
        ? `<div class="ap-ledger-evidence"><b>Earned — your work:</b> “${esc(v.evidence)}”</div>`
        : '';
      const missing = !v.earned
        ? `<div class="ap-ledger-missing"><b>Missing:</b> ${esc(v.feedback || 'No feedback provided.')}</div>`
        : '';
      const disputed = state.disputed.has(v.rubricPointId);
      return `
        <div class="ap-ledger-row ${cls}" data-point="${esc(v.rubricPointId)}">
          <div class="ap-ledger-top">
            <span class="ap-ledger-status"><span class="material-icons-round">${icon}</span></span>
            <div>
              <div class="ap-ledger-criterion">${esc(v.partLabel ? v.partLabel + ' ' : '')}${esc(v.criterion || v.rubricPointId)}<span class="ap-ledger-cat">${esc(cat)}</span></div>
              ${evidence}
              ${missing}
              <button type="button" class="ap-dispute-btn ${disputed ? 'is-disputed' : ''}" data-dispute="${esc(v.rubricPointId)}">
                <span class="material-icons-round">flag</span>
                ${disputed ? 'Disputed' : 'I disagree with this point'}
              </button>
            </div>
          </div>
        </div>`;
    }).join('');

    /* Fix card */
    el('fix-text').innerHTML = safeHtml(result.priorityFix || '');
    renderMath(el('fix-text'));

    /* Sample comparison */
    el('compare-student').textContent = state.transcript || '';
    el('compare-sample').innerHTML = safeHtml(frq.sampleResponse || 'No sample response authored for this FRQ yet.');
    renderMath(el('compare-sample'));

    el('btn-try-another').href = `./frqs.html?course=${encodeURIComponent(courseSlug)}`;
    el('btn-view-progress').href = `./progress.html?course=${encodeURIComponent(courseSlug)}`;

    showView('feedback');
    window.scrollTo(0, 0);
  }

  function feedbackTimeLine() {
    const allotted = (state.frq.timeAllottedMin || 0) * 60;
    const spent = timeSpentSec();
    const m = Math.floor(spent / 60);
    const s = spent % 60;
    let tail = '';
    if (spent > allotted) {
      tail = ` on a ${state.frq.timeAllottedMin} minute question. Pacing is part of the skill.`;
    } else if (spent < allotted * 0.5) {
      tail = ` on a ${state.frq.timeAllottedMin} minute question. Fast, but check your justifications.`;
    } else {
      tail = ` on a ${state.frq.timeAllottedMin} minute question.`;
    }
    return `You took ${m}:${s.toString().padStart(2, '0')}${tail}`;
  }

  function bindFeedback() {
    el('feedback-ledger').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-dispute]');
      if (!btn) return;
      const pointId = btn.getAttribute('data-dispute');
      if (state.disputed.has(pointId)) state.disputed.delete(pointId);
      else state.disputed.add(pointId);
      btn.classList.toggle('is-disputed', state.disputed.has(pointId));
      btn.innerHTML = state.disputed.has(pointId)
        ? '<span class="material-icons-round">flag</span>Disputed'
        : '<span class="material-icons-round">flag</span>I disagree with this point';
      maybeSaveDisputes();
    });
  }

  function maybeSaveDisputes() {
    if (state.savedAttemptId && window.KorahAPProgress && window.KorahAPProgress.flagDisputed) {
      window.KorahAPProgress.flagDisputed(state.savedAttemptId, Array.from(state.disputed))
        .catch(() => {});
    }
  }

  /* ── Flow ──────────────────────────────────────────────────────────────── */

  async function submitAttempt() {
    const transcript = state.transcript || '';
    const payload = {
      frqId: state.frq.id,
      course: courseSlug,
      confirmedTranscript: transcript,
      rubricVerdicts: state.gradeResult.verdicts.map((v) => ({
        rubricPointId: v.rubricPointId,
        category: v.category,
        partLabel: v.partLabel,
        earned: v.earned,
        evidence: v.evidence,
        feedback: v.feedback,
      })),
      score: state.gradeResult.score,
      totalPoints: state.gradeResult.totalPoints,
      timeAllottedSec: (state.frq.timeAllottedMin || 0) * 60,
      timeSpentSec: timeSpentSec(),
      disputedPoints: Array.from(state.disputed),
      createdAt: new Date().toISOString(),
    };
    if (window.KorahAPProgress && window.KorahAPProgress.saveAttempt) {
      try {
        const ref = await window.KorahAPProgress.saveAttempt(payload);
        state.savedAttemptId = ref && ref.id ? ref.id : null;
      } catch (e) {
        console.warn('[KorahAP] attempt save failed (data stays visible, not stored):', e);
      }
    }
  }

  async function runGrade(transcript) {
    state.transcript = transcript;
    showView('grading');
    try {
      const result = await window.KorahAPGrader.grade(state.frq, transcript, courseSlug);
      state.gradeResult = result;
      state.disputed = new Set(result.verdicts.filter((v) => !v.earned).map((v) => v.rubricPointId));
      await submitAttempt();
      renderFeedback(result);
    } catch (e) {
      alertPanel('Grading failed. ' + (e && e.message ? e.message : 'Please try again.'));
      showView(state.transcript ? 'transcribe' : 'active');
    }
  }

  function alertPanel(message) {
    const w = el('photo-feedback');
    if (w) {
      w.textContent = message;
      w.hidden = false;
    }
    console.warn('[KorahAP] grading blocked:', message);
  }

  async function init() {
    if (!window.KorahAP) {
      $('ap-app-root').innerHTML = '<div class="ap-page" style="padding:1.25rem"><p>AP loader not available.</p></div>';
      return;
    }

    if (!state.course) {
      $('ap-app-root').innerHTML = '<div class="ap-page" style="padding:1.25rem"><p>Unknown course. <a href="./index.html" style="color:var(--p4)">Back to courses</a>.</p></div>';
      return;
    }

    const frq = await window.KorahAP.getFrq(courseSlug, frqId);
    if (!frq) {
      $('ap-app-root').innerHTML = `<div class="ap-page" style="padding:1.25rem"><p>FRQ not found. <a href="./frqs.html?course=${encodeURIComponent(courseSlug)}" style="color:var(--p4)">Back to ${esc(state.course.name)}</a>.</p></div>`;
      return;
    }
    state.frq = frq;
    renderPrompt(frq);

    // restore a running timer in case of a mid-attempt reload
    if (window.KorahTimer) {
      const s = window.KorahTimer.getState();
      if (s && s.isRunning && s.startedAt) state.attemptStartAt = s.startedAt;
    }

    wireEvents();
    showView('pre');
  }

  function wireEvents() {
    el('btn-start').addEventListener('click', () => {
      startAttemptClock();
      el('active-timer-bar').hidden = false;
      el('answer-box').focus();
      showView('active');
    });

    el('answer-box').addEventListener('input', (e) => { state.typed = e.target.value; });

    el('photo-input').addEventListener('change', (e) => {
      addFiles(e.target.files);
      e.target.value = '';
    });
    el('photo-drop-btn') && el('photo-drop-btn').addEventListener('click', () => el('photo-input').click());
    el('photo-drop') && el('photo-drop').addEventListener('click', () => el('photo-input').click());

    el('photo-grid').addEventListener('click', (e) => {
      if (e.target.closest('[data-remove]')) {
        const idx = Number(e.target.closest('[data-remove]').getAttribute('data-remove'));
        state.images.splice(idx, 1);
        renderPhotoGrid();
      } else if (e.target.closest('#photo-drop-more')) {
        el('photo-input').click();
      }
    });

    el('btn-submit').addEventListener('click', async () => {
      if (state.images.length) {
        el('submit-panel').textContent = 'Reading your photos...';
        try {
          const t = await window.KorahAPGrader.transcribe(state.frq, state.images.map((i) => i.dataUrl), courseSlug);
          state.transcript = t.transcript;
          renderTranscription();
          showView('transcribe');
          el('submit-panel').textContent = '';
        } catch (err) {
          el('submit-panel').textContent = 'Could not read the photos: ' + (err && err.message ? err.message : 'unknown error');
        }
      } else {
        const typed = el('answer-box').value.trim();
        if (!typed) {
          el('submit-panel').textContent = 'Type an answer or add a photo of your work first.';
          return;
        }
        state.transcript = typed;
        await runGrade(typed);
      }
    });

    el('btn-confirm-transcript').addEventListener('click', () => {
      const edited = el('transcript-box').value.trim();
      if (!edited) {
        el('submit-panel').textContent = 'The transcription is empty. Add your work or edit it above.';
        return;
      }
      runGrade(edited);
    });

    el('btn-retranscribe').addEventListener('click', () => {
      el('transcript-box').value = state.transcript;
    });

    bindFeedback();
  }

  /* boot after korahReady so guest/signed setup and KorahDB are in place */
  function boot() {
    init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof window !== 'undefined' ? window : this);