const memoryStore = globalThis.__korahRateLimitStore || new Map();

if (!globalThis.__korahRateLimitStore) {
  globalThis.__korahRateLimitStore = memoryStore;
}

function clampInt(value, fallback, min, max) {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function normalizeIp(ip) {
  if (!ip || typeof ip !== "string") return "unknown";
  return ip.trim().replace(/^::ffff:/, "");
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return normalizeIp(forwardedFor.split(",")[0]);
  }
  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return normalizeIp(realIp);
  }
  const cfIp = req.headers["cf-connecting-ip"];
  if (typeof cfIp === "string" && cfIp.trim()) {
    return normalizeIp(cfIp);
  }
  return normalizeIp(req.socket?.remoteAddress || req.connection?.remoteAddress || "");
}

function getBucket(key, windowMs) {
  const now = Date.now();
  const current = memoryStore.get(key);

  if (!current || current.resetAt <= now) {
    const next = {
      count: 0,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, next);
    return next;
  }

  return current;
}

function setRateLimitHeaders(res, limit, remaining, resetAt) {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader("X-RateLimit-Remaining", String(Math.max(0, remaining)));
  res.setHeader("X-RateLimit-Reset", String(Math.ceil(resetAt / 1000)));
  res.setHeader("Retry-After", String(retryAfterSeconds));
  return retryAfterSeconds;
}

export function applyRateLimit(req, res, options = {}) {
  const {
    namespace = "default",
    limit = 10,
    windowMs = 60_000,
    message = "Too many requests. Please wait a moment and try again.",
  } = options;

  const ip = getClientIp(req);
  const safeLimit = clampInt(limit, 10, 1, 10_000);
  const safeWindowMs = clampInt(windowMs, 60_000, 1_000, 86_400_000);
  const bucket = getBucket(`${namespace}:${ip}`, safeWindowMs);

  bucket.count += 1;
  memoryStore.set(`${namespace}:${ip}`, bucket);

  const remaining = safeLimit - bucket.count;
  const retryAfterSeconds = setRateLimitHeaders(res, safeLimit, remaining, bucket.resetAt);

  if (bucket.count > safeLimit) {
    return {
      limited: true,
      status: 429,
      body: {
        error: "Rate limit exceeded",
        message: `${message} Try again in ${retryAfterSeconds}s.`,
        retryAfterSeconds,
      },
    };
  }

  return {
    limited: false,
    remaining: Math.max(0, remaining),
    retryAfterSeconds,
  };
}
