# SAT question remix

The footer Remix button reads the live player question through the Ask Korah
context helpers. It supplies the original passage, stem, choices, correct answer,
domain, skill and difficulty. Visible SVGs and image elements in the passage,
stem and choices are rasterized to PNG image parts for `/api/gem-proxy`.
Image loading/CORS failures stop generation instead of silently dropping figures.
The model returns HTML/MathML, including new inline SVG diagrams when needed.
Output is parsed, structurally validated and sanitized before saving and rendering.
AI-generated questions still require content-quality review; structural checks
cannot prove their mathematical correctness.

Remixes are appended to the current player's question list; Previous/Next and
the question navigator can revisit them with independent answers. They are not
added to the College Board bank. Reloading resets the session list, but remixing
the same source again retrieves the global saved question. Metadata is inherited.
Each remix has a deterministic SHA-256 ID derived from its parent ID. Remixing a
remix therefore follows an unlimited chain with fixed-length document IDs.
The Explanation tab uses the generated solution without an additional AI call.

## Firestore deployment prerequisite

Merge [sat-remix-firestore.rules](sat-remix-firestore.rules) into the existing
Firestore rules under `/databases/{database}/documents`, preserving other rules,
then deploy them to `korah-app`. There is no Firebase rules deployment configuration
in this checkout. The fragment has not been deployed or emulator-verified here.
Ensure no overlapping wildcard grants writes to completed `satRemixes` documents.
Authenticated users can read the global cache; only the reservation owner can
finish it, and completed documents cannot be updated or deleted by clients.
Like the suggested create-once client cache design, this permits authenticated
clients to submit generated content. Move generation and cache writes behind a
trusted authenticated server if server-verified authorship is required.

The first caller reserves a missing source in a transaction before generation.
Concurrent callers are told to retry shortly and then receive the saved result.
Completed results are never regenerated. A ten-minute lease recovers abandoned
tabs. Failed generations can be retried. A crash between model completion and
Firestore persistence can incur generation again after lease expiry; strict
exactly-once billing across failures is not guaranteed by a browser-side cache.
Cache access failures stop the operation before spending on generation.

Run `npm test` from `korah-bot`. For live acceptance testing after rules deployment:
remix text, reading passage, numeric-response, inline SVG and raster-image
questions; check grading and explanations; navigate during generation; revisit
the parent and confirm cache reuse in another account; remix the child; and check
guest access, image failures, concurrent clicks and narrow-screen footer layout.
