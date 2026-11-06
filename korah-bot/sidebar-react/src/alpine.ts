import { useEffect, useState } from "react";

// Every page keeps its sidebar state on <html x-data>: sidebarCollapsed,
// mobileOpen, activeTab, theme, toggleSidebar(). The topbar toggle and the
// page-specific logic (e.g. closing the study doc panel) live there, so the React
// sidebar reads and writes that object rather than keeping a second copy.

/* eslint-disable @typescript-eslint/no-explicit-any */
type AlpineData = Record<string, any>;

declare global {
  interface Window {
    Alpine?: any;
    KorahSidebar?: { onCollapseChange?: ((collapsed: boolean) => void) | null };
    setKorahTheme?: (theme: string) => void;
    __korahSidebarBase?: string;
  }
}

export interface HostState {
  collapsed: boolean;
  mobileOpen: boolean;
  activeTab: string;
  theme: "dark" | "light";
}

export function readData(): AlpineData | undefined {
  const root = document.documentElement as any;
  if (!window.Alpine || !root._x_dataStack) return undefined;
  return window.Alpine.$data(root);
}

function whenAlpine(callback: () => void): () => void {
  if (readData()) {
    callback();
    return () => {};
  }
  const handler = () => {
    if (readData()) {
      document.removeEventListener("alpine:initialized", handler);
      callback();
    }
  };
  document.addEventListener("alpine:initialized", handler);
  return () => document.removeEventListener("alpine:initialized", handler);
}

function initialState(): HostState {
  let collapsed = false;
  try {
    collapsed = window.innerWidth > 768 && localStorage.getItem("korah_sidebar_collapsed") === "true";
  } catch {}
  return {
    collapsed,
    mobileOpen: false,
    activeTab: "sat",
    theme: document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark",
  };
}

export function useHostState(): HostState {
  const [state, setState] = useState<HostState>(initialState);

  useEffect(() => {
    let release: (() => void) | undefined;
    const stopWaiting = whenAlpine(() => {
      const data = readData()!;
      const runner = window.Alpine.effect(() => {
        const raw = data.getEffectiveTheme ? data.getEffectiveTheme() : data.theme;
        const theme = raw === "light" ? "light" : "dark";
        const collapsed = !!data.sidebarCollapsed;
        setState({
          collapsed,
          mobileOpen: !!data.mobileOpen,
          activeTab: typeof data.activeTab === "string" ? data.activeTab : "sat",
          theme,
        });
        window.KorahSidebar?.onCollapseChange?.(collapsed);
      });
      release = () => window.Alpine.release?.(runner);
    });
    return () => {
      stopWaiting();
      release?.();
    };
  }, []);

  return state;
}

export function setDesktopOpen(open: boolean) {
  const data = readData();
  if (!data) return;
  const collapsed = !open;
  if (!!data.sidebarCollapsed === collapsed) return;
  // The page's own toggle also handles side effects (study doc panel, storage).
  if (typeof data.toggleSidebar === "function") data.toggleSidebar();
  else {
    data.sidebarCollapsed = collapsed;
    try {
      localStorage.setItem("korah_sidebar_collapsed", String(collapsed));
    } catch {}
  }
}

export function setMobileOpen(open: boolean) {
  const data = readData();
  if (data) data.mobileOpen = open;
}

export function toggleTheme(current: "dark" | "light") {
  const next = current === "dark" ? "light" : "dark";
  if (window.setKorahTheme) {
    window.setKorahTheme(next);
    return;
  }
  try {
    localStorage.setItem("korah_theme", next);
  } catch {}
  const data = readData();
  if (data) data.theme = next;
  else document.documentElement.setAttribute("data-theme", next);
}
