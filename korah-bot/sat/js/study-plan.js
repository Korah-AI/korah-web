import {
  initializeFirestore, getFirestore, doc, setDoc, getDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const COLLECTION = "studyPlans";
// iOS reads users/{uid}/studyPlans/current (Managers/StudyPlanService.swift:28).
const DOC_ID = "current";

// iOS StudyPlan.source vocabulary (Models/StudyPlanModels.swift:47).
const SOURCE_BY_START_POINT = {
  real_sat: "sat",
  practice_test: "practice",
  none: "self"
};

// Monday-first, matching StudyPlanDates.dayKeys.
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

// Domain labels iOS uses in its prompt, keyed by the wizard's rating keys.
const DOMAIN_LABELS = {
  heartOfAlgebra: "Algebra",
  passportAdvancedMath: "Advanced Math",
  problemSolvingData: "Problem-Solving and Data Analysis",
  additionalTopicsMath: "Geometry and Trigonometry",
  informationIdeas: "Information and Ideas",
  craftStructure: "Craft and Structure",
  expressionIdeas: "Expression of Ideas",
  standardEnglish: "Standard English Conventions"
};
const CONFIDENCE_LABELS = ["", "shaky", "okay", "strong"];

// Canonical domain codes, shared with iOS (SATCatalog domain codes in
// Models/SATModels.swift:262) and with the /api/sat/s breakdown keys. The
// wizard's own rating keys differ, so map them across rather than teaching the
// extraction prompt two vocabularies.
const DOMAIN_CODE_LABELS = {
  H: "Algebra",
  P: "Advanced Math",
  Q: "Problem-Solving and Data Analysis",
  S: "Geometry and Trigonometry",
  INI: "Information and Ideas",
  CAS: "Craft and Structure",
  EOI: "Expression of Ideas",
  SEC: "Standard English Conventions"
};
// Math first, then Reading & Writing, matching the confidence step and
// StudyPlanDomains.ordered on iOS. Alphabetical codes interleave the sections.
const DOMAIN_CODE_ORDER = ["H", "P", "Q", "S", "INI", "CAS", "EOI", "SEC"];
// 1 = needs work, 2 = growing, 3 = strong. Same 1-3 scale as the self-rated
// confidence step, so the planner reads one vocabulary either way.
const PERFORMANCE_LABELS = ["", "needs work", "growing", "strong"];

// The model is asked for an array of {code, level}; the rest of the app wants a
// { code: level } map. Drop unknown codes and out-of-range levels rather than
// letting them reach the plan prompt.
function normalizeDomainLevels(raw) {
  const out = {};
  if (!Array.isArray(raw)) return out;
  raw.forEach((entry) => {
    if (!entry || typeof entry !== "object") return;
    const code = String(entry.code || "").trim().toUpperCase();
    const level = Number(entry.level);
    if (!DOMAIN_CODE_LABELS[code]) return;
    if (!Number.isInteger(level) || level < 1 || level > 3) return;
    out[code] = level;
  });
  return out;
}

function now() { return new Date().toISOString(); }

// Parse "yyyy-MM-dd" in local time. new Date("2026-09-02") is UTC midnight,
// which lands on the previous day west of UTC and puts sessions in the wrong
// day and week.
function parseDay(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime()) || dt.getMonth() !== m - 1) return null;
  return dt;
}

function dayString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// getDay() is 0=Sunday..6=Saturday; DAY_KEYS is Monday-first.
function dayKey(date) { return DAY_KEYS[(date.getDay() + 6) % 7]; }

