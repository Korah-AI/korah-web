/**
 * College Match page — Alpine component + data wiring (Issue #44).
 *
 * Renders the three safety/match/reach columns, drives the non-destructive
 * slider, filters, score prompt, and the fallback dataset for local dev.
 *
 * Everything score-classification related lives in college-match.js (pure).
 * This file has no classification math; it calls window.CollegeMatch.
 */
(function () {
  "use strict";

  const CollegeMatch = window.CollegeMatch;
  const DEFAULT_SCORE = 1200; // slider value when the user has no saved score

  // ── Fallback payload — mirrors api/college/c.js so the page is fully
  //    buildable/testable on localhost, where the route 404s. The helper sums
  //    section percentiles into the combined band exactly like the route data.
  const S = (id, name, city, state, pub, size, rate, avg, mp25, mp50, mp75, ep25, ep50, ep75) => ({
    id, name, city, state, public: pub, size, admitRate: rate,
    sat: {
      avg,
      combined: { p25: mp25 + ep25, p50: mp50 + ep50, p75: mp75 + ep75 },
      math: { p25: mp25, p50: mp50, p75: mp75 },
      erw: { p25: ep25, p50: ep50, p75: ep75 },
    },
    tips: [],
  });

  const FALLBACK_SCHOOLS = {
    dataYear: 2024,
    schools: [
      S("harvard-university", "Harvard University", "Cambridge", "MA", false, 21650, 0.033, 1520, 760, 790, 800, 740, 760, 780),
      S("mit", "Massachusetts Institute of Technology", "Cambridge", "MA", false, 4653, 0.047, 1540, 790, 800, 800, 730, 760, 770),
      S("yale-university", "Yale University", "New Haven", "CT", false, 6774, 0.035, 1530, 730, 770, 790, 730, 760, 780),
      S("princeton-university", "Princeton University", "Princeton", "NJ", false, 5604, 0.041, 1520, 720, 760, 790, 730, 760, 770),
      S("columbia-university", "Columbia University", "New York", "NY", false, 8900, 0.039, 1530, 730, 770, 800, 720, 750, 770),
      S("stanford-university", "Stanford University", "Stanford", "CA", false, 7841, 0.038, 1530, 730, 770, 790, 710, 750, 770),
      S("upenn", "University of Pennsylvania", "Philadelphia", "PA", false, 10129, 0.059, 1520, 730, 770, 790, 720, 750, 770),
      S("georgetown-university", "Georgetown University", "Washington", "DC", false, 7643, 0.12, 1480, 710, 750, 770, 730, 750, 770),
      S("nyu", "New York University", "New York", "NY", false, 29401, 0.08, 1490, 700, 750, 790, 700, 730, 760),
      S("boston-university", "Boston University", "Boston", "MA", false, 18500, 0.14, 1440, 680, 730, 770, 670, 710, 740),
      S("northeastern-university", "Northeastern University", "Boston", "MA", false, 16302, 0.07, 1480, 700, 750, 780, 690, 730, 750),
      S("tufts-university", "Tufts University", "Medford", "MA", false, 7120, 0.11, 1490, 710, 750, 780, 720, 750, 770),
      S("usc", "University of Southern California", "Los Angeles", "CA", false, 21093, 0.099, 1480, 720, 760, 790, 690, 730, 750),
      S("penn-state", "Penn State University Park", "University Park", "PA", true, 46803, 0.55, 1280, 600, 650, 710, 590, 630, 680),
      S("ohio-state", "Ohio State University", "Columbus", "OH", true, 46123, 0.53, 1340, 610, 680, 740, 600, 650, 700),
      S("ut-austin", "University of Texas at Austin", "Austin", "TX", true, 41309, 0.31, 1350, 610, 680, 760, 610, 660, 720),
      S("michigan-state", "Michigan State University", "East Lansing", "MI", true, 38574, 0.63, 1270, 590, 650, 720, 570, 620, 670),
      S("rutgers", "Rutgers University", "New Brunswick", "NJ", true, 36344, 0.65, 1280, 580, 640, 710, 580, 630, 680),
      S("uconn", "University of Connecticut", "Storrs", "CT", true, 24431, 0.56, 1290, 600, 650, 720, 600, 640, 690),
      S("suny-stony-brook", "Stony Brook University", "Stony Brook", "NY", true, 17932, 0.48, 1310, 600, 660, 730, 590, 640, 690),
      S("university-of-florida", "University of Florida", "Gainesville", "FL", true, 34552, 0.23, 1370, 620, 690, 750, 620, 670, 720),
      S("georgia-tech", "Georgia Institute of Technology", "Atlanta", "GA", true, 18415, 0.21, 1440, 700, 760, 790, 670, 710, 740),
      S("uva", "University of Virginia", "Charlottesville", "VA", true, 17496, 0.19, 1450, 680, 730, 780, 670, 720, 760),
      // Test-blind UC schools — no reported SAT percentiles (honest no-data state).
      { id: "uc-berkeley", name: "University of California, Berkeley", city: "Berkeley", state: "CA", public: true, size: 32831, admitRate: 0.117, sat: null, tips: [] },
      { id: "ucla", name: "University of California, Los Angeles", city: "Los Angeles", state: "CA", public: true, size: 32119, admitRate: 0.087, sat: null, tips: [] },
      { id: "uc-san-diego", name: "University of California, San Diego", city: "La Jolla", state: "CA", public: true, size: 34844, admitRate: 0.237, sat: null, tips: [] },
    ],
  };

  function sizeBucket(size) {
    if (size < 10000) return "small";
    if (size <= 30000) return "medium";
    return "large";
  }

  function collegeMatchFactory() {
    return {
      // Data + identity
      ready: false,
      source: "",           // "route" | "fallback"
      dataYear: null,
      schools: [],

      // Saved profile (never modified by the slider)
      savedScore: null,
      mathScore: null,
      englishScore: null,

      // Slider + preview state
      score: DEFAULT_SCORE,

      // Filters
      stateFilter: "all",
      sizeFilter: "all",
      typeFilter: "all",

      // Card expansion + no-data section
      expandedId: null,
      showNoData: false,

      // Score prompt
      prompt: false,
      promptCurrent: "",
      promptMath: "",
      promptEnglish: "",
      promptError: "",

      async init() {
        await Promise.all([this.loadSchools(), this.loadProfile()]);
        if (this.savedScore == null) this.prompt = true;
        this.ready = true;
      },

      // ── Data loading ─────────────────────────────────────────────────────
      async loadSchools() {
        try {
          const res = await fetch("/api/college/c");
          if (!res.ok) throw new Error("route " + res.status);
          const json = await res.json();
          const d = json && json.success ? json.data : null;
          if (!d || !Array.isArray(d.schools) || !d.schools.length) throw new Error("empty payload");
          this.dataYear = d.dataYear;
          this.schools = d.schools;
          this.source = "route";
        } catch (e) {
          // Localhost has no serverless route — fall back to the embedded copy;
          // the page must come up complete, not broken.
          this.dataYear = FALLBACK_SCHOOLS.dataYear;
          this.schools = FALLBACK_SCHOOLS.schools.map((s) => ({
            ...s,
            tips: CollegeMatch.schoolTips(s),
          }));
          this.source = "fallback";
        }
      },

      async loadProfile() {
        const raw = await window.KorahSATAnalytics?.getProfile?.();
        if (!raw) return;
        const cur = Number(raw.currentScore);
        if (Number.isFinite(cur) && cur > 0) {
          this.savedScore = cur;
          this.score = cur;
        }
        const ms = Number(raw.mathScore);
        const es = Number(raw.englishScore);
        this.mathScore = Number.isFinite(ms) ? ms : null;
        this.englishScore = Number.isFinite(es) ? es : null;
      },

      // ── Filters / visibility ─────────────────────────────────────────────
      get states() {
        return [...new Set(this.schools.map((s) => s.state))].sort();
      },

      visible() {
        return this.schools.filter((s) => {
          if (this.stateFilter !== "all" && s.state !== this.stateFilter) return false;
          if (this.sizeFilter !== "all" && sizeBucket(s.size) !== this.sizeFilter) return false;
          if (this.typeFilter === "public" && !s.public) return false;
          if (this.typeFilter === "private" && s.public) return false;
          return true;
        });
      },

      // Classified columns — recomputed reactively on every slider tick, so
      // cards refill columns live while dragging.
      get groups() {
        const out = { safety: [], match: [], reach: [], noData: [] };
        for (const school of this.visible()) {
          const r = CollegeMatch.classify(this.score, school);
          const key = r.label === "no-data" ? "noData" : r.label;
          out[key].push({ school, ...r });
        }
        return out;
      },

      isExpanded(id) {
        return this.expandedId === id;
      },

      toggleDetails(id) {
        this.expandedId = this.expandedId === id ? null : id;
      },

      // ── Slider ───────────────────────────────────────────────────────────
      get isPreviewing() {
        return this.savedScore != null && this.score !== this.savedScore;
      },

      get hasSavedScore() {
        return this.savedScore != null;
      },

      onSlider(v) {
        this.score = Number(v);
      },

      backToScore() {
        if (this.savedScore != null) this.score = this.savedScore;
      },

      // Where the saved-score tick sits on the 400–1600 track, as a %.
      savedTickPct() {
        if (this.savedScore == null) return 0;
        return ((this.savedScore - 400) / 1200) * 100;
      },

      // ── Band-bar positioning (pure, no exports needed from CollegeMatch) ──
      markPct(score, band) {
        if (score == null || !band) return null;
        if (score < band.p25) return { pct: 0, pos: "below" };
        if (score > band.p75) return { pct: 100, pos: "above" };
        return { pct: ((score - band.p25) / (band.p75 - band.p25)) * 100, pos: "in" };
      },

      // ── Formatting helpers ───────────────────────────────────────────────
      fmtRate(r) {
        return Math.round(r * 100) + "%";
      },

      fmtSize(n) {
        return n.toLocaleString("en-US");
      },

      cap(label) {
        return label === "no-data" ? "Not enough data" : label.charAt(0).toUpperCase() + label.slice(1);
      },

      region(school) {
        return school.city + ", " + school.state;
      },

      // ── Tips ──────────────────────────────────────────────────────────────
      studentTipsFor(school) {
        return CollegeMatch.studentTip(
          { mathScore: this.mathScore, englishScore: this.englishScore },
          school
        );
      },

      // ── Score prompt (reuses the saveProfile flow — no new storage) ──────
      skipPrompt() {
        this.prompt = false;
        this.promptError = "";
      },

      async savePrompt() {
        const cur = this.promptCurrent ? Number(this.promptCurrent) : null;
        const math = this.promptMath ? Number(this.promptMath) : null;
        const eng = this.promptEnglish ? Number(this.promptEnglish) : null;
        if (cur == null && !(math && eng)) {
          this.promptError = "Enter your current score, or both math and reading/writing scores to start.";
          return;
        }
        try {
          const saved = await window.KorahSATAnalytics?.saveProfile?.({
            currentScore: cur || undefined,
            mathScore: math || undefined,
            englishScore: eng || undefined,
          });
          if (saved) {
            this.savedScore = Number(saved.currentScore);
            this.score = this.savedScore;
            this.mathScore = saved.mathScore != null ? Number(saved.mathScore) : null;
            this.englishScore = saved.englishScore != null ? Number(saved.englishScore) : null;
          }
        } catch (e) {
          console.warn("[College Match] saveProfile failed", e);
        }
        this.prompt = false;
        this.promptError = "";
      },
    };
  }

  // For debugging / local testing.
  window.collegePage = { FALLBACK_SCHOOLS, collegeMatchFactory };

  document.addEventListener("alpine:init", () => {
    Alpine.data("collegeMatch", collegeMatchFactory);
  });
})();