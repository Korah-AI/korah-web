# Practice test source PDFs

The official College Board PDFs the `test-4` and `test-11` question JSON was
transcribed from, kept for provenance when checking a question against the
original.

They live here, outside `korah-bot/`, on purpose. `korah-bot/` is the Vercel
root directory, so anything under it is publicly servable — these PDFs would
otherwise have been downloadable at `/docs/practice-tests/*.pdf`. Nothing at
runtime reads them; the player only fetches the `.json` files and the
`question-imgs/` PNGs under `korah-bot/docs/practice-tests/`.

Do not move them back under `korah-bot/`.
