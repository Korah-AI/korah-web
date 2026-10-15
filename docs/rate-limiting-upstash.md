# Rate Limiting the Gemini Proxy — Why We Need Upstash Redis

**Status:** Proposed, not implemented
**Affects:** `korah-bot/api/r.js`, `korah-bot/api/_lib/rate-limit.js`, `korah-bot/api/generate-study-item.js`

---

## The Short Version

`/api/r` is our Gemini proxy. Every call costs us money. It has **no authentication**, and its
rate limiter **does not actually work on Vercel**. Anyone on the internet can call it in a loop.

We are about to let people browse Korah without an account, which sends more traffic to this
endpoint. We should fix the limiter first.

---

## What's Broken

### 1. The limiter stores counters in local memory

`api/_lib/rate-limit.js` line 1:

```js
const memoryStore = globalThis.__korahRateLimitStore || new Map();
```

That `Map` lives inside one serverless instance. It is not shared with anything.

Vercel runs many instances of `api/r.js` at once and shuts them down when traffic is quiet.
So the counter:

- **Resets on every cold start.** Wait a minute for the instance to sleep, and your count is 0 again.
- **Doesn't add up across instances.** Ten concurrent instances each allow 20 requests/min.
  The limit reads as 20/min but the real ceiling is 20 x (however many instances Vercel spun up).

The setting says 20 requests per minute. Nobody is actually held to it.

### 2. The endpoint is open to the whole internet

`api/r.js` line 8:

```js
res.setHeader('Access-Control-Allow-Origin', '*');
```

There is no check for a Firebase ID token, an API key, or anything else. The handler goes
straight from method/size validation to calling Gemini.

This means the endpoint can be called directly with `curl` from anywhere. **It does not matter
what our website's UI does.** Graying out the chat box for logged-out users is a nice prompt to
sign up, but it stops nobody who opens DevTools and copies the request.

### 3. IP is a weak identity anyway

The limiter keys on IP (`getClientIp`). Even with a working store, IPs are cheap to rotate and
shared by whole schools behind one NAT — so it punishes a classroom of real students while
barely slowing an actual abuser.

---

## Why This Matters Now

Two things are about to make it worse:

1. **Guest browsing.** We're removing the login wall so people can try Korah before signing up.
   That is the right product call, but it means more unauthenticated traffic hitting a paid endpoint.
2. **We're advertising it.** The more successful the landing page is, the more this is worth abusing.

The failure mode is a surprise Gemini bill, and there is currently nothing in place that would
cap it or even alert us.

---

## The Fix

### Step 1 — Shared counter (Upstash Redis)

Swap the in-memory `Map` for Upstash Redis: a hosted key-value store that all serverless instances
talk to. One shared counter, so a limit of 20/min means 20/min no matter how Vercel scales.

Upstash suits this well:

- **Serverless-native.** Talks over HTTP, so it works from Vercel Functions with no connection pooling.
- **Priced per request,** not per hour. Rate-limit checks are tiny; this stays near-free at our size.
- **Available on the Vercel Marketplace,** so it provisions from our existing account and injects
  its env vars automatically.
- **Ships a rate limiter.** `@upstash/ratelimit` handles sliding windows and the race conditions
  we'd otherwise get wrong ourselves.

Install:

```bash
vercel integration add upstash
npm install @upstash/ratelimit @upstash/redis
```

This sets `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The change is contained to
`api/_lib/rate-limit.js` — `applyRateLimit()` keeps its current signature, so `api/r.js` and
`api/generate-study-item.js` don't need edits.

### Step 2 — Verify who's calling

A shared counter fixes *how many*, not *who*. To rate limit per user rather than per IP, `api/r.js`
should verify the caller's Firebase ID token and key the limit on the UID.

Rough shape:

- Client sends `Authorization: Bearer <await user.getIdToken()>`
- `api/r.js` verifies it with `firebase-admin` (needs a service account key in env)
- Key the limit on `uid` when present, IP when not

This also lets us set the guest budget deliberately — say a handful of chat messages before we
ask for a signup — instead of the current all-or-nothing.

### Step 3 — Tighten CORS

`Access-Control-Allow-Origin: '*'` should be our own domain, so browser-based calls from other
sites are rejected. Won't stop `curl`, but removes the easiest abuse path.

---

## Suggested Limits

| Caller | Limit | Reason |
|---|---|---|
| Signed-in user | 20/min, 300/day | Roughly today's intent, actually enforced |
| Guest (no token) | 5/day per IP | Enough to feel the product, not enough to be worth farming |
| `generate-study-item` | 10/hour per user | Much more expensive per call than chat |

Numbers are a starting point — worth revisiting once we can see real usage.

---

## Effort

| Step | Size | Priority |
|---|---|---|
| 1. Upstash-backed limiter | ~1 hour, one file | **High** — the limit is currently fiction |
| 2. Firebase token verification | ~half a day | **High** — needed for per-user limits |
| 3. CORS lockdown | ~10 minutes | Medium |

Step 1 alone gets us a real ceiling on spend and is worth doing on its own.

---

## Related

- `docs/sat-questions-api.md` — the `/api/sat/*` routes. These are read-only and don't call Gemini,
  so they're much cheaper to leave open, but they share the same limiter.
