# Korah Web — Development Status 

## Project Overview
Korah is an AI study app built with Vanilla JS, AlpineJS, and Tailwind.

## Recent Changes (March 28, 2026)
- **Release Date Page:**
    - Created `korah-bot/Release Date/release.html` and `release.js/css`.
    - Implemented a real-time countdown timer to the official release on April 3, 2026.
    - Features a dynamic canvas background that switches between a starfield (dark mode) and a constellation network (light mode) based on system settings.
- **Cross-Page "+ New Chat" Logic:**
    - Implemented a location-aware "New Chat" button using `localStorage` flags.
    - Clicking "+ New Chat" on `index.html` remains a smooth, in-page JavaScript reset.
    - Clicking "+ New Chat" on any other page (Study feed, Productivity, etc.) redirects the user to `index.html` and automatically triggers a fresh chat session upon arrival.
    - Ensures a clean URL (no query parameters) and seamless cross-page transitions.
- **Navigation & Link Audit:**
    - Fixed broken/inconsistent links in `support/index.html` (standardized `#downloads` to `#download`).
    - Verified the "Send to Chat" functionality in study item pages.

## Current State
- The Document Preview Panel is fully responsive and theme-aware.
- Core chat logic is in `korah-chat.js`.
- Sidebar logic is in `sidebar.js`.
- Cross-page communication for session creation is handled via `korah_new_chat_trigger` in `localStorage`.

## Next Steps
- Continue with OpenNotebook feature implementation.
- Address remaining placeholder links (`About Korah`, `Blog`) when content is ready.
- Monitor mobile transitions for the document panel to ensure the tab remains accessible.
