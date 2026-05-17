/* ═══════════════════════════════════════════════════════
   Korah Support Page - JavaScript
   Shooting stars, constellation, nav tracking, FAQ search
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ── Shooting Stars Background ── */
function initShootingStars() {
    const field = document.getElementById('starField');
    if (!field) return;

    const numStars = 120;
    for (let i = 0; i < numStars; i++) {
        const star = document.createElement('div');
        star.classList.add('static-star');
        const size = 0.5 + Math.random() * 1.5;
        star.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            top: ${Math.random() * 100}%;
            left: ${Math.random() * 100}%;
            --twinkle-dur: ${2 + Math.random() * 4}s;
            --twinkle-delay: ${Math.random() * 5}s;
            opacity: 0;
        `;
        field.appendChild(star);
    }

    function spawnShootingStar() {
        const star = document.createElement('div');
        star.classList.add('shooting-star');
        const angle = 25 + Math.random() * 20;
        const dur = 1.5 + Math.random() * 1.5;

        star.style.cssText = `
            position: absolute;
            top: ${5 + Math.random() * 60}%;
            left: ${5 + Math.random() * 50}%;
            width: ${120 + Math.random() * 100}px;
            height: 1.5px;
            border-radius: 999px;
            opacity: 0;
            transform-origin: left center;
            transform: rotate(${angle}deg);
            --angle: ${angle}deg;
            animation: shoot ${dur}s ease-in forwards;
        `;

        field.appendChild(star);

        setTimeout(() => {
            star.remove();
            setTimeout(spawnShootingStar, 6000 + Math.random() * 10000);
        }, dur * 1000);
    }

    for (let i = 0; i < 3; i++) {
        setTimeout(spawnShootingStar, i * 3000 + Math.random() * 2000);
    }
}

/* ── Constellation (light mode only) ── */
function initConstellation() {
    const canvas = document.getElementById('constellation-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const dots = Array.from({ length: 80 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 2 + Math.random() * 2,
    }));

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 160) {
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.strokeStyle = `rgba(139,92,246,${(1 - dist / 160) * 0.3})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
        }
        dots.forEach(d => {
            ctx.beginPath();
            ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(139,92,246,0.5)';
            ctx.fill();
            d.x += d.vx; d.y += d.vy;
            if (d.x < 0 || d.x > canvas.width) d.vx *= -1;
            if (d.y < 0 || d.y > canvas.height) d.vy *= -1;
        });
        requestAnimationFrame(draw);
    }
    draw();

    function applyTheme() {
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        canvas.style.opacity = isLight ? '1' : '0';
    }
    applyTheme();

    new MutationObserver(applyTheme).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-theme']
    });
}

/* ── Nav Sliding Pill Indicator ── */
function initNavActivePill() {
    const navPills = document.querySelectorAll('.nav-pill');
    const sections = document.querySelectorAll('section[id]');
    const indicator = document.getElementById('navIndicator');
    if (!navPills.length || !sections.length) return;

    function update() {
        const scrollPos = window.scrollY + 150;
        let currentId = null;

        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            if (scrollPos >= top && scrollPos < bottom) currentId = section.id;
        });

        navPills.forEach(pill => {
            pill.classList.toggle('nav-pill-active', pill.getAttribute('href') === `#${currentId}`);
        });

        if (indicator) {
            const activePill = document.querySelector(`.nav-pill[href="#${currentId}"]`);
            if (activePill) {
                indicator.style.opacity = '1';
                indicator.style.transform = `translateX(${activePill.offsetLeft}px)`;
                indicator.style.width = `${activePill.offsetWidth}px`;
            } 
            // no else — indicator holds its last position instead of disappearing
        }
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
}

/* ── FAQ Search ── */
function initFaqSearch() {
    const input = document.getElementById('faqSearch');
    const clearBtn = document.getElementById('faqClear');
    if (!input || !clearBtn) return;

    const cards = document.querySelectorAll('.faq-card');

    function filter() {
        const q = input.value.toLowerCase().trim();
        clearBtn.classList.toggle('hidden', q.length === 0);

        cards.forEach(card => {
            const text = card.textContent.toLowerCase();
            card.style.display = (!q || text.includes(q)) ? '' : 'none';
        });

        const visible = Array.from(cards).some(c => c.style.display !== 'none');
        const empty = document.getElementById('faqEmpty');
        if (empty) empty.style.display = (!visible && q) ? '' : 'none';
    }

    input.addEventListener('input', filter);

    clearBtn.addEventListener('click', () => {
        input.value = '';
        filter();
        input.focus();
    });
}