// Models routinely wrap JSON in code fences even in JSON mode, so parse
// defensively instead of handing the raw text to JSON.parse.
// Same approach as study/js/study-api.js.
function stripCodeFences(text) {
  var trimmed = (text || "").trim();
  if (!trimmed) return "";
  if (trimmed.indexOf("```") !== -1) {
    trimmed = trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  return trimmed.trim();
}

function parseJsonFromResponse(text) {
  var trimmed = stripCodeFences(text);
  if (!trimmed) return null;
  try { return JSON.parse(trimmed); } catch (_) {}
  var start = trimmed.indexOf("{");
  var end = trimmed.lastIndexOf("}") + 1;
  if (start === -1 || end <= start) return null;
  try { return JSON.parse(trimmed.slice(start, end)); } catch (_) { return null; }
}

// A 404 or 500 from /api/r does not throw, so check res.ok before reading the
// body. Otherwise the failure silently becomes {} and the UI renders blanks.
async function readAiJson(res, label) {
  if (!res.ok) {
    throw new Error(label + " failed: the AI service returned " + res.status + ".");
  }
  const data = await res.json().catch(() => null);
  const content = data?.choices?.[0]?.message?.content;
  const parsed = parseJsonFromResponse(content);
  if (!parsed) {
    throw new Error(label + " failed: the AI service did not return usable JSON.");
  }
  return parsed;
}

// Port of StudyPlanGenerationService.buildPlan (Swift:188-234). Never trust the
// model straight into Firestore: drop sessions that are in the past, on or
// after the test date, not on a chosen study day, or missing skillName or
// activity; clamp durationMin to 20-150; sort by date then start.
function buildPlan(raw, intake) {
  const feedback = { headline: "", priorities: [], weeklyFocus: "" };
  const fb = raw && raw.feedback;
  if (fb && typeof fb === "object" && !Array.isArray(fb)) {
    if (typeof fb.headline === "string") feedback.headline = fb.headline;
    if (typeof fb.weeklyFocus === "string") feedback.weeklyFocus = fb.weeklyFocus;
    if (Array.isArray(fb.priorities)) {
      feedback.priorities = fb.priorities.filter(p => typeof p === "string" && p).slice(0, 3);
    }
  }

  const today = startOfToday();
  const testDay = parseDay(intake.testDate);
  if (!testDay) {
    throw new Error("Building your plan failed: the test date is not a valid yyyy-MM-dd date.");
  }
  // iOS decodes hoursPerWeek as Int, so a string here fails the whole document.
  const hoursPerWeek = Math.trunc(Number(intake.hoursPerWeek));
  if (!Number.isFinite(hoursPerWeek)) {
    throw new Error("Building your plan failed: hours per week is not a number.");
  }
  const allowedDays = new Set(intake.studyDays || []);
  const rawSessions = Array.isArray(raw && raw.sessions) ? raw.sessions : [];

  const sessions = [];
  for (const s of rawSessions) {
    if (!s || typeof s !== "object") continue;
    const day = parseDay(s.date);
    if (!day || day < today) continue;
    if (day >= testDay) continue;
    if (!allowedDays.has(dayKey(day))) continue;
    if (typeof s.start !== "string" || !/^\d{2}:\d{2}$/.test(s.start)) continue;
    const skillName = typeof s.skillName === "string" ? s.skillName.trim() : "";
    const activity = typeof s.activity === "string" ? s.activity.trim() : "";
    if (!skillName || !activity) continue;
    const parsedDuration = Number(s.durationMin);
    const durationMin = Number.isFinite(parsedDuration) ? Math.trunc(parsedDuration) : 45;
    sessions.push({
      // Stable, generated here. iOS matches sessions by id on every write, and
      // a model-invented id is neither unique nor stable.
      id: crypto.randomUUID(),
      date: s.date,
      start: s.start,
      durationMin: Math.min(Math.max(durationMin, 20), 150),
      subject: s.subject === "math" ? "math" : "english",
      skillName,
      activity,
      completed: false
    });
  }

  sessions.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  if (sessions.length === 0) {
    throw new Error("Building your plan failed: none of the sessions Korah returned fit your study days and test date. Please try again.");
  }

  return {
    testDate: intake.testDate,
    studyDays: Array.from(allowedDays),
    hoursPerWeek,
    source: SOURCE_BY_START_POINT[intake.startPoint] || "self",
    feedback,
    sessions
  };
}

async function initStudyPlan(app, userId) {
  let db;
  try { 
    db = initializeFirestore(app, {}); 
  } catch { 
    db = getFirestore(app); 
  }
  const planRef = doc(db, `users/${userId}/${COLLECTION}`, DOC_ID);

  function listen(onChange) {
    return onSnapshot(planRef, (snap) => {
      if (snap.exists()) onChange({ state: "hasPlan", data: snap.data() });
      else onChange({ state: "empty" });
    }, (err) => console.error("[StudyPlan] listener error", err));
  }

  async function getPlan() {
    const snap = await getDoc(planRef);
    return snap.exists() ? snap.data() : null;
  }

  async function extractScoresFromImage(base64DataUrl) {
    const res = await fetch("/api/r", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: SCORE_EXTRACTION_PROMPT },
          { role: "user", content: [
            { type: "text", text: "Extract Math and Reading & Writing scores." },
            { type: "image_url", image_url: { url: base64DataUrl } }
          ]}
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });
    const parsed = await readAiJson(res, "Reading your score report");
    return {
      mathScore: parsed.mathScore ?? null,
      rwScore: parsed.rwScore ?? null,
      domains: normalizeDomainLevels(parsed.domains)
    };
  }

  async function generatePlan(intake) {
    const res = await fetch("/api/r", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: PLAN_GENERATION_PROMPT },
          { role: "user", content: buildUserPrompt(intake) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      })
    });
    return readAiJson(res, "Building your plan");
  }

  async function createPlan(intake) {
    const raw = await generatePlan(intake);
    // Only the eight fields iOS decodes are written. The wizard intake
    // (scores, confidence ratings, free text) is not part of the shared
    // schema, so it stays out of the document.
    const payload = { ...buildPlan(raw, intake), createdAt: now(), updatedAt: now() };
    await setDoc(planRef, payload);
    return payload;
  }

  async function updateSession(sessionId, { completed }) {
    const plan = await getPlan();
    if (!plan) throw new Error("No plan");
    const sessions = (plan.sessions || []).map(s =>
      s.id === sessionId ? { ...s, completed } : s
    );
    await setDoc(planRef, { sessions, updatedAt: now() }, { merge: true });
  }

  async function deletePlan() {
    // iOS deletes the document outright (StudyPlanService.swift:80). Writing a
    // tombstone instead leaves snap.exists() true and strands the page on an
    // empty calendar.
    await deleteDoc(planRef);
  }

  function downscaleImage(file, maxDim = 1024, quality = 0.7) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width <= maxDim && height <= maxDim && file.size < 300000) {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(file);
          return;
        }
        const scale = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
      img.src = url;
    });
  }

  const api = { listen, getPlan, createPlan, updateSession, deletePlan, downscaleImage, extractScoresFromImage,
                domainCodeLabels: DOMAIN_CODE_LABELS, performanceLabels: PERFORMANCE_LABELS };
  window.KorahStudyPlan = api;
  window.dispatchEvent(new CustomEvent("korahStudyPlanReady"));
  return api;
}

