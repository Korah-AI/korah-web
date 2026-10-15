// Generation deliberately happens outside transactions, which Firestore retries.
// The adapter owns reservations and immutable publication of completed results.
export function createSatRemixCache(adapter) {
  const inFlight = new Map();
  const unsaved = new Map();

  async function resolve(sourceId, generate) {
    const cached = await adapter.read(sourceId);
    if (cached?.status === 'ready') {
      unsaved.delete(sourceId);
      return cached.question;
    }
    const token = crypto.randomUUID();
    const reservation = await adapter.reserve(sourceId, token);
    if (reservation.status === 'ready') return reservation.question;
    if (reservation.token !== token) {
      throw new Error('This question is already being remixed. Try again shortly to load the saved question.');
    }
    let question = unsaved.get(sourceId);
    try {
      if (!question) {
        question = await generate();
        unsaved.set(sourceId, question);
      }
      const saved = await adapter.publish(sourceId, token, question);
      unsaved.delete(sourceId);
      return saved;
    } catch (error) {
      // Keep successful model output in memory if publication failed. A retry
      // can save it without spending on another generation in this page.
      await adapter.release(sourceId, token).catch(() => {});
      throw error;
    }
  }

  return {
    getOrCreate(sourceId, generate) {
      if (!inFlight.has(sourceId)) {
        inFlight.set(sourceId, resolve(sourceId, generate).finally(() => inFlight.delete(sourceId)));
      }
      return inFlight.get(sourceId);
    }
  };
}
