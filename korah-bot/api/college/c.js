// GET /api/college/c — college list for the College Match feature (Issue #44).
// Phase 1: serves a hardcoded placeholder set in the final response shape.
// Phase 2: the sync script writes data/colleges.json and this route reads that
// instead — see the marked seam line below. The frontend never knows which.

export const config = {
  maxDuration: 60,
};

// Scorecard data lags about two years; stamped visibly on the page.
const DATA_YEAR = 2024;

// In-memory cache for cold starts; the Vercel CDN does the heavy lifting via
// the response headers below (same pattern as api/sat/s.js).
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache = null;

// Phase 1 placeholder set — ~26 schools hand-entered with real looked-up
// numbers (College Scorecard / Common Data Sets). Spans Ivies, mid-selectivity
// privates, large state schools, and deliberately includes test-blind UC
// schools with sat: null so the no-data card state is real from day one.
//
// sat.combined.p* = math.p* + erw.p* (summed section percentiles, spec §2),
// derived once by the data producer — never computed client-side.
const COLLEGES = [
  {
    id: "harvard-university", name: "Harvard University", city: "Cambridge", state: "MA",
    public: false, size: 21650, admitRate: 0.033,
    sat: {
      avg: 1520,
      combined: { p25: 1500, p50: 1550, p75: 1580 },
      math: { p25: 760, p50: 790, p75: 800 },
      erw: { p25: 740, p50: 760, p75: 780 },
    },
    tips: [
      { kind: "math-heavy", text: "Harvard's admitted students skew math heavy. Their math 50th is 790 against 760 for reading and writing." },
    ],
  },
  {
    id: "mit", name: "Massachusetts Institute of Technology", city: "Cambridge", state: "MA",
    public: false, size: 4653, admitRate: 0.047,
    sat: {
      avg: 1540,
      combined: { p25: 1520, p50: 1560, p75: 1570 },
      math: { p25: 790, p50: 800, p75: 800 },
      erw: { p25: 730, p50: 760, p75: 770 },
    },
    tips: [
      { kind: "math-heavy", text: "MIT's admitted students skew math heavy. Their math 50th is 800 against 760 for reading and writing." },
    ],
  },
  {
    id: "yale-university", name: "Yale University", city: "New Haven", state: "CT",
    public: false, size: 6774, admitRate: 0.035,
    sat: {
      avg: 1530,
      combined: { p25: 1460, p50: 1530, p75: 1570 },
      math: { p25: 730, p50: 770, p75: 790 },
      erw: { p25: 730, p50: 760, p75: 780 },
    },
    tips: [],
  },
  {
    id: "princeton-university", name: "Princeton University", city: "Princeton", state: "NJ",
    public: false, size: 5604, admitRate: 0.041,
    sat: {
      avg: 1520,
      combined: { p25: 1450, p50: 1520, p75: 1560 },
      math: { p25: 720, p50: 760, p75: 790 },
      erw: { p25: 730, p50: 760, p75: 770 },
    },
    tips: [],
  },
  {
    id: "columbia-university", name: "Columbia University", city: "New York", state: "NY",
    public: false, size: 8900, admitRate: 0.039,
    sat: {
      avg: 1530,
      combined: { p25: 1450, p50: 1520, p75: 1570 },
      math: { p25: 730, p50: 770, p75: 800 },
      erw: { p25: 720, p50: 750, p75: 770 },
    },
    tips: [
      { kind: "math-heavy", text: "Columbia's admitted students skew math heavy. Their math 50th is 770 against 750 for reading and writing." },
    ],
  },
  {
    id: "stanford-university", name: "Stanford University", city: "Stanford", state: "CA",
    public: false, size: 7841, admitRate: 0.038,
    sat: {
      avg: 1530,
      combined: { p25: 1440, p50: 1520, p75: 1560 },
      math: { p25: 730, p50: 770, p75: 790 },
      erw: { p25: 710, p50: 750, p75: 770 },
    },
    tips: [
      { kind: "math-heavy", text: "Stanford's admitted students skew math heavy. Their math 50th is 770 against 750 for reading and writing." },
    ],
  },
  {
    id: "upenn", name: "University of Pennsylvania", city: "Philadelphia", state: "PA",
    public: false, size: 10129, admitRate: 0.059,
    sat: {
      avg: 1520,
      combined: { p25: 1450, p50: 1520, p75: 1560 },
      math: { p25: 730, p50: 770, p75: 790 },
      erw: { p25: 720, p50: 750, p75: 770 },
    },
    tips: [
      { kind: "math-heavy", text: "Penn's admitted students skew math heavy. Their math 50th is 770 against 750 for reading and writing." },
    ],
  },
  {
    id: "georgetown-university", name: "Georgetown University", city: "Washington", state: "DC",
    public: false, size: 7643, admitRate: 0.12,
    sat: {
      avg: 1480,
      combined: { p25: 1440, p50: 1500, p75: 1540 },
      math: { p25: 710, p50: 750, p75: 770 },
      erw: { p25: 730, p50: 750, p75: 770 },
    },
    tips: [],
  },
  {
    id: "nyu", name: "New York University", city: "New York", state: "NY",
    public: false, size: 29401, admitRate: 0.08,
    sat: {
      avg: 1490,
      combined: { p25: 1400, p50: 1480, p75: 1550 },
      math: { p25: 700, p50: 750, p75: 790 },
      erw: { p25: 700, p50: 730, p75: 760 },
    },
    tips: [
      { kind: "math-heavy", text: "NYU's admitted students skew math heavy. Their math 50th is 750 against 730 for reading and writing." },
    ],
  },
  {
    id: "boston-university", name: "Boston University", city: "Boston", state: "MA",
    public: false, size: 18500, admitRate: 0.14,
    sat: {
      avg: 1440,
      combined: { p25: 1350, p50: 1440, p75: 1510 },
      math: { p25: 680, p50: 730, p75: 770 },
      erw: { p25: 670, p50: 710, p75: 740 },
    },
    tips: [
      { kind: "math-heavy", text: "Boston University's admitted students skew math heavy. Their math 50th is 730 against 710 for reading and writing." },
    ],
  },
  {
    id: "northeastern-university", name: "Northeastern University", city: "Boston", state: "MA",
    public: false, size: 16302, admitRate: 0.07,
    sat: {
      avg: 1480,
      combined: { p25: 1390, p50: 1480, p75: 1530 },
      math: { p25: 700, p50: 750, p75: 780 },
      erw: { p25: 690, p50: 730, p75: 750 },
    },
    tips: [
      { kind: "math-heavy", text: "Northeastern's admitted students skew math heavy. Their math 50th is 750 against 730 for reading and writing." },
    ],
  },
  {
    id: "tufts-university", name: "Tufts University", city: "Medford", state: "MA",
    public: false, size: 7120, admitRate: 0.11,
    sat: {
      avg: 1490,
      combined: { p25: 1430, p50: 1500, p75: 1550 },
      math: { p25: 710, p50: 750, p75: 780 },
      erw: { p25: 720, p50: 750, p75: 770 },
    },
    tips: [],
  },
  {
    id: "usc", name: "University of Southern California", city: "Los Angeles", state: "CA",
    public: false, size: 21093, admitRate: 0.099,
    sat: {
      avg: 1480,
      combined: { p25: 1410, p50: 1490, p75: 1540 },
      math: { p25: 720, p50: 760, p75: 790 },
      erw: { p25: 690, p50: 730, p75: 750 },
    },
    tips: [
      { kind: "math-heavy", text: "USC's admitted students skew math heavy. Their math 50th is 760 against 730 for reading and writing." },
    ],
  },
  {
    id: "penn-state", name: "Penn State University Park", city: "University Park", state: "PA",
    public: true, size: 46803, admitRate: 0.55,
    sat: {
      avg: 1280,
      combined: { p25: 1190, p50: 1280, p75: 1390 },
      math: { p25: 600, p50: 650, p75: 710 },
      erw: { p25: 590, p50: 630, p75: 680 },
    },
    tips: [
      { kind: "math-heavy", text: "Penn State's admitted students skew math heavy. Their math 50th is 650 against 630 for reading and writing." },
    ],
  },
  {
    id: "ohio-state", name: "Ohio State University", city: "Columbus", state: "OH",
    public: true, size: 46123, admitRate: 0.53,
    sat: {
      avg: 1340,
      combined: { p25: 1210, p50: 1330, p75: 1440 },
      math: { p25: 610, p50: 680, p75: 740 },
      erw: { p25: 600, p50: 650, p75: 700 },
    },
    tips: [
      { kind: "math-heavy", text: "Ohio State's admitted students skew math heavy. Their math 50th is 680 against 650 for reading and writing." },
    ],
  },
  {
    id: "ut-austin", name: "University of Texas at Austin", city: "Austin", state: "TX",
    public: true, size: 41309, admitRate: 0.31,
    sat: {
      avg: 1350,
      combined: { p25: 1220, p50: 1340, p75: 1480 },
      math: { p25: 610, p50: 680, p75: 760 },
      erw: { p25: 610, p50: 660, p75: 720 },
    },
    tips: [
      { kind: "math-heavy", text: "UT Austin's admitted students skew math heavy. Their math 50th is 680 against 660 for reading and writing." },
    ],
  },
  {
    id: "michigan-state", name: "Michigan State University", city: "East Lansing", state: "MI",
    public: true, size: 38574, admitRate: 0.63,
    sat: {
      avg: 1270,
      combined: { p25: 1160, p50: 1270, p75: 1390 },
      math: { p25: 590, p50: 650, p75: 720 },
      erw: { p25: 570, p50: 620, p75: 670 },
    },
    tips: [
      { kind: "math-heavy", text: "Michigan State's admitted students skew math heavy. Their math 50th is 650 against 620 for reading and writing." },
    ],
  },
  {
    id: "rutgers", name: "Rutgers University", city: "New Brunswick", state: "NJ",
    public: true, size: 36344, admitRate: 0.65,
    sat: {
      avg: 1280,
      combined: { p25: 1160, p50: 1270, p75: 1390 },
      math: { p25: 580, p50: 640, p75: 710 },
      erw: { p25: 580, p50: 630, p75: 680 },
    },
    tips: [],
  },
  {
    id: "uconn", name: "University of Connecticut", city: "Storrs", state: "CT",
    public: true, size: 24431, admitRate: 0.56,
    sat: {
      avg: 1290,
      combined: { p25: 1200, p50: 1290, p75: 1410 },
      math: { p25: 600, p50: 650, p75: 720 },
      erw: { p25: 600, p50: 640, p75: 690 },
    },
    tips: [],
  },
  {
    id: "suny-stony-brook", name: "Stony Brook University", city: "Stony Brook", state: "NY",
    public: true, size: 17932, admitRate: 0.48,
    sat: {
      avg: 1310,
      combined: { p25: 1190, p50: 1300, p75: 1420 },
      math: { p25: 600, p50: 660, p75: 730 },
      erw: { p25: 590, p50: 640, p75: 690 },
    },
    tips: [
      { kind: "math-heavy", text: "Stony Brook's admitted students skew math heavy. Their math 50th is 660 against 640 for reading and writing." },
    ],
  },
  {
    id: "university-of-florida", name: "University of Florida", city: "Gainesville", state: "FL",
    public: true, size: 34552, admitRate: 0.23,
    sat: {
      avg: 1370,
      combined: { p25: 1240, p50: 1360, p75: 1470 },
      math: { p25: 620, p50: 690, p75: 750 },
      erw: { p25: 620, p50: 670, p75: 720 },
    },
    tips: [
      { kind: "math-heavy", text: "University of Florida's admitted students skew math heavy. Their math 50th is 690 against 670 for reading and writing." },
    ],
  },
  {
    id: "georgia-tech", name: "Georgia Institute of Technology", city: "Atlanta", state: "GA",
    public: true, size: 18415, admitRate: 0.21,
    sat: {
      avg: 1440,
      combined: { p25: 1370, p50: 1470, p75: 1530 },
      math: { p25: 700, p50: 760, p75: 790 },
      erw: { p25: 670, p50: 710, p75: 740 },
    },
    tips: [
      { kind: "math-heavy", text: "Georgia Tech's admitted students skew math heavy. Their math 50th is 760 against 710 for reading and writing." },
    ],
  },
  {
    id: "uva", name: "University of Virginia", city: "Charlottesville", state: "VA",
    public: true, size: 17496, admitRate: 0.19,
    sat: {
      avg: 1450,
      combined: { p25: 1350, p50: 1450, p75: 1540 },
      math: { p25: 680, p50: 730, p75: 780 },
      erw: { p25: 670, p50: 720, p75: 760 },
    },
    tips: [],
  },
  {
    id: "uc-berkeley", name: "University of California, Berkeley", city: "Berkeley", state: "CA",
    public: true, size: 32831, admitRate: 0.117, sat: null, tips: [],
  },
  {
    id: "ucla", name: "University of California, Los Angeles", city: "Los Angeles", state: "CA",
    public: true, size: 32119, admitRate: 0.087, sat: null, tips: [],
  },
  {
    id: "uc-san-diego", name: "University of California, San Diego", city: "La Jolla", state: "CA",
    public: true, size: 34844, admitRate: 0.237, sat: null, tips: [],
  },
];

