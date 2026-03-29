/* ═══════════════════════════════════════════════════════
   Korah Support Page - JavaScript
   Shooting stars background
   ═══════════════════════════════════════════════════════ */

'use strict';

/* ── Smooth Scrolling ── */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const targetId = link.getAttribute('href');
            if (targetId === '#') return;
            
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

/* ═══════════════════════════════════════════════════════
   Shooting Stars Background
   Matches the implementation from the main site
   ═══════════════════════════════════════════════════════ */

function initShootingStars() {
    const field = document.getElementById('starField');
    if (!field) return;
    
    // Static background stars (twinkling)
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
    
    // Shooting stars
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
        
        // Remove after animation and schedule next
        setTimeout(() => {
            star.remove();
            setTimeout(spawnShootingStar, 6000 + Math.random() * 10000);
        }, dur * 1000);
    }
    
    // Stagger initial spawns
    for (let i = 0; i < 3; i++) {
        setTimeout(spawnShootingStar, i * 3000 + Math.random() * 2000);
    }
}

/* ── Scroll Reveal Animation ── */
function initScrollReveal() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Observe cards and sections
    document.querySelectorAll('.faq-card, .contact-card, .link-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}

/* ── Initialize Everything ── */
function init() {
    initSmoothScroll();
    initShootingStars();
    initScrollReveal();
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}