// Direct College Board question-bank client.
// Mirrors the upstream logic from MySATPrep (open-source/MySATPrep/src/lib/questionFetcher.ts
// and src/app/api/get-questions/route.ts) so Korah no longer has to proxy through mysatprep.fun.

const CB_QBANK_BASE =
  "https://qbank-api.collegeboard.org/msreportingquestionbank-prod/questionbank";
const SAIC_DISCLOSED_BASE = "https://saic.collegeboard.org/disclosed";

// asmtEventId values from MySATPrep's static-data/assessment.ts
export const ASSESSMENTS = {
  SAT: 99,
  "PSAT/NMSQT": 100,
  PSAT: 102,
};

// Domain code → human-readable name (mirrors static-data/domains.ts)
export const DOMAIN_CODE_TO_NAME = {
  INI: "Information and Ideas",
  CAS: "Craft and Structure",
  EOI: "Expression of Ideas",
  SEC: "Standard English Conventions",
  H: "Algebra",
  P: "Advanced Math",
  Q: "Problem-Solving and Data Analysis",
  S: "Geometry and Trigonometry",
};

export const DOMAIN_NAME_TO_CODE = Object.fromEntries(
  Object.entries(DOMAIN_CODE_TO_NAME).map(([code, name]) => [name, code])
);

export const SECTION_DOMAIN_CODES = {
  english: ["INI", "CAS", "EOI", "SEC"],
  math: ["H", "P", "Q", "S"],
};

export const ALL_DOMAIN_CODES = [
  ...SECTION_DOMAIN_CODES.english,
  ...SECTION_DOMAIN_CODES.math,
];

function sectionForDomainCode(code) {
  if (SECTION_DOMAIN_CODES.english.includes(code)) return "english";
  if (SECTION_DOMAIN_CODES.math.includes(code)) return "math";
  return null;
}

// ── List endpoint ──────────────────────────────────────────────────────
// POST { asmtEventId, test: 2, domain: "INI,CAS,..." } → array of question metadata.
//
// We always issue ONE request against the full set of section codes the caller
// cares about and partition the response locally — this matches the request
// shape MySATPrep uses (a single POST per session) and avoids hitting CB with
// multiple concurrent POSTs that triggered intermittent 502s on per-domain
// calls. Responses are memoized in-process for `LIST_CACHE_TTL_MS` so a warm
// Vercel function instance can serve repeated requests without re-hitting CB.
const LIST_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const LIST_CACHE_MAX = 32;
const listCache = new Map(); // key → { items, fetchedAt }

// Map preserves insertion order, so the oldest key is `keys().next().value`.
// Re-inserting on hit promotes a key to "newest"; eviction drops the head when
// the cache exceeds its cap.
function cacheSet(map, key, value, max) {
  if (map.has(key)) map.delete(key);
  map.set(key, value);
  while (map.size > max) {
    const oldest = map.keys().next().value;
    map.delete(oldest);
  }
}
function cacheTouch(map, key) {
  const v = map.get(key);
  if (v === undefined) return undefined;
  map.delete(key);
  map.set(key, v);
  return v;
}

