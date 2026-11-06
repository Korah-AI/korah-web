import { useLayoutEffect, useRef } from "react";

// study/js/sidebar.js owns the DOM of the chat list and the
// settings/logout buttons: it looks them up by id, fills them and attaches
// listeners. React must therefore never create or re-create them. They are built
// once, live in a hidden holder inside the document (so getElementById always
// finds them, even before React has rendered), and <Adopt> moves them into the
// tree. The sidebar remounts its children when the viewport crosses the mobile
// breakpoint, and moving the same nodes keeps their contents and listeners.

const holder = document.createElement("div");
holder.id = "ksb-holder";
holder.hidden = true;
document.body.appendChild(holder);

function make(html: string): HTMLElement {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  const node = template.content.firstElementChild as HTMLElement;
  holder.appendChild(node);
  return node;
}

const tick = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
const cross = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;

export const historyNode = make(`
<div class="ksb-history">
  <div class="select-bar-wrapper">
    <div id="chat-select-bar" class="select-bar">
      <span class="select-bar-count" id="chat-select-count">0 selected</span>
      <div class="select-bar-actions">
        <button class="select-bar-btn" id="chat-select-all" title="Select all">${tick}</button>
        <button class="select-bar-btn" id="chat-deselect-all" title="Deselect all">${cross}</button>
        <button class="select-bar-btn danger" id="chat-delete-selected" title="Delete selected"></button>
      </div>
    </div>
  </div>
  <div id="chat-history" class="chat-history">
    <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
    <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
    <div class="skeleton-item"><div class="skeleton-icon"></div><div class="skeleton-text"></div></div>
  </div>
</div>`);

// Removed: mood indicator ("Full Focus Mode"). initMoodWidget in study/js/sidebar.js
// returns early when #sidebar-mood is absent.
// export const moodNode = make(`
// <div class="mood-indicator" id="sidebar-mood">
//   <span class="mood-dot" id="mood-dot"><span class="material-icons-round" style="font-size: 0.75rem; color: var(--grn);" aria-label="online">circle</span></span>
//   <span class="text-xs tx2 font-medium">Full Focus Mode</span>
// </div>`);

export const logoutNode = make(`
<button id="logout-btn" class="ksb-icon-btn" title="Log out" aria-label="Log out">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
</button>`);

export const settingsNode = make(`
<button id="settings-btn" class="ksb-icon-btn" title="Settings" aria-label="Settings">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
</button>`);

export function Adopt({ node, className }: { node: HTMLElement; className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = host.current;
    if (!el) return;
    el.appendChild(node);
    return () => {
      holder.appendChild(node);
    };
  }, [node]);
  return <div ref={host} className={className} />;
}
