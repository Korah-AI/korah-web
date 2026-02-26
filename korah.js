  tailwind.config = {
    darkMode: ['attribute', '[data-theme="dark"]'],
    theme: {
      extend: {
        fontFamily: {
          display: ['"Playfair Display"', 'serif'],
          // FIX #14 CSS: font set once in config, no more repeated font-family declarations
          sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        },
        colors: {
          p2: '#5b21b6', p3: '#7c3aed', p4: '#8b5cf6', p5: '#a78bfa', p6: '#c4b5fd',
          accent: '#f0abfc',
          mood: { green: '#22c55e', yellow: '#eab308', red: '#ef4444' }
        },
        animation: {
          'float':      'floatanim 5s ease-in-out infinite',
          'mascot':     'mfloat 3.5s ease-in-out infinite',
          'pulse-dot':  'pdot 2s infinite',
          'tbounce':    'tbounce 1.4s ease-in-out infinite',
          'fade-up':    'fadeup .8s ease both',
          'ibounce':    'ibounce 1s cubic-bezier(.23,1,.32,1) both',
        },
        keyframes: {
          floatanim: {'0%,100%':{transform:'translateY(0)'},'50%':{transform:'translateY(-10px)'}},
          mfloat: {'0%,100%':{transform:'translateY(0) rotate(0deg)'},'25%':{transform:'translateY(-10px) rotate(2deg)'},'75%':{transform:'translateY(-5px) rotate(-2deg)'}},
          pdot: {'0%,100%':{opacity:'1',transform:'scale(1)'},'50%':{opacity:'.5',transform:'scale(.7)'}},
          tbounce: {'0%,60%,100%':{transform:'translateY(0)'},'30%':{transform:'translateY(-8px)'}},
          fadeup: {from:{opacity:'0',transform:'translateY(28px)'},to:{opacity:'1',transform:'translateY(0)'}},
          ibounce: {'0%':{opacity:'0',transform:'scale(.4) translateY(40px)'},'70%':{transform:'scale(1.1) translateY(-8px)'},'100%':{opacity:'1',transform:'scale(1) translateY(0)'}},
        },
        backdropBlur: { xs: '4px' },
        boxShadow: {
          glow: '0 0 20px rgba(139,92,246,.35)',
          'glow-lg': '0 0 36px rgba(139,92,246,.45)',
          card: '0 25px 60px rgba(0,0,0,.5)',
        },
        transitionTimingFunction: { 'smooth': 'cubic-bezier(.23,1,.32,1)' },
      }
    }
  }

'use strict';
/* ════════════════════════════════════════════════════════
   FIX #19 MAINT: Single shared Anthropic fetch helper
   FIX #20 MEM:   convHistory capped at 20 messages
   ════════════════════════════════════════════════════════ */
const SYSTEM = `You are Korah, a friendly AI study assistant. Be warm, encouraging, adapt to student mood.
When tired/burnt out: suggest a color 🟢🟡🔴 and recommend tasks. Use simple language and analogies.
For quizzes: numbered questions with A/B/C/D. Keep ~150 words. Use emojis naturally.`;

const KORAH_API_ENDPOINT = 'https://korah-beta.vercel.app/api/proxy';
const KORAH_MODEL = 'gpt-4o-mini';

