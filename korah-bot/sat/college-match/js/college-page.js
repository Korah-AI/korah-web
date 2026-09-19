/**
 * College Match page — Alpine component + data wiring (Issue #44).
 *
 * Renders the three safety/match/reach columns, drives the non-destructive
 * slider, filters, and the fallback dataset for local dev.
 *
 * Everything score-classification related lives in college-match.js (pure).
 * This file has no classification math; it calls window.CollegeMatch.
 */
(function () {
  "use strict";

  const CollegeMatch = window.CollegeMatch;
  // Each section slider runs 200-800 in steps of 10; combined is their sum.
  const SECTION_MIN = 200;
  const SECTION_MAX = 800;
  const DEFAULT_SECTION = 600; // 1200 combined, when the user has no saved score
  const PAGE_SIZE = 24;        // cards rendered per column before "show more"

  // The three result columns. Identical markup, so the page renders one
  // x-for over this list instead of three copies of the same card.
  const COLUMNS = [
    { key: "safety", title: "Safety", tone: "tone-green",
      desc: "Comfortably above their range.",
      empty: "Nothing here with these filters. Raise the score or widen the filters." },
    { key: "match", title: "Match", tone: "tone-blue",
      desc: "Right in their lane.",
      empty: "Nothing here with these filters. Move the score to find your lane." },
    { key: "reach", title: "Reach", tone: "tone-red",
      desc: "Worth a shot, know the odds.",
      empty: "Nothing here with these filters. A lower score puts more schools in reach." },
  ];

  const SIZE_OPTIONS = [
    { value: "all", label: "Any size" },
    { value: "small", label: "Under 10k" },
    { value: "medium", label: "10k-30k" },
    { value: "large", label: "Over 30k" },
  ];

  const TYPE_OPTIONS = [
    { value: "all", label: "All" },
    { value: "public", label: "Public" },
    { value: "private", label: "Private" },
  ];

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

  const clampSection = (n) =>
    Math.max(SECTION_MIN, Math.min(SECTION_MAX, Math.round(n / 10) * 10));

  // A profile can hold a combined score with no section breakdown. Split it
  // evenly so both sliders start somewhere real; the halves still sum to the
  // saved total, so the combined readout never contradicts what was saved.
  function splitCombined(total) {
    const math = clampSection(total / 2);
    return { math, erw: clampSection(total - math) };
  }

  function sizeBucket(size) {
    if (size < 10000) return "small";
    if (size <= 30000) return "medium";
    return "large";
  }

  function collegeMatchFactory() {
    // Memo cells for the two derived lists. The synced dataset is ~1k schools
    // and the template reads `groups` about ten times per render pass, so
    // recomputing on every read costs more than a frame while dragging a
    // slider. They live in the closure rather than on the returned object:
    // writing a reactive property from inside a getter would re-trigger the
    // effect that just read it. Each memo also holds the schools array it was
    // built from, so swapping the dataset invalidates it.
    let groupsRef = null;
    let groupsKey = null;
    let groupsCache = null;
    let statesRef = null;
    let statesCache = null;

    return {
      // Data + identity
      ready: false,
      source: "",           // "route" | "fallback"
      dataYear: null,
      schools: [],

      // Saved profile (never modified by the sliders)
      savedMath: null,
      savedErw: null,

      // The two section sliders — the only score inputs on the page
      math: DEFAULT_SECTION,
      erw: DEFAULT_SECTION,
      sectionMin: SECTION_MIN,
      sectionMax: SECTION_MAX,

      // Filters
      columns: COLUMNS,
      sizeOptions: SIZE_OPTIONS,
      typeOptions: TYPE_OPTIONS,
      stateFilter: "all",
      sizeFilter: "all",
      typeFilter: "all",
      stateOpen: false,

      // Card expansion + no-data section
      expandedId: null,
      showNoData: false,

      // How many cards each list renders; the synced dataset is ~1.4k schools,
      // roughly a third of which report no SAT percentiles at all.
      shown: { safety: PAGE_SIZE, match: PAGE_SIZE, reach: PAGE_SIZE, noData: PAGE_SIZE },

      async init() {
        await Promise.all([this.loadSchools(), this.loadProfile()]);
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
        this.applySaved(raw.currentScore, raw.mathScore, raw.englishScore);
      },

      // Section scores win when both are present; otherwise fall back to
      // splitting the combined score.
      applySaved(current, mathRaw, erwRaw) {
        const ms = Number(mathRaw);
        const es = Number(erwRaw);
        const cur = Number(current);

        if (Number.isFinite(ms) && ms > 0 && Number.isFinite(es) && es > 0) {
          this.savedMath = clampSection(ms);
          this.savedErw = clampSection(es);
        } else if (Number.isFinite(cur) && cur > 0) {
          const split = splitCombined(Math.max(400, Math.min(1600, cur)));
          this.savedMath = split.math;
          this.savedErw = split.erw;
        } else {
          return;
        }
        this.math = this.savedMath;
        this.erw = this.savedErw;
      },

      // ── Filters / visibility ─────────────────────────────────────────────
      setFilter(which, value) {
        this[which] = value;
        this.resetShown();
      },

      get states() {
        if (statesRef !== this.schools) {
          statesCache = [...new Set(this.schools.map((s) => s.state))].filter(Boolean).sort();
          statesRef = this.schools;
        }
        return statesCache;
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

      // Classified columns — recomputed on every slider tick, so cards refill
      // columns live while dragging, but only once per change rather than once
      // per read. Reading every input to build the key is what keeps Alpine's
      // dependency tracking correct.
      get groups() {
        const key = [
          this.math, this.erw, this.stateFilter, this.sizeFilter, this.typeFilter,
        ].join("|");
        if (groupsRef === this.schools && groupsKey === key) return groupsCache;

        const out = { safety: [], match: [], reach: [], noData: [] };
        for (const school of this.visible()) {
          const r = CollegeMatch.classify(this.score, school);
          const bucket = r.label === "no-data" ? "noData" : r.label;
          out[bucket].push({ school, ...r });
        }
        groupsCache = out;
        groupsKey = key;
        groupsRef = this.schools;
        return out;
      },

      // Only the first `shown[key]` cards render; the rest sit behind "show more".
      cardsIn(key) {
        return this.groups[key].slice(0, this.shown[key]);
      },

      showMore(key) {
        this.shown[key] += PAGE_SIZE;
      },

      // Moving a slider or a filter re-sorts every column, so the old "show
      // more" depth no longer means anything — and keeping it would re-render
      // hundreds of cards on every drag tick.
      resetShown() {
        this.shown = { safety: PAGE_SIZE, match: PAGE_SIZE, reach: PAGE_SIZE, noData: PAGE_SIZE };
      },

      isExpanded(id) {
        return this.expandedId === id;
      },

      toggleDetails(id) {
        this.expandedId = this.expandedId === id ? null : id;
      },

      // ── Sliders ──────────────────────────────────────────────────────────
      // Combined is always the two sections added up, never its own input.
      get score() {
        return this.math + this.erw;
      },

      get savedScore() {
        return this.savedMath == null ? null : this.savedMath + this.savedErw;
      },

      get hasSavedScore() {
        return this.savedMath != null;
      },

      get isPreviewing() {
        return this.savedMath != null && (this.math !== this.savedMath || this.erw !== this.savedErw);
      },

      // section is "math" or "erw".
      onSlider(section, v) {
        this[section] = clampSection(Number(v));
        this.resetShown();
      },

      backToScore() {
        if (this.savedMath == null) return;
        this.math = this.savedMath;
        this.erw = this.savedErw;
        this.resetShown();
      },

      // Where a section score sits on its 200–800 track, as a %.
      // Drives both the saved tick and the slider fill.
      savedTickPct(saved) {
        if (saved == null) return 0;
        return ((saved - SECTION_MIN) / (SECTION_MAX - SECTION_MIN)) * 100;
      },

      // ── Band-bar positioning (pure, no exports needed from CollegeMatch) ──
      // Always returns an object so the template can read .pct / .pos directly.
      mark(score, band) {
        if (score == null || !band) return { pct: 0, pos: "in" };
        if (score < band.p25) return { pct: 0, pos: "below" };
        if (score > band.p75) return { pct: 100, pos: "above" };
        return { pct: ((score - band.p25) / (band.p75 - band.p25)) * 100, pos: "in" };
      },

      bandHint(score, band) {
        const pos = this.mark(score, band).pos;
        if (pos === "below") return "Below their 25th, so the marker sits off the track.";
        if (pos === "above") return "Above their 75th, so the marker sits off the track.";
        return "Middle half of admitted scores: " + band.p25 + "-" + band.p75 + ".";
      },

      // ── Formatting helpers ───────────────────────────────────────────────
      fmtRate(r) {
        return Math.round(r * 100) + "%";
      },

      fmtSize(n) {
        return n.toLocaleString("en-US");
      },

      region(school) {
        return [school.city, school.state].filter(Boolean).join(", ");
      },

      // ── Tips ──────────────────────────────────────────────────────────────
      studentTipsFor(school) {
        return CollegeMatch.studentTip({ mathScore: this.math, englishScore: this.erw }, school);
      },
    };
  }

  // For debugging / local testing.
  window.collegePage = { FALLBACK_SCHOOLS, collegeMatchFactory };

  document.addEventListener("alpine:init", () => {
    Alpine.data("collegeMatch", collegeMatchFactory);
  });
})();