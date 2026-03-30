// ── Korah Release Logic — release.js ──

// ── Background Animation ──
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let w, h, stars = [], dots = [];

function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    initStars();
    initDots();
}

class Star {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1.5;
        this.opacity = Math.random() * 0.7 + 0.1;
        this.twinkleSpeed = Math.random() * 0.01 + 0.005;
        this.twinkleDir = Math.random() > 0.5 ? 1 : -1;
    }
    update() {
        this.opacity += this.twinkleSpeed * this.twinkleDir;
        if (this.opacity > 0.8 || this.opacity < 0.2) this.twinkleDir *= -1;
    }
    draw() {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = this.opacity;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Dot {
    constructor() {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.5) * 0.4;
        this.vy = (Math.random() - 0.5) * 0.4;
        this.r = 1.5 + Math.random() * 1.5;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > w) this.vx *= -1;
        if (this.y < 0 || this.y > h) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(139,92,246,0.4)';
        ctx.fill();
    }
}

function initStars() {
    stars = [];
    for (let i = 0; i < 150; i++) stars.push(new Star());
}

function initDots() {
    dots = [];
    const count = Math.min(Math.max(Math.floor((w * h) / 15000), 40), 80);
    for (let i = 0; i < count; i++) dots.push(new Dot());
}

function animate() {
    ctx.clearRect(0, 0, w, h);
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    if (isLight) {
        ctx.globalAlpha = 1.0;
        for (let i = 0; i < dots.length; i++) {
            for (let j = i + 1; j < dots.length; j++) {
                const dx = dots[i].x - dots[j].x;
                const dy = dots[i].y - dots[j].y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(dots[i].x, dots[i].y);
                    ctx.lineTo(dots[j].x, dots[j].y);
                    ctx.strokeStyle = `rgba(139,92,246,${(1 - dist/150) * 0.2})`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }
            }
            dots[i].update();
            dots[i].draw();
        }
    } else {
        stars.forEach(s => { s.update(); s.draw(); });
    }
    requestAnimationFrame(animate);
}

// ── Countdown Timer Logic ──
const countdownEl = document.getElementById('countdown-timer');
const releaseDate = new Date('April 3, 2026 00:00:00').getTime();

function updateCountdown() {
    const now = new Date().getTime();
    const distance = releaseDate - now;

    if (distance < 0) {
        if (countdownEl) countdownEl.innerHTML = "Released!";
        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (countdownEl) {
        countdownEl.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
}

// Initialize
window.addEventListener('resize', resize);
resize();
animate();
setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call
