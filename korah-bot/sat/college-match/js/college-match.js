/**
 * College Match — pure classification + tip builders (Issue #44).
 *
 * This file has NO DOM, NO fetch, NO Firestore, NO Alpine. It is deliberately
 * reviewable in isolation: anyone can call classify() with fake numbers and
 * check every cell of the classification matrix without a browser.
 *
 * Pure function of (score, school) → { label, tier, band, reason }.
 * Every label is directional, never a prediction.
 *
 * Exposed as window.CollegeMatch for non-module page scripts.
 */
(function () {
  "use strict";

  // ── Config thresholds (single source of truth for the matrix) ────────────
  const MATCH_CONFIG = {
    // Full combined-score range the SAT slider can produce.
    MIN_SCORE: 400,
    MAX_SCORE: 1600,

    // Admit-rate tiers. Checked from high → low; a rate of exactly 0.5 is
    // medium, exactly 0.2 is low (conservative: nothing under ~20% is ever a
    // safety, per the issue).
    ADMIT_TIERS: [
      { tier: "high",   atOrAbove: 0.5 },  // > 50%
      { tier: "medium", atOrAbove: 0.2 },  // > 20%, <= 50%
      { tier: "low",    atOrAbove: 0 },    // <= 20%
    ],

    // Combined-score bands relative to the school's p75 / p50 / p25.
    SCORE_BANDS: [
      { band: "above75", atOrAbove: 75 },
      { band: "50to75",  atOrAbove: 50 },
      { band: "25to50",  atOrAbove: 25 },
      { band: "below25", atOrAbove: 0 },
    ],

    // label[admit tier][score band]. The "no safety below 20% admit" rule is
    // enforced here structurally: the low row is all reach.
    LABEL_MATRIX: {
      high:   { above75: "safety", "50to75": "safety", "25to50": "match", below25: "reach" },
      medium: { above75: "match",  "50to75": "match",  "25to50": "reach", below25: "reach" },
      low:    { above75: "reach",  "50to75": "reach",  "25to50": "reach", below25: "reach" },
    },

    // Missing / partial SAT data is its own honest label — never a guess.
    NO_DATA_LABEL: "no-data",

    // School-level tips are generated from the data, two rules.
    MATH_HEAVY_MARGIN: 20,       // math.p50 - erw.p50 >= 20 → math-heavy
    TIGHT_CLUSTER_SPAN: 40,      // combined.p75 - combined.p25 <= 40 → tight
  };

  // ── Helpers ───────────────────────────────────────────────────────────────

  function clampScore(score) {
    if (typeof score !== "number" || Number.isNaN(score)) return MATCH_CONFIG.MIN_SCORE;
    return Math.max(MATCH_CONFIG.MIN_SCORE, Math.min(MATCH_CONFIG.MAX_SCORE, score));
  }

  // A school has usable SAT data only when every percentile we need is real.
  function hasSatData(school) {
    const s = school && school.sat;
    if (!s) return false;
    const c = s.combined;
    if (!c) return false;
    return [c.p25, c.p50, c.p75].every((n) => typeof n === "number" && Number.isFinite(n));
  }

  function scoreBand(score, c) {
    if (score >= c.p75) return "above75";
    if (score >= c.p50) return "50to75";
    if (score >= c.p25) return "25to50";
    return "below25";
  }

  // Infer band from a single percentile pair (used by the student-level tip,
  // where the score is a math *or* reading/writing section score against the
  // school's corresponding section band).
  function bandLabel(score, p25, p50, p75) {
    if (score >= p75) return "above the 75th";
    if (score >= p50) return "around the 50th";
    if (score >= p25) return "below the 50th but above the 25th";
    return "below the 25th";
  }

  function admitTier(rate) {
    for (const t of MATCH_CONFIG.ADMIT_TIERS) {
      if (rate > t.atOrAbove) return t.tier;
    }
    return "low";
  }

  function labelWord(label) {
    return label === "no-data" ? "Not enough data" : label;
  }

  // ── classify: the heart of the feature ────────────────────────────────────
  // Pure: (score, school) → { label, tier, band, reason }.
  // No side effects. Callable with fake records for every matrix cell.
  function classify(score, school) {
    if (!hasSatData(school)) {
      return {
        label: MATCH_CONFIG.NO_DATA_LABEL,
        tier: null,
        band: null,
        reason: `${school.name} doesn't report SAT percentiles, so we can't line your score up against their admitted class.`,
      };
    }

    const s = clampScore(score);
    const c = school.sat.combined;
    const band = scoreBand(s, c);
    const rate = typeof school.admitRate === "number" ? school.admitRate : 0;
    const tier = admitTier(rate);
    const label = MATCH_CONFIG.LABEL_MATRIX[tier][band];

    const bandText =
      band === "above75"
        ? `above their ${c.p75}`
        : band === "50to75"
          ? `between their 50th (${c.p50}) and 75th (${c.p75})`
          : band === "25to50"
            ? `between their 25th (${c.p25}) and 50th (${c.p50})`
            : `below their ${c.p25}`;

    const bps = Math.round(rate * 100);
    const admitText =
      tier === "high"
        ? `about ${bps}% admit, so the odds are on your side`
        : tier === "medium"
          ? `about ${bps}% admit, so it's competitive`
          : `a ${bps}% admit rate — it's a genuine long shot for everyone`;

    const reason = `Your ${s} is ${bandText} for ${school.name}. ${admitText}. ` +
      `That makes it a ${labelWord(label)} for you.`;

    return { label, tier, band, reason };
  }

  // ── School-level tips (computed by the sync script / at data-authoring time;
  //    this mirrors the Phase 2 rules so Phase 1 tips match the real output). ─
  // Returns an array of { kind, text } applied to a single school record.
  function schoolTips(school) {
    const tips = [];
    if (!hasSatData(school)) return tips;
    const m = school.sat.math;
    const e = school.sat.erw;
    const c = school.sat.combined;

    if (
      typeof m.p50 === "number" &&
      typeof e.p50 === "number" &&
      m.p50 - e.p50 >= MATCH_CONFIG.MATH_HEAVY_MARGIN
    ) {
      tips.push({
        kind: "math-heavy",
        text: `${school.name}'s admitted students skew math heavy. ` +
          `Their math 50th is ${m.p50} against ${e.p50} for reading and writing.`,
      });
    }

    if (c.p75 - c.p25 <= MATCH_CONFIG.TIGHT_CLUSTER_SPAN) {
      tips.push({
        kind: "tight-cluster",
        text: `Scores cluster tightly at ${school.name}, so there's not much room below the median.`,
      });
    }

    return tips;
  }

  // ── Student-level tip, computed live in the browser ───────────────────────
  // Not stored anywhere. Compares the student's saved math/reading/writing
  // section scores against the school's matching section band.
  // Returns an array of human strings (one per section the student has).
  function studentTip({ mathScore, englishScore }, school) {
    const out = [];
    if (!hasSatData(school)) return out;

    const m = school.sat.math;
    const e = school.sat.erw;

    if (typeof mathScore === "number" && Number.isFinite(mathScore)) {
      out.push(
        `Your math (${mathScore}) is ${bandLabel(mathScore, m.p25, m.p50, m.p75)} ` +
          `for ${school.name} (their math is ${m.p25}–${m.p75} middle half).`
      );
    }

    if (typeof englishScore === "number" && Number.isFinite(englishScore)) {
      out.push(
        `Your reading and writing (${englishScore}) is ${bandLabel(englishScore, e.p25, e.p50, e.p75)} ` +
          `for ${school.name} (theirs is ${e.p25}–${e.p75}).`
      );
    }

    return out;
  }

  // ── classifyAll: convenience for the page (no DOM, still pure) ────────────
  function classifyAll(score, schools) {
    return (schools || []).map((s) => ({ school: s, ...classify(score, s) }));
  }

  // Expose for non-module scripts.
  window.CollegeMatch = {
    MATCH_CONFIG,
    classify,
    classifyAll,
    schoolTips,
    studentTip,
    hasSatData,
  };
})();