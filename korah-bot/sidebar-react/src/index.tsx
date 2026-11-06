import { useEffect } from "react";
import { createRoot } from "react-dom/client";
import { KorahSidebar } from "./KorahSidebar";

function App({ base }: { base: string }) {
  // study/js/sidebar.js waits on this before it fills #chat-history. The
  // persistent nodes it looks up are in the document already; this only says
  // that #sidebar-root now has children.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("korahSidebarReady"));
  }, []);
  return <KorahSidebar base={base} />;
}

const mount = document.getElementById("sidebar-root");
if (mount) {
  createRoot(mount).render(<App base={window.__korahSidebarBase ?? ""} />);
}
