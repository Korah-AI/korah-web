# Korah Web — Development Status 

## Project Overview
Korah is an AI study app built with Vanilla JS, AlpineJS, and Tailwind.

## Recent Changes (March 26, 2026)
- **Hybrid Document Panel Tab:** 
    - Moved `#doc-panel-tab` inside the `#doc-panel` aside in `index.html`.
    - Updated `korah-chat.css` to position the tab as `absolute` peeking out from the left (`right: 100%`).
    - This ensures the tab is visible and functional in both desktop (collapsible) and mobile (fixed sliding) views.
- **Light Mode UI Fixes:**
    - Updated `.doc-panel-title`, `.doc-add-btn`, and `.doc-panel-empty` in `korah-chat.css` to use purple theme colors (`var(--p4)`) when `[data-theme="light"]` is active.
    - Fixed the document preview panel staying white/invisible in light mode.

## Current State
- The Document Preview Panel is now fully responsive and theme-aware.
- Core chat logic is in `korah-chat.js`.
- Sidebar logic is in `sidebar.js`.

## Next Steps
- Continue with OpenNotebook feature implementation.
- Monitor mobile transitions for the document panel to ensure the tab remains accessible.
