// GET /api/college/c — college list for the College Match feature (Issue #44).
//
// The dataset is built ahead of time by scripts/sync-scorecard.js from the U.S.
// Department of Education College Scorecard API and committed as
// data/colleges.js, so this route never calls an external API at request time
// and needs no API key. Rerun the script when a new Scorecard year lands.

import dataset from "./data/colleges.js";

export const config = {
  maxDuration: 60,
};

// Scorecard data lags about two years; the year is stamped visibly on the page.
const DATA_YEAR = dataset.dataYear;

// Sorted by admit rate in the sync script. sat.combined.p* is math.p* + erw.p*
// (summed section percentiles, spec §2), derived once by the data producer and
// never computed client-side. Schools that don't publish SAT percentiles carry
// sat: null and render as the page's "not enough data" state.
const source = dataset.schools;

// In-memory cache for cold starts; the Vercel CDN does the heavy lifting via
// the response headers below (same pattern as api/sat/s.js).
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
let cache = null;

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
