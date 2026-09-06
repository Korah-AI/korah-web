# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Read the Docs First

**There are two documentation directories. Check both before starting work.**

- `../docs/` — repo-level docs (architecture, APIs, feature designs, proposals)
- `docs/` — `korah-bot/docs/`, feature and research notes

Do this before writing code, not after:

1. `ls ../docs docs` and read the filenames.
2. Open anything whose subject overlaps your task. If nothing obviously matches,
   grep both directories for the feature, file, or route you're about to touch.
3. Note the doc's status. Some describe what exists; some are proposals that were
   never implemented (`rate-limiting-upstash.md` says **"Status: Proposed, not
   implemented"** in its header). Do not treat a proposal as a description of the
   current code.
4. Filenames are not reliable signposts. Several are named after their author
   (`daniels-docs.md`, `Om-docs.md`, `bushis-docs.md`) rather than their subject —
   `daniels-docs.md` is the full architecture map, and it is the best entry point
   for locating a feature or tracing a request.

**Verify before you rely on it.** These docs are hand-maintained and drift behind
the code. Confirm any specific claim (a file path, a route name, a function
signature) against the actual file before acting on it.

**When you find a doc that is wrong, fix it as part of your work.** Correct the
stale lines in place — don't rewrite the document, don't restructure it, and
don't add new sections beyond the correction. Same rule as §3: surgical.

**When your change makes a doc wrong, update it in the same commit.** If you
rename a route, move a page, or change a data shape that a doc describes, the doc
edit is part of the change, not a follow-up.

Creating a *new* doc is a separate task. Ask first — don't add one unprompted.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

---

## Commit Messages

**Simple label, simple description. No em dashes.**

- One short label line, then a plain description of what changed and why.
- Write straightforwardly. No em dashes, no marketing tone, no filler.
- Describe what the change does, not how impressive it is.
- Get as technical as the change warrants. File names, function names,
  selectors, CSS tokens, and API routes are fine and often better than a vague
  summary. Just keep the prose plain.

Simple change:
```
Fix logout button race on the SAT sidebar

The logout handler fired before the session cleared, so the redirect
sometimes landed back on the dashboard. Wait for the clear first.
```

Bigger change, more technical:
```
Move sidebar greying into a shared stylesheet

Pulled the duplicated .sidebar rules out of sat/dashboard.html,
study/feed.html, and study/guide.html into study-grey.css. Swapped the
purple --sf/--bd tokens for the grey resting surfaces per
docs/WIZARD-UI-PATTERNS.md. Scrollbar width stays at 6px.
```

**Co-sign trailers (`Co-Authored-By`, `Claude-Session`):**
- Only for bigger commits: multi-file changes, new features, refactors.
- Small commits (typos, one-line fixes, style tweaks) don't need them.
- When in doubt, ask before adding them.

---

## Project Notes

See `../README.md` for the API route map and the source-control tips (there is no
working local preview — you commit and check the deployed site).

**Building a wizard or multi-step flow?** Read `../docs/WIZARD-UI-PATTERNS.md` first.
It covers the house UI/UX conventions — grey resting surfaces (never the purple
`--sf`/`--bd` tokens), per-option accent tones, filled-not-outlined selected states,
no dimmed text, the step shell and transitions, custom popups instead of
`alert()`/`confirm()` — with the reference implementations in
`korah-bot/sat/study-plan.html`, `sat-rush.css` and `js/sat-rush.js`.

### UI conventions

- **Hover and selected states scale, they never translate.** Use
  `transform: scale(1.01–1.08)` (bigger scale for smaller elements) with a
  ~0.18s ease transition. No `translateY` lifts or `translateX` nudges — sliding
  drags neighbouring alignment and reads as a jump. `translate` is still fine for
  positioning (e.g. `translateY(-50%)` centering).
