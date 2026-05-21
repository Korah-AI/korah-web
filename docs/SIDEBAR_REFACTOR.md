# Sidebar Component Refactor Plan

## Goal
Replace duplicated `<aside id="sidebar">` blocks across 13 HTML files with a single shared partial (`sidebar.html`) loaded dynamically via `fetch()`.

---

## Files with sidebars (13 total)

```
korah-bot/index.html
korah-bot/chat.html
korah-bot/sat/index.html
korah-bot/sat/math-chat.html
korah-bot/sat/dashboard.html
korah-bot/study/feed.html
korah-bot/study/flashcards.html
korah-bot/study/guide.html
korah-bot/study/guide-create.html
korah-bot/study/item.html
korah-bot/study/new.html
korah-bot/study/test.html
korah-bot/study/test-create.html
```

---

## Step 1 — Create `korah-bot/sidebar.html`

Extract the sidebar markup from `index.html` (lines ~522–625). This is the canonical version.

**Critical changes when writing `sidebar.html`:**

- Switch ALL `href` and `src` attributes to **root-relative paths** to eliminate the `../` problem across subdirectories:
  ```
  index.html          → /korah-bot/index.html
  chat.html           → /korah-bot/chat.html
  study/feed.html     → /korah-bot/study/feed.html
  sat/index.html      → /korah-bot/sat/index.html
  sat/math-chat.html  → /korah-bot/sat/math-chat.html
  sat/dashboard.html  → /korah-bot/sat/dashboard.html
  logo-images/...     → /korah-bot/logo-images/...
  ```

- Keep the `data-sat-link="true"` attribute on the SAT nav link — `sidebar.js → initSatDropdown()` queries for `[data-sat-link="true"]` to build the SAT dropdown.

- Keep `data-base-url="/korah-bot/index.html"` on `#new-chat-btn` — `sidebar.js → initSidebar()` reads this for the "Clear All Data" redirect (`resolvedBaseUrl` fallback at line ~1289).

- Remove any hardcoded `class="... active ..."` from nav links — active state is set dynamically by the loader (Step 2).

- Include the `sidebar-overlay` div at the top of the partial (it's injected alongside the sidebar in all files):
  ```html
  <div class="sidebar-overlay" @click="mobileOpen = false; document.querySelector('.sidebar-overlay').classList.remove('show')"></div>
  ```

**What `sidebar.html` contains (in order):**
1. `<div class="sidebar-overlay" ...>`
2. `<!-- SIDEBAR -->` comment
3. `<aside id="sidebar" class="sidebar ..." x-effect="..." @resize.window="...">` with all Alpine directives intact
4. Full interior: `.sidebar-header`, `nav.sidebar-nav`, `.sidebar-middle` (with `#chat-history`), `.sidebar-footer` (with `#sidebar-mood`, logout/settings/theme buttons)
5. Closing `</aside>`

---

## Step 2 — Create `korah-bot/sidebar-loader.js`

This script:
1. Fetches `/korah-bot/sidebar.html`
2. Injects it into `<div id="sidebar-root">`
3. Marks the correct nav link as `active` by matching `window.location.pathname`
4. Calls `Alpine.initTree()` on the injected content so Alpine picks up the `<aside>` directives

```js
(async function () {
  const root = document.getElementById('sidebar-root');
  if (!root) return;

  const res = await fetch('/korah-bot/sidebar.html');
  const html = await res.text();
  root.innerHTML = html;

  // Mark active nav link
  const path = window.location.pathname;
  root.querySelectorAll('.sidebar-nav-link').forEach(a => {
    const href = a.getAttribute('href') || '';
    a.classList.toggle('active', path.endsWith(href.replace('/korah-bot', '')));
  });

  // Re-initialize Alpine on injected nodes (Alpine is deferred, so it's ready by now)
  if (window.Alpine) {
    window.Alpine.initTree(root);
  } else {
    document.addEventListener('alpine:initialized', () => window.Alpine.initTree(root), { once: true });
  }
})();
```

Place this file at `korah-bot/sidebar-loader.js`.

**Alpine timing note:** Alpine loads with `defer`, so it initializes after DOM parse. The `fetch()` is also async. By the time the fetch resolves and injects HTML, Alpine is virtually always initialized. The `alpine:initialized` fallback covers the rare edge case.

**`_getChatLogoPath()` in sidebar.js:** This function locates the logo by inspecting the `src` of the `sidebar.js` script tag. It will still work because the script tag for `sidebar.js` remains in each HTML file — nothing changes there.

---

## Step 3 — Update each HTML file

For each of the 13 files:

**A. Replace the sidebar block**

Remove everything from `<div class="sidebar-overlay"` through `</aside>` and replace with:
```html
<div id="sidebar-root"></div>
```

**B. Add the loader script**

Add this in the `<head>` (after Alpine, before page-specific scripts):
```html
<script src="/korah-bot/sidebar-loader.js" defer></script>
```

For subdirectory files (`sat/`, `study/`), the root-relative path `/korah-bot/sidebar-loader.js` works as-is — no `../` needed.

**C. Update any remaining relative paths in `<head>`**

While you're in each file, also root-relative-ify any other cross-file `src`/`href` that currently uses `../`:
- CSS: `../app/korah-chat.css` → `/korah-bot/app/korah-chat.css`
- JS: `../study/js/sidebar.js` → `/korah-bot/study/js/sidebar.js`
- Fonts/icons: these are CDN links, no change needed

---

## Step 4 — Update `sidebar.js` logo path helper

`_getChatLogoPath()` (line ~258) resolves the logo URL by finding the `sidebar.js` script tag. This still works, but since we're now using root-relative paths everywhere, you can simplify it to just:

```js
function _getChatLogoPath() {
  return '/korah-bot/logo-images/newlogo11.png';
}
```

This is optional but eliminates the fragile script-src sniffing.

---

## Gotchas / things to verify after implementing

| Issue | What to check |
|---|---|
| Alpine directives on `<aside>` not responding | Confirm `Alpine.initTree(root)` is called after injection; check browser console for Alpine errors |
| Active link not highlighting | Log `window.location.pathname` and the nav link `href` values; adjust the `endsWith` matching logic if needed |
| `new-chat-btn` navigates to wrong URL | Confirm `data-base-url="/korah-bot/index.html"` is in `sidebar.html`; check `sidebar.js` line ~1289 |
| SAT dropdown not appearing | Confirm `data-sat-link="true"` is on the SAT nav link in `sidebar.html` |
| Logo broken in chat history empty state | Check `_getChatLogoPath()` resolves correctly, or apply the simplification in Step 4 |
| Sidebar flickers on load | Expected — the `<div id="sidebar-root">` is empty until fetch resolves. Can mitigate by adding a skeleton or min-height to `#sidebar-root` in CSS |
| Local dev (file:// protocol) | `fetch()` blocked on `file://`. Run a local server (`npx serve` or similar). Not an issue on Vercel. |

---

## File output summary

| New/Changed | Path |
|---|---|
| NEW | `korah-bot/sidebar.html` |
| NEW | `korah-bot/sidebar-loader.js` |
| CHANGED (13x) | All files listed in the files section above |
| OPTIONAL | `korah-bot/study/js/sidebar.js` — simplify `_getChatLogoPath()` |
