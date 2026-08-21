# Tailored Practice: Research

> **Status:** this file is only research. Your job is to use the "From GH Issue
> to Merged PR" workflow I gave you to implement it. Read this doc, then follow
> up with your own spec detailing how *you* would implement what this doc asks
> for. Nothing here is a final implementation decision.

## Abstract

**What you're being asked to build** is a section of the website that takes all
of the user's data (the same data you can already see in the analytics and
dashboard sections) and uses a selection algorithm to work out which types of
questions the user struggles with, in order to build a **tailored** set of
practice problems, via the API we already have, that targets those weak spots.

That's the whole feature. A student clicks a button, and instead of a random
question set they get one built specifically out of the things they've been
getting wrong.

**Go look at the real thing first.** College Board ships this in Bluebook: take
a practice test, open My Practice, and there's a "Get Tailored Practice" button
that does exactly this. Go to `bluebook.collegeboard.org` and click through it
yourself so you know what you're building toward. It is worth knowing that
their version is much simpler than people assume. It is not an LLM and it is
not doing anything exotic. It's a filtered query against a tagged question
bank, seeded by which topics you did badly on.

The good news is that **this feature needs no new data**. Everything it reads,
we already store. Everything it fetches, we already proxy. The work is a
selection algorithm and a UI.

---

## 1. What we already have

This is the most important section. Read it carefully, because most of what you
might assume you need to build already exists.

`sat/js/sat-analytics.js` writes four things under `users/{uid}/`:

| Doc | What's in it |
| --- | --- |
| `satProfile/main` | `currentScore`, `goalScore` |
| `satTotals/summary` | `totalXP`, `level`, `answered`, `correct`, `incorrect`, `practiceTime` |
| `satSkills/{skillCd}` | **per-skill aggregate, this is your input** |
| `satAttempts/{auto}` | append-only log of every single question answered |

The one you care about is `satSkills/{skillCd}`. Every time a student answers a
question anywhere on the site, `recordAttempt()` updates it:

```json
{
  "skillCd": "H.C.",
  "domain": "...",
  "section": "math",
  "attempts": 14,
  "correct": 9,
  "byDifficulty": {
    "E": { "attempts": 5, "correct": 5 },
    "M": { "attempts": 6, "correct": 4 },
    "H": { "attempts": 3, "correct": 0 }
  },
  "lastSeen": "2026-08-18T22:10:00Z"
}
```

So per skill, you already have: how many they've tried, how many they got
right, the same split by difficulty, and when they last saw it. **That is
everything a selection algorithm needs.** You do not need to add fields, run a
migration, or start collecting anything new.

`satAttempts` is also worth knowing about: it's a full history with
`questionId`, `correct`, and `ts` on every row. If you want a "questions you
previously got wrong" feature, you can read it straight out of there rather
than maintaining a separate list.

`/api/sat/s` computes skill breakdown counts and is what the dashboard already
uses. Worth reading before you write your own aggregation.

---

## 2. The selection algorithm

This is the actual thinking part of the task, and it is deliberately left open.
Work it out yourself, with your agent, and justify it in your spec.

**It does not need to be complicated.** A perfectly good v1 is: look at the
percentage of questions the student gets wrong in each skill, rank the skills
worst-first, and build a set out of the skills at the top of that list. That's
it. If that's what you land on, say so and defend it.

Some things worth thinking through, not requirements:

* A student who got 1 of 1 wrong is not "0% mastery" in any meaningful sense.
  How much do you trust a skill with very few attempts?
* Not all skills appear equally often on a real SAT. Missing a lot of
  Information and Ideas questions matters more than missing Circles questions,
  because one is about a quarter of the R&W section and the other is a couple
  of questions.
* What difficulty should the questions be? Handing someone Hard questions in
  their worst skill may not be the most useful thing.
* Should the same set come back if they click the button twice in a row?

Whatever you choose, pin down the actual numbers in your spec rather than
leaving it at "rank by accuracy."

---

## 3. Where the questions come from

The College Board Question Bank, already proxied for you at `/api/sat/q`
(listings) and `/api/sat/qi` (full item detail) via `api/_lib/collegeboard.js`.
Roughly 3,500 real items, each already tagged with section, domain, skill
(`skill_cd`), difficulty (E/M/H), the correct answer, and an official
rationale. You do not need to fetch, scrape, or store anything.

---

## 4. Playing the questions

**Use the existing player at `korah-bot/sat/questions.html`.** Do not build a
new one.

The player reads its entire configuration from the URL query string
(`parseOpenSatV1Query` in `sat/js/sat-shared.js`), and it already accepts every
parameter you need:

| Param | What it does |
| --- | --- |
| `skills` | comma-separated skill codes |
| `domains` | comma-separated domain codes |
| `difficulties` | `E`, `M`, `H` |
| `sections` | `english`, `math` |
| `limit` | how many questions |
| `questionIds` | an explicit list, if you want to hand-pick the exact set |
| `random` | shuffle |

So the handoff from your feature to the player is **a URL**. Your section works
out which skills and difficulties the student needs, then sends them to
something like:

```
questions.html?skills=H.C.,H.E.&difficulties=M&limit=20&random=1
```

If your algorithm picks specific questions rather than filters, use
`questionIds` instead. Either way, the player does the rest.

This is the single biggest thing that makes this task tractable. Go read
`parseOpenSatV1Query` before you plan anything.

---

## 5. How the user's data updates as they work

You do not have to build this either, and you should not.

Because the student is answering questions in the existing player, the existing
`recordAttempt()` fires on every answer exactly as it does everywhere else on
the site. It updates `satAttempts`, `satSkills/{skillCd}` (attempts, correct,
the difficulty split, `lastSeen`), and `satTotals/summary` (XP, level, streak
counters).

The loop closes on its own: a student practices their weak skills, their
accuracy in those skills goes up, and the next tailored set they generate is
different because the numbers underneath it changed.

The one thing to verify while building: confirm that attempts coming from your
section are landing in `satSkills` the same way they do from the question bank
and Practice Rush. `recordAttempt` takes a `mode` field, so it's worth passing
something that identifies tailored practice, so we can tell later whether the
feature is actually helping anyone.

If you find yourself writing new Firestore documents, stop and ask whether you
actually need them. The likely answer is no.

---

## 6. Suggested build order

1. **Read the data.** A page that loads `satSkills` and just *displays* the
   student's weakest skills, ranked. No question fetching yet. This proves you
   understand the data before you build anything on top of it.
2. **Rank and select.** Turn that ranking into a concrete set of skills and
   difficulties.
3. **Hand off to the player.** Build the URL, launch `questions.html`, confirm
   the questions that come back are the ones you asked for.
4. **The UI.** Make it something a student wants to click. Show them *why*
   these questions were picked, a black box feels arbitrary and students don't
   trust it.

---

## Sources

* [Practice, Bluebook for Students](https://bluebook.collegeboard.org/students/practice)
* [My Practice 101](https://satsuite.collegeboard.org/practice/my-practice-101)
