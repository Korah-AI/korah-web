/* ═══════════════════════════════════════════════════
   WORD OF THE DAY — home page flashcard card logic
   Loads the daily word via the shared vocab loader
   (sat/vocab/js/vocab-data.js, window.VocabData).
   fcPos: 0 = today, 1 = yesterday, 2 = two days ago, … ;
          -1 = "next word" countdown card.
   Prev steps back up to FC_MAX_BACK days; Next steps forward
   toward today, then to the countdown for the next EST midnight.
   ═══════════════════════════════════════════════════ */
(function () {
  const FC_MAX_BACK = 14;
  let fcPos = 0;
  let fcFlipped = false;
  let fcReady = false;
  let countdownTimer = null;

  function displayWord(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  // JSON examples have stray spaces before punctuation ("abased , the deposed")
  function cleanExample(s) {
    return s.replace(/\s+([,.;:!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  }

  function formatCountdown(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  function dayLabel(offset) {
    const d = new Date();
    d.setDate(d.getDate() - offset);
    const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (offset === 0) return `Today · ${date}`;
    if (offset === 1) return `Yesterday · ${date}`;
    return date;
  }

  function stopCountdown() {
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  }
  function startCountdown() {
    stopCountdown();
    const tick = () => {
      const estMs = Date.now() - 5 * 3600000;
      const tillNext = 86400000 - (estMs % 86400000);
      document.getElementById('fc-counter').textContent =
        'Next word in ' + formatCountdown(tillNext);
    };
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function renderCard() {
    const card = document.getElementById('flashcard');
    card.classList.remove('flipped');
    fcFlipped = false;
    stopCountdown();

    if (fcPos === -1) {
      document.getElementById('fc-word').textContent = 'Next word';
      document.getElementById('fc-pos').textContent = 'releases at 12:00 AM EST';
      document.getElementById('fc-def').textContent =
        'A new SAT word drops every day at midnight (EST). Check back tomorrow!';
      document.getElementById('fc-ex').textContent = '';
      startCountdown();
      return;
    }

    const c = VocabData.dailyWord(fcPos);
    if (!c) {
      document.getElementById('fc-word').textContent = '—';
      document.getElementById('fc-counter').textContent = 'New word at midnight';
      return;
    }
    document.getElementById('fc-word').textContent = displayWord(c.word);
    document.getElementById('fc-pos').textContent = c.part_of_speech || '';
    document.getElementById('fc-def').textContent = c.definition || '';
    document.getElementById('fc-ex').textContent =
      c.example ? `"${cleanExample(c.example)}"` : '';
    document.getElementById('fc-counter').textContent = dayLabel(fcPos);
  }

  window.flipCard = function () {
    fcFlipped = !fcFlipped;
    document.getElementById('flashcard').classList.toggle('flipped', fcFlipped);
  };
  window.prevCard = function () {
    if (!fcReady) return;
    fcPos = Math.min(fcPos + 1, FC_MAX_BACK);
    renderCard();
  };
  window.nextCard = function () {
    if (!fcReady) return;
    fcPos = Math.max(fcPos - 1, -1);
    renderCard();
  };

  VocabData.ready().then(() => {
    if (VocabData.status === 'error') {
      document.getElementById('fc-word').textContent = 'Word unavailable';
      document.getElementById('fc-counter').textContent = '';
      return;
    }
    fcReady = true;
    renderCard();
  });
})();