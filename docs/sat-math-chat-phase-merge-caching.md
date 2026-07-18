# SAT Math Chat — Merging Phase 1 + Phase 2 via Explicit Context Caching

**Status:** Design proposal (not implemented). Gate behind a flag and A/B before committing.

Related: [`sat-math-chat-architecture.md`](./sat-math-chat-architecture.md)

---

## Motivation

Every SAT Math message runs three sequential AI round-trips before Phase 3 can stream
(`korah-bot/sat/math-chat.js`):

1. **Phase 1** — classify: send problem + `template-index.json`, get `{ stateId, strategy }`.
2. **Phase 2** — adapt: fetch that template's skeleton + verified example, get the adapted Desmos state.
3. **Phase 3** — stream the tutoring response.

Phase 1's entire latency is dead air — nothing visible happens, and its only product is a
`stateId` string and a one-line `strategy`. **Merging Phase 1 into Phase 2 deletes a whole
network + generation round-trip from every `problem-solver` message** (the majority of them).

The merged call would return, in one shot:

```json
{
  "stateId": "linear-functions",
  "strategy": "Read m and b from the regression on the graph",
  "adaptedState": { "expressions": { "list": [ ... ] } }
}
```

---

## The blocker: the ordering / data-availability problem

Phase 2 only knows *which* skeleton to fetch after Phase 1 has chosen. A single merged call has
to produce the adapted state in the same breath as choosing the template — but at request-build
time you don't yet know which skeleton to include.

Three ways out (see architecture doc for the full trade-off table):

- **Option A** — send *all* skeletons up front, let the model pick + fill one. Keeps validation
  quality (real skeletons anchor the output structure) but bloats input tokens on every message.
- **Option B** — function-calling / tool round to fetch the skeleton server-side. The current
  proxy has no such wiring; degrades back to A in practice.
- **Option C** — send only a compact uniform Desmos-state schema/cheatsheet instead of
  per-template skeletons. Cleanest merge, but **riskier for validation** — the per-template
  skeleton is currently what keeps Phase 2 output structurally correct. More validation failures
  → more fallbacks to the verified example → slower and less personalized (the exact thing we're
  trying to avoid).

**Chosen direction: Option A + explicit context caching.** Caching removes Option A's only real
downside (token bloat) while keeping the skeletons that protect validation quality.

---

## Why "put the skeletons only in the first request" does NOT work

`korah-bot/api/gem-proxy.js` is **completely stateless**. Every request rebuilds a fresh Gemini
`generateContent` call from the `messages` array (system → `systemInstruction`, rest →
`contents`). There is no session, no cache handle, no persistence. The pipeline calls send *no
conversation history at all* — each phase is a standalone single-user-message call
(`callAPI`, `math-chat.js`).

So the model has **no recollection** of a previous request's system prompt. If message #2 omits
the skeletons, message #2's generation simply doesn't have them.

Two candidate mechanisms for "upload the big thing once, reference it cheaply after":

### Multi-turn history — a dead end

You *could* send skeletons in turn 1 and pass a growing `contents` history each request. But
stateless HTTP means you **re-upload the entire history (including the skeleton blob) on every
request anyway** — no savings in bytes, input tokens, or TTFT, and it still trips the payload
guard.

### Context caching — the real answer

