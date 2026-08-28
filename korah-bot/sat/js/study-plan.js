import {
  initializeFirestore, getFirestore, doc, setDoc, getDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

const COLLECTION = "studyPlans";
const DOC_ID = "main";

function now() { return new Date().toISOString(); }

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
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content);
  }

  async function generatePlan(intake) {
    const res = await fetch("/api/r", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [
          { role: "system", content: PLAN_GENERATION_PROMPT },
          { role: "user", content: JSON.stringify(intake) }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(content);
  }

  async function createPlan(intake) {
    const { feedback, sessions } = await generatePlan(intake);
    const payload = {
      ...intake,
      sessions: sessions.map(s => ({ ...s, completed: false, completedAt: null })),
      feedback,
      createdAt: now(),
      updatedAt: now()
    };
    await setDoc(planRef, payload);
    return payload;
  }

  async function updateSession(sessionId, { completed }) {
    const plan = await getPlan();
    if (!plan) throw new Error("No plan");
    const sessions = plan.sessions.map(s =>
      s.id === sessionId ? { ...s, completed, completedAt: completed ? now() : null } : s
    );
    await setDoc(planRef, { sessions, updatedAt: now() }, { merge: true });
  }

  async function deletePlan() {
    await setDoc(planRef, { deletedAt: now() });
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

  const api = { listen, getPlan, createPlan, updateSession, deletePlan, downscaleImage, extractScoresFromImage };
  window.KorahStudyPlan = api;
  window.dispatchEvent(new CustomEvent("korahStudyPlanReady"));
  return api;
}

const SCORE_EXTRACTION_PROMPT = `You are an SAT score report reader. Extract the Math section score and the Reading & Writing section score from this screenshot.
Return ONLY valid JSON: { "mathScore": number|null, "rwScore": number|null }
If a score is not visible or unclear, use null. Do not guess.`;

const PLAN_GENERATION_PROMPT = `You are Korah's SAT Study Planner. Create a 10-week study plan.

Input:
{
  "startPoint": "real_sat" | "practice_test" | "none",
  "mathScore": 680,
  "rwScore": 720,
  "confidenceRatings": {
    "heartOfAlgebra": 2,
    "problemSolvingData": 1,
    "passportAdvancedMath": 3,
    "additionalTopicsMath": 2,
    "informationIdeas": 2,
    "craftStructure": 3,
    "expressionIdeas": 1,
    "standardEnglish": 2
  },
  "freeTextGoals": "Focus on algebra and reading speed",
  "testDate": "2025-11-08",
  "studyDays": ["mon","wed","fri","sat","sun"],
  "hoursPerWeek": 6
}

HARD RULES (follow exactly):
1. Sessions ONLY on chosen studyDays.
2. Each session 30-90 minutes.
3. Total weekly minutes ≈ hoursPerWeek × 60 (distribute evenly across chosen days).
4. Plan ONLY the first 10 weeks from today.
5. Use REAL SAT skill/domain names:
   Math: "Heart of Algebra", "Problem Solving & Data Analysis", "Passport to Advanced Math", "Additional Topics in Math"
   Reading & Writing: "Information & Ideas", "Craft & Structure", "Expression of Ideas", "Standard English Conventions"
6. Include a FULL PRACTICE TEST every ~3 weeks (weeks 3, 6, 9) — 135-180 min, on a chosen day.
7. Mix domains each week; don't cluster same domain.
8. session.id = stable UUID v4 (generate client-side, send in prompt context).
9. Output ONLY valid JSON: { "feedback": "string", "sessions": [ { "id": "uuid", "date": "2025-08-28", "dayOfWeek": "thu", "startTime": "19:00", "durationMinutes": 60, "domain": "Heart of Algebra", "section": "math", "taskType": "practice" } ] }`;

export { initStudyPlan };