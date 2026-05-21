(async function () {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  const res = await fetch('/korah-bot/sidebar.html');
  const html = await res.text();
  root.innerHTML = html;

  const path = window.location.pathname;
  root.querySelectorAll('.sidebar-nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    a.classList.toggle('active', path.endsWith(href.replace('/korah-bot', '')));
  });

  if (window.Alpine) {
    window.Alpine.initTree(root);
  } else {
    document.addEventListener('alpine:initialized', () => window.Alpine.initTree(root), { once: true });
  }
})();
