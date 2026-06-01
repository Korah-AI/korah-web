(async function () {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  // Resolve base from this script's URL — works at any server root
  const scriptEl = document.querySelector('script[src*="sidebar-loader.js"]');
  const base = scriptEl ? scriptEl.src.replace(/\/sidebar-loader\.js.*$/, '') : '';

  const res = await fetch(`${base}/sidebar.html`);
  const html = await res.text();
  root.innerHTML = html;

  // Prefix root-relative hrefs/srcs with the detected base so links work universally
  root.querySelectorAll('[href^="/"]').forEach(el => {
    el.setAttribute('href', base + el.getAttribute('href'));
  });
  root.querySelectorAll('[src^="/"]').forEach(el => {
    el.setAttribute('src', base + el.getAttribute('src'));
  });
  root.querySelectorAll('[data-base-url^="/"]').forEach(el => {
    el.setAttribute('data-base-url', base + el.getAttribute('data-base-url'));
  });

  // Mark active nav link by comparing resolved pathnames
  root.querySelectorAll('.sidebar-nav-link').forEach(a => {
    try {
      a.classList.toggle('active', new URL(a.href).pathname === window.location.pathname);
    } catch {}
  });

  if (window.Alpine) {
    window.Alpine.initTree(root);
  } else {
    document.addEventListener('alpine:initialized', () => window.Alpine.initTree(root), { once: true });
  }
})();