async function korahAPI(systemMsg, messages, maxTokens = 1000) {
  const allMessages = [];

  if (systemMsg && typeof systemMsg === 'string') {
    allMessages.push({ role: 'system', content: systemMsg });
  }

  if (Array.isArray(messages)) {
    allMessages.push(...messages);
  }

  const response = await fetch(KORAH_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: KORAH_MODEL,
      temperature: 0.7,
      max_tokens: maxTokens,
      messages: allMessages
    })
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch (_error) {}

  if (!response.ok) {
    const errText =
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`;
    throw new Error(errText);
  }

  const reply =
    payload?.choices?.[0]?.message?.content ||
    payload?.output_text ||
    '';

  if (!reply) throw new Error('API returned an empty response.');
  return reply;
}

/* ════════════════════════════════════════════════════════
   FIX #22 FRAMEWORK: Alpine.js app() — replaces all manual DOM/state JS
   ════════════════════════════════════════════════════════ */
function app() {
  return {
    theme: 'dark',
    menuOpen: false,
    currentSection: 'home',
    /* FIX #17: removed dead scrollTo function */
    navLinks: [
      { id: 'home', label: 'Home' }, { id: 'how', label: 'How it Works' },
      { id: 'features', label: 'Features' }, { id: 'study-tools', label: 'Study Tools' },
      { id: 'chat', label: 'Korah AI' }, { id: 'download', label: 'Download' }
    ],
    platforms: [
      { name: 'iOS', icon: '🍎', desc: 'iOS 16+ required. Optimized for all screen sizes.', joined: false },
      { name: 'Android', icon: '🤖', desc: 'Android 11+. Works great on phones and tablets.', joined: false },
      { name: 'Desktop', icon: '💻', desc: 'Mac, Windows & Linux. Full features with document upload.', joined: false }
    ],
    /* Intro auto-plays – no user interaction needed */
    startIntro() {
      playIntro();
    },
    init() {
      /* FIX #1 PERF: single IntersectionObserver for nav, reveal, progress bars, AND mascot */
      setTimeout(playIntro, 200); // start cinematic intro

      /* Hero chat animation */
      setTimeout(() => {
        const stream = document.getElementById('heroChatStream');
        const typing = document.getElementById('hero-typing');
        if (!typing) return;
        const reply = document.createElement('div');
        reply.className = 'self-start max-w-[80%] px-4 py-3 rounded-[18px_18px_18px_4px] text-sm leading-relaxed bg-[var(--ca)] border tx';
        reply.style.borderColor = 'var(--bd)';
        reply.innerHTML = '<div class="flex items-center gap-1.5 text-[11px] font-bold tracking-[1px] tx-p4 uppercase mb-1.5"><span class="w-1.5 h-1.5 rounded-full bg-p4 animate-pulse-dot"></span>Korah AI</div>Here\'s your study guide for <strong>Photosynthesis</strong>! 🌿<br/><br/><strong>Key equation:</strong> 6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂<br/><strong>Location:</strong> Chloroplasts<br/><strong>Two stages:</strong> Light reactions → Calvin Cycle<br/><br/>Want flashcards or a quick quiz on this?';
        setTimeout(() => { typing.replaceWith(reply); stream.scrollTop = stream.scrollHeight; }, 2500);
      }, 1000);

      /* FIX #1 PERF: ONE IntersectionObserver handles reveal, progress bars, active nav, and mascot */
      const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
          /* Scroll reveal */
          if (e.target.classList.contains('reveal') && e.isIntersecting) e.target.classList.add('visible');
          /* Progress bars */
          if (e.isIntersecting) e.target.querySelectorAll('[data-target]').forEach(b => setTimeout(() => b.style.width = b.dataset.target + '%', 200));
          /* Active nav + mascot */
          if (e.isIntersecting && e.target.tagName === 'SECTION') {
            const id = e.target.id;
            document.querySelectorAll('.nav-link').forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
            if (id !== this.currentSection) {
              this.currentSection = id;
            }
          }
        });
      }, { threshold: 0.15 });

      document.querySelectorAll('.reveal, section[id], .bc, .tool-card').forEach(el => io.observe(el));

      /* Streak row */
      const row = document.getElementById('streakRow');
      if (row) [1,1,1,1,1,0,0].forEach((d,i) => {
        const c = document.createElement('div');
        c.className = 'w-6 h-6 rounded-md ' + (d ? (i===4 ? 'bg-[var(--gold)] shadow-[0_0_10px_rgba(251,191,36,.4)]' : 'bg-gradient-to-br from-p3 to-p4') : 'bg-[var(--bd)]');
        row.appendChild(c);
      });

      /* FIX #15 PERF: event delegation for card tilt — ONE listener on document */
      document.addEventListener('mousemove', e => {
        const card = e.target.closest('.tilt-card');
        if (!card) return;
        const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        card.style.transform = `perspective(700px) rotateX(${-y*7}deg) rotateY(${x*7}deg) translateY(-5px)`;
        card.style.setProperty('--mx', (x+.5)*100+'%');
        card.style.setProperty('--my', (y+.5)*100+'%');
      }, { passive: true });

      document.addEventListener('mouseleave', e => {
        const card = e.target.closest('.tilt-card');
        if (card) card.style.transform = '';
      }, { passive: true, capture: true });

      /* FIX #21 PERF: passive scroll listener */
      window.addEventListener('scroll', () => {
        document.getElementById('navbar').classList.toggle('scrolled', scrollY > 10);
      }, { passive: true });

      /* Three.js — only runs after defer load */
      window.addEventListener('DOMContentLoaded', initThreeJS);
      if (document.readyState === 'complete') initThreeJS();
    }
  };
}

/* ── Three.js 3D background ── FIX #8: called after defer load ── */
function initThreeJS() {
  if (!window.THREE) { setTimeout(initThreeJS, 200); return; }
  const canvas = document.getElementById('bg-canvas');
  const R = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  R.setPixelRatio(Math.min(devicePixelRatio, 2));
  R.setSize(innerWidth, innerHeight);
  const scene = new THREE.Scene(), cam = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, .1, 200);
  cam.position.z = 30;
  window.addEventListener('resize', () => { cam.aspect = innerWidth/innerHeight; cam.updateProjectionMatrix(); R.setSize(innerWidth, innerHeight); });
  scene.add(new THREE.AmbientLight(0x2d1060, 3));
  const pl = new THREE.PointLight(0x8b5cf6, 5, 80); pl.position.set(0,5,15); scene.add(pl);
  scene.add(Object.assign(new THREE.PointLight(0x5b21b6, 3, 60), { position: { x:-20, y:-10, z:5 } }));
  const shapes = [], bm = new THREE.MeshPhongMaterial({ color:0x5b21b6, emissive:0x1a0545, transparent:true, opacity:.45 });
  const wm = new THREE.MeshBasicMaterial({ color:0x8b5cf6, transparent:true, opacity:.1, wireframe:true });
  for (let i=0; i<18; i++) {
    const s = .3+Math.random()*1.2;
    const g = [new THREE.IcosahedronGeometry(s,0), new THREE.OctahedronGeometry(s,0), new THREE.TetrahedronGeometry(s,0), new THREE.BoxGeometry(s,s,s)][i%4];
    const m = new THREE.Mesh(g, (i%3===2?wm:bm).clone());
    m.position.set((Math.random()-.5)*60, (Math.random()-.5)*45, (Math.random()-.5)*20-8);
    m.userData = { rx:(.5-Math.random())*.007, ry:(.5-Math.random())*.007, oy:m.position.y, ph:Math.random()*Math.PI*2, sp:.3+Math.random()*.5 };
    scene.add(m); shapes.push(m);
  }
  const pGeo = new THREE.BufferGeometry(), pArr = new Float32Array(700*3);
  for (let i=0; i<700*3; i++) pArr[i] = (Math.random()-.5)*100;
  pGeo.setAttribute('position', new THREE.BufferAttribute(pArr, 3));
  scene.add(new THREE.Points(pGeo, new THREE.PointsMaterial({ color:0xa78bfa, size:.1, transparent:true, opacity:.35 })));
  let mx=0, my=0, t=0;
  /* FIX #21 PERF: passive mousemove */
  document.addEventListener('mousemove', e => { mx = e.clientX/innerWidth-.5; my = e.clientY/innerHeight-.5; }, { passive:true });
  (function tick() {
    requestAnimationFrame(tick); t+=.006;
    cam.position.x += (mx*4-cam.position.x)*.03;
    cam.position.y += (-my*3-cam.position.y)*.03;
    cam.lookAt(0,0,0);
    shapes.forEach(s => { s.rotation.x += s.userData.rx; s.rotation.y += s.userData.ry; s.position.y = s.userData.oy + Math.sin(t*s.userData.sp+s.userData.ph)*1.5; });
    pl.position.x = Math.sin(t*.4)*10; pl.position.y = Math.cos(t*.3)*6;
    R.render(scene, cam);
  })();
}

/* ── FIX #22 FRAMEWORK: Alpine components for interactive widgets ── */

function moodWidget() {
  return {
    active: 'gm',
    get moodMsg() {
      return { gm:"✅ You're in the zone! Korah recommends your 2 hard tasks today.", ym:"🟡 Moderate energy. Korah suggests 1 medium task and a 25-min focus session.", rm:"🔴 Low energy today — Korah picked your 1 easy task. Rest is studying too." }[this.active];
    },
    get moodClass() { return { gm:'tx-mg', ym:'tx-my', rm:'tx-mr' }[this.active]; },
    select(v) { this.active = v; }
  };
}

function timer() {
  return {
    curMin: 25, sec: 25*60, running: false, tick: null,
    get display() { return String(Math.floor(this.sec/60)).padStart(2,'0')+':'+String(this.sec%60).padStart(2,'0'); },
    setMin(m) {
      if (this.running) { clearInterval(this.tick); this.running = false; }
      this.curMin = m; this.sec = m*60;
    },
    toggle() {
      if (this.running) { clearInterval(this.tick); this.running = false; }
      else { this.running = true; this.tick = setInterval(() => { this.sec--; if (this.sec<=0) { clearInterval(this.tick); this.running = false; this.sec = 0; } }, 1000); }
    },
    reset() { clearInterval(this.tick); this.running = false; this.sec = this.curMin*60; }
  };
}

function studyTools() {
  return {
    activeTab: 'flashcards',
    tabs: [{ id:'flashcards', label:'🃏 Flashcards' }, { id:'studyguide', label:'📖 Study Guide' }, { id:'practicetest', label:'✏️ Practice Test' }],
    /* Flashcards */
    fcMode: 'manual', flashTopic: '', flashCount: '4', loadingFC: false, fcStatus: '',
    sampleCards: [
      { q:'What is photosynthesis?', a:'Converting sunlight, CO₂ and water into glucose and oxygen.', flipped:false },
      { q:'Where does it occur?', a:'In the <strong>chloroplasts</strong>, in thylakoid membranes and stroma.', flipped:false },
      { q:'What is the light-dependent reaction?', a:'Uses light to produce ATP, NADPH and O₂ from water — in the thylakoids.', flipped:false },
      { q:'What is the Calvin Cycle?', a:'Light-independent reactions in the stroma where CO₂ produces G3P → glucose.', flipped:false },
    ],
    async genFlashcards() {
      if (!this.flashTopic.trim()) { this.fcStatus = '⚠️ Enter a topic first.'; return; }
      this.loadingFC = true; this.fcStatus = '';
      try {
        let raw = await korahAPI(`Generate exactly ${this.flashCount} flashcard Q&A pairs. Return ONLY JSON array: [{"q":"...","a":"..."}]. No markdown.`, [{ role:'user', content:this.flashTopic }]);
        raw = raw.replace(/```json|```/g, '').trim();
        const cards = JSON.parse(raw);
        this.sampleCards = cards.map(c => ({ q:c.q, a:c.a, flipped:false }));
        this.fcStatus = `✅ ${cards.length} cards generated!`;
        this.fcMode = 'manual';
      } catch { this.fcStatus = 'Error. Try again.'; }
      this.loadingFC = false;
    },
    /* Study Guide */
    sgMode: 'manual', guideTopic: '', guideDepth: 'detailed', loadingSG: false, sgStatus: '', guideHTML: '',
    async genGuide() {
      if (!this.guideTopic.trim()) { this.sgStatus = '⚠️ Enter a topic first.'; return; }
      this.loadingSG = true; this.sgStatus = ''; this.guideHTML = '';
      try {
        const html = await korahAPI(`Create a ${this.guideDepth} study guide. Use <h4> headers, <p>, <ul><li>. Include Key Takeaways and Common Mistakes. No code blocks.`, [{ role:'user', content:'Study guide for: '+this.guideTopic }]);
        this.guideHTML = html.replace(/###\s*/g,'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
        this.sgStatus = '✅ Generated!';
      } catch { this.sgStatus = 'Error. Try again.'; }
      this.loadingSG = false;
    },
    /* Practice Test */
    ptMode: 'sample', testTopic: '', testCount: '5', testDiff: 'mixed', loadingPT: false, ptStatus: '', aiQuestions: [],
    sampleTest: [
      { q:'What is the primary product of photosynthesis?', opts:['Oxygen','Glucose','Carbon Dioxide','Water'], c:1, answered:null },
      { q:'In which organelle does photosynthesis take place?', opts:['Mitochondria','Nucleus','Chloroplast','Ribosome'], c:2, answered:null },
      { q:'What gas is released as a byproduct?', opts:['Nitrogen','Hydrogen','Carbon Dioxide','Oxygen'], c:3, answered:null },
      { q:'Which stage occurs in the stroma?', opts:['Light reactions','Calvin Cycle','Glycolysis','Krebs Cycle'], c:1, answered:null },
    ],
    answerQ(q, oi) { if (q.answered == null) q.answered = oi; },
    answerAI(q, oi) { if (q.answered == null) q.answered = oi; },
    async genTest() {
      if (!this.testTopic.trim()) { this.ptStatus = '⚠️ Enter a topic first.'; return; }
      this.loadingPT = true; this.ptStatus = ''; this.aiQuestions = [];
      try {
        let raw = await korahAPI(`Generate exactly ${this.testCount} MCQ at ${this.testDiff} difficulty. Return ONLY JSON: [{"q":"...","opts":["A","B","C","D"],"correct":0}]. No markdown.`, [{ role:'user', content:this.testTopic }], 1500);
        raw = raw.replace(/```json|```/g, '').trim();
        this.aiQuestions = JSON.parse(raw).map(q => ({ ...q, answered:null }));
        this.ptStatus = `✅ ${this.aiQuestions.length} questions!`;
        this.ptMode = 'ai';
      } catch { this.ptStatus = 'Error. Try again.'; }
      this.loadingPT = false;
    }
  };
}

function chatWidget() {
  return {
    input: '',
    /* FIX #20 MEM: history capped at 20 messages */
    history: [],
    messages: [{ role:'ai', text:'', html:"Hey! 👋 I'm Korah. Ask me anything — explain concepts, quiz you, or plan your study day. What are we working on today?" }],
    suggestions: [
      { label:"😴 I'm tired today", msg:"I'm really tired today. What should I study?" },
      { label:"⚡ Newton's Laws", msg:"Explain Newton's three laws of motion simply" },
      { label:"🧠 WW2 Quiz", msg:"Quiz me on World War 2 — 5 questions" },
      { label:"📐 Quadratics", msg:"Help me understand quadratic equations step by step" },
      { label:"🆘 Test Tomorrow", msg:"I have a test tomorrow and haven't studied. What's the most efficient plan?" }
    ],
    async send() {
      const msg = this.input.trim(); if (!msg) return;
      this.messages.push({ role:'user', text:msg }); this.input = '';
      this.history.push({ role:'user', content:msg });
      if (this.history.length > 20) this.history.splice(0, 2);
      this.$nextTick(() => { if(this.$refs.chatBody) this.$refs.chatBody.scrollTop = this.$refs.chatBody.scrollHeight; });
      const typing = { role:'ai', text:'', typing:true, phase:'thinking' };
      this.messages.push(typing);
      setTimeout(() => {
        if (this.messages.includes(typing)) typing.phase = 'responding';
      }, 1200);
      try {
        const reply = await korahAPI(SYSTEM, [...this.history]);
        this.history.push({ role:'assistant', content:reply });
        if (this.history.length > 20) this.history.splice(0, 2);
        const idx = this.messages.indexOf(typing);
        if (idx > -1) this.messages.splice(idx, 1, { role:'ai', text:'', html: reply.replace(/\n/g,'<br/>') });
      } catch {
        const idx = this.messages.indexOf(typing);
        if (idx > -1) this.messages.splice(idx, 1, { role:'ai', text:'Connection issue — try again! 🔌' });
      }
      this.$nextTick(() => { if(this.$refs.chatBody) this.$refs.chatBody.scrollTop = this.$refs.chatBody.scrollHeight; });
    },
    sendMsg(msg) { this.input = msg; this.send(); }
  };
}

/* ════ CINEMATIC INTRO ANIMATION ════ */
function playIntro() {
  const overlay = document.getElementById('intro-overlay');
  const orb     = document.getElementById('intro-orb');
  const mascot  = document.getElementById('intro-mascot');
  const wordmark = document.getElementById('intro-wordmark');
  const canvas  = document.getElementById('intro-canvas');
  if (!overlay) return;

  // Particle canvas
  const ctx = canvas.getContext('2d');
  canvas.width = innerWidth; canvas.height = innerHeight;
  const particles = Array.from({length:120}, () => ({
    x: Math.random() * innerWidth, y: Math.random() * innerHeight,
    r: .5 + Math.random() * 1.8,
    vx: (Math.random()-.5)*.4, vy: (Math.random()-.5)*.4 - .3,
    life: Math.random(), speed: .003 + Math.random()*.004,
    color: `hsla(${260+Math.random()*40},80%,${60+Math.random()*20}%,`
  }));
  let animId;
  function drawParticles() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.life += p.speed; if(p.life>1) p.life=0;
      const a = Math.sin(p.life*Math.PI);
      ctx.beginPath(); ctx.arc(p.x + Math.cos(p.life*6)*8, p.y + p.vy*p.life*120, p.r, 0, Math.PI*2);
      ctx.fillStyle = p.color + a.toFixed(2) + ')'; ctx.fill();
    });
    animId = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  // Timeline
  // t=0: orb blooms
  setTimeout(() => { orb.style.transform = 'scale(1)'; }, 100);
  // t=600: mascot rises in
  setTimeout(() => {
    mascot.style.opacity = '1';
    mascot.style.transform = 'translateY(0) scale(1)';
  }, 600);
  // t=1200: wordmark fades up
  setTimeout(() => {
    wordmark.style.opacity = '1';
    wordmark.style.transform = 'translateY(0)';
  }, 1200);
  // t=2400: hold, then sweep page in
  setTimeout(() => {
    cancelAnimationFrame(animId);
    // Mascot flies up and shrinks toward the nav K logo
    mascot.style.transition = 'opacity .6s .1s, transform .8s cubic-bezier(.77,0,.18,1)';
    mascot.style.transform = 'translateY(-44vh) scale(.12)';
    mascot.style.opacity = '0';
    orb.style.transition = 'opacity .5s';
    orb.style.opacity = '0';
    // Canvas particles fade out
    canvas.style.transition = 'opacity .5s .2s';
    canvas.style.opacity = '0';
    // Wordmark fades
    wordmark.style.transition = 'opacity .4s';
    wordmark.style.opacity = '0';
    // Overlay fades away — page was always visible beneath
    overlay.style.transition = 'opacity .4s .5s';
    overlay.style.opacity = '0';
  }, 2600);
  setTimeout(() => {
    overlay.style.display = 'none';
    overlay.classList.add('done');
  }, 3200);
}



function initInlineHandlers() {
  const chatBtn = document.getElementById('hero-chat-btn');
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      document.getElementById('chat')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const downloadBtn = document.getElementById('hero-download-btn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      document.getElementById('download')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  document.querySelectorAll('.js-flip-card-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      trigger.querySelector('.flashcard')?.classList.toggle('flipped');
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initInlineHandlers, { once: true });
} else {
  initInlineHandlers();
}