export async function fetchQuestionList({
  asmtEventId = 99,
  domainCodes,
  signal,
} = {}) {
  if (!Array.isArray(domainCodes) || domainCodes.length === 0) return [];
  const sorted = [...new Set(domainCodes)].sort();
  const key = `${asmtEventId}::${sorted.join(",")}`;
  const cached = cacheTouch(listCache, key);
  if (cached && Date.now() - cached.fetchedAt < LIST_CACHE_TTL_MS) {
    return cached.items;
  }
  const resp = await fetch(`${CB_QBANK_BASE}/digital/get-questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      asmtEventId,
      test: 2,
      domain: sorted.join(","),
    }),
    signal,
  });
  if (!resp.ok) {
    const err = new Error(`College Board list error ${resp.status}`);
    err.status = resp.status;
    throw err;
  }
  const data = await resp.json();
  const items = Array.isArray(data) ? data : [];
  cacheSet(listCache, key, { items, fetchedAt: Date.now() }, LIST_CACHE_MAX);
  return items;
}

// ── Detail endpoints ───────────────────────────────────────────────────
// Disclosed (-DC) questions use the saic.collegeboard.org JSON dump; everything
// else goes through the regular qbank get-question POST.
const DETAIL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const DETAIL_CACHE_MAX = 500;
const detailCache = new Map(); // questionId → { detail, fetchedAt }

async function fetchDisclosedQuestion(questionId, signal) {
  const resp = await fetch(`${SAIC_DISCLOSED_BASE}/${encodeURIComponent(questionId)}.json`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const q = data[0];
  if (!q || !q.answer) return null;

  const correctAnswer = extractDisclosedCorrectAnswer(q);

  if (q.answer.style === "Multiple Choice") {
    return {
      type: "mcq",
      stem: q.prompt || "",
      stimulus: q.body || "",
      rationale: q.answer.rationale || "",
      answerOptions: {
        A: q.answer.choices?.a?.body ?? "",
        B: q.answer.choices?.b?.body ?? "",
        C: q.answer.choices?.c?.body ?? "",
        D: q.answer.choices?.d?.body ?? "",
      },
      correct_answer: correctAnswer,
    };
  }
  if (q.answer.style === "SPR") {
    return {
      type: "spr",
      stem: q.prompt || "",
      stimulus: q.body || "",
      rationale: q.answer.rationale || "",
      answerOptions: null,
      correct_answer: correctAnswer,
    };
  }
  return null;
}

// Disclosed SPR rationales sometimes encode the correct answer in the
// "<img alt=...>" alt text using written fractions; translate them numerically.
const NUMERATOR_WORDS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
};
const DENOMINATOR_WORDS = {
  half: 2, halves: 2, third: 3, thirds: 3, quarter: 4, quarters: 4,
  fifth: 5, fifths: 5, sixth: 6, sixths: 6, seventh: 7, sevenths: 7,
  eighth: 8, eighths: 8, ninth: 9, ninths: 9, tenth: 10, tenths: 10,
};
function translateFractionWords(word) {
  if (!word) return "";
  const m = word.toLowerCase().trim().match(/^(\w+)\s+(\w+)$/);
  if (!m) return word;
  const n = NUMERATOR_WORDS[m[1]];
  const d = DENOMINATOR_WORDS[m[2]];
  return n != null && d != null ? `${n}/${d}` : word;
}

function extractDisclosedCorrectAnswer(q) {
  if (q.answer?.style === "Multiple Choice" && q.answer.correct_choice) {
    return [String(q.answer.correct_choice).toUpperCase()];
  }
  const rationale = q.answer?.rationale || "";
  const m = rationale.match(
    /The correct answer is ([A-D])\.|Choice ([A-D]) is correct\.|alt="([^"]*)"/i
  );
  if (!m) return [];
  if (m[3]) return [translateFractionWords(m[3]).toUpperCase()];
  return [(m[1] || m[2] || "").toUpperCase()];
}

async function fetchRegularQuestion(externalId, signal) {
  const resp = await fetch(`${CB_QBANK_BASE}/digital/get-question`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ external_id: externalId }),
    signal,
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  if (!data || !data.externalid) return null;

  if (data.type === "mcq") {
    const opts = Array.isArray(data.answerOptions) ? data.answerOptions : [];
    const answerOptions = { A: "", B: "", C: "", D: "" };
    opts.forEach((opt, idx) => {
      const key = ["A", "B", "C", "D"][idx];
      if (key) answerOptions[key] = opt?.content ?? "";
    });
    return {
      type: "mcq",
      stem: data.stem || "",
      stimulus: data.stimulus || "",
      rationale: data.rationale || "",
      answerOptions,
      correct_answer: Array.isArray(data.correct_answer)
        ? data.correct_answer.map((s) => String(s).toUpperCase())
        : [],
    };
  }
  if (data.type === "spr") {
    return {
      type: "spr",
      stem: data.stem || "",
      stimulus: data.stimulus || "",
      rationale: data.rationale || "",
      answerOptions: null,
      correct_answer: Array.isArray(data.correct_answer)
        ? data.correct_answer
        : [],
    };
  }
  return null;
}

export async function fetchQuestionDetail(idParam, signal) {
  if (!idParam) return null;
  const id = String(idParam);
  const cached = cacheTouch(detailCache, id);
  if (cached && Date.now() - cached.fetchedAt < DETAIL_CACHE_TTL_MS) {
    return cached.detail;
  }
  try {
    const detail = id.includes("-DC")
      ? await fetchDisclosedQuestion(id, signal)
      : await fetchRegularQuestion(id, signal);
    if (detail) {
      cacheSet(detailCache, id, { detail, fetchedAt: Date.now() }, DETAIL_CACHE_MAX);
    }
    return detail;
  } catch {
    return null;
  }
}

// ── Normalization ─────────────────────────────────────────────────────
// Combine list-metadata + detail into the shape the Korah frontend expects.
function fixImageUrls(html) {
  // Disclosed images reference saic.collegeboard.org with absolute URLs already.
  // qbank stem/stimulus HTML is self-contained too — nothing to rewrite. Return as-is.
  return typeof html === "string" ? html : "";
}

export function normalizeQuestion(meta, detail) {
  const domainCode = meta?.primary_class_cd;
  const domainName =
    DOMAIN_CODE_TO_NAME[domainCode] ||
    meta?.primary_class_cd_desc ||
    domainCode ||
    "";
  const section = sectionForDomainCode(domainCode) || "english";
  const loaded = Boolean(detail);
  const detailKey = meta?.external_id || meta?.ibn || "";

  return {
    id: meta?.questionId || meta?.external_id || meta?.ibn || "",
    // The upstream identifier the frontend hands back when requesting on-demand
    // detail via /api/sat/question?id=…
    detailKey,
    section,
    domain: domainName,
    skillCd: meta?.skill_cd || "",
    difficulty: meta?.difficulty || "",
    paragraph: loaded ? fixImageUrls(detail.stimulus) : "",
    stem: loaded ? fixImageUrls(detail.stem) : "",
    options: loaded ? optionsArray(detail.answerOptions) : [],
    correctAnswer: loaded
      ? Array.isArray(detail.correct_answer)
        ? detail.correct_answer[0] ?? ""
        : typeof detail.correct_answer === "string"
          ? detail.correct_answer
          : ""
      : "",
    explanation: loaded ? fixImageUrls(detail.rationale) : "",
    type: loaded ? detail.type || "mcq" : "mcq",
    loaded,
  };
}

function optionsArray(answerOptions) {
  if (!answerOptions || typeof answerOptions !== "object") return [];
  return ["A", "B", "C", "D"]
    .filter((k) => answerOptions[k] != null && answerOptions[k] !== "")
    .map((k) => ({ key: k, text: fixImageUrls(answerOptions[k]) }));
}

// ── Helpers used by route handlers ────────────────────────────────────
export function resolveDomainCodes({ sections, domains }) {
  // domains may be "any" or an array of domain *names* (e.g. "Algebra")
  // or codes (e.g. "H"). Result is a deduped list of domain codes.
  const wantAll =
    !domains ||
    domains === "any" ||
    (Array.isArray(domains) && (domains.length === 0 || domains.includes("any")));

  if (wantAll) {
    const codes = new Set();
    for (const sec of sections) {
      (SECTION_DOMAIN_CODES[sec] || []).forEach((c) => codes.add(c));
    }
    return [...codes];
  }
  const list = Array.isArray(domains) ? domains : [domains];
  const codes = new Set();
  for (const d of list) {
    const code = DOMAIN_NAME_TO_CODE[d] || (DOMAIN_CODE_TO_NAME[d] ? d : null);
    if (code) codes.add(code);
  }
  // If no valid codes resolved, fall back to all codes for the requested sections.
  if (codes.size === 0) {
    for (const sec of sections) {
      (SECTION_DOMAIN_CODES[sec] || []).forEach((c) => codes.add(c));
    }
  }
  return [...codes];
}

export function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
