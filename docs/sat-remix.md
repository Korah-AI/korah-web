# SAT question remix

The footer Remix button sends the actual passage, stem, choices, answer key and
metadata to `/api/gem-proxy`. Visible SVGs and images are rasterized to PNG image
parts. Image failures stop generation instead of silently dropping figures.
Returned HTML/MathML and new SVG figures are validated and sanitized before the
existing player displays and grades the remix. The generated explanation is
reused without a second model call.

## Browser-only cache

Remix does not read or write Firestore. No Firestore rules changes or server
credentials are needed. Sign-in is still required by the existing player UI.

Completed questions are stored in localStorage using the versioned key
`korah:sat-remix:v1:<sourceQuestionId>`. Remixing the same source reuses that
browser's saved result, even after reloading. Remixing a remix creates another
cached link in an unlimited chain. Every generated question gets a unique
fixed-length ID, avoiding collisions between different browsers' generations.
Domain, skill and difficulty are inherited from the parent.

The cache belongs to the browser profile and site origin, not an account. It is
not shared across devices, browsers, or development/production URLs. Clearing
site data clears remixes. Different browsers may each incur a generation cost.
If storage is blocked or full, results remain usable and cached for the current
page, with a message explaining that they cannot persist across reloads.
Invalid cache entries are regenerated. Failed model requests are not cached.

Web Locks prevent duplicate generation across same-origin tabs where supported;
other browsers retain per-page double-click protection. Closing a tab releases
its lock. A crash before saving can still require another generation.

Remixes are appended to the current session and can be revisited through the
question navigator. Reloading resets that list; clicking Remix on the parent
retrieves the saved child. They are not inserted into the College Board bank.

Run `npm test` from `korah-bot`. Regression coverage includes reload cache reuse,
chains, unavailable storage, malformed entries, concurrent tabs, guests,
image capture, metadata and answer validation. AI output still needs content
review; structural validation cannot prove mathematical correctness.