// ── THE ONLY LINE TO CHANGE IN PHASE 2 ──────────────────────────────────────
// Point `source` at the synced dataset (read + cache data/colleges.json) once
// the sync script lands. Nothing else in this route or the frontend changes.
const source = COLLEGES;
// ────────────────────────────────────────────────────────────────────────────

function setCacheHeaders(res) {
  res.setHeader("Cache-Control", "public, s-maxage=3600");
  res.setHeader("CDN-Cache-Control", "public, s-maxage=60");
  res.setHeader("Vercel-CDN-Cache-Control", "public, s-maxage=3600");
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  if (cache && now - cache.builtAt < CACHE_TTL_MS) {
    setCacheHeaders(res);
    return res.status(200).json(cache.payload);
  }

  try {
    const payload = {
      success: true,
      data: {
        dataYear: DATA_YEAR,
        schools: source,
      },
      message: "Colleges fetched successfully",
    };
    cache = { builtAt: now, payload };
    setCacheHeaders(res);
    return res.status(200).json(payload);
  } catch (err) {
    console.error("College fetch error:", err);
    const body = {
      success: false,
      error: "Failed to fetch colleges",
    };
    if (process.env.VERCEL_ENV !== "production") {
      body.details = err instanceof Error ? err.message : String(err);
    }
    return res.status(502).json(body);
  }
}