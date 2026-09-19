# Issue: Use existing analytics for study feedback in chat

## Problem

We store per-user practice data (`users/{uid}/satTotals`, `satSkills`, `satAttempts`,
`satProfile`, practice time) but nothing reads it back to the user. Chat has no idea what
they have been practicing, so it can't say "your accuracy on linear equations is 41%, work
on that" or "you're averaging 3 minutes a question, want some pacing methods?".

## Rules vs LLM

Do both, split by role.

Code decides what is true:
- Reuse `sat-analytics.js` (`suggestSkills`, `getAllSkillStats`, `getRecentAttempts`) to get
  weak skills, accuracy, avg `timeSpent` per question, days since last activity.
- Thresholds decide if there is a finding at all: accuracy < 60% with >= 10 attempts = weak
  skill; avg time > 2x section target = pacing issue; inactive N days = nudge.
- Deterministic, testable, cannot hallucinate a stat.

LLM decides how to say it:
- Inject the computed findings into the system prompt as a small block:

```
USER STATS (only use these numbers, do not invent any):
weak_skills: [{skill: "Linear equations in two variables", accuracy: 0.41, attempts: 17}]
pacing: {avg_seconds: 168, target_seconds: 90, section: "math"}
last_active_days: 4
```

- Prompt rules: cite only numbers in the block, one suggestion per reply, don't lead with
  stats every message, keep it short.
- The model handles what rules are bad at: explaining the weakness, suggesting a study
  method, answering "how do I get faster at this?".

Not LLM-only: dumping raw attempt logs is slow, expensive, and it will make up numbers.
Not rules-only: canned strings get ignored and can't handle a follow-up.

## First pass

1. `getStudySignals(uid)` in `sat-analytics.js` returning the findings object.
2. Inject into the chat system prompt in `korah-bot/app/korah-chat.js`
   (`MODE_SYSTEM_PROMPTS` / `getSystemPrompt`), refreshed per session.
3. Proactive trigger: after a practice set ends, or on chat open if a finding is new.
   Max one nudge per session.

## Open questions

- Minimum attempts before we say anything.
- Where per-section time targets come from.
- Do we track which advice was already given so it doesn't repeat.
