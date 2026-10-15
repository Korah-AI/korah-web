# SAT question remix

The footer Remix button sends the actual passage, stem, choices, answer key and
metadata to `/api/r`. Visible SVGs and images are rasterized to PNG image
parts. Image failures stop generation instead of silently dropping figures.
Returned HTML/MathML and new SVG figures are validated and sanitized before the
existing player displays and grades the remix. The generated explanation is
reused without a second model call.

## Firestore cache

Remixes are stored like `satExplanations`: a global top-level collection,
`satRemixes/{sourceQuestionId}`, holding one remix per source question. The
first student to remix a question pays the generation cost; everyone after that
gets the saved remix. Remixing a remix uses the remix's own ID as the next
document ID, so chains are unlimited. Each remix gets a fixed-length
`remix-<sha256>` ID. Domain, skill and difficulty are inherited from the parent.

Saved remixes are validated and sanitized again on read. Failed model requests
are not saved. If a Firestore read or write fails, the remix is still generated
and shown for this session.

The Firestore rules make `satRemixes` create-only, same as `satExplanations`:
any signed-in user can read and create, nobody can update or delete. If two
students remix the same unsaved question at once, the first save wins and the
second student's copy is only kept for their session. An invalid saved document
cannot be overwritten from the client; it is regenerated per session until
deleted in the console. The rules are not in this repo.

Remixes are appended to the current session and can be revisited through the
question navigator. Reloading resets that list; clicking Remix on the parent
retrieves the saved child. They are not inserted into the College Board bank.

Run `npm test` from `korah-bot`. Regression coverage includes cache reuse across
students, chains, Firestore failures, malformed entries, guests, image capture,
metadata and answer validation. AI output still needs content
review; structural validation cannot prove mathematical correctness.