// Ported from StudyPlanGenerationService.swift:37-60.
const SCORE_EXTRACTION_PROMPT = `You read SAT practice score reports (College Board, Bluebook, Khan Academy and similar). Extract the section scores AND the per-domain performance breakdown. Respond with ONLY a single valid JSON object, no code fences:
{ "mathScore": number or null, "rwScore": number or null, "domains": [ { "code": "H", "level": 2 } ] }
mathScore is the Math section score (200-800). rwScore is the Reading and Writing section score (200-800). If the report shows only a total score out of 1600, split it evenly. If you can't find a score, use null.
"domains" is the Knowledge and Skills / performance-by-category breakdown these reports show under the scores. Use these codes only:
H = Algebra, P = Advanced Math, Q = Problem-Solving and Data Analysis, S = Geometry and Trigonometry, INI = Information and Ideas, CAS = Craft and Structure, EOI = Expression of Ideas, SEC = Standard English Conventions.
level is 1, 2, or 3: 1 = weak (shown as "Needs work", an empty or nearly empty bar, or a low percent correct), 2 = middling (shown as "Growing", a half-filled bar, or a middling percent correct), 3 = strong (shown as "Strong", a full or nearly full bar, or a high percent correct).
Read the level off whatever the report actually shows: a written label, the fill of a bar, a percent correct, or a raw correct-out-of-total. If the report shows percent correct, use 1 for under 60, 2 for 60 to 84, and 3 for 85 or more.
Only include a domain you can actually see in this image. Never guess a level from the section score alone. If the image has no breakdown at all, return an empty array.`;