/* ── Email Tooltip ── */
function initEmailTooltips() {
    document.querySelectorAll('.email-tooltip-trigger').forEach(el => {
        const email = el.getAttribute('data-email') || 'oscareucedaf1@gmail.com';

        const tooltip = document.createElement('div');
        tooltip.className = 'email-tooltip';
        tooltip.style.cssText = `
            position: fixed; z-index: 9999;
            background: var(--cb); border: 1px solid var(--bd);
            border-radius: 0.75rem; padding: 0.375rem;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            opacity: 0; pointer-events: none;
            transform: translateY(4px);
            transition: opacity 0.2s, transform 0.2s;
            display: flex; flex-direction: column; gap: 0.125rem;
            min-width: 9rem;
        `;

        const sendBtn = document.createElement('button');
        sendBtn.textContent = 'Send Email';
        sendBtn.style.cssText = `
            display: flex; align-items: center; gap: 0.5rem;
            padding: 0.5rem 0.75rem; border: none; border-radius: 0.5rem;
            background: transparent; color: var(--tx); cursor: pointer;
            font: inherit; font-size: 0.8125rem; font-weight: 600;
            transition: background 0.15s;
        `;
        sendBtn.innerHTML = '<span class="material-icons-round" style="font-size:1rem;">send</span> Send Email';
        sendBtn.onmouseover = () => sendBtn.style.background = 'var(--cu)';
        sendBtn.onmouseout = () => sendBtn.style.background = 'transparent';
        sendBtn.onclick = (e) => {
            e.stopPropagation();
            window.location.href = `mailto:${email}`;
            hide();
        };

        const copyBtn = document.createElement('button');
        copyBtn.innerHTML = '<span class="material-icons-round" style="font-size:1rem;">content_copy</span> Copy Email';
        copyBtn.style.cssText = sendBtn.style.cssText;
        copyBtn.onmouseover = () => copyBtn.style.background = 'var(--cu)';
        copyBtn.onmouseout = () => copyBtn.style.background = 'transparent';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(email).then(() => {
                const orig = copyBtn.innerHTML;
                copyBtn.innerHTML = '<span class="material-icons-round" style="font-size:1rem;">check</span> Copied!';
                copyBtn.style.color = 'var(--grn)';
                setTimeout(() => {
                    copyBtn.innerHTML = orig;
                    copyBtn.style.color = '';
                }, 2000);
            });
        };

        tooltip.appendChild(sendBtn);
        tooltip.appendChild(copyBtn);
        document.body.appendChild(tooltip);

        let visible = false;

        function show() {
            const rect = el.getBoundingClientRect();
            tooltip.style.left = Math.max(8, rect.left + rect.width / 2 - tooltip.offsetWidth / 2) + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 8) + 'px';
            tooltip.style.opacity = '1';
            tooltip.style.pointerEvents = 'auto';
            tooltip.style.transform = 'translateY(0)';
            visible = true;
        }

        function hide() {
            tooltip.style.opacity = '0';
            tooltip.style.pointerEvents = 'none';
            tooltip.style.transform = 'translateY(4px)';
            visible = false;
        }

        el.addEventListener('click', (e) => {
            if (el.tagName === 'A') e.preventDefault();
            e.stopPropagation();
            if (visible) { hide(); return; }
            show();
        });

        document.addEventListener('click', (e) => {
            if (visible && !tooltip.contains(e.target) && e.target !== el) hide();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && visible) hide();
        });
    });
}

/* ── Scroll Reveal ── */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ── Back to Top ── */
function initBackToTop() {
    const btn = document.getElementById('back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

/* ── Initialize Everything ── */
function init() {
    initShootingStars();
    initScrollReveal();
    initConstellation();
    initNavActivePill();
    initBackToTop();
    initFaqSearch();
    initEmailTooltips();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