**Implicit caching** (automatic on Gemini 2.5 models): auto-discounts a *stable, byte-identical
prefix* shared across requests. Requires static bulk FIRST as a fixed prefix, variable content
(the student's problem) LAST. **But it only discounts billing/latency — the client still uploads
all tokens every request.** It does *not* relieve the payload-size guard, and the big blob is
still shipped on the wire each message.

**Explicit caching** (`CachedContent` API): upload the skeletons + index **once**, get back a
cache resource name, and later requests pass a `cachedContent` reference *instead of re-sending
the bytes*. This is the only version that literally sends the skeletons once and references them
after — and the only one that gets the blob off the wire on subsequent messages.

---

## Explicit caching solution — what it takes

### Proxy (`korah-bot/api/gem-proxy.js`)
- Add a path to **create/refresh** a `CachedContent` from the skeleton library (skeletons +
  `template-index.json`) and return/store its cache resource name.
- On `generateContent` calls, pass the `cachedContent` reference through instead of re-sending
  the cached bytes.
- None of this wiring exists today — the proxy currently just forwards `messages` verbatim.

### Client (`korah-bot/sat/math-chat.js`)
- Create the cache on load (or lazily on first message), refresh on TTL expiry, pass a cache
  reference on merged calls.
- **Bust the cache whenever a skeleton file changes** (e.g. version/hash the library and
  invalidate on mismatch).

---

## Caveats to weigh

- **TTL + cache management.** Explicit caches expire. You own the refresh logic and the
  cache-busting when templates change. This is new operational surface.
- **Minimum-token thresholds.** Gemini caching has a minimum content size to be eligible.
  Verify against current Gemini 2.5 Flash docs before assuming the skeleton library qualifies —
  don't rely on a memorized number.
- **Generation time is unchanged.** Caching cuts input-token cost and TTFT, **not** output
  length. The merged call still generates the full Desmos state — the slowest part of old
  Phase 2. You save Phase 1's *round-trip*, not state-generation time.
- **Harder single generation.** The model now picks the right skeleton from *all* of them and
  fills it in one shot — more context than today's Phase 2 (which receives exactly one skeleton).
  Slightly more room to pick the wrong template or drift. Measure quality, not just speed.
- **Loss of clean phase separation.** Today Phase 1 stays trivially strict (`temperature 0.1`,
  tiny output) *because* it is isolated. Merged, one JSON object carries both the classification
  and a large Desmos state, so a temperature or format slip breaks both at once. Verbatim-copy
  and `validateDesmosState` checks must run against a sub-field instead of the whole response.
- **Loss of the "Drawing graph…" beat.** The two-stage indicator (thinking → "Drawing graph…")
  collapses to one. Minor UX regression.
- **Payload guard still applies to implicit caching.** Only *explicit* caching removes bytes from
  the wire; if the cache path fails or falls back, the full skeleton blob risks the 4.4 MB guard
  (`math-chat.js`) / 4.5 MB proxy limit (`gem-proxy.js`).

---

## Caching is NOT conversation memory

Easy to conflate, but they are orthogonal concerns.

**Explicit caching** is a cost/latency optimization for a *fixed* block of tokens. You upload
content once, get a handle, and later requests prepend those exact tokens — billed cheaper, lower
TTFT. The cached content is **frozen at creation time** (here: the skeleton library + index —
static reference material). It does not grow or update as the student chats, and it has nothing to
do with remembering previous turns. The model "sees" the skeletons on each call only because you
re-reference the cache.

**Conversation memory** is entirely separate. Gemini is stateless per request — it does not
accumulate turns for you. The *only* way the model remembers earlier messages is if **you resend
the prior turns in the `contents` array on every request.** Caching changes the *price* of tokens
you send, never *which* tokens get sent or retained.

| | Explicit caching | Conversation memory |
|---|---|---|
| What it does | Cheaply reuse a fixed token prefix | Model sees earlier turns |
| Who provides the content | You, once, static | You, resent every request |
| Grows with the chat? | No | Yes (you append turns) |

**Current state:** the pipeline calls (Phase 1/2/3) send **no conversation history at all** —
each is a standalone single-user-message call (`callAPI` in `math-chat.js`). The
`conversationHistory` array is persisted to KorahDB only for *UI session restore*; it is **not**
fed back to the model. So today the model does **not** remember earlier messages in a session,
independent of any caching decision.

### Adding conversation memory (separate change)

If we want the tutor to remember earlier turns (follow-ups like "now solve part b", "what if the
slope were negative"), that is its own change, independent of the phase merge and caching:

1. **Send history in the request.** Include the running `conversationHistory` (or a trimmed
   window of it) as prior `user`/`assistant` messages in the `messages` array passed to
   `callAPI` → `gem-proxy.js`. The proxy already maps non-system roles into Gemini `contents`
   (`role: assistant → model`), so no proxy change is strictly required for text turns.
2. **Decide scope per phase.** History is most useful for **Phase 3** (the tutoring narration).
   Phase 1 (classification) and Phase 2 (state adaptation) may want only the *latest* problem to
   stay strict and avoid drift — feeding a long history into the JSON phases risks confusing the
   classifier or the state generator. Recommend: history for Phase 3, latest-message-only for
   Phases 1–2 (or a short summary).
3. **Bound the window.** Cap how many turns are resent (recency window or a rolling summary) to
   control token growth, latency, and the 4.4 MB payload guard (`math-chat.js`) / 4.5 MB proxy
   limit (`gem-proxy.js`).
4. **Mind multimodal history.** Past image/PDF attachments are large; do **not** resend prior
   attachments each turn. Keep only text of prior turns, or a text summary of what an attachment
   contained.

**Combining with caching:** the two compose cleanly if kept in their lanes — **cache the static
stuff (skeletons), send the dynamic stuff (conversation history) normally.** Do *not* try to cache
a growing conversation: explicit caches are built for large static prefixes, so re-creating the
cache as turns accumulate usually is not worth it.

---

## Recommended rollout

1. Implement Option A + explicit caching behind a **feature flag**.
2. A/B against the current two-phase pipeline on the existing test-problem set, comparing:
   - `validateDesmosState` pass-rate
   - verbatim-copy (example) fallback rate
   - end-to-end latency (first Phase 3 token)
3. Only commit if the merged call holds Phase 2's validation rate roughly where the per-template
   skeletons hold it now. The merge is worth it *only if* quality doesn't regress.