// Ported from StudyPlanGenerationService.swift:100-124. The hard rules are
// there because the model gets it wrong without them.
const PLAN_GENERATION_PROMPT = `You are Korah, a warm SAT coach who builds realistic study schedules. Respond with ONLY a single valid JSON object, no code fences, no commentary:
{
  "feedback": {
    "headline": "One encouraging sentence about the student's starting point.",
    "priorities": ["Up to 3 short bullets naming their biggest score levers"],
    "weeklyFocus": "One sentence on how the plan is structured week to week."
  },
  "sessions": [
    { "date": "yyyy-MM-dd", "start": "HH:mm", "durationMin": 45,
      "subject": "math" or "english", "skillName": "...", "activity": "..." }
  ]
}
Hard rules:
- Sessions ONLY on the student's chosen study days, starting next occurrence of a chosen day, ending before the test date.
- Total session minutes per week must roughly equal their weekly hours. Sessions are 30 to 90 minutes.
- Start times between 15:30 and 20:00 unless weekends, where 09:00 to 20:00 is fine.
- If the test is more than 10 weeks away, plan only the first 10 weeks.
- skillName must be a real Digital SAT skill from the official domains (Algebra, Advanced Math, Problem-Solving and Data Analysis, Geometry and Trigonometry, Information and Ideas, Craft and Structure, Expression of Ideas, Standard English Conventions).
- Domain levels arrive in words. "needs work" and "shaky" mean weak, "growing" and "okay" mean middling, "strong" means strong.
- You will often get levels for only some of the eight domains, because a score report may only show part of the breakdown. Work with whatever you are given. Never drop a domain just because you have no data on it, and never fall back to giving everything equal time just because the data is incomplete.
- Settle every domain into weak, middling, or strong using the best evidence you have for that specific domain, in this order: a measured level from their score report, then their self-rating, then their score for that domain's section (under 600 is weak, 600 to 699 is middling, 700 or above is strong), then middling if you have nothing at all.
- A level you were given outranks one you inferred, so when two domains look equally weak, spend the time on the one you have real data on.
- Weight time by those levels. Each week, spend about 55% of total minutes on weak domains, about 30% on middling ones, and about 15% on strong ones. A weak domain should get roughly three times the minutes of a strong one.
- Never spread time evenly across all eight domains. Within a tier, split time evenly between the domains in that tier.
- Strong domains still get a hard floor: at least one short review session every two weeks, so they don't decay.
- Name the weak domains in feedback.priorities so the student knows why the plan looks the way it does.
- activity is one short concrete line, e.g. "Practice set: 10 linear function questions" or "Timed reading drill: inferences".
- Vary activities: practice sets, timed drills, review of missed questions, one full-length practice test roughly every 3 weeks (on a weekend day, 120 min is allowed for these only).
- feedback is short and encouraging. Never use em dashes anywhere. Use contractions. Talk to "you".`;

// Ported from StudyPlanGenerationService.userPrompt (Swift:126-170).
function buildUserPrompt(intake) {
  const lines = [];
  lines.push("Today's date: " + dayString(new Date()));
  lines.push("Test date: " + intake.testDate);
  lines.push("Study days: " + (intake.studyDays || []).join(", "));
  lines.push("Hours per week: " + intake.hoursPerWeek);

  if (intake.startPoint === "real_sat") lines.push("Starting point: took the real SAT.");
  else if (intake.startPoint === "practice_test") lines.push("Starting point: took a practice test.");
  else lines.push("Starting point: hasn't taken the SAT or a practice test yet.");

  if (intake.mathScore != null) lines.push("Math score: " + intake.mathScore);
  if (intake.rwScore != null) lines.push("Reading and Writing score: " + intake.rwScore);

  // Measured performance from the score report. Stated before the self-rating
  // and marked as measured, because the plan should trust it over a guess.
  const performance = intake.domainPerformance || {};
  const measured = DOMAIN_CODE_ORDER.map((code) => {
    const name = DOMAIN_CODE_LABELS[code];
    const level = performance[code];
    if (!name || !(level >= 1 && level <= 3)) return null;
    return name + ": " + PERFORMANCE_LABELS[level];
  }).filter(Boolean);
  if (measured.length) {
    lines.push("Measured performance per domain, read from their score report: " + measured.join("; "));
    // Named explicitly so a domain missing from the list reads as "the report
    // didn't show it" rather than "it was left out because it's fine".
    const unread = DOMAIN_CODE_ORDER
      .filter((code) => !(performance[code] >= 1 && performance[code] <= 3))
      .map((code) => DOMAIN_CODE_LABELS[code]);
    if (unread.length) {
      lines.push("Their report did not show these domains, so infer those levels yourself: " + unread.join("; "));
    }
    lines.push("Treat the measured levels as the truth about what they struggle with, and budget time against them.");
  }

  const ratings = intake.confidenceRatings || {};
  const described = Object.keys(ratings).sort().map((code) => {
    const name = DOMAIN_LABELS[code];
    const level = ratings[code];
    if (!name || !(level >= 1 && level <= 3)) return null;
    return name + ": " + CONFIDENCE_LABELS[level];
  }).filter(Boolean);
  if (described.length) {
    lines.push("Self-rated confidence per domain: " + described.join("; "));
  }

  if ((intake.freeTextGoals || "").trim()) {
    lines.push("What the student wants from the plan: " + intake.freeTextGoals.trim());
  }

  lines.push("Build my study plan.");
  return lines.join("\n");
}

export { initStudyPlan };